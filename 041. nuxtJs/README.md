# Nuxt js

最近这一两年，我主要在从事部门周边业务，所以写了许许多多个细碎的 web 应用。最近由于一些人事变动，我又回到了最初的产品线上。时光飞逝，欣赏着自己的遗（la）产（ji）代码，“青骢”岁月浮现眼前。今天借此机会讲讲我第一个 web 项目使用的技术栈——[nuxt][1]，一款`server/client`同构渲染的 vue 框架。

## 安装

当年向领导层推荐 nuxt 的时候，我列了很多理由；虽然有些点比较扯蛋，但最核心的考量是，nuxt 可以帮助我们零基础上手一个完整的 web 应用。我这里先说说如何安装。

nuxt 多年来一直使用的是 npm script 脚手架：操作就这么几步：

1. 在命令行里敲下：`yarn create nuxt-app <my-project>`
2. 按默认选项安装依赖
3. 一句`yarn dev`，开工了！

在 vue-cli 满天飞的今天，npm 脚手架自然算不上什么惊奇的事情了，但在几年前能有做到零基础启动 vue 项目，是很不容易的。我记得那时候市面上的资料还是基于 html 挂载 vue.js——把 vue 当作一个类似于 Jquery 的 lib 使用。作为练习项目而言，以上足够了；但是，放到一个企业级项目里，你要考虑其他很多问题，比如浏览器兼容、开发体验、代码风格……这就意味着你要配齐 vue 全家桶，各色 webpack、eslint、babel 配置，集成三方的 UI 库，布置后端服务等等等等。在一个几乎没有任何现代开发经验的项目组里，该怎么上手？从零开始学会所有配置，或是在 github 的某个角落找到大体接近你需求的 demo，然后开始修改自己也不懂的各色文件？

也许，经历过那段时期的老员工依旧会对 nuxt 抱有微词，毕竟坑是不可抗拒的。但在前端开发方面，nuxt（相比于单纯的 vue 库）还是给我们带来了很多惊喜：它封装了上述所有配置，限制了代码风格和目录结构，提供了一个相对舒适的开发环境，我们因此得以最快的速度投入到了生产实践中。

## 目录结构

大家一起看看作为一个通用框架，nuxt 给我们提供了什么。我最早是 1.4 版本开始的第一个 nuxt 项目，到今天是 2.11 版本，nuxt 的目录结构几乎没有变化：

```plain
├── .nuxt
├── pages
├── components
├── layouts
├── assets
├── static
├── store
├── plugins
├── middleware
├── nuxt.config.js
```

* .nuxt

  nuxt 内置了 webpack，当运行`nuxt build`后，它会将所有相关子目录的文件打包压缩到`.nuxt`目录下，方便进一步的应用部署。

* pages

  页面文件目录——vue 文件夹。该目录下的目录结构和 vue 文件名会在 build 时映射为`vue-router`配置。我们来看看约定的路由规则：

  ```bash
  ├── pages
  │   ├── index.vue
  │   ├── login.vue
  │   └── dashboard
  │     └── about.vue
  ```

  上述目录结构最终会被描述为：`/`、`/login`，以及`/dashboard/about`三个路由。我们也可以设置动态路由；如下所示，该路由将被映射为`/job/:id`，并可以通过`this.$route.params.id`获取路由参数。

  ```bash
  ├── pages
  │   └── job
  │     └── _id.vue
  ```

  此外，各个页面以及后续的引入模块，会以懒加载的形式在路由跳转后`import`；相比于传统的 spa（单页面应用），ssr（服务端渲染）的 nuxt 单次加载的资源更少，这也成为了 nuxt 刚出来时的一个卖点——首页渲染快。

* components

  组件目录，顾名思义，用于放置 vue 的功能组件。注意，该目录下的 vue 文件，不具有 nuxt 增强的生命周期钩子，即它不能使用 asyncData、fetch 这类钩子；这种限制我倒比较支持，组件和数据请求应当尽可能的正交化。

* layouts

  第三个 vue 文件目录，放置 page 布局，通俗来说就是不同页面的通用模版。比如：我们自己写了一个叫`/layouts/trophy.vue`的奖杯布局，

  ```html
  <!-- layouts/trophy.vue -->
  <template>
    <div id="app">
      <header/>
      <main>
        <nuxt />
      </main>
      </rooter>
    </div>
  </template>
  ```

  pages 目录下的页面通过 layout 字段指定该类型模版，之后 page 内容会填充到`<nuxt />`标签里。

  ```html
  <!-- pages/index.vue -->
  <script>
  export default {
    layout: "trophy"
  };
  </script>
  ```

* asserts 和 static

  asserts 和 static 就是所谓的资源目录，存放 css、less、图片等文件。Nuxt 集成了 css-loader、file-loader、url-loader 等 webpack 加载器，当你把这些文件放在 asserts 目录之下时，nuxt 内置的 webpack 会针对特定文件选择特定加载器，打包、压缩、拷贝到.nuxt 相应路径之下；而相对较大的资源文件，则可以放在 static 之下，webpack 将直接拷贝到.nuxt 之下

* store

  store 对应的就是 vuex 状态树文件。nuxt 自带 vue 全家桶，自然也包含了 vuex。store 里的 js 文件最终会被 nuxt 构件为 vuex 相关功能配置。

