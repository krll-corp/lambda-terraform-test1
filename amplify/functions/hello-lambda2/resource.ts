import { defineFunction } from "@aws-amplify/backend";

export const helloLambda2 = defineFunction({
  name: "hello-lambda2",
  entry: "./handler.ts",
});
