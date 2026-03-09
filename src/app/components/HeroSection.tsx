import React from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface HeroSectionProps {
  onApplyClick: () => void;
}

export function HeroSection({ onApplyClick }: HeroSectionProps) {
  const mobile = useIsMobile();

  return (
    <section
      id="about"
      style={{
        backgroundColor: "#F8EDAD",
        borderBottom: "2px solid #000",
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: mobile ? "48px 20px" : "80px 24px",
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
          gap: mobile ? 32 : 48,
          alignItems: "center",
        }}
      >
        {/* Left */}
        <div>
          <div
            style={{
              display: "inline-block",
              backgroundColor: "#ED7C30",
              border: "2px solid #000",
              padding: "4px 12px",
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: "1px",
              marginBottom: mobile ? 16 : 24,
            }}
          >
            СЕЗОН 2026
          </div>

          <h1
            style={{
              fontSize: mobile ? "clamp(40px, 12vw, 60px)" : "clamp(52px, 8vw, 100px)",
              fontWeight: 900,
              color: "#000",
              lineHeight: 0.9,
              letterSpacing: "-2px",
              margin: mobile ? "0 0 16px 0" : "0 0 24px 0",
              textTransform: "uppercase",
            }}
          >
            РАБОТА<br />ДЛЯ<br />ТЕБЯ
          </h1>

          <p
            style={{
              color: "#000",
              fontSize: mobile ? 15 : 18,
              lineHeight: 1.5,
              marginBottom: mobile ? 24 : 40,
              maxWidth: 440,
              fontWeight: 400,
            }}
          >
            Программа временной занятости молодёжи от 14 до 17 лет. Получи официальный опыт, заработок и новые знакомства этим летом.
          </p>

          <div style={{ display: "flex", gap: mobile ? 10 : 16, flexWrap: "wrap" }}>
            <button
              onClick={onApplyClick}
              style={{
                padding: mobile ? "14px 24px" : "18px 40px",
                fontSize: mobile ? 15 : 18,
                fontWeight: 900,
                color: "#000",
                backgroundColor: "#ED7C30",
                border: "2px solid #000",
                boxShadow: "5px 5px 0px #000",
                cursor: "pointer",
                letterSpacing: "0.5px",
                flex: mobile ? "1 1 100%" : undefined,
              }}
            >
              ПОДАТЬ ЗАЯВКУ →
            </button>

          </div>
        </div>

        {/* Right — Stats cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: mobile ? 10 : 16,
          }}
        >
          {[
            { num: "14–17", label: "лет — возраст\nучастников" },
            { num: "1000+", label: "подростков\nтрудоустроено" },
            { num: "2 нед.", label: "длительность\nпрограммы" },
            { num: "100%", label: "официальное\nтрудоустройство" },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                backgroundColor: i % 2 === 0 ? "#fff" : "#ED7C30",
                border: "2px solid #000",
                boxShadow: mobile ? "3px 3px 0px #000" : "4px 4px 0px #000",
                padding: mobile ? "16px" : "24px",
              }}
            >
              <div
                style={{
                  fontSize: mobile ? 24 : 36,
                  fontWeight: 900,
                  color: "#000",
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                {stat.num}
              </div>
              <div style={{ fontSize: mobile ? 11 : 13, color: "#000", fontWeight: 700, whiteSpace: "pre-line" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
