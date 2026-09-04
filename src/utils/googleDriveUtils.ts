/**
 * ============================================================
 * Google Drive Utilities
 * ============================================================
 *
 * مسؤول عن:
 * - استخراج File ID من روابط Google Drive
 * - إنشاء روابط عرض مباشرة للصور
 * - إنشاء معرفات مؤقتة للملفات
 * - تخزين معاينات الصور مؤقتًا في sessionStorage فقط
 * - ضغط الصور قبل الرفع
 *
 * ملاحظة مهمة:
 * لا يتم تخزين Base64 الخاص بالصور في localStorage.
 * ============================================================
 */


/**
 * المجلد الافتراضي في Google Drive
 */
export const DEFAULT_DRIVE_FOLDER_ID =
  '1JfMshA_FBjFRifRRqci0E-jZaoLhESWNl';


/**
 * رابط المجلد الافتراضي
 */
export const DEFAULT_DRIVE_FOLDER_URL =
  `https://drive.google.com/drive/folders/${DEFAULT_DRIVE_FOLDER_ID}`;


/**
 * ============================================================
 * التحقق هل الرابط رابط مجلد Google Drive
 * ============================================================
 */
export function isGoogleDriveFolder(
  url: string
): boolean {

  if (!url) {
    return false;
  }

  return (
    url.includes('drive.google.com/drive/folders/') ||
    url.includes('drive.google.com/drive/u/')
  );
}


/**
 * ============================================================
 * استخراج Folder ID من رابط Google Drive
 * ============================================================
 */
export function extractGoogleDriveFolderId(
  url: string
): string | null {

  if (!url) {
    return null;
  }

  const patterns = [

    /\/folders\/([a-zA-Z0-9_-]+)/,

    /\/drive\/u\/\d+\/folders\/([a-zA-Z0-9_-]+)/,

    /[?&]id=([a-zA-Z0-9_-]+)/

  ];


  for (const pattern of patterns) {

    const match = url.match(pattern);

    if (match && match[1]) {
      return match[1];
    }

  }


  return null;
}


/**
 * ============================================================
 * استخراج File ID من رابط Google Drive
 * ============================================================
 */
export function extractGoogleDriveId(
  url: string
): string | null {

  if (!url) {
    return null;
  }


  /*
   * إذا كان الرابط يحتوي على File ID بشكل مباشر.
   */
  const patterns = [

    /\/file\/d\/([a-zA-Z0-9_-]+)/,

    /[?&]id=([a-zA-Z0-9_-]+)/,

    /\/d\/([a-zA-Z0-9_-]+)/,

    /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/

  ];


  for (const pattern of patterns) {

    const match = url.match(pattern);

    if (match && match[1]) {
      return match[1];
    }

  }


  /*
   * إذا تم تمرير File ID نفسه.
   */
  if (
    /^[a-zA-Z0-9_-]{10,}$/.test(url)
  ) {

    return url;

  }


  return null;
}


/**
 * ============================================================
 * إنشاء رابط مباشر لصورة Google Drive
 * ============================================================
 */
export function formatGoogleDriveDirectUrl(
  fileIdOrUrl: string
): string {
  const fileId =
    extractGoogleDriveId(
      fileIdOrUrl
    );

  if (!fileId) {
    return "";
  }

  return `https://lh3.googleusercontent.com/d/${fileId}`;
}


/**
 * ============================================================
 * إنشاء روابط متعددة للصورة
 * ============================================================
 *
 * نستخدم أكثر من رابط حتى يستطيع المتجر تجربة البدائل
 * إذا لم يعمل أحدها.
 * ============================================================
 */
