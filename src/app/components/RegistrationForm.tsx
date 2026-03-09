import React, { useState, useRef, useCallback } from "react";
import { registerUser, uploadFiles } from "@/api/apiService";
import { useIsMobile } from "@/hooks/useIsMobile";

interface RegistrationFormProps {
  onSuccess: (userData: Record<string, string>) => void;
}

const benefitCards = [
  { id: "low_income", label: "МАЛОИМУЩИЕ", desc: "Семьи с доходом ниже прожиточного минимума" },
  { id: "svo", label: "ДЕТИ УЧАСТНИКОВ СВО", desc: "Дети военнослужащих, участвующих в специальной военной операции" },
  { id: "orphan", label: "ДЕТИ-СИРОТЫ", desc: "Дети, оставшиеся без попечения родителей" },
  { id: "disabled", label: "ДЕТИ-ИНВАЛИДЫ", desc: "Дети с ограниченными возможностями здоровья" },
  { id: "large_family", label: "МНОГОДЕТНЫЕ СЕМЬИ", desc: "Семьи с тремя и более детьми" },
  { id: "none", label: "БЕЗ ЛЬГОТ", desc: "Участие без дополнительных льгот" },
];

const shiftOptions = [
  { id: "1", label: "1 СМЕНА", dates: "1 июня — 30 июня" },
  { id: "2", label: "2 СМЕНА", dates: "1 июля — 31 июля" },
  { id: "3", label: "3 СМЕНА", dates: "1 августа — 31 августа" },
];

const schoolOptions = [
  'МАОУ "Школа №1 имени В.И. Муравленко"',
  'МАОУ «Школа № 2»',
  'МАОУ "ЦО "ВЗЛЁТ"',
  'МАОУ «Школа № 4»',
  'МАОУ "Школа № 5"',
  'МАОУ «Многопрофильный лицей»',
  'ГБПОУ ЯНАО «Муравленковский многопрофильный колледж»',
];

const documentSlots = [
  { key: "passport", label: "Паспорт" },
  { key: "no_criminal", label: "Справка об отсутствии судимости" },
  { key: "snils", label: "СНИЛС" },
  { key: "inn", label: "ИНН" },
  { key: "birth_cert", label: "Свидетельство о рождении" },
  { key: "parent_passport", label: "Паспорт родителя (совпадает с заявлением)" },
  { key: "study_ref", label: "Справка с места учёбы" },
  { key: "pd_consent", label: "Согласие на обработку персональных данных" },
  { key: "job_application", label: "Заявление о приёме на работу" },
  { key: "benefit_proof", label: "Подтверждение наличия льготной категории" },
  { key: "name_change", label: "Свидетельство о смене фамилии родителя" },
] as const;

