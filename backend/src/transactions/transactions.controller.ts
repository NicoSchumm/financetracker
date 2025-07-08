import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from './transaction.entity';

@Controller('transactions') 
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get() 
  findAll() {
    return this.transactionsService.findAll();
  }

  @Post() 
  create(@Body() transaction: any) {
    return this.transactionsService.create(transaction);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(+id);
  }
}