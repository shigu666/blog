---
title: 迁移Cloudreve数据库到PostgreSQL
published: 2026-02-08
description: '从SQLite到PostgreSQL'
image: 'psql.png'
tags: [数据库, 网盘, Cloudreve, PostgreSQL]
category: 'Web应用'
draft: false 
#lang: ''
---

随着不断使用，Cloudreve的数据库越来越庞大，`内置的SQLite`已经频繁出现锁死的情况，所以需要迁移到其他数据库中，这里选择`PostgreSQL`  

---

## 目录

[1. 准备数据库](#准备数据库)  
[2. 迁移数据库](#迁移数据库)  
[3. 验证和修复](#验证和修复)  
[4. 问题和思考](#问题和思考)


---

# 准备数据库  

## 安装并配置PostgreSQL  

```bash
apt install postgresql -y
```

配置PostgreSQL  

```bash
su postgres
psql #进入psql的命令行
\password  #设置密码
CREATE DATABASE cloudreve; #创建数据库
```

修改PostgreSQL的配置文件`/etc/postgresql/<你的psql版本，如17>/main/postgresql.conf`，第 60 行取消注释，允许本地登入数据库。  

```postgresql.conf
listen_addresses = 'localhost'          # what IP address(es) to listen on;
```

然后重启psql  

```bash
systemctl restart postgresql.service
```

## 备份原有的SQLite数据库  
备份原有的SQLite数据库  
先关闭Cloudreve，然后找到你的cloudreve.db（默认情况下在Cloudreve同级目录下的data目录里）并复制它  

## 在新数据库中创建表  
修改你的cloudreve配置文件config.ini，在其中添加以下字段  
```ini
[Database]
Type = postgres
Port = 5432
User = postgres
Password = passwd ;填写上一步设置的密码
Host = 127.0.0.1
Name = cloudreve
Charset = utf8mb4
UnixSocket = false
```
随后启动Cloudreve并关闭  

使用工具连接到数据库（通过ssh隧道连接），并将所有表中的内容清空（仅清空表中内容不drop表本身）  
> [!TIP]
> 清理表group可能存在问题，详见[#表group引发的问题](#表group引发的问题)，建议自行测试可行性  

---

# 迁移数据库  

## 数据库对数据库迁移  

使用数据库连接工具将除`sqlite_master`和`sqlite_sequence`以外的所有表复制到新数据库的对应表中  
发现报错内容均形如  
```error
conversion failed: "2025-07-28 10:51:29.979933884 +0000 UTC m=+27.711477005" to timestamp with time zone
```  

查看数据库发现Clodureve在SQLite中使用的时间格式是go原生格式，而PostgreSQL则使用RFC格式

| 数据库 | 时间格式 | 说明 | 示例 |
|:---:|:---:|:---:|:---:|
| SQLite | go原生 | Go 语言的 time.Time.String()方法 | 2025-07-28 10:51:29.979933884 +0000 UTC m=+27.711477005 |
| PostgreSQL | RFC 3339 | ISO 8601标准的子集RFC 3339 | 2025-07-28 10:51:29.979933 +00:00 |

## 将数据库导出为CSV  

将除`sqlite_master`和`sqlite_sequence`以外的所有表导出为CSV（建议带标题导出，便于后续导入时自动建立映射）  

## 处理时间格式转换  
从原格式到新格式仅需将小数位数截断为六位再把`+0000`替换为`+00:00`并移除后面的内容（` UTC m=+xxx.xxxxxxxxx`）  
可以通过正则表达式匹配字段  
以下方法二选一即可  

> [!WARNING]
> 表entities和files中数据格式与其他表不同，需要特殊处理  
> 除下述正则处理外，还需要进行`\+0000 UTC`（正则）的匹配  

### 使用文本编辑器处理  
通过下方表达式匹配  
```regexp
[0-9]{3} \+0000 UTC m=\+[0-9]*\.[0-9]{9}
```

将匹配的内容替换为` +00:00`（注意空格）并保存  
对所有表进行处理  

### 使用bash命令处理  
（Windows需要使用git bash）  
```bash
find . -maxdepth 1 -type f -name "*.csv" -exec sed -E -i 's/[0-9]{3} \+0000 UTC m=\+[0-9]*\.[0-9]{9}/ +00:00/g' {} \;
```

## 重新导入  
使用数据库连接工具导入时间格式转换后的所有表  
发现仍无法导入，报错均形如  
```log
错误: 插入或更新表 "files" 违反外键约束 "files_files_children"   详细：键值对(file_children)=(8913)没有在表"files"中出现.
```

## 处理外键约束关系  
先临时禁用外键约束，语法如下  
```sql
-- 禁用外键约束
ALTER TABLE 表名 DISABLE TRIGGER ALL;

-- 启用外键约束
ALTER TABLE 表名 ENABLE TRIGGER ALL;
```

在此对所有表（截止4.13.0版本共27个表）执行禁用触发器操作  
```sql
ALTER TABLE abuse_reports DISABLE TRIGGER ALL;
ALTER TABLE audit_logs DISABLE TRIGGER ALL;
ALTER TABLE dav_accounts DISABLE TRIGGER ALL;
ALTER TABLE direct_links DISABLE TRIGGER ALL;
ALTER TABLE entities DISABLE TRIGGER ALL;
ALTER TABLE file_ancestor_permissions DISABLE TRIGGER ALL;
ALTER TABLE file_entities DISABLE TRIGGER ALL;
ALTER TABLE files DISABLE TRIGGER ALL;
ALTER TABLE fs_events DISABLE TRIGGER ALL;
ALTER TABLE gift_codes DISABLE TRIGGER ALL;
ALTER TABLE group_storage_policies DISABLE TRIGGER ALL;
ALTER TABLE groups DISABLE TRIGGER ALL;
ALTER TABLE metadata DISABLE TRIGGER ALL;
ALTER TABLE nodes DISABLE TRIGGER ALL;
ALTER TABLE oauth_clients DISABLE TRIGGER ALL;
ALTER TABLE oauth_grants DISABLE TRIGGER ALL;
ALTER TABLE open_ids DISABLE TRIGGER ALL;
ALTER TABLE passkeys DISABLE TRIGGER ALL;
ALTER TABLE payments DISABLE TRIGGER ALL;
ALTER TABLE policy_load_balances DISABLE TRIGGER ALL;
ALTER TABLE settings DISABLE TRIGGER ALL;
ALTER TABLE share_purchases DISABLE TRIGGER ALL;
ALTER TABLE shares DISABLE TRIGGER ALL;
ALTER TABLE storage_packs DISABLE TRIGGER ALL;
ALTER TABLE storage_policies DISABLE TRIGGER ALL;
ALTER TABLE tasks DISABLE TRIGGER ALL;
ALTER TABLE users DISABLE TRIGGER ALL;
```

导入数据随后启用触发器  
```sql
ALTER TABLE abuse_reports ENABLE TRIGGER ALL;
ALTER TABLE audit_logs ENABLE TRIGGER ALL;
ALTER TABLE dav_accounts ENABLE TRIGGER ALL;
ALTER TABLE direct_links ENABLE TRIGGER ALL;
ALTER TABLE entities ENABLE TRIGGER ALL;
ALTER TABLE file_ancestor_permissions ENABLE TRIGGER ALL;
ALTER TABLE file_entities ENABLE TRIGGER ALL;
ALTER TABLE files ENABLE TRIGGER ALL;
ALTER TABLE fs_events ENABLE TRIGGER ALL;
ALTER TABLE gift_codes ENABLE TRIGGER ALL;
ALTER TABLE group_storage_policies ENABLE TRIGGER ALL;
ALTER TABLE groups ENABLE TRIGGER ALL;
ALTER TABLE metadata ENABLE TRIGGER ALL;
ALTER TABLE nodes ENABLE TRIGGER ALL;
ALTER TABLE oauth_clients ENABLE TRIGGER ALL;
ALTER TABLE oauth_grants ENABLE TRIGGER ALL;
ALTER TABLE open_ids ENABLE TRIGGER ALL;
ALTER TABLE passkeys ENABLE TRIGGER ALL;
ALTER TABLE payments ENABLE TRIGGER ALL;
ALTER TABLE policy_load_balances ENABLE TRIGGER ALL;
ALTER TABLE settings ENABLE TRIGGER ALL;
ALTER TABLE share_purchases ENABLE TRIGGER ALL;
ALTER TABLE shares ENABLE TRIGGER ALL;
ALTER TABLE storage_packs ENABLE TRIGGER ALL;
ALTER TABLE storage_policies ENABLE TRIGGER ALL;
ALTER TABLE tasks ENABLE TRIGGER ALL;
ALTER TABLE users ENABLE TRIGGER ALL;
```

---

# 验证和修复  

## 验证运行  
重新运行Cloudreve，检查运行情况，发现报错  
```log
cloudreve[2494]: [Error]         2026-02-08 10:09:33 [/home/aaronliu/vsts/_work/1/s/pkg/logging/audit/audit.go:138] Audit log flush: failed to create audit log: %!w(*fmt.wrapError=&{insert nodes to table "audit_logs": pq: 重复键违反唯一约束"audit_logs_pkey" 0xc000743d40})
```

这是因为迁移后自增id值没有在最大值+1  

查看表的序列值  
```sql
SELECT last_value, is_called FROM <表名>_id_seq;
-- 比如要查files这个表的序列值，就是
-- SELECT last_value, is_called FROM files_id_seq;
```
发现确实序列不对，准备修复  

## 修复数据库  

修复单个表时可以用这个命令  
```sql
SELECT setval('<表名>_id_seq', (SELECT max(id) FROM <表名>));
```

但是表比较多，手工执行比较麻烦，可以循环执行  
```sql
DO $$
    DECLARE
        rec RECORD;
        seq_name TEXT;
        max_val BIGINT;
        next_start BIGINT;
    BEGIN
        -- 只查找可能有 SERIAL/IDENTITY 的以 id 命名，且类型为 integer 或 bigint的列
        FOR rec IN
            SELECT
                c.table_schema,
                c.table_name,
                c.column_name
            FROM information_schema.columns c
            WHERE c.column_name = 'id'
              AND c.data_type IN ('integer', 'bigint')
              AND c.table_schema = 'public'          -- schema，一般都是public
              AND EXISTS (
                SELECT 1
                FROM information_schema.tables t
                WHERE t.table_schema = c.table_schema
                  AND t.table_name = c.table_name
            )
            ORDER BY c.table_schema, c.table_name
            LOOP
                -- 获取该列关联的序列名称（SERIAL / IDENTITY 都会被 pg_get_serial_sequence 识别）
                seq_name := pg_get_serial_sequence(
                        format('%I.%I', rec.table_schema, rec.table_name),
                        rec.column_name
                            );

                -- 如果没有找到序列（手动创建的 id、非序列列、普通整数字段等），跳过
                IF seq_name IS NULL THEN
                    RAISE NOTICE '表 %.% 列 % 无关联序列，跳过',
                        rec.table_schema, rec.table_name, rec.column_name;
                    CONTINUE;
                END IF;

                -- 获取最大值（空表或无id的表返回 NULL 转为 0）
                EXECUTE format('
            SELECT COALESCE(MAX(%I), 0)
            FROM %I.%I
        ', rec.column_name, rec.table_schema, rec.table_name)
                    INTO max_val;

                -- 计算下一个值
                next_start := max_val + 1;

                -- 重置序列
                EXECUTE format('
            SELECT setval(%L, %s, false)
        ', seq_name, next_start);

                RAISE NOTICE '表 %.% 序列 % 已重置：最大 id = % ，下次从为 % ',
                    rec.table_schema, rec.table_name, seq_name,
                    max_val, next_start;
            END LOOP;

        RAISE NOTICE '所有序列以已重置';
    END $$;
```

完成修复后再次启动Cloudreve，运行正常且不出现数据库写入失败的情况  
至此完成数据库迁移  

---

# 问题和思考  

## 遇到的问题  

### 表group引发的问题  
实际操作中发现，如果清空group组直接导入旧数据，会出现登录状态异常的情况  
表现为Admin组无法打开管理面板，所有组无法打开设置选项  
如果在运行Cloudreve新实例后创建的group中手动将所有字段改为旧数据库中的值则不会存在问题  
这是一个莫名其妙的问题，我找不出来是什么原因但是真的让我很崩溃  

### 正则匹配存在贪心问题  
因为对正则表达式不熟，最开始匹配的时候经常一不小心就把时间的整个小数部分给匹配没了  
要不就是直接从`created_at`表里匹配到`updated_at`表的最后去了  
而那时候我用的是Sublime，处理15万行的CSV还是会卡一会的，错了还得重来  
后来想到可以用`sed -i`来处理，人家本来就是做匹配替换的，而且无GUI操作就快多了  

## 思考  

### 顺序导入表  
查资料显示，可以在`su postgres`后通过`psql -d <数据库名>`连接到指定数据库  
通过`\d <表名>`可以查看外键依赖关系  
然后应该用什么方法得知导入表的顺序  
~~毕竟不解除约束是最优雅的做法~~  

### 不禁用触发器  
前文导入表的时候因为存在外键约束而禁用了触发器  
如果不禁用触发器导入，表的序列值是否会被触发器自动更新  
如果会就不需要手动重置序列了，更安全  