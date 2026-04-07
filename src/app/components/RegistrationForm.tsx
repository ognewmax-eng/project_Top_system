import React, { useState, useRef, useCallback } from "react";
import { registerUser, uploadFiles } from "@/api/apiService";
import type { AttachmentItem } from "@/utils/attachments";
import { useIsMobile } from "@/hooks/useIsMobile";

interface RegistrationFormProps {
  onSuccess: (userData: Record<string, string>) => void;
}

const benefitCards = [
  { id: "low_income", label: "МАЛОИМУЩИЕ", desc: "Семьи с доходом ниже прожиточного минимума" },
  { id: "svo", label: "ДЕТИ УЧАСТНИКОВ СВО", desc: "Дети военнослужащих, участвующих в специальной военной операции" },
  { id: "orphan", label: "ДЕТИ-СИРОТЫ", desc: "Дети, оставшиеся без попечения родителей" },
  { id: "disabled", label: "ДЕТИ-ИНВАЛИДЫ", desc: "Дети с установленной инвалидностью" },
  { id: "ovz", label: "ДЕТИ ОВЗ", desc: "Дети с ограниченными возможностями здоровья (ОВЗ)" },
  { id: "combat_veteran", label: "ВЕТЕРАНЫ БД", desc: "Дети ветеранов боевых действий" },
  { id: "kmns", label: "КМНС", desc: "Дети, относящиеся к коренным малочисленным народам Севера" },
  { id: "preventive", label: "ПРОФИЛАКТИЧЕСКИЙ УЧЁТ", desc: "Дети, состоящие на профилактических учётах" },
  { id: "large_family", label: "МНОГОДЕТНЫЕ СЕМЬИ", desc: "Семьи с тремя и более детьми" },
  { id: "none", label: "БЕЗ ЛЬГОТ", desc: "Участие без дополнительных льгот" },
];

const shiftOptions = [
  { id: "1", label: "1 СМЕНА", dates: "1 июня — 19 июня" },
  { id: "2", label: "2 СМЕНА", dates: "6 июля — 23 июля" },
  { id: "3", label: "3 СМЕНА", dates: "3 августа — 20 августа" },
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
  { key: "child_passport", label: "Паспорт ребёнка (при наличии)", required: false },
  { key: "parent_surname_change", label: "Свидетельство о смене фамилии родителя (при наличии)", required: false },
  { key: "birth_cert", label: "Свидетельство о рождении ребёнка", required: true },
  { key: "snils", label: "СНИЛС", required: true },
  { key: "inn", label: "ИНН", required: true },
  { key: "study_ref", label: "Справка с места учёбы", required: true },
  { key: "benefit_proof", label: "Подтверждение льготной категории", required: true },
  { key: "no_criminal", label: "Справка об отсутствии судимости (либо подтверждение, что справка заказана)", required: true },
  { key: "draft_card", label: "Приписное удостоверение для юношей 2009 г.р. и старше (при наличии)", required: false },
  { key: "commission_application", label: "Заявление в межведомственную комиссию", required: true },
  { key: "pd_consent", label: "Согласие на обработку персональных данных", required: true },
  { key: "bank_details", label: "Банковские реквизиты", required: true },
  { key: "other_docs", label: "Иные документы", required: false },
] as const;

const requiredDocKeys: DocKey[] = documentSlots.filter((s) => s.required).map((s) => s.key);

type DocKey = (typeof documentSlots)[number]["key"];

