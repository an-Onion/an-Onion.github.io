# REST, Graphql, gRpc & Webhooks

## 引言

前段时间，部门领导层决定全面放弃现行的某 F 开头的后端渲染框架，团队里开始了热火朝天 REST API Best Practice。这个变化对于我们底层开发来说确实是一个极大的鼓舞。可以预见，短时间内开发效率能数倍提升。

这期我将列举几个常见的 API 设计方案，对比一下它们的优缺点，并思考一下在某些场景中该如何精益求精。

## REST

REST（Representational state transfer）是最大路货的设计方案。它是一种强制性的 client-server 设计模型，服务端提供修改资源的接口，客户端主动调取这些接口。REST 基于原生 HTTP 实现，要求所有通讯必须是无状态和可缓存的。

REST 有这么几个基本原则：

* 操作来自同一个 URL

* 使用 HTTP verbs（GET、POST、DELETE、PUT、PATCH），headers 和 body

* 可自我描述的错误——是用 HTTP 约定俗成的状态码

* Web 服务器能够通过浏览器访问

REST 的最大优点就是通用，综合性碾压所有其他方案：可以用作 web 前后端交互，也可以用于服务间调用；开源工具数不胜数，利于浏览器调试，易于横向扩展，状态码无需造轮子等等。当然挑刺的话，也有这些缺陷：

* 一般只依赖几个动作（GET、POST、DELETE、PUT、PATCH），复杂操作比较吃力

* 在移动通讯中很难平衡 api 数量和资源负载

* 向后兼容一般通过提供多版本管理，会产生大量的冗余
 
* API 文档很难管理；一般用 Swagger 做协议，不过无专人维护，久之也会成为累赘


## [gRPC][1]

REST 只是一种设计风格，自由度很高；RPC（Remote procedure call）从字面来看，已经是一种协议了，相对来说限制更多——客户端与服务端需要紧密捆绑，当然性能也更强。gRPC 是 RPC 框架里的佼佼者：使用[protobuf][2]解码、跨语言、支持全平台、Google 爸爸。嗯，一切都很美好。

gRPC 的工作流程如下所示：

1. 服务间协定 protobuf 服务和消息类型

2. 编译`.proto`生成语言对应的桩代码

3. 客户端、服务端各自调用这些生成的桩代码

![workflow][3]

在一些动态语言里（如 NodeJs），甚至可以动态加载`.proto`文件。

```java
// helloworld.proto
syntax = "proto3";

package helloworld;

// The greeting service definition.
service Greeter {
  // Sends a greeting
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}

// The request message containing the user's name.
message HelloRequest {
  string name = 1;
}

// The response message containing the greetings
message HelloReply {
  string message = 1;
}
```

上面在 helloworld.proto 里定义了`Greeter`服务和相关 message 的数据结构。NodeJS 通过`proto-loader`动态加载这些 protobuf。

```javascript
// client.js
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync('./helloworld.proto');

const hello_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;

(function () {
  const client = new hello_proto.Greeter('localhost:50051',
                                       grpc.credentials.createInsecure());
  client.sayHello({name: 'onion'}, function(err, response) {
    console.log('Greeting:', response.message);
  });
})();
```

gRPC 的目前最常用的场景还是是微服务间的 API 调用。与 REST 传输 JSON 相比，gRPC 利用 protobufs 序列化降低了数据包的大小，因此较适合资源、带宽、性能敏感场景（潜台词是：在不敏感领域里，也就没啥优势了）。

我个人其实对[**protocol buffers**][2]更感兴趣。这是一套完全不同于 swagger 的 API 管理方式——它要求客户端和服务端同时拿到 proto 结构。一般我们通过`@annotation`或是第三方应用生成 Swagger 文档；但在开发中注释其实并不可靠，尤其是在遗产代码里，注释往往就是混淆视听的一大因素，更别说单独部署的第三方应用了（靠自觉？）。相比之下，Protobufs 本身就是一套描述性语言，API 生成自描述性的`.proto`文件，可以说**文档即代码**。能保证 API 有专人维护，这在大型应用中极为重要。

不过就事论事，gRPC 毕竟不够大路货，有时候我们阐述它的优点时，往往锚定了 REST 的某些缺陷。因此并不能信誓旦旦地断言 gRPC 胜过 REST。尤其是 REST 学习曲线平缓，自由度高这些巨大的优势，在“大众编程”领域里，gRPC 等其他框架还是很难撼动这个地位的。

## [Graphql][4]

> Graphql 源自程序员对 JSON 操作的冲动

我个人是比较推崇 Graphql 的设计模式，它基本就是照着 REST 缺点设计出来的。

*  单点 v.s. 多点
*  强类型 v.s. 重复的类型检测
*  复杂查询 v.s. 多 API 组合
*  自定义资源数 v.s. 资源过载
*  增量升级 v.s. 多版本管理

Graphql 一般先定义好如下数据类型`User`和查询方法`me`。

