# 类型体操之常用语法

书接上文，工欲善其事，必先利其器。在开始类型体操前，我们至少得掌握最基本的 ts 语法。本文将介绍一些常用的类型体操语法，包括类型映射、类型条件判断、类型推断等。

## 类型映射<a id='1'></a>

类型映射（mapping）指的是，通过某种工具类型，将一个现有的类型 A 转换成一个新的类型 B，通常用于 object 对象上。例如，将类型 A 中的所有属性都转成 string，形成新的一个类型 B，如下所示：

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

不卖官子，直接给出答案：

```ts
type NumberToString<T> = {
  [K in keyof T]: string;
};

type B = NumberToString<A>;
// type B = {
//   a: string;
//   b: string;
// }
```

这里简单介绍一下语法点：

- T：泛型，表示任意类型。
- K：属性名变量。
- `keyof T`：返回类型 T 的每一个属性名，组成一个联合类型。这里就是 `'a' | 'b'`
- `in`：运算符，遍历右侧的联合类型的每一个成员。
- `[K in keyof T]`: string：表示遍历类型 T 的每一个属性，将属性值都转成 string 类型。

对于类型映射，其实还有一个考点：如果这个类型是一个基本（primitives）类型，会发生什么呢？

```ts
type primitivesType = NumberToString<string>; // string
```

答案是：基本类型会被原样返回。这个知识点很有用，我们会在之后的递推题里面反复用到，这里暂且略过。

## extends 关键词<a id='2'></a>

这里科普一下 extends 相关的八股文，extends 有三种基本用法：

1. 继承

```ts
interface Vehicle {
  wheels: number;
  maker?: string;
}

interface Car extends Vehicle {
  power: 'gas' | 'electricity';
}
```

接口继承接口，这个和 Java 里的用法相似，日常开发中很常见，但是类型体操里不常用。

2. 范型约束

范型约束其实也是 Java 中常见的技巧，但是很多 java 程序员可能 10 年都没真写过范型。但是如果要成文真正的中高级程序员，比如你是写开源库的程序员，你必定大量实用范型约束。

还是回到 ts 类型系统里，例如，如果你想从对象的属性中获取值，你可能会写下以下代码：

```ts
const testObj = { x: 10, y: 'Hello', z: true };

function getProperty<T>(obj: T, key: keyof T) {
  return obj[key];
}
```

虽然上面这段代码里给 key 加了个 `keyof T`的约束，但是还是不够严谨，让我们看一下 `getProperty`函数的调用：

```ts
const xValue = getProperty(testObj, 'x');
// const xValue: string | number | boolean

const yValue = getProperty(testObj, 'y');
// const yValue: string | number | boolean
```

`getProperty`函数的返回值类型是 `string | number | boolean`，这显然不是我们想要的。我们希望的是： `xValue: number, yValue: string`。那么，我们怎么做到这一点呢？答案就是：范型约束 + 条件类型。

```ts
function getProperty<T, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}

const xValue = getProperty(testObj, 'x');
// const xValue: number

const yValue = getProperty(testObj, 'y');
// const yValue: string
```

在上述示例代码中，使用关键字 `extends` 来约束泛型类型`K`。换句话说，选择`T`的键之一作为`K`，而不是允许任何键作为键参数的类型。因此，函数可以限制为仅返回一种类型，而不是联合类型。

范型约束在类型体操中通常用于判定 `@ts-expect-error`，类似于预期抛错的单测，大约一半的题目会用到。

3. 条件判断

type 运算中没有 `if` 关键词；我们做条件判断时，只能依赖三元运算：`T extends U ? X : Y`。如下所示：

```ts
type IsString<T> = T extends string ? true : false;

type x = IsString<'hello'>; // type x = true
type y = IsString<number>; // type y = false
type z = IsString<string>; // type z = true
```

逐字解释一下 `T extends string ? true : false;` ：

如果 `T`（左边）的类型是 `string`（右边）的子类型，也就是说，如果`T`类型可以赋值给 `string`，那么返回 true; 否则，返回 false。

三元运算在类型体操中非常实用，几乎每一道题目都能见到它。

## 整数

这里的整数不是指 number 类型，而是 number 的所有整数子类型，比如：`type N = 0 | 1 | 2`。类型体操中是有针对整数操作的题目的，但是很可惜类型系统中没有加减乘除四则运算，因此解这类题目只能借助其他类型来模拟。

