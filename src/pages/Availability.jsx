// src/pages/Availability.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../styles/availability.css'
import { loadGapiClient, loadGoogleIdentity } from '../lib/google'

const GOOGLE_CLIENT_ID = '1001839997214-8n0b2cs605n52ltdri13ccgqnct2furc.apps.googleusercontent.com'
const GOOGLE_API_KEY = 'AIzaSyCGnUe0eCtxp77DTEjbo8a-oM_Jn-EuCl8'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'

export default function Availability() {
  const navigate = useNavigate()
  const { eventId } = useParams()
  const [eventData, setEventData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [responses, setResponses] = useState(() => JSON.parse(localStorage.getItem('responses') || '{}'))
  const [cellsActive, setCellsActive] = useState([]) // boolean[][] per day
  const [tokenClient, setTokenClient] = useState(null)
  const [hoveredCell, setHoveredCell] = useState(null)
  const importBtnRef = useRef(null)

  // drag state refs (persist across events)
  const draggingRef = useRef(false)
  const addModeRef = useRef(true)

  const startH = useMemo(() => (eventData ? parseInt(eventData.startTime.split(':')[0]) : 9), [eventData])
  const endH = useMemo(() => (eventData ? parseInt(eventData.endTime.split(':')[0]) : 17), [eventData])
  const totalCells = (endH - startH) * 4 // 15-min slots

  useEffect(() => {
    async function loadEvent() {
      if (eventId) {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001'
          const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`)
          const data = await res.json()
          if (data.meeting) {
            setEventData(data.meeting)
            const params = new URLSearchParams(window.location.search)
            const adminToken = params.get('admin')
            if (adminToken && adminToken === data.meeting.adminToken) {
              setIsAdmin(true)
            }
            
            // Load existing availability responses
            try {
              const availRes = await fetch(`${API_BASE_URL}/api/events/${eventId}/availabilities`)
              const availData = await availRes.json()
              if (availData.availabilities) {
                const key = data.meeting.title
                const formattedResponses = availData.availabilities.map(resp => ({
                  name: resp.userName,
                  selected: resp.selectedSlots || []
                }))
                const newResponses = { ...responses }
                newResponses[key] = formattedResponses
                setResponses(newResponses)
                localStorage.setItem('responses', JSON.stringify(newResponses))
              }
            } catch (err) {
              console.error('Error loading availability:', err)
            }
          }
        } catch (err) {
          console.error('Error loading event:', err)
          if (err.message?.includes('404')) {
            alert('Event not found. Please check the link.')
            navigate('/home')
          }
        }
      } else {
        const stored = JSON.parse(localStorage.getItem('eventData') || 'null')
        setEventData(stored)
      }
      setLoading(false)
    }
    loadEvent()
  }, [eventId])

  useEffect(() => {
    if (!eventData) return
    setCellsActive(
      Array(eventData.selectedDays.length)
        .fill(0)
        .map(() => Array(totalCells).fill(false))
    )
  }, [eventData, totalCells])

  // Load Google API + Identity
  useEffect(() => {
    async function initGoogle() {
      await loadGapiClient()
      await new Promise((res) => window.gapi.load('client', res))
      await window.gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: [DISCOVERY_DOC] })

      await loadGoogleIdentity()
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: () => {}
      })
      setTokenClient(client)
    }
    initGoogle()
  }, [])

  function copyLink() {
    const participantLink = eventData._id ? `${window.location.origin}/availability/${eventData._id}` : window.location.href
    navigator.clipboard.writeText(participantLink)
    alert('Participant link copied! Share this with others.')
  }

  function copyAdminLink() {
    const params = new URLSearchParams(window.location.search)
    const adminToken = params.get('admin')
    if (adminToken && eventData._id) {
      const adminLink = `${window.location.origin}/availability/${eventData._id}?admin=${adminToken}`
      navigator.clipboard.writeText(adminLink)
      alert('Admin link copied! Keep this private.')
    }
  }

  function getAvailabilityCount(dayIndex, slotIndex) {
    const key = eventData?.title || 'defaultEvent'
    const eventResponses = responses[key] || []
    return eventResponses.filter(r => r.selected[dayIndex]?.includes(slotIndex)).length
  }

  function getAvailableNames(dayIndex, slotIndex) {
    const key = eventData?.title || 'defaultEvent'
    const eventResponses = responses[key] || []
    return eventResponses
      .filter(r => r.selected[dayIndex]?.includes(slotIndex))
      .map(r => r.name)
  }

  function getTotalResponses() {
    const key = eventData?.title || 'defaultEvent'
    return (responses[key] || []).length
  }

  function getCellColor(dayIndex, slotIndex) {
    const count = getAvailabilityCount(dayIndex, slotIndex)
    const total = getTotalResponses()
    if (count === 0) return 'transparent'
    const intensity = total > 0 ? count / total : 0
    // Improved gradient: light lavender to deep purple
    const r = Math.round(240 - (240 - 106) * intensity)
    const g = Math.round(220 - (220 - 27) * intensity)
    const b = Math.round(255 - (255 - 154) * intensity)
    return `rgb(${r}, ${g}, ${b})`
  }

  function renderResponses() {
    const key = eventData?.title || 'defaultEvent'
    const eventResponses = responses[key] || []
    return (
      <>
        <h3 id="responseHeader">Responses ({eventResponses.length})</h3>
        <ul className="muted" style={{ paddingLeft: 18, margin: '8px 0 0' }}>
          {eventResponses.map((r, i) => (
            <li key={i}>{r.name}</li>
          ))}
        </ul>
      </>
    )
  }

  function setCell(dayIndex, slotIndex, value) {
    setCellsActive((prev) => {
      const next = prev.map((row) => row.slice())
      next[dayIndex][slotIndex] = value
      return next
    })
  }

  async function addAvailability() {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (!user) {
      localStorage.setItem('returnTo', window.location.pathname + window.location.search)
      alert('Please login to add your availability')
      navigate('/login')
      return
    }

    const name = user.userName || prompt('Enter your name')
    if (!name) return

    const key = eventData?.title || 'defaultEvent'
    const newResponses = { ...responses }
    newResponses[key] = newResponses[key] || []
    newResponses[key].push({
      name,
      selected: cellsActive.map((dayArr) => dayArr.reduce((acc, on, i) => (on ? [...acc, i] : acc), []))
    })
    setResponses(newResponses)
    localStorage.setItem('responses', JSON.stringify(newResponses))

    if (eventData._id) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001'
        await fetch(`${API_BASE_URL}/api/events/${eventData._id}/availabilities`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: user.email,
            userName: name,
            selectedSlots: cellsActive.map((dayArr) => dayArr.reduce((acc, on, i) => (on ? [...acc, i] : acc), []))
          })
        })
      } catch (err) {
        console.error(err)
      }
    }

    setCellsActive(cellsActive.map((arr) => arr.map(() => false)))
  }

  async function handleImport() {
    if (!tokenClient) return
    const btn = importBtnRef.current
    const original = btn.innerHTML
    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        alert('Failed to authenticate with Google. Please try again.')
        btn.innerHTML = original
        btn.disabled = false
        return
      }
      btn.innerHTML = '⏳ Loading calendar...'
      btn.disabled = true
      try {
        await importCalendarAvailability()
      } finally {
        btn.innerHTML = original
        btn.disabled = false
      }
    }
    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' })
    } else {
      tokenClient.requestAccessToken({ prompt: '' })
    }
  }

  async function importCalendarAvailability() {
    if (!eventData) {
      alert('No event data found. Create an event first.')
      return
    }
    const { selectedDays, month, year } = eventData

    const firstDay = Math.min(...selectedDays)
    const lastDay = Math.max(...selectedDays)
    const timeMin = new Date(year, month, firstDay)
    timeMin.setHours(0, 0, 0, 0)
    const timeMax = new Date(year, month, lastDay)
    timeMax.setHours(23, 59, 59, 999)

    const response = await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime'
    })

    const events = response.result.items || []
    if (!events.length) {
      alert('No events found in your calendar for the selected dates.')
      return
    }

    // Build busy slots per dayIndex
    const busyByDay = new Map()
    events.forEach((ev) => {
      if (!ev.start?.dateTime || !ev.end?.dateTime) return
      const evStart = new Date(ev.start.dateTime)
      const evEnd = new Date(ev.end.dateTime)

      eventData.selectedDays.forEach((dayNum, dayIndex) => {
        if (
          evStart.getDate() === dayNum &&
          evStart.getMonth() === eventData.month &&
          evStart.getFullYear() === eventData.year
        ) {
          const evStartHour = evStart.getHours() + evStart.getMinutes() / 60
          const evEndHour = evEnd.getHours() + evEnd.getMinutes() / 60
          if (evEndHour > startH && evStartHour < endH) {
            const startSlot = Math.max(0, Math.floor((evStartHour - startH) * 4))
            const endSlot = Math.min((endH - startH) * 4, Math.ceil((evEndHour - startH) * 4))
            if (!busyByDay.has(dayIndex)) busyByDay.set(dayIndex, new Set())
            for (let i = startSlot; i < endSlot; i++) busyByDay.get(dayIndex).add(i)
          }
        }
      })
    })

    // Free slots = not busy
    setCellsActive((prev) =>
      prev.map((arr, dayIndex) => {
        const busy = busyByDay.get(dayIndex) || new Set()
        return arr.map((_, slot) => !busy.has(slot))
      })
    )

    alert(`Imported ${events.length} events from your Google Calendar.`)
  }

  // drag handlers
  function handleCellMouseDown(dayIndex, slotIndex, e) {
    e.preventDefault() // avoid text selection while dragging
    const willAdd = !cellsActive[dayIndex]?.[slotIndex]
    draggingRef.current = true
    addModeRef.current = willAdd
    setCell(dayIndex, slotIndex, willAdd)
  }

  function handleCellMouseEnter(dayIndex, slotIndex) {
    if (!draggingRef.current) return
    setCell(dayIndex, slotIndex, addModeRef.current)
  }

  function handleMouseUp() {
    draggingRef.current = false
  }

  if (!eventData) {
    return (
      <div className="availability-page">
        <div className="main">
          <p>
            No event loaded. <button onClick={() => navigate('/create')}>Create one</button>
          </p>
        </div>
      </div>
    )
  }

  // header dates
  const firstDate = new Date(eventData.year, eventData.month, Math.min(...eventData.selectedDays))
  const lastDate = new Date(eventData.year, eventData.month, Math.max(...eventData.selectedDays))
  const eventDates =
    firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    (eventData.selectedDays.length > 1
      ? ' – ' +
        lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '')

  return (
    <div className="availability-page">
      <div className="container">
        <div className="main">
          <div className="header">
            <div className="header-left">
              <div>
                <button className="home-btn" onClick={() => navigate('/home')} title="Go to Home">
                  ←
                </button>
                <h1>{eventData.title}</h1>
                <span>{eventDates}</span>
              </div>
            </div>
            <div className="header-right">
              <button className="btn" onClick={copyLink}>
                Copy link
              </button>
              {isAdmin && (
                <button className="btn" onClick={copyAdminLink}>
                  Copy Admin Link
                </button>
              )}
              <button className="btn primary" onClick={addAvailability}>
                Add availability
              </button>
              <button
                className="btn primary"
                ref={importBtnRef}
                onClick={handleImport}
                title="Import availability"
              >
                Import availability
              </button>
            </div>
          </div>

          {hoveredCell && (() => {
            const names = getAvailableNames(hoveredCell.dayIndex, hoveredCell.slotIndex)
            if (names.length === 0) return null
            return (
              <div className="hover-tooltip">
                <strong>{names.length} available:</strong>
                <ul>
                  {names.map((name, i) => <li key={i}>{name}</li>)}
                </ul>
              </div>
            )
          })()}

          <div className="schedule">
            {/* Time labels */}
            <div className="time-labels">
              {Array.from({ length: endH - startH + 1 }, (_, i) => {
                const h = startH + i
                const ampm = h >= 12 ? 'PM' : 'AM'
                const display = ((h + 11) % 12) + 1
                return (
                  <div
                    className="time-label"
                    key={h}
                    style={{ top: `${i * 26 * 4}px` }}
                  >
                    {display} {ampm}
                  </div>
                )
              })}
            </div>

            {/* Day columns */}
            <div className="day-columns">
              {eventData.selectedDays.map((dayNum, dayIndex) => {
                const dateObj = new Date(eventData.year, eventData.month, dayNum)
                const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                const monthDay = dateObj.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })

                return (
                  <div className="day-column" key={dayIndex}>
                    <div className="day-header">
                      <span>{monthDay}</span>
                      <h3>{weekday}</h3>
                    </div>
                    <div
                      className="day-grid"
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      {Array.from({ length: totalCells }, (_, slotIndex) => {
                        const isCurrentUserActive = cellsActive[dayIndex]?.[slotIndex]
                        return (
                          <div
                            key={slotIndex}
                            className={`cell ${isCurrentUserActive ? 'active' : ''}`}
                            style={{
                              backgroundColor: isCurrentUserActive 
                                ? '#E3C5E3' 
                                : getCellColor(dayIndex, slotIndex)
                            }}
                            onMouseDown={(e) =>
                              handleCellMouseDown(dayIndex, slotIndex, e)
                            }
                            onMouseEnter={() => {
                              handleCellMouseEnter(dayIndex, slotIndex)
                              setHoveredCell({ dayIndex, slotIndex })
                            }}
                            onMouseLeave={() => setHoveredCell(null)}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="timezone-bar">
            <span>Shown in</span>
            <select className="select">
              <option>(GMT-4:00) Eastern Time (US & Canada)</option>
            </select>
            <select className="select">
              <option>12h</option>
              <option>24h</option>
            </select>
          </div>
        </div>

        <div className="sidebar">
          <div className="responses-box">{renderResponses()}</div>
        </div>
      </div>
    </div>
  )
}