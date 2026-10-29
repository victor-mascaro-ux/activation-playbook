/* Pages that aren't public.

   Only two doors on this site are open to anyone: each firm's link (activation.knomee.com/<firm>, behind that
   firm's own welcome screen) and the editor (index.html?edit=1, behind the editor password). Everything else —
   the original toolkits, the older decks, a firm page opened without a firm — is closed: a card says the page isn't
   public and asks for nothing. The Knomee team opens these pages in the editor, which keeps the one password
   (Victor, 2026-10-29: the password screen belongs to the editable version only).

   Inside the editor shell, and on the way there (?edit=1, which each page sends to the shell's lock unless ?raw=1),
   the page shows as usual. Like the editor's lock, this stops casual access only: the site is static and its source is public.

   Loaded first in <head>. On a firm page (data-firm-page) with a firm set, the firm's welcome screen covers it
   instead; firm.js calls ktLock() if that firm turns out not to exist. */
(function(){
  var me=document.currentScript, firmPage=!!(me && me.hasAttribute('data-firm-page'));
  var q=new URLSearchParams(location.search), root=document.documentElement;
  var EDITABLE=['home.html','prospect-playbook.html','client-playbook.html','recruit-playbook.html','knomee_playbook.html'];

  /* the editor's unlock used to live in localStorage and last forever; it's a session cookie now (index.html) */
  try{ localStorage.removeItem('knomee-edit-token'); }catch(e){}

  function whenReady(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded',fn); }

  var css='html.kt-locked body>:not(.kt-gate){visibility:hidden!important}'+
    'html.kt-locked,html.kt-locked body{overflow:hidden!important}'+
    '.kt-gate{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:16px;background:#240446;font-family:Poppins,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}'+
    '.kt-card{width:100%;max-width:360px;box-sizing:border-box;background:#fff;border-radius:16px;padding:28px 24px 24px;box-shadow:0 24px 60px rgba(0,0,0,.35);text-align:left}'+
    '.kt-title{margin:0 0 6px;font-size:20px;font-weight:800;color:#1E1A28}'+
    '.kt-sub{margin:0;font-size:14px;line-height:1.45;color:#6E6880}'+
    '.kt-team{display:inline-block;margin-top:18px;font-size:13px;font-weight:600;color:#4A1C72;text-decoration:none}'+
    '.kt-team:hover{text-decoration:underline}'+
    '.kt-team:focus-visible{outline:2px solid #4A1C72;outline-offset:2px;border-radius:4px}';

  function close(){
    if(root.classList.contains('kt-locked')) return;
    root.classList.add('kt-locked');
    var st=document.createElement('style'); st.textContent=css; (document.head||root).appendChild(st);
    whenReady(function(){
      if(document.querySelector('.kt-gate')) return;
      var file=location.pathname.split('/').pop()||'home.html';
      var editor='index.html?'+(EDITABLE.indexOf(file)>=0 ? 'page='+file+'&' : '')+'edit=1';
      var g=document.createElement('div'); g.className='kt-gate';
      g.setAttribute('role','dialog'); g.setAttribute('aria-modal','true'); g.setAttribute('aria-labelledby','ktTitle');
      g.innerHTML=
        '<div class="kt-card">'+
          '<div class="kt-title" id="ktTitle" role="heading" aria-level="1">This page isn’t public</div>'+
          '<p class="kt-sub">Advisors: open the toolkit link your firm sent you.</p>'+
          '<a class="kt-team" href="'+editor+'">Knomee team: open it in the editor →</a>'+
        '</div>';
      document.body.appendChild(g);
    });
  }
  /* firm.js: the firm in the link has no config, so the page is nobody's — close it */
  window.ktLock=close;

  try{ if(window.top!==window.self && window.top.location.origin===location.origin) return; }catch(e){}
  /* ?edit=1 goes on to the shell's lock; with ?raw=1 it stays here, so it gets the card like any other visit */
  if(q.get('edit')==='1' && q.get('raw')!=='1') return;
  /* The original toolkits stay open to everyone: advisors use them every day (Victor, 2026-10-29, after closing
     them locked those advisors out). Only a firm page opened without a firm is closed. */
  if(!firmPage) return;
  var f=(q.get('firm')||'').toLowerCase();
  if(!f){ try{ f=localStorage.getItem('knomee-toolkit-firm')||''; }catch(e){} }
  if(f && f!=='none') return;
  close();
})();
