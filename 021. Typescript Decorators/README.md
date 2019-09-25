# Typescript 装饰器

我想绝大多数开发人员都见识过 java 里的 annotation，经典的 `@` 图标， 如（`@Override`）:

```java
class Derived extends Base {
  @Override
  public void run() {...}
}
```

Java `@annotation` 常常运用于面向切片编程（[AOP][1]）——利用一些附加元素监听或修改类中元素。那 Typescript 作为一种新兴语言，它有没有自己的 “annotation” 语法呢？答案是，有；并且它有一个特定的名字叫 **Decorator（修饰器）**。

## Decorator 简介

TS 很早就在语法里加入了 Decorator 的概念，和 Java 类似，也是一个 `@expression` 标签。只不过 Decorator 在[tc39][2]里迟迟没有离开过 Stage 2，TS 也不敢轻举妄动。（TS 声称兼容 ECMAScript，早些年过早推出实验性功能，结果被 ECMAScript 坑了）。所以想尝鲜的话，还得现在 `tsconfig.json` 里添加如下内容：

```json
{
  "compilerOptions": {
      "target": "ES6",
      "experimentalDecorators": true
  }
}
```

我们看一下修饰器在 TS 中的使用方式：

```Typescript
@classDecorator
class Persion {
    @propertyDecorator
    private name: string;
    constructor(name: string) {
        this.name = name;
    }

    @methodDecorator
    public greet(@parameterDecorator message: string) {}

    @accessorDecorator
    get name() {}
}
```

有如下五种装饰器，分别是添加在类、属性、方法、参数和访问者头上的@修饰符；主要功能就是在运行时，观察或是修改它们的装饰对象。

* Class Decorator
* Property Decorator
* Method Decorator
* Parameter Decorator
* Accessor Decorator

## Class Decorator

先从类修饰器开始讲。类修饰器作用的对象时是 class 的构造器——constructor。

老规矩，我们先定义一个 Onion 类，它只包含一个叫 name 的公共属性；我们为它的构造器定义一个 `type` —— `ConstructorTpye` 留作后用。

```Typescript
class Onion {
  constructor(public readonly name: string) {}
}

type ConstructorTpye = new(name: string) => Onion;
```

接着，我们再看看类修饰器在 TS 里的定义：是一个`参数`为函数、`返回`为函数（或 void）的函数。（有点绕！）

```Typescript
declare type ClassDecorator = <T extends Function>(target: T) => T | void
```

实际使用中，上述的参数和返回类型事实上就是`class构造器`的类型，在我们的案例里就是刚才准备了的 `ConstructorTpye`。看一下具体实现，大家体会一下：

```Typescript
function overrideName(constructor: ConstructorTpye) {
  return class extends constructor {
    public name: string = 'override';
  };
}
```

使用方法如下：

```Typescript
@overrideName
class Onion {
  public name: string;
  constructor(name: string) {
    this.name = name;
  }
}

const onion: Onion = new Onion('Onion');
console.log(onion.name); // override
```

嗯，`onion.name`的输出结果是 `override`，不是 `Onion`；说明构造器在运行时被我们自定义的 Decorator 给替换掉了。事实上，类修饰器的原理就是将原始的构造函数以参数形式传入，并以新的形式传出。我们甚至可以给类添加多个修饰器，如下:

```Typescript
@f @g
class Onion{
  ...
}
```
`@f` 和 `@g` 的作用机理相当于数学上的函数组合——`f(g(constructor))`。

当然更多的时候，你会看到类修饰器是这么用的：

```Typescript
@colorDecorator('red')
class Onion {
  ...
}
```

修饰器里会传一个参数，这就是所谓的修饰器工厂。了解[工厂方法][3]的朋友应该很快能想到他的实现了：

```Typescript
function colorDecorator(color: string) {
  return (constructor: ConstructorTpye ) =>
    (class extends constructor {
      public color: string = color;
    });
}
```

在 TS 里我们的实现就是一个高阶函数——`colorDecorator('red')` 返回的就是一个 ClassDecorator 函数。上述代码，我们通过修饰器工厂给类添加了一个新的公共属性—— `color`，并对其赋值。

