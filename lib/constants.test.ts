import { describe, it, expect } from "vitest";
import { events, default as defaultEvents } from "@/lib/constants";

describe("lib/constants events", () => {
  it("exports the events array as both named and default export", () => {
    expect(defaultEvents).toBe(events);
  });

  it("contains at least one event", () => {
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
  });

  it("every event has the required EventItem shape", () => {
    events.forEach((event) => {
      expect(typeof event.image).toBe("string");
      expect(event.image.length).toBeGreaterThan(0);
      expect(typeof event.title).toBe("string");
      expect(event.title.length).toBeGreaterThan(0);
      expect(typeof event.slug).toBe("string");
      expect(event.slug.length).toBeGreaterThan(0);
      expect(typeof event.location).toBe("string");
      expect(typeof event.date).toBe("string");
      expect(typeof event.time).toBe("string");
    });
  });

  it("has no duplicate slugs", () => {
    const slugs = events.map((event) => event.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses either an absolute https URL or a root-relative path for images", () => {
    events.forEach((event) => {
      expect(event.image.startsWith("https://") || event.image.startsWith("/")).toBe(true);
    });
  });

  it("uses the updated Cloudinary URL for the React Summit US 2025 event image", () => {
    const reactSummit = events.find((event) => event.slug === "react-summit-us-2025");
    expect(reactSummit).toBeDefined();
    expect(reactSummit?.image).toBe(
      "https://res.cloudinary.com/detwp36e7/image/upload/v1783400375/DevEvent/gpdy1l5ksawjpjhlsedh.png"
    );
    expect(reactSummit?.image).toMatch(/^https:\/\/res\.cloudinary\.com\//);
  });
});