import { validateAuth } from "./session";

/**
 * Authenticates the incoming request and resolves the user's identity.
 * This helper centralizes the authentication logic and provides a consistent
 * output for subsequent authorization checks.
 *
 * @param {Request} request The incoming Next.js request object.
 * @returns {Promise<{
 *   isAuthenticated: boolean,
 *   userId?: string,
 *   payload?: object,
 *   reason?: string,
 *   status: number
 * }>} An object containing authentication status, user ID, and optional payload/reason.
 */
export async function authenticateRequest(request) {
  const authResult = await validateAuth(request);

  if (!authResult.valid) {
    return {
      isAuthenticated: false,
      reason: authResult.reason,
      status: 401, // Unauthorized
    };
  }

  // The 'address' from validateAuth is the user's wallet address, which serves as their ID.
  // The issue states "actor ID from the verified session", and this 'address' fits that.
  const userId = authResult.address;

  if (!userId) {
    return {
      isAuthenticated: false,
      reason: "missing_user_id",
      status: 401, // Unauthorized (or potentially 500 if unexpected)
    };
  }

  return {
    isAuthenticated: true,
    userId: userId.toLowerCase(), // Ensure consistency
    payload: authResult.payload,
    status: 200, // OK
  };
}