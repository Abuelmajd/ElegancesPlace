import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef
} from 'react';

import { useNotifications } from './NotificationContext';
import { useGoogleSheets } from './GoogleSheetsContext';

import {
  extractGoogleDriveId,
  formatGoogleDriveDirectUrl
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

  fulfillment_method?:
    | 'OWN_STOCK'
    | 'SUPPLIER_DROPSHIPPING';

  description?: string;
  rating?: number;
  featured?: boolean;
  bestSeller?: boolean;
  newProduct?: boolean;
}

interface ProductContextType {
  products: StoreProduct[];

  addProduct: (
    product: Omit<StoreProduct, 'id'>
  ) => Promise<boolean>;

  updateProduct: (
    id: string,
    product: Partial<StoreProduct>
  ) => Promise<boolean>;

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

  deleteProduct: (
    id: string
  ) => void;
}

/* =========================================================
   CONSTANTS
   ========================================================= */

const PRODUCTS_CACHE_KEY =
  'elites_store_products';

const LEGACY_PRODUCTS_CACHE_KEY =
  'elites_products';

const PRODUCT_IMAGES_CACHE_KEY =
  'elites_product_images';

const DEFAULT_DRIVE_FOLDER_ID =
  '1JfMshA_FjBRifRRqci0E-jZaoLhESWNl';

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
   LOCAL STORAGE HELPERS
   ========================================================= */

function safeGetJSON<T>(
  key: string,
  fallback: T
): T {
  try {
    const raw =
      localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(
      `تعذر قراءة localStorage key: ${key}`,
      error
    );

    return fallback;
  }
}

function safeRemoveItem(
  key: string
): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(
      `تعذر حذف localStorage key: ${key}`,
      error
    );
  }
}

/* =========================================================
   IMAGE CACHE HELPERS
   ========================================================= */

function sanitizeProductImagesForCache(
  images: ProductImage[] | undefined
): any[] | undefined {
  if (!Array.isArray(images)) {
    return undefined;
  }

  return images.map((image: any) => {
    if (
      !image ||
      typeof image !== 'object'
    ) {
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

function sanitizeProductForCache(
  product: StoreProduct
): any {
  const {
    image_data,
    images,
    ...rest
  } = product;

  const lightweight: any = {
    ...rest
  };

  if (images) {
    lightweight.images =
      sanitizeProductImagesForCache(
        images
      );
  }

  /*
   * ممنوع تخزين Base64 في localStorage.
   */
  if (
    typeof lightweight.image ===
      'string' &&
    lightweight.image.startsWith(
      'data:'
    )
  ) {
    lightweight.image = '';
  }

  return lightweight;
}

function sanitizeProductsForCache(
  products: StoreProduct[]
): any[] {
  return products.map(
    sanitizeProductForCache
  );
}

function saveProductsCache(
  products: StoreProduct[]
): void {
  const lightweightProducts =
    sanitizeProductsForCache(
      products
    );

  const serialized =
    JSON.stringify(
      lightweightProducts
    );

  try {
    localStorage.setItem(
      PRODUCTS_CACHE_KEY,
      serialized
    );

    return;
  } catch (error) {
    console.warn(
      'تعذر حفظ المنتجات في LocalStorage. سيتم تنظيف الكاش.',
      error
    );
  }

  try {
    safeRemoveItem(
      LEGACY_PRODUCTS_CACHE_KEY
    );

    safeRemoveItem(
      'elites_recent_drive_images'
    );

    /*
     * تنظيف معاينات Drive القديمة من sessionStorage.
     */
    try {
      const keysToRemove: string[] =
        [];

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
            // ignore
          }
        }
      );
    } catch {
      // ignore
    }

    localStorage.setItem(
      PRODUCTS_CACHE_KEY,
      serialized
    );
  } catch (retryError) {
    console.warn(
      'تعذر حفظ كاش المنتجات بعد التنظيف.',
      retryError
    );
  }
}

/* =========================================================
   PRODUCT IMAGE METADATA
   ========================================================= */

function saveProductImageRecord(
  productId: string,
  driveId: string,
  imageUrl: string,
  folderId?: string
): void {
  try {
    const records =
      safeGetJSON<any[]>(
        PRODUCT_IMAGES_CACHE_KEY,
        []
      );

    const safeRecords =
      Array.isArray(records)
        ? records
        : [];

    const record = {
      image_id:
        'img_' + productId,

      product_id:
        productId,

      drive_file_id:
        driveId || '',

      image_url:
        imageUrl || '',

      /*
       * إذا كان لدينا مجلد المنتج الحقيقي
       * نستخدمه.
       *
       * وإلا نستخدم المجلد الرئيسي فقط
       * كمرجع احتياطي.
       */
      folder_id:
        folderId ||
        DEFAULT_DRIVE_FOLDER_ID,

      is_primary:
        true,

      sort_order:
        1
    };

    const updatedRecords = [
      record,

      ...safeRecords.filter(
        image =>
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
      console.warn(
        'تعذر حفظ بيانات صورة المنتج:',
        storageError
      );

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
        // ignore
      }
    }
  } catch (error) {
    console.warn(
      'خطأ في تحديث بيانات صورة المنتج:',
      error
    );
  }
}

/* =========================================================
   IDS
   ========================================================= */

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

/* =========================================================
   EVENTS
   ========================================================= */

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
   IMAGE DATA HELPERS
   ========================================================= */

function isBase64Image(
  value: unknown
): boolean {
  return (
    typeof value ===
      'string' &&
    value.startsWith(
      'data:image/'
    )
  );
}

function getMimeTypeFromDataUrl(
  dataUrl: string
): string {
  const match =
    dataUrl.match(
      /^data:(image\/[^;]+);base64,/
    );

  return (
    match?.[1] ||
    'image/jpeg'
  );
}

function getFileExtension(
  fileName: string,
  mimeType: string
): string {
  const existing =
    fileName.match(
      /\.([a-zA-Z0-9]+)$/
    );

  if (existing?.[1]) {
    return existing[1];
  }

  const map: Record<
    string,
    string
  > = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };

  return (
    map[mimeType] ||
    'jpg'
  );
}

