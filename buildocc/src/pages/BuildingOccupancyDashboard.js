import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Upload, AlertCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const isValidBuildingNumber = (building) => {
  const buildingNum = parseInt(building);
  return !isNaN(buildingNum) && buildingNum > 0 && buildingNum < 100;
};

const isTimeFormat = (str) => {
  return /^\d{1,2}:\d{2}(?:\s*(?:AM|PM)?)?$/i.test(str);
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

const formatTime = (hour, minute) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minute.toString().padStart(2, '0')} ${period}`;
};

const isRoomOccupied = (timeSlots, currentTime) => {
  const currentMinutes = (currentTime.getHours() * 60 + currentTime.getMinutes()) + 10;
  const currentDay = currentTime.toLocaleDateString('en-US', { weekday: 'short' })[0];
  
  return timeSlots.some(slot => {
    // Check if the current day matches the slot's days
    const isDayMatch = slot.days.includes(currentDay);
    
    const startTime = timeToMinutes(slot.begin);
    const endTime = timeToMinutes(slot.end);
    
    // Room is occupied if both day and time match
    return isDayMatch && 
           currentMinutes >= startTime && 
           currentMinutes <= endTime;
  });
};

const getCurrentClasses = (classData, currentTime) => {
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentDay = currentTime.toLocaleDateString('en-US', { weekday: 'short' })[0];
  
  const dayMapping = {
    'M': 'Monday',
    'T': 'Tuesday', 
    'W': 'Wednesday',
    'R': 'Thursday',
    'F': 'Friday'
  };

  return classData.filter(cls => {
    const startTime = timeToMinutes(cls.Begin);
    const endTime = timeToMinutes(cls.End);
    
    // Check if the course is scheduled for the current day
    const isScheduledToday = cls.Days.includes(currentDay);
    
    // Check if current time is within the class time
    const isCurrentlyInSession = currentMinutes + 10 >= startTime && currentMinutes + 10 <= endTime;
    
    return isScheduledToday && isCurrentlyInSession &&
      (!selectedBuilding || cls.Building === selectedBuilding) &&
      (!selectedRoom || cls.Room === selectedRoom);
  }).sort((a, b) => {
    if (a.Building === b.Building) {
      return a.Room.localeCompare(b.Room);
    }
    return parseInt(a.Building) - parseInt(b.Building);
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
      
      if (header === 'Building' && isTimeFormat(value)) continue;
      if (header === 'Building' && !isValidBuildingNumber(value)) continue;
      
      if (header === 'Occupancy') {
        row[header] = parseInt(value) || 0;
      } else {
        row[header] = value;
      }
    }
    
    if (isValidBuildingNumber(row.Building)) {
      data.push(row);
    }
  }
  
  return data;
};

const BuildingOccupancyDashboard = ({ onDataUpload }) => {
  const [classData, setClassData] = useState(() => {
    const savedData = localStorage.getItem('csvClassData');
    return savedData ? JSON.parse(savedData) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [selectedDays, setSelectedDays] = useState(['M', 'T', 'W', 'R', 'F']);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      localStorage.setItem('csvClassData', JSON.stringify(parsedData));
      setClassData(parsedData);  
      setSelectedBuilding(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const buildingInfo = useMemo(() => {
    if (!classData.length) return [];

    const buildingsMap = new Map();
    
    classData.forEach(cls => {
      if (!buildingsMap.has(cls.Building)) {
        buildingsMap.set(cls.Building, {
          building: cls.Building,
          rooms: new Map(),
          totalOccupancy: 0,
          averageOccupancy: 0
        });
      }
      
      const buildingData = buildingsMap.get(cls.Building);
      if (!buildingData.rooms.has(cls.Room)) {
        buildingData.rooms.set(cls.Room, {
          maxOccupancy: 0,
          totalClasses: 0,
          timeSlots: []
        });
      }
      
      const roomData = buildingData.rooms.get(cls.Room);
      roomData.totalClasses++;
      roomData.maxOccupancy = Math.max(roomData.maxOccupancy, cls.Occupancy);
      roomData.timeSlots.push({
        days: cls.Days,
        begin: cls.Begin,
        end: cls.End,
        occupancy: cls.Occupancy,
        course: cls['Course Code']
      });
      
      buildingData.totalOccupancy += cls.Occupancy;
    });
    
    buildingsMap.forEach(building => {
      building.averageOccupancy = Math.round(building.totalOccupancy / building.rooms.size);
    });
    
    return Array.from(buildingsMap.values())
      .sort((a, b) => parseInt(a.building) - parseInt(b.building));
  }, [classData]);

  const currentClasses = useMemo(() => {
    if (!classData.length) return [];
    
    const dayMapping = {
      'M': 'Monday',
      'T': 'Tuesday', 
      'W': 'Wednesday',
      'R': 'Thursday',
      'F': 'Friday'
    };
  
    return getCurrentClasses(classData, currentTime)
      .filter(cls => 
        // Check if any of the class days match our selected days
        cls.Days.split('').some(day => selectedDays.includes(day)) &&
        (!selectedBuilding || cls.Building === selectedBuilding) &&
        (!selectedRoom || cls.Room === selectedRoom)
      )
      .sort((a, b) => {
        if (a.Building === b.Building) {
          return a.Room.localeCompare(b.Room);
        }
        return parseInt(a.Building) - parseInt(b.Building);
      });
  }, [classData, currentTime, selectedBuilding, selectedRoom, selectedDays]);

  const getTimelineData = (building) => {
    if (!building) return [];
    
    const buildingClasses = classData.filter(item => 
      item.Building === building &&
      item.Days.split('').some(day => selectedDays.includes(day))
    );
    const timelineData = [];
    
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    for (let hour = 8; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeInMinutes = hour * 60 + minute;
        const occupancy = buildingClasses.reduce((sum, cls) => {
          const startTime = timeToMinutes(cls.Begin);
          const endTime = timeToMinutes(cls.End);
          if (timeInMinutes >= startTime && timeInMinutes <= endTime) {
            return sum + cls.Occupancy;
          }
          return sum;
        }, 0);

        const displayedRoom = hoveredRoom || selectedRoom;
        timelineData.push({
          time: formatTime(hour, minute),
          occupancy,
          roomOccupancy: displayedRoom ? buildingClasses
            .filter(cls => cls.Room === displayedRoom)
            .reduce((sum, cls) => {
              const startTime = timeToMinutes(cls.Begin);
              const endTime = timeToMinutes(cls.End);
              return sum + (timeInMinutes >= startTime && timeInMinutes <= endTime ? cls.Occupancy : 0);
            }, 0) : 0,
          isCurrent: hour === currentHour && Math.abs(minute - currentMinute) < 30
        });
      }
    }
    return timelineData;
  };

  const selectedBuildingData = buildingInfo.find(b => b.building === selectedBuilding);
  const currentDay = currentTime.toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Building Occupancy Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-lg">
              <Clock className="h-5 w-5" />
              <span>{currentDay}</span>
              <span className="font-extrabold">{currentTime.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <label 
            htmlFor="csvFile" 
            className="flex items-center gap-2 w-fit px-4 py-2 bg-[#166432] text-white rounded-md cursor-pointer hover:bg-[#1c7d3d] transition-colors"
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

        {classData.length === 0 ? (
          <Card className="p-6">
            <CardContent className="text-center">
              <h3 className="text-lg font-semibold mb-2">Upload a CSV file to view building occupancy data</h3>
              <p className="text-sm text-slate-500">
                Required columns: Course Code, Days, Begin, End, Building, Room, Occupancy
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Building list */}
            <div className="col-span-2">
              {buildingInfo.map(({ building, rooms, totalOccupancy, averageOccupancy }) => (
                <Card 
                  key={building}
                  className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                    selectedBuilding === building ? 'border-[#166432] border-2' : ''
                  } mb-4`}
                  onClick={() => setSelectedBuilding(
                    selectedBuilding === building ? null : building
                  )}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">Building {building}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-sm space-y-2">
                      <p className="flex justify-between">
                        <span>Rooms:</span>
                        <span className="font-medium">{rooms.size}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Total Capacity:</span>
                        <span className="font-medium">{totalOccupancy}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Avg. Occupancy:</span>
                        <span className="font-medium">{averageOccupancy}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main content */}
            <div className="col-span-8">
              {selectedBuildingData && (
                <>
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedDays(['M', 'T', 'W', 'R', 'F'])}
                        className={`px-4 py-2 rounded-md transition-colors ${
                          selectedDays.length === 5 
                            ? 'bg-[#166432] text-white' 
                            : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        ALL
                      </button>
                      {Object.entries({
                        'M': 'Monday',
                        'T': 'Tuesday', 
                        'W': 'Wednesday',
                        'R': 'Thursday',
                        'F': 'Friday'
                      }).map(([code, day]) => (
                        <button
                          key={code}
                          onClick={() => {
                            setSelectedDays(prev => {
                              if (prev.includes(code)) {
                                const newDays = prev.filter(d => d !== code);
                                return newDays.length === 0 ? prev : newDays;
                              } else {
                                return [...prev, code];
                              }
                            });
                          }}
                          className={`px-4 py-2 rounded-md transition-colors ${
                            selectedDays.includes(code)
                              ? 'bg-[#166432] text-white'
                              : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Card className="h-[600px]">
                    <CardHeader>
                      <CardTitle>
                        Occupancy Timeline - Building {selectedBuilding}
                        {(hoveredRoom || selectedRoom) && (
                          <span className="text-sm font-normal ml-2">
                            {hoveredRoom ? `Hovering Room ${hoveredRoom}` : `Selected Room ${selectedRoom}`}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[500px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getTimelineData(selectedBuilding)}>
                          <XAxis 
                            dataKey="time" 
                            interval={2}
                            angle={-45}
                            textAnchor="end"
                            height={50}
                          />
                          <YAxis />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="occupancy"
                            stroke="#166432"
                            fill="#84cc16"
                            strokeWidth={2}
                            name="Total Occupancy"
                          />
                          {(hoveredRoom || selectedRoom) && (
                            <Area
                              type="monotone"
                              dataKey="roomOccupancy"
                              stroke="#166432"
                              fill="#86efac"
                              strokeWidth={2}
                              name={`Room ${hoveredRoom || selectedRoom}`}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Rooms in Building {selectedBuilding}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from(selectedBuildingData.rooms).map(([roomNumber, roomData]) => {
                        const isHeaterOn = isRoomOccupied(roomData.timeSlots, currentTime);
                        return (
                          <Card 
                            key={roomNumber} 
                            className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${
                              hoveredRoom === roomNumber ? 'border-[#166432] border-2' :
                              selectedRoom === roomNumber ? 'border-[#166432] border-2' : ''
                            }`}
                            onMouseEnter={() => setHoveredRoom(roomNumber)}
                            onMouseLeave={() => setHoveredRoom(null)}
                            onClick={() => setSelectedRoom(roomNumber === selectedRoom ? null : roomNumber)}
                          >
                            <h4 className="font-medium mb-2">Room {roomNumber}</h4>
                            <div className="text-sm space-y-2 text-slate-600">
                              <p className="flex justify-between">
                                <span>Heater:</span>
                                <span className={`font-bold ${isHeaterOn ? 'text-[#166432]' : 'text-red-600'}`}>
                                  {isHeaterOn ? 'On' : 'Off'}
                                </span>
                              </p>
                              <p className="flex justify-between">
                                <span>Classes:</span>
                                <span className="font-medium">{roomData.totalClasses}</span>
                              </p>
                              <p className="flex justify-between">
                                <span>Max Occupancy:</span>
                                <span className="font-medium">{roomData.maxOccupancy}</span>
                              </p>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Current Classes */}
            <div className="col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#166432]" />
                    <CardTitle className="text-lg">Current Classes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {currentClasses.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center">
                      No classes in session
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {currentClasses.map((cls, index) => (
                        <Card 
                          key={index}
                          className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                            selectedBuilding === cls.Building ? 'border-[#166432] border-2' : ''
                          }`}
                          onClick={() => setSelectedBuilding(cls.Building)}
                        >
                          <div className="space-y-2">
                            <div className="font-medium text-sm">
                              {cls['Course Code']}
                            </div>
                            <div className="text-xs text-slate-500 space-y-1">
                              <div className="flex justify-between">
                                <span>Building:</span>
                                <span className="font-medium">{cls.Building}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Room:</span>
                                <span className="font-medium">{cls.Room}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Time:</span>
                                <span className="font-medium">
                                  {cls.Begin} - {cls.End}
                                  </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Occupancy:</span>
                                <span className="font-medium">{cls.Occupancy}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildingOccupancyDashboard;
