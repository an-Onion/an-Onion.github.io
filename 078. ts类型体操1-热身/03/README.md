# ts 类型体操之内置工具类型（utility types）

在 TypeScript 中，内置工具类型（utility types）是一组预定义的类型，用于在类型层面上进行各种操作。对于 ts 开发者来说，开始使用这类工具是一个走出新手村的重要标志。截止至 2024 年 7 月，ts 官方共提供了 19 个内置的工具类型。大家可以在官网查看具体的[文档][0]。当然，本文并不是来集中介绍这些类型的用法，我们要更近一步，来看看如何用更底层的 api 来实现这些工具类。

## Record

`Record<K, T>` 将 `K` 中的每个属性值转化为 `T` 类型，例如：

```ts
type Animal = "Dog" | "Cat";

type AnimalRecord = Record<Animal, string>;
// type AnimalRecord = {
//     Dog: string;
//     Cat: string;
// }
```

Record 的实现如下：

```ts
type Record<K extends keyof any, T> = {
  [P in K]: T;
};

type K = keyof any; // string | number | symbol
```

## Partial

`Partial<T>` 将 `T` 的所有属性变为可选，例如：

```ts
type Vegetable = {
  Onion: string;
  Garlic: number;
};

type PartialVegetable = Partial<Vegetable>;
// type PartialVegetable = {
//     Onion?: string | undefined;
//     Garlic?: number | undefined;
// }
```

Partial 的实现如下：

```ts
type Partial<T> = {
  [P in keyof T]?: T[P];
};
```

// to be continued

[0]: https://www.typescriptlang.org/docs/handbook/utility-types.html
