import { parseCustomerIntent } from '../src/lib/customer-assistant';

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error('FAIL', msg);
    process.exitCode = 1;
  } else {
    console.log('PASS', msg);
  }
}

const a = parseCustomerIntent('I need to book hair cut appointment in green trends at 4 pm today');
assert(a.serviceName === 'Haircut', `service ${a.serviceName}`);
assert(a.startTime === '16:00', `time ${a.startTime}`);
assert(a.dateOffset === 0, 'today');
assert(/green trends/i.test(a.businessHint || ''), `hint ${a.businessHint}`);

const b = parseCustomerIntent('yes book it');
assert(b.confirm, 'confirm yes');

if (!process.exitCode) console.log('assistant parse tests passed');
