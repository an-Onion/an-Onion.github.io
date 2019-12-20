# Suspense plugin in Vue2

前几天看了一篇讲[react suspense][0]的文章，挺有趣的；所以翻了一下 vue 相关的实现，结果 Vue2 并不支持。所幸有人做了一个 plugin，虽然有点小众，但是如果有朋友想尝鲜的话，可以去这里学习一下——[vue-async-manager][1]。

## Overview

大型多页面项目中，我们常常使用组件懒加载来加快首屏渲染。Vue2 原生提供了一种半吊子的懒加载形式，如下所示：当页面渲染`my-component`时才动态加载`async-component`组件。`loadingComponent`会在异步组件加载过程中占据`my-component`的位置，并最终被渲染后的`async-component`取缔。但是，这个真心不好用！核心问题就是：异步组件里若还有进一步的异步操作（如 api 请求、异步子组件），这个`loadingComponent`就不起效果了。我曾经为了在 api 请求阶段显示 loading 画面，不得已在 JS 里操作 DOM，画面一度非常难看。

```javascript
import LoadingComponent from './LoadingComponent'

new Vue({
  components: {
    'my-component': () => ({
        component: import('./async-component'),
        loading: LoadingComponent,
        delay: 200
    })
  }
})
```

回过头来看**vue-async-manager**。它提供了一个叫`<Suspense>`的标签来解决上述困境。下面我会一步步介绍 Suspense 的使用方法。

## Get-started

 一切从安装依赖开始：

```bash
yarn add vue-async-manager
// or
npm i vue-async-manager
```

然后就在 main.js 里让 Vue 使用该插件即可：

```javascript
// main.js
import Vue from "vue"
import VueAsyncManager from "vue-async-manager"

Vue.use(VueAsyncManager)
```

## 懒加载

vuejs 通常使用 import 导入组件：

```javascript
import asyncComponent from './async-component.vue';
```

vue-async-manager 为了实现懒加载，提供了一个 lazy 方法来创建异步组件：

```javascript
import { lazy } from 'vue-async-manager'

const asyncComponent = lazy(() => import('./async-component.vue'))
```

异步组件创建后，使用方式与普通组件无异，只不过这个组件必须被包裹在`Suspense`标签内：

```html
<template>
  <Suspense>
    <asyncComponent/>
  </Suspense>
</template>

<script>
const asyncComponent = lazy(() => import('./async-component.vue'))

export default {
  name: 'App',
  components: {
    asyncComponent,
  }
}
</script>
```

一个懒加载组件的基本结构就实现了。

## Loading

我们回看一下 Vue2 原生实现，它还有一个叫`LoadingComponent`的默认组件，主要功能就是显示懒加载开始到组件渲染完毕期间的过渡效果。`<Suspense>`也有相同的功能，它是通过一个叫`fallback`的插槽注入了这个 Loading 组件：`<Suspense>`组件在完成渲染前会显示`fallback`插槽内容，直到异步组件以及相关异步调用结束为止。

```html
<template>
  <Suspense>
    <div slot="fallback">Loading</div>
    <asyncComponent/>
  </Suspense>
</template>
```

我们看一下效果：

![Loading][2]

## 资源管理器

上面提到过，Vue2 原始的懒加载有个天然的弱项：并不能监测异步组件内的异步操作，如 api 调用。`<Suspense>`怎么做的呢？

它提供了一个叫 createResource 工厂方法创建资源管理器——`this.$rm`。如下代码中，资源管理器的作用就是异步读取数据——`this.$rm.read(params)`；`<Suspense>`组件就会知道该组件正在异步调用api，并且会在调用结束后隐藏`Loading`；最后将异步调用的结果——`$rm.$result`——响应式地渲染到组件里。


```html
// async-component.vue
<template>
  <div>{{ $rm.$result }}</div>
</template>

<script>
import { getAsyncData } from 'api'
import { createResource } from 'vue-async-manager'

export default {
  created() {
    this.$rm = createResource((params) => getAsyncData(params))
    this.$rm.read(params)
  }
}
</script>
```

异步组件的其他异步响应——如进一步加载异步子组件以及相关 api 调用——也会被`<Suspense>`捕获，直至所有异步操作结束才隐藏`Loading`。

## Error

异步加载也可能出错，`<Suspense>`又为此增加了一个`error`插槽：

```html
<template>
  <Suspense>
    <div slot="fallback">Loading</div>
    <div slot="error">Error</div>
    <asyncComponent/>
  </Suspense>
</template>
```

使用方法也很简单，倘若异步加载失败，`fallback`插槽会自动切换到`error`插槽，效果如下：

![Error][3]

当然，你也可以设置 delay 时间，或是干脆自定义错误处理——将异步渲染过程中的后续错误收集到`handleError`中。

```html
<template>
  <Suspense :delay="200" @rejected="handleError">
    <div slot="fallback">loading</div>
    <asyncComponent/>
  </Suspense>
</template>
<script>
export default {
  methods: {
    handleError() {
      // Custom behavior
    }
  }
};
</script>
```

## 其他

除此之外，vue-async-manager 还与 vue-router、vuex、throttle、cache 等等工具有一定集成，有兴趣的小伙伴可以去查看[开发者文档][1]。


## 小结

这期介绍了一款 Vue2
的小众插件——**vue-async-manager**。它使得 Vue2 可以模拟类似于 React Suspense 的操作，增强了懒加载组件的功能。但是，我自己觉得这个小众`Suspense`还是比不过 react 的实现（又拍脑袋胡言乱语了）：它并没有很彻底地将取数据方法和组件逻辑解耦掉。听说 Vue3 会原生支持`<Suspense>`，查了一下并没有很详细的文档，很期待 Vue3 能给我们带来一套最优雅的解决方案。

最后，我还是得交代一下，Vue2 中的`<Suspense>`插件只适合尝鲜，并不推荐在生产环境里使用——**vue-async-manager**自己都标注为 deprecated 了😅。我只是对`<Suspense>`这个设计理念感兴趣，如果真正去使用，还是等到 Vue3 原生支持了再说吧。


[0]: https://dmitripavlutin.com/orthogonal-react-components/
[1]: https://github.com/shuidi-fed/vue-async-manager
[2]: ./img/loading.gif
[3]: ./img/error.gif
