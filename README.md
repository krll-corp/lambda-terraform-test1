# Amplify Lambda Deploy (GitHub Actions)

This repo now contains a minimal [AWS Amplify Gen 2](https://docs.amplify.aws/) backend with one Node.js Lambda function:

- `amplify/functions/hello-lambda2/handler.ts`

The Lambda now executes SQL against Aurora/RDS Data API and returns rows as JSON.

Deployment is handled by:

- `.github/workflows/deploy-amplify-lambda.yml`
- `amplify.yml` (Amplify Console buildspec override, if branch auto-build is enabled)

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

If Amplify Console branch builds are enabled, `/Users/kyryll/Downloads/lambda-terraform-test1/amplify.yml` provides:

- a backend no-op (backend deploy is done by GitHub Actions to avoid duplicate/racing deploys)
- a minimal required `frontend` build/artifact definition

## DB Secrets For Lambda

Set these Amplify backend secrets for the branch/environment:

- `DB_CLUSTER_ARN`
- `DB_SECRET_ARN`
- `DB_NAME`

The function uses default SQL:

```sql
SELECT * FROM users;
```

You can override SQL per request (demo mode only) using `sql` in query string or JSON body.

## Calling Lambda URL

`amplify/backend.ts` creates a Lambda Function URL and exposes it in backend outputs as:

- `custom.helloLambda2Url`

Examples:

```sh
curl "$LAMBDA_URL"
curl "$LAMBDA_URL?sql=SELECT%201"
curl -X POST "$LAMBDA_URL" -H "content-type: application/json" -d '{"sql":"SELECT now()"}'
```

## Show DB Data On Amplify Domain

The hosted site (`amplify.yml`) now calls Lambda from the browser.

Set Amplify Hosting environment variable:

- `LAMBDA_URL` = your function URL (for `hello-lambda2`)

Where to find it:

- AWS Console -> Lambda -> `hello-lambda2` -> Function URL

After setting `LAMBDA_URL`, trigger a new Amplify build so the frontend picks it up.

## Direct Lambda v2 (GitHub Actions)

Workflow:

- `/Users/kyryll/Downloads/lambda-terraform-test1/.github/workflows/deploy-direct-lambda-v2.yml`

Trigger:

- push to branch `codex/v2`
- manual `workflow_dispatch`

Behavior:

- deploys with `aws lambda update-function-code` only
- does not call `create-function` or `update-function-configuration`

Required setup (once, manual):

1. Create a new dedicated Lambda function (recommended name: `db-query-direct-v2-isolated`).
2. Ensure runtime/handler/role/env/url are already configured:
   handler: `index.handler`
3. Set function environment variables for Aurora DSQL:
   - `DSQL_HOST` (required, example: `xxxx.dsql.eu-central-1.on.aws`)
   - `DSQL_USER` (optional, default: `admin`)
   - `DSQL_DEFAULT_SQL` (optional, default: `SELECT * FROM users;`)
4. Ensure the Lambda execution role has permissions to connect/query your Aurora DSQL resources.
5. Do not set long-lived AWS access keys in Lambda env vars; Lambda should use execution-role credentials.
6. Optional: set repo variable `DIRECT_LAMBDA_NAME` if you want a different dedicated name.
   The workflow blocks names that look like Amplify-managed lambdas.

Dependency packaging mode:

- `DIRECT_LAMBDA_INCLUDE_NODE_MODULES=true` (default): zip includes `node_modules`.
- `DIRECT_LAMBDA_INCLUDE_NODE_MODULES=false`: zip includes only `index.mjs`.
  Use this when dependencies are provided via an already-attached Lambda layer.
