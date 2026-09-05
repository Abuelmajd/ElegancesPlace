import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useNotifications } from "./NotificationContext";
import { useGoogleSheets } from "./GoogleSheetsContext";

import {
  extractGoogleDriveId,
  formatGoogleDriveDirectUrl,
} from "../utils/googleDriveUtils";

import {
  Product,
  ProductImage,
} from "../types";

/* =========================================================
   TYPES
   ========================================================= */

/**
 * ProductContext works strictly with the V3 products table.
 *
 * V3 products fields:
 *
 * id
 * product_id
 * sku
 * name
 * description
 * category_id
 * product_group_id
 * cost_price
 * cost_currency
 * selling_price
 * selling_currency
 * old_price
 * old_price_currency
 * fulfillment_method
 * stock_tracking
 * image_url
 * drive_file_id
 * rating
 * badge
 * status
 * created_at
 * updated_at
 *
 * IMPORTANT:
 *
 * supplier_id -> product_sources
 * stock       -> inventory
 * image_data  -> never stored
 */

export type StoreProduct = Product & {
  /**
   * Compatibility field used by the storefront UI.
   *
   * Canonical V3 fields remain:
   * image_url
   * drive_file_id
   *
   * `image` is only the display-ready value used by
   * StorefrontHome and other existing UI components.
   */
  image?: string;
};

interface ProductContextType {
  products: StoreProduct[];

  addProduct: (
    product: Omit<
      StoreProduct,
      "id" | "created_at" | "updated_at"
    >
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

  /**
   * Temporary compatibility API.
   *
   * Stock is NOT stored in products.
   *
   * Real inventory operations will be implemented
   * through InventoryContext -> inventory table.
   */
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
  "elites_store_products";

const LEGACY_PRODUCTS_CACHE_KEY =
  "elites_products";

const PRODUCT_IMAGES_CACHE_KEY =
  "elites_product_images";

/* =========================================================
   DEFAULT PRODUCTS
   ========================================================= */

const DEFAULT_PRODUCTS: StoreProduct[] = [];

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
      `تعذر قراءة LocalStorage: ${key}`,
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
      `تعذر حذف LocalStorage: ${key}`,
      error
    );
  }
}

/* =========================================================
   IMAGE CACHE SANITIZATION
   ========================================================= */

/**
 * ProductImage is stored only as lightweight metadata.
 *
 * No Base64.
 * No Blob.
 * No image binary.
 */
function sanitizeProductImagesForCache(
  images:
    | ProductImage[]
    | undefined
): ProductImage[] | undefined {
  if (!Array.isArray(images)) {
    return undefined;
  }

  return images.map(
    (image) => {
      const source =
        image as ProductImage & {
          image_data?: unknown;
          base64?: unknown;
          data?: unknown;
          blob?: unknown;
          preview?: unknown;
        };

      const {
        image_data: _imageData,
        base64: _base64,
        data: _data,
        blob: _blob,
        preview: _preview,
        ...lightweightImage
      } = source;

      return lightweightImage as ProductImage;
    }
  );
}

/* =========================================================
   PRODUCT CACHE SANITIZATION
   ========================================================= */

/**
 * Explicitly build a lightweight V3 product.
 *
 * We intentionally do NOT spread arbitrary legacy fields.
 */
