import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "ActivityTracker",
        short_name: "ActivityTracker",
        description: "Track your time and get AI-powered insights",
        start_url: "/",
        display: "standalone",
        background_color: "#0B132B",
        theme_color: "#0B132B",
        icons: [
            {
                src: "/icon.svg",
                sizes: "1024x1024",
                type: "image/svg+xml",
            },
        ],
    };
}