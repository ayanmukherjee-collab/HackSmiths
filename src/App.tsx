import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { LoadingView } from './components/LoadingView';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { DocumentCenter } from './components/DocumentCenter';
import { Profile } from './components/Profile';

type AppState = 'DASHBOARD' | 'LOADING';
export type TabState = 'dashboard' | 'analytics' | 'documents' | 'profile';

const App: React.FC = () => {
    const [state, setState] = useState<AppState>('DASHBOARD');
    const [activeTab, setActiveTab] = useState<TabState>('dashboard');

    const [activeFileId, setActiveFileId] = useState<string | null>(null);

    const handleUpload = async (file: File) => {
        setState('LOADING');
        try {
            const formData = new FormData();
            formData.append('pdfFile', file);

            const req = await fetch('http://localhost:5001/api/ocr/upload', {
                method: 'POST',
                body: formData
            });
            const res = await req.json();

            if (res.success) {
                setActiveFileId(res.fileId);
            }
        } catch (e) {
            console.error("Upload failed", e);
        }

        setState('DASHBOARD');
    };

    return (
        <Layout activeTab={activeTab} onTabChange={setActiveTab}>
            {state === 'DASHBOARD' && activeTab === 'dashboard' && <Dashboard onUpload={handleUpload} onNavigateToAnalytics={() => setActiveTab('analytics')} />}
            {state === 'DASHBOARD' && activeTab === 'analytics' && <Analytics />}
            {state === 'DASHBOARD' && activeTab === 'documents' && <DocumentCenter onUpload={handleUpload} />}
            {state === 'DASHBOARD' && activeTab === 'profile' && <Profile />}
            {state === 'LOADING' && <LoadingView />}
        </Layout>
    );
};

export default App;
