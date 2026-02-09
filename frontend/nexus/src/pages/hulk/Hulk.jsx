import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hulk.css';

const Hulk = () => {
  const navigate = useNavigate();
  const [gauges, setGauges] = useState([
    { id: 1, value: 50, speed: 0.5 },
    { id: 2, value: 30, speed: 0.7 },
    { id: 3, value: 70, speed: 0.6 },
    { id: 4, value: 40, speed: 0.8 },
    { id: 5, value: 60, speed: 0.4 }
  ]);
  
  const [showButton, setShowButton] = useState(false);
  const [buttonTimer, setButtonTimer] = useState(null);
  const [hoveredGauge, setHoveredGauge] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const animationRef = useRef(null);

  // Animate gauges continuously
  useEffect(() => {
    const animate = () => {
      setGauges(prevGauges => 
        prevGauges.map(gauge => {
          let newValue = gauge.value + (Math.random() - 0.5) * gauge.speed * 10;
          
          // Keep values between 0 and 100
          if (newValue > 100) newValue = 100;
          if (newValue < 0) newValue = 0;
          
          return { ...gauge, value: newValue };
        })
      );
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Check for perfect hover condition
  const handleGaugeHover = (gaugeId, value) => {
    setHoveredGauge(gaugeId);
    
    // Perfect condition: Gauge 3 between 65-75 while hovering
    if (gaugeId === 3 && value >= 65 && value <= 75 && !showButton) {
      triggerButton();
    }
  };

  const triggerButton = () => {
    setShowButton(true);
    
    // Hide button after 1 second
    const timer = setTimeout(() => {
      setShowButton(false);
    }, 1000);
    
    setButtonTimer(timer);
  };

  const handleButtonClick = () => {
    if (buttonTimer) {
      clearTimeout(buttonTimer);
    }
    navigate('/gamma_wave');
  };

  const handleGaugeLeave = () => {
    setHoveredGauge(null);
  };

  return (
    <div className="hulk-container">
      {/* Background effects */}
      <div className="gamma-particles"></div>
      <div className="radiation-pulse"></div>
      
      {/* Header */}
      <div className="hulk-header">
        <h1 className="glitch-text" data-text="GAMMA CONTAINMENT CHAMBER">
          GAMMA CONTAINMENT CHAMBER
        </h1>
        <p className="warning-text">⚠️ RADIATION LEVELS CRITICAL ⚠️</p>
      </div>

      {/* Story Section */}
      <div className="story-section">
        <div className="story-card">
          <img 
            src="/assets/hulk-icon.png" 
            alt="Hulk" 
            className="character-icon"
            onError={(e) => e.target.style.display = 'none'}
          />
          <h2>🟢 BRUCE BANNER'S CHALLENGE</h2>
          <p className="story-text">
            The Gamma Chamber is unstable. Radiation levels are fluctuating wildly. 
            You must monitor the containment gauges and find the perfect moment to 
            stabilize the system. One wrong move and the Hulk emerges...
          </p>
          <div className="difficulty-badge">DIFFICULTY: HARD</div>
        </div>
      </div>

      {/* Gauges Container */}
      <div className="gauges-container">
        <h3 className="section-title">RADIATION GAUGES</h3>
        <p className="hint-text">Monitor the readings carefully... hover at the right moment...</p>
        
        <div className="gauges-grid">
          {gauges.map((gauge) => (
            <div 
              key={gauge.id}
              className={`gauge-wrapper ${hoveredGauge === gauge.id ? 'hovered' : ''}`}
              onMouseEnter={() => handleGaugeHover(gauge.id, gauge.value)}
              onMouseLeave={handleGaugeLeave}
            >
              <div className="gauge-label">GAUGE {gauge.id}</div>
              <div className="gauge-meter">
                <div 
                  className="gauge-fill"
                  style={{ 
                    height: `${gauge.value}%`,
                    backgroundColor: gauge.value > 80 ? '#ff0000' : 
                                    gauge.value > 50 ? '#ffaa00' : '#00ff00'
                  }}
                >
                  <div className="gauge-shimmer"></div>
                </div>
                <div className="gauge-value">{Math.round(gauge.value)}%</div>
              </div>
              <div className="gauge-reading">
                {gauge.value > 80 ? 'CRITICAL' : 
                 gauge.value > 50 ? 'WARNING' : 'STABLE'}
              </div>
            </div>
          ))}
        </div>

        {/* Hidden Button */}
        {showButton && (
          <div className="hidden-button-container">
            <button 
              className="gamma-stabilize-button"
              onClick={handleButtonClick}
            >
              ⚡ STABILIZE GAMMA CORE ⚡
            </button>
          </div>
        )}
      </div>

      {/* Hints Section */}
      <div className="hints-container">
        <div className="hint-box">
          <p className="encrypted-hint">
            /* SYSTEM LOG: Gauge synchronization detected at 0x47414D4D41 */
          </p>
          <p className="subtle-hint">
            Dr. Banner's notes: "The third reading holds the key..."
          </p>
        </div>
        {attempts > 3 && (
          <div className="help-text">
            💡 Try hovering over Gauge 3 when its value is between 65-75%
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="hulk-footer">
        <p>Attempts: {attempts}</p>
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← Back to Avengers
        </button>
      </div>
    </div>
  );
};

export default Hulk;