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
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { JogoInterativoIndexRoutingModule } from './jogo-interativo-index-routing.module';
import { JogoInterativoIndexComponent } from './jogo-interativo-index.component';

@NgModule({
    imports: [
        CommonModule,
        JogoInterativoIndexRoutingModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        InputTextareaModule,
        InputNumberModule,
        DialogModule
    ],
    declarations: [JogoInterativoIndexComponent]
})
export class JogoInterativoIndexModule { }
