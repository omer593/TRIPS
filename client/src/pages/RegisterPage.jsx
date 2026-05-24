import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./RegisterPage.css"; 

//  RegisterPage – מאפשרת למשתמש חדש להירשם למערכת
// מקבלת setUserEmail ו-setUserId לעדכון מצב המשתמש באפליקציה
function RegisterPage({ setUserEmail, setUserId }) {
  // מצב הטופס – שומר את ערכי השם, האימייל והסיסמה
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  // מאפשר ניווט בין דפים באופן תכנותי
  const navigate = useNavigate();

  // טיפול בשליחת הטופס
  const handleSubmit = async (e) => {
    e.preventDefault(); // מניעת רענון דף

    try {
      // קריאה ל-API לצורך הרשמה
      const res = await axios.post("http://localhost:5000/api/auth/register", form);
      const user = res.data.user;

      // אם נרשם משתמש וקיבלנו מזהה שלו
      if (user && user._id) {
        // שמירה בלוקאל סטורג'
        localStorage.setItem("userId", user._id);
        localStorage.setItem("userEmail", user.email); // אפשר גם form.email

        // עדכון מצב המשתמש באפליקציה
        setUserEmail(user.email);
        setUserId(user._id);

        alert(res.data.message || "Registration successful!");
        navigate("/trips"); // מעבר לעמוד המסלולים
      } else {
        alert("Registration succeeded, but no user ID returned.");
      }
    } catch (error) {
      // טיפול בשגיאה – מהשרת או כללית
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    // טופס ההרשמה
    <form className="register-form" onSubmit={handleSubmit}>
      
      {/* שדה שם מלא */}
      <input
        placeholder="Name"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        required
      />

      {/* שדה אימייל */}
      <input
        placeholder="Email"
        type="email"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
        required
      />

      {/* שדה סיסמה */}
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={e => setForm({ ...form, password: e.target.value })}
        required
      />

      {/* כפתור שליחה */}
      <button type="submit" className="btn-primary">Register</button>
    </form>
  );
}

export default RegisterPage;
