# TS 类型体操

如今，绝大多数前端开发者现在都已经接触过 Typescript。在我和一群同学一起学习的过程中，我发现他们虽然某些人在使用 Typescript，却并不了解类型系统的意义。几年过后，依旧处于新手村。因此，我计划写一系列文章，来帮助大家深入理解 Typescript 的原理和类型系统。

本篇是系列文章的第一部分，主要介绍如何系统性地提升类型水平，以及如何进行类型体操。如果你还不了解 type-challenges 是什么，请查看[这里][0]。

OK，让我们先来做一道热身题：

```ts
type HelloWorld = any
// you should make this work
type test = Expect<Equal<HelloWorld, string>>
```

这道题的考点其实是“起别名”，答案如下：


```ts
type HelloWorld = string
```

别名就是给一个类型起一个新名字，如上，给`string`类型起了一个`HelloWorld`的新名字。`HelloWorld`和`string`完全等价的，两个类型的引用可以互相复值，却毫无违和感。

```ts
const a: string = 'hello world';
const b: HelloWorld = a;
const c: string = b;
```

有趣的是，我曾跟一些 Java 程序员讨论过 Typescript 中的类型别名，他们对这个概念感到陌生。或许是由于工作习惯的原因，很难理解两个不同名字的类型（或抽象）可以完全等价。同样地，在学习 Typescript 初期，即便是多年的 js 开发也可能会犯类似的错误，但随着对类型的熟练掌握，你会逐渐习惯这种用法，并最终吃透 typescript 的类型系统。



// TO BE CONTINUED


[0]: https://github.com/type-challenges/type-challenges