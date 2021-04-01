# JS 构造函数

## 历史知识

大家一般会怎么初始化一个 JS 对象呢？我通常会使用字面量的语法：

```javascript
var origin = { x: 0, y: 1 };
```

但是对象字面量是在 javascript 1.2 才出现的。再早之前怎么写呢？语法还保留着，只是大家很少用：

- javascript 1.0

  在 javascript 1.0 的时代我们只能使用 `new` + **构造函数**的形式才能初始化对象。`Object` 就是 JS 内置的第一个构造函数，Array 是第二个；但是不知出于何种原因（Brendan Eich 十天设计的语言也没啥深刻的原因啦），在首版的 JS 中，`new` 一个内置的构造函数竟然**不能**以`()`结束。

  ```javascript
  var origin = new Object();
  origin.x = 0;
  origin.y = 1;
  ```

- javascript 1.1

  次年 1.1 发布，设计者终于考虑到构造函数也是函数，开始支持 `()` 结尾的语法了。不过，`new Object` 这种语法还是一路保留到了现在，表示无参数的情况。

  ```javascript
  var origin = new Object();
  origin.x = 0;
  origin.y = 1;
  ```

说完历史，我们再回归主题。那什么是构造函数呢，和普通“函数”有什么区别呢？

## 函数对象

受 Lisp 函数一等公民的影响，Brendan Eich 在 JS 的第一版设计中就将函数视为一个对象；与此同时出现的就是 `function` 这个关键词，用于申明函数对象：

```javascript
function sum(a, b) {
  return a + b;
}
```

使用 function 创建函数对象，看起来是这样的：

1. `function` 关键字出现在前
2. 随后是函数名（sum），通常会约定小写字母开头
3. 再之后是小括号和包在里面的参数列表
4. 最后是大括号和里面的函数体
5. 函数体里通常会有一个 `return` 关键字，紧接其后的是函数调用的返回值；如果没有返回值，会返回默认值 `undefined`

函数对象的声明，大家再熟悉不过了；只是 Eich 同志在创建函数对象的同时，还创造了一个叫“构造函数（Constructor function）”的东西，因为它名字里也带 function，所以构造函数也需要用 function 来申明了，但是这对后来的开发人员造成了很大的认知负担。

## 构造函数

上文提到 `Object`是 Javascript 第一个内置的**构造函数**，而构造函数是用来创建一些功能类似的对象的。我们看一下构造函数与函数对象的不同：

1. **构造函数**通常约定首字母大写；**函数对象**约定首字母小写
2. **构造函数**调用的时候需要在前面加个 `new` 操作符；**函数对象**不需要

只要依据上面规则，我们除了使用内置的构造函数，还可以自定义构造函数；

```javascript
function User(name) {
  this.name = name;
}
User("Onion"); // undefined
var user = new User("Onion"); // {name: 'Onion'}
```

我看完**构造函数**的声明，第一感觉就是“不靠谱”:

- 第一条是君子协定，依靠的是开发人员的书写规范，这什么鬼？而且构造函数还是能像函数对象一样使用呀，这根本不算区别呀！！

- 第二条，两种函数调用方式都不一样，为啥要归类到一块？完全可以学习 java，用一个类似于 class 的关键字来声明构造函数嘛!

  ```javascript
  class User {
    public constructor(name){
      this.name = name;
    }
  }

  const user = new User('Onion'); // { name: 'Onion' }
  ```

上面仅仅是个人吐槽，还是那句话“十天完成的语言，要求不能太高了”。那时候 Java 还没发布，主流语言并没有大规模使用 class 关键字，而且实现完整的类功能，将花费很长时间；Eich 同志还深受函数式编程影响，满脑子都是 function 一等公民，也没考虑类设计。平心而论，当时做成这样也算能接受了；只是这个 class，竟然几十年后才最终加到了 Javascript，这就是后话了。

## this

言归正传，当一个函数被执行 new 操作时，通常会发生以下三步：

1. 一个新的对象被创建，并赋值给 this
2. 执行函数体内的操作——通常会修改 this 的相关属性
3. return this

通俗来说，就是执行了类似如下这样的事：

