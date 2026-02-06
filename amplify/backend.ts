import { defineBackend } from "@aws-amplify/backend";
import { helloLambda } from "./functions/hello-lambda/resource.js";

defineBackend({
  helloLambda,
});
