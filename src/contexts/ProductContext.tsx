import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotifications } from './NotificationContext';
import { extractGoogleDriveId, generateDriveFileId, formatGoogleDriveDirectUrl } from '../utils/googleDriveUtils';
import { ProductImage } from '../types';

export interface StoreProduct {
  id: string;
  product_id?: string;
  sku?: string;
  name: string;
  price: number;
  oldPrice?: number;
  originalPrice?: number;
  costPrice?: number;
  cost_price?: number;
  category: string;
  category_id?: string;
  badge?: string;
  image: string;
  images?: ProductImage[];
  drive_file_id?: string;
  image_data?: string;
  supplier: string;
  supplier_id?: string;
  stock: number;
  fulfillment_method?: 'OWN_STOCK' | 'SUPPLIER_DROPSHIPPING';
  description?: string;
  rating?: number;
  featured?: boolean;
  bestSeller?: boolean;
  newProduct?: boolean;
}

interface ProductContextType {
  products: StoreProduct[];
  addProduct: (product: Omit<StoreProduct, 'id'>) => void;
  updateProduct: (id: string, product: Partial<StoreProduct>) => void;
  updateProducts: (updates: { id: string; product: Partial<StoreProduct> }[]) => void;
  updateProductStock: (id: string, newStock: number) => void;
  deleteProduct: (id: string) => void;
}

