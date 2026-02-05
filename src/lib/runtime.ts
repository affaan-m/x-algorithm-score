import type { RuntimeMessage, RuntimeMessageType, RuntimeResponse } from '../types';

export function isChromeRuntimeAvailable(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.sendMessage;
}

export function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

export async function sendRuntimeMessage<T extends RuntimeMessageType>(
  message: RuntimeMessage<T>
): Promise<RuntimeResponse<T>> {
  if (!isChromeRuntimeAvailable()) {
    throw new Error('Chrome runtime is not available in this context.');
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: RuntimeResponse<T>) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(response);
    });
  });
}

