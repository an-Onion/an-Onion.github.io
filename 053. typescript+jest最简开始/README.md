# TS+Jest 最简开始

[Jest][1] 是当下最主流的前端测试框架；但是对于初学者，Jest 配置入门并不算友好，尤其是选择了 Typescript 做开发语言，教程很烦琐。我最近试了一个叫[ts-jest][2]的预处理库，配置非常简单，一共就三步，这里推荐给大家。

## 安装

我们从空白 node 项目开始——这里以 yarn 为例——安装依赖：

```bash
yarn add -D jest typescript ts-jest @types/jest
```

主要就是四个库： `jest`、`typescript`自不必说，`ts-jest`是要用到的预处理器，`@types/jest`用于测试框架的类型推断。

## 生成配置

```bash
yarn ts-jest config:init
```

这里是利用 ts-jest 自动生成 jest.config.js 文件。生成的代码如下所示：就三行，很简单吧。

```javascript
// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
};
```

## 运行

```bash
yarn jest
```

完工！附上了[github repo][3]，大家可以 clone 下来跑一下，也欢迎点赞。

## Jest Runner

我们试着写一个简单的单元测试用例（该测试本身无意义）：

```typescript
function add(a: number, b: number): number {
  return a + b;
}

describe("add function", () => {
  it("1 + 1 = 2", () => {
    expect(add(1, 1)).toEqual(2);
  });
});
```

单元测试在日常操作中一般就是 git hook 里跑一个`yarn test:unit`，检查当前更改有没有破坏之前的代码逻辑。但是，开发阶段你更多只是跑一个 case。这时候你又要写新的命令`yarn jest fileName -t caseName`，很麻烦，而且很容易又碰到配置问题。这里推荐一款 vscode 插件——[Jest Runner][4]，看一下安装后的效果：

![Run][5]

每个 Case 前都会出现 `Run|Debug` 标识，点击后自动运行。我们再看看 Debug 效果：

![Debug][6]

只要在 vscode 上打上断点，点击 Debug 按钮，就会自动在断点处停止，很方便吧。

## 小结

本文简单介绍了 `ts+jest` 的入门配置，希望对初学者有所帮助。

最后再加几句题外话：神书《人月神话》里提到过开发进度的时间安排：

> 1/3 计划、1/6 编码、1/4 构件测试以及 1/4 系统测试

测试时间占了一半，很意外吧？但是，我见过的绝大多数开发人员，90%以上的时间都在编码；设计文档是不可能有的，测试用例也很稀少。说来惭愧，我自己也是在工作四年后，才开始改变那种工作方式的，然后我有了更多的时间写博客了，哈哈。不过，很可惜，我依旧无法改变周围人的开发方式，即便是强制他们写测试，也是应付了事，唉。
还有，我从事过软件外包工作，外包人员有个很具行业特色的现象——不写测试。不知道大家看到后，有没有觉得比我们外包强呢？

[1]: https://jestjs.io/
[2]: https://github.com/kulshekhar/ts-jest
[3]: https://github.com/an-Onion/typescript-jest-vscode
[4]: https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner
[5]: ./img/run.gif
[6]: ./img/debug.gif
