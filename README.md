# 何梓强 · 个人网站

一个纯静态的个人网站：暖白纸面设计、宋体 + Source Serif 4 衬线、赭石强调色，支持「专业 / 个人」双身份切换与深浅色模式。无需任何构建工具，直接由静态文件服务即可。

## 目录结构

```
.
├── index.html                  首页（专业 / 个人双身份索引）
├── about.html                  关于我
├── projects.html               项目列表 ──┐
│   └── project-task-planner.html          项目内页：任务规划器
├── writing.html                文章列表 ──┐
│   └── writing-agent-memory.html          文章内页：Agent 的记忆
├── cv.html                     简历（支持打印 / 存 PDF）
├── essays.html                 随笔列表 ──┐
│   └── essay-slow-notes.html              随笔内页：把笔记写得慢一点
├── reading.html                阅读笔记
├── learning.html               学习记录
├── photos.html                 摄影与观察（image-slot 拖拽占位）
├── 404.html                    错误页
├── assets/
│   ├── style.css               全站样式与设计系统（含深色变量）
│   ├── site.js                 全站脚本：注入页眉/页脚、深浅色、身份切换
│   ├── image-slot.js           photos 页面用的图片拖拽占位组件
│   ├── tweaks-panel.jsx        首页右下角的纸面/强调色微调面板（作者本地预览用）
│   └── avatar.png              头像 / favicon
├── uploads/                    上传的图片素材
└── drafts/                     设计草稿（未链接进站点，仅作存档）
    ├── 首页方向探索.html
    └── design-canvas.jsx
```

## 设计要点：页眉 / 页脚只有一处来源

过去每个页面都把 `<header>` 和 `<footer>` 手抄一遍，改一次导航要改十几个文件。现在它们**统一由 `assets/site.js` 注入**，页面里只留占位元素：

```html
<div id="site-head"></div>
...
<div id="site-foot"></div>
```

页眉的形态由 `<body>` 上的两个属性声明：

| 属性 | 取值 | 作用 |
|------|------|------|
| `data-section` | `pro` / `personal` | 高亮页眉中对应的身份、决定面包屑回链方向 |
| `data-home` | 出现即生效 | 首页专用：使用可点击的交互式身份开关（其余页面为普通链接） |

要改导航、站名、页脚版权，只改 `assets/site.js` 里的 `headerHTML()` / `footerHTML()` 即可，全站同步生效。

## 新增一个页面

1. 复制任意一个内容页（如 `about.html`）当模板。
2. 改 `<title>`、`<meta name="description">` 和 `<main>` 里的正文。
3. 设好 `<body>` 的 `data-section`（`pro` 或 `personal`）。
4. 保留 `<div id="site-head"></div>` 与 `<div id="site-foot"></div>` 占位。
5. 面包屑 `.crumb` 属于页面内容，按需手写指向上一级。

## 本地预览

因为页面用的是相对路径、且 `image-slot.js` 会请求同源文件，请从站点根目录起一个本地服务器，不要直接 `file://` 打开：

```bash
cd 个人网站
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

## 部署

整个目录就是成品，拷贝到任意静态服务器的站点根目录即可（Nginx / GitHub Pages / 对象存储均可）。注意必须从**根目录**提供服务，使 `assets/...` 这类相对路径可达。

## 待办（占位内容）

- `about.html` 里的联系方式仍是占位：邮箱 `hello@example.com`、GitHub 链接为 `#`，上线前请替换为真实信息。
- `photos.html` 的照片为拖拽占位（`image-slot`），尚未填入正式图片。
