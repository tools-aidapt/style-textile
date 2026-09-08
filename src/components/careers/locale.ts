/**
 * The two lookup lists the application form needs to stop assuming where a
 * candidate is: what their money is called, and what their phone number
 * starts with.
 *
 * Kenya leads both, because that is where the roles are. The rest of the list
 * is ordered East Africa first, then the wider MEA region, then APAC, then the
 * places candidates most often apply from — near enough to alphabetical to
 * scan, near enough to weighted to make the common case a short scroll.
 */

export interface Currency {
  /** ISO 4217 code. Sent to the webhook; also what the field displays. */
  code: string;
  /** Written out in the option row, so "KES" is not a guess. */
  name: string;
}

export interface DialCode {
  /** ISO 3166-1 alpha-2, shown beside the code so +1 and +44 are separable. */
  country: string;
  name: string;
  /** ITU country calling code, with its plus. */
  dial: string;
}

/** Kenyan Shilling is the default; see DEFAULT_CURRENCY below. */
export const CURRENCIES: Currency[] = [
  { code: "KES", name: "Kenyan Shilling" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "RWF", name: "Rwandan Franc" },
  { code: "ETB", name: "Ethiopian Birr" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "Pound Sterling" },
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "QAR", name: "Qatari Riyal" },
  { code: "KWD", name: "Kuwaiti Dinar" },
  { code: "BHD", name: "Bahraini Dinar" },
  { code: "OMR", name: "Omani Rial" },
  { code: "JOD", name: "Jordanian Dinar" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "ZAR", name: "South African Rand" },
  { code: "ZMW", name: "Zambian Kwacha" },
  { code: "MWK", name: "Malawian Kwacha" },
  { code: "MZN", name: "Mozambican Metical" },
  { code: "BWP", name: "Botswana Pula" },
  { code: "MUR", name: "Mauritian Rupee" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "INR", name: "Indian Rupee" },
  { code: "BDT", name: "Bangladeshi Taka" },
  { code: "LKR", name: "Sri Lankan Rupee" },
  { code: "NPR", name: "Nepalese Rupee" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "THB", name: "Thai Baht" },
  { code: "VND", name: "Vietnamese Dong" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
];

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

/** The roles are Kenyan, so the form should not make a Kenyan candidate choose. */
export const DEFAULT_CURRENCY = "KES";

/**
 * Stored as the alpha-2 country, not the dial code, because +1 is two
 * countries and the pair would stop round-tripping through the select.
 */
export const DEFAULT_COUNTRY = "KE";

export const dialFor = (country: string): string =>
  DIAL_CODES.find((c) => c.country === country)?.dial ?? "";
