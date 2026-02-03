import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { TransactionType } from './enums/transaction-type.enum';
import { Order as OrderInterface } from './interfaces/order.interface';
import { OrderItem as OrderItemInterface } from './interfaces/order.interface';

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

      console.log(
        'API Response:',
        JSON.stringify(response.data, null, 2).substring(0, 500),
      );

      let apiData: OrderInterface = null;
      if (response.data && response.data.buyTransaction) {
        apiData = response.data;
      }

      if (!apiData) {
        throw new Error('Invalid API response structure');
      }

      await this.transactionModel.deleteMany({});

      let buyCount = 0;
      let sellCount = 0;

      if (apiData.buyTransaction && Array.isArray(apiData.buyTransaction)) {
        const buyTransactions = await this.processTransactions(
          apiData.buyTransaction,
          TransactionType.BUY,
        );
        buyCount = buyTransactions.length;
      }

      if (apiData.sellTransaction && Array.isArray(apiData.sellTransaction)) {
        const sellTransactions = await this.processTransactions(
          apiData.sellTransaction,
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
    const transactionsList: TransactionDocument[] = [];

    for (const transaction of transactions) {
      const orderItems = [];

      if (transaction.requestList && Array.isArray(transaction.requestList)) {
        for (const request of transaction.requestList) {
          const details = [];

          if (request.requestList && Array.isArray(request.requestList)) {
            for (const detail of request.requestList) {
              details.push({
                grade: detail.grade,
                price: detail.price || 0,
                quantity: detail.quantity,
                total: detail.total || 0,
              });
            }
          }

          orderItems.push({
            categoryId: request.categoryID,
            subCategoryId: request.subCategoryID,
            details,
          });
        }
      }

      const newTransaction = new this.transactionModel({
        transactionType,
        orderId: transaction.orderId,
        customerName: transaction.transactionParties?.customer?.name || '',
        customerId: transaction.transactionParties?.customer?.id || '',
        transportName: transaction.transactionParties?.transport?.name || '',
        transportId: transaction.transactionParties?.transport?.id || '',
        collectorName: transaction.transactionParties?.collector?.name || '',
        collectorId: transaction.transactionParties?.collector?.id || '',
        finishedDate: transaction.orderFinishedDate
          ? new Date(transaction.orderFinishedDate)
          : null,
        finishedTime: transaction.orderFinishedTime || '',
        orderItems,
      });

      const savedTransaction = await newTransaction.save();
      transactionsList.push(savedTransaction);
    }

    return transactionsList;
  }

  async getDistinctGrades(): Promise<string[]> {
    const transactions = await this.transactionModel.find();
    const grades = new Set<string>();

    for (const transaction of transactions) {
      if (transaction.orderItems && Array.isArray(transaction.orderItems)) {
        for (const item of transaction.orderItems) {
          if (item.details && Array.isArray(item.details)) {
            for (const detail of item.details) {
              if (detail.grade) {
                grades.add(detail.grade);
              }
            }
          }
        }
      }
    }

    return Array.from(grades).sort();
  }
}
