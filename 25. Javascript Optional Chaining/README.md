# Javascript Optinal Chaining

最近看到一个ECMAScript新动态——[Optional Chaning][1]在6月5号进入了stage2。Stage2表明委员会已经认可这个新feature，并希望最终能加入到ECMAScript标准中去。我对Optional Chaning（以下简称OC）还是挺感兴趣的，本文就借此机会谈一谈这个新特性。

## 概述

OC是一个很有名的语法，C#、Swift、Kotlin、Ruby等等很多知名语言都有实现。虽然语义上有些许差异，不过大致方向基本相同，语法基本都是以问号和点（`?.`）的形式表示。一般来说，OC主要有以下三种使用场景，静态调用、动态调用、函数调用：

```javascript
obj?.prop       // optional static property access
obj?.[expr]     // optional dynamic property access
func?.(...args) // optional function or method call
```
当`?.`前面的变量为`null`或是`undefined`时，直接返回`undefined`。

```javascript
// undefined if `a` is null/undefined, `a.b` otherwise.
a?.b
a == null ? undefined : a.b

// undefined if `a` is null/undefined, `a[x]` otherwise.
a?.[x]
a == null ? undefined : a[x]

// undefined if `a` is null/undefined, throws a TypeError if `a.b` is not a function,
//otherwise, evaluates to `a.b()`
a?.b()
a == null ? undefined : a.b()

// undefined if `a` is null/undefined,throws a TypeError if `a` is neither null/undefined,
//nor a function invokes the function `a` otherwise
a?.()
a == null ? undefined : a()
```

它主要解决的问题是：当访问树状结构的对象时，需要逐个判断中间节点是否有效。举个例子，我们想获取地址里的街道信息，但是并不确定地址本身是否存在，因此只能在获取街道前，事先判断一下地址合法性，JS中一般有如下三种写法：

```javascript
if( address ) {
  var street = address.street;
}

//OR
var street = address ? address.street : undefined;

// OR
var street = address && address.street;
```

上面的例子比较简单，但是更深层次的结构，比如从国别、省份、城市、街道一路下去寻找地址信息，每一步都需要判断是否为undefined，这个代码就会很恶心了。如果使用OC语法糖，可以急速提高可读性：

```javascript
let street = nation?.province?.city?.street
```

## Babel

得益于Babel的插件[@babel/plugin-proposal-optional-chaining][2]，我很早就在开发中使用OC了。

方法很简单，先安装babel的OC插件，再在配置文件里加一行plugins即可，心动的朋友们马上可以开始尝试了。

```shell
yarn add -D @babel/plugin-proposal-optional-chaining
```

```javascript
//.babelrc
{
  "plugins": ["@babel/plugin-proposal-optional-chaining"]
}
```

需要注意的是：一般我们都会用eslint，得事先加上新的parserOptions，不然lint会一直报错。

```javascript
//.eslintrc.js
module.exports = {
  parserOptions: {
    parser: 'babel-eslint'
  },
  ...
}
```

## Typescript

TS是JS的超级，不过由于种种原因TS也还没实现这个语法糖。我曾经试过在TS里用babel插件转义OC，不过VS code支持没法解决，一直显示错误，遂放弃。
后来找了些折中的方案。

1. [ramda pahtOr][3]

    ```javascript
    R.pathOr('N/A', ['a', 'b'], {a: {b: 2}}); //=> 2
    R.pathOr('N/A', ['a', 'b'], {c: {b: 2}}); //=> "N/A"
    ```
    没用过ramda的同学可能看起来有点费劲，pathOr的参数是从右到左看的，等价于：
    ```javascript
    const obj = {a: {b: 2}};
    const res = obj?.a?.b ?? 'N/A'
    ```
    说到这里我顺便提一下`??`这个语法糖，叫[nullish coalescing operator][6]，也是最近刚被提到stage2的新特性，它是用来代替`||`的。在上面的例子里，用`||`并且`b=0`的话，`res = 0 || 'N/A'`，结果就错误了；使用`??`就是来避免这类bug的。

2. [loadash _get][4]

    loadash参数正好和ramda相反，从左到右，而且第二个参数是Array或String：
    ```javascript
    _.get({ a: { b: 2 } }, ['a', 'b'], 'N/A');
    _.get({ a: { b: 2 } }, 'a.b', 'N/A');
    ```

