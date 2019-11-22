# JS 高阶函数

最近在学习函数式编程，整个 team 都在吭一本叫[《Mostly adequate guide》][0]的编程教材，难度确实挺大的，不过新意满满。今天就讲讲 FP 基础中的基础——高阶函数。

## Function Object

什么是函数？在大多数编程语言中，函数是一段独立的代码块，用来抽象处理某些通用功能的方法；主要操作是给函数传入特定对象（参数），并在方法调用结束后获得一个新的对象（返回值）。

```Javascript
function greeting(name) {
  return `Hello ${name}`;
}

console.log( greeting('Onion') ); // Hello Onion
```

但是在 Javascript、Haskell、Clojure 这类语言中，函数是另一种更高级的存在，俗称一等公民；它除了是代码块以外，它还是一种特殊类型的对象——Function Object。

为什么说 Fuction 也是对象呢？还是看上面的示例函数——`greeting`，我们事实上是可以打印出它的固有属性（properties）的：

```Javascript
console.log(greeting.length, greeting.name);  // 1 'greeting'
```

这里`length`是参数列表长度，`name`就是它定义的名字了。是不是和对象很接近了？我们甚至可以给它添加新的属性和方法：

```Javascript
greeting.displayName = 'Garlic';
greeting.innerName = () => 'Ginger';

console.log(greeting.displayName); // Garlic
console.log(greeting.innerName()); // Ginger
```

是吧？这么看，函数已经包含了几乎所有的 Object 功能了。当然，生产中尽量不要给函数添加随机属性，毕竟代码是给人阅读的，不要随便增加团队的认知成本。

## high order function

上面提到了函数是一种特殊的对象，因此在 js 语言中，函数事实上也可以像普通 object 一样成为其他函数里的参数或是返回值。我们将参数或是范围值为函数的函数称为**高阶函数**。

> Higher-Order function is a function that receives a function as an argument or returns the function as output

### Function 参数

我们先看一下函数如何成为参数，最经典的案例就是 Array#map。给了例子，实现一个让数组所有元素+1 的操作，传统的做法如下所示：

```javascript
const arr1 = [1, 2, 3];
const arr2 = [];

for(let i = 0; i < arr1.length; i++) {
  arr2.push(++arr1[i]);
}
console.log(arr2)
```

如果使用高阶函数 map：

```javascript
const arr1 = [1, 2, 3];

const arr3 = arr1.map( function callback(element, index, array) {
  return element+1;
});

console.log(arr3); // [2, 3, 4]
```

map 是 Array.prototype 的原生方法，它的第一个参数是一个 callback 函数，第二个参数是用来绑定 callback 的 this。这里，callback 的作用是迭代调用数组里的元素，并将返回值组装成一个新的数组。这个 map 的**函数参数**本身还有三个参数：element，index 和 array，分别表示迭代时的元素，索引，以及原始数组。

上面的代码使用 es6 的箭头函数，可以写得更简洁一点：

```javascript
const arr1 = [1, 2, 3];

const arr3 = arr1.map(e => e+1);

console.log(arr3); // [2, 3, 4]
```

讲真，我们经常用到高阶函数，Array 里还有好多类似的函数，如 fliter、reduce 等等。这类高阶函数可以明显的改善代码质量，并切能确保不会对原始数组产生副作用。

### Fucntion 返回值

返回值是函数的函数，我们也经常使用，最著名的就是 Function#bind。

给个案例，如下函数 greeting 会打印出`this`的`name`，但是 greeting 并不是一个纯函数，因为它的 this 绑定不明确，可能会在不同的运行上下文中会返回不同的结果。

```javascript
function greeting() {
  return `Hello ${this.name}`;
}
```

如果想明确它的结果该怎么办呢？嗯，为 greeting 绑定一个 object。这个 helloOnion 就是`greeting.bind`后返回的新函数。

```javascript
let helloOnoin = greeting.bind({name: 'Onion'});

console.log(helloOnoin()); // Hello Onion
```

`bind`方法创建一个新的函数，在`bind`被调用时，这个新函数的`this`被`bind`的第一个参数指定，其余的参数将作为新函数的参数供调用时使用。我们可以试着写一个乞丐版的 myBind 方法（bind 还能绑定参数，这个先略过了），这样可以更清晰地看到什么是返回函数的高阶函数了。

```javascript
Function.prototype.myBind = function(context) {
  let func = this; // method is attached to the prototype, so just refer to it as this.
  return function newFn() {
    return func.apply(context, arguments);
  }
}
```

