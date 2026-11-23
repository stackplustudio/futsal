import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CloseShiftDto } from './dto/close-shift.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * GET /reports/occupancy
   * Menghitung tingkat okupansi lapangan (% jam terisi vs kapasitas operasional)
   */
  @Get('occupancy')
  async getOccupancy(
    @Query('venueId') venueId?: string,
    @Query('range') range?: string,
  ) {
    return this.reportsService.getOccupancyReport(venueId, range);
  }

  /**
   * GET /reports/revenue
   * Menghitung total omzet gabungan sewa lapangan vs kantin F&B vs sewa alat
   */
  @Get('revenue')
  async getRevenue(
    @Query('venueId') venueId?: string,
    @Query('range') range?: string,
  ) {
    return this.reportsService.getRevenueReport(venueId, range);
  }

  /**
   * GET /reports/cashier-shifts
   * Mengambil riwayat tutup shift kasir resepsionis
   */
  @Get('cashier-shifts')
  async getCashierShifts(@Query('venueId') venueId?: string) {
    return this.reportsService.getCashierShifts(venueId);
  }

  /**
   * POST /reports/shifts/close
   * Menutup sesi kasir resepsionis dan menghitung selisih uang fisik vs sistem
   */
  @Post('shifts/close')
  async closeShift(@Body() dto: CloseShiftDto) {
    return this.reportsService.closeShift(dto);
  }
}
