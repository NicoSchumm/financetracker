import { Injectable } from '@angular/core';
import { Transaction } from '../models/transaction.interface';

export interface MonthlyData {
  month: string;
  monthKey: string;
  income: number;
  expense: number;
  balance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  getAvailableMonths(transactions: Transaction[]): { key: string, label: string }[] {
    const months = new Set<string>();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });

    return Array.from(months)
      .sort((a, b) => b.localeCompare(a))
      .map(monthKey => ({
        key: monthKey,
        label: this.formatMonthLabel(monthKey)
      }));
  }

  getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  getMonthlyData(transactions: Transaction[], monthKey: string): MonthlyData {
    const [year, month] = monthKey.split('-').map(Number);
    
    const monthTransactions = transactions.filter(transaction => {
      const date = new Date(transaction.date);
      return date.getFullYear() === year && date.getMonth() === month - 1;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: this.formatMonthLabel(monthKey),
      monthKey,
      income: Math.round(income * 100) / 100, // Auf 2 Dezimalstellen runden
      expense: Math.round(expense * 100) / 100,
      balance: Math.round((income - expense) * 100) / 100
    };
  }

  getChartData(monthlyData: MonthlyData): ChartDataPoint[] {
    // Mindestens 0.01 als Wert setzen, wenn 0, um SVG-Fehler zu vermeiden
    const income = monthlyData.income > 0 ? monthlyData.income : 0;
    const expense = monthlyData.expense > 0 ? monthlyData.expense : 0;
    
    const data: ChartDataPoint[] = [];
    
    if (income > 0) {
      data.push({
        name: 'Einnahmen',
        value: income
      });
    }
    
    if (expense > 0) {
      data.push({
        name: 'Ausgaben',
        value: expense
      });
    }
    
    // Fallback wenn beide 0 sind
    if (data.length === 0) {
      data.push({
        name: 'Keine Daten',
        value: 0.01
      });
    }
    
    return data;
  }

  private formatMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
}