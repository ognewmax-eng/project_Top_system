/**
 * Сервис для обращения к PHP API: регистрация, вход, заявки, загрузка файлов.
 */

const API_BASE = `${typeof window !== 'undefined' ? window.location.origin : ''}/api`;

/* ─── Типы ─── */

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
  benefits?: string;
  attachments?: string;
  shift?: string;
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

export interface UploadToYandexOptions {
  shift: string;
  fullName: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserData;
  applicationId?: number;
  error?: string;
}

export interface UserData {
  id: number;
  email: string;
  fullName: string;
  birthDate?: string;
  passportSeries?: string;
  passportNumber?: string;
  address?: string;
  school?: string;
  grade?: string;
  phone?: string;
  shift?: string;
  benefits?: string;
}

export interface ApplicationData {
  id: string;
  dbId: number;
  userId: number;
  fullName: string;
  birthDate: string;
  passportSeries: string;
  passportNumber: string;
  address: string;
  school: string;
  grade: string;
  phone: string;
  email: string;
  shift: string;
  benefits: string[];
  attachments: string;
  status: 'review' | 'approved' | 'rejected' | 'revision' | 'reserve';
  revisionComment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftStats {
  submitted: number;
  approved: number;
}

export interface ApplicationStats {
  total: number;
  approved: number;
  byShift: Record<string, ShiftStats>;
}

/* ─── Хелперы ─── */

function getAuthToken(): string | null {
  return localStorage.getItem('top_auth_token');
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

function isNonJsonResponse(text: string): boolean {
  const t = text.trimStart();
  return t.startsWith('<') || t.startsWith('<?');
}

/* ─── Аутентификация ─── */

/**
 * Регистрация нового пользователя + создание заявки.
 * При успехе сохраняет token и user в localStorage.
 */
export async function registerUser(data: SaveApplicationPayload): Promise<AuthResponse> {
  const url = `${API_BASE}/register.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const text = await res.text();
  if (isNonJsonResponse(text)) {
    return { success: true, token: `local_${Date.now()}` };
  }
  const json = JSON.parse(text) as AuthResponse;
  if (!json.success) {
    throw new Error(json.error || 'Ошибка регистрации');
  }
  if (json.token) {
    localStorage.setItem('top_auth_token', json.token);
  }
  if (json.user) {
    localStorage.setItem('top_user', JSON.stringify(json.user));
  }
  return json;
}

/**
 * Вход по email и паролю.
 * При успехе сохраняет token и user в localStorage.
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const url = `${API_BASE}/login.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  if (isNonJsonResponse(text)) {
    throw new Error('Сервер не выполняет PHP. Проверьте деплой.');
  }
  const json = JSON.parse(text) as AuthResponse;
  if (!json.success) {
    throw new Error(json.error || 'Неверный email или пароль');
  }
  if (json.token) {
    localStorage.setItem('top_auth_token', json.token);
  }
  if (json.user) {
    localStorage.setItem('top_user', JSON.stringify(json.user));
  }
  return json;
}

/** Выход — очистка сессии на клиенте */
export function logoutUser(): void {
  localStorage.removeItem('top_auth_token');
  localStorage.removeItem('top_user');
}

/* ─── Заявки ─── */

/**
 * Получить свою заявку (для личного кабинета).
 */
export async function getMyApplication(): Promise<ApplicationData | null> {
  const url = `${API_BASE}/get_applications.php?mode=my`;
  const res = await fetch(url, { headers: authHeaders() });
  const text = await res.text();
  if (isNonJsonResponse(text)) return null;
  const json = JSON.parse(text);
  if (!json.success) return null;
  return json.application || null;
}

/**
 * Получить все заявки (для админки).
 */
export async function getAllApplications(adminPassword: string): Promise<ApplicationData[]> {
  const url = `${API_BASE}/get_applications.php?mode=all&admin_password=${encodeURIComponent(adminPassword)}`;
  const res = await fetch(url);
  const text = await res.text();
  if (isNonJsonResponse(text)) return [];
  const json = JSON.parse(text);
  if (!json.success) throw new Error(json.error || 'Ошибка загрузки заявок');
  return json.applications || [];
}

/**
 * Обновить статус заявки (для админки).
 */
export async function updateApplicationStatus(
  adminPassword: string,
  applicationDbId: number,
  status: string,
  revisionComment?: string,
  fields?: Record<string, string>
): Promise<void> {
  const url = `${API_BASE}/update_application.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      admin_password: adminPassword,
      application_id: applicationDbId,
      status,
      revision_comment: revisionComment || '',
      ...(fields || {}),
    }),
  });
  const text = await res.text();
  if (isNonJsonResponse(text)) return;
  const json = JSON.parse(text);
  if (!json.success) throw new Error(json.error || 'Ошибка обновления статуса');
}

/**
 * Отправить доработанную заявку (для пользователя).
 */
export async function submitRevision(data: Record<string, string>): Promise<void> {
  const url = `${API_BASE}/update_application.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const text = await res.text();
  if (isNonJsonResponse(text)) return;
  const json = JSON.parse(text);
  if (!json.success) throw new Error(json.error || 'Ошибка обновления заявки');
}

/* ─── Публичная статистика ─── */

/**
 * Получить статистику по заявкам (подано/одобрено по сменам) — без авторизации.
 */
export async function getApplicationStats(): Promise<ApplicationStats> {
  const fallback: ApplicationStats = {
    total: 0,
    approved: 0,
    byShift: {
      '1': { submitted: 0, approved: 0 },
      '2': { submitted: 0, approved: 0 },
      '3': { submitted: 0, approved: 0 },
    },
  };
  try {
    const url = `${API_BASE}/get_stats.php`;
    const res = await fetch(url);
    const text = await res.text();
    if (isNonJsonResponse(text)) return fallback;
    const json = JSON.parse(text);
    if (!json.success) return fallback;
    return {
      total: json.total ?? 0,
      approved: json.approved ?? 0,
      byShift: json.byShift ?? fallback.byShift,
    };
  } catch {
    return fallback;
  }
}

/* ─── Совместимость: save_data.php (JSON-файл) ─── */

export async function saveApplication(data: SaveApplicationPayload): Promise<SaveDataResponse> {
  const url = `${API_BASE}/save_data.php`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, status: 'review' }),
  });
  const text = await res.text();
  if (isNonJsonResponse(text)) {
    return { success: true, id: `local_${Date.now()}` };
  }
  const json = JSON.parse(text) as SaveDataResponse;
  if (!res.ok) throw new Error(json.error || 'Ошибка сохранения заявки');
  return json;
}

