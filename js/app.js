"use strict";
/* Ações que alteram dados (adicionar/excluir/pagar), inicialização e service worker. */

function parseVal(id) { const raw = $(id).value.replace(/\./g, '').replace(',', '.'); return parseFloat(raw); }

async function addTx() {
    const val = parseVal('fVal'); if (!val || val <= 0) { toast('Informe um valor válido'); return; }
    const desc = $('fDesc').value.trim() || sheetCat;
    const date = $('fDate').value || todayISO();
    const item = { id: Date.now(), type: sheetType, desc, cat: sheetCat, val, date };
    await DB.put('transactions', item);
    TX.push(item); activeLeg = null; viewYM = ymOf(date);
    render(); closeSheets();
    toast((sheetType === 'in' ? 'Entrada' : 'Saída') + ' de R$ ' + brl(val) + ' registrada');
}
async function delTx(id) {
    const t = TX.find(x => x.id === id); if (!t) return;
    const ok = await confirmDelete(`"${t.desc}" (R$ ${brl(t.val)}) será removido dos lançamentos. Isso não afeta o planejamento.`);
    if (!ok) return;
    await DB.del('transactions', id);
    TX = TX.filter(x => x.id !== id);
    render(); toast('Lançamento removido');
}
async function addPlan() {
    const val = parseVal('pVal'); if (!val || val <= 0) { toast('Informe um valor válido'); return; }
    const desc = $('pDesc').value.trim() || pCat;
    const startDate = $('pDate').value || todayISO();
    let endDate = null;
    if (pRecur === 'monthly') {
        endDate = $('pEnd').value || null;
        if (!endDate) { toast('Informe a data fim'); return; }
        if (ymOf(endDate) < ymOf(startDate)) { toast('A data fim deve ser depois do início'); return; }
    }
    const item = { id: Date.now(), type: pType, desc, cat: pCat, val, startDate, recur: pRecur, endDate };
    await DB.put('plans', item);
    PLANS.push(item);
    render(); closeSheets();
    toast(pRecur === 'monthly'
        ? `Planejado de ${ddmm(startDate)} até ${ymShort(ymOf(endDate))} ✨`
        : 'Planejado na linha do tempo ✨');
}
async function delPlan(id) {
    const p = PLANS.find(x => x.id === id); if (!p) return;
    const ok = await confirmDelete(`"${p.desc}" e todas as ocorrências futuras saem do planejamento. Seus lançamentos reais não são afetados.`);
    if (!ok) return;
    for (const k of [...PAID].filter(k => k.startsWith(id + '__'))) { PAID.delete(k); await DB.del('payments', k); }
    PLANS = PLANS.filter(x => x.id !== id);
    await DB.del('plans', id);
    render(); toast('Planejamento excluído');
}
async function togglePaid(pkey) {
    if (PAID.has(pkey)) { PAID.delete(pkey); await DB.del('payments', pkey); toast('Marcado como pendente'); }
    else { PAID.add(pkey); await DB.put('payments', { key: pkey, paidAt: todayISO() }); toast('Pago ✓'); }
    renderTimeline();
}

// máscara de valor (R$) nos dois formulários
['fVal', 'pVal'].forEach(id => $(id).addEventListener('input', e => {
    const v = e.target.value.replace(/\D/g, '');
    e.target.value = v ? (parseInt(v, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
}));

// inicialização
async function boot() {
    TX = await DB.all('transactions');
    PLANS = await DB.all('plans');
    PAID = new Set((await DB.all('payments')).map(p => p.key));
    $('fDate').value = todayISO();
    $('pDate').value = todayISO();
    render();
}
boot();

// service worker (offline + atualização automática)
if ('serviceWorker' in navigator) {
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloaded) { reloaded = true; location.reload(); }
    });
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
            reg.addEventListener('updatefound', () => {
                const nw = reg.installing;
                if (nw) nw.addEventListener('statechange', () => {
                    if (nw.state === 'installed' && navigator.serviceWorker.controller) nw.postMessage('skipWaiting');
                });
            });
        }).catch(() => { });
    });
}