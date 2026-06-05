import { INestApplication, HttpStatus } from '@nestjs/common';
import { createTestApp } from '@/utils/app';
import { createTestUser } from '@/utils/user';
import { CreateAlertDto } from './dto/create-alert.dto';
import request from 'supertest';
import { Alert } from './entities/alert.entity';

describe('AlertsModule', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeEach(async () => {
    app = await createTestApp();
    await app.init();
    accessToken = await createTestUser(app);
  });

  afterEach(async () => {
    await app.close();
  });

  const createAlert = async (dto: CreateAlertDto, token = accessToken) => {
    return request(app.getHttpServer())
      .post('/alerts')
      .set('Authorization', `Bearer ${token}`)
      .send(dto);
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
    const res = await request(app.getHttpServer())
      .get('/alerts')
      .set('Authorization', `Bearer ${accessToken}`);
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
    const deleteRes = await request(app.getHttpServer())
      .delete(`/alerts/${alertId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(deleteRes.ok).toBeTruthy();
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
});