const DEFAULT_PRODUCTS: StoreProduct[] = [
  {
    id: 'p1',
    product_id: 'p1',
    sku: 'SKU-OUD-01',
    name: 'عطر العود الملكي الفاخر',
    price: 180,
    oldPrice: 240,
    costPrice: 120,
    category: 'عطور',
    category_id: 'cat_perfumes',
    badge: 'الأكثر مبيعاً',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60',
    supplier: 'مورد العطور المميزة',
    supplier_id: 'sup_1',
    stock: 15,
    fulfillment_method: 'OWN_STOCK',
    description: 'عطر شرقي أصيل بخلاصة العود الملكي الفاخر يدوم طويلاً.',
    rating: 4.9
  },
  {
    id: 'p2',
    product_id: 'p2',
    sku: 'SKU-WAT-02',
    name: 'ساعة يد كلاسيكية أنيقة',
    price: 320,
    oldPrice: 400,
    costPrice: 210,
    category: 'ساعات',
    category_id: 'cat_watches',
    badge: 'جديد',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=60',
    supplier: 'مورد الساعات العالمية',
    supplier_id: 'sup_2',
    stock: 8,
    fulfillment_method: 'OWN_STOCK',
    description: 'ساعة يد رجالية بتصميم كلاسيكي راقٍ ومقاومة للماء.',
    rating: 4.8
  },
  {
    id: 'p3',
    product_id: 'p3',
    sku: 'SKU-BAG-03',
    name: 'حقيبة جلد طبيعي فاخرة',
    price: 250,
    oldPrice: 310,
    costPrice: 160,
    category: 'حقائب',
    category_id: 'cat_handbags',
    badge: 'خصم خاص',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=60',
    supplier: 'مورد الجلديات الفاخرة',
    supplier_id: 'sup_3',
    stock: 12,
    fulfillment_method: 'SUPPLIER_DROPSHIPPING',
    description: 'حقيبة أعمال مصنوعة من أجود أنواع الجلد الطبيعي.',
    rating: 4.7
  },
  {
    id: 'p4',
    product_id: 'p4',
    sku: 'SKU-ACC-04',
    name: 'نظارة شمسية بتصميم عصري',
    price: 140,
    oldPrice: 180,
    costPrice: 85,
    category: 'إكسسوارات',
    category_id: 'cat_accessories',
    badge: 'مميز',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=60',
    supplier: 'مورد الإكسسوارات',
    supplier_id: 'sup_4',
    stock: 20,
    fulfillment_method: 'SUPPLIER_DROPSHIPPING',
    description: 'نظارة شمسية عصرية توفر حماية كاملة من الأشعة فوق البنفسجية.',
    rating: 4.9
  }
];

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notifyLowStock } = useNotifications();
  const [products, setProducts] = useState<StoreProduct[]>(() => {
    const saved = localStorage.getItem('elites_store_products') || localStorage.getItem('elites_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_PRODUCTS;
  });

  useEffect(() => {
    localStorage.setItem('elites_store_products', JSON.stringify(products));
    localStorage.setItem('elites_products', JSON.stringify(products));
  }, [products]);

  const addProduct = (productData: Omit<StoreProduct, 'id'>) => {
    const id = 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const rawImg = productData.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
    let formattedImg = rawImg;
    let driveId = extractGoogleDriveId(rawImg);
    if (driveId) {
      formattedImg = `https://lh3.googleusercontent.com/d/${driveId}`;
    } else if (rawImg.startsWith('data:') || rawImg.startsWith('http')) {
      formattedImg = rawImg;
      driveId = 'drive_' + Math.random().toString(36).substring(2, 9);
    } else {
      driveId = generateDriveFileId();
      formattedImg = `https://lh3.googleusercontent.com/d/${driveId}`;
    }

    const newProduct: StoreProduct = {
      ...productData,
      id: id,
      product_id: id,
      image: formattedImg,
      drive_file_id: driveId,
      rating: productData.rating || 5.0
    };

    setProducts(prev => {
      const updated = [newProduct, ...prev];
      localStorage.setItem('elites_store_products', JSON.stringify(updated));
      localStorage.setItem('elites_products', JSON.stringify(updated));

      try {
        const rawImgs = JSON.parse(localStorage.getItem('elites_product_images') || '[]');
        const folderId = localStorage.getItem('elites_drive_folder_id') || '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R';
        const newImgRecord = {
          image_id: 'img_' + id,
          product_id: id,
          drive_file_id: driveId,
          image_url: formattedImg,
          folder_path: `Google Drive / Product Images Folder (${folderId})`,
          is_primary: true,
          sort_order: 1
        };
        const updatedImgs = [newImgRecord, ...rawImgs.filter((img: any) => img.product_id !== id)];
        localStorage.setItem('elites_product_images', JSON.stringify(updatedImgs));
      } catch (e) {
        // ignore
      }

      return updated;
    });

    window.dispatchEvent(new Event('elites_product_changed'));
  };

  const updateProduct = (id: string, updatedFields: Partial<StoreProduct>) => {
    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === id || p.product_id === id) {
          let formattedImg = updatedFields.image !== undefined ? updatedFields.image : p.image;
          let driveId = p.drive_file_id;
          if (updatedFields.image !== undefined) {
            const extracted = extractGoogleDriveId(updatedFields.image);
            if (extracted) {
              driveId = extracted;
              formattedImg = `https://lh3.googleusercontent.com/d/${driveId}`;
            } else if (updatedFields.image.startsWith('data:') || updatedFields.image.startsWith('http')) {
              formattedImg = updatedFields.image;
            }
          }
          const merged = { ...p, ...updatedFields, image: formattedImg, drive_file_id: driveId };

          try {
            const rawImgs = JSON.parse(localStorage.getItem('elites_product_images') || '[]');
            const folderId = localStorage.getItem('elites_drive_folder_id') || '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R';
            const imgRecord = {
              image_id: 'img_' + (merged.product_id || id),
              product_id: merged.product_id || id,
              drive_file_id: driveId,
              image_url: formattedImg,
              folder_path: `Google Drive / products images (${folderId})`,
              is_primary: true,
              sort_order: 1
            };
            const updatedImgs = [imgRecord, ...rawImgs.filter((img: any) => img.product_id !== id && img.product_id !== merged.product_id)];
            localStorage.setItem('elites_product_images', JSON.stringify(updatedImgs));
          } catch (e) {
            // ignore
          }

          return merged;
        }
        return p;
      });

      localStorage.setItem('elites_store_products', JSON.stringify(updated));
      localStorage.setItem('elites_products', JSON.stringify(updated));
      return updated;
    });

    window.dispatchEvent(new Event('elites_product_changed'));
  };

  const updateProductStock = (id: string, newStock: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id || p.product_id === id) {
        if (newStock <= 5) {
          notifyLowStock({ ...p, stock: newStock } as any).catch(console.error);
        }
        return { ...p, stock: newStock };
      }
      return p;
    }));
  };

  const updateProducts = (updates: { id: string; product: Partial<StoreProduct> }[]) => {
    setProducts(prev => {
      const updated = prev.map(p => {
        const update = updates.find(u => u.id === p.id || u.id === p.product_id);
        if (update) {
          return { ...p, ...update.product };
        }
        return p;
      });

      console.log("Context - Products updated:", updated);
      localStorage.setItem('elites_store_products', JSON.stringify(updated));
      localStorage.setItem('elites_products', JSON.stringify(updated));
      return [...updated]; // ضمان إرجاع مصفوفة جديدة لـ Trigger Re-render
    });
    window.dispatchEvent(new Event('elites_product_changed'));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id && p.product_id !== id);
      localStorage.setItem('elites_store_products', JSON.stringify(updated));
      localStorage.setItem('elites_products', JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new Event('elites_product_changed'));
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, updateProducts, updateProductStock, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
