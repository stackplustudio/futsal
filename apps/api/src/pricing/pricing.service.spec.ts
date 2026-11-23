import { PricingService } from './pricing.service';

describe('PricingService — Dynamic Pricing Engine (FR-001)', () => {
  let service: PricingService;

  const weekdayRules = [
    {
      dayType: 'WEEKDAY' as const,
      startHour: 7,
      endHour: 15,
      hourlyRate: BigInt(150_000),
    }, // Siang
    {
      dayType: 'WEEKDAY' as const,
      startHour: 15,
      endHour: 18,
      hourlyRate: BigInt(200_000),
    }, // Sore
    {
      dayType: 'WEEKDAY' as const,
      startHour: 18,
      endHour: 24,
      hourlyRate: BigInt(300_000),
    }, // Malam
  ];

  const weekendRules = [
    {
      dayType: 'WEEKEND' as const,
      startHour: 7,
      endHour: 15,
      hourlyRate: BigInt(200_000),
    },
    {
      dayType: 'WEEKEND' as const,
      startHour: 15,
      endHour: 18,
      hourlyRate: BigInt(250_000),
    },
    {
      dayType: 'WEEKEND' as const,
      startHour: 18,
      endHour: 24,
      hourlyRate: BigInt(350_000),
    },
  ];

  const allRules = [...weekdayRules, ...weekendRules];

  // Senin 23 November 2026 (WEEKDAY)
  const weekdayDate = new Date('2026-11-23T00:00:00Z');
  // Sabtu 28 November 2026 (WEEKEND)
  const weekendDate = new Date('2026-11-28T00:00:00Z');

  beforeEach(() => {
    service = new PricingService();
  });

  // ── resolveDayType ─────────────────────────────────────────────────────────

  describe('resolveDayType', () => {
    it('harus mengembalikan WEEKDAY untuk hari Senin', () => {
      expect(service.resolveDayType(weekdayDate)).toBe('WEEKDAY');
    });

    it('harus mengembalikan WEEKDAY untuk hari Jumat', () => {
      const friday = new Date('2026-11-27T00:00:00Z'); // Jumat
      expect(service.resolveDayType(friday)).toBe('WEEKDAY');
    });

    it('harus mengembalikan WEEKEND untuk hari Sabtu', () => {
      expect(service.resolveDayType(weekendDate)).toBe('WEEKEND');
    });

    it('harus mengembalikan WEEKEND untuk hari Minggu', () => {
      const sunday = new Date('2026-11-29T00:00:00Z'); // Minggu
      expect(service.resolveDayType(sunday)).toBe('WEEKEND');
    });
  });

  // ── calculate ─────────────────────────────────────────────────────────────

  describe('calculate — PRD FR-001 Skenario 1 (kalkulasi tarif proporsional)', () => {
    it('harus menghitung 1 jam Sore (15:00–16:00) weekday = Rp 200.000', () => {
      const result = service.calculate(15, 16, weekdayDate, allRules);
      expect(result.courtTotal).toBe(BigInt(200_000));
      expect(result.breakdown).toHaveLength(1);
    });

    it('harus menghitung 2 jam cross-blok: 17:00–19:00 weekday = Rp 200.000 + Rp 300.000 = Rp 500.000', () => {
      // Skenario 1 PRD: 1 jam sore (Rp 200.000) + 1 jam malam (Rp 300.000)
      const result = service.calculate(17, 19, weekdayDate, allRules);
      expect(result.courtTotal).toBe(BigInt(500_000));
      expect(result.breakdown).toHaveLength(2);
      expect(result.breakdown[0].rate).toBe(BigInt(200_000)); // jam 17 = sore
      expect(result.breakdown[1].rate).toBe(BigInt(300_000)); // jam 18 = malam
    });

    it('harus menghitung 3 jam malam (20:00–23:00) weekday = Rp 900.000', () => {
      const result = service.calculate(20, 23, weekdayDate, allRules);
      expect(result.courtTotal).toBe(BigInt(900_000));
      expect(result.breakdown).toHaveLength(3);
    });

    it('harus menghitung tarif WEEKEND berbeda dari WEEKDAY', () => {
      const weekdayResult = service.calculate(20, 21, weekdayDate, allRules);
      const weekendResult = service.calculate(20, 21, weekendDate, allRules);
      expect(weekendResult.courtTotal).toBeGreaterThan(
        weekdayResult.courtTotal,
      );
      expect(weekdayResult.courtTotal).toBe(BigInt(300_000));
      expect(weekendResult.courtTotal).toBe(BigInt(350_000));
    });

    it('harus menghitung 1 jam Siang WEEKDAY (08:00–09:00) = Rp 150.000', () => {
      const result = service.calculate(8, 9, weekdayDate, allRules);
      expect(result.courtTotal).toBe(BigInt(150_000));
    });

    it('harus melempar Error jika tidak ada rule untuk jam tersebut', () => {
      const rulesHanya18Dst = [
        {
          dayType: 'WEEKDAY' as const,
          startHour: 18,
          endHour: 24,
          hourlyRate: BigInt(300_000),
        },
      ];
      expect(() =>
        service.calculate(15, 16, weekdayDate, rulesHanya18Dst),
      ).toThrow(/Tidak ada aturan tarif untuk jam 15/);
    });

    it('harus melempar Error jika rules kosong', () => {
      expect(() => service.calculate(10, 11, weekdayDate, [])).toThrow(
        /Tidak ada aturan tarif untuk jam 10/,
      );
    });
  });

  // ── calculateDeposit ───────────────────────────────────────────────────────

  describe('calculateDeposit — Perhitungan DP Anti No-Show (FR-002)', () => {
    it('harus menghitung DP 50% dari Rp 300.000 = Rp 150.000', () => {
      expect(service.calculateDeposit(BigInt(300_000), 50)).toBe(
        BigInt(150_000),
      );
    });

    it('harus menghitung DP 50% dari Rp 500.000 = Rp 250.000', () => {
      expect(service.calculateDeposit(BigInt(500_000), 50)).toBe(
        BigInt(250_000),
      );
    });

    it('harus membulatkan DP ke kelipatan 1000 jika tidak genap', () => {
      // 30% dari Rp 150.000 = Rp 45.000 (sudah kelipatan 1000)
      expect(service.calculateDeposit(BigInt(150_000), 30)).toBe(
        BigInt(45_000),
      );
    });

    it('DP 0% harus menghasilkan Rp 0', () => {
      expect(service.calculateDeposit(BigInt(300_000), 0)).toBe(BigInt(0));
    });

    it('DP 100% harus sama dengan grand total', () => {
      expect(service.calculateDeposit(BigInt(300_000), 100)).toBe(
        BigInt(300_000),
      );
    });
  });
});
