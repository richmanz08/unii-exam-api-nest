import { Controller, Get, Post } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('list')
  async getCategoryList(): Promise<Category[]> {
    return this.categoryService.getCategories();
  }

  @Post('sync')
  async syncCategories(): Promise<{ message: string }> {
    return this.categoryService.syncCategoriesFromAPI();
  }
}
