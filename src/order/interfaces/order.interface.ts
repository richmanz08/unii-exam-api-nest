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
  customer: Parties;
  transport: Parties;
  collector: Parties;
}

interface Parties {
  roleName: string;
  name: string;
  id: string;
}

export interface OrderItem {
  orderId: string;
  requestList: OrderRequest[];
  transactionParties: TransactionParties;
  orderFinishedDate: string;
  orderFinishedTime: string;
}

export interface Order {
  buyTransaction: OrderItem[];
  sellTransaction: OrderItem[];
}
