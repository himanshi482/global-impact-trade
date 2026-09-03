const mysql = require('mysql2/promise');
require('dotenv').config();

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005';

// Utility helper to make requests with cookies
async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const headers = options.headers || {};
  if (options.cookie) {
    headers['Cookie'] = options.cookie;
  }
  if (options.body && typeof options.body === 'object' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const response = await fetch(url, { ...options, headers });
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  // Extract set-cookie if present
  const setCookie = response.headers.get('set-cookie');
  let cookieHeader = null;
  if (setCookie) {
    const match = setCookie.match(/gb_session=([^;]+)/);
    if (match) {
      cookieHeader = `gb_session=${match[1]}`;
    }
  }

  return { status: response.status, data, cookieHeader, headers: response.headers };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runE2ETests() {
  console.log('====================================================');
  console.log('🚀 GLOBEBRIDGE END-TO-END (E2E) PLATFORM SUITE');
  console.log(`Target App URL: ${BASE_URL}`);
  console.log('====================================================\n');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'globebridge',
  });

  const timestamp = Date.now();
  const testUserEmail = `e2e_user_${timestamp}@globebridge.dev`;
  const testUserPassword = `TestUser@${timestamp}`;
  let userCookie = null;
  let userId = null;
  let adminCookie = null;

  try {
    // ----------------------------------------------------
    // PHASE A: User Authentication & Lifecycle
    // ----------------------------------------------------
    console.log('--- 📌 PHASE A: User Authentication & Lifecycle ---');

    // 1. Register user
    console.log(`1. Registering new test user: ${testUserEmail}`);
    const regRes = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'E2E Test User',
        email: testUserEmail,
        phone: '+1 555-0199',
        password: testUserPassword,
        companyName: 'Global Exim Logistics',
        country: 'India',
        industry: 'Logistics',
      },
    });
    assert(regRes.status === 201, `Expected status 201 on register, got ${regRes.status}: ${JSON.stringify(regRes.data)}`);
    assert(regRes.data.user && regRes.data.user.email === testUserEmail, 'User registration returned invalid user object');
    userId = regRes.data.user.id;
    console.log(`   ✓ Registered successfully (ID: ${userId})`);

    // 2. Duplicate registration protection
    console.log('2. Testing duplicate email registration protection...');
    const dupRes = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Duplicate User',
        email: testUserEmail,
        phone: '+1 555-0199',
        password: testUserPassword,
      },
    });
    assert(dupRes.status === 409, `Expected status 409 for duplicate registration, got ${dupRes.status}`);
    console.log('   ✓ Duplicate registration properly rejected (409 Conflict)');

    // 3. Login with invalid password
    console.log('3. Testing login with invalid credentials...');
    const badLoginRes = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email: testUserEmail, password: 'WrongPassword123' },
    });
    assert(badLoginRes.status === 401, `Expected status 401 for bad login, got ${badLoginRes.status}`);
    console.log('   ✓ Invalid credentials rejected (401)');

    // 4. Valid Login
    console.log('4. Logging in with valid credentials...');
    const loginRes = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email: testUserEmail, password: testUserPassword },
    });
    assert(loginRes.status === 200, `Expected 200 on login, got ${loginRes.status}`);
    assert(loginRes.cookieHeader, 'Login response did not include gb_session cookie');
    userCookie = loginRes.cookieHeader;
    console.log('   ✓ Login successful & session cookie established');

    // 5. Auth /me endpoint
    console.log('5. Testing GET /api/auth/me...');
    const meRes = await apiFetch('/api/auth/me', { cookie: userCookie });
    assert(meRes.status === 200, `Expected 200 for /api/auth/me, got ${meRes.status}`);
    assert(meRes.data.user && meRes.data.user.email === testUserEmail, '/api/auth/me user email mismatch');
    console.log(`   ✓ Auth verification passed for ${meRes.data.user.name}`);

    // 6. Forgot Password
    console.log('6. Testing POST /api/auth/forgot-password...');
    const forgotRes = await apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: testUserEmail },
    });
    assert(forgotRes.status === 200, `Expected 200 for forgot-password, got ${forgotRes.status}`);
    console.log('   ✓ Forgot password reset link generated');

    // 7. Profile Update
    console.log('7. Testing PUT /api/profile...');
    const profileRes = await apiFetch('/api/profile', {
      method: 'PUT',
      cookie: userCookie,
      body: {
        name: 'E2E Updated User',
        companyName: 'Updated Trade Corp',
        phone: '+1 555-0199',
        country: 'Germany',
      },
    });
    assert(profileRes.status === 200, `Expected 200 for profile update, got ${profileRes.status}`);
    console.log('   ✓ Profile updated successfully');

    // ----------------------------------------------------
    // PHASE B: Public & Lead Capture Endpoints
    // ----------------------------------------------------
    console.log('\n--- 📌 PHASE B: Public & Lead Capture Endpoints ---');

    console.log('1. Submitting Contact Us lead form...');
    const contactRes = await apiFetch('/api/contact', {
      method: 'POST',
      body: {
        name: 'Contact Lead',
        email: 'lead@partner.com',
        company: 'Partner Enterprise',
        subject: 'Custom Tariff Feed',
        message: 'We are interested in bulk HS code enterprise data access.',
      },
    });
    assert(contactRes.status === 201, `Expected 201 for contact submission, got ${contactRes.status}`);
    console.log('   ✓ Contact lead captured');

    console.log('2. Submitting Book a Demo request...');
    const demoRes = await apiFetch('/api/demo', {
      method: 'POST',
      body: {
        name: 'Demo Prospect',
        email: 'demo@prospect.com',
        company: 'Import Dynamics',
        role: 'Supply Chain Director',
        teamSize: '50-200',
        date: '2026-09-15',
        time: '14:00',
      },
    });
    assert(demoRes.status === 201, `Expected 201 for demo request, got ${demoRes.status}`);
    console.log('   ✓ Demo booking captured');

    // ----------------------------------------------------
    // PHASE C: Directory & Search APIs
    // ----------------------------------------------------
    console.log('\n--- 📌 PHASE C: Directory & Search APIs ---');

    console.log('1. Searching Buyers directory (/api/buyers)...');
    const buyersRes = await apiFetch('/api/buyers?product=cotton&page=1&limit=5', { cookie: userCookie });
    assert(buyersRes.status === 200, `Expected 200 for /api/buyers, got ${buyersRes.status}`);
    assert(Array.isArray(buyersRes.data.data), 'Buyers response data should be an array');
    console.log(`   ✓ Buyers search returned ${buyersRes.data.data.length} records (Total: ${buyersRes.data.pagination?.total})`);

    console.log('2. Searching Suppliers directory (/api/suppliers)...');
    const suppliersRes = await apiFetch('/api/suppliers?product=textile&page=1&limit=5', { cookie: userCookie });
    assert(suppliersRes.status === 200, `Expected 200 for /api/suppliers, got ${suppliersRes.status}`);
    assert(Array.isArray(suppliersRes.data.data), 'Suppliers response data should be an array');
    console.log(`   ✓ Suppliers search returned ${suppliersRes.data.data.length} records (Total: ${suppliersRes.data.pagination?.total})`);

    console.log('3. Searching Shipments database (/api/shipments)...');
    const shipmentsRes = await apiFetch('/api/shipments?hsCode=090411&page=1&limit=5', { cookie: userCookie });
    assert(shipmentsRes.status === 200, `Expected 200 for /api/shipments, got ${shipmentsRes.status}`);
    assert(Array.isArray(shipmentsRes.data.data), 'Shipments response data should be an array');
    console.log(`   ✓ Shipments search returned ${shipmentsRes.data.data.length} rows (Total: ${shipmentsRes.data.pagination?.total})`);

    console.log('4. Searching HS Codes lookup (/api/hs-codes)...');
    const hsRes = await apiFetch('/api/hs-codes?chapter=09&q=pepper&page=1&limit=5', { cookie: userCookie });
    assert(hsRes.status === 200, `Expected 200 for /api/hs-codes, got ${hsRes.status}`);
    assert(Array.isArray(hsRes.data.data), 'HS codes response data should be an array');
    console.log(`   ✓ HS code lookup returned ${hsRes.data.data.length} rows (Total: ${hsRes.data.pagination?.total})`);

    // ----------------------------------------------------
    // PHASE D: Market Intelligence Workbench
    // ----------------------------------------------------
    console.log('\n--- 📌 PHASE D: Market Intelligence Workbench ---');

    console.log('1. Testing GET /api/market-analysis (hsCode=010121)...');
    const marketRes = await apiFetch('/api/market-analysis?hsCode=010121&country=United%20Arab%20Emirates&direction=export', {
      cookie: userCookie,
    });
    assert(marketRes.status === 200, `Expected 200 for /api/market-analysis, got ${marketRes.status}`);
    assert(marketRes.data.market && marketRes.data.market.hsCode === '010121', 'HS code string integrity check failed');
    assert(marketRes.data.score && typeof marketRes.data.score.overall === 'number', 'Opportunity score calculation missing');
    console.log(`   ✓ Market Intelligence Score: ${marketRes.data.score.overall}/100 (${marketRes.data.score.tier})`);

    console.log('2. Testing GET /api/market-analysis/compare (Germany, UAE, USA)...');
    const compareRes = await apiFetch('/api/market-analysis/compare?hsCode=010121&countries=Germany,UAE,USA', {
      cookie: userCookie,
    });
    assert(compareRes.status === 200, `Expected 200 for /api/market-analysis/compare, got ${compareRes.status}`);
    assert(Array.isArray(compareRes.data.comparisons), 'Comparisons result missing array');
    console.log(`   ✓ Side-by-side benchmarked ${compareRes.data.comparisons.length} target countries`);

    console.log('3. Testing GET /api/market-analysis/best-markets...');
    const bestRes = await apiFetch('/api/market-analysis/best-markets?hsCode=010121&limit=3', { cookie: userCookie });
    assert(bestRes.status === 200, `Expected 200 for best-markets, got ${bestRes.status}`);
    assert(Array.isArray(bestRes.data.bestMarkets), 'Best markets array missing');
    console.log(`   ✓ Top best markets evaluated: ${bestRes.data.bestMarkets.map(m => m.country).join(', ')}`);

    // ----------------------------------------------------
    // PHASE E: Search History & Saved Portfolios
    // ----------------------------------------------------
    console.log('\n--- 📌 PHASE E: Search History & Saved Portfolios ---');

    // Search History
    console.log('1. Logging query to search history...');
    const postHistRes = await apiFetch('/api/search-history', {
      method: 'POST',
      cookie: userCookie,
      body: { searchType: 'hs-codes', query: '010121 Live Horses', filters: { chapter: '01' } },
    });
    assert(postHistRes.status === 201, `Expected 201 for search history, got ${postHistRes.status}`);

    const getHistRes = await apiFetch('/api/search-history', { cookie: userCookie });
    assert(getHistRes.status === 200, `Expected 200 for search history list, got ${getHistRes.status}`);
    assert(Array.isArray(getHistRes.data.data) && getHistRes.data.data.length > 0, 'History log empty');
    console.log('   ✓ Search history logged and retrieved');

    // Saved Searches
    console.log('2. Saving directory search parameters...');
    const postSaveSearchRes = await apiFetch('/api/saved-searches', {
      method: 'POST',
      cookie: userCookie,
      body: {
        name: 'UAE Horse Importers Search',
        searchType: 'buyers',
        query: 'horses',
        filters: { product: 'horses', country: 'UAE' },
      },
    });
    assert(postSaveSearchRes.status === 201, `Expected 201 for saving search, got ${postSaveSearchRes.status}`);
    const savedSearchId = postSaveSearchRes.data.id;

    const getSaveSearchRes = await apiFetch('/api/saved-searches', { cookie: userCookie });
    assert(getSaveSearchRes.status === 200, `Expected 200 for saved searches, got ${getSaveSearchRes.status}`);
    const foundSavedSearch = getSaveSearchRes.data.data?.find(s => s.id === savedSearchId);
    assert(foundSavedSearch, 'Saved search not found in list');
    console.log(`   ✓ Saved search bookmark created (ID: ${savedSearchId})`);

    const delSaveSearchRes = await apiFetch(`/api/saved-searches/${savedSearchId}`, {
      method: 'DELETE',
      cookie: userCookie,
    });
    assert(delSaveSearchRes.status === 200, `Expected 200 for deleting saved search, got ${delSaveSearchRes.status}`);
    console.log('   ✓ Saved search deleted');

    // Saved Market Analysis Portfolio
    console.log('3. Saving market analysis dossier to portfolio...');
    const postSaveAnalysisRes = await apiFetch('/api/market-analysis/saved', {
      method: 'POST',
      cookie: userCookie,
      body: {
        hsCode: '010121',
        country: 'United Arab Emirates',
        direction: 'export',
        filters: { year: 'all' },
        opportunityScore: marketRes.data.score?.overall || 85,
      },
    });
    assert(postSaveAnalysisRes.status === 201, `Expected 201 for save market analysis, got ${postSaveAnalysisRes.status}`);
    const savedAnalysisId = postSaveAnalysisRes.data.id;

    console.log('4. Re-evaluating saved market analysis (RERUN)...');
    const rerunRes = await apiFetch(`/api/market-analysis/saved/${savedAnalysisId}/rerun`, {
      method: 'POST',
      cookie: userCookie,
    });
    assert(rerunRes.status === 200, `Expected 200 for rerun, got ${rerunRes.status}`);
    console.log(`   ✓ Re-evaluation completed with fresh overall score: ${rerunRes.data.savedRecord?.opportunityScore}`);

    console.log('5. Deleting saved market analysis...');
    const delAnalysisRes = await apiFetch(`/api/market-analysis/saved/${savedAnalysisId}`, {
      method: 'DELETE',
      cookie: userCookie,
    });
    assert(delAnalysisRes.status === 200, `Expected 200 for delete analysis, got ${delAnalysisRes.status}`);
    console.log('   ✓ Saved market analysis deleted');

    // ----------------------------------------------------
    // PHASE F: Unlocks & Subscription Quota Management
    // ----------------------------------------------------
    console.log('\n--- 📌 PHASE F: Unlocks & Subscription Quota Management ---');

    console.log('1. Checking remaining contact unlock quota...');
    const unlockStatusRes = await apiFetch('/api/unlock', { cookie: userCookie });
    assert(unlockStatusRes.status === 200, `Expected 200 for GET /api/unlock, got ${unlockStatusRes.status}`);
    console.log(`   ✓ Current plan quota: ${unlockStatusRes.data.quota.used}/${unlockStatusRes.data.quota.maxAllowed} unlocks used`);

    // Fetch a real buyer ID from database to test unlocking
    const [buyerRows] = await conn.query('SELECT id FROM buyers LIMIT 1');
    if (buyerRows.length > 0) {
      const targetBuyerId = buyerRows[0].id;
      console.log(`2. Unlocking buyer contact details for buyer ID: ${targetBuyerId}...`);
      const unlockActionRes = await apiFetch('/api/unlock', {
        method: 'POST',
        cookie: userCookie,
        body: { buyerId: targetBuyerId },
      });
      assert(unlockActionRes.status === 200, `Expected 200 for contact unlock, got ${unlockActionRes.status}`);
      assert(unlockActionRes.data.granted === true, 'Unlock request was not granted');
      console.log('   ✓ Contact details successfully unlocked & quota updated');
    }

    // ----------------------------------------------------
    // PHASE G: Admin Suite & Role-Gated CRUD Operations
    // ----------------------------------------------------
    console.log('\n--- 📌 PHASE G: Admin Suite & Full CRUD Operations ---');

    // Login as Admin
    console.log('1. Logging in as Admin (admin@globebridge.dev)...');
    const adminLoginRes = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@globebridge.dev', password: 'Admin@12345' },
    });
    assert(adminLoginRes.status === 200, `Expected 200 for Admin login, got ${adminLoginRes.status}`);
    adminCookie = adminLoginRes.cookieHeader;
    console.log('   ✓ Admin authenticated successfully');

    // Admin Stats
    console.log('2. Fetching Admin Platform Overview stats (/api/admin/stats)...');
    const adminStatsRes = await apiFetch('/api/admin/stats', { cookie: adminCookie });
    assert(adminStatsRes.status === 200, `Expected 200 for admin stats, got ${adminStatsRes.status}`);
    console.log(`   ✓ Admin Stats: Users=${adminStatsRes.data.stats.users}, Buyers=${adminStatsRes.data.stats.buyers}, Suppliers=${adminStatsRes.data.stats.suppliers}`);

    // Admin Users Management
    console.log('3. Testing Admin Users list & role update...');
    const adminUsersRes = await apiFetch('/api/admin/users', { cookie: adminCookie });
    assert(adminUsersRes.status === 200, `Expected 200 for admin users list, got ${adminUsersRes.status}`);
    assert(Array.isArray(adminUsersRes.data.data), 'Admin users list error');

    // Update test user subscription plan via admin endpoint
    console.log(`4. Admin upgrading user #${userId} subscription plan to CONNECT...`);
    const subUpdateRes = await apiFetch(`/api/admin/subscriptions/${userId}`, {
      method: 'PUT',
      cookie: adminCookie,
      body: { plan: 'CONNECT', status: 'ACTIVE' },
    });
    assert(subUpdateRes.status === 200, `Expected 200 for subscription update, got ${subUpdateRes.status}`);
    console.log('   ✓ User subscription upgraded to CONNECT');

    // Admin Buyers CRUD
    console.log('5. Admin Buyers CRUD (CREATE -> UPDATE -> DELETE)...');
    const createBuyerRes = await apiFetch('/api/admin/buyers', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        company_name: 'E2E Test Buyer Corp',
        country: 'United States',
        city: 'New York',
        product: 'Organic Honey',
        hs_code: '040900',
        import_volume: '$500,000',
        verified: true,
      },
    });
    assert(createBuyerRes.status === 201, `Expected 201 for buyer creation, got ${createBuyerRes.status}`);
    const testBuyerId = createBuyerRes.data.id;
    console.log(`   ✓ Created buyer ID: ${testBuyerId}`);

    const updateBuyerRes = await apiFetch(`/api/admin/buyers/${testBuyerId}`, {
      method: 'PUT',
      cookie: adminCookie,
      body: {
        company_name: 'E2E Test Buyer Corp Updated',
        country: 'United States',
        city: 'Boston',
        product: 'Organic Raw Honey',
        hs_code: '040900',
        import_volume: '$750,000',
        verified: true,
      },
    });
    assert(updateBuyerRes.status === 200, `Expected 200 for buyer update, got ${updateBuyerRes.status}`);
    console.log('   ✓ Updated buyer details');

    const deleteBuyerRes = await apiFetch(`/api/admin/buyers/${testBuyerId}`, {
      method: 'DELETE',
      cookie: adminCookie,
    });
    assert(deleteBuyerRes.status === 200, `Expected 200 for buyer delete, got ${deleteBuyerRes.status}`);
    console.log('   ✓ Deleted buyer');

    // Admin Suppliers CRUD
    console.log('6. Admin Suppliers CRUD (CREATE -> UPDATE -> DELETE)...');
    const createSupplierRes = await apiFetch('/api/admin/suppliers', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        company_name: 'E2E Test Supplier Ltd',
        country: 'India',
        city: 'Mumbai',
        product: 'Spices & Condiments',
        hs_code: '090411',
        export_volume: '$1,200,000',
        verified: true,
      },
    });
    assert(createSupplierRes.status === 201, `Expected 201 for supplier creation, got ${createSupplierRes.status}`);
    const testSupplierId = createSupplierRes.data.id;
    console.log(`   ✓ Created supplier ID: ${testSupplierId}`);

    const deleteSupplierRes = await apiFetch(`/api/admin/suppliers/${testSupplierId}`, {
      method: 'DELETE',
      cookie: adminCookie,
    });
    assert(deleteSupplierRes.status === 200, `Expected 200 for supplier delete, got ${deleteSupplierRes.status}`);
    console.log('   ✓ Deleted supplier');

    // Admin Shipments CRUD
    console.log('7. Admin Shipments CRUD (CREATE -> DELETE)...');
    const createShipmentRes = await apiFetch('/api/admin/shipments', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        exporter: 'Global Spice Exporters',
        importer: 'Euro Food Importers',
        product: 'Black Pepper Grain',
        hs_code: '090411',
        quantity: 15000,
        unit: 'KG',
        shipment_value: 85000,
        origin_country: 'India',
        destination_country: 'Germany',
        origin_port: 'Jawaharlal Nehru Port',
        destination_port: 'Hamburg',
        shipment_date: '2026-08-01',
      },
    });
    assert(createShipmentRes.status === 201, `Expected 201 for shipment create, got ${createShipmentRes.status}`);
    const testShipmentId = createShipmentRes.data.id;
    console.log(`   ✓ Created shipment record ID: ${testShipmentId}`);

    const deleteShipmentRes = await apiFetch(`/api/admin/shipments/${testShipmentId}`, {
      method: 'DELETE',
      cookie: adminCookie,
    });
    assert(deleteShipmentRes.status === 200, `Expected 200 for shipment delete, got ${deleteShipmentRes.status}`);
    console.log('   ✓ Deleted shipment record');

    // Admin HS Codes CRUD
    console.log('8. Admin HS Codes CRUD & Duplicate Protection...');
    const testCode = `999${Math.floor(100 + Math.random() * 899)}`;
    const createHsRes = await apiFetch('/api/admin/hs-codes', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        code: testCode,
        description: 'Test Custom HS Entry',
        chapter: '99',
        bcd: '10%',
        sws: '10%',
        igst: '18%',
        country: 'India',
      },
    });
    assert(createHsRes.status === 201, `Expected 201 for HS code create, got ${createHsRes.status}`);
    const testHsId = createHsRes.data.id;
    console.log(`   ✓ Created custom HS Code entry ${testCode} (ID: ${testHsId})`);

    // Duplicate test
    const dupHsRes = await apiFetch('/api/admin/hs-codes', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        code: testCode,
        description: 'Duplicate Entry',
        country: 'India',
      },
    });
    assert(dupHsRes.status === 409, `Expected 409 Conflict for duplicate HS code, got ${dupHsRes.status}`);
    console.log('   ✓ Duplicate HS code conflict correctly blocked (409)');

    const deleteHsRes = await apiFetch(`/api/admin/hs-codes/${testHsId}`, {
      method: 'DELETE',
      cookie: adminCookie,
    });
    assert(deleteHsRes.status === 200, `Expected 200 for HS code delete, got ${deleteHsRes.status}`);
    console.log('   ✓ Deleted custom HS Code');

    // Admin Lead Requests Management
    console.log('9. Admin Lead Requests listing & status updates...');
    const getReqRes = await apiFetch('/api/admin/requests', { cookie: adminCookie });
    assert(getReqRes.status === 200, `Expected 200 for lead requests, got ${getReqRes.status}`);
    assert(Array.isArray(getReqRes.data.contacts) && Array.isArray(getReqRes.data.demos), 'Lead requests payload invalid');
    console.log(`   ✓ Retreived ${getReqRes.data.contacts.length} contact leads & ${getReqRes.data.demos.length} demo leads`);

    if (getReqRes.data.contacts.length > 0) {
      const leadId = getReqRes.data.contacts[0].id;
      const updateReqRes = await apiFetch(`/api/admin/requests/${leadId}`, {
        method: 'PUT',
        cookie: adminCookie,
        body: { type: 'contact', status: 'CONTACTED' },
      });
      assert(updateReqRes.status === 200, `Expected 200 for lead status update, got ${updateReqRes.status}`);
      console.log(`   ✓ Updated lead request #${leadId} status to CONTACTED`);
    }

    // ----------------------------------------------------
    // PHASE H: Security & Authorization Boundary Checks
    // ----------------------------------------------------
    console.log('\n--- 📌 PHASE H: Security & Authorization Boundary Checks ---');

    console.log('1. Testing non-admin user accessing admin endpoint (expecting 403)...');
    const forbidRes = await apiFetch('/api/admin/stats', { cookie: userCookie });
    assert(forbidRes.status === 403, `Expected status 403 Forbidden for non-admin, got ${forbidRes.status}`);
    console.log('   ✓ Standard user properly forbidden from Admin API (403)');

    console.log('2. Testing unauthenticated access to protected user endpoint (expecting 401)...');
    const unauthRes = await apiFetch('/api/profile');
    assert(unauthRes.status === 401, `Expected status 401 Unauthorized, got ${unauthRes.status}`);
    console.log('   ✓ Unauthenticated request properly rejected (401)');

    // ----------------------------------------------------
    // PHASE I: Advanced Trade Intelligence & Export Decision Support (Stage 3 Phase 3)
    // ----------------------------------------------------
    console.log('\n--- 📌 PHASE I: Advanced Trade Intelligence & Export Decision Support ---');

    console.log('1. Testing GET /api/export-planner/analyze with leading-zero HS Code ("010121")...');
    const analyzeRes = await apiFetch('/api/export-planner/analyze?hsCode=010121&targetCountry=United+Arab+Emirates&price=1200&quantity=50&shipping=2500&insurance=350&otherCosts=600', {
      cookie: userCookie,
    });
    assert(analyzeRes.status === 200, `Expected 200 for analyze, got ${analyzeRes.status}: ${JSON.stringify(analyzeRes.data)}`);
    assert(analyzeRes.data.inputs.hsCode === '010121', 'HS Code leading zero was corrupted!');
    assert(typeof analyzeRes.data.scores.finalOpportunityScore === 'number', 'Missing final opportunity score');
    assert(analyzeRes.data.riskAssessment && ['LOW', 'MEDIUM', 'HIGH'].includes(analyzeRes.data.riskAssessment.level), 'Invalid risk level');
    assert(analyzeRes.data.readinessAssessment && ['READY', 'MODERATE', 'NOT_READY'].includes(analyzeRes.data.readinessAssessment.level), 'Invalid readiness level');
    assert(Array.isArray(analyzeRes.data.actionPlan) && analyzeRes.data.actionPlan.length === 10, 'Action plan should contain 10 steps');
    console.log(`   ✓ Export Opportunity Score: ${analyzeRes.data.scores.finalOpportunityScore}/100 | Recommendation: ${analyzeRes.data.recommendation.decision} | HS Code: ${analyzeRes.data.inputs.hsCode}`);

    console.log('2. Testing GET /api/export-planner/best-markets...');
    const bestMarketsRes = await apiFetch('/api/export-planner/best-markets?hsCode=010121&limit=5', {
      cookie: userCookie,
    });
    assert(bestMarketsRes.status === 200, `Expected 200 for best markets, got ${bestMarketsRes.status}`);
    assert(Array.isArray(bestMarketsRes.data.markets), 'Best markets payload missing markets array');
    console.log(`   ✓ Ranked ${bestMarketsRes.data.markets.length} export destination corridors`);

    console.log('3. Testing GET /api/export-planner/recommended-buyers with contact masking...');
    const recBuyersRes = await apiFetch('/api/export-planner/recommended-buyers?hsCode=010121&targetCountry=United+Arab+Emirates&limit=5', {
      cookie: userCookie,
    });
    assert(recBuyersRes.status === 200, `Expected 200 for recommended buyers, got ${recBuyersRes.status}`);
    assert(Array.isArray(recBuyersRes.data.buyers), 'Recommended buyers payload missing buyers array');
    for (const b of recBuyersRes.data.buyers) {
      if (!b.isUnlocked) {
        assert(b.email === null && b.phone === null, 'Locked buyer leaked contact details!');
      }
    }
    console.log(`   ✓ Retrieved ${recBuyersRes.data.buyers.length} matched buyers with contact masking intact`);

    console.log('4. Testing GET /api/export-planner/action-plan...');
    const actionPlanRes = await apiFetch('/api/export-planner/action-plan?hsCode=010121&targetCountry=Germany', {
      cookie: userCookie,
    });
    assert(actionPlanRes.status === 200, `Expected 200 for action plan, got ${actionPlanRes.status}`);
    assert(Array.isArray(actionPlanRes.data.actionPlan) && actionPlanRes.data.actionPlan.length === 10, 'Action plan invalid');
    console.log(`   ✓ Tailored ${actionPlanRes.data.actionPlan.length}-step execution action plan generated`);

    console.log('5. Testing POST /api/export-planner/saved (Saving export plan)...');
    const savePlanRes = await apiFetch('/api/export-planner/saved', {
      method: 'POST',
      cookie: userCookie,
      body: {
        name: 'E2E Equine Export Strategy to UAE',
        hsCode: '010121',
        product: 'Purebred Breeding Horses',
        originCountry: 'India',
        targetCountry: 'United Arab Emirates',
        price: 1500,
        quantity: 20,
        shipping: 5000,
        insurance: 800,
        otherCosts: 1200,
        targetSellingPrice: 2200,
      },
    });
    assert(savePlanRes.status === 201, `Expected 201 for saving plan, got ${savePlanRes.status}`);
    const savedPlanId = savePlanRes.data.id;
    assert(savedPlanId > 0, 'Invalid saved plan ID returned');
    console.log(`   ✓ Saved export plan created successfully (ID: ${savedPlanId})`);

    console.log('6. Testing GET /api/export-planner/saved & GET /api/export-planner/saved/[id]...');
    const getSavedRes = await apiFetch('/api/export-planner/saved', { cookie: userCookie });
    assert(getSavedRes.status === 200, `Expected 200 for get saved, got ${getSavedRes.status}`);
    assert(getSavedRes.data.plans.some((p) => p.id === savedPlanId), 'Saved plan not listed');

    const getSingleRes = await apiFetch(`/api/export-planner/saved/${savedPlanId}`, { cookie: userCookie });
    assert(getSingleRes.status === 200, `Expected 200 for single saved plan, got ${getSingleRes.status}`);
    assert(getSingleRes.data.hsCode === '010121', 'Saved plan HS code string corrupted');
    console.log(`   ✓ Retrieved saved export plan (Score: ${getSingleRes.data.analysisResult.scores.finalOpportunityScore}/100)`);

    console.log('7. Testing POST /api/export-planner/saved/[id]/rerun (Re-evaluating with live metrics)...');
    const planRerunRes = await apiFetch(`/api/export-planner/saved/${savedPlanId}/rerun`, {
      method: 'POST',
      cookie: userCookie,
    });
    assert(planRerunRes.status === 200, `Expected 200 for plan rerun, got ${planRerunRes.status}`);
    assert(planRerunRes.data.analysis && planRerunRes.data.analysis.scores, 'Rerun failed to generate analysis');
    console.log('   ✓ Plan successfully re-evaluated with fresh repository telemetry');

    console.log('8. Testing Saved Plan Ownership Isolation & Deletion...');
    // Unauthenticated access
    const unauthPlan = await apiFetch(`/api/export-planner/saved/${savedPlanId}`);
    assert(unauthPlan.status === 401, `Expected 401 for unauth plan access, got ${unauthPlan.status}`);

    // Delete plan
    const deletePlanRes = await apiFetch(`/api/export-planner/saved/${savedPlanId}`, {
      method: 'DELETE',
      cookie: userCookie,
    });
    assert(deletePlanRes.status === 200, `Expected 200 for plan deletion, got ${deletePlanRes.status}`);
    console.log('   ✓ Export plan deleted and ownership boundaries verified');

    // Clean up test user from DB
    await conn.query('DELETE FROM users WHERE id = ?', [userId]);

    console.log('\n====================================================');
    console.log('🎉 ALL END-TO-END (E2E) TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================\n');
  } finally {
    await conn.end();
  }
}

runE2ETests().catch((err) => {
  console.error('\n❌ E2E TEST RUNNER ENCOUNTERED AN ERROR:');
  console.error(err);
  process.exit(1);
});
