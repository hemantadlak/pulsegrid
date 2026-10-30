import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, Polyline, TileLayer, ZoomControl } from 'react-leaflet'
import type { Hospital } from '../data'

const userLocation: [number, number] = [30.7333, 76.7794]
const ambulanceRoute: [number, number][] = [[30.725, 76.768], [30.727, 76.771], [30.7295, 76.774], [30.731, 76.776], userLocation]
const userIcon = L.divIcon({ className: 'leaflet-div-icon', html: '<div class="leaflet-user-dot"><i></i></div>', iconSize: [26, 26], iconAnchor: [13, 13] })
const ambulanceIcon = L.divIcon({ className: 'leaflet-div-icon', html: '<div class="leaflet-ambulance">✚<small>AMB-DEMO-07</small></div>', iconSize: [62, 62], iconAnchor: [31, 31] })

function hospitalIcon(hospital: Hospital, recommended: boolean) {
  const color = recommended ? '#2563eb' : hospital.erStatus === 'accepting' && hospital.icuBeds > 0 ? '#10b981' : hospital.erStatus === 'limited' ? '#f59e0b' : '#94a3b8'
  return L.divIcon({ className: 'leaflet-div-icon', html: `<div class="leaflet-hospital-pin" style="background:${color}">H</div>`, iconSize: [36, 42], iconAnchor: [18, 42] })
}

export function PulseMap({ hospitals, recommendedId, showAmbulance = true, height = '390px' }: { hospitals: Hospital[]; recommendedId?: string | null; showAmbulance?: boolean; height?: string }) {
  const [routeStep, setRouteStep] = useState(0)
  useEffect(() => { if (!showAmbulance) return; const interval = window.setInterval(() => setRouteStep((step) => (step + 1) % ambulanceRoute.length), 2400); return () => window.clearInterval(interval) }, [showAmbulance])
  const destination = hospitals.find((hospital) => hospital.id === recommendedId)
  const destinationRoute = useMemo<[number, number][]>(() => destination ? [userLocation, [30.735, 76.784], [destination.lat, destination.lng]] : [userLocation], [destination])
  return <MapContainer center={userLocation} zoom={13} zoomControl={false} style={{ height, width: '100%', borderRadius: '14px' }}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
    <ZoomControl position="bottomleft" />
    <Marker position={userLocation} icon={userIcon}><Popup>Simulated user location</Popup></Marker>
    {hospitals.map((hospital) => <Marker key={hospital.id} position={[hospital.lat, hospital.lng]} icon={hospitalIcon(hospital, hospital.id === recommendedId)}><Popup><strong>{hospital.name}</strong><br />Simulated ETA: {hospital.etaMinutes} min<br />ICU beds: {hospital.icuBeds}</Popup></Marker>)}
    {destination && <Polyline positions={destinationRoute} pathOptions={{ color: '#2563eb', weight: 5, opacity: .85 }} />}
    {showAmbulance && <><Polyline positions={ambulanceRoute} pathOptions={{ color: '#ef4444', weight: 5, dashArray: '10 7' }} /><Marker position={ambulanceRoute[routeStep]} icon={ambulanceIcon}><Popup>Simulated ambulance</Popup></Marker></>}
  </MapContainer>
}
