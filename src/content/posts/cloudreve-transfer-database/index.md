---
title: 迁移cloudreve数据库
published: 2026-02-07
description: '从SQLite到PostgreSQL'
#image: 'logto-logo.png'
tags: [数据库, 网盘, cloudreve]
category: 'Web应用'
draft: true 
#lang: ''
---

随着使用，cloudreve的数据库越来越庞大，SQLite已经频繁出现锁死的情况

---

## 目录

[1. 安装新数据库](#安装新数据库)



---

# 安装新数据库

安装PostgreSQL

```bash
apt install postgresql -y
```

配置PostgreSQL

```bash
su postgres
psql #进入psql的命令行
\password  #设置密码
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
