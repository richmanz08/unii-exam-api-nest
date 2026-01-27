export interface FlatOrder {
  orderId: string;
  categoryId: string;
  subCategoryId: string;
  grade: string;
  price: number;
  quantity: number;
  total: number;
  orderFinishedDate: string;
  orderFinishedTime: string;
}
