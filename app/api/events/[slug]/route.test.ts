// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/database", () => ({
  Event: {
    findOne: vi.fn(),
  },
}));

import { GET } from "@/app/api/events/[slug]/route";
import connectDB from "@/lib/mongodb";
import { Event } from "@/database";

const buildParams = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("GET /api/events/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when slug is an empty/whitespace string", async () => {
    const response = await GET({} as any, buildParams("   "));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ message: "Invalid or missing slug parameter" });
    expect(Event.findOne).not.toHaveBeenCalled();
  });

  it("trims and lowercases the slug before querying", async () => {
    const leanMock = vi.fn().mockResolvedValue({ title: "My Event", slug: "my-slug" });
    (Event.findOne as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ lean: leanMock });

    await GET({} as any, buildParams("  My-Slug  "));

    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(Event.findOne).toHaveBeenCalledWith({ slug: "my-slug" });
  });

  it("returns 404 with a descriptive message when the event is not found", async () => {
    const leanMock = vi.fn().mockResolvedValue(null);
    (Event.findOne as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ lean: leanMock });

    const response = await GET({} as any, buildParams("missing-slug"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ message: "Event with slug 'missing-slug' not found" });
  });

  it("returns 200 with the event when found", async () => {
    const event = { title: "My Event", slug: "my-event" };
    const leanMock = vi.fn().mockResolvedValue(event);
    (Event.findOne as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ lean: leanMock });

    const response = await GET({} as any, buildParams("my-event"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ message: "Event fetched successfully", event });
  });

  it("returns 500 with a database configuration message for MONGODB_URI errors", async () => {
    (connectDB as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Please define the MONGODB_URI environment variable")
    );

    const response = await GET({} as any, buildParams("my-event"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ message: "Database configuration error" });
  });

  it("returns 500 with a generic message and error details for other Error instances", async () => {
    const leanMock = vi.fn().mockRejectedValue(new Error("Unexpected DB failure"));
    (Event.findOne as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ lean: leanMock });

    const response = await GET({} as any, buildParams("my-event"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      message: "Failed to fetch events",
      error: "Unexpected DB failure",
    });
  });

  it("returns 500 with a generic message for non-Error thrown values", async () => {
    (connectDB as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce("some string error");

    const response = await GET({} as any, buildParams("my-event"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ message: "An unexpected error occurred" });
  });
});