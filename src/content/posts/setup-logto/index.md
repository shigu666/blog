---
title: 阿里云服务器迁到家里云
published: 2025-11-29
description: '本地部署一个logto以提供单点登录'
#image: ''
tags: [单点登录, logto, 身份认证, 家里云, PVE, 虚拟机]
category: 'Web应用'
draft: true 
#lang: ''
---

随着自己的东西越来越多，每个站点都要搞一遍登录非常麻烦，所以部署一个单点登录来简化步骤

# 目录
1. 环境准备
2. 安装logto
3. 配置Nginx

---

## 环境准备

logto在本地部署时需要以下环境

`Node.js` `>=22.14.0` 以及 `PostgreSQL` `>=14.0`
 **注：** 虽然*logto*文档所写的Node.js版本是`>=18.12.0`，但是本文使用的该项目实际需要Node.js版本为`>=22.14.0`

部署时使用的系统环境为`debian-13-genericcloud`，使用`Nginx`进行反代

先换源为国内源然后更新，不赘述

安装nginx
```bash
apt install nginx -y
```

安装Node.js和npm

```bash
wget https://nodejs.org/dist/v22.14.0/node-v22.14.0-linux-x64.tar.xz
mkdir /etc/nodejs
tar -xvf node-v22.14.0-linux-x64.tar.xz
mv node-v22.14.0-linux-x64 /etc/nodejs/22.14.0
rm node-v22.14.0-linux-x64.tar.xz
ln -s /etc/nodejs/22.14.0/bin/node /bin/node
ln -s /etc/nodejs/22.14.0/bin/npm /bin/npm
ln -s /etc/nodejs/22.14.0/bin/npx /bin/npx
ln -s /etc/nodejs/22.14.0/bin/corepack /bin/corepack
corepack enable
#检查版本
node -v #应输出v22.14.0
npm -v #应输出10.9.2
npx -v #应输出10.9.2
```

安装PostgreSQL

```bash
apt install postgresql -y
```

配置PostgreSQL

```bash
su postgres
psql #进入psql的命令行
\password  #设置密码
CREATE DATABASE logto; #创建logto数据库
```

修改 /etc/postgresql/<你的psql版本，如17>/main/postgresql.conf 文件第 60 行取消注释，允许本地登入数据库。

```postgresql.conf
listen_addresses = 'localhost'          # what IP address(es) to listen on;
```

然后重启psql

```bash
systemctl restart postgresql.service
```

---

## 安装logto

**交互式安装**

```bash
npm init @logto@latest
#如果默认下载缓慢，可以使用 --download-url=<url>指定链接
#npm init @logto@latest -- --download-url=https://gh-proxy.org/https://github.com/logto-io/logto/releases/latest/download/logto.tar.gz
npm i @logto/cli -g #全局安装logto的cli，便于后续步骤
```

添加官方连接器 **注**:实际官方连接器已存在，此步骤应跳过，但是文档写明了，若执行本命令，将会导致不兼容的模块被引入（该模块需求更低版本的nodejs）
```bash
logto connector add --official
```

将本地连接器链接到logto
```bash
logto connector link
```