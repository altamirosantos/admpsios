import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { authGuard } from '../../service/auth.guard';

@NgModule({
    imports: [RouterModule.forChild([
        { path: 'crud', loadChildren: () => import('./crud/crud.module').then(m => m.CrudModule) },
        { path: 'empty', loadChildren: () => import('./empty/emptydemo.module').then(m => m.EmptyDemoModule) },
        { path: 'timeline', loadChildren: () => import('./timeline/timelinedemo.module').then(m => m.TimelineDemoModule) },
        { path: 'edicoes', canActivate: [authGuard], loadChildren: () => import('./edicao-index/edicao-index.module').then(m => m.EdicaoIndexModule) },
        { path: 'pergunta', canActivate: [authGuard], loadChildren: () => import('./pergunta-index/pergunta-index.module').then(m => m.PerguntaIndexModule)  },
        { path: 'autoavaliacoes', canActivate: [authGuard], loadChildren: () => import('./autoavaliacoes-index/autoavaliacoes-index.module').then(m => m.AutoavaliacoesIndexModule)  },
        { path: 'chat-histories', canActivate: [authGuard], loadChildren: () => import('./n8n-chat-histories-index/n8n-chat-histories-index.module').then(m => m.N8nChatHistoriesIndexModule) },
        { path: 'media-categories', canActivate: [authGuard], loadChildren: () => import('./categories-index/categories-index.module').then(m => m.CategoriesIndexModule) },
        { path: 'resources', canActivate: [authGuard], loadChildren: () => import('./resources-index/resources-index.module').then(m => m.ResourcesIndexModule)  },
        { path: 'jogos-interativos', canActivate: [authGuard], loadChildren: () => import('./jogo-interativo-index/jogo-interativo-index.module').then(m => m.JogoInterativoIndexModule) },
        { path: 'termometro', canActivate: [authGuard], loadChildren: () => import('./termometro-index/termometro-index.module').then(m => m.TermometroIndexModule)  },
        { path: '**', redirectTo: '/notfound' },

    ])],
    exports: [RouterModule]
})
export class PagesRoutingModule { }
