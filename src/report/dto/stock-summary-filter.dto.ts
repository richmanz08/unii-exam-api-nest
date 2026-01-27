export class StockSummaryFilterDto {
  startOrderFinishDate?: string;
  endOrderFinishDate?: string;
  categoryId?: string;
  subCategoryId?: string;
  orderId?: string;
  priceMin?: number;
  priceMax?: number;
  grade?: string; // ex: "A,B,C"
}
