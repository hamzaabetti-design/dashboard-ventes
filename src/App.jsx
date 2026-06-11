import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Line, ComposedChart, PieChart, Pie, Cell
} from 'recharts';
import { 
  Package, ShoppingCart, Users, DollarSign, MapPin, 
  Award, BarChart2, UploadCloud, Moon, Sun, CheckCircle, AlertTriangle
} from 'lucide-react';

// --- COORDONNÉES GÉOGRAPHIQUES ET COULEURS FIXES ---
const VILLES_CONFIG = {
  "seattle":       { x: 55,  y: 40,  couleur: "#06b6d4" },
  "portland":      { x: 48,  y: 65,  couleur: "#f59e0b" },
  "san francisco": { x: 32,  y: 135, couleur: "#2563eb" },
  "los angeles":   { x: 62,  y: 185, couleur: "#ec4899" },
  "austin":        { x: 235, y: 245, couleur: "#b45309" },
  "dallas":        { x: 245, y: 215, couleur: "#10b981" },
  "atlanta":       { x: 375, y: 200, couleur: "#f43f5e" },
  "new york city": { x: 445, y: 100, couleur: "#8b5cf6" },
  "boston":        { x: 468, y: 80,  couleur: "#a855f7" },
  "autre":         { x: 250, y: 150, couleur: "#94a3b8" }
};

const ORDER_MOIS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ==========================================
// 1. MOTEUR LECTURE CSV (FAST PARSER)
// ==========================================
const parseCSVFast = (text) => {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes(';') ? ';' : (lines[0].includes('\t') ? '\t' : ',');
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, '').toLowerCase());

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') continue;

    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === delimiter && !inQuotes) { values.push(current.trim()); current = ''; }
      else current += char;
    }
    values.push(current.trim());

    const row = {};
    for (let j = 0; j < headers.length; j++) row[headers[j]] = values[j] !== undefined ? values[j].replace(/"/g, '') : '';
    data.push(row);
  }
  return data;
};

const extraireMois = (valeur) => {
  if (!valeur) return "Inconnu";
  const matchStatut = valeur.match(/_([A-Za-z]+)_/);
  if (matchStatut) return matchStatut[1];
  if (valeur.includes('/')) {
    const parts = valeur.split('/');
    if (parts.length > 1) {
      const m = parseInt(parts[0], 10);
      if (m >= 1 && m <= 12) return ORDER_MOIS[m - 1];
    }
  }
  return "Inconnu";
};

const normaliserTexte = (str) => String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// ==========================================
// 2. HORLOGE EN DIRECT
// ==========================================
const LiveClock = ({ isDarkMode, theme }) => {
  const [dateActuelle, setDateActuelle] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setDateActuelle(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateFormatee = dateActuelle.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const heureFormatee = dateActuelle.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: isDarkMode ? '#334155' : '#f1f5f9', padding: '4px 10px', borderRadius: '20px', border: `1px solid ${theme.border}` }}>
      <div style={{ width: '6px', height: '6px', backgroundColor: '#ef4444', borderRadius: '50%', animation: 'pulse-red 2s infinite' }}></div>
      <span style={{ fontSize: '10px', fontWeight: 'bold', color: theme.textMuted, textTransform: 'capitalize' }}>
        Live : {dateFormatee} - {heureFormatee}
      </span>
    </div>
  );
};

