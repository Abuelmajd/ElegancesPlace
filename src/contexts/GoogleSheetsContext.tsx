import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';

import {
  extractGoogleDriveId,
  formatGoogleDriveDirectUrl,
  generateDriveFileId,
  cacheDriveImagePreview
} from '../utils/googleDriveUtils';


/**
 * ============================================================
 * Types
 * ============================================================
 */

interface GoogleSheetsConfig {
  sheetId: string;
  webhookUrl: string;
  folderId: string;
  categoriesFolderId: string;
  autoSync: boolean;
  syncStatus?: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'FAILED' | 'idle' | 'syncing' | 'success' | 'failed' | string;
  isConnected?: boolean;
  lastSyncedAt?: string;
}


interface GoogleSheetsContextType {

  config: GoogleSheetsConfig;

  setConfig: (
    config: Partial<GoogleSheetsConfig>
  ) => void;

  updateConfig: (
    config: Partial<GoogleSheetsConfig>
  ) => void;

  syncNow: () => Promise<boolean>;

  pullFromSheets: () => Promise<boolean>;

  isSyncing: boolean;

  lastSync: string | null;

  syncError: string | null;

  logs: any[];

  uploadImageToDrive: (
    base64Data: string,
    fileName: string,
    mimeType?: string,
    targetType?: 'products' | 'categories'
  ) => Promise<{
    success: boolean;
    url?: string;
    directUrl?: string;
    driveUrl?: string;
    fileId?: string;
    isLiveDrive?: boolean;
    direct_url?: string;
    file_id?: string;
    error?: string;
  }>;

  createProductFolder: (
    productName: string,
    sku: string
  ) => Promise<{
    success: boolean;
    folderId?: string;
    folderUrl?: string;
    error?: string;
  }>;

  fetchFolderImages: (
    folderId: string
  ) => Promise<{
    success: boolean;
    files?: any[];
    error?: string;
  }>;

}


const GoogleSheetsContext =
  createContext<
    GoogleSheetsContextType | undefined
  >(undefined);


/**
 * ============================================================
 * Default Configuration
 * ============================================================
 */

const DEFAULT_CONFIG:
  GoogleSheetsConfig = {

  sheetId:
    '1MtmMwC9bBrEgX-y2wqltuvwmIsPIt0vUdi0L03JesRU',

  webhookUrl:
    'https://script.google.com/macros/s/AKfycbw2bDPslbyuoZ-bhC2pIgLPJZglO2mum2IkSWl1hqYiwjwPCkvDeY4qUqLKpjX_tXqtEQ/exec',

  folderId:
    '1JfMshA_FjBRifRRqci0E-jZaoLhESWNl',

  categoriesFolderId:
    '1JfMshA_FjBRifRRqci0E-jZaoLhESWNl',

  autoSync: true

};


/**
 * ============================================================
 * LocalStorage Helpers
 * ============================================================
 */


/**
 * قراءة JSON بأمان.
 */
function safeGetJSON<T>(
  key: string,
  fallback: T
): T {

  if (
    typeof window === 'undefined'
  ) {

    return fallback;

  }


  try {

    const value =
      localStorage.getItem(key);


    if (!value) {

      return fallback;

    }


    return JSON.parse(value) as T;

  } catch (error) {

    console.warn(
      `تعذر قراءة ${key} من localStorage`,
      error
    );

    return fallback;

  }

}


/**
 * كتابة JSON بأمان.
 */
function safeSetJSON(
  key: string,
  value: unknown
): boolean {

  if (
    typeof window === 'undefined'
  ) {

    return false;

  }


  try {

    localStorage.setItem(
      key,
      JSON.stringify(value)
    );


    return true;

  } catch (error) {

    console.warn(
      `تعذر حفظ ${key} في localStorage`,
      error
    );


    return false;

  }

}


/**
 * حذف مفتاح بأمان.
 */
function safeRemove(
  key: string
): void {

  if (
    typeof window === 'undefined'
  ) {

    return;

  }


  try {

    localStorage.removeItem(
      key
    );

  } catch {
    // تجاهل الخطأ
  }

}


