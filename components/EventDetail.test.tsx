import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes, ReactElement } from "react";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
}));

const notFoundMock = vi.fn(() => undefined);
vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

const getSimilarEventsBySlugMock = vi.fn();
vi.mock("@/lib/actions/event.actions", () => ({
  getSimilarEventsBySlug: getSimilarEventsBySlugMock,
}));

vi.mock("@/components/EventCard", () => ({
  default: (props: { slug: string; title: string }) => (
    <div data-testid="event-card">{props.title}</div>
  ),
}));

import EventDetail from "@/components/EventDetail";

const baseEvent = {
  _id: "event-1",
  description: "A great event description",
  overview: "Event overview",
  image: "https://res.cloudinary.com/demo/banner.png",
  date: "2026-01-01",
  time: "10:00 AM",
  location: "San Francisco, CA",
  mode: "online",
  agenda: ["Agenda item 1", "Agenda item 2"],
  audience: "developers",
  tags: ["react", "js"],
  organizer: "DevEvent Team",
};

describe("EventDetail", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    getSimilarEventsBySlugMock.mockResolvedValue([]);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders event details when the fetch succeeds", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ event: baseEvent }),
    }) as unknown as typeof fetch;

    const jsx = await EventDetail({ slug: "test-event" });
    render(jsx as ReactElement);

    expect(screen.getByText(baseEvent.description)).toBeInTheDocument();
    expect(screen.getByText(baseEvent.overview)).toBeInTheDocument();
    expect(screen.getByText(baseEvent.organizer)).toBeInTheDocument();
    expect(screen.getByText("Agenda item 1")).toBeInTheDocument();
    expect(screen.getByText("Agenda item 2")).toBeInTheDocument();
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("js")).toBeInTheDocument();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("fetches from the correct events endpoint for the given slug", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ event: baseEvent }),
    }) as unknown as typeof fetch;

    await EventDetail({ slug: "my-event-slug" });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/events/my-event-slug"),
      expect.any(Object)
    );
  });

  it("renders similar events returned by getSimilarEventsBySlug", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ event: baseEvent }),
    }) as unknown as typeof fetch;
    getSimilarEventsBySlugMock.mockResolvedValue([
      { slug: "similar-1", title: "Similar Event One" },
      { slug: "similar-2", title: "Similar Event Two" },
    ]);

    const jsx = await EventDetail({ slug: "test-event" });
    render(jsx as ReactElement);

    expect(getSimilarEventsBySlugMock).toHaveBeenCalledWith(baseEvent._id);
    const cards = screen.getAllByTestId("event-card");
    expect(cards).toHaveLength(2);
    expect(screen.getByText("Similar Event One")).toBeInTheDocument();
    expect(screen.getByText("Similar Event Two")).toBeInTheDocument();
  });

  it("calls notFound when the response status is 404", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    }) as unknown as typeof fetch;

    await EventDetail({ slug: "missing-event" });

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("calls notFound when the fetch response is not ok with a non-404 status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    }) as unknown as typeof fetch;
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await EventDetail({ slug: "broken-event" });

    expect(notFoundMock).toHaveBeenCalledTimes(1);
    consoleErrorSpy.mockRestore();
  });

  it("calls notFound when fetch throws (network error)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network error"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await EventDetail({ slug: "test-event" });

    expect(notFoundMock).toHaveBeenCalledTimes(1);
    consoleErrorSpy.mockRestore();
  });

  it("calls notFound when the response body has no event", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ event: null }),
    }) as unknown as typeof fetch;

    await EventDetail({ slug: "test-event" });

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("calls notFound when the event is missing a description", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ event: { ...baseEvent, description: "" } }),
    }) as unknown as typeof fetch;

    await EventDetail({ slug: "test-event" });

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});