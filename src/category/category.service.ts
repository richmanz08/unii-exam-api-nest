import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Category as CategoryInterface } from './interfaces/category.interface';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    private readonly httpService: HttpService,
  ) {}

  async getCategories(): Promise<CategoryDocument[]> {
    return this.categoryModel.find().exec();
  }

  async syncCategoriesFromAPI(): Promise<{ message: string }> {
    try {
      const response$ = this.httpService.get(
        'https://apirecycle.unii.co.th/category/query-product-demo',
      );
      const response = await lastValueFrom(response$);

      // Log response structure for debugging
      console.log(
        'API Response:',
        JSON.stringify(response.data, null, 2).substring(0, 500),
      );

      // Handle different response structures
      let apiData: CategoryInterface[] = [];
      if (Array.isArray(response.data)) {
        apiData = response.data;
      } else if (response.data && Array.isArray(response.data.productList)) {
        apiData = response.data.productList;
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        apiData = response.data.data;
      }

      // Clear existing data
      await this.categoryModel.deleteMany({});

      // Save new data
      let categoryCount = 0;
      let subCategoryCount = 0;

      await Promise.all(
        apiData.map(async (categoryData) => {
          const categoryDoc = new this.categoryModel({
            categoryId: categoryData.categoryId,
            categoryName: categoryData.categoryName,
            subcategory: categoryData.subcategory || [],
          });

          await categoryDoc.save();
          categoryCount++;

          // Count subcategories
          if (categoryData.subcategory && categoryData.subcategory.length > 0) {
            subCategoryCount += categoryData.subcategory.length;
          }

          return categoryDoc;
        }),
      );

      return {
        message: `Sync completed successfully. Categories: ${categoryCount}, Subcategories: ${subCategoryCount}`,
      };
    } catch (error) {
      throw new Error(`Failed to sync categories from API: ${error.message}`);
    }
  }
}
