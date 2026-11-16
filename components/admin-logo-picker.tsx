"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Eye, Save } from "lucide-react";
import { updateSiteLogoAction } from "@/app/admin/actions";
import { defaultSiteLogoUrl, siteLogoOptions } from "@/lib/site-logos";

type LogoMedia = {
  id: string;
  url: string;
  altText: string | null;
};

export function AdminLogoPicker({
  currentLogoUrl,
  media,
}: {
  currentLogoUrl: string;
  media: LogoMedia[];
}) {
  const [selectedLogoUrl, setSelectedLogoUrl] = useState(currentLogoUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filePreviewUrlRef = useRef("");
  useEffect(
    () => () => {
      if (filePreviewUrlRef.current) URL.revokeObjectURL(filePreviewUrlRef.current);
    },
    [],
  );

  const selectedLogo =
    siteLogoOptions.find((logo) => logo.url === selectedLogoUrl) ?? {
      url: selectedLogoUrl,
      label: media.find((item) => item.url === selectedLogoUrl)?.altText || "Logo importé",
      width: 625,
      height: 320,
    };
  const selectedMedia = media.some((item) => item.url === selectedLogoUrl);
  const selectLogo = (url: string) => {
    setSelectedLogoUrl(url);
    setSelectedFile(null);
    if (filePreviewUrlRef.current) URL.revokeObjectURL(filePreviewUrlRef.current);
    filePreviewUrlRef.current = "";
    setFilePreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="logo-picker">
      <input type="hidden" name="logoUrl" value={selectedLogoUrl} />
      <label className="logo-upload-field">
        Choisir un logo depuis votre ordinateur
        <input
          ref={fileInputRef}
          name="logoFile"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            if (filePreviewUrlRef.current) URL.revokeObjectURL(filePreviewUrlRef.current);
            filePreviewUrlRef.current = file ? URL.createObjectURL(file) : "";
            setFilePreviewUrl(filePreviewUrlRef.current);
            setSelectedFile(file);
          }}
        />
        <small className="field-hint">JPEG, PNG ou WebP · 4 Mo maximum.</small>
      </label>
      <fieldset className="logo-choice-fieldset">
        <legend>Choisissez une version du logo</legend>
        <div className="logo-choice-grid">
          {siteLogoOptions.map((logo) => (
            <button
              className={`logo-choice${selectedLogoUrl === logo.url ? " is-selected" : ""}`}
              type="button"
              key={logo.url}
              aria-pressed={selectedLogoUrl === logo.url}
              onClick={() => selectLogo(logo.url)}
            >
              <span className="logo-choice-image">
                <Image
                  src={logo.url}
                  alt=""
                  width={logo.width}
                  height={logo.height}
                  unoptimized
                />
              </span>
              <strong>{logo.label}</strong>
              <small>{logo.description}</small>
            </button>
          ))}
        </div>
      </fieldset>
      {media.length > 0 && (
        <label className="logo-media-select">
          Ou choisir un logo déjà importé
          <select
            value={selectedMedia ? selectedLogoUrl : ""}
            onChange={(event) => selectLogo(event.target.value || defaultSiteLogoUrl)}
          >
            <option value="">Sélectionnez un logo…</option>
            {media.map((item) => (
              <option key={item.id} value={item.url}>
                {item.altText || item.url}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="site-logo-preview">
        <span className="section-kicker"><Eye size={14} /> APERÇU DU LOGO SÉLECTIONNÉ</span>
        {(filePreviewUrl || selectedLogoUrl) && (
          filePreviewUrl ? (
            <Image
              src={filePreviewUrl}
              alt={selectedFile?.name || "Aperçu du logo sélectionné"}
              width={175}
              height={70}
              unoptimized
            />
          ) : (
            <Image
              src={selectedLogoUrl}
              alt={selectedLogo.label}
              width={selectedLogo.width}
              height={selectedLogo.height}
              unoptimized
            />
          )
        )}
      </div>
      <button
        className="button button-primary logo-apply-button"
        type="submit"
        formAction={updateSiteLogoAction}
      >
        <Save size={16} /> Appliquer ce logo au site
      </button>
      <small className="field-hint">
        Le logo sera mis à jour dans l’en-tête, le pied de page et les espaces
        d’administration. Vous pouvez le changer à tout moment.
      </small>
    </div>
  );
}
