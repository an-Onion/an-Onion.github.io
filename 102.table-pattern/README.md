# Table Pattern 详解：构建无障碍的数据表格

Table（表格）是一种静态的表格结构，用于展示行列数据。本文基于 [W3C WAI-ARIA Table Pattern][0] 规范，详解如何构建无障碍的数据表格。

> **重要提示**：与其他具有原生 HTML 等效元素的 WAI-ARIA 角色一样，强烈建议尽可能使用原生 HTML `<table>` 元素。这一点对于 `role="table"` 尤为重要，因为它是 WAI-ARIA 1.1 的新特性，建议在所有目标受众可能使用的浏览器和辅助技术组合中进行充分测试。

## 一、Table 的定义与核心概念

### 1.1 什么是 Table

Table 是一种**静态的表格结构**，具有以下特征：

- 包含一个或多个**行（row）**
- 每行包含一个或多个**单元格（cell）**
- **不是交互式组件**，单元格不可聚焦或选择
- 用于**展示信息**，而非交互操作
- 如果表格需要支持选择、编辑等交互，应使用 [Grid Pattern][5]

### 1.2 核心术语

| 术语                | 说明                         |
| ------------------- | ---------------------------- |
| **Table Container** | 表格容器，包含所有行和单元格 |
| **Row**             | 表格行，包含一个或多个单元格 |
| **Cell**            | 表格单元格，包含数据内容     |
| **Columnheader**    | 列标题单元格                 |
| **Rowheader**       | 行标题单元格                 |

```plain
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │  ┌────────────┬────────────┬────────────┐           │    │
│  │  │  Name      │  Age       │  City      │           │    │
│  │  │  (column   │  (column   │  (column   │           │    │
│  │  │   header)  │   header)  │   header)  │           │    │
│  │  ├────────────┼────────────┼────────────┤           │    │
│  │  │  Alice     │  25        │  Beijing   │           │    │
│  │  │  (cell)    │  (cell)    │  (cell)    │           │    │
│  │  ├────────────┼────────────┼────────────┤           │    │
│  │  │  Bob       │  30        │  Shanghai  │           │    │
│  │  │  (cell)    │  (cell)    │  (cell)    │           │    │
│  │  └────────────┴────────────┴────────────┘           │    │
│  │                                                     │    │
│  │  role="table"                                       │    │
│  │  aria-label="User Information"                      │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Table vs Grid 的区别

| 特性         | Table                         | Grid                          |
| ------------ | ----------------------------- | ----------------------------- |
| **交互性**   | 静态展示                      | 支持交互（选择、编辑等）      |
| **焦点**     | 单元格不可聚焦                | 单元格可聚焦                  |
| **Tab 序列** | 每个内部组件独立参与 Tab 序列 | 作为复合组件统一参与 Tab 序列 |
| **适用场景** | 纯数据展示                    | 需要交互的表格                |
| **键盘交互** | 无                            | 方向键导航、Enter 编辑等      |

> **建议**：如果表格中包含大量交互组件（如按钮、链接），使用 Grid 可以显著减少页面 Tab 序列的长度。

## 二、WAI-ARIA 角色与属性

### 2.1 基本角色

Table 使用以下角色构建表格结构：

| 角色                       | 说明         | 对应 HTML                       |
| -------------------------- | ------------ | ------------------------------- |
| [`role="table"`][2]        | 表格容器     | `<table>`                       |
| [`role="row"`][6]          | 表格行       | `<tr>`                          |
| [`role="columnheader"`][7] | 列标题单元格 | `<th scope="col">`              |
| [`role="rowheader"`][8]    | 行标题单元格 | `<th scope="row">`              |
| [`role="cell"`][9]         | 数据单元格   | `<td>`                          |
| [`role="rowgroup"`][10]    | 行分组       | `<thead>`, `<tbody>`, `<tfoot>` |

### 2.2 基础示例

```html
<!-- 使用原生 HTML（推荐） -->
<table aria-label="用户信息">
  <thead>
    <tr>
      <th scope="col">姓名</th>
      <th scope="col">年龄</th>
      <th scope="col">城市</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Alice</th>
      <td>25</td>
      <td>北京</td>
    </tr>
    <tr>
      <th scope="row">Bob</th>
      <td>30</td>
      <td>上海</td>
    </tr>
  </tbody>
