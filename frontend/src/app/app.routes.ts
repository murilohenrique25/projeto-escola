import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { DashboardComponent } from './features/editor/dashboard.component';
import { EditorComponent } from './features/editor/editor.component';
import { ReviewListComponent } from './features/review/review-list.component';
import { ReviewComponent } from './features/review/review.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'editor', component: DashboardComponent, canActivate: [authGuard, roleGuard] },
    { path: 'editor/:id', component: EditorComponent, canActivate: [authGuard, roleGuard] },
    { path: 'review', component: ReviewListComponent, canActivate: [authGuard, roleGuard] },
    { path: 'review/:id', component: ReviewComponent, canActivate: [authGuard, roleGuard] },
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '**', redirectTo: 'login' },
];
