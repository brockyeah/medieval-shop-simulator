// Game Constants and Type Definitions
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const FPS = 60;

// Item types with basic properties
export const ITEM_TYPES = {
  bread: { name: 'Bread', color: '#D2691E', shape: 'circle', size: 15, basePrice: 5, category: 'food' },
  sword: { name: 'Iron Sword', color: '#C0C0C0', shape: 'rect', size: 20, basePrice: 50, category: 'weapon' },
  potion: { name: 'Health Potion', color: '#FF1493', shape: 'triangle', size: 12, basePrice: 25, category: 'consumable' },
  hammer: { name: 'Hammer', color: '#8B4513', shape: 'rect', size: 18, basePrice: 30, category: 'tool' },
  apple: { name: 'Apple', color: '#FF0000', shape: 'circle', size: 10, basePrice: 3, category: 'food' },
  helmet: { name: 'Helmet', color: '#808080', shape: 'rect', size: 18, basePrice: 40, category: 'armor' },
  armor: { name: 'Chain Armor', color: '#A9A9A9', shape: 'rect', size: 22, basePrice: 80, category: 'armor' },
  ring: { name: 'Magic Ring', color: '#FFD700', shape: 'circle', size: 8, basePrice: 100, category: 'artifact' },
  scroll: { name: 'Spell Scroll', color: '#FFFFE0', shape: 'rect', size: 10, basePrice: 60, category: 'artifact' }
} as const;

// Furniture types
export const FURNITURE_TYPES = {
  shelf: { name: 'Wooden Shelf', color: '#8B4513', slots: 3, height: 30 },
  counter: { name: 'Counter', color: '#654321', slots: 4, height: 20 },
  display: { name: 'Display Case', color: '#4682B4', slots: 2, height: 25 },
  weaponRack: { name: 'Weapon Rack', color: '#5D4037', slots: 4, height: 40 },
  potionStand: { name: 'Potion Stand', color: '#9C27B0', slots: 3, height: 35 }
} as const;

// Customer archetypes
export const CUSTOMER_TYPES = {
  peasant: {
    name: 'Peasant',
    color: '#8B7355',
    budget: { min: 5, max: 20 },
    speed: 0.02,
    interests: ['bread', 'apple', 'hammer'],
    patience: 100,
    greetings: [
      "Good day, shopkeeper!",
      "Hope you have fair prices today...",
      "My family needs provisions."
    ],
    haggleResponses: {
      accept: ["Fair enough, I'll take it.", "You drive a hard bargain, but alright."],
      reject: ["That's still too much for a poor farmer.", "I can't afford that!"],
      happy: ["Excellent price! Thank you!", "The gods bless honest merchants!"]
    }
  },
  warrior: {
    name: 'Warrior', 
    color: '#696969',
    budget: { min: 30, max: 80 },
    speed: 0.015,
    interests: ['sword', 'potion'],
    patience: 80,
    greetings: [
      "Greetings, merchant. Show me your weapons.",
      "I need supplies for my quest.",
      "Do you have anything worthy of a warrior?"
    ],
    haggleResponses: {
      accept: ["A warrior knows when to accept.", "Very well, it's a deal."],
      reject: ["You insult me with that price!", "I'll find a more reasonable merchant."],
      happy: ["An honorable price for honorable goods!", "You'll have my recommendation!"]
    }
  },
  noble: {
    name: 'Noble',
    color: '#4B0082',
    budget: { min: 50, max: 150 },
    speed: 0.01,
    interests: ['potion', 'sword', 'apple'],
    patience: 60,
    greetings: [
      "I require only the finest goods.",
      "I hope your wares match your reputation.",
      "Time is precious, merchant. Impress me."
    ],
    haggleResponses: {
      accept: ["Acceptable, though barely.", "I suppose this will suffice."],
      reject: ["Preposterous! Do you know who I am?", "I won't be swindled!"],
      happy: ["Finally, a merchant who knows quality!", "Splendid! I'll tell the court of this!"]
    }
  }
} as const;

// Type definitions
export type ItemType = keyof typeof ITEM_TYPES;
export type FurnitureType = keyof typeof FURNITURE_TYPES;
export type CustomerType = keyof typeof CUSTOMER_TYPES;

export interface Item {
  id: number;
  type: ItemType;
  quantity: number;
  averageCost: number;
}

export interface DisplayedItem {
  type: ItemType;
  id: number;
}

export interface Furniture {
  id: number;
  type: FurnitureType;
  x: number;
  y: number;
  items: DisplayedItem[];
}

export interface Customer {
  id: number;
  type: CustomerType;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: 'entering' | 'browsing' | 'deciding' | 'buying' | 'leaving';
  wantedItem: ItemType | null;
  foundItem: DisplayedItem | null;
  patience: number;
  budget: number;
  message: string | null;
  messageTimer: number;
  mood: 'neutral' | 'happy' | 'angry';
  hasGreeted: boolean;
  haggleAttempts: number;
}

export interface Tile {
  type: 'floor' | 'wall' | 'door';
  color: string;
}

export interface Shop {
  width: number;
  height: number;
  tiles: Tile[][];
  furniture: Furniture[];
  items: DisplayedItem[];
}

export interface Market {
  demand: Record<ItemType, number>;
  supply: Record<ItemType, 'low' | 'medium' | 'high'>;
  priceHistory: Record<string, any>;
}

export interface SupplierItem {
  type: ItemType;
  quantity: number;
  price: number;
}

export interface Supplier {
  visible: boolean;
  inventory: SupplierItem[];
}

export interface SaleRecord {
  customerId: number;
  customerType: CustomerType;
  item: ItemType;
  price: number;
  haggled: boolean;
  time: number;
}

export interface Notification {
  message: string;
  type: 'info' | 'success' | 'error';
}

export interface GameState {
  camera: { x: number; y: number };
  shop: Shop;
  inventory: Item[];
  gold: number;
  market: Market;
  supplier: Supplier;
  customers: Customer[];
  customerIdCounter: number;
  salesHistory: SaleRecord[];
  selectedItem: number | null;
  selectedCustomer: number | null;
  interactionMode: string | null;
  haggleOffer: number | null;
  dialogueOptions: string[];
  placementMode: boolean;
  shopOpen: boolean;
  reputation: number;
  hoveredFurniture: number | null;
  notification: Notification | null;
  notificationTimer: number;
  helpVisible: boolean;
  time: number;
  paused: boolean;
}