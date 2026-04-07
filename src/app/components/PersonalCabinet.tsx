import React, { useMemo, useState, useRef, useEffect } from "react";
import { uploadFiles, getFileUrl, getMyApplication, submitRevision } from "@/api/apiService";
import type { ApplicationData } from "@/api/apiService";
import { parseAttachmentsJson, type AttachmentItem } from "@/utils/attachments";
import { useIsMobile } from "@/hooks/useIsMobile";

interface PersonalCabinetProps {
  onBack: () => void;
  onLogout: () => void;
  userData: Record<string, string> | null;
  onDataUpdate?: () => void;
}

const shiftDetailLabels: Record<string, string> = {
  "1": "1 июня — 19 июня",
  "2": "6 июля — 23 июля",
  "3": "3 августа — 20 августа",
};

const statusConfig: Record<string, { label: string; color: string; textColor: string; desc: string }> = {
  review: {
    label: "НА ПРОВЕРКЕ",
    color: "#879E82",
    textColor: "#003F5C",
    desc: "Ваша заявка получена и находится на рассмотрении. Ожидайте ответа в течение 10 рабочих дней.",
  },
  revision: {
    label: "НА ДОРАБОТКЕ",
    color: "#F59E0B",
    textColor: "#003F5C",
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
  reserve: {
    label: "В РЕЗЕРВЕ",
    color: "#6366F1",
    textColor: "#fff",
    desc: "Ваша заявка находится в резерве. В случае освобождения мест, ваша заявка будет одобрена.",
  },
};

const benefitLabels: Record<string, string> = {
  low_income: "МАЛОИМУЩИЕ",
  svo: "ДЕТИ УЧАСТНИКОВ СВО",
  orphan: "ДЕТИ-СИРОТЫ",
  disabled: "ДЕТИ-ИНВАЛИДЫ",
  ovz: "ДЕТИ ОВЗ",
  combat_veteran: "ВЕТЕРАНЫ БД",
  kmns: "КМНС",
  preventive: "ПРОФИЛАКТИЧЕСКИЙ УЧЁТ",
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

export function PersonalCabinet({ onBack, onLogout, userData, onDataUpdate }: PersonalCabinetProps) {
  const mobile = useIsMobile();
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
  const status = statusConfig[currentStatus] ?? statusConfig.review;

  const [editForm, setEditForm] = useState<Record<string, string>>(() => ({ ...(userData || {}) } as Record<string, string>));
  const [revisionFiles, setRevisionFiles] = useState<File[]>([]);
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);
  const [revisionError, setRevisionError] = useState("");
  const [revisionSuccess, setRevisionSuccess] = useState(false);
  const revisionFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!application) return;
    setEditForm({
      fullName: application.fullName || "",
      birthDate: application.birthDate || "",
      passportSeries: application.passportSeries || "",
      passportNumber: application.passportNumber || "",
      address: application.address || "",
      school: application.school || "",
      grade: application.grade || "",
      shift: application.shift || "",
      phone: application.phone || "",
      email: application.email || "",
      parentFullName: application.parentFullName ?? "",
      parentBirthDate: application.parentBirthDate ?? "",
      parentPhone: application.parentPhone ?? "",
      parentAddress: application.parentAddress ?? "",
      parentWorkplace: application.parentWorkplace ?? "",
      benefits: JSON.stringify(application.benefits || []),
      attachments: application.attachments || "[]",
    });
  }, [application]);

  const name = userData?.fullName || application?.fullName || "—";
  const registrationDate = formatCreatedAt(application?.createdAt);
  const shiftNum = application?.shift || userData?.shift || "";
  const shiftLine = shiftNum
    ? `Смена № ${shiftNum}${shiftDetailLabels[shiftNum] ? ` (${shiftDetailLabels[shiftNum]})` : ""}`
    : "—";

  const timelineSteps = useMemo(() => {
    const decided = ["revision", "approved", "rejected", "reserve"].includes(currentStatus);
    const decisionLabel = currentStatus === "revision" ? "На доработке"
      : currentStatus === "approved" ? "Одобрена"
      : currentStatus === "rejected" ? "Отклонена"
      : currentStatus === "reserve" ? "В резерве"
      : "Решение";
    const steps = [
      { label: "Заявка создана", date: registrationDate, done: true, active: false },
      { label: "На проверке", date: registrationDate, done: currentStatus !== "review", active: currentStatus === "review" },
      { label: decisionLabel, date: decided ? registrationDate : "—", done: decided, active: currentStatus === "revision" || currentStatus === "reserve" },
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
      <div style={{ backgroundColor: "#F0EAD2", borderBottom: "none", padding: mobile ? "20px 16px" : "32px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: mobile ? 16 : 24 }}>
            <button
              onClick={onBack}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: "none", backgroundColor: "transparent", color: "#003F5C", fontWeight: 900, fontSize: 13, cursor: "pointer", letterSpacing: "0.5px", fontFamily: "'Inter', sans-serif" }}
            >
              ← НАЗАД НА ГЛАВНУЮ
            </button>
            <button
              type="button"
              onClick={onLogout}
              style={{
                padding: "8px 16px", border: "2px solid #003F5C", backgroundColor: "#fff", color: "#003F5C",
                fontWeight: 900, fontSize: 13, cursor: "pointer", letterSpacing: "0.5px", fontFamily: "'Inter', sans-serif",
              }}
            >
              ВЫЙТИ
            </button>
          </div>
          <div style={{ display: "flex", alignItems: mobile ? "flex-start" : "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, flexDirection: mobile ? "column" : "row" }}>
            <div>
              <div style={{ color: "rgba(0,63,92,0.5)", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>ЛИЧНЫЙ КАБИНЕТ</div>
              <h1 style={{ fontSize: mobile ? 24 : 36, fontWeight: 900, color: "#003F5C", margin: 0, lineHeight: 1 }}>{name}</h1>
            </div>
            <div style={{ backgroundColor: status.color, border: "none", boxShadow: "none", padding: mobile ? "8px 16px" : "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: status.textColor }} />
              <span style={{ fontWeight: 900, fontSize: mobile ? 14 : 18, color: status.textColor, letterSpacing: "1px" }}>{status.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: mobile ? "24px 16px" : "40px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "2fr 1fr", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {revisionSuccess && (
              <div style={{ padding: "16px 24px", backgroundColor: "#DCFCE7", border: "2px solid #16A34A", fontWeight: 900, fontSize: 15, color: "#166534" }}>
                ✓ Доработанная заявка отправлена. Статус заявки: На проверке.
              </div>
            )}

            <div style={{ border: "none", boxShadow: "none" }}>
              <div style={{ backgroundColor: status.color, padding: "16px 24px", borderBottom: "none", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontWeight: 900, fontSize: 16, color: status.textColor }}>СТАТУС ЗАЯВКИ: {status.label}</span>
              </div>
              <div style={{ padding: "20px 24px" }}>
                <p style={{ fontSize: 15, color: "#333", lineHeight: 1.6, margin: 0 }}>{status.desc}</p>
                {currentStatus === "revision" && application?.revisionComment && (
                  <div style={{ marginTop: 16, padding: "12px 16px", backgroundColor: "#FEF3C7", border: "2px solid #F59E0B" }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: "#92400E", letterSpacing: "0.5px", marginBottom: 6 }}>КОММЕНТАРИЙ АДМИНИСТРАТОРА</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#003F5C", whiteSpace: "pre-wrap" }}>{application.revisionComment}</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ border: "none", boxShadow: "none" }}>
              <div style={{ backgroundColor: "#003F5C", padding: "16px 24px", borderBottom: "none" }}>
                <span style={{ fontWeight: 900, fontSize: 16, color: "#fff" }}>ИСТОРИЯ ЗАЯВКИ</span>
              </div>
              <div style={{ padding: "24px" }}>
                {timelineSteps.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: i < timelineSteps.length - 1 ? 20 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div style={{ width: 24, height: 24, border: "none", backgroundColor: step.active ? "#879E82" : step.done ? "#003F5C" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {step.done && !step.active && (
                          <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" /></svg>
                        )}
                        {step.active && <div style={{ width: 8, height: 8, backgroundColor: "#003F5C" }} />}
                      </div>
                      {i < timelineSteps.length - 1 && <div style={{ width: 2, height: 28, backgroundColor: step.done ? "#003F5C" : "#ddd", marginTop: 2 }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: step.active || step.done ? 900 : 400, fontSize: 15, color: step.done || step.active ? "#003F5C" : "#999" }}>{step.label}</div>
                      <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{step.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: "none", boxShadow: "none" }}>
              <div style={{ backgroundColor: "#eeeadf", padding: "16px 24px", borderBottom: "none" }}>
                <span style={{ fontWeight: 900, fontSize: 16, color: "#003F5C" }}>ДАННЫЕ ЗАЯВКИ</span>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                  {[
                    { label: "ФИО", value: application?.fullName || userData?.fullName || "—" },
                    { label: "ДАТА РОЖДЕНИЯ", value: (application?.birthDate || userData?.birthDate) ? new Date(application?.birthDate || userData?.birthDate || "").toLocaleDateString("ru-RU") : "—" },
                    { label: "ПАСПОРТ", value: `${application?.passportSeries || userData?.passportSeries || ""} ${application?.passportNumber || userData?.passportNumber || ""}`.trim() || "—" },
                    { label: "ТЕЛЕФОН", value: application?.phone || userData?.phone || "—" },
                    { label: "EMAIL", value: application?.email || userData?.email || "—" },
                    { label: "АДРЕС", value: application?.address || userData?.address || "—", wide: true },
                    { label: "ШКОЛА", value: application?.school || userData?.school || "—" },
                    { label: "КЛАСС", value: (application?.grade || userData?.grade) ? `${application?.grade || userData?.grade} класс` : "—" },
                    { label: "СМЕНА", value: shiftLine, wide: true },
                    { label: "ФИО РОДИТЕЛЯ", value: application?.parentFullName || userData?.parentFullName || "—" },
                    { label: "Д.Р. РОДИТЕЛЯ", value: (application?.parentBirthDate || userData?.parentBirthDate) ? new Date(application?.parentBirthDate || userData?.parentBirthDate || "").toLocaleDateString("ru-RU") : "—" },
                    { label: "ТЕЛ. РОДИТЕЛЯ", value: application?.parentPhone || userData?.parentPhone || "—" },
                    { label: "АДРЕС РОДИТЕЛЯ", value: application?.parentAddress || userData?.parentAddress || "—", wide: true },
                    { label: "МЕСТО РАБОТЫ РОДИТЕЛЯ", value: application?.parentWorkplace || userData?.parentWorkplace || "—", wide: true },
                  ].map((field) => (
                    <div key={field.label} style={{ gridColumn: !mobile && (field as { wide?: boolean }).wide ? "1 / -1" : undefined }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: "#666", letterSpacing: "0.5px", marginBottom: 4 }}>{field.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#003F5C" }}>{field.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {currentStatus === "revision" && application && (
              <div style={{ border: "2px solid #F59E0B", boxShadow: "none" }}>
                <div style={{ backgroundColor: "#F59E0B", padding: "16px 24px", borderBottom: "none" }}>
                  <span style={{ fontWeight: 900, fontSize: 16, color: "#003F5C" }}>ДОРАБОТАТЬ ЗАЯВКУ</span>
                </div>
                <div style={{ padding: "24px" }}>
                  <p style={{ fontSize: 13, color: "#555", marginBottom: 20 }}>
                    Внесите правки в поля ниже и при необходимости догрузите файлы. После нажатия «Отправить доработанную заявку» заявка снова попадёт на проверку.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
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
                      { key: "parentFullName", label: "ФИО родителя", type: "text", placeholder: "" },
                      { key: "parentBirthDate", label: "Дата рождения родителя", type: "date" },
                      { key: "parentPhone", label: "Телефон родителя", type: "tel", placeholder: "" },
                      { key: "parentAddress", label: "Адрес родителя", type: "text", placeholder: "" },
                      { key: "parentWorkplace", label: "Место работы родителя", type: "text", placeholder: "" },
                    ].map((f) => (
                      <div key={f.key} style={{ gridColumn: !mobile && (f.key === "address" || f.key === "parentAddress" || f.key === "parentWorkplace") ? "1 / -1" : undefined }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 900, color: "#666", marginBottom: 4 }}>{f.label}</label>
                        {f.type === "select" ? (
                          <select
                            value={editForm[f.key] || ""}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                            style={{ width: "100%", padding: "10px 12px", border: "none", borderBottom: "1.5px solid rgba(135,158,130,0.4)", fontSize: 14, fontFamily: "'Inter', sans-serif" }}
                          >
                            <option value="">{f.key === "shift" ? "Выберите смену" : "Выберите класс"}</option>
                            {Array.isArray(f.options) && (f.options as { v: string; l: string }[])[0]?.v
                              ? (f.options as { v: string; l: string }[]).map((opt) => <option key={opt.v} value={opt.v}>{opt.l}</option>)
                              : (f.options as string[] || []).map((opt) => <option key={opt} value={opt}>{opt} класс</option>)}
                          </select>
                        ) : f.key === "birthDate" || f.key === "parentBirthDate" ? (
                          <input
                            type="date"
                            value={editForm[f.key] || ""}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                            style={{ width: "100%", padding: "10px 12px", border: "none", borderBottom: "1.5px solid rgba(135,158,130,0.4)", fontSize: 14, fontFamily: "'Inter', sans-serif", boxSizing: "border-box" }}
                          />
                        ) : (
                          <input
                            type={f.type as "text"}
                            value={editForm[f.key] || ""}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                            placeholder={(f as { placeholder?: string }).placeholder}
                            style={{ width: "100%", padding: "10px 12px", border: "none", borderBottom: "1.5px solid rgba(135,158,130,0.4)", fontSize: 14, fontFamily: "'Inter', sans-serif", boxSizing: "border-box" }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 900, color: "#666", marginBottom: 8 }}>ДОБАВИТЬ ФАЙЛЫ (при необходимости)</label>
                    <div
                      onClick={() => revisionFileInputRef.current?.click()}
                      style={{ border: "1px dashed rgba(0,63,92,0.25)", padding: "20px", textAlign: "center", cursor: "pointer", backgroundColor: "#faf8f3", fontSize: 13, fontWeight: 700 }}
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
                        const existingItems = parseAttachmentsJson(editForm.attachments || application?.attachments || "[]");
                        const newItems: AttachmentItem[] = [];
                        if (revisionFiles.length > 0) {
                          const res = await uploadFiles(revisionFiles, {
                            shift: editForm.shift || application?.shift || "1",
                            fullName: (editForm.fullName || application?.fullName || "").trim() || "Участник",
                          });
                          res.results?.forEach((r) => {
                            if (r.saved && r.path) {
                              newItems.push({ key: "revision", label: "Дополнительный файл", path: r.path });
                            }
                          });
                        }
                        const merged = [...existingItems, ...newItems];
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
                          parentFullName: editForm.parentFullName || "",
                          parentBirthDate: editForm.parentBirthDate || "",
                          parentPhone: editForm.parentPhone || "",
                          parentAddress: editForm.parentAddress || "",
                          parentWorkplace: editForm.parentWorkplace || "",
                          attachments: JSON.stringify(merged),
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
                      width: "100%", padding: "14px", fontSize: 16, fontWeight: 900, color: "#003F5C",
                      backgroundColor: revisionSubmitting ? "#ccc" : "#F59E0B", border: "none",
                      boxShadow: "none", cursor: revisionSubmitting ? "not-allowed" : "pointer",
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
            <div style={{ border: "none", boxShadow: "none", backgroundColor: "#F0EAD2", padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,63,92,0.5)", letterSpacing: "1px", marginBottom: 8 }}>НОМЕР ЗАЯВКИ</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#879E82", lineHeight: 1, marginBottom: 4 }}>
                {application?.id ? `#${application.id.replace(/^app_/, "")}` : "—"}
              </div>
              <div style={{ fontSize: 12, color: "rgba(0,63,92,0.5)" }}>
                {application?.createdAt ? `от ${formatCreatedAt(application.createdAt)}` : "—"}
              </div>
            </div>

            <div style={{ border: "none", boxShadow: "none" }}>
              <div style={{ backgroundColor: "#879E82", padding: "16px 24px", borderBottom: "none" }}>
                <span style={{ fontWeight: 900, fontSize: 14, color: "#003F5C" }}>КАТЕГОРИЯ ЛЬГОТ</span>
              </div>
              <div style={{ padding: "16px 24px" }}>
                <div style={{ border: "none", padding: "12px 16px", backgroundColor: "#fff", fontWeight: 900, fontSize: 13 }}>
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

            <div style={{ border: "none", boxShadow: "none" }}>
              <div style={{ backgroundColor: "#eeeadf", padding: "16px 24px", borderBottom: "none" }}>
                <span style={{ fontWeight: 900, fontSize: 14, color: "#003F5C" }}>ЗАГРУЖЕННЫЕ ДОКУМЕНТЫ</span>
              </div>
              <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                {(() => {
                  const items = parseAttachmentsJson(application?.attachments || userData?.attachments || "[]");
                  if (items.length === 0) {
                    return <div style={{ fontSize: 13, color: "#666", fontStyle: "italic" }}>Нет загруженных документов</div>;
                  }
                  return items.map((item, i) => {
                    const nameStr = item.path.split("/").pop() || item.path;
                    const href = getFileUrl(item.path);
                    return (
                      <a key={`${item.path}-${i}`} href={href} target="_blank" rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", border: "none", fontSize: 12, fontWeight: 700, color: "#003F5C", textDecoration: "none", backgroundColor: "#fff", transition: "background 0.15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F0EAD2"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; }}
                      >
                        <span>📄</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: "#888", display: "block", marginBottom: 2 }}>{item.label}</span>
                          <span style={{ wordBreak: "break-all" }}>{nameStr}</span>
                        </span>
                        <span style={{ marginLeft: "auto", fontSize: 11, color: "#666", flexShrink: 0 }}>открыть</span>
                      </a>
                    );
                  });
                })()}
              </div>
            </div>

            <div style={{ border: "none", padding: "20px", backgroundColor: "#eeeadf" }}>
              <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 12 }}>НУЖНА ПОМОЩЬ?</div>
              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.5, marginBottom: 16 }}>Свяжитесь с куратором программы по телефону или email.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href="tel:+73493837563" style={{ display: "block", padding: "10px 16px", border: "none", backgroundColor: "#fff", fontWeight: 900, fontSize: 13, color: "#003F5C", textDecoration: "none", textAlign: "center", boxShadow: "none" }}>
                  +7 (34938) 3-75-63
                </a>
                <a href="mailto:help@trudovoelete.ru" style={{ display: "block", padding: "10px 16px", border: "none", backgroundColor: "#F0EAD2", fontWeight: 900, fontSize: 12, color: "#003F5C", textDecoration: "none", textAlign: "center", letterSpacing: "0.3px" }}>
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