这里给 Function 的原型链加了一个新的函数 myBind，并用到了闭包（在内存里保留了原始函数和目标`this`）；之后，调用 myBind 返回一个新的函数，并且在该函数运行时调用原始函数，左后通过`apply`执行时绑定目标 this。看一下效果：

```javascript
let helloOnoin = greeting.myBind({name: 'Onion'});

console.log(helloOnoin()); // Hello Onoin
```

我这里再写一个健壮一点的 bind 实现，大家自己体会一下，bind 是如何将前几个参数也绑定了的：

```javascript
Function.prototype.bind = function(context, ...args) {
  let func = this;
  return function () {
    return func.call(context, ...args, ...arguments);
  }
}
```

## 函数柯里化

高阶函数还在一种叫**柯里化**的方法里大显身手。

> 在数学和计算机科学中，柯里化是一种将使用多个参数的函数转换成一系列使用一个参数的函数，并且返回接受余下的参数而且返回结果的新函数的技术。

**柯里化**，通俗点说就是先给原始函数传入几个参数，它会生成一个新的函数，然后让新的函数去处理接下来的参数。我们先不去管 curry 的实现，看看柯里函数的用法。比如，实现一个 add 函数——简单的两数相加，正常的运行就是直接加两参数运行——add(1,2)。但是这里我们先给它做个柯里化处理，并产生了一个新的函数——curryingAdd。

```javascript
function curry(fn) { ... }

function add(a, b) { return a+b; }

const curryingAdd = curry(add);
```

柯里化后的 curryingAdd，从普通函数变成了高阶函数：它支持一次传入一个参数（比如 10）并返回一个新的函数——addTen。我们运行`addTen(1)`，它会记录之前已经传入的 10，并把 10 和 1 相加得到 11。是不是觉得很**没用**？哈哈，这说明你 FP 学的不够深。

```javascript
const addTen = curryAdd(10);

console.log(addTen(1)); // 11
console.log(addTen(100)); // 110

```

柯里化的作用就是将普通函数转变成高阶函数，实现动态创建函数、延迟计算、参数复用等等作用。篇幅有限，我不做深入讲解了。它实现上，就是返回一个高阶函数，通过闭包把传入的参数保存起来。当传入的参数数量不足时，递归调用 bind 方法；数量足够时则立即执行函数。学习一下 javascript 的高阶用法还是有意义的。

```javascript
function curry(fn) {
  const arity = fn.length;

  return function $curry(...args) {
    if( args.length < arity ) {
      return $curry.bind(null, ...args);
    }
    return fn.apply(null, args);
  }
}
```

## compose

compose 也是一个高阶函数里重要的一课。compose 就是组合函数，将子函数串联起来执行，一个函数的输出结果是另一个函数的输入参数，一旦第一个函数开始执行，会像多米诺骨牌一样推导执行后续函数。还是举个例子：我实现了一个带 Hello 的`greeting`函数，并希望在`greeting`调用结束后把返回值都显示成大写状态。

```javascript
const greeting = name => `Hello ${name}`;
const toUpper = str => str.toUpperCase();

toUpper(greeting('Onion')); // HELLO ONION
```

传统的手段就是嵌套两个函数使用——`toUpper(greeting('Onion'))`，但是有时候这种嵌套可能会很多，比如下面这个态势：

```javascript
f(g(h(i(j(k('Onion'))))))
```

再看看 compose 的用法：

```javascript
const composedFn = compose(f, g, h, i, j, k)
console.log( composedFn('Onion') )
```

是不是这一个 composedFn 函数比那种一层层的嵌套要美观的多？OK，怎么实现 compose 函数呢？把源码贴在这里了。如果你觉得写`(...fns) => (...args) => ..`这类代码不可思议的话，建议吭一下上面提到的教程[《Mostly adequate guide》][0]，吭完你就发现再正常不过了。

```javascript
// compose: ( (a->b), (b->c), ..., (y->z) ) -> a -> z
const compose = (...fns) => (...args) => fns.reduceRight((res, fn) => [fn.apply(null, res)], args)[0];
```

## 小结

这一期快速科普了 JS 高阶函数，现实开发中很多人都觉得没啥用，但是面试官很喜欢问这类问题。倒不是说面试官懂很多，大概率他也只是看题库问问题罢了。我是觉得学习这类方法的意义还是在于思维训练——为 FP 编程打好基础。OK，努力成为一个更优秀的开发人员吧。



[0]: https://github.com/MostlyAdequate/mostly-adequate-guide
