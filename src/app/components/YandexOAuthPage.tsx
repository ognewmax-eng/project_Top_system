/**
 * Страница /yandexouth — настройка OAuth для загрузки файлов на Яндекс.Диск.
 * Доступ только по прямой ссылке. Запускает поток авторизации и отображает результат после callback.
 */

import React, { useEffect, useState } from "react";

const API_BASE = `${typeof window !== "undefined" ? window.location.origin : ""}/api`;

type Status = "idle" | "loading" | "success" | "error" | "no_config";

export function YandexOAuthPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");
    if (success !== null) {
      setStatus("success");
      setMessage("Токен успешно получен и сохранён. Загрузка файлов на Яндекс.Диск теперь доступна.");
      return;
    }
    if (error) {
      setStatus("error");
      setMessage(decodeURIComponent(error));
      return;
    }

    let cancelled = false;
    setStatus("loading");
    fetch(`${API_BASE}/yandex_oauth_config.php`)
      .then((res) => res.json())
      .then((data: { authUrl?: string; error?: string }) => {
        if (cancelled) return;
        if (data.authUrl) {
          setAuthUrl(data.authUrl);
          setStatus("idle");
        } else {
          setStatus("no_config");
          setMessage(data.error || "OAuth приложение не настроено (нет client_id на сервере).");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("no_config");
          setMessage("Не удалось получить настройки OAuth. Проверьте, что на сервере есть api/yandex_oauth_config.php.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStartOAuth = () => {
    if (authUrl) window.location.href = authUrl;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'Inter', sans-serif",
        backgroundColor: "#f8fafc",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,63,92,0.08)",
          padding: 32,
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 8,
            color: "#0f172a",
          }}
        >
          Настройка загрузки на Яндекс.Диск
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#64748b",
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          Эта страница предназначена для однократной настройки OAuth: получение токена, с помощью которого файлы с сайта загружаются на ваш Яндекс.Диск.
        </p>

        {status === "loading" && (
          <p style={{ color: "#64748b", fontSize: 14 }}>Загрузка настроек…</p>
        )}

        {status === "success" && (
          <div
            style={{
              padding: 16,
              background: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: 8,
              color: "#166534",
              fontSize: 14,
            }}
          >
            {message}
          </div>
        )}

        {status === "error" && (
          <div
            style={{
              padding: 16,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              color: "#991b1b",
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            {message}
          </div>
        )}

        {status === "no_config" && (
          <div
            style={{
              padding: 16,
              background: "#fef3c7",
              border: "1px solid #fcd34d",
              borderRadius: 8,
              color: "#92400e",
              fontSize: 14,
            }}
          >
            {message}
          </div>
        )}

        {status === "idle" && authUrl && (
          <div>
            <p
              style={{
                fontSize: 14,
                color: "#475569",
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              Нажмите кнопку ниже — откроется страница Яндекса для входа и разрешения доступа к Диску. После подтверждения вы вернётесь сюда, а токен будет сохранён на сервере.
            </p>
            <button
              type="button"
              onClick={handleStartOAuth}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 20px",
                fontSize: 15,
                fontWeight: 600,
                color: "#fff",
                background: "#fc3f1d",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(252,63,29,0.35)",
              }}
            >
              <span>Войти через Яндекс</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M2.04 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10-10-4.48-10-10zm9.5 10V2C6.36 2 2 6.36 2 12s4.36 10 9.5 10z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
