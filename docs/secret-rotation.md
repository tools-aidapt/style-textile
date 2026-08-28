# The ClickUp token in git history

**Status: not yet done. Both steps below need a human.**

The initial commit `8872424` contains a `.env` file holding a live ClickUp API
token:

```sh
git show 8872424:.env
```

Deleting the file does not remove it from history. Anyone who has ever cloned
this repository, and anyone who clones it in future, can read that token.

## 1. Rotate the token (do this first)

Rotating is what actually makes the leak harmless. Purging history without
rotating leaves the token valid in every clone that already exists.

1. In ClickUp: **Settings → Apps → API Token → Regenerate**.
2. Update the `ClickUp API Token (Header Auth)` credential in n8n with the new
   value.
3. Confirm the careers webhook still returns roles:
   `curl -u user:pass https://<your-n8n>/webhook/careers-positions | head`

The token belongs in n8n only. It must not go back into `.env` — see the note
at the top of `.env.example`.

## 2. Purge it from history

Only after rotating, and only with everyone who has a clone told to re-clone
afterwards. This rewrites every commit hash.

```sh
# Install once: pipx install git-filter-repo  (or pip install git-filter-repo)
git clone --mirror <remote-url> careers-purge.git
cd careers-purge.git
git filter-repo --invert-paths --path .env
git push --force --all
git push --force --tags
```

Then, for everyone else:

```sh
# Their existing clone still contains the token. A fresh clone is the only fix.
cd .. && rm -rf <old-clone> && git clone <remote-url>
```

If the repository is on GitHub, also ask GitHub Support to expire the cached
views of the old commits — a force push does not remove them from the API's
commit endpoints immediately.

## Why it will not happen again

- `.gitignore` now ignores `.env` and every `.env.*` except `.env.example`.
- `.env.example` states plainly that everything `VITE_*` ships to the browser.
- `src/lib/config.ts` is the only place `import.meta.env` is read, so what the
  bundle exposes is reviewable in one file.
