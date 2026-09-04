import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  cacheDriveImagePreview,
  extractGoogleDriveId,
  formatGoogleDriveDirectUrl,
} from "../utils/googleDriveUtils";

/* ============================================================
   TYPES
   ============================================================ */

export interface GoogleSheetsConfig {
  sheetId: string;
  webhookUrl: string;
  folderId: string;
  categoriesFolderId: string;
  autoSync: boolean;
}

interface CreateProductFolderResult {
  success: boolean;
  folderId?: string;
  folderName?: string;
  folderUrl?: string;
  error?: string;
}

interface UploadMediaResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  driveUrl?: string;
  directUrl?: string;
  viewUrl?: string;
  mimeType?: string;
  folderId?: string;
  folderUrl?: string;
  mediaType?: "image" | "video";
  error?: string;
}

type UploadImageResult = UploadMediaResult;

interface FolderMediaFile {
  fileId: string;
  fileName: string;
  mimeType: string;
  mediaType: "image" | "video";
  fileType?: "image" | "video";
  driveUrl?: string;
  viewUrl?: string;
  directUrl?: string;
}

interface FetchFolderMediaResult {
  success: boolean;
  folderId?: string;
  folderName?: string;
  files: FolderMediaFile[];
  media: FolderMediaFile[];
  images: FolderMediaFile[];
  error?: string;
}

interface GoogleSheetsContextType {
  config: GoogleSheetsConfig;

  setConfig: React.Dispatch<
    React.SetStateAction<GoogleSheetsConfig>
  >;

  isSyncing: boolean;

  lastSync: string | null;

  syncError: string | null;

  syncNow: () => Promise<boolean>;

  pullFromSheets: () => Promise<boolean>;

  createProductFolder: (
    productName: string,
    sku: string
  ) => Promise<CreateProductFolderResult>;

  uploadImageToDrive: (
    base64Data: string,
    fileName: string,
    mimeType?: string,
    targetType?: string,
    folderId?: string
  ) => Promise<UploadImageResult>;

  uploadMediaToDrive: (
    base64Data: string,
    fileName: string,
    mimeType: string,
    targetType?: string,
    folderId?: string
  ) => Promise<UploadMediaResult>;

  fetchFolderMedia: (
    folderId: string
  ) => Promise<FetchFolderMediaResult>;

  /*
   * Wrapper قديم للتوافق مع المكونات القديمة.
   * يعيد الصور فقط.
   */
  fetchFolderImages: (
    folderId: string
  ) => Promise<FolderMediaFile[]>;

  triggerSync: () => void;
}

/* ============================================================
   DEFAULT CONFIG
   ============================================================ */

const DEFAULT_CONFIG: GoogleSheetsConfig = {
  sheetId:
    "1MtmMwC9bBrEgX-y2wqltuvwmIsPIt0vUdi0L03JesRU",

  webhookUrl:
    "https://script.google.com/macros/s/AKfycbw2bDPslbyuoZ-bhC2pIgLPJZglO2mum2IkSWl1hqYiwjwPCkvDeY4qUqLKpjX_tXqtEQ/exec",

  folderId:
    "1JfMshA_FjBRifRRqci0E-jZaoLhESWNl",

  categoriesFolderId:
    "1JfMshA_FjBRifRRqci0E-jZaoLhESWNl",

  /*
   * يبقى مغلقًا حتى يصبح Apps Script متوافقًا
   * بالكامل مع Database V3.
   */
  autoSync: false,
};

/* ============================================================
   CONSTANTS
   ============================================================ */

const CONFIG_KEY =
  "elites_google_sheets_config";

const LAST_SYNC_KEY =
  "elites_last_sync";

const DATABASE_VERSION =
  "3.0.0";

/*
 * مهم جدًا:
 *
 * لا نسمح للمزامنة بإرسال بيانات إلى Apps Script
 * القديم أثناء مرحلة الانتقال.
 *
 * بعد تحديث Apps Script V3 سنغيّرها إلى true.
 */
const V3_SYNC_ENABLED = true;

/* ============================================================
   V3 DATABASE TABLES
   ============================================================ */

const V3_TABLE_NAMES = [
  "products",
  "product_variants",
  "product_groups",
  "categories",
  "product_sources",
  "product_images",
  "price_history",
  "suppliers",
  "supplier_channels",
  "supplier_product_discoveries",
  "supplier_shipping_rates",
  "supplier_transactions",
  "warehouses",
  "inventory",
  "inventory_movements",
  "customers",
  "orders",
  "order_items",
  "fulfillments",
  "returns",
  "shipping_zones",
  "shipping",
  "payments",
  "commissions",
  "expenses",
  "accounting_entries",
  "tax_profiles",
  "sales_channels",
  "product_channel_listings",
  "customer_messages",
  "users",
  "notifications",
  "activity_log",
  "store_settings",
  "discounts",
  "reviews",
  "wishlists",
  "media",
  "currencies",
  "exchange_rates",
] as const;

