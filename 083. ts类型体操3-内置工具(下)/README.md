# ts 类型体操之内置工具类型（下）

本文是 ts 内置工具最后一篇。拖拖拉拉总算要把所有的内置工具讲完了。

## `NonNullable<Type>`：从类型 T 中 剔除 null 和 undefined

`NonNullable` 是一个比较简单的工具类型，它接受一个范型 T 作为参数，如果 T 是 `null` 或 `undefined`，则返回 `never`，否则返回 T 本身。NonNullable 早些年的实现如下所示：

```ts
type NonNullable<T> = T extends null | undefined ? never : T;
```

不记得 extends 关键字的可以回顾一下《ts 类型体操之内置工具类型（上）》的内容。extends 实际执行时是对联合类型`T`里的每一个元素分别进行条件判断。所以 NonNullable 通常也是用于联合类型操作，剔除联合类型中的 null 和 undefined：

```ts
type T0 = NonNullable<string | number | undefined>; // string | number
type T1 = NonNullable<string[] | null | undefined>; // string[]
```

不过在[typescript 4.8][3]后，NonNullable 被重写了，现在它的实现如下：

```ts
type NonNullable<T> = T & {};
```

这个实现其实更简单，它利用了类型系统中的交叉（`&`）操作符，将 T 和一个空对象类型 `{}` 进行合并，从而剔除了 T 中的 `null` 和 `undefined`。这里提几个八股小知识点: `{}` 是除了 undefined 和 null 之外，所有类型的父类型。 所以 `{}` 和 undefined 或 null 的交叉类型是 never，而且其余的类型和`{}`交叉的结果是其本身。

以`NonNullable<number | undefined>`为例:

`NonNullable<number | undefined>`
=> `(number | undefined) & {} => number`
=> `(number & {} ) | (undefined & {})`
=> `number | never`
=> `number`

再补充一个八股 unknown 事实上等价于 `{} | undefined | null`, 所以 `NonNullable<unknown>` 等于 `{}`，但是 `NonNullable<any>` 等于 `any`。

## `Awaited<T>`

Awaited 类型用于获取 Promise 的返回值类型。例如：

```ts
type T0 = Awaited<Promise<string>>; // string
type T1 = Awaited<Promise<Promise<number>>>; // number
type T2 = Awaited<boolean | Promise<number>>; // number | boolean
```

Awaited “方法”还是有点难度的：

- 该类型需要支持递归：它需要将嵌套的 Promise 的类型展开，直至得到 Promise 的最终返回值类型。
- 递归的结束条件是：对非 PromiseLike 的类型（没有 then 方法的对象类型）返回 never。

如下是 Awaited 的原始版本：

```ts
/**
 * Recursively unwraps the "awaited type" of a type. Non-promise "thenables" should resolve to `never`. This emulates the behavior of `await`.
 */
type Awaited<T> = T extends null | undefined
  ? T // special case for `null | undefined` when not in `--strictNullChecks` mode
  : T extends object & { then(onfulfilled: infer F, ...args: infer _): any } // `await` only unwraps object types with a callable `then`. Non-object types are not unwrapped
    ? F extends (value: infer V, ...args: infer _) => any // if the argument to `then` is callable, extracts the first argument
      ? Awaited<V> // recursively unwrap the value
      : never // the argument to `then` was not callable
    : T; // non-object or non-thenable
```

我们逐行解释上面的实现：

- `T extends null | undefined`：如果 T 是 null 或者 undefined，则直接返回 T。这个判断是为了处理非严格模式下，null 和 undefined 的情况。在严格模式下，null 和 undefined 不能作为合法的 Promise。
- `T extends object & { then(onfulfilled: infer F, ...args: infer _): any }`：这行很长，中心思想是：如果 T 是一个对象，并且该对象具有 then 方法，那么我们就可以认为它是一个 PromiseLike 类型。这里我们用到了`infer`关键字，它表示在类型推导过程中，将 then 方法的第一个参数类型提取出来，赋值给 F。若 T 不是 PromiseLike 类型，则直接返回 T。
- `F extends (value: infer V, ...args: infer _) => any`：F 由上一步推断得到，如果 then 方法的第一个参数是函数类型，那么我们就可以认为它是一个 Promise。我们再次用到了`infer`关键字，将 then 方法的第一个参数的类型提取出来，赋值给 V。若 F 不是函数类型，则不是一个合法的 Promise，直接返回 never。
- `Awaited<V>`：递归地展开 V，直到 V 不再是 PromiseLike 类型为止。

