const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgresql://postgres.sanidnusfseaoklekqph:Kumbey14life@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

function stripLeadingComments(stmt) {
  const lines = stmt.split('\n');
  let startIdx = 0;
  while (startIdx < lines.length) {
    const line = lines[startIdx].trim();
    if (line === '' || line.startsWith('--')) {
      startIdx++;
    } else {
      break;
    }
  }
  return lines.slice(startIdx).join('\n').trim();
}

function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];

    // Check for $$ dollar-quote delimiters (two consecutive $ characters)
    if (ch === '$' && i + 1 < sql.length && sql[i + 1] === '$') {
      inDollarQuote = !inDollarQuote;
      current += '$$';
      i++; // skip the second $
      continue;
    }

    // Split on semicolons only when outside dollar-quoted blocks
    if (ch === ';' && !inDollarQuote) {
      current += ';';
      const cleaned = stripLeadingComments(current);
      if (cleaned) {
        statements.push(cleaned);
      }
      current = '';
    } else {
      current += ch;
    }
  }

  const cleaned = stripLeadingComments(current);
  if (cleaned) {
    statements.push(cleaned);
  }

  return statements;
}

async function run() {
  const sqlFile = process.argv[2] || path.join(__dirname, '..', 'supabase', 'migration.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  try {
    await client.connect();
    console.log('Connected to Supabase database');
    console.log(`SQL file: ${sqlFile}\n`);

    const statements = splitStatements(sql);
    console.log(`Found ${statements.length} statements\n`);

    let ok = 0, skip = 0, fail = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 100).replace(/\n/g, ' ');
      try {
        await client.query(stmt);
        console.log(`[${i + 1}/${statements.length}] OK: ${preview}...`);
        ok++;
      } catch (err) {
        if (err.code === '42710' || err.code === '42P07' || err.code === '42701' ||
            err.message.includes('already exists') || err.message.includes('does not exist') ||
            err.message.includes('cannot create trigger') || err.code === '42501') {
          console.log(`[${i + 1}/${statements.length}] SKIP: ${preview}...`);
          console.log(`         Reason: ${err.message.substring(0, 120)}`);
          skip++;
        } else {
          console.error(`[${i + 1}/${statements.length}] ERROR: ${err.message.substring(0, 150)}`);
          console.error(`  SQL: ${preview}...`);
          fail++;
        }
      }
    }

    console.log(`\nDone: ${ok} OK, ${skip} skipped, ${fail} failed`);
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
  }
}

run();
