/* ============================================================
   何梓强 · 个人网站 — 全站共享脚本
   职责：
     1) 尽早恢复纸面 / 深浅色，避免首屏闪烁（在 <head> 中同步执行）
     2) 统一注入页眉(site-head) 与页脚(site-foot)——全站唯一来源
     3) 深浅色切换
     4) 首页的「专业 / 个人」身份切换
   页面只需在 <body> 上声明：
     data-section="pro|personal"   决定页眉里高亮哪一侧、面包屑回链方向
     data-home                     首页专用：使用可点击的交互式身份开关
   并在需要的位置放置占位元素：
     <div id="site-head"></div>
     <div id="site-foot"></div>
   ============================================================ */
(function () {
  'use strict';

  var STYLE_KEY = 'hz-style-v2';
  var THEME_KEY = 'hz-theme';
  var MODE_KEY = 'hz-mode';
  var root = document.documentElement;

  /* —— 1. 首屏前恢复个性化设置（同步执行，越早越好） —— */
  try {
    var s = JSON.parse(localStorage.getItem(STYLE_KEY) || '{}');
    if (s.accent) { root.style.setProperty('--accent', s.accent); }
    if (s.paper) { root.style.setProperty('--paper', s.paper); }
  } catch (e) {}

  try {
    var savedTheme = localStorage.getItem(THEME_KEY);
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      root.setAttribute('data-theme', 'dark');
    }
  } catch (e) {}

  function isDark() { return root.getAttribute('data-theme') === 'dark'; }
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* —— 2. 页眉 / 页脚模板（改这里就改了全站） —— */
  function headerHTML(opts) {
    var section = opts.section === 'personal' ? 'personal' : 'pro';
    var glyph = isDark() ? '◑' : '◐';
    var themeTitle = isDark() ? '切换到明亮 · Light' : '切换到暗色 · Dark';

    var name = opts.home
      ? '<span class="name">何梓强 · He Ziqiang</span>'
      : '<a class="name" href="index.html">何梓强 · He Ziqiang</a>';

    var toggle = opts.home
      ? '<nav class="mode-toggle" aria-label="身份切换">'
          + '<span id="t-pro"' + (section === 'pro' ? ' class="on"' : '') + '>Professional</span>'
          + '<span id="t-personal"' + (section === 'personal' ? ' class="on"' : '') + '>Personal</span>'
        + '</nav>'
      : '<nav class="mode-toggle">'
          + '<a' + (section === 'pro' ? ' class="on"' : '') + ' href="index.html?mode=pro">Professional</a>'
          + '<a' + (section === 'personal' ? ' class="on"' : '') + ' href="index.html?mode=personal">Personal</a>'
        + '</nav>';

    return '<header class="site-head">'
        + '<div class="site-id">'
          + '<img src="assets/avatar.png" alt="何梓强" />'
          + name
        + '</div>'
        + '<div class="head-right">'
          + toggle
          + '<button class="theme-btn" id="theme-link" type="button" aria-label="切换深浅色" title="'
            + themeTitle + '">' + glyph + '</button>'
        + '</div>'
      + '</header>';
  }

  function footerHTML() {
    return '<footer class="site-foot">'
        + '<span>© 2024–2026 何梓强</span>'
        + '<span>始于 2024 · 长期维护</span>'
      + '</footer>';
  }

  /* —— 3. 深浅色切换 —— */
  function updateThemeButton() {
    var el = document.getElementById('theme-link');
    if (!el) { return; }
    el.textContent = isDark() ? '◑' : '◐';
    el.title = isDark() ? '切换到明亮 · Light' : '切换到暗色 · Dark';
    el.setAttribute('aria-pressed', isDark() ? 'true' : 'false');
  }

  window.hzToggleTheme = function () {
    var apply = function () {
      var dark = isDark();
      if (dark) { root.removeAttribute('data-theme'); }
      else { root.setAttribute('data-theme', 'dark'); }
      try { localStorage.setItem(THEME_KEY, dark ? 'light' : 'dark'); } catch (e) {}
      updateThemeButton();
    };
    if (document.startViewTransition && !prefersReducedMotion()) {
      var vt = document.startViewTransition(apply);
      if (vt && vt.finished && vt.finished.catch) { vt.finished.catch(function () {}); }
      if (vt && vt.ready && vt.ready.catch) { vt.ready.catch(function () {}); }
    } else {
      apply();
    }
  };

  /* —— 4. 首页身份切换（仅当存在交互式开关时生效） —— */
  function initModeToggle() {
    var tPro = document.getElementById('t-pro');
    var tPersonal = document.getElementById('t-personal');
    if (!tPro || !tPersonal) { return; }
    var body = document.body;

    function setMode(m, store) {
      body.setAttribute('data-mode', m);
      tPro.classList.toggle('on', m === 'pro');
      tPersonal.classList.toggle('on', m === 'personal');
      if (store) {
        try { localStorage.setItem(MODE_KEY, m); } catch (e) {}
        try { history.replaceState(null, '', m === 'personal' ? '?mode=personal' : '?mode=pro'); } catch (e) {}
      }
    }

    function switchTo(m) {
      if (body.getAttribute('data-mode') === m) { return; }
      if (document.startViewTransition && !prefersReducedMotion()) {
        var vt = document.startViewTransition(function () { setMode(m, true); });
        if (vt && vt.finished && vt.finished.catch) { vt.finished.catch(function () {}); }
        if (vt && vt.ready && vt.ready.catch) { vt.ready.catch(function () {}); }
      } else {
        setMode(m, true);
        if (!prefersReducedMotion()) {
          var sec = document.querySelector(m === 'pro' ? '.only-pro' : '.only-personal');
          if (sec) {
            sec.classList.remove('mode-enter');
            void sec.offsetWidth;
            sec.classList.add('mode-enter');
          }
        }
      }
    }

    var param = new URLSearchParams(location.search).get('mode');
    var saved = null;
    try { saved = localStorage.getItem(MODE_KEY); } catch (e) {}
    setMode(param === 'personal' || (!param && saved === 'personal') ? 'personal' : 'pro', false);

    tPro.addEventListener('click', function () { switchTo('pro'); });
    tPersonal.addEventListener('click', function () { switchTo('personal'); });
  }

  /* —— 5. 装配：注入页眉/页脚并接线 —— */
  function mount() {
    var body = document.body;
    var opts = {
      section: body.getAttribute('data-section') || 'pro',
      home: body.hasAttribute('data-home')
    };

    var headSlot = document.getElementById('site-head');
    if (headSlot) { headSlot.outerHTML = headerHTML(opts); }
    var footSlot = document.getElementById('site-foot');
    if (footSlot) { footSlot.outerHTML = footerHTML(); }

    // 深浅色按钮（注入后才存在）
    updateThemeButton();
    var themeBtn = document.getElementById('theme-link');
    if (themeBtn) {
      themeBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        window.hzToggleTheme();
      });
    }

    // 首页身份切换
    initModeToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
