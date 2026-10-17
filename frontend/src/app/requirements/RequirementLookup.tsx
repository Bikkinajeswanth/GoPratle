"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { describedBy, Field, inputBorder, inputClass } from "@/components/ui/Field";

const OBJECT_ID = /^[a-f\d]{24}$/i;

export function RequirementLookup() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [error, setError] = useState<string>();
  const [navigating, setNavigating] = useState(false);

  return (
    <form
      noValidate
      className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        const value = id.trim();
        if (!value) return setError("Enter a requirement ID");
        if (!OBJECT_ID.test(value)) return setError("A requirement ID is 24 characters (0–9 and a–f)");
        setError(undefined);
        setNavigating(true);
        router.push(`/requirements/${value.toLowerCase()}`);
      }}
    >
      <Field id="lookup-id" label="Requirement ID" error={error}>
        <input
          {...describedBy("lookup-id", error)}
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            if (error) setError(undefined);
          }}
          autoComplete="off"
          spellCheck={false}
          placeholder="e.g. 6650f0c2a1b2c3d4e5f60718"
          className={`${inputClass} ${inputBorder(!!error)} font-mono`}
        />
      </Field>
      <Button type="submit" className="mt-5 w-full sm:w-auto" loading={navigating}>
        <Icon name="search" className="size-4" strokeWidth={2.2} />
        Find requirement
      </Button>
    </form>
  );
}
