import { Component, OnInit, OnDestroy, LOCALE_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { TransactionFormComponent } from '../transaction-form/transaction-form'; 
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Transaction } from '../../models/transaction.interface';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TransactionFormComponent, NgxChartsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  providers: [
    { provide: LOCALE_ID, useValue: 'de' } // ← Deutsche Locale für diesen Component
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  chartData: any[] = [];
  transactions: Transaction[] = [];
  view: [number, number] = [350, 300];
  isLoading = false;
  
  isMobile = false;
  isTablet = false;
  showTransactionForm = false;
  showChart = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.setupBreakpointObserver();
    this.loadTransactions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupBreakpointObserver(): void {
    // Mobile detection
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
        this.adjustChartSize();
      });

    this.breakpointObserver
      .observe([Breakpoints.Tablet])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isTablet = result.matches;
        this.adjustChartSize();
      });
  }

  private adjustChartSize(): void {
    if (this.isMobile) {
      this.view = [320, 250];
    } else if (this.isTablet) {
      this.view = [500, 350];
    } else {
      this.view = [700, 400];
    }
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.apiService.getTransactions().subscribe({
      next: (data) => {
        this.transactions = data.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.updateChart();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Fehler beim Laden der Transaktionen:', error);
        this.isLoading = false;
      }
    });
  }

  updateChart(): void {
    const totalIncome = this.transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const totalExpense = this.transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const balance = totalIncome - totalExpense;
    
    this.chartData = [
      { name: 'Einnahmen', value: totalIncome },
      { name: 'Ausgaben', value: totalExpense },
      { name: 'Saldo', value: balance },
    ];
  }

  onTransactionAdded(): void {
    this.loadTransactions();
    if (this.isMobile) {
      this.showTransactionForm = false;
    }
  }

  trackByTransactionId(index: number, transaction: Transaction): number {
    return transaction.id || index;
  }

  deleteTransaction(id: number): void {
    const message = this.isMobile ? 
      'Transaktion wirklich löschen?' : 
      'Möchtest du diese Transaktion wirklich löschen?';
      
    if (confirm(message)) {
      this.apiService.deleteTransaction(id).subscribe({
        next: () => {
          this.loadTransactions();
        },
        error: (error) => {
          console.error('Fehler beim Löschen:', error);
          const errorMsg = this.isMobile ? 
            'Fehler beim Löschen!' : 
            'Fehler beim Löschen der Transaktion';
          alert(errorMsg);
        }
      });
    }
  }

  toggleTransactionForm(): void {
    this.showTransactionForm = !this.showTransactionForm;
  }

  toggleChart(): void {
    this.showChart = !this.showChart;
  }

  getTotalIncome(): number {
    return this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getTotalExpense(): number {
    return this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getBalance(): number {
    return this.getTotalIncome() - this.getTotalExpense();
  }

  getTransactionIcon(type: string): string {
    return type === 'income' ? '💰' : '💸';
  }
}