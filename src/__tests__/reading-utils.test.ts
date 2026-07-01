import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatReading,
  parseReadingDateTime,
  getRelativeTime,
  calculateRateOfChange,
  getReadingRange,
} from "../shared/reading-utils";
import { DEFAULT_READING, Reading } from "../shared/types";

function makeReading(overrides: Partial<Reading> = {}): Reading {
  return {
    ...DEFAULT_READING,
    id: "25/06/27, 10:30:00 am",
    value: 120,
    mmol_l: 6.7,
    trend: 4,
    trend_direction: "Flat",
    trend_description: "steady",
    trend_arrow: "→",
    date_time: ["25/06/27", "10:30 am"],
    trend_reliable: true,
    ...overrides,
  };
}

describe("formatReading", () => {
  it("formats a normal reading", () => {
    const result = formatReading(makeReading());
    expect(result).toEqual({ trend: "Flat", mg_dl: "120", mmol_l: "6.7" });
  });

  it("returns dashes for unavailable values (-1)", () => {
    const result = formatReading(makeReading({ value: -1, mmol_l: -1 }));
    expect(result.mg_dl).toBe("--");
    expect(result.mmol_l).toBe("--");
  });

  it("maps None trend to Unavailable", () => {
    const result = formatReading(makeReading({ trend_direction: "None" }));
    expect(result.trend).toBe("Unavailable");
  });

  it("maps NotComputable trend to Unavailable", () => {
    const result = formatReading(
      makeReading({ trend_direction: "NotComputable" })
    );
    expect(result.trend).toBe("Unavailable");
  });

  it("maps RateOutOfRange trend to Unavailable", () => {
    const result = formatReading(
      makeReading({ trend_direction: "RateOutOfRange" })
    );
    expect(result.trend).toBe("Unavailable");
  });

  it("passes through normal trend directions", () => {
    const result = formatReading(
      makeReading({ trend_direction: "DoubleUp" })
    );
    expect(result.trend).toBe("DoubleUp");
  });
});

describe("parseReadingDateTime", () => {
  it("parses a valid AM date/time", () => {
    const result = parseReadingDateTime(["25/06/15", "9:30 am"]);
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2025);
    expect(result!.getMonth()).toBe(5); // June = 5
    expect(result!.getDate()).toBe(15);
    expect(result!.getHours()).toBe(9);
    expect(result!.getMinutes()).toBe(30);
  });

  it("parses a valid PM date/time", () => {
    const result = parseReadingDateTime(["25/06/15", "2:45 pm"]);
    expect(result!.getHours()).toBe(14);
    expect(result!.getMinutes()).toBe(45);
  });

  it("handles 12:00 am (midnight)", () => {
    const result = parseReadingDateTime(["25/01/01", "12:00 am"]);
    expect(result!.getHours()).toBe(0);
  });

  it("handles 12:00 pm (noon)", () => {
    const result = parseReadingDateTime(["25/01/01", "12:00 pm"]);
    expect(result!.getHours()).toBe(12);
  });

  it("returns null for Unavailable date", () => {
    expect(parseReadingDateTime(["Unavailable", "10:00 am"])).toBeNull();
  });

  it("returns null for Unavailable time", () => {
    expect(parseReadingDateTime(["25/06/15", "Unavailable"])).toBeNull();
  });

  it("returns null for malformed time string", () => {
    expect(parseReadingDateTime(["25/06/15", "not-a-time"])).toBeNull();
  });
});

describe("getRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 27, 10, 35, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for < 30s ago', () => {
    expect(getRelativeTime(["25/06/27", "10:35 am"])).toBe("just now");
  });

  it("returns minutes for recent readings", () => {
    expect(getRelativeTime(["25/06/27", "10:30 am"])).toBe("5m ago");
  });

  it("returns hours for older readings", () => {
    expect(getRelativeTime(["25/06/27", "7:35 am"])).toBe("3h ago");
  });

  it("returns empty string for Unavailable", () => {
    expect(getRelativeTime(["Unavailable", "Unavailable"])).toBe("");
  });
});

describe("calculateRateOfChange", () => {
  it("returns null with fewer than 2 readings", () => {
    expect(calculateRateOfChange([makeReading()], "mg/dl")).toBeNull();
    expect(calculateRateOfChange([], "mg/dl")).toBeNull();
  });

  it("returns null when either reading is unavailable (-1)", () => {
    const readings = [makeReading({ value: -1 }), makeReading()];
    expect(calculateRateOfChange(readings, "mg/dl")).toBeNull();
  });

  it("calculates rate of change in mg/dl", () => {
    const newest = makeReading({
      value: 130,
      mmol_l: 7.2,
      date_time: ["25/06/27", "10:35 am"],
    });
    const previous = makeReading({
      value: 120,
      mmol_l: 6.7,
      date_time: ["25/06/27", "10:30 am"],
    });
    const result = calculateRateOfChange([newest, previous], "mg/dl");
    expect(result).not.toBeNull();
    expect(result!.value).toBe(2); // 10 mg/dl / 5 min
    expect(result!.formatted).toBe("+2.0");
    expect(result!.severity).toBe("moderate");
  });

  it("calculates rate of change in mmol/l", () => {
    const newest = makeReading({
      value: 130,
      mmol_l: 7.2,
      date_time: ["25/06/27", "10:35 am"],
    });
    const previous = makeReading({
      value: 120,
      mmol_l: 6.7,
      date_time: ["25/06/27", "10:30 am"],
    });
    const result = calculateRateOfChange([newest, previous], "mmol/l");
    expect(result).not.toBeNull();
    expect(result!.value).toBeCloseTo(0.1, 1);
  });

  it("returns null when readings are too far apart (>15 min)", () => {
    const newest = makeReading({
      value: 130,
      date_time: ["25/06/27", "11:00 am"],
    });
    const previous = makeReading({
      value: 120,
      date_time: ["25/06/27", "10:30 am"],
    });
    const result = calculateRateOfChange([newest, previous], "mg/dl");
    expect(result).toBeNull();
  });

  it("classifies stable rate correctly", () => {
    const newest = makeReading({
      value: 121,
      date_time: ["25/06/27", "10:35 am"],
    });
    const previous = makeReading({
      value: 120,
      date_time: ["25/06/27", "10:30 am"],
    });
    const result = calculateRateOfChange([newest, previous], "mg/dl");
    expect(result!.severity).toBe("stable");
  });
});

describe("getReadingRange", () => {
  const thresholds = { high: 200, low: 70, highMMOLL: 11.0, lowMMOLL: 4.0 };

  it("returns normal for in-range mg/dl", () => {
    expect(getReadingRange("120", "6.7", "mg/dl", thresholds)).toBe("normal");
  });

  it("returns high for high mg/dl", () => {
    expect(getReadingRange("200", "11.1", "mg/dl", thresholds)).toBe("high");
    expect(getReadingRange("250", "13.9", "mg/dl", thresholds)).toBe("high");
  });

  it("returns low for low mg/dl", () => {
    expect(getReadingRange("70", "3.9", "mg/dl", thresholds)).toBe("low");
    expect(getReadingRange("50", "2.8", "mg/dl", thresholds)).toBe("low");
  });

  it("uses mmol/l thresholds when unit is mmol/l", () => {
    expect(getReadingRange("120", "6.7", "mmol/l", thresholds)).toBe("normal");
    expect(getReadingRange("250", "11.0", "mmol/l", thresholds)).toBe("high");
    expect(getReadingRange("50", "4.0", "mmol/l", thresholds)).toBe("low");
  });
});
