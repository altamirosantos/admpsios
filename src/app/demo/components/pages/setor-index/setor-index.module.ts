import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { SetorIndexRoutingModule } from './setor-index-routing.module';
import { SetorIndexComponent } from './setor-index.component';

@NgModule({
    imports: [
        CommonModule,
        SetorIndexRoutingModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        DropdownModule,
        DialogModule,
        TooltipModule
    ],
    declarations: [SetorIndexComponent]
})
export class SetorIndexModule { }
