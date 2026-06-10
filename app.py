import csv
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from collections import defaultdict

app = Flask(__name__)
CORS(app)

# --- NOUVEAU GUICHET : POUR RECEVOIR LE NOUVEAU FICHIER ---
@app.route('/api/upload', methods=['POST'])
def recevoir_fichier():
    # Vérifie si la requête contient bien un fichier
    if 'file' not in request.files:
        return jsonify({"erreur": "Aucun fichier envoyé"}), 400
    
    fichier = request.files['file']
    
    if fichier.filename == '':
        return jsonify({"erreur": "Aucun fichier sélectionné"}), 400
        
    if fichier:
        # On sauvegarde le nouveau fichier en écrasant l'ancien DATA.csv
        fichier.save('DATA.csv')
        return jsonify({"message": "Mise à jour réussie !"})

# --- L'ANCIEN GUICHET : POUR ENVOYER LES DONNÉES À REACT (inchangé) ---
@app.route('/api/data')
def renvoyer_donnees():
    reponse = {
        "Global": {
            "total_revenus": 0, "total_quantite": 0, "commandes_uniques": set(),
            "produits": defaultdict(lambda: {"quantite": 0, "revenu": 0}),
            "villes": defaultdict(float)
        },
        "ParMois": defaultdict(lambda: {
            "total_revenus": 0, "total_quantite": 0, "commandes_uniques": set(),
            "produits": defaultdict(lambda: {"quantite": 0, "revenu": 0}),
            "villes": defaultdict(float)
        }),
        "GraphiqueMois": defaultdict(float)
    }

    ordre_mois = {'January':1, 'February':2, 'March':3, 'April':4, 'May':5, 'June':6, 'July':7, 'August':8, 'September':9, 'October':10, 'November':11, 'December':12}

    try:
        with open('DATA.csv', mode='r', encoding='utf-8') as fichier:
            lecteur = csv.DictReader(fichier, delimiter='\t') 
            
            for ligne in lecteur:
                try:
                    quantite = float(ligne['Quantity Ordered'])
                    prix = float(ligne['Price'])
                except ValueError:
                    continue 
                    
                revenu = quantite * prix
                produit = ligne['Product']
                order_id = ligne['Order ID']
                
                adresse = ligne.get('Purchase Address', '')
                ville = adresse.split(',')[1].strip() if ',' in adresse else "Inconnue"
                    
                fichier_source = ligne.get('STATUT', '')
                mois = fichier_source.split('_')[1] if '_' in fichier_source else "Inconnu"
                    
                reponse["Global"]["total_revenus"] += revenu
                reponse["Global"]["total_quantite"] += quantite
                reponse["Global"]["commandes_uniques"].add(order_id)
                reponse["Global"]["produits"][produit]["quantite"] += quantite
                reponse["Global"]["produits"][produit]["revenu"] += revenu
                reponse["Global"]["villes"][ville] += revenu
                
                if mois != "Inconnu":
                    reponse["ParMois"][mois]["total_revenus"] += revenu
                    reponse["ParMois"][mois]["total_quantite"] += quantite
                    reponse["ParMois"][mois]["commandes_uniques"].add(order_id)
                    reponse["ParMois"][mois]["produits"][produit]["quantite"] += quantite
                    reponse["ParMois"][mois]["produits"][produit]["revenu"] += revenu
                    reponse["ParMois"][mois]["villes"][ville] += revenu
                    reponse["GraphiqueMois"][mois] += revenu

        def formater_produits(dico, critere):
            liste = [{"nom": p, "quantite": v["quantite"], "revenu": v["revenu"]} for p, v in dico.items()]
            return sorted(liste, key=lambda x: x[critere], reverse=True)[:5]
            
        def formater_villes(dico):
            liste = [{"nom": v, "revenu": r} for v, r in dico.items()]
            return sorted(liste, key=lambda x: x["revenu"], reverse=True)

        reponse["Global"]["panier_moyen"] = reponse["Global"]["total_revenus"] / len(reponse["Global"]["commandes_uniques"]) if reponse["Global"]["commandes_uniques"] else 0
        reponse["Global"]["produits_revenu"] = formater_produits(reponse["Global"]["produits"], "revenu")
        reponse["Global"]["produits_quantite"] = formater_produits(reponse["Global"]["produits"], "quantite")
        reponse["Global"]["villes"] = formater_villes(reponse["Global"]["villes"])
        del reponse["Global"]["commandes_uniques"]
        del reponse["Global"]["produits"]
        
        for m in reponse["ParMois"]:
            reponse["ParMois"][m]["panier_moyen"] = reponse["ParMois"][m]["total_revenus"] / len(reponse["ParMois"][m]["commandes_uniques"]) if reponse["ParMois"][m]["commandes_uniques"] else 0
            reponse["ParMois"][m]["produits_revenu"] = formater_produits(reponse["ParMois"][m]["produits"], "revenu")
            reponse["ParMois"][m]["produits_quantite"] = formater_produits(reponse["ParMois"][m]["produits"], "quantite")
            reponse["ParMois"][m]["villes"] = formater_villes(reponse["ParMois"][m]["villes"])
            del reponse["ParMois"][m]["commandes_uniques"]
            del reponse["ParMois"][m]["produits"]
            
        donnees_graphique = [{"mois": m, "revenu": r} for m, r in reponse["GraphiqueMois"].items()]
        donnees_graphique.sort(key=lambda x: ordre_mois.get(x['mois'], 99))
        reponse["GraphiqueMois"] = donnees_graphique

        return jsonify(reponse)
        
    except Exception as e:
        return jsonify({"erreur": str(e)})

if __name__ == '__main__':
    app.run(debug=True)