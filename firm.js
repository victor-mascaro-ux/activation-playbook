/* Firm editions (toolkits.html and the *-toolkit.html pages, built by tools/build_firm_pages.py).
   Loaded in <head>, after Firebase, with data-kit naming the page.

   The firm comes from the link (?firm=<slug>; the /<slug> short links redirect here) and is remembered in this
   browser, so a bookmarked plain link still counts for that firm. ?firm=none forgets it.

   Branding follows knomee-demo's white-label pattern: the firm's colour on the top bar only, its white logo where
   the knomee mark was, and a "powered by knomee" credit fixed to the bottom-left corner (firms/<slug>.json).

   A firm with a "gate" in its config opens on a welcome screen in its own brand that asks for its password, once per
   browser. The config holds sha256(token), the browser keeps token = sha256('knomee-firm:<slug>:' + password), so
   neither the page nor the config carries the password. Like the editor's password, this only stops casual
   access: the site is static. Inside the commenting shell (same origin, already behind the editor password) the
   welcome screen is skipped. tools/firm_password.py sets or changes a firm's password.

   Usage events (tkTrack) carry the firm, the page, a random id for this browser and one for this visit — never a
   name, email or link. Nothing is recorded in the editor, inside the commenting shell, or in a browser opted out
   with ?notrack=1 (?notrack=0 opts back in). Browsers that unlocked the editor are tagged staff, local servers
   env 'dev'. */
