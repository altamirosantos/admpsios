import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Nr1DashboardIndexComponent } from './nr1-dashboard-index.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: Nr1DashboardIndexComponent }
    ])],
    exports: [RouterModule]
})
export class Nr1DashboardIndexRoutingModule { }
