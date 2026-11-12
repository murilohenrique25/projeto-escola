export interface Documento {
    id: string;
    titulo: string;
    conteudo_json: Record<string, unknown>;
    autor_id: string;
    status: 'rascunho' | 'revisao' | 'finalizado';
    criado_em: string;
}

export interface DocumentoCreate {
    titulo: string;
    conteudo_json: Record<string, unknown>;
}

export interface DocumentoUpdate {
    titulo?: string;
    conteudo_json?: Record<string, unknown>;
    status?: 'rascunho' | 'revisao' | 'finalizado';
}
