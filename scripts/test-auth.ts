import { ALREADY_REGISTERED_MESSAGE, hashToken, normalizeEmail, normalizePhone } from '../src/lib/identity';
import {
  OWNER_ONBOARDING_PATH,
  authDestination,
  authenticatedDestination,
  parseAuthIntentRole,
  safeInternalPath,
} from '../src/lib/auth-intent';

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error('FAIL', msg);
    process.exitCode = 1;
  } else {
    console.log('PASS', msg);
  }
}

assert(normalizePhone('+91 98765 43210') === '9876543210', 'normalize 10-digit phone');
assert(normalizeEmail('  A@B.COM ') === 'a@b.com', 'normalize email');
assert(hashToken('abc').length === 64, 'sha256 token hash');
assert(ALREADY_REGISTERED_MESSAGE.includes('already registered'), 'friendly uniqueness message');
assert(parseAuthIntentRole('owner') === 'OWNER', 'lowercase owner intent');
assert(parseAuthIntentRole('OWNER') === 'OWNER', 'uppercase owner intent');
assert(parseAuthIntentRole(null) === 'CUSTOMER', 'customer is the default intent');
assert(authDestination(null, 'OWNER') === OWNER_ONBOARDING_PATH, 'owner defaults to onboarding');
assert(authDestination('/owner/calendar', 'OWNER') === '/owner/calendar', 'safe next path is preserved');
assert(safeInternalPath('//example.com') === null, 'external redirect is rejected');
assert(
  authenticatedDestination('/customer', 'OWNER', 'CUSTOMER') === OWNER_ONBOARDING_PATH,
  'owner intent cannot be redirected away from owner onboarding'
);
assert(
  authenticatedDestination('/customer', 'CUSTOMER', 'OWNER') === '/owner',
  'existing owners return to the owner dashboard'
);

if (!process.exitCode) console.log('auth helper tests passed');
