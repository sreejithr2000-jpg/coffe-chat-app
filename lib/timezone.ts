export interface TimezoneOption {
  value: string;
  label: string;
  region: "North America" | "Europe" | "Asia-Pacific" | "Other";
}

export const TIMEZONES: TimezoneOption[] = [
  // North America
  { value: "America/New_York",                   label: "Eastern Time (ET)",          region: "North America" },
  { value: "America/Chicago",                    label: "Central Time (CT)",          region: "North America" },
  { value: "America/Denver",                     label: "Mountain Time (MT)",         region: "North America" },
  { value: "America/Phoenix",                    label: "Mountain Time – Arizona",    region: "North America" },
  { value: "America/Los_Angeles",                label: "Pacific Time (PT)",          region: "North America" },
  { value: "America/Anchorage",                  label: "Alaska Time",                region: "North America" },
  { value: "Pacific/Honolulu",                   label: "Hawaii Time",                region: "North America" },
  { value: "America/Toronto",                    label: "Toronto",                    region: "North America" },
  { value: "America/Vancouver",                  label: "Vancouver",                  region: "North America" },
  { value: "America/Mexico_City",                label: "Mexico City",                region: "North America" },
  // Europe
  { value: "Europe/London",                      label: "London (GMT/BST)",           region: "Europe" },
  { value: "Europe/Dublin",                      label: "Dublin",                     region: "Europe" },
  { value: "Europe/Lisbon",                      label: "Lisbon",                     region: "Europe" },
  { value: "Europe/Paris",                       label: "Paris",                      region: "Europe" },
  { value: "Europe/Berlin",                      label: "Berlin",                     region: "Europe" },
  { value: "Europe/Amsterdam",                   label: "Amsterdam",                  region: "Europe" },
  { value: "Europe/Madrid",                      label: "Madrid",                     region: "Europe" },
  { value: "Europe/Rome",                        label: "Rome",                       region: "Europe" },
  { value: "Europe/Stockholm",                   label: "Stockholm",                  region: "Europe" },
  { value: "Europe/Warsaw",                      label: "Warsaw",                     region: "Europe" },
  { value: "Europe/Helsinki",                    label: "Helsinki",                   region: "Europe" },
  { value: "Europe/Athens",                      label: "Athens",                     region: "Europe" },
  { value: "Europe/Istanbul",                    label: "Istanbul",                   region: "Europe" },
  { value: "Europe/Moscow",                      label: "Moscow",                     region: "Europe" },
  // Asia-Pacific
  { value: "Asia/Dubai",                         label: "Dubai (GST)",                region: "Asia-Pacific" },
  { value: "Asia/Karachi",                       label: "Karachi (PKT)",              region: "Asia-Pacific" },
  { value: "Asia/Kolkata",                       label: "India (IST)",                region: "Asia-Pacific" },
  { value: "Asia/Dhaka",                         label: "Dhaka",                      region: "Asia-Pacific" },
  { value: "Asia/Bangkok",                       label: "Bangkok (ICT)",              region: "Asia-Pacific" },
  { value: "Asia/Singapore",                     label: "Singapore (SGT)",            region: "Asia-Pacific" },
  { value: "Asia/Shanghai",                      label: "China (CST)",                region: "Asia-Pacific" },
  { value: "Asia/Hong_Kong",                     label: "Hong Kong (HKT)",            region: "Asia-Pacific" },
  { value: "Asia/Seoul",                         label: "Seoul (KST)",                region: "Asia-Pacific" },
  { value: "Asia/Tokyo",                         label: "Tokyo (JST)",                region: "Asia-Pacific" },
  { value: "Australia/Perth",                    label: "Perth (AWST)",               region: "Asia-Pacific" },
  { value: "Australia/Sydney",                   label: "Sydney (AEST)",              region: "Asia-Pacific" },
  { value: "Pacific/Auckland",                   label: "Auckland (NZST)",            region: "Asia-Pacific" },
  // Other
  { value: "UTC",                                label: "UTC",                        region: "Other" },
  { value: "America/Sao_Paulo",                  label: "São Paulo (BRT)",            region: "Other" },
  { value: "America/Argentina/Buenos_Aires",     label: "Buenos Aires (ART)",         region: "Other" },
  { value: "America/Bogota",                     label: "Bogotá (COT)",               region: "Other" },
  { value: "Africa/Lagos",                       label: "Lagos (WAT)",                region: "Other" },
  { value: "Africa/Cairo",                       label: "Cairo (EET)",                region: "Other" },
  { value: "Africa/Johannesburg",                label: "Johannesburg (SAST)",        region: "Other" },
  { value: "Africa/Nairobi",                     label: "Nairobi (EAT)",              region: "Other" },
];

