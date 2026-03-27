import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Users, Leaf, Zap, Droplets, Trash2, Ghost, ChevronRight } from 'lucide-react';
import { Project } from '../types';

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    return () => unsubscribe();
  }, []);

  const totalRevived = projects.filter(p => p.status === 'reviving' || p.status === 'active').length;
  const totalWaste = projects.reduce((acc, p) => acc + p.impactMetrics.wasteRemoved, 0);
  const totalTrees = projects.reduce((acc, p) => acc + p.impactMetrics.treesRestored, 0);
  const avgSuccess = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + p.successProbability, 0) / projects.length) 
    : 0;

  const chartData = projects.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    waste: p.impactMetrics.wasteRemoved,
    trees: p.impactMetrics.treesRestored,
    success: p.successProbability
  })).slice(0, 8);

  const statusData = [
    { name: 'Abandoned', value: projects.filter(p => p.status === 'abandoned').length },
    { name: 'Reviving', value: projects.filter(p => p.status === 'reviving').length },
    { name: 'Active', value: projects.filter(p => p.status === 'active').length },
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white p-3 border border-slate-100 rounded-xl shadow-xl flex flex-col gap-1 min-w-[120px]">
          <p className="text-[10px] font-bold text-slate-900 line-clamp-1">{data.name}</p>
          <p className="text-[10px] text-emerald-600 font-bold">
            {payload[0].name}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
          <Ghost className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">No Data Yet</h2>
          <p className="text-slate-500 max-w-md">Report some failed projects to see the projected impact of reviving them.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-20 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Impact Dashboard</h1>
          <p className="text-slate-500">Visualizing the potential gain of environmental resuscitation.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm">
          <TrendingUp className="w-4 h-4" />
          Live Data
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 w-full">
        <StatCard 
          image="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=200&h=200"
          label="Projects Revived" 
          value={totalRevived.toString()} 
        />
        <StatCard 
          image="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=200&h=200"
          label="Waste Potential" 
          value={`${totalWaste.toFixed(1)}T`} 
        />
        <StatCard 
          image="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=200&h=200"
          label="Trees Restored" 
          value={totalTrees.toString()} 
        />
        <StatCard 
          image="https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=200&h=200"
          label="Avg. Success" 
          value={`${avgSuccess}%`} 
        />
      </div>

      <div className="max-w-md mx-auto grid gap-6">
        {/* Waste Removal Potential Chart */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-emerald-600" />
            Waste Removal Potential
          </h3>
          <div className="h-[150px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="waste" name="Waste (Tons)" fill="#059669" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Success Probability Area Chart */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Success Probability (%)
          </h3>
          <div className="h-[150px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="success" name="Success Prob." stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorSuccess)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Status Distribution
          </h3>
          <div className="h-[150px] flex items-center justify-between gap-2">
            <div className="flex-1 h-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-1 pr-2 shrink-0">
              {statusData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-[9px]">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-500">{d.name}:</span>
                  <span className="font-bold text-slate-900">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tree Restoration Chart */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-600" />
            Tree Restoration Potential
          </h3>
          <div className="h-[150px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="trees" name="Trees" fill="#10b981" radius={[0, 4, 4, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Featured Projects Section */}
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            Featured High-Impact Projects
          </h3>
          <button 
            onClick={() => navigate('/explore')}
            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            View All
          </button>
        </div>
        <div className="grid gap-4">
          {projects.slice(0, 3).map((project) => (
            <motion.div
              key={project.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate('/explore')}
              className="group bg-white border border-slate-100 rounded-2xl p-3 shadow-sm flex items-center gap-4 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <img 
                  src={project.imageUrl || `https://picsum.photos/seed/${project.id}/100/100`} 
                  alt={project.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">{project.name}</h4>
                <p className="text-[10px] text-slate-500 line-clamp-1">{project.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-medium">
                    {project.status}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {project.locationName}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, image, label, value }: { icon?: React.ReactNode, image?: string, label: string, value: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group cursor-default"
    >
      {image && (
        <>
          <div className="absolute inset-0 opacity-10 group-hover:opacity-100 transition-all duration-500">
            <img src={image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/80 transition-all duration-500" />
        </>
      )}
      <div className="relative z-10">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
          {image ? (
            <img src={image} alt="" className="w-6 h-6 rounded-lg object-cover" referrerPolicy="no-referrer" />
          ) : (
            icon
          )}
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-xl font-extrabold text-slate-900">{value}</div>
      </div>
    </motion.div>
  );
}
