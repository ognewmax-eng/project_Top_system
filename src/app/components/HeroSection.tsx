import React from "react";

interface HeroSectionProps {
  onApplyClick: () => void;
}

export function HeroSection({ onApplyClick }: HeroSectionProps) {
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
          padding: "80px 24px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 48,
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
              marginBottom: 24,
            }}
          >
            СЕЗОН 2026
          </div>

          <h1
            style={{
              fontSize: "clamp(52px, 8vw, 100px)",
              fontWeight: 900,
              color: "#000",
              lineHeight: 0.9,
              letterSpacing: "-2px",
              margin: "0 0 24px 0",
              textTransform: "uppercase",
            }}
          >
            РАБОТА<br />ДЛЯ<br />ТЕБЯ
          </h1>

          <p
            style={{
              color: "#000",
              fontSize: 18,
              lineHeight: 1.5,
              marginBottom: 40,
              maxWidth: 440,
              fontWeight: 400,
            }}
          >
            Программа временной занятости молодёжи от 14 до 17 лет. Получи официальный опыт, заработок и новые знакомства этим летом.
          </p>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <button
              onClick={onApplyClick}
              style={{
                padding: "18px 40px",
                fontSize: 18,
                fontWeight: 900,
                color: "#000",
                backgroundColor: "#ED7C30",
                border: "2px solid #000",
                boxShadow: "5px 5px 0px #000",
                cursor: "pointer",
                letterSpacing: "0.5px",
                transition: "transform 0.1s, box-shadow 0.1s",
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
              ПОДАТЬ ЗАЯВКУ →
            </button>

            <button
              style={{
                padding: "18px 40px",
                fontSize: 18,
                fontWeight: 900,
                color: "#000",
                backgroundColor: "transparent",
                border: "2px solid #000",
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              УЗНАТЬ БОЛЬШЕ
            </button>
          </div>
        </div>

        {/* Right — Stats cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
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
                boxShadow: "4px 4px 0px #000",
                padding: "24px",
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: "#000",
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                {stat.num}
              </div>
              <div style={{ fontSize: 13, color: "#000", fontWeight: 700, whiteSpace: "pre-line" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}