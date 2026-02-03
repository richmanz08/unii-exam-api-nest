import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { Transaction } from './entities/order-transaction.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemDetail } from './entities/order-item-detail.entity';
import { TransactionType } from './enums/transaction-type.enum';
import { Order as OrderInterface } from './interfaces/order.interface';
import { OrderItem as OrderItemInterface } from './interfaces/order.interface';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderItemDetail)
    private orderItemDetailRepository: Repository<OrderItemDetail>,
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

      await this.transactionRepository.createQueryBuilder().delete().execute();

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
  ): Promise<Transaction[]> {
    const transactionsList: Transaction[] = [];

    for (const transaction of transactions) {
      const newTransaction = this.transactionRepository.create({
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
      });

      const savedTransaction = await this.transactionRepository.save(
        newTransaction,
      );

      if (transaction.requestList && Array.isArray(transaction.requestList)) {
        const orderItems: OrderItem[] = [];
        for (const request of transaction.requestList) {
          const orderItem = this.orderItemRepository.create({
            transactionId: savedTransaction.id,
            categoryId: request.categoryID,
            subCategoryId: request.subCategoryID,
          });

          const savedOrderItem = await this.orderItemRepository.save(orderItem);

          if (request.requestList && Array.isArray(request.requestList)) {
            const details: OrderItemDetail[] = [];
            for (const detail of request.requestList) {
              const orderItemDetail = this.orderItemDetailRepository.create({
                orderItemId: savedOrderItem.id,
                grade: detail.grade,
                price: detail.price || 0,
                quantity: detail.quantity,
                total: detail.total || 0,
              });

              const savedDetail = await this.orderItemDetailRepository.save(
                orderItemDetail,
              );
              details.push(savedDetail);
            }
            savedOrderItem.details = details;
          }

          orderItems.push(savedOrderItem);
        }
        savedTransaction.orderItems = orderItems;
      }

      transactionsList.push(savedTransaction);
    }

    return transactionsList;
  }

  async getDistinctGrades(): Promise<string[]> {
    const details = await this.orderItemDetailRepository.find();
    const grades = new Set<string>();

    for (const detail of details) {
      if (detail.grade) {
        grades.add(detail.grade);
      }
    }

    return Array.from(grades).sort();
  }
}
