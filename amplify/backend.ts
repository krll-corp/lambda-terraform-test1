import { defineBackend } from "@aws-amplify/backend";
import { helloLambda } from "./functions/hello-lambda2/resource.js";

defineBackend({
  helloLambda,
});
