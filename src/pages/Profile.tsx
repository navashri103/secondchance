import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion } from 'motion/react';
import { User, Mail, Calendar, MapPin, CheckCircle2, AlertCircle, Ghost, Leaf, Zap } from 'lucide-react';
import { Project, UserProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface ProfileProps {
  user: any;
  profile: UserProfile | null;
}

export default function Profile({ user, profile }: ProfileProps) {
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [joinedProjects, setJoinedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Projects I reported
    const q1 = query(
      collection(db, 'projects'), 
      where('authorUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    // Projects I joined
    const q2 = query(
      collection(db, 'projects'),
      where('volunteerUids', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub1 = onSnapshot(q1, (snapshot) => {
      setMyProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'projects'));

    const unsub2 = onSnapshot(q2, (snapshot) => {
      setJoinedProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'projects'));

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
          <User className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Sign in to view your profile</h2>
          <p className="text-slate-500">Track your environmental contributions and project revivals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Profile Header */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <img 
            src={user.photoURL || ''} 
            alt={user.displayName} 
            className="w-32 h-32 rounded-[2rem] border-4 border-emerald-50 shadow-lg"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg">
            <Leaf className="w-5 h-5" />
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">{user.displayName}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2 text-slate-500 text-sm">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Joined {profile ? new Date(profile.createdAt).toLocaleDateString() : 'recently'}
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-600 uppercase tracking-wider text-[10px]">
                  {profile?.role || 'User'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-4">
            <div className="text-center md:text-left">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Projects Reported</div>
              <div className="text-2xl font-extrabold text-slate-900">{myProjects.length}</div>
            </div>
            <div className="w-px h-10 bg-slate-100 hidden md:block" />
            <div className="text-center md:text-left">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Missions Joined</div>
              <div className="text-2xl font-extrabold text-slate-900">{joinedProjects.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* My Reports */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-emerald-600" />
            My Reports
          </h2>
          <div className="space-y-4">
            {myProjects.length === 0 ? (
              <EmptyState message="You haven't reported any failed projects yet." />
            ) : (
              myProjects.map(project => <ContributionCard key={project.id} project={project} type="reported" />)
            )}
          </div>
        </section>

        {/* Joined Missions */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            Joined Missions
          </h2>
          <div className="space-y-4">
            {joinedProjects.length === 0 ? (
              <EmptyState message="You haven't joined any revival missions yet." />
            ) : (
              joinedProjects.map(project => <ContributionCard key={project.id} project={project} type="joined" />)
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const ContributionCard: React.FC<{ project: Project, type: 'reported' | 'joined' }> = ({ project, type }) => {
  return (
    <motion.div
      whileHover={{ x: 5 }}
      className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
          <img 
            src={project.imageUrl || `https://picsum.photos/seed/${project.id}/200/200`} 
            alt={project.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 line-clamp-1">{project.name}</h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {project.locationName}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${project.status === 'abandoned' ? 'text-red-500' : 'text-emerald-600'}`}>
          {project.status}
        </div>
        <div className="text-xs text-slate-400">
          {formatDistanceToNow(new Date(project.createdAt?.toDate ? project.createdAt.toDate() : project.createdAt))} ago
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 px-6 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-3">
      <Ghost className="w-8 h-8 text-slate-300 mx-auto" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
