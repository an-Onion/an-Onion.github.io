# TS类型体操

我想现在绝大多数前端开发都用过了Typescript，但是绝大多数开发其实处于新手村阶段。我和一起学习的同学，发现他们很多都只是会用Typescript，但是对Typescript的原理和类型系统并不了解。

因此，我准备写一个系列文章，来帮助大家理解Typescript的原理和类型系统。

这篇是第一篇，主要介绍如何进行系统性的提升类型水平，以及如何进行类型体操。

废话不多说如果你还不知道type-challenges是什么，请移步[这里][0]。

我们试着做一道热身体：

```ts
// expected to be string
type HelloWorld = any
// you should make this work
type test = Expect<Equal<HelloWorld, string>>
```

这题怎么解？其实考点就是起别名。

```ts
type HelloWorld = string
```

// TO BE CONTINUED


[0]: https://github.com/type-challenges/type-challenges