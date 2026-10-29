/* Firm editions (toolkits.html and the *-toolkit.html pages, built by tools/build_firm_pages.py).
   Loaded in <head>, after Firebase, with data-kit naming the page.

   The firm comes from the link (?firm=<slug>; the /<slug> short links redirect here) and is remembered in this
   browser, so a bookmarked plain link still counts for that firm. ?firm=none forgets it.

   Branding follows knomee-demo's white-label pattern: the firm's colour on the top bar only, its white logo where
   the knomee mark was, and a "powered by knomee" credit fixed to the bottom-left corner (firms/<slug>.json).

   A firm with a "gate" in its config opens on a welcome screen in its own brand that asks for its password on every
   visit: the unlock is a session cookie, so it lasts until the browser closes. The config holds sha256(token), the
   cookie keeps token = sha256('knomee-firm:<slug>:' + password), so neither the page nor the config carries the
   password. Like the editor's password, this only stops casual
   access: the site is static. Inside the commenting shell (same origin, already behind the editor password) the
   welcome screen is skipped. tools/firm_password.py sets or changes a firm's password. ?lock=1 (for demos) forgets
   this browser's unlock, so the welcome screen shows again.

   Usage events (tkTrack) carry the firm, the page, a random id for this browser and one for this visit — never a
   name, email or link. Nothing is recorded in the editor, inside the commenting shell, or in a browser opted out
   with ?notrack=1 (?notrack=0 opts back in). Browsers that unlocked the editor are tagged staff, local servers
   env 'dev'. */
