export function createEventBus() {
  const listeners = new Map();
  return {
    on(eventName, listener) {
      if (!listeners.has(eventName)) listeners.set(eventName, new Set());
      listeners.get(eventName).add(listener);
      return () => listeners.get(eventName)?.delete(listener);
    },
    emit(eventName, payload) {
      listeners.get(eventName)?.forEach(listener => listener(payload));
    }
  };
}

export function createGameState(startPosition, resourceNodes, skills) {
  const resources = Object.fromEntries(Object.values(resourceNodes).map(node => [node.id, node.maxQuantity]));
  const skillState = Object.fromEntries(Object.values(skills).map(skill => [skill.id, { xp: 0, level: 0 }]));
  return {
    player: { ...startPosition },
    inventory: {},
    skills: skillState,
    capabilities: {},
    resources,
    resourceRespawns: {},
    worldTime: 0,
    stats: { movesAttempted: 0, movesSuccessful: 0, resourcesGathered: 0 },
    actionLog: [],
    lastAction: 'Game initialized'
  };
}

export function addToInventory(state, itemId, amount) {
  state.inventory[itemId] = (state.inventory[itemId] ?? 0) + amount;
}

export function getInventoryAmount(state, itemId) {
  return state.inventory[itemId] ?? 0;
}

export function getResourceQuantity(state, nodeId) {
  return state.resources[nodeId] ?? 0;
}

export function getSkill(state, skillId) {
  return state.skills[skillId] ?? { xp: 0, level: 0 };
}

export function awardSkillXp(state, skill, amount) {
  const current = state.skills[skill.id] ?? { xp: 0, level: 0 };
  const previousLevel = current.level;
  current.xp += amount;
  current.level = Math.min(skill.maxLevel, Math.floor(current.xp / skill.xpPerLevel));
  state.skills[skill.id] = current;
  return { xpGained: amount, totalXp: current.xp, previousLevel, level: current.level, leveledUp: current.level > previousLevel };
}

export function recordAction(state, result) {
  state.lastAction = result.message;
  state.actionLog.push({ action: result.action, success: result.success, code: result.code, message: result.message, data: result.data ?? null });
  if (state.actionLog.length > 20) state.actionLog.shift();
}

export function makeResult(action, success, code, message, data = null) {
  return Object.freeze({ action, success, code, message, data });
}