function docLabelForUi(slot: (typeof documentSlots)[number]): string {
  return slot.required ? `${slot.label} *` : slot.label;
}

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
    parentFullName: "",
    parentBirthDate: "",
    parentPhone: "",
    parentAddress: "",
    parentWorkplace: "",
  });
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Record<DocKey, File[]>>(() => {
    const init: Record<string, File[]> = {};
    for (const s of documentSlots) init[s.key] = [];
    return init as Record<DocKey, File[]>;
  });
  const docInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [agreed, setAgreed] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ total: 0, completed: 0, currentFile: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, phone: formatPhone(e.target.value) }));
  };

  const handleParentPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, parentPhone: formatPhone(e.target.value) }));
  };

  const toggleBenefit = (id: string) => {
    if (id === "none") { setSelectedBenefits(["none"]); return; }
    setSelectedBenefits((prev) => {
      const filtered = prev.filter((b) => b !== "none");
      return filtered.includes(id) ? filtered.filter((b) => b !== id) : [...filtered, id];
    });
  };

  const setDocFiles = useCallback((key: DocKey, files: File[]) => {
    setDocuments((prev) => ({ ...prev, [key]: files }));
  }, []);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    border: "none",
    borderBottom: "1.5px solid rgba(135,158,130,0.5)",
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
    color: "#003F5C",
  };

  const fieldStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
  };

  const sectionHeaderStyle = (bg: string): React.CSSProperties => ({
    backgroundColor: bg,
    padding: mobile ? "14px 20px" : "16px 32px",
    borderBottom: "none",
    borderTop: "none",
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
      style={{ backgroundColor: "#fff", borderBottom: "none", fontFamily: "'Inter', sans-serif" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: mobile ? "48px 16px" : "80px 24px" }}>
        {/* Title */}
        <div style={{ marginBottom: 48 }}>
          <span
            style={{
              display: "inline-block", backgroundColor: "#879E82", border: "none",
              padding: "4px 12px", fontSize: 13, fontWeight: 900, letterSpacing: "1px", marginBottom: 16,
            }}
          >
            ЗАЯВКА
          </span>
          <h2
            style={{
              fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900, color: "#003F5C",
              lineHeight: 1, letterSpacing: "-1px", margin: 0,
            }}
          >
            РЕГИСТРАЦИЯ<br />УЧАСТНИКА
          </h2>
        </div>

        <div
          style={{
            marginBottom: 40,
            padding: mobile ? "20px 16px" : "24px 28px",
            backgroundColor: "#F0EAD2",
            border: "1px dashed rgba(0,63,92,0.2)",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 15, color: "#003F5C", letterSpacing: "0.5px", marginBottom: 10 }}>
            НУЖНА ПОМОЩЬ?
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#444", lineHeight: 1.6 }}>
            Свяжитесь с куратором программы по телефону.
          </p>
          <a
            href="tel:+73493837563"
            style={{ display: "inline-block", marginTop: 12, fontWeight: 900, fontSize: 18, color: "#003F5C", textDecoration: "none" }}
          >
            +7 (34938) 3-75-63
          </a>
        </div>

        <div style={{ border: "none", boxShadow: "none" }}>

          {/* ═══════ SECTION 1: Account ═══════ */}
          <div style={{ backgroundColor: "#F0EAD2", padding: mobile ? "14px 20px" : "16px 32px", borderBottom: "none" }}>
            <span style={sectionHeaderText("#003F5C")}>РЕГИСТРАЦИЯ ЛИЧНОГО КАБИНЕТА</span>
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
          <div style={sectionHeaderStyle("#879E82")}>
            <span style={sectionHeaderText("#003F5C")}>ЛИЧНЫЕ ДАННЫЕ</span>
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

          {/* ═══════ SECTION 3: Parent Data ═══════ */}
          <div style={sectionHeaderStyle("#F0EAD2")}>
            <span style={sectionHeaderText("#003F5C")}>ЛИЧНЫЕ ДАННЫЕ РОДИТЕЛЯ</span>
          </div>
          <div style={{ padding: mobile ? "20px 16px" : "28px 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: mobile ? 16 : 20 }}>
              <div style={{ ...fieldStyle, gridColumn: mobile ? undefined : "1 / -1" }}>
                <label style={labelStyle}>ФИО *</label>
                <input type="text" name="parentFullName" value={form.parentFullName} onChange={handleChange} placeholder="Иванова Мария Ивановна" style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>ДАТА РОЖДЕНИЯ *</label>
                <input type="date" name="parentBirthDate" value={form.parentBirthDate} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>ТЕЛЕФОН *</label>
                <input type="tel" name="parentPhone" value={form.parentPhone} onChange={handleParentPhoneChange} placeholder="+7(XXX)XXX-XX-XX" style={inputStyle} />
              </div>
              <div style={{ ...fieldStyle, gridColumn: mobile ? undefined : "1 / -1" }}>
                <label style={labelStyle}>АДРЕС РЕГИСТРАЦИИ *</label>
                <input type="text" name="parentAddress" value={form.parentAddress} onChange={handleChange} placeholder="г. Муравленко, ул. Пример, д. 1, кв. 1" style={inputStyle} />
              </div>
              <div style={{ ...fieldStyle, gridColumn: mobile ? undefined : "1 / -1" }}>
                <label style={labelStyle}>МЕСТО РАБОТЫ *</label>
                <input type="text" name="parentWorkplace" value={form.parentWorkplace} onChange={handleChange} placeholder="ООО «Название организации»" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* ═══════ SECTION 4: Benefits ═══════ */}
          <div style={sectionHeaderStyle("#879E82")}>
            <span style={sectionHeaderText("#003F5C")}>ВЫБОР ЛЬГОТ</span>
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
                      border: "none", padding: "16px 20px", cursor: "pointer",
                      backgroundColor: isSelected ? "#879E82" : "#F0EAD2",
                      boxShadow: "none",
                      transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 8,
                      opacity: isSelected ? 1 : 0.85,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: "0.3px" }}>{benefit.label}</span>
                      <div style={{ width: 20, height: 20, border: "none", backgroundColor: isSelected ? "#003F5C" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 8 }}>
                        {isSelected && checkSvg}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: "#555", lineHeight: 1.4 }}>{benefit.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════ SECTION 5: Shifts ═══════ */}
          <div style={sectionHeaderStyle("#F0EAD2")}>
            <span style={sectionHeaderText("#003F5C")}>ВЫБОР СМЕНЫ</span>
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
                      border: "none", padding: "16px 20px", cursor: "pointer",
                      backgroundColor: isSelected ? "#879E82" : "#F0EAD2",
                      boxShadow: "none",
                      transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 6,
                      opacity: isSelected ? 1 : 0.85,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: "0.3px" }}>{opt.label}</span>
                      <div style={{ width: 20, height: 20, border: "none", backgroundColor: isSelected ? "#003F5C" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
          <div style={sectionHeaderStyle("#003F5C")}>
            <span style={sectionHeaderText("#fff")}>ДОКУМЕНТЫ</span>
          </div>
          <div style={{ padding: mobile ? "20px 16px" : "28px 32px" }}>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 8, marginTop: 0 }}>
              Загрузите необходимые документы (PDF, JPG, PNG, DOC, DOCX). В одну строку можно выбрать несколько файлов. Максимальный размер одного файла — 50 МБ.
            </p>
            <p style={{ fontSize: 13, color: "#003F5C", fontWeight: 700, marginBottom: 12, marginTop: 0 }}>
              * — обязательный документ.
            </p>
            <div
              style={{
                marginBottom: 20,
                padding: "10px 12px",
                border: "1px dashed rgba(0,63,92,0.25)",
                backgroundColor: "#F0EAD2",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                flexDirection: mobile ? "column" : "row",
                gap: 6,
              }}
            >
              <span>Шаблоны обязательных документов для заполнения можно скачать по ссылке:</span>
              <a
                href="https://disk.yandex.ru/d/tq_-HiC6wB7wRg"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#003F5C", textDecoration: "underline" }}
              >
                ОТКРЫТЬ ШАБЛОНЫ НА ЯНДЕКС.ДИСКЕ
              </a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {documentSlots.map((slot, idx) => {
                const slotFiles = documents[slot.key];
                const hasFiles = slotFiles.length > 0;
                return (
                  <div
                    key={slot.key}
                    style={{
                      display: "flex",
                      alignItems: mobile ? "flex-start" : "center",
                      flexDirection: mobile ? "column" : "row",
                      gap: mobile ? 10 : 16,
                      padding: mobile ? "12px" : "12px 16px",
                      border: "none",
                      backgroundColor: hasFiles ? "#f0fdf4" : "#faf8f3",
                      transition: "background 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, width: mobile ? "100%" : undefined, flex: mobile ? undefined : 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#aaa", flexShrink: 0 }}>
                        {idx + 1}.
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: mobile ? 13 : 14, fontWeight: 700, color: "#003F5C", marginBottom: 2 }}>{docLabelForUi(slot)}</div>
                        {hasFiles ? (
                          <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
                            {slotFiles.length === 1
                              ? slotFiles[0].name
                              : `Выбрано файлов: ${slotFiles.length}`}
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
                          border: "none",
                          backgroundColor: hasFiles ? "#fff" : "#F0EAD2",
                          fontWeight: 900,
                          fontSize: 12,
                          cursor: "pointer",
                          fontFamily: "'Inter', sans-serif",
                          letterSpacing: "0.3px",
                          flex: mobile ? 1 : undefined,
                        }}
                      >
                        {hasFiles ? "ДОБАВИТЬ / ЗАМЕНИТЬ" : "ЗАГРУЗИТЬ"}
                      </button>
                      {hasFiles && (
                        <button
                          type="button"
                          onClick={() => setDocFiles(slot.key, [])}
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
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const list = e.target.files ? Array.from(e.target.files) : [];
                        setDocFiles(slot.key, list);
                        e.target.value = "";
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════ SECTION 6: Consent ═══════ */}
          <div style={{ borderTop: "none", padding: mobile ? "20px 16px" : "28px 32px" }}>
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 28, cursor: "pointer" }}
              onClick={() => setAgreed(!agreed)}
            >
              <div
                style={{
                  width: 24, height: 24, border: "1.5px solid rgba(0,63,92,0.35)",
                  backgroundColor: agreed ? "#003F5C" : "#fff",
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
              <span style={{ fontSize: 14, lineHeight: 1.5, color: "#003F5C" }}>
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

                const missing = requiredDocKeys.filter((key) => (documents[key]?.length ?? 0) === 0);
                if (missing.length > 0) {
                  setSubmitError("Пожалуйста, загрузите все обязательные документы (помечены *).");
                  return;
                }

                setSubmitting(true);
                setUploadProgress({ total: 0, completed: 0, currentFile: "" });
                const payload = { ...form, benefits: JSON.stringify(selectedBenefits) };
                try {
                  const attachmentItems: AttachmentItem[] = [];
                  const failedUploadNames: string[] = [];
                  const fullNameForUpload = form.fullName.trim() || "Участник";
                  const allFilesCount = documentSlots.reduce((acc, s) => acc + documents[s.key].length, 0);
                  setUploadProgress({ total: allFilesCount, completed: 0, currentFile: "" });
                  for (const slot of documentSlots) {
                    const slotFiles = documents[slot.key];
                    if (!slotFiles || slotFiles.length === 0) continue;
                    const uploadRes = await uploadFiles(slotFiles, {
                      shift: form.shift,
                      fullName: fullNameForUpload,
                    }, (event) => {
                      setUploadProgress({
                        total: allFilesCount,
                        completed: event.completed,
                        currentFile: event.fileName,
                      });
                    });
                    uploadRes.results?.forEach((r) => {
                      if (r.saved && r.path) {
                        attachmentItems.push({
                          key: slot.key,
                          label: slot.label,
                          path: r.path,
                        });
                      } else {
                        failedUploadNames.push(r.originalName);
                      }
                    });
                  }
                  const expectedFiles = documentSlots.reduce((acc, s) => acc + documents[s.key].length, 0);
                  if (attachmentItems.length !== expectedFiles) {
                    setSubmitError(
                      failedUploadNames.length > 0
                        ? `Не удалось загрузить файлы: ${failedUploadNames.join(", ")}. Проверьте размер (до 50 МБ), сеть и попробуйте снова.`
                        : "Не удалось загрузить один или несколько файлов (Яндекс.Диск или сервер). Проверьте размер файлов и соединение и попробуйте снова."
                    );
                    return;
                  }
                  const attachmentsJson = JSON.stringify(attachmentItems);
                  const res = await registerUser({
                    ...payload,
                    attachments: attachmentsJson,
                  });
                  const userData: Record<string, string> = { ...payload, attachments: attachmentsJson };
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
                  setUploadProgress((prev) => ({ ...prev, currentFile: "" }));
                }
              }}
              disabled={!agreed || submitting}
              style={{
                width: "100%", padding: "20px", fontSize: 18, fontWeight: 900,
                color: agreed && !submitting ? "#fff" : "#999",
                backgroundColor: agreed && !submitting ? "#003F5C" : "#f0f0f0",
                border: "none",
                boxShadow: "none",
                cursor: agreed && !submitting ? "pointer" : "not-allowed",
                letterSpacing: "1px", transition: "all 0.15s", fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={(e) => {
                if (agreed && !submitting) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#002d44";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = agreed && !submitting ? "#003F5C" : "#f0f0f0";
              }}
            >
              {submitting ? "ОТПРАВКА…" : "ОТПРАВИТЬ ЗАЯВКУ"}
            </button>
            {submitting && uploadProgress.total > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#555", marginBottom: 6 }}>
                  <span>Загрузка файлов: {uploadProgress.completed}/{uploadProgress.total}</span>
                  <span>{Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%</span>
                </div>
                <div style={{ width: "100%", height: 8, backgroundColor: "#e5e7eb", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, Math.round((uploadProgress.completed / uploadProgress.total) * 100))}%`,
                      backgroundColor: "#879E82",
                      transition: "width 0.2s ease",
                    }}
                  />
                </div>
                {uploadProgress.currentFile && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    Сейчас: {uploadProgress.currentFile}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
