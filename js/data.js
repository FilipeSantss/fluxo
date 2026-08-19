"use strict";
/* Categorias, estado em memória e os cálculos (regras do app).
   LANÇAMENTO e PLANEJAMENTO são independentes: um nunca afeta o outro. */

// ----- Categorias -----
const CATS = {
    'Mercado': { emoji: '🛒', color: '#B14EFF' },
    'Transporte': { emoji: '🚗', color: '#22D3EE' },
    'Lazer': { emoji: '🎮', color: '#FF4D8D' },
    'Contas': { emoji: '📄', color: '#FFB020' },
    'Moradia': { emoji: '🏠', color: '#7C6BFF' },
    'Saúde': { emoji: '💊', color: '#34F5C5' },
    'Salário': { emoji: '💰', color: '#34F5C5' },
    'Investimento': { emoji: '📈', color: '#22D3EE' },
    'Outros': { emoji: '✨', color: '#7A7A8C' }
};
const OUT_CATS = ['Mercado', 'Transporte', 'Lazer', 'Contas', 'Moradia', 'Saúde', 'Outros'];
const IN_CATS = ['Salário', 'Investimento', 'Outros'];

// ----- Estado -----
let TX = [], PLANS = [], PAID = new Set();
let sheetType = 'out', sheetCat = 'Mercado';
let pType = 'out', pCat = 'Mercado', pRecur = 'once';
let activeLeg = null, openMonths = {}, currentTab = 'inicio';
let viewYM = curYM;

// ----- Regras: LANÇAMENTOS (dados reais) -----
function monthTx(k) { return TX.filter(t => ymOf(t.date) === k); }
function totals(list) {
    const i = sum(list.filter(t => t.type === 'in'));
    const o = sum(list.filter(t => t.type === 'out'));
    return { in: i, out: o, bal: i - o };
}
function byCat(list) {
    const m = {};
    list.filter(t => t.type === 'out').forEach(t => m[t.cat] = (m[t.cat] || 0) + t.val);
    return Object.entries(m)
        .map(([cat, val]) => ({ cat, val, ...(CATS[cat] || CATS.Outros) }))
        .sort((a, b) => b.val - a.val);
}
function realSeries() { // evolução do saldo real (gráfico do Início)
    const start = ymAdd(curYM, -7);
    let bal = sum(TX.filter(t => ymOf(t.date) < start && t.type === 'in'))
        - sum(TX.filter(t => ymOf(t.date) < start && t.type === 'out'));
    const months = [];
    for (let i = 0; i < 8; i++) { const k = ymAdd(start, i); bal += totals(monthTx(k)).bal; months.push({ key: k, balance: bal }); }
    return months;
}

// ----- Regras: PLANEJAMENTO (independente, sem saldo acumulado) -----
function occDate(startISO, k) {
    const day = Number(startISO.slice(8, 10));
    const [y, m] = k.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    return k + '-' + String(Math.min(day, last)).padStart(2, '0');
}
function planHits(p, k) {
    const s = ymOf(p.startDate);
    if (k < s) return false;
    if (p.recur === 'once') return k === s;
    if (p.endDate) return k <= ymOf(p.endDate);
    return true;
}
function projectPlans() {
    const months = [];
    let totalIn = 0, totalOut = 0, pending = 0;
    for (let i = 0; i < 12; i++) {
        const k = ymAdd(curYM, i), items = [];
        PLANS.forEach(p => {
            if (!planHits(p, k)) return;
            const pkey = p.id + '__' + k, paid = PAID.has(pkey);
            items.push({ planId: p.id, desc: p.desc, cat: p.cat, val: p.val, type: p.type, date: occDate(p.startDate, k), pkey, paid });
            if (p.type === 'in') totalIn += p.val;
            else { totalOut += p.val; if (!paid) pending += p.val; }
        });
        months.push({
            key: k,
            in: sum(items.filter(x => x.type === 'in')),
            out: sum(items.filter(x => x.type === 'out')),
            items
        });
    }
    return { months, totalIn, totalOut, pending };
}