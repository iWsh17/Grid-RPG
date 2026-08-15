export function createTimeGate({ rules, state, resourceNodes }) {
  const listRespawns = () => Object.values(resourceNodes)
    .filter(node => state.resourceRespawns?.[node.id] !== undefined)
    .map(node => ({ id: node.id, name: node.name, quantity: state.resources[node.id] ?? 0, respawnAt: state.resourceRespawns[node.id], remaining: Math.max(0, state.resourceRespawns[node.id] - (state.worldTime ?? 0)) }));

  function execute(commandLine) {
    const parts = String(commandLine ?? '').trim().split(/\s+/).filter(Boolean);
    const command = (parts.shift() ?? '').toLowerCase();
    if (command === 'time') {
      return { success: true, code: 'TIME_STATUS', message: `World time: ${state.worldTime ?? 0}`, data: { worldTime: state.worldTime ?? 0, respawns: listRespawns() } };
    }
    if (command === 'respawns') {
      const respawns = listRespawns();
      return { success: true, code: 'RESPAWN_STATUS', message: respawns.length ? `${respawns.length} resource respawn timer(s) active.` : 'No active respawn timers.', data: { worldTime: state.worldTime ?? 0, respawns } };
    }
    if (command === 'advance') {
      const amount = Number(parts[0]);
      if (!Number.isInteger(amount) || amount < 1 || amount > 100000) return { success: false, code: 'INVALID_TIME', message: 'Usage: advance <positive integer up to 100000>' };
      const result = rules.advanceTime(state, amount);
      return { ...result, data: { ...(result.data ?? {}), worldTime: state.worldTime, respawns: listRespawns() } };
    }
    return { success: false, code: 'UNKNOWN_TIME_COMMAND', message: 'Available commands: time, advance <amount>, respawns' };
  }

  return { execute, listRespawns };
}
