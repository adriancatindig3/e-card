export function firebaseCode(error: unknown): string {
  if (typeof error === 'object' && error && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return '';
}

export function formatAuthError(error: unknown): string {
  const code = firebaseCode(error);
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google sign-in was closed before it finished.';
  }
  if (code === 'auth/popup-blocked') return 'The browser blocked the Google sign-in window.';
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized in Firebase Authentication settings.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not enabled for this Firebase project.';
  }
  if (code === 'auth/network-request-failed') return 'Google sign-in could not reach the network.';
  return 'Google sign-in did not complete.';
}

export function setupMessage(error: unknown, adminAttempt: boolean): string {
  const code = firebaseCode(error);
  if (error instanceof Error && error.message && !code) return error.message;
  if (code === 'permission-denied' && adminAttempt) {
    return 'This Google account is on the admin allowlist, but Firestore rejected the admin profile. Add the same email in firestore.rules and deploy those rules.';
  }
  if (code === 'permission-denied') {
    return 'Firestore rejected this profile. Deploy the latest firestore.rules to project e-card-72671.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Your profile could not be created. Try again.';
}
