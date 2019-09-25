# VUE 事件修饰符

## 简介

在原生 DOM 绑定事件的年代，我们经常会使用到 e.preventDefault() 或 e.stopPropagation()等操作。
```javascript
document.getElementById('menu').onclick = function(e) {
  e.preventDefault();
  //...
}
```
Vue.js 为了简化这种常见需求，为 v-on 提供了一个叫[Event Modifiers][1] (事件修饰符)的语法糖。vue2 共提供了五个事件修饰符：
* ***.stop*** 阻止事件向上冒泡，等价于添加`event.stopPropagation()`
* ***.prevent*** 阻止元素发生默认的行为，等价于添加`event.preventDefault()`
* ***.capture*** 在捕获阶段触发监听函数
* ***.self*** 只当 `event.target === event.currentTarget` 时触发处理函数
* ***.once*** 事件将只会触发一次
* ***.passive*** 表示 listener 永远不会调用 `preventDefault()`

## 事件传播


W3C 的 DOM 标准中，一次事件包含三个步骤：
> 捕获 -> 到达目标 -> 冒泡

举个简单的[例子][2]，当点击`Inner`标签时，事件传播顺序是 `Outer` -> `Middle` -> `Inner` -> `Inner` -> `Middle` -> `Outer`。
![outer-middle-inner](https://upload-images.jianshu.io/upload_images/14368237-ea397bb3462bdfda.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

```vue
<main @click.capture="listener($event, 'Capture')">
    Outer
    <section v-on:click="listener($event, 'Bubble')">
      Middle
      <a href="javascript:console.log('default')"> Inner </a>
    </section>
</main>
```

1. 事件捕获阶段（event  capturing）
通俗来说就是当点击`Inner`标签后，浏览器会从根节点由外到内进行事件传播。
![Event Capturing](https://upload-images.jianshu.io/upload_images/14368237-ad80131a7429a077.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


2. 事件冒泡阶段 （event bubbling）
捕获阶段结束后，事件到达目标元素，接着就开始从内往外传播事件。
![Event Bubbling](https://upload-images.jianshu.io/upload_images/14368237-6001fa7db0be8895.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

要阻止冒泡继续向外传播的话，添加`.stop`修饰符即可停止冒泡。如下，再给`<section @click.stop="listener">`加`.stop`后，只会打印`SECTION Bubble`。

```vue
<template>
  <main class="hello"  @click="listener">
      Outer
      <section @click.stop="listener">
        Middle
        <a href="javascript:void(0)"> Inner </a>
      </section>
  </main>
</template>

<script>
export default {
  name: 'HelloWorld',
  methods: {
    listener: function (e, msg = 'Bubble') {
      const current = e.currentTarget.nodeName
      console.log(`${current} ${msg}`)
    },
  },
}
</script>
```


## 事件监听

`v-on`监听 DOM 事件，本质上是调用了[`addEventListener`][3]

```javascript
/**
 * @param type 事件类型，如click
 * @param listener 监听函数
 * @param useCapture 是否采用事件捕获
 */
addEventListener(type, listener, useCapture=false)
```

默认的`v-on:click="listener"` (`@click` 为`v-on:click`语法糖), 等价于`addEventListener('click', listener)`。所以一般的 v-on 监听只在冒泡阶段才触发。若想在捕获阶段触发事件必须加上`.capture`修饰符。

**注意：**`v-on:click.capture`只在捕获阶段触发，不会在冒泡阶段触发。要想两个阶段都触发，只能写两套：
```vue
<div @click.capture="listener" @click="listener" >
...
</div>
```

## 事件委托

当页面中存在大量元素而且每一个都要一次或多次绑定事件处理器时，大量的事件绑定会影响页面性能。一个简单而有效的技术就是***事件委托***。它也是基于冒泡机制，只要给父级元素绑定处理器，就可代理子级元素上的所有事件。稍微修改一下原例子：

```vue
<main class="hello">
    Outer
    <section @click.prevent="listener">
      Middle
      <a href="#1">Inner1</a>
      <a href="#2">Inner2</a>
      <a href="#3">Inner3</a>
    </section>
</main>
```

```javascript
listener: function (e) {
      console.log(`Get ${e.target.href}`)
    }
```

给`<section @click.prevent="listener">`加上`.prevent`修饰符阻止`<a>`标签的默认跳转行为。当点击`<a>`元素时，事件向 DOM 树上层冒泡，被`<section>`元素接受，然后触发 listener。这样，仅添加一个 listener 到父级元素，就可以实现代理了。

## 其他

上面提到了`.stop`、`.prevent`和`.capture`，再简单介绍一下剩余几个修饰符。`addEventListener`其实还有另一种调用方法:

```javascript
/**
 * capture: 表示 listener 会在该类型的事件捕获阶段传播到该 EventTarget 时触发。
 * 
 * passive: 表示 listener 永远不会调用 preventDefault()。
 *          如果 listener 仍然调用了这个函数，客户端将会忽略它并抛出一个控制台警告。
 *          
 * once:    表示 listener 在添加之后最多只调用一次。
 *          如果是 true，listener 会在其被调用之后自动移除。
 */
addEventListener(type, listener ,
       {capture: Boolean, passive: Boolean, once: Boolean});
```
`.capture` `.once` `.passive`本质上就是给上述三个 Boolean 值赋 true。

`.self`是 vue 自带的语法糖，表示事件由本身触发，不是来自子节点。顺带提一下，使用修饰符时顺序很重要，在某些场景中:
> 用`v-on:click.prevent.self`会阻止所有的点击，而`v-on:click.self.prevent`只会阻止对元素自身的点击。

#### 小结

今天通过 vue 的事件修饰符，简单回顾了一下浏览器的事件机制。以 react，angular，vue 为代表的前端框架极大地提升了工程师的开发体验，但是学完框架不去了解冒泡、捕获、传播、委托等基础知识，当需要解决更细节的问题时就略显颟顸了。



[1]: https://cn.vuejs.org/v2/guide/events.html#%E4%BA%8B%E4%BB%B6%E4%BF%AE%E9%A5%B0%E7%AC%A6
[2]: https://codepen.io/anOnion/pen/QZVMbo
[3]: https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener
