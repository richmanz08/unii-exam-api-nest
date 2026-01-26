export class StockSummaryFilterDto {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  subCategoryId?: string;
  orderId?: string;
  priceMin?: number;
  priceMax?: number;
  grade?: string;
}
