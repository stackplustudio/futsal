import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;

  const mockReportsService = {
    getOccupancyReport: jest.fn(),
    getRevenueReport: jest.fn(),
    getCashierShifts: jest.fn(),
    closeShift: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getOccupancyReport on GET /reports/occupancy', async () => {
    mockReportsService.getOccupancyReport.mockResolvedValue({ success: true });
    await controller.getOccupancy('venue-01', 'today');
    expect(mockReportsService.getOccupancyReport).toHaveBeenCalledWith(
      'venue-01',
      'today',
    );
  });

  it('should call getRevenueReport on GET /reports/revenue', async () => {
    mockReportsService.getRevenueReport.mockResolvedValue({ success: true });
    await controller.getRevenue('venue-01', '7days');
    expect(mockReportsService.getRevenueReport).toHaveBeenCalledWith(
      'venue-01',
      '7days',
    );
  });

  it('should call getCashierShifts on GET /reports/cashier-shifts', async () => {
    mockReportsService.getCashierShifts.mockResolvedValue([]);
    await controller.getCashierShifts('venue-01');
    expect(mockReportsService.getCashierShifts).toHaveBeenCalledWith(
      'venue-01',
    );
  });

  it('should call closeShift on POST /reports/shifts/close', async () => {
    const dto = {
      venueId: 'venue-01',
      openedById: 'user-01',
      startingCash: 100000,
      actualCashEnding: 100000,
    };
    mockReportsService.closeShift.mockResolvedValue({ success: true });
    await controller.closeShift(dto);
    expect(mockReportsService.closeShift).toHaveBeenCalledWith(dto);
  });
});
