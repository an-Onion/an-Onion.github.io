# Node 环境变量

看了一篇[外文][1]，讲如何使用 node 环境变量的。这期我也结合自己的一些经验写写读后感吧。

## 概述

说来话长，我最早接触环境变量还是在学 Java 的时候。特地找了张比较复古的图片，记得当时照着书本配环境变量都折腾好了几天。我后来还写到了百度知道里，现在都能搜到。

![Environment Variables][2]

无论什么语言，在开发和生成中，我们都会碰到各种各样的环境变量，直接写到系统环境变量里显然不合适。不过，我刚进厂的时候，我们的产品还真的就是给客户环境加无数的系统变量，当时都震惊了。（汗）

## Node 开发

在 Node 开发中我们是怎样使用环境变量的呢？

### 命令行

每次运行前先 set 各种变量，这个自然很蠢，就不往下说了。

```bash
set PROT=8080
node main.js
```

### [cross-env][3]

*cross-env*是*npm script*里最常用的一种添加环境变量的方式：用法很简洁，先在本地安装*cross-env*包，接着往 package.json 的 script 里一路列变量就行了。

```plain
yarn add -D cross-env
```

```javascript
// package.json
{
  "scripts": {
    "main": "cross-env NODE_ENV=production SCOPE=onion node main.js"
  },
  "dependencies": {
    "cross-env": "^5.1.4"
  }
}
```

如上，调用的时候在控制台运行`yarn main`或是`npm run main`，环境变量就起效果了。具体体现如下，就是把代码里的`proces.env.*`给替换成*npm script*里对应的值。

```javascript
// main.js
console.log(proces.env.NODE_ENV); // production
console.log(proces.env.SCOPE); // onion
```

### [dotenv][4]

*cross-env*很简洁，但是也太简单了——它只能处理只有极少数环境变量的程序。假如有成百上千个变量值呢，我总不可能把这些都列在*package.json*里吧？

OK，你可以把这成百上千的变量放到文件里，比如给这个文件起个名字叫`.env`。

```bash
# .env

NODE_ENV=production
SCOPE=onion
PORT=8080
DB_CONN="balabala"
...
```

事实上就是有一个叫*dotenv*的 npm 包这么做的。安装还是一样：

```bash
yarn add -D dotenv
```

接着在*main.js*的开头加一句`require("dotenv").config()`，它就会在运行时自动读取根目录里*.env*文件的配置了。

```javascript
// main.js
require('dotenv').config();

console.log(proces.env.NODE_ENV); // production
console.log(proces.env.SCOPE); // onion
```

当然，你不想在代码里四处添加`require('dotenv')`，也可以选择预加载——加个`-r`参数就行了。有的人还喜欢把这个这些配置加到 vscode 的*launch.json*里，道理是一样的。

```bash
node -r .env main.js
```

### Webpack

Webpack 一般用于前端模块的构建和打包，但事实上对 node 后端项目打包也很方便。我在部署 lambda fuction 的时候就用到了 webpack，它能把一个庞大的项目压缩至几兆，是解决 aws lambda 依赖大小限制的重要手段。

OK，webpack 处理环境变量与上述种种略有不同，并非运行时调取`proces.env`对象；而是在 build 时用字符串替换掉所有`proces.env.*`。

```javascript
// main.js
console.log(proces.env.NODE_ENV);
console.log(proces.env.SCOPE);
```

上述代码事实上在打包后等价于：

```javascript
console.log('production');
console.log('onion');
```

有个很经典的 webpack 插件叫`DefinePlugin`，就可以处理这些变量，他用于定义全局常量。你可以这么使用：

```javascript
// webpack.config.js
module.exports = {
  ...
  plugins: [
    new webpack.EnvironmentPlugin({
      'process.env.NODE_ENV': 'production',
      'process.env.SCOPE': 'onion'
    })
  ]
  ...
};
```

后来，我又发现了一个专门处理环境变量的插件叫`EnvironmentPlugin`, 它与`DefinePlugin`最后等价。

```javascript
// webpack.config.js
module.exports = {
  ...
  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production'
      SCOPE: 'onion'
    })
  ]
  ...
};
```

有了`EnvironmentPlugin`就可以把所有变量都放到`webpack.config.js`。当然，假如你坚持需要专门的`.env`文件里，强大如 webpack 社区也早已为你考虑到了——[dotenv-webpack][5]。同`dotenv`一样，你把所有环境变量列到`.env`里，然后在**webpack.config.js**添加新插件即可。

```javascript
// webpack.config.js
const Dotenv = require('dotenv-webpack');

module.exports = {
  ...
  plugins: [
    new Dotenv()
  ]
  ...
};
```

### VS Code

VS Code 是目前最主流的 Node 开发工具，假如开发组团队全部使用 VS Code，大家也可以把环境变量配到*.vscode/launch.json*里。

```javascript
// launch.json
{
  "configurations": [
    {
      "env": {
        "NODE_ENV": 'production'
        "SCOPE": 'onion'
      }
    }
  ]
}
```
VS Code 也可以和*.env*文件打通：

```javascript
// launch.json
{
  "configurations": [
    {
      "envFile": "${workspaceFolder}/.env"
    }
  ]
}
```

## 生产环境

上面提到的都是本地开发环境里如何使用环境变量，但是在生产环境里必须要有更多安全的考量；环境变量很可能包含敏感信息，比如数据库密码、access key、credentials 等等。因此这些变量不适合直接提交到较开放的代码仓库里。一般的解决方法有这么几种：

1. 私有部署

    将配置文件上传到私有 Git 上，并在 build 或是运行时，依靠构件工具自动拉取这些配置。

2. 持久化配置服务

    一般的云服务商都会打包持久化配置服务，主要就是来存储环境变量。比如 aws 的 Systems manger，我经常用它里面的*SSM:parameter store*来处理 lambda 的环境配置。这些配置可以直接通过云服务自带的 SDK 获取：既可以运行前预加载，也可以在运行时异步加载。这个服务与 role 相关，因此确保了第三方服务器即便拿到了 Token 也无法访问。

3. 加密服务

    在某些安全级别特别高的服务器里，内部私有 Git 都不被允许，还不信任敌国势力股权下的云服务商，那就只能使用加密服务了。一般来说就是将所有环境变量加密存储，并利用 SDK 解密后放入运行环境中。

## 小结

环境管理是开发中经常碰到的问题。我记得以前开发团队内部会***手手相传***某个巨大的配置文件；谁也不知道它们各自的作用，且经常被人更改，每次更改后如果不到某个环节还不知道特定效果。因此每天都会有人喊，“咋又打不开了？”，“可能是一个月前改的某个变量吧，我的配置发给你试试。”

想起来还是回味无穷的。现在开发中除了极少数配置，我已经把绝大多数环境变量放到 AWS 的 Systems manager 里了，开发时也是动态读取。Systems manager 价格也很便宜，一个月几毛钱吧。许多问题开阔一下眼界就迎刃而解了。



[1]: https://www.freecodecamp.org/news/heres-how-you-can-actually-use-node-environment-variables-8fdf98f53a0a/
[2]: ./img/window-env.png
[3]: https://github.com/kentcdodds/cross-env
[4]: https://github.com/motdotla/dotenv
[5]: https://github.com/mrsteele/dotenv-webpack