import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Interceptor HTTP — Inyecta el token de autenticación en cada petición.
 * El backend valida este header (X-Auth-Token) contra AUTH_TOKEN en su .env.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const authReq = req.clone({
    setHeaders: {
      'X-Auth-Token': environment.apiAuthToken,
    },
  });
  return next(authReq);
};
