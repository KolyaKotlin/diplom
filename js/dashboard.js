var currentUser = null;
var currentPage = 'home';
var countdownTimer = null;
var userIsAdmin = false;

if (window.location.protocol === 'file:') {
  window.location.href = 'http://localhost:5000/dashboard.html';
}

function startDashboardCountdowns() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(function() {
    document.querySelectorAll('[data-countdown]').forEach(function(el) {
      var dl = el.dataset.countdown;
      el.innerHTML = renderCountdown(dl);
      if (new Date(dl) <= new Date()) {
        var item = el.closest('.poll-item');
        if (item) {
          var badge = item.querySelector('.badge');
          if (badge && badge.classList.contains('badge-active')) {
            badge.classList.remove('badge-active');
            badge.classList.add('badge-closed');
            badge.textContent = 'Завершено';
          }
          var toggleBtn = item.querySelector('.toggle-dec-btn, .toggle-poll-btn');
          if (toggleBtn) toggleBtn.textContent = 'Открыть';
        }
      }
    });
  }, 1000);
}

apiGet('/api/me').then(function(res) {
  if (res.status === 401 || !res.data || !res.data.user) { window.location.href = 'index.html'; return; }
  currentUser = res.data.user;
  userIsAdmin = !!currentUser.isAdmin;
  document.getElementById('headerUser').textContent = (currentUser.firstName || '') + ' ' + (currentUser.lastName || '');
  if (userIsAdmin) {
    var el = document.getElementById('adminNavItem');
    if (el) el.style.display = '';
  }
  var hashPage = (window.location.hash || '').replace('#', '').trim();
  if (hashPage === 'profile' || hashPage === 'decisions' || hashPage === 'polls') {
    document.querySelectorAll('.nav-item[data-page]').forEach(function(n) { n.classList.remove('active'); });
    var navEl = document.querySelector('.nav-item[data-page="' + hashPage + '"]');
    if (navEl) navEl.classList.add('active');
    showPage(hashPage);
  } else {
    showPage('home');
  }
}).catch(function() { window.location.href = 'index.html'; });

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}
window.addEventListener('beforeunload', function() {
  if (document.getElementById('wTitle')) { saveWiz1(); }
  if (document.getElementById('wCrits')) { saveWiz2(); }
  if (document.getElementById('wSubmit')) { saveWiz3(); }
  if (document.getElementById('pollTitle') && document.getElementById('modalOverlay').style.display === 'flex') { _savePollDraft(); }
});
document.getElementById('burgerBtn').addEventListener('click', openSidebar);
document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);
document.querySelectorAll('.nav-item[data-page]').forEach(function(el) {
  el.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    el.classList.add('active');
    showPage(el.dataset.page);
    closeSidebar();
  });
});
document.getElementById('logoutBtn').addEventListener('click', function() {
  apiPost('/api/logout', {}).then(function() { window.location.href = 'index.html'; });
});

function _renderBannedCard(el, showLogout) {
  var iconStyle = 'width:4rem;height:4rem;border-radius:50%;background:#fef2f2;color:#dc2626;' +
    'display:inline-flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:1.25rem;';
  el.innerHTML = '<div class="profile-card animate-in" style="text-align:center;padding:2.5rem 2rem;max-width:28rem;margin:0 auto;">' +
    '<div style="' + iconStyle + '">&#9888;</div>' +
    '<h2 style="font-size:1.25rem;font-weight:700;color:var(--text);margin-bottom:0.5rem;">Аккаунт заблокирован</h2>' +
    '<p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:1.5rem;line-height:1.5;">' +
      'Ваш аккаунт был заблокирован за нарушение правил сообщества.' +
      ' Если вы считаете, что это ошибка, напишите нам — мы рассмотрим вашу заявку.' +
    '</p>' +
    '<form id="bannedFeedbackForm" style="text-align:left;">' +
      '<div class="banned-form-fields">' +
        '<div style="margin-bottom:1rem;">' +
          '<label style="display:block;font-size:0.8125rem;font-weight:600;color:var(--text-muted);margin-bottom:0.375rem;">Email для связи</label>' +
          '<input type="email" id="bannedFeedbackEmail" placeholder="your@email.com" value="' + esc(currentUser.email || '') + '" ' +
            'style="width:100%;padding:0.625rem 1rem;border:1.5px solid var(--border);border-radius:0.75rem;font-size:0.9375rem;font-family:inherit;background:var(--bg);color:var(--text);box-sizing:border-box;">' +
        '</div>' +
        '<div style="margin-bottom:1rem;">' +
          '<label style="display:block;font-size:0.8125rem;font-weight:600;color:var(--text-muted);margin-bottom:0.375rem;">Сообщение</label>' +
          '<textarea id="bannedFeedbackText" placeholder="Опишите ситуацию или попросите о разблокировке…" ' +
            'style="width:100%;min-height:100px;padding:0.75rem 1rem;border:1.5px solid var(--border);border-radius:0.75rem;font-size:0.9375rem;font-family:inherit;background:var(--bg);color:var(--text);resize:vertical;box-sizing:border-box;"></textarea>' +
        '</div>' +
      '</div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%;" id="bannedFeedbackBtn">Отправить</button>' +
      '<div id="bannedFeedbackOk" style="display:none;color:#16a34a;font-weight:600;text-align:center;margin-top:1rem;">Сообщение отправлено. Мы свяжемся с вами.</div>' +
    '</form>' +
    (showLogout
      ? '<div style="margin-top:1.5rem;font-size:0.8125rem;"><a href="#" id="bannedLogoutLink" style="color:var(--primary);text-decoration:none;">Выйти из аккаунта</a></div>'
      : '<div style="margin-top:1.5rem;font-size:0.8125rem;"><a href="feed.html" style="color:var(--primary);text-decoration:none;">&larr; Перейти в ленту</a></div>') +
  '</div>';
  setTimeout(function() {
    var form = document.getElementById('bannedFeedbackForm');
    if (form) form.addEventListener('submit', function(e) {
      e.preventDefault();
      var text = document.getElementById('bannedFeedbackText').value.trim();
      var email = document.getElementById('bannedFeedbackEmail').value.trim();
      if (!text) { alert('Введите сообщение'); return; }
      var btn = document.getElementById('bannedFeedbackBtn');
      btn.disabled = true; btn.textContent = 'Отправка…';
      fetch('/api/feedback', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ text: text, email: email })
      }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); }).then(function(r) {
        if (r.data.error) {
          alert(r.data.error);
          btn.disabled = false; btn.textContent = 'Отправить';
        } else {
          form.querySelector('.banned-form-fields').style.display = 'none';
          btn.style.display = 'none';
          document.getElementById('bannedFeedbackOk').style.display = 'block';
        }
      }).catch(function() {
        alert('Ошибка соединения');
        btn.disabled = false; btn.textContent = 'Отправить';
      });
    });
    var logoutLink = document.getElementById('bannedLogoutLink');
    if (logoutLink) logoutLink.addEventListener('click', function(e) {
      e.preventDefault();
      apiPost('/api/logout', {}).then(function() { window.location.href = 'index.html'; })
        .catch(function() { window.location.href = 'index.html'; });
    });
  }, 50);
}

