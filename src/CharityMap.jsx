import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  IconButton,
  Typography,
  Drawer,
  Tabs,
  Tab,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Backdrop,
  Tooltip,
  Checkbox,
  Fade,
  Collapse,
  TextField,
  InputAdornment,
  Chip,
  Paper,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import { defaults as defaultControls, ScaleLine } from "ol/control";
import XYZ from "ol/source/XYZ";
import MapIcon from "@mui/icons-material/Map";
import SatelliteAltIcon from "@mui/icons-material/SatelliteAlt";
import TerrainIcon from "@mui/icons-material/Terrain";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Style, Icon } from "ol/style";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import LocationSearchingIcon from "@mui/icons-material/LocationSearching";

const CharityMap = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [baseLayer, setBaseLayer] = useState("osm");
  const [showMarker, setShowMarker] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const vectorLayerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tileLoadError, setTileLoadError] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mkProjects, setMkProjects] = useState([]);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });

  const [visibleCategories, setVisibleCategories] = useState({});

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchColumn, setSearchColumn] = useState("all");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Geolocation states
  const [userLocation, setUserLocation] = useState(null);
  const [nearMeMode, setNearMeMode] = useState(false);
  const [nearMeRadius, setNearMeRadius] = useState(10); // km
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [nearMeResults, setNearMeResults] = useState([]);

  // Use proxy path instead of direct API URL
  const API_BASE_URL = "/api";

  // Distance calculation utility (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  // Get user's current location
  const getUserLocation = (callback) => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setIsGettingLocation(false);
        setLocationError(null);
        // Call callback if provided (for near me functionality)
        if (callback) {
          callback();
        }
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  // Find MK projects near user location
  const findNearMeProjects = () => {
    if (!userLocation) {
      getUserLocation(() => {
        // This callback will be called after location is obtained
        performNearMeSearch();
      });
      return;
    }

    performNearMeSearch();
  };

  // Helper function to perform the actual near me search
  const performNearMeSearch = () => {
    if (!userLocation) return;

    const dataToSearch =
      searchResults.length > 0 ? searchResults : mkProjects;

    console.log("Performing near me search with:", {
      userLocation,
      dataToSearchLength: dataToSearch.length,
      nearMeRadius,
    });

    const nearbyProjects = dataToSearch
      .filter((project) => {
        const hasValidCoords =
          project.longitude !== null && project.latitude !== null;
        if (!hasValidCoords) {
          console.log("Project missing coordinates:", project.name, {
            longitude: project.longitude,
            latitude: project.latitude,
          });
        }
        return hasValidCoords;
      })
      .map((project) => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          parseFloat(project.latitude),
          parseFloat(project.longitude)
        );
        return { ...project, distance };
      })
      .filter((project) => project.distance <= nearMeRadius)
      .sort((a, b) => a.distance - b.distance);

    console.log("Near me results:", nearbyProjects);

    setNearMeResults(nearbyProjects);
    setNearMeMode(true);
  };

  // Center map on user location
  const centerOnUserLocation = () => {
    if (userLocation && mapInstance.current) {
      const map = mapInstance.current;
      const view = map.getView();
      view.setCenter(
        fromLonLat([userLocation.longitude, userLocation.latitude])
      );
      view.setZoom(12);
    }
  };

  // Create map instance only once
  useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      const osmLayer = new TileLayer({
        source: new OSM({
          preload: 4,
          crossOrigin: "anonymous",
        }),
        visible: true,
        title: "osm",
        opacity: 1,
        zIndex: 0,
      });

      const satelliteLayer = new TileLayer({
        source: new XYZ({
          url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
          maxZoom: 20,
          attributions: "© Google Maps",
          preload: 4,
          crossOrigin: "anonymous",
        }),
        visible: false,
        title: "satellite",
        opacity: 1,
        zIndex: 0,
      });

      const terrainLayer = new TileLayer({
        source: new XYZ({
          url: "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
          maxZoom: 24,
          preload: 4,
          crossOrigin: "anonymous",
        }),
        visible: false,
        title: "terrain",
        opacity: 1,
        zIndex: 0,
      });

      // Create vector source and layer for polling stations
      const vectorSource = new VectorSource();
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        visible: showMarker,
      });
      vectorLayerRef.current = vectorLayer;

      const map = new Map({
        target: mapRef.current,
        layers: [osmLayer, satelliteLayer, terrainLayer, vectorLayer],
        view: new View({
          center: fromLonLat([36.7758, -1.2921]), // Center near Nairobi, Kenya where the construction project is
          zoom: 10, // Closer view to see the construction project
        }),
        controls: defaultControls().extend([new ScaleLine()]),
      });

      // Click interaction will be handled in the application-specific useEffect

      mapInstance.current = map;
      setMapInitialized(true);
    }
    // Cleanup only on unmount
    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(undefined);
        mapInstance.current = null;
      }
    };
  }, []);

  // Removed hospital fetching - focusing only on applications

  // Removed hospital markers - focusing only on applications

  // Update marker visibility when showMarker changes
  useEffect(() => {
    if (!mapInstance.current || !mapInitialized) return;
    if (vectorLayerRef.current) {
      vectorLayerRef.current.setVisible(showMarker);
    }
  }, [showMarker, mapInitialized]);

  const searchCharityProjects = async (query, column) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const q = (query || "").trim();
      if (!q) {
        setSearchResults([]);
        return [];
      }
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ search: q, column: column || "all" });
      const res = await fetch(`${API_BASE_URL}/map/locations?${params}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.success && Array.isArray(result.data)) {
        setSearchResults(result.data);
        return result.data;
      }
      setSearchResults([]);
      return [];
    } catch (error) {
      setSearchError(error?.message || "Search failed");
      setSearchResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch MK map locations (projects, training events, marketplace users)
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/map/locations`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (res.ok && result.success && Array.isArray(result.data)) {
          const locations = result.data;
          setMkProjects(locations);
          const keys = {};
          locations.forEach((item) => {
            const key =
              item.source === "marketplace_user"
                ? `marketplace_user:${item.category}`
                : item.source;
            if (!(key in keys)) keys[key] = true;
          });
          setVisibleCategories(keys);
        } else {
          setMkProjects([]);
        }
      } catch (error) {
        setMkProjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocations();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchCharityProjects(searchQuery, searchColumn);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchColumn]);

  // Auto-zoom to search results when search results change
  useEffect(() => {
    if (searchResults.length > 0 && mapInstance.current && mapInitialized) {
      const map = mapInstance.current;
      const view = map.getView();

      // Calculate bounds for all search results
      const coordinates = searchResults
        .filter((project) => project.longitude && project.latitude)
        .map((project) => [
          parseFloat(project.longitude),
          parseFloat(project.latitude),
        ]);

      if (coordinates.length > 0) {
        if (coordinates.length === 1) {
          // Single result - zoom to it
          view.setCenter(fromLonLat(coordinates[0]));
          view.setZoom(15);
        } else {
          // Multiple results - fit all in view
          const extent = coordinates.reduce(
            (extent, coord) => {
              const [lon, lat] = coord;
              return [
                Math.min(extent[0], lon),
                Math.min(extent[1], lat),
                Math.max(extent[2], lon),
                Math.max(extent[3], lat),
              ];
            },
            [Infinity, Infinity, -Infinity, -Infinity]
          );

          // Add some padding to the extent
          const padding = 0.01; // degrees
          const paddedExtent = [
            extent[0] - padding,
            extent[1] - padding,
            extent[2] + padding,
            extent[3] + padding,
          ];

          view.fit(fromLonLat(paddedExtent), {
            padding: [50, 50, 50, 50],
            duration: 1000,
          });
        }
      }
    }
  }, [searchResults, mapInitialized]);

  // Auto-update near me results when radius changes
  useEffect(() => {
    if (nearMeMode && userLocation) {
      performNearMeSearch();
    }
  }, [nearMeRadius]);

  // Handle navigation from ProjectView to center on specific project
  useEffect(() => {
    if (location.state?.centerCoordinates && mapInstance.current) {
      const [longitude, latitude] = location.state.centerCoordinates;
      const view = mapInstance.current.getView();
      view.setCenter(fromLonLat([longitude, latitude]));
      view.setZoom(15); // Zoom in closer for specific project

      // Clear the state to prevent re-centering on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, mapInstance.current, navigate, location.pathname]);

  // Add hover interaction for tooltips
  useEffect(() => {
    if (!mapInstance.current || !mapInitialized) return;
    const map = mapInstance.current;

    const handlePointerMove = (event) => {
      const feature = map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => feature
      );

      if (feature) {
        const properties = feature.get("properties");
        const featureType = properties?.type;

        if (featureType === "mkProject") {
          // Show tooltip for MK projects
          const coordinate = event.coordinate;
          const pixel = map.getPixelFromCoordinate(coordinate);
          setTooltip({
            visible: true,
            content: properties.name || "No name",
            x: pixel[0] + 10,
            y: pixel[1] - 10,
          });
          map.getTarget().style.cursor = "pointer";
        } else {
          // Hide tooltip
          setTooltip({ visible: false, content: "", x: 0, y: 0 });
          map.getTarget().style.cursor = "";
        }
      } else {
        // Hide tooltip
        setTooltip({ visible: false, content: "", x: 0, y: 0 });
        map.getTarget().style.cursor = "";
      }
    };

    const handlePointerLeave = () => {
      setTooltip({ visible: false, content: "", x: 0, y: 0 });
      map.getTarget().style.cursor = "";
    };

    map.on("pointermove", handlePointerMove);
    map.on("pointerleave", handlePointerLeave);

    return () => {
      map.un("pointermove", handlePointerMove);
      map.un("pointerleave", handlePointerLeave);
    };
  }, [mapInitialized]);

  // Add click interaction for projects
  useEffect(() => {
    if (!mapInstance.current || !mapInitialized) return;
    const map = mapInstance.current;

    const handleClick = (event) => {
      const feature = map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => feature
      );

      if (feature) {
        const properties = feature.get("properties");
        const featureType = properties?.type;

        if (featureType === "mkProject") {
          // Show project details in drawer
          setSelectedProjectDetails(properties);
          setDrawerOpen(true);
        }
      }
    };

    map.on("click", handleClick);

    return () => {
      map.un("click", handleClick);
    };
  }, [mapInitialized, navigate]);

  const SOURCE_COLORS = {
    project: "#4caf50",
    training_event: "#2196f3",
    marketplace_user: "#9c27b0",
  };

  const USER_ROLE_COLORS = {
    Farmer: "#2e7d32",
    Veterinarian: "#1565c0",
    "Input Supplier": "#ef6c00",
    Buyer: "#7b1fa2",
    Consultant: "#00838f",
  };

  const getVisibilityKey = (item) =>
    item.source === "marketplace_user"
      ? `marketplace_user:${item.category}`
      : item.source;

  const getMarkerSvg = (source, category, isSearchResult = false) => {
    const strokeWidth = isSearchResult ? 3 : 2;
    const sw = strokeWidth;
    const ring = isSearchResult
      ? `<circle cx="14" cy="14" r="16" fill="none" stroke="#ff9800" stroke-width="2" opacity="0.7"/>`
      : "";

    if (source === "project") {
      const color = SOURCE_COLORS.project;
      return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">${ring}
        <path d="M16 4L4 10v12l12 6 12-6V10L16 4z" fill="${color}" stroke="white" stroke-width="${sw}"/>
        <path d="M16 8v16M8 12l8 4 8-4M8 16l8 4 8-4" stroke="white" stroke-width="1" opacity="0.8"/>
      </svg>`;
    }

    if (source === "training_event") {
      const color = SOURCE_COLORS.training_event;
      return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">${ring}
        <rect x="4" y="6" width="24" height="20" rx="2" fill="${color}" stroke="white" stroke-width="${sw}"/>
        <path d="M4 12h24M10 6v4M16 6v4M22 6v4" stroke="white" stroke-width="1"/>
      </svg>`;
    }

    if (source === "marketplace_user") {
      const color = USER_ROLE_COLORS[category] || SOURCE_COLORS.marketplace_user;
      const role = (category || "").toLowerCase();
      if (role.includes("farmer")) {
        return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">${ring}
          <path d="M16 6c-4 0-6 3-6 6v2h2l-2 8h4v-6h4v6h4l-2-8h2v-2c0-3-2-6-6-6z" fill="${color}" stroke="white" stroke-width="${sw}"/>
          <ellipse cx="16" cy="10" rx="3" ry="2" fill="white" opacity="0.9"/>
        </svg>`;
      }
      if (role.includes("veterinarian") || role.includes("vet")) {
        return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">${ring}
          <path d="M16 4l-4 8h3v10h2V12h2v10h2V12h3L16 4z" fill="${color}" stroke="white" stroke-width="${sw}"/>
          <circle cx="16" cy="18" r="4" fill="white" opacity="0.9"/>
        </svg>`;
      }
      if (role.includes("input") || role.includes("supplier")) {
        return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">${ring}
          <path d="M8 10h4v12H8zM14 8h4v14h-4zM20 12h4v10h-4z" fill="${color}" stroke="white" stroke-width="${sw}"/>
        </svg>`;
      }
      if (role.includes("buyer")) {
        return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">${ring}
          <circle cx="16" cy="12" r="5" fill="${color}" stroke="white" stroke-width="${sw}"/>
          <path d="M8 28l2-10h12l2 10" fill="${color}" stroke="white" stroke-width="${sw}"/>
        </svg>`;
      }
      if (role.includes("consultant")) {
        return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">${ring}
          <circle cx="16" cy="10" r="6" fill="${color}" stroke="white" stroke-width="${sw}"/>
          <path d="M8 28c0-4 3.5-8 8-8s8 4 8 8" fill="${color}" stroke="white" stroke-width="${sw}"/>
        </svg>`;
      }
      return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">${ring}
        <circle cx="16" cy="10" r="6" fill="${color}" stroke="white" stroke-width="${sw}"/>
        <path d="M8 28c0-4 3.5-8 8-8s8 4 8 8" fill="${color}" stroke="white" stroke-width="${sw}"/>
      </svg>`;
    }

    const c = SOURCE_COLORS[source] || "#666";
    return `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">${ring}
      <path d="M14 2C8.48 2 4 6.48 4 12c0 7 10 14 10 14s10-7 10-14c0-5.52-4.48-10-10-10z" fill="${c}" stroke="white" stroke-width="${sw}"/>
      <circle cx="14" cy="12" r="4" fill="white"/>
    </svg>`;
  };

  const createProjectMarkers = (items, isSearchResult = false) => {
    return items
      .filter((item) => {
        if (item.longitude == null || item.latitude == null) return false;
        const key = getVisibilityKey(item);
        return visibleCategories[key] !== false;
      })
      .map((item) => {
        const lon = parseFloat(item.longitude);
        const lat = parseFloat(item.latitude);
        if (isNaN(lon) || isNaN(lat)) return null;

        const feature = new Feature({
          geometry: new Point(fromLonLat([lon, lat])),
          properties: { ...item, type: "mkProject", isSearchResult },
        });

        feature.setStyle(
          new Style({
            image: new Icon({
              src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                getMarkerSvg(item.source, item.category, isSearchResult)
              )}`,
              scale: 1,
              anchor: [0.5, 1],
            }),
          })
        );
        return feature;
      })
      .filter((m) => m !== null);
  };

  // Create user location marker
  const createUserLocationMarker = () => {
    if (!userLocation) return null;

    const feature = new Feature({
      geometry: new Point(
        fromLonLat([userLocation.longitude, userLocation.latitude])
      ),
      properties: {
        type: "userLocation",
      },
    });

    feature.setStyle(
      new Style({
        image: new Icon({
          src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#2196f3" stroke="white" stroke-width="3"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
              <circle cx="16" cy="16" r="3" fill="#2196f3"/>
            </svg>
          `)}`,
          scale: 1,
          anchor: [0.5, 0.5],
        }),
      })
    );
    return feature;
  };

  // Update markers when projects, search results, visible statuses, or near me mode change
  useEffect(() => {
    if (!mapInstance.current || !mapInitialized) return;
    const vectorSource = vectorLayerRef.current.getSource();

    // Clear existing markers
    const existingFeatures = vectorSource.getFeatures();
    const projectFeatures = existingFeatures.filter(
      (f) => f.get("properties")?.type === "mkProject"
    );
    const userLocationFeatures = existingFeatures.filter(
      (f) => f.get("properties")?.type === "userLocation"
    );
    projectFeatures.forEach((f) => vectorSource.removeFeature(f));
    userLocationFeatures.forEach((f) => vectorSource.removeFeature(f));

    // Determine which data to show
    let dataToShow;
    if (nearMeMode && nearMeResults.length > 0) {
      dataToShow = nearMeResults;
    } else if (searchResults.length > 0) {
      dataToShow = searchResults;
    } else {
      dataToShow = mkProjects;
    }

    // Add project markers
    const isSearchResult =
      searchResults.length > 0 && dataToShow === searchResults;
    const projectMarkers = createProjectMarkers(dataToShow, isSearchResult);
    vectorSource.addFeatures(projectMarkers);

    // Add user location marker if available
    const userLocationMarker = createUserLocationMarker();
    if (userLocationMarker) {
      vectorSource.addFeature(userLocationMarker);
    }
  }, [
    mkProjects,
    searchResults,
    mapInitialized,
    visibleCategories,
    nearMeMode,
    nearMeResults,
    userLocation,
  ]);

  const handleBaseLayerChange = (event) => {
    const selectedLayer = event.target.value;
    setBaseLayer(selectedLayer);
    if (mapInstance.current) {
      const layers = mapInstance.current.getLayers();
      layers.forEach((layer) => {
        const layerTitle = layer.get("title");
        if (
          layerTitle === "osm" ||
          layerTitle === "satellite" ||
          layerTitle === "terrain"
        ) {
          layer.setVisible(layerTitle === selectedLayer);
        }
      });
    }
  };

  const handleMarkerToggle = (event) => {
    setShowMarker(event.target.checked);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getCategoryLabel = (key) => {
    if (!key) return "";
    if (key === "project") return "Projects";
    if (key === "training_event") return "Events";
    if (key.startsWith("marketplace_user:")) {
      return `User: ${key.replace("marketplace_user:", "")}`;
    }
    return key;
  };

  const getCategoryColor = (key) => {
    if (!key) return "#666";
    if (key === "project" || key.startsWith("project:")) return SOURCE_COLORS.project;
    if (key === "training_event" || key.startsWith("training_event:")) return SOURCE_COLORS.training_event;
    if (key.startsWith("marketplace_user:")) {
      const role = key.replace("marketplace_user:", "");
      return USER_ROLE_COLORS[role] || SOURCE_COLORS.marketplace_user;
    }
    return "#666";
  };

  // Handle category toggle
  const handleCategoryToggle = (category) => {
    setVisibleCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSelectAll = () => {
    setVisibleCategories((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => (next[k] = true));
      return next;
    });
  };

  const handleDeselectAll = () => {
    setVisibleCategories((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => (next[k] = false));
      return next;
    });
  };

  // Search handlers
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchColumnChange = (event) => {
    setSearchColumn(event.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchColumn("all");
    setSearchResults([]);
    setSearchError(null);
  };

  const clearNearMe = () => {
    setNearMeMode(false);
    setNearMeResults([]);
    setLocationError(null);
    setUserLocation(null); // Clear user location

    // Reset map view to default
    if (mapInstance.current) {
      const view = mapInstance.current.getView();
      view.setCenter(fromLonLat([36.7758, -1.2921])); // Default center near Nairobi, Kenya
      view.setZoom(10); // Default zoom level
    }
  };

  const getCategoryCounts = () => {
    const counts = {};
    let dataToCount =
      nearMeMode && nearMeResults.length > 0
        ? nearMeResults
        : searchResults.length > 0
          ? searchResults
          : mkProjects;

    Object.keys(visibleCategories).forEach((key) => {
      counts[key] = dataToCount.filter(
        (item) =>
          getVisibilityKey(item) === key &&
          item.longitude != null &&
          item.latitude != null
      ).length;
    });
    return counts;
  };

  const categoryCounts = getCategoryCounts();

  return (
    <>
      {/* Search and Filter Controls */}
      <Box
        sx={{
          mb: 0.5,
          p: 1,
          backgroundColor: "#f8f9fa",
          borderRadius: 1,
          border: "1px solid #e0e0e0",
        }}
      >
        {/* MK Map Label and Near Me Controls */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 0.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#4caf50",
              fontSize: "1.1rem",
            }}
          >
            MK Map
          </Typography>

          {/* Near Me Controls */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {/* Near Me Button */}
            <Button
              variant={nearMeMode ? "contained" : "outlined"}
              size="small"
              onClick={findNearMeProjects}
              disabled={isGettingLocation}
              startIcon={
                isGettingLocation ? (
                  <CircularProgress size={16} />
                ) : (
                  <MyLocationIcon />
                )
              }
              sx={{
                minWidth: 120,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: nearMeMode ? "#2196f3" : "transparent",
                borderColor: "#2196f3",
                color: nearMeMode ? "white" : "#2196f3",
                "&:hover": {
                  backgroundColor: nearMeMode ? "#1976d2" : "#e3f2fd",
                  borderColor: "#1976d2",
                },
                "&:disabled": {
                  backgroundColor: "transparent",
                  borderColor: "#ccc",
                  color: "#999",
                },
              }}
            >
              {isGettingLocation ? "Getting Location..." : "Near Me"}
            </Button>

            {/* Radius Input (shown when near me mode is active) */}
            {nearMeMode && (
              <TextField
                size="small"
                type="number"
                label="Radius (km)"
                value={nearMeRadius}
                onChange={(e) =>
                  setNearMeRadius(parseFloat(e.target.value) || 10)
                }
                inputProps={{
                  min: 0.1,
                  max: 1000,
                  step: 0.1,
                }}
                sx={{
                  minWidth: 120,
                  maxWidth: 120,
                  "& .MuiInputBase-root": {
                    fontSize: "0.75rem",
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "0.7rem",
                  },
                }}
              />
            )}

            {/* Center on Location Button */}
            {userLocation && (
              <Button
                variant="outlined"
                size="small"
                onClick={centerOnUserLocation}
                startIcon={<LocationSearchingIcon />}
                sx={{
                  minWidth: 100,
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#4caf50",
                  color: "#4caf50",
                  "&:hover": {
                    backgroundColor: "#e8f5e8",
                    borderColor: "#388e3c",
                  },
                }}
              >
                Center
              </Button>
            )}

            {/* Clear Near Me Button */}
            {nearMeMode && (
              <Button
                variant="outlined"
                size="small"
                onClick={clearNearMe}
                startIcon={<ClearIcon />}
                sx={{
                  minWidth: 100,
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#f44336",
                  color: "#f44336",
                  "&:hover": {
                    backgroundColor: "#ffebee",
                    borderColor: "#d32f2f",
                  },
                }}
              >
                Clear
              </Button>
            )}
          </Box>
        </Box>

        {/* Search Bar Row */}
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            mb: 0,
            justifyContent: "space-between",
          }}
        >
          {/* Left side - Search controls */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search by name, category, or location..."
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{
                width: 350,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={clearSearch}
                      sx={{ p: 0.5 }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Search Column Selector */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Search in</InputLabel>
              <Select
                value={searchColumn}
                onChange={handleSearchColumnChange}
                label="Search in"
              >
                <MenuItem value="all">All Fields</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="category">Category</MenuItem>
                <MenuItem value="location">Location</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Right side - Search Status Indicators */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {/* Search Status Indicators */}
            {isSearching && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  ml: 1,
                }}
              >
                <CircularProgress size={12} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.7rem" }}
                >
                  Searching...
                </Typography>
              </Box>
            )}

            {searchResults.length > 0 && !isSearching && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  ml: 1,
                  px: 1,
                  py: 0.5,
                  backgroundColor: "#e3f2fd",
                  borderRadius: 1,
                  border: "1px solid #2196f3",
                }}
              >
                <Typography variant="caption" color="primary" fontWeight="bold">
                  {searchResults.length} result
                  {searchResults.length !== 1 ? "s" : ""} found
                </Typography>
              </Box>
            )}

            {searchError && (
              <Chip
                label={`Error: ${
                  searchError.length > 15
                    ? searchError.substring(0, 15) + "..."
                    : searchError
                }`}
                color="error"
                size="small"
                onDelete={() => setSearchError(null)}
                sx={{
                  fontSize: "0.7rem",
                  height: "20px",
                  ml: 1,
                }}
              />
            )}

            {searchResults.length > 0 && !nearMeMode && (
              <Chip
                label={`${searchResults.length} results`}
                color="primary"
                size="small"
                variant="outlined"
                sx={{
                  fontSize: "0.7rem",
                  height: "20px",
                  ml: 1,
                }}
              />
            )}

            {nearMeMode && nearMeResults.length > 0 && (
              <Chip
                label={`${nearMeResults.length} projects within ${nearMeRadius}km`}
                color="info"
                size="small"
                variant="outlined"
                sx={{
                  fontSize: "0.7rem",
                  height: "20px",
                  ml: 1,
                }}
              />
            )}

            {locationError && (
              <Chip
                label={`Location: ${
                  locationError.length > 15
                    ? locationError.substring(0, 15) + "..."
                    : locationError
                }`}
                color="error"
                size="small"
                onDelete={() => setLocationError(null)}
                sx={{
                  fontSize: "0.7rem",
                  height: "20px",
                  ml: 1,
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Map Container */}

      <Box
        ref={mapRef}
        sx={{
          width: "100%",
          height: "calc(100vh - 200px)",
          position: "relative",
          "& .ol-zoom": {
            top: "1em",
            left: "1em",
            background: "none",
            border: "none",
            padding: 0,
            "& .ol-zoom-in, & .ol-zoom-out": {
              background: "rgba(255,255,255,0.8)",
              border: "1px solid #ccc",
              borderRadius: "2px",
              margin: "2px",
              width: "28px",
              height: "28px",
              lineHeight: "28px",
            },
          },
          // Remove animations that cause blinking
          "& .ol-layer-animating": {
            transition: "none",
          },
          "& .ol-layer": {
            transition: "none",
          },
          "& .ol-tile": {
            transition: "none",
          },
          "& .ol-tile-loading": {
            opacity: 1,
          },
          "& .ol-tile-loaded": {
            opacity: 1,
          },
          "& .ol-rotate": {
            top: "4.5em",
            right: "auto",
            left: "1em",
            background: "rgba(255,255,255,0.8)",
            border: "1px solid #ccc",
            borderRadius: "2px",
            margin: "2px",
            padding: 0,
            "& button": {
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
          },
        }}
      >
        {/* Tooltip */}
        {tooltip.visible && (
          <Box
            sx={{
              position: "absolute",
              left: tooltip.x,
              top: tooltip.y,
              zIndex: 1000,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "500",
              pointerEvents: "none",
              maxWidth: "200px",
              wordWrap: "break-word",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              "&::after": {
                content: '""',
                position: "absolute",
                top: "100%",
                left: "10px",
                border: "4px solid transparent",
                borderTopColor: "rgba(0, 0, 0, 0.8)",
              },
            }}
          >
            {tooltip.content}
          </Box>
        )}

        {/* Loading indicator positioned on map */}
        {isLoading && (
          <Box
            sx={{
              position: "absolute",
              top: "10px",
              right: "10px",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              gap: 1,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              padding: "4px 8px",
              borderRadius: "4px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <CircularProgress size={20} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Loading...
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            position: "absolute",
            left: "1em",
            top: "7em",
            zIndex: 1000,
            backgroundColor: "rgba(255,255,255,0.8)",
            borderRadius: "2px",
            border: "1px solid #ccc",
            padding: "2px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            width: "40px",
            "& .MuiIconButton-root": {
              padding: "4px",
              borderRadius: "2px",
              height: "40px",
              width: "40px",
            },
          }}
        >
          <IconButton
            sx={{
              backgroundColor: "transparent",
              color: baseLayer === "osm" ? "#2196f3" : "#666",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
            }}
            onClick={() => handleBaseLayerChange({ target: { value: "osm" } })}
          >
            <MapIcon />
          </IconButton>
          <IconButton
            sx={{
              backgroundColor: "transparent",
              color: baseLayer === "satellite" ? "#2196f3" : "#666",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
            }}
            onClick={() =>
              handleBaseLayerChange({ target: { value: "satellite" } })
            }
          >
            <SatelliteAltIcon />
          </IconButton>
          <IconButton
            sx={{
              backgroundColor: "transparent",
              color: baseLayer === "terrain" ? "#2196f3" : "#666",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
            }}
            onClick={() =>
              handleBaseLayerChange({ target: { value: "terrain" } })
            }
          >
            <TerrainIcon />
          </IconButton>
        </Box>

        {/* Legend: MK map categories */}
        <Box
          sx={{
            position: "absolute",
            bottom: 60,
            right: 10,
            zIndex: 1000,
            backgroundColor: "white",
            borderRadius: 1,
            padding: "6px 10px",
            minWidth: "200px",
            maxWidth: "220px",
            boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
            opacity: 0.9,
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: "bold", mb: 0.5, fontSize: "13px" }}
          >
            MK Map Legend
          </Typography>

          {/* Select All / Deselect All Buttons */}
          <Box sx={{ display: "flex", gap: 0.25, mb: 0.5 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleSelectAll}
              sx={{
                fontSize: "9px",
                py: 0.1,
                px: 0.75,
                textTransform: "none",
                borderColor: "#4caf50",
                color: "#4caf50",
                minWidth: "auto",
                height: "20px",
                "&:hover": {
                  backgroundColor: "#e8f5e8",
                  borderColor: "#388e3c",
                },
              }}
            >
              All
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={handleDeselectAll}
              sx={{
                fontSize: "9px",
                py: 0.1,
                px: 0.75,
                textTransform: "none",
                borderColor: "#f44336",
                color: "#f44336",
                minWidth: "auto",
                height: "20px",
                "&:hover": {
                  backgroundColor: "#ffebee",
                  borderColor: "#d32f2f",
                },
              }}
            >
              None
            </Button>
          </Box>

          {/* User Location Marker */}
          {userLocation && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.25,
                mb: 0.5,
                p: 0.25,
                backgroundColor: "#e3f2fd",
                borderRadius: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "#2196f3",
                  mr: 0.5,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#1976d2",
                }}
              >
                Your Location
              </Typography>
            </Box>
          )}

          {/* MK map categories with checkboxes */}
          <Typography
            variant="body2"
            sx={{
              fontSize: "11px",
              fontWeight: "bold",
              mb: 0.25,
              color: "text.secondary",
            }}
          >
            MK Categories
          </Typography>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 0.25, mb: 1 }}
          >
            {Object.entries(visibleCategories).map(
              ([category, isVisible]) => (
                <Box
                  key={category}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.25,
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <Checkbox
                    checked={isVisible}
                    onChange={() => handleCategoryToggle(category)}
                    size="small"
                    sx={{
                      padding: 0.1,
                      "&.Mui-checked": { color: getCategoryColor(category) },
                      "&:hover": {
                        backgroundColor: `${getCategoryColor(category)}20`,
                      },
                    }}
                  />
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: getCategoryColor(category),
                      mr: 0.25,
                      transition: "all 0.2s ease-in-out",
                      opacity: isVisible ? 1 : 0.5,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "10px",
                      fontWeight: isVisible ? 600 : 400,
                      color: isVisible ? "text.primary" : "text.secondary",
                      flexGrow: 1,
                    }}
                  >
                    {getCategoryLabel(category)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "8px",
                      color: "text.secondary",
                      backgroundColor: isVisible ? `${getCategoryColor(category)}20` : "#f5f5f5",
                      px: 0.25,
                      py: 0.05,
                      borderRadius: 0.25,
                      fontWeight: 600,
                      minWidth: "14px",
                      textAlign: "center",
                    }}
                  >
                    {categoryCounts[category] ?? 0}
                  </Typography>
                </Box>
              )
            )}
          </Box>


          {/* Summary */}
          <Box
            sx={{
              mt: 0.5,
              pt: 0.5,
              borderTop: "1px solid #e0e0e0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
                fontSize: "9px",
              }}
            >
              Visible:
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: "bold",
                color: "primary.main",
                fontSize: "9px",
              }}
            >
              {Object.entries(visibleCategories)
                .filter(([_, isVisible]) => isVisible)
                .reduce((sum, [category, _]) => sum + categoryCounts[category], 0)}
            </Typography>
          </Box>
        </Box>

        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            "& .MuiDrawer-paper": {
              width: "420px",
              padding: 0,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              flexDirection: "column",
              height: "100vh",
              position: "fixed",
              top: "64px",
              right: 0,
              border: "none",
              boxShadow: "0px 8px 32px rgba(0,0,0,0.12)",
              borderRadius: "8px 0 0 8px",
              overflow: "hidden",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "calc(100vh - 64px)",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 3,
                borderBottom: 1,
                borderColor: "divider",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative Elements */}
              <Box
                sx={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "50%",
                  zIndex: 0,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: -15,
                  left: -15,
                  width: 80,
                  height: 80,
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "50%",
                  zIndex: 0,
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, fontSize: "1.1rem" }}
                >
                  Location Details
                </Typography>
                <IconButton
                  onClick={() => setDrawerOpen(false)}
                  sx={{
                    color: "white",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              {selectedProjectDetails && (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    opacity: 0.9,
                    fontSize: "0.9rem",
                  }}
                >
                  {selectedProjectDetails?.name}
                </Typography>
              )}
            </Box>

            {/* Tabs */}
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                backgroundColor: "#f8f9fa",
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  minHeight: "56px",
                  "&.Mui-selected": {
                    color: "#667eea",
                    fontWeight: 600,
                  },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#667eea",
                  height: 3,
                  borderRadius: "2px 2px 0 0",
                },
              }}
            >
              <Tab
                icon={<InfoIcon fontSize="small" />}
                label="Basic Info"
                sx={{ minHeight: "56px" }}
              />
              <Tab
                icon={<LocationOnIcon fontSize="small" />}
                label="Location"
                sx={{ minHeight: "56px" }}
              />
            </Tabs>

            {/* Content Area */}
            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                p: 3,
                backgroundColor: "#fafafa",
              }}
            >
              {selectedProjectDetails ? (
                <>
                  {tabValue === 0 && (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            mb: 1,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Name
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 500, color: "text.primary" }}
                        >
                          {selectedProjectDetails.name}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            mb: 1,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Type
                        </Typography>
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            px: 2,
                            py: 0.5,
                            borderRadius: 3,
                            backgroundColor: `${getCategoryColor(
                              selectedProjectDetails.source
                                ? `${selectedProjectDetails.source}:${selectedProjectDetails.category}`
                                : ""
                            )}20`,
                            color: getCategoryColor(
                              selectedProjectDetails.source
                                ? `${selectedProjectDetails.source}:${selectedProjectDetails.category}`
                                : ""
                            ),
                            fontWeight: 600,
                            fontSize: "0.85rem",
                          }}
                        >
                          {selectedProjectDetails.source === "project"
                            ? "Project"
                            : selectedProjectDetails.source === "training_event"
                              ? "Training / Event"
                              : selectedProjectDetails.source === "marketplace_user"
                                ? "Marketplace User"
                                : selectedProjectDetails.source || "-"}
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            mb: 1,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Category
                        </Typography>
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            px: 2,
                            py: 0.5,
                            borderRadius: 3,
                            backgroundColor: `${getCategoryColor(
                              selectedProjectDetails.source
                                ? `${selectedProjectDetails.source}:${selectedProjectDetails.category}`
                                : ""
                            )}20`,
                            color: getCategoryColor(
                              selectedProjectDetails.source
                                ? `${selectedProjectDetails.source}:${selectedProjectDetails.category}`
                                : ""
                            ),
                            fontWeight: 600,
                            fontSize: "0.85rem",
                          }}
                        >
                          {selectedProjectDetails.category || "-"}
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            mb: 1,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Description
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 500, color: "text.primary" }}
                        >
                          {selectedProjectDetails.description || "-"}
                        </Typography>
                      </Box>

                      {/* Distance from user location */}
                      {userLocation &&
                        selectedProjectDetails.distance !== undefined && (
                          <Box
                            sx={{
                              p: 2,
                              backgroundColor: "white",
                              borderRadius: 2,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                              border: "1px solid #e0e0e0",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{
                                color: "text.secondary",
                                mb: 1,
                                fontSize: "0.8rem",
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              Distance from You
                            </Typography>
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                px: 2,
                                py: 0.5,
                                borderRadius: 3,
                                backgroundColor: "#e3f2fd",
                                color: "#1976d2",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                              }}
                            >
                              <LocationOnIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              {selectedProjectDetails.distance.toFixed(1)} km
                            </Box>
                          </Box>
                        )}
                    </Box>
                  )}
                  {tabValue === 1 && (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            mb: 1,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Location
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 500, color: "text.primary" }}
                        >
                          {selectedProjectDetails.location || "-"}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            mb: 1,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Coordinates
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary", display: "block" }}
                            >
                              Latitude
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                color: "text.primary",
                                fontFamily: "monospace",
                              }}
                            >
                              {selectedProjectDetails.latitude || "-"}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary", display: "block" }}
                            >
                              Longitude
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                color: "text.primary",
                                fontFamily: "monospace",
                              }}
                            >
                              {selectedProjectDetails.longitude || "-"}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "200px",
                    textAlign: "center",
                    p: 3,
                  }}
                >
                  <InfoIcon
                    sx={{
                      fontSize: 48,
                      color: "text.secondary",
                      mb: 2,
                      opacity: 0.5,
                    }}
                  />
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ mb: 1, fontWeight: 500 }}
                  >
                    No Item Selected
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ opacity: 0.7 }}
                  >
                    Click on a marker on the map to view details
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Bottom Button */}
            <Box
              sx={{
                p: 3,
                borderTop: 1,
                borderColor: "divider",
                marginTop: "auto",
                backgroundColor: "white",
                boxShadow: "0 -2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  if (selectedProjectDetails?.id) {
                    navigate(`/projects/${selectedProjectDetails.id}`);
                  }
                }}
                sx={{
                  py: 1.5,
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                View Full Details
              </Button>
            </Box>
          </Box>
        </Drawer>
      </Box>
    </>
  );
};

export default CharityMap;
