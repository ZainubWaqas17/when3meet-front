import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/home.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '' : 'http://localhost:50001')

export default function Home() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      if (!user) {
        navigate('/login')
        return
      }

      const res = await fetch(`${API_BASE_URL}/api/events?creator=${user._id || user.email}`)
      const data = await res.json()

      if (res.ok && Array.isArray(data)) {
        const sortedEvents = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setEvents(sortedEvents)
      }
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const view = (eventId, adminToken) => {
    if (adminToken) {
      navigate(`/availability/${eventId}?admin=${adminToken}`)
    } else {
      navigate(`/availability/${eventId}`)
    }
  }

  return (
    <div className="home">
      {/* Flowers background */}
      <div className="bottom-decor">
        <div className="flower-gradient"></div>
        <img src="/image.png" alt="Lavender Field" className="bottom-flowers" />
      </div>
      
      <div className="content">
        <header className="header">
          <img src="/logo.png" alt="When3Meet Logo" className="logo" />
          <h1>When3Meet</h1>
        </header>

        <button className="create-btn" onClick={() => navigate('/create')}>
          + Create New Meeting
        </button>

        <section className="meetings-container">
          {loading ? (
            <p className="empty-state">Loading events...</p>
          ) : events.map((e) => (
            <div className="meeting-card" key={e._id}>
              <h3 className="meeting-title">{e.title || 'Untitled'}</h3>
              <p className="meeting-dates">{e.dateRange || 'No dates'}</p>
              <button className="view-btn" onClick={() => view(e._id, e.adminToken)}>View</button>
            </div>
          ))}
        </section>

        {!loading && events.length === 0 && <p className="empty-state">No meetings yet.</p>}
      </div>
    </div>
  )
}
