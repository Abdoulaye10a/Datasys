import { Pencil } from "lucide-react";
import { updateProjectSolutionsAction } from "@/app/admin/actions";
import type { SiteSettings } from "@/lib/site-info";
import type { ProjectSolutionId } from "@/lib/project-solution-view-ids";

type SolutionFields = {
  name: keyof SiteSettings;
  date: keyof SiteSettings;
  status: keyof SiteSettings;
  category: keyof SiteSettings;
  audience: keyof SiteSettings;
  description: keyof SiteSettings;
  firstGroupTitle: keyof SiteSettings;
  firstGroupItems: keyof SiteSettings;
  secondGroupTitle?: keyof SiteSettings;
  secondGroupItems?: keyof SiteSettings;
  href: keyof SiteSettings;
  linkLabel: keyof SiteSettings;
  image: keyof SiteSettings;
  previewImage: keyof SiteSettings;
};

const solutionFields: Record<ProjectSolutionId, SolutionFields> = {
  annonces: {
    name: "solutionAnnoncesName",
    date: "solutionAnnoncesDate",
    status: "solutionAnnoncesStatus",
    category: "solutionAnnoncesCategory",
    audience: "solutionAnnoncesAudience",
    description: "solutionAnnoncesDescription",
    firstGroupTitle: "solutionAnnoncesRecruiterTitle",
    firstGroupItems: "solutionAnnoncesRecruiterItems",
    secondGroupTitle: "solutionAnnoncesCandidateTitle",
    secondGroupItems: "solutionAnnoncesCandidateItems",
    href: "solutionAnnoncesHref",
    linkLabel: "solutionAnnoncesLinkLabel",
    image: "solutionAnnoncesImage",
    previewImage: "solutionAnnoncesPreviewImage",
  },
  bataki: {
    name: "solutionBatakiName",
    date: "solutionBatakiDate",
    status: "solutionBatakiStatus",
    category: "solutionBatakiCategory",
    audience: "solutionBatakiAudience",
    description: "solutionBatakiDescription",
    firstGroupTitle: "solutionBatakiFeaturesTitle",
    firstGroupItems: "solutionBatakiFeatures",
    href: "solutionBatakiHref",
    linkLabel: "solutionBatakiLinkLabel",
    image: "solutionBatakiImage",
    previewImage: "solutionBatakiPreviewImage",
  },
  cenou: {
    name: "solutionCenouName",
    date: "solutionCenouDate",
    status: "solutionCenouStatus",
    category: "solutionCenouCategory",
    audience: "solutionCenouAudience",
    description: "solutionCenouDescription",
    firstGroupTitle: "solutionCenouStudentTitle",
    firstGroupItems: "solutionCenouStudentItems",
    secondGroupTitle: "solutionCenouAdministrationTitle",
    secondGroupItems: "solutionCenouAdministrationItems",
    href: "solutionCenouHref",
    linkLabel: "solutionCenouLinkLabel",
    image: "solutionCenouImage",
    previewImage: "solutionCenouPreviewImage",
  },
  immo: {
    name: "solutionImmoName",
    date: "solutionImmoDate",
    status: "solutionImmoStatus",
    category: "solutionImmoCategory",
    audience: "solutionImmoAudience",
    description: "solutionImmoDescription",
    firstGroupTitle: "solutionImmoFirstGroupTitle",
    firstGroupItems: "solutionImmoFirstGroupItems",
    secondGroupTitle: "solutionImmoSecondGroupTitle",
    secondGroupItems: "solutionImmoSecondGroupItems",
    href: "solutionImmoHref",
    linkLabel: "solutionImmoLinkLabel",
    image: "solutionImmoImage",
    previewImage: "solutionImmoPreviewImage",
  },
} as const;

const solutionLabels: Record<ProjectSolutionId, string> = {
  annonces: "Annonces",
  bataki: "BatakiPlus",
  cenou: "CENOU KIBARU",
  immo: "ImoMali",
};

export function getProjectSolutionName(
  solutionId: ProjectSolutionId,
  settings: SiteSettings,
) {
  return settings[solutionFields[solutionId].name];
}

export function AdminProjectSolutionsEditor({
  solutionId,
  settings,
}: {
  solutionId: ProjectSolutionId;
  settings: SiteSettings;
}) {
  const fields = solutionFields[solutionId];

  return (
    <SolutionForm
      solutionId={solutionId}
      fields={fields}
      settings={settings}
    />
  );
}

