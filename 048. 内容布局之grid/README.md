# 内容布局（四）——网格布局

耽搁了好久一直没写 Grid 布局，主要是写布局的文章太累人😅。这期就朝花夕拾，写写 Grid layout 的入门教程。

## Gird Basic

Grid layout 翻译过来叫网格布局，我先介绍一下 Grid 里的几个基本术语：

### Grid Container

网格容器就是被设置为`display: grid`的元素，通俗来说就是所有网格的最外层：

```css
.grid-container {
  display: grid;
}
```

### Grid Items

网格项就是网格容器里的每一个子元素。如下所示，`header`、`aside`、`main`和`footer`就是`grid-container`的网格项。（**p.s.** 孙子元素不会受到祖先网格属性的影响）

```html
<div class="grid-container">
  <header></header>
  <aside></aside>
  <main>
      <!-- doesn’t effected!!! -->
      <div class="grandson"></div>
      <!-- doesn’t effected!!! -->
  </main>
  <footer></footer>
</div>
```

![container & items][0.1]

### Grid Columns

既然是网格，自然有列和行的概念，我们先说“列”。网格容器添加`grid-template-columns`属性便可激活列属性：下方示例中，我们把网格项排成了两列。实现上只需把两列的长度（`200px`、`auto`）从左至右枚举出来即可：

```css
.grid-container {
  display: grid;
  grid-template-columns: 200px auto;
}
```

![column][0.2]

除了利用单位或 auto 来指定每一列的长度，我们也可以让列按一定比例排布。下方示例中，实现了左右两列 1:2 比例的布局——只需在`grid-template-columns`指定`1fr`和`2fr`即可。

```css
.grid-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
}
```

![Fractions][0.3]

**p.s.** ***fr 是 franction 的缩写***

### Grid Rows

同理，`grid-template-rows`会激活行属性，也就是用来定义每一行的高度，属性同样可以是基本单位（px，rem，%），也可以是`fr`比例：

```css
.grid-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  grid-template-rows: 100px 200px;
}
```

![Rows][0.4]

### Grid Gaps

若想为这些排布的 items 添加间距（槽），可以使用`grid-gap`属性。单独定制横轴或纵轴的间距，还有`grid-column-gap`和`grid-row-gap`这两个属性。

```css
.grid-container {
  display: grid;
  grid-template-columns: 1fr 2fr;
  grid-template-rows: 100px 200px;

  grid-column-gap: 10px;
  grid-row-gap: 10px;
  /* or in simplified form */
  grid-gap: 10px;
}
```

![Rows][0.5]

### Grid Cells & Gird Lines

在`grid-template-columns`和`grid-template-rows`排布后，横轴和纵轴交汇，就形成如下所示的单元格（grid cell）和标注为 1、2、3... 的网格线（grid line）。这里我提一下，cell 和 item 是不一样的概念：cell 是网格的基本单元，而 item 是可以横跨多个 cell 的 DOM 元素。

![cell][0.6]

## Grid Layout

上文我们介绍了几个网格布局的基本术语；若是到此为止，那也顶多是加强版的 table 布局罢了。而网格布局的真正特别之处是在 grid cell 基础上的网格定位。

我们还是从传统布局的弊端说起，下图是一种很常见的页面布局。

![Flex Layout][0.7]

这种布局实现上很直白：先把整体分成三行，再把中间那行分成两列。HTML 便签大体如下所示：

```html
<body>
  <header class="row"></header>
  <div class="row">
    <aside class="column-aside"></aside>
    <main class="column-main"></main>
  </div>
  <footer class="row"></footer>
</body>
```

实现很简单，就不写 CSS 了；只是在语义标签层面上，`header`、`footer` 和 `aside`、`main` 理应是同级；但为了布局方便不得不把 `aside` 和 `main` 做成了孙子节点，有点怪怪的。不过整体也没太大问题。如果再成换更复杂的布局呢，比如，回字形？

![Hollow Square][0.8]

用传统布局技术（如 flex）实现回字形，代码量会立马暴涨。更糟糕的是，这种排版将牺牲掉所有语义标签——你的关注点只会在各种层层嵌套的 div 上了。

### Grid Position

网格布局能帮到什么呢？我前文也提到过，Grid items 可以横跨多个 Grid cells，就从这里入手。

我们再看看上面那个回字形布局，本质上不就是个九宫格嘛？我们用  `repeat` 方法给网格容器写一个 3×3 的 cell 九宫格：

```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  grid-template-rows: repeat(3, 100px);
}
```

再把网格项 `header` 覆盖在第 1 和第 2 个 cell 上、`aside` 在 4 和 7 上、`main` 在 3 和 6、`footer` 在 8 和 9 上即可完成布局。

![Soduku][0.9]

那网格布局怎么为网格项定位这些 cell 呢？用坐标呀！从 `(grid-column-start, grid-row-start)` 到 `(grid-column-end, grid-row-end)` 所在的矩形区域来定位网格项的排布。横坐标值就是 Y 轴（Column Grid Line）所显示的数值，纵坐标就是 X 轴（Row Grid Line）所显示的数值，起始数值都是 1。

