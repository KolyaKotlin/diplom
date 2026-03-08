var API = '';

function _checkBlocked(res) {
  return res;
}
function apiPost(url, body) {
  return fetch(API + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
    .then(function(r) { return r.json().then(function(d) { return { status: r.status, data: d }; }); })
    .then(_checkBlocked);
}
function apiGet(url) {
  return fetch(API + url, { credentials: 'include' })
    .then(function(r) { return r.json().then(function(d) { return { status: r.status, data: d }; }); })
    .then(_checkBlocked);
}
function apiPut(url, body) {
  return fetch(API + url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
    .then(function(r) { return r.json().then(function(d) { return { status: r.status, data: d }; }); })
    .then(_checkBlocked);
}
function apiDelete(url) {
  return fetch(API + url, { method: 'DELETE', credentials: 'include' })
    .then(function(r) { return r.json().then(function(d) { return { status: r.status, data: d }; }); })
    .then(_checkBlocked);
}

// ─── Theme ──────────────────────────────────────
function getTheme() { return localStorage.getItem('theme') || 'light'; }
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
  var btn = document.getElementById('themeToggle');
  if (btn) btn.innerHTML = t === 'dark' ? '&#9728;' : '&#9790;';
}
(function() { setTheme(getTheme()); })();
document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('themeToggle');
  if (btn) {
    btn.innerHTML = getTheme() === 'dark' ? '&#9728;' : '&#9790;';
    btn.addEventListener('click', function() { setTheme(getTheme() === 'dark' ? 'light' : 'dark'); });
  }
});

// ─── Toast ──────────────────────────────────────
function showToast(msg) {
  var el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 3000);
}

// ─── Warning Modal ──────────────────────────────
function showWarningModal(reason, warningCount) {
  var old = document.getElementById('warningModalOverlay');
  if (old) old.remove();
  var overlay = document.createElement('div');
  overlay.id = 'warningModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem;';
  var countText = warningCount ? warningCount + ' из 3' : '';
  var barWidth = warningCount ? Math.min(warningCount / 3 * 100, 100) : 0;
  var barColor = warningCount >= 3 ? '#dc2626' : warningCount >= 2 ? '#f59e0b' : '#3b82f6';
  overlay.innerHTML =
    '<div style="background:var(--bg-card,#fff);border-radius:1.25rem;padding:2rem;max-width:24rem;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.2);text-align:center;animation:warnIn .25s ease;">' +
      '<div style="width:3.5rem;height:3.5rem;border-radius:50%;background:#fef2f2;color:#dc2626;display:inline-flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:1rem;">&#9888;</div>' +
      '<h3 style="font-size:1.125rem;font-weight:700;color:var(--text,#1a1a1a);margin-bottom:0.5rem;">Контент отклонён</h3>' +
      '<p style="font-size:0.875rem;color:var(--text-muted,#64748b);line-height:1.6;margin-bottom:1.25rem;">' + (reason || 'Нарушение правил сообщества') + '</p>' +
      (warningCount ?
        '<div style="margin-bottom:1.25rem;">' +
          '<div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted,#64748b);margin-bottom:0.375rem;">' +
            '<span>Предупреждение</span><span style="font-weight:600;color:' + barColor + ';">' + countText + '</span>' +
          '</div>' +
          '<div style="height:0.5rem;background:var(--border,#e2e8f0);border-radius:1rem;overflow:hidden;">' +
            '<div style="height:100%;width:' + barWidth + '%;background:' + barColor + ';border-radius:1rem;transition:width .3s;"></div>' +
          '</div>' +
          (warningCount >= 2 && warningCount < 3 ? '<p style="font-size:0.75rem;color:#f59e0b;margin-top:0.5rem;font-weight:600;">Следующее нарушение приведёт к блокировке!</p>' : '') +
          (warningCount >= 3 ? '<p style="font-size:0.75rem;color:#dc2626;margin-top:0.5rem;font-weight:600;">Аккаунт заблокирован.</p>' : '') +
        '</div>'
      : '') +
      '<button id="warningModalOk" style="width:100%;padding:0.75rem 1.5rem;background:var(--primary,#3b82f6);color:#fff;border:none;border-radius:0.75rem;font-size:0.9375rem;font-weight:600;cursor:pointer;font-family:inherit;">Я понял</button>' +
    '</div>';
  document.body.appendChild(overlay);
  var style = document.createElement('style');
  style.textContent = '@keyframes warnIn{from{opacity:0;transform:scale(0.9);}to{opacity:1;transform:scale(1);}}';
  overlay.appendChild(style);
  document.getElementById('warningModalOk').addEventListener('click', function() { overlay.remove(); });
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
}

// ─── Countdown ──────────────────────────────────
function renderCountdown(deadline) {
  if (!deadline) return '';
  var now = new Date();
  var dl = new Date(deadline);
  var diff = dl - now;
  if (diff <= 0) return '<span class="countdown-expired">Время вышло</span>';
  var days = Math.floor(diff / 86400000);
  var hrs = Math.floor((diff % 86400000) / 3600000);
  var mins = Math.floor((diff % 3600000) / 60000);
  var secs = Math.floor((diff % 60000) / 1000);
  return '<div class="countdown">' +
    (days > 0 ? '<div class="countdown-unit"><div class="countdown-num">' + days + '</div><div class="countdown-label">дней</div></div>' : '') +
    '<div class="countdown-unit"><div class="countdown-num">' + hrs + '</div><div class="countdown-label">часов</div></div>' +
    '<div class="countdown-unit"><div class="countdown-num">' + mins + '</div><div class="countdown-label">минут</div></div>' +
    '<div class="countdown-unit"><div class="countdown-num">' + secs + '</div><div class="countdown-label">секунд</div></div>' +
    '</div>';
}

// ─── Share socials ──────────────────────────────
function bindShareSocials() {
  var link = document.getElementById('shareLink');
  if (!link) return;
  var url = function() { return encodeURIComponent(link.value); };
  var text = function() {
    var pre = document.getElementById('sharePreviewText');
    return encodeURIComponent(pre ? pre.textContent : 'Голосование');
  };
  var tg = document.getElementById('shareTg');
  var vk = document.getElementById('shareVk');
  var wa = document.getElementById('shareWa');
  var em = document.getElementById('shareEmail');
  if (tg) tg.onclick = function() { window.open('https://t.me/share/url?url=' + url() + '&text=' + text(), '_blank'); };
  if (vk) vk.onclick = function() { window.open('https://vk.com/share.php?url=' + url() + '&title=' + text(), '_blank'); };
  if (wa) wa.onclick = function() { window.open('https://wa.me/?text=' + text() + '%20' + url(), '_blank'); };
  if (em) em.onclick = function() { window.location.href = 'mailto:?subject=' + text() + '&body=' + url(); };
}
