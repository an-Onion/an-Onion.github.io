# Nestjs

最近在看到了一篇介绍node后端的文章，偶然听说了nestjs这个框架。看了一下觉得挺有意思的，就在这里分享一下。

## 综述

Nestjs是一个基于Expressjs封装的node后端框架，天然为typescript量身定制了语法支持，github上有近15K的star。得益于es6的Reflect，nest拥有了@annotation注入依赖，在中量级node应用开发中有比较高的知名度。

## 安装

文章开始前，我们先构建一个nest项目，再进一步谈论里面的各个模块。Nestjs提供了自己的cli脚手架，两行命令就可以创建一个新的项目。

```
npm i -g @nestjs/cli
nest new project-name
```

然后`yarn start`，在localhost:3000可以看到`Hello World`了。嗯，这就是我喜欢node的原因——简单快速。

OK，看一下模版代码，src里的结构如下：

```
src
|--app.controller.ts
|--app.service.ts
|--app.module.ts
|--main.ts
```

可以很直观的联系到传统MVC的分层结构：

* controller就是传统意义上的控制器，提供api接口

* service又称为Provider，是一系列服务、repo、工厂方法、helper的总称

* module是controller和provider的集合，类似于namespace的概念，支持module内部controller和provider的注入互相关联

上面这些概念我会逐步在后文介绍使用。先看一下`main.ts`，这个是入口文件。这里利用了一个叫NestFactory方法创建了这个nest应用。有Spring开发经验的后端对此一定不会太过陌生。

```javascript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

## Controller

Controller在上面也提了，就是传统意义上的控制器，用户接受request再返回response。


### Routing

装饰器`@Controller`很好用，可以将路由直接标志在类和函数头上，做到了很简洁的路由去中心化。

```javascript
// nest
@Controller('hello')
export class AppController {

  @Get('world')
  getHello(): string {
    return 'Hello World';
  }
}
```

相比于express**原始**路由，nest装饰器显然更具工程化。

```javascript
// express

AppController.get('/world', function getHello() {
    return 'Hello World'
});

router.use('/hello', AppController);
```

### 请求

请求类的装饰器封装了express handler的参数和一些资源，使用方法如下例所示：`@Request()`映射的就是express `handler(req, res, nest)`第一个参数req。

```javascript
@Controller('hello')
export class AppController {

  @Get('world/:id')
  getHello(@Response() res, @Param('id') id): string {
    res.status(HttpStatus.OK).json('hello world')
  }
}
```

我这里列了几个nest装饰器和handler资源的映射关系。开发中常用的`req.params`和`req.headers`也做了封装，开发中可以免去一些繁琐的判断语句。想看完整版可以点[这里][1]

| Decorator|   Handler     |
|----------|:-------------:|
| @Request() |  req |
| @Response() |    res   |
| @Next() | nest |
| @Param(key?: string) | req.params / req.params[key] |
| @Headers(name?: string) | req.headers / req.headers[name] |

### 资源

Nest对http的资源请求也做了配置，一系列常用的装饰器如@Get用来指明request方法（支持通配），@Header和@HttpCode用于指定respose的返回头和状态码等等。有兴趣的朋友可以去开发者文档具体阅读细节，这里不再深入研究。

```javascript
@Get('ab*cd')
@Header('Cache-Control', 'none')
@HttpCode(204)
findAll() {
  return 'This route uses a wildcard';
}
```

## Provider

Provider就是MVC开发中的服务，是一系列services, repositories, factories, helpers等等的总称。我们定义一个provider如下，Nest就是利用一个叫`@Injectable()`的装饰器实现注入依赖。

```javascript
// app.service.ts

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

如下，Controller中使用的是**构造器**注入的方式。注意下面加了`private readonly`，这是ts快速初始化私有域的语法糖。

```javascript
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```

## Module

OK，上面提到了Provider注入，那怎么将Controller和Provider相关联呢？Module出场了。先看代码：

```javascript
// app.module.ts

@Module({
  imports: [otherModule],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
```

Module还是挺直观的：provider和controller就是上文提到的服务和控制器；imports里引入的是其他module的实例。

![module structure][2]

OK，来总结一下什么是module

> A module is a class annotated with a @Module() decorator. The @Module() decorator provides metadata that Nest makes use of to organize the application structure.

简单来说，Module是个namespace或是scope的概念，是一系列Controller和Provider的方法集，也可以看成一种应用的组织形式。在Module内部，nest实现了注入关联。

## Middleware

Express还有个概念middleware，感兴趣的朋友可以看我的博客[《Express Middleware》][3]。Next封装了express，自然也少不了middleware。Nest middleware是依靠继承一个叫`NestMiddleware`类实现的，它也可以通过注入实现。

```javascript
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req, res, next) {
    console.log('Request...');
    next();
  }
}
```

我们在Module添加Middleware配置。如下所示，http请求会在到达AppController前执行middleware的use——打印`Request...`。

```javascript
// app.module.ts
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(AppController);
  }
}
```

Nest还提供了函数中间件、链式中间件、全局中间件等等配置方式，感兴趣的朋友可以参阅开发者文档。


## 小结

今天科普了一款typescript的后端框架——nestjs，它是我见过的设计最优雅的node MVP框架。相比于轻量级框架express，nest更具工程化、规范化；注入依赖，更让人有一种在node里写Spring的感觉。不过缺点也很直观，相比于express，启动速度慢了三五倍；开发中，热加载体验也远不如express和koa。选择框架时，还是需要不断tradeoff的。

突然想起《神雕侠侣》中的一句话，“重剑无锋，大巧不工”——剑技不在剑锋而在个人修行。现实开发中，我们会碰到各式各样的应用场景，并不存在放之四海而皆准的框架；在平日的“修行”中，应尽量扩充知识库，若脑海中只有一个选项，“歧路亡羊”是迟早的事。

[1]: https://docs.nestjs.com/custom-decorators
[2]: ./img/module.png
[3]: https://www.jianshu.com/p/dc17c4d414d1