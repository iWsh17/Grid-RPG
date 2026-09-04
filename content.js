// config.js - Game configuration and content data

export const CONFIG = Object.freeze({
  gridWidth: 12,
  gridHeight: 9,
  startPosition: { x: 1, y: 1 },
  blockedCells: [
    [3, 0], [3, 1], [3, 2], [3, 3],
    [7, 4], [8, 4], [9, 4],
    [5, 6], [5, 7], [5, 8]
  ]
});

export const BIOMES = Object.freeze({
  meadow: Object.freeze({
    id: 'meadow',
    name: 'Greenmeadow',
    description: 'Open grassland suitable for early gathering.',
    visualClass: 'biome-meadow',
    tags: Object.freeze(['open', 'temperate']),
    gatherXpMultiplier: 1
  }),
  forest: Object.freeze({
    id: 'forest',
    name: 'Whispering Forest',
    description: 'Dense woodland where canopy resources and advanced gathering routes begin.',
    visualClass: 'biome-forest',
    tags: Object.freeze(['woodland', 'shaded']),
    gatherXpMultiplier: 2
  })
});

export const BIOME_ASSIGNMENTS = Object.freeze({
  '8,6': 'forest', '9,6': 'forest', '10,6': 'forest', '11,6': 'forest',
  '8,7': 'forest', '9,7': 'forest', '10,7': 'forest', '11,7': 'forest',
  '8,8': 'forest', '9,8': 'forest', '10,8': 'forest', '11,8': 'forest'
});

export const ITEMS = Object.freeze({
  wood: Object.freeze({ id: 'wood', name: 'Wood' }),
  wooden_plank: Object.freeze({ id: 'wooden_plank', name: 'Wooden plank' }),
  wooden_handle: Object.freeze({ id: 'wooden_handle', name: 'Wooden handle' }),
  canopy_hook: Object.freeze({ id: 'canopy_hook', name: 'Canopy hook' }),
  forest_resin: Object.freeze({ id: 'forest_resin', name: 'Forest resin' }),
  resin_glue: Object.freeze({ id: 'resin_glue', name: 'Resin glue' })
});

export const SKILLS = Object.freeze({
  foraging: Object.freeze({
    id: 'foraging',
    name: 'Foraging',
    xpPerLevel: 10,
    maxLevel: 5
  })
});

export const SKILL_NODES = Object.freeze({
  canopy_access: Object.freeze({
    id: 'canopy_access',
    name: 'Canopy access',
    skillId: 'foraging',
    requiredLevel: 1,
    grants: Object.freeze({ capability: 'canopy_access' })
  })
});

export const RECIPES = Object.freeze({
  wooden_plank: Object.freeze({
    id: 'wooden_plank',
    name: 'Wooden plank',
    requirements: null,
    inputs: Object.freeze({ wood: 2 }),
    output: Object.freeze({ itemId: 'wooden_plank', amount: 1 })
  }),
  wooden_handle: Object.freeze({
    id: 'wooden_handle',
    name: 'Wooden handle',
    requirements: null,
    inputs: Object.freeze({ wood: 1, wooden_plank: 1 }),
    output: Object.freeze({ itemId: 'wooden_handle', amount: 1 })
  }),
  canopy_hook: Object.freeze({
    id: 'canopy_hook',
    name: 'Canopy hook',
    requirements: Object.freeze({
      all: Object.freeze([
        Object.freeze({ capability: 'canopy_access' })
      ])
    }),
    inputs: Object.freeze({ wood: 1, wooden_plank: 1 }),
    output: Object.freeze({ itemId: 'canopy_hook', amount: 1 })
  }),
  resin_glue: Object.freeze({
    id: 'resin_glue',
    name: 'Resin glue',
    requirements: null,
    inputs: Object.freeze({ forest_resin: 1, wooden_plank: 1 }),
    output: Object.freeze({ itemId: 'resin_glue', amount: 1 })
  })
});

