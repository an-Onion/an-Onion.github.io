# TS 类型体操(热身)

如今，绝大多数前端开发者现在都已经接触过 Typescript。在和同僚一起学习的过程中，我发现他们虽然在使用 Typescript，但永远止步于*冒号后面价格 type*；甚至几年过后，依旧处于新手村。因此，我计划写一系列文章，来帮助大家深入理解 Typescript 的原理和类型系统。

本篇是系列文章的第一部分，主要介绍如何系统性地提升类型水平，以及如何进行类型体操。如果你还不了解 type-challenges 是什么，请查看[这里][0]。

## warm up

在开始类型体操之前，我们先做一些热身题。

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

## utility types

typescript 提供了大量的 utility types（工具类型），用于处理各种常见的类型问题。这些类型就像类型系统中的“函数”，能够执行各种对类型的操作。它们为开发者提供了强大的类型处理能力，使得代码更加健壮和可维护。下面我们来看最常见的一个工具类型 [Record][2]

`Record<K, T>`构造一个对象类型，其属性键为`K`，属性类型为`T`。例如：

```ts
type Person = Record<'name' | 'age', string>

const personA: Person = { // ✅
  name: 'Tom',
  age: '18'
}

const personB: Person = {  // ❌ Property 'age' is missing in type '{ name: string; }' but required in type 'Person'.ts(2741)
  name: 'Tom',
}
```

对于想要更深入了解 Record 类型甚至 TypeScript 类型系统的朋友们，你们有没有想过`Record`是如何实现的呢？其实，在 Visual Studio Code 编辑器中，你可以通过按住 Control 键（或 Command 键，取决于你的操作系统）并点击`Record`，直接跳转到它的定义。

```ts
type Record<K extends keyof any, T> = {
    [P in K]: T;
};
```

这段代码表明 Record 通过类型映射将属性键映射到属性值，从而创建了一个新的对象类型。这样的实现方式正是 TypeScript 类型系统的精妙之处。虽然官方文档中相关章节的内容可能较为抽象，但在实际的项目开发中，这些工具类型却能发挥巨大的作用。


## 小结

上文中`HelloWorld`和`Record`的实现正是我们 ts 类型体操要训练的代码。这些知识主要在官方文档的[types-from-types][2]这一章节里介绍。但是这个章节的内容相对抽象，而市面上似乎也没有太多的资料介绍；因此也就有了我一开始的想法，通过一些特定的练习题，来帮助大家理解 typescript 的类型系统。

本文作为本系列的导读篇，不再深入解释更细节的知识点。在接下来的系列文章中，我们将从官方提供的[utility types][2]开始，详细介绍一些常见的工具类型及其底层实现方式。希望通过这些介绍，能够帮助大家更深入地理解 TypeScript 的类型系统，从而写出更加健壮、安全的代码。敬请期待后续的精彩内容。


## 参考

- [type challenges][0]
- [types-from-types][1]
- [TypeScript Utility Types][2]


[0]: https://github.com/type-challenges/type-challenges
[1]: https://www.typescriptlang.org/docs/handbook/2/types-from-types.html
[2]: https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type