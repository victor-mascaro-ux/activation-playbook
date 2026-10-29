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
  pages above.

## What's public

Only two doors are open to anyone: **each firm's link** (`/acme`, behind the
firm's welcome screen) and **the editor** (`index.html?edit=1`, behind the
editor password). Every other page (`home.html`, the `*-playbook.html`
toolkits, the older decks, and a firm page opened without a firm or with an
unknown one) is closed. It shows a "This page isn't public" card that asks for
nothing and tells advisors to use the link their firm sent. A small link takes
the Knomee team to the same page in the editor, the only place the editor
password is asked for. `staff-gate.js`, loaded first in each of those pages,
does this.

Both passwords unlock the browser until it closes (a session cookie, shared by
its tabs). The next visit asks again. Browsers that restore their last session
on start-up may keep it too. All of this stops casual access only: the site is
static and the repo is public, so the pages' content can be read from the
source.

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
field to type into. **Copy Text stays off until all of them are filled**, and
the hint beside it says what's left. It then copies formatted text plus a
plain-text version. The sample's From line follows the advisor's name as it's
typed.

Only the invite emails have a field for the advisor's Knomee invite link under
their call to action. These are the samples Knomee's own Invite modal sends,
listed in knomee-demo's `src/data/inviteEmails.ts`: `cold-2` and `hot-1`
(Prospect), and `eng-1`, `eng-2`, `dis-1` and `dis-2` (Client). The list lives
in `INVITE` in `firm.js`, so a change to the modal's emails needs a change
there too. In an invite email, the copied call to action is a real
button-link in the firm's colour, and in plain text the link follows the
button's words. Every other call to action keeps its button look, and the
advisor links it in their own email tool. The Recruit Toolkit has no invite
emails, because Invite Advisor sends a link rather than an email. Three
samples write `{{Link}}` into their own text (`warm-4`, `inbound-4`,
`outreach-2`). That stays a field like any other placeholder.

- The invite link gets UTM tags, so starts can be counted per template:
  `utm_source=knomee-toolkit`, `utm_medium` (email, social, paid, event,
  print), `utm_campaign=<firm slug>`, and `utm_content=<sample id>`.
  If the advisor's own link already carries UTM tags, it's left as it is.
- The advisor's (or recruiter's) name and link fill in every sample while
  the tab stays open, the link separately per toolkit, since prospect and
  client invites are different links. Advisors may share a computer, so
  they're gone once the tab or window closes (sessionStorage), and the ones
  an earlier version kept for good are erased on the next visit. Nothing
  typed is sent anywhere or recorded in the usage events.
