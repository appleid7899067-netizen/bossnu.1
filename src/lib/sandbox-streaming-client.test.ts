import { test } from "node:test";
import assert from "node:assert/strict";
import { consumeSandboxStream, StreamCollector } from "./sandbox-streaming-client.ts";
const result = { success: true, status: "success", type: "bash", stdout: "สวัสดี" };
function stream(text: string, size = 1) {
  const data = new TextEncoder().encode(text);
  let offset = 0;
  return new ReadableStream<Uint8Array>({ pull(controller) {
    if (offset >= data.length) { controller.close(); return; }
    controller.enqueue(data.slice(offset, offset += size));
  } });
}
test("SSE preserves split UTF-8 and CRLF frames", async () => {
  const events: unknown[] = [];
  const text = ': heartbeat\r\n\r\ndata: {"type":"output","stream":"stdout","text":"สวัสดี"}\r\n\r\n' + `data: ${JSON.stringify({ type: "complete", result })}\r\n\r\n`;
  assert.deepEqual(await consumeSandboxStream(stream(text), e => events.push(e)), result);
  assert.equal(events.length, 2);
});
test("multiline SSE data and EOF without blank line", async () => {
  const text = `data: {"type":"complete",\ndata: "result":${JSON.stringify(result)}}`;
  assert.deepEqual(await consumeSandboxStream(stream(text)), result);
});
test("missing completion preserves backend error", async () => {
  const value = await consumeSandboxStream(stream('data: {"type":"error","error":"runner offline"}\n\ndata: [DONE]\n\n'));
  assert.equal(value.error, "runner offline"); assert.equal(value.success, false);
});
test("malformed JSON and invalid completion fail explicitly", async () => {
  for (const data of ['no-json', '{"type":"complete","result":{}}']) {
    await assert.rejects(consumeSandboxStream(stream(`data: ${data}\n\n`)));
  }
});
test("handler errors are not swallowed", async () => {
  await assert.rejects(consumeSandboxStream(stream('data: {"type":"status","status":"queued"}\n\n'), () => { throw Error("handler"); }), /handler/);
});
test("overlarge SSE input is rejected", async () => {
  await assert.rejects(consumeSandboxStream(stream('data: ' + 'x'.repeat(1_000_001), 32768)), /too large/);
});
test("collector keeps bounded output and status history", () => {
  const collector = new StreamCollector();
  for (let i = 0; i < 40; i++) collector.handle({ type: "status", status: String(i) });
  collector.handle({ type: "output", stream: "stdout", text: 'x'.repeat(100000) });
  assert.equal(collector.steps.length, 30); assert.equal(collector.output.length, 64000);
});
test("reader is cancelled after terminal completion", async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "complete", result })}\n\n`)); }, cancel() { cancelled = true; } });
  await consumeSandboxStream(body); assert.equal(cancelled, true);
});
