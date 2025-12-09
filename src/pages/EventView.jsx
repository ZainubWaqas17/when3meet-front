// src/pages/EventView.jsx
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../styles/availability.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001'

export default function EventView() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [availabilities, setAvailabilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cellsActive, setCellsActive] = useState([])
  const [hoveredCell, setHoveredCell] = useState(null)
  const [user, setUser] = useState(null)

  const draggingRef = useRef(false)
  const addModeRef = useRef(true)
  const importBtnRef = useRef(null)
  const [tokenClient, setTokenClient] = useState(null)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (userData && isLoggedIn === 'true') {
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    fetchEventData()
  }, [eventId])

  useEffect(() => {
    async function initGoogle() {
      const { loadGapiClient, loadGoogleIdentity } = await import('../lib/google')
      await loadGapiClient()
      await new Promise((res) => window.gapi.load('client', res))
      await window.gapi.client.init({ 
        apiKey: 'AIzaSyCGnUe0eCtxp77DTEjbo8a-oM_Jn-EuCl8', 
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'] 
      })

      await loadGoogleIdentity()
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: '1001839997214-8n0b2cs605n52ltdri13ccgqnct2furc.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        callback: () => {}
      })
      setTokenClient(client)
    }
    initGoogle()
  }, [])

  async function fetchEventData() {
    try {
      setLoading(true)
      setError('')

      // Fetch event details (public endpoint)
      const eventRes = await fetch(`${API_BASE_URL}/api/events/public/${eventId}`)
      const eventData = await eventRes.json()

      if (!eventRes.ok || !eventData.success) {
        setError(eventData.error || 'Event not found')
        setLoading(false)
        return
      }

      setEvent(eventData.event)

      // Initialize empty grid
      if (eventData.event.selectedDays) {
        const startH = parseInt(eventData.event.startTime.split(':')[0])
        const endH = parseInt(eventData.event.endTime.split(':')[0])
        const totalCells = (endH - startH) * 4
        setCellsActive(
          Array(eventData.event.selectedDays.length)
            .fill(0)
            .map(() => Array(totalCells).fill(false))
        )
      }

      // Fetch availabilities
      const availRes = await fetch(`${API_BASE_URL}/api/events/${eventId}/availabilities`)
      const availData = await availRes.json()
      if (availRes.ok && availData.success) {
        setAvailabilities(availData.availabilities || [])
      }

      setLoading(false)
    } catch (err) {
      console.error(err)
      setError('Failed to load event. Please try again.')
      setLoading(false)
    }
  }

  function copyLink() {
    const link = `${window.location.origin}/event/${eventId}`
    navigator.clipboard.writeText(link)
    alert('Link copied to clipboard!')
  }

  function handleAddAvailability() {
    if (!user) {
      // Store the current event ID to redirect back after login
      localStorage.setItem('redirectAfterLogin', `/event/${eventId}`)
      navigate('/login')
      return
    }

    // User is logged in, proceed to add availability
    submitAvailability()
  }

  async function submitAvailability() {
    if (!user) return

    try {
      const slots = []
      const startH = parseInt(event.startTime.split(':')[0])
      
      cellsActive.forEach((dayArr, dayIndex) => {
        const dayNum = event.selectedDays[dayIndex]
        dayArr.forEach((isActive, slotIndex) => {
          if (isActive) {
            const slotHour = startH + Math.floor(slotIndex / 4)
            const slotMin = (slotIndex % 4) * 15
            const slotDate = new Date(event.year, event.month, dayNum, slotHour, slotMin)
            slots.push(slotDate.toISOString())
          }
        })
      })

      if (slots.length === 0) {
        alert('Please select at least one time slot')
        return
      }

      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/availabilities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          slots,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to submit availability')
        return
      }

      alert('Availability submitted successfully!')
      setCellsActive(cellsActive.map(arr => arr.map(() => false)))
      fetchEventData()
    } catch (err) {
      console.error(err)
      alert('Failed to submit availability. Please try again.')
    }
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
    if (!event) return
    const { selectedDays, month, year } = event
    const startH = parseInt(event.startTime.split(':')[0])
    const endH = parseInt(event.endTime.split(':')[0])

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

    const busyByDay = new Map()
    events.forEach((ev) => {
      if (!ev.start?.dateTime || !ev.end?.dateTime) return
      const evStart = new Date(ev.start.dateTime)
      const evEnd = new Date(ev.end.dateTime)

      selectedDays.forEach((dayNum, dayIndex) => {
        if (evStart.getDate() === dayNum && evStart.getMonth() === month && evStart.getFullYear() === year) {
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

    setCellsActive((prev) =>
      prev.map((arr, dayIndex) => {
        const busy = busyByDay.get(dayIndex) || new Set()
        return arr.map((_, slot) => !busy.has(slot))
      })
    )

    alert(`Imported ${events.length} events from your Google Calendar.`)
  }

  function getAvailabilityCount(dayIndex, slotIndex) {
    if (!event) return 0
    const startH = parseInt(event.startTime.split(':')[0])
    const dayNum = event.selectedDays[dayIndex]
    const slotHour = startH + Math.floor(slotIndex / 4)
    const slotMin = (slotIndex % 4) * 15
    const slotDate = new Date(event.year, event.month, dayNum, slotHour, slotMin)
    
    return availabilities.filter(avail => 
      avail.slots.some(slot => {
        const slotTime = new Date(slot)
        return slotTime.getTime() === slotDate.getTime()
      })
    ).length
  }

  function getAvailableNames(dayIndex, slotIndex) {
    if (!event) return []
    const startH = parseInt(event.startTime.split(':')[0])
    const dayNum = event.selectedDays[dayIndex]
    const slotHour = startH + Math.floor(slotIndex / 4)
    const slotMin = (slotIndex % 4) * 15
    const slotDate = new Date(event.year, event.month, dayNum, slotHour, slotMin)
    
    return availabilities
      .filter(avail => 
        avail.slots.some(slot => {
          const slotTime = new Date(slot)
          return slotTime.getTime() === slotDate.getTime()
        })
      )
      .map(avail => avail.userId?.userName || avail.userId?.email || 'Anonymous')
  }

  function getCellColor(dayIndex, slotIndex) {
    const count = getAvailabilityCount(dayIndex, slotIndex)
    const total = availabilities.length
    if (count === 0) return 'transparent'
    const intensity = total > 0 ? count / total : 0
    const r = Math.round(240 - (240 - 106) * intensity)
    const g = Math.round(220 - (220 - 27) * intensity)
    const b = Math.round(255 - (255 - 154) * intensity)
    return `rgb(${r}, ${g}, ${b})`
  }

  function setCell(dayIndex, slotIndex, value) {
    setCellsActive(prev => {
      const next = prev.map(row => row.slice())
      next[dayIndex][slotIndex] = value
      return next
    })
  }

  function handleCellMouseDown(dayIndex, slotIndex, e) {
    e.preventDefault()
    if (!user) {
      alert('Please login or sign up to add your availability')
      localStorage.setItem('redirectAfterLogin', `/event/${eventId}`)
      navigate('/login')
      return
    }
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

  if (loading) {
    return (
      <div className="availability-page">
        <div className="main">
          <p>Loading event...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="availability-page">
        <div className="main">
          <h2>Event Not Found</h2>
          <p>{error || 'This event does not exist or has been deleted.'}</p>
          <button onClick={() => navigate('/home')}>Go to Home</button>
        </div>
      </div>
    )
  }

  const startH = parseInt(event.startTime.split(':')[0])
  const endH = parseInt(event.endTime.split(':')[0])
  const totalCells = (endH - startH) * 4

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
                <h1>{event.title}</h1>
                <span>{event.dateRange}</span>
              </div>
            </div>
            <div className="header-right">
              <button className="btn" onClick={copyLink}>
                Copy link
              </button>
              <button className="btn primary" onClick={handleAddAvailability}>
                {user ? 'Submit Availability' : 'Login to Submit'}
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
            <div className="time-labels">
              {Array.from({ length: endH - startH + 1 }, (_, i) => {
                const h = startH + i
                const ampm = h >= 12 ? 'PM' : 'AM'
                const display = ((h + 11) % 12) + 1
                return (
                  <div className="time-label" key={h} style={{ top: `${i * 26 * 4}px` }}>
                    {display} {ampm}
                  </div>
                )
              })}
            </div>

            <div className="day-columns">
              {event.selectedDays.map((dayNum, dayIndex) => {
                const dateObj = new Date(event.year, event.month, dayNum)
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
                    <div className="day-grid" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
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
                            onMouseDown={(e) => handleCellMouseDown(dayIndex, slotIndex, e)}
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
          <div className="responses-box">
            <h3 id="responseHeader">Responses ({availabilities.length})</h3>
            <ul className="muted" style={{ paddingLeft: 18, margin: '8px 0 0' }}>
              {availabilities.map((avail, i) => (
                <li key={i}>
                  {avail.userId?.userName || avail.userId?.email || 'Anonymous'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