</table>
```

```html
<!-- 使用 ARIA 角色 -->
<div
  role="table"
  aria-label="用户信息">
  <div role="rowgroup">
    <div role="row">
      <div role="columnheader">姓名</div>
      <div role="columnheader">年龄</div>
      <div role="columnheader">城市</div>
    </div>
  </div>
  <div role="rowgroup">
    <div role="row">
      <div role="rowheader">Alice</div>
      <div role="cell">25</div>
      <div role="cell">北京</div>
    </div>
    <div role="row">
      <div role="rowheader">Bob</div>
      <div role="cell">30</div>
      <div role="cell">上海</div>
    </div>
  </div>
</div>
```

### 2.3 必需属性

| 属性                                                                      | 说明         |
| ------------------------------------------------------------------------- | ------------ |
| [`role="table"`][2]                                                       | 标记表格容器 |
| [`role="row"`][6]                                                         | 标记表格行   |
| [`role="columnheader"`][7] / [`role="rowheader"`][8] / [`role="cell"`][9] | 标记单元格   |

### 2.4 可选属性

以下属性根据使用场景应用于不同角色：

| 属性                                       | 应用于                                                     | 说明     | 示例值                            |
| ------------------------------------------ | ---------------------------------------------------------- | -------- | --------------------------------- |
| [`aria-label`][3] / [`aria-labelledby`][4] | `role="table"`                                             | 表格标签 | "用户信息"                        |
| [`aria-describedby`][11]                   | `role="table"`                                             | 表格描述 | "table-desc"                      |
| [`aria-sort`][12]                          | `role="columnheader"` / `role="rowheader"`                 | 排序状态 | "ascending", "descending", "none" |
| [`aria-colcount`][13]                      | `role="table"`                                             | 总列数   | "5"                               |
| [`aria-rowcount`][14]                      | `role="table"`                                             | 总行数   | "100"                             |
| [`aria-colindex`][15]                      | `role="cell"` / `role="columnheader"` / `role="rowheader"` | 列位置   | "3"                               |
| [`aria-rowindex`][16]                      | `role="cell"` / `role="columnheader"` / `role="rowheader"` | 行位置   | "5"                               |
| [`aria-colspan`][17]                       | `role="cell"` / `role="columnheader"` / `role="rowheader"` | 跨列数   | "2"                               |
| [`aria-rowspan`][18]                       | `role="cell"` / `role="columnheader"` / `role="rowheader"` | 跨行数   | "3"                               |

## 三、实现方式

### 3.1 基础表格结构

```html
<table aria-label="销售数据">
  <caption>
    2024年第一季度销售数据
  </caption>
  <thead>
    <tr>
      <th scope="col">产品</th>
      <th scope="col">一月</th>
      <th scope="col">二月</th>
      <th scope="col">三月</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">产品 A</th>
      <td>120</td>
      <td>150</td>
      <td>180</td>
    </tr>
    <tr>
      <th scope="row">产品 B</th>
      <td>90</td>
      <td>110</td>
      <td>130</td>
    </tr>
  </tbody>
</table>
```

### 3.2 可排序表格

```html
<table aria-label="用户列表">
  <thead>
    <tr>
      <th
        scope="col"
        aria-sort="ascending">
        <button>姓名</button>
      </th>
      <th
        scope="col"
        aria-sort="none">
        <button>年龄</button>
      </th>
      <th
        scope="col"
        aria-sort="none">
        <button>城市</button>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Alice</th>
      <td>25</td>
      <td>北京</td>
    </tr>
    <tr>
      <th scope="row">Bob</th>
      <td>30</td>
      <td>上海</td>
    </tr>
  </tbody>
</table>
```

```javascript
class SortableTable {
  constructor(tableElement) {
    this.table = tableElement;
    this.headers = this.table.querySelectorAll('th[aria-sort]');
    this.init();
  }

  init() {
    this.headers.forEach((header) => {
      const button = header.querySelector('button');
      if (button) {
        button.addEventListener('click', () => this.handleSort(header));
      }
    });
  }

  handleSort(clickedHeader) {
    const currentSort = clickedHeader.getAttribute('aria-sort');

    // 重置所有表头的排序状态
    this.headers.forEach((header) => {
      header.setAttribute('aria-sort', 'none');
    });

    // 设置新的排序状态
    const newSort = currentSort === 'ascending' ? 'descending' : 'ascending';
    clickedHeader.setAttribute('aria-sort', newSort);

    // 执行排序逻辑
    this.sortRows(clickedHeader, newSort);
  }

