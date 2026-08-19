"use strict";
/* Tudo que desenha na tela e reage a toques: render, abas, sheets, confirmação, toast. */

function render() {
    $('monthLabel').textContent = ymFull(viewYM).toUpperCase();
    const list = monthTx(viewYM), t = totals(list), b = splitBRL(t.bal);
    $('balanceAmt').innerHTML = `<span>${t.bal < 0 ? '-' : ''}R$ ${b.int}</span><span class="cents">,${b.cents}</span>`;

    const prev = totals(monthTx(ymAdd(viewYM, -1))), chip = $('balanceChip');
    if (prev.bal !== 0) {
        const d = Math.round((t.bal - prev.bal) / Math.abs(prev.bal) * 100);
        chip.textContent = (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d) + '%';
        chip.className = 'chip' + (d >= 0 ? '' : ' neg');
        $('balanceCmp').textContent = 'vs. mês anterior';
    } else {
        chip.textContent = '—'; chip.className = 'chip';
        $('balanceCmp').textContent = 'sem base anterior';
    }

    $('inAmt').textContent = 'R$ ' + brl(t.in);
    $('outAmt').textContent = 'R$ ' + brl(t.out);

    renderSpark();
    renderCats(list);
    renderList('recentList', list.slice().sort(byDateDesc).slice(0, 4), false);
    renderList('fullList', list.slice().sort(byDateDesc), true);
    $('txCount').textContent = list.length + ' itens';
    renderBars(list);
    renderTimeline();
}

function renderSpark() {
    const pts = realSeries().map(m => m.balance);
    const min = Math.min(...pts, 0), max = Math.max(...pts, 0), rng = (max - min) || 1;
    const W = 300, H = 44, P = 4;
    const co = pts.map((p, i) => [P + (i / (pts.length - 1)) * (W - 2 * P), H - P - ((p - min) / rng) * (H - 2 * P)]);
    const line = co.map((c, i) => (i ? 'L' : 'M') + c[0].toFixed(1) + ' ' + c[1].toFixed(1)).join(' ');
    $('sparkSvg').innerHTML =
        `<defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#22D3EE" stop-opacity=".35"/><stop offset="100%" stop-color="#22D3EE" stop-opacity="0"/></linearGradient></defs>
     <path d="${line} L${W - P} ${H} L${P} ${H} Z" fill="url(#sg)"/>
     <path d="${line}" fill="none" stroke="#22D3EE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
     <circle cx="${co[co.length - 1][0].toFixed(1)}" cy="${co[co.length - 1][1].toFixed(1)}" r="3.5" fill="#22D3EE"/>`;
    $('sparkEnd').textContent = 'hoje R$ ' + brl(pts[pts.length - 1]);
}

function renderCats(list) {
    const data = byCat(list), total = sum(data), wrap = $('catsWrap');
    if (!data.length) { wrap.innerHTML = `<div class="cats"><div class="empty" style="width:100%"><div class="em">📊</div><p>Sem gastos neste mês ainda.</p></div></div>`; return; }
    const R = 54, C = 66, circ = 2 * Math.PI * R;
    let off = 0, svg = `<circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="#1D1D2B" stroke-width="16"/>`;
    data.forEach((d, i) => {
        const len = d.val / total * circ, dim = (activeLeg !== null && activeLeg !== i);
        svg += `<circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="${d.color}" stroke-width="16" stroke-dasharray="${len} ${circ - len}" stroke-dashoffset="${-off}" opacity="${dim ? .25 : 1}" style="transition:opacity .2s"/>`;
        off += len;
    });
    const show = activeLeg !== null ? data[activeLeg] : data[0];
    wrap.innerHTML =
        `<div class="cats">
      <div class="donut">
        <svg width="132" height="132" viewBox="0 0 132 132" style="transform:rotate(-90deg)">${svg}</svg>
        <div class="center"><div class="pct">${Math.round(show.val / total * 100)}%</div><div class="nm">${esc(show.cat)}</div></div>
      </div>
      <div class="legend">${data.map((d, i) => `
        <div class="leg ${activeLeg === i ? 'active' : ''} ${activeLeg !== null && activeLeg !== i ? 'dim' : ''}" onclick="toggleLeg(${i})">
          <span class="ld" style="background:${d.color}"></span>
          <span class="ln">${d.emoji} ${esc(d.cat)}</span>
          <span class="lv">R$ ${brl(d.val)}</span>
        </div>`).join('')}
      </div>
    </div>`;
}
function toggleLeg(i) { activeLeg = (activeLeg === i) ? null : i; renderCats(monthTx(viewYM)); }

