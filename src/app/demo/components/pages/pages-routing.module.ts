import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { authGuard } from '../../service/auth.guard';

@NgModule({
    imports: [RouterModule.forChild([
        { path: 'crud', loadChildren: () => import('./crud/crud.module').then(m => m.CrudModule) },
        { path: 'empty', loadChildren: () => import('./empty/emptydemo.module').then(m => m.EmptyDemoModule) },
        { path: 'timeline', loadChildren: () => import('./timeline/timelinedemo.module').then(m => m.TimelineDemoModule) },
        { path: 'pergunta', canActivate: [authGuard], loadChildren: () => import('./pergunta-index/pergunta-index.module').then(m => m.PerguntaIndexModule)  },
        { path: 'termometro', canActivate: [authGuard], loadChildren: () => import('./termometro-index/termometro-index.module').then(m => m.TermometroIndexModule)  },
        { path: '**', redirectTo: '/notfound' },

    ])],
    exports: [RouterModule]
})
export class PagesRoutingModule { }
