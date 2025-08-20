import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PerguntaIndexComponent } from './pergunta-index.component';

@NgModule({
	imports: [RouterModule.forChild([
		{ path: '', component: PerguntaIndexComponent }
	])],
	exports: [RouterModule]
})
export class TermometroIndexRoutingModule { }
