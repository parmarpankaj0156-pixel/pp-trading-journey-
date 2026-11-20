import assert from 'node:assert/strict';
import {accountEquitySeries,portfolioEquitySeries} from '../js-v5/charts.js';
import {pageView,shell} from '../js-v5/views.js';
import {freshWorkspace,portfolioSummary,demoPortfolioSummary,nextDemoAccountNumber} from '../js-v5/data.js';
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

const portfolio=freshWorkspace('Portfolio test');
portfolio.accounts=[
 {id:'p1',kind:'funded',plan:'two-step',stage:'phase1',accountNumber:1,name:'Phase one',currency:'USD',size:10000,cost:99,createdAt:'2026-10-01'},
 {id:'p2',kind:'funded',plan:'two-step',stage:'phase2',accountNumber:2,name:'Phase two',currency:'USD',size:10000,cost:0,parentAccountId:'p1',createdAt:'2026-10-03'},
 {id:'live',kind:'funded',plan:'two-step',stage:'funded',accountNumber:3,name:'Live stage',currency:'USD',size:10000,cost:0,parentAccountId:'p2',createdAt:'2026-10-05'},
 {id:'p4',kind:'funded',plan:'two-step',stage:'phase1',accountNumber:4,name:'Replacement challenge',currency:'USD',size:10000,cost:149,createdAt:'2026-11-01'},
 {id:'inr',kind:'indian',stage:'live',name:'Indian account',currency:'INR',size:100000,cost:0,createdAt:'2026-10-01'}
];
portfolio.trades=[
 {id:'p1t',accountId:'p1',date:'2026-10-02',result:300,fees:5},
 {id:'p2t',accountId:'p2',date:'2026-10-04',result:-100,fees:0},
 {id:'livet',accountId:'live',date:'2026-10-06',result:250,fees:5},
 {id:'p4t',accountId:'p4',date:'2026-11-02',result:-50,fees:0},
 {id:'inrt',accountId:'inr',date:'2026-11-02',result:5000,fees:0}
];
const ps=portfolioSummary(portfolio);
assert.equal(ps.purchaseCount,2,'Phase 1, Phase 2 and Live count as a single purchase; replacement counts once');
assert.deepEqual(ps.purchases.map(x=>x.id),['p4','p1'],'Purchase history contains original purchases only');
assert.equal(ps.currencies.find(x=>x.currency==='USD').invested,248,'Only the original account prices are invested');
assert.equal(ps.currencies.find(x=>x.currency==='USD').net,390,'All USD phases roll into overall USD P&L');
assert.equal(ps.currencies.find(x=>x.currency==='INR').net,5000,'INR results stay separate from USD');
const portfolioCurve=portfolioEquitySeries(portfolio,'USD','all','2026-11-05');
assert.equal(portfolioCurve.allTimeNet,390,'Overall equity chart combines every USD account and phase');
assert.equal(portfolioCurve.count,4,'Overall equity chart excludes other currencies');
const allUi={accountId:'p1',chartRange:'all',chartAccountMode:'all',portfolioCurrency:'USD',route:'dashboard',calendarMonth:'2026-11',modal:null,tradeSearch:'',tradeOutcome:'all',risk:{balance:10000,percent:1,entry:1,stop:0.9,take:1.1,multiplier:1000}};
const portfolioHtml=shell({w:portfolio,ui:allUi,mode:'demo',user:null,demo:portfolio},pageView({w:portfolio,ui:allUi,mode:'demo',user:null,demo:portfolio}));
assert.ok(portfolioHtml.includes('Overall · Funded &amp; Real'),'Main chart can switch to funded/real overall mode');
assert.ok(portfolioHtml.includes('portfolio-overview-v5'),'Overall investment and performance summary is visible');
assert.ok(portfolioHtml.includes('Purchase history'),'Purchase history is visible');
assert.ok(portfolioHtml.includes('Account-wise profit / loss'),'Each account has a separate P&L row');
assert.ok(portfolioHtml.includes('149.00')&&portfolioHtml.includes('99.00'),'Purchase history shows both original purchase prices');
assert.ok(portfolioHtml.includes('390.00'),'Overall USD realized P&L is shown');
assert.ok(portfolioHtml.includes('5,000.00'),'INR P&L is shown separately');

portfolio.accounts.push({id:'demo-only',kind:'demo',stage:'demo',demoAccountNumber:1,name:'Demo only',currency:'USD',size:10000,cost:0,createdAt:'2026-10-01'});
portfolio.trades.push({id:'demo-only-trade',accountId:'demo-only',date:'2026-11-03',result:9999,fees:0});
assert.equal(portfolioSummary(portfolio).purchaseCount,2,'Demo account does not change funded purchase count');
assert.equal(portfolioSummary(portfolio).currencies.find(x=>x.currency==='USD').net,390,'Real overall P&L excludes demo result');
assert.equal(demoPortfolioSummary(portfolio).accountCount,1,'Demo count is separate');
assert.equal(demoPortfolioSummary(portfolio).currencies.find(x=>x.currency==='USD').net,9999,'Demo P&L is kept separately');
assert.equal(nextDemoAccountNumber(portfolio),2,'Demo account numbering is independent');
const demoCurve=portfolioEquitySeries(portfolio,'USD','all','2026-11-05','demo');
assert.equal(demoCurve.allTimeNet,9999,'Demo equity curve contains demo trades only');
assert.equal(portfolioCurve.allTimeNet,390,'Funded/real chart is unchanged by demo P&L');
const demoUi={...allUi,demoChartMode:'all'};
const demoContext={w:portfolio,ui:demoUi,mode:'demo',user:null,demo:portfolio};
const demoHtml=shell(demoContext,pageView(demoContext));
assert.ok(demoHtml.includes('SEPARATE WORKSPACE'),'Dashboard shows its demo workspace separately');
assert.ok(demoHtml.includes('Demo account-wise profit / loss'),'Demo accounts have a separate P&L list');
assert.ok(demoHtml.includes('demo-chart-account-select'),'Demo chart has its own account selector');


console.log('✓ Portfolio: successor phases count as one purchase, replacement is a new purchase, price history, currency-separated overall chart and account P&L.');
