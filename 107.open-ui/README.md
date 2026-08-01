# Agentic 前端开发之 Open UI —— 让 AI 的 DSL 流变成可交互的 UI

> 本文是 **Agentic 前端开发** 系列的第二篇。如果你还没看过第一篇 [Stream & SSE 101](../106.stream-sse/README.md)，建议先了解一下 Stream + SSE 的基础知识，本文会直接复用其中的流式传输方案。

## 前言

上一篇我们搞定了 AI Agent 终端输出的流式接收——用 SSE 把 Claude Code 的输出一行一行推到前端，再用 xterm.js 渲染成终端效果。

但现实场景里，AI 返回的不只是纯文本。很多时候，AI Agent 会返回一段 **结构化的 DSL（Domain Specific Language）**——比如一段描述 UI 布局的代码。这时候问题来了：

> 前端怎么一边接收 DSL 流，一边实时渲染出可交互的 UI？

这就是 [Open UI](https://github.com/wandb/openui) 要解决的问题。

## Open UI 是什么

Open UI 的核心理念很简单：**让 LLM 输出一种紧凑的声明式 DSL，前端 Renderer 实时解析并渲染成可交互的 UI**。

它和传统方案的区别在于：

```plain
传统方案：  LLM 输出 JSON ──> 前端解析 JSON ──> 映射组件 ──> 渲染
Open UI：   LLM 输出 DSL 流 ──> Renderer 增量解析 ──> 渐进式渲染（边收边渲染）
```

### 为什么不用 JSON

JSON 本身是冗余的——大量的花括号、引号、key 名。一个简单表格的 JSON 描述可能要 300+ tokens，而用 DSL 只需要 150 tokens。Open UI 的基准测试显示，DSL 格式比 JSON 格式 **节省约 50% 的 token**。

```plain
// JSON 方式（冗余）
{
  "type": "Stack",
  "direction": "column",
  "children": [
    {
      "type": "CardHeader",
      "props": { "title": "Tickets" }
    },
    {
      "type": "Table",
      "props": {
        "columns": ["Title", "Priority"],
        "data": "$tickets.rows"
      }
    }
  ]
}

// DSL 方式（紧凑）
root = Stack([
  CardHeader("Tickets"),
  Table(["Title", "Priority"], $tickets.rows)
])
```

同样的 UI，DSL 只需要 JSON 一半的 token。在 AI Agent 场景下，token 就是钱，省一半就是省一半。

### 生成与执行分离

Open UI 的另一个关键设计：**LLM 只负责生成 UI 描述，生成完成后 UI 独立运行**。

```plain
传统 AI UI：  用户点击 ──> LLM 重新处理 ──> 重新生成 UI ──> 渲染（每次交互都消耗 token）
Open UI：     用户点击 ──> Renderer 直接执行 ──> 即时响应（零 LLM 开销）
```

LLM 生成的是"接线图"——哪些数据绑定到哪些组件、哪些按钮触发哪些操作。生成完成后，这些接线由 Renderer 直接执行，不再需要 LLM 参与。

## 架构设计

下面用点线图展示整个 Open UI 流式集成的架构：

```plain
┌───────────────────────────────────────────────────────────────────────────┐
│                               Browser                                     │
│                                                                           │
│  ┌───────────────┐   POST /api/ui/generate   ┌─────────────────────────┐ │
│  │  User Input   │ ─────────────────────────► │ fetch + Readable        │ │
│  │  (prompt)     │                            │ Stream (SSE parser)     │ │
│  └───────────────┘                            └───────────┬─────────────┘ │
│                                                           │               │
│                              HTTP (SSE)                   │               │
│                                                           ▼               │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                       Open UI Renderer                              │  │
│  │                                                                     │  │
│  │  ┌──────────────┐   ┌───────────────┐   ┌───────────────────────┐ │  │
│  │  │  DSL Parser  │──►│  Component    │──►│  Live Preview         │ │  │
│  │  │ (incremental)│   │  Mapper       │   │  (reactive)           │ │  │
│  │  └──────────────┘   └───────────────┘   └───────────────────────┘ │  │
│  │         ▲                                          │               │  │
│  │         │                                          │               │  │
│  │  ┌──────┴──────────────────────────────────────────┐               │  │
│  │  │  Tool Provider                                  │               │  │
│  │  │  - Function Map / MCP Client                    │◄──────────────┘  │
│  │  │  - API calls, DB queries, etc.                  │                  │
│  │  └─────────────────────────────────────────────────┘                  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────┬──────────────────────────────────┘
                                           │ HTTP (SSE)
                                           │ Content-Type: text/event-stream
                                           ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                       Backend Server (Node.js)                            │
│                                                                           │
│  ┌───────────────────┐    OpenAI / Claude API    ┌─────────────────────┐ │
│  │  SSE Route Handler│ ────────────────────────► │  LLM Service        │ │
│  │  Set SSE headers  │                           │  GPT / Claude       │ │
│  │  Stream DSL chunks│ ◄──── stream chunks       │  / Gemini           │ │
│  └───────────────────┘                           └─────────────────────┘ │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  System Prompt Builder                                              │  │
│  │  - Component Library Spec                                           │  │
│  │  - Tool Definitions                                                 │  │
│  │  - DSL Grammar Rules                                                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

数据流向：

1. 用户在前端输入自然语言描述（如"创建一个工单追踪页面"）
2. 后端构建 system prompt（包含组件库定义 + 工具描述），调用 LLM
3. LLM 流式返回 DSL 代码，后端通过 SSE 逐 chunk 推送
4. 前端 Renderer 增量解析 DSL，实时渲染 UI
5. 渲染完成后，UI 独立运行——用户交互直接通过 Tool Provider 调用后端 API

## DSL 长什么样

来看一个实际的例子——LLM 生成的工单追踪器 DSL：

```plain
$title = ""
$priority = "medium"

tickets = Query("list_tickets", {}, {rows: []})
createResult = Mutation("create_ticket", {title: $title, priority: $priority})

submitBtn = Button("Create", Action([
  @Run(createResult),
  @Run(tickets),
  @Reset($title, $priority)
]))

form = Form("create", submitBtn, [
  FormControl("Title", Input("title", $title)),
  FormControl("Priority", Select("priority", $priority, [
    SelectItem("low", "Low"),
    SelectItem("medium", "Medium"),
    SelectItem("high", "High")
  ]))
])

tbl = Table([
  Col("Title", tickets.rows.title),
  Col("Priority", tickets.rows.priority)
])

root = Stack([
  CardHeader("Ticket Tracker"),
  form,
  tbl
])
```

就这么几行，描述了一个带表单和表格的完整页面。Renderer 解析后会自动：

- `Query("list_tickets")` → 调用你的工具函数获取数据 → 表格填充
- 用户点击"Create" → `@Run(createResult)` → 调用创建 API
- 创建完成 → `@Run(tickets)` → 自动刷新表格
- `@Reset($title, $priority)` → 表单清空

**全程不需要 LLM 参与。**

## 后端实现

### 1. 构建 System Prompt

后端需要先构建一个 system prompt，告诉 LLM 用 DSL 格式输出 UI 描述。这个 prompt 需要包含三部分：

1. **组件库定义**：告诉 LLM 有哪些组件可用
2. **工具定义**：告诉 LLM 有哪些 API 可以调用
3. **DSL 语法规则**：告诉 LLM 怎么描述 UI

```javascript
// prompt-builder.js

// 组件库定义（告诉 LLM 有哪些组件可用）
const componentSpec = {
  components: {
    Stack: {
      props: { direction: 'enum(row,column)', gap: 'number' },
      children: 'any',
    },
    CardHeader: {
      props: { title: 'string' },
    },
    Button: {
      props: { label: 'string', onClick: 'action' },
    },
    Table: {
      props: { columns: 'array' },
      children: 'data-binding',
    },
    Input: {
      props: { name: 'string', value: 'binding' },
    },
    Select: {
      props: { name: 'string', value: 'binding' },
      children: 'SelectItem[]',
    },
    // ... 更多组件
  },
};

// 工具定义（告诉 LLM 有哪些 API 可以调用）
const tools = [
  {
    name: 'list_tickets',
    description: '获取所有工单列表',
    inputSchema: { type: 'object', properties: {} },
    outputSchema: {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              priority: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
      },
    },
  },
  {
    name: 'create_ticket',
    description: '创建新工单',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        priority: { type: 'string' },
      },
    },
  },
];

