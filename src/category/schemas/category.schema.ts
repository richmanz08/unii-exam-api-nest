import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, unique: true })
  categoryId: string;

  @Prop({ required: true })
  categoryName: string;

  @Prop({
    type: [
      {
        subCategoryId: String,
        subCategoryName: String,
      },
    ],
    default: [],
  })
  subcategory: Array<{
    subCategoryId: string;
    subCategoryName: string;
  }>;

  @Prop({ default: null })
  deletedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