export const REGION_TIMEZONES: Record<string, string[]> = {
  "North America": TIMEZONES.filter((t) => t.region === "North America").map((t) => t.value),
  Europe:          TIMEZONES.filter((t) => t.region === "Europe").map((t) => t.value),
  "Asia-Pacific":  TIMEZONES.filter((t) => t.region === "Asia-Pacific").map((t) => t.value),
};

export function getUTCOffsetHours(iana: string): number {
  try {
    const now    = new Date();
    const utcMs  = new Date(now.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
    const tzMs   = new Date(now.toLocaleString("en-US", { timeZone: iana })).getTime();
    return (tzMs - utcMs) / 3600000;
  } catch {
    return 0;
  }
}

export function formatTimezoneDisplay(iana: string): string {
  if (!iana || iana === "UTC") return "UTC (UTC+0)";
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: iana,
      timeZoneName: "short",
    }).formatToParts(now);
    const abbr = parts.find((p) => p.type === "timeZoneName")?.value ?? "";

    const offsetH = getUTCOffsetHours(iana);
    const sign    = offsetH >= 0 ? "+" : "-";
    const absH    = Math.abs(offsetH);
    const h       = Math.floor(absH);
    const m       = Math.round((absH - h) * 60);
    const offsetStr = m > 0
      ? `UTC${sign}${h}:${String(m).padStart(2, "0")}`
      : `UTC${sign}${h}`;

    return abbr ? `${abbr} (${offsetStr})` : offsetStr;
  } catch {
    return iana;
  }
}

export function getLocalTime(iana: string): string {
  if (!iana) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: iana,
      hour:     "numeric",
      minute:   "2-digit",
      hour12:   true,
    }).format(new Date());
  } catch {
    return "";
  }
}

export interface CountryOption {
  value: string;
  label: string;
}

export const COUNTRIES: CountryOption[] = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
  { value: "IN", label: "India" },
  { value: "PK", label: "Pakistan" },
  { value: "BD", label: "Bangladesh" },
  { value: "SG", label: "Singapore" },
  { value: "MY", label: "Malaysia" },
  { value: "PH", label: "Philippines" },
  { value: "HK", label: "Hong Kong" },
  { value: "CN", label: "China" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "TH", label: "Thailand" },
  { value: "VN", label: "Vietnam" },
  { value: "ID", label: "Indonesia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "NL", label: "Netherlands" },
  { value: "CH", label: "Switzerland" },
  { value: "SE", label: "Sweden" },
  { value: "NO", label: "Norway" },
  { value: "DK", label: "Denmark" },
  { value: "FI", label: "Finland" },
  { value: "PL", label: "Poland" },
  { value: "ES", label: "Spain" },
  { value: "IT", label: "Italy" },
  { value: "PT", label: "Portugal" },
  { value: "IE", label: "Ireland" },
  { value: "BE", label: "Belgium" },
  { value: "AT", label: "Austria" },
  { value: "GR", label: "Greece" },
  { value: "TR", label: "Turkey" },
  { value: "RU", label: "Russia" },
  { value: "UA", label: "Ukraine" },
  { value: "IL", label: "Israel" },
  { value: "AE", label: "UAE" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "ZA", label: "South Africa" },
  { value: "NG", label: "Nigeria" },
  { value: "KE", label: "Kenya" },
  { value: "EG", label: "Egypt" },
  { value: "MX", label: "Mexico" },
  { value: "BR", label: "Brazil" },
  { value: "AR", label: "Argentina" },
  { value: "CO", label: "Colombia" },
  { value: "CL", label: "Chile" },
];

export function getCountryLabel(code: string | null | undefined): string {
  if (!code) return "";
  return COUNTRIES.find((c) => c.value === code)?.label ?? code;
}

export function formatLocation(city?: string | null, country?: string | null): string | null {
  const parts = [city?.trim(), getCountryLabel(country)].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}
