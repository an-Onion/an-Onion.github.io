# ts 类型体操之内置工具类型（utility types）

在 TypeScript 中，内置工具类型（utility types）是一组预定义的类型，用于在类型层面上进行各种操作。对于 ts 开发者来说，开始使用这类工具是一个走出新手村的重要标志。截止至 2024 年 7 月，ts 官方共提供了 19 个内置的工具类型。大家可以在官网查看具体的[文档][0]。当然，本文并不是来集中介绍这些类型的用法，我们要更近一步，来看看如何用更底层的 api 来实现这些工具类。

## 简单映射

我们先从最简单的入手

### Record

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

Record 是最最常用的一个工具类型，实现也极其简单，只需要用到我们在上期中介绍的[类型映射][1]。简单遍历第一个泛型 K 的每一个属性，并将属性值都转成第二个泛型 T 类型。 这里对 K 做了限制，就是它只能是 string、 number 和 symbol 的一种。我们再简单展开一下， `keyof any`等价于联合类型`string | number | symbol`；如果是老手，你可能还会知道 ts 定义了一个原生类型 `type PropertyKey = string | number | symbol`，有时候偷个懒不想写一大串`string | number | symbol`，可以直接使用`PropertyKey`秀一把。

### Partial & Required

`Partial<T>` 将 `T` 的所有属性变为可选，例如：

```ts
type Vegetable = {
  Onion: string;
  Garlic: number;
};

type PartialVegetable = Partial<Vegetable>;
// type PartialVegetable = {
//     Onion?: string;
//     Garlic?: number;
// }
```

Partial 的实现如下：

```ts
type Partial<T> = {
  [P in keyof T]?: T[P];
};
```

这里有个知识点： 在冒号前加个 `?` （或`+?`）就表示该键值的类型是可选类型（即有可能是 undefined）.

同理，也可以 `-?`，就是把`Required`： 把所有属性变成必选

```ts
type Required<T> = {
    [P in keyof T]-?: T[P];
};


type Vegetable = {
  Onion？: string;
  Garlic？: number;
};

type RequiredVegetable = Required<Vegetable>;
// type RequiredVegetable = {
//     Onion: string;
//     Garlic: number;
// }
```

to be continued

[0]: https://www.typescriptlang.org/docs/handbook/utility-types.html
[1]: ../080.%20ts类型体操2-基础语法/README.md#1