原始版本虽然能看得懂，但是太麻烦了。我们自实现 type challenge 这道 [MyAwaited][4] 的时候可以用下面一个简化版代替：

```ts
type Awaited<T> = T extends PromiseLike<infer R> ? Awaited<R> : T;
```

- `PromiseLike<T>`也是一个内置接口，表示一个具有 then 方法的对象类型——Promise 的[鸭子类型][1]。大家可以直接用。完整的定义如下，有兴趣的朋友可以看一下：

  ```ts
  interface PromiseLike<T> {
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): PromiseLike<TResult1 | TResult2>;
  }
  ```

- `PromiseLike<infer R>`：表示将 PromiseLike 类型中的泛型参数 R 提取出来，然后递归调用 Awaited，直到递归到非 PromiseLike 的类型。这里有个知识点：infer 甚至可以推断出接口中的范型参数。比如`Promise<string>`，可以直接推断出 string
- `extends ? (...) : T`： 我们之前提到过：extends 会遍历联合类型。对于`boolean | Promise<number>`这样的 case，extends 会分别对`boolean`和`Promise<number>`进行判断，最终返回 boolean | number。

## `NoInfer<Type>`

`NoInfer<Type>`：用于防止 TypeScript 从泛型函数内部推断类型。它是一个固有类型，没有更底层的实现：

```ts
// lib.es5.d.ts
type NoInfer<T> = intrinsic;
```

它是 TypeScript 5.4 刚推出的一个内置类型，所以我们正好看看如何在某些情况下使用它来改进 TypeScript 的推理行为。如下例所示：通常的情况下编译器是可以从函数入惨里推断出 result 类型是 `'hello'`

```ts
const returnWhatIPassedIn = <T>(value: T) => value;

const result = returnWhatIPassedIn('hello'); //const result: 'hello'
```

但如果我们用 `NoInfer<T>` 来包装 value, NoInfer 使 value 无法成为有效推断来源 T。因此如下 result 被推断为 unknown。

```ts
const returnWhatIPassedIn = <T>(value: NoInfer<T>) => value;

const result = returnWhatIPassedIn('hello'); //const result: unknown
```

我们需要明确提供范型才能获得 returnWhatIPassedIn 的返回类型：

```ts
const result = returnWhatIPassedIn<'hello'>('hello');
// const result: "hello"
```

NoInfer 要解决什么问题呢？一个很好的例子是创建有限状态机 (FSM) 的函数。FSM 有一个 initial 状态和一个列表 states。initial 状态必须是 states 之一。

```ts
declare function createFSM<TState extends string>(config: {
  initial: TState;
  states: TState[];
}): TState;
```

请注意，TypeScript 可以从两个可能的地方推断类型：initial 和 states。如下所示：example 的类型推断为`"not-allowed" | "open" | "closed"`。显然，正确的类型推断应该是状态机只有 `"open" | "closed"` 这两种类型，而 `initial = "not-allowed"` 要抛错。

```ts
const example = createFSM({
  initial: 'not-allowed',
  states: ['open', 'closed'],
});
// const example: "not-allowed" | "open" | "closed"
```

怎么用 NoInfer 改进呢？

```ts
declare function createFSM<TState extends string>(config: {
  initial: NoInfer<TState>;
  states: TState[];
}): TState;
```

