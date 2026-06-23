#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════╗
 * ║          PULSE MESSENGER v2              ║
 * ║  Запуск: npm install ws  &&  node messenger.js  ║
 * ║  Браузер: http://localhost:3000          ║
 * ╚══════════════════════════════════════════╝
 */

const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");

const PORT = process.env.PORT || 3000;

// ── Users: name → { ws, lastSeen, id } ──────────────────
const users = new Map();
let nextId = 1;

// ══════════════════════════════════════════════════════════
// FRONTEND HTML (весь UI в одной строке)
// ══════════════════════════════════════════════════════════
const HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pulse Messenger</title>
<style>
/* ── Reset & Base ── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0e1117;
  --s1:#161b27;
  --s2:#1d2333;
  --s3:#252d42;
  --s4:#2e3850;
  --border:#2a3347;
  --border2:#3a4560;
  --accent:#6366f1;
  --accent-h:#7c7ff5;
  --accent-d:#4f51cc;
  --accent-glow:rgba(99,102,241,0.22);
  --text:#e2e8f0;
  --text2:#94a3b8;
  --text3:#64748b;
  --green:#22c55e;
  --green-bg:rgba(34,197,94,0.12);
  --red:#ef4444;
  --red-bg:rgba(239,68,68,0.12);
  --yellow:#f59e0b;
  --blue:#3b82f6;
  --blue-bg:rgba(59,130,246,0.12);
  --out-msg:#6366f1;
  --in-msg:#1d2333;
  --radius-lg:18px;
  --radius-md:12px;
  --radius-sm:8px;
  --shadow-lg:0 20px 60px rgba(0,0,0,0.5);
  --shadow-md:0 8px 24px rgba(0,0,0,0.3);
}
html,body{height:100%;overflow:hidden}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',system-ui,sans-serif;
  background:var(--bg);color:var(--text);font-size:14px;line-height:1.5}

/* ── Scrollbar ── */
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:var(--s4)}

/* ── Forms ── */
input,textarea,select{
  font-family:inherit;font-size:14px;
  background:var(--s2);border:1.5px solid var(--border);
  border-radius:var(--radius-md);
  padding:11px 14px;color:var(--text);outline:none;
  width:100%;transition:border-color 0.2s,box-shadow 0.2s;
  -webkit-appearance:none;
}
input:focus,textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}
input::placeholder,textarea::placeholder{color:var(--text3)}
textarea{resize:none;line-height:1.5}
button{font-family:inherit;font-size:14px;cursor:pointer;border:none;outline:none;transition:all 0.15s}

.btn-primary{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  background:linear-gradient(135deg,var(--accent),var(--accent-h));
  color:#fff;font-weight:600;
  border-radius:var(--radius-md);padding:12px 24px;
  box-shadow:0 4px 20px var(--accent-glow);
  transition:opacity 0.2s,transform 0.15s,box-shadow 0.2s;
}
.btn-primary:hover{opacity:0.92;transform:translateY(-1px);box-shadow:0 6px 28px var(--accent-glow)}
.btn-primary:active{transform:translateY(0);opacity:1}
.btn-primary:disabled{opacity:0.4;cursor:not-allowed;transform:none!important;box-shadow:none}

.btn-ghost{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  background:var(--s2);border:1.5px solid var(--border);
  color:var(--text2);font-weight:500;
  border-radius:var(--radius-md);padding:10px 18px;
}
.btn-ghost:hover{background:var(--s3);border-color:var(--border2);color:var(--text)}

