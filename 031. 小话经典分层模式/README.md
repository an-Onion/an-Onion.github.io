## 小话经典分层模式

我最早接触**软件分层**这种概念还是在本科时期，那时候我听不懂 OOP 课程，只好窝在宿舍看低清小视频，好像是北大青鸟的一个老师上传的 Web 教程，视频里整天就是 MVC，MVC 的。讲真，我最终理解 MVC 还是工作多年后的事，属于后知后觉吧。这期就回顾一下我的认知历史，聊聊传统软件分层常用的几个模式——MVC、MVP 和 MVVM。

> 软件架构的关键是提供合理的手段来组成软件，同时保持一切井然有序。

## Model-View-Controller

|         |            |
| ---------------- |-------------|
| 模型 （Model）         | 数据结构，以及方法 |
| 视图 （View）          | 展示模型的界面 |
| 控制器 （Controlelr）  | 用户输入，以及业务逻辑 |


MVC 的兴起是上个世纪的桌面 GUI 软件开发时期（那时候还没 Web 啥事），所谓的 View（即 GUI 组件）既少又丑，而 Controller 也只负责响应简单的键盘和鼠标事件，Model 就是响应后的数据增删改查。

我们看看 MVC 模型图，View 和 Controller 直接引用 Model，但反过来不行；目的是为了保证数据建模时不用考虑 UI 问题。Model 实现了观察者模式，使其可以被多个 View 注册，当 Model 更改时通过事件机制触发 View 更新。

![Native MVC][1]

上面的示意图还是有点抽象，了解一下 MVC 数据流可能更好理解一些。它一般有两条生命周期：

1. View Cycle

    只涉及 UI 更改的业务流，比较经典的就是鼠标滚轮效果。Controller 直接调度 View。

    ![View Cycle][2]

2. Model Cycle

    第二条就是涉及数据响应的操作。Controller 更改 Model 后，Model 随之触发订阅者 View 的更新操作：一般就是主动向 Model 获取数据；View 更新后向用户展现最新 UI

    ![Model Cycle][3]

上述 MVC 是最经典的模型设计。后来到了 Web 开发时代，大家耳熟能详的 Spring，更进一步将其发扬光大：Controller 层处理用户请求，业务逻辑被下放到了 Service 层；Model 被分成的数据结构、数据操作等等细碎对象，如 po、dao 等；View 也从 HTML 拼接方式，转到了动态渲染模版的技术（比如 JSP、thymeleaf、Django 等框架），以及少数起辅助作用的 js 和 css 文件。我这个年纪的开发人员很多都有类似的经验，回想起来恍如昨日。

## Model-View-Presenter

MVP 是从 MVC 衍生出来的一种模式，Presenter 替换掉了 Controller（为了区别，总会有人想取个霸气的新名字）。这个设计的要求是：View 和 Model 解耦，全部消息通过 Presenter 传递。

![MVP][4]

MVP 模式的普及还得归功于手机 APP 和 SPA。那是在一个手机性能大幅提升，但是移动信号并不稳定的年代。人们发现，只要事先把 View 层的**template**安装到手机客户端上，依靠 APP 动态渲染页面，就可以在及其有限的数据传输下，实现之前需要臃肿后端的所有功能。这是个成功的试验。与此同时，人们发觉 web 应用上也可以尝试相同的设计，这种设计的实现被称为 SPA（Single Page web Application）：在首页渲染前，浏览器一次性加载所有 View 层和 Presenter 层相关的代码（前端代码）；并且通过 JSON 这种数据格式与 Model 层（后端代码）交互（Restful API）。这时候 model 的实现也随之被交到了另一帮人手里，后来就出现了下图这番风光：

![Front-end & Back-end][0]

MVP 中的 View 变得非常稀薄，几乎等价于 template，甚至被称为**被动视图**（Passive View）；而 Presenter 则变得及其厚重，几乎承载了所有业务逻辑。这个时代的亮点是 jQuery，它用一种简化了的 API 屏蔽了各个浏览器厂商的 DOM 操作；但反过来 jQuery 又将视图层逻辑和业务层逻辑完美地混合在了一起，出现了一个巨难维护的 Presenter 层。有时候在想，假如通讯技术的发展再快几个节拍，可能 MVP 也就只能停留于教科书了。

> 一种设计模式的命运啊，当然要靠自我奋斗，但是也要考虑到历史的行程。

## Model-View-ViewModel

MVP 之后，人们又在思考：View 已然如此稀薄，能不能更进一步——通过一些库或是框架将 DOM 操作完全隐藏掉呢？KnockoutJS、Angular、Vue“粉墨登场”：它们以一种叫双向绑定（data-binding）的技术，消化掉了昂贵又繁琐的 DOM 更新——MVVM 出现了。

![MVVM][5]

MVVM 将 Presenter 改名为 ViewModel（你懂的，为了有所区别，又想了个新名词），但是模式几乎与 MVP 相同，只是 View 和 ViewModel 采用了双向绑定技术：View 的变动自动反映到 ViewModel，反之亦然。

MVVM 的核心自然是 ViewModel 层，现在的开发中，ViewModel 基本都是编写在库或是框架提供的模版中。我们将 Model 中获取的数据模型（视图状态），以及用户交互行为（视图行为），封装到 ViewMode 里；而框架帮我们把 DOM 操作这种最脏最累的活解决了，开发人员只要维护好 ViewMode 和 View 的映射关系，当数据更新时 view 自动更新，反之亦然。MVVM**彻底**解耦了 View 层和 Model 层，因为你已经很少会去编写代码，亲自改动 View 了。😅

再回看一眼 MVC，那时候我们在 JSP 或是 XML 的模版中编写代码；现在我们切换到了 JSX、VUE 这类模版里。底层开发人员的日常工作其实并没有太大变化——一直都是在框架里填空。所以，我们自己到底是进步了，还是进步了？

## 小结

MV*X*的历史基本到此为止了。随着软件复杂度的进一步提升，MV*X*这种三层架构已经很难建模现今的业务场景；再去提四层、五层的模型，其实也没太大的意义了。软件开发领域似乎也需要一种**大一统理论**来应付未来更多变更复杂的需求；至于是什么，大家敬请期待吧。


[0]: ./img/front&back.png
[1]: ./img/Native-MVC.png
[2]: ./img/View-Cycle.png
[3]: ./img/Model-Cycle.png
[4]: ./img/MVP.png
[5]: ./img/MVVM.png

