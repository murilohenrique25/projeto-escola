import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getCurrentUser();
    if (!user) {
        return router.createUrlTree(['/login']);
    }

    const url = state.url;

    if (user.perfil === 'professor' && url.startsWith('/review')) {
        return router.createUrlTree(['/editor']);
    }

    if (user.perfil === 'coordenadora' && url.startsWith('/editor')) {
        return router.createUrlTree(['/review']);
    }

    return true;
};
