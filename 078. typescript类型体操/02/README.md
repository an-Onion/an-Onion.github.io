# 类型体操之类型映射

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
* keyof T：返回类型 T 的每一个属性名，组成一个联合类型。这里就是  `'a' | 'b'`
* in：运算符，遍历右侧的联合类型的每一个成员。
* [K in keyof T]: string：表示遍历类型 T 的每一个属性，将属性值都转成 string 类型。

