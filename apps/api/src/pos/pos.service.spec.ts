import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PosService } from './pos.service';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../notifications/whatsapp.service';
import { BookingStatus, PaymentMethod } from '@prisma/client';

describe('PosService', () => {
  let service: PosService;
  let prisma: {
    venue: { findFirst: jest.Mock };
    canteenProduct: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    canteenOrder: { create: jest.Mock };
    booking: { findUnique: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };
  let whatsAppService: { sendRawMessage: jest.Mock };

  const mockVenue = {
    id: 'venue-1',
    name: 'Champion Arena',
    slug: 'champion-arena',
    phone: '08123456789',
    address: 'Jl. Prof. Soedarto No. 12',
  };

  const mockProduct = {
    id: 'prod-1',
    sku: 'BEV-POC-500',
    name: 'Pocari Sweat 500ml',
    category: 'BEVERAGE',
    price: BigInt(10000),
    costPrice: BigInt(6500),
    stock: 50,
  };

  const mockBooking = {
    id: 'bk-1',
    bookingCode: 'BK-FUT-2611-042',
    status: BookingStatus.CONFIRMED,
    courtTotal: BigInt(300000),
    canteenTotal: BigInt(0),
    grandTotal: BigInt(300000),
    depositAmount: BigInt(150000),
    remainingDue: BigInt(150000),
    bookingDate: new Date('2026-11-25T00:00:00.000Z'),
    startTime: new Date('2026-11-25T19:00:00.000Z'),
    endTime: new Date('2026-11-25T21:00:00.000Z'),
    court: { name: 'Lapangan 1 - Vinyl Pro', venue: mockVenue },
    customer: { fullName: 'Budi Santoso', phone: '08123456789' },
    canteenOrders: [],
  };

  beforeEach(async () => {
    prisma = {
      venue: { findFirst: jest.fn() },
      canteenProduct: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      canteenOrder: { create: jest.fn() },
      booking: { findUnique: jest.fn(), update: jest.fn() },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    whatsAppService = {
      sendRawMessage: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        { provide: PrismaService, useValue: prisma },
        { provide: WhatsAppService, useValue: whatsAppService },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCanteenProducts', () => {
    it('should return products list for valid venue', async () => {
      prisma.venue.findFirst.mockResolvedValue(mockVenue);
      prisma.canteenProduct.findMany.mockResolvedValue([mockProduct]);

      const result = await service.getCanteenProducts('champion-arena');
      expect(result.venue.name).toBe('Champion Arena');
      expect(result.products.length).toBe(1);
      expect(result.products[0].price).toBe(10000);
    });

    it('should throw NotFoundException if venue not found', async () => {
      prisma.venue.findFirst.mockResolvedValue(null);
      await expect(service.getCanteenProducts('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createCanteenOrder', () => {
    it('should throw BadRequestException for empty items array', async () => {
      await expect(
        service.createCanteenOrder({ venueSlug: 'champion-arena', items: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if venue not found', async () => {
      prisma.venue.findFirst.mockResolvedValue(null);
      await expect(
        service.createCanteenOrder({
          venueSlug: 'unknown',
          items: [{ productId: 'p1', qty: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create order, decrement stock, and update booking', async () => {
      prisma.venue.findFirst.mockResolvedValue(mockVenue);
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.canteenProduct.findUnique.mockResolvedValue(mockProduct);
      prisma.canteenProduct.update.mockResolvedValue({
        ...mockProduct,
        stock: 48,
      });
      prisma.canteenOrder.create.mockResolvedValue({ id: 'co-1' });
      prisma.booking.update.mockResolvedValue({ ...mockBooking });

      const res = await service.createCanteenOrder({
        venueSlug: 'champion-arena',
        bookingCode: 'BK-FUT-2611-042',
        items: [{ productId: 'prod-1', qty: 2 }],
      });

      expect(res.success).toBe(true);
      expect(res.addedTotal).toBe(20000);
      expect(prisma.canteenProduct.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stock: { decrement: 2 } },
      });
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'bk-1' },
        data: {
          canteenTotal: BigInt(20000),
          grandTotal: BigInt(320000),
          remainingDue: BigInt(170000),
        },
      });
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      prisma.venue.findFirst.mockResolvedValue(mockVenue);
      prisma.canteenProduct.findUnique.mockResolvedValue({
        ...mockProduct,
        stock: 1,
      });

      await expect(
        service.createCanteenOrder({
          venueSlug: 'champion-arena',
          items: [{ productId: 'prod-1', qty: 5 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('settleBookingAtCashier', () => {
    it('should settle booking with cash, calculate change, and send receipt', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.COMPLETED,
        paymentMethod: PaymentMethod.CASH_AT_COUNTER,
        remainingDue: BigInt(0),
        canteenOrders: [],
      });

      const res = await service.settleBookingAtCashier({
        bookingCode: 'BK-FUT-2611-042',
        paymentMethod: PaymentMethod.CASH_AT_COUNTER,
        cashReceived: 200000,
      });

      expect(res.finalSettlementPaid).toBe(150000);
      expect(res.cashReceived).toBe(200000);
      expect(res.cashChange).toBe(50000);
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: BookingStatus.COMPLETED,
            remainingDue: BigInt(0),
          }),
        }),
      );
      expect(whatsAppService.sendRawMessage).toHaveBeenCalled();
    });

    it('should throw BadRequestException if cash received is less than due', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.settleBookingAtCashier({
          bookingCode: 'BK-FUT-2611-042',
          paymentMethod: PaymentMethod.CASH_AT_COUNTER,
          cashReceived: 100000, // Less than remainingDue (150000)
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if booking is cancelled or expired', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      await expect(
        service.settleBookingAtCashier({
          bookingCode: 'BK-FUT-2611-042',
          paymentMethod: PaymentMethod.CASH_AT_COUNTER,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getReceipt', () => {
    it('should return receipt details for valid booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        paidAt: new Date(),
        paymentMethod: PaymentMethod.CASH_AT_COUNTER,
      });

      const res = await service.getReceipt('BK-FUT-2611-042');
      expect(res.receiptNo).toBe('RCP-BK-FUT-2611-042');
      expect(res.courtTotal).toBe(300000);
      expect(res.depositPaid).toBe(150000);
    });

    it('should throw NotFoundException for unknown booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.getReceipt('UNKNOWN')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
