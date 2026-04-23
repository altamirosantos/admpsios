import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { N8nChatHistoriesIndexComponent } from './n8n-chat-histories-index.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: N8nChatHistoriesIndexComponent }
    ])],
    exports: [RouterModule]
})
export class N8nChatHistoriesIndexRoutingModule { }
