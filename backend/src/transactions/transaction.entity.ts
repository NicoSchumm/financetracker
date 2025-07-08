import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export type TransactionType = 'income' | 'expense';

@Entity() 
export class Transaction {
  @PrimaryGeneratedColumn() 
  id: number;

  @Column() 
  description: string;

  @Column('decimal', { precision: 10, scale: 2 }) 
  amount: number;

  @Column() 
  date: Date;

  @Column() 
  type: TransactionType;

  @Column({ nullable: true, default: '' })
  categoryId: string;
}