# 零配置 web 框架——Zero Server

有过 web 开发经历的小伙伴大概对配置文件是深恶痛绝的——实在是太多了，最常见的就有 babel、eslint、tsconfig、webpack，package.json 等等；而且各种配置使用不同的文件扩展，使用时还要安装各种插件，繁琐且无聊。几年前，主流框架开始尝试提供无脑启动的脚手架，如`create-react-app`、`vue create`等等，其中有些小众框架甚至主打了零配置招牌。这期就介绍一款完全零配置的 Web 框架——[zero server][8]。

## 概述

所谓零配置，就是不需要手写任何配置文件，只要把代码放在工作空间，直接一行命令，安装、编译、打包、启动等等全套服务一气呵成。Zero Server 就是基于这种愿景设计的一款 web 框架，它的主要特色有：

- 零依赖配置管理
- 基于文件路径的 API 路由
- 支持动态路由
- 支持服务端渲染（SSR）和静态页面生成（SSG）
- 支持主流的框架和语言，包括 React、Vue、Node、Python、Markdown 等等

## Get Started

OK，略过似懂非懂的概述，我们先回到一切的开始——安装。使用该框架前，需要全局安装 zero：

```bash
npm i -g zero
```

安装结束后，为 Zero 应用创建一个根目录：

```bash
mkdir zero-app
```

接着在 zero-app 目录下新建一个 `index.jsx` 文件：我们先以一个简单的 React 应用为例，写一个 Hello World 的函数组件：

```javascript
export default () => <h1>Hello World</h1>;
```

![zero-app][0]

运行 `zero`

```bash
cd zero-app
zero
```

看效果如下，配置（.babelrc、.gitignore）和依赖相关的文件（package.json、node_module、yarn.lock）都自动生成了：

![run zero][1]

顺道，zero 还帮我们启动了服务；浏览器输入 `localhost:3000`，便可看到 `index.jsx` 的实现了：

![index][2]

有了 React，我们再试试 Vue；在根目录新建 about.vue 如下：

```html
<template>
  <h2>{{ message }}</h2>
</template>
<script>
  module.exports = {
    data() {
      return {
        message: "About Vue",
      };
    },
  };
</script>
```

Zero 能识别所有主流框架的扩展名，并处理好相关依赖，最后热启动服务——一条龙服务省心省力。我们转到 `localhost:3000/about` 看一下效果：

![about][3]

有兴趣的小伙伴还可以试试 markdown、python、html 等等文件。

## 路由

从上文中大家不难发现 zero 框架中文件和路由的关系大致如下：

| file        | route                   |
| ----------- | ----------------------- |
| index.jsx   | localhost:3000          |
| about.vue   | localhost:3000/about    |
| markdown.md | localhost:3000/markdown |

Zero 应用就是基于文件目录的路由系统：

- 在开发环境下，只要在特定目录下新建相关文件，zero 会根据**_路劲+文件名_**（不包括扩展名）自动建立对应路由（由于加载依赖，速度上有点慢）
- 生成环境需要提前 build 一下（`zero build`），接着 zero 便会在 `.zero` 目录下生成特定的静态资源，并根据文件目录建立路由表

![route][4]

### API 路由

书接上文，zero 除了支持编译静态资源，还支持动态 API，默认框架是 express.js。我们新建 node 文件 `/api/hello.js`，并返回一个 message 对象：

```javascript
export default (req, res) => {
  res.send({ message: "Hello from API." });
};
```

API 依旧是基于路劲的路由，我们打开`localhost:3000/api/hello`，可以看到返回的数据：

![API][5]

接着再看一下如何调用这些 API。上文提到 Zero 支持服务端渲染（SSR），我们还是以 React 为例看一下使用方法。Zero 原生支持了 React SSR 框架 next.js；它提供了一个 `getInitialProps` 的方法获取 API 数据，并在服务端渲染后返回页面资源。我们新建一个 `hello.jsx` 文件使用后端渲染技术：

```javascript
import React from "react";

export default class extends React.Component {
  static async getInitialProps() {
    return fetch("/api/hello")
      .then((res) => res.json())
      .then((json) => ({ message: json.message }));
  }

  render() {
    return <p>Message from API: {this.props.message}</p>;
  }
}
```

看看服务端调用 API 的效果：

![Hello From API][6]

### 动态路由

除此之外，Zero 还提供了动态路由机制；当然还是基于文件系统的路径，只是动态动态路由表对应的是 `$` 符开头的文件。举个例子，新建一个 react 页面——`/user/$name.jsx`；再次利用 next.js 的`getInitialProps` 获取 url 的参数 name：

```javascript
import React from "react";

export default class extends React.Component {
  static async getInitialProps({ url }) {
    const { params } = url;
    return { name: params.name };
  }

  render() {
    return <div>Your user name: {this.props.name}</div>;
  }
}
```

输入 `localhost:3000/user/Onion`；这里 `Onion` 就是动态填充的 `$name`，看效果：

![User name][7]

Vue、Svelte、Python 等等框架有它们自己的 SSR 方法，有兴趣的小伙伴可以在[这里][9]查看具体使用。

## 小结

Zero 是一个比较有趣的 Web 框架，从案例来看几乎实现了所有的零配置需求。但是，现实中，我猜，几乎不会有技术负责人把它放到生产线上去。零配置 Web 框架还是出生得太早了，生产环境中大概率就是一个无底黑洞。
不过，写写 demo，快速搭建一个本地服务，Zero 还是一个很完美的选择。当然，也希望有朝一日，能真正出现一种优雅的框架解决现阶段繁琐的配置；不过，那时候可能前端开发人员也不值钱了吧。哈哈，让我们拭目以待吧。

[0]: ./img/get-started.png
[1]: ./img/run-zero.png
[2]: ./img/index.png
[3]: ./img/about.png
[4]: ./img/route.gif
[5]: ./img/api.png
[6]: ./img/hello.png
[7]: ./img/username.png
[8]: https://github.com/remoteinterview/zero
[9]: https://zeroserver.io/docs/svelte#dynamic-routes-pretty-url-slugs
