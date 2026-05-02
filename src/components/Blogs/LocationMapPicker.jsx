import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { Box, TextField, Autocomplete, CircularProgress, Typography, Paper, IconButton } from "@mui/material";
import { Map as MapIcon, SatelliteAlt, Terrain } from "@mui/icons-material";
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
  county, 
  subcounty, 
  latitude, 
  longitude, 
  onCountyChange, 
  onSubcountyChange, 
  onLocationChange 
}) => {
  const [mapCenter, setMapCenter] = useState([-1.2921, 36.8219]); // Default: Nairobi, Kenya
  const [mapZoom, setMapZoom] = useState(6);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [subcountyOptions, setSubcountyOptions] = useState([]);
  const [allSubcountyOptions, setAllSubcountyOptions] = useState([]);
  const [loadingCounty, setLoadingCounty] = useState(false);
  const [loadingSubcounty, setLoadingSubcounty] = useState(false);
  const [countyInput, setCountyInput] = useState(county || "");
  const [subcountyInput, setSubcountyInput] = useState(subcounty || "");
  const [mapView, setMapView] = useState("osm"); // "osm", "satellite", "terrain"

  // Kenya counties to subcounties mapping with center coordinates
  const countySubcountyMap = {
    "Baringo": {
      "Baringo Central": [-0.4667, 35.9833],
      "Baringo North": [0.5167, 36.0167],
      "Baringo South": [-0.2833, 35.9167],
      "Eldama Ravine": [0.0500, 35.7167],
      "Mogotio": [-0.0833, 35.8500],
      "Tiaty": [0.7500, 36.0833]
    },
    "Bomet": {
      "Bomet Central": [-0.7833, 35.3333],
      "Bomet East": [-0.7167, 35.4000],
      "Chepalungu": [-0.8500, 35.2500],
      "Konoin": [-0.9167, 35.1667],
      "Sotik": [-0.6833, 35.1167]
    },
    "Bungoma": {
      "Bungoma Central": [0.5667, 34.5667],
      "Bungoma East": [0.6167, 34.6167],
      "Bungoma North": [0.7167, 34.6667],
      "Bungoma South": [0.5167, 34.5167],
      "Bungoma West": [0.4667, 34.4667],
      "Kanduyi": [0.5667, 34.5667],
      "Tongaren": [0.6667, 34.7167],
      "Webuye East": [0.6167, 34.7667],
      "Webuye West": [0.5667, 34.8167]
    },
    "Busia": {
      "Bunyala": [0.1167, 34.0167],
      "Butula": [0.0833, 34.0833],
      "Funyula": [0.0500, 34.1500],
      "Matayos": [0.5167, 34.0833],
      "Nambale": [0.4500, 34.0167],
      "Teso North": [0.3833, 34.1500],
      "Teso South": [0.3167, 34.2167]
    },
    "Elgeyo-Marakwet": {
      "Keiyo North": [0.5167, 35.5167],
      "Keiyo South": [0.4500, 35.4500],
      "Marakwet East": [0.3833, 35.3833],
      "Marakwet West": [0.3167, 35.3167]
    },
    "Embu": {
      "Manyatta": [-0.5333, 37.4500],
      "Mbeere North": [-0.6167, 37.5167],
      "Mbeere South": [-0.6833, 37.5833],
      "Runyenjes": [-0.4667, 37.3833]
    },
    "Garissa": {
      "Balambala": [-0.4667, 39.6333],
      "Dadaab": [0.0500, 40.3167],
      "Fafi": [0.1167, 40.3833],
      "Garissa Township": [-0.4667, 39.6333],
      "Hulugho": [-0.3833, 40.2500],
      "Ijara": [-0.2167, 40.0167],
      "Lagdera": [-0.3500, 39.8167]
    },
    "Homa Bay": {
      "Homa Bay Town": [-0.5333, 34.4500],
      "Karachuonyo": [-0.6167, 34.5167],
      "Kasipul": [-0.6833, 34.5833],
      "Mbita": [-0.4167, 34.2167],
      "Ndhiwa": [-0.7500, 34.3500],
      "Rangwe": [-0.5833, 34.3833],
      "Suba North": [-0.4667, 34.2833],
      "Suba South": [-0.5167, 34.2500]
    },
    "Isiolo": {
      "Garbatulla": [0.4667, 38.3167],
      "Isiolo": [0.3500, 37.5833],
      "Merti": [0.2833, 38.0833]
    },
    "Kajiado": {
      "Isinya": [-1.6667, 36.8667],
      "Kajiado Central": [-1.8500, 36.7833],
      "Kajiado East": [-1.9167, 36.8500],
      "Kajiado North": [-1.3000, 36.8167],
      "Kajiado South": [-2.0167, 36.7167],
      "Kajiado West": [-1.7833, 36.6500],
      "Loitokitok": [-2.9833, 37.4167],
      "Mashuuru": [-1.5167, 36.9167]
    },
    "Kakamega": {
      "Butere": [0.2167, 34.4833],
      "Kakamega Central": [0.2833, 34.7500],
      "Kakamega East": [0.3167, 34.8167],
      "Kakamega North": [0.3500, 34.8833],
      "Kakamega South": [0.2500, 34.6833],
      "Khwisero": [0.1833, 34.6167],
      "Lugari": [0.3833, 34.9500],
      "Lurambi": [0.2833, 34.7500],
      "Matete": [0.1500, 34.5500],
      "Mumias East": [0.3333, 34.4833],
      "Mumias West": [0.3000, 34.4500],
      "Navakholo": [0.2500, 34.7167],
      "Shinyalu": [0.2167, 34.6833]
    },
    "Kericho": {
      "Ainamoi": [-0.3667, 35.2833],
      "Belgut": [-0.3167, 35.3500],
      "Bureti": [-0.4167, 35.2167],
      "Kipkelion East": [-0.2833, 35.3833],
      "Kipkelion West": [-0.2500, 35.3167],
      "Soin Sigowet": [-0.4667, 35.1500]
    },
    "Kiambu": {
      "Gatundu North": [-0.9833, 36.9333],
      "Gatundu South": [-1.0167, 36.9000],
      "Githunguri": [-1.0833, 36.8500],
      "Juja": [-1.1000, 37.0167],
      "Kabete": [-1.2500, 36.7333],
      "Kiambaa": [-1.1667, 36.8167],
      "Kiambu": [-1.1667, 36.8167],
      "Kikuyu": [-1.2500, 36.6667],
      "Lari": [-0.9167, 36.8667],
      "Limuru": [-1.1167, 36.6500],
      "Ruiru": [-1.1500, 36.9500],
      "Thika Town": [-1.0333, 37.0667],
      "Westlands": [-1.2701, 36.8129]
    },
    "Kilifi": {
      "Ganze": [-3.8167, 39.5833],
      "Kaloleni": [-3.7333, 39.8500],
      "Kilifi North": [-3.6333, 39.8500],
      "Kilifi South": [-3.7167, 39.8333],
      "Magarini": [-3.5167, 39.9167],
      "Malindi": [-3.2167, 40.1167],
      "Rabai": [-3.9167, 39.6167]
    },
    "Kirinyaga": {
      "Gichugu": [-0.5167, 37.3167],
      "Kirinyaga Central": [-0.5000, 37.2833],
      "Mwea East": [-0.6667, 37.4167],
      "Mwea West": [-0.6167, 37.3833],
      "Ndia": [-0.4833, 37.2500]
    },
    "Kisii": {
      "Bobasi": [-0.6833, 34.7667],
      "Bomachoge Borabu": [-0.7500, 34.8333],
      "Bomachoge Chache": [-0.7167, 34.8000],
      "Kitutu Chache North": [-0.6667, 34.7667],
      "Kitutu Chache South": [-0.7000, 34.7333],
      "Masaba South": [-0.7833, 34.8667],
      "Nyaribari Chache": [-0.6500, 34.7833],
      "Nyaribari Masaba": [-0.6167, 34.8167]
    },
    "Kisumu": {
      "Kisumu Central": [-0.0917, 34.7681],
      "Kisumu East": [-0.0833, 34.7833],
      "Kisumu West": [-0.1000, 34.7500],
      "Muhoroni": [-0.1500, 35.2000],
      "Nyakach": [-0.2167, 34.9167],
      "Nyando": [-0.1833, 34.8500],
      "Seme": [-0.1167, 34.6833]
    },
    "Kitui": {
      "Kitui Central": [-1.3667, 38.0167],
      "Kitui East": [-1.3167, 38.0833],
      "Kitui Rural": [-1.3833, 38.0000],
      "Kitui South": [-1.4167, 37.9667],
      "Kitui West": [-1.3500, 37.9500],
      "Mwingi Central": [-0.9333, 38.0667],
      "Mwingi East": [-0.8833, 38.1167],
      "Mwingi North": [-0.9667, 38.0167],
      "Mwingi West": [-0.9167, 38.0000]
    },
    "Kwale": {
      "Kinango": [-4.1333, 39.3167],
      "Lunga Lunga": [-4.5500, 39.2167],
      "Matuga": [-4.0667, 39.4500],
      "Msambweni": [-4.4667, 39.4833]
    },
    "Laikipia": {
      "Laikipia Central": [0.0167, 36.3667],
      "Laikipia East": [0.0833, 36.4333],
      "Laikipia North": [0.1500, 36.5000],
      "Laikipia West": [-0.0500, 36.3000],
      "Nyahururu": [0.0333, 36.3667]
    },
    "Lamu": {
      "Lamu East": [-2.2667, 40.9000],
      "Lamu West": [-2.2833, 40.8500]
    },
    "Machakos": {
      "Kathiani": [-1.5167, 37.2833],
      "Machakos Town": [-1.5167, 37.2667],
      "Masinga": [-0.8833, 37.4167],
      "Matungulu": [-1.3833, 37.3500],
      "Mavoko": [-1.3667, 37.0167],
      "Mwala": [-1.4167, 37.4167],
      "Yatta": [-1.3167, 37.5167]
    },
    "Makueni": {
      "Kaiti": [-1.8167, 37.6167],
      "Kibwezi East": [-2.2167, 37.9667],
      "Kibwezi West": [-2.1833, 37.9333],
      "Kilome": [-1.7500, 37.5500],
      "Makueni": [-1.8000, 37.6167],
      "Mbooni": [-1.6833, 37.4833]
    },
    "Mandera": {
      "Banissa": [3.9167, 40.1667],
      "Lafey": [3.8333, 40.0833],
      "Mandera East": [3.9333, 41.8500],
      "Mandera North": [4.0000, 41.9167],
      "Mandera South": [3.8667, 41.7833],
      "Mandera West": [3.8000, 41.7167]
    },
    "Marsabit": {
      "Laisamis": [2.1833, 37.9833],
      "Moyale": [3.5167, 39.0500],
      "North Horr": [3.3167, 37.0667],
      "Saku": [2.3333, 37.9833]
    },
    "Meru": {
      "Buuri": [0.0167, 37.6667],
      "Igembe Central": [0.1167, 37.8167],
      "Igembe North": [0.1500, 37.8500],
      "Igembe South": [0.0833, 37.7833],
      "Imenti Central": [0.0500, 37.6500],
      "Imenti North": [0.0833, 37.6833],
      "Imenti South": [0.0167, 37.6167],
      "Tigania East": [0.1833, 37.9167],
      "Tigania West": [0.1500, 37.8833]
    },
    "Migori": {
      "Awendo": [-0.5333, 34.5167],
      "Kuria East": [-1.1833, 34.4667],
      "Kuria West": [-1.2167, 34.4333],
      "Nyatike": [-1.0333, 34.2167],
      "Rongo": [-0.6833, 34.6167],
      "Suna East": [-1.0667, 34.2833],
      "Suna West": [-1.1000, 34.2500],
      "Uriri": [-0.7500, 34.5500]
    },
    "Mombasa": {
      "Changamwe": [-4.0333, 39.6167],
      "Jomvu": [-4.0667, 39.6500],
      "Kisauni": [-4.0167, 39.6833],
      "Likoni": [-4.0833, 39.6667],
      "Mvita": [-4.0500, 39.6667],
      "Nyali": [-4.0167, 39.7333]
    },
    "Murang'a": {
      "Gatanga": [-0.8167, 37.0167],
      "Kahuro": [-0.7833, 37.0500],
      "Kandara": [-0.8500, 36.9833],
      "Kangema": [-0.8833, 36.9500],
      "Kigumo": [-0.7500, 37.0833],
      "Mathioya": [-0.7167, 37.1167],
      "Murang'a South": [-0.7833, 37.0333]
    },
    "Nairobi": {
      "Dagoretti North": [-1.2833, 36.7500],
      "Dagoretti South": [-1.3000, 36.7333],
      "Embakasi Central": [-1.3167, 36.9000],
      "Embakasi East": [-1.3000, 36.9167],
      "Embakasi North": [-1.2833, 36.8833],
      "Embakasi South": [-1.3333, 36.9000],
      "Embakasi West": [-1.3167, 36.8833],
      "Kamukunji": [-1.2833, 36.8333],
      "Kasarani": [-1.2167, 36.9005],
      "Kibra": [-1.3000, 36.7833],
      "Lang'ata": [-1.3500, 36.7667],
      "Makadara": [-1.2833, 36.8500],
      "Mathare": [-1.2667, 36.8500],
      "Roysambu": [-1.2167, 36.8833],
      "Ruaraka": [-1.2333, 36.8667],
      "Starehe": [-1.2833, 36.8167],
      "Westlands": [-1.2701, 36.8129]
    },
    "Nakuru": {
      "Bahati": [-0.2833, 36.0833],
      "Gilgil": [-0.5167, 36.3167],
      "Kuresoi North": [-0.1833, 35.7833],
      "Kuresoi South": [-0.2167, 35.7500],
      "Molo": [-0.2500, 35.7333],
      "Naivasha": [-0.7167, 36.4333],
      "Nakuru Town East": [-0.3000, 36.0833],
      "Nakuru Town West": [-0.3167, 36.0667],
      "Njoro": [-0.3500, 35.9333],
      "Rongai": [-0.1833, 36.1167],
      "Subukia": [-0.2833, 36.1833]
    },
    "Nandi": {
      "Aldai": [0.1167, 35.1167],
      "Chesumei": [0.0833, 35.0833],
      "Emgwen": [0.0500, 35.0500],
      "Mosop": [0.1500, 35.1500],
      "Nandi Hills": [0.1167, 35.1833],
      "Tinderet": [0.1833, 35.2167]
    },
    "Narok": {
      "Narok East": [-1.0833, 35.8667],
      "Narok North": [-1.0500, 35.9000],
      "Narok South": [-1.1167, 35.8333],
      "Narok West": [-1.0833, 35.8000],
      "Trans Mara East": [-1.1500, 35.0167],
      "Trans Mara West": [-1.1833, 34.9833]
    },
    "Nyamira": {
      "Borabu": [-0.5667, 34.9833],
      "Manga": [-0.6000, 34.9500],
      "Masaba North": [-0.6333, 34.9167],
      "Nyamira North": [-0.5667, 34.9500],
      "Nyamira South": [-0.6000, 34.9167]
    },
    "Nyandarua": {
      "Kinangop": [-0.6167, 36.6667],
      "Kipipiri": [-0.5500, 36.6000],
      "Ndaragwa": [-0.5167, 36.5500],
      "Ol Jorok": [-0.4833, 36.5167],
      "Ol Kalou": [-0.2667, 36.3833]
    },
    "Nyeri": {
      "Kieni East": [-0.4167, 36.9500],
      "Kieni West": [-0.4500, 36.9167],
      "Mathira East": [-0.4167, 37.0167],
      "Mathira West": [-0.4500, 36.9833],
      "Mukurweini": [-0.4833, 37.0500],
      "Nyeri Town": [-0.4167, 36.9500],
      "Othaya": [-0.5500, 36.9500],
      "Tetu": [-0.3833, 36.9167]
    },
    "Samburu": {
      "Samburu East": [1.0833, 37.1167],
      "Samburu North": [1.1500, 37.1833],
      "Samburu West": [1.0167, 37.0500]
    },
    "Siaya": {
      "Alego Usonga": [0.0667, 34.2833],
      "Bondo": [0.2333, 34.2667],
      "Gem": [0.1167, 34.3500],
      "Rarieda": [0.1833, 34.3167],
      "Ugenya": [0.1500, 34.3833],
      "Ugunja": [0.1833, 34.4167]
    },
    "Taita-Taveta": {
      "Mwatate": [-3.5000, 38.4000],
      "Taveta": [-3.4000, 37.6833],
      "Voi": [-3.3833, 38.5667],
      "Wundanyi": [-3.4167, 38.3667]
    },
    "Tana River": {
      "Bura": [-1.5167, 40.0167],
      "Galole": [-1.3833, 39.9167],
      "Garsen": [-2.2667, 40.1167]
    },
    "Tharaka-Nithi": {
      "Chuka/Igambang'ombe": [-0.3333, 37.6500],
      "Maara": [-0.3000, 37.6833],
      "Tharaka North": [-0.2667, 37.7167],
      "Tharaka South": [-0.3000, 37.6500]
    },
    "Trans Nzoia": {
      "Cherangany": [0.9167, 35.0167],
      "Kwanza": [1.0000, 34.9500],
      "Saboti": [0.9833, 35.0833],
      "Trans Nzoia West": [0.9500, 35.0500],
      "Kiminini": [0.9667, 35.0333]
    },
    "Turkana": {
      "Loima": [3.3167, 35.1167],
      "Turkana Central": [3.1167, 35.6167],
      "Turkana East": [3.1833, 35.6833],
      "Turkana North": [3.2500, 35.7500],
      "Turkana South": [3.0500, 35.5500],
      "Turkana West": [2.9833, 35.4833]
    },
    "Uasin Gishu": {
      "Ainabkoi": [0.5167, 35.8167],
      "Kapseret": [0.4833, 35.7833],
      "Kesses": [0.4500, 35.7500],
      "Moiben": [0.5500, 35.8500],
      "Soy": [0.5167, 35.8833],
      "Turbo": [0.4833, 35.9167]
    },
    "Vihiga": {
      "Emuhaya": [0.0833, 34.7167],
      "Hamisi": [0.1167, 34.7500],
      "Luanda": [0.0500, 34.6833],
      "Sabatia": [0.0833, 34.6833],
      "Vihiga": [0.1000, 34.7333]
    },
    "Wajir": {
      "Eldas": [1.9167, 40.0667],
      "Tarbaj": [2.0833, 40.1833],
      "Wajir East": [1.7500, 40.0500],
      "Wajir North": [1.8167, 40.1167],
      "Wajir South": [1.6833, 39.9833],
      "Wajir West": [1.7500, 40.0000]
    },
    "West Pokot": {
      "Central Pokot": [1.5167, 35.1167],
      "North Pokot": [1.5833, 35.1833],
      "Pokot South": [1.4500, 35.0500],
      "West Pokot": [1.4833, 35.0833]
    }
  };

  // Kenya counties list (47 counties) - extracted from map keys
  const kenyaCounties = Object.keys(countySubcountyMap);
  
  // Helper to get subcounty coordinates
  const getSubcountyCoordinates = (countyName, subcountyName) => {
    if (!countyName || !subcountyName || !countySubcountyMap[countyName]) {
      return null;
    }
    const coords = countySubcountyMap[countyName][subcountyName];
    if (coords && Array.isArray(coords) && coords.length === 2) {
      return { lat: coords[0], lon: coords[1] };
    }
    return null;
  };

  // Prepare county options with proper format
  const allCountyOptions = useMemo(() => 
    kenyaCounties.map(county => ({
      label: county,
      countyName: county
    })),
    []
  );

  // Sync with parent state
  useEffect(() => {
    if (county) setCountyInput(county);
  }, [county]);

  useEffect(() => {
    if (subcounty) setSubcountyInput(subcounty);
  }, [subcounty]);

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

  // Geocode county location (called only when county is selected)
  const geocodeCounty = async (countyName) => {
    if (!countyName) return null;

    setLoadingCounty(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          countyName + " County, Kenya"
        )}&format=json&limit=1&countrycodes=ke`,
        {
          headers: {
            'User-Agent': 'Mwalimu-Event-Admin/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
          };
        }
      }
    } catch (error) {
      console.error("Error geocoding county:", error);
    } finally {
      setLoadingCounty(false);
    }
    return null;
  };

  // Get subcounties for a selected county from the mapping
  const getSubcountiesForCounty = (countyName) => {
    if (!countyName || !countySubcountyMap[countyName]) {
      setAllSubcountyOptions([]);
      return;
    }

    // Get subcounties from the mapping and format them with coordinates
    const subcounties = countySubcountyMap[countyName];
    const formattedOptions = Object.keys(subcounties).map(subcountyName => {
      const coords = subcounties[subcountyName];
      return {
        label: subcountyName,
        subcountyName: subcountyName,
        lat: coords[0],
        lon: coords[1]
      };
    });
    
    setAllSubcountyOptions(formattedOptions);
  };

  // Geocode subcounty location
  const geocodeSubcounty = async (subcountyName, countyName) => {
    if (!subcountyName || !countyName) return null;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          subcountyName + ", " + countyName + ", Kenya"
        )}&format=json&limit=1&countrycodes=ke`,
        {
          headers: {
            'User-Agent': 'Mwalimu-Event-Admin/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
          };
        }
      }
    } catch (error) {
      console.error("Error geocoding subcounty:", error);
    }
    return null;
  };

  // Handle county selection
  const handleCountySelect = async (event, value) => {
    if (value) {
      try {
        const countyName = typeof value === "string" ? value : (value.countyName || value.label);
        if (!countyName) return;
        
        setCountyInput(countyName);
        if (onCountyChange) {
          onCountyChange(countyName);
        }
        
        // Geocode the selected county and zoom to it
        const location = await geocodeCounty(countyName);
        if (location) {
          setMapCenter([location.lat, location.lon]);
          setMapZoom(10);
        }
        
        // Get subcounties for the selected county
        getSubcountiesForCounty(countyName);
        
        setSubcountyInput(""); // Clear subcounty when county changes
        if (onSubcountyChange) {
          onSubcountyChange("");
        }
      } catch (error) {
        console.error("Error handling county selection:", error);
      }
    }
  };

  // Handle subcounty selection
  const handleSubcountySelect = (event, value) => {
    if (value) {
      try {
        const subcountyName = typeof value === "string" ? value : (value.subcountyName || value.label || "");
        if (!subcountyName) return;
        
        setSubcountyInput(subcountyName);
        if (onSubcountyChange) {
          onSubcountyChange(subcountyName.split(",")[0]); // Extract subcounty name
        }
        
        // Use coordinates from mapping if available
        if (value.lat && value.lon) {
          const lat = value.lat;
          const lon = value.lon;
          setMapCenter([lat, lon]);
          setMapZoom(13);
          setMarkerPosition([lat, lon]);
          // Update coordinates in parent
          if (onLocationChange) {
            onLocationChange(lat.toString(), lon.toString());
          }
        } else if (countyInput) {
          // Fallback: try to get coordinates from mapping
          const coords = getSubcountyCoordinates(countyInput, subcountyName);
          if (coords) {
            setMapCenter([coords.lat, coords.lon]);
            setMapZoom(13);
            setMarkerPosition([coords.lat, coords.lon]);
            if (onLocationChange) {
              onLocationChange(coords.lat.toString(), coords.lon.toString());
            }
          } else {
            // Last resort: geocode
            setLoadingSubcounty(true);
            geocodeSubcounty(subcountyName, countyInput).then(location => {
              if (location) {
                setMapCenter([location.lat, location.lon]);
                setMapZoom(13);
                setMarkerPosition([location.lat, location.lon]);
                if (onLocationChange) {
                  onLocationChange(location.lat.toString(), location.lon.toString());
                }
              }
              setLoadingSubcounty(false);
            }).catch(error => {
              console.error("Error geocoding subcounty:", error);
              setLoadingSubcounty(false);
            });
          }
        }
      } catch (error) {
        console.error("Error handling subcounty selection:", error);
      }
    }
  };

  // Handle map click
  const handleMapClick = (latlng) => {
    try {
      if (latlng && latlng.lat && latlng.lng) {
        setMarkerPosition([latlng.lat, latlng.lng]);
        if (onLocationChange) {
          onLocationChange(latlng.lat.toString(), latlng.lng.toString());
        }
      }
    } catch (error) {
      console.error("Error handling map click:", error);
    }
  };


  // Update subcounty options when county changes
  useEffect(() => {
    if (countyInput) {
      getSubcountiesForCounty(countyInput);
    } else {
      setAllSubcountyOptions([]);
    }
  }, [countyInput]);

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, color: "#666" }}>
        Search and select location on the map
      </Typography>
      
      {/* County Search - Searchable Dropdown */}
      <Box sx={{ mb: 2 }}>
        <Autocomplete
          disablePortal
          options={allCountyOptions}
          getOptionLabel={(option) => {
            if (typeof option === "string") return option;
            return option.label || option.countyName || String(option);
          }}
          loading={loadingCounty}
          value={countyInput ? allCountyOptions.find(c => c.countyName === countyInput) || null : null}
          inputValue={countyInput}
          onInputChange={(event, newInputValue, reason) => {
            // Update input when typing
            if (reason === 'input' || reason === 'clear') {
              setCountyInput(newInputValue);
            }
          }}
          onChange={handleCountySelect}
          filterOptions={(options, params) => {
            const filtered = options.filter((option) => {
              const label = option.label || option.countyName || "";
              const searchTerm = params.inputValue.toLowerCase().trim();
              if (!searchTerm) return true; // Show all if no search term
              return label.toLowerCase().includes(searchTerm);
            });
            return filtered;
          }}
          noOptionsText="No counties found"
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select County"
              placeholder="Search or select from 47 counties..."
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingCounty ? <CircularProgress color="inherit" size={20} /> : null}
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
            const label = option.label || option.countyName || String(option);
            return (
              <Box component="li" {...props} key={label} sx={{ py: 1 }}>
                <Typography variant="body2">{label}</Typography>
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

      {/* Subcounty Search - Searchable Dropdown */}
      <Box sx={{ mb: 2 }}>
        <Autocomplete
          disablePortal
          options={allSubcountyOptions}
          getOptionLabel={(option) => {
            if (typeof option === "string") return option;
            return option.label || option.subcountyName || String(option);
          }}
          loading={loadingSubcounty}
          value={subcountyInput ? allSubcountyOptions.find(s => s.subcountyName === subcountyInput || s.label === subcountyInput) || null : null}
          inputValue={subcountyInput}
          onInputChange={(event, newInputValue, reason) => {
            // Update input when typing
            if (reason === 'input' || reason === 'clear') {
              setSubcountyInput(newInputValue);
            }
          }}
          onChange={handleSubcountySelect}
          filterOptions={(options, params) => {
            const filtered = options.filter((option) => {
              const label = option.label || option.subcountyName || "";
              const searchTerm = params.inputValue.toLowerCase().trim();
              if (!searchTerm) return true; // Show all if no search term
              return label.toLowerCase().includes(searchTerm);
            });
            return filtered;
          }}
          noOptionsText={!countyInput ? "Please select a county first" : "No subcounties found"}
          disabled={!countyInput}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Subcounty (optional)"
              placeholder={countyInput ? "Search or select a subcounty..." : "Select a county first"}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingSubcounty ? <CircularProgress color="inherit" size={20} /> : null}
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
            const label = option.label || option.subcountyName || String(option);
            return (
              <Box component="li" {...props} key={label} sx={{ py: 1 }}>
                <Typography variant="body2">{label}</Typography>
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
        💡 Tip: Search for a county or subcounty to zoom in, then click on the map to set the exact location. Coordinates will be filled automatically.
      </Typography>
    </Box>
  );
};

export default LocationMapPicker;

