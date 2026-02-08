---
title: 在家里云上部署logto
published: 2026-01-05
description: '本地部署一个logto以提供单点登录'
image: 'logto-logo.png'
tags: [单点登录, logto, 身份认证, 家里云, PVE, 虚拟机]
category: 'Web应用'
draft: false 
#lang: ''
---

随着自己的东西越来越多，每个站点都要搞一遍登录非常麻烦，所以部署一个单点登录来简化步骤

---

## 目录

[1. 环境准备](#环境准备)

[2. 安装logto](#安装logto)

[3. 配置反代或CDN](#配置反代或CDN)

[4. 配置systemd](#配置systemd)

[5. 更新版本](#更新版本)

---

# 环境准备

logto在本地部署时需要以下环境

`Node.js` `>=22.14.0` 以及 `PostgreSQL` `>=14.0`
 **注：** 虽然*logto*文档所写的Node.js版本是`>=18.12.0`，但是该项目实际需要Node.js版本为`>=22.14.0`

部署时使用的系统环境为`debian-13-genericcloud`，使用反代或CDN转换端口

先换源为国内源然后更新，不赘述

安装nginx、配置ddns、cdn等不再说明

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

改PostgreSQL的配置文件`/etc/postgresql/<你的psql版本，如17>/main/postgresql.conf`，第 60 行取消注释，允许本地登入数据库。

```postgresql.conf
listen_addresses = 'localhost'          # what IP address(es) to listen on;
```

然后重启psql

```bash
systemctl restart postgresql.service
```

---

# 安装logto

### 交互式安装

```bash
npm i @logto/cli -g #全局安装logto的cli，便于后续步骤
logto init #如果默认下载速度慢，使用--download-url=https://gh-proxy.org/https://github.com/logto-io/logto/releases/latest/download/logto.tar.gz指定下载链接
#logto init --download-url=https://gh-proxy.org/https://github.com/logto-io/logto/releases/latest/download/logto.tar.gz
```

 如果添加`--ss`则跳过数据库播种（适合已经有数据库升级版本时使用）
```bash
 logto init -p /root/logto --download-url=https://gh-proxy.org/https://github.com/logto-io/logto/releases/latest/download/logto.tar.gz --ss
```

也可以选用npm进行安装，使用`--`分隔需要传递的参数

```bash
#交互式安装
npm init @logto@latest
#如果默认下载缓慢，可以使用 --download-url=<url>指定链接
npm init @logto@latest -- --download-url=https://gh-proxy.org/https://github.com/logto-io/logto/releases/latest/download/logto.tar.gz
```

### 静默安装

```bash
#使用@logto/cli
logto -p /root/logto --download-url=https://gh-proxy.org/https://github.com/logto-io/logto/releases/latest/download/logto.tar.gz --db-url postgresql://postgres:passwd@localhost:5432/logto
#使用npm
npm init @logto@latest -- -p /root/logto --download-url=https://gh-proxy.org/https://github.com/logto-io/logto/releases/latest/download/logto.tar.gz --db-url postgresql://postgres:passwd@localhost:5432/logto
```

## 添加官方连接器 

```bash
logto connector add --official #不建议运行，见说明
```

> [!WARNING] 
> 实际官方连接器已存在，此步骤应跳过，但是在官方文档中出现了，若执行本命令，将会导致不兼容的模块被引入（该模块需求更低版本的nodejs），应当执行链接本地连接器的命令

## 将本地连接器链接到logto

```bash
logto connector link
```

---

# 配置反代或CDN

（此处不进行赘述）
 
*注：* 配置登录的源端口为3001，管理的源端口为3002，均使用HTTPS反代监听443端口，使用sni区分，并需要在 `logto/.env`文件中添加以下配置项（域名需要在反代或cdn同步配置）

 ```.env
TRUST_PROXY_HEADER=true //此配置允许logto信任反向代理传回的ip
ENDPOINT=<你的登录端点> //如https://logto.shigu.cc
ADMIN_ENDPOINT=<你的管理端点> //如https://logto-admin.shigu.cc
 ```

---

# 配置systemd

创建`/etc/systemd/system/logto.service`

```logto.service 
[Unit]
Description=Logto
Documentation=https://docs.logto.io
# After=ddns-go.target #如果你需要logto在其他服务之后启动可以保留这一行
Wants=network.target

[Service]
WorkingDirectory=/root/logto
ExecStart=/usr/bin/npm start
Restart=on-abnormal
RestartSec=5s
KillMode=mixed

StandardOutput=/var/log/logto.log
StandardError=syslog

[Install]
WantedBy=multi-user.target
```

---

# 更新版本

logto有更新时可以直接更新，只需要保证数据库和配置文件不变

```bash
#停止当前服务
systemctl disable --now logto
#备份配置
cp logto/.env ./
#删除旧目录
rm -rf logto
#检查当前@logto/cli版本
logto -v
#先更新@logto/cli
npm update -g @logto/cli
logto -v
#安装新版本，注意，数据库已经创建，需要通过--ss跳过数据库播种
logto init -p /root/logto --download-url=https://gh-proxy.org/https://github.com/logto-io/logto/releases/latest/download/logto.tar.gz --ss
#还原配置文件
cp .env logto/
#链接连接器
logto connector link
#更新数据库
logto db alteration deploy
#重新启动服务
systemctl enable --now logto
```