- Samples with no placeholders and no invite link copy as before.
- **Samples copy through Copy Text only.** The sample's text doesn't select,
  and a hand copy (Ctrl+C, the menu's Copy) copies nothing: the button
  shakes and the hint says to use Copy Text. That keeps every copy filled in,
  tagged and counted. Words inside one field (the advisor's own) still copy.
- `firm.js` (`tkFields`, `tkCopy`, `tkBlockCopy`) holds this; the build wires
  it into the sample tray. The live pages are unchanged.

### Know Your Baseline

The Baseline section of the Prospect and Recruit toolkits holds the three numbers the funnel measures the lift
against, the same three Prospect Analytics and Candidate Analytics show in knomee-demo:

| Toolkit | Metric | Key |
| --- | --- | --- |
| Prospect | Conversion rate (%) | `conversion` |
| Prospect | Time to client (days) | `days` |
| Prospect | Revenue per client ($) | `revenue` |
| Recruit | Joining rate (%) | `joined` |
| Recruit | Time to decision (days) | `days` |
| Recruit | AUM per advisor who joined ($M) | `aum` |

In the firm editions each one is a number field. The numbers belong to the firm, not to one browser: everyone at the
firm reads and changes the same Firestore document, `toolkit-baselines/<slug>_<kit>` (for example
`acme_prospect`). Until that document exists, the fields show the firm's onboarding numbers from its config. A saved
change is also logged as a `baseline` usage event, carrying only the metric and the number. A local server reads and
writes its own copy (`acme_prospect_dev`), so testing never changes a firm's numbers. Anyone with the firm's
password can change them, and the note under the table says a change applies to everyone.

The Firestore rules must allow this. Add the following inside `match /databases/{database}/documents` in the
Firebase console. Until it's in, the fields show the onboarding numbers and a change says it wasn't saved:

```
match /toolkit-baselines/{id} {
  function num(d, k) { return !(k in d) || (d[k] is string && d[k].matches('^[0-9.,]{0,12}$')); }
  allow read: if id.matches('^[a-z0-9-]{1,40}_(prospect|recruit)(_dev)?$');
  allow create, update: if id.matches('^[a-z0-9-]{1,40}_(prospect|recruit)(_dev)?$')
    && request.resource.data.keys().hasOnly(['firm','kit','at','conversion','days','revenue','joined','aum'])
    && request.resource.data.firm is string
    && request.resource.data.kit in ['prospect','recruit']
    && id.matches('^' + request.resource.data.firm + '_' + request.resource.data.kit + '(_dev)?$')
    && request.resource.data.at == request.time
    && num(request.resource.data, 'conversion') && num(request.resource.data, 'days')
    && num(request.resource.data, 'revenue') && num(request.resource.data, 'joined')
    && num(request.resource.data, 'aum');
  allow delete: if false;
}
```

Like everything on this static site, the rule stops casual changes only. It checks the shape of a change, not who
made it, and the numbers can be read by anyone who has the site's public Firebase config.

```json
"baseline": {
  "prospect": { "conversion": "11", "days": "74", "revenue": "8,500" },
  "recruit": { "joined": "15", "days": "150", "aum": "250" }
}
```

ACME's prospect numbers are the demo's (11%, 74 days, $8,500). The config is public, like the rest of the repo,
so leave a real firm's numbers out of it unless the firm is fine with that. On the live pages the cells stay
blank (`data-baseline` marks them).

### Firm password (welcome screen)

A firm whose config has a `"gate"` opens on a welcome screen in its own brand:
its colour fills the screen, its white logo sits over a sign-in card (the
knomee-demo sign-in card), and "POWERED BY knomee" holds the foot. An eye at
the end of the field shows what's typed. Once the right password is in, that
browser stays unlocked for all of the firm's pages until it closes. ACME's
password is set.

```bash
python tools/firm_password.py acme            # set or change it (asked for, not shown)
python tools/firm_password.py acme --remove   # no password
```

The config keeps only `sha256(sha256('knomee-firm:<slug>:' + password))`, and
the browser keeps the inner hash in a session cookie, so the password itself is
never stored.
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
hand is turned off), welcome screen shown, password accepted and baseline number changed adds a document to the
Firestore collection `toolkit-events`:

| Field | Value |
| --- | --- |
| `type` | `open`, `view`, `sample_open`, `copy`, `gate`, `unlock`, `baseline` |
| `firm` | the slug, or `unknown` |
| `kit` | `home`, `prospect`, `client` or `recruit` |
| `view` / `sample` / `label` / `how` / `via` | what was viewed or copied, and how |
| `metric` / `value` | for `baseline`: which number (its key above) and what was typed |
| `vid` / `sid` | random ids for this browser and this visit |
| `env` | `live`, or `dev` on a local server |
| `staff` | `true` when this browser unlocked the editor |
| `device` | `mobile` or `desktop` |
| `at` | server timestamp |

No names, emails or links are recorded; the only typed text recorded is a baseline number. Nothing is recorded in the editor,
inside the commenting shell, or in a browser opened once with `?notrack=1`
(`?notrack=0` turns it back on).

The Firestore rules must allow the toolkit to add these events and nothing
else. Add this inside `match /databases/{database}/documents` in the Firebase
console; reads stay with the console:

```
match /toolkit-events/{id} {
  allow create: if request.resource.data.keys().hasOnly(['type','firm','kit','vid','sid','env','staff','device','at','via','view','sample','label','how','metric','value'])
    && request.resource.data.type in ['open','view','sample_open','copy','gate','unlock','baseline']
    && (!('value' in request.resource.data) || (request.resource.data.value is string && request.resource.data.value.size() <= 12))
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
loads nothing behind it until the password is entered. An eye at the end of
the field shows what's typed. Once someone unlocks it, their browser stays
unlocked until it closes (the token is a session cookie, `knomee-edit-token`).
Each toolkit page also checks that token before it turns its own editor on, and
`staff-gate.js` closes a page opened with `?edit=1&raw=1`, so that can't get
around the gate.

The password itself is never in the source. Unlocking stores
`sha256('knomee-edit:' + password)` as the token, and the shell and each page
compare `sha256(token)` with `CE_GATE`. To change the password, compute the new
value and replace `CE_GATE` in `index.html`, `home.html`,
`prospect-playbook.html`, `client-playbook.html` and `recruit-playbook.html`
(the firm editions can't be edited, so they need no editor gate of their own):

```bash
python -c "import hashlib,getpass;t=hashlib.sha256(('knomee-edit:'+getpass.getpass()).encode()).hexdigest();print(hashlib.sha256(t.encode()).hexdigest())"
```

This only stops casual access: the site is static, so someone determined could
still write to Firestore directly. The older always-editable decks
(`knomee_playbook.html`, `*-pdf.html`) have no editor gate, but since they
aren't public they sit behind `staff-gate.js` like the other pages.

## Serving locally

```bash
python3 -m http.server
# then open http://localhost:8000/index.html
```

> GitHub Pages must serve this branch's root so `index.html` (the overlay) is
> the site entry point.
