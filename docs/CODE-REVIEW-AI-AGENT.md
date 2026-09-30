# 🤖 Code Review Template - AI Agent Specialized

## 📊 Overview
- Project: bossnu.1 / Bossnu AI Agent
- Purpose: standardized review gate for AI-agent code before commit and deploy
- Last Updated: 2026-09-30

## 🔴 Critical Issues Checklist

- [ ] No unhandled promise rejections
- [ ] All external/network calls have explicit error handling
- [ ] No hardcoded secrets, tokens, API keys, or credentials
- [ ] Sensitive values are never written to logs, traces, or persisted memory
- [ ] No unbounded loops or retry storms
- [ ] Agent execution has a hard run/retry limit
- [ ] User/tool input is validated before execution
- [ ] Shell, sandbox, GitHub, filesystem, and network actions enforce safe boundaries
- [ ] Mutating actions have evidence/verification before being reported as successful
- [ ] Failure paths produce actionable error information
- [ ] Async resources, timers, listeners, and streams are cleaned up

## 🟡 Medium Priority Checklist

- [ ] TypeScript types are explicit at important boundaries
- [ ] Runtime validation is used for untrusted API/tool payloads
- [ ] Abort/cancellation is supported for long-running operations
- [ ] Timeouts exist for external calls
- [ ] Retries use bounded attempts and backoff where appropriate
- [ ] Memory/state growth is bounded
- [ ] Logs are structured and useful for debugging
- [ ] Agent state can recover safely after partial failure
- [ ] Tests cover success, failure, retry, and recovery paths
- [ ] Browser/client code does not assume server-only APIs exist

## 🟢 Minor Improvements

- [ ] Naming follows the project's TypeScript/React conventions
- [ ] Comments explain why important logic exists
- [ ] Dead code and unused imports are removed
- [ ] Repeated logic is consolidated where it improves reliability
- [ ] UI states clearly distinguish running, success, error, and verified states
- [ ] Documentation matches the current implementation

## 🤖 AI Agent-Specific Review

### Agent Loop
- [ ] Goal is captured before execution
- [ ] Plan is explicit enough to audit
- [ ] Each action has a bounded execution path
- [ ] Observe step records actual tool output
- [ ] Verify step checks evidence, not model claims
- [ ] Fix step executes a real corrective action
- [ ] Agent stops early after verified success
- [ ] Agent cannot loop indefinitely

### Tool Use
- [ ] Tool arguments are validated
- [ ] Tool permissions are scoped to the requested task
- [ ] Dangerous commands are blocked or sandboxed
- [ ] Tool failures are returned to the agent with useful context
- [ ] Tool output is not blindly trusted as proof of success
- [ ] External mutations are followed by verification

### Memory / Workspace
- [ ] Persistent memory has bounded size
- [ ] Secrets are redacted before persistence
- [ ] Workspace paths are normalized and traversal is blocked
- [ ] Large files have explicit size limits
- [ ] Binary data is handled intentionally
- [ ] Daily/session memory cannot grow without bound

### Streaming / UI
- [ ] Streaming errors terminate cleanly
- [ ] Stream listeners are cleaned up
- [ ] UI never reports success before verification
- [ ] Progress events represent real activity
- [ ] Duplicate stream events do not corrupt state
- [ ] Loading/error states remain usable on mobile

## 🔐 Security Review

- [ ] No secrets committed to Git
- [ ] No secrets in browser bundles
- [ ] No tokens in console logs
- [ ] Authorization is checked server-side
- [ ] User-controlled paths are sanitized
- [ ] User-controlled commands are sandboxed
- [ ] External URLs are validated where required
- [ ] File uploads enforce type and size limits
- [ ] Error responses do not expose credentials or internal secrets

## 🧪 Verification Gate

Before declaring a change complete:

1. Build succeeds.
2. Relevant tests pass.
3. The changed path is exercised.
4. Actual tool/runtime output is observed.
5. Evidence is collected.
6. The final state is verified independently where possible.
7. Only then may the agent report success.

## 📋 Review Result

### Critical
- [ ] PASS
- [ ] FAIL

### Medium
- [ ] PASS
- [ ] NEEDS FOLLOW-UP

### Minor
- [ ] PASS
- [ ] OPTIONAL

### Evidence
- Build:
- Tests:
- Runtime:
- Verification:
- Deployment:

## 📝 Review Notes

Record:
- What changed
- Why it changed
- Files affected
- Failures encountered
- Fixes applied
- Verification evidence
- Remaining known limitations

## 🚦 Pre-Commit Checklist

- [ ] No hardcoded secrets
- [ ] Error handling is complete
- [ ] Input validation is present
- [ ] Agent loops are bounded
- [ ] Retry limits are bounded
- [ ] Tests pass
- [ ] Important logs are safe
- [ ] No accidental debug code
- [ ] Git diff reviewed

## 🚀 Pre-Deploy Checklist

- [ ] Production build succeeds
- [ ] Relevant tests pass
- [ ] Lint/type checks pass when configured
- [ ] Security checks reviewed
- [ ] Environment variables are configured
- [ ] Database/schema changes are safe
- [ ] Runtime health check passes
- [ ] Critical user flow is verified
- [ ] Rollback path is known

> Rule: Never claim an action succeeded based only on model output. Report success only after observable evidence and verification.