function renderBannedStub(el) { _renderBannedCard(el, false); }
function renderBannedProfile(el) { _renderBannedCard(el, true); }

function showPage(page) {
  currentPage = page;
  var titles = { home: 'Главная', decisions: 'Мои решения', polls: 'Мои голосования', profile: 'Профиль' };
  document.getElementById('pageTitle').textContent = titles[page] || '';
  var c = document.getElementById('mainContent');
  c.style.opacity = '0';
  c.style.transform = 'translateY(8px)';

  function finishRender() {
    c.style.transition = 'opacity 0.3s, transform 0.3s';
    c.style.opacity = '1';
    c.style.transform = 'translateY(0)';
  }

  setTimeout(function() {
    if (currentUser && currentUser.isBlocked) {
      if (page === 'profile') renderBannedProfile(c);
      else renderBannedStub(c);
    } else {
      if (page === 'home') renderHome(c);
      else if (page === 'decisions') renderDecisions(c);
      else if (page === 'polls') renderPolls(c);
      else if (page === 'profile') renderProfile(c);
    }
    finishRender();
  }, 80);
}

// ═══════ ГЛАВНАЯ ═══════
function renderHome(el) {
  Promise.all([apiGet('/api/polls'), apiGet('/api/decisions')]).then(function(r) {
    var polls = r[0].data.polls || [], decs = r[1].data.decisions || [];
    var tv = polls.reduce(function(s, p) { return s + p.totalVotes; }, 0);
    var tr = decs.reduce(function(s, d) { return s + d.responsesCount; }, 0);
    el.innerHTML =
      '<div class="animate-in"><h1 style="font-size:1.5rem;font-weight:700;margin-bottom:0.25rem;">Добро пожаловать, ' + esc(currentUser.firstName) + '!</h1>' +
      '<p style="color:var(--text-muted);margin-bottom:2rem;">Ваша сводка</p></div>' +
      '<div class="stats-grid animate-in delay-1">' +
        '<div class="stat-card"><div class="stat-label">Решений</div><div class="stat-value">' + decs.length + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">Голосований</div><div class="stat-value">' + polls.length + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">Ответов на решения</div><div class="stat-value">' + tr + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">Голосов в опросах</div><div class="stat-value">' + tv + '</div></div>' +
      '</div>' +
      '<div class="action-cards animate-in delay-2">' +
        '<div class="action-card" id="homeNewDec"><div class="action-card-icon">&#9733;</div><h3>Новое решение</h3><p>Соберите мнения по критериям</p></div>' +
        '<div class="action-card" id="homeNewPoll"><div class="action-card-icon">&#9783;</div><h3>Новое голосование</h3><p>Быстрый опрос по ссылке</p></div>' +
      '</div>';
    document.getElementById('homeNewDec').addEventListener('click', function() { openDecisionWizard(); });
    document.getElementById('homeNewPoll').addEventListener('click', openCreatePoll);
  });
}

// ═══════ РЕШЕНИЯ — список ═══════
function renderDecisions(el) {
  apiGet('/api/decisions').then(function(res) {
    var decs = res.data.decisions || [];
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">' +
      '<h2 style="font-size:1.25rem;font-weight:700;margin:0;">Мои решения</h2>' +
      '<button class="btn btn-primary" id="newDecBtn">Создать</button></div>';
    if (!decs.length) {
      html += '<div class="empty-state">Пока нет решений. Создайте первое!</div>';
    } else {
      decs.forEach(function(d) {
        html += '<div class="poll-item animate-in"><div class="poll-info">' +
          '<div class="poll-title">' + esc(d.title) + '</div>' +
          '<div class="poll-meta"><span class="badge ' + (d.isActive ? 'badge-active' : 'badge-closed') + '">' + (d.isActive ? 'Активно' : 'Завершено') + '</span> &middot; ' +
          d.responsesCount + ' ответов &middot; ' + d.alternativesCount + ' вариантов</div>' +
          (d.deadline ? '<div style="margin-top:0.5rem;" data-countdown="' + escAttr(d.deadline) + '">' + renderCountdown(d.deadline) + '</div>' : '') + '</div>' +
          '<div class="poll-actions">' +
            '<button class="btn btn-outline edit-dec-btn" data-idx="' + decs.indexOf(d) + '">Редактировать</button>' +
            '<button class="btn btn-outline copy-dec-btn" data-idx="' + decs.indexOf(d) + '">Копировать</button>' +
            '<button class="btn btn-outline share-dec-btn" data-slug="' + d.slug + '" data-title="' + escAttr(d.title) + '">Поделиться</button>' +
            '<button class="btn btn-primary view-dec-btn" data-slug="' + d.slug + '">Результаты</button>' +
            '<button class="btn btn-outline toggle-dec-btn" data-slug="' + d.slug + '">' + (d.isActive ? 'Завершить' : 'Открыть') + '</button>' +
            '<button class="btn btn-outline del-dec-btn" data-slug="' + d.slug + '">Удалить</button>' +
          '</div></div>';
      });
    }
    el.innerHTML = html;
    document.getElementById('newDecBtn').addEventListener('click', function() { openDecisionWizard(); });
    el.querySelectorAll('.share-dec-btn').forEach(function(b) {
      b.addEventListener('click', function() { openShareDecision(b.dataset.slug, b.dataset.title); });
    });
    el.querySelectorAll('.view-dec-btn').forEach(function(b) {
      b.addEventListener('click', function() { window.open('dec-results.html?id=' + b.dataset.slug, '_blank'); });
    });
    el.querySelectorAll('.toggle-dec-btn').forEach(function(b) {
      b.addEventListener('click', function() { apiPost('/api/decisions/' + b.dataset.slug + '/toggle', {}).then(function() { renderDecisions(el); }); });
    });
    el.querySelectorAll('.del-dec-btn').forEach(function(b) {
      b.addEventListener('click', function() { if (confirm('Удалить?')) apiDelete('/api/decisions/' + b.dataset.slug).then(function() { renderDecisions(el); }); });
    });
    el.querySelectorAll('.edit-dec-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        var d = decs[parseInt(b.dataset.idx)];
        wiz = {
          title: d.title, description: d.description || '',
          alternatives: d.alternatives && d.alternatives.length ? d.alternatives : ['', ''],
          criteria: d.criteria && d.criteria.length ? d.criteria : [''],
          authOnly: d.authOnly || false, showRespondents: d.showRespondents || false,
          anonymous: d.anonymous || false, showResults: d.showResults || 'always',
          deadline: d.deadline || '', isPublic: d.isPublic || false, editSlug: d.slug,
          scaleMax: d.scaleMax || 5
        };
        renderWiz(1);
      });
    });
    el.querySelectorAll('.copy-dec-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        var d = decs[parseInt(b.dataset.idx)];
        wiz = {
          title: d.title + ' (копия)', description: d.description || '',
          alternatives: d.alternatives && d.alternatives.length ? d.alternatives : ['', ''],
          criteria: d.criteria && d.criteria.length ? d.criteria : [''],
          authOnly: d.authOnly || false, showRespondents: d.showRespondents || false,
          anonymous: d.anonymous || false, showResults: d.showResults || 'always',
          deadline: '', isPublic: false, editSlug: '',
          scaleMax: d.scaleMax || 5
        };
        showToast('Скопировано. Отредактируйте и создайте.');
        renderWiz(1);
      });
    });
    startDashboardCountdowns();
  });
}

