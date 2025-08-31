import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ResourcesIndexComponent } from './resources-index.component';

@NgModule({
	imports: [RouterModule.forChild([
		{ path: '', component: ResourcesIndexComponent }
	])],
	exports: [RouterModule]
})
export class ResourcesIndexRoutingModule { }
