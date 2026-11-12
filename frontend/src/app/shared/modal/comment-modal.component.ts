import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-comment-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="modal-overlay" *ngIf="visible">
      <div class="modal">
        <h3>Adicionar Comentário</h3>

        <div class="error-message" *ngIf="documentoStatus !== 'revisao'">
          Documento não está em revisão
        </div>

        <ng-container *ngIf="documentoStatus === 'revisao'">
          <textarea
            [(ngModel)]="textoComentario"
            placeholder="Digite seu comentário..."
            rows="4"
          ></textarea>
          <div class="modal-actions">
            <button class="btn-primary" (click)="salvar()">Salvar</button>
            <button class="btn-secondary" (click)="cancelar()">Cancelar</button>
          </div>
        </ng-container>

        <div class="modal-actions" *ngIf="documentoStatus !== 'revisao'">
          <button class="btn-secondary" (click)="cancelar()">Cancelar</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: #fff; padding: 24px; border-radius: 8px;
      min-width: 360px; display: flex; flex-direction: column; gap: 12px;
    }
    .modal h3 { margin: 0; font-size: 16px; }
    .modal textarea { width: 100%; padding: 8px; font-size: 14px; box-sizing: border-box; }
    .modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .btn-primary { background: #1976d2; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .btn-secondary { background: #757575; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    .error-message { color: #c62828; background: #ffebee; padding: 10px 12px; border-radius: 4px; font-size: 14px; }
  `]
})
export class CommentModalComponent {
    @Input() visible: boolean = false;
    @Input() documentoStatus: string = '';
    @Output() comentarioSubmit = new EventEmitter<string>();
    @Output() fechar = new EventEmitter<void>();

    textoComentario = '';

    salvar(): void {
        if (!this.textoComentario.trim()) return;
        this.comentarioSubmit.emit(this.textoComentario.trim());
        this.textoComentario = '';
    }

    cancelar(): void {
        this.textoComentario = '';
        this.fechar.emit();
    }
}
