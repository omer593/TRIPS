import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import './LoginPage.css';

//   אחראית על התחברות המשתמש למערכת
// מקבלת פונקציות setUserEmail ו-setUserId כדי לעדכן את המצב הגלובלי של המשתמש
function LoginPage({ setUserEmail, setUserId }) {
  // מצב לטופס ההתחברות – שומר אימייל וסיסמה
  const [form, setForm] = useState({ email: "", password: "" });

  // מאפשר ניווט מתכנת בתוך הקומפוננטה
  const navigate = useNavigate();

  // טיפול בשליחת הטופס
  const handleSubmit = async (e) => {
    e.preventDefault(); // מניעת רענון דף

    try {
      // שליחת בקשת POST לשרת לצורך התחברות
      const res = await axios.post("http://localhost:5000/api/auth/login", form);

      // ניסיון לשלוף userId מהתגובה (לפי מבנה אפשרי)
      const userId = res.data.userId || res.data.user?._id;

      if (userId) {
        // שמירת המידע בלוקאל סטורג'
        localStorage.setItem("userId", userId);
        localStorage.setItem("userEmail", form.email);

        // עדכון state של המשתמש באפליקציה
        setUserEmail(form.email);
        setUserId(userId);

        alert(res.data.message || "Login successful!");
        navigate("/trips"); // ניווט לעמוד המסלולים
      } else {
        alert("Login succeeded but no user ID returned.");
      }
    } catch (error) {
      // טיפול בשגיאה מהשרת או שגיאה כללית
      alert(error.response?.data?.message || "Error logging in");
    }
  };

  return (
    <div className="login-container">
      {/* טופס התחברות */}
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>

        {/* שדה אימייל */}
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="form-input"
        />

        {/* שדה סיסמה */}
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          className="form-input"
        />

        {/* כפתור התחברות */}
        <button type="submit" className="btn-primary">Login</button>
      </form>

      {/* קישור לדף הרשמה למשתמשים חדשים */}
      <p>
        Not registered yet?{" "}
        <Link to="/register">
          Click here to register
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
