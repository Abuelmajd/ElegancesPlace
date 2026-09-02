import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef
} from 'react';

import { useNotifications } from './NotificationContext';

import {
  extractGoogleDriveId,
  generateDriveFileId
} from '../utils/googleDriveUtils';

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
  updateProduct: (
    id: string,
    product: Partial<StoreProduct>
  ) => void;
  updateProducts: (
    updates: {
      id: string;
      product: Partial<StoreProduct>;
    }[]
  ) => void;
  updateProductStock: (
    id: string,
    newStock: number
  ) => void;
  deleteProduct: (id: string) => void;
}

/* =========================================================
   CONSTANTS
   ========================================================= */

const PRODUCTS_CACHE_KEY = 'elites_store_products';

const LEGACY_PRODUCTS_CACHE_KEY = 'elites_products';

const PRODUCT_IMAGES_CACHE_KEY =
  'elites_product_images';

const DRIVE_FOLDER_KEY =
  'elites_drive_folder_id';

const DEFAULT_DRIVE_FOLDER_ID =
  '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R';

/* =========================================================
   DEFAULT PRODUCTS
   ========================================================= */

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
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60',
    supplier: 'مورد العطور المميزة',
    supplier_id: 'sup_1',
    stock: 15,
    fulfillment_method: 'OWN_STOCK',
    description:
      'عطر شرقي أصيل بخلاصة العود الملكي الفاخر يدوم طويلاً.',
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
    image:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=60',
    supplier: 'مورد الساعات العالمية',
    supplier_id: 'sup_2',
    stock: 8,
    fulfillment_method: 'OWN_STOCK',
    description:
      'ساعة يد رجالية بتصميم كلاسيكي راقٍ ومقاومة للماء.',
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
    image:
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=60',
    supplier: 'مورد الجلديات الفاخرة',
    supplier_id: 'sup_3',
    stock: 12,
    fulfillment_method:
      'SUPPLIER_DROPSHIPPING',
    description:
      'حقيبة أعمال مصنوعة من أجود أنواع الجلد الطبيعي.',
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
    image:
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=60',
    supplier: 'مورد الإكسسوارات',
    supplier_id: 'sup_4',
    stock: 20,
    fulfillment_method:
      'SUPPLIER_DROPSHIPPING',
    description:
      'نظارة شمسية عصرية توفر حماية كاملة من الأشعة فوق البنفسجية.',
    rating: 4.9
  }
];

/* =========================================================
   HELPERS
   ========================================================= */

/**
 * Safely read JSON from localStorage.
 *
 * Any localStorage error must never crash the application.
 */
function safeGetJSON<T>(
  key: string,
  fallback: T
): T {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);

    return parsed as T;
  } catch (error) {
    console.warn(
      `تعذر قراءة localStorage key: ${key}`,
      error
    );

    return fallback;
  }
}

/**
 * Safely remove a localStorage item.
 */
function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(
      `تعذر حذف localStorage key: ${key}`,
      error
    );
  }
}

/**
 * Convert ProductImage objects to lightweight cache objects.
 *
 * We deliberately remove possible Base64/binary fields.
 */
function sanitizeProductImagesForCache(
  images: ProductImage[] | undefined
): any[] | undefined {
  if (!Array.isArray(images)) {
    return undefined;
  }

  return images.map((image: any) => {
    if (!image || typeof image !== 'object') {
      return image;
    }

    const {
      image_data,
      base64,
      data,
      blob,
      ...lightweightImage
    } = image;

    return lightweightImage;
  });
}

/**
 * Create a lightweight product for localStorage.
 *
 * IMPORTANT:
 * The full product remains in React state.
 *
 * LocalStorage receives only the information needed
 * for offline cache/synchronization.
 *
 * Large Base64 image data is intentionally removed.
 */
function sanitizeProductForCache(
  product: StoreProduct
): Partial<StoreProduct> & {
  id: string;
} {
  const {
    image_data,
    images,
    ...rest
  } = product;

  const lightweight: any = {
    ...rest
  };

  /**
   * Keep image metadata but never store Base64.
   */
  if (images) {
    lightweight.images =
      sanitizeProductImagesForCache(images);
  }

  /**
   * If the main image itself is a Base64 data URL,
   * do NOT put it into localStorage.
   *
   * This prevents a single product from consuming
   * megabytes of browser storage.
   */
  if (
    typeof lightweight.image === 'string' &&
    lightweight.image.startsWith('data:')
  ) {
    /**
     * We keep an empty image in the cache.
     *
     * The actual React state still contains the original
     * image until the Drive upload process replaces it.
     */
    lightweight.image = '';
  }

  return lightweight;
}

