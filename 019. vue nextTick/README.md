# Vue nextTick

最近自己做了个 demo，想实现这样一个功能：打开 dialog 后，光标能 focus 在输入框里。

![dialog][1]

但在实现的时候遇到了一个小问题，今天就根据这个小问题 介绍一下 vue 的一个知识点——nextTick

## focus

先从这个 demo 讲起。内容很简单，就是一个[vuetify 的 dialog][2]，点击该`DIALOG`按钮后，就会有个输入框。目标是让光标停留在这个输入框里。

```html
<v-app id="app">
    <v-dialog v-model="show" max-width="290">
        <v-btn primary dark slot="activator">DIALOG</v-btn>
        <v-card>
          <v-card-title class="headline">
              Simple Form
          </v-card-title>

          <v-text-field ref="txt" label="Input"></v-text-field>
        </v-card>
    </v-dialog>
</v-app>
```

刚开始我的想法很 native：watch 一下`show`值，如果是`true`就调用`focus()`方法。

```javascript
new Vue({
  el: '#app',
  data () {
    return {
      show: false,
    }
  },
  watch: {
    show(val) {
      if (!val) return;

      this.$refs.txt.focus();
    },
  }
})
```
**但这并没有什么用。**

![failed][3]

OK，debug 一下。当断点打在`this.$refs.txt.focus()`上时，整个 dialog 内容是`dispaly:none`。复习一下`dispaly:none`，它是不渲染页面流的。也就是说，我试图将光标 focus 在一个未被渲染的输入框中。这必然是失败。

## Vue 开发者文档

至于为什么会这样，我们看看[Vue 开发者文档][4]。这里提到了异步更新队列：
> Vue**异步**执行 DOM 更新

当观察到数据变化后，Vue 将开启一个队列，缓冲所有在同一事件循环中发生的数据改变。缓冲策略的好处就是去重，这就避免了同一个 DOM 重复的数据计算。

上文的例子中，当`show`被置为`true`后，组件`<v-dialog/>`并没有被立即渲染，而是被放到了下一个‘tick’中更新。这就打断点后整个 dialog 依旧是`dispaly:none`的原因了。那怎么解决这个问题呢？文档里也提到了可以使用`Vue.nextTick(callback)`。稍作修改，效果就立马显现了。

```javascript
new Vue({
  ...
  watch: {
    show(val) {
      if (!val) return;
      // Dialog haven't been rendered
      this.$nextTick( () => {
        // Dialog DOM rendering finishes
        this.$refs.txt.focus();
      });
    },
  }
})
```

![success][1]


## nextTick

当然，使用 Vue API，假若知其然不知其所以然，并不能给我们带来太大帮助。我们还是得看看原理的：Vue 实现响应式并不是数据变化后立即更新 DOM 的，而是根据一定策略在下一个时间点（next tick）里响应 DOM 变化。具体怎么实现，有兴趣的小伙伴可以看一下 vue 源码 Watcher 这一块的[update 方式][5]。有点复杂我这里就不深入讲解了。

不过，所有的实现最终依靠的是[src/core/util/next-tick.js][6]这个文件里的函数——nextTick。内容不多，加上大段的注释也就 100 来行。我摘抄了核心部分——`timerFunc`实现：

```javascript
const callbacks = []
let pending = false

function flushCallbacks () {
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}

let timerFunc // core function

if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
  }
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {

  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // Fallback to setTimeout.
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}
```

有点长，但是代码还挺容易看懂的，主要工作就是根据浏览器的兼容情况选择`timerFunc`的不同实现方法。`timerFunc`作为 nextTick 的核心模块，说白了，主要功能就是将回调函数延迟到下一个 tick 执行： 默认是 Promise 实现的，在 IE 里用的是 MutationObserver，对那些更古老的浏览器，就用 setImmediate 或是 setTime 实现。从`timerFunc`可以看得出，vue 团队主要精力还是在了兼容各种版本的浏览器上了。（汗）

Anyway，我们一般的开发也就兼容到 IE 为止了，所以 Vue2 的最终版将 nextTick 定性为了 microtasks（我在以前的博客介绍过[microtask 和 macrotask][7]）。Microtask 的好处是可以绕开一些事件操作的诡异行为，坏处就是会影响到冒泡和一些顺序执行的操作。我记得 nextTick 的实现，Vue 团队在 microtask 和 macrotask 之间反反复复了好几回，其中的 tradeoff 可见一斑。

最后部分是 nextTick 函数本体实现，我们把上面`timefunc`部分精简一下放到一起：

```javascript
const callbacks = []
let pending = false

function flushCallbacks () {
  pending = false
  callbacks.forEach( cb => cb() )
}

let timerFunc = () => {
    Promise.resolve().then(flushCallbacks)
}

function nextTick (cb, ctx) {
    let _resolve
    callbacks.push(() => {
        if (cb) {
            cb.call(ctx)
        } else if (_resolve) {
            _resolve(ctx)
        }
    })

    if (!pending) {
        pending = true
        timerFunc()
    }

    if (!cb) {
        return new Promise((resolve) => {
            _resolve = resolve
        })
    }
}
```

如上所示，调用 nextTick 时，既可以传入回调函数，又可以 Promise 化。前者是将所有回调压入 callbacks 数组，最后在下一个 microTask（Promise.resolve().then）里执行`flushCallbacks`操作；后者是当`_resolve`函数执行（在`flushCallbacks`同一个 microTask 里），等再下一个 microTask 里执行 then 逻辑操作。我们试一下最后的 Demo：

```javascript
nextTick().then( () => {
    console.log('Onion')
})

nextTick(() => {
    console.log('Hello')
})

nextTick().then( () => {
    console.log('Garlic')
})

nextTick(() => {
    console.log('World')
})
```
输出如下，如预期一样，Hello 和 World 在第一个 microTask 里，Onion 和 Garlic 在接下来的两个 microTask 里。

```javascript
Hello
World
Onion
Garlic
```

## 总结

今天借着某个常见的需求介绍了一下 vue nextTick 的知识。我们了解到数据变化到 DOM 渲染是一个异步过程，发生在不同的 tick 里。虽然 Vuejs 通常鼓励开发人员沿着“数据驱动”的方式实现代码，尽量避免直接接触 DOM。但是有时候不得不操作 DOM，我们可以在数据变化后立即使用`vm.nextTick(cb)`，这样回调函数会在 DOM 更新后就会被执行。

[1]: ./img/dialog.gif
[2]: https://vuetifyjs.com/en/components/dialogs
[3]: ./img/failed.gif
[4]: https://cn.vuejs.org/v2/guide/reactivity.html#%E5%BC%82%E6%AD%A5%E6%9B%B4%E6%96%B0%E9%98%9F%E5%88%97
[5]: https://github.com/vuejs/vue/blob/dev/src/core/observer/watcher.js#L164
[6]: https://github.com/vuejs/vue/blob/dev/src/core/util/next-tick.js
[7]: https://www.jianshu.com/p/d4b5170a5c94