import { Controller, Get } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Category } from './interfaces/category.interface';
import { get } from 'lodash';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('list')
  async getCategoryList(): Promise<Category[]> {
    const categoriesData = await this.categoryService.getCategories();
    // Flatten the category list
    return get(categoriesData, 'productList', []);
  }
}
