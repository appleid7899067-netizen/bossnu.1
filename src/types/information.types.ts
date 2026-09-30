export interface InformationSource {
  id: string;
  name: string;
  url: string;
  title: string;
  snippet: string;
  publishedAt?: string;
  retrievedAt: string;
  domain: string;
  reliability?: number;
}

export interface SearchSource {
  id: string;
  name: string;
  baseUrl: string;
  buildParams?: (query: string) => Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

export interface VerificationResult {
  consensus: boolean;
  confidence: number;
  sourceCount: number;
  corroboratedCount: number;
  conflicts: string[];
  explanation: string;
}
