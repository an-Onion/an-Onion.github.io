# Vue portal

最近看了下 vue3 的新 feature，里面讲到了一个新的模版 tag——Portal （传送门）。顾名思义，它能将某个节点传送到 DOM 树的任意位置。今天就讲讲传送门的这个小知识。

![Vue Poratal][1.1]

## Dialog

我们在写 html 时，一般会自上而下地显示模块，不过某些小控件——如 Dialog、notification、popup——却是脱离固定的层级关系显示的。

![Dialog][1.2]

我们写一个名为**Contract**的小样例。为它的 Reject 操作做 double check：点击`Reject`按钮后，会弹出对话框告知用户再次确认之前的操作。该对话框是页面居中对齐，会脱离上下文布局。实现倒不难，CSS 设置`position:fixed`，然后再给`z-index`赋一个很大的值。

```html
<div class="contract">
  <!-- details -->
  <button @click="dialog = true">Reject</button>
  <dialog :open="dialog">
    <p>Are you sure?</p>
    <button @click="rejectContract">Yes</button>
    <button @click="dialog = false">No</button>
  </dialog>
</div>
```

但是！但是！这种实现导致的副产品贻害无穷——`z-index`开始被滥用了，在某些项目里，你会遇到这样的情况：无论怎么调整`z-index`大小，目标模块都不会出现在期望的位置上了——原因见[内容布局（一）：position 布局][2]。我刚开始学写 CSS 时，经常被`z-index`恶心到，大概稍微有点经验的前端开发都会有类似的体验。

之后，我记得在 jQuery 年代，人们已经把 Dialog 统一放到`<body>`底部了。好处是统一管理：不再受`z-index`层叠上下文的影响，还能共用一套 CSS 背景处理。缺点也很明显，dialog 的数据往往是动态渲染的，与关联模块的通信只能交由总线完成，也就是把 CSS 的管理成本转嫁给了 JS。

其实这就是套两难的选择：

1. dialog 与相关联的模块放在一起，数据绑定比较简单，但是 DOM 上下文会影响 CSS 效果
2. dialog 统一放在`<body>`底部，CSS 影响变小了，但是“远程通信”的代码量上去了

有没有更优雅的解决方案呢？有，Portal！

## Portal

Vue3 将会原生支持 Portal，但是现在毕竟还在 Vue2 年代，我们只能使用一个叫[portal-vue][3]的三方插件。安装如下：

```bash
yarn add portal-vue
```

然后在入口文件使用该插件：

```js
import PortalVue from 'portal-vue'
Vue.use(PortalVue)
```

使用方法也非常简单：在传送门入口`<portal>`内编写组件，绑定数据；页面渲染后，`<portal>`的内容会被镜像到了传送门出口`<portal-target>`处。

```html
<portal to="destination">
  <p>
  This slot content will be rendered wherever the 'portal-target' with name 'destination' is located.
  </p>
</portal>

<portal-target name="destination">
  <!--
  This component can be located anywhere in your App.
  The slot content of the above portal component will be rendered here.
  -->
</portal-target>
```

Portal，传送门这个词还是很贴切的。再回到示例代码`Contract`上：

```html
<!-- In some nested Vue component -->
<div class="contract">
  <!-- details -->
  <button @click="dialog = true">Reject</button>
  <portal to="reject-dialog">
    <dialog :open="dialog">
      <p>Are you sure?</p>
      <button @click="rejectContract">Yes</button>
      <button @click="dialog = false">No</button>
    </dialog>
  </portal>
</div>

<!-- before closing body tag -->
<portal-target name="reject-dialog"> </portal-target>
```

我们把对话框包在`<portal>`里，`<portal-target>`放到`<body>`底部。这样对话框内的数据和事件可以与就近的`contract`模块绑定；而渲染后的镜像位于`<body>`底部，CSS 就不会受`contract`层叠上下文影响了。非常优雅地解决了上述的两难问题。

## Stepper

除了经典的 Dialog，portal 还可以应用到其他场景里。下图截取至 UI 库[vuetify][4]的`<v-stepper>`组件。

![Stepper][1.3]

我多次使用到过该组件，功能非常完善，代码量也不小；所以在实现时我把每一步的`stepper-content`——滑动卡片——抽取到了不同嵌套层级的 vue 组件内。但是（又是但是），每一步`stepper-content`内的交互操作却要影响全局——如上`accept`、`confirm`、`finish`这些按钮会修改全局的`stepper`值。

我们自可以通过`props-$emit`或是 vuex 传递事件。然而写这种代码，不仅啰嗦，而且会有一种纯粹的“割裂感”。后来，我想了一下，完全可以把这些按钮统一放置一处，再由`<portal>`镜像到特定的`stepper-content`内；按钮布局便由所在组件自行处理，而事件响应则交由统一管理。实现上有点类似 Dialog 的反向操作。

## 小结

All in all, Portal 是一种**给外部模块渲染 DOM**的操作；该设计很巧妙地分离了**布局**和**事件**，我第一次看到时也是眼前一亮。

前段时间和人八卦“追新”的话题。具体问题自然要具体分析，但在节奏把控上，我个人更倾向于尽早跟上潮流。技术发展并不仅仅是增加些许语法糖，更多时候是一种理念的提升。Vue3 就加入了许多时新理念，虽然语法上依旧兼容 Vue2，但我这种老年开发再去看示例代码，已经是沧海桑田了。

## 相关

* [内容布局（一）：position 布局][2]

[1.1]: ./img/portal.gif
[1.2]: ./img/dialog.gif
[1.3]: ./img/stepper.gif
[2]: https://www.jianshu.com/p/e69fde5ba357
[3]: https://github.com/LinusBorg/portal-vue
[4]: https://vuetifyjs.com/en/
