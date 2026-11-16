"use client";

import { useState } from "react";
import { MapPin, RotateCcw } from "lucide-react";

function getLocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "Autorisez la géolocalisation dans votre navigateur pour enregistrer la position de DATASYS.";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "La position GPS n’a pas pu être déterminée. Vérifiez le GPS ou la connexion.";
  }
  return "La localisation a pris trop de temps. Réessayez.";
}

export function AdminSiteLocationPicker({
  latitude,
  longitude,
}: {
  latitude: string;
  longitude: string;
}) {
  const [coordinates, setCoordinates] = useState({ latitude, longitude });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function captureLocation() {
    setError("");
    setMessage("");
    if (!navigator.geolocation) {
      setError("La géolocalisation n’est pas prise en charge par ce navigateur.");
      return;
    }

    setPending(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({
          latitude: coords.latitude.toString(),
          longitude: coords.longitude.toString(),
        });
        setMessage("Position capturée. Enregistrez les personnalisations pour la sauvegarder.");
        setPending(false);
      },
      (locationError) => {
        setError(getLocationErrorMessage(locationError));
        setPending(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  function clearLocation() {
    setCoordinates({ latitude: "", longitude: "" });
    setError("");
    setMessage("Coordonnées retirées. Enregistrez les personnalisations pour confirmer.");
  }

  return (
    <div className="site-location-picker site-settings-wide">
      <input type="hidden" name="locationLatitude" value={coordinates.latitude} />
      <input type="hidden" name="locationLongitude" value={coordinates.longitude} />
      <div>
        <strong>Position GPS de DATASYS</strong>
        <small>
          {coordinates.latitude && coordinates.longitude
            ? `Enregistrée : ${coordinates.latitude}, ${coordinates.longitude}`
            : "Aucune position GPS enregistrée. L’adresse textuelle sera utilisée."}
        </small>
      </div>
      <div className="site-location-picker-actions">
        <button className="button button-light" type="button" onClick={captureLocation} disabled={pending}>
          <MapPin size={15} />
          {pending ? "Localisation en cours…" : "Utiliser ma position actuelle"}
        </button>
        {Boolean(coordinates.latitude || coordinates.longitude) && (
          <button className="button button-light" type="button" onClick={clearLocation}>
            <RotateCcw size={15} /> Retirer la position GPS
          </button>
        )}
      </div>
      {error && <p className="form-feedback error" role="alert">{error}</p>}
      {message && <p className="form-feedback success" role="status">{message}</p>}
    </div>
  );
}
