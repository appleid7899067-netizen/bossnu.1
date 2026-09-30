import type { InformationSource, VerificationResult } from "../types/information.types";
import { calculateTrustScore } from "../utils/trustScorer";

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 4),
  );
}

function similarity(a: string, b: string): number {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;

  let common = 0;
  for (const token of left) if (right.has(token)) common++;
  return common / Math.max(left.size, right.size);
}

export function checkConsensus(
  sources: InformationSource[],
  minCorroboration = 2,
): VerificationResult {
  const scored = sources.map((source) => ({
    source,
    trust: source.reliability ?? calculateTrustScore(source),
  }));

  const corroborated = new Set<string>();
  for (let i = 0; i < scored.length; i++) {
    for (let j = i + 1; j < scored.length; j++) {
      if (scored[i].source.domain === scored[j].source.domain) continue;
      if (similarity(scored[i].source.snippet, scored[j].source.snippet) >= 0.35) {
        corroborated.add(scored[i].source.id);
        corroborated.add(scored[j].source.id);
      }
    }
  }

  const weighted = scored.reduce((sum, item) => sum + item.trust, 0);
  const confidence = Math.min(
    1,
    (weighted / Math.max(1, scored.length)) * 0.6 +
      Math.min(1, corroborated.size / Math.max(1, minCorroboration)) * 0.4,
  );
  const consensus = corroborated.size >= minCorroboration && confidence >= 0.55;

  return {
    consensus,
    confidence: Number(confidence.toFixed(3)),
    sourceCount: sources.length,
    corroboratedCount: corroborated.size,
    conflicts: consensus ? [] : ["ยังไม่มีหลักฐานจากหลายแหล่งเพียงพอสำหรับยืนยันข้ออ้าง"],
    explanation: consensus
      ? "มีแหล่งข้อมูลต่างโดเมนสนับสนุนเนื้อหาที่ใกล้เคียงกัน"
      : "ต้องการแหล่งข้อมูลอิสระเพิ่มเติมก่อนสรุปว่าเป็นข้อเท็จจริง",
  };
}
