import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Interceptador HTTP que desabilita cache para todas as requisições.
 * Isso garante que o navegador sempre faça nova requisição, mesmo sem conexão com servidor.
 *
 * Importante: Funciona em abas normais (não anônimas) e evita bugs de dados cacheados.
 */
@Injectable()
export class NoCacheInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Adicionar headers de no-cache
    const noCacheRequest = request.clone({
      setHeaders: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    return next.handle(noCacheRequest);
  }
}
