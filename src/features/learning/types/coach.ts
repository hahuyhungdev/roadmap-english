export interface Review {
  original_transcript: string;
  corrected_version: string;
  explanation: string;
  better_alternatives: string[];
}

export interface Turn {
  id: string;
  role: "user" | "coach";
  text: string;
  review?: Review;
}
