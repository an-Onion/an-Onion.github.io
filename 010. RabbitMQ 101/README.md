# RabbitMQ 101

## 简介

最近自学了一点MQ知识，特别想瞎逼逼一下。所以今天随意聊聊RabbitMQ。

一般来说，在处理高并发请求的业务中，我们常常用到这两种方式：缓存和异步。缓存的话，经典的应用有redis；异步的话，就当属MQ（消息队列）了。这周讲的RabbitMQ就是最常见的一种消息队列。MQ——打个比方——类似于邮局：寄信人--> 邮局 --> 收信人这类模式。流程一般是这样的：
1. 寄件人委托邮局寄送信件，（接着就可以自顾自了，实现异步了）
2. 邮局将信件送到目的地后，通知收件人
3. 收件人得到通知后，在自己空闲的时候去邮局取件（订阅并异步调用）

加入邮局这么一个中介有什么好处呢？   
* 对寄信人来说，假如自己去送信，一来一回可能要花费很多时间，在通讯领域就是所谓的同步阻塞。
* 对收件人来说，假如在短时间里很多人一个接着一个敲门送信，他会因收信拆信忙得不可开交。
  
 总体来说，加入邮局后应用分工更加明确，更能发挥各自的比较优势。在消息队列的术语里，寄信人被称为Producer（生产者），收信人被称为Consumer（消费者）

![Overall][1]

如图所示：MQ的功用主要有两点
1. 解耦Producer和Consumer
2. 搓平消息峰值
   
当然，加入消息队列本质上还是增加了系统的复杂度，Producer发送消息后并没有很好的途径得到回馈，此外还需要担心MQ本身的性能以及可用性。现实开发中若无必要不必使用。

## Hello World

OK，回到主题中。RabbitMQ是基于[amqp协议][0]设计的应用，使用前必需预安装erlang环境。下面以Hello World为例展开几个工作场景。

![Hello][2]

RabbitMQ几乎支持所以主流语言，相比于其他几种主流MQ，在跨语言开发上比较有优势。在node平台的话，只需`npm install amqplib`就可以直接调用RabbitMQ了。我写一个简单的示例：

```javascript
// Producer.js
amqp.connect('amqp://localhost', (err, conn) => {
  conn.createChannel((err, ch) => {
    let q = 'hello';
    let msg = Buffer.from('Hello World');

    ch.assertQueue(q);
    ch.sendToQueue(q, msg);
});
```

```javascript
// Consumer.js
amqp.connect('amqp://localhost', (err, conn) => {
  conn.createChannel((err, ch) => {
    let q = 'hello';

    ch.assertQueue(q);
    
    ch.consume(q, (msg) => { console.log( msg.content.toString() ); });
  });
});
```
如上所示，Producer和Consumer分别订阅了RabbitMQ的**hello**队列；Producer通过`sendToQueue`将消息交由**hello**队列；最后Consumer消费掉这个消息。一个简单的生产-消费过程就结束了。

当然现实开发中可能是多个Consumer来消费同一个队列的消息。消息默认都会以FIFO的顺序被消费掉。

![work queues][3]

## 路由

开发中可能会有这样的需求——以log为例——我想把所有的log都打印在控制台，但是错误需要额外保存到文件中。这时候有一个特定的规则系统，分流消息至不同的队列中会变得很有帮助。

![Exchange][4]

RabbitMQ就提供了一个叫Exchange的服务实体。它的功能如上所示，就是依据不同的类型绑定到特定队列。消息最后会根据不同的模式被RabbitMQ路由到相应的队列中。

Exchange共有四种类型：

* fanout：广播到所有绑定的队列中
* direct：发送到字符串严格匹配的队列中
* topic：模糊匹配（类似于乞丐版的正则吧）
* headers：通过headers里的属性匹配，很少被用到

如下所示：我稍微改了一下Consumer.js。除了assertQueue，还assertExchange，并将queue绑定到exchange的error模式中。

```javascript
// C1.js
amqp.connect('amqp://test:test@172.26.142.232', function(err, conn) {
  conn.createChannel(function(err, ch) {
    let ex = 'logs';
    let type = 'direct';

    ch.assertExchange(ex, type);

    ch.assertQueue('', {exclusive: true}, (err, q) => {

      ch.bindQueue(q.queue, ex, 'error');

      ch.consume(q.queue, (msg) => {
        console.log(`${msg.fields.routingKey}: ${msg.content.toString}`;
      });
    });
  });
});
```
C2.js与C1.js类似, 不同之处是绑定了'info', 'error', 'warning'三个模式。
```javascript
//C2.js

....
ch.assertQueue('', {exclusive: true}, (err, q) => {

      ['info', 'error', 'warning'].forEach( (severity) => {
        ch.bindQueue(q.queue, ex, severity);
      });
      
      ...
    });
```

Producer只需向该exchange的指定模式（如下**info**）发送消息，就可以自动路由到相应的队列里了。

```javascript
// Producer.js
amqp.connect('amqp://localhost, (err, conn) => {
  conn.createChannel((err, ch) => {
    let msg = Buffer.from('Hello World');

    ch.assertExchange('logs', 'direct');
    ch.publish('logs', 'info', msg);
  });
});
```

## RPC

RabbitMQ还可以和RPC服务器结合使用，代码我就不再示例了，基本原理如下所示：客户端和服务端分别订阅两个不同的消息队列。数据流如下所示：
1. 客户端向队列**A**发送消息
   
2. 服务端消费**A**的内容后，将处理后的消息发给另一个队列**B**

3. 客户端再通过监听**B**队列获得返还的消息

![RPC & MQ][5]

当然这种方式早些年有被使用，它很好地避免了服务发现这个难题，但是后来反馈性能不高，就不了了之了。近些年MQ被更多地限定在某些专项领域中：比如Kafka作用于日志搜集；阿里的RocketMQ用于保证数据库事务一致性上；RabbitMQ的话也有与ElasticSearch合用于搜索的案例。



## 小结

今天我简单讲述了RabbitMQ的基础知识，介绍了几个应用场景。
总体来说，消息队列本质功用还是**搓平峰值**，在高并发场景中有一席之地。但是它也很容易增加系统复杂度，假如系统根本就不会出现消息峰值，那就不要自找麻烦了。OK，当然有人会反驳，万一以后用到了呢？以后用到了，届时再重构呗。当你能用到MQ的时候，一般来说，产品已得到市场认可，盈利状况好转，拥有更多的人力、资源，那时技术水平、管理水平也更加成熟，很多事情就并不那么复杂了。


[0]: https://www.amqp.org/
[1]: https://upload-images.jianshu.io/upload_images/14368237-a972545722e76df1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[2]: https://upload-images.jianshu.io/upload_images/14368237-e0518ed6c2118753.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[3]: https://upload-images.jianshu.io/upload_images/14368237-e89b32bf25f3913e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[4]: https://upload-images.jianshu.io/upload_images/14368237-3061bf484523a630.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240
[5]: https://upload-images.jianshu.io/upload_images/14368237-3583efbf742efaef.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240