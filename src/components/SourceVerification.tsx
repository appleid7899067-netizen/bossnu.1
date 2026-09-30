import React from "react";
import type { InformationSource, VerificationResult } from "../types/information.types";
import { calculateTrustScore } from "../utils/trustScorer";

interface Props {
  results: InformationSource[];
  verification?: VerificationResult;
}

export function SourceVerification({ results, verification }: Props) {
  return (
    <section aria-label="Source verification" className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <strong>Source Verification</strong>
        {verification && (
          <span>
            {verification.consensus ? "✓ ยืนยันข้ามแหล่ง" : "⚠ ต้องตรวจเพิ่ม"}{" "}
            ({Math.round(verification.confidence * 100)}%)
          </span>
        )}
      </div>

      <div className="space-y-2">
        {results.map((source) => (
          <article key={source.id} className="rounded-lg border p-3">
            <a href={source.url} target="_blank" rel="noreferrer" className="font-medium underline">
              {source.title}
            </a>
            <div className="mt-1 opacity-70">{source.name} · {source.domain}</div>
            <p className="mt-1">{source.snippet}</p>
            <div className="mt-1 text-xs opacity-60">
              Trust {Math.round(calculateTrustScore(source) * 100)}%
            </div>
          </article>
        ))}
      </div>

      {verification?.conflicts.length ? (
        <p role="status" className="text-xs opacity-70">{verification.conflicts.join(" · ")}</p>
      ) : null}
    </section>
  );
}
