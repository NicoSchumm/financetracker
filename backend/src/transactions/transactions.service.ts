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

  create(transaction: Transaction): Promise<Transaction> {
    return this.transactionsRepository.save(transaction);
  }

  async remove(id: number): Promise<void> {
    await this.transactionsRepository.delete(id);
  }
}