# Stream & SSE 101 —— Web 端实时接收 AI Agent 终端输出

## 前言

最近在做 AI Agent 的 Web 端集成，需求很直接：用户在网页上触发一个 AI Agent（比如 Claude Code、Codex 之类的），然后像看终端一样实时看到它的输出流——一行一行地蹦出来，而不是等它跑完再一次性返回。

这个场景的核心技术就是 **Stream** 和 **SSE（Server-Sent Events）**。搞了一周多，踩了不少坑，这里做个总结。

## 为什么不是 WebSocket

一提到"实时通信"，很多人第一反应是 WebSocket。但 WebSocket 太重了——它是全双工的，意味着客户端和服务端可以同时互相发消息。对于 AI Agent 的输出场景，我们只需要**服务端单向推送**给客户端，WebSocket 大材小用了。

SSE 天然就是为这种场景设计的：

|      特性       |           SSE           |   WebSocket    |
| :-------------: | :---------------------: | :------------: |
|    通信方向     | 服务端 → 客户端（单向） |      双向      |
|      协议       |          HTTP           |     ws://      |
|    自动重连     |          内置           |   需手动实现   |
|   浏览器支持    |     所有现代浏览器      | 所有现代浏览器 |
| 代理/防火墙穿透 |     好（基于 HTTP）     |    偶尔被拦    |
|     复杂度      |           低            |       高       |

一句话总结：**只需要服务端推数据，用 SSE；需要双向通信，用 WebSocket。**

## Stream 是什么

在聊 SSE 之前，先搞清楚"Stream"这个概念。Stream 本质上是一种**数据分块传输**的模式。

传统的 HTTP 请求是"请求-响应"模式：客户端发请求，等，服务端处理完，一次性返回整个响应体。对于 AI Agent 这种动辄几十秒甚至几分钟的任务，用户体验极差——你盯着一个 loading 转圈，完全不知道它在干嘛。

Stream 的做法是：服务端不攒数据，**生成一点就发一点**。客户端收到一个 chunk 就渲染一个 chunk，就像看终端输出一样。

```plain
传统模式：  请求 ──────────────────────────────> 完整响应
Stream：   请求 ──> chunk1 ──> chunk2 ──> chunk3 ──> ... ──> [DONE]
```

### 后端的 Stream

以 Node.js 为例，后端通过 `ReadableStream` 或框架自带的 stream 能力，把数据一块一块地推出去：

```javascript
// Express 示例
app.post('/api/agent/run', async (req, res) => {
  // 关键：设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const agent = spawn('claude', ['--print', req.body.prompt]);

  agent.stdout.on('data', (chunk) => {
    // 每产出一行，就通过 SSE 格式推给客户端
    res.write(`data: ${JSON.stringify({ text: chunk.toString() })}\n\n`);
  });

  agent.on('close', () => {
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  });
});
```

注意 `res.write()` 而不是 `res.send()`——前者是流式写入，后者是一次性发送。

## SSE 协议

SSE（Server-Sent Events）是建立在 HTTP 之上的单向推送协议。它的数据格式非常简单：

```plain
data: {"text": "Hello"}

data: {"text": " World"}

data: {"done": true}

```

规则就三条：

1. 每个事件以 `data:` 开头
2. 事件内容跟在冒号后面
3. 以两个换行符 `\n\n` 结束一个事件

就这么简单。没有握手，没有帧，没有二进制——纯文本。

### 额外的 SSE 字段

除了 `data`，SSE 还支持几个可选字段：

```plain
id: 42
event: message
retry: 3000
data: {"text": "Hello"}

```

|  字段   | 作用                                   |
| :-----: | :------------------------------------- |
| `data`  | 事件数据，支持多行（每行一个 `data:`） |
| `event` | 事件类型，客户端可据此做不同处理       |
|  `id`   | 事件 ID，用于断点重连                  |
| `retry` | 重连等待时间（毫秒）                   |

## 架构设计

下面用点线图展示整个 AI Agent 流式输出的架构：