类型系统里最直接获得整数结果的方法就是获得元祖（tuple）的长度，比如：

```ts
type Length<T extends any[]> = T['length'];
type five = Length<[1, 2, 3, 4, 5]>; // 5
```

这里用到了上文提到的 `extends` 范型约束，T 必须是一个元祖类型，否则会报错。然后，通过元祖的 `length` 属性，就可以获得元祖的长度，也就是整数。

_p.s._ 读取类型的属性用的方括号语法，这个和 JS 有共通之处

```ts
type Tuple = [1, 2];

type Len = Tuple['length']; // Len = 2
type Idx = Tuple[0]; // Idx = 1
```

那么，假如需要实现整数相加呢？本质上就是通过拼接两个元祖来来得到它们的总长度：

```ts
type Add<A extends any[], B extends any[]> = [...A, ...B]['length'];

type Test = Add<[1, 2, 3], [4, 5, 6]>; // 6
```

如上所示，拼接元祖用到的是 `...` 扩展运算符，这个和 JS 里的数组扩展运算符也是一样的。
但是这里还是提醒一下，JS 语法和类型系统语法差距很大，只有**极少数相同**，不能混用。比如不能在类型体操中直接使用 `Array` 类型，也不能使用 `push`、`pop` 等数组方法。

## 递归

Typescript 类型系统里还有一个反常规的特性：就是没有 for 循环。很多人可能会不适应，但事实上当你接触的编程语言变多了，就会发现，很多正经的语言它就是没有 for 循环的，比如 Haskell；即便是在 react，也不推荐使用 for。理由很简单 for 循环本质上就是产生 side effect。

言归正传，在做题时，保证会碰到需要使用跌倒的造作，没有 for，那怎么实现循环呢？
只能是递归了。（数学上已经证明[迭代都可以用递归实现][2]，这里不再展开了）

递归的思路很简单，就是将问题拆解成更小的子问题，然后通过递归调用自身来解决问题。比如，实现一个整数加一的递归函数：

```ts
type addOne<T extends number, R extends any[] = []> = R['length'] extends T
  ? [...R, 1]['length']
  : addOne<T, [...R, 1]>;

type Test2 = addOne<5>; // 6
```

这道题目对初学者来说有点难了，用到了我们上面提到的所有语法，但仔细看，其实思路很简单：

1. 定义一个递归函数 `addOne`，它接受两个参数：`T` 和 `R`。
2. `T` 是目标整数，`R` 是一个元祖，用于存储递归过程中产生的中间结果。
3. 在递归函数中，首先判断 `R` 的长度是否等于 `T`，如果等于，则返回 `R` 的长度加一，否则继续递归调用 `addOne` 函数，并将 `R` 的长度加一作为新的参数传入。

实现递归操作，我们用到一点小技巧：

1. 一般都要添加一个默认参数 R，做递归结束判断。
2. 给 R 一个默认值 （如 `[]`， 这样就可以在递归调用时，直接省略初始化操作

## infer

infer 是 Typescript 类型体操中一个非常重要的关键字，它用于在类型体操中推断类型。它的使用方式是在类型体操的函数中，使用 `infer` 关键字来声明一个类型变量，然后在类型体操的函数中，使用这个类型变量来推断类型。

比如，实现一个类型体操函数，用于推断元祖的最后一个元素：

```ts
type Last<T extends any[]> = T extends [...infer R, infer L] ? L : never;

type Test3 = Last<[1, 2, 3]>; // 3
```

infer 还有很多技巧，这里就不展开了，我们会在后续的文章中，在各个案例中详细展开介绍。

## 总结

本文介绍了开启 TS 类型体操前，所必备的基础知识，包括类型映射、条件判断、递归、类型推导等。这些知识是 TS 类型体操的基础，掌握了这些知识，我们就可以开始进行 TS 类型体操了。

最后，在加一些自己的心得：TS 类型系统事实上是和 JS 完全不同的一种语言。大家要以一种学习新语言的心态来做专项训练，不要试图用 JS 的语法去操作 TS 的类型体操。当你又掌握一门新语言后，你的世界会骤然开阔。

[1]: https://dev.to/tomoy/three-ways-of-using-extends-in-typescript-3dld
[2]: https://web.mit.edu/6.102/www/sp23/classes/11-recursive-data-types/recursion-and-iteration-review.html#:~:text=For%20those%20kinds%20of%20problems,could%20also%20be%20written%20recursively.
