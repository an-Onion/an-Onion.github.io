# Checkbox Pattern 详解：构建无障碍复选框组件

复选框（Checkbox）是表单中最常见的交互元素之一，支持双状态（选中/未选中）和三状态（选中/未选中/部分选中）两种类型。本文基于 [W3C WAI-ARIA Checkbox Pattern][0] 规范，详解如何构建无障碍的复选框组件。

## 一、Checkbox 的定义与核心概念

复选框是一种允许用户进行二元或三元选择的控件。根据使用场景，复选框分为两种类型：

### 1.1 双状态复选框（Dual-State Checkbox）

在两个状态之间切换：

- **选中（Checked）**：复选框被选中
- **未选中（Not Checked）**：复选框未被选中

### 1.2 三状态复选框（Tri-State Checkbox）

在三个状态之间切换：

- **选中（Checked）**：复选框被选中
- **未选中（Not Checked）**：复选框未被选中
- **部分选中（Partially Checked）**：表示一组选项中部分被选中

### 1.3 三状态复选框的典型应用场景

三状态复选框常用于软件安装程序或权限设置中，一个总控复选框控制整组选项的状态：

- **全部选中**：如果组内所有选项都被选中，总控复选框显示为选中状态
- **部分选中**：如果组内部分选项被选中，总控复选框显示为部分选中状态
- **全部未选中**：如果组内没有选项被选中，总控复选框显示为未选中状态

用户可以通过点击总控复选框一次性改变整组选项的状态：

- 点击选中的总控复选框 → 取消全选
- 点击未选中的总控复选框 → 全选
- 点击部分选中的总控复选框 → 根据实现可能全选或恢复之前的状态

## 二、WAI-ARIA 角色与属性

### 2.1 基本角色

复选框具有 [`role="checkbox"`][2]。

### 2.2 可访问标签

复选框的可访问标签可以通过以下方式提供：

- **可见文本内容**：直接包含在具有 `role="checkbox"` 的元素内的文本
- **`aria-labelledby`**：引用包含标签文本的元素的 ID
- **`aria-label`**：直接在复选框元素上设置标签文本

```html
<!-- 方式一：可见文本内容 -->
<div
  role="checkbox"
  aria-checked="false">
  订阅新闻邮件
</div>

<!-- 方式二：aria-labelledby -->
<span id="newsletter-label">订阅新闻邮件</span>
<div
  role="checkbox"
  aria-checked="false"
  aria-labelledby="newsletter-label"></div>

<!-- 方式三：aria-label -->
<div
  role="checkbox"
  aria-checked="false"
  aria-label="订阅新闻邮件"></div>
```

### 2.3 状态属性

- [`aria-checked="true"`][3]：复选框被选中
- [`aria-checked="false"`][3]：复选框未被选中
- [`aria-checked="mixed"`][3]：复选框处于部分选中状态（仅三状态复选框）

### 2.4 分组属性

如果一组复选框作为逻辑组呈现且有可见标签：

- 使用 [`role="group"`][4] 包裹整组复选框
- 使用 [`aria-labelledby`][5] 引用组标签的 ID

```html
<fieldset
  role="group"
  aria-labelledby="group-label">
  <legend id="group-label">选择权限</legend>
  <label><input type="checkbox" /> 读取</label>
  <label><input type="checkbox" /> 写入</label>
  <label><input type="checkbox" /> 删除</label>
</fieldset>
```

### 2.5 描述属性

如果包含额外的描述性静态文本，使用 [`aria-describedby`][6]：

```html
<div
  role="checkbox"
  aria-checked="false"
  aria-describedby="terms-desc">
  我同意服务条款
</div>
<p id="terms-desc">点击此处查看完整的服务条款内容</p>
```

## 三、键盘交互规范

当复选框获得焦点时：

| 按键  | 功能                                     |
| ----- | ---------------------------------------- |
| Space | 改变复选框的状态（选中/未选中/部分选中） |

## 四、实现方式

### 4.1 双状态复选框

#### 原生 HTML 实现（推荐）

```html
<label>
  <input
    type="checkbox"
    name="newsletter" />
  订阅新闻邮件
</label>
```

#### ARIA 实现（自定义样式）

```html
<div
  role="checkbox"
  tabindex="0"
  aria-checked="false"
  onclick="toggleCheckbox(this)"
  onkeydown="handleKeydown(event, this)">
  <span
    class="checkbox-icon"
    aria-hidden="true"></span>
  订阅新闻邮件
</div>

<script>
  function toggleCheckbox(checkbox) {
    const isChecked = checkbox.getAttribute('aria-checked') === 'true';
    checkbox.setAttribute('aria-checked', !isChecked);
  }

  function handleKeydown(event, checkbox) {
    if (event.key === ' ') {
      event.preventDefault();
      toggleCheckbox(checkbox);
    }
  }
</script>
```

### 4.2 三状态复选框（全选/取消全选）

