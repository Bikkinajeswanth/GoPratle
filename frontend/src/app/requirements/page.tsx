import type { Metadata } from "next";
import { RequirementLookup } from "./RequirementLookup";

export const metadata: Metadata = {
  title: "Find a requirement",
  description: "Look up a posted event requirement using its requirement ID.",
};

export default function FindRequirementPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-bold tracking-tight text-ink">Find a requirement</h1>
      <p className="mt-3 text-[15px] text-slate-600">
        Enter the requirement ID shown after you submitted. It&apos;s a 24-character code like{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-slate-700">6650f0c2a1b2c3d4e5f60718</code>.
      </p>
      <RequirementLookup />
    </div>
  );
}
