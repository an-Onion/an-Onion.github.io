# Storybook 科普

## Overview

今天科普一个有趣的前端开源工具——Stroybook，一个 UI 的可视化容器，可以视作组件库的 wiki。

> Storybook is an open source tool for developing UI components in isolation for React, Vue, and Angular. It makes building stunning UIs organized and efficient.

效果如下所示：左侧组件导航；右侧是组件细节，还可以做一些可视化操作。

![Story][0]

## 基本用法

我这里以 VUE 项目为例，简单介绍一下如何在项目里集成 storybook。
官方给出了一个极简的集成方法，只要在根目录的命令行敲下如下一行就行了。（本文结束😅）

```bash
npx -p @storybook/cli sb init --type vue
```

如上自动化集成方式太过精简，让人不知所措，所以我还是介绍一下手工集成的方式。

## 添加依赖

先在 devDependencies 里添加`@storybook`

```bash
yarn add @storybook/vue -D
```

官方文档里还会要求我们添加许多额外的依赖，但是现代的 vue 项目，一般都是用 vue-cli 脚手架生成的，它已经添加了足够多的 dev 依赖。一般来说是可以直接启动的，当然失败的话也会提示你缺少了某几个依赖，大家可以根据提示添加依赖。 `babel-preset-vue`是最高频的缺失，可能是这个库好多年没更新了，现在的脚手架已经把它忘了。如果没有，就照例添加即可。

```bash
yarn add babel-preset-vue -D
```

## 创建 config.js 文件

storybook 自然也有配置文件，我们在根目录里建一个`.storybook/config.js`文件。这里吐槽一下前端的配置文件，实在是太多太多了，根目录里基本全是这类东西了。多到我们组里开发了一年多的小朋友，还没认清所有。

然后在该配置文件里写上如下内容：

```javascript
// .storybook/config.js
import { configure } from '@storybook/vue';

configure(require.context('../src/components', true, /\.stories\.js$/), module);
```

配置文件也挺直白的，就是让 storybook 服务找到`src/components`文件夹下所有`.stories.js`结尾的文件。这里的每一个 story，都会指向一个 vue component，就把它当做该组件的说明即可。

## 写一个组件

我们在 `src/components` 下写一个自己的组件——`MyButton.vue`。

```html
<!- MyButton.vue ->
<template>
    <button class="button-style" @click="onClick">
        <slot></slot>
    </button>
</template>

<script>
export default {
    name: 'my-button',
    methods: {
    onClick() {
      console.log('Hello World!');
    },
  },
}
</script>

<style scoped>
.button-style {
    border-radius: 35% 10%;
    color: #FFF;
    background-color: #00bcd4;
    font-size: 2em;
    line-height: 1.2em;
    margin: 1em 1em;
    cursor: pointer;
}
</style>
```

组件很简单，就是封装了原生 button tag：加了点样式，并且当点击它时控制台能打出`Hello World!`

 ## 编写 stories

stories 其实可以随意放置，我这里就 follow 项目里 jest 的风格，把 stories 也放在了组件旁边。

 ```plain
 src/components
  ├── MyButton.vue
  ├── MyButton.stories.js
  └── MyButton.spec.js
 ```

@story/vue，其实就是在 js 文件里写了个无状态的 vue 组件，写法也很简单：引用组件，注册组件，模版封装。结束！

```javascript
// MyButton.stories.js
import MyButton from './MyButton.vue';

export default { title: 'My-Button' };

export const Component = () => ({
    components: { MyButton },
    template: '<my-button>my button</my-button>'
  });
```

## 运行 storybook


Storybook 的服务其实就是 webpack-dev-server，开发时可以热加载，很方便编写 stories 和 vue 组件本身。我们给服务设置个端口，比如 6006，开始运行：

```bash
yarn start-storybook -p 6006
```

不出意外的话，chrome 会自己打开`localhost:6006`。浏览器如下所示。左侧列出了组件导航，名字就是`MyButton.stories.js`的`title`；右侧是真实组件的样式，点击后，`@click`事件触发，打印出`Hello World!`

![My Button][1]

如果你想打包成静态资源发布，也很容易：

```bash
yarn build-storybook
```

默认会在根目录会创建一个`.out`文件夹，里面就是所有静态资源了。

## 插件系统

主线剧情就到此为止了，但是 storybook 远不止于此，它自带一种叫 addon 的插件系统。（不要问我，addon 和 plugin 的区别）。

我们可以自己写一个简单的 addon， 比如显示组件父亲的 border。
还记得上面的`.storybook/config.js`文件吗？我们的 addon 就是在里面调用`addDecorator`，给所有的 story 包一层`div`，并显示 border：

```javascript
//.storybook/config.js

import { configure, addDecorator } from '@storybook/vue';

configure(require.context('../src/components', true, /\.stories\.js$/), module);

addDecorator(() => ({
    template:`
      <div style="border:solid;">
        <story/>
      </div>`
  }))
```

看一下结果，border 显示出来了。

![Parent Border][2]

当然上面只是一个示例，现实意义不大，我自己组里开发的时候用到 vuetify，所以一般都会给所有控件包一层`<v-app></v-app>`，不然可能显现不出 v 组件效果来。

更多的时候，我们是直接集成社区里提供的 addon，比如[@storybook/addon-knobs][6]——用于调试 vue 的动态变量。

还是一步一步来，先装个依赖：

```bash
yarn add @storybook/addon-knobs -D
```

接着在`.storybook`文件夹下创建`addons.js`文件，并引入依赖

```javascript
// .storybook/addons.js
import '@storybook/addon-knobs/register';
```

然后启动服务，看到没？下面多了个**Knobs**的 tab：

![Knobs][3]

之后把 knobs 添加到每一个 story 就可以了。我们稍许修改一下代码，通过`storiesOf`形式注册 story：

```javascript
// MyButton.sotries.js
import { storiesOf } from '@storybook/vue';
import { withKnobs, text } from '@storybook/addon-knobs';

import MyButton from './MyButton.vue';

const components = () => ({
  components: { MyButton },
  props: {
    text: {
      default: text('Text', 'my button')
    }
  },
  template: `<MyButton>{{ text }}</MyButton>`
})

storiesOf('My-Button')
.add('components', components)
.addDecorator(withKnobs);
```

Knobs 根据 story 的 props 生成 mock 数据，并双向绑定对象组件的变量，效果如下：

![Knobs Button][4]

##  小结

这期科普了一个比较有趣的开发工具——Storybook，它可以很方便地帮助我们组织基础 UI 控件。不同的前端开发可以通过很直观的方式复用对方的组件，以期减少冗余代码。此外，我个人觉得编写 Story——可视化组件的最大意义还是在于**可测试**；之前的组件业务侵入太重，组件本身很难编写单元测试，因此前端的测试覆盖率一直非常低。现在想想，可能是我们本身就写错组件了，组件并非页面，应该独立展示，不该包含业务。希望 Storybook 也能帮助我们改善之前的困局。

[0]: ./img/sotrybook.gif
[1]: ./img/my-button.gif
[2]: ./img/self-div.png
[3]: ./img/knobs.png
[4]: ./img/knobs-button.gif
[6]: https://github.com/storybookjs/storybook/tree/next/addons/knobs
