/**
 * Defines reusable authorization policies for different roles and resource ownership.
 * These policies will be used by the centralized authorization layer.
 */

/**
 * Checks if the authenticated user is an administrator.
 *
 * @param {string} userId The ID of the authenticated user (wallet address).
 * @returns {boolean} True if the user is an admin, false otherwise.
 */
export function isAdmin(payload) {
  // TODO: Implement actual admin check (e.g., against a database role, config, or specific wallet addresses).
  // For now, this is a placeholder.
  // Example: return process.env.ADMIN_WALLET_ADDRESSES.includes(userId);
  return payload && payload.role === 'admin';
}

/**
 * Checks if the authenticated user is a payout provider.
 *
 * @param {string} userId The ID of the authenticated user (wallet address).
 * @returns {boolean} True if the user is a payout provider, false otherwise.
 */
export function isPayoutProvider(payload) {
  // A user is considered a Payout Provider if they have a payout wallet address configured.
  return payload && typeof payload.payoutWalletAddress === 'string' && payload.payoutWalletAddress.trim().length > 0;
}

/**
 * Checks if the authenticated user is a grantee.
 *
 * @param {object} payload The authenticated user's payload (e.g., from JWT).
 * @returns {boolean} True if the user is a grantee, false otherwise.
 */
export function isGrantee(payload) {
  // Assuming a 'grantee' role is indicated in the user's payload.
  return payload && payload.role === 'grantee';
}

/**
 * Checks if the authenticated user is the owner of a specific resource.
 *
 * @param {string} userId The ID of the authenticated user (wallet address).
 * @param {string} resourceOwnerId The ID of the owner of the resource.
 * @returns {boolean} True if the user is the owner, false otherwise.
 */
export function isOwner(userId, resourceOwnerId) {
  if (!userId || !resourceOwnerId) {
    return false;
  }
  return userId.toLowerCase() === resourceOwnerId.toLowerCase();
}