.icon-btn{
  width:36px;height:36px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  background:var(--s3);border:1.5px solid var(--border);
  color:var(--text2);font-size:16px;flex-shrink:0;
  transition:background 0.15s,color 0.15s,border-color 0.15s;
}
.icon-btn:hover{background:var(--s4);color:var(--text);border-color:var(--border2)}
.icon-btn.green{background:var(--green-bg);border-color:rgba(34,197,94,0.3);color:var(--green)}
.icon-btn.green:hover{background:var(--green);color:#000;border-color:var(--green)}
.icon-btn.blue{background:var(--blue-bg);border-color:rgba(59,130,246,0.3);color:var(--blue)}
.icon-btn.blue:hover{background:var(--blue);color:#fff;border-color:var(--blue)}
.icon-btn.red{background:var(--red-bg);border-color:rgba(239,68,68,0.3);color:var(--red)}
.icon-btn.red:hover{background:var(--red);color:#fff;border-color:var(--red)}
.icon-btn.accent{background:var(--accent-glow);border-color:rgba(99,102,241,0.3);color:var(--accent)}
.icon-btn.accent:hover{background:var(--accent);color:#fff;border-color:var(--accent)}

/* ── Avatar ── */
.avatar{
  border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-weight:700;color:#fff;flex-shrink:0;
  background:linear-gradient(135deg,var(--accent),var(--accent-h));
  user-select:none;
}
.avatar.sm{width:32px;height:32px;font-size:13px}
.avatar.md{width:40px;height:40px;font-size:16px}
.avatar.lg{width:52px;height:52px;font-size:20px}
.avatar.xl{width:80px;height:80px;font-size:32px}
.avatar.xxl{width:100px;height:100px;font-size:40px}

/* ── Status dot ── */
.status-dot{
  width:10px;height:10px;border-radius:50%;
  border:2px solid var(--s1);flex-shrink:0;
}
.status-dot.online{background:var(--green)}
.status-dot.offline{background:var(--text3)}

/* ── Badge ── */
.badge{
  display:inline-flex;align-items:center;gap:4px;
  padding:2px 8px;border-radius:20px;
  font-size:11px;font-weight:600;letter-spacing:0.05em;
}
.badge.green{background:var(--green-bg);color:var(--green);border:1px solid rgba(34,197,94,0.25)}
.badge.muted{background:var(--s3);color:var(--text3);border:1px solid var(--border)}

/* ════════════════════════════════════════════
   AUTH SCREEN
════════════════════════════════════════════ */
#auth-screen{
  position:fixed;inset:0;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:24px;gap:32px;
  background:radial-gradient(ellipse at 30% 20%,rgba(99,102,241,0.08) 0%,transparent 60%),
             radial-gradient(ellipse at 70% 80%,rgba(99,102,241,0.05) 0%,transparent 60%),
             var(--bg);
}

.auth-logo{
  display:flex;flex-direction:column;align-items:center;gap:14px;
}
.auth-logo-icon{
  width:68px;height:68px;border-radius:22px;
  background:linear-gradient(135deg,var(--accent),var(--accent-h));
  display:flex;align-items:center;justify-content:center;
  font-size:30px;
  box-shadow:0 12px 40px var(--accent-glow),0 0 0 1px rgba(99,102,241,0.3);
}
.auth-logo-name{
  font-size:28px;font-weight:800;letter-spacing:-1px;
  background:linear-gradient(135deg,var(--text) 30%,var(--text2));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.auth-logo-sub{font-size:13px;color:var(--text3);letter-spacing:0.02em}

.auth-card{
  width:100%;max-width:400px;
  background:var(--s1);
  border:1.5px solid var(--border);
  border-radius:24px;
  padding:32px;
  box-shadow:var(--shadow-lg);
  display:flex;flex-direction:column;gap:20px;
}
.auth-card-title{font-size:20px;font-weight:700;color:var(--text)}
.auth-card-sub{font-size:13px;color:var(--text3);margin-top:-12px;line-height:1.6}
.form-field{display:flex;flex-direction:column;gap:7px}
.form-label{font-size:12px;font-weight:600;color:var(--text2);letter-spacing:0.04em;text-transform:uppercase}

.auth-error{
  display:none;
  background:var(--red-bg);border:1px solid rgba(239,68,68,0.3);
  border-radius:var(--radius-sm);
  padding:11px 14px;font-size:13px;color:var(--red);
  animation:shake 0.3s ease;
}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}

.auth-hint{
  display:flex;align-items:flex-start;gap:10px;
  background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);
  border-radius:var(--radius-sm);padding:12px 14px;
  font-size:12px;color:var(--text2);line-height:1.6;
}
.auth-hint-icon{font-size:16px;flex-shrink:0;margin-top:1px}

/* ════════════════════════════════════════════
   MAIN LAYOUT
════════════════════════════════════════════ */
#app{
  display:none;height:100vh;
  flex-direction:row;overflow:hidden;
}

/* ── Sidebar ── */
.sidebar{
  width:310px;min-width:310px;
  background:var(--s1);
  border-right:1.5px solid var(--border);
  display:flex;flex-direction:column;
  overflow:hidden;
}

.sidebar-header{
  padding:16px;
  display:flex;align-items:center;gap:10px;
  border-bottom:1.5px solid var(--border);
  background:var(--s1);
}
.sidebar-header .avatar{position:relative}
.sidebar-header .avatar .status-dot{
  position:absolute;bottom:0;right:0;
  width:11px;height:11px;border:2px solid var(--s1);
}
.my-username{font-weight:700;font-size:14px;flex:1;min-width:0;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.my-status{font-size:11px;color:var(--green);margin-top:1px}

.search-box{padding:12px 14px;border-bottom:1.5px solid var(--border)}
.search-inner{position:relative}
.search-icon{
  position:absolute;left:12px;top:50%;transform:translateY(-50%);
  color:var(--text3);font-size:15px;pointer-events:none;
}
.search-box input{padding-left:38px;font-size:13px;border-radius:10px}
.search-spinner{
  position:absolute;right:12px;top:50%;transform:translateY(-50%);
  width:16px;height:16px;
  border:2px solid var(--border2);border-top-color:var(--accent);
  border-radius:50%;animation:spin 0.7s linear infinite;
  display:none;
}
@keyframes spin{to{transform:translateY(-50%) rotate(360deg)}}

.sidebar-tabs{
  display:flex;border-bottom:1.5px solid var(--border);
}
.sidebar-tab{
  flex:1;padding:10px;
  font-size:12px;font-weight:600;letter-spacing:0.04em;
  color:var(--text3);background:transparent;
  border-bottom:2px solid transparent;
  transition:color 0.2s,border-color 0.2s;
  text-transform:uppercase;
}
.sidebar-tab:hover{color:var(--text2)}
.sidebar-tab.active{color:var(--accent);border-bottom-color:var(--accent)}

.user-list{flex:1;overflow-y:auto;padding:6px 0}

.user-item{
  display:flex;align-items:center;gap:12px;
  padding:10px 14px;cursor:pointer;
  transition:background 0.12s;position:relative;
}
.user-item:hover{background:var(--s2)}
.user-item.active{background:var(--s3)}
.user-item .avatar{position:relative}
.user-item .avatar .status-dot{
  position:absolute;bottom:0;right:0;
  width:10px;height:10px;border:2px solid var(--s1);
}
.user-item:hover .user-item-avatar .status-dot{border-color:var(--s2)}
.user-item.active .status-dot{border-color:var(--s3)}

.user-item-info{flex:1;min-width:0}
.user-item-name{font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.user-item-sub{font-size:12px;color:var(--text3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.user-item-sub.online{color:var(--green)}

.quick-call{
  display:flex;gap:4px;
  opacity:0;pointer-events:none;
  transition:opacity 0.15s;flex-shrink:0;
}
.user-item:hover .quick-call{opacity:1;pointer-events:all}
.quick-call .icon-btn{width:28px;height:28px;font-size:13px}

.empty-state{
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:12px;padding:48px 24px;
  color:var(--text3);text-align:center;
}
.empty-icon{font-size:40px;opacity:0.5}
.empty-title{font-size:14px;font-weight:600;color:var(--text2)}
.empty-sub{font-size:12px;line-height:1.6}

/* ── Chat Area ── */
.chat-area{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg)}

.chat-empty{
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  flex:1;gap:16px;padding:40px;
}
.chat-empty-icon{
  width:80px;height:80px;border-radius:28px;
  background:var(--s2);border:1.5px solid var(--border);
  display:flex;align-items:center;justify-content:center;
  font-size:36px;
}
.chat-empty-title{font-size:18px;font-weight:700;color:var(--text2)}
.chat-empty-sub{font-size:13px;color:var(--text3);text-align:center;line-height:1.7;max-width:280px}

/* chat topbar */
.chat-topbar{
  padding:12px 18px;
  background:var(--s1);border-bottom:1.5px solid var(--border);
  display:flex;align-items:center;gap:12px;flex-shrink:0;
  backdrop-filter:blur(12px);
}
.chat-topbar .avatar{position:relative}
.chat-topbar .avatar .status-dot{
  position:absolute;bottom:0;right:0;
  width:11px;height:11px;border:2px solid var(--s1);
}
.chat-peer-info{flex:1;min-width:0}
.chat-peer-name{font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chat-peer-status{font-size:12px;color:var(--text3);margin-top:1px}
.chat-peer-status.online-status{color:var(--green)}
.topbar-actions{display:flex;gap:6px}

/* messages */
.messages{
  flex:1;overflow-y:auto;
  padding:20px;
  display:flex;flex-direction:column;gap:4px;
}
.day-separator{
  display:flex;align-items:center;gap:12px;
  color:var(--text3);font-size:11px;font-weight:600;
  letter-spacing:0.05em;text-transform:uppercase;
  margin:12px 0;
}
.day-separator::before,.day-separator::after{
  content:'';flex:1;height:1px;background:var(--border);
}

.msg-group{display:flex;flex-direction:column;gap:2px;margin-bottom:4px}
.msg-group.out{align-items:flex-end}
.msg-group.in{align-items:flex-start}

.msg{
  max-width:68%;position:relative;
  animation:msgIn 0.18s cubic-bezier(0.4,0,0.2,1);
}
@keyframes msgIn{from{opacity:0;transform:translateY(8px) scale(0.98)}to{opacity:1;transform:none}}
.msg-bubble{
  padding:10px 14px;
  word-break:break-word;line-height:1.55;font-size:14px;
}
.msg.out .msg-bubble{
  background:var(--out-msg);
  color:#fff;border-radius:18px 4px 18px 18px;
  box-shadow:0 2px 12px rgba(99,102,241,0.3);
}
.msg.in .msg-bubble{
  background:var(--in-msg);
  color:var(--text);border-radius:4px 18px 18px 18px;
  border:1.5px solid var(--border);
}
/* last message in group gets bigger radius */
.msg-group.out .msg:last-child .msg-bubble{border-radius:18px 4px 4px 18px}
.msg-group.in .msg:last-child .msg-bubble{border-radius:4px 18px 18px 4px}

.msg-time{
  font-size:10px;opacity:0.6;margin-top:4px;
  padding:0 2px;
}
.msg.out .msg-time{text-align:right;color:rgba(255,255,255,0.7)}
.msg.in .msg-time{text-align:left;color:var(--text3)}

.system-msg{
  align-self:center;
  background:var(--s2);border:1px solid var(--border);
  border-radius:20px;padding:5px 14px;
  font-size:11px;color:var(--text3);
  margin:8px 0;text-align:center;
}

/* input bar */
.input-bar{
  padding:14px 16px;
  background:var(--s1);border-top:1.5px solid var(--border);
  display:flex;align-items:flex-end;gap:10px;flex-shrink:0;
}
.msg-textarea{
  flex:1;border-radius:14px;
  padding:11px 15px;max-height:120px;
  font-size:14px;line-height:1.5;
}
.send-btn{
  width:42px;height:42px;border-radius:50%;flex-shrink:0;
  background:linear-gradient(135deg,var(--accent),var(--accent-h));
  color:#fff;font-size:18px;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 16px var(--accent-glow);
  transform:scale(0.95);
}
.send-btn:hover{transform:scale(1.05);box-shadow:0 6px 24px var(--accent-glow)}
.send-btn:active{transform:scale(0.95)}
.send-btn svg{pointer-events:none}

/* ════════════════════════════════════════════
   CALL OVERLAY
════════════════════════════════════════════ */
#call-overlay{
  display:none;position:fixed;inset:0;z-index:1000;
  background:rgba(8,10,16,0.95);
  backdrop-filter:blur(20px) saturate(0.5);
  flex-direction:column;align-items:center;justify-content:center;gap:24px;
}
#call-overlay.active{display:flex}

.call-bg{
  position:absolute;inset:0;overflow:hidden;pointer-events:none;
}
.call-bg-blob{
  position:absolute;border-radius:50%;filter:blur(80px);opacity:0.15;
  animation:blobFloat 6s ease-in-out infinite;
}
.call-bg-blob:nth-child(1){width:400px;height:400px;background:var(--accent);top:-100px;left:-100px;animation-delay:0s}
.call-bg-blob:nth-child(2){width:300px;height:300px;background:#8b5cf6;bottom:-50px;right:-50px;animation-delay:2s}
@keyframes blobFloat{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,20px) scale(1.1)}}

.call-content{
  position:relative;z-index:1;
  display:flex;flex-direction:column;align-items:center;gap:20px;
}

/* Avatar ring animation */
.call-avatar-wrap{position:relative;display:flex;align-items:center;justify-content:center}
.call-ring{
  position:absolute;border-radius:50%;
  animation:callRing 2s ease-out infinite;
}
.call-ring:nth-child(1){width:130px;height:130px;border:2px solid rgba(99,102,241,0.5);animation-delay:0s}
.call-ring:nth-child(2){width:160px;height:160px;border:2px solid rgba(99,102,241,0.3);animation-delay:0.5s}
.call-ring:nth-child(3){width:190px;height:190px;border:1px solid rgba(99,102,241,0.15);animation-delay:1s}
@keyframes callRing{0%{transform:scale(0.8);opacity:1}100%{transform:scale(1.3);opacity:0}}
.call-ring.stopped{animation:none}

.call-info{text-align:center;display:flex;flex-direction:column;gap:6px}
.call-name{font-size:26px;font-weight:800;color:var(--text);letter-spacing:-0.5px}
.call-status{font-size:14px;color:var(--text2)}
.call-timer{font-size:18px;font-weight:700;color:var(--accent);font-variant-numeric:tabular-nums;display:none}

/* video grid */
.video-grid{
  display:none;
  gap:12px;flex-wrap:wrap;justify-content:center;
  width:100%;max-width:720px;padding:0 16px;
}
.video-item{display:flex;flex-direction:column;gap:8px;align-items:center}
.video-label{font-size:11px;color:var(--text3);letter-spacing:0.05em;text-transform:uppercase;font-weight:600}
video{
  border-radius:16px;background:#000;
  max-width:320px;width:100%;
  aspect-ratio:4/3;object-fit:cover;
}
#local-video{border:2px solid var(--accent);box-shadow:0 0 20px var(--accent-glow)}

/* call action buttons */
.call-actions{display:flex;gap:16px;align-items:center}
.call-btn{
  display:flex;flex-direction:column;align-items:center;gap:6px;
  cursor:pointer;transition:transform 0.15s;
}
.call-btn:hover{transform:scale(1.08)}
.call-btn-icon{
  width:64px;height:64px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:26px;
  box-shadow:var(--shadow-md);
}
.call-btn-label{font-size:11px;color:var(--text3);font-weight:500;text-transform:uppercase;letter-spacing:0.05em}
.call-btn.accept .call-btn-icon{background:var(--green);color:#000}
.call-btn.accept .call-btn-icon:hover{background:#16a34a}
.call-btn.reject .call-btn-icon,.call-btn.end .call-btn-icon{background:var(--red);color:#fff}
.call-btn.mute .call-btn-icon{background:var(--s3);border:1.5px solid var(--border);color:var(--text)}
.call-btn.mute.active .call-btn-icon{background:var(--accent);color:#fff;border-color:var(--accent)}

#incoming-actions{display:none;flex-direction:column;align-items:center;gap:10px}
.incoming-type{
  display:inline-flex;align-items:center;gap:6px;
  background:var(--s3);border:1px solid var(--border);
  border-radius:20px;padding:5px 14px;
  font-size:12px;color:var(--text2);font-weight:500;
}
#active-actions{display:none}

/* ── Toast ── */
.toast{
  position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-80px);
  background:var(--s2);border:1.5px solid var(--border);
  border-radius:var(--radius-md);padding:12px 20px;
  font-size:13px;color:var(--text);
  box-shadow:var(--shadow-md);z-index:2000;
  transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);
  display:flex;align-items:center;gap:10px;white-space:nowrap;
}
.toast.show{transform:translateX(-50%) translateY(0)}

/* ── Typing indicator ── */
.typing-dots{display:inline-flex;gap:4px;align-items:center;padding:2px 0}
.typing-dot{width:6px;height:6px;border-radius:50%;background:var(--text3);animation:typingDot 1.4s ease infinite}
.typing-dot:nth-child(2){animation-delay:0.2s}
.typing-dot:nth-child(3){animation-delay:0.4s}
@keyframes typingDot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}

/* ── Connection banner ── */
.conn-banner{
  background:rgba(239,68,68,0.12);border-bottom:1px solid rgba(239,68,68,0.25);
  padding:8px 16px;text-align:center;
  font-size:12px;color:var(--red);
  display:none;
}
.conn-banner.visible{display:block}
</style>
</head>
<body>

<!-- ═══════════════════════ AUTH SCREEN ═══════════════════════ -->
<div id="auth-screen">
  <div class="auth-logo">
    <div class="auth-logo-icon">💬</div>
    <div class="auth-logo-name">Pulse</div>
    <div class="auth-logo-sub">Мессенджер с P2P звонками</div>
  </div>

  <div class="auth-card">
    <div>
      <div class="auth-card-title">Войти или зарегистрироваться</div>
      <div class="auth-card-sub" style="margin-top:6px">Введите имя — и вы в сети. Пароль не нужен.</div>
    </div>

    <div class="form-field">
      <label class="form-label">Ваше имя</label>
      <input id="inp-name" type="text" placeholder="Например: Алекс или alex_99" maxlength="32" autocomplete="off"/>
    </div>

    <div class="auth-error" id="auth-err"></div>

    <button class="btn-primary" id="btn-enter" onclick="doLogin()" style="width:100%;padding:13px">
      <span>Войти</span>
      <span>→</span>
    </button>

    <div class="auth-hint">
      <span class="auth-hint-icon">💡</span>
      <div>Если вы уже заходили под этим именем — просто войдёте снова. Имя должно быть уникальным среди онлайн-пользователей.</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════ APP ═══════════════════════ -->
<div id="app">
  <!-- Sidebar -->
  <div class="sidebar">
    <!-- My profile -->
    <div class="sidebar-header">
      <div class="avatar md" id="my-ava">?</div>
      <div style="flex:1;min-width:0">
        <div class="my-username" id="my-name-disp">—</div>
        <div class="my-status">● онлайн</div>
      </div>
      <div class="badge green" id="online-count">0 онлайн</div>
    </div>

    <!-- Search -->
    <div class="search-box">
      <div class="search-inner">
        <span class="search-icon">🔍</span>
        <input id="search-inp" type="text" placeholder="Поиск пользователей…" autocomplete="off"
          oninput="onSearch(this.value)"/>
        <div class="search-spinner" id="search-spin"></div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="sidebar-tabs">
      <button class="sidebar-tab active" id="tab-search" onclick="setTab('search')">Все</button>
      <button class="sidebar-tab" id="tab-recent" onclick="setTab('recent')">Недавние</button>
    </div>

    <!-- User list -->
    <div class="user-list" id="user-list">
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <div class="empty-title">Никого нет онлайн</div>
        <div class="empty-sub">Поделитесь адресом сервера с другим человеком</div>
      </div>
    </div>
  </div>

  <!-- Chat -->
  <div class="chat-area">
    <div class="conn-banner" id="conn-banner">⚠️ Соединение потеряно. Переподключение…</div>

    <!-- Empty state -->
    <div class="chat-empty" id="chat-empty">
      <div class="chat-empty-icon">💬</div>
      <div class="chat-empty-title">Выберите собеседника</div>
      <div class="chat-empty-sub">Найдите пользователя в списке слева и начните общение</div>
    </div>

    <!-- Active chat -->
    <div id="chat-panel" style="display:none;flex-direction:column;flex:1;overflow:hidden">
      <!-- Topbar -->
      <div class="chat-topbar">
        <div class="avatar md" id="chat-ava">?</div>
        <div class="chat-peer-info">
          <div class="chat-peer-name" id="chat-name">—</div>
          <div class="chat-peer-status" id="chat-status">не в сети</div>
        </div>
        <div class="topbar-actions">
          <button class="icon-btn green" onclick="startCall(false)" title="Аудиозвонок">📞</button>
          <button class="icon-btn blue" onclick="startCall(true)" title="Видеозвонок">📹</button>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages" id="messages"></div>

      <!-- Input -->
      <div class="input-bar">
        <textarea class="msg-textarea" id="msg-inp" placeholder="Сообщение…" rows="1"
          onkeydown="onMsgKey(event)" oninput="autoGrow(this)"></textarea>
        <button class="send-btn" onclick="sendMsg()" title="Отправить">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════ CALL OVERLAY ═══════════════════════ -->
<div id="call-overlay">
  <!-- Background blobs -->
  <div class="call-bg">
    <div class="call-bg-blob"></div>
    <div class="call-bg-blob"></div>
  </div>

  <!-- Video (hidden until video call) -->
  <div class="video-grid" id="video-grid">
    <div class="video-item">
      <div class="video-label">Собеседник</div>
      <video id="remote-video" autoplay playsinline></video>
    </div>
    <div class="video-item">
      <div class="video-label">Вы</div>
      <video id="local-video" autoplay playsinline muted></video>
    </div>
  </div>

  <!-- Call info -->
  <div class="call-content">
    <div class="call-avatar-wrap">
      <div class="call-ring"></div>
      <div class="call-ring"></div>
      <div class="call-ring"></div>
      <div class="avatar xxl" id="call-ava">?</div>
    </div>

    <div class="call-info">
      <div class="call-name" id="call-name">—</div>
      <div class="call-status" id="call-status-text">Звонок…</div>
      <div class="call-timer" id="call-timer">0:00</div>
    </div>

    <!-- Incoming call buttons -->
    <div id="incoming-actions">
      <div class="incoming-type" id="incoming-type">📞 Голосовой звонок</div>
      <div class="call-actions" style="margin-top:8px">
        <div class="call-btn accept" onclick="acceptCall()">
          <div class="call-btn-icon">📞</div>
          <div class="call-btn-label">Принять</div>
        </div>
        <div class="call-btn reject" onclick="rejectCall()">
          <div class="call-btn-icon">✖</div>
          <div class="call-btn-label">Отклонить</div>
        </div>
      </div>
    </div>

    <!-- Active call buttons -->
    <div id="active-actions">
      <div class="call-actions">
        <div class="call-btn mute" id="btn-mute" onclick="toggleMute()">
          <div class="call-btn-icon">🎤</div>
          <div class="call-btn-label">Микрофон</div>
        </div>
        <div class="call-btn end" onclick="endCall()">
          <div class="call-btn-icon">✆</div>
          <div class="call-btn-label">Завершить</div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<script>
'use strict';
// ──────────────────────────────────────────────────────────
// CONSTANTS & STATE
// ──────────────────────────────────────────────────────────
const STUN = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};
const AVATAR_COLORS = [
  ['#6366f1','#818cf8'],['#ec4899','#f472b6'],['#f59e0b','#fbbf24'],
  ['#10b981','#34d399'],['#3b82f6','#60a5fa'],['#8b5cf6','#a78bfa'],
  ['#14b8a6','#2dd4bf'],['#ef4444','#f87171'],
];

let ws = null;
let myName = '';
let activePeer = '';         // who we're chatting with
let peerConn = null;         // RTCPeerConnection
let localStream = null;
let remoteAudio = null;
let isMuted = false;
let callSecs = 0, callInterval = null;
let isVideoCall = false;
let pendingOffer = null;     // { from, offer, video }
let onlineUsers = {};        // { username: { online, lastSeen } }
let recentPeers = [];
let currentTab = 'search';
let searchDebounce = null;
let reconnectTimer = null;

// ──────────────────────────────────────────────────────────
// UTILS
// ──────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const now = () => new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
const fmtSecs = s => Math.floor(s/60)+':'+(s%60<10?'0':'')+s%60;

function avatarColor(name) {
  let n = 0; for (const c of name) n += c.charCodeAt(0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function avatarInitial(name) { return (name||'?')[0].toUpperCase(); }
function setAvatar(el, name) {
  el.textContent = avatarInitial(name);
  const [c1,c2] = avatarColor(name);
  el.style.background = 'linear-gradient(135deg,'+c1+','+c2+')';
}

function showToast(msg, icon) {
  const t = $('toast');
  t.innerHTML = (icon||'ℹ️')+' <span>'+esc(msg)+'</span>';
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'),3200);
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso);
  const m = Math.floor(diff/60000);
  if (m < 1) return 'только что';
  if (m < 60) return m+' мин назад';
  const h = Math.floor(m/60);
  if (h < 24) return h+' ч назад';
  return Math.floor(h/24)+' дн назад';
}

// ──────────────────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────────────────
$('inp-name').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });

function doLogin() {
  const name = $('inp-name').value.trim();
  const err = validateName(name);
  if (err) { showAuthErr(err); return; }
  myName = name;
  $('btn-enter').disabled = true;
  $('btn-enter').innerHTML = '<span>Подключение…</span>';
  hideAuthErr();
  connectWS();
}

function validateName(name) {
  if (!name || name.length < 2) return 'Имя должно быть от 2 символов';
  if (name.length > 32) return 'Имя не более 32 символов';
  if (!/^[a-zA-Zа-яА-ЯёЁ0-9_\\- ]+$/.test(name)) return 'Только буквы, цифры, пробел, _ и -';
  return null;
}
function showAuthErr(msg) {
  const el = $('auth-err'); el.textContent = msg; el.style.display='block';
  el.style.animation='none'; requestAnimationFrame(()=>el.style.animation='shake 0.3s ease');
}
function hideAuthErr() { $('auth-err').style.display='none'; }

// ──────────────────────────────────────────────────────────
// WEBSOCKET
// ──────────────────────────────────────────────────────────
function connectWS() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(proto+'//'+location.host);

  ws.onopen = () => {
    $('conn-banner').classList.remove('visible');
    clearTimeout(reconnectTimer);
    ws.send(pack('register', { username: myName }));
  };

  ws.onmessage = e => {
    let msg; try { msg = JSON.parse(e.data); } catch { return; }
    handleServer(msg);
  };

  ws.onclose = () => {
    if (myName) {
      $('conn-banner').classList.add('visible');
      reconnectTimer = setTimeout(() => connectWS(), 3000);
    }
  };

  ws.onerror = () => {
    $('btn-enter').disabled = false;
    $('btn-enter').innerHTML = '<span>Войти</span><span>→</span>';
    showAuthErr('Не удалось подключиться к серверу');
  };
}

const pack = (type, data={}) => JSON.stringify({type,...data});
const wsSend = obj => ws && ws.readyState===1 && ws.send(typeof obj==='string'?obj:JSON.stringify(obj));

function handleServer(msg) {
  switch(msg.type) {
    case 'registered':
      showApp();
      break;
    case 'error':
      $('btn-enter').disabled = false;
      $('btn-enter').innerHTML = '<span>Войти</span><span>→</span>';
      showAuthErr(msg.text);
      break;
    case 'users-list':
      onlineUsers = {};
      (msg.users||[]).forEach(u => { onlineUsers[u.username]={online:u.online,lastSeen:u.lastSeen}; });
      renderUsers();
      updateOnlineCount();
      break;
    case 'user-online':
      onlineUsers[msg.username] = { online:true, lastSeen:new Date().toISOString() };
      renderUsers();
      updateOnlineCount();
      updatePeerStatus(msg.username);
      if(msg.username!==myName) showToast(msg.username+' в сети','🟢');
      break;
    case 'user-offline':
      if(onlineUsers[msg.username]) {
        onlineUsers[msg.username].online = false;
        onlineUsers[msg.username].lastSeen = new Date().toISOString();
      }
      renderUsers();
      updateOnlineCount();
      updatePeerStatus(msg.username);
      break;
    case 'chat':
      if(msg.from !== activePeer) {
        showToast('Сообщение от '+msg.from,'💬');
        addToRecent(msg.from);
      } else {
        addMessage(msg.text, false, msg.time);
      }
      break;
    case 'signal':
      handleSignal(msg.from, msg.data);
      break;
  }
}

// ──────────────────────────────────────────────────────────
// APP SCREEN
// ──────────────────────────────────────────────────────────
function showApp() {
  $('auth-screen').style.display = 'none';
  $('app').style.display = 'flex';
  setAvatar($('my-ava'), myName);
  $('my-name-disp').textContent = myName;
  wsSend(pack('get-users'));
}

// ──────────────────────────────────────────────────────────
// USER LIST
// ──────────────────────────────────────────────────────────
function onSearch(v) {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => renderUsers(v.trim()), 250);
}

