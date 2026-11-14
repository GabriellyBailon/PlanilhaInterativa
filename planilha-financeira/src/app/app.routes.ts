import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/planilha/pages/planilha-page.component').then(
        (module) => module.PlanilhaPageComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
