// Tariff audit script — runs against live MySQL, no modifications
const mysql = require('mysql2/promise');
require('dotenv').config();

async function auditTariff() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const targetHs = '010121';

  console.log('\n======================================================');
  console.log(' TARIFF AUDIT: HS Code ' + targetHs + ' | India -> Germany');
  console.log('======================================================\n');

  // 1. Schema
  console.log('1. hs_codes TABLE SCHEMA:');
  const [cols] = await conn.query('DESCRIBE hs_codes');
  for (const c of cols) {
    console.log('   ' + c.Field + ' (' + c.Type + ') ' + (c.Key || '') + (c.Null === 'NO' ? ' NOT NULL' : ''));
  }

  // 2. Exact match
  console.log('\n2. EXACT MATCH: SELECT * FROM hs_codes WHERE code = "' + targetHs + '"');
  const [exact] = await conn.query('SELECT * FROM hs_codes WHERE code = ?', [targetHs]);
  if (exact.length > 0) {
    console.log('   FOUND:');
    for (const r of exact) {
      console.log('   id=' + r.id + ' | code=' + JSON.stringify(r.code) + ' (type=' + typeof r.code + ') | description=' + r.description);
      console.log('   bcd=' + r.bcd + '% | sws=' + r.sws + '% | igst=' + r.igst + '% | country=' + r.country);
    }
  } else {
    console.log('   NOT FOUND — will try prefix fallback');
  }

  // 3. 4-digit prefix fallback
  const prefix = targetHs.slice(0, 4);
  console.log('\n3. PREFIX FALLBACK: SELECT * FROM hs_codes WHERE code LIKE "' + prefix + '%"');
  const [prefixRows] = await conn.query(
    'SELECT * FROM hs_codes WHERE code LIKE ? ORDER BY LENGTH(code) DESC LIMIT 5',
    [prefix + '%']
  );
  if (prefixRows.length > 0) {
    console.log('   FOUND ' + prefixRows.length + ' rows:');
    for (const r of prefixRows) {
      console.log('   id=' + r.id + ' | code=' + JSON.stringify(r.code) + ' | bcd=' + r.bcd + '% | sws=' + r.sws + '% | igst=' + r.igst + '% | country=' + r.country);
    }
    const picked = prefixRows[0];
    console.log('\n   => lib/landedCost.js would USE ROW: id=' + picked.id + ' code=' + JSON.stringify(picked.code));
    console.log('      bcd=' + picked.bcd + '% | sws=' + picked.sws + '% | igst=' + picked.igst + '%');
  } else {
    console.log('   NOT FOUND — landedCost returns { available: false }');
  }

  // 4. All HS records starting with chapter 01
  console.log('\n4. ALL HS_CODES IN CHAPTER 01 (code LIKE "01%"):');
  const [chapter] = await conn.query(
    'SELECT id, code, description, bcd, sws, igst, country FROM hs_codes WHERE code LIKE ? ORDER BY code',
    ['01%']
  );
  if (chapter.length > 0) {
    for (const r of chapter) {
      console.log('   ' + r.code + ' | ' + (r.description || '').slice(0, 45).padEnd(45) + ' | BCD=' + String(r.bcd).padStart(5) + '% SWS=' + String(r.sws).padStart(5) + '% IGST=' + String(r.igst).padStart(5) + '%');
    }
  } else {
    console.log('   No records in chapter 01');
  }

  // 5. Total hs_codes count
  const [[{ total }]] = await conn.query('SELECT COUNT(*) as total FROM hs_codes');
  console.log('\n5. Total rows in hs_codes table: ' + total);

  // 6. Confirm HS code type check
  console.log('\n6. HS CODE TYPE SAFETY CHECK:');
  console.log('   targetHs variable = ' + JSON.stringify(targetHs) + ' | typeof = ' + typeof targetHs);
  console.log('   parseInt("010121") = ' + parseInt('010121', 10) + ' (NEVER used — parseInt would corrupt leading zero)');
  console.log('   String("010121").trim() = "' + String(targetHs).trim() + '" (safe — what lib/landedCost.js does)');

  await conn.end();
}

auditTariff().catch((e) => {
  console.error('Audit error:', e.message);
  process.exit(1);
});
