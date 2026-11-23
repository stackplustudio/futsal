import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreatePublicBookingDto } from './dto/create-booking.dto';
import { QueryScheduleDto } from './dto/query-schedule.dto';

/**
 * PublicBookingsController
 *
 * Endpoint terbuka tanpa login untuk pemain/pelanggan publik:
 * - Mengecek matriks jadwal & ketersediaan lapangan (GET /public/venues/:venueSlug/schedule)
 * - Melakukan reservasi instan & penguncian slot (POST /public/bookings)
 * - Memeriksa status booking & instruksi bayar DP (GET /public/bookings/:bookingCode)
 */
@Controller('public')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * Mengambil matriks jadwal ketersediaan lapangan
   * GET /public/venues/:venueSlug/schedule?date=2026-11-23
   */
  @Get('venues/:venueSlug/schedule')
  getVenueSchedule(
    @Param('venueSlug') venueSlug: string,
    @Query() query: QueryScheduleDto,
  ) {
    return this.bookingsService.getVenueSchedule(venueSlug, query.date);
  }

  /**
   * Membuat booking publik baru dengan atomic lock (FR-001 Skenario 2)
   * POST /public/bookings
   */
  @Post('bookings')
  createPublicBooking(@Body() dto: CreatePublicBookingDto) {
    return this.bookingsService.createPublicBooking(dto);
  }

  /**
   * Mengecek status reservasi dan waktu countdown 15 menit
   * GET /public/bookings/:bookingCode
   */
  @Get('bookings/:bookingCode')
  getBookingByCode(@Param('bookingCode') bookingCode: string) {
    return this.bookingsService.getBookingByCode(bookingCode);
  }
}
