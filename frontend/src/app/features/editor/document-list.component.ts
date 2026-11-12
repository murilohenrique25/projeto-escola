import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentService } from '../../services/document.service';
import { Documento } from '../../models/document.model';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="doc-list">
      <!-- Header -->
      <div class="doc-list-header">
        <div>
          <h1 class="page-title">Meus Documentos</h1>
          <p class="page-sub">Crie e gerencie seus documentos acadêmicos</p>
        </div>
        <button class="btn btn-primary" (click)="showNewModal = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Documento
        </button>
      </div>

      <!-- Loading -->
      <div class="spinner" *ngIf="loading"></div>

      <!-- Empty -->
      <div class="card empty-state" *ngIf="!loading && documentos.length === 0">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p>Nenhum documento ainda. Crie o primeiro!</p>
      </div>

      <!-- Grid de cards -->
      <div class="doc-grid" *ngIf="!loading && documentos.length > 0">
        <div class="doc-card card" *ngFor="let doc of documentos">
          <div class="doc-card-top">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span class="badge badge-{{ doc.status }}">{{ statusLabel(doc.status) }}</span>
          </div>
          <h3 class="doc-title">{{ doc.titulo }}</h3>
          <p class="doc-date">{{ doc.criado_em | date:'dd/MM/yyyy' }}</p>
          <div class="doc-actions">
            <button class="btn btn-ghost btn-sm" (click)="edit(doc.id)">Editar</button>
            <button class="btn btn-warning btn-sm" *ngIf="doc.status === 'rascunho'" (click)="sendToReview(doc)">
              Enviar para Revisão
            </button>
            <span class="doc-status-info" *ngIf="doc.status === 'revisao'">Em revisão</span>
            <span class="doc-status-info finalizado" *ngIf="doc.status === 'finalizado'">✓ Finalizado</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal novo documento -->
    <div class="modal-overlay" *ngIf="showNewModal" (click)="showNewModal = false">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <h2 class="modal-title">Novo Documento</h2>
        <label class="field-label">Título</label>
        <input class="field-input" [(ngModel)]="newTitle" placeholder="Ex: Plano de Aula — Matemática" autofocus />
        <div class="modal-actions">
          <button class="btn btn-ghost" (click)="showNewModal = false">Cancelar</button>
          <button class="btn btn-primary" (click)="createDocument()" [disabled]="!newTitle.trim()">Criar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .doc-list { }
    .doc-list-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .page-title { font-size: 24px; font-weight: 700; color: #1a1a2e; }
    .page-sub { font-size: 14px; color: #757575; margin-top: 4px; }

    .doc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
    .doc-card { padding: 20px; display: flex; flex-direction: column; gap: 10px; transition: box-shadow .2s, transform .2s; }
    .doc-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.12); transform: translateY(-2px); }
    .doc-card-top { display: flex; justify-content: space-between; align-items: center; }
    .doc-title { font-size: 15px; font-weight: 600; color: #1a1a2e; line-height: 1.4; flex: 1; }
    .doc-date { font-size: 12px; color: #9e9e9e; }
    .doc-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 4px; }
    .doc-status-info { font-size: 12px; color: #757575; }
    .doc-status-info.finalizado { color: #2e7d32; font-weight: 600; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 200; }
    .modal-box { background: #fff; border-radius: 16px; padding: 32px; width: 420px; box-shadow: 0 8px 32px rgba(0,0,0,.2); }
    .modal-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; }
    .field-label { display: block; font-size: 13px; font-weight: 600; color: #424242; margin-bottom: 6px; }
    .field-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e0e0e0; border-radius: 8px; font-size: 15px; outline: none; transition: border-color .2s; }
    .field-input:focus { border-color: #1565c0; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
  `]
})
export class DocumentListComponent implements OnInit {
  private documentService = inject(DocumentService);
  private router = inject(Router);

  documentos: Documento[] = [];
  loading = false;
  showNewModal = false;
  newTitle = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.documentService.list().subscribe({ next: d => { this.documentos = d; this.loading = false; }, error: () => this.loading = false });
  }

  createDocument(): void {
    if (!this.newTitle.trim()) return;
    this.documentService.create({ titulo: this.newTitle.trim(), conteudo_json: {} }).subscribe({
      next: doc => { this.showNewModal = false; this.newTitle = ''; this.router.navigate(['/editor', doc.id]); }
    });
  }

  edit(id: string): void { this.router.navigate(['/editor', id]); }

  sendToReview(doc: Documento): void {
    this.documentService.update(doc.id, { status: 'revisao' }).subscribe({ next: u => doc.status = u.status });
  }

  statusLabel(s: string): string {
    return { rascunho: 'Rascunho', revisao: 'Em Revisão', finalizado: 'Finalizado' }[s] ?? s;
  }
}
