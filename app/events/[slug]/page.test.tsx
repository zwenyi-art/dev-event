import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

vi.mock("@/components/EventDetail", () => ({
  default: (props: { slug: string }) => (
    <div data-testid="event-detail">{props.slug}</div>
  ),
}));

import page from "@/app/events/[slug]/page";

describe("Event detail page", () => {
  it("resolves the slug param and forwards it to EventDetail", async () => {
    const jsx = await page({ params: Promise.resolve({ slug: "test-event-slug" }) });
    render(jsx as ReactElement);

    const detail = screen.getByTestId("event-detail");
    expect(detail).toHaveTextContent("test-event-slug");
  });

  it("renders EventDetail within a <main> wrapper", async () => {
    const jsx = await page({ params: Promise.resolve({ slug: "another-slug" }) });
    const { container } = render(jsx as ReactElement);

    expect(container.querySelector("main")).toBeInTheDocument();
    expect(container.querySelector("main")).toContainElement(
      screen.getByTestId("event-detail")
    );
  });

  it("supports different slugs across renders", async () => {
    const jsxOne = await page({ params: Promise.resolve({ slug: "slug-one" }) });
    const { unmount } = render(jsxOne as ReactElement);
    expect(screen.getByTestId("event-detail")).toHaveTextContent("slug-one");
    unmount();

    const jsxTwo = await page({ params: Promise.resolve({ slug: "slug-two" }) });
    render(jsxTwo as ReactElement);
    expect(screen.getByTestId("event-detail")).toHaveTextContent("slug-two");
  });
});