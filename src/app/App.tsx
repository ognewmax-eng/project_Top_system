import React, { useState } from "react";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { HowItWorks } from "./components/HowItWorks";
import { RegistrationForm } from "./components/RegistrationForm";
import { EmployersSection } from "./components/EmployersSection";
import { PersonalCabinet } from "./components/PersonalCabinet";
import { SuccessModal } from "./components/SuccessModal";
import { LoginModal } from "./components/LoginModal";
import { AdminPanel } from "./components/AdminPanel";
import { Footer } from "./components/Footer";

export default function App() {
  const [view, setView] = useState<"main" | "cabinet" | "admin">("main");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [userData, setUserData] = useState<Record<string, string> | null>(() => {
    try {
      const raw = localStorage.getItem("top_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const scrollToForm = () => {
    const el = document.getElementById("register");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleFormSuccess = (data: Record<string, string>) => {
    // Сохраняем текущего пользователя для входа
    localStorage.setItem("top_user", JSON.stringify(data));
    setUserData(data);

    // Добавляем заявку в общий список для администратора
    const raw = localStorage.getItem("top_applications");
    let apps: Record<string, unknown>[];
    try {
      apps = raw ? JSON.parse(raw) : [];
    } catch {
      apps = [];
    }
    const { password: _pw, ...dataWithoutPassword } = data;
    const newApp = {
      ...dataWithoutPassword,
      id: `app_${Date.now()}`,
      status: "review",
      benefits: data.benefits ? (() => { try { return JSON.parse(data.benefits); } catch { return []; } })() : [],
      createdAt: new Date().toISOString(),
    };
    apps.push(newApp);
    localStorage.setItem("top_applications", JSON.stringify(apps));

    setShowSuccess(true);
  };

  const handleOpenCabinet = () => {
    setShowSuccess(false);
    setShowLogin(false);
    setView("cabinet");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCabinetClick = () => {
    if (userData) {
      setView("cabinet");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setShowLogin(true);
    }
  };

  const handleLoginSuccess = () => {
    try {
      const raw = localStorage.getItem("top_user");
      if (raw) setUserData(JSON.parse(raw));
    } catch {
      setUserData(null);
    }
    handleOpenCabinet();
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#fff" }}>
      {view === "cabinet" ? (
        <PersonalCabinet
          onBack={() => setView("main")}
          userData={userData}
          onDataUpdate={() => {
            try {
              const raw = localStorage.getItem("top_user");
              if (raw) setUserData(JSON.parse(raw));
            } catch {
              setUserData(null);
            }
          }}
        />
      ) : view === "admin" ? (
        <AdminPanel onBack={() => setView("main")} />
      ) : (
        <>
          <Header
            onCabinetClick={handleCabinetClick}
            onAdminClick={() => setView("admin")}
            activeSection="main"
          />
          <HeroSection onApplyClick={scrollToForm} />
          <HowItWorks />
          <EmployersSection />
          <RegistrationForm onSuccess={handleFormSuccess} />
          <Footer />
        </>
      )}

      {showSuccess && (
        <SuccessModal
          onClose={() => setShowSuccess(false)}
          onCabinet={handleOpenCabinet}
        />
      )}

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