/**
 * ============================================================
 * تنظيف البيانات الثقيلة قبل التخزين
 * ============================================================
 */

function cleanObjectForStorage(
  value: any
): any {

  if (
    !value ||
    typeof value !== 'object'
  ) {

    return value;

  }


  const clean = {
    ...value
  };


  /*
   * حذف بيانات Base64 الثقيلة.
   */
  delete clean.image_data;

  delete clean.base64;

  delete clean.data;

  delete clean.preview;

  delete clean.blob;


  /*
   * إذا كان image عبارة عن Base64،
   * نحذفه من التخزين المحلي.
   */
  if (
    typeof clean.image === 'string' &&
    clean.image.startsWith('data:')
  ) {

    clean.image = '';

  }


  /*
   * إذا كان image_url عبارة عن Base64،
   * نحذفه كذلك.
   */
  if (
    typeof clean.image_url === 'string' &&
    clean.image_url.startsWith('data:')
  ) {

    clean.image_url = '';

  }


  /*
   * تنظيف مصفوفة الصور.
   */
  if (
    Array.isArray(clean.images)
  ) {

    clean.images =
      clean.images.map(
        (item: any) =>
          cleanObjectForStorage(item)
      );

  }


  return clean;
}


/**
 * تنظيف مصفوفة.
 */
function cleanArrayForStorage(
  value: any[]
): any[] {

  if (
    !Array.isArray(value)
  ) {

    return [];

  }


  return value.map(
    item =>
      cleanObjectForStorage(item)
  );

}


/**
 * ============================================================
 * قراءة المنتجات
 * ============================================================
 *
 * مهم:
 * نقرأ من:
 *
 * elites_store_products
 *
 * فقط.
 *
 * لا نستخدم elites_products.
 * ============================================================
 */

function readProducts(): any[] {

  const products =
    safeGetJSON<any[]>(
      'elites_store_products',
      []
    );


  return Array.isArray(products)
    ? products
    : [];

}


/**
 * ============================================================
 * Provider
 * ============================================================
 */

