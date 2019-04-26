# 设计模式之工厂模式

开个新坑，复习基础知识，用typescript写写旧技术——设计模式。今天就介绍一下**工厂模式**，以及其他两个衍生模式**工厂方法**和**抽象工厂**。

## 简单工厂

工厂模式，又称简单工厂，顾名思义就是使用“工厂”（一个或一系列方法）去生产“产品”（一个或一系列的派生类实例）。UML如下所示：

![Simple Factory][1]

这里我定义产品接口为Vegetable，它的两个派生类为Onion和Garlic：

```typescript
// Vegetable.ts
interface Vegetable {
  fry(): void;
}

class Onion implements Vegetable {
  public fry(): void {
      console.log('Onion');
  }
}

class Garlic implements Vegetable {
  public fry(): void {
      console.log('Garlic');
  }
}
```

我们的“蔬菜工厂”如下所示，通过调用不同的方法生产出不同的蔬菜实例。

*p.s.* 有些工厂模式的实现只有一个函数体，根据特定参数来“生产”特定的派生实例，这也是可行的。


```typescript
// SimpleFactory.ts
import {Garlic, Onion, Vegetable} from './Vegetable';

class SimpleFactory {
  public createOnion(): Vegetable {
    return new Onion();
  }

  public createGarlic(): Vegetable {
    return new Garlic();
  }
}
```

最后再来看一下client调用：

```typescript
// client.ts
import {SimpleFactory} from './SimpleFactory';
import {Vegetable} from './Vegetable';

const factory: SimpleFactory = new  SimpleFactory();

let onion: Vegetable = factory.createOnion();
let garlic: Vegetable = factory.createGarlic();

onion.fry(); // Onion
garlic.fry(); // Garlic
```

OK，问题来了，我们使用工厂模式的意义是什么？饶了这么一大圈不就是打印了个两个菜名吗？为什么不直接new呢？

```typescript
import {Onion, Garlic} from './Vegetable';

let onion: Onion = new Onion();
let garlic: Garlic = new Garlic();
```

嗯，直接new两个蔬菜实力确实特别简单，但是在大型软件开发中这很危险，用专业术语来说是违反了**依赖倒置原则**：

> 高层模块不应该依赖于低层模块，二者都应该依赖于抽象；抽象不应该依赖于细节，细节应该依赖于抽象

有点抽象，阳春白雪和者必寡，我们还是走下里巴人路线吧。通俗来讲，引入的依赖并不可靠，它一般是第三方库或是其他开发人员实现的代码；在不确定的某一天，里面的代码会被修改掉甚至是删除。这时候你的代码会变得很脆，不知不觉中就崩了。但现实中又不可能不引入其他依赖，所以大家就**约定**最小依赖引入。依赖提供者将隐藏对象的属性和实现细节，仅对外公开接口（抽象），这就是OOP三大特性之一的[封装][5]。


 再回看一下client实现，只import了一个共同接口`Vegetable`。运行时，我们利用[多态][4]——`let onion: Vegetable = factory.createOnion()`——就可以实现派生方法的动态绑定（`onion.fry()`）。这样，“派生蔬菜”的修改就不会影响现有代码了。哪天`VegetableFactory`开发者觉得Onion子类实现太过丑陋或是性能太差，他只需在简单工厂里换一个新的“派生蔬菜”——`OnionFromJapan`即可，client代码不需要做任何改动。

 ```typescript
class VegetableFactory {
  public createOnion(): Vegetable {
    return new OnionFromJapan();
  }
}
```

当然，简单工厂也有它自己存在的问题，“蔬菜”种类可能有成千上万，如果都是依靠同一个工厂生产，那么必然会使得工厂代码及其庞大。这就有了**工厂方法**的设计实现。

## 工厂方法

工厂方法就是针对每一种产品提供一个工厂类，通过不同派生工厂创建不同的产品。

![Factory Method][2]

实现很简单，为每种蔬菜提供对应的派生蔬菜工厂就行了。问题又来了，工厂与蔬菜一一对应有没有多此一举呢？要不直接new？嗯，不给出答案了，回去体会一下oop三大特性：封装、多态、[继承][6]。

```typescript
import {Garlic, Onion, Vegetable} from './Vegetable';

interface VegetableFactory {
  create(): Vegetable;
}

class OnionFactory implements VegetableFactory {
  public create(): Vegetable {
    return new Onion();
  }
}

class GarlicFactory implements VegetableFactory {
  public create(): Vegetable {
    return new Garlic();
  }
}
```

工厂方法减轻了工厂类的负担，新增一种“蔬菜”只需添加一个特定的“蔬菜工厂”即可，这就符合了**开放闭合原则**：

> 对扩展是开放的；对修改是关闭的

这里提一下，**开放闭合原则**并不是说接口一成不变，它要求的是增量变化——只增加新方法，不改动旧方法。

## 抽象工厂

**工厂方法**自然比**简单工厂**更加灵活，但是假如业务有所变更，比如需要添加“蔬菜”的周边产品——“酒”呢？（洋葱和红酒更配哦）这时候我们需要一个更复杂的模式——**抽象工厂**了。

![Abstract Factory][3]

抽象工厂是一个产品簇的概念，一个工厂可以生产多种业务相关的产品。我们在**工厂方法**的基础上扩充一下代码：定义一个抽象工厂接口`AbstractFactory`，通过不同的方法生产出一个“抽象”产品簇（`Vegetable`和`Drink`）。“抽象工厂”的“抽象”指的是就是这个意思。回过头来，**工厂方法**事实上是**抽象工厂**最简单的一种场景设计——只生成一种产品。

```typescript
interface AbstractFactory {
  create(): Vegetable;
  pick(): Drink;
}

class OnionRecipe implements AbstractFactory {
  public create(): Vegetable {
    return new Onion();
  }

  public pick(): Drink {
    return new Wine();
  }
}
```

抽象工厂的缺点很明显：成也产品簇败也产品簇，复杂度大，应用场景有限。

## 总结

* 简单工厂：调用者只需使用单例工厂就可获取同一范畴的所有产品

* 工厂方法：调用者并不知道它在运行时会获取何种产品，只知道某个特定的工厂能生成出满足它需求的产品

* 抽象工厂：调用者可以在运行时从特定的工厂中获得所有信息相关的产品簇

设计模式是九十年代初从建筑领域引入到计算机软件开发中的；是对**软件设计**中反复出现的各种问题所提出的一套解决方案。一般来说，设计模式的教学案例都是基于OOP语言java实现的，所以有时候会有一种错觉，以为设计模式只有java开发人员才该掌握的。但事实上设计模式更多的是一种思想，是在某种情景下解决特定问题的可靠途径，它不仅仅局限于组织编码，更可以应用于架构层面的思考。

## 思考题

如果我们的一个服务类中大量出现的类似于`if(useA)`、`if(useB)`这样的代码，你该怎么去重构它？

```typescript

class Service {
  public methodA(): void {
    ...
    if( useA ){
        // omit
    }

    ...
  }

  public methodA(): void {
    ...
    if( useA ){
        // omit
    }
    ...

    if( useB ){
      // omit
    }
    ...
  }
}


```



[1]: ./img/simpleFactory.png
[2]: ./img/factoryMethod.png
[3]: ./img/abstractFactory.png
[4]: https://en.wikipedia.org/wiki/Polymorphism_(computer_science)
[5]: https://en.wikipedia.org/wiki/Encapsulation_(computer_programming)
[6]: https://en.wikipedia.org/wiki/Inheritance_(object-oriented_programming)
