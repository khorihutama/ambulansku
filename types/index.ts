export type Urgency = "emergency" | "scheduled";

export type FacilityType = "RS" | "Puskesmas" | "PMI" | "Klinik" | "BPBD";

export interface TriageResult {
  urgency: Urgency;
  facilityTypes: FacilityType[];
  specialNeeds: string[];
  responseMessage: string;
  searchKeywords: string[];
}

export interface NearbyFacility {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  opening_hours?: { open_now: boolean };
  formatted_phone_number?: string;
  distance?: number;
}

export interface SupabaseFacility {
  id: string;
  name: string;
  type: FacilityType;
  lat: number;
  lng: number;
  phone: string | null;
  address: string | null;
  operating_hours: string | null;
  services: string[];
  source: string;
  distance_m?: number;
}

export interface FacilityCardProps {
  facility: NearbyFacility;
  rank: number;
}

export interface QuickSituation {
  icon: string;
  label: string;
  value: string;
}

export interface TriageResponse {
  triage: TriageResult;
  facilities: NearbyFacility[];
}

export type Gender = "L" | "P" | "O";

export interface Penilaian {
  id?: string;
  name: string;
  gender: Gender;
  stars: number;
  liked: string;
  disliked: string;
  created_at?: string;
}

export interface PenilaianStats {
  total: number;
  avgStars: number;
  stars: Record<number, number>;
  byGender: Record<string, number>;
}