import { Module } from '@nestjs/common';
import { SparringService } from './sparring.service';
import { SparringController } from './sparring.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SparringController],
  providers: [SparringService],
  exports: [SparringService],
})
export class SparringModule {}
