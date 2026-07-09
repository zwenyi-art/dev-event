import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
}));

vi.mock("@/components/ExploreBtn", () => ({
  default: () => <button type="button">Explore Events</button>,
}));

vi.mock("@/components/EventCard", () => ({
  default: (props: { title: string; slug: string }) => (
    <div data-testid="event-card">{props.title}</div>
  ),
}));

import page from "@/app/page";

describe("Home page", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockEvents = [
    {
      title: "React Summit US 2025",
      image: "https://res.cloudinary.com/demo/1.png",
      slug: "react-summit-us-2025",
      location: "San Francisco, CA, USA",
      date: "2025-11-07",
      time: "09:00 AM",
    },
    {
      title: "KubeCon Europe 2026",
      image: "/images/event2.png",
      slug: "kubecon-eu-2026",
      location: "Vienna, Austria",
      date: "2026-03-18",
      time: "10:00 AM",
    },
  ];

  it("fetches events from the /api/events endpoint", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ events: mockEvents }),
    }) as unknown as typeof fetch;

    await page();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/events"),
      expect.any(Object)
    );
  });

  it("renders a card for every fetched event, keyed by slug", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ events: mockEvents }),
    }) as unknown as typeof fetch;

    const jsx = await page();
    render(jsx as ReactElement);

    const cards = screen.getAllByTestId("event-card");
    expect(cards).toHaveLength(2);
    expect(screen.getByText("React Summit US 2025")).toBeInTheDocument();
    expect(screen.getByText("KubeCon Europe 2026")).toBeInTheDocument();
  });

  it("renders the heading and explore button", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ events: mockEvents }),
    }) as unknown as typeof fetch;

    const jsx = await page();
    render(jsx as ReactElement);

    expect(screen.getByText("Featured Events")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explore Events" })).toBeInTheDocument();
  });

  it("renders no event cards when the events list is empty", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ events: [] }),
    }) as unknown as typeof fetch;

    const jsx = await page();
    render(jsx as ReactElement);

    expect(screen.queryByTestId("event-card")).not.toBeInTheDocument();
  });

  it("does not throw and renders no cards when events is missing from the response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch;

    const jsx = await page();
    render(jsx as ReactElement);

    expect(screen.queryByTestId("event-card")).not.toBeInTheDocument();
  });
});