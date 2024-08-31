# ts 类型体操之 easy 题

终于还是被通知解除合同了，只能全心投入到新的求职之路上去了。不过，我还是想尽快完成《类型体操》系列文章，尽量每周都有产出。Easy 题共 13 题，题目都很短，我就全部整理到这一篇文章了。

## [If][8]

> 实现一个实用类型 If<C, T, F>，它接受一个 boolean 类型 C，一个真值 T 和一个假值 F。若 C 是 true 返回 T；若 C 是 false 返回 F。

```ts
type A = If<true, 'a', 'b'>; // expected to be 'a'
type B = If<false, 'a', 'b'>; // expected to be 'b'
```

考点：`extends` 的两个用途：类型约束和条件判断。

```ts
type If<C extends boolean, T, F> = C extends true ? T : F;
```

- `C extends boolean`：约束类型 C 必须是 boolean 类型。
- `C extends true`：判断 C 是否为 true 。

## [Tuple to Object ][5]

> 给定一个数组，将其转换为对象类型，键/值必须在提供的数组中。

```ts
const tuple = ['tesla', 'model 3', 'model X', 'model Y'] as const;

type result = TupleToObject<typeof tuple>; // expected { 'tesla': 'tesla', 'model 3': 'model 3', 'model X': 'model X', 'model Y': 'model Y'}
```

考点：数组（array）或元祖（tuple）类型有个`number`属性，它可以把数组或元祖中的元素类型提取出来构成联合类型.

比如：

```ts
type Tuple = [string, number];
type TupleNum = Tuple[number]; // string | number
```

所以，我们可以利用这个特性，把数组（`T`）中的元素类型提取成联合类型(`T[number]`)；然后通过《基础语法》篇里提到的类型映射，用 `in` 遍历该联合类型，最后确保键/值一致，就完成了这个题。

```ts
type TupleToObject<T extends readonly PropertyKey[]> = {
  [K in T[number]]: K;
};
```

`p.s.` 还记得 `PropertyKey` 是什么吗？它是 `string | number | symbol` 的别名。

## [Length of Tuple][7]

> 获取元祖的长度。

如：

```ts
type tesla = ['tesla', 'model 3', 'model X', 'model Y'];
type spaceX = [
  'FALCON 9',
  'FALCON HEAVY',
  'DRAGON',
  'STARSHIP',
  'HUMAN SPACEFLIGHT',
];

type teslaLength = Length<tesla>; // expected 4
type spaceXLength = Length<spaceX>; // expected 5
```

考点：数组类型有个`length`属性，它表示该数组的长度。用法和`T[number]`有点区别，`length`外要加个要引号——`T['length']`。

实现就很简单了，直接返回`T['length']`即可。

```ts
type Length<T extends readonly any[]> = T['length'];
```

## [First of Array][6]

> 从一个数组类型中获取它的第一个类型。

如：

```ts
type arr1 = ['a', 'b', 'c'];
type arr2 = [3, 2, 1];

type head1 = First<arr1>; // expected to be 'a'
type head2 = First<arr2>; // expected to be 3
```

考点：`T[0]`表示数据第一个元素，`T[1]`第二个，依次类推。如果 index 超出了数组长度，则返回`undefined`。

实现入下：

```ts
type First<T extends any[]> = T['length'] extends 0 ? never : T[0];
```

简单解释一下：

1. `T extends any[]`：限定 T 必须是一个数组类型
2. `T['length'] extends 0`：判断`T['length']`是否为`0`，如果`T['length']`不是，则表示大于`0`，返回`T[0]`——即第一个元素，否则返回`never`。

这里提一句`T[number]`本质等于`T[0] | T[1] | T[2] | ...`，所以它成了数组所有元素的联合类型，而`T['length']`则是一个具体的数字。

## [Concat][10]

> 在类型系统中实现 JavaScript 的 Array.concat 函数。该类型接受两个数组参数。输出一个新数组，按从左到右的顺序包含输入内容。

如：

```ts
type Result = Concat<[1], [2]>; // expected to be [1, 2]
```

考点：`...` 扩展运算符（Spread syntax）：它可以在数组构造时，将数组表达式在语法层面展开。

知道这个考点，答案就呼之欲出了。

```ts
type Concat<T extends readonly unknown[], U extends readonly unknown[]> = [
  ...T,
  ...U,
];
```

但是要注意：这个是类型系统的数组，不是 JS 的数组；它们俩只有极少数的语法是相同的。学习类型系统，还是要以学习新语言的态度去对待。

下面再做两道类似的题目。

## [Push][11]

> 实现 Array.push：在数组末尾追加一个元素

