export const ACTIVATE_NEW_ACCOUNTS_MARKER = '[l2p:activate_new_accounts]';

const REFERENCE_PREFIX = 'Reference: ';

export function buildLinkNotes(
  reference?: string | null,
  activateNewAccounts?: boolean
): string | undefined {
  const parts: string[] = [];
  const normalizedReference = reference?.trim();

  if (normalizedReference) {
    parts.push(`${REFERENCE_PREFIX}${normalizedReference}`);
  }

  if (activateNewAccounts) {
    parts.push(ACTIVATE_NEW_ACCOUNTS_MARKER);
  }

  return parts.length > 0 ? parts.join('\n') : undefined;
}

export function extractReferenceFromNotes(notes?: string | null): string | null {
  if (!notes) return null;

  const line = notes
    .split(/\r?\n/)
    .map((value) => value.trim())
    .find((value) => value.startsWith(REFERENCE_PREFIX));

  if (!line) return null;

  const reference = line.slice(REFERENCE_PREFIX.length).trim();
  return reference || null;
}

export function hasActivateNewAccountsFlag(notes?: string | null): boolean {
  return Boolean(notes && notes.includes(ACTIVATE_NEW_ACCOUNTS_MARKER));
}
