import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../services/api';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { user, setUser } = useUser();

  const changeLanguage = async (lng) => {
    i18n.changeLanguage(lng);
    
    // If user is logged in, sync to backend
    if (user) {
      try {
        const res = await api.patch(`/users/${user._id || user.id}`, { 
          languagePreference: lng 
        });
        if (res.data.success) {
          const updatedUser = { ...user, languagePreference: lng };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.error('Failed to save language preference', err);
      }
    }
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-full transition-colors">
        <Globe className="w-5 h-5 text-slate-600" />
        <span className="text-xs font-bold text-slate-600 uppercase">
          {i18n.language || 'en'}
        </span>
      </button>
      
      <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
        <button
          onClick={() => changeLanguage('en')}
          className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${i18n.language === 'en' ? 'text-teal-600 font-bold bg-teal-50' : 'text-slate-600'}`}
        >
          English
        </button>
        <button
          onClick={() => changeLanguage('am')}
          className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${i18n.language === 'am' ? 'text-teal-600 font-bold bg-teal-50' : 'text-slate-600'}`}
        >
          አማርኛ (Amharic)
        </button>
        <button
          onClick={() => changeLanguage('om')}
          className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${i18n.language === 'om' ? 'text-teal-600 font-bold bg-teal-50' : 'text-slate-600'}`}
        >
          Afaan Oromoo
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
