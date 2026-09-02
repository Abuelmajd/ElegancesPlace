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

interface UploadImageResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  driveUrl?: string;
  directUrl?: string;
  viewUrl?: string;
  mimeType?: string;
  folderId?: string;
  folderUrl?: string;
  error?: string;
}

interface GoogleSheetsContextType {
  config: GoogleSheetsConfig;
  setConfig: React.Dispatch<React.SetStateAction<GoogleSheetsConfig>>;

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

  fetchFolderImages: (
    folderId: string
  ) => Promise<any[]>;

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

  autoSync: true,
};

/* ============================================================
   STORAGE HELPERS
   ============================================================ */

const CONFIG_KEY = "elites_google_sheets_config";

function safeGetLocalStorage(key: string): string | null {
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
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemoveLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/* ============================================================
   STORAGE CLEANING
   ============================================================ */

function cleanObjectForStorage(
  value: any,
  depth = 0
): any {
  if (depth > 8) {
    return null;
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    /*
     * لا نخزن الصور Base64 داخل localStorage.
     */
    if (
      value.startsWith("data:image/") ||
      value.startsWith("blob:")
    ) {
      return "";
    }

    /*
     * منع تخزين Base64 طويل جدًا.
     */
    if (value.length > 500000) {
      return "";
    }

    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      cleanObjectForStorage(item, depth + 1)
    );
  }

  if (typeof value === "object") {
    const result: Record<string, any> = {};

    Object.keys(value).forEach((key) => {
      const lower = key.toLowerCase();

      /*
       * تجاهل البيانات الكبيرة المتعلقة بالصور.
       */
      if (
        lower === "image_data" ||
        lower === "imagedata" ||
        lower === "base64" ||
        lower === "preview" ||
        lower === "blob"
      ) {
        return;
      }

      result[key] = cleanObjectForStorage(
        value[key],
        depth + 1
      );
    });

    return result;
  }

  return String(value);
}

function cleanArrayForStorage(data: any): any[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item) =>
    cleanObjectForStorage(item)
  );
}

/* ============================================================
   CONTEXT
   ============================================================ */

const GoogleSheetsContext =
  createContext<GoogleSheetsContextType | undefined>(
    undefined
  );

/* ============================================================
   PROVIDER
   ============================================================ */

