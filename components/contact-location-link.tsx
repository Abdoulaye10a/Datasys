"use client";

import { useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";

function getLocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "Autorisez la géolocalisation dans votre navigateur pour calculer l’itinéraire.";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Votre position n’a pas pu être déterminée. Vérifiez le GPS ou la connexion.";
  }
  return "La localisation a pris trop de temps. Réessayez.";
}

export function ContactLocationLink({
  location,
  latitude,
  longitude,
}: {
  location: string;
  latitude: string;
  longitude: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const destination = latitude && longitude ? `${latitude},${longitude}` : location;
  const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;

  function openDirections(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setError("");

    if (!navigator.geolocation) {
      setError("La géolocalisation n’est pas prise en charge par ce navigateur.");
      return;
    }

    setPending(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const params = new URLSearchParams({
          api: "1",
          origin: `${coords.latitude},${coords.longitude}`,
          destination,
        });
        window.location.assign(`https://www.google.com/maps/dir/?${params.toString()}`);
      },
      (locationError) => {
        setError(getLocationErrorMessage(locationError));
        setPending(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  return (
    <>
      <a
        className="contact-detail contact-location-link"
        href={fallbackUrl}
        onClick={openDirections}
        aria-label={`Calculer l’itinéraire depuis votre position vers DATASYS, ${location}`}
        aria-busy={pending}
      >
        <span><MapPin size={18} /></span>
        <span>
          <small>Retrouvez-nous</small>
          <strong>{location}</strong>
          <small className="contact-location-action">
            {pending ? "Recherche de votre position…" : "Itinéraire depuis votre position"}
          </small>
        </span>
        <ArrowUpRight size={17} aria-hidden="true" />
      </a>
      {error && <p className="contact-location-error" role="alert">{error}</p>}
    </>
  );
}
