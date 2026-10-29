/* Pages that aren't public.

   Only two doors on this site are open to anyone: each firm's link (activation.knomee.com/<firm>, behind that
   firm's own welcome screen) and the editor (index.html?edit=1, behind the editor password). Everything else —
   the original toolkits, the older decks, a firm page opened without a firm — asks for the editor password
   first. A browser that has already unlocked the editor sees the page at once; anyone else gets a
   "Knomee team only" card.

   It is the editor's own token (localStorage 'knomee-edit-token' = sha256('knomee-edit:' + password), checked
   against GATE = sha256(token)), so one unlock opens both, and the password itself is never in the source. Like
   the editor's lock, this stops casual access only: the site is static. Inside the editor shell, and on the way
   there (?edit=1), the shell's own lock already covers the page.

   Loaded first in <head>. On a firm page (data-firm-page) with a firm set, the firm's welcome screen covers it
   instead; firm.js calls ktLock() if that firm turns out not to exist. */
(function(){
  var GATE='84a5c1b87a7af5fedd739eae37d286a5d79854d70f54048a700e61ad9caa0c42';
  var me=document.currentScript, firmPage=!!(me && me.hasAttribute('data-firm-page'));
  var q=new URLSearchParams(location.search), root=document.documentElement;

  function sha(s){ return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(b){ return Array.prototype.map.call(new Uint8Array(b),function(x){ return ('0'+x.toString(16)).slice(-2); }).join(''); }); }
  function whenReady(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded',fn); }
  function token(){ try{ return localStorage.getItem('knomee-edit-token'); }catch(e){ return null; } }

  var css='html.kt-locked body>:not(.kt-gate){visibility:hidden!important}'+
    'html.kt-locked,html.kt-locked body{overflow:hidden!important}'+
    '.kt-gate{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:16px;background:#240446;font-family:Poppins,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}'+
    '.kt-card{width:100%;max-width:360px;box-sizing:border-box;background:#fff;border-radius:16px;padding:28px 24px 22px;box-shadow:0 24px 60px rgba(0,0,0,.35);text-align:left}'+
    '.kt-title{margin:0 0 6px;font-size:20px;font-weight:800;color:#1E1A28}'+
    '.kt-sub{margin:0 0 18px;font-size:14px;line-height:1.45;color:#6E6880}'+
    '.kt-card input{width:100%;box-sizing:border-box;font:inherit;font-size:15px;padding:11px 14px;color:#1E1A28;border:1.5px solid rgba(20,10,40,.16);border-radius:10px;outline:none}'+
    '.kt-card input:focus{border-color:#4A1C72;box-shadow:0 0 0 3px rgba(74,28,114,.14)}'+
    '.kt-card button{width:100%;margin-top:12px;font:inherit;font-size:15px;font-weight:700;padding:11px 14px;border:0;border-radius:999px;background:#2DD2B0;color:#06403A;cursor:pointer}'+
    '.kt-card button:hover{filter:brightness(1.05)}'+
    '.kt-card button:focus-visible{outline:2px solid #1E1A28;outline-offset:2px}'+
    '.kt-err{min-height:18px;margin-top:10px;font-size:13px;color:#B3261E}'+
    '.kt-note{margin:4px 0 0;font-size:13px;line-height:1.45;color:#6E6880}';

  function lock(){
    if(root.classList.contains('kt-locked')) return;
    root.classList.add('kt-locked');
    var st=document.createElement('style'); st.textContent=css; (document.head||root).appendChild(st);
  }
  function open(){
    root.classList.remove('kt-locked');
    var g=document.querySelector('.kt-gate'); if(g) g.remove();
  }
  function ask(){
    if(document.querySelector('.kt-gate')) return;
    var g=document.createElement('div'); g.className='kt-gate';
    g.setAttribute('role','dialog'); g.setAttribute('aria-modal','true'); g.setAttribute('aria-labelledby','ktTitle');
    g.innerHTML=
      '<form class="kt-card" novalidate>'+
        '<div class="kt-title" id="ktTitle" role="heading" aria-level="1">Knomee team only</div>'+
        '<p class="kt-sub">This page isn’t public. Enter the editor password to open it.</p>'+
        '<input type="password" id="ktPw" placeholder="Password" aria-label="Editor password" autocomplete="current-password">'+
        '<button type="submit">Open</button>'+
        '<div class="kt-err" id="ktErr" role="alert"></div>'+
        '<p class="kt-note">Advisors: use the toolkit link your firm sent you.</p>'+
      '</form>';
    document.body.appendChild(g);
    var pw=g.querySelector('#ktPw'), err=g.querySelector('#ktErr');
    pw.focus();
    pw.addEventListener('input',function(){ err.textContent=''; });
    g.querySelector('form').addEventListener('submit',function(e){
      e.preventDefault();
      if(!pw.value){ pw.focus(); return; }
      var t;
      try{
        sha('knomee-edit:'+pw.value).then(function(h){ t=h; return sha(h); }).then(function(h){
          if(h!==GATE){ err.textContent='That password isn’t right.'; pw.select(); return; }
          try{ localStorage.setItem('knomee-edit-token',t); }catch(x){}
          open();
        });
      }catch(x){ err.textContent='This needs a secure (https) connection.'; }
    });
  }
  /* firm.js: the firm in the link has no config, so the page is nobody's — lock it */
  window.ktLock=function(){ check(); };

  /* Hidden until the token is checked: an unlocked browser never sees the card, anyone else gets it. */
  function check(){
    var t=token();
    lock();
    if(!t){ whenReady(ask); return; }
    try{ sha(t).then(function(h){ if(h===GATE) open(); else whenReady(ask); }, function(){ whenReady(ask); }); }
    catch(e){ whenReady(ask); }
  }

  try{ if(window.top!==window.self && window.top.location.origin===location.origin) return; }catch(e){}
  if(q.get('edit')==='1') return;
  if(firmPage){
    var f=(q.get('firm')||'').toLowerCase();
    if(!f){ try{ f=localStorage.getItem('knomee-toolkit-firm')||''; }catch(e){} }
    if(f && f!=='none') return;
  }
  check();
})();
