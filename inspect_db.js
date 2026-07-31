const pool = require('./db');

async function inspectDB() {
  try {
    const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('\n=== TABLES IN DATABASE ===');
    console.log(tables);

    for (const tableName of tables) {
      const countRes = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
      const rowsRes = await pool.query(`SELECT * FROM ${tableName} ORDER BY 1 DESC LIMIT 10`);
      console.log(`\n==================================================`);
      console.log(`TABLE: ${tableName} (Total records: ${countRes.rows[0].count})`);
      console.log(`==================================================`);
      console.log(JSON.stringify(rowsRes.rows, null, 2));
    }
  } catch (err) {
    console.error('Error inspecting DB:', err);
  } finally {
    await pool.end();
  }
}

inspectDB();
