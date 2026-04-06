import React, { useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface HeaderProps {
  onCabinetClick: () => void;
  onAdminClick: () => void;
  activeSection: string;
}

export function Header({ onCabinetClick, onAdminClick }: HeaderProps) {
  const mobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      style={{
        borderBottom: "none",
        backgroundColor: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 100,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              backgroundColor: "#F0EAD2",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#003F5C", fontWeight: 900, fontSize: 11 }}>ТОП</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ fontWeight: 900, fontSize: mobile ? 15 : 18, letterSpacing: "-0.5px", color: "#003F5C" }}>
              ТРУДОВЫЕ ОТРЯДЫ
            </span>
            <span style={{ fontWeight: 700, fontSize: mobile ? 10 : 12, letterSpacing: "1px", color: "#555" }}>
              ПОДРОСТКОВ
            </span>
          </div>
        </div>

        {mobile ? (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: 40, height: 40, border: "none", backgroundColor: menuOpen ? "#F0EAD2" : "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontFamily: "'Inter', sans-serif",
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={onAdminClick}
              style={{
                padding: "8px 16px", fontSize: 12, fontWeight: 900, color: "#fff",
                backgroundColor: "#003F5C", border: "none", boxShadow: "none",
                cursor: "pointer", letterSpacing: "1px", fontFamily: "'Inter', sans-serif",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              Админ. панель
            </button>
            <button
              onClick={onCabinetClick}
              style={{
                padding: "8px 20px", fontSize: 13, fontWeight: 900, color: "#003F5C",
                backgroundColor: "#F0EAD2", border: "none", boxShadow: "none",
                cursor: "pointer", letterSpacing: "0.5px", fontFamily: "'Inter', sans-serif",
              }}
            >
              ЛИЧНЫЙ КАБИНЕТ
            </button>
          </div>
        )}
      </div>

      {mobile && menuOpen && (
        <div style={{ borderTop: "none", padding: "12px 24px", display: "flex", flexDirection: "column", gap: 10, backgroundColor: "#fff" }}>
          <button
            onClick={() => { setMenuOpen(false); onAdminClick(); }}
            style={{
              width: "100%", padding: "12px", fontSize: 13, fontWeight: 900, color: "#fff",
              backgroundColor: "#003F5C", border: "none", cursor: "pointer",
              letterSpacing: "1px", fontFamily: "'Inter', sans-serif",
            }}
          >
            АДМИН. ПАНЕЛЬ
          </button>
          <button
            onClick={() => { setMenuOpen(false); onCabinetClick(); }}
            style={{
              width: "100%", padding: "12px", fontSize: 13, fontWeight: 900, color: "#003F5C",
              backgroundColor: "#F0EAD2", border: "none", cursor: "pointer",
              letterSpacing: "0.5px", fontFamily: "'Inter', sans-serif",
            }}
          >
            ЛИЧНЫЙ КАБИНЕТ
          </button>
        </div>
      )}
    </header>
  );
}
