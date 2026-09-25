// Shadow Duel — French catalog (fr-FR, "tu") for ND.i18n (Turkish is the source language).
// Same structure as js/i18n-en.js (the reference catalog); see js/i18n.js for how each part is applied.
//   FR.STR / CHARS / ARENAS / SPECIALS / TXT / AI_LEVELS / NUMWORDS / PHRASES / HTML / PATTERNS (parameter named EN
//   so the code stays identical to i18n-en.js).
// Typography: narrow no-break space (\u202F) before ! ? ; — no-break space (\u00A0) before : and inside « » —
// "80\u00A0%". Kanji pop-ups (燕! 金剛!), <kbd> keys and Japanese technique names are left as they are.
//
// GLOSSARY (use these everywhere)
//   parry → parade (parer)            guard → garde                  counter → riposte (riposter)
//   counter hit (pop-up) → CONTRE     posture / guard break → posture / garde brisée, barre de posture
//   ki → ki                           ki technique → technique ki    combo → combo
//   string / chain → enchaînement, série (named rows)                string ender → fin d’enchaînement
//   launcher → lanceur (pop-up EN L’AIR !)                           juggle → jonglage
//   rally → échange                   dash → ruée                    round → round
//   KO → K.O.                         blade lock → lames croisées    light / heavy slash → coupe légère / lourde
//   kick → coup de pied               sweep → fauchage               cross-up → contournement
//   knock down → mettre au sol        finisher → coup final          dummy → mannequin
//   honor → honneur                   rival challenge → défi de rival  tournament → tournoi (du mois)
//   trial → épreuve (Dan / de combo)  leaderboard → classement       nickname → pseudo
//   HP → PV / vie                     CPU → IA                       Arcade → Arcade
//   Touch buttons: ATTAQUE · LOURD · PIED · GARDE · RUÉE · SHUR. · KI · SAUT    keyboard labels: LÉGER / LOURD
//   Move-list prefixes: Fwd+ → Av+ · Back+ → Arr+
(function (ND) {
  'use strict';
  (ND.I18N_CATALOGS || (ND.I18N_CATALOGS = {})).fr = function (I, EN) {
    const merge = I.merge;
    const num = (n) => I.num(n);
    const dec = (x) => I.dec(x);
    const fmtTime = (s) => I.time(s);

    // ================================================================ UI tables (ND.STR)
    merge(EN.STR, {
      menu: {
        brand: (nc, na) => `${nc} combattants, ${na} arènes et un maître caché. Duels de sabres en temps réel, lames croisées, parades, postures brisées, techniques ki et physique ragdoll.`,
        arcade: 'Arcade',
        arcadeDesc: 'Bats tes rivaux un à un tandis que la difficulté monte\u202F; un maître caché t’attend au bout. Gagne pour débloquer de nouveaux ninjas et arènes.',
        arcadeProg: (best, c, ct, a, at) => `${best ? 'Record ' + num(best) + ' · ' : ''}${c}/${ct} ninjas · ${a}/${at} arènes débloqués`,
        train: 'Entraînement',
        trainDesc: 'Entraîne-toi librement sur le mannequin ou apprends pas à pas',
        trainFree: 'Libre',
        trainTut: 'Tutoriel',
        watchShort: 'Deux ninjas au hasard, IA Légende',
        specialKey: 'Technique ki (ki plein)',
      },
      sel: {
        title: { '2p': 'Choisis ton ninja', cpu: 'Choisis ton ninja', arcade: 'Arcade · Choisis ton ninja', train: 'Entraînement · Choisis ton ninja', tutorial: 'Tutoriel · Choisis ton ninja', tourney: 'Tournoi du mois · Choisis ton ninja', dan: 'Épreuve Dan · Choisis ton ninja' },
        who1: { '2p': 'Joueur 1 · A / D pour choisir, F pour valider', def: 'Toi · A / D pour choisir, F pour valider' },
        who2: { '2p': 'Joueur 2 · ← / → pour choisir, K pour valider', cpu: 'Adversaire (IA) · ← / → pour choisir', train: 'Mannequin · ← / → pour choisir' },
        go: { def: 'Combattre', arcade: 'Lancer l’Arcade', train: 'S’entraîner', tutorial: 'Lancer le tutoriel', tourney: 'Lancer le tournoi', dan: 'Passer l’épreuve' },
        random: 'Aléatoire',
        arena: 'Arène',
        locked: 'Verrouillé',
        lockMsg: (name, hint) => `${name} · à débloquer · ${hint}`,
        keyHint: '<kbd>Enter</kbd> lancer · <kbd>⌫</kbd> retour',
      },
      hint: {
        wins: (n, cur) => `Gagne ${n} ${n <= 1 ? 'combat' : 'combats'} en Arcade (${Math.min(cur, n)}/${n})`,
        clear: 'Termine l’Arcade une fois',
        boss: 'Bats le boss final en Arcade',
        arena: 'Gagne un combat dans cette arène en Arcade',
      },
      toast: {
        newChar: (name) => `Nouveau combattant débloqué\u00A0: ${name}`,
        newArena: (name) => `Nouvelle arène débloquée\u00A0: ${name}`,
        newBest: (s) => `Nouveau record\u00A0: ${num(s)} pts`,
        lesson: (t) => `Leçon terminée\u00A0: ${t}`,
        tutDone: 'Tutoriel terminé\u202F!',
        perf: 'Graphismes réduits pour la fluidité',
      },
      vs: {
        stage: (i, n) => `Combat ${i} / ${n}`,
        boss: 'Combat final',
        go: 'En garde\u202F!',
        quit: 'Quitter l’Arcade',
        keys: '<kbd>Enter</kbd> / <kbd>F</kbd> lancer · <kbd>⌫</kbd> quitter',
        unknown: '?',
      },
      hud: { you: 'TOI', cpu: 'IA', dummy: 'MANNEQUIN', stage: (i, n) => `${i}/${n}`, boss: 'BOSS FINAL', inf: '∞', lockSolo: 'Martèle F / K\u202F!', lockDuo: 'Martèle léger ou lourd\u202F!' },
      end: {
        rematch: 'Revanche', change: 'Changer de ninja', menu: 'Menu principal',
        winTitle: 'La victoire est tienne',
        winSub: (i, n, pts) => `Combat ${i}/${n} remporté · +${num(pts)} pts`,
        next: 'Combat suivant',
        bossNext: 'Jusqu’au bout',
        lossTitle: 'Défaite',
        lossSub: (name) => `${name} a eu le dessus cette fois. Réessaie.`,
        retry: 'Réessayer',
        quit: 'Quitter l’Arcade',
      },
      ending: {
        head: 'Fin',
        rows: { fights: 'Combats', time: 'Temps total', retries: 'Reprises', perfect: 'Rounds parfaits', score: 'Score', best: 'Record' },
        newBest: 'Nouveau record\u202F!',
        menu: 'Menu principal',
        again: 'Rejouer',
        unlocked: 'Débloqué',
        fightPts: 'Points de combat',
        bonus: 'Bonus final',
      },
      score: {
        hud: 'SCORE',
        rows: { hit: 'Coups', combo: 'Combo', counter: 'Riposte', defense: 'Défense', pressure: 'Pression', special: 'Technique ki', round: 'Victoire', perfect: 'Parfait', hp: 'PV restants', time: 'Bonus temps' },
        total: 'Score du match',
        diff: (name, m) => `dont ${name} ×${dec(m)}`,
        best: (s) => `Ton record\u00A0: ${num(s)}`,
        newBest: 'Nouveau record\u202F!',
        arcadeTotal: (s) => `Total Arcade\u00A0: ${num(s)}`,
        lossNote: (s, pen) => `Cet essai ne compte pas · total Arcade ${num(s)} · chaque reprise −${num(pen)}`,
        clearBonus: (c, n) => `+${num(c)}${n ? ' · sans reprise +' + num(n) : ''}`,
        lossCpu: 'Défaite · seules les victoires entrent au classement',
        cpuBoardHint: 'Les victoires en Légende entrent au classement',
      },
      lb: {
        menu: 'Classement',
        menuDesc: 'Records Arcade et Légende',
        title: 'Classement',
        back: 'Retour',
        boards: { arcade: 'Arcade', cpu_efsane: 'IA Légende' },
        boardDesc: { arcade: 'Score total d’une Arcade terminée', cpu_efsane: 'Score d’un match gagné contre l’IA Légende' },
        all: 'Tous',
        status: { loading: 'Chargement…', online: 'Classement en ligne', readonly: 'Classement en ligne · lecture seule', local: 'Classement local', error: 'Erreur · classement local', offline: 'Hors ligne · classement local' },
        empty: 'Aucun score pour l’instant. Ouvre le bal\u202F!',
        loadErr: 'Impossible de charger le classement.',
        you: 'Toi', youTag: 'toi', player: 'Joueur',
        nick: 'Pseudo', nickPh: 'Ton pseudo', nickSave: 'Valider', nickEdit: 'Modifier',
        nickAsk: 'Pseudo pour le classement local\u00A0:',
        saving: 'Enregistrement…',
        savedOnline: (r) => `Rang en ligne\u00A0: #${r}`,
        savedOnlineNoRank: 'Enregistré au classement en ligne',
        savedOnlineGap: (r, g) => `Rang en ligne\u00A0: #${r} · à ${g} pts du top 10`,
        reason: {
          needName: 'Choisis un pseudo pour entrer au classement en ligne',
          offline: 'Pas de connexion — score gardé, il partira dès ton retour en ligne',
          rate: 'Trop d’envois — le score partira sous peu',
          daily: 'Limite d’envois du jour atteinte — score gardé en local',
          week: 'Le mois est fini — ce score ne compte pas pour le nouveau',
          invalid: 'Score invalide',
        },
        nickErr: {
          nick_length: 'Le pseudo doit faire de 3 à 16 caractères',
          nick_chars: 'Lettres, chiffres, espaces et _ . - uniquement (au moins une lettre)',
          nick_bad: 'Ce pseudo n’est pas autorisé, choisis-en un autre',
          rate_limited: 'Attends un instant et réessaie',
        },
        nickErrDef: 'Impossible d’enregistrer le pseudo',
        nickAskOnline: 'Pseudo pour le classement en ligne\u00A0:',
        savedLocal: (r) => (r ? `#${r} au classement local` : 'Enregistré au classement local'),
        rejected: 'Ton score n’a pas pu être enregistré — classement local uniquement',
        savedLocalAccount: (r) => (r ? `#${r} sur cet appareil · le classement en ligne des comptes arrive bientôt` : 'Enregistré sur cet appareil · le classement en ligne des comptes arrive bientôt'),
        quota: 'Classement en ligne plein — score gardé en local',
        open: 'Classement',
        keys: '<kbd>←</kbd> <kbd>→</kbd> tableau · <kbd>↑</kbd> <kbd>↓</kbd> ninja · <kbd>⌫</kbd> retour',
      },
      bz: {
        back: 'Retour', toMenu: 'Menu principal', you: 'Toi', youTag: 'toi', newBest: 'Nouveau record\u202F!', seeResult: 'Voir le résultat',
        resetIn: 'Remise à zéro dans',
        // time left: jours (j) · heures (h) · minutes (min) · secondes (s)
        left: (ms) => { const t = Math.floor(ms / 1000), d = Math.floor(t / 86400), hh = Math.floor((t % 86400) / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60; return d ? `${d}\u00A0j ${hh}\u00A0h ${mm}\u00A0min` : hh ? `${hh}\u00A0h ${mm}\u00A0min` : `${mm}\u00A0min ${ss}\u00A0s`; },
        leftShort: (ms) => { const t = Math.floor(ms / 60000), d = Math.floor(t / 1440), hh = Math.floor((t % 1440) / 60), mm = t % 60; return d ? `${d}\u00A0j ${hh}\u00A0h` : hh ? `${hh}\u00A0h ${mm}\u00A0min` : `${mm}\u00A0min`; },
        weekName: (m, y) => `${['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][m - 1] || m} ${y}`,
        monthName: (m) => ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][m - 1] || String(m),
        rank: (r) => (r <= 0 ? 'Sans rang' : r <= 10 ? `Kyu ${11 - r}` : `Dan ${r - 10}`),
        fightOf: (i, n) => `Combat ${i}/${n}`,
        hpBonus: (p) => `PV adverses +${p}\u00A0%`,
        mirrorOpp: 'Miroir · ton propre ninja',
        suddenSub: 'Un seul round · le premier à tomber perd',
        rows: { fights: 'Victoires', time: 'Temps', fightPts: 'Points de combat', stage: 'Bonus d’étape', clear: 'Bonus final', total: 'Score du tournoi', weekBest: 'Ton record du mois' },
        mods: {
          rally2x: { n: 'Échanges ardents', d: 'Dégâts des ripostes ×2' },
          fullKi: { n: 'Ki plein', d: 'Chaque round commence ki plein' },
          sudden: { n: 'Mort subite', d: 'Un seul round\u202F; les deux camps partent à mi-vie' },
          mirror: { n: 'Miroir', d: 'Ton adversaire est ton propre ninja' },
          parryOnly: { n: 'Ripostes seules', d: 'Coups normaux à 25\u00A0% des dégâts\u202F; ripostes ×1,5' },
          posture2x: { n: 'Posture fragile', d: 'Dégâts de posture ×2\u00A0: les gardes cèdent vite' },
          shuriken3x: { n: 'Pluie de shuriken', d: 'Shuriken ×3' },
          kiRush: { n: 'Déluge de ki', d: 'Le ki se remplit deux fois plus vite' },
          glass: { n: 'Lame de verre', d: 'Tous les dégâts ×1,5' },
        },
        menu: {
          tour: 'Tournoi du mois', dan: 'Épreuve Dan', hall: 'Salle des champions',
          tourRank: (p, left) => `Ce mois-ci\u00A0: #${p} · fin dans ${left}`,
          tourBest: (b, left) => `Ton record ${b} · fin dans ${left}`,
          tourNew: (left) => `Les 8 mêmes combats pour tous · fin dans ${left}`,
          danRank: (name, next) => (next ? `Ton rang\u00A0: ${name} · suivant\u00A0: ${next}` : `Ton rang\u00A0: ${name} · tu es au sommet`),
          danNew: '20 épreuves, de Kyu 10 à Dan 10',
          hallRank: (p) => `Ce mois-ci #${p} · records`,
          hallDesc: 'Le top 10 du mois et les records absolus',
          nick: (n) => (n ? `Pseudo\u00A0: ${n}` : 'Choisis un pseudo'),
        },
        t: {
          title: 'Tournoi du mois', head: 'Tournoi',
          runNote: (s, st) => `Total du tournoi\u00A0: ${num(s)} (dont +${num(st)} par victoire)`,
          lossSub: (name, won) => `${name} a mis fin à ta course · ${won} ${won <= 1 ? 'victoire' : 'victoires'}`,
          lossNote: (s) => `Ce combat ne compte pas · score du tournoi ${num(s)}`,
          quit: 'Finir le tournoi',
          myBest: (b, a) => `Ton record ce mois-ci\u00A0: ${b} pts · ${a} ${a <= 1 ? 'essai' : 'essais'}`,
          noTry: 'Aucun essai ce mois-ci.',
          place: (p, t) => (t ? `#${p} / ${t}` : `#${p}`),
          rules: (n, clear, stage) => `${n} combats\u202F; les mêmes adversaires, arènes et règles pour tous. Une défaite met fin à l’essai\u202F; les essais sont illimités et seul le meilleur compte. Chaque victoire +${stage}, tous les battre +${clear}.`,
          start: 'Choisis ton ninja et commence', again: 'Réessayer', go: 'Entrer dans le tournoi',
          clearTitle: 'Tournoi conquis', overTitle: 'Essai terminé',
          savedToast: (s) => `Score du tournoi enregistré\u00A0: ${s}`,
        },
        d: {
          title: 'Épreuve Dan', head: 'Épreuve Dan',
          sub: 'Réussis chaque épreuve pour gravir les rangs. Ton rang s’affiche à côté de ton nom dans les classements.',
          trialOf: (n) => `Épreuve ${n}`,
          runNote: (i, n) => `Épreuve\u00A0: ${i}/${n} combats gagnés`,
          lossSub: (name) => `${name} a stoppé ton épreuve.`,
          lossNote: 'Épreuve échouée',
          quit: 'Quitter l’épreuve',
          yourRank: 'Ton rang', bestWas: (n) => `Meilleur\u00A0: ${n}`, ladder: 'Échelle des rangs',
          nextTrial: (n) => `Suivante\u00A0: épreuve ${n}`,
          fights: (n) => `${n} ${n <= 1 ? 'combat' : 'combats'}`,
          bossLast: 'Combat final\u00A0: Shura',
          strikes: (left, max) => `Chances\u00A0: ${left}/${max} · ${max} épreuves ratées et tu perds un rang`,
          safe: 'À ce rang, une épreuve ratée ne te fait pas descendre.',
          maxed: 'Au sommet\u00A0: Dan 10', maxedSub: 'Ton nom trône en tête du tableau Dan.',
          start: 'Choisis ton ninja et passe l’épreuve', next: 'Épreuve suivante', go: 'Passer l’épreuve',
          promoted: (n) => `Promotion\u00A0: ${n}`, demoted: (n) => `Rétrogradation\u00A0: ${n}`, failed: 'Épreuve échouée',
          promotedSub: (a, b) => `${a} → ${b}`, demotedSub: 'Trois épreuves ratées. Remonte la pente\u202F!', tryAgain: 'Réessaie\u202F; ton rang est sauf.',
          toast: (n) => `Nouveau rang\u00A0: ${n}`, leftToast: 'Épreuve abandonnée\u00A0: comptée comme un échec',
        },
        hall: {
          title: 'Salle des champions',
          tabs: { week: { n: 'Ce mois' }, alltime: { n: 'Historique' }, archive: { n: 'Champions' }, chars: { n: 'Ninjas' }, dan: { n: 'Dan' } },
          desc: { alltime: 'Les meilleurs scores de l’histoire du Tournoi du mois', archive: 'Le top 10 de chaque mois terminé est gravé ici pour toujours', chars: 'Détenteur du record pour chaque ninja · touche un ninja pour voir le top 20', dan: 'Les rangs les plus élevés' },
          loading: 'Chargement…', error: 'Impossible de charger le classement.', retry: 'Réessayer',
          empty: 'Personne ici pour l’instant. Ouvre le bal\u202F!', emptyDan: 'Aucun joueur classé pour l’instant.', emptyArchive: 'Aucun mois terminé. Les premiers champions seront gravés à la fin de celui-ci.',
          anon: 'Joueur',
          meTop: (p, s) => `Toi\u00A0: #${p} · ${s} pts · tu es dans le top 10\u202F!`,
          meGap: (p, g, s) => `Toi\u00A0: #${p} · ${s} pts · à ${g} pts du top 10`,
          meNone: 'Pas encore de score ce mois-ci.',
          meDan: (p, n) => `Toi\u00A0: #${p} · ${n}`,
          meDanLocal: (n) => `Ton rang\u00A0: ${n}`, meNoDan: 'Pas encore de rang. Première épreuve\u00A0: Kyu 10.',
          noRecord: 'Aucun record', allNinjas: 'Tous les ninjas',
          pending: (n) => `Envois en attente\u00A0: ${n}`,
          classic: 'Tableaux Arcade · Légende',
        },
        // Monthly Tournament rewards: permanent title (top 3) and Champion colors (1st)
        ttl: {
          champ: 'Champion du mois', finalist: 'Finaliste',
          reward: 'Le top 3 de chaque mois gagne un titre permanent. Le champion remporte aussi des couleurs de champion exclusives pour le ninja utilisé. Les titres exigent au moins 5 joueurs dans le mois.',
          hall: 'Le top 3 du mois gagne un titre permanent (5 joueurs min.) · couleurs de champion pour le vainqueur',
          colors: 'Couleurs de champion',
          how: 'Gagne le tournoi avec ce ninja',
          unlocked: (name) => `Champion du mois\u00A0! Couleurs de champion de ${name} débloquées`,
          newTitle: (t) => `Nouveau titre\u00A0: ${t}`,
        },
      },
      train: {
        title: 'Entraînement', tutTitle: 'Tutoriel',
        dummy: 'Mannequin',
        beh: { idle: 'Immobile', guard: 'Garde', attack: 'Attaque', counter: 'Riposte' },
        infHp: 'PV infinis', fullKi: 'Ki plein',
        reset: 'Replacer',
        hide: 'Masquer', show: 'Panneau',
        moves: 'Liste des coups',
        lessons: 'Leçons',
        lessonOf: (i, n) => `Leçon ${i}/${n}`,
        done: 'Tutoriel terminé\u202F! Règle le mannequin comme tu veux et entraîne-toi librement.',
        progress: (a, b) => `${a}/${b}`,
        keysHelp: '<kbd>1</kbd>–<kbd>4</kbd> mannequin · <kbd>⌫</kbd> replacer · <kbd>H</kbd> panneau',
        specialFallback: { kanji: '影斬り', name: 'Coupe de l’ombre', desc: 'Une coupe fulgurante qui traverse l’adversaire de part en part.', tip: '' },
        kiFull: 'ki plein',
        counterTip: 'Comment y répondre',
      },
      moves: [
        ['<kbd>A</kbd><kbd>D</kbd>', 'Marcher', 'double appui\u00A0: ruée'],
        ['<kbd>W</kbd>', 'Sauter', ''],
        ['<kbd>F</kbd><kbd>F</kbd><kbd>F</kbd>', 'Combo léger ×3', 'le 3e coup repousse'],
        ['<kbd>G</kbd>', 'Coupe lourde', 'met au sol'],
        ['<kbd>R</kbd>', 'Coup de pied', 'force la garde, remplit la posture'],
        ['<kbd>T</kbd>', 'Shuriken', ''],
        ['<kbd>Shift</kbd>', 'Ruée', 'Shift gauche'],
        ['<kbd>Shift</kbd>›<kbd>F</kbd>', 'Coupe en ruée', ''],
        ['<kbd>W</kbd>›<kbd>F</kbd>', 'Coupe aérienne', ''],
        ['<kbd>W</kbd>›<kbd>G</kbd>', 'Plongeon', 'lourd en l’air'],
        ['<kbd>S</kbd>', 'Garde', 'maintenir'],
        ['<kbd>S</kbd>!', 'Parade', 'juste avant l’impact'],
        ['<kbd>F</kbd>', 'Riposte directe', 'après garde/parade'],
        ['Av+<kbd>F</kbd>', 'Fauchage', 'riposte · aux jambes'],
        ['Arr+<kbd>F</kbd>', 'Contournement', 'riposte · passe dans son dos'],
        ['<kbd>G</kbd>', 'Riposte lourde', 'riposte · met au sol'],
        ['Échange', 'Échange', 'bloque sa riposte, riposte à ton tour\u202F; ta 3e riposte devient un coup final'],
        ['<kbd>F</kbd>/<kbd>G</kbd>!!', 'Lames croisées', 'martèle pendant le blocage pour le repousser'],
      ],
      touch: {
        btn: { light: 'ATTAQUE', heavy: 'LOURD', kick: 'PIED', guard: 'GARDE', dodge: 'RUÉE', throw: 'SHUR.', special: 'KI', up: 'SAUT', down: 'GARDE', stick: 'Joystick' },
        lock: 'Martèle ATTAQUE\u202F!',
        replaySkip: 'touche pour passer',
        rotateTitle: 'Tourne ton écran',
        rotateText: 'Shadow Duel se joue à l’horizontale. Les menus restent utilisables à la verticale.',
        rotMenu: 'Menu principal',
        need2p: 'Clavier / manette requis',
        need2pToast: 'Branche un clavier ou une manette pour jouer à deux',
        hints: 'Astuces',
        pause: 'Pause',
        sel: { who1: 'Toi · touche ton ninja', who2: 'Adversaire (IA) · touche pour choisir', who2train: 'Mannequin · touche pour choisir' },
        opt: {
          title: 'Commandes tactiles',
          layout: 'Disposition', simple: 'Simple', full: 'Complète',
          size: 'Taille', sizes: { s: 'Petite', m: 'Moyenne', l: 'Grande' },
          hand: 'Boutons', right: 'À droite', left: 'À gauche',
          assist: 'Assistance', haptic: 'Vibration',
          fullscreen: 'Plein écran', exitFullscreen: 'Quitter le plein écran',
          note: 'Simple\u00A0: 5 gros boutons. Complète\u00A0: ajoute coup de pied et shuriken. Assistance\u00A0: maintiens ATTAQUE et le combo continue, une brève touche sur GARDE dure assez pour parer, et le stick ne fait pas sauter par accident. Elle facilite seulement le tactile\u202F; règles et scores sont les mêmes pour tous.',
          fullNote: 'Les boutons PIED et SHURIKEN sont dans la disposition Complète (Paramètres → Commandes).',
        },
        help: '<div class="th-grid">' +
          '<div><h3>Joystick</h3><dl>' +
          '<dt><i class="tb">◀ ▶</i></dt><dd>Pose le pouce sur la moitié libre et glisse\u00A0: marcher</dd>' +
          '<dt><i class="tb">▲</i></dt><dd>Pousse vers le haut\u00A0: sauter</dd>' +
          '<dt><i class="tb tb-guard">▼</i></dt><dd>Tire vers le bas\u00A0: garde</dd>' +
          '<dt><i class="tb">▶▶</i></dt><dd>Deux petits coups sur le côté\u00A0: ruée</dd>' +
          '</dl></div>' +
          '<div><h3>Boutons</h3><dl>' +
          '<dt><i class="tb tb-light">ATTAQUE</i></dt><dd>Coupe. Touche encore et encore\u00A0: combo. Maintiens avant ou arrière en touchant\u00A0: autres techniques</dd>' +
          '<dt><i class="tb">LOURD</i></dt><dd>Coupe lourde. Avant + LOURD envoie l’adversaire en l’air</dd>' +
          '<dt><i class="tb tb-guard">GARDE</i></dt><dd>Maintiens\u00A0: garde. Touche juste avant l’impact\u00A0: parade</dd>' +
          '<dt><i class="tb">RUÉE</i></dt><dd>Ruée (dans le sens du stick, sinon en arrière)</dd>' +
          '<dt><i class="tb ki">KI</i></dt><dd>Technique ki\u00A0: le bouton brille quand le ki est plein</dd>' +
          '<dt><i class="tb">PIED</i> <i class="tb">SHUR.</i></dt><dd>Disposition Complète\u00A0: coup de pied et shuriken</dd>' +
          '</dl></div></div>',
        note: 'Tu peux appuyer sur plusieurs boutons à la fois\u00A0: maintiens la garde et attaque, ou glisse le pouce de <i class="tb tb-guard">GARDE</i> à <i class="tb tb-light">ATTAQUE</i>. Le <b>II</b> en haut de l’écran met en pause\u202F; disposition, taille et mode gaucher se trouvent dans les <b>Paramètres</b>. Avec un clavier ou une manette, les commandes basculent dessus automatiquement.',
        keysHelp: '',
      },
      movesTouch: [
        ['<i class="tb">◀ ▶</i>', 'Marcher', 'joystick · deux petits coups\u00A0: ruée'],
        ['<i class="tb">▲</i>', 'Sauter', 'pousse le stick vers le haut'],
        ['<i class="tb tb-light">ATTAQUE</i>×3', 'Triple combo', 'touche encore et encore\u202F; le 3e coup repousse'],
        ['<i class="tb">LOURD</i>', 'Coupe lourde', 'met au sol'],
        ['<i class="tb">PIED</i>', 'Coup de pied', 'force la garde, remplit la posture · disposition Complète'],
        ['<i class="tb">SHUR.</i>', 'Shuriken', 'disposition Complète'],
        ['<i class="tb">RUÉE</i>', 'Ruée', ''],
        ['<i class="tb">RUÉE</i>›<i class="tb tb-light">ATTAQUE</i>', 'Coupe en ruée', ''],
        ['<i class="tb">▲</i>›<i class="tb tb-light">ATTAQUE</i>', 'Coupe aérienne', ''],
        ['<i class="tb">▲</i>›<i class="tb">LOURD</i>', 'Plongeon', 'lourd en l’air'],
        ['<i class="tb tb-guard">GARDE</i>', 'Garde', 'maintiens, ou tire le stick vers le bas'],
        ['<i class="tb tb-guard">GARDE</i>!', 'Parade', 'touche juste avant l’impact'],
        ['<i class="tb tb-light">ATTAQUE</i>', 'Riposte directe', 'après garde/parade'],
        ['Av+<i class="tb tb-light">ATTAQUE</i>', 'Fauchage', 'riposte · aux jambes'],
        ['Arr+<i class="tb tb-light">ATTAQUE</i>', 'Contournement', 'riposte · passe dans son dos'],
        ['<i class="tb">LOURD</i>', 'Riposte lourde', 'riposte · met au sol'],
        ['Échange', 'Échange', 'bloque sa riposte, riposte à ton tour\u202F; ta 3e riposte devient un coup final'],
        ['<i class="tb tb-light">ATTAQUE</i>!!', 'Lames croisées', 'martèle ATTAQUE pendant le blocage pour le repousser'],
      ],
      moveSpecialTouch: '<i class="tb ki">KI</i>',
      moveTags: {
        normal: 'Normal', command: 'Commande', string: 'Enchaînement', launcher: 'Lanceur', juggle: 'Jonglage', air: 'Aérien', dash: 'Ruée',
        strike: 'Frappe', counter: 'Riposte', catch: 'Saisie', feint: 'Feinte', guardCrush: 'Brise-garde', knockdown: 'Mise au sol',
        kiCancel: 'Annulation ki', special: 'Technique ki', throw: 'Projectile',
      },
      lessonsTouch: {
        walk: 'Glisse ton pouce sur la moitié libre de l’écran\u00A0: pousse le joystick à gauche et à droite pour marcher.',
        combo: 'Touche <i class="tb tb-light">ATTAQUE</i> trois fois de suite\u00A0: enchaîne trois coupes et frappe le mannequin.',
        heavy: 'Place une coupe lourde avec <i class="tb">LOURD</i>. Elle est lente, mais elle met au sol.',
        gbreak: 'Le mannequin est en garde. Frappe-le avec <i class="tb">LOURD</i> pour remplir sa barre de posture et briser sa garde (<i class="tb">PIED</i>, dans la disposition Complète, la remplit encore plus vite).',
        block: 'Le mannequin attaque. Maintiens <i class="tb tb-guard">GARDE</i> (ou tire le stick vers le bas) et bloque une coupe.',
        parry: 'Touche <i class="tb tb-guard">GARDE</i> juste avant l’impact. L’instant où l’anneau bleu se resserre est le bon.',
        counter: 'Juste après une garde ou une parade, <i class="tb tb-light">ATTAQUE</i>\u00A0: contre-coupe. Essaie aussi stick avant/arrière + <i class="tb tb-light">ATTAQUE</i> ou <i class="tb">LOURD</i>.',
        special: 'Ta barre de ki est pleine. Lance {sp} avec le bouton <i class="tb ki">KI</i> qui brille.',
      },
      lessons: [
        { id: 'walk', t: 'Marcher', d: 'Avance et recule avec <kbd>A</kbd> / <kbd>D</kbd>.' },
        { id: 'combo', t: 'Triple combo', d: 'Enchaîne trois coupes légères avec <kbd>F</kbd> <kbd>F</kbd> <kbd>F</kbd> et frappe le mannequin.' },
        { id: 'heavy', t: 'Coupe lourde', d: 'Place une coupe lourde avec <kbd>G</kbd>. Elle est lente, mais elle met au sol.' },
        { id: 'gbreak', t: 'Briser la garde', d: 'Le mannequin est en garde. Frappe du pied avec <kbd>R</kbd> pour remplir sa barre de posture et briser sa garde.' },
        { id: 'block', t: 'Garde', d: 'Le mannequin attaque. Maintiens <kbd>S</kbd> pour bloquer une coupe.' },
        { id: 'parry', t: 'Parade', d: 'Appuie sur <kbd>S</kbd> juste avant l’impact. L’instant où l’anneau bleu se resserre est le bon.' },
        { id: 'counter', t: 'Riposte', d: 'Juste après une garde ou une parade, <kbd>F</kbd>\u00A0: contre-coupe. Essaie aussi avant/arrière + <kbd>F</kbd> ou <kbd>G</kbd>.' },
        { id: 'rally', t: 'Échange', d: 'Le mannequin riposte aussi. Attaque-le, bloque sa riposte et riposte à ton tour\u00A0: atteins 2× avec deux de tes propres réponses.' },
        { id: 'special', t: 'Technique ki', d: 'Ta barre de ki est pleine. Lance {sp} avec <kbd>E</kbd>.' },
      ],
    });

    // ================================================================ story, fighters, arenas, specials
    // ---- Fragment B: story text (talk, pairs, endings, roster2 notes), characters, arenas, specials, pop-ups, AI levels, number words
    merge(EN.STR, {
      // open = speaks first (opponent), reply = answers (player), boss = said to the final boss
      talk: {
        akane: {
          open: ['Ma lame est écarlate, mon cœur est pur. Affronte-moi avec honneur.', 'Je salue d’abord, puis je frappe. C’est la moindre des choses.', 'Ce duel se joue pour notre honneur. Pas de retraite.'],
          reply: ['Un adversaire honorable… Tu as mérité ma lame.', 'Des mots tranchants. Voyons si ton acier l’est autant.', 'Quand la lame écarlate parle, les mots se taisent.'],
          boss: 'Mes maîtres sont tombés sous ta lame, Shura. Aujourd’hui, la dette est payée.',
        },
        aoi: {
          open: ['Le vent n’est jamais pressé. Moi non plus.', 'Écoute ton souffle. Le dernier son que tu entendras sera le vent.', 'Le bambou plie mais ne rompt jamais. Et toi\u202F?'],
          reply: ['Calme-toi. La colère alourdit la lame.', 'On n’attrape pas le vent. On le sent, c’est tout.', 'Soit. Nous commencerons quand la feuille touchera le sol.'],
          boss: 'Même l’œil du cyclone est silencieux. En toi, il n’y a que du bruit, Shura.',
        },
        kuro: {
          open: ['La montagne ne bouge pas. Toi, si.', 'Pas de paroles. Lève ton sabre.', 'Tu ne fais pas le poids. Ce sera vite fait.'],
          reply: ['Hmph. Viens, alors.', 'Tu parles trop.', 'Mon nodachi est long. Ma patience est courte.'],
          boss: 'Shura. J’ai longtemps attendu. Assez parlé.',
        },
        yuki: {
          open: ['La neige tombe en silence. Mes coups aussi.', 'Le renard ne tombe pas dans les pièges. Il les tend.', 'Froid\u202F? Bientôt, tu ne sentiras plus rien.'],
          reply: ['Tu as le sang chaud. Ça te ralentit.', 'Tant de bruit… Même la neige a honte pour toi.', 'Ne cligne pas des yeux. Tu le raterais.'],
          boss: 'Tout le monde te craint, Shura. Moi, j’ai juste un peu froid.',
        },
        hana: {
          open: ['On danse\u202F? Mais c’est moi qui mène\u202F!', 'On aura fini avant que les fleurs de cerisier touchent le sol, promis\u202F!', 'Deux tantō, un sourire. Lequel te fait le plus peur\u202F?'],
          reply: ['Oh, si sérieux\u202F! Souris un peu, tu tomberas plus joliment.', 'Attrape-moi si tu peux\u202F!', 'D’accord, d’accord\u202F! Mais pas de larmes après.'],
          boss: 'Tu ne ris donc jamais, Shura\u202F? Allez, faisons-en notre dernière danse\u202F!',
        },
        tetsu: {
          open: ['Le devoir m’a mené ici. Écarte-toi ou tombe.', 'Mon armure a vu cent batailles. Tu es la cent unième.', 'La discipline passe avant le courage. Permets-moi de te le montrer.'],
          reply: ['Quelle insolence. Je vais la corriger.', 'Tes mots ne percent pas mon armure.', 'Prépare-toi. Ma naginata ne prévient pas.'],
          boss: 'Tu as brûlé le château de mon seigneur, Shura. Aujourd’hui, j’accomplis mon devoir.',
        },
        ren: {
          open: ['Hah\u202F! Enfin un peu d’amusement\u202F! T’as les os solides\u202F?', 'Le masque t’a fait peur\u202F? Crois-moi, tu veux pas voir ma vraie tête\u202F!', 'Des crânes ou des gardes\u202F? Je brise les deux\u202F!'],
          reply: ['Que du vent, pas de combat\u202F! Allez, viens\u202F!', 'Heh, tu me plais. Je vais quand même te rosser.', 'T’as déjà vu mon coup de pied\u202F? Tu vas le voir\u202F!'],
          boss: 'Alors c’est toi, le vrai oni, hein\u202F? Voyons qui a les cornes les plus dures\u202F!',
        },
        kage: {
          open: ['Tu crois me voir. Tu ne vois que mon ombre.', 'Plus la lumière est vive, plus l’ombre est profonde.', 'Ton nom est déjà écrit. Je ne fais que le lire.'],
          reply: ['Tais-toi. Les ombres écoutent.', 'Ne regarde pas derrière toi. J’y suis déjà.', 'Tu fais trop de bruit. Le silence frappe plus vite.'],
          boss: 'Les ombres ne servent aucun maître, Shura. Elles t’engloutiront, toi aussi.',
        },
        shura: {
          open: ['Tu as brisé sept lames. La huitième est la mienne, et c’est elle qui te brisera.', 'Ton esprit m’a appelé. Tant mieux si tu as grimpé si haut\u00A0: ta chute n’en sera que plus belle.', 'Je suis la fin du chemin. À genoux.'],
          reply: ['La faiblesse. Je la sens d’ici.', 'Tu n’es qu’une marche.', 'À genoux, ou tombe.'],
          boss: 'Le démon dans le miroir… L’un de nous est de trop.',
        },
        tora: {
          open: ['J’ai perdu le compte de ceux qui ont pendu au bout de ma chaîne. Tu seras la prochaine proie.', 'La chasse est ouverte. Fuis si tu veux, ma chaîne est longue.', 'On dit que le tigre attend en embuscade. Pas celui-ci\u202F!'],
          reply: ['Grrr… Bien. J’aime les proies qui ne fuient pas.', 'Inutile d’approcher. Je vais te ramener à moi.', 'Tes mots sont longs. Ma chaîne l’est plus encore.'],
          boss: 'Toi aussi, tu n’es qu’une proie, Shura. Juste un peu plus grosse.',
        },
        jin: {
          open: ['Je ne suis pas venu verser le sang. Je vais seulement t’allonger un moment.', 'Le bâton parle avec patience. Écoute.', 'Ta route est pleine de colère, jeune guerrier. Allégeons ton fardeau.'],
          reply: ['Soit. Mais après, nous partagerons le thé.', 'Ta colère te pèse. Laisse-moi la porter.', 'Le sabre tranche\u202F; le bâton éveille.'],
          boss: 'Shura, je n’ai pas besoin de te détruire pour vaincre le démon en toi. T’arrêter suffit.',
        },
        mai: {
          open: ['La scène est prête, le rideau est levé. Ton rôle\u00A0: celui qui perd.', 'Quand mon éventail s’ouvre, ne ferme pas les yeux. Tu manquerais le spectacle.', 'Chacun de mes pas est une note. Sauras-tu tenir le tempo\u202F?'],
          reply: ['Quelle entrée grossière. Peu importe, j’ai de la grâce pour deux.', 'Le vent souffle de mon côté, mon ange.', 'Je n’ai pas besoin d’applaudissements. Ta chute suffit.'],
          boss: 'Shura, pour cette dernière danse, je ne partage la scène avec personne.',
        },
        tsubame: {
          open: ['La distance entre nous est mon arme.', 'L’hirondelle manque une fois. La seconde, elle vire et frappe.', 'J’ai mesuré le vent. Ma flèche connaît son chemin.'],
          reply: ['Tu veux t’approcher\u202F? Essaie.', 'Retiens ton souffle. Une flèche en vol ne fait aucun bruit.', 'Mon œil est sur toi. Ma flèche aussi.'],
          boss: 'Shura, on ne se cache pas dans le ciel. Ma flèche te trouvera.',
        },
      },
      // Special match-ups: lines are spoken in the order written
      pairs: {
        'akane|aoi': [['akane', 'Aoi\u202F! Il est temps de finir le duel que nous avons laissé en suspens.'], ['aoi', 'Le vent souffle toujours vers le même feu, Akane. Commence.']],
        'kuro|tetsu': [['kuro', 'Carapace de fer. Voyons si elle est creuse.'], ['tetsu', 'Même une montagne s’incline devant la discipline, Kuro.']],
        'hana|yuki': [['yuki', 'Les fleurs fanent dans la neige, Hana.'], ['hana', 'Alors je ferai fondre la neige, Yuki\u202F!']],
        'kage|ren': [['ren', 'Tes tours d’ombre marchent pas sur moi\u202F! Montre-toi\u202F!'], ['kage', 'Je suis juste là, oni. Tu ne sais simplement pas regarder.']],
        'akane|ren': [['akane', 'Seuls les sans-honneur se cachent derrière un masque.'], ['ren', 'L’honneur\u202F? L’honneur, ça remplit pas le ventre\u202F!']],
        'aoi|yuki': [['aoi', 'Un vent froid reste du vent, Yuki.'], ['yuki', 'Mais la neige demeure quand le vent retombe.']],
        'kuro|tora': [['tora', 'Une montagne, hein\u202F? Les tigres aussi vivent dans les montagnes.'], ['kuro', 'Les tigres meurent dans les montagnes.']],
        'tora|yuki': [['tora', 'Un renard\u202F! Que fait un renard face à un tigre\u202F?'], ['yuki', 'Il fuit. Puis il gèle la queue du tigre.']],
        'jin|tora': [['tora', 'Tu feras quoi quand ma chaîne s’enroulera autour de ton bâton, moine\u202F?'], ['jin', 'Je la dénouerai. Défaire les nœuds, c’est ma vocation.']],
        'jin|ren': [['ren', 'Un moine\u202F? Commence à prier, le chauve\u202F!'], ['jin', 'C’est déjà fait, oni. Pour toi. Le feu en toi te brûle aussi.']],
        'jin|tetsu': [['tetsu', 'Qu’est-ce qu’un moine vient faire sur un champ de bataille\u202F?'], ['jin', 'Je suis venu pour les cœurs cuirassés comme le tien, Tetsu. Ton armure est lourde\u202F; ton cœur, plus lourd encore.']],
        'akane|jin': [['akane', 'Écarte-toi, moine. Cette vengeance m’appartient.'], ['jin', 'La vengeance est une chaîne, Akane. Brisons-la d’abord.']],
        'hana|mai': [['hana', 'Oh, une autre danseuse\u202F! Voyons qui tourne le plus vite\u202F!'], ['mai', 'La vitesse n’est que l’ombre de la grâce, Hana. Laisse-moi te montrer la lumière.']],
        'kage|mai': [['mai', 'Les ombres dansent-elles aussi, Kage\u202F?'], ['kage', 'Seulement quand la lumière s’éteint.']],
        'aoi|tsubame': [['tsubame', 'Ton vent peut-il dévier ma flèche, Aoi\u202F?'], ['aoi', 'Le vent ne prend le parti de personne, Tsubame. Pas même de ta flèche.']],
        'kage|tsubame': [['kage', 'On ne touche pas ce qu’on ne voit pas, archère.'], ['tsubame', 'Les ombres viennent avec la lumière. Moi aussi.']],
        'mai|tsubame': [['mai', 'Fixer les gens de loin est impoli, archère. Viens donc regarder de près.'], ['tsubame', 'J’enverrai ma flèche voir ta scène de plus près.']],
      },
      endings: {
        akane: ['Quand le sabre de Shura heurta la terre, les cloches du temple sonnèrent d’elles-mêmes.', 'Akane essuya la lame écarlate et s’inclina sur la tombe de ses maîtres\u00A0: la dette était payée.', 'Le chemin qui s’ouvre n’est plus celui de la vengeance, mais celui de l’honneur transmis aux nouveaux apprentis.'],
        aoi: ['Quand Shura tomba, la tempête se tut\u202F; pour la première fois depuis des années, les nuages s’écartèrent.', 'Aoi rengaina sa lame et retourna dans la forêt de bambous.', 'Il ne resta qu’un vent qui sifflait.'],
        kuro: ['Kuro enterra le masque brisé de Shura au sommet de la montagne.', 'Pas un mot ne fut prononcé. Kuro abaissa son chapeau de paille et disparut dans la neige.', 'Les villageois disent que pas un bandit ne descendit de la montagne cet hiver-là.'],
        yuki: ['Le dernier souffle de Shura se changea en brume dans l’air froid, puis s’évanouit.', 'Yuki ajusta son écharpe et s’éloigna sans laisser de traces dans la neige.', 'Depuis ce jour, on n’aperçoit plus sur le sommet que l’ombre d’un renard.'],
        hana: ['Quand le masque de Shura toucha le sol, Hana déposa une branche de cerisier à côté.', 'Cette nuit-là, le marché s’emplit de lanternes\u202F; les plus fortes acclamations allèrent à une kunoichi qui dansait sur les toits.', 'Nul ne sait où Hana est partie. Il ne reste que des pétales roses emportés par le vent.'],
        tetsu: ['Sur le toit du château, Tetsu brisa le sabre de Shura en deux sur son genou.', 'La bannière du seigneur fut hissée de nouveau, et le vent la fit claquer avec fierté.', 'Le devoir est accompli. Mais le devoir d’un samouraï ne finit jamais.'],
        ren: ['Ren accrocha le masque brisé de Shura à côté de l’autre masque d’oni. Deux oni, un seul vainqueur.', 'Le village chanta cette nuit-là\u202F; le rire le plus sonore, comme toujours, fut celui de Ren.', 'Au matin, Ren était déjà sur la route. Direction la prochaine bagarre.'],
        kage: ['Quand Shura tomba, l’ombre de Kage recouvrit en silence le démon abattu.', 'Ni trace, ni bruit\u202F; seulement une ombre de plus, étirée sous la lune.', 'Peut-être était-elle là depuis toujours. Peut-être n’a-t-elle jamais existé.'],
        shura: ['Sur le toit du château, un seul resta debout\u00A0: celui qui portait le même masque, en plus sombre.', 'Shura ne cherche plus de rivaux. Ce sont les rivaux qui cherchent Shura.'],
        def: ['Le dernier maître est tombé. La voie des ombres est à toi désormais.', 'Rengaine ta lame\u202F; la légende commence maintenant.'],
        tora: ['Le cliquetis d’une chaîne annonça la chute de Shura.', 'Tora suspendit le masque brisé à sa chaîne\u00A0: un nouveau trophée de chasse.', 'Depuis ce jour, plus personne dans la forêt ne prit le rugissement du tigre pour un conte.'],
        jin: ['Jin s’agenouilla près de Shura tombé et pria.', 'Sur le chemin du temple, pas une goutte de sang ne tachait le bâton.', 'Cette nuit-là, les cloches de la montagne sonnèrent de nouveau\u202F; non plus pour un deuil, mais pour la paix.'],
        mai: ['Tandis que Shura tombait, Mai referma son éventail d’un coup sec et s’inclina.', 'Le marché de nuit parle encore de cette danse.', 'Le rideau tomba. Mais Mai ne quitta jamais la scène.'],
        tsubame: ['La dernière flèche vibrait en silence, fichée dans le toit du château.', 'Tsubame mit son arc à l’épaule et regarda les hirondelles partir vers le sud.', 'On ne la revit jamais\u202F; il ne resta que des flèches aux plumes vives, plantées dans leurs cibles.'],
      },
      roster2: {
        notes: {
          tora: ['Léger\u00A0: fouet de chaîne à mi-distance, faucille au corps à corps', 'Lourd\u00A0: lance la chaîne\u202F; si elle touche, elle attire l’adversaire', 'Fin d’enchaînement\u00A0: si l’adversaire est loin, la chaîne le ramène'],
          jin: ['Les deux bouts du bâton frappent\u202F; les coups sont contondants et ne font jamais couler le sang', 'Le 3e coup et le fauchage lourd mettent au sol', 'La posture se remplit plus lentement en garde'],
          mai: ['Fenêtre de parade plus large', 'En garde, les éventails renvoient les projectiles', 'Lourd\u00A0: une vague de vent repousse l’adversaire et disperse les projectiles'],
          tsubame: ['Lourd\u00A0: tire une flèche à l’arc\u202F; maintiens pour un tir chargé', 'Lancer\u00A0: salto arrière et flèche décochée en l’air', 'Sans flèches, l’attaque lourde passe au tantō\u202F; les flèches se rechargent avec le temps'],
        },
      },
    });

    merge(EN.CHARS, {
      akane: { title: 'Lame écarlate', desc: 'Katana équilibré. Combo rapide en trois coups, parade solide.', weapon: 'Katana' },
      aoi: { title: 'Vent bleu', desc: 'Katana agile. Marche un peu plus vite, et sa ruée file comme le vent.', weapon: 'Katana' },
      kuro: { title: 'Montagne noire', desc: 'Manie un long nodachi. Coups lents, mais grande allonge et frappe dévastatrice.', weapon: 'Nodachi' },
      yuki: { title: 'Renard des neiges', desc: 'Frappe très vite avec un court kodachi. Shuriken à foison, longue écharpe.', weapon: 'Kodachi' },
      hana: { title: 'Danse du cerisier', desc: 'Kunoichi. Se bat avec deux tantō comme on danse\u202F; les mains les plus rapides, l’allonge la plus courte.', weapon: 'Tantō jumeaux' },
      tetsu: { title: 'Forteresse de fer', desc: 'Samouraï en armure. La naginata offre la plus longue allonge\u202F; les coups l’entament à peine.', weapon: 'Naginata' },
      ren: { title: 'Oni écarlate', desc: 'Bagarreur au masque d’oni. Terrifie par ses coups brise-garde et ses coups de pied dévastateurs.', weapon: 'Uchigatana' },
      kage: { title: 'L’Ombre même', desc: 'Ombre encapuchonnée. Rapide au ninjatō, longue ruée\u202F; laisse une ombre partout où elle passe.', weapon: 'Ninjatō' },
      tora: { title: 'Tigre enchaîné', desc: 'As du kusarigama. Fouette la chaîne lestée à mi-distance\u202F; l’attaque lourde ramène l’adversaire vers la faucille.', weapon: 'Kusarigama' },
      jin: { title: 'Moine au bâton de fer', desc: 'Moine armé d’un bō. Un long bâton qui frappe des deux bouts, une garde solide et des coups contondants qui mettent au sol\u202F; ne verse jamais le sang, fait juste craquer les os.', weapon: 'Bō' },
      mai: { title: 'Danseuse aux éventails', desc: 'Kunoichi aux éventails de guerre. Très rapide, large fenêtre de parade\u202F; les éventails renvoient les projectiles et leur vent repousse l’adversaire.', weapon: 'Tessen jumeaux' },
      tsubame: { title: 'Archère hirondelle', desc: 'Porte un arc et un tantō. Tire de loin (maintiens lourd pour un tir puissant) et s’échappe en salto arrière dès qu’on l’approche, en tirant depuis les airs.', weapon: 'Yumi + Tantō' },
      shura: { title: 'Le Maître écarlate', desc: 'Un maître démoniaque au chemin tracé en écarlate. Long nodachi, coups écrasants, parades presque parfaites.', weapon: 'Nodachi' },
    });

    merge(EN.ARENAS, {
      temple: 'Temple sous la lune',
      rain: 'Bambous sous l’orage',
      snow: 'Pic enneigé',
      village: 'Village en flammes',
      market: 'Marché de nuit',
      waterfall: 'Cascade',
      castle: 'Toits du château',
    });

    merge(EN.SPECIALS, {
      akane: { desc: 'Une coupe iai écarlate qui traverse l’adversaire en un clin d’œil, laissant un croissant ardent dans l’air.', tip: 'Pare, ou file de côté en ruée' },
      aoi: { desc: 'Un large revers qui projette une lame de vent vers l’avant\u202F; une garde au moment parfait la renvoie.', tip: 'Saute, tranche-la de ta lame, ou garde au moment parfait' },
      kuro: { desc: 'Bondit et fend la terre de son nodachi\u202F; l’onde de choc qui court au sol écrase les gardes et met à terre.', tip: 'Saute par-dessus l’onde et frappe en l’air' },
      yuki: { desc: 'Une rafale fulgurante de cinq coups, comme un blizzard\u202F; le dernier met au sol.', tip: 'Garde, et pare le premier coup' },
      hana: { desc: 'Fonce en tournoyant dans un tourbillon de fleurs de cerisier, les tantō jumeaux tranchant des deux côtés.', tip: 'Garde, ou recule en ruée' },
      tetsu: { desc: 'Fait tournoyer la naginata tout autour\u202F; les coups n’arrêtent pas la rotation (super armure).', tip: 'Sors de portée, ou pare' },
      ren: { desc: 'Une charge d’épaule qui brise les gardes, suivie d’une coupe montante qui envoie l’adversaire en l’air.', tip: 'La garde ne sert à rien\u00A0: pare, saute ou file en ruée' },
      kage: { desc: 'Disparaît dans la fumée, laisse un clone d’ombre et réapparaît dans le dos de l’adversaire pour frapper.', tip: 'Garde dès que Kage réapparaît' },
      tora: { desc: 'Fait tournoyer la chaîne au-dessus de sa tête en un cyclone qui fauche tout alentour\u202F; l’adversaire pris est ramené puis projeté vers le ciel par la faucille.', tip: 'Sors de portée ou garde\u00A0: si tu n’es pas pris, la traction revient à vide' },
      jin: { desc: 'Avance en faisant tourner le bâton comme une roue de diamant\u202F; après quatre coups, une frappe montante envoie l’adversaire en l’air.', tip: 'Recule en ruée, ou pare le premier coup' },
      mai: { desc: 'Fait naître un tourbillon qui dérive vers l’avant, aspire l’adversaire, le taillade et finit par le projeter vers le ciel.', tip: 'Bloque le tourbillon au moment parfait ou recule\u00A0: il avance lentement' },
      tsubame: { desc: 'Bondit en arrière et fait pleuvoir des flèches du ciel\u202F; si elle rate, elle décoche une flèche-hirondelle qui fait demi-tour et frappe dans le dos.', tip: 'Quitte les marques au sol\u202F; la flèche-hirondelle revient, surveille tes arrières' },
      shura: { desc: 'Rugit et se fond dans une fumée écarlate, surgit devant puis derrière l’adversaire pour abattre trois lourdes coupes de nodachi\u202F; la dernière projette en l’air.', tip: 'Guette l’éclat écarlate\u00A0: parer une coupe met fin à la technique\u202F; la garde, elle, écrase ta posture' },
    });

    merge(EN.TXT, {
      gbreak: 'POSTURE BRISÉE\u202F!', cut: 'COUPÉ\u202F!', reflect: 'RENVOYÉ\u202F!', parry: 'PARADE\u202F!', caught: 'SAISI\u202F!',
      swallowHit: '燕!', vajraHit: '金剛!', whirlHit: '旋風の舞',
    });

    merge(EN.AI_LEVELS, { 0: 'Apprenti', 1: 'Maître', 2: 'Légende', 3: 'Shura' });

    EN.NUMWORDS = ['Zéro', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf', 'Dix', 'Onze', 'Douze'];

    // ================================================================ static HTML, hardcoded literals, canvas pop-ups
    merge(EN.PHRASES, {
      // ---------------------------------------------------------------- index.html: <title>, brand, HUD
      'Gölge Düellosu': 'Shadow Duel',
      'Duraklat': 'Pause',
      'KARŞILIKLI SERİ': 'ÉCHANGE',
      'SON DARBE': 'COUP FATAL',
      'atlamak için bir tuşa bas': 'appuie sur une touche pour passer',
      // touch buttons (static fallbacks of data-s="touch.btn.*")
      'GARD': 'GARDE',
      'HAFİF': 'LÉGER',
      'SALDIR': 'ATTAQUE',
      'AĞIR': 'LOURD',
      'ATIL': 'RUÉE',
      'TEKME': 'PIED',
      // ---------------------------------------------------------------- main menu
      'Sekiz savaşçı, üç arena. Gerçek zamanlı kılıç çarpışması, kılıç kilitlenmesi, savuşturma, denge kırma, Gölge Kesiği ve ragdoll fiziği.': 'Huit combattants, trois arènes. Duels de sabres en temps réel, lames croisées, parades, postures brisées, la Coupe de l’ombre et la physique ragdoll.',
      'İki Oyuncu': 'Deux joueurs',
      'Aynı klavyede ya da iki gamepad ile kafa kafaya': 'Face à face sur un clavier ou avec deux manettes',
      'CPU\'ya Karşı': 'Contre l’IA',
      'Ninjanı seç, rakibini yapay zekâ yönetsin': 'Choisis ton ninja, l’IA mène ton rival',
      'Zorluk': 'Difficulté',
      'Çırak': 'Apprenti',
      'Usta': 'Maître',
      'Efsane': 'Légende',
      'Aylık Turnuva': 'Tournoi du mois',
      'Dan Sınavı': 'Épreuve Dan',
      'Şampiyonlar Salonu': 'Salle des champions',
      'Seyret': 'Regarder',
      'Rastgele iki ninja, Efsane yapay zekâ': 'Deux ninjas au hasard, IA Légende',
      'Ses': 'Son',
      'Müzik': 'Musique',
      'Kan efekti': 'Sang',
      'Tuş ipuçları': 'Aide des touches',
      'Yüksek grafik': 'Graphismes élevés',
      // ---------------------------------------------------------------- controls card
      'Kontroller': 'Commandes',
      '1. Oyuncu': 'Joueur 1',
      '2. Oyuncu': 'Joueur 2',
      'Yürü': 'Marcher',
      'Zıpla': 'Sauter',
      'Gard (basılı tut)': 'Garde (maintenir)',
      'Hafif kesik (×3 kombo)': 'Coupe légère (combo ×3)',
      'Ağır kesik': 'Coupe lourde',
      'Tekme': 'Coup de pied',
      'Sol Shift': 'Shift gauche',
      'Sağ Shift': 'Shift droit',
      'Atılma': 'Ruée',
      'Ki tekniği (ki dolu)': 'Technique ki (ki plein)',
      // ---------------------------------------------------------------- select screen
      'Ninjanı seç': 'Choisis ton ninja',
      'Hazır': 'Prêt',
      '1. oyuncunun ninjası': 'Ninja du joueur 1',
      '2. oyuncunun ninjası': 'Ninja du joueur 2',
      'Önceki ninja': 'Ninja précédent',
      'Sonraki ninja': 'Ninja suivant',
      '1. oyuncu kadrosu': 'Ninjas du joueur 1',
      '2. oyuncu kadrosu': 'Ninjas du joueur 2',
      'Dövüşe başla': 'Combattre',
      'Geri': 'Retour',
      'Kilitli': 'Verrouillé',
      'Rastgele': 'Aléatoire',
      'Hız': 'Vitesse',
      'Güç': 'Puissance',
      'Menzil': 'Allonge',
      'Can': 'Vie',
      // ---------------------------------------------------------------- pause / end
      'Duraklatıldı': 'Pause',
      'Devam et': 'Reprendre',
      'Maçı yeniden başlat': 'Recommencer le match',
      'Ana menü': 'Menu principal',
      'Rövanş': 'Revanche',
      'Karakter değiştir': 'Changer de ninja',
      'Zafer senin': 'La victoire est tienne',
      'Raund': 'Rounds',
      'Verilen hasar': 'Dégâts infligés',
      'Savuşturma': 'Parades',
      'Ki Saldırısı': 'Attaques ki',
      // ---------------------------------------------------------------- training / leaderboard / misc
      'Antrenman': 'Entraînement',
      'ANTRENMAN': 'ENTRAÎNEMENT',
      'Sıralama': 'Classement',
      'Tümü': 'Tous',
      'Ekranı yan çevir': 'Tourne ton écran',
      'Performans için grafik düşürüldü': 'Graphismes réduits pour la fluidité',
      // hidden boss pushed into ND.CHARS by arcade.js (safety net; FR.CHARS.shura should carry the same)
      'Kanlı Usta': 'Le Maître sanglant',
      'Yolunu kanla çizen iblis usta. Uzun nodachi, yıkıcı darbeler, neredeyse kusursuz savuşturma.': 'Un maître démoniaque qui trace sa route dans le sang. Long nodachi, coups écrasants, parades presque parfaites.',
      // ---------------------------------------------------------------- HUD tags (fallbacks when STR.hud is missing)
      'SEN': 'TOI',
      'KUKLA': 'MANNEQUIN',
      // ---------------------------------------------------------------- round banners (#bt / #bs)
      'Son raund': 'Dernier round',
      'Kazanan her şeyi alır': 'Le vainqueur rafle tout',
      'İlk iki raundu alan kazanır': 'Deux rounds gagnants',
      'Dövüş!': 'En garde\u202F!',
      'Süre doldu': 'Temps écoulé',
      'Berabere': 'Égalité',
      'Çifte K.O.': 'Double K.O.',
      'Mükemmel': 'Parfait',
      // blade-lock hint (fallbacks of STR.hud.lockSolo / lockDuo)
      'F / K tuşuna hızlıca bas!': 'Martèle F / K\u202F!',
      'Hafif ya da ağır tuşuna hızlıca bas!': 'Martèle léger ou lourd\u202F!',
      // counter / parry prompt labels under the key ring (ctx.fillText in drawPrompts)
      'KARŞILIK': 'RIPOSTE',
      'SAVUŞTUR': 'PARADE',
      // ---------------------------------------------------------------- canvas pop-ups (fx.text)
      'SON VURUŞ!': 'COUP FINAL\u202F!',
      'KİLİTLENDİ!': 'LAMES CROISÉES\u202F!',
      'İTTİ!': 'REPOUSSÉ\u202F!',
      'DENGE KIRILDI!': 'POSTURE BRISÉE\u202F!',
      'GARD KIRILDI!': 'GARDE BRISÉE\u202F!',
      'KESİLDİ!': 'TRANCHÉ\u202F!',
      'YANSITMA!': 'RENVOI\u202F!',
      'SAVUŞTURMA!': 'PARADE\u202F!',
      'YAKALANDI!': 'SAISI\u202F!',
      'ZIRH!': 'ARMURE\u202F!',
      'ARKADAN!': 'DANS LE DOS\u202F!',
      'DUVAR!': 'MUR\u202F!',
      'KAFA!': 'À LA TÊTE\u202F!',
      'KARŞI!': 'CONTRE\u202F!',
      'KRİTİK!': 'CRITIQUE\u202F!',
      'SÜPÜRME!': 'FAUCHAGE\u202F!',
      'KARŞILIK!': 'RIPOSTE\u202F!',
      'YERE SERİLDİ': 'AU SOL',
      'ÇARPIŞMA!': 'CHOC\u202F!',
    });

    merge(EN.HTML, {
      // brand title (the game's name stays "Shadow Duel")
      'Gölge<br><em>Düel</em><em>losu</em>': 'Shadow<br><em>Du</em><em>el</em>',
      // tips list (<ul class="tips">)
      '<b>Savuşturma:</b> darbe gelmeden hemen önce gard tuşuna bas; rakip sendeler.':
        '<b>Parade\u00A0:</b> appuie sur garde juste avant l’impact\u202F; ton adversaire vacille.',
      '<b>Karşılık (返し技):</b> gard ya da savuşturmanın hemen ardından saldırı tuşu → anında karşı kesik. <b>İleri</b> + hafif = bacağa süpürme, <b>geri</b> + hafif = yanından dönüp arkadan kesme, <b>ağır</b> = güçlü karşı darbe.':
        '<b>Riposte (返し技)\u00A0:</b> attaque juste après une garde ou une parade → contre-coupe immédiate. <b>Avant</b> + léger = fauchage aux jambes, <b>arrière</b> + léger = contournement et coupe dans le dos, <b>lourd</b> = riposte puissante.',
      '<b>Karşılıklı seri:</b> karşılık da karşılanabilir. Her turda vuruşlar hızlanır ve güçlenir; kendi 3. karşılığın üç vuruşluk sinematik bir bitirişe dönüşür. Seriyi kıran darbe ağır çekimde iner.':
        '<b>Échange\u00A0:</b> on peut riposter à une riposte. À chaque passe, les coups gagnent en vitesse et en force\u202F; ta 3e riposte devient un coup final cinématique en trois temps. Le coup qui brise l’échange tombe au ralenti.',
      '<b>Kılıç kilidi:</b> kılıçlar çarpışınca kilitlenebilir. Hafif/ağır tuşuna hızlı basan rakibini iter.':
        '<b>Lames croisées\u00A0:</b> les lames qui s’entrechoquent peuvent se bloquer. Qui martèle léger/lourd le plus vite repousse l’autre.',
      '<b>Ki barı</b> vurdukça, yedikçe ve savuşturdukça dolar. Dolunca her ninjanın kendine özgü ki tekniği açılır (Antrenman’daki hareket listesinde görebilirsin).':
        'La <b>barre de ki</b> se remplit quand tu frappes, encaisses et pares. Pleine, elle libère la technique ki propre à chaque ninja (voir la liste des coups en Entraînement).',
      '<b>Atılma + hafif</b> = atılarak kesik. <b>Havada</b> hafif = hava kesiği, ağır = dalış. Ağır kesik yere serer, duvara çarpan geri seker.':
        '<b>Ruée + léger</b> = coupe en ruée. <b>En l’air</b>, léger = coupe aérienne, lourd = plongeon. La coupe lourde met au sol\u202F; qui heurte un mur rebondit.',
      '<b>Denge çubuğu</b> dolarsa gard kırılır. Tekme gardı delip dengeyi hızla doldurur.':
        'Quand la <b>barre de posture</b> est pleine, la garde cède. Les coups de pied traversent la garde et remplissent vite la posture.',
      // gamepad note (Esc -> Start or P)
      'Gamepad: X hafif · Y ağır · B tekme · A zıpla · LB gard · RB shuriken · RT atılma · R3 ki tekniği. Start ya da <kbd>P</kbd> duraklatır. CPU modunda her iki tuş seti de seni yönetir.':
        'Manette\u00A0: X léger · Y lourd · B coup de pied · A saut · LB garde · RB shuriken · RT ruée · R3 technique ki. Start ou <kbd>P</kbd> met en pause. Contre l’IA, les deux jeux de touches te contrôlent.',
      // select / VS hints (Esc -> ⌫)
      '<kbd>Enter</kbd> başlatır · <kbd>⌫</kbd> menüye döner': '<kbd>Enter</kbd> lancer · <kbd>⌫</kbd> retour',
      '<kbd>Enter</kbd> / <kbd>F</kbd> başlatır · <kbd>⌫</kbd> çıkar': '<kbd>Enter</kbd> / <kbd>F</kbd> lancer · <kbd>⌫</kbd> quitter',
    });

    EN.PATTERNS.push(
      // HUD round label (#rlabel) and round banner
      [/^RAUND (\d+)$/, 'ROUND $1'],
      [/^(\d+)\. Raund$/, 'Round $1'],
      // canvas pop-ups built from numbers
      [/^(\d+)\. KARŞILIK$/, 'RIPOSTE ×$1'],
      [/^(\d+) VURUŞLUK SERİ!$/, 'ÉCHANGE ×$1\u202F!'],
      // time-up banner sub: `${name} önde`
      [/^(.+) önde$/, (m, n) => I.t(n) + ' mène'],
      // end screen title: `${Name} kazandı`
      [/^(.+) kazandı$/, (m, n) => I.t(n) + ' l’emporte'],
      // end screen sub line: `${a} – ${b} · ${round} raund · ${arenaName}`
      [/^(\d+) – (\d+) · (\d+) raund · (.+)$/, (m, a, b, r, ar) => `${a} – ${b} · ${r} ${Number(r) <= 1 ? 'round' : 'rounds'} · ${I.t(ar)}`],
    );

    // ================================================================ added with the portal build (PLAY, ads, coach)
    merge(EN.STR, {
      menu: { play: 'Jouer', playSub: (name, lv) => `${name} contre l’IA · ${lv}` },
      first: { play: 'Jouer', sub: 'Une touche et tu es au combat', menu: 'Tous les modes' },
      ads: {
        cont: 'Reprendre d’ici', contSub: 'Regarde une pub · réessaie sans pénalité',
        trial: (name) => `Essaie ${name} le temps d’un combat`, trialSub: 'Regarde une pub',
        fail: 'Pas de pub pour l’instant, réessaie dans un moment',
      },
      coach: {
        attack: (l) => `${l} pour attaquer`,
        guard: (l, g) => `Maintiens ${g}\u00A0: garde`,
        parry: (l, g) => `Appuie sur ${g} juste avant l’impact\u00A0: parade`,
        attackT: (l) => `Touche ${l} · continue\u00A0: combo`,
        guardT: (l, g) => `Maintiens ${g}\u00A0: garde`,
        parryT: (l, g) => `Touche ${g} juste avant l’impact\u00A0: parade`,
      },
    });

    // ================================================================ VOLUME: sliders on the menu card and in pause (js/volume.js)
    merge(EN.STR, {
      vol: {
        title: 'Volume', master: 'Général', music: 'Musique', sfx: 'Effets', sound: 'Son',
        pct: (n) => `${n}\u00A0%`,
        muted: 'Le son est coupé. Bouge un curseur pour le rallumer.',
        // Settings > Audio: character / announcer voices switch (js/voice.js) and the courtesy credit under it
        voice: 'Voix',
        credit: 'Voix: ユーフルカ (youfulca.com) · 効果音ラボ · すぱらんど',
      },
    });

    // ================================================================ TOUCH LAYOUT EDITOR: movement modes + "Customize controls"
    // (js/touch.js settings rows, js/touch-editor.js; Turkish source in i18n.js, block "touch movement modes + layout editor")
    merge(EN.STR, {
      tedit: {
        move: 'Déplacement',
        moves: { float: 'Stick', fixed: 'Stick fixe', dpad: 'Croix' },
        mnote: {
          float: 'Le stick apparaît là où se pose ton pouce.',
          fixed: 'Le stick reste où tu l’as placé\u202F; pousse depuis son centre.',
          dpad: 'Boutons séparés\u00A0: maintiens pour marcher, double touche pour la ruée. Appuie entre deux boutons pour les deux à la fois (▶ + ▲ = saut avant).',
          dtap: 'Boutons séparés\u00A0: une touche brève sur ◀ ▶ fait un petit pas, maintiens pour marcher, double touche pour la ruée.',
        },
        dtap: 'Touche\u00A0: un pas',
        edit: 'Personnaliser les commandes',
        title: 'Personnaliser les commandes',
        hint: 'Glisse un bouton où tu veux. Touche-le pour sa taille, son opacité ou pour le masquer.',
        rotate: 'Tourne ton écran pour placer les commandes de combat.',
        shapes: { phone: 'Téléphone', tablet: 'Tablette', portrait: 'Vertical' },
        screenNote: 'La disposition est enregistrée pour ce format d’écran\u00A0: téléphone et tablette ont chacun la leur.',
        save: 'Enregistrer', cancel: 'Annuler', options: 'Options', done: 'OK', close: 'Fermer',
        size: 'Taille', sizes: { s: 'P', m: 'M', l: 'G', xl: 'TG' },
        opacity: 'Opacité', opacityAll: 'Opacité (tous)',
        hide: 'Masquer', show: 'Afficher', hidden: 'Masqué',
        snap: 'Aligner sur la grille',
        presets: 'Préréglages', pRight: 'Main droite', pLeft: 'Main gauche', pSplit: 'Garde à gauche',
        reset: 'Par défaut', resetDone: 'Disposition par défaut rétablie (appliquée à l’enregistrement).',
        overlap: 'Les boutons ne peuvent pas se chevaucher\u00A0: placé sur l’espace libre le plus proche.',
        noRoom: 'Pas de place ici\u00A0: le bouton est revenu.',
        saved: 'Commandes enregistrées',
        throwName: 'SHURIKEN',
        pauseName: 'Pause',
        dirs: { dl: '◀ Gauche', dr: 'Droite ▶', du: '▲ Saut', dd: '▼ Garde' },
      },
    });

    // ================================================================ PROGRESSION: honor, rival challenges, moves panel
    // (arcade.js STR.honor / STR.rival / STR.hint, game.js select screen; rules in js/honor.js)
    merge(EN.STR, {
      menu: { arcadeDesc: 'Bats tes rivaux un à un tandis que la difficulté monte\u202F; un maître caché t’attend au bout. La meilleure source d’honneur.' },
      sel: {
        title: { rival: 'Défi de rival · Choisis ton ninja' },
        go: { rival: 'Relever le duel' },
        moves: 'Coups',
        movesOf: (name) => `${name} · Coups`,
        close: 'Fermer',
      },
      hint: {
        honor: (have, need) => `Honneur ${num(Math.min(have, need))}/${num(need)} → Défi de rival`,
        ready: 'Défi disponible\u202F!',
        arenaHonor: (have, need) => `S’ouvre à ${num(need)} points d’honneur (${num(Math.min(have, need))}/${num(need)})`,
      },
      honor: {
        name: 'Honneur',
        head: 'Honneur',
        rows: { win: 'Victoire', loss: 'Participation', rounds: 'Rounds gagnés', perfect: 'Round parfait', rally: 'Échange de ripostes', counter: 'Riposte', parry: 'Parade', rivalWin: 'Défi de rival', arcadeClear: 'Arcade terminée' },
        total: (n) => `Honneur\u00A0: ${num(n)}`,
        next: (name, left) => `Prochain ninja\u00A0: ${name} — encore ${num(left)} points d’honneur`,
        bar: (have, need) => `Honneur ${num(Math.min(have, need))}/${num(need)} → Défi de rival`,
        ready: (name) => `${name} te défie\u202F!`,
        readyGo: 'Accepter',
        all: 'Tous les ninjas sont débloqués',
        bonus: { arcadeClear: 'Arcade terminée', tourneyClear: 'Tournoi conquis', danPass: 'Épreuve Dan réussie', rivalWin: 'Défi de rival gagné', tutorial: 'Tutoriel terminé' },
        bonusToast: (n, what) => `+${num(n)} honneur · ${what}`,
        road: 'La voie de l’honneur',
        roadSub: 'Tu gagnes de l’honneur dans tous les modes solo. Atteins le seuil d’un ninja et il te défie en duel\u202F; bats-le, et il te rejoint.',
        earnHead: 'D’où vient l’honneur',
        earn: (H) => [
          ['Contre l’IA', `Victoire\u00A0: Apprenti ${H.win[0]} · Maître ${H.win[1]} · Légende ${H.win[2]}`],
          ['Arcade', `Victoires selon la difficulté · Shura ${H.win[3]} · la terminer +${H.arcadeClear}`],
          ['Tournoi et Dan', `Victoires ×${H.modeMul.tourney} · conquérir le tournoi +${H.tourneyClear} · chaque épreuve Dan +${H.danPass(1)} et plus`],
          ['Même dans la défaite', `Participation ${H.loss} · chaque round gagné ${H.roundWon}`],
          ['Beau jeu', `Parades, ripostes, échanges, rounds parfaits\u00A0: jusqu’à +${H.styleCap} par match`],
        ],
        rivalsHead: 'Rivaux',
        arenasHead: 'Arènes',
        open: 'Débloqué',
        castle: 'Bats Shura en Arcade',
        you: (n) => `Ton honneur\u00A0: ${num(n)}`,
      },
      rival: {
        stage: 'Défi de rival',
        selTitle: (name) => `${name} te défie · Choisis ton ninja`,
        lvHp: (lv, p) => (p === 100 ? lv : `${lv} · vie du rival ${p}\u00A0%`),
        accept: 'Relever le défi',
        acceptSub: (name) => `Gagne, et ${name} est à toi`,
        quit: 'Reculer',
        hud: 'DÉFI DE RIVAL',
        winTitle: (name) => `${name} te rejoint\u202F!`,
        winSub: (name) => `${name} est maintenant sur l’écran de sélection. Essaie ce ninja sans attendre\u202F!`,
        tryNew: (name) => `Jouer ${name}`,
        lossTitle: 'Le défi continue',
        lossSub: (name, p) => `${name} l’emporte cette fois. Perdre ne te coûte rien\u202F; au prochain essai, sa vie démarre à ${p}\u00A0%.`,
        lossSubMin: (name) => `${name} l’emporte cette fois. Perdre ne te coûte rien\u202F; réessaie.`,
        retry: 'Nouveau défi',
        reveal: 'Nouveau ninja',
        toastReady: (name) => `${name} te défie\u202F!`,
        lines: {
          hana: 'J’ai entendu parler de ton honneur, tout le marché ne parle que de toi\u202F! Suis le rythme de ma danse et je viens avec toi\u202F!',
          tetsu: 'Ton nom est parvenu jusqu’à moi. Bats-moi, et ma naginata combattra à tes côtés.',
          ren: 'Hah\u202F! Enfin quelqu’un qui m’appelle\u202F! Gagne et je suis à toi, perds et tu m’entends rire\u202F!',
          kage: 'Je t’observe depuis un moment. Attrape mon ombre, et je suis à toi.',
          tora: 'Prouve que tu n’es pas une proie. Échappe à ma chaîne, et je marche à tes côtés.',
          jin: 'Si ton honneur vient du cœur, mon bâton le saura. Viens, que je te mette à l’épreuve.',
          mai: 'Ma scène t’attend. Gagne mes applaudissements, et ma danse est à toi.',
          tsubame: 'De loin, j’ai vu ce que tu vaux. Esquive mes flèches, et mon arc est avec toi.',
        },
      },
    });

    // ================================================================ COMBAT: new kits, combos, move list (combat designer)
    // Akane/Aoi/Ren/Kage identities, combo counter, ki cancel, ND.MOVELIST names/descriptions (read through ND.i18n.t)
    merge(EN.CHARS, {
      akane: { desc: 'Maîtresse de l’iaijutsu. La lame attend au fourreau et chaque coupe est un dégainé\u202F; sa posture de dégainé intercepte les coups adverses.', weapon: 'Katana (iai)' },
      aoi: { desc: 'Le vent au bout d’un tachi tenu à une main. Estocs à longue portée et pas du vent qui comblent toute distance d’un seul geste.', weapon: 'Tachi' },
      ren: { desc: 'Bagarreur au masque d’oni. Le sabre sur l’épaule, se bat des coudes, des genoux, de l’épaule et de la tête, et écrase les gardes.' },
      kage: { desc: 'Ombre encapuchonnée. Tient le ninjatō en prise inversée\u202F; se bat à coups de pas d’ombre, de feintes et de bombes fumigènes.' },
    });
    merge(EN.TXT, { kiCancel: 'ANNULATION KI\u202F!', launch: 'EN L’AIR\u202F!', iaiCatch: 'IAI GAESHI\u202F!' });
    EN.PATTERNS.push([/^(\d+) VURUŞ$/, (m, n) => (Number(n) <= 1 ? n + ' COUP' : n + ' COUPS')]);
    merge(EN.PHRASES, {
      // shared rows
      'Tekme': 'Coup de pied',
      'Tekme: dengeyi hızla doldurur, gardı kırmaya yarar. Ardından AĞIR ile seri bitirişine bağlanır.': 'Coup de pied\u00A0: remplit vite la posture et aide à briser la garde. Enchaîne avec LOURD pour une fin d’enchaînement.',
      'Shuriken fırlatır; zamanla yeniden dolar.': 'Lance un shuriken\u202F; ils se rechargent avec le temps.',
      'Hava kesiği': 'Coupe aérienne',
      'Havada hafif kesik. Havaya fırlatılmış rakibe de vurur.': 'Une coupe légère en l’air. Touche aussi un adversaire envoyé en l’air.',
      'Dalış': 'Plongeon',
      'Havadan aşağı dalış kesiği; yere serer.': 'Une coupe plongeante depuis les airs\u202F; met au sol.',
      'Kaeshi-waza (karşılık)': 'Kaeshi-waza (riposte)',
      'Gard ya da savuşturmanın hemen ardından karşılık: nötr Suriage, ileri Harai (yere serer), geri Nuki (arkaya geçer), ağır Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.': 'Riposte juste après une garde ou une parade\u00A0: neutre Suriage, avant Harai (met au sol), arrière Nuki (passe dans le dos), lourd Uchiotoshi. Ta troisième réponse est le coup final ; si elle est parée, l’échange continue.',
      'Fırlatıcı isabet edince HAFİF: rakibin peşinden sıçrayıp havada keser. Ardından AĞIR ile yere çakar. Havadaki rakip en çok üç vuruş alır.': 'Quand le lanceur touche, LÉGER\u00A0: bondis après l’adversaire et tranche en l’air. Puis LOURD le plaque au sol. Un adversaire en l’air encaisse trois coups au plus.',
      'Üç vuruşluk hafif seri. İkinci ve üçüncü vuruş ki doluyken tekniğe bağlanır.': 'Un enchaînement léger en trois coups. Avec le ki plein, les 2e et 3e coups s’annulent en technique ki.',
      'Ağır vuruş: yavaş ama yere serer.': 'Frappe lourde\u00A0: lente, mais met au sol.',
      'İleri atılarak dürter; hafif seriye devam eder.': 'Fend en avant d’un estoc\u202F; enchaîne sur la série légère.',
      'Yarım adım geri çekilip bacaklara alçak süpürme; yere serer.': 'Un demi-pas en arrière, puis un fauchage bas aux jambes\u202F; met au sol.',
      'Fırlatıcı: yükselen kesik rakibi havaya kaldırır.': 'Lanceur\u00A0: une coupe montante soulève l’adversaire dans les airs.',
      'Sıçrayıp tepeden iner: yavaş ama gardı ezer, yere serer.': 'Bondit et s’abat d’en haut\u00A0: lent, mais écrase la garde et met au sol.',
      'Atılırken dönerek geniş kesik; yere serer.': 'Une large coupe tournoyante au sortir d’une ruée\u202F; met au sol.',
      'İki kesiklik seri bitirişi; son kesik yere serer.': 'Une fin d’enchaînement en deux coupes\u202F; la dernière met au sol.',
      'Rakibin kılıcını aşağı çarpıp dürter: gardı ezer.': 'Rabat la lame adverse et porte un estoc\u00A0: écrase la garde.',
      // Akane
      'Kından yatay çekiş kesiği, çapraz iniş, geri dönen kesik; kılıç her seferinde kınına döner.': 'Un dégainé horizontal, une coupe diagonale descendante et une coupe de retour\u202F; la lame regagne le fourreau à chaque fois.',
      'Derin çömelişten geniş yatay çekiş; yere serer.': 'Un large dégainé horizontal depuis une posture basse\u202F; met au sol.',
      'Atılarak kından çekiş: uzak mesafeyi bir anda kapatır, seriye devam eder.': 'Un dégainé en ruée\u00A0: comble une longue distance en un instant et poursuit l’enchaînement.',
      'Kılıcı çekmeden kabzayla göğse vurur: hızlı, sersemletir. Ardından HAFİF ile Kesa ya da AĞIR ile Kurenai Renga.': 'Frappe la poitrine du pommeau sans dégainer\u00A0: rapide et étourdissant. Enchaîne avec LÉGER pour Kesa ou LOURD pour Kurenai Renga.',
      'Fırlatıcı: kından yükselen çekiş rakibi havaya kaldırır.': 'Lanceur\u00A0: un dégainé montant soulève l’adversaire dans les airs.',
      'Çekiş duruşu: kısa bir an bekler; bu sırada gelen yakın dövüş darbesini yakalar ve kaçınılmaz bir iai kesiğiyle karşılık verir. Boşa giderse açık kalır.': 'Posture de dégainé\u00A0: attend un bref instant\u202F; un coup au corps à corps qui arrive alors est intercepté et puni d’une coupe iai imparable. Si rien ne vient, elle reste à découvert.',
      'Kesa’dan sonra yükselen ve inen iki çekiş kesiği; son kesik yere serer.': 'Après Kesa, un dégainé montant puis un descendant\u202F; la dernière coupe met au sol.',
      'Tekmeden sonra çömelip rakibin içinden geçen kızıl iai; arkasında belirir.': 'Après le coup de pied, un iai écarlate au ras du sol qui traverse l’adversaire\u202F; elle réapparaît dans son dos.',
      // Aoi
      'Tek elle uzun dürtüş, yukarı savrulan kesik ve rüzgâr adımıyla derin atılma dürtüşü.': 'Un long estoc à une main, une coupe montante d’un coup de poignet et un profond estoc en fente sur un pas du vent.',
      'Dönerek geniş yatay kesik; yere serer.': 'Une large coupe horizontale en pivotant\u202F; met au sol.',
      'Rüzgâr adımı: çok uzaktan tek hamlede dürter, seriye devam eder.': 'Pas du vent\u00A0: porte un estoc de très loin en un seul geste et poursuit l’enchaînement.',
      'Geri çekilirken uzun menzilli iniş kesiği: yaklaşanı cezalandırır.': 'Une coupe descendante à longue portée en reculant\u00A0: punit quiconque s’approche.',
      'Fırlatıcı: dönerek yükselen kesik rakibi havaya kaldırır.': 'Lanceur\u00A0: une coupe montante tournoyante soulève l’adversaire dans les airs.',
      'Geri sıçrar, ardından çok uzağa uzanan dürtüşle geri döner: gardı ezer, yere serer.': 'Bondit en arrière, puis revient d’un estoc très long\u00A0: écrase la garde et met au sol.',
      'Üç hızlı dürtüş; sonuncusu rüzgârla rakibi savurur.': 'Trois estocs rapides\u202F; le dernier emporte l’adversaire dans le vent.',
      'İki kez dönerek çevresini biçen kesik; gardı ezer.': 'Deux tours sur soi en tranchant tout autour\u202F; écrase la garde.',
      // Ren
      'Kesik · Dirsek · Diz': 'Coupe · Coude · Genou',
      'Tek elle kesik, dirsek darbesi ve uçan diz: kılıçla başlayıp bedenle biter.': 'Une coupe à une main, un coup de coude et un genou volant\u00A0: ça commence au sabre et ça finit au corps.',
      'İki elle tepeden ezici iniş; gardı zorlar, yere serer.': 'Un coup écrasant à deux mains venu d’en haut\u202F; force la garde et met au sol.',
      'Omuz hücumu: öne atılıp omuzla çarpar, dengeyi sarsar. İsabet ederse seriye devam eder.': 'Charge d’épaule\u00A0: fonce et percute de l’épaule, ébranlant la posture. Si elle touche, l’enchaînement continue.',
      'Kafa atar: kısa menzil, uzun sersemletme. İsabet ederse seriye devam eder.': 'Coup de tête\u00A0: courte portée, long étourdissement. S’il touche, l’enchaînement continue.',
      'Fırlatıcı: aşağıdan yukarı iki elle savrulan kesik.': 'Lanceur\u00A0: une coupe à deux mains portée de bas en haut.',
      'Topuğu havaya kaldırıp balta gibi indirir: yere serer.': 'Lève le talon bien haut et l’abat comme une hache\u00A0: met au sol.',
      'Dirsekten sonra kesik ve tepeden ezici iniş; son vuruş yere serer.': 'Après le coude, une coupe et un coup écrasant venu d’en haut\u202F; le dernier coup met au sol.',
      'Tekmenin ardından dönen topuk tekmesi; yere serer.': 'Après le coup de pied, un coup de talon retourné\u202F; met au sol.',
      // Kage
      'Ters tutuşla kesik, dönen kesik ve gölge adımı: kaybolup öne geçer, dürterek belirir.': 'Une coupe en prise inversée, une coupe tournoyante et un pas d’ombre\u00A0: disparaît, se glisse en avant et réapparaît d’un estoc.',
      'Sıçrayıp ters tutuşla aşağı saplar; yere serer.': 'Bondit et poignarde vers le bas en prise inversée\u202F; met au sol.',
      'Gölge gibi uzun atılma kesiği; seriye devam eder.': 'Une longue coupe en ruée, telle une ombre\u202F; poursuit l’enchaînement.',
      'Aldatma: kesecekmiş gibi parlar, dumanla geri kaçar. Erken savuşturmayı boşa çıkarır; hemen HAFİF ile gölge adımına, AĞIR ile Kage-nui’ye bağlanır.': 'Feinte\u00A0: jette un éclat comme pour trancher, puis recule dans la fumée. Gâche une parade trop précoce\u202F; enchaîne aussitôt sur le pas d’ombre avec LÉGER ou sur Kage-nui avec LOURD.',
      'Fırlatıcı: ters tutuşla yükselen kesik.': 'Lanceur\u00A0: une coupe montante en prise inversée.',
      'Ayağının dibine sis bombası atar: yakındakini sersemletir, Kage dumanın içinde geri kaçar.': 'Jette une bombe fumigène à ses pieds\u00A0: étourdit qui est trop près, tandis que Kage recule dans la fumée.',
      'Üç hızlı ters kesik ve aşağı saplama; sonuncusu yere serer.': 'Trois coupes inversées rapides et un coup de lame plongeant\u202F; le dernier met au sol.',
      'Tekmeden sonra dumanda kaybolur, rakibin arkasında belirip saplar.': 'Après le coup de pied, disparaît dans la fumée et réapparaît dans le dos de l’adversaire pour le poignarder.',
      // template row names
      'Nodachi serisi': 'Série au nodachi', 'Ağır nodachi': 'Nodachi lourd', 'Kodachi serisi': 'Série au kodachi', 'Ağır kesik': 'Coupe lourde',
      'Tantō dansı': 'Danse des tantō', 'Çift kesik': 'Double coupe', 'Naginata serisi': 'Série à la naginata', 'Ağır savuruş': 'Moulinet lourd',
      'Zincir ve orak': 'Chaîne et faucille', 'Zincir çekişi': 'Traction de chaîne', 'Asa serisi': 'Série au bâton', 'Ağır süpürme': 'Fauchage lourd',
      'Yelpaze serisi': 'Série aux éventails', 'Rüzgâr dalgası': 'Vague de vent', 'Tantō serisi': 'Série au tantō', 'Ok (basılı tut: güçlü)': 'Flèche (maintenir\u00A0: tir puissant)',
      'Geri + AĞIR da ok atar (basılı tut: güçlü atış); ok kalmadıysa tantō ile tepeden iner.': 'Arrière + LOURD tire aussi une flèche (maintiens pour un tir puissant)\u202F; sans flèches, elle s’abat d’en haut avec le tantō.',
      // combat pop-ups
      'KI İPTALİ!': 'ANNULATION KI\u202F!', 'HAVAYA!': 'EN L’AIR\u202F!',
    });

    // ================================================================ COUNTER CINEMATIC + COMBO TRIAL (combat feel pass)
    // js/kaeshi-cine.js STR.kaeshi, js/combo-trial.js STR.trial, js/coach.js combo/counter tips, move list legend
    {
      const tb = (t, c) => `<i class="tb${c ? ' ' + c : ''}">${t}</i>`;
      merge(EN.STR, {
        kaeshi: {
          head: 'KAESHI-WAZA', strike: 'FRAPPE\u202F!', hits: 'COUPS',
          labels: {
            suriage: 'Glisse sur sa lame, tranche en travers',
            harai: 'Chasse sa lame, tranche aux jambes',
            nuki: 'Esquive le coup, tranche dans le dos',
            uchiotoshi: 'Rabats sa lame, transperce',
            sandan: "Riposte en trois coupes",
          },
        },
        trial: {
          title: 'Épreuve de combo',
          btn: { prev: 'Combo précédent', next: 'Combo suivant', retry: 'Recommencer', close: 'Fermer' },
          names: { chain: 'Série de base', s1: 'Fin de série', s2: 'Série au pied', launch: 'Lanceur', s3: 'Long combo' },
          desc: {
            chain: '{L} trois fois. Appuie sur chacun quand le coup précédent touche\u202F; la série finit sur un coup nommé.',
            s1: '{L} deux fois, puis {H}\u00A0: la série finit sur une coupe lourde.',
            s2: '{L}, coup de pied {K}, puis {H}.',
            launch: '{D} + {H} envoie en l’air\u202F; pendant qu’il vole, {L}, puis {H}.',
            s3: 'Deux {L}, {D} + {H} pour l’envoyer en l’air, {L}, {H}\u00A0: cinq coups.',
          },
          ready: (w) => `Départ\u00A0: ${w}`,
          startWith: (w) => `Ce combo commence par ${w}.`,
          early: 'Trop tôt\u00A0: appuie quand le coup précédent touche.',
          late: 'Trop tard\u00A0: appuie avant la fin du mouvement, dès que le coup touche.',
          wrong: (got, want) => `Mauvais bouton\u00A0: ${got}, cette étape demande ${want}.`,
          dir: (want) => `Direction manquante\u00A0: ${want}. Maintiens la direction, puis appuie.`,
          miss: 'Raté\u00A0: le coup n’a pas touché. Approche-toi du mannequin.',
          clear: 'COMBO RÉUSSI\u202F!', clearPop: 'COMBO RÉUSSI\u202F!',
          all: 'Toutes les épreuves de combo de ce ninja sont réussies\u202F!',
        },
        coach: {
          combo: (l) => `${l} ${l} ${l} vite\u00A0: combo en 3 coups`,
          comboT: (l) => `Touche ${l} trois fois de suite\u00A0: combo`,
          counter: (l) => `Après une garde ou une parade, appuie sur ${l} quand «\u00A0FRAPPE\u202F!\u00A0» apparaît\u00A0: riposte`,
          counterT: (l) => `Après une garde ou une parade, touche ${l} quand «\u00A0FRAPPE\u202F!\u00A0» apparaît`,
        },
      });
      const L = Array.isArray(EN.STR.lessons) && EN.STR.lessons.find((l) => l.id === 'counter');
      if (L) L.d = 'Après une garde ou une parade, <b>FRAPPE\u202F!</b> apparaît au-dessus de ta tête\u00A0: appuie sur <kbd>F</kbd> avant que sa barre se vide. Avant/arrière + <kbd>F</kbd> ou <kbd>G</kbd> donnent d’autres ripostes.';
      if (EN.STR.lessonsTouch) EN.STR.lessonsTouch.counter = `Après une garde ou une parade, <b>FRAPPE\u202F!</b> apparaît au-dessus de ta tête\u00A0: touche ${tb('ATTAQUE', 'tb-light')} avant que sa barre se vide. Stick avant/arrière + ${tb('ATTAQUE', 'tb-light')} ou ${tb('LOURD')} donnent d’autres ripostes.`;
      merge(EN.PHRASES, {
        'KOMBO TAMAM!': 'COMBO RÉUSSI\u202F!',
        'Nasıl okunur': 'Comment lire',
        '→ rakibe doğru, ← rakipten uzağa demek: o yön tuşunu (A / D ya da ok tuşları; rakip sağındaysa D) basılı tut ve saldırı tuşuna bas. Virgül: tuşlara sırayla bas. F hafif, G ağır, R tekme, S gard.':
          '→ signifie vers l’adversaire, ← à l’opposé\u00A0: maintiens cette touche de direction (A / D ou les flèches\u202F; D si l’adversaire est à ta droite) et appuie sur la touche d’attaque. Une virgule\u00A0: appuie sur les touches l’une après l’autre. F léger, G lourd, R coup de pied, S garde.',
        '▶ rakibe doğru, ◀ rakipten uzağa: yön çubuğunu o yana itip düğmeye dokun. Virgül: düğmelere sırayla dokun. Antrenmandaki Kombo denemesi her seriyi adım adım gösterir.':
          '▶ vers l’adversaire, ◀ à l’opposé\u00A0: pousse le stick de ce côté et touche le bouton. Une virgule\u00A0: touche les boutons l’un après l’autre. L’Épreuve de combo, en Entraînement, montre chaque série pas à pas.',
        'Gard ya da savuşturmanın ardından ekranda VUR! çıkar: altındaki çubuk bitmeden HAFİF’e bas. Yalnız HAFİF: Suriage. İleri + HAFİF: Harai (yere serer). Geri + HAFİF: Nuki (arkaya geçer). AĞIR: Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.':
          'Après une garde ou une parade, «\u00A0FRAPPE\u202F!\u00A0» apparaît\u00A0: appuie sur LÉGER avant que sa barre se vide. LÉGER seul\u00A0: Suriage. Avant + LÉGER\u00A0: Harai (met au sol). Arrière + LÉGER\u00A0: Nuki (passe dans le dos). LOURD\u00A0: Uchiotoshi. Ta troisième réponse est le coup final ; si elle est parée, l’échange continue.',
      });
    }

    // ================================================================ GRAPHICS QUALITY: the Graphics setting (js/gfx.js)
    // (Turkish source in i18n.js, block "graphics quality")
    merge(EN.STR, {
      gfx: {
        title: 'Graphismes',
        levels: { auto: 'Auto', high: 'Élevé', medium: 'Moyen', low: 'Bas' },
        note: {
          auto: 'Choisit selon ton appareil et baisse d’un cran si un combat saccade.',
          high: 'Toutes les lumières et tous les effets. Pour les appareils puissants.',
          medium: 'Halo léger, sans ombres. Pour la plupart des téléphones.',
          low: 'Le plus fluide. Pour les téléphones anciens.',
        },
        now: (lv) => `Actuel\u00A0: ${lv}`,
      },
    });

    // ================================================================ FRAME RATE: Settings → Graphics (js/gfx.js makePacer)
    // (Turkish source in i18n.js, block "frame rate"; the numbers themselves are not translated)
    merge(EN.STR, {
      fps: {
        title: 'Images par seconde',
        show: 'Afficher les FPS',
        levels: { max: 'Max' },
        note: {
          60: 'Stable et sans chauffe. Idéal pour la plupart des téléphones.',
          90: 'Plus fluide si ton écran le permet. Consomme plus de batterie.',
          120: 'Le plus fluide sur les écrans 120 Hz. Consomme plus de batterie.',
          max: 'Aussi vite que ton écran le permet.',
        },
      },
    });

    // ================================================================ SETTINGS SCREEN (js/settings.js; Turkish source in i18n.js)
    merge(EN.STR, {
      set: {
        title: 'Paramètres', close: 'Fermer',
        tabs: { audio: 'Son', controls: 'Commandes', gfx: 'Graphismes', lang: 'Langue' },
        touch: 'Tactile', keys: 'Clavier', pad: 'Manette',
        touchNote: 'Les réglages des commandes tactiles apparaissent ici dès que tu touches l’écran.',
      },
    });

    // ================================================================ LANGUAGE PICKER (js/lang-ui.js; Turkish source in i18n.js)
    // Language names are not translated: each one is written in its own language (ND.i18n.names).
    merge(EN.STR, { lang: { title: 'Langue', change: 'Changer de langue', close: 'Fermer' } });

    // ================================================================ SHARED LABELS (static HTML / move list text that is the same word in Turkish)
    merge(EN.PHRASES, { 'Shuriken': 'Shuriken', 'KI': 'KI' });

    // ================================================================ TOUCH HELP PER MOVEMENT MODE
    // (game.js touchHelp(): the menu's touch help follows the movement mode; Turkish source in i18n.js)
    merge(EN.STR, {
      thelp: {
        title: { float: 'Joystick', fixed: 'Joystick fixe', dpad: 'Croix directionnelle' },
        float: { walk: 'Pose le pouce sur la moitié libre et glisse\u00A0: marcher', jump: 'Pousse vers le haut\u00A0: sauter', guard: 'Tire vers le bas\u00A0: garde', dash: 'Deux petits coups sur le côté\u00A0: ruée' },
        fixed: { walk: 'Tiens le stick par le centre et pousse sur le côté\u00A0: marcher', jump: 'Pousse vers le haut\u00A0: sauter', guard: 'Tire vers le bas\u00A0: garde', dash: 'Deux petits coups sur le côté\u00A0: ruée' },
        dpad: {
          walk: 'Maintiens\u00A0: marcher', step: 'Tape brièvement\u00A0: un petit pas', jump: 'Tape\u00A0: sauter', guard: 'Maintiens\u00A0: garde',
          dash: 'Tape deux fois\u00A0: ruée', both: 'Appuie entre deux boutons pour les deux à la fois (▶ + ▲ = saut en avant)',
        },
        edit: (b) => `${b}\u00A0: fais glisser chaque bouton où tu veux et règle sa taille et son opacité. Dans Paramètres → Commandes.`,
      },
    });

    // Persistent character journeys.
    merge(EN.STR, { menu: { arcadeDesc: "Un parcours de huit combats pour chaque ninja. Reprends au prochain rival et débloque sa fin et le sceau de maître." }, sel: { title: { arcade: "Arcade · Parcours du personnage" } },
      journey: {
        start: "Commencer le parcours",
        resume: (i, n) => "Continuer · " + i + "/" + n + "",
        ending: "Voir la fin",
        replay: "Rejouer le parcours",
        badge: "Sceau de maître",
        completed: "Parcours terminé",
        progress: (i, n) => "" + i + "/" + n + " combats terminés · Progression sauvegardée",
        reward: "Récompense : fin du personnage et sceau de maître permanent",
        saved: "Chaque victoire est sauvegardée. Quitter un combat compte comme un nouvel essai.",
        menu: (done, active) => "" + done + " parcours terminés · " + active + " en cours",
        clearReward: "Sceau de maître obtenu · Fin du personnage débloquée"
      }
    });

    void dec; void fmtTime; void num;
  };
})(window.ND);
