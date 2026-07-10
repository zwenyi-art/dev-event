// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const configMock = vi.fn();

vi.mock("cloudinary", () => ({
  v2: {
    config: configMock,
    uploader: { upload_stream: vi.fn() },
  },
}));

describe("lib/cloudinary", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    configMock.mockClear();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("configures cloudinary with credentials from environment variables", async () => {
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
    process.env.CLOUDINARY_API_KEY = "test-key";
    process.env.CLOUDINARY_API_SECRET = "test-secret";

    const cloudinaryModule = await import("@/lib/cloudinary");

    expect(configMock).toHaveBeenCalledTimes(1);
    expect(configMock).toHaveBeenCalledWith({
      cloud_name: "test-cloud",
      api_key: "test-key",
      api_secret: "test-secret",
      secure: true,
    });
    expect(cloudinaryModule.default).toBeDefined();
  });

  it("always configures with secure set to true regardless of env values", async () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    await import("@/lib/cloudinary");

    expect(configMock).toHaveBeenCalledWith(
      expect.objectContaining({ secure: true })
    );
  });

  it("exports the configured cloudinary v2 instance as default", async () => {
    const cloudinaryModule = await import("@/lib/cloudinary");
    const { v2 } = await import("cloudinary");

    expect(cloudinaryModule.default).toBe(v2);
  });
});