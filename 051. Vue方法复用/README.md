# 复用那些事（Vue 版）

这期讲讲 vue 开发中常用到的一些方法复用小技巧。

## Plugins

插件开发其实就是给 Vue 原型链添加方法以便全局调用，vue 全家桶里的 vue-i18n（`this.$t('...')`）、vue-router（`this.$router(...)`）、vuex（`this.$store`）等等走的就是这个路线。我们也可以写自定义插件，见[Writing a Plugin][0]，但是效果很差！想想编程课教给我们的常识：绝大多数全局变量是有害的。且不说传统意义上的性能、可维护性这类问题；开发后期你会安装许许多多的三方插件，这些插件提供商往往用词很单调，极容易遇到命名冲突。假如你早早就把某个全局变量的坑给占了，之后非得用三方插件的时候，命名冲突的代价就太大了。我自己也给项目添加过插件，挺后悔的；开发人员应付全家桶里的方法已经够累了，还要顾及我的一个奇怪全局变量；唉，还是不要为难大家了。

## Import module

导入 JS 模块是另一种朴素的解决方案。下面是我从自己所属项目 repo 里摘抄过来的代码，太糟糕了！

```javascript
// Button.vue
import {fetch} from '~/utils/fetch.js'

export default {
  name: 'Button',
  methods: {
    fetch,
  }
};
```

为什么糟糕？我先给个常见的面试题：CommonJS 和 ES6 module 里的 this 有啥区别？解答如下：

> CommonJS this 指向当前模块，ES6 this 指向 undefined

这是常识！不要做一些魔改常识的事！如上代码将 fetch 方法注册到了 VUE methods 之中；运行时 fetch 里的 this 强行指向了 vue 实例，直接污染了上下文。再次强调：不要做一些魔改常识的事！即便你想用 Import module，也不要直接注册到 methods 里，至少得保持正常调用：

```javascript
// Button.vue
import {fetch} from '~/utils/fetch.js'

export default {
  name: 'Button',
  methods: {
    fetch () {
      return fetch();
    }
  }
};
```

## Mixins

上文提到 JS 模块导入是一种朴素的解决方案，换个说法其实就是所谓的“野路子”。官方有标准方案，叫[mixin（混入）][1]。

```javascript
export const myMixin = {
  data(){ ... },
  created () { ... },
  methods: {
    fetch() {
      console.log('My mixin!')
    }
  }
}
```

混入就是自己写一个包含任意 vue 选项方法的 JS 对象，并将其注册到常规 Vue 组件的 mixins 钩子里。Mixin 的方法将在运行时合并到 vue 对象中。

```javascript
// Button.vue
import {myMixin} from '~/mixin/fetch.js'

export default {
  name: 'Button',
  mixins: [myMixin],
  mounted(){
    this.fetch();
  }
};
```

混入最早也是来自于 React 社区，但是 React 官方很快就把它标记成了有害的😅。理由很简单：你完全看不出 minxin 给组件混入了多少东西；还有，mixin 和组件方法、mixin 之间常出现命名冲突；此外，开发中很直观的感受就是——如上——仅仅打开 Button.vue 文件，IDE 无法帮助跳转到 `this.fetch()` 的定义出处，可用性很差。

## provide / inject

除了混入外，官方还给了一个不推荐的方案叫[provide / inject][2]，又称依赖倒置（和 Spring 里的 DI 差距有点大）。基本思想就是在祖先结点 provide 一个方法，后代结点在 inject 钩子里注入方法名即可使用。有人还将`provide / inject`比作 React 里的 Context API。

```javascript
const Ancestor = {
  provide: [foo],
}

const Descendant  = {
  inject: ['foo'],
  created () {
    this.foo();
  }
}
```

现实很残酷，开发中基本没人去用它；官网里写不推荐是有原因的：前后代组件强耦合，后代组件必须包在某些特定组件下才能使用，易用性就太差了；此外，还是那个老问题，inject 里的方法不支持 IDE 静态检测，开发时很难受。

## HOC

HOC（高阶组件）又是一款民间强行移植过来的 React 方案，我曾经写过一篇文章（[《Vue 高阶组件》][3]）介绍 HOC，这里不展开了，有兴趣的朋友可以去看看。HOC 通过继承或委任，为不同的组件添加公共方法，实现代码复用。但是 HOC 移植到 Vue 有点哗众取宠的味道，亲测比 mixin 还难用：子组件的方法是运行时动态加入的，如下代码中 `this.fetch()` 简直迷之来源，肉眼看去毫无线索。

```javascript
// Button.vue
export default {
  name: 'Button',
  mounted(){
    this.fetch();
  }
};
```

## Slot-scope

