import { useState } from 'react'
import { ArrowRight, Palette, Layout, Trophy, Users, Sparkles, Award, TrendingUp, DollarSign, Eye } from 'lucide-react'

// ── Avatar options ──
const AVATARS = ['🎨','✨','🪑','🌿','🕯️','💎','🌵','❄️','🏠','🎭','🌸','☀️','🌊','🔥','🍂','🦋']

// ── City options (top US metros) ──
const CITIES = [
  'San Francisco','Los Angeles','New York','Chicago','Seattle','Portland',
  'Austin','Denver','Miami','Nashville','Boston','Phoenix','Atlanta',
  'San Diego','Minneapolis','Dallas','Houston','Philadelphia','Detroit','Other'
]

const STATES_BY_CITY = {
  'San Francisco':'California','Los Angeles':'California','New York':'New York',
  'Chicago':'Illinois','Seattle':'Washington','Portland':'Oregon','Austin':'Texas',
  'Denver':'Colorado','Miami':'Florida','Nashville':'Tennessee','Boston':'Massachusetts',
  'Phoenix':'Arizona','Atlanta':'Georgia','San Diego':'California','Minneapolis':'Minnesota',
  'Dallas':'Texas','Houston':'Texas','Philadelphia':'Pennsylvania','Detroit':'Michigan','Other':''
}

