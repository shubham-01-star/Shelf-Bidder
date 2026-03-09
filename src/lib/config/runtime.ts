function isTruthy(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function isMockDataEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  return isTruthy(process.env.USE_MOCK_DATA);
}
