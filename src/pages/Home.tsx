import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Leaf, Map as MapIcon, PlusCircle, BarChart3, ArrowRight, ShieldCheck, Zap, Users, Globe, Recycle, Heart } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-32 pb-32">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden min-h-[80vh] flex items-center">
        <div className="absolute top-0 right-0 w-full h-full -z-10 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-accent/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] animate-pulse" />
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-accent/10 border border-accent/20 text-accent text-xs font-black uppercase tracking-widest italic"
            >
              <Zap className="w-4 h-4 fill-accent" />
              <span>AI-Powered Recovery Engine</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-7xl md:text-8xl font-black tracking-tighter text-ink leading-[0.85] uppercase italic"
            >
              Revive <br />
              <span className="text-accent">The Lost</span> <br />
              Impact.
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-ink/60 max-w-xl leading-relaxed font-medium"
            >
              We don't just build new things. We fix what's broken. ReviveEarth AI analyzes failed environmental projects and provides the data-driven roadmap to bring them back to life.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-6 pt-6"
            >
              <Link
                to="/report"
                className="w-full sm:w-auto px-10 py-5 bg-accent text-white rounded-2xl font-black text-lg uppercase italic tracking-tighter hover:bg-accent-hover transition-all shadow-[0_0_30px_rgba(255,78,0,0.3)] flex items-center justify-center gap-3 group"
              >
                Report Failure
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Link>
              <Link
                to="/explore"
                className="w-full sm:w-auto px-10 py-5 bg-surface text-ink border border-line rounded-2xl font-black text-lg uppercase italic tracking-tighter hover:bg-line transition-all flex items-center justify-center gap-3"
              >
                <MapIcon className="w-6 h-6" />
                The Graveyard
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="relative hidden lg:block"
          >
            <div className="aspect-square bg-surface border-2 border-line rounded-[4rem] overflow-hidden p-12 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center shadow-2xl">
                    <Leaf className="text-white w-10 h-10" />
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black italic uppercase tracking-tighter">82%</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Avg. Success Rate</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-2 w-full bg-line rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '82%' }}
                      transition={{ delay: 1, duration: 1.5 }}
                      className="h-full bg-accent" 
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-60">
                    <span>Project Recovery Status</span>
                    <span>Optimized</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-bg/50 rounded-2xl border border-line">
                    <div className="text-accent mb-2"><Globe className="w-5 h-5" /></div>
                    <div className="text-lg font-black italic uppercase tracking-tighter">5.2T</div>
                    <div className="text-[8px] font-bold uppercase tracking-widest opacity-40">Waste Potential</div>
                  </div>
                  <div className="p-4 bg-bg/50 rounded-2xl border border-line">
                    <div className="text-accent mb-2"><Users className="w-5 h-5" /></div>
                    <div className="text-lg font-black italic uppercase tracking-tighter">340+</div>
                    <div className="text-[8px] font-bold uppercase tracking-widest opacity-40">Volunteers</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-10">
        <FeatureCard
          icon={<ShieldCheck className="w-10 h-10 text-accent" />}
          title="AI Diagnosis"
          description="Our system analyzes logistical, financial, and community data to pinpoint exactly why a project stalled."
        />
        <FeatureCard
          icon={<Zap className="w-10 h-10 text-accent" />}
          title="Revival Roadmap"
          description="Get a step-by-step checklist generated by AI to restart your project with the highest probability of success."
        />
        <FeatureCard
          icon={<Users className="w-10 h-10 text-accent" />}
          title="Matchmaking"
          description="We connect failed projects with nearby universities, NGOs, and volunteers ready to take a second shot."
        />
      </section>

      {/* Stats Section */}
      <section className="bg-surface border border-line rounded-[4rem] p-16 md:p-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-accent/5 -skew-x-12 translate-x-1/4" />
        
        <div className="max-w-4xl space-y-12 relative z-10">
          <h2 className="text-5xl md:text-7xl font-black leading-[0.9] uppercase italic tracking-tighter">
            Recovering the <br />
            <span className="text-accent">Lost ROI</span> of <br />
            Activism.
          </h2>
          <p className="text-xl text-ink/60 leading-relaxed font-medium max-w-2xl">
            Over 30% of local environmental grants result in unfinished projects due to minor logistical hurdles. We aren't just building a new tool; we are recovering the investment already made by the community.
          </p>
          <div className="grid sm:grid-cols-3 gap-12 pt-8">
            <div className="space-y-3">
              <div className="text-6xl font-black italic uppercase tracking-tighter text-accent">82%</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Avg. Revival Score</div>
            </div>
            <div className="space-y-3">
              <div className="text-6xl font-black italic uppercase tracking-tighter text-accent">40%</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Impact Gain</div>
            </div>
            <div className="space-y-3">
              <div className="text-6xl font-black italic uppercase tracking-tighter text-accent">12k</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Hours Recovered</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-10 py-20">
        <h2 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter">Ready to resuscitate?</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            to="/report"
            className="w-full sm:w-auto px-12 py-6 bg-accent text-white rounded-3xl font-black text-xl uppercase italic tracking-tighter hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,78,0,0.4)]"
          >
            Start Recovery
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-12 py-6 bg-surface text-ink border border-line rounded-3xl font-black text-xl uppercase italic tracking-tighter hover:bg-line transition-all"
          >
            View Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.02 }}
      className="p-10 bg-surface border border-line rounded-[3rem] transition-all group hover:border-accent/50"
    >
      <div className="mb-8 p-4 bg-bg rounded-2xl w-fit group-hover:bg-accent/10 transition-colors">{icon}</div>
      <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4">{title}</h3>
      <p className="text-ink/60 leading-relaxed font-medium">{description}</p>
    </motion.div>
  );
}
