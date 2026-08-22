import { createSecretToken } from './identity';

export function generateTempPassword() {
  return `Ap${createSecretToken().replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}9!`;
}
