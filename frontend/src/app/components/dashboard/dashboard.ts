import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { TransactionFormComponent } from '../transaction-form/transaction-form'; 
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Transaction } from '../../models/transaction.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TransactionFormComponent, NgxChartsModule], // TransactionListComponent entfernt
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit {
  chartData: any[] = [];
  transactions: Transaction[] = [];
  view: [number, number] = [700, 400];
  isLoading = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTransactions();
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
  }

  onTransactionDeleted(): void {
    this.loadTransactions();
  }

  trackByTransactionId(index: number, transaction: Transaction): number {
    return transaction.id || index;
  }

  // Delete-Funktion hinzufügen
  deleteTransaction(id: number): void {
    if (confirm('Möchtest du diese Transaktion wirklich löschen?')) {
      this.apiService.deleteTransaction(id).subscribe({
        next: () => {
          this.loadTransactions(); // Daten neu laden
        },
        error: (error) => {
          console.error('Fehler beim Löschen:', error);
          alert('Fehler beim Löschen der Transaktion');
        }
      });
    }
  }
}