type DocKey = typeof documentSlots[number]["key"];

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  const d = digits.startsWith("7") ? digits : "7" + digits;
  let result = "+7";
  if (d.length > 1) result += "(" + d.slice(1, 4);
  if (d.length >= 4) result += ")";
  if (d.length > 4) result += d.slice(4, 7);
  if (d.length > 7) result += "-" + d.slice(7, 9);
  if (d.length > 9) result += "-" + d.slice(9, 11);
  return result;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const mobile = useIsMobile();
  const [form, setForm] = useState({
    fullName: "",
    birthDate: "",
    passportSeries: "",
    passportNumber: "",
    address: "",
    school: "",
    grade: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    shift: "",
  });
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Record<DocKey, File | null>>(() => {
    const init: Record<string, File | null> = {};
    for (const s of documentSlots) init[s.key] = null;
    return init as Record<DocKey, File | null>;
  });
  const docInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [agreed, setAgreed] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, phone: formatPhone(e.target.value) }));
  };

  const toggleBenefit = (id: string) => {
    if (id === "none") { setSelectedBenefits(["none"]); return; }
    setSelectedBenefits((prev) => {
      const filtered = prev.filter((b) => b !== "none");
      return filtered.includes(id) ? filtered.filter((b) => b !== id) : [...filtered, id];
    });
  };

  const setDocFile = useCallback((key: DocKey, file: File | null) => {
    setDocuments((prev) => ({ ...prev, [key]: file }));
  }, []);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #000",
    backgroundColor: "#fff",
    fontSize: 15,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 400,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: "0.5px",
    marginBottom: 8,
    color: "#000",
  };

  const fieldStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
  };

  const sectionHeaderStyle = (bg: string): React.CSSProperties => ({
    backgroundColor: bg,
    padding: mobile ? "14px 20px" : "16px 32px",
    borderBottom: "2px solid #000",
    borderTop: "2px solid #000",
  });

  const sectionHeaderText = (color: string): React.CSSProperties => ({
    color,
    fontWeight: 900,
    fontSize: 16,
    letterSpacing: "0.5px",
  });

  const checkSvg = (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
      <path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  );

  return (
    <section
      id="register"
      style={{ backgroundColor: "#fff", borderBottom: "2px solid #000", fontFamily: "'Inter', sans-serif" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: mobile ? "48px 16px" : "80px 24px" }}>
        {/* Title */}
        <div style={{ marginBottom: 48 }}>
          <span
            style={{
              display: "inline-block", backgroundColor: "#ED7C30", border: "2px solid #000",
              padding: "4px 12px", fontSize: 13, fontWeight: 900, letterSpacing: "1px", marginBottom: 16,
            }}
          >
            ЗАЯВКА
          </span>
          <h2
            style={{
              fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900, color: "#000",
              lineHeight: 1, letterSpacing: "-1px", margin: 0,
            }}
          >
            РЕГИСТРАЦИЯ<br />УЧАСТНИКА
          </h2>
        </div>

        <div style={{ border: "2px solid #000", boxShadow: "6px 6px 0px #000" }}>

          {/* ═══════ SECTION 1: Account ═══════ */}
          <div style={{ backgroundColor: "#F8EDAD", padding: mobile ? "14px 20px" : "16px 32px", borderBottom: "2px solid #000" }}>
            <span style={sectionHeaderText("#000")}>РЕГИСТРАЦИЯ ЛИЧНОГО КАБИНЕТА</span>
          </div>
          <div style={{ padding: mobile ? "20px 16px" : "28px 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: mobile ? 16 : 20 }}>
              <div style={{ ...fieldStyle, gridColumn: mobile ? undefined : "1 / -1" }}>
                <label style={labelStyle}>ЭЛЕКТРОННАЯ ПОЧТА *</label>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="example@mail.ru" style={inputStyle}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>ПАРОЛЬ *</label>
                <input
                  type="password" name="password" value={form.password}
                  onChange={(e) => { handleChange(e); setPasswordError(""); }}
                  placeholder="Минимум 6 символов" style={inputStyle}
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>ПОДТВЕРЖДЕНИЕ ПАРОЛЯ *</label>
                <input
                  type="password" name="confirmPassword" value={form.confirmPassword}
                  onChange={(e) => { handleChange(e); setPasswordError(""); }}
                  placeholder="Повтори пароль" style={inputStyle}
                />
              </div>
              {passwordError && (
                <div style={{ gridColumn: mobile ? undefined : "1 / -1", backgroundColor: "#FEF2F2", border: "2px solid #DC2626", padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#DC2626" }}>
                  ⚠ {passwordError}
                </div>
              )}
            </div>
          </div>

          {/* ═══════ SECTION 2: Personal Data ═══════ */}
          <div style={sectionHeaderStyle("#ED7C30")}>
            <span style={sectionHeaderText("#000")}>ЛИЧНЫЕ ДАННЫЕ</span>
          </div>
          <div style={{ padding: mobile ? "20px 16px" : "28px 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: mobile ? 16 : 20 }}>
              <div style={{ ...fieldStyle, gridColumn: mobile ? undefined : "1 / -1" }}>
                <label style={labelStyle}>ФИО *</label>
                <input type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Иванов Иван Иванович" style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>ДАТА РОЖДЕНИЯ *</label>
                <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>ТЕЛЕФОН *</label>
                <input type="tel" name="phone" value={form.phone} onChange={handlePhoneChange} placeholder="+7(XXX)XXX-XX-XX" style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>СЕРИЯ ПАСПОРТА *</label>
                <input type="text" name="passportSeries" value={form.passportSeries} onChange={handleChange} placeholder="0000" maxLength={4} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>НОМЕР ПАСПОРТА *</label>
                <input type="text" name="passportNumber" value={form.passportNumber} onChange={handleChange} placeholder="000000" maxLength={6} style={inputStyle} />
              </div>
              <div style={{ ...fieldStyle, gridColumn: mobile ? undefined : "1 / -1" }}>
                <label style={labelStyle}>АДРЕС РЕГИСТРАЦИИ *</label>
                <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="г. Муравленко, ул. Пример, д. 1, кв. 1" style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>ОБРАЗОВАТЕЛЬНАЯ ОРГАНИЗАЦИЯ *</label>
                <select name="school" value={form.school} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Выберите организацию</option>
                  {schoolOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>КЛАСС *</label>
                <select name="grade" value={form.grade} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Выберите класс</option>
                  {[6, 7, 8, 9, 10, 11].map((g) => (
                    <option key={g} value={g}>{g} класс</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ═══════ SECTION 3: Benefits ═══════ */}
          <div style={sectionHeaderStyle("#F8EDAD")}>
            <span style={sectionHeaderText("#000")}>ВЫБОР ЛЬГОТ</span>
          </div>
          <div style={{ padding: mobile ? "20px 16px" : "28px 32px" }}>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 20, marginTop: 0 }}>Выберите подходящую категорию</p>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
              {benefitCards.map((benefit) => {
                const isSelected = selectedBenefits.includes(benefit.id);
                return (
                  <div
                    key={benefit.id}
                    onClick={() => toggleBenefit(benefit.id)}
                    style={{
                      border: "2px solid #000", padding: "16px 20px", cursor: "pointer",
                      backgroundColor: isSelected ? "#ED7C30" : "#fff",
                      boxShadow: isSelected ? "4px 4px 0px #000" : "2px 2px 0px #000",
                      transition: "all 0.1s", display: "flex", flexDirection: "column", gap: 8,
                      transform: isSelected ? "translate(-1px,-1px)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: "0.3px" }}>{benefit.label}</span>
                      <div style={{ width: 20, height: 20, border: "2px solid #000", backgroundColor: isSelected ? "#000" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 8 }}>
                        {isSelected && checkSvg}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: "#555", lineHeight: 1.4 }}>{benefit.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════ SECTION 4: Shifts ═══════ */}
          <div style={sectionHeaderStyle("#ED7C30")}>
            <span style={sectionHeaderText("#000")}>ВЫБОР СМЕНЫ</span>
          </div>
          <div style={{ padding: mobile ? "20px 16px" : "28px 32px" }}>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 20, marginTop: 0 }}>Выберите смену для участия</p>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
              {shiftOptions.map((opt) => {
                const isSelected = form.shift === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setForm((f) => ({ ...f, shift: opt.id }))}
                    style={{
                      border: "2px solid #000", padding: "16px 20px", cursor: "pointer",
                      backgroundColor: isSelected ? "#ED7C30" : "#fff",
                      boxShadow: isSelected ? "4px 4px 0px #000" : "2px 2px 0px #000",
                      transition: "all 0.1s", display: "flex", flexDirection: "column", gap: 6,
                      transform: isSelected ? "translate(-1px,-1px)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: "0.3px" }}>{opt.label}</span>
                      <div style={{ width: 20, height: 20, border: "2px solid #000", backgroundColor: isSelected ? "#000" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {isSelected && checkSvg}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: "#555" }}>{opt.dates}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════ SECTION 5: Documents ═══════ */}
          <div style={sectionHeaderStyle("#000")}>
            <span style={sectionHeaderText("#fff")}>ДОКУМЕНТЫ</span>
          </div>
          <div style={{ padding: mobile ? "20px 16px" : "28px 32px" }}>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 20, marginTop: 0 }}>
              Загрузите необходимые документы (PDF, JPG, PNG). Каждый документ загружается отдельно.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {documentSlots.map((slot, idx) => {
                const file = documents[slot.key];
                return (
                  <div
                    key={slot.key}
                    style={{
                      display: "flex",
                      alignItems: mobile ? "flex-start" : "center",
                      flexDirection: mobile ? "column" : "row",
                      gap: mobile ? 10 : 16,
                      padding: mobile ? "12px" : "12px 16px",
                      border: "2px solid #000",
                      backgroundColor: file ? "#f0fdf4" : "#fafafa",
                      transition: "background 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, width: mobile ? "100%" : undefined, flex: mobile ? undefined : 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#aaa", flexShrink: 0 }}>
                        {idx + 1}.
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: mobile ? 13 : 14, fontWeight: 700, color: "#000", marginBottom: 2 }}>{slot.label}</div>
                        {file ? (
                          <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {file.name}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: "#999" }}>не загружен</div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, width: mobile ? "100%" : undefined }}>
                      <button
                        type="button"
                        onClick={() => docInputRefs.current[slot.key]?.click()}
                        style={{
                          padding: "6px 16px",
                          border: "2px solid #000",
                          backgroundColor: file ? "#fff" : "#F8EDAD",
                          fontWeight: 900,
                          fontSize: 12,
                          cursor: "pointer",
                          fontFamily: "'Inter', sans-serif",
                          letterSpacing: "0.3px",
                          flex: mobile ? 1 : undefined,
                        }}
                      >
                        {file ? "ЗАМЕНИТЬ" : "ЗАГРУЗИТЬ"}
                      </button>
                      {file && (
                        <button
                          type="button"
                          onClick={() => setDocFile(slot.key, null)}
                          style={{
                            padding: "6px 12px",
                            border: "2px solid #DC2626",
                            backgroundColor: "#FEF2F2",
                            color: "#DC2626",
                            fontWeight: 900,
                            fontSize: 12,
                            cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      ref={(el) => { docInputRefs.current[slot.key] = el; }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setDocFile(slot.key, f);
                        e.target.value = "";
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════ SECTION 6: Consent ═══════ */}
          <div style={{ borderTop: "2px solid #000", padding: mobile ? "20px 16px" : "28px 32px" }}>
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 28, cursor: "pointer" }}
              onClick={() => setAgreed(!agreed)}
            >
              <div
                style={{
                  width: 24, height: 24, border: "2px solid #000",
                  backgroundColor: agreed ? "#000" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: 1,
                }}
              >
                {agreed && (
                  <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                    <path d="M1 5.5L5 9.5L13 1.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 14, lineHeight: 1.5, color: "#000" }}>
                Я даю согласие на обработку персональных данных в соответствии с Федеральным законом №152-ФЗ «О персональных данных» и принимаю условия участия в программе «Трудовое лето».
              </span>
            </div>

            {submitError && (
              <div style={{ backgroundColor: "#FEF2F2", border: "2px solid #DC2626", padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#DC2626", marginBottom: 20 }}>
                ⚠ {submitError}
              </div>
            )}

            {/* ═══════ SECTION 7: Submit ═══════ */}
            <button
              onClick={async () => {
                if (!agreed) return;
                setPasswordError("");
                setSubmitError("");
                if (!form.email.trim()) { setPasswordError("Укажите электронную почту"); return; }
                if (form.password.length < 6) { setPasswordError("Пароль должен содержать минимум 6 символов"); return; }
                if (form.password !== form.confirmPassword) { setPasswordError("Пароли не совпадают"); return; }
                if (!form.fullName.trim()) { setSubmitError("Укажите ФИО"); return; }
                if (!form.shift) { setSubmitError("Выберите смену для участия"); return; }

                setSubmitting(true);
                const payload = { ...form, benefits: JSON.stringify(selectedBenefits) };
                try {
                  const filesToUpload = Object.values(documents).filter(Boolean) as File[];
                  let uploadedPaths: string[] = [];
                  if (filesToUpload.length > 0) {
                    const uploadRes = await uploadFiles(filesToUpload, {
                      shift: form.shift,
                      fullName: form.fullName.trim() || "Участник",
                    });
                    if (uploadRes.results) {
                      uploadedPaths = uploadRes.results.filter((r) => r.saved && r.path).map((r) => r.path!);
                    }
                  }
                  const res = await registerUser({
                    ...payload,
                    attachments: JSON.stringify(uploadedPaths),
                  });
                  const userData: Record<string, string> = { ...payload, attachments: JSON.stringify(uploadedPaths) };
                  if (res.user) {
                    Object.entries(res.user).forEach(([k, v]) => {
                      if (v !== null && v !== undefined) userData[k] = String(v);
                    });
                  }
                  onSuccess(userData);
                } catch (err) {
                  const message = err instanceof Error ? err.message : "Ошибка отправки. Проверьте сеть или попробуйте позже.";
                  setSubmitError(message);
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={!agreed || submitting}
              style={{
                width: "100%", padding: "20px", fontSize: 18, fontWeight: 900,
                color: agreed && !submitting ? "#000" : "#999",
                backgroundColor: agreed && !submitting ? "#ED7C30" : "#f0f0f0",
                border: `2px solid ${agreed && !submitting ? "#000" : "#ccc"}`,
                boxShadow: agreed && !submitting ? "5px 5px 0px #000" : "none",
                cursor: agreed && !submitting ? "pointer" : "not-allowed",
                letterSpacing: "1px", transition: "all 0.1s", fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={(e) => {
                if (agreed && !submitting) {
                  (e.currentTarget as HTMLElement).style.transform = "translate(2px,2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "3px 3px 0px #000";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translate(0,0)";
                (e.currentTarget as HTMLElement).style.boxShadow = agreed && !submitting ? "5px 5px 0px #000" : "none";
              }}
            >
              {submitting ? "ОТПРАВКА…" : "ОТПРАВИТЬ ЗАЯВКУ"}
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
