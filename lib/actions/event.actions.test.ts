// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/database/event.model", () => ({
  default: {
    findById: vi.fn(),
    find: vi.fn(),
  },
}));

import { getSimilarEventsBySlug } from "@/lib/actions/event.actions";
import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";

describe("getSimilarEventsBySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array when the event is not found", async () => {
    const leanMock = vi.fn().mockResolvedValue(null);
    (Event.findById as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ lean: leanMock });

    const result = await getSimilarEventsBySlug("missing-id");

    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(Event.findById).toHaveBeenCalledWith("missing-id");
    expect(Event.find).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("queries for events sharing tags, excluding the event itself", async () => {
    const baseEvent = { _id: "event-1", tags: ["react", "js"] };
    const similarEvents = [{ _id: "event-2", tags: ["react"] }];

    const findByIdLeanMock = vi.fn().mockResolvedValue(baseEvent);
    (Event.findById as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ lean: findByIdLeanMock });

    const findLeanMock = vi.fn().mockResolvedValue(similarEvents);
    (Event.find as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ lean: findLeanMock });

    const result = await getSimilarEventsBySlug("event-1");

    expect(Event.find).toHaveBeenCalledWith({
      _id: { $ne: baseEvent._id },
      tags: { $in: baseEvent.tags },
    });
    expect(result).toEqual(similarEvents);
  });

  it("returns an empty array and swallows errors when connectDB throws", async () => {
    (connectDB as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("connection failed")
    );
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getSimilarEventsBySlug("event-1");

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("returns an empty array when the underlying query rejects", async () => {
    const findByIdLeanMock = vi.fn().mockRejectedValue(new Error("query failed"));
    (Event.findById as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ lean: findByIdLeanMock });
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getSimilarEventsBySlug("event-1");

    expect(result).toEqual([]);
    consoleErrorSpy.mockRestore();
  });
});