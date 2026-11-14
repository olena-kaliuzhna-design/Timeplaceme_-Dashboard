(function () {
  const D = window.ADMIN_DATA, { icon, initTheme, lineChart, funnel, bindTips } = window.TPM;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  document.querySelectorAll('[data-icon]').forEach(n => n.innerHTML = icon(n.dataset.icon, n.dataset.icon === 'logo' ? 18 : 18));
  initTheme($('#themeBtn'));

  // Header
  const asOf = new Date(D.asOf);
  const h = asOf.getHours();
  $('#greeting').textContent = `${h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'}, ${D.admin.name}`;
  $('#asOf').textContent = `Here’s how TIMEPLACEME is doing · updated ${asOf.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`;
  $('#avatar').textContent = D.admin.initials;

  // Period switch (visual only in the prototype)
  document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
    b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
  }));

  // Kill-switch banner
  if (!D.system.queueAutoMatcher) {
    $('#systemBanner').innerHTML = `<div class="banner crit" role="alert">
      <span class="b-icon">${icon('alert', 20)}</span>
      <div><strong>Matching is paused — nobody in the queue gets offers</strong>
      <span class="muted">The queue auto-matcher was switched off in Settings. 6 people are waiting; 0 offers sent in the last 30 days.</span></div>
      <div class="b-actions"><a class="btn sm primary" href="${D.system.queueAutoMatcherSettingUrl}">Turn matching on</a><a class="btn sm" href="/backend/queue">View queue</a></div>
    </div>`;
  }

  // KPIs
  const k = D.kpis;
  const fill = Math.round(k.fillRate.taken / k.fillRate.offered * 100);
  const unmet = Math.round(k.unmetDemand.noMatch / k.unmetDemand.clicks * 100);
  const act = Math.round(k.activeUsers.active30 / k.activeUsers.total * 100);
  const tile = (o) => `<article class="card kpi ${o.hero ? 'hero' : ''}">
      <div class="label">${o.label} <span class="tip" data-tip="${esc(o.def)}" tabindex="0" aria-label="${esc(o.def)}">?</span></div>
      <div class="value num">${o.value}${o.small ? `<small>${o.small}</small>` : ''}</div>
      <div class="foot">${o.foot}</div>
    </article>`;
  $('#kpis').innerHTML = [
    tile({ hero: true, label: 'First experiences delivered', value: k.firstExperiences.value, def: k.firstExperiences.def,
      foot: `<span class="pill neutral">No comparison yet</span> the number the whole product exists for` }),
    tile({ label: 'Gifted spots taken', value: fill + '%', def: k.fillRate.def,
      foot: `${k.fillRate.taken} of ${k.fillRate.offered} spots` }),
    tile({ label: 'Demand we couldn’t serve', value: unmet + '%', def: k.unmetDemand.def,
      foot: `<span class="pill crit">${icon('alert', 12)} High</span> ${k.unmetDemand.noMatch} of ${k.unmetDemand.clicks} “Get” taps found nothing` }),
    tile({ label: 'Active guests', value: k.activeUsers.active30, small: `/ ${k.activeUsers.total}`, def: k.activeUsers.def,
      foot: `${act}% used the app in the last 30 days` })
  ].join('');

  // Attention
  $('#attnCount').textContent = `${D.attention.length} items`;
  $('#attention').innerHTML = D.attention.map(a => `<li>
      <span class="sev ${a.sev}" role="img" aria-label="${a.sev === 'crit' ? 'Critical' : a.sev === 'warn' ? 'Warning' : 'Info'}"></span>
      <div><div class="t">${esc(a.title)}</div><div class="d">${esc(a.desc)}</div></div>
      <a class="btn sm" href="${a.href}">${esc(a.action)}</a></li>`).join('');

  // Journey funnel
  funnel($('#journey'), D.journey);

  // Supply vs demand
  const sdMax = Math.max(1, ...D.cities.flatMap(c => [c.waiting, c.openSpots]));
  $('#cities').innerHTML = D.cities.map(c => {
    const gap = c.waiting - c.openSpots;
    const verdict = c.waiting && !c.openSpots ? `<span class="pill crit">${icon('alert', 12)} No supply</span>`
      : !c.waiting && c.openSpots ? `<span class="pill warn">Needs demand</span>`
      : gap > 0 ? `<span class="pill warn">Short by ${gap}</span>` : `<span class="pill good">${icon('check', 12)} Balanced</span>`;
    return `<div class="sd-row" data-tip="${esc(c.city)}: ${c.waiting} waiting · ${c.openSpots} open spots · ${c.partners} partners${c.note ? ' · ' + esc(c.note) : ''}">
      <div><div class="sd-city">${esc(c.city)}</div><div class="cell-sub">${c.partners} partner${c.partners === 1 ? '' : 's'}</div></div>
      <div class="sd-bars">
        <div class="sd-bar demand" style="width:${c.waiting / sdMax * 100}%"></div>
        <div class="sd-bar supply" style="width:${c.openSpots / sdMax * 100}%"></div>
      </div>
      <div class="sd-note">${verdict}</div></div>`;
  }).join('');

  // Growth
  const g = D.growth, start = new Date(g.startDate);
  const pts = g.impressions.map((v, i) => {
    const d = new Date(start); d.setDate(d.getDate() + i);
    return { v, label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), full: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) };
  });
  $('#impTotal').textContent = g.impressions.reduce((a, b) => a + b, 0).toLocaleString('en-GB');
  lineChart($('#impChart'), pts, { width: 360, height: 130, step: 20, unit: 'impressions', label: 'Daily experience impressions, last 30 days' });
  $('#instTotal').textContent = `${g.installsTotal} → ${g.signedIn} → ${g.registered}`;
  $('#regMeter').style.width = (g.registered / g.installsTotal * 100) + '%';
  $('#instNote').textContent = `${Math.round(g.registered / g.installsTotal * 100)}% of installs end up with an account`;

  // Partners
  const statusMap = { good: ['good', 'Healthy'], info: ['info', 'Upcoming'], crit: ['crit', 'At risk'], neutral: ['neutral', 'Not started'] };
  const fmt = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';
  $('#partners').innerHTML = D.partners.map(p => {
    const [cls, txt] = statusMap[p.status];
    return `<tr><td><div class="cell-title">${esc(p.name)}</div><div class="cell-sub">${esc(p.city)}</div></td>
      <td class="r num">${p.offered}</td><td class="r num">${p.taken}</td><td class="r num">${p.attended}</td>
      <td>${fmt(p.next)}</td><td><span class="pill ${cls}">${txt}</span></td></tr>`;
  }).join('');

  // Upcoming
  $('#upcoming').innerHTML = D.upcoming.map(e => {
    const d = new Date(e.date), free = e.total - e.taken - (e.paused || 0);
    return `<div class="event">
      <div class="date-badge"><b>${d.getDate()}</b><span>${d.toLocaleDateString('en-GB', { month: 'short' })}</span></div>
      <div><div class="cell-title">${esc(e.title)}</div><div class="cell-sub">${esc(e.partner)} · ${esc(e.city)}</div></div>
      <span class="pill ${free > 0 ? 'warn' : 'good'}">${e.taken}/${e.total} taken</span></div>`;
  }).join('');

  bindTips(document);
})();
