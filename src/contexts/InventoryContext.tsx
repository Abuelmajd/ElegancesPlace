import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Inventory, InventoryMovement } from '../types';
import { useGoogleSheets } from './GoogleSheetsContext';
import { useAuth } from './AuthContext';

export interface InventoryContextType {
  inventory: Inventory[];
  inventoryMovements: InventoryMovement[];
  productStockMap: Record<string, number>;
  getProductStock: (productId: string) => number;
  adjustStock: (productId: string, quantityChange: number, movementType: InventoryMovement['movement_type'], orderId?: string, notes?: string) => void;
  setStockDirectly: (productId: string, newStock: number, notes?: string) => void;
  syncInventoryWithSheets: () => Promise<boolean>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const INITIAL_INVENTORY_MOVEMENTS: InventoryMovement[] = [
  {
    movement_id: 'mov_101',
    product_id: 'p1',
    order_id: 'ord_101',
    quantity: 1,
    before_quantity: 16,
    after_quantity: 15,
    movement_type: 'SALE',
    user_id: 'system',
    date: '2026-08-20',
    time: '14:30:00',
    timestamp: '2026-08-20 14:30:00',
    created_at: '2026-08-20T14:30:00Z',
    notes: 'بيع من المخزون الخاص بالطلب ord_101'
  },
  {
    movement_id: 'mov_102',
    product_id: 'p2',
    order_id: 'ord_102',
    quantity: 1,
    before_quantity: 9,
    after_quantity: 8,
    movement_type: 'SALE',
    user_id: 'system',
    date: '2026-08-22',
    time: '18:15:00',
    timestamp: '2026-08-22 18:15:00',
    created_at: '2026-08-22T18:15:00Z',
    notes: 'بيع من المخزون الخاص بالطلب ord_102'
  }
];

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    syncChangedTables,
    pullTables,
    getCachedTable,
  } = useGoogleSheets();
  const { currentUser } = useAuth();

  const [inventory, setInventory] = useState<Inventory[]>(() => {
    const cached = localStorage.getItem('elites_inventory');

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // ignore
      }
    }

    return [];
  });

  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => {
    const cached = localStorage.getItem('elites_inventory_movements');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // ignore
      }
    }
    return INITIAL_INVENTORY_MOVEMENTS;
  });

  const [productStockMap, setProductStockMap] = useState<Record<string, number>>(() => {
    const cached = localStorage.getItem('elites_product_stock_map');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {
        // ignore
      }
    }
    return {
      'p1': 15,
      'p2': 8,
      'p3': 25,
      'prod_test_a': 50
    };
  });

  useEffect(() => {
    void (async () => {
      try {
        await pullTables(['inventory', 'inventory_movements', 'warehouses']);

        const cachedInventory =
          getCachedTable('inventory') as Inventory[];

        const cachedMovements =
          getCachedTable('inventory_movements') as InventoryMovement[];

        if (Array.isArray(cachedInventory)) {
          setInventory(cachedInventory);
        }

        if (Array.isArray(cachedMovements)) {
          setInventoryMovements(cachedMovements);
        }

        const warehouses = getCachedTable('warehouses') as any[];

        const mainWarehouse = Array.isArray(warehouses)
          ? warehouses.find(w => w.warehouse_id === 'WH_MAIN')
          : null;

        if (!mainWarehouse) {
          await syncChangedTables({
            tables: {
              warehouses: [
                {
                  id: 'wh_001',
                  warehouse_id: 'WH_MAIN',
                  name: 'المستودع الرئيسي',
                  location: 'القدس',
                  address: '',
                  phone: '',
                  manager_name: '',
                  status: 'ACTIVE',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ],
            },
          });
        }
      } catch (error) {
        console.error('Inventory pull error:', error);
      }
    })();
  }, [pullTables, getCachedTable, syncChangedTables]);

  useEffect(() => {
    localStorage.setItem('elites_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('elites_inventory_movements', JSON.stringify(inventoryMovements));
  }, [inventoryMovements]);

  useEffect(() => {
    localStorage.setItem('elites_product_stock_map', JSON.stringify(productStockMap));
  }, [productStockMap]);

  const getProductStock = useCallback((productId: string) => {
    if (productStockMap[productId] !== undefined) {
      return productStockMap[productId];
    }
    return 0;
  }, [productStockMap]);

  const adjustStock = useCallback((
    productId: string,
    quantityChange: number,
    movementType: InventoryMovement['movement_type'],
    orderId?: string,
    notes?: string
  ) => {
    const currentInventory =
      inventory.find(item => item.product_id === productId);

    const currentStock = currentInventory
      ? Number(currentInventory.stock_quantity || 0)
      : getProductStock(productId);

    const newStock = Math.max(0, currentStock + quantityChange);
    const now = new Date();
    const nowIso = now.toISOString();

    const inventoryRecord: Inventory = currentInventory
      ? {
          ...currentInventory,
          stock_quantity: newStock,
          available_quantity: Math.max(
            0,
            newStock - Number(currentInventory.reserved_quantity || 0)
          ),
          last_update: nowIso,
        }
      : {
          id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          inventory_id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          product_id: productId,
          warehouse_id: 'WH_MAIN',
          stock_quantity: newStock,
          reserved_quantity: 0,
          available_quantity: newStock,
          last_update: nowIso,
        };

    const dateStr = nowIso.split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const newMovement: InventoryMovement = {
      movement_id:
        'mov_' +
        Date.now() +
        '_' +
        Math.random().toString(36).substring(2, 6),

      product_id: productId,
      movement_type: movementType,
      quantity: Math.abs(quantityChange),
      quantity_before: currentStock,
      quantity_after: newStock,

      warehouse_id: inventoryRecord.warehouse_id,

      reference_type: orderId ? 'ORDER' : 'MANUAL',
      reference_id: orderId,

      created_by: currentUser?.user_id || 'system',
      created_at: nowIso,
      reason: notes || `حركة مخزون (${movementType})`,

      // Compatibility
      order_id: orderId,
      date: dateStr,
      time: timeStr,
      before_quantity: currentStock,
      after_quantity: newStock,
      timestamp: `${dateStr} ${timeStr}`,
      user_id: currentUser?.user_id || 'system',
      notes: notes || `حركة مخزون (${movementType})`,
    };

    setInventory(prev => {
      const exists = prev.some(
        item => item.product_id === productId
      );

      return exists
        ? prev.map(item =>
            item.product_id === productId
              ? inventoryRecord
              : item
          )
        : [...prev, inventoryRecord];
    });

    setProductStockMap(prev => ({
      ...prev,
      [productId]: inventoryRecord.available_quantity,
    }));

    setInventoryMovements(prev => [
      newMovement,
      ...prev,
    ]);

    void syncChangedTables({
      tables: {
        inventory: [inventoryRecord],
        inventory_movements: [newMovement],
      },
    });
  }, [
    inventory,
    getProductStock,
    currentUser,
    syncChangedTables,
  ]);

  const setStockDirectly = useCallback((productId: string, newStock: number, notes?: string) => {
    const currentStock = getProductStock(productId);
    const diff = newStock - currentStock;
    if (diff === 0) return;

    adjustStock(productId, diff, 'ADJUSTMENT', undefined, notes || 'تعديل مخزون مباشر من لوحة التحكم');
  }, [getProductStock, adjustStock]);

  const syncInventoryWithSheets = useCallback(async () => {
    try {
      return await syncChangedTables({
        tables: {
          inventory,
          inventory_movements: inventoryMovements,
        },
      });
    } catch (error) {
      console.error('Inventory sync error:', error);
      return false;
    }
  }, [
    syncChangedTables,
    inventory,
    inventoryMovements,
  ]);

  return (
    <InventoryContext.Provider value={{
      inventory,
      inventoryMovements,
      productStockMap,
      getProductStock,
      adjustStock,
      setStockDirectly,
      syncInventoryWithSheets
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
