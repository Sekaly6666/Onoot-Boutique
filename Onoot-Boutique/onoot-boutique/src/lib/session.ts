function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const ANON_SESSION_KEY = "cartSessionId_anon";

/** Retourne le sessionId du panier courant (anonyme ou utilisateur) */
export function getCartSessionId(): string {
  let sessionId = localStorage.getItem(ANON_SESSION_KEY);
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem(ANON_SESSION_KEY, sessionId);
  }
  return sessionId;
}

/** Récupère (ou crée) le sessionId persisté pour un utilisateur donné */
export function getCartSessionIdForUser(userId: string): string {
  const key = `cartSessionId_${userId}`;
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

/** Réinitialise le sessionId anonyme (vide le panier visuel lors de la déconnexion) */
export function resetAnonCartSessionId(): string {
  const newSessionId = generateUUID();
  localStorage.setItem(ANON_SESSION_KEY, newSessionId);
  return newSessionId;
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function removeToken(): void {
  localStorage.removeItem("token");
}