3. [ts-optchain][5]

    后来我又找到了一个更好玩的库，只要给第一级对象包一层oc方法，就可以一路点下去了；链路够长的话，甚至比`?.`语法糖更节省字符。
    ```javascript
    import { oc } from 'ts-optchain';
    const obj: T = { /* ... */ };
    const value = oc(obj).propA.propB.propC(defaultValue);
    ```

    前提是给tsconfig.json加一个compiler plugins
    ```javascript
    // tsconfig.json
    {
        "compilerOptions": {
            "plugins": [
                { "transform": "ts-optchain/transform" },
            ]
        },
    }
    ```

## 边界情况

一般开发中，我们掌握上面概述里的OC语法其实也够用了。不过某些场景下，可能会出现一些歧义。

### 短路

如下，如果a不为null或undefined，x会自增。
```javascript
a?.[++x]
```

但是a为null或undefined时，怎么办呢？应该是`x`不变，理由是OC本质上是一种语法糖，最终会转换为如下三元表达式，自然不会调用`++x`。
```javascript
a == null ? undefined : a[++x]
```

### 安全调用

在JS的OC里，作用域仅限于调用处，假如后续只用`.`不使用`?.`，调用安全是不保障的，就是说如果某一层出现undefined，JS会抛出异常。
```javascript
a?.b.c(++x).d
a == null ? undefined : a.b.c(++x).d
```

也许你会觉得这个有什么好争议的。但是，某些语言（如C#、CoffeeScript）会将安全保护一路**延续**下去；还有上面提到的`ts-optchain`也是这么使用的。`a?.b.c(++x).d`会等价于`a?.b?.c?.(++x)?.d`。很有趣吧，对某些开发人员来说，你认为的理所当然可能会导致他人的极大困惑。

### Delete

OC是支持安全删除的，这点我不是很能理解，但是委员会的解释是：“为什么不支持呢？”嗯，有理有据，无可辩驳。
```javascript
delete a?.b
a == null ? true : delete a.b
```

### 分组
`(a?.b).c`和`a?.b.c`是不一样的。
```javascript
(a?.b).c
(a == null ? undefined : a.b).c
```

```javascript
a?.b.c
a == null ? undefined : a.b.c
```

注意到没？括号优先级是高于点的，在a为`undefined`时，解析出了`undefined.c`——这个会抛异常的。所以在使用OC时，尽量不要添加括号，以免引起不必要的麻烦。

## 轶事

后来我又看了一下Q&A版块，还是挺欢乐的。比如：

1. 为什么语法是`?.`而不是`.?`
2. 为什么`null?.b`的结果不是`null`

是不是很无聊的问题？这是委员每天都在争论的话题。看看它们的回答：
1. 可能与三元表达式冲突，比如`1.?foo : bar`
2. 由于`.`表达式不关心`.`前面对象的类型，它的目的是访问`.`后面的属性，因此不会因为`null?.b`就返回`null`，而是统一返回`undefined`

还有一些边边角角的特性，比如：
* 安全的 construction: **new a?.()**
* 安全的 template literal：**a?.\`string\`**
* 安全的赋值：**a?.b = c**
* 自增，自减：**a?.b++, --a?.b**
* 解构赋值： **{ x: a?.b } = c, [ a?.b ] = c**
* for 循环中的临时赋值：**for (a?.b in c), for (a?.b of c)**

这些问题对开发者的理解成本较大，有些会支持，有些不会支持，有些甚至都不想讨论。也难过OC提案这么多年才刚刚突破stage2.

## 小结

以前我也觉得OC这么甜的语法糖，应该尽早推出，不该整天瞎逼逼些无聊的话题。但事实上语言设计者的思考比我们深远许多。JS本身就是很好的反面教材，当年语言设计过于冲忙，直接导致了许多语法级别的bug；之后积重难返，给web开发留下了无数的巨坑。一个新语法的特性不是三言两语，或是拍拍脑袋就决定的。我就没有考虑过OC有这么多边界问题，归根结底还是自己碰到的具体案例太少，没有思考过特定场合的语义特性。有时候我们在埋怨某些语言多年止步不前时候，也可以思考一下其中的难点。


[1]: https://github.com/tc39/proposal-optional-chaining
[2]: https://babeljs.io/docs/en/babel-plugin-proposal-optional-chaining
[3]: https://ramdajs.com/docs/#pathOr
[4]: https://lodash.com/docs/4.17.11#get
[5]: https://github.com/rimeto/ts-optchain
[6]: https://github.com/tc39/proposal-nullish-coalescing