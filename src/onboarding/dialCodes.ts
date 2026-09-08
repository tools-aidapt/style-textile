/**
 * Country calling codes, for the mobile field.
 *
 * Stored as the alpha-2 country rather than the dial code, because +1 is two
 * countries and the pair would stop round-tripping through the select.
 *
 * Ordered East Africa first, then the wider MEA region, then APAC, then the
 * places people most often hold a second number — near enough to alphabetical
 * to scan, near enough to weighted that the common case is the first row.
 *
 * TODO(kenafric): `src/components/careers/locale.ts` carries the same list for
 * the candidate application form. It was mid-edit when this was written, so
 * this is a deliberate copy rather than an import — one shared lookup, in
 * neither feature's folder, is the right end state once that file settles.
 * The two are identical today; keep them that way or merge them.
 */

export interface DialCode {
  /** ISO 3166-1 alpha-2. What the form stores. */
  country: string;
  name: string;
  /** ITU country calling code, with its plus. */
  dial: string;
}

export const DIAL_CODES: DialCode[] = [
  { country: "KE", name: "Kenya", dial: "+254" },
  { country: "UG", name: "Uganda", dial: "+256" },
  { country: "TZ", name: "Tanzania", dial: "+255" },
  { country: "RW", name: "Rwanda", dial: "+250" },
  { country: "BI", name: "Burundi", dial: "+257" },
  { country: "ET", name: "Ethiopia", dial: "+251" },
  { country: "SO", name: "Somalia", dial: "+252" },
  { country: "SS", name: "South Sudan", dial: "+211" },
  { country: "SD", name: "Sudan", dial: "+249" },
  { country: "CD", name: "DR Congo", dial: "+243" },
  { country: "NG", name: "Nigeria", dial: "+234" },
  { country: "GH", name: "Ghana", dial: "+233" },
  { country: "ZA", name: "South Africa", dial: "+27" },
  { country: "ZM", name: "Zambia", dial: "+260" },
  { country: "ZW", name: "Zimbabwe", dial: "+263" },
  { country: "MW", name: "Malawi", dial: "+265" },
  { country: "MZ", name: "Mozambique", dial: "+258" },
  { country: "BW", name: "Botswana", dial: "+267" },
  { country: "NA", name: "Namibia", dial: "+264" },
  { country: "MU", name: "Mauritius", dial: "+230" },
  { country: "EG", name: "Egypt", dial: "+20" },
  { country: "MA", name: "Morocco", dial: "+212" },
  { country: "AE", name: "United Arab Emirates", dial: "+971" },
  { country: "SA", name: "Saudi Arabia", dial: "+966" },
  { country: "QA", name: "Qatar", dial: "+974" },
  { country: "KW", name: "Kuwait", dial: "+965" },
  { country: "BH", name: "Bahrain", dial: "+973" },
  { country: "OM", name: "Oman", dial: "+968" },
  { country: "JO", name: "Jordan", dial: "+962" },
  { country: "LB", name: "Lebanon", dial: "+961" },
  { country: "TR", name: "Turkey", dial: "+90" },
  { country: "PK", name: "Pakistan", dial: "+92" },
  { country: "IN", name: "India", dial: "+91" },
  { country: "BD", name: "Bangladesh", dial: "+880" },
  { country: "LK", name: "Sri Lanka", dial: "+94" },
  { country: "NP", name: "Nepal", dial: "+977" },
  { country: "CN", name: "China", dial: "+86" },
  { country: "JP", name: "Japan", dial: "+81" },
  { country: "KR", name: "South Korea", dial: "+82" },
  { country: "SG", name: "Singapore", dial: "+65" },
  { country: "MY", name: "Malaysia", dial: "+60" },
  { country: "ID", name: "Indonesia", dial: "+62" },
  { country: "PH", name: "Philippines", dial: "+63" },
  { country: "TH", name: "Thailand", dial: "+66" },
  { country: "VN", name: "Vietnam", dial: "+84" },
  { country: "AU", name: "Australia", dial: "+61" },
  { country: "NZ", name: "New Zealand", dial: "+64" },
  { country: "GB", name: "United Kingdom", dial: "+44" },
  { country: "IE", name: "Ireland", dial: "+353" },
  { country: "DE", name: "Germany", dial: "+49" },
  { country: "FR", name: "France", dial: "+33" },
  { country: "NL", name: "Netherlands", dial: "+31" },
  { country: "ES", name: "Spain", dial: "+34" },
  { country: "IT", name: "Italy", dial: "+39" },
  { country: "PT", name: "Portugal", dial: "+351" },
  { country: "US", name: "United States", dial: "+1" },
];

/** Empty for a country the list has never heard of, which validation rejects. */
export const dialFor = (country: string): string =>
  DIAL_CODES.find((candidate) => candidate.country === country)?.dial ?? "";

export const countryFor = (dial: string): string =>
  DIAL_CODES.find((candidate) => candidate.dial === dial)?.country ?? "";
