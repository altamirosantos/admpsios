import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { EmpresaIndexRoutingModule } from './empresa-index-routing.module';
import { EmpresaIndexComponent } from './empresa-index.component';

@NgModule({
    imports: [
        CommonModule,
        EmpresaIndexRoutingModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        CalendarModule,
        DialogModule,
        TooltipModule
    ],
    declarations: [EmpresaIndexComponent]
})
export class EmpresaIndexModule { }
