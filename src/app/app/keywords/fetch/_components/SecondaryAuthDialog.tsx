"use client";

import { useEffect, useRef, useState } from "react";

interface SecondaryAuthDialogProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 60;

export function SecondaryAuthDialog({
  open,
  onSuccess,
  onCancel,
}: SecondaryAuthDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  // countdown timer
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setCountdown(0);
        setAttempts(0);
        setError("");
      } else {
        setCountdown(remaining);
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [lockedUntil]);

  // open/close dialog element
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
      setPassword("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      if (el.open) el.close();
    }
  }, [open]);

  const isLocked = !!lockedUntil && Date.now() < lockedUntil;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked || loading) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/n8n/secondary-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok?: boolean; code?: string; message?: string };
      if (res.ok && data.ok) {
        setPassword("");
        setAttempts(0);
        setLockedUntil(null);
        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCK_SECONDS * 1000);
          setError(`连续错误 ${MAX_ATTEMPTS} 次，锁定 ${LOCK_SECONDS} 秒`);
        } else {
          const code = data.code ?? "INVALID_PASSWORD";
          if (code === "INVALID_PASSWORD") {
            setError(`密码错误（剩余 ${MAX_ATTEMPTS - newAttempts} 次机会）`);
          } else if (code === "TOO_MANY_ATTEMPTS") {
            setError("尝试次数过多，请稍后再试");
          } else {
            setError(data.message ?? "验证失败");
          }
        }
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={onCancel}
      className="rounded-xl shadow-2xl w-full max-w-sm p-0 bg-white backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">二次验证</h2>
          <p className="text-sm text-gray-500 mt-1">写操作需要输入操作密码</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sec-pwd" className="text-sm font-medium text-gray-700">
            操作密码
          </label>
          <input
            id="sec-pwd"
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLocked || loading}
            placeholder="请输入 8 位密码"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
            {isLocked ? `账号已锁定，请等待 ${countdown} 秒` : error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isLocked || loading || !password}
            className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "验证中..." : "确认"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
