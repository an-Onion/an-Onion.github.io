# CSS 变量

CSS 变量，又称为 CSS 自定义属性，是前端开发中比较新颖的知识点；但是由于很多前端开发人员专注于使用 UI 框架，CSS 反倒变成一个小众知识点了。本文就借次机会复习一下这个知识。

## Overview

变量对开发的意义不言而喻：减少重复，增加可读性，并保留未来统一修改属性的便捷性。

```css
header {
  color: #ff6f69;
}

footer {
  color: #ff6f69;
}
```

举个🌰，常规的 CSS 开发中，申明不同字体颜色，往往是通过硬编码 color 属性来实习。但发现没？上述代码中，`header`和`footer`用了同一种颜色，出于防重、可读性、敏捷性等一系列软件开发中的实际考量，我们很自然地会想到使用变量：

```css
:root {
  --red: #ff6f69;
}

header {
  color: var(--red);
}

footer {
  color: var(--red);
}
```

## 申明

CSS 变量以两个减号开头（`--`），并在特定选择器下定义具体的数值。下面代码中，我们给所有 div 元素定义了两个变量：`--pink`和`--green`。

```css
div {
  --pink: #f7f;
  --green: #7f7;
}
```

CSS 还提供了一个放置全局变量的地方——`:root`，它的作用域就是所有 html 下的 DOM 元素。

```css
:root {
  --bg-color: rgb(255,255,255);
  --content-padding: 1rem;
}
```

## var()

调用变量就得用到 `var` 函数了，如下所示直接在 value 位置调用已定义的变量即可：

```CSS
:root {
  --red: #ff6f69;
}

p {
  color: var(--red);
  border: 1px solid var(--red);
}
```

事实上，var 函数有两个入参：第一个参数就是 CSS 变量，而第二个参数是该变量的默认值——防止变量不存在：

```CSS
p {
  border: 1px solid var(--red, #ff6f69);
}
```

我们还可以在申明变量时调用其他变量：

```css
:root {
  --red: #ff6f69;
  --bg-color: var(--red);
}
```

甚至可以做一些简单的字符串拼接和数值计算：

```css
:root {
  --hello: 'hello';
  --content: var(--hello)' world';
  --size: 20;
  --margin-top: calc(var(--size) * 1px);
}
```

***注意***：var 只能作用于 value，不能作用于 key。以下是不合法的：

```css
.invalid {
  --margin: 'margin';
  var(--margin): 1rem; /* invalid */
}
```

## 局部变量

上面提到了全局变量，我们也可以声明局部变量（local variable）。所谓局部变量就是定义在 tag、class、id 等一系列选择器里的属性，这些局部变量服务于那些匹配特定选择器的元素。

举个🌰，我们为对话框定义一种特定的颜色变量——`--dialog-color`；如下所示，在类选择器 `.dialog` 里声明该变量的数值：

```css
.dialog {
  --dialog-color: green;
}
```

接着对话框相关的后代选择器就能访问到该变量了：

```css
.dialog span {
  color: var(--dialog-color);
  border: 1px solid var(--dialog-color);
}
```

而那些与 `.dialog` 无关的选择器试图调用该变量时，则不会产生效果：

```css
.alert {
  color: var(--dialog-color); /* invalid */
}
```

## Cascade & Inheritance

可能会有个疑问，同名的局部变量冲突了该如何抉择？

```css
:root {
  --color: blue;
}

p {
  --color: green;
}

.alert {
  --color: red;
}

* {
  color: var(--color);
}
```

* [Cascade 规则][1]

  CSS 解决冲突的方式一般就是 **cascade** （层叠）规则——优先级高的特征胜出。下方 html 中，三行元素的字体颜色应用的是同一个选择器——`* { color: var(--color); }`，但最终的渲染却大相径庭。

  ```html
  <span>blue</span>
  <p>green</p>
  <p class="alert">red</p>
  ```

  ![cascade rule][3]

  原因是他们分别选用了不同的变量：

  1. 第一行的`<span>`选择了全局变量——`blue`
  2. 第二行的`<p>`应用的是该标签选择器里的局部变量——`green`
  3. 第三行虽然也是`<p>`标签，但是类选择器的优先级高于标签，所以类（`.alert`）的变量胜出——`red`

* [Inheritance 规则][2]

  某些情景下，可能会出现一些违反 cascade 规则的情况，比如下方的`<i>`标签；它的字体应用的也是这条规则——`* { color: var(--color); }`，表面上它会适配`:root`里的全局变量——`blue`，但最终文字被渲染成了绿色。。。

  ```html
  <div class="alert">
    <p>
      <i>green</i>
    </p>
  </div>
  ```

  ![inheritance rule][4]

  原因是还有一个叫**inheritance**（继承）的规则，通俗来说就是子元素的某些属性会被设置成父节点的值。这里`<i>`标签的父节点是`<p>`标签，所以它的变量就会等于`p`的值了——`green`。

## 动态变量

在 CSS 变量出现前，less、sass 这类预编译语言已经开始使用变量了。但是 CSS 的变量又有些许不同：它是可以被 DOM 访问的，而后者只是一个中间变量，最终效果仅仅是文本替换——等同于 hard code。通俗点说，CSS 变量是 DOM 对象里的一个键值对（可以被更改），而 less 或 sass 的变量在 DOM 中并不会存在。

* Responsiveness

  在实践中，我们可以根据 CSS 这个特性，动态适配特定的变量，比如我们可以在响应式编程里使用该策略：

  ```css
  :root {
    --main-font-size: 16px;
  }

  media all and (max-width: 600px) {
    :root {
      --main-font-size: 12px;
    }
  }
  ```

  当屏幕变小时，`--main-font-size`的值会做响应式的变化，而那些引用了该变量的 CSS 选择器也会随之更改，这一点是 less 或 sass 所不能企及的。

* Javascript

  另外，DOM 可以访问 CSS 变量就意味着我们还可以通过 JS 操作 CSS 变量。这样就可以实现了修改一处变量，全局颜色更改的效果了：

  ```javascript
  const rootStyle = document.querySelector(":root").style;

  rootStyle.getPropertyValue('--color');
  rootStyle.setProperty('--color', 'green');
  rootStyle.removeProperty('--color');
  ```

## 小结

CSS 变量已得到主流浏览器的支持（IE 除外），是我们前端“武器库”里的常备工具了。相比于传统的样式表申明，CSS 变量让代码变得更加的简洁、灵活。除此之外，它是 DOM 元素的一个属性，所以我们也可以通过该变量实现 JS 和 CSS 的通信，是一个相对比较高级的开发技巧。

[1]: https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Cascade_and_inheritance#Understanding_the_cascade
[2]: https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Cascade_and_inheritance#Understanding_inheritance
[3]: ./img/cascade.png
[4]: ./img/inheritance.png
