import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MapPin, Upload, AlertCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const buildingCoordinates = {
  '4': [33.5389857817919, -5.107394832388461],
  '5': [33.53857390490613, -5.10705595121285],
  '6': [33.53828548871081, -5.107357277664568],
  '7': [33.53784740487951, -5.107824855516637],
  '8': [33.538627902166596, -5.107890501677856],
  '9': [33.53878069832461, -5.108584998555135],
  '10': [33.53934232399282, -5.107951968684698],
  '11': [33.53908382318764, -5.1082823290157515],
  '8B': [33.53828542407691, -5.108212631466344],
  'NAB': [33.5378023963057, -5.108680545381557]
};

const getDayCode = (date) => {
  const dayMapping = {
    'Monday': 'M',
    'Tuesday': 'T',
    'Wednesday': 'W',
    'Thursday': 'R',
    'Friday': 'F'
  };
  return dayMapping[date.toLocaleDateString('en-US', { weekday: 'long' })];
};

const timeToMinutes = (timeStr) => {
  const [time, period] = timeStr.split(/\s+/);
  const [hours, minutes] = time.split(':').map(Number);
  let totalHours = hours;
  
  if (period?.toUpperCase() === 'PM' && hours !== 12) {
    totalHours += 12;
  }
  if (period?.toUpperCase() === 'AM' && hours === 12) {
    totalHours = 0;
  }
  
  return totalHours * 60 + minutes;
};

const getCurrentClasses = (classData, currentTime) => {
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentDayCode = getDayCode(currentTime);
  
  // Return empty array if it's not a weekday
  if (!currentDayCode) return [];
  
  return classData.filter(cls => {
    // Check if the class runs on the current day
    if (!cls.Days.includes(currentDayCode)) return false;
    
    const startTime = timeToMinutes(cls.Begin);
    const endTime = timeToMinutes(cls.End);
    return currentMinutes + 10 >= startTime && currentMinutes + 10 <= endTime;
  });
};

const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(value => value.trim());
    const row = {};
    
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const value = values[j];
      
      if (header === 'Occupancy') {
        row[header] = parseInt(value) || 0;
      } else {
        row[header] = value;
      }
    }
    
    data.push(row);
  }
  
  return data;
};