type V3TableName =
  (typeof V3_TABLE_NAMES)[number];

/* ============================================================
   LOCAL STORAGE HELPERS
   ============================================================ */

function safeGetLocalStorage(
  key: string
): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetLocalStorage(
  key: string,
  value: string
): boolean {
  try {
    localStorage.setItem(
      key,
      value
    );

    return true;
  } catch {
    return false;
  }
}

function safeRemoveLocalStorage(
  key: string
): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
}

/* ============================================================
   STORAGE CLEANING
   ============================================================ */

function cleanObjectForStorage(
  value: unknown,
  depth = 0
): unknown {
  /*
   * Prevent circular/deep structures from
   * consuming LocalStorage.
   */
  if (depth > 8) {
    return null;
  }

  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (
    typeof value ===
    "string"
  ) {
    /*
     * Never store Base64 images or Blob URLs.
     */
    if (
      value.startsWith("data:image/") ||
      value.startsWith("data:video/") ||
      value.startsWith("blob:")
    ) {
      return "";
    }

    /*
     * Additional protection against
     * unexpectedly huge values.
     */
    if (
      value.length >
      500000
    ) {
      return "";
    }

    return value;
  }

  if (
    typeof value ===
      "number" ||
    typeof value ===
      "boolean"
  ) {
    return value;
  }

  if (
    Array.isArray(value)
  ) {
    return value.map(
      (item) =>
        cleanObjectForStorage(
          item,
          depth + 1
        )
    );
  }

  if (
    typeof value ===
    "object"
  ) {
    const result:
      Record<
        string,
        unknown
      > = {};

    Object.entries(
      value as Record<
        string,
        unknown
      >
    ).forEach(
      ([key, item]) => {
        const lowerKey =
          key.toLowerCase();

        /*
         * Binary/image payloads
         * must never enter cache.
         */
        if (
          lowerKey === "image_data" ||
          lowerKey === "imagedata" ||
          lowerKey === "video_data" ||
          lowerKey === "videodata" ||
          lowerKey === "media_data" ||
          lowerKey === "mediadata" ||
          lowerKey === "base64" ||
          lowerKey === "preview" ||
          lowerKey === "blob"
        ) {
          return;
        }

        result[key] =
          cleanObjectForStorage(
            item,
            depth + 1
          );
      }
    );

    return result;
  }

  return String(value);
}

function cleanArrayForStorage(
  data: unknown
): unknown[] {
  if (
    !Array.isArray(data)
  ) {
    return [];
  }

  return data.map(
    (item) =>
      cleanObjectForStorage(
        item
      )
  );
}

/* ============================================================
   V3 LOCAL CACHE KEYS
   ============================================================ */

/*
 * هذه ليست أسماء Google Sheets.
 *
 * هي فقط مفاتيح LocalStorage المحلية.
 *
 * كل مفتاح مرتبط بجدول V3 واحد.
 *
 * لا نستخدم مفاتيح الجداول القديمة المختلفة
 * كـ fallback، حتى لا نعيد إدخال بيانات Legacy
 * إلى بنية V3.
 */
const LOCAL_V3_CACHE_KEYS:
  Partial<
    Record<
      V3TableName,
      string
    >
  > = {
  products:
    "elites_store_products",

  product_variants:
    "elites_product_variants",

  product_groups:
    "elites_product_groups",

  categories:
    "elites_categories",

  product_sources:
    "elites_product_sources",

  product_images:
    "elites_product_images",

  price_history:
    "elites_price_history",

  suppliers:
    "elites_suppliers",

  supplier_channels:
    "elites_supplier_channels",

  supplier_product_discoveries:
    "elites_supplier_product_discoveries",

  supplier_shipping_rates:
    "elites_supplier_shipping_rates",

  supplier_transactions:
    "elites_supplier_transactions",

  warehouses:
    "elites_warehouses",

  inventory:
    "elites_inventory",

  inventory_movements:
    "elites_inventory_movements",

  customers:
    "elites_customers",

  orders:
    "elites_orders",

  order_items:
    "elites_order_items",

  fulfillments:
    "elites_fulfillments",

  returns:
    "elites_returns",

  shipping_zones:
    "elites_shipping_zones",

  shipping:
    "elites_shipping",

  payments:
    "elites_payments",

  commissions:
    "elites_commissions",

  expenses:
    "elites_expenses",

  accounting_entries:
    "elites_accounting_entries",

  tax_profiles:
    "elites_tax_profiles",

  sales_channels:
    "elites_sales_channels",

  product_channel_listings:
    "elites_product_channel_listings",

  customer_messages:
    "elites_customer_messages",

  users:
    "elites_users",

  notifications:
    "elites_notifications",

  activity_log:
    "elites_activity_log",

  store_settings:
    "elites_store_settings",

  discounts:
    "elites_discounts",

  reviews:
    "elites_reviews",

  wishlists:
    "elites_wishlists",

  media:
    "elites_media",

  currencies:
    "elites_currencies",

  exchange_rates:
    "elites_exchange_rates",
};

