import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import DynamicDashboard from '../components/DynamicDashboard';
import { Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';

import useStore from '../store/useStore';

export default function DynamicBoardPage() {
    const { token, datasets, setCurrentView } = useStore();
    const { datasetId, slug } = useParams();
    const navigate = useNavigate();
    const [charts, setCharts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    useEffect(() => {
        setCurrentView('analytics');
    }, [setCurrentView]);

    useEffect(() => {
        const loadPageData = async () => {
            setLoading(true);
            try {
                if (!token) {
                    navigate('/login');
                    return;
                }

                // 1. Find Dataset Details from store or fetch if needed
                let currentDs = datasets.find(d => String(d.id) === String(datasetId));
                
                if (!currentDs) {
                    // Fallback fetch if not in store
                    const dsRes = await axios.get(`${API_URL}/datasets`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    currentDs = dsRes.data.find(d => String(d.id) === String(datasetId));
                }

                // 2. Fetch Chat History to reconstruct the "dashboard" (pinned/all viz)
                if (slug === 'lumina_25') {
                    const userData = JSON.parse(localStorage.getItem("user") || "{}");
                    const userId = userData?.id || "guest";
                    const PIN_STORAGE_KEY = `lumina_pinned_charts_${userId}`;
                    const localPins = JSON.parse(localStorage.getItem(PIN_STORAGE_KEY) || "[]");
                    if (localPins && localPins.length > 0) {
                        setCharts(localPins);
                        setLoading(false);
                        return;
                    }
                }

                if (slug.startsWith('save-')) {
                    const boardId = slug.replace('save-', '');
                    const boardRes = await axios.get(`${API_URL}/dashboards`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const savedBoard = boardRes.data.find(b => String(b.id) === String(boardId));
                    if (savedBoard) {
                        setCharts(savedBoard.charts);
                        setLoading(false);
                        return;
                    }
                }

                // Default: Fallback to all charts from chat history for this dataset
                const chatRes = await axios.get(`${API_URL}/datasets/${datasetId}/chats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const allCharts = chatRes.data
                    .filter(msg => msg.role === 'ai' && msg.data && msg.data.chart_type)
                    .map(msg => ({
                        ...msg.data,
                        id: msg.id,
                        explanation: msg.text
                    }));
                
                setCharts(allCharts);
            } catch (err) {
                console.error("Error loading professional board:", err);
            } finally {
                setLoading(false);
            }
        };

        loadPageData();
    }, [datasetId, slug, navigate, token, datasets]);

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-color)]">
                <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
                <p className="text-sm font-medium text-[var(--text-secondary)]">Assembling Professional Workspace...</p>
            </div>
        );
    }

    return (
        <div className="layout-container" style={{ display: 'flex', flexDirection: 'row', height: '100vh', overflow: 'hidden' }}>
            {isSidebarVisible && <Sidebar />}
            <main style={{ flex: 1, minWidth: 0, display: 'flex', overflow: 'hidden' }}>
                <DynamicDashboard 
                    charts={charts} 
                    onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
                    isSidebarVisible={isSidebarVisible}
                />
            </main>
        </div>
    );

}
