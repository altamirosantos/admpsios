import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { ContratoEmpresaIndexRoutingModule } from './contrato-empresa-index-routing.module';
import { ContratoEmpresaIndexComponent } from './contrato-empresa-index.component';

@NgModule({
    imports: [
        CommonModule,
        ContratoEmpresaIndexRoutingModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        InputNumberModule,
        InputSwitchModule,
        DropdownModule,
        CalendarModule,
        DialogModule,
        TagModule,
        TooltipModule
    ],
    declarations: [ContratoEmpresaIndexComponent]
})
export class ContratoEmpresaIndexModule { }