```plain
┌─────────────────────────────────────────────────────────────────────┐
│                            Browser                                  │
│                                                                     │
│  ┌───────────────┐   POST /api/agent/run   ┌──────────────────────┐ │
│  │   UI Layer    │ ───────────────────────► │ fetch + Readable    │ │
│  │ (React / Vue) │                          │ Stream (SSE parser) │ │
│  └───────────────┘                          └──────────┬──────────┘ │
│          │                                             │            │
│          │ render chunk by chunk                       │ HTTP       │
│          ▼                                             ▼            │
│  ┌───────────────┐                          ┌─────────────────────┐ │
│  │   Terminal    │ ◄─────────────────────── │ EventSource /       │ │
│  │   xterm.js    │   text: "Hello\n"        │ fetch SSE client    │ │
│  └───────────────┘   text: "World\n"        └─────────────────────┘ │
│                     done: true                                      │
└──────────────────────────────────────┬──────────────────────────────┘
                                       │ HTTP (SSE)
                                       │ Content-Type: text/event-stream
                                       ▼
┌──────────────────────────────────────┴──────────────────────────────┐
│                        Nginx / Reverse Proxy                        │
│              proxy_buffering off;  chunked_transfer_encoding on;    │
└──────────────────────────────────────┬──────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Backend Server (Node.js)                      │
│                                                                     │
│  ┌──────────────────┐    spawn / API call    ┌───────────────────┐  │
│  │ SSE Route Handler│ ─────────────────────► │ AI Agent Process  │  │
│  │ Set SSE headers  │                        │ Claude Code       │  │
│  │ Push chunk by    │ ◄─── stdout.on('data') │ Codex / Others    │  │
│  └──────────────────┘                        └───────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Session Manager                                               │  │
│  │ - Maintain each Agent session state                           │  │
│  │ - Track Last-Event-ID for resume support                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

数据流向：

1. 用户在前端发起请求（POST prompt）
2. 后端 spawn AI Agent 进程，建立 SSE 长连接
3. Agent 每产出一行输出，后端包装成 SSE 事件推送
4. 前端逐 chunk 接收，实时渲染到终端组件

## 断点续传：Last-Event-ID

SSE 有个很实用的机制——**断点续传**。当网络抖动导致连接中断时，客户端不需要从头开始，而是可以从上次断开的地方继续接收。

这就是 `Last-Event-ID` 的作用。它不是一个请求参数，而是 SSE 协议内置的自动重连机制：

### 工作原理

```plain
服务端发送：
  id: 1
  data: {"text": "Hello"}

  id: 2
  data: {"text": " World"}

  id: 3
  data: {"text": "!"}

        ── 网络断开 ──

客户端自动重连，请求头带上：
  Last-Event-ID: 3    ← 告诉服务端"我收到了 id=3"

服务端从 id=4 继续推送：
  id: 4
  data: {"text": " Done!"}
```

### 后端实现

```javascript
app.get('/api/agent/stream', (req, res) => {
  // 获取客户端上次收到的最后一个事件 ID
  const lastId = req.headers['last-event-id'];

  // SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 从断点继续推送（需要从 session 中恢复历史事件）
  const sessionId = req.query.sessionId;
  const history = sessionStore.getHistory(sessionId, lastId);

  // 先补发断点之前的事件
  for (const event of history) {
    res.write(`id: ${event.id}\ndata: ${JSON.stringify(event.data)}\n\n`);
  }

  // 然后继续接收新的 Agent 输出
  agent.stdout.on('data', (chunk) => {
    const eventId = sessionStore.nextId(sessionId);
    res.write(
      `id: ${eventId}\ndata: ${JSON.stringify({ text: chunk.toString() })}\n\n`,
    );
  });
});
```

### 前端实现

原生 `EventSource` 自动处理 `Last-Event-ID`，无需额外代码。用 `fetch + ReadableStream` 的话，需要手动实现：

```javascript
let lastEventId = null;

async function connectWithResume(sessionId) {
  const headers = { 'Content-Type': 'application/json' };
  if (lastEventId) {
    headers['Last-Event-ID'] = lastEventId; // 手动带上断点 ID
  }

  const response = await fetch(`/api/agent/stream?sessionId=${sessionId}`, {
    method: 'GET',
    headers,
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop();

    for (const event of events) {
      const idMatch = event.match(/^id:\s*(.+)$/m);
      const dataMatch = event.match(/^data:\s*(.*)$/m);
      if (idMatch) lastEventId = idMatch[1]; // 记录最新 ID
      if (dataMatch) {
        const data = JSON.parse(dataMatch[1]);
        appendToTerminal(data.text);
      }
    }
  }
}
```

> **注意**：`Last-Event-ID` 只在 `EventSource` 中自动携带。`fetch` 方式需要手动从响应中解析 `id` 字段，并在重连时加到请求头里。

## 前端怎么接收

### 方式一：EventSource（原生 API）

浏览器原生提供了 `EventSource` API，用法极简：

```javascript
const source = new EventSource('/api/agent/stream?id=123');

source.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.done) {
    console.log('Agent 执行完毕');
    source.close();
    return;
  }
  // 实时追加到终端 UI
  appendToTerminal(data.text);
};

