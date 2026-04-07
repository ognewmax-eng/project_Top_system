import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getFileUrl, getAllApplications, updateApplicationStatus, adminSetUserPassword } from "@/api/apiService";
import type { ApplicationData } from "@/api/apiService";
import { parseAttachmentsJson } from "@/utils/attachments";
import { useIsMobile } from "@/hooks/useIsMobile";

interface Application {
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
  parentFullName?: string;
  parentBirthDate?: string;
  parentPhone?: string;
  parentAddress?: string;
  parentWorkplace?: string;
  status: "review" | "approved" | "rejected" | "revision" | "reserve";
  createdAt: string;
  revisionComment?: string;
  attachments?: string;
}

interface AdminPanelProps {
  onBack: () => void;
}

type StatusFilter = "all" | "review" | "revision" | "approved" | "rejected" | "reserve";
type SortMode = "newest" | "oldest" | "name_asc" | "name_desc";

const statusLabels: Record<string, { label: string; color: string; text: string }> = {
  review:   { label: "НА ПРОВЕРКЕ",  color: "#879E82", text: "#003F5C" },
  revision: { label: "НА ДОРАБОТКЕ", color: "#F59E0B", text: "#003F5C" },
  approved: { label: "ОДОБРЕНО",     color: "#16A34A", text: "#fff" },
  rejected: { label: "ОТКЛОНЕНО",    color: "#DC2626", text: "#fff" },
  reserve:  { label: "В РЕЗЕРВЕ",    color: "#6366F1", text: "#fff" },
};

const benefitLabels: Record<string, string> = {
  low_income: "Малоимущие",
  svo: "Дети участников СВО",
  orphan: "Дети-сироты",
  disabled: "Дети-инвалиды",
  ovz: "Дети ОВЗ",
  combat_veteran: "Ветераны БД",
  kmns: "КМНС",
  preventive: "Профилактический учёт",
  large_family: "Многодетные семьи",
  none: "Без льгот",
};

