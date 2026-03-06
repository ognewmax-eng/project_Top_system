import React from "react";

interface SuccessModalProps {
  onClose: () => void;
  onCabinet: () => void;
}

export function SuccessModal({ onClose, onCabinet }: SuccessModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        fontFamily: "'Inter', sans-serif",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#fff",
          border: "2px solid #000",
          boxShadow: "8px 8px 0px #000",
          maxWidth: 480,
          width: "100%",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            backgroundColor: "#F8EDAD",
            padding: "24px 32px",
            borderBottom: "2px solid #000",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: "#000", fontWeight: 900, fontSize: 16, letterSpacing: "0.5px" }}>
            ЗАЯВКА ОТПРАВЛЕНА
          </span>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              border: "2px solid #000",
              backgroundColor: "transparent",
              color: "#000",
              fontWeight: 900,
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "32px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div
              style={{
                width: 80,
                height: 80,
                backgroundColor: "#ED7C30",
                border: "2px solid #000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                margin: "0 auto 20px",
              }}
            >
              ✓
            </div>
            <h3
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: "#000",
                margin: "0 0 12px",
                lineHeight: 1,
              }}
            >
              ОТЛИЧНО!
            </h3>
            <p style={{ fontSize: 15, color: "#555", lineHeight: 1.6, margin: 0 }}>
              Твоя заявка успешно принята. Номер заявки: <strong>#2025-4821</strong>. Следи за статусом в личном кабинете.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#ED7C30",
              border: "2px solid #000",
              padding: "16px 20px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                backgroundColor: "#000",
                borderRadius: "50%",
              }}
            />
            <span style={{ fontWeight: 900, fontSize: 14, letterSpacing: "0.5px" }}>
              НА ПРОВЕРКЕ — ОЖИДАЕТСЯ ОТВЕТ В ТЕЧЕНИЕ 3 ДНЕЙ
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={onCabinet}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: 15,
                fontWeight: 900,
                color: "#000",
                backgroundColor: "#ED7C30",
                border: "2px solid #000",
                boxShadow: "4px 4px 0px #000",
                cursor: "pointer",
                letterSpacing: "0.5px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              ОТКРЫТЬ ЛИЧНЫЙ КАБИНЕТ
            </button>
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: 15,
                fontWeight: 900,
                color: "#000",
                backgroundColor: "#fff",
                border: "2px solid #000",
                cursor: "pointer",
                letterSpacing: "0.5px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              ЗАКРЫТЬ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}