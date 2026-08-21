import {
  createInitialState,
  processOnboardingMessage,
  isStartUtterance,
  type OnboardingState,
} from '../src/lib/ai-onboarding';

function chat(messages: string[]) {
  let state = createInitialState();
  let last = '';
  const replies: string[] = [];
  for (const msg of messages) {
    const result = processOnboardingMessage(state, msg);
    state = result.state;
    last = result.response;
    replies.push(last);
  }
  return { state, last, replies };
}

function assert(cond: unknown, message: string) {
  if (!cond) {
    console.error('FAIL:', message);
    process.exitCode = 1;
  } else {
    console.log('PASS:', message);
  }
}

assert(isStartUtterance('Bow'), 'Bow is a start utterance');
assert(isStartUtterance('Create my booking system'), 'create phrase is a start utterance');
assert(!isStartUtterance('catify'), 'catify is not a start utterance');
assert(!isStartUtterance("Create appointment booking system for my 'Green Trends' saloon"), 'name-bearing create is not a bare start');

const start = chat(["Create appointment booking system for my 'Green Trends' saloon"]);
assert(start.state.businessName === 'Green Trends', `name is Green Trends, got ${start.state.businessName}`);
assert(start.state.category === 'beauty', `category beauty, got ${start.state.category}`);
assert(!/what is your business name/i.test(start.last), 'does not re-ask business name');
assert(/located|location|city/i.test(start.last), 'asks location after name+category');

const afterLocation = chat([
  "Create appointment booking system for my 'Green Trends' saloon",
  'Indiranagar, Bangalore',
]);
assert(afterLocation.state.location === 'Indiranagar, Bangalore', 'persists location');
assert(/service/i.test(afterLocation.last), 'asks for services after location');

const services = chat([
  "Create appointment booking system for my 'Green Trends' saloon",
  'Indiranagar, Bangalore',
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
  'Indiranagar, Bangalore',
  'Hair Cut, Shaving, Hair Spa',
  'Hair Cut - 200, Shaving - 100, Hair Spa - 500',
]);
assert(prices.state.services?.find((s) => s.name === 'Haircut')?.price === 200, 'haircut price 200');
assert(prices.state.services?.find((s) => s.name === 'Shaving')?.price === 100, 'shaving price 100');
assert(prices.state.services?.find((s) => s.name === 'Hair Spa')?.price === 500, 'hair spa price 500');
assert(/team|staff|just me/i.test(prices.last), 'asks for staff next');

const confirmEdit = chat([
  "Create appointment booking system for my 'Green Trends' saloon",
  'Indiranagar, Bangalore',
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

const loopBug = chat(['Bow', 'catify']);
assert(loopBug.state.businessName === 'Catify', `short name catify persisted, got ${loopBug.state.businessName}`);
assert(!/what is your business name/i.test(loopBug.last), 'does not re-ask name after catify');
assert(/type of business|salon|clinic/i.test(loopBug.last), 'advances to category after name');

const mixed = chat(['Bow', 'Catify']);
assert(mixed.state.businessName === 'Catify', 'mixed-case Catify kept');
assert(mixed.replies.filter((r) => /what is your business name/i.test(r)).length === 1, 'name question asked only once');

const frustrated = chat(['Bow', 'fuck']);
assert(!frustrated.state.businessName, 'does not save profanity as the business name');
assert(/sorry/i.test(frustrated.last), 'apologizes on frustration');
assert(/what is your business name/i.test(frustrated.last), 're-prompts the current missing field');
assert(frustrated.state.step === 'collecting', 'does not restart the wizard');

const recover = chat(['Bow', 'fuck', 'Catify']);
assert(recover.state.businessName === 'Catify', 'accepts name after frustration');
assert(!/what is your business name/i.test(recover.last), 'does not re-ask name after recovery');

const legal = chat(['Bow', 'Apex Counsel', 'lawyer services']);
assert(legal.state.category === 'legal', `lawyer services maps to legal, got ${legal.state.category}`);
assert(legal.state.businessName === 'Apex Counsel', 'name not overwritten by category answer');
assert(/located|location/i.test(legal.last), 'asks location after legal category');

function replayUntil(state: OnboardingState, message: string) {
  return processOnboardingMessage(state, message);
}

let seeded = createInitialState();
seeded = replayUntil(seeded, 'Bow').state;
seeded = replayUntil(seeded, 'Catify').state;
const askedAgain = replayUntil(seeded, 'Catify');
assert(askedAgain.state.businessName === 'Catify', 'second Catify does not clear name');
assert(!/what is your business name/i.test(askedAgain.response), 'already-named state never re-asks name');

if (process.exitCode) {
  console.error('Some onboarding tests failed');
} else {
  console.log('All onboarding tests passed');
}
