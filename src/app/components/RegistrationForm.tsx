import React, { useState, useRef } from "react";

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

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
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
  });
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleBenefit = (id: string) => {
    if (id === "none") {
      setSelectedBenefits(["none"]);
      return;
    }
    setSelectedBenefits((prev) => {
      const filtered = prev.filter((b) => b !== "none");
      return filtered.includes(id) ? filtered.filter((b) => b !== id) : [...filtered, id];
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).map((f) => f.name);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).map((f) => f.name);
      setUploadedFiles((prev) => [...prev, ...files]);
    }
  };

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

  return (
    <section
      id="register"
      style={{
        backgroundColor: "#fff",
        borderBottom: "2px solid #000",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
        {/* Title */}
        <div style={{ marginBottom: 48 }}>
          <span
            style={{
              display: "inline-block",
              backgroundColor: "#ED7C30",
              border: "2px solid #000",
              padding: "4px 12px",
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: "1px",
              marginBottom: 16,
            }}
          >
            ЗАЯВКА
          </span>
          <h2
            style={{
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: 900,
              color: "#000",
              lineHeight: 1,
              letterSpacing: "-1px",
              margin: 0,
            }}
          >
            РЕГИСТРАЦИЯ<br />УЧАСТНИКА
          </h2>
        </div>

        <div
          style={{
            border: "2px solid #000",
            boxShadow: "6px 6px 0px #000",
          }}
        >
          {/* Form header */}
          <div
            style={{
              backgroundColor: "#F8EDAD",
              padding: "20px 32px",
              borderBottom: "2px solid #000",
            }}
          >
            <span style={{ color: "#000", fontWeight: 900, fontSize: 18, letterSpacing: "0.5px" }}>
              ЛИЧНЫЕ ДАННЫЕ
            </span>
          </div>

          <div style={{ padding: 32 }}>
            {/* Personal info grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
                marginBottom: 32,
              }}
            >
              <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
                <label style={labelStyle}>ФИО *</label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Иванов Иван Иванович"
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>ДАТА РОЖДЕНИЯ *</label>
                <input
                  type="date"
                  name="birthDate"
                  value={form.birthDate}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>ТЕЛЕФОН *</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+7 (___) ___-__-__"
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>СЕРИЯ ПАСПОРТА *</label>
                <input
                  type="text"
                  name="passportSeries"
                  value={form.passportSeries}
                  onChange={handleChange}
                  placeholder="0000"
                  maxLength={4}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>НОМЕР ПАСПОРТА *</label>
                <input
                  type="text"
                  name="passportNumber"
                  value={form.passportNumber}
                  onChange={handleChange}
                  placeholder="000000"
                  maxLength={6}
                  style={inputStyle}
                />
              </div>

              <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
                <label style={labelStyle}>АДРЕС РЕГИСТРАЦИИ *</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="г. Москва, ул. Пример, д. 1, кв. 1"
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>ОБРАЗОВАТЕЛЬНАЯ ОРГАНИЗАЦИЯ *</label>
                <input
                  type="text"
                  name="school"
                  value={form.school}
                  onChange={handleChange}
                  placeholder="ГБОУ Школа №..."
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>КЛАСС *</label>
                <select
                  name="grade"
                  value={form.grade}
                  onChange={handleChange}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">Выберите класс</option>
                  {[7, 8, 9, 10, 11].map((g) => (
                    <option key={g} value={g}>
                      {g} класс
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
                <label style={labelStyle}>ЭЛЕКТРОННАЯ ПОЧТА</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@mail.ru"
                  style={inputStyle}
                />
              </div>

              {/* Password */}
              <div style={fieldStyle}>
                <label style={labelStyle}>ПАРОЛЬ ДЛЯ ЛИЧНОГО КАБИНЕТА *</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={(e) => { handleChange(e); setPasswordError(""); }}
                  placeholder="Минимум 6 символов"
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>ПОДТВЕРЖДЕНИЕ ПАРОЛЯ *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={(e) => { handleChange(e); setPasswordError(""); }}
                  placeholder="Повтори пароль"
                  style={inputStyle}
                />
              </div>

              {passwordError && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    backgroundColor: "#FEF2F2",
                    border: "2px solid #DC2626",
                    padding: "10px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#DC2626",
                  }}
                >
                  ⚠ {passwordError}
                </div>
              )}
            </div>

            {/* Benefits section */}
            <div
              style={{
                borderTop: "2px solid #000",
                paddingTop: 32,
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    backgroundColor: "#F8EDAD",
                    padding: "4px 12px",
                    border: "2px solid #000",
                  }}
                >
                  <span style={{ color: "#000", fontWeight: 900, fontSize: 13, letterSpacing: "0.5px" }}>
                    ВЫБОР ЛЬГОТ
                  </span>
                </div>
                <span style={{ fontSize: 13, color: "#666" }}>Выберите подходящую категорию</span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                }}
              >
                {benefitCards.map((benefit) => {
                  const isSelected = selectedBenefits.includes(benefit.id);
                  return (
                    <div
                      key={benefit.id}
                      onClick={() => toggleBenefit(benefit.id)}
                      style={{
                        border: "2px solid #000",
                        padding: "16px 20px",
                        cursor: "pointer",
                        backgroundColor: isSelected ? "#ED7C30" : "#fff",
                        boxShadow: isSelected ? "4px 4px 0px #000" : "2px 2px 0px #000",
                        transition: "all 0.1s",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        transform: isSelected ? "translate(-1px,-1px)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: "0.3px" }}>
                          {benefit.label}
                        </span>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            border: "2px solid #000",
                            backgroundColor: isSelected ? "#000" : "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginLeft: 8,
                          }}
                        >
                          {isSelected && (
                            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                              <path d="M1 5L4.5 8.5L11 1.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: "#555", lineHeight: 1.4 }}>
                        {benefit.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* File upload */}
            <div
              style={{
                borderTop: "2px solid #000",
                paddingTop: 32,
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    backgroundColor: "#000",
                    padding: "4px 12px",
                  }}
                >
                  <span style={{ color: "#fff", fontWeight: 900, fontSize: 13, letterSpacing: "0.5px" }}>
                    ДОКУМЕНТЫ
                  </span>
                </div>
                <span style={{ fontSize: 13, color: "#666" }}>Загрузите необходимые документы (PDF, JPG, PNG)</span>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  border: `3px dashed #000`,
                  backgroundColor: dragOver ? "#f0f0ff" : "#fafafa",
                  padding: "48px 32px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "background 0.1s",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 16 }}>📎</div>
                <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>
                  ПЕРЕТАЩИ ФАЙЛЫ СЮДА
                </div>
                <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
                  или нажми для выбора файлов
                </div>
                <div
                  style={{
                    display: "inline-block",
                    padding: "8px 20px",
                    border: "2px solid #000",
                    backgroundColor: "#fff",
                    fontWeight: 900,
                    fontSize: 13,
                    letterSpacing: "0.5px",
                  }}
                >
                  ВЫБРАТЬ ФАЙЛЫ
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleFileInput}
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {uploadedFiles.map((file, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 16px",
                        border: "2px solid #000",
                        backgroundColor: "#f5fff5",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>✅</span>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{file}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agreement + Submit */}
            <div style={{ borderTop: "2px solid #000", paddingTop: 32 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 28,
                  cursor: "pointer",
                }}
                onClick={() => setAgreed(!agreed)}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    border: "2px solid #000",
                    backgroundColor: agreed ? "#000" : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {agreed && (
                    <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                      <path d="M1 5.5L5 9.5L13 1.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: "#000" }}>
                  Я даю согласие на обработку персональных данных в соответствии с Федеральным законом №152-ФЗ «О прсональных данных» и принимаю условия участия в программе «Трудовое лето».
                </span>
              </div>

              <button
                onClick={() => {
                  if (!agreed) return;
                  if (form.password.length < 6) {
                    setPasswordError("Пароль должен содержать минимум 6 символов");
                    return;
                  }
                  if (form.password !== form.confirmPassword) {
                    setPasswordError("Пароли не совпадают");
                    return;
                  }
                  onSuccess({ ...form, benefits: JSON.stringify(selectedBenefits) });
                }}
                style={{
                  width: "100%",
                  padding: "20px",
                  fontSize: 18,
                  fontWeight: 900,
                  color: agreed ? "#000" : "#999",
                  backgroundColor: agreed ? "#ED7C30" : "#f0f0f0",
                  border: `2px solid ${agreed ? "#000" : "#ccc"}`,
                  boxShadow: agreed ? "5px 5px 0px #000" : "none",
                  cursor: agreed ? "pointer" : "not-allowed",
                  letterSpacing: "1px",
                  transition: "all 0.1s",
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (agreed) {
                    (e.currentTarget as HTMLElement).style.transform = "translate(2px,2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "3px 3px 0px #000";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translate(0,0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = agreed ? "5px 5px 0px #000" : "none";
                }}
              >
                ОТПРАВИТЬ ЗАЯВКУ
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}