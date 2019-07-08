# Typescript策略模式

这次写写**策略模式**（Strategy Pattern），先看定义：
> 策略模式是一种行为设计模式；可以在运行时根据不同的场景为对象的行为选择不同的算法。

有点抽象，举个朴实一点的例子：很多国家都有消费税，当你身处欧洲或是日本时，消费同样价格的商品所缴纳的税费是不一样的（不过你掏钱的动作是一样的）。程序设计时，当用户（context）从欧洲登陆日本后，它会自动更新缴税策略（strategy），并在用户消费（execute）时，自动扣除。

当然这个场景很简单，我写个`switch-case`就可以解决问题了。

```typescript
class Context {

  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  public execute(strategy: string) {
    switch (strategy) {
      case 'Japan':
        console.log(this.value * .1);
        break;
      case 'Europe':
        console.log(this.value * .3);
        break;
    }
  }
}
```

执行时，带上地点参数便可以打印出不过地区的税费了。
```typescript
const context: Context = new Context(100);

// If step into Japan
context.execute('Japan'); //10

// If step into Europe
context.execute('Europe'); //30
```

不过，现实中Strategy极多，这就需要添加很长的case列表，而且case里的实现又千奇百怪，可能会嵌套更多的条件判断。所以，我们不可能维护这样的代码；这时候策略模式就可以登台亮相了。

## 实现

先看看ULM，接着我们直接撸代码。

![UML][2]

### Strategy

先写一个Strategy接口，简单起见只提供一个`tax`方法，用于实现各国的税收政策。

```typescript
interface Strategy {
  tax(value: number): void;
}
```

具体实现就是简单打个log：

```typescript
class JapaneseStrategy implements Strategy {
  public tax(value: number): void {
    console.log('[Japanese tax]', value * .1, '\t//Easy Tax refund!');
  }
}

class EuropeanStrategy implements Strategy {
  public tax(value: number): void {
    console.log('[European tax]', value * .3, '\t//Too high taxation!');
  }
}
```

### Context

下一步创建Context类。`setStrategy`会根据不同的场景调整context的执行策略，例如走到日本便调整为日本本地的税收政策；`execute`就是执行具体执行策略的方法。

```typescript
class Context {
  private strategy: Strategy;
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  public setStrategy(strategy: Strategy) {
    this.strategy =  strategy;
  }

  public execute() {
    this.strategy.tax(this.value);
  }
}
```

### Client

我们先在不同场景下设置不同的策略（`setStrategy`），接着执行（`execute`）当前策略。

```typescript
const context: Context = new Context(100);

// If step into Japan
context.setStrategy(new JapaneseStrategy());
context.execute();

// If step into Europe
context.setStrategy(new EuropeanStrategy());
context.execute();
```

执行结果如下。经过策略调整，我们得到了不同的执行结果。这样最初的`swith-case`就被全部重构了。

```
[Japanese tax] 10       //Easy Tax refund!
[European tax] 30       //Too high taxation!
```

## 小结

策略模式很简单，基本就说到这里了。说白了就是把条件判断里的方法搬运到了各个策略的子类中。好处自然很明显：

1. 减少多重条件判断
2. 类之间可以通过继承、委任实现更高的代码复用
3. 只需要添加新的子类就可以实现策略扩展性

但是假如暴露的策略过多，又得需要[工厂模式][1]来生产，一不小心又会回到switch-case的老路里去。

## 题外话

我们写TS，基本都会用到OOP来改进代码质量。但是一些**老派**的JS开发可能并不是很屑于OOP的套路。我们不妨再从函数式编程的角度再来看看如何实现策略模式。

首先以函数的形式列出各地的税收政策，这里我们限定死this的类型，指明这些方法的作用对象；提一下，TS中`this`是一种假参数，并不会影响函数真正参数数量与位置。
接着再统一暴露出所有的策略集合；以object形式`export`所有方法，可以看做是等效于工厂模式的实现形式。

```typescript
interface Context {
  value: number;
}

function JapaneseStrategy(this: Context) {
  console.log('[Japanese tax]', this.value * .1, '\t//Easy Tax refund!');
}

function EuropeanStrategy(this: Context) {
  console.log('[European tax]', this.value * .3, '\t//Too high taxation!');
}

export const tax: {[s: string]: () => void} = {
  Japan: JapaneseStrategy,
  Europe: EuropeanStrategy,
};
```

执行时，相较于OOP的对象调用方法，FP则是方法call对象。
这里，TS可以自动推导出`tax`集合里的策略（`tax.Japan`）,也可以通过key索引（`tax[strategy]`）动态调用，是不是用FP实现也挺优雅的？
这里点到为止，有兴趣的小伙伴可以更深入的学习一下FP的知识。

```typescript
const context: Context = {value: 100};

// If step into Japan
tax.Japan.call(context);

// If step into Europe
let strategy: string = 'Europe';
tax[strategy].call(context);
```


[1]: https://www.jianshu.com/p/bc42541b7851
[2]: ./img/stragety.png
