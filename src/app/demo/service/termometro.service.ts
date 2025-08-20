import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


@Injectable({
    providedIn: 'root'
  })
export class TermometroService {

    private resource: string = "termometro";
    constructor(private http: HttpClient) {

    }

    create(dados: any): Observable<any> {
        let headers = new HttpHeaders();
        headers.append('Content-Type', 'Application/json; charset=UTF-8');
        return this.http.post(`${environment.API_ENDPOINT}/${this.resource}/save`, dados, { headers: headers });

    }
    update(dados: any): Observable<any> {
        let headers = new HttpHeaders();
        headers.append('Content-Type', 'Application/json; charset=UTF-8');
        return this.http.put(`${environment.API_ENDPOINT}/${this.resource}/save`, dados, { headers: headers })
    }

    delete(id: any): Observable<any> {
        //dados.id = dados.regime_id;
        let headers = new HttpHeaders();
        headers.append('Content-Type', 'Application/json; charset=UTF-8');
        return this.http.delete(`${environment.API_ENDPOINT}/${this.resource}/delete/id/${id}`, { headers: headers })
    }

    findAll(dados: any) {
        let headers = new HttpHeaders();
        return this.http.get(`${environment.API_ENDPOINT}/${this.resource}/findall`, { headers: headers });
        //return new ServerDataSource(this.http, { dataKey: 'rows', endPoint: `${environment.API_ENDPOINT}/${this.resource}/findall` });
    }

    findItemTermometroAll(id: any) {
        let headers = new HttpHeaders();
        return this.http.get(`${environment.API_ENDPOINT}/itemtermometro/findallbytermometro/id/${id}`, { headers: headers });
        //return new ServerDataSource(this.http, { dataKey: 'rows', endPoint: `${environment.API_ENDPOINT}/${this.resource}/findall` });
    }


    getSelect(): Observable<any> {
        let headers = new HttpHeaders();
        headers.append('Content-Type', 'Application/json; charset=UTF-8');
        return this.http.get(`${environment.API_ENDPOINT}/${this.resource}/getselect`, { headers: headers })
        //return new ServerDataSource(this.http, { dataKey: 'rows', endPoint: AppSettingService.API_ENDPOINT + '/regime/getselect' });
    }

    find(id: string): Observable<any> {
        //let dados = { id: id };
        let headers = new HttpHeaders();
        headers.append('Content-Type', 'Application/json; charset=UTF-8');
        return this.http.get(`${environment.API_ENDPOINT}/${this.resource}/find/id/${id}`, { headers: headers })
    }
}
