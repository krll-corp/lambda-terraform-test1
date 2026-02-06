# Amplify Lambda Deploy (GitHub Actions)

This repo now contains a minimal [AWS Amplify Gen 2](https://docs.amplify.aws/) backend with one Node.js Lambda function:

- `amplify/functions/hello-lambda/handler.ts`

Deployment is handled by:

- `.github/workflows/deploy-amplify-lambda.yml`

## Required GitHub Secrets

Set these in your repository settings:

- `AMPLIFY_APP_ID`: Your Amplify app ID.
- `AWS_REGION`: AWS region for your Amplify app (example: `us-east-1`). You can set this as either a repo variable or secret.
- `AWS_ROLE_TO_ASSUME`: IAM role ARN that GitHub Actions can assume via OIDC. Use full ARN format, for example: `arn:aws:iam::123456789012:role/github-actions-amplify-deploy`.

If you used **environment-level secrets**, the workflow job must target that environment (or the secrets resolve as empty).

## One-Time Amplify Setup

1. Create an Amplify app and connect this repository branch (for example, `main`).
2. In Amplify Hosting branch settings, disable automatic builds for that branch.
3. Configure GitHub OIDC in AWS IAM (one-time per AWS account):
   - IAM -> Identity providers -> Add provider
   - Provider type: `OpenID Connect`
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`
4. Ensure the role in `AWS_ROLE_TO_ASSUME` can deploy Amplify backend resources for this app and has a trust policy that allows this repository to assume it.

## How Deploy Works

On push to `main` (or manual `workflow_dispatch`), GitHub Actions runs:

```sh
npx ampx pipeline-deploy --branch "$GITHUB_REF_NAME" --app-id "$AMPLIFY_APP_ID"
```

This deploys the backend defined in `amplify/backend.ts`, including the Lambda function.
