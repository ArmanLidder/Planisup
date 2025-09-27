import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { NgxEditorModule } from 'ngx-editor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(
      NgxEditorModule.forRoot({
        locals: {
          // menu
          bold: 'Gras',
          italic: 'Italique',
          bullet_list: 'Liste à puces',
          ordered_list: 'Liste numérotée',
          url: 'Lien',
          // Ajoute d'autres traductions si besoin
        },
      })
    ),
  ]
};
