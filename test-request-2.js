import { auroraDSQLPostgres } from '@aws/aurora-dsql-postgresjs-connector';

async function queryUsers() {
  // Replace with your actual DSQL cluster endpoint
  const sql = auroraDSQLPostgres({
    host: '5btrduwykeleaeetqqlr6kouau.dsql.eu-central-1.on.aws',
    username: 'admin',
    region: 'eu-central-1' // Optional, auto-detected from hostname
  });

  try {
    const users = await sql`SELECT * FROM users`;
    console.log("Users:", users);
    return users;
  } catch (error) {
    console.error("Error querying users:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Call the function
queryUsers();

