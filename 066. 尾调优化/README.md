# ES6 尾调优化

## 概述

### 尾调

在说尾调优化（Tail Call Optimization，下文简称 TCO）前，先解释什么是尾调——Tail Call。

> 通俗来说，尾调就是一个出现在另一个函数“结尾”处的函数调用。

举个简单的例子，如下所示：`foo` 的调用出现在 `bar` 的结尾处；`foo` 返回后，就没`bar`啥事了（除了可能要继续返回结果外）。我们就把`foo(x)` 叫做 `bar` 函数的尾调。

```javascript
function foo(x) {
  return x;
}

function bar(y) {
  const x = y + 1;
  return foo(x); // Tail call
}
```

再举个反例，下面的 `baz` 就没有尾调：因为 `foo(z)` 完成后，还需要加 `1` 才能由 `baz` 返回；同理 `foo(z) + 1` 这种也不属于尾调。

```javascript
function baz(z) {
  return 1 + foo(z); // Not tail call
}
```

### 调用栈 & 栈帧

本文概念比较杂，开始这节知识前，也得插播一点程序设计的小知识。学习过 JVM、V8，或是 C 内核知识的小伙伴，对调用栈（call stack）、堆（heap）、栈帧（stack frame）这些概念应该不会太陌生，简单来说：

- **调用栈**是所有方法执行的内存模型（先进后出的连续内存空间）
- 每个方法被调用时，会在调用栈中创建一个**栈帧**；栈帧包括方法的局部变量、出口地址、操作数等等信息
- 而方法中使用到的对象被存放在**堆**内（JS 世界里，function 也是对象）

我们还是以 `foo` 和 `bar` 为例，看看程序运行时的调用情况。

![Normal call][1]

1. 第一步自然是全局的初始化，将全局变量（`foo`和`bar`）打包成一个栈帧放入调用栈中
2. 程序扫描到`(A)`处时，`bar(1)`被调用；程序进入`bar`函数体内，返回地址（address A）、参数、局部变量等等组成新的栈帧，并放入调用栈头部
3. 程序继续扫描到`(B)`处，`foo(x)`被调用；程序进入`foo`函数体内，返回地址（address B）、参数又成为新的栈帧放入调用栈头部

之后的故事就是程序执行到`(C)`处，返回结果；调用栈弹出栈帧，并根据栈帧内的返回地址一路回到`(A)`处；最后程序结束。

### 尾调优化（TCO）

通常来说，调用栈的空间会有限制，也即栈帧的数量是有限的——几千到几万不等；一旦超过这个限度，就会抛一个经典的错误——Stack overflow。向上面那样简单的代码片段自然很难导致栈空间溢出啦，但是如果使用递归，几万个栈帧就不算个事了。

递归后文再讲，我们再回到 `foo` 和 `bar` 的调用上。大家有没有发现，上图中 `foo` 函数的栈帧（绿色区域）并不是必须的，完全可以复用 `bar` 函数的栈帧（蓝色区域）：因为 `bar` 的计算逻辑已经结束了呀，留着也只是为了弹栈而已。

所谓的 TCO 就是做了这么个优化：当侦测到当前函数是尾调用时，就复用之前的栈帧。如下图所示，通过 TCO 优化，我们就节省了一个栈帧的空间。如果尾调的数量有成千上万个的话，TCO 就可以很好的避免 Stack Overflow 了。

![TCO][2]

## 尾递归函数

书接上文，TCO 主要是用来防止 Stack Overflow 的，但是简单的代码片段几乎没有栈空间溢出的可能，只有递归函数才有消耗几万个栈帧的可能。那 TCO 又是怎么优化递归函数的呢？

答案是只能靠开发人员主动地改变递归写法，写成**尾递归**的形式。那何为尾递归呢？就是使用了**尾调**的递归函数！我们看个简单的 `sum` 函数：

```javascript
function sum(n) {
  if (n <= 1) return n;
  return n + sum(n - 1);
}
```

上面这个 sum 函数是用来求 `1 ~ n` 的正整数和的，很经典的递归函数；但是根据上文的定义，它显然不是**尾调**函数—— `sum(n-1)` 调用结束后并未直接返回；而且当 n 的值大于十万时，必然 Stack Overflow！大家可以试试，在 JS 环境里会抛出 `Maximum call stack size exceeded` 的异常。所以我们要改一下写法——改成尾调的形式：

