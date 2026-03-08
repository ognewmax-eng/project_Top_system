import React, { useState } from "react";

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  const handleLogin = () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Заполни все поля");
      return;
    }
    const raw = localStorage.getItem("top_user");
    if (!raw) {
      setError("Пользователь не найден. Сначала заполни форму регистрации.");
      return;
    }
    let user: Record<string, string>;
    try {
      user = JSON.parse(raw);
    } catch {
      setError("Ошибка данных. Попробуйте зарегистрироваться снова.");
      return;
    }
    if (user.email?.toLowerCase() !== email.trim().toLowerCase()) {
      setError("Неверный email или пароль");
      return;
    }
    if (user.password !== password) {
      setError("Неверный email или пароль");
      return;
    }
    onSuccess();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "24px",
        fontFamily: "'Inter', sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          border: "2px solid #000",
          boxShadow: "8px 8px 0px #000",
          width: "100%",
          maxWidth: 440,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#F8EDAD",
            padding: "20px 28px",
            borderBottom: "2px solid #000",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.5)", letterSpacing: "1px", marginBottom: 4 }}>
              ТРУДОВЫЕ ОТРЯДЫ ПОДРОСТКОВ
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#000", letterSpacing: "-0.5px" }}>
              ЛИЧНЫЙ КАБИНЕТ
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              border: "2px solid #000",
              backgroundColor: "transparent",
              cursor: "pointer",
              fontSize: 18,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "28px" }}>
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.5, marginBottom: 24 }}>
            Введи email и пароль, которые ты указал при регистрации.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 24 }}>
            <div>
              <label style={labelStyle}>ЭЛЕКТРОННАЯ ПОЧТА</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.ru"
                style={inputStyle}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <div>
              <label style={labelStyle}>ПАРОЛЬ</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 48 }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 16,
                    padding: 0,
                  }}
                  title={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: "#FEF2F2",
                border: "2px solid #DC2626",
                padding: "12px 16px",
                marginBottom: 20,
                fontSize: 13,
                fontWeight: 700,
                color: "#DC2626",
              }}
            >
              ⚠ {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: 16,
              fontWeight: 900,
              color: "#000",
              backgroundColor: "#ED7C30",
              border: "2px solid #000",
              boxShadow: "5px 5px 0px #000",
              cursor: "pointer",
              letterSpacing: "1px",
              transition: "all 0.1s",
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translate(2px,2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "3px 3px 0px #000";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translate(0,0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "5px 5px 0px #000";
            }}
          >
            ВОЙТИ
          </button>

          <p style={{ fontSize: 12, color: "#888", marginTop: 16, textAlign: "center", lineHeight: 1.5 }}>
            Ещё не зарегистрирован?{" "}
            <a
              href="#register"
              onClick={onClose}
              style={{ color: "#000", fontWeight: 900, textDecoration: "underline" }}
            >
              ЗАПОЛНИ ЗАЯВКУ
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