export function buildSystemPrompt() {
  return `You are a UI generator. Output openui-lang DSL code.

## Available Components
${JSON.stringify(componentSpec.components, null, 2)}

## Available Tools
${JSON.stringify(tools, null, 2)}

## DSL Syntax Rules
- Use $ prefix for variables: $title, $priority
- Use Query("tool_name") to fetch data
- Use Mutation("tool_name", {args}) for write operations
- Use @Run(action) to trigger actions on events
- Use @Reset($var) to reset variables
- The root component must be assigned to "root"

## Example
root = Stack([
  CardHeader("My Page"),
  Button("Click Me", Action([@Run(myMutation)]))
])`;
}
```

### 2. SSE 流式推送 DSL

复用第一篇的方案，后端通过 SSE 把 LLM 的流式输出推给前端：

```javascript
// server.js
import express from 'express';
import OpenAI from 'openai';
import { buildSystemPrompt } from './prompt-builder.js';

const app = express();
app.use(express.json());

const openai = new OpenAI();

app.post('/api/ui/generate', async (req, res) => {
  // SSE 响应头（和第一篇一样）
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 心跳保活
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  const systemPrompt = buildSystemPrompt();
  const userPrompt = req.body.prompt;

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        // 每个 chunk 就是一段 DSL 片段
        res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

// 工具函数 API（供前端 Tool Provider 调用）
app.get('/api/tickets', async (req, res) => {
  const tickets = await db.query('SELECT * FROM tickets');
  res.json({ rows: tickets });
});

app.post('/api/tickets', async (req, res) => {
  const { title, priority } = req.body;
  await db.query('INSERT INTO tickets (title, priority) VALUES ($1, $2)', [
    title,
    priority,
  ]);
  res.json({ success: true });
});

app.listen(3000);
```

### 3. 增量编辑

Open UI 支持增量编辑——用户说"加个饼图"，LLM 只输出变更的 2~3 行，而不是重新生成整个 UI：

```plain
Turn 1（完整生成）:           Turn 2（增量补丁）:
root = Stack([header, tbl])   root = Stack([header, chart, tbl]) ← 只改了这行
header = CardHeader("Tickets") chart = PieChart(["Open","Closed"], ← 新增
tickets = Query(...)           [@Count(@Filter(..., "open")),
tbl = Table([...])             @Count(@Filter(..., "closed"))
                              ], "donut")

20 lines, ~400 tokens          3 lines, ~60 tokens（节省 85%）
```

后端实现增量编辑只需要把当前 DSL 作为上下文传给 LLM：

```javascript
app.post('/api/ui/edit', async (req, res) => {
  const { currentDsl, editInstruction } = req.body;

  // SSE 响应头（同上）
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const systemPrompt = buildSystemPrompt();
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: `Current UI code:\n${currentDsl}` },
      {
        role: 'user',
        content: `Only output the changed lines. Instruction: ${editInstruction}`,
      },
    ],
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      res.write(
        `data: ${JSON.stringify({ chunk: content, incremental: true })}\n\n`,
      );
    }
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});
```

## 前端实现

### 1. 接收 SSE 流

复用第一篇的 `fetch + ReadableStream` 方案：

```javascript
// useOpenUIStream.js
import { useState, useCallback, useRef } from 'react';

