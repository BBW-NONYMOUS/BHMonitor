import React, { createContext, useContext, useState } from 'react';
import api from '@/services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('auth_user');
        return stored ? JSON.parse(stored) : null;
    });
    const [loading, setLoading] = useState(false);
    const [isNewOwner, setIsNewOwner] = useState(() => {
        return localStorage.getItem('is_new_owner') === 'true';
    });

    const login = async (email, password) => {
        const { data } = await api.post('/login', { email, password });
        // If account is pending or rejected, the API returns 403 — axios will throw
        // so this line is only reached for approved accounts
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        localStorage.removeItem('is_new_owner');
        setIsNewOwner(false);
        setUser(data.user);
        return data.user;
    };

    // Used by GoogleCallbackPage after OAuth redirect
    const loginWithToken = (token, user) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.removeItem('is_new_owner');
        setIsNewOwner(false);
        setUser(user);
    };

    const registerStudent = async (formData) => {
        // Handle both regular objects and FormData (for profile photo upload)
        const isFormData = formData instanceof FormData;
        const { data } = await api.post('/register-student', formData, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
        // Returns { account_status: 'pending', message } — no token
        return data;
    };

    const registerOwner = async (formData) => {
        // Handle both regular objects and FormData (for profile photo upload)
        const isFormData = formData instanceof FormData;
        const { data } = await api.post('/register-owner', formData, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
        // Returns { account_status: 'pending', message } — no token
        return data;
    };

    const clearNewOwnerFlag = () => {
        localStorage.removeItem('is_new_owner');
        setIsNewOwner(false);
    };

    const logout = async () => {
        try { await api.post('/logout'); } catch (_) {}
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('is_new_owner');
        setIsNewOwner(false);
        setUser(null);
    };

    const isAdmin   = () => user?.role === 'admin';
    const isOwner   = () => user?.role === 'owner';
    const isStudent = () => user?.role === 'student';

    return (
        <AuthContext.Provider value={{
            user, login, loginWithToken, logout, registerOwner, registerStudent,
            loading, isAdmin, isOwner, isStudent,
            isNewOwner, clearNewOwnerFlag,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
