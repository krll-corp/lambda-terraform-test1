import { defineBackend } from "@aws-amplify/backend";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { FunctionUrlAuthType, HttpMethod } from "aws-cdk-lib/aws-lambda";
import { helloLambda2 } from "./functions/hello-lambda2/resource.js";

const backend = defineBackend({
  helloLambda2,
});

backend.helloLambda2.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "rds-data:ExecuteStatement",
      "rds-data:BatchExecuteStatement",
      "rds-data:BeginTransaction",
      "rds-data:CommitTransaction",
      "rds-data:RollbackTransaction",
      "secretsmanager:GetSecretValue",
    ],
    resources: ["*"],
  }),
);

const helloLambda2Url = backend.helloLambda2.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ["*"],
    allowedMethods: [HttpMethod.ALL],
    allowedHeaders: ["*"],
  },
});

backend.addOutput({
  custom: {
    helloLambda2Url: helloLambda2Url.url,
  },
});
