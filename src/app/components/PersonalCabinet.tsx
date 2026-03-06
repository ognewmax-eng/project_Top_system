import React, { useMemo } from "react";

interface PersonalCabinetProps {
  onBack: () => void;
  userData: Record<string, string> | null;
}

/** Заявка из хранилища (то же, что в панели администратора) */
interface StoredApplication {
  id: string;
  fullName?: string;
  email?: string;
  status: "review" | "approved" | "rejected";
  createdAt: string;
  benefits?: string[];
  [key: string]: unknown;
}

const statusConfig: Record<string, { label: string; color: string; textColor: string; desc: string }> = {
  review: {
    label: "НА ПРОВЕРКЕ",
    color: "#ED7C30",
    textColor: "#000",
    desc: "Ваша заявка получена и находится на рассмотрении. Ожидайте ответа в течение 3 рабочих дней.",
  },
  approved: {
    label: "ОДОБРЕНО",
    color: "#16A34A",
    textColor: "#fff",
    desc: "Поздравляем! Ваша заявка одобрена. Ожидайте направление к работодателю.",
  },
  rejected: {
    label: "ОТКЛОНЕНО",
    color: "#DC2626",
    textColor: "#fff",
    desc: "К сожалению, ваша заявка не прошла проверку. Свяжитесь с куратором для уточнения причин.",
  },
};

const benefitLabels: Record<string, string> = {
  low_income: "МАЛОИМУЩИЕ",
  svo: "ДЕТИ УЧАСТНИКОВ СВО",
  orphan: "ДЕТИ-СИРОТЫ",
  disabled: "ДЕТИ-ИНВАЛИДЫ",
  large_family: "МНОГОДЕТНЫЕ СЕМЬИ",
  none: "БЕЗ ЛЬГОТ",
};

