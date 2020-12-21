# Monorepo 101

前段时间我尝试把几个小项目合并起来，但是效果很不理想。最近看了一篇文章讲 monorepo，终于意识到了自己的问题所在。本文借机讲讲 monorepo 的简单实践，分享一下基于大前端代码管理的一些常规操作。

## Monorepo

_Mono-_ 词根的意思是**单体**，所以 monorepo 指的就是单体仓库管理，通俗来说就是一个 git 仓库包含项目所有应用的源代码。

Monorepo 项目通常由多个 app 组成，比如，把网页端、移动端、小程序等等 app 放在一起；或是把复杂产品线里拆分成微服务，但依旧共享同一个代码仓库。

### Mono-repo vs. Multi-repo

除了 monorepo，在大型项目管理中还有一个名词，叫 multirepo。顾名思义，前者是单仓库；后者就是多仓库——把应用按模块分散到不同的代码仓库里。通俗来说，它们是单个 git repo 和多个 git repo 的区别。

![multirepo v.s. monorepo][7]

我们看看 monorepo 在与 multirepo 对比下的优劣点：

- pros of Monorepo

  |            |                                        |
  | ---------: | :------------------------------------- |
  | all in one | 所用代码共用一套配置，更易于统一管理   |
  |   代码复用 | 代码复用度高，提取公共模块也简单易行   |
  |     透明度 | 源码均可见，方便在 IDE 里查看          |
  |   最小更改 | 依赖项代码更改后，所有被依赖项立即生效 |

- cons of Monorepo

  |            |                                                |
  | ---------: | :--------------------------------------------- |
  |   访问约束 | 代码集中一处，有越权修改的风险                 |
  | Build 时间 | Mono 的代码量往往较大，构建时间会很长          |
  |   Git 性能 | Git 设计初衷是小代码仓库，代码量太大会拖垮 git |

### Monorepo 工具

主流的 mono 管理工具很多，如：

- [lerna][1]：老牌的 JS 多包管理工具
- [Baze][2]：google 出品的多语言 mono 构建工具
- [RushJs][3]：巨硬出品的 mono 全生命周期工具
- [NX][4]：可扩展的 mono 开发工具

这些工具非常强大，有的集成了 CI 特性，有的是内置了脚手架功能。不过学习新工具有很容易无端增加认知成本。其实想入手 monorepo，只要有 yarn 就行了，其他的高级功可以慢慢学，也可以配合其他传统工具使用。后文就围绕 yarn 简单介绍如何配置 monorepo。

## Yarn workspaces

yarn 从 1.0 版本起就有多包管理的功能——`yarn workspaces`。主要关注如下三个需求：

- 对于每个项目，Yarn 将使用一个单独的 `yarn.lock` 文件而不是为每个工程使用一个不同的锁文件，这意味着更少的冲突和更容易的审查
- 所有的项目依赖关系都将被安装在一起，为 Yarn 提供更多的自由度来更好地优化它们
- 依赖关系可以链接在一起，这意味着工作区可以相互依赖，并始终使用最新的可用代码

### 启用 workspace

我们试着开启 yarn workspace，首先在控制台敲下如下命令：

```bash
yarn config set workspaces-experimental true
```

这样你系统目录下的 .yarnrc 文件就写入了 `workspaces-experimental true`。

接着我们初始化项目根目录的 package.json 文件如下：

```json
{
  "private": true,
  "workspaces": {
    "packages": ["packages/*"]
  }
}
```

这里 `"private": true` 是必需的，主要是增加安全措施；而 `"workspaces.packages"` 用于指定子项目所在的文件夹。

### 初始化项目

简单起见，我们先创建两个子应用——foo 和 bar，结构如下：

```bash
.
├── packages
│   ├── foo
│   │   └── package.json
│   └── bar
│       └── package.json
└── package.json
```

指定 foo 和 bar 的包名，

```json
// packages/foo/package.json
{
  "name": "@onion/foo",
  "version": "1.0.0",
  "devDependencies": {
    "chalk": "^4.1.0"
  }
}
```

其中 bar 依赖于 foo

```json
// packages/bar/package.json
{
  "name": "@onion/bar",
  "version": "1.0.0",
  "dependencies": {
    "@onion/foo": "1.0.0"
  },
  "devDependencies": {
    "chalk": "^4.1.0"
  }
}
```

### 安装

我们在根目录跑一下`yarn install`；node_modules 下出现了 **@onion/bar**、**@onion/foo**，以及两个包共同的依赖 **chalk**。

```bash
.
├─node_modules
│  ├─@onion
│  │  ├─bar
│  │  └─foo
│  └─chalk@4.1.0
│
└─packages
    ├─bar
    └─foo
```

复盘一下 yarn install 的效果：

1. 将 workspaces 里的包提升到 node_modules 下，使项目底下的 js 都可以通过 `import '@onion/foo'` 的形式调用私有项目包

2. 将 workspaces 下共同依赖的三方库——chalk——也提升到了 node_modules 下，供两者使用

