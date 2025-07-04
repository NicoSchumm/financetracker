import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './components/dashboard/dashboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DashboardComponent],
  template: `
    <div class="app">
      <app-dashboard></app-dashboard>
    </div>
  `,
  styles: [`
    .app {
      min-height: 100vh;
      margin: 0;
      padding: 0;
    }
    
    * {
      box-sizing: border-box;
    }
  `]
})
export class AppComponent {
  title = 'finanztracker';
}