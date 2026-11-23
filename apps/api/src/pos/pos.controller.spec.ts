import { Test, TestingModule } from '@nestjs/testing';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PaymentMethod } from '@prisma/client';

describe('PosController', () => {
  let controller: PosController;
  let service: {
    getCanteenProducts: jest.Mock;
    createCanteenOrder: jest.Mock;
    settleBookingAtCashier: jest.Mock;
    getReceipt: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getCanteenProducts: jest.fn().mockResolvedValue({
        venue: { id: 'v1', name: 'Champion Arena' },
        products: [],
      }),
      createCanteenOrder: jest.fn().mockResolvedValue({
        success: true,
        addedTotal: 20000,
      }),
      settleBookingAtCashier: jest.fn().mockResolvedValue({
        receiptNo: 'RCP-BK-001',
        finalSettlementPaid: 150000,
      }),
      getReceipt: jest.fn().mockResolvedValue({
        receiptNo: 'RCP-BK-001',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosController],
      providers: [{ provide: PosService, useValue: service }],
    }).compile();

    controller = module.get<PosController>(PosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getCanteenProducts should call service', async () => {
    const res = await controller.getCanteenProducts('champion-arena');
    expect(service.getCanteenProducts).toHaveBeenCalledWith('champion-arena');
    expect(res.venue.name).toBe('Champion Arena');
  });

  it('createCanteenOrder should call service', async () => {
    const dto = {
      venueSlug: 'champion-arena',
      items: [{ productId: 'p1', qty: 2 }],
    };
    const res = await controller.createCanteenOrder(dto);
    expect(service.createCanteenOrder).toHaveBeenCalledWith(dto);
    expect(res.success).toBe(true);
  });

  it('settleBookingAtCashier should call service', async () => {
    const dto = {
      bookingCode: 'BK-001',
      paymentMethod: PaymentMethod.CASH_AT_COUNTER,
    };
    const res = await controller.settleBookingAtCashier(dto);
    expect(service.settleBookingAtCashier).toHaveBeenCalledWith(dto);
    expect(res.receiptNo).toBe('RCP-BK-001');
  });

  it('getReceipt should call service', async () => {
    const res = await controller.getReceipt('BK-001');
    expect(service.getReceipt).toHaveBeenCalledWith('BK-001');
    expect(res.receiptNo).toBe('RCP-BK-001');
  });
});
