/** PP Trading Journey: data-driven performance certificates. No external service. */
import {esc, money, sum} from './utils.js';

const ISO = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fromISO = (s) => new Date(`${s}T12:00:00`);
const addDays = (d, n) => {const x=new Date(d); x.setDate(x.getDate()+n); return x;};
const dayEnd = (d) => ISO(d);

export function periodRange(type, current=new Date(), shift=0){
  const d=new Date(current);d.setHours(12,0,0,0);
  if(type==='daily') {d.setDate(d.getDate()+shift); return {type,start:ISO(d),end:ISO(d)};}
  if(type==='weekly') {d.setDate(d.getDate()-((d.getDay()+6)%7)+7*shift);return {type,start:ISO(d),end:dayEnd(addDays(d,6))};}
  if(type==='monthly') {d.setMonth(d.getMonth()+shift,1);return {type,start:ISO(d),end:ISO(new Date(d.getFullYear(),d.getMonth()+1,0))};}
  d.setMonth(0,1);d.setFullYear(d.getFullYear()+shift);return {type:'yearly',start:ISO(d),end:ISO(new Date(d.getFullYear(),11,31))};
}

export function certificateData(w, account, type, start, end){
  if(!account)return null;
  const trades=w.trades.filter(t=>t.accountId===account.id && t.date>=start && t.date<=end).sort((a,b)=>a.date.localeCompare(b.date)||String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
  const net=sum(trades,t=>Number(t.result||0)-Number(t.fees||0));
  const winners=trades.filter(t=>Number(t.result||0)-Number(t.fees||0)>0).length;
  const winRate=trades.length?winners/trades.length*100:0;
  const positive=net>0,negative=net<0;
  const greeting=!trades.length?'Your journey continues.':positive?'Congratulations!':negative?'Better luck next time.':'Steady progress.';
  const motivation=!trades.length?'Every great journey starts with one recorded decision.':
    positive && winRate>=65?'Consistency is becoming your greatest advantage.':
    positive?'Small edges, repeated with patience, create progress.':
    negative?'A difficult chapter can still teach a powerful lesson.':
    'Showing up with discipline is progress in itself.';
  const timestamps=trades.map(t=>({date:t.date,value:Number(t.result||0)-Number(t.fees||0)}));
  return {type,start,end,accountId:account.id,accountName:account.name,name:String(w.profile?.name||'Trader'),currency:account.currency||'USD',trades:trades.length,net,winRate,winners,positive,negative,greeting,motivation,timestamps,completed:end<ISO(new Date())};
}

const displayDate=(s)=>fromISO(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
export const certificateRangeLabel=(d)=>d.start===d.end?displayDate(d.start):`${displayDate(d.start)} — ${displayDate(d.end)}`;
const TYPES={daily:'DAILY',weekly:'WEEKLY',monthly:'MONTHLY',yearly:'YEARLY'};
function safeId(s){return s.replace(/[^a-z0-9_-]/gi,'_')}
function chartLines(d){
  const points=[0,...d.timestamps.map((t,i)=>sum(d.timestamps.slice(0,i+1),x=>x.value))];
  const low=Math.min(0,...points),high=Math.max(0,...points),rng=high-low||1;
  const X=(i)=>-24+(i/Math.max(1,points.length-1))*1648;
  const Y=(v)=>690-((v-low)/rng)*370;
  return points.slice(1).map((v,i)=>({x1:X(i),y1:Y(points[i]),x2:X(i+1),y2:Y(v),up:v>=points[i]}));
}
/** Fully self-contained SVG: renders in-browser and can be exported as PNG. */
export function certificateSVG(d, {prefix='',masked=false}={}){
  const id=safeId(prefix||`${d.type}-${d.start}`);
  const tint=d.positive?'#079e73':d.negative?'#df5570':'#6475ea';
  const line=chartLines(d);
  const stroke=line.map(v=>`<line x1="${v.x1.toFixed(2)}" y1="${v.y1.toFixed(2)}" x2="${v.x2.toFixed(2)}" y2="${v.y2.toFixed(2)}" stroke="${v.up?'#20c99b':'#ef6078'}" stroke-width="24" stroke-linecap="round"/>`).join('');
  const fine=line.map(v=>`<line x1="${v.x1.toFixed(2)}" y1="${v.y1.toFixed(2)}" x2="${v.x2.toFixed(2)}" y2="${v.y2.toFixed(2)}" stroke="${v.up?'#009e75':'#d94666'}" stroke-width="8" stroke-linecap="round"/>`).join('');
  const amount=masked?'•••••':`${d.net>=0?'+':'−'}${money(Math.abs(d.net),d.currency)}`;
  const dateLabel=certificateRangeLabel(d),name=esc(d.name),account=esc(d.accountName);
  const period=esc(TYPES[d.type]||'PERFORMANCE');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="${period} performance certificate for ${name}">
  <defs><linearGradient id="base-${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fcfeff"/><stop offset=".52" stop-color="#eff7ff"/><stop offset="1" stop-color="#f3f0ff"/></linearGradient>
  <linearGradient id="card-${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".92"/><stop offset="1" stop-color="#fff" stop-opacity=".74"/></linearGradient>
  <filter id="soft-${id}" x="-30%" y="-40%" width="160%" height="180%"><feGaussianBlur stdDeviation="32"/></filter>
  <filter id="line-${id}" x="-30%" y="-40%" width="160%" height="180%"><feGaussianBlur stdDeviation="11"/></filter></defs>
  <rect width="1600" height="900" fill="url(#base-${id})"/>
  <circle cx="1320" cy="110" r="300" fill="#b6c9ff" opacity=".48" filter="url(#soft-${id})"/>
  <circle cx="230" cy="790" r="230" fill="#adf4dd" opacity=".46" filter="url(#soft-${id})"/>
  <g opacity=".13"><path d="M90 130H1510M90 290H1510M90 450H1510M90 610H1510M90 770H1510" stroke="#7990a9" stroke-width="2" stroke-dasharray="4 20"/></g>
  <g filter="url(#line-${id})" opacity=".20">${stroke}</g><g opacity=".13">${fine}</g>
  <rect x="66" y="60" width="1468" height="780" rx="46" fill="url(#card-${id})" stroke="#fff" stroke-width="5"/>
  <rect x="96" y="89" width="1408" height="722" rx="30" fill="none" stroke="#c4d4ea" stroke-opacity=".56" stroke-width="2"/>
  <rect x="140" y="136" width="70" height="70" rx="22" fill="#6874f4"/>
  <text x="175" y="183" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="31" font-weight="800" fill="white">PP</text>
  <text x="231" y="167" font-family="Arial,Helvetica,sans-serif" font-size="27" font-weight="800" fill="#172540">PP Trading Journey</text>
  <text x="232" y="192" font-family="Arial,Helvetica,sans-serif" font-size="13" letter-spacing="3.8" font-weight="700" fill="#64728f">PERSONAL PERFORMANCE</text>
  <rect x="1185" y="142" width="259" height="46" rx="23" fill="#e6edff"/>
  <text x="1314" y="173" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="800" letter-spacing="2" fill="#4355aa">${period} REPORT</text>
  <text x="800" y="285" font-family="Arial,Helvetica,sans-serif" font-size="18" text-anchor="middle" letter-spacing="5" font-weight="800" fill="#60719a">CERTIFICATE OF PROGRESS</text>
  <text x="800" y="369" font-family="Arial,Helvetica,sans-serif" font-size="54" text-anchor="middle" font-weight="800" fill="#1b2a49">${esc(d.greeting)}</text>
  <text x="800" y="430" font-family="Arial,Helvetica,sans-serif" font-size="36" text-anchor="middle" font-weight="700" fill="#4859ad">${name}</text>
  <text x="800" y="479" font-family="Arial,Helvetica,sans-serif" font-size="20" text-anchor="middle" fill="#4c5e79">${esc(d.motivation)}</text>
  <rect x="191" y="529" width="1218" height="151" rx="29" fill="#ffffff" fill-opacity=".84" stroke="#cbd8ea" stroke-opacity=".88"/>
  <line x1="600" x2="600" y1="554" y2="654" stroke="#d9e1ed" stroke-width="2"/>
  <line x1="1010" x2="1010" y1="554" y2="654" stroke="#d9e1ed" stroke-width="2"/>
  <text x="393" y="579" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="700" letter-spacing="1.8" fill="#60718b">NET P&amp;L</text>
  <text x="393" y="642" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="46" font-weight="800" fill="${tint}">${esc(amount)}</text>
  <text x="805" y="579" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="700" letter-spacing="1.8" fill="#60718b">WIN RATE</text>
  <text x="805" y="642" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="46" font-weight="800" fill="#1b2a49">${d.winRate.toFixed(1)}%</text>
  <text x="1214" y="579" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="700" letter-spacing="1.8" fill="#60718b">TRADES</text>
  <text x="1214" y="642" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="46" font-weight="800" fill="#1b2a49">${d.trades}</text>
  <text x="150" y="738" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="700" fill="#35465e">${account}</text>
  <text x="150" y="768" font-family="Arial,Helvetica,sans-serif" font-size="16" fill="#60718b">${esc(dateLabel)}</text>
  <text x="1440" y="760" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="700" fill="#5266c7">ONE TRADE AT A TIME ✦</text>
  </svg>`;
}

export async function downloadCertificatePNG(d){
 const svg=certificateSVG(d,{prefix:`export-${d.type}-${d.start}`});
 const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
 try{
   const img=new Image();await new Promise((ok,fail)=>{img.onload=ok;img.onerror=fail;img.src=url});
   const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=900;
   canvas.getContext('2d').drawImage(img,0,0,1600,900);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
   if(!blob)throw new Error('PNG conversion was unavailable');
   const href=URL.createObjectURL(blob);const link=document.createElement('a');link.href=href;link.download=`PP-Trading-Journey-${d.type}-${d.start}.png`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(href),5000);
 } finally {URL.revokeObjectURL(url);}
}

export function completedPeriodWithTrades(w, a, type, maxBack=24){
  for(let i=-1;i>=-maxBack;i--){const {start,end}=periodRange(type,new Date(),i);const d=certificateData(w,a,type,start,end);if(d?.trades)return d;}
  return null;
}
