import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { StockSummaryFilterDto } from './dto/stock-summary-filter.dto';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('stock-summary')
  getStockSummary(@Query() filter: StockSummaryFilterDto) {
    return this.reportService.getStockSummary(filter);
  }
}
