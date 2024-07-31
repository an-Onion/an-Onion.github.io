
#  类型体操之常用语法

## 类型映射

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
}

type B = NumberToString<A>;
// type B = {
//   a: string;
//   b: string;
// }

```

这里简单介绍一下语法点：

* T：泛型，表示任意类型。
* K：属性名变量。
* `keyof T`：返回类型 T 的每一个属性名，组成一个联合类型。这里就是  `'a' | 'b'`
* `in`：运算符，遍历右侧的联合类型的每一个成员。
* `[K in keyof T]`: string：表示遍历类型 T 的每一个属性，将属性值都转成 string 类型。

## extends 关键词

这里科普一下 extends 相关的八股文，extends 有三种基本用法：


1. 继承
   
```ts
interface Vehicle {
    wheels: number;
    maker?: string;
}

interface Car extends Vehicle {
    power: "gas" | "electricity";
}
```

接口继承接口，这个和 Java 里的用法相似，日常开发中很常见，但是类型体操里不常用。

2. 范型约束

范型约束其实也是 Java 中常见的技巧，但是很多 java 程序员可能 10 年都没真写过范型。但是如果要成文真正的中高级程序员，比如你是写开源库的程序员，你必定大量实用范型约束。

还是回到 ts 类型系统里，例如，如果你想从对象的属性中获取值，你可能会写下以下代码：

```ts
const testObj = { x: 10, y: "Hello", z: true };

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

`getProperty`函数的返回值类型是 `string | number | boolean`，这显然不是我们想要的。我们希望的是：  `xValue: number, yValue: string`。那么，我们怎么做到这一点呢？答案就是：范型约束 + 条件类型。

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

3. 条件类型

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




[1]: https://dev.to/tomoy/three-ways-of-using-extends-in-typescript-3dld