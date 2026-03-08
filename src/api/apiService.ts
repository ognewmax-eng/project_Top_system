/**
 * Сервис для обращения к PHP API: сохранение анкет и загрузка файлов.
 * Базовый URL: относительно текущего сайта (после деплоя — корень домена).
 */

const API_BASE = `${typeof window !== 'undefined' ? window.location.origin : ''}/api`;

export interface SaveApplicationPayload {
  fullName: string;
  birthDate: string;
  passportSeries: string;
  passportNumber: string;
  address: string;
  school: string;
  grade: string;
  phone: string;
  email?: string;
  password: string;
  benefits?: string; // JSON-строка массива выбранных льгот
  attachments?: string; // JSON-строка массивов путей загруженных файлов
  [key: string]: string | undefined;
}

export interface SaveDataResponse {
  success: boolean;
  id?: string;
  message?: string;
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  path?: string;
  originalName?: string;
  results?: Array<{ originalName: string; saved: boolean; path?: string; error?: string }>;
  error?: string;
}

/** Параметры для загрузки на Яндекс.Диск (папки по смене и ФИО) */
export interface UploadToYandexOptions {
  shift: string; // "1" | "2" | "3"
  fullName: string;
}

/**
 * Проверяет, что ответ похож на HTML/PHP (сервер не выполняет PHP).
 * В режиме dev без PHP заявку сохраняем только в localStorage.
 */
function isNonJsonResponse(text: string): boolean {
  const t = text.trimStart();
  return t.startsWith('<') || t.startsWith('<?');
}

/**
 * Отправка данных анкеты участника на save_data.php (JSON).
 * Если сервер вернул не JSON (например, исходник PHP при работе через Vite без PHP),
 * возвращаем успех без ошибки — заявка сохранится в localStorage в App.
 */
export async function saveApplication(data: SaveApplicationPayload): Promise<SaveDataResponse> {
  const url = `${API_BASE}/save_data.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      status: 'review',
    }),
  });
  const text = await res.text();
  if (isNonJsonResponse(text)) {
    return { success: true, id: `local_${Date.now()}` };
  }
  const json = JSON.parse(text) as SaveDataResponse;
  if (!res.ok) {
    throw new Error(json.error || 'Ошибка сохранения заявки');
  }
  return json;
}

/**
 * Загрузка одного файла (локальный upload.php).
 * Если сервер вернул не JSON (PHP не выполняется), возвращаем успех без пути — заявка сохранится без вложений.
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
  const url = `${API_BASE}/upload.php`;
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(url, { method: 'POST', body: form });
  const text = await res.text();
  if (isNonJsonResponse(text)) {
    return { success: true };
  }
  const json = JSON.parse(text) as UploadResponse;
  if (!res.ok) {
    throw new Error(json.error || 'Ошибка загрузки файла');
  }
  return json;
}

/**
 * Загрузка файлов на Яндекс.Диск (папки: top / «1 смена»|«2 смена»|«3 смена» / ФИО) или на хостинг.
 * Если переданы options.shift и options.fullName — используется upload_to_yandex.php, иначе upload.php.
 * При ответе не-JSON (PHP не выполняется) возвращаем успех без путей.
 */
export async function uploadFiles(
  files: File[],
  options?: UploadToYandexOptions
): Promise<UploadResponse> {
  if (files.length === 0) {
    return { success: true, results: [] };
  }
  const useYandex = options && options.shift && options.fullName.trim().length > 0;
  const url = useYandex ? `${API_BASE}/upload_to_yandex.php` : `${API_BASE}/upload.php`;
  const form = new FormData();
  files.forEach((f) => form.append('files[]', f));
  if (useYandex) {
    form.append('shift', options!.shift);
    form.append('fullName', options!.fullName.trim());
  }
  const res = await fetch(url, { method: 'POST', body: form });
  const text = await res.text();
  if (isNonJsonResponse(text)) {
    return { success: true, results: files.map((f) => ({ originalName: f.name, saved: false })) };
  }
  const json = JSON.parse(text) as UploadResponse;
  if (!res.ok) {
    throw new Error(json.error || 'Ошибка загрузки файлов');
  }
  return json;
}

/**
 * Возвращает URL для просмотра/скачивания файла по пути из заявки.
 * Пути с Яндекс.Диска (начинаются с "top/") открываются через get_yandex_file.php.
 */
export function getFileUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  if (path.startsWith('top/')) {
    return `${base}/api/get_yandex_file.php?path=${encodeURIComponent(path)}`;
  }
  return `${base}/api/${path.replace(/^\//, '')}`;
}
