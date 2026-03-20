import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '../config';

const useStore = create((set, get) => ({
  // Auth State
  token: localStorage.getItem('token') || null,
  user: null,
  setToken: (token) => {
    localStorage.setItem('token', token);
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    set({
      token: null,
      user: null,
      datasets: [],
      activeDataset: null,
      currentView: 'overview',
      isAiPanelOpen: false,
    });
  },

  fetchUser: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      if (res.data?.user) {
        set({ user: res.data.user });
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      if (err.response?.status === 401) {
        get().logout();
      }
    }
  },


  // Theme State
  isDark: localStorage.getItem('theme') === 'dark',
  toggleTheme: () => {
    const newTheme = !get().isDark;
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    set({ isDark: newTheme });
  },

  // Dataset State
  datasets: [],
  activeDataset: null,
  setDatasets: (datasets) => set({ datasets }),
  setActiveDataset: (dataset) => set({ activeDataset: dataset }),
  
  fetchDatasets: async () => {
    const { token, activeDataset } = get();
    if (!token) return;
    
    try {
      const res = await axios.get(`${API_URL}/datasets`);
      set({ datasets: res.data });
      if (res.data.length > 0 && !activeDataset) {
        set({ activeDataset: res.data[0] });
      }
    } catch (err) {
      console.error('Failed to load datasets', err);
    }
  },

  handleUploadSuccess: (newDataset) => {
    const { datasets } = get();
    set({ 
      datasets: [newDataset, ...datasets],
      activeDataset: newDataset,
      toast: { 
        title: 'Success', 
        message: `Dataset "${newDataset.name}" is now ready!`, 
        type: 'success' 
      }
    });
  },

  handleDeleteDataset: async (id) => {
    const { datasets, activeDataset } = get();
    try {
      await axios.delete(`${API_URL}/datasets/${id}`);
      const updated = datasets.filter(d => d.id !== id);
      set({ datasets: updated });
      if (activeDataset?.id === id) {
        set({ activeDataset: updated[0] ?? null });
      }
    } catch (err) {
      console.error('Failed to delete dataset', err);
    }
  },

  // UI State
  isUploadOpen: false,
  setIsUploadOpen: (isOpen) => set({ isUploadOpen: isOpen }),
  isManageOpen: false,
  setIsManageOpen: (isOpen) => set({ isManageOpen: isOpen }),
  isSidebarVisible: true,
  setIsSidebarVisible: (isVisible) => set({ isSidebarVisible: isVisible }),
  currentView: 'overview',
  setCurrentView: (view) => set({ currentView: view }),
  isAiPanelOpen: false,
  setIsAiPanelOpen: (isOpen) => set({ isAiPanelOpen: isOpen }),
  showPreview: false,
  setShowPreview: (show) => set({ showPreview: show }),


  // Global Upload/Sync State
  globalUploadState: null,
  setGlobalUploadState: (state) => set({ globalUploadState: state }),

  // Notification State
  toast: null,
  setToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
}));

// Initialize axios header if token exists
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default useStore;
