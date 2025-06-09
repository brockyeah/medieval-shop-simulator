import React from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  ITEM_TYPES,
  type GameState,
  type ItemType
} from './gameConstants';
import { calculateDynamicPrice, drawItem, drawRoundedRect } from './isometricUtils';

interface StatusPanelProps {
  gameState: GameState;
  ctx: CanvasRenderingContext2D;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ gameState, ctx }) => {
  // Status panel with gradient
  const gradient = ctx.createLinearGradient(10, 10, 10, 210);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
  ctx.fillStyle = gradient;
  drawRoundedRect(ctx, 10, 10, 200, 200, 10);
  ctx.fill();
  
  // Gold border for status panel
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 10, 10, 200, 200, 10);
  ctx.stroke();
  
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 20px serif';
  ctx.fillText('Medieval Shop', 20, 35);
  
  // Status icons and text
  ctx.font = '14px Arial';
  ctx.fillStyle = '#FFFFFF';
  
  // Gold with coin icon
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(25, 55, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(gameState.gold + ' coins', 40, 59);
  
  // Shop status with icon
  ctx.fillStyle = gameState.shopOpen ? '#00FF00' : '#FF0000';
  ctx.fillRect(20, 70, 10, 10);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Shop: ' + (gameState.shopOpen ? 'OPEN' : 'CLOSED'), 40, 79);
  
  ctx.fillText('Customers: ' + gameState.customers.length, 20, 99);
  ctx.fillText('Sales Today: ' + gameState.salesHistory.length, 20, 119);
  
  // Reputation with fancy bar
  ctx.fillText('Reputation:', 20, 139);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 144, 100, 12);
  
  const repGradient = ctx.createLinearGradient(20, 144, 120, 144);
  const repColor = gameState.reputation > 70 ? '#00FF00' : gameState.reputation > 30 ? '#FFFF00' : '#FF0000';
  repGradient.addColorStop(0, repColor);
  repGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  ctx.fillStyle = repGradient;
  ctx.fillRect(21, 145, gameState.reputation - 2, 10);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '10px Arial';
  ctx.fillText(gameState.reputation + '/100', 125, 153);
  
  ctx.font = '14px Arial';
  ctx.fillText('Mode: ' + (gameState.placementMode ? 'Placement' : 'Normal'), 20, 175);
  
  // Control hints
  ctx.fillStyle = '#FFD700';
  ctx.font = '11px Arial';
  ctx.fillText('Press ? for help', 20, 195);
  
  return null;
};

