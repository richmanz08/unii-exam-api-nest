export interface OrderRequestItem {
  grade: string;
  price: number;
  quantity: string;
  total: number;
}

export interface OrderRequest {
  categoryID: string;
  subCategoryID: string;
  requestList: OrderRequestItem[];
}

export interface TransactionParties {
  customer: { roleName: string; name: string; id: string };
  transport: { roleName: string; name: string; id: string };
  collector: { roleName: string; name: string; id: string };
}

export interface Order {
  orderId: string;
  requestList: OrderRequest[];
  transactionParties: TransactionParties;
  orderFinishedDate: string;
  orderFinishedTime: string;
}
