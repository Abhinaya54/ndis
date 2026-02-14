import { useState, useEffect } from 'react';
import { SHIFTS } from '../constants/shifts';

export const useCurrentShift = () => {
  const [currentShift, setCurrentShift] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const detectShift = () => {
      const now = new Date();
      const hours = now.getHours();
      
      // Morning: 7 AM - 3 PM (7-14)
      if (hours >= 7 && hours < 15) {
        setCurrentShift(SHIFTS.find(s => s.id === 'morning'));
      } 
      // Afternoon: 3 PM - 11 PM (15-22)
      else if (hours >= 15 && hours < 23) {
        setCurrentShift(SHIFTS.find(s => s.id === 'afternoon'));
      } 
      // Night: 11 PM - 7 AM (23-6)
      else {
        setCurrentShift(SHIFTS.find(s => s.id === 'night'));
      }

      // Calculate time remaining in shift
      calculateTimeRemaining(hours);
    };

    const calculateTimeRemaining = (currentHours) => {
      const now = new Date();
      let endHour;

      if (currentHours >= 7 && currentHours < 15) {
        endHour = 15; // 3 PM
      } else if (currentHours >= 15 && currentHours < 23) {
        endHour = 23; // 11 PM
      } else {
        endHour = 7; // 7 AM next day
      }

      let endTime = new Date(now);
      if (endHour <= currentHours) {
        endTime.setDate(endTime.getDate() + 1);
      }
      endTime.setHours(endHour, 0, 0, 0);

      const diff = Math.max(0, Math.floor((endTime - now) / 60000)); // minutes
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;

      if (diff > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining('Shift ended');
      }
    };

    detectShift();
    const interval = setInterval(detectShift, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return { currentShift, timeRemaining };
};
