import React from "react";

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#000",
        fontFamily: "'Inter', sans-serif",
        color: "#fff",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: 48,
            marginBottom: 48,
            paddingBottom: 48,
            borderBottom: "2px solid #333",
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: "#F8EDAD",
                  border: "2px solid #fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "#000", fontWeight: 900, fontSize: 14 }}>ТОП</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.5px" }}>
                  ТРУДОВЫЕ ОТРЯДЫ
                </span>
                <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: "1px", color: "#888" }}>
                  ПОДРОСТКОВ
                </span>
              </div>
            </div>
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6, maxWidth: 320, margin: "0 0 20px" }}>
              Программа временной занятости молодёжи города Москвы. Официальное трудоустройство подростков от 14 до 18 лет.
            </p>
            <div
              style={{
                display: "inline-block",
                backgroundColor: "#F8EDAD",
                border: "2px solid #fff",
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 900,
                color: "#000",
              }}
            >
              СЕЗОН ЛЕТО 2025
            </div>
          </div>

          {/* Links */}
          <div>
            <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: "1px", marginBottom: 20, color: "#fff" }}>
              РАЗДЕЛЫ
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "О программе",
                "Как участвовать",
                "Работодатели",
                "Подать заявку",
                "Личный кабинет",
              ].map((link) => (
                <a
                  key={link}
                  href="#"
                  style={{
                    fontSize: 14,
                    color: "#888",
                    textDecoration: "none",
                    transition: "color 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#888";
                  }}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Contacts */}
          <div>
            <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: "1px", marginBottom: 20, color: "#fff" }}>
              КОНТАКТЫ
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "#555", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 4 }}>
                  ТЕЛЕФОН
                </div>
                <a href="tel:88001234567" style={{ fontSize: 16, color: "#fff", fontWeight: 900, textDecoration: "none" }}>
                  8 800 123-45-67
                </a>
                <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Бесплатно по России</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#555", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 4 }}>
                  EMAIL
                </div>
                <a href="mailto:info@trudovoelete.ru" style={{ fontSize: 14, color: "#0077ff", textDecoration: "none" }}>
                  info@trudovoelete.ru
                </a>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#555", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 8 }}>
                  СОЦСЕТИ
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["ВК", "ТГ", "ОК"].map((sn) => (
                    <a
                      key={sn}
                      href="#"
                      style={{
                        width: 36,
                        height: 36,
                        border: "2px solid #333",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 900,
                        color: "#fff",
                        textDecoration: "none",
                        transition: "border-color 0.1s, background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "#F8EDAD";
                        (e.currentTarget as HTMLElement).style.borderColor = "#F8EDAD";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLElement).style.borderColor = "#333";
                      }}
                    >
                      {sn}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13, color: "#555" }}>
            © 2025 Трудовые отряды подростков. Все права защищены.
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {["Политика конфиденциальности", "Пользовательское соглашение"].map((link) => (
              <a
                key={link}
                href="#"
                style={{ fontSize: 12, color: "#555", textDecoration: "none" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#555";
                }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}