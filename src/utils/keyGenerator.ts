export function generateLicenseKey(): string {
  const segments = 4;
  const segmentLength = 5;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  const generateSegment = () => {
    let segment = '';
    for (let i = 0; i < segmentLength; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return segment;
  };

  const keySegments = [];
  for (let i = 0; i < segments; i++) {
    keySegments.push(generateSegment());
  }

  return keySegments.join('-');
}

export function formatExpiryDate(date: Date): string {
  return date.toISOString();
}

export function isKeyExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function getDaysRemaining(expiresAt: string): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}