function makeSafeImageFileName(
  productName: string,
  sku: string,
  originalFileName?: string,
  mimeType = 'image/jpeg'
): string {
  const extension =
    getFileExtension(
      originalFileName ||
        '',
      mimeType
    );

  const base =
    sku ||
    productName ||
    'product-image';

  const safeBase =
    base
      .replace(
        /[\\/:*?"<>|#%]/g,
        '-'
      )
      .trim()
      .substring(0, 80) ||
    'product-image';

  return `${safeBase}-main.${extension}`;
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

  const {
    createProductFolder,
    uploadImageToDrive
  } = useGoogleSheets();

  const [
    products,
    setProducts
  ] = useState<StoreProduct[]>(() => {
    try {
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
        const migrated =
          legacyCache as StoreProduct[];

        saveProductsCache(
          migrated
        );

        return migrated;
      }
    } catch (error) {
      console.warn(
        'تعذر تحميل المنتجات من LocalStorage:',
        error
      );
    }

    return DEFAULT_PRODUCTS;
  });

  const productsRef =
    useRef<StoreProduct[]>(
      products
    );

  useEffect(() => {
    productsRef.current =
      products;
  }, [products]);

  /*
   * حذف المفتاح القديم مرة واحدة.
   */
  useEffect(() => {
    try {
      safeRemoveItem(
        LEGACY_PRODUCTS_CACHE_KEY
      );
    } catch {
      // ignore
    }
  }, []);

  /* =======================================================
     ADD PRODUCT
     ======================================================= */

  const addProduct = async (
    productData: Omit<
      StoreProduct,
      'id'
    >
  ): Promise<boolean> => {
    try {
      const id =
        generateProductId();

      const productName =
        productData.name?.trim() ||
        'منتج';

      const sku =
        productData.sku?.trim() ||
        `SKU-${Date.now()}`;

      let formattedImg =
        productData.image || '';

      let driveId:
        | string
        | undefined =
        extractGoogleDriveId(
          formattedImg
        );

      let productFolderId:
        | string
        | undefined;

      /* =====================================================
         IMAGE: BASE64
         ===================================================== */

      if (
        isBase64Image(
          formattedImg
        )
      ) {
        console.log(
          'ProductContext: Base64 image detected.'
        );

        /*
         * إنشاء مجلد حقيقي باسم SKU.
         */
        const folderResult =
          await createProductFolder(
            productName,
            sku
          );

        if (
          !folderResult.success ||
          !folderResult.folderId
        ) {
          console.error(
            'ProductContext: failed to create product folder:',
            folderResult
          );

          return false;
        }

        productFolderId =
          folderResult.folderId;

        const mimeType =
          getMimeTypeFromDataUrl(
            formattedImg
          );

        const fileName =
          makeSafeImageFileName(
            productName,
            sku,
            undefined,
            mimeType
          );

        /*
         * رفع الصورة إلى مجلد المنتج.
         */
        const uploadResult =
          await uploadImageToDrive(
            formattedImg,
            fileName,
            mimeType,
            'product',
            productFolderId
          );

        /*
         * ممنوع الاستمرار بدون fileId حقيقي.
         */
        if (
          !uploadResult.success ||
          !uploadResult.fileId
        ) {
          console.error(
            'ProductContext: image upload failed:',
            uploadResult
          );

          return false;
        }

        driveId =
          uploadResult.fileId;

        formattedImg =
          uploadResult.directUrl ||
          uploadResult.viewUrl ||
          uploadResult.driveUrl ||
          formatGoogleDriveDirectUrl(
            driveId
          );

        console.log(
          'ProductContext: image uploaded:',
          {
            fileId: driveId,
            folderId: productFolderId,
            url: formattedImg
          }
        );
      }

      /* =====================================================
         IMAGE: EXISTING GOOGLE DRIVE
         ===================================================== */

      else if (driveId) {
        formattedImg =
          formatGoogleDriveDirectUrl(
            driveId
          );

        console.log(
          'ProductContext: existing Drive image:',
          driveId
        );
      }

      /* =====================================================
         IMAGE: EXTERNAL URL
         ===================================================== */

      else if (
        typeof formattedImg ===
          'string' &&
        (
          formattedImg.startsWith(
            'http://'
          ) ||
          formattedImg.startsWith(
            'https://'
          )
        )
      ) {
        /*
         * رابط خارجي حقيقي.
         * لا نضع drive_file_id.
         */
        driveId =
          undefined;
      }

      /* =====================================================
         IMAGE: EMPTY
         ===================================================== */

      else {
        formattedImg = '';
        driveId =
          undefined;
      }

      /* =====================================================
         CREATE PRODUCT
         ===================================================== */

      const newProduct: StoreProduct =
        {
          ...productData,

          id,

          product_id: id,

          sku,

          image:
            formattedImg,

          ...(driveId
            ? {
                drive_file_id:
                  driveId
              }
            : {}),

          rating:
            productData.rating ||
            5.0
        };

      const updatedProducts = [
        newProduct,
        ...productsRef.current
      ];

      productsRef.current =
        updatedProducts;

      /*
       * حفظ النسخة الخفيفة فقط.
       */
      saveProductsCache(
        updatedProducts
      );

      /*
       * حفظ بيانات الصورة فقط
       * إذا كان لدينا fileId حقيقي.
       */
      if (
        driveId
      ) {
        saveProductImageRecord(
          id,
          driveId,
          formattedImg,
          productFolderId
        );
      }

      setProducts(
        updatedProducts
      );

      dispatchProductChanged();

      console.log(
        'ProductContext: product added successfully:',
        newProduct
      );

      return true;
    } catch (error) {
      console.error(
        'حدث خطأ أثناء إضافة المنتج:',
        error
      );

      return false;
    }
  };

  /* =======================================================
     UPDATE PRODUCT
     ======================================================= */

  const updateProduct = async (
    id: string,
    updatedFields: Partial<StoreProduct>
  ): Promise<boolean> => {
    try {
      const currentProducts =
        productsRef.current;

      const existingProduct =
        currentProducts.find(
          product =>
            product.id === id ||
            product.product_id === id
        );

      if (!existingProduct) {
        console.warn(
          `لم يتم العثور على المنتج المطلوب تحديثه: ${id}`
        );

        return false;
      }

      let formattedImg =
        existingProduct.image || '';

      let driveId:
        | string
        | undefined =
        existingProduct.drive_file_id;

      let productFolderId:
        | string
        | undefined;

      /* =====================================================
         IMAGE WAS CHANGED
         ===================================================== */

      if (
        updatedFields.image !==
        undefined
      ) {
        const newImage =
          updatedFields.image || '';

        /* ================================================
           NEW BASE64 IMAGE
           ================================================ */

        if (
          isBase64Image(
            newImage
          )
        ) {
          console.log(
            'ProductContext: new Base64 image during update.'
          );

          const productName =
            (
              updatedFields.name ||
              existingProduct.name ||
              'منتج'
            ).trim();

          const sku =
            (
              updatedFields.sku ||
              existingProduct.sku ||
              `SKU-${Date.now()}`
            ).trim();

          /*
           * ننشئ/نسترجع مجلد SKU الحقيقي.
           *
           * Apps Script مصمم بحيث لا ينشئ
           * مجلدًا مكررًا إذا كان موجودًا.
           */
          const folderResult =
            await createProductFolder(
              productName,
              sku
            );

          if (
            !folderResult.success ||
            !folderResult.folderId
          ) {
            console.error(
              'ProductContext: failed to create/find product folder during update:',
              folderResult
            );

            return false;
          }

          productFolderId =
            folderResult.folderId;

          const mimeType =
            getMimeTypeFromDataUrl(
              newImage
            );

          const fileName =
            makeSafeImageFileName(
              productName,
              sku,
              undefined,
              mimeType
            );

          /*
           * رفع الصورة الجديدة.
           */
          const uploadResult =
            await uploadImageToDrive(
              newImage,
              fileName,
              mimeType,
              'product',
              productFolderId
            );

          /*
           * لا نعدل المنتج إذا فشل الرفع.
           */
          if (
            !uploadResult.success ||
            !uploadResult.fileId
          ) {
            console.error(
              'ProductContext: update image upload failed:',
              uploadResult
            );

            return false;
          }

          driveId =
            uploadResult.fileId;

          formattedImg =
            uploadResult.directUrl ||
            uploadResult.viewUrl ||
            uploadResult.driveUrl ||
            formatGoogleDriveDirectUrl(
              driveId
            );

          console.log(
            'ProductContext: updated image uploaded:',
            {
              fileId: driveId,
              folderId:
                productFolderId,
              url: formattedImg
            }
          );
        }

        /* ================================================
           EXISTING GOOGLE DRIVE IMAGE
           ================================================ */

        else {
          const extracted =
            extractGoogleDriveId(
              newImage
            );

          if (extracted) {
            driveId =
              extracted;

            formattedImg =
              formatGoogleDriveDirectUrl(
                extracted
              );
          }

          /* ==============================================
             EXTERNAL IMAGE
             ============================================== */

          else if (
            newImage.startsWith(
              'http://'
            ) ||
            newImage.startsWith(
              'https://'
            )
          ) {
            formattedImg =
              newImage;

            driveId =
              undefined;
          }

          /* ==============================================
             EMPTY IMAGE
             ============================================== */

          else {
            formattedImg = '';
            driveId =
              undefined;
          }
        }
      }

      /* =====================================================
         MERGE PRODUCT
         ===================================================== */

      const mergedProduct: StoreProduct =
        {
          ...existingProduct,

          ...updatedFields,

          image:
            formattedImg,

          ...(driveId
            ? {
                drive_file_id:
                  driveId
              }
            : {
                drive_file_id:
                  undefined
              })
        };

      const updatedProducts =
        currentProducts.map(
          product => {
            if (
              product.id !== id &&
              product.product_id !== id
            ) {
              return product;
            }

            return mergedProduct;
          }
        );

      productsRef.current =
        updatedProducts;

      saveProductsCache(
        updatedProducts
      );

      /*
       * حفظ بيانات الصورة الجديدة
       * فقط إذا كان fileId حقيقيًا.
       */
      if (
        driveId
      ) {
        saveProductImageRecord(
          mergedProduct.product_id ||
            mergedProduct.id,
          driveId,
          formattedImg,
          productFolderId
        );
      }

      setProducts(
        updatedProducts
      );

      dispatchProductChanged();

      console.log(
        'ProductContext: product updated successfully:',
        mergedProduct
      );

      return true;
    } catch (error) {
      console.error(
        'حدث خطأ أثناء تحديث المنتج:',
        error
      );

      return false;
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

      const changed =
        updatedProducts.some(
          (product, index) =>
            product !==
            currentProducts[index]
        );

      if (!changed) {
        return;
      }

      if (
        lowStockProduct
      ) {
        notifyLowStock(
          lowStockProduct as any
        ).catch(
          console.error
        );
      }

      productsRef.current =
        updatedProducts;

      saveProductsCache(
        updatedProducts
      );

      setProducts(
        updatedProducts
      );

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

      productsRef.current =
        updatedProducts;

      saveProductsCache(
        updatedProducts
      );

      setProducts(
        updatedProducts
      );

      console.log(
        'Context - Products updated:',
        updatedProducts
      );

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

      if (
        updatedProducts.length ===
        currentProducts.length
      ) {
        console.warn(
          `لم يتم العثور على المنتج المطلوب حذفه: ${id}`
        );

        return;
      }

      productsRef.current =
        updatedProducts;

      saveProductsCache(
        updatedProducts
      );

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
            // ignore
          }
        }
      } catch {
        // ignore
      }

      setProducts(
        updatedProducts
      );

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
