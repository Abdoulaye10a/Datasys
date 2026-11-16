export const projectSolutionIds = ["annonces", "bataki", "cenou", "immo"] as const;

export type ProjectSolutionId = (typeof projectSolutionIds)[number];

export function isProjectSolutionId(value: string): value is ProjectSolutionId {
  return projectSolutionIds.some((id) => id === value);
}

export const projectSolutionViewIds = {
  annonces: "solution:annonces",
  bataki: "solution:bataki",
  cenou: "solution:cenou",
  immo: "solution:immo",
} as const;
