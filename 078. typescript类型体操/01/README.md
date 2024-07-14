# TS 类型体操(热身)

如今，绝大多数前端开发者现在都已经接触过 Typescript。在和同僚一起学习的过程中，我发现他们虽然在使用 Typescript，但永远止步于*冒号后面加上一个 type*；以至于号称熟料使用 ts 几年过后，依旧处于新手村阶段。因此，我计划写一系列文章，来帮助大家深入理解 Typescript 的原理和类型系统。

## [type challenges][0]

type-challenges 是一个开源项目，提供了大量的类型体操题目，用于训练和提升 TypeScript 类型系统的能力。这些题目涵盖了各种常见的类型操作，如条件类型、联合类型、交叉类型、映射类型等。通过完成这些题目，你可以深入理解 TypeScript 类型系统的原理，并掌握各种类型操作的使用方法。我们本系列就从[type challenges][0]开始，通过一系列的训练题，逐步掌握 ts 类型系统的各种技巧。

## warm up

类型体操的开始是一道热身题。这里稍微提一下， `Expect` 和 `Equal` 是 type-challenges 提供的辅助类型，用于测试类型是否正确。你就暂且当作 jest 里的 `expect` 和 `toEqual` 吧。只不过这里的 `Expect` 和 `Equal` 是用来比较类型（抽象）的；而 jest 的 `expect` 和 `toEqual` 是通常用于比较值（具体）的。

```ts
type HelloWorld = any;
// you should make this work
type test = Expect<Equal<HelloWorld, string>>;
```

这道题的考点是“起别名”，答案如下：

```ts
type HelloWorld = string;
```

别名就是给一个类型起一个新名字，如上，给`string`类型起了一个`HelloWorld`的新名字。`HelloWorld`和`string`完全等价的，两个类型的引用可以互相复值，却毫无违和感。

```ts
const a: string = "hello world";
const b: HelloWorld = a;
const c: string = b;
```

有趣的是，我曾跟一些 Java 程序员讨论过 Typescript 中的类型别名，他们对这种概念非常陌生。或许是由于工作习惯的原因，很难理解两个不同名字的类型（或抽象）可以完全等价。同样地，我在学习 Typescript 初期，即便是多年的 js 开发，也犯过类似的错误；不过随着对类型的熟练掌握，我逐渐想明白了类型和值的关系，有点类似于虚数和实数的关系。在 ts 系统里, 任何定义 `const val: y = x` 都可以类比为复数 `val = x + y*i` 的形式，其中`x`是具体的值，而 `y*i` 是类型，用于约束 `val` 操作。想明白了这点，就可以得出，我们可以在实轴上能进行数据操作，自然也可以在虚轴上进行特定的操作。而这个虚数轴上的操作就是我们的类型体操了。

![complex number][3]

OK，这里可能需要点数学背景。不过，现阶段不理解也无关紧要。每个人都可以通过特定的抽象训练，实现对类型的深入理解，并最终吃透常规的类型系统。之后的文章中，我也会举各种 type challenges 的例子，逐步讲解抽象方面的知识点。

## utility types

热身完，我们再进一步接触一下 typescript 内置的 [utility types][4]（工具类型），它们用于处理各种常见的类型问题。这些类型就像类型系统中的“函数”，能够执行各种对类型的操作。它们为开发者提供了强大的类型处理能力，使得代码更加健壮和可维护。下面我们来看最常用的一个工具类型 [Record][2]。

`Record<K, T>`用于构造一个对象类型，其属性键为`K`，属性类型为`T`。例如：

```ts
type Person = Record<"name" | "age", string>;

const personA: Person = {
  // ✅
  name: "Tom",
  age: "18",
};

const personB: Person = {
  // ❌ Property 'age' is missing in type '{ name: string; }' but required in type 'Person'.ts(2741)
  name: "Tom",
};
```

对于用过 `Record` 类型的朋友们，你们有没有想过`Record`是如何实现的呢？其实，在 Visual Studio Code 编辑器中，你可以通过按住 Control 键（或 Command 键，取决于你的操作系统）并点击`Record`，直接跳转到它的定义。

```ts
type Record<K extends keyof any, T> = {
  [P in K]: T;
};
```

这段代码表明 `Record` 通过类型映射将属性键映射到属性值，从而创建了一个新的对象类型。至于这里的`[P in K]`是什么意思呢？这也是 ts 的知识点，我们会在下一篇文章中再一一介绍，这里赞不展开了。

## type mapping

了解 ts 内置的工具类，也只是到了一个入门阶段。如果要到中高阶，不得不深入理解类型映射（type mapping）。它允许我们通过映射类型“函数”来创建新的类型。举个例子，如下所示，我们可以通过某种工具类型，将一个现有的类型 A 转换成一个新的类型 B。

```typescript
type A = {
  a: number;
  b: number;
};

// How to convert A to B?

type B = {
  a: string;
  b: string;
};
```

初学者可能没啥思路，这里直接给出答案：

```ts
type NumberToString<T> = {
  [K in keyof T]: string;
};
```

这里的`keyof T`又是什么意思呢？我再卖个官子，下一章再讲。

## 小结

上文中`HelloWorld`和`Record`的实现正是我们 ts 类型体操要训练的代码。这些知识主要在官方文档的[types-from-types][2]这一章节里介绍。但是这个章节的内容相对抽象，而市面上似乎也没有太多的资料介绍；因此也就有了我一开始的想法，通过一些特定的练习题，来帮助大家理解 typescript 的类型系统。

本文作为本系列的导读篇，不再深入解释更细节的知识点。在接下来的系列文章中，我们会碰到各式各样的训练题，然后再一一展开。希望通过这些介绍，能够帮助大家更深入地理解 TypeScript 的类型系统，从而写出更加健壮、安全的代码。敬请期待。

## 参考

- [type challenges][0]
- [types-from-types][1]
- [TypeScript Utility Types][2]

[0]: https://github.com/type-challenges/type-challenges
[1]: https://www.typescriptlang.org/docs/handbook/2/types-from-types.html
[2]: https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type
[3]: ../img/complex.png
[4]: https://www.typescriptlang.org/docs/handbook/utility-types.html
[5]: https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#mapping-modifiers
