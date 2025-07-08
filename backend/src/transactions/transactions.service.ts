import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  create(transaction: any): Promise<Transaction> {
    // Explizites Setzen der categoryId, falls sie existiert
    const newTransaction = this.transactionsRepository.create({
      description: transaction.description,
      amount: transaction.amount,
      date: transaction.date,
      type: transaction.type,
      categoryId: transaction.categoryId || ''
    });
    
    return this.transactionsRepository.save(newTransaction);
  }

  async remove(id: number): Promise<void> {
    await this.transactionsRepository.delete(id);
  }
}