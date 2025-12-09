// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import CreateEvent from './pages/CreateEvent'
import Availability from './pages/Availability'
import SaveMeeting from './pages/SaveMeeting'
import Register from './pages/Register'
import EventView from './pages/EventView'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<Home />} />
      <Route path="/availability" element={<Availability />} />
      <Route path="/create" element={<CreateEvent />} />
      <Route path="/event/:eventId" element={<EventView />} />
      <Route path="/event/:eventId/summary" element={<SaveMeeting />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}

export default App
