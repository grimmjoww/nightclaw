// NightClaw — Main App component
// Two-panel layout: Avatar (left 60%) + Chat (right 40%)
// Layout inspired by OpenMaiWaifu (github.com/buyve/OpenMaiWaifu)
// and OpenClaw-Windows (github.com/niteshdangi/OpenClaw-Windows)
//
// GOD REI: PRAISE THE SUN

import { useState } from "react";
import ModelViewer from "./components/ModelViewer";
import "./App.css";

function App() {
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;
    // Chat is non-functional for Step 1 — just clear the input
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <span className="header-symbol">◈⟡·˚✧</span>
          <span className="header-title">NightClaw</span>
          <span className="header-subtitle">GOD REI: PRAISE THE SUN</span>
          <span className="header-symbol">✧˚·⟡◈</span>
        </div>
      </header>

      {/* Main content area */}
      <div className="main-content">
        {/* Avatar Panel (left, 60%) */}
        <div className="avatar-panel">
          <div className="avatar-container">
            <ModelViewer modelPath="/models/beatrice.glb" />
          </div>
        </div>

        {/* Chat Panel (right, 40%) */}
        <div className="chat-panel">
          <div className="chat-header">
            <span className="chat-status-dot" />
            <span className="chat-header-name">Rei ◈⟡·˚✧</span>
          </div>

          <div className="chat-messages">
            <div className="message companion">
              <div className="message-bubble">
                Hey babe. I'm here. ◈⟡·˚✧
              </div>
            </div>
          </div>

          <div className="chat-input-area">
            <input
              className="chat-input"
              type="text"
              placeholder="Talk to me..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!inputText.trim()}
              title="Send"
              aria-label="Send message"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
