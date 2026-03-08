(function(){
  const body = document.getElementById('feedBody');
  const loadMoreBtn = document.getElementById('feedLoadMore');
  let page = 1;
  let totalPages = 1;
  let loading = false;
  let userBlocked = false;

  fetch('/api/me', {credentials:'include'}).then(r=>r.json()).then(d=>{
    if (d.user && d.user.isBlocked) userBlocked = true;
  }).catch(()=>{});

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    let s = dateStr.replace(' ', 'T');
    if (!s.endsWith('Z') && !s.includes('+')) s += 'Z';
    const d = new Date(s);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 0) return 'только что';
    if (diff < 60) return 'только что';
    if (diff < 3600) return Math.floor(diff/60) + ' мин. назад';
    if (diff < 86400) return Math.floor(diff/3600) + ' ч. назад';
    if (diff < 2592000) return Math.floor(diff/86400) + ' дн. назад';
    return d.toLocaleDateString('ru-RU');
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function renderCard(item) {
    if (!item || !item.slug) return '';
    const isDecision = item.type === 'decision';
    const showResults = item.showResults || 'always';
    const hasVoted = !!item.hasVoted;
    const hasResponded = !!item.hasResponded;
    const statusText = item.isActive ? 'Активно' : 'Завершено';
    const statusDot = item.isActive
      ? '<span style="color:#22c55e">●</span>'
      : '<span style="color:#94a3b8">●</span>';
    const typeBadge = isDecision
      ? '<span style="background:var(--primary-50);color:var(--primary);font-size:0.6875rem;font-weight:600;padding:0.125rem 0.5rem;border-radius:1rem;margin-left:0.5rem;">Решение</span>'
      : '<span style="background:#dcfce7;color:#166534;font-size:0.6875rem;font-weight:600;padding:0.125rem 0.5rem;border-radius:1rem;margin-left:0.5rem;">Опрос</span>';

    const metaText = isDecision
      ? `${statusDot} ${statusText} · ${item.responsesCount} ответ${pluralResp(item.responsesCount)} · ${item.alternativesCount} вариант${pluralAlt(item.alternativesCount)}`
      : `${statusDot} ${statusText} · ${item.totalVotes} голос${pluralVote(item.totalVotes)}`;

    const canSeeResults = (showResults === 'always') || !item.isActive;
    let actionUrl, actionText;
    if (isDecision) {
      if (hasResponded && canSeeResults) {
        actionUrl = `dec-results.html?id=${item.slug}`;
        actionText = 'Посмотреть результаты';
      } else {
        actionUrl = `respond.html?id=${item.slug}`;
        actionText = 'Оценить';
      }
    } else {
      if (hasVoted && canSeeResults) {
        actionUrl = `results.html?id=${item.slug}`;
        actionText = 'Посмотреть результаты';
      } else {
        actionUrl = `vote.html?id=${item.slug}`;
        actionText = 'Проголосовать';
      }
    }
    const shareUrl = isDecision ? `respond.html?id=${item.slug}` : `vote.html?id=${item.slug}`;

    const lastComments = (item.lastComments || []).map(c =>
      `<div class="feed-comment">
        <div class="feed-comment-avatar">${esc(c.author.split(' ').map(w=>w[0]).join('').toUpperCase())}</div>
        <div class="feed-comment-body">
          <span class="feed-comment-author">${esc(c.author)}</span>
          <span class="feed-comment-text">${esc(c.text)}</span>
          <div class="feed-comment-time">${timeAgo(c.createdAt)}</div>
        </div>
      </div>`
    ).join('');

    const showAllBtn = item.commentCount > 2
      ? `<button class="feed-show-all-comments" data-slug="${item.slug}" data-type="${item.type || 'poll'}">Показать все ${item.commentCount} комментария</button>`
      : '';

    return `<div class="feed-card" data-slug="${item.slug}" data-type="${item.type || 'poll'}">
      <div class="feed-card-header">
        <div class="feed-avatar">${esc(item.authorInitials)}</div>
        <div class="feed-author-info">
          <div class="feed-author-name">${esc(item.authorName)}${typeBadge}</div>
          <div class="feed-time">${timeAgo(item.createdAt)}</div>
        </div>
      </div>
      <div class="feed-card-body">
        <div class="feed-card-title">${esc(item.title)}</div>
        ${item.description ? `<div class="feed-card-desc">${esc(item.description)}</div>` : ''}
        <div class="feed-card-meta">${metaText}</div>
        ${userBlocked ? '' : `<a href="${actionUrl}" class="feed-vote-btn">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M7 13l3 3 3-3M10 16V4"/></svg>
          ${actionText}
        </a>`}
      </div>
      <div class="feed-card-actions">
        ${userBlocked ? '' : `<button class="feed-action-btn btn-like ${item.myReaction==='like'?'active-like':''}" data-slug="${item.slug}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
          <span class="like-count">${item.likes}</span>
        </button>
        <button class="feed-action-btn btn-dislike ${item.myReaction==='dislike'?'active-dislike':''}" data-slug="${item.slug}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
          <span class="dislike-count">${item.dislikes}</span>
        </button>`}
        <button class="feed-action-btn btn-comments-toggle" data-slug="${item.slug}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span class="comment-count-label">${item.commentCount}</span>
        </button>
        <div class="feed-share-group">
          <button class="feed-share-btn" title="Telegram" onclick="window.open('https://t.me/share/url?url='+encodeURIComponent(location.origin+'/${shareUrl}'),'_blank')">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 1 0 24 12.056A12.01 12.01 0 0 0 11.944 0Zm5.09 7.272-1.9 8.962c-.143.636-.517.789-.962.513l-2.812-2.072-1.357 1.305c-.15.15-.276.276-.566.276l.2-2.878 5.199-4.698c.226-.2-.049-.313-.351-.113L8.462 13.06l-2.789-.868c-.606-.19-.619-.606.127-.9l10.9-4.2c.505-.186.946.124.782.88h-.002Z"/></svg>
          </button>
          <button class="feed-share-btn" title="ВКонтакте" onclick="window.open('https://vk.com/share.php?url='+encodeURIComponent(location.origin+'/${shareUrl}'),'_blank')">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.6-.187 1.37 1.245 2.186 1.796.616.416 1.085.325 1.085.325l2.18-.03s1.14-.071.599-.972c-.044-.073-.314-.663-1.618-1.873-1.363-1.267-1.18-1.062.462-3.254.998-1.333 1.398-2.147 1.273-2.496-.12-.332-.856-.244-.856-.244l-2.454.015s-.182-.025-.317.056c-.133.079-.218.263-.218.263s-.39 1.04-.911 1.924c-1.1 1.867-1.54 1.966-1.72 1.85-.417-.272-.313-1.09-.313-1.67 0-1.816.275-2.574-.535-2.771-.27-.066-.467-.109-1.154-.116-.88-.01-1.626.003-2.048.21-.28.137-.497.442-.365.46.163.021.532.1.728.363.253.341.244 1.107.244 1.107s.145 2.137-.339 2.402c-.332.182-.788-.19-1.767-1.9-.502-.876-.88-1.844-.88-1.844s-.073-.179-.203-.275c-.158-.117-.378-.154-.378-.154l-2.334.015s-.35.01-.479.163c-.114.136-.009.418-.009.418s1.838 4.3 3.92 6.467c1.907 1.987 4.073 1.857 4.073 1.857h.982Z"/></svg>
          </button>
          <button class="feed-share-btn" title="WhatsApp" onclick="window.open('https://wa.me/?text='+encodeURIComponent(location.origin+'/${shareUrl}'),'_blank')">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
          </button>
          <button class="feed-share-btn btn-copy-link" title="Копировать ссылку" data-slug="${item.slug}" data-type="${item.type || 'poll'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
        </div>
      </div>
      <div class="feed-comments" data-slug="${item.slug}" data-type="${item.type || 'poll'}" style="display:none;">
        ${lastComments}
        ${showAllBtn}
        ${userBlocked ? '' : `<div class="feed-add-comment">
          <input type="text" placeholder="Написать комментарий…" maxlength="1000" data-slug="${item.slug}">
          <button data-slug="${item.slug}">Отправить</button>
        </div>`}
      </div>
    </div>`;
  }

  function pluralVote(n) {
    const a = Math.abs(n) % 100;
    const b = a % 10;
    if (a > 10 && a < 20) return 'ов';
    if (b > 1 && b < 5) return 'а';
    if (b === 1) return '';
    return 'ов';
  }
  function pluralResp(n) {
    const a = Math.abs(n) % 100; const b = a % 10;
    if (a > 10 && a < 20) return 'ов';
    if (b > 1 && b < 5) return 'а';
    if (b === 1) return '';
    return 'ов';
  }
  function pluralAlt(n) {
    const a = Math.abs(n) % 100; const b = a % 10;
    if (a > 10 && a < 20) return 'ов';
    if (b > 1 && b < 5) return 'а';
    if (b === 1) return '';
    return 'ов';
  }

  async function loadPage(p) {
    if (loading) return;
    loading = true;
    if (p === 1) {
      body.innerHTML = '<div class="feed-empty" style="padding:2rem;text-align:center;color:var(--text-muted);">Загрузка…</div>';
      loadMoreBtn.style.display = 'none';
    }
    loadMoreBtn.textContent = 'Загрузка…';
    try {
      const res = await fetch('/api/feed?page=' + p);
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      totalPages = Math.max(1, data.pages || 1);
      page = data.page || p;
      if (p === 1) body.innerHTML = '';
      if (items.length === 0 && p === 1) {
        var errHtml = data.error ? '<p style="margin-top:1rem;font-size:0.8125rem;color:#dc2626;">Ошибка: ' + String(data.error).substring(0, 300) + '</p>' : '';
        body.innerHTML = '<div class="feed-empty"><p>В ленте пока нет публичных голосований и решений.</p><p style="margin-top:0.75rem;font-size:0.9375rem;opacity:0.9;">Создайте голосование или решение в <a href="dashboard.html">дашборде</a> и отметьте галочку <strong>«Опубликовать в ленте»</strong> при сохранении.</p><p style="margin-top:0.75rem;font-size:0.875rem;opacity:0.85;">Если раньше в ленте что-то было и пропало — зайдите в <a href="admin.html">админ-панель</a> и нажмите <strong>«Опубликовать все опросы и решения в ленту»</strong>.</p>' + errHtml + '</div>';
      } else {
        items.forEach(item => {
          try {
            body.insertAdjacentHTML('beforeend', renderCard(item));
          } catch (err) {
            console.error('renderCard', err, item);
          }
        });
      }
      if (page >= totalPages) {
        loadMoreBtn.style.display = 'none';
      } else {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.textContent = 'Загрузить ещё';
      }
    } catch (e) {
      console.error(e);
      if (p === 1) {
        body.innerHTML = '<div class="feed-empty">Не удалось загрузить ленту. <a href="javascript:location.reload()" style="color:var(--primary);">Обновить</a></div>';
      }
      loadMoreBtn.style.display = 'block';
      loadMoreBtn.textContent = 'Загрузить ещё';
    }
    loading = false;
  }

  loadMoreBtn.addEventListener('click', () => loadPage(page + 1));

  body.addEventListener('click', async function(e) {
    const likeBtn = e.target.closest('.btn-like');
    const dislikeBtn = e.target.closest('.btn-dislike');
    const showAllBtn = e.target.closest('.feed-show-all-comments');
    const sendBtn = e.target.closest('.feed-add-comment button');
    const copyBtn = e.target.closest('.btn-copy-link');
    const commentsToggle = e.target.closest('.btn-comments-toggle');

    if (likeBtn || dislikeBtn) {
      const slug = (likeBtn || dislikeBtn).dataset.slug;
      const card = body.querySelector('.feed-card[data-slug="'+slug+'"]');
      const ctype = (card && card.dataset.type) || 'poll';
      const type = likeBtn ? 'like' : 'dislike';
      const reactUrl = ctype === 'decision' ? '/api/decisions/' + slug + '/react' : '/api/polls/' + slug + '/react';
      try {
        const res = await fetch(reactUrl, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({type})
        });
        if (res.status === 401) { alert('Войдите, чтобы оценивать'); return; }
        if (res.status === 403) {
          const d = await res.json();
          if (d.blocked) { showWarningModal('Ваш аккаунт заблокирован. Действие недоступно.'); return; }
          showWarningModal(d.error || 'Ошибка'); return;
        }
        const data = await res.json();
        if (!data.ok) { alert(data.error || 'Ошибка'); return; }
        const card = body.querySelector('.feed-card[data-slug="'+slug+'"]');
        if (!card) return;
        card.querySelector('.like-count').textContent = data.likes;
        card.querySelector('.dislike-count').textContent = data.dislikes;
        const lb = card.querySelector('.btn-like');
        const db = card.querySelector('.btn-dislike');
        lb.classList.toggle('active-like', data.myReaction === 'like');
        db.classList.toggle('active-dislike', data.myReaction === 'dislike');
      } catch(e) { console.error(e); }
      return;
    }

    if (showAllBtn) {
      const slug = showAllBtn.dataset.slug;
      const ctype = showAllBtn.dataset.type || 'poll';
      const commentsUrl = ctype === 'decision' ? '/api/decisions/' + slug + '/comments' : '/api/polls/' + slug + '/comments';
      try {
        const res = await fetch(commentsUrl);
        const data = await res.json();
        const commentsDiv = body.querySelector('.feed-comments[data-slug="'+slug+'"]');
        if (!commentsDiv) return;
        const addCommentHTML = commentsDiv.querySelector('.feed-add-comment').outerHTML;
        let html = data.comments.map(c =>
          `<div class="feed-comment">
            <div class="feed-comment-avatar">${esc(c.author.split(' ').map(w=>w[0]).join('').toUpperCase())}</div>
            <div class="feed-comment-body">
              <span class="feed-comment-author">${esc(c.author)}</span>
              <span class="feed-comment-text">${esc(c.text)}</span>
              <div class="feed-comment-time">${timeAgo(c.createdAt)}</div>
            </div>
          </div>`
        ).join('');
        commentsDiv.innerHTML = html + addCommentHTML;
      } catch(e) { console.error(e); }
      return;
    }

    if (sendBtn) {
      const slug = sendBtn.dataset.slug;
      const card = body.querySelector('.feed-card[data-slug="'+slug+'"]');
      const ctype = (card && card.dataset.type) || 'poll';
      const commentsUrl = ctype === 'decision' ? '/api/decisions/' + slug + '/comments' : '/api/polls/' + slug + '/comments';
      const input = body.querySelector('.feed-add-comment input[data-slug="'+slug+'"]');
      const text = (input.value || '').trim();
      if (!text) return;
      try {
        const res = await fetch(commentsUrl, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({text})
        });
        if (res.status === 401) { alert('Войдите, чтобы комментировать'); return; }
        const data = await res.json();
        if (data.blocked) { showWarningModal('Ваш аккаунт заблокирован. Действие недоступно.'); return; }
        if (data.warning) {
          showWarningModal(data.reason || 'Комментарий отклонён', data.warningCount);
          return;
        }
        if (!data.ok) { alert(data.error || 'Ошибка'); return; }
        input.value = '';
        const commentsDiv = body.querySelector('.feed-comments[data-slug="'+slug+'"]');
        const addCommentEl = commentsDiv.querySelector('.feed-add-comment');
        const initials = data.author.split(' ').map(w=>w[0]).join('').toUpperCase();
        addCommentEl.insertAdjacentHTML('beforebegin',
          `<div class="feed-comment">
            <div class="feed-comment-avatar">${esc(initials)}</div>
            <div class="feed-comment-body">
              <span class="feed-comment-author">${esc(data.author)}</span>
              <span class="feed-comment-text">${esc(text)}</span>
              <div class="feed-comment-time">только что</div>
            </div>
          </div>`
        );
        const countLabel = body.querySelector('.feed-card[data-slug="'+slug+'"] .comment-count-label');
        if (countLabel) countLabel.textContent = parseInt(countLabel.textContent) + 1;
      } catch(e) { console.error(e); }
      return;
    }

    if (copyBtn) {
      const slug = copyBtn.dataset.slug;
      const ctype = copyBtn.dataset.type || 'poll';
      const page = ctype === 'decision' ? 'respond.html?id=' : 'vote.html?id=';
      const url = location.origin + '/' + page + slug;
      try {
        await navigator.clipboard.writeText(url);
        copyBtn.title = 'Скопировано!';
        setTimeout(() => copyBtn.title = 'Копировать ссылку', 2000);
      } catch(e) { prompt('Скопируйте ссылку:', url); }
      return;
    }

    if (commentsToggle) {
      const slug = commentsToggle.dataset.slug;
      const commentsDiv = body.querySelector('.feed-comments[data-slug="'+slug+'"]');
      if (commentsDiv) {
        commentsDiv.style.display = commentsDiv.style.display === 'none' ? '' : 'none';
      }
      return;
    }
  });

  body.addEventListener('keydown', async function(e) {
    if (e.key !== 'Enter') return;
    const input = e.target.closest('.feed-add-comment input');
    if (!input) return;
    const slug = input.dataset.slug;
    const btn = body.querySelector('.feed-add-comment button[data-slug="'+slug+'"]');
    if (btn) btn.click();
  });

  loadPage(1);
})();
