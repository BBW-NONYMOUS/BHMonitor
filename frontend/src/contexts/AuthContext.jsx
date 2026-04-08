import React, { createContext, useContext, useState, useEffect } from 'react';
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
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        localStorage.removeItem('is_new_owner');
        setIsNewOwner(false);
        setUser(data.user);
        return data.user;
    };

    const registerOwner = async (formData) => {
        const { data } = await api.post('/register-owner', formData);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        localStorage.setItem('is_new_owner', 'true');
        setIsNewOwner(true);
        setUser(data.user);
        return data.user;
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
        localStorage.removeItem('auth_user');
        localStorage.removeItem('is_new_owner');
        setIsNewOwner(false);
        setUser(null);
    };

    const isAdmin = () => user?.role === 'admin';
    const isOwner = () => user?.role === 'owner';

    return (
        <AuthContext.Provider value={{ user, login, logout, registerOwner, loading, isAdmin, isOwner, isNewOwner, clearNewOwnerFlag }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
