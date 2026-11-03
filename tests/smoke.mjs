import assert from 'node:assert/strict';
import {demoWorkspace,freshWorkspace,accountStats,tradeStats} from '../js/data.js';
import {pageView,shell,landing,authView,renderModal,riskCalculation} from '../js/views.js';
import {dateOf,uuid} from '../js/utils.js';

const w=demoWorkspace();
assert.equal(w.accounts.length,4,'Sample accounts');
assert.ok(w.trades.length>=70,'Sample trades');
for(const a of w.accounts) assert.ok(accountStats(w,a).total>0,'Stats should load for each sample account');
const ui={route:'dashboard',accountId:w.accounts[0].id,calendarMonth:dateOf().slice(0,7),modal:null,risk:{balance:10000,percent:1,entry:1.085,stop:1.081,take:1.093,multiplier:100000}};
const c={w,ui,mode:'demo',user:null,demo:w};
for(const route of ['dashboard','trades','calendar','accounts','analytics','performance','notes','goals','withdrawals','risk','settings']){
 ui.route=route;const html=shell(c,pageView(c));
 assert.ok(html.length>1000,`${route} should render`);
 assert.ok(!/\b(?:undefined|NaN)\b/.test(html),`${route} has missing data`);
}
assert.ok(landing(c).includes('Make yours count.'),'Landing should render');
assert.ok(authView({...c,ui:{...ui,authTab:'login'}}).includes('Welcome back'),'Login should render');
for(const modalType of ['trade','account','withdrawal','note','goal','trade-detail','account-detail','day-detail']){
 const html=renderModal({...c,ui:{...ui,modal:{type:modalType,id:modalType==='trade-detail'?w.trades[0].id:modalType==='account-detail'?w.accounts[0].id:'',date:dateOf()}}});
 assert.ok(html.includes('modal-dialog'),`${modalType} modal`);
}
assert.ok(riskCalculation(ui.risk).includes('$100.00'),'Risk 1% of 10K should be $100');
assert.notEqual(uuid(),uuid(),'Identifiers should be unique');
const f=freshWorkspace('Demo tester');f.accounts.push({id:'fund',kind:'funded',stage:'phase1',plan:'two-step',name:'Funding test',size:10000,currency:'USD',profitTargetPct:6,phase2TargetPct:5,dailyLossPct:3,maxLossPct:6});
const trade=(phase,result,date=dateOf())=>({id:uuid(),accountId:'fund',phase,result,date,risk:100,rr:result/100});
f.trades.push(trade('phase1',650));assert.equal(accountStats(f,f.accounts[0]).status,'passed','Profit target reached');
f.accounts[0].stage='phase2';assert.equal(accountStats(f,f.accounts[0]).status,'active','Phase 2 resets its P&L');
f.trades.push(trade('phase2',-700));assert.equal(accountStats(f,f.accounts[0]).status,'breached','Max loss breach locks account');
assert.equal(tradeStats(f.trades).count,2);
console.log('✓ PP Trading Journey: 11 pages, 8 modal types, demo data, funded progression, P&L and risk calculator passed.');
