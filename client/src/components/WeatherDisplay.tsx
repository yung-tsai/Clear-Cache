import { useState, useEffect } from 'react';

interface WeatherDisplayProps {
  weather?: string | null;
  temperature?: number | null;
  location?: string | null;
  onWeatherChange: (weather: string | null, temperature: number | null, location: string | null) => void;
}

const weatherTypes = [
  { value: 'sunny', emoji: '☀️', label: 'Sunny' },
  { value: 'cloudy', emoji: '☁️', label: 'Cloudy' },
  { value: 'rainy', emoji: '🌧️', label: 'Rainy' },
  { value: 'snowy', emoji: '❄️', label: 'Snowy' },
  { value: 'stormy', emoji: '⛈️', label: 'Stormy' },
];

export default function WeatherDisplay({ weather, temperature, location, onWeatherChange }: WeatherDisplayProps) {
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualWeather, setManualWeather] = useState(weather || '');
  const [manualTemp, setManualTemp] = useState(temperature?.toString() || '');
  const [manualLocation, setManualLocation] = useState(location || '');

  // Get current weather automatically when component mounts
  useEffect(() => {
    if (!weather && !isManualMode) {
      getCurrentWeather();
    }
  }, []);

  const getCurrentWeather = async () => {
    try {
      // Get user's location
      if (!navigator.geolocation) {
        setIsManualMode(true);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // For demo purposes, we'll simulate weather data based on current time/date
            // In a real app, you'd use a weather API like OpenWeatherMap
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

            // Get city name (simplified - in real app use reverse geocoding)
            const simulatedLocation = 'Your Location';
            
            onWeatherChange(simulatedWeather, simulatedTemp, simulatedLocation);
          } catch (error) {
            console.error('Weather fetch error:', error);
            setIsManualMode(true);
          }
        },
        () => {
          // Geolocation denied
          setIsManualMode(true);
        }
      );
    } catch (error) {
      console.error('Weather error:', error);
      setIsManualMode(true);
    }
  };

  const handleManualSave = () => {
    const temp = manualTemp ? parseInt(manualTemp) : null;
    onWeatherChange(manualWeather || null, temp, manualLocation || null);
    setIsManualMode(false);
  };

  const currentWeatherType = weatherTypes.find(w => w.value === weather);

  return (
    <div className="mac-toolbar-group">
      <div className="text-xs font-bold mb-1" style={{ fontFamily: '"Press Start 2P", Monaco, monospace' }}>
        Weather:
      </div>
      
      {!isManualMode ? (
        <div className="flex items-center gap-2">
          {currentWeatherType && (
            <span style={{ fontSize: '12px' }} title={currentWeatherType.label}>
              {currentWeatherType.emoji}
            </span>
          )}
          <span 
            className="text-xs"
            style={{ fontFamily: '"Press Start 2P", Monaco, monospace', fontSize: '6px' }}
          >
            {temperature ? `${temperature}°F` : 'N/A'}
          </span>
          {location && (
            <span 
              className="text-xs"
              style={{ fontFamily: '"Press Start 2P", Monaco, monospace', fontSize: '6px' }}
            >
              {location}
            </span>
          )}
          <button
            type="button"
            data-testid="weather-edit"
            onClick={() => {
              setManualWeather(weather || '');
              setManualTemp(temperature?.toString() || '');
              setManualLocation(location || '');
              setIsManualMode(true);
            }}
            className="px-1 py-0 text-xs bg-white text-black border border-black hover:bg-gray-200"
            style={{
              fontFamily: '"Press Start 2P", Monaco, monospace',
              fontSize: '6px',
              minHeight: '16px'
            }}
          >
            EDIT
          </button>
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
                style={{
                  fontFamily: '"Press Start 2P", Monaco, monospace',
                  fontSize: '6px',
                  minHeight: '16px'
                }}
                title={weatherType.label}
              >
                {weatherType.emoji}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              type="number"
              data-testid="weather-temperature"
              value={manualTemp}
              onChange={(e) => setManualTemp(e.target.value)}
              placeholder="°F"
              className="w-12 px-1 text-xs border border-black bg-white"
              style={{
                fontFamily: '"Press Start 2P", Monaco, monospace',
                fontSize: '6px',
                height: '16px'
              }}
            />
            <input
              type="text"
              data-testid="weather-location"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              placeholder="Location"
              className="flex-1 px-1 text-xs border border-black bg-white"
              style={{
                fontFamily: '"Press Start 2P", Monaco, monospace',
                fontSize: '6px',
                height: '16px'
              }}
            />
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              data-testid="weather-save"
              onClick={handleManualSave}
              className="px-2 py-0 text-xs bg-white text-black border border-black hover:bg-gray-200"
              style={{
                fontFamily: '"Press Start 2P", Monaco, monospace',
                fontSize: '6px',
                minHeight: '16px'
              }}
            >
              SAVE
            </button>
            <button
              type="button"
              data-testid="weather-auto"
              onClick={() => {
                setIsManualMode(false);
                getCurrentWeather();
              }}
              className="px-2 py-0 text-xs bg-white text-black border border-black hover:bg-gray-200"
              style={{
                fontFamily: '"Press Start 2P", Monaco, monospace',
                fontSize: '6px',
                minHeight: '16px'
              }}
            >
              AUTO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}