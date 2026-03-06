import React, { useState, useEffect } from "react";

interface Application {
  id: string;
  fullName: string;
  birthDate: string;
  passportSeries: string;
  passportNumber: string;
  address: string;
  school: string;
  grade: string;
  phone: string;
  email: string;
  benefits: string[];
  status: "review" | "approved" | "rejected";
  createdAt: string;
}

interface AdminPanelProps {
  onBack: () => void;
}

const ADMIN_PASSWORD = "admin123";

const statusLabels: Record<string, { label: string; color: string; text: string }> = {
  review:   { label: "НА ПРОВЕРКЕ", color: "#ED7C30", text: "#000" },
  approved: { label: "ОДОБРЕНО",    color: "#16A34A", text: "#fff" },
  rejected: { label: "ОТКЛОНЕНО",   color: "#DC2626", text: "#fff" },
};

function formatCreatedAt(createdAt: string): string {
  if (!createdAt) return "—";
  if (createdAt.includes("T")) {
    const d = new Date(createdAt);
    return Number.isNaN(d.getTime()) ? createdAt : d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  const match = createdAt.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(d.getTime()) ? createdAt : d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  const d = new Date(createdAt);
  return Number.isNaN(d.getTime()) ? createdAt : d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getApplications(): Application[] {
  const raw = localStorage.getItem("top_applications");
  return raw ? JSON.parse(raw) : [];
}

function saveApplications(apps: Application[]) {
  localStorage.setItem("top_applications", JSON.stringify(apps));
  const approved = apps.filter((a) => a.status === "approved").length;
  localStorage.setItem("top_approved_count", String(approved));
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const [authed, setAuthed]           = useState(false);
  const [pwInput, setPwInput]         = useState("");
  const [pwError, setPwError]         = useState(false);
  const [showPw, setShowPw]           = useState(false);
  const [apps, setApps]               = useState<Application[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "review" | "approved" | "rejected">("all");
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  useEffect(() => {
    if (authed) setApps(getApplications());
  }, [authed]);

  const handleLogin = () => {
    if (pwInput === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  };

  const updateStatus = (id: string, status: "review" | "approved" | "rejected") => {
    const updated = apps.map((a) => (a.id === id ? { ...a, status } : a));
    setApps(updated);
    saveApplications(updated);
  };

  const filtered = filterStatus === "all" ? apps : apps.filter((a) => a.status === filterStatus);

  const counts = {
    all:      apps.length,
    review:   apps.filter((a) => a.status === "review").length,
    approved: apps.filter((a) => a.status === "approved").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #000",
    backgroundColor: "#fff",
    fontSize: 15,
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  // ──────────────── LOGIN SCREEN ────────────────
  if (!authed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#fff",
          fontFamily: "'Inter', sans-serif",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header strip */}
        <div style={{ backgroundColor: "#000", borderBottom: "2px solid #000", padding: "20px 24px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36, height: 36,
                  backgroundColor: "#ED7C30",
                  border: "2px solid #fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span style={{ color: "#000", fontWeight: 900, fontSize: 11 }}>ТОП</span>
              </div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: "0.5px" }}>
                ПАНЕЛЬ АДМИНИСТРАТОРА
              </div>
            </div>
            <button
              onClick={onBack}
              style={{
                padding: "8px 16px",
                border: "2px solid #fff",
                backgroundColor: "transparent",
                color: "#fff",
                fontWeight: 900,
                fontSize: 12,
                cursor: "pointer",
                letterSpacing: "0.5px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              ← НА ГЛАВНУЮ
            </button>
          </div>
        </div>

        {/* Login form */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div
            style={{
              width: "100%",
              maxWidth: 400,
              border: "2px solid #000",
              boxShadow: "8px 8px 0px #000",
            }}
          >
            <div
              style={{
                backgroundColor: "#000",
                padding: "20px 28px",
                borderBottom: "2px solid #000",
              }}
            >
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 900, letterSpacing: "1px", marginBottom: 4 }}>
                ДОСТУП ОГРАНИЧЕН
              </div>
              <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px" }}>
                ВХОД ДЛЯ АДМИНИСТРАТОРА
              </div>
            </div>

            <div style={{ padding: 28 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 900, marginBottom: 8, letterSpacing: "0.5px" }}>
                  ПАРОЛЬ АДМИНИСТРАТОРА
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={pwInput}
                    onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
                    placeholder="••••••••••"
                    style={{ ...inputStyle, paddingRight: 48 }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <button
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: "absolute", right: 12, top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0,
                    }}
                  >
                    {showPw ? "🙈" : "👁"}
                  </button>
                </div>
                {pwError && (
                  <div style={{
                    marginTop: 8, padding: "8px 12px",
                    backgroundColor: "#FEF2F2", border: "2px solid #DC2626",
                    fontSize: 13, fontWeight: 700, color: "#DC2626",
                  }}>
                    ⚠ Неверный пароль
                  </div>
                )}
              </div>

              <button
                onClick={handleLogin}
                style={{
                  width: "100%", padding: "14px",
                  fontSize: 15, fontWeight: 900,
                  color: "#fff", backgroundColor: "#000",
                  border: "2px solid #000",
                  boxShadow: "5px 5px 0px #ED7C30",
                  cursor: "pointer", letterSpacing: "1px",
                  transition: "all 0.1s",
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translate(2px,2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "3px 3px 0px #ED7C30";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translate(0,0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "5px 5px 0px #ED7C30";
                }}
              >
                ВОЙТИ В ПАНЕЛЬ
              </button>

              <p style={{ fontSize: 12, color: "#aaa", marginTop: 16, textAlign: "center" }}>
                Демо-пароль: <strong style={{ color: "#000" }}>admin123</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────── ADMIN DASHBOARD ────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5", fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div style={{ backgroundColor: "#000", borderBottom: "2px solid #000", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, backgroundColor: "#ED7C30", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#000", fontWeight: 900, fontSize: 10 }}>ТОП</span>
              </div>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 15, letterSpacing: "0.5px" }}>
                ПАНЕЛЬ АДМИНИСТРАТОРА
              </span>
            </div>
            <div style={{ width: 1, height: 24, backgroundColor: "rgba(255,255,255,0.2)" }} />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700 }}>
              УПРАВЛЕНИЕ ЗАЯВКАМИ
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setApps(getApplications())}
              style={{
                padding: "6px 14px",
                border: "2px solid rgba(255,255,255,0.3)",
                backgroundColor: "transparent",
                color: "#fff", fontWeight: 900, fontSize: 12,
                cursor: "pointer", letterSpacing: "0.5px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              ↻ ОБНОВИТЬ
            </button>
            <button
              onClick={onBack}
              style={{
                padding: "6px 14px",
                border: "2px solid #ED7C30",
                backgroundColor: "transparent",
                color: "#ED7C30", fontWeight: 900, fontSize: 12,
                cursor: "pointer", letterSpacing: "0.5px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              ← НА ГЛАВНУЮ
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { key: "all",      label: "ВСЕГО ЗАЯВОК",    count: counts.all,      bg: "#fff",     border: "#000" },
            { key: "review",   label: "НА ПРОВЕРКЕ",     count: counts.review,   bg: "#F8EDAD",  border: "#000" },
            { key: "approved", label: "ОДОБРЕНО",        count: counts.approved, bg: "#DCFCE7",  border: "#16A34A" },
            { key: "rejected", label: "ОТКЛОНЕНО",       count: counts.rejected, bg: "#FEF2F2",  border: "#DC2626" },
          ].map((stat) => (
            <div
              key={stat.key}
              onClick={() => setFilterStatus(stat.key as typeof filterStatus)}
              style={{
                border: `2px solid ${filterStatus === stat.key ? "#000" : stat.border}`,
                boxShadow: filterStatus === stat.key ? "4px 4px 0px #000" : "2px 2px 0px #ccc",
                backgroundColor: stat.bg,
                padding: "20px 24px",
                cursor: "pointer",
                transform: filterStatus === stat.key ? "translate(-1px,-1px)" : "none",
                transition: "all 0.1s",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "1px", color: "#666", marginBottom: 8 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: "#000" }}>
                {stat.count}
              </div>
            </div>
          ))}
        </div>

        {/* Applications list */}
        <div style={{ border: "2px solid #000", boxShadow: "4px 4px 0px #000", backgroundColor: "#fff" }}>
          {/* List header */}
          <div style={{ backgroundColor: "#000", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 15, letterSpacing: "0.5px" }}>
              ЗАЯВКИ {filterStatus !== "all" && `— ${statusLabels[filterStatus]?.label}`}
            </span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 700 }}>
              {filtered.length} из {apps.length}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center", color: "#aaa" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>ЗАЯВОК НЕТ</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>
                {apps.length === 0
                  ? "Пока никто не подал заявку. Зарегистрированные участники появятся здесь."
                  : "Нет заявок с таким статусом."}
              </div>
            </div>
          ) : (
            <div>
              {filtered.map((app, idx) => {
                const st = statusLabels[app.status];
                const isExpanded = expandedId === app.id;
                const isLast = idx === filtered.length - 1;

                return (
                  <div
                    key={app.id}
                    style={{ borderBottom: !isLast ? "2px solid #000" : "none" }}
                  >
                    {/* Row */}
                    <div
                      style={{
                        padding: "18px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        cursor: "pointer",
                        backgroundColor: isExpanded ? "#fafafa" : "#fff",
                        transition: "background 0.1s",
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                    >
                      {/* Index */}
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#aaa", width: 32, flexShrink: 0 }}>
                        #{idx + 1}
                      </div>

                      {/* Name + email */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: 15, color: "#000", marginBottom: 2 }}>
                          {app.fullName || "—"}
                        </div>
                        <div style={{ fontSize: 12, color: "#888", fontWeight: 700 }}>
                          {app.email} · {app.phone}
                        </div>
                      </div>

                      {/* School */}
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#555", flexShrink: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                        <span>{app.school || "—"}</span>
                        <span style={{ color: "#aaa" }}>{app.grade ? `${app.grade} класс` : ""}</span>
                      </div>

                      {/* Date */}
                      <div style={{ fontSize: 11, color: "#aaa", fontWeight: 700, flexShrink: 0 }}>
                        {formatCreatedAt(app.createdAt)}
                      </div>

                      {/* Status badge */}
                      <div
                        style={{
                          backgroundColor: st.color,
                          border: "2px solid #000",
                          padding: "4px 12px",
                          fontSize: 11,
                          fontWeight: 900,
                          color: st.text,
                          letterSpacing: "0.5px",
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {st.label}
                      </div>

                      {/* Expand arrow */}
                      <div style={{ fontSize: 14, color: "#aaa", flexShrink: 0, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "none" }}>
                        ▼
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{ backgroundColor: "#fafafa", borderTop: "2px dashed #ccc", padding: "24px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24 }}>
                          {[
                            { label: "ФИО",              value: app.fullName },
                            { label: "ДАТА РОЖДЕНИЯ",    value: app.birthDate ? new Date(app.birthDate).toLocaleDateString("ru-RU") : "—" },
                            { label: "ПАСПОРТ",          value: `${app.passportSeries} ${app.passportNumber}` },
                            { label: "ТЕЛЕФОН",          value: app.phone },
                            { label: "EMAIL",            value: app.email },
                            { label: "АДРЕС",            value: app.address },
                            { label: "ШКОЛА",            value: app.school },
                            { label: "КЛАСС",            value: app.grade ? `${app.grade} класс` : "—" },
                            { label: "ЛЬГОТЫ",           value: app.benefits?.length ? app.benefits.join(", ") : "БЕЗ ЛЬГОТ" },
                          ].map((f) => (
                            <div key={f.label}>
                              <div style={{ fontSize: 11, fontWeight: 900, color: "#888", letterSpacing: "0.5px", marginBottom: 4 }}>
                                {f.label}
                              </div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "#000" }}>
                                {f.value || "—"}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Action buttons */}
                        {app.status === "review" && (
                          <div style={{ display: "flex", gap: 12 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateStatus(app.id, "approved"); }}
                              style={{
                                padding: "10px 24px",
                                border: "2px solid #000",
                                backgroundColor: "#16A34A",
                                color: "#fff",
                                fontWeight: 900,
                                fontSize: 13,
                                cursor: "pointer",
                                letterSpacing: "0.5px",
                                boxShadow: "3px 3px 0px #000",
                                fontFamily: "'Inter', sans-serif",
                                transition: "all 0.1s",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.transform = "translate(1px,1px)";
                                (e.currentTarget as HTMLElement).style.boxShadow = "2px 2px 0px #000";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.transform = "translate(0,0)";
                                (e.currentTarget as HTMLElement).style.boxShadow = "3px 3px 0px #000";
                              }}
                            >
                              ✓ ОДОБРИТЬ
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateStatus(app.id, "rejected"); }}
                              style={{
                                padding: "10px 24px",
                                border: "2px solid #000",
                                backgroundColor: "#DC2626",
                                color: "#fff",
                                fontWeight: 900,
                                fontSize: 13,
                                cursor: "pointer",
                                letterSpacing: "0.5px",
                                boxShadow: "3px 3px 0px #000",
                                fontFamily: "'Inter', sans-serif",
                                transition: "all 0.1s",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.transform = "translate(1px,1px)";
                                (e.currentTarget as HTMLElement).style.boxShadow = "2px 2px 0px #000";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.transform = "translate(0,0)";
                                (e.currentTarget as HTMLElement).style.boxShadow = "3px 3px 0px #000";
                              }}
                            >
                              ✕ ОТКЛОНИТЬ
                            </button>
                          </div>
                        )}
                        {app.status !== "review" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateStatus(app.id, "review"); }}
                            style={{
                              padding: "8px 20px",
                              border: "2px solid #999",
                              backgroundColor: "#fff",
                              color: "#555",
                              fontWeight: 900,
                              fontSize: 12,
                              cursor: "pointer",
                              letterSpacing: "0.5px",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            ↺ ВЕРНУТЬ НА ПРОВЕРКУ
                          </button>
                        )}
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
