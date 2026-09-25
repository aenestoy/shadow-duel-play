// Shadow Duel — German catalog for ND.i18n (Turkish is the source language; English i18n-en.js is the reference).
// Same structure as i18n-en.js; see js/i18n.js for how each part is applied. Informal "du" throughout.
//
// GLOSSARY (use these everywhere)
//   parry            Parade / parieren (HUD: PARIERT!)       guard           Deckung (button DECKUNG)
//   counter          Konter / kontern (HUD: KONTER!)         guard break     Deckung brechen (DECKUNG GEBROCHEN!)
//   posture          Haltung, posture bar = Haltungsleiste   posture broken  HALTUNG GEBROCHEN!
//   ki / ki technique Ki / Ki-Technik                        ki cancel       Ki-Cancel
//   combo            Combo                                   string / chain  Serie; string ender = Serienabschluss
//   launcher         Hochschlag (HUD: HOCHSCHLAG!)           juggle          Luftcombo
//   rally            Abtausch (HUD banner: ABTAUSCH)         finisher        Schlusshieb
//   dash             Sprint (button SPRINT)                  dash slash      Sprinthieb
//   round            Runde                                   KO              K.O.
//   blade lock       Klingenbindung (HUD: BINDUNG!)          mash            hämmern
//   light / heavy slash  leichter / schwerer Hieb (buttons LEICHT / SCHWER); cut = Schnitt; thrust = Stoß
//   kick             Tritt (button TRITT)                    sweep           Beinfeger / Feger
//   air slash / dive Lufthieb / Sturzhieb                    knocks down     wirft zu Boden
//   dummy            Puppe                                   honor           Ehre
//   rival challenge  Rivalenduell                            tournament      (Monats-)Turnier
//   trial            Prüfung (Dan-Prüfung); combo trial = Combo-Übung
//   AI               CPU (never "KI": it would clash with Ki)   HP = LP (Lebenspunkte)   leaderboard = Bestenliste
//   touch buttons    ANGRIFF (attack) · LEICHT · SCHWER · TRITT · DECKUNG · SPRINT · SHUR. · KI · SPRUNG
//   move-list prefixes  Vor+ / Zurück+
// Control changes that ship with this build are written into the text: P pauses (Escape is CrazyGames'
// fullscreen key), ⌫ goes back, player 2 throws shuriken with I.
(function (ND) {
  'use strict';
  (ND.I18N_CATALOGS || (ND.I18N_CATALOGS = {})).de = function (I, EN) {
    const merge = I.merge;
    const num = (n) => I.num(n);
    const dec = (x) => I.dec(x);
    const fmtTime = (s) => I.time(s);

    // ================================================================ UI tables (ND.STR)
    merge(EN.STR, {
      menu: {
        brand: (nc, na) => `${nc} Kämpfer, ${na} Arenen und ein verborgener Meister. Klingenduelle in Echtzeit, Klingenbindungen, Paraden, gebrochene Haltung, Ki-Techniken und Ragdoll-Physik.`,
        arcade: 'Arcade',
        arcadeDesc: 'Besiege deine Rivalen einen nach dem anderen, während die Schwierigkeit steigt – am Ende wartet ein verborgener Meister. Siege schalten neue Ninjas und Arenen frei.',
        arcadeProg: (best, c, ct, a, at) => `${best ? 'Rekord ' + num(best) + ' · ' : ''}${c}/${ct} Ninjas · ${a}/${at} Arenen frei`,
        train: 'Training',
        trainDesc: 'Übe frei an der Puppe oder lerne Schritt für Schritt',
        trainFree: 'Frei',
        trainTut: 'Tutorial',
        watchShort: 'Zwei zufällige Ninjas, CPU auf Legende',
        specialKey: 'Ki-Technik (volles Ki)',
      },
      sel: {
        title: { '2p': 'Wähle deinen Ninja', cpu: 'Wähle deinen Ninja', arcade: 'Arcade · Wähle deinen Ninja', train: 'Training · Wähle deinen Ninja', tutorial: 'Tutorial · Wähle deinen Ninja', tourney: 'Monatsturnier · Wähle deinen Ninja', dan: 'Dan-Prüfung · Wähle deinen Ninja' },
        who1: { '2p': 'Spieler 1 · A / D wählen, F bestätigen', def: 'Du · A / D wählen, F bestätigen' },
        who2: { '2p': 'Spieler 2 · ← / → wählen, K bestätigen', cpu: 'Gegner (CPU) · ← / → wählen', train: 'Puppe · ← / → wählen' },
        go: { def: 'Kampf beginnen', arcade: 'Arcade starten', train: 'Training starten', tutorial: 'Tutorial starten', tourney: 'Turnier starten', dan: 'Prüfung starten' },
        random: 'Zufall',
        arena: 'Arena',
        locked: 'Gesperrt',
        lockMsg: (name, hint) => `${name} gesperrt · ${hint}`,
        keyHint: '<kbd>Enter</kbd> Start · <kbd>⌫</kbd> zurück',
      },
      hint: {
        wins: (n, cur) => `Gewinne ${n} ${n === 1 ? 'Kampf' : 'Kämpfe'} im Arcade-Modus (${Math.min(cur, n)}/${n})`,
        clear: 'Schließe den Arcade-Modus einmal ab',
        boss: 'Besiege den Endgegner im Arcade-Modus',
        arena: 'Gewinne im Arcade-Modus einen Kampf in dieser Arena',
      },
      toast: {
        newChar: (name) => `Neuer Kämpfer frei: ${name}`,
        newArena: (name) => `Neue Arena frei: ${name}`,
        newBest: (s) => `Neuer Rekord: ${num(s)} Pkt.`,
        lesson: (t) => `Lektion geschafft: ${t}`,
        tutDone: 'Tutorial geschafft!',
        perf: 'Grafik für bessere Leistung reduziert',
      },
      vs: {
        stage: (i, n) => `Kampf ${i} / ${n}`,
        boss: 'Letzter Kampf',
        go: 'Kämpft!',
        quit: 'Arcade verlassen',
        keys: '<kbd>Enter</kbd> / <kbd>F</kbd> Start · <kbd>⌫</kbd> verlassen',
        unknown: '?',
      },
      hud: { you: 'DU', cpu: 'CPU', dummy: 'PUPPE', stage: (i, n) => `${i}/${n}`, boss: 'ENDGEGNER', inf: '∞', lockSolo: 'F / K hämmern!', lockDuo: 'Leicht oder schwer hämmern!' },
      end: {
        rematch: 'Revanche', change: 'Kämpfer wechseln', menu: 'Hauptmenü',
        winTitle: 'Der Sieg ist dein',
        winSub: (i, n, pts) => `Kampf ${i}/${n} geschafft · +${num(pts)} Pkt.`,
        next: 'Nächster Kampf',
        bossNext: 'Auf zum Finale',
        lossTitle: 'Besiegt',
        lossSub: (name) => `${name} war diesmal stärker. Versuch es noch mal.`,
        retry: 'Noch mal',
        quit: 'Arcade verlassen',
      },
      ending: {
        head: 'Epilog',
        rows: { fights: 'Kämpfe', time: 'Gesamtzeit', retries: 'Neuversuche', perfect: 'Perfekte Runden', score: 'Punkte', best: 'Rekord' },
        newBest: 'Neuer Rekord!',
        menu: 'Hauptmenü',
        again: 'Noch mal spielen',
        unlocked: 'Freigeschaltet',
        fightPts: 'Kampfpunkte',
        bonus: 'Abschlussbonus',
      },
      score: {
        hud: 'PUNKTE',
        rows: { hit: 'Treffer', combo: 'Combo', counter: 'Konter', defense: 'Abwehr', pressure: 'Druck', special: 'Ki-Technik', round: 'Sieg', perfect: 'Perfekt', hp: 'Rest-LP', time: 'Zeitbonus' },
        total: 'Punkte im Kampf',
        diff: (name, m) => `inkl. ${name} ×${dec(m)}`,
        best: (s) => `Dein Rekord: ${num(s)}`,
        newBest: 'Neuer Rekord!',
        arcadeTotal: (s) => `Arcade gesamt: ${num(s)}`,
        lossNote: (s, pen) => `Dieser Versuch zählt nicht · Arcade gesamt ${num(s)} · jeder Neuversuch −${num(pen)}`,
        clearBonus: (c, n) => `+${num(c)}${n ? ' · ohne Neuversuch +' + num(n) : ''}`,
        lossCpu: 'Niederlage · nur Siege kommen in die Bestenliste',
        cpuBoardHint: 'Siege auf Legende kommen in die Bestenliste',
      },
      lb: {
        menu: 'Bestenliste',
        menuDesc: 'Arcade- und Legende-Rekorde',
        title: 'Bestenliste',
        back: 'Zurück',
        boards: { arcade: 'Arcade', cpu_efsane: 'CPU Legende' },
        boardDesc: { arcade: 'Gesamtpunkte eines abgeschlossenen Arcade-Laufs', cpu_efsane: 'Punkte eines einzelnen Siegs gegen die Legende-CPU' },
        all: 'Alle',
        status: { loading: 'Lädt…', online: 'Online-Bestenliste', readonly: 'Online-Bestenliste · nur ansehen', local: 'Lokale Bestenliste', error: 'Fehler · lokale Bestenliste', offline: 'Offline · lokale Bestenliste' },
        empty: 'Noch keine Punkte. Sei die Nummer eins!',
        loadErr: 'Die Bestenliste konnte nicht geladen werden.',
        you: 'Du', youTag: 'du', player: 'Spieler',
        nick: 'Spitzname', nickPh: 'Dein Spitzname', nickSave: 'Speichern', nickEdit: 'Ändern',
        nickAsk: 'Spitzname für die lokale Bestenliste:',
        saving: 'Speichert…',
        savedOnline: (r) => `Online-Platz: #${r}`,
        savedOnlineNoRank: 'In der Online-Bestenliste gespeichert',
        savedOnlineGap: (r, g) => `Online-Platz: #${r} · noch ${g} Pkt. bis zu den Top 10`,
        reason: {
          needName: 'Wähle einen Spitznamen, um in die Online-Bestenliste zu kommen',
          offline: 'Keine Verbindung – Punkte gesichert, sie werden gesendet, sobald du wieder online bist',
          rate: 'Zu viele Einsendungen – die Punkte werden gleich gesendet',
          daily: 'Tageslimit erreicht – Punkte nur lokal gespeichert',
          week: 'Der Monat ist vorbei – diese Punkte zählen nicht für den neuen Monat',
          invalid: 'Ungültige Punktzahl',
        },
        nickErr: {
          nick_length: 'Der Spitzname muss 3–16 Zeichen lang sein',
          nick_chars: 'Nur Buchstaben, Ziffern, Leerzeichen und _ . - (mindestens ein Buchstabe)',
          nick_bad: 'Dieser Spitzname ist nicht erlaubt, versuch einen anderen',
          rate_limited: 'Warte kurz und versuch es noch mal',
        },
        nickErrDef: 'Spitzname konnte nicht gespeichert werden',
        nickAskOnline: 'Spitzname für die Online-Bestenliste:',
        savedLocal: (r) => (r ? `#${r} in der lokalen Bestenliste` : 'In der lokalen Bestenliste gespeichert'),
        rejected: 'Deine Punkte konnten nicht gespeichert werden – nur lokale Bestenliste',
        savedLocalAccount: (r) => (r ? `#${r} auf diesem Gerät · Online-Bestenliste für Konten kommt bald` : 'Auf diesem Gerät gespeichert · Online-Bestenliste für Konten kommt bald'),
        quota: 'Die Online-Bestenliste ist voll – Punkte nur lokal gespeichert',
        open: 'Bestenliste',
        keys: '<kbd>←</kbd> <kbd>→</kbd> Liste · <kbd>↑</kbd> <kbd>↓</kbd> Ninja · <kbd>⌫</kbd> zurück',
      },
      bz: {
        back: 'Zurück', toMenu: 'Hauptmenü', you: 'Du', youTag: 'du', newBest: 'Neuer Rekord!', seeResult: 'Ergebnis ansehen',
        resetIn: 'Neustart in',
        // time left: Tage (T) · Stunden (Std) · Minuten (Min) · Sekunden (Sek)
        left: (ms) => { const t = Math.floor(ms / 1000), d = Math.floor(t / 86400), hh = Math.floor((t % 86400) / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60; return d ? `${d} T ${hh} Std ${mm} Min` : hh ? `${hh} Std ${mm} Min` : `${mm} Min ${ss} Sek`; },
        leftShort: (ms) => { const t = Math.floor(ms / 60000), d = Math.floor(t / 1440), hh = Math.floor((t % 1440) / 60), mm = t % 60; return d ? `${d} T ${hh} Std` : hh ? `${hh} Std ${mm} Min` : `${mm} Min`; },
        weekName: (m, y) => `${['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][m - 1] || m} ${y}`,
        monthName: (m) => ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][m - 1] || String(m),
        rank: (r) => (r <= 0 ? 'Ohne Rang' : r <= 10 ? `Kyu ${11 - r}` : `Dan ${r - 10}`),
        fightOf: (i, n) => `Kampf ${i}/${n}`,
        hpBonus: (p) => `Gegner-LP +${p} %`,
        mirrorOpp: 'Spiegel · dein eigener Ninja',
        suddenSub: 'Eine Runde · wer fällt, verliert',
        rows: { fights: 'Siege', time: 'Zeit', fightPts: 'Kampfpunkte', stage: 'Stufenbonus', clear: 'Abschlussbonus', total: 'Turnierpunkte', weekBest: 'Dein Monatsrekord' },
        mods: {
          rally2x: { n: 'Konterfeuer', d: 'Konterschaden ×2' },
          fullKi: { n: 'Volles Ki', d: 'Jede Runde beginnt mit vollem Ki' },
          sudden: { n: 'Alles oder nichts', d: 'Eine Runde; beide starten mit halben LP' },
          mirror: { n: 'Spiegel', d: 'Dein Gegner ist dein eigener Ninja' },
          parryOnly: { n: 'Nur Konter', d: 'Normale Treffer machen 25 % Schaden; Konter ×1,5' },
          posture2x: { n: 'Brüchige Haltung', d: 'Haltungsschaden ×2: Deckungen brechen schnell' },
          shuriken3x: { n: 'Shuriken-Sturm', d: 'Dreifache Shuriken' },
          kiRush: { n: 'Ki-Flut', d: 'Ki lädt doppelt so schnell' },
          glass: { n: 'Gläserne Klinge', d: 'Aller Schaden ×1,5' },
        },
        menu: {
          tour: 'Monatsturnier', dan: 'Dan-Prüfung', hall: 'Ruhmeshalle',
          tourRank: (p, left) => `Dieser Monat: #${p} · Neustart in ${left}`,
          tourBest: (b, left) => `Dein Rekord ${b} · Neustart in ${left}`,
          tourNew: (left) => `Dieselben 8 Kämpfe für alle · Neustart in ${left}`,
          danRank: (name, next) => (next ? `Dein Rang: ${name} · als Nächstes: ${next}` : `Dein Rang: ${name} · du stehst an der Spitze`),
          danNew: '20 Prüfungen von Kyu 10 bis Dan 10',
          hallRank: (p) => `Dieser Monat #${p} · Rekorde`,
          hallDesc: 'Die Top 10 des Monats und die ewigen Rekorde',
          nick: (n) => (n ? `Spitzname: ${n}` : 'Wähle einen Spitznamen'),
        },
        t: {
          title: 'Monatsturnier', head: 'Turnier',
          runNote: (s, st) => `Turnier gesamt: ${num(s)} (inkl. +${num(st)} pro Sieg)`,
          lossSub: (name, won) => `${name} hat deinen Lauf beendet · ${won} ${won === 1 ? 'Sieg' : 'Siege'}`,
          lossNote: (s) => `Dieser Kampf zählt nicht · Turnierpunkte ${num(s)}`,
          quit: 'Turnier beenden',
          myBest: (b, a) => `Dein Monatsrekord: ${b} Pkt. · ${a} ${a === 1 ? 'Versuch' : 'Versuche'}`,
          noTry: 'Diesen Monat noch keine Versuche.',
          place: (p, t) => (t ? `#${p} / ${t}` : `#${p}`),
          rules: (n, clear, stage) => `${n} Kämpfe; gleiche Gegner, Arenen und Regeln für alle. Eine Niederlage beendet den Versuch; Versuche sind unbegrenzt, dein bester zählt. Jeder Sieg +${stage}, alle besiegt +${clear}.`,
          start: 'Wähle deinen Ninja und leg los', again: 'Noch mal', go: 'Zum Turnier',
          clearTitle: 'Turnier bezwungen', overTitle: 'Versuch vorbei',
          savedToast: (s) => `Turnierpunkte gespeichert: ${s}`,
        },
        d: {
          title: 'Dan-Prüfung', head: 'Dan-Prüfung',
          sub: 'Bestehe jede Prüfung, um im Rang aufzusteigen. Dein Rang steht in den Bestenlisten neben deinem Namen.',
          trialOf: (n) => `Prüfung zum ${n}`,
          runNote: (i, n) => `Prüfung: ${i}/${n} Kämpfe gewonnen`,
          lossSub: (name) => `${name} hat deine Prüfung beendet.`,
          lossNote: 'Prüfung nicht bestanden',
          quit: 'Prüfung verlassen',
          yourRank: 'Dein Rang', bestWas: (n) => `Höchster: ${n}`, ladder: 'Rangleiter',
          nextTrial: (n) => `Nächste: Prüfung zum ${n}`,
          fights: (n) => `${n} ${n === 1 ? 'Kampf' : 'Kämpfe'}`,
          bossLast: 'Letzter Kampf: Shura',
          strikes: (left, max) => `Chancen: ${left}/${max} · ${max} verpatzte Prüfungen kosten dich eine Rangstufe`,
          safe: 'Auf diesem Rang kostet dich eine verpatzte Prüfung nichts.',
          maxed: 'An der Spitze: Dan 10', maxedSub: 'Dein Name führt die Dan-Liste an.',
          start: 'Wähle deinen Ninja und stell dich der Prüfung', next: 'Nächste Prüfung', go: 'Zur Prüfung',
          promoted: (n) => `Aufgestiegen: ${n}`, demoted: (n) => `Abgestiegen: ${n}`, failed: 'Prüfung nicht bestanden',
          promotedSub: (a, b) => `${a} → ${b}`, demotedSub: 'Drei verpatzte Prüfungen. Kämpf dich zurück nach oben!', tryAgain: 'Versuch es noch mal; dein Rang ist sicher.',
          toast: (n) => `Neuer Rang: ${n}`, leftToast: 'Prüfung abgebrochen: zählt als nicht bestanden',
        },
        hall: {
          title: 'Ruhmeshalle',
          tabs: { week: { n: 'Dieser Monat' }, alltime: { n: 'Allzeit' }, archive: { n: 'Sieger' }, chars: { n: 'Ninjas' }, dan: { n: 'Dan' } },
          desc: { alltime: 'Die Allzeit-Bestwerte des Monatsturniers', archive: 'Die Top 10 jedes abgeschlossenen Monats, hier für immer eingraviert', chars: 'Rekordhalter jedes Ninjas · tippe auf einen Ninja für die Top 20', dan: 'Höchste Ränge' },
          loading: 'Lädt…', error: 'Die Bestenliste konnte nicht geladen werden.', retry: 'Noch mal versuchen',
          empty: 'Noch niemand hier. Sei die Nummer eins!', emptyDan: 'Noch keine Spieler mit Rang.', emptyArchive: 'Noch keine abgeschlossenen Monate. Die ersten Sieger werden eingraviert, wenn dieser Monat endet.',
          anon: 'Spieler',
          meTop: (p, s) => `Du: #${p} · ${s} Pkt. · du bist in den Top 10!`,
          meGap: (p, g, s) => `Du: #${p} · ${s} Pkt. · noch ${g} Pkt. bis zu den Top 10`,
          meNone: 'Diesen Monat noch keine Punkte.',
          meDan: (p, n) => `Du: #${p} · ${n}`,
          meDanLocal: (n) => `Dein Rang: ${n}`, meNoDan: 'Noch kein Rang. Erste Prüfung: Kyu 10.',
          noRecord: 'Kein Rekord', allNinjas: 'Alle Ninjas',
          pending: (n) => `Einträge warten auf Versand: ${n}`,
          classic: 'Arcade · Legende-Listen',
        },
        // Monthly Tournament rewards: permanent title (top 3) and Champion colors (1st)
        ttl: {
          champ: 'Monatschampion', finalist: 'Finalist',
          reward: 'Die Top 3 jedes Monats erhalten einen dauerhaften Titel. Der Champion gewinnt außerdem exklusive Championfarben für den Ninja, mit dem er gesiegt hat. Titel gibt es erst ab 5 Spielern im Monat.',
          hall: 'Die Top 3 des Monats erhalten einen dauerhaften Titel (ab 5 Spielern) · der Champion Championfarben',
          colors: 'Championfarben',
          how: 'Gewinne ein Monatsturnier mit diesem Ninja',
          unlocked: (name) => `Monatschampion! Championfarben für ${name} freigeschaltet`,
          newTitle: (t) => `Neuer Titel: ${t}`,
        },
      },
      train: {
        title: 'Training', tutTitle: 'Tutorial',
        dummy: 'Puppe',
        beh: { idle: 'Ruhig', guard: 'Deckung', attack: 'Angriff', counter: 'Konter' },
        infHp: 'Unendlich LP', fullKi: 'Volles Ki',
        reset: 'Position zurücksetzen',
        hide: 'Ausblenden', show: 'Leiste',
        moves: 'Techniken',
        lessons: 'Lektionen',
        lessonOf: (i, n) => `Lektion ${i}/${n}`,
        done: 'Tutorial geschafft! Stell die Puppe ein, wie du willst, und übe frei.',
        progress: (a, b) => `${a}/${b}`,
        keysHelp: '<kbd>1</kbd>–<kbd>4</kbd> Puppe · <kbd>⌫</kbd> zurücksetzen · <kbd>H</kbd> Leiste',
        specialFallback: { kanji: '影斬り', name: 'Schattenschnitt', desc: 'Ein blitzschneller Hieb, der glatt durch den Gegner schneidet.', tip: '' },
        kiFull: 'volles Ki',
        counterTip: 'So hältst du dagegen',
      },
      moves: [
        ['<kbd>A</kbd><kbd>D</kbd>', 'Gehen', 'zweimal tippen: Sprint'],
        ['<kbd>W</kbd>', 'Springen', ''],
        ['<kbd>F</kbd><kbd>F</kbd><kbd>F</kbd>', 'Leichte 3er-Combo', 'dritter Treffer stößt zurück'],
        ['<kbd>G</kbd>', 'Schwerer Hieb', 'wirft zu Boden'],
        ['<kbd>R</kbd>', 'Tritt', 'setzt der Deckung zu, füllt die Haltung'],
        ['<kbd>T</kbd>', 'Shuriken', ''],
        ['<kbd>Shift</kbd>', 'Sprint', 'Shift links'],
        ['<kbd>Shift</kbd>›<kbd>F</kbd>', 'Sprinthieb', ''],
        ['<kbd>W</kbd>›<kbd>F</kbd>', 'Lufthieb', ''],
        ['<kbd>W</kbd>›<kbd>G</kbd>', 'Sturzhieb', 'schwer in der Luft'],
        ['<kbd>S</kbd>', 'Deckung', 'halten'],
        ['<kbd>S</kbd>!', 'Parade', 'kurz bevor der Hieb trifft drücken'],
        ['<kbd>F</kbd>', 'Gerader Konter', 'nach Deckung/Parade'],
        ['Vor+<kbd>F</kbd>', 'Beinfeger', 'Konter · an die Beine'],
        ['Zurück+<kbd>F</kbd>', 'Seitenwechsel', 'Konter · am Gegner vorbei'],
        ['<kbd>G</kbd>', 'Schwerer Konter', 'Konter · wirft zu Boden'],
        ['Abtausch', 'Abtausch', 'Konter abwehren, erneut kontern; dein 3. Konter ist ein Schlusshieb'],
        ['<kbd>F</kbd>/<kbd>G</kbd>!!', 'Klingenbindung', 'in der Bindung hämmern, um den Gegner wegzustoßen'],
      ],
      touch: {
        btn: { light: 'ANGRIFF', heavy: 'SCHWER', kick: 'TRITT', guard: 'DECKUNG', dodge: 'SPRINT', throw: 'SHUR.', special: 'KI', up: 'SPRUNG', down: 'DECKUNG', stick: 'Joystick' },
        lock: 'ANGRIFF hämmern!',
        replaySkip: 'tippen zum Überspringen',
        rotateTitle: 'Dreh dein Gerät quer',
        rotateText: 'Shadow Duel wird im Querformat gespielt. Die Menüs gehen auch im Hochformat.',
        rotMenu: 'Hauptmenü',
        need2p: 'Braucht Tastatur / Gamepad',
        need2pToast: 'Schließ für zwei Spieler eine Tastatur oder ein Gamepad an',
        hints: 'Tipps',
        pause: 'Pause',
        sel: { who1: 'Du · tippe auf deinen Ninja', who2: 'Gegner (CPU) · tippen zum Wählen', who2train: 'Puppe · tippen zum Wählen' },
        opt: {
          title: 'Touch-Steuerung',
          layout: 'Layout', simple: 'Einfach', full: 'Voll',
          size: 'Größe', sizes: { s: 'Klein', m: 'Mittel', l: 'Groß' },
          hand: 'Tasten', right: 'Rechts', left: 'Links',
          assist: 'Leichte Hilfe', haptic: 'Vibration',
          fullscreen: 'Vollbild', exitFullscreen: 'Vollbild beenden',
          note: 'Einfach: 5 große Tasten. Voll: dazu Tritt und Shuriken. Leichte Hilfe: Halte ANGRIFF und die Combo läuft weiter, ein kurzes Tippen auf DECKUNG hält lange genug für eine Parade, und der Stick springt nicht aus Versehen. Das erleichtert nur die Bedienung; Regeln und Punkte sind für alle gleich.',
          fullNote: 'Die Tasten TRITT und SHURIKEN gibt es im vollen Layout (Einstellungen → Steuerung).',
        },
        help: '<div class="th-grid">' +
          '<div><h3>Joystick</h3><dl>' +
          '<dt><i class="tb">◀ ▶</i></dt><dd>Daumen auf die freie Hälfte legen und schieben: gehen</dd>' +
          '<dt><i class="tb">▲</i></dt><dd>Nach oben drücken: springen</dd>' +
          '<dt><i class="tb tb-guard">▼</i></dt><dd>Nach unten ziehen: Deckung</dd>' +
          '<dt><i class="tb">▶▶</i></dt><dd>Zweimal kurz zur Seite schnippen: Sprint</dd>' +
          '</dl></div>' +
          '<div><h3>Tasten</h3><dl>' +
          '<dt><i class="tb tb-light">ANGRIFF</i></dt><dd>Hieb. Immer wieder tippen: Combo. Beim Tippen vor oder zurück halten: andere Techniken</dd>' +
          '<dt><i class="tb">SCHWER</i></dt><dd>Schwerer Hieb. Vor + SCHWER schleudert den Gegner hoch</dd>' +
          '<dt><i class="tb tb-guard">DECKUNG</i></dt><dd>Halten: Deckung. Kurz vor einem Treffer tippen: Parade</dd>' +
          '<dt><i class="tb">SPRINT</i></dt><dd>Sprint (in Stick-Richtung, sonst nach hinten)</dd>' +
          '<dt><i class="tb ki">KI</i></dt><dd>Ki-Technik: Die Taste leuchtet, wenn das Ki voll ist</dd>' +
          '<dt><i class="tb">TRITT</i> <i class="tb">SHUR.</i></dt><dd>Volles Layout: Tritt und Shuriken</dd>' +
          '</dl></div></div>',
        note: 'Du kannst mehrere Tasten gleichzeitig drücken: Deckung halten und angreifen, oder den Daumen von <i class="tb tb-guard">DECKUNG</i> zu <i class="tb tb-light">ANGRIFF</i> ziehen. <b>II</b> oben am Bildschirm pausiert; Layout, Größe und die Linkshänder-Option findest du in den <b>Einstellungen</b>. Nimmst du Tastatur oder Gamepad, schaltet die Steuerung automatisch um.',
        keysHelp: '',
      },
      movesTouch: [
        ['<i class="tb">◀ ▶</i>', 'Gehen', 'Stick · zweimal schnippen: Sprint'],
        ['<i class="tb">▲</i>', 'Springen', 'Stick nach oben drücken'],
        ['<i class="tb tb-light">ANGRIFF</i>×3', 'Dreier-Combo', 'immer wieder tippen; dritter Treffer stößt zurück'],
        ['<i class="tb">SCHWER</i>', 'Schwerer Hieb', 'wirft zu Boden'],
        ['<i class="tb">TRITT</i>', 'Tritt', 'setzt der Deckung zu, füllt die Haltung · volles Layout'],
        ['<i class="tb">SHUR.</i>', 'Shuriken', 'volles Layout'],
        ['<i class="tb">SPRINT</i>', 'Sprint', ''],
        ['<i class="tb">SPRINT</i>›<i class="tb tb-light">ANGRIFF</i>', 'Sprinthieb', ''],
        ['<i class="tb">▲</i>›<i class="tb tb-light">ANGRIFF</i>', 'Lufthieb', ''],
        ['<i class="tb">▲</i>›<i class="tb">SCHWER</i>', 'Sturzhieb', 'schwer in der Luft'],
        ['<i class="tb tb-guard">DECKUNG</i>', 'Deckung', 'halten oder Stick nach unten ziehen'],
        ['<i class="tb tb-guard">DECKUNG</i>!', 'Parade', 'kurz bevor der Hieb trifft tippen'],
        ['<i class="tb tb-light">ANGRIFF</i>', 'Gerader Konter', 'nach Deckung/Parade'],
        ['Vor+<i class="tb tb-light">ANGRIFF</i>', 'Beinfeger', 'Konter · an die Beine'],
        ['Zurück+<i class="tb tb-light">ANGRIFF</i>', 'Seitenwechsel', 'Konter · am Gegner vorbei'],
        ['<i class="tb">SCHWER</i>', 'Schwerer Konter', 'Konter · wirft zu Boden'],
        ['Abtausch', 'Abtausch', 'Konter abwehren, erneut kontern; dein 3. Konter ist ein Schlusshieb'],
        ['<i class="tb tb-light">ANGRIFF</i>!!', 'Klingenbindung', 'in der Bindung ANGRIFF hämmern, um den Gegner wegzustoßen'],
      ],
      moveSpecialTouch: '<i class="tb ki">KI</i>',
      moveTags: {
        normal: 'Normal', command: 'Befehl', string: 'Serie', launcher: 'Hochschlag', juggle: 'Luftcombo', air: 'Luft', dash: 'Sprint',
        strike: 'Schlag', counter: 'Konter', catch: 'Abfangen', feint: 'Finte', guardCrush: 'Deckungsbrecher', knockdown: 'Niederwurf',
        kiCancel: 'Ki-Cancel', special: 'Ki-Technik', throw: 'Geschoss',
      },
      lessonsTouch: {
        walk: 'Schieb den Daumen auf der freien Bildschirmhälfte: Drück den Stick nach links und rechts, um zu gehen.',
        combo: 'Tippe dreimal hintereinander auf <i class="tb tb-light">ANGRIFF</i>: Reihe drei Hiebe aneinander und triff die Puppe.',
        heavy: 'Lande mit <i class="tb">SCHWER</i> einen schweren Hieb. Er ist langsam, wirft aber zu Boden.',
        gbreak: 'Die Puppe hält die Deckung. Triff sie mit <i class="tb">SCHWER</i>, um ihre Haltungsleiste zu füllen und die Deckung zu brechen (<i class="tb">TRITT</i> im vollen Layout füllt sie noch schneller).',
        block: 'Die Puppe greift an. Halte <i class="tb tb-guard">DECKUNG</i> (oder zieh den Stick nach unten) und blocke einen Hieb.',
        parry: 'Tippe <i class="tb tb-guard">DECKUNG</i> kurz bevor der Hieb trifft. Der perfekte Moment ist, wenn der blaue Ring schrumpft.',
        counter: 'Direkt nach Deckung oder Parade: <i class="tb tb-light">ANGRIFF</i> – Konterhieb. Probier auch Stick vor/zurück + <i class="tb tb-light">ANGRIFF</i> oder <i class="tb">SCHWER</i>.',
        special: 'Deine Ki-Leiste ist voll. Setze {sp} mit der leuchtenden <i class="tb ki">KI</i>-Taste ein.',
      },
      lessons: [
        { id: 'walk', t: 'Gehen', d: 'Geh mit <kbd>A</kbd> / <kbd>D</kbd> vor und zurück.' },
        { id: 'combo', t: 'Dreier-Combo', d: 'Reihe mit <kbd>F</kbd> <kbd>F</kbd> <kbd>F</kbd> drei leichte Hiebe aneinander und triff die Puppe.' },
        { id: 'heavy', t: 'Schwerer Hieb', d: 'Lande mit <kbd>G</kbd> einen schweren Hieb. Er ist langsam, wirft aber zu Boden.' },
        { id: 'gbreak', t: 'Deckung brechen', d: 'Die Puppe hält die Deckung. Tritt mit <kbd>R</kbd> zu, um ihre Haltungsleiste zu füllen und die Deckung zu brechen.' },
        { id: 'block', t: 'Deckung', d: 'Die Puppe greift an. Halte <kbd>S</kbd>, um einen Hieb zu blocken.' },
        { id: 'parry', t: 'Parade', d: 'Drück <kbd>S</kbd> kurz bevor der Hieb trifft. Der perfekte Moment ist, wenn der blaue Ring schrumpft.' },
        { id: 'counter', t: 'Konter', d: 'Direkt nach Deckung oder Parade: <kbd>F</kbd> – Konterhieb. Probier auch vor/zurück + <kbd>F</kbd> oder <kbd>G</kbd>.' },
        { id: 'rally', t: 'Abtausch', d: 'Auch die Puppe kontert. Greif an, blocke ihren Konter und kontere erneut: Erreiche 2× mit zwei eigenen Antworten.' },
        { id: 'special', t: 'Ki-Technik', d: 'Deine Ki-Leiste ist voll. Setze {sp} mit <kbd>E</kbd> ein.' },
      ],
    });

    // ================================================================ story, fighters, arenas, specials
    // ---- Fragment B: story text (talk, pairs, endings, roster2 notes), characters, arenas, specials, pop-ups, AI levels, number words
    merge(EN.STR, {
      // open = speaks first (opponent), reply = answers (player), boss = said to the final boss
      talk: {
        akane: {
          open: ['Meine Klinge ist karmesinrot, mein Herz ist rein. Tritt mir mit Ehre entgegen.', 'Erst verneige ich mich, dann schlage ich zu. So ist es nur gerecht.', 'Dieses Duell gilt unserer Ehre. Es gibt kein Zurück.'],
          reply: ['Ein ehrenhafter Gegner … Du hast dir meine Klinge verdient.', 'Scharfe Worte. Mal sehen, ob dein Stahl ebenso scharf ist.', 'Wenn die karmesinrote Klinge spricht, verstummen die Worte.'],
          boss: 'Meine Meister starben durch deine Klinge, Shura. Heute wird diese Schuld beglichen.',
        },
        aoi: {
          open: ['Der Wind hat es nie eilig. Ich auch nicht.', 'Lausche deinem Atem. Das Letzte, was du hörst, wird der Wind sein.', 'Bambus biegt sich, doch er bricht nie. Und du?'],
          reply: ['Beruhige dich. Zorn macht die Klinge schwer.', 'Den Wind kannst du nicht fangen. Nur spüren.', 'Nun gut. Wir beginnen, wenn das Blatt den Boden berührt.'],
          boss: 'Selbst im Auge des Sturms herrscht Stille. In dir ist nur Lärm, Shura.',
        },
        kuro: {
          open: ['Der Berg bewegt sich nicht. Du schon.', 'Kein Gerede. Heb dein Schwert.', 'Du bist klein. Das geht schnell.'],
          reply: ['Hmpf. Dann komm.', 'Du redest zu viel.', 'Mein Nodachi ist lang. Meine Geduld ist kurz.'],
          boss: 'Shura. Ich habe lange gewartet. Genug geredet.',
        },
        yuki: {
          open: ['Schnee fällt lautlos. Meine Hiebe auch.', 'Ein Fuchs tappt nicht in Fallen. Er stellt sie.', 'Kalt? Bald spürst du gar nichts mehr.'],
          reply: ['Du bist ein Hitzkopf. Das macht dich langsam.', 'So laut … Selbst der Schnee schämt sich für dich.', 'Nicht blinzeln. Sonst verpasst du es.'],
          boss: 'Alle fürchten dich, Shura. Mir ist nur ein bisschen kühl.',
        },
        hana: {
          open: ['Tanzen wir? Aber ich führe!', 'Wir sind fertig, bevor die Kirschblüten landen, versprochen!', 'Zwei Tantō, ein Lächeln. Was macht dir mehr Angst?'],
          reply: ['Ach, so ernst! Lächle doch mal, dann fällst du hübscher.', 'Fang mich doch!', 'Schon gut, schon gut! Aber hinterher wird nicht geweint.'],
          boss: 'Lachst du eigentlich nie, Shura? Komm, machen wir es zu unserem letzten Tanz!',
        },
        tetsu: {
          open: ['Die Pflicht hat mich hergeführt. Tritt beiseite oder falle.', 'Meine Rüstung hat hundert Schlachten gesehen. Du bist die hundertunderste.', 'Disziplin kommt vor Mut. Erlaube, dass ich es dir zeige.'],
          reply: ['Respektlosigkeit. Ich werde sie berichtigen.', 'Deine Worte durchdringen meine Rüstung nicht.', 'Sei bereit. Meine Naginata warnt nicht.'],
          boss: 'Du hast die Burg meines Fürsten niedergebrannt, Shura. Heute erfülle ich meine Pflicht.',
        },
        ren: {
          open: ['Ha! Endlich mal Spaß! Sind deine Knochen stabil?', 'Hat dich die Maske erschreckt? Mein echtes Gesicht willst du gar nicht sehen!', 'Köpfe oder Deckungen? Ich breche beides!'],
          reply: ['Große Klappe, nichts dahinter! Komm schon!', 'Heh, du gefällst mir. Verprügeln tu ich dich trotzdem.', 'Schon mal meinen Tritt gesehen? Gleich ist es so weit!'],
          boss: 'Du bist also der echte Oni, was? Mal sehen, wessen Hörner härter sind!',
        },
        kage: {
          open: ['Du glaubst, mich zu sehen. Du siehst nur meinen Schatten.', 'Je heller das Licht, desto tiefer der Schatten.', 'Dein Name wurde bereits geschrieben. Ich lese ihn nur.'],
          reply: ['Sprich nicht. Die Schatten lauschen.', 'Sieh dich nicht um. Ich bin schon hinter dir.', 'Du bist zu laut. Stille schlägt schneller zu.'],
          boss: 'Schatten dienen keinem Herrn, Shura. Sie werden auch dich verschlingen.',
        },
        shura: {
          open: ['Du hast sieben Klingen zerbrochen. Die achte ist meine, und sie zerbricht dich.', 'Dein Geist hat mich gerufen. Gut, dass du so hoch gestiegen bist; umso tiefer wirst du fallen.', 'Ich bin das Ende des Weges. Knie nieder.'],
          reply: ['Schwäche. Ich rieche sie bis hierher.', 'Du bist nur ein Trittstein.', 'Knie nieder oder falle.'],
          boss: 'Der Dämon im Spiegel … Einer von uns ist einer zu viel.',
        },
        tora: {
          open: ['Ich habe aufgehört zu zählen, wie viele schon an meiner Kette baumelten. Du wirst einer mehr sein.', 'Die Jagd hat begonnen. Lauf, wenn du willst, aber meine Kette ist lang.', 'Man sagt, ein Tiger lauert im Hinterhalt. Dieser nicht!'],
          reply: ['Grrr … Gut. Ich mag Beute, die nicht wegläuft.', 'Du musst nicht näher kommen. Ich zieh dich heran.', 'Deine Worte sind lang. Meine Kette ist länger.'],
          boss: 'Auch du bist nur Beute, Shura. Nur etwas größer.',
        },
        jin: {
          open: ['Ich bin nicht gekommen, um Blut zu vergießen. Ich lege dich nur eine Weile schlafen.', 'Der Stab spricht mit Geduld. Hör zu.', 'Dein Weg ist voller Zorn, junger Krieger. Lass uns deine Last leichter machen.'],
          reply: ['Nun gut. Aber danach trinken wir Tee.', 'Dein Zorn lastet auf dir. Lass mich ihn tragen.', 'Ein Schwert schneidet; ein Stab erweckt.'],
          boss: 'Shura, ich muss dich nicht vernichten, um den Dämon in dir zu besiegen. Es genügt, dich aufzuhalten.',
        },
        mai: {
          open: ['Die Bühne ist bereit, der Vorhang offen. Deine Rolle: die des Verlierers.', 'Wenn sich mein Fächer öffnet, schließ nicht die Augen. Sonst verpasst du die Vorstellung.', 'Jeder meiner Schritte ist eine Note. Hältst du den Takt?'],
          reply: ['Welch plumper Auftritt. Egal, ich habe Anmut genug für uns beide.', 'Der Wind weht in meine Richtung, Liebling.', 'Ich brauche keinen Applaus. Dein Fall genügt.'],
          boss: 'Shura, in diesem letzten Tanz teile ich die Bühne mit niemandem.',
        },
        tsubame: {
          open: ['Der Abstand zwischen uns ist meine Waffe.', 'Eine Schwalbe verfehlt einmal. Beim zweiten Mal wendet sie und schlägt zu.', 'Ich habe den Wind gemessen. Mein Pfeil kennt seinen Weg.'],
          reply: ['Du willst näher ran? Versuch es.', 'Halt den Atem an. Ein fliegender Pfeil macht kein Geräusch.', 'Mein Auge ruht auf dir. Mein Pfeil auch.'],
          boss: 'Shura, am Himmel gibt es kein Versteck. Mein Pfeil wird dich finden.',
        },
      },
      // Special match-ups: lines are spoken in the order written
      pairs: {
        'akane|aoi': [['akane', 'Aoi! Zeit, das Duell zu beenden, das wir offen gelassen haben.'], ['aoi', 'Der Wind weht immer zum selben Feuer, Akane. Beginne.']],
        'kuro|tetsu': [['kuro', 'Eiserne Schale. Mal sehen, ob sie hohl ist.'], ['tetsu', 'Selbst ein Berg beugt sich der Disziplin, Kuro.']],
        'hana|yuki': [['yuki', 'Blumen welken im Schnee, Hana.'], ['hana', 'Dann schmelze ich eben den Schnee, Yuki!']],
        'kage|ren': [['ren', 'Schattentricks ziehen bei mir nicht! Zeig dich!'], ['kage', 'Ich bin genau hier, Oni. Du weißt nur nicht, wie man hinsieht.']],
        'akane|ren': [['akane', 'Nur die Ehrlosen verstecken sich hinter einer Maske.'], ['ren', 'Ehre? Von Ehre wird mein Bauch nicht voll!']],
        'aoi|yuki': [['aoi', 'Auch ein kalter Wind ist Wind, Yuki.'], ['yuki', 'Aber der Schnee bleibt, wenn der Wind sich legt.']],
        'kuro|tora': [['tora', 'Ein Berg, was? In den Bergen leben auch Tiger.'], ['kuro', 'In den Bergen sterben Tiger.']],
        'tora|yuki': [['tora', 'Ein Fuchs! Was macht ein Fuchs vor einem Tiger?'], ['yuki', 'Er rennt. Und friert dem Tiger den Schwanz ein.']],
        'jin|tora': [['tora', 'Was machst du, wenn sich meine Kette um deinen Stab wickelt, Mönch?'], ['jin', 'Ich löse sie. Knoten zu lösen ist meine Berufung.']],
        'jin|ren': [['ren', 'Ein Mönch? Fang an zu beten, Glatzkopf!'], ['jin', 'Das tue ich schon, Oni. Für dich. Das Feuer in dir verbrennt auch dich.']],
        'jin|tetsu': [['tetsu', 'Was hat ein Mönch auf dem Schlachtfeld verloren?'], ['jin', 'Ich kam wegen gepanzerter Herzen wie deinem, Tetsu. Deine Rüstung ist schwer; dein Herz noch schwerer.']],
        'akane|jin': [['akane', 'Tritt beiseite, Mönch. Diese Rache gehört mir.'], ['jin', 'Rache ist eine Kette, Akane. Zerbrechen wir sie zuerst.']],
        'hana|mai': [['hana', 'Oh, noch eine Tänzerin! Mal sehen, wer sich schneller dreht!'], ['mai', 'Tempo ist nur der Schatten der Anmut, Hana. Lass mich dir das Licht zeigen.']],
        'kage|mai': [['mai', 'Tanzen Schatten auch, Kage?'], ['kage', 'Nur wenn das Licht erlischt.']],
        'aoi|tsubame': [['tsubame', 'Kann dein Wind meinen Pfeil ablenken, Aoi?'], ['aoi', 'Der Wind ergreift für niemanden Partei, Tsubame. Auch nicht für deinen Pfeil.']],
        'kage|tsubame': [['kage', 'Was du nicht siehst, kannst du nicht treffen, Bogenschützin.'], ['tsubame', 'Schatten kommen mit dem Licht. Ich auch.']],
        'mai|tsubame': [['mai', 'Aus der Ferne zu starren ist unhöflich, Bogenschützin. Komm und sieh aus der Nähe zu.'], ['tsubame', 'Ich schicke meinen Pfeil, damit er sich deine Bühne aus der Nähe ansieht.']],
      },
      endings: {
        akane: ['Als Shuras Schwert zu Boden fiel, läuteten die Tempelglocken von selbst.', 'Akane wischte die karmesinrote Klinge sauber und verneigte sich am Grab der Meister: Die Schuld war beglichen.', 'Ihr Weg heißt nicht mehr Rache, sondern neue Schüler die Ehre zu lehren.'],
        aoi: ['Als Shura fiel, verstummte der Sturm; zum ersten Mal seit Jahren rissen die Wolken auf.', 'Aoi steckte die Klinge in die Scheide und kehrte in den Bambuswald zurück.', 'Zurück blieb nur ein pfeifender Wind.'],
        kuro: ['Kuro begrub Shuras zerbrochene Maske auf dem Gipfel des Berges.', 'Kein Wort fiel. Kuro zog den Strohhut tiefer und verschwand im Schnee.', 'Die Dorfbewohner sagen, in jenem Winter sei kein einziger Bandit vom Berg herabgekommen.'],
        yuki: ['Shuras letzter Atemzug wurde in der kalten Luft zu Nebel und verging.', 'Yuki richtete den Schal und ging davon, ohne Spuren im Schnee zu hinterlassen.', 'Seit jenem Tag sieht man auf dem Gipfel nur noch den Schatten eines Fuchses.'],
        hana: ['Als Shuras Maske zu Boden fiel, legte Hana einen Kirschzweig daneben.', 'In jener Nacht füllte sich der Markt mit Laternen; den lautesten Jubel bekam eine Kunoichi, die über die Dächer tanzte.', 'Niemand weiß, wohin Hana ging. Nur treibende rosa Blütenblätter sind geblieben.'],
        tetsu: ['Auf dem Burgdach zerbrach Tetsu Shuras Schwert über dem Knie.', 'Das Banner des Fürsten wehte wieder, stolz im Wind.', 'Die Pflicht ist erfüllt. Doch die Pflicht eines Samurai endet nie.'],
        ren: ['Ren hängte Shuras zerbrochene Maske neben die andere Oni-Maske. Zwei Oni, ein Sieger.', 'In jener Nacht sang das Dorf; das lauteste Lachen war wie immer das von Ren.', 'Am Morgen war Ren schon wieder unterwegs. Zur nächsten Rauferei.'],
        kage: ['Als Shura fiel, legte sich Kages Schatten still über den gefallenen Dämon.', 'Keine Spur, kein Laut; nur ein Schatten mehr, der sich im Mondlicht dehnt.', 'Vielleicht war er schon immer da. Vielleicht hat es ihn nie gegeben.'],
        shura: ['Auf dem Burgdach blieb nur einer stehen: der, der dieselbe Maske trug, nur dunkler.', 'Shura sucht keine Rivalen mehr. Die Rivalen suchen Shura.'],
        def: ['Der letzte Meister ist gefallen. Der Weg der Schatten gehört nun dir.', 'Steck deine Klinge ein; jetzt beginnt die Legende.'],
        tora: ['Das Rasseln einer Kette kündete von Shuras Fall.', 'Tora hängte die zerbrochene Maske an die Kette: eine neue Jagdtrophäe.', 'Von jenem Tag an hielt niemand im Wald das Brüllen des Tigers noch für ein Märchen.'],
        jin: ['Jin kniete neben dem gefallenen Shura nieder und betete.', 'Auf dem Rückweg zum Tempel klebte kein einziger Tropfen Blut am Stab.', 'In jener Nacht läuteten die Bergglocken wieder; diesmal nicht zur Trauer, sondern für den Frieden.'],
        mai: ['Als Shura fiel, ließ Mai den Fächer zuschnappen und verneigte sich.', 'Der Nachtmarkt spricht noch immer von diesem Tanz.', 'Der Vorhang fiel. Doch Mai verließ die Bühne nie.'],
        tsubame: ['Der letzte Pfeil zitterte lautlos im Burgdach.', 'Tsubame schulterte den Bogen und sah den Schwalben nach, die nach Süden zogen.', 'Nie wieder gesehen; zurück blieben nur bunt befiederte Pfeile, die in ihren Zielen steckten.'],
      },
      roster2: {
        notes: {
          tora: ['Leicht: Kettenpeitsche auf mittlere Distanz, Sichel im Nahkampf', 'Schwer: wirft die Kette; bei Treffer zieht sie den Gegner heran', 'Serienabschluss: Steht der Gegner weit weg, zieht ihn die Kette näher'],
          jin: ['Beide Enden des Stabs treffen; die Schläge sind stumpf und lassen nie Blut fließen', 'Der dritte Treffer und der schwere Feger werfen zu Boden', 'In der Deckung steigt der Haltungsschaden langsamer'],
          mai: ['Größeres Paradefenster', 'In der Deckung schicken die Fächer Geschosse zurück', 'Schwer: Eine Windwelle stößt den Gegner weg und zerstreut Geschosse'],
          tsubame: ['Schwer: schießt einen Pfeil mit dem Bogen; halten für einen geladenen Schuss', 'Wurf: Rückwärtssalto und Pfeilschuss aus der Luft', 'Ohne Pfeile nutzt der schwere Angriff das Tantō; Pfeile füllen sich mit der Zeit wieder auf'],
        },
      },
    });

    merge(EN.CHARS, {
      akane: { title: 'Karmesinklinge', desc: 'Ausgewogene Katana-Meisterin. Schnelle Dreier-Combo, starke Parade.', weapon: 'Katana' },
      aoi: { title: 'Blauer Wind', desc: 'Flinke Katana-Kunst. Geht etwas schneller und sprintet wie der Wind.', weapon: 'Katana' },
      kuro: { title: 'Schwarzer Berg', desc: 'Führt ein langes Nodachi. Langsam, aber mit großer Reichweite und verheerenden Hieben.', weapon: 'Nodachi' },
      yuki: { title: 'Schneefuchs', desc: 'Schlägt mit einem kurzen Kodachi blitzschnell zu. Viele Shuriken, langer Schal.', weapon: 'Kodachi' },
      hana: { title: 'Kirschtanz', desc: 'Kunoichi. Kämpft mit zwei Tantō, als würde sie tanzen; schnellste Hände, kürzeste Reichweite.', weapon: 'Doppel-Tantō' },
      tetsu: { title: 'Eiserne Festung', desc: 'Gepanzerter Samurai. Die Naginata hat die größte Reichweite; Treffer hinterlassen kaum eine Delle.', weapon: 'Naginata' },
      ren: { title: 'Karmesin-Oni', desc: 'Raufbold mit Oni-Maske. Gefürchtet für deckungsbrechende Hiebe und verheerende Tritte.', weapon: 'Uchigatana' },
      kage: { title: 'Der Schatten selbst', desc: 'Kapuzenschatten. Schnell mit dem Ninjatō, langer Sprint; hinterlässt überall einen Schatten.', weapon: 'Ninjatō' },
      tora: { title: 'Kettentiger', desc: 'Meister der Kusarigama. Peitscht die beschwerte Kette auf mittlere Distanz; der schwere Angriff zieht den Gegner zur Sichel heran.', weapon: 'Kusarigama' },
      jin: { title: 'Mönch des Eisenstabs', desc: 'Mönch mit Bō. Ein langer Stab, der mit beiden Enden trifft, eine solide Deckung und stumpfe Niederwürfe; vergießt nie Blut, lässt nur Knochen klappern.', weapon: 'Bō' },
      mai: { title: 'Fächertänzerin', desc: 'Kunoichi mit Kriegsfächern. Sehr schnell, mit großem Paradefenster; die Fächer schicken Geschosse zurück, ihr Wind stößt Gegner weg.', weapon: 'Doppel-Tessen' },
      tsubame: { title: 'Schwalbenschützin', desc: 'Trägt Bogen und Tantō. Schießt Pfeile auf Distanz (schwer halten für einen starken Schuss) und entkommt jedem, der näher kommt, mit einem Rückwärtssalto – und schießt dabei aus der Luft.', weapon: 'Yumi + Tantō' },
      shura: { title: 'Der Karmesinmeister', desc: 'Ein Dämonenmeister, dessen Weg in Karmesin gezeichnet ist. Langes Nodachi, vernichtende Hiebe, nahezu makellose Paraden.', weapon: 'Nodachi' },
    });

    merge(EN.ARENAS, {
      temple: 'Mondtempel',
      rain: 'Bambuswald im Sturm',
      snow: 'Verschneiter Gipfel',
      village: 'Brennendes Dorf',
      market: 'Nachtmarkt',
      waterfall: 'Wasserfall',
      castle: 'Burgdach',
    });

    merge(EN.SPECIALS, {
      akane: { desc: 'Ein karmesinroter Iai-Hieb, der im Wimpernschlag durch den Gegner fährt und eine lodernde Sichel in der Luft zurücklässt.', tip: 'Pariere oder sprinte zur Seite' },
      aoi: { desc: 'Ein weiter Schwung schickt eine Windklinge nach vorn; eine perfekt getimte Deckung wirft sie zurück.', tip: 'Spring, zerschneide sie mit der Klinge oder geh im perfekten Moment in Deckung' },
      kuro: { desc: 'Springt hoch und spaltet den Boden mit dem Nodachi; die Druckwelle rast über den Boden, zermalmt Deckungen und wirft zu Boden.', tip: 'Spring über die Welle und schlag in der Luft zu' },
      yuki: { desc: 'Ein blitzschneller Wirbel aus fünf Treffern, wie ein Schneesturm; der letzte wirft zu Boden.', tip: 'Halte die Deckung und pariere den ersten Treffer' },
      hana: { desc: 'Dreht sich mit den Doppel-Tantō als Wirbel aus Kirschblüten nach vorn und schneidet zu beiden Seiten.', tip: 'Halte die Deckung oder sprinte zurück' },
      tetsu: { desc: 'Lässt die Naginata rundum kreisen; Treffer stoppen die Drehung nicht (Superrüstung).', tip: 'Geh aus der Reichweite oder pariere' },
      ren: { desc: 'Ein Schulterangriff, der Deckungen zertrümmert, gefolgt von einem aufsteigenden Hieb, der den Gegner hochschleudert.', tip: 'Deckung hilft nicht: Pariere, spring oder sprinte' },
      kage: { desc: 'Verschwindet im Rauch, lässt einen Schattenklon zurück und taucht hinter dem Gegner zum Angriff auf.', tip: 'Geh in Deckung, sobald Kage wieder auftaucht' },
      tora: { desc: 'Wirbelt die Kette über dem Kopf zu einem Zyklon, der alles in der Nähe niedermäht; wer gefangen wird, wird herangezogen und von der Sichel in die Luft geschleudert.', tip: 'Geh aus der Reichweite oder in Deckung: Wirst du nicht erwischt, geht der Zug ins Leere' },
      jin: { desc: 'Rückt vor und lässt den Stab wie ein Diamantrad kreisen; nach vier Schlägen schleudert ein aufsteigender Hieb den Gegner hoch.', tip: 'Sprinte zurück oder pariere den ersten Schlag' },
      mai: { desc: 'Entfacht einen Wirbelwind, der nach vorn treibt, den Gegner hineinzieht, zerschneidet und schließlich in die Luft schleudert.', tip: 'Wehre den Wirbel im perfekten Moment ab oder weich zurück: Er ist langsam' },
      tsubame: { desc: 'Springt zurück und lässt Pfeile vom Himmel regnen; bei einem Fehlschuss folgt ein Schwalbenpfeil, der wendet und von hinten trifft.', tip: 'Tritt von den Markierungen am Boden weg; der Schwalbenpfeil kehrt zurück, also pass auf deinen Rücken auf' },
      shura: { desc: 'Brüllt auf und zerfließt zu karmesinrotem Rauch, erscheint vor und hinter dem Gegner und führt drei schwere Nodachi-Hiebe; der letzte schleudert hoch.', tip: 'Achte auf das karmesinrote Aufblitzen: Eine Parade beendet die Technik; Deckung zermalmt deine Haltung' },
    });

    merge(EN.TXT, {
      gbreak: 'HALTUNG GEBROCHEN!', cut: 'ZERSCHNITTEN!', reflect: 'REFLEKTIERT!', parry: 'PARIERT!', caught: 'GEFANGEN!',
      swallowHit: '燕!', vajraHit: '金剛!', whirlHit: '旋風の舞',
    });

    merge(EN.AI_LEVELS, { 0: 'Lehrling', 1: 'Meister', 2: 'Legende', 3: 'Shura' });

    EN.NUMWORDS = ['Null', 'Eins', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben', 'Acht', 'Neun', 'Zehn', 'Elf', 'Zwölf'];

    // ================================================================ static HTML, hardcoded literals, canvas pop-ups
    merge(EN.PHRASES, {
      // ---------------------------------------------------------------- index.html: <title>, brand, HUD
      'Gölge Düellosu': 'Shadow Duel',
      'Duraklat': 'Pause',
      'KARŞILIKLI SERİ': 'ABTAUSCH',
      'SON DARBE': 'LETZTER HIEB',
      'atlamak için bir tuşa bas': 'beliebige Taste zum Überspringen',
      // touch buttons (static fallbacks of data-s="touch.btn.*")
      'GARD': 'DECKUNG',
      'HAFİF': 'LEICHT',
      'SALDIR': 'ANGRIFF',
      'AĞIR': 'SCHWER',
      'ATIL': 'SPRINT',
      'TEKME': 'TRITT',
      // ---------------------------------------------------------------- main menu
      'Sekiz savaşçı, üç arena. Gerçek zamanlı kılıç çarpışması, kılıç kilitlenmesi, savuşturma, denge kırma, Gölge Kesiği ve ragdoll fiziği.': 'Acht Kämpfer, drei Arenen. Klingenduelle in Echtzeit, Klingenbindungen, Paraden, gebrochene Haltung, der Schattenschnitt und Ragdoll-Physik.',
      'İki Oyuncu': 'Zwei Spieler',
      'Aynı klavyede ya da iki gamepad ile kafa kafaya': 'Kopf an Kopf an einer Tastatur oder mit zwei Gamepads',
      'CPU\'ya Karşı': 'Gegen CPU',
      'Ninjanı seç, rakibini yapay zekâ yönetsin': 'Wähle deinen Ninja, die CPU lenkt deinen Rivalen',
      'Zorluk': 'Schwierigkeit',
      'Çırak': 'Lehrling',
      'Usta': 'Meister',
      'Efsane': 'Legende',
      'Aylık Turnuva': 'Monatsturnier',
      'Dan Sınavı': 'Dan-Prüfung',
      'Şampiyonlar Salonu': 'Ruhmeshalle',
      'Seyret': 'Zuschauen',
      'Rastgele iki ninja, Efsane yapay zekâ': 'Zwei zufällige Ninjas, CPU auf Legende',
      'Ses': 'Ton',
      'Müzik': 'Musik',
      'Kan efekti': 'Blut',
      'Tuş ipuçları': 'Tastenhinweise',
      'Yüksek grafik': 'Hohe Grafik',
      // ---------------------------------------------------------------- controls card
      'Kontroller': 'Steuerung',
      '1. Oyuncu': 'Spieler 1',
      '2. Oyuncu': 'Spieler 2',
      'Yürü': 'Gehen',
      'Zıpla': 'Springen',
      'Gard (basılı tut)': 'Deckung (halten)',
      'Hafif kesik (×3 kombo)': 'Leichter Hieb (×3 Combo)',
      'Ağır kesik': 'Schwerer Hieb',
      'Tekme': 'Tritt',
      'Sol Shift': 'Shift links',
      'Sağ Shift': 'Shift rechts',
      'Atılma': 'Sprint',
      'Ki tekniği (ki dolu)': 'Ki-Technik (volles Ki)',
      // ---------------------------------------------------------------- select screen
      'Ninjanı seç': 'Wähle deinen Ninja',
      'Hazır': 'Bereit',
      '1. oyuncunun ninjası': 'Ninja von Spieler 1',
      '2. oyuncunun ninjası': 'Ninja von Spieler 2',
      'Önceki ninja': 'Vorheriger Ninja',
      'Sonraki ninja': 'Nächster Ninja',
      '1. oyuncu kadrosu': 'Kader von Spieler 1',
      '2. oyuncu kadrosu': 'Kader von Spieler 2',
      'Dövüşe başla': 'Kampf beginnen',
      'Geri': 'Zurück',
      'Kilitli': 'Gesperrt',
      'Rastgele': 'Zufall',
      'Hız': 'Tempo',
      'Güç': 'Kraft',
      'Menzil': 'Reichweite',
      'Can': 'Leben',
      // ---------------------------------------------------------------- pause / end
      'Duraklatıldı': 'Pausiert',
      'Devam et': 'Weiter',
      'Maçı yeniden başlat': 'Kampf neu starten',
      'Ana menü': 'Hauptmenü',
      'Rövanş': 'Revanche',
      'Karakter değiştir': 'Kämpfer wechseln',
      'Zafer senin': 'Der Sieg ist dein',
      'Raund': 'Runden',
      'Verilen hasar': 'Verursachter Schaden',
      'Savuşturma': 'Paraden',
      'Ki Saldırısı': 'Ki-Angriffe',
      // ---------------------------------------------------------------- training / leaderboard / misc
      'Antrenman': 'Training',
      'ANTRENMAN': 'TRAINING',
      'Sıralama': 'Bestenliste',
      'Tümü': 'Alle',
      'Ekranı yan çevir': 'Dreh dein Gerät quer',
      'Performans için grafik düşürüldü': 'Grafik für bessere Leistung reduziert',
      // hidden boss pushed into ND.CHARS by arcade.js (safety net; EN.CHARS.shura should carry the same)
      'Kanlı Usta': 'Der Blutmeister',
      'Yolunu kanla çizen iblis usta. Uzun nodachi, yıkıcı darbeler, neredeyse kusursuz savuşturma.': 'Ein Dämonenmeister, der seinen Weg mit Blut zeichnet. Langes Nodachi, vernichtende Hiebe, nahezu makellose Paraden.',
      // ---------------------------------------------------------------- HUD tags (fallbacks when STR.hud is missing)
      'SEN': 'DU',
      'KUKLA': 'PUPPE',
      // ---------------------------------------------------------------- round banners (#bt / #bs)
      'Son raund': 'Letzte Runde',
      'Kazanan her şeyi alır': 'Der Sieger nimmt alles',
      'İlk iki raundu alan kazanır': 'Wer zwei Runden holt, gewinnt',
      'Dövüş!': 'Kämpft!',
      'Süre doldu': 'Zeit abgelaufen',
      'Berabere': 'Unentschieden',
      'Çifte K.O.': 'Doppel-K.O.',
      'Mükemmel': 'Perfekt',
      // blade-lock hint (fallbacks of STR.hud.lockSolo / lockDuo)
      'F / K tuşuna hızlıca bas!': 'F / K hämmern!',
      'Hafif ya da ağır tuşuna hızlıca bas!': 'Leicht oder schwer hämmern!',
      // counter / parry prompt labels under the key ring (ctx.fillText in drawPrompts)
      'KARŞILIK': 'KONTER',
      'SAVUŞTUR': 'PARIEREN',
      // ---------------------------------------------------------------- canvas pop-ups (fx.text)
      'SON VURUŞ!': 'SCHLUSSHIEB!',
      'KİLİTLENDİ!': 'BINDUNG!',
      'İTTİ!': 'STOSS!',
      'DENGE KIRILDI!': 'HALTUNG GEBROCHEN!',
      'GARD KIRILDI!': 'DECKUNG GEBROCHEN!',
      'KESİLDİ!': 'ZERSCHNITTEN!',
      'YANSITMA!': 'REFLEKTIERT!',
      'SAVUŞTURMA!': 'PARIERT!',
      'YAKALANDI!': 'GEFANGEN!',
      'ZIRH!': 'RÜSTUNG!',
      'ARKADAN!': 'VON HINTEN!',
      'DUVAR!': 'WAND!',
      'KAFA!': 'KOPFTREFFER!',
      'KARŞI!': 'KONTERTREFFER!',
      'KRİTİK!': 'KRITISCH!',
      'SÜPÜRME!': 'FEGER!',
      'KARŞILIK!': 'KONTER!',
      'YERE SERİLDİ': 'AM BODEN',
      'ÇARPIŞMA!': 'KLIRR!',
    });

    merge(EN.HTML, {
      // brand title (the game's name stays "Shadow Duel" in every language)
      'Gölge<br><em>Düel</em><em>losu</em>': 'Shadow<br><em>Du</em><em>el</em>',
      // tips list (<ul class="tips">)
      '<b>Savuşturma:</b> darbe gelmeden hemen önce gard tuşuna bas; rakip sendeler.':
        '<b>Parade:</b> Drück die Deckungstaste kurz bevor der Hieb trifft; dein Gegner gerät ins Taumeln.',
      '<b>Karşılık (返し技):</b> gard ya da savuşturmanın hemen ardından saldırı tuşu → anında karşı kesik. <b>İleri</b> + hafif = bacağa süpürme, <b>geri</b> + hafif = yanından dönüp arkadan kesme, <b>ağır</b> = güçlü karşı darbe.':
        '<b>Konter (返し技):</b> Angriff direkt nach Deckung oder Parade → sofortiger Konterhieb. <b>Vor</b> + leicht = Beinfeger, <b>zurück</b> + leicht = Seitenwechsel mit Hieb von hinten, <b>schwer</b> = wuchtiger Konterschlag.',
      '<b>Karşılıklı seri:</b> karşılık da karşılanabilir. Her turda vuruşlar hızlanır ve güçlenir; kendi 3. karşılığın üç vuruşluk sinematik bir bitirişe dönüşür. Seriyi kıran darbe ağır çekimde iner.':
        '<b>Abtausch:</b> Auch Konter lassen sich kontern. Jeder Wechsel wird schneller und härter; dein 3. Konter wird zu einem filmreifen Schlusshieb aus drei Treffern. Der Hieb, der den Abtausch bricht, fällt in Zeitlupe.',
      '<b>Kılıç kilidi:</b> kılıçlar çarpışınca kilitlenebilir. Hafif/ağır tuşuna hızlı basan rakibini iter.':
        '<b>Klingenbindung:</b> Prallen die Klingen aufeinander, können sie sich binden. Wer schneller leicht/schwer hämmert, stößt den anderen weg.',
      '<b>Ki barı</b> vurdukça, yedikçe ve savuşturdukça dolar. Dolunca her ninjanın kendine özgü ki tekniği açılır (Antrenman’daki hareket listesinde görebilirsin).':
        'Die <b>Ki-Leiste</b> füllt sich, wenn du triffst, getroffen wirst und parierst. Ist sie voll, ist die eigene Ki-Technik jedes Ninjas bereit (siehe Techniken im Training).',
      '<b>Atılma + hafif</b> = atılarak kesik. <b>Havada</b> hafif = hava kesiği, ağır = dalış. Ağır kesik yere serer, duvara çarpan geri seker.':
        '<b>Sprint + leicht</b> = Sprinthieb. <b>In der Luft</b> leicht = Lufthieb, schwer = Sturzhieb. Der schwere Hieb wirft zu Boden; wer gegen eine Wand prallt, federt zurück.',
      '<b>Denge çubuğu</b> dolarsa gard kırılır. Tekme gardı delip dengeyi hızla doldurur.':
        'Ist die <b>Haltungsleiste</b> voll, bricht die Deckung. Tritte gehen durch die Deckung und füllen die Haltung schnell.',
      // gamepad note (Esc -> Start or P)
      'Gamepad: X hafif · Y ağır · B tekme · A zıpla · LB gard · RB shuriken · RT atılma · R3 ki tekniği. Start ya da <kbd>P</kbd> duraklatır. CPU modunda her iki tuş seti de seni yönetir.':
        'Gamepad: X leicht · Y schwer · B Tritt · A Springen · LB Deckung · RB Shuriken · RT Sprint · R3 Ki-Technik. Start oder <kbd>P</kbd> pausiert. Im CPU-Modus steuern dich beide Tastensätze.',
      // select / VS hints (Esc -> ⌫)
      '<kbd>Enter</kbd> başlatır · <kbd>⌫</kbd> menüye döner': '<kbd>Enter</kbd> Start · <kbd>⌫</kbd> zurück',
      '<kbd>Enter</kbd> / <kbd>F</kbd> başlatır · <kbd>⌫</kbd> çıkar': '<kbd>Enter</kbd> / <kbd>F</kbd> Start · <kbd>⌫</kbd> verlassen',
    });

    EN.PATTERNS.push(
      // HUD round label (#rlabel) and round banner
      [/^RAUND (\d+)$/, 'RUNDE $1'],
      [/^(\d+)\. Raund$/, 'Runde $1'],
      // canvas pop-ups built from numbers
      [/^(\d+)\. KARŞILIK$/, 'KONTER ×$1'],
      [/^(\d+) VURUŞLUK SERİ!$/, 'ABTAUSCH: $1 TREFFER!'],
      // time-up banner sub: `${name} önde`
      [/^(.+) önde$/, (m, n) => I.t(n) + ' führt'],
      // end screen title: `${Name} kazandı`
      [/^(.+) kazandı$/, (m, n) => I.t(n) + ' gewinnt'],
      // end screen sub line: `${a} – ${b} · ${round} raund · ${arenaName}`
      [/^(\d+) – (\d+) · (\d+) raund · (.+)$/, (m, a, b, r, ar) => `${a} – ${b} · ${r} ${r === '1' ? 'Runde' : 'Runden'} · ${I.t(ar)}`],
    );

    // ================================================================ added with the portal build (PLAY, ads, coach)
    merge(EN.STR, {
      menu: { play: 'Spielen', playSub: (name, lv) => `${name} gegen CPU · ${lv}` },
      first: { play: 'Spielen', sub: 'Ein Tipp und du kämpfst', menu: 'Alle Modi' },
      ads: {
        cont: 'Hier weitermachen', contSub: 'Werbung ansehen · ohne Strafe neu versuchen',
        trial: (name) => `${name} einen Kampf lang testen`, trialSub: 'Werbung ansehen',
        fail: 'Gerade keine Werbung verfügbar, versuch es gleich noch mal',
      },
      coach: {
        attack: (l) => `${l}: Angriff`,
        guard: (l, g) => `${g} halten: Deckung`,
        parry: (l, g) => `${g} kurz vor dem Treffer drücken: Parade`,
        attackT: (l) => `${l} tippen · weiter tippen: Combo`,
        guardT: (l, g) => `${g} halten: Deckung`,
        parryT: (l, g) => `${g} kurz vor dem Treffer tippen: Parade`,
      },
    });

    // ================================================================ VOLUME: sliders on the menu card and in pause (js/volume.js)
    merge(EN.STR, {
      vol: {
        title: 'Lautstärke', master: 'Gesamt', music: 'Musik', sfx: 'Effekte', sound: 'Ton',
        pct: (n) => `${n} %`,
        muted: 'Der Ton ist aus. Beweg einen Regler, um ihn wieder einzuschalten.',
        // Settings > Audio: character / announcer voices switch (js/voice.js) and the courtesy credit under it
        voice: 'Stimmen',
        credit: 'Stimmen: ユーフルカ (youfulca.com) · 効果音ラボ · すぱらんど',
      },
    });

    // ================================================================ TOUCH LAYOUT EDITOR: movement modes + "Customize controls"
    // (js/touch.js settings rows, js/touch-editor.js; Turkish source in i18n.js, block "touch movement modes + layout editor")
    merge(EN.STR, {
      tedit: {
        move: 'Bewegung',
        moves: { float: 'Stick', fixed: 'Fester Stick', dpad: 'Steuerkreuz' },
        mnote: {
          float: 'Der Stick erscheint dort, wo dein Daumen landet.',
          fixed: 'Der Stick bleibt, wo du ihn hinsetzt; drück aus seiner Mitte heraus.',
          dpad: 'Einzelne Tasten: halten zum Gehen, zweimal tippen für Sprint. Zwischen zwei Tasten drücken für beide (▶ + ▲ = Sprung nach vorn).',
          dtap: 'Einzelne Tasten: Kurz auf ◀ ▶ tippen macht einen kleinen Schritt, halten zum Gehen, zweimal tippen für Sprint.',
        },
        dtap: 'Tippen: Schritt',
        edit: 'Steuerung anpassen',
        title: 'Steuerung anpassen',
        hint: 'Zieh eine Taste an eine beliebige Stelle. Tippe sie an für Größe, Deckkraft oder zum Ausblenden.',
        rotate: 'Dreh dein Gerät quer, um die Kampftasten anzuordnen.',
        shapes: { phone: 'Handy', tablet: 'Tablet', portrait: 'Hochformat' },
        screenNote: 'Das Layout wird für dieses Bildschirmformat gespeichert: Handys und Tablets behalten jeweils ihr eigenes.',
        save: 'Speichern', cancel: 'Abbrechen', options: 'Optionen', done: 'Fertig', close: 'Schließen',
        size: 'Größe', sizes: { s: 'S', m: 'M', l: 'L', xl: 'XL' },
        opacity: 'Deckkraft', opacityAll: 'Deckkraft (alle)',
        hide: 'Ausblenden', show: 'Einblenden', hidden: 'Ausgeblendet',
        snap: 'Am Raster ausrichten',
        presets: 'Vorlagen', pRight: 'Rechte Hand', pLeft: 'Linke Hand', pSplit: 'Deckung links',
        reset: 'Standard wiederherstellen', resetDone: 'Standard-Layout ist zurück (gilt nach dem Speichern).',
        overlap: 'Tasten dürfen sich nicht überlappen: an den nächsten freien Platz verschoben.',
        noRoom: 'Dort ist kein Platz: Die Taste ist zurückgesprungen.',
        saved: 'Steuerung gespeichert',
        throwName: 'SHURIKEN',
        pauseName: 'Pause',
        dirs: { dl: '◀ Links', dr: 'Rechts ▶', du: '▲ Sprung', dd: '▼ Deckung' },
      },
    });

    // ================================================================ PROGRESSION: honor, rival challenges, moves panel
    // (arcade.js STR.honor / STR.rival / STR.hint, game.js select screen; rules in js/honor.js)
    merge(EN.STR, {
      menu: { arcadeDesc: 'Besiege deine Rivalen einen nach dem anderen, während die Schwierigkeit steigt – am Ende wartet ein verborgener Meister. Die reichste Quelle für Ehre.' },
      sel: {
        title: { rival: 'Rivalenduell · Wähle deinen Ninja' },
        go: { rival: 'Duell annehmen' },
        moves: 'Techniken',
        movesOf: (name) => `${name} · Techniken`,
        close: 'Schließen',
      },
      hint: {
        honor: (have, need) => `Ehre ${num(Math.min(have, need))}/${num(need)} → Rivalenduell öffnet sich`,
        ready: 'Bereit für die Herausforderung!',
        arenaHonor: (have, need) => `Öffnet sich bei ${num(need)} Ehre (${num(Math.min(have, need))}/${num(need)})`,
      },
      honor: {
        name: 'Ehre',
        head: 'Ehre',
        rows: { win: 'Sieg', loss: 'Angetreten', rounds: 'Gewonnene Runden', perfect: 'Perfekte Runde', rally: 'Konter-Abtausch', counter: 'Konter', parry: 'Parade', rivalWin: 'Rivalenduell', arcadeClear: 'Arcade geschafft' },
        total: (n) => `Ehre: ${num(n)}`,
        next: (name, left) => `Nächster Ninja: ${name} – noch ${num(left)} Ehre`,
        bar: (have, need) => `Ehre ${num(Math.min(have, need))}/${num(need)} → Rivalenduell öffnet sich`,
        ready: (name) => `${name} fordert dich heraus!`,
        readyGo: 'Annehmen',
        all: 'Alle Ninjas freigeschaltet',
        bonus: { arcadeClear: 'Arcade geschafft', tourneyClear: 'Turnier bezwungen', danPass: 'Dan-Prüfung bestanden', rivalWin: 'Rivalenduell gewonnen', tutorial: 'Tutorial geschafft' },
        bonusToast: (n, what) => `+${num(n)} Ehre · ${what}`,
        road: 'Pfad der Ehre',
        roadSub: 'Ehre verdienst du in jedem Einzelspieler-Modus. Erreichst du die Marke eines Ninjas, fordert er dich zum Duell; gewinnst du, schließt er sich dir an.',
        earnHead: 'Woher die Ehre kommt',
        earn: (H) => [
          ['Gegen CPU', `Sieg: Lehrling ${H.win[0]} · Meister ${H.win[1]} · Legende ${H.win[2]}`],
          ['Arcade', `Siege je nach Schwierigkeit · Shura ${H.win[3]} · geschafft +${H.arcadeClear}`],
          ['Turnier & Dan', `Siege ×${H.modeMul.tourney} · Turnier bezwungen +${H.tourneyClear} · jede Dan-Prüfung ab +${H.danPass(1)}`],
          ['Selbst bei Niederlage', `Antreten ${H.loss} · jede gewonnene Runde ${H.roundWon}`],
          ['Gutes Spiel', `Paraden, Konter, Abtausche, perfekte Runden: bis zu +${H.styleCap} pro Kampf`],
        ],
        rivalsHead: 'Rivalen',
        arenasHead: 'Arenen',
        open: 'Freigeschaltet',
        castle: 'Besiege Shura im Arcade-Modus',
        you: (n) => `Deine Ehre: ${num(n)}`,
      },
      rival: {
        stage: 'Rivalenduell',
        selTitle: (name) => `${name} fordert dich heraus · Wähle deinen Ninja`,
        lvHp: (lv, p) => (p === 100 ? lv : `${lv} · Rivalen-LP ${p} %`),
        accept: 'Herausforderung annehmen',
        acceptSub: (name) => `Gewinne, und ${name} gehört zu dir`,
        quit: 'Zurückziehen',
        hud: 'RIVALENDUELL',
        winTitle: (name) => `${name} schließt sich dir an!`,
        winSub: (name) => `${name} steht jetzt in der Auswahl. Probier es gleich aus!`,
        tryNew: (name) => `Als ${name} spielen`,
        lossTitle: 'Die Herausforderung bleibt',
        lossSub: (name, p) => `${name} hat diesmal gewonnen. Eine Niederlage kostet dich nichts; beim nächsten Mal startet der Rivale mit ${p} % Leben.`,
        lossSubMin: (name) => `${name} hat diesmal gewonnen. Eine Niederlage kostet dich nichts; versuch es noch mal.`,
        retry: 'Erneut herausfordern',
        reveal: 'Neuer Ninja',
        toastReady: (name) => `${name} fordert dich heraus!`,
        lines: {
          hana: 'Ich hab von deiner Ehre gehört, der ganze Markt redet über dich! Halt mit meinem Tanz mit, dann komme ich mit dir!',
          tetsu: 'Dein Name ist mir zu Ohren gekommen. Besiege mich, und meine Naginata kämpft an deiner Seite.',
          ren: 'Ha! Endlich ruft mal jemand nach mir! Gewinnst du, gehöre ich dir; verlierst du, darfst du dir mein Lachen anhören!',
          kage: 'Ich beobachte dich schon eine Weile. Fang meinen Schatten, und ich gehöre dir.',
          tora: 'Beweise, dass du keine Beute bist. Entkomm meiner Kette, und ich gehe an deiner Seite.',
          jin: 'Wenn deine Ehre von Herzen kommt, wird mein Stab es wissen. Komm, lass mich dich prüfen.',
          mai: 'Du bist auf meine Bühne eingeladen. Gewinne meinen Applaus, und mein Tanz gehört dir.',
          tsubame: 'Ich habe aus der Ferne zugesehen; du bist gut. Weich meinen Pfeilen aus, und mein Bogen ist mit dir.',
        },
      },
    });

    // ================================================================ COMBAT: new kits, combos, move list (combat designer)
    // Akane/Aoi/Ren/Kage identities, combo counter, ki cancel, ND.MOVELIST names/descriptions (read through ND.i18n.t)
    merge(EN.CHARS, {
      akane: { desc: 'Meisterin des Iaijutsu. Die Klinge ruht in der Scheide, jeder Schnitt ist ein Ziehen; ihre Ziehhaltung fängt ankommende Hiebe ab.', weapon: 'Katana (iai)' },
      aoi: { desc: 'Einhändige Tachi-Fechtkunst des Windes. Weit reichende Stöße und Windschritte überbrücken jede Distanz mit einer einzigen Bewegung.', weapon: 'Tachi' },
      ren: { desc: 'Raufbold mit Oni-Maske. Das Schwert auf der Schulter; kämpft mit Ellbogen, Knien, Schulter und Kopf und zermalmt Deckungen.' },
      kage: { desc: 'Kapuzenschatten. Führt das Ninjatō im Rückhandgriff; kämpft mit Schattenschritten, Finten und Rauchbomben.' },
    });
    merge(EN.TXT, { kiCancel: 'KI-CANCEL!', launch: 'HOCHSCHLAG!', iaiCatch: 'IAI GAESHI!' });
    EN.PATTERNS.push([/^(\d+) VURUŞ$/, '$1 TREFFER']);
    merge(EN.PHRASES, {
      // shared rows
      'Tekme': 'Tritt',
      'Tekme: dengeyi hızla doldurur, gardı kırmaya yarar. Ardından AĞIR ile seri bitirişine bağlanır.': 'Tritt: füllt die Haltung schnell und hilft, Deckungen zu brechen. Mit SCHWER danach wird daraus ein Serienabschluss.',
      'Shuriken fırlatır; zamanla yeniden dolar.': 'Wirft ein Shuriken; sie füllen sich mit der Zeit wieder auf.',
      'Hava kesiği': 'Lufthieb',
      'Havada hafif kesik. Havaya fırlatılmış rakibe de vurur.': 'Ein leichter Hieb in der Luft. Trifft auch einen hochgeschleuderten Gegner.',
      'Dalış': 'Sturzhieb',
      'Havadan aşağı dalış kesiği; yere serer.': 'Ein Sturzhieb aus der Luft; wirft zu Boden.',
      'Kaeshi-waza (karşılık)': 'Kaeshi-waza (Konter)',
      'Gard ya da savuşturmanın hemen ardından karşılık: nötr Suriage, ileri Harai (yere serer), geri Nuki (arkaya geçer), ağır Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.': 'Konter direkt nach Deckung oder Parade: neutral Suriage, vor Harai (wirft zu Boden), zurück Nuki (wechselt hinter den Gegner), schwer Uchiotoshi. Deine dritte Antwort ist der Schlusshieb; wird er pariert, geht der Abtausch weiter.',
      'Fırlatıcı isabet edince HAFİF: rakibin peşinden sıçrayıp havada keser. Ardından AĞIR ile yere çakar. Havadaki rakip en çok üç vuruş alır.': 'Trifft der Hochschlag, LEICHT: Spring dem Gegner nach und schneide in der Luft. Dann schmettert SCHWER ihn zu Boden. Ein Gegner in der Luft nimmt höchstens drei Treffer.',
      'Üç vuruşluk hafif seri. İkinci ve üçüncü vuruş ki doluyken tekniğe bağlanır.': 'Eine leichte Serie aus drei Treffern. Mit vollem Ki lassen sich der zweite und dritte Treffer in die Ki-Technik canceln.',
      'Ağır vuruş: yavaş ama yere serer.': 'Schwerer Schlag: langsam, wirft aber zu Boden.',
      'İleri atılarak dürter; hafif seriye devam eder.': 'Stößt mit einem Ausfall nach vorn; geht in die leichte Serie über.',
      'Yarım adım geri çekilip bacaklara alçak süpürme; yere serer.': 'Ein halber Schritt zurück, dann ein tiefer Feger gegen die Beine; wirft zu Boden.',
      'Fırlatıcı: yükselen kesik rakibi havaya kaldırır.': 'Hochschlag: Ein aufsteigender Schnitt hebt den Gegner in die Luft.',
      'Sıçrayıp tepeden iner: yavaş ama gardı ezer, yere serer.': 'Springt und kommt von oben herab: langsam, zermalmt aber die Deckung und wirft zu Boden.',
      'Atılırken dönerek geniş kesik; yere serer.': 'Ein weiter Drehschnitt aus dem Sprint; wirft zu Boden.',
      'İki kesiklik seri bitirişi; son kesik yere serer.': 'Ein Serienabschluss aus zwei Schnitten; der letzte wirft zu Boden.',
      'Rakibin kılıcını aşağı çarpıp dürter: gardı ezer.': 'Schlägt die gegnerische Klinge nieder und stößt zu: zermalmt die Deckung.',
      // Akane
      'Kından yatay çekiş kesiği, çapraz iniş, geri dönen kesik; kılıç her seferinde kınına döner.': 'Ein waagerechter Ziehschnitt aus der Scheide, ein schräger Schnitt nach unten und ein Rückschnitt; die Klinge kehrt jedes Mal in die Scheide zurück.',
      'Derin çömelişten geniş yatay çekiş; yere serer.': 'Ein weiter waagerechter Ziehschnitt aus tiefer Hocke; wirft zu Boden.',
      'Atılarak kından çekiş: uzak mesafeyi bir anda kapatır, seriye devam eder.': 'Ein Ziehschnitt im Sprint: überbrückt eine weite Distanz im Nu und setzt die Serie fort.',
      'Kılıcı çekmeden kabzayla göğse vurur: hızlı, sersemletir. Ardından HAFİF ile Kesa ya da AĞIR ile Kurenai Renga.': 'Schlägt mit dem Griff gegen die Brust, ohne zu ziehen: schnell und betäubend. Danach LEICHT für Kesa oder SCHWER für Kurenai Renga.',
      'Fırlatıcı: kından yükselen çekiş rakibi havaya kaldırır.': 'Hochschlag: Ein aufsteigender Ziehschnitt aus der Scheide hebt den Gegner in die Luft.',
      'Çekiş duruşu: kısa bir an bekler; bu sırada gelen yakın dövüş darbesini yakalar ve kaçınılmaz bir iai kesiğiyle karşılık verir. Boşa giderse açık kalır.': 'Ziehhaltung: wartet einen Augenblick; ein Nahkampfhieb, der in dieser Zeit eintrifft, wird abgefangen und mit einem unausweichlichen Iai-Schnitt beantwortet. Kommt nichts, steht sie ungedeckt da.',
      'Kesa’dan sonra yükselen ve inen iki çekiş kesiği; son kesik yere serer.': 'Nach Kesa ein aufsteigender und ein fallender Ziehschnitt; der letzte wirft zu Boden.',
      'Tekmeden sonra çömelip rakibin içinden geçen kızıl iai; arkasında belirir.': 'Nach dem Tritt ein geduckter karmesinroter Iai, der mitten durch den Gegner fährt; sie taucht hinter ihm wieder auf.',
      // Aoi
      'Tek elle uzun dürtüş, yukarı savrulan kesik ve rüzgâr adımıyla derin atılma dürtüşü.': 'Ein langer einhändiger Stoß, ein aufschnellender Schnitt und ein tiefer Ausfallstoß auf einem Windschritt.',
      'Dönerek geniş yatay kesik; yere serer.': 'Ein weiter waagerechter Schnitt mit Drehung; wirft zu Boden.',
      'Rüzgâr adımı: çok uzaktan tek hamlede dürter, seriye devam eder.': 'Windschritt: stößt aus großer Entfernung in einer Bewegung zu und setzt die Serie fort.',
      'Geri çekilirken uzun menzilli iniş kesiği: yaklaşanı cezalandırır.': 'Ein weit reichender Schnitt nach unten beim Zurückweichen: bestraft jeden, der näher kommt.',
      'Fırlatıcı: dönerek yükselen kesik rakibi havaya kaldırır.': 'Hochschlag: Ein aufsteigender Drehschnitt hebt den Gegner in die Luft.',
      'Geri sıçrar, ardından çok uzağa uzanan dürtüşle geri döner: gardı ezer, yere serer.': 'Springt zurück und kommt mit einem sehr langen Stoß wieder: zermalmt die Deckung und wirft zu Boden.',
      'Üç hızlı dürtüş; sonuncusu rüzgârla rakibi savurur.': 'Drei schnelle Stöße; der letzte weht den Gegner mit dem Wind davon.',
      'İki kez dönerek çevresini biçen kesik; gardı ezer.': 'Dreht sich zweimal und schneidet rundum; zermalmt die Deckung.',
      // Ren
      'Kesik · Dirsek · Diz': 'Schnitt · Ellbogen · Knie',
      'Tek elle kesik, dirsek darbesi ve uçan diz: kılıçla başlayıp bedenle biter.': 'Ein einhändiger Schnitt, ein Ellbogenstoß und ein fliegendes Knie: beginnt mit dem Schwert, endet mit dem Körper.',
      'İki elle tepeden ezici iniş; gardı zorlar, yere serer.': 'Ein vernichtender beidhändiger Schlag von oben; setzt der Deckung zu und wirft zu Boden.',
      'Omuz hücumu: öne atılıp omuzla çarpar, dengeyi sarsar. İsabet ederse seriye devam eder.': 'Schulterangriff: stürmt vor und rammt mit der Schulter, erschüttert die Haltung. Bei Treffer geht die Serie weiter.',
      'Kafa atar: kısa menzil, uzun sersemletme. İsabet ederse seriye devam eder.': 'Kopfstoß: kurze Reichweite, lange Betäubung. Bei Treffer geht die Serie weiter.',
      'Fırlatıcı: aşağıdan yukarı iki elle savrulan kesik.': 'Hochschlag: ein beidhändiger Schnitt von unten nach oben.',
      'Topuğu havaya kaldırıp balta gibi indirir: yere serer.': 'Hebt die Ferse hoch und lässt sie wie eine Axt niedersausen: wirft zu Boden.',
      'Dirsekten sonra kesik ve tepeden ezici iniş; son vuruş yere serer.': 'Nach dem Ellbogen ein Schnitt und ein vernichtender Schlag von oben; der letzte Treffer wirft zu Boden.',
      'Tekmenin ardından dönen topuk tekmesi; yere serer.': 'Nach dem Tritt ein gedrehter Fersentritt; wirft zu Boden.',
      // Kage
      'Ters tutuşla kesik, dönen kesik ve gölge adımı: kaybolup öne geçer, dürterek belirir.': 'Ein Schnitt im Rückhandgriff, ein Drehschnitt und ein Schattenschritt: verschwindet, gleitet nach vorn und taucht stoßend wieder auf.',
      'Sıçrayıp ters tutuşla aşağı saplar; yere serer.': 'Springt und sticht im Rückhandgriff nach unten; wirft zu Boden.',
      'Gölge gibi uzun atılma kesiği; seriye devam eder.': 'Ein langer Sprintschnitt wie ein Schatten; setzt die Serie fort.',
      'Aldatma: kesecekmiş gibi parlar, dumanla geri kaçar. Erken savuşturmayı boşa çıkarır; hemen HAFİF ile gölge adımına, AĞIR ile Kage-nui’ye bağlanır.': 'Finte: blitzt auf wie vor einem Schnitt und weicht dann im Rauch zurück. Lässt eine frühe Parade ins Leere laufen; geht sofort mit LEICHT in den Schattenschritt oder mit SCHWER in Kage-nui über.',
      'Fırlatıcı: ters tutuşla yükselen kesik.': 'Hochschlag: ein aufsteigender Schnitt im Rückhandgriff.',
      'Ayağının dibine sis bombası atar: yakındakini sersemletir, Kage dumanın içinde geri kaçar.': 'Wirft eine Rauchbombe vor die eigenen Füße: betäubt jeden in der Nähe, während Kage im Rauch zurückweicht.',
      'Üç hızlı ters kesik ve aşağı saplama; sonuncusu yere serer.': 'Drei schnelle Rückhandschnitte und ein Stich nach unten; der letzte wirft zu Boden.',
      'Tekmeden sonra dumanda kaybolur, rakibin arkasında belirip saplar.': 'Verschwindet nach dem Tritt im Rauch, taucht hinter dem Gegner auf und sticht zu.',
      // template row names
      'Nodachi serisi': 'Nodachi-Serie', 'Ağır nodachi': 'Schweres Nodachi', 'Kodachi serisi': 'Kodachi-Serie', 'Ağır kesik': 'Schwerer Hieb',
      'Tantō dansı': 'Tantō-Tanz', 'Çift kesik': 'Doppelschnitt', 'Naginata serisi': 'Naginata-Serie', 'Ağır savuruş': 'Schwerer Schwung',
      'Zincir ve orak': 'Kette und Sichel', 'Zincir çekişi': 'Kettenzug', 'Asa serisi': 'Stab-Serie', 'Ağır süpürme': 'Schwerer Feger',
      'Yelpaze serisi': 'Fächer-Serie', 'Rüzgâr dalgası': 'Windwelle', 'Tantō serisi': 'Tantō-Serie', 'Ok (basılı tut: güçlü)': 'Pfeil (halten: stark)',
      'Geri + AĞIR da ok atar (basılı tut: güçlü atış); ok kalmadıysa tantō ile tepeden iner.': 'Zurück + SCHWER schießt ebenfalls einen Pfeil (halten für einen starken Schuss); ohne Pfeile kommt sie mit dem Tantō von oben herab.',
      // combat pop-ups
      'KI İPTALİ!': 'KI-CANCEL!', 'HAVAYA!': 'HOCHSCHLAG!',
    });

    // ================================================================ COUNTER CINEMATIC + COMBO TRIAL (combat feel pass)
    // js/kaeshi-cine.js STR.kaeshi, js/combo-trial.js STR.trial, js/coach.js combo/counter tips, move list legend
    {
      const tb = (t, c) => `<i class="tb${c ? ' ' + c : ''}">${t}</i>`;
      merge(EN.STR, {
        kaeshi: {
          head: 'KAESHI-WAZA', strike: 'SCHLAG ZU!', hits: 'TREFFER',
          labels: {
            suriage: 'Klinge hochgleiten lassen, schräg abwärts schneiden',
            harai: 'Klinge beiseiteschlagen, in die Beine schneiden',
            nuki: 'Dem Hieb entgleiten, von hinten schneiden',
            uchiotoshi: 'Klinge niederschlagen, durchstoßen',
            sandan: "Konterfolge aus drei Schnitten",
          },
        },
        trial: {
          title: 'Combo-Übung',
          btn: { prev: 'Vorherige Combo', next: 'Nächste Combo', retry: 'Von vorn', close: 'Schließen' },
          names: { chain: 'Grundserie', s1: 'Serienabschluss', s2: 'Tritt-Serie', launch: 'Hochschlag', s3: 'Lange Combo' },
          desc: {
            chain: '{L} dreimal. Drück jeweils, sobald der vorige Treffer sitzt; die Serie endet in einem benannten Abschluss.',
            s1: '{L} zweimal, dann {H}: Die Serie endet mit einem schweren Schnitt.',
            s2: '{L}, Tritt {K}, dann {H}.',
            launch: '{D} + {H} schleudert hoch; solange der Gegner fliegt, {L}, dann {H}.',
            s3: 'Zweimal {L}, {D} + {H} zum Hochschleudern, {L}, {H}: fünf Treffer.',
          },
          ready: (w) => `Los: ${w}`,
          startWith: (w) => `Diese Combo beginnt mit ${w}.`,
          early: 'Zu früh: Drück, sobald der vorige Treffer sitzt.',
          late: 'Zu spät: Drück, bevor die Bewegung endet – genau wenn der Treffer sitzt.',
          wrong: (got, want) => `Falsche Taste: ${got}, dieser Schritt braucht ${want}.`,
          dir: (want) => `Richtung fehlt: ${want}. Halte die Richtung, dann drück.`,
          miss: 'Daneben: Der Treffer saß nicht. Geh näher an die Puppe.',
          clear: 'COMBO GESCHAFFT!', clearPop: 'COMBO GESCHAFFT!',
          all: 'Alle Combo-Übungen dieses Ninjas geschafft!',
        },
        coach: {
          combo: (l) => `${l} ${l} ${l} schnell: 3er-Combo`,
          comboT: (l) => `${l} dreimal hintereinander tippen: Combo`,
          counter: (l) => `Nach Deckung oder Parade ${l} drücken, sobald SCHLAG ZU! erscheint: Konter`,
          counterT: (l) => `Nach Deckung oder Parade ${l} tippen, sobald SCHLAG ZU! erscheint`,
        },
      });
      const L = Array.isArray(EN.STR.lessons) && EN.STR.lessons.find((l) => l.id === 'counter');
      if (L) L.d = 'Nach Deckung oder Parade erscheint <b>SCHLAG ZU!</b> über deinem Kopf: Drück <kbd>F</kbd>, bevor der Balken abläuft. Vor/zurück + <kbd>F</kbd> oder <kbd>G</kbd> sind weitere Konter.';
      if (EN.STR.lessonsTouch) EN.STR.lessonsTouch.counter = `Nach Deckung oder Parade erscheint <b>SCHLAG ZU!</b> über deinem Kopf: Tippe ${tb('ANGRIFF', 'tb-light')}, bevor der Balken abläuft. Stick vor/zurück + ${tb('ANGRIFF', 'tb-light')} oder ${tb('SCHWER')} sind weitere Konter.`;
      merge(EN.PHRASES, {
        'KOMBO TAMAM!': 'COMBO GESCHAFFT!',
        'Nasıl okunur': 'So liest du es',
        '→ rakibe doğru, ← rakipten uzağa demek: o yön tuşunu (A / D ya da ok tuşları; rakip sağındaysa D) basılı tut ve saldırı tuşuna bas. Virgül: tuşlara sırayla bas. F hafif, G ağır, R tekme, S gard.':
          '→ heißt zum Gegner hin, ← von ihm weg: Halte diese Richtungstaste (A / D oder die Pfeiltasten; D, wenn der Gegner rechts von dir steht) und drück die Angriffstaste. Ein Komma: Drück die Tasten nacheinander. F leicht, G schwer, R Tritt, S Deckung.',
        '▶ rakibe doğru, ◀ rakipten uzağa: yön çubuğunu o yana itip düğmeye dokun. Virgül: düğmelere sırayla dokun. Antrenmandaki Kombo denemesi her seriyi adım adım gösterir.':
          '▶ zum Gegner hin, ◀ von ihm weg: Drück den Stick in diese Richtung und tippe die Taste. Ein Komma: Tippe die Tasten nacheinander. Die Combo-Übung im Training zeigt jede Serie Schritt für Schritt.',
        'Gard ya da savuşturmanın ardından ekranda VUR! çıkar: altındaki çubuk bitmeden HAFİF’e bas. Yalnız HAFİF: Suriage. İleri + HAFİF: Harai (yere serer). Geri + HAFİF: Nuki (arkaya geçer). AĞIR: Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.':
          'Nach Deckung oder Parade erscheint SCHLAG ZU!: Drück LEICHT, bevor der Balken abläuft. Nur LEICHT: Suriage. Vor + LEICHT: Harai (wirft zu Boden). Zurück + LEICHT: Nuki (wechselt hinter den Gegner). SCHWER: Uchiotoshi. Deine dritte Antwort ist der Schlusshieb; wird er pariert, geht der Abtausch weiter.',
      });
    }

    // ================================================================ GRAPHICS QUALITY: the Graphics setting (js/gfx.js)
    // (Turkish source in i18n.js, block "graphics quality")
    merge(EN.STR, {
      gfx: {
        title: 'Grafik',
        levels: { auto: 'Auto', high: 'Hoch', medium: 'Mittel', low: 'Niedrig' },
        note: {
          auto: 'Wählt passend zum Gerät und senkt sich selbst, wenn ein Kampf ruckelt.',
          high: 'Alle Lichter und Effekte. Für starke Geräte.',
          medium: 'Leichtes Leuchten, keine Schatten. Für die meisten Handys.',
          low: 'Am flüssigsten. Für ältere Handys.',
        },
        now: (lv) => `Jetzt: ${lv}`,
      },
    });

    // ================================================================ FRAME RATE: Settings → Graphics (js/gfx.js makePacer)
    // (Turkish source in i18n.js, block "frame rate"; the numbers themselves are not translated)
    merge(EN.STR, {
      fps: {
        title: 'Bildrate',
        show: 'FPS anzeigen',
        levels: { max: 'Max' },
        note: {
          60: 'Gleichmäßig und kühl. Für die meisten Handys am besten.',
          90: 'Flüssiger, wenn der Bildschirm es kann. Braucht mehr Akku.',
          120: 'Am flüssigsten auf 120-Hz-Bildschirmen. Braucht mehr Akku.',
          max: 'So schnell, wie dein Bildschirm es erlaubt.',
        },
      },
    });

    // ================================================================ SETTINGS SCREEN (js/settings.js; Turkish source in i18n.js)
    merge(EN.STR, {
      set: {
        title: 'Einstellungen', close: 'Schließen',
        tabs: { audio: 'Ton', controls: 'Steuerung', gfx: 'Grafik', lang: 'Sprache' },
        touch: 'Touch', keys: 'Tastatur', pad: 'Gamepad',
        touchNote: 'Die Touch-Einstellungen erscheinen hier, sobald du den Bildschirm berührst.',
      },
    });

    // ================================================================ LANGUAGE PICKER (js/lang-ui.js; Turkish source in i18n.js)
    // Language names are not translated: each one is written in its own language (ND.i18n.names).
    merge(EN.STR, { lang: { title: 'Sprache', change: 'Sprache ändern', close: 'Schließen' } });

    // ================================================================ SHARED LABELS (static HTML / move list text that is the same word in Turkish)
    merge(EN.PHRASES, { 'Shuriken': 'Shuriken', 'KI': 'KI' });

    // ================================================================ TOUCH HELP PER MOVEMENT MODE
    // (game.js touchHelp(): the menu's touch help follows the movement mode; Turkish source in i18n.js)
    merge(EN.STR, {
      thelp: {
        title: { float: 'Joystick', fixed: 'Fester Joystick', dpad: 'Steuerkreuz' },
        float: { walk: 'Daumen auf die freie Hälfte legen und schieben: gehen', jump: 'Nach oben drücken: springen', guard: 'Nach unten ziehen: Deckung', dash: 'Zweimal kurz zur Seite schnippen: Sprint' },
        fixed: { walk: 'Stick in der Mitte fassen und zur Seite drücken: gehen', jump: 'Nach oben drücken: springen', guard: 'Nach unten ziehen: Deckung', dash: 'Zweimal kurz zur Seite schnippen: Sprint' },
        dpad: {
          walk: 'Halten: gehen', step: 'Kurz tippen: ein kleiner Schritt', jump: 'Tippen: springen', guard: 'Halten: Deckung',
          dash: 'Doppeltippen: Sprint', both: 'Zwischen zwei Tasten drücken löst beide aus (▶ + ▲ = Sprung nach vorn)',
        },
        edit: (b) => `${b}: Zieh jede Taste, wohin du willst, und stell Größe und Deckkraft ein. Unter Einstellungen → Steuerung.`,
      },
    });

    // Persistent character journeys.
    merge(EN.STR, { menu: { arcadeDesc: "Acht Kämpfe für jeden Ninja. Setze beim nächsten Gegner fort und schalte das Charakterende und das Meistersiegel frei." }, sel: { title: { arcade: "Arcade · Charakterreise" } },
      journey: {
        start: "Reise beginnen",
        resume: (i, n) => "Fortsetzen · " + i + "/" + n + "",
        ending: "Ende ansehen",
        replay: "Reise wiederholen",
        badge: "Meistersiegel",
        completed: "Reise abgeschlossen",
        progress: (i, n) => "" + i + "/" + n + " Kämpfe abgeschlossen · Fortschritt gespeichert",
        reward: "Belohnung: Charakterende und dauerhaftes Meistersiegel",
        saved: "Jeder Sieg wird gespeichert. Ein Kampfabbruch zählt als neuer Versuch.",
        menu: (done, active) => "" + done + " Reisen abgeschlossen · " + active + " laufen",
        clearReward: "Meistersiegel erhalten · Charakterende freigeschaltet"
      }
    });

    void dec; void fmtTime; void num;
  };
})(window.ND);
