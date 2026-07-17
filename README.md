# Knomee — Activation Playbooks

Static, GitHub Pages–served collection of Knomee activation playbooks, wrapped
in a Figma-style **commenting overlay** so reviewers can leave feedback pins on
any page.

## Pages

- `index.html` — the **commenting overlay shell** (site root). It iframes the
  playbook site and layers the review chrome on top. This is the entry point
  GitHub Pages serves.
- `home.html` — the landing page (playbook index). Links from here navigate the
  iframe to each playbook.
- `prospect-playbook.html` — Winning New Clients: the Prospect Playbook.
- `client-playbook.html` — Deepening Relationships: the Client Playbook.
- `knomee_playbook.html` — the older combined V5 deck.

## Commenting overlay

Copied from [`commenting-template`](https://github.com/victor-mascaro-ux/commenting-template)
("Neutral Frost"). A frosted **FAB** (bottom-right) toggles comment mode — or
press **F2** (F12 is left for devtools). Click anywhere on the frame to drop a
numbered pin and leave/resolve threads. Comments persist via Firestore,
namespaced by `PROJECT_ID` (`'activation-playbook'`).

While comment mode is on, the overlay stamps a `cc-review-on` class on the
current playbook page's `<body>`, and each page hides its own Export PDF button
and "Changes saved" toast so the overlay's FAB owns the bottom-right corner.

Because the site is multi-page, comment pins are namespaced **per page** — the
overlay derives the screen id from the current page in the iframe, so pins left
on the Prospect Playbook don't show up on the Client Playbook.

Config lives at the top of the `<script>` block in `index.html` (`PROJECT_ID`,
`THEME`, `SEED_DEMO`).

## Serving locally

```bash
python3 -m http.server
# then open http://localhost:8000/index.html
```

> GitHub Pages must serve this branch's root so `index.html` (the overlay) is
> the site entry point.
