import { stem } from '@/text';

const groups: string[][] = [
  ['upsert', 'sync', 'push', 'save', 'write', 'createorupdate', 'mirror', 'store'],
  ['create', 'add', 'insert', 'make', 'enroll', 'enrol'],
  ['update', 'edit', 'modify', 'change', 'patch', 'set'],
  ['remove', 'delete', 'archive', 'drop'],
  ['find', 'search', 'lookup', 'look', 'get', 'fetch', 'retrieve', 'discover', 'list', 'pull'],
  ['enrich', 'enrichment', 'augment', 'append', 'research'],
  ['company', 'account', 'organization', 'organisation', 'business', 'firm', 'domain', 'employer'],
  ['person', 'contact', 'lead', 'prospect', 'people', 'profile', 'individual', 'user'],
  ['record', 'object', 'row', 'entry'],
  ['email', 'mail', 'inbox', 'address'],
  ['phone', 'mobile', 'number', 'cell', 'telephone'],
  ['verify', 'validate', 'check', 'verification', 'validation', 'bounce'],
  ['send', 'post', 'notify', 'message', 'dm', 'ping', 'alert'],
  ['sequence', 'campaign', 'cadence', 'outreach'],
  ['job', 'hiring', 'opening', 'role', 'posting', 'recruitment', 'hire', 'recruit'],
  ['listen', 'watch', 'monitor', 'track', 'signal', 'alert', 'trigger', 'event'],
  ['stakeholder', 'decisionmaker', 'buyer', 'champion', 'executive', 'persona'],
  ['joiner', 'hire', 'onboarded'],
  ['use', 'using', 'technology', 'stack'],
  ['employee', 'staff', 'headcount'],
  ['route', 'routing', 'assign', 'allocate', 'distribute', 'roundrobin', 'dispatch', 'choose'],
  ['rep', 'member', 'owner', 'seller', 'salesperson', 'team', 'sdr', 'ae'],
  ['website', 'site', 'page', 'url', 'web', 'scrape', 'crawl'],
  ['linkedin', 'li'],
  ['stargazer', 'star', 'starred'],
  ['repository', 'repo'],
  ['funding', 'fundraising', 'raise', 'investment'],
  ['technology', 'tech', 'technographic', 'stack'],
  ['visitor', 'traffic', 'deanonymize', 'identify'],
  ['score', 'scoring', 'qualify', 'rank', 'prioritize'],
  ['approve', 'approval', 'review', 'human', 'manual', 'signoff'],
  ['ai', 'llm', 'gpt', 'claude', 'prompt', 'instruct', 'model']
];

const synonymIndex = new Map<string, Set<string>>();

for (const group of groups) {
  const stemmed = group.map(stem);
  for (const word of stemmed) {
    const existing = synonymIndex.get(word) ?? new Set<string>();
    for (const other of stemmed) {
      if (other !== word) {
        existing.add(other);
      }
    }
    synonymIndex.set(word, existing);
  }
}

export const genericObjectWords = new Set(['record', 'object', 'row', 'entry']);

export const entityWords = new Set(
  ['company', 'account', 'organization', 'business', 'person', 'contact', 'lead', 'prospect', 'people', 'deal', 'opportunity'].map(
    stem
  )
);

export const synonymsOf = (word: string): string[] => [...(synonymIndex.get(word) ?? [])];
