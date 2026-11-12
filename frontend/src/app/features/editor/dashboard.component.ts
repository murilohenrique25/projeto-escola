import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DocumentListComponent } from './document-list.component';
import { NotificationService, Notification } from '../../services/notification.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DocumentListComponent],
  template: `
    <div class="dash-page">

      <!-- Notificações -->
      <div class="notif-bar" *ngIf="recentNotifications.length > 0">
        <div class="notif-bar-inner">
          <span class="notif-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            Notificações
            <span class="notif-count" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
          </span>
          <div class="notif-list">
            <div class="notif-item" *ngFor="let n of recentNotifications" [class.unread]="!n.lida">
              <span class="notif-msg">💬 Novo comentário no seu documento</span>
              <div class="notif-actions">
                <button class="btn btn-sm btn-ghost" *ngIf="!n.lida" (click)="onMarkAsRead(n)">Marcar lida</button>
                <button class="btn btn-sm btn-primary" *ngIf="n.documento_id" (click)="onOpenDocument(n)">Ver doc</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Conteúdo principal -->
      <div class="dash-content">
        <app-document-list></app-document-list>
      </div>
    </div>
  `,
  styles: [`
    .dash-page { min-height: calc(100vh - 56px); background: #f0f2f5; }

    .notif-bar { background: #fff8e1; border-bottom: 1px solid #ffe082; padding: 0 24px; }
    .notif-bar-inner { max-width: 1100px; margin: 0 auto; padding: 12px 0; }
    .notif-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; color: #e65100; margin-bottom: 8px; }
    .notif-count { background: #ef5350; color: #fff; border-radius: 50%; width: 20px; height: 20px; font-size: 11px; display: flex; align-items: center; justify-content: center; }
    .notif-list { display: flex; flex-direction: column; gap: 6px; }
    .notif-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-radius: 8px; background: #fff; border: 1px solid #ffe082; }
    .notif-item.unread { border-color: #ffb300; }
    .notif-msg { font-size: 13px; color: #424242; }
    .notif-actions { display: flex; gap: 8px; }

    .dash-content { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  unreadCount = 0;
  recentNotifications: Notification[] = [];
  private sub: Subscription | null = null;

  ngOnInit(): void {
    this.notificationService.getNotifications().subscribe({
      next: (r) => { this.unreadCount = r.unread_count; this.recentNotifications = r.notifications.slice(0, 5); }
    });
    const token = this.authService.getToken();
    if (token) this.notificationService.connect(token);
    this.sub = this.notificationService.notifications.subscribe(n => {
      this.unreadCount++;
      this.recentNotifications = [n, ...this.recentNotifications].slice(0, 5);
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); this.notificationService.disconnect(); }

  onMarkAsRead(n: Notification): void {
    this.notificationService.markAsRead(n.id).subscribe(() => { n.lida = true; this.unreadCount = Math.max(0, this.unreadCount - 1); });
  }

  onOpenDocument(n: Notification): void {
    if (!n.lida) this.notificationService.markAsRead(n.id).subscribe(() => { n.lida = true; this.unreadCount = Math.max(0, this.unreadCount - 1); this.router.navigate(['/editor', n.documento_id]); });
    else this.router.navigate(['/editor', n.documento_id]);
  }
}