interface NotificationSystemProps {
  gameState: GameState;
  ctx: CanvasRenderingContext2D;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({ gameState, ctx }) => {
  if (!gameState.notification || gameState.notificationTimer <= 0) return null;
  
  const notifY = 50;
  const notifWidth = ctx.measureText(gameState.notification.message).width + 40;
  const notifX = CANVAS_WIDTH / 2 - notifWidth / 2;
  
  // Notification background
  ctx.fillStyle = gameState.notification.type === 'error' ? 'rgba(255, 0, 0, 0.9)' : 
                  gameState.notification.type === 'success' ? 'rgba(0, 255, 0, 0.9)' : 
                  'rgba(0, 0, 0, 0.9)';
  drawRoundedRect(ctx, notifX, notifY, notifWidth, 30, 5);
  ctx.fill();
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(gameState.notification.message, CANVAS_WIDTH / 2, notifY + 20);
  ctx.textAlign = 'left';
  
  return null;
};

interface HelpOverlayProps {
  gameState: GameState;
  ctx: CanvasRenderingContext2D;
}

export const HelpOverlay: React.FC<HelpOverlayProps> = ({ gameState, ctx }) => {
  if (!gameState.helpVisible) return null;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 24px serif';
  ctx.textAlign = 'center';
  ctx.fillText('Medieval Shop Simulator - Help', CANVAS_WIDTH / 2, 50);
  
  ctx.font = '16px Arial';
  ctx.fillStyle = '#FFFFFF';
  
  const helpText = [
    'Movement & Camera:',
    '  WASD/Arrow Keys - Move camera',
    '  Space - Pause game',
    '',
    'Shop Management:',
    '  B - Open supplier/merchant menu',
    '  O - Open/Close shop for business',
    '  P - Toggle placement mode',
    '',
    'Customer Interaction:',
    '  Click customer - Select for interaction',
    '  G - Greet customer (builds reputation)',
    '  H - Haggle price (offer discount)',
    '  R - Refuse service (damages reputation)',
    '',
    'Gameplay Tips:',
    '  • Buy low from suppliers, sell high to customers',
    '  • Display variety attracts more customers',
    '  • Reputation affects customer types',
    '  • Watch market demand indicators',
    '  • Happy customers increase demand',
    '',
    'Press ? or ESC to close help'
  ];
  
  let helpY = 100;
  helpText.forEach(line => {
    ctx.fillText(line, CANVAS_WIDTH / 2 - 200, helpY);
    helpY += 25;
  });
  
  ctx.textAlign = 'left';
  
  return null;
};

interface CustomerInteractionPanelProps {
  gameState: GameState;
  ctx: CanvasRenderingContext2D;
}

export const CustomerInteractionPanel: React.FC<CustomerInteractionPanelProps> = ({ gameState, ctx }) => {
  if (gameState.selectedCustomer === null) return null;
  
  const selectedCustomer = gameState.customers.find(c => c.id === gameState.selectedCustomer);
  if (!selectedCustomer || selectedCustomer.state !== 'deciding') return null;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(CANVAS_WIDTH/2 - 150, CANVAS_HEIGHT - 100, 300, 90);
  
  ctx.fillStyle = '#FFD700';
  ctx.font = '16px Arial';
  ctx.fillText('Customer Interaction', CANVAS_WIDTH/2 - 140, CANVAS_HEIGHT - 80);
  
  // Interaction buttons
  const buttons = [
    { text: 'Greet (G)', x: CANVAS_WIDTH/2 - 140, action: 'greet' },
    { text: 'Haggle (H)', x: CANVAS_WIDTH/2 - 60, action: 'haggle' },
    { text: 'Refuse (R)', x: CANVAS_WIDTH/2 + 20, action: 'refuse' }
  ];
  
  buttons.forEach(button => {
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(button.x, CANVAS_HEIGHT - 60, 70, 25);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.fillText(button.text, button.x + 5, CANVAS_HEIGHT - 45);
  });
  
  if (gameState.haggleOffer) {
    ctx.fillStyle = '#00FF00';
    ctx.font = '14px Arial';
    ctx.fillText('Offer: $' + gameState.haggleOffer, CANVAS_WIDTH/2 - 140, CANVAS_HEIGHT - 20);
  }
  
  return null;
};

interface InventoryPanelProps {
  gameState: GameState;
  ctx: CanvasRenderingContext2D;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ gameState, ctx }) => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(CANVAS_WIDTH - 220, 10, 210, 400);
  ctx.fillStyle = '#FFD700';
  ctx.font = '18px Arial';
  ctx.fillText('Inventory', CANVAS_WIDTH - 200, 35);
  
  gameState.inventory.forEach((invItem, index) => {
    const itemType = ITEM_TYPES[invItem.type];
    const y = 60 + (index * 50);
    const dynamicPrice = calculateDynamicPrice(invItem.type, itemType.basePrice, gameState.market);
    
    if (gameState.selectedItem === invItem.id) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.fillRect(CANVAS_WIDTH - 215, y - 20, 200, 45);
    }
    
    drawItem(ctx, itemType, CANVAS_WIDTH - 190, y);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.fillText(itemType.name, CANVAS_WIDTH - 165, y - 5);
    ctx.fillText('Qty: ' + invItem.quantity, CANVAS_WIDTH - 165, y + 10);
    
    const profit = dynamicPrice - invItem.averageCost;
    ctx.fillStyle = profit > 0 ? '#00FF00' : '#FF0000';
    ctx.fillText('$' + dynamicPrice + ' (+' + profit + ')', CANVAS_WIDTH - 70, y + 2);
  });
  
  // Market info
  ctx.fillStyle = '#FFD700';
  ctx.font = '12px Arial';
  ctx.fillText('-- Market Prices --', CANVAS_WIDTH - 200, 330);
  ctx.fillStyle = '#FFFFFF';
  let marketY = 345;
  Object.keys(ITEM_TYPES).forEach(itemType => {
    const demand = gameState.market.demand[itemType as ItemType];
    const demandText = demand > 1.2 ? '↑↑' : demand > 1.0 ? '↑' : demand < 0.8 ? '↓↓' : demand < 1.0 ? '↓' : '—';
    ctx.fillText(ITEM_TYPES[itemType as ItemType].name + ': ' + demandText, CANVAS_WIDTH - 200, marketY);
    marketY += 15;
  });
  
  return null;
};