function formatDate(d: string): string {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toApplication(a: ApplicationData): Application {
  return {
    id: a.id, dbId: a.dbId, userId: a.userId, fullName: a.fullName, birthDate: a.birthDate,
    passportSeries: a.passportSeries, passportNumber: a.passportNumber,
    address: a.address, school: a.school, grade: a.grade, phone: a.phone,
    email: a.email, shift: a.shift || "", benefits: a.benefits, status: a.status,
    parentFullName: a.parentFullName, parentBirthDate: a.parentBirthDate,
    parentPhone: a.parentPhone, parentAddress: a.parentAddress, parentWorkplace: a.parentWorkplace,
    createdAt: a.createdAt, revisionComment: a.revisionComment, attachments: a.attachments,
  };
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "none", borderBottom: "1.5px solid rgba(135,158,130,0.4)", fontSize: 14,
  fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box",
};

const btnStyle = (bg: string, color: string): React.CSSProperties => ({
  padding: "10px 20px", border: "none", backgroundColor: bg, color,
  fontWeight: 900, fontSize: 12, cursor: "pointer", letterSpacing: "0.5px",
  boxShadow: "none", fontFamily: "'Inter', sans-serif", transition: "all 0.1s",
});

export function AdminPanel({ onBack }: AdminPanelProps) {
  const mobile = useIsMobile();
  const [authed, setAuthed] = useState(false);
  const [adminPw, setAdminPw] = useState("");
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterShift, setFilterShift] = useState<string>("all");
  const [filterBenefit, setFilterBenefit] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revisionComment, setRevisionComment] = useState("");
  const [revisionTargetId, setRevisionTargetId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [editSaving, setEditSaving] = useState(false);

  const [adminUserPwNew, setAdminUserPwNew] = useState<Record<string, string>>({});
  const [adminUserPwConfirm, setAdminUserPwConfirm] = useState<Record<string, string>>({});
  const [adminUserPwLoading, setAdminUserPwLoading] = useState<string | null>(null);
  const [adminUserPwFeedback, setAdminUserPwFeedback] = useState<Record<string, string>>({});

  const loadApps = async (pw: string) => {
    setLoading(true);
    try {
      const data = await getAllApplications(pw);
      setApps(data.map(toApplication));
    } catch { setApps([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (authed) loadApps(adminPw); }, [authed]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await getAllApplications(pwInput);
      setApps(data.map(toApplication));
      setAdminPw(pwInput);
      setAuthed(true);
      setPwError(false);
    } catch { setPwError(true); }
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async (
    id: string, dbId: number,
    status: "review" | "approved" | "rejected" | "revision" | "reserve",
    comment?: string
  ) => {
    try {
      await updateApplicationStatus(adminPw, dbId, status, comment);
      setApps((prev) => prev.map((a) =>
        a.id === id
          ? { ...a, status, revisionComment: status === "revision" && comment ? comment : status !== "revision" ? "" : a.revisionComment || "" }
          : a
      ));
    } catch { await loadApps(adminPw); }
    setRevisionTargetId(null);
    setRevisionComment("");
  };

  const handleSaveEdit = async (app: Application) => {
    setEditSaving(true);
    try {
      await updateApplicationStatus(adminPw, app.dbId, app.status, app.revisionComment, editForm);
      setApps((prev) => prev.map((a) => {
        if (a.id !== app.id) return a;
        let benefits = a.benefits;
        try {
          if (editForm.benefits) benefits = JSON.parse(editForm.benefits) as string[];
        } catch { /* keep */ }
        return { ...a, ...editForm, benefits };
      }));
      setEditingId(null);
      setEditForm({});
    } catch { await loadApps(adminPw); }
    finally { setEditSaving(false); }
  };

  const handleAdminSetUserPassword = async (app: Application) => {
    const n = (adminUserPwNew[app.id] || "").trim();
    const c = (adminUserPwConfirm[app.id] || "").trim();
    setAdminUserPwFeedback((f) => ({ ...f, [app.id]: "" }));
    if (n.length < 6) {
      setAdminUserPwFeedback((f) => ({ ...f, [app.id]: "Пароль не короче 6 символов" }));
      return;
    }
    if (n !== c) {
      setAdminUserPwFeedback((f) => ({ ...f, [app.id]: "Пароли не совпадают" }));
      return;
    }
    setAdminUserPwLoading(app.id);
    try {
      await adminSetUserPassword(adminPw, app.userId, n);
      setAdminUserPwNew((p) => ({ ...p, [app.id]: "" }));
      setAdminUserPwConfirm((p) => ({ ...p, [app.id]: "" }));
      setAdminUserPwFeedback((f) => ({
        ...f,
        [app.id]: "Пароль установлен. Участник войдёт в кабинет с новым паролем.",
      }));
    } catch (e) {
      setAdminUserPwFeedback((f) => ({
        ...f,
        [app.id]: e instanceof Error ? e.message : "Ошибка",
      }));
    } finally {
      setAdminUserPwLoading(null);
    }
  };

  const startEdit = (app: Application) => {
    setEditingId(app.id);
    setEditForm({
      fullName: app.fullName, birthDate: app.birthDate, passportSeries: app.passportSeries,
      passportNumber: app.passportNumber, address: app.address, school: app.school,
      grade: app.grade, phone: app.phone, email: app.email, shift: app.shift,
      parentFullName: app.parentFullName ?? "",
      parentBirthDate: app.parentBirthDate ?? "",
      parentPhone: app.parentPhone ?? "",
      parentAddress: app.parentAddress ?? "",
      parentWorkplace: app.parentWorkplace ?? "",
    });
  };

  const filtered = useMemo(() => {
    let list = [...apps];
    if (filterStatus !== "all") list = list.filter((a) => a.status === filterStatus);
    if (filterShift !== "all") list = list.filter((a) => a.shift === filterShift);
    if (filterBenefit !== "all") {
      if (filterBenefit === "has_benefit") list = list.filter((a) => a.benefits.length > 0 && !a.benefits.includes("none"));
      else list = list.filter((a) => a.benefits.includes(filterBenefit));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.phone.includes(q) ||
        a.id.includes(q) ||
        (a.parentFullName || "").toLowerCase().includes(q) ||
        (a.parentPhone || "").includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortMode) {
        case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name_asc": return a.fullName.localeCompare(b.fullName, "ru");
        case "name_desc": return b.fullName.localeCompare(a.fullName, "ru");
        default: return 0;
      }
    });
    return list;
  }, [apps, filterStatus, filterShift, filterBenefit, searchQuery, sortMode]);

  const counts: Record<string, number> = {
    all: apps.length, review: 0, revision: 0, approved: 0, rejected: 0, reserve: 0,
  };
  apps.forEach((a) => { if (counts[a.status] !== undefined) counts[a.status]++; });

  const exportToExcel = useCallback(async (mode: "all" | "approved" | "reserve" | "rejected") => {
    const XLSX = await import("xlsx");
    const titleMap: Record<string, string> = {
      all: "Все заявки", approved: "Одобренные", reserve: "В резерве", rejected: "Отклонённые",
    };
    const rows = (mode === "all" ? apps : apps.filter((a) => a.status === mode))
      .map((a) => ({
        "ФИО": a.fullName || "—",
        "ДАТА РОЖДЕНИЯ": formatDate(a.birthDate),
        "ТЕЛЕФОН": a.phone || "—",
        "АДРЕС": a.address || "—",
        "ШКОЛА": a.school || "—",
        "КЛАСС": a.grade ? `${a.grade} класс` : "—",
        "СМЕНА": a.shift ? `${a.shift} смена` : "—",
        "ЛЬГОТЫ": a.benefits?.length
          ? a.benefits.map((b) => benefitLabels[b] || b).join(", ")
          : "Без льгот",
        "ФИО РОДИТЕЛЯ": a.parentFullName || "—",
        "ТЕЛЕФОН РОДИТЕЛЯ": a.parentPhone || "—",
        "МЕСТО РАБОТЫ РОДИТЕЛЯ": a.parentWorkplace || "—",
      }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const colWidths = [30, 16, 22, 40, 40, 12, 12, 30, 28, 18, 36];
    ws["!cols"] = colWidths.map((w) => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, titleMap[mode]);
    XLSX.writeFile(wb, `Заявки_${titleMap[mode]}_${new Date().toLocaleDateString("ru-RU").replace(/\./g, "-")}.xlsx`);
  }, [apps]);

  /* ─── Login screen ─── */
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#fff", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>
        <div style={{ backgroundColor: "#003F5C", borderBottom: "none", padding: "20px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, backgroundColor: "#879E82", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#003F5C", fontWeight: 900, fontSize: 11 }}>ТОП</span>
              </div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: "0.5px" }}>ПАНЕЛЬ АДМИНИСТРАТОРА</div>
            </div>
            <button onClick={onBack} style={{ padding: "8px 16px", border: "2px solid #fff", backgroundColor: "transparent", color: "#fff", fontWeight: 900, fontSize: 12, cursor: "pointer", letterSpacing: "0.5px", fontFamily: "'Inter', sans-serif" }}>
              ← НА ГЛАВНУЮ
            </button>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 400, border: "none", boxShadow: "none" }}>
            <div style={{ backgroundColor: "#003F5C", padding: "20px 28px", borderBottom: "none" }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 900, letterSpacing: "1px", marginBottom: 4 }}>ДОСТУП ОГРАНИЧЕН</div>
              <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px" }}>ВХОД ДЛЯ АДМИНИСТРАТОРА</div>
            </div>
            <div style={{ padding: 28 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 900, marginBottom: 8, letterSpacing: "0.5px" }}>ПАРОЛЬ АДМИНИСТРАТОРА</label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={pwInput}
                    onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
                    placeholder="••••••••••" style={{ ...inputStyle, paddingRight: 48 }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0 }}>
                    {showPw ? "🙈" : "👁"}
                  </button>
                </div>
                {pwError && (
                  <div style={{ marginTop: 8, padding: "8px 12px", backgroundColor: "#FEF2F2", border: "2px solid #DC2626", fontSize: 13, fontWeight: 700, color: "#DC2626" }}>
                    Неверный пароль
                  </div>
                )}
              </div>
              <button onClick={handleLogin} disabled={loading}
                style={{ width: "100%", padding: "14px", fontSize: 15, fontWeight: 900, color: "#fff", backgroundColor: "#003F5C", border: "none", boxShadow: "none", cursor: loading ? "not-allowed" : "pointer", letterSpacing: "1px", fontFamily: "'Inter', sans-serif" }}>
                {loading ? "ЗАГРУЗКА…" : "ВОЙТИ В ПАНЕЛЬ"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Main panel ─── */
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#eeeadf", fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ backgroundColor: "#003F5C", borderBottom: "none", padding: mobile ? "0 12px" : "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", height: mobile ? 52 : 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: mobile ? 8 : 16, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: mobile ? 6 : 10, minWidth: 0 }}>
              <div style={{ width: 28, height: 28, backgroundColor: "#879E82", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#003F5C", fontWeight: 900, fontSize: 9 }}>ТОП</span>
              </div>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: mobile ? 12 : 15, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                {mobile ? "АДМИН" : "ПАНЕЛЬ АДМИНИСТРАТОРА"}
              </span>
            </div>
            {!mobile && (
              <>
                <div style={{ width: 1, height: 24, backgroundColor: "rgba(255,255,255,0.2)" }} />
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700 }}>УПРАВЛЕНИЕ ЗАЯВКАМИ</span>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => loadApps(adminPw)} style={{ padding: mobile ? "4px 8px" : "6px 14px", border: "2px solid rgba(255,255,255,0.3)", backgroundColor: "transparent", color: "#fff", fontWeight: 900, fontSize: mobile ? 10 : 12, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              ↻{mobile ? "" : " ОБНОВИТЬ"}
            </button>
            <button onClick={onBack} style={{ padding: mobile ? "4px 8px" : "6px 14px", border: "2px solid #879E82", backgroundColor: "transparent", color: "#879E82", fontWeight: 900, fontSize: mobile ? 10 : 12, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              ←{mobile ? "" : " НА ГЛАВНУЮ"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: mobile ? "16px 12px" : "32px 24px" }}>

        {/* Status counters */}
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)", gap: mobile ? 8 : 12, marginBottom: mobile ? 16 : 24 }}>
          {([
            { key: "all",      label: "ВСЕГО",        bg: "#fff",     border: "#003F5C" },
            { key: "review",   label: "НА ПРОВЕРКЕ",  bg: "#F0EAD2",  border: "#003F5C" },
            { key: "revision", label: "НА ДОРАБОТКЕ", bg: "#FEF3C7",  border: "#F59E0B" },
            { key: "approved", label: "ОДОБРЕНО",     bg: "#DCFCE7",  border: "#16A34A" },
            { key: "reserve",  label: "В РЕЗЕРВЕ",    bg: "#EEF2FF",  border: "#6366F1" },
            { key: "rejected", label: "ОТКЛОНЕНО",    bg: "#FEF2F2",  border: "#DC2626" },
          ] as const).map((stat) => (
            <div key={stat.key} onClick={() => setFilterStatus(stat.key as StatusFilter)}
              style={{
                border: "none",
                boxShadow: "none",
                backgroundColor: filterStatus === stat.key ? stat.bg : "#faf8f3",
                padding: mobile ? "10px 12px" : "16px 20px", cursor: "pointer",
                opacity: filterStatus === stat.key ? 1 : 0.7,
                transition: "all 0.15s",
                outline: filterStatus === stat.key ? `2px solid ${stat.border}` : "none",
                outlineOffset: "-2px",
              }}>
              <div style={{ fontSize: mobile ? 8 : 10, fontWeight: 900, letterSpacing: "1px", color: "#666", marginBottom: mobile ? 4 : 6 }}>{stat.label}</div>
              <div style={{ fontSize: mobile ? 22 : 32, fontWeight: 900, lineHeight: 1, color: "#003F5C" }}>{counts[stat.key] ?? 0}</div>
            </div>
          ))}
        </div>

        {/* Filters bar */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: mobile ? 10 : 12, marginBottom: mobile ? 16 : 24, padding: mobile ? "12px" : "16px 20px", border: "none", backgroundColor: "#fff" }}>
          <div style={{ flex: mobile ? "1 1 100%" : "1 1 250px" }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 900, letterSpacing: "1px", color: "#888", marginBottom: 4 }}>ПОИСК</label>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ФИО, email, телефон…"
              style={{ ...inputStyle, padding: "8px 12px", fontSize: 13 }} />
          </div>
          <div style={{ flex: mobile ? "1 1 45%" : "0 0 150px" }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 900, letterSpacing: "1px", color: "#888", marginBottom: 4 }}>СМЕНА</label>
            <select value={filterShift} onChange={(e) => setFilterShift(e.target.value)}
              style={{ ...inputStyle, padding: "8px 12px", fontSize: 13, cursor: "pointer" }}>
              <option value="all">Все смены</option>
              <option value="1">1 смена</option>
              <option value="2">2 смена</option>
              <option value="3">3 смена</option>
            </select>
          </div>
          <div style={{ flex: mobile ? "1 1 45%" : "0 0 200px" }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 900, letterSpacing: "1px", color: "#888", marginBottom: 4 }}>ЛЬГОТЫ</label>
            <select value={filterBenefit} onChange={(e) => setFilterBenefit(e.target.value)}
              style={{ ...inputStyle, padding: "8px 12px", fontSize: 13, cursor: "pointer" }}>
              <option value="all">Все категории</option>
              <option value="has_benefit">С льготами (любые)</option>
              <option value="low_income">Малоимущие</option>
              <option value="svo">Дети участников СВО</option>
              <option value="orphan">Дети-сироты</option>
              <option value="disabled">Дети-инвалиды</option>
              <option value="ovz">Дети ОВЗ</option>
              <option value="combat_veteran">Ветераны БД</option>
              <option value="kmns">КМНС</option>
              <option value="preventive">Профилактический учёт</option>
              <option value="large_family">Многодетные семьи</option>
              <option value="none">Без льгот</option>
            </select>
          </div>
          <div style={{ flex: mobile ? "1 1 100%" : "0 0 180px" }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 900, letterSpacing: "1px", color: "#888", marginBottom: 4 }}>СОРТИРОВКА</label>
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}
              style={{ ...inputStyle, padding: "8px 12px", fontSize: 13, cursor: "pointer" }}>
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
              <option value="name_asc">По имени (А-Я)</option>
              <option value="name_desc">По имени (Я-А)</option>
            </select>
          </div>
        </div>

        {/* Export buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: mobile ? 8 : 10, marginBottom: mobile ? 16 : 24 }}>
          {!mobile && <span style={{ display: "flex", alignItems: "center", fontSize: 12, fontWeight: 900, color: "#555", letterSpacing: "0.5px", marginRight: 4 }}>ВЫГРУЗКА В EXCEL:</span>}
          {([
            { mode: "all",      label: "ВСЕ ЗАЯВКИ",   bg: "#fff",     color: "#003F5C" },
            { mode: "approved", label: "ОДОБРЕННЫЕ",    bg: "#DCFCE7",  color: "#166534" },
            { mode: "reserve",  label: "В РЕЗЕРВЕ",     bg: "#EEF2FF",  color: "#4338CA" },
            { mode: "rejected", label: "ОТКЛОНЁННЫЕ",   bg: "#FEF2F2",  color: "#991B1B" },
          ] as const).map((btn) => (
            <button key={btn.mode} onClick={() => exportToExcel(btn.mode)}
              disabled={apps.length === 0}
              style={{
                padding: "8px 16px", border: "none", backgroundColor: btn.bg, color: btn.color,
                fontWeight: 900, fontSize: 11, cursor: apps.length === 0 ? "not-allowed" : "pointer",
                letterSpacing: "0.5px", fontFamily: "'Inter', sans-serif", boxShadow: "none",
                opacity: apps.length === 0 ? 0.4 : 1, transition: "all 0.1s", display: "flex", alignItems: "center", gap: 6,
              }}>
              <span style={{ fontSize: 14 }}>📊</span> {btn.label}
            </button>
          ))}
        </div>

        {/* Application list */}
        <div style={{ border: "none", boxShadow: "none", backgroundColor: "#fff" }}>
          <div style={{ backgroundColor: "#003F5C", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 15, letterSpacing: "0.5px" }}>
              ЗАЯВКИ {filterStatus !== "all" && `— ${statusLabels[filterStatus]?.label}`}
            </span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 700 }}>
              {filtered.length} из {apps.length}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: "60px 24px", textAlign: "center", color: "#aaa" }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>ЗАГРУЗКА…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center", color: "#aaa" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>ЗАЯВОК НЕТ</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>
                {apps.length === 0 ? "Пока никто не подал заявку." : "Нет заявок по выбранным фильтрам."}
              </div>
            </div>
          ) : (
            <div>
              {filtered.map((app, idx) => {
                const st = statusLabels[app.status] || statusLabels.review;
                const isExpanded = expandedId === app.id;
                const isEditing = editingId === app.id;
                const isLast = idx === filtered.length - 1;
                const shiftLabel = app.shift ? `${app.shift} смена` : "—";

                return (
                  <div key={app.id} style={{ borderBottom: !isLast ? "none" : "none" }}>
                    {/* Row header */}
                    <div
                      style={{
                        padding: mobile ? "12px" : "16px 24px",
                        display: "flex",
                        alignItems: mobile ? "flex-start" : "center",
                        flexDirection: mobile ? "column" : "row",
                        gap: mobile ? 8 : 14,
                        cursor: "pointer",
                        backgroundColor: isExpanded ? "#faf8f3" : "#fff",
                        transition: "background 0.1s",
                      }}
                      onClick={() => { setExpandedId(isExpanded ? null : app.id); if (isEditing && !isExpanded) { setEditingId(null); setEditForm({}); } }}
                    >
                      {mobile ? (
                        <>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                              <span style={{ fontSize: 11, fontWeight: 900, color: "#aaa" }}>#{idx + 1}</span>
                              <span style={{ fontWeight: 900, fontSize: 14, color: "#003F5C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.fullName || "—"}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                              <div style={{ backgroundColor: st.color, border: "none", padding: "2px 8px", fontSize: 9, fontWeight: 900, color: st.text, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                                {st.label}
                              </div>
                              <div style={{ fontSize: 12, color: "#aaa", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "none" }}>▼</div>
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: "#888", fontWeight: 700 }}>
                            {shiftLabel} · {formatDate(app.createdAt)}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 900, color: "#aaa", width: 28, flexShrink: 0 }}>#{idx + 1}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 900, fontSize: 14, color: "#003F5C", marginBottom: 2 }}>{app.fullName || "—"}</div>
                            <div style={{ fontSize: 11, color: "#888", fontWeight: 700 }}>{app.email} · {app.phone}</div>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#555", flexShrink: 0, textAlign: "right" }}>
                            <div>{app.school || "—"}</div>
                            <div style={{ color: "#aaa" }}>{app.grade ? `${app.grade} кл.` : ""} · {shiftLabel}</div>
                          </div>
                          <div style={{ fontSize: 11, color: "#aaa", fontWeight: 700, flexShrink: 0 }}>{formatDate(app.createdAt)}</div>
                          <div style={{ backgroundColor: st.color, border: "none", padding: "3px 10px", fontSize: 10, fontWeight: 900, color: st.text, letterSpacing: "0.5px", flexShrink: 0, whiteSpace: "nowrap" }}>
                            {st.label}
                          </div>
                          <div style={{ fontSize: 13, color: "#aaa", flexShrink: 0, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "none" }}>▼</div>
                        </>
                      )}
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{ backgroundColor: "#faf8f3", borderTop: "2px dashed #ccc", padding: mobile ? "16px 12px" : "24px" }}>

                        {/* Data grid (view or edit) */}
                        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: mobile ? 12 : 16, marginBottom: mobile ? 16 : 24 }}>
                          {([
                            { key: "fullName",       label: "ФИО",            value: app.fullName, wide: false },
                            { key: "birthDate",      label: "ДАТА РОЖДЕНИЯ",  value: formatDate(app.birthDate), wide: false },
                            { key: "passportSeries", label: "СЕРИЯ ПАСПОРТА", value: app.passportSeries, wide: false },
                            { key: "passportNumber", label: "НОМЕР ПАСПОРТА", value: app.passportNumber, wide: false },
                            { key: "phone",          label: "ТЕЛЕФОН",        value: app.phone, wide: false },
                            { key: "email",          label: "EMAIL",          value: app.email, wide: false },
                            { key: "address",        label: "АДРЕС",          value: app.address, wide: true },
                            { key: "school",         label: "ШКОЛА",          value: app.school, wide: false },
                            { key: "grade",          label: "КЛАСС",          value: app.grade ? `${app.grade} класс` : "—", wide: false },
                            { key: "shift",          label: "СМЕНА",          value: shiftLabel, wide: false },
                            { key: "parentFullName", label: "ФИО РОДИТЕЛЯ", value: app.parentFullName, wide: false },
                            { key: "parentBirthDate", label: "Д.Р. РОДИТЕЛЯ", value: formatDate(app.parentBirthDate || ""), wide: false },
                            { key: "parentPhone", label: "ТЕЛ. РОДИТЕЛЯ", value: app.parentPhone, wide: false },
                            { key: "parentAddress", label: "АДРЕС РОДИТЕЛЯ", value: app.parentAddress, wide: true },
                            { key: "parentWorkplace", label: "МЕСТО РАБОТЫ РОДИТЕЛЯ", value: app.parentWorkplace, wide: true },
                          ] as const).map((f) => (
                            <div key={f.key} style={{ gridColumn: !mobile && (f.wide || f.key === "parentAddress" || f.key === "parentWorkplace") ? "1 / -1" : undefined }}>
                              <div style={{ fontSize: 10, fontWeight: 900, color: "#888", letterSpacing: "0.5px", marginBottom: 4 }}>{f.label}</div>
                              {isEditing ? (
                                f.key === "grade" ? (
                                  <select value={editForm[f.key] || ""} onChange={(e) => setEditForm((p) => ({ ...p, [f.key]: e.target.value }))}
                                    style={{ ...inputStyle, padding: "8px 10px", fontSize: 13 }} onClick={(e) => e.stopPropagation()}>
                                    <option value="">—</option>
                                    {[6,7,8,9,10,11].map((g) => <option key={g} value={g}>{g} класс</option>)}
                                  </select>
                                ) : f.key === "shift" ? (
                                  <select value={editForm[f.key] || ""} onChange={(e) => setEditForm((p) => ({ ...p, [f.key]: e.target.value }))}
                                    style={{ ...inputStyle, padding: "8px 10px", fontSize: 13 }} onClick={(e) => e.stopPropagation()}>
                                    <option value="">—</option>
                                    <option value="1">1 смена</option>
                                    <option value="2">2 смена</option>
                                    <option value="3">3 смена</option>
                                  </select>
                                ) : f.key === "birthDate" || f.key === "parentBirthDate" ? (
                                  <input type="date" value={editForm[f.key] || ""} onChange={(e) => setEditForm((p) => ({ ...p, [f.key]: e.target.value }))}
                                    style={{ ...inputStyle, padding: "8px 10px", fontSize: 13 }} onClick={(e) => e.stopPropagation()} />
                                ) : (
                                  <input type="text" value={editForm[f.key] || ""} onChange={(e) => setEditForm((p) => ({ ...p, [f.key]: e.target.value }))}
                                    style={{ ...inputStyle, padding: "8px 10px", fontSize: 13 }} onClick={(e) => e.stopPropagation()} />
                                )
                              ) : (
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#003F5C" }}>{f.value || "—"}</div>
                              )}
                            </div>
                          ))}
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 900, color: "#888", letterSpacing: "0.5px", marginBottom: 4 }}>ЛЬГОТЫ</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#003F5C" }}>
                              {app.benefits?.length ? app.benefits.map((b) => benefitLabels[b] || b).join(", ") : "Без льгот"}
                            </div>
                          </div>
                        </div>

                        {/* Edit save/cancel */}
                        {isEditing && (
                          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                            <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(app); }} disabled={editSaving}
                              style={{ ...btnStyle("#16A34A", "#fff"), opacity: editSaving ? 0.6 : 1 }}>
                              {editSaving ? "СОХРАНЕНИЕ…" : "СОХРАНИТЬ ИЗМЕНЕНИЯ"}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingId(null); setEditForm({}); }}
                              style={{ padding: "10px 20px", border: "2px solid #999", backgroundColor: "#fff", color: "#555", fontWeight: 900, fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                              ОТМЕНА
                            </button>
                          </div>
                        )}

                        {/* Revision comment */}
                        {app.revisionComment && (
                          <div style={{ marginBottom: 24, padding: "12px 16px", backgroundColor: "#FEF3C7", border: "2px solid #F59E0B" }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: "#92400E", letterSpacing: "0.5px", marginBottom: 6 }}>КОММЕНТАРИЙ ДЛЯ ЗАЯВИТЕЛЯ</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#003F5C", whiteSpace: "pre-wrap" }}>{app.revisionComment}</div>
                          </div>
                        )}

                        {/* Files */}
                        {(() => {
                          const items = parseAttachmentsJson(app.attachments);
                          return items.length > 0 ? (
                            <div style={{ marginBottom: 24, padding: "16px 20px", backgroundColor: "#fff", border: "none" }}>
                              <div style={{ fontSize: 10, fontWeight: 900, color: "#888", letterSpacing: "0.5px", marginBottom: 10 }}>ФАЙЛЫ ЗАЯВКИ ({items.length})</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {items.map((item, i) => (
                                  <a key={`${app.id}-${item.path}-${i}`} href={getFileUrl(item.path)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                    style={{ display: "inline-flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", border: "none", backgroundColor: "#F0EAD2", color: "#003F5C", fontSize: 12, fontWeight: 700, textDecoration: "none", fontFamily: "'Inter', sans-serif" }}>
                                    <span>📎</span>
                                    <span>
                                      <span style={{ fontSize: 10, fontWeight: 900, color: "#666", display: "block" }}>{item.label}</span>
                                      {item.path.split("/").pop() || item.path}
                                    </span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          ) : null;
                        })()}

                        <div style={{ marginBottom: 20, padding: "12px 16px", backgroundColor: "#eeeadf", border: "none" }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ fontSize: 10, fontWeight: 900, color: "#666", marginBottom: 8 }}>ПАРОЛЬ УЧАСТНИКА (сброс сессии)</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                            <input type="password" placeholder="Новый пароль" value={adminUserPwNew[app.id] || ""}
                              onChange={(e) => setAdminUserPwNew((p) => ({ ...p, [app.id]: e.target.value }))}
                              style={{ ...inputStyle, maxWidth: 200, padding: "8px 10px", fontSize: 13 }} />
                            <input type="password" placeholder="Повтор" value={adminUserPwConfirm[app.id] || ""}
                              onChange={(e) => setAdminUserPwConfirm((p) => ({ ...p, [app.id]: e.target.value }))}
                              style={{ ...inputStyle, maxWidth: 200, padding: "8px 10px", fontSize: 13 }} />
                            <button type="button" disabled={adminUserPwLoading === app.id}
                              onClick={() => handleAdminSetUserPassword(app)}
                              style={{ ...btnStyle("#003F5C", "#fff"), opacity: adminUserPwLoading === app.id ? 0.6 : 1 }}>
                              {adminUserPwLoading === app.id ? "…" : "УСТАНОВИТЬ ПАРОЛЬ"}
                            </button>
                          </div>
                          {adminUserPwFeedback[app.id] && (
                            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: adminUserPwFeedback[app.id].includes("Ошибка") || adminUserPwFeedback[app.id].includes("короче") || adminUserPwFeedback[app.id].includes("не совпадают") ? "#DC2626" : "#166534" }}>
                              {adminUserPwFeedback[app.id]}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: mobile ? 8 : 10, alignItems: "flex-start" }}>
                          {!isEditing && (
                            <button onClick={(e) => { e.stopPropagation(); startEdit(app); }}
                              style={btnStyle("#fff", "#003F5C")}>
                              ✎ РЕДАКТИРОВАТЬ
                            </button>
                          )}

                          {app.status !== "approved" && (
                            <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(app.id, app.dbId, "approved"); }}
                              style={btnStyle("#16A34A", "#fff")}>
                              ✓ ОДОБРИТЬ
                            </button>
                          )}
                          {app.status !== "reserve" && (
                            <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(app.id, app.dbId, "reserve"); }}
                              style={btnStyle("#6366F1", "#fff")}>
                              ⏸ В РЕЗЕРВ
                            </button>
                          )}
                          {app.status !== "rejected" && (
                            <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(app.id, app.dbId, "rejected"); }}
                              style={btnStyle("#DC2626", "#fff")}>
                              ✕ ОТКЛОНИТЬ
                            </button>
                          )}
                          {app.status !== "review" && (
                            <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(app.id, app.dbId, "review"); }}
                              style={{ padding: "10px 20px", border: "2px solid #999", backgroundColor: "#fff", color: "#555", fontWeight: 900, fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                              ↺ НА ПРОВЕРКУ
                            </button>
                          )}

                          {revisionTargetId === app.id ? (
                            <div style={{ flexBasis: "100%", display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                              <textarea value={revisionComment} onChange={(e) => setRevisionComment(e.target.value)}
                                placeholder="Укажите, что нужно доработать в заявке..."
                                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                                onClick={(e) => e.stopPropagation()} />
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(app.id, app.dbId, "revision", revisionComment || "Требуется доработка."); }}
                                  style={btnStyle("#F59E0B", "#003F5C")}>
                                  ОТПРАВИТЬ НА ДОРАБОТКУ
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setRevisionTargetId(null); setRevisionComment(""); }}
                                  style={{ padding: "10px 20px", border: "2px solid #999", backgroundColor: "#fff", color: "#555", fontWeight: 900, fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                                  Отмена
                                </button>
                              </div>
                            </div>
                          ) : app.status !== "revision" ? (
                            <button onClick={(e) => { e.stopPropagation(); setRevisionTargetId(app.id); setRevisionComment(app.revisionComment || ""); }}
                              style={btnStyle("#F59E0B", "#003F5C")}>
                              ↩ НА ДОРАБОТКУ
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
