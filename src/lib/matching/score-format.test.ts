import { describe, expect, it } from "vitest";
import { scoreFormatFit } from "./score-extended";
import { hasMessageKey, makeProfile, makeProgramme, paramsForKey } from "./test-fixtures";

describe("scoreFormatFit", () => {
  it("is not applicable when the programme publishes no study mode (UNKNOWN per spec §29)", () => {
    const profile = makeProfile({ preferred_study_format: "full_time" });
    const programme = makeProgramme({ study_mode: null });

    const result = scoreFormatFit(profile, programme);

    expect(result.score).toBeNull();
    expect(result.applicable).toBe(false);
    expect(hasMessageKey(result.concerns, "format.missingData")).toBe(true);
  });

  it("is not applicable when the user hasn't chosen a preferred format", () => {
    const profile = makeProfile({ preferred_study_format: null });
    const programme = makeProgramme({ study_mode: "full_time" });

    const result = scoreFormatFit(profile, programme);

    expect(result.score).toBeNull();
    expect(result.applicable).toBe(false);
    expect(hasMessageKey(result.concerns, "format.missingPreference")).toBe(true);
  });

  it("scores 100 for any published mode when the user is flexible ('either')", () => {
    const profile = makeProfile({ preferred_study_format: "either" });
    const programme = makeProgramme({ study_mode: "hybrid" });

    const result = scoreFormatFit(profile, programme);

    expect(result.score).toBe(100);
    expect(result.applicable).toBe(true);
    expect(hasMessageKey(result.reasons, "format.either")).toBe(true);
  });

  it("scores 100 when full-time preference matches full-time delivery", () => {
    const profile = makeProfile({ preferred_study_format: "full_time" });
    const programme = makeProgramme({ study_mode: "full_time" });

    const result = scoreFormatFit(profile, programme);

    expect(result.score).toBe(100);
    expect(hasMessageKey(result.reasons, "format.fullTimeMatch")).toBe(true);
  });

  it("scores 100 when part-time preference matches part-time delivery", () => {
    const profile = makeProfile({ preferred_study_format: "part_time" });
    const programme = makeProgramme({ study_mode: "part_time" });

    const result = scoreFormatFit(profile, programme);

    expect(result.score).toBe(100);
    expect(hasMessageKey(result.reasons, "format.partTimeMatch")).toBe(true);
  });

  it("scores partial (75–90) for delivery modes compatible with the preference", () => {
    const profile = makeProfile({ preferred_study_format: "part_time" });
    const programme = makeProgramme({ study_mode: "distance" });

    const result = scoreFormatFit(profile, programme);

    expect(result.score).toBe(90);
    expect(hasMessageKey(result.reasons, "format.partialMatch")).toBe(true);
    expect(paramsForKey(result.reasons, "format.partialMatch")).toMatchObject({ mode: "distance" });
  });

  it("scores 30 with an explicit concern when the mode directly conflicts with the preference", () => {
    const profile = makeProfile({ preferred_study_format: "full_time" });
    const programme = makeProgramme({ study_mode: "part_time" });

    const result = scoreFormatFit(profile, programme);

    expect(result.score).toBe(30);
    expect(hasMessageKey(result.reasons, "format.mismatch")).toBe(true);
    expect(paramsForKey(result.reasons, "format.mismatch")).toMatchObject({
      mode: "part_time",
      preferred: "full_time",
    });
    expect(hasMessageKey(result.concerns, "format.modeConcern")).toBe(true);
  });

  it("scores 30 when a full-time programme conflicts with a part-time preference", () => {
    const profile = makeProfile({ preferred_study_format: "part_time" });
    const programme = makeProgramme({ study_mode: "full_time" });

    const result = scoreFormatFit(profile, programme);

    expect(result.score).toBe(30);
    expect(hasMessageKey(result.concerns, "format.modeConcern")).toBe(true);
  });
});