import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, Polyline, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import type { Hospital } from '../data'

type Point = [number, number]
const fictionalLocation: Point = [30.7333, 76.7794]
const mix = (a: Point, b: Point, progress: number): Point => [a[0] + (b[0] - a[0]) * progress, a[1] + (b[1] - a[1]) * progress]
const curvedRoute = (from: Point, to: Point): Point[] => [from, mix(from, [from[0] + .002, from[1] + .003], .6), mix(from, to, .45), mix(from, to, .72), to]
const positionAlongRoute = (points: Point[], progress: number): Point => {
  if (points.length < 2) return points[0]
  const exactIndex = Math.min(1, Math.max(0, progress)) * (points.length - 1)
  const fromIndex = Math.floor(exactIndex)
  return mix(points[fromIndex], points[Math.min(fromIndex + 1, points.length - 1)], exactIndex - fromIndex)
}
const ambulanceIcon = L.divIcon({ className: 'leaflet-div-icon', html: '<div class="leaflet-ambulance"><span>🚑</span><small>LIVE</small></div>', iconSize: [58, 58], iconAnchor: [29, 29] })

function hospitalIcon(hospital: Hospital, recommended: boolean) {
  const color = recommended ? '#2563eb' : hospital.erStatus === 'accepting' && hospital.icuBeds > 0 ? '#10b981' : hospital.erStatus === 'limited' ? '#f59e0b' : '#94a3b8'
  return L.divIcon({ className: 'leaflet-div-icon', html: `<div class="leaflet-hospital-pin" style="background:${color}"><span>H</span></div>`, iconSize: [36, 42], iconAnchor: [18, 42] })
}

function FitRoute({ points }: { points: Point[] }) {
  const map = useMap()
  useEffect(() => { if (points.length > 1) map.fitBounds(points, { padding: [42, 42], maxZoom: 14, animate: true }) }, [map, points])
  return null
}

export function PulseMap({ hospitals, recommendedId, userLocation = fictionalLocation, journeyActive = false, height = '390px' }: { hospitals: Hospital[]; recommendedId?: string | null; userLocation?: Point; journeyActive?: boolean; height?: string }) {
  const [journeyProgress, setJourneyProgress] = useState(0)
  const destination = hospitals.find((hospital) => hospital.id === recommendedId)
  const ambulanceStart = useMemo<Point>(() => [userLocation[0] - .016, userLocation[1] - .012], [userLocation])
  const ambulanceRoute = useMemo(() => curvedRoute(ambulanceStart, userLocation), [ambulanceStart, userLocation])
  const patrolRoute = useMemo<Point[]>(() => [
    userLocation,
    [userLocation[0] + .0025, userLocation[1] - .003] as Point,
    [userLocation[0] + .004, userLocation[1] + .0005] as Point,
    [userLocation[0] + .0015, userLocation[1] + .004] as Point,
    userLocation,
  ], [userLocation])
  const hospitalRoute = useMemo<Point[]>(() => destination ? curvedRoute(userLocation, [destination.lat, destination.lng]) : [userLocation], [destination, userLocation])
  const journeyRoute = useMemo<Point[]>(() => [...ambulanceRoute, ...hospitalRoute.slice(1)], [ambulanceRoute, hospitalRoute])
  const activeRoute = journeyActive ? journeyRoute : patrolRoute
  const ambulancePosition = useMemo(() => positionAlongRoute(activeRoute, journeyProgress), [activeRoute, journeyProgress])

  useEffect(() => {
    const startedAt = window.performance.now()
    const travelDuration = journeyActive ? 22000 : 11000
    let frameId = 0
    const move = (now: number) => {
      const elapsed = (now - startedAt) / travelDuration
      // A deterministic traffic-style pace: brief slowdowns make the visual
      // route feel responsive without claiming to use real road information.
      const pace = journeyActive ? Math.min(elapsed < .48 ? elapsed * .76 : .365 + (elapsed - .48) * 1.22, 1) : elapsed % 1
      setJourneyProgress(pace)
      if (!journeyActive || elapsed < 1) frameId = window.requestAnimationFrame(move)
    }
    frameId = window.requestAnimationFrame(move)
    return () => window.cancelAnimationFrame(frameId)
  }, [activeRoute, journeyActive])

  return <MapContainer center={userLocation} zoom={13} zoomControl={false} style={{ height, width: '100%', borderRadius: '14px' }}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
    <ZoomControl position="bottomleft" />
    <FitRoute points={activeRoute} />
    {hospitals.map((hospital) => <Marker key={hospital.id} position={[hospital.lat, hospital.lng]} icon={hospitalIcon(hospital, hospital.id === recommendedId)}><Popup><strong>{hospital.name}</strong><br />Estimated route: {hospital.etaMinutes} min<br />ICU beds: {hospital.icuBeds}</Popup></Marker>)}
    {destination && <Polyline positions={hospitalRoute} pathOptions={{ color: '#2563eb', weight: 5, opacity: .88 }} />}
    {journeyActive && <Polyline positions={journeyRoute} pathOptions={{ color: '#ef4444', weight: 5, dashArray: '10 7' }} />}
    <Marker position={ambulancePosition} icon={ambulanceIcon}><Popup>{journeyActive ? 'Fictional ambulance in motion' : 'Fictional ambulance available nearby'}</Popup></Marker>
  </MapContainer>
}
