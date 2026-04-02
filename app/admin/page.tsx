'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  auth, db, onAuthStateChanged,
  collection, getDocs, query,
  orderBy, limit,
  FirebaseUser,
} from '@/firebase';

const ADMIN_EMAIL = 'dain.russell@gmail.com';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [waitlist, setWaitlist] = useState<Array<{ id: string; email: string; joinedAt?: string; source?: string }>>([]);
  const [recentSignals, setRecentSignals] = useState<Array<{ id: string; title?: string; userScore?: number; analyzed?: boolean; createdAt?: string }>>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentOpportunities, setRecentOpportunities] = useState<Array<{ id: string; result?: any; signalTitle?: string; marketMode?: string; countryTag?: string; createdAt?: string }>>([]);
  const [usageLogs, setUsageLogs] = useState<Array<{ id: string; type: string; userId: string; marketMode?: string; countryTag?: string; timestamp?: string }>>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u || u.email !== ADMIN_EMAIL) {
        router.push('/');
        return;
      }
      setUser(u);
      loadAdminData();
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAdminData = async () => {
    try {
      const waitlistSnap = await getDocs(
        query(collection(db, 'waitlist'), orderBy('joinedAt', 'desc'))
      );
      const waitlistData = waitlistSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{
        id: string; email: string; joinedAt?: string; source?: string;
      }>;
      setWaitlist(waitlistData);

      const usageSnap = await getDocs(
        query(collection(db, 'usage_logs'), orderBy('timestamp', 'desc'), limit(50))
      );
      const usageData = usageSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{
        id: string; type: string; userId: string; marketMode?: string; countryTag?: string; timestamp?: string;
      }>;
      setUsageLogs(usageData);

      const signalsSnap = await getDocs(
        query(collection(db, 'agent_signals'), orderBy('createdAt', 'desc'), limit(20))
      );
      const signalsData = signalsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{
        id: string; title?: string; userScore?: number; analyzed?: boolean; createdAt?: string; opportunityId?: string;
      }>;
      setRecentSignals(signalsData);

      const oppsSnap = await getDocs(
        query(collection(db, 'agent_opportunities'), orderBy('createdAt', 'desc'), limit(20))
      );
      const oppsData = oppsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: string; result?: any; signalTitle?: string; marketMode?: string; countryTag?: string; createdAt?: string;
      }>;
      setRecentOpportunities(oppsData);

      setStats({
        waitlistCount: waitlistData.length,
        totalAnalyses: usageData.filter(u => u.type === 'analysis').length,
        totalExecutions: usageData.filter(u => u.type === 'execution_suite').length,
        totalValidations: usageData.filter(u => u.type === 'validation').length,
        uniqueUsers: new Set(usageData.map(u => u.userId)).size,
        agentSignals: signalsData.length,
        agentOpportunities: oppsData.length,
      });
    } catch (err) {
      console.error('Admin data load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Waitlist', value: stats?.waitlistCount ?? 0, color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
    { label: 'Active users', value: stats?.uniqueUsers ?? 0, color: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
    { label: 'Analyses run', value: stats?.totalAnalyses ?? 0, color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700' },
    { label: 'Validations', value: stats?.totalValidations ?? 0, color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
    { label: 'Execution suites', value: stats?.totalExecutions ?? 0, color: 'bg-gray-50 border-gray-200', textColor: 'text-gray-700' },
    { label: 'Agent signals', value: stats?.agentSignals ?? 0, color: 'bg-indigo-50 border-indigo-200', textColor: 'text-indigo-700' },
    { label: 'Agent opportunities', value: stats?.agentOpportunities ?? 0, color: 'bg-teal-50 border-teal-200', textColor: 'text-teal-700' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'waitlist', label: `Waitlist (${waitlist.length})` },
    { id: 'usage', label: 'Usage logs' },
    { id: 'agent', label: 'Agent activity' },
  ];

  const runAgent = async (path: string) => {
    const secret = prompt('Enter CRON_SECRET:');
    if (!secret) return;
    try {
      const r = await fetch(path, { headers: { Authorization: `Bearer ${secret}` } });
      const d = await r.json();
      alert(JSON.stringify(d, null, 2));
    } catch (e) {
      alert(String(e));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            <p className="text-xs text-gray-500">Signal to Startup — Internal</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{user?.email}</span>
            <button
              onClick={() => router.push('/')}
              className="text-xs text-gray-500 hover:text-black px-3 py-1.5 border border-gray-200 rounded-lg"
            >
              ← Back to app
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(stat => (
            <div key={stat.label} className={`p-4 rounded-xl border ${stat.color}`}>
              <div className={`text-2xl font-bold ${stat.textColor} mb-1`}>{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center justify-between">
                  Recent waitlist signups
                  <span className="text-xs font-normal text-gray-500">{waitlist.length} total</span>
                </h3>
                <div className="space-y-2">
                  {waitlist.slice(0, 5).map(entry => (
                    <div key={entry.id as string} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 truncate flex-1">{entry.email as string}</span>
                      <span className="text-xs text-gray-400 ml-3 flex-shrink-0">
                        {entry.joinedAt ? new Date(entry.joinedAt as string).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  ))}
                  {waitlist.length === 0 && <p className="text-sm text-gray-400">No signups yet</p>}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold mb-4">Recent activity</h3>
                <div className="space-y-2">
                  {usageLogs.slice(0, 8).map(log => (
                    <div key={log.id as string} className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        log.type === 'analysis' ? 'bg-purple-100 text-purple-700'
                          : log.type === 'validation' ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {(log.type as string)?.replace('_', ' ')}
                      </span>
                      <span className="text-gray-500 capitalize">
                        {(log.marketMode as string) || 'global'}
                        {log.countryTag ? ` · ${log.countryTag}` : ''}
                      </span>
                      <span className="text-gray-300 ml-auto">
                        {log.timestamp ? new Date(log.timestamp as string).toLocaleTimeString() : ''}
                      </span>
                    </div>
                  ))}
                  {usageLogs.length === 0 && <p className="text-sm text-gray-400">No activity yet</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold mb-4">Agent status</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: 'Signal Monitor', schedule: 'Daily 7am UTC', icon: '📡' },
                  { name: 'Opportunity Scout', schedule: 'Daily 8am UTC', icon: '🔍' },
                  { name: 'Email Digest', schedule: 'Daily 9am UTC', icon: '📧' },
                ].map(agent => (
                  <div key={agent.name} className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                    <div className="text-2xl mb-1">{agent.icon}</div>
                    <p className="text-xs font-medium text-green-800">{agent.name}</p>
                    <p className="text-xs text-green-600 mt-0.5">{agent.schedule}</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-xs text-green-600">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WAITLIST TAB */}
        {activeTab === 'waitlist' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">{waitlist.length} people on waitlist</p>
              <button
                onClick={() => {
                  const emails = waitlist.map(w => w.email).join('\n');
                  navigator.clipboard.writeText(emails);
                  alert('Emails copied to clipboard!');
                }}
                className="text-xs px-3 py-1.5 bg-black text-white rounded-lg"
              >
                Copy all emails
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Email', 'Source', 'Joined'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {waitlist.map(entry => (
                    <tr key={entry.id as string} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{entry.email as string}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{(entry.source as string) || 'landing-page'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {entry.joinedAt ? new Date(entry.joinedAt as string).toLocaleDateString() : 'Unknown'}
                      </td>
                    </tr>
                  ))}
                  {waitlist.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No waitlist entries yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USAGE LOGS TAB */}
        {activeTab === 'usage' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {['analysis', 'execution_suite', 'validation', 'url_fetch'].map(type => (
                <div key={type} className="p-3 bg-white rounded-xl border border-gray-200 text-center">
                  <div className="text-xl font-bold">{usageLogs.filter(u => u.type === type).length}</div>
                  <div className="text-xs text-gray-500 capitalize mt-1">{type.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Type', 'Market', 'Country', 'Time'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usageLogs.map(log => (
                    <tr key={log.id as string} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          log.type === 'analysis' ? 'bg-purple-100 text-purple-700'
                            : log.type === 'validation' ? 'bg-amber-100 text-amber-700'
                            : log.type === 'execution_suite' ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {(log.type as string)?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 capitalize">{(log.marketMode as string) || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{(log.countryTag as string) || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {log.timestamp ? new Date(log.timestamp as string).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                  {usageLogs.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No usage logs yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AGENT ACTIVITY TAB */}
        {activeTab === 'agent' && (
          <div className="space-y-6">
            <div className="flex gap-3">
              {[
                { label: '▶ Run Monitor', path: '/api/agent/monitor' },
                { label: '▶ Run Scout',   path: '/api/agent/scout'   },
                { label: '▶ Run Digest',  path: '/api/agent/digest'  },
              ].map(btn => (
                <button
                  key={btn.path}
                  onClick={() => runAgent(btn.path)}
                  className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Recent agent signals ({recentSignals.length})</h3>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Title', 'Score', 'Analyzed', 'Time'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentSignals.map(signal => (
                      <tr key={signal.id as string} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-800 max-w-xs truncate">{signal.title as string}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold ${
                            (signal.userScore as number) >= 80 ? 'text-green-600'
                              : (signal.userScore as number) >= 60 ? 'text-amber-600'
                              : 'text-gray-500'
                          }`}>
                            {signal.userScore as number}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            signal.analyzed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {signal.analyzed ? 'Yes' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {signal.createdAt ? new Date(signal.createdAt as string).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                    {recentSignals.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No agent signals yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Agent opportunities ({recentOpportunities.length})</h3>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Best idea', 'Signal', 'Market', 'Time'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentOpportunities.map(opp => {
                      const result = opp.result as Record<string, unknown> | undefined;
                      const bestIdea = result?.best_idea as Record<string, unknown> | undefined;
                      return (
                        <tr key={opp.id as string} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs font-medium text-gray-800">{(bestIdea?.name as string) || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{(opp.signalTitle as string) || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 capitalize">
                            {(opp.marketMode as string) || '—'}{opp.countryTag ? ` · ${opp.countryTag}` : ''}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">
                            {opp.createdAt ? new Date(opp.createdAt as string).toLocaleString() : '—'}
                          </td>
                        </tr>
                      );
                    })}
                    {recentOpportunities.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No opportunities yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
