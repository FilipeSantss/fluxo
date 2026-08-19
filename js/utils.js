"use strict";
/* Utilidades puras: seleção de elemento, datas e formatação. */
const $ = id => document.getElementById(id);

const MESES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
const MCURTO = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const now = new Date();
const curYM = ym(now.getFullYear(), now.getMonth() + 1);

function ym(y, m) { return y + '-' + String(m).padStart(2, '0'); }
function todayISO() { const p = n => String(n).padStart(2, '0'); return now.getFullYear() + '-' + p(now.getMonth() + 1) + '-' + p(now.getDate()); }
function ymOf(iso) { return iso.slice(0, 7); }
function ymAdd(k, n) { let [y, m] = k.split('-').map(Number); const idx = y * 12 + (m - 1) + n; return ym(Math.floor(idx / 12), idx % 12 + 1); }
function ymFull(k) { const [y, m] = k.split('-').map(Number); return MESES[m - 1] + ' ' + y; }
function ymShort(k) { const [y, m] = k.split('-').map(Number); return MCURTO[m - 1] + '/' + String(y).slice(2); }
function ddmm(iso) { return iso.slice(8, 10) + '/' + iso.slice(5, 7); }

const brl = v => Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function splitBRL(v) { const s = brl(v).split(','); return { int: s[0], cents: s[1] }; }
const sum = a => a.reduce((s, t) => s + t.val, 0);
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function byDateDesc(a, b) { return b.date.localeCompare(a.date) || b.id - a.id; }