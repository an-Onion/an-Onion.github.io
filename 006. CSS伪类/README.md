# CSS伪类

## 简介:

CSS 伪类 ([Pseudo-classes][5])是W3C里制定的一套选择器的特殊状态，有几十个之多。语法如下:
```css
selector:pseudo-class {property: value;}
```
我们比较常见的有`:link`、`:focus`、`:active`等等。今天我来介绍几个比较有趣的伪类选择器，并在某些场景里实现一些酷炫的功能。

## :first-child

前段时间在开发一个dashboard的页面，客户提了一个需求，当dashboard页面的todo为空时，显示no task图标。需求很简单，有todo时隐藏图标，没todo显示图标。

![no task icon][8]

我看了一下组里小朋友的实现，大体思路如下。很娴熟地使用了v-if条件渲染。

```html
<section v-if="todos.length">
    <h1>TODO</h1>
    <ol>
        <li v-for="todo in todos"> {{todo}}</li>
    </ol>
</section>
<section v-else>
    <v-icon>inbox</v-icon>
    <p>No Task</p>
</section>
```
不过后来dashboard里需要增加与todo同级的news了，然后代码就变成了这样：

```html
<section v-if="todos.length+news.length">
    <div v-if="todos.length">
        <h1>TODO</h1>
        ...
    </div>
    <div v-if="news.length">
        <h1>NEWS</h1>
        ...
    </div>   
</section>
<section v-else>
   ...
</section>
```

先不论代码可读性，`<section v-if="...">`判断语句会随着新条目的增加不断修改，从[开放闭合原则][1]的角度来说，这并不是很适宜。

其实，这个案例里用一个简单的CSS伪类`:first-child`就可以很好的满足需求。如下，为图标所在section添加一个*no-task*类，并在样式表里添加`:first-child`选择器。

```html
<section v-if="todos.length">
    ...
</section>
<!-- 增加新的条目且不需要修改原先的代码 -->
<section v-if="news.length">
    ...
</section>
<section class="no-task">
   <v-icon>inbox</v-icon>
   <p>No Task</p>
</section>
```
顾名思义，`:first-child`用于选取属于其父元素的首个子元素的指定选择器。通俗来说，*first-child*指的是该元素本事为长子时的状态。

样式表内容如下。当no-task类为首元素时，显示图标，其他形态下隐藏自身。

```css
.no-task {
  display: none;
}

.no-task:first-child  {
  display: block;
}
```

除此之外，还有这么几个类似功用的伪类，大家有兴趣都可以去看一看：

* :last-child
* :first-of-type
* :last-of-type
* :nth-child
* :nth-last-child

## [CSS Counters][2]

我发现很多同事学过CSS，但是知道CSS也能计数的并不多。只要回想一下`<ol>`标签能产生从1~n的数值时，其实也不会觉得太奇怪了。

> CSS计数器的值通过使用`counter-reset` 和 `counter-increment` 操作，在 `content` 上应用 `counter()` 或 `counters()`函数来显示在页面上。

再以上面todo为例加一个计数器。

```html
<section class="to-dos">
    <h1>TODO</h1>
    <ul>
      <li class="to-do" v-for="item in todos"> {{item}}</li>
    </ul>
    <!-- counter of todos -->
    <div class="counter"><div> 
  </section>
```

使用CSS计数器之前，必须重置一个值（如：`todo`），默认是0。接着，每渲染一个 `<li class='to-do'>`元素，todo计数+1。最后在`.counter:after`的`content`里显示计数结果。（注意：`content`只出现在html伪元素`::before`或是`::after`里）

```css
section.to-dos {
  counter-reset: todo;  /* Set a counter named 'todo'*/
}

li.to-do {
  counter-increment: todo; /* Increment 'todo' counter by 1 */
}

.counter:after {
  content: counter(todo); /* Display the value of counter */
}
```

再稍微加工一下就可以实现如下功能了。请注意右上角的数字，这是利用CSS计数器动态生成的数值。

![todo counter][7]

## :checked and :not(checked)

我在[浏览器default actions][3]这一期里提到过用`radio`做互斥按钮。

![radio button][9]

这里就用到了input radio的`:checked`伪类。那`unchecked`呢？没有这个伪类，但是可以用[否定伪类][4]，`:not(checked)`。

回忆一下上述互斥按钮的代码：

```html
<li v-for="item in items">
    <span>{{item}}</span>
    <label>
        <input type="radio" name="radio" :value="item"/>
        <div class="btn btn-primary selected">selected</div>
        <div class="btn btn-light unselected">unselected</div>
    </label>
</li>
```

列表项`<li>`里的`<input type="radio" name="radio">`共享同一个name，形成互斥效果。点击`<label>`后，内嵌的radio被置为`:checked`，其他radio自动变为`:not(checked)`。我们可以通过这个状态差异来让`:checked`的`.selected`兄弟可见，`.unselected`兄弟隐藏；反之，`:not(checked)`的`.unselected`兄弟可见，`.selected`兄弟隐藏。代码实现如下。是的，没有用到一点Javascript。

```css
input[type="radio"]:checked ~ .selected {
  display: block;
}

input[type="radio"]:checked ~ .unselected {
  display: none;
}

input[type="radio"]:not(checked) ~ .unselected {
  display: block;
}

input[type="radio"]:not(checked) ~ .selected {
  display: none;
}
```


## checked, unchecked, and indeterminate.

突然想到了一个很冷的知识：radio和checkbox一共有三种状态 checked、 unchecked和indeterminate。没错，还有一个中间态。checkbox三态如下所示。我记得早些年的QQ mail就利用过`indeterminate`制作过一个特殊效果。

![three status][6]

* checkbox的`indeterminate`只能通过JS来设置

    ```javascript
    let checkbox = document.getElementById("checkbox")
    checkbox.indeterminate = true;
    ```

* radio的话，当所有同名radio都未被选择时，它们呈现的状态叫`indeterminate`。

## 总结

CSS伪类是一个很有趣知识点，很多人觉得这个伪类太过奇技淫巧，甚至有哗众取宠之嫌。其实CSS伪类，还有html的伪元素有许多实用的功能，熟练掌握可以极大地简化html、减少JS的绑定。你的页面也将更加简洁优雅。

[1]: https://zh.wikipedia.org/wiki/%E5%BC%80%E9%97%AD%E5%8E%9F%E5%88%99
[2]: https://developer.mozilla.org/zh-CN/docs/Web/Guide/CSS/Counters
[3]: https://www.jianshu.com/p/77f1746fe064
[4]: https://developer.mozilla.org/zh-CN/docs/Web/CSS/:not
[5]: https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes
[6]: https://upload-images.jianshu.io/upload_images/14368237-a3f8ca5a6e6126f2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[7]: https://upload-images.jianshu.io/upload_images/14368237-18b557b7757f3969.gif?imageMogr2/auto-orient/strip
[8]: https://upload-images.jianshu.io/upload_images/14368237-89c1336e318a82ee.gif?imageMogr2/auto-orient/strip
[9]: https://upload-images.jianshu.io/upload_images/14368237-c59f7e08c2214b02.gif?imageMogr2/auto-orient/strip

