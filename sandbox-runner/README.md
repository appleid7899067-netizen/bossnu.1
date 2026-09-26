# BOSSNU isolated Bash runner

Separate runner for Bash execution. The main web app never executes shell commands itself.

POST /execute:
```json
{"language":"bash","code":"echo hello","stdin":""}
```

Limits:
- 5 second wall-clock timeout
- 32 KiB script input
- 64 KiB output per stream
- temporary workspace removed after each run
- minimal environment
- no shell profile files

Recommended container isolation:
```bash
docker run --rm --network none --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m --memory=256m --cpus=0.5 -p 8787:8787 bossnu-bash-sandbox
```

Do not mount the host filesystem or Docker socket. Configure the web app with VITE_SANDBOX_RUNNER_URL.
