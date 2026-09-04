import mysql from 'mysql2/promise';
import { SignJWT } from 'jose';
import dotenv from 'dotenv';

dotenv.config();

const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-only-secret-change-me';

async function createToken(user) {
  const secretKey = new TextEncoder().encode(AUTH_SECRET);
  return new SignJWT({
    sub: String(user.id),
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'globebridge',
  });

  const [users] = await conn.query('SELECT id, name, email, role FROM users LIMIT 2');
  if (!users || users.length === 0) {
    console.error('No users found in database.');
    await conn.end();
    return;
  }

  const user1 = users[0];
  const user2 = users[1] || { id: 9999, name: 'User 2', email: 'user2@test.com', role: 'USER' };

  console.log('Testing with User 1:', user1.email, '(ID:', user1.id, ')');

  const token1 = await createToken(user1);
  const token2 = await createToken(user2);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // 1. Test GET /api/market-analysis with 010121
  console.log('\n--- 1. Testing GET /api/market-analysis with hsCode=010121 ---');
  const res1 = await fetch(`${baseUrl}/api/market-analysis?hsCode=010121&country=United%20Arab%20Emirates&direction=export`, {
    headers: { Cookie: `gb_session=${token1}` },
  });
  const data1 = await res1.json();
  console.log('Status:', res1.status);
  console.log('Market:', data1.market);
  console.log('Opportunity Score:', data1.score?.overall, '-', data1.score?.tier);
  console.log('Buyer count:', data1.metrics?.buyerCount);
  if (data1.market?.hsCode !== '010121') {
    throw new Error(`HS Code mismatch! Expected "010121", got "${data1.market?.hsCode}"`);
  }
  console.log('✓ HS Code "010121" correctly preserved as string with leading zero');

  // 2. Test other HS codes (090411, 871410, 123456)
  for (const code of ['090411', '871410', '123456']) {
    const resCode = await fetch(`${baseUrl}/api/market-analysis?hsCode=${code}&country=Germany&direction=export`, {
      headers: { Cookie: `gb_session=${token1}` },
    });
    const dataCode = await resCode.json();
    console.log(`HS Code "${code}" test: status ${resCode.status}, hsCode in response: "${dataCode.market?.hsCode}"`);
    if (dataCode.market?.hsCode !== code) {
      throw new Error(`HS Code mismatch for ${code}!`);
    }
  }

  // 3. Test GET /api/market-analysis/best-markets with 010121
  console.log('\n--- 2. Testing GET /api/market-analysis/best-markets with hsCode=010121 ---');
  const resBest = await fetch(`${baseUrl}/api/market-analysis/best-markets?hsCode=010121`, {
    headers: { Cookie: `gb_session=${token1}` },
  });
  const dataBest = await resBest.json();
  console.log('Status:', resBest.status);
  console.log('Best markets count:', dataBest.bestMarkets?.length);
  console.log('Best markets:', dataBest.bestMarkets?.map(m => `${m.country} (${m.score?.overall}/100)`));

  // 4. Test POST /api/market-analysis/saved
  console.log('\n--- 3. Testing POST /api/market-analysis/saved ---');
  const resSave = await fetch(`${baseUrl}/api/market-analysis/saved`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `gb_session=${token1}`,
    },
    body: JSON.stringify({
      hsCode: '010121',
      country: 'United Arab Emirates',
      direction: 'export',
      filters: { year: 'all' },
      opportunityScore: data1.score?.overall || 84,
    }),
  });
  const dataSave = await resSave.json();
  console.log('Save Status:', resSave.status, dataSave);
  const savedId = dataSave.id;
  if (!savedId) throw new Error('Save failed to return ID');

  // 5. Test GET /api/market-analysis/saved
  console.log('\n--- 4. Testing GET /api/market-analysis/saved ---');
  const resList = await fetch(`${baseUrl}/api/market-analysis/saved`, {
    headers: { Cookie: `gb_session=${token1}` },
  });
  const dataList = await resList.json();
  console.log('Saved List count:', dataList.savedAnalyses?.length);
  const savedItem = dataList.savedAnalyses?.find(s => s.id === savedId);
  console.log('Found Saved Item:', savedItem);
  if (savedItem.hsCode !== '010121') {
    throw new Error(`Saved HS Code was not 010121, got ${savedItem.hsCode}`);
  }

  // 6. Test RERUN /api/market-analysis/saved/[id]/rerun
  console.log('\n--- 5. Testing POST /api/market-analysis/saved/[id]/rerun ---');
  const resRerun = await fetch(`${baseUrl}/api/market-analysis/saved/${savedId}/rerun`, {
    method: 'POST',
    headers: { Cookie: `gb_session=${token1}` },
  });
  const dataRerun = await resRerun.json();
  console.log('Rerun status:', resRerun.status, 'Score:', dataRerun.savedRecord?.opportunityScore);

  // 7. Test Ownership protection: User 2 trying to delete User 1's saved analysis
  console.log('\n--- 6. Testing Ownership Protection (User 2 deleting User 1 analysis) ---');
  const resCrossDelete = await fetch(`${baseUrl}/api/market-analysis/saved/${savedId}`, {
    method: 'DELETE',
    headers: { Cookie: `gb_session=${token2}` },
  });
  console.log('Cross-delete status (expected 404):', resCrossDelete.status);
  if (resCrossDelete.status !== 404) {
    throw new Error(`Expected 404 for cross-user delete, got ${resCrossDelete.status}`);
  }

  // 8. Test DELETE /api/market-analysis/saved/[id] by owner
  console.log('\n--- 7. Testing DELETE /api/market-analysis/saved/[id] by Owner ---');
  const resDel = await fetch(`${baseUrl}/api/market-analysis/saved/${savedId}`, {
    method: 'DELETE',
    headers: { Cookie: `gb_session=${token1}` },
  });
  const dataDel = await resDel.json();
  console.log('Delete status:', resDel.status, dataDel);

  console.log('\n✅ ALL AUTOMATED TESTS PASSED SUCCESSFULLY!');
  await conn.end();
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
