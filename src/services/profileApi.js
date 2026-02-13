/**
 * Frontend API client for the Tunet backend.
 * All calls go to /api/* which Vite proxies to the backend in dev mode,
 * and Express serves directly in production.
 */

const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }

  return res.json();
}

// ── Profiles ─────────────────────────────────────────────────────────

export function fetchProfiles(haUserId) {
  return request(`/profiles?ha_user_id=${encodeURIComponent(haUserId)}`);
}

export function fetchProfile(id) {
  return request(`/profiles/${id}`);
}

export function createProfile({ ha_user_id, name, device_label, data }) {
  return request('/profiles', {
    method: 'POST',
    body: JSON.stringify({ ha_user_id, name, device_label, data }),
  });
}

export function updateProfile(id, { name, device_label, data }) {
  return request(`/profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, device_label, data }),
  });
}

export function deleteProfile(id) {
  return request(`/profiles/${id}`, { method: 'DELETE' });
}

// ── Templates ────────────────────────────────────────────────────────

// ── Health ────────────────────────────────────────────────────────────

export function checkHealth() {
  return request('/health');
}
