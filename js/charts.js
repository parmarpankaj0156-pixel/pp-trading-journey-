import {esc,clamp,money,sum,dateOf,niceDate,formatNumber} from './utils.js';
export function equitySeries(trades,days=30){
 const dates=Array.from({length:days},(_,i)=>dateOf(i-days+1));
 const totals=new Map();trades.forEach(t=>totals.set(t.date,(totals.get(t.date)||0)+Number(t.result||0)-Number(t.fees||0)));
 let running=sum(trades.filter(t=>t.date<dates[0]),t=>t.result-(t.fees||0));
 return dates.map(date=>({date,value:(running+=totals.get(date)||0),change:totals.get(date)||0}));
}
export function lineChart(series,{id='equity',height=258,currency='USD',compact=false,mask=false}={}){
 const W=760,H=height,pad={l:compact?4:14,r:compact?4:12,t:16,b:compact?10:34};
 if(!series?.length)return `<div class="chart-empty">No trades to chart yet</div>`;
 const vals=series.map(d=>d.value);let lo=Math.min(0,...vals),hi=Math.max(0,...vals),range=hi-lo||1;lo-=range*.17;hi+=range*.16;
 const X=i=>pad.l+i*(W-pad.l-pad.r)/Math.max(1,series.length-1);
 const Y=v=>pad.t+(hi-v)/(hi-lo)*(H-pad.t-pad.b);
 const path=series.map((p,i)=>`${i?'L':'M'}${X(i).toFixed(1)} ${Y(p.value).toFixed(1)}`).join(' ');
 const area=`${path} L${X(series.length-1)} ${H-pad.b} L${X(0)} ${H-pad.b} Z`;
 const end=series[series.length-1],positive=end.value>=0;
 const gradId=`grad-${id}`;
 const grids=[0,.25,.5,.75,1].map(t=>{const v=lo+(hi-lo)*(1-t),yy=Y(v);return `<line x1="${pad.l}" x2="${W-pad.r}" y1="${yy}" y2="${yy}" stroke="#d1ddeb" stroke-dasharray="4 8" opacity=".68"/>${compact?'':`<text x="${pad.l}" y="${yy-6}" font-size="10" fill="#657997">${mask?'••••':money(v,currency)}</text>`}`}).join('');
 const labels=compact?'':[0,Math.round((series.length-1)/3),Math.round((series.length-1)*2/3),series.length-1].map(i=>`<text x="${X(i)}" y="${H-7}" text-anchor="${i===0?'start':i===series.length-1?'end':'middle'}" font-size="11" fill="#697c96">${niceDate(series[i].date,{month:'short',day:'numeric'})}</text>`).join('');
 const segments=series.slice(1).map((point,i)=>{
  const prev=series[i],up=point.value>=prev.value;
  return `<path d="M${X(i).toFixed(2)} ${Y(prev.value).toFixed(2)} L${X(i+1).toFixed(2)} ${Y(point.value).toFixed(2)}" class="equity-segment" fill="none" stroke="${up?'#08a77d':'#e25369'}" stroke-width="${compact?3.7:4}" stroke-linecap="round" pathLength="100" stroke-dasharray="100" style="animation-delay:${(i/Math.max(1,series.length-1)*.75).toFixed(2)}s"/>`;
 }).join('');
 const dots=series.map((p,i)=>`<g class="chart-hover-point"><circle cx="${X(i)}" cy="${Y(p.value)}" r="${compact?9:12}" fill="transparent"/><circle cx="${X(i)}" cy="${Y(p.value)}" r="4" class="point-dot" fill="${p.change>=0?'#0b9e75':'#e14e67'}"/><title>${niceDate(p.date)} • ${mask?'Hidden':money(p.value,currency)} • ${p.change>=0?'Profit':'Loss'} day</title></g>`).join('');
 return `<div class="svg-chart ${compact?'compact-chart':''}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Equity performance. Green is profit, red is loss." preserveAspectRatio="none"><defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${positive?'#20c9a0':'#ff839b'}" stop-opacity=".22"/><stop offset="1" stop-color="${positive?'#20c9a0':'#ff839b'}" stop-opacity="0"/></linearGradient></defs>${grids}<path d="${area}" fill="url(#${gradId})" class="area-reveal"/><path d="${path}" fill="none" stroke="#d2dce9" stroke-width="${compact?3.6:4.1}" opacity=".7" stroke-linecap="round"/>${segments}${dots}<circle cx="${X(series.length-1)}" cy="${Y(end.value)}" r="6" fill="white" stroke="${end.change>=0?'#09a97d':'#df526c'}" stroke-width="3"/>${labels}</svg></div>`;
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
