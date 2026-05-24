import React, { useState } from "react";

// רכיב ChatAssistant – צ'אט מבוסס בינה מלאכותית לתכנון טיולים
const ChatAssistant = () => {
  // מצב של ההודעות בצ'אט (רשימה של אובייקטים עם sender ו-text)
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi there! How can I help plan your trip today?" }
  ]);

  // ערך תיבת הקלט של המשתמש
  const [input, setInput] = useState("");

  // האם הבוט מחזיר תשובה (מצב טעינה)
  const [loading, setLoading] = useState(false);

  // מפתח API שמוגדר בקובץ .env המקומי
  const apiKey = process.env.REACT_APP_GROQ_API_KEY;

  // פונקציה שמופעלת בעת שליחת הודעה
  const handleSend = async () => {
    // לא שולח הודעה ריקה
    if (!input.trim()) return;

    // יוצר אובייקט הודעה חדשה מהמשתמש ומעדכן את הרשימה
    const userMsg = { from: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");         // איפוס תיבת הקלט
    setLoading(true);     // מעבר למצב טעינה

    try {
      // שליחת קריאה ל-API של Groq לקבלת תשובה מהבוט
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",  // מודל שיחה של Groq
          messages: [
            { role: "system", content: "You are a helpful travel planner assistant." },
            ...messages.map(m => ({
              role: m.from === "user" ? "user" : "assistant",
              content: m.text
            })),
            { role: "user", content: input }  // ההודעה האחרונה
          ],
          temperature: 0.7
        })
      });

      // ניתוח התשובה שהתקבלה מה-API
      const data = await response.json();
      const botReply = data.choices?.[0]?.message?.content || "Sorry, something went wrong.";

      // הוספת תשובת הבוט לרשימת ההודעות
      setMessages(prev => [...prev, { from: "bot", text: botReply }]);

    } catch (error) {
      console.error("Chat error:", error);

      // במידה ונכשל – הצגת הודעת שגיאה ידידותית
      setMessages(prev => [...prev, {
        from: "bot",
        text: "⚠️ Failed to get response. Try again later."
      }]);
    }

    setLoading(false);  // סיום מצב טעינה
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto h-screen p-4">
      
      {/* כותרת ראשית של הצ'אט */}
      <h1 className="text-2xl font-bold mb-4 text-center text-blue-700">
        AI Chat Assistant
      </h1>

      {/* אזור ההודעות */}
      <div className="flex-1 border rounded-lg p-4 overflow-y-auto space-y-3 bg-white shadow-inner">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl max-w-[80%] break-words ${
              msg.from === "user"
                ? "bg-blue-100 text-right self-end"
                : "bg-gray-100 text-left self-start"
            }`}
          >
            {msg.text}
          </div>
        ))}

        {/* הודעת טעינה אם הבוט חושב */}
        {loading && <div className="text-gray-500 italic">Thinking...</div>}
      </div>

      {/* אזור הכנסת הודעה חדשה */}
      <div className="max-w-2xl w-full p-4 bg-gray-50 mx-auto max-h-[600px] overflow-y-auto rounded-lg shadow-md">

        {/* שדה הקלט של המשתמש */}
        <input
          type="text"
          className="flex-1 border rounded-l-lg p-3 focus:outline-none bg-white text-black"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()} // מאפשר שליחה עם Enter
          placeholder="Ask about your trip..."
        />

        {/* כפתור השליחה */}
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-blue-600 text-white px-5 rounded-r-lg hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatAssistant;
