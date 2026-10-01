import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/domain';
import { authApi } from '../services/authApi';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('placementops_token'));
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('placementops_token');

            if (storedToken) {
                try {
                    const userData = await authApi.me();
                    if (isMounted) setUser(userData);
                } catch (error) {
                    console.error('[Auth]: Failed to fetch user profile', error);
                    localStorage.removeItem('placementops_token');
                    if (isMounted) {
                        setToken(null);
                        setUser(null);
                    }
                }
            }

            if (isMounted) {
                setLoading(false);
            }
        };

        initializeAuth();

        return () => {
            isMounted = false;
        };
    }, []);

    const login = async (email: string, password: string) => {
        const response = await authApi.login({ email, password });
        localStorage.setItem('placementops_token', response.token);
        setToken(response.token);
        setUser(response.user);
    };

    const logout = () => {
        localStorage.removeItem('placementops_token');
        setToken(null);
        setUser(null);
    };

    const hasRole = (...roles: Role[]) => {
        if (!user) return false;
        return roles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
