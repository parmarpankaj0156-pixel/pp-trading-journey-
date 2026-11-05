import assert from 'node:assert/strict';
import {accountEquitySeries} from '../js-v5/charts.js';
import {pageView,shell} from '../js-v5/views.js';
import {freshWorkspace} from '../js-v5/data.js';
const w=freshWorkspace('Alex');
const alpha={id:'alpha',name:'Alpha Fund',currency:'USD',kind:'forex',stage:'live',size:20000,createdAt:'2026-10-01'};
const beta={id:'beta',name:'Beta Account',currency:'USD',kind:'forex',stage:'live',size:5000,createdAt:'2026-10-01'};
w.accounts=[alpha,beta];w.profile.defaultAccountId=alpha.id;
w.trades=[
 {id:'a1',accountId:'alpha',date:'2026-10-08',result:300,fees:10},
 {id:'a2',accountId:'alpha',date:'2026-11-01',result:-100,fees:5},
 {id:'a3',accountId:'alpha',date:'2026-11-03',result:75,fees:5},
 {id:'b1',accountId:'beta',date:'2026-11-03',result:-400,fees:0}
];
for(const id of ['alpha','beta']){
 const ui={accountId:id,chartRange:'7',route:'dashboard',calendarMonth:'2026-11',modal:null,tradeSearch:'',tradeOutcome:'all',risk:{balance:10000,percent:1,entry:1,stop:0.9,take:1.1,multiplier:1000}};
 const c={w,ui,mode:'demo',user:null,demo:w};
 for(const route of ['dashboard','analytics']){
   ui.route=route;
   const html=shell(c,pageView(c));
   assert.ok(html.includes('id="chart-account-select"'),'Chart account selector is inside chart section');
   assert.ok(html.includes('Alpha Fund</option>')&&html.includes('Beta Account</option>'),'Selector includes every account');
   assert.equal((html.match(/id="top-account-select"/g)||[]).length,0,'No duplicated top selector on chart pages');
   assert.ok(html.includes('equity-insights-v5'),'Compact insights in chart card');
   assert.ok(html.includes('Best day')&&html.includes('Toughest day')&&html.includes('Active days'));
   for(const range of ['7','14','30','all'])assert.ok(html.includes(`data-range="${range}"`));
 }
 const summary=accountEquitySeries(w,w.accounts.find(a=>a.id===id),'all','2026-11-05');
 assert.equal(summary.allTimeNet,id==='alpha'?255:-400,'Selected account is isolated');
 assert.equal(summary.series.reduce((n,p)=>n+(p.tradeCount||0),0),id==='alpha'?3:1,'Active days are based only on selected-account trades');
 assert.ok(Number.isFinite(summary.series[1].value));
}
console.log('✓ V5: chart account selector lives in chart cards, correct choices, no redundant header selector, per-account totals and new period insights.');
