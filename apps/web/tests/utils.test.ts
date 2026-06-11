import { describe, it, expect } from "vitest";
import { cn, VERTICALS, getVertical, formatDate, formatRelative, truncate } from "@/lib/utils";

describe("Utils", () => {
  describe("cn", () => {
    it("merges tailwind classes", () => {
      expect(cn("px-2", "px-4")).toBe("px-4");
    });

    it("handles conditional classes", () => {
      expect(cn("base", false && "hidden", true && "visible")).toBe("base visible");
    });

    it("handles undefined and null", () => {
      expect(cn("base", undefined, null)).toBe("base");
    });
  });

  describe("VERTICALS", () => {
    it("has exactly 10 verticals", () => {
      expect(VERTICALS).toHaveLength(10);
    });

    it("all verticals have slug and label", () => {
      for (const v of VERTICALS) {
        expect(v.slug).toBeTruthy();
        expect(v.label).toBeTruthy();
      }
    });

    it("contains all required domains", () => {
      const slugs = VERTICALS.map((v) => v.slug);
      expect(slugs).toContain("engineering");
      expect(slugs).toContain("legal");
      expect(slugs).toContain("finance");
      expect(slugs).toContain("healthcare");
      expect(slugs).toContain("hr-hcm");
      expect(slugs).toContain("marketing");
      expect(slugs).toContain("research");
      expect(slugs).toContain("operations");
      expect(slugs).toContain("education");
      expect(slugs).toContain("creative");
    });
  });

  describe("getVertical", () => {
    it("returns matching vertical", () => {
      const result = getVertical("engineering");
      expect(result).toEqual({ slug: "engineering", label: "Engineering" });
    });

    it("returns undefined for unknown slug", () => {
      expect(getVertical("nonexistent")).toBeUndefined();
    });
  });

  describe("formatDate", () => {
    it("formats Date object", () => {
      const result = formatDate(new Date("2024-03-15"));
      expect(result).toContain("Mar");
      expect(result).toContain("15");
      expect(result).toContain("2024");
    });

    it("formats ISO string", () => {
      const result = formatDate("2024-01-01T00:00:00Z");
      expect(result).toContain("2024");
    });
  });

  describe("formatRelative", () => {
    it("returns 'just now' for recent dates", () => {
      expect(formatRelative(new Date())).toBe("just now");
    });

    it("returns minutes ago", () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelative(fiveMinAgo)).toBe("5m ago");
    });

    it("returns hours ago", () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(formatRelative(threeHoursAgo)).toBe("3h ago");
    });

    it("returns days ago", () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(formatRelative(twoDaysAgo)).toBe("2d ago");
    });

    it("returns formatted date for 30+ days", () => {
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const result = formatRelative(oldDate);
      expect(result).not.toContain("ago");
    });
  });

  describe("truncate", () => {
    it("returns full string if shorter than limit", () => {
      expect(truncate("hello", 10)).toBe("hello");
    });

    it("truncates with ellipsis", () => {
      expect(truncate("hello world", 5)).toBe("hello…");
    });

    it("handles exact length", () => {
      expect(truncate("hello", 5)).toBe("hello");
    });

    it("handles empty string", () => {
      expect(truncate("", 5)).toBe("");
    });
  });
});
