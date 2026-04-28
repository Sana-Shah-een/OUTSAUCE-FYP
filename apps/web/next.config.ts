import type { NextConfig } from "next";
import path from "path";

const isProdBuild = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  ...(isProdBuild
    ? {
        output: "standalone",
        outputFileTracingRoot: path.join(__dirname, "../../"),
      }
    : {}),
};

export default nextConfig;
