/**
 * PP Trading Journey V3 - no-email username/password identity.
 * Deploy with Supabase Edge Functions, do not put service_role on the website.
 * This Edge Function is public (verify_jwt=false) for signup/login/recovery.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

const URL = Deno.env.get('SUPABASE_URL') || '';
const ANON = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const admin = createClient(URL, SERVICE, {auth:{autoRefreshToken:false,persistSession:false}});
const publicClient = createClient(URL, ANON, {auth:{autoRefreshToken:false,persistSession:false}});
const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(payload:unknown,status=200)=>new Response(JSON.stringify(payload),{status,headers:cors});
const normalize=(value:unknown)=>String(value||'').trim().toLowerCase();
const validUser=(u:string)=>/^[a-z][a-z0-9_]{2,23}$/.test(u);
const validPassword=(p:string)=>p.length>=10 && p.length<=128;
const keyBytes=()=>{const arr=crypto.getRandomValues(new Uint8Array(32));return `PPJ-${[...arr].map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase()}`;};
const digest=async(v:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const validKey=(v:string)=>/^PPJ-[A-F0-9]{64}$/.test(v);

// Username + source-IP throttle. Not a full anti-bot service; add CAPTCHA if offering public registration.
async function rateLimit(action:string,username:string,req:Request){
  const ip=(req.headers.get('cf-connecting-ip')||req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim().slice(0,64);
  const keys=[`u:${action}:${username}`,`ip:${action}:${await digest(ip)}`];
  for(const k of keys){
    const {data}=await admin.from('pp_auth_throttle').select('count,window_until').eq('throttle_key',k).maybeSingle();
    const fresh=!data||Date.parse(data.window_until)<Date.now();
    const count=fresh?1:Number(data.count||0)+1;
    if(count>(action==='login'?20:action==='available'?45:action==='register'?8:8))throw new Error('Too many attempts. Try again later.');
    const windowUntil=fresh?new Date(Date.now()+15*60*1000).toISOString():data.window_until;
    await admin.from('pp_auth_throttle').upsert({throttle_key:k,count,window_until:windowUntil});
  }
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response(null,{headers:cors});
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  if(!URL||!ANON||!SERVICE)return reply({error:'Authentication backend not configured'},503);
  try{
    if(Number(req.headers.get('content-length')||0)>10_000)return reply({error:'Request too large'},413);
    const b=await req.json();
    const action=String(b?.action||'');
    const username=normalize(b?.username);
    if(!validUser(username))return reply({error:'Username: 3–24 letters, numbers or underscores; start with a letter.'},400);
    if(!['available','register','login','recover'].includes(action))return reply({error:'Invalid action'},400);
    await rateLimit(action,username,req);
    const {data:record,error:lookErr}=await admin.from('pp_username_accounts').select('user_id,username,auth_email,recovery_digest').eq('username',username).maybeSingle();
    if(lookErr)return reply({error:'Account lookup unavailable. Check SQL setup.'},503);
    if(action==='available')return reply({available:!record});
    if(action==='register'){
      const name=String(b?.name||'').trim().slice(0,60);
      const password=String(b?.password||'');
      if(name.length<2)return reply({error:'Enter your display name (at least 2 characters).'},400);
      if(!validPassword(password))return reply({error:'Use a password of 10–128 characters.'},400);
      if(password!==String(b?.confirmPassword||''))return reply({error:'Passwords do not match.'},400);
      if(record)return reply({error:'Username is not available.'},409);
      const email=`${crypto.randomUUID()}@users.pptrading.example`;
      const {data:created,error:createError}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{username,name}});
      if(createError||!created.user?.id)return reply({error:'Could not create account. Try again.'},400);
      const recoveryKey=keyBytes();
      const {error:insertErr}=await admin.from('pp_username_accounts').insert({username,user_id:created.user.id,auth_email:email,recovery_digest:await digest(recoveryKey)});
      if(insertErr){await admin.auth.admin.deleteUser(created.user.id);return reply({error:insertErr.code==='23505'?'Username is not available.':'Could not save username. Try again.'},insertErr.code==='23505'?409:503);}
      const {data:signIn,error:loginErr}=await publicClient.auth.signInWithPassword({email,password});
      // Never discard the recovery key even if immediate auto-login is unavailable.
      return reply({session:loginErr?null:signIn.session,recoveryKey,requiresLogin:!!loginErr||!signIn.session,user:{id:created.user.id,username,name}});
    }
    if(action==='login'){
      const password=String(b?.password||'');
      if(!record||!password)return reply({error:'Incorrect username or password.'},401);
      const {data,error}=await publicClient.auth.signInWithPassword({email:record.auth_email,password});
      if(error||!data.session)return reply({error:'Incorrect username or password.'},401);
      return reply({session:data.session});
    }
    if(action==='recover'){
      const recoveryKey=String(b?.recoveryKey||'').replace(/\s/g,'').toUpperCase();
      const password=String(b?.newPassword||'');
      if(!validPassword(password)||password!==String(b?.confirmPassword||''))return reply({error:'New passwords must match and be at least 10 characters.'},400);
      if(!validKey(recoveryKey)||!record||await digest(recoveryKey)!==record.recovery_digest)return reply({error:'Username or recovery key is incorrect.'},401);
      const {error}=await admin.auth.admin.updateUserById(record.user_id,{password});
      if(error)return reply({error:'Could not reset password.'},503);
      // Immediately rotate the recovery key; old key is invalid after use.
      const nextRecoveryKey=keyBytes();
      const {error:rotateError}=await admin.from('pp_username_accounts').update({recovery_digest:await digest(nextRecoveryKey)}).eq('user_id',record.user_id);
      if(rotateError)return reply({error:'Password updated, but recovery-key rotation failed. Contact your administrator.'},503);
      return reply({updated:true,recoveryKey:nextRecoveryKey});
    }
    return reply({error:'Invalid request'},400);
  }catch(e){const message=e instanceof Error?e.message:'Request failed';return reply({error:message.startsWith('Too many attempts')?message:'Unable to complete request.'},message.startsWith('Too many attempts')?429:400);}
});
