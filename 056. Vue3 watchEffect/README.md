# Vue3 学习笔记之 watchEffect

最近在看 Vue3 的一些新 feature，顺道学习了一些 hooks 编程的思想，感觉挺有启发的。今天就以 watchEffect 这个很小的 case 为例，开启我的 Vue3 学习笔记。

## Vue2 v.s. Vue3

对所有初学者来说，Vue2 到 Vue3 最直观的改变就是 Composition API——几乎所有的 Vue2 options 方法都被放到了 setup 函数里：

```diff
+ import { onMounted, reactive, watchEffect } from 'vue'

export default {
  name: "App",

+  setup( props ) {
+    const state = reactive({ /*...*/ });
+    onMounted(() => { /*...*/ });
+    watchEffect(() => { /*...*/ });
+    return { state };
+  },

-  data: () => ({ state: /*...*/ }),
-  mounted(){ /*...*/ },
-  watch: { /*...*/ },
};
```

这是一个比较大的风格转变，通俗来说，就是从基于对象的编程（OOP）转向了函数式编程（FP）。

## 函数式编程

初学者可能分辨不清 OOP 和 FP 的区别。大家注意看 `onMounted` 和 `watchEffect` 方法的参数——箭头函数，大致能体会到不同之处了。

OOP 的特点是：对象（或 class）是数据（variable）和逻辑（methods）的封装。在 Vue2 时代，我们经常写如下代码：

```javascript
// vue2
export {
  data: () => ({count: 1}),
  methods: {
    message: (prefix) => `${prefix} ${this.count}`,
  },
  watch: {
    count() {
      console.log( this.message('Count is') );
    };
  }
}
```

Vue2 的内部实现比较复杂，不过对外表现的编程模式基本就是：对象调用自己的数据和方法——`this` + `.` 操作。所以在 Vue2 时代，我们通常会把相关的数据和操作写在同一个对象里。但是到了 Vue3 的 `setup` 里，你几乎不会用到 `this` 了；变成了让函数来调用对象或是另一个函数——就是 FP 的特点了。

```javascript
// Vue3
import { ref, watchEffect } from "vue";

export default {
  setup() {
    const count = ref(1);
    const message = (prefix) => `${prefix} ${count.value}`;

    watchEffect(() => {
      console.log(message("Count is"));
    });
    return { count, message };
  },
};
```

### 纯函数和负作用

本文不想过多介绍函数式编程，但是既然 Vue3 的风格转向了 FP，我们得遵守 FP 的规则——函数只应该做一件事，就是返回一个值。下面的一个 vue 组件就可以看做一个函数，通过 props 传入一个参数 name，返回一个 html。

```html
<template>
  <h1>{{ name }}</h1>
</template>

<script>
  export default {
    props: {
      name: String,
    },
  };
</script>
```

上面这个函数有什么特点呢？

1. 相同的输入产生相同的输出
2. 不能有语义上可观察的函数副作用

这个就是经典的纯函数（pure function）。

![pure v.s. impure][1]

不过现实中一个 Vue 组件可能还要做其他很多事，如：

- 获取数据
- 事件监听或订阅
- 改变应用状态
- 修改 DOM
- 输出日志

这些其他改变就是所谓的副作用（side effect）。在 FP 的世界里，我们不能向 Vue2 那样简单地调用全局插件了（`this.$t`、`this.$router`、 `this.$store`……）；而是通过间接的手段——即通过其他函数调用——包含副作用。Vue3 就提供了一个通用的副作用钩子（hook）叫做 `watchEffect`（从名字上也可见一斑），就是我们今天的主角了。

## watchEffect

兜兜转转，我们再来介绍一下 `watchEffect` 的用法，借助 typescript，我们可以很清晰地看到该函数的定义：

### 类型定义

```typescript
function watchEffect(
  effect: (onInvalidate: InvalidateCbRegistrator) => void,
  options?: WatchEffectOptions
): StopHandle;

interface WatchEffectOptions {
  flush?: "pre" | "post" | "sync";
  onTrack?: (event: DebuggerEvent) => void;
  onTrigger?: (event: DebuggerEvent) => void;
}

interface DebuggerEvent {
  effect: ReactiveEffect;
  target: any;
  type: OperationTypes;
  key: string | symbol | undefined;
}

type InvalidateCbRegistrator = (invalidate: () => void) => void;

type StopHandle = () => void;
```

### 第一个参数

`watchEffect` 自己是函数，它的第一个参数——`effect`——也是函数（函数是一等公民，可以用在各个地方）。`effect`，顾名思义，就是包含副作用的函数。如下代码中，副作用函数的作用是：当 `count` 被访问时，旋即在控制台打出日志。

