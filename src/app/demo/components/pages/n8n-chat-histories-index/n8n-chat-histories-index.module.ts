import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { PaginatorModule } from 'primeng/paginator';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { N8nChatHistoriesIndexRoutingModule } from './n8n-chat-histories-index-routing.module';
import { N8nChatHistoriesIndexComponent } from './n8n-chat-histories-index.component';

@NgModule({
    imports: [
        CommonModule,
        N8nChatHistoriesIndexRoutingModule,
        FormsModule,
        ToolbarModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        DropdownModule,
        CalendarModule,
        PaginatorModule
    ],
    declarations: [N8nChatHistoriesIndexComponent]
})
export class N8nChatHistoriesIndexModule { }
