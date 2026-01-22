import React, { useEffect, useState, useContext } from 'react';
import API from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const [clientsCount, setClientsCount] = useState(null);
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const id = user?.id;
        const [clientsRes, shiftsRes] = await Promise.all([
          API.get(`/staff/${id}/clients`),
          API.get(`/staff/${id}/shifts`),
        ]);
        if (!mounted) return;
        setClientsCount(clientsRes.data.length);
        // find current shift (closest with today's date)
        const shifts = shiftsRes.data || [];
        const today = new Date().toDateString();
        const current = shifts.find(s => new Date(s.date).toDateString() === today) || null;
        setCurrentShift(current);
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard');
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [user]);

  if (loading) return <div style={{padding:20}}>Loading...</div>;
  if (error) return <div style={{padding:20,color:'red'}}>{error}</div>;

  return (
    <div style={{background:'#F8F9ED',minHeight:'100vh'}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:16}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{background:'#7A7F5C',color:'#F8F9ED',padding:10,borderRadius:8,fontWeight:700}}>CN</div>
          <div>
            <h3 style={{margin:0}}>CareNote</h3>
            <div style={{color:'#6B7280'}}>{user?.role || 'Staff'} Portal</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:20}}>
          <div>{currentShift ? `${new Date(currentShift.startTime).toLocaleTimeString()} - ${new Date(currentShift.endTime).toLocaleTimeString()}` : 'No shift assigned'}</div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{background:'#ECEEDD',padding:8,borderRadius:'50%'}}>{(user?.name||'').split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
            <div>
              <div style={{fontWeight:700}}>{user?.name}</div>
              <div style={{color:'#7A7F5C',fontSize:12}}>{user?.role}</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} style={{background:'#7A7F5C',color:'#F8F9ED',border:'none',padding:'8px 12px',borderRadius:8}}>Logout</button>
        </div>
      </header>

      <main style={{maxWidth:1100,margin:'24px auto',padding:24}}>
        <h1>Welcome back, {user?.name}!</h1>
        <p style={{color:'#6B7280'}}>Here's your shift overview and quick access to your clients.</p>

        <div style={{background:'#ECEEDD',border:'1px solid #E2E3D8',borderRadius:14,padding:18,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{background:'#F8F9ED',padding:10,borderRadius:'50%'}}>🕒</div>
            <div>
              <div style={{color:'#6B7280',fontSize:12}}>Current Shift</div>
              <div style={{fontWeight:700}}>{currentShift ? `${new Date(currentShift.startTime).toLocaleTimeString()} - ${new Date(currentShift.endTime).toLocaleTimeString()}` : 'No shift assigned'}</div>
            </div>
          </div>
          <button onClick={() => navigate('/clients')} style={{background:'#7A7F5C',color:'#F8F9ED',border:'none',padding:'10px 18px',borderRadius:10}}> {clientsCount || 0} Clients Assigned</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20,marginBottom:24}}>
          <div style={{background:'#F8F9ED',border:'1px solid #E2E3D8',borderRadius:14,padding:22}}>
            <h3>My Clients</h3>
            <p style={{color:'#6B7280'}}>View assigned clients and start new care notes.</p>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:18,color:'#7A7F5C',fontWeight:600}}>
              <span>Click to access</span>
              <button onClick={() => navigate('/clients')} style={{background:'transparent',border:'none',color:'#7A7F5C'}}>→</button>
            </div>
          </div>

          <div style={{background:'#F8F9ED',border:'1px solid #E2E3D8',borderRadius:14,padding:22}}>
            <h3>My Shifts</h3>
            <p style={{color:'#6B7280'}}>Review current and historical shift assignments.</p>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:18,color:'#7A7F5C',fontWeight:600}}>
              <span>Click to access</span>
              <button onClick={() => navigate('/shifts')} style={{background:'transparent',border:'none',color:'#7A7F5C'}}>→</button>
            </div>
          </div>
        </div>

        <div style={{background:'#ECEEDD',border:'1px solid #E2E3D8',borderRadius:14,padding:22}}>
          <h3>💡 Quick Tips</h3>
          <ul>
            <li>Use speech-to-text to quickly record observations.</li>
            <li>Review your shift schedule regularly.</li>
            <li>All notes are automatically linked to your shift.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
