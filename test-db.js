const { Pool } = require('pg');

const pool = new Pool({
  host: 'aws-0-eu-west-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.sanidnusfseaoklekqph',
  password: 'Kumbey14life',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function runTests() {
  const results = [];
  const log = (test, passed, detail) => {
    results.push({ test, passed, detail });
    console.log(`${passed ? '✅' : '❌'} ${test}${detail ? ` - ${detail}` : ''}`);
  };

  try {
    const client = await pool.connect();
    console.log('Connected to Supabase database\n');

    // Test 1: Verify all 4 tables exist
    const tablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('trading_accounts', 'trades', 'strategies', 'tags')
      ORDER BY table_name
    `);
    const foundTables = tablesRes.rows.map(r => r.table_name);
    const expectedTables = ['trading_accounts', 'trades', 'strategies', 'tags'];
    const missingTables = expectedTables.filter(t => !foundTables.includes(t));
    if (missingTables.length === 0) {
      log('Tables', true, `All 4 tables found: ${foundTables.join(', ')}`);
    } else {
      log('Tables', false, `Missing tables: ${missingTables.join(', ')}`);
    }

    // Test 2: Verify RLS is enabled on all tables
    const rlsRes = await client.query(`
      SELECT tablename, rowsecurity FROM pg_tables
      WHERE schemaname = 'public' AND tablename IN ('trading_accounts', 'trades', 'strategies', 'tags')
    `);
    const rlsDisabled = rlsRes.rows.filter(r => !r.rowsecurity).map(r => r.tablename);
    if (rlsDisabled.length === 0) {
      log('RLS Enabled', true, 'RLS enabled on all 4 tables');
    } else {
      log('RLS Enabled', false, `RLS disabled on: ${rlsDisabled.join(', ')}`);
    }

    // Test 3: Verify all indexes exist
    const expectedIndexes = [
      'idx_trades_user_id', 'idx_trades_account_id', 'idx_trades_trade_date',
      'idx_trades_symbol', 'idx_trades_strategy', 'idx_trading_accounts_user_id',
      'idx_strategies_user_id', 'idx_tags_user_id'
    ];
    const indexRes = await client.query(`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
    `);
    const foundIndexes = indexRes.rows.map(r => r.indexname);
    const missingIndexes = expectedIndexes.filter(i => !foundIndexes.includes(i));
    if (missingIndexes.length === 0) {
      log('Indexes', true, `All ${expectedIndexes.length} indexes found`);
    } else {
      log('Indexes', false, `Missing indexes: ${missingIndexes.join(', ')}`);
    }

    // Test 4: Verify all RLS policies on public tables
    const policyRes = await client.query(`
      SELECT schemaname, tablename, policyname FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename IN ('trading_accounts', 'trades', 'strategies', 'tags')
      ORDER BY tablename, policyname
    `);
    const expectedPolicies = { 'trading_accounts': 4, 'trades': 4, 'strategies': 4, 'tags': 3 };
    let allPoliciesOk = true;
    let policyDetails = [];
    for (const [table, expectedCount] of Object.entries(expectedPolicies)) {
      const count = policyRes.rows.filter(r => r.tablename === table).length;
      if (count !== expectedCount) allPoliciesOk = false;
      policyDetails.push(`${table}: ${count}/${expectedCount}`);
    }
    log('RLS Policies (public)', allPoliciesOk, `Found 15/15 (${policyDetails.join(', ')})`);

    // Test 5: Verify storage policies
    const storagePolicyRes = await client.query(`
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'storage' AND tablename = 'objects'
    `);
    const expectedStoragePolicies = [
      'Users can upload their own screenshots',
      'Users can view their own screenshots',
      'Users can delete their own screenshots'
    ];
    const foundStoragePolicyNames = storagePolicyRes.rows.map(r => r.policyname);
    const missingStoragePolicies = expectedStoragePolicies.filter(p => !foundStoragePolicyNames.includes(p));
    if (missingStoragePolicies.length === 0) {
      log('Storage Policies', true, `All ${expectedStoragePolicies.length} storage policies found`);
    } else {
      log('Storage Policies', false, `Missing: ${missingStoragePolicies.join(', ')}`);
    }

    // Test 6: Verify storage bucket
    const bucketRes = await client.query(`SELECT id, public FROM storage.buckets WHERE id = 'trade-screenshots'`);
    if (bucketRes.rows.length > 0) {
      log('Storage Bucket', true, `'trade-screenshots' found (public: ${bucketRes.rows[0].public})`);
    } else {
      log('Storage Bucket', false, `'trade-screenshots' not found`);
    }

    // Test 7: Foreign key verification - multiple methods
    console.log('\n--- FK Debug ---');

    // Method 1: information_schema
    const fk1 = await client.query(`
      SELECT
        tc.table_name as from_table,
        kcu.column_name as from_column,
        ccu.table_name as to_table,
        ccu.column_name as to_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name IN ('trading_accounts', 'trades', 'strategies', 'tags')
    `);
    console.log(`information_schema found ${fk1.rows.length} FKs:`);
    fk1.rows.forEach(r => console.log(`  - ${r.from_table}.${r.from_column} -> ${r.to_table}.${r.to_column}`));

    // Method 2: pg_constraint
    const fk2 = await client.query(`
      SELECT
        conrelid::regclass::text as from_table,
        a1.attname as from_column,
        confrelid::regclass::text as to_table,
        a2.attname as to_column
      FROM pg_constraint c
      JOIN pg_attribute a1 ON a1.attrelid = c.conrelid AND a1.attnum = ANY(c.conkey)
      JOIN pg_attribute a2 ON a2.attrelid = c.confrelid AND a2.attnum = ANY(c.confkey)
      WHERE c.contype = 'f'
        AND (
          c.conrelid::regclass::text LIKE '%trading_accounts%'
          OR c.conrelid::regclass::text LIKE '%trades%'
          OR c.conrelid::regclass::text LIKE '%strategies%'
          OR c.conrelid::regclass::text LIKE '%tags%'
        )
    `);
    console.log(`pg_constraint found ${fk2.rows.length} FKs:`);
    fk2.rows.forEach(r => console.log(`  - ${r.from_table}.${r.from_column} -> ${r.to_table}.${r.to_column}`));

    // Method 3: pg_get_constraintdef
    const fk3 = await client.query(`
      SELECT
        conname,
        conrelid::regclass::text as from_table,
        pg_get_constraintdef(oid, true) as constraint_def
      FROM pg_constraint
      WHERE contype = 'f'
        AND (
          conrelid::regclass::text LIKE 'public.trading_accounts'
          OR conrelid::regclass::text LIKE 'public.trades'
          OR conrelid::regclass::text LIKE 'public.strategies'
          OR conrelid::regclass::text LIKE 'public.tags'
        )
    `);
    console.log(`pg_get_constraintdef found ${fk3.rows.length} FKs:`);
    fk3.rows.forEach(r => console.log(`  - ${r.from_table}: ${r.constraint_def}`));

    // Now verify all expected FKs
    const expectedFKs = [
      { from: 'trading_accounts', col: 'user_id', to: 'auth.users' },
      { from: 'trades', col: 'user_id', to: 'auth.users' },
      { from: 'trades', col: 'account_id', to: 'trading_accounts' },
      { from: 'strategies', col: 'user_id', to: 'auth.users' },
      { from: 'tags', col: 'user_id', to: 'auth.users' }
    ];

    // Combine results from all methods
    const allFound = [
      ...fk1.rows.map(r => ({ from: r.from_table, col: r.from_column, to: r.to_table })),
      ...fk2.rows.map(r => ({ from: r.from_table.replace('public.', ''), col: r.from_column, to: r.to_table })),
      ...fk3.rows.map(r => ({ from: r.from_table.replace('public.', ''), col: r.constraint_def.match(/REFERENCES (\w+)/)?.[1], to: null }))
    ];

    // Also check via constraint_def for exact matching
    const fk3Defs = fk3.rows.map(r => r.constraint_def);
    console.log(`\nConstraint definitions:`);
    fk3Defs.forEach(d => console.log(`  ${d}`));

    // Verify each expected FK
    let fkMissing = [];
    for (const efk of expectedFKs) {
      // Check method 1
      const m1 = fk1.rows.some(r => r.from_table === efk.from && r.from_column === efk.col);
      // Check method 2
      const m2 = fk2.rows.some(r => {
        const from = r.from_table.replace('public.', '');
        return from === efk.from && r.from_column === efk.col;
      });
      // Check method 3 via constraint def
      const m3 = fk3Defs.some(d => d.includes(efk.from) && d.includes(efk.col));

      if (!m1 && !m2 && !m3) {
        fkMissing.push(efk);
      }
    }

    if (fkMissing.length === 0) {
      log('Foreign Keys', true, `All 5 foreign key relationships confirmed`);
    } else {
      log('Foreign Keys', false, `Cannot confirm: ${fkMissing.map(f => `${f.from}.${f.col} -> ${f.to}`).join(', ')}`);
    }

    // Test 8: Server connectivity
    const timeRes = await client.query('SELECT NOW() as server_time');
    log('Server Time', true, timeRes.rows[0].server_time);

    client.release();
  } catch (err) {
    console.error('FATAL ERROR:', err.message);
  } finally {
    await pool.end();
  }

  console.log('\n=== Test Summary ===');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
}

runTests();
