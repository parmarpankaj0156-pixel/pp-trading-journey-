import assert from 'node:assert/strict';
import {accountEquitySeries,lineChart} from '../js-v4/charts.js';
import {pageView} from '../js-v4/views.js';
import {freshWorkspace} from '../js-v4/data.js';
const a={id:'selected',name:'Selected Funded',currency:'USD',kind:'forex',stage:'live',size:10000,createdAt:'2026-09-01'};
const b={id:'other',name:'Other Account',currency:'INR',kind:'indian',stage:'live',size:150000,createdAt:'2026-08-01'};
const w=freshWorkspace('Trading tester');w.accounts=[a,b];w.profile.defaultAccountId=a.id;
w.trades=[
 {id:'p-old',accountId:a.id,date:'2026-09-05',result:1400,fees:0},
 {id:'p-month',accountId:a.id,date:'2026-10-10',result:-300,fees:20},
 {id:'p-week',accountId:a.id,date:'2026-10-30',result:-400,fees:5},
 {id:'p-today',accountId:a.id,date:'2026-11-04',result:50,fees:5},
 {id:'other-huge',accountId:b.id,date:'2026-11-04',result:550000,fees:0}
];
const asOf='2026-11-04';
const expected=720;
for (const r of ['7','14','30','all']){
 const x=accountEquitySeries(w,a,r,asOf);
 assert.equal(x.allTimeNet,expected);
 assert.equal(x.series.at(-1).value,expected);
 assert.equal(x.accountId,a.id);
 assert.equal(x.range,r);
 assert.ok(x.series.every(p=>!p || p.value < 550000),'No mixed account data');
 assert.equal(x.periodNet,r==='all'?720:r==='30'?-680:-360);
 assert.ok(x.series[0].baseline);
 const chart=lineChart(x.series,{id:'chart-test',currency:'USD',accountNet:x.allTimeNet});
 assert.ok(chart.includes('data-tone="profit"'),'Entire chart should be green if overall account profitable');
 assert.ok(chart.includes('peak-marker-v4'),'Positive peak marker');
 assert.ok(!chart.includes('equity-segment'),'No per-segment color switching');
 const n=JSON.parse(chart.match(/data-values="([^"]+)"/)[1].replace(/&quot;/g,'"'));
 assert.equal(n.at(-1).value,expected);
 for(let i=1;i<n.length;i++) assert.ok(n[i].x>=n[i-1].x,'Chronological x positions');
}
const negative={...w,trades:w.trades.map(t=>t.id==='p-old'?{...t,result:100}:t)};
const neg=accountEquitySeries(negative,a,'all',asOf);
assert.ok(neg.allTimeNet<0);
assert.ok(lineChart(neg.series,{accountNet:neg.allTimeNet}).includes('data-tone="loss"'));
const bSeries=accountEquitySeries(w,b,'7',asOf);
assert.equal(bSeries.allTimeNet,550000);
assert.equal(bSeries.periodCount,1);
for(const account of [a,b]){
 const ui={accountId:account.id,chartRange:'all',route:'dashboard'};
 const c={w,ui,mode:'demo',user:null,demo:w};
 const html=pageView(c);
 assert.ok(html.includes('Selected account')||html.includes('YOUR EQUITY JOURNEY'));
 assert.ok(html.includes(`data-range="7"`) && html.includes(`data-range="14"`) && html.includes(`data-range="30"`) && html.includes(`data-range="all"`));
 assert.ok(html.includes(`>${account.name}</b>`),'Account name must be visible beside chart');
 assert.ok(html.includes(`data-tone="${account.id==='selected'?'profit':'profit'}"`));
}
const blank=accountEquitySeries({trades:[]},a,'7',asOf);
assert.equal(blank.series.length,0);
assert.ok(lineChart(blank.series).includes('No recorded trades'));
console.log('✓ V4 chart: selected-account isolation, 7/14/30/all windows, fees, cumulative balance, smooth single-color line, peak dot, chronological inspector, empty state.');
