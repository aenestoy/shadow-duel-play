

















(function (ND) {
  'use strict';
  (ND.I18N_CATALOGS || (ND.I18N_CATALOGS = {}))['it'] = function (I, EN) {
    const merge = I.merge;
    const num = (n) => I.num(n);
    const dec = (x) => I.dec(x);
    const fmtTime = (s) => I.time(s);


    merge(EN.STR, {
      menu: {
        brand: (nc, na) => `${nc} lottatori, ${na} arene e un maestro nascosto. Scontri di spada in tempo reale, incroci di lame, parate, rotture di postura, tecniche ki e fisica ragdoll.`,
        arcade: 'Arcade',
        arcadeDesc: 'Batti i rivali uno a uno mentre la difficoltà sale: alla fine ti aspetta un maestro nascosto. Vinci per sbloccare nuovi ninja e arene.',
        arcadeProg: (best, c, ct, a, at) => `${best ? 'Record ' + num(best) + ' · ' : ''}${c}/${ct} ninja · ${a}/${at} arene sbloccate`,
        train: 'Allenamento',
        trainDesc: 'Allenati liberamente sul manichino o impara passo dopo passo',
        trainFree: 'Libero',
        trainTut: 'Tutorial',
        watchShort: 'Due ninja a caso, IA Leggenda',
        specialKey: 'Tecnica ki (ki pieno)',
        single: 'Incontro singolo', singleDesc: 'Contro la CPU o in due',
      },
      sel: {
        title: { '2p': 'Scegli il tuo ninja', cpu: 'Scegli il tuo ninja', arcade: 'Arcade · Scegli il tuo ninja', train: 'Allenamento · Scegli il tuo ninja', tutorial: 'Tutorial · Scegli il tuo ninja', tourney: 'Torneo mensile · Scegli il tuo ninja', dan: 'Prova Dan · Scegli il tuo ninja' },
        who1: { '2p': 'Giocatore 1 · A / D per scegliere, F per confermare', def: 'Tu · A / D per scegliere, F per confermare' },
        who2: { '2p': 'Giocatore 2 · ← / → per scegliere, K per confermare', cpu: 'Avversario (CPU) · ← / → per scegliere', train: 'Manichino · ← / → per scegliere' },
        go: { def: 'Combatti', arcade: 'Inizia Arcade', train: 'Inizia', tutorial: 'Inizia tutorial', tourney: 'Inizia torneo', dan: 'Inizia la prova' },
        random: 'Casuale',
        arena: 'Arena',
        locked: 'Bloccato',
        lockMsg: (name, hint) => `${name} bloccato · ${hint}`,
        keyHint: '<kbd>Enter</kbd> inizia · <kbd>⌫</kbd> indietro',
      },
      hint: {
        wins: (n, cur) => `Vinci ${n} incontri in Arcade (${Math.min(cur, n)}/${n})`,
        clear: 'Completa l’Arcade una volta',
        boss: 'Batti il boss finale in Arcade',
        arena: 'Vinci un incontro in questa arena in Arcade',
      },
      toast: {
        newChar: (name) => `Nuovo lottatore sbloccato: ${name}`,
        newArena: (name) => `Nuova arena sbloccata: ${name}`,
        newBest: (s) => `Nuovo record: ${num(s)} punti`,
        lesson: (t) => `Lezione completata: ${t}`,
        tutDone: 'Tutorial completato!',
        perf: 'Grafica ridotta per le prestazioni',
      },
      vs: {
        stage: (i, n) => `Incontro ${i} / ${n}`,
        boss: 'Incontro finale',
        go: 'Combatti!',
        quit: 'Esci dall’Arcade',
        keys: '<kbd>Enter</kbd> / <kbd>F</kbd> inizia · <kbd>⌫</kbd> esci',
        unknown: '?',
      },
      hud: { you: 'TU', cpu: 'CPU', dummy: 'MANICHINO', stage: (i, n) => `${i}/${n}`, boss: 'BOSS FINALE', inf: '∞', lockSolo: 'Martella F / K!', lockDuo: 'Martella leggero o pesante!' },
      end: {
        rematch: 'Rivincita', change: 'Cambia lottatore', menu: 'Menu principale',
        winTitle: 'La vittoria è tua',
        winSub: (i, n, pts) => `Incontro ${i}/${n} superato · +${num(pts)} punti`,
        next: 'Prossimo incontro',
        bossNext: 'Verso la fine',
        lossTitle: 'Sconfitta',
        lossSub: (name) => `${name} stavolta ha avuto la meglio. Riprova.`,
        retry: 'Riprova',
        quit: 'Esci dall’Arcade',
      },
      ending: {
        head: 'Finale',
        rows: { fights: 'Incontri', time: 'Tempo totale', retries: 'Tentativi', perfect: 'Round perfetti', score: 'Punteggio', best: 'Record' },
        newBest: 'Nuovo record!',
        menu: 'Menu principale',
        again: 'Gioca ancora',
        unlocked: 'Sbloccato',
        fightPts: 'Punti incontro',
        bonus: 'Bonus completamento',
      },
      score: {
        hud: 'PUNTI',
        rows: { hit: 'Colpi', combo: 'Combo', counter: 'Contrattacco', defense: 'Difesa', pressure: 'Pressione', special: 'Tecnica ki', round: 'Vittoria', perfect: 'Perfetto', hp: 'Vita residua', time: 'Bonus tempo' },
        total: 'Punteggio incontro',
        diff: (name, m) => `incl. ${name} ×${dec(m)}`,
        best: (s) => `Il tuo record: ${num(s)}`,
        newBest: 'Nuovo record!',
        arcadeTotal: (s) => `Totale Arcade: ${num(s)}`,
        lossNote: (s, pen) => `Questo tentativo non conta · totale Arcade ${num(s)} · ogni nuovo tentativo −${num(pen)}`,
        clearBonus: (c, n) => `+${num(c)}${n ? ' · senza ritentare +' + num(n) : ''}`,
        lossCpu: 'Sconfitta · in classifica vanno solo le vittorie',
        cpuBoardHint: 'Le vittorie a difficoltà Leggenda vanno in classifica',
      },
      lb: {
        menu: 'Classifica',
        menuDesc: 'Record Arcade e Leggenda',
        title: 'Classifica',
        back: 'Indietro',
        boards: { arcade: 'Arcade', cpu_efsane: 'CPU Leggenda' },
        boardDesc: { arcade: 'Punteggio totale di una partita Arcade completata', cpu_efsane: 'Punteggio di un singolo incontro vinto contro la CPU Leggenda' },
        all: 'Tutti',
        status: { loading: 'Caricamento…', online: 'Classifica online', readonly: 'Classifica online · sola lettura', local: 'Classifica locale', error: 'Errore · classifica locale', offline: 'Offline · classifica locale' },
        empty: 'Ancora nessun punteggio. Sii il primo!',
        loadErr: 'Impossibile caricare la classifica.',
        you: 'Tu', youTag: 'tu', player: 'Giocatore',
        nick: 'Nickname', nickPh: 'Il tuo nickname', nickSave: 'Salva', nickEdit: 'Cambia',
        nickAsk: 'Nickname per la classifica locale:',
        saving: 'Salvataggio…',
        savedOnline: (r) => `Posizione online: #${r}`,
        savedOnlineNoRank: 'Salvato nella classifica online',
        savedOnlineAll: (r) => `Posizione online di sempre: #${r}`,
        platSignIn: 'Accedi per pubblicare i tuoi punteggi online',
        platPending: 'Salvato su questo dispositivo · accedi per pubblicarlo nella classifica online',
        savedOnlineGap: (r, g) => `Posizione online: #${r} · ${g} punti dalla top 10`,
        reason: {
          needName: 'Scegli un nickname per entrare nella classifica online',
          offline: 'Nessuna connessione: il punteggio è conservato e verrà inviato quando torni online',
          rate: 'Troppi invii: il punteggio verrà inviato a breve',
          daily: 'Limite giornaliero di invii raggiunto: punteggio salvato solo in locale',
          week: 'Il mese è finito: questo punteggio non conta per il nuovo mese',
          invalid: 'Punteggio non valido',
        },
        nickErr: {
          nick_length: 'Il nickname deve avere 3–16 caratteri',
          nick_chars: 'Usa solo lettere, cifre, spazi e _ . - (almeno una lettera)',
          nick_bad: 'Questo nickname non è consentito, provane un altro',
          rate_limited: 'Aspetta un attimo e riprova',
        },
        nickErrDef: 'Impossibile salvare il nickname',
        nickAskOnline: 'Nickname per la classifica online:',
        savedLocal: (r) => (r ? `#${r} nella classifica locale` : 'Salvato nella classifica locale'),
        rejected: 'Impossibile salvare il punteggio: solo classifica locale',
        quota: 'La classifica online è piena: punteggio salvato solo in locale',
        open: 'Classifica',
        keys: '<kbd>←</kbd> <kbd>→</kbd> classifica · <kbd>↑</kbd> <kbd>↓</kbd> ninja · <kbd>⌫</kbd> indietro',
      },
      bz: {
        back: 'Indietro', toMenu: 'Menu principale', you: 'Tu', youTag: 'tu', newBest: 'Nuovo record!', seeResult: 'Vedi risultato',
        resetIn: 'Si azzera tra',

        left: (ms) => { const t = Math.floor(ms / 1000), d = Math.floor(t / 86400), hh = Math.floor((t % 86400) / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60; return d ? `${d}g ${hh}h ${mm}m` : hh ? `${hh}h ${mm}m` : `${mm}m ${ss}s`; },
        leftShort: (ms) => { const t = Math.floor(ms / 60000), d = Math.floor(t / 1440), hh = Math.floor((t % 1440) / 60), mm = t % 60; return d ? `${d}g ${hh}h` : hh ? `${hh}h ${mm}m` : `${mm}m`; },
        weekName: (m, y) => `${['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'][m - 1] || m} ${y}`,
        monthName: (m) => ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'][m - 1] || String(m),
        rank: (r) => (r <= 0 ? 'Senza grado' : r <= 10 ? `Kyu ${11 - r}` : `Dan ${r - 10}`),
        fightOf: (i, n) => `Incontro ${i}/${n}`,
        hpBonus: (p) => `Vita nemica +${p}%`,
        mirrorOpp: 'Specchio · il tuo stesso ninja',
        suddenSub: 'Un solo round · chi cade per primo perde',
        rows: { fights: 'Vittorie', time: 'Tempo', fightPts: 'Punti incontro', stage: 'Bonus tappa', clear: 'Bonus completamento', total: 'Punteggio torneo', weekBest: 'Il tuo record del mese' },
        mods: {
          rally2x: { n: 'Fuoco incrociato', d: 'Danno da contrattacco ×2' },
          fullKi: { n: 'Ki pieno', d: 'Ogni round inizia col ki pieno' },
          sudden: { n: 'Morte improvvisa', d: 'Un solo round; entrambi partono con metà vita' },
          mirror: { n: 'Specchio', d: 'L’avversario è il tuo stesso ninja' },
          parryOnly: { n: 'Solo contrattacchi', d: 'I colpi normali fanno il 25% dei danni; contrattacchi ×1,5' },
          posture2x: { n: 'Postura fragile', d: 'Danno alla postura ×2: le guardie cedono in fretta' },
          shuriken3x: { n: 'Tempesta di shuriken', d: 'Shuriken triplicati' },
          kiRush: { n: 'Pioggia di ki', d: 'Il ki si riempie al doppio della velocità' },
          glass: { n: 'Lama di vetro', d: 'Tutti i danni ×1,5' },
        },
        menu: {
          tour: 'Torneo mensile', dan: 'Prova Dan', hall: 'Sala dei Campioni',
          tourRank: (p, left) => `Questo mese: #${p} · si azzera tra ${left}`,
          tourBest: (b, left) => `Il tuo record ${b} · si azzera tra ${left}`,
          tourNew: (left) => `Gli stessi 8 incontri per tutti · si azzera tra ${left}`,
          danRank: (name, next) => (next ? `Il tuo grado: ${name} · prossimo: ${next}` : `Il tuo grado: ${name} · sei in vetta`),
          danNew: '20 prove da Kyu 10 a Dan 10',
          hallRank: (p) => `Questo mese #${p} · record`,
          hallDesc: 'La top 10 del mese e i record di sempre',
          nick: (n) => (n ? `Nickname: ${n}` : 'Scegli un nickname'),
          champTitle: 'La top 10 del mese', champLocal: 'Top 10 su questo dispositivo', champEmpty: 'Sii il primo nella classifica del mese', champLoading: 'Caricamento dei leader…',
          champAll: 'Top 10 di sempre', champAllEmpty: 'Sii il primo nella classifica online',
          champLast: (n) => `Campione del mese scorso: ${n}`, champOpen: 'apri la classifica mensile',
        },
        t: {
          title: 'Torneo mensile', head: 'Torneo',
          runNote: (s, st) => `Totale torneo: ${num(s)} (incl. +${num(st)} per vittoria)`,
          lossSub: (name, won) => `${name} ha fermato la tua corsa · ${won} vittorie`,
          lossNote: (s) => `Questo incontro non conta · punteggio torneo ${num(s)}`,
          quit: 'Chiudi il torneo',
          myBest: (b, a) => `Il tuo record del mese: ${b} punti · ${a} tentativi`,
          noTry: 'Ancora nessun tentativo questo mese.',
          place: (p, t) => (t ? `#${p} / ${t}` : `#${p}`),
          rules: (n, clear, stage) => `${n} incontri; gli stessi avversari, arene e regole per tutti. Una sconfitta chiude il tentativo; i tentativi sono illimitati e conta il migliore. Ogni vittoria +${stage}, batterli tutti +${clear}.`,
          start: 'Scegli il tuo ninja e inizia', again: 'Riprova', go: 'Entra nel torneo',
          clearTitle: 'Torneo conquistato', overTitle: 'Tentativo finito',
          savedToast: (s) => `Punteggio torneo salvato: ${s}`,
        },
        d: {
          title: 'Prova Dan', head: 'Prova Dan',
          sub: 'Supera ogni prova per salire di grado. Il tuo grado appare accanto al nome nelle classifiche.',
          trialOf: (n) => `Prova ${n}`,
          runNote: (i, n) => `Prova: ${i}/${n} incontri vinti`,
          lossSub: (name) => `${name} ha fermato la tua prova.`,
          lossNote: 'Prova fallita',
          quit: 'Lascia la prova',
          yourRank: 'Il tuo grado', bestWas: (n) => `Massimo: ${n}`, ladder: 'Scala dei gradi',
          nextTrial: (n) => `Prossima: prova ${n}`,
          fights: (n) => `${n} ${n === 1 ? 'incontro' : 'incontri'}`,
          bossLast: 'Incontro finale: Shura',
          strikes: (left, max) => `Possibilità: ${left}/${max} · ${max} prove fallite ti fanno scendere di un grado`,
          safe: 'A questo grado, una prova fallita non ti fa scendere.',
          maxed: 'In vetta: Dan 10', maxedSub: 'Il tuo nome guida la classifica Dan.',
          start: 'Scegli il tuo ninja e affronta la prova', next: 'Prossima prova', go: 'Affronta la prova',
          promoted: (n) => `Promosso: ${n}`, demoted: (n) => `Retrocesso: ${n}`, failed: 'Prova fallita',
          promotedSub: (a, b) => `${a} → ${b}`, demotedSub: 'Tre prove fallite. Risali!', tryAgain: 'Riprova: il tuo grado è al sicuro.',
          toast: (n) => `Nuovo grado: ${n}`, leftToast: 'Prova abbandonata: conta come fallita',
        },
        hall: {
          title: 'Sala dei Campioni',
          tabs: { week: { n: 'Questo mese' }, alltime: { n: 'Di sempre' }, archive: { n: 'Campioni' }, chars: { n: 'Ninja' }, dan: { n: 'Dan' } },
          desc: { alltime: 'I migliori di sempre del Torneo mensile', archive: 'La top 10 di ogni mese concluso resta incisa qui per sempre', chars: 'Detentore del record per ogni ninja · tocca un ninja per vedere la top 20', dan: 'I gradi più alti' },
          loading: 'Caricamento…', error: 'Impossibile caricare la classifica.', retry: 'Riprova',
          empty: 'Ancora nessuno. Sii il primo!', emptyDan: 'Ancora nessun giocatore con un grado.', emptyArchive: 'Ancora nessun mese concluso. I titoli partono dal torneo di ottobre 2026; i suoi campioni verranno incisi alla chiusura, il 1º novembre.', emptyArchiveLocal: 'Ancora nessun mese concluso su questo dispositivo.',
          anon: 'Giocatore',
          meTop: (p, s) => `Tu: #${p} · ${s} punti · sei nella top 10!`,
          meGap: (p, g, s) => `Tu: #${p} · ${s} punti · ${g} punti dalla top 10`,
          meNone: 'Ancora nessun punteggio questo mese.',
          meDan: (p, n) => `Tu: #${p} · ${n}`,
          meDanLocal: (n) => `Il tuo grado: ${n}`, meNoDan: 'Ancora nessun grado. Prima prova: Kyu 10.',
          noRecord: 'Nessun record', allNinjas: 'Tutti i ninja',
          pending: (n) => `Voci in attesa di invio: ${n}`,
          classic: 'Classifiche Arcade · Leggenda',
        },

        ttl: {
          champ: 'Campione del mese', finalist: 'Finalista',
          reward: 'Dal torneo di ottobre 2026, i primi 3 di ogni mese ottengono un titolo permanente. Il campione vince anche i colori Campione esclusivi per il ninja che ha usato. Per i titoli servono almeno 5 giocatori nel mese.',
          hall: 'Da ottobre 2026: i primi 3 di ogni mese ottengono un titolo permanente (min. 5 giocatori) · il campione vince i colori Campione',
          local: 'I tuoi punteggi del torneo restano su questo dispositivo.',
          colors: 'Colori Campione',
          how: 'Vinci un Torneo mensile con questo ninja',
          unlocked: (name) => `Campione del mese! Colori Campione di ${name} sbloccati`,
          newTitle: (t) => `Nuovo titolo: ${t}`,
        },
      },
      train: {
        title: 'Allenamento', tutTitle: 'Tutorial',
        dummy: 'Manichino',
        beh: { idle: 'Fermo', guard: 'Guardia', attack: 'Attacca', counter: 'Contrattacca' },
        infHp: 'Vita infinita', fullKi: 'Ki pieno',
        reset: 'Riposiziona',
        hide: 'Nascondi', show: 'Pannello',
        moves: 'Lista mosse',
        lessons: 'Lezioni',
        lessonOf: (i, n) => `Lezione ${i}/${n}`,
        done: 'Tutorial completato! Imposta il manichino come preferisci e allenati liberamente.',
        progress: (a, b) => `${a}/${b}`,
        keysHelp: '<kbd>1</kbd>–<kbd>4</kbd> manichino · <kbd>⌫</kbd> riposiziona · <kbd>H</kbd> pannello',
        specialFallback: { kanji: '影斬り', name: 'Taglio d’ombra', desc: 'Un fendente fulmineo che trapassa l’avversario da parte a parte.', tip: '' },
        kiFull: 'ki pieno',
        counterTip: 'Come rispondere',
      },
      moves: [
        ['<kbd>A</kbd><kbd>D</kbd>', 'Cammina', 'doppio tocco: scatto'],
        ['<kbd>W</kbd>', 'Salto', ''],
        ['<kbd>F</kbd><kbd>F</kbd><kbd>F</kbd>', 'Combo leggera ×3', 'il terzo colpo respinge'],
        ['<kbd>G</kbd>', 'Fendente pesante', 'atterra'],
        ['<kbd>R</kbd>', 'Calcio', 'pressa la guardia, riempie la postura'],
        ['<kbd>S</kbd>+<kbd>R</kbd>', 'Spazzata', 'atterra · saltala'],
        ['Ind+<kbd>R</kbd>', 'Calcio girato', 'lento, forte, rompe la guardia'],
        ['Av+<kbd>R</kbd>', 'Calcio alla mano', 'durante la carica: disarma'],
        ['<kbd>W</kbd>›<kbd>R</kbd>', 'Calcio volante', 'in aria'],
        ['←→+<kbd>R</kbd>', 'Calcio personale', 'ogni ninja ha il suo'],
        ['<kbd>R</kbd>', 'Spada al volo', 'disarmato, vicino alla tua spada'],
        ['<kbd>T</kbd>', 'Shuriken', ''],
        ['<kbd>Shift</kbd>', 'Scatto', 'Shift sinistro'],
        ['<kbd>Shift</kbd>›<kbd>F</kbd>', 'Fendente in scatto', ''],
        ['<kbd>W</kbd>›<kbd>F</kbd>', 'Fendente aereo', ''],
        ['<kbd>W</kbd>›<kbd>G</kbd>', 'Picchiata', 'pesante in aria'],
        ['<kbd>S</kbd>', 'Guardia', 'tieni premuto'],
        ['<kbd>S</kbd>!', 'Parata', 'premi poco prima che arrivi il colpo'],
        ['<kbd>F</kbd>', 'Contrattacco diretto', 'dopo guardia/parata'],
        ['Av+<kbd>F</kbd>', 'Spazzata', 'contrattacco · alle gambe'],
        ['Ind+<kbd>F</kbd>', 'Aggiramento', 'contrattacco · gli passi alle spalle'],
        ['<kbd>G</kbd>', 'Contrattacco pesante', 'contrattacco · atterra'],
        ['Scambio', 'Scambio', 'blocca il contrattacco e contrattacca ancora; il tuo 3º contrattacco è un colpo finale'],
        ['<kbd>F</kbd>/<kbd>G</kbd>!!', 'Incrocio di lame', 'martella durante l’incrocio per respingerlo'],
      ],
      touch: {
        btn: { light: 'ATTACCO', heavy: 'PESANTE', kick: 'CALCIO', guard: 'GUARDIA', dodge: 'SCATTO', throw: 'SHUR.', special: 'KI', up: 'SALTO', down: 'GUARDIA', stick: 'Joystick' },
        lock: 'Martella ATTACCO!',
        replaySkip: 'tocca per saltare',
        rotateTitle: 'Gira lo schermo',
        rotateText: 'Shadow Duel si gioca in orizzontale. I menu puoi usarli anche in verticale.',
        rotMenu: 'Menu principale',
        need2p: 'Serve tastiera / gamepad',
        need2pToast: 'Collega una tastiera o un gamepad per giocare in due',
        hints: 'Suggerimenti',
        pause: 'Pausa',
        sel: { who1: 'Tu · tocca il tuo ninja', who2: 'Avversario (CPU) · tocca per scegliere', who2train: 'Manichino · tocca per scegliere' },
        opt: {
          title: 'Comandi touch',
          layout: 'Disposizione', simple: 'Semplice', full: 'Completa',
          size: 'Dimensione', sizes: { s: 'Piccola', m: 'Media', l: 'Grande' },
          hand: 'Pulsanti', right: 'Destra', left: 'Sinistra',
          assist: 'Assistenza', haptic: 'Vibrazione',
          fullscreen: 'Schermo intero', exitFullscreen: 'Esci da schermo intero',
          note: 'Semplice: 5 pulsanti grandi. Completa: aggiunge calcio e shuriken. Assistenza: tieni premuto ATTACCO e la combo continua, un tocco rapido su GUARDIA dura abbastanza per parare e lo stick non scatta per sbaglio. Rende solo più facile il touch; regole e punteggi sono uguali per tutti.',
          fullNote: 'I pulsanti CALCIO e SHURIKEN sono nella disposizione Completa (Impostazioni → Comandi).',
        },
        help: '<div class="th-grid">' +
          '<div><h3>Joystick</h3><dl>' +
          '<dt><i class="tb">◀ ▶</i></dt><dd>Metti il pollice sulla metà libera e scorri: cammini</dd>' +
          '<dt><i class="tb">▲</i></dt><dd>Spingi in alto: salto</dd>' +
          '<dt><i class="tb tb-guard">▼</i></dt><dd>Tira in basso: guardia</dd>' +
          '<dt><i class="tb">▶▶</i></dt><dd>Due colpetti di lato: scatto</dd>' +
          '</dl></div>' +
          '<div><h3>Pulsanti</h3><dl>' +
          '<dt><i class="tb tb-light">ATTACCO</i></dt><dd>Fendente. Tocca più volte: combo. Tieni avanti o indietro mentre tocchi: altre tecniche</dd>' +
          '<dt><i class="tb">PESANTE</i></dt><dd>Fendente pesante. Avanti + PESANTE lancia l’avversario in aria</dd>' +
          '<dt><i class="tb tb-guard">GUARDIA</i></dt><dd>Tieni premuto: guardia. Tocca poco prima del colpo: parata</dd>' +
          '<dt><i class="tb">SCATTO</i></dt><dd>Scatto (verso dove punta lo stick, altrimenti indietro)</dd>' +
          '<dt><i class="tb ki">KI</i></dt><dd>Tecnica ki: il pulsante si illumina quando il ki è pieno</dd>' +
          '<dt><i class="tb">CALCIO</i> <i class="tb">SHUR.</i></dt><dd>Disposizione Completa: calcio e shuriken</dd>' +
          '</dl></div></div>',
        note: 'Puoi premere più pulsanti insieme: tieni guardia e attacca, oppure fai scorrere il pollice da <i class="tb tb-guard">GUARDIA</i> ad <i class="tb tb-light">ATTACCO</i>. <b>II</b> in alto mette in pausa; disposizione, dimensione e opzioni per mancini sono in <b>Impostazioni</b>. Se usi una tastiera o un gamepad, i comandi passano a quelli in automatico.',
        keysHelp: '',
      },
      movesTouch: [
        ['<i class="tb">◀ ▶</i>', 'Cammina', 'joystick · due colpetti: scatto'],
        ['<i class="tb">▲</i>', 'Salto', 'spingi lo stick in alto'],
        ['<i class="tb tb-light">ATTACCO</i>×3', 'Combo tripla', 'tocca più volte; il terzo colpo respinge'],
        ['<i class="tb">PESANTE</i>', 'Fendente pesante', 'atterra'],
        ['<i class="tb">CALCIO</i>', 'Calcio', 'pressa la guardia, riempie la postura · disposizione Completa'],
        ['<i class="tb tb-guard">▼</i>' + '+' + '<i class="tb">CALCIO</i>', 'Spazzata', 'atterra · saltala'],
        ['Ind+' + '<i class="tb">CALCIO</i>', 'Calcio girato', 'lento, forte, rompe la guardia'],
        ['Av+' + '<i class="tb">CALCIO</i>', 'Calcio alla mano', 'durante la carica: disarma'],
        ['<i class="tb">▲</i>' + '›' + '<i class="tb">CALCIO</i>', 'Calcio volante', 'in aria'],
        ['←→+' + '<i class="tb">CALCIO</i>', 'Calcio personale', 'ogni ninja ha il suo'],
        ['<i class="tb">CALCIO</i>', 'Spada al volo', 'disarmato, vicino alla tua spada'],
        ['<i class="tb">SHUR.</i>', 'Shuriken', 'disposizione Completa'],
        ['<i class="tb">SCATTO</i>', 'Scatto', ''],
        ['<i class="tb">SCATTO</i>›<i class="tb tb-light">ATTACCO</i>', 'Fendente in scatto', ''],
        ['<i class="tb">▲</i>›<i class="tb tb-light">ATTACCO</i>', 'Fendente aereo', ''],
        ['<i class="tb">▲</i>›<i class="tb">PESANTE</i>', 'Picchiata', 'pesante in aria'],
        ['<i class="tb tb-guard">GUARDIA</i>', 'Guardia', 'tieni premuto, o tira lo stick in basso'],
        ['<i class="tb tb-guard">GUARDIA</i>!', 'Parata', 'tocca poco prima che arrivi il colpo'],
        ['<i class="tb tb-light">ATTACCO</i>', 'Contrattacco diretto', 'dopo guardia/parata'],
        ['Av+<i class="tb tb-light">ATTACCO</i>', 'Spazzata', 'contrattacco · alle gambe'],
        ['Ind+<i class="tb tb-light">ATTACCO</i>', 'Aggiramento', 'contrattacco · gli passi alle spalle'],
        ['<i class="tb">PESANTE</i>', 'Contrattacco pesante', 'contrattacco · atterra'],
        ['Scambio', 'Scambio', 'blocca il contrattacco e contrattacca ancora; il tuo 3º contrattacco è un colpo finale'],
        ['<i class="tb tb-light">ATTACCO</i>!!', 'Incrocio di lame', 'martella ATTACCO durante l’incrocio per respingerlo'],
      ],
      moveSpecialTouch: '<i class="tb ki">KI</i>',
      moveTags: {
        normal: 'Normale', command: 'Comando', string: 'Sequenza', launcher: 'Lancio', juggle: 'Giocoleria', air: 'Aereo', dash: 'Scatto',
        strike: 'Colpo', counter: 'Contrattacco', catch: 'Presa', feint: 'Finta', guardCrush: 'Sfonda guardia', knockdown: 'Atterramento',
        kiCancel: 'Annullamento ki', special: 'Tecnica ki', throw: 'Proiettile',
      },
      lessonsTouch: {
        walk: 'Fai scorrere il pollice sulla metà libera dello schermo: spingi il joystick a sinistra e a destra per camminare.',
        combo: 'Tocca <i class="tb tb-light">ATTACCO</i> tre volte di fila: concatena tre fendenti e colpisci il manichino.',
        heavy: 'Metti a segno un fendente pesante con <i class="tb">PESANTE</i>. È lento, ma atterra.',
        gbreak: 'Il manichino è in guardia. Colpiscilo con <i class="tb">PESANTE</i> per riempire la sua barra della postura e rompergli la guardia (<i class="tb">CALCIO</i> nella disposizione Completa la riempie ancora più in fretta).',
        block: 'Il manichino attacca. Tieni premuto <i class="tb tb-guard">GUARDIA</i> (o tira lo stick in basso) e blocca un fendente.',
        parry: 'Tocca <i class="tb tb-guard">GUARDIA</i> poco prima che arrivi il colpo. Il momento perfetto è quando l’anello blu si stringe.',
        counter: 'Subito dopo una guardia o una parata, <i class="tb tb-light">ATTACCO</i>: fendente di contrattacco. Prova anche stick avanti/indietro + <i class="tb tb-light">ATTACCO</i> o <i class="tb">PESANTE</i>.',
        special: 'La tua barra del ki è piena. Usa {sp} con il pulsante <i class="tb ki">KI</i> illuminato.',
      },
      lessons: [
        { id: 'walk', t: 'Cammina', d: 'Cammina avanti e indietro con <kbd>A</kbd> / <kbd>D</kbd>.' },
        { id: 'combo', t: 'Combo tripla', d: 'Concatena tre fendenti leggeri con <kbd>F</kbd> <kbd>F</kbd> <kbd>F</kbd> e colpisci il manichino.' },
        { id: 'heavy', t: 'Fendente pesante', d: 'Metti a segno un fendente pesante con <kbd>G</kbd>. È lento, ma atterra.' },
        { id: 'gbreak', t: 'Rompi la guardia', d: 'Il manichino è in guardia. Calcia con <kbd>R</kbd> per riempire la sua barra della postura e rompergli la guardia.' },
        { id: 'block', t: 'Guardia', d: 'Il manichino attacca. Tieni premuto <kbd>S</kbd> per bloccare un fendente.' },
        { id: 'parry', t: 'Parata', d: 'Premi <kbd>S</kbd> poco prima che arrivi il colpo. Il momento perfetto è quando l’anello blu si stringe.' },
        { id: 'counter', t: 'Contrattacco', d: 'Subito dopo una guardia o una parata, <kbd>F</kbd>: fendente di contrattacco. Prova anche avanti/indietro + <kbd>F</kbd> o <kbd>G</kbd>.' },
        { id: 'rally', t: 'Scambio', d: 'Anche il manichino contrattacca. Attaccalo, blocca il suo contrattacco e contrattacca ancora: arriva a 2× con due tue risposte.' },
        { id: 'special', t: 'Tecnica ki', d: 'La tua barra del ki è piena. Usa {sp} con <kbd>E</kbd>.' },
      ],
    });



    merge(EN.STR, {

      talk: {
        akane: {
          open: ['La mia lama è cremisi, il mio intento è puro. Affrontami con onore.', 'Prima m’inchino, poi colpisco. È solo giusto.', 'Questo duello è per il nostro onore. Non si torna indietro.'],
          reply: ['Un avversario d’onore… Ti sei guadagnato la mia lama.', 'Parole taglienti. Vediamo se lo è anche il tuo acciaio.', 'Quando parla la lama cremisi, le parole tacciono.'],
          boss: 'I miei maestri sono morti sulla tua lama, Shura. Oggi quel debito si salda.',
        },
        aoi: {
          open: ['Il vento non ha mai fretta. Nemmeno io.', 'Ascolta il tuo respiro. L’ultimo suono che sentirai sarà il vento.', 'Il bambù si piega ma non si spezza. Tu cosa sei?'],
          reply: ['Calmati. La rabbia appesantisce la lama.', 'Il vento non si afferra. Si può solo sentire.', 'Molto bene. Cominciamo quando la foglia tocca terra.'],
          boss: 'Persino l’occhio del ciclone è silenzioso. Dentro di te c’è solo rumore, Shura.',
        },
        kuro: {
          open: ['La montagna non si muove. Tu sì.', 'Niente chiacchiere. Alza la spada.', 'Sei piccolo. Farò presto.'],
          reply: ['Hmph. Avanti, allora.', 'Parli troppo.', 'La mia nodachi è lunga. La mia pazienza è corta.'],
          boss: 'Shura. Ho aspettato a lungo. Basta parole.',
        },
        yuki: {
          open: ['La neve cade in silenzio. Anche i miei colpi.', 'La volpe non cade nelle trappole. Le tende.', 'Freddo? Tra poco non sentirai più niente.'],
          reply: ['Hai il sangue caldo. Ti rallenta.', 'Che chiasso… Persino la neve si vergogna per te.', 'Non sbattere le palpebre. Te lo perderesti.'],
          boss: 'Tutti ti temono, Shura. Io sento solo un po’ di freddo.',
        },
        hana: {
          open: ['Balliamo? Ma conduco io!', 'Finiamo prima che i petali di ciliegio tocchino terra, promesso!', 'Due tantō, un sorriso. Cosa ti spaventa di più?'],
          reply: ['Oh, che faccia seria! Sorridi un po’, cadrai con più grazia.', 'Prendimi, se ci riesci!', 'Va bene, va bene! Ma dopo niente lacrime.'],
          boss: 'Non ridi mai, Shura? Dai, che sia il nostro ultimo ballo!',
        },
        tetsu: {
          open: ['Il dovere mi ha portato qui. Fatti da parte o cadi.', 'La mia armatura ha visto cento battaglie. Tu sei la centunesima.', 'La disciplina viene prima del coraggio. Lascia che te lo mostri.'],
          reply: ['Che mancanza di rispetto. La correggerò.', 'Le tue parole non trapassano la mia armatura.', 'Tieniti pronto. La mia naginata non avvisa.'],
          boss: 'Hai bruciato il castello del mio signore, Shura. Oggi compio il mio dovere.',
        },
        ren: {
          open: ['Ah! Finalmente un po’ di divertimento! Hai le ossa robuste?', 'Ti ha spaventato la maschera? La mia vera faccia è peggio!', 'Teste o guardie? Le spacco tutte e due!'],
          reply: ['Tante parole e niente lotta! Avanti!', 'Eh, mi stai simpatico. Ma te le suono lo stesso.', 'Hai mai visto il mio calcio? Stai per vederlo!'],
          boss: 'Allora sei tu il vero oni, eh? Vediamo chi ha le corna più dure!',
        },
        kage: {
          open: ['Credi di vedermi. Vedi solo la mia ombra.', 'Più forte è la luce, più profonda è l’ombra.', 'Il tuo nome è già scritto. Io lo sto solo leggendo.'],
          reply: ['Non parlare. Le ombre ascoltano.', 'Non voltarti. Sono già lì.', 'Fai troppo rumore. Il silenzio colpisce prima.'],
          boss: 'Le ombre non servono alcun padrone, Shura. Inghiottiranno anche te.',
        },
        shura: {
          open: ['Hai spezzato sette lame. L’ottava è mia, e spezzerà te.', 'Il tuo spirito mi ha chiamato. Bene che tu sia salito fin qui: la tua caduta sarà ancora più grande.', 'Sono la fine della strada. In ginocchio.'],
          reply: ['Debolezza. La sento da qui.', 'Sei solo un gradino.', 'In ginocchio, o cadi.'],
          boss: 'Il demone nello specchio… Uno di noi è di troppo.',
        },
        tora: {
          open: ['Ho perso il conto di quelli appesi alla mia catena. Tu sarai il prossimo.', 'La caccia è aperta. Scappa pure, ma la mia catena è lunga.', 'Dicono che la tigre attenda in agguato. Non questa!'],
          reply: ['Grrr… Bene. Mi piacciono le prede che non scappano.', 'Non serve che ti avvicini. Ti tiro io.', 'Le tue parole sono lunghe. La mia catena di più.'],
          boss: 'Anche tu sei solo una preda, Shura. Solo un po’ più grossa.',
        },
        jin: {
          open: ['Non sono venuto a versare sangue. Ti metterò solo a riposare per un po’.', 'Il bastone parla con pazienza. Ascolta.', 'La tua via è piena di rabbia, giovane guerriero. Alleggeriamo il tuo fardello.'],
          reply: ['Molto bene. Ma dopo, prendiamo un tè insieme.', 'La rabbia ti pesa. Lascia che la porti io.', 'La spada taglia; il bastone risveglia.'],
          boss: 'Shura, non devo distruggerti per sconfiggere il demone che hai dentro. Mi basta fermarti.',
        },
        mai: {
          open: ['Il palco è pronto, il sipario è alzato. Il tuo ruolo: quello che perde.', 'Quando il mio ventaglio si apre, non chiudere gli occhi. Ti perderesti lo spettacolo.', 'Ogni mio passo è una nota. Riesci a tenere il tempo?'],
          reply: ['Che entrata goffa. Non importa, ho grazia per tutti e due.', 'Il vento soffia dalla mia parte, caro.', 'Non mi servono applausi. Mi basta la tua caduta.'],
          boss: 'Shura, in quest’ultimo ballo non divido il palco con nessuno.',
        },
        tsubame: {
          open: ['La distanza tra noi è la mia arma.', 'La rondine sbaglia una volta. La seconda si gira e colpisce.', 'Ho misurato il vento. La mia freccia conosce la strada.'],
          reply: ['Vuoi avvicinarti? Provaci.', 'Trattieni il fiato. Una freccia in volo non fa rumore.', 'Ho gli occhi su di te. E anche la mia freccia.'],
          boss: 'Shura, in cielo non ci si nasconde. La mia freccia ti troverà.',
        },
      },

      pairs: {
        'akane|aoi': [['akane', 'Aoi! È ora di finire il duello lasciato a metà.'], ['aoi', 'Il vento soffia sempre verso lo stesso fuoco, Akane. Comincia.']],
        'kuro|tetsu': [['kuro', 'Guscio di ferro. Vediamo se è vuoto.'], ['tetsu', 'Anche una montagna si piega alla disciplina, Kuro.']],
        'hana|yuki': [['yuki', 'I fiori appassiscono nella neve, Hana.'], ['hana', 'Allora scioglierò la neve, Yuki!']],
        'kage|ren': [['ren', 'I trucchi d’ombra con me non funzionano! Fatti vedere!'], ['kage', 'Sono proprio qui, oni. Sei tu che non sai guardare.']],
        'akane|ren': [['akane', 'Solo chi non ha onore si nasconde dietro una maschera.'], ['ren', 'Onore? L’onore non mi riempie la pancia!']],
        'aoi|yuki': [['aoi', 'Un vento freddo è sempre vento, Yuki.'], ['yuki', 'Ma la neve resta quando il vento cala.']],
        'kuro|tora': [['tora', 'Una montagna, eh? Anche le tigri vivono in montagna.'], ['kuro', 'Le tigri in montagna ci muoiono.']],
        'tora|yuki': [['tora', 'Una volpe! Che fa una volpe davanti a una tigre?'], ['yuki', 'Scappa. Poi le congela la coda.']],
        'jin|tora': [['tora', 'Che farai quando la mia catena si avvolgerà al tuo bastone, monaco?'], ['jin', 'La scioglierò. Sciogliere i nodi è la mia vocazione.']],
        'jin|ren': [['ren', 'Un monaco? Comincia a pregare, pelato!'], ['jin', 'Lo sto già facendo, oni. Per te. Il fuoco che hai dentro brucia anche te.']],
        'jin|tetsu': [['tetsu', 'Che ci fa un monaco sul campo di battaglia?'], ['jin', 'Sono venuto per i cuori corazzati come il tuo, Tetsu. Pesante la tua armatura; più pesante il tuo cuore.']],
        'akane|jin': [['akane', 'Fatti da parte, monaco. Questa vendetta è mia.'], ['jin', 'La vendetta è una catena, Akane. Spezziamola prima.']],
        'hana|mai': [['hana', 'Oh, un’altra ballerina! Vediamo chi gira più veloce!'], ['mai', 'La velocità è solo l’ombra della grazia, Hana. Lascia che ti mostri la luce.']],
        'kage|mai': [['mai', 'Anche le ombre ballano, Kage?'], ['kage', 'Solo quando la luce si spegne.']],
        'aoi|tsubame': [['tsubame', 'Il tuo vento può deviare la mia freccia, Aoi?'], ['aoi', 'Il vento non sta dalla parte di nessuno, Tsubame. Nemmeno della tua freccia.']],
        'kage|tsubame': [['kage', 'Non puoi colpire ciò che non vedi, arciera.'], ['tsubame', 'Le ombre arrivano con la luce. Anch’io.']],
        'mai|tsubame': [['mai', 'Fissare da lontano è maleducato, arciera. Vieni a guardare da vicino.'], ['tsubame', 'Manderò la mia freccia a guardare da vicino il tuo palco.']],
      },
      endings: {
        akane: ['Quando la spada di Shura colpì la terra, le campane del tempio suonarono da sole.', 'Akane ripulì la lama cremisi e s’inchinò sulla tomba dei maestri: il debito era saldato.', 'La strada davanti non è più vendetta, ma insegnare l’onore a nuovi allievi.'],
        aoi: ['Quando Shura cadde, la tempesta tacque; per la prima volta da anni, le nuvole si aprirono.', 'Aoi rinfoderò la lama e tornò nella foresta di bambù.', 'Rimase solo un vento che fischiava.'],
        kuro: ['Kuro seppellì la maschera spezzata di Shura sulla vetta della montagna.', 'Non disse una parola. Kuro abbassò il cappello di paglia e svanì nella neve.', 'Gli abitanti del villaggio dicono che quell’inverno nessun bandito scese dalla montagna.'],
        yuki: ['L’ultimo respiro di Shura si fece nebbia nell’aria fredda e svanì.', 'Yuki si sistemò la sciarpa e se ne andò, senza lasciare tracce nella neve.', 'Da quel giorno, sulla vetta si è vista solo l’ombra di una volpe.'],
        hana: ['Quando la maschera di Shura toccò terra, Hana vi lasciò accanto un ramo di ciliegio.', 'Quella notte il mercato si riempì di lanterne; gli applausi più forti andarono a una kunoichi che ballava sui tetti.', 'Nessuno sa dove sia andata Hana. Restano solo petali rosa nel vento.'],
        tetsu: ['Sul tetto del castello, Tetsu spezzò in due la spada di Shura sul ginocchio.', 'Lo stendardo del signore tornò a sventolare, e il vento lo fece garrire con orgoglio.', 'Dovere compiuto. Ma il dovere di un samurai non finisce mai.'],
        ren: ['Ren appese la maschera spezzata di Shura accanto all’altra maschera oni. Due oni, un vincitore.', 'Quella notte il villaggio cantò; la risata più forte, come sempre, fu quella di Ren.', 'Al mattino, Ren era già in viaggio. Verso la prossima rissa.'],
        kage: ['Quando Shura cadde, l’ombra di Kage si posò in silenzio sul demone caduto.', 'Nessuna traccia, nessun suono; solo un’ombra in più, allungata al chiaro di luna.', 'Forse era sempre stata lì. Forse non è mai esistita.'],
        shura: ['Sul tetto del castello ne restò in piedi uno solo: quello con la stessa maschera, solo più scura.', 'Shura non cerca più rivali. Sono i rivali a cercare Shura.'],
        def: ['L’ultimo maestro è caduto. La via delle ombre ora è tua.', 'Rinfodera la lama: la leggenda comincia adesso.'],
        tora: ['Il tintinnio di una catena annunciò la caduta di Shura.', 'Tora appese la maschera spezzata alla catena: un nuovo trofeo di caccia.', 'Da quel giorno, nella foresta nessuno prese più il ruggito della tigre per una favola.'],
        jin: ['Jin s’inginocchiò accanto a Shura caduto e pregò.', 'Sulla via del ritorno al tempio, nemmeno una goccia di sangue macchiava il bastone.', 'Quella notte le campane della montagna suonarono di nuovo; stavolta non a lutto, ma per la pace.'],
        mai: ['Mentre Shura cadeva, Mai chiuse di scatto il ventaglio e s’inchinò.', 'Il mercato notturno parla ancora di quel ballo.', 'Il sipario calò. Ma Mai non lasciò mai il palco.'],
        tsubame: ['L’ultima freccia vibrava in silenzio nel tetto del castello.', 'Tsubame mise l’arco in spalla e guardò le rondini volare a sud.', 'Nessuno la rivide; restarono solo frecce dalle piume vivaci, piantate nei loro bersagli.'],
      },
      roster2: {
        notes: {
          tora: ['Leggero: frusta di catena a media distanza, falcetto da vicino', 'Pesante: lancia la catena; se colpisce, tira a sé l’avversario', 'Chiusura della combo: se l’avversario è lontano, la catena lo trascina più vicino'],
          jin: ['Il bastone colpisce con entrambe le estremità; i colpi sono contundenti e non fanno mai sangue', 'Il terzo colpo e la spazzata pesante atterrano', 'In guardia, la postura si riempie più lentamente'],
          mai: ['Finestra di parata più ampia', 'In guardia, i ventagli rimandano indietro i proiettili', 'Pesante: un’onda di vento respinge l’avversario e disperde i proiettili'],
          tsubame: ['Pesante: scocca una freccia con l’arco; tieni premuto per un tiro caricato', 'Lancio: salto all’indietro e freccia scoccata in aria', 'Senza frecce, l’attacco pesante usa il tantō; le frecce si ricaricano col tempo'],
        },
      },
    });

    merge(EN.CHARS, {
      akane: { title: 'Lama Cremisi', desc: 'Maestra di katana equilibrata. Combo veloce a tre colpi, parata forte.', weapon: 'Katana' },
      aoi: { title: 'Vento Blu', desc: 'Agile maestro di katana. Cammina un po’ più veloce e scatta come il vento.', weapon: 'Katana' },
      kuro: { title: 'Montagna Nera', desc: 'Impugna una lunga nodachi. Lento, ma con grande portata e colpi devastanti.', weapon: 'Nodachi' },
      yuki: { title: 'Volpe delle Nevi', desc: 'Colpisce rapidissima con una corta kodachi. Tanti shuriken, sciarpa lunga.', weapon: 'Kodachi' },
      hana: { title: 'Danza del Ciliegio', desc: 'Kunoichi. Combatte con due tantō come se ballasse; mani più veloci, portata più corta.', weapon: 'Doppio tantō' },
      tetsu: { title: 'Fortezza di Ferro', desc: 'Samurai corazzato. La naginata ha la portata più lunga; i colpi gli fanno appena un graffio.', weapon: 'Naginata' },
      ren: { title: 'Oni Cremisi', desc: 'Attaccabrighe con maschera oni. Terrorizza con colpi che sfondano la guardia e calci devastanti.', weapon: 'Uchigatana' },
      kage: { title: 'L’Ombra Stessa', desc: 'Ombra incappucciata. Veloce con la ninjatō, scatto lungo; lascia un’ombra ovunque passi.', weapon: 'Ninjatō' },
      tora: { title: 'Tigre in Catene', desc: 'Maestro di kusarigama. Sferza la catena zavorrata da media distanza; l’attacco pesante tira a sé l’avversario per il falcetto.', weapon: 'Kusarigama' },
      jin: { title: 'Monaco del Bastone', desc: 'Monaco armato di bō. Un lungo bastone che colpisce con entrambe le estremità, guardia solida e colpi contundenti che atterrano; non fa mai sangue, scuote solo le ossa.', weapon: 'Bō' },
      mai: { title: 'Danzatrice dei Ventagli', desc: 'Kunoichi coi ventagli da guerra. Velocissima, con un’ampia finestra di parata; i ventagli rimandano i proiettili e il loro vento respinge gli avversari.', weapon: 'Doppio tessen' },
      tsubame: { title: 'Arciera Rondine', desc: 'Porta arco e tantō. Tira frecce dalla distanza (tieni premuto pesante per un tiro potente) e con un salto all’indietro sfugge a chi si avvicina, tirando in aria.', weapon: 'Yumi + Tantō' },
      shura: { title: 'Il Maestro Cremisi', desc: 'Un maestro demoniaco che traccia la sua via nel cremisi. Lunga nodachi, colpi schiaccianti, parate quasi perfette.', weapon: 'Nodachi' },
    });

    merge(EN.ARENAS, {
      temple: 'Tempio al chiaro di luna',
      rain: 'Bambù nella tempesta',
      snow: 'Vetta innevata',
      village: 'Villaggio in fiamme',
      market: 'Mercato notturno',
      waterfall: 'Cascata',
      castle: 'Tetto del castello',
    });

    merge(EN.SPECIALS, {
      akane: { desc: 'Un fendente iai cremisi che trapassa l’avversario in un batter d’occhio, lasciando nell’aria una mezzaluna infuocata.', tip: 'Para, o scatta di lato' },
      aoi: { desc: 'Un ampio colpo che scaglia in avanti una lama di vento; una guardia al momento perfetto la riflette.', tip: 'Salta, tagliala con la lama o metti la guardia al momento perfetto' },
      kuro: { desc: 'Balza e spacca il suolo con la nodachi; l’onda d’urto che corre sul terreno schiaccia le guardie e atterra.', tip: 'Salta l’onda e colpisci mentre sei in aria' },
      yuki: { desc: 'Una raffica fulminea di cinque colpi, come una bufera; l’ultimo colpo atterra.', tip: 'Metti la guardia e para il primo colpo' },
      hana: { desc: 'Avanza roteando come un turbine di fiori di ciliegio con i due tantō, tagliando da entrambi i lati.', tip: 'Metti la guardia, o scatta indietro' },
      tetsu: { desc: 'Fa roteare la naginata tutt’intorno; i colpi non fermano la rotazione (super armatura).', tip: 'Esci dalla portata, o para' },
      ren: { desc: 'Una spallata che frantuma le guardie, seguita da un fendente ascendente che lancia in aria l’avversario.', tip: 'La guardia non serve: para, salta o scatta' },
      kage: { desc: 'Svanisce nel fumo, lascia dietro di sé un clone d’ombra e ricompare alle spalle dell’avversario per colpire.', tip: 'Metti la guardia appena Kage ricompare' },
      tora: { desc: 'Fa roteare la catena sopra la testa in un ciclone che falcia tutto intorno; l’avversario preso viene tirato a sé e scagliato in cielo dal falcetto.', tip: 'Esci dalla portata o metti la guardia: se non ti prende, la tirata va a vuoto' },
      jin: { desc: 'Avanza facendo roteare il bastone come una ruota di diamante; dopo quattro colpi, un colpo ascendente lancia in aria l’avversario.', tip: 'Scatta indietro, o para il primo colpo' },
      mai: { desc: 'Solleva un turbine che avanza, risucchia l’avversario, lo taglia e alla fine lo scaglia in cielo.', tip: 'Metti la guardia sul turbine al momento perfetto o allontanati: si muove piano' },
      tsubame: { desc: 'Salta indietro e fa piovere frecce dal cielo; se manca, scocca una freccia rondine che si gira e colpisce alle spalle.', tip: 'Spostati dai segni a terra; la freccia rondine torna indietro, quindi guardati le spalle' },
      shura: { desc: 'Ruggisce e si dissolve in un fumo cremisi, comparendo davanti e dietro l’avversario per abbattere tre fendenti pesanti di nodachi; l’ultimo lancia in aria.', tip: 'Occhio al bagliore cremisi: parare un fendente interrompe la tecnica; la guardia ti distrugge la postura' },
    });

    merge(EN.TXT, {
      gbreak: 'POSTURA ROTTA!', cut: 'TAGLIATO!', reflect: 'RIFLESSO!', parry: 'PARATA!', caught: 'PRESO!',
      swallowHit: '燕!', vajraHit: '金剛!', whirlHit: '旋風の舞',
    });

    merge(EN.AI_LEVELS, { 0: 'Apprendista', 1: 'Maestro', 2: 'Leggenda', 3: 'Shura' });

    EN.NUMWORDS = ['Zero', 'Uno', 'Due', 'Tre', 'Quattro', 'Cinque', 'Sei', 'Sette', 'Otto', 'Nove', 'Dieci', 'Undici', 'Dodici'];


    merge(EN.PHRASES, {

      'Gölge Düellosu': 'Shadow Duel',
      'Duraklat': 'Pausa',
      'KARŞILIKLI SERİ': 'SCAMBIO',
      'SON DARBE': 'COLPO FINALE',
      'atlamak için bir tuşa bas': 'premi un tasto per saltare',

      'GARD': 'GUARDIA',
      'HAFİF': 'LEGGERO',
      'SALDIR': 'ATTACCO',
      'AĞIR': 'PESANTE',
      'ATIL': 'SCATTO',
      'TEKME': 'CALCIO',

      'Sekiz savaşçı, üç arena. Gerçek zamanlı kılıç çarpışması, kılıç kilitlenmesi, savuşturma, denge kırma, Gölge Kesiği ve ragdoll fiziği.': 'Otto lottatori, tre arene. Scontri di spada in tempo reale, incroci di lame, parate, rotture di postura, il Taglio d’ombra e fisica ragdoll.',
      'İki Oyuncu': 'Due giocatori',
      'Aynı klavyede ya da iki gamepad ile kafa kafaya': 'Testa a testa sulla stessa tastiera o con due gamepad',
      'CPU\'ya Karşı': 'Contro la CPU',
      'Ninjanı seç, rakibini yapay zekâ yönetsin': 'Scegli il tuo ninja e lascia il rivale all’IA',
      'Zorluk': 'Difficoltà',
      'Çırak': 'Apprendista',
      'Usta': 'Maestro',
      'Efsane': 'Leggenda',
      'Aylık Turnuva': 'Torneo mensile',
      'Dan Sınavı': 'Prova Dan',
      'Şampiyonlar Salonu': 'Sala dei Campioni',
      'Seyret': 'Guarda',
      'Rastgele iki ninja, Efsane yapay zekâ': 'Due ninja a caso, IA Leggenda',
      'Ses': 'Audio',
      'Müzik': 'Musica',
      'Kan efekti': 'Sangue',
      'Tuş ipuçları': 'Aiuti tasti',
      'Yüksek grafik': 'Grafica alta',

      'Kontroller': 'Comandi',
      '1. Oyuncu': 'Giocatore 1',
      '2. Oyuncu': 'Giocatore 2',
      'Yürü': 'Cammina',
      'Zıpla': 'Salta',
      'Gard (basılı tut)': 'Guardia (tieni premuto)',
      'Hafif kesik (×3 kombo)': 'Fendente leggero (combo ×3)',
      'Ağır kesik': 'Fendente pesante',
      'Tekme': 'Calcio',
      'Sol Shift': 'Shift sinistro',
      'Sağ Shift': 'Shift destro',
      'Atılma': 'Scatto',
      'Ki tekniği (ki dolu)': 'Tecnica ki (ki pieno)',

      'Ninjanı seç': 'Scegli il tuo ninja',
      'Hazır': 'Pronto',
      '1. oyuncunun ninjası': 'Ninja del giocatore 1',
      '2. oyuncunun ninjası': 'Ninja del giocatore 2',
      'Önceki ninja': 'Ninja precedente',
      'Sonraki ninja': 'Ninja successivo',
      '1. oyuncu kadrosu': 'Roster giocatore 1',
      '2. oyuncu kadrosu': 'Roster giocatore 2',
      'Dövüşe başla': 'Combatti',
      'Geri': 'Indietro',
      'Kilitli': 'Bloccato',
      'Rastgele': 'Casuale',
      'Hız': 'Velocità',
      'Güç': 'Potenza',
      'Menzil': 'Portata',
      'Can': 'Vita',

      'Duraklatıldı': 'In pausa',
      'Devam et': 'Riprendi',
      'Maçı yeniden başlat': 'Ricomincia incontro',
      'Ana menü': 'Menu principale',
      'Rövanş': 'Rivincita',
      'Karakter değiştir': 'Cambia lottatore',
      'Zafer senin': 'La vittoria è tua',
      'Raund': 'Round',
      'Verilen hasar': 'Danni inflitti',
      'Savuşturma': 'Parate',
      'Ki Saldırısı': 'Attacchi ki',

      'Antrenman': 'Allenamento',
      'ANTRENMAN': 'ALLENAMENTO',
      'Sıralama': 'Classifica',
      'Tümü': 'Tutti',
      'Ekranı yan çevir': 'Gira lo schermo',
      'Performans için grafik düşürüldü': 'Grafica ridotta per le prestazioni',

      'Kanlı Usta': 'Il Maestro di Sangue',
      'Yolunu kanla çizen iblis usta. Uzun nodachi, yıkıcı darbeler, neredeyse kusursuz savuşturma.': 'Un maestro demoniaco che traccia la sua via nel sangue. Lunga nodachi, colpi schiaccianti, parate quasi perfette.',

      'SEN': 'TU',
      'KUKLA': 'MANICHINO',

      'Son raund': 'Ultimo round',
      'Kazanan her şeyi alır': 'Chi vince prende tutto',
      'İlk iki raundu alan kazanır': 'Vince chi prende due round',
      'Dövüş!': 'Combatti!',
      'Süre doldu': 'Tempo scaduto',
      'Berabere': 'Pareggio',
      'Çifte K.O.': 'Doppio K.O.',
      'Mükemmel': 'Perfetto',

      'F / K tuşuna hızlıca bas!': 'Martella F / K!',
      'Hafif ya da ağır tuşuna hızlıca bas!': 'Martella leggero o pesante!',

      'KARŞILIK': 'CONTRATTACCA',
      'SAVUŞTUR': 'PARA',

      'SON VURUŞ!': 'COLPO FINALE!',
      'KİLİTLENDİ!': 'INCROCIO!',
      'İTTİ!': 'SPINTA!',
      'DENGE KIRILDI!': 'POSTURA ROTTA!',
      'GARD KIRILDI!': 'GUARDIA ROTTA!',
      'KESİLDİ!': 'TAGLIATO!',
      'YANSITMA!': 'RIFLESSO!',
      'SAVUŞTURMA!': 'PARATA!',
      'YAKALANDI!': 'PRESO!',
      'ZIRH!': 'ARMATURA!',
      'ARKADAN!': 'ALLE SPALLE!',
      'DUVAR!': 'MURO!',
      'KAFA!': 'ALLA TESTA!',
      'KARŞI!': 'INCONTRO!',
      'KRİTİK!': 'CRITICO!',
      'SÜPÜRME!': 'SPAZZATA!',
      'KARŞILIK!': 'CONTRATTACCO!',
      'YERE SERİLDİ': 'A TERRA',
      'ÇARPIŞMA!': 'SCONTRO!',
    });

    merge(EN.HTML, {

      'Gölge<br><em>Düel</em><em>losu</em>': 'Shadow<br><em>Du</em><em>el</em>',

      '<b>Savuşturma:</b> darbe gelmeden hemen önce gard tuşuna bas; rakip sendeler.':
        '<b>Parata:</b> premi guardia poco prima che arrivi il colpo; l’avversario barcolla.',
      '<b>Karşılık (返し技):</b> gard ya da savuşturmanın hemen ardından saldırı tuşu → anında karşı kesik. <b>İleri</b> + hafif = bacağa süpürme, <b>geri</b> + hafif = yanından dönüp arkadan kesme, <b>ağır</b> = güçlü karşı darbe.':
        '<b>Contrattacco (返し技):</b> attacca subito dopo una guardia o una parata → fendente di contrattacco immediato. <b>Avanti</b> + leggero = spazzata alle gambe, <b>indietro</b> + leggero = aggiramento con taglio alle spalle, <b>pesante</b> = contrattacco potente.',
      '<b>Karşılıklı seri:</b> karşılık da karşılanabilir. Her turda vuruşlar hızlanır ve güçlenir; kendi 3. karşılığın üç vuruşluk sinematik bir bitirişe dönüşür. Seriyi kıran darbe ağır çekimde iner.':
        '<b>Scambio:</b> anche i contrattacchi si possono contrattaccare. A ogni scambio i colpi diventano più veloci e più forti; il tuo 3º contrattacco diventa un colpo finale cinematografico a tre colpi. Il colpo che rompe lo scambio arriva al rallentatore.',
      '<b>Kılıç kilidi:</b> kılıçlar çarpışınca kilitlenebilir. Hafif/ağır tuşuna hızlı basan rakibini iter.':
        '<b>Incrocio di lame:</b> quando le lame si scontrano possono incrociarsi. Chi martella più veloce leggero/pesante respinge l’altro.',
      '<b>Ki barı</b> vurdukça, yedikçe ve savuşturdukça dolar. Dolunca her ninjanın kendine özgü ki tekniği açılır (Antrenman’daki hareket listesinde görebilirsin).':
        'La <b>barra del ki</b> si riempie quando colpisci, vieni colpito e pari. Quando è piena, la tecnica ki di ogni ninja è pronta (la trovi nella lista mosse dell’Allenamento).',
      '<b>Atılma + hafif</b> = atılarak kesik. <b>Havada</b> hafif = hava kesiği, ağır = dalış. Ağır kesik yere serer, duvara çarpan geri seker.':
        '<b>Scatto + leggero</b> = fendente in scatto. <b>In aria</b> leggero = fendente aereo, pesante = picchiata. Il fendente pesante atterra; chi sbatte contro un muro rimbalza indietro.',
      '<b>Denge çubuğu</b> dolarsa gard kırılır. Tekme gardı delip dengeyi hızla doldurur.':
        'Quando la <b>barra della postura</b> si riempie, la guardia si rompe. I calci passano la guardia e riempiono in fretta la postura.',

      'Gamepad: X hafif · Y ağır · B tekme · A zıpla · LB gard · RB shuriken · RT atılma · R3 ki tekniği. Start ya da <kbd>P</kbd> duraklatır. CPU modunda her iki tuş seti de seni yönetir.':
        'Gamepad: X leggero · Y pesante · B calcio · A salto · LB guardia · RB shuriken · RT scatto · R3 tecnica ki. Start o <kbd>P</kbd> mette in pausa. Contro la CPU, entrambi i set di tasti controllano te.',

      '<kbd>Enter</kbd> başlatır · <kbd>⌫</kbd> menüye döner': '<kbd>Enter</kbd> inizia · <kbd>⌫</kbd> indietro',
      '<kbd>Enter</kbd> / <kbd>F</kbd> başlatır · <kbd>⌫</kbd> çıkar': '<kbd>Enter</kbd> / <kbd>F</kbd> inizia · <kbd>⌫</kbd> esci',
    });

    EN.PATTERNS.push(

      [/^RAUND (\d+)$/, 'ROUND $1'],
      [/^(\d+)\. Raund$/, 'Round $1'],

      [/^(\d+)\. KARŞILIK$/, 'CONTRATTACCO ×$1'],
      [/^(\d+) VURUŞLUK SERİ!$/, 'SCAMBIO DA $1 COLPI!'],

      [/^(.+) önde$/, (m, n) => I.t(n) + ' in vantaggio'],

      [/^(.+) kazandı$/, (m, n) => 'Vince ' + I.t(n)],

      [/^(\d+) – (\d+) · (\d+) raund · (.+)$/, (m, a, b, r, ar) => `${a} – ${b} · ${r} round · ${I.t(ar)}`],
    );


    merge(EN.STR, {
      menu: { play: 'Gioca', playSub: (name, lv) => `${name} contro CPU · ${lv}` },
      first: { play: 'Gioca', sub: 'Un tocco e sei già in lotta', menu: 'Tutte le modalità' },
      ads: {
        cont: 'Continua da qui', contSub: 'Guarda una pubblicità · riprova senza penalità',
        trial: (name) => `Prova ${name} per un incontro`, trialSub: 'Guarda una pubblicità',
        fail: 'Nessuna pubblicità al momento, riprova tra poco',
      },
      coach: {
        attack: (l) => `${l} Attacca`,
        guard: (l, g) => `Tieni premuto ${g} per la guardia`,
        parry: (l, g) => `Tocca ${g} poco prima del colpo: parata`,
        attackT: (l) => `Tocca ${l} · continua a toccare: combo`,
        guardT: (l, g) => `Tieni premuto ${g} per la guardia`,
        parryT: (l, g) => `Tocca ${g} poco prima del colpo: parata`,
      },
    });


    merge(EN.STR, {
      vol: {
        title: 'Volume', master: 'Generale', music: 'Musica', sfx: 'Effetti', sound: 'Audio',
        pct: (n) => `${n}%`,
        muted: 'L’audio è spento. Sposta un cursore per riattivarlo.',

        voice: 'Voci',
        uiSfx: 'Suoni dei menu',
        credit: 'Voci: ユーフルカ (youfulca.com) · 効果音ラボ · すぱらんど',
      },
    });



    merge(EN.STR, {
      tedit: {
        move: 'Movimento',
        moves: { float: 'Stick', fixed: 'Stick fisso', dpad: 'Croce' },
        mnote: {
          float: 'Lo stick compare dove appoggi il pollice.',
          fixed: 'Lo stick resta dove lo metti; spingi dal centro.',
          dpad: 'Pulsanti separati: tieni premuto per camminare, doppio tocco per lo scatto. Premi tra due pulsanti per entrambi (▶ + ▲ = salto in avanti).',
          dtap: 'Pulsanti separati: un tocco rapido su ◀ ▶ fa un passo corto, tieni premuto per camminare, doppio tocco per lo scatto.',
        },
        dtap: 'Tocca per un passo',
        edit: 'Personalizza comandi',
        title: 'Personalizza comandi',
        hint: 'Trascina un pulsante dove vuoi. Toccalo per dimensione, opacità o per nasconderlo.',
        rotate: 'Gira lo schermo in orizzontale per sistemare i comandi di lotta.',
        shapes: { phone: 'Telefono', tablet: 'Tablet', portrait: 'Verticale' },
        screenNote: 'La disposizione viene salvata per questa forma di schermo: telefoni e tablet hanno ognuno la propria.',
        save: 'Salva', cancel: 'Annulla', options: 'Opzioni', done: 'Fatto', close: 'Chiudi',
        size: 'Dimensione', sizes: { s: 'S', m: 'M', l: 'L', xl: 'XL' },
        opacity: 'Opacità', opacityAll: 'Opacità (tutti)',
        hide: 'Nascondi', show: 'Mostra', hidden: 'Nascosto',
        snap: 'Aggancia alla griglia',
        presets: 'Predefiniti', pRight: 'Mano destra', pLeft: 'Mano sinistra', pSplit: 'Guardia a sinistra',
        reset: 'Ripristina predefiniti', resetDone: 'Disposizione predefinita ripristinata (vale quando salvi).',
        overlap: 'I pulsanti non possono sovrapporsi: spostato nel primo spazio libero.',
        noRoom: 'Lì non c’è spazio: il pulsante è tornato al suo posto.',
        saved: 'Comandi salvati',
        throwName: 'SHURIKEN',
        pauseName: 'Pausa',
        dirs: { dl: '◀ Sinistra', dr: 'Destra ▶', du: '▲ Salto', dd: '▼ Guardia' },
      },
    });



    merge(EN.STR, {
      menu: { arcadeDesc: 'Batti i rivali uno a uno mentre la difficoltà sale: alla fine ti aspetta un maestro nascosto. La fonte d’onore più ricca.' },
      sel: {
        title: { rival: 'Sfida del rivale · Scegli il tuo ninja' },
        go: { rival: 'Accetta il duello' },
        moves: 'Mosse',
        movesOf: (name) => `${name} · Mosse`,
        close: 'Chiudi',
      },
      hint: {
        honor: (have, need) => `Onore ${num(Math.min(have, need))}/${num(need)} → si apre la Sfida del rivale`,
        ready: 'Pronto a essere sfidato!',
        arenaHonor: (have, need) => `Si apre a ${num(need)} onore (${num(Math.min(have, need))}/${num(need)})`,
      },
      honor: {
        name: 'Onore',
        head: 'Onore',
        rows: { win: 'Vittoria', loss: 'Partecipazione', rounds: 'Round vinti', perfect: 'Round perfetto', rally: 'Scambio', counter: 'Contrattacco', parry: 'Parata', rivalWin: 'Sfida del rivale', arcadeClear: 'Arcade completato' },
        total: (n) => `Onore: ${num(n)}`,
        next: (name, left) => `Prossimo ninja: ${name} — mancano ${num(left)} di onore`,
        bar: (have, need) => `Onore ${num(Math.min(have, need))}/${num(need)} → si apre la Sfida del rivale`,
        ready: (name) => `${name} ti sfida!`,
        readyGo: 'Accetta',
        all: 'Tutti i ninja sbloccati',
        bonus: { arcadeClear: 'Arcade completato', tourneyClear: 'Torneo conquistato', danPass: 'Prova Dan superata', rivalWin: 'Sfida del rivale vinta', tutorial: 'Tutorial completato' },
        bonusToast: (n, what) => `+${num(n)} onore · ${what}`,
        road: 'Via dell’onore',
        roadSub: 'Guadagni onore in ogni modalità per giocatore singolo. Raggiungi la soglia di un ninja e ti sfida a duello; vinci e si unisce a te.',
        earnHead: 'Da dove viene l’onore',
        earn: (H) => [
          ['Contro la CPU', `Vittoria: Apprendista ${H.win[0]} · Maestro ${H.win[1]} · Leggenda ${H.win[2]}`],
          ['Arcade', `Vittorie in base alla difficoltà · Shura ${H.win[3]} · completalo +${H.arcadeClear}`],
          ['Torneo e Dan', `Vittorie ×${H.modeMul.tourney} · conquista il torneo +${H.tourneyClear} · ogni prova Dan +${H.danPass(1)} e oltre`],
          ['Anche nella sconfitta', `Partecipazione ${H.loss} · ogni round vinto ${H.roundWon}`],
          ['Bel gioco', `Parate, contrattacchi, scambi, round perfetti: fino a +${H.styleCap} a incontro`],
        ],
        rivalsHead: 'Rivali',
        arenasHead: 'Arene',
        open: 'Sbloccato',
        castle: 'Batti Shura in Arcade',
        you: (n) => `Il tuo onore: ${num(n)}`,
      },
      rival: {
        stage: 'Sfida del rivale',
        selTitle: (name) => `${name} ti sfida · Scegli il tuo ninja`,
        lvHp: (lv, p) => (p === 100 ? lv : `${lv} · vita del rivale ${p}%`),
        accept: 'Accetta la sfida',
        acceptSub: (name) => `Vinci e ${name} è tuo`,
        quit: 'Ritirati',
        hud: 'SFIDA DEL RIVALE',
        winTitle: (name) => `${name} si unisce a te!`,
        winSub: (name) => `${name} ora è nella schermata di selezione. Provalo subito!`,
        tryNew: (name) => `Gioca con ${name}`,
        lossTitle: 'La sfida continua',
        lossSub: (name, p) => `${name} stavolta ha vinto. Perdere non ti costa nulla; la prossima volta partirà con il ${p}% di vita.`,
        lossSubMin: (name) => `${name} stavolta ha vinto. Perdere non ti costa nulla; riprova.`,
        retry: 'Sfida di nuovo',
        reveal: 'Nuovo ninja',
        toastReady: (name) => `${name} ti sfida!`,
        lines: {
          hana: 'Ho sentito parlare del tuo onore, tutto il mercato parla di te! Stai al passo con il mio ballo e verrò con te!',
          tetsu: 'Il tuo nome è giunto alle mie orecchie. Sconfiggimi e la mia naginata combatterà al tuo fianco.',
          ren: 'Ah! Finalmente qualcuno mi ha chiamato! Se vinci sono tuo, se perdi ti tocca sentirmi ridere!',
          kage: 'Ti osservo da un po’. Afferra la mia ombra e sarò tuo.',
          tora: 'Dimostra di non essere una preda. Sfuggi alla mia catena e camminerò al tuo fianco.',
          jin: 'Se il tuo onore viene dal cuore, il mio bastone lo saprà. Vieni, lascia che ti metta alla prova.',
          mai: 'Sei invitato sul mio palco. Conquista il mio applauso e il mio ballo sarà tuo.',
          tsubame: 'Ti ho osservato da lontano: sei bravo. Schiva le mie frecce e il mio arco sarà con te.',
        },
      },
    });



    merge(EN.CHARS, {
      akane: { desc: 'Maestra di iaijutsu. La lama aspetta nel fodero e ogni taglio è un’estrazione; la sua posa d’estrazione intercetta i colpi in arrivo.', weapon: 'Katana (iai)' },
      aoi: { desc: 'Spadaccino del vento con un tachi a una mano. Affondi dalla lunga portata e passi di vento chiudono qualsiasi distanza in una sola mossa.', weapon: 'Tachi' },
      ren: { desc: 'Attaccabrighe con maschera oni. Spada in spalla; combatte con gomiti, ginocchia, spalla e testa, e schiaccia le guardie.' },
      kage: { desc: 'Ombra incappucciata. Impugna la ninjatō al contrario; combatte con passi d’ombra, finte e bombe fumogene.' },
    });
    merge(EN.TXT, { kiCancel: 'ANNULLAMENTO KI!', launch: 'IN ARIA!', iaiCatch: 'IAI GAESHI!' });
    EN.PATTERNS.push([/^(\d+) VURUŞ$/, '$1 COLPI']);
    merge(EN.PHRASES, {

      'Tekme': 'Calcio',
      'Tekme: dengeyi hızla doldurur, gardı kırmaya yarar. Ardından AĞIR ile seri bitirişine bağlanır.': 'Calcio: riempie in fretta la postura e aiuta a rompere la guardia. Continua con PESANTE per chiudere la sequenza.',
      'Shuriken fırlatır; zamanla yeniden dolar.': 'Lancia uno shuriken; si ricaricano col tempo.',
      'Hava kesiği': 'Fendente aereo',
      'Havada hafif kesik. Havaya fırlatılmış rakibe de vurur.': 'Un fendente leggero in aria. Colpisce anche un avversario lanciato in aria.',
      'Dalış': 'Picchiata',
      'Havadan aşağı dalış kesiği; yere serer.': 'Un fendente in picchiata dall’alto; atterra.',
      'Kaeshi-waza (karşılık)': 'Kaeshi-waza (contrattacco)',
      'Gard ya da savuşturmanın hemen ardından karşılık: nötr Suriage, ileri Harai (yere serer), geri Nuki (arkaya geçer), ağır Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.': 'Contrattacca subito dopo una guardia o una parata: neutro Suriage, avanti Harai (atterra), indietro Nuki (passa alle spalle), pesante Uchiotoshi. La tua terza risposta è il colpo finale; se viene parata, lo scambio continua.',
      'Fırlatıcı isabet edince HAFİF: rakibin peşinden sıçrayıp havada keser. Ardından AĞIR ile yere çakar. Havadaki rakip en çok üç vuruş alır.': 'Quando il lancio va a segno, LEGGERO: salti dietro all’avversario e lo tagli in aria. Poi PESANTE lo schianta a terra. Un avversario in aria subisce al massimo tre colpi.',
      'Üç vuruşluk hafif seri. İkinci ve üçüncü vuruş ki doluyken tekniğe bağlanır.': 'Una sequenza leggera da tre colpi. Con il ki pieno, il secondo e il terzo colpo si annullano nella tecnica ki.',
      'Ağır vuruş: yavaş ama yere serer.': 'Colpo pesante: lento, ma atterra.',
      'İleri atılarak dürter; hafif seriye devam eder.': 'Scatta in avanti con un affondo; prosegue nella sequenza leggera.',
      'Yarım adım geri çekilip bacaklara alçak süpürme; yere serer.': 'Mezzo passo indietro, poi una spazzata bassa alle gambe; atterra.',
      'Fırlatıcı: yükselen kesik rakibi havaya kaldırır.': 'Lancio: un taglio ascendente solleva l’avversario in aria.',
      'Sıçrayıp tepeden iner: yavaş ama gardı ezer, yere serer.': 'Salta e piomba dall’alto: lento, ma schiaccia la guardia e atterra.',
      'Atılırken dönerek geniş kesik; yere serer.': 'Un ampio taglio rotante durante lo scatto; atterra.',
      'İki kesiklik seri bitirişi; son kesik yere serer.': 'Una chiusura di sequenza a due tagli; l’ultimo taglio atterra.',
      'Rakibin kılıcını aşağı çarpıp dürter: gardı ezer.': 'Abbatte la lama dell’avversario e affonda: schiaccia la guardia.',

      'Kından yatay çekiş kesiği, çapraz iniş, geri dönen kesik; kılıç her seferinde kınına döner.': 'Un taglio orizzontale estraendo dal fodero, un taglio diagonale verso il basso e un taglio di ritorno; la lama torna ogni volta nel fodero.',
      'Derin çömelişten geniş yatay çekiş; yere serer.': 'Un’ampia estrazione orizzontale da accucciata; atterra.',
      'Atılarak kından çekiş: uzak mesafeyi bir anda kapatır, seriye devam eder.': 'Un’estrazione dal fodero in scatto: chiude una grande distanza in un istante e prosegue la sequenza.',
      'Kılıcı çekmeden kabzayla göğse vurur: hızlı, sersemletir. Ardından HAFİF ile Kesa ya da AĞIR ile Kurenai Renga.': 'Colpisce il petto con l’elsa senza estrarre: rapido e stordente. Continua con LEGGERO per Kesa o PESANTE per Kurenai Renga.',
      'Fırlatıcı: kından yükselen çekiş rakibi havaya kaldırır.': 'Lancio: un’estrazione ascendente dal fodero solleva l’avversario in aria.',
      'Çekiş duruşu: kısa bir an bekler; bu sırada gelen yakın dövüş darbesini yakalar ve kaçınılmaz bir iai kesiğiyle karşılık verir. Boşa giderse açık kalır.': 'Posa d’estrazione: attende per un attimo; un colpo ravvicinato che arriva in quel momento viene intercettato e punito con un taglio iai inevitabile. Se non arriva nulla, resta scoperta.',
      'Kesa’dan sonra yükselen ve inen iki çekiş kesiği; son kesik yere serer.': 'Dopo Kesa, un taglio d’estrazione ascendente e uno discendente; l’ultimo taglio atterra.',
      'Tekmeden sonra çömelip rakibin içinden geçen kızıl iai; arkasında belirir.': 'Dopo il calcio, un iai cremisi accucciato che trapassa l’avversario; ricompare alle sue spalle.',

      'Tek elle uzun dürtüş, yukarı savrulan kesik ve rüzgâr adımıyla derin atılma dürtüşü.': 'Un lungo affondo a una mano, un taglio sferzato verso l’alto e un affondo profondo con un passo di vento.',
      'Dönerek geniş yatay kesik; yere serer.': 'Un ampio taglio orizzontale con una rotazione; atterra.',
      'Rüzgâr adımı: çok uzaktan tek hamlede dürter, seriye devam eder.': 'Passo di vento: affonda da molto lontano in una sola mossa e prosegue la sequenza.',
      'Geri çekilirken uzun menzilli iniş kesiği: yaklaşanı cezalandırır.': 'Un taglio discendente a lunga portata mentre arretra: punisce chi si avvicina.',
      'Fırlatıcı: dönerek yükselen kesik rakibi havaya kaldırır.': 'Lancio: un taglio ascendente rotante solleva l’avversario in aria.',
      'Geri sıçrar, ardından çok uzağa uzanan dürtüşle geri döner: gardı ezer, yere serer.': 'Balza indietro, poi torna con un affondo lunghissimo: schiaccia la guardia e atterra.',
      'Üç hızlı dürtüş; sonuncusu rüzgârla rakibi savurur.': 'Tre affondi rapidi; l’ultimo spazza via l’avversario col vento.',
      'İki kez dönerek çevresini biçen kesik; gardı ezer.': 'Due rotazioni che tagliano tutto intorno; schiaccia la guardia.',

      'Kesik · Dirsek · Diz': 'Taglio · Gomito · Ginocchio',
      'Tek elle kesik, dirsek darbesi ve uçan diz: kılıçla başlayıp bedenle biter.': 'Un taglio a una mano, una gomitata e una ginocchiata volante: comincia con la spada e finisce col corpo.',
      'İki elle tepeden ezici iniş; gardı zorlar, yere serer.': 'Un colpo schiacciante a due mani dall’alto; mette sotto pressione la guardia e atterra.',
      'Omuz hücumu: öne atılıp omuzla çarpar, dengeyi sarsar. İsabet ederse seriye devam eder.': 'Spallata: si lancia in avanti e colpisce con la spalla, scuotendo la postura. Se va a segno, prosegue la sequenza.',
      'Kafa atar: kısa menzil, uzun sersemletme. İsabet ederse seriye devam eder.': 'Testata: portata corta, stordimento lungo. Se va a segno, prosegue la sequenza.',
      'Fırlatıcı: aşağıdan yukarı iki elle savrulan kesik.': 'Lancio: un taglio a due mani dal basso verso l’alto.',
      'Topuğu havaya kaldırıp balta gibi indirir: yere serer.': 'Alza il tallone e lo cala come un’ascia: atterra.',
      'Dirsekten sonra kesik ve tepeden ezici iniş; son vuruş yere serer.': 'Dopo la gomitata, un taglio e un colpo schiacciante dall’alto; l’ultimo colpo atterra.',
      'Tekmenin ardından dönen topuk tekmesi; yere serer.': 'Dopo il calcio, un calcio rotante di tallone; atterra.',

      'Ters tutuşla kesik, dönen kesik ve gölge adımı: kaybolup öne geçer, dürterek belirir.': 'Un taglio a presa inversa, un taglio rotante e un passo d’ombra: svanisce, scivola avanti e ricompare con un affondo.',
      'Sıçrayıp ters tutuşla aşağı saplar; yere serer.': 'Balza e pugnala verso il basso a presa inversa; atterra.',
      'Gölge gibi uzun atılma kesiği; seriye devam eder.': 'Un lungo taglio in scatto, come un’ombra; prosegue la sequenza.',
      'Aldatma: kesecekmiş gibi parlar, dumanla geri kaçar. Erken savuşturmayı boşa çıkarır; hemen HAFİF ile gölge adımına, AĞIR ile Kage-nui’ye bağlanır.': 'Finta: balena come per tagliare, poi sfugge indietro nel fumo. Fa sprecare una parata anticipata; prosegue subito nel passo d’ombra con LEGGERO o in Kage-nui con PESANTE.',
      'Fırlatıcı: ters tutuşla yükselen kesik.': 'Lancio: un taglio ascendente a presa inversa.',
      'Ayağının dibine sis bombası atar: yakındakini sersemletir, Kage dumanın içinde geri kaçar.': 'Lancia una bomba fumogena ai propri piedi: stordisce chi è vicino mentre Kage sfugge indietro nel fumo.',
      'Üç hızlı ters kesik ve aşağı saplama; sonuncusu yere serer.': 'Tre rapidi tagli a presa inversa e una pugnalata verso il basso; l’ultima atterra.',
      'Tekmeden sonra dumanda kaybolur, rakibin arkasında belirip saplar.': 'Dopo il calcio, svanisce nel fumo e ricompare alle spalle dell’avversario, pugnalandolo.',

      'Nodachi serisi': 'Sequenza di nodachi', 'Ağır nodachi': 'Nodachi pesante', 'Kodachi serisi': 'Sequenza di kodachi', 'Ağır kesik': 'Taglio pesante',
      'Tantō dansı': 'Danza dei tantō', 'Çift kesik': 'Doppio taglio', 'Naginata serisi': 'Sequenza di naginata', 'Ağır savuruş': 'Fendente pesante',
      'Zincir ve orak': 'Catena e falcetto', 'Zincir çekişi': 'Tirata di catena', 'Asa serisi': 'Sequenza di bastone', 'Ağır süpürme': 'Spazzata pesante',
      'Yelpaze serisi': 'Sequenza di ventaglio', 'Rüzgâr dalgası': 'Onda di vento', 'Tantō serisi': 'Sequenza di tantō', 'Ok (basılı tut: güçlü)': 'Freccia (tieni premuto: potente)',
      'Geri + AĞIR da ok atar (basılı tut: güçlü atış); ok kalmadıysa tantō ile tepeden iner.': 'Indietro + PESANTE scocca anch’esso una freccia (tieni premuto per un tiro potente); senza frecce, piomba dall’alto col tantō.',

      'KI İPTALİ!': 'ANNULLAMENTO KI!', 'HAVAYA!': 'IN ARIA!',
    });



    {
      const tb = (t, c) => `<i class="tb${c ? ' ' + c : ''}">${t}</i>`;
      merge(EN.STR, {
        kaeshi: {
          head: 'KAESHI-WAZA', strike: 'COLPISCI!', hits: 'COLPI',
          labels: {
            suriage: 'Risali la sua lama, taglia di traverso',
            harai: 'Scosta la sua lama, taglia le gambe',
            nuki: 'Schiva il colpo, taglia alle spalle',
            uchiotoshi: 'Abbatti la sua lama, sfonda',
            sandan: 'Sequenza di contrattacco a tre tagli',
          },
        },
        trial: {
          title: 'Prova combo',
          btn: { prev: 'Combo precedente', next: 'Combo successiva', retry: 'Ricomincia', close: 'Chiudi' },
          names: { chain: 'Sequenza base', s1: 'Chiusura di sequenza', s2: 'Sequenza col calcio', launch: 'Lancio', s3: 'Combo lunga' },
          desc: {
            chain: '{L} tre volte. Premi ogni tasto quando il colpo precedente va a segno; la sequenza finisce con un colpo finale.',
            s1: '{L} due volte, poi {H}: la sequenza finisce con un taglio pesante.',
            s2: '{L}, calcio {K}, poi {H}.',
            launch: '{D} + {H} lancia in aria; mentre vola, {L}, poi {H}.',
            s3: 'Due volte {L}, {D} + {H} per lanciare, {L}, {H}: cinque colpi.',
          },
          ready: (w) => `Inizio: ${w}`,
          startWith: (w) => `Questa combo inizia con ${w}.`,
          early: 'Troppo presto: premi quando il colpo precedente va a segno.',
          late: 'Troppo tardi: premi prima che la mossa finisca, proprio quando il colpo va a segno.',
          wrong: (got, want) => `Tasto sbagliato: ${got}, questo passo richiede ${want}.`,
          dir: (want) => `Manca la direzione: ${want}. Tieni la direzione, poi premi.`,
          miss: 'Mancato: il colpo non è andato a segno. Avvicinati al manichino.',
          clear: 'COMBO RIUSCITA!', clearPop: 'COMBO RIUSCITA!',
          all: 'Hai superato tutte le prove combo di questo ninja!',
        },
        coach: {
          combo: (l) => `${l} ${l} ${l} veloce: combo da 3 colpi`,
          comboT: (l) => `Tocca ${l} tre volte di fila: combo`,
          counter: (l) => `Dopo una guardia o una parata, premi ${l} quando compare COLPISCI!: contrattacco`,
          counterT: (l) => `Dopo una guardia o una parata, tocca ${l} quando compare COLPISCI!`,
        },
      });
      const L = Array.isArray(EN.STR.lessons) && EN.STR.lessons.find((l) => l.id === 'counter');
      if (L) L.d = 'Dopo una guardia o una parata, sopra la tua testa compare <b>COLPISCI!</b>: premi <kbd>F</kbd> prima che la sua barra si esaurisca. Avanti/indietro + <kbd>F</kbd> o <kbd>G</kbd> sono altri contrattacchi.';
      if (EN.STR.lessonsTouch) EN.STR.lessonsTouch.counter = `Dopo una guardia o una parata, sopra la tua testa compare <b>COLPISCI!</b>: tocca ${tb('ATTACCO', 'tb-light')} prima che la sua barra si esaurisca. Stick avanti/indietro + ${tb('ATTACCO', 'tb-light')} o ${tb('PESANTE')} sono altri contrattacchi.`;
      merge(EN.PHRASES, {
        'KOMBO TAMAM!': 'COMBO RIUSCITA!',
        'Nasıl okunur': 'Come si legge',
        '→ rakibe doğru, ← rakipten uzağa demek: o yön tuşunu (A / D ya da ok tuşları; rakip sağındaysa D) basılı tut ve saldırı tuşuna bas. Virgül: tuşlara sırayla bas. F hafif, G ağır, R tekme, S gard.':
          '→ significa verso l’avversario, ← lontano da lui: tieni premuto quel tasto di direzione (A / D o le frecce; D se l’avversario è alla tua destra) e premi il tasto d’attacco. Una virgola: premi i tasti uno dopo l’altro. F leggero, G pesante, R calcio, S guardia.',
        '▶ rakibe doğru, ◀ rakipten uzağa: yön çubuğunu o yana itip düğmeye dokun. Virgül: düğmelere sırayla dokun. Antrenmandaki Kombo denemesi her seriyi adım adım gösterir.':
          '▶ verso l’avversario, ◀ lontano da lui: spingi lo stick da quella parte e tocca il pulsante. Una virgola: tocca i pulsanti uno dopo l’altro. La Prova combo nell’Allenamento mostra ogni sequenza passo dopo passo.',
        'Gard ya da savuşturmanın ardından ekranda VUR! çıkar: altındaki çubuk bitmeden HAFİF’e bas. Yalnız HAFİF: Suriage. İleri + HAFİF: Harai (yere serer). Geri + HAFİF: Nuki (arkaya geçer). AĞIR: Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.':
          'Dopo una guardia o una parata compare COLPISCI!: premi LEGGERO prima che la sua barra si esaurisca. Solo LEGGERO: Suriage. Avanti + LEGGERO: Harai (atterra). Indietro + LEGGERO: Nuki (passa alle spalle). PESANTE: Uchiotoshi. La tua terza risposta è il colpo finale; se viene parata, lo scambio continua.',
      });
    }



    merge(EN.STR, {
      gfx: {
        title: 'Grafica',
        levels: { auto: 'Auto', high: 'Alta', medium: 'Media', low: 'Bassa', custom: 'Su misura' },
        note: {
          auto: 'Sceglie in base al dispositivo e si abbassa da sola se un incontro scatta.',
          high: 'Tutte le luci e gli effetti. Per dispositivi potenti.',
          medium: 'Bagliore leggero, niente ombre. Per la maggior parte dei telefoni.',
          low: 'La più fluida. Per telefoni meno recenti.',
          custom: 'Le tue impostazioni (Avanzate).',
        },
        now: (lv) => `Ora: ${lv}`,


        adv: {
          title: 'Avanzate',
          note: 'Se ne cambi una, la scelta diventa «Su misura»; premendo un livello predefinito tornano i suoi valori.',
          hot: 'scalda di più',
          knob: { scale: 'Risoluzione', msaa: 'Anti-aliasing', bloom: 'Bagliore', shadows: 'Ombre e riflessi', effects: 'Meteo e particelle' },
          val: { off: 'No', low: 'Bassa', mid: 'Media', full: 'Piena', simple: 'Semplice' },
        },
      },
    });



    merge(EN.STR, {
      fps: {
        title: 'Frequenza fotogrammi',
        show: 'Mostra FPS',
        levels: { max: 'Max' },
        note: {
          60: 'Stabile e fresco. Il migliore per la maggior parte dei telefoni.',
          90: 'Più fluido dove lo schermo lo supporta. Consuma più batteria.',
          120: 'Il più fluido sugli schermi a 120 Hz. Consuma più batteria.',
          max: 'Veloce quanto lo permette lo schermo.',
        },
      },
    });


    merge(EN.STR, {
      set: {
        title: 'Impostazioni', close: 'Chiudi',
        tabs: { audio: 'Audio', controls: 'Comandi', gfx: 'Grafica', lang: 'Lingua' },
        touch: 'Touch', keys: 'Tastiera', pad: 'Gamepad',
        touchNote: 'Le impostazioni dei comandi touch compaiono qui appena tocchi lo schermo.',
      },
    });



    merge(EN.STR, { lang: { title: 'Lingua', change: 'Cambia lingua', close: 'Chiudi' } });




    merge(EN.STR, {
      thelp: {
        title: { float: 'Joystick', fixed: 'Joystick fisso', dpad: 'Croce' },
        float: { walk: 'Metti il pollice sulla metà libera e scorri: cammini', jump: 'Spingi in alto: salto', guard: 'Tira in basso: guardia', dash: 'Due colpetti di lato: scatto' },
        fixed: { walk: 'Tieni lo stick dal centro e spingi di lato: cammini', jump: 'Spingi in alto: salto', guard: 'Tira in basso: guardia', dash: 'Due colpetti di lato: scatto' },
        dpad: {
          walk: 'Tieni premuto: cammini', step: 'Tocco rapido: un passo corto', jump: 'Tocca: salto', guard: 'Tieni premuto: guardia',
          dash: 'Doppio tocco: scatto', both: 'Premi tra due pulsanti per entrambi (▶ + ▲ = salto in avanti)',
        },
        edit: (b) => `${b}: trascina qualsiasi pulsante dove vuoi e regolane dimensione e opacità. In Impostazioni → Comandi.`,
      },
    });


    merge(EN.PHRASES, { 'Shuriken': 'Shuriken', 'KI': 'KI' });


    merge(EN.STR, { menu: { arcadeDesc: 'Un percorso di otto incontri per ogni ninja. Riprendi dal prossimo rivale, sblocca il finale del personaggio e il sigillo del Maestro.' }, sel: { title: { arcade: 'Arcade · Percorso del personaggio' } },
      journey: {
        start: 'Inizia il percorso',
        resume: (i, n) => 'Continua · ' + i + '/' + n + '',
        ending: 'Guarda il finale',
        replay: 'Rigioca il percorso',
        badge: 'Sigillo del Maestro',
        completed: 'Percorso completato',
        progress: (i, n) => '' + i + '/' + n + ' incontri completati · Progressi salvati',
        reward: 'Premio: finale del personaggio e sigillo del Maestro permanente',
        saved: 'Ogni vittoria viene salvata. Lasciare un incontro conta come un nuovo tentativo.',
        menu: (done, active) => '' + done + ' percorsi completati · ' + active + ' in corso',
        clearReward: 'Sigillo del Maestro ottenuto · Finale del personaggio sbloccato'
      }
    });



    merge(EN.STR, {
      set: { tabs: { save: 'Progressi' } },
      acct: {
        title: 'Conserva i tuoi progressi',
        cgOn: (n) => `Account CrazyGames: ${n}. Titoli, colori Campione, Dan e punteggi vengono salvati nel tuo account.`,
        cgWait: (n) => `Account CrazyGames: ${n}. Connessione al tuo account…`,
        cgFail: (n) => `Account CrazyGames: ${n}. Al momento il tuo account non è raggiungibile; i nuovi punteggi restano per ora su questo dispositivo.`,
        cgSave: 'Salva i progressi nel tuo account CrazyGames',
        cgSaveNote: 'Accedi e titoli, colori Campione e punteggi passano al tuo account, su ogni dispositivo.',
        rcTitle: 'Codice di recupero',
        rcNote: 'Annota questo codice. Inseriscilo qui su un nuovo dispositivo per recuperare titoli, colori Campione, Dan e punteggi.',
        rcShow: 'Mostra codice', rcNew: 'Nuovo codice', rcNewDone: 'Nuovo codice pronto; quello vecchio non funziona più.',
        rcNeedName: 'Prima salva un punteggio con un nickname per ottenere un codice di recupero.',
        rcEnter: 'Inserisci un codice di recupero', rcGo: 'Recupera',
        rcDone: (n, c) => `Bentornato, ${n}! I tuoi progressi sono stati recuperati. Il tuo nuovo codice di recupero: ${c}`,
        err: { bad_code: 'Non riconosciamo questo codice. Controlla i caratteri.', rate: 'Troppi tentativi. Riprova più tardi.', offline: 'Server non raggiungibile. Controlla la connessione.', banned: 'Questa identità non può essere usata.', error: 'Qualcosa è andato storto. Riprova.' },
        local: 'Qui il salvataggio online non è disponibile; i progressi restano su questo dispositivo.',
        offline: 'Al momento sei offline; i progressi restano su questo dispositivo.',
        loading: 'Caricamento…',
      },
      lb: { savedLocalAccount: (r) => (r ? `#${r} su questo dispositivo · al momento il tuo account non è raggiungibile` : 'Salvato su questo dispositivo · al momento il tuo account non è raggiungibile') },
    });



    merge(EN.STR, {
      priv: {
        notice: 'Shadow Duel salva il tuo nickname e i tuoi punteggi per le classifiche online.',
        policy: 'Informativa privacy', terms: 'Termini', both: 'Informativa privacy e Termini',
        ok: 'OK', label: 'Avviso sulla privacy',
      },
    });



    merge(EN.STR, {
      menu: { trainDrill: 'Esercizio parate' },
      tutor: {
        defend: 'DIFENDITI!', attack: 'ATTACCA!', again: 'ANCORA!',
        pass: {
          freeze: (l, g) => `Tempo fermo: ${g} per difenderti, ${l} per contrattaccare`,
          slow: (l, g) => `Rallentatore: ${g} quando l’anello si chiude, poi ${l}`,
          real: (l, g) => `Velocità piena: ${g} per difenderti, ${l} per contrattaccare, due volte`,
        },
        fail: {
          early: 'Troppo presto! Metti la guardia poco prima che arrivi la lama.',
          late: 'Troppo tardi! Metti la guardia poco prima che arrivi la lama.',
          slow: 'Troppo tardi! Contrattacca mentre c’è ATTACCA!.',
          atk: 'Prima difenditi, poi attacca!',
          miss: 'Riproviamo.',
        },
        mastered: 'IMPARATO!', masteredSub: 'Difendi, contrattacca, ripeti',
        warm: (l) => `Riscaldamento: colpisci ${l} tre volte`,
        nudge: (k) => `Premi ${k}`, nudgeT: (k) => `Tocca ${k}`,


        skip: 'Salta ›',
        steps: {
          attack: (b) => `Colpisci con ${b}`, guard: (b) => `Para la lama con ${b}`, counter: (b) => `Contrattacca con ${b}`,
          timing: (b, l) => `Tocca a te: ${b} quando l’anello si chiude, poi ${l}`,
        },
        ok: { attack: 'BENE!', guard: 'PARATA!', counter: 'CONTRATTACCO!', timing: 'PERFETTO!' },
        ready: 'PRONTO!', readySub: 'Ora vinci il duello',
      },
    });




    merge(EN.STR, {
      onb: { selIntro: 'Scegli il tuo ninja: ognuno ha il suo percorso', more: 'Dettagli' },
      tips: {
        head: 'CONSIGLIO',
        ki: (k) => `KI pieno! ${k}: mossa speciale`,
        gbreak: (k, h) => `Resta in guardia: un calcio ${k} o un fendente pesante ${h} riempie la barra gialla e rompe la guardia`,
        gbreakH: (h) => `Resta in guardia: un fendente pesante ${h} riempie la barra gialla e rompe la guardia`,
        posture: (g) => `La tua barra della postura si sta riempiendo: allontanati, o para con ${g}`,
        dash: (a) => `Doppio tocco su ${a}: scatto`,
        shuriken: (t) => `${t}: lancia uno shuriken`,
        heavy: (h) => `${h}: fendente pesante, più lento ma più forte`,
        lessons: (a, b) => `Lezioni complete: ${a} → ${b}`,
        controls: (a, b) => `Puoi spostare e ridimensionare i pulsanti in ${a} → ${b}`,
      },
    });


    merge(EN.STR, {
      online: {
        title: 'Gioca con un amico',
        menuSub: 'Duello online · condividi un link o un codice di 6 lettere',
        homeSub: 'Crea una stanza e manda il link al tuo amico, oppure scrivi il codice che ti ha mandato.',
        create: 'Crea una stanza',
        join: 'Entra',
        codePh: 'CODICE',
        haveCode: 'Codice stanza',
        room: 'Stanza',
        linkLabel: 'Link d’invito',
        back: 'Indietro',
        leave: 'Esci dalla stanza',
        copy: 'Copia link',
        copied: 'Copiato',
        share: 'Condividi',
        invite: 'Invita un amico',
        shareText: (c) => `Sfidami a duello su Shadow Duel! Stanza ${c}`,
        inviteNote: 'Manda il link, o di’ il codice al tuo amico.',
        waitFriend: 'In attesa che il tuo amico entri…',
        joining: 'Ricerca della stanza…',
        connecting: 'Connessione al tuo amico…',
        connected: 'Connesso',
        you: 'Tu',
        friend: 'Amico',
        friendTag: 'AMICO',
        waitPick: 'Sta scegliendo…',
        pickTitle: 'Il tuo lottatore',
        arenaTitle: 'Arena',
        arenaHost: 'L’arena la sceglie il tuo amico',
        ready: 'Pronto',
        notReady: 'Non pronto',
        readyWait: 'In attesa che il tuo amico sia pronto…',
        bothReady: 'Si comincia…',
        ping: (ms) => `Ping ${ms} ms`,
        badCode: 'Un codice stanza ha 6 lettere.',
        noRoom: 'Nessuna stanza con questo codice. Controlla il codice con il tuo amico.',
        full: 'Questa stanza è piena.',
        expired: 'Nessuno è entrato per 10 minuti, quindi la stanza si è chiusa.',
        noDirect: 'Impossibile collegarsi direttamente alla rete del tuo amico. Prova un’altra rete (Wi-Fi / dati mobili).',
        retry: 'Riprova',
        noConnect: 'Impossibile collegarsi al tuo amico. Controlla la connessione a internet e riprova.',
        version: 'Tu e il tuo amico avete versioni diverse del gioco. Ricaricate la pagina entrambi.',
        signalDown: 'Impossibile raggiungere il server di gioco. Controlla la connessione a internet.',
        friendLeft: 'Il tuo amico ha lasciato la stanza.',
        waitIn: (s) => `In attesa del tuo amico… ${s}`,
        away: (s) => `Il tuo amico è uscito dal gioco… ${s}`,
        leaveQ: 'Lasciare l’incontro?',
        leaveSub: 'Questo lo vince il tuo amico.',
        stay: 'Continua a giocare',
        leaveMatch: 'Esci',
        win: 'Hai vinto',
        lose: 'Hai perso',
        draw: 'Pareggio',
        over: 'Incontro finito',
        whyDrop: 'La connessione del tuo amico si è interrotta. Hai vinto (non registrato).',
        whyLeft: 'Il tuo amico ha lasciato l’incontro.',
        whyAway: 'L’incontro è finito mentre eri via.',
        whyDesync: 'L’incontro è andato fuori sincrono (un problema di connessione), quindi non conta.',
        rematch: 'Rivincita',
        rematchWait: 'In attesa del tuo amico…',
        rematchAsk: 'Rivincita (il tuo amico la vuole)',
        change: 'Cambia lottatori',
        rounds: (a, b) => `Round ${a} – ${b}`,
        turning: (s) => `Il tuo amico sta girando il telefono… ${s}`,
        paused: 'In pausa',
        whyPauseWin: 'Il tuo amico non è tornato in tempo. Hai vinto (non registrato).',
        whyPauseLose: 'Non sei tornato in tempo, quindi l’incontro è finito.',
        whyPauseBoth: 'Nessuno dei due è tornato in tempo, quindi l’incontro è finito.',
      },
    });


    merge(EN.STR, {
      ranked: {
        title: 'Duello classificato', menuSub: 'Avversario casuale · punti, ranghi e stagioni', offline: 'La Classificata al momento è offline',
        season: (n) => `Stagione ${n}`, endsIn: (d) => `Finisce tra ${d} giorni`, endsToday: 'Finisce oggi',
        rating: 'Punteggio', record: (w, l, d) => `${w} V · ${l} S` + (d ? ` · ${d} P` : ''), placement: (a, b) => `Piazzamento ${a}/${b}`,
        place: (n) => `In classifica #${n}`, find: 'Cerca avversario', findUnranked: 'Cerca avversario (non classificata)', board: 'Classifica', how: 'Come funziona',
        howLines: ['Il server trova un avversario vicino al tuo punteggio; la fascia si allarga mentre aspetti.', 'Quando accettate entrambi, scegli un lottatore senza vedere il suo (solo lottatori che hai sbloccato).',
          'Vince chi prende 2 round su 3. Lasciare un incontro equivale a perderlo.', 'I punti cambiano solo quando entrambi i dispositivi riportano lo stesso risultato. Le stagioni durano 4 settimane; il n. 1 riceve un costume speciale.'],
        reward: 'N. 1 della stagione: un costume speciale e il proprio nome nella Sala dei Campioni',
        signIn: 'Accedi per guadagnare punti', guestNote: 'Come ospite giochi senza classifica.', nickNote: 'Scegli un nickname per giocare in Classificata.',
        back: 'Indietro', you: 'Tu', titleLbl: 'Titolo', noTitle: 'Nessuno',
        searching: 'Ricerca di un avversario…', window: (n) => `Fascia di punteggio ±${n}`, windowAny: 'Qualsiasi punteggio',
        warm: 'Riscaldati contro la CPU mentre aspetti', warmTag: 'Riscaldamento · CPU · non classificata', searchShort: 'Ricerca', warmBack: 'Torna alla ricerca', cancel: 'Annulla',
        none: 'Nessun avversario al momento.', foundTitle: 'Avversario trovato!', accept: 'Accetta', decline: 'Rifiuta',
        ranked: 'Classificata', unranked: 'Non classificata · niente punti',
        why: { guest: 'un giocatore è ospite', same_network: 'siete sulla stessa rete', pair_limit: 'oggi avete già giocato 3 incontri classificati', daily_limit: 'limite giornaliero di incontri classificati' },
        waitOpp: 'In attesa che l’avversario accetti…', touch: 'Touch', keys: 'Tastiera / pad', placementTag: 'Piazzamento', guestTag: 'Ospite',
        declined: 'L’avversario non ha accettato · nuova ricerca', youDeclined: 'Hai rifiutato l’incontro.', penalty: (s) => `Hai rifiutato gli ultimi incontri: puoi cercare di nuovo tra ${s} s.`,
        suspended: 'Il tuo account per la Classificata è sotto verifica (troppe contestazioni). Le altre modalità sono aperte.',
        pickTitle: 'Scegli il tuo lottatore', pickSub: 'L’avversario non vede la tua scelta', lock: 'Conferma', lockedIn: 'Confermato', oppPicking: 'L’avversario sta scegliendo…', oppLocked: 'L’avversario ha confermato',
        lockedFighter: 'Non ancora sbloccato in giocatore singolo', costume: 'Costume', plain: 'Colori originali',
        connecting: 'Connessione all’avversario…', noConnect: 'Impossibile collegarsi all’avversario; l’incontro non conta. Nuova ricerca…',
        leaveQ: 'Lasciare l’incontro?', leaveSub: 'Perderai questo incontro classificato.', stay: 'Continua a giocare', leave: 'Esci',
        waitIn: (s) => `In attesa dell’avversario… ${s}`, away: (s) => `L’avversario è uscito dal gioco… ${s}`, turning: (s) => `L’avversario sta girando il telefono… ${s}`, paused: 'In pausa',
        confirming: 'Conferma del risultato…', win: 'Hai vinto', lose: 'Hai perso', draw: 'Pareggio', over: 'Incontro finito',
        delta: (d) => (d >= 0 ? '+' : '−') + Math.abs(d) + ' punti', nc: 'Questo incontro non conta', disputed: 'I due dispositivi hanno riportato risultati diversi: l’incontro è sotto verifica e i punti non sono cambiati.',
        ncWhy: { desync: 'i due dispositivi hanno calcolato l’incontro in modo diverso (un problema di connessione)', connection: 'la connessione di entrambi i giocatori è caduta', input_mismatch: 'i comandi registrati dai due dispositivi non coincidevano', abandoned: 'entrambi i giocatori sono usciti', no_second_report: 'il risultato dell’avversario non è mai arrivato', mixed: 'i risultati non coincidevano' },
        promoted: 'Promosso!', demoted: 'Rango perso', placementDone: 'Piazzamento completato!', pending: 'Il risultato comparirà a breve in classifica.',
        findAgain: 'Cerca ancora', rematch: 'Rivincita', rematchWait: 'In attesa dell’avversario…', rematchAsk: 'Rivincita (l’avversario la vuole)', menu: 'Menu',
        youLeft: 'Hai lasciato l’incontro: sconfitta.', oppLeft: 'L’avversario ha lasciato l’incontro: hai vinto.', silent: 'La connessione dell’avversario si è interrotta.', rounds: (a, b) => `Round ${a} – ${b}`,
        unrankedNote: 'Incontro non classificato',
        ghostFound: 'È scesa in campo l’ombra di un vero giocatore',
        ghostHouseName: (n) => `Ombra del dojo · ${n}`, ghostHouseFound: 'È scesa in campo un’ombra del dojo', ghostHouseNote: 'La CPU combatte con uno stile tipico del dojo. Non è un giocatore dal vivo.', ghostName: (n) => `Ombra di ${n}`, ghostTag: 'Ombra',
        ghostNote: 'La CPU combatte con lo stile di questo vero giocatore. Non è un giocatore dal vivo.',
        ghostReady: 'L’ombra è pronta',
        ghostLeft: 'Hai lasciato l’incontro con l’ombra: sconfitta.', aiTag: 'IA',
        hallTab: 'Classificata', hallDesc: (g) => `I migliori della stagione · ${g} incontri classificati per entrare in classifica`, champs: 'Campioni', champOf: (n) => `Campione della stagione ${n}`,
        noChamps: 'Ancora nessun campione di stagione.', me: (p) => `La tua posizione: #${p}.`, meNone: 'Gioca incontri classificati per entrare in classifica.', empty: 'Ancora nessuno in classifica in questa stagione.',
        tierDesc: ['Fante', 'Samurai senza padrone', 'Samurai', 'Guardia dello stendardo', 'Signore feudale', 'Shogun'],
        rulesBtn: 'Come funziona', rulesTitle: 'Come funziona la Classificata', rulesSub: 'Ranghi, punti e stagioni', rTiers: 'Ranghi', rYou: 'Tu',
        rNext: (n, name) => `${n} punti a ${name}`, rTop: 'Sei nel rango più alto', rPlacing: (a, b) => `Piazzamento ${a}/${b}: il tuo rango appare alla fine`,
        rPlacement: 'Piazzamento', rPlaceLine: (a, b) => `I tuoi primi ${a} incontri classificati ti piazzano (${b} nelle stagioni successive); poi appare il tuo rango.`,
        rPoints: 'Punti', rPointsLines: ['Vinci per guadagnare punti, perdi per scendere; un pareggio ti sposta di poco.', 'Battere un avversario più forte vale di più; perdere contro uno più debole costa di più.', 'Lasciare un incontro conta come sconfitta.'],
        rSeason: 'Stagione', rSeasonLine: (d, left) => `Una stagione dura ${d} giorni · ${left}.`,
        rSeasonEnd: (p) => `Alla fine il tuo punteggio torna a metà strada verso 1500 e rigiochi ${p} incontri di piazzamento; il tuo rango migliore resta come distintivo.`,
        rReward: (list, n) => `Il n. 1 della stagione vince: ${list} (con almeno ${n} giocatori in classifica).`, rCostumeAll: (x) => `${x} (per ogni lottatore)`, rRewardAny: 'un costume speciale e un titolo',
        rBoard: 'Classifica', rBoardLine: (g) => `Per entrarci: ${g} incontri classificati in questa stagione e piazzamento completato.`,
        rFighters: 'Lottatori', rFightersLine: 'Puoi scegliere i lottatori che hai sbloccato in giocatore singolo.',
        aiNote: 'Quando ci sono pochi giocatori online, potresti affrontare avversari IA che giocano con lo stile di giocatori veri.', gotIt: 'Ho capito',
        err: { network: 'Impossibile raggiungere il server. Controlla la connessione a internet.', bad_version: 'È uscita una nuova versione del gioco: ricarica la pagina.', busy: 'La coda è molto piena, riprova tra poco.',
          rate_limited: 'Troppi tentativi, aspetta un attimo.', disabled: 'La Classificata al momento è offline.', banned: 'Questo account non può giocare in Classificata.', other: 'Qualcosa è andato storto, riprova.' },

        bg: { ru: 'Esplora mentre cerchi', stopT: 'Fermare la ricerca classificata?', stopS: 'Iniziare questo scontro termina la ricerca.', stopGo: 'Ferma e gioca', keep: 'Continua a cercare', stopped: 'Ricerca classificata fermata', chip: 'Ricerca' },
        card: { findMatch: 'Trova partita', searching: 'Ricerca…', resume: 'Torna alla partita',
          place: (p, n) => `${p}° su ${n} in classifica`, placeOnly: (p) => `${p}° in classifica`,
          toBoard: (n) => (n === 1 ? 'Ancora 1 partita per entrare in classifica' : `Ancora ${n} partite per entrare in classifica`), toBoardSoon: 'Ancora qualche partita per entrare in classifica',
          invite: 'Da Ashigaru a Shōgun: la tua prima partita classificata è a un tocco',
          guestInvite: 'Accedi per giocare a punti · gli ospiti giocano senza punti', nickInvite: 'Scegli un nickname per giocare a punti',
          winRate: (p) => `${p}% vittorie`, streakW: (n) => `${n} vittorie di fila`, streakL: (n) => `${n} sconfitte di fila`,
          peak: (t) => `Migliore della stagione: ${t}`, shields: (n) => `Scudo ×${n}`, top: 'Top 3 della stagione', you: 'Tu', empty: 'Nessuno in classifica: sii il primo', rating: 'punti' },
      },

      upd: { ready: 'Nuova versione pronta — tocca per aggiornare', refresh: 'Nuova versione disponibile — ricarica la pagina per giocarla', close: 'Chiudi' },
    });



    merge(EN.STR, {
      pass: {
        k: '影', lv: 'LV',
        level: (n) => `Livello ${n}`,
        xp: (a, b) => `${a} / ${b} XP`, xpMax: (n) => `${n} XP in totale`, plus: (n) => `+${n} XP`,
        name: 'Pass dell’Ombra', season: (n) => `Stagione ${n}`, left: (d) => `Ancora ${d} giorni`, lastDay: 'Ultimo giorno',
        tier: (t, n) => `Tappa ${t}/${n}`, ready: (n) => `${n} da riscattare`,
        free: 'Gratis', bonus: 'Ombra', bonusAds: 'Ogni premio: una pubblicità', bonusWait: (n) => `Senza pubblicità: si apre ${n} tappe dopo`,
        claim: 'Riscatta', claimAll: (n) => `Riscatta tutto (${n})`, owned: 'Riscattato', watch: 'Guarda spot', milestone: 'Gratis', opensAt: (t) => `Alla tappa ${t}`,
        online: 'Serve la connessione', soon: 'Nuove tappe in arrivo', soonXp: 'I tuoi XP continuano a contare', close: 'Chiudi', tabs: { pass: 'Pass', profile: 'Profilo' },
        rows: { win: 'Vittoria', loss: 'Partecipazione', rounds: 'Round', perfect: 'Perfetto', rally: 'Scambio', counter: 'Contrattacco', parry: 'Parata', short: 'Incontro rapido', boost: 'Potenziamento', daily: 'Prima vittoria del giorno', streak: 'Serie', clear: 'Percorso', trial: 'Prova combo', tutorial: 'Tutorial', first: 'Benvenuto' },
        streakN: (n) => `giorno ${n}`,
        up: 'Nuovo livello', got: 'Nuovo premio',
        boostName: (n) => `×1,5 XP · ${n} incontri`, honorName: (n) => `+${n} onore`,
        gotDup: (n) => `Ce l’hai già: al suo posto ×1,5 XP per ${n} incontri`, boostLeft: (n) => `×1,5 XP · ancora ${n} incontri`,
        kinds: { cos: 'Costume', title: 'Titolo', badge: 'Distintivo', frame: 'Cornice', trail: 'Scia della lama', boost: 'Potenziamento XP', honor: 'Onore' },
        use: 'Equipaggia', inUse: 'Equipaggiato', none: 'Ancora niente', wearHint: 'Indossa i costumi nella selezione del lottatore, alla riga Aspetto.',
        heads: { titles: 'Titoli', badges: 'Distintivi', frames: 'Cornici', trails: 'Scie della lama', costumes: 'Costumi', seals: 'Sigilli del percorso' },
        total: (n) => `${n} XP in totale`, streak: (n) => `${n} giorni di fila`,
        daily: 'Prima vittoria del giorno: +100 XP', dailyDone: 'Prima vittoria di oggi: fatta',
        seal: { 1: 'Percorso completato', 2: 'Menkyo: percorso completato 2 volte', 3: 'Kaiden: percorso completato 3 volte' },
        clears: (n) => `Percorso completato ${n}×`,
        next2: 'Completa il percorso una 2ª volta: costume e titolo Menkyo', next3: 'Completalo una 3ª volta: ombra e titolo Kaiden',
        rank: { 2: 'Menkyo', 3: 'Kaiden' }, cos2: (n) => `${n} · colori Menkyo`, cos3: (n) => `${n} · ombra Kaiden`,
        themes: { sakura: 'Sakura', ember: 'Brace', frost: 'Brina', jade: 'Giada', ash: 'Cenere', moon: 'Luna', lotus: 'Loto', storm: 'Tempesta', yami: 'Yami' },
        items: {
          trail_sakura: 'Scia sakura', trail_ember: 'Scia di brace', trail_frost: 'Scia di brina', trail_jade: 'Scia di giada', trail_violet: 'Scia viola', trail_gold: 'Scia d’oro',
          title_novice: 'Lama Novizia', title_wanderer: 'Viandante', title_duelist: 'Duellante', title_parry: 'Muro d’Acciaio', title_ronin: 'Ronin', title_nightblade: 'Lama della Notte', title_s1: 'Ombra della Stagione 1',
          badge_blade: 'Distintivo lama', badge_moon: 'Distintivo luna', badge_fire: 'Distintivo fuoco', badge_snow: 'Distintivo neve', badge_sakura: 'Distintivo sakura', badge_dragon: 'Distintivo drago', badge_kage: 'Distintivo ombra',
          frame_bronze: 'Cornice di bronzo', frame_silver: 'Cornice d’argento', frame_crimson: 'Cornice cremisi', frame_jade: 'Cornice di giada', frame_gold: 'Cornice d’oro',
        },
      },
    });



    merge(EN.STR, {
      pass: {
        kinds2: { pose: 'Posa di vittoria', hitfx: 'Effetto colpo', slash: 'Fendente di risposta', aura: 'Aura di ki', ko: 'Finale KO', card: 'Targhetta', arena: 'Variante d’arena', music: 'Musica del menu', rkey: 'Chiave', akey: 'Chiave', ticket: 'Biglietto', shield: 'Scudo' },
        items2: { key_rival: 'Chiave della sfida', key_arena: 'Chiave dell’arena', ticket_trial: 'Biglietto di prova', shield: 'Scudo classificato' },
        heads2: { title: 'Titolo', flair: 'Ornamenti da duello', arenas: 'Varianti d’arena', music: 'Musica del menu', items: 'Oggetti' },
        profile: 'Profilo',
        profileSub: 'Titolo · costumi · ornamenti',
        passTab: 'Pass dell’Ombra',
        tapEquip: 'Tocca per equipaggiare',
        plain: 'Normale',
        usual: 'Solita',
        noneYet: 'Si ottiene dal Pass dell’Ombra',
        shields: (n, m) => `Scudo classificato ${n}/${m}`,
        shieldHelp: 'Una sconfitta classificata non toglie punti; uno al giorno, scatta da solo.',
        tickets: (n) => `Biglietti di prova: ${n}`,
        ticketHelp: 'Prova un ninja bloccato per 3 incontri contro la CPU: toccalo nella scelta del combattente.',
        useTicket: (n) => `Biglietto di prova · ${n} incontri`,
        useTicketSub: (n) => `Ne hai ${n}`,
        ticketLeft: (n) => `Prova: ancora ${n} incontri`,
        keyRival: (name) => `Sfida aperta: ${name}`,
        keyArena: (name) => `Arena aperta: ${name}`,
        keyHonor: (n) => `Niente più da aprire: +${n} onore`,
        shieldGot: (n, m) => `Scudo classificato: ${n}/${m}`,
        shieldFull: (n) => `Scudi al massimo: invece +${n} onore`,
        shieldOff: (n) => `Qui non c’è la classificata: invece +${n} onore`,
        shieldUsed: 'Scudo usato: nessun punto perso',
        rankedHonor: (n) => `+${n} onore`,
        variant: 'Variante',

        newTag: 'NUOVO', newN: (n) => `Novità: ${n}`, headUnlocks: 'Ninja e arene', headRewards: 'Premi classificati',
        flair: { pose_tenchi: 'Lama al cielo', pose_rei: 'Inchino rei', pose_hiza: 'Zanshin in ginocchio', pose_katsugi: 'Lama in spalla', pose_kissaki: 'Sei il prossimo', hitfx_kinpaku: 'Colpi di foglia d’oro', hitfx_aizome: 'Inchiostro indaco', hitfx_sakura: 'Esplosione di sakura', hitfx_kitsunebi: 'Fuoco di volpe', hitfx_raijin: 'Scintille di Raijin', slash_kin: 'Filo d’oro', slash_sumi: 'Pennello sumi', slash_hana: 'Vento di petali', slash_rai: 'Taglio del tuono', aura_kitsunebi: 'Aura di fuoco di volpe', aura_raiun: 'Aura di tempesta', aura_hana: 'Aura di fiori', aura_gekko: 'Aura di luna', ko_enso: 'Finale ensō', ko_hanafubuki: 'Tempesta di petali', ko_raiko: 'Fulmine', ko_mikazuki: 'Falce di luna', card_seigaiha: 'Onde seigaiha', card_yozakura: 'Sakura notturno', card_ryu: 'Lacca del drago', card_tsukiyo: 'Pini al chiaro di luna', card_asanoha: 'Oro asanoha', arena_temple_snow: 'Tempio innevato', arena_rain_moon: 'Bambù al chiaro di luna', arena_snow_night: 'Vetta innevata di notte', arena_market_rain: 'Mercato notturno sotto la pioggia', music_haru: 'Giardino di primavera', music_yuki: 'Luna di neve', music_matsuri: 'Notte di festa', pass1_akane: 'Abito d’ombra lunare' },
      },
    });

    void dec; void fmtTime; void num;
  };



  (ND.JOURNEY_COPY || (ND.JOURNEY_COPY = {}))['it'] = {
    ui: ['Percorso del personaggio', 'Rivale finale', 'Maestria facoltativa', 'Vinci questo incontro per tenere la stella.', 'Stella maestria ottenuta', 'Stella non ottenuta · Riprova rigiocando', 'Stelle maestria', 'Completa il percorso con 6 stelle su 8 per ottenere il tuo titolo e i colori Eredità. Le stelle restano tra una partita e l’altra.', 'Colori originali', 'Colori Eredità', 'Aspetto', 'Ottieni 6 stelle maestria e completa il percorso di questo personaggio.', 'Il tuo percorso precedente e i premi sono conservati. Rigioca per scoprire la nuova strada.', 'Sfida a Shura: completa i percorsi di 3 personaggi diversi.', 'Vinci questo duello per sbloccare', 'Percorso completato', 'Capitolo'],
    goals: ['Parate', 'Contrattacchi a segno', 'Colpi pesanti a segno', 'Calci a segno', 'Colpi aerei a segno', 'Attacchi in scatto a segno', 'Terzi colpi di combo', 'Proiettili a segno', 'Tecniche ki a segno', 'Guardie rotte'],
    titles: ['Giuramento cremisi', 'Vento libero', 'Cuore di montagna', 'Orme d’inverno', 'Fiore di luna', 'Stendardo invitto', 'Coraggio senza maschera', 'Promessa silenziosa', 'Tigre senza catene', 'Mano aperta', 'Brezza quieta', 'Orizzonte lontano', 'Una seconda alba'],
    endings: ['Akane abbassa la lama davanti a Ren. Ricostruirà la sua scuola insegnando, non vendicandosi.', 'Aoi chiude il vecchio duello con Akane e lascia il tempio da pari, libero di scegliere la sua strada.', 'Kuro e Tetsu depongono le armi. La strada di montagna è di nuovo aperta agli abitanti del villaggio.', 'Yuki accetta la mano che Hana le tende. Per la prima volta lascia le sue orme accanto a quelle di qualcun altro.', 'Hana riporta Yuki alla festa delle lanterne. Nel suo ultimo ballo c’è posto per un’amica.', 'Tetsu si guadagna il rispetto di Kuro e pianta il suo stendardo al passo: nessun abitante verrà respinto.', 'Ren supera gli inganni di Kage e si toglie la maschera. Non ha più bisogno della paura per farsi ascoltare.', 'Kage mostra il volto a Ren, poi scompare. Stavolta la sua promessa sopravvive alla sua ombra.', 'Tora posa la catena accanto al bastone di Jin. Il guado del fiume non appartiene a nessun padrone.', 'Jin ferma Tora senza togliergli la vita. Alla cascata, un nuovo allievo chiede la sua prima lezione.', 'Mai afferra con il ventaglio l’ultima freccia di Tsubame. La loro sfida finisce con un inchino, non con un rancore.', 'Tsubame finalmente legge il vento di Mai. Non scocca l’ultima freccia e si volge verso un nuovo orizzonte.', 'Shura affronta Akane senza la sua corona. La sconfitta non lo definisce più; la prossima lezione comincia all’alba.'],
  };

  if (ND.i18n && ND.i18n.loaded) ND.i18n.loaded('it');
})(window.ND = window.ND || {});
