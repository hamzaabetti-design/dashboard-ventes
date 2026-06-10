import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Line } from 'recharts'

function App() {
  const [donneesCompletes, setDonneesCompletes] = useState(null)
  const [moisChoisi, setMoisChoisi] = useState('Global')

  // TON ADRESSE SERVEUR SUR INTERNET
  const URL_API = 'https://dashboard-ventes-31z6.onrender.com';

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
    .then(() => {
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
        <div style={{ width: '50px', height: '50px', border: '5px solid #e74c3c', borderTop: '5px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginTop: '20px' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const statsActuelles = moisChoisi === 'Global' ? donneesCompletes.Global : donneesCompletes.ParMois[moisChoisi]
  const COULEURS = ['#e74c3c', '#8e44ad', '#3498db', '#f1c40f', '#2ecc71']

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#f4f7f6', overflow: 'hidden' }}>
      
      {/* ================= SIDEBAR (NOIRE COMME SUR L'IMAGE) ================= */}
      <div style={{ width: '260px', backgroundColor: '#111827', color: 'white', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 10px rgba(0,0,0,0.1)', zIndex: 10 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '30px', height: '30px', backgroundColor: '#e74c3c', borderRadius: '5px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>📊</div>
          <h2 style={{ margin: 0, fontSize: '18px', letterSpacing: '1px' }}>BI DASHBOARD</h2>
        </div>
        
        <div style={{ padding: '20px 0', flex: 1 }}>
          <p style={{ color: '#6b7280', fontSize: '12px', paddingLeft: '20px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Menu</p>
          
          <div style={{ padding: '12px 20px', backgroundColor: '#e74c3c', borderLeft: '4px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
             👁️ Overview
          </div>
          <div style={{ padding: '12px 20px', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.3s' }} onMouseOver={(e) => e.target.style.color = 'white'} onMouseOut={(e) => e.target.style.color = '#9ca3af'}>
             📈 Analytics
          </div>
          <div style={{ padding: '12px 20px', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.3s' }} onMouseOver={(e) => e.target.style.color = 'white'} onMouseOut={(e) => e.target.style.color = '#9ca3af'}>
             🏆 Performance
          </div>
        </div>
      </div>

      {/* ================= CONTENU PRINCIPAL ================= */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 30px' }}>
        
        {/* EN-TÊTE / HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: 'white', padding: '15px 25px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', color: '#1f2937', fontWeight: '700' }}>Executive Sales Overview</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Vue d'ensemble des performances commerciales</p>
          </div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            {/* Input Fichier Stylisé */}
            <div style={{ position: 'relative' }}>
              <button style={{ backgroundColor: 'white', border: '1px solid #d1d5db', color: '#374151', padding: '8px 15px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                📥 Importer Données
              </button>
              <input type="file" accept=".csv" onChange={gererNouveauFichier} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            </div>

            <select 
              value={moisChoisi} 
              onChange={(e) => setMoisChoisi(e.target.value)}
              style={{ padding: '8px 15px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', fontWeight: '600', color: '#374151', outline: 'none', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <option value="Global">📅 Année Complète</option>
              {donneesCompletes.GraphiqueMois.map(m => (
                <option key={m.mois} value={m.mois}>{m.mois}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ================= 5 KPI CARDS ================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '20px' }}>
          
          {/* KPI 1 : Revenus */}
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#e74c3c', fontSize: '20px' }}>💰</div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Revenus Totals</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1f2937' }}>{statsActuelles.total_revenus.toLocaleString('fr-FR', {maximumFractionDigits: 0})} $</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#10b981', fontWeight: '600' }}>▲ +18% vs N-1</p>
            </div>
          </div>

          {/* KPI 2 : Quantité */}
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#f5f3ff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#8e44ad', fontSize: '20px' }}>📦</div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Articles Vendus</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1f2937' }}>{statsActuelles.total_quantite.toLocaleString('fr-FR')}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#10b981', fontWeight: '600' }}>▲ +5% vs N-1</p>
            </div>
          </div>

          {/* KPI 3 : Panier Moyen */}
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#3b82f6', fontSize: '20px' }}>🛒</div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Panier Moyen</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1f2937' }}>{statsActuelles.panier_moyen.toLocaleString('fr-FR', {maximumFractionDigits: 1})} $</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#ef4444', fontWeight: '600' }}>▼ -2% vs N-1</p>
            </div>
          </div>

          {/* KPI 4 : Villes Actives */}
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#fefce8', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#eab308', fontSize: '20px' }}>📍</div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Villes Desservies</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1f2937' }}>{statsActuelles.villes.length}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#10b981', fontWeight: '600' }}>Objectif : 100%</p>
            </div>
          </div>

          {/* KPI 5 : Top Ville */}
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#ecfdf5', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#10b981', fontSize: '20px' }}>🏆</div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Top Ville</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100px' }}>
                {statsActuelles.villes[0] ? statsActuelles.villes[0].nom : '-'}
              </p>
            </div>
          </div>

        </div>

        {/* ================= GRILLE DU MILIEU ================= */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          
          {/* Espace pour la Carte (Mockup) */}
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 20px 0', color: '#374151' }}>Ventes par Région (Carte)</h3>
            <div style={{ height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '8px' }}>
              <span style={{ fontSize: '40px' }}>🗺️</span>
              <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', padding: '0 20px' }}>Intégration d'une librairie comme <b>react-simple-maps</b> requise pour afficher une carte SVG interactive.</p>
            </div>
          </div>

          {/* Graphique Donut */}
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#374151' }}>Répartition par Ville</h3>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={statsActuelles.villes.slice(0, 4)} dataKey="revenu" nameKey="nom" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2}>
                  {statsActuelles.villes.slice(0, 4).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COULEURS[index % COULEURS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toLocaleString('fr-FR') + " $"} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart Horizontal */}
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#374151' }}>Top 5 Produits</h3>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={statsActuelles.produits_revenu} layout="vertical" margin={{ left: 60, right: 10, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="nom" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#4b5563'}} />
                <Tooltip formatter={(value) => value.toLocaleString('fr-FR') + " $"} cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="revenu" fill="#8e44ad" radius={[0, 4, 4, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* ================= GRILLE DU BAS ================= */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          
          {/* Evolution Mensuelle */}
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 20px 0', color: '#374151' }}>Évolution mensuelle des ventes</h3>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={donneesCompletes.GraphiqueMois} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip formatter={(value) => value.toLocaleString('fr-FR') + " $"} />
                <Bar dataKey="revenu" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="revenu" stroke="#e74c3c" strokeWidth={3} dot={{r: 4, fill: '#e74c3c'}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Liste Top Shops (Mockup Table avec vos données Villes) */}
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 20px 0', color: '#374151' }}>Top 5 Performances</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '11px', textAlign: 'left' }}>
                  <th style={{ paddingBottom: '10px', fontWeight: '500' }}>#</th>
                  <th style={{ paddingBottom: '10px', fontWeight: '500' }}>Emplacement</th>
                  <th style={{ paddingBottom: '10px', fontWeight: '500', textAlign: 'right' }}>Ventes ($)</th>
                </tr>
              </thead>
              <tbody>
                {statsActuelles.villes.slice(0, 5).map((ville, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 0', fontSize: '13px', color: '#9ca3af' }}>{index + 1}</td>
                    <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: '600', color: '#374151' }}>{ville.nom}</td>
                    <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 'bold', color: '#1f2937', textAlign: 'right' }}>
                      {ville.revenu.toLocaleString('fr-FR', {maximumFractionDigits: 0})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  )
}

export default App