![Position][0.10]

上图所示，`header` 位于 `(1,1)` 到 `(3,2)` 这块矩形区域内，我们为 `header` 添加如下 CSS 属性；`header` 便会自动定位到左上角那块粉红色区域了。

```CSS
header {
  grid-column-start: 1;
  grid-row-start:  1;
  grid-column-end: 3;
  grid-row-end: 2;
}
```

其他几块区域的布局我就不写出来了，大家有兴趣的话自己算一下坐标即可。

## Grid Areas

除上面这种二维坐标定位的方式，CSS 网格布局还提供了一种更无脑的定位方式——`grid-template-areas`——可以为网格设置区域模版，比如上面的回字形布局模版就如下所示：

```CSS
.grid-container {
  display: grid;
  grid-template-areas:
    "h h m"
    "a . m"
    "a f f";
}
```

这个模版我写得很简单，解释一下：就是由九个字符及空格所示意的九宫格模版。以左上角`h h`为例，两个相邻的`h`组成了一个所谓的“命名网格区”，表示网格区名为 `h` 的网格项将会被排布在第 1、2 两个 cell 上。`a`、`m`、`f`分别是另外三个网格项的标识符；中间的 `.` 是一个空白区域的占位符，我本人习惯用这个字符，大家尽可以挑选自己喜欢的占位符。

之后，我们再为 `header`、`aside`、`main`、`footer` 分别设置映射区域——`grid-area`，这四个网格项就自动排布到各自模版位上去了。

```CSS
header { grid-area: h; }
aside { grid-area: a; }
main { grid-area: m; }
footer { grid-area: f; }
```

再回头看一下网格布局的 HTML，语义标签不需要为布局做任何改变。这是较传统布局的重大改进，HTML 和 UI 结构终于实现了分离。

```html
<body class="grid-container">
  <header></header>
  <aside></aside>
  <main></main>
  <footer></footer>
</body>
```

### Grid Kiss

`grid-template-areas` 还需要为各个网格项命名模版区域，模版能不能自己帮我们映射到相应的 html tag 或是 class 上去呢？这样写起来似乎更省事。

嗯，还真有人想到了这一点——一个叫 [postcss-grid-kiss][3] 的 [postcss][4] 插件。Grid-kiss 为我们实现了一种很有趣的 CSS 布局方案：让所有的布局变成一幅“简笔画”：

```css
.grid-container {
  grid-kiss:
    "+-------------+  +-----+"
    "|   header    |  |     |"
    "+-------------+  |     |"
    "+-----+          |main |"
    "|     |          |     |"
    "|aside|          +-----+"
    "|     | +--------------+"
    "|     | |    footer    |"
    "+-----+ +--------------+"
    ;
}
```

它的实现就是把这副文本流图转化成 grid 语法树。有一句广告说的好，“Grid-kiss，布局从未如此简单”

## IE support

最后再说一下 IE，早在 E10 的时候它就已经支持网格布局了——还是挺超前的。只可惜 IE 的 Grid 语法别树一帜，未被大众认可；方法与现代 Grid 一比，更相形见绌了。那 IE 上要怎么使用网格布局呢？我们还是得依靠 PostCSS——CSS 里的 Babel，它有个叫 [autoprefixer][1] 的插件可以帮我们完成 Modern Grid 到 IE Grid 的转换；这里[（Autoprefixer online）][2]还有一个在线的转换网站，有兴趣的朋友可以试一下。

若你已经使用现代 JS 框架（如 Vue、React），它们的脚手架大多内置了 postcss 和 autoprefixer，基本上就是无配置使用。上面的 grid-kiss，也只要给 postcss 配置加个插件，亲测 IE11 可用。至于 IE 的 Grid 语法，就让它随风消逝在历史的长河之中吧。

## 小结

上次看了篇文章，提到 CSS Grid 已是一种很大众化的前端技术。但我身边的 team，只能说很少很少很少有人使用。我猜原因有多种：

* 熟练掌握 CSS 的开发人员本身就很少，大家形成了一种“默契”——不要增加认知复杂度
* 技术革新太快，一开始想着“让子弹飞一会儿”，但是之后就再也没人提起了
* 传统认知中后端重于前端，很多团队也无心推动前端升级

当然，这些种种我们也应理解，毕竟这只是一种布局技巧，在一个产品的范畴中占不了太多分量；甚至于技术本身，只要别太烂，也并不是决定产品成败的关键。所以嘛，对于新技术也，能用则用，不能用也不要太过执着；做人嘛，最重要的是开心。

[0.1]: ./img/items.png
[0.2]: ./img/columns.png
[0.3]: ./img/fractions.png
[0.4]: ./img/rows.png
[0.5]: ./img/gap.png
[0.6]: ./img/cell&line.png
[0.7]: ./img/flex.png
[0.8]: ./img/hollow.png
[0.9]: ./img/sudoku.png
[0.10]: ./img//position.png
[1]: https://github.com/postcss/autoprefixer
[2]: https://autoprefixer.github.io
[3]: https://github.com/sylvainpolletvillard/postcss-grid-kiss
[4]: https://postcss.org/
