import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class QueryScheduleDto {
  /** Format YYYY-MM-DD */
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date harus berupa format YYYY-MM-DD',
  })
  date: string;
}
