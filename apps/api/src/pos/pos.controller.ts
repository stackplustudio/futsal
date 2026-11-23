import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PosService } from './pos.service';
import { CreateCanteenOrderDto } from './dto/create-canteen-order.dto';
import { SettlementPosDto } from './dto/settlement-pos.dto';

@Controller('public/pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  /**
   * Mengambil produk kantin & sewa alat untuk venue tertentu.
   */
  @Get('products')
  getCanteenProducts(@Query('venueSlug') venueSlug: string) {
    return this.posService.getCanteenProducts(venueSlug);
  }

  /**
   * Menambahkan pesanan produk kantin ke booking.
   */
  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  createCanteenOrder(@Body() dto: CreateCanteenOrderDto) {
    return this.posService.createCanteenOrder(dto);
  }

  /**
   * Memproses pelunasan booking & pesanan kasir meja resepsionis.
   */
  @Post('settlement')
  @HttpCode(HttpStatus.OK)
  settleBookingAtCashier(@Body() dto: SettlementPosDto) {
    return this.posService.settleBookingAtCashier(dto);
  }

  /**
   * Mengambil detail struk pembayaran untuk dicetak thermal / digital.
   */
  @Get('receipt/:bookingCode')
  getReceipt(@Param('bookingCode') bookingCode: string) {
    return this.posService.getReceipt(bookingCode);
  }
}
