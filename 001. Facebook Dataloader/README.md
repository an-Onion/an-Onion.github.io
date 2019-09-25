# Facebook DataLoader

## 简介
[DataLoader][1] 是 facebook 推出的一款通用工具，可为传统应用层与持久层之间提供一款*缓存*和*批处理*的操作。JS、Java、Ruby、Go 等主流语言都有开源三方库支持。尤其在 Graphql 兴起后，DataLoader 被广泛地应用于解决[N+1 查询问题][4]。

## 机制

DataLoader 的实现原理很简单：就是把每一次 load 推迟到 nextTick 中集中处理。在现实开发中其主要有两点应用：

1. 批处理操作

![batch.png](https://upload-images.jianshu.io/upload_images/14368237-d03bb068dbcbbd45.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


2. 内存级别的缓存

![cache.png](https://upload-images.jianshu.io/upload_images/14368237-bafd911d940eee62.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


## 案例

以下以 nodejs 中调用[dynamoose][2] api 为例具体介绍一下 DataLoader 在 dynamodb 查询时的一些使用方法。

#### 批处理 (Batching)

先看一下传统 DAO 设计实现中的模版方法。我们通过 name 来获取 user 的信息。

```typescript
// #UserDao.ts

import {ModelConstructor} from 'dynamoose';
import {DataSchema, userModel} from './User.schema'; 

export default class UserDao {

  private readonly model: ModelConstructor<DataSchema, string>;

  constructor() {
    this.model = userModel; //Dynamoose user schema model
  }

  public getUser(name: string) {
    console.log('Get user:', name);
    return this.model.get(name);
  }
}
```

当我们调用 getUser 方法时：

```typescript
import UserDao from './UserDao';

async function run(user) {
  const users = await Promise.all([
    user.getUser('Garlic'),
    user.getUser('Onion'),
    ]);

  console.log('return:', users);
}

run(new UserDao());
```

打印结果是：
```plain
Get user: Garlic
Get user: Onion
return: [ Model-user { name: 'Garlic' }, Model-user { name: 'Onion' } ]
```
显然，dynamodb 被访问了两次。再看一下使用 DataLoader 后的情况。

```typescript
// #UserLoader.ts

import Dataloader = require('dataloader');
import {DataSchema, userModel} from './User.schema';

const BatchLoadFn = (names: [string]) => {
  console.log('Get Keys:', names);
  return userModel.batchGet(names);
};

export default class UserLoader {

  private readonly loader: Dataloader<string, DataSchema>;

  constructor() {
    this.loader = new Dataloader<string, DataSchema>(BatchLoadFn);
  }

  public getUser(name: string) {
    return this.loader.load(name);
  }
}

```

DataLoader 初始化时必须传入一个 BatchLoadFn，在 dataloader/index.d.ts 里找到如下定义：
```typescript
type BatchLoadFn<K, V> = (keys: K[]) => Promise<Array<V | Error>>;
```
BatchLoadFn 的参数是数组且返回是个包在 Promise 里的数组。因此可以直接调用 dynamoose 的 batchGet 方法。


再次调用上述的 run 方法

```typescript
async function run(user) {
  const users = await Promise.all([
    user.getUser('Garlic'),
    user.getUser('Onion'),
    ]);

  console.log('return:', users);
}

run(new UserLoader());
```
看一下输出结果：

```plain
Get Keys: [ 'Garlic', 'Onion' ]
return: [ Model-user { name: 'Garlic' }, Model-user { name: 'Onion' } ]
```

返回一样，但是两次 get 方法被合并成了一次 batchGet 了。

不过，在使用 dynamoose 的 batchGet 的时候，会出现一些奇妙的 bug；稍微改动一下 getUser 的顺序，把`Garlic`和`Onion`换一下。

```typescript
async function run(user) {
  const users = await Promise.all([
    user.getUser('Onion'),
    user.getUser('Garlic'),
    ]);

  console.log('return:', users);
}
```
返回变成了：
```plain
# run(new UserDao());
Get user: Onion
Get user: Garlic
return: [ Model-user { name: 'Onion' }, Model-user { name: 'Garlic' } ]

---

# run(new UserLoader());
Get Keys: [ 'Onion', 'Garlic' ]
return: [ Model-user { name: 'Garlic' }, Model-user { name: 'Onion' } ]
```

userLoader 返回的内容错了，先返回了`Garlic`，后返回`Onion`。这个是很多 NoSql 数据库搜索算法共通的问题。

改动一下`BatchLoadFn`，将`batchGet`的返回结果按 name 排序。

```typescript
const BatchLoadFn: any = (names: [string]) => {
  console.log('Get Keys:', names);
  return userModel.batchGet(names)
    .then((users) => {

      const usersByKey: object = users.reduce(
        (acc, user) => Object.assign(acc, {[user.name]: user}), {});

      return names.map((name) => usersByKey[name]);
    });
};
```
OK，这下输出正常了。
```plain
Get Keys: [ 'Onion', 'Garlic' ]
return: [ Model-user { name: 'Onion' }, Model-user { name: 'Garlic' } ]
```

#### 缓存


```typescript
async function run(user) {
  const users = await Promise.all([
    user.getUser('Onion'),
    user.getUser('Onion'),
    ]);

  console.log('return:', users);
}
```
设想一下，如果两次 getUser 都是`Onoin`会怎么样？

```plain
Get Keys: [ 'Onion' ]
return: [ Model-user { name: 'Onion' }, Model-user { name: 'Onion' } ]
```

结果是一次 getUser 后，DataLoader 会把数据缓存到内存里，下一次 get 相同的 User 时，就不会再调用 BatchLoadFn 了。事实上，DataLoader 缓存的是 Promise。如下：
```typescript
assert(user.getUser('Onion') === user.getUser('Onion')) // true
```

Dataloader 在默认机制下是启动 cache 的，也可以选择关闭 cache。
```typescript
new Dataloader<KeySchema, DataSchema>(BatchLoadFn, {cache: false});
//duplicated keys in batchGet may occur error.
```

在出错或是更新时也可调用`clear`方法清除 cache。
```typescript
public getUser(name: string) {
  return this.loader.load(name)
    .catch((e) => {
      this.loader.clear(name);
      return e;
    });
}
```
此外，在初始化 Dataloader 时可以自定义 cache 策略：`new DataLoader(batchLoadFn [, options])`

| Option Key | Type | Default | Description |
| ---------- | ---- | ------- | ----------- |
| *cache* | Boolean | `true` | 设置为`false`则停用 cache| 
| *cacheKeyFn* | Function | `key => key` | cacheKeyFn 返回只能是 string 或 number， 如 key 为 object，可设为`key => JSON.stringify(key)` |
| *cacheMap* | Object | `new Map()` | 自定义 cache 算法， 如[DataloaderCacheLru][3]|

## API

DataLoader 并不是一个超级工具，代码也只有 300 多行，而且相当部分是注释。它只提供了 5 个 API，基本只能完成`loadByKey`相关的操作。

1. load(key: K): Promise<V>;

2. loadMany(keys: K[]): Promise<V[]>;

3. clear(key: K): DataLoader<K, V>;

4. clearAll(): DataLoader<K, V>;

5. prime(key: K, value: V): DataLoader<K, V>;

## Graphql

DataLoader 被广泛应用于 Graphql 的 resolver 中，
```plain
# Define in graphql type def
type User {
  name: String
  friends: [User]
}

# Query in front-end
{
  user(name: "Onion") {
    name
    friends {
      name
      friends {
        name
      }
    }
  }
}
```

```typescript
# user.resolver.ts
Query: {
  user: (root, {name}) => {
    return userDao.getUser(name);
  }
}
User: {
  friends: (root) => {
    return Promise.all( root.friends.map( (name) => userDao.getUser(name) ) );
  }
}
```
*Onion*朋友的朋友中必然有*Onion*自己。Graphql 支持嵌套查询，假如直接调用传统 UserDao 的 getUser 方法, 数据库查询单个`Onion`的次数将会是 1+len(friends)。

若将上述代码中的 userDao 换成 userLoader，`Onion`的数据库访问就只有一次了。这就解决了 N+1 查询的问题。

```typescript
Query: {
  user: (root, {name}) => {
    return userLoader.getUser(name);
  }
}
User: {
  friends: (root) => {
    return Promise.all( root.friends.map( (name) => userLoader.getUser(name) ) );
  }
}
```

## 小结

今天大体介绍了一下 DataLoader 的机制和使用方法。在现实开发中我们可以将 dataloader 专门作为一层架构，对应用层做 cache，对数据层做 batch。甚至有项目将 DataLoader 与 redis 集成（[redis-dataloader][5]）。
我参与的其中一个项目在使用 DataLoader 优化 Graphql 查询后，DB 访问数减少了 3/4。尤其是用到 DynamoDB 这类按查询收费的服务时，DataLoader 不仅可以加速前端访问速度，还可以极大地减少后端运维成本。


[1]: https://github.com/facebook/DataLoader
[2]: https://github.com/dynamoosejs/dynamoose
[3]: https://github.com/eddyystop/dataloader-cache-lru
[4]: https://stackoverflow.com/questions/97197/what-is-the-n1-select-query-issue
[5]: https://github.com/DubFriend/redis-dataloader
