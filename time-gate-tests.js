import { createTimeGate } from './time-gate.js';

export function runTimeGateTests({ rules, state, resourceNodes }) {
  const gate = createTimeGate({ rules, state, resourceNodes });
  const checks = [];
  const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });
  const before = state.worldTime ?? 0;
  const time = gate.execute('time');
  check('time reports current world time', time.success && time.data.worldTime === before);
  const invalid = gate.execute('advance nope');
  check('invalid advance is rejected', !invalid.success && invalid.code === 'INVALID_TIME');
  const advanced = gate.execute('advance 1');
  check('advance increments world time', advanced.success && state.worldTime === before + 1);
  const respawns = gate.execute('respawns');
  check('respawns returns timer data', respawns.success && Array.isArray(respawns.data.respawns));
  return { passed: checks.every(check => check.passed), checks };
}
