import { describe, it, expect } from "vitest";
import packageJson from "@/package.json";

describe("package.json", () => {
  it("declares the fs dependency required by the events feature", () => {
    expect(packageJson.dependencies).toHaveProperty("fs");
    expect(packageJson.dependencies.fs).toBe("^0.0.1-security");
  });

  it("declares cloudinary as a dependency", () => {
    expect(packageJson.dependencies).toHaveProperty("cloudinary");
  });

  it("does not duplicate the fs dependency in devDependencies", () => {
    expect(packageJson.devDependencies).not.toHaveProperty("fs");
  });
});