/**
 * CraftingSystem - Recipe crafting
 * 
 * Usage:
 *   // Initialize
 *   CraftingSystem.initialize(recipesData);
 *   
 *   // Check if can craft
 *   const canCraft = CraftingSystem.canCraft('berry_potion');
 *   
 *   // Craft item
 *   const result = CraftingSystem.craft('berry_potion');
 *   
 *   // Get recipes
 *   const recipes = CraftingSystem.getRecipes();
 */

const CraftingSystem = {
  // Recipe definitions from JSON
  _recipeData: null,

  /**
   * Initialize with recipe data
   * @param {Object} recipeData - Loaded from recipes.json
   */
  initialize(recipeData) {
    console.log('[CraftingSystem] Initializing...');
    this._recipeData = recipeData;
    
    // Validate recipe data
    if (!recipeData || !recipeData.recipes || !Array.isArray(recipeData.recipes)) {
      console.error('[CraftingSystem] Invalid recipe data');
      return false;
    }

    console.log(`[CraftingSystem] Loaded ${recipeData.recipes.length} recipes`);
    return true;
  },

  /**
   * Get recipe by ID
   * @param {string} recipeId - Recipe ID
   * @returns {Object|null} Recipe definition
   */
  getRecipe(recipeId) {
    if (!this._recipeData) return null;
    
    // Try to find by exact ID first
    let recipe = this._recipeData.recipes.find(r => r.id === recipeId);
    
    // If not found, try case-insensitive search
    if (!recipe) {
      recipe = this._recipeData.recipes.find(r => 
        r.id.toLowerCase() === recipeId.toLowerCase()
      );
    }
    
    return recipe || null;
  },

  /**
   * Get all recipes
   * @returns {Array} Array of recipe definitions
   */
  getAllRecipes() {
    return this._recipeData ? this._recipeData.recipes : [];
  },

  /**
   * Get unlocked recipes
   * @returns {Array} Array of unlocked recipe definitions
   */
  getUnlockedRecipes() {
    const allRecipes = this.getAllRecipes();
    const unlockedRecipeIds = GameState.get('recipes') || {};

    return allRecipes.filter(recipe => {
      return unlockedRecipeIds[recipe.id] === true;
    });
  },

  /**
   * Check if player can craft a recipe
   * @param {string} recipeId - Recipe ID
   * @returns {Object} { canCraft: boolean, error: string, missing: Array }
   */
  canCraft(recipeId) {
    const recipe = this.getRecipe(recipeId);
    
    if (!recipe) {
      return {
        canCraft: false,
        error: 'Recipe not found'
      };
    }

    // Check if recipe is unlocked
    const unlockedRecipes = GameState.get('recipes') || {};
    if (!unlockedRecipes[recipe.id]) {
      return {
        canCraft: false,
        error: 'Recipe not unlocked'
      };
    }

    // Check skill level
    const skillLevel = GameState.get(`skills.${recipe.skill}.level`) || 1;
    if (skillLevel < recipe.skillLevel) {
      return {
        canCraft: false,
        error: `Requires ${recipe.skill} level ${recipe.skillLevel}`,
        currentLevel: skillLevel,
        requiredLevel: recipe.skillLevel
      };
    }

    // Check mastery requirements (for special recipes)
    if (recipe.requirements) {
      if (recipe.requirements.foragingLevel) {
        const foragingLevel = GameState.get('skills.foraging.level') || 1;
        if (foragingLevel < recipe.requirements.foragingLevel) {
          return {
            canCraft: false,
            error: `Requires Foraging level ${recipe.requirements.foragingLevel}`
          };
        }
      }
      
      if (recipe.requirements.miningLevel) {
        const miningLevel = GameState.get('skills.mining.level') || 1;
        if (miningLevel < recipe.requirements.miningLevel) {
          return {
            canCraft: false,
            error: `Requires Mining level ${recipe.requirements.miningLevel}`
          };
        }
      }
      
      if (recipe.requirements.craftingLevel) {
        const craftingLevel = GameState.get('skills.crafting.level') || 1;
        if (craftingLevel < recipe.requirements.craftingLevel) {
          return {
            canCraft: false,
            error: `Requires Crafting level ${recipe.requirements.craftingLevel}`
          };
        }
      }
    }

    // Check ingredients
    const ingredientCheck = window.InventorySystem.hasItems(recipe.ingredients);
    
    if (!ingredientCheck.hasAll) {
      return {
        canCraft: false,
        error: 'Missing ingredients',
        missing: ingredientCheck.missing
      };
    }

    return {
      canCraft: true,
      recipe: recipe
    };
  },

  /**
   * Craft a recipe
   * @param {string} recipeId - Recipe ID
   * @returns {Object} Craft result
   */
  craft(recipeId) {
    const check = this.canCraft(recipeId);
    
    if (!check.canCraft) {
      return check;
    }

    const recipe = check.recipe;

    // Remove ingredients
    for (const ingredient of recipe.ingredients) {
      window.InventorySystem.removeItem(ingredient.resourceId, ingredient.amount);
    }

    // Add output
    window.InventorySystem.addItem(recipe.output.resourceId, recipe.output.amount);

    // Grant XP
    const levelUps = window.SkillManager.addXp(recipe.skill, recipe.xpReward);

    // Emit event
    window.EventBus.emit('crafting.crafted', {
      recipeId: recipeId,
      recipe: recipe,
      output: recipe.output,
      xpGained: recipe.xpReward,
      levelUps: levelUps
    });

    console.log(`[CraftingSystem] Crafted ${recipe.name}:`, recipe.output);

    return {
      success: true,
      recipeId: recipeId,
      recipe: recipe,
      output: recipe.output,
      xpGained: recipe.xpReward,
      levelUps: levelUps
    };
  },

  /**
   * Unlock a recipe
   * @param {string} recipeId - Recipe ID
   * @returns {boolean} Success
   */
  unlockRecipe(recipeId) {
    const recipe = this.getRecipe(recipeId);
    
    if (!recipe) {
      console.error(`[CraftingSystem] Cannot unlock unknown recipe "${recipeId}"`);
      return false;
    }

    const recipes = GameState.get('recipes') || {};
    recipes[recipeId] = true;
    GameState.update('recipes', recipes);

    console.log(`[CraftingSystem] Unlocked recipe "${recipeId}"`);

    window.EventBus.emit('crafting.recipeUnlocked', {
      recipeId: recipeId,
      recipe: recipe
    });

    return true;
  },

  /**
   * Get recipes by category
   * @param {string} category - Category to filter by
   * @returns {Array} Array of recipes
   */
  getRecipesByCategory(category) {
    const allRecipes = this.getAllRecipes();
    return allRecipes.filter(r => r.category === category);
  },

  /**
   * Get recipes by skill
   * @param {string} skillId - Skill ID to filter by
   * @returns {Array} Array of recipes
   */
  getRecipesBySkill(skillId) {
    const allRecipes = this.getAllRecipes();
    return allRecipes.filter(r => r.skill === skillId);
  }
};

// Export for ES modules
export default CraftingSystem;

// Also make available globally for non-module scripts
window.CraftingSystem = CraftingSystem;

console.log('[CraftingSystem] Initialized');