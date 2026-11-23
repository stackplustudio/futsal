import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { VenuesService } from './venues.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

/**
 * VenuesController
 *
 * Semua endpoint dilindungi JwtAuthGuard + RolesGuard.
 * Data difilter ketat per tenantId (isolasi multi-tenant).
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  /** VENUE_OWNER / SUPER_ADMIN: buat venue baru */
  @Roles('VENUE_OWNER', 'SUPER_ADMIN', 'ADMIN')
  @Post()
  create(@Body() dto: CreateVenueDto, @CurrentUser() user: AuthUser) {
    const tenantId = this.resolveTenantId(user);
    return this.venuesService.create(tenantId, dto);
  }

  /** VENUE_OWNER / VENUE_MANAGER / SUPER_ADMIN: daftar venue tenant */
  @Roles('VENUE_OWNER', 'VENUE_MANAGER', 'SUPER_ADMIN', 'ADMIN')
  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const tenantId = this.resolveTenantId(user);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return this.venuesService.findAll(tenantId, pageNum, limitNum);
  }

  /** VENUE_OWNER / VENUE_MANAGER / SUPER_ADMIN: detail venue + daftar courts */
  @Roles('VENUE_OWNER', 'VENUE_MANAGER', 'SUPER_ADMIN', 'ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const tenantId = this.resolveTenantId(user);
    return this.venuesService.findOne(tenantId, id);
  }

  /** VENUE_OWNER / SUPER_ADMIN: perbarui venue */
  @Roles('VENUE_OWNER', 'SUPER_ADMIN', 'ADMIN')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVenueDto,
    @CurrentUser() user: AuthUser,
  ) {
    const tenantId = this.resolveTenantId(user);
    return this.venuesService.update(tenantId, id, dto);
  }

  /** VENUE_OWNER / SUPER_ADMIN: hapus logis (soft delete) venue */
  @Roles('VENUE_OWNER', 'SUPER_ADMIN', 'ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const tenantId = this.resolveTenantId(user);
    return this.venuesService.remove(tenantId, id);
  }

  private resolveTenantId(user: AuthUser): string {
    if (!user.tenantId) {
      throw new Error('User tidak memiliki tenantId. Hubungi administrator.');
    }
    return user.tenantId;
  }
}
