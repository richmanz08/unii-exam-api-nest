import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class StockSummaryFilterDto {
  @IsOptional()
  @IsString()
  startOrderFinishDate?: string;

  @IsOptional()
  @IsString()
  endOrderFinishDate?: string;

  @IsOptional()
  @IsString()
  categoryId?: string; // ex: "01,02"

  @IsOptional()
  @IsString()
  subCategoryId?: string; // ex: "0101,0202"

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  priceMin?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  priceMax?: number;

  @IsOptional()
  @IsString()
  grade?: string; // ex: "A,B,C"
}
