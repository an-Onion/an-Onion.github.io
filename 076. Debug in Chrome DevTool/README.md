# Chrome DevTool 小技巧

Chrome DevTool 是 Web 开发中必不可少的生产工具，其功能主要包括调试、性能分析、页面优化、定制样式表……网上已经有很多 DevTool 的使用讲义，尤其是以调试技巧最为繁多；本文不想赘述这类通识知识，仅仅介绍一些我觉得比较便利的一些小功能。

## Dom 断点

私以为，Dom 断点是仅次于 JS debug 的重要功能。我是一个维护廿年遗产应用的老码农，该遗产系统的特点是：无法通过正常途径找到 JS 的响应入口；但是工作依旧得做，是吧？所以，“通过 Dom 表象定位到触发事件”就成为了我的常规 Debug 手段。比如，我要查看“删除元素的事件”，只需要导航到目标 Dom -> 鼠标右键 -> Break on -> node removal，接着操作页面就可以自动帮我定位到相关 JS 代码了。

![Dom Debugger][3]

## monitor 函数

monitor 函数是 Chrome DevTool 自带的一个监听器（监听函数的函数 😅）；可以手动在 Console tab 里添加，或是干脆放在源码里使用。使用方法很简单，看个简单的例子就懂了：

![monitor][4]

如上图所示，我们通过 monitor `hello` 函数，在它被调用时，打印出 `function XXX called` 的字样；带参数时，还能显示具体内容。

不想监听了，`unmonitor(hello)` 即可。

## console 输出

使用 monitor 函数的人还是相对少数，很多人觉得函数体里写个 `console.log` 也可以监控，不须要额外的认知。这里不去争论细节了，效率问题罢了。不过，即便是处处用到的 console 对象，大家也可以关注一些简单 Practice：

- console.log 路人皆知，不过打印的时候推荐包个大括号

  如下所示，单纯“打印两个值”与“打印键值对”相比，在开发体验上还是有差距的。

  ![console.log][5]

- console.table：以表单形式打印出对象

  ![console.table][6]

- info & warn & error ：log 的三种分级显示

  三种 log 背景色不同，可以通过点 `Default levels` 分级显示输出

  ![warn & error & info][7]

## 保留 log

既然说到 log，大家在查看日志的时候有没有碰到过这类问题：提交表单后当前页面自动跳转了，这个过程中的日志还没来得及细看就全没了？这时候挺容易奔溃的，不过也别太焦虑，Chrome 早就替大家想好了解决方案。在 Network 标签下有个 `Preserve log` 的复选框，勾上就行了。不过这个功能启动了，`clear()` 方法就不能用了——毕竟是两个互斥的操作。

![Preserve log][8]

## 拷贝资源路劲

我经常会拷贝页面里的静态资源路径，然后在新的 tab 里打开查看。传统的操作是先点 **Edit as HTML**，然后在编辑框里滑选。最近我发现 Chrome 加了个新功能，叫 **Copy link address**，直接点击就复制到剪切板里了。

![Copy link address][9]

能拷贝静态资源路径，自然也能复制动态资源。这个需要去 Network 标签里找，右键 response 里的资源，有个 **copy** 下拉选项，**Copy link address**就在它的二级选项里了；其他二级选项也是挺有用的，大家可以挨个尝试一下。

![Copy Response][10]

## 命令框

最后再说说 Chrome DevTool 的命令框——快捷键 ctrl+shift+p （Windows）或 cmd+P（Mac），这个和 VS Code 是一样的；里面可以搜索到所有的 DevTool 功能。就说我最常用的一两个功能吧。

- 截屏

  很多人都会装 Chrome 应用商店里的截屏扩展，事实上它们调的是 DevTool 里的 API。大家在命令框里输入 `Screenshot` 就可以使用这个功能了。

  ![Screenshot][1]

- 切换 dock 位置

  这个是我个人癖好，没事就让 devtool 的 dock 位置跳来跳去。大家可以用鼠标点最右上角的三个点来切换；有时候不想用鼠标了，就试试这个键盘操作。

  ![Dock side][2]

## 小结

前段时间在看人类发展史，其中提到**掌握和熟练使用工具**是人类进化中的关键一步。我个人是非常推崇效率工具的，使用舒适的生产工具能显著地提升开发体验，并让工作变得不那么枯燥。但是，不是所有人都有这种迫切需求的。我就看过很多从业多年的老人，对开发工具的感知处在非常木讷的阶段，比如不能区分 IE devtool 和 Chrome devtool 的高下，这个也是挺有趣的。

好了，今天就讲了几个我觉得有点意思的小功能。不知道大家有没有自己钟爱的功能呢？也请留言告诉我们。

[1]: ./img/screenshot.png
[2]: ./img/dock.gif
[3]: ./img/dom-debug.png
[4]: ./img/monitor.png
[5]: ./img/console.log.png
[6]: ./img/console.table.png
[7]: ./img/console.error.png
[8]: ./img/preserve.log.png
[9]: ./img/copy-link.png
[10]: ./img/copy-response.png
