import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { CategoriesIndexRoutingModule } from './categories-index-routing.module';
import { CategoriesIndexComponent } from './categories-index.component';

@NgModule({
    imports: [
        CommonModule,
        CategoriesIndexRoutingModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        InputTextareaModule,
        DialogModule
    ],
    declarations: [CategoriesIndexComponent]
})
export class CategoriesIndexModule { }