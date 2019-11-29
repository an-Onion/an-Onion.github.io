# 节流（throttle）和防抖动（debounce）技术

[上一期][0]是 JS 高阶函数的入门，这一期再来谈谈高阶函数在前端最常见的两个应用——节流和防抖动

## 节流（throttle）

节流指的都是某个函数在一定时间间隔内只执行**第一次**回调。举个常见的节流案例：我们把某个表单的提交按钮——button 设成每三秒内最多执行一次 click 响应；当你首次点击后，函数会无视之后三秒的所有响应；三秒结束后，button 又恢复正常 click 响应功能，以此类推。

有什么用呢？通常，这类提交 button 的`@click`响应会给后端发送 api 请求，频繁的点击意味着频繁的请求（流量）——会给后端带来很大的压力；此外，这些回调请求返回后，往往会在前端响应其他事件（如刷新页面），可能导致页面不停的加载，影响用户体验。所以我们要给这个 button 添加节流函数，防止一些无意义的点击响应。

### 实现

节流的实现就要用到 js 高阶函数了。基础版 throttle 实现很简单：利用闭包记录前一次执行的时间戳，并判断本次点击和前一次点击的时间间隔，超过设定域值（如 3 秒）才响应函数，反之不响应：

```javascript
const throttle = (cb, wait = 3000) =>{
  let previous = 0;
  return (...args) => {
    const now = +new Date();
    if( now - previous > wait ){
      previous = now;
      cb.apply(this, args);
    }
  }
}
```

这里的`cb`就是被执行的回调函数，`wait`是设定的时间间隔。具体使用的时候，只要给常规监听的回调函数套一层`throttle`方法即可:

```javascript
$button.addEventListener("click", throttle(cabllback));
```

还有一种常见的实现是做个定时器锁，只是会延后执行首次响应事件（如 3 秒后再执行回调）；不过，同样可以确保特定时间间隔内只执行一次响应。

```javascript
const throttle = (cb, wait=3000) => {
  let timeId;
  return (...args) => {
    if( timeId ) return;
    timeId = setTimeout(() => {
      cb.apply(this, args);
      timeId = undefined;
    }, wait)
  }
}
```

## 防抖动（debounce）

所谓的抖动就是浏览器频繁布局时，由于算力不足导致的页面颤动现象。防抖动就是利用类似于节流的手段——无视短时间内重复回调，避免浏览器发生抖动现象的技术。限流和防抖动在设计思想上一脉相承，只是限流是在某段时间内只执行**首次**回调，而防抖动通常是只执行**末次**回调。

比较常见的抖动场景是在 auto index 的搜索设计上；当我们在搜索框内输入不同索引时，页面会频繁计算索引并渲染列表，以致产生抖动。但事实上在这类场景里，有价值的请求只会发生在用户停止输入后，通俗来说就是用户输入过程中的字符串不必当真。

![Search][1]

Debounce 就是用来过滤输入过程中无意义的响应。实现上，只需要设置一个定时器（setTimeout），并在定计时器启动后（如 3 秒后）执行这个**回调**函数；若在定时器启动前又有相同回调到来，便取消之前的定时器（clearTimeout）——之前的回调便取消了；然后再创一个新的定时器回调，如此反复。

```javascript
function debounce(cb, wait = 3000) {
  let timer = null

  return (...args) => {
      if (timer) clearTimeout(timer)

      timer = setTimeout(() => {
        timer = null;
        cb.apply(this, args)
      }, wait)
  }
}
```

此外，我看到很多库在实现 debounce 的时候还喜欢加第三个参数——`immediate`：一个 boolean 参数，表示是否执行首次响应（默认是最后一次）。这算是防抖动和节流结合使用的实现了。我们看看代码：

```javascript
function debounce(cb, wait = 3000, immediate = false) {
  let timeout;

  return function(...args) {
    let callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      timeout = null;

      if (!immediate) cb.apply(this, args);
    }, wait);

    if (callNow) cb.apply(this, args);
  };
}
```

实现上也不难，这里`timeout`表示 debounce 是否已被调用，它与`immediate`共同决定是否立即执行回调函数——`callNow`。若 immediate 被设成了 true 并且没有开启的计时器（!timeout），则能被`callNow`，便会立即执行 cb（不会在 setTimeout 里执行）。其他实现与普通 debounce 相同。

## 小结

本期介绍了前端常用的**节流**和**防抖动**技术，他们是 JS 闭包和高阶函数的现实应用。节流指的是在某个特定时间内只执行首次回调，无视后来的相同请求；防抖动通常是无视末次回调前的所有请求。两种技术都是为了过滤前端无意义的请求，提升用户体验。现实开发中我们一般就直接使用三方库了，但是阅读一下具体实现对我们更好的理解 JS 高阶用法还是有些许帮助的。

## 相关

[《JS 高阶函数》][0]

文章同步发布于[an-Onion 的 Github](https://github.com/an-Onion/my-weekly)。码字不易，欢迎点赞。

[0]: https://www.jianshu.com/p/24f380f003c0
[1]: ./img/search.gif