export function getDriveImageCandidates(
  urlOrId: string
): string[] {

  if (!urlOrId) {
    return [];
  }


  const fileId =
    extractGoogleDriveId(urlOrId);


  /*
   * إذا لم يكن Google Drive،
   * نعيد الرابط نفسه.
   */
  if (!fileId) {

    return [
      urlOrId
    ];

  }


  const candidates = [

    /*
     * الرابط المباشر الأساسي
     */
    `https://lh3.googleusercontent.com/d/${fileId}`,

    /*
     * Google Drive View
     */
    `https://drive.google.com/uc?export=view&id=${fileId}`,

    /*
     * Google Drive download
     */
    `https://drive.google.com/uc?export=download&id=${fileId}`

  ];


  /*
   * إزالة التكرار
   */
  return [
    ...new Set(candidates)
  ];
}


/**
 * ============================================================
 * إنشاء معرف ملف مؤقت
 * ============================================================
 */
export function generateDriveFileId(
  prefix: string = 'drive_f'
): string {

  const timestamp =
    Date.now().toString(36);


  const randomPart =
    Math.random()
      .toString(36)
      .substring(2, 10);


  return (
    `${prefix}_${timestamp}_${randomPart}`
  );
}


/**
 * ============================================================
 * أدوات Session Storage الآمنة
 * ============================================================
 *
 * sessionStorage له حد معين أيضًا.
 * لذلك:
 *
 * 1. لا نخزن Base64 في localStorage إطلاقًا.
 * 2. نخزن نسخة واحدة فقط في sessionStorage.
 * 3. لا نخزن الصور الكبيرة جدًا.
 * 4. إذا امتلأت المساحة، نحذف المعاينات القديمة.
 * 5. لا نسمح بخروج QuotaExceededError إلى التطبيق.
 * ============================================================
 */


/**
 * الحد الأقصى لحجم Base64 الذي يسمح بتخزينه.
 *
 * تقريبًا 750 KB كنص Base64.
 *
 * الصور الأكبر من ذلك ستظل تعمل من Google Drive،
 * ولكن لن يتم تخزين نسخة مؤقتة منها.
 */
const MAX_SESSION_PREVIEW_SIZE = 750 * 1024;


/**
 * إنشاء مفتاح التخزين للصورة
 */
function getPreviewStorageKey(
  fileId: string
): string {

  return `drive_preview_${fileId}`;
}


/**
 * حذف جميع معاينات Google Drive القديمة
 */
function clearDrivePreviewSessionCache(): void {

  if (typeof window === 'undefined') {
    return;
  }


  try {

    const keys: string[] = [];


    for (
      let i = 0;
      i < sessionStorage.length;
      i++
    ) {

      const key =
        sessionStorage.key(i);


      if (
        key &&
        key.startsWith('drive_preview_')
      ) {

        keys.push(key);

      }

    }


    keys.forEach(
      key => {
        try {
          sessionStorage.removeItem(key);
        } catch {
          // تجاهل الخطأ
        }
      }
    );

  } catch {
    // تجاهل أي خطأ في sessionStorage
  }
}


/**
 * ============================================================
 * تخزين Preview للصورة
 * ============================================================
 */
export function cacheDriveImagePreview(
  directUrl: string,
  base64Data: string
): void {

  /*
   * لا توجد بيئة متصفح
   */
  if (
    typeof window === 'undefined'
  ) {

    return;

  }


  /*
   * لا توجد بيانات
   */
  if (
    !directUrl ||
    !base64Data
  ) {

    return;

  }


  /*
   * نحتاج File ID حتى نتمكن من استخدام مفتاح صغير.
   */
  const fileId =
    extractGoogleDriveId(directUrl);


  /*
   * إذا لم يكن الرابط تابعًا لـ Google Drive،
   * لا نخزنه.
   */
  if (!fileId) {

    return;

  }


  /*
   * لا نخزن الصور الضخمة.
   */
  if (
    base64Data.length >
    MAX_SESSION_PREVIEW_SIZE
  ) {

    console.warn(
      'تم تجاوز حجم Preview المسموح، لن يتم تخزين الصورة مؤقتًا.'
    );

    return;

  }


  const key =
    getPreviewStorageKey(fileId);


  try {

    /*
     * نخزن نسخة واحدة فقط.
     */
    sessionStorage.setItem(
      key,
      base64Data
    );

  } catch (error) {

    /*
     * إذا امتلأت sessionStorage،
     * نحذف جميع المعاينات ونحاول مرة واحدة.
     */
    try {

      clearDrivePreviewSessionCache();


      sessionStorage.setItem(
        key,
        base64Data
      );

    } catch (retryError) {

      /*
       * لا نسمح أبدًا بانهيار التطبيق بسبب التخزين.
       */
      console.warn(
        'تعذر تخزين معاينة صورة Google Drive مؤقتًا:',
        retryError
      );

    }

  }
}


