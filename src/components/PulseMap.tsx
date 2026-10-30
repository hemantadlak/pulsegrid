import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, Polyline, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import type { Hospital } from '../data'

type Point = [number, number]
const demoLocation: Point = [30.7333, 76.7794]
const mix = (a: Point, b: Point, progress: number): Point => [a[0] + (b[0] - a[0]) * progress, a[1] + (b[1] - a[1]) * progress]
const curvedRoute = (from: Point, to: Point): Point[] => [from, mix(from, [from[0] + .002, from[1] + .003], .6), mix(from, to, .45), mix(from, to, .72), to]
const userIcon = L.divIcon({ className: 'leaflet-div-icon', html: '<div class="leaflet-user-dot"><i></i></div>', iconSize: [26, 26], iconAnchor: [13, 13] })
const ambulanceIcon = L.divIcon({ className: 'leaflet-div-icon', html: '<div class="leaflet-ambulance">✚</div>', iconSize: [52, 52], iconAnchor: [26, 26] })

function hospitalIcon(hospital: Hospital, recommended: boolean) {
  const color = recommended ? '#2563eb' : hospital.erStatus === 'accepting' && hospital.icuBeds > 0 ? '#10b981' : hospital.erStatus === 'limited' ? '#f59e0b' : '#94a3b8'
  return L.divIcon({ className: 'leaflet-div-icon', html: `<div class="leaflet-hospital-pin" style="background:${color}"><span>H</span></div>`, iconSize: [36, 42], iconAnchor: [18, 42] })
}

function FitRoute({ points }: { points: Point[] }) {
  const map = useMap()
  useEffect(() => { if (points.length > 1) map.fitBounds(points, { padding: [42, 42], maxZoom: 14, animate: true }) }, [map, points])
  return null
}

export function PulseMap({ hospitals, recommendedId, userLocation = demoLocation, journeyActive = false, height = '390px' }: { hospitals: Hospital[]; recommendedId?: string | null; userLocation?: Point; journeyActive?: boolean; height?: string }) {
  const [routeStep, setRouteStep] = useState(0)
  const destination = hospitals.find((hospital) => hospital.id === recommendedId)
  const ambulanceStart = useMemo<Point>(() => [userLocation[0] - .016, userLocation[1] - .012], [userLocation])
  const ambulanceRoute = useMemo(() => curvedRoute(ambulanceStart, userLocation), [ambulanceStart, userLocation])
  const hospitalRoute = useMemo<Point[]>(() => destination ? curvedRoute(userLocation, [destination.lat, destination.lng]) : [userLocation], [destination, userLocation])
  const mapPoints = useMemo(() => [...ambulanceRoute, ...hospitalRoute], [ambulanceRoute, hospitalRoute])

  useEffect(() => {
    if (!journeyActive) { setRouteStep(0); return }
    const interval = window.setInterval(() => setRouteStep((step) => Math.min(step + 1, ambulanceRoute.length - 1)), 2400)
    return () => window.clearInterval(interval)
  }, [journeyActive, ambulanceRoute.length])

  return <MapContainer center={userLocation} zoom={13} zoomControl={false} style={{ height, width: '100%', borderRadius: '14px' }}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
    <ZoomControl position="bottomleft" />
    <FitRoute points={mapPoints} />
    <Marker position={userLocation} icon={userIcon}><Popup>Your browser location for this session</Popup></Marker>
    {hospitals.map((hospital) => <Marker key={hospital.id} position={[hospital.lat, hospital.lng]} icon={hospitalIcon(hospital, hospital.id === recommendedId)}><Popup><strong>{hospital.name}</strong><br />Simulated ETA: {hospital.etaMinutes} min<br />ICU beds: {hospital.icuBeds}</Popup></Marker>)}
    {destination && <Polyline positions={hospitalRoute} pathOptions={{ color: '#2563eb', weight: 5, opacity: .88 }} />}
    {journeyActive && <><Polyline positions={ambulanceRoute} pathOptions={{ color: '#ef4444', weight: 5, dashArray: '10 7' }} /><Marker position={ambulanceRoute[routeStep]} icon={ambulanceIcon}><Popup>Simulated ambulance en route</Popup></Marker></>}
  </MapContainer>
}
