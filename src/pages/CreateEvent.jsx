// src/pages/CreateEvent.jsx
import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/create-event.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001'

export default function CreateEvent() {
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selected, setSelected] = useState([])
  const navigate = useNavigate()

  // drag state for date selection
  const draggingRef = useRef(false)
  const addModeRef = useRef(true) // true = selecting, false = deselecting

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthLabel = useMemo(
    () => currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
    [currentDate]
  )

  // Build calendar cells with weekday headers + leading blanks
  const { cells } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay() // 0=Sun..6=Sat
    const blanks = (firstDay + 6) % 7 // Monday-first layout
    const cells = []

    // headers: M T W T F S S
    const headers = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => ({
      type: 'hdr',
      key: `hdr-${i}`,
      text: d
    }))
    headers.forEach((h) => cells.push(h))

    // leading blanks
    for (let i = 0; i < blanks; i++) cells.push({ type: 'blank', key: `b-${i}` })

    // month days
    for (let d = 1; d <= daysInMonth; d++) cells.push({ type: 'day', key: `d-${d}`, day: d })

    return { cells }
  }, [year, month])

  // helper to set a specific day selected/unselected
  const setDaySelected = (day, value) => {
    setSelected((prev) => {
      const has = prev.includes(day)
      if (value && !has) return [...prev, day]
      if (!value && has) return prev.filter((x) => x !== day)
      return prev
    })
  }

  function prevMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }

  function nextMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  async function create() {
    if (!title || !start || !end || !selected.length) return alert('Missing fields.')

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
    if (!timeRegex.test(start) || !timeRegex.test(end)) {
      alert('Enter 24h times like 09:00 / 17:30')
      return
    }

    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (!user) {
      alert('Please login to create an event')
      navigate('/login')
      return
    }

    const first = new Date(year, month, Math.min(...selected))
    const last = new Date(year, month, Math.max(...selected))
    const formattedStart = first.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    const formattedEnd = last.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    const dateRange = selected.length > 1 ? `${formattedStart} – ${formattedEnd}` : formattedStart

    // Set window start/end times
    first.setHours(parseInt(start.split(':')[0]), parseInt(start.split(':')[1]), 0, 0)
    last.setHours(parseInt(end.split(':')[0]), parseInt(end.split(':')[1]), 0, 0)

    const eventData = {
      title,
      creator: user._id,
      window: {
        start: first.toISOString(),
        end: last.toISOString()
      },
      startTime: start,
      endTime: end,
      selectedDays: selected,
      month,
      year,
      dateRange
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to create event')
        return
      }

      const eventId = data.event._id
      const adminToken = data.event.adminToken
      navigate(`/availability/${eventId}?admin=${adminToken}`)
    } catch (err) {
      console.error(err)
      alert('Failed to create event. Please try again.')
    }
  }

  // drag handlers for dates
  function handleDayMouseDown(day, e) {
    e.preventDefault() // avoid text selection while dragging
    const willAdd = !selected.includes(day)
    draggingRef.current = true
    addModeRef.current = willAdd
    setDaySelected(day, willAdd)
  }

  function handleDayMouseEnter(day) {
    if (!draggingRef.current) return
    setDaySelected(day, addModeRef.current)
  }

  function handleMouseUp() {
    draggingRef.current = false
  }

  return (
    <div className="ce-page">
      <div className="card">
        <h1>New event</h1>

        <label>Event name</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Planning Meeting"
        />

        <label>What times might work?</label>
        <div className="time-range">
          <input
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder="09:00"
          />{' '}
          to
          <input
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            placeholder="17:00"
          />
        </div>

        <label>What dates might work?</label>
        <p className="helper">Click and drag to select multiple dates</p>

        <div className="calendar-header">
          <button onClick={prevMonth}>&#8249;</button>
          <h3>{monthLabel}</h3>
          <button onClick={nextMonth}>&#8250;</button>
        </div>

        <div
          className="calendar"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {cells.map((cell) => {
            if (cell.type === 'hdr') {
              return (
                <div key={cell.key} className="header">
                  {cell.text}
                </div>
              )
            }
            if (cell.type === 'blank') return <div key={cell.key} />

            const isSelected = selected.includes(cell.day)

            return (
              <div
                key={cell.key}
                className={isSelected ? 'selected' : ''}
                onMouseDown={(e) => handleDayMouseDown(cell.day, e)}
                onMouseEnter={() => handleDayMouseEnter(cell.day)}
              >
                {cell.day}
              </div>
            )
          })}
        </div>

        <div className="actions">
          <button className="cancel-btn" onClick={() => navigate('/home')}>
            Cancel
          </button>
          <button className="create-btn" onClick={create}>
            Create
          </button>
        </div>
      </div>
    </div>
  )
}