export function useOpenUIStream() {
  const [dsl, setDsl] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const generate = useCallback(async (prompt) => {
    setIsStreaming(true);
    setDsl('');
    setError(null);

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/ui/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: abortRef.current.signal,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop();

        for (const event of events) {
          const match = event.match(/^data:\s*(.*)$/m);
          if (!match) continue;

          const data = JSON.parse(match[1]);
          if (data.done) {
            setIsStreaming(false);
            return;
          }
          if (data.error) {
            setError(data.error);
            setIsStreaming(false);
            return;
          }

          // 累积 DSL 片段
          accumulated += data.chunk;
          setDsl(accumulated); // 每次更新触发 Renderer 增量解析
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { dsl, isStreaming, error, generate, cancel };
}
```

### 2. 用 Renderer 渲染

Renderer 是 Open UI 的核心——它接收 DSL 文本，解析成 AST，然后映射到实际的 React 组件：

```jsx
// UIGenerator.jsx
import { Renderer } from '@openui/react';
import { library } from './component-library';
import { useOpenUIStream } from './useOpenUIStream';

export default function UIGenerator() {
  const { dsl, isStreaming, error, generate, cancel } = useOpenUIStream();

  // Tool Provider：告诉 Renderer 怎么调用你的后端 API
  const toolProvider = {
    list_tickets: async () => {
      const res = await fetch('/api/tickets');
      return res.json();
    },
    create_ticket: async (args) => {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      return res.json();
    },
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 左侧：输入区 */}
      <div style={{ width: 300, padding: 16, borderRight: '1px solid #eee' }}>
        <h3>Open UI Generator</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const prompt = e.target.prompt.value;
            generate(prompt);
          }}>
          <textarea
            name="prompt"
            placeholder="描述你想要的 UI..."
            rows={4}
            style={{ width: '100%', marginBottom: 8 }}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={cancel}>
              停止生成
            </button>
          ) : (
            <button type="submit">生成 UI</button>
          )}
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>

      {/* 右侧：实时渲染区 */}
      <div style={{ flex: 1, padding: 16 }}>
        {dsl ? (
          <Renderer
            library={library}
            response={dsl}
            isStreaming={isStreaming}
            toolProvider={toolProvider}
          />
        ) : (
          <p style={{ color: '#999', textAlign: 'center', marginTop: 100 }}>
            输入描述，AI 将为你生成可交互的 UI
          </p>
        )}
      </div>
    </div>
  );
}
```

### 3. 组件库定义

Renderer 需要一个组件库（library）来映射 DSL 中的组件名到实际的 React 组件：

```jsx
// component-library.jsx
import { createLibrary } from '@openui/react';
import {
  Stack,
  Card,
  Button,
  Input,
  Table,
  Col,
  Form,
  FormControl,
  Select,
  SelectItem,
} from '@openui/components';

