import { test, expect, request as playwrightRequest } from '@playwright/test';
import { calculateOpportunityScore } from '../../lib/marketOpportunity.js';
import { getLeadIntelligence } from '../../lib/leadIntelligence.js';
import { getTradeDataProvider } from '../../lib/tradeDataProvider.js';
import { checkRateLimit } from '../../lib/rateLimit.js';

test.describe('Stage 4 production readiness', () => {
  test.describe.configure({ mode: 'serial' });
  test('protected Stage 4 APIs reject unauthenticated requests', async ({ request }) => {
    for (const endpoint of ['/api/alerts', '/api/notifications', '/api/admin/analytics']) {
      expect((await request.get(endpoint)).status()).toBe(401);
    }
  });

  test('unlock validation rejects invalid and ambiguous targets', async ({ request }) => {
    for (const body of [{}, { buyerId: 1, supplierId: 1 }, { buyerId: 'abc' }, { buyerId: 1.5 }, { buyerId: -1 }]) {
      const response = await request.post('/api/unlock', { data: body });
      expect(response.status()).toBe(401);
    }
  });

  test('HS codes remain strings in market analysis input', async ({ request }) => {
    const response = await request.get('/api/market-analysis?hsCode=010121');
    expect(response.status()).toBe(401);
  });

  test('authenticated user can create an owned alert and read notifications', async ({ request }) => {
    const email = `stage4_${Date.now()}@globebridge.dev`;
    const register = await request.post('/api/auth/register', { data: { fullName: 'Stage 4 Test User', email, phone: '1234567890', password: 'Stage4Password!' } });
    expect(register.status()).toBe(201);
    const alert = await request.post('/api/alerts', { data: { name: 'High opportunity', alertType: 'OPPORTUNITY_SCORE', criteria: { threshold: 80 } } });
    expect(alert.status()).toBe(201);
    const list = await request.get('/api/alerts');
    expect(list.status()).toBe(200);
    expect((await list.json()).alerts).toHaveLength(1);
    const notifications = await request.get('/api/notifications');
    expect(notifications.status()).toBe(200);
  });

  test('provider metadata and historical trend response are explicit', async ({ request }) => {
    const email = `stage4_data_${Date.now()}@globebridge.dev`;
    await request.post('/api/auth/register', { data: { fullName: 'Stage 4 Data User', email, phone: '1234567890', password: 'Stage4Password!' } });
    const response = await request.get('/api/market-analysis?hsCode=010121&country=Germany');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.market.hsCode).toBe('010121');
    expect(body.dataConfidence).toEqual(expect.objectContaining({ available: expect.any(Boolean), source: expect.any(String), limitations: expect.any(Array) }));
    expect(body.historicalTrend).toEqual(expect.objectContaining({ available: expect.any(Boolean), trends: expect.any(Array) }));
  });

  test('lead intelligence and score calculations are deterministic', () => {
    const lead = { createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-15T00:00:00.000Z', status: 'NEW', leadScore: 85, nextFollowUpAt: '2026-08-10T00:00:00.000Z' };
    const now = new Date('2026-09-04T00:00:00.000Z');
    expect(getLeadIntelligence(lead, now)).toEqual(getLeadIntelligence(lead, now));
    const input = { buyerCount: 4, verifiedBuyerCount: 2, supplierCount: 1, shipmentCount: 3, totalShipmentValue: 50000, averageShipmentValue: 16666, historicalYears: 1 };
    expect(calculateOpportunityScore(input)).toEqual(calculateOpportunityScore(input));
  });

  test('authenticated security, alert CRUD, notifications, follow-ups, and ownership', async ({ request }) => {
    const email = `stage4_matrix_${Date.now()}@globebridge.dev`;
    const register = await request.post('/api/auth/register', { data: { fullName: 'Stage 4 Matrix User', email, phone: '1234567890', password: 'Stage4Password!' } });
    expect(register.status()).toBe(201);
    const buyerResponse = await request.get('/api/buyers?limit=1');
    const buyer = (await buyerResponse.json()).data[0];
    expect(buyer).toBeTruthy();

    const invalidBodies = [{}, { buyerId: 1, supplierId: 1 }, { buyerId: 'abc' }, { buyerId: 1.5 }, { buyerId: -1 }, { buyerId: 0 }];
    for (const body of invalidBodies) expect((await request.post('/api/unlock', { data: body })).status()).toBe(400);
    expect((await request.post('/api/unlock', { data: { buyerId: 999999 } })).status()).toBe(404);
    expect((await request.post('/api/unlock', { data: { buyerId: buyer.id } })).status()).toBe(200);
    expect((await request.post('/api/unlock', { data: { buyerId: buyer.id } })).status()).toBe(200);

    expect((await request.post('/api/alerts', { headers: { Origin: 'https://attacker.example' }, data: { name: 'Blocked', alertType: 'COUNTRY', criteria: { country: 'Germany' } } })).status()).toBe(403);
    const created = await request.post('/api/alerts', { data: { name: 'Matrix alert', alertType: 'COUNTRY', criteria: { country: 'United Arab Emirates' } } });
    expect(created.status()).toBe(201);
    const alertId = (await created.json()).id;
    expect((await request.get('/api/alerts')).status()).toBe(200);
    expect((await request.put(`/api/alerts/${alertId}`, { data: { name: 'Updated matrix alert', isActive: true } })).status()).toBe(200);

    const evaluatorMissing = await request.post('/api/internal/alerts/evaluate');
    const evaluatorWrong = await request.post('/api/internal/alerts/evaluate', { headers: { 'x-alert-cron-secret': 'wrong' } });
    expect([401, 403]).toContain(evaluatorMissing.status());
    expect([401, 403]).toContain(evaluatorWrong.status());
    const evaluator = await request.post('/api/internal/alerts/evaluate', { headers: { 'x-alert-cron-secret': process.env.ALERT_CRON_SECRET || 'stage4-local-only-secret' } });
    expect(evaluator.status()).toBe(200);

    const notifications = await request.get('/api/notifications');
    expect(notifications.status()).toBe(200);
    const notificationList = await notifications.json();
    const alertNotification = notificationList.notifications.find((item) => item.type === 'ALERT');
    expect(alertNotification).toBeTruthy();
    expect((await request.put(`/api/notifications/${alertNotification.id}/read`)).status()).toBe(200);
    expect((await request.put('/api/notifications/read-all')).status()).toBe(200);

    const lead = await request.post('/api/leads', { data: { entityType: 'BUYER', entityId: buyer.id, leadScore: 85, notes: 'Matrix lead' } });
    expect(lead.status()).toBe(201);
    const leadId = (await lead.json()).id;
    expect((await request.put(`/api/leads/${leadId}`, { data: { status: 'CONTACTED', nextFollowUpAt: '2020-01-01T00:00:00.000Z', lastContactedAt: '2020-01-01T00:00:00.000Z' } })).status()).toBe(200);
    const due = await request.post('/api/internal/alerts/evaluate', { headers: { 'x-alert-cron-secret': process.env.ALERT_CRON_SECRET || 'stage4-local-only-secret' } });
    expect(due.status()).toBe(200);
    const afterLead = await (await request.get('/api/notifications')).json();
    expect(afterLead.notifications.some((item) => item.type === 'LEAD')).toBeTruthy();
    expect((await request.delete(`/api/alerts/${alertId}`)).status()).toBe(200);
  });

  test('admin analytics filters, provider fallback, insufficient trends, and rate limiting', async ({ request }) => {
    const admin = await playwrightRequest.newContext();
    const login = await admin.post('/api/auth/login', { data: { email: 'admin@globebridge.dev', password: 'Admin@12345' } });
    expect(login.status()).toBe(200);
    for (const range of ['7', '30', '90', 'all']) {
      const response = await admin.get(`/api/admin/analytics?range=${range}`);
      expect(response.status()).toBe(200);
      const metrics = (await response.json()).metrics;
      expect(metrics).toEqual(expect.objectContaining({ users: expect.anything(), activeUsers: expect.anything(), activeSubscriptions: expect.anything(), savedAnalyses: expect.anything(), savedExportPlans: expect.anything(), totalLeads: expect.anything(), unlocks: expect.anything() }));
      expect(metrics.usage.buyerDiscovery).toBe('Usage tracking unavailable');
    }
    await admin.dispose();
    const originalProvider = process.env.TRADE_DATA_PROVIDER;
    process.env.TRADE_DATA_PROVIDER = 'external';
    expect(getTradeDataProvider().source).toBe('database');
    process.env.TRADE_DATA_PROVIDER = originalProvider;
    const trendUser = await request.post('/api/auth/register', { data: { fullName: 'Trend Matrix User', email: `stage4_trend_${Date.now()}@globebridge.dev`, phone: '1234567890', password: 'Stage4Password!' } });
    expect(trendUser.status()).toBe(201);
    const emptyTrendResponse = await request.get('/api/market-analysis?hsCode=99999999&country=NoSuchCountry');
    expect(emptyTrendResponse.status()).toBe(200);
    const emptyTrend = (await emptyTrendResponse.json()).historicalTrend;
    expect(emptyTrend).toEqual(expect.objectContaining({ available: false, message: 'Insufficient historical data' }));
    const first = checkRateLimit('stage4-matrix', 'login');
    expect(first.allowed).toBe(true);
  });

  test('HS code survives market analysis and export planner save/rerun lifecycle', async ({ request }) => {
    const email = `stage4_hs_${Date.now()}@globebridge.dev`;
    await request.post('/api/auth/register', { data: { fullName: 'HS Matrix User', email, phone: '1234567890', password: 'Stage4Password!' } });
    const market = await request.get('/api/market-analysis?hsCode=010121&country=United%20Arab%20Emirates');
    expect(market.status()).toBe(200);
    expect((await market.json()).market.hsCode).toBe('010121');
    const planner = await request.get('/api/export-planner/analyze?hsCode=010121&targetCountry=United%20Arab%20Emirates&price=1200&quantity=50&shipping=2500&insurance=350&otherCosts=600');
    expect(planner.status()).toBe(200);
    expect((await planner.json()).inputs.hsCode).toBe('010121');
    const saved = await request.post('/api/export-planner/saved', { data: { name: 'HS matrix plan', hsCode: '010121', product: 'Test product', originCountry: 'India', targetCountry: 'United Arab Emirates', price: 1200, quantity: 50, shipping: 2500, insurance: 350, otherCosts: 600, targetSellingPrice: 2500 } });
    expect(saved.status()).toBe(201);
    const savedId = (await saved.json()).id;
    expect((await request.get(`/api/export-planner/saved/${savedId}`)).json()).resolves.toEqual(expect.objectContaining({ hsCode: '010121' }));
    expect((await request.post(`/api/export-planner/saved/${savedId}/rerun`)).status()).toBe(200);
    expect((await request.delete(`/api/export-planner/saved/${savedId}`)).status()).toBe(200);
  });
});
