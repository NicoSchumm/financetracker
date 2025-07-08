export interface Transaction {
  id?: number;
  description: string;
  amount: number;
  date: Date;
  type: 'income' | 'expense';
  category: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense' | 'both';
}

export const DEFAULT_CATEGORIES: Category[] = [
  // Einnahmen
  { id: 'salary', name: 'Gehalt', icon: '💰', type: 'income' },
  { id: 'freelance', name: 'Freelancing', icon: '💻', type: 'income' },
  { id: 'investment', name: 'Investitionen', icon: '📈', type: 'income' },
  { id: 'gift', name: 'Geschenke', icon: '🎁', type: 'income' },
  { id: 'other-income', name: 'Sonstiges', icon: '💵', type: 'income' },
  
  // Ausgaben
  { id: 'food', name: 'Lebensmittel', icon: '🛒', type: 'expense' },
  { id: 'transport', name: 'Transport', icon: '🚗', type: 'expense' },
  { id: 'housing', name: 'Wohnen', icon: '🏠', type: 'expense' },
  { id: 'entertainment', name: 'Unterhaltung', icon: '🎭', type: 'expense' },
  { id: 'healthcare', name: 'Gesundheit', icon: '🏥', type: 'expense' },
  { id: 'education', name: 'Bildung', icon: '📚', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', type: 'expense' },
  { id: 'bills', name: 'Rechnungen', icon: '📄', type: 'expense' },
  { id: 'other-expense', name: 'Sonstiges', icon: '💸', type: 'expense' }
];