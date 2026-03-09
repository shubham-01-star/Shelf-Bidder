import type { AuthRole, BaseAuthClaims } from './tokens';
import {
  createAccessToken,
  createRefreshToken,
  getAccessTokenLifetimeSeconds,
  getRefreshTokenLifetimeSeconds,
} from './tokens';

type TokenClaimsInput = BaseAuthClaims;

export interface AuthSession {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function issueAuthSession(claims: TokenClaimsInput): Promise<AuthSession> {
  const accessToken = await createAccessToken(claims);
  const refreshToken = await createRefreshToken(claims);

  return {
    accessToken,
    idToken: accessToken,
    refreshToken,
    expiresIn: getAccessTokenLifetimeSeconds(),
  };
}

export function buildShopkeeperClaims(input: {
  sub: string;
  phoneNumber: string;
  name: string;
  email: string;
}): TokenClaimsInput {
  return {
    sub: input.sub,
    role: 'shopkeeper',
    phone_number: input.phoneNumber,
    name: input.name,
    email: input.email,
  };
}

export function buildBrandClaims(input: {
  sub: string;
  name: string;
  email: string;
}): TokenClaimsInput {
  return {
    sub: input.sub,
    role: 'brand',
    name: input.name,
    email: input.email,
  };
}

export function getCookieDurations(): {
  accessMaxAge: number;
  refreshMaxAge: number;
} {
  return {
    accessMaxAge: getAccessTokenLifetimeSeconds(),
    refreshMaxAge: getRefreshTokenLifetimeSeconds(),
  };
}

export function isRole(value: string | undefined): value is AuthRole {
  return value === 'shopkeeper' || value === 'brand';
}
