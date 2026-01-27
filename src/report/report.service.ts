import { Injectable } from '@nestjs/common';
import { OrderService } from '../order/order.service';
import { CategoryService } from '../category/category.service';
import { StockSummaryFilterDto } from './dto/stock-summary-filter.dto';
import { StockSummary } from './interfaces/stock-summary.interface';
import { FlatOrder } from './interfaces/flat-order.interface';
import { CategoryMapItem } from './interfaces/category-map-item.interface';
import { OrderItem } from '../order/interfaces/order.interface';
import { Category } from '../category/interfaces/category.interface';

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

  private async fetchOrders(): Promise<OrderItem[]> {
    const ordersData = await this.orderService.getOrders();
    return ordersData?.buyTransaction ?? [];
  }

  private async fetchSellOrders(): Promise<OrderItem[]> {
    const ordersData = await this.orderService.getOrders();
    return ordersData?.sellTransaction ?? [];
  }

  private async fetchCategories(): Promise<Category[]> {
    const categoriesData = await this.categoryService.getCategories();
    if (Array.isArray(categoriesData)) {
      return categoriesData as Category[];
    }
    return (categoriesData as any)?.productList ?? [];
  }

  private flattenOrders(orders: OrderItem[]): FlatOrder[] {
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
    categories: Category[],
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
