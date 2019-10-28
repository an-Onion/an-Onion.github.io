# 内容布局（一）：position

最近出于某些原因，我又开始翻看 CSS 相关书籍了。可能有将近两年没再阅读过相关书籍了，工作中一般就是依靠 vuetify 之类的 UI 框架做做内容布局，久而久之很多知识也就生疏了。想再开个专题，写几篇 CSS 布局相关的文章，回顾一下老得没人再愿意啃的知识。

## 概述

定位（position）是 CSS2 中一个重要的属性，用于规定元素的定位类型，是页面内容布局中很常用的手段。所谓定位，其主要意义就于将使用了 position 的元素（absolute 或 fixed）从常规页面流里脱离出来，也就是说它能让元素超脱垂直布局（block）或是水平布局（inline-block）。

position 共有五种可能值：
|         |            |
| -------------: |:-------------|
| static | 默认值，没有定位。      |
| inherit | 继承父元素 position 属性（注：默认是 static，不是 inherit）      |
| relative | 相对于正常的页面位置定位，偏移后不影响周围元素的位置，即原始空间不会被挤占     |
| absolute      | 相对于最近的非 static 祖先的定位；绝对定位会脱离页面流，也就是说原始空间会被挤占 |
| fixed      | 相对于浏览器窗口定位，也是脱离页面流的存在    |

虽说定位有五种属性，但是现实开发中，用到的基本就只有 absolute，所以后文就只介绍绝对定位。

* inherit 是语义级别的存在
* static 主要用于覆盖其他 CSS 的 position 属性
* fixed 常用语弹框、横幅等一些比价猥琐的广告位
* relative 可能在十几二十年前有人用于布局，但它移动后原始位置会被挖空，显得很奇怪，所以现在基本不用了。现在主要就是为 absolute 创建定位上下文——absolute 需要非 static 祖先定位



## 绝对定位

绝对定位非常适合用于提示、对话框、下拉菜单这类覆盖于其他内容之上的组件。上面提到过：absolute 一般是依靠最近的 relative 祖先定位的，relative 祖先会对 absolute 后代提供一个叫**定位上下文**的页面空间；absolute 组件便可以通过 top、right、bottom 和 left 四个属性，依靠在定位上下文的四个边框内。这里的 top 值——其他三个同理——指的是 absolute 相对于 relative 上边界的距离，正值为上边界下方，负值为上边界上方。

我们用一个例子来说明一下 absolute 的使用方法，下图我们将一句 comment——`Soga!`——浮动于段落的左侧：

![Comment in aside][1]

这个 comment 事实上是一个`aside`标签，位于 html 正文第二段。

```html
<main>
  <p>Domain-driven design (DDD) is an approach...</p>
  <aside class="comment">Soga!</aside>
  <p>Domain-driven design is predicated on...</p>
</main>
```

理论上它是这样的：

![Comment Original][2]

为了将 comment 脱离至上而下的页面流，我们给 comment 加上绝对定位：

```CSS
.comment {
  position: absolute;
}
```

后续的段落随之挤了上来，占据了 comment 的页面空间；而 comment 则悬浮于原始页面流的正上方。

![Comment Absolute][3]

之后的操作就很简单，让 comment 向左上方移动即可。传统的做法是：先将父组件置为`relative`，再利用`top`和`left`位移到特定位置：

```CSS
main {
  position: relative;
}

.comment {
  position: absolute;
  top: 2em;
  left: 3em;
}
```

这个方法本身没有太大问题，只是`top`、`left`偏移属性是相对于祖先元素定位的，编码的过程需要调整祖先元素的样式表。

![top & left][4]

我们这里偷个懒，使用一个更简单方式——负外边距，我们就不用理会`main`的样式了：

```CSS
.comment {
  position: absolute;
  margin-top: -2em;
  margin-left: -6em;
}
```

![negitive margin][5]

