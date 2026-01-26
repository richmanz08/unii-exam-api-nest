export interface StockSummary {
  categoryId: string;
  subCategoryId: string;
  productName: string;
  totalBuyWeight: number;
  totalBuyAmount: number;
  totalSellWeight: number;
  totalSellAmount: number;
  remainWeight: number;
  remainAmount: number;
}
