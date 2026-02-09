import {
  type ArrayValue,
  ExecuteStatementCommand,
  type Field,
  RDSDataClient,
} from "@aws-sdk/client-rds-data";
import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

const rds = new RDSDataClient({
  maxAttempts: 4
});

type QueryLikeEvent = {
  body?: string | null;
  queryStringParameters?: Record<string, string | undefined> | null;
  sql?: string;
};

const defaultSql = "SELECT * FROM users;";

const getSql = (event: QueryLikeEvent): string => {
  if (typeof event?.queryStringParameters?.sql === "string" && event.queryStringParameters.sql.trim()) {
    return event.queryStringParameters.sql.trim();
  }

  if (typeof event?.body === "string" && event.body.trim()) {
    try {
      const parsed = JSON.parse(event.body) as { sql?: unknown };
      if (typeof parsed.sql === "string" && parsed.sql.trim()) {

        return parsed.sql.trim();
      }
    } catch {
      // Ignore invalid JSON body and keep fallback behavior.
    }
  }

  if (typeof event?.sql === "string" && event.sql.trim()) {
    return event.sql.trim();
  }

  return defaultSql;
};

const arrayValueToValue = (arrayValue: ArrayValue): unknown => {
  if ("booleanValues" in arrayValue) {
    return arrayValue.booleanValues;
  }
  if ("longValues" in arrayValue) {
    return arrayValue.longValues;
  }
  if ("doubleValues" in arrayValue) {
    return arrayValue.doubleValues;
  }
  if ("stringValues" in arrayValue) {
    return arrayValue.stringValues;
  }
  if ("arrayValues" in arrayValue) {
    return (arrayValue.arrayValues ?? []).map((value: ArrayValue) => arrayValueToValue(value));
  }
  return null;
};

const fieldToValue = (field: Field | undefined): unknown => {
  if (!field || ("isNull" in field && field.isNull)) {
    return null;
  }

  if ("stringValue" in field) {
    return field.stringValue;
  }
  if ("longValue" in field) {
    return field.longValue;
  }
  if ("doubleValue" in field) {
    return field.doubleValue;
  }
  if ("booleanValue" in field) {
    return field.booleanValue;
  }
  if ("blobValue" in field) {
    return Array.from(field.blobValue ?? []);
  }
  if ("arrayValue" in field) {
    return field.arrayValue ? arrayValueToValue(field.arrayValue) : null;
  }

  return null;
};

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const dbClusterArn = process.env.DB_CLUSTER_ARN;
  const dbSecretArn = process.env.DB_SECRET_ARN;
  const dbName = process.env.DB_NAME;

  if (!dbClusterArn || !dbSecretArn || !dbName) {
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        error: "Missing required DB environment variables.",
        required: ["DB_CLUSTER_ARN", "DB_SECRET_ARN", "DB_NAME"],
      }),
    };
  }

  // Demo behavior: allow SQL from request; do not expose this to untrusted clients in production.
  const sql = getSql((event ?? {}) as QueryLikeEvent);

  console.log('SQL command: ', sql);
  
  try {
    const response = await rds.send(
      new ExecuteStatementCommand({
        resourceArn: dbClusterArn,
        secretArn: dbSecretArn,
        database: dbName,
        sql,
      }),
    );

    const records = (response.records ?? []).map((row: Field[]) =>
      row.map((col: Field) => fieldToValue(col)),
    );

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sql,
        time: new Date().toISOString(),
        numberOfRecordsUpdated: response.numberOfRecordsUpdated,
        records
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        error: "Failed to execute SQL statement.",
        details: error instanceof Error ? error.message : String(error),
        sql,
      }),
    };
  }
};
