import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from 'src/app/demo/service/supabase.service';
import { LayoutService } from 'src/app/layout/service/app.layout.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    standalone:false,
    styles: [`
        :host ::ng-deep .pi-eye,
        :host ::ng-deep .pi-eye-slash {
            transform:scale(1.6);
            margin-right: 1rem;
            color: var(--primary-color) !important;
        }
    `]
})
export class LoginComponent {

    valCheck: string[] = ['remember'];

    email!: string;
    password!: string;
    errorMessage: string = '';

    constructor(public layoutService: LayoutService, private supabaseService: SupabaseService, private router: Router) { }

    async login() {
        console.log(this.email, this.password)
        const { error } = await this.supabaseService.signIn(this.email, this.password);

        if (error) {
             console.log('error >>> ', error.message)
            this.errorMessage = error.message;
        } else {
            console.log('Login efetuado com sucesso');
            this.router.navigate(['/']);
        }
    }
}
