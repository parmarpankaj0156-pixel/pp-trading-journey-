import {AUTH_ENABLED} from './config.js';
import {authLogin,authSignUp,authForgot,authLogout,authSession,authUpdatePassword,acceptRecoveryLink,loadWorkspace,saveWorkspace,uploadScreenshot,signedScreenshot} from './auth.js';
import {demoWorkspace,freshWorkspace,normalizeWorkspace,accountStats} from './data.js';
import {shell,landing,authView,pageView,riskCalculation} from './views.js';
import {today,uuid,toast,download,esc,money,safeJsonParse} from './utils.js';

const ROOT=document.getElementById('app');
const DEMO_KEY='pptj_demo_v1',MODE_KEY='pptj_view_mode_v1';
const validPages=new Set(['dashboard','trades','calendar','accounts','analytics','performance','notes','goals','withdrawals','risk','settings']);
const ui={route:'dashboard',authTab:'login',accountId:'',calendarMonth:today().slice(0,7),tradeSearch:'',tradeOutcome:'all',mobileMenu:false,modal:null,uploadFile:null,risk:safeJsonParse(localStorage.getItem('pptj_risk_v1'),{balance:10000,percent:1,entry:1.0850,stop:1.0810,take:1.0930,multiplier:100000})};
const ctx={mode:null,user:null,w:null,ui,demo:demoWorkspace()};
const routeHash=()=>decodeURIComponent(location.hash.slice(1).split('?')[0]);
let saveTimer=null, saveActive=false, saveAgain=false;

function ensureSelected(){const a=ctx.w?.accounts.find(x=>x.id===ui.accountId);if(!a)ui.accountId=ctx.w?.accounts.find(x=>x.id===ctx.w.profile.defaultAccountId)?.id||ctx.w?.accounts[0]?.id||'';}
function draw(){if(ctx.mode){ensureSelected();const page=validPages.has(ui.route)?ui.route:'dashboard';ui.route=page;ROOT.innerHTML=shell(ctx,pageView(ctx));loadPrivateScreenshots();return;}
 ROOT.innerHTML=(routeHash()==='login'||routeHash()==='signup'||routeHash()==='forgot')?authView(ctx):landing(ctx);
}
function go(route){if(ctx.mode&&validPages.has(route)){ui.route=route;ui.modal=null;ui.mobileMenu=false;if(location.hash!=='#'+route)location.hash=route;draw();window.scrollTo({top:0,behavior:'smooth'});return;}if(!ctx.mode){location.hash=route;draw();window.scrollTo({top:0,behavior:'smooth'});}}
function showModal(type,id=null,extra={}){ui.modal={type,id,...extra};ui.uploadFile=null;draw();setTimeout(()=>document.querySelector('.modal-dialog input:not([type="hidden"]), .modal-dialog textarea')?.focus(),60);}
function closeModal(){ui.modal=null;ui.uploadFile=null;draw();}
function localDemo(){const stored=safeJsonParse(localStorage.getItem(DEMO_KEY));return stored?normalizeWorkspace(stored):demoWorkspace()}
function update(fn){fn(ctx.w);ctx.w=normalizeWorkspace(ctx.w);persist();draw();}
function persist(){if(ctx.mode==='demo'){try{localStorage.setItem(DEMO_KEY,JSON.stringify(ctx.w));}catch{toast('Browser storage full. Export your data or remove large screenshots.','error')}return;}
 if(ctx.mode!=='cloud'||!ctx.user)return;
 clearTimeout(saveTimer);saveTimer=setTimeout(()=>void saveCloud(),750);
}
async function saveCloud(){if(ctx.mode!=='cloud'||!ctx.user)return;if(saveActive){saveAgain=true;return;}saveActive=true;const snap=JSON.parse(JSON.stringify(ctx.w));const id=ctx.user.id;try{await saveWorkspace(id,snap)}catch(error){toast(error.message||'Cloud sync failed','error')}finally{saveActive=false;if(saveAgain){saveAgain=false;void saveCloud()}}}
async function flushSaves(){if(saveTimer){clearTimeout(saveTimer);saveTimer=null;await saveCloud();}while(saveActive){await new Promise(r=>setTimeout(r,80));}}
async function init(){if(acceptRecoveryLink()){ctx.mode=null;ui.authTab='reset';history.replaceState(null,'',location.pathname+location.search+'#reset');draw();return;}const requestedMode=localStorage.getItem(MODE_KEY);const session=await authSession().catch(()=>null);
 if(session?.user){ctx.mode='cloud';ctx.user=session.user;try{ctx.w=await loadWorkspace(session.user.id);if(!ctx.w){ctx.w=freshWorkspace(session.user.email?.split('@')[0]||'Trader');await saveWorkspace(session.user.id,ctx.w)}}catch(e){ctx.w=freshWorkspace(session.user.email?.split('@')[0]||'Trader');toast('Could not load cloud data: '+e.message,'error')}}
 else if(requestedMode==='demo'){ctx.mode='demo';ctx.w=localDemo();}else{ctx.mode=null}
 const hash=routeHash();if(validPages.has(hash))ui.route=hash;
 draw();}
