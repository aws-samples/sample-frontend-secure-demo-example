import { useEffect, useState } from 'react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { fetchAuthSession } from 'aws-amplify/auth';
import { StatusBoard } from './StatusBoard';
import { AdminPanel } from './AdminPanel';
import { ANALYTICS_KEY } from './secrets';
import './index.css';

function Dashboard() {
  const { user, signOut } = useAuthenticator((ctx) => [ctx.user]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hardened, setHardened] = useState(false);

  useEffect(() => {
    // DEMO: this "analytics key" came from frontend source and is now in the
    // bundle. It is only referenced here so the bundler keeps it (see secrets.ts).
    console.debug('analytics init with key', ANALYTICS_KEY.slice(0, 8) + '…');

    // Authorization comes from the token's group claim, decided by Cognito —
    // not from anything the client can set.
    fetchAuthSession().then((session) => {
      const groups =
        (session.tokens?.idToken?.payload['cognito:groups'] as string[] | undefined) ?? [];
      setIsAdmin(groups.includes('admins'));
    });
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <h1>Standup</h1>
        <div className="controls">
          <label className="toggle">
            <input
              type="checkbox"
              checked={hardened}
              onChange={(e) => setHardened(e.target.checked)}
            />
            Hardened mode
          </label>
          <button onClick={signOut}>Sign out</button>
        </div>
      </header>

      <p className="who">
        Signed in as <strong>{user?.signInDetails?.loginId ?? 'user'}</strong>
        {isAdmin ? ' · admin' : ' · member'}
      </p>

      <StatusBoard hardened={hardened} />
      <AdminPanel isAdmin={isAdmin} />
    </div>
  );
}

export default function App() {
  // The Cognito user pool uses email as the username (UsernameAttributes: ['email']).
  // Tell the Authenticator to use email as the login mechanism — otherwise it renders a
  // generic "Username" field and Cognito rejects sign-up with "Username should be an email."
  return <Authenticator loginMechanisms={['email']}>{() => <Dashboard />}</Authenticator>;
}
