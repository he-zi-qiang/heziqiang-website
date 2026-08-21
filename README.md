# 何梓强 · 个人网站

前后端分离的个人站点。前端 **Vue 3 + Vite**，后端 **Fastify + Prisma + SQLite**，带一个登录保护的写作后台。
设计沿用重构前那套「暖白纸面」系统：宋体 + Source Serif 4、赭石强调色、深浅色、专业／个人双身份切换——
样式表是逐行搬过来的，视觉上没有任何改动。

以前加一篇文章要手写一个 HTML 文件；现在打开 `/admin` 写 Markdown，点发布。

---

## 目录结构

```
.
├── server/                     后端
│   ├── prisma/
│   │   ├── schema.prisma       数据模型：User / Entry / Photo / SiteDoc
│   │   ├── seed.ts             用 seed-data.json 初始化数据库（幂等）
│   │   ├── export.ts           反向：把数据库导回 seed-data.json
│   │   ├── import-legacy.ts    一次性迁移：解析 legacy/*.html
│   │   └── seed-data.json      ★ 站点内容的版本化副本
│   ├── src/
│   │   ├── index.ts            入口
│   │   ├── app.ts              Fastify 装配（CORS / 上传 / 静态 / SPA 回落）
│   │   ├── env.ts              环境变量校验（zod）
│   │   ├── db.ts               Prisma 单例
│   │   ├── plugins/auth.ts     JWT + httpOnly cookie 会话
│   │   ├── routes/
│   │   │   ├── public.ts       公开只读接口
│   │   │   ├── auth.ts         登录 / 登出 / 改密码
│   │   │   └── admin.ts        后台写接口（全部需要登录）
│   │   ├── lib/                markdown / 口令哈希 / 序列化 / 栏目定义
│   │   └── schemas/            zod 输入与文档结构
│   ├── data/                   SQLite 文件（不进版本库）
│   └── uploads/                上传的图片（进版本库，属于站点内容）
│
├── web/                        前端
│   ├── src/
│   │   ├── assets/style.css    ★ 原样保留的纸面设计系统
│   │   ├── assets/admin.css    后台样式
│   │   ├── api/                请求封装与类型
│   │   ├── composables/        主题 / 身份 / 取数 / 会话 / SEO
│   │   ├── components/         页眉页脚、条目列表、定义式行…
│   │   ├── views/              站点页面
│   │   └── views/admin/        后台页面
│   └── vite.config.ts          开发时把 /api、/uploads 反代到 3001
│
└── legacy/                     重构前的静态站，仅作对照存档，可删
```

---

## 跑起来

```bash
npm run setup
```

这一条会装依赖、建库、灌入 `seed-data.json` 里的全部内容，并创建管理员账号。
装依赖前先把 `server/.env.example` 复制成 `server/.env`（`setup` 不会替你改密码）。

然后：

```bash
npm run dev
```

- 站点 → http://localhost:5173
- 后台 → http://localhost:5173/admin
- 接口 → http://localhost:3001/api

账号来自 `server/.env` 里的 `ADMIN_USERNAME` / `ADMIN_PASSWORD`，**第一次登录后请立刻在「账号」页改掉**。

> 国内网络下 Prisma 的引擎二进制常常拉不动，装依赖时加个镜像：
> ```bash
> PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma npm install
> ```
> npm 11 默认拦截安装脚本，首次安装若提示 `packages have install scripts`，执行：
> ```bash
> npm install-scripts approve @prisma/client prisma @prisma/engines esbuild
> ```

---

## 内容模型

四张表，够用就好：

| 表 | 装什么 |
|---|---|
| `Entry` | 列表型内容。`kind` 分栏目：`writing` 文章 / `project` 项目 / `essay` 随笔 / `reading` 阅读 / `learning` 学习记录 |
| `Photo` | 摄影页的每一格 |
| `SiteDoc` | 不属于任何栏目的固定文案，一个 key 一份 JSON：`site` `home` `about` `cv` `sections` `nav` `ui` |
| `User` | 管理员账号（通常就一个） |

两个刻意的设计：

**正文留空 = 没有内页。** 旧站里有些条目可以点进去，有些只是列表上的一行字。这个区别现在由
「`bodyMd` 是不是空的」决定，不需要额外的开关。

**站点上没有写死的文字。** 从首页引言到页眉的 Professional/Personal、面包屑、
「打印 / 存为 PDF」、照片占位、加载与出错提示、404 页——凡是访客能看到的固定文案，
都在 `SiteDoc` 里，后台「单页」那几个标签页可改。生产模式下连 `index.html` 的
`<title>` 和 `description` 都会按「站点信息」重写一遍，所以爬虫拿到的也是后台里那份。
代码里保留的少量默认值只在接口取不到时兜底，不是文案的来源。