/* ============================================================
   CONTEXT
   ============================================================ */

const GoogleSheetsContext =
  createContext<
    GoogleSheetsContextType | undefined
  >(undefined);

/* ============================================================
   PROVIDER
   ============================================================ */

export const GoogleSheetsProvider:
  React.FC<{
    children: React.ReactNode;
  }> = ({
    children,
  }) => {
    const [
      config,
      setConfig,
    ] =
      useState<GoogleSheetsConfig>(
        () => {
          try {
            const saved =
              safeGetLocalStorage(
                CONFIG_KEY
              );

            if (
              saved
            ) {
              const parsed =
                JSON.parse(
                  saved
                );

              return {
                ...DEFAULT_CONFIG,
                ...parsed,

                /*
                 * لا نسمح لأي إعداد قديم
                 * بتشغيل Auto Sync.
                 */
                autoSync: false,
              };
            }
          } catch {
            // Ignore invalid configuration.
          }

          return DEFAULT_CONFIG;
        }
      );

    const [
      isSyncing,
      setIsSyncing,
    ] = useState(false);

    const [
      lastSync,
      setLastSync,
    ] =
      useState<
        string | null
      >(null);

    const [
      syncError,
      setSyncError,
    ] =
      useState<
        string | null
      >(null);

    const syncingRef =
      useRef(false);

    /* ========================================================
       SAVE CONFIG
       ======================================================== */

    useEffect(() => {
      safeSetLocalStorage(
        CONFIG_KEY,
        JSON.stringify(
          config
        )
      );
    }, [config]);

    /* ========================================================
       READ V3 LOCAL TABLE
       ======================================================== */

    const readTable =
      useCallback(
        (
          tableName: V3TableName
        ): unknown[] => {
          const key =
            LOCAL_V3_CACHE_KEYS[
              tableName
            ];

          if (!key) {
            return [];
          }

          try {
            const raw =
              safeGetLocalStorage(
                key
              );

            if (!raw) {
              return [];
            }

            const parsed =
              JSON.parse(
                raw
              );

            if (
              Array.isArray(
                parsed
              )
            ) {
              return parsed;
            }
          } catch (
            error
          ) {
            console.warn(
              `تعذر قراءة جدول V3 المحلي: ${tableName}`,
              error
            );
          }

          return [];
        },
        []
      );

    /* ========================================================
       BUILD V3 PAYLOAD
       ======================================================== */

    const buildV3TablesPayload =
      useCallback(() => {
        const tables:
          Partial<
            Record<
              V3TableName,
              unknown[]
            >
          > = {};

        V3_TABLE_NAMES.forEach(
          (
            tableName
          ) => {
            const data =
              readTable(
                tableName
              );

            /*
             * لا نرسل جدولًا فارغًا.
             *
             * هذا مهم جدًا لأننا لا نريد
             * أن يتحول الجدول الفارغ إلى
             * عملية حذف/مسح في backend.
             */
            if (
              data.length >
              0
            ) {
              tables[
                tableName
              ] =
                cleanArrayForStorage(
                  data
                );
            }
          }
        );

        return tables;
      }, [readTable]);

    /* ========================================================
       SYNC NOW
       ======================================================== */

    const syncNow =
      useCallback(
        async (): Promise<boolean> => {
          /*
           * حماية من الضغط المتكرر.
           */
          if (
            syncingRef.current
          ) {
            return false;
          }

          /*
           * V3 backend غير مفعّل بعد.
           *
           * نرفض المزامنة بدل إرسال payload
           * إلى Apps Script القديم.
           */
          if (
            !V3_SYNC_ENABLED
          ) {
            const message =
              "مزامنة Google Sheets V3 متوقفة مؤقتًا حتى يتم تحديث Apps Script إلى API V3.";

            console.info(
              message
            );

            setSyncError(
              message
            );

            return false;
          }

          if (
            !config.webhookUrl
          ) {
            const message =
              "رابط Google Apps Script غير موجود.";

            setSyncError(
              message
            );

            return false;
          }

          syncingRef.current =
            true;

          setIsSyncing(
            true
          );

          setSyncError(
            null
          );

          try {
            const tables =
              buildV3TablesPayload();

            const tableNames =
              Object.keys(
                tables
              );

            if (
              tableNames.length ===
              0
            ) {
              console.info(
                "Google Sheets V3: لا توجد بيانات محلية جاهزة للمزامنة."
              );

              return true;
            }

            const payload = {
              action:
                "sync_all_tables",

              schemaVersion:
                DATABASE_VERSION,

              timestamp:
                new Date().toISOString(),

              tables,
            };

            console.log(
              "Google Sheets V3 sync:",
              {
                schemaVersion:
                  DATABASE_VERSION,

                tables:
                  tableNames,

                count:
                  tableNames.length,
              }
            );

            const response =
              await fetch(
                config.webhookUrl,
                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "text/plain;charset=utf-8",
                  },

                  body:
                    JSON.stringify(
                      payload
                    ),
                }
              );

            if (
              !response.ok
            ) {
              throw new Error(
                `HTTP ${response.status}`
              );
            }

            let result:
              any = null;

            try {
              const text =
                await response.text();

              if (
                text
              ) {
                result =
                  JSON.parse(
                    text
                  );
              }
            } catch {
              /*
               * لا نعتمد على parsing
               * إذا كان الرد غير قابل للقراءة.
               */
            }

            if (
              result &&
              (
                result.success === false ||
                result.status === "error"
              )
            ) {
              throw new Error(
                result.message ||
                  result.error ||
                  "فشلت مزامنة Google Sheets."
              );
            }

            if (
              result &&
              result.schemaVersion &&
              result.schemaVersion !==
                DATABASE_VERSION
            ) {
              throw new Error(
                `إصدار قاعدة البيانات غير متطابق. المتوقع ${DATABASE_VERSION}، والمستلم ${result.schemaVersion}.`
              );
            }

            const now =
              new Date().toISOString();

            setLastSync(
              now
            );

            safeSetLocalStorage(
              LAST_SYNC_KEY,
              now
            );

            return true;
          } catch (
            error
          ) {
            const message =
              error instanceof
              Error
                ? error.message
                : String(
                    error
                  );

            console.error(
              "Google Sheets V3 sync error:",
              error
            );

            setSyncError(
              message
            );

            return false;
          } finally {
            syncingRef.current =
              false;

            setIsSyncing(
              false
            );
          }
        },
        [
          config.webhookUrl,
          buildV3TablesPayload,
        ]
      );

    /* ========================================================
       CREATE PRODUCT FOLDER
       ======================================================== */

    const createProductFolder =
      useCallback(
        async (
          productName: string,
          sku: string
        ): Promise<
          CreateProductFolderResult
        > => {
          try {
            if (
              !config.webhookUrl
            ) {
              return {
                success:
                  false,

                error:
                  "رابط Google Apps Script غير موجود.",
              };
            }

            if (
              !productName &&
              !sku
            ) {
              return {
                success:
                  false,

                error:
                  "اسم المنتج أو SKU مطلوب.",
              };
            }

            const payload = {
              action:
                "create_product_folder",

              productName:
                productName ||
                "",

              sku:
                sku || "",
            };

            const response =
              await fetch(
                config.webhookUrl,
                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "text/plain;charset=utf-8",
                  },

                  body:
                    JSON.stringify(
                      payload
                    ),
                }
              );

            if (
              !response.ok
            ) {
              throw new Error(
                `HTTP ${response.status}`
              );
            }

            const text =
              await response.text();

            if (
              !text
            ) {
              throw new Error(
                "Google Apps Script أعاد استجابة فارغة."
              );
            }

            let result:
              any;

            try {
              result =
                JSON.parse(
                  text
                );
            } catch {
              console.error(
                "Invalid Apps Script response:",
                text
              );

              throw new Error(
                "استجابة Google Apps Script ليست JSON صحيحة."
              );
            }

            if (
              result.status !==
              "success"
            ) {
              return {
                success:
                  false,

                error:
                  result.message ||
                  result.error ||
                  "فشل إنشاء مجلد المنتج.",
              };
            }

            if (
              !result.folderId
            ) {
              return {
                success:
                  false,

                error:
                  "لم يُرجع Google Drive معرف المجلد الحقيقي.",
              };
            }

            return {
              success:
                true,

              folderId:
                result.folderId,

              folderName:
                result.folderName,

              folderUrl:
                result.folderUrl,
            };
          } catch (
            error
          ) {
            console.error(
              "createProductFolder error:",
              error
            );

            return {
              success:
                false,

              error:
                error instanceof
                Error
                  ? error.message
                  : String(
                      error
                    ),
            };
          }
        },
        [config.webhookUrl]
      );

    /* ========================================================
       UPLOAD IMAGE TO DRIVE
       ======================================================== */

    const uploadImageToDrive =
      useCallback(
        async (
          base64Data: string,
          fileName: string,
          mimeType = "image/jpeg",
          targetType = "product",
          folderId?: string
        ): Promise<
          UploadImageResult
        > => {
          try {
            if (
              !config.webhookUrl
            ) {
              return {
                success:
                  false,

                error:
                  "رابط Google Apps Script غير موجود.",
              };
            }

            if (
              !base64Data
            ) {
              return {
                success:
                  false,

                error:
                  "بيانات الصورة فارغة.",
              };
            }

            if (
              !base64Data.startsWith(
                "data:image/"
              )
            ) {
              return {
                success:
                  false,

                error:
                  "بيانات الصورة ليست Data URL صالحة.",
              };
            }

            const payload:
              Record<
                string,
                unknown
              > = {
              action:
                "upload_image_to_drive",

              base64Data,

              fileName:
                fileName ||
                "product-image.jpg",

              mimeType:
                mimeType ||
                "image/jpeg",

              targetType:
                targetType ||
                "product",
            };

            if (
              folderId
            ) {
              payload.folderId =
                folderId;
            }

            console.log(
              "Uploading image to Google Drive:",
              {
                fileName,
                mimeType,
                targetType,
                folderId,
                base64Length:
                  base64Data.length,
              }
            );

            const response =
              await fetch(
                config.webhookUrl,
                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "text/plain;charset=utf-8",
                  },

                  body:
                    JSON.stringify(
                      payload
                    ),
                }
              );

            if (
              !response.ok
            ) {
              throw new Error(
                `HTTP ${response.status}`
              );
            }

            const text =
              await response.text();

            if (
              !text
            ) {
              throw new Error(
                "Google Apps Script أعاد استجابة فارغة أثناء رفع الصورة."
              );
            }

            let result:
              any;

            try {
              result =
                JSON.parse(
                  text
                );
            } catch {
              console.error(
                "Invalid Apps Script upload response:",
                text
              );

              throw new Error(
                "استجابة Google Apps Script أثناء رفع الصورة ليست JSON صحيحة."
              );
            }

            if (
              result.success === false ||
              result.status === "error"
            ) {
              return {
                success:
                  false,

                error:
                  result.message ||
                  result.error ||
                  "فشل رفع الصورة إلى Google Drive.",
              };
            }

            /*
             * لا نقبل نجاحًا بدون fileId حقيقي.
             */
            const fileId =
              result.fileId ||
              extractGoogleDriveId(
                result.directUrl ||
                  result.viewUrl ||
                  result.driveUrl ||
                  result.url ||
                  ""
              );

            if (
              !fileId
            ) {
              console.error(
                "Upload response contains no real fileId:",
                result
              );

              return {
                success:
                  false,

                error:
                  "لم يُرجع Google Drive fileId حقيقيًا.",
              };
            }

            /*
             * مهم:
             *
             * لا نستخدم result.directUrl
             * لأن Apps Script قد يعيد رابط download.
             *
             * نبني رابط الصورة مباشرة من File ID.
             */
            const directUrl =
              formatGoogleDriveDirectUrl(
                fileId
              );

            const viewUrl =
              `https://drive.google.com/uc?export=view&id=${fileId}`;

            const driveUrl =
              `https://drive.google.com/file/d/${fileId}/view`;

            /*
             * Preview cache في sessionStorage فقط.
             *
             * لا يدخل إلى LocalStorage.
             */
            try {
              cacheDriveImagePreview(
                fileId,
                base64Data
              );
            } catch (
              cacheError
            ) {
              console.warn(
                "تعذر حفظ معاينة الصورة مؤقتًا:",
                cacheError
              );
            }

            return {
              success:
                true,

              fileId,

              fileName:
                result.fileName ||
                fileName,

              driveUrl,

              directUrl,

              viewUrl,

              mimeType:
                result.mimeType ||
                mimeType,

              folderId:
                result.folderId ||
                folderId,

              folderUrl:
                result.folderUrl,
            };
          } catch (
            error
          ) {
            console.error(
              "uploadImageToDrive error:",
              error
            );

            return {
              success:
                false,

              error:
                error instanceof
                Error
                  ? error.message
                  : String(
                      error
                    ),
            };
          }
        },
        [config.webhookUrl]
      );

    /* ========================================================
       UPLOAD MEDIA TO DRIVE
       ======================================================== */

    const uploadMediaToDrive =
      useCallback(
        async (
          base64Data: string,
          fileName: string,
          mimeType: string,
          targetType = "product",
          folderId?: string
        ): Promise<UploadMediaResult> => {
          try {
            if (!config.webhookUrl) {
              return {
                success: false,
                error:
                  "رابط Google Apps Script غير موجود.",
              };
            }

            if (!base64Data) {
              return {
                success: false,
                error:
                  "بيانات الملف فارغة.",
              };
            }

            if (
              !base64Data.startsWith(
                "data:"
              )
            ) {
              return {
                success: false,
                error:
                  "بيانات الملف ليست Data URL صالحة.",
              };
            }

            if (
              !mimeType.startsWith("image/") &&
              !mimeType.startsWith("video/")
            ) {
              return {
                success: false,
                error:
                  "نوع الملف غير مدعوم. يسمح فقط بالصور والفيديو.",
              };
            }

            const mediaType =
              mimeType.startsWith("video/")
                ? "video"
                : "image";

            const payload: Record<
              string,
              unknown
            > = {
              action:
                "upload_media_to_drive",

              base64Data,

              fileName:
                fileName ||
                (
                  mediaType === "video"
                    ? "product-video.mp4"
                    : "product-image.jpg"
                ),

              mimeType,

              targetType:
                targetType || "product",

              mediaType,
            };

            if (folderId) {
              payload.folderId =
                folderId;
            }

            console.log(
              "Uploading media to Google Drive:",
              {
                fileName,
                mimeType,
                mediaType,
                folderId,
                base64Length:
                  base64Data.length,
              }
            );

            const response =
              await fetch(
                config.webhookUrl,
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "text/plain;charset=utf-8",
                  },

                  body:
                    JSON.stringify(
                      payload
                    ),
                }
              );

            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}`
              );
            }

            const text =
              await response.text();

            if (!text) {
              throw new Error(
                "Google Apps Script أعاد استجابة فارغة."
              );
            }

            let result: any;

            try {
              result =
                JSON.parse(text);
            } catch {
              throw new Error(
                "استجابة Google Apps Script ليست JSON صحيحة."
              );
            }

            if (
              result.success === false ||
              result.status === "error"
            ) {
              return {
                success: false,
                error:
                  result.message ||
                  result.error ||
                  "فشل رفع الملف إلى Google Drive.",
              };
            }

            const fileId =
              result.fileId ||
              extractGoogleDriveId(
                result.directUrl ||
                  result.viewUrl ||
                  result.driveUrl ||
                  result.url ||
                  ""
              );

            if (!fileId) {
              return {
                success: false,
                error:
                  "لم يُرجع Google Drive fileId حقيقيًا.",
              };
            }

            const directUrl =
              mediaType === "image"
                ? formatGoogleDriveDirectUrl(fileId)
                : (
                    result.viewUrl ||
                    `https://drive.google.com/file/d/${fileId}/view`
                  );

            const viewUrl =
              result.viewUrl ||
              `https://drive.google.com/uc?export=view&id=${fileId}`;

            const driveUrl =
              result.driveUrl ||
              `https://drive.google.com/file/d/${fileId}/view`;

            /*
             * Cache للصور فقط.
             *
             * لا نخزن فيديوهات Base64 في sessionStorage.
             */
            if (
              mediaType === "image"
            ) {
              try {
                cacheDriveImagePreview(
                  fileId,
                  base64Data
                );
              } catch (
                cacheError
              ) {
                console.warn(
                  "تعذر حفظ معاينة الصورة مؤقتًا:",
                  cacheError
                );
              }
            }

            return {
              success: true,

              fileId,

              fileName:
                result.fileName ||
                fileName,

              driveUrl,

              directUrl,

              viewUrl,

              mimeType:
                result.mimeType ||
                mimeType,

              folderId:
                result.folderId ||
                folderId,

              folderUrl:
                result.folderUrl,

              mediaType,
            };
          } catch (error) {
            console.error(
              "uploadMediaToDrive error:",
              error
            );

            return {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            };
          }
        },
        [config.webhookUrl]
      );

    /* ========================================================
       FETCH FOLDER MEDIA
       ======================================================== */

    const fetchFolderMedia =
      useCallback(
        async (
          folderId: string
        ): Promise<FetchFolderMediaResult> => {
          const emptyResult: FetchFolderMediaResult = {
            success: false,
            folderId,
            files: [],
            media: [],
            images: [],
          };

          try {
            if (!folderId) {
              return {
                ...emptyResult,
                error:
                  "معرف مجلد Google Drive غير موجود.",
              };
            }

            if (!config.webhookUrl) {
              return {
                ...emptyResult,
                error:
                  "رابط Google Apps Script غير موجود.",
              };
            }

            const response =
              await fetch(
                config.webhookUrl,
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "text/plain;charset=utf-8",
                  },

                  body: JSON.stringify({
                    action:
                      "fetch_folder_media",

                    folderId,
                  }),
                }
              );

            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}`
              );
            }

            const text =
              await response.text();

            if (!text) {
              throw new Error(
                "Google Apps Script أعاد استجابة فارغة."
              );
            }

            let result: any;

            try {
              result =
                JSON.parse(text);
            } catch {
              console.error(
                "Invalid fetchFolderMedia response:",
                text
              );

              throw new Error(
                "استجابة Google Apps Script ليست JSON صحيحة."
              );
            }

            if (
              result.success === false ||
              result.status === "error"
            ) {
              throw new Error(
                result.message ||
                  result.error ||
                  "فشل جلب وسائط مجلد Google Drive."
              );
            }

            /*
             * Apps Script V3 يعيد:
             *
             * files
             * media
             * images
             *
             * نستخدم files كمصدر رئيسي.
             */
            const rawFiles =
              Array.isArray(result.files)
                ? result.files
                : Array.isArray(result.media)
                ? result.media
                : [];

            const files: FolderMediaFile[] =
              rawFiles
                .map(
                  (
                    file: any
                  ): FolderMediaFile | null => {
                    if (!file) {
                      return null;
                    }

                    const mimeType =
                      String(
                        file.mimeType ||
                          ""
                      );

                    const mediaType =
                      file.mediaType ===
                        "video" ||
                      mimeType.startsWith(
                        "video/"
                      )
                        ? "video"
                        : "image";

                    const fileId =
                      String(
                        file.fileId ||
                          file.id ||
                          ""
                      );

                    if (!fileId) {
                      return null;
                    }

                    return {
                      fileId,

                      fileName:
                        String(
                          file.fileName ||
                            file.name ||
                            "media"
                        ),

                      mimeType,

                      mediaType,

                      fileType:
                        mediaType,

                      driveUrl:
                        file.driveUrl,

                      viewUrl:
                        file.viewUrl,

                      directUrl:
                        file.directUrl,
                    };
                  }
                )
                .filter(
                  (
                    file
                  ): file is FolderMediaFile =>
                    file !== null
                );

            const images =
              files.filter(
                (file) =>
                  file.mediaType ===
                  "image"
              );

            console.log(
              "Google Drive folder media loaded:",
              {
                folderId:
                  result.folderId ||
                  folderId,

                folderName:
                  result.folderName,

                total:
                  files.length,

                images:
                  images.length,

                videos:
                  files.filter(
                    (file) =>
                      file.mediaType ===
                      "video"
                  ).length,
              }
            );

            return {
              success: true,

              folderId:
                result.folderId ||
                folderId,

              folderName:
                result.folderName,

              files,

              media: files,

              images,
            };
          } catch (
            error
          ) {
            console.error(
              "fetchFolderMedia error:",
              error
            );

            return {
              ...emptyResult,

              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            };
          }
        },
        [config.webhookUrl]
      );

    /* ========================================================
       FETCH FOLDER IMAGES — LEGACY COMPATIBILITY
       ======================================================== */

    const fetchFolderImages =
      useCallback(
        async (
          folderId: string
        ): Promise<FolderMediaFile[]> => {
          const result =
            await fetchFolderMedia(
              folderId
            );

          /*
           * هذه الدالة القديمة تعيد الصور فقط.
           *
           * أي مكون قديم ما زال يستخدم
           * fetchFolderImages لن ينكسر.
           */
          return result.images || [];
        },
        [fetchFolderMedia]
      );

    /* ========================================================
       PULL FROM SHEETS
       ======================================================== */

    const pullFromSheets =
      useCallback(
        async (): Promise<boolean> => {
          try {
            if (!V3_SYNC_ENABLED) {
              console.info(
                "Google Sheets V3: القراءة غير مفعلة."
              );

              return false;
            }

            if (!config.webhookUrl) {
              setSyncError(
                "رابط Google Apps Script غير موجود."
              );

              return false;
            }

            setSyncError(null);

            console.log(
              "Google Sheets V3: بدء تحميل البيانات من Sheets..."
            );

            const url =
              `${config.webhookUrl}?action=get_all_tables`;

            const response =
              await fetch(url, {
                method: "GET",
              });

            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}`
              );
            }

            const text =
              await response.text();

            if (!text) {
              throw new Error(
                "Google Apps Script أعاد استجابة فارغة."
              );
            }

            let result: any;

            try {
              result =
                JSON.parse(text);
            } catch {
              console.error(
                "Invalid Google Sheets V3 response:",
                text
              );

              throw new Error(
                "استجابة Google Sheets V3 ليست JSON صحيحة."
              );
            }

            /*
             * التحقق من نجاح API.
             */
            if (
              result.success === false ||
              result.status === "error"
            ) {
              throw new Error(
                result.message ||
                  result.error ||
                  "فشل تحميل البيانات من Google Sheets."
              );
            }

            /*
             * التحقق من إصدار قاعدة البيانات.
             */
            if (
              result.schemaVersion &&
              result.schemaVersion !==
                DATABASE_VERSION
            ) {
              throw new Error(
                `إصدار قاعدة البيانات غير متطابق. المتوقع ${DATABASE_VERSION}، والمستلم ${result.schemaVersion}.`
              );
            }

            /*
             * بعض نسخ API قد تضع tables مباشرة،
             * وبعضها قد تضعها داخل data.
             */
            const tables =
              result.tables ||
              result.data?.tables;

            if (
              !tables ||
              typeof tables !== "object"
            ) {
              throw new Error(
                "لم يتم العثور على جداول V3 في استجابة Google Sheets."
              );
            }

            let savedTables = 0;
            let savedRecords = 0;

            /*
             * Google Sheets هو المصدر الرسمي للبيانات.
             *
             * لذلك نستبدل الكاش المحلي ببيانات Sheets.
             */
            V3_TABLE_NAMES.forEach(
              (tableName) => {
                const key =
                  LOCAL_V3_CACHE_KEYS[
                    tableName
                  ];

                if (!key) {
                  return;
                }

                const tableData =
                  tables[tableName];

                /*
                 * إذا كان الجدول موجودًا في الرد
                 * نحفظه حتى لو كان فارغًا.
                 *
                 * هذا مهم لأن Sheets هو المصدر الرسمي.
                 */
                if (
                  Array.isArray(
                    tableData
                  )
                ) {
                  const cleaned =
                    cleanArrayForStorage(
                      tableData
                    );

                  const saved =
                    safeSetLocalStorage(
                      key,
                      JSON.stringify(
                        cleaned
                      )
                    );

                  if (!saved) {
                    throw new Error(
                      `تعذر حفظ جدول ${tableName} في LocalStorage.`
                    );
                  }

                  savedTables++;
                  savedRecords +=
                    cleaned.length;
                }
              }
            );

            const now =
              new Date().toISOString();

            setLastSync(now);

            safeSetLocalStorage(
              LAST_SYNC_KEY,
              now
            );

            console.log(
              "Google Sheets V3: تم تحميل البيانات بنجاح.",
              {
                tables:
                  savedTables,

                records:
                  savedRecords,
              }
            );

            /*
             * إبلاغ باقي التطبيق بأن البيانات
             * المحلية تم تحديثها من Sheets.
             */
            try {
              window.dispatchEvent(
                new Event(
                  "elites_data_pulled"
                )
              );
            } catch {
              // Ignore event errors.
            }

            return true;

          } catch (error) {

            const message =
              error instanceof Error
                ? error.message
                : String(error);

            console.error(
              "Google Sheets V3 pull error:",
              error
            );

            setSyncError(
              message
            );

            return false;
          }
        },
        [config.webhookUrl]
      );

    /* ========================================================
       TRIGGER SYNC
       ======================================================== */

    const triggerSync =
      useCallback(
        () => {
          try {
            window.dispatchEvent(
              new CustomEvent(
                "elites_trigger_sync"
              )
            );
          } catch (
            error
          ) {
            console.warn(
              "تعذر إرسال حدث المزامنة:",
              error
            );
          }
        },
        []
      );

    /* ========================================================
       LOAD LAST SYNC
       ======================================================== */

    useEffect(() => {
      const saved =
        safeGetLocalStorage(
          LAST_SYNC_KEY
        );

      if (
        saved
      ) {
        setLastSync(
          saved
        );
      }
    }, []);

    /* ========================================================
       AUTO SYNC LISTENER
       ======================================================== */

    useEffect(() => {
      /*
       * Auto Sync يبقى مغلقًا أثناء بناء V3.
       */
      if (
        !config.autoSync ||
        !V3_SYNC_ENABLED
      ) {
        return;
      }

      let timer:
        | ReturnType<
            typeof setTimeout
          >
        | null = null;

      const handleProductChanged =
        () => {
          if (
            timer
          ) {
            clearTimeout(
              timer
            );
          }

          timer =
            setTimeout(
              () => {
                void syncNow();
              },
              800
            );
        };

      window.addEventListener(
        "elites_product_changed",
        handleProductChanged
      );

      return () => {
        if (
          timer
        ) {
          clearTimeout(
            timer
          );
        }

        window.removeEventListener(
          "elites_product_changed",
          handleProductChanged
        );
      };
    }, [
      config.autoSync,
      syncNow,
    ]);

    /* ========================================================
       EXTERNAL SYNC TRIGGER
       ======================================================== */

    useEffect(() => {
      const handleTrigger =
        () => {
          if (
            !config.autoSync ||
            !V3_SYNC_ENABLED
          ) {
            console.info(
              "Sync trigger ignored: V3 backend is not enabled yet."
            );

            return;
          }

          void syncNow();
        };

      window.addEventListener(
        "elites_trigger_sync",
        handleTrigger
      );

      return () => {
        window.removeEventListener(
          "elites_trigger_sync",
          handleTrigger
        );
      };
    }, [
      config.autoSync,
      syncNow,
    ]);

    /* ========================================================
       CONTEXT VALUE
       ======================================================== */

    const value:
      GoogleSheetsContextType = {
      config,

      setConfig,

      isSyncing,

      lastSync,

      syncError,

      syncNow,

      pullFromSheets,

      createProductFolder,

      uploadImageToDrive,

      uploadMediaToDrive,

      fetchFolderMedia,

      fetchFolderImages,

      triggerSync,
    };

    return (
      <GoogleSheetsContext.Provider
        value={value}
      >
        {children}
      </GoogleSheetsContext.Provider>
    );
  };

/* ============================================================
   HOOK
   ============================================================ */

export function useGoogleSheets() {
  const context =
    useContext(
      GoogleSheetsContext
    );

  if (
    !context
  ) {
    throw new Error(
      "useGoogleSheets must be used inside GoogleSheetsProvider"
    );
  }

  return context;
}

export default GoogleSheetsContext;