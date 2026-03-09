import React, { useMemo, useState, useRef, useEffect } from "react";
import { uploadFiles, getFileUrl, getMyApplication, submitRevision } from "@/api/apiService";
import type { ApplicationData } from "@/api/apiService";

interface PersonalCabinetProps {
  onBack: () => void;
  userData: Record<string, string> | null;
  onDataUpdate?: () => void;
}

const statusConfig: Record<string, { label: string; color: string; textColor: string; desc: string }> = {
  review: {
    label: "НА ПРОВЕРКЕ",
    color: "#ED7C30",
    textColor: "#000",
    desc: "Ваша заявка получена и находится на рассмотрении. Ожидайте ответа в течение 3 рабочих дней.",
  },
  revision: {
    label: "НА ДОРАБОТКЕ",
    color: "#F59E0B",
    textColor: "#000",
    desc: "Администратор вернул заявку на доработку. Внесите правки и отправьте заявку снова.",
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

function formatCreatedAt(createdAt: string | undefined): string {
  if (!createdAt) return new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  if (createdAt.includes("T") || createdAt.includes("-")) {
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

export function PersonalCabinet({ onBack, userData, onDataUpdate }: PersonalCabinetProps) {
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setAppLoading(true);
    getMyApplication()
      .then((app) => {
        if (!cancelled) setApplication(app);
      })
      .catch(() => {
        if (!cancelled) setApplication(null);
      })
      .finally(() => {
        if (!cancelled) setAppLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const currentStatus = application?.status ?? "review";
  const status = statusConfig[currentStatus];

  const [editForm, setEditForm] = useState<Record<string, string>>(() => ({ ...(userData || {}) } as Record<string, string>));
  const [revisionFiles, setRevisionFiles] = useState<File[]>([]);
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);
  const [revisionError, setRevisionError] = useState("");
  const [revisionSuccess, setRevisionSuccess] = useState(false);
  const revisionFileInputRef = useRef<HTMLInputElement>(null);

  const name = userData?.fullName || application?.fullName || "—";
  const registrationDate = formatCreatedAt(application?.createdAt);

  const timelineSteps = useMemo(() => {
    const steps = [
      { label: "Заявка создана", date: registrationDate, done: true, active: false },
      { label: "На проверке", date: registrationDate, done: currentStatus !== "review", active: currentStatus === "review" },
      { label: currentStatus === "revision" ? "На доработке" : currentStatus === "approved" ? "Одобрена" : currentStatus === "rejected" ? "Отклонена" : "Одобрена / Отклонена", date: ["revision", "approved", "rejected"].includes(currentStatus) ? registrationDate : "—", done: ["revision", "approved", "rejected"].includes(currentStatus), active: currentStatus === "revision" },
      { label: "Направление выдано", date: "—", done: false, active: false },
      { label: "Трудоустроен", date: "—", done: false, active: false },
    ];
    return steps;
  }, [currentStatus, registrationDate]);

  if (appLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontWeight: 900, fontSize: 18, color: "#666" }}>ЗАГРУЗКА…</div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ backgroundColor: "#F8EDAD", borderBottom: "2px solid #000", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <button
            onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: "2px solid #000", backgroundColor: "transparent", color: "#000", fontWeight: 900, fontSize: 13, cursor: "pointer", letterSpacing: "0.5px", marginBottom: 24, fontFamily: "'Inter', sans-serif" }}
          >
            ← НАЗАД НА ГЛАВНУЮ
          </button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ color: "rgba(0,0,0,0.5)", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>ЛИЧНЫЙ КАБИНЕТ</div>
              <h1 style={{ fontSize: 36, fontWeight: 900, color: "#000", margin: 0, lineHeight: 1 }}>{name}</h1>
            </div>
            <div style={{ backgroundColor: status.color, border: "2px solid #000", boxShadow: "4px 4px 0px #000", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: status.textColor }} />
              <span style={{ fontWeight: 900, fontSize: 18, color: status.textColor, letterSpacing: "1px" }}>{status.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {revisionSuccess && (
              <div style={{ padding: "16px 24px", backgroundColor: "#DCFCE7", border: "2px solid #16A34A", fontWeight: 900, fontSize: 15, color: "#166534" }}>
                ✓ Доработанная заявка отправлена. Статус заявки: На проверке.
              </div>
            )}

            <div style={{ border: "2px solid #000", boxShadow: "4px 4px 0px #000" }}>
              <div style={{ backgroundColor: status.color, padding: "16px 24px", borderBottom: "2px solid #000", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontWeight: 900, fontSize: 16, color: status.textColor }}>СТАТУС ЗАЯВКИ: {status.label}</span>
              </div>
              <div style={{ padding: "20px 24px" }}>
                <p style={{ fontSize: 15, color: "#333", lineHeight: 1.6, margin: 0 }}>{status.desc}</p>
                {currentStatus === "revision" && application?.revisionComment && (
                  <div style={{ marginTop: 16, padding: "12px 16px", backgroundColor: "#FEF3C7", border: "2px solid #F59E0B" }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: "#92400E", letterSpacing: "0.5px", marginBottom: 6 }}>КОММЕНТАРИЙ АДМИНИСТРАТОРА</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#000", whiteSpace: "pre-wrap" }}>{application.revisionComment}</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ border: "2px solid #000", boxShadow: "4px 4px 0px #000" }}>
              <div style={{ backgroundColor: "#000", padding: "16px 24px", borderBottom: "2px solid #000" }}>
                <span style={{ fontWeight: 900, fontSize: 16, color: "#fff" }}>ИСТОРИЯ ЗАЯВКИ</span>
              </div>
              <div style={{ padding: "24px" }}>
                {timelineSteps.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: i < timelineSteps.length - 1 ? 20 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div style={{ width: 24, height: 24, border: "2px solid #000", backgroundColor: step.active ? "#ED7C30" : step.done ? "#000" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {step.done && !step.active && (
                          <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" /></svg>
                        )}
                        {step.active && <div style={{ width: 8, height: 8, backgroundColor: "#000" }} />}
                      </div>
                      {i < timelineSteps.length - 1 && <div style={{ width: 2, height: 28, backgroundColor: step.done ? "#000" : "#ddd", marginTop: 2 }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: step.active || step.done ? 900 : 400, fontSize: 15, color: step.done || step.active ? "#000" : "#999" }}>{step.label}</div>
                      <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{step.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: "2px solid #000", boxShadow: "4px 4px 0px #000" }}>
              <div style={{ backgroundColor: "#f5f5f5", padding: "16px 24px", borderBottom: "2px solid #000" }}>
                <span style={{ fontWeight: 900, fontSize: 16, color: "#000" }}>ДАННЫЕ ЗАЯВКИ</span>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {[
                    { label: "ФИО", value: application?.fullName || userData?.fullName || "—" },
                    { label: "ДАТА РОЖДЕНИЯ", value: (application?.birthDate || userData?.birthDate) ? new Date(application?.birthDate || userData?.birthDate || "").toLocaleDateString("ru-RU") : "—" },
                    { label: "ПАСПОРТ", value: `${application?.passportSeries || userData?.passportSeries || ""} ${application?.passportNumber || userData?.passportNumber || ""}`.trim() || "—" },
                    { label: "ТЕЛЕФОН", value: application?.phone || userData?.phone || "—" },
                    { label: "ШКОЛА", value: application?.school || userData?.school || "—" },
                    { label: "КЛАСС", value: (application?.grade || userData?.grade) ? `${application?.grade || userData?.grade} класс` : "—" },
                  ].map((field) => (
                    <div key={field.label}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: "#666", letterSpacing: "0.5px", marginBottom: 4 }}>{field.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#000" }}>{field.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {currentStatus === "revision" && application && (
              <div style={{ border: "2px solid #F59E0B", boxShadow: "4px 4px 0px #000" }}>
                <div style={{ backgroundColor: "#F59E0B", padding: "16px 24px", borderBottom: "2px solid #000" }}>
                  <span style={{ fontWeight: 900, fontSize: 16, color: "#000" }}>ДОРАБОТАТЬ ЗАЯВКУ</span>
                </div>
                <div style={{ padding: "24px" }}>
                  <p style={{ fontSize: 13, color: "#555", marginBottom: 20 }}>
                    Внесите правки в поля ниже и при необходимости догрузите файлы. После нажатия «Отправить доработанную заявку» заявка снова попадёт на проверку.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                    {[
                      { key: "fullName", label: "ФИО", type: "text", placeholder: "Иванов Иван Иванович" },
                      { key: "birthDate", label: "Дата рождения", type: "date" },
                      { key: "passportSeries", label: "Серия паспорта", type: "text", placeholder: "0000" },
                      { key: "passportNumber", label: "Номер паспорта", type: "text", placeholder: "000000" },
                      { key: "address", label: "Адрес", type: "text", placeholder: "г. Москва, ул. Пример, д. 1" },
                      { key: "school", label: "Школа", type: "text", placeholder: "ГБОУ Школа №..." },
                      { key: "grade", label: "Класс", type: "select", options: ["7", "8", "9", "10", "11"] },
                      { key: "shift", label: "Смена", type: "select", options: [{ v: "1", l: "1 смена" }, { v: "2", l: "2 смена" }, { v: "3", l: "3 смена" }] },
                      { key: "phone", label: "Телефон", type: "tel", placeholder: "+7 (___) ___-__-__" },
                      { key: "email", label: "Email", type: "email", placeholder: "example@mail.ru" },
                    ].map((f) => (
                      <div key={f.key} style={{ gridColumn: f.key === "address" ? "1 / -1" : undefined }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 900, color: "#666", marginBottom: 4 }}>{f.label}</label>
                        {f.type === "select" ? (
                          <select
                            value={editForm[f.key] || ""}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                            style={{ width: "100%", padding: "10px 12px", border: "2px solid #000", fontSize: 14, fontFamily: "'Inter', sans-serif" }}
                          >
                            <option value="">{f.key === "shift" ? "Выберите смену" : "Выберите класс"}</option>
                            {Array.isArray(f.options) && (f.options as { v: string; l: string }[])[0]?.v
                              ? (f.options as { v: string; l: string }[]).map((opt) => <option key={opt.v} value={opt.v}>{opt.l}</option>)
                              : (f.options as string[] || []).map((opt) => <option key={opt} value={opt}>{opt} класс</option>)}
                          </select>
                        ) : (
                          <input
                            type={f.type as "text"}
                            value={editForm[f.key] || ""}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                            placeholder={(f as { placeholder?: string }).placeholder}
                            style={{ width: "100%", padding: "10px 12px", border: "2px solid #000", fontSize: 14, fontFamily: "'Inter', sans-serif", boxSizing: "border-box" }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 900, color: "#666", marginBottom: 8 }}>ДОБАВИТЬ ФАЙЛЫ (при необходимости)</label>
                    <div
                      onClick={() => revisionFileInputRef.current?.click()}
                      style={{ border: "2px dashed #000", padding: "20px", textAlign: "center", cursor: "pointer", backgroundColor: "#fafafa", fontSize: 13, fontWeight: 700 }}
                    >
                      {revisionFiles.length > 0 ? `Выбрано файлов: ${revisionFiles.length}` : "Нажмите или перетащите файлы сюда"}
                    </div>
                    <input
                      ref={revisionFileInputRef}
                      type="file"
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => e.target.files && setRevisionFiles((prev) => [...prev, ...Array.from(e.target.files!)])}
                    />
                  </div>
                  {revisionError && (
                    <div style={{ marginBottom: 16, padding: "10px 12px", backgroundColor: "#FEF2F2", border: "2px solid #DC2626", fontSize: 13, fontWeight: 700, color: "#DC2626" }}>
                      {revisionError}
                    </div>
                  )}
                  <button
                    onClick={async () => {
                      setRevisionError("");
                      setRevisionSubmitting(true);
                      try {
                        let existingPaths: string[] = [];
                        try {
                          const att = editForm.attachments || application?.attachments || "[]";
                          const parsed = JSON.parse(att);
                          if (Array.isArray(parsed)) existingPaths = parsed;
                        } catch { /* ignore */ }
                        let newPaths: string[] = [];
                        if (revisionFiles.length > 0) {
                          try {
                            const res = await uploadFiles(revisionFiles, {
                              shift: editForm.shift || application?.shift || "1",
                              fullName: (editForm.fullName || application?.fullName || "").trim() || "Участник",
                            });
                            if (res.results) newPaths = res.results.filter((r) => r.saved && r.path).map((r) => r.path!);
                          } catch {
                            newPaths = [];
                          }
                        }
                        const allPaths = [...existingPaths, ...newPaths];
                        await submitRevision({
                          fullName: editForm.fullName || "",
                          birthDate: editForm.birthDate || "",
                          passportSeries: editForm.passportSeries || "",
                          passportNumber: editForm.passportNumber || "",
                          address: editForm.address || "",
                          school: editForm.school || "",
                          grade: editForm.grade || "",
                          phone: editForm.phone || "",
                          email: editForm.email || "",
                          shift: editForm.shift || "",
                          benefits: editForm.benefits || userData?.benefits || "[]",
                          attachments: JSON.stringify(allPaths),
                        });
                        setRevisionFiles([]);
                        setRevisionSuccess(true);
                        const updatedApp = await getMyApplication();
                        if (updatedApp) setApplication(updatedApp);
                        onDataUpdate?.();
                        setTimeout(() => setRevisionSuccess(false), 5000);
                      } catch (err) {
                        setRevisionError(err instanceof Error ? err.message : "Ошибка при отправке. Попробуйте ещё раз.");
                      } finally {
                        setRevisionSubmitting(false);
                      }
                    }}
                    disabled={revisionSubmitting}
                    style={{
                      width: "100%", padding: "14px", fontSize: 16, fontWeight: 900, color: "#000",
                      backgroundColor: revisionSubmitting ? "#ccc" : "#F59E0B", border: "2px solid #000",
                      boxShadow: "4px 4px 0px #000", cursor: revisionSubmitting ? "not-allowed" : "pointer",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {revisionSubmitting ? "Отправка…" : "ОТПРАВИТЬ ДОРАБОТАННУЮ ЗАЯВКУ"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ border: "2px solid #000", boxShadow: "4px 4px 0px #000", backgroundColor: "#F8EDAD", padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.5)", letterSpacing: "1px", marginBottom: 8 }}>НОМЕР ЗАЯВКИ</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#ED7C30", lineHeight: 1, marginBottom: 4 }}>
                {application?.id ? `#${application.id.replace(/^app_/, "")}` : "—"}
              </div>
              <div style={{ fontSize: 12, color: "rgba(0,0,0,0.5)" }}>
                {application?.createdAt ? `от ${formatCreatedAt(application.createdAt)}` : "—"}
              </div>
            </div>

            <div style={{ border: "2px solid #000", boxShadow: "4px 4px 0px #000" }}>
              <div style={{ backgroundColor: "#ED7C30", padding: "16px 24px", borderBottom: "2px solid #000" }}>
                <span style={{ fontWeight: 900, fontSize: 14, color: "#000" }}>КАТЕГОРИЯ ЛЬГОТ</span>
              </div>
              <div style={{ padding: "16px 24px" }}>
                <div style={{ border: "2px solid #000", padding: "12px 16px", backgroundColor: "#fff", fontWeight: 900, fontSize: 13 }}>
                  {application?.benefits?.length
                    ? application.benefits.map((id) => benefitLabels[id] || id).join(", ")
                    : (userData?.benefits ? (() => {
                        try {
                          const ids = JSON.parse(userData.benefits) as string[];
                          return Array.isArray(ids) ? ids.map((id) => benefitLabels[id] || id).join(", ") : "БЕЗ ЛЬГОТ";
                        } catch { return "БЕЗ ЛЬГОТ"; }
                      })() : "БЕЗ ЛЬГОТ")}
                </div>
              </div>
            </div>

            <div style={{ border: "2px solid #000", boxShadow: "4px 4px 0px #000" }}>
              <div style={{ backgroundColor: "#f5f5f5", padding: "16px 24px", borderBottom: "2px solid #000" }}>
                <span style={{ fontWeight: 900, fontSize: 14, color: "#000" }}>ЗАГРУЖЕННЫЕ ДОКУМЕНТЫ</span>
              </div>
              <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                {(() => {
                  let paths: string[] = [];
                  try {
                    const att = application?.attachments || userData?.attachments || "[]";
                    const parsed = JSON.parse(att);
                    if (Array.isArray(parsed)) paths = parsed;
                  } catch { paths = []; }
                  if (paths.length === 0) {
                    return <div style={{ fontSize: 13, color: "#666", fontStyle: "italic" }}>Нет загруженных документов</div>;
                  }
                  return paths.map((path, i) => {
                    const nameStr = path.split("/").pop() || path;
                    const href = getFileUrl(path);
                    return (
                      <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "2px solid #000", fontSize: 12, fontWeight: 700, color: "#000", textDecoration: "none", backgroundColor: "#fff", transition: "background 0.15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F8EDAD"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}
                      >
                        <span>📄</span>
                        <span style={{ wordBreak: "break-all" }}>{nameStr}</span>
                        <span style={{ marginLeft: "auto", fontSize: 11, color: "#666" }}>открыть</span>
                      </a>
                    );
                  });
                })()}
              </div>
            </div>

            <div style={{ border: "2px solid #000", padding: "20px", backgroundColor: "#f5f5f5" }}>
              <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 12 }}>НУЖНА ПОМОЩЬ?</div>
              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.5, marginBottom: 16 }}>Свяжитесь с куратором программы по телефону или email.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href="tel:88001234567" style={{ display: "block", padding: "10px 16px", border: "2px solid #000", backgroundColor: "#fff", fontWeight: 900, fontSize: 13, color: "#000", textDecoration: "none", textAlign: "center", boxShadow: "2px 2px 0px #000" }}>
                  8 800 123-45-67
                </a>
                <a href="mailto:help@trudovoelete.ru" style={{ display: "block", padding: "10px 16px", border: "2px solid #000", backgroundColor: "#F8EDAD", fontWeight: 900, fontSize: 12, color: "#000", textDecoration: "none", textAlign: "center", letterSpacing: "0.3px" }}>
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
