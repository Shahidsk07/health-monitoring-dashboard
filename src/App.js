import React, { useState, useEffect } from 'react';
import Chart from 'chart.js/auto';
import { Line } from 'react-chartjs-2';
import './App.css'; // Assuming you have an external CSS file for styling

const AdvancedHealthDashboard = () => {
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [healthData, setHealthData] = useState({
    heartRate: [],
    bloodPressure: [],
    oxygenSaturation: [],
    steps: []
  });
  const [activeMetric, setActiveMetric] = useState('heartRate');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [goals, setGoals] = useState({ heartRate: 75, steps: 10000 });
  const [goalAchievements, setGoalAchievements] = useState([]);

  const metricsConfig = {
    heartRate: {
      label: 'Heart Rate',
      unit: 'bpm',
      color: '#FF6384',
      threshold: value => value < 60 || value > 100 ? 'Abnormal' : 'Normal'
    },
    bloodPressure: {
      label: 'Blood Pressure',
      unit: 'mmHg',
      color: '#36A2EB',
      threshold: (systolic, diastolic) => (systolic < 90 || systolic > 140 || diastolic < 60 || diastolic > 90) ? 'Abnormal' : 'Normal'
    },
    oxygenSaturation: {
      label: 'Oxygen Saturation',
      unit: '%',
      color: '#4BC0C0',
      threshold: value => value < 95 ? 'Abnormal' : 'Normal'
    },
    steps: {
      label: 'Daily Steps',
      unit: 'steps',
      color: '#9966FF',
      threshold: value => value < 5000 ? 'Low Activity' : 'Active'
    }
  };

  const healthTips = {
    heartRate: 'Maintain a balanced diet and regular exercise to keep your heart healthy.',
    bloodPressure: 'Reduce sodium intake and manage stress for better blood pressure.',
    oxygenSaturation: 'Practice deep breathing exercises for better oxygen levels.',
    steps: 'Aim for 10,000 steps daily to stay fit and active.'
  };

  const connectDevice = async () => {
    try {
      // Request the Bluetooth device that offers heart rate service
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }]  // Filter for heart rate service
      });

      // Connect to the device
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate'); // Access the heart rate service
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      // Start receiving notifications from the heart rate characteristic
      characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

      setDeviceConnected(true);
      console.log('Device connected successfully');
    } catch (error) {
      console.error('Failed to connect to device:', error);
      setDeviceConnected(false);
    }
  };

  // Function to handle data received from the Bluetooth device
  const handleCharacteristicValueChanged = (event) => {
    const value = event.target.value;
    const heartRate = value.getUint8(1); // Assuming heart rate is the second byte in the data

    // Update the health data with the new heart rate value
    setHealthData(prevData => {
      const newHeartRateData = {
        timestamp: new Date().toLocaleTimeString(),
        heartRate,
      };
      return {
        ...prevData,
        heartRate: [...prevData.heartRate, newHeartRateData]
      };
    });

    // Notify user if the heart rate is abnormal
    if (heartRate < 60 || heartRate > 100) {
      setNotifications(prev => [...prev, `Heart rate abnormal at ${new Date().toLocaleTimeString()}`]);
    }
  };

  const getChartData = metric => {
    const config = metricsConfig[metric];
    const labels = healthData[metric]?.map(data => data.timestamp) || [];
    const dataPoints = healthData[metric]?.map(data => metric === 'bloodPressure' ? data.systolic : data[metric]) || [];

    return {
      labels,
      datasets: [
        {
          label: config.label,
          data: dataPoints,
          borderColor: config.color,
          backgroundColor: `${config.color}33`,
          tension: 0.3
        }
      ]
    };
  };

  const CurrentMetricDisplay = ({ metric }) => {
    const config = metricsConfig[metric];
    const latestData = healthData[metric]?.slice(-1)[0] || {};

    const getValue = () => {
      if (metric === 'bloodPressure') {
        return `${latestData.systolic || 'N/A'}/${latestData.diastolic || 'N/A'} ${config.unit}`;
      }
      return `${latestData[metric] || 'N/A'} ${config.unit}`;
    };

    return (
      <div className="current-metric-display">
        <span>{config.label}</span>
        <strong>{getValue()}</strong>
      </div>
    );
  };

  return (
    <div className={`dashboard-container ${darkMode ? 'dark-mode' : ''}`}>
      <h1>Advanced Health Monitoring Dashboard</h1>

      <button className="dark-mode-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>

      {!deviceConnected ? (
        <button onClick={connectDevice} className="connect-button">
          Connect Device
        </button>
      ) : (
        <div>
          <div className="metric-selector">
            {Object.keys(metricsConfig).map(metric => (
              <button
                key={metric}
                className={`metric-button ${activeMetric === metric ? 'active' : ''}`}
                onClick={() => setActiveMetric(metric)}
              >
                {metricsConfig[metric].label}
              </button>
            ))}
          </div>

          <CurrentMetricDisplay metric={activeMetric} />

          <div className="chart-container">
            <h3>{metricsConfig[activeMetric].label} Trend</h3>
            <Line data={getChartData(activeMetric)} options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              }
            }} />
          </div>

          <div className="health-tips">
            <h3>Health Tip:</h3>
            <p>{healthTips[activeMetric]}</p>
          </div>

          <div className="notifications">
            <h3>Notifications:</h3>
            <ul>
              {notifications.slice(-5).map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>

          <div className="goal-achievements">
            <h3>Goal Achievements:</h3>
            <ul>
              {goalAchievements.slice(-5).map((achievement, index) => (
                <li key={index}>{achievement}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedHealthDashboard;
