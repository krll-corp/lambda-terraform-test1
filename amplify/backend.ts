import { defineBackend } from "@aws-amplify/backend";
import { helloLambda2 } from "./functions/hello-lambda2/resource.js";

defineBackend({
  helloLambda2,
});
