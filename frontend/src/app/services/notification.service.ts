import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { AuthService } from '../core/services/auth.service';

export interface Notification {
    id: string;
    documento_id: string | null;
    comment_id: string | null;
    lida: boolean;
    criado_em: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    private notifications$ = new Subject<Notification>();
    notifications: Observable<Notification> = this.notifications$.asObservable();

    private eventSource: EventSource | null = null;
    private retryDelay = 1000;
    private retryTimeout: ReturnType<typeof setTimeout> | null = null;

    connect(token: string): void {
        if (this.eventSource) {
            this.eventSource.close();
        }

        const url = `/api/v1/notifications/stream?token=${encodeURIComponent(token)}`;
        this.eventSource = new EventSource(url);

        this.eventSource.onmessage = (event: MessageEvent) => {
            try {
                const notification = JSON.parse(event.data) as Notification;
                this.notifications$.next(notification);
            } catch {
                // ignore malformed messages
            }
        };

        this.eventSource.onerror = () => {
            this.eventSource?.close();
            this.eventSource = null;

            this.retryDelay = Math.min(this.retryDelay * 2, 30000);
            this.retryTimeout = setTimeout(() => this.reconnect(token), this.retryDelay);
        };
    }

    disconnect(): void {
        if (this.retryTimeout !== null) {
            clearTimeout(this.retryTimeout);
            this.retryTimeout = null;
        }
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.retryDelay = 1000;
    }

    private reconnect(token: string): void {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }

        this.getNotifications().subscribe({
            next: (response) => {
                response.notifications
                    .filter((n) => !n.lida)
                    .forEach((n) => this.notifications$.next(n));
            },
            error: () => {
                // proceed to reconnect even if sync fails
            },
            complete: () => {
                const currentToken = token || this.authService.getToken();
                if (currentToken) {
                    this.connect(currentToken);
                }
            },
        });
    }

    getNotifications(): Observable<{ notifications: Notification[]; unread_count: number }> {
        return this.http.get<{ notifications: Notification[]; unread_count: number }>(
            '/api/v1/notifications/'
        );
    }

    markAsRead(id: string): Observable<Notification> {
        return this.http.patch<Notification>(`/api/v1/notifications/${id}/read`, {});
    }
}