[作用域插槽][6]是 vue 2.6 推出的新功能；民间很快就把这个新 feature 应用到了实践中——我也写过文章（[《Vue renderless 组件》][5]）介绍相关内容。简单来说就是写一个包含特定业务逻辑的非渲染组件（如下`<Counter>`）；通过 v-slot 的形式暴露公共方法或对象；并将这些方法或对象分享给组件内的插槽元素使用。

```html
<template>
  <Counter v-slot="{ count, increment }">
     <span>{{ count }}</span>
    <button @click="increment">Increment</button>
  </Counter>
</template>
```

作用域插槽是目前为止 vue2 里最优秀的解决方案：我们可以确切地得知可访问的属性与方法，不用再“猜测”来源；`slot-scope` 还得到了 vscode 插件的支持，这个易用性就提高了很多。不过，缺点也是有的：就是这一招只能在 `template` 里用，可惜了。

## Composition API

最后再介绍一下 vue3 新 feature——[Composition API][4]。正所谓“天下文章一大抄”，Composition API 现象级“借鉴”了 React Hooks。Vue3 给 vue 组件增加了一个`setup`函数；这个函数用于初始化模板里的属性和方法，包括所有的响应式属性、计算属性、观察者和生命周期钩子等等。`Setup` 内容比较多，暂时不展开了，我们先是把目光集中到本期主题上——如何复用代码。

如下所示，我简单梳理一下 Composition API 的使用方法：

1. 将业务相关的逻辑封装在 `userCounter.js` 文件里
2. vue 组件再通过 ES module 的形式引入 `userCounter.js`
3. `setup` 函数中得到组件所需的 public 属性和方法
4. 最后通过 `setup` return 的形式将上述属性和方法注册到模版中

```html
<template>
  <span>{{ count }}</span>
  <button @click="increment">Increment</button>
</template>

<script>
import useCounter from '~/use/userCounter.js';

export default {
  setup () {
    const { count, increment } = useCounter();
    return { count, increment };
  }
}
</script>
```

大家可以回看一下前面方案的一些缺陷，Composition API 几乎解决了所有问题：

* 通过 ES module 得到属性和方法，确切地指向了定义文件
* 注入的方法不会污染上下文
* 不需要添加全局变量
* 不会得到不明所以的方法混入
* 不受模板和组件范围的限制
* 若使用 typescript，编辑器还可以帮助我们进行类型检查和建议

Composition API 是一种更新的逻辑重用和代码组织方法。虽然 vue3 还没正式发布，相关三方库支持 Composition API 还有一段时间；但是看看隔壁 React 社区，大量的三方库已经完成了 React Hooks 重构。我们可以设想一下以后 vuex 的使用方法：

```javascript
// Vue3
setup() {
  const { commit, state } = useStore();
  const count = state.count;
  const increment = () => commit('increment', 1);
  return { increment, count }
}
```

再对比一下 vue2 里的 vuex 是怎么污染 Vue 原型链的，以及使用一些不明所以的`mapper`。代码可维护性一目了然。

```javascript
// Vue2
methods: {
  increment() {
    this.$store.commit('increment', 1);
  }
  ...mapState({
    count: 'count',
  }),
}
```

## 小结

这期复习了一下 vue 开发中常用的几种代码复用手段。内容狠简单，我觉得 vue 前端应该全部掌握，并积极使用更先进的实现方案。

几年前，我有幸从一个传统大泥团框架中跳脱出来，启动了一个 vue 项目。当时真心觉得“VueJs 的天是明亮的天……”，以为找到了前端银弹。但是好景不长，很快新项目也成了大泥团。原因很多也很无奈，怎么说呢，技术发展的趋势总体来说是积极向上的，比如 Vue 项目的下限自然高于 JSP；但是目前来说，所有框架的下限依旧处于“垃圾代码”的范畴中。因此，有效的技术管理才是项目“不至于过烂”的保障。上面提到的小技巧也许能在一人一时一地发挥作用，但是期望提升产品整体质量，负责人可能还是需要花更多心思的。

## 相关

* [《Vue 高阶组件》][3]
* [《Renderless 组件》][5]

文章同步自[an-Onion 的 Github](https://github.com/an-Onion/my-weekly)。码字不易，欢迎点赞。

[0]: https://vuejs.org/v2/guide/plugins.html#Writing-a-Plugin
[1]: https://vuejs.org/v2/guide/mixins.html
[2]: https://vuejs.org/v2/api/#provide-inject
[3]: https://www.jianshu.com/p/2535a3181662
[4]: https://composition-api.vuejs.org/
[5]: https://www.jianshu.com/p/305b4ede9efd
[6]: https://vuejs.org/v2/guide/components-slots.html#Scoped-Slots
