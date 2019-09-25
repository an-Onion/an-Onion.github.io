# Graphql 前端状态管理

## Graphql & Apollo

下图是 2018 年前端 data layer 工具的趋势图。我曾经在[某一期][3]博客提到过这张图，当时只注意了第二名的 Graphql。后来发现排名第三的 Apollo 其实也是 Graphql 系列的工具，全名是[apollo link state][2]。

![Graphql & Apollo][1]

Apollo 也是使用 Graphql 语法管理数据，稍显不同的是它并不与后端通信，是纯粹的浏览器 Local Data 管理工具。Graphql 在今年实现了前后端一统。

本期默认大家已经有了一定的 vue 和 graphql 背景知识，作为延伸学习，简单介绍一下 Graphql 在前端操作 state management 的一些方法。

## vue-apollo

VUE 主要通过[vue-apollo][4]集成 Graphql Client 框架。用法很简单，普通的插件集成。配一下默认的 link 和 cache 就可以连接后台 graphql server 了。（Apollo 需要在 link 里加 stateLink，后面再谈。）

![vue-apollo-graphql][5]

```javascript
Vue.use(VueApollo);

const httpLink = new HttpLink( {uri: '/graphql'} );
const cache = new InMemoryCache();
// Create the apollo client
const apolloProvider = new VueApollo({
  defaultClient: new ApolloClient({link, cache})
});

new Vue({
  ...
  apolloProvider,
  ...
});
```

添加 Apollo Provider 后，我们不再需要通过 mounted/created 发起请求，一切数据处理委托给 Graphql，通过 apollo provider 即可直接绑定客户端**graphql cache**的数据。从某种意义上来说，graphq cache 可被视为一层 data layer 来管理 SPA 的全局 state。因此 Graphql 推出不久，影响最大的不是后端的 rest api，反倒是前端的 Redux。

```vue
// in *.vue
<template>
    <div>Get Todos from server: {{ todos }}</div>
</template>

<script>
export default {
  apollo: {
    todos: gql`{
          todos: getTodos {
            id
            text
          }
        }
    `,
  },
   ...
}
<script>
```

## [Memory Cache][9]

Memory Cache 是 Graphql 存储数据的平台。如下所示，前端与后端交互后，Graphql 客户端会在浏览器 Cache 里驻留 response 数据，然后通过这些全局缓存来管理状态。前端的 graphql query 默认的 fetchPolicy 是`cache-first`（顾名思义优先使用缓存，未命中则向后端请求数据，更新缓存后再渲染 UI），除此之外还可以定制`cache-and-network`、`cache-only`、`network-only`等策略。

![Store data in Graphql cache][6]

这里提一下，Memory Cache 是通过 key-value 表单形式存储***每一个***对象。即便是数组内的对象也会被规格化存储。默认的 primary key 是`id`（或`_id`）和 `__typename`的组合键。当然也可以[自定义主键][7]。


![state update][8]
如上图所示，点击`UPDATE`按钮后，触发的是某个对象的`mutation`操作，并未再次`query` State 数组；但是`mutation`请求返回后更新了`<id, __typename>`主键对应的某块缓存，state 数组也随之更新。

```javascript
update () {
    this.$apollo.mutate({
        mutation: gql`mutation ($id: Int, $text: String!) {
            update(id: $id, text: $text) {
                id
                text
            }
            }`,
        variables: {
            id: 0,
            text: `Updated`,
        },
        });
    }
```

## Apollo

今年下半年的时候 Apollo 大版本更新了 graphql client，推出了 apollo link state，我当时没及时更近后来还折腾了一番。

![apollo client 2.0][10]

Apollo Client 开始支持 Rest api 和 local state 的数据管理。Apollo 通过新的 directive（@rest、@client）指向不同的数据。如下是一个拼接了 Graphql、rest 和 local state 的查询。

```javascript
const getUser = gql`
  query getUser($id: String) {
    user(id: $id) {
      id
      name @rest(route: '/todos/name')
      cart @client
    }
  }
`;
```
Apollo 遵循的还是 Graphql 的实现方式，只是把 resolver 放在了前端；通过直接读写 cache 里的数据更新 state。这下就真没 Redux 什么事了。

```javascript
const stateLink = withClientState({
  cache,
  resolvers: {
    Mutation: {
          addTodo: (_, { id, text }, { cache }) => {
        
          const newTodo = {id, text,  __typename: 'Todo'}
          const {todos} = cache.readQuery({ query });
          todos.push(newTodo)

          const data = { todos };
          cache.writeData({ data });
          return newTodo;
        },
  }
  }
});

const client = new ApolloClient({
  cache,
  link: ApolloLink.from([stateLink, new HttpLink()]),
});
```

## 小结

以上是这段时间我自己学习 Apollo Graphql 的一些总结。虽然接触不深，但还是可以感觉到 Graphql 带来的便捷。Apollo 甚至给出了一套完整的前后端数据管理方案，初学者在前后端的学习成本变得更低了。相信 2019 年 Graphql 还会是前端开发的潮流，这种趋势已经不是 rest、redux 可阻挡的存在了。希望身边有更多小伙伴来和我一起学习，一起体验这种新的变化。

[1]: https://upload-images.jianshu.io/upload_images/14368237-7697862ec03a2350.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[2]: https://www.apollographql.com/docs/link/links/state.html
[3]: https://www.jianshu.com/p/221664ea1367
[4]: https://github.com/Akryum/vue-apollo
[5]: https://upload-images.jianshu.io/upload_images/14368237-c0deb93c8fd529a8.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[6]: https://upload-images.jianshu.io/upload_images/14368237-a0e0f1cd9ed836fe.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[7]: https://www.apollographql.com/docs/react/advanced/caching.html#smooth-scroll-top
[8]: https://upload-images.jianshu.io/upload_images/14368237-df5e9530b368addf.gif?imageMogr2/auto-orient/strip
[9]: https://www.apollographql.com/docs/react/advanced/caching.html
[10]: https://upload-images.jianshu.io/upload_images/14368237-a327e67505e74aee.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240