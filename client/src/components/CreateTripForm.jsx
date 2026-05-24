import { useState } from "react";
import axios from "axios";

function CreateTripForm({ userId, onTripCreated }) {
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    destinations: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const destinationsArray = form.destinations
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);

      const res = await axios.post("http://localhost:5000/api/routes/create", {
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        destinations: destinationsArray,
        userId: userId,
      });

      alert(res.data.message);
      setForm({ name: "", startDate: "", endDate: "", destinations: "" });
      onTripCreated(); // קורא לטעינת המסלולים מחדש
    } catch (err) {
      setError(err.response?.data?.message || "Error creating trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Trip</h2>
      <input
        name="name"
        placeholder="Trip Name"
        value={form.name}
        onChange={handleChange}
        required
      />
      <input
        name="startDate"
        type="date"
        value={form.startDate}
        onChange={handleChange}
        required
      />
      <input
        name="endDate"
        type="date"
        value={form.endDate}
        onChange={handleChange}
        required
      />
      <input
        name="destinations"
        placeholder="Destinations (comma separated)"
        value={form.destinations}
        onChange={handleChange}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Trip"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

export default CreateTripForm;