interface SupplierInterfaceProps {
  gameState: GameState;
  ctx: CanvasRenderingContext2D;
}

export const SupplierInterface: React.FC<SupplierInterfaceProps> = ({ gameState, ctx }) => {
  if (!gameState.supplier.visible) return null;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Supplier window
  const supplierGradient = ctx.createLinearGradient(300, 100, 300, 600);
  supplierGradient.addColorStop(0, 'rgba(30, 20, 10, 0.95)');
  supplierGradient.addColorStop(1, 'rgba(50, 30, 20, 0.95)');
  ctx.fillStyle = supplierGradient;
  drawRoundedRect(ctx, 280, 80, 640, 520, 15);
  ctx.fill();
  
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 280, 80, 640, 520, 15);
  ctx.stroke();
  
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 28px serif';
  ctx.textAlign = 'center';
  ctx.fillText('Traveling Merchant', CANVAS_WIDTH / 2, 120);
  
  ctx.font = '16px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Your Gold: ', 480, 150);
  ctx.fillStyle = '#FFD700';
  ctx.fillText(gameState.gold + ' coins', 560, 150);
  
  ctx.textAlign = 'left';
  
  // Draw supplier items with better styling
  gameState.supplier.inventory.forEach((item, index) => {
    const itemType = ITEM_TYPES[item.type];
    const y = 180 + (index * 80);
    
    // Item background gradient
    const itemGradient = ctx.createLinearGradient(320, y, 320, y + 70);
    itemGradient.addColorStop(0, 'rgba(100, 80, 60, 0.4)');
    itemGradient.addColorStop(1, 'rgba(80, 60, 40, 0.4)');
    ctx.fillStyle = itemGradient;
    drawRoundedRect(ctx, 320, y, 560, 70, 10);
    ctx.fill();
    
    // Draw item icon with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    drawItem(ctx, itemType, 350, y + 35);
    ctx.shadowBlur = 0;
    
    // Item info
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(itemType.name, 380, y + 25);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText('Stock: ' + item.quantity, 380, y + 45);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('$' + item.price + ' each', 520, y + 35);
    
    // Buy buttons with hover effect
    const buttons = [
      { text: 'Buy 1', x: 650, amount: 1 },
      { text: 'Buy 5', x: 720, amount: 5 },
      { text: 'Buy 10', x: 790, amount: 10 }
    ];
    
    buttons.forEach(btn => {
      const canAfford = gameState.gold >= item.price * btn.amount && item.quantity >= btn.amount;
      
      // Button gradient
      const btnGradient = ctx.createLinearGradient(btn.x, y + 10, btn.x, y + 35);
      if (canAfford) {
        btnGradient.addColorStop(0, '#4CAF50');
        btnGradient.addColorStop(1, '#2E7D32');
      } else {
        btnGradient.addColorStop(0, '#F44336');
        btnGradient.addColorStop(1, '#B71C1C');
      }
      
      ctx.fillStyle = btnGradient;
      drawRoundedRect(ctx, btn.x, y + 15, 60, 30, 5);
      ctx.fill();
      
      ctx.strokeStyle = canAfford ? '#8BC34A' : '#EF5350';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, btn.x, y + 15, 60, 30, 5);
      ctx.stroke();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(btn.text, btn.x + 30, y + 35);
      ctx.textAlign = 'left';
    });
  });
  
  ctx.fillStyle = '#FFD700';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Press B again or ESC to close', CANVAS_WIDTH / 2, 580);
  ctx.textAlign = 'left';
  
  return null;
};