source.onerror = (err) => {
  console.error('SSE 连接出错', err);
};
```

但 `EventSource` 有个硬伤：**只支持 GET 请求**。而 AI Agent 通常需要 POST 一个 prompt 过去，这就尴尬了。

### 方式二：fetch + ReadableStream（推荐）

对于 POST 请求的 SSE 场景，用 `fetch` 配合 `ReadableStream` 是更灵活的方案：

```javascript
async function runAgent(prompt) {
  const response = await fetch('/api/agent/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // 按 \n\n 分割 SSE 事件
    const events = buffer.split('\n\n');
    buffer = events.pop(); // 最后一段可能不完整，留到下次

    for (const event of events) {
      const match = event.match(/^data:\s*(.*)$/m);
      if (!match) continue;

      const data = JSON.parse(match[1]);
      if (data.done) {
        console.log('Agent 执行完毕');
        return;
      }
      appendToTerminal(data.text);
    }
  }
}
```

核心思路：

1. `fetch` 拿到 `response.body`（一个 `ReadableStream`）
2. 用 `getReader()` 逐块读取
3. 用 `TextDecoder` 把二进制转成文本
4. 按 `\n\n` 切分 SSE 事件，逐个解析

### 方式三：第三方库

如果不想自己解析 SSE 格式，可以用现成的库：

```bash
npm install @microsoft/fetch-event-source
```

```javascript
import { fetchEventSource } from '@microsoft/fetch-event-source';

await fetchEventSource('/api/agent/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt }),

  onmessage(ev) {
    const data = JSON.parse(ev.data);
    if (data.done) return;
    appendToTerminal(data.text);
  },

  onerror(err) {
    console.error('SSE 出错', err);
  },

  onclose() {
    console.log('连接关闭');
  },
});
```

微软这个库的好处是：支持 POST、支持自动重连、支持自定义 headers，比原生 `EventSource` 好用很多。

## 前端终端渲染

拿到流式数据后，怎么渲染成终端效果？Claude Code 的输出包含 ANSI 转义序列（颜色、光标移动、进度条等），不是纯文本，所以渲染方案的选择很关键。

### 方案一：xterm.js（推荐）

[xterm.js](https://xtermjs.org/) 是前端终端渲染的事实标准，VS Code 的内置终端就是用它做的。它完整支持 ANSI 转义序列，能 1:1 还原 Claude Code 的终端输出效果。

```bash
npm install xterm @xterm/addon-fit @xterm/addon-web-links
```

```javascript
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import 'xterm/css/xterm.css';