```javascript
type User {
  id: ID!
  name: String
}

type Query {
  me: User
}
```

接着前端自定义所获取的资源。比如，现在只想获取 User 的`name`并不需要`id`，所以我把查询语句写成如下格式：

```javascript
query {
  me {
    name
  }
}
```

然后前端向后端单点`/graphql`发起查询请求，最后获得如下 JSON。

```JSON
{
  "me": {
    "name": "Luke Skywalker"
  }
}
```

GraphQL 带来的好处是精简请求响应的内容，不会出现冗余字段。前端可以决定后端返回什么数据；后端接口只需要一次性提供完整的资源，不再需要逐个开发。Graphql 后端将大量精简 API 方法，当后端有数据变化时也只需通过增量升级完成，前端不需修改任何代码。

此外还有如下几点优势：

* Mock
  
  相比 Swagger 需自定义各种 mock 数据，Graphql 天然的强类型能由引擎自动生成 mock 数据。

* 文档
  
  REST 是注释即文档，gRPC 是文档即代码，Graphql 则是代码即文档。Grapqhl 引擎能自动生成代码对应的文档，成熟的工具或插件有[Apollo Client Devtools][6]、[graphiql][7]、[voyager][8]等等。如下是 graphiql 界面：
  
  ![Graphiql][5]

* 微服务
  
  在微服务治理中，Graphql 可以扮演单点 api gateway 的角色。由于前端自定义获取资源的特点，共享 BBF（Backend For Frontend）可以成为很好的实践。后端不必再开放多点 api（类似于`/mobile/api`、`/pc/api`）。只要后端提供充足的资源，前端各取所需即可。

  ![microservices][9]

  此外，Graphql 还可以在 BBF 里扮演类似于 DDD 里 value object 的角色。如下是某个 graphql schema 的定义，不同数据源的聚合可以发生自同一个结构体里，调取顺序是兄弟域异步操作，父子域同步操作。相对于 REST 的代理实现，Graphal 提供了一个更友好的 dispatch 形式。
  
  ```javascript
  type User {
    id: ID! # from token
    name: String # from front-end
    car：[Car]  # from User-Service
    house: [House] # from User-Service
  }

  type Car {
    id: ID!
    brand: String  # get brand from Car-Service after id from User-Service
  }

  type House {
    id: ID!
    address: String  # get address from House-Service after id from User-Service
  }
  ```

## Webhook

  我对 webhook 几乎没有接触过，这里通过道听途说简单介绍一下。Webhooks 可以说是彻头彻尾的反模式，因为其定义是：前端不主动发送请求，完全由后端推送。它解决的是前端轮询的问题，主要用于服务器主动更新客户端资源的场景。举个例子，比如你给朋友发了一条信息，后端就会主动将这条信息推送给这个朋友的应用。


## 总结

最后再总览一下上面提到的 API 设计方案（某 F 开头的框架就不提了）

* REST 是最通用的 API 技术选型，可以应用于前后端，也可以用作服务间通讯。协议约定较松散，不出意外，最后 90%的接口都不能落实 REST 语义规则。不适合对性能敏感的场景，但是一般小厂也碰不到这种场景。

* gRPC 是 REST 很强的竞争者，在跨语言服务通信这块优势巨大，也有 grpc-web 应用于 web 客户端。非常优秀的框架，适合对性能高要求或者环境苛刻的场景，只是入门难度较高。对于小厂来说，技术水平、管理能力、资源配置都比较薄弱，盲目使用可能会自讨苦吃。

* Graphql 是一种全新的前后端交互方式，目的就是取代 REST。但是在遗产代码重构 Graphql 可能会得不偿失；比较适合新开或是重写项目尝鲜。

* Webhooks 解决的是特殊场景的问题。对于第三方平台验权、登陆等没有前端界面做中转的场景，或者强安全要求的支付场景等等适合用 Webhooks 做数据主动推送。

OK，工具列举完了，但是实际开发中还需要因势而为，毕竟一切开发工具最终还是服务于软件工程管理。比如，从后端渲染跨度到 REST 意味着业务权重更多放在了前端，人力分配和后端设计应该及时跟进；Graphql 的话，前端要拼出 query，事实上分担了后端的很多工作，这时候后端使用 NodeJS 可能更容易抹平语言壁垒；RPC 通过强协议解耦各个模块，这时候更细致的分工兴许比所谓的全栈更高效。当然这些都是管理层需要慢慢摸索并精细调整的，我也只能纸上谈兵，希望对大家有些许帮助吧。


[1]: https://grpc.io/
[2]: https://developers.google.com/protocol-buffers/
[3]: ./img/grpc-workflow.png
[4]: https://graphql.org/learn/
[5]: ./img/graphiql.png
[6]: https://www.apollographql.com/docs/react/features/developer-tooling.html
[7]: https://github.com/graphql/graphiql
[8]: https://github.com/APIs-guru/graphql-voyager
[9]: ./img/graphql-microservices.png