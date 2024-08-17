# ts 类型体操之内置工具类型（中）

书接上文。在上一节中，我们学习了 8 个最常用的内置工具类型。这些工具类型都是对现有类型进行“变形”的工具，它们可以改变类型的结构，但不会改变类型本身的值。这些内置工具类型，本质上就是类型系统中的“函数”，它们接受[范型][0]作为参数，返回一个新的类型。

这一节，我们继续学习内置工具类型，主要集中学习[infer][4]相关的几个内置工具：

## `Parameters<T>`：获取函数类型 T 的返回参数列表

如下例所示，以元祖形式返回函数参数列表：

```ts
type T1 = Parameters<(s: string, n: string) => void>; // [string, number]
```

实现用到了我们基础语法篇里提到的`infer`；在这里，我们使用 `infer P` 来推断函数参数的类型，并将其赋值给 `P`。

```ts
type Parameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;
```

简单介绍一下：

1. 所有函数类型的基类是 `(...args: any) => any`；Parameters 用于函数类型的参数类型提取，所以我们给范型（参数）T 加一个限制 `T extends (...args: any) => any`，确保 T 是函数类型，否则类型抛错
2. 类型推断 `infer` 只能配合**[条件判断][4]** `extends` 使用；所以我们需要冗余地写一遍类似的代码 `T extends (...args: infer P) => any ? P : never`；这次主要是为了推断出参数 args 的类型 P，然后返回该类型。

p.s. 上面实现中两个 `extends` 作用不同：第一个是用于类型限制；第二个是配合 infer 的条件判断。大家不要搞混了。

## `ReturnType<T>`：获取函数类型 T 的返回类型

同理 ReturnType 的实现也和 Parameters 差不多，只不过把推断的参数类型换成了返回类型：

```ts
type ReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;
```

我们扩展一下，能不能自己实现一个类型工具，同时返回参数类型和返回类型呢？当然可以，这就是两个 infer 推断的事，如下所示:

```ts
type ParametersAndReturnType<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => infer R
  ? { parameters: P; return: R }
  : any;

type T2 = ParametersAndReturnType<(a: string) => number>;

// type T2 = {
//     parameters: [a: string];
//     return: number;
// }
```

## `ConstructorParameters<T>`：获取构造函数类型 T 的参数类型

上文提到：所有函数类型的基类型是 `(...args: any) => any`。而所有构造函数类型 T 的基类型是：

```ts
new (...args: any) => any
```

由于 js 的类（class）事实上是构造函数的一个语法糖，所以我们还需要考虑 class。普通 class 的基类也自然是`new (...args: any) => any`。但是，ts 多走了一步，支持了抽象类（abstract class），所以又给`new (...args: any) => any`找了个基类——`abstract new (...args: any) => any`。最终，我们判断 T 是否是构造函数，就成了判断 T 是否是`abstract new (...args: any) => any`的子类。

ConstructorParameters 就是提取构造函数的参数类型，实现上和`Parameters<T>`差不多——一个 infer 的事：

```ts
type ConstructorParameters<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: infer P) => any ? P : never;
```

## `InstanceType<T>`：获取构造函数类型 T 的实例类型

InstanceType 就是获取构造函数的返回类型，实现上参考`ReturnType<T>`，也很简单：

```ts
type InstanceType<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: any) => infer R ? R : any;
```

## 其他

除了上面提到的几个，typescript 3.3 内置了`ThisParameterType<T>`、`OmitThisParameter<T>`、`ThisType<T>`。这些工具其实为了兼容 typescript 2.0 版本里的 [`this`][5] 声明展开的：类型体操中完全用不到，现实开发中也应尽量避免在函数里用 `this`。这里由于与 infer 相关，我也把它们的实现列一下：