```javascript
// Vue3
import { ref, watchEffect } from "vue";

export default {
  setup() {
    const count = ref(0);
    const effect = () => console.log(count.value);
    watchEffect(effect);

    setTimeout(() => count.value++, 1000);

    return { count };
  },
};
```

如上代码会打印出`0`和`1`，`0`是出于 Vue 响应式设计，在响应式元素（`count`）依赖收集阶段会运行一次 `effect` 函数；`1`是来自 `setTimeout` 里对 `count` 修改的操作。

### 清除副作用（onInvalidate ）

大家注意到没有？`watchEffect` 的第一个参数——`effect`函数——自己也有参数：叫`onInvalidate`，也是一个函数，用于清除 `effect` 产生的副作用。（而且 `onInvalidate` 的参数也是函数，哈哈！）

**\*p.s.** FP 就是这样，函数嵌套函数；初学者可能有点晕，习惯就好\*

`onInvalidate` 被调用的时机很微妙：它只作用于异步函数，并且只有在如下两种情况下才会被调用：

1. 当 `effect` 函数被重新调用时
2. 当监听器被注销时（如组件被卸载了）

如下代码中，`onInvalidate` 会在 `id` 改变时或停止侦听时，取消之前的异步操作（`asyncOperation`）：

```javascript
import { asyncOperation } from "./asyncOperation";

const id = ref(0);

watchEffect((onInvalidate) => {
  const token = asyncOperation(id.value);

  onInvalidate(() => {
    // run if id has changed or watcher is stopped
    token.cancel();
  });
});
```

### 返回值（停止侦听）

副作用是随着组件加载而发生的，那么组件卸载时，就需要清理这些副作用。`watchEffect` 的返回值——`StopHandle`依旧是一个函数——就是用在这个时候。如下 `stopHandle` 可以在 `setup` 函数里显式调用，也可以在组件被卸载时隐式调用。

```typescript
setup() {
  const stopHandle = watchEffect(() => {
    /* ... */
  });

  // 之后
  stopHandle();
}
```

### 第二个参数

`watchEffect` 还有第二个参数叫 `options`，类型是`WatchEffectOptions`，一个很复杂的接口。虽然很少能被用到吧，但也在这里快速提一下。

第二个参数的主要作用是指定调度器，即何时运行副作用函数。比如，你希望副作用函数在组件更新前发生，可以将 `flush` 设为 `'pre'`（默认是 `'post'`）。还有 `WatchEffectOptions` 也可以用于 debug：`onTrack` 和 `onTrigger` 选项可用于调试一个侦听器的行为（当然只开发阶段有效）。

```javascript
// fire before component updates
watchEffect(
  () => {
    /* ... */
  },
  {
    flush: "pre",
    onTrigger(e) {
      debugger;
    },
  }
);
```

### 注意点

`watchEffect` 会在 Vue3 开发中大量使用，这里说几个注意点：

1. 如果有多个负效应，不要粘合在一起，建议写多个 `watchEffect`。

   ```javascript
   watchEffect(() => {
     setTimeout(() => console.log(a.val + 1), 1000);
     setTimeout(() => console.log(b.val + 1), 1000);
   });
   ```

   这两个 setTimeout 是两个不相关的效应，不需要同时监听 a 和 b，分开写吧：

   ```javascript
   watchEffect(() => {
     setTimeout(() => console.log(a.val + 1), 1000);
   });

   watchEffect(() => {
     setTimeout(() => console.log(b.val + 1), 1000);
   });
   ```

2. `watchEffect` 也可以放在其他生命周期函数内

   比如你的副作用函数在首次执行时就要调用 DOM，你可以把他放在 `onMounted` 钩子里：

   ```javascript
   onMounted(() => {
     watchEffect(() => {
       // access the DOM or template refs
     });
   }
   ```

## 小结

watchEffect 基本上是现象级拷贝了 React 的 useEffect；这里倒不是 diss Vue3，只是说 watchEffect 和 useEffect 的设计都源自于一个比较成熟的编程范式——FP。大家在看 Vue3 文档时，也不要只盯着某些 api 的用法，Vue 只是工具，解决问题才是终极目标；我们还是要把重点放在领悟框架的设计思想上；悟到了，才是真正掌握了解决问题的手段。最后以独孤求败的一句名人名言结尾：

> 重剑无锋，大巧不工，四十岁前持之横行天下；四十岁后，不滞于物，草木竹石均可为剑。

[1]: ./img/pure-function.png
