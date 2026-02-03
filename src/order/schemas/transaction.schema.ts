import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TransactionType } from '../enums/transaction-type.enum';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true, enum: Object.values(TransactionType) })
  transactionType: TransactionType;

  @Prop({ required: true })
  orderId: string;

  @Prop()
  customerName: string;

  @Prop()
  customerId: string;

  @Prop()
  transportName: string;

  @Prop()
  transportId: string;

  @Prop()
  collectorName: string;

  @Prop()
  collectorId: string;

  @Prop()
  finishedDate: Date;

  @Prop()
  finishedTime: string;

  @Prop({ type: [Object], default: [] })
  orderItems: Array<{
    categoryId: string;
    subCategoryId: string;
    details: Array<{
      grade: string;
      price: number;
      quantity: string;
      total: number;
    }>;
  }>;

  @Prop({ default: null })
  deletedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
