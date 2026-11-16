export const siteLogoOptions = [
  {
    url: "/datasys-logo-compact.png",
    label: "Compact sans slogan",
    description: "Version compacte, sans signature.",
    width: 622,
    height: 298,
  },
  {
    url: "/datasys-logo-horizontal-slogan.png",
    label: "Horizontal avec slogan",
    description: "Logo horizontal avec sa signature.",
    width: 625,
    height: 323,
  },
] as const;

export const defaultSiteLogoUrl = "/datasys-logo-compact.png";

export const retiredSiteLogoUrls = [
  "/datasys-logo.png",
  "/datasys-logo-horizontal.png",
  "/datasys-logo-compact-slogan.png",
] as const;
