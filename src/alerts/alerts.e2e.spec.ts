import { INestApplication, HttpStatus } from '@nestjs/common';
import { createTestApp } from '@/utils/app';
import { createTestUser } from '@/utils/user';
import { CreateAlertDto } from './dto/create-alert.dto';
import request from 'supertest';
import { Alert } from './entities/alert.entity';
import { WsStocksData } from '@/stocks/dto/get-stocks.dto';
import { AlertsController } from './alerts.controller';
import { StocksGateway } from '@/stocks/stocks.gateway';
import {
  FirebaseService,
  NotificationMessage,
} from '@/firebase/firebase.service';
import waitForExpect from 'wait-for-expect';
import { BatchResponse } from 'firebase-admin/messaging';

describe('AlertsModule', () => {
  let app: INestApplication;
  let accessToken: string;
  let stocksGateway: StocksGateway;
  let firebaseService: FirebaseService;

  beforeEach(async () => {
    app = await createTestApp();
    await app.init();
    accessToken = await createTestUser(app, { fcmToken: 'test-fcm-token' });
    stocksGateway = app.get(StocksGateway);
    firebaseService = app.get(FirebaseService);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  const createAlert = async (dto: CreateAlertDto, token = accessToken) => {
    return request(app.getHttpServer())
      .post('/alerts')
      .set('Authorization', `Bearer ${token}`)
      .send(dto);
  };

  const deleteAlert = async (id: number, token = accessToken) => {
    return request(app.getHttpServer())
      .delete(`/alerts/${id}`)
      .set('Authorization', `Bearer ${token}`);
  };

  const getUserAlerts = async (token = accessToken) => {
    return request(app.getHttpServer())
      .get('/alerts')
      .set('Authorization', `Bearer ${token}`);
  };

  it('should create an alert', async () => {
    const res = await createAlert({ price: 100, stock: 'AAPL' });
    expect(res.ok).toBeTruthy();
    const body = res.body as Alert;
    expect(body.id).toBeDefined();
  });

  it('should get user alerts', async () => {
    const alerts: CreateAlertDto[] = [
      { price: 100, stock: 'AAPL1' },
      { price: 100, stock: 'AAPL2' },
      { price: 100, stock: 'AAPL3' },
    ];
    await Promise.all(alerts.map((alert) => createAlert(alert)));
    const res = await getUserAlerts();
    expect(res.ok).toBeTruthy();
    const body = res.body as Alert[];
    expect(body.length).toBe(alerts.length);
    alerts.forEach((alert) => {
      expect(
        body.some((i) => i.stock === alert.stock && i.price === alert.price),
      ).toBeTruthy();
    });
  });

  it('should delete an alert', async () => {
    const res = await createAlert({ price: 100, stock: 'AAPL' });
    const body = res.body as Alert;
    const alertId = body.id;
    const deleteRes = await deleteAlert(alertId);
    expect(deleteRes.ok).toBeTruthy();
    const alertsRes = await getUserAlerts();
    expect(alertsRes.ok).toBeTruthy();
    const alerts = alertsRes.body as Alert[];
    const deletedAlert = alerts.find((i) => i.id === alertId);
    expect(deletedAlert).toBeUndefined();
  });

  it('should not delete an alert from another user', async () => {
    const otherUser = await createTestUser(app);
    const res = await createAlert({ price: 100, stock: 'AAPL' }, otherUser);
    const otherUserAlertId = (res.body as Alert).id;

    const deleteRes = await request(app.getHttpServer())
      .delete(`/alerts/${otherUserAlertId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(deleteRes.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should not delete an alert if not authenticated', async () => {
    const res = await createAlert({ price: 100, stock: 'AAPL' });
    const alertId = (res.body as Alert).id;
    const deleteRes = await request(app.getHttpServer()).delete(
      `/alerts/${alertId}`,
    );
    expect(deleteRes.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should not get an alert if not authenticated', async () => {
    const res = await request(app.getHttpServer()).get(`/alerts`);
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should not create an alert if not authenticated', async () => {
    const res = await request(app.getHttpServer())
      .post(`/alerts`)
      .send({ price: 100, stock: 'AAPL' });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should handle trade update event', () => {
    const tradeUpdate: WsStocksData = {
      type: 'trade',
      data: [{ p: 100, s: 'AAPL', t: 1, v: 1 }],
    };
    const spy = jest.spyOn(AlertsController.prototype, 'handleTradeUpdate');
    stocksGateway.handleMessage(tradeUpdate);
    expect(spy).toHaveBeenCalledWith(tradeUpdate);
  });

  it('should send notification when trade update matches alert and mark as notified', async () => {
    (firebaseService.sendNotification as jest.Mock).mockResolvedValueOnce({
      failureCount: 0,
      successCount: 1,
      responses: [{ success: true, messageId: '1' }],
    } satisfies BatchResponse);

    const alert = { price: 100, stock: 'AAPL' };
    await createAlert(alert);
    const update = { p: 150, s: 'AAPL', t: 1, v: 1 };
    const tradeUpdate: WsStocksData = {
      type: 'trade',
      data: [update],
    };

    let spy: jest.SpyInstance = jest.spyOn(
      AlertsController.prototype,
      'handleTradeUpdate',
    );
    stocksGateway.handleMessage(tradeUpdate);
    expect(spy).toHaveBeenCalledWith(tradeUpdate);
    spy = jest.spyOn(firebaseService, 'sendNotification');
    await waitForExpect(() => {
      expect(spy).toHaveBeenCalledWith([
        {
          to: 'test-fcm-token',
          title: 'Trade Alert',
          body: `The stock ${alert.stock} has reached your target price of $${alert.price}`,
        } satisfies NotificationMessage,
      ]);
    });
    const alerts = await getUserAlerts();
    expect(alerts.ok).toBeTruthy();
    const body = alerts.body as Alert[];
    expect(body.length).toBeGreaterThan(0);
    const notifiedAlert = body.find((a) => a.stock === alert.stock);
    expect(notifiedAlert).toBeDefined();
    expect(notifiedAlert!.notifiedAt).not.toBeNull();
  });

  it("should return not found when try to delete an alert that doesn't exist", async () => {
    const response = await deleteAlert(999);
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should allow create alert with decimal', async () => {
    const alert = { price: 100.523, stock: 'AAPL' };
    await createAlert(alert);
    const alerts = await getUserAlerts();
    expect(alerts.ok).toBeTruthy();
    const body = alerts.body as Alert[];
    expect(body.length).toBeGreaterThan(0);
    const createdAlert = body.find((a) => a.stock === alert.stock);
    expect(createdAlert).toBeDefined();
    expect(typeof createdAlert!.price).toBe('number');
    expect(createdAlert!.price).toBeCloseTo(alert.price);
  });
});
