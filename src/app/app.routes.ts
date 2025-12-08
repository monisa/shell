import { Routes } from '@angular/router';

import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { MfeHostComponent } from './shared/components/mfe-host/mfe-host.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { StyleGuideComponent } from './shared/components/style-guide/style-guide.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardPageComponent
  },
  {
    path: 'mfe/:mfeId',
    component: MfeHostComponent
  },
  {
    path: 'style-guide',
    component: StyleGuideComponent
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];
