import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from '../order/schemas/transaction.schema';
import {
  Category,
  CategoryDocument,
} from '../category/schemas/category.schema';
import { TransactionType } from '../order/enums/transaction-type.enum';
import { StockSummaryFilterDto } from './dto/stock-summary-filter.dto';
import { StockSummary } from './interfaces/stock-summary.interface';
import { isNumber } from 'lodash';

interface AggregatedStockResult {
  _id: {
    categoryId: string;
    subCategoryId: string;
  };
  totalBuyWeight: number;
  totalBuyAmount: number;
  totalSellWeight: number;
  totalSellAmount: number;
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  async getStockSummary(
    filter: StockSummaryFilterDto,
  ): Promise<StockSummary[]> {
    const [results, categories] = await Promise.all([
      this.querySummary(filter),
      this.categoryModel.find().lean().exec(),
    ]);

    const categoryMap = new Map(
      categories.flatMap((cat) =>
        cat.subcategory.map((sub) => [
          `${cat.categoryId}|${sub.subCategoryId}`,
          {
            categoryName: cat.categoryName,
            subcategoryName: sub.subCategoryName,
          },
        ]),
      ),
    );

    return results.map((result) => {
      const info = categoryMap.get(
        `${result.categoryId}|${result.subCategoryId}`,
      );
      return {
        ...result,
        productName: info
          ? `${info.categoryName} / ${info.subcategoryName}`
          : `${result.categoryId} - ${result.subCategoryId}`,
      };
    });
  }

  private async querySummary(
    filter: StockSummaryFilterDto,
  ): Promise<StockSummary[]> {
    const pipeline: any[] = [];
    const matchStage: any = {};

    if (filter.orderId) {
      matchStage['orderId'] = filter.orderId;
    }

    if (filter.categoryId) {
      const categoryIds = filter.categoryId.split(',').map((c) => c.trim());
      matchStage['orderItems.categoryId'] = { $in: categoryIds };
    }

    if (filter.subCategoryId) {
      const subCategoryIds = filter.subCategoryId
        .split(',')
        .map((s) => s.trim());
      matchStage['orderItems.subCategoryId'] = { $in: subCategoryIds };
    }

    if (filter.startOrderFinishDate || filter.endOrderFinishDate) {
      matchStage['finishedDate'] = {};
      if (filter.startOrderFinishDate) {
        matchStage['finishedDate'].$gte = new Date(filter.startOrderFinishDate);
      }
      if (filter.endOrderFinishDate) {
        matchStage['finishedDate'].$lte = new Date(filter.endOrderFinishDate);
      }
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Stage 2: Unwind orderItems
    pipeline.push({ $unwind: '$orderItems' });

    // Stage 3: Unwind details
    pipeline.push({ $unwind: '$orderItems.details' });

    // Stage 4: Filter by grade
    if (filter.grade) {
      const grades = filter.grade.split(',').map((g) => g.trim());
      pipeline.push({
        $match: { 'orderItems.details.grade': { $in: grades } },
      });
    }

    // Stage 5: Filter by price
    const priceMatch: Record<string, any> = {};
    if (isNumber(filter.priceMin)) {
      priceMatch['orderItems.details.price'] = {
        ...priceMatch['orderItems.details.price'],
        $gte: filter.priceMin,
      };
    }
    if (isNumber(filter.priceMax)) {
      priceMatch['orderItems.details.price'] = {
        ...priceMatch['orderItems.details.price'],
        $lte: filter.priceMax,
      };
    }
    if (Object.keys(priceMatch).length > 0) {
      pipeline.push({ $match: priceMatch });
    }

    // Stage 6: Group and aggregate
    pipeline.push({
      $group: {
        _id: {
          categoryId: '$orderItems.categoryId',
          subCategoryId: '$orderItems.subCategoryId',
        },
        totalBuyWeight: {
          $sum: {
            $cond: [
              { $eq: ['$transactionType', TransactionType.BUY] },
              {
                $convert: {
                  input: '$orderItems.details.quantity',
                  to: 'double',
                },
              },
              0,
            ],
          },
        },
        totalBuyAmount: {
          $sum: {
            $cond: [
              { $eq: ['$transactionType', TransactionType.BUY] },
              '$orderItems.details.total',
              0,
            ],
          },
        },
        totalSellWeight: {
          $sum: {
            $cond: [
              { $eq: ['$transactionType', TransactionType.SELL] },
              {
                $convert: {
                  input: '$orderItems.details.quantity',
                  to: 'double',
                },
              },
              0,
            ],
          },
        },
        totalSellAmount: {
          $sum: {
            $cond: [
              { $eq: ['$transactionType', TransactionType.SELL] },
              '$orderItems.details.total',
              0,
            ],
          },
        },
      },
    });

    // Stage 7: Convert decimals to double
    pipeline.push({
      $project: {
        _id: 1,
        totalBuyWeight: {
          $convert: { input: '$totalBuyWeight', to: 'double' },
        },
        totalBuyAmount: {
          $convert: { input: '$totalBuyAmount', to: 'double' },
        },
        totalSellWeight: {
          $convert: { input: '$totalSellWeight', to: 'double' },
        },
        totalSellAmount: {
          $convert: { input: '$totalSellAmount', to: 'double' },
        },
      },
    });

    // Stage 8: Sort
    pipeline.push({
      $sort: {
        '_id.categoryId': 1,
        '_id.subCategoryId': 1,
      },
    });

    const results =
      await this.transactionModel.aggregate<AggregatedStockResult>(pipeline);

    // Transform to StockSummary with calculated remainWeight and remainAmount
    return results.map((result) => ({
      categoryId: result._id.categoryId,
      subCategoryId: result._id.subCategoryId,
      productName: `${result._id.categoryId} - ${result._id.subCategoryId}`,
      totalBuyWeight: result.totalBuyWeight,
      totalBuyAmount: result.totalBuyAmount,
      totalSellWeight: result.totalSellWeight,
      totalSellAmount: result.totalSellAmount,
      remainWeight: result.totalBuyWeight - result.totalSellWeight,
      remainAmount: result.totalBuyAmount - result.totalSellAmount,
    }));
  }
}