export const RESOURCE_NODES = Object.freeze({
  starter_tree: Object.freeze({
    id: 'starter_tree',
    name: 'Starter tree',
    x: 2, y: 1,
    biomeId: 'meadow',
    maxQuantity: 3,
    respawnTime: 5,
    requirements: null,
    skillId: 'foraging',
    xp: 5,
    yields: Object.freeze({ itemId: 'wood', amount: 1 })
  }),
  second_tree: Object.freeze({
    id: 'second_tree',
    name: 'Second tree',
    x: 6, y: 2,
    biomeId: 'meadow',
    maxQuantity: 3,
    respawnTime: 5,
    requirements: Object.freeze({
      all: Object.freeze([
        Object.freeze({ inventory: Object.freeze({ itemId: 'wood', min: 1 }) })
      ])
    }),
    skillId: 'foraging',
    xp: 5,
    yields: Object.freeze({ itemId: 'wood', amount: 1 })
  }),
  high_tree: Object.freeze({
    id: 'high_tree',
    name: 'High-canopy tree',
    x: 10, y: 7,
    biomeId: 'forest',
    maxQuantity: 3,
    respawnTime: 8,
    requirements: Object.freeze({
      all: Object.freeze([
        Object.freeze({ capability: 'canopy_access' })
      ])
    }),
    skillId: 'foraging',
    xp: 5,
    yields: Object.freeze({ itemId: 'wood', amount: 1 })
  }),
  canopy_cache: Object.freeze({
    id: 'canopy_cache',
    name: 'Canopy cache',
    x: 9, y: 7,
    biomeId: 'forest',
    maxQuantity: 1,
    respawnTime: 12,
    requirements: Object.freeze({
      all: Object.freeze([
        Object.freeze({ inventory: Object.freeze({ itemId: 'canopy_hook', min: 1 }) })
      ])
    }),
    skillId: 'foraging',
    xp: 10,
    yields: Object.freeze({ itemId: 'wooden_handle', amount: 1 })
  }),
  resin_node: Object.freeze({
    id: 'resin_node',
    name: 'Resin node',
    x: 8, y: 8,
    biomeId: 'forest',
    maxQuantity: 2,
    respawnTime: 8,
    requirements: Object.freeze({
      all: Object.freeze([
        Object.freeze({ capability: 'canopy_access' })
      ])
    }),
    skillId: 'foraging',
    xp: 10,
    yields: Object.freeze({ itemId: 'forest_resin', amount: 1 })
  }),
  // NEW: Storage Chest
  storage_chest_1: Object.freeze({
    id: 'storage_chest_1',
    name: 'Storage Chest',
    x: 4, y: 4,
    biomeId: 'meadow',
    maxQuantity: 1,
    respawnTime: 0,
    requirements: null,
    skillId: null,
    xp: 0,
    type: 'storage',
    storageConfig: 'storage_chest',
    yields: Object.freeze({ itemId: null, amount: 0 })
  })
});

export const RESOURCE_NODES_BY_POSITION = new Map(
  Object.values(RESOURCE_NODES).map(node => [`${node.x},${node.y}`, node])
);

export const GRIDS = Object.freeze({
  meadow_01: Object.freeze({
    id: 'meadow_01',
    width: CONFIG.gridWidth,
    height: CONFIG.gridHeight,
    defaultBiome: 'meadow',
    blockedCells: CONFIG.blockedCells,
    doorways: [
      { x: 11, y: 4, targetGrid: 'new_zone_01', targetX: 0, targetY: 4 }
    ],
    biomeMap: BIOME_ASSIGNMENTS,
    resources: RESOURCE_NODES
  }),
  new_zone_01: Object.freeze({
    id: 'new_zone_01',
    width: 12,
    height: 9,
    defaultBiome: 'forest',
    blockedCells: [[0, 0], [0, 1], [0, 2]],
    biomeMap: { '5,5': 'meadow', '6,5': 'meadow' },
    resources: {
      zone2_tree: Object.freeze({
        id: 'zone2_tree',
        name: 'Zone 2 Tree',
        x: 5, y: 5,
        biomeId: 'meadow',
        maxQuantity: 3,
        respawnTime: 5,
        requirements: null,
        skillId: 'foraging',
        xp: 5,
        yields: Object.freeze({ itemId: 'wood', amount: 1 })
      })
    },
    doorways: [
      { x: 0, y: 4, targetGrid: 'meadow_01', targetX: 11, targetY: 4 }
    ]
  })
});

export const WORLD = Object.freeze({
  grids: ['meadow_01', 'new_zone_01'],
  connections: {}
});