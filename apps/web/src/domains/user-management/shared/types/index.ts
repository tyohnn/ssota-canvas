// apps/web/src/domains/user-management/types/index.ts

// Organization Types (정적 정의)
export type OrganizationType =
  | 'personal'
  | 'education'
  | 'startup'
  | 'agency'
  | 'company'
  | 'n/a';

// Organization Type Labels (한국어)
export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  personal: '개인',
  education: '교육',
  startup: '스타트업',
  agency: '에이전시',
  company: '컴퍼니',
  'n/a': 'N/A',
} as const;
