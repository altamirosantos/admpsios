import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { EdicaoIndexRoutingModule } from './edicao-index-routing.module';
import { EdicaoIndexComponent } from './edicao-index.component';

@NgModule({
    imports: [
        CommonModule,
        EdicaoIndexRoutingModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        TooltipModule,
        ToolbarModule,
        DropdownModule,
        InputTextModule,
        InputTextareaModule,
        DialogModule
    ],
    declarations: [EdicaoIndexComponent]
})
export class EdicaoIndexModule { }
