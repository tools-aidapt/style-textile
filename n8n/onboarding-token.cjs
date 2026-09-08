/**
 * The onboarding link token: how to mint one, and how to check one.
 *
 * ==========================================================================
 * NOT CURRENTLY IN USE. The app identifies a new hire by their plain ClickUp
 * Employee task id in the URL — `/onboarding/869evrmhx` — and nothing here is
 * wired up. It is kept because that id is a name rather than a secret, and if
 * enumeration ever needs closing off, this is the closing-off: switching to it
 * changes the two lines in src/onboarding/session.ts that read the id out of
 * the URL, and nothing else in the app. See the safeguards listed in that file
 * and in n8n/README.md for what carries the weight in the meantime.
 * ==========================================================================
 *
 * A new hire has no ClickUp account and no password. The link WF-15 emails
 * them IS the credential, and it is the only thing standing between a stranger
 * and somebody's national ID, bank details and photograph. So the token has to
 * carry who they are, prove it was issued by us, and stop working on its own.
 *
 * Paste `mint` into the Code node in WF-15 that builds the email link. Paste
 * `verify` into a Code node placed FIRST on each of the three onboarding
 * webhooks — session, document and submit. The app sends the token with all
 * three calls, not just the session, and a webhook that only checks it once is
 * a webhook that accepts documents from anybody.
 *
 * The React app treats the token as opaque: it reads it out of the URL, sends
 * it back, and renders whatever the session returns. It never parses, decodes
 * or validates it — see src/onboarding/session.ts. That is deliberate. Nothing
 * a browser checks is a check, and it means the format below can change
 * without touching the app.
 *
 * THE SECRET LIVES IN n8n, NEVER IN THIS REPO and never in a VITE_* variable.
 * Anything prefixed VITE_ is compiled into the JavaScript that ships to the
 * browser; a signing secret in there lets anyone mint a link for any employee.
 *
 * The `.cjs` extension is for Node's benefit — this package is `type: module`,
 * and the file is CommonJS so it can be required and exercised directly:
 *
 *   node -e "const t=require('./n8n/onboarding-token.cjs');  *     console.log(t.mint({employeeTaskId:'869evrmhx',secret:'dev-only'}))"
 *
 * n8n's Code node is CommonJS too, so the functions paste in unchanged.
 */

const crypto = require('crypto');

/** 21 days. See the note at the bottom — this is a proposal, not a decision. */
const TOKEN_TTL_SECONDS = 21 * 24 * 60 * 60;

const base64url = (buffer) =>
  Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64url = (value) =>
  Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

const sign = (payload, secret) =>
  base64url(crypto.createHmac('sha256', secret).update(payload).digest());

// ---------------------------------------------------------------------------
// Minting — WF-15, where the email is built
// ---------------------------------------------------------------------------

/**
 * `{payload}.{signature}`
 *
 * The payload is readable by anyone holding the link — base64url is encoding,
 * not encryption. That is fine: it contains the employee's own task id and
 * their own email address, both of which they already know. What it cannot be
 * is CHANGED, because the signature covers it.
 *
 * It deliberately carries nothing else. No name, no salary, no position — a
 * token is a bearer credential that will sit in an inbox for three weeks, and
 * everything in it is something that leaks with it.
 */
function mint({ employeeTaskId, personalEmail, secret, ttlSeconds = TOKEN_TTL_SECONDS }) {
  if (!employeeTaskId) throw new Error('mint: employeeTaskId is required');
  if (!secret) throw new Error('mint: secret is required');

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({
      employeeTaskId: String(employeeTaskId),
      personalEmail: personalEmail ?? null,
      iat: issuedAt,
      exp: issuedAt + ttlSeconds,
    }),
  );

  return `${payload}.${sign(payload, secret)}`;
}

// ---------------------------------------------------------------------------
// Verifying — first node on session, document and submit
// ---------------------------------------------------------------------------

/**
 * Returns the payload, or throws.
 *
 * Order matters. The signature is checked BEFORE the contents are trusted for
 * anything, including before the expiry is read, because an unsigned token's
 * `exp` is whatever the sender felt like putting there.
 */
function verify(token, secret) {
  if (!secret) throw new Error('verify: secret is not configured');
  if (typeof token !== 'string' || !token.includes('.')) {
    throw new Error('onboarding token: malformed');
  }

  const [payload, signature] = token.split('.');
  if (!payload || !signature) throw new Error('onboarding token: malformed');

  const expected = sign(payload, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  // Length-checked first: timingSafeEqual throws on a length mismatch, and a
  // thrown "bad length" is itself a signal about the signature
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('onboarding token: bad signature');
  }

  let claims;
  try {
    claims = JSON.parse(fromBase64url(payload).toString('utf8'));
  } catch {
    throw new Error('onboarding token: unreadable payload');
  }

  if (!claims.employeeTaskId) throw new Error('onboarding token: no employee');
  if (typeof claims.exp !== 'number') throw new Error('onboarding token: no expiry');
  if (claims.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('onboarding token: expired');
  }

  return claims;
}

// ---------------------------------------------------------------------------
// The Code node
// ---------------------------------------------------------------------------

/**
 * What to actually paste at the top of each onboarding webhook.
 *
 * Two rules the rest of the workflow depends on:
 *
 * 1. **`employeeTaskId` comes from HERE, never from the request.** The app has
 *    no code path that accepts an employee id from a URL, a form field or
 *    storage, and the webhook must not introduce one. A ClickUp task id is
 *    short and guessable; the signature is what makes it an identity.
 * 2. **Answer 401 or 410, not 500.** The app renders a polite dead end on 401,
 *    403 and 410 — "This link has expired. Ask HR to send a new one." — and a
 *    500 gets "try again", which is advice that cannot help.
 *
 * Rate-limit per token and per IP as well, in the Webhook node or ahead of it.
 * A leaked link is a data-exposure event, and brute-forcing token space has to
 * be pointless rather than merely slow.
 */
function gate() {
  const item = $input.first();
  const body = item.json.body ?? item.json;
  const query = item.json.query ?? {};

  // GET session carries ?t=; the document upload sends a multipart field; the
  // submit sends a header. Accept all three, prefer none.
  const token =
    query.t ??
    body.token ??
    (item.json.headers ?? {})['x-onboarding-token'] ??
    null;

  const claims = verify(token, $env.ONBOARDING_TOKEN_SECRET);

  return [
    {
      json: {
        ...body,
        // Downstream nodes use these. Nothing downstream reads body.employeeId.
        employeeTaskId: claims.employeeTaskId,
        tokenEmail: claims.personalEmail,
        tokenExpiresAt: new Date(claims.exp * 1000).toISOString(),
      },
      binary: item.binary ?? {},
    },
  ];
}

/**
 * Renewal is HR re-sending, not the app refreshing.
 *
 * WF-15 leaves a comment on the Employee record with the link in it; HR
 * re-sends from there, which mints a fresh token. There is deliberately no
 * endpoint that extends a token, because a bearer credential that can renew
 * itself never expires.
 *
 * TODO(kenafric): 21 days is a proposal. Confirm it against the real gap
 * between signing an offer and starting — if that is routinely six weeks, this
 * expiry is a support queue rather than a safeguard.
 */

module.exports = { mint, verify, gate, TOKEN_TTL_SECONDS };