- `ThisParameterType<T>`：提取函数类型的*this*参数的类型，如果函数类型没有*this*参数，则返回*unknown*

  ```ts
  type ThisParameterType<T> = T extends (this: infer U, ...args: never) => any
    ? U
    : unknown;
  ```

  实现倒不难，就是调用的时候有点蠢：要在函数的第一个参数里声明 this 类型，而且还不能简单调用该函数，要配合 apply、call、bind 使用。

  ```ts
  function foo(this: string) {
    return this + ':Hello world';
  }

  // type of foo => (this: string) => string

  type Foo = ThisParameterType<typeof foo>; // string

  function numberToString(s: Foo) {
    return foo.call(s);
  }
  ```

- `OmitThisParameter<T>`：移除函数类型的`this`参数

  ```ts
  type OmitThisParameter<T> =
    unknown extends ThisParameterType<T>
      ? T
      : T extends (...args: infer A) => infer R
        ? (...args: A) => R
        : T;

  type omitThis = OmitThisParameter<(this: number, n: number) => void>; // (n: number) => void
  ```

  这个就是移除了 this 声明的函数类型，稍微解释一下：

  1. `unknown extends ThisParameterType<T>`： 结合 ThisParameterType 的实现，我们可以得出，如果函数类型没有 this 声明，那么`ThisParameterType<T>` 直接返回 unknown；所以这里就是单纯判断 T 有没有 this 声明，如果没有，直接返回 T 本身。
  2. `T extends (...args: infer A) => infer R`： 如果 T 是函数类型，则提取参数类型 A 和返回值类型 R，反之直接返回类型 T 本身。p.s. 这种条件写法与 `T extends (this: infer U , ...args: infer A) => infer R` 区别是：会自动忽略 this 参数。
  3. `(...args: A) => R`： 返回一个新的函数类型，这个函数类型不再声明 this 类型，其他参数类型和返回值类型与 T 相同。

  实现上也挺简单，就是有两层条件判断。以后我们接触 type challenge 真题时，会碰到更多层的情况。不要慌，可以把代码类似“抽取函数”（类型嵌套）的形式来重构。比如：

  ```ts
  type OmitThisParameter<T> =
    unknown extends ThisParameterType<T> ? T : OmitThisParameterFunc<T>;

  type OmitThisParameterFunc<T> = T extends (...args: infer A) => infer R
    ? (...args: A) => R
    : T;
  ```

- `ThisType<T>`：非推理类型位置的标记

  早古的设计：没啥用，就是个 this 的标记位，等于空接口，一笔带过了。

  ```ts
  interface ThisType<T> = {};
  ```

## 小结

这期我们主要讲了 infer 相关的几个内置工具类型。infer 是 type challenge 中除了 extends 以外出场频率最高的一个关键字，它能够让我们在类型体操中实现很多看似不可能的功能。我想大家在学习过这几个工具后，应该能对 infer 有更深的理解。

本文是该系列的第四篇文章，我们回过头来思考一下[type challenge（类型体操）][1]，解决这类问题到底有多少意义？其实它就是类似于 leetcode 的代码训练。很多人对 leetcode 嗤之以鼻（我个人还是比较肯定 leetcode 作为日常代码训练的意义的，坚持[每天一道 leetcode][2]），但是在面试中，leetcode 题目还是占据着举足轻重的地位。类型体操自然没有达到 leetcode 这种业界地位，b 不过一到涉及 typescript 的高级特性考察，你觉得面试官能问什么问题呢？我们学习一种语言本质上是对自己职业生涯的一项投资，投资的最大回报就是找到下一份满意的工作。即然你已经决定学习 typescript，那就务必掌握好它最核心的部分——类型系统。

[0]: https://www.typescriptlang.org/docs/handbook/2/generics.html
[1]: https://github.com/type-challenges/type-challenges
[2]: https://github.com/an-Onion/leetcode
[3]: https://github.com/microsoft/TypeScript/pull/49119
[4]: https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types
[5]: https://www.typescriptlang.org/docs/handbook/2/functions.html#declaring-this-in-a-function
