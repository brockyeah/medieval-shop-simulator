import { calculateDynamicPrice } from './isometricUtils';
import { Market } from './gameConstants';

describe('calculateDynamicPrice', () => {
  it('applies demand and supply multipliers', () => {
    const market = {
      demand: { bread: 1.5 } as any,
      supply: { bread: 'low' } as any,
      priceHistory: {}
    } as unknown as Market;
    const price = calculateDynamicPrice('bread' as any, 10, market);
    expect(price).toBeGreaterThan(10);
  });
});
