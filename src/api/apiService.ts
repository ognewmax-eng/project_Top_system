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

/**
 * Отправка данных анкеты участника на save_data.php (JSON).
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
  const json = (await res.json()) as SaveDataResponse;
  if (!res.ok) {
    throw new Error(json.error || 'Ошибка сохранения заявки');
  }
  return json;
}

/**
 * Загрузка одного файла на upload.php.
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
  const url = `${API_BASE}/upload.php`;
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(url, {
    method: 'POST',
    body: form,
  });
  const json = (await res.json()) as UploadResponse;
  if (!res.ok) {
    throw new Error(json.error || 'Ошибка загрузки файла');
  }
  return json;
}

/**
 * Загрузка нескольких файлов на upload.php (поле "files").
 */
export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  if (files.length === 0) {
    return { success: true, results: [] };
  }
  const url = `${API_BASE}/upload.php`;
  const form = new FormData();
  files.forEach((f) => form.append('files[]', f));
  const res = await fetch(url, {
    method: 'POST',
    body: form,
  });
  const json = (await res.json()) as UploadResponse;
  if (!res.ok) {
    throw new Error(json.error || 'Ошибка загрузки файлов');
  }
  return json;
}
