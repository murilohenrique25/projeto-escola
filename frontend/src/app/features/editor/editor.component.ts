import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuillModule } from 'ngx-quill';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { DocumentService } from '../../services/document.service';
import { CommentService } from '../../services/comment.service';
import { NotificationService, Notification } from '../../services/notification.service';
import { Documento } from '../../models/document.model';
import { Comentario } from '../../models/comment.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
  template: `
    <div class="editor-page">

      <!-- Topbar -->
      <div class="editor-topbar">
        <button class="back-btn" (click)="goBack()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </button>
        <div class="doc-title-wrap">
          <input class="doc-title-input" [(ngModel)]="titulo" placeholder="Título do documento" (blur)="autoSave()" />
        </div>
        <div class="topbar-actions">
          <span class="save-status" [class.saved]="saved" [class.saving]="saving">
            {{ saving ? 'Salvando...' : saved ? '✓ Salvo' : '' }}
          </span>
          <button class="btn btn-ghost btn-sm" (click)="togglePreview()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Preview A4
          </button>
          <button class="btn btn-success" (click)="save()" [disabled]="saving">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Salvar
          </button>
          <button class="btn btn-warning btn-sm" *ngIf="doc?.status === 'rascunho'" (click)="sendToReview()">
            Enviar para Revisão
          </button>
          <span class="badge badge-{{ doc?.status }}" *ngIf="doc?.status">{{ statusLabel(doc!.status) }}</span>
        </div>
      </div>

      <!-- Layout principal -->
      <div class="editor-body">

        <!-- Editor Quill -->
        <div class="editor-pane">
          <div class="editor-paper">
            <quill-editor
              [(ngModel)]="editorData"
              [modules]="quillModules"
              [formats]="quillFormats"
              (onContentChanged)="onContentChanged($event)"
              placeholder="Comece a escrever seu documento..."
            ></quill-editor>
          </div>
        </div>

        <!-- Painel de comentários -->
        <div class="comments-pane" *ngIf="comentarios.length > 0 || doc?.status === 'revisao' || doc?.status === 'finalizado'">
          <div class="comments-pane-header">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Sugestões da Coordenadora
            <span class="pane-badge" *ngIf="pendentes > 0">{{ pendentes }}</span>
          </div>
          <div class="comments-empty" *ngIf="comentarios.length === 0">
            <p>Nenhuma sugestão ainda.</p>
          </div>
          <div
            class="comment-card"
            *ngFor="let c of comentarios"
            [class.resolved]="resolvedIds.has(c.id)"
            [class.active]="comentarioAtivo?.id === c.id"
            (click)="focarComentario(c)"
          >
            <div class="comment-card-header">
              <span class="comment-icon">💬</span>
              <span class="comment-trecho">"{{ getTrecho(c) }}"</span>
              <span class="resolved-tag" *ngIf="resolvedIds.has(c.id)">✓ Resolvido</span>
            </div>
            <p class="comment-body">{{ c.texto_comentario }}</p>
            <div class="comment-footer">
              <span class="comment-pos">Posição {{ c.offset_inicio }}–{{ c.offset_fim }}</span>
              <button class="btn-resolve" *ngIf="!resolvedIds.has(c.id)" (click)="$event.stopPropagation(); marcarResolvido(c)">
                ✓ Marcar como resolvido
              </button>
              <button class="btn-unresolve" *ngIf="resolvedIds.has(c.id)" (click)="$event.stopPropagation(); desmarcarResolvido(c)">
                Reabrir
              </button>
            </div>
          </div>
          <div class="resolved-summary" *ngIf="comentarios.length > 0">
            {{ resolvedIds.size }}/{{ comentarios.length }} resolvidos
          </div>
        </div>

      </div>

      <!-- Modal Preview A4 -->
      <div class="modal-overlay" *ngIf="showPreview" (click)="togglePreview()">
        <div class="preview-modal" (click)="$event.stopPropagation()">
          <div class="preview-modal-header">
            <span class="preview-label">Preview A4</span>
            <button class="preview-close" (click)="togglePreview()">✕</button>
          </div>
          <div class="preview-scroll">
            <div class="a4-page ql-editor" [innerHTML]="previewHtml"></div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .editor-page { min-height: calc(100vh - 56px); display: flex; flex-direction: column; background: #f0f2f5; }

    .editor-topbar { display: flex; align-items: center; gap: 16px; padding: 10px 24px; background: #fff; border-bottom: 1px solid #e0e0e0; position: sticky; top: 56px; z-index: 50; }
    .back-btn { display: flex; align-items: center; gap: 4px; background: none; border: none; color: #1565c0; font-size: 14px; font-weight: 500; cursor: pointer; padding: 6px 10px; border-radius: 6px; }
    .back-btn:hover { background: #e3f2fd; }
    .doc-title-wrap { flex: 1; }
    .doc-title-input { width: 100%; border: none; outline: none; font-size: 18px; font-weight: 600; color: #1a1a2e; background: transparent; padding: 4px 0; border-bottom: 2px solid transparent; transition: border-color .2s; }
    .doc-title-input:focus { border-bottom-color: #1565c0; }
    .topbar-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .save-status { font-size: 13px; color: #9e9e9e; min-width: 80px; }
    .save-status.saved { color: #2e7d32; }
    .save-status.saving { color: #1565c0; }

    .editor-body { flex: 1; display: flex; overflow: hidden; height: calc(100vh - 56px - 57px); }

    .editor-pane { flex: 1; overflow-y: auto; padding: 32px 24px; display: flex; justify-content: center; }
    .editor-paper { width: 100%; max-width: 820px; background: #fff; border-radius: 4px; box-shadow: 0 2px 12px rgba(0,0,0,.1); overflow: hidden; display: flex; flex-direction: column; }

    /* Quill overrides */
    :host ::ng-deep .ql-toolbar { border: none; border-bottom: 1px solid #e0e0e0; background: #fafafa; padding: 8px 12px; flex-wrap: wrap; }
    :host ::ng-deep .ql-container { border: none; font-size: 15px; flex: 1; }
    :host ::ng-deep .ql-editor { min-height: 500px; padding: 32px 40px; line-height: 1.8; }
    :host ::ng-deep .ql-editor.ql-blank::before { color: #bdbdbd; font-style: normal; }

    /* Comments pane */
    .comments-pane { width: 320px; border-left: 1px solid #e0e0e0; background: #fff; overflow-y: auto; display: flex; flex-direction: column; }
    .comments-pane-header { display: flex; align-items: center; gap: 8px; padding: 16px; font-size: 13px; font-weight: 700; color: #424242; border-bottom: 1px solid #f0f0f0; position: sticky; top: 0; background: #fff; z-index: 1; text-transform: uppercase; letter-spacing: .5px; }
    .pane-badge { background: #e65100; color: #fff; border-radius: 50%; width: 20px; height: 20px; font-size: 11px; display: flex; align-items: center; justify-content: center; margin-left: auto; }
    .comments-empty { padding: 32px 16px; text-align: center; color: #9e9e9e; font-size: 13px; }
    .comment-card { padding: 14px 16px; border-bottom: 1px solid #f5f5f5; cursor: pointer; transition: background .15s; border-left: 3px solid transparent; }
    .comment-card:hover { background: #fafafa; }
    .comment-card.active { background: #fff8e1; border-left-color: #ffb300; }
    .comment-card.resolved { opacity: .55; background: #f9f9f9; }
    .comment-card-header { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
    .comment-icon { font-size: 14px; flex-shrink: 0; }
    .comment-trecho { font-size: 12px; color: #757575; font-style: italic; flex: 1; line-height: 1.4; }
    .resolved-tag { font-size: 11px; color: #2e7d32; font-weight: 700; white-space: nowrap; }
    .comment-body { font-size: 14px; color: #212121; line-height: 1.5; margin: 0 0 10px; }
    .comment-footer { display: flex; justify-content: space-between; align-items: center; }
    .comment-pos { font-size: 11px; color: #bdbdbd; }
    .btn-resolve { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn-resolve:hover { background: #c8e6c9; }
    .btn-unresolve { background: #fff3e0; color: #e65100; border: 1px solid #ffcc80; border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer; }
    .resolved-summary { padding: 12px 16px; font-size: 12px; color: #9e9e9e; text-align: center; border-top: 1px solid #f0f0f0; margin-top: auto; }

    /* Preview modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 200; }
    .preview-modal { background: #f5f5f5; border-radius: 12px; width: 90vw; max-width: 900px; height: 88vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,.3); overflow: hidden; }
    .preview-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: #fff; border-bottom: 1px solid #e0e0e0; }
    .preview-label { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #757575; }
    .preview-close { background: none; border: none; font-size: 18px; color: #757575; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
    .preview-close:hover { background: #f0f0f0; }
    .preview-scroll { flex: 1; overflow-y: auto; padding: 32px; display: flex; justify-content: center; }
    .a4-page { width: 210mm; min-height: 297mm; background: #fff; padding: 20mm; box-shadow: 0 2px 12px rgba(0,0,0,.15); font-size: 12pt; line-height: 1.8; }
  `]
})
export class EditorComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private documentService = inject(DocumentService);
  private commentService = inject(CommentService);
  private notificationService = inject(NotificationService);
  private sanitizer = inject(DomSanitizer);
  private destroy$ = new Subject<void>();
  private change$ = new Subject<void>();

  quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ align: [] }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ]
  };

  quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'align', 'indent',
    'list', 'bullet', 'check',
    'blockquote', 'code-block',
    'link'
  ];

  doc: Documento | null = null;
  titulo = '';
  editorData = '';
  comentarios: Comentario[] = [];
  resolvedIds = new Set<string>();
  comentarioAtivo: Comentario | null = null;
  showPreview = false;
  saving = false;
  saved = false;
  private docNotifications: Notification[] = [];

  get pendentes(): number {
    return this.comentarios.filter(c => !this.resolvedIds.has(c.id)).length;
  }

  get previewHtml(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.editorData);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.documentService.get(id).subscribe(doc => {
        this.doc = doc;
        this.titulo = doc.titulo;
        this.editorData = (doc.conteudo_json as any)?.html ?? '';
      });
      this.commentService.listComments(id).subscribe(cs => { this.comentarios = cs; });
      this.notificationService.getNotifications().subscribe(r => {
        this.docNotifications = r.notifications.filter(n => n.documento_id === id && !n.lida);
      });
    }
    this.change$.pipe(debounceTime(2000), takeUntil(this.destroy$)).subscribe(() => this.save());
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onContentChanged(event: any): void {
    this.editorData = event.html ?? '';
    this.saved = false;
    this.change$.next();
  }

  autoSave(): void { this.save(); }

  save(): void {
    if (!this.doc) return;
    this.saving = true;
    this.documentService.update(this.doc.id, { titulo: this.titulo, conteudo_json: { html: this.editorData } }).subscribe({
      next: d => { this.doc = d; this.saving = false; this.saved = true; setTimeout(() => this.saved = false, 3000); },
      error: () => this.saving = false
    });
  }

  sendToReview(): void {
    if (!this.doc) return;
    this.documentService.update(this.doc.id, { status: 'revisao' }).subscribe({ next: d => this.doc = d });
  }

  focarComentario(c: Comentario): void {
    this.comentarioAtivo = this.comentarioAtivo?.id === c.id ? null : c;
  }

  marcarResolvido(c: Comentario): void {
    this.resolvedIds = new Set([...this.resolvedIds, c.id]);
    this.comentarioAtivo = null;
    const todosResolvidos = this.comentarios.every(cm => this.resolvedIds.has(cm.id));
    if (todosResolvidos && this.docNotifications.length > 0) {
      this.docNotifications.forEach(n => this.notificationService.markAsRead(n.id).subscribe(() => n.lida = true));
      this.docNotifications = [];
    }
  }

  desmarcarResolvido(c: Comentario): void {
    const s = new Set(this.resolvedIds);
    s.delete(c.id);
    this.resolvedIds = s;
  }

  getTrecho(c: Comentario): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = this.editorData;
    const texto = tmp.textContent ?? '';
    const trecho = texto.slice(c.offset_inicio, c.offset_fim);
    return trecho.length > 50 ? trecho.slice(0, 50) + '...' : trecho || `posição ${c.offset_inicio}`;
  }

  togglePreview(): void { this.showPreview = !this.showPreview; }
  goBack(): void { this.router.navigate(['/editor']); }
  statusLabel(s: string): string {
    return ({ rascunho: 'Rascunho', revisao: 'Em Revisão', finalizado: 'Finalizado' } as any)[s] ?? s;
  }
}
