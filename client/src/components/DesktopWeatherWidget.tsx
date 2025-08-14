import { useState, useEffect } from 'react';
import { useDraggable } from '@/hooks/useDraggable';

const weatherTypes = [
  { value: 'sunny', emoji: '☀️', label: 'Sunny' },
  { value: 'cloudy', emoji: '☁️', label: 'Cloudy' },
  { value: 'rainy', emoji: '🌧️', label: 'Rainy' },
  { value: 'snowy', emoji: '❄️', label: 'Snowy' },
  { value: 'stormy', emoji: '⛈️', label: 'Stormy' },
];

export default function DesktopWeatherWidget() {
  const [weather, setWeather] = useState<string>('sunny');
  const [temperature, setTemperature] = useState<number>(72);
  const [location, setLocation] = useState<string>('Your Location');
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualWeather, setManualWeather] = useState(weather);
  const [manualTemp, setManualTemp] = useState(temperature.toString());
  const [manualLocation, setManualLocation] = useState(location);

  const [position, setPosition] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth - 200 : 100, 
    y: 50 
  });
  
  const { ref, isDragging } = useDraggable({
    onDrag: (newPosition) => setPosition(newPosition)
  });

  // Get current weather automatically when component mounts
  useEffect(() => {
    getCurrentWeather();
  }, []);

  const getCurrentWeather = async () => {
    try {
      // For demo purposes, we'll simulate weather data based on current time/date
      const now = new Date();
      const hour = now.getHours();
      const month = now.getMonth();
      
      let simulatedWeather = 'sunny';
      let simulatedTemp = 72;
      
      // Simple weather simulation based on time and season
      if (hour < 6 || hour > 20) {
        simulatedWeather = 'cloudy';
        simulatedTemp -= 10;
      } else if (month >= 11 || month <= 2) {
        // Winter months
        simulatedWeather = Math.random() > 0.5 ? 'snowy' : 'cloudy';
        simulatedTemp = Math.floor(Math.random() * 40) + 20; // 20-60°F
      } else if (month >= 6 && month <= 8) {
        // Summer months
        simulatedWeather = Math.random() > 0.3 ? 'sunny' : 'cloudy';
        simulatedTemp = Math.floor(Math.random() * 30) + 70; // 70-100°F
      } else {
        // Spring/Fall
        simulatedWeather = Math.random() > 0.4 ? 'sunny' : Math.random() > 0.5 ? 'cloudy' : 'rainy';
        simulatedTemp = Math.floor(Math.random() * 40) + 50; // 50-90°F
      }

      setWeather(simulatedWeather);
      setTemperature(simulatedTemp);
      setLocation('Your Location');
    } catch (error) {
      console.error('Weather error:', error);
    }
  };

  const handleManualSave = () => {
    const temp = manualTemp ? parseInt(manualTemp) : 72;
    setWeather(manualWeather);
    setTemperature(temp);
    setLocation(manualLocation);
    setIsManualMode(false);
  };

  const currentWeatherType = weatherTypes.find(w => w.value === weather);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 100
      }}
      className="mac-widget"
      data-testid="weather-widget"
    >
      <div className="mac-widget-header mac-window-title-bar">
        <span 
          className="mac-widget-title"
          style={{ fontFamily: '"Press Start 2P", Monaco, monospace', fontSize: '6px' }}
        >
          WEATHER
        </span>
        <button
          type="button"
          onClick={() => {
            setManualWeather(weather);
            setManualTemp(temperature.toString());
            setManualLocation(location);
            setIsManualMode(!isManualMode);
          }}
          className="mac-widget-btn"
          data-testid="weather-toggle"
          style={{ fontFamily: '"Press Start 2P", Monaco, monospace', fontSize: '5px' }}
        >
          {isManualMode ? 'AUTO' : 'EDIT'}
        </button>
      </div>
      
      <div className="mac-widget-content">
        {!isManualMode ? (
          <div className="flex items-center gap-2">
            {currentWeatherType && (
              <span style={{ fontSize: '16px' }} title={currentWeatherType.label}>
                {currentWeatherType.emoji}
              </span>
            )}
            <div className="flex flex-col">
              <span 
                className="text-xs font-bold"
                style={{ fontFamily: '"Press Start 2P", Monaco, monospace', fontSize: '6px' }}
              >
                {temperature}°F
              </span>
              <span 
                className="text-xs"
                style={{ fontFamily: '"Press Start 2P", Monaco, monospace', fontSize: '5px' }}
              >
                {location}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex gap-1">
              {weatherTypes.map((weatherType) => (
                <button
                  key={weatherType.value}
                  type="button"
                  data-testid={`weather-${weatherType.value}`}
                  onClick={() => setManualWeather(weatherType.value)}
                  className={`
                    px-1 py-1 text-xs border border-black
                    ${manualWeather === weatherType.value 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black hover:bg-gray-200'
                    }
                  `}
                  style={{ fontSize: '8px', minHeight: '16px' }}
                  title={weatherType.label}
                >
                  {weatherType.emoji}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <input
                type="number"
                data-testid="weather-temperature"
                value={manualTemp}
                onChange={(e) => setManualTemp(e.target.value)}
                placeholder="°F"
                className="w-full px-1 text-xs border border-black bg-white"
                style={{
                  fontFamily: '"Press Start 2P", Monaco, monospace',
                  fontSize: '5px',
                  height: '14px'
                }}
              />
              <input
                type="text"
                data-testid="weather-location"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                placeholder="Location"
                className="w-full px-1 text-xs border border-black bg-white"
                style={{
                  fontFamily: '"Press Start 2P", Monaco, monospace',
                  fontSize: '5px',
                  height: '14px'
                }}
              />
              <button
                type="button"
                data-testid="weather-save"
                onClick={handleManualSave}
                className="px-2 py-0 text-xs bg-white text-black border border-black hover:bg-gray-200"
                style={{
                  fontFamily: '"Press Start 2P", Monaco, monospace',
                  fontSize: '5px',
                  minHeight: '14px'
                }}
              >
                SAVE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}