export const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const uuid = () => (crypto.randomUUID?.() || 'id-'+Math.random().toString(36).slice(2)+Date.now());
export const today = () => new Date().toLocaleDateString('en-CA');
export const dateOf = (n=0) => { const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const niceDate = (d, opts={month:'short',day:'numeric',year:'numeric'}) => d ? new Date(d+'T12:00:00').toLocaleDateString('en-US',opts) : '—';
export const money = (n, cur='USD', decimals=0) => { try { return new Intl.NumberFormat('en-US', {style:'currency',currency:cur||'USD',minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(Number(n)||0); } catch {return `${cur} ${Number(n||0).toFixed(decimals)}`;} };
export const shortMoney = (n,c='USD') => { const x=Number(n)||0; const s=Math.abs(x)>=1000000? `${(x/1000000).toFixed(2)}M`:Math.abs(x)>=1000?`${(x/1000).toFixed(1)}K`:x.toFixed(0); return `${c==='INR'?'₹':'$'}${s}`; };
export const signed = (x,c='USD') => `${x>=0?'+':'−'}${money(Math.abs(x),c)}`;
export const pct = (v,d=1) => `${(Number(v)||0).toFixed(d)}%`;
export const clamp = (x,min,max)=>Math.min(max,Math.max(min,x));
export const sum = (items, fn=v=>v) => items.reduce((a,v)=>a+(Number(fn(v))||0),0);
export const avg = (items, fn=v=>v) => items.length?sum(items,fn)/items.length:0;
export const byDateDesc=(a,b)=> (b.date||'').localeCompare(a.date||'') || (b.createdAt||'').localeCompare(a.createdAt||'');
export const palette = { blue:'#6776f4',purple:'#a47cf4',green:'#11a888',red:'#e06b7b',ink:'#19223c' };
export function safeJsonParse(str, fallback=null) {if(str===null || str===undefined || str==='') return fallback;try {return JSON.parse(str)??fallback} catch {return fallback}}
export function toast(msg, type='success') { const wrap=document.querySelector('#toasts'); if (!wrap) return; const el=document.createElement('div'); el.className=`toast toast-${type}`;el.textContent=msg;wrap.append(el);setTimeout(()=>{el.classList.add('leaving');setTimeout(()=>el.remove(),400)},3400); }
export function formatNumber(n, digits=0){ return new Intl.NumberFormat('en-US',{maximumFractionDigits:digits}).format(Number(n)||0); }
export function download(name,text,type='application/json') { const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000); }