(function(){
  var KIT=(document.currentScript && document.currentScript.getAttribute('data-kit')) || 'unknown';
  var q=new URLSearchParams(location.search);
  function store(k,v){ try{ if(v===undefined) return localStorage.getItem(k); if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){} return null; }
  /* the firm's and the editor's unlocks: session cookies, shared by the browser's tabs and gone when it closes */
  function cookie(k,v){
    try{
      if(v===undefined){ var m=document.cookie.match(new RegExp('(?:^|;\\s*)'+k+'=([0-9a-f]{64})')); return m ? m[1] : null; }
      document.cookie=k+'='+(v||'')+'; path=/; SameSite=Strict'+(location.protocol==='https:' ? '; Secure' : '')+(v ? '' : '; max-age=0');
    }catch(e){}
    return null;
  }
  function rid(){ return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2)); }

  /* ── which firm ── */
  var FIRM=(q.get('firm')||'').toLowerCase().replace(/[^a-z0-9-]/g,'');
  if(FIRM==='none'){ store('knomee-toolkit-firm',null); FIRM=''; }
  else if(FIRM){ store('knomee-toolkit-firm',FIRM); }
  else { FIRM=store('knomee-toolkit-firm')||''; }
  window.TK_FIRM=FIRM;
  var KEY='knomee-firm-key-'+FIRM;
  store('knomee-firm-key:'+FIRM,null); /* the unlock that used to last forever, in localStorage */
  var inShell=(function(){ try{ return window.top!==window.self && window.top.location.origin===location.origin; }catch(e){ return false; } })();
  /* ?lock=1 forgets this browser's unlock, so the welcome screen shows again — for showing it in a demo. The
     parameter then leaves the address, so a reload after unlocking stays unlocked. */
  if(FIRM && q.get('lock')==='1'){
    cookie(KEY,null);
    try{ q.delete('lock'); history.replaceState(history.state,'',location.pathname+(q.toString() ? '?'+q.toString() : '')+location.hash); }catch(e){}
  }
  if(FIRM){
    document.documentElement.classList.add('firm-pending');
    /* until the config says whether this firm has a password, a browser that hasn't unlocked it sees nothing */
    if(!inShell && !cookie(KEY)) document.documentElement.classList.add('firm-gate-check');
  }

  /* ── usage events ── */
  if(q.get('notrack')==='1') store('knomee-toolkit-notrack','1');
  if(q.get('notrack')==='0') store('knomee-toolkit-notrack',null);
  var off = window.top!==window.self || /[?&]edit=1/.test(location.search) || store('knomee-toolkit-notrack')==='1';
  var vid = store('knomee-toolkit-vid'); if(!vid){ vid=rid(); store('knomee-toolkit-vid',vid); }
  var base = {
    firm: FIRM||'unknown', kit:KIT, vid:vid, sid:rid(),
    env: /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname) ? 'dev' : 'live',
    staff: !!cookie('knomee-edit-token'),
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

  /* ── fill-in templates ──
     An open sample shows every {{Placeholder}} as a field to type into, and a field for the advisor's Knomee link
     under each call to action. Copy Text stays off until every field is filled; it then copies formatted text (the
     call to action a real link, tagged with this template) and a plain-text version. The advisor's name and link
     are remembered in this browser only: nothing typed here is sent anywhere or recorded in the usage events. */
  var KEEP=['Advisor Name','Recruiter Name','Firm Name','Link'];
  /* the link is kept per toolkit: a prospect invite and a recruit invite are different links */
  function slot(k){ return k==='Link' ? 'Link@'+KIT : k; }
  function kept(){ try{ return JSON.parse(store('knomee-toolkit-fields')||'{}')||{}; }catch(e){ return {}; } }
  function keep(k,v){ if(KEEP.indexOf(k)<0) return; var m=kept(); if(v) m[slot(k)]=v; else delete m[slot(k)]; store('knomee-toolkit-fields',JSON.stringify(m)); }
  function linkOk(v){ return /^(https?:\/\/)?[^\s\/.]+\.[^\s]+$/i.test(v); }
  function fullLink(v){ return /^https?:\/\//i.test(v) ? v : 'https://'+v; }
  function medium(label){
    label=(label||'').toLowerCase();
    return /paid|display|sponsored/.test(label) ? 'paid' : /email/.test(label) ? 'email' : /linkedin|social|message/.test(label) ? 'social'
      : /event/.test(label) ? 'event' : /mail|postcard/.test(label) ? 'print' : 'other';
  }
  /* the template rides along as a UTM tag, so starts can be counted per template (an advisor's own tags win) */
  function tagged(v,id,label){
    var u=fullLink(v); if(/[?&]utm_/.test(u)) return u;
    return u+(u.indexOf('?')<0?'?':'&')+'utm_source=knomee-toolkit&utm_medium='+medium(label)+'&utm_campaign='+encodeURIComponent(FIRM||'none')+'&utm_content='+encodeURIComponent(id||'');
  }
  function field(k){
    var s=document.createElement('span'), link=(k==='Link');
    s.className='tk-field'+(link?' tk-link':''); s.setAttribute('data-field',k);
    s.setAttribute('data-ph',link?'Paste your Knomee link':k); s.setAttribute('aria-label',link?'Your Knomee link':k);
    s.setAttribute('contenteditable','true'); s.setAttribute('role','textbox'); s.setAttribute('spellcheck',link?'false':'true');
    return DATE.test(k) && PICKS ? datePick(s,k) : s;
  }
  /* A day ({{Day}}) is picked, not typed: a click opens the browser's calendar, and the field says the day as the
     email would ("Thursday, November 5"). The date input under it is never copied (data-tk-skip). A browser with no
     calendar to open keeps the field typed. */
  var DATE=/\b(day|date)\b/i, PICKS=typeof HTMLInputElement!=='undefined' && 'showPicker' in HTMLInputElement.prototype;
  function ymd(d){ return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  function longDay(v){ var p=v.split('-'); return new Date(+p[0],p[1]-1,+p[2]).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}); }
  function datePick(s,k){
    s.removeAttribute('contenteditable'); s.removeAttribute('spellcheck');
    s.setAttribute('role','button'); s.setAttribute('tabindex','0'); s.setAttribute('aria-label',k+': pick a date');
    var pick=document.createElement('input'), wrap=document.createElement('span');
    pick.type='date'; pick.className='tk-date-pick'; pick.min=ymd(new Date()); pick.tabIndex=-1;
    pick.setAttribute('aria-hidden','true'); pick.setAttribute('data-tk-skip','');
    wrap.className='tk-date'; wrap.appendChild(s); wrap.appendChild(pick);
    function open(){ try{ pick.showPicker(); }catch(e){} }
    s.addEventListener('click',open);
    /* added before tkFields' own keys, so Enter opens the calendar here rather than moving on */
    s.addEventListener('keydown',function(e){
      if(e.key!=='Enter' && e.key!==' ') return;
      e.preventDefault(); e.stopImmediatePropagation(); open();
    });
    pick.addEventListener('change',function(){
      if(!pick.value) return;
      s.textContent=longDay(pick.value); s.dispatchEvent(new Event('input',{bubbles:true}));
    });
    return wrap;
  }
  function val(f){ return f.textContent.replace(/\s+/g,' ').trim(); }
  function filled(f){ var v=val(f); return !!v && (f.getAttribute('data-field')!=='Link' || linkOk(v)); }

  window.tkFields=function(root,id){
    root.setAttribute('data-src',root.innerHTML);
    var btn=document.getElementById('copyBtn'), hint=document.querySelector('.copy-hint');
    if(hint && !hint.hasAttribute('data-default')) hint.setAttribute('data-default',hint.textContent);

    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT), texts=[], n;
    while((n=w.nextNode())) if(/\{\{[^}]+\}\}/.test(n.nodeValue)) texts.push(n);
    texts.forEach(function(t){
      var frag=document.createDocumentFragment();
      t.nodeValue.split(/(\{\{[^}]+\}\})/).forEach(function(p){
        var m=/^\{\{([^}]+)\}\}$/.exec(p);
        if(m) frag.appendChild(field(m[1].trim())); else if(p) frag.appendChild(document.createTextNode(p));
      });
      t.parentNode.replaceChild(frag,t);
    });
    Array.prototype.forEach.call(root.querySelectorAll('.email-cta,.pill-cta'),function(cta){
      var row=document.createElement('div'); row.className='tk-linkrow'; row.setAttribute('data-tk-skip','');
      row.innerHTML='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>';
      row.appendChild(field('Link'));
      cta.insertAdjacentElement('afterend',row);
    });

    var fields=Array.prototype.slice.call(root.querySelectorAll('.tk-field')), memo=kept();
    var names=root.querySelectorAll('.email-from b,.frame-from b');
    Array.prototype.forEach.call(names,function(b){ b.setAttribute('data-default',b.textContent); });
    function update(){
      var missing={};
      fields.forEach(function(f){
        var ok=filled(f); f.classList.toggle('is-done',ok); f.classList.toggle('is-bad',!ok && !!val(f));
        if(!ok) missing[f.getAttribute('data-field')]=1;
      });
      var left=Object.keys(missing);
      if(btn){ btn.disabled=left.length>0; }
      if(hint){
        /* a "Use Copy Text" note still showing gives way to the current state */
        if(hint.hasAttribute('data-was')){ clearTimeout(hint._tkNudge); hint.removeAttribute('data-was'); hint.classList.remove('is-nudge'); }
        hint.textContent = !fields.length ? hint.getAttribute('data-default')
          : left.length===1 && left[0]==='Link' ? 'Add your Knomee link to copy it.'
          : left.length ? 'Fill in the '+(left.length===1?'highlighted field':left.length+' highlighted fields')+' to copy it.'
          : 'All set. Paste it where you’ll send it.';
      }
      /* the sample's From line (and its avatar's letter) follows the sender's name as it's typed */
      var who=root.querySelector('.tk-field[data-field="Advisor Name"],.tk-field[data-field="Recruiter Name"]'), name=who && val(who);
      Array.prototype.forEach.call(names,function(b){
        b.textContent=name || b.getAttribute('data-default');
        var av=b.parentNode && b.parentNode.parentNode && b.parentNode.parentNode.querySelector('.email-av');
        if(av){ if(!av.hasAttribute('data-default')) av.setAttribute('data-default',av.textContent); av.textContent=name ? name.charAt(0).toUpperCase() : av.getAttribute('data-default'); }
      });
    }
    fields.forEach(function(f,i){
      var k=f.getAttribute('data-field');
      if(memo[slot(k)]) f.textContent=memo[slot(k)];
      f.addEventListener('keydown',function(e){
        if(e.key!=='Enter') return;
        e.preventDefault(); var next=fields[i+1]; if(next) next.focus(); else f.blur();
      });
      f.addEventListener('paste',function(e){
        e.preventDefault(); var t=((e.clipboardData||window.clipboardData).getData('text/plain')||'').replace(/\s+/g,' ').trim();
        document.execCommand('insertText',false,t);
      });
      f.addEventListener('input',function(){
        if(!f.textContent.trim()) f.textContent=''; /* back to empty, so the placeholder shows again */
        var v=val(f);
        fields.forEach(function(o){ if(o!==f && o.getAttribute('data-field')===k && val(o)!==v) o.textContent=v; });
        keep(k,v); update();
      });
    });
    update();
  };

  /* Samples copy through Copy Text only: that copy is the one with every field filled, the link tagged, and it's
     counted. A hand copy in the tray (Ctrl+C, the menu's Copy) copies nothing and points at the button instead;
     words inside one field — the advisor's own — still copy. firm.css keeps the sample's text from selecting. */
  window.tkBlockCopy=function(e){
    var sel=window.getSelection(), at=sel && sel.anchorNode, el=at && (at.nodeType===1 ? at : at.parentNode);
    var field=el && el.closest && el.closest('.tk-field');
    if(field && field.contains(sel.focusNode)) return;
    e.preventDefault();
    var btn=document.getElementById('copyBtn'), hint=document.querySelector('.copy-hint');
    if(hint){
      if(!hint.hasAttribute('data-was')) hint.setAttribute('data-was',hint.textContent);
      hint.textContent='Use Copy Text to copy this template.'; hint.classList.add('is-nudge');
      clearTimeout(hint._tkNudge);
      hint._tkNudge=setTimeout(function(){
        hint.textContent=hint.getAttribute('data-was'); hint.removeAttribute('data-was'); hint.classList.remove('is-nudge');
      },2600);
    }
    if(btn){ btn.classList.remove('tk-nudge'); void btn.offsetWidth; btn.classList.add('tk-nudge'); }
  };

  /* Copy Text on a sample with fields: returns false when there's nothing to fill, so the page copies as it did */
  window.tkCopy=function(root,id,label){
    var fields=root.querySelectorAll('.tk-field'); if(!fields.length) return false;
    var btn=document.getElementById('copyBtn'); if(!btn || btn.disabled) return true;
    var linkField=root.querySelector('.tk-field[data-field="Link"]'), url=linkField ? tagged(val(linkField),id,label) : '';
    var color=(getComputedStyle(document.documentElement).getPropertyValue('--firm')||'').trim() || '#240446';
    function build(plain){
      var c=(root.querySelector('[data-copy]')||root).cloneNode(true);
      Array.prototype.forEach.call(c.querySelectorAll('[data-tk-skip]'),function(e){ e.remove(); });
      Array.prototype.forEach.call(c.querySelectorAll('.tk-field'),function(f){
        f.replaceWith(document.createTextNode(f.getAttribute('data-field')==='Link' ? url : val(f)));
      });
      Array.prototype.forEach.call(c.querySelectorAll('.email-cta,.pill-cta'),function(cta){
        var text=cta.textContent.trim();
        if(plain){ var p=document.createElement('p'); p.textContent=text.replace(/\s*→\s*$/,'')+': '+url; cta.replaceWith(p); return; }
        var a=document.createElement('a'); a.href=url; a.textContent=text;
        /* as on the page: an email's button a rounded square, any other a pill */
        var r=cta.classList.contains('email-cta') ? '10px' : '999px';
        a.setAttribute('style','display:inline-block;padding:10px 20px;border-radius:'+r+';background:'+color+';color:#ffffff;text-decoration:none;font-weight:600');
        cta.replaceWith(a);
      });
      Array.prototype.forEach.call(c.querySelectorAll('*'),function(e){
        Array.prototype.slice.call(e.attributes).forEach(function(a){ if(a.name!=='href' && a.name!=='style') e.removeAttribute(a.name); });
        if(e.tagName!=='A') e.removeAttribute('style');
      });
      return c;
    }
    var html=build(false).innerHTML;
    var off=build(true); off.style.cssText='position:fixed;left:-9999px;top:0;width:600px'; document.body.appendChild(off);
    var text=off.innerText.replace(/\n{3,}/g,'\n\n').trim(); off.remove();

    function done(){
      var s=btn.querySelector('span'); btn.classList.add('done'); if(s) s.textContent='Copied ✓';
      setTimeout(function(){ btn.classList.remove('done'); if(s) s.textContent='Copy Text'; },1800);
    }
    function fallback(){
      var d=document.createElement('div'); d.contentEditable='true'; d.style.cssText='position:fixed;left:-9999px;top:0'; d.innerHTML=html;
      document.body.appendChild(d);
      var r=document.createRange(), sel=window.getSelection(); r.selectNodeContents(d); sel.removeAllRanges(); sel.addRange(r);
      try{ document.execCommand('copy'); }catch(e){}
      sel.removeAllRanges(); d.remove(); done();
    }
    try{
      if(window.ClipboardItem && navigator.clipboard && navigator.clipboard.write){
        navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([text],{type:'text/plain'})})]).then(done,fallback);
      } else fallback();
    }catch(e){ fallback(); }
    tkTrack('copy',{sample:id,label:label,how:'button'});
    return true;
  };

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
    baseline(f);

    if(f.brand!=='white'){
      var c=document.createElement('span'); c.className='powered-by';
      c.innerHTML='<span class="powered-by-text">powered by</span><img class="powered-by-logo" src="knomee-logo-plum.svg" alt="knomee">';
      document.body.appendChild(c);
    }
  }

  /* ── Know Your Baseline: the numbers Prospect / Candidate Analytics measures the lift against ──
     Each [data-baseline] cell on the live page ("___ %", "$___M") becomes a number field with its unit around it.
     It opens with what this browser saved, else the firm's onboarding numbers (firms/<slug>.json "baseline", per
     toolkit). A changed number is saved in this browser and sent as a usage event — the metric and the number,
     nothing else — since it's what the lift is measured against. data-firm keeps a live edit from replacing it. */
  function baseline(f){
    var cells=document.querySelectorAll('[data-baseline]'); if(!cells.length) return;
    var name=f.name||FIRM, given=(f.baseline||{})[KIT]||{}, BKEY='knomee-toolkit-baseline:'+FIRM+':'+KIT, saved;
    try{ saved=JSON.parse(store(BKEY)||'{}')||{}; }catch(e){ saved={}; }
    var inputs=[], prefilled=false;
    var note=document.createElement('p'); note.className='tk-base-note anim'; note.setAttribute('role','status');
    Array.prototype.forEach.call(cells,function(td){
      var k=td.getAttribute('data-baseline'), unit=td.textContent.split(/_+/), m=td.parentNode.querySelector('.m');
      var said=unit[1].trim()==='%' ? 'percent' : unit[1].trim()==='M' ? 'millions of dollars' : unit[0].trim()==='$' ? 'dollars' : unit[1].trim();
      var last=Object.prototype.hasOwnProperty.call(saved,k) ? saved[k] : (given[k]!=null ? String(given[k]) : '');
      if(given[k]!=null) prefilled=true;
      td.setAttribute('data-firm',''); td.classList.add('tk-base-cell'); td.textContent='';
      var w=document.createElement('label'); w.className='tk-base';
      var inp=document.createElement('input');
      inp.type='text'; inp.inputMode='decimal'; inp.autocomplete='off'; inp.maxLength=12; inp.value=last; inp.placeholder='—';
      inp.setAttribute('aria-label',(m ? m.textContent+', ' : '')+'your baseline today'+(said ? ', in '+said : ''));
      /* every field gets the prefix slot, empty or "$", so the fields line up down the column */
      var num=document.createElement('span'); num.className='tk-base-num';
      var pre=document.createElement('span'); pre.className='tk-base-unit tk-base-pre'; pre.textContent=unit[0].trim();
      num.appendChild(pre); num.appendChild(inp); w.appendChild(num);
      if(unit[1].trim()){ var post=document.createElement('span'); post.className='tk-base-unit'; post.textContent=unit[1].trim(); w.appendChild(post); }
      td.appendChild(w); inputs.push(inp);
      inp.addEventListener('input',function(){ var v=inp.value.replace(/[^\d.,]/g,''); if(v!==inp.value) inp.value=v; });
      inp.addEventListener('keydown',function(e){
        if(e.key!=='Enter') return;
        e.preventDefault(); var next=inputs[inputs.indexOf(inp)+1]; if(next) next.focus(); else inp.blur();
      });
      inp.addEventListener('change',function(){
        var v=inp.value.trim(); if(v===last) return;
        last=v; saved[k]=v; store(BKEY,JSON.stringify(saved));
        tkTrack('baseline',{metric:k,value:v});
        note.textContent='Saved. Knomee measures the lift against these numbers.';
      });
    });
    note.textContent=prefilled ? 'From what '+name+' shared at onboarding. Change any number that has moved.'
      : 'Add where '+name+' is today, before Knomee, to measure the lift against.';
    var wrap=cells[0].closest('.table-wrap'); if(wrap) wrap.insertAdjacentElement('afterend',note);
  }

  /* ── the welcome screen (firms with a password) ── */
  function sha(s){ return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(b){ return Array.prototype.map.call(new Uint8Array(b),function(x){ return ('0'+x.toString(16)).slice(-2); }).join(''); }); }
  function reveal(){ var r=document.documentElement; r.classList.remove('firm-gate-check'); r.classList.remove('firm-locked'); }
  /* the eye at the field's far end shows or hides what's typed */
  var EYE='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.1 10.1 0 0 1 12 19c-6.4 0-10-7-10-7a18.4 18.4 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.4 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M2 2l20 20"/></svg>';
  function pwEye(b,input){
    b.addEventListener('click',function(){
      var show=input.type==='password';
      input.type=show ? 'text' : 'password';
      b.innerHTML=show ? EYE_OFF : EYE;
      b.setAttribute('aria-pressed',show ? 'true' : 'false');
      b.setAttribute('aria-label',show ? 'Hide password' : 'Show password');
    });
  }

  function gate(f){
    if(!f.gate || inShell){ reveal(); return; }
    var t=cookie(KEY);
    (t ? sha(t) : Promise.resolve('')).then(function(h){
      if(h===f.gate){ reveal(); return; }
      if(t) cookie(KEY,null); /* the password changed since this browser unlocked */
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
          '<div class="fg-pass">'+
            '<input class="fg-input" id="fgPass" type="password" autocomplete="current-password" placeholder="Enter your password">'+
            '<button class="pw-eye" type="button" aria-controls="fgPass" aria-label="Show password" aria-pressed="false">'+EYE+'</button>'+
          '</div>'+
          '<p class="fg-error" id="fgError" role="alert"></p>'+
          '<button class="fg-continue" type="submit">Continue<svg viewBox="0 0 10 10" width="8" height="8" aria-hidden="true"><path d="M2 1l6 4-6 4z" fill="currentColor"/></svg></button>'+
        '</form>'+
      '</div>'+
      (f.brand!=='white' ? '<div class="fg-foot"><span class="fg-credit"><span class="powered-by-text">powered by</span><img class="powered-by-logo" src="knomee-logo-plum.svg" alt="knomee"></span></div>' : '');
    document.body.appendChild(g);
    tkTrack('gate');
    var input=g.querySelector('#fgPass'), err=g.querySelector('#fgError'), btn=g.querySelector('.fg-continue');
    pwEye(g.querySelector('.pw-eye'),input);
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
        cookie(KEY,th[0]);
        tkTrack('unlock');
        g.classList.add('is-leaving'); reveal();
        setTimeout(function(){ g.remove(); },400);
      });
    });
  }

  fetch('firms/'+FIRM+'.json',{cache:'no-cache'})
    .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(f){ return new Promise(function(done){ whenReady(function(){ apply(f); gate(f); done(); }); }); })
    /* No such firm: the page belongs to nobody, so it's not public (staff-gate.js) — and the browser forgets
       the firm, so the next plain visit doesn't try it again */
    .catch(function(e){
      console.warn('firm "'+FIRM+'" not found',e);
      store('knomee-toolkit-firm',null);
      whenReady(function(){ if(window.ktLock) window.ktLock(); reveal(); });
    })
    .then(function(){ whenReady(ready); });
})();
