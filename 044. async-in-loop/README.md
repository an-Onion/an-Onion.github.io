# for loop 里的异步操作

之前有片 blog 讲过 js 的异步发展史：从 `callback` 到 `promise` 再到 `async/await`。`async/await` 之后的 JS 开始允许我们以一种看似顺序执行的方式书写代码，这确实让入门 JS 变得更简单，但在一些复杂的场景里比如 for-loop 环境里，`async/await` 还是会有不少坑的。

## Warm up

开始前，先写个“菜篮子工程”，`getVegetableNum`是本文中最基础的一个异步函数——异步获取蔬菜数量：

```javascript
const Basket = {
  onion: 1,
  ginger: 2,
  garlic: 3,
}

const getVegetableNum = async (veg) => Basket[veg];
```

***知识点***：`async`就是一个语法糖，表示把结果包在 Promise 里返回；该异步函数等价于

```javascript
function getVegetableNum (veg) {
  return Promise.resolve( Basket[veg] );
}
```

OK，我们再试着异步获取三种蔬菜的数量：

```javascript
const start1 = async () => {
  console.log('Start');
  const onion = await getVegetableNum('onion');
  console.log('onion', onion);

  const ginger = await getVegetableNum('ginger');
  console.log('ginger', ginger);

  const garlic = await getVegetableNum('garlic');
  console.log('garlic', garlic);

  console.log('End');
}
```

最后打印结果如下：

```bash
Start
onion 1
ginger 2
garlic 3
End
```

## await in a for loop

OK，例子到此为止。现实中开发中，上述代码中枚举每一种蔬菜的方式太过冗余，一般会我们更倾向于写个循环来调用`getVegetableNum`方法：

```javascript
const start = async () => {
  console.log('Start');
  const arr = ['onion', 'ginger', 'garlic'];

  for(let i = 0; i < arr.length; ++i>){
    const veg = arr[i];
    const num = await getVegetableNum(veg);
    console.log(veg, num);
  }

  console.log('End');
}
```

结果依旧，这说明在普通的 for 循环里，程序会等待上一步 await 迭代执行完后再继续下一步迭代。这个和我们的预期一致，for 循环里的 async/await 是顺序执行的；同理也适用于 while、for-in、for-of 等等形式中。

```bash
Start
onion 1
ginger 2
garlic 3
End
```

## await in callback loop

不过，for 循环还有可以写成其他形式，如 forEach、map、reduce 等等，这些需要 callback（回调方法）的循环，似乎就不那么好理解了。

### forEach

我们试着用 forEach 代替上面的 for-loop 代码：

```javascript
const start = async () => {
  console.log('Start');

  ['onion', 'ginger', 'garlic']
  .forEach(async function callback(veg){
    const num = await getVegetableNum(veg);
    console.log(veg, num);
  })；

  console.log('End');
}
```

看下方的输出结果：显然乱了，`End`比预期更早出现了。原因很简单，`async/await`只是一种语法糖而已，forEach 并非 promise-aware 语法，它无法将 callback 里的 await 进一步转换成我们希望的一连串 `Promise-then` 形式。

```bash
Start
End
onion 1
ginger 2
garlic 3
```

### map

使用 map 来观察 callback 会更加直观：

```javascript
const start = async () => {
  console.log('Start');

  const promises = ['onion', 'ginger', 'garlic']
    .map(async function callback(veg) {
      const num = await getVegetableNum(veg);
      console.log(veg, num);
    });

  console.log('promises:', promises);

  console.log('End');
}
```

小改了一下代码，map 执行结果和 forEach 如出一辙；看下方的打印结果：执行完 map 后返回的是一个 Pending 状态的 Promise 数组；而 callback 中 await 之后的判定，只会在下一个 microTask 里执行（MiroTask 分析见[《MacroTask & MicroTask》][1]）

```bash
Start
promises: [ Promise { <pending> }, Promise { <pending> }, Promise { <pending> } ]
End
onion 1
ginger 2
garlic 3
```

### filter

再看看 filter，callback 的返回事实上也是一个 Promise，而 Promise 在条件判断时为 true，所以这种情况下 filter 的判断永远为真，所以只浅拷贝了一份数组而已。

```javascript
const moreThan1 = ['onion', 'ginger', 'garlic']
  .filter(async (veg) => {
    const num = await getVegetableNum(veg);
    return num >= 1;
  });

//moreThan1 = ['onion', 'ginger', 'garlic']
```

### reduce

最后还有 reduce，下面代码里的 sum 返回的也是 Promise：

```javascript
const sum = ['onion', 'ginger', 'garlic']
  .reduce(async (acc, veg) => {
    const num = await getVegetableNum(veg);
    return acc + num;
  }, 0);

console.log(sum); // Promise { <pending> }
console.log(await sum); // [object Promise]3
```

但有趣的是这个 promise 的判定结果是`[object Promise]3`。稍微分析一下：

* 在第一次迭代时，callback 里的 acc 是 0——初始值，num 是 1，acc+num 是 2，但由于是 async 函数，返回的是一个 Promise（上面提到过）
* 第二个迭代开始，acc 就一直是 Promise 了，而 `Promise+num` 的打印结果是 `[object Promise]${num}`
* 迭代最后一个 `num` 是 3， 所以返回的 `sum` 也就成了 `Promise{ '[object Promise]3' }`

reduce 的问题比上面三个好解决：`acc` 不是 Promise 吗？直接利用 await 返回 `acc` 判定结果就是了：

```javascript
const sum = await ['onion', 'ginger', 'garlic']
  .reduce(async (acc, veg) => {
    const num = await getVegetableNum(veg);
    return (await acc) + num;
  }, 0);

console.log(sum); // 6
```

当然这个写法确实挺难看的。

## Promise.all

我们看了上面四种迭代方法——forEach、map、filter、reduce，只要是 callback 使用了`async/await`，结果就很难预计了，所以应该尽量避免这种写法。那怎么改写呢？可以先把所有异步数据一次性取过来，再进行后续循环操作；常用的手段就是使用 `Promise.all`：

```javascript
const fetchNums = (vegs) => {
  const promises = vegs.map( getVegetableNum );
  return Promise.all( promises );
}

const start = async () => {
  console.log('Start');

  const nums = await fetchNums( ['onion', 'ginger', 'garlic'] );
  console.log(nums); // [1, 2, 3]
  // then map, forEach, filter or reduce according to nums

  console.log('End');
}
```

好处还是挺明显的：

* 从代码质量上来说，符合单一原则，将取数据和操作数据分开来
* 从性能上来说，循环里的异步请求是顺序执行的，而`Promise.all`是并发执行，速度更快

## 小结

今天回顾了一下`async/await`在循环语句里的使用方法，在普通的 for-loop 里，所有的await都是串行调用的，可以放心使用，包括 while、for-in、for-of 等等；但是在有 callback 的 array 方法，如 forEach、map、filter、reduce 等等，最好就别使用 await 了。当然最优解还是 `Promise.all`，无论从质量上还是效率上都是不二选择。

## 相关

* [《MacroTask & MicroTask》][1]

[1]: https://www.jianshu.com/p/d4b5170a5c94
