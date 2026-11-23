import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CourtsService } from './courts.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * CourtsController
 *
 * Routes: /venues/:venueId/courts
 * Semua endpoint dilindungi JwtAuthGuard + RolesGuard.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('venues/:venueId/courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  /** VENUE_OWNER / VENUE_MANAGER: tambah lapangan di venue */
  @Roles('VENUE_OWNER', 'VENUE_MANAGER', 'SUPER_ADMIN', 'ADMIN')
  @Post()
  create(@Param('venueId') venueId: string, @Body() dto: CreateCourtDto) {
    return this.courtsService.create(venueId, dto);
  }

  /** VENUE_OWNER / VENUE_MANAGER / CASHIER: daftar lapangan */
  @Roles('VENUE_OWNER', 'VENUE_MANAGER', 'CASHIER', 'SUPER_ADMIN', 'ADMIN')
  @Get()
  findAll(
    @Param('venueId') venueId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return this.courtsService.findAll(venueId, pageNum, limitNum);
  }

  /** Semua role yang terautentikasi: detail lapangan + aturan tarif */
  @Roles('VENUE_OWNER', 'VENUE_MANAGER', 'CASHIER', 'SUPER_ADMIN', 'ADMIN')
  @Get(':id')
  findOne(@Param('venueId') venueId: string, @Param('id') id: string) {
    return this.courtsService.findOne(venueId, id);
  }

  /** VENUE_OWNER / VENUE_MANAGER: perbarui lapangan */
  @Roles('VENUE_OWNER', 'VENUE_MANAGER', 'SUPER_ADMIN', 'ADMIN')
  @Patch(':id')
  update(
    @Param('venueId') venueId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCourtDto,
  ) {
    return this.courtsService.update(venueId, id, dto);
  }

  /** VENUE_OWNER / SUPER_ADMIN: hapus logis lapangan */
  @Roles('VENUE_OWNER', 'SUPER_ADMIN', 'ADMIN')
  @Delete(':id')
  remove(@Param('venueId') venueId: string, @Param('id') id: string) {
    return this.courtsService.remove(venueId, id);
  }

  // ── Pricing Rules ──────────────────────────────────────────────────────────

  /** VENUE_OWNER / VENUE_MANAGER: tambah aturan tarif dinamis */
  @Roles('VENUE_OWNER', 'VENUE_MANAGER', 'SUPER_ADMIN', 'ADMIN')
  @Post(':id/pricing-rules')
  addPricingRule(
    @Param('venueId') venueId: string,
    @Param('id') courtId: string,
    @Body() dto: CreatePricingRuleDto,
  ) {
    return this.courtsService.addPricingRule(venueId, courtId, dto);
  }

  /** VENUE_OWNER / VENUE_MANAGER: hapus aturan tarif */
  @Roles('VENUE_OWNER', 'VENUE_MANAGER', 'SUPER_ADMIN', 'ADMIN')
  @Delete(':id/pricing-rules/:ruleId')
  removePricingRule(
    @Param('venueId') venueId: string,
    @Param('id') courtId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return this.courtsService.removePricingRule(venueId, courtId, ruleId);
  }

  /**
   * Preview kalkulasi tarif sewa (FR-001 Skenario 1)
   * GET /venues/:venueId/courts/:id/pricing-preview?startHour=17&endHour=19&bookingDate=2026-11-25
   */
  @Roles('VENUE_OWNER', 'VENUE_MANAGER', 'CASHIER', 'SUPER_ADMIN', 'ADMIN')
  @Get(':id/pricing-preview')
  previewPricing(
    @Param('venueId') venueId: string,
    @Param('id') courtId: string,
    @Query('startHour') startHour: string,
    @Query('endHour') endHour: string,
    @Query('bookingDate') bookingDate: string,
  ) {
    return this.courtsService.previewPricing(
      venueId,
      courtId,
      parseInt(startHour, 10),
      parseInt(endHour, 10),
      bookingDate,
    );
  }
}
