export class StockSummaryFilterDto {
  startOrderFinishDate?: string;
  endOrderFinishDate?: string;
  categoryId?: string; // ex: "01,02"
  subCategoryId?: string; // ex: "0101,0202"
  orderId?: string;
  priceMin?: number;
  priceMax?: number;
  grade?: string; // ex: "A,B,C"
}
