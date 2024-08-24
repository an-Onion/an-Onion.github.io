# ts 类型体操之内置工具类型（中）

书接上文。在上一节中，我们学习了 8 个最常用的内置工具类型。这些工具类型都是对现有类型进行“变形”的工具，它们可以改变类型的结构，但不会改变类型本身的值。这些内置工具类型，本质上就是类型系统中的“函数”，它们接受[范型][0]作为参数，返回一个新的类型。

这一节，我们继续学习内置工具类型，主要集中学习[infer][4]相关的几个内置工具.

## `Parameters<T>`：获取函数类型 T 的返回参数列表

TypeScript 中的 infer 作为关键字用于补充条件类型。注意，它不能在 extends 子句之外使用。在条件类型内部使用 infer 可以声明一个类型变量，以便在条件类型的 extends 子句中动态捕获类型。我们以内置的 TypeScript Parameters 工具为例。它接受一个函数类型，以元祖形式返回函数参数列表的类型：

```ts
type T1 = Parameters<(s: string, n: string) => void>; // [string, number]
```

在这里，我们可以使用 `infer P` 来动态推断函数参数的类型，并将其赋值给 `P`。

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

  早古的设计：就是个 this 的标记位，必须启用 noImplicitThis 标志才能使用它。实现就是个空借口，一笔带过了。

  ```ts
  interface ThisType<T> = {};
  ```

  但是 type challenge 中，倒是有一到 hard 题——[Simple Vue][6]是关于这个工具类型的。题目大体是这样的：

  > 实现类似 Vue 的类型支持的简化版本。它应该正确地推断出 data 、computed 和 methods 内部的 this 类型。

  熟悉 Vue 的朋友应该知道：

  - data 是一个简单的函数，它返回一个提供上下文 this 的对象，但是你无法在 data 中获取其他的计算属性或方法。

  - computed 是将 this 作为上下文的函数的对象，进行一些计算并返回结果。在上下文中应暴露计算出的值而不是函数。

  - methods 是函数的对象，其上下文也为 this。函数中可以访问 data，computed 以及其他 methods 中的暴露的字段。 computed 与 methods 的不同之处在于 methods 在上下文中按原样暴露为函数。

  所以这题的意图是让我们要实现一个叫 SimpleVue 的函数类型，使得下面这个片段不显示 ts 类型错误。（注： `// @ts-expect-error` 是用来标记该处是预计会抛错的。在下例里，SimpleVue 的 data 函数里，`this.firstname`不能合法存在。）

  ```ts
  SimpleVue({
    data() {
      // @ts-expect-error
      this.firstname;
      // @ts-expect-error
      this.getRandom();
      // @ts-expect-error
      this.data();

      return {
        firstname: 'Type',
        lastname: 'Challenges',
        amount: 10,
      };
    },
    computed: {
      fullname() {
        return `${this.firstname} ${this.lastname}`;
      },
    },
    methods: {
      getRandom() {
        return Math.random();
      },
      hi() {
        alert(this.amount);
        alert(this.fullname.toLowerCase());
        alert(this.getRandom());
      },
      test() {
        const fullname = this.fullname;
        const cases: [Expect<Equal<typeof fullname, string>>] = [] as any;
      },
    },
  });
  ```

  [我的实现][7]是这样的：

  ```ts
  declare function SimpleVue<D, C, M>(options: {
    data: (this: void) => D;
    computed: C & ThisType<D>;
    methods: M & ThisType<D & ComputedHelper<C> & M>;
  }): any;

  type ComputedHelper<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : never;
  };
  ```

  我们逐行解释一下：

  - `declare function SimpleVue<D, C, M>(options: { ... })`: 我们声明函数 `SimpleVue`，它接受一个叫 option 的对象作为入参；这里我们定义了三个范型参数 `D`、`C` 和 `M`，分别代表 `data`、`computed` 和 `methods` 的类型。这三个范型参数在 `options` 对象中都有用到。
  - Options 对象的类型是 `{data: ..., computed: ..., methods: ...}`，其中：
    - `data: (this: void) => D;`: `data` 类型是一个函数，它的 `this` 类型是 `void`，返回值类型是 `D`。`this: void`意味着 `data` 函数内不能访问 `this` 对象——`this.firstname`会报错。
    - `computed: C & ThisType<D>;`: `computed` 属性是一个对象，它的类型是 `C`；后面的`& ThisType<D>`的意思是： 该对象内部使用的 `this` 类型是 `D`。这意味着 `computed` 对象中的函数可以访问 `data` 对象中的属性—— `this.firstname`和 `this.lastname` 不会抛错。
    - `methods: M & ThisType<D & ComputedHelper<C> & M>;`: `methods` 属性是一个对象，它的类型是 `M`；而`& ThisType<D & ComputedHelper<C> & M>`的意思是：该对象内部使用的 `this` 类型是 `D & ComputedHelper<C> & M`（ `ComputedHelper<C>` 等会儿解释）。这意味着 `methods` 对象中的函数可以访问 `data` 对象中的属性，也可以访问 `computed` 对象中的属性，还可以访问 `methods` 对象中的其他函数。
  - `ComputedHelper<C>` 是我们自定义的一个类型“函数”，帮助提取 computed 里的函数返回类型，使得 methods 里能使用`this.fullname` 而不是 `this.fullname()`。它的效果如下：

    ```ts
    type computed = {
      fullname: () => string;
    };

    type computedHelper = ComputedHelper<computed>;
    //  computedHelper = {
    //    fullname: string
    //  }
    ```

  试了一下 hard 题，感觉如何。现在的主流框架都是由这样的 ts 类型写成的。大家可以想象一下，如果你要参与一个现代 js 框架的开发，类型体操 hard 水平是必备技能。

## 小结

这期我们主要讲了 infer 相关的几个内置工具类型。infer 是 type challenge 中除了 extends 以外出场频率最高的一个关键字，它能够让我们在类型体操中实现很多看似不可能的功能。我想大家在学习过这几个工具后，应该能对 infer 有更深的理解。

本文是该系列的第四篇文章，我们回过头来思考一下[type challenge（类型体操）][1]，解决这类问题到底有多少意义？其实它就是类似于 leetcode 的代码训练。很多人对 leetcode 嗤之以鼻（我个人还是比较肯定 leetcode 作为日常代码训练的意义的，坚持[每天一道 leetcode][2]），但是在面试中，leetcode 题目还是占据着举足轻重的地位。类型体操自然没有达到 leetcode 这种业界地位，b 不过一到涉及 typescript 的高级特性考察，你觉得面试官能问什么问题呢？我们学习一种语言本质上是对自己职业生涯的一项投资，投资的最大回报就是找到下一份满意的工作。即然你已经决定学习 typescript，那就务必掌握好它最核心的部分——类型系统。

[0]: https://www.typescriptlang.org/docs/handbook/2/generics.html
[1]: https://github.com/type-challenges/type-challenges
[2]: https://github.com/an-Onion/leetcode
[3]: https://github.com/microsoft/TypeScript/pull/49119
[4]: https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types
[5]: https://www.typescriptlang.org/docs/handbook/2/functions.html#declaring-this-in-a-function
[6]: https://github.com/type-challenges/type-challenges/blob/main/questions/00006-hard-simple-vue/README.md
[7]: https://github.com/an-Onion/type-challenges/blob/main/src/00006-hard-simple-vue.ts
