
const FIELD_PATTERNS = {
  consumption: [
    /(?:total\s+)?(?:energy\s+)?consumption\s*[:-]?\s*([\d,]+(?:\.\d+)?)\s*kwh/i,
    /([\d,]+(?:\.\d+)?)\s*kwh/i,
  ],

  totalCost: [
    /(?:total\s+(?:amount|bill|charges|cost)|amount\s+payable)\s*[:-]?\s*(?:RM|MYR)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:RM|MYR)\s*([\d,]+\.\d{2})/i,
  ],

  peakDemand: [
    /(?:maximum\s+)?(?:peak\s+)?demand\s*[:-]?\s*([\d,]+(?:\.\d+)?)\s*kw/i,
  ],

  meterNumber: [
    /(?:meter\s*(?:no|number|id))\s*[:#-]?\s*([A-Z0-9-]+)/i,
  ],

  billingPeriod: [
    /(?:billing\s+period|bill\s+period|period)\s*[:-]?\s*([^\n]+)/i,
  ],

  tariff: [
    /(?:tariff|rate\s+category)\s*[:-]?\s*([^\n]+)/i,
  ],
};

function extractFirstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function parseNumber(value) {
  if (!value) return null;

  const number = Number(value.replace(/,/g, ""));

  return Number.isFinite(number) ? number : null;
}

export function extractElectricityData(extractedText) {
  if (
    typeof extractedText !== "string" ||
    !extractedText.trim()
  ) {
    throw new Error("No extracted text was provided.");
  }

  const rawData = {
    consumption: extractFirstMatch(
      extractedText,
      FIELD_PATTERNS.consumption
    ),

    totalCost: extractFirstMatch(
      extractedText,
      FIELD_PATTERNS.totalCost
    ),

    peakDemand: extractFirstMatch(
      extractedText,
      FIELD_PATTERNS.peakDemand
    ),

    meterNumber: extractFirstMatch(
      extractedText,
      FIELD_PATTERNS.meterNumber
    ),

    billingPeriod: extractFirstMatch(
      extractedText,
      FIELD_PATTERNS.billingPeriod
    ),

    tariff: extractFirstMatch(
      extractedText,
      FIELD_PATTERNS.tariff
    ),
  };

  const extractedData = {
    consumptionKwh: parseNumber(rawData.consumption),
    totalCost: parseNumber(rawData.totalCost),
    currency: "MYR",
    peakDemandKw: parseNumber(rawData.peakDemand),
    meterNumber: rawData.meterNumber,
    billingPeriod: rawData.billingPeriod,
    tariff: rawData.tariff,
  };

  const missingFields = Object.entries(extractedData)
    .filter(([key, value]) =>
      key !== "currency" && value === null
    )
    .map(([key]) => key);

  return {
    extractedData,
    missingFields,
    isComplete: missingFields.length === 0,
    reviewRequired: missingFields.length > 0,
    extractionMethod: "rule-based-text-extraction",
  };
}