如：

```ts
type Result = Push<[1, 2], '3'>; // [1, 2, '3']
```

考点： 还是扩展运算符

```ts
type Push<T extends readonly unknown[], U> = [...T, U];
```

## [Unshift][12]

> 实现 Array.unshift，就是在数组的开头添加元素。

如：

```ts
type Result = Unshift<[1, 2], 0>; // [0, 1, 2]
```

做完 Push，这题就毫无压力了。

```ts
type Unshift<T extends unknown[], U> = [U, ...T];
```

## [Includes][13]

> 在类型系统中实现 JavaScript 的 Array.includes 函数。该类型接受两个参数。输出应为布尔值 true 或 false。

如：

```ts
type isPillarMen = Includes<['Kars', 'Esidisi', 'Wamuu', 'Santana'], 'Dio'>; // expected to be `false`
```

考点：1. 扩展运算符和 infer 的结合；2. 递归

这题还是有点难度的，理论上不应该是 easy 题。我们先看答案，再解释：

```ts
type Includes<T extends readonly any[], U> = T extends [
  infer First,
  ...infer Rest,
]
  ? Equal<First, U> extends true
    ? true
    : Includes<Rest, U>
  : false;
```

逐行解释：

1. `T extends [infer First, ...infer Rest]`：我们使用扩展运算符，将数组 T 展开为`First`和`Rest`两部分。其中，`First`是数组的第一个元素，`Rest`是数组的剩余部分。这个语法大家要记住，之后的 medium 题里面会反复出现。
2. `Equal<First, U> extends true ? true : Includes<Rest, U>`：我们使用 infer 关键字推断出 First 类型，接着将 First 和 U 进行比较。如果相等，则返回 true；否则，递归调用 Includes，将剩余部分 Rest 和 U 进行比较。
3. `: false`：如果数组 T 为空，则返回 false。

`p.s.`：`Equal` 不是原生的 ts 类型方法；但是在 type challenge 里我通常都直接用。它的实现大大超出了本文 easy 的范畴，我会在之后 hard 篇章里解释，这里先把它的实现列一下，有兴趣的朋友可以到[这里][14]查看。

```ts
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
```

## 其他

还有五道 easy 题，我在之前《内置工具》相关的篇章里系统讲过了，这里就不占篇幅了。大家有兴趣的话可以回顾一下本系列先前的文章。

###《ts 类型体操-内置工具(上)》

- [Pick][1]
- [Readonly][2]
- [Exclude][3]

###《ts 类型体操-内置工具(中)》

- [Parameters][9]

###《ts 类型体操-内置工具(下)》

- [Awaited][4]

## 小结

Easy 篇主要还是在介绍语法，这些语法非常实用，是以后 medium 题目的基础。可以肯定的是，不做题的同学基本不可能了解这类知识。类型系统是一门图灵完备的语言，但是我很想吐槽 ts 官方文档，它把很重要的语法点散落在在边边角角的篇章里，以至于普通人根本意识不到它的语言能力。也许正是因为官方的不重视，导致绝大多数同学的 ts 水平永远停留在了新手村。

[1]: https://github.com/type-challenges/type-challenges/blob/main/questions/00004-easy-pick/README.md
[2]: https://github.com/type-challenges/type-challenges/blob/main/questions/00007-easy-readonly/README.md
[3]: https://github.com/type-challenges/type-challenges/blob/main/questions/00043-easy-exclude/README.md
[4]: https://github.com/type-challenges/type-challenges/blob/main/questions/00189-easy-awaited/README.md
[5]: https://github.com/type-challenges/type-challenges/blob/main/questions/00011-easy-tuple-to-object/README.md
[6]: https://github.com/type-challenges/type-challenges/blob/main/questions/00014-easy-first/README.md
[7]: https://github.com/type-challenges/type-challenges/blob/main/questions/00018-easy-tuple-length/README.md
[8]: https://github.com/type-challenges/type-challenges/blob/main/questions/00268-easy-if/README.md
[9]: https://github.com/type-challenges/type-challenges/blob/main/questions/03312-easy-parameters/README.md
[10]: https://github.com/type-challenges/type-challenges/blob/main/questions/00533-easy-concat/README.md
[11]: https://github.com/type-challenges/type-challenges/blob/main/questions/03057-easy-push/README.md
[12]: https://github.com/type-challenges/type-challenges/blob/main/questions/03060-easy-unshift/README.md
[13]: https://github.com/type-challenges/type-challenges/blob/main/questions/00898-easy-includes/README.md
[14]: https://github.com/microsoft/TypeScript/issues/27024
