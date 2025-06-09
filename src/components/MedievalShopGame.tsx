import React, { useEffect, useRef, useCallback } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  FURNITURE_TYPES,
  type ItemType 
} from './gameConstants';
import { 
  drawIsometricTile, 
  drawFurniture, 
  drawCustomer,
  isometricToCartesian
} from './isometricUtils';
import { useGameState } from './useGameState';
import { useCustomerSystem } from './useCustomerSystem';
import {
  StatusPanel,
  NotificationSystem, 
  HelpOverlay,
  CustomerInteractionPanel,
  InventoryPanel,
  SupplierInterface
} from './uiComponents';

const MedievalShopGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  
  const {
    gameState,
    setGameState,
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
  } = useGameState();

  const { spawnCustomer, interactWithCustomer, updateCustomers } = useCustomerSystem(
    gameState,
    setGameState,
    showNotification
  );

  // Main render function
  const render = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw tiles
    const { tiles, furniture } = gameState.shop;
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        const tile = tiles[y][x];
        drawIsometricTile(ctx, x, y, tile.color, tile.type, gameState.camera.x, gameState.camera.y);
      }
    }
    
    // Create depth-sorted entities
    const entities: Array<{ type: 'furniture' | 'customer'; data: any; depth: number }> = [];
    
    furniture.forEach(f => {
      entities.push({ type: 'furniture', data: f, depth: f.x + f.y });
    });
    
    gameState.customers.forEach(c => {
      entities.push({ type: 'customer', data: c, depth: c.x + c.y });
    });
    
    // Sort and draw entities
    entities.sort((a, b) => a.depth - b.depth);
    entities.forEach(entity => {
      if (entity.type === 'furniture') {
        drawFurniture(ctx, entity.data, entity.data.x, entity.data.y, gameState);
      } else if (entity.type === 'customer') {
        drawCustomer(ctx, entity.data, gameState);
      }
    });
    
    // Draw UI components
    StatusPanel({ gameState, ctx });
    NotificationSystem({ gameState, ctx });
    HelpOverlay({ gameState, ctx });
    CustomerInteractionPanel({ gameState, ctx });
    InventoryPanel({ gameState, ctx });
    SupplierInterface({ gameState, ctx });
  }, [gameState]);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!gameState.paused) {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      
      updateTime(deltaTime);
      
      if (gameState.shopOpen && !gameState.supplier.visible) {
        updateCustomers(deltaTime);
      }
      
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          render(ctx);
        }
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.paused, gameState.shopOpen, gameState.supplier.visible, render, updateTime, updateCustomers]);

  // Start game loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  // Market updates
  useEffect(() => {
    const marketInterval = setInterval(() => {
      if (!gameState.paused && gameState.shopOpen) {
        updateMarketDemand();
      }
    }, 5000);
    
    return () => clearInterval(marketInterval);
  }, [gameState.paused, gameState.shopOpen, updateMarketDemand]);

  // Customer spawning
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (!gameState.paused && gameState.shopOpen && gameState.customers.length < 5) {
        const totalDisplayedItems = gameState.shop.furniture.reduce((sum, f) => sum + f.items.length, 0);
        const spawnChance = Math.min(0.8, 0.1 + (totalDisplayedItems * 0.1));
        
        if (Math.random() < spawnChance) {
          spawnCustomer();
        }
      }
    }, 3000);
    
    return () => clearInterval(spawnInterval);
  }, [gameState.paused, gameState.shopOpen, gameState.customers.length, gameState.shop.furniture, spawnCustomer]);

  // Keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const moveSpeed = 10;
      
      // Handle interaction keys separately
      if ((e.key === 'g' || e.key === 'G') && gameState.selectedCustomer !== null) {
        interactWithCustomer(gameState.selectedCustomer, 'greet');
        return;
      }
      if ((e.key === 'h' || e.key === 'H') && gameState.selectedCustomer !== null) {
        interactWithCustomer(gameState.selectedCustomer, 'haggle');
        return;
      }
      if ((e.key === 'r' || e.key === 'R') && gameState.selectedCustomer !== null) {
        interactWithCustomer(gameState.selectedCustomer, 'refuse');
        return;
      }
      
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
          if (!gameState.helpVisible) updateCamera(0, moveSpeed);
          break;
        case 'ArrowDown':
        case 's':
          if (!gameState.helpVisible) updateCamera(0, -moveSpeed);
          break;
        case 'ArrowLeft':
        case 'a':
          if (!gameState.helpVisible) updateCamera(moveSpeed, 0);
          break;
        case 'ArrowRight':
        case 'd':
          if (!gameState.helpVisible) updateCamera(-moveSpeed, 0);
          break;
        case ' ':
          e.preventDefault();
          togglePause();
          break;
        case 'p':
        case 'P':
          togglePlacementMode();
          break;
        case 'b':
        case 'B':
          toggleSupplier();
          if (!gameState.supplier.visible && Math.random() > 0.5) {
            refreshSupplier();
          }
          break;
        case 'o':
        case 'O':
          toggleShop();
          break;
        case '?':
          toggleHelp();
          break;
        case 'Escape':
          handleEscape();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    gameState.selectedCustomer, gameState.helpVisible, gameState.supplier.visible,
    updateCamera, togglePause, togglePlacementMode, toggleSupplier, toggleShop, 
    toggleHelp, handleEscape, interactWithCustomer, refreshSupplier
  ]);

  // Mouse clicks
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check for interaction button clicks
    if (gameState.selectedCustomer !== null) {
      const selectedCustomer = gameState.customers.find(c => c.id === gameState.selectedCustomer);
      if (selectedCustomer && selectedCustomer.state === 'deciding') {
        if (y > CANVAS_HEIGHT - 60 && y < CANVAS_HEIGHT - 35) {
          if (x > CANVAS_WIDTH/2 - 140 && x < CANVAS_WIDTH/2 - 70) {
            interactWithCustomer(gameState.selectedCustomer, 'greet');
            return;
          } else if (x > CANVAS_WIDTH/2 - 60 && x < CANVAS_WIDTH/2 + 10) {
            interactWithCustomer(gameState.selectedCustomer, 'haggle');
            return;
          } else if (x > CANVAS_WIDTH/2 + 20 && x < CANVAS_WIDTH/2 + 90) {
            interactWithCustomer(gameState.selectedCustomer, 'refuse');
            return;
          }
        }
      }
    }
    
    // Supplier interface clicks
    if (gameState.supplier.visible) {
      gameState.supplier.inventory.forEach((item, index) => {
        const itemY = 180 + (index * 80);
        
        if (x > 650 && x < 710 && y > itemY + 15 && y < itemY + 45) {
          purchaseFromSupplier(item.type, 1);
          return;
        }
        if (x > 720 && x < 780 && y > itemY + 15 && y < itemY + 45) {
          purchaseFromSupplier(item.type, 5);
          return;
        }
        if (x > 790 && x < 850 && y > itemY + 15 && y < itemY + 45) {
          purchaseFromSupplier(item.type, 10);
          return;
        }
      });
      return;
    }
    
    // Customer selection
    const worldX = x - CANVAS_WIDTH / 2 - gameState.camera.x;
    const worldY = y - 100 - gameState.camera.y;
    const cartesian = isometricToCartesian(worldX, worldY);
    
    let customerClicked = false;
    gameState.customers.forEach(customer => {
      const distance = Math.sqrt(Math.pow(customer.x - cartesian.x, 2) + Math.pow(customer.y - cartesian.y, 2));
      if (distance < 1 && customer.state === 'deciding') {
        selectCustomer(customer.id);
        customerClicked = true;
      }
    });
    
    if (!customerClicked) {
      selectCustomer(null);
    }
    
    // Inventory selection
    if (x > CANVAS_WIDTH - 220 && x < CANVAS_WIDTH - 10 && y > 40 && y < 340) {
      const itemIndex = Math.floor((y - 60) / 50);
      if (itemIndex >= 0 && itemIndex < gameState.inventory.length) {
        selectItem(gameState.inventory[itemIndex].id);
      }
      return;
    }
    
    // Item placement
    if (gameState.placementMode && gameState.selectedItem) {
      const clickedFurniture = gameState.shop.furniture.find(f => {
        return Math.abs(f.x - Math.round(cartesian.x)) < 0.5 && 
               Math.abs(f.y - Math.round(cartesian.y)) < 0.5;
      });
      
      if (clickedFurniture) {
        const furnitureType = FURNITURE_TYPES[clickedFurniture.type];
        const selectedInv = gameState.inventory.find(inv => inv.id === gameState.selectedItem);
        
        if (clickedFurniture.items.length < furnitureType.slots && selectedInv && selectedInv.quantity > 0) {
          placeItemOnFurniture(clickedFurniture.id, gameState.selectedItem);
        }
      }
    }
  }, [gameState, interactWithCustomer, purchaseFromSupplier, selectCustomer, selectItem, placeItemOnFurniture]);

  // Mouse move handler for hover effects
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameState.placementMode) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const worldX = x - CANVAS_WIDTH / 2 - gameState.camera.x;
    const worldY = y - 100 - gameState.camera.y;
    const cartesian = isometricToCartesian(worldX, worldY);
    
    let hoveredId: number | null = null;
    gameState.shop.furniture.forEach(f => {
      if (Math.abs(f.x - Math.round(cartesian.x)) < 0.5 && 
          Math.abs(f.y - Math.round(cartesian.y)) < 0.5) {
        hoveredId = f.id;
      }
    });
    
    if (hoveredId !== gameState.hoveredFurniture) {
      setHoveredFurniture(hoveredId);
    }
  }, [gameState.placementMode, gameState.camera, gameState.shop.furniture, gameState.hoveredFurniture, setHoveredFurniture]);

  return (
    <div className="game-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#2C2416',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'Georgia, serif'
    }}>
      <h1 style={{ 
        color: '#FFD700', 
        marginBottom: '20px', 
        fontFamily: 'Georgia, serif',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        fontSize: '36px'
      }}>
        Medieval Shop Simulator
      </h1>
      
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        style={{
          border: '3px solid #8B4513',
          borderRadius: '5px',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
          cursor: gameState.placementMode ? 'pointer' : 
                   gameState.supplier.visible ? 'default' : 
                   gameState.selectedCustomer ? 'pointer' : 'default',
          imageRendering: 'crisp-edges'
        }}
      />
      
      <div style={{
        marginTop: '20px',
        color: '#FFFFFF',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '800px'
      }}>
        <p style={{ marginBottom: '5px' }}>
          <span style={{ color: '#FFD700' }}>Movement:</span> WASD/Arrows | 
          <span style={{ color: '#FFD700' }}> Actions:</span> P: Place items | B: Buy supplies | O: Open shop
        </p>
        <p style={{ marginBottom: '5px' }}>
          <span style={{ color: '#FFD700' }}>Interaction:</span> Click customers | G: Greet | H: Haggle | R: Refuse
        </p>
        <p style={{ fontSize: '12px', marginTop: '10px', color: '#AAA' }}>
          Modular Architecture - Clean, maintainable, and memory-efficient!
        </p>
      </div>
    </div>
  );
};

export default MedievalShopGame;