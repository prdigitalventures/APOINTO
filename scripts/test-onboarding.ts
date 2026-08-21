import {
  createInitialState,
  processOnboardingMessage,
  type OnboardingState,
} from '../src/lib/ai-onboarding';

function chat(messages: string[]) {
  let state = createInitialState();
  let last = '';
  for (const msg of messages) {
    const result = processOnboardingMessage(state, msg);
    state = result.state;
    last = result.response;
  }
  return { state, last };
}

function assert(cond: unknown, message: string) {
  if (!cond) {
    console.error('FAIL:', message);
    process.exitCode = 1;
  } else {
    console.log('PASS:', message);
  }
}

const start = chat(["Create appointment booking system for my 'Green Trends' saloon"]);
assert(/Green Trends/i.test(start.last) || /services/i.test(start.last), 'extracts name and asks services');
assert(!/what is your business name/i.test(start.last), 'does not re-ask business name');
assert(start.state.businessName === 'Green Trends', `name is Green Trends, got ${start.state.businessName}`);
assert(start.state.category === 'beauty', `category beauty, got ${start.state.category}`);

const services = chat([
  "Create appointment booking system for my 'Green Trends' saloon",
  'Hair Cut, Shaving, Hair Spa',
]);
assert(
  services.state.services?.map((s) => s.name).join(',') === 'Haircut,Shaving,Hair Spa',
  `services parsed correctly: ${services.state.services?.map((s) => s.name).join(',')}`
);
assert(!services.state.staff?.length, `staff should be empty, got ${services.state.staff?.map((s) => s.name)}`);
assert(/price/i.test(services.last), 'asks for prices next');

const prices = chat([
  "Create appointment booking system for my 'Green Trends' saloon",
  'Hair Cut, Shaving, Hair Spa',
  'Hair Cut - 200, Shaving - 100, Hair Spa - 500',
]);
assert(prices.state.services?.find((s) => s.name === 'Haircut')?.price === 200, 'haircut price 200');
assert(prices.state.services?.find((s) => s.name === 'Shaving')?.price === 100, 'shaving price 100');
assert(prices.state.services?.find((s) => s.name === 'Hair Spa')?.price === 500, 'hair spa price 500');
assert(/team|staff|just me/i.test(prices.last), 'asks for staff next');

const confirmEdit = chat([
  "Create appointment booking system for my 'Green Trends' saloon",
  'Hair Cut, Shaving, Hair Spa',
  'Hair Cut - 200, Shaving - 100, Hair Spa - 500',
  'just me',
  '10 AM to 9 PM',
  'Please change fares ( Hair Cut - 250, Shaving - 120, Hair Spa - 500 )',
]);
assert(confirmEdit.state.step === 'confirm', `stays on confirm, got ${confirmEdit.state.step}`);
assert(confirmEdit.state.services?.find((s) => s.name === 'Haircut')?.price === 250, 'price change applied');
assert(/250/.test(confirmEdit.last), 'summary shows new price');
assert(!/please confirm with "yes"/i.test(confirmEdit.last), 'does not loop the old confirm prompt');

const done = processOnboardingMessage(confirmEdit.state, 'Yes');
assert(done.state.step === 'complete', 'yes completes setup');

if (process.exitCode) {
  console.error('Some onboarding tests failed');
} else {
  console.log('All onboarding tests passed');
}
