"use client";

import { useEffect, useState } from "react";
import type { SeedKeyword, SeedKeywordInput } from "@/contracts/seed-keyword";
import { SwitchInline } from "./SwitchInline";
import { SecondaryAuthDialog } from "./SecondaryAuthDialog";

interface SeedKeywordEditDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initial?: SeedKeyword;
  onClose: () => void;
  onSaved: (row: SeedKeyword) => void;
}

const EMPTY_FORM: SeedKeywordInput = {
  keyword: "",
  enabled: true,
  anchor: "",
  disabled_reason: "",
};

export function SeedKeywordEditDialog({
  open,
  mode,
  initial,
  onClose,
  onSaved,
}: SeedKeywordEditDialogProps) {
  const [form, setForm] = useState<SeedKeywordInput>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setForm({
        keyword: initial.keyword,
        enabled: initial.enabled,
        anchor: initial.anchor ?? "",
        disabled_reason: initial.disabled_reason ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError("");
  }, [open, mode, initial]);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function update<K extends keyof SeedKeywordInput>(
    key: K,
    value: SeedKeywordInput[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function doSubmit() {
    if (!form.keyword.trim()) {
      setError("关键词不能为空");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let res: Response;
      if (mode === "create") {
        res = await fetch("/api/seed-keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch(`/api/seed-keywords/${initial!.seed_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      if (res.status === 401) {
        const data = (await res.json()) as { code?: string };
        if (
          data.code === "SECONDARY_AUTH_EXPIRED" ||
          data.code === "SECONDARY_AUTH_REQUIRED"
        ) {
          setShowAuth(true);
          return;
        }
        setError("登录已过期，请刷新页面");
        return;
      }

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        setError(data.message ?? "提交失败");
        return;
      }

      const saved = (await res.json()) as SeedKeyword;
      onSaved(saved);
      onClose();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  function handleAuthSuccess() {
    setShowAuth(false);
    doSubmit();
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
        >
          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                {mode === "create" ? "新增种子词" : "编辑种子词"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* seed_id readonly when edit */}
            {mode === "edit" && initial && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">seed_id</label>
                <input
                  readOnly
                  value={initial.seed_id}
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-400 font-mono"
                />
              </div>
            )}

            {/* keyword */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                关键词 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.keyword}
                onChange={(e) => update("keyword", e.target.value)}
                placeholder="输入关键词"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* enabled */}
            <div className="flex items-center gap-3">
              <SwitchInline
                checked={form.enabled}
                onChange={(v) => update("enabled", v)}
                label="启用状态"
              />
              <span className="text-sm text-gray-700">
                {form.enabled ? "启用" : "禁用"}
              </span>
            </div>

            {/* anchor */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">锚点 (anchor)</label>
              <input
                type="text"
                value={form.anchor}
                onChange={(e) => update("anchor", e.target.value)}
                placeholder="选填"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* disabled_reason */}
            {!form.enabled && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  禁用原因
                  <span className="text-gray-400 text-xs ml-1">（建议填写）</span>
                </label>
                <input
                  type="text"
                  value={form.disabled_reason}
                  onChange={(e) => update("disabled_reason", e.target.value)}
                  placeholder="禁用原因"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={doSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "保存中..." : mode === "create" ? "新增" : "保存"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <SecondaryAuthDialog
        open={showAuth}
        onSuccess={handleAuthSuccess}
        onCancel={() => setShowAuth(false)}
      />
    </>
  );
}
