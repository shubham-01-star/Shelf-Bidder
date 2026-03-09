import { createHmac, timingSafeEqual } from 'node:crypto';

export type AuthRole = 'shopkeeper' | 'brand';
export type TokenType = 'access' | 'refresh';

export interface BaseAuthClaims {
  sub: string;
  role: AuthRole;
  name?: string;
  phone_number?: string;
  email?: string;
}

export type AuthTokenClaims = {
  sub?: string;
  role?: AuthRole;
  tokenType?: TokenType;
  name?: string;
  phone_number?: string;
  email?: string;
  iat?: number;
  exp?: number;
};

export type VerifiedAuthTokenClaims = BaseAuthClaims & {
  tokenType: TokenType;
  iat: number;
  exp: number;
};

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const JWT_HEADER = {
  alg: 'HS256',
  typ: 'JWT',
} as const;

function getRequiredSecret(name: 'AUTH_JWT_SECRET' | 'AUTH_REFRESH_SECRET'): string {
  const configured = process.env[name];
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV !== 'production') {
    return `${name.toLowerCase()}_dev_only_change_me`;
  }

  throw new Error(`Missing required auth secret: ${name}`);
}

function getIssuedAt(): number {
  return Math.floor(Date.now() / 1000);
}

function encodeBase64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signData(data: string, secret: string): string {
  return encodeBase64Url(createHmac('sha256', secret).update(data).digest());
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function assertValidTokenPayload(
  payload: AuthTokenClaims,
  expectedType: TokenType
): VerifiedAuthTokenClaims {
  if (!payload.sub || !payload.role || payload.tokenType !== expectedType) {
    throw new Error(`Invalid ${expectedType} token`);
  }

  if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') {
    throw new Error(`Invalid ${expectedType} token timestamps`);
  }

  if (payload.exp <= getIssuedAt()) {
    throw new Error(`${expectedType} token has expired`);
  }

  return {
    sub: payload.sub,
    role: payload.role,
    tokenType: payload.tokenType,
    iat: payload.iat,
    exp: payload.exp,
    name: payload.name,
    phone_number: payload.phone_number,
    email: payload.email,
  };
}

function verifyToken(
  token: string,
  secretName: 'AUTH_JWT_SECRET' | 'AUTH_REFRESH_SECRET',
  expectedType: TokenType
): VerifiedAuthTokenClaims {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid ${expectedType} token format`);
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const secret = getRequiredSecret(secretName);
  const expectedSignature = signData(`${encodedHeader}.${encodedPayload}`, secret);

  const signature = Buffer.from(encodedSignature);
  const expected = Buffer.from(expectedSignature);

  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) {
    throw new Error(`Invalid ${expectedType} token signature`);
  }

  const header = parseJson<{ alg?: string; typ?: string }>(decodeBase64Url(encodedHeader));
  if (header.alg !== JWT_HEADER.alg || header.typ !== JWT_HEADER.typ) {
    throw new Error(`Invalid ${expectedType} token header`);
  }

  const payload = parseJson<AuthTokenClaims>(decodeBase64Url(encodedPayload));
  return assertValidTokenPayload(payload, expectedType);
}

async function signToken(
  claims: BaseAuthClaims,
  tokenType: TokenType,
  ttlSeconds: number,
  secretName: 'AUTH_JWT_SECRET' | 'AUTH_REFRESH_SECRET'
): Promise<string> {
  const issuedAt = getIssuedAt();
  const payload: VerifiedAuthTokenClaims = {
    ...claims,
    tokenType,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(JWT_HEADER));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signData(
    `${encodedHeader}.${encodedPayload}`,
    getRequiredSecret(secretName)
  );

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function getAccessTokenLifetimeSeconds(): number {
  return ACCESS_TTL_SECONDS;
}

export function getRefreshTokenLifetimeSeconds(): number {
  return REFRESH_TTL_SECONDS;
}

export async function createAccessToken(claims: BaseAuthClaims): Promise<string> {
  return signToken(claims, 'access', getAccessTokenLifetimeSeconds(), 'AUTH_JWT_SECRET');
}

export async function createRefreshToken(claims: BaseAuthClaims): Promise<string> {
  return signToken(
    claims,
    'refresh',
    getRefreshTokenLifetimeSeconds(),
    'AUTH_REFRESH_SECRET'
  );
}

export async function verifyAccessToken(token: string): Promise<VerifiedAuthTokenClaims> {
  return verifyToken(token, 'AUTH_JWT_SECRET', 'access');
}

export async function verifyRefreshToken(token: string): Promise<VerifiedAuthTokenClaims> {
  return verifyToken(token, 'AUTH_REFRESH_SECRET', 'refresh');
}