```html
<fieldset
  role="group"
  aria-labelledby="permissions-label">
  <legend id="permissions-label">文件权限</legend>

  <!-- 总控复选框 -->
  <label>
    <input
      type="checkbox"
      id="select-all"
      aria-checked="false"
      onchange="toggleAll(this)" />
    全选
  </label>

  <!-- 子复选框组 -->
  <div class="checkbox-group">
    <label>
      <input
        type="checkbox"
        name="permission"
        value="read"
        onchange="updateSelectAll()" />
      读取
    </label>
    <label>
      <input
        type="checkbox"
        name="permission"
        value="write"
        onchange="updateSelectAll()" />
      写入
    </label>
    <label>
      <input
        type="checkbox"
        name="permission"
        value="delete"
        onchange="updateSelectAll()" />
      删除
    </label>
  </div>
</fieldset>

<script>
  function toggleAll(selectAllCheckbox) {
    const checkboxes = document.querySelectorAll('input[name="permission"]');
    const isChecked = selectAllCheckbox.checked;

    checkboxes.forEach((checkbox) => {
      checkbox.checked = isChecked;
    });

    updateSelectAllState();
  }

  function updateSelectAll() {
    updateSelectAllState();
  }

  function updateSelectAllState() {
    const selectAllCheckbox = document.getElementById('select-all');
    const checkboxes = document.querySelectorAll('input[name="permission"]');
    const checkedCount = document.querySelectorAll(
      'input[name="permission"]:checked',
    ).length;

    if (checkedCount === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
      selectAllCheckbox.setAttribute('aria-checked', 'false');
    } else if (checkedCount === checkboxes.length) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
      selectAllCheckbox.setAttribute('aria-checked', 'true');
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
      selectAllCheckbox.setAttribute('aria-checked', 'mixed');
    }
  }
</script>
```

### 4.3 使用原生 HTML 实现三状态效果

HTML5 的 `indeterminate` 属性可以实现部分选中视觉效果：

```html
<label>
  <input
    type="checkbox"
    id="master-checkbox"
    onclick="handleMasterClick(this)" />
  全选
</label>

<label
  ><input
    type="checkbox"
    class="child-checkbox"
    onchange="updateMaster()" />
  选项 1</label
>
<label
  ><input
    type="checkbox"
    class="child-checkbox"
    onchange="updateMaster()" />
  选项 2</label
>
<label
  ><input
    type="checkbox"
    class="child-checkbox"
    onchange="updateMaster()" />
  选项 3</label
>

<script>
  function updateMaster() {
    const master = document.getElementById('master-checkbox');
    const children = document.querySelectorAll('.child-checkbox');
    const checkedCount = document.querySelectorAll(
      '.child-checkbox:checked',
    ).length;

    if (checkedCount === 0) {
      master.checked = false;
      master.indeterminate = false;
    } else if (checkedCount === children.length) {
      master.checked = true;
      master.indeterminate = false;
    } else {
      master.checked = false;
      master.indeterminate = true;
    }
  }

  function handleMasterClick(master) {
    const children = document.querySelectorAll('.child-checkbox');
    const isChecked = master.checked;

    children.forEach((child) => {
      child.checked = isChecked;
    });
  }
</script>
```

## 五、常见应用场景

### 5.1 表单选项

用户注册表单中的选项选择：

```html
<fieldset>
  <legend>兴趣爱好</legend>
  <label
    ><input
      type="checkbox"
      name="hobby"
      value="reading" />
    阅读</label
  >
  <label
    ><input
      type="checkbox"
      name="hobby"
      value="sports" />
    运动</label
  >
  <label
    ><input
      type="checkbox"
      name="hobby"
      value="music" />
    音乐</label
  >
  <label
    ><input
      type="checkbox"
      name="hobby"
      value="travel" />
    旅行</label
  >
</fieldset>
```

### 5.2 权限设置

系统权限管理中的功能授权：

```html
<fieldset
  role="group"
  aria-labelledby="permissions-heading">
  <h3 id="permissions-heading">用户权限</h3>

  <label>
    <input
      type="checkbox"
      id="select-all-permissions" />
    全选所有权限
  </label>

  <div class="permission-group">
    <label
      ><input
        type="checkbox"
        name="permission"
        value="view" />
      查看数据</label
    >
    <label
      ><input
        type="checkbox"
        name="permission"
        value="create" />
      创建记录</label
    >
    <label
      ><input
        type="checkbox"
        name="permission"
        value="edit" />
      编辑内容</label
    >
    <label
      ><input
        type="checkbox"
        name="permission"
        value="delete" />
      删除数据</label
    >
  </div>
</fieldset>
```

### 5.3 安装程序选项

软件安装时的组件选择：

