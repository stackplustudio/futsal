import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CloseShiftDto {
  @IsString()
  @IsNotEmpty()
  venueId!: string;

  @IsString()
  @IsNotEmpty()
  openedById!: string;

  @IsString()
  @IsOptional()
  closedById?: string;

  @IsNumber()
  @IsNotEmpty()
  startingCash!: number; // Kas awal laci kasir

  @IsNumber()
  @IsNotEmpty()
  actualCashEnding!: number; // Uang fisik aktual saat tutup

  @IsString()
  @IsOptional()
  notes?: string;
}
