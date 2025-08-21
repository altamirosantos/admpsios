import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AutoavaliacoesIndexComponent } from './autoavaliacoes-index.component';

@NgModule({
	imports: [RouterModule.forChild([
		{ path: '', component: AutoavaliacoesIndexComponent }
	])],
	exports: [RouterModule]
})
export class AutoavaliacoesIndexRoutingModule { }
