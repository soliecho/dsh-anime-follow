window.__ModuleLoader__.load({
  id: "@soliecho/dsh-anime-follow",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    const React = require("react");
    const h = React.createElement;
    const PANEL = "anime-follow";
    const API = "/api/anime-follow";

    const css = `
.ab-root{
  --ab-bg:#FBF7FB;
  --ab-top:#FFF4F9;
  --ab-card:#FFFFFF;
  --ab-card-2:#F8F2FB;
  --ab-ink:#3D3548;
  --ab-ink-2:#6E6479;
  --ab-ink-3:#93899F;
  --ab-line:#F0E7F5;
  --ab-accent:#7C6BEA;
  --ab-accent-ink:#6350D8;
  --ab-accent-2:#FF9EC4;
  --ab-accent-soft:#EFEAFF;
  --ab-ok:#2E8A68;--ab-ok-bg:#E2F8EF;
  --ab-warn:#A8701C;--ab-warn-bg:#FFF0DE;
  --ab-danger:#C0556F;--ab-danger-bg:#FFE5EA;
  --ab-shadow:0 10px 28px rgba(126,104,160,.10);
  height:100%;min-height:0;overflow:auto;box-sizing:border-box;
  --ab-gutter:28px;
  padding:0 var(--ab-gutter) 64px;color:var(--ab-ink);
  background:linear-gradient(180deg,#FFF4F9 0,#FBF7FF 260px,#FBF7FB 100%);
  font-size:14px;line-height:1.55;-webkit-font-smoothing:antialiased;
}
.ab-root[data-ab-theme="dark"]{
  --ab-bg:#211D2B;--ab-top:#2A2236;--ab-card:#2B2637;--ab-card-2:#332D40;
  --ab-ink:#F3EFF8;--ab-ink-2:#C9C1D8;--ab-ink-3:#938AA3;--ab-line:#3A3347;
  --ab-accent:#B9A7FF;--ab-accent-ink:#D9CEFF;--ab-accent-2:#FFB3D1;--ab-accent-soft:#3A3152;
  --ab-ok:#8FE6C0;--ab-ok-bg:#243A33;
  --ab-warn:#FFD3A1;--ab-warn-bg:#3D3326;
  --ab-danger:#FFB3BF;--ab-danger-bg:#3F2A33;
  --ab-shadow:0 10px 28px rgba(0,0,0,.35);
  background:linear-gradient(180deg,#2A2236 0,#241F2E 260px,#211D2B 100%);
}
.ab-root *{box-sizing:border-box}
.ab-root button,.ab-root input,.ab-root textarea{font-family:inherit}
.ab-root :focus-visible{outline:2px solid var(--ab-accent);outline-offset:2px}
.ab-icon{font-size:16px;line-height:1;display:inline-flex;align-items:center;justify-content:center}

/* ── 顶部栏 ── */
.ab-topbar{position:sticky;top:0;z-index:40;margin:0 calc(-1 * var(--ab-gutter));padding:0 var(--ab-gutter);
  background:rgba(251,247,251,.86);backdrop-filter:blur(14px);
  border-bottom:1px solid rgba(240,231,245,.75)}
.ab-topbar-inner{display:flex;align-items:center;gap:14px;width:100%;max-width:1240px;margin:0 auto;padding:16px 0 14px}
.ab-root[data-ab-theme="dark"] .ab-topbar{background:rgba(33,29,43,.86);border-bottom-color:rgba(58,51,71,.8)}
/* 搜索浮层打开时顶栏让位：背景透明，直接露出下层压暗遮罩，避免出现发光横条；
   品牌与状态按钮同时淡出，视觉焦点只留在搜索框和结果列表上。 */
.ab-root[data-ab-layer="1"] .ab-topbar{background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none;
  border-bottom-color:transparent;box-shadow:none}
.ab-root[data-ab-layer="1"] .ab-brand,
.ab-root[data-ab-layer="1"] .ab-top-actions{opacity:.4;pointer-events:none}
.ab-root[data-ab-layer="1"] .ab-search{box-shadow:0 14px 30px rgba(61,53,72,.16)}
.ab-brand{display:flex;align-items:center;gap:8px;font-size:19px;font-weight:700;letter-spacing:-.01em;white-space:nowrap}
.ab-brand::before{content:"";width:11px;height:11px;border-radius:4px;
  background:linear-gradient(135deg,var(--ab-accent-2),var(--ab-accent));display:inline-block;flex:none}
.ab-searchbox{position:relative;flex:1;max-width:520px;min-width:0}
.ab-search{display:flex;align-items:center;gap:8px;height:40px;padding:0 14px;
  background:var(--ab-card);border:1px solid var(--ab-line);border-radius:999px;
  box-shadow:0 4px 14px rgba(126,104,160,.06);transition:border-color .15s,box-shadow .15s}
.ab-search[data-focus="1"]{border-color:rgba(124,107,234,.5);box-shadow:0 8px 22px rgba(126,104,160,.14)}
.ab-search>.ab-muted{color:var(--ab-accent-2);font-size:15px}
.ab-search input{flex:1;min-width:0;border:0;outline:none;background:transparent;color:inherit;font-size:14px;height:100%}
.ab-search input:focus,.ab-search input:focus-visible{outline:none;box-shadow:none}
.ab-search input::placeholder{color:var(--ab-ink-3)}
.ab-go{border:0;background:transparent;color:var(--ab-ink-3);cursor:pointer;font-size:15px;padding:2px 4px;line-height:1;border-radius:999px}
.ab-go:hover:not(:disabled){color:var(--ab-accent)}
.ab-go:disabled{cursor:progress;opacity:.5}
.ab-search .ab-go[aria-label="搜索"]{width:26px;height:26px;padding:0;border-radius:50%;background:var(--ab-accent);color:#fff;
  display:inline-flex;align-items:center;justify-content:center;font-size:14px}
.ab-search .ab-go[aria-label="搜索"]:hover:not(:disabled){color:#fff;opacity:.9}
.ab-root[data-ab-theme="dark"] .ab-search .ab-go[aria-label="搜索"]{color:#241F2E}
.ab-top-actions{display:flex;align-items:center;gap:8px;margin-left:auto}
.ab-dots{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--ab-ink-3);white-space:nowrap}
.ab-dot-item{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:999px;background:var(--ab-card);border:1px solid var(--ab-line)}
.ab-icon-btn{border:1px solid var(--ab-line);background:var(--ab-card);color:var(--ab-ink-2);
  height:34px;min-width:34px;padding:0 9px;border-radius:999px;cursor:pointer;font-size:14px;line-height:1;
  box-shadow:0 3px 10px rgba(126,104,160,.06);transition:background .12s,transform .1s}
.ab-icon-btn:hover:not(:disabled){background:var(--ab-card-2);color:var(--ab-accent)}
.ab-icon-btn:active:not(:disabled){transform:translateY(1px)}
.ab-icon-btn:disabled{opacity:.4;cursor:not-allowed}

/* ── 主区 ── */
.ab-main{width:100%;max-width:1240px;margin:0 auto;padding-top:20px}
.ab-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px}
.ab-toolbar-info{color:var(--ab-ink-3);font-size:12px}
.ab-toolbar-info strong{color:var(--ab-ink-2);font-weight:600}
.ab-toolbar-actions{display:flex;gap:8px;flex-wrap:wrap}
.ab-subs{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:20px 18px;align-items:stretch}
.ab-subcard{border:0;padding:0;background:transparent;text-align:left;cursor:pointer;color:inherit;min-width:0;border-radius:18px;
  display:flex;flex-direction:column;height:100%}
.ab-poster{position:relative;width:100%;height:0;padding-top:150%;border-radius:16px;overflow:hidden;
  background:var(--ab-card-2);box-shadow:0 8px 22px rgba(126,104,160,.12);
  transition:transform .18s,box-shadow .18s}
.ab-subcard:hover .ab-poster{transform:translateY(-4px);box-shadow:0 16px 34px rgba(139,124,246,.22)}
.ab-poster img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.ab-poster-ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  font-size:30px;font-weight:700;color:var(--ab-ink-3);opacity:.8}
.ab-badge{position:absolute;top:9px;left:9px;padding:3px 9px;border-radius:999px;
  font-size:10.5px;font-weight:600;line-height:1.6;background:rgba(255,255,255,.94);
  color:var(--ab-ink-2);box-shadow:0 3px 10px rgba(61,53,72,.12);backdrop-filter:blur(6px)}
.ab-badge[data-tone="ok"]{background:rgba(226,248,239,.96);color:var(--ab-ok)}
.ab-badge[data-tone="warn"]{background:rgba(255,240,222,.96);color:var(--ab-warn)}
.ab-badge[data-tone="brand"]{background:rgba(237,231,255,.96);color:var(--ab-accent-ink)}
.ab-subcard-title{margin:11px 1px 3px;font-size:13px;font-weight:600;line-height:1.4;min-height:2.8em;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;transition:color .12s}
.ab-subcard:hover .ab-subcard-title{color:var(--ab-accent-ink)}
.ab-subcard-meta{font-size:11.5px;color:var(--ab-ink-3);margin:0 1px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ab-progress{height:5px;border-radius:999px;background:var(--ab-line);overflow:hidden;margin-top:8px}
.ab-progress>i{display:block;height:100%;border-radius:999px;
  background:linear-gradient(90deg,var(--ab-accent-2),var(--ab-accent));transition:width .3s}

/* ── 小标签 / 圆点 ── */
.ab-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}
.ab-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:999px;
  background:var(--ab-card-2);color:var(--ab-ink-2);
  font-size:11px;line-height:1.7;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.ab-chip[data-tone="ok"]{background:var(--ab-ok-bg);color:var(--ab-ok)}
.ab-chip[data-tone="warn"]{background:var(--ab-warn-bg);color:var(--ab-warn)}
.ab-chip[data-tone="danger"]{background:var(--ab-danger-bg);color:var(--ab-danger)}
.ab-chip[data-tone="brand"]{background:var(--ab-accent-soft);color:var(--ab-accent-ink)}
.ab-dot{width:7px;height:7px;border-radius:50%;background:currentColor;flex:none;display:inline-block}
.ab-dot[data-tone="ok"]{background:var(--ab-ok)}
.ab-dot[data-tone="warn"]{background:var(--ab-warn)}
.ab-dot[data-tone="danger"]{background:var(--ab-danger)}
.ab-dot[data-tone="brand"]{background:var(--ab-accent)}

/* ── 按钮 ── */
.ab-btn{border:1px solid var(--ab-line);background:var(--ab-card);color:var(--ab-ink);
  height:34px;padding:0 14px;border-radius:999px;cursor:pointer;font-size:13px;white-space:nowrap;
  display:inline-flex;align-items:center;gap:6px;box-shadow:0 3px 10px rgba(126,104,160,.05);
  transition:background .12s,border-color .12s,transform .1s,opacity .12s}
.ab-btn:hover:not(:disabled){background:var(--ab-card-2);border-color:var(--ab-line)}
.ab-btn:active:not(:disabled){transform:translateY(1px)}
.ab-btn[data-variant="primary"]{background:var(--ab-accent);border-color:transparent;color:#fff;font-weight:600;
  box-shadow:0 6px 16px rgba(139,124,246,.28)}
.ab-btn[data-variant="primary"]:hover:not(:disabled){background:var(--ab-accent);opacity:.92}
.ab-btn[data-variant="ghost"]{background:transparent;border-color:transparent;box-shadow:none;color:var(--ab-ink-3);padding:0 10px}
.ab-btn[data-variant="ghost"]:hover:not(:disabled){background:var(--ab-card-2);color:var(--ab-ink)}
.ab-btn[data-variant="danger"]{color:var(--ab-danger);border-color:var(--ab-danger-bg);background:var(--ab-card)}
.ab-btn[data-variant="danger"]:hover:not(:disabled){background:var(--ab-danger-bg)}
.ab-btn:disabled{opacity:.4;cursor:not-allowed;box-shadow:none}
.ab-root[data-ab-theme="dark"] .ab-btn[data-variant="primary"]{color:#241F2E}

/* ── 空状态 / 提示条 ── */
.ab-empty{padding:48px 24px;text-align:center;color:var(--ab-ink-3);
  border:1.5px dashed var(--ab-line);border-radius:20px;font-size:13px;background:rgba(255,255,255,.55)}
.ab-root[data-ab-theme="dark"] .ab-empty{background:rgba(43,38,55,.5)}
.ab-banner{display:flex;gap:12px;align-items:flex-start;padding:11px 14px;border-radius:14px;
  background:var(--ab-card-2);color:var(--ab-ink-2);font-size:13px;margin:0 0 14px}
.ab-banner[data-tone="warn"]{background:var(--ab-warn-bg);color:var(--ab-warn)}
.ab-banner[data-tone="danger"]{background:var(--ab-danger-bg);color:var(--ab-danger)}
.ab-banner[data-tone="ok"]{background:var(--ab-ok-bg);color:var(--ab-ok)}
.ab-banner-body{flex:1;min-width:0}
.ab-banner .ab-btn{background:transparent;border-color:currentColor;color:inherit;height:26px;font-size:12px;box-shadow:none}

/* ── 搜索建议 ── */
.ab-suggest{position:absolute;left:0;right:0;top:calc(100% + 10px);z-index:45;
  border-radius:20px;background:var(--ab-card);box-shadow:0 20px 50px rgba(86,68,120,.18);
  padding:14px 16px 16px;max-height:min(64vh,520px);overflow:auto;animation:ab-rise .16s ease}
.ab-suggest-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.ab-suggest-title{font-size:12px;font-weight:700;color:var(--ab-ink-2);letter-spacing:.02em;display:flex;align-items:center;gap:7px}
.ab-suggest-title::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--ab-accent-2)}
.ab-suggest-title span{display:none}
.ab-suggest-grid{display:grid;grid-template-columns:1fr 1fr;gap:3px 16px;margin:0;padding:0;list-style:none}
.ab-suggest-item{display:flex;align-items:center;gap:9px;padding:7px;border-radius:12px;cursor:pointer;
  color:var(--ab-ink);font-size:13px;border:0;background:transparent;text-align:left;width:100%;transition:background .12s}
.ab-suggest-item:hover{background:var(--ab-card-2)}
.ab-suggest-rank{width:22px;height:22px;border-radius:50%;flex:none;display:inline-flex;align-items:center;justify-content:center;
  background:var(--ab-accent-soft);color:var(--ab-accent-ink);font-size:10px;font-weight:700;font-variant-numeric:tabular-nums}
.ab-suggest-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ── 搜索浮层 ── */
.ab-overlay{position:fixed;left:var(--ab-layer-left,0);top:var(--ab-layer-top,0);
  width:var(--ab-layer-width,100vw);height:var(--ab-layer-height,100vh);z-index:30;
  background:rgba(61,53,72,.3);backdrop-filter:blur(3px);
  display:flex;justify-content:center;align-items:flex-start;padding:88px 16px 20px;animation:ab-fade .14s ease}
.ab-overlay-panel{width:100%;max-width:820px;max-height:calc(var(--ab-layer-height,100vh) - 114px);overflow:auto;
  background:var(--ab-card);border-radius:22px;box-shadow:0 30px 70px rgba(61,53,72,.26);
  padding:20px 22px 24px;animation:ab-rise .16s ease}
.ab-overlay-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}
.ab-overlay-title{font-size:18px;font-weight:700;margin:0;line-height:1.4}
.ab-overlay-sub{font-size:12px;color:var(--ab-ink-3);margin-top:3px}
.ab-results{display:flex;flex-direction:column;gap:4px}
.ab-result{display:flex;align-items:center;gap:14px;padding:12px;border-radius:14px;cursor:pointer;
  border:0;background:transparent;color:inherit;text-align:left;width:100%;transition:background .12s}
.ab-result:hover{background:var(--ab-card-2)}
.ab-result-main{flex:1;min-width:0}
.ab-result-title{font-size:14px;font-weight:600;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ab-result-meta{font-size:12px;color:var(--ab-ink-3)}
.ab-arrow{color:var(--ab-ink-3);font-size:16px;flex:none}

/* ── 字幕组列表 ── */
.ab-groups{display:flex;flex-direction:column;gap:10px}
.ab-group{border-radius:16px;padding:13px 15px;display:flex;gap:14px;align-items:flex-start;justify-content:space-between;
  background:var(--ab-card);box-shadow:0 6px 18px rgba(126,104,160,.08);transition:box-shadow .15s}
.ab-group:hover{box-shadow:0 10px 26px rgba(139,124,246,.14)}
.ab-group[data-blocked="1"]{opacity:.65}
.ab-group-main{min-width:0;flex:1}
.ab-group-name{font-weight:600;font-size:14px;margin:0;word-break:break-all}
.ab-sample{color:var(--ab-ink-3);font-size:11.5px;margin-top:7px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ab-group-side{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:6px}

/* ── 详情弹窗 ── */
.ab-modal-backdrop{position:fixed;left:var(--ab-layer-left,0);top:var(--ab-layer-top,0);
  width:var(--ab-layer-width,100vw);height:var(--ab-layer-height,100vh);z-index:55;
  background:rgba(61,53,72,.34);backdrop-filter:blur(3px);
  display:flex;align-items:center;justify-content:center;padding:24px;animation:ab-fade .14s ease}
.ab-modal{width:min(880px,100%);max-height:min(88vh,920px);background:var(--ab-card);
  border-radius:24px;box-shadow:0 34px 80px rgba(61,53,72,.28);display:flex;flex-direction:column;
  overflow:hidden;animation:ab-rise .18s ease}
.ab-modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px 0;flex:none}
.ab-modal-title{font-size:12px;font-weight:700;margin:0;color:var(--ab-ink-3);letter-spacing:.06em}
.ab-modal-body{padding:14px 20px 24px;overflow:auto;flex:1;min-height:0;overscroll-behavior:contain}
.ab-detail-hero{display:flex;gap:18px;align-items:flex-start;padding:16px;border-radius:20px;
  background:linear-gradient(135deg,#FFF1F7,#F1EBFF)}
.ab-root[data-ab-theme="dark"] .ab-detail-hero{background:linear-gradient(135deg,#3A2F46,#2F2A44)}
.ab-cover-lg{position:relative;width:126px;height:189px;border-radius:14px;overflow:hidden;
  background:var(--ab-card-2);flex:none;box-shadow:0 10px 24px rgba(61,53,72,.16)}
.ab-cover-lg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.ab-cover-lg .ab-poster-ph{font-size:30px}
.ab-detail-info{min-width:0;flex:1}
.ab-detail-name{font-size:20px;font-weight:700;margin:0 0 3px;line-height:1.35;letter-spacing:-.01em}
.ab-detail-sub{font-size:12px;color:var(--ab-ink-3);margin-bottom:9px;word-break:break-word}
.ab-block{margin-top:20px}
.ab-block-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:11px}
.ab-block-title{font-size:13px;font-weight:700;margin:0;display:flex;align-items:center;gap:8px}
.ab-block-title::before{content:"";width:4px;height:14px;border-radius:2px;
  background:linear-gradient(180deg,var(--ab-accent-2),var(--ab-accent));flex:none}
.ab-block-title span{font-size:11px;font-weight:500;color:var(--ab-ink-3)}
.ab-legend{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:11px;color:var(--ab-ink-3)}
.ab-legend>span{display:inline-flex;align-items:center;gap:5px}
.ab-swatch{width:11px;height:11px;border-radius:4px;background:var(--ab-card-2);display:inline-block;flex:none}
.ab-swatch[data-tone="done"]{background:var(--ab-accent-soft);box-shadow:inset 0 0 0 1px rgba(139,124,246,.4)}
.ab-swatch[data-tone="pending"]{background:var(--ab-warn-bg);box-shadow:inset 0 0 0 1px rgba(168,112,28,.3)}
.ab-swatch[data-tone="failed"]{background:var(--ab-danger-bg);box-shadow:inset 0 0 0 1px rgba(192,85,111,.3)}
.ab-swatch[data-tone="future"]{background:transparent;box-shadow:inset 0 0 0 1px var(--ab-line)}
.ab-epgrid{display:flex;flex-wrap:wrap;gap:7px}
.ab-ep-tile{position:relative;width:42px;height:42px;border-radius:13px;border:1px solid transparent;
  background:var(--ab-card-2);color:var(--ab-ink-2);font-size:12.5px;font-weight:700;
  font-variant-numeric:tabular-nums;display:inline-flex;align-items:center;justify-content:center;padding:0;
  cursor:default;transition:transform .1s,background .12s,box-shadow .12s}
.ab-ep-tile[data-state="done"]{background:var(--ab-accent-soft);color:var(--ab-accent-ink);cursor:pointer;
  box-shadow:inset 0 0 0 1px rgba(124,107,234,.26)}
.ab-ep-tile[data-state="done"]:hover{transform:translateY(-2px);box-shadow:0 8px 16px rgba(139,124,246,.24)}
.ab-ep-tile[data-state="pending"]{background:var(--ab-warn-bg);color:var(--ab-warn)}
.ab-ep-tile[data-state="failed"]{background:var(--ab-danger-bg);color:var(--ab-danger)}
.ab-ep-tile[data-state="future"]{background:transparent;color:var(--ab-ink-3);border:1.5px dashed var(--ab-line)}
.ab-ep-tile[data-opening="1"]{opacity:.45;pointer-events:none}
.ab-ep-tile b{position:absolute;top:2px;right:4px;font-size:8px;font-weight:700;line-height:1.4;opacity:.8}
.ab-detail-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px;padding-top:16px;border-top:1.5px dashed var(--ab-line)}

/* ── 设置抽屉 ── */
.ab-drawer-backdrop{position:fixed;left:var(--ab-layer-left,0);top:var(--ab-layer-top,0);
  width:var(--ab-layer-width,100vw);height:var(--ab-layer-height,100vh);z-index:50;
  background:rgba(61,53,72,.34);backdrop-filter:blur(3px);
  display:flex;justify-content:flex-end;animation:ab-fade .14s ease}
.ab-drawer{width:min(560px,100vw);height:100%;background:var(--ab-card);border-radius:24px 0 0 24px;
  display:flex;flex-direction:column;animation:ab-slide .2s ease;box-shadow:-24px 0 60px rgba(61,53,72,.2)}
.ab-drawer-wide{width:min(560px,100vw)}
.ab-drawer-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;
  border-bottom:1.5px dashed var(--ab-line);flex:none}
.ab-drawer-title{font-size:16px;font-weight:700;margin:0}
.ab-drawer-body{padding:18px 20px 28px;overflow:auto;flex:1;min-height:0;overscroll-behavior:contain}
.ab-panel{border-radius:18px;padding:16px 18px;margin-bottom:14px;background:var(--ab-card-2)}
.ab-panel-title{font-size:13px;font-weight:700;margin:0 0 10px}
.ab-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:6px}
.ab-field-wrap{margin-top:2px}
.ab-label{display:block;font-size:11.5px;color:var(--ab-ink-2);margin:13px 0 6px;font-weight:500}
.ab-field{width:100%;height:38px;padding:0 13px;border:1.5px solid transparent;border-radius:12px;
  background:var(--ab-card);color:inherit;font-size:13px;outline:none;transition:border-color .15s,box-shadow .15s}
.ab-field:focus{border-color:var(--ab-accent);box-shadow:0 0 0 4px rgba(139,124,246,.12)}
.ab-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:1.6;
  height:auto;min-height:120px;padding:12px 13px;resize:vertical;white-space:pre;overflow:auto}
.ab-inline-error{color:var(--ab-danger);font-size:12px;margin-top:7px}
.ab-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:4px 0 16px}
.ab-hint{color:var(--ab-ink-3);font-size:11.5px;margin-top:7px;line-height:1.55}
.ab-test-row{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ab-ink-2);margin-top:7px}
.ab-logs{display:flex;flex-direction:column;gap:2px;max-height:260px;overflow:auto}
.ab-log-row{display:flex;align-items:flex-start;gap:8px;padding:5px 2px;border-bottom:1px dashed var(--ab-line);font-size:12px}
.ab-log-row:last-child{border-bottom:0}
.ab-log-time{color:var(--ab-ink-3);white-space:nowrap;min-width:64px}
.ab-log-msg{color:var(--ab-ink-2);word-break:break-word}
.ab-log-row[data-level="error"] .ab-log-msg{color:var(--ab-danger)}
.ab-log-row[data-level="warn"] .ab-log-msg{color:var(--ab-warn)}
.ab-filter[data-on="1"]{background:var(--ab-accent);border-color:transparent;color:#fff;box-shadow:none}
.ab-root[data-ab-theme="dark"] .ab-filter[data-on="1"]{color:#241F2E}

/* ── 百科内容 ── */
.ab-wiki-section{margin-top:20px}
.ab-wiki-h{font-size:11.5px;font-weight:700;color:var(--ab-ink-3);letter-spacing:.06em;margin:0 0 8px}
.ab-wiki-text{font-size:13px;color:var(--ab-ink-2);white-space:pre-wrap;line-height:1.8}
.ab-info{display:grid;grid-template-columns:88px 1fr;gap:6px 14px;font-size:12px;margin:0}
.ab-info dt{color:var(--ab-ink-3);margin:0}
.ab-info dd{margin:0;color:var(--ab-ink-2);word-break:break-word}
.ab-link{color:var(--ab-accent-ink);text-decoration:none;font-size:13px;font-weight:500}
.ab-link:hover{text-decoration:underline}
.ab-missing{color:var(--ab-warn);font-size:12px;margin-top:9px;word-break:break-word}
.ab-card-meta{color:var(--ab-ink-3);font-size:12px}

/* ── 骨架 / Toast / 通用 ── */
.ab-skel{height:11px;border-radius:6px;margin-bottom:9px;
  background:linear-gradient(90deg,var(--ab-card-2) 25%,var(--ab-line) 37%,var(--ab-card-2) 63%);
  background-size:400% 100%;animation:ab-shimmer 1.3s ease infinite}
.ab-skel:last-child{margin-bottom:0;width:38%}
.ab-skel-block{height:84px;border-radius:18px;margin-bottom:12px;
  background:linear-gradient(90deg,var(--ab-card-2) 25%,var(--ab-line) 37%,var(--ab-card-2) 63%);
  background-size:400% 100%;animation:ab-shimmer 1.3s ease infinite}
.ab-toast{position:fixed;right:24px;bottom:24px;z-index:60;max-width:400px;display:flex;align-items:flex-start;gap:10px;
  padding:13px 15px;border-radius:16px;background:var(--ab-card);color:var(--ab-ink);
  box-shadow:0 16px 40px rgba(61,53,72,.22);font-size:13px;animation:ab-rise .18s ease}
.ab-toast-text{flex:1;min-width:0;word-break:break-word}
.ab-toast-x{border:0;background:transparent;color:var(--ab-ink-3);cursor:pointer;font-size:16px;line-height:1;padding:0 2px}
.ab-toast-x:hover{color:var(--ab-ink)}
.ab-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ab-muted{color:var(--ab-ink-3)}
.ab-eps{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;max-height:132px;overflow:auto}
.ab-ep{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:8px;
  font-size:11px;background:var(--ab-card-2);color:var(--ab-ink-2);line-height:1.8}
.ab-ep[data-tone="ok"]{background:var(--ab-ok-bg);color:var(--ab-ok)}
.ab-ep[data-tone="warn"]{background:var(--ab-warn-bg);color:var(--ab-warn)}
.ab-ep[data-tone="danger"]{background:var(--ab-danger-bg);color:var(--ab-danger)}
.ab-ep b{font-weight:600}
.ab-sub-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1.5px dashed var(--ab-line)}
@keyframes ab-shimmer{0%{background-position:100% 0}100%{background-position:0 0}}
@keyframes ab-fade{from{opacity:0}to{opacity:1}}
@keyframes ab-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes ab-slide{from{transform:translateX(24px);opacity:.6}to{transform:none;opacity:1}}
@media(max-width:900px){.ab-dots{display:none}}
@media(max-width:640px){
  .ab-root{--ab-gutter:16px;padding:0 var(--ab-gutter) 48px}
  .ab-brand{display:none}
  .ab-topbar-inner{padding:12px 0}
  .ab-suggest-grid{grid-template-columns:1fr}
  .ab-overlay{padding:76px 10px 10px}
  .ab-overlay-panel{padding:16px;border-radius:18px}
  .ab-modal-backdrop{padding:10px}
  .ab-modal{border-radius:20px}
  .ab-detail-hero{padding:12px;gap:13px}
  .ab-cover-lg{width:96px;height:144px}
  .ab-drawer{width:100vw;border-radius:0}
}
/* ── 首次使用引导 ── */
.ab-guide{width:min(600px,100%)}
.ab-guide-lead{margin:0 0 16px;color:var(--ab-ink-2);font-size:13px}
.ab-guide-item{margin-bottom:10px;padding:12px 14px;border:1px solid var(--ab-line);border-radius:14px;background:var(--ab-card-2)}
.ab-guide-h{display:flex;align-items:center;gap:8px;font-weight:700;margin-bottom:4px}
.ab-guide-n{width:18px;height:18px;border-radius:6px;flex:none;display:inline-flex;align-items:center;justify-content:center;
  background:var(--ab-accent-soft);color:var(--ab-accent-ink);font-size:11px;font-weight:700}
.ab-guide-item p{margin:0;color:var(--ab-ink-2);font-size:12.5px;line-height:1.8}
.ab-guide-code{font-family:ui-monospace,Consolas,monospace;font-size:12px;padding:1px 5px;border-radius:5px;
  background:var(--ab-card);border:1px solid var(--ab-line);white-space:nowrap}
.ab-guide-status{display:flex;flex-wrap:wrap;gap:6px 16px;margin:12px 2px 2px;font-size:12.5px;color:var(--ab-ink-2)}

@media(prefers-reduced-motion:reduce){
  .ab-skel,.ab-skel-block{animation:none}
  .ab-overlay,.ab-overlay-panel,.ab-modal,.ab-drawer,.ab-toast,.ab-suggest{animation:none}
}
`;

    async function api(path, options = {}) {
      const res = await fetch(`${API}${path}`, {
        headers: { "content-type": "application/json" },
        ...options,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text };
      }
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    }

    function buildName(config, sub, ep, ver = "") {
      const template = (config && config.naming && config.naming.template) || "{title} S{season:02}E{ep:02}{ver} [{group}]";
      const values = {
        title: sub.title || "",
        season: String(sub.season || 1),
        "season:02": String(sub.season || 1).padStart(2, "0"),
        ep: String(ep || 0),
        "ep:02": String(ep || 0).padStart(2, "0"),
        ver: ver || "",
        group: sub.group || "",
        resolution: sub.resolution || "",
        lang: sub.lang || "简",
      };
      return template
        .replace(/\{(title|season|season:02|ep|ep:02|ver|group|resolution|lang)\}/g, (_, key) => values[key] || "")
        .replace(/\s+/g, " ")
        .replace(/\s*\[\s*\]/g, "")
        .replace(/\s*\(\s*\)/g, "")
        .trim();
    }

    function timeAgo(iso) {
      if (!iso) return "尚未";
      const stamp = Date.parse(iso);
      if (!Number.isFinite(stamp)) return "尚未";
      const diff = Date.now() - stamp;
      if (diff < 45 * 1000) return "刚刚";
      if (diff < 3600 * 1000) return `${Math.max(1, Math.round(diff / 60000))} 分钟前`;
      if (diff < 86400 * 1000) return `${Math.round(diff / 3600000)} 小时前`;
      return `${Math.round(diff / 86400000)} 天前`;
    }

    function fmtTime(iso) {
      if (!iso) return "尚未";
      const stamp = Date.parse(iso);
      if (!Number.isFinite(stamp)) return "尚未";
      return new Date(stamp).toLocaleString();
    }

    function epTone(ep) {
      if (!ep) return "";
      if (ep.state === "done" || Number(ep.progress) >= 1) return "ok";
      if (ep.state === "missing" || ep.error) return "danger";
      if (Number(ep.progress) > 0) return "warn";
      return "";
    }

    function boundFor(subs, row) {
      const list = subs || [];
      return list.filter((sub) => {
        if (row.subjectId && sub.subjectId) return Number(sub.subjectId) === Number(row.subjectId);
        return Boolean(sub.title) && sub.title === row.title;
      });
    }

    function useTheme() {
      const [theme, setTheme] = React.useState("light");
      React.useEffect(() => {
        const detect = () => {
          const read = (node) => {
            if (!node) return null;
            const color = getComputedStyle(node).backgroundColor || "";
            const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(color);
            if (!match) return null;
            const alpha = match[4] === undefined ? 1 : Number(match[4]);
            if (alpha < 0.1) return null;
            return Number(match[1]) * 0.2126 + Number(match[2]) * 0.7152 + Number(match[3]) * 0.0722;
          };
          let lum = read(document.body);
          if (lum === null) lum = read(document.documentElement);
          if (lum === null) {
            const scheme = getComputedStyle(document.documentElement).colorScheme || "";
            setTheme(scheme.includes("dark") || document.documentElement.classList.contains("dark") ? "dark" : "light");
            return;
          }
          setTheme(lum / 255 < 0.5 ? "dark" : "light");
        };
        detect();
        const observer = new MutationObserver(detect);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
        if (document.body) observer.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        media.addEventListener?.("change", detect);
        return () => {
          observer.disconnect();
          media.removeEventListener?.("change", detect);
        };
      }, []);
      return theme;
    }

    function useSnapshot() {
      const [snap, setSnap] = React.useState(null);
      const [error, setError] = React.useState("");
      const reload = React.useCallback(async () => {
        try {
          const data = await api("/state");
          setSnap(data);
          setError("");
        } catch (err) {
          setError(err.message || String(err));
        }
      }, []);
      React.useEffect(() => {
        let alive = true;
        void reload();
        const timer = setInterval(() => {
          if (!alive || document.hidden) return;
          void reload();
        }, 10000);
        const onVisible = () => {
          if (!document.hidden) void reload();
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => {
          alive = false;
          clearInterval(timer);
          document.removeEventListener("visibilitychange", onVisible);
        };
      }, [reload]);
      return { snap, error, reload };
    }

    function Icon() {
      return h("span", { className: "ab-icon", "aria-hidden": "true" }, "📺");
    }

    function Dot({ tone }) {
      return h("i", { className: "ab-dot", "data-tone": tone || "", "aria-hidden": "true" });
    }

    function Chip({ tone, title, children }) {
      return h("span", { className: "ab-chip", "data-tone": tone || "", title: title || undefined }, children);
    }

    function Banner({ tone, children, actionLabel, onAction }) {
      return h("div", { className: "ab-banner", "data-tone": tone || "", role: tone === "danger" ? "alert" : "status" },
        h("div", { className: "ab-banner-body" }, children),
        actionLabel ? h("button", { type: "button", className: "ab-btn", onClick: onAction }, actionLabel) : null,
      );
    }

    function Skeleton({ blocks = 2 }) {
      return h("div", null, Array.from({ length: blocks }).map((_, i) => h("div", { key: i, className: "ab-skel-block" })));
    }

    function Cover({ subject, size = "medium", name: fallbackName = "" }) {
      const [failed, setFailed] = React.useState(false);
      React.useEffect(() => {
        setFailed(false);
      }, [subject && subject.id, size]);
      const images = (subject && subject.images) || {};
      const order = size === "large" ? ["large", "medium", "grid", "small"] : ["medium", "large", "grid", "small"];
      const src = order.map((key) => images[key]).find(Boolean) || "";
      const name = (subject && (subject.nameCn || subject.name)) || fallbackName || "";
      if (!src || failed) return h("span", { className: "ab-poster-ph" }, name ? name.slice(0, 1) : "?");
      return h("img", {
        src,
        alt: name,
        loading: "lazy",
        referrerPolicy: "no-referrer",
        onError: () => setFailed(true),
      });
    }

    function StatusDots({ snap, polling, onPoll }) {
      const st = snap?.status || {};
      const qbTone = st.qbError ? "danger" : st.qbVersion ? "ok" : "";
      const sourceTone = st.sourceError ? "danger" : snap ? "ok" : "";
      return h("div", { className: "ab-dots" },
        h("span", { className: "ab-dot-item", title: st.qbError || (st.qbVersion ? `qBittorrent ${st.qbVersion}` : "qBittorrent 连接中") },
          h(Dot, { tone: qbTone }), "qB"),
        h("span", { className: "ab-dot-item", title: st.sourceError || "AnimeGarden" },
          h(Dot, { tone: sourceTone }), "源"),
        h("span", { className: "ab-dot-item", title: fmtTime(st.lastPollAt) },
          st.polling || polling ? "检查中…" : timeAgo(st.lastPollAt)),
        h("button", {
          type: "button",
          className: "ab-icon-btn",
          title: "立即轮询",
          disabled: polling || st.polling,
          onClick: onPoll,
        }, polling || st.polling ? "…" : "↻"),
      );
    }

    function SearchBar({ query, setQuery, focused, setFocused, trend, onSearch, onPick, loading, onFocus }) {
      const q = query.trim();
      const items = q
        ? trend.items.filter((item) => (item.title || "").includes(q) || (item.name || "").includes(q))
        : trend.items;
      return h("div", { className: "ab-searchbox" },
        h("div", { className: "ab-search", "data-focus": focused ? "1" : "0" },
          h("span", { className: "ab-muted", "aria-hidden": "true" }, "⌕"),
          h("input", {
            value: query,
            placeholder: "搜索番名",
            "aria-label": "搜索番名",
            onChange: (e) => setQuery(e.target.value),
            onFocus: () => {
              setFocused(true);
              onFocus?.();
            },
            onBlur: () => setTimeout(() => setFocused(false), 160),
            onKeyDown: (e) => {
              if (e.key === "Enter") onSearch(query);
              if (e.key === "Escape") setFocused(false);
            },
          }),
          query ? h("button", {
            type: "button",
            className: "ab-go",
            "aria-label": "清除",
            onMouseDown: (e) => e.preventDefault(),
            onClick: () => setQuery(""),
          }, "×") : null,
          h("button", {
            type: "button",
            className: "ab-go",
            "aria-label": "搜索",
            disabled: loading,
            onMouseDown: (e) => e.preventDefault(),
            onClick: () => onSearch(query),
          }, loading ? "…" : "→"),
        ),
        focused ? h("div", { className: "ab-suggest", role: "listbox" },
          h("div", { className: "ab-suggest-head" },
            h("div", { className: "ab-suggest-title" }, "近期注目"),
            trend.loading ? h("span", { className: "ab-muted", style: { fontSize: 11 } }, "加载中…") : null,
          ),
          trend.error
            ? h("div", { className: "ab-hint", style: { marginTop: 0 } }, "热门加载失败")
            : items.length
              ? h("ul", { className: "ab-suggest-grid" }, items.map((item) => h("li", { key: item.id },
                h("button", {
                  type: "button",
                  className: "ab-suggest-item",
                  title: `${item.title}${item.date ? ` · ${item.date}` : ""}`,
                  onMouseDown: (e) => e.preventDefault(),
                  onClick: () => onPick(item),
                },
                  h("span", { className: "ab-suggest-rank" }, String(trend.items.indexOf(item) + 1).padStart(2, "0")),
                  h("span", { className: "ab-suggest-name" }, item.title),
                ))))
              : trend.loading
                ? h(Skeleton, { blocks: 1 })
                : h("div", { className: "ab-hint", style: { marginTop: 0 } }, q ? "没有匹配的热门" : "暂无热门"),
        ) : null,
      );
    }

    function Home({ snap, subjects, onOpen, onFocusSearch, polling, onPollAll }) {
      const [onlyOpen, setOnlyOpen] = React.useState(false);
      if (!snap) return h(Skeleton, { blocks: 3 });
      const subs = snap.subscriptions || [];
      if (!subs.length) {
        return h("div", { className: "ab-empty" },
          h("div", null, "还没有订阅"),
          h("div", { style: { marginTop: 14 } },
            h("button", { type: "button", className: "ab-btn", "data-variant": "primary", onClick: onFocusSearch }, "去搜索")),
        );
      }
      const visible = onlyOpen
        ? subs.filter((sub) => (sub.missing || []).length > 0 || sub.backfilling)
        : subs;
      const totalMissing = subs.reduce((sum, sub) => sum + (sub.missing || []).length, 0);
      return h("div", null,
        h("div", { className: "ab-toolbar" },
          h("div", { className: "ab-toolbar-info" },
            h("strong", null, `${subs.length} 部`),
            totalMissing ? ` · 缺 ${totalMissing} 集` : " · 已补齐",
          ),
          h("div", { className: "ab-toolbar-actions" },
            h("button", {
              type: "button",
              className: "ab-btn",
              "data-variant": onlyOpen ? "primary" : "secondary",
              onClick: () => setOnlyOpen((value) => !value),
            }, onlyOpen ? "显示全部" : "只看未完成"),
            h("button", { type: "button", className: "ab-btn", disabled: polling || snap.status?.polling, onClick: onPollAll },
              polling || snap.status?.polling ? "检查中…" : "全部检查"),
          ),
        ),
        visible.length ? h("div", { className: "ab-subs" }, visible.map((sub) => {
          const known = sub.known || 0;
          const done = sub.done || 0;
          const pct = known ? Math.min(100, Math.round((done / known) * 100)) : 0;
          const missing = sub.missing || [];
          const tone = sub.backfilling ? "brand" : missing.length ? "warn" : "ok";
          const text = sub.backfilling ? "补齐中" : missing.length ? `缺 ${missing.length} 集` : "已补齐";
          return h("button", { key: sub.id, type: "button", className: "ab-subcard", onClick: () => onOpen(sub), title: sub.title },
            h("div", { className: "ab-poster" },
              h(Cover, { subject: subjects[sub.subjectId], size: "medium", name: sub.title }),
              tone === "ok" ? null : h("span", { className: "ab-badge", "data-tone": tone }, text),
            ),
            h("p", { className: "ab-subcard-title" }, sub.title),
            h("div", { className: "ab-subcard-meta" }, `${sub.group} · ${done}/${known}`),
            h("div", { className: "ab-progress" }, h("i", { style: { width: `${pct}%` } })),
          );
        })) : h("div", { className: "ab-empty" }, "没有未完成的订阅"),
      );
    }

    function SearchOverlay({ search, onClose, onOpenAnime, onSubscribe, onBack, onWiki, busyGroup, snap }) {
      const bound = search.selected ? boundFor(snap?.subscriptions, search.selected) : [];
      const allowTraditional = snap?.config?.language?.allowTraditional !== false;
      const groups = React.useMemo(() => {
        return [...(search.groups || [])].sort((a, b) => {
          const aa = Number(a.compatible) > 0 ? 1 : 0;
          const bb = Number(b.compatible) > 0 ? 1 : 0;
          if (aa !== bb) return bb - aa;
          if ((b.count || 0) !== (a.count || 0)) return (b.count || 0) - (a.count || 0);
          return (b.latestEpisode || 0) - (a.latestEpisode || 0);
        });
      }, [search.groups]);

      function renderGroup(group) {
        const blocked = Number(group.compatible) === 0 && (group.count || 0) > 0;
        const tradBlocked = blocked && group.langTag === "繁体" && !allowTraditional;
        const samples = group.samples || [];
        const partial = !blocked && typeof group.compatible === "number" && group.compatible < samples.length;
        const sameGroup = bound.find((sub) => sub.group === group.name);
        const taken = bound.length > 0;
        return h("div", { key: group.name, className: "ab-group", "data-blocked": blocked ? "1" : "0" },
          h("div", { className: "ab-group-main" },
            h("p", { className: "ab-group-name" }, group.name),
            h("div", { className: "ab-chips" },
              h(Chip, { tone: group.langTag === "繁体" ? (allowTraditional ? "" : "warn") : "ok" }, group.langTag || "未知"),
              h(Chip, null, `${group.episodeCount || group.count || 0} 集 / ${group.count || 0} 个资源`),
              group.latestEpisode ? h(Chip, null, `最新 EP${group.latestEpisode}`) : null,
              group.resolution ? h(Chip, null, group.resolution) : null,
              blocked
                ? h(Chip, {
                  tone: "danger",
                  title: tradBlocked
                    ? "该组只有纯繁体资源，设置里把 language.allowTraditional 设为 true 即可订阅"
                    : "该组资源都不符合当前语言规则",
                }, tradBlocked ? "需允许繁体" : "会被拦下")
                : null,
              partial ? h(Chip, { tone: "warn", title: `${samples.length} 个样例中 ${group.compatible} 个符合语言规则` }, "部分集过滤") : null,
              sameGroup ? h(Chip, { tone: "brand" }, "本组已订阅") : taken ? h(Chip, { tone: "warn" }, `已绑定 ${bound[0].group}`) : null,
            ),
            group.sample ? h("div", { className: "ab-sample", title: (group.samples || []).join("\n") }, group.sample) : null,
          ),
          h("div", { className: "ab-group-side" },
            h("button", {
              type: "button",
              className: "ab-btn",
              "data-variant": "primary",
              disabled: Boolean(busyGroup) || blocked || taken,
              title: blocked
                ? (tradBlocked ? "需先在设置里允许纯繁体资源" : "语言规则会拒绝该组资源")
                : taken ? "同一部番只能追一个字幕组" : undefined,
              onClick: () => onSubscribe(group),
            }, busyGroup === group.name ? "订阅中…" : sameGroup ? "已订阅" : taken ? "已绑定" : blocked ? (tradBlocked ? "需允许繁体" : "会被拦下") : "订阅"),
          ),
        );
      }

      return h("div", { className: "ab-overlay", onClick: (e) => { if (e.target === e.currentTarget) onClose(); } },
        h("div", { className: "ab-overlay-panel", role: "dialog", "aria-modal": "true" },
          h("div", { className: "ab-overlay-head" },
            h("div", { style: { minWidth: 0 } },
              h("h2", { className: "ab-overlay-title" }, search.selected ? search.selected.title : `搜索「${search.query}」`),
              !search.selected && (search.rows || []).length
                ? h("div", { className: "ab-overlay-sub" }, `${(search.rows || []).length} 个条目`)
                : null,
            ),
            h("div", { className: "ab-row" },
              search.selected && search.selected.subjectId
                ? h("button", { type: "button", className: "ab-btn", "data-variant": "ghost", onClick: () => onWiki(search.selected.subjectId) }, "百科")
                : null,
              search.selected && (search.rows || []).length
                ? h("button", { type: "button", className: "ab-btn", onClick: onBack }, "← 返回结果") : null,
              h("button", { type: "button", className: "ab-icon-btn", onClick: onClose, "aria-label": "关闭" }, "×"),
            ),
          ),
          search.error ? h(Banner, { tone: "danger" }, search.error) : null,
          search.loading ? h(Skeleton, { blocks: 4 }) : null,
          !search.loading && !search.selected && (search.rows || []).length
            ? h("div", { className: "ab-results" }, search.rows.map((row) => {
              const rowBound = boundFor(snap?.subscriptions, row);
              return h("button", { key: row.key || row.title, type: "button", className: "ab-result", onClick: () => onOpenAnime(row) },
                h("div", { className: "ab-result-main" },
                  h("p", { className: "ab-result-title" }, row.title || row.titleRaw || "未命名"),
                  h("div", { className: "ab-result-meta" },
                    `${(row.groups || []).length} 组 · ${row.count || 0} 个资源`),
                  rowBound.length ? h("div", { className: "ab-chips" }, h(Chip, { tone: "ok" }, `已订阅 · ${rowBound[0].group}`)) : null,
                ),
                h("span", { className: "ab-arrow" }, "›"),
              );
            }))
            : null,
          !search.loading && !search.selected && !(search.rows || []).length && !search.error
            ? h("div", { className: "ab-empty" }, "没搜到，换个关键词试试")
            : null,
          search.groupsLoading ? h(Skeleton, { blocks: 3 }) : null,
          !search.groupsLoading && search.selected && groups.length
            ? h("div", { className: "ab-groups" }, groups.map(renderGroup))
            : null,
          !search.groupsLoading && search.selected && !groups.length && !search.error
            ? h("div", { className: "ab-empty" }, "这个条目暂时没有资源")
            : null,
          bound.length ? h(Banner, { tone: "warn" },
            `已绑定《${bound[0].title}》· ${bound[0].group}，换组请先退订`) : null,
        ),
      );
    }

    function DetailModal({ id, sub, initial, onClose, reload, notify }) {
      const [subject, setSubject] = React.useState(initial || null);
      const [error, setError] = React.useState("");
      const [busy, setBusy] = React.useState("");
      const [confirm, setConfirm] = React.useState(false);
      const [currentSub, setCurrentSub] = React.useState(sub || null);
      const [opening, setOpening] = React.useState(0);

      React.useEffect(() => {
        setCurrentSub(sub || null);
      }, [sub]);

      React.useEffect(() => {
        if (!id) {
          setError("");
          return;
        }
        let alive = true;
        setError("");
        setSubject((prev) => (prev && Number(prev.id) === Number(id) ? prev : null));
        api(`/bgm/subject?id=${encodeURIComponent(id)}`)
          .then((data) => {
            if (alive) setSubject(data.subject);
          })
          .catch((err) => {
            if (alive) setError(err.message);
          });
        return () => {
          alive = false;
        };
      }, [id]);

      React.useEffect(() => {
        if (!confirm) return;
        const timer = setTimeout(() => setConfirm(false), 4500);
        return () => clearTimeout(timer);
      }, [confirm]);

      async function check() {
        if (!currentSub) return;
        setBusy("check");
        try {
          await api("/check", { method: "POST", body: { id: currentSub.id } });
          await reload();
          notify?.(`已检查《${currentSub.title}》`, "ok");
        } catch (err) {
          notify?.(err.message, "error");
        } finally {
          setBusy("");
        }
      }

      async function remove() {
        if (!currentSub) return;
        setBusy("unsub");
        try {
          await api("/unsubscribe", { method: "POST", body: { id: currentSub.id } });
          notify?.(`已退订《${currentSub.title}》，已下载文件保留`, "ok");
          onClose();
          await reload();
        } catch (err) {
          notify?.(err.message, "error");
        } finally {
          setBusy("");
        }
      }

      const episodes = currentSub?.episodes || [];
      const byEpisode = React.useMemo(() => {
        const map = new Map();
        const score = (ep) => (ep.state === "done" || Number(ep.progress) >= 1 ? 3 : 0) + (Number(ep.progress) || 0);
        for (const ep of episodes) {
          const num = Number(ep.episode);
          if (!Number.isFinite(num) || ep.state === "replaced") continue;
          const prev = map.get(num);
          if (!prev || score(ep) > score(prev)) map.set(num, ep);
        }
        return map;
      }, [episodes]);

      const missing = currentSub?.missing || [];
      const known = currentSub?.known || 0;
      const shown = [...byEpisode.values()];
      const total = Math.max(
        Number(subject?.totalEpisodes) || 0,
        Number(subject?.eps) || 0,
        Number(known) || 0,
        ...shown.map((ep) => Number(ep.episode) || 0),
      );
      const MAX_TILES = 120;
      const firstEp = total > MAX_TILES ? total - MAX_TILES + 1 : 1;
      const numbers = [];
      for (let n = firstEp; n <= total; n += 1) numbers.push(n);
      const stateOf = (ep) => {
        if (!ep) return "future";
        if (ep.state === "done" || Number(ep.progress) >= 1) return "done";
        if (ep.state === "missing" || ep.error) return "failed";
        return "pending";
      };
      const doneCount = shown.filter((ep) => stateOf(ep) === "done").length;

      async function openEpisode(n) {
        if (opening) return;
        const ep = byEpisode.get(n);
        const state = stateOf(ep);
        if (state !== "done") {
          if (!ep) notify?.(`EP${n} 尚未更新`, "info");
          else if (state === "failed") notify?.(`EP${n} 下载异常，可点「立即检查」重试`, "error");
          else {
            const pct = Math.round(Number(ep.progress) * 100);
            notify?.(`EP${n} 已更新但还没下载完${pct > 0 ? `（${pct}%）` : "（等待开始）"}`, "info");
          }
          return;
        }
        if (!currentSub) return;
        setOpening(n);
        try {
          await api("/open", { method: "POST", body: { id: currentSub.id, episode: n } });
          notify?.(`已用 PotPlayer 打开 EP${n}`, "ok");
        } catch (err) {
          notify?.(err.message, "error");
        } finally {
          setOpening(0);
        }
      }

      return h("div", { className: "ab-modal-backdrop", onClick: onClose },
        h("div", { className: "ab-modal", onClick: (e) => e.stopPropagation(), role: "dialog", "aria-modal": "true" },
          h("header", { className: "ab-modal-head" },
            h("h2", { className: "ab-modal-title" }, "详情"),
            h("button", { type: "button", className: "ab-icon-btn", onClick: onClose, "aria-label": "关闭" }, "×"),
          ),
          h("div", { className: "ab-modal-body" },
            error ? h(Banner, { tone: "danger" }, `百科加载失败：${error}（检查设置里的下载代理）`) : null,
            !subject && !error ? h(Skeleton, { blocks: 2 }) : null,
            h("div", { className: "ab-detail-hero" },
              h("div", { className: "ab-cover-lg" }, h(Cover, { subject: subject || undefined, size: "large", name: currentSub?.title })),
              h("div", { className: "ab-detail-info" },
                h("h3", { className: "ab-detail-name" }, subject ? (subject.nameCn || subject.name) : (currentSub?.title || "未命名")),
                subject && subject.nameCn && subject.name ? h("div", { className: "ab-detail-sub" }, subject.name) : null,
                h("div", { className: "ab-chips" },
                  subject?.date ? h(Chip, { key: "date" }, subject.date) : null,
                  subject?.platform ? h(Chip, { key: "platform" }, subject.platform) : null,
                  subject?.totalEpisodes || subject?.eps ? h(Chip, { key: "eps" }, `全 ${subject.totalEpisodes || subject.eps} 集`) : null,
                  subject?.score ? h(Chip, { key: "score", tone: "brand" }, `★ ${subject.score}`) : null,
                  subject?.rank ? h(Chip, { key: "rank" }, `#${subject.rank}`) : null,
                  currentSub ? h(Chip, { key: "group" }, currentSub.group) : null,
                  currentSub ? h(Chip, { key: "season" }, `S${currentSub.season || 1}`) : null,
                ),
                subject ? h("div", { style: { marginTop: 10 } },
                  h("a", { className: "ab-link", href: subject.url, target: "_blank", rel: "noreferrer noopener" }, "在 bgm.tv 打开 ↗"),
                ) : null,
              ),
            ),
            currentSub ? h("section", { className: "ab-block" },
              h("div", { className: "ab-block-head" },
                h("h3", { className: "ab-block-title" }, "集数", h("span", null, `${doneCount}/${total || "?"} 已下载`)),
                h("div", { className: "ab-legend" },
                  h("span", null, h("i", { className: "ab-swatch", "data-tone": "done" }), "已下载"),
                  h("span", null, h("i", { className: "ab-swatch", "data-tone": "pending" }), "已更新未下载"),
                  h("span", null, h("i", { className: "ab-swatch", "data-tone": "failed" }), "异常"),
                  h("span", null, h("i", { className: "ab-swatch", "data-tone": "future" }), "未更新"),
                ),
              ),
              numbers.length
                ? h("div", { className: "ab-epgrid" },
                  firstEp > 1 ? h("span", { key: "more", className: "ab-ep-tile", "data-state": "future", title: "更早的集数已省略" }, "…") : null,
                  numbers.map((n) => {
                    const ep = byEpisode.get(n);
                    const state = opening === n ? "opening" : stateOf(ep);
                    const tip = ep
                      ? `EP${n} · ${stateOf(ep) === "done" ? "已下载" : stateOf(ep) === "failed" ? "异常" : `已更新未下载${Number(ep.progress) > 0 ? ` ${Math.round(Number(ep.progress) * 100)}%` : ""}`}${ep.versionLabel ? ` · ${ep.versionLabel}` : ""}${ep.file ? `\n${ep.file}` : ""}`
                      : `EP${n} · 尚未更新`;
                    return h("button", {
                      key: n,
                      type: "button",
                      className: "ab-ep-tile",
                      "data-state": state,
                      "data-opening": opening === n ? "1" : "0",
                      "aria-disabled": state !== "done" ? "true" : undefined,
                      title: tip,
                      onClick: () => openEpisode(n),
                    }, String(n).padStart(2, "0"), ep?.versionLabel ? h("b", null, ep.versionLabel) : null);
                  }),
                )
                : h("div", { className: "ab-hint", style: { marginTop: 0 } }, "还没有集数信息，点「立即检查」试试。"),
              h("div", { className: "ab-chips", style: { marginTop: 10 } },
                h(Chip, null, currentSub.group),
                h(Chip, null, `S${currentSub.season || 1}`),
                h(Chip, null, currentSub.resolution || "1080p"),
                h(Chip, { tone: missing.length ? "warn" : "ok" }, `${currentSub.done || 0}/${known} 集`),
                currentSub.backfilling ? h(Chip, { tone: "brand" }, "补齐中") : null,
              ),
              missing.length ? h("div", { className: "ab-missing" }, `未完成：${missing.slice(0, 24).join(", ")}${missing.length > 24 ? " …" : ""}`) : null,
              h("div", { className: "ab-detail-actions" },
                h("button", { type: "button", className: "ab-btn", disabled: busy === "check", onClick: check }, busy === "check" ? "检查中…" : "立即检查"),
                confirm
                  ? h("button", { type: "button", className: "ab-btn", "data-variant": "danger", disabled: busy === "unsub", onClick: remove }, busy === "unsub" ? "退订中…" : "确认退订")
                  : h("button", { type: "button", className: "ab-btn", "data-variant": "danger", onClick: () => setConfirm(true) }, "退订"),
                h("button", { type: "button", className: "ab-btn", "data-variant": "ghost", onClick: onClose }, "关闭"),
              ),
            ) : null,
            subject ? h("div", null,
              subject.tags?.length ? h("div", { className: "ab-wiki-section" },
                h("div", { className: "ab-wiki-h" }, "标签"),
                h("div", { className: "ab-chips" }, subject.tags.map((tag) => h(Chip, { key: tag.name }, tag.name))),
              ) : null,
              subject.summary ? h("div", { className: "ab-wiki-section" },
                h("div", { className: "ab-wiki-h" }, "简介"),
                h("div", { className: "ab-wiki-text" }, subject.summary),
              ) : null,
              subject.infobox?.length ? h("div", { className: "ab-wiki-section" },
                h("div", { className: "ab-wiki-h" }, "制作信息"),
                h("dl", { className: "ab-info" }, subject.infobox.map((row, index) => h(React.Fragment, { key: `${row.key}-${index}` },
                  h("dt", null, row.key),
                  h("dd", null, row.value),
                ))),
              ) : null,
            ) : null,
            !currentSub && !subject && !error ? h("div", { className: "ab-hint" }, "暂无资料") : null,
          ),
        ),
      );
    }

    function SettingsDrawer({ onClose, notify, onGuide }) {
      const [draft, setDraft] = React.useState(null);
      const [initial, setInitial] = React.useState(null);
      const [languageText, setLanguageText] = React.useState("");
      const [initialLanguageText, setInitialLanguageText] = React.useState("");
      const [saving, setSaving] = React.useState(false);
      const [testing, setTesting] = React.useState(false);
      const [test, setTest] = React.useState(null);
      const [logs, setLogs] = React.useState([]);
      const [logFilter, setLogFilter] = React.useState("all");
      const [loadError, setLoadError] = React.useState("");

      const loadSettings = React.useCallback(async () => {
        try {
          const data = await api("/settings");
          const text = JSON.stringify(data.language || {}, null, 2);
          setDraft(data);
          setInitial(data);
          setLanguageText(text);
          setInitialLanguageText(text);
          setLoadError("");
        } catch (err) {
          setLoadError(err.message);
        }
      }, []);

      React.useEffect(() => {
        void loadSettings();
      }, [loadSettings]);

      const loadLogs = React.useCallback(async () => {
        try {
          const data = await api("/log");
          setLogs(data.log || []);
        } catch {
          /* 日志失败不打扰页面 */
        }
      }, []);

      React.useEffect(() => {
        void loadLogs();
        const timer = setInterval(() => {
          if (!document.hidden) void loadLogs();
        }, 20000);
        return () => clearInterval(timer);
      }, [loadLogs]);

      const languageCheck = React.useMemo(() => {
        try {
          const value = JSON.parse(languageText);
          if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "需要是一个 JSON 对象" };
          return { ok: true, value };
        } catch (err) {
          return { ok: false, error: err.message };
        }
      }, [languageText]);

      const dirty = React.useMemo(() => {
        if (!draft || !initial) return false;
        return JSON.stringify(draft) !== JSON.stringify(initial) || languageText !== initialLanguageText;
      }, [draft, initial, languageText, initialLanguageText]);

      if (!draft) {
        return h("div", { className: "ab-drawer-backdrop", onClick: onClose },
          h("aside", { className: "ab-drawer ab-drawer-wide", onClick: (e) => e.stopPropagation() },
            h("header", { className: "ab-drawer-head" },
              h("h2", { className: "ab-drawer-title" }, "设置"),
              h("button", { type: "button", className: "ab-icon-btn", onClick: onClose }, "×"),
            ),
            h("div", { className: "ab-drawer-body" },
              loadError ? h(Banner, { tone: "danger", actionLabel: "重试", onAction: loadSettings }, `设置加载失败：${loadError}`) : h(Skeleton, { blocks: 3 }),
            ),
          ),
        );
      }

      function getPath(path) {
        return String(path).split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), draft);
      }

      function setPath(path, value) {
        const keys = String(path).split(".");
        setDraft((prev) => {
          const next = { ...prev };
          let cursor = next;
          for (let i = 0; i < keys.length - 1; i += 1) {
            const key = keys[i];
            cursor[key] = { ...(cursor[key] || {}) };
            cursor = cursor[key];
          }
          cursor[keys[keys.length - 1]] = value;
          return next;
        });
      }

      async function save() {
        if (saving || !languageCheck.ok) return;
        setSaving(true);
        try {
          const { qbPasswordSet, ...rest } = draft;
          const data = await api("/settings", { method: "POST", body: { ...rest, language: languageCheck.value } });
          const next = data.config;
          const text = JSON.stringify(next.language || {}, null, 2);
          setDraft(next);
          setInitial(next);
          setLanguageText(text);
          setInitialLanguageText(text);
          notify?.("设置已保存，立即生效。", "ok");
        } catch (err) {
          notify?.(err.message, "error");
        } finally {
          setSaving(false);
        }
      }

      async function runTest() {
        setTesting(true);
        setTest(null);
        try {
          const data = await api("/test", { method: "POST", body: {} });
          setTest(data);
        } catch (err) {
          notify?.(err.message, "error");
        } finally {
          setTesting(false);
        }
      }

      function field(label, key, opts = {}) {
        return h("div", { className: "ab-field-wrap", key },
          h("span", { className: "ab-label" }, label),
          opts.code
            ? h("textarea", {
              className: "ab-field ab-code",
              value: getPath(key) ?? "",
              placeholder: opts.placeholder || "",
              spellCheck: false,
              onChange: (e) => setPath(key, e.target.value),
            })
            : h("input", {
              className: "ab-field",
              type: opts.password ? "password" : "text",
              value: getPath(key) ?? "",
              placeholder: opts.placeholder || "",
              spellCheck: false,
              onChange: (e) => setPath(key, e.target.value),
            }),
          opts.hint ? h("span", { className: "ab-hint" }, opts.hint) : null,
        );
      }

      const sample = { title: "药屋少女的呢喃", season: 3, group: "豌豆字幕组", resolution: draft.resolution || "1080p" };
      const filters = [["all", "全部"], ["info", "信息"], ["warn", "警告"], ["error", "错误"]];
      const visibleLogs = (logs || []).filter((row) => {
        if (logFilter === "all") return true;
        if (logFilter === "info") return !row.level || row.level === "info";
        return row.level === logFilter;
      });

      return h("div", { className: "ab-drawer-backdrop", onClick: onClose },
        h("aside", { className: "ab-drawer ab-drawer-wide", onClick: (e) => e.stopPropagation(), role: "dialog", "aria-modal": "true" },
          h("header", { className: "ab-drawer-head" },
            h("h2", { className: "ab-drawer-title" }, "设置"),
            h("button", { type: "button", className: "ab-icon-btn", onClick: onClose, "aria-label": "关闭" }, "×"),
          ),
          h("div", { className: "ab-drawer-body" },
            h("section", { className: "ab-panel" },
              h("h3", { className: "ab-panel-title" }, "qBittorrent"),
              field("WebUI 地址", "qbUrl", { placeholder: "http://127.0.0.1:8080" }),
              field("用户名", "qbUsername", { hint: "免密可留空" }),
              field("密码", "qbPassword", {
                password: true,
                placeholder: draft.qbPasswordSet ? "已保存，留空不修改" : "未设置",
              }),
              field("分类名", "category", { placeholder: "可选，例如 anime" }),
              field("保存根目录", "saveRoot", { placeholder: "%USERPROFILE%\\Videos\\ANIME" }),
              field("下载代理", "proxy", { placeholder: "http://127.0.0.1:7890", hint: "bgm 与资源站共用" }),
            ),
            h("section", { className: "ab-panel" },
              h("h3", { className: "ab-panel-title" }, "追新与命名"),
              field("轮询间隔（分钟）", "pollMinutes", { hint: "5–1440，默认 20" }),
              field("状态同步间隔（秒）", "reconcileSeconds", { hint: "30–3600，默认 60" }),
              field("默认分辨率", "resolution", { placeholder: "1080p / 2160p / any" }),
              field("命名模板", "naming.template", {
                placeholder: "{title} S{season:02}E{ep:02}{ver} [{group}]",
                hint: "变量：{title} {season:02} {ep:02} {ver} {group} {resolution} {lang}",
              }),
              h("span", { className: "ab-label" }, "命名预览"),
              h("div", { className: "ab-card-meta", style: { wordBreak: "break-all", lineHeight: 1.9 } },
                h("div", null, `${buildName(draft, sample, 4)}.mkv`),
                h("div", null, `${buildName(draft, sample, 4, "v2")}.mkv`),
              ),
            ),
            h("section", { className: "ab-panel" },
              h("div", { className: "ab-panel-head" },
                h("h3", { className: "ab-panel-title", style: { marginBottom: 0 } }, "语言规则"),
                h("button", { type: "button", className: "ab-btn", "data-variant": "ghost", disabled: !languageCheck.ok, onClick: () => setLanguageText(JSON.stringify(languageCheck.value, null, 2)) }, "格式化"),
              ),
              h("div", { className: "ab-hint", style: { marginTop: 2 } }, "默认接受简体/简日；BAHA、ANi 等纯繁体资源同样放行，同一集优先简体。关闭时把 allowTraditional 设为 false。"),
              h("textarea", {
                className: "ab-field ab-code",
                style: { marginTop: 10 },
                value: languageText,
                spellCheck: false,
                "aria-label": "语言规则 JSON",
                onChange: (e) => setLanguageText(e.target.value),
              }),
              languageCheck.ok
                ? h("div", { className: "ab-hint", style: { color: "var(--ab-ok)" } }, "JSON 合法")
                : h("div", { className: "ab-inline-error" }, `JSON 解析失败：${languageCheck.error}`),
            ),
            h("div", { className: "ab-actions" },
              h("button", { type: "button", className: "ab-btn", "data-variant": "primary", disabled: saving || !languageCheck.ok, onClick: save },
                saving ? "保存中…" : "保存设置"),
              h("button", { type: "button", className: "ab-btn", disabled: saving || !dirty, onClick: () => { setDraft(initial); setLanguageText(initialLanguageText); } }, "撤销更改"),
              h("button", { type: "button", className: "ab-btn", disabled: testing, onClick: runTest }, testing ? "测试中…" : "测试连接"),
              onGuide ? h("button", { type: "button", className: "ab-btn", "data-variant": "ghost", onClick: onGuide }, "使用引导") : null,
              dirty ? h(Chip, { tone: "warn" }, "有未保存的更改") : null,
            ),
            test ? h("section", { className: "ab-panel" },
              h("h3", { className: "ab-panel-title" }, "连接测试"),
              h("div", { className: "ab-test-row" }, h(Dot, { tone: test.qb?.ok ? "ok" : "danger" }),
                test.qb?.ok ? `qBittorrent 正常（${test.qb.version || "已连接"}）` : `qBittorrent 失败：${test.qb?.error || "未知错误"}`),
              h("div", { className: "ab-test-row" }, h(Dot, { tone: test.source?.ok ? "ok" : "danger" }),
                test.source?.ok ? "资源站正常" : `资源站失败：${test.source?.error || "未知错误"}`),
            ) : null,
            h("section", { className: "ab-panel" },
              h("div", { className: "ab-panel-head" },
                h("h3", { className: "ab-panel-title", style: { marginBottom: 0 } }, "最近日志"),
                h("div", { className: "ab-row" },
                  filters.map(([key, label]) => h("button", {
                    key,
                    type: "button",
                    className: "ab-btn ab-filter",
                    "data-on": logFilter === key ? "1" : "0",
                    onClick: () => setLogFilter(key),
                  }, label)),
                  h("button", { type: "button", className: "ab-btn", "data-variant": "ghost", onClick: loadLogs }, "刷新"),
                ),
              ),
              visibleLogs.length
                ? h("div", { className: "ab-logs" }, visibleLogs.map((row, index) => h("div", {
                  key: `${row.at}-${index}`,
                  className: "ab-log-row",
                  "data-level": row.level || "info",
                },
                  h(Dot, { tone: row.level === "error" ? "danger" : row.level === "warn" ? "warn" : "" }),
                  h("span", { className: "ab-log-time", title: fmtTime(row.at) }, timeAgo(row.at)),
                  h("span", { className: "ab-log-msg" }, row.message),
                )))
                : h("div", { className: "ab-empty" }, "暂无日志"),
            ),
          ),
        ),
      );
    }

    function SetupGuide({ onClose, onOpenSettings }) {
      const [test, setTest] = React.useState(null);
      const [busy, setBusy] = React.useState(false);

      const check = React.useCallback(async () => {
        setBusy(true);
        try {
          setTest(await api("/test", { method: "POST", body: {} }));
        } catch (err) {
          setTest({ qb: { ok: false, error: err.message }, source: { ok: false, error: err.message } });
        } finally {
          setBusy(false);
        }
      }, []);

      React.useEffect(() => {
        void check();
      }, [check]);

      const qb = test?.qb;
      const source = test?.source;
      const status = (tone, text, title) => h("div", { className: "ab-test-row", title: title || undefined },
        h(Dot, { tone }), text);

      return h("div", { className: "ab-modal-backdrop", onClick: onClose },
        h("div", { className: "ab-modal ab-guide", onClick: (e) => e.stopPropagation(), role: "dialog", "aria-modal": "true" },
          h("header", { className: "ab-modal-head" },
            h("h2", { className: "ab-modal-title" }, "开始之前"),
            h("button", { type: "button", className: "ab-icon-btn", onClick: onClose, "aria-label": "关闭" }, "×"),
          ),
          h("div", { className: "ab-modal-body" },
            h("p", { className: "ab-guide-lead" }, "先确认三件事，之后随时可在设置里改。"),
            h("div", { className: "ab-guide-item" },
              h("div", { className: "ab-guide-h" },
                h("span", { className: "ab-guide-n" }, "1"), "qBittorrent", h(Chip, { tone: "warn" }, "必需")),
              h("p", null, "打开「工具 → 选项 → Web UI」，勾选「启用 Web UI」。本机使用可再勾「对本地主机跳过身份验证」，否则要填账号密码。",
                h("br"), h("span", { className: "ab-guide-code" }, "http://127.0.0.1:8080")),
            ),
            h("div", { className: "ab-guide-item" },
              h("div", { className: "ab-guide-h" },
                h("span", { className: "ab-guide-n" }, "2"), "网络代理", h(Chip, null, "建议")),
              h("p", null, "bgm.tv 需要代理，否则封面、热搜、简介会加载不出来；搜索、订阅、下载不受影响。",
                h("br"), h("span", { className: "ab-guide-code" }, "http://127.0.0.1:7890")),
            ),
            h("div", { className: "ab-guide-item" },
              h("div", { className: "ab-guide-h" },
                h("span", { className: "ab-guide-n" }, "3"), "保存目录", h(Chip, { tone: "warn" }, "必需")),
              h("p", null, "下载会按「番名\\Season 01」自动建目录，默认在 ",
                h("span", { className: "ab-guide-code" }, "%USERPROFILE%\\Videos\\ANIME"),
                "，可在设置里换。"),
            ),
            h("div", { className: "ab-guide-status" },
              !test ? status("", busy ? "正在检测…" : "尚未检测")
                : qb?.ok ? status("ok", `qBittorrent 已连接${qb.version ? `（${qb.version}）` : ""}`)
                  : status("danger", "qBittorrent 未连接", qb?.error || ""),
              !test ? null
                : source?.ok ? status("ok", "资源站可访问")
                  : status("warn", "资源站不可用", source?.error || ""),
            ),
            h("div", { className: "ab-actions" },
              h("button", { type: "button", className: "ab-btn", disabled: busy, onClick: check }, busy ? "检测中…" : "重新检测"),
              h("button", { type: "button", className: "ab-btn", onClick: onOpenSettings }, "打开设置"),
              h("button", { type: "button", className: "ab-btn", "data-variant": "primary", onClick: onClose }, "开始使用"),
            ),
          ),
        ),
      );
    }

    function App() {
      const theme = useTheme();
      const { snap, error: snapError, reload } = useSnapshot();
      const rootRef = React.useRef(null);

      // 遮罩层用 position:fixed 时会相对整个窗口定位，而插件面板并不从窗口左上角开始
      // （左侧是 DSH 侧边栏），所以把面板的矩形写进 CSS 变量，让遮罩贴着面板居中。
      React.useEffect(() => {
        const el = rootRef.current;
        if (!el) return undefined;
        const measure = () => {
          const r = el.getBoundingClientRect();
          el.style.setProperty("--ab-layer-left", `${Math.round(r.left)}px`);
          el.style.setProperty("--ab-layer-top", `${Math.round(r.top)}px`);
          el.style.setProperty("--ab-layer-width", `${Math.round(r.width)}px`);
          el.style.setProperty("--ab-layer-height", `${Math.round(r.height)}px`);
        };
        measure();
        const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
        observer?.observe(el);
        window.addEventListener("resize", measure);
        return () => {
          observer?.disconnect();
          window.removeEventListener("resize", measure);
        };
      }, []);

      const [query, setQuery] = React.useState("");
      const [focused, setFocused] = React.useState(false);
      const [trend, setTrend] = React.useState({ loading: false, items: [], error: "" });
      const trendRef = React.useRef(false);
      const [search, setSearch] = React.useState({
        open: false, query: "", loading: false, rows: [], error: "", selected: null, groups: [], groupsLoading: false,
      });
      const [busyGroup, setBusyGroup] = React.useState("");
      const [panel, setPanel] = React.useState(null);
      const [subjects, setSubjects] = React.useState({});
      const [polling, setPolling] = React.useState(false);
      const [toast, setToast] = React.useState(null);
      const [guide, setGuide] = React.useState(false);
      const guideRef = React.useRef(false);

      React.useEffect(() => {
        if (guideRef.current || !snap) return;
        let done = false;
        try {
          done = window.localStorage.getItem("ab-guide-done") === "1";
        } catch {
          done = false;
        }
        if (!done && (snap.subscriptions || []).length === 0) {
          guideRef.current = true;
          setGuide(true);
        }
      }, [snap]);

      const closeGuide = React.useCallback(() => {
        try {
          window.localStorage.setItem("ab-guide-done", "1");
        } catch {
          // ignore
        }
        setGuide(false);
      }, []);

      const notify = React.useCallback((text, kind) => {
        setToast({ text, kind: kind || "info" });
      }, []);

      React.useEffect(() => {
        if (!toast || toast.kind === "error") return;
        const timer = setTimeout(() => setToast(null), 4200);
        return () => clearTimeout(timer);
      }, [toast]);

      const subs = snap?.subscriptions || [];
      const subIds = subs.map((sub) => Number(sub.subjectId)).filter(Boolean).sort((a, b) => a - b).join(",");

      React.useEffect(() => {
        if (!subIds) return;
        let alive = true;
        const ids = subIds.split(",").map(Number);
        const chunks = [];
        for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));
        Promise.all(chunks.map((chunk) => api("/bgm/subjects", { method: "POST", body: { ids: chunk } })
          .then((data) => data.subjects || {})
          .catch(() => ({}))))
          .then((list) => {
            if (!alive) return;
            const merged = Object.assign({}, ...list);
            if (Object.keys(merged).length) setSubjects((prev) => ({ ...prev, ...merged }));
          });
        return () => {
          alive = false;
        };
      }, [subIds]);

      function ensureTrend() {
        if (trendRef.current) return;
        trendRef.current = true;
        setTrend({ loading: true, items: [], error: "" });
        api("/bgm/suggest?limit=10")
          .then((data) => setTrend({ loading: false, items: data.items || [], error: "" }))
          .catch((err) => {
            trendRef.current = false;
            setTrend({ loading: false, items: [], error: err.message });
          });
      }

      React.useEffect(() => {
        const onKey = (e) => {
          if (e.key !== "Escape") return;
          if (panel) setPanel(null);
          else if (search.open) setSearch((prev) => ({ ...prev, open: false, selected: null, groups: [] }));
          else setFocused(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
      }, [panel, search.open]);

      async function runSearch(text) {
        const q = String(text ?? query).trim();
        if (!q) return;
        setFocused(false);
        setSearch({ open: true, query: q, loading: true, rows: [], error: "", selected: null, groups: [], groupsLoading: false });
        try {
          const data = await api(`/search?q=${encodeURIComponent(q)}`);
          setSearch((prev) => ({ ...prev, rows: data.rows || [], loading: false }));
        } catch (err) {
          setSearch((prev) => ({ ...prev, error: err.message, loading: false }));
        }
      }

      async function pickTrend(item) {
        setQuery(item.title);
        setFocused(false);
        const seed = { subjectId: item.id, title: item.title, season: 1 };
        setSearch({ open: true, query: item.title, loading: false, rows: [], error: "", selected: seed, groups: [], groupsLoading: true });
        try {
          const data = await api(`/subject-groups?subjectId=${item.id}&title=${encodeURIComponent(item.title)}`);
          setSearch((prev) => ({ ...prev, groups: data.groups || [], groupsLoading: false }));
        } catch (err) {
          setSearch((prev) => ({ ...prev, error: err.message, groupsLoading: false }));
        }
      }

      async function openAnime(row) {
        setSearch((prev) => ({ ...prev, selected: row, groups: [], groupsLoading: true, error: "" }));
        try {
          const data = await api(`/anime?subjectId=${encodeURIComponent(row.subjectId || "")}&title=${encodeURIComponent(row.title || "")}`);
          setSearch((prev) => ({ ...prev, groups: data.groups || [], groupsLoading: false }));
        } catch (err) {
          setSearch((prev) => ({ ...prev, error: err.message, groupsLoading: false }));
        }
      }

      async function subscribe(group) {
        if (!search.selected) return;
        setBusyGroup(group.name);
        try {
          await api("/subscribe", {
            method: "POST",
            body: {
              subjectId: search.selected.subjectId,
              title: search.selected.title,
              group: group.name,
              season: group.season || search.selected.season || 1,
              resolution: group.resolution || "1080p",
            },
          });
          notify(`已订阅《${search.selected.title}》· ${group.name}，正在补齐已更新集数`, "ok");
          setSearch((prev) => ({ ...prev, open: false, selected: null, groups: [] }));
          await reload();
        } catch (err) {
          notify(err.message, "error");
        } finally {
          setBusyGroup("");
        }
      }

      async function pollAll() {
        setPolling(true);
        try {
          await api("/check", { method: "POST", body: {} });
          await reload();
          notify("已完成一次全量检查", "ok");
        } catch (err) {
          notify(err.message, "error");
        } finally {
          setPolling(false);
        }
      }

      return h("div", { className: "ab-root", ref: rootRef, "data-ab-theme": theme, "data-ab-layer": search.open ? "1" : "0" },
        h("header", { className: "ab-topbar" },
          h("div", { className: "ab-topbar-inner" },
            h("div", { className: "ab-brand" }, "一键追番"),
            h(SearchBar, {
              query,
              setQuery,
              focused,
              setFocused,
              trend,
              loading: search.loading,
              onFocus: ensureTrend,
              onSearch: runSearch,
              onPick: pickTrend,
            }),
            h("div", { className: "ab-top-actions" },
              h(StatusDots, { snap, polling, onPoll: pollAll }),
              h("button", { type: "button", className: "ab-icon-btn", title: "设置", "aria-label": "设置", onClick: () => setPanel({ type: "settings" }) }, "⚙"),
            ),
          ),
        ),
        snapError ? h(Banner, { tone: "danger", actionLabel: "重试", onAction: reload }, `状态加载失败：${snapError}`) : null,
        h("main", { className: "ab-main" },
          h(Home, {
            snap,
            subjects,
            polling,
            onPollAll: pollAll,
            onFocusSearch: () => {
              setFocused(true);
              ensureTrend();
              const el = document.querySelector(".ab-search input");
              if (el) el.focus();
            },
            onOpen: (sub) => setPanel({ type: "detail", id: sub.subjectId, sub, initial: subjects[sub.subjectId] }),
          }),
        ),
        search.open ? h(SearchOverlay, {
          search,
          snap,
          busyGroup,
          onClose: () => setSearch((prev) => ({ ...prev, open: false, selected: null, groups: [], error: "" })),
          onBack: () => setSearch((prev) => ({ ...prev, selected: null, groups: [], error: "" })),
          onOpenAnime: openAnime,
          onSubscribe: subscribe,
          onWiki: (id) => setPanel({ type: "detail", id, initial: subjects[id] }),
        }) : null,
        panel?.type === "detail" ? h(DetailModal, {
          id: panel.id,
          sub: panel.sub ? subs.find((item) => item.id === panel.sub.id) || panel.sub : null,
          initial: panel.initial,
          onClose: () => setPanel(null),
          reload,
          notify,
        }) : null,
        panel?.type === "settings" ? h(SettingsDrawer, {
          onClose: () => setPanel(null),
          notify,
          onGuide: () => {
            setPanel(null);
            setGuide(true);
          },
        }) : null,
        guide ? h(SetupGuide, {
          onClose: closeGuide,
          onOpenSettings: () => {
            closeGuide();
            setPanel({ type: "settings" });
          },
        }) : null,
        toast ? h("div", { className: "ab-toast", "data-kind": toast.kind, role: "status", "aria-live": "polite" },
          h(Dot, { tone: toast.kind === "error" ? "danger" : toast.kind === "ok" ? "ok" : "brand" }),
          h("div", { className: "ab-toast-text" }, toast.text),
          h("button", { type: "button", className: "ab-toast-x", onClick: () => setToast(null), "aria-label": "关闭提示" }, "×"),
        ) : null,
      );
    }

    function apply(ctx) {
      ctx.effect(() => {
        const style = document.createElement("style");
        style.dataset.plugin = "@soliecho/dsh-anime-follow";
        style.textContent = css;
        document.head.appendChild(style);
        return () => style.remove();
      });
      ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
        name: "sidebar.panellist",
        id: PANEL,
        order: 12,
        label: () => "一键追番",
      }, Icon));
      ctx.slots.inject("main", () => ctx.slots.register({
        name: "main",
        key: PANEL,
      }, App));
    }

    exports.apply = apply;
    exports.inject = ["slots"];
    return module.exports;
  },
});
