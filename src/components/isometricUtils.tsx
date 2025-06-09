import { 
  TILE_WIDTH, 
  TILE_HEIGHT, 
  CANVAS_WIDTH,
  ITEM_TYPES, 
  FURNITURE_TYPES, 
  CUSTOMER_TYPES,
  type ItemType,
  type FurnitureType,
  type CustomerType,
  type Furniture,
  type Customer,
  type GameState
} from './gameConstants';

// Isometric conversion utilities
export const cartesianToIsometric = (x: number, y: number) => {
  return {
    x: (x - y) * (TILE_WIDTH / 2),
    y: (x + y) * (TILE_HEIGHT / 2)
  };
};

export const isometricToCartesian = (x: number, y: number) => {
  return {
    x: (x / (TILE_WIDTH / 2) + y / (TILE_HEIGHT / 2)) / 2,
    y: (y / (TILE_HEIGHT / 2) - x / (TILE_WIDTH / 2)) / 2
  };
};

// Canvas drawing utilities
export const drawRoundedRect = (
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// Item drawing function
export const drawItem = (
  ctx: CanvasRenderingContext2D, 
  itemType: typeof ITEM_TYPES[ItemType], 
  x: number, 
  y: number
) => {
  ctx.save();
  ctx.fillStyle = itemType.color;
  
  if (itemType.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(x, y, itemType.size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (itemType.shape === 'rect') {
    ctx.fillRect(x - itemType.size / 2, y - itemType.size / 2, itemType.size, itemType.size * 0.6);
  } else if (itemType.shape === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(x, y - itemType.size / 2);
    ctx.lineTo(x + itemType.size / 2, y + itemType.size / 2);
    ctx.lineTo(x - itemType.size / 2, y + itemType.size / 2);
    ctx.closePath();
    ctx.fill();
  }
  
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.restore();
};

// Isometric tile drawing
export const drawIsometricTile = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  type: 'floor' | 'wall' | 'door',
  cameraX: number,
  cameraY: number
) => {
  const iso = cartesianToIsometric(x, y);
  const screenX = iso.x + CANVAS_WIDTH / 2 + cameraX;
  const screenY = iso.y + 100 + cameraY;

  ctx.save();
  
  if (type === 'floor') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
    ctx.lineTo(screenX, screenY + TILE_HEIGHT);
    ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (type === 'wall') {
    const wallHeight = 40;
    
    ctx.fillStyle = color;
    ctx.fillRect(screenX - TILE_WIDTH / 2, screenY - wallHeight, TILE_WIDTH, wallHeight + TILE_HEIGHT / 2);
    
    ctx.fillStyle = '#5A5A5A';
    ctx.beginPath();
    ctx.moveTo(screenX - TILE_WIDTH / 2, screenY - wallHeight);
    ctx.lineTo(screenX, screenY - wallHeight - TILE_HEIGHT / 2);
    ctx.lineTo(screenX + TILE_WIDTH / 2, screenY - wallHeight);
    ctx.lineTo(screenX, screenY - wallHeight + TILE_HEIGHT / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#3A3A3A';
    ctx.beginPath();
    ctx.moveTo(screenX + TILE_WIDTH / 2, screenY - wallHeight);
    ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
    ctx.lineTo(screenX, screenY + TILE_HEIGHT);
    ctx.lineTo(screenX, screenY - wallHeight + TILE_HEIGHT / 2);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'door') {
    const doorHeight = 35;
    ctx.fillStyle = color;
    ctx.fillRect(screenX - TILE_WIDTH / 2 + 10, screenY - doorHeight, TILE_WIDTH - 20, doorHeight + TILE_HEIGHT / 2);
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(screenX + 15, screenY - doorHeight / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
};

// Furniture drawing
export const drawFurniture = (
  ctx: CanvasRenderingContext2D,
  furniture: Furniture,
  x: number,
  y: number,
  gameState: GameState
) => {
  const furnitureType = FURNITURE_TYPES[furniture.type];
  const iso = cartesianToIsometric(x, y);
  const screenX = iso.x + CANVAS_WIDTH / 2 + gameState.camera.x;
  const screenY = iso.y + 100 + gameState.camera.y;
  
  ctx.save();
  
  // Draw hover effect
  if (gameState.hoveredFurniture === furniture.id && gameState.placementMode) {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.fillRect(screenX - 35, screenY - furnitureType.height - 5, 70, furnitureType.height + 20);
  }
  
  ctx.fillStyle = furnitureType.color;
  
  if (furniture.type === 'shelf') {
    ctx.fillRect(screenX - 25, screenY - furnitureType.height, 50, furnitureType.height + 10);
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    for (let i = 1; i < furnitureType.slots; i++) {
      const dividerY = screenY - furnitureType.height + (furnitureType.height / furnitureType.slots * i);
      ctx.beginPath();
      ctx.moveTo(screenX - 25, dividerY);
      ctx.lineTo(screenX + 25, dividerY);
      ctx.stroke();
    }
  } else if (furniture.type === 'counter') {
    ctx.fillRect(screenX - 30, screenY - furnitureType.height, 60, furnitureType.height + 15);
    
    ctx.fillStyle = '#8B6F47';
    ctx.fillRect(screenX - 30, screenY - furnitureType.height, 60, 3);
  } else if (furniture.type === 'display') {
    ctx.fillStyle = furnitureType.color;
    ctx.fillRect(screenX - 20, screenY - furnitureType.height, 40, furnitureType.height + 10);

    ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
    ctx.fillRect(screenX - 18, screenY - furnitureType.height + 2, 36, furnitureType.height - 4);
  } else if (furniture.type === 'weaponRack') {
    ctx.fillRect(screenX - 25, screenY - furnitureType.height, 50, furnitureType.height + 5);
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(screenX - 25, screenY - furnitureType.height, 50, 3);
  } else if (furniture.type === 'potionStand') {
    ctx.fillRect(screenX - 15, screenY - furnitureType.height, 30, furnitureType.height);
    ctx.fillStyle = '#4A148C';
    ctx.fillRect(screenX - 15, screenY - furnitureType.height, 30, 3);
  }
  
  // Draw slot indicators in placement mode
  if (gameState.placementMode && gameState.selectedItem) {
    const availableSlots = furnitureType.slots - furniture.items.length;
    if (availableSlots > 0) {
      ctx.fillStyle = '#00FF00';
      ctx.font = '10px Arial';
      ctx.fillText(availableSlots + ' slots', screenX - 15, screenY - furnitureType.height - 10);
    }
  }
  
  furniture.items.forEach((item, index) => {
    const itemType = ITEM_TYPES[item.type];
    const slotHeight = furnitureType.height / furnitureType.slots;
    let itemX = screenX;
    let itemY = screenY - furnitureType.height + (slotHeight * (index + 0.5));
    
    if (furniture.type === 'counter') {
      itemX = screenX - 20 + (index * 20);
      itemY = screenY - furnitureType.height - 5;
    }
    
    drawItem(ctx, itemType, itemX, itemY);
  });
  
  ctx.restore();
};

// Customer drawing
export const drawCustomer = (
  ctx: CanvasRenderingContext2D,
  customer: Customer,
  gameState: GameState
) => {
  const customerType = CUSTOMER_TYPES[customer.type];
  const iso = cartesianToIsometric(customer.x, customer.y);
  const screenX = iso.x + CANVAS_WIDTH / 2 + gameState.camera.x;
  const screenY = iso.y + 100 + gameState.camera.y;
  
  ctx.save();
  
  // Draw customer body
  ctx.fillStyle = customerType.color;
  ctx.beginPath();
  ctx.arc(screenX, screenY - 20, 10, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw head
  ctx.fillStyle = '#FDBCB4';
  ctx.beginPath();
  ctx.arc(screenX, screenY - 35, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw type-specific features
  if (customer.type === 'warrior') {
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(screenX - 8, screenY - 42, 16, 10);
  } else if (customer.type === 'noble') {
    // Crown
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(screenX - 8, screenY - 40);
    ctx.lineTo(screenX - 4, screenY - 45);
    ctx.lineTo(screenX, screenY - 42);
    ctx.lineTo(screenX + 4, screenY - 45);
    ctx.lineTo(screenX + 8, screenY - 40);
    ctx.closePath();
    ctx.fill();
  }
  
  // Draw mood indicator
  if (customer.mood === 'happy') {
    ctx.fillStyle = '#00FF00';
    ctx.fillText('😊', screenX - 5, screenY - 45);
  } else if (customer.mood === 'angry') {
    ctx.fillStyle = '#FF0000';
    ctx.fillText('😠', screenX - 5, screenY - 45);
  }
  
  // Draw patience bar
  if (customer.state !== 'leaving' && customer.state !== 'buying') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(screenX - 15, screenY - 50, 30, 4);
    
    const patiencePercent = customer.patience / customerType.patience;
    ctx.fillStyle = patiencePercent > 0.5 ? '#00FF00' : patiencePercent > 0.2 ? '#FFFF00' : '#FF0000';
    ctx.fillRect(screenX - 15, screenY - 50, 30 * patiencePercent, 4);
  }
  
  // Draw interaction indicator for selected customer
  if (gameState.selectedCustomer === customer.id && customer.state === 'deciding') {
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenX, screenY - 20, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Draw message
  if (customer.message && customer.messageTimer > 0) {
    const messageWidth = ctx.measureText(customer.message).width + 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(screenX - messageWidth/2, screenY - 70, messageWidth, 20);
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(customer.message, screenX, screenY - 57);
    ctx.textAlign = 'left';
  }
  
  ctx.restore();
};

// Market calculation utility
export const calculateDynamicPrice = (
  itemType: ItemType, 
  basePrice: number, 
  market: GameState['market']
) => {
  const demand = market.demand[itemType] || 1.0;
  const supply = market.supply[itemType] || 'medium';
  
  let supplyMultiplier = 1.0;
  switch(supply) {
    case 'low': supplyMultiplier = 1.3; break;
    case 'medium': supplyMultiplier = 1.0; break;
    case 'high': supplyMultiplier = 0.8; break;
    default: supplyMultiplier = 1.0;
  }
  
  return Math.round(basePrice * demand * supplyMultiplier);
};