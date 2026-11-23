import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';

describe('WhatsAppService', () => {
  let service: WhatsAppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'WHATSAPP_ENDPOINT_URL') {
                return 'https://api.fonnte.com/send';
              }
              if (key === 'WHATSAPP_API_TOKEN') return 'test-token';
              if (key === 'FRONTEND_URL') return 'http://localhost:3000';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<WhatsAppService>(WhatsAppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizePhone', () => {
    it('should format 08123456789 into 628123456789', () => {
      expect(service.normalizePhone('08123456789')).toBe('628123456789');
    });

    it('should strip leading + from +628123456789', () => {
      expect(service.normalizePhone('+628123456789')).toBe('628123456789');
    });

    it('should remove hyphens and spaces', () => {
      expect(service.normalizePhone('0812-3456 7890')).toBe('6281234567890');
    });

    it('should return empty string for empty input', () => {
      expect(service.normalizePhone('')).toBe('');
    });
  });

  describe('sendBookingConfirmation', () => {
    it('should return true in test environment (mocked dispatch)', async () => {
      const result = await service.sendBookingConfirmation({
        bookingCode: 'BK-TEST-001',
        venueName: 'Champion Arena',
        venueSlug: 'champion-arena',
        courtName: 'Lapangan Vinyl 1',
        bookingDate: '2026-11-25',
        startHour: 19,
        endHour: 21,
        customerName: 'Budi Santoso',
        customerPhone: '08123456789',
        courtTotal: 300000,
        depositAmount: 150000,
        remainingDue: 150000,
        paymentMethod: 'MIDTRANS_QRIS',
        isOpenSparring: true,
        sparringLevel: 'Casual',
      });

      expect(result).toBe(true);
    });

    it('should handle missing venueSlug gracefully', async () => {
      const result = await service.sendBookingConfirmation({
        bookingCode: 'BK-TEST-002',
        venueName: 'Champion Arena',
        courtName: 'Lapangan Rumput Sintetis',
        bookingDate: '2026-11-25',
        startHour: 10,
        endHour: 11,
        customerName: 'Agus',
        customerPhone: '08987654321',
        courtTotal: 150000,
        depositAmount: 75000,
        remainingDue: 75000,
      });

      expect(result).toBe(true);
    });
  });

  describe('sendH4Reminder', () => {
    it('should return true when sending reminder', async () => {
      const result = await service.sendH4Reminder({
        bookingCode: 'BK-TEST-001',
        venueName: 'Champion Arena',
        courtName: 'Lapangan Vinyl 1',
        bookingDate: '2026-11-25',
        startHour: 19,
        endHour: 21,
        customerName: 'Budi Santoso',
        customerPhone: '08123456789',
        courtTotal: 300000,
        depositAmount: 150000,
        remainingDue: 150000,
      });

      expect(result).toBe(true);
    });
  });

  describe('sendRawMessage with fetch mock', () => {
    it('should return false if phone is invalid', async () => {
      const result = await service.sendRawMessage('abc', 'Test');
      expect(result).toBe(false);
    });

    it('should perform real fetch when NODE_ENV is production and token is valid', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: true }),
      });
      global.fetch = mockFetch as unknown as typeof fetch;

      const result = await service.sendRawMessage('08123456789', 'Hello');
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should log error and return false if fetch fails with non-ok response', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Gateway Error'),
      });
      global.fetch = mockFetch as unknown as typeof fetch;

      const result = await service.sendRawMessage('08123456789', 'Hello');
      expect(result).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });

    it('should catch exceptions during fetch and return false', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      global.fetch = jest.fn().mockRejectedValue(new Error('Network offline'));

      const result = await service.sendRawMessage('08123456789', 'Hello');
      expect(result).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });
  });
});
