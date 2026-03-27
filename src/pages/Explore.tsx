import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { Map as MapIcon, Grid, List, Search, Filter, Ghost, AlertCircle, CheckCircle2, ArrowRight, X, Users, Zap, BarChart3, Clock, Share2 } from 'lucide-react';
import { Project } from '../types';
import { formatDistanceToNow } from 'date-fns';

// Fix Leaflet marker icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const AbandonedIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div class="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center"><div class="w-2 h-2 bg-white rounded-full"></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const RevivingIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div class="w-8 h-8 bg-emerald-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse"><div class="w-2 h-2 bg-white rounded-full"></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const formatDate = (date: any) => {
  try {
    if (!date) return 'Unknown';
    // Handle Firestore Timestamp
    const d = date?.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return formatDistanceToNow(d);
  } catch (e) {
    return 'Invalid Date';
  }
};

export default function Explore() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectsData);
      setLoading(false);

      // Check for project ID in URL
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = urlParams.get('id');
      if (projectId) {
        const project = projectsData.find(p => p.id === projectId);
        if (project) setSelectedProject(project);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    return () => unsubscribe();
  }, []);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.locationName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const MapController = ({ selectedProject }: { selectedProject: Project | null }) => {
    const map = useMap();
    useEffect(() => {
      if (selectedProject) {
        map.flyTo([selectedProject.lat, selectedProject.lng], 14, {
          duration: 2,
          easeLinearity: 0.25
        });
      }
    }, [selectedProject, map]);
    return null;
  };

  const handleJoinProject = async (projectId: string) => {
    if (!auth.currentUser) {
      alert('Please sign in to join a project.');
      return;
    }
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        volunteerUids: arrayUnion(auth.currentUser.uid),
        updatedAt: new Date().toISOString()
      });
      // Update local state for immediate feedback if needed, but onSnapshot handles it
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AI Post-Mortem & Recovery</h1>
          <p className="text-slate-500">Explore abandoned environmental projects waiting for a second chance.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <MapIcon className="w-4 h-4" />
            Map View
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Grid className="w-4 h-4" />
            Grid View
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by project name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['All', 'Water', 'Land', 'Air', 'Wildlife', 'Urban'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[600px] flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="relative">
          {viewMode === 'map' ? (
            <div className="h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-0">
                  <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapController selectedProject={selectedProject} />
                    {filteredProjects.map((project) => (
                  <Marker
                    key={project.id}
                    position={[project.lat, project.lng]}
                    icon={project.status === 'abandoned' ? AbandonedIcon : RevivingIcon}
                    eventHandlers={{
                      click: () => setSelectedProject(project),
                    }}
                  >
                    <Popup>
                      <div className="p-2 space-y-2 min-w-[200px]">
                        <h3 className="font-bold text-slate-900">{project.name}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2">{project.description}</p>
                        <div className="flex items-center justify-between pt-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${project.status === 'abandoned' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {project.status}
                          </span>
                          <button
                            onClick={() => setSelectedProject(project)}
                            className="text-xs font-bold text-emerald-600 hover:underline"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard 
                  key={project.id || Math.random()} 
                  project={project} 
                  isSelected={selectedProject?.id === project.id}
                  onClick={() => setSelectedProject(project)} 
                />
              ))}
              {filteredProjects.length === 0 && (
                <div className="col-span-full py-20 text-center space-y-4">
                  <Ghost className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-slate-500 font-medium">No projects found in this area of the graveyard.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Slide-over Analysis Panel */}
      <AnimatePresence>
        {selectedProject && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="fixed inset-0 bg-emerald-900/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[70] overflow-y-auto"
            >
              <div className="relative h-64 md:h-80 overflow-hidden">
                <img 
                  src={selectedProject.imageUrl || `https://picsum.photos/seed/${selectedProject.id}/1200/800`} 
                  alt={selectedProject.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/55 to-transparent flex flex-col justify-end p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedProject.status === 'abandoned' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                    }`}>
                      {selectedProject.status}
                    </div>
                    <div className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {selectedProject.category}
                    </div>
                  </div>
                  <h2 className="text-3xl font-black text-white leading-tight">
                    {selectedProject.name}
                  </h2>
                  <p className="text-white/80 flex items-center gap-2 mt-2 text-sm">
                    <MapIcon className="w-4 h-4 text-emerald-400" />
                    {selectedProject.locationName}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedProject(null)} 
                  className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-full transition-colors text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-10">
                {/* AI Score Overview */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-2">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Revival Score</div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-extrabold text-emerald-600">{selectedProject.revivalScore}%</span>
                      <Zap className="w-5 h-5 text-emerald-400 mb-1" />
                    </div>
                  </div>
                  
                  <div className="group relative bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-2 cursor-help transition-all hover:bg-emerald-50 hover:border-emerald-100">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Success Prob.</div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-extrabold text-emerald-600">{selectedProject.successProbability}%</span>
                      <div className="relative w-5 h-5 mb-1">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-200" strokeWidth="4" />
                          <circle 
                            cx="18" cy="18" r="16" fill="none" 
                            className="stroke-emerald-500" 
                            strokeWidth="4" 
                            strokeDasharray={`${selectedProject.successProbability}, 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Interactive Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 p-4 bg-emerald-700 text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Analysis Result</span>
                          <span className="text-xs font-bold text-emerald-400">{selectedProject.successProbability}%</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-300">
                          {selectedProject.successProbability > 70 
                            ? "High recovery potential. The environmental impact gain is substantial and resources are well-aligned for a successful revival."
                            : selectedProject.successProbability > 40
                            ? "Moderate success probability. Requires careful resource allocation and community support to overcome identified logistical gaps."
                            : "Challenging recovery. Success depends on radical strategy shifts and significant external intervention to reverse the current decline."}
                        </p>
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-emerald-700" />
                    </div>
                  </div>
                </div>

                {/* Failure Diagnosis */}
                <section className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    AI Post-Mortem Analysis
                  </h3>
                  <div className="p-6 bg-red-50/50 border border-red-100 rounded-2xl text-slate-700 leading-relaxed italic">
                    "{selectedProject.diagnosis}"
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">
                      Reason: {selectedProject.failureReason}
                    </div>
                    <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">
                      Gap: {selectedProject.resourceGap}
                    </div>
                  </div>
                </section>

                {/* Revival Plan */}
                <section className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-500" />
                    The Revival Plan
                  </h3>
                  <div className="space-y-3">
                    {selectedProject.revivalPlan.map((step, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:border-emerald-200 transition-colors">
                        <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <span className="text-slate-700 text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Impact Metrics */}
                <section className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-500" />
                    Projected Environmental Gain
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <MetricBox label="Waste Removed" value={`${selectedProject.impactMetrics.wasteRemoved}T`} />
                    <MetricBox label="Trees Restored" value={selectedProject.impactMetrics.treesRestored.toString()} />
                    <MetricBox label="Water Quality" value={`+${selectedProject.impactMetrics.waterQualityImprovement}%`} />
                  </div>
                </section>

                {/* Action CTA */}
                <div className="pt-8 border-t border-slate-100 flex items-center gap-4">
                  <button
                    onClick={() => handleJoinProject(selectedProject.id!)}
                    disabled={selectedProject.volunteerUids.includes(auth.currentUser?.uid || '')}
                    className="flex-1 px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:shadow-none disabled:text-slate-400"
                  >
                    {selectedProject.volunteerUids.includes(auth.currentUser?.uid || '') ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Joined Project
                      </>
                    ) : (
                      <>
                        Join This Project
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  <div className="flex items-center gap-2 text-slate-400 px-4">
                    <Users className="w-5 h-5" />
                    <span className="font-bold">{selectedProject.volunteerUids.length}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/explore?id=${selectedProject.id}`);
                      alert('Link copied to clipboard!');
                    }}
                    className="p-4 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                    title="Share Project"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  isSelected?: boolean;
  onClick: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, isSelected, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        borderColor: isSelected ? '#10b981' : (project.status === 'abandoned' ? '#fee2e2' : '#f1f5f9'),
        scale: isSelected ? 1.05 : 1,
        boxShadow: isSelected ? '0 20px 25px -5px rgb(16 185 129 / 0.1), 0 8px 10px -6px rgb(16 185 129 / 0.1)' : '0 1px 2px 0 rgb(0 0 0 / 0.05)'
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25,
        borderColor: { duration: 0.3 }
      }}
      whileHover={!isSelected ? { y: -8, scale: 1.02 } : {}}
      onClick={onClick}
      className={`bg-white border-2 rounded-2xl overflow-hidden transition-shadow cursor-pointer group flex flex-col h-full z-10 ${
        isSelected ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-slate-100'
      }`}
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={project.imageUrl || `https://picsum.photos/seed/${project.id}/800/600`} 
          alt={project.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/55 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <span className="text-white text-xs font-bold flex items-center gap-1">
            <MapIcon className="w-3 h-3" />
            {project.locationName}
          </span>
        </div>
        <div className="absolute top-4 left-4">
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg ${
            project.status === 'abandoned' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
          }`}>
            {project.status}
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col gap-2">
            <div className="px-2 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-md uppercase tracking-wider w-fit">
              {project.category}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Revival Score</div>
            <div className="text-xl font-extrabold text-emerald-600">{project.revivalScore}%</div>
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-1">
          {project.name}
        </h3>
        
        <p className="text-slate-500 text-sm line-clamp-2 mb-6 leading-relaxed flex-1">
          {project.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            {formatDate(project.createdAt)} ago
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            View Analysis
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MetricBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}
