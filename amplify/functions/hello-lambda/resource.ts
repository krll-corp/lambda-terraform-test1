import { defineFunction } from "@aws-amplify/backend";

export const helloLambda = defineFunction({
  name: "hello-lambda",
  entry: "./handler.ts",
});
