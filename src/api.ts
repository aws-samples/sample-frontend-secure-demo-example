import { fetchAuthSession } from 'aws-amplify/auth';

const API = import.meta.env.VITE_API_URL;

export type ApiResult = { status: number; body: unknown };

// Calls the protected HTTP API. We send the Cognito ID token, because the API
// Gateway JWT authorizer validates the token's `aud` claim against the app
// client id, and only the ID token carries `aud`.
export async function callApi(path: string, init?: RequestInit): Promise<ApiResult> {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}
