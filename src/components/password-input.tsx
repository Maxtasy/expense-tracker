"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = Omit<React.ComponentProps<"input">, "type">;

// A password field with an eye button that reveals / hides what was typed. Takes the same props
// as a plain <input> (including className, which is applied to the input itself).
export function PasswordInput({ className = "", ...props }: Props) {
  const t = useTranslations("common");
  const [visible, setVisible] = useState(false);
  const label = visible ? t("hidePassword") : t("showPassword");

  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${className} pr-10`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-fg-muted hover:text-fg"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
