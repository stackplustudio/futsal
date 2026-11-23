import { Test, TestingModule } from '@nestjs/testing';
import { SparringController } from './sparring.controller';
import { SparringService } from './sparring.service';

describe('SparringController', () => {
  let controller: SparringController;

  const mockSparringService = {
    getOpenSparrings: jest.fn(),
    toggleSparring: jest.fn(),
    challengeSparring: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SparringController],
      providers: [
        {
          provide: SparringService,
          useValue: mockSparringService,
        },
      ],
    }).compile();

    controller = module.get<SparringController>(SparringController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getOpenSparrings on GET /sparring', async () => {
    mockSparringService.getOpenSparrings.mockResolvedValue([]);
    await controller.getOpenSparrings('champion-arena', 'Casual');
    expect(mockSparringService.getOpenSparrings).toHaveBeenCalledWith(
      'champion-arena',
      'Casual',
    );
  });

  it('should call toggleSparring on PATCH /bookings/:id/sparring', async () => {
    mockSparringService.toggleSparring.mockResolvedValue({ success: true });
    await controller.toggleSparring('bk-01', {
      isOpenSparring: true,
      sparringLevel: 'Casual',
    });
    expect(mockSparringService.toggleSparring).toHaveBeenCalledWith('bk-01', {
      isOpenSparring: true,
      sparringLevel: 'Casual',
    });
  });

  it('should call challengeSparring on POST /sparring/:bookingId/challenge', async () => {
    const dto = {
      challengerTeamName: 'Tim A',
      challengerCaptainName: 'Kapten A',
      challengerPhone: '08123',
      consentGiven: true,
    };
    mockSparringService.challengeSparring.mockResolvedValue({ success: true });
    await controller.challengeSparring('bk-01', dto);
    expect(mockSparringService.challengeSparring).toHaveBeenCalledWith(
      'bk-01',
      dto,
    );
  });
});
