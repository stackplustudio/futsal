import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../notifications/whatsapp.service';
import { CreateCanteenOrderDto } from './dto/create-canteen-order.dto';
import { SettlementPosDto } from './dto/settlement-pos.dto';
import { BookingStatus, PaymentMethod } from '@prisma/client';

export interface PosReceiptData {
  receiptNo: string;
  venueName: string;
  venuePhone?: string;
  venueAddress: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  courtName: string;
  bookingDate: string;
  scheduleTime: string;
  courtTotal: number;
  depositPaid: number;
  remainingDueBefore: number;
  canteenItems: Array<{
    name: string;
    qty: number;
    price: number;
    subtotal: number;
  }>;
  canteenTotal: number;
  grandTotal: number;
  finalSettlementPaid: number;
  paymentMethod: string;
  cashReceived?: number;
  cashChange?: number;
  settledAt: string;
}

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  /**
   * Mengambil daftar produk kantin & sewa alat yang tersedia di venue.
   */
  async getCanteenProducts(venueSlug: string) {
    const venue = await this.prisma.venue.findFirst({
      where: { slug: venueSlug, isActive: true },
      select: { id: true, name: true },
    });

    if (!venue) {
      throw new NotFoundException(`Venue ${venueSlug} tidak ditemukan`);
    }

    const products = await this.prisma.canteenProduct.findMany({
      where: {
        venueId: venue.id,
        deletedAt: null,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return {
      venue,
      products: products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        price: Number(p.price),
        costPrice: Number(p.costPrice),
        stock: p.stock,
      })),
    };
  }

  /**
   * Menambahkan pesanan produk kantin / sewa alat ke booking atau kasir.
   */
  async createCanteenOrder(dto: CreateCanteenOrderDto) {
    if (dto.items.length === 0) {
      throw new BadRequestException('Pesanan tidak boleh kosong.');
    }

    const venue = await this.prisma.venue.findFirst({
      where: { slug: dto.venueSlug },
    });

    if (!venue) {
      throw new NotFoundException(`Venue ${dto.venueSlug} tidak ditemukan`);
    }

    return this.prisma.$transaction(async (tx) => {
      let booking = null;
      if (dto.bookingCode) {
        booking = await tx.booking.findUnique({
          where: { bookingCode: dto.bookingCode },
        });
        if (!booking) {
          throw new NotFoundException(
            `Booking ${dto.bookingCode} tidak ditemukan`,
          );
        }
      }

      let addedCanteenTotal = BigInt(0);
      const createdItems = [];

      for (const item of dto.items) {
        const product = await tx.canteenProduct.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Produk ID ${item.productId} tidak ditemukan`,
          );
        }

        if (product.stock < item.qty) {
          throw new BadRequestException(
            `Stok untuk "${product.name}" tidak mencukupi (sisa: ${product.stock}, diminta: ${item.qty})`,
          );
        }

        // Kurangi stok
        await tx.canteenProduct.update({
          where: { id: product.id },
          data: { stock: { decrement: item.qty } },
        });

        const subtotal = product.price * BigInt(item.qty);
        addedCanteenTotal += subtotal;

        if (booking) {
          const order = await tx.canteenOrder.create({
            data: {
              bookingId: booking.id,
              productId: product.id,
              qty: item.qty,
              price: product.price,
              subtotal,
            },
          });
          createdItems.push(order);
        }
      }

      // Update total tagihan booking jika terhubung
      if (booking) {
        const newCanteenTotal = booking.canteenTotal + addedCanteenTotal;
        const newGrandTotal = booking.grandTotal + addedCanteenTotal;
        const newRemainingDue = booking.remainingDue + addedCanteenTotal;

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            canteenTotal: newCanteenTotal,
            grandTotal: newGrandTotal,
            remainingDue: newRemainingDue,
          },
        });
      }

      return {
        success: true,
        bookingCode: dto.bookingCode || null,
        addedTotal: Number(addedCanteenTotal),
        itemsCount: dto.items.length,
      };
    });
  }

  /**
   * Pelunasan sisa sewa lapangan & pesanan kantin di kasir (FR-004).
   */
  async settleBookingAtCashier(dto: SettlementPosDto): Promise<PosReceiptData> {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode: dto.bookingCode },
      include: {
        court: { include: { venue: true } },
        customer: true,
        canteenOrders: { include: { product: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${dto.bookingCode} tidak ditemukan`);
    }

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.EXPIRED
    ) {
      throw new BadRequestException(
        `Booking berstatus ${booking.status} tidak dapat dilunasi di kasir.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Tambah pesanan kantin tambahan jika ada
      let additionalCanteenTotal = BigInt(0);
      const newOrders = [];

      if (dto.additionalItems && dto.additionalItems.length > 0) {
        for (const item of dto.additionalItems) {
          const product = await tx.canteenProduct.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new NotFoundException(
              `Produk ID ${item.productId} tidak ditemukan`,
            );
          }

          if (product.stock < item.qty) {
            throw new BadRequestException(
              `Stok "${product.name}" tidak mencukupi (sisa ${product.stock})`,
            );
          }

          await tx.canteenProduct.update({
            where: { id: product.id },
            data: { stock: { decrement: item.qty } },
          });

          const subtotal = product.price * BigInt(item.qty);
          additionalCanteenTotal += subtotal;

          const order = await tx.canteenOrder.create({
            data: {
              bookingId: booking.id,
              productId: product.id,
              qty: item.qty,
              price: product.price,
              subtotal,
            },
            include: { product: true },
          });
          newOrders.push(order);
        }
      }

      const totalCanteenBigInt = booking.canteenTotal + additionalCanteenTotal;
      const totalGrandBigInt = booking.grandTotal + additionalCanteenTotal;
      const finalDueBigInt = booking.remainingDue + additionalCanteenTotal;
      const finalDueNum = Number(finalDueBigInt);

      // 2. Validasi Pembayaran Tunai & Kembalian
      let cashChange: number | undefined;
      if (dto.paymentMethod === PaymentMethod.CASH_AT_COUNTER) {
        const received = dto.cashReceived ?? finalDueNum;
        if (received < finalDueNum) {
          throw new BadRequestException(
            `Nominal tunai yang diterima (Rp ${received.toLocaleString('id-ID')}) kurang dari total tagihan (Rp ${finalDueNum.toLocaleString('id-ID')})`,
          );
        }
        cashChange = received - finalDueNum;
      }

      // 3. Update status booking menjadi COMPLETED / LUNAS
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.COMPLETED,
          paymentMethod: dto.paymentMethod,
          paidAt: new Date(),
          canteenTotal: totalCanteenBigInt,
          grandTotal: totalGrandBigInt,
          remainingDue: BigInt(0),
        },
        include: {
          court: { include: { venue: true } },
          customer: true,
          canteenOrders: { include: { product: true } },
        },
      });

      const allCanteenOrders = updatedBooking.canteenOrders;
      const startH = booking.startTime.getUTCHours();
      const endH = booking.endTime.getUTCHours();
      const dateStr = booking.bookingDate.toISOString().split('T')[0];

      const receiptData: PosReceiptData = {
        receiptNo: `RCP-${booking.bookingCode}`,
        venueName: booking.court.venue.name,
        venuePhone: booking.court.venue.phone,
        venueAddress: booking.court.venue.address,
        bookingCode: booking.bookingCode,
        customerName: booking.customer.fullName,
        customerPhone: booking.customer.phone,
        courtName: booking.court.name,
        bookingDate: dateStr,
        scheduleTime: `${String(startH).padStart(2, '0')}:00 – ${String(endH).padStart(2, '0')}:00 WIB`,
        courtTotal: Number(booking.courtTotal),
        depositPaid: Number(booking.depositAmount),
        remainingDueBefore: finalDueNum,
        canteenItems: allCanteenOrders.map((o) => ({
          name: o.product.name,
          qty: o.qty,
          price: Number(o.price),
          subtotal: Number(o.subtotal),
        })),
        canteenTotal: Number(totalCanteenBigInt),
        grandTotal: Number(totalGrandBigInt),
        finalSettlementPaid: finalDueNum,
        paymentMethod: dto.paymentMethod,
        cashReceived: dto.cashReceived,
        cashChange,
        settledAt: new Date().toISOString(),
      };

      // Notifikasi WhatsApp Struk Digital
      this.sendDigitalReceiptWhatsApp(receiptData).catch((err: unknown) => {
        this.logger.warn(`Gagal kirim struk WA: ${String(err)}`);
      });

      return receiptData;
    });
  }

  /**
   * Mengambil data struk pelunasan kasir berdasarkan kode booking.
   */
  async getReceipt(bookingCode: string): Promise<PosReceiptData> {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        court: { include: { venue: true } },
        customer: true,
        canteenOrders: { include: { product: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingCode} tidak ditemukan`);
    }

    const startH = booking.startTime.getUTCHours();
    const endH = booking.endTime.getUTCHours();
    const dateStr = booking.bookingDate.toISOString().split('T')[0];

    return {
      receiptNo: `RCP-${booking.bookingCode}`,
      venueName: booking.court.venue.name,
      venuePhone: booking.court.venue.phone,
      venueAddress: booking.court.venue.address,
      bookingCode: booking.bookingCode,
      customerName: booking.customer.fullName,
      customerPhone: booking.customer.phone,
      courtName: booking.court.name,
      bookingDate: dateStr,
      scheduleTime: `${String(startH).padStart(2, '0')}:00 – ${String(endH).padStart(2, '0')}:00 WIB`,
      courtTotal: Number(booking.courtTotal),
      depositPaid: Number(booking.depositAmount),
      remainingDueBefore: Number(booking.remainingDue),
      canteenItems: booking.canteenOrders.map((o) => ({
        name: o.product.name,
        qty: o.qty,
        price: Number(o.price),
        subtotal: Number(o.subtotal),
      })),
      canteenTotal: Number(booking.canteenTotal),
      grandTotal: Number(booking.grandTotal),
      finalSettlementPaid: Number(booking.grandTotal - booking.depositAmount),
      paymentMethod: booking.paymentMethod || 'CASH_AT_COUNTER',
      settledAt: booking.paidAt?.toISOString() || new Date().toISOString(),
    };
  }

  private async sendDigitalReceiptWhatsApp(receipt: PosReceiptData) {
    const canteenList =
      receipt.canteenItems.length > 0
        ? receipt.canteenItems
            .map(
              (i) =>
                `• ${i.name} (${i.qty}x) = Rp ${i.subtotal.toLocaleString('id-ID')}`,
            )
            .join('\n')
        : 'Tidak ada';

    const message =
      `🧾 *STRUK PELUNASAN KASIR RESMI* ⚽\n` +
      `------------------------------------\n` +
      `No. Struk: *${receipt.receiptNo}*\n` +
      `Venue: *${receipt.venueName}*\n` +
      `Lapangan: *${receipt.courtName}*\n` +
      `Jadwal: *${receipt.bookingDate}*, ${receipt.scheduleTime}\n` +
      `Pemesan: *${receipt.customerName}*\n` +
      `\n*Rincian Tagihan:*\n` +
      `• Sewa Lapangan: Rp ${receipt.courtTotal.toLocaleString('id-ID')}\n` +
      `• DP Awal (Lunas): -Rp ${receipt.depositPaid.toLocaleString('id-ID')}\n` +
      `• Kantin & Sewa Alat:\n${canteenList}\n` +
      `------------------------------------\n` +
      `*Total Pelunasan Kasir: Rp ${receipt.finalSettlementPaid.toLocaleString('id-ID')}*\n` +
      `Metode: *${receipt.paymentMethod}*\n` +
      `Status: *LUNAS (COMPLETED)*\n` +
      `\nTerima kasih telah berolahraga bersama ${receipt.venueName}! Sampai jumpa di pertandingan berikutnya! 🏆`;

    await this.whatsAppService.sendRawMessage(receipt.customerPhone, message);
  }
}
