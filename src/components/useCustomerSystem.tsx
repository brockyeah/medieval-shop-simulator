import { useCallback } from 'react';
import { 
  CUSTOMER_TYPES,
  ITEM_TYPES,
  type Customer,
  type CustomerType,
  type ItemType,
  type GameState
} from './gameConstants';
import { calculateDynamicPrice } from './isometricUtils';

export const useCustomerSystem = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  showNotification: (message: string, type?: 'info' | 'success' | 'error') => void
) => {
  
  // Spawn a new customer
  const spawnCustomer = useCallback(() => {
    const customerTypes = Object.keys(CUSTOMER_TYPES) as CustomerType[];
    // Noble customers only spawn with higher reputation
    const availableTypes = gameState.reputation >= 60 ? customerTypes : customerTypes.filter(t => t !== 'noble');
    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const customerType = CUSTOMER_TYPES[randomType];
    
    setGameState(prev => {
      const newCustomer: Customer = {
        id: prev.customerIdCounter,
        type: randomType,
        x: 5,
        y: 6.5,
        targetX: 5,
        targetY: 4,
        state: 'entering',
        wantedItem: null,
        foundItem: null,
        patience: customerType.patience,
        budget: customerType.budget.min + Math.random() * (customerType.budget.max - customerType.budget.min),
        message: null,
        messageTimer: 0,
        mood: 'neutral',
        hasGreeted: false,
        haggleAttempts: 0
      };
      
      return {
        ...prev,
        customers: [...prev.customers, newCustomer],
        customerIdCounter: prev.customerIdCounter + 1
      };
    });
  }, [gameState.reputation, setGameState]);

  // Handle customer interaction
  const interactWithCustomer = useCallback((customerId: number, action: 'greet' | 'haggle' | 'refuse') => {
    setGameState(prev => {
      const newState = { ...prev };
      const customer = newState.customers.find(c => c.id === customerId);
      if (!customer) return prev;
      
      const customerType = CUSTOMER_TYPES[customer.type];
      
      switch(action) {
        case 'greet':
          if (!customer.hasGreeted) {
            customer.message = customerType.greetings[Math.floor(Math.random() * customerType.greetings.length)];
            customer.messageTimer = 3000;
            customer.hasGreeted = true;
            customer.mood = 'neutral';
            newState.reputation = Math.min(100, newState.reputation + 1);
          }
          break;
          
        case 'haggle':
          if (customer.state === 'deciding' && customer.foundItem) {
            const basePrice = ITEM_TYPES[customer.foundItem.type].basePrice;
            const currentPrice = calculateDynamicPrice(customer.foundItem.type, basePrice, prev.market);
            
            if (customer.haggleAttempts < 2) {
              const discount = 0.1 + (Math.random() * 0.1); // 10-20% discount
              newState.haggleOffer = Math.round(currentPrice * (1 - discount));
              customer.haggleAttempts++;
              
              // Customer response based on offer vs budget
              if (newState.haggleOffer <= customer.budget * 0.7) {
                customer.mood = 'happy';
                customer.message = customerType.haggleResponses.happy[Math.floor(Math.random() * customerType.haggleResponses.happy.length)];
                customer.state = 'buying';
              } else if (newState.haggleOffer <= customer.budget) {
                customer.mood = 'neutral';
                customer.message = customerType.haggleResponses.accept[Math.floor(Math.random() * customerType.haggleResponses.accept.length)];
                customer.state = 'buying';
              } else {
                customer.mood = 'angry';
                customer.message = customerType.haggleResponses.reject[Math.floor(Math.random() * customerType.haggleResponses.reject.length)];
                if (Math.random() > 0.5) {
                  customer.state = 'leaving';
                  customer.targetX = 5;
                  customer.targetY = 6.5;
                }
              }
              customer.messageTimer = 2500;
            }
          }
          break;
          
        case 'refuse':
          customer.mood = 'angry';
          customer.message = "How rude! I'll take my business elsewhere!";
          customer.messageTimer = 2000;
          customer.state = 'leaving';
          customer.targetX = 5;
          customer.targetY = 6.5;
          newState.reputation = Math.max(0, newState.reputation - 2);
          break;
      }
      
      return newState;
    });
  }, [setGameState]);

  // Update customer behavior
  const updateCustomers = useCallback((deltaTime: number) => {
    setGameState(prev => {
      const newState = { ...prev };
      
      newState.customers = newState.customers.map(customer => {
        const customerType = CUSTOMER_TYPES[customer.type];
        const updatedCustomer = { ...customer };
        
        const dx = updatedCustomer.targetX - updatedCustomer.x;
        const dy = updatedCustomer.targetY - updatedCustomer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0.1) {
          updatedCustomer.x += (dx / distance) * customerType.speed * deltaTime;
          updatedCustomer.y += (dy / distance) * customerType.speed * deltaTime;
        }
        
        if (updatedCustomer.messageTimer > 0) {
          updatedCustomer.messageTimer -= deltaTime;
        }
        
        switch (updatedCustomer.state) {
          case 'entering':
            if (distance < 0.1) {
              updatedCustomer.state = 'browsing';
              updatedCustomer.wantedItem = customerType.interests[Math.floor(Math.random() * customerType.interests.length)];
              if (!updatedCustomer.hasGreeted) {
                updatedCustomer.message = "Hmm, where is the " + ITEM_TYPES[updatedCustomer.wantedItem].name + "?";
                updatedCustomer.messageTimer = 2000;
              }
              
              const randomFurniture = prev.shop.furniture[Math.floor(Math.random() * prev.shop.furniture.length)];
              updatedCustomer.targetX = randomFurniture.x;
              updatedCustomer.targetY = randomFurniture.y + 1;
            }
            break;
            
          case 'browsing':
            updatedCustomer.patience -= deltaTime * 0.01;
            
            if (distance < 0.1) {
              const nearbyFurniture = prev.shop.furniture.find(f => 
                Math.abs(f.x - updatedCustomer.x) < 1 && Math.abs(f.y - (updatedCustomer.y - 1)) < 1
              );
              
              if (nearbyFurniture) {
                const foundItem = nearbyFurniture.items.find(item => item.type === updatedCustomer.wantedItem);
                if (foundItem) {
                  updatedCustomer.foundItem = foundItem;
                  updatedCustomer.state = 'deciding';
                  const price = calculateDynamicPrice(foundItem.type, ITEM_TYPES[foundItem.type].basePrice, prev.market);
                  updatedCustomer.message = 'Hmm, $' + price + ' for ' + ITEM_TYPES[foundItem.type].name + '...';
                  updatedCustomer.messageTimer = 2000;
                } else {
                  const otherFurniture = prev.shop.furniture.filter(f => f.id !== nearbyFurniture.id);
                  if (otherFurniture.length > 0 && updatedCustomer.patience > 20) {
                    const nextFurniture = otherFurniture[Math.floor(Math.random() * otherFurniture.length)];
                    updatedCustomer.targetX = nextFurniture.x;
                    updatedCustomer.targetY = nextFurniture.y + 1;
                  } else {
                    updatedCustomer.state = 'leaving';
                    updatedCustomer.message = "Couldn't find what I need...";
                    updatedCustomer.messageTimer = 2000;
                    updatedCustomer.targetX = 5;
                    updatedCustomer.targetY = 6.5;
                  }
                }
              }
            }
            break;
            
          case 'deciding':
            if (updatedCustomer.messageTimer <= 0) {
              const price = calculateDynamicPrice(updatedCustomer.foundItem!.type, ITEM_TYPES[updatedCustomer.foundItem!.type].basePrice, prev.market);
              
              if (price <= updatedCustomer.budget * 0.8) {
                updatedCustomer.state = 'buying';
                updatedCustomer.message = "I'll take it!";
                updatedCustomer.messageTimer = 1500;
              } else if (price <= updatedCustomer.budget) {
                if (Math.random() > 0.5) {
                  updatedCustomer.state = 'buying';
                  updatedCustomer.message = "A bit pricey, but okay...";
                  updatedCustomer.messageTimer = 1500;
                } else {
                  updatedCustomer.state = 'leaving';
                  updatedCustomer.message = "Too expensive for me.";
                  updatedCustomer.messageTimer = 2000;
                  updatedCustomer.targetX = 5;
                  updatedCustomer.targetY = 6.5;
                }
              } else {
                updatedCustomer.state = 'leaving';
                updatedCustomer.message = "I can't afford this!";
                updatedCustomer.messageTimer = 2000;
                updatedCustomer.targetX = 5;
                updatedCustomer.targetY = 6.5;
              }
            }
            break;
            
          case 'buying':
            if (updatedCustomer.messageTimer <= 0) {
              const itemType = updatedCustomer.foundItem!.type;
              const basePrice = ITEM_TYPES[itemType].basePrice;
              const regularPrice = calculateDynamicPrice(itemType, basePrice, prev.market);
              const finalPrice = prev.haggleOffer || regularPrice;
              
              newState.gold += finalPrice;
              
              const furniture = newState.shop.furniture.find(f => 
                f.items.some(item => item.id === updatedCustomer.foundItem!.id)
              );
              if (furniture) {
                furniture.items = furniture.items.filter(item => item.id !== updatedCustomer.foundItem!.id);
              }
              
              newState.salesHistory.push({
                customerId: updatedCustomer.id,
                customerType: updatedCustomer.type,
                item: itemType,
                price: finalPrice,
                haggled: prev.haggleOffer !== null,
                time: prev.time
              });
              
              // Update reputation based on customer mood
              if (updatedCustomer.mood === 'happy') {
                newState.reputation = Math.min(100, newState.reputation + 2);
              } else if (updatedCustomer.mood === 'angry') {
                newState.reputation = Math.max(0, newState.reputation - 1);
              }
              
              newState.market.demand[itemType] = Math.min(1.5, newState.market.demand[itemType] + 0.05);
              
              updatedCustomer.state = 'leaving';
              updatedCustomer.message = updatedCustomer.mood === 'happy' ? "Thank you! I'll be back!" : "Thank you.";
              updatedCustomer.messageTimer = 1500;
              updatedCustomer.targetX = 5;
              updatedCustomer.targetY = 6.5;
              
              // Show sale notification
              const saleMessage = `Sold ${ITEM_TYPES[itemType].name} for $${finalPrice}${prev.haggleOffer ? ' (haggled)' : ''}`;
              showNotification(saleMessage, 'success');
              
              // Reset haggle offer
              newState.haggleOffer = null;
            }
            break;
            
          case 'leaving':
            if (distance < 0.1) {
              return null; // Customer will be filtered out
            }
            break;
        }
        
        if (updatedCustomer.patience <= 0 && updatedCustomer.state !== 'leaving') {
          updatedCustomer.state = 'leaving';
          updatedCustomer.message = "I've waited too long!";
          updatedCustomer.messageTimer = 2000;
          updatedCustomer.targetX = 5;
          updatedCustomer.targetY = 6.5;
        }
        
        return updatedCustomer;
      }).filter((c): c is Customer => c !== null);
      
      return newState;
    });
  }, [setGameState, showNotification]);

  return {
    spawnCustomer,
    interactWithCustomer,
    updateCustomers
  };
};