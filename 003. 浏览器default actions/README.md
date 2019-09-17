# 浏览器default actions

## 浏览器默认行为（browser default actions）

[上一期][3]谈到了浏览器事件委托：给外层元素绑定一个listener，可以处理子元素上触发的浏览器默认行为。事件委托可以大量减少js的DOM绑定，从而提升页面性能。
这一期通过现实中的几个案例进一步拓展一下浏览器actions。

### 案例1： 阻止url跳转

阻止浏览器的默认行为主要是两种方式：

1.  在事件捕获、冒泡阶段对元素或其父级元素调用`event.preventDefault()`

2. 对元素或其父级元素加`on<event>`（如onclick），并`return false`(**注**：addEventListener无效)

对`<a href="#">`阻止默认action后，点击该标签后将不会触发url跳转：

```html
<a href="#" onclick="return false">return false</a>
<a href="#" onclick="event.preventDefault()">event.preventDefault()</a>
```

```html
<div onclick="return false">
  <a href="#">parent prevent way1</a>
</div>
<div onclick="event.preventDefault()">
  <a href="#">parent prevent way2</a>
</div>
```

### 案例2：`<input type="radio">`

前段时间在写vue的时候发现一个有趣的问题，如图：

![demo2](https://upload-images.jianshu.io/upload_images/14368237-93bd36ea75db388e.gif?imageMogr2/auto-orient/strip)


选择场地，有且只能选一个。点**select**按钮后，Schedule会更新时间和地点。
我看了一下组里小朋友的实现，大体思路是：
1. 每个按钮绑定一个listener，点击后把该按钮的value保存到state里；
2. 接着state更新Schedule里的信息；
3. 再遍历其他行里的selected按钮并改成unselected。

很复杂很复杂，性能也堪忧。

仔细观察原型后可以发现每个select按钮都是互斥的，这就是一个典型的radio事件。

我简单实现了一个[demo][2]，通过事件委托拿到radio的actions：
```html
<h2>Checked item: {{radio}}</h2>
<ul @click="radioFn">
  <li v-for="(item, idx) in items" :key="idx">
    <span>{{item}}</span>
    <label>
      <input type="radio" name="radio" :value="item"/>
      <div class="btn btn-primary selected">selected</div>
      <div class="btn btn-light unselected">unselected</div>
    </label>
  </li>
</ul>
```
`radioFn`在冒泡阶段拿到来自子级元素的`INPUT`事件后，就可以获得被checked的radio的value了。相应地，其他radio会被浏览器自动置为unchecked。
```javascript
radioFn (e) {
  let target = e.target
  if ('INPUT' === target.nodeName)
    this.radio = target.value
}
```
CSS有点trick，用到了伪类和兄弟选择器。有空我再深入介绍一下，这里暂且不谈。
```css
input[type="radio"] {
  position: absolute;
  left: 10em;
  display: none;
}

input[type="radio"]:checked ~ .unselected {
  display: none;
}

input[type="radio"]:not(checked) ~ .selected {
  display: none;
}

input[type="radio"]:not(checked) ~ .unselected {
  display: block;
}

input[type="radio"]:checked ~ .selected {
  display: block;
}
```

至此，只需要在父级元素里绑定一个listener就可以实现上述案例的所有功能了。即便之后把radio所在行包在某component里面，上述实现依旧有效。

![radio capture](https://upload-images.jianshu.io/upload_images/14368237-92e9d12420a43164.gif?imageMogr2/auto-orient/strip)


### 扩展：`<input type="checkbox">`

有了radio的hint，出一道quiz。如图所示，问如何获取到所有已点选的checkbox信息？

![checkbox capture](https://upload-images.jianshu.io/upload_images/14368237-6a188ed58780ea9d.gif?imageMogr2/auto-orient/strip)


### 其他

接着再列举一些无趣也不知道是否有用的的小知识：

1. 我们可以用`return false`使鼠标`focus`输入框时无效，但是还是可以通过其他途径到达输入框， 如按`Tab`，或是按`input`关联的`label`。[例][1]：

    ```html
    <input value="focus works" onfocus="this.value=''"/>
    <input value="disable mouse down" onmousedown="return false"/>
    ```

2. 可以disable掉鼠标右键浏览器下拉菜单，也可以定制自己的事件。

    ```html
    <button oncontextmenu="return false">
      鼠标右键后将不会出现默认的浏览器下拉菜单
    </button>
    ```

3. 当`input`的type为*submit*或是*reset*时，它就变成了button。

    * `type="submit"`会触发form的method
    * `type="reset"`能将form里的域置为初始值

    ```html
    <form action="#" method="get">
      <label for="firstname">First Name:</label>
      <input id="firstname" name="firstname" /><br>
      <label for="lastname">Last Name:</label>
      <input id="lastname" name="lastname" /><br>
      <input type="submit"/>
      <input type="reset"/>
    </form>
    ```

### 小结

浏览器提供了很多默认的actions，下面列了一些常用到的事件：
* **mousedown**： 鼠标左键点击控件
* **checkbox**、**radio**：`<input>`返回*checked*和*unchecked*信息 
* **submit**、**reset**： 提交、重置`<form>`里的信息，并且绑定了回车热键
* **wheel**: 鼠标滚轮操作
* **keydown**：在输入框内输入信息
* **contextmenu**： 鼠标右键展示下拉菜单

灵活使用这些默认的actions，可以帮助我们省去大量的js操作，提高网页性能。当不需要时，使用`event.preventDefault()`或是`return false`就可以阻止它们了。


[1]: https://codepen.io/anOnion/pen/PyvGyq
[2]: https://codepen.io/anOnion/pen/OBYpMY
[3]: https://www.jianshu.com/p/0069519aba01
