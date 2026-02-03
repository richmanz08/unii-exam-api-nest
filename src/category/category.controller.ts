import { Controller, Get, Post } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryDocument } from './schemas/category.schema';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('list')
  async getCategoryList(): Promise<CategoryDocument[]> {
    return this.categoryService.getCategories();
  }

  @Post('sync')
  async syncCategories(): Promise<{ message: string }> {
    return this.categoryService.syncCategoriesFromAPI();
  }
}
