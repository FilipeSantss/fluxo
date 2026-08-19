"use strict";
/* Camada de dados: IndexedDB (com fallback em memória).
   3 tabelas: transactions, plans, payments. */
const DB = (() => {
    let dbp = null, useMem = false;
    const mem = { transactions: [], plans: [], payments: [] };

    function open() {
        if (dbp) return dbp;
        dbp = new Promise(res => {
            let req;
            try { req = indexedDB.open('fluxo_db', 2); }
            catch (e) { useMem = true; return res(null); }
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('transactions')) db.createObjectStore('transactions', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('plans')) db.createObjectStore('plans', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('payments')) db.createObjectStore('payments', { keyPath: 'key' });
            };
            req.onsuccess = () => res(req.result);
            req.onerror = () => { useMem = true; res(null); };
        });
        return dbp;
    }
    async function all(store) {
        const db = await open();
        if (useMem || !db) return mem[store].slice();
        return new Promise(res => {
            const r = db.transaction(store, 'readonly').objectStore(store).getAll();
            r.onsuccess = () => res(r.result || []);
            r.onerror = () => res([]);
        });
    }
    async function put(store, val) {
        const db = await open();
        if (useMem || !db) {
            const k = store === 'payments' ? 'key' : 'id';
            const i = mem[store].findIndex(x => x[k] === val[k]);
            i >= 0 ? mem[store][i] = val : mem[store].push(val);
            return;
        }
        return new Promise(res => {
            const t = db.transaction(store, 'readwrite');
            t.objectStore(store).put(val);
            t.oncomplete = () => res(); t.onerror = () => res();
        });
    }
    async function del(store, id) {
        const db = await open();
        if (useMem || !db) {
            const k = store === 'payments' ? 'key' : 'id';
            mem[store] = mem[store].filter(x => x[k] !== id);
            return;
        }
        return new Promise(res => {
            const t = db.transaction(store, 'readwrite');
            t.objectStore(store).delete(id);
            t.oncomplete = () => res(); t.onerror = () => res();
        });
    }
    return { all, put, del };
})();