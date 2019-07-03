## Tips and Tricks for Better JavaScript

经常code review，我发现JS newbie很容易写出一堆冗长的代码。今天就列几个比较常见的“解决之道”，看看如何减少JS里的条件判断。

## 提前返回，少用`if...else`

“`if...else`是编程语言的精华。——鲁迅”
但是过多的嵌套，还是挺令人抓狂的。这里有一个很典型的条件嵌套：
```javascript
function func(){
  var result;

  if( conditionA ) {
    if( condintionB ) {
        result = 'Success';
    } else {
        result = 'Error1';
    }
  } else {
    result = 'Error2'
  }

  return result;
}
```

这种嵌套的特点就是else里的代码块很小，但是由于不得不做的分支语句导致多层嵌套。动动脑筋，怎样精简一下呢？在if里做`非`判断，提前return else分支。

```javascript
function func(){
  if( !conditionA ) {
    return 'Error2'
  }

  if( !condintionB ) {
    return 'Error1'
  }

  return 'Success';
}
```

## forEach优化

遍历的时候也经常产生大量的嵌套，如下代码所示，我们先对数组元素做一次合法性校验，通过后再做一次新的操作，最后把操作结果追加到新数组里。

```javascript
const func = (arr) => {
    const res = []
    arr.forEach( (e) => {
        if( e !== 'Onion' ){
            res.push(`${e} Run!`)
        }
    })
    return res;
}
```

仔细观察这就是一个filter加map的过程。我们不妨试试函数式编程：

```javascript
const func = (arr) => {
    return arr
            .filer( (e) => e !== 'Onion' )
            .map( (e) => `${e} Run!` );
}
```

## 多条件，用`Array.includes`

再举个例子，某个页面需要检验输入type是否合法。我收到过一个MR曾经是这么写的。

```javascript
const init(type) {
    if( type === 'Seminar' || type === 'Interview' ) {
        console.log('valid');
    }
    ...
    console.error('invalide');
}
```

如果合法的类型只有两种，代码其实也没啥问题。只是一般的业务很容易有后续的延展。今后将合法类型增加到10种的话，上述代码里将是一大长串的if判断。这种代码可读性极差，我们不如转换一下思想，把非法类型储到数组里，用`Array.includes`来帮你完成冗长的判断。之后每增加一种新的类型，只需在数组后追加新字符串就行了。

```javascript
const init(type) {
    const invalidArray = ['Seminar', 'Interview']
    if( invalidArray.includes(type) ) {
        console.log('valid');
    }
    ...
}
```

## 使用object索引

类似的情况也出现在三元表达式里:

```javascript
const dateFormat = (dateTime) => {
    const format = this.$i18n.locale === 'en' ? 'mmm d, yyyy' : 'yyyy年m月d日';
    return DateFormat(dateTime, format);
}
```

我们现阶段多语言只有`en`和`zh`，上述代码自然不是问题，但是也难保哪天会支持日语——`ja`。这时候再写成下面这类代码就很搞笑了：

```javascript
const format = this.$i18n.locale === 'en' ? 
'mmm d, yyyy' : 
(this.$i18n.locale === 'zh' ? 
     'yyyy年m月d日' : 'yyyy/m/d');
```

比较合适的写法就是使用object键索引，这样当语言业务扩展后，只需要在`localeFormats`后追加新格式就行了。

```javascript
const localeFormats = {
    en: 'mmm d, yyyy',
    zh: 'yyyy年m月d日',
    ja: 'yyyy/m/d',
}

const format = localeFormats[this.$i18n.locale];
```

## 尽量少用swith

长Switch也及其难看。

```javascript
export function(type) {
    switch( type ) {
        case 'Onion':
            return func1();
        case 'Garlic':
            return func2();
        case 'Ginger':
            return func3();
        default:
            return () => {console.error('ERROR')};
    }
}
```
我记得OOP设计模式里提到过：尽量使用多态和继承代替Switch结构。JS里倒不必非得往这方面想，用Object或是Map索引来代替Switch也是极好滴！

```javascript
const arr = [
    ['Onion', func1],
    ['Garlic', func2],
    ['Ginger', func3],
]
const def = () => {console.error('ERROR')}
const vegetable = new Map(arr);

export function(type) {
    return ( vegetable.get(type) || def ).call(null);
}
```

## Optional Chaining

Optional Chaining（以下简称OC）是我极力推荐的一个语法糖。我写过一期[《Javascript Optional Chaining》][1]具体介绍它的用法，有兴趣的小伙伴可以看一看，这里稍微点一下。比如我们想获取地址里的街道信息，但是并不确定地址本身是否存在，因此只能在获取街道前，事先判断一下地址合法性，一般我们会这么写：

```javascript
if( address ) {
  var street = address.street;
}
```

但假如再多一层呢，从`basicInfo.address.street`这样找下来呢？

```javascript
if( basicInfo ) {
    var address = basicInfo.address;
    if( address ) {
       var street = address.street;
    }
}
```
上面的代码我已经觉得很丑陋了，再多个几层真是没法看了。不过不用担心，有了OC一切迎刃而解。（虽然OC还在ECMAScript stage2，但是大家可以用babel尝鲜；babel会自动把如下源码转义成上面的形式）

```javascript
var street = basicInfo?.address?.street;
```

## 写在最后

自学过几种编程语言，我感觉这类小技巧在各类语言中大同小异；实现上也许有细微差别，但基本思想都是一样的——减少大括号的数量！！
我在面试的时候经常看到一些人写代码及其冗长，嵌套极多。我提醒后，得到的回复一般是：“我没做过这种面试”，“我熟悉的是另外一种语言”等等。回过头来再想想，这真的是好理由吗？


[1]: https://www.jianshu.com/p/e9ed7660034e