export default function WelcomeOnboarding({ onComplete }) {
  const [step, setStep] = useState(0) // 0=welcome, 1=handle, 2=style quiz, 3=how-to-play, 4=done

  // Profile fields
  const [handle, setHandle] = useState('')
  const [avatar, setAvatar] = useState('🎨')
  const [city, setCity] = useState('')
  const [customCity, setCustomCity] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [designVibe, setDesignVibe] = useState('')
  const [superpower, setSuperpower] = useState('')
  const [playReason, setPlayReason] = useState('')

  const effectiveCity = city === 'Other' ? customCity : city

  const handleFinish = () => {
    const profile = {
      handle: handle.startsWith('@') ? handle : '@' + handle,
      avatar, city: effectiveCity,
      state: STATES_BY_CITY[city] || '',
      ageRange, designVibe, superpower, playReason,
      tier: 'member',
      stats: { wins: 0, losses: 0, streak: 0, bestStreak: 0, totalDesigns: 0, avgStars: 0, rank: { city: 0, state: 0, national: 0 } },
    }
    onComplete(profile)
  }

  // ═══════════ STEP 0: WELCOME SPLASH ═══════════
  if (step === 0) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: 32 }}>
      <div style={{ textAlign:'center', maxWidth: 520 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏛️</div>
        <h1 style={{ fontFamily:'Georgia, serif', fontSize: 42, color:'#f5f0e8', fontWeight: 400, marginBottom: 6, letterSpacing: -0.5 }}>
          OpenDesign Studio
        </h1>
        <p style={{ color:'#4a4640', fontSize: 11, textTransform:'uppercase', letterSpacing: 3, marginBottom: 20 }}>
          Part of the OpenScaffold ecosystem
        </p>
        <p style={{ color:'#c8aa78', fontSize: 18, fontFamily:'Georgia, serif', marginBottom: 16, lineHeight: 1.6 }}>
          The March Madness of Interior Design
        </p>
        <p style={{ color:'#6a6258', fontSize: 14, marginBottom: 40, lineHeight: 1.6 }}>
          Design rooms. Get scored by AI judges. Compete for real prizes.
        </p>

        <div style={{ display:'flex', gap: 24, justifyContent:'center', marginBottom: 48, flexWrap:'wrap' }}>
          {[
            { icon: Palette, label: 'Design', desc: 'Build palettes, plan rooms, spec furniture like a pro' },
            { icon: Award, label: 'Get Judged', desc: '6 AI judges score your Color, Space & Vibe' },
            { icon: TrendingUp, label: 'Compete', desc: 'City to Regional to National to World Championship' },
          ].map((f, i) => (
            <div key={i} style={{ textAlign:'center', width: 140 }}>
              <f.icon size={24} style={{ color:'#c8aa78', marginBottom: 8 }} />
              <div style={{ color:'#f5f0e8', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{f.label}</div>
              <div style={{ color:'#6a6258', fontSize: 12, lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setStep(1)} style={{
          padding:'16px 48px', borderRadius: 14, border:'none', cursor:'pointer',
          background:'linear-gradient(135deg, rgba(200,170,120,0.3), rgba(200,170,120,0.15))',
          color:'#f5f0e8', fontSize: 17, fontWeight: 500, fontFamily:'Georgia, serif',
          letterSpacing: 0.5, transition:'all 0.2s', display:'inline-flex', alignItems:'center', gap: 10
        }}>
          Create Your Designer Profile <ArrowRight size={18} />
        </button>
        <p style={{ color:'#3a3630', fontSize: 12, marginTop: 16 }}>No password needed — just pick a name and start designing</p>
        <button onClick={() => onComplete({
          handle: '@DesignDreamer', avatar: '🎨', city: 'San Francisco', state: 'California',
          ageRange: '30s', designVibe: 'Warm & Cozy', superpower: 'Color', playReason: 'Creative Expression',
          tier: 'member',
          stats: { wins: 12, losses: 8, streak: 3, bestStreak: 7, totalDesigns: 24, avgStars: 3.8, rank: { city: 14, state: 89, national: 2340 } },
        })} style={{
          marginTop: 24, padding: '10px 32px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
          background: 'transparent', color: '#5a5248', fontSize: 13, cursor: 'pointer',
          transition: 'all 0.2s',
        }}>
          Skip Intro →
        </button>
      </div>
    </div>
  )

  // ═══════════ STEP 1: HANDLE + AVATAR + CITY ═══════════
  if (step === 1) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', padding: 32 }}>
      <div style={{ maxWidth: 480, width:'100%' }}>
        <p style={{ color:'#c8aa78', fontSize: 11, textTransform:'uppercase', letterSpacing: 3, marginBottom: 12 }}>Step 1 of 3</p>
        <h2 style={{ fontFamily:'Georgia, serif', fontSize: 28, color:'#f5f0e8', fontWeight: 400, marginBottom: 8 }}>Who are you?</h2>
        <p style={{ color:'#6a6258', fontSize: 14, marginBottom: 40 }}>Pick your designer identity — this is how competitors will see you</p>

        {/* Handle */}
        <label style={{ color:'#8a8078', fontSize: 12, textTransform:'uppercase', letterSpacing: 1, display:'block', marginBottom: 8 }}>Designer Handle</label>
        <div style={{ position:'relative', marginBottom: 28 }}>
          <span style={{ position:'absolute', left: 14, top: '50%', transform:'translateY(-50%)', color:'#5a5248', fontSize: 16 }}>@</span>
          <input type="text" value={handle} onChange={e => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g,'').slice(0,20))}
            placeholder="DesignDreamer"
            style={{ width:'100%', padding:'14px 14px 14px 30px', borderRadius: 12, background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.1)', color:'#f5f0e8', fontSize: 16, fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>

        {/* Avatar picker */}
        <label style={{ color:'#8a8078', fontSize: 12, textTransform:'uppercase', letterSpacing: 1, display:'block', marginBottom: 8 }}>Choose Your Avatar</label>
        <div style={{ display:'flex', gap: 8, flexWrap:'wrap', marginBottom: 28 }}>
          {AVATARS.map(a => (
            <div key={a} onClick={() => setAvatar(a)} style={{
              width: 44, height: 44, borderRadius: 12, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize: 22, cursor:'pointer', transition:'all 0.15s',
              background: avatar === a ? 'rgba(200,170,120,0.15)' : 'rgba(255,255,255,0.03)',
              border: `2px solid ${avatar === a ? 'rgba(200,170,120,0.5)' : 'rgba(255,255,255,0.06)'}`,
            }}>{a}</div>
          ))}
        </div>

        {/* City */}
        <label style={{ color:'#8a8078', fontSize: 12, textTransform:'uppercase', letterSpacing: 1, display:'block', marginBottom: 8 }}>Your City</label>
        <div style={{ display:'flex', gap: 8, flexWrap:'wrap', marginBottom: city === 'Other' ? 12 : 28 }}>
          {CITIES.map(c => (
            <button key={c} onClick={() => setCity(c)} style={{
              padding:'6px 14px', borderRadius: 16, fontSize: 12, border:'none', cursor:'pointer',
              background: city === c ? 'rgba(200,170,120,0.15)' : 'rgba(255,255,255,0.04)',
              color: city === c ? '#c8aa78' : '#6a6258', transition:'all 0.15s'
            }}>{c}</button>
          ))}
        </div>
        {city === 'Other' && (
          <input type="text" value={customCity} onChange={e => setCustomCity(e.target.value)}
            placeholder="Enter your city"
            style={{ width:'100%', padding:'12px 14px', borderRadius: 10, background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.1)', color:'#f5f0e8', fontSize: 14, marginBottom: 28, boxSizing:'border-box' }} />
        )}

        {/* Age range */}
        <label style={{ color:'#8a8078', fontSize: 12, textTransform:'uppercase', letterSpacing: 1, display:'block', marginBottom: 8 }}>Age Range <span style={{ color:'#3a3630' }}>(optional)</span></label>
        <div style={{ display:'flex', gap: 8, marginBottom: 36 }}>
          {['20s','30s','40s','50s','60+'].map(a => (
            <button key={a} onClick={() => setAgeRange(a)} style={{
              flex: 1, padding:'10px 0', borderRadius: 10, fontSize: 13, border:'none', cursor:'pointer',
              background: ageRange === a ? 'rgba(200,170,120,0.15)' : 'rgba(255,255,255,0.03)',
              color: ageRange === a ? '#c8aa78' : '#6a6258', transition:'all 0.15s'
            }}>{a}</button>
          ))}
        </div>

        <button onClick={() => handle.length >= 2 && effectiveCity ? setStep(2) : null} style={{
          width:'100%', padding:'16px', borderRadius: 14, border:'none', cursor: handle.length >= 2 && effectiveCity ? 'pointer' : 'default',
          background: handle.length >= 2 && effectiveCity ? 'rgba(200,170,120,0.2)' : 'rgba(255,255,255,0.04)',
          color: handle.length >= 2 && effectiveCity ? '#c8aa78' : '#3a3630',
          fontSize: 15, fontWeight: 500, fontFamily:'Georgia, serif', display:'flex', alignItems:'center', justifyContent:'center', gap: 8
        }}>
          Next — Style Quiz <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )

  // ═══════════ STEP 2: STYLE QUIZ ═══════════
  if (step === 2) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', padding: 32 }}>
      <div style={{ maxWidth: 520, width:'100%' }}>
        <p style={{ color:'#c8aa78', fontSize: 11, textTransform:'uppercase', letterSpacing: 3, marginBottom: 12 }}>Step 2 of 3</p>
        <h2 style={{ fontFamily:'Georgia, serif', fontSize: 28, color:'#f5f0e8', fontWeight: 400, marginBottom: 8 }}>Your Design DNA</h2>
        <p style={{ color:'#6a6258', fontSize: 14, marginBottom: 40 }}>These shape your competition leagues — compete against people like you</p>

        {/* Q1: Design Vibe */}
        <label style={{ color:'#8a8078', fontSize: 12, textTransform:'uppercase', letterSpacing: 1, display:'block', marginBottom: 12 }}>What's your design vibe?</label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10, marginBottom: 32 }}>
          {[
            { id:'Warm & Cozy', icon:'🕯️', desc:'Rich textures, earth tones, layered comfort' },
            { id:'Sleek & Modern', icon:'🖤', desc:'Clean lines, monochrome, architectural' },
            { id:'Bold & Eclectic', icon:'🎭', desc:'Color-forward, mixed patterns, maximalist' },
            { id:'Classic & Timeless', icon:'🏛️', desc:'Traditional elegance, refined materials' },
          ].map(v => (
            <div key={v.id} onClick={() => setDesignVibe(v.id)} style={{
              padding: 16, borderRadius: 12, cursor:'pointer', transition:'all 0.15s',
              background: designVibe === v.id ? 'rgba(200,170,120,0.1)' : 'rgba(255,255,255,0.02)',
              border: `2px solid ${designVibe === v.id ? 'rgba(200,170,120,0.5)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{v.icon}</div>
              <div style={{ color: designVibe === v.id ? '#f5f0e8' : '#8a8078', fontSize: 13, fontWeight: 600 }}>{v.id}</div>
              <div style={{ color:'#5a5248', fontSize: 11, marginTop: 2 }}>{v.desc}</div>
            </div>
          ))}
        </div>

        {/* Q2: Superpower */}
        <label style={{ color:'#8a8078', fontSize: 12, textTransform:'uppercase', letterSpacing: 1, display:'block', marginBottom: 12 }}>What's your design superpower?</label>
        <div style={{ display:'flex', gap: 10, marginBottom: 32 }}>
          {[
            { id:'Color', icon:'🎨' },
            { id:'Layout', icon:'📐' },
            { id:'Texture', icon:'🧶' },
            { id:'Lighting', icon:'💡' },
          ].map(s => (
            <div key={s.id} onClick={() => setSuperpower(s.id)} style={{
              flex: 1, padding:'14px 8px', borderRadius: 12, cursor:'pointer', textAlign:'center', transition:'all 0.15s',
              background: superpower === s.id ? 'rgba(200,170,120,0.1)' : 'rgba(255,255,255,0.02)',
              border: `2px solid ${superpower === s.id ? 'rgba(200,170,120,0.5)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ color: superpower === s.id ? '#c8aa78' : '#6a6258', fontSize: 12, fontWeight: 600 }}>{s.id}</div>
            </div>
          ))}
        </div>

        {/* Q3: Why do you play? */}
        <label style={{ color:'#8a8078', fontSize: 12, textTransform:'uppercase', letterSpacing: 1, display:'block', marginBottom: 12 }}>Why do you play?</label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10, marginBottom: 36 }}>
          {[
            { id:'Relaxation', icon:'😌', desc:'Wind down and create' },
            { id:'Competition', icon:'🏆', desc:'I play to win' },
            { id:'Learning', icon:'📚', desc:'Improve my design eye' },
            { id:'Creative Expression', icon:'✨', desc:'Make something beautiful' },
          ].map(r => (
            <div key={r.id} onClick={() => setPlayReason(r.id)} style={{
              padding:'12px 14px', borderRadius: 10, cursor:'pointer', display:'flex', alignItems:'center', gap: 10, transition:'all 0.15s',
              background: playReason === r.id ? 'rgba(200,170,120,0.1)' : 'rgba(255,255,255,0.02)',
              border: `2px solid ${playReason === r.id ? 'rgba(200,170,120,0.5)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              <span style={{ fontSize: 18 }}>{r.icon}</span>
              <div>
                <div style={{ color: playReason === r.id ? '#f5f0e8' : '#8a8078', fontSize: 13, fontWeight: 600 }}>{r.id}</div>
                <div style={{ color:'#5a5248', fontSize: 11 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => designVibe && superpower && playReason ? setStep(3) : null} style={{
          width:'100%', padding:'16px', borderRadius: 14, border:'none',
          cursor: designVibe && superpower && playReason ? 'pointer' : 'default',
          background: designVibe && superpower && playReason ? 'rgba(200,170,120,0.2)' : 'rgba(255,255,255,0.04)',
          color: designVibe && superpower && playReason ? '#c8aa78' : '#3a3630',
          fontSize: 15, fontWeight: 500, fontFamily:'Georgia, serif', display:'flex', alignItems:'center', justifyContent:'center', gap: 8
        }}>
          Next — How to Play <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )

  // STEP 3: HOW TO PLAY
  if (step === 3) {
    const phases = [
      { num: '1', title: 'Read the Brief', icon: Layout, color: '#87CEEB',
        desc: 'Meet your client with a real room and real constraints. Pick a concept direction.' },
      { num: '2', title: 'Build Your Palette', icon: Palette, color: '#C8AA78',
        desc: 'Select colors and materials. Quick modes get curated palettes. Full Design gives you the wheel.' },
      { num: '3', title: 'Design the Room', icon: Sparkles, color: '#5B7553',
        desc: 'Plan the room, review elevations, spec furniture with finishes & fabrics, preview in 3D.' },
      { num: '4', title: 'Face the Judges', icon: Award, color: '#C1440E',
        desc: '6 AI judges score your design on Color Harmony, Space Planning & Overall Vibe. Each has their own style and opinion.' },
    ];
    const effectiveCity = city || 'your city';
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ maxWidth: 560, width: '100%' }}>
          <p style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12 }}>Step 3 of 3</p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#f5f0e8', fontWeight: 400, marginBottom: 8 }}>How OpenDesign Studio Works</h2>
          <p style={{ color: '#6a6258', fontSize: 14, marginBottom: 40 }}>Design a room. Get scored by AI. Advance through the brackets.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 40 }}>
            {phases.map((phase, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, padding: '20px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 14, background: 'rgba(200,170,120,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <phase.icon size={22} style={{ color: phase.color }} />
                </div>
                <div>
                  <div style={{ color: '#f5f0e8', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                    <span style={{ color: phase.color, marginRight: 8 }}>{phase.num}.</span>{phase.title}
                  </div>
                  <div style={{ color: '#6a6258', fontSize: 13, lineHeight: 1.6 }}>{phase.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(200,170,120,0.04)', border: '1px solid rgba(200,170,120,0.15)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Award size={18} style={{ color: '#c8aa78' }} />
              <span style={{ color: '#c8aa78', fontSize: 13, fontWeight: 600 }}>Meet Your Judges</span>
            </div>
            <p style={{ color: '#6a6258', fontSize: 13, lineHeight: 1.6, margin: 0, marginBottom: 12 }}>
              Six AI judges with distinct design philosophies score every entry. Each one weights Color, Space, and Vibe differently.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { avatar: '\uD83E\uDD0D', name: 'Margaux', style: 'Minimalist' },
                { avatar: '\uD83D\uDC8E', name: 'Dex', style: 'Maximalist' },
                { avatar: '\uD83C\uDF43', name: 'Yuki', style: 'Wabi-Sabi' },
                { avatar: '\uD83D\uDC51', name: 'Ava', style: 'Traditional' },
                { avatar: '\uD83C\uDF08', name: 'Rio', style: 'Eclectic' },
                { avatar: '\uD83D\uDD22', name: 'Algo', style: 'Data' },
              ].map((j, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: 14 }}>{j.avatar}</span>
                  <span style={{ color: '#8a8078', fontSize: 10 }}>{j.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(91,117,83,0.06)', border: '1px solid rgba(91,117,83,0.2)', borderRadius: 14, padding: 20, marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <TrendingUp size={18} style={{ color: '#5B7553' }} />
              <span style={{ color: '#5B7553', fontSize: 13, fontWeight: 600 }}>Tournament Brackets</span>
            </div>
            <p style={{ color: '#6a6258', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              {"Win in " + effectiveCity + ", advance to Regional, then National, all the way to the World Championship. Top designers win real prizes."}
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 36 }}>
            <p style={{ color: '#5a5248', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Your Profile</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(200,170,120,0.1)', border: '1px solid rgba(200,170,120,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#f5f0e8', fontSize: 16, fontWeight: 600 }}>{"@" + (handle || "Designer")}</div>
                <div style={{ color: '#6a6258', fontSize: 12 }}>{effectiveCity}{ageRange ? (" " + ageRange) : ""}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {[designVibe, superpower, playReason].filter(Boolean).map((tag, i) => (
                <span key={i} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 12, background: 'rgba(200,170,120,0.08)', color: '#c8aa78' }}>{tag}</span>
              ))}
            </div>
          </div>

          <button
            onClick={handleFinish}
            disabled={!handle}
            style={{
              width: '100%', padding: '18px 0', borderRadius: 16, border: 'none',
              cursor: handle ? 'pointer' : 'not-allowed',
              background: handle ? 'linear-gradient(135deg, #c8aa78, #a08050)' : 'rgba(200,170,120,0.2)',
              color: handle ? '#1a1612' : '#6a6258', fontSize: 18, fontWeight: 700, letterSpacing: 1,
              transition: 'all 0.3s ease',
              boxShadow: handle ? '0 4px 20px rgba(200,170,120,0.3)' : 'none',
              marginBottom: 16
            }}
          >
            Start Designing
          </button>
          <p style={{ color: '#4a4238', fontSize: 11, textAlign: 'center', margin: 0 }}>
            No password needed. Your designs speak for you.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
