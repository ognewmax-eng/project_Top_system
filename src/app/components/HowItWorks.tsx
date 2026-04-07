import React from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

export function HowItWorks() {
  const mobile = useIsMobile();

  const steps = [
    {
      num: "01",
      title: "ЗАРЕГИСТРИРУЙСЯ",
      desc: "Заполни анкету на сайте: укажи данные, выбери льготы, загрузи документы.",
      color: "#879E82",
    },
    {
      num: "02",
      title: "ДОЖДИСЬ РЕШЕНИЯ",
      desc: "Твоя заявка будет проверена в течение 10 рабочих дней. Следи за статусом в личном кабинете.",
      color: "#fff",
    },
    {
      num: "03",
      title: "ПОЛУЧИ НАПРАВЛЕНИЕ",
      desc: "При одобрении — получи направление к работодателю и подпиши договор.",
      color: "#F0EAD2",
      textColor: "#003F5C",
    },
    {
      num: "04",
      title: "НАЧНИ РАБОТАТЬ",
      desc: "Приступи к работе и получай официальную заработную плату каждые 2 недели.",
      color: "#879E82",
    },
  ];

  return (
    <section
      id="how"
      style={{
        backgroundColor: "#eeeadf",
        borderBottom: "none",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: mobile ? "48px 20px" : "80px 24px" }}>
        <div style={{ marginBottom: mobile ? 28 : 48 }}>
          <span
            style={{
              display: "inline-block",
              backgroundColor: "#003F5C",
              color: "#fff",
              padding: "4px 12px",
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: "1px",
              marginBottom: 16,
            }}
          >
            КАК ЭТО РАБОТАЕТ
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
            4 ШАГА ДО<br />ПЕРВОЙ РАБОТЫ
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "repeat(4, 1fr)",
            gap: 0,
            border: "none",
          }}
        >
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                backgroundColor: step.color,
                borderRight: !mobile && i < steps.length - 1 ? "none" : "none",
                borderBottom: mobile && i < steps.length - 1 ? "none" : "none",
                padding: mobile ? "24px 20px" : "32px 24px",
                display: "flex",
                flexDirection: mobile ? "row" : "column",
                gap: 16,
                alignItems: mobile ? "flex-start" : undefined,
              }}
            >
              <div
                style={{
                  fontSize: mobile ? 36 : 48,
                  fontWeight: 900,
                  color: step.textColor || "#003F5C",
                  lineHeight: 1,
                  opacity: 0.3,
                  flexShrink: 0,
                }}
              >
                {step.num}
              </div>
              <div>
                <div
                  style={{
                    fontSize: mobile ? 15 : 18,
                    fontWeight: 900,
                    color: step.textColor || "#003F5C",
                    lineHeight: 1.1,
                    marginBottom: 8,
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontSize: mobile ? 13 : 14,
                    color: step.textColor || "#003F5C",
                    lineHeight: 1.5,
                    opacity: 0.85,
                  }}
                >
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
