export interface Clinic {
  id:       string;
  name:     string;
  address:  string;
  phone:    string;
  distance: string;
  open:     boolean | null;   // null = no hours data → no Open badge
  type:     "family" | "mental" | "dental" | "veteran" | "er" | "uninsured" | "chiro";
  insurance: string[];
  services:  string[];
  telehealth: boolean;
  sliding:    boolean;
  lat:        number;
  lng:        number;
}