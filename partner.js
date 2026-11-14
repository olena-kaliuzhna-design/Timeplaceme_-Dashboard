(function () {
  const D = window.PARTNER_DATA, { icon, initTheme, lineChart, bindTips } = window.TPM;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '—';

  document.querySelectorAll('[data-icon]').forEach(n => n.innerHTML = icon(n.dataset.icon, 18));
  initTheme($('#themeBtn'));

  // Demo state switch
  function setState(s) {
    $('#stateNew').hidden = s !== 'new';
    $('#stateActive').hidden = s !== 'active';
    document.querySelectorAll('[data-state]').forEach(b => b.setAttribute('aria-pressed', b.dataset.state === s));
  }
  document.querySelectorAll('[data-state]').forEach(b => b.addEventListener('click', () => setState(b.dataset.state)));
  document.querySelectorAll('#stateActive .seg button').forEach(b => b.addEventListener('click', () =>
    b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b))));

  /* ---------- New partner ---------- */
  const N = D.newPartner;
  const done = N.steps.filter(s => s.done).length;
  const currentIdx = N.steps.findIndex(s => !s.done);
  $('#newHello').textContent = `Welcome, ${N.name}`;
  $('#newMeter').style.width = (done / N.steps.length * 100) + '%';
  $('#newProgress').textContent = `${done} of ${N.steps.length} done`;
  $('#newSteps').innerHTML = N.steps.map((s, i) => `<li class="step ${s.done ? 'done' : ''} ${i === currentIdx ? 'current' : ''}">
      <span class="n">${s.done ? icon('check', 16) : i + 1}</span>
      <div><div class="cell-title st">${esc(s.title)}</div><div class="cell-sub">${esc(s.desc)}</div></div>
      ${i === currentIdx ? `<a class="btn primary sm" href="${s.href}">Publish now</a>` : `<a class="btn sm" href="${s.href}">${s.done ? 'Edit' : 'Start'}</a>`}
    </li>`).join('');
  $('#newDemand').innerHTML = `<div class="card-head"><h2>Waiting near you</h2></div>
    <div class="kpi"><div class="value num">${N.demandNearby.waiting}</div>
    <div class="foot">people in ${esc(N.demandNearby.city)} want a first ${esc(N.demandNearby.topCategory)} experience. Publish and we’ll offer yours first.</div></div>`;

  /* ---------- Active partner ---------- */
  const A = D.active, K = A.kpis;
  $('#actHello').textContent = `Hi, ${A.name}`;
  $('#actSub').textContent = `${A.business} · ${A.city} · here’s what gifting brought you in the last ${A.period}`;
  const delta = (v, p) => {
    if (p == null) return '';
    const d = Math.round((v - p) / p * 100);
    return `<span class="delta ${d > 0 ? 'up' : d < 0 ? 'down' : 'flat'}">${d > 0 ? '▲' : d < 0 ? '▼' : '■'} ${Math.abs(d)}%</span>`;
  };
  const att = Math.round(K.arrived.value / K.taken.value * 100);
  $('#pKpis').innerHTML = [
    `<article class="card kpi hero"><div class="label">First-time guests who came</div><div class="value num">${K.arrived.value}</div><div class="foot">${delta(K.arrived.value, K.arrived.prev)} vs previous 30 days</div></article>`,
    `<article class="card kpi"><div class="label">Spots you gifted</div><div class="value num">${K.gifted.value}</div><div class="foot">${K.taken.value} taken · ${Math.round(K.taken.value / K.gifted.value * 100)}% fill rate</div></article>`,
    `<article class="card kpi"><div class="label">Showed up</div><div class="value num">${att}%</div><div class="foot">${K.noShow.value} no-shows of ${K.taken.value} taken spots</div></article>`,
    `<article class="card kpi"><div class="label">Came back <span class="tip" tabindex="0" data-tip="${esc(K.returning.def)}" aria-label="${esc(K.returning.def)}">?</span></div><div class="value num">${K.returning.value}</div><div class="foot">first-timers who became guests</div></article>`
  ].join('');

  // Tonight
  const expected = A.today.filter(g => g.status === 'expected').length;
  $('#todaySub').textContent = `${A.today.length} guests · ${expected} still to arrive`;
  $('#navToday').textContent = expected;
  function renderToday() {
    $('#today').innerHTML = A.today.map((g, i) => `<tr>
      <td class="cell-title">${esc(g.name)}</td>
      <td><div>${esc(g.experience)}</div><div class="cell-sub">${g.time}</div></td>
      <td class="r num">${g.seats}</td><td><code>${g.code}</code></td>
      <td>${g.status === 'arrived' ? `<span class="pill good">${icon('check', 12)} Arrived</span>` : g.status === 'noshow' ? '<span class="pill crit">No-show</span>' : '<span class="pill info">Expected</span>'}</td>
      <td class="r">${g.status === 'expected' ? `<button class="btn sm" data-arrive="${i}">Mark arrived</button>` : ''}</td></tr>`).join('');
    document.querySelectorAll('[data-arrive]').forEach(b => b.addEventListener('click', () => { A.today[b.dataset.arrive].status = 'arrived'; renderToday(); }));
  }
  renderToday();
  $('#codeForm').addEventListener('submit', e => {
    e.preventDefault();
    const code = $('#code').value.trim().toUpperCase();
    const g = A.today.find(x => x.code === code);
    if (!g) { $('#codeMsg').textContent = `No guest with code “${code}” tonight. Check the code or the date.`; return; }
    if (g.status === 'arrived') { $('#codeMsg').textContent = `${g.name} is already checked in.`; return; }
    g.status = 'arrived'; $('#codeMsg').textContent = `✓ ${g.name} checked in — ${g.seats} seat${g.seats > 1 ? 's' : ''}. Enjoy the evening!`;
    $('#code').value = ''; renderToday();
  });

  // Nudges
  $('#nudges').innerHTML = `<div class="card-head"><h2>Suggestions from Cris</h2></div>` + A.nudges.map(n => `
    <div style="padding:10px 0;border-top:1px solid var(--border)">
      <div class="cell-title">${esc(n.title)}</div><div class="cell-sub" style="margin:2px 0 8px">${esc(n.desc)}</div>
      <a class="btn sm" href="${n.href}">${esc(n.action)}</a></div>`).join('');

  // Experiences
  $('#exps').innerHTML = A.experiences.map(x => `<tr>
    <td class="cell-title">${esc(x.title)}</td><td>${fmtDate(x.date)}</td>
    <td style="min-width:140px"><div class="meter" aria-hidden="true"><span style="width:${x.taken / x.total * 100}%"></span></div><div class="cell-sub num">${x.taken} of ${x.total}</div></td>
    <td class="r num">${x.arrived}</td>
    <td>${x.status === 'live' ? (x.taken === 0 ? '<span class="pill warn">Live · no takers</span>' : '<span class="pill good">Live</span>') : '<span class="pill neutral">Draft</span>'}</td></tr>`).join('');

  // Feedback + reach
  $('#woofCount').textContent = `${A.feedback.woofs} Woofs`;
  $('#woofAvg').innerHTML = `${A.feedback.avg}<small>/ 5</small>`;
  $('#liked').innerHTML = A.feedback.liked.map(t => `<span class="tag">${esc(t)}</span>`).join('');
  $('#reachTotal').textContent = `${A.reachDaily.reduce((a, b) => a + b, 0).toLocaleString('en-GB')} views`;
  const start = new Date(A.startDate);
  lineChart($('#reachChart'), A.reachDaily.map((v, i) => { const d = new Date(start); d.setDate(d.getDate() + i);
    return { v, label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }; }),
    { width: 360, height: 120, step: 20, unit: 'views', label: 'Daily views of your experiences' });

  bindTips(document);
  setState('active');
})();