function SolutionForm({
  solutionId,
  fields,
  settings,
}: {
  solutionId: ProjectSolutionId;
  fields: SolutionFields;
  settings: SiteSettings;
}) {
  const secondGroup =
    fields.secondGroupTitle && fields.secondGroupItems
      ? {
          title: fields.secondGroupTitle,
          items: fields.secondGroupItems,
        }
      : undefined;

  return (
    <form className="admin-form project-solution-form" action={updateProjectSolutionsAction} encType="multipart/form-data">
      <input type="hidden" name="solutionId" value={solutionId} />
      <p className="field-hint">
        Vous modifiez uniquement la fiche {solutionLabels[solutionId]}.
      </p>
      <label>
        Nom du projet
        <input name="name" required minLength={1} maxLength={100} defaultValue={settings[fields.name]} />
      </label>
      <label>
        Catégorie
        <input name="category" maxLength={100} defaultValue={settings[fields.category]} />
      </label>
      <label>
        Public concerné
        <input name="audience" maxLength={180} defaultValue={settings[fields.audience]} />
      </label>
      <label>
        Présentation
        <textarea name="description" maxLength={600} rows={4} defaultValue={settings[fields.description]} />
      </label>
      <fieldset className="solution-admin-group">
        <legend>Premier groupe d’informations</legend>
        <label>
          Titre affiché
          <input
            name="firstGroupTitle"
            maxLength={100}
            defaultValue={settings[fields.firstGroupTitle]}
          />
        </label>
        <label>
          Informations (une par ligne)
          <textarea
            name="firstGroupItems"
            maxLength={1600}
            rows={5}
            defaultValue={settings[fields.firstGroupItems]}
          />
        </label>
      </fieldset>
      {secondGroup && (
        <fieldset className="solution-admin-group">
          <legend>Deuxième groupe d’informations</legend>
          <label>
            Titre affiché
            <input
              name="secondGroupTitle"
              maxLength={100}
              defaultValue={settings[secondGroup.title]}
            />
          </label>
          <label>
            Informations (une par ligne)
            <textarea
              name="secondGroupItems"
              maxLength={1200}
              rows={5}
              defaultValue={settings[secondGroup.items]}
            />
          </label>
        </fieldset>
      )}
      <label>
        Lien du bouton
        <input name="href" type="text" maxLength={2048} defaultValue={settings[fields.href]} />
      </label>
      <label>
        Texte du bouton
        <input name="linkLabel" maxLength={100} defaultValue={settings[fields.linkLabel]} placeholder="En savoir plus" />
      </label>
      <fieldset className="solution-image-picker">
        <legend>Logo de la solution</legend>
        <input type="hidden" name="image" value={settings[fields.image]} />
        <label>
          Choisir un logo depuis votre ordinateur
          <input
            type="file"
            name="imageFile"
            accept="image/jpeg,image/png,image/webp"
          />
        </label>
        <small className="field-hint">JPEG, PNG ou WebP · 4 Mo maximum. Un fichier choisi remplacera le logo actuellement utilisé.</small>
        {settings[fields.image] && (
          <img
            className="solution-image-current"
            src={settings[fields.image]}
            alt="Logo actuellement utilisé"
          />
        )}
      </fieldset>
      <fieldset className="solution-preview-picker">
        <legend>Visuel de l’aperçu (optionnel)</legend>
        <input type="hidden" name="previewImage" value={settings[fields.previewImage]} />
        <label>
          Choisir un visuel d’aperçu depuis votre ordinateur
          <input
            type="file"
            name="previewImageFile"
            accept="image/jpeg,image/png,image/webp"
          />
        </label>
        {settings[fields.previewImage] && (
          <>
            <span className="field-hint">Image actuellement utilisée :</span>
            <img
              className="solution-preview-current"
              src={settings[fields.previewImage]}
              alt="Aperçu actuellement sélectionné"
            />
            <label className="image-remove-option">
              <input type="checkbox" name="removePreviewImage" />
              Supprimer l’image actuelle et utiliser l’aperçu intégré
            </label>
          </>
        )}
        <small className="field-hint">
          Remplace l’aperçu animé par une image JPEG, PNG ou WebP (4 Mo maximum).
        </small>
      </fieldset>
      <label>
        Date
        <input name="date" type="date" defaultValue={settings[fields.date]} />
      </label>
      <label>
        Statut de publication
        <select name="status" defaultValue={settings[fields.status]}>
          <option value="DRAFT">Brouillon</option>
          <option value="PUBLISHED">Publié</option>
        </select>
      </label>
      <button className="button button-primary" type="submit">
        <Pencil size={16} /> Enregistrer les modifications
      </button>
    </form>
  );
}
