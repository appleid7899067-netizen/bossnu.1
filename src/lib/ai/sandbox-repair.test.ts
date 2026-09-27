import { test } from "node:test";
import assert from "node:assert/strict";
import { commandSignature, diagnoseFailure, lintRunCall, normalizeRunCall } from "./sandbox-tool.ts";
import type { RunCall, ToolResult } from "./sandbox-tool.ts";

const bash = (command: string): RunCall => ({ language: "bash", command });

test("raw python source is wrapped into a heredoc before it reaches the runner", () => {
  const prepared = normalizeRunCall({ language: "python", command: 'import json\nprint(json.dumps({"a": 1}))' });
  assert.equal(prepared.changed, true);
  assert.match(prepared.call.command, /^cat > \/tmp\/agent-run\.py <<'AGENT_PY'/);
  assert.match(prepared.call.command, /\nAGENT_PY\npython3 \/tmp\/agent-run\.py$/);
  assert.match(prepared.call.command, /import json/);
});

test("raw node, go, rust, java and c++ sources are wrapped too", () => {
  const cases: Array<[RunCall["language"], string, RegExp]> = [
    ["node", 'const a = 1;\nconsole.log("x", a);', /node \/tmp\/agent-run\.mjs$/],
    ["go", "package main\nfunc main() {}", /go run \/tmp\/agent-run\.go$/],
    ["rust", "fn main() { println!(\"hi\"); }", /rustc -O \/tmp\/agent-run\.rs/],
    ["java", "public class Main { public static void main(String[] a) {} }", /cat > \/tmp\/Main\.java[\s\S]*javac Main\.java && java Main$/],
    ["cpp", '#include <iostream>\nint main() { std::cout << "hi"; }', /g\+\+ -std=c\+\+17 \/tmp\/agent-run\.cpp/],
  ];
  for (const [language, command, expected] of cases) {
    const prepared = normalizeRunCall({ language, command });
    assert.equal(prepared.changed, true, language);
    assert.match(prepared.call.command, expected, language);
  }
});

test("real shell commands are left exactly as the model wrote them", () => {
  for (const command of ["python3 -c \"print(1)\"", "npm test", "cd project && ls -la", "pip install requests && python3 main.py"]) {
    const prepared = normalizeRunCall({ language: command.startsWith("python") || command.startsWith("pip") ? "python" : "node", command });
    assert.equal(prepared.changed, false, command);
    assert.equal(prepared.call.command, command);
  }
});

test("markdown fences and stray protocol tags are stripped from a command", () => {
  const prepared = normalizeRunCall({ language: "node", command: '```js\nconst a = 1;\nconsole.log(a);\n```' });
  assert.ok(!prepared.call.command.includes("```"));
  assert.match(prepared.call.command, /\nAGENT_JS\nnode /);

  const leaky = normalizeRunCall(bash('<run lang="bash">\necho hi\n</run>'));
  assert.ok(!/<\/?run/.test(leaky.call.command));
  assert.match(leaky.call.command, /echo hi/);
});

test("a heredoc delimiter that already appears in the body is renamed", () => {
  const prepared = normalizeRunCall({ language: "python", command: "print(1)\nAGENT_PY\nprint(2)" });
  assert.match(prepared.call.command, /<<'AGENT_PY_X'/);
});

test("lint passes a healthy command and rejects broken ones without running them", () => {
  assert.deepEqual(lintRunCall(bash('echo "ok" && ls -la')), { ok: true, problems: [] });
  assert.deepEqual(lintRunCall(bash("cat > f.py <<'PY'\nprint(1)\nPY\npython3 f.py")), { ok: true, problems: [] });

  const quote = lintRunCall(bash('echo "unbalanced'));
  assert.equal(quote.ok, false);
  assert.match(quote.problems.join(" "), /เปิด\/ปิดไม่ครบ/);

  const heredoc = lintRunCall(bash("cat > f.py <<'PY'\nprint(1)"));
  assert.equal(heredoc.ok, false);
  assert.match(heredoc.problems.join(" "), /heredoc PY ไม่ได้ปิด/);

  assert.equal(lintRunCall(bash("")).ok, false);
  assert.match(lintRunCall(bash("x".repeat(32001))).problems.join(" "), /ยาวเกิน/);
  assert.match(lintRunCall(bash('<run lang="bash">echo hi</run>')).problems.join(" "), /protocol leak/);
  assert.match(lintRunCall(bash("cd project\nnpm test")).problems.join(" "), /cwd จะรีเซ็ต/);
});

test("quotes inside a heredoc do not trip the lint", () => {
  const call = bash("cat > f.py <<'PY'\nprint(\"it's fine\")\nPY\npython3 f.py");
  assert.equal(lintRunCall(call).ok, true);
});

test("failures are diagnosed into concrete repair steps", () => {
  const missingModule = diagnoseFailure({
    status: "error",
    exitCode: 1,
    stderr: 'Traceback (most recent call last):\n  File "x.py", line 1\nModuleNotFoundError: No module named requests',
  });
  assert.match(missingModule.join("\n"), /pip install/);
  assert.match(missingModule.join("\n"), /ModuleNotFoundError: No module named requests/);

  assert.match(diagnoseFailure({ status: "error", exitCode: 127, output: "bash: pytest: command not found" }).join("\n"), /คำสั่งไม่มีใน runner/);
  assert.match(
    diagnoseFailure({ status: "error", exitCode: 1, output: "AssertionError: expected 4 to equal 5\n1 failing" }).join("\n"),
    /ห้ามแก้เทสต์เพื่อให้ผ่าน/,
  );
  assert.match(diagnoseFailure({ status: "error", exitCode: 1, stderr: "npm ERR! Missing script: \"test\"" }).join("\n"), /package\.json/);
  assert.match(diagnoseFailure({ status: "error", exitCode: 1, stderr: "src/a.ts(3,5): error TS2322: SyntaxError: unexpected token" }).join("\n"), /syntax/i);
  assert.match(diagnoseFailure({ status: "timeout", error: "Timed out after 30000ms" }).join("\n"), /หมดเวลา/);
});

test("successful runs are never diagnosed", () => {
  assert.deepEqual(diagnoseFailure({ status: "success", exitCode: 0, stdout: "all good" }), []);
  assert.deepEqual(diagnoseFailure({ status: "error", exitCode: 1 }), []);
});

test("command signatures ignore whitespace and case but keep the runtime", () => {
  assert.equal(commandSignature(bash("NPM   test")), commandSignature(bash("npm test")));
  assert.notEqual(commandSignature(bash("npm test")), commandSignature({ language: "node", command: "npm test" }));
});

test("diagnosis never invents hints for an empty failure", () => {
  const result: ToolResult = { status: "error", exitCode: 1 };
  assert.deepEqual(diagnoseFailure(result), []);
});
