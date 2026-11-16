export const defaultButtonHref = "/contact";
export const defaultButtonLabel = "En savoir plus";

function getButtonFieldValue(
  formData: FormData,
  name: string,
  fallback: string,
) {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function getPublicationButtonFields(formData: FormData) {
  if (formData.get("withoutButton") === "on") {
    return { linkHref: undefined, linkLabel: undefined };
  }
  return {
    linkHref: getButtonFieldValue(formData, "linkHref", defaultButtonHref),
    linkLabel: getButtonFieldValue(formData, "linkLabel", defaultButtonLabel),
  };
}
