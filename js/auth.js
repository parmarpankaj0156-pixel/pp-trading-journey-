import {AUTH_ENABLED,SUPABASE_URL,SUPABASE_ANON_KEY} from './config.js';
import { normalizeWorkspace } from './data.js';

const BASE=SUPABASE_URL.replace(/\/$/,'');
const SESSION_KEY='pptj_auth_session_v1';
const hdr=(token)=>({'Content-Type':'application/json','apikey':SUPABASE_ANON_KEY,...(token?{'Authorization':`Bearer ${token}`}:{})});
async function api(path,method='GET',body,token){
  if(!AUTH_ENABLED) throw new Error('Cloud authentication is not configured. See README.md.');
  const response=await fetch(BASE+path,{method,headers:hdr(token),...(body!==undefined?{body:JSON.stringify(body)}:{})});
  let payload;try{payload=await response.json()}catch{payload=null}
  if(!response.ok) throw new Error(payload?.msg||payload?.message||payload?.error_description||payload?.error||`Request failed (${response.status})`);
  return payload;
}
export const readSession=()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}};
export const saveSession=s=>s?localStorage.setItem(SESSION_KEY,JSON.stringify(s)):localStorage.removeItem(SESSION_KEY);
export async function authLogin(email,password){const res=await api('/auth/v1/token?grant_type=password','POST',{email,password});saveSession(res);return res;}
export async function authSignUp(email,password){const res=await api('/auth/v1/signup','POST',{email,password});if(res.access_token)saveSession(res);return res;}
export async function authForgot(email){const url=encodeURIComponent(window.location.href.split('#')[0]);return api('/auth/v1/recover?redirect_to='+url,'POST',{email});}
export async function authUpdatePassword(password){const s=readSession();if(!s?.access_token)throw new Error('Reset link session expired. Request a new link.');return api('/auth/v1/user','PUT',{password},s.access_token);}
export function acceptRecoveryLink(){const p=new URLSearchParams(window.location.hash.slice(1));if(p.get('type')!=='recovery'||!p.get('access_token'))return false;saveSession({access_token:p.get('access_token'),refresh_token:p.get('refresh_token'),expires_at:Math.floor(Date.now()/1000)+Number(p.get('expires_in')||3600),token_type:'bearer'});return true;}
export async function authLogout(){const s=readSession();if(s?.access_token){try{await api('/auth/v1/logout','POST',undefined,s.access_token)}catch{}} saveSession(null);}
export async function authSession(){
  let s=readSession();if(!s || !AUTH_ENABLED)return null;
  if(s.expires_at && Date.now()/1000>s.expires_at-75){try{s=await api('/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:s.refresh_token});saveSession(s);}catch{saveSession(null);return null}}
  try {const user=await api('/auth/v1/user','GET',undefined,s.access_token); return {session:s,user};} catch {saveSession(null);return null;}
}
async function token(){ const verified=await authSession();if(!verified)throw new Error('Session expired. Sign in again.');return verified.session.access_token; }
export async function loadWorkspace(userId){
  const res=await api(`/rest/v1/user_workspaces?user_id=eq.${encodeURIComponent(userId)}&select=data`,'GET',undefined,await token());
  return Array.isArray(res)&&res[0]?.data?normalizeWorkspace(res[0].data):null;
}
export async function saveWorkspace(userId,workspace){
  const access=await token();
  const resp=await fetch(BASE+'/rest/v1/user_workspaces?on_conflict=user_id',{method:'POST',headers:{...hdr(access),'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:userId,data:workspace,updated_at:new Date().toISOString()})});
  if(!resp.ok){let err={};try{err=await resp.json()}catch{}throw new Error(err.message||`Cloud save failed: ${resp.status}`)}
}
export async function uploadScreenshot(file,userId,tradeId){
  const access=await token();
  const path=`${userId}/${tradeId}-${Date.now()}.jpg`;
  const resp=await fetch(`${BASE}/storage/v1/object/trade-screenshots/${path}`,{method:'POST',headers:{'apikey':SUPABASE_ANON_KEY,'Authorization':`Bearer ${access}`,'Content-Type':'image/jpeg','x-upsert':'false'},body:file});
  if(!resp.ok){let err={};try{err=await resp.json()}catch{}throw new Error(err.message||'Screenshot upload failed. Check Supabase Storage setup.')}
  return path;
}
export async function signedScreenshot(path){
  const access=await token();
  const res=await api(`/storage/v1/object/sign/trade-screenshots/${path}`,'POST',{expiresIn:3600},access);
  const signed=res.signedURL||res.signedUrl||'';
  if(signed.startsWith('http')) return signed;
  return signed.startsWith('/storage/v1/')?BASE+signed:BASE+'/storage/v1'+(signed.startsWith('/')?signed:'/'+signed);
}