const term = new Terminal({
  theme: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    cursor: '#d4d4d4',
  },
  fontSize: 14,
  fontFamily: "'Fira Code', 'Menlo', monospace",
  cursorBlink: true,
  scrollback: 10000,
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.loadAddon(new WebLinksAddon()); // 自动识别链接
term.open(document.getElementById('terminal'));
fitAddon.fit();

// 接收 SSE 数据，直接写入终端
function onSSEMessage(data) {
  if (data.done) {
    term.writeln('\r\n\x1b[32m✓ Agent 执行完毕\x1b[0m');
    return;
  }
  // xterm.js 原生支持 ANSI 转义序列，直接 write 即可
  term.write(data.text);
}
```

优点：

- 完整支持 ANSI 颜色、光标移动、清屏等
- 支持选中文本、复制粘贴
- 性能优秀，大量输出不卡顿
- 社区活跃，插件丰富

### 方案二：ansi_up（轻量方案）

如果不想引入完整的终端模拟器，[ansi_up](https://github.com/drudru/ansi_up) 可以把 ANSI 转义序列转成 HTML，用普通 DOM 渲染：

```bash
npm install ansi_up
```

```javascript
import AnsiUp from 'ansi_up';

const ansiUp = new AnsiUp();
const output = document.getElementById('output');

function appendToTerminal(text) {
  const html = ansiUp.ansi_to_html(text);
  output.innerHTML += html;
  output.scrollTop = output.scrollHeight;
}
```

优点：轻量（~10KB），适合只需要颜色渲染的简单场景。
缺点：不支持光标移动、进度条覆盖等复杂 ANSI 操作。

### 方案对比

| 特性            |   xterm.js   |   ansi_up    | 纯 `<pre>` |
| :-------------- | :----------: | :----------: | :--------: |
| ANSI 颜色       |      ✅      |      ✅      |     ❌     |
| 光标移动 / 清屏 |      ✅      |      ❌      |     ❌     |
| 进度条覆盖刷新  |      ✅      |      ❌      |     ❌     |
| 文本选中复制    |      ✅      |      ✅      |     ✅     |
| 包体积          |    ~200KB    |    ~10KB     |     0      |
| 适用场景        | 完整终端体验 | 简单彩色输出 |   纯文本   |

> **结论**：渲染 Claude Code 输出，首选 xterm.js。它的 ANSI 兼容性最好，能完整还原终端体验。如果只是展示简单的彩色日志，ansi_up 够用。

### 方案三：流式 Markdown 渲染（适用于对话式 AI 输出）

Claude Code 的输出除了终端流，很多时候也包含 Markdown 格式的内容（代码块、文件 diff、列表等）。如果前端不是做纯终端展示，而是类似 ChatGPT 的对话式 UI，就需要一个能处理流式 Markdown 的渲染器。

传统的 `react-markdown` 无法处理 AI 流式输出中的未闭合代码块、不完整的表格等问题——而 [**Streamdown**](https://github.com/vercel/streamdown)（Vercel 出品，5k+ stars）就是专门解决这个痛点的：

```bash
npm install streamdown @streamdown/code @streamdown/math @streamdown/mermaid @streamdown/cjk
```

```jsx
import { useChat } from '@ai-sdk/react';
import { Streamdown } from 'streamdown';
import { code } from '@streamdown/code';
import { mermaid } from '@streamdown/mermaid';
import { math } from '@streamdown/math';
import { cjk } from '@streamdown/cjk';
import 'katex/dist/katex.min.css';
import 'streamdown/styles.css';

export default function Chat() {
  const { messages, status } = useChat();

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts.map((part, index) =>
            part.type === 'text' ? (
              <Streamdown
                key={index}
                plugins={{ code, mermaid, math, cjk }}
                isAnimating={status === 'streaming'}>
                {part.text}
              </Streamdown>
            ) : null,
          )}
        </div>
      ))}
    </div>
  );
}
```

Streamdown 的核心优势：

- 专为 AI 流式输出设计，优雅处理未闭合的 Markdown 块
- 内置 Shiki 代码高亮、KaTeX 数学公式、Mermaid 图表
- 支持 CJK 排版优化
- 插件化架构，按需引入，tree-shakeable
- 内置安全加固（rehype-harden），防止 XSS

**Vue 生态：** 可以使用 [vue3-streamdown](https://www.npmjs.com/package/vue3-streamdown)，是 Streamdown 的 Vue 3 移植版，API 基本一致。

**代码高亮库对比（Streamdown 内置 Shiki，以下为独立使用场景参考）：**

| 库                               | 包体积 | 语言支持 | 特点                           |
| :------------------------------- | :----: | :------: | :----------------------------- |
| [Shiki](https://shiki.style/)    | ~500KB |   100+   | VS Code 同款语法高亮，效果最好 |
| [Prism.js](https://prismjs.com/) | ~20KB  |   270+   | 轻量，插件丰富                 |

### 常用 UI 组件总结

| 场景           | 推荐方案                                                                   | 代表项目                      |
| :------------- | :------------------------------------------------------------------------- | :---------------------------- |
| 完整终端体验   | [xterm.js](https://github.com/xtermjs/xterm.js)（14k stars）               | VS Code 终端、Claude Code Web |
| 简单彩色日志   | [ansi_up](https://github.com/drudru/ansi_up)                               | 轻量级日志面板                |
| 对话式 AI 输出 | [Streamdown](https://github.com/vercel/streamdown)（5k+ stars）            | ChatGPT、Claude Web           |
| 文件 diff 展示 | [react-diff-viewer](https://github.com/Aeolun/react-diff-viewer-continued) | GitHub PR、Code Review 工具   |
| 思维导图       | [react-markmap](https://markmap.js.org/)                                   | 实时思维导图预览              |

## 保持长连接：心跳保活

SSE 本质是一个 HTTP 长连接，理论上只要双方不主动关闭就一直保持。但实际生产中，代理层（Nginx、CDN、负载均衡器）通常有**空闲超时**机制——如果一段时间没有数据传输，就会主动断开连接。

比如 Nginx 默认的 `proxy_read_timeout` 是 60 秒，意味着如果 60 秒内没有数据流过，连接就会被掐断。AI Agent 有时候思考时间很长（比如 Claude Code 分析大文件），期间可能几十秒没有输出，这时候连接就危险了。

### 解决方案：服务端心跳

服务端定时发送一个 SSE 注释（以 `:` 开头的行），告诉代理层"连接还活着"。SSE 协议规定以 `:` 开头的行是注释，客户端会自动忽略：

```javascript
app.post('/api/agent/run', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 心跳：每 15 秒发一次注释，防止代理层超时断开
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  const agent = spawn('claude', ['--print', req.body.prompt]);

  agent.stdout.on('data', (chunk) => {
    res.write(`data: ${JSON.stringify({ text: chunk.toString() })}\n\n`);
  });

  agent.on('close', () => {
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    clearInterval(heartbeat); // 清理心跳
    res.end();
  });

  // 客户端断开时也要清理
  req.on('close', () => {
    clearInterval(heartbeat);
    agent.kill();
  });
});
```

关键点：

- 心跳间隔建议 **15-30 秒**，太短浪费带宽，太长可能赶不上代理超时
- 用 `: heartbeat\n\n` 格式，客户端会自动忽略，不影响业务逻辑
- Agent 结束或客户端断开时，**必须清理** `setInterval`，否则内存泄漏

### 不需要轮询重新建立连接

有些同学会问：是不是需要每分钟用 `since` 参数重新发一次请求？

**不需要。** SSE 本身就是持久连接，只要心跳保活做对了，连接会一直保持。只有当连接真正断开时（网络故障、代理超时等），才需要重连——这时候用 `Last-Event-ID` 从断点继续即可，不需要从头开始。

## 踩坑记录

### 1. Nginx 代理缓冲

SSE 最怕的就是代理层的缓冲。Nginx 默认会缓冲响应，导致客户端收不到实时数据。解决方案：

```nginx
location /api/agent/ {
  proxy_pass http://backend;
  proxy_buffering off;          # 关闭缓冲
  proxy_cache off;              # 关闭缓存
  proxy_read_timeout 300s;      # 长连接超时
  chunked_transfer_encoding on;
}
```

### 2. 连接数限制

HTTP/1.1 下，浏览器对同一域名的并发连接数有限制（通常 6 个）。如果同时开多个 Agent session，可能会占满连接。解决方案：

- 升级到 HTTP/2（多路复用，不受此限制）
- 或者用 WebSocket 替代

### 3. 断线重连

原生 `EventSource` 自带重连能力，但 `fetch + ReadableStream` 没有。如果 Agent 执行时间长，网络抖动导致断连，需要自己做重连逻辑。一般做法是：

- 服务端给每个事件带 `id`
- 客户端断连后用最后一个 `id` 重连，服务端从断点继续推送

### 4. 大输出内存问题

AI Agent 有时会输出大量内容（比如读整个文件）。前端如果一直往 DOM 里追加，页面会越来越卡。建议：

- 限制最大行数，超出后截断头部
- 用虚拟滚动（virtual scroll）只渲染可视区域

## 总结

| 场景                            | 推荐方案                                                    |
| :------------------------------ | :---------------------------------------------------------- |
| 只需 GET 的 SSE                 | 原生 `EventSource`                                          |
| 需要 POST 的 SSE（如 AI Agent） | `fetch + ReadableStream` 或 `@microsoft/fetch-event-source` |
| 需要双向通信                    | WebSocket                                                   |
| 需要完整终端体验                | xterm.js + SSE/WebSocket                                    |

Stream + SSE 这套方案在 AI Agent 场景下非常好用：轻量、单向、自动重连、兼容性好。相比 WebSocket 的复杂握手和双向通信，SSE 就是为"服务端推数据"这个场景量身定做的。
