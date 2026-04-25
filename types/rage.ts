export type RageType = "honk" | "swear" | "scream" | "smack";
export type RageLevel = 1 | 2 | 3 | 4 | 5;

export interface RageIncident {
  id: string;
  latitude: number;
  longitude: number;
  type: RageType;
  rageLevel: RageLevel;
  timestamp: Date;
  username: string;
  decibels?: number;
}

export const RAGE_COLORS: Record<RageLevel, string> = {
  1: "#4CAF50",
  2: "#CDDC39",
  3: "#FFC107",
  4: "#FF5722",
  5: "#F44336",
};

export const RAGE_LABELS: Record<RageLevel, string> = {
  1: "Mildly Annoyed",
  2: "Frustrated",
  3: "Angry",
  4: "Furious",
  5: "Really Furious",
};
