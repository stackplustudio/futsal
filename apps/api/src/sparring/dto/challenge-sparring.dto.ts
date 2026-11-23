import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ChallengeSparringDto {
  @IsString()
  @IsNotEmpty()
  challengerTeamName!: string;

  @IsString()
  @IsNotEmpty()
  challengerCaptainName!: string;

  @IsString()
  @IsNotEmpty()
  challengerPhone!: string;

  @IsBoolean()
  @IsNotEmpty()
  consentGiven!: boolean; // Persetujuan pertukaran kontak resmi (UU PDP)
}