// ═══════ РЕШЕНИЯ — визард (3 шага) ═══════
var wiz = {};
var _DRAFT_KEY = 'diplom_draft_decision';
var _POLL_DRAFT_KEY = 'diplom_draft_poll';

function openDecisionWizard() {
  var draft = null;
  try { draft = localStorage.getItem(_DRAFT_KEY); } catch (e) {}
  if (draft) {
    try {
      var parsed = JSON.parse(draft);
      if (parsed && (parsed.title || parsed.alternatives && parsed.alternatives.some(function(a) { return a && a.trim(); }))) {
        if (confirm('Восстановить черновик решения?')) {
          wiz = parsed;
          renderWiz(1);
          return;
        }
      }
    } catch (e) {}
  }
  wiz = { title: '', description: '', alternatives: ['', ''], criteria: [''], authOnly: false, showRespondents: false, anonymous: false, showResults: 'always', deadline: '', isPublic: false, editSlug: '', scaleMax: 5 };
  renderWiz(1);
}

function _saveDraft() {
  if (!wiz.editSlug && (wiz.title || (wiz.alternatives && wiz.alternatives.some(function(a) { return a && a.trim(); })))) {
    try { localStorage.setItem(_DRAFT_KEY, JSON.stringify(wiz)); } catch (e) {}
  } else {
    try { localStorage.removeItem(_DRAFT_KEY); } catch (e) {}
  }
}

