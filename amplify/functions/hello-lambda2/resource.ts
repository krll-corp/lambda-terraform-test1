import { defineFunction, secret } from "@aws-amplify/backend";

export const helloLambda2 = defineFunction({
  name: "hello-lambda2",
  entry: "./handler.ts",
  environment: {
    DB_CLUSTER_ARN: secret("DB_CLUSTER_ARN"),
    DB_SECRET_ARN: secret("DB_SECRET_ARN"),
    DB_NAME: secret("DB_NAME"),
  },
});
