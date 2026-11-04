import {esc,clamp,money,sum,dateOf,niceDate,formatNumber} from './utils.js';

const DAY = 86400000;
const utc = date => Date.parse(String(date) + 'T00:00:00Z');
const iso = ms => new Date(ms).toISOString().slice(0,10);
const tradeNet = t => (Number(t.result)||0)-(Number(t.fees)||0);

// Backwards compatible day-by-day series, used in the landing-page mockup.
export function equitySeries(trades, days=30){
 const count=Math.max(1,Math.min(365,Math.floor(Number(days)||30)));
 const now=dateOf(),start=iso(utc(now)-(count-1)*DAY);
 const before=sum(trades.filter(t=>t.date<start),tradeNet);
 const byDay=new Map();for(const t of trades){if(t.date>=start&&t.date<=now)byDay.set(t.date,(byDay.get(t.date)||0)+tradeNet(t));}
 let value=before;
 return Array.from({length:count},(_,i)=>{const date=iso(utc(start)+i*DAY),change=byDay.get(date)||0;value+=change;return {date,value,change};});
}

/** Chart data belongs exclusively to the selected trading account.
 *  All-time is trade-date based, keeping the SVG light even for multi-year accounts.
 *  Range windows use the opening cumulative P&L (not a false zero reset).
 */
export function accountEquitySeries(workspace, account, range='30', asOf=dateOf()){
 if(!account?.id) return {series:[],allTimeNet:0,periodNet:0,periodCount:0,count:0,range:'30',accountId:null};
 const r=['7','14','30','all'].includes(String(range))?String(range):'30';
 const accountTrades=(workspace?.trades||[]).filter(t=>t.accountId===account.id && /^\d{4}-\d{2}-\d{2}$/.test(t.date||'') && t.date<=asOf).sort((a,b)=>a.date.localeCompare(b.date));
 const netAll=sum(accountTrades,tradeNet);
 const days=r==='all'?null:Number(r);
 const periodStart=days===null?null:iso(utc(asOf)-(days-1)*DAY);
 const inRange=days===null?accountTrades:accountTrades.filter(t=>t.date>=periodStart);
 const periodNet=sum(inRange,tradeNet);
 const byDay=new Map();for(const t of inRange)byDay.set(t.date,(byDay.get(t.date)||0)+tradeNet(t));
 let running=netAll-periodNet;
 let baseDate,dates=[];
 if(days!==null){
  baseDate=iso(utc(periodStart)-DAY);
  dates=Array.from({length:days},(_,i)=>iso(utc(periodStart)+i*DAY));
 }else{
  const first=accountTrades[0]?.date||asOf;
  const created=/^\d{4}-\d{2}-\d{2}$/.test(account.createdAt||'')?account.createdAt:first;
  baseDate=iso(utc(created<first?created:first)-DAY);
  dates=[...new Set([...byDay.keys(),asOf])].filter(d=>d>baseDate).sort();
 }
 const series=[{date:baseDate,value:running,change:0,baseline:true}];
 for(const date of dates){const change=byDay.get(date)||0;running+=change;series.push({date,value:running,change});}
 return {series:accountTrades.length?series:[],allTimeNet:netAll,periodNet,periodCount:inRange.length,count:accountTrades.length,range:r,accountId:account.id,from:periodStart||baseDate,to:asOf,peak:Math.max(0,...series.map(p=>p.value))};
}

function smoothLine(xs,ys){
 if(xs.length===1)return `M${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`;
 const slopes=xs.slice(1).map((x,i)=>(ys[i+1]-ys[i])/Math.max(.001,x-xs[i]));
 const m=xs.map((_,i)=>i===0?slopes[0]:i===xs.length-1?slopes[slopes.length-1]:(slopes[i-1]*slopes[i]<=0?0:2*slopes[i-1]*slopes[i]/(slopes[i-1]+slopes[i])));
 let d=`M${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`;
 for(let i=0;i<xs.length-1;i++){
  const dx=xs[i+1]-xs[i];
  d+=` C${(xs[i]+dx/3).toFixed(2)} ${(ys[i]+m[i]*dx/3).toFixed(2)} ${(xs[i+1]-dx/3).toFixed(2)} ${(ys[i+1]-m[i+1]*dx/3).toFixed(2)} ${xs[i+1].toFixed(2)} ${ys[i+1].toFixed(2)}`;
 }
 return d;
}