现在，当我们调用时 createFSM 时，TypeScript 将仅从 states 推断 TState 类型；并给 initial 的赋值抛出一个类型检查错误 —— `Type '"not-allowed"' is not assignable to type '"open" | "closed"'`：

```ts
createFSM({
  initial: 'not-allowed', // Type '"not-allowed"' is not assignable to type '"open" | "closed"'.
  states: ['open', 'closed'],
});
```

我们使用 NoInfer 控制 TypeScript 从泛型函数内部推断类型的位置。当有多个运行时参数，每个参数都引用相同的类型参数时，这会很有用。

## Intrinsic String Manipulation Types （字符串操作类型）

最后，我们再列一下另外四个固有的字符串操作类型：

- `Uppercase<S>`：将字符串中的每个字符转换为大写。
- `Lowercase<S>`：将字符串中的每个字符转换为小写。
- `Capitalize<S>`：将字符串中的第一个字符转换为大写。
- `Uncapitalize<S>`：将字符串中的第一个字符转换为小写。

效果如下：

```ts
type Greeting = 'Hello, world';
type ShoutyGreeting = Uppercase<Greeting>; // "HELLO, WORLD"
type LowercaseGreeting = Lowercase<Greeting>; // "hello, world"
type CapitalizedGreeting = Capitalize<Greeting>; // "Hello, world"
type UncapitalizedGreeting = Uncapitalize<Greeting>; // "hello, world"
```

这些方法在 type challenge 里倒是挺常用的，比如[这道][2]

> 把驼峰类型的字符串转换成烤串类型的字符串

```ts
type FooBarBaz = KebabCase<'FooBarBaz'>;
const foobarbaz: FooBarBaz = 'foo-bar-baz';

type DoNothing = KebabCase<'do-nothing'>;
const doNothing: DoNothing = 'do-nothing';
```

实现如下：

```ts
type KebabCase<S extends string> = S extends `${infer F}${infer R}`
  ? R extends Uncapitalize<R>
    ? `${Uncapitalize<F>}${KebabCase<R>}`
    : `${Uncapitalize<F>}-${Uncapitalize<KebabCase<R>>}`
  : S;
```

我们再逐行解释一下上面的实现：

1. S extends \`\${infer F}\$\{infer R\}\`：我们使用模板字符串类型来拆分`S`，将字符串 `S` 分解为第一个字符 `F` 和剩余部分 `R`。
2. `R extends Uncapitalize<R>`：我们检查剩余部分 `R` 是否是小写开头：如果是，我们直接将第一个字符 `F` 转换为小写，并递归调用 `KebabCase` 处理剩余部分 `R`；如果不是，我们也将第一个字符 `F` 转换为小写，并在后面添加一个连字符 `-`。然后递归调用 `KebabCase` 处理剩余部分 `R`。
3. `S`：如果字符串 `S` 已经是空字符串——`S extends ...`判否，我们直接返回它本身。

通过这种方式，我们完成了这道中等难度的题目。

## 小结

本文是《内置工具类型》系列最后一篇，一共 22 个内置的工具类型。这些工具类型本质是类型的 utils 方法，帮助我们写出更加健壮的代码类型。希望大家能熟练掌握这些工具类型，并在实际工作中灵活运用。之后的篇幅就要进入《类型体操》真题演练了，敬请期待。

## 题外话

最近，我在看一些国内程序员的论坛，高赞的文章很多是关于“下岗再就业”的。下个月，我的合同即将到期，很可能也要直面人生了。很羡慕我们厂里的一个美国老大爷，快 60 岁了，每天写两小时代码，依旧延续着自己的职业生涯。真心希望国内的程序员们，也能像他一样，开开心心地工作到退休。

[1]: https://en.wikipedia.org/wiki/Duck_typing
[2]: https://github.com/type-challenges/type-challenges/blob/main/questions/00612-medium-kebabcase/README.md
[3]: https://github.com/microsoft/TypeScript/pull/49119
[4]: https://github.com/type-challenges/type-challenges/blob/main/questions/00189-easy-awaited/README.md
