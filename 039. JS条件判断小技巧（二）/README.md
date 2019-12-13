# JS 条件判断小技巧（二）

我前面讲过[一期][0]关于条件判断小技巧的文章，今天接着聊。所谓小技巧，说实在就是特定场景里的特例手段；对于具备一定开发能力的码农，这些特例基本都能避开。但是，某些业务逻辑本身就十分复杂，嵌套的条件语句在逻辑层面就不可能有所优化了；碰到这类场景，我们又该如何作为呢？

```javascript
function greeting(role, access) {
  if( 'owner' ===  role ){
    if( 'public' === access ){
        ...
    }
    if( 'inside' === access ){
        ...
    }
    ...
  } else if ( 'admin' ===  role ){
    if( 'public' === access ){
        ...
    }
    if( 'inside' === access ){
        ...
    }
    ...
  } else if( 'hr' === role ) {
    ...
  }
}
```

看一下代码，第一层的`if-else`判定的是各种角色（role）类别，第二层判定的是角色访问权限设置（access）。这类代码其实并没有特别优雅的处理手段，只能回到《clean code》里最本源的解决手段——把函数写小。本质问题还是函数体过大，而所谓的**把大函数拆成多个小函数**，事实上就是**以抽象换取可读性**。

## OOP 多态

最常规的手段就是 OOP 多态了。上述代码块，最外层 role 判定的就是各种角色类型，我们可以把这一层抽象为 User 实例，嵌套层内的 access 判定进一步抽象为用户方法。

```javascript
class User {
  public() {
    throw new Error('Denied!')
  }

  private() {
    throw new Error('Denied!')
  }
}
```

Javascript 并没有 interface 这类语法，好在有 class 了，我仿造 interface 写了一个基类如上。接着就是将各种角色抽象为新的子类型：


```javascript
class Owner extends User {
  public() {
    console.log('Owner in public');
  }
  private() {
    console.log('Owner inside');
  }
}

class Admin extends User {
  public() {
    console.log('Admin in public');
  }
  private() {
    console.log('Admin inside');
  }
}
```

OOP 里推荐使用工厂方法初始化实例，我顺便也写个工厂：

```javascript
class UserFactory {
  static create(role) {
    if( 'owner' === role )
      return new Owner();
    else if( 'admin' === role )
      return new Admin();
    ...
  }
}
```

调用的时候我们先通过 role 创建抽象实例，再根据 access 调用具体方法：

```javascript
function greeting(role, access) {
  const user = UserFactory.create(role);
  user[access]();
}
```

上面一长串的`if-else`，一下子被压缩到了两行。这就实现了以**抽象**（很多的可描述的类）换取了**可读性**（较少的判断嵌套）

## 调用链

OOP 效果确实很明显，不过上述代码还是过于特例，假如`access`并不是字符串——如`1，2，3`，像`user[1]`这种就很难映射到一个具体方法了；所以我们还需要写更细碎的 access 抽象，也便意味着更多的抽象子类，以及新的工厂方法。不过，很多时候我们也不需要抽象得尽善尽美。这里的话写个调用链，也是勉强可用了：

```javascript
const rules = [
  {
    match(role, access) {
      return 'owner' === role;
    },
    action(role, access) {
      if( 1 === access )
        console.log('Owner in public');
      else if( 2 === access )
        console.log('Owner in private');
    }
  },
  {
    match(role, access) {
      return 'admin' === role;
    },
    action(role, access) {
      ...
    }
  }
  ...
];
```

上面 rules 数组里，每一个元素（rule）里的`match`被设计用来判定用户权限：遍历数组，若是`match`为 true，则运行正下方的`action`——access 相关业务；反之，继续`match`下一个 rule：

```javascript
function greeting(role, access){
  rules.find(e => e.match(role)).action(role, access)
}
```

最后 greeting 被重构为上述代码。当然，效果没有多态好，只消掉了一层`if-else`，第二层判定还是留在了 action 里，不过这个场景里也够用了。

## AOP

没看错，Javascript 也是有 AOP 的，只是它的实现要修改 Function 的原型链，不是很推荐；但是`Function.prototype.after`，`Function.prototype.after`还是挺常见的，开发组里能协商好，还是可以尝试一下的：

```javascript
Function.prototype.after = function(next) {
  let fn = this;

  return function $after(...args) {
    let code = fn.apply(this, args)

    next.apply(this, args);

    return code;
  }
}
```

