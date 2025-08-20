import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export const authGuard = async () => {
    const router = inject(Router);
    const supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);

    const { data } = await supabase.auth.getSession();

    if (data.session) {
        // usuário autenticado -> pode entrar
        console.log('Usuário autenticado >>> ', data.session);
        return true;
    } else {
        // não autenticado -> redireciona para login
        return router.parseUrl('/auth/login');
    }
};
