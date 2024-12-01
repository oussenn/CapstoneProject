import random

import numpy as np
import matplotlib.pyplot as plt


TEMPERATURE_LOWER = 6
TEMPERATURE_UPPER = 24
FLUCTUATION_RANGE = 0.4


# Define the list of tuples with start and end times in string format (24-hour format)
# Each tuple represents a time interval when the heater is ON
heater_times = [
    ("09:14", "10:04"),
    ("10:15", "11:05"),
    ("11:15", "12:05"),
    ("18:46", "19:47")
]


# Function to convert a time string (e.g., "09:50") to decimal hours (e.g., 9.83)
def time_str_to_decimal(time_str):
    hours, minutes = map(int, time_str.split(":"))
    return hours + minutes / 60


# Function to simulate the heater on/off behavior with thermodynamic principles
def simulate_heater_on_off(time, heater_times, k=0.1, k_cool=0.03, ambient_temp=TEMPERATURE_LOWER, max_temp=TEMPERATURE_UPPER):
    # Initialize temperature array for Series A (Temperature)
    temperature = np.zeros_like(time)
    # Heater control signal for Series B (ON = 1, OFF = 0)
    heater_on_off = np.zeros_like(time)
    
    # Initial temperature at 8 AM (starting temperature is 7°C)
    temperature[0] = ambient_temp  # Starting temperature is 7°C (heater OFF)
    
    # Simulate the temperature change
    for i in range(1, len(time)):

        # poor man's fluctuation
        max_temp = random.gauss(TEMPERATURE_UPPER, FLUCTUATION_RANGE)

        # Check if current time is in any of the heater ON intervals
        heater_on_off[i] = 0  # Default to heater OFF
        for start_str, end_str in heater_times:
            start_time = time_str_to_decimal(start_str)
            end_time = time_str_to_decimal(end_str)
            if start_time <= time[i] < end_time:  # If current time is within the interval
                heater_on_off[i] = 1  # Heater is ON in this time interval
                break  # No need to check further intervals once heater is ON
        
        # If heater is ON (Series B = 1), temperature rises toward max_temp (21°C) with thermodynamics
        if heater_on_off[i] == 1:
            # The rate of temperature increase is higher when the temperature is far from max_temp
            if temperature[i-1] < max_temp:
                # Temperature rises slower as it approaches the target
                temperature[i] = temperature[i-1] + k * (max_temp - temperature[i-1])  # Proportional rise
            else:
                temperature[i] = max_temp # Cap the temperature at max_temp

        # If heater is OFF (Series B = 0), temperature cools towards ambient_temp (7°C)
        else:
            # Cooling following Newton's Law of Cooling
            temperature[i] = temperature[i-1] - k_cool * (temperature[i-1] - ambient_temp)  # Cooling towards 7°C

    return temperature, heater_on_off

# Time axis (from 8 AM to 8 PM, which is 12 hours)
time = np.linspace(8, 20, 1000)  # Time from 8 AM to 8 PM, 1000 points

# Simulate the temperature and heater control based on the given times
temperature, heater_on_off = simulate_heater_on_off(time, heater_times)

# Create the plot
fig, ax1 = plt.subplots(figsize=(10, 6))

# Plot temperature (Series A) on the left y-axis
ax1.plot(time, temperature, color='tab:blue', label='Temperature (°C)', linewidth=2)
ax1.set_xlabel('Time (24-hour format)')
ax1.set_ylabel('Temperature (°C)', color='tab:blue')
ax1.tick_params(axis='y', labelcolor='tab:blue')

# Create a second y-axis for heater ON/OFF state (Series B)
ax2 = ax1.twinx()
ax2.step(time, heater_on_off, color='tab:red', label='Heater ON/OFF', linestyle='--', alpha=0.7)
ax2.set_ylabel('Heater ON/OFF', color='tab:red')
ax2.tick_params(axis='y', labelcolor='tab:red')

# Set the x-axis labels as time between 8 AM and 8 PM (24-hour format)
# Format time as HH:MM
time_labels = [f'{int(t):02}:{int((t % 1) * 60):02}' for t in np.linspace(8, 20, 25)]
ax1.set_xticks(np.linspace(8, 20, 25))
ax1.set_xticklabels(time_labels)

# Title and grid
plt.title('Temperature and Heater ON/OFF State from 08:00 to 20:00')
ax1.grid(True)

# Show the plot
plt.tight_layout()
plt.show()

