import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateSnapTokenDto } from './dto/create-snap-token.dto';
import { MidtransWebhookDto } from './dto/midtrans-webhook.dto';

@Controller('public/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Menerbitkan token Midtrans Snap untuk pembayaran DP.
   */
  @Post('snap-token')
  @HttpCode(HttpStatus.OK)
  createSnapToken(@Body() dto: CreateSnapTokenDto) {
    return this.paymentsService.createSnapToken(dto);
  }

  /**
   * Webhook HTTP callback dari Midtrans setelah pembayaran selesai.
   */
  @Post('midtrans-webhook')
  @HttpCode(HttpStatus.OK)
  handleMidtransWebhook(@Body() dto: MidtransWebhookDto) {
    return this.paymentsService.handleWebhook(dto);
  }

  /**
   * Cek status pembayaran booking saat ini.
   */
  @Get(':bookingCode/status')
  getPaymentStatus(@Param('bookingCode') bookingCode: string) {
    return this.paymentsService.getPaymentStatus(bookingCode);
  }

  /**
   * Endpoint pemicu manual/cron pengingat WhatsApp H-4 jam.
   */
  @Post(':bookingCode/reminder-h4')
  @HttpCode(HttpStatus.OK)
  triggerH4Reminder(@Param('bookingCode') bookingCode: string) {
    return this.paymentsService.triggerH4Reminder(bookingCode);
  }
}