export const GoogleSheetsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [config, setConfig] =
    useState<GoogleSheetsConfig>(() => {
      try {
        const saved =
          safeGetLocalStorage(CONFIG_KEY);

        if (saved) {
          const parsed = JSON.parse(saved);

          return {
            ...DEFAULT_CONFIG,
            ...parsed,
          };
        }
      } catch {
        // ignore
      }

      return DEFAULT_CONFIG;
    });

  const [isSyncing, setIsSyncing] =
    useState(false);

  const [lastSync, setLastSync] =
    useState<string | null>(null);

  const [syncError, setSyncError] =
    useState<string | null>(null);

  const syncingRef = useRef(false);

  /* ==========================================================
     SAVE CONFIG
     ========================================================== */

  useEffect(() => {
    safeSetLocalStorage(
      CONFIG_KEY,
      JSON.stringify(config)
    );
  }, [config]);

  /* ==========================================================
     READ PRODUCTS CACHE
     ========================================================== */

  const readProducts = useCallback(() => {
    try {
      const raw =
        safeGetLocalStorage(
          "elites_store_products"
        );

      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  }, []);

  /* ==========================================================
     READ TABLE FROM LOCAL STORAGE
     ========================================================== */

  const readTable = useCallback(
    (key: string) => {
      try {
        const raw =
          safeGetLocalStorage(key);

        if (!raw) {
          return [];
        }

        const parsed = JSON.parse(raw);

        return Array.isArray(parsed)
          ? parsed
          : [];
      } catch {
        return [];
      }
    },
    []
  );

  /* ==========================================================
     SYNC NOW
     ========================================================== */

  const syncNow =
    useCallback(async (): Promise<boolean> => {
      if (syncingRef.current) {
        return false;
      }

      if (!config.webhookUrl) {
        setSyncError(
          "رابط Google Apps Script غير موجود"
        );

        return false;
      }

      syncingRef.current = true;
      setIsSyncing(true);
      setSyncError(null);

      try {
        const tables = {
          Products: readProducts(),

          Categories:
            readTable(
              "elites_categories"
            ),

          Suppliers:
            readTable(
              "elites_suppliers"
            ),

          Customers:
            readTable(
              "elites_customers"
            ),

          Orders:
            readTable(
              "elites_orders"
            ),

          Order_Items:
            readTable(
              "elites_order_items"
            ),

          Users:
            readTable(
              "elites_users"
            ),

          Reviews:
            readTable(
              "elites_reviews"
            ),

          Wishlists:
            readTable(
              "elites_wishlists"
            ),

          Notifications:
            readTable(
              "elites_notifications"
            ),

          Inventory_Movements:
            readTable(
              "elites_inventory_movements"
            ),

          Price_History:
            readTable(
              "elites_price_history"
            ),

          Accounting_Entries:
            readTable(
              "elites_accounting_entries"
            ),

          Payments:
            readTable(
              "elites_payments"
            ),

          Expenses:
            readTable(
              "elites_expenses"
            ),

          Returns:
            readTable(
              "elites_returns"
            ),

          Coupons:
            readTable(
              "elites_coupons"
            ),

          Shipping:
            readTable(
              "elites_shipping"
            ),

          Product_Images:
            readTable(
              "elites_product_images"
            ),

          Media_Library:
            readTable(
              "elites_media_library"
            ),

          Settings:
            readTable(
              "elites_settings"
            ),

          Wishlist_Items:
            readTable(
              "elites_wishlist_items"
            ),
        };

        /*
         * تنظيف البيانات قبل إرسالها.
         */
        const cleanedTables: Record<
          string,
          any[]
        > = {};

        Object.keys(tables).forEach(
          (tableName) => {
            cleanedTables[tableName] =
              cleanArrayForStorage(
                tables[
                  tableName as keyof typeof tables
                ]
              );
          }
        );

        const payload = {
          action: "sync_all_tables",

          timestamp:
            new Date().toISOString(),

          tables: cleanedTables,
        };

        /*
         * مزامنة البيانات.
         *
         * نستخدم no-cors هنا لأننا لا نحتاج
         * إلى قراءة محتوى الاستجابة.
         */
        await fetch(config.webhookUrl, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        });

        const now =
          new Date().toISOString();

        setLastSync(now);

        safeSetLocalStorage(
          "elites_last_sync",
          now
        );

        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : String(error);

        console.error(
          "Google Sheets sync error:",
          error
        );

        setSyncError(message);

        return false;
      } finally {
        syncingRef.current = false;
        setIsSyncing(false);
      }
    }, [
      config.webhookUrl,
      readProducts,
      readTable,
    ]);

  /* ==========================================================
     CREATE PRODUCT FOLDER
     ========================================================== */

  const createProductFolder =
    useCallback(
      async (
        productName: string,
        sku: string
      ): Promise<CreateProductFolderResult> => {
        try {
          if (!config.webhookUrl) {
            return {
              success: false,
              error:
                "رابط Google Apps Script غير موجود",
            };
          }

          if (
            !productName &&
            !sku
          ) {
            return {
              success: false,
              error:
                "اسم المنتج أو SKU مطلوب",
            };
          }

          const payload = {
            action:
              "create_product_folder",

            productName:
              productName || "",

            sku:
              sku || "",
          };

          const response =
            await fetch(
              config.webhookUrl,
              {
                method: "POST",

                /*
                 * text/plain يقلل مشاكل
                 * CORS / preflight مع Apps Script.
                 *
                 * Apps Script سيقرأ JSON من
                 * e.postData.contents.
                 */
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
            console.error(
              "Invalid Apps Script response:",
              text
            );

            throw new Error(
              "استجابة Google Apps Script ليست JSON صحيحة."
            );
          }

          console.log(
            "Create product folder response:",
            result
          );

          if (
            result.status !==
            "success"
          ) {
            return {
              success: false,
              error:
                result.message ||
                result.error ||
                "فشل إنشاء مجلد المنتج",
            };
          }

          if (
            !result.folderId
          ) {
            return {
              success: false,
              error:
                "تم إنشاء الطلب لكن لم يُرجع Google Drive معرف المجلد الحقيقي.",
            };
          }

          return {
            success: true,

            folderId:
              result.folderId,

            folderName:
              result.folderName,

            folderUrl:
              result.folderUrl,
          };
        } catch (error) {
          console.error(
            "createProductFolder error:",
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

  /* ==========================================================
     UPLOAD IMAGE TO DRIVE
     ========================================================== */

  const uploadImageToDrive =
    useCallback(
      async (
        base64Data: string,
        fileName: string,
        mimeType = "image/jpeg",
        targetType = "product",
        folderId?: string
      ): Promise<UploadImageResult> => {
        try {
          if (!config.webhookUrl) {
            return {
              success: false,
              error:
                "رابط Google Apps Script غير موجود",
            };
          }

          if (!base64Data) {
            return {
              success: false,
              error:
                "بيانات الصورة فارغة",
            };
          }

          /*
           * التأكد من أن البيانات فعلًا
           * صورة Base64.
           */
          if (
            !base64Data.startsWith(
              "data:image/"
            )
          ) {
            return {
              success: false,
              error:
                "بيانات الصورة ليست Data URL صالحة.",
            };
          }

          const payload: Record<
            string,
            any
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

          /*
           * مجلد المنتج الحقيقي.
           */
          if (folderId) {
            payload.folderId =
              folderId;
          }

          console.log(
            "Uploading image to Google Drive...",
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
                method: "POST",

                /*
                 * مهم مع Google Apps Script.
                 */
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
              "Google Apps Script أعاد استجابة فارغة أثناء رفع الصورة."
            );
          }

          let result: any;

          try {
            result =
              JSON.parse(text);
          } catch {
            console.error(
              "Invalid Apps Script upload response:",
              text
            );

            throw new Error(
              "استجابة Google Apps Script أثناء رفع الصورة ليست JSON صحيحة."
            );
          }

          console.log(
            "Upload image response:",
            result
          );

          if (
            result.status !==
            "success"
          ) {
            return {
              success: false,

              error:
                result.message ||
                result.error ||
                "فشل رفع الصورة إلى Google Drive",
            };
          }

          /*
           * يجب أن يكون هذا ID حقيقيًا
           * صادرًا من DriveApp.
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

          /*
           * لا نسمح إطلاقًا بمتابعة العملية
           * بدون fileId حقيقي.
           */
          if (!fileId) {
            console.error(
              "Upload response contains no real fileId:",
              result
            );

            return {
              success: false,

              error:
                "تمت معالجة طلب رفع الصورة، لكن Google Drive لم يُرجع fileId حقيقيًا.",
            };
          }

          /*
           * الرابط المباشر للصورة.
           */
          const directUrl =
            result.directUrl ||
            formatGoogleDriveDirectUrl(
              fileId
            );

          /*
           * رابط العرض.
           */
          const viewUrl =
            result.viewUrl ||
            `https://drive.google.com/uc?export=view&id=${fileId}`;

          /*
           * رابط ملف Drive.
           */
          const driveUrl =
            result.driveUrl ||
            `https://drive.google.com/file/d/${fileId}/view`;

          /*
           * Preview مؤقت فقط في sessionStorage.
           *
           * لا نضع Base64 في localStorage.
           */
          try {
            cacheDriveImagePreview(
              fileId,
              base64Data
            );
          } catch (cacheError) {
            console.warn(
              "Could not cache image preview:",
              cacheError
            );
          }

          console.log(
            "Google Drive upload successful:",
            {
              fileId,
              fileName:
                result.fileName ||
                fileName,
              folderId:
                result.folderId ||
                folderId,
              directUrl,
            }
          );

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
          };
        } catch (error) {
          console.error(
            "uploadImageToDrive error:",
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

  /* ==========================================================
     FETCH FOLDER IMAGES
     ========================================================== */

  const fetchFolderImages =
    useCallback(
      async (
        folderId: string
      ): Promise<any[]> => {
        try {
          if (!folderId) {
            return [];
          }

          const response =
            await fetch(
              config.webhookUrl,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  action:
                    "fetch_folder_images",

                  folderId,
                }),
              }
            );

          if (!response.ok) {
            throw new Error(
              `HTTP ${response.status}`
            );
          }

          const result =
            await response.json();

          if (
            result.status !==
            "success"
          ) {
            console.error(
              "fetchFolderImages failed:",
              result
            );

            return [];
          }

          return Array.isArray(
            result.files
          )
            ? result.files
            : [];
        } catch (error) {
          console.error(
            "fetchFolderImages error:",
            error
          );

          return [];
        }
      },
      [config.webhookUrl]
    );

  /* ==========================================================
     PULL FROM SHEETS
     ========================================================== */

  const pullFromSheets =
    useCallback(async (): Promise<boolean> => {
      /*
       * Apps Script الحالي لا يحتوي على
       * get_all_tables.
       *
       * لذلك لا نقوم بعمل طلب وهمي.
       *
       * يمكن إضافة هذا لاحقًا عندما نجهز
       * endpoint للقراءة من Sheets.
       */

      console.warn(
        "pullFromSheets: get_all_tables غير مفعّل في Apps Script الحالي."
      );

      return false;
    }, []);

  /* ==========================================================
     TRIGGER SYNC
     ========================================================== */

  const triggerSync =
    useCallback(() => {
      window.dispatchEvent(
        new CustomEvent(
          "elites_trigger_sync"
        )
      );
    }, []);

  /* ==========================================================
     LOAD LAST SYNC
     ========================================================== */

  useEffect(() => {
    const saved =
      safeGetLocalStorage(
        "elites_last_sync"
      );

    if (saved) {
      setLastSync(saved);
    }
  }, []);

  /* ==========================================================
     PRODUCT CHANGE LISTENER
     ========================================================== */

  useEffect(() => {
    if (!config.autoSync) {
      return;
    }

    let timer:
      | ReturnType<typeof setTimeout>
      | null = null;

    const handleProductChanged =
      () => {
        if (timer) {
          clearTimeout(timer);
        }

        /*
         * Debounce:
         * إذا تغير أكثر من شيء بسرعة،
         * نرسل مزامنة واحدة بدل عدة طلبات.
         */
        timer = setTimeout(() => {
          syncNow();
        }, 800);
      };

    window.addEventListener(
      "elites_product_changed",
      handleProductChanged
    );

    return () => {
      if (timer) {
        clearTimeout(timer);
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

  /* ==========================================================
     EXTERNAL SYNC TRIGGER
     ========================================================== */

  useEffect(() => {
    const handleTrigger =
      () => {
        syncNow();
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
  }, [syncNow]);

  /* ==========================================================
     CONTEXT VALUE
     ========================================================== */

  const value: GoogleSheetsContextType =
    {
      config,

      setConfig,

      isSyncing,

      lastSync,

      syncError,

      syncNow,

      pullFromSheets,

      createProductFolder,

      uploadImageToDrive,

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

  if (!context) {
    throw new Error(
      "useGoogleSheets must be used inside GoogleSheetsProvider"
    );
  }

  return context;
}

export default GoogleSheetsContext;