**Markdown 在写入时就渲染成 HTML 存下来。** 读者请求页面时后端直接吐 `bodyHtml`，不重复解析；
前端的公开页面因此完全不需要打包 Markdown 解析器（它只出现在后台编辑器那个懒加载分块里）。
首页引言的 `*强调*`、简历里的链接同理，也由后端渲染好再下发。

---

## 接口

公开（只读，不需要登录）：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/bootstrap` | 页眉页脚 + 首页文案 + 栏目名称 + 导航 + 界面文案，进站取一次 |
| GET | `/api/docs/:key` | 单页内容，Markdown 已渲染 |
| GET | `/api/entries?kind=` | 栏目列表，已按分组小标题分好组 |
| GET | `/api/entries/:slug` | 内页，含上一篇／下一篇 |
| GET | `/api/photos` | 照片 |
| GET | `/api/health` | 存活检查 |

会话与后台（`/api/admin/*` 全部需要登录）：

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/login` | 登录，5 分钟内最多 8 次 |
| POST | `/api/auth/logout` · `/api/auth/password` | 登出 / 改密码 |
| GET/POST/PATCH/DELETE | `/api/admin/entries[/:id]` | 内容增删改查 |
| POST | `/api/admin/entries/reorder` | 批量调整顺序 |
| GET/PUT | `/api/admin/docs/:key` | 单页文档（读到的是 Markdown 源码） |
| GET/POST/PATCH/DELETE | `/api/admin/photos[/:id]` | 照片 |
| POST/GET | `/api/admin/uploads` | 上传图片 / 列出已上传 |
| GET | `/api/admin/stats` | 概览数字 |

**会话放在 httpOnly cookie 里**，不落 localStorage，XSS 偷不走。
口令用 Node 内置的 `scrypt` 哈希，不引入任何需要编译的原生依赖。

---

## 内容怎么备份

数据库文件不进版本库，但内容进。写完东西之后：

```bash
npm run db:export     # 数据库 → server/prisma/seed-data.json
git add server/prisma/seed-data.json server/uploads
git commit -m "内容：..."
```

反过来，`npm run db:seed` 会把 JSON 灌回数据库。所以 **clone 仓库 + `npm run setup` 就能还原整个站**，
包括所有文章、照片和单页文案。

---

## 常用命令

| 命令 | 作用 |
|---|---|
| `npm run dev` | 前后端一起起 |
| `npm run build` | 后端 tsc + 前端 vite build |
| `npm start` | 生产模式跑后端（会一并伺服 `web/dist`） |
| `npm run typecheck` | 两端类型检查 |
| `npm run db:export` | 数据库 → seed-data.json |
| `npm run db:seed` | seed-data.json → 数据库 |
| `npm run db:push` | 改完 schema.prisma 后同步表结构 |
| `npm run db:studio` | 打开 Prisma Studio 直接看表 |

---

## 部署

见 [DEPLOY.md](DEPLOY.md)。要点：后端在生产模式下会自动伺服 `web/dist` 并对未知路径回落到
`index.html`，所以**一个 Node 进程 + 一段 nginx 反代**就够了，不需要另外配前端静态站。

---

## 与旧站不同的几处

视觉整体逐像素一致，只动了两处旧站本来就存在的毛病：

1. **列表中间多出的横线。** 旧样式里 `.entry:last-of-type` 会让「最后一个 `<a>`」和
   「最后一个 `<div>`」各自收一条底边，混排的列表（比如文章页 2026 那组）因此会在中间多一条线。
   改成了 `.entry:last-child`，语义就是「本组最后一条」。
2. **窄屏页眉溢出。** 375px 宽时站名会被挤成三行、深浅色按钮被推出屏幕。
   现在 560px 以下页眉折成两行：上行身份，下行切换。

首页那个纸面／强调色微调面板还在，但不再用 unpkg 上的 React + Babel 三个 CDN 脚本实现，
改成了一个 Vue 组件，并且**只在开发环境挂载**——访客加载的代码里一行都没有。

---

## 还没做的

- **SEO**：单页应用没有服务端渲染，标题和 description 是路由切换时用 JS 写进去的。
  搜索引擎大多能执行 JS，但要更稳妥就得加预渲染（`vite-plugin-prerender` 之类）或换 SSR。
- **摄影页的图**：4 格都还是占位，到后台「照片」页上传即可。
- **RSS / 访客留言 / 阅读量统计**：这轮没做，数据模型留了位置。
