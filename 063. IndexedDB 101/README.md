# IndexedDB 101

Web 开发中我们常常用到 cookie，session，redux 等技术存储状态和信息；但是这些技术总体来说容量都比较小。不知道大家有没有想过在客户端存储几个 G 大小的数据呢？虽然这么干听着有点缺德，但是 Web 标准里还真有这么一项技术——IndexedDB，浏览器端的数据库。

## 概述

通俗来说，IndexedDB 就是浏览器提供的本地存储技术，类似于早年间的 Web Sql（已弃用），主要通过网页脚本创建和操作数据库。我们可以通过`F12`打开 Chrome DevTool，并在`Application`-`IndexedDB`下查看数据：

![Chrome DevTool][1]

IndexedDB 有如下几个特性：

- NoSql： 键值对存储，*理论上*所有类型都可以直接存入，包括并不限于 ArrayBuffer 和 Blob 等二进制数据
- 存储空间极大：理论上是客户硬盘的大小，相比之下 cookie 一般为 4K，LocalStorage 和 sessionStorage 也就几个兆
- 异步 API：操作都是异步 API，不会阻塞页面；于此形成对比的是 LocalStorage
- 支持事务：支持 transaction，写入失败，直接回滚
- 支持 migration：有版本标记，可以升级到最新版本
- 支持离线操作：IndexedDB 可以和 Web Worker 结合使用，常用在 PWA 离线技术上

IndexedDB 的结构大致如下：

![structure][2]

- 浏览器为每个域下都保留了一个独立的 IndexedDB——跨域不可访问
- 每个 IndexedDB 下又能创建多个 Database（类似于 RDBMS 下的 schema）
- 每个 DataBase 又由多张 Object Store——RDBMS 下的 table——组成

## 操作流程

IndexedDB 的概念比较多，很难一文写完；作为 101 系列文章，本文只以 `User {id: number; name: string;}` 的增删改查为例，快速浏览一下 IndexedDB 的操作流程。

### Open 操作

```typescript
const [databaseName, version] = ["UserDB", 1];
const request: IDBOpenDBRequest = window.indexedDB.open(databaseName, version);
```

打开 IndexedDB 需要传入两个参数：

- databaseName：顾名思义，DB 名字
- version：版本号，同一时刻只能有一个版本的 Database 存在，如果要修改数据库结构，需要先执行 migration

成功打开后，返回一个 `IDBOpenDBRequest` 类型的请求，通过监听 `onerror`、`onsuccess`、`onupgradeneeded` 三个事件处理该数据库的所有操作。

- onerror：数据库打开失败

  ```javascript
  request.onerror = function (event) {
    console.log("Fail to open");
  };
  ```

- onsuccess：成功打开数据库时触发的事件

  可通过 request 拿到数据库对象

  ```javascript
  let db: IDBDatabase;

  request.onsuccess = function (event) {
    db = request.result;
    console.log("Open successfully");
  };
  ```

- onupgradeneeded

  如果指定版本号大于当前数据库版本号，触发该事件；并通过 `event.target.result` 拿到新的数据库实例

  ```Typescript
  let db: IDBDatabase;

  request.onupgradeneeded = function (event) {
    db = event.target.result;
  }
  ```

### 新建对象仓库

open 成功后，如果指定的数据库不存在，就会新建该数据库；此时数据库版本从无到有，所以会触发 `onupgradeneeded` 事件。

通常，我们在新建数据库的同时就会新建表，IndexedDB 里叫对象仓库——**Object Store**：

```Typescript
let db: IDBDatabase;
let store: IDBObjectStore;

request.onupgradeneeded = function (event) {
  db = event.target.result;

  // Create the UserDetails object store with auto-increment id
  store = db.createObjectStore('UserDetails', {
    autoIncrement: true
  });
}
```

`createObjectStore` 的第一个参数是表名；第二个参数是主键相关选项：简单起见我们只须配成主键自增——`{autoIncrement: true}`，当然也可以自定义主键（如，`{keyPath: 'id'}`）。

### 写操作（insert、update、delete）

insert 操作就是向 Object Store 里写入数据；update 就是覆盖之前的某个数据项。这与绝大多数 NoSql 数据库一致，所以我把他俩放在同一个函数里了。这里再强调一下，IndexedDB 有事务机制，每个读写操作都要调用 transaction 方法：

