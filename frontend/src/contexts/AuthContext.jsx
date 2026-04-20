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

    const syncUser = (nextUser) => {
        if (nextUser) {
            localStorage.setItem('auth_user', JSON.stringify(nextUser));
        } else {
            localStorage.removeItem('auth_user');
        }

        setUser(nextUser);
    };

    const login = async (email, password) => {
        const { data } = await api.post('/login', { email, password });
        // If account is pending or rejected, the API returns 403, so this only runs for approved accounts.
        localStorage.setItem('auth_token', data.token);
        localStorage.removeItem('is_new_owner');
        setIsNewOwner(false);
        syncUser(data.user);
        return data.user;
    };

    // Used by GoogleCallbackPage after OAuth redirect
    const loginWithToken = (token, nextUser) => {
        localStorage.setItem('auth_token', token);
        localStorage.removeItem('is_new_owner');
        setIsNewOwner(false);
        syncUser(nextUser);
    };

    const refreshUser = async () => {
        const { data } = await api.get('/user');
        syncUser(data);
        return data;
    };

    const registerStudent = async (formData) => {
        // Handle both regular objects and FormData (for profile photo upload)
        const isFormData = formData instanceof FormData;
        const { data } = await api.post('/register-student', formData, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
        return data;
    };

    const registerOwner = async (formData) => {
        // Handle both regular objects and FormData (for profile photo upload)
        const isFormData = formData instanceof FormData;
        const { data } = await api.post('/register-owner', formData, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
        return data;
    };

    const clearNewOwnerFlag = () => {
        localStorage.removeItem('is_new_owner');
        setIsNewOwner(false);
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (_) {}

        localStorage.removeItem('auth_token');
        localStorage.removeItem('is_new_owner');
        setIsNewOwner(false);
        syncUser(null);
    };

    const isAdmin = () => user?.role === 'admin';
    const isOwner = () => user?.role === 'owner';
    const isStudent = () => user?.role === 'student';

    return (
        <AuthContext.Provider value={{
            user,
            login,
            loginWithToken,
            logout,
            registerOwner,
            registerStudent,
            loading,
            isAdmin,
            isOwner,
            isStudent,
            isNewOwner,
            clearNewOwnerFlag,
            refreshUser,
            syncUser,
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
