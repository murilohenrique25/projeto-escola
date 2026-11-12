import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet],
    template: `
    <nav class="navbar" *ngIf="showNav">
      <div class="navbar-brand">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
        Sistema Pedagógico
      </div>
      <div class="navbar-right">
        <span class="navbar-user">{{ userEmail }}</span>
        <button class="navbar-btn" (click)="logout()">Sair</button>
      </div>
    </nav>
    <div class="page">
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent {
    private auth = inject(AuthService);
    private router = inject(Router);

    showNav = false;

    get userEmail(): string {
        return this.auth.getCurrentUser()?.email ?? '';
    }

    constructor() {
        this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
            this.showNav = !e.url.includes('/login');
        });
    }

    logout(): void {
        this.auth.logout();
        this.router.navigate(['/login']);
    }
}
