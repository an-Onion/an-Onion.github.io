# 内容布局（三）——Flexbox

前两期讲了[position 布局][13]和[水平布局][14]，这期接着之前的话题继续聊聊更新一点的布局方式——Flexbox（弹性布局）。

## Overview

Flexbox 也就是 Flexible Box Layout 模块，是 CSS 提供的用于布局的一套新属性。这套属性包含针对**容器**（flex container）和针对其直接子元素（**弹性项**，flex item）的两类方法。Flex 可以控制的弹性特征包括：大小、流动方向、横纵两轴的排布、顺序等等内容。Flex 已被 IE11 之后的浏览器完美支持，除了少数恶心的应用，大家应该放心地使用 flexbox；甚至应该尽量避免使用传统的内容布局方式。Flex 是一个 display 属性，使用时直接在容器上添加该属性即可。还是以上一期的导航栏为例：

```html
<ul>
  <li><a href="/home">HOME</a></li>
  <li><a href="/onion">Onion</a></li>
  <li><a href="/garlic">Garlic</a></li>
</ul>
```

![Before Flex][1]

我们给容器 ul 加上 flex 属性：

```CSS
ul {
  display: flex;
}
```

![After Flex][2]

效果很明显，弹性项`<li>`全部变成了类似于 inline-block 的元素了——水平布局显现出来了。

## Flex 方向：主轴和辅轴

Flexbox 可以针对某一区域控制其中元素的顺序、大小、分布以及对齐。事实上这个区域的元素可以沿着两个方向排列：

* 主轴（main axis）：也就是横轴，水平方向的排列
* 辅轴（cross axis）：也就是纵轴，垂直方向的排列

默认情况下子元素是依据主轴，从左至右排列，也就是`flex-direction: row;`，但事实上还有：`row-reverse`、 `column`、`column-reverse`等几种。我们对比一下效果：

![Flex direction][3]

排布和我们的常识并不冲突，所以理解起来不难，

* row：从左往右排列
* row-reverse：从右往左排列
* column：从上至下排列
* column-reverse：从下至上排列

## 空间与对齐

上面提到了主轴和辅轴，flex 还可以对这两个方向上的排布作出调整，这里需要记住两个英语单词：*justify*和*align*；从语义来说，前者翻译过来是**行**（水平）排齐，后者是**列**（垂直）排齐。CSS 关键字里经常出现这两个单词，大家记得区分语义。

### justify-content

我们先看水平排布，它的属性叫`justify-content`，主要有四种：flex-start、flex-end、center、space-between、space-around。

```CSS
ul {
  display: flex;
  justify-content: flex-start;
}
```

![justify-content][4]

默认为 flex-start，表示左对齐；其他几个也可顾名思义：右对齐、水平居中、居间留白、空间环绕。

这里顺便提一个与 flex 有点关系的常规的布局：如何让首元素（HOME）左对齐，剩余元素右对齐呢？

![margin auto][5]

很简单，让首元素的右 margin 为 auto 即可，原理是：在 flex 布局里，外边距 auto 会耗尽 flex 容器的所剩空间，剩余弹性项就这样被前面的 margin 挤到了行尾。

```CSS
ul li:first-child {
  margin-right: auto;
}
```

同理，让第二个元素的左 margin 为 auto 也可以实现上面一模一样的效果：

```CSS
ul li:nth-child(2) {
  margin-left: auto;
}
```

再换一个布局，如何把上图的首元素挤到右侧，剩余元素依旧左对齐呢？

![Order][8]

这里需要用到 Flexbox 的 order 属性，它是弹性项的属性，可以帮助我们完全摆脱源码中的顺序约数。Order 的默认值是 0，表示按源码中的顺序排列。我给首元素加一个很大的 order 值，如 999；浏览器发现它的 order 大于所有兄弟元素，就直接把它放到了行尾。然后我再把它的左 margin 设为 auto，首元素就被挤到最右侧了。

```CSS
ul li:first-child {
  order: 999;
  margin-left: auto;
}
```

Order 值不需要连续，且可正可负；只要可以比大小，相应的项就可以按值升序排列了。

### align-items

Flexbox 有水平对齐，自然也有垂直对齐，叫 align-itmes，是容器属性，主要有四种： stretch、flex-start、center、flex-end。

```CSS
ul {
  display: flex;
  align-items: stretch;
}
```

默认值是`stretch`——高度自动拉伸；其他值不拉伸高度，分别是上中下对齐。上述示例中所有元素的高度是一致的，所以看不出垂直对齐的效果；下图我特意把首元素的高度增加了一倍，大家就可以发现区别了：

![align itmes][6]

align-items 属性会对所有弹性项起效果，假如我只想调整末尾元素为居中对齐，那该怎么办呢？

![align-self][7]

Flexbox 提供了一个叫 align-self 的属性为弹性项调整个别项的对齐方式。我们只需要把 last-child 设成垂直居中即可：

```CSS
li:last-child {
  align-self: center;
}
```

