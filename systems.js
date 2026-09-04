import { addToInventory, awardSkillXp, getResourceQuantity, makeResult, recordAction } from './core.js';
import { evaluateRequirement } from './requirements.js';
import { createResourceLifecycle } from './lifecycle.js';


export function createRules({ config, resourceNodesByPosition, eventBus, skills, skillNodes = {}, biomeRegistry = null }) {
  const blockedCells = new Set(config.blockedCells.map(([x, y]) => `${x},${y}`));
  const lifecycle = createResourceLifecycle({ resourceNodes: Object.fromEntries([...resourceNodesByPosition.values()].map(node => [node.id, node])), eventBus });
  
  const result = (state, action, success, code, message, data = null) => {
    const value = makeResult(action, success, code, message, data);
    recordAction(state, value);
    return value;
  };
  
  const isInsideGrid = (x, y) => x >= 0 && x < config.gridWidth && y >= 0 && y < config.gridHeight;
  const isBlocked = (x, y) => blockedCells.has(`${x},${y}`);
  const canMoveTo = (x, y) => isInsideGrid(x, y) && !isBlocked(x, y);
  
  function tick(state, amount = 1) {
    lifecycle.advanceTime(state, amount);
  }
  
  function move(state, dx, dy) {
    tick(state, 1);
    state.stats.movesAttempted += 1;
    const x = state.player.x + dx;
    const y = state.player.y + dy;
    if (!canMoveTo(x, y)) return result(state, 'move', false, 'BLOCKED', `Movement blocked at ${x},${y}`, { x, y });
    state.player.x = x;
    state.player.y = y;
    state.stats.movesSuccessful += 1;
    return result(state, 'move', true, 'MOVED', `Moved to ${x},${y}`, { x, y });
  }
  
  function teleport(state, x, y) {
    if (!Number.isInteger(x) || !Number.isInteger(y) || !canMoveTo(x, y)) return result(state, 'teleport', false, 'INVALID_DESTINATION', `Cannot teleport to ${x},${y}.`, { x, y });
    state.player.x = x;
    state.player.y = y;
    return result(state, 'teleport', true, 'TELEPORTED', `Teleported to ${x},${y}`, { x, y });
  }
  
  function unlockAvailableNodes(state) {
    if (!state.capabilities) state.capabilities = {};
    const unlocked = [];
    for (const node of Object.values(skillNodes)) {
      const level = state.skills[node.skillId]?.level ?? 0;
      const capability = node.grants?.capability;
      if (capability && level >= node.requiredLevel && !state.capabilities[capability]) {
        state.capabilities[capability] = true;
        unlocked.push(node.id);
        eventBus.emit('skill_node_unlocked', { node, capability });
      }
    }
    return unlocked;
  }
  
  function gather(state) {
    tick(state, 1);
    const node = resourceNodesByPosition.get(`${state.player.x},${state.player.y}`);
    if (!node) return result(state, 'gather', false, 'NO_RESOURCE', 'There is no resource here.');
    const biome = biomeRegistry?.getBiomeAt(state.player.x, state.player.y);
    if (node.biomeId && biome && node.biomeId !== biome.id) return result(state, 'gather', false, 'BIOME_MISMATCH', `${node.name} belongs to ${node.biomeId}, but this cell is ${biome.id}.`);
    const req = evaluateRequirement(state, node.requirements);
    if (!req.met) return result(state, 'gather', false, req.code, req.reasons.join(' '));
    if (getResourceQuantity(state, node.id) <= 0) return result(state, 'gather', false, 'DEPLETED', `${node.name} is depleted.`);
    lifecycle.consume(state, node);
    addToInventory(state, node.yields.itemId, node.yields.amount);
    state.stats.resourcesGathered += node.yields.amount;
    const skill = skills[node.skillId];
    const xp = awardSkillXp(state, skill, Math.max(1, Math.floor(node.xp * (biome?.gatherXpMultiplier ?? 1))));
     if (window.GameState?.update) {
      window.GameState.update(`skills.${node.skillId}`, state.skills[node.skillId]);
    }
    eventBus.emit('skill.xpGain', { skillId: node.skillId, xpGained: xp.xpGained, amount: xp.xpGained });
    // Sync to GameState for UI
  
    const unlockedNodes = unlockAvailableNodes(state);
    return result(state, 'gather', true, xp.leveledUp ? 'GATHERED_LEVEL_UP' : 'GATHERED', `Gathered ${node.yields.amount} ${node.yields.itemId}; Foraging XP +${xp.xpGained}.`, { xpGained: xp.xpGained, remaining: state.resources[node.id], biomeId: biome?.id, unlockedNodes });
  }
  
  function refillResources(state) {
    lifecycle.refill(state);
    return result(state, 'refill', true, 'REFILLED', 'All resources refilled.');
  }
  
  function advanceTimeRule(state, amount) {
    const respawned = lifecycle.advanceTime(state, amount);
    return result(state, 'time', true, 'TIME_ADVANCED', `Advanced time by ${amount}.`, { respawned });
  }
  
  return { isInsideGrid, isBlocked, canMoveTo, move, teleport, gather, refillResources, advanceTime: advanceTimeRule, evaluateRequirement, unlockAvailableNodes };
}