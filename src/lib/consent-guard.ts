/**
 * Consent Guard Higher-Order Function
 *
 * Wraps an async function with consent logic. Shows consent modal
 * if user hasn't accepted, then executes the action.
 */

export async function withConsent<T>(
  action: () => Promise<T>,
  consentKey: string = 'aiConsentAccepted',
  showModal: () => Promise<boolean>
): Promise<T> {
  const stored = await chrome.storage.local.get(consentKey);
  const consentAccepted = stored[consentKey] === true;

  if (consentAccepted) {
    return action();
  }

  const accepted = await showModal();

  if (accepted) {
    await chrome.storage.local.set({ [consentKey]: true });
    return action();
  }

  return Promise.reject(new Error('Consent declined'));
}
