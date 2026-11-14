import { dateOf, today, uuid, sum, clamp } from './utils.js';
export const SESSIONS=['London','New York','Asia','London / NY Overlap','Other'];
export const EMOTIONS=['Confident','Calm','Neutral','Anxious','FOMO','Frustrated','Overconfident'];
export const SETUPS=['Breakout','Pullback','Support / Resistance','Liquidity Sweep','Trend Continuation','Reversal','Scalp','Other'];
export const INSTRUMENTS=['EURUSD','GBPUSD','XAUUSD','NAS100','US30','BTCUSD','NIFTY','BANKNIFTY'];
export const CURRENCIES=['USD','INR','EUR','GBP'];

export function freshWorkspace(name='Trader'){
  return { version:1,profile:{name,hideBalances:false,compact:false,theme:'light',defaultAccountId:'',onboardingDismissed:false},accounts:[],trades:[],withdrawals:[],notes:[],goals:[] };
}
function assignFundedAccountNumbers(accounts){
 const result=accounts.map(a=>({...a}));
 const funded=result.filter(a=>a.kind==='funded');
 const ids=new Set(funded.map(a=>a.id));
 let next=Math.max(0,...funded.map(a=>Number(a.accountNumber)||0))+1;
 const children=new Map();
 for(const a of funded){if(a.parentAccountId){const list=children.get(a.parentAccountId)||[];list.push(a);children.set(a.parentAccountId,list)}}
 const rank=(a)=>String(a.createdAt||'');
 const visit=a=>{if(a.__numbered)return;a.__numbered=true;if(!(Number(a.accountNumber)>0))a.accountNumber=next++;(children.get(a.id)||[]).sort((x,y)=>rank(x).localeCompare(rank(y))).forEach(visit)};
 funded.filter(a=>!ids.has(a.parentAccountId)).sort((a,b)=>rank(a).localeCompare(rank(b))).forEach(visit);
 funded.forEach(visit);
 result.forEach(a=>delete a.__numbered);
 return result;
}
export function nextFundedAccountNumber(workspace){return Math.max(0,...(workspace?.accounts||[]).filter(a=>a.kind==='funded').map(a=>Number(a.accountNumber)||0))+1;}
export function normalizeWorkspace(obj) {
  const d=freshWorkspace();
  if(!obj || typeof obj!=='object') return d;
  return {...d,...obj,profile:{...d.profile,...(obj.profile||{})},accounts:assignFundedAccountNumbers(Array.isArray(obj.accounts)?obj.accounts.map(a=>({...a,phase1DailyLossPct:a.phase1DailyLossPct??a.dailyLossPct??0,phase1MaxLossPct:a.phase1MaxLossPct??a.maxLossPct??0,phase2DailyLossPct:a.phase2DailyLossPct??a.dailyLossPct??0,phase2MaxLossPct:a.phase2MaxLossPct??a.maxLossPct??0})):[],trades:Array.isArray(obj.trades)?obj.trades:[],withdrawals:Array.isArray(obj.withdrawals)?obj.withdrawals:[],notes:Array.isArray(obj.notes)?obj.notes:[],goals:Array.isArray(obj.goals)?obj.goals:[]};
}
const seed=(x)=>{let s=x;return ()=>{s=(s*1664525+1013904223)%4294967296;return s/4294967296}};
export function demoWorkspace(){
  const w=freshWorkspace('Alex Morgan'); const rand=seed(5712);
  w.accounts=[
    {id:'a1',name:'Apex • Funded 50K',broker:'Prop Trading',kind:'funded',plan:'two-step',stage:'funded',size:50000,currency:'USD',profitTargetPct:8,phase2TargetPct:5,dailyLossPct:5,maxLossPct:10,cost:299,createdAt:dateOf(-78)},
    {id:'a2',name:'Growth Challenge 25K',broker:'Prop Trading',kind:'funded',plan:'two-step',stage:'phase1',size:25000,currency:'USD',profitTargetPct:8,phase2TargetPct:5,dailyLossPct:5,maxLossPct:10,cost:179,createdAt:dateOf(-24)},
    {id:'a3',name:'Personal Forex',broker:'Live Account',kind:'forex',plan:'',stage:'live',size:10000,currency:'USD',profitTargetPct:0,phase2TargetPct:0,dailyLossPct:0,maxLossPct:0,cost:0,createdAt:dateOf(-100)},
    {id:'a4',name:'Indian Intraday',broker:'NSE / BSE',kind:'indian',plan:'',stage:'live',size:150000,currency:'INR',profitTargetPct:0,phase2TargetPct:0,dailyLossPct:0,maxLossPct:0,cost:0,createdAt:dateOf(-60)}
  ];
  const syms=['XAUUSD','NAS100','EURUSD','GBPUSD','US30'];
  let id=0;
  const fill=(account,count,start,scale)=>{
    for(let i=0;i<count;i++){
      const ix = start + Math.round(i*(Math.abs(start)-1)/Math.max(1,count-1));
      const day=dateOf(ix);const win=rand()>.38;
      const result=Math.round((win?(0.63+rand()*1.7):-(0.38+rand()*1.25))*scale);
      const risk=Math.round(scale*.9);
      const symbol=account.kind==='indian'?(rand()>.5?'NIFTY':'BANKNIFTY'):syms[Math.floor(rand()*syms.length)];
      w.trades.push({id:'t'+(++id),accountId:account.id,phase:account.stage,date:day,createdAt:`${day}T${String(9+i%10).padStart(2,'0')}:30:00.000Z`,symbol,direction:rand()>.5?'Long':'Short',session:SESSIONS[Math.floor(rand()*4)],setup:SETUPS[Math.floor(rand()*6)],result,risk,rr:risk?Number((result/risk).toFixed(2)):0,entryPrice:'',exitPrice:'',stopLoss:'',takeProfit:'',lotSize:'',fees:0,emotion:EMOTIONS[Math.floor(rand()*4)],followedPlan:rand()>.18,notes:i%8===0?'Waited for confirmation at the key level before entering.':'',screenshot:''});
    }
  };
  fill(w.accounts[0],35,-44,165);fill(w.accounts[1],16,-25,95);fill(w.accounts[2],15,-38,75);fill(w.accounts[3],13,-32,1150);
  w.withdrawals=[{id:'w1',accountId:'a1',amount:1450,date:dateOf(-16),status:'Paid',note:'First payout'},{id:'w2',accountId:'a1',amount:920,date:dateOf(-5),status:'Pending',note:'Monthly withdrawal'}];
  w.notes=[{id:'n1',date:dateOf(-2),mood:'Focused',title:'A better session starts with patience',body:'Skipped two low-quality setups today. I only acted when my checklist was complete. Patience is part of my edge.'},{id:'n2',date:dateOf(-7),mood:'Reflective',title:'Weekly review',body:'I trade best after a clear morning routine. Need to avoid revenge trades after the first loss.'}];
  w.goals=[{id:'g1',title:'Follow my trade plan',target:20,progress:13,unit:'trades'},{id:'g2',title:'Complete weekly reviews',target:8,progress:5,unit:'reviews'},{id:'g3',title:'Maintain risk discipline',target:30,progress:22,unit:'sessions'}];
  w.profile.defaultAccountId='a1';return w;
}
export function accountTrades(w,accountId,phase=null){return w.trades.filter(t=>t.accountId===accountId&&(!phase||t.phase===phase));}
export function accountStats(w,a){
  if(!a)return {all:[],stageTrades:[],net:0,dayPnL:0,winRate:0,wins:0,losses:0,total:0,profitFactor:0,avgRR:0,stageNet:0,target:0,progress:0,status:'active',maxDrawdown:0};
  const all=accountTrades(w,a.id).sort((x,y)=>x.date.localeCompare(y.date));
  const stageTrades=a.kind==='funded'?all.filter(t=>t.phase===a.stage):all;
  const net=sum(all,t=>t.result - (t.fees||0));
  const stageNet=sum(stageTrades,t=>t.result - (t.fees||0));
  const wins=all.filter(t=>t.result>0).length;
  const losses=all.filter(t=>t.result<0).length;
  const gains=sum(all.filter(t=>t.result>0),t=>t.result);
  const lossesAbs=Math.abs(sum(all.filter(t=>t.result<0),t=>t.result));
  const dayPnL=sum(stageTrades.filter(t=>t.date===today()),t=>t.result-(t.fees||0));
  const daily=new Map();stageTrades.forEach(t=>daily.set(t.date,(daily.get(t.date)||0)+t.result-(t.fees||0)));
  const worstDay=Math.min(0,...daily.values());
  let equity=0,peak=0,maxDrawdown=0;
  for(const t of stageTrades){equity+=Number(t.result||0)-Number(t.fees||0);peak=Math.max(peak,equity);maxDrawdown=Math.max(maxDrawdown,peak-equity)}
  const laterStage=a.stage==='phase2'||a.stage==='funded';
  const dailyLossPct=Number(laterStage?(a.phase2DailyLossPct??a.dailyLossPct):(a.phase1DailyLossPct??a.dailyLossPct))||0;
  const maxLossPct=Number(laterStage?(a.phase2MaxLossPct??a.maxLossPct):(a.phase1MaxLossPct??a.maxLossPct))||0;
  const targetPct=a.stage==='phase2'?(a.phase2TargetPct||5):(a.profitTargetPct||8);
  const target=a.kind==='funded' && a.stage!=='funded'?a.size*targetPct/100:0;
  const progress=target?clamp(stageNet/target*100,0,100):0;
  const breached=a.kind==='funded' && ((maxLossPct>0&&stageNet<= -a.size*maxLossPct/100)||(dailyLossPct>0&&worstDay<=-a.size*dailyLossPct/100));
  const passed=!breached&&target>0&&stageNet>=target;
  return {all,stageTrades,net,stageNet,wins,losses,total:all.length,winRate:all.length?wins/all.length*100:0,profitFactor:lossesAbs?gains/lossesAbs:gains>0?999:0,avgRR:all.length?sum(all,t=>t.rr)/all.length:0,dayPnL,target,progress,dailyLossPct,maxLossPct,status:breached?'breached':passed?'passed':'active',maxDrawdown,worstDay};
}
export function createSuccessorAccount(workspace,account){
  if(!workspace||!account||accountStats(workspace,account).status!=='passed')return null;
  if(workspace.accounts.some(a=>a.parentAccountId===account.id))return null;
  let stage=null;
  if(account.stage==='phase1'&&account.plan==='two-step')stage='phase2';
  else if(account.stage==='phase1'||account.stage==='phase2')stage='funded';
  if(!stage)return null;
  const next={...account,id:uuid(),accountNumber:nextFundedAccountNumber(workspace),stage,parentAccountId:account.id,challengeRootId:account.challengeRootId||account.id,createdAt:today(),cost:0};
  workspace.accounts.push(next);
  workspace.profile.defaultAccountId=next.id;
  return next;
}
export const isLiveAccount=(account)=>!!account&&(account.kind!=='funded'||account.stage==='funded');

export function tradeStats(trades){const sorted=[...trades].sort((a,b)=>a.date.localeCompare(b.date));const net=sum(sorted,t=>t.result-(t.fees||0));const wins=sorted.filter(t=>t.result>0);const losses=sorted.filter(t=>t.result<0);return {net,count:trades.length,wins:wins.length,losses:losses.length,winRate:trades.length?wins.length/trades.length*100:0,average:trades.length?net/trades.length:0,avgWinner:wins.length?sum(wins,t=>t.result)/wins.length:0,avgLoser:losses.length?sum(losses,t=>t.result)/losses.length:0,profitFactor:losses.length?sum(wins,t=>t.result)/Math.abs(sum(losses,t=>t.result)):0,best:sorted.length?Math.max(...sorted.map(t=>t.result)):0,worst:sorted.length?Math.min(...sorted.map(t=>t.result)):0};}
export const accountLabel=(a)=>a?.kind==='funded'?'Funded account':a?.kind==='indian'?'Indian market':'Real forex';
export const stageLabel=(a)=>!a?'—':a.kind!=='funded'?'Live account':({phase1:'Phase 1',phase2:'Phase 2',funded:'Live account'})[a.stage]||'Phase 1';
export const accountDisplayName=(a)=>a?.kind==='funded'?`Account ${Number(a.accountNumber)||'—'}`:(a?.name||'Account');
export const accountDisplayLabel=(a)=>a?.kind==='funded'?`${accountDisplayName(a)} · ${stageLabel(a)}`:(a?.name||'Account');