function renderWiz(step) {
  var el = document.getElementById('mainContent');
  document.getElementById('pageTitle').textContent = (wiz.editSlug ? 'Редактирование решения' : 'Новое решение') + ' — шаг ' + step + '/3';
  var h = '<div class="wizard animate-in"><div class="wizard-progress"><div class="wizard-progress-bar" style="width:' + Math.round(step/3*100) + '%;"></div></div>';

  if (step === 1) {
    h += '<h2 class="wizard-title">Вопрос и варианты</h2><p class="wizard-sub">Что решаем и какие есть варианты?</p>' +
      '<div class="field"><label>Вопрос</label><input type="text" id="wTitle" placeholder="Например: Какую CRM внедряем?" value="' + escAttr(wiz.title) + '"></div>' +
      '<div class="field"><label>Описание (необязательно)</label><textarea id="wDesc" placeholder="Дополнительный контекст" rows="2" style="resize:none;min-height:4rem;word-wrap:break-word;overflow-wrap:break-word;">' + escAttr(wiz.description) + '</textarea></div>' +
      '<div class="field"><label>Варианты</label><div id="wAlts">';
    wiz.alternatives.forEach(function(a, i) {
      h += '<div class="option-row"><input type="text" class="w-alt" placeholder="Вариант ' + (i+1) + '" value="' + escAttr(a) + '"><button type="button" class="remove-option w-alt-del">&times;</button></div>';
    });
    h += '</div><button type="button" class="btn-text" id="wAddAlt">+ Добавить вариант</button></div>' +
      '<div class="wizard-btns"><span></span><button class="btn btn-primary" id="wNext">Далее</button></div>';
  }
  else if (step === 2) {
    h += '<h2 class="wizard-title">Критерии оценки</h2><p class="wizard-sub">По каким параметрам сравнивать варианты?</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem;">' +
      '<button type="button" class="btn btn-outline" id="wTemplateBtn">Шаблон</button>' +
      '<button type="button" class="btn btn-outline" id="wAiBtn">&#10024; ИИ предложит критерии</button>' +
      '</div><div id="wAiStatus" style="font-size:0.8125rem;color:var(--text-muted);margin-bottom:0.5rem;"></div>' +
      '<div id="wCrits">';
    wiz.criteria.forEach(function(c, i) {
      h += '<div class="option-row"><input type="text" class="w-crit" placeholder="Критерий ' + (i+1) + '" value="' + escAttr(c) + '"><button type="button" class="remove-option w-crit-del">&times;</button></div>';
    });
    h += '</div><button type="button" class="btn-text" id="wAddCrit">+ Добавить критерий</button>' +
      '<div class="wizard-btns"><button class="btn btn-outline" id="wBack">Назад</button><button class="btn btn-primary" id="wNext">Далее</button></div>';
  }
  else if (step === 3) {
    h += '<h2 class="wizard-title">Настройки</h2><p class="wizard-sub">Кто может отвечать и сколько времени?</p>' +
      '<div class="field"><label for="wScaleMax">Система оценивания</label>' +
      '<select id="wScaleMax">' +
      '<option value="3"' + (wiz.scaleMax === 3 ? ' selected' : '') + '>3 балла (1–3)</option>' +
      '<option value="5"' + (wiz.scaleMax === 5 ? ' selected' : '') + '>5 баллов (1–5)</option>' +
      '<option value="10"' + (wiz.scaleMax === 10 ? ' selected' : '') + '>10 баллов (ползунок 1–10)</option>' +
      '<option value="100"' + (wiz.scaleMax === 100 ? ' selected' : '') + '>100 баллов (ползунок 1–100)</option>' +
      '</select></div>' +
      '<div class="field"><label for="wShowResults">Показывать результаты</label>' +
      '<select id="wShowResults">' +
      '<option value="always"' + (wiz.showResults === 'always' ? ' selected' : '') + '>Сразу после ответа</option>' +
      '<option value="after"' + (wiz.showResults === 'after' ? ' selected' : '') + '>После завершения</option>' +
      '<option value="author_only"' + (wiz.showResults === 'author_only' ? ' selected' : '') + '>Только автору</option>' +
      '</select></div>' +
      '<div class="modal-settings" style="margin-bottom:1rem;">' +
      '<label class="auth-checkbox"><input type="checkbox" id="wAuth" ' + (wiz.authOnly ? 'checked' : '') + '><span>Только авторизованные пользователи</span></label>' +
      '<label class="auth-checkbox"><input type="checkbox" id="wShowResp" ' + (wiz.showRespondents ? 'checked' : '') + '><span>Показывать имена ответивших</span></label>' +
      '<label class="auth-checkbox"><input type="checkbox" id="wAnon" ' + (wiz.anonymous ? 'checked' : '') + '><span>Тайное (анонимное) голосование</span></label>' +
      '</div>' +
      '<div class="field"><label>Дедлайн (необязательно)</label><input type="datetime-local" id="wDeadline" value="' + escAttr(wiz.deadline) + '"></div>' +
      '<label class="auth-checkbox" style="margin-top:0.5rem;"><input type="checkbox" id="wIsPublic" ' + (wiz.isPublic ? 'checked' : '') + '><span>Опубликовать в ленте</span></label>' +
      '<div class="wizard-btns"><button class="btn btn-outline" id="wBack">Назад</button><button class="btn btn-primary" id="wSubmit">' + (wiz.editSlug ? 'Сохранить' : 'Создать решение') + '</button></div>';
  }
  h += '</div>';
  el.innerHTML = h;

  if (step === 1) {
    document.getElementById('wAddAlt').addEventListener('click', function() {
      saveWiz1();
      wiz.alternatives.push('');
      var cont = document.getElementById('wAlts');
      var idx = wiz.alternatives.length;
      var row = document.createElement('div');
      row.className = 'option-row animate-in';
      row.innerHTML = '<input type="text" class="w-alt" placeholder="Вариант ' + idx + '" value=""><button type="button" class="remove-option w-alt-del">&times;</button>';
      cont.appendChild(row);
      bindDel('.w-alt-del', 'alternatives', 2, saveWiz1, function() { renderWiz(1); });
      row.querySelector('.w-alt').focus();
    });
    bindDel('.w-alt-del', 'alternatives', 2, saveWiz1, function() { renderWiz(1); });
    var wDesc = document.getElementById('wDesc');
    if (wDesc) { _autoResizeTextarea(wDesc); wDesc.addEventListener('input', function() { _autoResizeTextarea(this); }); }
    document.getElementById('wNext').addEventListener('click', function() {
      saveWiz1();
      if (!wiz.title.trim()) { showToast('Введите вопрос'); return; }
      if (wiz.alternatives.filter(function(a) { return a.trim(); }).length < 2) { showToast('Минимум 2 варианта'); return; }
      renderWiz(2);
    });
  }
  else if (step === 2) {
    document.getElementById('wAddCrit').addEventListener('click', function() {
      saveWiz2();
      wiz.criteria.push('');
      var cont = document.getElementById('wCrits');
      var idx = wiz.criteria.length;
      var row = document.createElement('div');
      row.className = 'option-row animate-in';
      row.innerHTML = '<input type="text" class="w-crit" placeholder="Критерий ' + idx + '" value=""><button type="button" class="remove-option w-crit-del">&times;</button>';
      cont.appendChild(row);
      bindDel('.w-crit-del', 'criteria', 1, saveWiz2, function() { renderWiz(2); });
      row.querySelector('.w-crit').focus();
    });
    bindDel('.w-crit-del', 'criteria', 1, saveWiz2, function() { renderWiz(2); });
    document.getElementById('wTemplateBtn').addEventListener('click', function() {
      saveWiz2();
      wiz.criteria = ['Организационная', 'Экономическая', 'Маркетинговая', 'Физическая/естественно-научная', 'Техническая', 'Математическая', 'Нормативная', 'Правовая', 'Конституционная', 'Социально-компьютерная'];
      showToast('Шаблон применён. Можно отредактировать.');
      renderWiz(2);
    });
    document.getElementById('wBack').addEventListener('click', function() { saveWiz2(); renderWiz(1); });
    document.getElementById('wNext').addEventListener('click', function() {
      saveWiz2();
      if (wiz.criteria.filter(function(c) { return c.trim(); }).length < 1) { showToast('Минимум 1 критерий'); return; }
      renderWiz(3);
    });
    document.getElementById('wAiBtn').addEventListener('click', function() {
      var btn = this;
      var status = document.getElementById('wAiStatus');
      btn.disabled = true;
      btn.textContent = 'Думаю...';
      status.textContent = '';
      saveWiz2();
      apiPost('/api/ai/suggest-criteria', { question: wiz.title }).then(function(res) {
        if (res.data.criteria && res.data.criteria.length) {
          wiz.criteria = res.data.criteria;
          var srcName = { cerebras: 'Llama AI', deepseek: 'DeepSeek AI', llama: 'Llama AI', groq: 'Llama AI', gemini: 'Gemini AI', openai: 'GPT', local: 'шаблон' }[res.data.source] || 'ИИ';
          var msg = res.data.source === 'local' ? 'Подобраны по шаблону. Отредактируйте под себя.' : 'Критерии от ' + srcName + '! Можете отредактировать.';
          showToast(msg);
          renderWiz(2);
        } else {
          status.textContent = res.data.error || 'Не удалось получить подсказки';
          btn.disabled = false;
          btn.innerHTML = '&#10024; ИИ предложит критерии';
        }
      }).catch(function() {
        status.textContent = 'Ошибка соединения';
        btn.disabled = false;
        btn.innerHTML = '&#10024; ИИ предложит критерии';
      });
    });
  }
  else if (step === 3) {
    var showResp = document.getElementById('wShowResp');
    var wAnon = document.getElementById('wAnon');
    function syncNamesAnon() {
      if (wAnon.checked) showResp.checked = false;
      else if (showResp.checked) wAnon.checked = false;
    }
    showResp.addEventListener('change', syncNamesAnon);
    wAnon.addEventListener('change', syncNamesAnon);
    syncNamesAnon();
    document.getElementById('wBack').addEventListener('click', function() { saveWiz3(); renderWiz(2); });
    document.getElementById('wSubmit').addEventListener('click', function() {
      saveWiz3();
      var btn = this; btn.disabled = true; btn.textContent = 'Создание...';
      var decBody = {
        title: wiz.title, description: wiz.description,
        alternatives: wiz.alternatives.filter(function(a) { return a.trim(); }),
        criteria: wiz.criteria.filter(function(c) { return c.trim(); }),
        authOnly: wiz.authOnly, showRespondents: wiz.showRespondents,
        anonymous: wiz.anonymous, showResults: wiz.showResults, deadline: wiz.deadline,
        isPublic: wiz.isPublic, scaleMax: parseInt(wiz.scaleMax) || 5
      };
      var decReq = wiz.editSlug ? apiPut('/api/decisions/' + wiz.editSlug, decBody) : apiPost('/api/decisions', decBody);
      decReq.then(function(res) {
        if (res.data.blocked) { window.location.href = 'banned.html'; return; }
        if (res.data.warning) {
          showWarningModal(res.data.reason || 'Контент отклонён', res.data.warningCount);
          btn.disabled = false; btn.textContent = wiz.editSlug ? 'Сохранить' : 'Создать решение';
          if (!res.data.ok) return;
        }
        if (res.data.ok) {
          try { localStorage.removeItem(_DRAFT_KEY); } catch (e) {}
          if (res.data.isPublic) showToast('Опубликовано в ленту');
          if (res.data.notPublishedToFeed) showToast('Сохранено. В ленту не опубликовано.');
          if (wiz.editSlug) {
            showToast('Решение сохранено');
            renderDecisions(document.getElementById('mainContent'));
            document.getElementById('pageTitle').textContent = 'Мои решения';
          } else {
            openShareDecision(res.data.slug, wiz.title);
          }
        }
        else { showToast(res.data.error); btn.disabled = false; btn.textContent = wiz.editSlug ? 'Сохранить' : 'Создать решение'; }
      });
    });
  }
}

