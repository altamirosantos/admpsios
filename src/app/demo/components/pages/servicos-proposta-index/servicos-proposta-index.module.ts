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
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { ServicosPropostaIndexRoutingModule } from './servicos-proposta-index-routing.module';
import { ServicosPropostaIndexComponent } from './servicos-proposta-index.component';

@NgModule({
    imports: [
        CommonModule,
        ServicosPropostaIndexRoutingModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        InputTextareaModule,
        DropdownModule,
        DialogModule,
        TagModule,
        TooltipModule
    ],
    declarations: [ServicosPropostaIndexComponent]
})
export class ServicosPropostaIndexModule { }
