import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { Category } from './entities/category.entity';
import { SubCategory } from './entities/subcategory.entity';
import { Category as CategoryInterface } from './interfaces/category.interface';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(SubCategory)
    private subCategoryRepository: Repository<SubCategory>,
    private readonly httpService: HttpService,
  ) {}

  async getCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      relations: ['subcategory'],
    });
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

      // Clear existing data - delete subcategories first due to foreign key constraint
      await this.subCategoryRepository.createQueryBuilder().delete().execute();
      await this.categoryRepository.createQueryBuilder().delete().execute();

      // Save new data
      let categoryCount = 0;
      let subCategoryCount = 0;

      await Promise.all(
        apiData.map(async (categoryData) => {
          const category = this.categoryRepository.create({
            categoryId: categoryData.categoryId,
            categoryName: categoryData.categoryName,
          });

          const savedCategory = await this.categoryRepository.save(category);
          categoryCount++;

          // Create and save subcategories
          if (categoryData.subcategory && categoryData.subcategory.length > 0) {
            const subCategories = categoryData.subcategory.map((sub) => {
              return this.subCategoryRepository.create({
                subCategoryId: sub.subCategoryId,
                subCategoryName: sub.subCategoryName,
                categoryId: savedCategory.id,
              });
            });

            await this.subCategoryRepository.save(subCategories);
            subCategoryCount += subCategories.length;
          }

          return savedCategory;
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
