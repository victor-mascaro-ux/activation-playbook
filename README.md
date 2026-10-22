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
`prospect-playbook.html`, `client-playbook.html` and `recruit-playbook.html`:

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