/** One continuous color, based on CURRENT cumulative account P&L, not each trade. */
export function lineChart(series,{id='equity',height=258,currency='USD',compact=false,mask=false,accountNet=null}={}){
 if(!series?.length)return `<div class="chart-empty chart-empty-v4">No recorded trades for this account yet. Add your first trade to start your equity journey.</div>`;
 const W=760,H=height,pad={l:compact?13:22,r:compact?14:20,t:compact?22:24,b:compact?19:38};
 const vals=series.map(d=>Number(d.value)||0);
 const net=accountNet===null?vals[vals.length-1]:Number(accountNet)||0;
 const tone=net>0?'profit':net<0?'loss':'neutral';
 const color=tone==='profit'?'#13b889':tone==='loss'?'#e45165':'#6f82a5';
 const label=tone==='profit'?'Overall profit':tone==='loss'?'Overall loss':'Break-even';
 const lo0=Math.min(...vals),hi0=Math.max(...vals),span=Math.max(1,hi0-lo0);const lo=lo0-span*.22,hi=hi0+span*.24;
 const times=series.map(p=>utc(p.date)),minTime=times[0],maxTime=times[times.length-1];
 const X=i=>pad.l+(times[i]-minTime)/Math.max(DAY,maxTime-minTime)*(W-pad.l-pad.r);
 const Y=v=>pad.t+(hi-v)/(hi-lo)*(H-pad.t-pad.b);
 const xs=series.map((p,i)=>X(i)),ys=series.map(p=>Y(p.value));
 const path=smoothLine(xs,ys);
 const area=`${path} L${xs[xs.length-1].toFixed(2)} ${H-pad.b} L${xs[0].toFixed(2)} ${H-pad.b} Z`;
 const gradId=`grad-${id}`;
 const peakVal=Math.max(...vals),peakIdx=vals.indexOf(peakVal),hasPeak=peakVal>0;
 const yTicks=[0,.25,.5,.75,1].map(t=>{const v=lo+(hi-lo)*(1-t),y=Y(v);return `<line x1="${pad.l}" x2="${W-pad.r}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}" stroke="currentColor" stroke-dasharray="4 9" opacity=".12"/>${compact?'':`<text x="${pad.l+2}" y="${y-7}" font-size="11" fill="currentColor" opacity=".58">${mask?'••••':money(v,currency)}</text>`}`}).join('');
 const baseLine=lo<0&&hi>0?`<line x1="${pad.l}" x2="${W-pad.r}" y1="${Y(0)}" y2="${Y(0)}" stroke="currentColor" stroke-dasharray="6 6" opacity=".26"/>`:'';
 const labelIndices=[0,Math.round((series.length-1)/3),Math.round((series.length-1)*2/3),series.length-1];
 const axis=compact?'':[...new Set(labelIndices)].map(i=>`<text x="${X(i).toFixed(1)}" y="${H-9}" text-anchor="${i===0?'start':i===series.length-1?'end':'middle'}" font-size="11" fill="currentColor" opacity=".67">${niceDate(series[i].date,{month:'short',day:'numeric',year:maxTime-minTime>365*DAY?'2-digit':undefined})}</text>`).join('');
 const markers=series.length<=18?series.map((p,i)=>`<circle class="equity-point-v4" cx="${X(i).toFixed(2)}" cy="${Y(p.value).toFixed(2)}" r="2.8" fill="${color}" opacity="${p.baseline?.4:.72}"/>`).join(''):'';
 const peak=hasPeak?`<g class="peak-marker-v4" aria-label="Peak profit marker"><circle cx="${X(peakIdx)}" cy="${Y(peakVal)}" r="13" fill="#fcbf35" opacity=".15"/><circle cx="${X(peakIdx)}" cy="${Y(peakVal)}" r="6.3" fill="#ffc53c" stroke="var(--chart-peak-outline,#ffffff)" stroke-width="2.7"/></g>`:'';
 const endX=X(series.length-1),endY=Y(series[series.length-1].value);
 const data=esc(JSON.stringify(series.map((d,i)=>({date:d.date,value:Number(d.value)||0,change:Number(d.change)||0,x:X(i)/W,baseline:!!d.baseline}))));
 return `<div class="chart-v4-wrap" data-tone="${tone}"><div class="chart-v4-legend"><span class="equity-status-v4"><i style="background:${color}"></i>${label}</span>${hasPeak?`<span><i class="peak-swatch"></i> Peak ${mask?'••••':money(peakVal,currency)}</span>`:''}<span class="chart-tap-help">Hover or tap to inspect</span></div><div class="svg-chart ${compact?'compact-chart':''} interactive-equity interactive-equity-v4" data-currency="${esc(currency)}" data-mask="${mask?'true':'false'}" data-values="${data}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Equity chart for selected account. Continuous ${tone} trend, yellow point marks the highest visible positive cumulative profit." preserveAspectRatio="none"><defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".25"/><stop offset="1" stop-color="${color}" stop-opacity=".007"/></linearGradient></defs>${yTicks}${baseLine}<path d="${area}" fill="url(#${gradId})" class="area-reveal"/><path d="${path}" fill="none" stroke="${color}" stroke-width="${compact?4.5:4.2}" stroke-linejoin="round" stroke-linecap="round" class="chart-monoline-v4" pathLength="1000"/>${markers}${peak}<circle cx="${endX}" cy="${endY}" r="6" fill="${color}" stroke="var(--chart-peak-outline,#fff)" stroke-width="2" class="chart-live-dot-v4"/>${axis}</svg><div class="chart-guide" hidden></div><div class="chart-tooltip" hidden></div></div></div>`;
}
export function sparkline(series,color='#6574ee'){
 const values=series.length?series:[0]; const max=Math.max(...values,1),min=Math.min(...values,0); const pts=values.map((n,i)=>`${i*130/Math.max(values.length-1,1)},${43-((n-min)/(max-min||1)*32)}`).join(' ');
 return `<svg viewBox="0 0 130 48" class="sparkline" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
export function donut(value=0,color='#6e7df0',label=''){const p=clamp(value,0,100);return `<div class="donut" style="--donut:${p}%;--donut-color:${color}" role="img" aria-label="${esc(label||'Progress')} ${p.toFixed(0)} percent"><div class="donut-inner"><strong>${p.toFixed(0)}<small>%</small></strong>${label?`<span>${esc(label)}</span>`:''}</div></div>`}
export function bars(items,{currency='USD',max=6,mask=false}={}){const sorted=[...items].slice(0,max);const greatest=Math.max(1,...sorted.map(i=>Math.abs(i.value)));return `<div class="bar-list">${sorted.map((item,i)=>`<div class="bar-row"><div class="bar-meta"><span>${esc(item.label)}</span><strong class="${item.value>=0?'positive':'negative'}">${item.value>=0?'+':''}${mask?'••••':money(item.value,currency)}</strong></div><div class="bar-track"><div class="bar-fill ${item.value>=0?'pos-fill':'neg-fill'}" style="width:${Math.max(3,Math.abs(item.value)/greatest*100)}%;animation-delay:${i*.09}s"></div></div></div>`).join('')}</div>`}
export function calendarGrid(trades,month,{mini=false,hideValues=false}={}){
 const [year,mon]=month.split('-').map(Number),first=new Date(year,mon-1,1),days=new Date(year,mon,0).getDate(),offset=(first.getDay()+6)%7;
 const grouped=new Map();trades.forEach(t=>{if(t.date.startsWith(month)){const n=Number(t.date.slice(-2));const x=grouped.get(n)||{value:0,count:0};x.value+=Number(t.result||0)-Number(t.fees||0);x.count++;grouped.set(n,x)}});
 const weekday=['M','T','W','T','F','S','S'];const cells=Array(offset).fill('<span class="cal-blank"></span>');
 for(let day=1;day<=days;day++){const d=grouped.get(day),date=`${month}-${String(day).padStart(2,'0')}`;const pos=d?.value>0;const neg=d?.value<0;const active=date===dateOf(0);cells.push(`<button class="cal-day ${d?.count?pos?'cal-win':neg?'cal-loss':'cal-flat':''} ${active?'is-today':''}" data-action="calendar-day" data-date="${date}" title="${date}${d?` · ${d.count} trades`:''}"><span>${day}</span>${d?.count?`<b>${d.value>=0?'+':''}${hideValues?'•••':formatNumber(d.value,0)}</b>`:`<i></i>`}</button>`)}
 return `<div class="cal-grid ${mini?'mini-cal':''}">${weekday.map(w=>`<span class="cal-weekday">${w}</span>`).join('')}${cells.join('')}</div>`;
}
