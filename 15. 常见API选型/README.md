# REST, Graphql, gRpc & Webhooks

## 引言

前段时间，部门领导层决定全面放弃现行的某F开头的后端渲染框架，团队里开始了热火朝天REST API Best Practice。这个变化对于我们底层开发来说确实是一个极大的鼓舞。可以预见，短时间内开发效率能数倍提升。

这期我将列举几个常见的API设计方案，对比一下它们的优缺点，并思考一下在某些场景中该如何精益求精。

## REST

REST（Representational state transfer）是最大路货的设计方案。它是一种强制性的client-server设计模型，服务端提供修改资源的接口，客户端主动调取这些接口。REST基于原生HTTP实现，要求所有通讯必须是无状态和可缓存的。

REST有这么几个基本原则：

* 操作来自同一个URL

* 使用HTTP verbs（GET、POST、DELETE、PUT、PATCH），headers和body

* 可自我描述的错误——是用HTTP约定俗成的状态码

* Web服务器能够通过浏览器访问

REST的最大优点就是通用，综合性碾压所有其他方案：可以用作web前后端交互，也可以用于服务间调用；开源工具数不胜数，利于浏览器调试，易于横向扩展，状态码无需造轮子等等。当然挑刺的话，也有这些缺陷：

* 一般只依赖几个动作（GET、POST、DELETE、PUT、PATCH），复杂操作比较吃力

* 在移动通讯中很难平衡api数量和资源负载

* 向后兼容一般通过提供多版本管理，会产生大量的冗余
 
* API文档很难管理；一般用Swagger做协议，不过无专人维护，久之也会成为累赘


## [gRPC][1]

REST只是一种设计风格，自由度很高；RPC（Remote procedure call）从字面来看，已经是一种协议了，相对来说限制更多——客户端与服务端需要紧密捆绑，当然性能也更强。gRPC是RPC框架里的佼佼者：使用[protobuf][2]解码、跨语言、支持全平台、Google爸爸。嗯，一切都很美好。

gRPC的工作流程如下所示：

1. 服务间协定protobuf服务和消息类型

2. 编译`.proto`生成语言对应的桩代码

3. 客户端、服务端各自调用这些生成的桩代码

![workflow][3]

在一些动态语言里（如NodeJs），甚至可以动态加载`.proto`文件。

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

上面在helloworld.proto里定义了`Greeter`服务和相关message的数据结构。NodeJS通过`proto-loader`动态加载这些protobuf。

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

gRPC的目前最常用的场景还是是微服务间的API调用。与REST传输JSON相比，gRPC利用protobufs序列化降低了数据包的大小，因此较适合资源、带宽、性能敏感场景（潜台词是：在不敏感领域里，也就没啥优势了）。

我个人其实对[**protocol buffers**][2]更感兴趣。这是一套完全不同于swagger的API管理方式——它要求客户端和服务端同时拿到proto结构。一般我们通过`@annotation`或是第三方应用生成Swagger文档；但在开发中注释其实并不可靠，尤其是在遗产代码里，注释往往就是混淆视听的一大因素，更别说单独部署的第三方应用了（靠自觉？）。相比之下，Protobufs本身就是一套描述性语言，API生成自描述性的`.proto`文件，可以说**文档即代码**。能保证API有专人维护，这在大型应用中极为重要。

不过就事论事，gRPC毕竟不够大路货，有时候我们阐述它的优点时，往往锚定了REST的某些缺陷。因此并不能信誓旦旦地断言gRPC胜过REST。尤其是REST学习曲线平缓，自由度高这些巨大的优势，在“大众编程”领域里，gRPC等其他框架还是很难撼动这个地位的。

## [Graphql][4]

> Graphql源自程序员对JSON操作的冲动

我个人是比较推崇Graphql的设计模式，它基本就是照着REST缺点设计出来的。

*  单点 v.s. 多点
*  强类型 v.s. 重复的类型检测
*  复杂查询 v.s. 多API组合
*  自定义资源数 v.s. 资源过载
*  增量升级 v.s. 多版本管理

Graphql一般先定义好如下数据类型`User`和查询方法`me`。

```javascript
type User {
  id: ID!
  name: String
}

type Query {
  me: User
}
```

