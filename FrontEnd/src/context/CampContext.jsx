import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CampContext = createContext();

export const useCamp = () => useContext(CampContext);

export const CampProvider = ({ children }) => {
  const [campId, setCampId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCampId = async () => {
      try {
        // First check localStorage for cached campId
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user.campId) {
            setCampId(user.campId);
            setLoading(false);
            return;
          }
        }

        // Otherwise fetch from API using auth token
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token');
          setLoading(false);
          return;
        }

        const response = await api.get('/auth/me');
        const data = response.data;
        let fetchedCampId = data.data?.campId || data.campId;

        // If still no campId, try fetching their camps directly
        if (!fetchedCampId) {
          try {
            const myCampsRes = await api.get('/camps/my/camps');
            if (myCampsRes.data.success && myCampsRes.data.data.length > 0) {
              fetchedCampId = myCampsRes.data.data[0]._id;
            }
          } catch (campErr) {
            console.warn('Could not fetch manager camps', campErr);
          }
        }

        if (fetchedCampId) {
          setCampId(fetchedCampId);
          // Update localStorage for consistency
          if (storedUser) {
            const userObj = JSON.parse(storedUser);
            const updatedUser = { ...userObj, campId: fetchedCampId };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } else {
          setError('No camp associated with this account. Please create your camp first.');
        }
      } catch (err) {
        console.error('Error fetching camp ID:', err);
        setError('Failed to load camp information');
      } finally {
        setLoading(false);
      }
    };

    fetchCampId();
  }, []);

  return (
    <CampContext.Provider value={{ campId, loading, error }}>
      {children}
    </CampContext.Provider>
  );
};
