import { addToInventory, getInventoryAmount, makeResult, recordAction } from './core.js';
import { evaluateRequirement } from './requirements.js';

export function createCraftingRules({ recipes, eventBus }) {
  function craft(state, recipeId) {
    const recipe = recipes[recipeId];
    if (!recipe) {
      const result = makeResult('craft', false, 'UNKNOWN_RECIPE', `Unknown recipe: ${recipeId}.`, { recipeId });
      recordAction(state, result);
      return result;
    }

    const requirement = evaluateRequirement(state, recipe.requirements);
    if (!requirement.met) {
      const result = makeResult('craft', false, requirement.code, requirement.reasons.join(' '), { recipeId });
      recordAction(state, result);
      return result;
    }

    const missing = Object.entries(recipe.inputs).find(([itemId, amount]) => getInventoryAmount(state, itemId) < amount);
    if (missing) {
      const [itemId, required] = missing;
      const available = getInventoryAmount(state, itemId);
      const result = makeResult('craft', false, 'INSUFFICIENT_MATERIALS', `Requires ${required} ${itemId}; you have ${available}.`, { recipeId, itemId, required, available });
      recordAction(state, result);
      return result;
    }

    for (const [itemId, amount] of Object.entries(recipe.inputs)) state.inventory[itemId] -= amount;
    addToInventory(state, recipe.output.itemId, recipe.output.amount);
    const result = makeResult('craft', true, 'CRAFTED', `Crafted ${recipe.output.amount} ${recipe.output.itemId}.`, { recipeId, output: recipe.output, inputs: recipe.inputs });
    recordAction(state, result);
    eventBus.emit('item_crafted', result);
    return result;
  }

  return { craft };
}
