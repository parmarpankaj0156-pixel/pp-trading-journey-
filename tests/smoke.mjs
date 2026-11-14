import assert from 'node:assert/strict';
import {demoWorkspace,freshWorkspace,accountStats,tradeStats,createSuccessorAccount,isLiveAccount} from '../js-v5/data.js';
import {pageView,shell,landing,authView,recoveryKeyView,renderModal,riskCalculation} from '../js-v5/views.js';
import {periodRange,certificateData,certificateSVG,completedPeriodWithTrades} from '../js-v5/certificates.js';
import {dateOf,uuid} from '../js-v5/utils.js';

const w=demoWorkspace();
assert.equal(w.accounts.length,4,'Sample accounts');
assert.ok(w.trades.length>=70,'Sample trades');
for(const a of w.accounts) assert.ok(accountStats(w,a).total>0,'Stats should load');
const ui={route:'dashboard',accountId:w.accounts[0].id,calendarMonth:dateOf().slice(0,7),modal:null,tradeSearch:'',tradeOutcome:'all',dailyCertDate:dateOf(),dailyCertificateOpen:false,risk:{balance:10000,percent:1,entry:1.085,stop:1.081,take:1.093,multiplier:100000}};
const c={w,ui,mode:'demo',user:null,demo:w};
for(const route of ['dashboard','trades','calendar','accounts','analytics','performance','certificates','notes','goals','withdrawals','risk','settings']){
 ui.route=route;const html=shell(c,pageView(c));
 assert.ok(html.length>1000,`${route} should render`);
 assert.ok(!/\b(?:undefined|NaN)\b/.test(html),`${route} missing data`);
}
assert.ok(landing(c).includes('Grow with clarity.'),'Landing should render');
assert.ok(pageView({...c,ui:{...ui,route:'dashboard'}}).includes('interactive-equity'),'Interactive chart');
assert.ok(pageView({...c,ui:{...ui,route:'dashboard'}}).includes('rule-meter'),'Target and loss rule gauges');
assert.ok(authView({...c,ui:{...ui,authTab:'login'}}).includes('Welcome back'),'Login should render');
const signup=authView({...c,ui:{...ui,authTab:'signup'}});
assert.ok(signup.includes('name="username"')&&signup.includes('name="name"')&&signup.includes('name="confirmPassword"'),'Registration fields');
assert.ok(!signup.includes('name="email"')&&!signup.includes('name="phone"'),'No email or phone required');
const recover=authView({...c,ui:{...ui,authTab:'forgot'}});
assert.ok(recover.includes('name="recoveryKey"')&&recover.includes('name="newPassword"'),'Recovery via secure key');
assert.ok(recoveryKeyView({type:'signup',key:'PPJ-'+'A'.repeat(64)}).includes('shown <strong>only once'),'Recovery key one-time display');

