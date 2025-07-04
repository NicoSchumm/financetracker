import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-form.html',
  styleUrls: ['./transaction-form.scss']
})
export class TransactionFormComponent {
  @Output() transactionAdded = new EventEmitter<void>();

  transaction = {
    description: '',
    amount: 0,
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0]
  };

  isSubmitting = false;

  constructor(private apiService: ApiService) {}

  onSubmit(): void {
    if (this.isValidTransaction()) {
      this.isSubmitting = true;
      
      // Date string zu Date object konvertieren
      const transactionData = {
        ...this.transaction,
        date: new Date(this.transaction.date)
      };
      
      this.apiService.addTransaction(transactionData).subscribe({
        next: () => {
          this.transactionAdded.emit();
          this.resetForm();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Fehler beim Hinzufügen:', error);
          alert('Fehler beim Hinzufügen der Transaktion');
          this.isSubmitting = false;
        }
      });
    }
  }

  private isValidTransaction(): boolean {
    return this.transaction.description.trim() !== '' && 
           this.transaction.amount > 0;
  }

  private resetForm(): void {
    this.transaction = {
      description: '',
      amount: 0,
      type: 'expense',
      date: new Date().toISOString().split('T')[0]
    };
  }
}