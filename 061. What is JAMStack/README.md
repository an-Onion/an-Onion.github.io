# JAMStack 101

我记得我刚入行的时候，Web 开发有个叫 MEAN（MongoDB, Express.js, AngularJS, and Node.js）的 JS 全栈，当时还是挺新奇的。时隔多年，MEAN 也没人在提起，不过 JS 全栈开发的理念还是被更多人接受了。今年，又有一个新的大前端概念——JAMStack——挺火的，今天就随便聊一聊。

## 定义

JAM 其实是 Javascript、APIs、Markup 三个术语的首字母组合。通俗来说，JAMStack 就是使用 SSG（Static Site Generators）技术，并且不依赖 Web 服务的前端技术栈。

> "A modern web development architecture based on client-side JavaScript, reusable APIs, and prebuilt Markup"
>
> — Mathias Biilmann (CEO & Co-founder of Netlify).

- Javascript：网页渲染工具；JAMStack 并没有限制使用何种框架或是库

- APIs：一系列服务端行为的抽象，主要通过 https 与 Javascript 交互。可以是第三方提供的服务，也可以是自己搭建的 function

- Markup：网站是托管在 CDN 上的静态资源，Markup 就是生成这些资源的源文件。刚提出 Markup 概念的时候，大家都看好 Markdown 作为 Markup 语言，但是这些年更常用的是 Vue 或是 JSX 文件

## 架构

OK，仅仅列出 JAM 定义，其实跟没说一样，我们还是看看他与传统网站架构的比较：

### 相比于传统动态网站

![Traditional vs. JAMStack][1]

看架构图就很直观了，传统的 web 架构会有一个很厚重的后端服务器；而 JAMStack 更接近纯静态网站——它甚至通过 SSG 把数据和 html 一起托管到 CDN 上。

为什么会有 JAMStack 这么奇怪的架构呢？我们还是要看应用场景，以及它要解决的问题。对于一些新闻、企业官网、小型电商，这类 CMS（Content Management System）网站，它的内容更新非常缓慢。传统的网站架构无论如何都需要一个实时的在线服务，它在处理这些不怎么变动的内容时，很鸡肋：计算量很小，但是依旧需要大量后端和运维人员维护网站的安全性、稳定性、可伸缩性……

JAMStack 在这些场景下给出了新的解决方案：直接使用 CDN 分发静态页面以及数据。这样，这些 CMS 就成了一个纯静态网站，上述运维难题也自然而然地规避了。

### 相比于纯静态网站

既然是 all in CDN，那为什么不用纯静态网站呢？我们再分析一下 JAMStack 与纯静态网站的区别。纯静态网站也是把所有内容分发到 CDN 上，但是它对承载动态内容并不是很友好。举个例子，某公司要想改其静态首页的公告；传统的做法是：运维人员（非开发）手动修改页面，然后更新部署。但是这种解决方案一看就很前现代——编辑页面就很麻烦的，还要自己操作一系列手动部署流程。

JAMStack 就给出了一个更动态的方案：事实上，JAMStack 是有后端的——一个叫 Headless CMS（无头内容管理系统）的后台系统。所谓的“无头”，就是用户端的 UI 展现和后台服务进行解耦，后台系统不负责定制用户端的 UI——也就是去“头”——只负责数据管理。它的大致流程是这样的：

1. 运维人员在无头 CMS 系统里输入数据
2. 无头 CMS 系统将数据写入 DB，并触发 SSG 部署流程
3. SSG 拉取 git 代码和 DB 内的相关数据，并生成静态资源
4. SSG 再将静态资源部署到 CDN 上，并清理相关缓存

![Headless CMS][2]

当然，实际项目中大概率还会是操作 admin 页面，然后调取无头 CMS 的 API 的。JAMStack 的整个运行平台是由服务商提供，页面更友好，也更具自动化，从而减少了非技术人员的出错的可能。

### 进阶版 JAMStack

上面提到的 JAMStack 是五六年前提出这个概念时的理论模型，但是我看了一些号称 JAMStack 落地的网站，他们的实现其实并没那么“教条”：

![Advanced JAMStack][3]

现在的 JAMStack 还是会从客户端发送 API 请求数据的，只是 API 服务器很轻量，通常是 Lambda 这类 serverless 方法。有些 CMS 网站还集成了 auth 服务、搜索服务、支付服务等等，但是通常也是在前端直接集成三方服务的 JS 库。

## 优缺点

OK，我们简单介绍了一下 JAMStack 的架构，稍微复盘一下。JAMStack 的优点有：

- 高性能：几乎是纯静态的网页，网络请求基本流向了 CDN，很少有额外的数据请求
- 安全性高：不用太担心服务器和数据库的安全问题
- 成本低：静态资源托管的费用非常廉价
- 更好的开发体验：前端单独开发、单独部署、单独测试，完全解耦后端架构

当然 JAMStack 的缺点也很明显，业务场景非常狭小，只能用于内容更新不大频繁的 CMS 站点。国外也有无头电商（Headless Commerce）的商业实践，但是前景并不明朗。

## 工具 & 最佳实践

JAMStack 的工具链基本和传统 web app 前端相同，区别主要是 SSG 方案的选择：通常来说就是前端三大件（React、Angular、Vue）的 SSR 框架的抉择——Next、Scully、Nuxt 等等。不过我最近发现了一些 JAMStack 的全栈解决方案：

- [redwood.js][4]：react + graphql + prisma 的 serverless 框架
- [blitz.js][5]：Typescript + Next + prisma + Auth 的 Node 框架，开箱即用
- [midway.js][6]：React/Vue + egg/midway + typeorm 的 serverless OOP 框架

这些方案本质上就是 Node 全栈的 Monorepo 模版，开箱即用，并且高度适配主流的 serverless 服务。不过，真正用到生成环境，可能还得再等等。

此外，这些年 JAMStack 也总结了一套最佳实践，主要有：

- 原子化部署：每一次部署都应该是一个完整的站点 snapshot，不能有脏页面
- Cache：一旦更新了静态资源，就应该立马清楚 CDN 缓存，保证上线的站点资源唯一
- Git：构建工作流要强依赖于 Git hook。Markup 的变更要快速响应，也要方便地追踪
- DevOps：能围绕不同的开发阶段、不同的运维需求快速地部构建、部署出一套新的环境，方便开发、测试、验收……

## 小结

从技术上讲，JAMStack 本质上就是一种增强版的静态网站，不算太大的创新，只能算是 serverless 兴起后的一种衍生品。不过，传统 Web 开发那一套“前端-api-后端-DB”的技术链确实过于繁琐了，JAMStack 是一种改进方向，至少在某些场景下是行之有效的方案。

[1]: ./img/tradition.drawio.png
[2]: ./img/headless.drawio.png
[3]: ./img/advanced.drawio.png
[4]: https://github.com/redwoodjs/redwood
[5]: https://github.com/blitz-js/blitz
[6]: https://github.com/midwayjs/midway
