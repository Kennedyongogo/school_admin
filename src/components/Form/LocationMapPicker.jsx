import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { Box, TextField, Autocomplete, CircularProgress, Typography, Paper, IconButton } from "@mui/material";
import { Map as MapIcon, SatelliteAlt, Terrain, Search } from "@mui/icons-material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

  // Search for locations using Nominatim (OpenStreetMap geocoding)
  const searchLocations = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchOptions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Safari-Admin/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const options = data.map(item => ({
          label: item.display_name,
          value: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type,
          importance: item.importance
        }));
        setSearchOptions(options);
      }
    } catch (error) {
      console.error("Error searching locations:", error);
      setSearchOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search input change
  const handleSearchInputChange = (event, newInputValue, reason) => {
    setSearchQuery(newInputValue);

    // Debounce search requests
    if (reason === 'input') {
      const timeoutId = setTimeout(() => {
        searchLocations(newInputValue);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
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

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, color: "#666" }}>
        Search for any location worldwide or click directly on the map
      </Typography>

      {/* Global Location Search */}
      <Box sx={{ mb: 2 }}>
        <Autocomplete
          disablePortal
          options={searchOptions}
          getOptionLabel={(option) => {
            if (typeof option === "string") return option;
            return option.label || String(option);
          }}
          loading={loading}
          value={null}
          inputValue={searchQuery}
          onInputChange={handleSearchInputChange}
          onChange={handleLocationSelect}
          noOptionsText={searchQuery.length < 2 ? "Type at least 2 characters to search" : "No locations found"}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Location Worldwide"
              placeholder="Search for cities, landmarks, addresses..."
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : <Search />}
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
            const label = option.label || String(option);
            return (
              <Box component="li" {...props} key={label} sx={{ py: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  {label}
                </Typography>
              </Box>
            );
          }}
          ListboxProps={{
            style: {
              maxHeight: '300px',
            }
          }}
          sx={{
            '& .MuiAutocomplete-listbox': {
              '& .MuiAutocomplete-option': {
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.08)',
                },
              },
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

