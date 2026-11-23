import { Test, TestingModule } from '@nestjs/testing';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

describe('MembersController', () => {
  let controller: MembersController;
  let service: {
    createContract: jest.Mock;
    listContracts: jest.Mock;
    cancelContract: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createContract: jest.fn().mockResolvedValue({
        contractId: 'c-1',
        teamName: 'Anak Futsal',
        totalSlotsLocked: 4,
      }),
      listContracts: jest
        .fn()
        .mockResolvedValue([{ id: 'c-1', teamName: 'Anak Futsal' }]),
      cancelContract: jest.fn().mockResolvedValue({
        success: true,
        message: 'Kontrak dibatalkan.',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembersController],
      providers: [{ provide: MembersService, useValue: service }],
    }).compile();

    controller = module.get<MembersController>(MembersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createContract should delegate to service', async () => {
    const dto = {
      venueSlug: 'champion-arena',
      courtId: 'court-1',
      customerName: 'Budi',
      customerPhone: '08123',
      teamName: 'Anak Futsal',
      dayOfWeek: 4,
      startHour: 20,
      durationHours: 2,
      startDate: '2026-12-01',
      monthsDuration: 1,
      monthlyFee: 1000000,
    };
    const res = await controller.createContract(dto);
    expect(service.createContract).toHaveBeenCalledWith(dto);
    expect(res.contractId).toBe('c-1');
  });

  it('listContracts should delegate to service', async () => {
    const res = await controller.listContracts('champion-arena');
    expect(service.listContracts).toHaveBeenCalledWith('champion-arena');
    expect(res.length).toBe(1);
  });

  it('cancelContract should delegate to service', async () => {
    const res = await controller.cancelContract('c-1');
    expect(service.cancelContract).toHaveBeenCalledWith('c-1');
    expect(res.success).toBe(true);
  });
});
