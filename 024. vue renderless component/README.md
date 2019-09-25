# Vue renderless component

开门见山，我在[codepen][1]上写了个简单 demo：上下两个按钮，功能一致（开关）；不同之处是：前者只改变文字，后者顺带改变了背景颜色。OK，怎么实现呢？

![Two Toggles][2]

实现相同功能的模块，最理想的方式自然是提供通用的抽象组件。这个例子中，要实现更换背景色的效果，最直观的设计应该是实现一个通用的子组件，根据父组件传递的 props 值——比如一个叫 backgroud 的 function——联动更改背景色。
不过，在某些场景中，我们想要的是模块提供固定的功能逻辑，但并不希望它限制页面的渲染（比如，我希望给开关加上更酷炫的动态效果，而不仅仅只有更换背景色这种单调的操作）。组件设计者显然不可能尽善尽美地提供所有候选 props，这时候留出更多的自定义空间反倒是一个比较切合实际的解决途径。

## [Render 函数][3]

进入正题前，先简介一下 Vue 是如何渲染组件的。众所周知，在工程中，我们会在.vue 文件中定义`<template>`、`<script>`和`<style>`三种 tag，分别盛放组件 html、javascript 和 css。

```html
<template>
  <button class="mood">
    {{ state ? 'On' : 'Off' }}
  </button>
</template>

<script>
export default {
  data: () => ({ state: false })
}
</script>

<style>
.mood:after {
  color: white;
  background: blue;
}
</style>
```

但事实上，最后在生产环境中，我们只使用了一个巨大的 JS 文件——just JavaScript。究其缘由还是得益于 webpack 的 vue loader，它帮助我们把上述三部分提取出来，比如上述的.vue 文件，经过 vue loader 后，大体会成为如下这种样式：

```javascript
exprot default {
  template: `<button class="mood">{{ state ? 'On' : 'Off' }}</button>`,
  data: ()  => ({ state: false })
}
```

vuejs 会把 template 元素提取出来，并进一步编译成一个叫 render 的函数。（有关 render 函数可以参考[官方文档][3]）

```javascript
render(h) {
  return h(
    'button',
    {class: 'mood'},
    state ? 'On' : 'Off'
  )
}
```
render 函数最后会被 vue 优化成 VNode（虚节点），具体过程我不再这里细谈了。不过，这里提供了一个很有趣的思路：编写组件时，我们其实可以不写 vue 文件，不写 template，只需要写 render 函数。

```javascript
const button = {
  render(h) {
    return h(
      'button',
      {class: 'mood'},
      state ? 'On' : 'Off'
    )
  },
  data() {
    return {state: false}
  }
}
```

## So? Renderless

前提概要结束了，这里引入一个 Renderless component 的概念，直译的话应该叫非渲染组件，国内好多人喜欢叫它函数式组件。

Renderless 意思就是组件只提供数据操作，不渲染任何内容。我们先搁置争议，看看非渲染组件的具体实现。

```javascript
const toggle = {
    render() {
        ...
    },
    data() {
        return { state: true }
    },
    methods: {
        toggle() {
            this.state = !this.state
        }
    }
}

new Vue({
    el: '#parent',
    components: { toggle },
    ...
})
```
`toggle`就是所谓的 Renderless 组件了，只有数据和方法，不提供 html template。父组件直接将其放入 components 即可当作一般子组件使用。

### Slots in Renderless

那谁负责渲染工作呢？嗯，就是[Slots][4]！父组件通过传递自定义的 slots 来定制子组件的 html template。

```html
<toggle v-slot:default="{on, toggle}">
    <div class="container">
        <button @click="click(toggle)">
            {{on ? 'On' : 'Off'}}
        </button>
    </div>
</toggle>
```

这里提一下`v-slot`，它是 vue 2.6 以后的新语法，用来代替之前的`slot`和`slot-scope`；`v-slot:default`还可以简写成`#default`。Vue3 应该不会再保留`slot`和`slot-scope`这种不伦不类的标签了。

### Scoped Slots

```html
<toggle #default="{on, toggle}">
```

上文中用到了作用域插槽。这个例子中我希望能让插槽访问到子组件`toggle`里的数据和方法，以便之后点击 button 更改状态。子组件暴露作用域插槽也很简单，只要在 render 函数里返回`$scopedSlots`对象即可，这里因方便起见使用了默认的`default`插槽，自己实现的时候也可以重命名为任意插槽。

```javascript
//toggle.js
const toggle = {
    render() {
        return this.$scopedSlots.default({
            on: this.state,
            toggle: this.toggle,
        })
    },
    data() {
        return { state: true }
    },
    methods: {
        toggle() {
            this.state = !this.state
        }
    }
}
```

### Using toggle component

最后我们在父组件调用 renderless 组件：

```html
<template>
  <toggle v-slot="{on, toggle}">
        <div class="container">
            <button @click="click(toggle)">
                {{on ? 'On' : 'Off'}}
            </button>
        </div>
    </toggle>
</template>

<script>
import toggle from 'toggle';

export default {
  components: { toggle },
    methods: {
        click(fn) {
            fn()
        },
    },
}
</script>
```

这样一个简单的 renderless 开关就是实现了，

![Simple Toggle][5]

### Customized Component

假如你想自定义组件样式，或是说控制 toggle 渲染方式，更改也很容易，只需要在插槽里写下自定义代码即可：

```html
<toggle #default="{ on, toggle  }">
    <div class="container">
        <button @click="click(toggle)"
                :style="{background: on ? 'green' : 'red'}">
            {{on ? 'On' : 'Off'}}
        </button>
    </div>
</toggle>
```
因为 toggle 的逻辑不变，所以我们不需要更改这个 renderless 组件。只需稍微改动一下 slot，button 的背景色就会随着开关一齐改变了。嗯，这就是 Renderless 组件的效果，功能逻辑和页面渲染分开。

![Toggle with background][6]

更炫酷的开关就由大家来完成吧。

## 小结

这期用一个很简单的例子科普了 Renderless Component。所谓 Renderless 就是利用 render 函数和 slot，将组件的功能逻辑与前端渲染分离开来，这种设计更符合传统软件工程的单一职责和开放闭合原则。当然这和 VUE 设计之初的理念并不相符，vue 作者似乎并不屑于这种形式，我在尤雨溪的某些文章里还看到他喷 renderless 哗众取宠，带来无谓的的性能开销。
我自己倒是挺赞许 renderless 的。在工程开发中确实会碰到了功能逻辑相似，但样式表现不一的组件簇；通过将底层逻辑以 renderless 子组件的形式封装起来，可以很好地实现代码复用的目标。现实开发中，具体情况还是要具体分析滴。

[1]: https://codepen.io/anOnion/pen/WBggYx
[2]: ./img/two-toggle.gif
[3]: https://vuejs.org/v2/guide/render-function.html
[4]: https://vuejs.org/v2/guide/components-slots.html
[5]: ./img/simple-toggle.gif
[6]: ./img/complated-toggle.gif