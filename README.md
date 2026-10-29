# Knomee — Activation Toolkits

Static, GitHub Pages–served collection of Knomee activation toolkits, wrapped
in a Figma-style **commenting overlay** so reviewers can leave feedback pins on
any page.

## Pages

- `index.html` — the **commenting overlay shell** (site root). It iframes the
  toolkit site and layers the review chrome on top. This is the entry point
  GitHub Pages serves.
- `home.html` — the landing page (toolkit index). Links from here navigate the
  iframe to each toolkit.
- `prospect-playbook.html` — Winning New Clients: the Prospect Toolkit.
- `client-playbook.html` — Deepening Relationships: the Client Toolkit.
- `recruit-playbook.html` — Attracting Advisors: the Recruit Toolkit (advisors
  weighing a move to independence).
- `knomee_playbook.html` — the older combined V5 deck.
- **Firm editions**, branded for one firm and counting how they're used (see
  below): `toolkits.html` (the landing), `prospect-toolkit.html`,
  `client-toolkit.html` and `recruit-toolkit.html`. They are built from the
  live pages above, which stay as they are for the advisors already using them.

## Firm toolkits

Each firm gets its own link: `activation.knomee.com/<slug>` (ACME:
`/acme`). The `<slug>/index.html` stub redirects to
`toolkits.html?firm=<slug>`, the firm's landing with all three toolkits, and
every firm page reads `firms/<slug>.json`:

```json
{ "name": "Acme Advisors", "logo": "firms/acme-white.svg", "color": "#1c3f6e", "domain": "acme.com", "brand": "cobrand" }
```

The branding follows knomee-demo's white-label pattern (its `TopBar`,
`clientBrands.tsx` and `.powered-by`; ACME is the demo's own Acme brand): the
firm's colour on the toolkits' top bar only, its white logo where the knomee
mark was, and a "powered by knomee" credit fixed to the bottom-left corner
(`"brand": "white"` drops the credit). Without a `logo` the bar shows the
firm's name. Logos follow knomee-demo's `docs/logo-guidelines.md`: one flat
white, vector, cropped tight. The pages also name the firm in the hero and
footer and fill `{{Firm Name}}` and `advisor@acme.com`. The browser remembers
the firm, so a bookmarked plain link still counts for it; `?firm=none` forgets
it.

`firm.js` (firm, branding, events) and `firm.css` hold all of this. The pages
themselves are built by `tools/build_firm_pages.py`, which wires those two in
and changes nothing else.

**Edit the live pages only; every firm edition follows on its own:**

- **A change to a live page's file**, once it's on `main`: the *Build firm
  pages* GitHub Action (`.github/workflows/build-firm-pages.yml`) rebuilds the
  firm editions, commits them, and asks Pages to publish. It also runs on
  demand from the Actions tab. By hand: `python tools/build_firm_pages.py`.
  It runs for changes to `firm.js` or `firm.css` too: the pages ask for those
  by a version of their contents (`firm.js?v=…`), so browsers that cached
  the old file pick up the new one at once.
- **An edit made in a live page's inline editor** (`?edit=1`, saved to
  Firestore, no commit): each firm edition reads the same editor slot as its
  live page (`home-v4`, `prospect-v3`, `client-v2`, `recruit-v2`) and shows the
  edit at once, with `{{Firm Name}}` filled in. The firm editions can't be
  edited themselves, and the firm's own eyebrow keeps the firm's name.

This works because the firm editions add or remove no editable element, so
the editor's element keys line up with the live page's. If the build ever
stops on a line that no longer matches, a live page's markup has moved:
update the matching line in the build script.

### Fill-in templates

In the firm editions an open sample is a form: every `{{Placeholder}}` is a
field to type into, and every call to action has a field under it for the
advisor's Knomee link. **Copy Text stays off until all of them are filled**,
and the hint beside it says what's left. It then copies formatted text, with
the call to action a real button-link in the firm's colour, plus a plain-text
version where the link follows the button's words. The sample's From line
follows the advisor's name as it's typed.

- The link gets UTM tags, so starts can be counted per template:
  `utm_source=knomee-toolkit`, `utm_medium` (email, social, paid, event,
  print), `utm_campaign=<firm slug>`, and `utm_content=<sample id>`.
  If the advisor's own link already carries UTM tags, it's left as it is.
- The advisor's (or recruiter's) name and their link are remembered in their
  own browser, the link separately per toolkit, since prospect and recruit
  invites are different links. Nothing typed is sent anywhere or recorded in
  the usage events.
