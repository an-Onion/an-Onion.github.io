# HOC of vue

HOC（Hiher Order Components）也就是高阶组件，是最早由 React 社区推广开来的设计技巧。它其实就是一个工厂方法：传入一个旧组件（Component），返回一个改造后的新组件。实现上通过继承或委任，为旧组件添加或重载新的属性和方法。当多个组件实现相同的方法时，我们可以把公共方法抽取到 HOC 里，在生成新组件的时候为不同的旧组件添加公共方法，实现方法复用。

## 🌰

具体概念上面也提了，下面我们看看怎么实现 HOC 吧。写了个小例子：显示某书的一条评论（`Post`）以及它下方的回复列表（`Comments`）。

```html
<template>
  <div>
    <post />
    <comments />
  </div>
</template>
<script>
import Comments from './comments.vue';
import Post from './post.vue';

export default {
  components: [Post, Comments],
};
</script>
```

* post.vue

  Post 实现很简单，就是从 store 的 DataSource 里取数据，展示数据，顺变在 mounted 时监听一下该 Post 的内容的变更。

  ```html
  // Post.vue
  <template>
    <div>{{ content }}</div>
  </template>

  <script>
  import DataSource from '~/store.js';

  export default {
    name: 'Post',
    data () {
      return {
        content: DataSource.getPost(),
      };
    },
    mounted () {
      DataSource.addChangeListener(this.handleChange);
    },
    methods: {
      handleChange () {
        this.content = DataSource.getPost();
      },
    },
  };
  </script>
  ```

* Comments.vue

  Comments 会把评论列表给展示出来，实现上与 Post 雷同，content 就是一个数组，实现初始化和监听即可：

  ```html
  // Comments.vue
  <template>
    <ul>
      <li v-for="comment in content">
        {{ comment }}
      </li>
    </ul>
  </template>

  <script>
  import DataSource from '~/store.js';

  export default {
    name: 'Comments',
    data () {
      return {
        content: DataSource.getComments(),
      };
    },
    mounted () {
      DataSource.addChangeListener(this.handleChange);
    },
    methods: {
      handleChange () {
        this.content = DataSource.getComments();
      },
    },
  };
  </script>
  ```

贴了很多代码，篇幅一下上去了；但是代码很空洞，都是模版方法——取数据+监听变化。从提高代码复用考虑，这些模版方法都应该抽取到一个公共文件里——HOC 就是干这事的。

## Usage

上面提到过，HOC 就是一个工厂方法，传入旧组件，生产新组件；我们这里就用[Vue.extend][2]继承实现 HOC，大体就长这样：

```javascript
import Vue from 'vue';

export default (component) => {
  return component.extend({
    data() {
      //..
    },
    methods: {
      // ...
    },
    mounted () {
      // ...
    },
  });
};
```

如下所示，使用时就是用 hoc 方法生成高阶版本的 Post 和 Comments 组件——`hoc(Post)`和`hoc(Comments)`，然后注册到父组件里：

```html
<template>
  <div>
    <post />
    <comments />
  </div>
</template>
<script>
import Comments from './comments.vue';
import Post from './post.vue';
import hoc from './hoc.js';

const CommentsHoc = hoc(Comments);
const PostHoc = hoc(Post);

export default {
  name: 'App',
  components: {
    'comments': CommentsHoc,
    'post': PostHoc,
  },

};
</script>
```

## 重构

上面介绍了 HOC 的基本使用方法，接着我们把关注点放到如何共享相似逻辑的代码上去。我们再回去看看 Post 和 Comments 异同：

1. mounted 钩子里方法一模一样，重构时直接提到 hoc 即可

2. data 钩子里的`content`都是在获取`DataSource`的数据，我们把这类方法抽象为`getData(DataSource)`，也先提到 hoc 里。至于`getData`方法，我们可以在构造 hoc 时，把该方法通过参数传进来

3. methods 钩子里的 handleChange 道理同 data

```javascript
import DataSource from '~/store.js';

export default (component, getData) => {
  return component.extend({
    data () {
      return {
        content: getData(DataSource),
      };
    },
    mounted () {
      DataSource.addChangeListener(this.handleChange);
    },
    methods: {
      handleChange () {
        this.content = getData(DataSource);
      },
    },
  });
};
```

OK，我们再稍微改动一下父组件：

```javascript
// <template> is the same as before
import Comments from './comments.vue';
import Post from './post.vue';
import hoc from './hoc.js';

const CommentsHoc = hoc(Comments, (DataSource) => DataSource.getComments());
const PostHoc = hoc(Post, (DataSource) => DataSource.getPost());

export default {
  components: {
    'comments': CommentsHoc,
    'post': PostHoc,
  },

};
```

## Further

OK，经过上面的重构，Commments 和 Post 的所有方法都被提取出来了，你可以把他们各自的`<script>`给删了，并照常使用。但是，纯 template 的 vue 文件会很奇怪：无缘无故绑定了一个`{{ content }}`, lint 会报错，单元测试也很难写：

```html
<!-- Post.vue -->
<template>
  <div>{{ content }}</div>
</template>
```

所以，一般我们还是会用 props 来指明 template 绑定的数据：

```html
<template>
  <div>{{ content }}</div>
</template>

<script>
export default {
  name: 'Post',
  props: {
    content: {
      type: String,
      default: '',
    }
  }
};
</script>
```

hoc 方法还得小改一下，使用委任（[Vue.component][3]）的方法生产新的组件，并将 content 以 props 的形式传递给各个目标组件：

```javascript
import DataSource from '~/store.js';
import Vue from 'vue';

export default (component, getData) => {
  return Vue.component('Hoc', {
    render (createElement) {
      return createElement(component, {
        props: {
          content: this.content,
        },
      });
    },
    data () {
      return {
        content: getData(DataSource),
      };
    },
    // methods and mounted the same as before
  });
};
```

## 小结

这期又写了一篇 Vue 里（强行）应用 React 技术的小文章：HOC 通过继承或委任，为不同的组件添加共有方法，实现代码复用。但是，我没感觉出 hoc 有多少便利😅；用了点奇技淫巧，就真的比[vue mixin][1]好了吗？在 Vue2 圈子里，hoc 一直只存在于“民间”，官方也没强推过；我猜 Vue HOC“不好用”可能是共识吧？（所以，我这篇文章的意义是什么？🤔🤔🤔）

[1]: https://vuejs.org/v2/guide/mixins.html
[2]: https://vuejs.org/v2/api/#Vue-extend
[3]: https://vuejs.org/v2/api/#Vue-component
