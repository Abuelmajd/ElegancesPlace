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

/* ============================================================
   V3 DATABASE TABLES
   ============================================================ */

export const V3_TABLE_NAMES = [
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

export type V3TableName =
  (typeof V3_TABLE_NAMES)[number];

/*
 * يمكن استخدام هذا النوع عندما نريد إرسال
 * تغييرات محددة فقط إلى Apps Script.
 */
export type V3ChangedTablesPayload = Partial<
  Record<V3TableName, unknown[]>
>;

interface GoogleSheetsContextType {
  config: GoogleSheetsConfig;

  setConfig: React.Dispatch<
    React.SetStateAction<GoogleSheetsConfig>
  >;

  isSyncing: boolean;

  lastSync: string | null;

  syncError: string | null;

  /*
   * Full Sync
   *
   * يرسل الجداول المحلية الموجودة إلى
   * sync_all_tables.
   *
   * يستخدم كـ Full Sync / Recovery.
   */
  syncNow: () => Promise<boolean>;

  /*
   * Incremental Sync
   *
   * يمكن استدعاؤها هكذا:
   *
   * syncChangedTables(["products"])
   *
   * أو:
   *
   * syncChangedTables(["products", "product_images"])
   *
   * ويمكن أيضًا إرسال السجلات نفسها:
   *
   * syncChangedTables({
   *   products: [product],
   *   product_images: [image]
   * })
   */
  syncChangedTables: (
    tables?:
      | V3TableName[]
      | V3ChangedTablesPayload
  ) => Promise<boolean>;

  /*
   * Full Pull
   *
   * يحمل جميع الجداول.
   */
  pullFromSheets: () => Promise<boolean>;

  /*
   * Selected Tables Pull
   *
   * يحمل جداول محددة فقط.
   */
  pullTables: (
    tableNames: V3TableName[]
  ) => Promise<boolean>;

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

  autoSync: false,
};

/* ============================================================
   CONSTANTS
   ============================================================ */

const CONFIG_KEY =
  "elites_google_sheets_config";

const LAST_SYNC_KEY =
  "elites_last_sync";

/*
 * يحتفظ بنسخة من آخر حالة تمت مزامنتها.
 *
 * يستخدم فقط للمساعدة في معرفة السجلات
 * التي تغيرت عند استخدام syncChangedTables().
 */
const LAST_SYNC_SNAPSHOT_PREFIX =
  "elites_v3_sync_snapshot_";

const DATABASE_VERSION =
  "3.0.0";

/*
 * تم تفعيل V3.
 *
 * يجب أن يكون Apps Script الحالي هو
 * Apps Script V3 الذي يحتوي على:
 *
 * sync_changed_rows
 * get_tables
 * sync_all_tables
 */
const V3_SYNC_ENABLED = true;

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
     * حماية إضافية من القيم الضخمة.
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
         * لا نخزن البيانات الثنائية.
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
                 * Auto Sync يبقى كما هو في الإعداد
                 * ولكن لا نسمح لقيمة قديمة بتشغيله
                 * أثناء التحول.
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

    /*
     * يمنع تشغيل أكثر من عملية Sync
     * في نفس اللحظة.
     */
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
       SAVE LOCAL TABLE
       ======================================================== */

    const saveTable =
      useCallback(
        (
          tableName: V3TableName,
          data: unknown[]
        ): boolean => {
          const key =
            LOCAL_V3_CACHE_KEYS[
              tableName
            ];

          if (!key) {
            return false;
          }

          const cleaned =
            cleanArrayForStorage(
              data
            );

          return safeSetLocalStorage(
            key,
            JSON.stringify(
              cleaned
            )
          );
        },
        []
      );

    /* ========================================================
       BUILD FULL V3 PAYLOAD
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
             * لا نرسل جدولًا فارغًا
             * في Full Sync.
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
       SNAPSHOT HELPERS
       ======================================================== */

    const getSnapshotKey =
      useCallback(
        (
          tableName: V3TableName
        ) =>
          `${LAST_SYNC_SNAPSHOT_PREFIX}${tableName}`,
        []
      );

    const readSnapshot =
      useCallback(
        (
          tableName: V3TableName
        ): unknown[] => {
          const key =
            getSnapshotKey(
              tableName
            );

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

            return Array.isArray(
              parsed
            )
              ? parsed
              : [];
          } catch {
            return [];
          }
        },
        [getSnapshotKey]
      );

    const saveSnapshot =
      useCallback(
        (
          tableName: V3TableName,
          data: unknown[]
        ) => {
          const key =
            getSnapshotKey(
              tableName
            );

          const cleaned =
            cleanArrayForStorage(
              data
            );

          safeSetLocalStorage(
            key,
            JSON.stringify(
              cleaned
            )
          );
        },
        [getSnapshotKey]
      );

    /*
     * ========================================================
     * MERGE SNAPSHOT RECORDS
     * ========================================================
     *
     * هذه الدالة مهمة جدًا في Incremental Sync.
     *
     * لا نستبدل Snapshot كامل الجدول بعد Sync.
     *
     * بل نحدث فقط السجلات التي أرسلناها ونجحت.
     *
     * مثال:
     *
     * Local:
     * A
     * B
     * C
     *
     * Snapshot:
     * A
     * B
     *
     * أرسلنا C فقط.
     *
     * بعد النجاح:
     * Snapshot = A B C
     *
     * أما لو كان هناك تغيير جديد في B أثناء العملية،
     * فلا يتم اعتباره Synced بالخطأ.
     * ========================================================
     */

    const mergeSnapshotRecords =
      useCallback(
        (
          tableName: V3TableName,
          syncedRecords: unknown[]
        ) => {
          if (
            !Array.isArray(
              syncedRecords
            ) ||
            syncedRecords.length ===
              0
          ) {
            return;
          }

          const existingSnapshot =
            readSnapshot(
              tableName
            );

          const snapshotById =
            new Map<
              string,
              unknown
            >();

          /*
           * نحفظ السجلات الحالية الموجودة
           * في Snapshot.
           */
          existingSnapshot.forEach(
            (
              record
            ) => {
              const id =
                getRecordIdStatic(
                  record
                );

              if (
                id
              ) {
                snapshotById.set(
                  id,
                  record
                );
              }
            }
          );

          /*
           * نضيف/نحدث فقط السجلات التي
           * نجحت مزامنتها.
           */
          syncedRecords.forEach(
            (
              record
            ) => {
              const id =
                getRecordIdStatic(
                  record
                );

              if (
                id
              ) {
                snapshotById.set(
                  id,
                  record
                );
              }
            }
          );

          /*
           * السجلات التي لا تحتوي ID
           * لا يمكن تتبعها بأمان.
           *
           * لذلك نضيفها فقط إذا لم تكن موجودة
           * مطابقة بالفعل.
           */
          const recordsWithoutId =
            existingSnapshot.filter(
              (
                record
              ) =>
                !getRecordIdStatic(
                  record
                )
            );

          syncedRecords.forEach(
            (
              record
            ) => {
              if (
                !getRecordIdStatic(
                  record
                )
              ) {
                const serialized =
                  stableSerializeStatic(
                    record
                  );

                const exists =
                  recordsWithoutId.some(
                    (
                      existing
                    ) =>
                      stableSerializeStatic(
                        existing
                      ) ===
                      serialized
                  );

                if (
                  !exists
                ) {
                  recordsWithoutId.push(
                    record
                  );
                }
              }
            }
          );

          const merged =
            Array.from(
              snapshotById.values()
            ).concat(
              recordsWithoutId
            );

          saveSnapshot(
            tableName,
            merged
          );
        },
        [readSnapshot, saveSnapshot]
      );

    /* ========================================================
       STABLE RECORD COMPARISON
       ======================================================== */

    const stableSerialize =
      useCallback(
        (
          value: unknown
        ): string => {
          try {
            if (
              value === null ||
              value === undefined
            ) {
              return "";
            }

            if (
              typeof value !==
              "object"
            ) {
              return JSON.stringify(
                value
              );
            }

            if (
              Array.isArray(
                value
              )
            ) {
              return `[${value
                .map(
                  (item) =>
                    stableSerialize(
                      item
                    )
                )
                .join(",")}]`;
            }

            const object =
              value as Record<
                string,
                unknown
              >;

            return `{${Object.keys(
              object
            )
              .sort()
              .map(
                (key) =>
                  `${JSON.stringify(
                    key
                  )}:${stableSerialize(
                    object[key]
                  )}`
              )
              .join(",")}}`;
          } catch {
            return JSON.stringify(
              value
            );
          }
        },
        []
      );

    /* ========================================================
       GET RECORD ID
       ======================================================== */

    const getRecordId =
      useCallback(
        (
          record: unknown
        ): string => {
          if (
            !record ||
            typeof record !==
              "object"
          ) {
            return "";
          }

          const item =
            record as Record<
              string,
              unknown
            >;

          /*
           * id هو المفتاح الأساسي
           * في Database V3.
           */
          if (
            item.id !==
              undefined &&
            item.id !== null
          ) {
            return String(
              item.id
            ).trim();
          }

          /*
           * fallback في حال بعض البيانات
           * القديمة لا تحتوي id.
           */
          const possibleKeys =
            [
              "product_id",
              "variant_id",
              "group_id",
              "category_id",
              "source_id",
              "image_id",
              "supplier_id",
              "order_id",
              "customer_id",
              "payment_id",
              "review_id",
              "wishlist_id",
              "media_id",
              "currency_id",
              "exchange_rate_id",
              "notification_id",
              "activity_id",
              "entry_id",
              "listing_id",
              "message_id",
              "warehouse_id",
              "inventory_id",
              "movement_id",
              "fulfillment_id",
              "return_id",
              "shipping_id",
              "commission_id",
              "expense_id",
              "tax_profile_id",
              "channel_id",
              "discount_id",
            ];

          for (
            const key of possibleKeys
          ) {
            if (
              item[key] !==
                undefined &&
              item[key] !== null &&
              String(
                item[key]
              ).trim()
            ) {
              return String(
                item[key]
              ).trim();
            }
          }

          return "";
        },
        []
      );

    /*
     * نحتاج هذه النسخ خارج React callbacks
     * داخل mergeSnapshotRecords.
     *
     * يتم تعريفها كدوال ثابتة أسفل الملف أيضًا.
     */

    /* ========================================================
       CALCULATE CHANGED RECORDS
       ======================================================== */

    const calculateChangedRecords =
      useCallback(
        (
          tableName: V3TableName,
          currentRecords: unknown[]
        ): unknown[] => {
          /*
           * إذا لم توجد Snapshot سابقة،
           * فهذا أول Sync للجدول.
           *
           * في هذه الحالة نرسل الجدول كاملًا
           * مرة واحدة فقط.
           */
          const previousRecords =
            readSnapshot(
              tableName
            );

          if (
            previousRecords.length ===
            0
          ) {
            return currentRecords;
          }

          const previousById =
            new Map<
              string,
              string
            >();

          previousRecords.forEach(
            (
              record
            ) => {
              const id =
                getRecordId(
                  record
                );

              if (
                id
              ) {
                previousById.set(
                  id,
                  stableSerialize(
                    record
                  )
                );
              }
            }
          );

          return currentRecords.filter(
            (
              record
            ) => {
              const id =
                getRecordId(
                  record
                );

              /*
               * إذا لم يوجد ID،
               * لا نستطيع معرفة هل تغير السجل،
               * لذلك نرسله.
               */
              if (!id) {
                return true;
              }

              const currentSerialized =
                stableSerialize(
                  record
                );

              const previousSerialized =
                previousById.get(
                  id
                );

              return (
                previousSerialized !==
                currentSerialized
              );
            }
          );
        },
        [
          getRecordId,
          readSnapshot,
          stableSerialize,
        ]
      );

    /* ========================================================
       COMMON RESPONSE PARSER
       ======================================================== */

    const parseApiResponse =
      useCallback(
        async (
          response: Response,
          operationName: string
        ): Promise<any> => {
          if (
            !response.ok
          ) {
            throw new Error(
              `HTTP ${response.status} أثناء ${operationName}`
            );
          }

          const text =
            await response.text();

          if (!text) {
            throw new Error(
              `Google Apps Script أعاد استجابة فارغة أثناء ${operationName}.`
            );
          }

          let result: any;

          try {
            result =
              JSON.parse(
                text
              );
          } catch {
            console.error(
              `Invalid Apps Script response during ${operationName}:`,
              text
            );

            throw new Error(
              `استجابة Google Apps Script أثناء ${operationName} ليست JSON صحيحة.`
            );
          }

          if (
            result.success === false ||
            result.status ===
              "error"
          ) {
            throw new Error(
              result.message ||
                result.error ||
                `فشلت عملية ${operationName}.`
            );
          }

          if (
            result.schemaVersion &&
            result.schemaVersion !==
              DATABASE_VERSION
          ) {
            throw new Error(
              `إصدار قاعدة البيانات غير متطابق. المتوقع ${DATABASE_VERSION}، والمستلم ${result.schemaVersion}.`
            );
          }

          return result;
        },
        []
      );

    /* ========================================================
       UPDATE SYNC MARKER
       ======================================================== */

    const markSyncSuccess =
      useCallback(
        () => {
          const now =
            new Date().toISOString();

          setLastSync(
            now
          );

          safeSetLocalStorage(
            LAST_SYNC_KEY,
            now
          );
        },
        []
      );

    /* ========================================================
       SYNC NOW — FULL SYNC
       ======================================================== */

    const syncNow =
      useCallback(
        async (): Promise<boolean> => {
          if (
            syncingRef.current
          ) {
            console.warn(
              "Google Sheets Full Sync: توجد عملية مزامنة أخرى قيد التنفيذ."
            );

            return false;
          }

          if (
            !V3_SYNC_ENABLED
          ) {
            const message =
              "مزامنة Google Sheets V3 غير مفعلة.";

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
                "Google Sheets V3 Full Sync: لا توجد بيانات محلية."
              );

              markSyncSuccess();

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
              "Google Sheets V3 FULL SYNC:",
              {
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

            await parseApiResponse(
              response,
              "Full Sync"
            );

            /*
             * Full Sync نجح.
             *
             * هنا فقط نحدث Snapshot الكامل
             * للجداول التي أرسلناها.
             */
            tableNames.forEach(
              (
                tableName
              ) => {
                const typedName =
                  tableName as V3TableName;

                const data =
                  tables[
                    typedName
                  ];

                if (
                  Array.isArray(
                    data
                  )
                ) {
                  saveSnapshot(
                    typedName,
                    data
                  );
                }
              }
            );

            markSyncSuccess();

            try {
              window.dispatchEvent(
                new Event(
                  "elites_data_synced"
                )
              );
            } catch {
              // Ignore event errors.
            }

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
              "Google Sheets V3 FULL SYNC error:",
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
          buildV3TablesPayload,
          config.webhookUrl,
          markSyncSuccess,
          parseApiResponse,
          saveSnapshot,
        ]
      );

    /* ========================================================
       INCREMENTAL SYNC
       ======================================================== */

    const syncChangedTables =
      useCallback(
        async (
          requestedTables?:
            | V3TableName[]
            | V3ChangedTablesPayload
        ): Promise<boolean> => {
          if (
            syncingRef.current
          ) {
            console.warn(
              "Google Sheets Incremental Sync: توجد عملية مزامنة أخرى قيد التنفيذ."
            );

            return false;
          }

          if (
            !V3_SYNC_ENABLED
          ) {
            setSyncError(
              "مزامنة Google Sheets V3 غير مفعلة."
            );

            return false;
          }

          if (
            !config.webhookUrl
          ) {
            setSyncError(
              "رابط Google Apps Script غير موجود."
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
            const tables:
              V3ChangedTablesPayload =
              {};

            /*
             * ==================================================
             * MODE 1
             *
             * syncChangedTables(["products"])
             *
             * نقرأ الجدول المحلي ونحسب فقط
             * السجلات التي تغيرت منذ آخر Sync.
             * ==================================================
             */

            if (
              Array.isArray(
                requestedTables
              )
            ) {
              requestedTables.forEach(
                (
                  tableName
                ) => {
                  if (
                    !V3_TABLE_NAMES.includes(
                      tableName
                    )
                  ) {
                    throw new Error(
                      `جدول V3 غير معروف: ${tableName}`
                    );
                  }

                  const current =
                    readTable(
                      tableName
                    );

                  const changed =
                    calculateChangedRecords(
                      tableName,
                      current
                    );

                  if (
                    changed.length >
                    0
                  ) {
                    tables[
                      tableName
                    ] =
                      cleanArrayForStorage(
                        changed
                      );
                  }
                }
              );
            }

            /*
             * ==================================================
             * MODE 2
             *
             * syncChangedTables({
             *   products: [product]
             * })
             *
             * نستخدم السجلات المرسلة مباشرة.
             *
             * هذا هو الوضع الأفضل من Contexts
             * التي تعرف بالضبط ما الذي تغير.
             * ==================================================
             */

            else if (
              requestedTables &&
              typeof requestedTables ===
                "object"
            ) {
              Object.entries(
                requestedTables
              ).forEach(
                ([
                  tableName,
                  records,
                ]) => {
                  if (
                    !V3_TABLE_NAMES.includes(
                      tableName as V3TableName
                    )
                  ) {
                    throw new Error(
                      `جدول V3 غير معروف: ${tableName}`
                    );
                  }

                  if (
                    !Array.isArray(
                      records
                    )
                  ) {
                    throw new Error(
                      `بيانات الجدول ${tableName} يجب أن تكون Array.`
                    );
                  }

                  if (
                    records.length >
                    0
                  ) {
                    tables[
                      tableName as V3TableName
                    ] =
                      cleanArrayForStorage(
                        records
                      );
                  }
                }
              );
            }

            /*
             * ==================================================
             * MODE 3
             *
             * syncChangedTables()
             *
             * نستخدم مجموعة الجداول اليومية
             * ونحسب فقط السجلات التي تغيرت.
             * ==================================================
             */
            else {
              const defaultIncrementalTables:
                V3TableName[] = [
                "products",
                "product_variants",
                "product_groups",
                "product_sources",
                "product_images",
                "price_history",
                "inventory",
                "inventory_movements",
                "customers",
                "orders",
                "order_items",
                "fulfillments",
                "returns",
                "shipping",
                "payments",
                "commissions",
                "reviews",
                "wishlists",
                "notifications",
                "activity_log",
              ];

              defaultIncrementalTables.forEach(
                (
                  tableName
                ) => {
                  const current =
                    readTable(
                      tableName
                    );

                  const changed =
                    calculateChangedRecords(
                      tableName,
                      current
                    );

                  if (
                    changed.length >
                    0
                  ) {
                    tables[
                      tableName
                    ] =
                      cleanArrayForStorage(
                        changed
                      );
                  }
                }
              );
            }

            const tableNames =
              Object.keys(
                tables
              );

            /*
             * لا يوجد شيء تغير.
             *
             * لا نرسل أي طلب إلى Google.
             */
            if (
              tableNames.length ===
              0
            ) {
              console.info(
                "Google Sheets V3 Incremental Sync: لا توجد تغييرات."
              );

              markSyncSuccess();

              return true;
            }

            const payload = {
              action:
                "sync_changed_rows",

              schemaVersion:
                DATABASE_VERSION,

              timestamp:
                new Date().toISOString(),

              tables,
            };

            const totalRecords =
              tableNames.reduce(
                (
                  total,
                  tableName
                ) =>
                  total +
                  (
                    Array.isArray(
                      tables[
                        tableName as V3TableName
                      ]
                    )
                      ? (
                          tables[
                            tableName as V3TableName
                          ] as unknown[]
                        ).length
                      : 0
                  ),
                0
              );

            console.log(
              "Google Sheets V3 INCREMENTAL SYNC:",
              {
                action:
                  "sync_changed_rows",

                tables:
                  tableNames,

                records:
                  totalRecords,
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

            await parseApiResponse(
              response,
              "Incremental Sync"
            );

            /*
             * ==================================================
             * مهم جدًا:
             *
             * لا نأخذ الجدول المحلي كاملًا هنا.
             *
             * نحدث Snapshot فقط بالسجلات التي
             * أرسلناها ونجحت.
             *
             * هذا يمنع اعتبار تغييرات أخرى
             * غير مرسلة بأنها Synced.
             * ==================================================
             */

            tableNames.forEach(
              (
                tableName
              ) => {
                const typedName =
                  tableName as V3TableName;

                const syncedRecords =
                  tables[
                    typedName
                  ];

                if (
                  Array.isArray(
                    syncedRecords
                  )
                ) {
                  mergeSnapshotRecords(
                    typedName,
                    syncedRecords
                  );
                }
              }
            );

            markSyncSuccess();

            try {
              window.dispatchEvent(
                new Event(
                  "elites_data_synced"
                )
              );
            } catch {
              // Ignore event errors.
            }

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
              "Google Sheets V3 Incremental Sync error:",
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
          calculateChangedRecords,
          config.webhookUrl,
          markSyncSuccess,
          mergeSnapshotRecords,
          parseApiResponse,
          readTable,
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

            const result =
              await parseApiResponse(
                response,
                "إنشاء مجلد المنتج"
              );

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
        [
          config.webhookUrl,
          parseApiResponse,
        ]
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

            const result =
              await parseApiResponse(
                response,
                "رفع الصورة"
              );

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
             * نبني الرابط من fileId الحقيقي.
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
             * Cache مؤقت للصورة.
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
        [
          config.webhookUrl,
          parseApiResponse,
        ]
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
                  "بيانات الملف فارغة.",
              };
            }

            if (
              !base64Data.startsWith(
                "data:"
              )
            ) {
              return {
                success:
                  false,

                error:
                  "بيانات الملف ليست Data URL صالحة.",
              };
            }

            if (
              !mimeType.startsWith(
                "image/"
              ) &&
              !mimeType.startsWith(
                "video/"
              )
            ) {
              return {
                success:
                  false,

                error:
                  "نوع الملف غير مدعوم. يسمح فقط بالصور والفيديو.",
              };
            }

            const mediaType =
              mimeType.startsWith(
                "video/"
              )
                ? "video"
                : "image";

            const payload:
              Record<
                string,
                unknown
              > = {
              action:
                "upload_media_to_drive",

              base64Data,

              fileName:
                fileName ||
                (
                  mediaType ===
                  "video"
                    ? "product-video.mp4"
                    : "product-image.jpg"
                ),

              mimeType,

              targetType:
                targetType ||
                "product",

              mediaType,
            };

            if (
              folderId
            ) {
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

            const result =
              await parseApiResponse(
                response,
                "رفع الوسائط"
              );

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
              return {
                success:
                  false,

                error:
                  "لم يُرجع Google Drive fileId حقيقيًا.",
              };
            }

            const directUrl =
              mediaType ===
              "image"
                ? formatGoogleDriveDirectUrl(
                    fileId
                  )
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
             */
            if (
              mediaType ===
              "image"
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

              mediaType,
            };
          } catch (
            error
          ) {
            console.error(
              "uploadMediaToDrive error:",
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
        [
          config.webhookUrl,
          parseApiResponse,
        ]
      );

    /* ========================================================
       FETCH FOLDER MEDIA
       ======================================================== */

    const fetchFolderMedia =
      useCallback(
        async (
          folderId: string
        ): Promise<FetchFolderMediaResult> => {
          const emptyResult:
            FetchFolderMediaResult = {
            success:
              false,

            folderId,

            files: [],

            media: [],

            images: [],
          };

          try {
            if (
              !folderId
            ) {
              return {
                ...emptyResult,

                error:
                  "معرف مجلد Google Drive غير موجود.",
              };
            }

            if (
              !config.webhookUrl
            ) {
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
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "text/plain;charset=utf-8",
                  },

                  body:
                    JSON.stringify({
                      action:
                        "fetch_folder_media",

                      folderId,
                    }),
                }
              );

            const result =
              await parseApiResponse(
                response,
                "جلب وسائط مجلد Google Drive"
              );

            /*
             * Apps Script V3 يعيد:
             *
             * files
             * media
             * images
             */
            const rawFiles =
              Array.isArray(
                result.files
              )
                ? result.files
                : Array.isArray(
                    result.media
                  )
                ? result.media
                : [];

            const files:
              FolderMediaFile[] =
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

                    if (
                      !fileId
                    ) {
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
                        file.driveUrl ||
                        `https://drive.google.com/file/d/${fileId}/view`,

                      viewUrl:
                        file.viewUrl ||
                        `https://drive.google.com/uc?export=view&id=${fileId}`,

                      directUrl:
                        formatGoogleDriveDirectUrl(
                          fileId
                        ),
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
                (
                  file
                ) =>
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
                    (
                      file
                    ) =>
                      file.mediaType ===
                      "video"
                  ).length,
              }
            );

            return {
              success:
                true,

              folderId:
                result.folderId ||
                folderId,

              folderName:
                result.folderName,

              files,

              media:
                files,

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
                error instanceof
                Error
                  ? error.message
                  : String(
                      error
                    ),
            };
          }
        },
        [
          config.webhookUrl,
          parseApiResponse,
        ]
      );

    /* ========================================================
       FETCH FOLDER IMAGES — LEGACY COMPATIBILITY
       ======================================================== */

    const fetchFolderImages =
      useCallback(
        async (
          folderId: string
        ): Promise<
          FolderMediaFile[]
        > => {
          const result =
            await fetchFolderMedia(
              folderId
            );

          return (
            result.images ||
            []
          );
        },
        [
          fetchFolderMedia,
        ]
      );

    /* ========================================================
       APPLY PULLED TABLES TO LOCAL CACHE
       ======================================================== */

    const applyPulledTables =
      useCallback(
        (
          tables: any
        ): {
          savedTables: number;
          savedRecords: number;
        } => {
          if (
            !tables ||
            typeof tables !==
              "object"
          ) {
            throw new Error(
              "لم يتم العثور على جداول V3 في استجابة Google Sheets."
            );
          }

          let savedTables =
            0;

          let savedRecords =
            0;

          V3_TABLE_NAMES.forEach(
            (
              tableName
            ) => {
              const tableData =
                tables[
                  tableName
                ];

              /*
               * إذا لم يرسل backend الجدول،
               * لا نلمس الكاش المحلي.
               */
              if (
                !Array.isArray(
                  tableData
                )
              ) {
                return;
              }

              const cleaned =
                cleanArrayForStorage(
                  tableData
                );

              const saved =
                saveTable(
                  tableName,
                  cleaned
                );

              if (!saved) {
                throw new Error(
                  `تعذر حفظ جدول ${tableName} في LocalStorage.`
                );
              }

              /*
               * بعد Pull ناجح، تصبح البيانات
               * الحالية هي Snapshot المرجعية.
               */
              saveSnapshot(
                tableName,
                cleaned
              );

              savedTables++;

              savedRecords +=
                cleaned.length;
            }
          );

          return {
            savedTables,
            savedRecords,
          };
        },
        [
          saveSnapshot,
          saveTable,
        ]
      );

    /* ========================================================
       PULL SELECTED TABLES
       ======================================================== */

    const pullTables =
      useCallback(
        async (
          tableNames: V3TableName[]
        ): Promise<boolean> => {
          try {
            if (
              !V3_SYNC_ENABLED
            ) {
              setSyncError(
                "قراءة Google Sheets V3 غير مفعلة."
              );

              return false;
            }

            if (
              !config.webhookUrl
            ) {
              setSyncError(
                "رابط Google Apps Script غير موجود."
              );

              return false;
            }

            if (
              !Array.isArray(
                tableNames
              ) ||
              tableNames.length ===
                0
            ) {
              return true;
            }

            const uniqueTables =
              Array.from(
                new Set(
                  tableNames
                )
              );

            uniqueTables.forEach(
              (
                tableName
              ) => {
                if (
                  !V3_TABLE_NAMES.includes(
                    tableName
                  )
                ) {
                  throw new Error(
                    `جدول V3 غير معروف: ${tableName}`
                  );
                }
              }
            );

            setSyncError(
              null
            );

            const params =
              new URLSearchParams();

            params.set(
              "action",
              "get_tables"
            );

            params.set(
              "tables",
              uniqueTables.join(
                ","
              )
            );

            const url =
              `${config.webhookUrl}?${params.toString()}`;

            console.log(
              "Google Sheets V3: Pull selected tables:",
              uniqueTables
            );

            const response =
              await fetch(
                url,
                {
                  method:
                    "GET",
                }
              );

            const result =
              await parseApiResponse(
                response,
                "تحميل الجداول المحددة"
              );

            const tables =
              result.tables ||
              result.data?.tables;

            const summary =
              applyPulledTables(
                tables
              );

            markSyncSuccess();

            console.log(
              "Google Sheets V3: تم تحميل الجداول المحددة:",
              summary
            );

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
              "Google Sheets V3 selected pull error:",
              error
            );

            setSyncError(
              message
            );

            return false;
          }
        },
        [
          applyPulledTables,
          config.webhookUrl,
          markSyncSuccess,
          parseApiResponse,
        ]
      );

    /* ========================================================
       PULL FROM SHEETS — FULL PULL
       ======================================================== */

    const pullFromSheets =
      useCallback(
        async (): Promise<boolean> => {
          try {
            if (
              !V3_SYNC_ENABLED
            ) {
              console.info(
                "Google Sheets V3: القراءة غير مفعلة."
              );

              return false;
            }

            if (
              !config.webhookUrl
            ) {
              setSyncError(
                "رابط Google Apps Script غير موجود."
              );

              return false;
            }

            setSyncError(
              null
            );

            console.log(
              "Google Sheets V3: بدء Full Pull من Sheets..."
            );

            const url =
              `${config.webhookUrl}?action=get_all_tables`;

            const response =
              await fetch(
                url,
                {
                  method:
                    "GET",
                }
              );

            const result =
              await parseApiResponse(
                response,
                "Full Pull"
              );

            const tables =
              result.tables ||
              result.data?.tables;

            const summary =
              applyPulledTables(
                tables
              );

            markSyncSuccess();

            console.log(
              "Google Sheets V3: تم Full Pull بنجاح.",
              summary
            );

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
              "Google Sheets V3 FULL PULL error:",
              error
            );

            setSyncError(
              message
            );

            return false;
          }
        },
        [
          applyPulledTables,
          config.webhookUrl,
          markSyncSuccess,
          parseApiResponse,
        ]
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

          /*
           * لم نعد نستعمل syncNow()
           * هنا حتى لا نرسل Full Database.
           *
           * نستخدم Incremental Sync.
           */
          timer =
            setTimeout(
              () => {
                void syncChangedTables(
                  [
                    "products",
                    "product_variants",
                    "product_sources",
                    "product_images",
                    "price_history",
                    "inventory",
                    "inventory_movements",
                  ]
                );
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
      syncChangedTables,
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
              "Sync trigger ignored."
            );

            return;
          }

          /*
           * Trigger عام = Incremental
           *
           * Full Sync يبقى متاحًا مباشرة
           * عبر syncNow().
           */
          void syncChangedTables();
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
      syncChangedTables,
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

      /*
       * Full Sync
       */
      syncNow,

      /*
       * Incremental Sync
       */
      syncChangedTables,

      /*
       * Full Pull
       */
      pullFromSheets,

      /*
       * Selected Pull
       */
      pullTables,

      /*
       * Google Drive
       */
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
   STATIC HELPERS FOR SNAPSHOT MERGING
   ============================================================ */

