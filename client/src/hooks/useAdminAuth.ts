import { useState, useEffect, useCallback } from "react";

const TOKEN_KEY = "admin_token";

export function useAdminAuth() {
    const [token, setToken] = useState<string | null>(() =>
        localStorage.getItem(TOKEN_KEY)
    );
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // Verify token on mount
    useEffect(() => {
        if (!token) {
            setIsChecking(false);
            return;
        }
        fetch("/api/admin/verify", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.ok) {
                    setIsAuthenticated(true);
                } else {
                    localStorage.removeItem(TOKEN_KEY);
                    setToken(null);
                }
            })
            .catch(() => {
                localStorage.removeItem(TOKEN_KEY);
                setToken(null);
            })
            .finally(() => setIsChecking(false));
    }, [token]);

    const login = useCallback(async (username: string, password: string) => {
        const res = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Login failed");
        }
        const { token: newToken } = await res.json();
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        setIsAuthenticated(true);
        return true;
    }, []);

    const logout = useCallback(async () => {
        if (token) {
            try {
                await fetch("/api/admin/logout", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
            } catch { }
        }
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setIsAuthenticated(false);
    }, [token]);

    const authFetch = useCallback(
        async (url: string, options: RequestInit = {}) => {
            const headers: Record<string, string> = {
                ...(options.headers as Record<string, string>),
            };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            // Don't set Content-Type for FormData — browser sets it with the boundary
            if (!headers["Content-Type"] && options.body && !(options.body instanceof FormData)) {
                headers["Content-Type"] = "application/json";
            }
            const res = await fetch(url, { ...options, headers });
            if (res.status === 401) {
                localStorage.removeItem(TOKEN_KEY);
                setToken(null);
                setIsAuthenticated(false);
            }
            return res;
        },
        [token]
    );

    return { token, isAuthenticated, isChecking, login, logout, authFetch };
}
