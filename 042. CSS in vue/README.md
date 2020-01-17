# CSS 模块化管理

昨天看了一道面试题，说如何管理 CSS 代码；它谈到了君子协定[BEM 规范][1]（然后楼主就说自己马上就拿到 offer 了😅）。但是，BEM 规范说实在已经不够接地气了，现代 CSS 开发的基调是模块化。这期就借此谈谈在 vue 项目中管理 CSS 的几种常用技术。

## 全局样式表

CSS 的初衷就是全局样式，并通过不同优先级的特征值覆盖其他样式。在 vue 开发中，我们一般会把全局的 CSS 样式表放在`/asserts/css/main.css`里，然后在入口文件 index.html 上加样式表的 link：

```html
<!-- index.htm -->
<link rel="stylesheet" type="text/css" href='/asserts/css/main.css'>
```

不过，在工程中一般会使用 webpack。Webpack 会帮我们把 css link 添加到 index.html 里；所以 vue 模版通常就直接在 main.js 里导入 main.css 了。

```javascript
//main.js
import Vue from 'vue'
import App from './App.vue'

// Importing the global css file
import "@/assets/css/main.css"

new Vue({
  render: h => h(App)
}).$mount('#app')
```

上面是最传统的 CSS 管理方式，但是我自己很少在 main.css 里添加代码，主要原因还是影响面太大；通常的做法还是在 vue 组件里添加局部样式（即便复用率不高，我也忍了）。

## `<style>` in vue

除了在全局样式文件里编写 CSS，Vue 原生组件还支持在组件内部定义样式表，也就是在 vue 的`<style>`标签里添加 CSS 选择器。这里科普一下：工程上，vue 文件通常有三种标签，`<template>`、`<script>`、`<style>`，分别盛放 html，js 和 css。但事实上 vue 文件只是一个模版，不可以直接运行，我们是依靠了 webpack 的`vue-laoder`将 vue 模版转换成 js 文件才得以运行；而`<style>`还需要`vue-style-loader`、`css-loader`等加载器才能最终编译到全局的 css 文件中。

通常，我们还会给`<style>`加一个叫`scoped`的属性；效果是：这里的 CSS 样式将只作用于当前组件（相当于组件级样式表）。当然，这些样式最终还是会作用到全局，只是耍了个小花招。我们看看样例：

```html
<template>
  <div class="content">Onion</div>
</template>

<style scoped>
.content {
  width: 300px;
}
</style>
```

scoped 属性会给涉及的 DOM 标签自动添加一个唯一属性——`data-v-{componentHash}`——为组件内的 CSS 指定作用域；接着 webapck 再把 scoped style 里的选择器改名为`.{className}[data-v-{componentHash}]`；最后，利用组合选择器（如，`.content[data-v-b52c41]`）的特性实现了所谓的 CSS 模块化管理了。

```html
<div class="content" data-v-b52c41>Onion</div>

<style>
.content[data-v-b52c41] {
  width: 300px;
}
</style>
```

## CSS modules

CSS modules 也是现在很流行的一种模块化管理技术，在 react 社区里应用得很多。Vue 里也可以作为 scoped 样式的替代方案。和 scoped style 相比，它也没啥神秘感的，写法上略有不同罢了：

* `<style>`里换一个叫`module`的属性
* `<template>`调用时，通过`$style`绑定 CSS 对象
* 在 webpack 里给 css-loader 加一个`modules:true`的参数

```html
<!-- Component.vue -->
<template>
  <div class="$style.content">Onion</div>
</template>

<style module>
.content {
  width: 300px;
}
</style>
```

```javascript
// webpack.config.js
rules: [
  {
    test: /\.css$/,
    use: [
      {
        loader: 'css-loader',
        options: {
          // enable CSS Modules
          modules: true,
          // customize generated class names
          localIdentName: '',
        }
      }
    ]
  }
]
```

我这里顺便定制了 class 类名：`[name]__[local]__[hash]`，也即`.{componentName}__{className}__{randomHash}`。最后生成的文件会是如下所示：

```html
<div class="Component__content__2Kxy9sid">Onion</div>

<style>
.Component__content__2Kxy9sid {
  width: 300px;
}
</style>
```

scoped style 和 CSS modules 都是利用 HASH 把组件内的 CSS class 唯一化；这样各个模块内的 CSS 就不会互相覆盖了。除此之外，CSS modules 比 scoped style 再多一个功能——可以使用数组或是对象语法：

