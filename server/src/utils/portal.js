import crypto from "crypto";

export function generateAccessToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function buildParentPortalUrl(
  studentId,
  accessToken,
  baseUrl = process.env.CLIENT_URL || "http://localhost:5173",
) {
  const normalizedBase = (baseUrl || "http://localhost:5173").replace(
    /\/$/,
    "",
  );
  return `${normalizedBase}/parent/${studentId}/${accessToken}`;
}
