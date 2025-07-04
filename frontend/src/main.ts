import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeDE from '@angular/common/locales/de';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Deutsche Locale registrieren
registerLocaleData(localeDE);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
