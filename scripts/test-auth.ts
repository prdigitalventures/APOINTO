import { ALREADY_REGISTERED_MESSAGE, hashToken, normalizeEmail, normalizePhone } from '../src/lib/identity';

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

if (!process.exitCode) console.log('auth helper tests passed');