function renderList(elId, items, deletable) {
    const el = $(elId);
    if (!items.length) { el.innerHTML = `<div class="empty"><div class="em">🌙</div><p>Nenhum lançamento em ${ymFull(viewYM).toLowerCase()}.<br>Toque no <b>+</b> pra registrar.</p></div>`; return; }
    el.innerHTML = items.map(t => {
        const c = CATS[t.cat] || CATS.Outros;
        return `<div class="tx" data-id="${t.id}" ${deletable ? 'onclick="toggleDel(this)"' : ''}>
      <div class="ic">${c.emoji}</div>
      <div class="mid"><div class="nm">${esc(t.desc)}</div><div class="meta">${esc(t.cat)} · ${ddmm(t.date)}</div></div>
      <div class="amt ${t.type}">${t.type === 'in' ? '+' : '−'} R$ ${brl(t.val)}</div>
      ${deletable ? `<button class="del" onclick="event.stopPropagation();delTx(${t.id})">✕</button>` : ''}
    </div>`;
    }).join('');
}
function toggleDel(row) {
    const was = row.classList.contains('show-del');
    document.querySelectorAll('.tx.show-del').forEach(r => r.classList.remove('show-del'));
    if (!was) row.classList.add('show-del');
}

function renderBars(list) {
    const data = byCat(list), max = Math.max(...data.map(d => d.val), 1), total = sum(data);
    $('catTotal').textContent = 'R$ ' + brl(total);
    const el = $('catBars');
    if (!data.length) { el.innerHTML = `<div class="bars"><div class="empty"><div class="em">📊</div><p>Sem gastos neste mês.</p></div></div>`; return; }
    el.innerHTML = `<div class="bars">${data.map(d => `
    <div class="bar-row">
      <div class="h"><span>${d.emoji} ${esc(d.cat)}</span><span class="val">R$ ${brl(d.val)}</span></div>
      <div class="track"><div class="fill" style="background:${d.color}" data-w="${(d.val / max * 100).toFixed(1)}"></div></div>
    </div>`).join('')}</div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => el.querySelectorAll('.fill').forEach(f => f.style.width = f.dataset.w + '%')));
}

function renderTimeline() {
    const { months } = projectPlans();
   
    renderPlanList();

    $('tlMonths').innerHTML = months.map(m => {
        const op = openMonths[m.key] ? 'open' : '';
        const pendVal = m.items.filter(x => x.type === 'out' && !x.paid).reduce((s, x) => s + x.val, 0);
        const paidCount = m.items.filter(x => x.paid).length;
        const summary = m.items.length
            ? `<div class="pay-sum"><span>${m.items.length} item(ns) · ${paidCount} pago(s)</span><span class="${pendVal > 0 ? 'pend' : 'done'}">${pendVal > 0 ? 'falta R$ ' + brl(pendVal) : 'tudo pago ✓'}</span></div>`
            : '';
        const items = m.items.length
            ? m.items.map(it => {
                const c = CATS[it.cat] || CATS.Outros;
                return `<div class="bi ${it.paid ? 'is-paid' : ''}">
            <div class="bic">${c.emoji}</div>
            <div class="bn">${esc(it.desc)} <span style="color:var(--muted-2);font-family:var(--mono);font-size:10px">· ${ddmm(it.date)}</span></div>
            <span class="stat-pill ${it.paid ? 'paid' : ''}" onclick="event.stopPropagation();togglePaid('${it.pkey}')">${it.paid ? '✓ Pago' : 'Pendente'}</span>
            <div class="bv ${it.type}">${it.type === 'in' ? '+' : '−'} R$ ${brl(it.val)}</div>
          </div>`;
            }).join('')
            : `<div class="empty" style="padding:16px"><p>Nada planejado neste mês.</p></div>`;
        return `<div class="mrow ${op}">

         <div class="head" onclick="toggleMonth('${m.key}')">
        <div class="mo">${ymShort(m.key)}</div>
        <div class="flow"><span class="i">+${brl(m.in)}</span><span class="o">−${brl(m.out)}</span></div>
        <div class="mbal">${m.in - m.out < 0 ? '−' : ''}R$ ${brl(m.in - m.out)}</div>
        <div class="chev">▶</div>
      </div>
      <div class="body"><div class="body-in">${summary}${items}</div></div>
    </div>`;
    }).join('');
}
function toggleMonth(k) { openMonths[k] = !openMonths[k]; renderTimeline(); }

function planPeriodText(p) {
    const dd = p.startDate.slice(8, 10) + '/' + p.startDate.slice(5, 7) + '/' + p.startDate.slice(0, 4);
    if (p.recur === 'once') return 'Uma vez · ' + dd;
    const fim = p.endDate ? ymShort(ymOf(p.endDate)) : 'sem fim';
    return 'Todo dia ' + p.startDate.slice(8, 10) + ' · ' + ymShort(ymOf(p.startDate)) + ' → ' + fim;
}
function renderPlanList() {
    const el = $('planList');
    if (!PLANS.length) { el.innerHTML = `<div class="empty" style="padding:26px 20px"><div class="em">🗓️</div><p>Nenhum planejamento ainda.<br>Toque em <b>＋ novo</b> para criar.</p></div>`; return; }
    el.innerHTML = PLANS.slice().sort((a, b) => a.startDate.localeCompare(b.startDate)).map(p => {
        const c = CATS[p.cat] || CATS.Outros;
        return `<div class="prow">
      <div class="ic">${c.emoji}</div>
      <div class="mid"><div class="nm">${esc(p.desc)}</div><div class="meta">${planPeriodText(p)}</div></div>
      <div class="pv ${p.type}">${p.type === 'in' ? '+' : '−'} R$ ${brl(p.val)}</div>
      <button class="pdel" onclick="delPlan(${p.id})" aria-label="Excluir">🗑️</button>
    </div>`;
    }).join('');
}

// ----- Navegação e formulários -----
function go(tab) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $('view-' + tab).classList.add('active');
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    $('monthNav').style.display = (tab === 'timeline' || tab === 'planos') ? 'none' : 'flex';
    currentTab = tab;
    document.querySelector('.scroll').scrollTo({ top: 0, behavior: 'smooth' });
}
function changeMonth(d) { viewYM = ymAdd(viewYM, d); activeLeg = null; render(); }
function fabAction() { currentTab === 'timeline' ? openPlan() : openSheet(); }

function openSheet() {
    $('backdrop').classList.add('open'); $('sheet').classList.add('open');
    setType('out'); $('fVal').value = ''; $('fDesc').value = ''; $('fDate').value = todayISO();
    setTimeout(() => $('fVal').focus(), 300);
}
function openPlan() {
    go('planos');
    $('backdrop').classList.add('open'); $('sheetPlan').classList.add('open');
    setPType('out'); setRecur('once');
    $('pVal').value = ''; $('pDesc').value = ''; $('pEnd').value = ''; $('pDate').value = todayISO();
    setTimeout(() => $('pVal').focus(), 300);
}
function closeSheets() {
    $('backdrop').classList.remove('open'); $('sheet').classList.remove('open'); $('sheetPlan').classList.remove('open');
}
function setType(t) {
    sheetType = t;
    $('segOut').className = t === 'out' ? 'on-out' : '';
    $('segIn').className = t === 'in' ? 'on-in' : '';
    fillCats('catPick', t, c => { sheetCat = c; }, () => sheetCat);
}
function setPType(t) {
    pType = t;
    $('psegOut').className = t === 'out' ? 'on-out' : '';
    $('psegIn').className = t === 'in' ? 'on-in' : '';
    fillCats('pCatPick', t, c => { pCat = c; }, () => pCat);
}
function fillCats(elId, type, set, get) {
    const listc = type === 'out' ? OUT_CATS : IN_CATS; set(listc[0]);
    $(elId).innerHTML = listc.map(c => `<button class="${c === get() ? 'sel' : ''}" data-c="${c}">${CATS[c].emoji} ${c}</button>`).join('');
    document.querySelectorAll('#' + elId + ' button').forEach(b => b.onclick = () => {
        set(b.dataset.c);
        document.querySelectorAll('#' + elId + ' button').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
    });
}
function setRecur(r) {
    pRecur = r;
    $('rOnce').className = r === 'once' ? 'sel' : '';
    $('rMonthly').className = r === 'monthly' ? 'sel' : '';
    $('endWrap').className = 'count-wrap' + (r === 'monthly' ? ' show' : '');
}

// ----- Modal de confirmação e toast -----
let _cfResolve = null;
function confirmDelete(msg) {
    return new Promise(res => {
        _cfResolve = res;
        $('cfMsg').textContent = msg;
        $('cfBack').classList.add('open');
        $('cfBox').classList.add('open');
    });
}
function cfResolve(v) {
    $('cfBack').classList.remove('open');
    $('cfBox').classList.remove('open');
    const r = _cfResolve; _cfResolve = null;
    if (r) r(v);
}

let toastT;
function toast(msg) {
    $('toastMsg').textContent = msg;
    $('toast').classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => $('toast').classList.remove('show'), 2200);
}