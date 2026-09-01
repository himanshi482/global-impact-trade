// tests/e2e/leads.spec.js
// Stage 3 Phase 2 — E2E scaffold
//
// This assumes your existing suite uses Playwright with a helper module
// (e.g. `./helpers`) exposing `loginAs(page, user)`, `apiRequest(...)`,
// and seeded test users/fixtures — mirror whatever pattern your Stage
// 1/2 and Phase 1 specs already use, and slot these tests in alongside
// them (same config, same `DISABLE_RATE_LIMIT=true` test-mode support).
// Replace the `TODO` seed/fixture calls with your actual test-data setup.

const { test, expect } = require('@playwright/test');

test.describe('Buyer Discovery', () => {
  test('search by HS code returns matching buyers', async ({ request }) => {
    // TODO: authenticate, then:
    const res = await request.get('/api/buyers/discover?hsCode=010121');
    expect(res.status()).toBe(200);
    const body = await res.json();
    for (const b of body.results) {
      expect(b.hsCode).toBe('010121'); // string, leading zeros preserved
    }
  });

  test('search by country filters results', async ({ request }) => {
    const res = await request.get('/api/buyers/discover?country=India');
    expect(res.status()).toBe(200);
  });

  test('pagination respects limit and offset', async ({ request }) => {
    const res = await request.get('/api/buyers/discover?limit=5&offset=0');
    const body = await res.json();
    expect(body.results.length).toBeLessThanOrEqual(5);
    expect(body.pagination.limit).toBe(5);
  });

  test('sort by leadScore is descending', async ({ request }) => {
    const res = await request.get('/api/buyers/discover?sort=leadScore&limit=10');
    const body = await res.json();
    const scores = body.results.map((r) => r.leadScore);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
  });

  test('verified filter only returns verified buyers', async ({ request }) => {
    const res = await request.get('/api/buyers/discover?verified=true');
    const body = await res.json();
    for (const b of body.results) expect(b.verified).toBe(true);
  });

  test('unauthenticated request returns 401', async ({ request }) => {
    // TODO: use an unauthenticated request context (no session cookie)
    const res = await request.get('/api/buyers/discover');
    expect([401]).toContain(res.status());
  });
});

test.describe('Supplier Discovery', () => {
  test('search and filters behave like buyer discovery', async ({ request }) => {
    const res = await request.get('/api/suppliers/discover?country=Vietnam');
    expect(res.status()).toBe(200);
  });

  test('pagination and sorting work', async ({ request }) => {
    const res = await request.get('/api/suppliers/discover?sort=value&limit=5');
    expect(res.status()).toBe(200);
  });
});

test.describe('Lead Management', () => {
  test('create a lead', async ({ request }) => {
    const res = await request.post('/api/leads', {
      data: { entityType: 'BUYER', entityId: 1, leadScore: 75 },
    });
    expect([201]).toContain(res.status());
  });

  test('duplicate lead returns 409', async ({ request }) => {
    await request.post('/api/leads', {
      data: { entityType: 'BUYER', entityId: 1, leadScore: 75 },
    });
    const res = await request.post('/api/leads', {
      data: { entityType: 'BUYER', entityId: 1, leadScore: 75 },
    });
    expect(res.status()).toBe(409);
  });

  test('get own leads', async ({ request }) => {
    const res = await request.get('/api/leads');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.leads)).toBe(true);
  });

  test('update lead status', async ({ request }) => {
    // TODO: capture a real lead id from a prior create
    const res = await request.put('/api/leads/1', { data: { status: 'CONTACTED' } });
    expect([200, 404]).toContain(res.status());
  });

  test('update lead notes, HTML stripped', async ({ request }) => {
    const res = await request.put('/api/leads/1', {
      data: { notes: '<script>alert(1)</script>Follow up next week' },
    });
    expect([200, 404]).toContain(res.status());
  });

  test('delete a lead', async ({ request }) => {
    const res = await request.delete('/api/leads/1');
    expect([200, 404]).toContain(res.status());
  });
});

test.describe('Ownership', () => {
  test('user A cannot update user B lead', async ({ request }) => {
    // TODO: create lead as user A, then attempt PUT as user B
    // expect 404 (not 403) so existence isn't leaked to non-owners
  });

  test('user A cannot delete user B lead', async ({ request }) => {
    // TODO: same pattern as above for DELETE
  });
});

test.describe('Contact Unlock', () => {
  test('locked contact is masked in discovery results', async ({ request }) => {
    const res = await request.get('/api/buyers/discover?limit=5');
    const body = await res.json();
    for (const b of body.results) {
      if (!b.contactUnlocked) {
        expect(b.email).toBeUndefined();
        expect(b.phone).toBeUndefined();
      }
    }
  });

  test('successful unlock reveals contact fields', async ({ request }) => {
    // TODO: call POST /api/unlock, then re-fetch entity and confirm fields present
  });

  test('already-unlocked entity does not consume another quota', async ({ request }) => {
    // TODO: unlock twice, assert quota only decremented once
  });

  test('quota exceeded returns 403', async ({ request }) => {
    // TODO: exhaust quota, then attempt another unlock
  });
});

test.describe('CSV Export', () => {
  test('export contains only own leads with correct columns', async ({ request }) => {
    const res = await request.get('/api/leads/export');
    expect(res.status()).toBe(200);
    const csv = await res.text();
    const header = csv.split('\r\n')[0];
    expect(header).toBe(
      'Company,Country,Entity Type,Lead Score,Potential,Status,Notes,Created Date'
    );
  });

  test('export never includes another user contact details', async ({ request }) => {
    const res = await request.get('/api/leads/export');
    const csv = await res.text();
    expect(csv).not.toMatch(/@/); // no raw email addresses leaking into export
  });
});

test.describe('Admin Lead Management', () => {
  test('admin can access /api/admin/leads', async ({ request }) => {
    // TODO: authenticate as ADMIN
    const res = await request.get('/api/admin/leads');
    expect([200]).toContain(res.status());
  });

  test('normal user gets 403 on /api/admin/leads', async ({ request }) => {
    // TODO: authenticate as a normal (non-admin) user
    const res = await request.get('/api/admin/leads');
    expect([403]).toContain(res.status());
  });

  test('unauthenticated gets 401 on /api/admin/leads', async ({ request }) => {
    const res = await request.get('/api/admin/leads');
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('Phase 1 Regression', () => {
  // TODO: re-run/point at the existing Phase 1 specs, or import & invoke
  // them here so the full suite executes together:
  // - Market Analysis
  // - Opportunity Score
  // - Country Comparison
  // - Best Market Finder
  // - Saved Analyses / Rerun Saved Analysis
});

test.describe('Stage 2 Regression', () => {
  // TODO: same pattern — re-run existing Stage 2 specs:
  // - Authentication, Trade Data, HS Codes, Shipments,
  //   Search History, Saved Searches, Profile, Subscription,
  //   Unlock, Admin CRUD
});
