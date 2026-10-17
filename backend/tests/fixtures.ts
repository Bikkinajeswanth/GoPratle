/** Returns a YYYY-MM-DD date `days` from today (UTC). */
export function futureDate(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const eventBasics = () => ({
  eventName: "Aarav & Meera Wedding Reception",
  eventType: "wedding",
  dateMode: "range",
  startDate: futureDate(30),
  endDate: futureDate(31),
  location: "Hyderabad, Telangana",
  venueName: "Taj Krishna",
});

export const plannerPayload = () => ({
  eventBasics: eventBasics(),
  category: "planner",
  categoryDetails: {
    requirements: {
      servicesRequired: ["venue_sourcing", "decor_design", "catering_coordination"],
      expectedGuestCount: 350,
      planningScope: "full_planning",
    },
    additional: {
      budget: { min: 500000, max: 900000 },
      planningTimeline: "1_to_3_months",
      additionalServices: ["photography", "invitations"],
      preferences: "Pastel floral theme, vegetarian menu",
    },
  },
});

export const performerPayload = () => ({
  eventBasics: { ...eventBasics(), eventType: "corporate", dateMode: "single", endDate: undefined },
  category: "performer",
  categoryDetails: {
    requirements: {
      performerType: "band",
      genreOrStyle: "Bollywood retro",
      format: "group",
      groupSize: 5,
      durationMinutes: 120,
    },
    additional: {
      budget: { min: 80000, max: 150000 },
      equipmentNeeds: ["sound_system", "stage_lighting"],
      equipmentNotes: "Venue provides a 2kW PA",
      performancePreferences: "Two sets with a 15 minute break",
      specialInstructions: "Arrive 2 hours early for sound check",
    },
  },
});

export const crewPayload = () => ({
  eventBasics: { ...eventBasics(), eventType: "conference", venueName: undefined },
  category: "crew",
  categoryDetails: {
    requirements: {
      crewRoles: ["photographer", "sound_technician"],
      numberOfPeople: 4,
      experienceLevel: "experienced",
      skills: ["DSLR photography", "Live mixing"],
    },
    additional: {
      payRange: { min: 2000, max: 4000 },
      payBasis: "per_day",
      shiftHours: 9.5,
      workingHours: "8:30 AM – 6:00 PM",
      equipmentRequirements: "Own camera bodies and lenses",
      additionalInstructions: "Formal black dress code",
    },
  },
});

export const payloads = { planner: plannerPayload, performer: performerPayload, crew: crewPayload };