/** Форматирует дату заявки для отображения. Поддерживает ISO и локальный формат DD.MM.YYYY. */
function formatCreatedAt(createdAt: string | undefined): string {
  if (!createdAt) return new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
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
  const fallback = new Date(createdAt);
  return Number.isNaN(fallback.getTime()) ? createdAt : fallback.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getMyApplication(userData: Record<string, string> | null): StoredApplication | null {
  if (!userData?.email) return null;
  const raw = localStorage.getItem("top_applications");
  if (!raw) return null;
  let apps: StoredApplication[];
  try {
    apps = JSON.parse(raw);
  } catch {
    return null;
  }
  const email = String(userData.email).trim().toLowerCase();
  const mine = apps.filter(
    (a) => a.email && String(a.email).trim().toLowerCase() === email
  );
  if (mine.length === 0) return null;
  mine.sort((a, b) => (b.id || "").localeCompare(a.id || ""));
  return mine[0];
}

export function PersonalCabinet({ onBack, userData }: PersonalCabinetProps) {
  const application = useMemo(() => getMyApplication(userData), [userData?.email]);

  const currentStatus = application?.status ?? "review";
  const status = statusConfig[currentStatus];

  const name = userData?.fullName || application?.fullName || "—";
  const registrationDate = formatCreatedAt(application?.createdAt);

  const timelineSteps = useMemo(() => {
    const steps = [
      { label: "Заявка создана", date: registrationDate, done: true, active: false },
      { label: "На проверке", date: registrationDate, done: currentStatus !== "review", active: currentStatus === "review" },
      { label: currentStatus === "approved" ? "Одобрена" : currentStatus === "rejected" ? "Отклонена" : "Одобрена / Отклонена", date: currentStatus === "approved" || currentStatus === "rejected" ? registrationDate : "—", done: currentStatus === "approved" || currentStatus === "rejected", active: false },
      { label: "Направление выдано", date: "—", done: false, active: false },
      { label: "Трудоустроен", date: "—", done: false, active: false },
    ];
    return steps;
  }, [currentStatus, registrationDate]);

  return (
    <div
      style={{
        backgroundColor: "#fff",
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Cabinet header */}
      <div
        style={{
          backgroundColor: "#F8EDAD",
          borderBottom: "2px solid #000",
          padding: "32px 24px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <button
            onClick={onBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              border: "2px solid #000",
              backgroundColor: "transparent",
              color: "#000",
              fontWeight: 900,
              fontSize: 13,
              cursor: "pointer",
              letterSpacing: "0.5px",
              marginBottom: 24,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            ← НАЗАД НА ГЛАВНУЮ
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ color: "rgba(0,0,0,0.5)", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                ЛИЧНЫЙ КАБИНЕТ
              </div>
              <h1
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: "#000",
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {name}
              </h1>
            </div>

            <div
              style={{
                backgroundColor: status.color,
                border: "2px solid #000",
                boxShadow: "4px 4px 0px #000",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: status.textColor,
                }}
              />
              <span
                style={{
                  fontWeight: 900,
                  fontSize: 18,
                  color: status.textColor,
                  letterSpacing: "1px",
                }}
              >
                {status.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 24,
          }}
        >
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Status card */}
            <div style={{ border: "2px solid #000", boxShadow: "4px 4px 0px #000" }}>
              <div
                style={{
                  backgroundColor: status.color,
                  padding: "16px 24px",
                  borderBottom: "2px solid #000",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ fontWeight: 900, fontSize: 16, color: status.textColor }}>
                  СТАТУС ЗАЯВ��КИ: {status.label}
                </span>
              </div>
              <div style={{ padding: "20px 24px" }}>
                <p style={{ fontSize: 15, color: "#333", lineHeight: 1.6, margin: 0 }}>
                  {status.desc}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ border: "2px solid #000", boxShadow: "4px 4px 0px #000" }}>
              <div
                style={{
                  backgroundColor: "#000",
                  padding: "16px 24px",
                  borderBottom: "2px solid #000",
                }}
              >
                <span style={{ fontWeight: 900, fontSize: 16, color: "#fff" }}>
                  ИСТОРИЯ ЗАЯВКИ
                </span>
              </div>
              <div style={{ padding: "24px" }}>
                {timelineSteps.map((step, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                      marginBottom: i < timelineSteps.length - 1 ? 20 : 0,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          border: "2px solid #000",
                          backgroundColor: step.active ? "#ED7C30" : step.done ? "#000" : "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {step.done && !step.active && (
                          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                            <path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" />
                          </svg>
                        )}
                        {step.active && (
                          <div style={{ width: 8, height: 8, backgroundColor: "#000" }} />
                        )}
                      </div>
                      {i < timelineSteps.length - 1 && (
                        <div
                          style={{
                            width: 2,
                            height: 28,
                            backgroundColor: step.done ? "#000" : "#ddd",
                            marginTop: 2,
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: step.active || step.done ? 900 : 400,
                          fontSize: 15,
                          color: step.done || step.active ? "#000" : "#999",
                        }}
                      >
                        {step.label}
                      </div>
                      <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                        {step.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submitted data */}
            <div style={{ border: "2px solid #000", boxShadow: "4px 4px 0px #000" }}>
              <div
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "16px 24px",
                  borderBottom: "2px solid #000",
                }}
              >
                <span style={{ fontWeight: 900, fontSize: 16, color: "#000" }}>
                  ДАННЫЕ ЗАЯВКИ
                </span>
              </div>
              <div style={{ padding: "24px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  {[
                    { label: "ФИО", value: userData?.fullName || "—" },
                    { label: "ДАТА РОЖДЕНИЯ", value: userData?.birthDate ? new Date(userData.birthDate).toLocaleDateString("ru-RU") : "—" },
                    { label: "ПАСПОРТ", value: userData ? `${userData.passportSeries} ${userData.passportNumber}` : "—" },
                    { label: "ТЕЛЕФОН", value: userData?.phone || "—" },
                    { label: "ШКОЛА", value: userData?.school || "—" },
                    { label: "КЛАСС", value: userData?.grade ? `${userData.grade} класс` : "—" },
                  ].map((field) => (
                    <div key={field.label}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: "#666", letterSpacing: "0.5px", marginBottom: 4 }}>
                        {field.label}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#000" }}>
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Номер заявки */}
            <div
              style={{
                border: "2px solid #000",
                boxShadow: "4px 4px 0px #000",
                backgroundColor: "#F8EDAD",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.5)", letterSpacing: "1px", marginBottom: 8 }}>
                НОМЕР ЗАЯВКИ
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#ED7C30", lineHeight: 1, marginBottom: 4 }}>
                {application?.id ? `#${application.id.replace(/^app_/, "")}` : "—"}
              </div>
              <div style={{ fontSize: 12, color: "rgba(0,0,0,0.5)" }}>
                {application?.createdAt ? `от ${formatCreatedAt(application.createdAt)}` : "—"}
              </div>
            </div>

            {/* Льготы */}
            <div style={{ border: "2px solid #000", boxShadow: "4px 4px 0px #000" }}>
              <div
                style={{
                  backgroundColor: "#ED7C30",
                  padding: "16px 24px",
                  borderBottom: "2px solid #000",
                }}
              >
                <span style={{ fontWeight: 900, fontSize: 14, color: "#000" }}>
                  КАТЕГОРИЯ ЛЬГОТ
                </span>
              </div>
              <div style={{ padding: "16px 24px" }}>
                <div
                  style={{
                    border: "2px solid #000",
                    padding: "12px 16px",
                    backgroundColor: "#fff",
                    fontWeight: 900,
                    fontSize: 13,
                  }}
                >
                  {application?.benefits?.length
                    ? application.benefits.map((id) => benefitLabels[id] || id).join(", ")
                    : (userData?.benefits ? (() => {
                        try {
                          const ids = JSON.parse(userData.benefits) as string[];
                          return Array.isArray(ids) ? ids.map((id) => benefitLabels[id] || id).join(", ") : "БЕЗ ЛЬГОТ";
                        } catch {
                          return "БЕЗ ЛЬГОТ";
                        }
                      })() : "БЕЗ ЛЬГОТ")}
                </div>
              </div>
            </div>

            {/* Documents — реальные загруженные файлы из заявки */}
            <div style={{ border: "2px solid #000", boxShadow: "4px 4px 0px #000" }}>
              <div
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "16px 24px",
                  borderBottom: "2px solid #000",
                }}
              >
                <span style={{ fontWeight: 900, fontSize: 14, color: "#000" }}>
                  ЗАГРУЖЕННЫЕ ДОКУМЕНТЫ
                </span>
              </div>
              <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                {(() => {
                  let paths: string[] = [];
                  try {
                    if (userData?.attachments) {
                      const parsed = JSON.parse(userData.attachments);
                      if (Array.isArray(parsed)) paths = parsed;
                    }
                  } catch {
                    paths = [];
                  }
                  const apiBase = typeof window !== "undefined" ? window.location.origin + "/api" : "";
                  if (paths.length === 0) {
                    return (
                      <div style={{ fontSize: 13, color: "#666", fontStyle: "italic" }}>
                        Нет загруженных документов
                      </div>
                    );
                  }
                  return paths.map((path, i) => {
                    const name = path.split("/").pop() || path;
                    const href = `${apiBase}/${path}`;
                    return (
                      <a
                        key={i}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          border: "2px solid #000",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#000",
                          textDecoration: "none",
                          backgroundColor: "#fff",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#F8EDAD";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#fff";
                        }}
                      >
                        <span>📄</span>
                        <span style={{ wordBreak: "break-all" }}>{name}</span>
                        <span style={{ marginLeft: "auto", fontSize: 11, color: "#666" }}>открыть</span>
                      </a>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Support */}
            <div
              style={{
                border: "2px solid #000",
                padding: "20px",
                backgroundColor: "#f5f5f5",
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 12 }}>
                НУЖНА ПОМОЩЬ?
              </div>
              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.5, marginBottom: 16 }}>
                Свяжитесь с куратором программы по телефону или email.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a
                  href="tel:88001234567"
                  style={{
                    display: "block",
                    padding: "10px 16px",
                    border: "2px solid #000",
                    backgroundColor: "#fff",
                    fontWeight: 900,
                    fontSize: 13,
                    color: "#000",
                    textDecoration: "none",
                    textAlign: "center",
                    boxShadow: "2px 2px 0px #000",
                  }}
                >
                  8 800 123-45-67
                </a>
                <a
                  href="mailto:help@trudovoelete.ru"
                  style={{
                    display: "block",
                    padding: "10px 16px",
                    border: "2px solid #000",
                    backgroundColor: "#F8EDAD",
                    fontWeight: 900,
                    fontSize: 12,
                    color: "#000",
                    textDecoration: "none",
                    textAlign: "center",
                    letterSpacing: "0.3px",
                  }}
                >
                  НАПИСАТЬ КУРАТОРУ
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}