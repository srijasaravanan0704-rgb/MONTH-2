import React, { useState, useEffect } from 'react';
import {
  fetchMachines,
  fetchDashboardStats,
  fetchDashboardAnalytics,
  fetchMaintenanceRecords,
  fetchAlerts,
  markAlertRead,
  clearAllAlerts,
} from './services/api';
import {
  Machine,
  DashboardStats,
  DashboardAnalytics,
  MaintenanceRecord,
  Alert,
} from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { NotificationDrawer } from './components/NotificationDrawer';
import { playAlertSound } from './utils/audio';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { Factory3DPage } from './pages/Factory3DPage';
import { MachinesPage } from './pages/MachinesPage';
import { PredictiveAiPage } from './pages/PredictiveAiPage';
import { MlEvaluationPage } from './pages/MlEvaluationPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Core Data
  const [machines, setMachines] = useState<Machine[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Cross-page navigation state
  const [preselectedMachineForPredict, setPreselectedMachineForPredict] = useState<Machine | null>(null);
  const [targetLiveMachineId, setTargetLiveMachineId] = useState<string>('MCH-04');
  const [maintModalState, setMaintModalState] = useState<{
    open: boolean;
    machineId?: string;
    title?: string;
    desc?: string;
    priority?: string;
  }>({ open: false });

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      const [mList, sData, aData, mRecs, altList] = await Promise.all([
        fetchMachines(),
        fetchDashboardStats(),
        fetchDashboardAnalytics(),
        fetchMaintenanceRecords(),
        fetchAlerts(),
      ]);

      setMachines(mList);
      setStats(sData);
      setAnalytics(aData);
      setMaintenanceRecords(mRecs);
      setAlerts(altList);
    } catch (err) {
      console.error('Error loading factory data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Simulate Instant Anomaly from Navbar
  const handleSimulateAnomaly = () => {
    playAlertSound();

    const newAlert: Alert = {
      id: Date.now(),
      machine_id: 'MCH-04',
      type: 'Critical',
      title: 'Emergency High Vibration Anomaly Injected',
      message: 'Drive shaft vibration spiked to 59.4 mm/s (> ISO 10816 limit 45.0 mm/s). Immediate safety inspection requested.',
      read: 0,
      timestamp: new Date().toISOString(),
    };

    setAlerts((prev) => [newAlert, ...prev]);

    // Update MCH-04 status locally to trigger visual alarms
    setMachines((prev) =>
      prev.map((m) =>
        m.id === 'MCH-04'
          ? { ...m, status: 'Critical', vibration: 59.4, failure_prob: 0.92, health_score: 22.0 }
          : m
      )
    );
  };

  // Cross-page routing helpers
  const handleSelectMachineForPredict = (machine: Machine) => {
    setPreselectedMachineForPredict(machine);
    setActiveTab('predictive-ai');
  };

  const handleNavigateToLive = (machineId: string) => {
    setTargetLiveMachineId(machineId);
    setActiveTab('live-monitoring');
  };

  const handleOpenMaintenanceModal = (
    machineId: string,
    title?: string,
    desc?: string,
    priority?: string
  ) => {
    setMaintModalState({
      open: true,
      machineId,
      title,
      desc,
      priority,
    });
    setActiveTab('maintenance');
  };

  const handleMarkAlertRead = async (id: number) => {
    try {
      await markAlertRead(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: 1 } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllAlerts = async () => {
    try {
      await clearAllAlerts();
      setAlerts((prev) => prev.map((a) => ({ ...a, read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadAlertsCount = alerts.filter((a) => a.read === 0).length;
  const predictedFailuresCount = stats?.predicted_failures ?? 2;
  const maintenanceDueCount = stats?.maintenance_required ?? 3;

  return (
    <div className="min-h-screen bg-[#080808] text-[#F5F5F5] flex flex-col selection:bg-[#D4AF37]/30 selection:text-black">
      {/* Top SCADA Navigation Header */}
      <Navbar
        onRefresh={loadAllData}
        isRefreshing={isRefreshing}
        unreadAlertsCount={unreadAlertsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSimulateAnomaly={handleSimulateAnomaly}
      />

      {/* Main Layout: Sidebar + Dynamic View */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          predictedFailuresCount={predictedFailuresCount}
          maintenanceDueCount={maintenanceDueCount}
        />

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#080808] via-[#121212] to-[#080808] min-h-[calc(100vh-65px)]">
          {activeTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              analytics={analytics}
              machines={machines}
              maintenanceRecords={maintenanceRecords}
              onSelectMachineForPredict={handleSelectMachineForPredict}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === '3d-twin' && (
            <Factory3DPage
              machines={machines}
              onSelectMachineForPredict={handleSelectMachineForPredict}
              onNavigateToLive={handleNavigateToLive}
              onOpenMaintenanceModal={handleOpenMaintenanceModal}
            />
          )}

          {activeTab === 'machines' && (
            <MachinesPage
              machines={machines}
              onRefresh={loadAllData}
              onSelectMachineForPredict={handleSelectMachineForPredict}
              onNavigateToLive={handleNavigateToLive}
            />
          )}

          {activeTab === 'predictive-ai' && (
            <PredictiveAiPage
              machines={machines}
              preselectedMachine={preselectedMachineForPredict}
              onOpenWorkOrderModal={handleOpenMaintenanceModal}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'ml-evaluation' && <MlEvaluationPage />}

          {activeTab === 'live-monitoring' && (
            <LiveMonitoringPage
              machines={machines}
              initialMachineId={targetLiveMachineId}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenancePage
              records={maintenanceRecords}
              machines={machines}
              onRefresh={loadAllData}
              initialOpenModal={maintModalState.open}
              prefillMachineId={maintModalState.machineId}
              prefillTitle={maintModalState.title}
              prefillDesc={maintModalState.desc}
              prefillPriority={maintModalState.priority}
            />
          )}

          {activeTab === 'reports' && <ReportsPage machines={machines} />}

          {activeTab === 'settings' && <SettingsPage onRefresh={loadAllData} />}
        </main>
      </div>

      {/* Notifications Slide-over Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        alerts={alerts}
        onMarkRead={handleMarkAlertRead}
        onClearAll={handleClearAllAlerts}
      />
    </div>
  );
}

export default App;
