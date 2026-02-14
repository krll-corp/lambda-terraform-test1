import { AuroraDSQLClient } from "@aws/aurora-dsql-node-postgres-connector";

async function queryUsers() {
  // Replace <CLUSTER_ENDPOINT> with your actual DSQL cluster endpoint
  // It should look like: your-cluster.dsql.eu-central-1.on.aws
  const client = new AuroraDSQLClient({
    host: "5jtrgpcbnppheo6ekteiqajkjq.dsql.eu-central-1.on.aws", // Your DSQL cluster endpoint
    user: "admin", // or your database username
    region: "eu-central-1" // Optional, can be auto-detected from hostname
  });

  try {
    await client.connect();
    const result = await client.query("SELECT * FROM users");
    console.log("Users:", result.rows);
    return result.rows;
  } catch (error) {
    console.error("Error querying users:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Call the function
queryUsers();

