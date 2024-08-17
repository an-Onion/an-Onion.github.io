## `NonNullable<Type>`：从类型 T 中 剔除 null 和 undefined

`NonNullable` 是一个比较简单的工具类型，它接受一个范型 T 作为参数，如果 T 是 `null` 或 `undefined`，则返回 `never`，否则返回 T 本身。NonNullable 早些年的实现如下所示：

```ts
type NonNullable<T> = T extends null | undefined ? never : T;
```

不记得 extends 关键字的可以回顾一下上一节的内容。extends 实际执行时是对联合类型`T`里的每一个元素分别进行条件判断。所以 NonNullable 通常也是用于联合类型操作，剔除联合类型中的 null 和 undefined：

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
