# CSS clamp()

## 响应式布局

响应式布局（Responsive Design）是大约十年前提出的一个概念，意在以一套代码适配不同终端设备——而不是为每个终端做一个特定的版本；它的目的是解决移动互联网时代不同设备分辨率繁多，而多版本 CSS 代码生产成本过高的难题。传统意义上，我们实现响应式布局，有如下两种方式：

- Media queries（媒体查询）

  CSS 媒体查询事实上早已有之，最早它是来适配打印机、电报、盲文印刷设备这类上个世纪的终端产品的。它的主要语法是：

  ```CSS
  @media mediatype and|not|only (media feature){
    CSS-Code;
  }
  ```

  我们可以通过调整 media 规则，为不同媒体设备提供不同的样式。如下 CSS 代码，`example`元素在宽度小于 600 像素的屏幕上，显示长度为 50vm，即半个屏宽；在大于 600 像素的屏幕上，只显示 300 像素的长度。

  ```CSS
  @media screen and (max-width: 600px){
    .example {
      width: 50vw;
    }
  }

  @media screen and (min-width: 600px){
    .example {
      width: 300px;
    }
  }
  ```

- ResizeObserver

  ResizeObserver 就是通过 JS 来调整页面元素的大小了。不过，该方法及其繁琐，除非某些元素有很强的需求，一般来说我们也不会去尝试的：

  ```javascript
  const resizeObserver = new ResizeObserver((entries) => {
    const screenWidth = document.documentElement.clientWidth;
    for (let entry of entries) {
      entry.target.style.width = screenWidth > 600 ? "300px" : "50vw";
    }
  });
  resizeObserver.observe(document.querySelector(".example"));
  ```

上面两种通用手段都有一个特点，就是代码量比较大。随着现代 CSS 功能的不断增强，很多原始的写法其实已经过时了。现在调整响应式布局的宽度，更多时候用的是 CSS3 的新函数——`clamp`，下文就简单介绍一下它的使用方法。

## min & max

谈到`clamp`，不得不提的就是它的两个前辈函数——`min()` 和 `max()`； 顾名思义，前者是取最小值，后者是取最大值。该节就以 `min` 方法为例，详细介绍一下这两个函数的用法。

`min()` 方法语法如下：以一个或多个逗号分隔的*数学函数*、*字面量*或是其他*表达式*作为参数，返回参数列表中的最小值：

```CSS
property: min(expression [, expression])
```

举两个例子：

- `width: min(8px, 9px)`：返回的宽度是 8px
- `font-size: min(8px + 2px, 9px)`：得到 9px 的字体大小

（_注意：在 CSS 的函数里，`+`、`-`前后必须要有空格，但是`*`、`/`可以不用_）

不过，上面两个例子在现实中毫无意义，因为单纯比较 8px 和 9px 是没有实际应用场景，min 的主场还是在响应式布局上的。我们看个有意义的例子：

```html
<style>
  .css-min {
    width: min(50vw, 300px);
  }

  div {
    background-color: pink;
  }
</style>

<div class="css-min">
  min(50vw, 300px) - If the viewport at 50vw is less than 300px, take the value
  of 50vw, otherwise, stay at 300px.
</div>
```

![CSS min][1]

简单解释一下上面的代码，如果视窗小于 600px, 则粉色区域占据一半的视窗宽度（50vw）；反之则宽度保持 300px。效果大约等价于如下传统方式——可以看出 min 代码简洁许多:

- max-width

  ```CSS
  .css-min {
    width: 50vw;
    max-width: 300px;
  }
  ```

- 媒体查询

  ```CSS
  .css-min {
    width: 50vw;
  }

  @media ( min-width: 600px ) {
    .css-min {
      width: 300px;
    }
  }
  ```

min 需要比较的是不同衡量单位下的数值大小；尤其在响应式布局下，参数一般都会包括一些与全屏相关的度量单位，如 vw、vh、rem 等等：

```CSS
.example {
  width: min(var(--size)*1px, 6rem + 2px,5em, 10%, 2vw)
}
```

同理，max 函数就是取最大值了；使用方法与 min 相同，这里就不赘述了。

## clamp

OK，花了很大篇幅在 min 函数上，那它和我们的主角 clamp 有什么关系呢？我们先看看 clamp 的定义：

> clamp(MIN, VAL, MAX) 函数的作用是把一个值限制在一个上限和下限之间，当这个值超过最小值和最大值的范围时，在最小值和最大值之间选择一个值使用

定义有点抽象，看个例子就明白了：

```CSS
.css-clamp {
  width: clamp(200px, 50vw, 300px)
}
```

![css clamp][2]

从上面的 gif 里可以比较明显的感觉到，在不断调整浏览器大小的过程中：

- 当屏宽超过 600px 时，粉红色区域长度固定
- 而屏宽介于 400px 和 600px 之间时，粉色区域按照屏宽等比例变换
- 直到屏宽小于 400px 后，粉红区域又趋向固定。

这就是 clamp 的效果，它接受三个参数，分别是最小值、首选值和最大值；返回值默认是首选值，但是超出边界后返回最小值或最大值。还是以 `clamp(200px, 50vw, 300px)` 为例：

- 当屏宽小于 400px 时，首选值（50vw）小比下限（200px），所以返回最小值（200px）
- 当屏宽介于 400px 和 600px 之间时，首选值（50vw）介于最小值（200px）和最大值（300px）之间时，返回首选值（50vw）
- 当屏宽大于 600px 时，首选值（50vw）大比上限（300px），使用最大值（300px）

简单来说，`clamp(MIN, VAL, MAX)` 等价于 `max(MIN, min(VAL, MAX))`。上文提到，min 和 max 可以简化一些媒体查询的代码；clamp 作为更复杂的方法，“语法糖”效果就更明显了，我们看看如下用媒体查询来实现`clamp(200px, 50vw, 300px)`的效果的代码量，clamp 的优势就可见一斑了：

```CSS
.example {
  width: 50vw;
}

@media ( min-width: 600px ) {
  .css-min {
    width: 300px;
  }
}

@media ( max-width: 400px ) {
  .css-min {
    width: 200px;
  }
}
```

除了可以应用到 width、margin、font-size 这种比较常见的长度单位（Length）计算上，clamp 还可以在以下几个数据类型上使用：

- percentage：表示一个百分比，经常用以根据父对象来确定大小
- angle：用于颜色渐变、动画等相关属性上，单位有 degrees，gradians，radians，turns
- time：用于 animations、transition 等相关属性，单位有秒（s）和毫秒（ms）
- number：用于 CSS 变量（如：`:root{ --size: min(8px, 1rem） }`）
- frequency：表示频率维度，如语音的高低，单位有赫兹（Hz）和千赫兹（KHz）

## 小结

上文啰里啰嗦，事实上只讲了一个 CSS 函数，也没太重要的知识点；就是觉得作为一个开发人员，还是要关注一些新的趋势和方法的。我常年在一些跨国合作的项目中搬砖，常常觉得别人家写的代码很有特色——长期保持着一种上个世纪的实现风格，即便是早已淘汰的形式，依旧孜孜不倦地继续着。不知道大家有没有这种经历，也欢迎留言讨论。

[1]: ./img/css-min.gif
[2]: ./img/css-clamp.gif
