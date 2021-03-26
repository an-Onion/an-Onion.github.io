# JS Module

随着 web 应用的持续开发，我们的代码量会出现井喷式的增长；一个 web 一个 JS 成了神话。工程上自然很容易找到解决方案：就是拆分文件呗，而这一个个被拆出来的 js 文件，就是本文的话题——module。

## introduction

在很长一段时期里，Javascript 是没有语义层面的 module 的；因为那时候 JS 文件很小、功能也不强，所以没啥必要。但是，随着技术发展，JS 功能出现了爆炸性地增长。人们不得不在工程上思考一系列的模块化方案，比较出名的有：

- AMD：基于[require.js][1]的一个模块化方案，用于浏览器端的 JS 加载
- CMD：稍晚于 AMD 出现的模块化方案。前者是推崇依赖前置，后者推崇就近依赖
- CommonJS：NodeJs 使用的模块化规范
- UMD：融合了 AMD 和 CommonJS 的一套规则方案

当然这些都是历史话题啦，可能老派的面试官会问一下它们的区别啥的，反正现在不大可能再基于上述啥啥 MD 的方案来构件 web 应用了。主要原因是 2015 年，JS 在语言层面引入了 module 机制，我们通常称呼为 ES module；后文就主要基于 ES module 来讨论模块化方案。

## Export & Import

ES module 笼统来说就两个关键词 `export` 和 `import`。

### export

export 用于暴露当前所在某块的变量或对象（function 也是对象）。export 最常用的使用方式是把它放在数据或对象的申明前：

```javascript
// hello.js
export function hello(name) {
  return `Hello ${name}`;
}

export const MODULES_BECAME_STANDARD_YEAR = 2021;
```

有时候，上例 export 方式会显得较为凌乱，有些人会喜欢集中处理，如下导出方式也是合法的——顺便我们还用 `as` 起个了别名：

```javascript
// hello.js
export { hello as sayHello, MODULES_BECAME_STANDARD_YEAR };

function hello(name) {
  return `Hello ${name}`;
}

const MODULES_BECAME_STANDARD_YEAR = 2021;
```

### import

import 顾名思义就是 export 的反向操作了；用于导入其他模块数据或对象。通常，我们并不需要导入依赖项的所有方法，所以最常用的是 `import {...}` 的方式按需导入。

```javascript
import { hello } from "./hello.js";
console.log(hello("World")); // Hello World
```

_p.s. 按需导入的好处，主要体现在[摇树（Tree shaking）][3]上。_

上面提到，ES module 提供了一个 `as` 关键字起别名；上文用在了 export 阶段，import 阶段同样可以起别名：

```javascript
import { hello as sayHello } from "./hello.js";
console.log(sayHello("World")); // Hello World
```

如果嫌弃按需导入比较麻烦，可以一次性把依赖模块的 export 内容一次性导入——`import * as`：

```javascript
import * as hi from "./hello.js";

hi.hello("World");
hi.MODULES_BECAME_STANDARD_YEAR;
```

第三种常用的 import 形式叫 `import "module"`，直接运行 `"module"` 里的代码，但是不会引入任何对象。

```javascript
// setupTests.js
import "@testing-library/jest-dom";
```

### Export default

上文提到一次性导入的话题，可是 ES module 并没有单纯的一次性导出的做法。也许你听过 `export default`，但它只能导出一个对象。举个例子，我们写 java 的时候一个文件只会有一个 public 的 class；虽然 javascript 并没有从语言层面限制一个文件里 class 的数量，不过从最佳实践的角度来说，通常也会写个 lint 确保这种约定俗成的规则：如 react、vue 里，我们通常只为一个文件导出一个唯一的 class：

```javascript
// Welcome.js
export default class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
```

注意： `import * as` 并不是导入依赖模块的 `default` 对象；导入 `default` 对象，我们最常用的是 `import XXX from` 的形式：

```javascript
import Welcome from "./Welcome";
```

下面两种形式也合法，只是没有上面简洁：

- `import { xxx as default }`

  ```javascript
  import { Welcome as default } from "./Welcome";
  ```

- `import *`

  ```javascript
  import * as Welcome from "./Welcome";
  const welcome = Welcome.default;
  ```

`export` 和 `export default` 并没有限制在同一个 module 里合用。

```javascript
// user.js
export default class User {
  constructor(name) {
    this.name = name;
  }
}

export function sayHi(user) {
  alert(`Hello, ${user}!`);
}
```

只不过我们推荐遵守以下规则：

- `export` 通常用于 library，打包一系列方法；
- `export default` 通常用于声明单独的实体，如一个 class。


### 阶段性小结

再简单总结一下import和export的使用方法：

- import 有四种形式:

  - 按需导入：`import { x [as y], ... } from 'module'`
  - 导入所有：import \* as obj from 'module'
  - 导入 default export：`import x from 'module'` 或 `import {default as x} from 'module'`
  - 运行导入模块，但不分配对象：`import 'module'`

- export 也有三种形式：

  - 声明导出： `export class/function/variable`
  - 别名导出： `export {x [as y], ...}`
  - default 导出： `export default class/function/variable`

最后再提一种 import 后不作处理，立即 export 的简写形式——`export ... from 'module'`。import 和 export 的几种方式此时可以进行排列组合；比如，下面两种形式等价，大家也可以自行尝试其他几种组合形式。

