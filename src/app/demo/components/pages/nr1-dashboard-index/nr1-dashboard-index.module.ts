import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Nr1DashboardIndexRoutingModule } from './nr1-dashboard-index-routing.module';
import { Nr1DashboardIndexComponent } from './nr1-dashboard-index.component';

@NgModule({
    imports: [
        CommonModule,
        Nr1DashboardIndexRoutingModule,
        FormsModule,
        TableModule,
        TagModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        DropdownModule,
        ChartModule,
        TooltipModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        CalendarModule,
        InputSwitchModule
    ],
    declarations: [Nr1DashboardIndexComponent]
})
export class Nr1DashboardIndexModule { }
