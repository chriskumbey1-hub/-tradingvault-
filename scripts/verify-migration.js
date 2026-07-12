const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.sanidnusfseaoklekqph:Kumbey14life@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  await client.connect();

  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('goals', 'backtests', 'user_preferences', 'trades', 'tags', 'accounts')
    ORDER BY table_name
  `);
  console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

  const functions = await client.query(`
    SELECT routine_name FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name IN ('calculate_risk_reward', 'handle_new_user')
    ORDER BY routine_name
  `);
  console.log('Functions:', functions.rows.map(r => r.routine_name).join(', '));

  const triggers = await client.query(`
    SELECT trigger_name, event_object_table FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name
  `);
  console.log('Triggers:', triggers.rows.map(r => `${r.trigger_name} ON ${r.event_object_table}`).join(', '));

  const policies = await client.query(`
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('goals', 'backtests', 'user_preferences', 'tags')
    ORDER BY tablename, policyname
  `);
  console.log('RLS Policies:', policies.rows.map(r => `${r.policyname} (${r.tablename})`).join(', '));

  await client.end();
}

verify().catch(e => { console.error(e.message); process.exit(1); });
