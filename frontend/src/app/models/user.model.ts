export interface User {
    id: string;
    email: string;
    perfil: 'professor' | 'coordenadora';
    escola_id: number;
}
