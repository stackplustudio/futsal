import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: {
    createSnapToken: jest.Mock;
    handleWebhook: jest.Mock;
    getPaymentStatus: jest.Mock;
    triggerH4Reminder: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createSnapToken: jest.fn().mockResolvedValue({
        token: 'snap-token-123',
        redirectUrl: 'https://app.midtrans.com/pay',
        bookingCode: 'BK-TEST-001',
        depositAmount: 150000,
      }),
      handleWebhook: jest.fn().mockResolvedValue({
        status: 'success',
        message: 'Pembayaran DP berhasil dikonfirmasi.',
      }),
      getPaymentStatus: jest.fn().mockResolvedValue({
        bookingCode: 'BK-TEST-001',
        status: 'CONFIRMED',
      }),
      triggerH4Reminder: jest.fn().mockResolvedValue({
        success: true,
        bookingCode: 'BK-TEST-001',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: service }],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createSnapToken should call service.createSnapToken', async () => {
    const dto = { bookingCode: 'BK-TEST-001' };
    const res = await controller.createSnapToken(dto);
    expect(service.createSnapToken).toHaveBeenCalledWith(dto);
    expect(res.token).toBe('snap-token-123');
  });

  it('handleMidtransWebhook should call service.handleWebhook', async () => {
    const dto = {
      order_id: 'BK-TEST-001',
      status_code: '200',
      gross_amount: '150000.00',
      signature_key: 'sig',
      transaction_status: 'settlement',
    };
    const res = await controller.handleMidtransWebhook(dto);
    expect(service.handleWebhook).toHaveBeenCalledWith(dto);
    expect(res.status).toBe('success');
  });

  it('getPaymentStatus should call service.getPaymentStatus', async () => {
    const res = await controller.getPaymentStatus('BK-TEST-001');
    expect(service.getPaymentStatus).toHaveBeenCalledWith('BK-TEST-001');
    expect(res.status).toBe('CONFIRMED');
  });

  it('triggerH4Reminder should call service.triggerH4Reminder', async () => {
    const res = await controller.triggerH4Reminder('BK-TEST-001');
    expect(service.triggerH4Reminder).toHaveBeenCalledWith('BK-TEST-001');
    expect(res.success).toBe(true);
  });
});
