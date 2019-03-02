# Graphql前端状态管理

## Graphql & Apollo

下图是2018年前端data layer工具的趋势图。我曾经在[某一期][3]博客提到过这张图，当时只注意了第二名的Graphql。后来发现排名第三的Apollo其实也是Graphql系列的工具，全名是[apollo link state][2]。

![Graphql & Apollo][1]

Apollo也是使用Graphql语法管理数据，稍显不同的是它并不与后端通信，是纯粹的浏览器Local Data管理工具。Graphql在今年实现了前后端一统。

本期默认大家已经有了一定的vue和graphql背景知识，作为延伸学习，简单介绍一下Graphql在前端操作state management的一些方法。

## vue-apollo

VUE主要通过[vue-apollo][4]集成Graphql Client框架。用法很简单，普通的插件集成。配一下默认的link和cache就可以连接后台graphql server了。（Apollo需要在link里加stateLink，后面再谈。）

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

添加Apollo Provider后，我们不再需要通过mounted/created发起请求，一切数据处理委托给Graphql，通过apollo provider即可直接绑定客户端**graphql cache**的数据。从某种意义上来说，graphq cache可被视为一层data layer来管理SPA的全局state。因此Graphql推出不久，影响最大的不是后端的rest api，反倒是前端的Redux。

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

Memory Cache是Graphql存储数据的平台。如下所示，前端与后端交互后，Graphql客户端会在浏览器Cache里驻留response数据，然后通过这些全局缓存来管理状态。前端的graphql query默认的fetchPolicy是`cache-first`（顾名思义优先使用缓存，未命中则向后端请求数据，更新缓存后再渲染UI），除此之外还可以定制`cache-and-network`、`cache-only`、`network-only`等策略。

![Store data in Graphql cache][6]

这里提一下，Memory Cache是通过key-value表单形式存储***每一个***对象。即便是数组内的对象也会被规格化存储。默认的primary key是`id`（或`_id`）和 `__typename`的组合键。当然也可以[自定义主键][7]。


![state update][8]
如上图所示，点击`UPDATE`按钮后，触发的是某个对象的`mutation`操作，并未再次`query` State数组；但是`mutation`请求返回后更新了`<id, __typename>`主键对应的某块缓存，state数组也随之更新。

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

今年下半年的时候Apollo大版本更新了graphql client，推出了apollo link state，我当时没及时更近后来还折腾了一番。

![apollo client 2.0][10]

Apollo Client开始支持Rest api和local state的数据管理。Apollo通过新的directive（@rest、@client）指向不同的数据。如下是一个拼接了Graphql、rest和local state的查询。

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
Apollo遵循的还是Graphql的实现方式，只是把resolver放在了前端；通过直接读写cache里的数据更新state。这下就真没Redux什么事了。

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

以上是这段时间我自己学习Apollo Graphql的一些总结。虽然接触不深，但还是可以感觉到Graphql带来的便捷。Apollo甚至给出了一套完整的前后端数据管理方案，初学者在前后端的学习成本变得更低了。相信2019年Graphql还会是前端开发的潮流，这种趋势已经不是rest、redux可阻挡的存在了。希望身边有更多小伙伴来和我一起学习，一起体验这种新的变化。

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