function setTab(tab) {
  currentTab = tab;
  $('tab-search').classList.toggle('active', tab==='search');
  $('tab-recent').classList.toggle('active', tab==='recent');
  renderUsers();
}

function renderUsers(filter='') {
  const q = (filter || $('search-inp').value || '').toLowerCase();
  let items = [];

  if(currentTab === 'recent') {
    items = recentPeers
      .filter(n => n !== myName && (!q || n.toLowerCase().includes(q)))
      .map(n => ({
        username: n,
        online: onlineUsers[n]?.online||false,
        lastSeen: onlineUsers[n]?.lastSeen
      }));
  } else {
    items = Object.entries(onlineUsers)
      .filter(([n]) => n !== myName && (!q || n.toLowerCase().includes(q)))
      .map(([n,d]) => ({username:n, online:d.online, lastSeen:d.lastSeen}))
      .sort((a,b) => {
        if(a.online !== b.online) return b.online?1:-1;
        return a.username.localeCompare(b.username,'ru');
      });
  }

  if(!items.length) {
    $('user-list').innerHTML = '<div class="empty-state"><div class="empty-icon">'+(q?'🔍':'👥')+'</div><div class="empty-title">'+(q?'Никого не найдено':'Пока никого нет')+'</div><div class="empty-sub">'+(q?'Попробуйте другое имя':'Поделитесь адресом с другим человеком')+'</div></div>';
    return;
  }

  $('user-list').innerHTML = items.map(u => userItemHTML(u)).join('');
}

