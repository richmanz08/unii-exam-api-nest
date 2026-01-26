export interface SubCategory {
  subCategoryId: string;
  subCategoryName: string;
}

export interface Category {
  categoryId: string;
  categoryName: string;
  subcategory: SubCategory[];
}
