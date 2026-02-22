import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // Product ID
  cartId: string; // Unique ID for this item in cart (diff products can have diff modifiers)
  name: string;
  price: number;
  quantity: number;
  modifiers: {
    modifier_id: string;
    name: string;
    price: number;
  }[];
}

interface CartState {
  items: CartItem[];
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  tableId: string | null;
  addItem: (item: Omit<CartItem, 'quantity' | 'cartId'>) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  setOrderType: (type: CartState['orderType']) => void;
  setTable: (id: string | null) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  resetCart: (data: { items: CartItem[], orderType: CartState['orderType'], tableId: string | null }) => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      orderType: 'dine_in',
      tableId: null,
      addItem: (newItem) => {
        const items = get().items;
        // Create a unique key for items with same modifiers
        const modKey = newItem.modifiers.map(m => m.modifier_id).sort().join(',');
        const cartId = `${newItem.id}-${modKey}`;
        
        const existingItem = items.find((item) => item.cartId === cartId);

        const totalPrice = newItem.price + newItem.modifiers.reduce((sum, m) => sum + m.price, 0);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.cartId === cartId
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({ items: [...items, { ...newItem, cartId, price: totalPrice, quantity: 1 }] });
        }
      },
      removeItem: (cartId) =>
        set({ items: get().items.filter((item) => item.cartId !== cartId) }),
      updateQuantity: (cartId, quantity) =>
        set({
          items: get().items.map((item) =>
            item.cartId === cartId ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        }),
      setOrderType: (orderType) => set({ orderType, tableId: orderType !== 'dine_in' ? null : get().tableId }),
      setTable: (tableId) => set({ tableId }),
      clearCart: () => set({ items: [], tableId: null }),
      setItems: (items) => set({ items }),
      resetCart: (data) => set({ items: data.items, orderType: data.orderType, tableId: data.tableId }),
      getTotal: () =>
        get().items.reduce((total, item) => total + item.price * item.quantity, 0),
    }),
    {
      name: 'cart-storage',
    }
  )
);