function userItemHTML(u) {
  const [c1,c2] = avatarColor(u.username);
  const ic = avatarInitial(u.username);
  const sub = u.online ? 'в сети' : (u.lastSeen ? 'Был(а) '+timeAgo(u.lastSeen) : 'Был(а) давно');
  const subClass = u.online ? 'user-item-sub online' : 'user-item-sub';
  const activeClass = u.username===activePeer ? ' active' : '';
  return \`<div class="user-item\${activeClass}" onclick="openChat('\${esc(u.username)}')">
    <div class="avatar md" style="background:linear-gradient(135deg,\${c1},\${c2})">\${ic}
      <div class="status-dot \${u.online?'online':'offline'}"></div>
    </div>
    <div class="user-item-info">
      <div class="user-item-name">\${esc(u.username)}</div>
      <div class="\${subClass}">\${sub}</div>
    </div>
    <div class="quick-call">
      <button class="icon-btn green" onclick="quickCall(event,'\${esc(u.username)}',false)" title="Аудио">📞</button>
      <button class="icon-btn blue" onclick="quickCall(event,'\${esc(u.username)}',true)" title="Видео">📹</button>
    </div>
  </div>\`;
}

function updateOnlineCount() {
  const cnt = Object.values(onlineUsers).filter(u=>u.online).length;
  $('online-count').textContent = cnt+' онлайн';
}

function updatePeerStatus(name) {
  if(name !== activePeer) return;
  const online = onlineUsers[name]?.online;
  const st = $('chat-status');
  st.textContent = online ? 'в сети' : 'не в сети';
  st.className = 'chat-peer-status'+(online?' online-status':'');
  // Update topbar avatar dot
  const dot = $('chat-panel').querySelector('.chat-topbar .status-dot');
  if(dot) { dot.className='status-dot '+(online?'online':'offline'); }
}

function addToRecent(name) {
  recentPeers = [name,...recentPeers.filter(n=>n!==name)].slice(0,30);
}

// ──────────────────────────────────────────────────────────
// CHAT
// ──────────────────────────────────────────────────────────
function openChat(name) {
  activePeer = name;
  addToRecent(name);
  renderUsers();

  const online = onlineUsers[name]?.online;
  setAvatar($('chat-ava'), name);
  $('chat-name').textContent = name;
  updatePeerStatus(name);

  $('call-name').textContent = name;
  setAvatar($('call-ava'), name);

  $('chat-empty').style.display = 'none';
  $('chat-panel').style.display = 'flex';
  clearMessages();
  sysMsg('Диалог с '+name);
  setTimeout(() => $('msg-inp').focus(), 50);
}

function quickCall(e, name, video) {
  e.stopPropagation();
  if(activePeer !== name) openChat(name);
  setTimeout(() => startCall(video), 80);
}

function clearMessages() { $('messages').innerHTML = ''; }

function sendMsg() {
  const inp = $('msg-inp');
  const text = inp.value.trim();
  if(!text || !activePeer) return;
  const t = now();
  wsSend(pack('chat', { to:activePeer, text, time:t }));
  addMessage(text, true, t);
  inp.value = '';
  inp.style.height = 'auto';
}

function addMessage(text, isOut, time) {
  const msgs = $('messages');
  const grp = document.createElement('div');
  grp.className = 'msg-group '+(isOut?'out':'in');
  const msg = document.createElement('div');
  msg.className = 'msg '+(isOut?'out':'in');
  msg.innerHTML = '<div class="msg-bubble">'+esc(text).replace(/\\n/g,'<br>')+'</div><div class="msg-time">'+time+'</div>';
  grp.appendChild(msg);
  msgs.appendChild(grp);
  msgs.scrollTop = msgs.scrollHeight;
}

function sysMsg(text) {
  const msgs = $('messages');
  const d = document.createElement('div');
  d.className = 'system-msg'; d.textContent = text;
  msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
}

function onMsgKey(e) {
  if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
}
function autoGrow(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight,120)+'px';
}

// ──────────────────────────────────────────────────────────
// WEBRTC CALLS
// ──────────────────────────────────────────────────────────
async function startCall(video) {
  if(!activePeer) { showToast('Выберите собеседника','⚠️'); return; }
  if(peerConn) { showToast('Звонок уже идёт','⚠️'); return; }
  isVideoCall = video;

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio:true, video });
  } catch(e) {
    showToast('Нет доступа к '+( video?'камере/':'')+'микрофону','❌');
    return;
  }

  if(video) {
    $('local-video').srcObject = localStream;
    $('video-grid').style.display = 'flex';
  }

  peerConn = createPC(activePeer);
  localStream.getTracks().forEach(t => peerConn.addTrack(t, localStream));

  const offer = await peerConn.createOffer({ offerToReceiveAudio:true, offerToReceiveVideo:video });
  await peerConn.setLocalDescription(offer);

  wsSend(pack('signal', { to:activePeer, data:{ type:'offer', offer, video } }));
  showCallingUI(activePeer, video);
}

function createPC(peerName) {
  const pc = new RTCPeerConnection(STUN);

  pc.onicecandidate = e => {
    if(e.candidate) wsSend(pack('signal',{ to:peerName, data:{ type:'ice', candidate:e.candidate } }));
  };

  pc.ontrack = e => {
    const stream = e.streams[0];
    if(isVideoCall) {
      $('remote-video').srcObject = stream;
      $('call-ava').style.display = 'none';
      document.querySelectorAll('.call-ring').forEach(r=>r.classList.add('stopped'));
    } else {
      if(remoteAudio) remoteAudio.pause();
      remoteAudio = new Audio();
      remoteAudio.srcObject = stream;
      remoteAudio.play().catch(()=>{});
    }
  };

  pc.onconnectionstatechange = () => {
    const s = pc.connectionState;
    if(s==='connected') {
      onCallConnected();
    }
    if(s==='disconnected'||s==='failed'||s==='closed') {
      endCall();
    }
  };

  return pc;
}

async function handleSignal(from, data) {
  if(data.type === 'offer') {
    if(peerConn || pendingOffer) {
      wsSend(pack('signal',{to:from,data:{type:'busy'}}));
      return;
    }
    pendingOffer = { from, offer:data.offer, video:data.video };
    isVideoCall = data.video;
    if(from !== activePeer) openChat(from);
    showIncomingUI(from, data.video);
    return;
  }

  if(data.type === 'answer') {
    if(peerConn) await peerConn.setRemoteDescription(new RTCSessionDescription(data.answer));
    return;
  }

  if(data.type === 'ice') {
    if(peerConn && data.candidate) {
      await peerConn.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(()=>{});
    }
    return;
  }

  if(data.type === 'reject') {
    sysMsg('Звонок отклонён'); cleanupCall(); hideCallOverlay(); return;
  }
  if(data.type === 'busy') {
    sysMsg('Собеседник занят'); cleanupCall(); hideCallOverlay(); return;
  }
  if(data.type === 'end') {
    const secs = callSecs;
    cleanupCall(); hideCallOverlay();
    if(secs>0) sysMsg('Звонок завершён · '+fmtSecs(secs));
    else sysMsg('Собеседник завершил звонок');
    return;
  }
}

async function acceptCall() {
  stopRingtone();
  const { from, offer, video } = pendingOffer; pendingOffer = null;
  isVideoCall = video;

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio:true, video });
  } catch(e) {
    showToast('Нет доступа к '+(video?'камере/':'')+'микрофону','❌');
    hideCallOverlay(); return;
  }

  if(video) {
    $('local-video').srcObject = localStream;
    $('video-grid').style.display = 'flex';
  }

  peerConn = createPC(from);
  localStream.getTracks().forEach(t => peerConn.addTrack(t, localStream));
  await peerConn.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConn.createAnswer();
  await peerConn.setLocalDescription(answer);
  wsSend(pack('signal',{ to:from, data:{ type:'answer', answer } }));

  $('incoming-actions').style.display = 'none';
  $('active-actions').style.display = 'block';
  $('call-status-text').textContent = 'Соединение…';
}

function rejectCall() {
  stopRingtone();
  if(pendingOffer) {
    wsSend(pack('signal',{to:pendingOffer.from,data:{type:'reject'}}));
    pendingOffer = null;
  }
  hideCallOverlay();
}

function endCall() {
  wsSend(pack('signal',{to:activePeer,data:{type:'end'}}));
  const secs = callSecs;
  cleanupCall(); hideCallOverlay();
  if(secs>0) sysMsg('Звонок завершён · '+fmtSecs(secs));
}

function onCallConnected() {
  $('call-status-text').textContent = 'Разговор';
  $('call-timer').style.display = 'block';
  callSecs = 0;
  clearInterval(callInterval);
  callInterval = setInterval(()=>{ callSecs++; $('call-timer').textContent=fmtSecs(callSecs); },1000);
  sysMsg('🔵 Звонок начался');
}

function cleanupCall() {
  clearInterval(callInterval); callInterval=null; callSecs=0;
  if(localStream) { localStream.getTracks().forEach(t=>t.stop()); localStream=null; }
  if(remoteAudio) { remoteAudio.pause(); remoteAudio=null; }
  if(peerConn) { peerConn.close(); peerConn=null; }
  pendingOffer=null; isMuted=false;
  $('btn-mute').classList.remove('active');
  $('btn-mute').querySelector('.call-btn-icon').textContent='🎤';
  $('btn-mute').querySelector('.call-btn-label').textContent='Микрофон';
}

function hideCallOverlay() {
  $('call-overlay').classList.remove('active');
  $('video-grid').style.display='none';
  $('call-ava').style.display='';
  document.querySelectorAll('.call-ring').forEach(r=>r.classList.remove('stopped'));
  $('remote-video').srcObject=null;
  $('local-video').srcObject=null;
  $('call-timer').style.display='none';
  $('call-timer').textContent='0:00';
  $('incoming-actions').style.display='none';
  $('active-actions').style.display='none';
}

function showCallingUI(name, video) {
  $('call-status-text').textContent = video?'Видеозвонок…':'Аудиозвонок…';
  $('incoming-actions').style.display='none';
  $('active-actions').style.display='block';
  $('call-overlay').classList.add('active');
}

function showIncomingUI(name, video) {
  $('call-status-text').textContent = video?'Входящий видеозвонок':'Входящий аудиозвонок';
  $('incoming-type').textContent = video?'📹 Видеозвонок':'📞 Голосовой звонок';
  $('incoming-actions').style.display='flex';
  $('active-actions').style.display='none';
  $('call-overlay').classList.add('active');
  startRingtone();
}

function toggleMute() {
  if(!localStream) return;
  isMuted = !isMuted;
  localStream.getAudioTracks().forEach(t=>t.enabled=!isMuted);
  const btn = $('btn-mute');
  btn.classList.toggle('active',isMuted);
  btn.querySelector('.call-btn-icon').textContent = isMuted?'🔇':'🎤';
  btn.querySelector('.call-btn-label').textContent = isMuted?'Включить':'Микрофон';
}

// ──────────────────────────────────────────────────────────
// RINGTONE
// ──────────────────────────────────────────────────────────
let rCtx=null, rInt=null;
function startRingtone() {
  try {
    rCtx = new (window.AudioContext||window.webkitAudioContext)();
    const beep = () => {
      if(!rCtx) return;
      const g = rCtx.createGain();
      const o1 = rCtx.createOscillator();
      const o2 = rCtx.createOscillator();
      o1.frequency.value = 440; o2.frequency.value = 480;
      g.gain.setValueAtTime(0,rCtx.currentTime);
      g.gain.linearRampToValueAtTime(0.2,rCtx.currentTime+0.05);
      g.gain.linearRampToValueAtTime(0,rCtx.currentTime+0.5);
      o1.connect(g); o2.connect(g); g.connect(rCtx.destination);
      o1.start(); o2.start();
      o1.stop(rCtx.currentTime+0.5); o2.stop(rCtx.currentTime+0.5);
    };
    beep(); rInt = setInterval(beep,1500);
  } catch {}
}
function stopRingtone() {
  clearInterval(rInt); rInt=null;
  if(rCtx) { rCtx.close(); rCtx=null; }
}
</script>
</body>
</html>`;

// ══════════════════════════════════════════════════════════
// HTTP SERVER
// ══════════════════════════════════════════════════════════
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/" || url.pathname === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(HTML);
    return;
  }

  if (url.pathname === "/users" && req.method === "GET") {
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const list = [];
    for (const [name, data] of users.entries()) {
      if (!q || name.toLowerCase().includes(q)) {
        list.push({
          username: name,
          online: data.ws.readyState === WebSocket.OPEN,
          lastSeen: data.lastSeen,
        });
      }
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(list));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

// ══════════════════════════════════════════════════════════
// WEBSOCKET  —  signaling + relay
// ══════════════════════════════════════════════════════════
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  let me = null;

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    route(ws, msg, () => { me = msg.username; });
  });

  ws.on("close", () => {
    if (!me) return;
    const entry = users.get(me);
    if (entry && entry.ws === ws) {
      entry.lastSeen = new Date().toISOString();
      broadcast({ type: "user-offline", username: me });
    }
  });

  function route(ws, msg, setMe) {
    // ── Register ──
    if (msg.type === "register") {
      const name = String(msg.username || "").trim();
      if (!name || name.length < 2 || name.length > 32) {
        send(ws, { type: "error", text: "Недопустимое имя" });
        return;
      }

      const existing = users.get(name);
      if (existing && existing.ws.readyState === WebSocket.OPEN) {
        send(ws, { type: "error", text: "Имя «" + name + "» уже занято. Выберите другое." });
        return;
      }

      me = name;
      setMe();
      users.set(me, { ws, lastSeen: new Date().toISOString(), id: nextId++ });

      send(ws, { type: "registered", username: me });

      // Send full user list to newcomer
      const userList = [];
      for (const [u, d] of users.entries()) {
        userList.push({ username: u, online: d.ws.readyState === WebSocket.OPEN, lastSeen: d.lastSeen });
      }
      send(ws, { type: "users-list", users: userList });

      // Notify everyone else
      broadcast({ type: "user-online", username: me }, ws);
      return;
    }

    if (!me) return;

    // ── Get users ──
    if (msg.type === "get-users") {
      const userList = [];
      for (const [u, d] of users.entries()) {
        userList.push({ username: u, online: d.ws.readyState === WebSocket.OPEN, lastSeen: d.lastSeen });
      }
      send(ws, { type: "users-list", users: userList });
      return;
    }

    // ── Chat relay ──
    if (msg.type === "chat") {
      const to = String(msg.to || "");
      const text = String(msg.text || "").slice(0, 8000);
      if (!to || !text) return;
      relay(me, to, { type: "chat", from: me, text, time: msg.time || now() });
      return;
    }

    // ── WebRTC signal relay ──
    if (msg.type === "signal") {
      const to = String(msg.to || "");
      if (!to) return;
      relay(me, to, { type: "signal", from: me, data: msg.data });
      return;
    }
  }
});

function now() {
  return new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

function send(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

function relay(from, to, msg) {
  const target = users.get(to);
  if (target && target.ws.readyState === WebSocket.OPEN) {
    send(target.ws, msg);
  }
}

function broadcast(msg, exclude) {
  const str = JSON.stringify(msg);
  for (const { ws } of users.values()) {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) ws.send(str);
  }
}

// ══════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════
server.listen(PORT, () => {
  const line = "═".repeat(44);
  console.log(`
  ╔${line}╗
  ║           💬  PULSE MESSENGER v2               ║
  ╠${line}╣
  ║  Открой в браузере:                            ║
  ║  ➜  http://localhost:${PORT}                       ║
  ║                                                ║
  ║  Для локальной сети — узнай IP:                ║
  ║  Windows:  ipconfig                            ║
  ║  Mac/Linux: ifconfig | grep "inet "            ║
  ║  Затем открой: http://<IP>:${PORT}                ║
  ╚${line}╝
`);
});
