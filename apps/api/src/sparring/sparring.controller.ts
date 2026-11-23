import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { SparringService } from './sparring.service';
import { ToggleSparringDto } from './dto/toggle-sparring.dto';
import { ChallengeSparringDto } from './dto/challenge-sparring.dto';

@Controller()
export class SparringController {
  constructor(private readonly sparringService: SparringService) {}

  /**
   * GET /sparring
   * Mengambil seluruh jadwal sparring terbuka untuk publik.
   */
  @Get('sparring')
  async getOpenSparrings(
    @Query('venueSlug') venueSlug?: string,
    @Query('level') level?: string,
  ) {
    return this.sparringService.getOpenSparrings(venueSlug, level);
  }

  /**
   * PATCH /bookings/:id/sparring
   * Mengaktifkan atau menonaktifkan status sparring pada booking.
   */
  @Patch('bookings/:id/sparring')
  async toggleSparring(
    @Param('id') bookingId: string,
    @Body() dto: ToggleSparringDto,
  ) {
    return this.sparringService.toggleSparring(bookingId, dto);
  }

  /**
   * POST /sparring/:bookingId/challenge
   * Mengirim tantangan sparring resmi (dengan persetujuan PDP)
   * dan menerima link WhatsApp konfirmasi tanding.
   */
  @Post('sparring/:bookingId/challenge')
  async challengeSparring(
    @Param('bookingId') bookingId: string,
    @Body() dto: ChallengeSparringDto,
  ) {
    return this.sparringService.challengeSparring(bookingId, dto);
  }
}
