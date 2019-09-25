# vuex-orm 101

## 前情提要

前端开发中会难免会遇到复杂表单提交的情况，我自己也实现过一个非常非常巨大的表单，是关于个人信息录入的。数据结构大体如下；

```javascript
{
    basic: {
      name: { familyName, givenName},
      birthday: new Date(),
      sex: '', //28 different types
      phone: [],
      address: [/*{nation, zip, prefecture, line1, line2,... }*/ ],
      additionItems: [],
    },
    education: [/*{category, school, degree, department, major ...} */],
    ...
}
```

我当时的实现是把各级表单项动态存入 vuex 里，点击提交后一并发给后端。但这里的问题是，我需要写很多很多的 action 和 mutation 方法；如果是`education`这样的数组结构的话，还需要动态支持增删改操作；数据结构的维护变得及其麻烦，此外还得注意类型检查。头痛一番后，业务是跑起来了，但是代码一直很脆，bug 不断。这时候就特别怀念数据库了，假如能有表单结构来管理这类数据就好了。

## [vuex-orm][1]

最近我在 github 上看到了一个叫[vuex-orm][1]的项目，star 超过 700，顿生敬意。它是 vuex 的一款插件，顾名思义，实现了 Vuex Store 的对象关系映射。我这里就稍事介绍一下用法：

### 创建 Model

ORM 需要先定义对象的数据结构（schema），vuex-orm 的实现方式是继承它的 Model 类：

```javascript
// @/model/User.js
import { Model } from '@vuex-orm/core'

export default class User extends Model {
  // This is the name used as module name of the Vuex Store.
  static entity = 'users'

  // list all the fields (schema)
  static fields () {
    return {
      id: this.increment(), //  id increases automatically
      name: this.string(''),  // define as a string and the defualt value is ''
    }
  }
}
```

### 插件安装

接着是给 vuex 安装插件。如下所示，我们先在 vuex-orm 的 database 里注册自定义的 model，然后把它安装到 Vuex store 里。

```javascript
// store.js
import Vue from 'vue'
import Vuex from 'vuex'
import VuexORM from '@vuex-orm/core'
import User from '@/model/User'

Vue.use(Vuex)

// Create a new database instance.
const database = new VuexORM.Database()

// Register Models to the database.
database.register(User)

// Create Vuex Store and register database through Vuex ORM.
const store = new Vuex.Store({
  plugins: [VuexORM.install(database)]
})

export default store
```

### Model in VUE

这时候就可以在 vue 里自在地使用 model 了，

```html
// user.vue
<script>
import UserModel from '@/model/User'

export default {
  ...
  created () {
    const data = [{name: 'Onion'}, {name: 'Garlic'}]
    UserModel.create({data})
    // this.$store.dispatch('entities/users/create', {data} )
  },
}
</script>
```

用 vue devtool 查看一下 state，结构如下：

```javascript
{
    entities: { 
        $name: 'entities',
        users: { 
            $connection: 'entities',
            $name: 'users',
            data: { 
                1: { 
                    $id: 1,
                    id: 1,
                    name: 'Onion'
                },
                2: { 
                    $id: 2,
                    id: 2,
                    name: 'Garlic'
                }
            }
        }
    }
}
```

嗯，数据成功写入，user 的 id 自增从 1 开始。事实上`UserModel.create({data})`只是封装了`this.$store.dispatch('entities/users/create', {data} )`方法。Vuex-orm 加载后会帮你创建一系列的`getters`和`mutations`方法，它们分别映射了`Model`的增删改查。如果不想`import UserModel`，你也可以直接使用相应的`this.$store.dispatch`实现数据读写。

### CRUD

再列几个读写方法

* create

    ```javascript
    UserModel.insert({data: {name: 'Ginger'} })
    ```

* update

    ```javascript
    UserModel.update({
        where: 2,
        name: 'Ginger',
    })
    ```

* delete
    
    delete 可以直接删除 id 指向的对象，也可以使用 where 语句。
    
    ```javascript
    UserModel.delete(1)

    UserModel.delete({
        where: (obj) => obj.id === 1 
    })
    ```

* retrive data
    
    读取数据可以用`all`、`find`、`query`等方法，`query`甚至可以添加`where`、`orderBy`、`limit`等语句。

    ```javascript
    const user = UserModel.query().where('name', 'Onion').get()
    ```

### 关系映射

vuex-orm 还实现了一套主外键的关系映射，有`One To One`、 `One to Many`、`Many to Many`等八九种关联。写一个简单的例子：

```javascript
class Todo extends Model {
  static entity = 'todos'

  static fields () {
    return {
      id: this.increment(),
      user_id: this.number(0),
      title: this.string(''),
      done: this.boolean(false),
    }
  }
}

class User extends Model {
  static entity = 'users'

  static fields () {
    return {
      id: this.increment(),
      name: this.string(''),
      todos: this.hasMany(Todo, 'user_id')
    }
  }
}
```

如上所示，我们将 User 与 Todo 一起关联，`hasMany`表示一对多的关系，`user_id`为外键。创建一个 todo 如下，`user_id`是 1，就是 Onion 这个人。

```javascript
TodoModel.insert({
    data: {
      title: 'Hello',
      user_id: 1,
    }})
```
再看一下 state

```javascript
users: { 
    $connection: 'entities',
    $name: 'users',
    data: { 
        1: { 
            $id: 1,
            id: 1,
            name: 'Onion',
            todos: [
                1: {
                    $id: 1,
                    id: 1,
                    title: 'Hello',
                    user_id: 1,
                    done: false,
                }
            ]
        },
        ...
    }
}
```
嗯，成功加到 user 的 todos 数组里了。

## 小结

除了上面一些基本功能外，vuex-orm 还有其他一些高级用法，这里就不一一介绍了，大家有兴趣的话可以去[官方 wiki][2]查看。

自从前端渲染框架和 flux 设计模式流行后，现代 web 开发把主要的业务实现放在了前端。后端愈发轻领域设计，更像是一个单纯的数据读写接口；rest 设计也变得大颗粒化。新工具的不断跟进在这里起到了关键性的作用。

Vuex-orm 也来自于 Redux 相关插件的设计理念。以前我还断言 Graphql 出现后 Redux 之类的 state 管理工具会开始式微，现在想想还是自己太狭隘了。无知与狭隘共生。

学无止境，互勉。

[1]: https://github.com/vuex-orm/vuex-orm
[2]: https://vuex-orm.github.io/vuex-orm/