```Typescript
function insertOrUpdateUser(db, user: User) {
    // Create a new transaction
    const txn: IDBTransaction  = db.transaction(['UserDetails'], 'readwrite');

    // Get the UserDetails object store
    const store: IDBObjectStore = txn.objectStore('UserDetails');
    // Insert a new record
    let query: IDBRequest = store.put(user);

    // Handle the success case
    query.onsuccess = function (event) {
        console.log(event);
    };

    // Handle the error case
    query.onerror = function (event) {
        console.log(event.target.errorCode);
    }

    // Close the database once the transaction completes
    txn.oncomplete = function () {
        db.close();
    };
}
```

如上代码所示，insert 或 update 主要有四个步骤：

1. 创建事务：transaction 函数的第一个参数是事件涉及的表名，可以有多个，所以是 array 类型；第二个参数就是读写模式，有`readonly`、`readwrite`、`readwriteflush`等等
2. 获得操作的数据表：指定 Object Store 名即可
3. 插入数据：由于是异步操作，`onsuccess` 和 `onerror` 用于监听操作成功与否
4. 事件完成，关闭 DB

再提一下删除：delete 操作主要也是上面四步走，不同之处仅仅是把 `store.put` 方法换成 `store.delete`，所以这里就不展开了。

### 读数据

IndexedDB 中的读操作主要通过主键（id）拿到整个 value 值，操作上也是基于 transaction：

```javascript
function read(id: number) {
  const query: IDBRequest = db
    .transaction(["UserDetails"], "readwrite")
    .objectStore("UserDetails")
    .get(id);

  query.onerror = function (event) {
    console.log(event.target.errorCode);
  };

  query.onsuccess = function (event) {
    console.log(query.result);
  };
}
```

此外，我们还可以为数据仓库中的其他属性添加索引——甚至是二级属性，只需要在建表的时候创建索引即可：

```Typescript
request.onupgradeneeded = function (event) {
  db = event.target.result;

  store = db.createObjectStore('UserDetails', {
    autoIncrement: true
  });

  store.createIndex('name', 'name', {unique: false});
}
```

使用时，在调用函数里多一步指定索引即可：

```Typescript
db.transaction(['UserDetails'], 'readwrite')
  .objectStore('UserDetails')
  .index('name')
  .get(id);
```

## 限制和缺点

IndexedDB 相比于 cookie、Web Storage、Web Sql 等等技术，还算是比较新的。我们先看一下浏览器兼容状况——以 usage > 1%为参照：

![Can I use?][3]

- IE11 只支持部分功能，opera Mini 甚至一点也不支持
- Firefox 和 Edge 在隐私模式下事实上也不支持 IndexedDB

此外，IndexedDB 还有一些比较明显的缺陷：

- 写入可能失败，除了上述浏览器适配问题，用户硬盘空间不足也可能导致写入错误
- 数据可能会过期，所以要想好同步和升级策略
- 数据也有可能被用户手动修改，相比于服务器端的 DB，客户端 DB 需要更好的容错性
- 数据安全问题，最好不要存储用户敏感的数据
- IndexedDB 的 API 虽然都是异步操作，但是存储大型对象时还是会阻塞主线程，可能会导致页面奔溃或是无响应

## 小结

使用 IndexedDB 自然好处多多：可以减少数据重复访问的时间；也能通过延时加载，提升用户体验。按时客户端存储也不可避免地涉及许多不可控的因素，遇到问题了也很难解决。我用过一段时间的 IndexedDB，也用过它的某个封装库——[pouchDB][4]，整体感受确实是“不好用”：主要原因还是数据同步太麻烦，在我所使用的场景里 IndexedDB 相比 vuex 或是 graphql 并没有太大的优势。

以下列了几点建议，大家可以在选择 IndexedDB 前评判一下，如果绝大多数都是“否”的话，还是想想别的方案吧。

- 是否需要支持 IE 和隐私模式？
- 存储的数据结构是否足够复杂？
- 是否需要在客户端存储大量数据？
- 是否需要定位或是搜索这些数据？
- 是否需要非阻塞地读写客户端数据？
- 是否需要离线访问？

[1]: ./img/devtool.png
[2]: ./img/db.png
[3]: ./img/browser.png
[4]: https://github.com/pouchdb/pouchdb