function saveWiz1() { wiz.title = gv('#wTitle'); wiz.description = gv('#wDesc'); wiz.alternatives = gvAll('.w-alt'); _saveDraft(); }
function _autoResizeTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 300) + 'px';
}
function saveWiz2() { wiz.criteria = gvAll('.w-crit'); _saveDraft(); }
function saveWiz3() {
  wiz.authOnly = document.getElementById('wAuth').checked;
  wiz.showRespondents = document.getElementById('wShowResp').checked;
  wiz.anonymous = document.getElementById('wAnon').checked;
  wiz.showResults = (document.getElementById('wShowResults') || {}).value || 'always';
  wiz.deadline = gv('#wDeadline');
  wiz.isPublic = document.getElementById('wIsPublic').checked;
  wiz.scaleMax = parseInt((document.getElementById('wScaleMax') || {}).value) || 5;
  _saveDraft();
}
function gv(s) { var e = document.querySelector(s); return e ? e.value : ''; }
function gvAll(s) { var r = []; document.querySelectorAll(s).forEach(function(e) { r.push(e.value); }); return r; }
function focusLast(s) { var all = document.querySelectorAll(s); if (all.length) all[all.length-1].focus(); }
function bindDel(sel, arrName, min, saveFn, renderFn) {
  document.querySelectorAll(sel).forEach(function(b, i) {
    b.addEventListener('click', function() {
      saveFn();
      if (wiz[arrName].length <= min) return;
      wiz[arrName].splice(i, 1);
      renderFn();
    });
  });
}

function openShareDecision(slug, title) {
  var ov = document.getElementById('shareOverlay'); ov.style.display = 'flex';
  var name = currentUser.lastName + ' ' + currentUser.firstName;
  document.getElementById('sharePreviewText').innerHTML = '<strong>' + esc(name) + '</strong> предлагает вам помочь решить:<br>«' + esc(title) + '»';
  apiGet('/api/decisions/' + slug + '/qr').then(function(res) {
    document.getElementById('shareLink').value = res.data.url;
    document.getElementById('qrImage').src = res.data.qr;
    document.getElementById('qrImage').dataset.slug = slug;
    bindShareSocials();
  });
}