// 自定义组件
import { MyChart } from './MyChart';
import { MyCardHeader } from './MyCardHeader';

export const library = createLibrary({
  // 内置组件
  Stack,
  Card,
  Button,
  Input,
  Table,
  Col,
  Form,
  FormControl,
  Select,
  SelectItem,

  // 自定义组件
  CardHeader: MyCardHeader,
  PieChart: MyChart,
});
```

自定义组件示例：

```jsx
// MyCardHeader.jsx
export function MyCardHeader({ title }) {
  return (
    <div
      style={{
        padding: '16px 24px',
        borderBottom: '1px solid #eee',
        fontSize: 18,
        fontWeight: 600,
      }}>
      {title}
    </div>
  );
}
```

## 组件映射机制

Open UI 的核心设计是 **DSL → 组件名 → React 组件** 的三层映射：

```plain
LLM 输出的 DSL              组件名映射              实际 React 组件
─────────────              ──────────              ────────────────
Stack([...])       ──►     Stack            ──►    <Stack>...</Stack>
Button("Create")   ──►     Button           ──►    <Button>Create</Button>
Table([...])       ──►     Table            ──►    <Table>...</Table>
CardHeader("...")  ──►     CardHeader       ──►    <MyCardHeader>...</MyCardHeader>
PieChart([...])    ──►     PieChart         ──►    <MyChart>...</MyChart>
```

这意味着：

- **LLM 只输出抽象的组件名**，不关心具体实现
- **你控制组件库**，决定每个组件长什么样、用什么 UI 框架
- **换皮不换骨**——同一份 DSL，可以映射到 Tailwind 组件、Ant Design、Material UI，甚至原生 HTML

```plain
同一份 DSL:  Button("Submit", ...)