export const GoogleSheetsProvider:
  React.FC<{
    children: React.ReactNode;
  }> = ({
    children
  }) => {

    /**
     * --------------------------------------------------------
     * Config
     * --------------------------------------------------------
     */

    const [
      config,
      setConfigState
    ] = useState<GoogleSheetsConfig>(
      () =>
        safeGetJSON<GoogleSheetsConfig>(
          'elites_google_sheets_config',
          DEFAULT_CONFIG
        )
    );


    /**
     * --------------------------------------------------------
     * Sync State
     * --------------------------------------------------------
     */

    const [
      isSyncing,
      setIsSyncing
    ] = useState(false);


    const [
      lastSync,
      setLastSync
    ] = useState<string | null>(
      () =>
        safeGetJSON<string | null>(
          'elites_last_sync',
          null
        )
    );


    const [
      syncError,
      setSyncError
    ] = useState<string | null>(
      null
    );


    /**
     * --------------------------------------------------------
     * Logs
     * --------------------------------------------------------
     */

    const [logs, setLogs] = useState<any[]>(() => {
      return safeGetJSON<any[]>('elites_sheets_logs', [
        {
          id: '1',
          type: 'info',
          timestamp: new Date().toLocaleString('ar-EG'),
          message: 'تم تهيئة نظام المزامنة والربط السحابي لمتجر النخبة بنجاح.'
        }
      ]);
    });

    const addLog = useCallback((type: 'success' | 'error' | 'info', message: string) => {
      const newLog = {
        id: String(Date.now()) + '_' + Math.random().toString(36).substring(2, 6),
        type,
        timestamp: new Date().toLocaleString('ar-EG'),
        message
      };
      setLogs(prev => {
        const updated = [newLog, ...prev].slice(0, 50);
        safeSetJSON('elites_sheets_logs', updated);
        return updated;
      });
    }, []);


    /**
     * --------------------------------------------------------
     * حفظ الإعدادات
     * --------------------------------------------------------
     */

    const setConfig = useCallback(
      (
        newConfig:
          Partial<GoogleSheetsConfig>
      ) => {

        setConfigState(
          current => {

            const updated = {

              ...current,

              ...newConfig

            };


            safeSetJSON(
              'elites_google_sheets_config',
              updated
            );


            return updated;

          }
        );

      },
      []
    );

    const updateConfig = useCallback((newConfig: Partial<GoogleSheetsConfig>) => {
      setConfig(newConfig);
    }, [setConfig]);


    /**
     * ========================================================
     * Sync Now
     * ========================================================
     */

    const syncNow =
      useCallback(
        async (): Promise<boolean> => {

          if (
            !config.webhookUrl
          ) {

            setSyncError(
              'رابط Google Apps Script غير موجود.'
            );


            return false;

          }


          if (
            isSyncing
          ) {

            return false;

          }


          setIsSyncing(
            true
          );

          addLog('info', 'بدء عملية مزامنة البيانات ودفعها سحابياً إلى Google Sheets...');

          setSyncError(
            null
          );


          try {

            /**
             * ------------------------------------------------
             * Products
             * ------------------------------------------------
             */

            const rawProducts =
              readProducts();


            const products =
              rawProducts.map(
                (
                  product: any,
                  index: number
                ) => {

                  const driveId =
                    product.drive_file_id ||
                    extractGoogleDriveId(
                      product.image || ''
                    ) ||
                    '';


                  let imageUrl =
                    '';


                  /*
                   * إذا كانت الصورة من Google Drive.
                   */
                  if (
                    driveId
                  ) {

                    imageUrl =
                      formatGoogleDriveDirectUrl(
                        driveId
                      );

                  }

                  /*
                   * إذا كانت الصورة رابطًا خارجيًا.
                   */
                  else if (
                    typeof product.image === 'string' &&
                    (
                      product.image.startsWith(
                        'https://'
                      ) ||
                      product.image.startsWith(
                        'http://'
                      )
                    )
                  ) {

                    imageUrl =
                      product.image;

                  }


                  return {

                    product_id:
                      product.product_id ||
                      product.id ||
                      `product_${index + 1}`,

                    sku:
                      product.sku ||
                      `SKU-${index + 1}`,

                    name:
                      product.name ||
                      '',

                    category:
                      product.category ||
                      '',

                    category_id:
                      product.category_id ||
                      '',

                    supplier:
                      product.supplier ||
                      '',

                    supplier_id:
                      product.supplier_id ||
                      '',

                    cost_price:
                      Number(
                        product.cost_price ??
                        product.costPrice ??
                        0
                      ),

                    selling_price:
                      Number(
                        product.price ??
                        0
                      ),

                    old_price:
                      Number(
                        product.oldPrice ??
                        product.originalPrice ??
                        0
                      ),

                    stock:
                      Number(
                        product.stock ??
                        0
                      ),

                    fulfillment_method:
                      product.fulfillment_method ||
                      'OWN_STOCK',

                    image_url:
                      imageUrl,

                    drive_file_id:
                      driveId,

                    description:
                      product.description ||
                      '',

                    rating:
                      Number(
                        product.rating ??
                        0
                      ),

                    featured:
                      Boolean(
                        product.featured
                      ),

                    best_seller:
                      Boolean(
                        product.bestSeller
                      ),

                    new_product:
                      Boolean(
                        product.newProduct
                      )

                  };

                }
              );


            /**
             * ------------------------------------------------
             * باقي الجداول
             * ------------------------------------------------
             */

            const categories =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_categories',
                  []
                )
              );


            const suppliers =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_suppliers',
                  []
                )
              );


            const customers =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_customers',
                  []
                )
              );


            const orders =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_orders',
                  []
                )
              );


            const orderItems =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_order_items',
                  []
                )
              );


            const users =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_users',
                  []
                )
              );


            const reviews =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_reviews',
                  []
                )
              );


            const wishlists =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_wishlists',
                  []
                )
              );


            const notifications =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_notifications',
                  []
                )
              );


            const inventoryMovements =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_inventory_movements',
                  []
                )
              );


            const priceHistory =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_price_history',
                  []
                )
              );


            const accountingEntries =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_accounting_entries',
                  []
                )
              );


            const payments =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_payments',
                  []
                )
              );


            const expenses =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_expenses',
                  []
                )
              );


            const returns =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_returns',
                  []
                )
              );


            const coupons =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_coupons',
                  []
                )
              );


            const shipping =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_shipping',
                  []
                )
              );


            const productImages =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_product_images',
                  []
                )
              );


            const mediaLibrary =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_media_library',
                  []
                )
              );


            const settings =
              cleanObjectForStorage(
                safeGetJSON<Record<string, any>>(
                  'elites_settings',
                  {}
                )
              );


            const wishlistsData =
              cleanArrayForStorage(
                safeGetJSON<any[]>(
                  'elites_wishlist_items',
                  []
                )
              );


            /**
             * ------------------------------------------------
             * Payload
             * ------------------------------------------------
             */

            const payload = {

              action:
                'sync_all_tables',

              timestamp:
                new Date().toISOString(),

              tables: {

                Products:
                  products,

                Categories:
                  categories,

                Suppliers:
                  suppliers,

                Customers:
                  customers,

                Orders:
                  orders,

                Order_Items:
                  orderItems,

                Users:
                  users,

                Reviews:
                  reviews,

                Wishlists:
                  wishlists,

                Notifications:
                  notifications,

                Inventory_Movements:
                  inventoryMovements,

                Price_History:
                  priceHistory,

                Accounting_Entries:
                  accountingEntries,

                Payments:
                  payments,

                Expenses:
                  expenses,

                Returns:
                  returns,

                Coupons:
                  coupons,

                Shipping:
                  shipping,

                Product_Images:
                  productImages,

                Media_Library:
                  mediaLibrary,

                Settings:
                  settings,

                Wishlist_Items:
                  wishlistsData

              }

            };


            /**
             * ------------------------------------------------
             * إرسال البيانات إلى Apps Script
             * ------------------------------------------------
             *
             * نستخدم no-cors كما كان في النظام السابق
             * لتجنب مشكلة CORS مع Google Apps Script.
             */

            await fetch(
              config.webhookUrl,
              {

                method: 'POST',

                mode: 'no-cors',

                headers: {

                  'Content-Type':
                    'application/json'

                },

                body:
                  JSON.stringify(
                    payload
                  )

              }
            );


            /**
             * ------------------------------------------------
             * نجاح المزامنة
             * ------------------------------------------------
             */

            const timestamp =
              new Date().toISOString();


            setLastSync(
              timestamp
            );


            safeSetJSON(
              'elites_last_sync',
              timestamp
            );


            /*
             * إزالة المفتاح القديم.
             */
            safeRemove(
              'elites_products'
            );


            setSyncError(
              null
            );

            addLog('success', 'تمت مزامنة كافة جداول المتجر بنجاح مع Google Sheets!');

            return true;

          } catch (error) {

            console.error(
              'Sync error:',
              error
            );


            const message =
              error instanceof Error
                ? error.message
                : String(error);


            setSyncError(
              message
            );

            addLog('error', `عطل أثناء المزامنة: ${message}`);

            return false;

          } finally {

            setIsSyncing(
              false
            );

          }

        },
        [
          config.webhookUrl,
          isSyncing,
          addLog
        ]
      );


    /**
     * ========================================================
     * Pull From Sheets
     * ========================================================
     */

    const pullFromSheets =
      useCallback(
        async (): Promise<boolean> => {

          if (
            !config.webhookUrl
          ) {

            setSyncError(
              'رابط Google Apps Script غير موجود.'
            );


            return false;

          }


          try {

            /*
             * ملاحظة:
             *
             * Google Apps Script الحالي يستخدم doPost فقط
             * للمزامنة والرفع.
             *
             * لذلك نحاول طلب البيانات إذا كان
             * الـ endpoint يدعم action pull.
             */

            const response =
              await fetch(
                config.webhookUrl,
                {

                  method: 'POST',

                  headers: {

                    'Content-Type':
                      'application/json'

                  },

                  body:
                    JSON.stringify({

                      action:
                        'get_all_tables'

                    })

                }
              );


            if (
              !response.ok
            ) {

              throw new Error(
                `HTTP ${response.status}`
              );

            }


            const data =
              await response.json();


            if (
              !data ||
              !data.tables
            ) {

              throw new Error(
                'لم يتم استلام بيانات الجداول.'
              );

            }


            /**
             * ------------------------------------------------
             * حفظ Products
             * ------------------------------------------------
             */

            if (
              Array.isArray(
                data.tables.Products
              )
            ) {

              const products =
                cleanArrayForStorage(
                  data.tables.Products
                );


              const saved =
                safeSetJSON(
                  'elites_store_products',
                  products
                );


              if (!saved) {

                throw new Error(
                  'تعذر حفظ المنتجات في التخزين المحلي.'
                );

              }


              safeRemove(
                'elites_products'
              );

            }


            /**
             * ------------------------------------------------
             * باقي الجداول
             * ------------------------------------------------
             */

            const tableMap:
              Record<string, string> = {

              Categories:
                'elites_categories',

              Suppliers:
                'elites_suppliers',

              Customers:
                'elites_customers',

              Orders:
                'elites_orders',

              Order_Items:
                'elites_order_items',

              Users:
                'elites_users',

              Reviews:
                'elites_reviews',

              Wishlists:
                'elites_wishlists',

              Notifications:
                'elites_notifications',

              Inventory_Movements:
                'elites_inventory_movements',

              Price_History:
                'elites_price_history',

              Accounting_Entries:
                'elites_accounting_entries',

              Payments:
                'elites_payments',

              Expenses:
                'elites_expenses',

              Returns:
                'elites_returns',

              Coupons:
                'elites_coupons',

              Shipping:
                'elites_shipping',

              Product_Images:
                'elites_product_images',

              Media_Library:
                'elites_media_library',

              Settings:
                'elites_settings',

              Wishlist_Items:
                'elites_wishlist_items'

            };


            for (
              const tableName in tableMap
            ) {

              const localStorageKey =
                tableMap[tableName];


              const tableData =
                data.tables[
                  tableName
                ];


              if (
                tableData === undefined
              ) {

                continue;

              }


              if (
                Array.isArray(
                  tableData
                )
              ) {

                safeSetJSON(
                  localStorageKey,
                  cleanArrayForStorage(
                    tableData
                  )
                );

              } else {

                safeSetJSON(
                  localStorageKey,
                  cleanObjectForStorage(
                    tableData
                  )
                );

              }

            }


            const timestamp =
              new Date().toISOString();


            setLastSync(
              timestamp
            );


            safeSetJSON(
              'elites_last_sync',
              timestamp
            );


            setSyncError(
              null
            );


            /*
             * إرسال حدث لتحديث الواجهات التي تعتمد
             * على المنتجات.
             */
            try {

              window.dispatchEvent(
                new CustomEvent(
                  'elites_products_pulled'
                )
              );

            } catch {
              // تجاهل الخطأ
            }


            return true;

          } catch (error) {

            console.error(
              'Pull error:',
              error
            );


            const message =
              error instanceof Error
                ? error.message
                : String(error);


            setSyncError(
              message
            );


            return false;

          }

        },
        [
          config.webhookUrl
        ]
      );


    /**
     * ========================================================
     * Upload Image To Google Drive
     * ========================================================
     */

    const uploadImageToDrive =
      useCallback(
        async (
          base64Data: string,
          fileName: string,
          mimeType: string
        ) => {

          if (
            !config.webhookUrl
          ) {

            return {

              success: false,

              error:
                'رابط Google Apps Script غير موجود.'

            };

          }


          if (
            !base64Data
          ) {

            return {

              success: false,

              error:
                'بيانات الصورة غير موجودة.'

            };

          }


          try {

            const response =
              await fetch(
                config.webhookUrl,
                {

                  method: 'POST',

                  mode: 'cors',

                  headers: {

                    'Content-Type':
                      'application/json'

                  },

                  body:
                    JSON.stringify({

                      action:
                        'upload_image_to_drive',

                      base64Data,

                      fileName,

                      mimeType

                    })

                }
              );


            /*
             * محاولة قراءة الاستجابة.
             */
            let result: any = null;


            try {

              result =
                await response.json();

            } catch {

              /*
               * إذا تعذر قراءة JSON،
               * نستخدم fallback.
               */

              result = null;

            }


            if (
              result &&
              result.status === 'success'
            ) {

              const fileId =
                result.fileId ||
                extractGoogleDriveId(
                  result.directUrl ||
                  result.url ||
                  ''
                ) ||
                '';


              const directUrl =
                result.directUrl ||
                (
                  fileId
                    ? formatGoogleDriveDirectUrl(
                        fileId
                      )
                    : result.url ||
                      ''
                );


              /*
               * تخزين Preview في SessionStorage فقط.
               */
              if (
                directUrl
              ) {

                cacheDriveImagePreview(
                  directUrl,
                  base64Data
                );

              }


              return {

                success: true,

                url:
                  result.url ||
                  result.driveUrl ||
                  directUrl,

                directUrl,

                fileId,

                isLiveDrive: true,

                direct_url: directUrl,

                file_id: fileId

              };

            }


            /*
             * إذا أعاد Apps Script خطأ.
             */
            if (
              result &&
              result.status === 'error'
            ) {

              return {

                success: false,

                error:
                  result.error ||
                  result.message ||
                  'فشل رفع الصورة.'

              };

            }


            /*
             * لم نحصل على استجابة مفهومة.
             *
             * لا نعتبر العملية ناجحة.
             */
            return {

              success: false,

              error:
                'لم يتم استلام استجابة صحيحة من Google Apps Script.'

            };

          } catch (error) {

            console.error(
              'Upload image error:',
              error
            );


            const message =
              error instanceof Error
                ? error.message
                : String(error);


            return {

              success: false,

              error: message

            };

          }

        },
        [
          config.webhookUrl
        ]
      );


    /**
     * ========================================================
     * Create Product Folder
     * ========================================================
     *
     * ملاحظة:
     * Apps Script الحالي لا يحتوي action
     * باسم create_product_folder.
     *
     * لذلك لا نرسل طلبًا غير مدعوم.
     *
     * يتم إنشاء معرف محلي مؤقت فقط إذا احتاج
     * النظام إلى معرف مجلد.
     * ========================================================
     */

    const createProductFolder =
      useCallback(
        async (
          productName: string,
          sku: string
        ) => {

          try {

            if (
              !productName &&
              !sku
            ) {

              return {

                success: false,

                error:
                  'اسم المنتج أو SKU مطلوب.'

              };

            }


            /*
             * إنشاء معرف مؤقت.
             *
             * لا يعني هذا أنه Folder ID حقيقي في Drive.
             */
            const folderId =
              generateDriveFileId(
                'folder'
              );


            const folderPath =
              `Products/${sku || productName}`;


            const folderRecord = {

              folderId,

              folderPath,

              productName:

                productName || '',

              sku:

                sku || '',

              createdAt:
                new Date().toISOString()

            };


            const existing =
              safeGetJSON<any[]>(
                'elites_product_folders',
                []
              );


            const records =
              Array.isArray(existing)
                ? existing
                : [];


            records.push(
              folderRecord
            );


            safeSetJSON(
              'elites_product_folders',
              records
            );


            return {

              success: true,

              folderId,

              folderUrl:
                `https://drive.google.com/drive/folders/${config.folderId}`

            };

          } catch (error) {

            console.error(
              'Create product folder error:',
              error
            );


            return {

              success: false,

              error:
                error instanceof Error
                  ? error.message
                  : String(error)

            };

          }

        },
        [
          config.folderId
        ]
      );


    /**
     * ========================================================
     * fetchFolderImages
     * ========================================================
     */

    const fetchFolderImages = useCallback(async (folderId: string) => {
      if (!config.webhookUrl) {
        return { success: false, error: 'رابط Google Apps Script غير موجود.' };
      }
      try {
        addLog('info', `جاري جلب الصور من مجلد Drive: ${folderId}...`);
        const response = await fetch(config.webhookUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'fetch_folder_images',
            folderId
          })
        });
        const result = await response.json();
        if (result && result.status === 'success') {
          addLog('success', `تم جلب الصور بنجاح من المجلد (${folderId}).`);
          return { success: true, files: result.files || [] };
        }
        addLog('error', `فشل جلب الصور: ${result.error || 'خطأ غير معروف'}`);
        return { success: false, error: result.error || 'فشل جلب ملفات المجلد.' };
      } catch (error) {
        console.error('Fetch folder images error:', error);
        const errMessage = error instanceof Error ? error.message : String(error);
        addLog('error', `فشل جلب الصور بسبب عطل في الاتصال: ${errMessage}`);
        return { success: false, error: errMessage };
      }
    }, [config.webhookUrl, addLog]);


    /**
     * ========================================================
     * Auto Sync
     * ========================================================
     */

    useEffect(() => {

      if (
        !config.autoSync
      ) {

        return;

      }


      const handleProductChange =
        () => {

          /*
           * تشغيل المزامنة بعد انتهاء تحديث state/cache.
           */
          window.setTimeout(
            () => {

              syncNow()
                .catch(
                  error => {

                    console.error(
                      'Auto sync error:',
                      error
                    );

                  }
                );

            },
            100
          );

        };


      window.addEventListener(
        'elites_product_changed',
        handleProductChange
      );


      return () => {

        window.removeEventListener(
          'elites_product_changed',
          handleProductChange
        );

      };

    }, [
      config.autoSync,
      syncNow
    ]);


    /**
     * ========================================================
     * الاستماع لطلب مزامنة عام
     * ========================================================
     */

    useEffect(() => {

      const handleSyncRequest =
        () => {

          syncNow()
            .catch(
              error => {

                console.error(
                  'Sync request error:',
                  error
                );

              }
            );

        };


      window.addEventListener(
        'elites_trigger_sync',
        handleSyncRequest
      );


      return () => {

        window.removeEventListener(
          'elites_trigger_sync',
          handleSyncRequest
        );

      };

    }, [
      syncNow
    ]);


    /**
     * ========================================================
     * حفظ الإعدادات عند أول تشغيل
     * ========================================================
     */

    useEffect(() => {

      safeSetJSON(
        'elites_google_sheets_config',
        config
      );

    }, [
      config
    ]);


    /**
     * ========================================================
     * Context Value
     * ========================================================
     */

    const value:
      GoogleSheetsContextType = {

      config,

      setConfig,

      updateConfig,

      syncNow,

      pullFromSheets,

      isSyncing,

      lastSync,

      syncError,

      logs,

      uploadImageToDrive: useCallback(async (
        base64Data: string,
        fileName: string,
        mimeType = 'image/jpeg',
        targetType?: 'products' | 'categories'
      ) => {
        addLog('info', `بدء رفع صورة (${fileName}) إلى Google Drive...`);
        const res = await uploadImageToDrive(base64Data, fileName, mimeType);
        if (res.success) {
          addLog('success', `تم رفع الصورة (${fileName}) بنجاح وتوليد الرابط السحابي.`);
          return {
            ...res,
            driveUrl: res.directUrl,
            isLiveDrive: res.isLiveDrive ?? true,
            direct_url: res.directUrl,
            file_id: res.fileId
          };
        } else {
          addLog('error', `فشل رفع الصورة (${fileName}): ${res.error}`);
          return res;
        }
      }, [uploadImageToDrive, addLog]),

      createProductFolder,

      fetchFolderImages

    };


    return (

      <GoogleSheetsContext.Provider
        value={value}
      >

        {children}

      </GoogleSheetsContext.Provider>

    );

  };


/**
 * ============================================================
 * Hook
 * ============================================================
 */

export function useGoogleSheets(): GoogleSheetsContextType {

  const context =
    useContext(
      GoogleSheetsContext
    );


  if (!context) {

    throw new Error(
      'useGoogleSheets يجب استخدامه داخل GoogleSheetsProvider'
    );

  }


  return context;

}


export default GoogleSheetsContext;