# 内容布局（二）：水平布局

上期回忆了 position 布局，这期继续唠嗑传统布局中的水平布局。

## 概述

通常我们的页面会随内容增加沿垂直方向扩展，但现实排版中我们也会有左右水平扩展的需求。现在的开发自然是通过 flex box 解决这类问题。但是在一些老破旧系统，如银行系统的 ie6，ie9 这类页面之中，我们一般又是如何水平布局的呢？

## [浮动（float）][1]布局

首先是 float 布局。float 模型和上一期的 position 模型一样，也是一种脱离文档流的技术，语法同样简单——直接在元素上添加`float: none|left|right|initial|inherit;`即可。虽说 float 共五种属性，但事实上真正起作用的也就 left 和 right；顾名思义，一个往左漂，一共往右漂。

OK，既然都是脱离文档流，position 和 float 的区别是什么？初学 CSS 时，我经常搞混它们俩。后来想想，无他，设计初衷不同：position 实现元素叠加的效果，而 float 则是实现元素环绕的效果。给个例子，先看原图：

![figure & section][2]

我希望图片能移动到布局右侧，并形成文字环绕的效果。

```html
<main>
  <figure>
    <img src="..." alt="mvp">
  </figure>
  <section>
    <h1>MVP</h1>
    <p>
      Model–view–presenter (MVP) ....</p>
  </section>
</main>
```

代码很简单，一行搞定。

```CSS
figure { float: right; }
```

添加`float: right`的浮动盒子会自动向右漂移，直到该盒子的 border 碰到包含块的内边缘（或接触到另一个浮动盒子外边缘）。后续元素根据常规文档流重新布局，但内部的行内块（inline-block）元素——如文字——会避开浮动盒子，这就形成了文字环绕的效果。

![Surrounding][3]

当然，这节的主题并不是文字环绕，只是人们突然发现，图片右浮动了，如果把文本块也浮动一下，不就形成左右两块浮动的水平布局了吗？

```CSS
figure {
  float:right;
  width: 30%;
  margin: 0;
  border: dotted red;
}

section {
  float:  left;
  width: 65%;
  margin: 0;
  border: solid yellow;
}
```

块状元素默认会占据 100% 文档流宽度，我们分别给图片和文字设置 30% 和 65%的宽占比（5%留白）；这样两个浮动盒子就互相错开了，形成了如下左右双视的布局。

![Left & Right][4]

不过这里还有个小问题，我特意给上图的包含块`main`加了蓝色的外边框。发现没有？包含块在两个浮动盒子的上侧，原因就是包含块内部的子元素全部走出了文档流，它反倒成了一个空盒子。解决方法很简单，给包含块内部再填一个空元素，并使用`clear`，这个空元素就会挤开包含块，直到避开所有浮动的兄弟元素。当然，我不是很想再修改 html 文本，比如给它加个 div 什么的；我的方法是：在 CSS 中引入伪类`::after`，它也会在包含块末尾生成一个盒子。试着给它应用 clear：

```CSS
main::after {
  clear: both;
  display: block;
  content: '';
}
```

Bingo！

![Pseudo-elements][5]


## 行内块（inline-block）布局

我们再来看另一种水平布局的方式——inline-block 布局。我们常常用到如下几种原生 html tag：div、article、h1~h6。它们的布局默认是从下往下的，但还有几种 tag 的布局默认是从左往右的，如 span、time、a 等等。区别是，前者的 diaplay 是 block，而后者的 display 是 inline-block（行内块）。OK，有了这个先天的条件，我们发散地思考一下：如果把 div 的 display 设成 inline-block，那它不也就能从左往右水平布局了吗？

事实上，很多页面最上方的导航栏就是这么干的。

![Navigation Bar][6]

它们的实现是一般就是一组`ul~li`列表，如下所示：

```html
<nav>
  <ul>
    <li><a href="/home">HOME</a></li>
    <li><a href="/onion">Onion</a></li>
    <li><a href="/garlic">Garlic</a></li>
    <li><a href="/ginger">Ginger</a></li>
  </ul>
</nav>
```
我们稍微添加一点效果:

```CSS
nav {
  border: solid blue;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  width: 25%;
  margin: 0;
  outline:  1px solid blue;
  text-align: center;
}
```

这里主要是除去了 ul 原始的 style——不然，每行之前都会有个黑点。然后把 li 宽度设成 25%，以便之后四等分导航栏。

![ul style none][7]

接着，我们再将 li 做成行内块元素，这样它会从垂直布局变成水平布局。
```css
li {
  display: inline-block;
  width: 25%;
  margin: 0;
  outline:  1px solid blue;
  text-align: center;
}
```
![inline li][8]

OK，效果有了，只是并非四等分的水平布局。仔细观察，各个导航块之间有细缝，但是我们已经把 margin 设成 0 了，那这又是什么呢？这其实是 html 源码中的换行符：

```html
<li><a href="/garlic">Garlic</a></li>
<li><a href="/ginger">Ginger</a></li>
```

我们在编写源码时，换行了。这就导致了一件很有趣的事，浏览器把这些换行符渲染成了空白字符。因此，一行中无法容下四个 25%的导航块外加一些空白字符了，也就只能把第四块导航块放到第二行了。

解决方法很粗暴，就是把 ul 里的 font-size 设成 0，然后再在 li 里设回来。

```CSS
ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0;
}

li {
  display: inline-block;
  width: 25%;
  margin: 0;
  outline:  1px solid blue;
  text-align: center;
  font-size: 1rem;
}
```

OK，如期解决了空白问题，每一列都靠拢了，也就能撑到一行内了。

![Navigation Bar][6]

## 表格（table）布局

inline-block 布局其实挺麻烦的，要算好宽度，还要改字体。有没有更优雅的方式？

大家，可以试试 table 布局（当然我说的不是 dreamviewer 那个年代的摆放方式）`display: table;`

还是上面老的 html，把 ul 做成 table，li 做成 table 元素，然后浏览器会自动帮你调整好该行的所有导航块了。

```CSS
ul {
  display: table;
  width: 100%;
  margin: 0;
  padding: 0;
}

li {
  display: table-cell;
  outline:  1px solid blue;
  text-align: center;
}
```

![table layout][9]

# 小结

这期，我们快速浏览了传统水平布局的三种实现方式：float 布局，inline-block 布局和 table 布局。怎么说呢，这些都是 CSS2 那个刀耕火种的年代里，前端程序员费劲心思挖掘出来的一种排版经验吧，但是总体来这些布局限制比较大，功能也很单一——不好用。正如某个姓黄的伟人所说：这些“奇技淫巧”终将消失在滚滚的历史洪流之中。现在的程序员也没有太大必要去深挖这些特性了，我们还是放眼未来，去学习更高效的工具——flex box 吧。

# 相关

[《内容布局（一）：position 布局》][10]

[1]: https://www.w3schools.com/cssref/pr_class_float.asp
[2]: ./img/origin.png
[3]: ./img/surrond.png
[4]: ./img/left-right.png
[5]: ./img/main-after.png
[6]: ./img/nav.png
[7]: ./img/ul-style-none.png
[8]: ./img/li-inline.png
[9]: ./img/table.png
[10]: https://www.jianshu.com/p/e69fde5ba357
