import React from "react";

interface HeaderProps {
  onCabinetClick: () => void;
  onAdminClick: () => void;
  activeSection: string;
}

export function Header({ onCabinetClick, onAdminClick }: HeaderProps) {
  return (
    <header
      style={{
        borderBottom: "2px solid #000",
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
              backgroundColor: "#F8EDAD",
              border: "2px solid #000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#000", fontWeight: 900, fontSize: 11 }}>ТОП</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.5px", color: "#000" }}>
              ТРУДОВЫЕ ОТРЯДЫ
            </span>
            <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: "1px", color: "#555" }}>
              ПОДРОСТКОВ
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

          {/* Admin button */}
          <button
            onClick={onAdminClick}
            style={{
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 900,
              color: "#fff",
              backgroundColor: "#000",
              border: "2px solid #000",
              boxShadow: "3px 3px 0px #ED7C30",
              cursor: "pointer",
              letterSpacing: "1px",
              transition: "transform 0.1s, box-shadow 0.1s",
              fontFamily: "'Inter', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translate(1px,1px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "2px 2px 0px #ED7C30";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translate(0,0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "3px 3px 0px #ED7C30";
            }}
          >
            ⚙ ADMIN
          </button>

          {/* Cabinet button */}
          <button
            onClick={onCabinetClick}
            style={{
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 900,
              color: "#000",
              backgroundColor: "#F8EDAD",
              border: "2px solid #000",
              boxShadow: "3px 3px 0px #000",
              cursor: "pointer",
              letterSpacing: "0.5px",
              transition: "transform 0.1s, box-shadow 0.1s",
              fontFamily: "'Inter', sans-serif",
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
            ЛИЧНЫЙ КАБИНЕТ
          </button>
        </div>
      </div>
    </header>
  );
}