// ═══════ ГОЛОСОВАНИЯ ═══════
function renderPolls(el) {
  apiGet('/api/polls').then(function(res) {
    var polls = res.data.polls || [];
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">' +
      '<h2 style="font-size:1.25rem;font-weight:700;margin:0;">Мои голосования</h2>' +
      '<button class="btn btn-primary" id="newPollBtn">Создать</button></div>';
    if (!polls.length) {
      html += '<div class="empty-state">Пока нет голосований. Создайте первое!</div>';
    } else {
      polls.forEach(function(p) {
        html += '<div class="poll-item animate-in"><div class="poll-info">' +
          '<div class="poll-title">' + esc(p.title) + '</div>' +
          '<div class="poll-meta"><span class="badge ' + (p.isActive ? 'badge-active' : 'badge-closed') + '">' + (p.isActive ? 'Активно' : 'Завершено') + '</span> &middot; ' +
          p.totalVotes + ' голосов</div>' +
          (p.deadline ? '<div style="margin-top:0.5rem;" data-countdown="' + escAttr(p.deadline) + '">' + renderCountdown(p.deadline) + '</div>' : '') + '</div>' +
          '<div class="poll-actions">' +
            '<button class="btn btn-outline share-poll-btn" data-slug="' + p.slug + '" data-title="' + escAttr(p.title) + '">Поделиться</button>' +
            '<button class="btn btn-outline edit-poll-btn" data-slug="' + p.slug + '">Редактировать</button>' +
            '<button class="btn btn-outline copy-poll-btn" data-slug="' + p.slug + '">Копировать</button>' +
            '<button class="btn btn-outline results-poll-btn" data-slug="' + p.slug + '">Результаты</button>' +
            '<button class="btn btn-outline toggle-poll-btn" data-slug="' + p.slug + '">' + (p.isActive ? 'Завершить' : 'Открыть') + '</button>' +
          '</div></div>';
      });
    }
    el.innerHTML = html;
    document.getElementById('newPollBtn').addEventListener('click', openCreatePoll);
    el.querySelectorAll('.share-poll-btn').forEach(function(b) { b.addEventListener('click', function() { openSharePoll(b.dataset.slug, b.dataset.title); }); });
    el.querySelectorAll('.edit-poll-btn').forEach(function(b) { b.addEventListener('click', function() { openEditPoll(b.dataset.slug); }); });
    el.querySelectorAll('.copy-poll-btn').forEach(function(b) { b.addEventListener('click', function() { apiGet('/api/polls/' + b.dataset.slug).then(function(res) {
      var p = res.data.poll;
      document.getElementById('modalOverlay').style.display = 'flex';
      document.getElementById('modalTitle').textContent = 'Копия голосования';
      document.getElementById('createPollForm').reset();
      document.getElementById('pollSlugEdit').value = '';
      document.getElementById('pollTitle').value = (p.title || '') + ' (копия)';
      document.getElementById('pollDesc').value = p.description || '';
      _autoResizeTextarea(document.getElementById('pollDesc'));
      document.getElementById('pollMultiple').checked = p.multipleChoice;
      document.getElementById('pollAuthOnly').checked = p.authOnly;
      document.getElementById('pollShowResults').value = p.showResults || 'always';
      document.getElementById('pollDeadline').value = '';
      document.getElementById('pollShowVoters').checked = p.showVoters || false;
      document.getElementById('pollAnonymous').checked = p.anonymous;
      document.getElementById('pollMaxVotes').value = p.maxVotes || 0;
      document.getElementById('pollIsPublic').checked = false;
      syncPollNamesAnon();
      var cont = document.getElementById('optionsContainer'); cont.innerHTML = '';
      (p.options || []).forEach(function(o, i) {
        cont.innerHTML += '<div class="option-row"><input type="text" class="poll-option" placeholder="Вариант ' + (i+1) + '" value="' + escAttr(o.text) + '" required><button type="button" class="remove-option">&times;</button></div>';
      });
      bindPollDel();
      showToast('Скопировано. Отредактируйте и создайте.');
    }); }); });
    el.querySelectorAll('.results-poll-btn').forEach(function(b) { b.addEventListener('click', function() { window.open('results.html?id=' + b.dataset.slug, '_blank'); }); });
    el.querySelectorAll('.toggle-poll-btn').forEach(function(b) { b.addEventListener('click', function() { apiPost('/api/polls/' + b.dataset.slug + '/toggle', {}).then(function() { renderPolls(el); }); }); });
    startDashboardCountdowns();
  });
}

function syncPollNamesAnon() {
  var sv = document.getElementById('pollShowVoters');
  var pa = document.getElementById('pollAnonymous');
  if (!sv || !pa) return;
  if (pa.checked) sv.checked = false;
  else if (sv.checked) pa.checked = false;
}

function _getPollDraft() {
  var opts = []; document.querySelectorAll('.poll-option').forEach(function(i) { if (i.value.trim()) opts.push(i.value.trim()); });
  return {
    title: (document.getElementById('pollTitle') || {}).value || '',
    description: (document.getElementById('pollDesc') || {}).value || '',
    options: opts,
    multipleChoice: (document.getElementById('pollMultiple') || {}).checked,
    authOnly: (document.getElementById('pollAuthOnly') || {}).checked,
    showResults: (document.getElementById('pollShowResults') || {}).value,
    deadline: (document.getElementById('pollDeadline') || {}).value || '',
    showVoters: (document.getElementById('pollShowVoters') || {}).checked,
    anonymous: (document.getElementById('pollAnonymous') || {}).checked,
    maxVotes: parseInt((document.getElementById('pollMaxVotes') || {}).value) || 0,
    isPublic: (document.getElementById('pollIsPublic') || {}).checked
  };
}
function _savePollDraft() {
  if ((document.getElementById('pollSlugEdit') || {}).value) return;
  var d = _getPollDraft();
  if (d.title || (d.options && d.options.length >= 2)) {
    try { localStorage.setItem(_POLL_DRAFT_KEY, JSON.stringify(d)); } catch (e) {}
  } else {
    try { localStorage.removeItem(_POLL_DRAFT_KEY); } catch (e) {}
  }
}
function openCreatePoll() {
  var draft = null;
  try { draft = localStorage.getItem(_POLL_DRAFT_KEY); } catch (e) {}
  if (draft) {
    try {
      var parsed = JSON.parse(draft);
      if (parsed && (parsed.title || (parsed.options && parsed.options.length >= 2))) {
        if (confirm('Восстановить черновик голосования?')) {
          document.getElementById('modalOverlay').style.display = 'flex';
          document.getElementById('modalTitle').textContent = 'Новое голосование';
          document.getElementById('pollSlugEdit').value = '';
          document.getElementById('pollTitle').value = parsed.title || '';
          document.getElementById('pollDesc').value = parsed.description || '';
          _autoResizeTextarea(document.getElementById('pollDesc'));
          document.getElementById('pollMultiple').checked = !!parsed.multipleChoice;
          document.getElementById('pollAuthOnly').checked = !!parsed.authOnly;
          document.getElementById('pollShowResults').value = parsed.showResults || 'always';
          document.getElementById('pollDeadline').value = parsed.deadline || '';
          document.getElementById('pollShowVoters').checked = !!parsed.showVoters;
          document.getElementById('pollAnonymous').checked = !!parsed.anonymous;
          document.getElementById('pollMaxVotes').value = parsed.maxVotes || 0;
          document.getElementById('pollIsPublic').checked = !!parsed.isPublic;
          syncPollNamesAnon();
          var cont = document.getElementById('optionsContainer'); cont.innerHTML = '';
          var opts = parsed.options && parsed.options.length >= 2 ? parsed.options : ['', ''];
          opts.forEach(function(t, i) {
            cont.innerHTML += '<div class="option-row"><input type="text" class="poll-option" placeholder="Вариант ' + (i+1) + '" value="' + escAttr(t) + '" required><button type="button" class="remove-option">&times;</button></div>';
          });
          bindPollDel();
          return;
        }
      }
    } catch (e) {}
  }
  document.getElementById('modalOverlay').style.display = 'flex';
  document.getElementById('createPollForm').reset();
  document.getElementById('modalTitle').textContent = 'Новое голосование';
  document.getElementById('pollSlugEdit').value = '';
  var cont = document.getElementById('optionsContainer');
  cont.innerHTML = '<div class="option-row"><input type="text" class="poll-option" placeholder="Вариант 1" required><button type="button" class="remove-option">&times;</button></div>' +
    '<div class="option-row"><input type="text" class="poll-option" placeholder="Вариант 2" required><button type="button" class="remove-option">&times;</button></div>';
  bindPollDel();
  syncPollNamesAnon();
}

