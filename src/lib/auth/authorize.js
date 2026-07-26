import { authenticateRequest } from "./requestAuth";
import { isAdmin, isPayoutProvider, isGrantee, isOwner } from "./policies";
import { NextResponse } from "next/server";
import { getFullUserFromCookie } from "@/lib/api/auth";

/**
 * A centralized authorization utility for API routes.
 * It performs authentication and then applies specified policies.
 *
 * @param {Request} request The incoming Next.js request object.
 * @param {object} options Configuration for authorization.
 * @param {boolean} [options.public=false] If true, no authentication is required.
 * @param {boolean} [options.adminOnly=false] If true, only admins are authorized.
 * @param {boolean} [options.payoutProviderOnly=false] If true, only payout providers are authorized.
 * @param {boolean} [options.granteeOnly=false] If true, only grantees are authorized.
 * @param {function(string, object): Promise<boolean>} [options.checkOwnership] A function to check resource ownership.
 *   It receives the userId and the full user payload.
 * @returns {Promise<{
 *   isAuthorized: boolean,
 *   userId?: string,
 *   userPayload?: object,
 *   fullUser?: object,
 *   response?: NextResponse
 * }>} An object containing authorization status, user ID, payload, full user object, and an optional Next.js response for unauthorized/forbidden cases.
 */
export async function authorize(request, options = {}) {
  const {
    public: isPublic = false,
    adminOnly = false,
    payoutProviderOnly = false,
    granteeOnly = false,
    checkOwnership,
  } = options;

  if (isPublic) {
    return { isAuthorized: true };
  }

  const authResult = await authenticateRequest(request);

  if (!authResult.isAuthenticated) {
    return {
      isAuthorized: false,
      response: NextResponse.json(
        { error: authResult.reason || "Authentication required" },
        { status: authResult.status }
      ),
    };
  }

  const { userId, payload: userPayload } = authResult;

  // Fetch the full user object from the database to get roles/payout info
  const fullUser = await getFullUserFromCookie(request);
  if (!fullUser) {
    return {
      isAuthorized: false,
      response: NextResponse.json(
        { error: "User profile not found" },
        { status: 401 }
      ),
    };
  }

  // Apply policies
  if (adminOnly && !isAdmin(fullUser)) {
    return {
      isAuthorized: false,
      response: NextResponse.json(
        { error: "Forbidden: Administrator access required" },
        { status: 403 }
      ),
    };
  }

  if (payoutProviderOnly && !isPayoutProvider(fullUser)) {
    return {
      isAuthorized: false,
      response: NextResponse.json(
        { error: "Forbidden: Payout provider access required" },
        { status: 403 }
      ),
    };
  }

  if (granteeOnly && !isGrantee(fullUser)) {
    return {
      isAuthorized: false,
      response: NextResponse.json(
        { error: "Forbidden: Grantee access required" },
        { status: 403 }
      ),
    };
  }

  if (checkOwnership) {
    const isOwnerOfResource = await checkOwnership(userId, fullUser, request);
    if (!isOwnerOfResource) {
      return {
        isAuthorized: false,
        response: NextResponse.json(
          { error: "Forbidden: Resource ownership required" },
          { status: 403 }
        ),
      };
    }
  }

  return {
    isAuthorized: true,
    userId,
    userPayload,
    fullUser,
  };
}

/**
 * A higher-order function to wrap API route handlers with authorization.
 *
 * @param {function(Request, ...any): Promise<NextResponse>} handler The original API route handler.
 * @param {object} options Configuration for authorization.
 * @param {boolean} [options.public=false] If true, no authentication is required.
 * @param {boolean} [options.adminOnly=false] If true, only admins are authorized.
 * @param {boolean} [options.payoutProviderOnly=false] If true, only payout providers are authorized.
 * @param {boolean} [options.granteeOnly=false] If true, only grantees are authorized.
 * @param {function(string, object): Promise<boolean>} [options.checkOwnership] A function to check resource ownership.
 *   It receives the userId and the full user payload.
 * @returns {function(Request, ...any): Promise<NextResponse>} The wrapped API route handler.
 */
export function withAuthorization(handler, options) {
  return async (request, ...args) => {
    const authResult = await authorize(request, options);

    if (!authResult.isAuthorized) {
      return authResult.response;
    }

    // Pass the authenticated user details to the handler
    request.userId = authResult.userId;
    request.userPayload = authResult.userPayload;
    request.fullUser = authResult.fullUser;

    return handler(request, ...args);
  };
}