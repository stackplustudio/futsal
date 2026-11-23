import { IsInt, IsEnum, Min, Max } from 'class-validator';

export enum DayType {
  WEEKDAY = 'WEEKDAY',
  WEEKEND = 'WEEKEND',
}

export class CreatePricingRuleDto {
  @IsEnum(DayType)
  dayType: DayType;

  @IsInt()
  @Min(0)
  @Max(23)
  startHour: number;

  @IsInt()
  @Min(1)
  @Max(24)
  endHour: number;

  /**
   * Tarif per jam dalam Rupiah bulat (integer).
   * DILARANG menggunakan Float sesuai database-standards.md.
   */
  @IsInt()
  @Min(0)
  hourlyRate: number;
}