function openEditPoll(slug) {
  apiGet('/api/polls/' + slug).then(function(res) {
    var p = res.data.poll;
    document.getElementById('modalOverlay').style.display = 'flex';
    document.getElementById('modalTitle').textContent = 'Редактировать голосование';
    document.getElementById('pollSlugEdit').value = slug;
    document.getElementById('pollTitle').value = p.title;
    document.getElementById('pollDesc').value = p.description || '';
    _autoResizeTextarea(document.getElementById('pollDesc'));
    document.getElementById('pollMultiple').checked = p.multipleChoice;
    document.getElementById('pollAuthOnly').checked = p.authOnly;
    document.getElementById('pollShowResults').value = p.showResults || 'always';
    document.getElementById('pollDeadline').value = p.deadline || '';
    document.getElementById('pollShowVoters').checked = p.showVoters || false;
    document.getElementById('pollAnonymous').checked = p.anonymous || false;
    syncPollNamesAnon();
    document.getElementById('pollMaxVotes').value = p.maxVotes || 0;
    document.getElementById('pollIsPublic').checked = p.isPublic || false;
    var cont = document.getElementById('optionsContainer'); cont.innerHTML = '';
    p.options.forEach(function(o, i) {
      cont.innerHTML += '<div class="option-row"><input type="text" class="poll-option" placeholder="Вариант ' + (i+1) + '" value="' + escAttr(o.text) + '" required><button type="button" class="remove-option">&times;</button></div>';
    });
    bindPollDel();
  });
}

(function() {
  var pollDesc = document.getElementById('pollDesc');
  if (pollDesc) {
    pollDesc.addEventListener('input', function() { _autoResizeTextarea(this); _savePollDraft(); });
  }
  ['pollTitle','pollDesc','pollDeadline','pollMaxVotes'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', _savePollDraft);
  });
  ['pollMultiple','pollAuthOnly','pollShowVoters','pollAnonymous','pollIsPublic'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', _savePollDraft);
  });
  document.getElementById('optionsContainer') && document.getElementById('optionsContainer').addEventListener('input', function() { setTimeout(_savePollDraft, 0); });
})();
document.getElementById('modalClose').addEventListener('click', function() { _savePollDraft(); document.getElementById('modalOverlay').style.display = 'none'; });
document.getElementById('modalOverlay').addEventListener('click', function(e) { if (e.target === this) { _savePollDraft(); this.style.display = 'none'; } });
document.getElementById('pollShowVoters').addEventListener('change', syncPollNamesAnon);
document.getElementById('pollAnonymous').addEventListener('change', syncPollNamesAnon);
document.getElementById('addOptionBtn').addEventListener('click', function() {
  var cont = document.getElementById('optionsContainer');
  var n = cont.querySelectorAll('.option-row').length + 1;
  var row = document.createElement('div'); row.className = 'option-row animate-in';
  row.innerHTML = '<input type="text" class="poll-option" placeholder="Вариант ' + n + '" required><button type="button" class="remove-option">&times;</button>';
  cont.appendChild(row); bindPollDel(); row.querySelector('input').focus();
});
function bindPollDel() { document.querySelectorAll('#optionsContainer .remove-option').forEach(function(b) { b.onclick = function() { if (document.querySelectorAll('#optionsContainer .option-row').length > 2) b.parentElement.remove(); }; }); }

document.getElementById('createPollForm').addEventListener('submit', function(e) {
  e.preventDefault();
  var opts = []; document.querySelectorAll('.poll-option').forEach(function(i) { if (i.value.trim()) opts.push(i.value.trim()); });
  var slug = document.getElementById('pollSlugEdit').value;
  var body = {
    title: document.getElementById('pollTitle').value.trim(),
    description: document.getElementById('pollDesc').value.trim(),
    options: opts,
    multipleChoice: document.getElementById('pollMultiple').checked,
    authOnly: document.getElementById('pollAuthOnly').checked,
    showResults: document.getElementById('pollShowResults').value,
    deadline: document.getElementById('pollDeadline').value,
    showVoters: document.getElementById('pollShowVoters').checked,
    anonymous: document.getElementById('pollAnonymous').checked,
    maxVotes: parseInt(document.getElementById('pollMaxVotes').value) || 0,
    isPublic: document.getElementById('pollIsPublic').checked
  };
  var req = slug ? apiPut('/api/polls/' + slug, body) : apiPost('/api/polls', body);
  req.then(function(res) {
    if (res.data.blocked) {
      showWarningModal('Аккаунт заблокирован. Действие недоступно.');
      return;
    }
    if (res.data.warning) {
      showWarningModal(res.data.reason || 'Контент отклонён модерацией', res.data.warningCount);
      return;
    }
    if (res.data.ok) {
      try { localStorage.removeItem(_POLL_DRAFT_KEY); } catch (e) {}
      document.getElementById('modalOverlay').style.display = 'none';
      if (res.data.isPublic) showToast('Опубликовано в ленту');
      if (res.data.notPublishedToFeed) showToast('Сохранено. В ленту не опубликовано.');
      if (!slug) openSharePoll(res.data.slug, body.title);
      if (currentPage === 'polls') renderPolls(document.getElementById('mainContent'));
      if (currentPage === 'home') renderHome(document.getElementById('mainContent'));
    } else { showToast(res.data.error || 'Ошибка при сохранении'); }
  }).catch(function(err) { console.error('Poll save error:', err); showToast('Ошибка соединения'); });
});

