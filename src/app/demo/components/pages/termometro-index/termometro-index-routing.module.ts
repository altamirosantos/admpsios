import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TermometroIndexComponent } from './termometro-index.component';

@NgModule({
	imports: [RouterModule.forChild([
		{ path: '', component: TermometroIndexComponent }
	])],
	exports: [RouterModule]
})
export class TermometroIndexRoutingModule { }
