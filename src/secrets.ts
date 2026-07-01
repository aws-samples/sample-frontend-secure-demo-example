// ⚠️ DEMO OF AN ANTI-PATTERN. Do not do this in a real app.
//
// This "secret" is hardcoded in frontend source, so it ships in the built bundle.
// The key below is FAKE. After `npm run build`, prove the point:
//
//   grep -o 'sk_live_[A-Za-z0-9_]*' dist/assets/*.js
//
// ...and watch it print. Anything that reaches the browser is public. Real secrets
// belong on the server, behind an API call the user is authorized to make.
export const ANALYTICS_KEY = 'sk_live_DEMOonly_not_a_real_key_9f2b7c1a55e4';
