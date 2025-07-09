import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { DEFAULT_CATEGORIES, Category } from '../../models/transaction.interface';

export interface RecurringInterval {
  id: string;
  label: string;
  icon: string;
}

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
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringInterval: ''
  };

  categories = DEFAULT_CATEGORIES;
  isSubmitting = false;

  recurringIntervals: RecurringInterval[] = [
    { id: 'daily', label: 'Täglich', icon: '📅' },
    { id: 'weekly', label: 'Wöchentlich', icon: '📊' },
    { id: 'monthly', label: 'Monatlich', icon: '🗓️' },
    { id: 'yearly', label: 'Jährlich', icon: '📆' }
  ];

  constructor(private apiService: ApiService) {}

  onTypeChange(type: 'income' | 'expense'): void {
    this.transaction.type = type;
    this.transaction.categoryId = '';
  }

  onRecurringToggle(): void {
    if (!this.transaction.isRecurring) {
      this.transaction.recurringInterval = '';
    }
  }

  getAvailableCategories(): Category[] {
    return this.categories.filter(cat => 
      cat.type === this.transaction.type || cat.type === 'both'
    );
  }

  getCategoryIcon(categoryId: string): string {
    const category = this.categories.find(cat => cat.id === categoryId);
    return category?.icon || '📄';
  }

  onSubmit(): void {
    if (this.isValidTransaction()) {
      this.isSubmitting = true;
      
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
    const baseValid = this.transaction.description.trim() !== '' && 
                     this.transaction.amount > 0 &&
                     this.transaction.categoryId !== '';
    
    if (this.transaction.isRecurring) {
      return baseValid && this.transaction.recurringInterval !== '';
    }
    
    return baseValid;
  }

  private resetForm(): void {
    this.transaction = {
      description: '',
      amount: 0,
      type: 'expense',
      categoryId: '',
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurringInterval: ''
    };
  }
}