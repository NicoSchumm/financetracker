import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

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

  @Get('generate-recurring')
  async generateRecurringTransactionsGet(): Promise<{ message: string; generated: number }> {
    const generated = await this.transactionsService.createRecurringTransactions();
    return { 
      message: 'Wiederkehrende Transaktionen wurden generiert',
      generated 
    };
  }

  @Post('generate-recurring')
  async generateRecurringTransactions(): Promise<{ message: string; generated: number }> {
    const generated = await this.transactionsService.createRecurringTransactions();
    return { 
      message: 'Wiederkehrende Transaktionen wurden generiert',
      generated 
    };
  }
}