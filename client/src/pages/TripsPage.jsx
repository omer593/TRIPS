// TripsPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MapView from '../components/MapView';

function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newRoute, setNewRoute] = useState({
    name: '',
    startDate: '',
    endDate: '',
    destinations: '',
  });

  const [creating, setCreating] = useState(false);
  const [editingTripId, setEditingTripId] = useState(null);

  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  
  console.log('TripsPage loaded, userId:', userId);

  const fetchTrips = useCallback(() => {
    console.log('fetchTrips called for userId:', userId);
    setLoading(true);
    axios
      .get(`http://localhost:5000/api/routes/user/${userId}`)
      .then((res) => {
        console.log('API Response:', res.data);
        setTrips(res.data.routes);
        setLoading(false);
      })
      .catch((error) => {
        console.log('API Error:', error);
        setError('Error loading trips');
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    console.log('useEffect running, userId:', userId);
    if (!userId) {
      console.log('No userId found, redirecting to login');
      navigate('/login');
      return;
    }
    fetchTrips();
  }, [userId, navigate, fetchTrips]);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!newRoute.name || !newRoute.startDate || !newRoute.endDate) {
      alert('Please fill all required fields');
      return;
    }

    // המרה למערך, סינון ריקים ובדיקת מינימום 2 יעדים
    const destinationsArray = newRoute.destinations
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d !== '');

    if (destinationsArray.length < 2) {
      alert('Please enter at least two destinations, separated by commas');
      return;
    }

    setCreating(true);

    try {
      const payload = {
        name: newRoute.name,
        startDate: newRoute.startDate,
        endDate: newRoute.endDate,
        destinations: destinationsArray,
        userId,
      };

      if (editingTripId) {
        await axios.put(`http://localhost:5000/api/routes/${editingTripId}`, payload);
        alert('Route updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/routes/create', payload);
        alert('Route created successfully');
      }

      setNewRoute({ name: '', startDate: '', endDate: '', destinations: '' });
      setEditingTripId(null);
      fetchTrips();
    } catch (error) {
      alert('Error saving route');
    }

    setCreating(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/routes/${id}`);
      alert('Route deleted successfully');
      fetchTrips();
    } catch (error) {
      alert('Error deleting route');
    }
  };

  const handleEdit = (trip) => {
    setNewRoute({
      name: trip.name,
      startDate: trip.startDate.slice(0, 10),
      endDate: trip.endDate.slice(0, 10),
      destinations: trip.destinations.join(', '),
    });
    setEditingTripId(trip._id);
  };

  if (loading) return <p>Loading trips...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Trips Page</h1>

      {/* טופס יצירה / עריכה */}
      <form onSubmit={handleCreate} style={{ marginBottom: '20px' }}>
        <h2>{editingTripId ? 'Edit Route' : 'Create New Route'}</h2>
        <input
          type="text"
          placeholder="Route Name"
          value={newRoute.name}
          onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
          required
        />
        <br />
        <input
          type="date"
          value={newRoute.startDate}
          onChange={(e) => setNewRoute({ ...newRoute, startDate: e.target.value })}
          required
        />
        <br />
        <input
          type="date"
          value={newRoute.endDate}
          onChange={(e) => setNewRoute({ ...newRoute, endDate: e.target.value })}
          required
        />
        <br />
        <input
          type="text"
          placeholder="Destinations (comma separated, at least 2)"
          value={newRoute.destinations}
          onChange={(e) => setNewRoute({ ...newRoute, destinations: e.target.value })}
        />
        <br />
        <button type="submit" disabled={creating}>
          {creating ? 'Saving...' : editingTripId ? 'Update Route' : 'Create Route'}
        </button>
        {editingTripId && (
          <button
            type="button"
            onClick={() => {
              setNewRoute({ name: '', startDate: '', endDate: '', destinations: '' });
              setEditingTripId(null);
            }}
            style={{ marginLeft: '10px' }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* רשימת המסלולים */}
      {trips.length === 0 ? (
        <p>No trips found</p>
      ) : (
        <ul>
          {trips.map((trip) => (
            <li key={trip._id} style={{ marginBottom: '40px' }}>
              <strong>{trip.name}</strong>
              <br />
              {new Date(trip.startDate).toLocaleDateString()} -{' '}
              {new Date(trip.endDate).toLocaleDateString()}
              <br />
              Destinations: {trip.destinations.join(', ')}
              <br />
              <button onClick={() => handleEdit(trip)} style={{ marginRight: '5px', marginTop: '5px' }}>
                Edit
              </button>
              <button onClick={() => handleDelete(trip._id)} style={{ marginTop: '5px' }}>
                Delete
              </button>

              {/* מפת המסלול מתחת למסלול */}
              {trip.destinations.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <MapView
                    destinations={trip.destinations.map((city) => ({
                      name: city,
                    }))}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TripsPage;