function getRecordIdStatic(
  record: unknown
): string {
  if (
    !record ||
    typeof record !==
      "object"
  ) {
    return "";
  }

  const item =
    record as Record<
      string,
      unknown
    >;

  if (
    item.id !==
      undefined &&
    item.id !== null
  ) {
    return String(
      item.id
    ).trim();
  }

  const possibleKeys =
    [
      "product_id",
      "variant_id",
      "group_id",
      "category_id",
      "source_id",
      "image_id",
      "supplier_id",
      "order_id",
      "customer_id",
      "payment_id",
      "review_id",
      "wishlist_id",
      "media_id",
      "currency_id",
      "exchange_rate_id",
      "notification_id",
      "activity_id",
      "entry_id",
      "listing_id",
      "message_id",
      "warehouse_id",
      "inventory_id",
      "movement_id",
      "fulfillment_id",
      "return_id",
      "shipping_id",
      "commission_id",
      "expense_id",
      "tax_profile_id",
      "channel_id",
      "discount_id",
    ];

  for (
    const key of possibleKeys
  ) {
    if (
      item[key] !==
        undefined &&
      item[key] !== null &&
      String(
        item[key]
      ).trim()
    ) {
      return String(
        item[key]
      ).trim();
    }
  }

  return "";
}

function stableSerializeStatic(
  value: unknown
): string {
  try {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (
      typeof value !==
      "object"
    ) {
      return JSON.stringify(
        value
      );
    }

    if (
      Array.isArray(
        value
      )
    ) {
      return `[${value
        .map(
          (item) =>
            stableSerializeStatic(
              item
            )
        )
        .join(",")}]`;
    }

    const object =
      value as Record<
        string,
        unknown
      >;

    return `{${Object.keys(
      object
    )
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(
            key
          )}:${stableSerializeStatic(
            object[key]
          )}`
      )
      .join(",")}}`;
  } catch {
    return JSON.stringify(
      value
    );
  }
}

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