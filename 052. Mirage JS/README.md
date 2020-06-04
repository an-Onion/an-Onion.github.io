# Mirage JS——前端海市蜃楼

这期介绍一款比较别致的 mock 工具，[mirage.js][0]。说它别致，缘由是与竞品有一点点区别：它是在客户端启动的一个 mock 服务，恰如“海市蜃楼”为远程调度展现一幅 api 全景图；实则是一种伪装技术，在应用内存里拦截了所有请求。

![Mirage JS][1.1]

## Mock API

上次有人在评论区问我，`前端开发时怎样避免启动一堆后端服务`。理想状态下（× 3），有 mock 服务就行了——浏览器装个代理插件，将 api 路由到 mock 服务上。Mock 服务器可以是后端仓库里一个伪装服务；也可以是线上的三方产品——比如国产开源的[yapi][3]——直接在线使用。现代开发一般就是前后分离，开发前端页面时很可能后端小伙伴还没开工；mock api 就可以帮你摆脱这类窘境；当然，你习惯于前端 hard code，我无话可说……

OK，答疑结束，回到本期话题。Mirage JS 就是一款 API Mock 工具，比之常规 mock 服务，你不用装代理插件了，因为它与前端代码一起运行。接着看看怎么使用吧。

## Guide

安装就一笔带过了——`yarn add -D miragejs`

然后在前端 src 目录下写一个 server.js 文件，用来定义所有的 mock api。代码如下所示：

```javascript
// server.js
import { Server } from "miragejs";

export function mockServer() {
  return new Server({
    routes() {
      this.namespace = "api";
      this.get('/todos', () => [ "Buy Onion" ]);
    }
  })
}
```

Mock 代码还是挺直白的：在`routes`方法里定义了一个 Get API——`/api/todos`——返回我们所需要的 mock 数组`[ "Buy Onion" ]`。一个最简单的 mock 服务就完工了。我们以 vue 项目为例，在入口文件 main.js 里引入 server.js，并新建这个 mock 服务。

```javascript
import Vue from "vue";
import { mockServer } from "./server";

mockServer();

new Vue({
  render: h => h(App)
}).$mount("#app");
```

和平日里一样，用 webpack 启动 vue 项目，该 mock 服务就跟随整个前端项目启动了，并且共享 webpack 热加载。与传统的本地 mock 服务比起来，你可以少打一行命令，减少了 50%的操作😅。至于前端组件，和往常一样不需要做任何改变：

```html
// Todos.vue
<template>
  <ul>
    <li v-for="todo in todos">
    {{ todo }}
    </li>
  </ul>
</template>

<script>
export default {
  async created() {
    const {data} = await axios.get("/api/todos");
    this.todos = data;
  }
}
</script>
```

看一下效果吧，页面根据 mock api 显示列表，并在修改 mock 数据后，自动热加载更新。

![Mock Todos][1.2]

## More

当然，Mirage 的功能不止如此，它顺便集成了一套简单的前端数据库，实现了常规的增删改查交互操作。

```javascript
export function makeServer() {
  return new Server({
    seeds(server) {
      server.db.loadData({
        todos: [
          { text: "Buy Onion", isDone: false },
          { text: "Buy Garlic", isDone: false }
        ]
      });
    },

    routes() {
      this.namespace = "api";

      this.get("/todos", ({ db }) => {
        return db.todos;
      });

      this.patch("/todos/:id", (schema, request) => {
        let todo = JSON.parse(request.requestBody).data;
        return schema.db.todos.update(todo.id, todo);
      });

      this.post("/todos", (schema, request) => {
        let todo = JSON.parse(request.requestBody).data;
        return schema.db.todos.insert(todo);
      });

      this.delete("/todos/:id", (schema, request) => {
        return schema.db.todos.remove(request.params.id);
      });
    }
  });
}
```

大家可以看下面这个图片，交互数据全部来自 Mirage 的 mock api：

![CRUD][1.3]

实现一套前端 DB 来维护各色 mock  api，在实际开发中还是有一定难度的。只有配合极佳的前后端团队才能做到：

1. 前后端商讨一份接口方案
2. 各自回头开发，开发阶段全程启动 mock 模式
3. 前后端代码合并
4. 生产环境调试——唉，完美无缺！

现实工作中，前端很可能还是会依赖真实的生产数据开发，Mock API 大概率就没人鸟了。不过，测试代码倒是一直需要 Mock 数据。

## Mock 测试

测试环境——尤其在一些沙箱环境里——调用其他服务的 api 一直很不方便的。比如上面的 Todos.vue 组件，加载前需要请求 api；在传统的单元测试环境里，提供这个异步请求就很麻烦了。再看 Mirage，将一个伪装的 api 服务器一起放到沙箱里，就显得异常好用：

```javascript
import { makeServer } from "server.js";
import { mount } from '@vue/test-utils';
import Todos from '@/components/Todos.vue';

let server;

beforeEach(() => {
  server = makeServer({ environment: "test" });
});

it("Show todos from our server", () => {
  server.create("todo", { id: 1, text: "Buy Onion" })

  const wrapper = mount(Todos)
  await waitFor(wrapper, '[data-test-id="1"]')

  expect(wrapper.find('[data-test-id="1"]').text()).toBe("Buy Onion")
});

afterEach(() => {
  server.shutdown();
});
```

引入 Mirage 后，只要记得在测试前后开关 mock 服务即可，其他的代码与常规的 vue 单元测试无异。还有，Mirage 支持增删改查呀！不仅是 unit 测试，甚至可以用在本地的 e2e 测试上：

``` javascript
it("shows the todos from our server", () => {
  server.create("todo", { id: 1, text: "Buy Onion" })

  cy.visit("/");

  cy.get('[data-test-id="1"]')
    .should("eq", "Buy Onion");

  // CRUD operations...
});
```

其他的一些沙箱环境，如 storybook，有时也需要一些 api 交互，代理到 mock 服务器上还是耦合太高了。试试 Mirage， 你就能设计更简洁的 stories 了。

## 小结

这期内容很少，介绍了一款国内还很小众的 mock 工具——mirage.js。也没啥好总结的，开发工具嘛就是用来提高生产效率的，让你编码舒服一点。当然，学习新工具也意味着增加新的认知成本，难点不在工具本身，而在于统一认识上。如果工作只是撞钟或者本人已经“脱产”了，那似乎这类工具也没啥太多必要了。

## 相关

* [《BFF——服务于前端的后端》][2]

[1.1]: ./img/mirage.png
[1.2]: ./img/todos.gif
[1.3]: ./img/crud.gif
[0]: https://github.com/miragejs/miragejs
[2]: https://www.jianshu.com/p/9cca72f9e93c
[3]: https://github.com/YMFE/yapi