这里顺便提一下，flexbox 并没有`justify-self`这个属性，也就是说我们无法调整个别项的水平排布。嗯，辅轴功能并不见得比主轴弱。

## 伸缩

伸缩属性也是用于调整个别项的排布，属性名就叫**flex**😅

```CSS
li:fist-child {
  flex: 1 1 auto;
}
```

事实上，它是三个属性的语法糖，按序分别是：

* flex-grow：用于拉伸的弹性系数（自然数），默认值是 0
* flex-shrink：与 flex-grow 相反的弹性系数，应用于收缩状态，默认值是 1
* flex-basis：在上面两个属性**修正**前的**基准**大小

伸缩属性有点难讲，为了方便计算，我稍微调整了一下尺寸，顺便把各项的尺寸显示出来：

```CSS
ul {
  display: flex;
  width: 24em;
}

li {
  width: 4em;
}
```

### flex-basis

flex-basis 的默认值是 auto，但也可以是单位值（如 16px、1em），或是百分比（相对于主轴而言）。上面我事先写死了弹性项`<li>`的宽度，这时候所有弹性项的默认 flex-basis 就等价于 4em 了。接着再为首元素单独设置 flex-basis 为 8em：

```CSS
li:first-child {
  flex-basis: 8em;
}
```

我们比对一下设置前后的效果：

![flex-basis][9]

很明显，首元素宽度变成了之前的两倍。在未被伸缩属性修正前，flex-basis 可以直接当成宽度来用：若设置了 width 属性，默认值 auto 等于 width；若没有设置 width，auto 又会根据内容实际长度设置数值。当然，flex-basis 并没有这么简单，我们接着往下看。

### flex-grow

上图中的容器`<ul>`还有剩余空间，我们不妨接着试试 flex-grow——为首元素加入伸展系数:

```CSS
li:first-child {
  flex-basis: 8em;
  flex-grow: 1;
}
```

![flex-grow 1][10]

在上述代码的基础上，试着给另一个弹性项 last-child 添加 flex-grow：

```CSS
li:last-child {
  flex-basis: 4em;
  flex-grow: 1;
}
```

![flex-grow 2][11]

嗯，我们应该可以看出一些端倪了：

1. flex-grow 会拉伸弹性项，并最终填满父元素的所有剩余空间
2. 若多个弹性项同时设置了 flex-grow，它们会按一定的比例分配父元素的剩余空间

这里所谓的剩余空间 `=` 容器总长度 `-` 所有弹性项的 flex-basis 之和。

修正后，弹性项的实际长度 `=` 自身 flex-basis `+` 剩余空间 `×` 自身的 flex-grow `/` `∑` 所有弹性项的 flex-grow。

公式出来了，我很难再说得更清楚了😅。

### flex-shrink

再看看收缩场景——当 flex 容器空间小于所有弹性项 flex-basis 之和时，flexbox 又会按一定比例压缩各弹性项；flex-shrink 就是应用于这个场景的收缩比例系数。

在收缩场景里，总压缩长度（负空间） `=` 所有弹性项的 flex-basis 之和 `-` 容器总长度。

修正后，弹性项实际长度 `=` 自身 flex-basis `-` 总压缩宽度 `×` `[` 自身`(`flex-grow `×` flex-shrink`)`  `/` `∑` 所有弹性项的`(`flex-grow `×` flex-shrink`)` `]`。

### flex-wrap

上面这个收缩计算有点麻烦了，而且也没太必要计算出实际宽度。在很多的应用场景里，我们会直接给容器加一个`flex-wrap: wrap;`属性：当 flex 容器过窄时，弹性项直接换行即可。

```CSS
ul {
  display: flex;
  flex-wrap: wrap;
}
```

![flex-wrap][12]

这种根据宽度自动调整布局的设计，被称为**响应式设计**，这就是后话了。

## 小结

本文简单介绍了 flexbox 最常用的几个属性，涵盖了横纵方向的排布、对齐、大小、次序调整等等方面。但是本文只是入门介绍，flexbox 的语法还有不少，具体实践更远超本文描述，还是希望大家能继续研读 W3C 文档。

## 相关

* [《内容布局（一）：position 布局》][13]
* [《内容布局（二）：水平布局》][14]

文章同步发布于[an-Onion 的 Github](https://github.com/an-Onion/my-weekly)。码字不易，欢迎点赞。

[1]: ./img/before-flex.png
[2]: ./img/after-flex.png
[3]: ./img/flex-direction.png
[4]: ./img/justify-content.png
[5]: ./img/margin-auto.png
[6]: ./img/align-items.png
[7]: ./img/align-self.png
[8]: ./img/order.png
[9]: ./img/flex-basis.png
[10]: ./img/flex-grow-1.png
[11]: ./img/flex-grow-2.png
[12]: ./img/flex-wrap.gif
[13]: https://www.jianshu.com/p/e69fde5ba357
[14]: https://www.jianshu.com/p/4a90764e36e9
