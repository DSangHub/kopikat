import { bundleId } from "@/lib/site";

export function appleAppSiteAssociation() {
  const team = process.env.APPLE_TEAM_ID?.trim() || "";
  if (!/^[A-Z0-9]{10}$/.test(team)) return null;
  return {
    applinks: {
      apps: [] as string[],
      details: [
        {
          appIDs: [`${team}.${bundleId}`],
          components: [
            { "/": "/p/*" },
            { "/": "/accept/*" },
            { "/": "/auth/callback" },
            { "/": "/dashboard" },
            { "/": "/dashboard/*" },
            { "/": "/login" },
            { "/": "/signup" },
            { "/": "/" },
          ],
        },
      ],
    },
  };
}