const CampusMap = () => {
  const [csvData, setCsvData] = useState(() => {
    // Try to load saved data from localStorage on initial render
    const savedData = localStorage.getItem('csvCampusData');
    return savedData ? JSON.parse(savedData) : [];
  });
  const [map, setMap] = useState(null);
  const [heat, setHeat] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [currentBuildingOccupancy, setCurrentBuildingOccupancy] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const auiCenter = [33.5375, -5.1062];
    
    const mapInstance = L.map('campus-map').setView(auiCenter, 17);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);
    
    const heatLayer = L.heatLayer([], {
      radius: 50,
      blur: 40,
      maxZoom: 20,
      max: 0.3,
      gradient: {
        0.2: 'blue',
        0.4: 'lime',
        0.6: 'yellow',
        0.8: 'red'
      }
    }).addTo(mapInstance);

    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function() {
      const div = L.DomUtil.create('div', 'legend');
      div.innerHTML = `
        <div style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #ccc;">
          <h4>Occupancy Level</h4>
          <div style="display: flex; align-items: center; margin: 5px 0;">
            <div style="background: red; width: 20px; height: 20px; margin-right: 5px;"></div>
            <span>400+ occupants</span>
          </div>
          <div style="display: flex; align-items: center; margin: 5px 0;">
            <div style="background: yellow; width: 20px; height: 20px; margin-right: 5px;"></div>
            <span>200-400 occupants</span>
          </div>
          <div style="display: flex; align-items: center; margin: 5px 0;">
            <div style="background: lime; width: 20px; height: 20px; margin-right: 5px;"></div>
            <span>50-200 occupants</span>
          </div>
          <div style="display: flex; align-items: center; margin: 5px 0;">
            <div style="background: blue; width: 20px; height: 20px; margin-right: 5px;"></div>
            <span>0-50 occupants</span>
          </div>
        </div>
      `;
      return div;
    };
    legend.addTo(mapInstance);

    setMap(mapInstance);
    setHeat(heatLayer);

    return () => {
      mapInstance.remove();
    };
  }, []);

  useEffect(() => {
    if (csvData.length) {
      const currentClassesNow = getCurrentClasses(csvData, currentTime);
      
      // Only calculate occupancy for buildings with active classes on the current day
      const buildingOccupancy = currentClassesNow.reduce((acc, cls) => {
        const building = cls.Building;
        acc[building] = (acc[building] || 0) + cls.Occupancy;
        return acc;
      }, {});

      setCurrentBuildingOccupancy(buildingOccupancy);
    }
  }, [csvData, currentTime]);

  useEffect(() => {
    if (heat && csvData.length) {
      const generateHeatmapData = () => {
        const heatmapData = [];
        
        Object.entries(currentBuildingOccupancy).forEach(([building, occupancy]) => {
          if (buildingCoordinates[building]) {
            const [lat, lon] = buildingCoordinates[building];
            
            // More granular intensity calculation
            let intensity;
            if (occupancy === 0) {
              intensity = 0.3; // Light blue
            } else if (occupancy <= 50) {
              intensity = 0.5; // Darker blue
            } else if (occupancy <= 200) {
              intensity = 0.7; // Green
            } else if (occupancy <= 400) {
              intensity = 0.85; // Yellow
            } else {
              intensity = 1.0; // Red
            }
      
            heatmapData.push([lat, lon, intensity]);
          }
        });
      
        return heatmapData;
      };
  
      const allHeatData = generateHeatmapData();
      heat.setLatLngs(allHeatData);
    }
  }, [csvData, heat, currentBuildingOccupancy]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    setIsLoading(true);
    setError(null);

    try {
      if (!file) return;
      if (file.type !== 'text/csv') {
        throw new Error('Please upload a CSV file');
      }

      const text = await file.text();
      const parsedData = parseCSV(text);
      
      if (!parsedData.length) {
        throw new Error('No valid data found in the CSV file');
      }
      
      // Save to localStorage
      localStorage.setItem('csvCampusData', JSON.stringify(parsedData));
      setCsvData(parsedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get current day for display
  const currentDay = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
  const isWeekend = !getDayCode(currentTime);

  return (
<div className="space-y-6">
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold text-gray-900">Campus Map</h1>
    <div className="flex items-center space-x-4">
    <div className="flex items-center space-x-2 text-lg">
              <Clock className="h-5 w-5" />
              <span>{currentDay}</span>
              <span className="font-extrabold">{currentTime.toLocaleTimeString()}</span>
            </div>
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <MapPin className="h-4 w-4" />
        <span>Al Akhawayn University, Ifrane</span>
      </div>
    </div>
  </div>
  
  <div className="mb-4">
    <label 
      htmlFor="csvFile" 
      className="flex items-center gap-2 w-fit px-4 py-2 bg-[#166432] text-white rounded-md cursor-pointer hover:bg-[#1a7a3d] transition-colors"
    >
      <Upload size={20} />
      Upload CSV File
    </label>
    <input
      id="csvFile"
      type="file"
      accept=".csv"
      onChange={handleFileUpload}
      className="hidden"
    />
    {isLoading && <p className="mt-2 text-[#166432]">Loading data...</p>}
    {error && (
      <Alert variant="destructive" className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}
  </div>
  
  {csvData.length > 0 && (
    <div className="mb-4 bg-[#166432]/10 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">
        Current Building Occupancy
        {isWeekend && (
          <span className="text-gray-500 text-sm ml-2">(Weekend - No Classes)</span>
        )}
      </h3>
      {isWeekend ? (
        <p className="text-gray-600">All buildings are currently unoccupied.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(currentBuildingOccupancy).map(([building, occupancy]) => (
            <div key={building} className="bg-white p-3 rounded-md shadow-sm">
              <p className="font-medium">Building {building}</p>
              <p className="text-[#166432]"> ~{occupancy} occupants</p>
            </div>
          ))}
          {Object.keys(currentBuildingOccupancy).length === 0 && (
            <p className="col-span-3 text-gray-600">No active classes at this time.</p>
          )}
        </div>
      )}
    </div>
  )}
  
  <Card>
    <CardHeader>
      <CardTitle>Interactive Campus Map</CardTitle>
    </CardHeader>
    <CardContent>
      <div 
        id="campus-map" 
        className="h-[600px] w-full rounded-lg border border-gray-200"
      ></div>
    </CardContent>
  </Card>
</div>
  );
};

export default CampusMap;