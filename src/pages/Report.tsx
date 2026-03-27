import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { analyzeProjectFailure } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, MapPin, AlertCircle, PlusCircle, ArrowRight, ArrowLeft, CheckCircle2, Loader2, Ghost, Image as ImageIcon, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Project } from '../types';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationPicker({ lat, lng, onLocationChange }: { lat: number, lng: number, onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return lat !== 0 ? <Marker position={[lat, lng]} icon={markerIcon} /> : null;
}

function MapController({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== 0 && lng !== 0) {
      map.flyTo([lat, lng], 13, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [lat, lng, map]);
  return null;
}

interface ReportProps {
  user: any;
}

export default function Report({ user }: ReportProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [showLocationResults, setShowLocationResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    locationName: '',
    lat: 0,
    lng: 0,
    description: '',
    failureReason: '',
    resourceGap: '',
    category: 'Land' as const,
    imageUrl: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'locationName') {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      if (value.length > 2) {
        searchTimeoutRef.current = setTimeout(() => {
          searchLocation(value);
        }, 250);
      } else {
        setLocationResults([]);
        setShowLocationResults(false);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLocationResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchLocation = async (query: string) => {
    setLocationSearchLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      setLocationResults(data);
      setShowLocationResults(true);
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setLocationSearchLoading(false);
    }
  };

  const handleLocationSelect = (result: any) => {
    setFormData(prev => ({
      ...prev,
      locationName: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    }));
    setShowLocationResults(false);
    setLocationResults([]);
  };

  const handleSubmit = async () => {
    // Authentication check removed so anyone can report

    setLoading(true);
    try {
      // 1. Get AI Analysis
      const aiAnalysis = await analyzeProjectFailure(
        formData.name,
        formData.description,
        formData.failureReason,
        formData.resourceGap
      );

      if (!aiAnalysis) {
        throw new Error('AI Analysis failed. Please try again.');
      }

      // 2. Save to Firestore
      const projectData: Omit<Project, 'id'> = {
        name: formData.name,
        locationName: formData.locationName,
        lat: formData.lat || (Math.random() * 180 - 90), // Mock lat if not provided
        lng: formData.lng || (Math.random() * 360 - 180), // Mock lng if not provided
        description: formData.description,
        status: 'abandoned',
        category: formData.category as any,
        imageUrl: formData.imageUrl || `https://picsum.photos/seed/${formData.category.toLowerCase()}/800/600`,
        failureReason: formData.failureReason,
        resourceGap: formData.resourceGap,
        revivalScore: aiAnalysis.revivalScore,
        successProbability: aiAnalysis.successProbability,
        diagnosis: aiAnalysis.diagnosis,
        revivalPlan: aiAnalysis.revivalPlan,
        impactMetrics: aiAnalysis.impactMetrics,
        authorUid: user?.uid || 'anonymous',
        volunteerUids: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'projects'), {
        ...projectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setStep(4); // Success step
    } catch (error) {
      console.error('Error reporting project:', error);
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    } finally {
      setLoading(false);
    }
  };

  // Login prompt removed so the form always displays

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="mb-12 space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">
          <PlusCircle className="w-4 h-4" />
          <span>Report a Failed Project</span>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900">Revive a Mission.</h1>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-4 pt-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-500 ${step >= s ? 'w-12 bg-emerald-600' : 'w-8 bg-slate-100'}`}
            />
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <InputGroup label="Project Name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Lake Cleanup Mission" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">Project Location</label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                              setFormData(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude, locationName: formData.locationName || 'Current Location' }));
                            });
                          }
                        }}
                        className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        Use My Location
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-[200px] rounded-xl overflow-hidden border border-slate-100 mb-4 z-0">
                    <MapContainer center={[formData.lat || 20, formData.lng || 0]} zoom={formData.lat ? 13 : 2} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationPicker 
                        lat={formData.lat} 
                        lng={formData.lng} 
                        onLocationChange={(lat, lng) => setFormData(prev => ({ ...prev, lat, lng }))} 
                      />
                      <MapController lat={formData.lat} lng={formData.lng} />
                    </MapContainer>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latitude</label>
                      <input 
                        type="number" 
                        value={formData.lat} 
                        onChange={(e) => setFormData(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Longitude</label>
                      <input 
                        type="number" 
                        value={formData.lng} 
                        onChange={(e) => setFormData(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div className="relative" ref={dropdownRef}>
                    <InputGroup label="Location Name" name="locationName" value={formData.locationName} onChange={handleInputChange} placeholder="e.g. Chennai, India" />
                    {locationSearchLoading && (
                      <div className="absolute right-4 top-[42px]">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      </div>
                    )}
                    {showLocationResults && locationResults.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden max-h-[200px] overflow-y-auto">
                        {locationResults.map((result, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleLocationSelect(result)}
                            className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                          >
                            <div className="font-medium text-slate-900 truncate">{result.display_name}</div>
                            <div className="text-[10px] text-slate-400">Lat: {result.lat}, Lon: {result.lon}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">Project Image URL (Optional)</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic">If left blank, we'll generate a thematic image for you.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">Category</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Water', 'Land', 'Air', 'Wildlife', 'Urban'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: cat as any }))}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          formData.category === cat 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' 
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-emerald-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the original mission and its goals..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all min-h-[120px]"
                  />
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.locationName || !formData.description}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:bg-slate-100 disabled:text-slate-400 shadow-lg shadow-emerald-100"
              >
                Next Step
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">What went wrong?</label>
                  <textarea
                    name="failureReason"
                    value={formData.failureReason}
                    onChange={handleInputChange}
                    placeholder="e.g. Volunteer shortage, lack of funding, logistical issues..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">Current Resource Gap</label>
                  <textarea
                    name="resourceGap"
                    value={formData.resourceGap}
                    onChange={handleInputChange}
                    placeholder="What is specifically needed to restart? (e.g. 50 volunteers, $2k for equipment)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all min-h-[120px]"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.failureReason || !formData.resourceGap}
                  className="flex-[2] py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  Review & Analyze
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <h3 className="font-bold text-slate-900 text-lg">Review Submission</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-slate-400 uppercase font-bold text-[10px] tracking-widest mr-2">Project:</span> {formData.name}</p>
                    <p><span className="text-slate-400 uppercase font-bold text-[10px] tracking-widest mr-2">Location:</span> {formData.locationName}</p>
                    <p><span className="text-slate-400 uppercase font-bold text-[10px] tracking-widest mr-2">Failure:</span> {formData.failureReason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>Our AI will now analyze this project to generate a failure diagnosis and a step-by-step recovery plan.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:bg-emerald-400"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Generate Revival Plan
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 py-8"
            >
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-slate-900">Project Reported!</h2>
                <p className="text-slate-500">Your project has been added to the graveyard and our AI has generated a recovery plan.</p>
              </div>
              <button
                onClick={() => navigate('/explore')}
                className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all"
              >
                View in Graveyard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function InputGroup({ label, name, value, onChange, placeholder }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-900 uppercase tracking-wider">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
      />
    </div>
  );
}
