# ts 类型体操之 easy 题

终于还是被通知不被续约了，我得全心投入到新的求职之路上。还是继续我的类型体操系列文章，坚持每周都能正确的事。\
Easy 题就 13 题，难度比较低，我就整理到这一篇文章了。

## [If][8]

> 实现一个实用类型 If<C, T, F>，它接受一个 boolean 类型 C，一个真值 T 和一个假值 F。C 是 true 返回 T；C 是 false 返回 F。

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

所以，我们可以利用这个特性，把数组中的元素类型提取出来，然后通过《基础语法》篇里提到的类型映射，把每个元素类型作为键，元素本身作为值，就完成了这个题。

```ts
type TupleToObject<T extends readonly PropertyKey[]> = {
  [K in T[number]]: K;
};
```

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

1. `T extends any[]`：T 必须是一个数组类型
2. `T['length'] extends 0`：判断`T['length']`是否为`0`，如果`T['length']`不是，则表示大于`0`，返回`T[0]`——即第一个元素，否则返回`never`。

这里提一句`T[number]`本质等于`T[0] | T[1] | T[2] | ...`，所以它成了数组所有元素的联合类型，而`T['length']`则是一个具体的数字。

## 其他

###《ts 类型体操-内置工具(上)》

- [Pick][1]
- [Readonly][2]
- [Exclude][3]
- ###《ts 类型体操-内置工具(中)》

- [Parameters][9]

###《ts 类型体操-内置工具(下)》

- [Awaited][4]

[1]: https://github.com/type-challenges/type-challenges/blob/main/questions/00004-easy-pick/README.md
[2]: https://github.com/type-challenges/type-challenges/blob/main/questions/00007-easy-readonly/README.md
[3]: https://github.com/type-challenges/type-challenges/blob/main/questions/00043-easy-exclude/README.md
[4]: https://github.com/type-challenges/type-challenges/blob/main/questions/00189-easy-awaited/README.md
[5]: https://github.com/type-challenges/type-challenges/blob/main/questions/00011-easy-tuple-to-object/README.md
[6]: https://github.com/type-challenges/type-challenges/blob/main/questions/00014-easy-first/README.md
[7]: https://github.com/type-challenges/type-challenges/blob/main/questions/00018-easy-tuple-length/README.md
[8]: https://github.com/type-challenges/type-challenges/blob/main/questions/00268-easy-if/README.md
[9]: https://github.com/type-challenges/type-challenges/blob/main/questions/03312-easy-parameters/README.md
