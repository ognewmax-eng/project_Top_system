import React from "react";

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "ЗАРЕГИСТРИРУЙСЯ",
      desc: "Заполни анкету на сайте: укажи данные, выбери льготы, загрузи документы.",
      color: "#ED7C30",
    },
    {
      num: "02",
      title: "ДОЖДИСЬ РЕШЕНИЯ",
      desc: "Твоя заявка будет проверена в течение 3 рабочих дней. Следи за статусом в личном кабинете.",
      color: "#fff",
    },
    {
      num: "03",
      title: "ПОЛУЧИ НАПРАВЛЕНИЕ",
      desc: "При одобрении — получи направление к работодателю и подпиши договор.",
      color: "#F8EDAD",
      textColor: "#000",
    },
    {
      num: "04",
      title: "НАЧНИ РАБОТАТЬ",
      desc: "Приступи к работе и получай официальную заработную плату каждые 2 недели.",
      color: "#ED7C30",
    },
  ];

  return (
    <section
      id="how"
      style={{
        backgroundColor: "#f5f5f5",
        borderBottom: "2px solid #000",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ marginBottom: 48 }}>
          <span
            style={{
              display: "inline-block",
              backgroundColor: "#000",
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
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: 900,
              color: "#000",
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
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            border: "2px solid #000",
          }}
        >
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                backgroundColor: step.color,
                borderRight: i < steps.length - 1 ? "2px solid #000" : "none",
                padding: "32px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: step.textColor || "#000",
                  lineHeight: 1,
                  opacity: 0.3,
                }}
              >
                {step.num}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: step.textColor || "#000",
                  lineHeight: 1.1,
                }}
              >
                {step.title}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: step.textColor || "#000",
                  lineHeight: 1.5,
                  opacity: 0.85,
                }}
              >
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}