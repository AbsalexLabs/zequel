export interface Profile {
  id: string
  display_name: string | null
  username: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export type DocumentStatus = 'processing' | 'parsed' | 'error'

export interface Document {
  id: string
  user_id: string
  title: string
  file_name: string
  file_path: string
  file_size: number
  page_count: number
  status: DocumentStatus
  extracted_text?: string | null
  created_at: string
  updated_at: string
}

export type OutputFormat =
  | 'summarize'
  | 'extract_claims'
  | 'compare_methodology'
  | 'identify_contradictions'
  | 'define_key_terms'
  | 'extract_research_gaps'

export interface UserPreferences {
  id: string
  user_id: string
  theme: 'light' | 'dark'
  default_output_format: OutputFormat
  auto_citation: boolean
}

export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type EvidenceStrength = 'strong' | 'moderate' | 'weak'

export interface SourceReference {
  document_id: string
  document_title: string
  page: number
  section: string
  excerpt: string
}

export interface OutputBlock {
  id: string
  type: 'section' | 'claim' | 'definition' | 'comparison' | 'gap'
  title: string
  content: string
  sources: SourceReference[]
  confidence: ConfidenceLevel
}

export interface QueryResult {
  id: string
  query: string
  output_format: OutputFormat
  blocks: OutputBlock[]
  confidence_level: ConfidenceLevel
  evidence_strength: EvidenceStrength
  document_coverage: number
  created_at: string
}

export interface QueryHistoryItem {
  id: string
  user_id: string
  query_text: string
  output_format: OutputFormat
  document_ids: string[]
  result: QueryResult
  created_at: string
}

export type WorkspaceMode = 'study' | 'research'

export interface Conversation {
  id: string
  user_id: string
  title: string
  document_id: string | null
  created_at: string
  updated_at: string
}

export interface MessageVersion {
  id: string
  content: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  // For assistant messages: stores alternative versions when regenerated
  versions?: MessageVersion[]
  activeVersionIndex?: number
}

export const OUTPUT_FORMAT_LABELS: Record<OutputFormat, string> = {
  summarize: 'Summarize',
  extract_claims: 'Extract Claims',
  compare_methodology: 'Compare Methodology',
  identify_contradictions: 'Identify Contradictions',
  define_key_terms: 'Define Key Terms',
  extract_research_gaps: 'Extract Research Gaps',
}
