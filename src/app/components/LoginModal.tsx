import React, { useState } from "react";
import { loginUser } from "@/api/apiService";
import { useIsMobile } from "@/hooks/useIsMobile";

interface LoginModalProps {
  onClose: () => void;
  onSuccess: (user: Record<string, string>) => void;
}

export function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const mobile = useIsMobile();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Заполни все поля");
      return;
    }
    setLoading(true);
    try {
      const res = await loginUser(email.trim(), password);
      const userData: Record<string, string> = {};
      if (res.user) {
        Object.entries(res.user).forEach(([k, v]) => {
          if (v !== null && v !== undefined) userData[k] = String(v);
        });
      }
      onSuccess(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,63,92,0.6)",
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
          border: "none",
          boxShadow: "none",
          width: "100%",
          maxWidth: 440,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#F0EAD2",
            padding: mobile ? "16px 20px" : "20px 28px",
            borderBottom: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,63,92,0.5)", letterSpacing: "1px", marginBottom: 4 }}>
              ТРУДОВЫЕ ОТРЯДЫ ПОДРОСТКОВ
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#003F5C", letterSpacing: "-0.5px" }}>
              ЛИЧНЫЙ КАБИНЕТ
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              border: "none",
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
        <div style={{ padding: mobile ? "20px 16px" : "28px" }}>
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
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: 16,
              fontWeight: 900,
              color: "#fff",
              backgroundColor: loading ? "#ccc" : "#003F5C",
              border: "none",
              boxShadow: "none",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "1px",
              transition: "background 0.15s",
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = "#002d44";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = loading ? "#ccc" : "#003F5C";
            }}
          >
            {loading ? "ВХОД…" : "ВОЙТИ"}
          </button>

          <p style={{ fontSize: 12, color: "#888", marginTop: 16, textAlign: "center", lineHeight: 1.5 }}>
            Ещё не зарегистрирован?{" "}
            <a
              href="#register"
              onClick={onClose}
              style={{ color: "#003F5C", fontWeight: 900, textDecoration: "underline" }}
            >
              ЗАПОЛНИ ЗАЯВКУ
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
