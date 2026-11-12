import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';

@Component({
    selector: 'app-preview',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="a4-page" [innerHTML]="safeHtml"></div>
  `,
    styles: [`
    .a4-page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 0 auto;
      background: white;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class PreviewComponent {
    private sanitizer = inject(DomSanitizer);

    safeHtml: SafeHtml | null = null;

    @Input() set content(value: Record<string, unknown> | null) {
        if (value && typeof value['html'] === 'string') {
            this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(value['html']);
        } else {
            this.safeHtml = null;
        }
    }
}
