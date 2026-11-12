import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DocumentService } from '../../services/document.service';
import { CommentService } from '../../services/comment.service';
import { Documento } from '../../models/document.model';
import { Comentario } from '../../models/comment.model';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="review-page">

      <!-- Topbar -->
      <div class="review-topbar">
        <button class="back-btn" (click)="goBack()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </button>
        <div class="topbar-title">
          <h2>{{ documento?.titulo || 'Carregando...' }}</h2>
          <span class="badge badge-revisao" *ngIf="documento?.status === 'revisao'">Em Revisão</span>
        </div>
        <div class="topbar-actions">
          <span class="hint-text">Selecione um trecho para comentar</span>
          <button class="btn btn-success btn-sm" *ngIf="documento?.status === 'revisao'" (click)="finalizar()">
            ✓ Finalizar Revisão
          </button>
        </div>
      </div>

      <!-- Layout principal -->
      <div class="review-body">

        <!-- Documento -->
        <div class="doc-pane">
          <div class="doc-paper" #docContainer (mouseup)="onMouseUp($event)">
            <div *ngIf="!documento" class="spinner"></div>
            <div *ngIf="documento" [innerHTML]="documentoHtml"></div>
          </div>
        </div>

        <!-- Painel de comentários -->
        <div class="comments-pane">
          <div class="comments-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Comentários
            <span class="comments-count">{{ comentarios.length }}</span>
          </div>

          <div class="comments-empty" *ngIf="comentarios.length === 0">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p>Nenhum comentário ainda.<br>Selecione um trecho para começar.</p>
          </div>

          <div class="comment-card" *ngFor="let c of comentarios" (click)="destacarComentario(c)" [class.active]="comentarioAtivo?.id === c.id">
            <div class="comment-trecho">"{{ getTrecho(c) }}"</div>
            <div class="comment-texto">{{ c.texto_comentario }}</div>
            <div class="comment-meta">Trecho {{ c.offset_inicio }}–{{ c.offset_fim }}</div>
          </div>
        </div>
      </div>

      <!-- Modal de novo comentário -->
      <div class="modal-overlay" *ngIf="showModal" (click)="fecharModal()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <h3 class="modal-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 12 2z"/></svg>
            Adicionar Comentário
          </h3>
          <div class="modal-trecho" *ngIf="textoSelecionado">
            <span class="trecho-label">Trecho selecionado:</span>
            <span class="trecho-texto">"{{ textoSelecionado }}"</span>
          </div>
          <textarea
            class="modal-textarea"
            [(ngModel)]="textoComentario"
            placeholder="Escreva seu comentário sobre este trecho..."
            rows="4"
            autofocus
          ></textarea>
          <div class="modal-actions">
            <button class="btn btn-ghost" (click)="fecharModal()">Cancelar</button>
            <button class="btn btn-primary" (click)="salvarComentario()" [disabled]="!textoComentario.trim()">
              Salvar Comentário
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .review-page { min-height: calc(100vh - 56px); display: flex; flex-direction: column; background: #f0f2f5; }

    /* Topbar */
    .review-topbar { display: flex; align-items: center; gap: 16px; padding: 10px 24px; background: #fff; border-bottom: 1px solid #e0e0e0; position: sticky; top: 56px; z-index: 50; }
    .back-btn { display: flex; align-items: center; gap: 4px; background: none; border: none; color: #1565c0; font-size: 14px; font-weight: 500; cursor: pointer; padding: 6px 10px; border-radius: 6px; white-space: nowrap; }
    .back-btn:hover { background: #e3f2fd; }
    .topbar-title { flex: 1; display: flex; align-items: center; gap: 12px; }
    .topbar-title h2 { font-size: 17px; font-weight: 600; color: #1a1a2e; margin: 0; }
    .topbar-actions { display: flex; align-items: center; gap: 12px; }
    .hint-text { font-size: 13px; color: #9e9e9e; font-style: italic; }

    /* Body */
    .review-body { flex: 1; display: flex; overflow: hidden; height: calc(100vh - 56px - 57px); }

    /* Doc pane */
    .doc-pane { flex: 1; overflow-y: auto; padding: 32px 24px; display: flex; justify-content: center; background: #f0f2f5; }
    .doc-paper { width: 100%; max-width: 760px; background: #fff; border-radius: 4px; box-shadow: 0 2px 12px rgba(0,0,0,.1); padding: 48px 56px; min-height: 500px; font-size: 15px; line-height: 1.8; cursor: text; user-select: text; }
    .doc-paper ::ng-deep mark { background: #fff3cd; border-radius: 2px; cursor: pointer; padding: 1px 0; }
    .doc-paper ::ng-deep mark.active-mark { background: #ffb300; }

    /* Comments pane */
    .comments-pane { width: 300px; border-left: 1px solid #e0e0e0; background: #fff; overflow-y: auto; display: flex; flex-direction: column; }
    .comments-header { display: flex; align-items: center; gap: 8px; padding: 16px; font-size: 14px; font-weight: 600; color: #424242; border-bottom: 1px solid #f0f0f0; position: sticky; top: 0; background: #fff; z-index: 1; }
    .comments-count { background: #1565c0; color: #fff; border-radius: 50%; width: 20px; height: 20px; font-size: 11px; display: flex; align-items: center; justify-content: center; margin-left: auto; }
    .comments-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #9e9e9e; padding: 32px 16px; text-align: center; font-size: 13px; }
    .comment-card { padding: 14px 16px; border-bottom: 1px solid #f5f5f5; cursor: pointer; transition: background .15s; }
    .comment-card:hover { background: #f5f5f5; }
    .comment-card.active { background: #e3f2fd; border-left: 3px solid #1565c0; }
    .comment-trecho { font-size: 12px; color: #757575; font-style: italic; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .comment-texto { font-size: 14px; color: #212121; line-height: 1.4; }
    .comment-meta { font-size: 11px; color: #bdbdbd; margin-top: 6px; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 200; }
    .modal-box { background: #fff; border-radius: 16px; padding: 32px; width: 480px; box-shadow: 0 12px 40px rgba(0,0,0,.25); }
    .modal-title { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 700; margin-bottom: 20px; color: #1a1a2e; }
    .modal-trecho { background: #f5f5f5; border-left: 3px solid #1565c0; padding: 10px 14px; border-radius: 0 8px 8px 0; margin-bottom: 16px; }
    .trecho-label { display: block; font-size: 11px; font-weight: 600; color: #9e9e9e; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
    .trecho-texto { font-size: 14px; color: #424242; font-style: italic; }
    .modal-textarea { width: 100%; padding: 12px 14px; border: 1.5px solid #e0e0e0; border-radius: 10px; font-size: 14px; font-family: inherit; resize: vertical; outline: none; transition: border-color .2s; }
    .modal-textarea:focus { border-color: #1565c0; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
  `]
})
export class ReviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private documentService = inject(DocumentService);
  private commentService = inject(CommentService);
  private sanitizer = inject(DomSanitizer);

  documentoId = '';
  documento: Documento | null = null;
  comentarios: Comentario[] = [];
  documentoHtml: SafeHtml = '';

  selectionStart = 0;
  selectionEnd = 0;
  textoSelecionado = '';
  showModal = false;
  textoComentario = '';
  comentarioAtivo: Comentario | null = null;

  ngOnInit(): void {
    this.documentoId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.documentoId) return;

    this.documentService.get(this.documentoId).subscribe(doc => {
      this.documento = doc;
      this.renderizar();
    });

    this.commentService.listComments(this.documentoId).subscribe(cs => {
      this.comentarios = cs;
      this.renderizar();
    });
  }

  onMouseUp(event: MouseEvent): void {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return;

    const container = (event.currentTarget as HTMLElement);
    const range = selection.getRangeAt(0);

    const preRange = document.createRange();
    preRange.selectNodeContents(container);
    preRange.setEnd(range.startContainer, range.startOffset);

    const start = preRange.toString().length;
    const end = start + range.toString().length;

    if (end > start) {
      this.selectionStart = start;
      this.selectionEnd = end;
      this.textoSelecionado = selection.toString().trim().slice(0, 80) + (selection.toString().length > 80 ? '...' : '');
      this.showModal = true;
    }
  }

  salvarComentario(): void {
    if (!this.textoComentario.trim()) return;
    this.commentService.createComment({
      documento_id: this.documentoId,
      texto_comentario: this.textoComentario.trim(),
      offset_inicio: this.selectionStart,
      offset_fim: this.selectionEnd
    }).subscribe(c => {
      this.comentarios = [...this.comentarios, c];
      this.renderizar();
      this.fecharModal();
    });
  }

  fecharModal(): void {
    this.showModal = false;
    this.textoComentario = '';
    this.textoSelecionado = '';
    window.getSelection()?.removeAllRanges();
  }

  destacarComentario(c: Comentario): void {
    this.comentarioAtivo = this.comentarioAtivo?.id === c.id ? null : c;
  }

  getTrecho(c: Comentario): string {
    const html = (this.documento?.conteudo_json as any)?.html ?? '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const texto = tmp.textContent ?? '';
    return texto.slice(c.offset_inicio, c.offset_fim).slice(0, 60) + (c.offset_fim - c.offset_inicio > 60 ? '...' : '');
  }

  finalizar(): void {
    if (!this.documento) return;
    this.documentService.update(this.documentoId, { status: 'finalizado' }).subscribe(d => {
      this.documento = d;
    });
  }

  goBack(): void { this.router.navigate(['/review']); }

  private renderizar(): void {
    if (!this.documento) return;
    const html = (this.documento.conteudo_json as any)?.html ?? '';
    const destacado = this.aplicarMarks(html, this.comentarios);
    this.documentoHtml = this.sanitizer.bypassSecurityTrustHtml(destacado);
  }

  private aplicarMarks(html: string, comentarios: Comentario[]): string {
    if (!comentarios.length) return html;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const texto = tmp.textContent ?? '';
    const ordenados = [...comentarios].sort((a, b) => b.offset_inicio - a.offset_inicio);
    let resultado = texto;
    for (const c of ordenados) {
      const i = Math.max(0, c.offset_inicio);
      const f = Math.min(resultado.length, c.offset_fim);
      if (f <= i) continue;
      const isActive = this.comentarioAtivo?.id === c.id;
      resultado = resultado.slice(0, i)
        + `<mark class="${isActive ? 'active-mark' : ''}" title="${c.texto_comentario.replace(/"/g, '&quot;')}">${resultado.slice(i, f)}</mark>`
        + resultado.slice(f);
    }
    return resultado;
  }
}
