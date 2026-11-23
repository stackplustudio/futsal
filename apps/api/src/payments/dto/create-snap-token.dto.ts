import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSnapTokenDto {
  @IsString()
  @IsNotEmpty()
  bookingCode!: string;
}
