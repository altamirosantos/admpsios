import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { PerguntaNr1IndexRoutingModule } from './pergunta-nr1-index-routing.module';
import { PerguntaNr1IndexComponent } from './pergunta-nr1-index.component';

@NgModule({
    imports: [
        CommonModule,
        PerguntaNr1IndexRoutingModule,
        FormsModule,
        TableModule,
        TagModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        InputNumberModule,
        InputTextareaModule,
        DialogModule,
        TooltipModule
    ],
    declarations: [PerguntaNr1IndexComponent]
})
export class PerguntaNr1IndexModule { }
