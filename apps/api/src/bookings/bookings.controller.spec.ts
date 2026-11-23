import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

describe('BookingsController (Unit Tests)', () => {
  let controller: BookingsController;
  let service: jest.Mocked<BookingsService>;

  beforeEach(async () => {
    const mockService = {
      getVenueSchedule: jest.fn(),
      createPublicBooking: jest.fn(),
      getBookingByCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: mockService }],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get(BookingsService);
  });

  it('getVenueSchedule harus meneruskan ke service.getVenueSchedule', async () => {
    service.getVenueSchedule.mockResolvedValue({} as any);
    await controller.getVenueSchedule('champion-arena', { date: '2026-11-23' });
    expect(service.getVenueSchedule).toHaveBeenCalledWith(
      'champion-arena',
      '2026-11-23',
    );
  });

  it('createPublicBooking harus meneruskan ke service.createPublicBooking', async () => {
    const dto = {
      venueSlug: 'champion-arena',
      courtId: 'c1',
      bookingDate: '2026-11-23',
      startHour: 19,
      durationHours: 2,
      customerName: 'Budi',
      customerPhone: '081234567890',
    };
    service.createPublicBooking.mockResolvedValue({ bookingId: 'b1' } as any);

    const result = await controller.createPublicBooking(dto);
    expect(result.bookingId).toBe('b1');
    expect(service.createPublicBooking).toHaveBeenCalledWith(dto);
  });

  it('getBookingByCode harus meneruskan ke service.getBookingByCode', async () => {
    service.getBookingByCode.mockResolvedValue({ bookingCode: 'BK-1' } as any);
    const result = await controller.getBookingByCode('BK-1');
    expect(result.bookingCode).toBe('BK-1');
    expect(service.getBookingByCode).toHaveBeenCalledWith('BK-1');
  });
});