- Samples without placeholders or a call to action copy as before.
- **Samples copy through Copy Text only.** The sample's text doesn't select,
  and a hand copy (Ctrl+C, the menu's Copy) copies nothing: the button
  shakes and the hint says to use Copy Text. That keeps every copy filled in,
  tagged and counted. Words inside one field (the advisor's own) still copy.
- `firm.js` (`tkFields`, `tkCopy`, `tkBlockCopy`) holds this; the build wires
  it into the sample tray. The live pages are unchanged.

### Firm password (welcome screen)

A firm whose config has a `"gate"` opens on a welcome screen in its own brand:
its colour fills the screen, its white logo sits over a sign-in card (the
knomee-demo sign-in card), and "POWERED BY knomee" holds the foot. Once the
right password is in, that browser stays unlocked for all of the firm's
pages. ACME's password is set.

```bash
python tools/firm_password.py acme            # set or change it (asked for, not shown)
python tools/firm_password.py acme --remove   # no password
```

The config keeps only `sha256(sha256('knomee-firm:<slug>:' + password))`, and
the browser keeps the inner hash, so the password itself is never stored.
Changing it sends every browser back to the welcome screen. Like the editor
password, this stops casual access only: the site is static, the config is
public, and the same toolkits are open on the live pages. Inside the
commenting shell, which is already behind the editor password, the welcome
screen is skipped.

To show the welcome screen again in a browser that has already unlocked (for a
demo), add `?lock=1`: `activation.knomee.com/acme/?lock=1`, or on any firm
page. It forgets that browser's unlock and then drops out of the address, so a
reload after the password stays unlocked.

To add a firm: copy `acme/` and `firms/acme.json` (plus its logo) under the new
slug and edit them, then give it a password or remove ACME's copied one. The repo is public, so these files are too: prefer slugs
that don't spell out a customer's name.

### Usage events

Every open, section view, sample open, template copy (Copy Text; copying by
hand is turned off), welcome screen shown and password accepted adds a document to the Firestore collection
`toolkit-events`:

| Field | Value |
| --- | --- |
| `type` | `open`, `view`, `sample_open`, `copy`, `gate`, `unlock` |
| `firm` | the slug, or `unknown` |
| `kit` | `home`, `prospect`, `client` or `recruit` |
| `view` / `sample` / `label` / `how` / `via` | what was viewed or copied, and how |
| `vid` / `sid` | random ids for this browser and this visit |
| `env` | `live`, or `dev` on a local server |
| `staff` | `true` when this browser unlocked the editor |
| `device` | `mobile` or `desktop` |
| `at` | server timestamp |

No names, emails or links are recorded. Nothing is recorded in the editor,
inside the commenting shell, or in a browser opened once with `?notrack=1`
(`?notrack=0` turns it back on).

The Firestore rules must allow the toolkit to add these events and nothing
else. Add this inside `match /databases/{database}/documents` in the Firebase
console; reads stay with the console:

```
match /toolkit-events/{id} {
  allow create: if request.resource.data.keys().hasOnly(['type','firm','kit','vid','sid','env','staff','device','at','via','view','sample','label','how'])
    && request.resource.data.type in ['open','view','sample_open','copy','gate','unlock']
    && request.resource.data.firm is string && request.resource.data.firm.size() <= 40
    && request.resource.data.at == request.time;
  allow read, update, delete: if false;
}
```

## Commenting overlay

The same overlay used on [`knomee-demo`](https://victor-mascaro-ux.github.io/knomee-demo/)
("Branded Frost"). It stays completely hidden until you press **F2** (F12 is
left for devtools); F2 reveals the chrome (comments rail + FAB) and drops into
comment mode. Click anywhere on the frame to drop a numbered pin and
leave/resolve threads; **Esc** (or F2 again) hides everything and returns the
page to a clean, fully interactive state. Comments persist via Firestore,
namespaced by `PROJECT_ID` (`'activation-playbook'`).

While comment mode is on, the overlay stamps a `cc-review-on` class on the
current toolkit page's `<body>`, and each page hides its own Export PDF button
and "Changes saved" toast so the overlay's chrome owns the corners.

Because the site is multi-page, comment pins are namespaced **per page** — the
overlay derives the screen id from the current page in the iframe, so pins left
on the Prospect Toolkit don't show up on the Client Toolkit.

Config lives at the top of the `<script>` block in `index.html` (`PROJECT_ID`,
`THEME`, `SEED_DEMO`).

## Editor password

The editor (`index.html?page=<file>&edit=1`, or any toolkit page with
`?edit=1`) is behind a password. The shell shows a lock screen first and
loads nothing behind it until the password is entered. Once someone unlocks it,
their browser stays unlocked (the token lives in `localStorage` under
`knomee-edit-token`). Each toolkit page also checks that token before it turns
its own editor on, so `?edit=1&raw=1` can't get around the gate.

The password itself is never in the source. Unlocking stores
`sha256('knomee-edit:' + password)` as the token, and the shell and each page
compare `sha256(token)` with `CE_GATE`. To change the password, compute the new
value and replace `CE_GATE` in `index.html`, `home.html`,
`prospect-playbook.html`, `client-playbook.html` and `recruit-playbook.html`
(the firm editions can't be edited, so they need no gate of their own):

```bash
python -c "import hashlib,getpass;t=hashlib.sha256(('knomee-edit:'+getpass.getpass()).encode()).hexdigest();print(hashlib.sha256(t.encode()).hexdigest())"
```

This only stops casual access: the site is static, so someone determined could
still write to Firestore directly. The older always-editable decks
(`knomee_playbook.html`, `*-pdf.html`) aren't gated.

## Serving locally

```bash
python3 -m http.server
# then open http://localhost:8000/index.html
```

> GitHub Pages must serve this branch's root so `index.html` (the overlay) is
> the site entry point.