```javascript
import { hello } from "./hello.js";
export { hello as sayHello };
```

```javascript
export { hello as sayHello } from "./hello.js";
```

## Dynamic imports

上文的 import 准确来说应该称为“静态导入”；它的语法特点是：只能`import ... from`一个`字符串`：

```javascript
import ... from getModuleName(); // Error! only from 'string' is allowed!
```

更罔论通过条件判断或是方法引入：

```javascript
if(...) {
  import ... // Error, not allowed!
}

function load() {
  import ...; // Error, can't pout import in any block!
}
```

而所谓的动态导入就是要解决静态导入的这些限制。动态导入使用了一个类似于函数的操作——`import(module)`——返回一个模块的 promise，从而实现在运行时加载新资源的功能。由于它“很像”函数，所以 `import(module)` 可以在任何作用域块中使用，如：

```javascript
const {hello} = await import('./hello.js');
console.log(hello('World')); // Hello World

if(...) {
  const User = await import('./user.js');
  const user = new User();
}
```

上面说一直强调 `import(module)` “很像”函数，这里只是说它长得像函数，也能像函数一样调用；不过 `import(module)` 不支持 `call/apply`，所以并非真正意义上的 Function。这有点类似于 arguments 只是 array like 类型，并不是 array 一个道理。我们看待 `import(module)` 就把它当 `super()`一样看好了——一个特殊的 js 语法。

## script 标签

我曾经在[《一文搞懂 script 标签》][2]提到过 js module，我们在这里速览一遍，详细信息请移步[该文][2]。

- `type = "module"`： 如果在浏览器里使用 ES module，需要在 script 标签里添加`"module"`关键字：

  ```html
  <script type="module">
    import { hello } from "./hello.js";
    document.body.innerHTML = hello("Onion");
  </script>
  ```

- module 的默认加载机制是 `defer`，不过下载过程中会顺道把 `import` 导入的文件也给下载了

- nomodule: 我们通常会在 `<script type="module">` 下方再写一个 `<script nomodule>` 标签，用于兼容老版本的浏览器

- 外置脚本：即通过 src 属性引入外链脚本还要支持 CORS

## 其他 module 特性

### import.meta

首先想到的自然是查看当前 module 的信息喽，这些信息就放在 `import.meta` 里；内容不多，主要就俩：

- import.meta.url：当前模块的 URL 路径，比如`http://foo.com/bar.js`
- import.meta.scriptElement：相当于 `document.currentScript`，返回当前 `<script>` 标签的属性

```html
<script type="module">
  alert(import.meta.url); // script url (url of the html page for an inline script)
</script>
```

### use strict

module 里的 js 代码默认在文件头部添加了 `use strict`，非严格模式的代码会直接报错：

```html
<script type="module">
  a = 5; // error
</script>
```

### 顶级作用域相互独立

每个 module 都有自己的顶级作用域；换句话说，每个模块顶级的变量和函数互不可见，只能通过 `import/export` 形式互相调用。

```html
<script type="module">
  let user = "John"; // The variable is only visible in this module script
</script>
<script type="module">
  alert(user); // Error: user is not defined
</script>
```

当然如果你实在是想共享变量，也可以强行赋值给 window，如`window.user = 'Onion`，提升为 global 级别的变量；不过正常情况下我们不会这么做吧。

### 导入模块间共享对象

个人觉得这个算是一个负面特性。举个例子，我们在 admin.js 里导出一个对象；该对象同时被 1.js 和 2.js 导入，我只要在其中一处修改该对象的属性，另一个文件也会受到影响。

```javascript
// admin.js
export const admin = { name: "Onion" };

// 1.js
import { admin } from "./admin.js";
admin.name = "Garlic";

// 2.js
import { admin } from "./admin.js";
console.log(admin); // {name: 'Garlic'}
```

主要原因是：ES module 虽然可被多出引入，但是只能初始化一次；结合例子就是 `admin = {name: 'Onion';}` 只运行一次，所有 import 的 admin 都指向 V8 引擎堆内的同一块地址了，也就导致一处改变，处处受影响了。

解决方法也简单，写个工厂函数呗：

```javascript
export function adminFactory() {
  return { name: "Onion" };
}
```

### this

模块级作用域的 `this === undefined`；这只能算个小知识吧，大家可以自己试着跑一下：

```html
<script>
  alert(this); // window
</script>

<script type="module">
  alert(this); // undefined
</script>
```

## 小结

本文介绍了现代 JS 的模块管理手段，很常规的知识；现在前端开发通常使用构件工具（webpack、esbuild 等）帮住管理这类模块，使得我们有时候会遗忘最初的浏览器设置。前几天和同事聊到 `JSP => React` 搬迁的事，很多人一筹莫展；我后来提了一个思路，就是不动遗产代码，只在 JSP 头部加一个 `<script src="cloud.com/app.js" type="module">`，然后将所有工作都移步到 React，之后只要更新 `app.js` 就可以逐步完成前端迁移了。大家觉得怎么样呢？

[1]: https://github.com/requirejs/requirejs
[2]: https://www.jianshu.com/p/03c9c95dc815
[3]: https://developer.mozilla.org/zh-CN/docs/Glossary/Tree_shaking
