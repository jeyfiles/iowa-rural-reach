export interface Clinic {
  id:       string;
  name:     string;
  address:  string;
  phone:    string;
  distance: string;
  open:     boolean;
  type:     "family" | "mental" | "dental" | "veteran" | "er" | "uninsured";
  insurance: string[];
  services:  string[];
  telehealth: boolean;
  sliding:    boolean;
  lat:        number;
  lng:        number;
}