// ==========================================
// 3. COMPOSANT PRINCIPAL APP
// ==========================================
export default function App() {
  const [lignesBrutes, setLignesBrutes] = useState([]);
  const [moisChoisi, setMoisChoisi] = useState('Global');
  const [produitChoisi, setProduitChoisi] = useState('Tous'); 
  const [villeChoisie, setVilleChoisie] = useState('Toutes'); 
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toast, setToast] = useState(null);

  const gererNouveauFichier = (evenement) => {
    const fichier = evenement.target.files[0];
    if (!fichier) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsedData = parseCSVFast(text);
        if(parsedData.length === 0) throw new Error("Fichier vide");
        setLignesBrutes(parsedData);
        setToast({ msg: "Données chargées !", type: "success" });
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        setToast({ msg: "Erreur lecture", type: "error" });
        setTimeout(() => setToast(null), 3000);
      }
    };
    reader.readAsText(fichier);
  };

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    sidebar: isDarkMode ? '#020617' : '#111827',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1f2937',
    textMuted: isDarkMode ? '#94a3b8' : '#6b7280',
    border: isDarkMode ? '#334155' : '#e5e7eb',
    blue: '#2563eb', green: '#10b981', red: '#ef4444'
  };

  // PRÉ-CALCUL UNIQUE À L'UPLOAD
  const baseData = useMemo(() => {
    if (lignesBrutes.length === 0) return null;

    const setMois = new Set(), setProduits = new Set(), setVilles = new Set();
    const lignesPropres = [];

    const sampleRow = lignesBrutes.find(r => Object.keys(r).length > 0) || {};
    const keys = Object.keys(sampleRow);
    
    const findKey = (motsCles) => keys.find(k => {
      const kNorm = normaliserTexte(k);
      return motsCles.some(mot => kNorm.includes(mot));
    });

    const keyQty = findKey(['quantity ordered', 'quantity', 'quantite', 'qty']);
    const keyPrice = findKey(['price each', 'price', 'prix', 'revenu']);
    const keyVille = findKey(['purchase address', 'address', 'adresse', 'ville', 'city']);
    const keyProd = findKey(['product', 'produit']);
    const keyDate = findKey(['order date', 'date', 'statut', 'status']);

    lignesBrutes.forEach(row => {
      const rawProd = row[keyProd];
      const rawQty = row[keyQty];
      
      if (String(rawProd).toLowerCase() === 'product' || String(rawQty).toLowerCase() === 'quantity ordered') return;

      const qty = parseInt(String(rawQty || '0').replace(/[^0-9.-]/g, ''), 10) || 0; 
      const price = parseFloat(String(row[keyPrice] || '0').replace(/\s/g, '').replace(',', '.').replace(/[^0-9.-]/g, '')) || 0;
      const rev = qty * price;

      if (rev <= 0) return;

      const rawVille = row[keyVille];
      let ville = "Inconnu";
      if (rawVille) {
        const vLower = normaliserTexte(rawVille);
        for (let vConfig of Object.keys(VILLES_CONFIG)) {
          if (vLower.includes(normaliserTexte(vConfig))) {
            ville = vConfig.replace(/\b\w/g, l => l.toUpperCase());
            break;
          }
        }
        if (ville === "Inconnu" && !rawVille.includes(',')) ville = rawVille.trim();
      }

      const prod = rawProd || "Inconnu";
      const mois = extraireMois(row[keyDate]) || "Inconnu";

      if (mois !== "Inconnu") setMois.add(mois);
      if (prod !== "Inconnu" && prod !== "") setProduits.add(prod);
      if (ville !== "Inconnu" && ville !== "") setVilles.add(ville);

      lignesPropres.push({ qty, rev, ville, prod, mois });
    });

    return {
      lignesPropres,
      listeMoisArray: [...setMois].sort((a, b) => ORDER_MOIS.indexOf(a) - ORDER_MOIS.indexOf(b)),
      listeProduits: [...setProduits].sort(),
      listeVillesDispo: [...setVilles].sort()
    };
  }, [lignesBrutes]);

  // FILTRAGE INSTANTANÉ AU CLIC
  const dataTraitee = useMemo(() => {
    if (!baseData) return null;

    let totalRevenus = 0, totalQuantite = 0;
    let prevRevenus = 0, prevQuantite = 0; 
    
    const revenusParVille = {};
    const revenusParProduit = {};
    const revenusParMois = {};

    let moisPrecedent = null;
    if (moisChoisi !== 'Global') {
      const idx = ORDER_MOIS.indexOf(moisChoisi);
      if (idx > 0) moisPrecedent = ORDER_MOIS[idx - 1];
    }

    baseData.lignesPropres.forEach(row => {
      const okProduit = produitChoisi === 'Tous' || row.prod === produitChoisi;
      const okVille = villeChoisie === 'Toutes' || row.ville === villeChoisie;

      if (okProduit && okVille) {
        if (moisChoisi === 'Global' || row.mois === moisChoisi) {
          totalRevenus += row.rev;
          totalQuantite += row.qty;
          revenusParVille[row.ville] = (revenusParVille[row.ville] || 0) + row.rev;
          revenusParProduit[row.prod] = (revenusParProduit[row.prod] || 0) + row.rev;
        }
        if (moisPrecedent && row.mois === moisPrecedent) {
          prevRevenus += row.rev;
          prevQuantite += row.qty;
        }
        revenusParMois[row.mois] = (revenusParMois[row.mois] || 0) + row.rev;
      }
    });

    const calcTrend = (actuel, precedent) => {
      if (moisChoisi === 'Global' || !moisPrecedent || precedent === 0) return null;
      const diff = ((actuel - precedent) / precedent) * 100;
      return { val: Math.abs(diff).toFixed(1), isPos: diff >= 0 };
    };

    const trendRevenus = calcTrend(totalRevenus, prevRevenus);
    const trendQuantite = calcTrend(totalQuantite, prevQuantite);
    const panierMoyen = totalQuantite > 0 ? (totalRevenus / totalQuantite) : 0;
    const prevPanier = prevQuantite > 0 ? (prevRevenus / prevQuantite) : 0;
    const trendPanier = calcTrend(panierMoyen, prevPanier);

    const villesTriees = Object.keys(revenusParVille).map(k => ({ nom: k, revenu: revenusParVille[k] })).sort((a,b) => b.revenu - a.revenu);
    const produitsTries = Object.keys(revenusParProduit).map(k => ({ nom: k, revenu: revenusParProduit[k] })).sort((a,b) => b.revenu - a.revenu);
    const evolutionData = baseData.listeMoisArray.map(m => ({ mois: m, revenu: revenusParMois[m] || 0 }));

    return {
      totalRevenus, totalQuantite, panierMoyen, trendRevenus, trendQuantite, trendPanier,
      villesTriees, produitsTries, evolutionData
    };
  }, [baseData, moisChoisi, produitChoisi, villeChoisie]);

  if (!baseData || !dataTraitee) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: theme.bg, fontFamily: 'sans-serif' }}>
        <AlertTriangle size={60} color={theme.blue} style={{ marginBottom: '15px' }} />
        <h3 style={{ color: theme.text, marginBottom: '5px', fontSize: '24px' }}>Executive Dashboard</h3>
        <p style={{ color: theme.textMuted, fontSize: '16px', marginBottom: '30px' }}>Chargez votre fichier CSV pour générer le tableau de bord.</p>
        <div style={{ position: 'relative' }}>
            <button style={{ padding: '15px 30px', backgroundColor: theme.blue, border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <UploadCloud size={24} /> IMPORTER DATA.CSV
            </button>
            <input type="file" accept=".csv" onChange={gererNouveauFichier} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
        </div>
      </div>
    );
  }

  const { totalRevenus, totalQuantite, panierMoyen, trendRevenus, trendQuantite, trendPanier, villesTriees, produitsTries, evolutionData } = dataTraitee;
  const { listeMoisArray, listeProduits, listeVillesDispo } = baseData;
  const maxRevenuVille = villesTriees.length > 0 ? villesTriees[0].revenu : 1;

  const KpiCard = ({ title, value, icon: Icon, color, trend }) => (
    <div style={{ backgroundColor: theme.card, padding: '8px 12px', borderRadius: '8px', border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <p style={{ margin: 0, fontSize: '10px', color: theme.textMuted, fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>{title}</p>
        <h3 style={{ margin: 0, fontSize: '16px', color: theme.text, fontWeight: 'bold' }}>{value}</h3>
        {trend ? (
          <p style={{ margin: '2px 0 0 0', fontSize: '10px', fontWeight: 'bold', color: trend.isPos ? theme.green : theme.red }}>
            {trend.isPos ? '▲ +' : '▼ -'}{trend.val}% vs prec.
          </p>
        ) : (
          <p style={{ margin: '2px 0 0 0', fontSize: '10px', fontWeight: 'normal', color: theme.textMuted }}>
            (Filtrez par mois)
          </p>
        )}
      </div>
      <div style={{ padding: '6px', backgroundColor: isDarkMode ? '#334155' : '#eff6ff', borderRadius: '6px' }}>
        <Icon style={{ width: '16px', height: '16px', color: color || theme.blue }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: theme.bg, fontFamily: '"Segoe UI", Roboto, sans-serif', overflow: 'hidden' }}>
      
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes gradient-text { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .ai-title { background: linear-gradient(90deg, #2563eb, #ec4899, #8b5cf6, #2563eb); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: gradient-text 4s ease infinite; }
        .scroll-filtres::-webkit-scrollbar { width: 4px; }
        .scroll-filtres::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
        .scroll-legend::-webkit-scrollbar { width: 4px; }
        .scroll-legend::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: '15px', right: '15px', backgroundColor: toast.type === 'error' ? theme.red : theme.green, color: 'white', padding: '8px 12px', borderRadius: '6px', zIndex: 1100, display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', fontSize: '12px' }}>
          <CheckCircle size={14} /> <span style={{ fontWeight: '600' }}>{toast.msg}</span>
        </div>
      )}

      {/* ================= SIDEBAR ================= */}
      <div style={{ width: '220px', backgroundColor: theme.sidebar, color: 'white', display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0 }}>
        <div style={{ padding: '15px', borderBottom: '1px solid #1f2937', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ width: '24px', height: '24px', backgroundColor: '#2563eb', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '12px' }}>📊</div>
          <h2 style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.5px' }}>BI DASHBOARD</h2>
        </div>
        
        <div className="scroll-filtres" style={{ flex: 1, overflowY: 'auto', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ padding: '8px 15px', backgroundColor: '#2563eb', borderLeft: '4px solid white', fontWeight: 'bold', fontSize: '12px' }}>👁️ Overview Exécutif</div>
          
          <div style={{ padding: '0 15px' }}>
            <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#4b5563', letterSpacing: '0.5px', marginBottom: '6px', textTransform: 'uppercase' }}>📍 Filtre par Ville</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button onClick={() => { setVilleChoisie('Toutes'); setProduitChoisi('Tous'); }} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: villeChoisie === 'Toutes' ? '#2563eb' : '#1f2937', color: 'white', textAlign: 'left', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                📍 Toutes les villes
              </button>
              {listeVillesDispo.map(v => {
                const isActive = villeChoisie === v;
                const couleurVille = VILLES_CONFIG[v.toLowerCase()]?.couleur || '#2563eb';
                return (
                  <button key={v} onClick={() => { setVilleChoisie(v); setProduitChoisi('Tous'); }} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: isActive ? couleurVille : '#1f2937', color: 'white', textAlign: 'left', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ padding: '0 15px' }}>
            <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#4b5563', letterSpacing: '0.5px', marginBottom: '6px', textTransform: 'uppercase' }}>📅 Filtre par Mois</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <button onClick={() => setMoisChoisi('Global')} style={{ gridColumn: 'span 2', padding: '6px 8px', borderRadius: '6px', border: 'none', backgroundColor: moisChoisi === 'Global' ? '#2563eb' : '#1f2937', color: 'white', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                📅 Année Complète
              </button>
              {listeMoisArray.map(m => (
                <button key={m} onClick={() => setMoisChoisi(m)} style={{ padding: '6px 4px', borderRadius: '6px', border: 'none', backgroundColor: moisChoisi === m ? '#3b82f6' : '#1f2937', color: 'white', fontSize: '11px', fontWeight: '600', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                  {m.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= CONTENU PRINCIPAL ================= */}
      <div style={{ flex: 1, height: '100%', padding: '10px 15px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* HEADER */}
        <div style={{ minHeight: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.card, padding: '6px 15px', borderRadius: '8px', marginBottom: '8px', border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
            <div>
              <h1 style={{ fontSize: '15px', color: theme.text, fontWeight: 'bold', marginBottom: '0' }}>Executive Cockpit</h1>
              <p className="ai-title" style={{ fontSize: '11px', fontWeight: '800', marginTop: '0px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                 ✨ Tableau de bord Hamza Abetti
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <LiveClock isDarkMode={isDarkMode} theme={theme} />
            <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ padding: '6px 8px', borderRadius: '6px', border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, cursor: 'pointer', display: 'flex' }}>
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <select value={villeChoisie} onChange={(e) => { setVilleChoisie(e.target.value); setProduitChoisi('Tous'); }} style={{ padding: '6px 8px', borderRadius: '6px', border: `1px solid ${theme.border}`, fontWeight: '600', color: theme.text, backgroundColor: theme.card, cursor: 'pointer', fontSize: '11px', maxWidth: '120px', outline: 'none' }}>
              <option value="Toutes">📍 Toutes Villes</option>
              {listeVillesDispo.map(v => <option key={v} value={v}>{v}</option>)}
            </select>

            <select value={produitChoisi} onChange={(e) => { setProduitChoisi(e.target.value); setVilleChoisie('Toutes'); }} style={{ padding: '6px 8px', borderRadius: '6px', border: `1px solid ${theme.border}`, fontWeight: '600', color: theme.text, backgroundColor: theme.card, cursor: 'pointer', fontSize: '11px', maxWidth: '120px', outline: 'none' }}>
              <option value="Tous">📦 Tous Produits</option>
              {listeProduits.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select value={moisChoisi} onChange={(e) => setMoisChoisi(e.target.value)} style={{ padding: '6px 8px', borderRadius: '6px', border: `1px solid ${theme.border}`, fontWeight: '600', color: theme.text, backgroundColor: theme.card, cursor: 'pointer', fontSize: '11px', outline: 'none' }}>
              <option value="Global">📅 Année</option>
              {listeMoisArray.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <div style={{ position: 'relative' }}>
              <button style={{ padding: '6px 10px', backgroundColor: '#2563eb', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '600', fontSize: '11px', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center' }}><UploadCloud size={14} /></button>
              <input type="file" accept=".csv" onChange={gererNouveauFichier} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', minHeight: '75px', marginBottom: '10px', flexShrink: 0 }}>
          <KpiCard title="Revenus" value={`${Number(totalRevenus).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $`} icon={DollarSign} color="#2563eb" trend={trendRevenus} />
          <KpiCard title="Volume Vendu" value={totalQuantite === 0 ? '-' : Number(totalQuantite).toLocaleString('fr-FR')} icon={Package} color="#8b5cf6" trend={trendQuantite} />
          <KpiCard title="Panier Moyen" value={panierMoyen === 0 ? '-' : `${Number(panierMoyen).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} $`} icon={ShoppingCart} color="#10b981" trend={trendPanier} />
          <KpiCard title="Marchés Actifs" value={villesTriees.length} icon={Users} color="#f59e0b" />
          <KpiCard title="Top Marché" value={villesTriees[0]?.nom || '-'} icon={MapPin} color="#ef4444" />
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', overflow: 'hidden' }}>
          
          {/* GRAPHIQUES GAUCHE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
            
            {/* LIGNE : CORRIGÉE (interval=0 force l'affichage, tickFormatter raccourcit à 3 lettres) */}
            <div style={{ flex: 1, backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <h3 style={{ fontSize: '11px', color: theme.text, fontWeight: 'bold', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                <BarChart2 size={14} color="#2563eb" /> Évolution Mensuelle
              </h3>
              <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={evolutionData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                    <XAxis 
                      dataKey="mois" 
                      interval={0} 
                      tickFormatter={(v) => v ? v.substring(0, 3) : ''} 
                      tick={{ fill: theme.textMuted, fontSize: 10 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis tick={{ fill: theme.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: theme.card, color: theme.text, borderRadius: '6px', borderColor: theme.border, fontSize: '11px' }} formatter={(v) => `${Number(v).toLocaleString('fr-FR')} $`} />
                    <Bar dataKey="revenu" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                    <Line type="monotone" dataKey="revenu" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* BARRES : CORRIGÉES (interval=0 force l'affichage des noms, et on coupe si trop long) */}
            <div style={{ flex: 1, backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <h3 style={{ fontSize: '11px', color: theme.text, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><Award size={14} color="#8b5cf6" /> Top Produits</span>
                <span style={{ fontSize: '9px', color: theme.textMuted, fontWeight: 'normal' }}>(Cliquez pour filtrer)</span>
              </h3>
              <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={produitsTries.slice(0, 5)} layout="vertical" margin={{ left: 0, right: 15, top: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="nom" 
                      type="category" 
                      interval={0}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: theme.text }} 
                      width={110} 
                      tickFormatter={(v) => String(v).length > 15 ? String(v).substring(0, 15) + '...' : v}
                    />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: theme.card, color: theme.text, borderRadius: '6px', fontSize: '11px' }} formatter={(v) => `${Number(v).toLocaleString('fr-FR')} $`} />
                    <Bar 
                      dataKey="revenu" 
                      fill="#8b5cf6" 
                      radius={[0, 4, 4, 0]} 
                      barSize={10} 
                      cursor="pointer"
                      onClick={(data) => {
                        setProduitChoisi(produitChoisi === data.nom ? 'Tous' : data.nom);
                        setVilleChoisie('Toutes');
                      }} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
            
            <div style={{ flex: 1, backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <h3 style={{ fontSize: '11px', color: theme.text, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><MapPin size={14} color="#ef4444" /> Cartographie</span>
                <span style={{ fontSize: '9px', color: theme.textMuted, fontWeight: 'normal' }}>(Cliquez sur un point)</span>
              </h3>
              <div style={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: isDarkMode ? '#1e293b' : '#f8fafc', borderRadius: '8px', border: `1px solid ${theme.border}`, padding: '6px', minHeight: 0 }}>
                <svg viewBox="0 0 500 300" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
                  <path d="M30,50 L90,35 L120,40 L160,50 L220,55 L310,45 L380,35 L440,35 L470,60 L460,90 L480,120 L440,160 L410,180 L390,230 L360,250 L310,250 L270,280 L230,270 L190,240 L160,240 L120,220 L75,220 L45,180 L25,120 Z" 
                    fill={isDarkMode ? '#334155' : '#e2e8f0'} stroke={isDarkMode ? '#475569' : '#cbd5e1'} strokeWidth="1.5" />
                  {villesTriees.map((ville) => {
                    const nomPropre = String(ville.nom).trim().toLowerCase();
                    const config = VILLES_CONFIG[nomPropre] || VILLES_CONFIG["autre"];
                    const ratio = maxRevenuVille > 0 ? (ville.revenu / maxRevenuVille) : 0;
                    
                    const isHighlighted = villeChoisie === 'Toutes' || ville.nom.trim() === villeChoisie;
                    const rayonCircle = isHighlighted ? (4 + (ratio * 12)) : 2;

                    return (
                      <g key={ville.nom} style={{ cursor: 'pointer', opacity: isHighlighted ? 1 : 0.2 }} onClick={() => { setVilleChoisie(villeChoisie === ville.nom ? 'Toutes' : ville.nom); setProduitChoisi('Tous'); }}>
                        <title>{`${ville.nom} : ${Number(ville.revenu).toLocaleString('fr-FR')} $`}</title>
                        {isHighlighted && <circle cx={config.x} cy={config.y} r={rayonCircle + 4} fill={config.couleur} opacity="0.3" />}
                        <circle cx={config.x} cy={config.y} r={rayonCircle} fill={config.couleur} stroke="#ffffff" strokeWidth="1.5" />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            <div style={{ flex: 1, backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <h3 style={{ fontSize: '11px', color: theme.text, fontWeight: 'bold', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                <MapPin size={14} color={theme.blue} /> Répartition des Ventes
              </h3>
              
              <div style={{ flex: 1, width: '100%', minHeight: 0, display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1.2, height: '100%', minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={villesTriees.slice(0, 10)} innerRadius="65%" outerRadius="95%" paddingAngle={2} dataKey="revenu" nameKey="nom" cx="50%" cy="50%" isAnimationActive={false}>
                        {villesTriees.slice(0, 10).map((entry, index) => {
                           const nomPropre = String(entry.nom).trim().toLowerCase();
                           return <Cell key={`cell-${index}`} fill={VILLES_CONFIG[nomPropre]?.couleur || '#cccccc'} />;
                        })}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: theme.card, color: theme.text, borderRadius: '8px', borderColor: theme.border, fontSize: '11px' }} formatter={(v) => `${Number(v).toLocaleString('fr-FR')} $`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="scroll-legend" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', paddingLeft: '10px', maxHeight: '100%' }}>
                  {villesTriees.slice(0, 10).map((ville, index) => {
                    const nomPropre = String(ville.nom).trim().toLowerCase();
                    const couleur = VILLES_CONFIG[nomPropre]?.couleur || '#cccccc';
                    const pct = totalRevenus > 0 ? ((ville.revenu / totalRevenus) * 100).toFixed(0) : 0;
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: theme.text }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: couleur, flexShrink: 0 }}></div>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ville.nom}</span>
                        <span style={{ fontWeight: 'bold', marginLeft: 'auto', color: theme.textMuted }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}