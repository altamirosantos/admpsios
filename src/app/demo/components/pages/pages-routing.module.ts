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
        { path: 'empresas', canActivate: [authGuard], loadChildren: () => import('./empresa-index/empresa-index.module').then(m => m.EmpresaIndexModule) },
        { path: 'filiais', canActivate: [authGuard], loadChildren: () => import('./filial-index/filial-index.module').then(m => m.FilialIndexModule) },
        { path: 'colaboradores', canActivate: [authGuard], loadChildren: () => import('./colaborador-index/colaborador-index.module').then(m => m.ColaboradorIndexModule) },
        { path: 'setores', canActivate: [authGuard], loadChildren: () => import('./setor-index/setor-index.module').then(m => m.SetorIndexModule) },
        { path: 'cargos', canActivate: [authGuard], loadChildren: () => import('./cargo-index/cargo-index.module').then(m => m.CargoIndexModule) },
        { path: 'perguntas-nr1', canActivate: [authGuard], loadChildren: () => import('./pergunta-nr1-index/pergunta-nr1-index.module').then(m => m.PerguntaNr1IndexModule) },
        { path: 'modelos-proposta', canActivate: [authGuard], loadChildren: () => import('./modelo-proposta-index/modelo-proposta-index.module').then(m => m.ModeloPropostaIndexModule) },
        { path: 'servicos-proposta', canActivate: [authGuard], loadChildren: () => import('./servicos-proposta-index/servicos-proposta-index.module').then(m => m.ServicosPropostaIndexModule) },
        { path: 'propostas', canActivate: [authGuard], loadChildren: () => import('./proposta-empresa-index/proposta-empresa-index.module').then(m => m.PropostaEmpresaIndexModule) },
        { path: 'termometro', canActivate: [authGuard], loadChildren: () => import('./termometro-index/termometro-index.module').then(m => m.TermometroIndexModule)  },
        { path: '**', redirectTo: '/notfound' },

    ])],
    exports: [RouterModule]
})
export class PagesRoutingModule { }
