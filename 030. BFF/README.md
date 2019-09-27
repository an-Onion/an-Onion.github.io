# BFF 简介

以前我在谈论 graphql 的时候提到过 BFF（Back-end For Front-end），每每都是一笔而过，这次就专门开一期，简介一下 BFF——服务于前端的后端。

## 前端演化史

### Web 1.0

故事都得从 long long ago 说起，让我们先来回顾 web 1.0，那时候的网站如下所示：

![Web 1.0][2]


那个年代的架构很简洁，纯后端渲染网页。我学生时代流行的 JSP 就是这个范畴里的架构。再后来进了厂，发现厂里用的是**string 拼接成 html**的动态渲染技术，当时极为震惊；听说这类技术还有一个很响亮的名称，不过我现在已经叫不出来了。

### Web 2.0

时间又到了 10 多年前，那时候手机业务开始蓬勃发展；但受限于网络传输，由后端反复送 html 到前端（后端渲染）的技术很难适应新的业务场景。

这时候聪明的小伙子们，想到了将数据格式转化成 JSON，并通过 api 调用提供给前端使用。

![Web 2.0][3]

此后的变化是一系列的前端框架方兴未艾；得益于技术演进，前后端正式分离，Web 应用交互空前丰富。


### 微服务时代

前端在剧烈演进，后端也悄然发生着变化：微服务、中台战略这类词汇充斥在各类技术架构中。

![Micro-services][4]

这时候客户端与微服务交互成为了新的考量。应对微服务的方案很多：

* API Gateway

  比较直观的方案就是利用 api 网关分发请求：

  ![API Gateway][5]


* CORS

  第二个想到的是前端跨域请求。前端分别向不同微服务发出请求，再将回调数据在 Flux 层处理后反映在 DOM 上。

  ![CORS][6]

---

上述两种方案，在业务权责上有明显偏重。怎么看出来呢？😅看数据的组装、聚合、裁剪放在哪一块就行了。

做过前端的小伙伴一般都能理解这一点：网页各个子模块的展示是很琐碎的：有时是一个单一字符串的显示，有时是多表联结的表单渲染。

方案一中，后端有时需要准备力度很细的数据返回，这个就要求前后端频繁沟通。而另一些场景，后端又需要构造各种级联表单，以致微服务之间调度频繁；而微服务的本质是清晰的界限上下文，因此在**某些场景下**这种设计会导致领域建模变得较为复杂。

再说一下方案二。前端**分层**和**建模**是最近比较流行的设计趋势，有一些流派甚至喊出了前端 DDD，我也挺喜欢这种趋势的。说实在，后端编写接口挺麻烦的，不如提供一些粗粒度的 api，交由前端酌情处理。只是传输负载可能会比较大；还有就是在多平台开发时，各平台需要重复组织数据，这就显得很冗余了。

### BFF

有没有更优雅的解决方式呢？嗯，不如将组装、聚合、裁剪这部分业务单独拎出来，组成一个叫`Back-end for Front-end`的中间层。

![BFF][7]

> 没有什么是加一个中间层解决不了的，如果有，就加两个……         ——鲁迅

BFF 就是老生长谈的中间层概念，是上述一二方案的折衷解法。实现上没太大限制，就是一层 nodejs，能做请求转发和数据转化即可。Nodejs 既配合了前端技术栈，也更适应向微服务的并发请求。我自己的项目就是在 Node 上跑了一个 Graphql 的服务；也可以做成对前 Restful、对后 RPC 的实现；还可以在 BFF 上加 cache、鉴权等等操作，具体可以根据自身需求改造。

## BFF 优缺点

回顾完前端演化史，我们再来分析 BFF 利弊。

BFF 作为中间层，优点是：

* 前后端彻底分离，即便是后期有微服务迁移，也不需改动前端代码

* 业务更向前靠拢，琐碎的 api 由前端开发自己决定，更适配前端框架

* BFF 可以自开 mock，插件也能生成 API 文档，相比后端单开这类服务要方便些吧

* 留给后端更清晰的服务边界，只需要提供粗粒度的接口即可

我自己的项目就直接把`BFF+前端`一齐从后端 repo 里分离出来，独立开发独立部署。尤其是在多应用场景里，BFF 共享后端是很优雅的中台设计。

当然，BFF 的缺点也很明显——增加了系统的复杂度，这会导致一系列的连锁反应

* 中间层转发会增加请求延迟。

* 需要保证端到端测试

* 必须随时准备好后端异常请求

* BFF 分成会增加开发成本

说说我自己的经历吧。我们的项目是由两三个 mono 应用发展过来的，在大约一年时间里逐步完成了前后端分离、微服务、BFF 分层等转型。本以为这一堆操作可以帮助开发人员将心力集中在更细节的业务范围，效率理应有所提升。但后期猛然发现，小朋友的开发方式是这样的：开 frontend，开 BFF，开各种后端，开 local DB；在跨应用交互场景中，还得再开另一套 front 和 BFF。直接吐血了——我已经为他们准备好各层单开的方式了……

我反复思索了自己的问题：

1. 系统分层了，但是人的职责并没有分层，反模式！违反了康威定律，三五个开发甚至该考虑服务合并了。

2. 没有形成技术共识。我是一步步拆分系统过来的，但是那些和我一起经历过拆分的“元老”已经相继离职了，新来的小朋友很难体会当中的曲折。

所以说系统设计时还是要依据奥卡姆剃刀原则——若无必要，勿增实体。

## 小结

今天介绍了一个简单的系统设计知识——BFF。我们在回顾前端演变史后，应该可以感觉到，BFF 是系统不断演进的结果；在采用 BFF 设计时，也应该正确地把握演进步调。个人的经验是，BFF 比较适合放在系统重构阶段：比如采用[绞杀者模式][1]（strangler pattern）迁移系统（即在遗产代码外添加新功能做成微服务）；BFF 既可以扮演旧系统的代理，也可以为新功能提供新形式的接口。

---

## 题外话

最后还有一些妄语吧。大家也看到了 BFF 这类系统设计并不需要特别深邃的思索，技术实现上也没过多的限制；但真正采用时往往又是另一番景象。究其缘由还是人比系统更复杂。说来道去，开发团队中，若底层能反映问题，中层能上通下达，高层能及时调整，绝大多数所谓的高阶系统都是水到渠成的。不过组织上的事讳莫如深，毕竟不适合随意谈论。



[1]: https://docs.microsoft.com/en-us/azure/architecture/patterns/strangler
[2]: ./img/web1.0.png
[3]: ./img/web2.0.png
[4]: ./img/micro.png
[5]: ./img/api-gateway.png
[6]: ./img/cors.png
[7]: ./img/BFF.png
