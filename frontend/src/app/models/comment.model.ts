export interface Comentario {
    id: string;
    documento_id: string;
    revisor_id: string;
    texto_comentario: string;
    offset_inicio: number;
    offset_fim: number;
}

export interface ComentarioCreate {
    documento_id: string;
    texto_comentario: string;
    offset_inicio: number;
    offset_fim: number;
}
