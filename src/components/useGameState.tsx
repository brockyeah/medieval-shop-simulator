import { useState, useEffect, useCallback } from 'react';
import { 
  ITEM_TYPES,
  type GameState,
  type ItemType,
  type Notification
} from './gameConstants';

// Initial game state factory
const createInitialGameState = (): GameState => {
  // Initialize shop tiles
  const tiles: { type: 'floor' | 'wall' | 'door'; color: string }[][] = [];
  for (let y = 0; y < 8; y++) {
    tiles[y] = [];
    for (let x = 0; x < 10; x++) {
      tiles[y][x] = {
        type: 'floor',
        color: '#8B6F47'
      };
    }
  }
  
  // Add walls
  for (let x = 0; x < 10; x++) {
    tiles[0][x] = { type: 'wall' as const, color: '#4A4A4A' };
    tiles[7][x] = { type: 'wall' as const, color: '#4A4A4A' };
  }
  for (let y = 0; y < 8; y++) {
    tiles[y][0] = { type: 'wall' as const, color: '#4A4A4A' };
    tiles[y][9] = { type: 'wall' as const, color: '#4A4A4A' };
  }
  
  // Add door
  tiles[7][5] = { type: 'door' as const, color: '#654321' };
  
  // Initialize furniture
  const furniture = [
    { id: 1, type: 'shelf' as const, x: 1, y: 1, items: [] },
    { id: 2, type: 'shelf' as const, x: 1, y: 3, items: [] },
    { id: 3, type: 'counter' as const, x: 4, y: 5, items: [] },
    { id: 4, type: 'display' as const, x: 7, y: 1, items: [] },
    { id: 5, type: 'display' as const, x: 7, y: 3, items: [] }
  ];

  return {
    camera: { x: 0, y: 0 },
    shop: {
      width: 10,
      height: 8,
      tiles,
      furniture,
      items: []
    },
    inventory: [
      { id: 1, type: 'bread', quantity: 10, averageCost: 3 },
      { id: 2, type: 'sword', quantity: 5, averageCost: 35 },
      { id: 3, type: 'potion', quantity: 8, averageCost: 18 },
      { id: 4, type: 'hammer', quantity: 6, averageCost: 22 },
      { id: 5, type: 'apple', quantity: 15, averageCost: 2 }
    ],
    gold: 500,
    market: {
      demand: {
        bread: 1.0,
        sword: 1.0,
        potion: 1.0,
        hammer: 1.0,
        apple: 1.0
      },
      supply: {
        bread: 'high',
        sword: 'medium',
        potion: 'medium',
        hammer: 'medium',
        apple: 'high'
      },
      priceHistory: {}
    },
    supplier: {
      visible: false,
      inventory: [
        { type: 'bread', quantity: 20, price: 3 },
        { type: 'sword', quantity: 10, price: 35 },
        { type: 'potion', quantity: 15, price: 18 },
        { type: 'hammer', quantity: 12, price: 22 },
        { type: 'apple', quantity: 30, price: 2 }
      ]
    },
    customers: [],
    customerIdCounter: 0,
    salesHistory: [],
    selectedItem: null,
    selectedCustomer: null,
    interactionMode: null,
    haggleOffer: null,
    dialogueOptions: [],
    placementMode: false,
    shopOpen: false,
    reputation: 50,
    hoveredFurniture: null,
    notification: null,
    notificationTimer: 0,
    helpVisible: false,
    time: 0,
    paused: false
  };
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);

  // Show notification helper
  const showNotification = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setGameState(prev => ({
      ...prev,
      notification: { message, type },
      notificationTimer: 3000
    }));
  }, []);

  // Update camera position
  const updateCamera = useCallback((deltaX: number, deltaY: number) => {
    setGameState(prev => ({
      ...prev,
      camera: {
        x: prev.camera.x + deltaX,
        y: prev.camera.y + deltaY
      }
    }));
  }, []);

  // Toggle pause state
  const togglePause = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      paused: !prev.paused
    }));
  }, []);

  // Toggle placement mode
  const togglePlacementMode = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      placementMode: !prev.placementMode
    }));
  }, []);

  // Toggle supplier visibility
  const toggleSupplier = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      supplier: {
        ...prev.supplier,
        visible: !prev.supplier.visible
      }
    }));
  }, []);

  // Toggle shop open/closed
  const toggleShop = useCallback(() => {
    setGameState(prev => {
      const newOpen = !prev.shopOpen;
      showNotification(
        newOpen ? 'Shop is now OPEN for business!' : 'Shop is now CLOSED',
        newOpen ? 'success' : 'info'
      );
      return {
        ...prev,
        shopOpen: newOpen
      };
    });
  }, [showNotification]);

  // Toggle help visibility
  const toggleHelp = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      helpVisible: !prev.helpVisible
    }));
  }, []);

  // Select item from inventory
  const selectItem = useCallback((itemId: number | null) => {
    setGameState(prev => ({
      ...prev,
      selectedItem: itemId
    }));
  }, []);

  // Select customer for interaction
  const selectCustomer = useCallback((customerId: number | null) => {
    setGameState(prev => ({
      ...prev,
      selectedCustomer: customerId,
      placementMode: customerId ? false : prev.placementMode
    }));
  }, []);

  // Set hovered furniture
  const setHoveredFurniture = useCallback((furnitureId: number | null) => {
    setGameState(prev => ({
      ...prev,
      hoveredFurniture: furnitureId
    }));
  }, []);

  // Place item on furniture
  const placeItemOnFurniture = useCallback((furnitureId: number, itemId: number) => {
    setGameState(prev => {
      const furniture = prev.shop.furniture.find(f => f.id === furnitureId);
      const inventory = prev.inventory.find(inv => inv.id === itemId);
      
      if (!furniture || !inventory || inventory.quantity === 0) {
        return prev;
      }

      const newState = { ...prev };
      const newFurniture = newState.shop.furniture.find(f => f.id === furnitureId);
      const newInventory = newState.inventory.find(inv => inv.id === itemId);
      
      if (newFurniture && newInventory) {
        newFurniture.items.push({
          type: newInventory.type,
          id: Date.now()
        });
        
        newInventory.quantity--;
        
        if (newInventory.quantity === 0) {
          newState.selectedItem = null;
        }
      }
      
      return newState;
    });
  }, []);

  // Update game time and notification timer
  const updateTime = useCallback((deltaTime: number) => {
    setGameState(prev => {
      let newState = { ...prev };
      newState.time = prev.time + deltaTime;
      
      // Update notification timer
      if (newState.notificationTimer > 0) {
        newState.notificationTimer -= deltaTime;
        if (newState.notificationTimer <= 0) {
          newState.notification = null;
        }
      }
      
      return newState;
    });
  }, []);

  // Refresh supplier inventory
  const refreshSupplier = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      supplier: {
        ...prev.supplier,
        inventory: Object.keys(ITEM_TYPES).map(itemType => {
          const basePrice = ITEM_TYPES[itemType as ItemType].basePrice;
          const randomVariation = 0.7 + Math.random() * 0.6;
          return {
            type: itemType as ItemType,
            quantity: Math.floor(Math.random() * 20) + 10,
            price: Math.round(basePrice * randomVariation * 0.7)
          };
        })
      }
    }));
  }, []);

  // Purchase from supplier
  const purchaseFromSupplier = useCallback((itemType: ItemType, quantity: number) => {
    setGameState(prev => {
      const supplierItem = prev.supplier.inventory.find(item => item.type === itemType);
      if (!supplierItem || supplierItem.quantity < quantity) {
        showNotification('Not enough stock!', 'error');
        return prev;
      }
      
      const totalCost = supplierItem.price * quantity;
      if (prev.gold < totalCost) {
        showNotification('Not enough gold!', 'error');
        return prev;
      }
      
      const newState = { ...prev };
      newState.gold -= totalCost;
      
      const invItem = newState.inventory.find(item => item.type === itemType);
      if (invItem) {
        const totalQuantity = invItem.quantity + quantity;
        const totalValue = (invItem.quantity * invItem.averageCost) + (quantity * supplierItem.price);
        invItem.averageCost = Math.round(totalValue / totalQuantity);
        invItem.quantity = totalQuantity;
      } else {
        newState.inventory.push({
          id: Date.now(),
          type: itemType,
          quantity: quantity,
          averageCost: supplierItem.price
        });
      }
      
      const suppItem = newState.supplier.inventory.find(item => item.type === itemType);
      if (suppItem) {
        suppItem.quantity -= quantity;
        
        if (suppItem.quantity < 5) {
          newState.market.supply[itemType] = 'low';
        } else if (suppItem.quantity > 20) {
          newState.market.supply[itemType] = 'high';
        } else {
          newState.market.supply[itemType] = 'medium';
        }
      }
      
      showNotification(`Purchased ${quantity} ${ITEM_TYPES[itemType].name} for ${totalCost} gold`, 'success');
      return newState;
    });
  }, [showNotification]);

  // Update market demand
  const updateMarketDemand = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev };
      const displayedItems: Record<string, number> = {};
      
      // Count displayed items
      prev.shop.furniture.forEach(furniture => {
        furniture.items.forEach(item => {
          displayedItems[item.type] = (displayedItems[item.type] || 0) + 1;
        });
      });
      
      // Adjust demand based on scarcity/abundance on display
      Object.keys(ITEM_TYPES).forEach(itemType => {
        const displayed = displayedItems[itemType] || 0;
        const currentDemand = prev.market.demand[itemType as ItemType];
        
        if (displayed === 0) {
          newState.market.demand[itemType as ItemType] = Math.min(1.5, currentDemand + 0.1);
        } else if (displayed > 3) {
          newState.market.demand[itemType as ItemType] = Math.max(0.5, currentDemand - 0.05);
        } else {
          if (currentDemand > 1.0) {
            newState.market.demand[itemType as ItemType] = Math.max(1.0, currentDemand - 0.02);
          } else if (currentDemand < 1.0) {
            newState.market.demand[itemType as ItemType] = Math.min(1.0, currentDemand + 0.02);
          }
        }
      });
      
      return newState;
    });
  }, []);

  // Close overlays on escape
  const handleEscape = useCallback(() => {
    setGameState(prev => {
      if (prev.helpVisible) {
        return { ...prev, helpVisible: false };
      } else {
        return {
          ...prev,
          supplier: { ...prev.supplier, visible: false },
          selectedCustomer: null
        };
      }
    });
  }, []);

  return {
    gameState,
    setGameState,
    // Helper functions
    showNotification,
    updateCamera,
    togglePause,
    togglePlacementMode,
    toggleSupplier,
    toggleShop,
    toggleHelp,
    selectItem,
    selectCustomer,
    setHoveredFurniture,
    placeItemOnFurniture,
    updateTime,
    refreshSupplier,
    purchaseFromSupplier,
    updateMarketDemand,
    handleEscape
  };
};