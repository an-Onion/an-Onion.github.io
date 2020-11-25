# IoC in Typescript

高效的工作方式都有一个共性：把大任务拆分为多个小任务，再一一破解；较小的任务可以减少我们的心智负担，也帮助我们更高效的分配、解决问题。
用在软件工程上，就是通过分治手段，将软件模块化，实现高内聚低耦合。

OK，本文以 IoC（控制反转） 入手，介绍我总结的一套高效开发方式。

## Bad Practice

我们先不解释什么是 IoC，以一个简单的 Controller 调 Service 的例子，看一个高耦合的 Bad Practice：

- UserService.ts

  ```typescript
  export class UserService {
    getUsers(): Promise<User[]> { ... }
  }
  ```

- UserController.ts

  ```typescript
  import { UserService } from "./UserService";

  export class UserController {
    private userService: UserService;

    constructor() {
      this.userService = new UserService();
    }

    getUsers(): Promise<User[]> {
      return this.userService.getUsers();
    }
  }
  ```

我以前就是这么写 JS 代码的——Controller 的依赖（Service）在构造函数里实例化。这个就是经典的**源代码依赖**：

> 源代码依赖：当前模块（module，class 等等）需要依赖多个其他模块才能编译

对于底层小职员来说，考虑编译速度还是太过遥远了；现实生活中，我们通常遇到的难题是：KPI 考核里有一项叫**测试覆盖率**的东西。
上面的代码就很难写单元测试，因为 Service 很可能还需要再依赖 ORM 框架，甚至需要连接 DB 才能运行；这痒的测试不仅仅是麻烦的问题，调试速度还特别感人；测试一多，还有 DB 连接池等一系列问题。

## Better Practice

如何让测试变得简单呢？DI——Dependency Injection！

> 依赖注入（DI）: 组件之间的依赖关系由容器在运行期决定；通俗来说，即由容器动态地将某个依赖关系注入到组件之中

实操如何？我们稍微改写一下 Controller 代码就可以了：

```typescript
import { UserService } from "./UserService"; // Still Bad!

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  getGetUsers(): Promise<User[]> {
    return this.userService.getUsers();
  }
}
```

变化很小，就是不让 userService 在 UserController 内部实例化；而是交由外部容器通过构参的形式**注入** userService：

```typescript
// UserController.test.ts
describe("Unit test of UserController", () => {
  let userController: UserController;

  beforeEach(() => {
    const userService = new UserService();
    userController = new UserController(userService);
  });
}
```

不过，上述代码这样还是没能解决**源代码依赖**的问题——UserController 依旧在`import { UserService }`。 So？

## Best Practice

我们还得用到依赖倒置（Dependency Inversion）

> 依赖倒置原则: 高级模块不应该依赖低级模块，而是依赖抽象

什么意思呢？我们先不解释，看一下代码改造：

- UserService.ts

  ```typescript
  export interface IUserService {
    getUsers(): Promise<User[]>
  }

  export class UserService implements IUserService {
    getUsers(): Promise<User[]> { ... }
  }
  ```

- UserController.ts

  ```typescript
  import { IUserService } from "./UserService";

  export class UserController {
    private userService: IUserService;

    constructor(userService: IUserService) {
      this.userService = userService;
    }

    getGetUsers(): Promise<User[]> {
      return this.userService.getUsers();
    }
  }
  ```

改造后代码的最大区别就是：UserController 不再 `import UserService`， 只`import`了它的抽象`IUserService`。
我们看一下 UML 类图，UserController 直接从源代码层面解耦了 UserService 以及 UserService 的所有相关依赖；而 IUserService 只是一个接口类型，不值几个字节。

![Dependency Inversion][1]

## Mock Test

通过依赖倒置解耦后，我们的单元测试也变得更简单了——因为我们可以写 Mock 测试了：

```typescript
export class MockUserService implements IUserService {
  getUsers(): Promise<User[]> {
    return Promise.resolve([]);
  }
}
```

