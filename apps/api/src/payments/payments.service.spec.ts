import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../notifications/whatsapp.service';
import { BookingStatus, PaymentMethod } from '@prisma/client';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: {
    booking: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    customer: {
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let whatsAppService: {
    sendBookingConfirmation: jest.Mock;
    sendH4Reminder: jest.Mock;
  };

  const mockBooking = {
    id: 'booking-1',
    bookingCode: 'BK-TEST-001',
    status: BookingStatus.PENDING_PAYMENT,
    bookingDate: new Date('2026-11-25T00:00:00.000Z'),
    startTime: new Date('2026-11-25T19:00:00.000Z'),
    endTime: new Date('2026-11-25T21:00:00.000Z'),
    durationHours: 2,
    courtTotal: BigInt(300000),
    depositAmount: BigInt(150000),
    remainingDue: BigInt(150000),
    isOpenSparring: true,
    sparringLevel: 'Casual',
    customerId: 'cust-1',
    courtId: 'court-1',
    createdAt: new Date(),
    court: {
      id: 'court-1',
      name: 'Lapangan Vinyl 1',
      venue: {
        id: 'venue-1',
        name: 'Champion Arena',
        slug: 'champion-arena',
      },
    },
    customer: {
      id: 'cust-1',
      fullName: 'Budi Santoso',
      phone: '08123456789',
    },
  };

  beforeEach(async () => {
    prisma = {
      booking: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      customer: {
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    whatsAppService = {
      sendBookingConfirmation: jest.fn().mockResolvedValue(true),
      sendH4Reminder: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: WhatsAppService, useValue: whatsAppService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'MIDTRANS_SERVER_KEY') return 'SB-Mid-server-testkey';
              if (key === 'DEFAULT_DP_HOLD_MINUTES') return '15';
              if (key === 'MIDTRANS_IS_PRODUCTION') return 'false';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSnapToken', () => {
    it('should throw NotFoundException if booking is not found', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.createSnapToken({ bookingCode: 'INVALID-CODE' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if booking is not in PENDING_PAYMENT status', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      await expect(
        service.createSnapToken({ bookingCode: 'BK-TEST-001' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should mark booking EXPIRED and throw BadRequestException if hold time has passed', async () => {
      // Created 20 minutes ago (> 15 minutes)
      const expiredBooking = {
        ...mockBooking,
        createdAt: new Date(Date.now() - 20 * 60 * 1000),
      };
      prisma.booking.findUnique.mockResolvedValue(expiredBooking);
      prisma.booking.update.mockResolvedValue({
        ...expiredBooking,
        status: BookingStatus.EXPIRED,
      });

      await expect(
        service.createSnapToken({ bookingCode: 'BK-TEST-001' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: BookingStatus.EXPIRED },
      });
    });

    it('should return mock snap token in test mode', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      const res = await service.createSnapToken({
        bookingCode: 'BK-TEST-001',
      });

      expect(res.token).toContain('mock-snap-token-BK-TEST-001');
      expect(res.bookingCode).toBe('BK-TEST-001');
      expect(res.depositAmount).toBe(150000);
    });
  });

  describe('handleWebhook', () => {
    it('should confirm booking and trigger WhatsApp on settlement status', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      const res = await service.handleWebhook({
        order_id: 'BK-TEST-001',
        status_code: '200',
        gross_amount: '150000.00',
        signature_key: 'any-sig-in-test',
        transaction_status: 'settlement',
        payment_type: 'qris',
      });

      expect(res.status).toBe('success');
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'booking-1' },
          data: expect.objectContaining({
            status: BookingStatus.CONFIRMED,
            paymentMethod: PaymentMethod.MIDTRANS_QRIS,
          }),
        }),
      );
      expect(whatsAppService.sendBookingConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingCode: 'BK-TEST-001',
          paymentMethod: PaymentMethod.MIDTRANS_QRIS,
        }),
      );
    });

    it('should map bank_transfer to MIDTRANS_VA', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await service.handleWebhook({
        order_id: 'BK-TEST-001',
        status_code: '200',
        gross_amount: '150000.00',
        signature_key: 'test',
        transaction_status: 'capture',
        fraud_status: 'accept',
        payment_type: 'bank_transfer',
      });

      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: BookingStatus.CONFIRMED,
            paymentMethod: PaymentMethod.MIDTRANS_VA,
          }),
        }),
      );
    });

    it('should be idempotent if booking is already confirmed', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      const res = await service.handleWebhook({
        order_id: 'BK-TEST-001',
        status_code: '200',
        gross_amount: '150000.00',
        signature_key: 'test',
        transaction_status: 'settlement',
      });

      expect(res.status).toBe('success');
      expect(res.message).toContain('sudah terkonfirmasi');
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('should mark booking as EXPIRED when transaction_status is expire', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      const res = await service.handleWebhook({
        order_id: 'BK-TEST-001',
        status_code: '200',
        gross_amount: '150000.00',
        signature_key: 'test',
        transaction_status: 'expire',
      });

      expect(res.status).toBe('success');
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: BookingStatus.EXPIRED },
      });
    });

    it('should mark booking as CANCELLED when transaction_status is cancel or deny', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      const res = await service.handleWebhook({
        order_id: 'BK-TEST-001',
        status_code: '200',
        gross_amount: '150000.00',
        signature_key: 'test',
        transaction_status: 'cancel',
      });

      expect(res.status).toBe('success');
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: BookingStatus.CANCELLED },
      });
    });

    it('should throw NotFoundException if booking not found on webhook', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.handleWebhook({
          order_id: 'UNKNOWN',
          status_code: '200',
          gross_amount: '100000.00',
          signature_key: 'test',
          transaction_status: 'settlement',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPaymentStatus', () => {
    it('should return booking payment status', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        bookingCode: 'BK-TEST-001',
        status: BookingStatus.CONFIRMED,
        paidAt: new Date(),
        paymentMethod: PaymentMethod.MIDTRANS_QRIS,
        courtTotal: BigInt(300000),
        depositAmount: BigInt(150000),
        remainingDue: BigInt(150000),
      });

      const res = await service.getPaymentStatus('BK-TEST-001');
      expect(res.bookingCode).toBe('BK-TEST-001');
      expect(res.status).toBe(BookingStatus.CONFIRMED);
      expect(res.depositAmount).toBe(150000);
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(service.getPaymentStatus('UNKNOWN')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('triggerH4Reminder', () => {
    it('should send H-4 reminder for valid booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      const res = await service.triggerH4Reminder('BK-TEST-001');
      expect(res.success).toBe(true);
      expect(whatsAppService.sendH4Reminder).toHaveBeenCalled();
    });

    it('should throw NotFoundException if booking not found', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(service.triggerH4Reminder('UNKNOWN')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('calculateSignature', () => {
    it('should compute valid sha512 hash', () => {
      const hash = service.calculateSignature(
        'BK-001',
        '200',
        '100000.00',
        'test-secret',
      );
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(128); // SHA-512 hex is 128 characters
    });
  });
});