映射到 Ant Design:   <AntdButton type="primary">Submit</AntdButton>
映射到 Material UI:  <MUIButton variant="contained">Submit</MUIButton>
映射到 Tailwind:     <button className="bg-blue-500 ...">Submit</button>
```

## Tool Provider 详解

Tool Provider 是 Open UI 的另一个核心概念——它告诉 Renderer 怎么调用你的后端 API。有两种方式：

### 方式一：Function Map（简单场景）

直接传一个异步函数对象：

```javascript
<Renderer
  toolProvider={{
    list_tickets: async (args) => {
      const res = await fetch('/api/tickets');
      return res.json();
    },
    create_ticket: async (args) => {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        body: JSON.stringify(args),
      });
      return res.json();
    },
  }}
  response={dsl}
  library={library}
/>
```

### 方式二：MCP Client（复杂场景）

如果你的工具运行在服务端，可以用 MCP（Model Context Protocol）客户端：

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const client = new Client({ name: 'my-app', version: '1.0.0' });
await client.connect(new StreamableHTTPClientTransport(new URL('/api/mcp')));

<Renderer
  toolProvider={client}
  response={dsl}
  library={library}
/>;
```

### 运行时发生了什么

以工单追踪器为例，完整的运行时流程：

```plain
1. Renderer 解析到 Query("list_tickets")
   → 调用 toolProvider.list_tickets()
   → 表格填充数据

2. 用户输入标题，选择优先级，点击"Create"
   → @Run(createResult) 触发
   → 调用 toolProvider.create_ticket({title, priority})

3. @Run(tickets) 触发
   → 重新调用 toolProvider.list_tickets()
   → 表格自动刷新

4. @Reset($title, $priority) 触发
   → 表单清空

全程没有 LLM 参与，零 token 消耗。
```

## 实战案例：AI 驱动的 Dashboard

来看一个完整的例子——用自然语言生成一个带图表的数据看板：

### 1. 定义工具

```javascript
const tools = [
  {
    name: 'get_sales_data',
    description: '获取销售数据',
    inputSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['week', 'month', 'year'] },
      },
    },
  },
  {
    name: 'get_top_products',
    description: '获取热销商品排行',
    inputSchema: { type: 'object', properties: {} },
  },
];
```

### 2. 用户输入

```plain
创建一个销售看板，顶部是三个 KPI 卡片（总销售额、订单数、客单价），
中间是月度销售趋势折线图，底部是热销商品 Top 10 表格。
```

### 3. LLM 生成的 DSL

```plain
$period = "month"
sales = Query("get_sales_data", {period: $period})
products = Query("get_top_products")

$totalSales = @Sum(sales.rows, "amount")
$orderCount = @Count(sales.rows)
$avgPrice = @Div($totalSales, $orderCount)

kpiRow = Stack(direction="row", [
  Card("总销售额", $totalSales),
  Card("订单数", $orderCount),
  Card("客单价", $avgPrice),
])

chart = LineChart(sales.rows, x="month", y="amount")
tbl = Table([
  Col("商品", products.rows.name),
  Col("销量", products.rows.sales),
  Col("金额", products.rows.revenue),
])

root = Stack([
  CardHeader("销售看板"),
  kpiRow,
  chart,
  tbl,
])
```

### 4. 运行时

