export function getSessionId(): string {
  let sessionId = localStorage.getItem('dreamos_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : 'session_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('dreamos_session_id', sessionId);
  }
  return sessionId;
}

export function getNickname(): string | null {
  return localStorage.getItem('dreamos_nickname');
}

export function setNickname(name: string) {
  localStorage.setItem('dreamos_nickname', name.trim());
}

export function hasAskedName(): boolean {
  return localStorage.getItem('dreamos_asked_name') === 'true';
}

export function setAskedName() {
  localStorage.setItem('dreamos_asked_name', 'true');
}

export function getAdminSecret(): string | null {
  return localStorage.getItem('dreamos_admin_secret');
}

export function setAdminSecret(secret: string) {
  localStorage.setItem('dreamos_admin_secret', secret);
}