```Typescript
@colorDecorator('red')
class Onion {
  public name: string;
  constructor(name: string) {
    this.name = name;
  }
}

const onion: Onion = new Onion('Onion');
console.log(onion); // Onion { name: 'Onion', color: 'red' }
```

打印结果如上所示，onion 被添加了新的属性 `color`；它变成了一个红色的洋葱。


## Methond Decorators

有了类修饰器的基础，方法修饰器也应该不难理解了——就是在运行时监测、修改方法调用。用法也很简单：在方法前加一个`@expression`就行了。

```Typescript
class Persion {
  constructor( private firstName: string, private lastName: string) {}

  @log
  public getFullName(): string {
      return `${this.firstName} ${this.lastName}`;
  }
}
```

我们看一看方法修饰器的类型定义：

```Typescript
declare type MethodDecorator = <T>(target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => PropertyDescriptor<T> | void;
```

相比类修饰器，方法修饰器它的参数列表稍长一点——共三个：

1. target：当前对象的原型链，以 Persion 类为例，它就是 `Person.prototype`
2. propertyKey：方法的名字：如 `getFullName`
3. descriptor：方法的描述，也就是`Object.getOwnPropertyDescriptor(Person.prototype, propertyKey)`

如代码示例，我们试着给 `getFullName` 方法添加 `@log`，并希望在 `getFullName` 被调用时打印返回结果。

```Typescript
export function log(
  target: object,
  propertyName: string,
  descriptor: PropertyDescriptor): void {

    const greet: Function = descriptor.value;

    descriptor.value = function() {
      // invoke getFullName() and get its return value
      const result: string = greet.call(this);
      console.log(result);
      return result;
  };
}
```

实现上很简单，从 `descriptor` 里取出被修饰方法，然后重写 `descriptor.value` ——即在新 `function` 里打印出原始方法（`getFullName`）的结果。看一下执行结果：

```Typescript
const emp: Persion = new Persion('Onion', 'Garlic');
const fullName = emp.getFullName(); // Onion Garlic
```

这样，即便我们没有使用`console.log(fullName)`，也成功打印出了全名。

## Others

剩下还有三种 Decorator，它们比较简单，我就快速过一下了：

* Accessor Decorator:

  它就是作用在`getter`和`setter`上的修饰器，类型和 Method Decorator 一模一样，一般就是修改一下对象的 PropertyDescriptor

* Property Decorator

  属性修饰器的类型如下，`target` 和 `propertyKey` 与 Method Decorator 前两个参数表意一样，一般就是利用`Object.defineProperty`修改 target 的描述。

  ```Typescript
  declare type PropertyDecorator = <T>(target: object, propertyKey: string | symbol) => void;
  ```

* Parameter Decorator

  参数修饰符的类型如下，`target` 和 `propertyKey` 不提了，`parameterIndex` 是所在函数参数列表的位置，因此常对该参数进行定制化处理，比如检验一下该参是否为空。

  ```Typescript
  declare type ParameterDecorator = (target: object, propertyKey: string | symbol, parameterIndex: number) => void;
  ```

## 小结

这期介绍了一下 TS 修饰器的使用方式。Decorator 与 java 的 `@annotion` 非常相似，就是利用内省（introspection）机制，在运行时观察、修改被修饰对象的一种 function。它目前还处于实验阶段，我看了一下[tc39 提案][2]，它的语法就与 TS 大相径庭——有一个叫 `decorator` 的语法申明；因此现阶段的实现很可能在之后有巨大的转向。不过，修饰器在各类 TS 框架中已被广泛应用，如 vue3、nestjs 等等，大家也应该紧跟时代潮流尽早接触这类新兴的技术实现。

```javascript
// tc39 demo
decorator @log {
  @initialize((instance, key, value) => {
    instance[key] = value;
  })
}
```

[1]: https://en.wikipedia.org/wiki/Aspect-oriented_programming
[2]: https://github.com/tc39/proposal-decorators
[3]: https://www.jianshu.com/p/bc42541b7851
