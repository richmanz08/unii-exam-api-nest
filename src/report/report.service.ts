import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItemDetail } from '../order/entities/order-item-detail.entity';
import { StockSummaryFilterDto } from './dto/stock-summary-filter.dto';
import { StockSummary } from './interfaces/stock-summary.interface';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  constructor(
    @InjectRepository(OrderItemDetail)
    private orderItemDetailRepository: Repository<OrderItemDetail>,
  ) {}

  async getStockSummary(
    filter: StockSummaryFilterDto,
  ): Promise<StockSummary[]> {
    // Use database aggregation directly
    return this.querySummary(filter);
  }

  private async querySummary(
    filter: StockSummaryFilterDto,
  ): Promise<StockSummary[]> {
    const query = this.orderItemDetailRepository
      .createQueryBuilder('oid')
      .leftJoin('oid.orderItem', 'oi')
      .leftJoin('oi.transaction', 't')
      .select('oi.categoryId', 'categoryId')
      .addSelect('oi.subCategoryId', 'subCategoryId')
      .addSelect(
        'COALESCE(SUM(CASE WHEN t.transactionType = :buy THEN CAST(oid.quantity AS DECIMAL) ELSE 0 END), 0)',
        'totalBuyWeight',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN t.transactionType = :buy THEN CAST(oid.total AS DECIMAL) ELSE 0 END), 0)',
        'totalBuyAmount',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN t.transactionType = :sell THEN CAST(oid.quantity AS DECIMAL) ELSE 0 END), 0)',
        'totalSellWeight',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN t.transactionType = :sell THEN CAST(oid.total AS DECIMAL) ELSE 0 END), 0)',
        'totalSellAmount',
      )
      .setParameter('buy', 'buy')
      .setParameter('sell', 'sell')
      .groupBy('oi.categoryId')
      .addGroupBy('oi.subCategoryId');

    // Apply filters
    if (filter.orderId) {
      query.andWhere('t.orderId = :orderId', { orderId: filter.orderId });
    }

    if (filter.categoryId) {
      const categoryIds = filter.categoryId.split(',').map((c) => c.trim());
      query.andWhere('oi.categoryId IN (:...categoryIds)', { categoryIds });
    }

    if (filter.subCategoryId) {
      const subCategoryIds = filter.subCategoryId
        .split(',')
        .map((s) => s.trim());
      query.andWhere('oi.subCategoryId IN (:...subCategoryIds)', {
        subCategoryIds,
      });
    }

    if (filter.startOrderFinishDate && filter.endOrderFinishDate) {
      query.andWhere('t.finishedDate BETWEEN :startDate AND :endDate', {
        startDate: filter.startOrderFinishDate,
        endDate: filter.endOrderFinishDate,
      });
    } else if (filter.startOrderFinishDate) {
      query.andWhere('t.finishedDate >= :startDate', {
        startDate: filter.startOrderFinishDate,
      });
    } else if (filter.endOrderFinishDate) {
      query.andWhere('t.finishedDate <= :endDate', {
        endDate: filter.endOrderFinishDate,
      });
    }

    if (filter.grade) {
      const grades = filter.grade.split(',').map((g) => g.trim());
      query.andWhere('oid.grade IN (:...grades)', { grades });
    }

    if (filter.priceMin !== undefined && filter.priceMin !== null) {
      query.andWhere('oid.price >= :priceMin', { priceMin: filter.priceMin });
    }

    if (filter.priceMax !== undefined && filter.priceMax !== null) {
      query.andWhere('oid.price <= :priceMax', { priceMax: filter.priceMax });
    }

    const results = await query.getRawMany();

    // Transform to StockSummary with calculated remainWeight and remainAmount
    return results.map((result) => ({
      categoryId: result.categoryId,
      subCategoryId: result.subCategoryId,
      productName: `${result.categoryId} - ${result.subCategoryId}`,
      totalBuyWeight: Number(result.totalBuyWeight),
      totalBuyAmount: Number(result.totalBuyAmount),
      totalSellWeight: Number(result.totalSellWeight),
      totalSellAmount: Number(result.totalSellAmount),
      remainWeight:
        Number(result.totalBuyWeight) - Number(result.totalSellWeight),
      remainAmount:
        Number(result.totalBuyAmount) - Number(result.totalSellAmount),
    }));
  }
}
