import React, { useState, useEffect } from "react";
import { getApplicationStats } from "@/api/apiService";
import type { ShiftStats } from "@/api/apiService";
import { useIsMobile } from "@/hooks/useIsMobile";

const SHIFTS = [
  {
    id: 1,
    label: "1 СМЕНА",
    dates: "1 июня — 30 июня",
    totalSpots: 120,
    color: "#F0EAD2",
    accent: "#879E82",
  },
  {
    id: 2,
    label: "2 СМЕНА",
    dates: "1 июля — 31 июля",
    totalSpots: 98,
    color: "#879E82",
    accent: "#003F5C",
  },
  {
    id: 3,
    label: "3 СМЕНА",
    dates: "1 августа — 31 августа",
    totalSpots: 150,
    color: "#003F5C",
    accent: "#F0EAD2",
  },
];

const TOTAL_SPOTS_ALL = 368;

const emptyByShift: Record<string, ShiftStats> = {
  "1": { submitted: 0, approved: 0 },
  "2": { submitted: 0, approved: 0 },
  "3": { submitted: 0, approved: 0 },
};

export function EmployersSection() {
  const mobile = useIsMobile();
  const [totalApplications, setTotalApplications] = useState(0);
  const [totalApproved, setTotalApproved] = useState(0);
  const [byShift, setByShift] = useState<Record<string, ShiftStats>>(emptyByShift);

  useEffect(() => {
    getApplicationStats().then((stats) => {
      setTotalApplications(stats.total);
      setTotalApproved(stats.approved);
      setByShift(stats.byShift);
    });
  }, []);

  const totalFree = Math.max(0, TOTAL_SPOTS_ALL - totalApproved);

  return (
    <section
      id="employers"
      style={{
        backgroundColor: "#fff",
        borderBottom: "none",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: mobile ? "48px 20px" : "80px 24px" }}>

        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: mobile ? "flex-start" : "flex-end",
            justifyContent: "space-between",
            marginBottom: mobile ? 28 : 48,
            flexWrap: "wrap",
            gap: mobile ? 16 : 24,
            flexDirection: mobile ? "column" : "row",
          }}
        >
          <div>
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#879E82",
                border: "none",
                color: "#003F5C",
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
                fontSize: mobile ? "clamp(28px, 8vw, 40px)" : "clamp(36px, 5vw, 60px)",
                fontWeight: 900,
                color: "#003F5C",
                lineHeight: 1,
                letterSpacing: "-1px",
                margin: 0,
              }}
            >
              СВОБОДНЫЕ<br />МЕСТА
            </h2>
          </div>

          <div
            style={{
              border: "none",
              boxShadow: "none",
              padding: mobile ? "14px 20px" : "20px 32px",
              backgroundColor: "#F0EAD2",
              textAlign: "center",
              width: mobile ? "100%" : undefined,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: "1px", color: "rgba(0,63,92,0.5)", marginBottom: 4 }}>
              ВСЕГО СВОБОДНО
            </div>
            <div style={{ fontSize: mobile ? 40 : 52, fontWeight: 900, lineHeight: 1, color: "#003F5C" }}>
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
            gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)",
            border: "none",
            boxShadow: "none",
          }}
        >
          {SHIFTS.map((shift, i) => {
            const sid = String(shift.id);
            const stats = byShift[sid] ?? { submitted: 0, approved: 0 };
            const freeSpots = Math.max(0, shift.totalSpots - stats.approved);
            const occupiedPercent = shift.totalSpots > 0 ? Math.round((stats.approved / shift.totalSpots) * 100) : 0;
            const isLast = i === SHIFTS.length - 1;

            return (
              <div
                key={shift.id}
                style={{
                  backgroundColor: shift.color,
                  borderRight: !mobile && !isLast ? "none" : "none",
                  borderBottom: mobile && !isLast ? "none" : "none",
                  padding: mobile ? "28px 20px" : "36px 28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    border: "none",
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 900,
                    color: shift.id === 3 ? "#fff" : "#003F5C",
                    letterSpacing: "1px",
                    alignSelf: "flex-start",
                    marginBottom: 20,
                  }}
                >
                  {shift.label}
                </div>

                <div
                  style={{
                    fontSize: mobile ? 52 : 72,
                    fontWeight: 900,
                    color: shift.id === 3 ? "#F0EAD2" : "#003F5C",
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
                    color: shift.id === 3 ? "rgba(255,255,255,0.7)" : "rgba(0,63,92,0.5)",
                    letterSpacing: "0.5px",
                    marginBottom: 8,
                  }}
                >
                  СВОБОДНЫХ МЕСТ
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: shift.id === 3 ? "rgba(255,255,255,0.6)" : "rgba(0,63,92,0.5)",
                    marginBottom: 24,
                  }}
                >
                  Подано: {stats.submitted} · Одобрено: {stats.approved}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      height: 8,
                      border: "none",
                      backgroundColor: "transparent",
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${occupiedPercent}%`,
                        backgroundColor: shift.id === 3 ? "#879E82" : "#003F5C",
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
                      color: shift.id === 3 ? "rgba(255,255,255,0.6)" : "rgba(0,63,92,0.5)",
                    }}
                  >
                    <span>ЗАНЯТО {occupiedPercent}%</span>
                    <span>ВСЕГО {shift.totalSpots}</span>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: `2px solid ${shift.id === 3 ? "rgba(255,255,255,0.2)" : "rgba(0,63,92,0.15)"}`,
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
                      color: shift.id === 3 ? "rgba(255,255,255,0.8)" : "rgba(0,63,92,0.6)",
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
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            padding: "12px 16px",
            border: "none",
            backgroundColor: "#eeeadf",
            flexDirection: mobile ? "column" : "row",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>ℹ️</span>
            Количество свободных мест обновляется по мере одобрения заявок. Успей записаться!
          </span>
          <span style={{ fontSize: 13, fontWeight: 900, color: "#003F5C", letterSpacing: "0.5px" }}>
            Подано заявок: {totalApplications}
          </span>
        </div>

      </div>
    </section>
  );
}
