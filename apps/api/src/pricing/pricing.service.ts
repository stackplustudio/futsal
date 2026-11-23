import { Injectable } from '@nestjs/common';

/**
 * PricingService — Dynamic Pricing Engine (FR-001)
 *
 * Kalkulasi tarif sewa lapangan secara proporsional berdasarkan:
 * - Blok jam (siang/sore/malam)
 * - Jenis hari (WEEKDAY / WEEKEND)
 *
 * Coverage target: > 85% (sesuai PRD NFR 8.1)
 */
export interface PricingRule {
  dayType: 'WEEKDAY' | 'WEEKEND';
  startHour: number;
  endHour: number;
  hourlyRate: bigint;
}

export interface PricingResult {
  /** Total tarif sewa lapangan dalam Rupiah (integer) */
  courtTotal: bigint;
  /** Rincian per blok jam */
  breakdown: Array<{
    hour: number;
    ruleApplied: string;
    rate: bigint;
  }>;
}

@Injectable()
export class PricingService {
  /**
   * Hitung total sewa lapangan secara proporsional per jam.
   *
   * @param startHour - Jam mulai sewa (inklusif), misal 17
   * @param endHour   - Jam selesai sewa (eksklusif), misal 19 → 2 jam
   * @param bookingDate - Tanggal pemesanan (UTC)
   * @param rules     - Daftar aturan tarif dari database
   * @returns PricingResult dengan courtTotal dan breakdown
   * @throws Error jika tidak ada rule yang mencakup salah satu jam sewa
   */
  calculate(
    startHour: number,
    endHour: number,
    bookingDate: Date,
    rules: PricingRule[],
  ): PricingResult {
    const dayType = this.resolveDayType(bookingDate);
    const applicableRules = rules.filter((r) => r.dayType === dayType);

    let courtTotal = BigInt(0);
    const breakdown: PricingResult['breakdown'] = [];

    for (let hour = startHour; hour < endHour; hour++) {
      const rule = applicableRules.find(
        (r) => r.startHour <= hour && r.endHour > hour,
      );

      if (!rule) {
        throw new Error(
          `Tidak ada aturan tarif untuk jam ${hour}:00 pada hari ${dayType}. ` +
            'Pastikan venue telah mengatur aturan tarif yang mencakup semua jam operasional.',
        );
      }

      courtTotal += rule.hourlyRate;
      breakdown.push({
        hour,
        ruleApplied: `${dayType} ${rule.startHour}:00–${rule.endHour}:00`,
        rate: rule.hourlyRate,
      });
    }

    return { courtTotal, breakdown };
  }

  /**
   * Tentukan apakah tanggal adalah WEEKDAY atau WEEKEND.
   * Sabtu (6) dan Minggu (0) adalah WEEKEND.
   * TODO: Tambahkan pengecekan tanggal merah nasional (Fase 2).
   */
  resolveDayType(date: Date): 'WEEKDAY' | 'WEEKEND' {
    const day = date.getUTCDay(); // 0 = Minggu, 6 = Sabtu
    return day === 0 || day === 6 ? 'WEEKEND' : 'WEEKDAY';
  }

  /**
   * Hitung jumlah wajib DP berdasarkan persentase atau nilai flat.
   *
   * @param grandTotal - Total tarif sewa lapangan
   * @param dpPercent  - Persentase DP venue (misal 50)
   * @returns Nilai DP yang harus dibayar (pembulatan ke atas ke 1000)
   */
  calculateDeposit(grandTotal: bigint, dpPercent: number): bigint {
    const raw = (grandTotal * BigInt(dpPercent)) / BigInt(100);
    // Bulatkan ke kelipatan 1000 terdekat
    const remainder = raw % BigInt(1000);
    return remainder === BigInt(0) ? raw : raw + (BigInt(1000) - remainder);
  }
}
