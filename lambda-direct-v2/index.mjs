import { AuroraDSQLClient } from "@aws/aurora-dsql-node-postgres-connector";

const getSql = (event = {}) => {
  const fallback = process.env.DSQL_DEFAULT_SQL || "SELECT * FROM users;";

  if (typeof event?.queryStringParameters?.sql === "string" && event.queryStringParameters.sql.trim()) {
    return event.queryStringParameters.sql.trim();
  }

  if (typeof event?.body === "string" && event.body.trim()) {
    try {
      const parsed = JSON.parse(event.body);
      if (typeof parsed?.sql === "string" && parsed.sql.trim()) {
        return parsed.sql.trim();
      }
    } catch {
      // Keep default behavior when the body is not valid JSON.
    }
  }

  if (typeof event?.sql === "string" && event.sql.trim()) {
    return event.sql.trim();
  }

  return fallback;
};

export const handler = async (event = {}) => {
  const host = process.env.DSQL_HOST;
  const user = process.env.DSQL_USER || "admin";
  const sql = getSql(event);

  if (!host) {
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*"
      },
      body: JSON.stringify({
        error: "Missing required environment variable DSQL_HOST.",
        required: ["DSQL_HOST"],
        optional: ["DSQL_USER", "DSQL_DEFAULT_SQL"]
      })
    };
  }

  const client = new AuroraDSQLClient({
    host,
    user
  });

  try {
    await client.connect();
    const result = await client.query(sql);

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*"
      },
      body: JSON.stringify({
        sql,
        time: new Date().toISOString(),
        rowCount: result?.rowCount ?? 0,
        records: result?.rows ?? []
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*"
      },
      body: JSON.stringify({
        error: "Failed to execute DSQL query.",
        details: error instanceof Error ? error.message : String(error),
        sql
      })
    };
  } finally {
    try {
      await client.end();
    } catch {
      // no-op
    }
  }
};
