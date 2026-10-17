import { CATEGORY_LABELS, type Category } from "@/lib/requirement.schema";
import type { IconName } from "./icons";

/** Presentation details for each category, shared by the landing page, the form and the success screen. */
export const CATEGORY_META: Record<
  Category,
  { label: string; icon: IconName; summary: string; description: string; examples: string[] }
> = {
  planner: {
    label: CATEGORY_LABELS.planner,
    icon: "calendarCheck",
    summary: "Plan and coordinate your event, end to end or only the parts you need.",
    description: "Someone to plan and coordinate your event end to end, or just the parts you need.",
    examples: ["Venue sourcing", "Vendor management", "Day-of coordination"],
  },
  performer: {
    label: CATEGORY_LABELS.performer,
    icon: "music",
    summary: "Live acts that set the mood, from solo artists to full bands.",
    description: "Singers, bands, DJs, dancers, comedians, anchors and other live acts.",
    examples: ["Singers & bands", "DJs", "Anchors & comedians"],
  },
  crew: {
    label: CATEGORY_LABELS.crew,
    icon: "users",
    summary: "Skilled on-ground people who keep the event running smoothly.",
    description: "Photographers, technicians, stage managers, security and on-ground staff.",
    examples: ["Photographers", "Sound & lighting", "Security & hospitality"],
  },
};