function sanitizeProductForCache(
  product: StoreProduct
): StoreProduct {
  const source =
    product as StoreProduct & {
      image_data?: unknown;
      images?: unknown;
      stock?: unknown;
      supplier_id?: unknown;
      supplier?: unknown;
      price?: unknown;
      oldPrice?: unknown;
      originalPrice?: unknown;
      costPrice?: unknown;
    };

  const imageUrl =
    typeof source.image_url === "string" &&
    !source.image_url.startsWith("data:") &&
    !source.image_url.startsWith("blob:")
      ? source.image_url
      : "";

  /*
   * Only canonical V3 product fields.
   */
  const lightweight = {
    id:
      source.id,

    product_id:
      source.product_id,

    sku:
      source.sku,

    name:
      source.name,

    description:
      source.description,

    category_id:
      source.category_id,

    product_group_id:
      source.product_group_id,

    cost_price:
      source.cost_price,

    cost_currency:
      source.cost_currency,

    selling_price:
      source.selling_price,

    selling_currency:
      source.selling_currency,

    old_price:
      source.old_price,

    old_price_currency:
      source.old_price_currency,

    fulfillment_method:
      source.fulfillment_method,

    stock_tracking:
      source.stock_tracking,

    image_url:
      imageUrl,

    drive_file_id:
      source.drive_file_id || "",

    image:
      source.image ||
      (
        source.drive_file_id
          ? formatGoogleDriveDirectUrl(
              source.drive_file_id
            )
          : imageUrl || ""
      ),

    rating:
      source.rating,

    badge:
      source.badge,

    status:
      source.status,

    created_at:
      source.created_at,

    updated_at:
      source.updated_at,
  } as StoreProduct;

  return lightweight;
}

function sanitizeProductsForCache(
  products: StoreProduct[]
): StoreProduct[] {
  return products.map(
    sanitizeProductForCache
  );
}

