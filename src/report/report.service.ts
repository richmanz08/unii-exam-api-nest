import { Injectable, Logger } from '@nestjs/common';
import { OrderService } from '../order/order.service';
import { CategoryService } from '../category/category.service';
import { StockSummaryFilterDto } from './dto/stock-summary-filter.dto';
import { StockSummary } from './interfaces/stock-summary.interface';
import { FlatOrder } from './interfaces/flat-order.interface';
import { CategoryMapItem } from './interfaces/category-map-item.interface';
import { OrderItem as OrderItemInterface } from '../order/interfaces/order.interface';
import { Category as CategoryInterface } from '../category/interfaces/category.interface';
import { Transaction } from '../order/entities/order-transaction.entity';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  constructor(
    private readonly orderService: OrderService,
    private readonly categoryService: CategoryService,
  ) {}

  async getStockSummary(
    filter: StockSummaryFilterDto,
  ): Promise<StockSummary[]> {
    const orders = await this.fetchOrders();
    const sellOrders = await this.fetchSellOrders();
    const categories = await this.fetchCategories();

    const flatBuyOrders = this.flattenOrders(orders);
    const flatSellOrders = this.flattenOrders(sellOrders);

    const filteredBuyOrders = this.applyFilters(flatBuyOrders, filter);
    const filteredSellOrders = this.applyFilters(flatSellOrders, filter);

    const categoryMap = this.buildCategoryMap(categories);
    const summary = this.groupSummary(
      filteredBuyOrders,
      filteredSellOrders,
      categoryMap,
    );
    return summary;
  }

  private async fetchOrders(): Promise<OrderItemInterface[]> {
    const ordersData = await this.orderService.getBuyTransactions();
    return ordersData.map((order) => this.convertTransactionToInterface(order));
  }

  private async fetchSellOrders(): Promise<OrderItemInterface[]> {
    const ordersData = await this.orderService.getSellTransactions();
    return ordersData.map((order) => this.convertTransactionToInterface(order));
  }

  private convertTransactionToInterface(
    transaction: Transaction,
  ): OrderItemInterface {
    const requestList = transaction.orderItems
      ? transaction.orderItems.map((item) => ({
          categoryID: item.categoryId,
          subCategoryID: item.subCategoryId,
          requestList: item.details
            ? item.details.map((detail) => ({
                grade: detail.grade,
                price: Number(detail.price) || 0,
                quantity: detail.quantity,
                total: Number(detail.total) || 0,
              }))
            : [],
        }))
      : [];

    return {
      orderId: transaction.orderId,
      requestList,
      transactionParties: {
        customer: {
          roleName: 'customer',
          name: transaction.customerName,
          id: transaction.customerId,
        },
        transport: {
          roleName: 'transport',
          name: transaction.transportName,
          id: transaction.transportId,
        },
        collector: {
          roleName: 'collector',
          name: transaction.collectorName,
          id: transaction.collectorId,
        },
      },
      orderFinishedDate: transaction.finishedDate?.toString() || '',
      orderFinishedTime: transaction.finishedTime || '',
    };
  }

  private async fetchCategories(): Promise<CategoryInterface[]> {
    const categoriesData = await this.categoryService.getCategories();
    if (Array.isArray(categoriesData)) {
      return categoriesData.map((cat) => ({
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        subcategory: cat.subcategory.map((sub) => ({
          subCategoryId: sub.subCategoryId,
          subCategoryName: sub.subCategoryName,
        })),
      }));
    }
    return [];
  }

  private flattenOrders(orders: OrderItemInterface[]): FlatOrder[] {
    const flatOrders: FlatOrder[] = [];
    for (const order of orders) {
      for (const req of order.requestList) {
        for (const item of req.requestList) {
          flatOrders.push({
            orderId: order.orderId,
            categoryId: req.categoryID,
            subCategoryId: req.subCategoryID,
            grade: item.grade,
            price: Number(item.price),
            quantity: Number(item.quantity),
            total: Number(item.total),
            orderFinishedDate: order.orderFinishedDate,
            orderFinishedTime: order.orderFinishedTime,
          });
        }
      }
    }
    return flatOrders;
  }

  private applyFilters(
    flatOrders: FlatOrder[],
    filter: StockSummaryFilterDto,
  ): FlatOrder[] {
    let filteredOrders = flatOrders;
    if (filter.startOrderFinishDate) {
      filteredOrders = filteredOrders.filter(
        (o) =>
          new Date(o.orderFinishedDate) >=
          new Date(filter.startOrderFinishDate),
      );
    }
    if (filter.endOrderFinishDate) {
      filteredOrders = filteredOrders.filter(
        (o) =>
          new Date(o.orderFinishedDate) <= new Date(filter.endOrderFinishDate),
      );
    }
    if (filter.categoryId) {
      const categoryIds = filter.categoryId.split(',').map((c) => c.trim());
      filteredOrders = filteredOrders.filter((o) =>
        categoryIds.includes(o.categoryId),
      );
    }
    if (filter.subCategoryId) {
      const subCategoryIds = filter.subCategoryId
        .split(',')
        .map((s) => s.trim());
      filteredOrders = filteredOrders.filter((o) =>
        subCategoryIds.includes(o.subCategoryId),
      );
    }
    if (filter.orderId) {
      filteredOrders = filteredOrders.filter(
        (o) => o.orderId === filter.orderId,
      );
    }
    if (filter.priceMin !== undefined && filter.priceMin !== null) {
      filteredOrders = filteredOrders.filter((o) => o.price >= filter.priceMin);
    }
    if (filter.priceMax !== undefined && filter.priceMax !== null) {
      filteredOrders = filteredOrders.filter((o) => o.price <= filter.priceMax);
    }
    if (filter.grade) {
      const grades = filter.grade.split(',').map((g) => g.trim());
      filteredOrders = filteredOrders.filter((o) => grades.includes(o.grade));
    }
    return filteredOrders;
  }

  private buildCategoryMap(
    categories: CategoryInterface[],
  ): Map<string, CategoryMapItem> {
    const categoryMap = new Map<string, CategoryMapItem>();
    for (const cat of categories) {
      for (const sub of cat.subcategory) {
        categoryMap.set(`${cat.categoryId}_${sub.subCategoryId}`, {
          categoryName: cat.categoryName,
          subCategoryName: sub.subCategoryName,
        });
      }
    }
    return categoryMap;
  }

  private groupSummary(
    filteredBuyOrders: FlatOrder[],
    filteredSellOrders: FlatOrder[],
    categoryMap: Map<string, CategoryMapItem>,
  ): StockSummary[] {
    const summaryMap = new Map<string, StockSummary>();

    // Process buy orders
    for (const item of filteredBuyOrders) {
      const key = `${item.categoryId}_${item.subCategoryId}`;
      let summary = summaryMap.get(key);
      if (!summary) {
        const names = categoryMap.get(key) || {
          categoryName: '',
          subCategoryName: '',
        };
        summary = {
          categoryId: item.categoryId,
          subCategoryId: item.subCategoryId,
          productName: `${names.categoryName} - ${names.subCategoryName}`,
          totalBuyWeight: 0,
          totalBuyAmount: 0,
          totalSellWeight: 0,
          totalSellAmount: 0,
          remainWeight: 0,
          remainAmount: 0,
        };
        summaryMap.set(key, summary);
      }
      summary.totalBuyWeight += item.quantity;
      summary.totalBuyAmount += item.total;
    }

    // Process sell orders
    for (const item of filteredSellOrders) {
      const key = `${item.categoryId}_${item.subCategoryId}`;
      let summary = summaryMap.get(key);
      if (!summary) {
        const names = categoryMap.get(key) || {
          categoryName: '',
          subCategoryName: '',
        };
        summary = {
          categoryId: item.categoryId,
          subCategoryId: item.subCategoryId,
          productName: `${names.categoryName} - ${names.subCategoryName}`,
          totalBuyWeight: 0,
          totalBuyAmount: 0,
          totalSellWeight: 0,
          totalSellAmount: 0,
          remainWeight: 0,
          remainAmount: 0,
        };
        summaryMap.set(key, summary);
      }
      summary.totalSellWeight += item.quantity;
      summary.totalSellAmount += item.total;
    }

    // Calculate remain
    for (const item of summaryMap.values()) {
      item.remainWeight = item.totalBuyWeight - item.totalSellWeight;
      item.remainAmount = item.totalBuyAmount - item.totalSellAmount;
    }
    return Array.from(summaryMap.values());
  }
}
