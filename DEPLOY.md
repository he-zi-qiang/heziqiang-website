# 部署到服务器

目标环境：阿里云 Ubuntu 22.04，2 核 2 GiB，已经跑着 nginx，域名 `heziqiang.com`。

架构很简单：**一个 Node 进程** 同时提供 API 和前端页面（生产模式下 Fastify 会伺服 `web/dist`，
并把未知路径回落到 `index.html`），nginx 只做反向代理和 TLS。不需要再配一个前端静态站点。

```
浏览器 ──HTTPS──► nginx ──http://127.0.0.1:3001──► Node (Fastify)
                                                   ├─ /api/*      接口
                                                   ├─ /uploads/*  图片
                                                   └─ /*          web/dist
```

---

## 1. 准备运行时

Ubuntu 22.04 自带的 Node 太老，装 22 LTS 或更新：

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git
node -v
```

## 2. 拉代码

```bash
sudo mkdir -p /srv/heziqiang.com
sudo chown "$USER" /srv/heziqiang.com
git clone <你的仓库地址> /srv/heziqiang.com
cd /srv/heziqiang.com
```

## 3. 配环境变量

```bash
cp server/.env.example server/.env
```

生成两个真随机密钥填进去（**不要用示例里的默认值**）：

```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log('COOKIE_SECRET=' + require('crypto').randomBytes(48).toString('hex'))"
```

`server/.env` 生产环境应该长这样：

```ini
NODE_ENV=production
DATABASE_URL="file:../data/site.db"
SERVER_PORT=3001
HOST=127.0.0.1
JWT_SECRET="刚才生成的那串"
COOKIE_SECRET="另一串"
CORS_ORIGIN=""                 # 同源部署，留空即可（留空就完全不注册 CORS）
ADMIN_USERNAME="你自己的登录名"     # 别用容易猜的，也别写进任何进版本库的文件
ADMIN_PASSWORD="一个只用一次的临时密码"
ADMIN_DISPLAY_NAME="何梓强"
UPLOAD_DIR="uploads"
```

> `HOST=127.0.0.1` 意味着进程只监听本机，公网只能通过 nginx 进来。
> `ADMIN_PASSWORD` 只在第一次 seed 时用到，登录后马上到后台「账号」页改掉。

## 4. 装依赖、建库、构建

```bash
PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma npm install
npm install-scripts approve @prisma/client prisma @prisma/engines esbuild   # npm 11 需要
npm run db:push -w server
npm run db:seed -w server
npm run build
```

2 GiB 内存跑 `vite build` 有点紧，如果 OOM，先确认 swap 还在（`free -h`），
或者在本地构建好之后把 `web/dist` 一起传上去。

## 5. systemd 托管

```bash
sudo tee /etc/systemd/system/heziqiang-site.service > /dev/null <<'EOF'
[Unit]
Description=heziqiang.com 个人网站
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/heziqiang.com/server
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production
User=www-data
Group=www-data
# 数据库和上传目录要可写
ReadWritePaths=/srv/heziqiang.com/server/data /srv/heziqiang.com/server/uploads
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full

[Install]
WantedBy=multi-user.target
EOF

sudo chown -R www-data:www-data /srv/heziqiang.com/server/data /srv/heziqiang.com/server/uploads
sudo systemctl daemon-reload
sudo systemctl enable --now heziqiang-site
sudo systemctl status heziqiang-site --no-pager
curl -s http://127.0.0.1:3001/api/health
```

## 6. nginx

**改生产配置之前先备份、改完先 `nginx -t`。**

```bash
sudo cp /etc/nginx/sites-available/heziqiang.com /etc/nginx/sites-available/heziqiang.com.bak.$(date +%F)
```

站点段落改成反代（TLS 部分按你现有的 certbot 配置保留）：

```nginx
server {
    listen 443 ssl http2;
    server_name heziqiang.com www.heziqiang.com;

    # ssl_certificate / ssl_certificate_key 保留现有的

    # 上传的图片交给 nginx 直接发，不进 Node
    location /uploads/ {
        alias /srv/heziqiang.com/server/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 带指纹的构建产物可以长缓存
    location /assets/ {
        alias /srv/heziqiang.com/web/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        client_max_body_size 10m;   # 要大于后端 8 MB 的单文件上限
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

`nginx -t` 不过就直接把备份还原回去，别 reload。

## 7. 收尾

1. 打开 `https://heziqiang.com/admin` 登录。
2. 立刻到「账号」页把密码改掉。
3. 顺手把 `server/.env` 里的 `ADMIN_PASSWORD` 也改成别的（它只在 seed 时读，留着是个隐患）。

旧的静态站根目录 `/var/www/heziqiang.com` 在确认新站没问题之前先别删。

---

## 更新一次

```bash
cd /srv/heziqiang.com
git pull
PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma npm install
npm run db:push -w server        # 只有改过 schema.prisma 才需要
npm run build
sudo systemctl restart heziqiang-site
```

## 备份

要紧的只有两样：`server/data/site.db` 和 `server/uploads/`。

```bash
# 服务器上
cd /srv/heziqiang.com
npm run db:export -w server            # 内容导成可读 JSON
tar czf ~/site-backup-$(date +%F).tar.gz server/data server/uploads server/prisma/seed-data.json
```

把导出的 `seed-data.json` 和 `uploads/` 提交回仓库，内容就等于有了一份带历史的版本化备份；
真出事时 `git clone` + `npm run setup` 可以完整重建。

## 出问题先看哪儿

```bash
sudo journalctl -u heziqiang-site -n 100 --no-pager   # 后端日志
sudo tail -50 /var/log/nginx/error.log                # nginx
curl -s http://127.0.0.1:3001/api/health              # 进程活着吗
free -h                                               # 2G 机器，先怀疑内存
```

| 症状 | 多半是 |
|---|---|
| 502 | Node 没起来，看 journalctl |
| 页面能开但接口 500 | `server/.env` 缺项或 DATABASE_URL 路径不对 |
| 刷新内页 404 | 请求没走到 Node（nginx 的 location 顺序不对） |
| 登录成功但立刻退出 | cookie 没带上，检查是不是 HTTPS 且 `NODE_ENV=production` |
| 上传报 413 | nginx 的 `client_max_body_size` 太小 |
