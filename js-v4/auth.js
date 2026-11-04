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
async function usernameRequest(action,body){
  const response=await api('/functions/v1/username-auth','POST',{action,...body});
  return response;
}
export async function usernameAvailable(username){return (await usernameRequest('available',{username})).available}
export async function authLogin(username,password){
  const res=await usernameRequest('login',{username,password});saveSession(res.session);return res.session;
}
export async function authSignUp(username,name,password,confirmPassword){
  const res=await usernameRequest('register',{username,name,password,confirmPassword});if(res.session)saveSession(res.session);return res;
}
export async function authRecover(username,recoveryKey,newPassword,confirmPassword){
  return await usernameRequest('recover',{username,recoveryKey,newPassword,confirmPassword});
}
// Older Supabase email reset URLs are not used by V3 username-only accounts.
export function acceptRecoveryLink(){return false;}
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
