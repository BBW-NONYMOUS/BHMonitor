const GOOGLE_AUTH_PATH = '/auth/google/redirect';

export function getGoogleAuthUrl() {
    // Always use full backend URL since window.location.assign bypasses Vite proxy
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    return `${backendUrl.replace(/\/$/, '')}${GOOGLE_AUTH_PATH}`;
}

export function redirectToGoogleAuth() {
    window.location.assign(getGoogleAuthUrl());
}
