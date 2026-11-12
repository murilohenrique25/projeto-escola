import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../../models/user.model';

const TOKEN_KEY = 'access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);

    login(email: string, password: string): Observable<{ access_token: string; token_type: string }> {
        return this.http
            .post<{ access_token: string; token_type: string }>('/api/v1/auth/login', { email, password })
            .pipe(
                tap((response) => {
                    localStorage.setItem(TOKEN_KEY, response.access_token);
                })
            );
    }

    logout(): void {
        localStorage.removeItem(TOKEN_KEY);
    }

    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    getCurrentUser(): User | null {
        const token = this.getToken();
        if (!token) return null;

        try {
            const payload = this.decodeJwtPayload(token);
            if (!payload) return null;

            return {
                id: payload['sub'],
                email: payload['email'] ?? '',
                perfil: payload['perfil'],
                escola_id: payload['escola_id'],
            } as User;
        } catch {
            return null;
        }
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;

        try {
            const payload = this.decodeJwtPayload(token);
            if (!payload) return false;

            const exp = payload['exp'] as number | undefined;
            if (exp === undefined) return true;

            return Date.now() < exp * 1000;
        } catch {
            return false;
        }
    }

    private decodeJwtPayload(token: string): Record<string, unknown> | null {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        try {
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const json = atob(base64);
            return JSON.parse(json) as Record<string, unknown>;
        } catch {
            return null;
        }
    }
}