```javascript
function User(name) {
  // this = {}; --隐式创建
  this.name = name;
  // return this; --隐式返回
}
```

## 返回值

不过上面只是最简单的 case，因为这个 User 的构造函数并没有 return 语句。有了 return 语句又得另外判断了：

- 如果 return 的是一个对象，则返回该对象，而不是 this

  ```javascript
  function User(name) {
    this.name = name;
    return { id: 1 };
  }

  new User("Onion"); // {id: 1}
  ```

- 如果返回的是原始类型，则依旧返回 this

  ```javascript
  function User(name) {
    this.name = name;
    return "user";
  }

  new User("Onion"); // {name: 'Onion'}
  ```

## new.target

返回构造函数+return 是个很别扭的 case，历来风评很差；究其缘由，还是因为构造函数和函数对象傻傻不分的设计。
后来为了区分是调用了构造函数，还是调用函数对象；JS 又给 `new` 加了个属性 `target`。很有趣吧？操作符也能加属性！

- 若是直接调用函数，`new.target` 为 `undefined`
- 若是 new 操作，`new.target` 返回一个新对象 `[Function: FunctionName]`

```javascript
function Target(name) {
  console.log(new.target);
}

Target(); // undefined

new Target(); // [Function: Target]
```

有时候我们会在内部判断一下 new 操作，让你用或是不用 new 操作都返回相同的结果。

```javascript
function User(name) {
  if (!new.target) {
    return new User(name);
  }
  this.name = name;
}

User("Onion"); // {name: 'Onion'}
new User("Onion"); // {name: 'Onion'}
```

上面提到过的 JS 的第二个内置函数 `Array`， 它就是这么实现的：

```javascript
Array(3); // [empty, empty, empty]
new Array(3); // [empty, empty, empty]
```

言归正传，虽然有这种“奇技淫巧”啦，但是大家自己写构造函数最好还是不要有 `return`——无须必要勿增实体。

## 构造函数里的方法

上面反复提到过，在 JS 中 function 也是对象，我们在构造函数中可以给 this 赋值原始类型，也可以赋值普通对象，还可以赋值函数，这是 Javascript 1.0 就有的语法：

```javascript
function User(name) {
  this.name = name;
  this.sayHi = function () {
    console.log(`My name is ${this.name}`);
  };
}

const user = new User("Onion");
user.sayHi(); // My name is Onion
```

Javascript 1.1 后，JS 又有了内置的 `prototype` 属性——原型。原型是一种特殊的对象，其自身属性与所有**由构造函数创建的对象**所共享。通俗来说就是：访问对象属性时，如果这个属性的名称在**与对象构造函数相关联的原型**上已被定义，那么将返回原型对象的属性值。

```javascript
function User(name) {
  this.name = name;
  this.sayHi = function() { ... };
}

// javascript 1.1 feature
User.prototype.sayHiAgain = function() {
    console.log(`My name is ${this.name}`);
};


const onion = new User('Onion');
onion.sayHiAgain(); // My name is Onion
```

再对比一下**构造函数内定义的函数**与**原型链上的函数**：

1. 前者为每次 new 操作新建一个 function 对象，而后者指向同一个 function 对象
2. 假如前者与后者重名，前者会遮盖后者的定义

```javascript
const onion = new User("Onion");
const garlic = new User("Garlic");

console.log(onion.sayHi === garlic.sayHi); // false
console.log(onion.sayHiAgain === garlic.sayHiAgain); // true
```

## 小结

我们可以通过 new + 构造函数的形式创建一个对象，这是从 Javascript 1.0 就拥有的语法。但这也是一个风评很差的语法：构造函数是一个函数对象（除了口头约定的大写开头外）却有着奇怪的 return 方式。许多新手程序员需要很长一段时间才能适应这种诡异的构造方式；直到 20 多年后的 class 的出现，才基本解决了这种不适。20 年，这是多少代 JS 开发的痛苦历程呀！

有时候在想，为什么像 JS 这种饱受批评的语言能取得如此重大的成功？也许正如大家说的那样，技术并不是关键点，风口才是！