/* ─── Загрузка файлов ─── */

export async function uploadFile(file: File): Promise<UploadResponse> {
  const url = `${API_BASE}/upload.php`;
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(url, { method: 'POST', body: form });
  const text = await res.text();
  if (isNonJsonResponse(text)) return { success: true };
  const json = JSON.parse(text) as UploadResponse;
  if (!res.ok) throw new Error(json.error || 'Ошибка загрузки файла');
  return json;
}

export async function uploadFiles(
  files: File[],
  options?: UploadToYandexOptions
): Promise<UploadResponse> {
  if (files.length === 0) return { success: true, results: [] };
  const useYandex = options && options.shift && options.fullName.trim().length > 0;
  const url = useYandex ? `${API_BASE}/upload_to_yandex.php` : `${API_BASE}/upload.php`;

  const allResults: Array<{ originalName: string; saved: boolean; path?: string; error?: string }> = [];

  for (const f of files) {
    const form = new FormData();
    form.append('files[]', f);
    if (useYandex) {
      form.append('shift', options!.shift);
      form.append('fullName', options!.fullName.trim());
    }
    const res = await fetch(url, { method: 'POST', body: form });
    const text = await res.text();
    if (isNonJsonResponse(text)) {
      allResults.push({ originalName: f.name, saved: false });
      continue;
    }
    const json = JSON.parse(text) as UploadResponse;
    if (!res.ok) {
      allResults.push({ originalName: f.name, saved: false, error: json.error || 'Ошибка загрузки' });
      continue;
    }
    if (json.results) allResults.push(...json.results);
  }

  return { success: allResults.every((r) => r.saved), results: allResults };
}

export function getFileUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  if (path.startsWith('top/')) {
    return `${base}/api/get_yandex_file.php?path=${encodeURIComponent(path)}`;
  }
  return `${base}/api/${path.replace(/^\//, '')}`;
}
