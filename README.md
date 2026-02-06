# Amplify Lambda Deploy (GitHub Actions)

This repo now contains a minimal [AWS Amplify Gen 2](https://docs.amplify.aws/) backend with one Node.js Lambda function:

- `amplify/functions/hello-lambda/handler.ts`

Deployment is handled by:

- `.github/workflows/deploy-amplify-lambda.yml`

## Required GitHub Secrets

Set these in your repository settings:

- `AMPLIFY_APP_ID`: Your Amplify app ID.
- `AWS_REGION`: AWS region for your Amplify app (example: `us-east-1`).
- `AWS_ROLE_TO_ASSUME`: IAM role ARN that GitHub Actions can assume via OIDC.

## One-Time Amplify Setup

1. Create an Amplify app and connect this repository branch (for example, `main`).
2. In Amplify Hosting branch settings, disable automatic builds for that branch.
3. Ensure the role in `AWS_ROLE_TO_ASSUME` can deploy Amplify backend resources for this app.

## How Deploy Works

On push to `main` (or manual `workflow_dispatch`), GitHub Actions runs:

```sh
npx ampx pipeline-deploy --branch "$GITHUB_REF_NAME" --app-id "$AMPLIFY_APP_ID"
```

This deploys the backend defined in `amplify/backend.ts`, including the Lambda function.