由于 MockUserService 继承了 IUserService，我们可以利用多态直接将 Mock 实例注入到 Controller 里。这样，测试也和 UserService 以及后续一系列 DB 操作解耦了。

```typescript
// UserController.test.ts
import { MockUserService } from "./UserService";
import { UserController } from "./UserController";

describe("Mock test with UserController", () => {
  let userController: UserController;

  beforeEach(() => {
    userController = new UserController(new MockUserService());
  });

  it("Return an empty array of users", async () => {
    const users: User[] = await userController.getGetUsers();
    expect(users).toStrictEqual([]);
  });
});
```

## What is IoC

> 控制反转（IoC）是面向对象编程中的一种设计原则：对象在被创建的时候，由一个调控系统内所有对象的外界实体，将其所依赖的对象的引用注入给它

IoC 只是一种设计原则，而上面提到的 DI（注入依赖） 则是实现 IoC 的一种实现技术。最经典的 DI 框架就是 Spring，它利用一份 XML 定义注入关系。后来的框架又逐步转向 `@annotation` 这种形式实现 DI；Typescript 里比较出名的框架有 NestJs 和 Midway。不过这类框架封装太深，已看不到真实的 DI 过程。我后来看到一个叫[awilix][2]的 JS 库，它也实现了一套简单的 DI 容器；我们可以从它的实例里看一下真实框架下的 DI 执行过程：

```typescript
import * as awilix from "awilix";
import { UserController } from "./UserController";
import { UserService } from "./UserService";

// 1. Create a container
let container: awilix.AwilixContainer = awilix.createContainer({
  injectionMode: awilix.InjectionMode.CLASSIC, // matches constructor parameters by name.
});

// 2. register dependency to the container
container.register({
  userController: awilix.asClass(UserController),
  userService: awilix.asClass(UserService),
});

// 3. Resolve the dependencies
const userController: UserController = container.resolve<UserController>(
  "userController"
);

console.log(await userController.getGetUsers());
```

在这个 JS app 里，DI 容器的执行过程就三步：

1. 创建一个全局的容器
2. 将所有使用到的依赖注册到该容器中
3. 解析依赖，并自动完成注入

[实例代码][3]我放在了 github 上了；大家也可以在自己的代码上用 awilix 重构一下。实现其实很简答啦，就是写一份全局的 DI 容器注册文件将所有依赖关联起来；最后，在 api handler 里——以 express 为例——用到某 controller 时，直接 `container.resolve('controllerName')` 出来就行了。

## 小结

前几天看了鲍勃·马丁叔叔的程序员誓言，其中有两段挺有意思的：

- 我将在每个发行版本中生成一个快速、可靠和可复用的证明，证明代码中的每个元素都能正常运行
- 我会进行小版本的快速迭代，以免阻碍他人的进度

早些年我对小版本快速迭代的开发方式不以为意；非得一次性完成**新功能+顺手重构+无测试**的代码后，才肯提交 MR；一个 MR 少则十几个，多则几十个文件的 changes，代码混乱不堪。原因很简单：周边人都是这么干的。

虽然工作很简单，也不会累着吧。但是年纪大了，杂事也多了，往往顾此失彼。现在我调整了开发方式：

1. 画设计图，把 feature 拆分成多个子模块
2. 定义相关抽象，提 MR
3. 写一个文件的模块（如 class）+ 单元测试，也不集成到系统中，直接提 MR
4. 所有子模块实现后，注册到 IoC 容器里，集成测试，提 MR，完工！

每次提交都在四五个文件以内，绝大多数时间都不需要起本地环境。有些人吹乂开发不用 IDE，事实上是可以理解的。大家也可以试试我的开发方式，至少我自己因此多了写 blog 的时间了 😄。

[1]: ./img/UserController.drawio.png
[2]: https://github.com/jeffijoe/awilix
[3]: ./src/main.test.ts