/**
 * Convert the complete product array into a lightweight
 * LocalStorage cache.
 */
function sanitizeProductsForCache(
  products: StoreProduct[]
): any[] {
  return products.map(
    sanitizeProductForCache
  );
}

/**
 * Safely save products cache.
 *
 * This function MUST NEVER throw.
 *
 * If the browser quota is exceeded, the application
 * continues working normally.
 */
function saveProductsCache(
  products: StoreProduct[]
): void {
  const lightweightProducts =
    sanitizeProductsForCache(products);

  const serialized =
    JSON.stringify(lightweightProducts);

  try {
    localStorage.setItem(
      PRODUCTS_CACHE_KEY,
      serialized
    );

    /**
     * Successful save.
     */
    return;
  } catch (error) {
    console.warn(
      'تعذر حفظ المنتجات في LocalStorage. سيتم تنظيف الكاش القديم والمحاولة مرة أخرى.',
      error
    );
  }

  /**
   * If quota was exceeded, remove known heavy/legacy
   * caches and retry once.
   */
  try {
    safeRemoveItem(
      LEGACY_PRODUCTS_CACHE_KEY
    );

    safeRemoveItem(
      'elites_recent_drive_images'
    );

    /**
     * Remove old session image previews.
     */
    try {
      const keysToRemove: string[] = [];

      for (
        let i = 0;
        i < sessionStorage.length;
        i++
      ) {
        const key =
          sessionStorage.key(i);

        if (
          key &&
          (
            key.startsWith(
              'drive_preview_'
            ) ||
            key.startsWith(
              'drive_preview_id_'
            )
          )
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(
        key => {
          try {
            sessionStorage.removeItem(
              key
            );
          } catch {
            // Ignore.
          }
        }
      );
    } catch {
      // Ignore sessionStorage errors.
    }

    localStorage.setItem(
      PRODUCTS_CACHE_KEY,
      serialized
    );
  } catch (retryError) {
    /**
     * The cache is optional.
     *
     * Even if this fails, the application MUST continue.
     */
    console.warn(
      'تعذر حفظ كاش المنتجات حتى بعد تنظيف التخزين المحلي. سيتم الاعتماد على الحالة الحالية وGoogle Sheets.',
      retryError
    );
  }
}

/**
 * Safely save product image metadata.
 *
 * These records contain URLs and IDs only.
 * No Base64 data is stored.
 */
function saveProductImageRecord(
  productId: string,
  driveId: string,
  imageUrl: string
): void {
  try {
    const raw =
      localStorage.getItem(
        PRODUCT_IMAGES_CACHE_KEY
      );

    let records: any[] = [];

    try {
      const parsed = raw
        ? JSON.parse(raw)
        : [];

      if (Array.isArray(parsed)) {
        records = parsed;
      }
    } catch {
      records = [];
    }

    const folderId =
      localStorage.getItem(
        DRIVE_FOLDER_KEY
      ) ||
      DEFAULT_DRIVE_FOLDER_ID;

    const record = {
      image_id:
        'img_' + productId,

      product_id:
        productId,

      drive_file_id:
        driveId || '',

      image_url:
        imageUrl || '',

      folder_path:
        `Google Drive / Product Images Folder (${folderId})`,

      is_primary: true,

      sort_order: 1
    };

    const updatedRecords = [
      record,
      ...records.filter(
        (image: any) =>
          image?.product_id !==
          productId
      )
    ];

    try {
      localStorage.setItem(
        PRODUCT_IMAGES_CACHE_KEY,
        JSON.stringify(
          updatedRecords
        )
      );
    } catch (storageError) {
      /**
       * Product image metadata is optional cache.
       * Never let it crash the product operation.
       */
      console.warn(
        'تعذر حفظ بيانات صورة المنتج في LocalStorage:',
        storageError
      );

      /**
       * Try once after removing the old cache.
       */
      try {
        safeRemoveItem(
          PRODUCT_IMAGES_CACHE_KEY
        );

        localStorage.setItem(
          PRODUCT_IMAGES_CACHE_KEY,
          JSON.stringify([
            record
          ])
        );
      } catch {
        // Ignore.
      }
    }
  } catch (error) {
    console.warn(
      'خطأ في تحديث بيانات صورة المنتج:',
      error
    );
  }
}

/**
 * Generate a product ID.
 */
function generateProductId(): string {
  return (
    'prod_' +
    Date.now() +
    '_' +
    Math.random()
      .toString(36)
      .substring(2, 7)
  );
}

/**
 * Dispatch the application-level product event safely.
 */
function dispatchProductChanged(): void {
  try {
    window.dispatchEvent(
      new Event(
        'elites_product_changed'
      )
    );
  } catch (error) {
    console.warn(
      'تعذر إرسال حدث تحديث المنتج:',
      error
    );
  }
}

/* =========================================================
   CONTEXT
   ========================================================= */

const ProductContext =
  createContext<
    ProductContextType | undefined
  >(undefined);

/* =========================================================
   PROVIDER
   ========================================================= */

export const ProductProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const {
    notifyLowStock
  } = useNotifications();

  /**
   * Load the lightweight product cache.
   *
   * We prefer the new key.
   * The old key is used ONLY for one-time migration.
   */
  const [
    products,
    setProducts
  ] = useState<StoreProduct[]>(() => {
    try {
      /**
       * 1. New cache key.
       */
      const currentCache =
        safeGetJSON<any[]>(
          PRODUCTS_CACHE_KEY,
          []
        );

      if (
        Array.isArray(
          currentCache
        ) &&
        currentCache.length > 0
      ) {
        return currentCache as StoreProduct[];
      }

      /**
       * 2. Legacy cache migration.
       */
      const legacyCache =
        safeGetJSON<any[]>(
          LEGACY_PRODUCTS_CACHE_KEY,
          []
        );

      if (
        Array.isArray(
          legacyCache
        ) &&
        legacyCache.length > 0
      ) {
        /**
         * Do NOT duplicate the legacy data.
         *
         * Save it only under the new key.
         */
        const migrated =
          legacyCache as StoreProduct[];

        saveProductsCache(
          migrated
        );

        return migrated;
      }
    } catch (error) {
      console.warn(
        'تعذر تحميل منتجات المتجر من LocalStorage:',
        error
      );
    }

    /**
     * 3. Final fallback.
     */
    return DEFAULT_PRODUCTS;
  });

  /**
   * Keep a synchronous reference to the latest
   * products array.
   *
   * This allows us to:
   *
   * 1. Calculate the next state
   * 2. Save it to LocalStorage
   * 3. Update React state
   * 4. Dispatch synchronization event
   *
   * without putting side effects inside setState().
   */
  const productsRef =
    useRef<StoreProduct[]>(
      products
    );

  /**
   * Keep ref synchronized with React state.
   */
  useEffect(() => {
    productsRef.current =
      products;
  }, [products]);

  /**
   * IMPORTANT:
   *
   * We do NOT continuously write the products array
   * to LocalStorage from this effect.
   *
   * Product mutations explicitly update the cache.
   *
   * This prevents:
   *
   * - duplicate writes
   * - unnecessary writes
   * - large repeated JSON serialization
   * - QuotaExceededError loops
   */
  useEffect(() => {
    /**
     * One-time cleanup of the legacy key.
     *
     * It is safe because the new cache has already been
     * loaded or initialized.
     */
    try {
      if (
        localStorage.getItem(
          PRODUCTS_CACHE_KEY
        )
      ) {
        safeRemoveItem(
          LEGACY_PRODUCTS_CACHE_KEY
        );
      }
    } catch {
      // Ignore.
    }
  }, []);

  /* =======================================================
     ADD PRODUCT
     ======================================================= */

  const addProduct = (
    productData: Omit<
      StoreProduct,
      'id'
    >
  ) => {
    try {
      const id =
        generateProductId();

      const rawImg =
        productData.image ||
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

      let formattedImg =
        rawImg;

      let driveId =
        extractGoogleDriveId(
          rawImg
        );

      /**
       * If the image is already a Drive image,
       * normalize it to the lh3 format.
       */
      if (driveId) {
        formattedImg =
          `https://lh3.googleusercontent.com/d/${driveId}`;
      }

      /**
       * If it is an external HTTP image or a
       * temporary Base64 image, preserve it in React state.
       *
       * The cache sanitizer will prevent Base64 from
       * entering LocalStorage.
       */
      else if (
        rawImg.startsWith(
          'data:'
        ) ||
        rawImg.startsWith(
          'http'
        )
      ) {
        formattedImg =
          rawImg;

        /**
         * Preserve the existing behavior of generating
         * a temporary ID for non-Drive images.
         */
        driveId =
          'drive_' +
          Math.random()
            .toString(36)
            .substring(2, 9);
      }

      /**
       * If the image is neither a Drive URL nor a normal
       * URL, generate a Drive-style ID.
       */
      else {
        driveId =
          generateDriveFileId();

        formattedImg =
          `https://lh3.googleusercontent.com/d/${driveId}`;
      }

      const newProduct: StoreProduct =
        {
          ...productData,

          id,

          product_id: id,

          image:
            formattedImg,

          drive_file_id:
            driveId,

          rating:
            productData.rating ||
            5.0
        };

      /**
       * Calculate the next state outside setState().
       *
       * NO localStorage operations happen inside
       * the React state updater.
       */
      const updatedProducts = [
        newProduct,
        ...productsRef.current
      ];

      /**
       * Update ref immediately.
       */
      productsRef.current =
        updatedProducts;

      /**
       * Save lightweight cache.
       *
       * This can fail safely without crashing the app.
       */
      saveProductsCache(
        updatedProducts
      );

      /**
       * Save lightweight image metadata.
       */
      saveProductImageRecord(
        id,
        driveId || '',
        formattedImg
      );

      /**
       * Update React state.
       */
      setProducts(
        updatedProducts
      );

      /**
       * Trigger Google Sheets synchronization.
       */
      dispatchProductChanged();
    } catch (error) {
      /**
       * Product creation itself should not cause
       * an uncaught exception / white screen.
       */
      console.error(
        'حدث خطأ أثناء إضافة المنتج:',
        error
      );
    }
  };

  /* =======================================================
     UPDATE PRODUCT
     ======================================================= */

  const updateProduct = (
    id: string,
    updatedFields: Partial<StoreProduct>
  ) => {
    try {
      const currentProducts =
        productsRef.current;

      let changedProduct:
        | StoreProduct
        | null = null;

      const updatedProducts =
        currentProducts.map(
          product => {
            if (
              product.id !== id &&
              product.product_id !== id
            ) {
              return product;
            }

            let formattedImg =
              product.image;

            let driveId =
              product.drive_file_id;

            /**
             * Handle image change.
             */
            if (
              updatedFields.image !==
              undefined
            ) {
              formattedImg =
                updatedFields.image;

              const extracted =
                extractGoogleDriveId(
                  updatedFields.image
                );

              if (extracted) {
                driveId =
                  extracted;

                formattedImg =
                  `https://lh3.googleusercontent.com/d/${driveId}`;
              }
            }

            const mergedProduct: StoreProduct =
              {
                ...product,
                ...updatedFields,

                image:
                  formattedImg,

                drive_file_id:
                  driveId
              };

            changedProduct =
              mergedProduct;

            return mergedProduct;
          }
        );

      /**
       * Nothing matched.
       */
      if (!changedProduct) {
        console.warn(
          `لم يتم العثور على المنتج المطلوب تحديثه: ${id}`
        );

        return;
      }

      /**
       * Update synchronous ref.
       */
      productsRef.current =
        updatedProducts;

      /**
       * Save lightweight cache.
       */
      saveProductsCache(
        updatedProducts
      );

      /**
       * Update image metadata if relevant.
       */
      const productId =
        changedProduct.product_id ||
        changedProduct.id;

      if (
        changedProduct.image
      ) {
        saveProductImageRecord(
          productId,
          changedProduct.drive_file_id ||
            '',
          changedProduct.image
        );
      }

      /**
       * Update React state.
       */
      setProducts(
        updatedProducts
      );

      /**
       * Notify synchronization layer.
       */
      dispatchProductChanged();
    } catch (error) {
      console.error(
        'حدث خطأ أثناء تحديث المنتج:',
        error
      );
    }
  };

  /* =======================================================
     UPDATE PRODUCT STOCK
     ======================================================= */

  const updateProductStock = (
    id: string,
    newStock: number
  ) => {
    try {
      const currentProducts =
        productsRef.current;

      let lowStockProduct:
        | StoreProduct
        | null = null;

      const updatedProducts =
        currentProducts.map(
          product => {
            if (
              product.id !== id &&
              product.product_id !== id
            ) {
              return product;
            }

            const updatedProduct =
              {
                ...product,
                stock:
                  newStock
              };

            if (
              newStock <= 5
            ) {
              lowStockProduct =
                updatedProduct;
            }

            return updatedProduct;
          }
        );

      /**
       * Check whether a product was actually updated.
       */
      const changed =
        updatedProducts.some(
          (product, index) =>
            product !==
            currentProducts[index]
        );

      if (!changed) {
        return;
      }

      /**
       * Notify low stock.
       */
      if (
        lowStockProduct
      ) {
        notifyLowStock(
          lowStockProduct as any
        ).catch(
          console.error
        );
      }

      /**
       * Update ref.
       */
      productsRef.current =
        updatedProducts;

      /**
       * Save cache.
       */
      saveProductsCache(
        updatedProducts
      );

      /**
       * Update state.
       */
      setProducts(
        updatedProducts
      );

      /**
       * Trigger synchronization.
       */
      dispatchProductChanged();
    } catch (error) {
      console.error(
        'حدث خطأ أثناء تحديث مخزون المنتج:',
        error
      );
    }
  };

  /* =======================================================
     BULK UPDATE PRODUCTS
     ======================================================= */

  const updateProducts = (
    updates: {
      id: string;
      product: Partial<StoreProduct>;
    }[]
  ) => {
    try {
      if (
        !Array.isArray(
          updates
        ) ||
        updates.length === 0
      ) {
        return;
      }

      const currentProducts =
        productsRef.current;

      const updatedProducts =
        currentProducts.map(
          product => {
            const update =
              updates.find(
                item =>
                  item.id ===
                    product.id ||
                  item.id ===
                    product.product_id
              );

            if (!update) {
              return product;
            }

            return {
              ...product,
              ...update.product
            };
          }
        );

      /**
       * Update ref.
       */
      productsRef.current =
        updatedProducts;

      /**
       * Save lightweight cache.
       */
      saveProductsCache(
        updatedProducts
      );

      /**
       * Update React state.
       */
      setProducts(
        updatedProducts
      );

      console.log(
        'Context - Products updated:',
        updatedProducts
      );

      /**
       * Trigger synchronization.
       */
      dispatchProductChanged();
    } catch (error) {
      console.error(
        'حدث خطأ أثناء تحديث المنتجات:',
        error
      );
    }
  };

  /* =======================================================
     DELETE PRODUCT
     ======================================================= */

  const deleteProduct = (
    id: string
  ) => {
    try {
      const currentProducts =
        productsRef.current;

      const updatedProducts =
        currentProducts.filter(
          product =>
            product.id !== id &&
            product.product_id !== id
        );

      /**
       * Do nothing if product didn't exist.
       */
      if (
        updatedProducts.length ===
        currentProducts.length
      ) {
        console.warn(
          `لم يتم العثور على المنتج المطلوب حذفه: ${id}`
        );

        return;
      }

      /**
       * Update ref.
       */
      productsRef.current =
        updatedProducts;

      /**
       * Save lightweight cache.
       */
      saveProductsCache(
        updatedProducts
      );

      /**
       * Remove product image metadata.
       *
       * This is optional cache data only.
       */
      try {
        const existingImages =
          safeGetJSON<any[]>(
            PRODUCT_IMAGES_CACHE_KEY,
            []
          );

        if (
          Array.isArray(
            existingImages
          )
        ) {
          const filteredImages =
            existingImages.filter(
              image =>
                image?.product_id !==
                  id
            );

          try {
            localStorage.setItem(
              PRODUCT_IMAGES_CACHE_KEY,
              JSON.stringify(
                filteredImages
              )
            );
          } catch {
            // Ignore cache failure.
          }
        }
      } catch {
        // Ignore.
      }

      /**
       * Update state.
       */
      setProducts(
        updatedProducts
      );

      /**
       * Notify synchronization layer.
       */
      dispatchProductChanged();
    } catch (error) {
      console.error(
        'حدث خطأ أثناء حذف المنتج:',
        error
      );
    }
  };

  /* =======================================================
     PROVIDER
     ======================================================= */

  return (
    <ProductContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        updateProducts,
        updateProductStock,
        deleteProduct
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

/* =========================================================
   HOOK
   ========================================================= */

export const useProducts =
  () => {
    const context =
      useContext(
        ProductContext
      );

    if (!context) {
      throw new Error(
        'useProducts must be used within a ProductProvider'
      );
    }

    return context;
  };