import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function MeetingSummary() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [determinedTime, setDeterminedTime] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [eventId]);

  const fetchSummary = async () => {
    try {
      const res = await fetch(`http://localhost:50001/api/events/${eventId}/summary`);
      const data = await res.json();
      setSummary(data);
      if (data.event.determinedTime) {
        setDeterminedTime(data.event.determinedTime);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const finalizeMeeting = async () => {
    try {
      const res = await fetch(`http://localhost:50001/api/events/${eventId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ determinedTime })
      });

      if (res.ok) {
        alert('Meeting finalized successfully!');
        fetchSummary(); // Refresh
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error('Failed to finalize:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!summary) return <div>Event not found</div>;

  const { event, availabilities, totalResponses } = summary;

  return (
    <div style={{ padding: '20px' }}>
      <h1>{event.title}</h1>
      <p>{event.description}</p>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Event Window</h3>
        <p>Start: {new Date(event.window.start).toLocaleString()}</p>
        <p>End: {new Date(event.window.end).toLocaleString()}</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Availability Responses: {totalResponses}</h3>
        {availabilities.map((avail) => (
          <div key={avail._id} style={{ marginLeft: '20px' }}>
            <strong>{avail.userId?.userName || 'Unknown'}</strong>
            <p>Slots: {avail.slots.length} time blocks</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', borderTop: '2px solid #ccc', paddingTop: '20px' }}>
        <h3>Finalize Meeting</h3>
        {event.status === 'finalized' ? (
          <div>
            <p style={{ color: 'green' }}>✅ Meeting Finalized</p>
            <p><strong>Time:</strong> {new Date(event.determinedTime).toLocaleString()}</p>
          </div>
        ) : (
          <div>
            <label>
              Choose Final Time:
              <input
                type="datetime-local"
                value={determinedTime ? new Date(determinedTime).toISOString().slice(0, 16) : ''}
                onChange={(e) => setDeterminedTime(new Date(e.target.value).toISOString())}
                style={{ marginLeft: '10px', padding: '5px' }}
              />
            </label>
            <button onClick={finalizeMeeting} style={{ marginLeft: '10px', padding: '5px 15px' }}>
              Save Meeting
            </button>
          </div>
        )}
      </div>

      <button onClick={() => navigate('/home')} style={{ marginTop: '20px' }}>
        Back to Home
      </button>
    </div>
  );
}
