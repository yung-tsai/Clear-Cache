import { useMemo } from "react";
import { JournalEntry } from "@shared/schema";

interface MoodTrendChartProps {
  entries: JournalEntry[];
}

const MOOD_VALUES: Record<string, number> = {
  'happy': 5,
  'grateful': 4,
  'peaceful': 4,
  'excited': 4,
  'calm': 3,
  'anxious': 2,
  'sad': 1,
  'angry': 1
};

const MOOD_COLORS: Record<string, string> = {
  'happy': '#000',
  'grateful': '#333',
  'peaceful': '#444',
  'excited': '#222',
  'calm': '#555',
  'anxious': '#666',
  'sad': '#777',
  'angry': '#888'
};

export default function MoodTrendChart({ entries }: MoodTrendChartProps) {
  const chartData = useMemo(() => {
    const entriesWithMood = entries.filter(entry => entry.mood);
    const sortedEntries = entriesWithMood.sort((a, b) => 
      new Date(a.journalDate).getTime() - new Date(b.journalDate).getTime()
    );
    
    return sortedEntries.map(entry => ({
      date: entry.journalDate,
      mood: entry.mood!,
      value: MOOD_VALUES[entry.mood!] || 3,
      displayDate: new Date(entry.journalDate).toLocaleDateString()
    }));
  }, [entries]);

  const maxValue = 5;
  const chartHeight = 200;
  const chartWidth = 400;
  const padding = 40;

  if (chartData.length === 0) {
    return (
      <div className="mood-trend-chart">
        <div className="chart-title">Mood Trends</div>
        <div className="no-data">No mood data available</div>
      </div>
    );
  }

  const pathData = chartData.map((point, index) => {
    const x = padding + (index * (chartWidth - 2 * padding)) / (chartData.length - 1);
    const y = chartHeight - padding - ((point.value - 1) * (chartHeight - 2 * padding)) / (maxValue - 1);
    return { x, y, ...point };
  });

  const pathString = pathData.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  return (
    <div className="mood-trend-chart">
      <div className="chart-title">Mood Trends</div>
      <svg 
        width={chartWidth} 
        height={chartHeight}
        className="mood-chart-svg"
        data-testid="mood-trend-chart"
      >
        {/* Grid lines */}
        {[1, 2, 3, 4, 5].map(value => {
          const y = chartHeight - padding - ((value - 1) * (chartHeight - 2 * padding)) / (maxValue - 1);
          return (
            <g key={value}>
              <line
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke="#ccc"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text
                x={padding - 10}
                y={y + 3}
                fontSize="8"
                fill="#000"
                textAnchor="end"
              >
                {value}
              </text>
            </g>
          );
        })}
        
        {/* Y-axis labels */}
        <text x={10} y={padding} fontSize="8" fill="#000">Mood</text>
        <text x={10} y={padding + 10} fontSize="6" fill="#666">5=Happy</text>
        <text x={10} y={chartHeight - padding} fontSize="6" fill="#666">1=Sad</text>
        
        {/* X-axis */}
        <line
          x1={padding}
          y1={chartHeight - padding}
          x2={chartWidth - padding}
          y2={chartHeight - padding}
          stroke="#000"
          strokeWidth="2"
        />
        
        {/* Y-axis */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={chartHeight - padding}
          stroke="#000"
          strokeWidth="2"
        />
        
        {/* Trend line */}
        <path
          d={pathString}
          stroke="#000"
          strokeWidth="2"
          fill="none"
          data-testid="mood-trend-line"
        />
        
        {/* Data points */}
        {pathData.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill={MOOD_COLORS[point.mood] || "#000"}
              stroke="#fff"
              strokeWidth="1"
              data-testid={`mood-point-${index}`}
            />
            {/* Date labels every few points to avoid crowding */}
            {index % Math.ceil(pathData.length / 5) === 0 && (
              <text
                x={point.x}
                y={chartHeight - padding + 15}
                fontSize="6"
                fill="#000"
                textAnchor="middle"
                transform={`rotate(-45 ${point.x} ${chartHeight - padding + 15})`}
              >
                {point.displayDate}
              </text>
            )}
          </g>
        ))}
      </svg>
      
      {/* Legend */}
      <div className="chart-legend">
        <div className="legend-title">Mood Scale:</div>
        <div className="legend-items">
          {Object.entries(MOOD_VALUES)
            .sort(([,a], [,b]) => b - a)
            .map(([mood, value]) => (
              <div key={mood} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: MOOD_COLORS[mood] }}
                ></div>
                <span>{mood} ({value})</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}