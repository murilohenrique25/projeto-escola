import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Documento, DocumentoCreate, DocumentoUpdate } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api/v1/documents';

    list(): Observable<Documento[]> {
        return this.http.get<Documento[]>(`${this.baseUrl}/`);
    }

    get(id: string): Observable<Documento> {
        return this.http.get<Documento>(`${this.baseUrl}/${id}`);
    }

    create(data: DocumentoCreate): Observable<Documento> {
        return this.http.post<Documento>(`${this.baseUrl}/`, data);
    }

    update(id: string, data: DocumentoUpdate): Observable<Documento> {
        return this.http.put<Documento>(`${this.baseUrl}/${id}`, data);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
