# BFFDex AI Security and Transaction-Execution Gate

## Default operating posture

`BFFDEX_TRANSACTION_SIGNING_ENABLED` is **false by default**. With the gate disabled, the application may parse a payment link for review, but it must not load a signer or submit a transaction. A payment recipient must be explicitly present in the EIP-681 link; the application does not apply a hidden recipient fallback.

## Preconditions for enabling transaction execution

Before setting `BFFDEX_TRANSACTION_SIGNING_ENABLED=true`, complete and record all of the following:

1. Use a dedicated wallet with a documented custody and recovery procedure. Do not use an administrator, treasury, or personal wallet directly from an application runtime.
2. Complete a Base Sepolia rehearsal that covers successful payment, invalid recipient, unsupported token, invalid amount, replay attempt, voice-verification rejection, persistence failure, QuickBooks failure, and EAS failure.
3. Obtain independent review of the transaction path, environment-variable handling, recipient allowlisting policy, and voice-verification design.
4. Use managed secrets with least-privilege runtime access and rotate any key that has been used in an unreviewed environment.
5. Define recipient approval, transaction-limit, incident-response, and rollback procedures.
6. Add automated tests for link parsing and every rejection path before enabling live signing.

## Current enforced boundaries

The payment execution code accepts only explicit, syntactically valid recipients, the canonical Base USDC contract, Base chain ID `8453`, positive integer USDC base units, and a maximum amount of 500 USDC. Amounts above that limit require a separate approved flow; they must not be silently retried or routed elsewhere.

> This document is an engineering control checklist, not a security audit or authorization to operate a payments service.
