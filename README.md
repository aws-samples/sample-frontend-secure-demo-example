# Standup — frontend security demo SPA

An **intentionally vulnerable** React + Vite single-page app for showing common
frontend security mistakes — and their fixes — on camera. It ships broken on purpose
so each issue can be demonstrated and then hardened live.

Sign-in is handled by **Amazon Cognito** through **AWS Amplify**. You bring your own
Cognito user pool; this repo only contains the frontend. See [Set up Cognito](#set-up-cognito)
below for what you need to create.

> Demo code. Do not deploy this as-is. The vulnerabilities are the point.

## What's deliberately wrong

| Demo | Where | The point |
|---|---|---|
| **XSS** | `StatusBoard.tsx` renders statuses with `dangerouslySetInnerHTML` | Flip **Hardened mode** in the header — it wraps the value in `DOMPurify.sanitize()` |
| **Broken access control** | `AdminPanel.tsx` hides the delete button with `{isAdmin && …}` | Hiding UI is not a control. A server-side check on `/admin` is what actually enforces it (needs a backend — see below) |
| **Token in localStorage** | Amplify v6 default | Console demo: `localStorage` is readable by any script on the page |
| **Secret in the bundle** | `secrets.ts` hardcodes a (fake) `sk_live_…` key | `npm run build`, then grep the bundle |

Three of these (XSS, token storage, secret in the bundle) are pure frontend and work
with nothing but a Cognito user pool. The access-control demo also needs a backend HTTP
API — see [The access-control demo](#the-access-control-demo).

## Prerequisites

- Node.js 18+ and npm
- An AWS account
- A Cognito user pool + app client (created in the next section)

## Set up Cognito

The app authenticates against a Cognito user pool using Amplify. You need to create the
pool and an app client, then point the app at them with environment variables. Use
whichever path you prefer — AWS Console or AWS CLI. The settings that matter are the
same either way.

**Required settings**

- **Sign-in with email.** Create the pool with email as the sign-in identifier
  (`UsernameAttributes: email`). The Amplify `Authenticator` in `App.tsx` is configured
  for `loginMechanisms: ['email']`, so the pool must match.
- **Self-service sign-up enabled.** The app lets users create an account and confirm it
  with an emailed code, so allow public sign-up and use email for verification.
- **A public app client with no client secret.** A browser is a public client, so the
  client must be created **without** a secret. Amplify then uses SRP / PKCE. (No Hosted
  UI or callback URLs are needed — sign-in happens via SRP, not a redirect.)
- **An `admins` group** (only for the access-control demo). Users in this group should
  get the `cognito:groups` claim with `admins`.

**Option A — AWS Console**

1. Cognito → Create user pool.
2. Sign-in options: **Email**.
3. Self-service sign-up: **Enabled**, with email verification.
4. Add an app client: type **Public client**, and make sure **"Generate a client secret"
   is unchecked**.
5. (Optional) Groups → create a group named `admins`.
6. Copy the **User pool ID** and the **App client ID**.

**Option B — AWS CLI**

```bash
# 1. Create the pool (email sign-in, self-service sign-up, email verification)
aws cognito-idp create-user-pool \
  --pool-name standup-demo \
  --username-attributes email \
  --auto-verified-attributes email \
  --query 'UserPool.Id' --output text
# → us-east-1_XXXXXXXXX  (this is your User Pool ID)

# 2. Create a PUBLIC app client (no secret)
aws cognito-idp create-user-pool-client \
  --user-pool-id us-east-1_XXXXXXXXX \
  --client-name standup-spa \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --query 'UserPoolClient.ClientId' --output text
# → the App Client ID

# 3. (Optional) Group for the access-control demo
aws cognito-idp create-group --user-pool-id us-east-1_XXXXXXXXX --group-name admins
```

For the full reference, see the AWS docs:
[Amazon Cognito user pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
and Amplify's [Connect to existing AWS resources](https://docs.amplify.aws/react/build-a-backend/auth/use-existing-cognito-resources/)
(the `Auth.Cognito` config in `src/amplifyConfig.ts` follows this pattern).

## Configure and run

1. Create a `.env` file in this folder with your Cognito values:

   ```bash
   # .env
   VITE_USER_POOL_ID=us-east-1_XXXXXXXXX
   VITE_USER_POOL_CLIENT_ID=your-app-client-id
   # Only needed for the access-control demo (see below):
   VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
   ```

2. Install and run:

   ```bash
   npm install
   npm run dev   # http://localhost:5173
   ```

Create an account (Cognito emails a verification code), confirm it, then sign in.

## Recording the demos

**1. XSS.** Post a status of `<img src=x onerror=alert('pwned')>`. The alert fires.
Flip **Hardened mode** and post it again — it renders inert. Same input, sanitized.

**2. Token storage.** Open the DevTools console:

```js
Object.keys(localStorage).filter((k) => k.includes('CognitoIdentityServiceProvider'))
localStorage.getItem(/* the accessToken key */)
```

The JWT prints. Any script on the page can read it — which is the whole point of the
XSS demo. (A JavaScript-readable cookie is no better; only a server-set HttpOnly cookie
hides it.)

**3. Broken access control.** Sign in as a normal user. The "Delete all statuses" button
is hidden, but click **Call /admin directly** — the endpoint is in the bundle, so the
request goes out regardless of the hidden button. See the next section for the backend
this needs.

**4. Secret in the bundle.**

```bash
npm run build
grep -o 'sk_live_[A-Za-z0-9_]*' dist/assets/*.js
```

The fake key prints straight out of the minified bundle.

## The access-control demo

This demo needs a backend HTTP API at `VITE_API_URL` with a protected `/admin` route.
This repo does not ship that backend — you provide it. The contract the frontend expects:

- The API validates the incoming Cognito **ID token** (the app sends it as
  `Authorization: Bearer <idToken>`, because only the ID token carries the `aud` claim a
  JWT authorizer checks against the app client id).
- `/admin` returns **200** only for users in the `admins` group, and **403** otherwise.

That single server-side group check is the real control. To show the *broken* state,
have the endpoint skip the group check — then a non-admin call to `/admin` returns 200.
Turn the check back on and the same call returns 403. The hidden button never changed
anything; the server check is the only thing that does.

To make a real user an admin, add them to the group and have them sign out and back in
(to refresh the token's group claim):

```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id <UserPoolId> --username <you> --group-name admins
```

## The dependency demo (`npm audit`)

This repo intentionally does **not** commit known-vulnerable packages — shipping those
would be the very supply-chain problem the demo warns about. To show the `npm audit`
beat, install an outdated package just before filming and revert after:

```bash
npm install lodash@4.17.4   # has known advisories
npm audit                   # shows the findings
git checkout package.json package-lock.json && npm install
```

Talk over it: lockfile + `npm ci`, Dependabot/Renovate, npm provenance, and dependency
scanning (e.g. Amazon Inspector) for your backend's dependencies.
