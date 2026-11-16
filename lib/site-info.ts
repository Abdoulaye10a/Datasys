import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { defaultSiteLogoUrl, retiredSiteLogoUrls } from "@/lib/site-logos";

export const defaultSiteSettings = {
  logoUrl: defaultSiteLogoUrl,
  primaryColor: "#18243c",
  deepColor: "#121d33",
  accentColor: "#a02038",
  legalName: "Société de Services Numériques",
  location: "Bamako / Kalaban Coura",
  locationLatitude: "",
  locationLongitude: "",
  contactEmail: "contact@groupdatasys.com",
  phonePrimary: "+223 71 31 14 00",
  phoneSecondary: "+223 76 58 88 82",
  registration: "MA.BKO.2021.B.1175",
  taxNumber: "085145327T",
  bankAccount: "ML043 01006 006003000315 15",
  linkedinUrl: "",
  instagramUrl: "",
  homeHeroImageUrl: "",
  homeEyebrow: "L’innovation, au cœur de nos activités",
  homeTitleFirst: "Le numérique",
  homeTitleBridge: "qui fait",
  homeTitleEmphasis: "avancer",
  homeTitleLast: "vos idées.",
  homeDescription: "Nous imaginons et développons des solutions digitales utiles, pensées pour les organisations d’aujourd’hui et de demain.",
  homePrimaryLabel: "Découvrir nos projets",
  homePrimaryHref: "/projets",
  homeSecondaryLabel: "Nos actualités",
  homeSecondaryHref: "/actualites",
  homeIntroKicker: "01 — QUI SOMMES-NOUS",
  homeIntroTitle: "La technologie a plus de valeur lorsqu’elle rapproche.",
  homeIntroText: "DATASYS accompagne les entreprises, les institutions et les porteurs de projets dans leur transformation numérique, avec une approche à la fois humaine et exigeante.",
  homeNewsKicker: "LE JOURNAL DATASYS",
  homeNewsTitleLead: "Ce qui",
  homeNewsTitleAccent: "nous anime.",
  homeNewsAllLabel: "Toutes les actualités",
  homeNewsFeaturedTitle: "",
  homeNewsFeaturedText: "",
  homeNewsFeaturedLabel: "Voir dans Actualités",
  homeNewsFeaturedBadge: "À la une",
  homeNewsExploreLabel: "Explorer le journal",
  homeNewsEmptyTitle: "Les premières nouvelles se préparent.",
  homeNewsEmptyText: "Retrouvez bientôt ici les actualités et les temps forts de DATASYS.",
  solutionsKicker: "DES OUTILS AU SERVICE DE VOS USAGES",
  solutionsTitle: "Nos solutions digitales et réalisations",
  solutionsDescription: "Recrutement, communication, services aux étudiants et immobilier : découvrez les plateformes et projets conçus pour répondre à des besoins concrets.",
  solutionAnnoncesVisible: "true",
  solutionAnnoncesStatus: "PUBLISHED",
  solutionAnnoncesDate: "",
  solutionAnnoncesName: "ANNONCES",
  solutionAnnoncesCategory: "Emploi & recrutement",
  solutionAnnoncesAudience: "Pour les entreprises et les candidats",
  solutionAnnoncesDescription: "Une solution moderne pour publier des offres d’emploi et recevoir des candidatures en ligne, sans déplacement.",
  solutionAnnoncesRecruiterTitle: "Pour le recruteur",
  solutionAnnoncesRecruiterItems: "Publication rapide des offres d’emploi\nRéception centralisée des candidatures\nTri et sélection simplifiés\nNotifications à chaque étape et suivi complet du recrutement",
  solutionAnnoncesCandidateTitle: "Pour le candidat",
  solutionAnnoncesCandidateItems: "Création d’un compte et d’un CV en ligne\nCandidature rapide et suivi des dossiers en temps réel\nNotifications et meilleure transparence",
  solutionAnnoncesHref: "https://annoncesmali.com",
  solutionAnnoncesLinkLabel: "Visiter annoncesmali.com",
  solutionAnnoncesImage: "/solutions/annonces-logo.webp",
  solutionAnnoncesPreviewImage: "",
  solutionBatakiVisible: "true",
  solutionBatakiStatus: "PUBLISHED",
  solutionBatakiDate: "",
  solutionBatakiName: "BatakiPlus",
  solutionBatakiCategory: "Communication par SMS",
  solutionBatakiAudience: "ONG, entreprises, administrations et établissements scolaires",
  solutionBatakiDescription: "Une plateforme professionnelle d’envoi de SMS en masse, pensée pour communiquer simplement avec vos publics.",
  solutionBatakiFeaturesTitle: "Fonctionnalités principales",
  solutionBatakiFeatures: "Envoi de SMS en masse et personnalisation des messages\nImportation simplifiée des contacts\nEnvoi immédiat ou programmé\nSuivi des campagnes en temps réel et rapports détaillés\nInterface simple et conviviale",
  solutionBatakiHref: "https://batakiplus.com",
  solutionBatakiLinkLabel: "Visiter batakiplus.com",
  solutionBatakiImage: "/solutions/batakiplus-logo.webp",
  solutionBatakiPreviewImage: "",
  solutionCenouVisible: "true",
  solutionCenouStatus: "PUBLISHED",
  solutionCenouDate: "",
  solutionCenouName: "CENOU KIBARU",
  solutionCenouCategory: "Services aux étudiants",
  solutionCenouAudience: "Étudiants et administration du CENOU",
  solutionCenouDescription: "Un service qui permet aux étudiants de suivre le traitement de leur dossier de bourse, sans se déplacer au CENOU.",
  solutionCenouStudentTitle: "Pour les étudiants",
  solutionCenouStudentItems: "Gain de temps et accès rapide à l’information\nPlus de transparence et moins de déplacements\nCommunication simplifiée",
  solutionCenouAdministrationTitle: "Pour l’administration",
  solutionCenouAdministrationItems: "Amélioration de la communication et réduction des réclamations\nDiffusion rapide des informations\nMeilleure gestion des allocations et des dossiers étudiants",
  solutionCenouHref: "https://cenoumali.ml",
  solutionCenouLinkLabel: "Visiter cenoumali.ml",
  solutionCenouImage: "/solutions/cenou-kibaru-logo.webp",
  solutionCenouPreviewImage: "",
  solutionImmoVisible: "true",
  solutionImmoStatus: "PUBLISHED",
  solutionImmoDate: "",
  solutionImmoName: "ImoMali",
  solutionImmoCategory: "Immobilier",
  solutionImmoAudience: "Acheteurs, vendeurs, locataires, propriétaires et agences immobilières",
  solutionImmoDescription: "Une plateforme immobilière qui met en relation propriétaires, agences et promoteurs avec les acheteurs et locataires, partout au Mali.",
  solutionImmoFirstGroupTitle: "Pour les acheteurs et locataires",
  solutionImmoFirstGroupItems: "Des annonces de maisons, appartements, terrains et locaux commerciaux\nRecherche par budget, localisation et type de bien\nPhotos et descriptions détaillées pour comparer les offres\nContact direct avec les propriétaires et les agences",
  solutionImmoSecondGroupTitle: "Pour les vendeurs et propriétaires",
  solutionImmoSecondGroupItems: "Publication rapide des annonces immobilières\nPlus de visibilité auprès des acheteurs et locataires\nGestion et mise à jour simples des biens\nDes demandes qualifiées directement dans la plateforme",
  solutionImmoHref: "https://imomali.com/",
  solutionImmoLinkLabel: "Visiter imomali.com",
  solutionImmoImage: "/solutions/imomali-logo.webp",
  solutionImmoPreviewImage: "",
  homeShowNews: "true",
  homeShowApproach: "true",
  homeShowActivities: "true",
  homeShowCta: "true",
  homeNewsOrder: "1",
  homeApproachOrder: "2",
  homeActivitiesOrder: "3",
  homeCtaOrder: "4",
};

