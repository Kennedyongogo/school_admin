import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { Box, TextField, Autocomplete, CircularProgress, Paper, IconButton, Typography } from "@mui/material";
import { Map as MapIcon, SatelliteAlt, Terrain, Search, LocationOn } from "@mui/icons-material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const SEARCH_DEBOUNCE_MS = 400;
const MIN_SEARCH_LENGTH = 2;
const MAX_RESULTS = 10;

// Build a readable label from Photon or Nominatim result
function buildLocationLabel(option) {
  if (typeof option === "string") return option;
  if (option.label) return option.label;
  if (option.properties) {
    const p = option.properties;
    const parts = [p.name, p.city, p.state, p.country].filter(Boolean);
    return parts.length ? parts.join(", ") : "Unnamed place";
  }
  return String(option);
}

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Component to handle map click events
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Component to handle map view changes
function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);
  return null;
}

const LocationMapPicker = ({
  latitude,
  longitude,
  onLocationChange
}) => {
  const [mapCenter, setMapCenter] = useState([0, 0]); // Default: World center
  const [mapZoom, setMapZoom] = useState(2);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOptions, setSearchOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapView, setMapView] = useState("osm"); // "osm", "satellite", "terrain"
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  // Worldwide search: Photon (primary, fast & global) then Nominatim (fallback)
  const searchLocations = useCallback(async (query) => {
    const q = (query || "").trim();
    if (q.length < MIN_SEARCH_LENGTH) {
      setSearchOptions([]);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setSearchOptions([]);

    try {
      // 1) Photon API – worldwide, no key, typo-tolerant, good UX
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=${MAX_RESULTS}&lang=en`;
      const photonRes = await fetch(photonUrl, {
        signal: abortRef.current.signal,
        headers: { Accept: "application/json" },
      });
      if (photonRes.ok) {
        const photonData = await photonRes.json();
        const features = photonData.features || [];
        if (features.length > 0) {
          const options = features.map((f) => {
            const [lon, lat] = f.geometry?.coordinates || [0, 0];
            const p = f.properties || {};
            const label = [p.name, p.city, p.state, p.country].filter(Boolean).join(", ") || "Unnamed place";
            return {
              label,
              value: label,
              lat: Number(lat),
              lon: Number(lon),
              source: "photon",
              properties: p,
            };
          });
          setSearchOptions(options);
          return;
        }
      }
    } catch (e) {
      if (e.name === "AbortError") return;
      console.warn("Photon search failed, trying Nominatim:", e);
    }

    try {
      // 2) Fallback: Nominatim (OpenStreetMap) – worldwide
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=${MAX_RESULTS}&addressdetails=1`;
      const nomRes = await fetch(nominatimUrl, {
        signal: abortRef.current?.signal,
        headers: { "User-Agent": "MK-Admin-LocationPicker/1.0 (https://github.com)" },
      });
      if (nomRes.ok) {
        const data = await nomRes.json();
        const options = (data || []).map((item) => ({
          label: item.display_name,
          value: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          source: "nominatim",
        }));
        setSearchOptions(options);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Location search error:", err);
      setSearchOptions([]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, []);

  // Debounced search on input
  const handleSearchInputChange = (event, newInputValue, reason) => {
    setSearchQuery(newInputValue);
    if (reason !== "input") return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (newInputValue.trim().length < MIN_SEARCH_LENGTH) {
      setSearchOptions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      searchLocations(newInputValue);
      debounceRef.current = null;
    }, SEARCH_DEBOUNCE_MS);
  };

  // Handle location selection from search
  const handleLocationSelect = (event, value) => {
    if (value && value.lat && value.lon) {
      const lat = value.lat;
      const lon = value.lon;

      setMarkerPosition([lat, lon]);
      setMapCenter([lat, lon]);
      setMapZoom(13);

      if (onLocationChange) {
        onLocationChange(lat.toString(), lon.toString());
      }
    }
  };

  // Handle map click
  const handleMapClick = (latlng) => {
    try {
      if (latlng && latlng.lat && latlng.lng) {
        setMarkerPosition([latlng.lat, latlng.lng]);
        setSearchQuery(""); // Clear search when clicking on map
        setSearchOptions([]);
        if (onLocationChange) {
          onLocationChange(latlng.lat.toString(), latlng.lng.toString());
        }
      }
    } catch (error) {
      console.error("Error handling map click:", error);
    }
  };

  // Initialize marker position if coordinates exist
  useEffect(() => {
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMarkerPosition([lat, lng]);
        setMapCenter([lat, lng]);
        setMapZoom(13);
      }
    }
  }, [latitude, longitude]);

  // Cleanup debounce on unmount
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, color: "#666" }}>
        Search any place worldwide (cities, addresses, landmarks) or click on the map
      </Typography>

      {/* Worldwide location search */}
      <Box sx={{ mb: 2 }}>
        <Autocomplete
          freeSolo={false}
          disablePortal
          options={searchOptions}
          getOptionLabel={(option) => buildLocationLabel(option)}
          loading={loading}
          value={null}
          inputValue={searchQuery}
          onInputChange={handleSearchInputChange}
          onChange={handleLocationSelect}
          noOptionsText={
            searchQuery.trim().length < MIN_SEARCH_LENGTH
              ? `Type at least ${MIN_SEARCH_LENGTH} characters to search`
              : loading
                ? "Searching..."
                : "No places found. Try another name or click on the map."
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search location worldwide"
              placeholder="e.g. Nairobi, Paris, Mount Kenya, Times Square..."
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : <Search color="action" />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "transparent",
                },
              }}
            />
          )}
          renderOption={(props, option) => {
            const label = buildLocationLabel(option);
            const sub = option.lat != null && option.lon != null
              ? `${option.lat.toFixed(4)}°, ${option.lon.toFixed(4)}°`
              : null;
            return (
              <Box component="li" {...props} key={`${option.lat}-${option.lon}-${label}`} sx={{ py: 1.25, px: 2 }}>
                <LocationOn sx={{ mr: 1.5, color: "action.active", fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {label}
                  </Typography>
                  {sub && (
                    <Typography variant="caption" color="text.secondary">
                      {sub}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          }}
          ListboxProps={{
            style: { maxHeight: 320 },
          }}
          sx={{
            "& .MuiAutocomplete-option": {
              "&:hover": { backgroundColor: "rgba(107, 78, 61, 0.08)" },
              "&[aria-selected='true']": { backgroundColor: "rgba(107, 78, 61, 0.12)" },
            },
          }}
        />
      </Box>

      {/* Map */}
      <Paper
        elevation={2}
        sx={{
          width: "100%",
          height: "400px",
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid #e0e0e0",
          position: "relative",
        }}
      >
        {typeof window !== "undefined" && (
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            scrollWheelZoom={true}
            key={`map-${mapCenter[0]}-${mapCenter[1]}`}
          >
            {/* OSM Layer */}
            {mapView === "osm" && (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}
            
            {/* Satellite Layer */}
            {mapView === "satellite" && (
              <TileLayer
                attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                maxZoom={20}
              />
            )}
            
            {/* Terrain Layer */}
            {mapView === "terrain" && (
              <TileLayer
                attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                maxZoom={17}
              />
            )}
            
            <MapViewUpdater center={mapCenter} zoom={mapZoom} />
            <MapClickHandler onMapClick={handleMapClick} />
            {markerPosition && Array.isArray(markerPosition) && markerPosition.length === 2 && (
              <Marker position={markerPosition} />
            )}
          </MapContainer>
        )}
        
        {/* Map View Switcher */}
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 1000,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: 1,
            border: "1px solid #ccc",
            padding: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <IconButton
            size="small"
            sx={{
              backgroundColor: mapView === "osm" ? "rgba(33, 150, 243, 0.1)" : "transparent",
              color: mapView === "osm" ? "#2196f3" : "#666",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
              padding: "8px",
              minWidth: "40px",
              minHeight: "40px",
            }}
            onClick={() => setMapView("osm")}
            title="OpenStreetMap View"
          >
            <MapIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            sx={{
              backgroundColor: mapView === "satellite" ? "rgba(33, 150, 243, 0.1)" : "transparent",
              color: mapView === "satellite" ? "#2196f3" : "#666",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
              padding: "8px",
              minWidth: "40px",
              minHeight: "40px",
            }}
            onClick={() => setMapView("satellite")}
            title="Satellite View"
          >
            <SatelliteAlt fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            sx={{
              backgroundColor: mapView === "terrain" ? "rgba(33, 150, 243, 0.1)" : "transparent",
              color: mapView === "terrain" ? "#2196f3" : "#666",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
              padding: "8px",
              minWidth: "40px",
              minHeight: "40px",
            }}
            onClick={() => setMapView("terrain")}
            title="Terrain View"
          >
            <Terrain fontSize="small" />
          </IconButton>
        </Box>
      </Paper>

      {/* Instructions */}
      <Typography variant="caption" sx={{ mt: 1, color: "#999", display: "block" }}>
        💡 Tip: Search for any location worldwide (cities, landmarks, addresses) or click directly on the map to set coordinates. The location will be marked with a pin.
      </Typography>
    </Box>
  );
};

export default LocationMapPicker;

