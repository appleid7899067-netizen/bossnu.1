import { test } from "node:test";
import assert from "node:assert/strict";
import { isTextFile, messageForModel, readAttachments, MAX_ATTACHMENTS, MAX_ATTACHMENT_BYTES } from "./attachments.ts";
import { conversationToMarkdown, parseBackup } from "./backup.ts";

const file = (name: string, content: string, type = "") => new File([content], name, { type });

test("attachments: text and code files are accepted, binaries are not", () => {
  assert.equal(isTextFile({ name: "notes.md", type: "" }), true);
  assert.equal(isTextFile({ name: "main.py", type: "" }), true);
  assert.equal(isTextFile({ name: "data.bin", type: "text/plain" }), true);
  assert.equal(isTextFile({ name: "photo.png", type: "image/png" }), false);
});

test("attachments: size, type and count limits are enforced with readable errors", async () => {
  const big = file("big.txt", "x".repeat(MAX_ATTACHMENT_BYTES + 1));
  const { added, errors } = await readAttachments([
    file("a.ts", "const a = 1;"),
    file("x.bin", "binary", "application/octet-stream"),
    big,
  ], []);
  assert.deepEqual(added.map((f) => f.name), ["a.ts"]);
  assert.equal(added[0].content, "const a = 1;");
  assert.equal(errors.length, 2);
  const full = Array.from({ length: MAX_ATTACHMENTS }, (_, i) => ({ name: `${i}.txt`, size: 1, content: "1" }));
  const overflow = await readAttachments([file("more.txt", "1")], full);
  assert.equal(overflow.added.length, 0);
  assert.match(overflow.errors[0], /สูงสุด/);
});

test("attachments: the model sees files as fenced blocks after the typed text", () => {
  const text = messageForModel({ content: "review this", attachments: [{ name: "app.js", size: 9, content: "let a = 1" }] });
  assert.equal(text, "review this\n\nไฟล์แนบ: app.js (9 B)\n```js\nlet a = 1\n```");
  const nested = messageForModel({ content: "", attachments: [{ name: "README.md", size: 9, content: "```x```" }] });
  assert.ok(nested.startsWith("ไฟล์แนบ: README.md (9 B)\n````md\n"));
  assert.equal(messageForModel({ content: "plain" }), "plain");
});

test("backup: rejects foreign files and sanitises imported data", () => {
  assert.equal(parseBackup({ foo: 1 }).ok, false);
  assert.equal(parseBackup({ app: "bossnu" }).ok, false);
  const result = parseBackup({
    app: "bossnu",
    conversations: [
      { id: "c1", title: "Hi", mode: "weird", updatedAt: 5, messages: [
        { id: "m1", role: "user", content: "hello", attachments: [{ name: "a.txt", content: "A" }, { bogus: true }] },
        { id: "m2", role: "system", content: "drop me" },
      ] },
      { id: 42 },
    ],
    personality: { name: "Boss", darkMode: false, evil: "x", tone: 3 },
  });
  assert.ok(result.ok);
  if (!result.ok) return;
  assert.equal(result.state.conversations.length, 1);
  const convo = result.state.conversations[0];
  assert.equal(convo.mode, "instant");
  assert.deepEqual(convo.messages.map((m) => m.id), ["m1"]);
  assert.deepEqual(convo.messages[0].attachments, [{ name: "a.txt", content: "A", size: 1 }]);
  assert.deepEqual(result.state.personality, { name: "Boss", darkMode: false });
});

test("backup: a conversation exports as readable markdown", () => {
  const md = conversationToMarkdown({ id: "c", title: "Plan", mode: "instant", updatedAt: 1, messages: [
    { id: "1", role: "user", content: "ช่วยวางแผน", createdAt: 1, attachments: [{ name: "todo.txt", size: 1, content: "x" }] },
    { id: "2", role: "assistant", content: "ได้เลยค่ะ", createdAt: 2 },
  ] }, "สลี่");
  assert.match(md, /^# Plan/);
  assert.match(md, /## คุณ\n\nช่วยวางแผน\n\n📎 todo.txt/);
  assert.match(md, /## สลี่\n\nได้เลยค่ะ/);
});
