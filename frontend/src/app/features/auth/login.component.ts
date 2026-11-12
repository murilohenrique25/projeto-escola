import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-bg">
      <div class="login-card">
        <div class="login-logo">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="1.8">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        </div>
        <h1 class="login-title">Sistema Pedagógico</h1>
        <p class="login-sub">Faça login para continuar</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
          <div class="field-group">
            <label class="field-label">E-mail</label>
            <input class="field-input" type="email" formControlName="email" placeholder="seu@email.com" />
            <span class="field-error" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
              Informe um e-mail válido.
            </span>
          </div>

          <div class="field-group">
            <label class="field-label">Senha</label>
            <input class="field-input" type="password" formControlName="senha" placeholder="••••••••" />
            <span class="field-error" *ngIf="form.get('senha')?.invalid && form.get('senha')?.touched">
              Senha é obrigatória.
            </span>
          </div>

          <div class="auth-error" *ngIf="authError">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Credenciais inválidas. Verifique e tente novamente.
          </div>

          <button class="btn btn-primary login-btn" type="submit" [disabled]="loading">
            <span *ngIf="!loading">Entrar</span>
            <span *ngIf="loading" class="btn-loading">Entrando...</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-bg { min-height: 100vh; background: linear-gradient(135deg, #1565c0 0%, #0d47a1 50%, #1a237e 100%); display: flex; align-items: center; justify-content: center; padding: 24px; }
    .login-card { background: #fff; border-radius: 20px; padding: 48px 40px; width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,.3); text-align: center; }
    .login-logo { margin-bottom: 16px; }
    .login-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
    .login-sub { font-size: 14px; color: #757575; margin-bottom: 32px; }
    .login-form { text-align: left; display: flex; flex-direction: column; gap: 18px; }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 13px; font-weight: 600; color: #424242; }
    .field-input { padding: 12px 14px; border: 1.5px solid #e0e0e0; border-radius: 10px; font-size: 15px; outline: none; transition: border-color .2s, box-shadow .2s; }
    .field-input:focus { border-color: #1565c0; box-shadow: 0 0 0 3px rgba(21,101,192,.12); }
    .field-error { font-size: 12px; color: #c62828; }
    .auth-error { display: flex; align-items: center; gap: 8px; background: #ffebee; color: #c62828; padding: 10px 14px; border-radius: 8px; font-size: 13px; }
    .login-btn { width: 100%; justify-content: center; padding: 13px; font-size: 15px; border-radius: 10px; margin-top: 4px; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required]
  });

  loading = false;
  authError = false;

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.authError = false;
    const { email, senha } = this.form.value;
    this.auth.login(email!, senha!).subscribe({
      next: () => {
        const user = this.auth.getCurrentUser();
        this.router.navigate([user?.perfil === 'professor' ? '/editor' : '/review']);
      },
      error: () => { this.authError = true; this.loading = false; }
    });
  }
}
