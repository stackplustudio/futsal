import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsBoolean } from 'class-validator';
import { CreateVenueDto } from './create-venue.dto';

export class UpdateVenueDto extends PartialType(CreateVenueDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
