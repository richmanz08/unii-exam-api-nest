import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { TransactionType } from './enums/transaction-type.enum';
import { Order as OrderInterface } from './interfaces/order.interface';
import { OrderItem as OrderItemInterface } from './interfaces/order.interface';
import { get, isArray } from 'lodash';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private readonly httpService: HttpService,
  ) {}

  async syncOrdersFromAPI(): Promise<{ message: string }> {
    try {
      const response$ = this.httpService.get(
        'https://apirecycle.unii.co.th/Stock/query-transaction-demo',
      );
      const response = await lastValueFrom(response$);

      const order: OrderInterface = get(response, 'data', null);

      if (!order) {
        throw new Error('Invalid API response structure');
      }

      await this.transactionModel.deleteMany({});

      let buyCount = 0;
      let sellCount = 0;

      if (isArray(get(order, 'buyTransaction', null))) {
        const buyTransactions = await this.processTransactions(
          order.buyTransaction,
          TransactionType.BUY,
        );
        buyCount = buyTransactions.length;
      }

      if (isArray(get(order, 'sellTransaction', null))) {
        const sellTransactions = await this.processTransactions(
          order.sellTransaction,
          TransactionType.SELL,
        );
        sellCount = sellTransactions.length;
      }

      return {
        message: `Sync completed successfully. Buy transactions: ${buyCount}, Sell transactions: ${sellCount}`,
      };
    } catch (error) {
      throw new Error(`Failed to sync orders from API: ${error.message}`);
    }
  }

  private async processTransactions(
    transactions: OrderItemInterface[],
    transactionType: TransactionType,
  ): Promise<TransactionDocument[]> {
    return Promise.all(
      transactions.map((i) =>
        this.transactionModel.create({
          transactionType,
          orderId: i.orderId,
          customerName: i.transactionParties?.customer?.name || '',
          customerId: i.transactionParties?.customer?.id || '',
          transportName: i.transactionParties?.transport?.name || '',
          transportId: i.transactionParties?.transport?.id || '',
          collectorName: i.transactionParties?.collector?.name || '',
          collectorId: i.transactionParties?.collector?.id || '',
          finishedDate: i.orderFinishedDate
            ? new Date(i.orderFinishedDate)
            : null,
          finishedTime: i.orderFinishedTime || '',
          orderItems: this.buildOrderItems(i.requestList),
        }),
      ),
    );
  }

  private buildOrderItems(requestList: any[]): any[] {
    return (requestList || []).map((request) => ({
      categoryId: request.categoryID,
      subCategoryId: request.subCategoryID,
      details: (request.requestList || []).map((detail) => ({
        grade: detail.grade,
        price: detail.price || 0,
        quantity: detail.quantity,
        total: detail.total || 0,
      })),
    }));
  }

  async getDistinctGrades(): Promise<string[]> {
    const results = await this.transactionModel.aggregate([
      { $unwind: '$orderItems' },
      { $unwind: '$orderItems.details' },
      {
        $group: {
          _id: '$orderItems.details.grade',
        },
      },
      {
        $match: { _id: { $ne: null } },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: { _id: 1 },
      },
    ]);

    return results.map((r) => r._id);
  }
}
