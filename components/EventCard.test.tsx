import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes, ReactNode } from "react";
import EventCard from "@/components/EventCard";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: { href: string; children: ReactNode } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const baseProps = {
  title: "React Summit US 2025",
  image: "https://res.cloudinary.com/demo/image.png",
  slug: "react-summit-us-2025",
  location: "San Francisco, CA, USA",
  date: "2025-11-07",
  time: "09:00 AM",
};

describe("EventCard", () => {
  it("renders a link pointing to the event detail page", () => {
    render(<EventCard {...baseProps} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/events/react-summit-us-2025");
  });

  it("renders the event title, location, date and time", () => {
    render(<EventCard {...baseProps} />);
    expect(screen.getByText(baseProps.title)).toBeInTheDocument();
    expect(screen.getByText(baseProps.location)).toBeInTheDocument();
    expect(screen.getByText(baseProps.date)).toBeInTheDocument();
    expect(screen.getByText(baseProps.time)).toBeInTheDocument();
  });

  it("renders the poster image with the correct src and alt text", () => {
    render(<EventCard {...baseProps} />);
    const poster = screen.getByAltText(baseProps.title);
    expect(poster).toHaveAttribute("src", baseProps.image);
  });

  it("builds the link href using the provided slug", () => {
    render(<EventCard {...baseProps} slug="a-different-slug" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/events/a-different-slug");
  });
});