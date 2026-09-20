import { CSSProperties } from "react";
import { COLORS as C, FONTS as F } from "../lib/constants";

// 16px font-size on every field is intentional: iOS Safari auto-zooms the
// whole page on focus when an input's font-size is below 16px, which would
// be a real mobile-navigability problem on this app's 375px layouts.
export const inputStyle: CSSProperties = {
  width: "100%",
  fontFamily: F.body,
  fontSize: 16,
  padding: "10px 12px",
  borderRadius: 4,
  border: "1.5px solid " + C.border,
  color: C.t2,
  boxSizing: "border-box",
  background: C.iWhite,
};

export const labelStyle: CSSProperties = {
  display: "block",
  fontFamily: F.body,
  fontSize: 13,
  fontWeight: 600,
  color: C.iBlue,
  marginBottom: 6,
};

export const primaryButtonStyle: CSSProperties = {
  width: "100%",
  background: C.iBlue,
  color: C.iWhite,
  border: "none",
  borderRadius: 4,
  padding: "14px 16px",
  fontFamily: F.body,
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
  minHeight: 48,
};

export const errorTextStyle: CSSProperties = {
  color: "#B3261E",
  fontFamily: F.body,
  fontSize: 14,
  marginBottom: 12,
};