```html
<template>
  <div>
    <p :class="{ [$style.red]: isRed }">
      Am I red?
    </p>
    <p :class="[$style.red, $style.bold]">
      Red and bold
    </p>
  </div>
</template>
```

## CSS in JS

所谓 CSS in JS，就是使用了一个叫 styled-components 的库；它把样式表定义写在了 JS 文件里（最后也会被抽取成某 CSS 文件，类名 hash 处理）。CSS in JS 最早也是在 React 社区里活跃起来的，后来有团队为 vue 也写了一个库，叫[vue-styled-components][3]，很快这个概念也迅速蔓延到了 vue 实战中。所谓 styled-components（样式化组件）就是写一个只包含样式，不包含业务逻辑的组件；这与我之前介绍过的[renderless components][4]恰巧相反。

用法如下：

* 安装 vue-styled-components

  ```bash
  yarn add vue-styled-components
  ```
* 写一个 styled 控件（JS 文件）

  ```javascript
  // @/components/content.js
  import styled from 'vue-styled-components';

  export const Content = styled.div`
    width: 300px;
  `;
  ```

  **p.s.** 这里`styled.div`是函数，之后跟一个模板字符串，用到了 ES6 的[Tagged templates][2]语法

* 调用该 styled component

  ```html
   <!-- Component.vue -->
  <template>
    <content>Onion</content>
  </template>

  <script>
  import { Content } from '@/components/content.js'
  export default {
    components: { Content },
  }
  </script>
  ```

OK，基本用法如上所示，但写成样式化组件有什么好处呢？很明显嘛，一是组件复用性更高；二是 vue 组件可以传 props 呀。

比如我们希望传一个 color 属性，定制字体颜色。传统方案基本只能在行内样式`:style`上做文章。但是行内样式的特征优先级太高，过多使用不利于维护。

```html
<template>
  <div :style="{color: customizedColor}">content</div>
</template>

<script>
export default {
  data: () => ({ customizedColor: 'red' })
}
</script>
```

这时候，样式化组件的优势就出来了：它修改的是 CSS class 的某个属性。我们看看怎么写带 props 的 styled component：

```javascript
// @/components/content.js
import styled from 'vue-styled-components';

export const Content = styled('div', {
  color: {
    type: String,
    default: 'black',
  }
})`
  width: 300px;
  color: ${{color} => color}
`;
```

写法有点变化，调用的是一个柯里化的函数`styled`，第一个参数是 DOM 标签，第二个参数就是 Vue 组件里常用到的`props`了；之后继续接模板字符串，这样在`${}`里就可以调用`props`值了（所以，你理解为什么要用模版字符这种写法了吧？）。使用如下：

```html
<template>
  <content :color="customizedColor">Onion</content>
</template>

<script>
import { Content } from '@/components/content.js'
export default {
  components: { Content },
  data: () => ({ customizedColor: 'red' }),
}
</script>
```

该组件渲染出来的 html 代码如下所示。相比原生组件只能绑定行内样式`:style`——直接作用到 DOM 标签上，样式化组件是将属性直接嵌入到 CSS 里，在代码易维护方面更进一步；此外，相比于原生组件使用组合选择器（如，`.content[data-v-7ba5bd90]`），样式化组件生成的是一个随机类名（如，`fGdyfT`），只有一个选择器，在渲染效率方面无形中也拉开了一点距离。

```html
<div class="fGdyfT">Onion</div>

<style>
.fGdyfT {
  width: 300px;
  color: red;
}
</style>
```

## 小结

这期介绍了现代前端技术中比较常见的四种 CSS 管理方式。从全局样式表，到 CSS modules，再到 CSS in JS，CSS 进化的趋势就是模块化。那为什么需要 CSS 模块化呢？CSS 本身的规则是全局的，任何一个样式变化，都对整个页面起效。于是，样式冲突（污染）的问题一直是 CSS 解不开的难题。传统的做法无非是把类命写长一点，多加几个选择器覆盖之前的样式表等等；加多了之后发现，这种代码根本无助于可读性，还不如直接使用 hash 避免冲突，再依据 source map 寻找模块代码来得有实在。

最后，至于项目中该使用哪一种技术，还是要视情况而定。客观上讲，CSS in JS 和 CSS modules 更强大更新颖，但在写法上很多人可能还转不过来；scoped style 虽然功能弱一些，倒也能满足基本需求。所以，还是需要项目决策者自行斟酌。

[1]: https://en.bem.info/methodology/css/
[2]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates
[3]: https://github.com/styled-components/vue-styled-components
[4]: https://www.jianshu.com/p/305b4ede9efd