```javascript
function sum(n, pre = 0) {
  if (n <= 1) return n + pre;
  return sum(n - 1, n + prev);
}
```

稍微解释一下，这个尾调 `sum` 会把上一步的计算结果当做参数传给下一次调用，这样形式上就成了**尾调**函数了。这种尾调形式的递归函数，就是所谓的**尾递归函数**了。大家可以试试上面这个例子，在严格模式下（注意必须在严格模式下）的 nodejs 或是主流的浏览器里跑尾递归 `sum`，是不会抛异常的。

## Continuation-passing style

那这里又有一个问题了，TCO 需要开发人员主动地将普通递归函数改写成尾递归函数，上面的 `sum` 自然比较容易改啦，但是复杂的递归函数也能改吗？

是的，所有的递归函数都能改写成尾递归形式！具体数学证明在[StackOverflow][3]上有过回答，不过比较复杂，我这里也不照搬公式了。在实际的开发中，主要的指导思想是改写成 CPS（Continuation-passing style，续文传递风格）的代码风格。那什么又是 CPS 呢？答案又会是一大堆数学公式，我还是用一个简单的例子说明一下吧。

我们计算二叉树节点数，通常会使用深度优先（DFS）算法，先递归计算左右子树的节点数，再返回整棵树的节点：

```javascript
function Count(root) {
  return DFS(root);

  function DFS(node) {
    if (!node) return 0;
    const left = DFS(node.left);
    const right = DFS(node.right);
    return left + right + 1;
  }
}
```

上面这个 DFS 方法显然也不是尾递归函数，而且改写尾递归还是挺难的：

1. 计算完 `DFS(node.left)` 之后还要回头执行 `DFS(node.right)`
2. `DFS(node.right)` 执行后，再回到 `DFS(node)` 里计算前面两个递归函数计算的结果

这个 DFS 不能像上面的 `sum` 一样，能简单地把上一步的结果存起来，因为有两个递归函数要执行。那我们换一种形式，只存一个左子树的结果，让右子树延后执行！

```javascript
function Count(root) {
  return DFS(root, (ret) => ret);

  function DFS(node, next) {
    if (!node) return next(0);

    return DFS(node.left, (left) => {
      return DFS(node.right, (right) => {
        return next(left + right + 1);
      });
    });
  }
}
```

还是有点难度的吧？两个 case 解释一下：

- 空树

  空树的话就是直接返回 `next(0)` 了， 这个 `next = (ret) => ret`，所以 `DFS(null)` 的结果就是 0

- 单节点树

  ```bash
       0
      / \
  null   null
  ```

  1. 第一个尾调简化下来就是 return `DFS(node.left, nextOfLeft);`

  2. 由于 `node.left` 是空的，就直接跑 `nextOfLeft(0)`，也即是 return `DFS(node.right, nextOfRight)`；注意 `nextOfRight = (right) => next(0+right+1)`，从闭包中可以获得 `left = 0`

  3. `node.right` 也是空的，接着跑 `nextOfRight(0)`，也就是 return `next(0+0+1)`

  4. 最后一个 `next = (ret) => ret`，也即返回 `1`

看懂了没有？就是把右子树的 DFS 操作写成一个函数，当作参数传给左子树的 DFS；然后左子树一路**左**下去直到碰到空，再执行某右节点的递归操作。

归纳起来，CSP 风格就是函数多一个 callback 的回调函数；不同的 callback 达到的目的不同，但是最后的出口一定是第一个传入的回调函数：

```javascript
const fn = function (x, callback) {
  //...
  callback(x);
};
```

## 小结

本文介绍了尾调优化（TCO），以及根据尾调优化理论延伸出来的尾递归函数和续文传递风（CSP）。ES6 之后，主流的 JS 引擎都引入了 TCO 技术，主要的一个原因是缺乏 TCO 会导致一些 Javascript 算法因为害怕调用栈限制而降低了通过递归实现的概率。但是，运用 TCO 技术，需要将递归函数改写成 CSP 风，这个需要一定的训练，所以这个知识点一直比较小众。本文最后部分稍微提了一下尾递归函数的写法，我试着在 LeetCode 上也提交了几个答案，确实可行；只不过很难用文字表达，这里也说明一下，解释不清的地方还请大家谅解。

[1]: ./img/normal.drawio.png
[2]: ./img/tco.drawio.png
[3]: https://stackoverflow.com/questions/1888702/are-there-problems-that-cannot-be-written-using-tail-recursion
