import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { SupabaseService } from 'src/app/demo/service/supabase.service';
import { LayoutService } from "./service/app.layout.service";

@Component({
    selector: 'app-topbar',
    templateUrl: './app.topbar.component.html'
})
export class AppTopBarComponent {

    items!: MenuItem[];

    @ViewChild('menubutton') menuButton!: ElementRef;

    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;

    @ViewChild('topbarmenu') menu!: ElementRef;

    constructor(public layoutService: LayoutService, private supabaseService: SupabaseService, private router: Router) { }

    async sair() {
        console.log('sair');
      //  const ret = this.supabaseService.signOut();
      //  console.log(ret);
        //window.location.reload();

        const { data: { session } } = await this.supabaseService.getSession();

        if (session) {
            const { error } = await this.supabaseService.signOut();
            if (error) {
                console.error('Erro ao sair:', error.message);
            }
        }

        // Limpa o localStorage e redireciona
        localStorage.removeItem('token');
        this.router.navigate(['/auth/login']);
    }
}
