# 从callback到promise

## Javascript异步演化史

前几天看了一个[Javascript异步演化史][1]，谈到从callback到Promise再到Async/Await的历程，很有趣。大家有兴趣的话可以去看一下原文，或是直接百度搜翻译。

我这里默认大家都了解了这段历史，只简单介绍一下javascript异步操作里的一个小知识点--promisify。

## 从callback到promise

说起回调（callback），那可以说是JS最基础的异步调用方式，是JS为解决阻塞请求而量身定制出的一种设计模式，在JS或是说前端大潮中有着举足轻重的影响。但回调本身却有几个重大的缺陷：
1. 回调嵌套，俗称回调地狱
2. 不能return，反直觉
3. 异常捕获很难看，还需要再嵌套error函数

所以，现代Javascript的api设计早已经转向Promise-Based Method，许多老旧代码库重构后会添加`.promise()`方法支持返回一个new Promise。

不过，我自己在开发的项目中还是能遇到许多遗产代码，依旧是各种callback，有什么方法能兼容一下ES6的Promise呢？这就是我今天会提到的***promisify***。

以下是一个NodeJS读取文件的片段，典型的回调案例，读取文件后的业务会被包裹在`cb`函数里。我希望`promisify`后的函数能实现then到data、catch到err的串行操作。

```javascript
const fs = require('fs');
fs.readFile('file.txt', 'utf8', function cb(err, data) {
  if (err) {
    console.error(err); 
    return;
  }
  console.log( data);
});
```

回忆一下[Promise][3]的构造函数:
```javascript
new Promise( function executor(resolve, reject) { ... } );
```

构参是一个executor函数，并传入`resolve`和`reject`两个判定函数，分别用于判断promise是否成功。只要`resolve`、`reject`其一被执行，Promise异步调用就立即结束（另一个判定将被忽略）。若`resolve`被调用，则`then`里返回data；若`reject`被调用，则`catch`里抛出error。

OK，稍微改造一下上述代码片段（改造如下），就达到***promisify***的效果了。

```javascript
new Promise( (resolve, reject) => {
    fs.readFile(fileName, 'utf8', (err, data) => err? reject(err) : resolve(data));
  }).then( (data) => {
    console.log(data);
  }).catch( (err) => {
    console.error(err);
  });
```

## 通用promisify方法

promisify需求可能在项目中广泛存在，每次调用new Promise构造函数总显得不是那么优雅。
动一下脑筋，其实可以实现一个通用的工厂方法。我用闭包写了一个乞丐版的promisify。

```javascript
function promisify (originFn) {

  return function(...args) {
    return new Promise( (resolve, reject) => {

      let cb = (err, data) => err ? reject(err) : resolve(data);

      originFn.call(this, ...args, cb)
    } )
  }
}
```

工厂方法调用如下所示，是不是方便多了？
```javascript
let readFilePromisify = promisify(fs.readFile);

readFilePromisify(fileName, 'utf8')
  .then( (data) => {
    console.log(data);
  }).catch( (err) => {
    console.error(err);
  });
```

还可以用于async/await
```javascript
try {
  let data = await readFilePromisify(fileName, 'utf8');
  console.log(data);
} catch ( err ) {
  console.error(err)
}
```

## 第三方库

事实上NodeJS自己的util库里就已经实现了promisify
```javascript
const {promisify} = require('util');
let readFilePromisify = promisify(fs.readFile);
```

前端的话可以import蓝鸟（[bluebird][2]）的promisify。听说该库的Promise性能是原生的三倍。
```javascript
import {promisify} from 'bluebird';
let readFilePromisify = promisify(fs.readFile);
```

## 小结

今天讲解了一下如何实现一个`promisify`将callback转成Promise，内容很简单，也没有太多新意，更多的细节就不展开了。

最近看到某厂还在维护遗产代码，写的是ES5，用到了jQuery和google closure library。我很惊讶的是，虽然jQuery和closure中已经实现了Promise库，但是大家还是写着各种回调地狱。似乎没有一个人想过实现一个简单的promisify转向串行风；无论前端还是后端，日复一日写着相同的代码，一成不变。

有时候落后并不见得是手上的工具，更可能是你的思考方式。

[1]: https://tylermcginnis.com/async-javascript-from-callbacks-to-promises-to-async-await/
[2]: https://github.com/petkaantonov/bluebird
[3]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
