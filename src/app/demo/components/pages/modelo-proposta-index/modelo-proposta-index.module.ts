import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { ModeloPropostaIndexRoutingModule } from './modelo-proposta-index-routing.module';
import { ModeloPropostaIndexComponent } from './modelo-proposta-index.component';

@NgModule({
    imports: [
        CommonModule,
        ModeloPropostaIndexRoutingModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        DropdownModule,
        DialogModule,
        TagModule,
        TooltipModule
    ],
    declarations: [ModeloPropostaIndexComponent]
})
export class ModeloPropostaIndexModule { }
