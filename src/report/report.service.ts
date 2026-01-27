import { Injectable } from '@nestjs/common';
import { OrderService } from '../order/order.service';
import { CategoryService } from '../category/category.service';
import { StockSummaryFilterDto } from './dto/stock-summary-filter.dto';
import { StockSummary } from './interfaces/stock-summary.interface';
import { isNumber } from 'lodash';

@Injectable()
export class ReportService {
  constructor(
    private readonly orderService: OrderService,
    private readonly categoryService: CategoryService,
  ) {}

  async getStockSummary(
    filter: StockSummaryFilterDto,
  ): Promise<StockSummary[]> {
    const orders = await this.fetchOrders();
    const categories = await this.fetchCategories();
    const flatOrders = this.flattenOrders(orders);
    const filteredOrders = this.applyFilters(flatOrders, filter);
    const categoryMap = this.buildCategoryMap(categories);
    const summary = this.groupSummary(filteredOrders, categoryMap);
    return summary;
  }

  private async fetchOrders(): Promise<any[]> {
    const ordersData: any = await this.orderService.getOrders();
    if (ordersData && Array.isArray(ordersData.buyTransaction)) {
      return ordersData.buyTransaction;
    } else if (Array.isArray(ordersData)) {
      return ordersData;
    }
    return [];
  }

  private async fetchCategories(): Promise<any[]> {
    const categoriesData: any = await this.categoryService.getCategories();
    if (Array.isArray(categoriesData)) {
      return categoriesData;
    }
    return categoriesData.productList ?? [];
  }

  private flattenOrders(orders: any[]): any[] {
    const flatOrders = [];
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
    flatOrders: any[],
    filter: StockSummaryFilterDto,
  ): any[] {
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
    if (isNumber(filter.priceMin)) {
      filteredOrders = filteredOrders.filter((o) => o.price >= filter.priceMin);
    }
    if (isNumber(filter.priceMax)) {
      filteredOrders = filteredOrders.filter((o) => o.price <= filter.priceMax);
    }
    if (filter.grade) {
      const grades = filter.grade.split(',').map((g) => g.trim());
      filteredOrders = filteredOrders.filter((o) => grades.includes(o.grade));
    }
    return filteredOrders;
  }

  private buildCategoryMap(
    categories: any[],
  ): Map<string, { categoryName: string; subCategoryName: string }> {
    const categoryMap = new Map<
      string,
      { categoryName: string; subCategoryName: string }
    >();
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
    filteredOrders: any[],
    categoryMap: Map<string, { categoryName: string; subCategoryName: string }>,
  ): StockSummary[] {
    const summaryMap = new Map<string, StockSummary>();
    for (const item of filteredOrders) {
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
          totalSellWeight: 0, // ไม่มีข้อมูลขายในตัวอย่างนี้
          totalSellAmount: 0, // ไม่มีข้อมูลขายในตัวอย่างนี้
          remainWeight: 0,
          remainAmount: 0,
        };
        summaryMap.set(key, summary);
      }
      summary.totalBuyWeight += item.quantity;
      summary.totalBuyAmount += item.total;
    }
    // Calculate remain
    for (const item of summaryMap.values()) {
      item.remainWeight = item.totalBuyWeight - item.totalSellWeight;
      item.remainAmount = item.totalBuyAmount - item.totalSellAmount;
    }
    return Array.from(summaryMap.values());
  }
}
