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
  discount: number;
  is_free: boolean;
  notes: string;
}

interface CartState {
  items: CartItem[];
  orderType: 'dine_in' | 'takeaway' | 'delivery' | 'walk_in' | 'online';
  tableId: string | null;
  activeTransactionId: string | null;
  customerId: string;
  notes: string;
  discount: number;
  discountType: 'fixed' | 'percent';
  total: number;
  addItem: (item: Omit<CartItem, 'quantity' | 'cartId'>) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  updateItemConfig: (cartId: string, config: { discount?: number; is_free?: boolean; notes?: string }) => void;
  setOrderType: (type: CartState['orderType']) => void;
  setTable: (id: string | null) => void;
  setActiveTransactionId: (id: string | null) => void;
  setCustomerId: (id: string) => void;
  setNotes: (notes: string) => void;
  setDiscount: (discount: number) => void;
  setDiscountType: (type: CartState['discountType']) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  resetCart: (data: { 
    items: CartItem[], 
    orderType: CartState['orderType'], 
    tableId: string | null,
    activeTransactionId?: string | null,
    customerId?: string,
    notes?: string,
    discount?: number,
    discountType?: CartState['discountType']
  }) => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      orderType: 'dine_in',
      tableId: null,
      activeTransactionId: null,
      customerId: '',
      notes: '',
      discount: 0,
      discountType: 'fixed',
      total: 0,
      addItem: (newItem) => {
        const items = get().items;
        const modKey = newItem.modifiers.map(m => m.modifier_id).sort().join(',');
        const cartId = `${newItem.id}-${modKey}`;
        const existingItem = items.find((item) => item.cartId === cartId);
        const totalPrice = newItem.price + newItem.modifiers.reduce((sum, m) => sum + m.price, 0);

        let newItems;
        if (existingItem) {
          newItems = items.map((item) =>
            item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          newItems = [...items, { ...newItem, cartId, price: totalPrice, quantity: 1, discount: 0, is_free: false, notes: '' }];
        }
        
        set({ 
          items: newItems,
          total: newItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)) - (Number(item.discount) || 0), 0)
        });
      },
      removeItem: (cartId) => {
        const newItems = get().items.filter((item) => item.cartId !== cartId);
        set({ 
          items: newItems,
          total: newItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)) - (Number(item.discount) || 0), 0)
        });
      },
      updateQuantity: (cartId, quantity) => {
        const newItems = get().items.map((item) =>
          item.cartId === cartId ? { ...item, quantity: Math.max(1, quantity) } : item
        );
        set({ 
          items: newItems,
          total: newItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)) - (Number(item.discount) || 0), 0)
        });
      },
      updateItemConfig: (cartId, config) => {
        const newItems = get().items.map((item) =>
          item.cartId === cartId ? { ...item, ...config } : item
        );
        set({ 
          items: newItems,
          total: newItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)) - (Number(item.discount) || 0), 0)
        });
      },
      setOrderType: (orderType) => set({ orderType, tableId: orderType !== 'dine_in' ? null : get().tableId }),
      setTable: (tableId) => set({ tableId }),
      setActiveTransactionId: (activeTransactionId) => set({ activeTransactionId }),
      setCustomerId: (customerId) => set({ customerId }),
      setNotes: (notes) => set({ notes }),
      setDiscount: (discount) => set({ discount }),
      setDiscountType: (discountType) => set({ discountType }),
      clearCart: () => set({ 
        items: [], 
        tableId: null, 
        activeTransactionId: null, 
        customerId: '', 
        notes: '', 
        discount: 0, 
        discountType: 'fixed',
        total: 0
      }),
      setItems: (items) => set({ 
        items,
        total: items.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)) - (Number(item.discount) || 0), 0)
      }),
      resetCart: (data) => set({ 
        items: data.items, 
        orderType: data.orderType, 
        tableId: data.tableId,
        activeTransactionId: data.activeTransactionId ?? null,
        customerId: data.customerId ?? '',
        notes: data.notes ?? '',
        discount: data.discount ?? 0,
        discountType: data.discountType ?? 'fixed',
        total: data.items.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)) - (Number(item.discount) || 0), 0)
      }),
      getTotal: () => get().total,
    }),
    {
      name: 'cart-storage',
    }
  )
);