接着前端自定义所获取的资源。比如，现在只想获取User的`name`并不需要`id`，所以我把查询语句写成如下格式：

```javascript
query {
  me {
    name
  }
}
```

然后前端向后端单点`/graphql`发起查询请求，最后获得如下JSON。

```JSON
{
  "me": {
    "name": "Luke Skywalker"
  }
}
```

GraphQL带来的好处是精简请求响应的内容，不会出现冗余字段。前端可以决定后端返回什么数据；后端接口只需要一次性提供完整的资源，不再需要逐个开发。Graphql后端将大量精简API方法，当后端有数据变化时也只需通过增量升级完成，前端不需修改任何代码。

此外还有如下几点优势：

* Mock
  
  相比Swagger需自定义各种mock数据，Graphql天然的强类型能由引擎自动生成mock 数据。

* 文档
  
  REST是注释即文档，gRPC是文档即代码，Graphql则是代码即文档。Grapqhl引擎能自动生成代码对应的文档，成熟的工具或插件有[Apollo Client Devtools][6]、[graphiql][7]、[voyager][8]等等。如下是graphiql界面：
  
  ![Graphiql][5]

* 微服务
  
  在微服务治理中，Graphql可以扮演单点api gateway的角色。由于前端自定义获取资源的特点，共享BBF（Backend For Frontend）可以成为很好的实践。后端不必再开放多点api（类似于`/mobile/api`、`/pc/api`）。只要后端提供充足的资源，前端各取所需即可。

  ![microservices][9]

  此外，Graphql还可以在BBF里扮演类似于DDD里value object的角色。如下是某个graphql schema的定义，不同数据源的聚合可以发生自同一个结构体里，调取顺序是兄弟域异步操作，父子域同步操作。相对于REST的代理实现，Graphal提供了一个更友好的dispatch形式。
  
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

  我对webhook几乎没有接触过，这里通过道听途说简单介绍一下。Webhooks可以说是彻头彻尾的反模式，因为其定义是：前端不主动发送请求，完全由后端推送。它解决的是前端轮询的问题，主要用于服务器主动更新客户端资源的场景。举个例子，比如你给朋友发了一条信息，后端就会主动将这条信息推送给这个朋友的应用。


## 总结

最后再总览一下上面提到的API设计方案（某F开头的框架就不提了）

* REST是最通用的API技术选型，可以应用于前后端，也可以用作服务间通讯。协议约定较松散，不出意外，最后90%的接口都不能落实REST语义规则。不适合对性能敏感的场景，但是一般小厂也碰不到这种场景。

* gRPC是REST很强的竞争者，在跨语言服务通信这块优势巨大，也有grpc-web应用于web客户端。非常优秀的框架，适合对性能高要求或者环境苛刻的场景，只是入门难度较高。对于小厂来说，技术水平、管理能力、资源配置都比较薄弱，盲目使用可能会自讨苦吃。

* Graphql是一种全新的前后端交互方式，目的就是取代REST。但是在遗产代码重构Graphql可能会得不偿失；比较适合新开或是重写项目尝鲜。

* Webhooks解决的是特殊场景的问题。对于第三方平台验权、登陆等没有前端界面做中转的场景，或者强安全要求的支付场景等等适合用Webhooks做数据主动推送。

OK，工具列举完了，但是实际开发中还需要因势而为，毕竟一切开发工具最终还是服务于软件工程管理。比如，从后端渲染跨度到REST意味着业务权重更多放在了前端，人力分配和后端设计应该及时跟进；Graphql的话，前端要拼出query，事实上分担了后端的很多工作，这时候后端使用NodeJS可能更容易抹平语言壁垒；RPC通过强协议解耦各个模块，这时候更细致的分工兴许比所谓的全栈更高效。当然这些都是管理层需要慢慢摸索并精细调整的，我也只能纸上谈兵，希望对大家有些许帮助吧。


[1]: https://grpc.io/
[2]: https://developers.google.com/protocol-buffers/
[3]: ./img/grpc-workflow.png
[4]: https://graphql.org/learn/
[5]: ./img/graphiql.png
[6]: https://www.apollographql.com/docs/react/features/developer-tooling.html
[7]: https://github.com/graphql/graphiql
[8]: https://github.com/APIs-guru/graphql-voyager
[9]: ./img/graphql-microservices.png