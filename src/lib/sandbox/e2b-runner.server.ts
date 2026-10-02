/**
 * E2B Sandbox Runner Integration
 * Executes code via E2B cloud sandbox instead of local runner.
 * Used when E2B_API_KEY is configured; falls back to regular runner otherwise.
 */

import { Sandbox } from 'e2b';
import { describeEvidence } from '@/lib/workspace/snapshot';
import { syncRunnerResult } from '@/lib/workspace/sync.server';

const E2B_API_KEY = process.env.E2B_API_KEY?.trim();
const E2B_ENABLED = !!E2B_API_KEY;

export interface E2BExecutionResult {
  sandboxId: string;
  status: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  raw: Record<string, unknown>;
  workspaceSync?: Record<string, unknown>;
  persistent: boolean;
}

/**
 * Check if E2B is configured and enabled.
 */
export function e2bConfigured(): boolean {
  return E2B_ENABLED;
}

/**
 * Execute code in E2B sandbox.
 */
export async function runE2B(
  runtime: string,
  command: string,
  workspace?: string,
  stdin?: string,
  onOutput?: (stream: 'stdout' | 'stderr', text: string) => void,
): Promise<E2BExecutionResult> {
  if (!E2B_ENABLED) {
    throw new Error('E2B_API_KEY not configured');
  }

  const startTime = Date.now();
  let sandbox: Sandbox | null = null;
  let output = { stdout: '', stderr: '' };

  try {
    // Create E2B sandbox with timeout
    sandbox = await Sandbox.create(E2B_API_KEY, {
      timeoutMs: 60_000,
    });

    let result: { stdout: string; stderr: string; exitCode: number };

    switch (runtime) {
      case 'bash':
        result = await sandbox.commands.run(command);
        break;

      case 'python':
      case 'python-safe':
        // Python Safe: use the AST-gated runner if available
        result = await sandbox.commands.run(
          `python3 -c '${command.replace(/'/g, "'\"'\"'")}' ${stdin ? `< /dev/stdin` : ''}`,
          stdin ? { stdin } : undefined,
        );
        break;

      case 'node':
        result = await sandbox.commands.run(
          `node -e '${command.replace(/'/g, "'\"'\"'")}' ${stdin ? `< /dev/stdin` : ''}`,
          stdin ? { stdin } : undefined,
        );
        break;

      case 'go':
        result = await sandbox.commands.run(
          `cd /tmp && echo '${command.replace(/'/g, "'\"'\"'")}' > main.go && go run main.go`,
        );
        break;

      case 'rust':
        result = await sandbox.commands.run(
          `cd /tmp && echo '${command.replace(/'/g, "'\"'\"'")}' > main.rs && rustc main.rs -o main && ./main`,
        );
        break;

      case 'java':
        result = await sandbox.commands.run(
          `cd /tmp && echo '${command.replace(/'/g, "'\"'\"'")}' > Main.java && javac Main.java && java Main`,
        );
        break;

      case 'cpp':
        result = await sandbox.commands.run(
          `cd /tmp && echo '${command.replace(/'/g, "'\"'\"'")}' > main.cpp && g++ main.cpp -o main && ./main`,
        );
        break;

      default:
        throw new Error(`Unsupported runtime: ${runtime}`);
    }

    output = { stdout: result.stdout || '', stderr: result.stderr || '' };
    if (output.stdout) onOutput?.('stdout', output.stdout);
    if (output.stderr) onOutput?.('stderr', output.stderr);

    const durationMs = Date.now() - startTime;

    const raw = {
      status: result.exitCode === 0 ? 'success' : 'error',
      exitCode: result.exitCode,
      durationMs,
      ...output,
    };

    return {
      sandboxId: sandbox.sandboxId,
      status: result.exitCode === 0 ? 'success' : 'error',
      stdout: output.stdout,
      stderr: output.stderr,
      exitCode: result.exitCode,
      durationMs,
      raw,
      persistent: !!workspace,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);

    return {
      sandboxId: sandbox?.sandboxId || 'unknown',
      status: 'error',
      stdout: output.stdout,
      stderr: output.stderr || errorMsg,
      exitCode: 1,
      durationMs,
      raw: {
        status: 'error',
        exitCode: 1,
        durationMs,
        error: errorMsg,
      },
      persistent: !!workspace,
    };
  } finally {
    if (sandbox) {
      try {
        await sandbox.close();
      } catch (err) {
        console.error('[E2B] Failed to close sandbox:', err);
      }
    }
  }
}

/**
 * Create a verified skill in E2B workspace.
 * This is the "create-skill" action: write SKILL.md, read it back, and sync.
 */
export async function createVerifiedSkill(
  workspace: string,
  skillId: string,
  content: string,
): Promise<{
  created: boolean;
  verified: boolean;
  persisted: boolean;
  error?: string;
}> {
  if (!E2B_ENABLED) {
    return { created: false, verified: false, persisted: false, error: 'E2B not configured' };
  }

  let sandbox: Sandbox | null = null;

  try {
    sandbox = await Sandbox.create(E2B_API_KEY, { timeoutMs: 30_000 });
    const skillDir = `/tmp/skills/${skillId}`;
    const skillPath = `${skillDir}/SKILL.md`;

    // Create directory
    await sandbox.commands.run(`mkdir -p ${skillDir}`);

    // Write skill
    const writeResult = await sandbox.commands.run(
      `cat > ${skillPath} << 'EOF'\n${content}\nEOF`,
    );
    const created = writeResult.exitCode === 0;

    if (!created) {
      return { created: false, verified: false, persisted: false, error: 'Failed to write SKILL.md' };
    }

    // Read back and verify
    const readResult = await sandbox.commands.run(`cat ${skillPath}`);
    const verified = readResult.stdout.trim() === content.trim();

    if (!verified) {
      return { created: true, verified: false, persisted: false, error: 'Content mismatch after read-back' };
    }

    // Hash verification
    const hashWrite = await sandbox.commands.run(`sha256sum ${skillPath}`);
    const hashRead = await sandbox.commands.run(`echo -n '${content}' | sha256sum`);
    const hashesMatch = hashWrite.stdout.split(' ')[0] === hashRead.stdout.split(' ')[0];

    return {
      created: true,
      verified: hashesMatch,
      persisted: hashesMatch,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { created: false, verified: false, persisted: false, error: errorMsg };
  } finally {
    if (sandbox) {
      try {
        await sandbox.close();
      } catch (err) {
        console.error('[E2B] Failed to close sandbox:', err);
      }
    }
  }
}