_p.s._ 这里插播一个知识点，NPM 模块的加载顺序是：先查看当前目录下的 node_modules 文件夹；如果未找到 import 模块，再寻找上一级目录的 node_modules 文件夹；直到系统 home 下的 node_modules 为止。所以提升依赖不会影响使用。

### nohoist

当然，假如子项目各自的三方依赖项版本不同，yarn 也会选择性地只提升其中一个版本，另一个版本会保留在特定子项目下的 node_modules 文件夹下方：

```bash
.
├─node_modules
│  ├─@onion
│  │  ├─bar
│  │  └─foo
│  └─chalk@4.0.0
│
└─packages
    ├─bar
    │  └─node_modules
    │      └─chalk@4.1.0
    └─foo
```

你也可以更狠一点，干脆不让 yarn 提升某些依赖:

```json
//package.json
"workspaces": {
    "packages": ["packages/*"],
    "nohoist": ["**/chalk"]
  }
```

这样各自项目的依赖会保留在自己所在目录下的 node_modules 里：

```bash
.
├─node_modules
│  └─@onion
│     ├─bar
│     └─foo
│
└─packages
    ├─bar
    │  └─node_modules
    │      └─chalk@4.1.0
    └─foo
       └─node_modules
           └─chalk@4.0.0
```

### 运行 workspaces commands

运行子项目的 npm script 和常规操作一直，先`cd`到特定目录，然后`yarn run`即可；当然你也可以在根目录操作，指定空间名字即可：

```bash
yarn workspace @onion/foo run test
```

## Symlink

最后，再说了个 monorepo 在开发环境中与常规工具的集成。上面提到过： @onion/bar 项目依赖 @onion/foo 项目。

```json
// packages/bar/package.json
{
  "name": "@onion/bar",
  "version": "1.0.0",
  "dependencies": {
    "@onion/foo": "1.0.0"
  }
}
```

我们在 bar 项目内引用 foo 项目，通常不会使用相对路径的形式 ；而是用 Symlink（符号链接）的形式导入（如`@onion/foo`）。

```javascript
// packages/bar/index.js
import foo from "../foo/src/index"; // Bad

import foo from "@onion/foo"; // Good
```

Symlink 指向的依赖一般就是 node_modules 里的文件。正如上文提到过，在本地开发中使用最新的依赖代码，我们每次都需要事先安装一下，有时候还有版本配置等等问题，使用起来略显麻烦。更大的问题是：通常依赖项里的代码会做压缩或是转义，不利于调试。所以想使用最新代码，我们还要再加点配置。

### ts-node

比如使用 typescript，会以起别名的形式将 symlink 指向源文件。如下，在 tsconfig 里将 `@onion/foo` 指向源代码，VSCode 编译器就会支持源码跳转：

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./packages",
    "paths": {
      "@onion/foo": ["foo/src"]
    }
  }
}
```

调试的时候在 npm script 里加上[tsconfig-paths][5]即可：

```json
// package.json
{
  "scripts": {
    "start": "ts-node -r tsconfig-paths/register src/index.ts"
  }
}
```

### Webpack

使用 webpack 热加载时，也可以通过[tsconfig-paths-webpack-plugin][6]来读取 tsconfig 配置：

```javascript
//packages/foo/webpack.config.js
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
  resolve: {
    plugins: [new TsconfigPathsPlugin()],
  },
};
```

### Babel

babel 的话，我暂时没有发现特别好用的 plugin，但是自己写个简单的正则也能实现别名功能：

```javascript
// packages/bar/babel.config.js
module.exports = {
  plugins: [
    [
      "module-resolver",
      {
        alias: {
          "^@onion/(.+)": "../\\1/src",
        },
      },
    ],
  ],
};
```

还有一些工具诸如 rollup、jest、cra 脚手架等等，配置起来也大同小异，改改别名就行了。大家有兴趣的话可以自己试试。

## 小结

本期简单介绍了一下前端项目配合 yarn workspaces 管理 monorepo 的一些常用手段。上面提到的 monorepo 和 multirepo 优缺点对比，不知道大家是否有“感同身受”的体会？

我自己参与过一个大型项目，从几人到几十人，后来又萎缩到几个人。我们最初用的是 multirepo，当时玩得不亦乐乎；后来，人力流失，由几个人管理 multirepo，就变得异常艰辛了。现在回忆起来，各中体会历历在目。

虽然 monorepo 和 multirepo 各有千秋吧，但是我个人还是推荐使用 monorepo，因为你无法预计项目的未来；在交接时，monorepo 至少是完整的，不像 multirepo 你根本猜不透其中会遗漏掉多少信息。

[1]: https://github.com/lerna/lerna
[2]: https://github.com/bazelbuild/bazel
[3]: https://github.com/microsoft/rushstack
[4]: https://github.com/nrwl/nx
[5]: https://github.com/dividab/tsconfig-paths
[6]: https://github.com/dividab/tsconfig-paths-webpack-plugin
[7]: ./img/mono.drawio.png
