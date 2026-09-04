import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { AplicacaoNr1IndexRoutingModule } from './aplicacao-nr1-index-routing.module';
import { AplicacaoNr1IndexComponent } from './aplicacao-nr1-index.component';

@NgModule({
    imports: [
        CommonModule,
        AplicacaoNr1IndexRoutingModule,
        FormsModule,
        TableModule,
        TagModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        InputNumberModule,
        DropdownModule,
        DialogModule,
        TooltipModule
    ],
    declarations: [AplicacaoNr1IndexComponent]
})
export class AplicacaoNr1IndexModule { }
