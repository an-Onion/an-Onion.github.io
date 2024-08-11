# ts 类型体操之内置工具类型（上）

在 TypeScript 中，内置工具类型（utility types）是一组预定义的类型，用于在类型层面上进行各种操作。对于 ts 开发者来说，开始使用这类工具是一个走出新手村的重要标志。截止至 2024 年 8 月，ts 官方共提供了 22 个内置的工具类型。大家可以在官网查看具体的[文档][0]。当然，本文并不是来集中介绍这些类型的用法，我们要更近一步，来看看如何用更底层的类型方法来实现这些工具类型。

## Record

我们先从最简单的入手

`Record<K, T>` 将 `K` 中的每个属性值转化为 `T` 类型，例如：

```ts
type Animal = 'Dog' | 'Cat';

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

## Partial & Required & Readonly

### `Partial<T>`： 将 `T` 的所有属性变为可选，例如

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

这里有个知识点： 在冒号前加个 `?` （等价于`+?`）就表示该键值的类型是可选类型（即有可能是 undefined）.

### `Required<T>`： 把所有属性变成必选

有 `+?` 操作，自然也有 `-?`，Required 就是 Partial 的反向操作：

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

### `Readonly<T>`： 将所有属性变成只读

类似加减 `?` 的操作还有一个就是：加减 `readonly`，只不过 `readonly` 要放在属性的最前面。

再看看 `Readonly` 的实现（这里`readonly`等价于`+readonly`）：

```ts
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};
```

正好，我们再做个练习题： [Mutable][2]

> 实现通用的 `Mutable<T>`, 使得`T`中的所有属性都是可变的(不是只读的)

```ts
interface Todo {
  readonly title: string;
  readonly completed: boolean;
}

type MutableTodo = Mutable<Todo>; // { title: string; completed: boolean; }
```

很简单，`-readonly` 就行

```ts
type Mutable<T extends object> = {
  -readonly [K in keyof T]: T[K];
};
```

## Exclude & Extract & Pick & Omit

我们稍增加一点难度，实现一些有两个泛型的类型

### `Exclude<T, U>`: 从`T`中剔除那些可赋值给`U`的类型

Exclude 主要用户联合类型的造作。如下所示从联合类型 `a' | 'b'` 中剔除`c` ( `c` 是 `'a' | 'c'`的子集 ) 得到 `b`

```ts
type C = Exclude<'a' | 'b', 'a' | 'c'>; // 'b'
```

答案很简单直接用 extends 判断就行了：

```ts
type Exclude<T, U> = T extends U ? never : T;
```

不过这里要补充个 extends 的知识点，

`T extends U ? never : T` 实际执行时是对联合类型`T`里的每一个元素分别进行条件判断，然后对每一个条件判断的结果再组装成新的联合类型。以 `Exclude<'a' | 'b',  'a' | 'c'>` 为例：实际执行时

1. 等于 `('a' extends 'a' | 'c' ? never : 'a') | ('b' extends 'a' | 'c' ? never: 'b')`；
2. 等于 `(never) | ('b')`；
3. 等于 `'b'` （任何元素和`never`的联合类型等于其本身）

联合类型的条件判断本质上在进行“**_遍历_**”，这是个很有趣的语法特性。我们这里暂不展开了，之后我会在实际的案例中解释如何用这个特性解决一些需要依靠**_遍历_**来破解的问题。

### `Extract<T, U>`： 从`T`中提取可赋值给`U`的类型

Exclude 的反向操作就是 Extract，就是剔除不包含在 U 里的类型。这个太简单了，一笔带过：

```ts
type Extract<T, U> = T extends U ? T : never;
```

### `Pick<T, K>`： 从 `T` 中，提取出所有键值在联合类型 `K` 中的属性

如下所示，我只想保留 Todo 类型里的 title 和 completed 键值对：

```ts
interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

type TodoPreview = Pick<Todo, 'title' | 'completed'>;
// type TodoPreview = {
//     title: string,
//     completed: boolean
// }
```

对`Pick<T, K>`，这里有两个考点:

1. `K` 的取值：`K` 应该是 `T` 里已经存在的键值，比如你传个 `hello` 需要抛错
2. `K` 是个联合类型，所以需要遍历

我们看看实现：

```ts
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

答案还是一个简单的类型映射：

1. 通过 `K extends keyof T` 限定 K 必须是 T 的所有键值的子集
2. 用个 `in` 遍历 `K` 就行了 （`in keyof` 不是固定组合……）

### `Omit<T, K>`: 构造一个除类型`K`以外具有`T`属性的类型

Omit 是 Pick 的反向操作，排除对象 `T` 中的 `K` 键值。 Omit 在名字上容易和 Exclude 搞混。记住 Exclude 主要用在联合类型，而 Omit 主要用于对象类型上。如下所示，我要剔除 Todo 里的 description 和 title 两个键值对：

```ts
type TodoPreview = Omit<Todo, 'description' | 'title'>;

// type TodoPreview = {
//     completed: false,
// }
```

`Omit<T, K>` 对 K 没有特别限制，只需要是正常的 JS 对象键类型（`string | number | symbol`）就是了。实现上正好活用一下上面刚提到的方法类型——`Pick`和`Exclude`：

1. 从 T 的所有键中剔除(`Exclude`)掉联合类型 K（`Exclude<keyof T, K>`）
2. 提取（`Pick`）出所有键值在上一步得到的结果中的属性

```ts
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

## 小结

由于篇幅所限，我们暂时先介绍 8 个最简单，但又是最贴近实战的工具方法。当你开始使用这些工具类型时，你的新手村小伙伴们一定会眼前一亮的。之后的文章，我会进一步介绍剩下的内置工具类型，当然他们更加复杂也更能帮助我们提升认知。敬请期待。

[0]: https://www.typescriptlang.org/docs/handbook/utility-types.html
[1]: ../080.%20ts类型体操2-基础语法/README.md#1
[2]: https://github.com/type-challenges/type-challenges/blob/main/questions/02793-medium-mutable/README.md
