"use client";

import { useEffect, useState } from "react";
import type { SeedKeyword, SeedKeywordInput } from "@/contracts/seed-keyword";
import { SwitchInline } from "./SwitchInline";
import { SecondaryAuthDialog } from "./SecondaryAuthDialog";
import { BaroqueCorners } from "@/components/ManorOrnaments";

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
  layer_main: "",
};

// 对齐《种子词库结构方案 v1》第 15 行 layer_main enum 9 类
const LAYER_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "", label: "（未分类）" },
  { value: "品牌词", label: "品牌词" },
  { value: "品类词", label: "品类词" },
  { value: "属性词", label: "属性词" },
  { value: "场景词", label: "场景词" },
  { value: "受众词", label: "受众词" },
  { value: "知识词", label: "知识词" },
  { value: "对比词", label: "对比词" },
  { value: "竞品词", label: "竞品词" },
  { value: "工具词", label: "工具词" },
];

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
        layer_main: initial.layer_main ?? "",
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

  const sc = "var(--font-sc), 'Cormorant SC', serif";
  const serif = "var(--font-serif), 'EB Garamond', serif";
  const inputCls =
    "block w-full bg-manor-void/60 border border-manor-brass/30 px-3 py-2 text-sm text-manor-ink placeholder:text-manor-inkFaint focus:outline-none focus:border-manor-brass focus:ring-1 focus:ring-manor-brass/30";
  const labelCls = "font-sc tracking-[0.22em] text-manor-brass leading-none";

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center drawer-mask p-4"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg glass-panel-brass"
          style={{ borderRadius: 6 }}
        >
          <BaroqueCorners size={20} />
          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <div
                  className="font-sc tracking-[0.32em] text-manor-brassHi/80 mb-1.5"
                  style={{ fontFamily: sc, fontSize: 10 }}
                >
                  ◆ {mode === "create" ? "ADSCRIBO · 录入" : "EMENDARE · 修订"}
                </div>
                <h2
                  className="text-brass-gradient font-serif font-semibold leading-tight"
                  style={{ fontFamily: serif, fontSize: 20, letterSpacing: "0.02em" }}
                >
                  {mode === "create" ? "新增种子词" : "编辑种子词"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-manor-brassDim hover:text-manor-brassHi transition-colors text-xl leading-none mt-1"
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <span className="brass-divider opacity-60 -mt-1" />

            {mode === "edit" && initial && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls} style={{ fontFamily: sc, fontSize: 10 }}>
                  SEED · 卷号
                </label>
                <input
                  readOnly
                  value={initial.seed_id}
                  className="block w-full bg-manor-void/40 border border-manor-line px-3 py-2 text-xs text-manor-inkFaint tabnum"
                  style={{ borderRadius: 3, fontFamily: sc }}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={{ fontFamily: sc, fontSize: 10 }}>
                VERBUM · 关键词 <span className="text-manor-oxbloodHi">*</span>
              </label>
              <input
                type="text"
                value={form.keyword}
                onChange={(e) => update("keyword", e.target.value)}
                placeholder="录入关键词"
                className={inputCls}
                style={{ borderRadius: 3, fontFamily: serif }}
              />
            </div>

            <div className="flex items-center gap-3">
              <SwitchInline
                checked={form.enabled}
                onChange={(v) => update("enabled", v)}
                label="启用状态"
              />
              <span className="text-sm text-manor-ink" style={{ fontFamily: serif }}>
                {form.enabled ? "启用" : "封存"}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={{ fontFamily: sc, fontSize: 10 }}>
                STRATUM · 主层级
              </label>
              <select
                value={form.layer_main}
                onChange={(e) => update("layer_main", e.target.value)}
                className={inputCls}
                style={{ borderRadius: 3, fontFamily: serif }}
              >
                {LAYER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={{ fontFamily: sc, fontSize: 10 }}>
                ANCORA · 锚点
              </label>
              <input
                type="text"
                value={form.anchor}
                onChange={(e) => update("anchor", e.target.value)}
                placeholder="选填"
                className={inputCls}
                style={{ borderRadius: 3, fontFamily: serif }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={{ fontFamily: sc, fontSize: 10 }}>
                NOTA · 备注 / 封存缘由
                {!form.enabled && (
                  <span
                    className="ml-2 text-manor-inkFaint normal-case tracking-normal"
                    style={{ fontFamily: serif, fontSize: 10 }}
                  >
                    （封存时建议填写）
                  </span>
                )}
              </label>
              <input
                type="text"
                value={form.disabled_reason}
                onChange={(e) => update("disabled_reason", e.target.value)}
                placeholder={form.enabled ? "可填写备注（选填）" : "封存缘由"}
                className={inputCls}
                style={{ borderRadius: 3, fontFamily: serif }}
              />
            </div>

            {error && (
              <p
                className="text-xs text-manor-oxbloodHi border border-manor-oxblood/30 bg-manor-oxblood/10 px-3 py-2 flex items-center gap-2"
                style={{ borderRadius: 3 }}
              >
                <span className="diamond bg-manor-oxblood shrink-0" />
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-sc tracking-[0.22em] text-manor-inkDim border border-manor-line2 hover:text-manor-ink hover:border-manor-brass/40 transition-colors"
                style={{ borderRadius: 3, fontFamily: sc }}
              >
                ABROGARE · 取消
              </button>
              <button
                type="button"
                onClick={doSubmit}
                disabled={loading}
                className="px-5 py-1.5 text-xs font-sc tracking-[0.22em] text-manor-bg bg-gradient-to-b from-manor-brassHi to-manor-brassDim hover:from-manor-brass hover:to-manor-brass disabled:opacity-40 disabled:cursor-not-allowed shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_8px_rgba(201,169,97,0.35)] transition-colors"
                style={{ borderRadius: 3, fontFamily: sc }}
              >
                {loading ? "存档中..." : mode === "create" ? "INSCRIBO · 新增" : "SERVARE · 保存"}
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
