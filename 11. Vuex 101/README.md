# Vuex 101

说起vuex，vue开发人员必定使用过。我也用过，不过一直是copy-paste based developmement。后来开始接触graphql了，就很少再用vuex了，现在也基本淡忘了。今天回看了自己以前写的代码，vuex使用一团糟，胡学瞎用最后成了技术债。

## 组件化开发

现代主流的web应用基本上都是组件化开发的思路，下图是其中一个很常见的web组件架构：后端只提供单纯的数据读写服务，前端负责主要的业务流；后来，随着前端日益沉重，又从中分出了一个中间层管理缓存和数据状态（Cache & State）。Vuex就是这个中间层里管理状态的一个工具。

![Component-based App][1]

Vuex 的功能类似于总线，使用的是全局单例模式。下图是vuex模式下的单向数据流：

* **State**：驱动应用的数据源；

* **View**：以声明方式将 state 映射到视图；

* **Actions**：响应在 view 上的用户输入导致的状态变化。

![data flow][2]

OK，我以前写代码的时候就看到上图，后来照着网上的demo胡搬滥造（捂脸），结果vue组件里到处都是如下代码片：

```javascript
let logo = this.$store.state.company.info.logo;

this.$store.commit('company/info', info);
```

store之后的一堆field又臭又长，全文检索密密麻麻。后来起新项目的时候，我就几乎不再用vuex了。前段时间和组里的一个小朋友聊vuex的时候，他告诉我vuex是这样的（当时惊了……）：

![vuex-flow][3]

组件产生actions后，在store里commit mutations方法，mutations随之更新state，最后由Getter方法反映到组件里。一套很优雅的实现：状态的变化实现了高度统一管理。比起我当年的写法，代码变得更加简洁高效。（一百分）

## Demo

简单写了个demo，用代码来反映一下上图所示的数据流。下图由两个组件构成：

1. *Selected* 所在行：用于显示vuex里的state 
   
2. 三个radio组成的选择面板：用于触发vuex action，从而更新state。



![Demo][4]

### State

首先自建一个store.js，用来管理所有vuex state相关的数据以及操作。`state`就是我们要管理的全局状态，它是一个任意指定的对象。

```javascript
const state = {
  radio: '',
};

const actions = { ... };

const mutations = { ... };

const getters = { ... };

export default new Vuex.Store({state, getters, mutations, actions});
```

### Actions

Actions是一组对vue组件开放的api集合。现在的前端开发很少再在vue methonds里直接调用后端api了，更多的是通过这类action统一代理；当然，在vuex里它的主要工作还是commit mutations里的方法，比如这里的`updateRadio`。

```javascript
const actions = {
  selectRadio ({commit}, val) {
    commit('updateRadio', val);
  },
};
```

### Mutations

接着就是刚提到的mutations了。Mutations里也是一系列方法集，它的功用类似于vuex里的私有方法，由上一层actions触发，并直接修改state。

```javascript
const mutations = {
  updateRadio (state, val) {
    state.radio = val;
  }
};
```

### Getter

最后一部分就是Getter集合，顾名思义，它的功用是对vue组件暴露state的特定状态。

```javascript
const getters = {
  getRadio () {
    return state.radio;
  }
}
```

### Mapper

vuex的map方法是新版本里的一大亮点（学Redux的），也是我重学vuex后最大的收获：Store里的Actions和Getters通过[解构(Destructuring assignment)][5]赋值为`methods`和`computed`的方法。（对，就是那三个点）


```html
<template>
    <h1>Selected: {{ getRadio }}</h1>

    <label v-for="o in ['Onion', 'Ginger', 'Garlic']">
        <input @click="selectRadio($event.target.value)"
            name='seasoning' type='radio' :value=o>
        {{ o }}
    </label>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  methods: {
    ...mapActions(['selectRadio']),
  },
  computed: {
    ...mapGetters(['getRadio']),
  }
};
</script>
```

如上所示，我们可以在`input`的点击事件里直接绑定action方法`selectRadio`，并在该事件触发后通过getter方法的`getRadio`展示state里radio的状态。

## 小结

可能是近来有点脱产了，vuex也没上心学习一下；要不是组里小朋友提醒，我可能都不愿意去碰它了。人不学，不知道，要时刻牢记技术是我等底层小职员安身立命的唯一选项。

[1]: https://upload-images.jianshu.io/upload_images/14368237-0db515890e6a15d1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[2]: https://upload-images.jianshu.io/upload_images/14368237-a999b61352ac649a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[3]: https://upload-images.jianshu.io/upload_images/14368237-2298ee815b135715.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[4]: https://upload-images.jianshu.io/upload_images/14368237-b4a8017f2111f261.gif?imageMogr2/auto-orient/strip
[5]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment