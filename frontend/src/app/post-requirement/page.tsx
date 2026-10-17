import type { Metadata } from "next";
import { WizardLoader } from "@/components/wizard/WizardLoader";

export const metadata: Metadata = {
  title: "Post an event requirement",
  description: "Describe your event and what you need from an event planner, performer or crew in four guided steps.",
};

export default function PostRequirementPage() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-brand-100/70 via-brand-50/40 to-transparent"
      />
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Post an event requirement</h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-slate-600 sm:text-base">
            Four short steps. Your answers are saved on this device as you go.
          </p>
        </div>
        <WizardLoader />
      </div>
    </div>
  );
}
