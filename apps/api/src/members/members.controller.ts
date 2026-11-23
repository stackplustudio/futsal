import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberContractDto } from './dto/create-member-contract.dto';

@Controller('public/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  /**
   * Membuat kontrak member rutin dan mengunci slot kalender secara otomatis.
   */
  @Post('contracts')
  @HttpCode(HttpStatus.CREATED)
  createContract(@Body() dto: CreateMemberContractDto) {
    return this.membersService.createContract(dto);
  }

  /**
   * Mengambil daftar kontrak member aktif pada venue tertentu.
   */
  @Get('contracts')
  listContracts(@Query('venueSlug') venueSlug: string) {
    return this.membersService.listContracts(venueSlug);
  }

  /**
   * Membatalkan kontrak member rutin.
   */
  @Delete('contracts/:id')
  @HttpCode(HttpStatus.OK)
  cancelContract(@Param('id') id: string) {
    return this.membersService.cancelContract(id);
  }
}
