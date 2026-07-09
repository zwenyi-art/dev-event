// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks -----------------------------------------------------------------
vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/database", () => ({
  Event: {
    find: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/lib/cloudinary", () => ({
  default: {
    uploader: {
      upload_stream: vi.fn(),
    },
  },
}));

import { GET, POST } from "@/app/api/events/route";
import connectDB from "@/lib/mongodb";
import { Event } from "@/database";
import cloudinary from "@/lib/cloudinary";

const buildFormData = (overrides: Record<string, unknown> = {}) => {
  const formData = new FormData();
  const defaults: Record<string, string> = {
    title: "Test Event",
    slug: "test-event",
    description: "A description",
    overview: "An overview",
    venue: "Test Venue",
    location: "Test City",
    date: "2026-01-01",
    time: "10:00 AM",
    mode: "online",
    audience: "developers",
    organizer: "Test Organizer",
    tags: JSON.stringify(["tag1", "tag2"]),
    agenda: JSON.stringify(["Item 1", "Item 2"]),
  };
  const merged = { ...defaults, ...overrides };
  Object.entries(merged).forEach(([key, value]) => {
    if (value !== undefined) formData.append(key, value as string);
  });
  if (!("file" in overrides) || overrides.file !== null) {
    const file =
      (overrides.file as File | undefined) ??
      new File(["binary-content"], "test.png", { type: "image/png" });
    formData.append("file", file);
  }
  return formData;
};

describe("GET /api/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("connects to the database and returns events sorted by createdAt desc", async () => {
    const mockEvents = [{ title: "Event A" }, { title: "Event B" }];
    const sortMock = vi.fn().mockResolvedValue(mockEvents);
    (Event.find as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      sort: sortMock,
    });

    const response = await GET();
    const body = await response.json();

    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(Event.find).toHaveBeenCalledTimes(1);
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: "Events fetched successfully",
      events: mockEvents,
    });
  });

  it("returns an empty events array when there are no events", async () => {
    const sortMock = vi.fn().mockResolvedValue([]);
    (Event.find as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      sort: sortMock,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.events).toEqual([]);
  });
});

describe("POST /api/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSuccessfulUpload = (secureUrl = "https://res.cloudinary.com/demo/image.png") => {
    (
      cloudinary.uploader.upload_stream as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation((_options: unknown, callback: (error: unknown, result: unknown) => void) => {
      return {
        end: () => {
          callback(null, { secure_url: secureUrl });
        },
      };
    });
  };

  it("creates an event and uploads the image via cloudinary", async () => {
    mockSuccessfulUpload("https://res.cloudinary.com/demo/DevEvent/abc.png");
    const createdEvent = { _id: "1", title: "Test Event" };
    (Event.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(createdEvent);

    const formData = buildFormData();
    const req = new Request("http://localhost/api/events", {
      method: "POST",
      body: formData,
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      { resource_type: "image", folder: "DevEvent" },
      expect.any(Function)
    );
    expect(Event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Test Event",
        tags: ["tag1", "tag2"],
        agenda: ["Item 1", "Item 2"],
        image: "https://res.cloudinary.com/demo/DevEvent/abc.png",
      })
    );
    expect(response.status).toBe(201);
    expect(body).toEqual({
      message: "Event Created Successfully",
      event: createdEvent,
    });
  });

  it("returns 400 when no file is provided", async () => {
    const formData = buildFormData({ file: null });
    const req = new Request("http://localhost/api/events", {
      method: "POST",
      body: formData,
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ message: "File is required" });
    expect(Event.create).not.toHaveBeenCalled();
  });

  it("returns 500 when cloudinary upload fails", async () => {
    (
      cloudinary.uploader.upload_stream as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation((_options: unknown, callback: (error: unknown, result: unknown) => void) => {
      return {
        end: () => {
          callback(new Error("Upload failed"), null);
        },
      };
    });

    const formData = buildFormData();
    const req = new Request("http://localhost/api/events", {
      method: "POST",
      body: formData,
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe("Event Creation Failed");
    expect(body.error).toBe("Upload failed");
    expect(Event.create).not.toHaveBeenCalled();
  });

  it("returns 500 when tags field contains invalid JSON", async () => {
    const formData = buildFormData({ tags: "not-json" });
    const req = new Request("http://localhost/api/events", {
      method: "POST",
      body: formData,
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe("Event Creation Failed");
    expect(Event.create).not.toHaveBeenCalled();
  });

  it("returns 500 with the error message when Event.create rejects", async () => {
    mockSuccessfulUpload();
    (Event.create as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Validation failed: description is required")
    );

    const formData = buildFormData();
    const req = new Request("http://localhost/api/events", {
      method: "POST",
      body: formData,
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe("Event Creation Failed");
    expect(body.error).toBe("Validation failed: description is required");
  });
});