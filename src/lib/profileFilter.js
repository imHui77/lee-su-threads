/**
 * Profile filter: decides whether a profile should be hidden in feed / lists
 * based on user settings (hideNewUsers, hiddenLocations).
 */

import { isNewUser } from './dateParser.js';

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/**
 * Read current filter settings from storage.
 * @returns {Promise<{hideNewUsers: boolean, hiddenLocations: Object}>}
 */
export async function getFilterSettings() {
  const { hideNewUsers = false, hiddenLocations = {} } =
    await browserAPI.storage.local.get(['hideNewUsers', 'hiddenLocations']);
  return { hideNewUsers, hiddenLocations };
}

/**
 * Decide whether a profile should be hidden.
 * Verified accounts are never hidden by the "new user" rule.
 *
 * @param {Object} profileInfo - { joined, location, isVerified, ... }
 * @param {{hideNewUsers: boolean, hiddenLocations: Object}} [settings]
 * @returns {Promise<boolean>}
 */
export async function shouldHideProfile(profileInfo, settings) {
  if (!profileInfo) return false;
  const cfg = settings || (await getFilterSettings());

  if (cfg.hideNewUsers && !profileInfo.isVerified && isNewUser(profileInfo.joined)) {
    return true;
  }

  if (profileInfo.location) {
    const loc = String(profileInfo.location).trim();
    if (loc && cfg.hiddenLocations && cfg.hiddenLocations[loc]) {
      return true;
    }
  }

  return false;
}

/**
 * Hide a container element (post / user row) by collapsing it.
 * Marks it with a data attribute so we can later un-hide if settings change.
 *
 * @param {HTMLElement|null} container
 */
export function hideContainer(container) {
  if (!container || !container.style) return;
  container.setAttribute('data-threads-hidden', 'true');
  container.style.display = 'none';
}

/**
 * Re-show all containers previously hidden by hideContainer().
 */
export function unhideAllContainers() {
  document.querySelectorAll('[data-threads-hidden="true"]').forEach((el) => {
    el.removeAttribute('data-threads-hidden');
    el.style.removeProperty('display');
  });
}

/**
 * Convenience: check + hide. Returns true if the container was hidden.
 *
 * @param {Object} profileInfo
 * @param {HTMLElement|null} container
 * @param {{hideNewUsers: boolean, hiddenLocations: Object}} [settings]
 * @returns {Promise<boolean>}
 */
export async function hideIfFiltered(profileInfo, container, settings) {
  const hide = await shouldHideProfile(profileInfo, settings);
  if (hide) hideContainer(container);
  return hide;
}