(function(){
  var KIT=(document.currentScript && document.currentScript.getAttribute('data-kit')) || 'unknown';
  var q=new URLSearchParams(location.search);
  function store(k,v){ try{ if(v===undefined) return localStorage.getItem(k); if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){} return null; }
  function rid(){ return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2)); }

  /* ── which firm ── */
  var FIRM=(q.get('firm')||'').toLowerCase().replace(/[^a-z0-9-]/g,'');
  if(FIRM==='none'){ store('knomee-toolkit-firm',null); FIRM=''; }
  else if(FIRM){ store('knomee-toolkit-firm',FIRM); }
  else { FIRM=store('knomee-toolkit-firm')||''; }
  window.TK_FIRM=FIRM;
  var KEY='knomee-firm-key:'+FIRM;
  var inShell=(function(){ try{ return window.top!==window.self && window.top.location.origin===location.origin; }catch(e){ return false; } })();
  if(FIRM){
    document.documentElement.classList.add('firm-pending');
    /* until the config says whether this firm has a password, a browser that hasn't unlocked it sees nothing */
    if(!inShell && !store(KEY)) document.documentElement.classList.add('firm-gate-check');
  }

  /* ── usage events ── */
  if(q.get('notrack')==='1') store('knomee-toolkit-notrack','1');
  if(q.get('notrack')==='0') store('knomee-toolkit-notrack',null);
  var off = window.top!==window.self || /[?&]edit=1/.test(location.search) || store('knomee-toolkit-notrack')==='1';
  var vid = store('knomee-toolkit-vid'); if(!vid){ vid=rid(); store('knomee-toolkit-vid',vid); }
  var base = {
    firm: FIRM||'unknown', kit:KIT, vid:vid, sid:rid(),
    env: /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname) ? 'dev' : 'live',
    staff: !!store('knomee-edit-token'),
    device: window.matchMedia('(max-width:820px)').matches ? 'mobile' : 'desktop'
  };
  var events=null;
  function col(){
    if(events) return events;
    try{
      var cfg={apiKey:"AIzaSyBqmxrO__M6mGypXsxQ_HgCu81qs8mXe90",authDomain:"knomee-playbook.firebaseapp.com",projectId:"knomee-playbook",storageBucket:"knomee-playbook.firebasestorage.app",messagingSenderId:"956493019959",appId:"1:956493019959:web:13f099b4ea42ef948d78b2"};
      if(!firebase.apps.length) firebase.initializeApp(cfg);
      events=firebase.firestore().collection('toolkit-events');
    }catch(e){ console.warn('usage events unavailable',e); }
    return events;
  }
  window.tkTrack=function(type,data){
    if(off) return;
    var ev={type:type};
    Object.keys(base).forEach(function(k){ ev[k]=base[k]; });
    Object.keys(data||{}).forEach(function(k){ if(data[k]!=null) ev[k]=data[k]; });
    var c=col(); if(!c) return;
    ev.at=firebase.firestore.FieldValue.serverTimestamp();
    c.add(ev).catch(function(e){ console.warn('usage event not saved',e); });
  };
  /* via: link = opened from the firm's link, remembered = plain link in a browser that had the firm link before */
  tkTrack('open',{via: q.get('firm') ? 'link' : (FIRM ? 'remembered' : 'none')});

  /* ── firm branding ── */
  /* tkFill: the page's editor runs every live edit through this before showing it, so an edit made on the live
     page that says {{Firm Name}} arrives here with the firm's name in it. It passes text through untouched until
     the firm has loaded. */
  window.tkFill=function(html){ return html; };
  if(!FIRM) return;
  function whenReady(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded',fn); }
  function ready(){ document.documentElement.classList.remove('firm-pending'); }
  function each(sel,fn){ Array.prototype.forEach.call(document.querySelectorAll(sel),fn); }
  setTimeout(ready,1500);

  function apply(f){
    var name=f.name||FIRM, root=document.documentElement;
    if(f.color) root.style.setProperty('--firm', f.color);
    root.classList.add('firm-on');
    each('[data-firm-bar]',function(b){ b.classList.add('firm'); if(f.logo) b.classList.add('has-logo'); });
    if(f.logo) each('[data-firm-logo]',function(img){ img.src=f.logo; img.alt=name; });
    each('[data-firm-name]',function(el){ el.textContent=name; });
    each('[data-firm-eyebrow]',function(el){ el.textContent=name+' · Activation Toolkit'; });
    each('[data-firm-footer]',function(el){ el.textContent='Prepared for '+name+' · '; });
    window.TK_TITLE=name; document.title=document.title.replace('Knomee — ', name+' — ');
    var html=String(name).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });
    window.tkFill=function(s){
      if(typeof s!=='string') return s;
      s=s.split('{{Firm Name}}').join(html);
      return f.domain ? s.split('@acme.com').join('@'+f.domain) : s;
    };

    /* the pages and templates already say {{Firm Name}} and advisor@acme.com — fill in this firm */
    var w=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
    while((n=w.nextNode())){
      var t=n.nodeValue, u=t.split('{{Firm Name}}').join(name);
      if(f.domain) u=u.split('@acme.com').join('@'+f.domain);
      if(u!==t) n.nodeValue=u;
    }

    if(f.brand!=='white'){
      var c=document.createElement('span'); c.className='powered-by';
      c.innerHTML='<span class="powered-by-text">powered by</span><img class="powered-by-logo" src="knomee-logo-plum.svg" alt="knomee">';
      document.body.appendChild(c);
    }
  }

  /* ── the welcome screen (firms with a password) ── */
  function sha(s){ return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(b){ return Array.prototype.map.call(new Uint8Array(b),function(x){ return ('0'+x.toString(16)).slice(-2); }).join(''); }); }
  function reveal(){ var r=document.documentElement; r.classList.remove('firm-gate-check'); r.classList.remove('firm-locked'); }

  function gate(f){
    if(!f.gate || inShell){ reveal(); return; }
    var t=store(KEY);
    (t ? sha(t) : Promise.resolve('')).then(function(h){
      if(h===f.gate){ reveal(); return; }
      if(t) store(KEY,null); /* the password changed since this browser unlocked */
      showGate(f);
    });
  }

  function showGate(f){
    var name=f.name||FIRM, safe=String(name).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });
    var root=document.documentElement; root.classList.add('firm-locked'); root.classList.remove('firm-gate-check');
    var g=document.createElement('div'); g.className='firm-gate';
    g.setAttribute('role','dialog'); g.setAttribute('aria-modal','true'); g.setAttribute('aria-labelledby','fgTitle');
    g.innerHTML=
      '<div class="fg-main">'+
        (f.logo ? '<img class="fg-logo" src="'+f.logo+'" alt="'+safe+'">' : '<div class="fg-name">'+safe+'</div>')+
        '<form class="fg-card" novalidate>'+
          /* a div rather than an h1: the main page styles every h1 (hidden until its entrance animation) */
          '<div class="fg-title" id="fgTitle" role="heading" aria-level="1">Welcome to your Activation Toolkits</div>'+
          '<p class="fg-sub">Enter the password '+safe+' shared with you.</p>'+
          '<label class="fg-label" for="fgPass">Password</label>'+
          '<input class="fg-input" id="fgPass" type="password" autocomplete="current-password" placeholder="Enter your password">'+
          '<p class="fg-error" id="fgError" role="alert"></p>'+
          '<button class="fg-continue" type="submit">Continue<svg viewBox="0 0 10 10" width="8" height="8" aria-hidden="true"><path d="M2 1l6 4-6 4z" fill="currentColor"/></svg></button>'+
        '</form>'+
      '</div>'+
      (f.brand!=='white' ? '<div class="fg-foot"><span class="fg-credit"><span class="powered-by-text">powered by</span><img class="powered-by-logo" src="knomee-logo-plum.svg" alt="knomee"></span></div>' : '');
    document.body.appendChild(g);
    tkTrack('gate');
    var input=g.querySelector('#fgPass'), err=g.querySelector('#fgError'), btn=g.querySelector('.fg-continue');
    input.focus();
    input.addEventListener('input',function(){ err.textContent=''; input.removeAttribute('aria-invalid'); });
    g.querySelector('form').addEventListener('submit',function(e){
      e.preventDefault();
      var pw=input.value; if(!pw){ input.focus(); return; }
      btn.disabled=true;
      sha('knomee-firm:'+FIRM+':'+pw).then(function(t){ return sha(t).then(function(h){ return [t,h]; }); }).then(function(th){
        btn.disabled=false;
        if(th[1]!==f.gate){
          err.textContent='That password doesn’t match. Check it and try again.';
          input.setAttribute('aria-invalid','true'); input.select();
          return;
        }
        store(KEY,th[0]);
        tkTrack('unlock');
        g.classList.add('is-leaving'); reveal();
        setTimeout(function(){ g.remove(); },400);
      });
    });
  }

  fetch('firms/'+FIRM+'.json',{cache:'no-cache'})
    .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(f){ return new Promise(function(done){ whenReady(function(){ apply(f); gate(f); done(); }); }); })
    .catch(function(e){ console.warn('firm "'+FIRM+'" not found',e); whenReady(reveal); })
    .then(function(){ whenReady(ready); });
})();
