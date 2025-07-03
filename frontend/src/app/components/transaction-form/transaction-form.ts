import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Transaction } from '../../models/transaction.interface';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-form.html',
  styleUrls: ['./transaction-form.scss'],
})
export class TransactionFormComponent implements OnInit {
  @Output() transactionAdded = new EventEmitter<void>();
  transactionForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder, 
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.transactionForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(3)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      type: ['expense', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  onSubmit(): void {
    if (this.transactionForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formValue = this.transactionForm.value;
      const transaction: Omit<Transaction, 'id'> = {
        description: formValue.description,
        amount: parseFloat(formValue.amount),
        type: formValue.type,
        date: new Date(formValue.date)
      };

      this.apiService.addTransaction(transaction).subscribe({
        next: () => {
          this.transactionForm.reset();
          this.initForm();
          this.transactionAdded.emit();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Fehler beim Speichern:', error);
          this.isSubmitting = false;
        }
      });
    }
  }

  get description() { return this.transactionForm.get('description'); }
  get amount() { return this.transactionForm.get('amount'); }
  get type() { return this.transactionForm.get('type'); }
  get date() { return this.transactionForm.get('date'); }
}