* plugins & middlewar

  插件和中间件，用于定制化拓展。比如使用 vuetify，element 这类 ui 库，我们就可以将相关配置放置在 plugins 里。又比如，你想对所有请求加权限控制，可以将配置放在 middlewar 里；所有资源的请求将先经过这里的中间件，并做相应的错误处理。

* nuxt.config.js

  nuxt 框架本身的配置文件，可以定制框架功能。最常用的修改就是在这里调整默认的 webpack 配置了，而且最近几版新添的配置项，主要方向也是在暴露内置 webpack 的 api。

nuxt 目录结构的定型，稍早于 vue-cli 推荐结构的普及；目录结构看似合理，但是与主流风格稍有不同，还是略显美中不足的。在项目开始前，最好先确定这类代码规范；这样，当切换项目、新手入门，或是多团队合作时，能尽可能得减少“解码成本”——理解项目逻辑所需的成本。我参与的项目由于历史惯性，之后都沿用了 nuxt 风格。

## 生命周期

上面提到过 nuxt 框架对 vue 生命周期的增强。我们刨去 vue 自带的生命周期（简化为 Render），看看增强部分。

![Nuxt Lifecycle][0]

* nuxtServerInit

  nuxtServerInit 只在首次请求到来时（第一次导航到站点，或是刷新页面时），在 server 端调用，与 client 端无关。设计的目的就是在 server 端异步请求数据，并初始化全局 vuex 状态树。

* middleware

  第二步是请求通过各类中间件。上面提到过，我们会在 middlewar 目录下放置各类中间件作为请求的过滤器。中间件包括 nuxt.config.js 配置的全局中间件，和 layout、page 里指定的组件级中间件两种。

  ```javascript
  // middleware/authenticated.js
  export default function ({ store, redirect }) {
    if (!store.state.authenticated) {
      return redirect('/login')
    }
  }
  ```

  ```html
  <!-- /pages/index.vue -->
  <script>
  export default {
    middleware: 'authenticated'
  }
  </script>
  ```
* validate

  validate 是 page 里的钩子方法，作用于动态路由对映的页面组件中。目的是配置一个校验方法，动态检验路由参数的有效性。

  ```html
  <!-- /pages/job/_id.vue -->
  <script>
  export default {
      validate({ params, query, store }) {
        return true // if the params are valid
        return false // will stop Nuxt.js to render the route and display the error page
    }
  }
  </script>
  ```

* asyncData / fetch

  再之后是两种异步数据请求的钩子。`asyncData`用于异步取数，并初始化`data`（增强 vue 生命周期里的`data`）。`fetch`也是异步取数，但不返回数据，一般用作初始化局部使用的 vuex 状态数——可以与 nuxtServerInit 比较一下。

  ```html
  <script>
  export default {
    asyncData() {
      return axios.get("/api/data");
    },
    async fetch ({ store, params }) {
      let { stars } = await axios.get('http://api/stars');
      store.commit('setStars', stars);
    },
  };
  </script>
  ```

  asyncData / fetch 触发的时机大家需要注意一下，client 和 server 都有可能触发。在页面初次加载时，由 server 触发数据请求；后续若有路由变化，会是在 client 触发。

nuxt 增强的生命钩子主要就是上面几种，分工很明确。不过由于 SSR 的特性，server 和 client 端都有可能触发这些钩子，所以 debug 的时候，还是很容易搞混的。我这里列一下最常用的钩子触发时机，大家注意一下：

| Hooks       | Server(1st page) | Client(1st page) | Client(next pages) |
| -------------- | :-----: | :------: | :-----: |
| nuxtServerInit | ✔       | ✖       | ✖       |
| middleware     | ✔       | ✖       | ✔       |
| beforeCreate   | ✔       | ✔       | ✔       |
| asyncData/fetch| ✔       | ✖       | ✔       |
| Created        | ✔       | ✔       | ✔       |
| mounted        | ✖       | ✔       | ✔       |


## 小结

这期介绍了一款基于 vue 的 SSR 框架——nuxt。nuxt 框架对比 vue 库的好处是：它提供了一套完整的解决方案，帮助团队统一命令、规范代码、集成配套工具、封装配置文件，以及提供生产和开发环境。这是对缺少文档、缺乏经验，或是流动性很大的团队来说，不可或缺的优异功能。

不过，框架之于库的劣势也很鲜明：缺乏灵活性，缺少配套插件，封装可能过深，项目侵入较大等等。我自己碰过最大的坑是，nuxt 对 serverless lambda 支持不友好；server 端的依赖不能打包部署，只能把所有 node_modules 一股脑扔到 lambda 上，结果超出了 lambda 上传 size 限制。所幸，有个小姑娘花了两礼拜时间，用 webpack 过滤掉了无用文件，从而大幅减少了 size。当然，依赖问题可能是各种技术栈都会碰到的难题。我就见过有些部门专门组织多人团队，花了一年时间才勉强解决依赖过大的问题，最后得到了领导层的高度赞扬。

总之，框架和库的选择目前来说还是极度依个人经验，很难找出一套可以量化优劣的评判机制；多写代码，积累经验，并在适当时机转型，可能是比较靠谱的应对之道。（我也经常在 nuxt 和 vue spa 之间摇摆，有时候还会被领导层喷“拍脑袋”，😄😄😄）


[0]: ./img/lifecycle.png
[1]: https://zh.nuxtjs.org/
