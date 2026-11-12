# Documento de Análise Técnica: Sistema de Gestão e Revisão Pedagógica

## 1. Visão Geral

Este sistema visa otimizar a criação e revisão de documentos acadêmicos. O **Professor** é o autor do conteúdo, enquanto a **Coordenadora** atua como revisora técnica/pedagógica, utilizando um fluxo de trabalho baseado em comentários contextuais.

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais (RF)

| ID | Título | Descrição |
|----|--------|-----------|
| RF01 | Gestão de Perfis | Acesso restrito para Professor (Autor) e Coordenadora (Revisora). |
| RF02 | Editor Rich Text | Ferramentas de formatação (Negrito, Itálico, Listas) integradas ao sistema. |
| RF03 | Vínculo Hierárquico | Filtragem automática de documentos por Escola e Cidade do usuário. |
| RF04 | Revisão por Trecho | Coordenadora seleciona parte do texto para anexar comentários. |
| RF05 | Notificações | Alertas em tempo real no dashboard do Professor sobre novas revisões. |
| RF06 | Preview A4 | Visualização prévia do documento com layout fiel à impressão. |
| RF07 | Segurança de Login | Autenticação via E-mail/Senha com persistência de hash. |

### 2.2 Requisitos Não Funcionais (RNF)

- **Front-end:** Angular 16+ (Utilizando Standalone Components)
- **Back-end:** FastAPI (Python 3.10+) com Pydantic v2
- **Banco de Dados:** PostgreSQL com suporte a JSONB
- **Criptografia:** Senhas armazenadas via algoritmo Bcrypt
- **Autenticação:** JWT (JSON Web Tokens)

---

## 3. Modelagem de Dados

### 3.1 Estrutura das Tabelas (PostgreSQL)

#### Tabela: `users`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Primary Key |
| `email` | String | Unique |
| `hashed_password` | String | Senha criptografada |
| `perfil` | Enum | `'professor'` ou `'coordenadora'` |
| `escola_id` | Integer | Foreign Key |
| `cidade_id` | Integer | Foreign Key |

#### Tabela: `documents`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Primary Key |
| `titulo` | String | — |
| `conteudo_json` | JSONB | Estrutura do documento formatado |
| `autor_id` | FK | Referência a `users.id` |
| `status` | Enum | `'rascunho'`, `'revisao'` ou `'finalizado'` |

#### Tabela: `comments`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Primary Key |
| `documento_id` | FK | Referência a `documents.id` |
| `revisor_id` | FK | Referência a `users.id` |
| `texto_comentario` | Text | — |
| `offset_inicio` | Integer | Posição inicial do texto selecionado |
| `offset_fim` | Integer | Posição final do texto selecionado |

---

## 4. Arquitetura de Pastas Profissional

### 4.1 Backend (FastAPI)

```
/backend
├── app/
│   ├── api/v1/             # Rotas (auth, docs, comments)
│   ├── core/               # Security (JWT/Bcrypt), Configs (.env)
│   ├── database/           # Conexão e Sessão (SQLAlchemy)
│   ├── models/             # Modelos de Tabela (DB)
│   ├── schemas/            # Schemas de Entrada/Saída (Pydantic)
│   ├── services/           # Lógica de negócio (Notificações, CRUD)
│   └── main.py             # Entrypoint
├── alembic/                # Migrações de Banco
└── requirements.txt        # Dependências (FastAPI, Passlib, Uvicorn)
```

### 4.2 Frontend (Angular 16+)

```
/frontend
├── src/app/
│   ├── core/               # Interceptors, Guards, Auth Service
│   ├── shared/             # Components (NavBar, Modal, Preview)
│   ├── features/
│   │   ├── auth/           # Login / Logout
│   │   ├── editor/         # Workspace do Professor
│   │   └── review/         # Tela de Revisão da Coordenadora
│   ├── models/             # Interfaces TypeScript
│   └── services/           # Chamadas à API (HttpClient)
```

---

## 5. Fluxo de Execução Técnica

1. **Autenticação:** O usuário faz login; o FastAPI valida o `hashed_password` e retorna um JWT contendo o `escola_id`.
2. **Criação:** O Professor redige no editor (ex: CKEditor 5). Ao salvar, o conteúdo é enviado como um objeto JSON para o banco.
3. **Comentários:** A Coordenadora acessa a lista filtrada por sua Escola. Ao selecionar um texto, o Angular captura o índice do caractere e envia para o endpoint de comentários.
4. **Notificação:** O sistema utiliza um `Subject` no Angular ou SSE no Backend para disparar o alerta visual no perfil do Professor.

---

## 6. Observações Sênior para Implementação

- **Sanitização:** Use o `DomSanitizer` do Angular para renderizar o preview com segurança.
- **Performance:** Para o preview em tempo real, utilize `DebounceTime` no input do editor para não sobrecarregar o renderizador.
- **Multi-tenancy:** Garanta que a Coordenadora só visualize documentos onde `document.autor.escola_id == coordenadora.escola_id`.