/* =========================================================
   SAVE PRODUCTS CACHE
   ========================================================= */

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
      "تعذر حفظ المنتجات في LocalStorage. سيتم تنظيف الكاش.",
      error
    );
  }

  /*
   * Emergency cleanup.
   */
  try {
    safeRemoveItem(
      LEGACY_PRODUCTS_CACHE_KEY
    );

    safeRemoveItem(
      "elites_recent_drive_images"
    );

    /*
     * Remove only temporary Drive previews
     * from sessionStorage.
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
              "drive_preview_"
            ) ||
            key.startsWith(
              "drive_preview_id_"
            )
          )
        ) {
          keysToRemove.push(
            key
          );
        }
      }

      keysToRemove.forEach(
        (key) => {
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
    console.warn(
      "تعذر حفظ كاش المنتجات بعد التنظيف.",
      retryError
    );
  }
}

/* =========================================================
   PRODUCT IMAGE METADATA CACHE
   ========================================================= */

/**
 * Saves a lightweight ProductImage record locally
 * and returns the exact record that can be sent
 * through incremental sync.
 */
function saveProductImageRecord(
  productId: string,
  driveId: string,
  imageUrl: string
): ProductImage | undefined {
  if (!driveId) {
    return undefined;
  }

  try {
    const records =
      safeGetJSON<
        ProductImage[]
      >(
        PRODUCT_IMAGES_CACHE_KEY,
        []
      );

    const safeRecords =
      Array.isArray(records)
        ? records
        : [];

    const now =
      new Date().toISOString();

    const record =
      {
        id:
          `img_${productId}_${Date.now()}`,

        image_id:
          `img_${productId}`,

        product_id:
          productId,

        drive_file_id:
          driveId,

        image_url:
          imageUrl || "",

        is_primary:
          true,

        sort_order:
          1,

        created_at:
          now,

        updated_at:
          now,
      } as ProductImage;

    const updatedRecords =
      [
        record,
        ...safeRecords.filter(
          (image) =>
            image?.product_id !==
            productId
        ),
      ];

    localStorage.setItem(
      PRODUCT_IMAGES_CACHE_KEY,
      JSON.stringify(
        sanitizeProductImagesForCache(
          updatedRecords
        )
      )
    );

    return record;

  } catch (error) {

    console.warn(
      "تعذر حفظ بيانات صورة المنتج:",
      error
    );

    return undefined;
  }
}

/* =========================================================
   IDS
   ========================================================= */

function generateDatabaseId(): string {
  return (
    "prod_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .substring(2, 8)
  );
}

function generateBusinessProductId(
  sku?: string
): string {
  const normalizedSku =
    sku?.trim();

  if (normalizedSku) {
    return normalizedSku;
  }

  return (
    "PRD-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()
  );
}

/* =========================================================
   EVENTS
   ========================================================= */

function dispatchProductChanged(): void {
  try {
    window.dispatchEvent(
      new Event(
        "elites_product_changed"
      )
    );
  } catch (error) {
    console.warn(
      "تعذر إرسال حدث تحديث المنتج:",
      error
    );
  }
}

/* =========================================================
   IMAGE HELPERS
   ========================================================= */

function isBase64Image(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.startsWith(
      "data:image/"
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
    "image/jpeg"
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
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return (
    map[mimeType] ||
    "jpg"
  );
}

function makeSafeImageFileName(
  productName: string,
  sku: string,
  originalFileName?: string,
  mimeType = "image/jpeg"
): string {
  const extension =
    getFileExtension(
      originalFileName || "",
      mimeType
    );

  const base =
    sku ||
    productName ||
    "product-image";

  const safeBase =
    base
      .replace(
        /[\\/:*?"<>|#%]/g,
        "-"
      )
      .trim()
      .substring(0, 80) ||
    "product-image";

  return `${safeBase}-main.${extension}`;
}

/* =========================================================
   IMAGE URL NORMALIZATION
   ========================================================= */

function normalizeProductImage(
  imageValue: string
): {
  imageUrl: string;
  driveFileId?: string;
} {
  if (!imageValue) {
    return {
      imageUrl: "",
    };
  }

  const driveId =
    extractGoogleDriveId(
      imageValue
    );

  if (driveId) {
    return {
      imageUrl:
        formatGoogleDriveDirectUrl(
          driveId
        ),
      driveFileId:
        driveId,
    };
  }

  if (
    imageValue.startsWith(
      "http://"
    ) ||
    imageValue.startsWith(
      "https://"
    )
  ) {
    return {
      imageUrl:
        imageValue,
    };
  }

  return {
    imageUrl: "",
  };
}

/* =========================================================
   BUILD CANONICAL V3 PRODUCT
   ========================================================= */

function buildCanonicalProduct(
  product: Partial<StoreProduct> & {
    id: string;
    product_id: string;
    sku: string;
    name: string;
    created_at: string;
    updated_at: string;
  }
): StoreProduct {
  return {
    id:
      product.id,

    product_id:
      product.product_id,

    sku:
      product.sku,

    name:
      product.name,

    description:
      product.description || "",

    category_id:
      product.category_id || "",

    product_group_id:
      product.product_group_id || "",

    cost_price:
      product.cost_price ?? 0,

    cost_currency:
      product.cost_currency || "ILS",

    selling_price:
      product.selling_price ?? 0,

    selling_currency:
      product.selling_currency || "ILS",

    old_price:
      product.old_price ?? 0,

    old_price_currency:
      product.old_price_currency || "",

    fulfillment_method:
      product.fulfillment_method ||
      "OWN_STOCK",

    stock_tracking:
      product.stock_tracking ??
      false,

    image_url:
      product.image_url || "",

    drive_file_id:
      product.drive_file_id || "",

    image:
      product.image ||
      (
        product.drive_file_id
          ? formatGoogleDriveDirectUrl(
              product.drive_file_id
            )
          : product.image_url || ""
      ),

    rating:
      product.rating ?? 0,

    badge:
      product.badge || "",

    status:
      product.status || "ACTIVE",

    created_at:
      product.created_at,

    updated_at:
      product.updated_at,
  } as StoreProduct;
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

export const ProductProvider:
  React.FC<{
    children: React.ReactNode;
  }> = ({
    children,
  }) => {

    const {
      notifyLowStock,
    } = useNotifications();

    const {
      createProductFolder,
      uploadImageToDrive,

      /*
       * IMPORTANT:
       *
       * We intentionally use incremental sync
       * instead of syncNow() for normal product
       * create/update operations.
       *
       * syncNow remains available inside
       * GoogleSheetsContext as the full-sync
       * recovery mechanism.
       */
      syncChangedTables,
      pullTables,
      getCachedTable,
    } = useGoogleSheets();

    /* =======================================================
       PRODUCTS STATE
       ======================================================= */

    const [
      products,
      setProducts,
    ] =
      useState<StoreProduct[]>(
        () => {
          const currentCache =
            safeGetJSON<
              StoreProduct[]
            >(
              PRODUCTS_CACHE_KEY,
              []
            );

          if (
            Array.isArray(
              currentCache
            )
          ) {
            return currentCache.map(
              sanitizeProductForCache
            );
          }

          return DEFAULT_PRODUCTS;
        }
      );

    const productsRef =
      useRef<StoreProduct[]>(
        products
      );

    useEffect(() => {
      productsRef.current =
        products;
    }, [products]);

    useEffect(() => {
      void (async () => {
        try {
          await pullTables(['products']);

          const cachedProducts =
            getCachedTable('products') as StoreProduct[];

          if (Array.isArray(cachedProducts)) {
            const normalizedProducts =
              cachedProducts.map(sanitizeProductForCache);

            productsRef.current = normalizedProducts;
            setProducts(normalizedProducts);
            saveProductsCache(normalizedProducts);
          }
        } catch (error) {
          console.error(
            'ProductContext V3: فشل تحميل المنتجات من Google Sheets:',
            error
          );
        }
      })();
    }, [
      pullTables,
      getCachedTable,
    ]);

    /* =======================================================
       REMOVE LEGACY PRODUCT CACHE
       ======================================================= */

    useEffect(() => {
      safeRemoveItem(
        LEGACY_PRODUCTS_CACHE_KEY
      );
    }, []);

    /* =======================================================
       ADD PRODUCT
       ======================================================= */

    const addProduct = async (
      productData: Omit<
        StoreProduct,
        "id" | "created_at" | "updated_at"
      >
    ): Promise<boolean> => {

      try {

        const databaseId =
          generateDatabaseId();

        const productName =
          productData.name?.trim() ||
          "منتج";

        const sku =
          productData.sku?.trim() ||
          `SKU-${Date.now()}`;

        const businessProductId =
          productData.product_id?.trim() ||
          generateBusinessProductId(
            sku
          );

        let imageUrl =
          productData.image_url ||
          "";

        let driveFileId =
          productData.drive_file_id ||
          extractGoogleDriveId(
            imageUrl
          ) ||
          "";

        /* =====================================================
           BASE64 -> GOOGLE DRIVE
           ===================================================== */

        if (
          isBase64Image(
            imageUrl
          )
        ) {

          console.log(
            "ProductContext V3: رفع الصورة إلى Google Drive..."
          );

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
              "فشل إنشاء مجلد المنتج:",
              folderResult
            );

            return false;
          }

          const mimeType =
            getMimeTypeFromDataUrl(
              imageUrl
            );

          const fileName =
            makeSafeImageFileName(
              productName,
              sku,
              undefined,
              mimeType
            );

          const uploadResult =
            await uploadImageToDrive(
              imageUrl,
              fileName,
              mimeType,
              "product",
              folderResult.folderId
            );

          if (
            !uploadResult.success ||
            !uploadResult.fileId
          ) {

            console.error(
              "فشل رفع الصورة:",
              uploadResult
            );

            return false;
          }

          driveFileId =
            uploadResult.fileId;

          imageUrl =
            uploadResult.directUrl ||
            uploadResult.viewUrl ||
            uploadResult.driveUrl ||
            formatGoogleDriveDirectUrl(
              driveFileId
            );

        } else {

          const normalized =
            normalizeProductImage(
              imageUrl
            );

          imageUrl =
            normalized.imageUrl;

          if (
            normalized.driveFileId
          ) {
            driveFileId =
              normalized.driveFileId;
          }
        }

        /* =====================================================
           CREATE CANONICAL V3 PRODUCT
           ===================================================== */

        const now =
          new Date().toISOString();

        const newProduct =
          buildCanonicalProduct({
            ...productData,

            id:
              databaseId,

            product_id:
              businessProductId,

            sku,

            name:
              productName,

            image_url:
              imageUrl,

            drive_file_id:
              driveFileId,

            image:
              driveFileId
                ? formatGoogleDriveDirectUrl(
                    driveFileId
                  )
                : imageUrl,

            created_at:
              now,

            updated_at:
              now,
          });

        const updatedProducts =
          [
            newProduct,
            ...productsRef.current,
          ];

        productsRef.current =
          updatedProducts;

        saveProductsCache(
          updatedProducts
        );

        /*
         * Save image metadata locally and keep
         * the exact record for incremental sync.
         */
        let imageRecord:
          | ProductImage
          | undefined;

        if (
          driveFileId
        ) {
          imageRecord =
            saveProductImageRecord(
              databaseId,
              driveFileId,
              imageUrl
            );
        }

        setProducts(
          updatedProducts
        );

        dispatchProductChanged();

        console.log(
          "ProductContext V3: تمت إضافة المنتج محليًا:",
          newProduct
        );

        /* =====================================================
           INCREMENTAL SYNC
           ===================================================== */

        const changedTables = {
          products: [
            sanitizeProductForCache(
              newProduct
            ),
          ],
        };

        if (
          imageRecord
        ) {
          (changedTables as Record<string, unknown[]>).product_images = [
            imageRecord,
          ];
        }

        /*
         * IMPORTANT:
         *
         * We send ONLY the newly created product
         * and its image metadata.
         *
         * We do NOT send the complete database.
         */
        const syncSuccess =
          await syncChangedTables(
            changedTables
          );

        if (!syncSuccess) {

          console.error(
            "ProductContext V3: فشلت المزامنة التدريجية للمنتج مع Google Sheets."
          );

          /*
           * Local data is intentionally kept.
           *
           * This allows a later incremental sync
           * or a manual full recovery sync.
           */
          return false;
        }

        console.log(
          "ProductContext V3: تمت المزامنة التدريجية للمنتج بنجاح."
        );

        return true;

      } catch (error) {

        console.error(
          "حدث خطأ أثناء إضافة المنتج:",
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
            (product) =>
              product.id === id ||
              product.product_id === id
          );

        if (
          !existingProduct
        ) {

          console.warn(
            `لم يتم العثور على المنتج: ${id}`
          );

          return false;
        }

        let imageUrl =
          existingProduct.image_url ||
          "";

        let driveFileId =
          existingProduct.drive_file_id ||
          "";

        let imageWasUpdated =
          false;

        /* =====================================================
           IMAGE UPDATE
           ===================================================== */

        if (
          updatedFields.image_url !==
          undefined
        ) {

          imageWasUpdated = true;

          const newImage =
            updatedFields.image_url ||
            "";

          if (
            isBase64Image(
              newImage
            )
          ) {

            const productName =
              (
                updatedFields.name ||
                existingProduct.name ||
                "منتج"
              ).trim();

            const sku =
              (
                updatedFields.sku ||
                existingProduct.sku ||
                `SKU-${Date.now()}`
              ).trim();

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
                "فشل إنشاء مجلد المنتج أثناء التحديث:",
                folderResult
              );

              return false;
            }

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

            const uploadResult =
              await uploadImageToDrive(
                newImage,
                fileName,
                mimeType,
                "product",
                folderResult.folderId
              );

            if (
              !uploadResult.success ||
              !uploadResult.fileId
            ) {

              console.error(
                "فشل رفع الصورة الجديدة:",
                uploadResult
              );

              return false;
            }

            driveFileId =
              uploadResult.fileId;

            imageUrl =
              uploadResult.directUrl ||
              uploadResult.viewUrl ||
              uploadResult.driveUrl ||
              formatGoogleDriveDirectUrl(
                driveFileId
              );

          } else {

            const normalized =
              normalizeProductImage(
                newImage
              );

            imageUrl =
              normalized.imageUrl;

            driveFileId =
              normalized.driveFileId ||
              "";
          }
        }

        /* =====================================================
           CANONICAL V3 UPDATE
           ===================================================== */

        const mergedProduct =
          buildCanonicalProduct({
            ...existingProduct,

            ...updatedFields,

            id:
              existingProduct.id,

            product_id:
              updatedFields.product_id ||
              existingProduct.product_id,

            sku:
              updatedFields.sku ||
              existingProduct.sku,

            name:
              updatedFields.name ||
              existingProduct.name,

            image_url:
              imageUrl,

            drive_file_id:
              driveFileId,

            created_at:
              existingProduct.created_at,

            updated_at:
              new Date().toISOString(),
          });

        const updatedProducts =
          currentProducts.map(
            (product) =>
              product.id ===
              existingProduct.id
                ? mergedProduct
                : product
          );

        productsRef.current =
          updatedProducts;

        saveProductsCache(
          updatedProducts
        );

        /*
         * If the image changed, save the new
         * lightweight image metadata and send
         * it incrementally as well.
         */
        let imageRecord:
          | ProductImage
          | undefined;

        if (
          imageWasUpdated &&
          driveFileId
        ) {
          imageRecord =
            saveProductImageRecord(
              mergedProduct.id,
              driveFileId,
              imageUrl
            );
        }

        setProducts(
          updatedProducts
        );

        dispatchProductChanged();

        console.log(
          "ProductContext V3: تم تحديث المنتج محليًا:",
          mergedProduct
        );

        /* =====================================================
           INCREMENTAL SYNC
           ===================================================== */

        const changedTables = {
          products: [
            sanitizeProductForCache(
              mergedProduct
            ),
          ],
        };

        if (
          imageRecord
        ) {
          (changedTables as Record<string, unknown[]>).product_images = [
            imageRecord,
          ];
        }

        /*
         * IMPORTANT:
         *
         * Only this product is sent.
         *
         * No full products table.
         * No full database.
         */
        const syncSuccess =
          await syncChangedTables(
            changedTables
          );

        if (!syncSuccess) {

          console.error(
            "ProductContext V3: فشلت المزامنة التدريجية لتحديث المنتج."
          );

          /*
           * Local changes remain saved.
           */
          return false;
        }

        console.log(
          "ProductContext V3: تمت مزامنة تحديث المنتج بنجاح."
        );

        return true;

      } catch (error) {

        console.error(
          "حدث خطأ أثناء تحديث المنتج:",
          error
        );

        return false;
      }
    };

    /* =======================================================
       UPDATE PRODUCT STOCK
       ======================================================= */

    /**
     * IMPORTANT:
     *
     * This function does NOT modify Product.
     *
     * Real stock belongs to:
     *
     * inventory
     * inventory_movements
     *
     * It remains only temporarily so existing UI components
     * do not crash before InventoryContext is implemented.
     */

    const updateProductStock = (
      id: string,
      newStock: number
    ) => {

      try {

        if (
          !Number.isFinite(
            newStock
          )
        ) {
          return;
        }

        const product =
          productsRef.current.find(
            (item) =>
              item.id === id ||
              item.product_id === id
          );

        if (
          !product
        ) {

          console.warn(
            `لم يتم العثور على المنتج: ${id}`
          );

          return;
        }

        if (
          newStock <= 5
        ) {

          notifyLowStock(
            product as never
          ).catch(
            console.error
          );
        }

        console.warn(
          "ProductContext V3: المخزون لا يُخزن داخل products. سيتم نقله إلى InventoryContext."
        );

      } catch (error) {

        console.error(
          "خطأ في تحديث المخزون:",
          error
        );
      }
    };

    /* =======================================================
       BULK UPDATE
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

        const updateMap =
          new Map<
            string,
            Partial<StoreProduct>
          >();

        updates.forEach(
          (item) => {

            if (
              item?.id
            ) {

              updateMap.set(
                item.id,
                item.product
              );
            }
          }
        );

        const now =
          new Date().toISOString();

        const updatedProducts =
          currentProducts.map(
            (product) => {

              const update =
                updateMap.get(
                  product.id
                );

              if (!update) {
                return product;
              }

              return buildCanonicalProduct({
                ...product,

                ...update,

                id:
                  product.id,

                product_id:
                  update.product_id ||
                  product.product_id,

                sku:
                  update.sku ||
                  product.sku,

                name:
                  update.name ||
                  product.name,

                created_at:
                  product.created_at,

                updated_at:
                  now,
              });
            }
          );

        /*
         * Determine exactly which products
         * actually changed.
         */
        const changedProducts =
          updatedProducts.filter(
            (product) => {

              const update =
                updateMap.get(
                  product.id
                );

              return Boolean(
                update
              );
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

        dispatchProductChanged();

        console.log(
          "ProductContext V3: تم تحديث المنتجات محليًا:",
          changedProducts
        );

        /* =====================================================
           INCREMENTAL BULK SYNC
           ===================================================== */

        if (
          changedProducts.length > 0
        ) {

          void syncChangedTables({
            products:
              changedProducts.map(
                sanitizeProductForCache
              ),
          }).then(
            (success) => {

              if (!success) {

                console.error(
                  "ProductContext V3: فشلت المزامنة التدريجية للتحديث الجماعي."
                );

                return;
              }

              console.log(
                "ProductContext V3: تمت مزامنة التحديث الجماعي للمنتجات بنجاح."
              );
            }
          ).catch(
            (error) => {

              console.error(
                "ProductContext V3: خطأ أثناء المزامنة التدريجية للتحديث الجماعي:",
                error
              );
            }
          );
        }

      } catch (error) {

        console.error(
          "خطأ في تحديث المنتجات:",
          error
        );
      }
    };

    /* =======================================================
       DELETE PRODUCT
       ======================================================= */

    const deleteProduct = async (
      id: string
    ) => {

      try {

        const currentProducts =
          productsRef.current;

        const existingProduct =
          currentProducts.find(
            (product) =>
              product.id === id ||
              product.product_id === id
          );

        if (
          !existingProduct
        ) {

          console.warn(
            `لم يتم العثور على المنتج المطلوب حذفه: ${id}`
          );

          return;
        }

        const updatedProducts =
          currentProducts.filter(
            (product) =>
              product.id !==
              existingProduct.id
          );

        productsRef.current =
          updatedProducts;

        saveProductsCache(
          updatedProducts
        );

        /* ===================================================
           REMOVE LOCAL IMAGE METADATA ONLY
           =================================================== */

        try {

          const existingImages =
            safeGetJSON<
              ProductImage[]
            >(
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
                (image) =>
                  image?.product_id !==
                  existingProduct.id
              );

            localStorage.setItem(
              PRODUCT_IMAGES_CACHE_KEY,
              JSON.stringify(
                filteredImages
              )
            );
          }

        } catch {
          // Ignore local image-cache errors.
        }

        /*
         * ===================================================
         * INCREMENTAL DELETE SYNC
         * ===================================================
         *
         * حذف المنتج من Google Sheets أيضًا.
         *
         * لا نحذف ملف Google Drive تلقائيًا.
         */

        const syncSuccess =
          await syncChangedTables({
            deleted: {
              products: [
                existingProduct.id,
              ],
            },
          });

        if (!syncSuccess) {
          console.error(
            "ProductContext V3: فشلت مزامنة حذف المنتج مع Google Sheets."
          );

          /*
           * المنتج حُذف محليًا، لكن بقي في Google Sheets.
           * سيبقى محليًا محذوفًا إلى أن تتم إعادة المزامنة.
           */
          return;
        }

        console.log(
          "ProductContext V3: تمت مزامنة حذف المنتج مع Google Sheets:",
          existingProduct.id
        );

        setProducts(
          updatedProducts
        );

        dispatchProductChanged();

        console.log(
          "ProductContext V3: تم حذف المنتج محليًا:",
          existingProduct.id
        );

      } catch (error) {

        console.error(
          "حدث خطأ أثناء حذف المنتج:",
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

          deleteProduct,
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
  (): ProductContextType => {

    const context =
      useContext(
        ProductContext
      );

    if (!context) {

      throw new Error(
        "useProducts must be used within a ProductProvider"
      );

    }

    return context;
  };