export interface Transaction {
  id?: number;
  description: string;
  amount: number;
  date: Date;
  type: 'income' | 'expense';
}