import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CategoriesIndexComponent } from './categories-index.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: CategoriesIndexComponent }
    ])],
    exports: [RouterModule]
})
export class CategoriesIndexRoutingModule { }