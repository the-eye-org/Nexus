import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GammaWave.css';

const GammaWave = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // ASCII Art with hidden binary in whitespace
  const asciiArt = `
    ╔═══════════════════════════════════════════════════════════╗
    ║          GAMMA WAVE ANALYSIS - CONTAINMENT BREACH         ║
    ╠═══════════════════════════════════════════════════════════╣
    ║                                                           ║
    ║    ░░░▒▒▒▓▓▓███████▓▓▓▒▒▒░░░                             ║
    ║  ░░▒▒▓▓████████████████████▓▓▒▒░░                        ║
    ║ ░▒▓███████████████████████████▓▒░   01001000             ║
    ║░▒▓██████████████████████████████▓▒░                      ║
    ║▒▓████████████████████████████████▓▒  01010101            ║
    ║▓███████████████████████████████████▓                     ║
    ║████████████████████████████████████  01001100            ║
    ║▓███████████████████████████████████▓                     ║
    ║▒▓████████████████████████████████▓▒  01001011            ║
    ║░▒▓██████████████████████████████▓▒░                      ║
    ║ ░▒▓███████████████████████████▓▒░                        ║
    ║  ░░▒▒▓▓████████████████████▓▓▒▒░░                        ║
    ║    ░░░▒▒▒▓▓▓███████▓▓▓▒▒▒░░░                             ║
    ║                                                           ║
    ║         [RADIATION SIGNATURE DETECTED]                   ║
    ║              Decryption Required...                       ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
  `;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedInput = inputValue.trim().toUpperCase();
    
    if (trimmedInput === 'HULK') {
      setShowError(true);
      setErrorMessage('Too predictable. Try anger.');
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      
      // Show hint only after at least 2 failed attempts
      if (nextAttempts >= 2) {
        setTimeout(() => {
          setShowHint(true);
        }, 2000);
      }
    } else if (trimmedInput === 'GREEN_SMASH' || trimmedInput === 'GREENSMASH') {
      // Success! Navigate to final submission
      navigate('/hulk_final');
    } else {
      setShowError(true);
      setErrorMessage('Invalid gamma signature. Try again.');
      setAttempts(prev => prev + 1);
    }
    
    setInputValue('');
  };

  return (
    <div className="gamma-wave-container">
      {/* Animated background */}
      <div className="wave-animation"></div>
      <div className="radiation-overlay"></div>

      {/* Header */}
      <div className="gamma-header">
        <h1 className="pulse-text">⚡ GAMMA WAVE ANALYZER ⚡</h1>
        <p className="system-status">SYSTEM STATUS: DECRYPTING WAVEFORM</p>
      </div>

      {/* Main Content */}
      <div className="content-wrapper">
        {/* ASCII Art Display */}
        <div className="ascii-container">
          <pre className="ascii-art">{asciiArt}</pre>
          <div className="scan-line"></div>
        </div>

        {/* Analysis Section */}
        <div className="analysis-section">
          <div className="info-panel">
            <h3>🔬 WAVEFORM ANALYSIS</h3>
            <p className="analysis-text">
              The gamma radiation has created a unique signature pattern. 
              Dr. Banner's systems have detected binary sequences embedded 
              within the waveform structure.
            </p>
            <div className="data-points">
              <div className="data-item">
                <span className="label">Radiation Type:</span>
                <span className="value">Gamma</span>
              </div>
              <div className="data-item">
                <span className="label">Frequency:</span>
                <span className="value">9.2 GHz</span>
              </div>
              <div className="data-item">
                <span className="label">Encryption:</span>
                <span className="value">Binary-8</span>
              </div>
            </div>
          </div>

          {/* Binary Hint Box */}
          <div className="binary-hint-box">
            <h4>📊 DETECTED SEQUENCES</h4>
            <div className="binary-sequences">
              <code>01001000</code>
              <code>01010101</code>
              <code>01001100</code>
              <code>01001011</code>
            </div>
            <p className="hint-small">
              💡 Hint: Convert binary to ASCII characters
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="decode-form">
            <label htmlFor="gamma-input" className="form-label">
              ENTER DECODED SIGNATURE:
            </label>
            <div className="input-group">
              <input
                id="gamma-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter decoded text..."
                className="gamma-input"
                autoComplete="off"
              />
              <button type="submit" className="decode-button">
                DECRYPT
              </button>
            </div>
          </form>

          {/* Error Message */}
          {showError && (
            <div className="error-message">
              <div className="error-icon">⚠️</div>
              <p className="error-text">{errorMessage}</p>
            </div>
          )}

          {/* Hidden Hint (appears after HULK attempt) */}
          {showHint && (
            <div className="secret-hint">
              <div className="hint-glow">
                <p className="opacity-hint">
                  Dr. Banner's encrypted note: "green_smash"
                </p>
              </div>
              <p className="hint-description">
                💭 Sometimes the answer isn't what's obvious... 
                it's what the Hulk would do.
              </p>
            </div>
          )}

          {/* Helper Text */}
          <div className="helper-section">
            <p className="helper-text">
              🧪 The waveform contains hidden messages. Look carefully at the 
              binary sequences on the right side of the waveform pattern.
            </p>
            {attempts > 2 && !showHint && (
              <p className="extra-hint">
                💡 Decoded the binary but still stuck? Think about what makes the Hulk... the Hulk.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="gamma-footer">
        <div className="stats">
          <span>Attempts: {attempts}</span>
          <span>Status: {showError ? 'FAILED' : 'ANALYZING'}</span>
        </div>
        <button 
          className="back-btn"
          onClick={() => navigate('/hulk')}
        >
          ← Back to Chamber
        </button>
      </div>
    </div>
  );
};

export default GammaWave;