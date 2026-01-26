import { Controller, Get } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('list')
  async getCategoryList() {
    const categoriesData: any = await this.categoryService.getCategories();
    const categories = Array.isArray(categoriesData)
      ? categoriesData
      : categoriesData.productList ?? [];
    return categories;
  }
}
