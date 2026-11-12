import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DocumentService } from '../../services/document.service';
import { Documento } from '../../models/document.model';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rl-page">
      <div class="rl-header">
        <h1 class="page-title">Revisão de Documentos</h1>
        <p class="page-sub">Documentos aguardando sua revisão</p>
      </div>

      <div class="spinner" *ngIf="loading"></div>

      <div class="card empty-state" *ngIf="!loading && documentosRevisao.length === 0">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <p>Nenhum documento em revisão no momento.</p>
      </div>

      <div class="doc-grid" *ngIf="!loading && documentosRevisao.length > 0">
        <div class="doc-card card" *ngFor="let doc of documentosRevisao">
          <div class="doc-card-top">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e65100" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span class="badge badge-revisao">Em Revisão</span>
          </div>
          <h3 class="doc-title">{{ doc.titulo }}</h3>
          <p class="doc-date">{{ doc.criado_em | date:'dd/MM/yyyy' }}</p>
          <div class="doc-actions">
            <button class="btn btn-primary btn-sm" (click)="revisar(doc.id)">Revisar</button>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && documentosFinalizados.length > 0" class="finalizados-section">
        <h2 class="section-title">Finalizados</h2>
        <div class="doc-grid">
          <div class="doc-card card finalized" *ngFor="let doc of documentosFinalizados">
            <div class="doc-card-top">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="1.5">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <span class="badge badge-finalizado">Finalizado</span>
            </div>
            <h3 class="doc-title">{{ doc.titulo }}</h3>
            <p class="doc-date">{{ doc.criado_em | date:'dd/MM/yyyy' }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rl-page { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
    .rl-header { margin-bottom: 28px; }
    .page-title { font-size: 24px; font-weight: 700; color: #1a1a2e; }
    .page-sub { font-size: 14px; color: #757575; margin-top: 4px; }
    .doc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
    .doc-card { padding: 20px; display: flex; flex-direction: column; gap: 10px; transition: box-shadow .2s, transform .2s; }
    .doc-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.12); transform: translateY(-2px); }
    .doc-card.finalized { opacity: .7; }
    .doc-card-top { display: flex; justify-content: space-between; align-items: center; }
    .doc-title { font-size: 15px; font-weight: 600; color: #1a1a2e; line-height: 1.4; }
    .doc-date { font-size: 12px; color: #9e9e9e; }
    .doc-actions { margin-top: 4px; }
    .finalizados-section { margin-top: 40px; }
    .section-title { font-size: 16px; font-weight: 600; color: #757575; margin-bottom: 16px; }
  `]
})
export class ReviewListComponent implements OnInit {
  private documentService = inject(DocumentService);
  private router = inject(Router);

  documentos: Documento[] = [];
  loading = false;

  get documentosRevisao(): Documento[] {
    return this.documentos.filter(d => d.status === 'revisao');
  }

  get documentosFinalizados(): Documento[] {
    return this.documentos.filter(d => d.status === 'finalizado');
  }

  ngOnInit(): void {
    this.loading = true;
    this.documentService.list().subscribe({
      next: d => { this.documentos = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  revisar(id: string): void {
    this.router.navigate(['/review', id]);
  }
}
