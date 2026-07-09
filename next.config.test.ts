import { describe, it, expect } from "vitest";
import nextConfig from "@/next.config";

describe("next.config", () => {
  it("ignores TypeScript build errors", () => {
    expect(nextConfig.typescript?.ignoreBuildErrors).toBe(true);
  });

  it("enables cacheComponents", () => {
    expect(nextConfig.cacheComponents).toBe(true);
  });

  it("whitelists the Cloudinary hostname for remote images over https", () => {
    expect(nextConfig.images?.remotePatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          protocol: "https",
          hostname: "res.cloudinary.com",
        }),
      ])
    );
  });

  it("only whitelists a single remote image pattern", () => {
    expect(nextConfig.images?.remotePatterns).toHaveLength(1);
  });
});