export type SiteSettings = typeof defaultSiteSettings;

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const settings = await prisma.setting.findMany({
    where: { key: { in: Object.keys(defaultSiteSettings) } },
    select: { key: true, value: true },
  });

  const resolvedSettings = {
    ...defaultSiteSettings,
    ...Object.fromEntries(settings.map(({ key, value }) => [key, value])),
  } as SiteSettings;

  return {
    ...resolvedSettings,
    logoUrl: retiredSiteLogoUrls.includes(
      resolvedSettings.logoUrl as (typeof retiredSiteLogoUrls)[number],
    )
      ? defaultSiteLogoUrl
      : resolvedSettings.logoUrl,
    primaryColor:
      resolvedSettings.primaryColor.toLowerCase() === "#142d59"
        ? defaultSiteSettings.primaryColor
        : resolvedSettings.primaryColor,
    deepColor:
      resolvedSettings.deepColor.toLowerCase() === "#0d2146"
        ? defaultSiteSettings.deepColor
        : resolvedSettings.deepColor,
    accentColor:
      resolvedSettings.accentColor.toLowerCase() === "#d4a844"
        ? defaultSiteSettings.accentColor
        : resolvedSettings.accentColor,
  };
});

export function getSitePhones(settings: SiteSettings) {
  return [settings.phonePrimary, settings.phoneSecondary]
    .filter(Boolean)
    .map((display) => ({
      display,
      href: `tel:${display.replace(/[^\d+]/g, "")}`,
    }));
}
