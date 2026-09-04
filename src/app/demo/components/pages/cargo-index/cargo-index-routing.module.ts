import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CargoIndexComponent } from './cargo-index.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: CargoIndexComponent }
    ])],
    exports: [RouterModule]
})
export class CargoIndexRoutingModule { }
