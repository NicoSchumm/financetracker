import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from './transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  findAll(): Promise<Transaction[]> {
    return this.transactionsRepository.find();
  }

  async create(transaction: any): Promise<Transaction> {
    console.log('=== TRANSACTION CREATE DEBUG ===');
    console.log('Received data:', JSON.stringify(transaction, null, 2));
    console.log('isRecurring:', transaction.isRecurring);
    console.log('recurringInterval:', transaction.recurringInterval);
    
    const newTransaction = this.transactionsRepository.create({
      description: transaction.description,
      amount: transaction.amount,
      date: transaction.date,
      type: transaction.type,
      categoryId: transaction.categoryId || '',
      isRecurring: transaction.isRecurring || false,
      recurringInterval: transaction.recurringInterval || null,
      parentTransactionId: transaction.parentTransactionId || null
    });
    
    console.log('Created entity:', JSON.stringify(newTransaction, null, 2));
    const savedTransaction = await this.transactionsRepository.save(newTransaction);
    
    // SOFORT alle wiederkehrenden Transaktionen für 2 Jahre generieren
    if (transaction.isRecurring && transaction.recurringInterval) {
      console.log('Generiere wiederkehrende Transaktionen für 2 Jahre...');
      await this.generateRecurringTransactionsFor2Years(savedTransaction);
    }
    
    return savedTransaction;
  }

  async remove(id: number): Promise<void> {
    await this.transactionsRepository.delete(id);
  }

  async createRecurringTransactions(): Promise<number> {
    console.log('=== DEBUGGING RECURRING TRANSACTIONS ===');
    
    const allTransactions = await this.transactionsRepository.find();
    console.log(`Alle Transaktionen in DB: ${allTransactions.length}`);
    
    if (allTransactions.length > 0) {
      console.log('Erste Transaktion:', JSON.stringify(allTransactions[0], null, 2));
    }
    
    const recurringTransactions = await this.transactionsRepository.find({
      where: { isRecurring: true }
    });

    console.log(`Wiederkehrende Transaktionen gefunden: ${recurringTransactions.length}`);
    
    if (recurringTransactions.length > 0) {
      console.log('Wiederkehrende Transaktionen:', JSON.stringify(recurringTransactions, null, 2));
    }

    const now = new Date();
    let generatedCount = 0;
    
    for (const transaction of recurringTransactions) {
      console.log(`Prüfe: ${transaction.description}, isRecurring: ${transaction.isRecurring}, Intervall: ${transaction.recurringInterval}`);
      const shouldGenerate = await this.shouldGenerateNext(transaction, now);
      console.log(`Soll generiert werden: ${shouldGenerate}`);
      
      if (shouldGenerate) {
        const nextDate = this.calculateNextDate(transaction, now);
        console.log(`Generiere für Datum: ${nextDate}`);
        await this.createNextRecurringTransaction(transaction, nextDate);
        generatedCount++;
      }
    }

    console.log(`=== ENDE DEBUG - Generiert: ${generatedCount} ===`);
    return generatedCount;
  }

  private async shouldGenerateNext(originalTransaction: any, currentDate: Date): Promise<boolean> {
    const transactionDate = new Date(originalTransaction.date);
    
    switch (originalTransaction.recurringInterval) {
      case 'daily':
        const nextDay = new Date(transactionDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        if (currentDate >= nextDay) {
          const todayStart = new Date(currentDate);
          todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date(currentDate);
          todayEnd.setHours(23, 59, 59, 999);
          
          const dailyExists = await this.transactionsRepository.findOne({
            where: {
              description: originalTransaction.description,
              amount: originalTransaction.amount,
              type: originalTransaction.type,
              categoryId: originalTransaction.categoryId,
              date: Between(todayStart, todayEnd)
            }
          });
          
          return !dailyExists;
        }
        return false;

      case 'weekly':
        const nextWeek = new Date(transactionDate);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        if (currentDate >= nextWeek) {
          const weekStart = new Date(currentDate);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(currentDate);
          weekEnd.setHours(23, 59, 59, 999);
          
          const weeklyExists = await this.transactionsRepository.findOne({
            where: {
              description: originalTransaction.description,
              amount: originalTransaction.amount,
              type: originalTransaction.type,
              categoryId: originalTransaction.categoryId,
              date: Between(weekStart, weekEnd)
            }
          });
          
          return !weeklyExists;
        }
        return false;

      case 'monthly':
        const nextMonth = new Date(transactionDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        console.log(`Original: ${transactionDate}, Next due: ${nextMonth}, Current: ${currentDate}`);
        
        // FÜR TESTING: Wenn die Transaktion von heute ist, generiere sofort eine für nächsten Monat
        const isToday = transactionDate.toDateString() === currentDate.toDateString();
        const shouldGenerate = currentDate >= nextMonth || isToday;
        
        console.log(`Should generate: ${shouldGenerate} (isToday: ${isToday})`);
        
        if (shouldGenerate) {
          const targetDate = isToday ? nextMonth : currentDate;
          const targetYear = targetDate.getFullYear();
          const targetMonth = targetDate.getMonth();
          const monthStart = new Date(targetYear, targetMonth, 1);
          const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
          
          const monthlyExists = await this.transactionsRepository.findOne({
            where: {
              description: originalTransaction.description,
              amount: originalTransaction.amount,
              type: originalTransaction.type,
              categoryId: originalTransaction.categoryId,
              date: Between(monthStart, monthEnd)
            }
          });
          
          console.log(`Checking for existing in ${monthStart} to ${monthEnd}: ${!!monthlyExists}`);
          return !monthlyExists;
        }
        return false;

      case 'yearly':
        const nextYear = new Date(transactionDate);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        
        if (currentDate >= nextYear) {
          const targetYear = currentDate.getFullYear();
          const yearStart = new Date(targetYear, 0, 1);
          const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59, 999);
          
          const yearlyExists = await this.transactionsRepository.findOne({
            where: {
              description: originalTransaction.description,
              amount: originalTransaction.amount,
              type: originalTransaction.type,
              categoryId: originalTransaction.categoryId,
              date: Between(yearStart, yearEnd)
            }
          });
          
          return !yearlyExists;
        }
        return false;

      default:
        return false;
    }
  }

  private calculateNextDate(transaction: any, currentDate: Date): Date {
    const originalDate = new Date(transaction.date);
    const isToday = originalDate.toDateString() === currentDate.toDateString();
    
    switch (transaction.recurringInterval) {
      case 'daily':
        return new Date(currentDate);
        
      case 'weekly':
        return new Date(currentDate);
        
      case 'monthly':
        if (isToday) {
          // Für heute erstellte Transaktionen: nächster Monat
          const nextMonth = new Date(originalDate);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          return nextMonth;
        } else {
          // Für ältere Transaktionen: aktueller Monat
          const nextDate = new Date(currentDate);
          const originalDay = originalDate.getDate();
          const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
          nextDate.setDate(Math.min(originalDay, daysInMonth));
          return nextDate;
        }
        
      case 'yearly':
        const yearlyDate = new Date(currentDate);
        yearlyDate.setMonth(originalDate.getMonth());
        yearlyDate.setDate(originalDate.getDate());
        return yearlyDate;
        
      default:
        return new Date(currentDate);
    }
  }

  private async createNextRecurringTransaction(originalTransaction: any, nextDate: Date): Promise<void> {
    const newTransaction = this.transactionsRepository.create({
      description: originalTransaction.description,
      amount: originalTransaction.amount,
      date: nextDate,
      type: originalTransaction.type,
      categoryId: originalTransaction.categoryId,
      isRecurring: false,
      parentTransactionId: originalTransaction.id
    });
    
    await this.transactionsRepository.save(newTransaction);
  }

  private async generateRecurringTransactionsFor2Years(originalTransaction: any): Promise<void> {
    const startDate = new Date(originalTransaction.date);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 2);
    
    let currentDate = new Date(startDate);
    let generatedCount = 0;
    
    console.log(`Generiere von ${startDate} bis ${endDate} für Intervall: ${originalTransaction.recurringInterval}`);
    
    // ERST: Restliche Termine im gleichen Monat wie Anlegedatum generieren
    if (originalTransaction.recurringInterval === 'daily') {
      const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      let dailyDate = new Date(startDate);
      
      while (dailyDate < monthEnd) {
        dailyDate.setDate(dailyDate.getDate() + 1);
        if (dailyDate <= monthEnd) {
          const newTransaction = this.transactionsRepository.create({
            description: originalTransaction.description,
            amount: originalTransaction.amount,
            date: new Date(dailyDate),
            type: originalTransaction.type,
            categoryId: originalTransaction.categoryId,
            isRecurring: false,
            parentTransactionId: originalTransaction.id
          });
          
          await this.transactionsRepository.save(newTransaction);
          generatedCount++;
          console.log(`Generiert (gleicher Monat): ${dailyDate.toDateString()}`);
        }
      }
      currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate());
    }
    
    if (originalTransaction.recurringInterval === 'weekly') {
      const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      let weeklyDate = new Date(startDate);
      
      while (weeklyDate < monthEnd) {
        weeklyDate.setDate(weeklyDate.getDate() + 7);
        if (weeklyDate <= monthEnd) {
          const newTransaction = this.transactionsRepository.create({
            description: originalTransaction.description,
            amount: originalTransaction.amount,
            date: new Date(weeklyDate),
            type: originalTransaction.type,
            categoryId: originalTransaction.categoryId,
            isRecurring: false,
            parentTransactionId: originalTransaction.id
          });
          
          await this.transactionsRepository.save(newTransaction);
          generatedCount++;
          console.log(`Generiert (gleicher Monat): ${weeklyDate.toDateString()}`);
        }
      }
      currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate());
    }
    
    if (originalTransaction.recurringInterval === 'monthly') {
      // Für monatlich: Starte ab dem NÄCHSTEN Monat
      currentDate = new Date(startDate);
      currentDate.setMonth(currentDate.getMonth() + 1);
      
      // Aber generiere den ersten nächsten Monat sofort
      const originalDay = startDate.getDate();
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      currentDate.setDate(Math.min(originalDay, daysInMonth));
      
      const newTransaction = this.transactionsRepository.create({
        description: originalTransaction.description,
        amount: originalTransaction.amount,
        date: new Date(currentDate),
        type: originalTransaction.type,
        categoryId: originalTransaction.categoryId,
        isRecurring: false,
        parentTransactionId: originalTransaction.id
      });
      
      await this.transactionsRepository.save(newTransaction);
      generatedCount++;
      console.log(`Generiert (nächster Monat): ${currentDate.toDateString()}`);
      
      // Jetzt zum übernächsten Monat für die Schleife
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    if (originalTransaction.recurringInterval === 'yearly') {
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    }
    
    // DANN: Restliche 2 Jahre generieren
    while (currentDate <= endDate) {
      let nextDate: Date;
      
      switch (originalTransaction.recurringInterval) {
        case 'daily':
          nextDate = new Date(currentDate);
          // Alle Tage des aktuellen Monats generieren
          const monthEndDaily = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          while (currentDate <= monthEndDaily && currentDate <= endDate) {
            const newTransaction = this.transactionsRepository.create({
              description: originalTransaction.description,
              amount: originalTransaction.amount,
              date: new Date(currentDate),
              type: originalTransaction.type,
              categoryId: originalTransaction.categoryId,
              isRecurring: false,
              parentTransactionId: originalTransaction.id
            });
            
            await this.transactionsRepository.save(newTransaction);
            generatedCount++;
            console.log(`Generiert: ${currentDate.toDateString()}`);
            currentDate.setDate(currentDate.getDate() + 1);
          }
          // Zum nächsten Monat springen
          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, startDate.getDate());
          continue;
          
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          nextDate = new Date(currentDate);
          break;
          
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          const originalDay = startDate.getDate();
          const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
          currentDate.setDate(Math.min(originalDay, daysInMonth));
          nextDate = new Date(currentDate);
          break;
          
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          nextDate = new Date(currentDate);
          break;
          
        default:
          return;
      }
      
      if (nextDate <= endDate && originalTransaction.recurringInterval !== 'daily') {
        const newTransaction = this.transactionsRepository.create({
          description: originalTransaction.description,
          amount: originalTransaction.amount,
          date: nextDate,
          type: originalTransaction.type,
          categoryId: originalTransaction.categoryId,
          isRecurring: false,
          parentTransactionId: originalTransaction.id
        });
        
        await this.transactionsRepository.save(newTransaction);
        generatedCount++;
        console.log(`Generiert: ${nextDate.toDateString()}`);
      }
    }
    
    console.log(`Insgesamt ${generatedCount} wiederkehrende Transaktionen generiert!`);
  }
}