- `Query("get_sales_data")` → 调用 API → KPI 卡片和折线图自动填充
- `Query("get_top_products")` → 调用 API → 表格自动填充
- `@Sum`、`@Count`、`@Div` → 前端直接计算，零网络开销
- 用户切换 `$period` → 依赖的 Query 自动重新获取数据

## 踩坑记录

### 1. 流式解析的边界问题

LLM 流式输出的 chunk 可能在 DSL 语句中间断开，比如：

```plain
chunk 1: root = Stack([Card
chunk 2: Header("Tickets"), tbl])
```

Renderer 内部已经处理了这种情况——它会等待完整的语句再解析。但如果自己实现解析逻辑，需要注意 buffer 的处理。

### 2. 组件库要提前定义好

LLM 只能使用你定义在 component library 里的组件。如果 LLM 生成了一个不存在的组件名，Renderer 会忽略它。

解决方案：在 system prompt 里明确列出可用组件，并且提供足够的描述让 LLM 知道每个组件的用途和参数。

### 3. Tool Provider 的错误处理

如果工具函数调用失败（比如 API 超时），Renderer 不会自动重试。需要在工具函数里自己处理：

```javascript
const toolProvider = {
  list_tickets: async () => {
    try {
      const res = await fetch('/api/tickets', {
        signal: AbortSignal.timeout(5000), // 5秒超时
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      console.error('Tool call failed:', err);
      return { rows: [], error: err.message }; // 返回空数据 + 错误信息
    }
  },
};
```

### 4. 增量编辑的上下文管理

增量编辑时，需要把当前完整的 DSL 传给 LLM 作为上下文。如果 DSL 很长，可能会超出 token 限制。

解决方案：

- 限制 DSL 的最大行数
- 只传相关的代码片段（比如用户选中的区域）
- 用更紧凑的变量命名

### 5. 流式渲染的闪烁问题

DSL 流式输入时，Renderer 会频繁重新解析，可能导致 UI 闪烁。

解决方案：

- 用 `isStreaming={true}` 告诉 Renderer 当前在流式输入中，它会做防抖处理
- 在流式过程中显示一个半透明的遮罩，减少视觉干扰

## 性能优化

### 1. 减少 LLM 输出量

- 用增量编辑代替全量重新生成（节省 85% token）
- 在 system prompt 里要求 LLM 尽量简洁
- 组件库描述要精确，避免 LLM 输出冗余代码

### 2. 前端渲染优化

- 大型表格用虚拟滚动
- 图表数据量大时做降采样
- 用 `React.memo` 包裹自定义组件，避免不必要的重渲染

### 3. 缓存策略

- 相同的 prompt 可以缓存 LLM 的完整输出
- 组件库的 JSON Schema 可以预生成，不用每次重新构建

## 总结

| 概念              | 说明                                               |
| :---------------- | :------------------------------------------------- |
| DSL               | LLM 输出的声明式语言，描述 UI 布局、数据源和交互   |
| Renderer          | 前端组件，解析 DSL 并渲染为可交互 UI               |
| Component Library | 组件映射表，决定 DSL 中的组件名对应哪个 React 组件 |
| Tool Provider     | 工具函数映射，告诉 Renderer 怎么调用后端 API       |
| 增量编辑          | 用户说"加个图表"，LLM 只输出变更的几行             |
| 生成与执行分离    | LLM 只生成一次，之后 UI 独立运行，零 LLM 开销      |

Open UI 的核心价值：**让 AI 生成 UI 不再是"生成一段 HTML 让你看"，而是"生成一个可交互的应用"**。结合 Stream + SSE 做流式集成，用户体验可以做到"边说边看边交互"。

这是 Agentic 前端开发的一个重要方向——前端不再只是"展示层"，而是 AI Agent 的"执行层"。

---

文章同步于 an-Onion 的 [Github][0]。码字不易，欢迎点赞。

[0]: https://github.com/an-Onion/an-Onion.github.io
