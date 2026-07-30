import { NextResponse } from "next/server";

/**
 * Standardized API error response helper.
 * Accepts either a string message and status code, or an options object.
 *
 * @param {string|Object} messageOrObj Error message string or options object
 * @param {number} status HTTP status code (default 400)
 * @returns {NextResponse}
 */
export function errorResponse(messageOrObj, status = 400) {
  if (typeof messageOrObj === "object" && messageOrObj !== null) {
    const s = messageOrObj.status || status;
    const errorMsg = messageOrObj.error || messageOrObj.detail || messageOrObj.message || "An error occurred";
    return NextResponse.json(
      { error: errorMsg, ...messageOrObj },
      { status: s }
    );
  }

  return NextResponse.json(
    { error: String(messageOrObj || "An error occurred") },
    { status }
  );
}