传统的 aop after 如上所示。不难看出，用到了高阶函数：具体执行时，先运行函数本体，再运行 after 传进来的 next 方法。为了让 after 应用到我们的话题中，我稍微改一下函数实现：

```javascript
const nextSmb = Symbol('next');

Function.prototype.after = function(next) {
  let fn = this;

  return function $after(...args) {
    let code = fn.apply(this, args)

    if( nextSmb === code )
      return cnext.apply(this, args);

    return code;
  }
}
```

这个 after 实现变成了先运行函数本体，若返回是`nextSmb`则继续执行后续的 next 方法，反之则停止。有什么用呢？我们看看如何使用：

```javascript
function owner (role, access) {

  function public(access) {
    return 1 === access ? console.log('owner in public') : nextSmb;
  }

  function private(access) {
    return 2 === access ? console.log('owner in private') : nextSmb;
  }
  const ownerChain = public.after(private);

  return 'owner' === role ? ownerChain(access) : nextSmb;
}
```

代码还是有点难度的，先看一部分——owner 的定义。这个函数被设计处理`role === 'owner'`时的逻辑，内部的`public`和`private`方法是处理`access`为 1 和 2 时的逻辑。我们把`public`和`private`方法串联成`ownerChain`（终于用到的`after`方法了），它的作用就是把之前的`if-else`逻辑抽象成一个上节讲到的函数调用链，在遍历调用链时检查 access 条件：若符合条件，则执行本节点代码，并结束调用链；反之，继续往调用链的后续节点传送。

我把重构后的 greeting 也列一下：单个`role`的`access`可以用`after`串联；不同`role`之间也可以进一步利用`after`串起来。

```javascript
function admin (role, access) {
  // familiar with owner
}

let greeting = owner.after(admin)
greeting('owner', 1);
```

嗯，这样，我们最原始的`greeting`方法就被彻底重构了。可以预见，如果调用链很长`greeting`会是这样：

```javascript
let greeting = owner.after(admin).after(hr).after(staff)...
```

当然这个方法缺点也很明确，比起之前冗长的代码，可读性增强了，但是理解成本有点高，若团队内没有事先约定，这个维护成本还是挺高的。

## ramda

[ramda][1]是我很喜欢用的一个方法库，在 github 上有大约 18K 的 star，它提供了一整套 FP 方法。比起上面**调用链**和**aop**这种野路子，ramda 库更适合在团队内推广。我们试着用 ramda 重写一下上面提到的`greeting`方法：

```javascript
const R = require('ramda')

const ownerChain = R.cond([
  [(role, access) => 1 === access, () => console.log('owner in public')],
  [(role, access) => 2 === access, () => console.log('owner in private')],
])

const adminChain = R.cond([ ... ])

const greeting = R.cond([
  [R.equals('owner'), ownerChain],
  [R.equals('admin'), ownerChain],
])
```

我想大家即便没用过 ramda，也能大体猜出代码用法吧。`R.cond`类似于上面用到的调用链实现：二维数组第一列的函数就是 match，做判定；第二列就是 action 方法，用于执行嵌套逻辑。若嵌套较深，可以像`ownerChain`和`adminChain`一样再实现一套`R.cond`调用链。

我们再将 FP 的 ramda 实现与上面 OOP 多态做个比较：OOP 将逻辑抽象为对象，FP 则是抽象为更小的函数。通常来说 FP 的代码更加精简，但是学习成本更高：如果没有专项训练，你根本看不懂 FP 代码，更别说码代码了。我自己部门里也有写半吊子 FP 的团队，最后写出来的代码长得像**迎客松**一样，并没有比多层嵌套的条件语句美观多少。

## 小结

本文在之前`if-else`小技巧的基础上，介绍了一些更通用场景里的优化方式。（当然，有些方式**哗众取宠**了😅）虽然大篇幅介绍了一些野路子，但最终还是推荐大家学习正统的 OOP、FP 的解决方案。学生时代，我们很少接触代码，还没事还喷喷书本知识；工作后，见识多了，才发现前人的经验弥足珍贵。


## 相关

[《JS 条件判断小技巧（一）》][0]


[0]: https://www.jianshu.com/p/a196f976cdd0
[1]: https://github.com/ramda/ramda
