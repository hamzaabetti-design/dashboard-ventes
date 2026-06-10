import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

function App() {
  const [donneesCompletes, setDonneesCompletes] = useState(null)
  const [moisChoisi, setMoisChoisi] = useState('Global')

  // TON ADRESSE SERVEUR SUR INTERNET
  const URL_API = 'https://dashboard-ventes.onrender.com';

  const chargerDonnees = () => {
    fetch(`${URL_API}/api/data`)
      .then(res => res.json())
      .then(data => setDonneesCompletes(data))
      .catch(err => console.error(err))
  }

  useEffect(() => {
    chargerDonnees()
  }, [])

  const gererNouveauFichier = (evenement) => {
    const fichier = evenement.target.files[0];
    if (!fichier) return;

    setDonneesCompletes(null);

    const formData = new FormData();
    formData.append('file', fichier);

    fetch(`${URL_API}/api/upload`, {
      method: 'POST',
      body: formData
    })
    .then(reponse => reponse.json())
    .then(data => {
      chargerDonnees();
    })
    .catch(err => {
      console.error(err);
      alert("Erreur lors de l'import du fichier.");
    });
  }

  if (!donneesCompletes) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f9' }}>
        <h2 style={{ color: '#2c3e50' }}>Lecture et Analyse des données en cours... 🚀</h2>
        <p style={{ color: '#7f8c8d' }}>Le premier chargement sur Internet peut prendre jusqu'à une minute, merci de patienter.</p>
      </div>
    )
  }

  const statsActuelles = moisChoisi === 'Global' ? donneesCompletes.Global : donneesCompletes.ParMois[moisChoisi]
  const COULEURS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8e44ad', '#e74c3c', '#34495e', '#16a085', '#d35400']

  return (
    <div style={{ padding: '40px', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      
      {/* EN-TÊTE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', backgroundColor: 'white', padding: '20px 30px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div>
          <h1 style={{ color: '#1a252f', margin: '0 0 5px 0', fontSize: '28px' }}>🚀 Dashboard Exécutif</h1>
          <p style={{ margin: 0, color: '#7f8c8d' }}>Analyse des performances commerciales</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
            <button style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '12px 25px', fontSize: '16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
              📥 Importer un nouvel Extract
            </button>
            <input 
              type="file" 
              accept=".csv"
              onChange={gererNouveauFichier}
              style={{ fontSize: '100px', position: 'absolute', left: 0, top: 0, opacity: 0, cursor: 'pointer' }} 
            />
          </div>

          <select 
            value={moisChoisi} 
            onChange={(e) => setMoisChoisi(e.target.value)}
            style={{ padding: '12px 25px', fontSize: '16px', borderRadius: '10px', cursor: 'pointer', border: '1px solid #dfe6e9', backgroundColor: '#f8f9fa', fontWeight: 'bold', color: '#2c3e50', outline: 'none' }}
          >
            <option value="Global">📅 Année Complète</option>
            {donneesCompletes.GraphiqueMois.map(m => (
              <option key={m.mois} value={m.mois}>Statistiques de {m.mois}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'flex', gap: '25px', marginBottom: '30px' }}>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderLeft: '5px solid #27ae60' }}>
          <h3 style={{ color: '#95a5a6', margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Chiffre d'Affaires</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
            {statsActuelles.total_revenus.toLocaleString('fr-FR', {maximumFractionDigits: 0})} $
          </p>
        </div>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderLeft: '5px solid #2980b9' }}>
          <h3 style={{ color: '#95a5a6', margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Articles Vendus</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
            {statsActuelles.total_quantite.toLocaleString('fr-FR')} <span style={{fontSize: '18px', color: '#7f8c8d'}}>unités</span>
          </p>
        </div>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderLeft: '5px solid #8e44ad' }}>
          <h3 style={{ color: '#95a5a6', margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Panier Moyen</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
            {statsActuelles.panier_moyen.toLocaleString('fr-FR', {maximumFractionDigits: 2})} $
          </p>
        </div>
      </div>

      {/* GRAPHQUES */}
      <div style={{ display: 'flex', gap: '25px', marginBottom: '30px' }}>
        <div style={{ flex: 2, backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '25px', borderBottom: '2px solid #f0f2f5', paddingBottom: '10px' }}>🏆 Top 5 Produits</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statsActuelles.produits_revenu} layout="vertical" margin={{ left: 50, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
              <XAxis type="number" />
              <YAxis dataKey="nom" type="category" width={140} tick={{fontSize: 12, fill: '#7f8c8d'}} />
              <Tooltip formatter={(value) => value.toLocaleString('fr-FR') + " $"} cursor={{fill: '#f8f9fa'}} />
              <Bar dataKey="revenu" fill="#2980b9" radius={[0, 5, 5, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1.5, backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '25px', borderBottom: '2px solid #f0f2f5', paddingBottom: '10px', textAlign: 'center' }}>📍 Top Villes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statsActuelles.villes.slice(0, 5)} dataKey="revenu" nameKey="nom" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                {statsActuelles.villes.slice(0, 5).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COULEURS[index % COULEURS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toLocaleString('fr-FR') + " $"} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ANNUEL */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '25px', borderBottom: '2px solid #f0f2f5', paddingBottom: '10px' }}>🌊 Tendance Annuelle des Revenus</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={donneesCompletes.GraphiqueMois} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#27ae60" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#27ae60" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="mois" tick={{fill: '#7f8c8d'}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill: '#7f8c8d'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
            <Tooltip formatter={(value) => value.toLocaleString('fr-FR') + " $"} />
            <Area type="monotone" dataKey="revenu" stroke="#27ae60" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenu)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}

export default App