import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comentario, ComentarioCreate } from '../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
    private http = inject(HttpClient);

    createComment(data: ComentarioCreate): Observable<Comentario> {
        if (data.offset_fim <= data.offset_inicio) {
            throw new Error('offset_fim deve ser maior que offset_inicio');
        }
        return this.http.post<Comentario>('/api/v1/comments/', data);
    }

    listComments(documentoId: string): Observable<Comentario[]> {
        return this.http.get<Comentario[]>(`/api/v1/comments/?documento_id=${documentoId}`);
    }
}