for(const modalType of ['trade','account','withdrawal','note','goal','trade-detail','account-detail','day-detail']){
 const html=renderModal({...c,ui:{...ui,modal:{type:modalType,id:modalType==='trade-detail'?w.trades[0].id:modalType==='account-detail'?w.accounts[0].id:'',date:dateOf()}}});
 assert.ok(html.includes('modal-dialog'),`${modalType} modal`);
 if(modalType==='trade'){
  assert.ok(html.includes('trade-outcome-choice'),'Trade profit/loss selection');
  assert.ok(html.includes('more-trade-details'),'Advanced fields collapsible');
  assert.ok(html.includes('name="time"'),'Optional trade time field');
  assert.ok(html.includes('Add time')&&!/name="time"[^>]*required/.test(html),'Trade time is optional and collapsed behind Add time');
  assert.ok(html.includes('name="entryType"'),'Entry type');
  assert.ok(html.includes('trade-direction-choice')&&html.includes('BUY')&&html.includes('SELL'),'Buy/sell in basic form');
  assert.ok(html.indexOf('trade-direction-choice')<html.indexOf('more-trade-details'),'Buy/sell must be visible');
 }
}
assert.ok(riskCalculation(ui.risk).includes('$100.00'),'Risk 1% of 10K should be $100');
assert.notEqual(uuid(),uuid(),'UUID unique');
const f=freshWorkspace('Demo tester');f.accounts.push({id:'fund',kind:'funded',stage:'phase1',plan:'two-step',name:'Funding test',size:10000,currency:'USD',profitTargetPct:6,phase2TargetPct:5,dailyLossPct:3,maxLossPct:6});
const trade=(phase,result,date=dateOf())=>({id:uuid(),accountId:'fund',phase,result,date,risk:100,rr:result/100});
f.trades.push(trade('phase1',650));assert.equal(accountStats(f,f.accounts[0]).status,'passed');
f.accounts[0].stage='phase2';assert.equal(accountStats(f,f.accounts[0]).status,'active');
f.trades.push(trade('phase2',-700));assert.equal(accountStats(f,f.accounts[0]).status,'breached');
assert.equal(tradeStats(f.trades).count,2);
const chain=freshWorkspace('Phase chain');
const p1={id:'p1',name:'Funded 5K',kind:'funded',plan:'two-step',stage:'phase1',size:5000,currency:'USD',profitTargetPct:8,phase2TargetPct:5,phase1DailyLossPct:4,phase1MaxLossPct:8,phase2DailyLossPct:3,phase2MaxLossPct:6,cost:99};
chain.accounts.push(p1);chain.trades.push({id:'p1t',accountId:'p1',phase:'phase1',date:dateOf(),result:400,fees:0});
assert.equal(accountStats(chain,p1).status,'passed');
const p2=createSuccessorAccount(chain,p1);
assert.ok(p2&&p2.stage==='phase2','Phase 1 creates Phase 2 automatically');
assert.equal(p2.cost,0,'Purchase price is not duplicated');
assert.equal(accountStats(chain,p2).target,250,'Phase 2 target uses the stored Phase 2 target');
assert.equal(accountStats(chain,p2).dailyLossPct,3,'Phase 2 uses its own daily loss limit');
assert.equal(accountStats(chain,p2).maxLossPct,6,'Phase 2 uses its own max DD');
assert.equal(createSuccessorAccount(chain,p1),null,'A completed phase cannot create duplicate successors');
chain.trades.push({id:'p2t',accountId:p2.id,phase:'phase2',date:dateOf(),result:250,fees:0});
assert.equal(accountStats(chain,p2).status,'passed');
const live=createSuccessorAccount(chain,p2);
assert.ok(live&&live.stage==='funded','Phase 2 creates Live account automatically');
assert.equal(accountStats(chain,live).target,0,'Live account has no profit target');
assert.equal(accountStats(chain,live).dailyLossPct,3,'Live account keeps Phase 2 daily loss limit');
assert.equal(accountStats(chain,live).maxLossPct,6,'Live account keeps Phase 2 max DD');
assert.equal(isLiveAccount(p1),false);assert.equal(isLiveAccount(p2),false);assert.equal(isLiveAccount(live),true);
for(const type of ['weekly','monthly','yearly']){
 const range=periodRange(type);const cert=certificateData(w,w.accounts[0],type,range.start,range.end);
 assert.ok(cert.name==='Alex Morgan');assert.ok(certificateSVG(cert).includes('CERTIFICATE OF PROGRESS'));
}
const yesterday=dateOf(-1);const lossCert=certificateData({profile:{name:'Demo tester'},trades:[{accountId:'fund',date:yesterday,result:-80,fees:2}]},f.accounts[0],'daily',yesterday,yesterday);
assert.equal(lossCert.net,-82);assert.equal(lossCert.greeting,'Better luck next time.');
assert.ok(certificateSVG(lossCert).includes('#df5570'));
assert.ok(completedPeriodWithTrades(w,w.accounts[0],'weekly',52),'Archives should find past trades');
console.log('✓ PP Trading Journey v5: 12 screens, 8 modals, quick-entry fields, charts, funded progression, certificates and risk calculations passed.');