  sortRows(header, sortOrder) {
    const tbody = this.table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const columnIndex = Array.from(header.parentNode.children).indexOf(header);

    rows.sort((a, b) => {
      const aValue = a.children[columnIndex].textContent.trim();
      const bValue = b.children[columnIndex].textContent.trim();

      if (sortOrder === 'ascending') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    // 重新排列行
    rows.forEach((row) => tbody.appendChild(row));
  }
}

// 初始化
const table = document.querySelector('table[aria-label="用户列表"]');
new SortableTable(table);
```

### 3.3 使用 ARIA 角色的自定义表格

```html
<div
  role="table"
  aria-label="产品列表"
  aria-describedby="table-desc">
  <div id="table-desc">以下表格展示了所有可用的产品信息</div>

  <div role="rowgroup">
    <div role="row">
      <div role="columnheader">产品名称</div>
      <div role="columnheader">价格</div>
      <div role="columnheader">库存</div>
    </div>
  </div>

  <div role="rowgroup">
    <div role="row">
      <div role="cell">笔记本电脑</div>
      <div role="cell">¥5999</div>
      <div role="cell">50</div>
    </div>
    <div role="row">
      <div role="cell">无线鼠标</div>
      <div role="cell">¥99</div>
      <div role="cell">200</div>
    </div>
  </div>
</div>
```

### 3.4 复杂表格（带行列跨度）

```html
<table aria-label="课程表">
  <thead>
    <tr>
      <th scope="col">时间</th>
      <th scope="col">周一</th>
      <th scope="col">周二</th>
      <th scope="col">周三</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">上午</th>
      <td>数学</td>
      <td rowspan="2">英语</td>
      <td>物理</td>
    </tr>
    <tr>
      <th scope="row">下午</th>
      <td>化学</td>
      <td>生物</td>
    </tr>
  </tbody>
</table>
```

使用 ARIA 属性实现：

```html
<div
  role="table"
  aria-label="课程表">
  <div role="rowgroup">
    <div role="row">
      <div role="columnheader">时间</div>
      <div role="columnheader">周一</div>
      <div role="columnheader">周二</div>
      <div role="columnheader">周三</div>
    </div>
  </div>
  <div role="rowgroup">
    <div role="row">
      <div role="rowheader">上午</div>
      <div role="cell">数学</div>
      <div
        role="cell"
        aria-rowspan="2">
        英语
      </div>
      <div role="cell">物理</div>
    </div>
    <div role="row">
      <div role="rowheader">下午</div>
      <div role="cell">化学</div>
      <div role="cell">生物</div>
    </div>
  </div>
</div>
```

## 四、最佳实践

### 4.1 优先使用原生 HTML

始终优先使用原生 HTML `<table>` 元素，而不是 ARIA 角色：

```html
<!-- 推荐 -->
<table>
  <tr>
    <th>标题</th>
  </tr>
  <tr>
    <td>数据</td>
  </tr>
</table>

<!-- 不推荐 -->
<div role="table">
  <div role="row"><div role="columnheader">标题</div></div>
  <div role="row"><div role="cell">数据</div></div>
</div>
```

### 4.2 提供表格标题

为表格提供标题的两种方式：

**方式一：原生 HTML table + caption（推荐）**

```html
<table>
  <caption>
    2024年第一季度销售数据
  </caption>
  <thead>
    <tr>
      <th scope="col">产品</th>
      <th scope="col">销量</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>产品 A</td>
      <td>120</td>
    </tr>
  </tbody>
</table>
```

**方式二：自定义表格 + aria-labelledby**

```html
<h3 id="sales-heading">2024年第一季度销售数据</h3>
<div
  role="table"
  aria-labelledby="sales-heading">
  <div role="rowgroup">
    <div role="row">
      <div role="columnheader">产品</div>
      <div role="columnheader">销量</div>
    </div>
  </div>
  <div role="rowgroup">
    <div role="row">
      <div role="cell">产品 A</div>
      <div role="cell">120</div>
    </div>
  </div>
</div>
```

### 4.3 正确使用 scope 属性

使用 `scope` 属性明确标题与数据单元格的关联：

```html
<table>
  <thead>
    <tr>
      <th scope="col">姓名</th>
      <th scope="col">年龄</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Alice</th>
      <td>25</td>
    </tr>
  </tbody>
</table>
```

### 4.4 处理大量数据

对于包含大量交互组件的表格，考虑使用 Grid 模式：

```html
<!-- 如果每行都有多个按钮，Tab 序列会很长 -->
<table>
  <tr>
    <td>数据</td>
    <td><button>编辑</button><button>删除</button></td>
  </tr>
</table>

<!-- 使用 Grid 减少 Tab 序列长度 -->
<div role="grid">
  <div role="row">
    <div role="gridcell">数据</div>
    <div role="gridcell"><button>编辑</button><button>删除</button></div>
  </div>
</div>
```

### 4.5 响应式设计

对于小屏幕设备，考虑使用水平滚动或卡片布局：

```html
<div
  class="table-container"
  style="overflow-x: auto;">
  <table aria-label="响应式表格">
    ...
  </table>
</div>
```

## 五、常见错误

### 5.1 使用表格进行布局

```html
<!-- 错误：使用表格进行页面布局 -->
<table>
  <tr>
    <td>导航</td>
    <td>内容</td>
  </tr>
</table>

<!-- 正确：使用 CSS 布局 -->
<div class="layout">
  <nav>导航</nav>
  <main>内容</main>
</div>
```

### 5.2 缺少标题或标签

```html
<!-- 错误：没有标题 -->
<table>
  <tr>
    <th>姓名</th>
  </tr>
</table>

<!-- 正确：添加标题 -->
<table aria-label="用户信息">
  <tr>
    <th>姓名</th>
  </tr>
</table>
```

### 5.3 混淆 Table 和 Grid

```html
<!-- 错误：对需要交互的表格使用 Table -->
<table>
  <tr>
    <td><input type="checkbox" /></td>
    <td><button>编辑</button></td>
  </tr>
</table>

<!-- 正确：使用 Grid -->
<div role="grid">
  <div role="row">
    <div role="gridcell"><input type="checkbox" /></div>
    <div role="gridcell"><button>编辑</button></div>
  </div>
</div>
```

### 5.4 错误的 ARIA 角色嵌套

```html
<!-- 错误：row 不在 table 内 -->
<div role="row">
  <div role="cell">数据</div>
</div>

<!-- 正确：row 在 table 内 -->
<div role="table">
  <div role="row">
    <div role="cell">数据</div>
  </div>
</div>
```

## 六、Table vs 其他组件

### 6.1 Table vs Grid

| 特性         | Table            | Grid                 |
| ------------ | ---------------- | -------------------- |
| **交互性**   | 静态展示         | 支持交互             |
| **焦点管理** | 无               | 方向键导航           |
| **Tab 序列** | 内部组件独立参与 | 作为复合组件统一参与 |
| **适用场景** | 纯数据展示       | 可编辑、可选择的数据 |

### 6.2 Table vs List

| 特性         | Table            | List         |
| ------------ | ---------------- | ------------ |
| **结构**     | 二维（行列）     | 一维         |
| **关系**     | 单元格之间有关系 | 项目之间独立 |
| **适用场景** | 结构化数据       | 简单列表     |

## 七、总结

构建无障碍的 Table 组件需要关注：

1. **优先使用原生 HTML**：尽可能使用 `<table>` 元素
2. **提供标题**：使用 `<caption>` 或 `aria-label`
3. **正确使用 scope**：明确标题与数据的关联
4. **区分 Table 和 Grid**：根据交互需求选择合适模式
5. **避免布局表格**：使用 CSS 进行页面布局
6. **处理排序**：使用 `aria-sort` 指示排序状态
7. **支持响应式**：确保在小屏幕上可用

遵循 [W3C Table Pattern][0] 规范，我们能够创建既实用又无障碍的数据表格，为所有用户提供清晰的数据展示。

文章同步于 an-Onion 的 [Github][1]。码字不易，欢迎点赞。

[0]: https://www.w3.org/WAI/ARIA/apg/patterns/table/
[1]: https://github.com/an-Onion/an-Onion.github.io
[2]: https://www.w3.org/TR/wai-aria-1.2/#table
[3]: https://www.w3.org/TR/wai-aria-1.2/#aria-label
[4]: https://www.w3.org/TR/wai-aria-1.2/#aria-labelledby
[5]: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
[6]: https://www.w3.org/TR/wai-aria-1.2/#row
[7]: https://www.w3.org/TR/wai-aria-1.2/#columnheader
[8]: https://www.w3.org/TR/wai-aria-1.2/#rowheader
[9]: https://www.w3.org/TR/wai-aria-1.2/#cell
[10]: https://www.w3.org/TR/wai-aria-1.2/#rowgroup
[11]: https://www.w3.org/TR/wai-aria-1.2/#aria-describedby
[12]: https://www.w3.org/TR/wai-aria-1.2/#aria-sort
[13]: https://www.w3.org/TR/wai-aria-1.2/#aria-colcount
[14]: https://www.w3.org/TR/wai-aria-1.2/#aria-rowcount
[15]: https://www.w3.org/TR/wai-aria-1.2/#aria-colindex
[16]: https://www.w3.org/TR/wai-aria-1.2/#aria-rowindex
[17]: https://www.w3.org/TR/wai-aria-1.2/#aria-colspan
[18]: https://www.w3.org/TR/wai-aria-1.2/#aria-rowspan