在 CSS 中，负 margin 是有效的：左边或上边的负 margin 会将浮动元素向左或向上拉，盖住其旁边的元素。这个效果和相对定位（`position: relative`）的元素位移很相似，只是 relative 元素还会占据原始页面流的空间。

## 创建三角形

这里顺便再引申一个知识点。大家有没有发现，comment 右上角有一个小三角，这个是怎么做到的呢？

![Triangle][6]

我的实现用到了伪元素**定位**。我们先把 after 伪元素也设置为 absolute，这样它便根据父元素 comment 定位了。（再回忆一下，absolute 相对于最近的非 static 祖先定位）

```CSS
.comment::after {
  position: absolute;
  right: -1em;
  content: '';
  width: 0;
  height: 0;
  border: .5em solid red;
}
```

接着，我们再定制一下这个伪元素的大小：把 content 置为空字符，高度和宽度设为 0，这样整个伪元素就成了 0 像素大小；同时把 border 做成`.5em`，这样该伪元素就成了一个边长为`1em`的实心正方形。然后，将偏移量 right 置为`-1em`，整个伪元素就被移到了 comment 的右侧。

![pseudo after][7]

这时候再看一下该红色正方形的真实组成，如下：当 content 为 0 像素，并且 border 不为 0 时，元素的四边会被挤压成四个等腰三角形。

![border][8]

只要把正方形的右下部分，也就是 border-right 和 border-bottom 做成透明，整个三角就完工了。

```CSS
.comment::after {
  position: absolute;
  right: -1em;
  content: '';
  width: 0;
  height: 0;
  border: .5em solid red;
  border-bottom-color: transparent;
  border-right-color: transparent;
}
```

![Red Triangle][9]

最后一步就是把 border 颜色改成和 comment 底色一样。Bingo！

![Final Triangle][10]

## 定位与 z-index

用好定位，还需要掌握 z-index 技术，也就是堆叠元素的次序。这里再补充一个知识点：static 定位以外的元素会根据他们在代码树中的深度依次叠放。类似于打扑克，后发的牌会压在先发的牌面上，但是他们次序是可以更改的，可以通过设置 z-index 大小调整。z-index 可正可负，值越大，显示越靠上方。

Debug 的时候，我们经常会通过给 z-index 添加一个很大的值来将被覆盖的元素显示出来；不过，我个人惨痛的经验是：绝大多数情况都是失败的。主要原因是除了 z-index，还有其他影响元素堆叠次序的因素。这里再给一个概念，叫**堆叠上下文**：就像一盒扑克牌，每盒牌本身就是一个上下文，而 z-index 只是作用于自己所在的牌盒里。但是堆叠上下文的产生有点复杂，很难一一道来，我这里说几个比较常见的：

* 设定了`position: absolute` 及 z-index 不为`auto`的元素，会创建一个专属于自己后代元素的堆叠上下文
* 透明度（opacity）小于 1 的元素需要独立渲染，它会自动触发新的堆叠上下文
* transform 和 filter 属性会创建新的堆叠上下文

何时创建堆叠上下文，各个浏览器厂家甚至各个版本的浏览器在实现上都有较大差别，很难给出明确的标准；我自己开发的时候经常碰到这类坑，一言难尽呀。

## 小结

这次我们复习一个很原始，但经常碰到的知识点——定位布局，介绍了它的基本使用方式和经常碰到的陷阱。定位布局是所有 CSS 开发人员的入门课；后面，我还会继续介绍更复杂的水平布局、flux 布局，以及 grid 布局。敬请关注。


[1]: ./img/comment-aside.png
[2]: ./img/comment-main.png
[3]: ./img/comment-absolute.png
[4]: ./img/comment-top-left.png
[5]: ./img/comment-negitive-margin.png
[6]: ./img/triangle.png
[7]: ./img/after.png
[8]: ./img/border.png
[9]: ./img/red-triangle.png
[10]: ./img/final-triangle.png
