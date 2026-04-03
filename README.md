# 🍽️ Crous on WhatsApp

Bot Node.js/TypeScript qui scrape le menu du jour du **Resto U L'Amazone** (CROUS Bordeaux) et l'envoie automatiquement sur un groupe WhatsApp chaque jour ouvré à 11h.

---

## Contexte

A REALISER :

1) bun i

2) créer un fichier .env selon vos informations :

CROUS_URL_1=[l'URL de votre CROUS]

CROUS_URL_2=[l'URL de votre CROUS]

CROUS_URL_3=[l'URL de votre CROUS]

GROUP_NAME=[Lancer "bun scripts/list-groups.ts et copier l'id (qui ressemble à 1738346@g.us) du groupe dans lequel vous voulez ajouter les messages"]

WHATSAPP_GROUP_INVITE=[créer un lien d'invitation whatsapp et ne mettre que ce qu'il y a après https://chat.whatsapp.com/]

CRON_SCHEDULE=0 11 * * 1-5      #s'active à 11H tous les jours ouvrés

TZ=Europe/Paris


## Stack technique

| Composant | Technologie | Rôle |
|-----------|------------|------|
| Langage | **TypeScript** (Node.js) | Meilleur écosystème pour whatsapp-web.js, typé, maintenable |
| Scraping | **axios** + **cheerio** | Requête HTTP + parsing HTML du site CROUS |
| WhatsApp | **whatsapp-web.js** v1.34.6 | Contrôle WhatsApp Web via Puppeteer (gratuit, non officiel) |
| Planification | **node-cron** | Cron job `0 11 * * 1-5` (11h, lun-ven) |
| QR Code | **qrcode-terminal** | Affichage du QR code dans le terminal au 1er lancement |
| Process manager | **pm2** | Maintien du bot en vie sur la VM Ubuntu |

---

## Architecture

```
src/
  index.ts          — Point d'entrée, orchestration
  scraper.ts        — Fetch + parsing du menu CROUS (axios + cheerio)
  whatsapp.ts       — Client WhatsApp (connexion, QR, envoi au groupe)
  scheduler.ts      — Cron job (node-cron)
  formatter.ts      — Formatage du menu en message WhatsApp avec emojis
  config.ts         — Constantes (URL CROUS, invite code, cron expression)
ecosystem.config.js — Configuration pm2
package.json
tsconfig.json
```

---

## Contexte technique découvert

### Source des menus (site CROUS)

- Le menu du jour est **directement dans le HTML** (pas de rendu JS côté client) → scraping simple avec un GET HTTP + cheerio
- Structure HTML : titre `Menu du [jour] [date]`, puis catégories (`ENTREES`, `PLAT DU JOUR - STAND X`, `DESSERT`) avec listes de plats
- **Pas d'API CROUS officielle** pour les menus quotidiens (le dataset data.gouv.fr ne contient que les métadonnées des restaurants, pas les menus)
- Le site affiche parfois `menu non communiqué` → à gérer

### WhatsApp (whatsapp-web.js)

- Librairie Node.js qui lance WhatsApp Web via Puppeteer et en expose les fonctions internes
- **1er lancement** : scanner un QR code avec un téléphone (numéro dédié ou perso)
- **LocalAuth** strategy : persiste la session entre les redémarrages (pas besoin de re-scanner)
- Supporte l'envoi de messages à des groupes via `client.sendMessage(chatId, message)`
- Le lien d'invitation peut être utilisé pour rejoindre le groupe via `client.acceptInvite(inviteCode)`
- **Risque de ban** théorique (CGU WhatsApp) mais très faible pour 1 message/jour

---

## Plan d'implémentation

### Phase 1 — Setup projet
1. Initialiser le projet Node.js + TypeScript (`package.json`, `tsconfig.json`)
2. Installer les dépendances + types TS

### Phase 2 — Scraper CROUS *(parallélisable avec Phase 3)*
3. Implémenter `scraper.ts` : GET sur l'URL CROUS → parsing HTML avec cheerio → extraction des catégories (entrées, plats par stand, desserts) et de la date
4. Implémenter `formatter.ts` : formatage en message WhatsApp lisible avec emojis
5. Gérer le cas "menu non communiqué"

### Phase 3 — Client WhatsApp *(parallélisable avec Phase 2)*
6. Implémenter `whatsapp.ts` : init client avec `LocalAuth`, afficher le QR via `qrcode-terminal`, fonctions `joinGroup()` et `sendToGroup()`
7. Gestion de la reconnexion automatique

### Phase 4 — Orchestration *(dépend de Phase 2 et 3)*
8. Implémenter `scheduler.ts` : cron `0 11 * * 1-5` (11h, lundi à vendredi)
9. Implémenter `index.ts` : démarrage client → `ready` → cron job → scrape → format → envoi
10. Ajouter un flag `--now` pour tester un envoi immédiat sans attendre le cron

### Phase 5 — PM2 & déploiement
11. Créer `ecosystem.config.js` pour pm2 (restart policy, logs)
12. Ajouter scripts npm : `build`, `start`, `dev`, `test:send`

---

## Comment utiliser

### Prérequis
- [Bun](https://bun.sh/) >= 1.0
- Un numéro de téléphone avec WhatsApp (dédié de préférence)

### Installation
```bash
git clone <repo>
cd Crous_on_whatsapp
bun install
```

### Premier lancement (scan QR)
```bash
bun dev
```
Un QR code s'affiche dans le terminal → le scanner avec l'app WhatsApp du téléphone dédié. La session est ensuite persistée localement.

### Tester un envoi immédiat
```bash
bun run test:send
```

### Production (VM Ubuntu avec pm2)
```bash
bun run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # pour redémarrage auto après reboot
```

### Logs
```bash
pm2 logs crous-whatsapp
```

---

## Vérification

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| Scraper seul | `bun src/scraper.ts` | Menu du jour affiché dans la console |
| Formatter | Console output | Message lisible avec emojis |
| WhatsApp | Scanner QR + envoi test | Message reçu sur le groupe |
| Intégration | `bun run test:send` | Menu du jour reçu sur le groupe |
| Cron | Changer temporairement l'heure à `now + 2min` | Déclenchement automatique vérifié |
| PM2 | `pm2 start ecosystem.config.js` | Process stable, `pm2 logs` OK |

---

## Décisions & justifications

| Décision | Pourquoi |
|----------|----------|
| **whatsapp-web.js** (gratuit, non officiel) | API Meta payante (~0.05€/msg) + compte Business requis. Pour 1 msg/jour, le risque de ban est négligeable. |
| **Scraping HTML** | Pas d'API CROUS officielle pour les menus quotidiens |
| **TypeScript** | Seul choix viable pour whatsapp-web.js (lib Node.js), typage fort = maintenabilité |
| **LocalAuth** | Session persistante entre les redémarrages, compatible pm2 |
| **Numéro dédié recommandé** | Limite le risque en cas de ban (ne pas perdre son numéro perso) |

---

## Risques & mitigations

| Risque | Probabilité | Mitigation |
|--------|------------|------------|
| Changement structure HTML du site CROUS | Moyenne | Log d'erreur + message "menu indisponible" envoyé au groupe |
| Ban WhatsApp | Très faible (1 msg/jour) | Utiliser un numéro dédié |
| Session WhatsApp expirée | Rare | pm2 redémarre le process, re-scan QR si nécessaire |
| Site CROUS en maintenance | Faible | Retry automatique + message d'erreur au groupe |