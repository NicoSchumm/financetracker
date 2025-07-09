import { Component, OnInit, OnDestroy, LOCALE_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { ChartService, MonthlyData } from '../../services/chart.service';
import { TransactionFormComponent } from '../transaction-form/transaction-form'; 
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DEFAULT_CATEGORIES, Category, Transaction } from '../../models/transaction.interface';
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
  
  selectedMonth = '';
  availableMonths: { key: string, label: string }[] = [];
  currentMonthlyData: MonthlyData | null = null;
  
  isMobile = false;
  isTablet = false;
  showTransactionForm = false;
  showChart = false;
  
  private destroy$ = new Subject<void>();
  private categories: Category[] = DEFAULT_CATEGORIES;

  colorScheme: any = {
    domain: [
      '#10b981',
      '#ef4444' 
    ]
  };


  chartGradients = true;
  chartAnimations = true;


  private categoryInfoCache = new Map<string, { icon: string; label: string; color: string }>();

  constructor(
    private apiService: ApiService,
    private chartService: ChartService,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadTransactions();
    this.generateRecurringTransactions(); 
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
    });
  }

  private checkScreenSize(): void {
    this.setupBreakpointObserver();
    
    // Initiale Größe setzen
    this.isMobile = this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small]);
    this.isTablet = this.breakpointObserver.isMatched(Breakpoints.Medium);
    
    // Chart-Größe basierend auf Bildschirmgröße anpassen
    if (this.isMobile) {
      this.view = [300, 200];
    } else if (this.isTablet) {
      this.view = [400, 250];
    } else {
      this.view = [500, 300];
    }
  }

  private loadTransactions(): void {
    this.isLoading = true;
    this.categoryInfoCache.clear();
    
    this.apiService.getTransactions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transactions) => {
          this.transactions = transactions;
          this.updateAvailableMonths();
          this.setDefaultSelectedMonth();
          this.updateChartForMonth();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Fehler beim Laden der Transaktionen:', error);
          this.isLoading = false;
        }
      });
  }

  private updateAvailableMonths(): void {
    const monthsSet = new Set<string>();
    
    this.transactions.forEach((transaction: Transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsSet.add(monthKey);
    });

    this.availableMonths = Array.from(monthsSet)
      .sort()
      .reverse()
      .map(key => {
        const [year, month] = key.split('-');
        const monthNames = [
          'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
          'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
        ];
        return {
          key,
          label: `${monthNames[parseInt(month) - 1]} ${year}`
        };
      });
  }

  private setDefaultSelectedMonth(): void {
    if (this.availableMonths.length > 0) {
      this.selectedMonth = this.availableMonths[0].key;
    }
  }

  private updateChartForMonth(): void {
    try {
      this.currentMonthlyData = this.chartService.getMonthlyData(this.transactions, this.selectedMonth);
      const newChartData = this.chartService.getChartData(this.currentMonthlyData);
      
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

  onChartSelect(event: any): void {
    console.log('Chart selected:', event);
  }

  onMonthChange(): void {
    this.updateChartForMonth();
  }

  get selectedMonthLabel(): string {
    if (!this.selectedMonth || !this.availableMonths) {
      return 'diesen Monat';
    }
    
    const monthData = this.availableMonths.find((m: any) => m.key === this.selectedMonth);
    return monthData ? monthData.label : 'diesen Monat';
  }

  get totalIncome(): number {
    return this.transactions
      .filter((t: Transaction) => t.type === 'income')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  }

  get totalExpense(): number {
    return this.transactions
      .filter((t: Transaction) => t.type === 'expense')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  }

  get totalBalance(): number {
    return this.totalIncome - this.totalExpense;
  }

  get currentMonthTransactions(): Transaction[] {
    if (!this.selectedMonth) return [];
    
    const [year, month] = this.selectedMonth.split('-').map(Number);
    
    return this.transactions.filter((transaction: Transaction) => {
      const date = new Date(transaction.date);
      return date.getFullYear() === year && date.getMonth() === month - 1;
    });
  }

  trackByTransactionId(index: number, transaction: Transaction): number {
    return transaction.id || index;
  }

  getCategoryInfo(categoryKey: string): { icon: string; label: string; color: string } {
    const cacheKey = categoryKey || 'empty';
    
    if (this.categoryInfoCache.has(cacheKey)) {
      return this.categoryInfoCache.get(cacheKey)!;
    }
    
    let result: { icon: string; label: string; color: string };
    
    if (!categoryKey || categoryKey.trim() === '') {
      result = { icon: '❓', label: 'Unbekannt', color: '#64748b' };
    } else {
      const category = this.categories.find((cat: Category) => cat.id == categoryKey);
      
      if (category) {
        result = { 
          icon: category.icon, 
          label: category.name, 
          color: category.type === 'income' ? '#059669' : '#dc2626' 
        };
      } else {
        result = { 
          icon: '❓', 
          label: 'Unbekannt', 
          color: '#64748b' 
        };
      }
    }
    
    this.categoryInfoCache.set(cacheKey, result);
    return result;
  }

  getCategoryIcon(categoryKey: string): string {
    if (!categoryKey) {
      return '❓'; 
    }
    
    const category = this.categories.find(cat => cat.id == categoryKey);
    
    return category ? category.icon : '❓';
  }

  getCategoryName(categoryKey: string): string {
    if (!categoryKey) {
      return 'Keine Kategorie';
    }
    
    const category = this.categories.find(cat => cat.id == categoryKey);
    return category ? category.name : 'Unbekannte Kategorie';
  }

  deleteTransaction(transactionId: number): void {
    if (!transactionId) return;
    
    this.apiService.deleteTransaction(transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.transactions = this.transactions.filter(t => t.id !== transactionId);
          this.updateChartForMonth();
          this.categoryInfoCache.clear();
        },
        error: (error) => {
          console.error('Fehler beim Löschen der Transaktion:', error);
        }
      });
  }

  onTransactionAdded(): void {
    this.loadTransactions();
    this.showTransactionForm = false;
  }

  toggleTransactionForm(): void {
    this.showTransactionForm = !this.showTransactionForm;
  }

  private generateRecurringTransactions(): void {
    this.apiService.generateRecurringTransactions().subscribe({
      next: () => {
        console.log('Wiederkehrende Transaktionen generiert');
        this.loadTransactions();
      },
      error: (error) => {
        console.error('Fehler beim Generieren wiederkehrender Transaktionen:', error);
      }
    });
  }
}