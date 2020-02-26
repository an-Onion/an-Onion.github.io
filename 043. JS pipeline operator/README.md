# JS 管道操作符

最近看到 tc39 的一个提案，叫管道操作符（[Pipeline Operator][0]），是一个 stage 1 的提案。我挺期待这个新语法的，本文就随便聊聊这个可能在不远将来出现的新操作符——`|>`。

## Overview

管道操作符（`|>`）的用法如下，以管道的形式从左至右输送对象（`expression`），并在通过`|>`右边的函数（`function`）后返回计算结果：

```javascript
expression |> function
```

本质上，管道操作就是链式调用函数的语法糖，上述表达式等效于如下代码。

```javascript
function( expression )
```

## Usage

看了上面`|>`的定义，可能觉得没啥卵用；我们写一个简单的例子，对比一下管道操作和普通函数调用的区别：

```javascript
const greeting = name => `Hello ${name}`;
const name = 'World';

console.log(name >| greeting); // pipeline way
console.log(greeting(name)); // fucntion way
```

嗯，确实没什么用😅。不过，单纯地调用一个函数，看不出太大效果，写一个复杂一点的链式操作：

```javascript
const greeting = name => `Hello ${name}`;
const toUpper = str => str.toUpperCase();
const exclaim = str => `${str}!!!`
const name = 'Onion';

console.log(name >| greeting >| toUpper >| exclaim); // pipeline
console.log( exclaim(toUpper(greeting(name))) ); //  invoke a chain of functions
```

这样对比，效果就出来了：在大量函数链式调用的场景里，管道操作（`exp >| f >| g >| h >| i`）相比传统的函数嵌套（`i(h(g(f(exp))))`）易读性更高——**从左到右** `v.s.` **由内至外**。这种操作符事实上在其他很多语言里早已得到应用，如 F#, OCaml, Elixir, Elm 等等；而且管道操作也是一个很重要的函数式语法特征，喜欢 FP 的朋友并不会陌生。

## ramda pipeline

**管道操作**的概念在 JS 开发中早已有之。上面的例子事实上 copy 自我之前写过的[一篇文章][1]，讲的是利用[ramdajs 库][2]重构链式函数调用的方法。那篇文章里用的是`compose`函数（我本人比较习惯从右到左***串烧***函数）；如果看着不习惯，可以使用 ramda 里另一个叫`pipe`的函数，用法和`>|`很相似：

```javascript
const chainedFunc = R.pipe(greeting, tuUpper, exclaim);
console.log(chainedFunc(name))
```

自己写一个 pipe 也不难：

```javascript
const pipe = (...fns) => (arg) => fns.reduce((res, fn) => fn.call(null, res), arg);
```

这种三方库函数在解决基本需求时还是挺方便的；但它们毕竟不是原生支持的操作，天然在语义和语法层面有缺陷，比如上述`pipe`就不支持生成器和`async/await`语法。`|>`提案就在讨论这些问题，至于最终方案我们就拭目以待吧。

## Multiple Arguments

观察上面的代码：`|>`之后跟的都是单参数函数；`|>`确实也只能返回上一步的一个结果，那怎么结合使用多参数列表的函数呢？高阶函数呀：

```javascript
let score = 25
            |> (_ => add(5, _))
            |> (_ => multiply(_, 2));

console.log(score); //60
```

后来，我发现 tc39 还有一个叫**局部应用**（[partial application][4]）的提案，它往往和管道操作结合使用。Partial application 也是函数式编程里的重要概念，通过固定某些参数产生一个新的函数。我们看看下方用法就知道了：

```javascript
let score = 25
            |> add(5, ?)
            |> multiply(?, 2);

console.log(score); //60
```

这个提案里的 Partial application 就是用`?`占据参数列表的某个位置，并返回一个新的函数；比如`add(5, ?)`就等价于`_ => add(5, _)`。

## babel plugin

目前并没有任何版本的浏览器或是 node 支持`|>`操作，上面关于 Pipeline Operator 的代码还无法在浏览器里运行。但是 Babel 动作很快，已经有了相关支持，一个叫[plugin-proposal-pipeline-operator][3]的插件。想尝鲜的话，可以用 babel-node 在自己的控制台跑跑 demo，只需要在 babel.config.js 文件里加上这么一句即可：

```javascript
{
  "plugins": [["@babel/plugin-proposal-pipeline-operator", { "proposal": "minimal" }]]
}
```

## 小结

我个人还是挺期待`|>`操作符的，但是以 ECMA 提案的尿性，两三年内是看不到结果的。茫茫然在生产环境里使用 babel 插件弊大于利：编辑器就不支持，lint 也很难过，最主要的是无端增加了开发人员的认知成本。现阶段只需稍微了解一下该提案即可，毕竟是 stage 1，语法的变数还是很大的。

我最早写的 js 应该是 ES3 吧，callback 很是痛苦；后来厂里项目写 ES5 但不支持 ES6，我还骂骂咧咧了；再之后 ES2016，ES2017...就记不得它们区别了。项目里我还用了 TS——一个变化更快的语言，一段时间不写我甚至看不懂隔壁 group 的代码了。说实在，对于前端技术我似乎已经进入学不动阶段，甚至怀疑面试时会一问三不知；也许世上真的就不存在老年程序员吧。


## 相关

* [《JS 高阶函数》][1]

文章同步发布于[an-Onion 的 Github](https://links.jianshu.com/go?to=https%3A%2F%2Fgithub.com%2Fan-Onion%2Fmy-weekly)。码字不易，欢迎点赞。


[0]: https://github.com/tc39/proposal-pipeline-operator
[1]: https://www.jianshu.com/p/24f380f003c0
[2]: https://ramdajs.com/
[3]: https://babeljs.io/docs/en/babel-plugin-proposal-pipeline-operator
[4]: https://github.com/tc39/proposal-partial-application
