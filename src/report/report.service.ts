import { Injectable } from '@nestjs/common';
import { OrderService } from '../order/order.service';
import { CategoryService } from '../category/category.service';
import { StockSummaryFilterDto } from './dto/stock-summary-filter.dto';
import { StockSummary } from './interfaces/stock-summary.interface';

@Injectable()
export class ReportService {
  constructor(
    private readonly orderService: OrderService,
    private readonly categoryService: CategoryService,
  ) {}

  async getStockSummary(
    filter: StockSummaryFilterDto,
  ): Promise<StockSummary[]> {
    const orders = await this.orderService.getOrders();
    const categories = await this.categoryService.getCategories();

    // Flatten all order items
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

    // Apply filters
    let filteredOrders = flatOrders;
    if (filter.dateFrom) {
      filteredOrders = filteredOrders.filter(
        (o) => new Date(o.orderFinishedDate) >= new Date(filter.dateFrom),
      );
    }
    if (filter.dateTo) {
      filteredOrders = filteredOrders.filter(
        (o) => new Date(o.orderFinishedDate) <= new Date(filter.dateTo),
      );
    }
    if (filter.categoryId) {
      filteredOrders = filteredOrders.filter(
        (o) => o.categoryId === filter.categoryId,
      );
    }
    if (filter.subCategoryId) {
      filteredOrders = filteredOrders.filter(
        (o) => o.subCategoryId === filter.subCategoryId,
      );
    }
    if (filter.orderId) {
      filteredOrders = filteredOrders.filter(
        (o) => o.orderId === filter.orderId,
      );
    }
    if (typeof filter.priceMin === 'number') {
      filteredOrders = filteredOrders.filter((o) => o.price >= filter.priceMin);
    }
    if (typeof filter.priceMax === 'number') {
      filteredOrders = filteredOrders.filter((o) => o.price <= filter.priceMax);
    }
    if (filter.grade) {
      filteredOrders = filteredOrders.filter((o) => o.grade === filter.grade);
    }

    // Prepare category/subcategory name lookup
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

    // Group by categoryId, subCategoryId
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
