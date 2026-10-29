"""Sets, changes or removes a firm's password (the welcome screen firm.js shows before a firm's pages).

    python tools/firm_password.py acme            # asks for the new password, without showing it
    python tools/firm_password.py acme --remove   # no password: the firm's pages open straight away

Writes "gate" into firms/<slug>.json: sha256(token), where token = sha256('knomee-firm:<slug>:' + password) is what
a browser keeps after unlocking. The password itself is never stored. Changing it sends every browser back to
the welcome screen.
"""
import getpass, hashlib, io, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def sha(s):
    return hashlib.sha256(s.encode('utf-8')).hexdigest()


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    slug = sys.argv[1].lower()
    path = os.path.join(ROOT, 'firms', slug + '.json')
    with io.open(path, encoding='utf-8') as f:
        cfg = json.load(f)
    if '--remove' in sys.argv[2:]:
        cfg.pop('gate', None)
    else:
        pw = getpass.getpass('New password for %s: ' % slug)
        if not pw or pw != getpass.getpass('Again: '):
            sys.exit('The two passwords are empty or differ; nothing changed.')
        cfg['gate'] = sha(sha('knomee-firm:%s:%s' % (slug, pw)))
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(json.dumps(cfg, indent=2, ensure_ascii=False) + '\n')
    print('%s: %s' % (path, 'password removed' if 'gate' not in cfg else 'password set'))


main()
