"""Builds the firm editions from the live pages, so they never drift apart:

    home.html              -> toolkits.html
    prospect-playbook.html -> prospect-toolkit.html
    client-playbook.html   -> client-toolkit.html
    recruit-playbook.html  -> recruit-toolkit.html

The live pages change in two ways, and the firm editions follow both on their own:
  - a change to a live page's file: .github/workflows/build-firm-pages.yml runs this script on every push to main
    and commits what it builds (by hand: python tools/build_firm_pages.py, from the repo root);
  - an edit made in a live page's inline editor (Firestore, no commit): a firm edition reads the same editor slot
    (CE_ID) and shows each edit with the firm's name filled in. It is never edited itself, so the live page stays
    the one place to edit, and its element keys line up with the live page's because nothing here adds or removes
    an editable element.

The live pages are only read. Every change below must match exactly as often as stated, so a live page whose
markup has moved stops the build with the line that no longer matches, instead of producing a half-branded page.
Branding and usage events live in firm.js / firm.css; this script only wires them in.
"""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KITS = {'prospect': 'Prospect', 'client': 'Client', 'recruit': 'Recruit'}


def read(name):
    with io.open(os.path.join(ROOT, name), encoding='utf-8') as f:
        return f.read().replace('\r\n', '\n')


def write(name, html):
    with io.open(os.path.join(ROOT, name), 'w', encoding='utf-8', newline='\n') as f:
        f.write(html)


class Page:
    def __init__(self, src):
        self.src, self.html = src, read(src)

    def sub(self, old, new, count=1, regex=False):
        if regex:
            self.html, n = re.subn(old, new, self.html)
        else:
            n = self.html.count(old)
            self.html = self.html.replace(old, new)
        if n != count:
            sys.exit('%s: expected %d match(es), found %d for %r' % (self.src, count, n, old[:100]))


def common(p, kit):
    p.sub('<meta name="viewport" content="width=device-width, initial-scale=1">\n',
          '<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="robots" content="noindex">\n')
    p.sub('<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>\n',
          '<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>\n'
          '<link rel="stylesheet" href="firm.css">\n'
          '<script src="firm.js" data-kit="%s"></script>\n' % kit)
    # links between pages stay inside the firm editions
    for k in KITS:
        p.sub('href="%s-playbook.html"' % k, 'href="%s-toolkit.html"' % k, count=p.html.count('href="%s-playbook.html"' % k))
    p.sub('href="home.html"', 'href="toolkits.html"', count=p.html.count('href="home.html"'))

    # follow the live page's inline edits: same CE_ID, never edited here, firm-filled text left alone, the firm's
    # name filled into every edit
    p.sub(r"  var ceWANT=/\[\?&\]edit=1/\.test\(location\.search\), ceEDIT=false;[^\n]*\n",
          "  var ceWANT=false, ceEDIT=false; /* a firm edition is never edited itself: it shows the live page's edits (same CE_ID), firm-filled */\n",
          regex=True)
    p.sub("if(Object.prototype.hasOwnProperty.call(ceOverrides,k) && document.activeElement!==el && el.innerHTML!==ceOverrides[k]){ el.innerHTML=ceOverrides[k]; }",
          "if(el.hasAttribute('data-firm') || !Object.prototype.hasOwnProperty.call(ceOverrides,k)) return; var v=tkFill(ceOverrides[k]); if(document.activeElement!==el && el.innerHTML!==v){ el.innerHTML=v; }")


def build_kit(kit, label):
    p = Page('%s-playbook.html' % kit)
    common(p, kit)
    # the top bar: the firm's logo (or name) beside the knomee mark, which firm.css hides once a firm loads
    p.sub('<nav class="nav">', '<nav class="nav" data-firm-bar>')
    p.sub('<a class="nav-logo" href="toolkits.html" aria-label="Back to landing page"><svg viewBox',
          '<a class="nav-logo" href="toolkits.html" aria-label="Back to landing page"><img class="firm-logo" data-firm-logo alt=""><span class="firm-name" data-firm-name data-firm></span><svg class="kn-logo" viewBox')
    p.sub('<span class="hero-eyebrow anim">Knomee Activation Toolkit</span>',
          '<span class="hero-eyebrow anim" data-firm-eyebrow data-firm>Knomee Activation Toolkit</span>')
    p.sub('<div style="font-size:.85rem">© Knomee | Confidential · %s Toolkit' % label,
          '<div style="font-size:.85rem"><span data-firm-footer data-firm></span>© Knomee | Confidential · %s Toolkit' % label)
    # a sample edited on the live page opens with the firm's name in it
    p.sub("sheetBody.innerHTML = ceSampleOverride(id) || node.innerHTML;",
          "sheetBody.innerHTML = tkFill(ceSampleOverride(id) || node.innerHTML);")
    p.sub("var ov=ceSamples['sample::'+ceCurrentSample];",
          "var ov=tkFill(ceSamples['sample::'+ceCurrentSample]);")

    # usage events from the existing interactions
    p.sub("    document.title = (id==='home'?'':meta[id][1]+' · ')+'Knomee — The %s Toolkit';\n" % label,
          "    document.title = (id==='home'?'':meta[id][1]+' · ')+(window.TK_TITLE||'Knomee')+' — The %s Toolkit';\n"
          "    tkTrack('view',{view:id});\n" % label)
    p.sub("    resetCopy();\n    var wasOpen",
          "    resetCopy();\n    tkTrack('sample_open',{sample:id,label:node.getAttribute('data-type')});\n    var wasOpen")
    p.sub("    var done=function(){ copyBtn.classList.add('done');",
          "    tkTrack('copy',{sample:ceCurrentSample,label:sheetType.textContent,how:'button'});\n"
          "    var done=function(){ copyBtn.classList.add('done');")
    p.sub("  /* mobile drawer */\n",
          "  /* text selected and copied by hand counts too (the button's own fallback copies from a textarea outside the tray) */\n"
          "  sheetBody.addEventListener('copy', function(){ if(!ceEDIT) tkTrack('copy',{sample:ceCurrentSample,label:sheetType.textContent,how:'select'}); });\n"
          "\n  /* mobile drawer */\n")
    write('%s-toolkit.html' % kit, p.html)


def build_home():
    p = Page('home.html')
    common(p, 'home')
    p.sub('  <div class="topbar">', '  <div class="topbar" data-firm-bar>')
    p.sub('<div class="logo"><svg height="22"',
          '<div class="logo"><img class="firm-logo" data-firm-logo alt=""><span class="firm-name" data-firm-name data-firm></span><svg class="kn-logo" height="22"')
    p.sub('<span class="eyebrow">Knomee Activation Toolkit</span>',
          '<span class="eyebrow" data-firm-eyebrow data-firm>Knomee Activation Toolkit</span>')
    write('toolkits.html', p.html)


build_home()
for kit, label in KITS.items():
    build_kit(kit, label)
print('built toolkits.html, ' + ', '.join('%s-toolkit.html' % k for k in KITS))
