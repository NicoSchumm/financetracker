import { Component, OnInit, OnDestroy, LOCALE_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { ChartService, MonthlyData } from '../../services/chart.service';
import { TransactionFormComponent } from '../transaction-form/transaction-form'; 
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Transaction, DEFAULT_CATEGORIES } from '../../models/transaction.interface';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TransactionFormComponent, NgxChartsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  providers: [
    { provide: LOCALE_ID, useValue: 'de' }
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  chartData: any[] = [];
  transactions: Transaction[] = [];
  view: [number, number] = [350, 300];
  isLoading = false;
  
  // Chart-spezifische Properties
  selectedMonth = '';
  availableMonths: { key: string, label: string }[] = [];
  currentMonthlyData: MonthlyData | null = null;
  
  isMobile = false;
  isTablet = false;
  showTransactionForm = false;
  showChart = false;
  
  private destroy$ = new Subject<void>();
  categories = DEFAULT_CATEGORIES;

  // Chart Konfiguration - Stabilere Konfiguration
  colorScheme: any = {
    domain: ['#10b981', '#ef4444']
  };

  constructor(
    private apiService: ApiService,
    private chartService: ChartService,
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
    this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe(result => {
      this.isMobile = this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small]);
      this.isTablet = this.breakpointObserver.isMatched(Breakpoints.Medium);
      
      if (this.isMobile) {
        this.view = [320, 250];
      } else if (this.isTablet) {
        this.view = [400, 300];
      } else {
        this.view = [500, 350];
      }
    });
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.apiService.getTransactions().subscribe({
      next: (data) => {
        this.transactions = data;
        this.setupMonthlyData();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Fehler beim Laden der Transaktionen:', error);
        this.isLoading = false;
      }
    });
  }

  private setupMonthlyData(): void {
    this.availableMonths = this.chartService.getAvailableMonths(this.transactions);
    
    if (this.availableMonths.length > 0) {
      // Aktueller Monat oder erster verfügbarer Monat
      const currentMonth = this.chartService.getCurrentMonth();
      const monthExists = this.availableMonths.some(m => m.key === currentMonth);
      
      this.selectedMonth = monthExists ? currentMonth : this.availableMonths[0].key;
      this.updateChartForMonth();
    }
  }

  onMonthChange(): void {
    if (!this.selectedMonth) return;
    
    // Chart temporär ausblenden während Update
    const oldChartData = this.chartData;
    this.chartData = [];
    
    // Nach kurzer Verzögerung neue Daten setzen
    setTimeout(() => {
      this.updateChartForMonth();
    }, 100);
  }

  private updateChartForMonth(): void {
    if (!this.selectedMonth) return;
    
    try {
      this.currentMonthlyData = this.chartService.getMonthlyData(this.transactions, this.selectedMonth);
      const newChartData = this.chartService.getChartData(this.currentMonthlyData);
      
      // Validierung der Chart-Daten
      const validChartData = newChartData.filter(item => 
        item.value !== null && 
        item.value !== undefined && 
        !isNaN(item.value) && 
        isFinite(item.value)
      );
      
      this.chartData = validChartData;
      
    } catch (error) {
      console.error('Fehler beim Update der Chart-Daten:', error);
      this.chartData = [];
    }
  }

  // Chart Event Handler
  onChartSelect(event: any): void {
    console.log('Chart selected:', event);
  }

  // Hilfsmethoden für Template
  get totalIncome(): number {
    return this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  get totalExpense(): number {
    return this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  get totalBalance(): number {
    return this.totalIncome - this.totalExpense;
  }

  // Bestehende Methoden
  toggleTransactionForm(): void {
    this.showTransactionForm = !this.showTransactionForm;
  }

  toggleChart(): void {
    this.showChart = !this.showChart;
  }

  onTransactionAdded(): void {
    this.loadTransactions();
    this.showTransactionForm = false;
  }

  deleteTransaction(id: number): void {
    if (confirm('Transaktion wirklich löschen?')) {
      this.apiService.deleteTransaction(id).subscribe({
        next: () => {
          this.loadTransactions();
        },
        error: (error) => {
          console.error('Fehler beim Löschen:', error);
        }
      });
    }
  }

  getCategoryInfo(categoryId: string) {
    return this.categories.find(cat => cat.id === categoryId) || 
           { id: 'unknown', name: 'Unbekannt', icon: '❓', type: 'both' };
  }

  // Filtere Transaktionen für aktuellen Monat
  get currentMonthTransactions(): Transaction[] {
    if (!this.selectedMonth) return [];
    
    const [year, month] = this.selectedMonth.split('-').map(Number);
    
    return this.transactions.filter(transaction => {
      const date = new Date(transaction.date);
      return date.getFullYear() === year && date.getMonth() === month - 1;
    });
  }

  // Fehlende Getter-Methoden hinzufügen
  getBalance(): number {
    return this.totalBalance;
  }

  getTotalIncome(): number {
    return this.totalIncome;
  }

  getTotalExpense(): number {
    return this.totalExpense;
  }

  // Fehlende Icon-Methode
  getTransactionIcon(type: 'income' | 'expense'): string {
    return type === 'income' ? '💰' : '💸';
  }

  // TrackBy Funktion für bessere Performance - Korrigiert
  trackByTransactionId(index: number, transaction: Transaction): number {
    return transaction.id || index;
  }
}