function openSharePoll(slug, title) {
  var ov = document.getElementById('shareOverlay'); ov.style.display = 'flex';
  var name = currentUser.lastName + ' ' + currentUser.firstName;
  document.getElementById('sharePreviewText').innerHTML = '<strong>' + esc(name) + '</strong> предлагает проголосовать:<br>«' + esc(title) + '»';
  apiGet('/api/polls/' + slug + '/qr').then(function(res) {
    document.getElementById('shareLink').value = res.data.url;
    document.getElementById('qrImage').src = res.data.qr;
    document.getElementById('qrImage').dataset.slug = slug;
    bindShareSocials();
  });
}

function closeShareOverlay() {
  document.getElementById('shareOverlay').style.display = 'none';
  if (currentPage) showPage(currentPage);
}
document.getElementById('shareClose').addEventListener('click', closeShareOverlay);
document.getElementById('shareOverlay').addEventListener('click', function(e) { if (e.target === this) closeShareOverlay(); });
document.getElementById('copyLinkBtn').addEventListener('click', function() {
  var inp = document.getElementById('shareLink'); inp.select();
  navigator.clipboard.writeText(inp.value).then(function() {
    document.getElementById('copyLinkBtn').textContent = 'Скопировано!';
    showToast('Ссылка скопирована');
    setTimeout(function() { document.getElementById('copyLinkBtn').textContent = 'Копировать'; }, 1500);
  });
});
document.getElementById('downloadQrBtn').addEventListener('click', function() {
  var img = document.getElementById('qrImage'); var a = document.createElement('a'); a.href = img.src; a.download = 'qr-' + (img.dataset.slug || 'code') + '.png'; a.click();
});

// ═══════ ПРОФИЛЬ ═══════
function renderProfile(el) {
  var bd = currentUser.birthdate || '—';
  var ini = (currentUser.firstName[0] || '') + (currentUser.lastName[0] || '');
  el.innerHTML = '<div class="profile-card animate-in">' +
    '<div class="profile-avatar">' + esc(ini.toUpperCase()) + '</div>' +
    '<div class="profile-row"><span class="profile-label">Фамилия</span><span class="profile-value">' + esc(currentUser.lastName) + '</span></div>' +
    '<div class="profile-row"><span class="profile-label">Имя</span><span class="profile-value">' + esc(currentUser.firstName) + '</span></div>' +
    '<div class="profile-row"><span class="profile-label">Дата рождения</span><span class="profile-value">' + esc(bd) + '</span></div>' +
    '<div class="profile-row"><span class="profile-label">Email</span><span class="profile-value">' + esc(currentUser.email) + '</span></div>' +
    '<div class="profile-row"><span class="profile-label">Регистрация</span><span class="profile-value">' + esc(currentUser.createdAt || '—') + '</span></div>' +
    '<button class="btn btn-danger profile-logout-btn" id="profileLogoutBtn">Выйти из аккаунта</button>' +
    '<button class="btn profile-delete-btn" id="profileDeleteBtn">Удалить аккаунт</button>' +
    '<div id="deleteConfirmBox" style="display:none;margin-top:1rem;">' +
      '<p style="color:#b91c1c;font-size:0.875rem;margin-bottom:0.5rem;">Для подтверждения введите слово <strong>Удалить</strong>:</p>' +
      '<input type="text" id="deleteConfirmInput" class="form-input" placeholder="Удалить" style="margin-bottom:0.5rem;">' +
      '<div style="display:flex;gap:0.5rem;">' +
        '<button class="btn btn-danger" id="deleteConfirmYes" disabled style="flex:1;">Подтвердить удаление</button>' +
        '<button class="btn btn-outline" id="deleteConfirmNo" style="flex:1;">Отмена</button>' +
      '</div>' +
    '</div>' +
    '</div>';
  setTimeout(function() {
    var btn = document.getElementById('profileLogoutBtn');
    if (btn) btn.addEventListener('click', function() {
      apiPost('/api/logout', {}).then(function() { window.location.href = 'index.html'; })
        .catch(function() { window.location.href = 'index.html'; });
    });
    var delBtn = document.getElementById('profileDeleteBtn');
    var delBox = document.getElementById('deleteConfirmBox');
    var delInput = document.getElementById('deleteConfirmInput');
    var delYes = document.getElementById('deleteConfirmYes');
    var delNo = document.getElementById('deleteConfirmNo');
    if (delBtn) delBtn.addEventListener('click', function() {
      delBtn.style.display = 'none';
      delBox.style.display = 'block';
      delInput.value = '';
      delYes.disabled = true;
      delInput.focus();
    });
    if (delInput) delInput.addEventListener('input', function() {
      delYes.disabled = delInput.value.trim() !== 'Удалить';
    });
    if (delNo) delNo.addEventListener('click', function() {
      delBox.style.display = 'none';
      delBtn.style.display = '';
    });
    if (delYes) delYes.addEventListener('click', function() {
      delYes.disabled = true;
      delYes.textContent = 'Удаление...';
      apiPost('/api/delete-account', { confirm: delInput.value.trim() }).then(function(res) {
        if (res.data.ok) {
          window.location.href = 'index.html';
        } else {
          showToast(res.data.error || 'Ошибка удаления');
          delYes.disabled = false;
          delYes.textContent = 'Подтвердить удаление';
        }
      }).catch(function() {
        showToast('Ошибка соединения');
        delYes.disabled = false;
        delYes.textContent = 'Подтвердить удаление';
      });
    });
  }, 0);
}

// ═══════ УТИЛИТЫ ═══════
function esc(s) { var d = document.createElement('div'); d.appendChild(document.createTextNode(s || '')); return d.innerHTML; }
function escAttr(s) { return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
