import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  Trash2, 
  ArrowLeft, 
  X, 
  Info, 
  CalendarCheck, 
  Loader2, 
  Ship,
  LayoutGrid,
  ExternalLink,
  Smartphone,
  Beer
} from 'lucide-react';

const BRAND_COLORS = {
  bg: '#0a0f1c',           
  card: '#161d2a',         
  accent: '#f97316',       
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8', 
  glass: 'rgba(10, 15, 28, 0.85)'
};

const WP_TRIPS_API_URL = 'https://cruisytravel.com/wp-json/wp/v2/sandbar_trip?_embed&per_page=100';

const CATEGORIES = [
  { id: 'private', label: 'Private', icon: '🛥️' }, 
  { id: 'group', label: 'Social', icon: '🎉' },
  { id: 'rental', label: 'Rental', icon: '🚤' }, 
  { id: 'sunset', label: 'Sunset', icon: '🌅' },
  { id: 'clothing_optional', label: 'Clothing Optional', icon: '👙' },
  { id: 'eco', label: 'Eco', icon: '🛶' }, 
  { id: 'dog_friendly', label: 'Dog Friendly', icon: '🐾' },
  { id: 'luxury', label: 'Premium', icon: '💎' },
];

export default function App() {
  const [currentView, setCurrentView] = useState('home'); 
  const [sandbarTrips, setSandbarTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [savedTripIds, setSavedTripIds] = useState(() => {
    const saved = localStorage.getItem('captain_saved_trips_modern');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedTripForDetails, setSelectedTripForDetails] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tripsRes = await fetch(WP_TRIPS_API_URL);
        if (!tripsRes.ok) throw new Error('Network error loading trips');
        const tripsData = await tripsRes.json();
        
        const formattedTrips = tripsData.map(trip => {
          const tags = [];
          if (trip._embedded?.['wp:term']) {
             trip._embedded['wp:term'].forEach(termList => {
                termList.forEach(term => {
                   if (term.taxonomy === 'trip_vibe') tags.push(term.slug);
                });
             });
          }
          return {
            id: trip.id,
            title: trip.title.rendered,
            price: trip.acf?.price || '0',
            priceType: trip.acf?.price_type || '',
            duration: trip.acf?.duration || '',
            tags,
            image: trip._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&q=80&w=800',
            description: trip.acf?.short_description || 'Explore the best sandbars.',
            longDescription: trip.acf?.long_description || trip.acf?.short_description,
            affiliateLink: trip.acf?.affiliate_link || '#'
          };
        });
        setSandbarTrips(formattedTrips);
        setIsLoading(false);
      } catch (err) {
        setError("Unable to connect to service.");
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('captain_saved_trips_modern', JSON.stringify(savedTripIds));
  }, [savedTripIds]);

  const filteredTrips = useMemo(() => {
    if (selectedCategories.length === 0) return sandbarTrips;
    return sandbarTrips.filter(trip => 
      trip.tags.some(tag => selectedCategories.includes(tag))
    );
  }, [selectedCategories, sandbarTrips]);

  const toggleCategory = (catId) => {
    setSelectedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const toggleSave = (tripId, e) => {
    if (e) e.stopPropagation();
    setSavedTripIds(prev => 
      prev.includes(tripId) ? prev.filter(id => id !== tripId) : [...prev, tripId]
    );
  };

  const savedTripsData = sandbarTrips.filter(t => savedTripIds.includes(t.id));

  const DetailsModal = ({ trip, onClose }) => {
    if (!trip) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-[#161d2a] rounded-t-[2.5rem] sm:rounded-[2rem] max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 right-0 p-4 flex justify-end z-20">
             <button onClick={onClose} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition">
               <X size={20} />
             </button>
          </div>
          <div className="h-64 sm:h-80 -mt-14 relative">
             <img src={trip.image} alt={trip.title} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#161d2a] via-transparent to-transparent" />
          </div>
          <div className="px-6 pb-12 -mt-10 relative z-10 space-y-6">
            <h3 className="text-3xl font-bold text-white tracking-tight" dangerouslySetInnerHTML={{ __html: trip.title }} />
            <div className="flex flex-wrap gap-2">
              {trip.tags.map(tag => (
                <span key={tag} className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full uppercase">
                   {tag.replace('_', ' ')}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 p-4 rounded-2xl">
                  <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Duration</div>
                  <div className="text-lg font-bold text-white">{trip.duration}</div>
               </div>
               <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">From</div>
                  <div className="text-lg font-bold text-white">${trip.price} <span className="text-xs text-slate-400 font-normal">/ {trip.priceType}</span></div>
               </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Description</h4>
              <p className="text-slate-300 leading-relaxed text-sm">{trip.longDescription}</p>
            </div>
            <div className="pt-6 border-t border-white/5 flex gap-3">
              <a href={trip.affiliateLink} target="_blank" rel="noreferrer" className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-bold text-center hover:bg-orange-600 transition shadow-lg shadow-orange-500/20">Book Now</a>
              <button onClick={(e) => { toggleSave(trip.id, e); onClose(); }} className={`p-4 rounded-2xl border transition ${savedTripIds.includes(trip.id) ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                <Heart size={20} className={savedTripIds.includes(trip.id) ? "fill-red-500" : ""} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white font-sans selection:bg-orange-500/30">
      <style>{`
        body { font-family: 'Inter', sans-serif; }
        .glass { background: ${BRAND_COLORS.glass}; backdrop-filter: blur(16px); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Ship className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight leading-none uppercase">CAPTAIN<span className="text-orange-500"> KEY WEST</span></h1>
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Sandbar Navigator</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a href="https://barcrawl.captainkeywest.com/" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition group"><Beer size={14} className="group-hover:animate-bounce" /> Bar Crawl</a>
              <a href="https://appcaptainkeywest.com/" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white/5 border border-white/10 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition"><Smartphone size={14} /> KW App</a>
              <a href="https://captainkeywest.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white/5 border border-white/10 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition"><ExternalLink size={14} /> Website</a>
              <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block"></div>
              <button onClick={() => setCurrentView(currentView === 'home' ? 'saved' : 'home')} className={`relative p-2 rounded-full transition-all ${currentView === 'saved' ? 'bg-orange-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>
                <Heart size={20} className={savedTripIds.length > 0 && currentView !== 'saved' ? "fill-red-500 text-red-500" : ""} />
                {savedTripIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                    {savedTripIds.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {currentView === 'home' ? (
        <main className="max-w-7xl mx-auto px-6 pt-8 pb-24">
          <div className="relative h-64 sm:h-96 rounded-[2.5rem] overflow-hidden mb-12 group shadow-2xl">
             <img src="https://images.pexels.com/photos/3426880/pexels-photo-3426880.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="Hero" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
             <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
             <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4"><Ship size={14} /> Guided by Captain Key West</div>
                <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tighter mb-4 leading-[0.85] uppercase">Find Your Key West <br/><span className="text-orange-500">SANDBAR</span></h2>
                <p className="text-slate-300 max-w-sm text-sm sm:text-base font-medium mb-8 leading-relaxed opacity-80">There are over 170 sandbar trips in Key West. Tell us your vibe and we'll launch your perfect day.</p>
                <div className="flex flex-wrap gap-4">
                   <button className="bg-orange-500 px-10 py-4 rounded-full font-black text-xs tracking-widest uppercase hover:bg-orange-600 transition shadow-xl shadow-orange-500/40">EXPLORE LOCAL BARS</button>
                </div>
             </div>
          </div>
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-8">
               <LayoutGrid className="w-5 h-5 text-orange-500" />
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Choose Your Vibe</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
               {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => toggleCategory(cat.id)} className={`flex flex-col items-center justify-center min-w-[120px] h-32 rounded-[2rem] transition-all border-2 ${selectedCategories.includes(cat.id) ? 'bg-orange-500 border-orange-500 shadow-xl shadow-orange-500/20' : 'bg-[#161d2a] border-white/5 hover:border-white/20 hover:bg-[#1c2535]'}`}>
                    <span className="text-3xl mb-3">{cat.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider">{cat.label}</span>
                  </button>
               ))}
            </div>
          </section>
          <div className="flex items-end justify-between mb-10 border-b border-white/5 pb-6">
             <div>
                <h3 className="text-4xl font-extrabold tracking-tight uppercase">Top Picks</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Local Legends & Hidden Gems</p>
             </div>
             {selectedCategories.length > 0 && (
                <button onClick={() => setSelectedCategories([])} className="text-orange-500 text-[10px] font-black uppercase tracking-widest hover:underline px-4 py-2 bg-orange-500/10 rounded-full border border-orange-500/20">Clear Filters</button>
             )}
          </div>
          {isLoading ? (
            <div className="py-32 flex flex-col items-center">
               <Loader2 className="w-16 h-16 text-orange-500 animate-spin mb-6" />
               <span className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Scanning the Horizon...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredTrips.map(trip => (
                <div key={trip.id} className="bg-[#161d2a] rounded-[2.5rem] overflow-hidden group shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/5 hover:border-orange-500/30">
                  <div className="h-64 relative cursor-pointer overflow-hidden" onClick={() => setSelectedTripForDetails(trip)}>
                    <img src={trip.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s]" alt={trip.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161d2a] via-transparent to-transparent opacity-80" />
                    <button onClick={(e) => toggleSave(trip.id, e)} className="absolute top-6 right-6 p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/20 transition-all">
                      <Heart size={18} className={savedTripIds.includes(trip.id) ? "fill-red-500 text-red-500" : "text-white"} />
                    </button>
                    {trip.tags.includes('luxury') && <span className="absolute top-6 left-6 bg-orange-500 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Premium</span>}
                  </div>
                  <div className="p-8">
                    <div className="flex gap-2 mb-4">
                      {trip.tags.slice(0, 1).map(tag => (
                        <span key={tag} className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500">{tag.replace('_', ' ')}</span>
                      ))}
                    </div>
                    <h4 className="text-2xl font-extrabold mb-6 tracking-tight leading-none group-hover:text-orange-500 transition-colors uppercase" dangerouslySetInnerHTML={{ __html: trip.title }} />
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                       <div>
                         <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-1">Boarding From</span>
                         <span className="text-2xl font-black text-white">${trip.price} <span className="text-xs text-slate-500 font-medium">/ {trip.priceType}</span></span>
                       </div>
                       <button onClick={() => setSelectedTripForDetails(trip)} className="bg-white/5 border border-white/10 hover:bg-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition">DETAILS</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isLoading && filteredTrips.length === 0 && (
             <div className="py-24 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                <span className="text-6xl mb-6 block">🧭</span>
                <h3 className="text-2xl font-black uppercase tracking-widest text-slate-400">Off the Chart</h3>
                <p className="text-slate-500 font-medium mt-2">No trips match your current vibe selection.</p>
                <button onClick={() => setSelectedCategories([])} className="mt-8 text-orange-500 font-black uppercase text-[10px] tracking-[0.3em] hover:underline">Reset Search</button>
             </div>
          )}
          <footer className="mt-32 border-t border-white/5 pt-12 pb-20 text-center">
             <div className="flex items-center justify-center gap-4 mb-8">
                <div className="h-px w-12 bg-white/10"></div>
                <Ship className="text-slate-700" size={20} />
                <div className="h-px w-12 bg-white/10"></div>
             </div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-4">Captain Key West &copy; {new Date().getFullYear()}</p>
             <a href="https://captainkeywest.com" target="_blank" rel="noreferrer" className="text-orange-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition">Return to CaptainKeyWest.com</a>
          </footer>
        </main>
      ) : (
        <main className="max-w-5xl mx-auto px-6 py-12">
           <div className="flex items-center justify-between mb-16">
             <div>
                <h2 className="text-5xl font-extrabold tracking-tighter uppercase leading-none">Your Log</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Saved Adventures & Selected Voyages</p>
             </div>
             <button onClick={() => setCurrentView('home')} className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition"><ArrowLeft size={24}/></button>
           </div>
           {savedTripsData.length > 0 ? (
             <div className="space-y-6">
                {savedTripsData.map(trip => (
                  <div key={trip.id} className="bg-[#161d2a] p-6 rounded-[2.5rem] border border-white/5 flex flex-col sm:flex-row items-center gap-6 group">
                    <img src={trip.image} className="w-24 h-24 rounded-[1.5rem] object-cover shadow-lg" alt="" />
                    <div className="flex-1 text-center sm:text-left">
                       <h4 className="text-xl font-extrabold text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight" dangerouslySetInnerHTML={{ __html: trip.title }} />
                       <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-2">
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">{trip.duration}</span>
                          <span className="text-[10px] text-orange-500 font-black uppercase tracking-widest">${trip.price} / {trip.priceType}</span>
                       </div>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                       <button onClick={() => setSelectedTripForDetails(trip)} className="flex-1 sm:flex-none p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition flex items-center justify-center"><Info size={20}/></button>
                       <button onClick={(e) => toggleSave(trip.id, e)} className="flex-1 sm:flex-none p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition flex items-center justify-center"><Trash2 size={20}/></button>
                       <a href={trip.affiliateLink} target="_blank" rel="noreferrer" className="flex-[2] sm:flex-none bg-orange-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center hover:bg-orange-600 transition">Book Now</a>
                    </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                <span className="text-7xl block mb-6 opacity-20">📭</span>
                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mb-8">No Voyages Logged</p>
                <button onClick={() => setCurrentView('home')} className="bg-orange-500 px-10 py-4 rounded-full font-black text-xs tracking-widest uppercase shadow-xl shadow-orange-500/30">Find Your Vibe</button>
             </div>
           )}
        </main>
      )}
      {selectedTripForDetails && <DetailsModal trip={selectedTripForDetails} onClose={() => setSelectedTripForDetails(null)} />}
    </div>
  );
}