```html
<fieldset>
  <legend>选择安装组件</legend>

  <label>
    <input
      type="checkbox"
      id="select-all-components" />
    安装所有组件
  </label>

  <label
    ><input
      type="checkbox"
      name="component"
      value="core"
      checked
      disabled />
    核心程序（必需）</label
  >
  <label
    ><input
      type="checkbox"
      name="component"
      value="docs" />
    帮助文档</label
  >
  <label
    ><input
      type="checkbox"
      name="component"
      value="plugins" />
    插件包</label
  >
  <label
    ><input
      type="checkbox"
      name="component"
      value="shortcuts" />
    桌面快捷方式</label
  >
</fieldset>
```

### 5.4 表格行选择

数据表格中的批量操作：

```html
<table role="grid">
  <thead>
    <tr>
      <th>
        <input
          type="checkbox"
          id="select-all-rows"
          aria-label="选择所有行" />
      </th>
      <th>姓名</th>
      <th>邮箱</th>
      <th>状态</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <input
          type="checkbox"
          class="row-checkbox"
          aria-label="选择张三" />
      </td>
      <td>张三</td>
      <td>zhangsan@example.com</td>
      <td>活跃</td>
    </tr>
    <tr>
      <td>
        <input
          type="checkbox"
          class="row-checkbox"
          aria-label="选择李四" />
      </td>
      <td>李四</td>
      <td>lisi@example.com</td>
      <td>待审核</td>
    </tr>
  </tbody>
</table>
```

## 六、最佳实践

### 6.1 优先使用原生复选框

原生 HTML `<input type="checkbox">` 提供完整的无障碍支持，包括：

- 自动键盘交互（Space 键切换）
- 屏幕阅读器自动播报状态
- 浏览器原生样式和焦点管理

### 6.2 标签关联

始终使用 `<label>` 元素关联复选框和标签文本：

```html
<!-- 推荐：使用 for 属性关联 -->
<input
  type="checkbox"
  id="agree" />
<label for="agree">我同意服务条款</label>

<!-- 推荐：使用嵌套方式 -->
<label>
  <input type="checkbox" />
  我同意服务条款
</label>
```

### 6.3 分组语义

相关复选框应使用 `<fieldset>` 和 `<legend>` 进行分组：

```html
<fieldset>
  <legend>选择通知方式</legend>
  <label><input type="checkbox" /> 邮件通知</label>
  <label><input type="checkbox" /> 短信通知</label>
  <label><input type="checkbox" /> 应用内通知</label>
</fieldset>
```

### 6.4 状态同步

三状态复选框需要确保 DOM 属性与 ARIA 属性同步：

```javascript
function updateTriState(checkbox, checkedCount, totalCount) {
  if (checkedCount === 0) {
    checkbox.checked = false;
    checkbox.indeterminate = false;
    checkbox.setAttribute('aria-checked', 'false');
  } else if (checkedCount === totalCount) {
    checkbox.checked = true;
    checkbox.indeterminate = false;
    checkbox.setAttribute('aria-checked', 'true');
  } else {
    checkbox.checked = false;
    checkbox.indeterminate = true;
    checkbox.setAttribute('aria-checked', 'mixed');
  }
}
```

### 6.5 视觉指示

确保复选框状态有清晰的视觉指示：

- **未选中**：空框
- **选中**：勾选标记
- **部分选中**：横线或减号

### 6.6 焦点管理

为自定义复选框提供清晰的焦点样式：

```css
[role='checkbox']:focus {
  outline: 2px solid #005a9c;
  outline-offset: 2px;
}
```

## 七、Checkbox 与 Radio 的区别

| 特性     | Checkbox         | Radio               |
| -------- | ---------------- | ------------------- |
| 选择数量 | 可多选           | 单选                |
| 状态数   | 2 或 3 种        | 2 种（选中/未选中） |
| 分组方式 | 逻辑分组         | 同一 name 属性互斥  |
| 典型用途 | 多选项、权限设置 | 单选项、性别选择    |
| 键盘交互 | Space 切换       | Arrow 移动选择      |

## 八、总结

构建无障碍的复选框组件需要关注三个核心：正确的语义化标记（优先使用原生 `<input type="checkbox">`）、清晰的状态管理（`aria-checked` 属性）、以及良好的标签关联（`<label>` 元素）。对于复杂的三状态场景，需要确保总控复选框与子复选框之间的状态同步，为屏幕阅读器用户提供准确的状态反馈。

遵循 [W3C Checkbox Pattern][0] 规范，我们能够创建既美观又包容的复选框组件，为不同能力的用户提供一致的体验。

文章同步于 an-Onion 的 [Github][1]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
[1]: https://github.com/an-Onion/an-Onion.github.io
[2]: https://www.w3.org/TR/wai-aria-1.2/#checkbox
[3]: https://www.w3.org/TR/wai-aria-1.2/#aria-checked
[4]: https://www.w3.org/TR/wai-aria-1.2/#group
[5]: https://www.w3.org/TR/wai-aria-1.2/#aria-labelledby
[6]: https://www.w3.org/TR/wai-aria-1.2/#aria-describedby
