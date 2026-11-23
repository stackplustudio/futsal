import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateMemberContractDto {
  @IsString()
  @IsNotEmpty()
  venueSlug!: string;

  @IsString()
  @IsNotEmpty()
  courtId!: string;

  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsString()
  @IsNotEmpty()
  customerPhone!: string;

  @IsString()
  @IsNotEmpty()
  teamName!: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number; // 0 = Minggu, 1 = Senin, ..., 4 = Kamis, ..., 6 = Sabtu

  @IsInt()
  @Min(0)
  @Max(23)
  startHour!: number; // e.g. 20

  @IsInt()
  @Min(1)
  @Max(4)
  durationHours!: number; // e.g. 2

  @IsString()
  @IsNotEmpty()
  startDate!: string; // YYYY-MM-DD

  @IsInt()
  @Min(1)
  @Max(6)
  monthsDuration!: number; // 1 s.d. 6 bulan

  @IsNumber()
  @Min(0)
  monthlyFee!: number;
}
