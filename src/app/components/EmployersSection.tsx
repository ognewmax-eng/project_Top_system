import React, { useEffect, useState } from "react";

const SHIFTS = [
  {
    id: 1,
    label: "1 СМЕНА",
    dates: "1 июня — 30 июня",
    totalSpots: 150,
    approvedBase: 30,
    color: "#F8EDAD",
    accent: "#ED7C30",
  },
  {
    id: 2,
    label: "2 СМЕНА",
    dates: "1 июля — 31 июля",
    totalSpots: 130,
    approvedBase: 32,
    color: "#ED7C30",
    accent: "#000",
  },
  {
    id: 3,
    label: "3 СМЕНА",
    dates: "1 августа — 31 августа",
    totalSpots: 180,
    approvedBase: 30,
    color: "#000",
    accent: "#F8EDAD",
  },
];

export function EmployersSection() {
  const [approvedCount, setApprovedCount] = useState(0);

  useEffect(() => {
    // Считаем одобренные заявки из localStorage
    // В реальном приложении это приходит с сервера
    const raw = localStorage.getItem("top_approved_count");
    if (raw) setApprovedCount(parseInt(raw, 10));
  }, []);

  const totalFree = SHIFTS.reduce((sum, s) => {
    const free = Math.max(0, s.totalSpots - s.approvedBase - Math.floor(approvedCount / SHIFTS.length));
    return sum + free;
  }, 0);

  return (
    <section
      id="employers"
      style={{
        backgroundColor: "#fff",
        borderBottom: "2px solid #000",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>

        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 48,
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div>
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#ED7C30",
                border: "2px solid #000",
                color: "#000",
                padding: "4px 12px",
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: "1px",
                marginBottom: 16,
              }}
            >
              ЗАПИСЬ ОТКРЫТА
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
              СВОБОДНЫЕ<br />МЕСТА
            </h2>
          </div>

          {/* Total counter */}
          <div
            style={{
              border: "2px solid #000",
              boxShadow: "5px 5px 0px #000",
              padding: "20px 32px",
              backgroundColor: "#F8EDAD",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: "1px", color: "rgba(0,0,0,0.5)", marginBottom: 4 }}>
              ВСЕГО СВОБОДНО
            </div>
            <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, color: "#000" }}>
              {totalFree}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginTop: 4 }}>
              МЕСТ НА ВСЕ СМЕНЫ
            </div>
          </div>
        </div>

        {/* Shift cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            border: "2px solid #000",
            boxShadow: "6px 6px 0px #000",
          }}
        >
          {SHIFTS.map((shift, i) => {
            const freeSpots = Math.max(0, shift.totalSpots - shift.approvedBase - Math.floor(approvedCount / SHIFTS.length));
            const occupiedPercent = Math.round(((shift.totalSpots - freeSpots) / shift.totalSpots) * 100);
            const isLast = i === SHIFTS.length - 1;

            return (
              <div
                key={shift.id}
                style={{
                  backgroundColor: shift.color,
                  borderRight: !isLast ? "2px solid #000" : "none",
                  padding: "36px 28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                {/* Shift label */}
                <div
                  style={{
                    display: "inline-block",
                    border: `2px solid ${shift.id === 3 ? "#fff" : "#000"}`,
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 900,
                    color: shift.id === 3 ? "#fff" : "#000",
                    letterSpacing: "1px",
                    alignSelf: "flex-start",
                    marginBottom: 20,
                  }}
                >
                  {shift.label}
                </div>

                {/* Free spots number */}
                <div
                  style={{
                    fontSize: 72,
                    fontWeight: 900,
                    color: shift.id === 3 ? "#F8EDAD" : "#000",
                    lineHeight: 1,
                    letterSpacing: "-2px",
                    marginBottom: 4,
                  }}
                >
                  {freeSpots}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 900,
                    color: shift.id === 3 ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)",
                    letterSpacing: "0.5px",
                    marginBottom: 24,
                  }}
                >
                  СВОБОДНЫХ МЕСТ
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      height: 8,
                      border: `2px solid ${shift.id === 3 ? "#fff" : "#000"}`,
                      backgroundColor: "transparent",
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${occupiedPercent}%`,
                        backgroundColor: shift.id === 3 ? "#ED7C30" : "#000",
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      fontWeight: 700,
                      color: shift.id === 3 ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
                    }}
                  >
                    <span>ЗАНЯТО {occupiedPercent}%</span>
                    <span>ВСЕГО {shift.totalSpots}</span>
                  </div>
                </div>

                {/* Dates */}
                <div
                  style={{
                    borderTop: `2px solid ${shift.id === 3 ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}`,
                    paddingTop: 16,
                    marginTop: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 16 }}>📅</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: shift.id === 3 ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)",
                    }}
                  >
                    {shift.dates}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Note */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            border: "2px solid #000",
            backgroundColor: "#f5f5f5",
          }}
        >
          <span style={{ fontSize: 14 }}>ℹ️</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>
            Количество свободных мест обновляется по мере одобрения заявок. Успей записаться!
          </span>
        </div>

      </div>
    </section>
  );
}
