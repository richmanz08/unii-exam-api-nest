import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { StockSummaryFilterDto } from './dto/stock-summary-filter.dto';
import { StockSummary } from './interfaces/stock-summary.interface';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('stock-summary')
  async getStockSummary(
    @Query() filter: StockSummaryFilterDto,
  ): Promise<StockSummary[]> {
    return this.reportService.getStockSummary(filter);
  }
}