function handleNavHash(){const hash=routeHash();if(ctx.mode){if(validPages.has(hash)){ui.route=hash;ui.mobileMenu=false;ui.modal=null;draw()}else if(hash==='login'){ctx.mode=null;draw()}}else{if(['login','signup','forgot','reset'].includes(hash)){ui.authTab=hash;draw()}else if(hash==='home'){draw()}}}
window.addEventListener('hashchange',handleNavHash);

async function compressImage(file){if(!file.type.startsWith('image/'))throw new Error('Please choose an image file.');if(file.size>15*1024*1024)throw new Error('Image is too large (max 15 MB input).');const image=new Image();const tempUrl=URL.createObjectURL(file);try{await new Promise((res,rej)=>{image.onload=res;image.onerror=()=>rej(new Error('Could not read this image.'));image.src=tempUrl});const maxDim=1200,ratio=Math.min(1,maxDim/Math.max(image.naturalWidth,image.naturalHeight));const cvs=document.createElement('canvas');cvs.width=Math.max(1,Math.round(image.naturalWidth*ratio));cvs.height=Math.max(1,Math.round(image.naturalHeight*ratio));const cx=cvs.getContext('2d');if(!cx)throw new Error('Canvas is unavailable.');cx.fillStyle='#fff';cx.fillRect(0,0,cvs.width,cvs.height);cx.drawImage(image,0,0,cvs.width,cvs.height);let blob=await new Promise(res=>cvs.toBlob(res,'image/jpeg',.78));if(!blob)throw new Error('Image conversion failed.');if(blob.size>1900000)blob=await new Promise(res=>cvs.toBlob(res,'image/jpeg',.48));if(blob.size>2000000)throw new Error('Screenshot must be smaller than 2 MB after compression.');return blob;}finally{URL.revokeObjectURL(tempUrl)}}
async function toDataURL(blob){return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Could not read image.'));reader.readAsDataURL(blob)});}
let signedCache=new Map();
async function loadPrivateScreenshots(){if(ctx.mode!=='cloud')return;for(const img of document.querySelectorAll('img.private-shot[data-path]')){const path=img.dataset.path;if(!path)continue;try{let url=signedCache.get(path);if(!url||url.expires<Date.now()){url={src:await signedScreenshot(path),expires:Date.now()+45*60*1000};signedCache.set(path,url)}if(img.isConnected){img.src=url.src;img.parentElement?.querySelector('span')?.remove();}}catch{img.alt='Screenshot unavailable; check session.'}}}
function ask(msg){return window.confirm(msg)}
async function action(a,el){const id=el.dataset.id;
 switch(a){
 case 'navigate':go(el.dataset.route);break;
 case 'enter-demo':ctx.mode='demo';ctx.user=null;ctx.w=localDemo();localStorage.setItem(MODE_KEY,'demo');ui.accountId=ctx.w.profile.defaultAccountId;go('dashboard');break;
 case 'open-auth':ui.authTab=el.dataset.authTab||'login';ctx.mode=null;location.hash=ui.authTab;draw();break;
 case 'auth-tab':ui.authTab=el.dataset.tab;location.hash=ui.authTab;draw();break;
 case 'back-landing':location.hash='home';draw();break;
 case 'toggle-password':{const input=el.parentElement.querySelector('input');input.type=input.type==='password'?'text':'password';break;}
 case 'toggle-menu':ui.mobileMenu=!ui.mobileMenu;draw();break;
 case 'toggle-privacy':update(w=>w.profile.hideBalances=!w.profile.hideBalances);break;
 case 'add-trade':if(!ctx.w?.accounts.length){showModal('account');break;}if(!ctx.w.accounts.some(x=>accountStats(ctx.w,x).status==='active')){toast('No active account. Advance a completed challenge or add an account.','error');go('accounts');break;}showModal('trade');break;
 case 'edit-trade':showModal('edit-trade',id);break;
 case 'trade-detail':showModal('trade-detail',id);break;
 case 'delete-trade':if(ask('Delete this trade permanently?')){update(w=>w.trades=w.trades.filter(t=>t.id!==id));ui.modal=null;toast('Trade deleted');}break;
 case 'add-account':showModal('account');break;
 case 'edit-account':showModal('edit-account',id);break;
 case 'account-detail':showModal('account-detail',id);break;
 case 'delete-account':{const n=ctx.w.trades.filter(t=>t.accountId===id).length; if(ask(`Delete this account, its ${n} trades and all related withdrawals? This cannot be undone.`)){update(w=>{w.accounts=w.accounts.filter(x=>x.id!==id);w.trades=w.trades.filter(t=>t.accountId!==id);w.withdrawals=w.withdrawals.filter(x=>x.accountId!==id);});ui.modal=null;toast('Account and related records deleted');}break;}
 case 'advance-account':{const current=ctx.w.accounts.find(x=>x.id===id);if(!current||accountStats(ctx.w,current).status!=='passed'){toast('Profit target has not been reached.','error');break;}const next=current.stage==='phase1'&&current.plan==='two-step'?'phase2':'funded';if(ask(`Advance ${current.name} from ${current.stage} to ${next}? The next phase will start from zero P&L.`)){update(w=>{w.accounts.find(x=>x.id===id).stage=next});ui.modal=null;toast(`Account moved to ${next==='funded'?'funded live':next}`);}break;}
 case 'select-account':ui.accountId=id;ctx.w.profile.defaultAccountId=id;persist();go('dashboard');break;
 case 'add-withdrawal':if(!ctx.w.accounts.length){toast('Create an account first.','error');showModal('account')}else showModal('withdrawal');break;
 case 'edit-withdrawal':showModal('edit-withdrawal',id);break;
 case 'delete-withdrawal':if(ask('Delete this payout entry?')){update(w=>w.withdrawals=w.withdrawals.filter(x=>x.id!==id));toast('Withdrawal removed');}break;
 case 'add-note':showModal('note');break;
 case 'edit-note':showModal('edit-note',id);break;
 case 'delete-note':if(ask('Delete this reflection?')){update(w=>w.notes=w.notes.filter(n=>n.id!==id));toast('Reflection removed')}break;
 case 'add-goal':showModal('goal');break;
 case 'delete-goal':if(ask('Remove this goal?')){update(w=>w.goals=w.goals.filter(g=>g.id!==id));toast('Goal removed')}break;
 case 'goal-plus':update(w=>{const g=w.goals.find(x=>x.id===id);if(g)g.progress=Math.min(g.target,g.progress+1)});break;
 case 'goal-minus':update(w=>{const g=w.goals.find(x=>x.id===id);if(g)g.progress=Math.max(0,g.progress-1)});break;
 case 'calendar-prev':case 'calendar-next':{const [y,m]=ui.calendarMonth.split('-').map(Number);const d=new Date(y,m-1+(a==='calendar-prev'?-1:1),1);ui.calendarMonth=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;draw();break;}
 case 'calendar-current':ui.calendarMonth=today().slice(0,7);draw();break;
 case 'calendar-day':showModal('day-detail',null,{date:el.dataset.date});break;
 case 'search-trades':ui.tradeSearch=document.querySelector('#trade-search')?.value||'';draw();break;
 case 'close-modal':closeModal();break;
 case 'export-json':download('pp-trading-journey-backup-'+today()+'.json',JSON.stringify({app:'PP Trading Journey',exportedAt:new Date().toISOString(),workspace:ctx.w},null,2));toast('Backup downloaded');break;
 case 'reset-demo':if(ctx.mode==='demo'&&ask('Reset demo to sample data? Your local changes will be lost.')){ctx.w=demoWorkspace();ui.accountId=ctx.w.profile.defaultAccountId;persist();draw();toast('Demo reset successfully')}break;
 case 'logout':await flushSaves();if(ctx.mode==='cloud')await authLogout();ctx.mode=null;ctx.user=null;ctx.w=null;localStorage.removeItem(MODE_KEY);ui.modal=null;location.hash='home';draw();toast('You have left the workspace');break;
 }
}
ROOT.addEventListener('click',e=>{const button=e.target.closest('[data-action]');if(!button)return;const a=button.dataset.action;if(a==='close-modal' && button.classList.contains('modal-overlay')&&e.target!==button)return;e.preventDefault();void action(a,button).catch(err=>toast(err.message,'error'));});
ROOT.addEventListener('keydown',e=>{if(e.key==='Escape'&&ui.modal)closeModal();if(e.key==='Enter'&&e.target.matches('tr[data-action="trade-detail"]')){e.preventDefault();void action('trade-detail',e.target)}});
ROOT.addEventListener('change',async e=>{
 const el=e.target;
 if(el.id==='top-account-select'){ui.accountId=el.value;ctx.w.profile.defaultAccountId=el.value;persist();draw();return;}
 if(el.id==='trade-outcome'){ui.tradeOutcome=el.value;draw();return;}
 if(el.id==='trade-screenshot'){const f=el.files?.[0];if(f){if(!f.type.startsWith('image/')){toast('Only image files are accepted','error');return;}ui.uploadFile=f;const span=document.querySelector('.upload-zone span');if(span)span.textContent=`Selected: ${f.name}`;}return;}
 if(el.name==='kind'){const f=document.querySelector('.funded-fields');if(f)f.style.display=el.value==='funded'?'':'none';return;}
 if(el.id==='import-json'){const f=el.files?.[0];if(!f)return;try{if(f.size>20*1024*1024)throw new Error('Backup too large.');const text=await f.text();const data=JSON.parse(text);const w=data.workspace||data;if(!Array.isArray(w.accounts)||!Array.isArray(w.trades))throw new Error('Not a valid PP Trading Journey backup.');if(!ask('Replace your current workspace with the backup? All existing data will be overwritten.'))return;ctx.w=normalizeWorkspace(w);ui.accountId=ctx.w.profile.defaultAccountId||ctx.w.accounts[0]?.id||'';persist();draw();toast('Workspace imported successfully');}catch(err){toast(err.message||'Import failed','error')}return;}
});
ROOT.addEventListener('input',e=>{const el=e.target;if(el.id==='trade-search'){const start=el.selectionStart,end=el.selectionEnd;const value=el.value;ui.tradeSearch=value;draw();const target=document.querySelector('#trade-search');target?.focus();try{target?.setSelectionRange(start,end)}catch{}return;}if(el.id?.startsWith('risk-')){const key=el.id.slice(5);ui.risk[key]=el.value;const out=document.getElementById('risk-output');if(out)out.innerHTML=riskCalculation(ui.risk);localStorage.setItem('pptj_risk_v1',JSON.stringify(ui.risk));}});
ROOT.addEventListener('submit',async e=>{const form=e.target;if(!form.dataset.form)return;e.preventDefault();const submit=form.querySelector('button[type="submit"]');if(submit){submit.disabled=true;submit.classList.add('is-loading')}
 try {const fd=new FormData(form);const data=Object.fromEntries(fd.entries());await submitForm(form.dataset.form,data,form.dataset.id||null);}catch(err){toast(err.message||'Unable to save','error')}finally{if(submit){submit.disabled=false;submit.classList.remove('is-loading')}}});
async function submitForm(type,d,id){
 if(type==='auth'){if(!AUTH_ENABLED)throw new Error('Configure your Supabase project before using sign up / login.');if(ui.authTab==='reset'){if(String(d.password||'').length<6)throw new Error('Choose a password with at least 6 characters.');await authUpdatePassword(String(d.password));await authLogout();ui.authTab='login';location.hash='login';draw();toast('Password updated. Sign in with your new password.');return;}const email=String(d.email||'').trim();if(ui.authTab==='forgot'){await authForgot(email);toast('If that email is registered, you will receive reset instructions.');ui.authTab='login';location.hash='login';draw();return;}
 if(ui.authTab==='signup'){const response=await authSignUp(email,String(d.password||''));if(!response.access_token){toast('Account created. Please confirm your email, then log in.');ui.authTab='login';location.hash='login';draw();return;}}
 else await authLogin(email,String(d.password||''));
 const s=await authSession();if(!s)throw new Error('Unable to confirm your new session.');ctx.user=s.user;ctx.mode='cloud';localStorage.setItem(MODE_KEY,'cloud');ctx.w=await loadWorkspace(s.user.id);if(!ctx.w){ctx.w=freshWorkspace(email.split('@')[0]);await saveWorkspace(s.user.id,ctx.w)}ui.accountId=ctx.w.profile.defaultAccountId||ctx.w.accounts[0]?.id||'';ui.modal=null;go('dashboard');toast('Welcome to your private workspace');return;}
 if(type==='profile'){update(w=>{w.profile.name=String(d.name||'Trader').trim().slice(0,60);w.profile.hideBalances=d.hideBalances==='on';w.profile.compact=d.compact==='on'});toast('Preferences saved');return;}
 if(type==='account'){if(!String(d.name||'').trim())throw new Error('Account name is required.');if(!(Number(d.size)>0))throw new Error('Enter a valid starting balance.');const kind=d.kind||'funded';const plan=d.plan||'two-step';const a={name:String(d.name).trim(),broker:String(d.broker||'').trim(),kind,plan:kind==='funded'?plan:'',size:Number(d.size),currency:d.currency||'USD',profitTargetPct:Number(d.profitTargetPct)||0,phase2TargetPct:Number(d.phase2TargetPct)||0,dailyLossPct:Number(d.dailyLossPct)||0,maxLossPct:Number(d.maxLossPct)||0,cost:Number(d.cost)||0};
 if(id){update(w=>{const item=w.accounts.find(x=>x.id===id);if(item)Object.assign(item,a)});toast('Account updated');}else{a.id=uuid();a.stage=kind!=='funded'?'live':plan==='instant'?'funded':'phase1';a.createdAt=today();update(w=>{w.accounts.push(a);w.profile.defaultAccountId=a.id});ui.accountId=a.id;toast('Account created successfully')}ui.modal=null;draw();return;}
 if(type==='trade'){const account=ctx.w.accounts.find(a=>a.id===d.accountId);if(!account)throw new Error('Select a valid account.');if(!id&&accountStats(ctx.w,account).status!=='active')throw new Error('This account has reached a target or limit. Advance the phase or use an active account.');if(!String(d.symbol||'').trim())throw new Error('Enter the instrument name.');if(!Number.isFinite(Number(d.result)))throw new Error('Enter a valid profit/loss.');const existing=ctx.w.trades.find(t=>t.id===id);const tradeId=id||uuid();let screenshot=existing?.screenshot||'',screenshotPath=existing?.screenshotPath||'';
 if(ui.uploadFile){const blob=await compressImage(ui.uploadFile);if(ctx.mode==='cloud'){screenshotPath=await uploadScreenshot(blob,ctx.user.id,tradeId);screenshot='';}else{screenshot=await toDataURL(blob);screenshotPath='';}}
 const risk=Number(d.risk)||0;const result=Number(d.result);const item={id:tradeId,accountId:account.id,phase:existing?.phase||account.stage,date:d.date||today(),createdAt:existing?.createdAt||new Date().toISOString(),symbol:String(d.symbol).trim().toUpperCase().slice(0,30),direction:d.direction,session:d.session,setup:d.setup,result,risk,rr:d.rr!==''?Number(d.rr):(risk?Number((result/risk).toFixed(2)):0),fees:Number(d.fees)||0,entryPrice:d.entryPrice||'',exitPrice:d.exitPrice||'',stopLoss:d.stopLoss||'',takeProfit:d.takeProfit||'',lotSize:d.lotSize||'',emotion:d.emotion||'Neutral',followedPlan:d.followedPlan==='on',notes:String(d.notes||'').slice(0,5000),screenshot,screenshotPath};
 update(w=>{if(id){const ix=w.trades.findIndex(t=>t.id===id);if(ix>=0)w.trades[ix]=item}else w.trades.push(item)});ui.modal=null;ui.uploadFile=null;draw();toast(id?'Trade updated':'Trade saved to journal');return;}
 if(type==='withdrawal'){if(!ctx.w.accounts.some(a=>a.id===d.accountId))throw new Error('Choose an account.');if(!(Number(d.amount)>0))throw new Error('Amount must be greater than zero.');const item={id:id||uuid(),accountId:d.accountId,date:d.date||today(),amount:Number(d.amount),status:d.status||'Requested',note:String(d.note||'').slice(0,200)};update(w=>{if(id){const ix=w.withdrawals.findIndex(x=>x.id===id);if(ix>=0)w.withdrawals[ix]=item}else w.withdrawals.push(item)});ui.modal=null;draw();toast('Payout saved');return;}
 if(type==='note'){if(!String(d.title||'').trim()||!String(d.body||'').trim())throw new Error('Title and reflection are required.');const item={id:id||uuid(),date:d.date||today(),title:String(d.title).slice(0,110),body:String(d.body).slice(0,10000),mood:d.mood||'Reflective'};update(w=>{if(id){const ix=w.notes.findIndex(x=>x.id===id);if(ix>=0)w.notes[ix]=item}else w.notes.push(item)});ui.modal=null;draw();toast('Reflection saved');return;}
 if(type==='goal'){if(!String(d.title||'').trim()||!(Number(d.target)>0))throw new Error('Enter a goal title and target.');update(w=>w.goals.push({id:uuid(),title:String(d.title).slice(0,100),target:Math.floor(Number(d.target)),progress:0,unit:String(d.unit||'sessions').slice(0,30)}));ui.modal=null;draw();toast('New goal created');return;}
}
void init();
