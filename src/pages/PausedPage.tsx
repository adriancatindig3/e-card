import { useAuth } from '../context/AuthContext';

export function PausedPage() {
  const { signOutUser } = useAuth();
  return (
    <main className="screen">
      <p className="brand">Digital Card</p>
      <h1>This card is paused</h1>
      <p className="lede">Your public page is hidden until an admin turns it back on.</p>
      <button className="btn btn-plain" type="button" style={{ marginTop: 28 }} onClick={() => void signOutUser()}>
        Sign out
      </button>
    </main>
  );
}