/**
 * ============================================================
 * استرجاع Preview للصورة
 * ============================================================
 */
export function getCachedDriveImagePreview(
  directUrl: string
): string | null {

  if (
    typeof window === 'undefined'
  ) {

    return null;

  }


  if (!directUrl) {
    return null;
  }


  const fileId =
    extractGoogleDriveId(directUrl);


  if (!fileId) {
    return null;
  }


  const key =
    getPreviewStorageKey(fileId);


  try {

    return (
      sessionStorage.getItem(key)
    );

  } catch {

    return null;

  }
}


/**
 * ============================================================
 * ضغط الصورة
 * ============================================================
 *
 * الهدف:
 * تقليل حجم الصورة قبل تحويلها إلى Base64 ورفعها إلى Drive.
 * ============================================================
 */
export async function compressImageFile(
  file: File,
  maxWidth: number = 1600,
  quality: number = 0.82
): Promise<{ base64: string; sizeKb: number }> {

  /*
   * إذا لم يكن الملف صورة،
   * نعيد Promise مرفوضًا.
   */
  if (
    !file.type.startsWith('image/')
  ) {

    throw new Error(
      'الملف المحدد ليس صورة.'
    );

  }


  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onerror = () => {

        reject(
          new Error(
            'تعذر قراءة ملف الصورة.'
          )
        );

      };


      reader.onload = () => {

        const image =
          new Image();


        image.onerror = () => {

          reject(
            new Error(
              'تعذر تحميل الصورة.'
            )
          );

        };


        image.onload = () => {

          let width =
            image.naturalWidth;


          let height =
            image.naturalHeight;


          /*
           * حساب نسبة التصغير.
           */
          const scale =
            Math.min(
              1,
              maxWidth / width
            );


          width =
            Math.round(
              width * scale
            );


          height =
            Math.round(
              height * scale
            );


          /*
           * إنشاء Canvas.
           */
          const canvas =
            document.createElement(
              'canvas'
            );


          canvas.width =
            width;


          canvas.height =
            height;


          const context =
            canvas.getContext(
              '2d'
            );


          if (!context) {

            reject(
              new Error(
                'تعذر إنشاء Canvas لمعالجة الصورة.'
              )
            );

            return;

          }


          /*
           * تحسين طريقة رسم الصورة.
           */
          context.imageSmoothingEnabled =
            true;


          context.imageSmoothingQuality =
            'high';


          /*
           * رسم الصورة.
           */
          context.drawImage(
            image,
            0,
            0,
            width,
            height
          );


          /*
           * اختيار نوع الصورة.
           *
           * PNG نحتفظ به كـ PNG.
           * باقي الصور نحولها إلى JPEG لتقليل الحجم.
           */
          const outputType =
            file.type === 'image/png'
              ? 'image/png'
              : 'image/jpeg';


          const outputQuality =
            outputType === 'image/png'
              ? undefined
              : quality;


          try {

            const dataUrl =
              canvas.toDataURL(
                outputType,
                outputQuality
              );

            const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

            resolve({
              base64: dataUrl,
              sizeKb
            });

          } catch (error) {

            reject(
              new Error(
                'تعذر ضغط الصورة.'
              )
            );

          }

        };


        image.src =
          reader.result as string;

      };


      reader.readAsDataURL(file);

    }
  );
}