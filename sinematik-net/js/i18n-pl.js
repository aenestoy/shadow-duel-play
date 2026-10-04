




















(function (ND) {
  'use strict';
  (ND.I18N_CATALOGS || (ND.I18N_CATALOGS = {})).pl = function (I, EN) {
    const merge = I.merge;
    const num = (n) => I.num(n);
    const dec = (x) => I.dec(x);
    const fmtTime = (s) => I.time(s);


    const pl = (n, one, few, many) => {
      const v = Math.abs(parseInt(String(n).replace(/[^\d-]/g, ''), 10));
      if (!Number.isFinite(v)) return many;
      if (v === 1) return one;
      const a = v % 100, b = v % 10;
      return b >= 2 && b <= 4 && !(a >= 12 && a <= 14) ? few : many;
    };


    merge(EN.STR, {
      menu: {

        brand: (nc, na) => {
          const ix = (w) => (EN.NUMWORDS || []).findIndex((x) => String(x).toLowerCase() === String(w).toLowerCase());
          const i = ix(nc), j = ix(na);
          const fem = (w, k, cap) => (k === 1 ? (cap ? 'Jedna' : 'jedna') : k === 2 ? (cap ? 'Dwie' : 'dwie') : w);
          return `${fem(nc, i, true)} ${pl(i < 0 ? nc : i, 'postać', 'postacie', 'postaci')}, ${fem(na, j, false)} ${pl(j < 0 ? na : j, 'arena', 'areny', 'aren')} i ukryty mistrz. Starcia na miecze w czasie rzeczywistym, zwarcia ostrzy, parowania, łamanie postawy, techniki ki i fizyka ragdoll.`;
        },
        arcade: 'Arcade',
        arcadeDesc: 'Pokonuj rywali jednego po drugim, gdy rośnie poziom trudności, a na końcu czeka ukryty mistrz. Wygrywaj, by odblokować nowych ninja i areny.',
        arcadeProg: (best, c, ct, a, at) => `${best ? 'Rekord ' + num(best) + ' · ' : ''}odblokowano: ninja ${c}/${ct} · areny ${a}/${at}`,
        train: 'Trening',
        trainDesc: 'Ćwicz swobodnie na manekinie albo ucz się krok po kroku',
        trainFree: 'Swobodny',
        trainTut: 'Samouczek',
        watchShort: 'Dwóch losowych ninja, SI Legenda',
        specialKey: 'Technika ki (pełne ki)',
        single: 'Pojedynczy mecz', singleDesc: 'Z CPU albo we dwoje',
      },
      sel: {
        title: { '2p': 'Wybierz ninja', cpu: 'Wybierz ninja', arcade: 'Arcade · Wybierz ninja', train: 'Trening · Wybierz ninja', tutorial: 'Samouczek · Wybierz ninja', tourney: 'Turniej miesiąca · Wybierz ninja', dan: 'Egzamin Dan · Wybierz ninja' },
        who1: { '2p': 'Gracz 1 · A / D wybór, F zatwierdza', def: 'Ty · A / D wybór, F zatwierdza' },
        who2: { '2p': 'Gracz 2 · ← / → wybór, K zatwierdza', cpu: 'Rywal (CPU) · ← / → wybór', train: 'Manekin · ← / → wybór' },
        go: { def: 'Do walki', arcade: 'Start Arcade', train: 'Start treningu', tutorial: 'Start samouczka', tourney: 'Start turnieju', dan: 'Start egzaminu' },
        random: 'Losowo',
        arena: 'Arena',
        locked: 'Zablokowane',
        lockMsg: (name, hint) => `${name}: zablokowane · ${hint}`,
        keyHint: '<kbd>Enter</kbd> start · <kbd>⌫</kbd> wstecz',
      },
      hint: {
        wins: (n, cur) => `Wygraj w Arcade ${n} ${pl(n, 'walkę', 'walki', 'walk')} (${Math.min(cur, n)}/${n})`,
        clear: 'Przejdź raz Arcade',
        boss: 'Pokonaj ostatniego bossa w Arcade',
        arena: 'Wygraj walkę na tej arenie w Arcade',
      },
      toast: {
        newChar: (name) => `Nowa postać odblokowana: ${name}`,
        newArena: (name) => `Nowa arena odblokowana: ${name}`,
        newBest: (s) => `Nowy rekord: ${num(s)} pkt`,
        lesson: (t) => `Lekcja ukończona: ${t}`,
        tutDone: 'Samouczek ukończony!',
        perf: 'Obniżono grafikę dla płynności',
      },
      vs: {
        stage: (i, n) => `Walka ${i} / ${n}`,
        boss: 'Ostatnia walka',
        go: 'Walcz!',
        quit: 'Wyjdź z Arcade',
        keys: '<kbd>Enter</kbd> / <kbd>F</kbd> start · <kbd>⌫</kbd> wyjście',
        unknown: '?',
      },
      hud: { you: 'TY', cpu: 'CPU', dummy: 'MANEKIN', stage: (i, n) => `${i}/${n}`, boss: 'OSTATNI BOSS', inf: '∞', lockSolo: 'Wciskaj F / K!', lockDuo: 'Wciskaj lekki lub ciężki!' },
      end: {
        rematch: 'Rewanż', change: 'Zmień postać', menu: 'Menu główne',
        winTitle: 'Zwycięstwo jest twoje',
        winSub: (i, n, pts) => `Walka ${i}/${n} zaliczona · +${num(pts)} pkt`,
        next: 'Następna walka',
        bossNext: 'Do finału',
        lossTitle: 'Porażka',
        lossSub: (name) => `Tym razem górą: ${name}. Spróbuj jeszcze raz.`,
        retry: 'Jeszcze raz',
        quit: 'Wyjdź z Arcade',
      },
      ending: {
        head: 'Zakończenie',
        rows: { fights: 'Walki', time: 'Łączny czas', retries: 'Powtórki', perfect: 'Rundy perfekcyjne', score: 'Wynik', best: 'Rekord' },
        newBest: 'Nowy rekord!',
        menu: 'Menu główne',
        again: 'Zagraj znowu',
        unlocked: 'Odblokowano',
        fightPts: 'Punkty za walki',
        bonus: 'Premia za ukończenie',
      },
      score: {
        hud: 'WYNIK',
        rows: { hit: 'Trafienia', combo: 'Kombo', counter: 'Kontry', defense: 'Obrona', pressure: 'Presja', special: 'Technika ki', round: 'Zwycięstwo', perfect: 'Perfekcja', hp: 'Pozostałe HP', time: 'Premia za czas' },
        total: 'Wynik meczu',
        diff: (name, m) => `w tym ${name} ×${dec(m)}`,
        best: (s) => `Twój rekord: ${num(s)}`,
        newBest: 'Nowy rekord!',
        arcadeTotal: (s) => `Suma Arcade: ${num(s)}`,
        lossNote: (s, pen) => `Ta próba się nie liczy · suma Arcade ${num(s)} · każda powtórka −${num(pen)}`,
        clearBonus: (c, n) => `+${num(c)}${n ? ' · bez powtórek +' + num(n) : ''}`,
        lossCpu: 'Porażka · do rankingu trafiają tylko wygrane',
        cpuBoardHint: 'Wygrane na poziomie Legenda trafiają do rankingu',
      },
      lb: {
        menu: 'Ranking',
        menuDesc: 'Rekordy Arcade i Legendy',
        title: 'Ranking',
        back: 'Wstecz',
        boards: { arcade: 'Arcade', cpu_efsane: 'CPU Legenda' },
        boardDesc: { arcade: 'Łączny wynik ukończonego przejścia Arcade', cpu_efsane: 'Wynik jednego meczu wygranego z CPU Legenda' },
        all: 'Wszystkie',
        status: { loading: 'Ładowanie…', online: 'Ranking online', readonly: 'Ranking online · tylko podgląd', local: 'Ranking lokalny', error: 'Błąd · ranking lokalny', offline: 'Offline · ranking lokalny' },
        empty: 'Brak wyników. Zajmij pierwsze miejsce!',
        loadErr: 'Nie udało się wczytać rankingu.',
        you: 'Ty', youTag: 'ty', player: 'Gracz',
        nick: 'Pseudonim', nickPh: 'Twój pseudonim', nickSave: 'Zapisz', nickEdit: 'Zmień',
        nickAsk: 'Pseudonim do rankingu lokalnego:',
        saving: 'Zapisywanie…',
        savedOnline: (r) => `Miejsce online: #${r}`,
        savedOnlineNoRank: 'Zapisano w rankingu online',
        savedOnlineAll: (r) => `Miejsce online (wszech czasów): #${r}`,
        platSignIn: 'Zaloguj się, by wysyłać wyniki online',
        platPending: 'Zapisano na tym urządzeniu · zaloguj się, by wysłać wynik do rankingu online',
        savedOnlineGap: (r, g) => `Miejsce online: #${r} · ${g} pkt do top 10`,
        reason: {
          needName: 'Wybierz pseudonim, by trafić do rankingu online',
          offline: 'Brak połączenia — wynik zachowany, wyślemy go po powrocie do sieci',
          rate: 'Za dużo zgłoszeń — wynik zostanie wysłany za chwilę',
          daily: 'Dzienny limit zgłoszeń wyczerpany — wynik zapisany tylko lokalnie',
          week: 'Miesiąc się skończył — ten wynik nie liczy się do nowego miesiąca',
          invalid: 'Nieprawidłowy wynik',
        },
        nickErr: {
          nick_length: 'Pseudonim musi mieć 3–16 znaków',
          nick_chars: 'Tylko litery, cyfry, spacje i _ . - (co najmniej jedna litera)',
          nick_bad: 'Ten pseudonim jest niedozwolony, wybierz inny',
          rate_limited: 'Poczekaj chwilę i spróbuj ponownie',
        },
        nickErrDef: 'Nie udało się zapisać pseudonimu',
        nickAskOnline: 'Pseudonim do rankingu online:',
        savedLocal: (r) => (r ? `#${r} w rankingu lokalnym` : 'Zapisano w rankingu lokalnym'),
        rejected: 'Nie udało się zapisać wyniku — tylko ranking lokalny',
        quota: 'Ranking online jest pełny — wynik zapisany tylko lokalnie',
        open: 'Ranking',
        keys: '<kbd>←</kbd> <kbd>→</kbd> tabela · <kbd>↑</kbd> <kbd>↓</kbd> ninja · <kbd>⌫</kbd> wstecz',
      },
      bz: {
        back: 'Wstecz', toMenu: 'Menu główne', you: 'Ty', youTag: 'ty', newBest: 'Nowy rekord!', seeResult: 'Zobacz wynik',
        resetIn: 'Reset za',

        left: (ms) => { const t = Math.floor(ms / 1000), d = Math.floor(t / 86400), hh = Math.floor((t % 86400) / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60; return d ? `${d} d ${hh} h ${mm} min` : hh ? `${hh} h ${mm} min` : `${mm} min ${ss} s`; },
        leftShort: (ms) => { const t = Math.floor(ms / 60000), d = Math.floor(t / 1440), hh = Math.floor((t % 1440) / 60), mm = t % 60; return d ? `${d} d ${hh} h` : hh ? `${hh} h ${mm} min` : `${mm} min`; },
        weekName: (m, y) => `${['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'][m - 1] || m} ${y}`,
        monthName: (m) => ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'][m - 1] || String(m),
        rank: (r) => (r <= 0 ? 'Bez stopnia' : r <= 10 ? `Kyu ${11 - r}` : `Dan ${r - 10}`),
        fightOf: (i, n) => `Walka ${i}/${n}`,
        hpBonus: (p) => `HP rywala +${p}%`,
        mirrorOpp: 'Lustro · twój własny ninja',
        suddenSub: 'Jedna runda · kto padnie, przegrywa',
        rows: { fights: 'Wygrane', time: 'Czas', fightPts: 'Punkty za walki', stage: 'Premia za etap', clear: 'Premia za ukończenie', total: 'Wynik turnieju', weekBest: 'Twój rekord miesiąca' },
        mods: {
          rally2x: { n: 'Gorąca wymiana', d: 'Obrażenia z kontr ×2' },
          fullKi: { n: 'Pełne ki', d: 'Każda runda zaczyna się z pełnym ki' },
          sudden: { n: 'Nagła śmierć', d: 'Jedna runda; obie strony zaczynają z połową HP' },
          mirror: { n: 'Lustro', d: 'Rywalem jest twój własny ninja' },
          parryOnly: { n: 'Tylko kontry', d: 'Zwykłe trafienia zadają 25% obrażeń; kontry ×1,5' },
          posture2x: { n: 'Chwiejna postawa', d: 'Obrażenia postawy ×2: bloki szybko pękają' },
          shuriken3x: { n: 'Burza shurikenów', d: 'Potrójne shurikeny' },
          kiRush: { n: 'Powódź ki', d: 'Ki ładuje się dwa razy szybciej' },
          glass: { n: 'Szklane ostrze', d: 'Wszystkie obrażenia ×1,5' },
        },
        menu: {
          tour: 'Turniej miesiąca', dan: 'Egzamin Dan', hall: 'Sala Chwały',
          tourRank: (p, left) => `Ten miesiąc: #${p} · reset za ${left}`,
          tourBest: (b, left) => `Twój rekord ${b} · reset za ${left}`,
          tourNew: (left) => `Te same 8 walk dla wszystkich · reset za ${left}`,
          danRank: (name, next) => (next ? `Twój stopień: ${name} · następny: ${next}` : `Twój stopień: ${name} · jesteś na szczycie`),
          danNew: '20 egzaminów od Kyu 10 do Dan 10',
          hallRank: (p) => `Ten miesiąc: #${p} · rekordy`,
          hallDesc: 'Top 10 miesiąca i rekordy wszech czasów',
          nick: (n) => (n ? `Pseudonim: ${n}` : 'Wybierz pseudonim'),
          champTitle: 'Top 10 tego miesiąca', champLocal: 'Top 10 na tym urządzeniu', champEmpty: 'Zajmij pierwsze miejsce w tym miesiącu', champLoading: 'Wczytywanie liderów…',
          champAll: 'Top 10 wszech czasów', champAllEmpty: 'Zajmij pierwsze miejsce w rankingu online',
          champLast: (n) => `Czempion zeszłego miesiąca: ${n}`, champOpen: 'otwórz ranking miesiąca',
        },
        t: {
          title: 'Turniej miesiąca', head: 'Turniej',
          runNote: (s, st) => `Suma turnieju: ${num(s)} (w tym +${num(st)} za wygraną)`,
          lossSub: (name, won) => `${name} kończy twój bieg · wygrane: ${won}`,
          lossNote: (s) => `Ta walka się nie liczy · wynik turnieju ${num(s)}`,
          quit: 'Zakończ turniej',
          myBest: (b, a) => `Twój rekord miesiąca: ${b} pkt · prób: ${a}`,
          noTry: 'Brak prób w tym miesiącu.',
          place: (p, t) => (t ? `#${p} / ${t}` : `#${p}`),
          rules: (n, clear, stage) => `${n} ${pl(n, 'walka', 'walki', 'walk')}; ci sami rywale, areny i zasady dla wszystkich. Jedna porażka kończy próbę; prób jest bez limitu, a liczy się najlepsza. Każda wygrana +${stage}, pokonanie wszystkich +${clear}.`,
          start: 'Wybierz ninja i zaczynaj', again: 'Jeszcze raz', go: 'Wejdź do turnieju',
          clearTitle: 'Turniej zdobyty', overTitle: 'Koniec próby',
          savedToast: (s) => `Zapisano wynik turnieju: ${s}`,
        },
        d: {
          title: 'Egzamin Dan', head: 'Egzamin Dan',
          sub: 'Zdawaj kolejne egzaminy, by awansować. Twój stopień widać obok pseudonimu w rankingach.',
          trialOf: (n) => `Egzamin na ${n}`,
          runNote: (i, n) => `Egzamin: wygrane walki ${i}/${n}`,
          lossSub: (name) => `${name} przerywa twój egzamin.`,
          lossNote: 'Egzamin niezdany',
          quit: 'Opuść egzamin',
          yourRank: 'Twój stopień', bestWas: (n) => `Najwyższy: ${n}`, ladder: 'Drabina stopni',
          nextTrial: (n) => `Dalej: egzamin na ${n}`,
          fights: (n) => `${n} ${pl(n, 'walka', 'walki', 'walk')}`,
          bossLast: 'Ostatnia walka: Shura',
          strikes: (left, max) => `Szanse: ${left}/${max} · ${max} ${pl(max, 'niezdany egzamin obniża', 'niezdane egzaminy obniżają', 'niezdanych egzaminów obniża')} stopień o jeden szczebel`,
          safe: 'Na tym stopniu niezdany egzamin nie obniży ci stopnia.',
          maxed: 'Na szczycie: Dan 10', maxedSub: 'Twój pseudonim prowadzi w tabeli Dan.',
          start: 'Wybierz ninja i podejdź do egzaminu', next: 'Następny egzamin', go: 'Do egzaminu',
          promoted: (n) => `Awans: ${n}`, demoted: (n) => `Spadek: ${n}`, failed: 'Egzamin niezdany',
          promotedSub: (a, b) => `${a} → ${b}`, demotedSub: 'Trzy niezdane egzaminy. Wróć na górę!', tryAgain: 'Spróbuj jeszcze raz; stopień jest bezpieczny.',
          toast: (n) => `Nowy stopień: ${n}`, leftToast: 'Egzamin przerwany: liczy się jako niezdany',
        },
        hall: {
          title: 'Sala Chwały',
          tabs: { week: { n: 'Ten miesiąc' }, alltime: { n: 'Wszech czasów' }, archive: { n: 'Czempioni' }, chars: { n: 'Ninja' }, dan: { n: 'Dan' } },
          desc: { alltime: 'Najlepsi w historii Turnieju miesiąca', archive: 'Top 10 każdego zakończonego miesiąca zostaje tu na zawsze', chars: 'Rekordzista każdego ninja · dotknij ninja, by zobaczyć top 20', dan: 'Najwyższe stopnie' },
          loading: 'Ładowanie…', error: 'Nie udało się wczytać rankingu.', retry: 'Spróbuj ponownie',
          empty: 'Nikogo tu jeszcze nie ma. Zajmij pierwsze miejsce!', emptyDan: 'Nikt nie ma jeszcze stopnia.', emptyArchive: 'Brak zakończonych miesięcy. Tytuły przyznajemy od turnieju z października 2026; jego czempioni trafią tu po jego końcu, 1 listopada.', emptyArchiveLocal: 'Na tym urządzeniu nie ma jeszcze zakończonych miesięcy.',
          anon: 'Gracz',
          meTop: (p, s) => `Ty: #${p} · ${s} pkt · jesteś w top 10!`,
          meGap: (p, g, s) => `Ty: #${p} · ${s} pkt · ${g} pkt do top 10`,
          meNone: 'Brak wyniku w tym miesiącu.',
          meDan: (p, n) => `Ty: #${p} · ${n}`,
          meDanLocal: (n) => `Twój stopień: ${n}`, meNoDan: 'Brak stopnia. Pierwszy egzamin: Kyu 10.',
          noRecord: 'Brak rekordu', allNinjas: 'Wszyscy ninja',
          pending: (n) => `Wpisy czekające na wysłanie: ${n}`,
          classic: 'Arcade · Legenda',
        },

        ttl: {
          champ: 'Czempion miesiąca', finalist: 'Finalista',
          reward: 'Od turnieju z października 2026 najlepsza trójka każdego miesiąca zdobywa stały tytuł. Czempion dostaje też wyjątkowe barwy czempiona dla ninja, którym walczy. Tytuły wymagają co najmniej 5 graczy w danym miesiącu.',
          hall: 'Od października 2026: top 3 miesiąca zdobywa stały tytuł (min. 5 graczy) · czempion zdobywa barwy czempiona',
          local: 'Twoje wyniki turniejowe są zapisane na tym urządzeniu.',
          colors: 'Barwy czempiona',
          how: 'Wygraj Turniej miesiąca tym ninja',
          unlocked: (name) => `Czempion miesiąca! Odblokowano barwy czempiona: ${name}`,
          newTitle: (t) => `Nowy tytuł: ${t}`,
        },
      },
      train: {
        title: 'Trening', tutTitle: 'Samouczek',
        dummy: 'Manekin',
        beh: { idle: 'Bezczynny', guard: 'Blok', attack: 'Atak', counter: 'Kontra' },
        infHp: 'Nieskończone HP', fullKi: 'Pełne ki',
        reset: 'Reset pozycji',
        hide: 'Ukryj', show: 'Panel',
        moves: 'Lista ruchów',
        lessons: 'Lekcje',
        lessonOf: (i, n) => `Lekcja ${i}/${n}`,
        done: 'Samouczek ukończony! Ustaw manekina, jak chcesz, i ćwicz swobodnie.',
        progress: (a, b) => `${a}/${b}`,
        keysHelp: '<kbd>1</kbd>–<kbd>4</kbd> manekin · <kbd>⌫</kbd> reset · <kbd>H</kbd> panel',
        specialFallback: { kanji: '影斬り', name: 'Cięcie Cienia', desc: 'Błyskawiczne cięcie, które gładko przechodzi przez rywala.', tip: '' },
        kiFull: 'pełne ki',
        counterTip: 'Jak na to odpowiedzieć',
      },
      moves: [
        ['<kbd>A</kbd><kbd>D</kbd>', 'Chód', 'dwa razy szybko: zryw'],
        ['<kbd>W</kbd>', 'Skok', ''],
        ['<kbd>F</kbd><kbd>F</kbd><kbd>F</kbd>', 'Lekkie kombo ×3', 'trzecie trafienie odpycha'],
        ['<kbd>G</kbd>', 'Ciężkie cięcie', 'powala'],
        ['<kbd>R</kbd>', 'Kopnięcie', 'napiera na blok, zapełnia postawę'],
        ['<kbd>S</kbd>+<kbd>R</kbd>', 'Podcięcie', 'przewraca · przeskocz je'],
        ['Tył+<kbd>R</kbd>', 'Kopnięcie z obrotu', 'wolne, mocne, łamie gardę'],
        ['Przód+<kbd>R</kbd>', 'Kopnięcie w dłoń', 'w zamach: rozbraja'],
        ['<kbd>W</kbd>›<kbd>R</kbd>', 'Kopnięcie w locie', 'w powietrzu'],
        ['←→+<kbd>R</kbd>', 'Własne kopnięcie', 'każdy ninja ma swoje'],
        ['<kbd>R</kbd>', 'Podrzucenie miecza', 'bez broni, przy swoim mieczu'],
        ['<kbd>T</kbd>', 'Shuriken', ''],
        ['<kbd>Shift</kbd>', 'Zryw', 'lewy Shift'],
        ['<kbd>Shift</kbd>›<kbd>F</kbd>', 'Cięcie w zrywie', ''],
        ['<kbd>W</kbd>›<kbd>F</kbd>', 'Cięcie w powietrzu', ''],
        ['<kbd>W</kbd>›<kbd>G</kbd>', 'Nurkowanie', 'ciężki w powietrzu'],
        ['<kbd>S</kbd>', 'Blok', 'przytrzymaj'],
        ['<kbd>S</kbd>!', 'Parowanie', 'wciśnij tuż przed trafieniem'],
        ['<kbd>F</kbd>', 'Prosta kontra', 'po bloku/parowaniu'],
        ['Przód+<kbd>F</kbd>', 'Podcięcie', 'kontra · w nogi'],
        ['Tył+<kbd>F</kbd>', 'Obejście', 'kontra · prześlizgnij się obok'],
        ['<kbd>G</kbd>', 'Ciężka kontra', 'kontra · powala'],
        ['Wymiana', 'Wymiana', 'zablokuj kontrę, skontruj znowu; twoja 3. kontra to wykończenie'],
        ['<kbd>F</kbd>/<kbd>G</kbd>!!', 'Zwarcie ostrzy', 'wciskaj w zwarciu, by odepchnąć rywala'],
      ],
      touch: {
        btn: { light: 'ATAK', heavy: 'CIĘŻKI', kick: 'KOPNIJ', guard: 'BLOK', dodge: 'ZRYW', throw: 'SHUR.', special: 'KI', up: 'SKOK', down: 'BLOK', stick: 'Joystick' },
        lock: 'Wciskaj ATAK!',
        replaySkip: 'dotknij, by pominąć',
        rotateTitle: 'Obróć ekran poziomo',
        rotateText: 'W Shadow Duel gra się poziomo. Z menu możesz korzystać także w pionie.',
        rotMenu: 'Menu główne',
        need2p: 'Wymaga klawiatury / pada',
        need2pToast: 'Podłącz klawiaturę lub pad, by grać we dwoje',
        hints: 'Podpowiedzi',
        pause: 'Pauza',
        sel: { who1: 'Ty · dotknij swojego ninja', who2: 'Rywal (CPU) · dotknij, by wybrać', who2train: 'Manekin · dotknij, by wybrać' },
        opt: {
          title: 'Sterowanie dotykowe',
          layout: 'Układ', simple: 'Prosty', full: 'Pełny',
          size: 'Rozmiar', sizes: { s: 'Mały', m: 'Średni', l: 'Duży' },
          hand: 'Przyciski', right: 'Po prawej', left: 'Po lewej',
          assist: 'Łatwe sterowanie', haptic: 'Wibracje',
          fullscreen: 'Pełny ekran', exitFullscreen: 'Wyjdź z pełnego ekranu',
          note: 'Prosty: 5 dużych przycisków. Pełny: dochodzą kopnięcie i shuriken. Łatwe sterowanie: przytrzymaj ATAK, a kombo trwa dalej; szybkie dotknięcie BLOK trwa dość długo, by sparować, a gałka nie podskoczy przypadkiem. To tylko ułatwia dotyk; zasady i wyniki są takie same dla wszystkich.',
          fullNote: 'Przyciski KOPNIJ i SHURIKEN są w układzie Pełnym (Ustawienia → Sterowanie).',
        },
        help: '<div class="th-grid">' +
          '<div><h3>Joystick</h3><dl>' +
          '<dt><i class="tb">◀ ▶</i></dt><dd>Połóż kciuk na wolnej połowie i przesuwaj: chód</dd>' +
          '<dt><i class="tb">▲</i></dt><dd>Pchnij w górę: skok</dd>' +
          '<dt><i class="tb tb-guard">▼</i></dt><dd>Pociągnij w dół: blok</dd>' +
          '<dt><i class="tb">▶▶</i></dt><dd>Dwa szybkie ruchy w bok: zryw</dd>' +
          '</dl></div>' +
          '<div><h3>Przyciski</h3><dl>' +
          '<dt><i class="tb tb-light">ATAK</i></dt><dd>Cięcie. Stukaj raz za razem: kombo. Trzymaj przód lub tył podczas stukania: inne techniki</dd>' +
          '<dt><i class="tb">CIĘŻKI</i></dt><dd>Ciężkie cięcie. Przód + CIĘŻKI podrzuca rywala</dd>' +
          '<dt><i class="tb tb-guard">BLOK</i></dt><dd>Przytrzymaj: blok. Dotknij tuż przed ciosem: parowanie</dd>' +
          '<dt><i class="tb">ZRYW</i></dt><dd>Zryw (w stronę, w którą wskazuje gałka, inaczej do tyłu)</dd>' +
          '<dt><i class="tb ki">KI</i></dt><dd>Technika ki: przycisk świeci, gdy ki jest pełne</dd>' +
          '<dt><i class="tb">KOPNIJ</i> <i class="tb">SHUR.</i></dt><dd>Układ Pełny: kopnięcie i shuriken</dd>' +
          '</dl></div></div>',
        note: 'Możesz wciskać kilka przycisków naraz: trzymaj blok i atakuj albo przesuń kciuk z <i class="tb tb-guard">BLOK</i> na <i class="tb tb-light">ATAK</i>. <b>II</b> u góry ekranu to pauza; układ, rozmiar i opcje dla leworęcznych są w <b>Ustawieniach</b>. Gdy użyjesz klawiatury lub pada, sterowanie przełączy się samo.',
        keysHelp: '',
      },
      movesTouch: [
        ['<i class="tb">◀ ▶</i>', 'Chód', 'gałka · dwa szybkie ruchy: zryw'],
        ['<i class="tb">▲</i>', 'Skok', 'pchnij gałkę w górę'],
        ['<i class="tb tb-light">ATAK</i>×3', 'Potrójne kombo', 'stukaj raz za razem; trzecie trafienie odpycha'],
        ['<i class="tb">CIĘŻKI</i>', 'Ciężkie cięcie', 'powala'],
        ['<i class="tb">KOPNIJ</i>', 'Kopnięcie', 'napiera na blok, zapełnia postawę · układ Pełny'],
        ['<i class="tb tb-guard">▼</i>' + '+' + '<i class="tb">KOPNIJ</i>', 'Podcięcie', 'przewraca · przeskocz je'],
        ['Tył+' + '<i class="tb">KOPNIJ</i>', 'Kopnięcie z obrotu', 'wolne, mocne, łamie gardę'],
        ['Przód+' + '<i class="tb">KOPNIJ</i>', 'Kopnięcie w dłoń', 'w zamach: rozbraja'],
        ['<i class="tb">▲</i>' + '›' + '<i class="tb">KOPNIJ</i>', 'Kopnięcie w locie', 'w powietrzu'],
        ['←→+' + '<i class="tb">KOPNIJ</i>', 'Własne kopnięcie', 'każdy ninja ma swoje'],
        ['<i class="tb">KOPNIJ</i>', 'Podrzucenie miecza', 'bez broni, przy swoim mieczu'],
        ['<i class="tb">SHUR.</i>', 'Shuriken', 'układ Pełny'],
        ['<i class="tb">ZRYW</i>', 'Zryw', ''],
        ['<i class="tb">ZRYW</i>›<i class="tb tb-light">ATAK</i>', 'Cięcie w zrywie', ''],
        ['<i class="tb">▲</i>›<i class="tb tb-light">ATAK</i>', 'Cięcie w powietrzu', ''],
        ['<i class="tb">▲</i>›<i class="tb">CIĘŻKI</i>', 'Nurkowanie', 'ciężki w powietrzu'],
        ['<i class="tb tb-guard">BLOK</i>', 'Blok', 'przytrzymaj lub pociągnij gałkę w dół'],
        ['<i class="tb tb-guard">BLOK</i>!', 'Parowanie', 'dotknij tuż przed trafieniem'],
        ['<i class="tb tb-light">ATAK</i>', 'Prosta kontra', 'po bloku/parowaniu'],
        ['Przód+<i class="tb tb-light">ATAK</i>', 'Podcięcie', 'kontra · w nogi'],
        ['Tył+<i class="tb tb-light">ATAK</i>', 'Obejście', 'kontra · prześlizgnij się obok'],
        ['<i class="tb">CIĘŻKI</i>', 'Ciężka kontra', 'kontra · powala'],
        ['Wymiana', 'Wymiana', 'zablokuj kontrę, skontruj znowu; twoja 3. kontra to wykończenie'],
        ['<i class="tb tb-light">ATAK</i>!!', 'Zwarcie ostrzy', 'wciskaj ATAK w zwarciu, by odepchnąć rywala'],
      ],
      moveSpecialTouch: '<i class="tb ki">KI</i>',
      moveTags: {
        normal: 'Zwykły', command: 'Komenda', string: 'Seria', launcher: 'Podrzut', juggle: 'Żonglerka', air: 'Powietrze', dash: 'Zryw',
        strike: 'Cios', counter: 'Kontra', catch: 'Chwyt', feint: 'Zwód', guardCrush: 'Łamie blok', knockdown: 'Powalenie',
        kiCancel: 'Anulowanie ki', special: 'Technika ki', throw: 'Pocisk',
      },
      lessonsTouch: {
        walk: 'Przesuwaj kciuk po wolnej połowie ekranu: pchaj gałkę w lewo i w prawo, by chodzić.',
        combo: 'Stuknij <i class="tb tb-light">ATAK</i> trzy razy z rzędu: połącz trzy cięcia i traf manekina.',
        heavy: 'Wyprowadź ciężkie cięcie przyciskiem <i class="tb">CIĘŻKI</i>. Jest wolne, ale powala.',
        gbreak: 'Manekin blokuje. Bij go przyciskiem <i class="tb">CIĘŻKI</i>, by zapełnić jego pasek postawy i przebić blok (<i class="tb">KOPNIJ</i> w układzie Pełnym zapełnia go jeszcze szybciej).',
        block: 'Manekin atakuje. Przytrzymaj <i class="tb tb-guard">BLOK</i> (albo pociągnij gałkę w dół) i zablokuj cięcie.',
        parry: 'Dotknij <i class="tb tb-guard">BLOK</i> tuż przed trafieniem. Idealny moment to chwila, gdy niebieski pierścień się kurczy.',
        counter: 'Zaraz po bloku lub parowaniu <i class="tb tb-light">ATAK</i>: kontrcięcie. Wypróbuj też gałkę w przód/tył + <i class="tb tb-light">ATAK</i> albo <i class="tb">CIĘŻKI</i>.',
        special: 'Twój pasek ki jest pełny. Użyj techniki {sp} świecącym przyciskiem <i class="tb ki">KI</i>.',
      },
      lessons: [
        { id: 'walk', t: 'Chód', d: 'Chodź w przód i w tył klawiszami <kbd>A</kbd> / <kbd>D</kbd>.' },
        { id: 'combo', t: 'Potrójne kombo', d: 'Połącz trzy lekkie cięcia klawiszami <kbd>F</kbd> <kbd>F</kbd> <kbd>F</kbd> i traf manekina.' },
        { id: 'heavy', t: 'Ciężkie cięcie', d: 'Wyprowadź ciężkie cięcie klawiszem <kbd>G</kbd>. Jest wolne, ale powala.' },
        { id: 'gbreak', t: 'Przebij blok', d: 'Manekin blokuje. Kopnij klawiszem <kbd>R</kbd>, by zapełnić jego pasek postawy i przebić blok.' },
        { id: 'block', t: 'Blok', d: 'Manekin atakuje. Przytrzymaj <kbd>S</kbd>, by zablokować cięcie.' },
        { id: 'parry', t: 'Parowanie', d: 'Wciśnij <kbd>S</kbd> tuż przed trafieniem. Idealny moment to chwila, gdy niebieski pierścień się kurczy.' },
        { id: 'counter', t: 'Kontra', d: 'Zaraz po bloku lub parowaniu <kbd>F</kbd>: kontrcięcie. Wypróbuj też przód/tył + <kbd>F</kbd> albo <kbd>G</kbd>.' },
        { id: 'rally', t: 'Wymiana', d: 'Manekin też kontruje. Zaatakuj go, zablokuj jego kontrę i skontruj znowu: dojdź do 2× dwiema własnymi odpowiedziami.' },
        { id: 'special', t: 'Technika ki', d: 'Twój pasek ki jest pełny. Użyj techniki {sp} klawiszem <kbd>E</kbd>.' },
      ],
    });




    merge(EN.STR, {

      talk: {
        akane: {
          open: ['Moje ostrze jest szkarłatne, a intencje czyste. Stań do walki z honorem.', 'Najpierw się kłaniam, potem uderzam. Tak jest uczciwie.', 'Ten pojedynek toczy się o nasz honor. Nie ma odwrotu.'],
          reply: ['Honorowy przeciwnik… Zasługujesz na moje ostrze.', 'Ostre słowa. Zobaczmy, czy twoja stal jest równie ostra.', 'Gdy przemawia szkarłatne ostrze, słowa milkną.'],
          boss: 'Moi mistrzowie zginęli od twojego ostrza, Shura. Dziś spłacę ten dług.',
        },
        aoi: {
          open: ['Wiatr nigdy się nie spieszy. Ja też nie.', 'Wsłuchaj się w swój oddech. Ostatnim dźwiękiem, jaki usłyszysz, będzie wiatr.', 'Bambus się ugina, ale nigdy nie łamie. A ty?'],
          reply: ['Uspokój się. Gniew czyni ostrze ciężkim.', 'Wiatru nie złapiesz. Możesz go tylko poczuć.', 'Dobrze. Zaczniemy, gdy liść dotknie ziemi.'],
          boss: 'Nawet oko cyklonu jest ciche. W tobie jest tylko hałas, Shura.',
        },
        kuro: {
          open: ['Góra się nie rusza. Ty owszem.', 'Bez gadania. Unieś miecz.', 'Taki maluch. Szybko pójdzie.'],
          reply: ['Hmf. No to chodź.', 'Za dużo gadasz.', 'Mój nodachi jest długi. Moja cierpliwość krótka.'],
          boss: 'Shura. Długo czekałem. Dość słów.',
        },
        yuki: {
          open: ['Śnieg pada w ciszy. Moje ciosy też.', 'Lis nie wpada w pułapki. Lis je zastawia.', 'Zimno? Zaraz nic nie poczujesz.'],
          reply: ['Masz gorącą krew. To cię spowalnia.', 'Ale hałas… Nawet śniegowi jest za ciebie wstyd.', 'Nie mrugaj. Przegapisz to.'],
          boss: 'Wszyscy się ciebie boją, Shura. Mnie jest tylko trochę chłodno.',
        },
        hana: {
          open: ['Zatańczymy? Ale ja prowadzę!', 'Skończymy, zanim opadną płatki wiśni, obiecuję!', 'Dwa tantō, jeden uśmiech. Co cię bardziej przeraża?'],
          reply: ['Oj, jaka powaga! Uśmiechnij się, ładniej upadniesz.', 'Złap mnie, jeśli potrafisz!', 'Dobra, dobra! Tylko potem bez płaczu.'],
          boss: 'Ty się nigdy nie śmiejesz, Shura? No chodź, niech to będzie nasz ostatni taniec!',
        },
        tetsu: {
          open: ['Przywiodła mnie tu powinność. Odsuń się albo padnij.', 'Moja zbroja widziała sto bitew. Ty będziesz sto pierwszą.', 'Dyscyplina idzie przed odwagą. Pozwól, że ci pokażę.'],
          reply: ['Brak szacunku. Naprawię to.', 'Twoje słowa nie przebiją mojej zbroi.', 'Uważaj. Moja naginata nie ostrzega.'],
          boss: 'Spaliłeś zamek mojego pana, Shura. Dziś wypełnię swoją powinność.',
        },
        ren: {
          open: ['Ha! Wreszcie jakaś zabawa! Masz mocne kości?', 'Maska cię przestraszyła? Mojej prawdziwej twarzy lepiej nie oglądać!', 'Głowy czy bloki? Łamię jedno i drugie!'],
          reply: ['Same gadanie, zero walki! Dawaj!', 'Heh, lubię cię. I tak spuszczę ci lanie.', 'Znasz moje kopnięcie? Zaraz poznasz!'],
          boss: 'Więc to ty jesteś prawdziwym oni, co? Zobaczmy, czyje rogi twardsze!',
        },
        kage: {
          open: ['Myślisz, że mnie widzisz. Widzisz tylko mój cień.', 'Im jaśniejsze światło, tym głębszy cień.', 'Twoje imię zostało już zapisane. Ja je tylko odczytuję.'],
          reply: ['Nic nie mów. Cienie słuchają.', 'Nie oglądaj się. Już tam jestem.', 'Za dużo w tobie hałasu. Cisza uderza szybciej.'],
          boss: 'Cienie nie służą żadnemu panu, Shura. Ciebie też pochłoną.',
        },
        shura: {
          open: ['Siedem ostrzy pękło przed tobą. Ósme jest moje i to ono złamie ciebie.', 'Twój duch mnie wezwał. Dobrze, że jesteś aż tutaj; tym wspanialszy będzie twój upadek.', 'Jestem końcem drogi. Na kolana.'],
          reply: ['Słabość. Czuję ją stąd.', 'Jesteś tylko stopniem pod moimi stopami.', 'Klęknij albo padnij.'],
          boss: 'Demon w lustrze… Jeden z nas jest tu zbędny.',
        },
        tora: {
          open: ['Straciłem rachubę tych, co wisieli na moim łańcuchu. Będziesz kolejną ofiarą.', 'Polowanie trwa. Uciekaj, jeśli chcesz, ale mój łańcuch jest długi.', 'Mówią, że tygrys czai się w zasadzce. Nie ten!'],
          reply: ['Grrr… Dobrze. Lubię zdobycz, która nie ucieka.', 'Nie musisz podchodzić. Sam cię przyciągnę.', 'Twoje słowa są długie. Mój łańcuch dłuższy.'],
          boss: 'Ty też jesteś tylko zdobyczą, Shura. Trochę większą.',
        },
        jin: {
          open: ['Nie przyszedłem przelewać krwi. Tylko położę cię na chwilę.', 'Kij przemawia cierpliwością. Słuchaj.', 'Na twojej drodze pełno gniewu, młoda duszo. Ulżyjmy ci w tym ciężarze.'],
          reply: ['Dobrze. Ale potem napijemy się herbaty.', 'Gniew ci ciąży. Pozwól, że go poniosę.', 'Miecz tnie; kij budzi.'],
          boss: 'Shura, nie muszę cię niszczyć, by pokonać demona w tobie. Wystarczy cię zatrzymać.',
        },
        mai: {
          open: ['Scena gotowa, kurtyna w górze. Twoja rola: przegrać.', 'Gdy otworzę wachlarz, nie zamykaj oczu. Przegapisz przedstawienie.', 'Każdy mój krok to nuta. Utrzymasz tempo?'],
          reply: ['Co za prostackie wejście. Nieważne, mam dość gracji za nas oboje.', 'Wiatr wieje w moją stronę, kochanie.', 'Nie potrzebuję oklasków. Wystarczy mi twój upadek.'],
          boss: 'Shura, w tym ostatnim tańcu z nikim nie dzielę sceny.',
        },
        tsubame: {
          open: ['Dystans między nami to moja broń.', 'Jaskółka chybia raz. Za drugim razem zawraca i uderza.', 'Zmierzyłam wiatr. Moja strzała zna swoją drogę.'],
          reply: ['Chcesz podejść bliżej? Spróbuj.', 'Wstrzymaj oddech. Strzała w locie nie wydaje dźwięku.', 'Mam cię na oku. Moja strzała też.'],
          boss: 'Shura, w niebie nie ma kryjówki. Moja strzała cię znajdzie.',
        },
      },

      pairs: {
        'akane|aoi': [['akane', 'Aoi! Czas dokończyć nasz przerwany pojedynek.'], ['aoi', 'Wiatr zawsze wieje ku temu samemu ogniowi, Akane. Zaczynaj.']],
        'kuro|tetsu': [['kuro', 'Żelazna skorupa. Zobaczmy, czy pusta w środku.'], ['tetsu', 'Nawet góra kłania się dyscyplinie, Kuro.']],
        'hana|yuki': [['yuki', 'Kwiaty więdną w śniegu, Hana.'], ['hana', 'To po prostu stopię śnieg, Yuki!']],
        'kage|ren': [['ren', 'Sztuczki z cieniem na mnie nie działają! Pokaż się!'], ['kage', 'Jestem tutaj, oni. Po prostu nie umiesz patrzeć.']],
        'akane|ren': [['akane', 'Tylko ludzie bez honoru kryją się za maską.'], ['ren', 'Honor? Honorem się nie najem!']],
        'aoi|yuki': [['aoi', 'Zimny wiatr to wciąż wiatr, Yuki.'], ['yuki', 'Ale gdy wiatr ucichnie, śnieg zostaje.']],
        'kuro|tora': [['tora', 'Góra, co? Tygrysy też żyją w górach.'], ['kuro', 'Tygrysy w górach giną.']],
        'tora|yuki': [['tora', 'Lis! Co robi lis przed tygrysem?'], ['yuki', 'Ucieka. A potem zamraża tygrysowi ogon.']],
        'jin|tora': [['tora', 'Co zrobisz, mnichu, gdy mój łańcuch owinie się wokół twojego kija?'], ['jin', 'Rozwiążę go. Rozplątywanie węzłów to moje powołanie.']],
        'jin|ren': [['ren', 'Mnich? Zacznij się modlić, łysolu!'], ['jin', 'Już się modlę, oni. Za ciebie. Ogień w tobie pali także ciebie.']],
        'jin|tetsu': [['tetsu', 'Czego mnich szuka na polu bitwy?'], ['jin', 'Przyszedłem po opancerzone serca takie jak twoje, Tetsu. Twoja zbroja jest ciężka; twoje serce jeszcze cięższe.']],
        'akane|jin': [['akane', 'Odsuń się, mnichu. Ta zemsta należy do mnie.'], ['jin', 'Zemsta to łańcuch, Akane. Najpierw go zerwijmy.']],
        'hana|mai': [['hana', 'Oo, kolejna tancerka! Zobaczmy, która kręci się szybciej!'], ['mai', 'Szybkość to tylko cień gracji, Hana. Pokażę ci światło.']],
        'kage|mai': [['mai', 'Czy cienie też tańczą, Kage?'], ['kage', 'Tylko gdy gaśnie światło.']],
        'aoi|tsubame': [['tsubame', 'Czy twój wiatr zdoła odbić moją strzałę, Aoi?'], ['aoi', 'Wiatr nie staje po niczyjej stronie, Tsubame. Nawet po stronie twojej strzały.']],
        'kage|tsubame': [['kage', 'Nie trafisz tego, czego nie widzisz, łuczniczko.'], ['tsubame', 'Cienie przychodzą ze światłem. Ja też.']],
        'mai|tsubame': [['mai', 'Gapienie się z daleka jest niegrzeczne, łuczniczko. Podejdź i popatrz z bliska.'], ['tsubame', 'Wyślę strzałę, by z bliska obejrzała twoją scenę.']],
      },
      endings: {
        akane: ['Gdy miecz Shury uderzył o ziemię, świątynne dzwony zabiły same.', 'Akane otarła szkarłatne ostrze i pokłoniła się przy grobie mistrzów: dług został spłacony.', 'Przed nią już nie zemsta, lecz nauka honoru dla nowych uczniów.'],
        aoi: ['Gdy Shura padł, burza ucichła; po raz pierwszy od lat chmury się rozstąpiły.', 'Aoi schował ostrze do pochwy i wrócił do bambusowego lasu.', 'Pozostał tylko świszczący wiatr.'],
        kuro: ['Kuro pogrzebał pękniętą maskę Shury na szczycie góry.', 'Nie padło ani jedno słowo. Kuro nasunął słomiany kapelusz i zniknął w śniegu.', 'Wieśniacy mówią, że tamtej zimy z góry nie zszedł ani jeden bandyta.'],
        yuki: ['Ostatni oddech Shury zamienił się w mroźnym powietrzu w obłoczek pary i zniknął.', 'Yuki poprawiła szal i odeszła, nie zostawiając śladów na śniegu.', 'Od tego dnia na szczycie widuje się tylko cień lisa.'],
        hana: ['Gdy maska Shury upadła na ziemię, Hana położyła obok niej gałązkę wiśni.', 'Tej nocy targ rozbłysnął lampionami; najgłośniejsze wiwaty zebrała kunoichi tańcząca na dachach.', 'Nikt nie wie, dokąd odeszła Hana. Zostały tylko unoszące się na wietrze różowe płatki.'],
        tetsu: ['Na dachu zamku Tetsu złamał miecz Shury na kolanie.', 'Sztandar pana znów załopotał, dumnie niesiony przez wiatr.', 'Powinność wypełniona. Lecz powinność samuraja nigdy się nie kończy.'],
        ren: ['Ren powiesił pękniętą maskę Shury obok swojej maski oni. Dwóch oni, jeden zwycięzca.', 'Tej nocy wioska śpiewała; najgłośniej, jak zawsze, śmiał się Ren.', 'Rano Ren był już w drodze. Na kolejną bijatykę.'],
        kage: ['Gdy Shura padł, cień Kage cicho okrył pokonanego demona.', 'Ani śladu, ani dźwięku; tylko jeden cień więcej wydłużał się w blasku księżyca.', 'Może był tam zawsze. Może nigdy nie istniał.'],
        shura: ['Na dachu zamku na nogach został tylko jeden: ten, który nosił tę samą maskę, tylko ciemniejszą.', 'Shura nie szuka już rywali. To rywale szukają Shury.'],
        def: ['Ostatni mistrz upadł. Droga cieni należy teraz do ciebie.', 'Schowaj ostrze; legenda zaczyna się teraz.'],
        tora: ['Szczęk łańcucha obwieścił upadek Shury.', 'Tora zawiesił pękniętą maskę na łańcuchu: nowe myśliwskie trofeum.', 'Od tego dnia nikt w lesie nie brał ryku tygrysa za bajkę.'],
        jin: ['Jin ukląkł przy pokonanym Shurze i się pomodlił.', 'W drodze powrotnej do świątyni na kiju nie było ani kropli krwi.', 'Tej nocy górskie dzwony znów zabiły; tym razem nie w żałobie, lecz za pokój.'],
        mai: ['Gdy Shura padł, Mai z trzaskiem złożyła wachlarz i się ukłoniła.', 'Nocny targ wciąż wspomina tamten taniec.', 'Kurtyna opadła. Lecz Mai nigdy nie zeszła ze sceny.'],
        tsubame: ['Ostatnia strzała drżała bezgłośnie w dachu zamku.', 'Tsubame zarzuciła łuk na ramię i patrzyła, jak jaskółki lecą na południe.', 'Nikt jej więcej nie widział; zostały tylko strzały o jaskrawych lotkach, tkwiące w celach.'],
      },
      roster2: {
        notes: {
          tora: ['Lekki: ze średniego dystansu smaga łańcuchem, z bliska tnie sierpem', 'Ciężki: rzuca łańcuchem; po trafieniu przyciąga rywala', 'Zakończenie kombo: gdy rywal jest daleko, łańcuch go przyciąga'],
          jin: ['Kij uderza oboma końcami; ciosy są tępe i nigdy nie przelewają krwi', 'Trzecie trafienie i ciężkie podcięcie powalają', 'Podczas bloku postawa zapełnia się wolniej'],
          mai: ['Szersze okno parowania', 'Podczas bloku wachlarze odsyłają pociski', 'Ciężki: fala wiatru odpycha rywala i rozprasza pociski'],
          tsubame: ['Ciężki: strzela z łuku; przytrzymaj, by naładować strzał', 'Rzut: salto w tył i strzała z powietrza', 'Bez strzał ciężki atak używa tantō; strzały odnawiają się z czasem'],
        },
      },
    });

    merge(EN.CHARS, {
      akane: { title: 'Szkarłatne Ostrze', desc: 'Wszechstronna mistrzyni katany. Szybkie kombo z trzech ciosów, mocne parowanie.', weapon: 'Katana' },
      aoi: { title: 'Błękitny Wiatr', desc: 'Zwinny mistrz katany. Chodzi nieco szybciej, a jego zryw jest jak wiatr.', weapon: 'Katana' },
      kuro: { title: 'Czarna Góra', desc: 'Walczy długim nodachi. Powolny, ale z szerokim zasięgiem i niszczycielskimi ciosami.', weapon: 'Nodachi' },
      yuki: { title: 'Śnieżny Lis', desc: 'Bardzo szybko tnie krótkim kodachi. Mnóstwo shurikenów, długi szal.', weapon: 'Kodachi' },
      hana: { title: 'Taniec Wiśni', desc: 'Kunoichi. Walczy dwoma tantō jak w tańcu; najszybsze ręce, najkrótszy zasięg.', weapon: 'Dwa tantō' },
      tetsu: { title: 'Żelazna Twierdza', desc: 'Samuraj w zbroi. Naginata daje największy zasięg; ciosy ledwie go drasną.', weapon: 'Naginata' },
      ren: { title: 'Szkarłatny Oni', desc: 'Zabijaka w masce oni. Przeraża ciosami łamiącymi blok i niszczycielskimi kopnięciami.', weapon: 'Uchigatana' },
      kage: { title: 'Sam Cień', desc: 'Zakapturzony cień. Szybki z ninjatō, długi zryw; gdziekolwiek przejdzie, zostawia cień.', weapon: 'Ninjatō' },
      tora: { title: 'Tygrys na Łańcuchu', desc: 'Mistrz kusarigamy. Smaga obciążonym łańcuchem ze średniego dystansu; ciężki atak przyciąga rywala pod sierp.', weapon: 'Kusarigama' },
      jin: { title: 'Mnich Żelaznego Kija', desc: 'Mnich z kijem bō. Długi kij uderzający oboma końcami, solidny blok i tępe, powalające ciosy; nigdy nie przelewa krwi, tylko obija kości.', weapon: 'Bō' },
      mai: { title: 'Tancerka z Wachlarzami', desc: 'Kunoichi z bojowymi wachlarzami. Bardzo szybka, z szerokim oknem parowania; wachlarze odsyłają pociski, a ich wiatr odpycha rywali.', weapon: 'Dwa tessen' },
      tsubame: { title: 'Jaskółcza Łuczniczka', desc: 'Nosi łuk i tantō. Strzela z dystansu (przytrzymaj ciężki, by oddać silny strzał), a przed każdym, kto podejdzie, ucieka saltem w tył, strzelając z powietrza.', weapon: 'Yumi + Tantō' },
      shura: { title: 'Szkarłatny Mistrz', desc: 'Demoniczny mistrz, którego ścieżkę znaczy szkarłat. Długi nodachi, miażdżące ciosy, niemal bezbłędne parowania.', weapon: 'Nodachi' },
    });

    merge(EN.ARENAS, {
      temple: 'Księżycowa świątynia',
      rain: 'Bambusowy las w burzy',
      snow: 'Ośnieżony szczyt',
      village: 'Płonąca wioska',
      market: 'Nocny targ',
      waterfall: 'Wodospad',
      castle: 'Dach zamku',
    });

    merge(EN.SPECIALS, {
      akane: { desc: 'Szkarłatne cięcie iai, które w mgnieniu oka przechodzi przez rywala i zostawia w powietrzu płonący półksiężyc.', tip: 'Sparuj albo uskocz zrywem w bok' },
      aoi: { desc: 'Szeroki zamach, który posyła naprzód ostrze wiatru; idealnie wymierzony blok je odbija.', tip: 'Skocz, przetnij je ostrzem albo zablokuj w idealnym momencie' },
      kuro: { desc: 'Wyskakuje i rozłupuje ziemię nodachi; fala uderzeniowa pędząca po podłożu miażdży bloki i powala.', tip: 'Przeskocz falę i uderz w powietrzu' },
      yuki: { desc: 'Błyskawiczna seria pięciu ciosów jak zamieć; ostatni powala.', tip: 'Blokuj i sparuj pierwszy cios' },
      hana: { desc: 'Wiruje naprzód z dwoma tantō jak trąba z płatków wiśni, tnąc na obie strony.', tip: 'Blokuj albo odskocz zrywem do tyłu' },
      tetsu: { desc: 'Kręci naginatą dookoła; trafienia nie przerywają obrotu (superpancerz).', tip: 'Wyjdź z zasięgu albo sparuj' },
      ren: { desc: 'Szarża barkiem, która rozbija bloki, a po niej wznoszące cięcie podrzucające rywala.', tip: 'Blok nie pomoże: paruj, skacz albo zrób zryw' },
      kage: { desc: 'Znika w dymie, zostawia klona z cienia i pojawia się za rywalem, by uderzyć.', tip: 'Zablokuj w chwili, gdy Kage się pojawi' },
      tora: { desc: 'Kręci łańcuchem nad głową w cyklon, który kosi wszystko wokół; złapany rywal zostaje przyciągnięty i wyrzucony sierpem w niebo.', tip: 'Wyjdź z zasięgu albo blokuj: jeśli łańcuch cię nie złapie, przyciąganie trafi w próżnię' },
      jin: { desc: 'Naciera, kręcąc kijem jak diamentowym kołem; po czterech ciosach wznoszące uderzenie podrzuca rywala.', tip: 'Odskocz zrywem albo sparuj pierwszy cios' },
      mai: { desc: 'Rozkręca wir, który sunie naprzód, wciąga rywala, tnie go i w końcu wyrzuca w niebo.', tip: 'Zablokuj wir w idealnym momencie albo się wycofaj: porusza się powoli' },
      tsubame: { desc: 'Odskakuje i zasypuje pole strzałami z nieba; po chybieniu wypuszcza jaskółczą strzałę, która zawraca i trafia od tyłu.', tip: 'Zejdź ze znaczników na ziemi; jaskółcza strzała wraca, więc uważaj na plecy' },
      shura: { desc: 'Ryczy i rozpływa się w szkarłatnym dymie, pojawia się przed rywalem i za nim, by zadać trzy ciężkie cięcia nodachi; ostatnie podrzuca.', tip: 'Wypatruj szkarłatnego błysku: sparowanie cięcia kończy technikę; blok miażdży twoją postawę' },
    });

    merge(EN.TXT, {
      gbreak: 'POSTAWA ZŁAMANA!', cut: 'PRZECIĘTE!', reflect: 'ODBITE!', parry: 'PAROWANIE!', caught: 'CHWYT!',
      swallowHit: '燕!', vajraHit: '金剛!', whirlHit: '旋風の舞',
    });

    merge(EN.AI_LEVELS, { 0: 'Uczeń', 1: 'Mistrz', 2: 'Legenda', 3: 'Shura' });

    EN.NUMWORDS = ['Zero', 'Jeden', 'Dwa', 'Trzy', 'Cztery', 'Pięć', 'Sześć', 'Siedem', 'Osiem', 'Dziewięć', 'Dziesięć', 'Jedenaście', 'Dwanaście'];


    merge(EN.PHRASES, {

      'Gölge Düellosu': 'Shadow Duel',
      'Duraklat': 'Pauza',
      'KARŞILIKLI SERİ': 'WYMIANA',
      'SON DARBE': 'OSTATNI CIOS',
      'atlamak için bir tuşa bas': 'naciśnij dowolny klawisz, by pominąć',

      'GARD': 'BLOK',
      'HAFİF': 'LEKKI',
      'SALDIR': 'ATAK',
      'AĞIR': 'CIĘŻKI',
      'ATIL': 'ZRYW',
      'TEKME': 'KOPNIJ',

      'Sekiz savaşçı, üç arena. Gerçek zamanlı kılıç çarpışması, kılıç kilitlenmesi, savuşturma, denge kırma, Gölge Kesiği ve ragdoll fiziği.': 'Osiem postaci, trzy areny. Starcia na miecze w czasie rzeczywistym, zwarcia ostrzy, parowania, łamanie postawy, Cięcie Cienia i fizyka ragdoll.',
      'İki Oyuncu': 'Dwóch graczy',
      'Aynı klavyede ya da iki gamepad ile kafa kafaya': 'Łeb w łeb na jednej klawiaturze lub dwóch padach',
      'CPU\'ya Karşı': 'Przeciw CPU',
      'Ninjanı seç, rakibini yapay zekâ yönetsin': 'Wybierz ninja, a rywalem pokieruje SI',
      'Zorluk': 'Trudność',
      'Çırak': 'Uczeń',
      'Usta': 'Mistrz',
      'Efsane': 'Legenda',
      'Aylık Turnuva': 'Turniej miesiąca',
      'Dan Sınavı': 'Egzamin Dan',
      'Şampiyonlar Salonu': 'Sala Chwały',
      'Seyret': 'Oglądaj',
      'Rastgele iki ninja, Efsane yapay zekâ': 'Dwóch losowych ninja, SI Legenda',
      'Ses': 'Dźwięk',
      'Müzik': 'Muzyka',
      'Kan efekti': 'Krew',
      'Tuş ipuçları': 'Podpowiedzi klawiszy',
      'Yüksek grafik': 'Wysoka grafika',

      'Kontroller': 'Sterowanie',
      '1. Oyuncu': 'Gracz 1',
      '2. Oyuncu': 'Gracz 2',
      'Yürü': 'Chód',
      'Zıpla': 'Skok',
      'Gard (basılı tut)': 'Blok (przytrzymaj)',
      'Hafif kesik (×3 kombo)': 'Lekkie cięcie (kombo ×3)',
      'Ağır kesik': 'Ciężkie cięcie',
      'Tekme': 'Kopnięcie',
      'Sol Shift': 'Lewy Shift',
      'Sağ Shift': 'Prawy Shift',
      'Atılma': 'Zryw',
      'Ki tekniği (ki dolu)': 'Technika ki (pełne ki)',

      'Ninjanı seç': 'Wybierz ninja',
      'Hazır': 'Gotowe',
      '1. oyuncunun ninjası': 'Ninja gracza 1',
      '2. oyuncunun ninjası': 'Ninja gracza 2',
      'Önceki ninja': 'Poprzedni ninja',
      'Sonraki ninja': 'Następny ninja',
      '1. oyuncu kadrosu': 'Skład gracza 1',
      '2. oyuncu kadrosu': 'Skład gracza 2',
      'Dövüşe başla': 'Do walki',
      'Geri': 'Wstecz',
      'Kilitli': 'Zablokowane',
      'Rastgele': 'Losowo',
      'Hız': 'Szybkość',
      'Güç': 'Siła',
      'Menzil': 'Zasięg',
      'Can': 'Zdrowie',

      'Duraklatıldı': 'Pauza',
      'Devam et': 'Wznów',
      'Maçı yeniden başlat': 'Zacznij mecz od nowa',
      'Ana menü': 'Menu główne',
      'Rövanş': 'Rewanż',
      'Karakter değiştir': 'Zmień postać',
      'Zafer senin': 'Zwycięstwo jest twoje',
      'Raund': 'Rundy',
      'Verilen hasar': 'Zadane obrażenia',
      'Savuşturma': 'Parowania',
      'Ki Saldırısı': 'Ataki ki',

      'Antrenman': 'Trening',
      'ANTRENMAN': 'TRENING',
      'Sıralama': 'Ranking',
      'Tümü': 'Wszystkie',
      'Ekranı yan çevir': 'Obróć ekran poziomo',
      'Performans için grafik düşürüldü': 'Obniżono grafikę dla płynności',

      'Kanlı Usta': 'Krwawy Mistrz',
      'Yolunu kanla çizen iblis usta. Uzun nodachi, yıkıcı darbeler, neredeyse kusursuz savuşturma.': 'Demoniczny mistrz, który znaczy swoją drogę krwią. Długi nodachi, miażdżące ciosy, niemal bezbłędne parowania.',

      'SEN': 'TY',
      'KUKLA': 'MANEKIN',

      'Son raund': 'Ostatnia runda',
      'Kazanan her şeyi alır': 'Zwycięzca bierze wszystko',
      'İlk iki raundu alan kazanır': 'Wygrywa, kto pierwszy weźmie dwie rundy',
      'Dövüş!': 'Walcz!',
      'Süre doldu': 'Koniec czasu',
      'Berabere': 'Remis',
      'Çifte K.O.': 'Podwójny K.O.',
      'Mükemmel': 'Perfekcyjnie',

      'F / K tuşuna hızlıca bas!': 'Wciskaj F / K!',
      'Hafif ya da ağır tuşuna hızlıca bas!': 'Wciskaj lekki lub ciężki!',

      'KARŞILIK': 'KONTRA',
      'SAVUŞTUR': 'PARUJ',

      'SON VURUŞ!': 'WYKOŃCZENIE!',
      'KİLİTLENDİ!': 'ZWARCIE!',
      'İTTİ!': 'PCHNIĘCIE!',
      'DENGE KIRILDI!': 'POSTAWA ZŁAMANA!',
      'GARD KIRILDI!': 'BLOK PRZEBITY!',
      'KESİLDİ!': 'PRZECIĘTE!',
      'YANSITMA!': 'ODBICIE!',
      'SAVUŞTURMA!': 'PAROWANIE!',
      'YAKALANDI!': 'CHWYT!',
      'ZIRH!': 'PANCERZ!',
      'ARKADAN!': 'W PLECY!',
      'DUVAR!': 'ŚCIANA!',
      'KAFA!': 'W GŁOWĘ!',
      'KARŞI!': 'KONTRATAK!',
      'KRİTİK!': 'KRYTYK!',
      'SÜPÜRME!': 'PODCIĘCIE!',
      'KARŞILIK!': 'KONTRA!',
      'YERE SERİLDİ': 'POWALENIE',
      'ÇARPIŞMA!': 'STARCIE!',
    });

    merge(EN.HTML, {

      'Gölge<br><em>Düel</em><em>losu</em>': 'Shadow<br><em>Du</em><em>el</em>',

      '<b>Savuşturma:</b> darbe gelmeden hemen önce gard tuşuna bas; rakip sendeler.':
        '<b>Parowanie:</b> wciśnij blok tuż przed trafieniem; rywal się zachwieje.',
      '<b>Karşılık (返し技):</b> gard ya da savuşturmanın hemen ardından saldırı tuşu → anında karşı kesik. <b>İleri</b> + hafif = bacağa süpürme, <b>geri</b> + hafif = yanından dönüp arkadan kesme, <b>ağır</b> = güçlü karşı darbe.':
        '<b>Kontra (返し技):</b> atak zaraz po bloku lub parowaniu → natychmiastowe kontrcięcie. <b>Przód</b> + lekki = podcięcie nóg, <b>tył</b> + lekki = obejście i cięcie od tyłu, <b>ciężki</b> = potężny kontratak.',
      '<b>Karşılıklı seri:</b> karşılık da karşılanabilir. Her turda vuruşlar hızlanır ve güçlenir; kendi 3. karşılığın üç vuruşluk sinematik bir bitirişe dönüşür. Seriyi kıran darbe ağır çekimde iner.':
        '<b>Wymiana:</b> kontrę też można skontrować. Każda wymiana jest szybsza i mocniejsza; twoja 3. kontra zamienia się w filmowe wykończenie z trzech ciosów. Cios, który przerywa wymianę, spada w zwolnionym tempie.',
      '<b>Kılıç kilidi:</b> kılıçlar çarpışınca kilitlenebilir. Hafif/ağır tuşuna hızlı basan rakibini iter.':
        '<b>Zwarcie ostrzy:</b> zderzone ostrza mogą się zewrzeć. Kto szybciej wciska lekki/ciężki, ten odpycha rywala.',
      '<b>Ki barı</b> vurdukça, yedikçe ve savuşturdukça dolar. Dolunca her ninjanın kendine özgü ki tekniği açılır (Antrenman’daki hareket listesinde görebilirsin).':
        '<b>Pasek ki</b> ładuje się, gdy trafiasz, obrywasz i parujesz. Gdy jest pełny, każdy ninja może użyć swojej techniki ki (zajrzyj do listy ruchów w Treningu).',
      '<b>Atılma + hafif</b> = atılarak kesik. <b>Havada</b> hafif = hava kesiği, ağır = dalış. Ağır kesik yere serer, duvara çarpan geri seker.':
        '<b>Zryw + lekki</b> = cięcie w zrywie. <b>W powietrzu</b> lekki = cięcie w powietrzu, ciężki = nurkowanie. Ciężkie cięcie powala; kto uderzy o ścianę, odbija się.',
      '<b>Denge çubuğu</b> dolarsa gard kırılır. Tekme gardı delip dengeyi hızla doldurur.':
        'Gdy <b>pasek postawy</b> się zapełni, blok pęka. Kopnięcia przechodzą przez blok i szybko zapełniają postawę.',

      'Gamepad: X hafif · Y ağır · B tekme · A zıpla · LB gard · RB shuriken · RT atılma · R3 ki tekniği. Start ya da <kbd>P</kbd> duraklatır. CPU modunda her iki tuş seti de seni yönetir.':
        'Pad: X lekki · Y ciężki · B kopnięcie · A skok · LB blok · RB shuriken · RT zryw · R3 technika ki. Start lub <kbd>P</kbd> to pauza. W trybie CPU oba zestawy klawiszy sterują tobą.',

      '<kbd>Enter</kbd> başlatır · <kbd>⌫</kbd> menüye döner': '<kbd>Enter</kbd> start · <kbd>⌫</kbd> wstecz',
      '<kbd>Enter</kbd> / <kbd>F</kbd> başlatır · <kbd>⌫</kbd> çıkar': '<kbd>Enter</kbd> / <kbd>F</kbd> start · <kbd>⌫</kbd> wyjście',
    });

    EN.PATTERNS.push(

      [/^RAUND (\d+)$/, 'RUNDA $1'],
      [/^(\d+)\. Raund$/, 'Runda $1'],

      [/^(\d+)\. KARŞILIK$/, 'KONTRA ×$1'],
      [/^(\d+) VURUŞLUK SERİ!$/, 'WYMIANA ×$1!'],

      [/^(.+) önde$/, (m, n) => I.t(n) + ' prowadzi'],

      [/^(.+) kazandı$/, (m, n) => I.t(n) + ' wygrywa'],

      [/^(\d+) – (\d+) · (\d+) raund · (.+)$/, (m, a, b, r, ar) => `${a} – ${b} · ${r} ${pl(r, 'runda', 'rundy', 'rund')} · ${I.t(ar)}`],
    );


    merge(EN.STR, {
      menu: { play: 'Graj', playSub: (name, lv) => `${name} vs CPU · ${lv}` },
      first: { play: 'Graj', sub: 'Jedno dotknięcie i już walczysz', menu: 'Wszystkie tryby' },
      ads: {
        cont: 'Kontynuuj stąd', contSub: 'Obejrzyj reklamę · powtórka bez kary',
        trial: (name) => `Wypróbuj postać ${name} w jednej walce`, trialSub: 'Obejrzyj reklamę',
        fail: 'Brak reklamy, spróbuj za chwilę',
      },
      coach: {
        attack: (l) => `${l} Atak`,
        guard: (l, g) => `Przytrzymaj ${g}, by blokować`,
        parry: (l, g) => `Wciśnij ${g} tuż przed trafieniem: parowanie`,
        attackT: (l) => `Dotknij ${l} · stukaj dalej: kombo`,
        guardT: (l, g) => `Przytrzymaj ${g}, by blokować`,
        parryT: (l, g) => `Dotknij ${g} tuż przed trafieniem: parowanie`,
      },
    });


    merge(EN.STR, {
      vol: {
        title: 'Głośność', master: 'Ogólna', music: 'Muzyka', sfx: 'Efekty', sound: 'Dźwięk',
        pct: (n) => `${n}%`,
        muted: 'Dźwięk jest wyłączony. Przesuń suwak, by go włączyć.',

        voice: 'Głosy',
        uiSfx: 'Dźwięki menu',
        credit: 'Głosy: ユーフルカ (youfulca.com) · 効果音ラボ · すぱらんど',
      },
    });



    merge(EN.STR, {
      tedit: {
        move: 'Ruch',
        moves: { float: 'Gałka', fixed: 'Stała gałka', dpad: 'Krzyżak' },
        mnote: {
          float: 'Gałka pojawia się tam, gdzie położysz kciuk.',
          fixed: 'Gałka zostaje tam, gdzie ją ustawisz; pchaj od jej środka.',
          dpad: 'Osobne przyciski: przytrzymaj, by iść, dotknij dwa razy, by zrobić zryw. Naciśnij między dwoma przyciskami, by użyć obu (▶ + ▲ = skok w przód).',
          dtap: 'Osobne przyciski: szybkie dotknięcie ◀ ▶ to jeden krótki krok, przytrzymaj, by iść, dotknij dwa razy, by zrobić zryw.',
        },
        dtap: 'Krok na dotknięcie',
        edit: 'Dostosuj sterowanie',
        title: 'Dostosuj sterowanie',
        hint: 'Przeciągnij przycisk w dowolne miejsce. Dotknij go, by zmienić rozmiar, krycie albo go ukryć.',
        rotate: 'Obróć ekran poziomo, by ułożyć sterowanie walki.',
        shapes: { phone: 'Telefon', tablet: 'Tablet', portrait: 'Pion' },
        screenNote: 'Układ zapisuje się dla tego kształtu ekranu: telefony i tablety mają osobne.',
        save: 'Zapisz', cancel: 'Anuluj', options: 'Opcje', done: 'Gotowe', close: 'Zamknij',
        size: 'Rozmiar', sizes: { s: 'S', m: 'M', l: 'L', xl: 'XL' },
        opacity: 'Krycie', opacityAll: 'Krycie (wszystkie)',
        hide: 'Ukryj', show: 'Pokaż', hidden: 'Ukryty',
        snap: 'Przyciągaj do siatki',
        presets: 'Gotowe układy', pRight: 'Prawa ręka', pLeft: 'Lewa ręka', pSplit: 'Blok po lewej',
        reset: 'Przywróć domyślne', resetDone: 'Przywrócono domyślny układ (zadziała po zapisaniu).',
        overlap: 'Przyciski nie mogą na siebie nachodzić: przeniesiono w najbliższe wolne miejsce.',
        noRoom: 'Brak miejsca: przycisk wrócił na swoje miejsce.',
        saved: 'Zapisano sterowanie',
        throwName: 'SHURIKEN',
        pauseName: 'Pauza',
        dirs: { dl: '◀ Lewo', dr: 'Prawo ▶', du: '▲ Skok', dd: '▼ Blok' },
      },
    });



    merge(EN.STR, {
      menu: { arcadeDesc: 'Pokonuj rywali jednego po drugim, gdy rośnie poziom trudności, a na końcu czeka ukryty mistrz. Najhojniejsze źródło honoru.' },
      sel: {
        title: { rival: 'Wyzwanie rywala · Wybierz ninja' },
        go: { rival: 'Przyjmij pojedynek' },
        moves: 'Ruchy',
        movesOf: (name) => `${name} · Ruchy`,
        close: 'Zamknij',
      },
      hint: {
        honor: (have, need) => `Honor ${num(Math.min(have, need))}/${num(need)} → otwiera się Wyzwanie rywala`,
        ready: 'Czeka na wyzwanie!',
        arenaHonor: (have, need) => `Otwiera się od ${num(need)} pkt honoru (${num(Math.min(have, need))}/${num(need)})`,
      },
      honor: {
        name: 'Honor',
        head: 'Honor',
        rows: { win: 'Wygrana', loss: 'Udział', rounds: 'Wygrane rundy', perfect: 'Perfekcyjna runda', rally: 'Wymiana kontr', counter: 'Kontra', parry: 'Parowanie', rivalWin: 'Wyzwanie rywala', arcadeClear: 'Arcade ukończone' },
        total: (n) => `Honor: ${num(n)}`,
        next: (name, left) => `Następny ninja: ${name} — brakuje ${num(left)} pkt honoru`,
        bar: (have, need) => `Honor ${num(Math.min(have, need))}/${num(need)} → otwiera się Wyzwanie rywala`,
        ready: (name) => `${name} rzuca ci wyzwanie!`,
        readyGo: 'Przyjmij',
        all: 'Wszyscy ninja odblokowani',
        bonus: { arcadeClear: 'Arcade ukończone', tourneyClear: 'Turniej zdobyty', danPass: 'Egzamin Dan zdany', rivalWin: 'Wyzwanie rywala wygrane', tutorial: 'Samouczek ukończony' },
        bonusToast: (n, what) => `+${num(n)} honoru · ${what}`,
        road: 'Droga Honoru',
        roadSub: 'Honor zdobywasz w każdym trybie dla jednego gracza. Gdy osiągniesz próg danego ninja, wyzwie cię na pojedynek; wygraj, a dołączy do ciebie.',
        earnHead: 'Skąd brać honor',
        earn: (H) => [
          ['Przeciw CPU', `Wygrana: Uczeń ${H.win[0]} · Mistrz ${H.win[1]} · Legenda ${H.win[2]}`],
          ['Arcade', `Wygrane wg trudności · Shura ${H.win[3]} · ukończenie +${H.arcadeClear}`],
          ['Turniej i Dan', `Wygrane ×${H.modeMul.tourney} · zdobycie turnieju +${H.tourneyClear} · każdy egzamin Dan od +${H.danPass(1)} w górę`],
          ['Nawet w porażce', `Udział ${H.loss} · każda wygrana runda ${H.roundWon}`],
          ['Dobra gra', `Parowania, kontry, wymiany, perfekcyjne rundy: do +${H.styleCap} na mecz`],
        ],
        rivalsHead: 'Rywale',
        arenasHead: 'Areny',
        open: 'Odblokowane',
        castle: 'Pokonaj Shurę w Arcade',
        you: (n) => `Twój honor: ${num(n)}`,
      },
      rival: {
        stage: 'Wyzwanie rywala',
        selTitle: (name) => `${name} rzuca ci wyzwanie · Wybierz ninja`,
        lvHp: (lv, p) => (p === 100 ? lv : `${lv} · zdrowie rywala ${p}%`),
        accept: 'Przyjmij wyzwanie',
        acceptSub: (name) => `Wygraj, a ${name} dołączy do ciebie`,
        quit: 'Wycofaj się',
        hud: 'WYZWANIE RYWALA',
        winTitle: (name) => `${name} dołącza do ciebie!`,
        winSub: (name) => `${name} czeka już na ekranie wyboru. Wypróbuj od razu!`,
        tryNew: (name) => `Graj jako ${name}`,
        lossTitle: 'Wyzwanie trwa',
        lossSub: (name, p) => `Tym razem górą: ${name}. Porażka nic nie kosztuje; następnym razem rywal zacznie z ${p}% zdrowia.`,
        lossSubMin: (name) => `Tym razem górą: ${name}. Porażka nic nie kosztuje; spróbuj jeszcze raz.`,
        retry: 'Wyzwij ponownie',
        reveal: 'Nowy ninja',
        toastReady: (name) => `${name} rzuca ci wyzwanie!`,
        lines: {
          hana: 'Słyszałam o twoim honorze, cały targ o tobie mówi! Dotrzymaj kroku mojemu tańcowi, a pójdę z tobą!',
          tetsu: 'Twoje imię dotarło do moich uszu. Pokonaj mnie, a moja naginata stanie u twego boku.',
          ren: 'Ha! Wreszcie ktoś mnie wezwał! Wygrasz, to jestem twój; przegrasz, to posłuchasz, jak się śmieję!',
          kage: 'Obserwuję cię od jakiegoś czasu. Złap mój cień, a będę twój.',
          tora: 'Udowodnij, że nie jesteś zdobyczą. Wymknij się mojemu łańcuchowi, a pójdę u twego boku.',
          jin: 'Jeśli twój honor płynie z serca, mój kij to wyczuje. Chodź, wystawię cię na próbę.',
          mai: 'Zapraszam cię na moją scenę. Zdobądź moje oklaski, a mój taniec będzie twój.',
          tsubame: 'Obserwowałam cię z daleka; masz talent. Uniknij moich strzał, a mój łuk stanie po twojej stronie.',
        },
      },
    });



    merge(EN.CHARS, {
      akane: { desc: 'Mistrzyni iaijutsu. Ostrze czeka w pochwie, a każde cięcie to dobycie; jej postawa dobycia przechwytuje nadchodzące ciosy.', weapon: 'Katana (iai)' },
      aoi: { desc: 'Szermierz wiatru z jednoręcznym tachi. Dalekie pchnięcia i kroki wiatru skracają każdy dystans jednym ruchem.', weapon: 'Tachi' },
      ren: { desc: 'Zabijaka w masce oni. Miecz na ramieniu; walczy łokciami, kolanami, barkiem i głową, a bloki miażdży.' },
      kage: { desc: 'Zakapturzony cień. Trzyma ninjatō odwrotnym chwytem; walczy krokami cienia, zwodami i bombami dymnymi.' },
    });
    merge(EN.TXT, { kiCancel: 'ANULOWANIE KI!', launch: 'PODRZUT!', iaiCatch: 'IAI GAESHI!' });
    EN.PATTERNS.push([/^(\d+) VURUŞ$/, 'KOMBO $1']);
    merge(EN.PHRASES, {

      'Tekme': 'Kopnięcie',
      'Tekme: dengeyi hızla doldurur, gardı kırmaya yarar. Ardından AĞIR ile seri bitirişine bağlanır.': 'Kopnięcie: szybko zapełnia postawę i pomaga przebić blok. Potem CIĘŻKI daje zakończenie serii.',
      'Shuriken fırlatır; zamanla yeniden dolar.': 'Rzuca shurikenem; zapas odnawia się z czasem.',
      'Hava kesiği': 'Cięcie w powietrzu',
      'Havada hafif kesik. Havaya fırlatılmış rakibe de vurur.': 'Lekkie cięcie w powietrzu. Trafia też podrzuconego rywala.',
      'Dalış': 'Nurkowanie',
      'Havadan aşağı dalış kesiği; yere serer.': 'Cięcie w nurkowaniu z powietrza; powala.',
      'Kaeshi-waza (karşılık)': 'Kaeshi-waza (kontra)',
      'Gard ya da savuşturmanın hemen ardından karşılık: nötr Suriage, ileri Harai (yere serer), geri Nuki (arkaya geçer), ağır Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.': 'Kontra zaraz po bloku lub parowaniu: neutralnie Suriage, w przód Harai (powala), w tył Nuki (przechodzi za plecy), ciężki Uchiotoshi. Twoja trzecia odpowiedź to wykończenie; jeśli zostanie sparowana, wymiana trwa dalej.',
      'Fırlatıcı isabet edince HAFİF: rakibin peşinden sıçrayıp havada keser. Ardından AĞIR ile yere çakar. Havadaki rakip en çok üç vuruş alır.': 'Gdy podrzut trafi, LEKKI: skok za rywalem i cięcie w powietrzu. Potem CIĘŻKI wbija go w ziemię. Rywal w powietrzu przyjmie najwyżej trzy trafienia.',
      'Üç vuruşluk hafif seri. İkinci ve üçüncü vuruş ki doluyken tekniğe bağlanır.': 'Lekka seria z trzech ciosów. Przy pełnym ki drugi i trzeci cios można anulować w technikę ki.',
      'Ağır vuruş: yavaş ama yere serer.': 'Ciężki cios: wolny, ale powala.',
      'İleri atılarak dürter; hafif seriye devam eder.': 'Wypad z pchnięciem; przechodzi w lekką serię.',
      'Yarım adım geri çekilip bacaklara alçak süpürme; yere serer.': 'Pół kroku w tył, potem niskie podcięcie nóg; powala.',
      'Fırlatıcı: yükselen kesik rakibi havaya kaldırır.': 'Podrzut: wznoszące cięcie unosi rywala w powietrze.',
      'Sıçrayıp tepeden iner: yavaş ama gardı ezer, yere serer.': 'Skacze i spada z góry: wolne, ale miażdży blok i powala.',
      'Atılırken dönerek geniş kesik; yere serer.': 'Szerokie cięcie z obrotem w zrywie; powala.',
      'İki kesiklik seri bitirişi; son kesik yere serer.': 'Zakończenie serii z dwóch cięć; ostatnie powala.',
      'Rakibin kılıcını aşağı çarpıp dürter: gardı ezer.': 'Zbija ostrze rywala w dół i pcha: miażdży blok.',

      'Kından yatay çekiş kesiği, çapraz iniş, geri dönen kesik; kılıç her seferinde kınına döner.': 'Poziome cięcie z dobycia, ukośne cięcie w dół i cięcie powrotne; ostrze za każdym razem wraca do pochwy.',
      'Derin çömelişten geniş yatay çekiş; yere serer.': 'Szerokie poziome dobycie z głębokiego przysiadu; powala.',
      'Atılarak kından çekiş: uzak mesafeyi bir anda kapatır, seriye devam eder.': 'Dobycie z pochwy w zrywie: w mgnieniu oka skraca duży dystans i przechodzi w serię.',
      'Kılıcı çekmeden kabzayla göğse vurur: hızlı, sersemletir. Ardından HAFİF ile Kesa ya da AĞIR ile Kurenai Renga.': 'Uderza rękojeścią w pierś bez dobywania: szybko i ogłuszająco. Potem LEKKI daje Kesa, a CIĘŻKI Kurenai Renga.',
      'Fırlatıcı: kından yükselen çekiş rakibi havaya kaldırır.': 'Podrzut: wznoszące dobycie z pochwy unosi rywala w powietrze.',
      'Çekiş duruşu: kısa bir an bekler; bu sırada gelen yakın dövüş darbesini yakalar ve kaçınılmaz bir iai kesiğiyle karşılık verir. Boşa giderse açık kalır.': 'Postawa dobycia: czeka przez chwilę; cios wręcz, który nadejdzie w tym czasie, zostaje przechwycony i skontrowany nieuniknionym cięciem iai. Jeśli nic nie nadejdzie, Akane zostaje odsłonięta.',
      'Kesa’dan sonra yükselen ve inen iki çekiş kesiği; son kesik yere serer.': 'Po Kesa wznoszące i opadające cięcie z dobycia; ostatnie powala.',
      'Tekmeden sonra çömelip rakibin içinden geçen kızıl iai; arkasında belirir.': 'Po kopnięciu szkarłatne iai z przysiadu, które przechodzi przez rywala na wylot; Akane pojawia się za nim.',

      'Tek elle uzun dürtüş, yukarı savrulan kesik ve rüzgâr adımıyla derin atılma dürtüşü.': 'Długie jednoręczne pchnięcie, cięcie podrywające w górę i głębokie pchnięcie z wypadem na kroku wiatru.',
      'Dönerek geniş yatay kesik; yere serer.': 'Szerokie poziome cięcie z obrotem; powala.',
      'Rüzgâr adımı: çok uzaktan tek hamlede dürter, seriye devam eder.': 'Krok wiatru: pchnięcie z bardzo daleka jednym ruchem; przechodzi w serię.',
      'Geri çekilirken uzun menzilli iniş kesiği: yaklaşanı cezalandırır.': 'Cięcie w dół o dużym zasięgu w trakcie odwrotu: karze każdego, kto się zbliża.',
      'Fırlatıcı: dönerek yükselen kesik rakibi havaya kaldırır.': 'Podrzut: wznoszące cięcie z obrotem unosi rywala w powietrze.',
      'Geri sıçrar, ardından çok uzağa uzanan dürtüşle geri döner: gardı ezer, yere serer.': 'Odskakuje, po czym wraca bardzo długim pchnięciem: miażdży blok i powala.',
      'Üç hızlı dürtüş; sonuncusu rüzgârla rakibi savurur.': 'Trzy szybkie pchnięcia; ostatnie zdmuchuje rywala podmuchem wiatru.',
      'İki kez dönerek çevresini biçen kesik; gardı ezer.': 'Dwa obroty z cięciem dookoła; miażdży blok.',

      'Kesik · Dirsek · Diz': 'Cięcie · Łokieć · Kolano',
      'Tek elle kesik, dirsek darbesi ve uçan diz: kılıçla başlayıp bedenle biter.': 'Jednoręczne cięcie, uderzenie łokciem i kolano z wyskoku: zaczyna się mieczem, kończy ciałem.',
      'İki elle tepeden ezici iniş; gardı zorlar, yere serer.': 'Miażdżący dwuręczny cios z góry; nadwyręża blok i powala.',
      'Omuz hücumu: öne atılıp omuzla çarpar, dengeyi sarsar. İsabet ederse seriye devam eder.': 'Szarża barkiem: wypad i taranowanie barkiem, które wstrząsa postawą. Po trafieniu przechodzi w serię.',
      'Kafa atar: kısa menzil, uzun sersemletme. İsabet ederse seriye devam eder.': 'Cios głową: krótki zasięg, długie ogłuszenie. Po trafieniu przechodzi w serię.',
      'Fırlatıcı: aşağıdan yukarı iki elle savrulan kesik.': 'Podrzut: dwuręczne cięcie wyprowadzone od dołu do góry.',
      'Topuğu havaya kaldırıp balta gibi indirir: yere serer.': 'Unosi piętę wysoko i opuszcza ją jak topór: powala.',
      'Dirsekten sonra kesik ve tepeden ezici iniş; son vuruş yere serer.': 'Po łokciu cięcie i miażdżący cios z góry; ostatnie trafienie powala.',
      'Tekmenin ardından dönen topuk tekmesi; yere serer.': 'Po kopnięciu obrotowe kopnięcie piętą; powala.',

      'Ters tutuşla kesik, dönen kesik ve gölge adımı: kaybolup öne geçer, dürterek belirir.': 'Cięcie odwrotnym chwytem, cięcie z obrotem i krok cienia: znika, przemyka naprzód i pojawia się z pchnięciem.',
      'Sıçrayıp ters tutuşla aşağı saplar; yere serer.': 'Podskakuje i dźga w dół odwrotnym chwytem; powala.',
      'Gölge gibi uzun atılma kesiği; seriye devam eder.': 'Długie cięcie w zrywie, niczym cień; przechodzi w serię.',
      'Aldatma: kesecekmiş gibi parlar, dumanla geri kaçar. Erken savuşturmayı boşa çıkarır; hemen HAFİF ile gölge adımına, AĞIR ile Kage-nui’ye bağlanır.': 'Zwód: błyska, jakby miał ciąć, po czym wycofuje się w dymie. Marnuje zbyt wczesne parowanie; od razu przechodzi w krok cienia (LEKKI) albo w Kage-nui (CIĘŻKI).',
      'Fırlatıcı: ters tutuşla yükselen kesik.': 'Podrzut: wznoszące cięcie odwrotnym chwytem.',
      'Ayağının dibine sis bombası atar: yakındakini sersemletir, Kage dumanın içinde geri kaçar.': 'Rzuca bombę dymną pod nogi: ogłusza każdego w pobliżu, a Kage wycofuje się w dymie.',
      'Üç hızlı ters kesik ve aşağı saplama; sonuncusu yere serer.': 'Trzy szybkie cięcia odwrotnym chwytem i dźgnięcie w dół; ostatnie powala.',
      'Tekmeden sonra dumanda kaybolur, rakibin arkasında belirip saplar.': 'Po kopnięciu znika w dymie, pojawia się za rywalem i dźga.',

      'Nodachi serisi': 'Seria nodachi', 'Ağır nodachi': 'Ciężki nodachi', 'Kodachi serisi': 'Seria kodachi', 'Ağır kesik': 'Ciężkie cięcie',
      'Tantō dansı': 'Taniec tantō', 'Çift kesik': 'Podwójne cięcie', 'Naginata serisi': 'Seria naginaty', 'Ağır savuruş': 'Ciężki zamach',
      'Zincir ve orak': 'Łańcuch i sierp', 'Zincir çekişi': 'Przyciągnięcie łańcuchem', 'Asa serisi': 'Seria kija', 'Ağır süpürme': 'Ciężkie podcięcie',
      'Yelpaze serisi': 'Seria wachlarzy', 'Rüzgâr dalgası': 'Fala wiatru', 'Tantō serisi': 'Seria tantō', 'Ok (basılı tut: güçlü)': 'Strzała (przytrzymaj: silny strzał)',
      'Geri + AĞIR da ok atar (basılı tut: güçlü atış); ok kalmadıysa tantō ile tepeden iner.': 'Tył + CIĘŻKI też wypuszcza strzałę (przytrzymaj, by oddać silny strzał); bez strzał Tsubame spada z góry z tantō.',

      'KI İPTALİ!': 'ANULOWANIE KI!', 'HAVAYA!': 'PODRZUT!',
    });



    {
      const tb = (t, c) => `<i class="tb${c ? ' ' + c : ''}">${t}</i>`;
      merge(EN.STR, {
        kaeshi: {
          head: 'KAESHI-WAZA', strike: 'UDERZ!', hits: 'TRAFIENIA',
          labels: {
            suriage: 'Wjedź po ostrzu rywala w górę, tnij ukośnie w dół',
            harai: 'Odbij ostrze rywala w bok, tnij po nogach',
            nuki: 'Uniknij ciosu, tnij od tyłu',
            uchiotoshi: 'Zbij ostrze rywala w dół, pchnij na wylot',
            sandan: 'Seria trzech kontrcięć',
          },
        },
        trial: {
          title: 'Próba kombo',
          btn: { prev: 'Poprzednie kombo', next: 'Następne kombo', retry: 'Od nowa', close: 'Zamknij' },
          names: { chain: 'Podstawowa seria', s1: 'Zakończenie serii', s2: 'Seria z kopnięciem', launch: 'Podrzut', s3: 'Długie kombo' },
          desc: {
            chain: '{L} trzy razy. Wciskaj każdy, gdy trafia poprzedni cios; seria kończy się nazwanym wykończeniem.',
            s1: '{L} dwa razy, potem {H}: seria kończy się ciężkim cięciem.',
            s2: '{L}, kopnięcie {K}, potem {H}.',
            launch: '{D} + {H} podrzuca; gdy rywal leci, {L}, potem {H}.',
            s3: 'Dwa razy {L}, {D} + {H} na podrzut, {L}, {H}: pięć trafień.',
          },
          ready: (w) => `Start: ${w}`,
          startWith: (w) => `To kombo zaczyna się od: ${w}.`,
          early: 'Za wcześnie: wciśnij, gdy trafia poprzedni cios.',
          late: 'Za późno: wciśnij, zanim ruch się skończy, w chwili trafienia.',
          wrong: (got, want) => `Zły przycisk: ${got}, ten krok wymaga: ${want}.`,
          dir: (want) => `Brak kierunku: ${want}. Przytrzymaj kierunek, potem wciśnij.`,
          miss: 'Pudło: cios nie trafił. Podejdź bliżej manekina.',
          clear: 'KOMBO ZALICZONE!', clearPop: 'KOMBO ZALICZONE!',
          all: 'Wszystkie próby kombo tego ninja zaliczone!',
        },
        coach: {
          combo: (l) => `${l} ${l} ${l} szybko: kombo z 3 ciosów`,
          comboT: (l) => `Dotknij ${l} trzy razy z rzędu: kombo`,
          counter: (l) => `Po bloku lub parowaniu wciśnij ${l}, gdy pojawi się UDERZ!: kontra`,
          counterT: (l) => `Po bloku lub parowaniu dotknij ${l}, gdy pojawi się UDERZ!`,
        },
      });
      const L = Array.isArray(EN.STR.lessons) && EN.STR.lessons.find((l) => l.id === 'counter');
      if (L) L.d = 'Po bloku lub parowaniu nad twoją głową pojawia się <b>UDERZ!</b>: wciśnij <kbd>F</kbd>, zanim skończy się jego pasek. Przód/tył + <kbd>F</kbd> albo <kbd>G</kbd> to inne kontry.';
      if (EN.STR.lessonsTouch) EN.STR.lessonsTouch.counter = `Po bloku lub parowaniu nad twoją głową pojawia się <b>UDERZ!</b>: dotknij ${tb('ATAK', 'tb-light')}, zanim skończy się jego pasek. Gałka w przód/tył + ${tb('ATAK', 'tb-light')} albo ${tb('CIĘŻKI')} to inne kontry.`;
      merge(EN.PHRASES, {
        'KOMBO TAMAM!': 'KOMBO ZALICZONE!',
        'Nasıl okunur': 'Jak czytać',
        '→ rakibe doğru, ← rakipten uzağa demek: o yön tuşunu (A / D ya da ok tuşları; rakip sağındaysa D) basılı tut ve saldırı tuşuna bas. Virgül: tuşlara sırayla bas. F hafif, G ağır, R tekme, S gard.':
          '→ oznacza w stronę rywala, ← od rywala: przytrzymaj ten klawisz kierunku (A / D lub strzałki; D, gdy rywal jest po prawej) i wciśnij klawisz ataku. Przecinek: wciskaj klawisze po kolei. F lekki, G ciężki, R kopnięcie, S blok.',
        '▶ rakibe doğru, ◀ rakipten uzağa: yön çubuğunu o yana itip düğmeye dokun. Virgül: düğmelere sırayla dokun. Antrenmandaki Kombo denemesi her seriyi adım adım gösterir.':
          '▶ w stronę rywala, ◀ od rywala: pchnij gałkę w tę stronę i dotknij przycisku. Przecinek: dotykaj przycisków po kolei. Próba kombo w Treningu pokazuje każdą serię krok po kroku.',
        'Gard ya da savuşturmanın ardından ekranda VUR! çıkar: altındaki çubuk bitmeden HAFİF’e bas. Yalnız HAFİF: Suriage. İleri + HAFİF: Harai (yere serer). Geri + HAFİF: Nuki (arkaya geçer). AĞIR: Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.':
          'Po bloku lub parowaniu pojawia się UDERZ!: wciśnij LEKKI, zanim skończy się jego pasek. Sam LEKKI: Suriage. Przód + LEKKI: Harai (powala). Tył + LEKKI: Nuki (przechodzi za plecy). CIĘŻKI: Uchiotoshi. Twoja trzecia odpowiedź to wykończenie; jeśli zostanie sparowana, wymiana trwa dalej.',
      });
    }



    merge(EN.STR, {
      gfx: {
        title: 'Grafika',
        levels: { auto: 'Auto', high: 'Wysoka', medium: 'Średnia', low: 'Niska', custom: 'Własna' },
        note: {
          auto: 'Dobiera się do urządzenia i sama się obniża, gdy walka się zacina.',
          high: 'Wszystkie światła i efekty. Dla mocnych urządzeń.',
          medium: 'Lekka poświata, bez cieni. Dla większości telefonów.',
          low: 'Najpłynniejsza. Dla starszych telefonów.',
          custom: 'Twoje własne ustawienia (Zaawansowane).',
        },
        now: (lv) => `Teraz: ${lv}`,


        adv: {
          title: 'Zaawansowane',
          note: 'Zmiana dowolnej opcji przełącza wybór na „Własna”; wybranie gotowego poziomu przywraca jego wartości.',
          hot: 'grzeje najbardziej',
          knob: { scale: 'Rozdzielczość', msaa: 'Wygładzanie krawędzi', bloom: 'Poświata', shadows: 'Cienie i odbicia', effects: 'Pogoda i cząsteczki' },
          val: { off: 'Wył.', low: 'Niska', mid: 'Średnia', full: 'Pełna', simple: 'Prosta' },
        },
      },
    });



    merge(EN.STR, {
      fps: {
        title: 'Liczba klatek',
        show: 'Pokaż FPS',
        levels: { max: 'Maks.' },
        note: {
          60: 'Stabilnie i chłodno. Najlepsze dla większości telefonów.',
          90: 'Płynniej, jeśli ekran to obsługuje. Zużywa więcej baterii.',
          120: 'Najpłynniej na ekranach 120 Hz. Zużywa więcej baterii.',
          max: 'Tak szybko, jak pozwala ekran.',
        },
      },
    });


    merge(EN.STR, {
      set: {
        title: 'Ustawienia', close: 'Zamknij',
        tabs: { audio: 'Dźwięk', controls: 'Sterowanie', gfx: 'Grafika', lang: 'Język' },
        touch: 'Dotyk', keys: 'Klawiatura', pad: 'Pad',
        touchNote: 'Ustawienia sterowania dotykowego pojawią się tutaj, gdy dotkniesz ekranu.',
      },
    });



    merge(EN.STR, { lang: { title: 'Język', change: 'Zmień język', close: 'Zamknij' } });




    merge(EN.STR, {
      thelp: {
        title: { float: 'Gałka', fixed: 'Stała gałka', dpad: 'Krzyżak' },
        float: { walk: 'Połóż kciuk na wolnej połowie i przesuwaj: chód', jump: 'Pchnij w górę: skok', guard: 'Pociągnij w dół: blok', dash: 'Dwa szybkie ruchy w bok: zryw' },
        fixed: { walk: 'Chwyć gałkę za środek i pchaj w bok: chód', jump: 'Pchnij w górę: skok', guard: 'Pociągnij w dół: blok', dash: 'Dwa szybkie ruchy w bok: zryw' },
        dpad: {
          walk: 'Przytrzymaj: chód', step: 'Szybkie dotknięcie: jeden krótki krok', jump: 'Dotknij: skok', guard: 'Przytrzymaj: blok',
          dash: 'Dotknij dwa razy: zryw', both: 'Naciśnij między dwoma przyciskami, by użyć obu (▶ + ▲ = skok w przód)',
        },
        edit: (b) => `${b}: przeciągnij dowolny przycisk, gdzie chcesz, i ustaw jego rozmiar oraz krycie. W menu Ustawienia → Sterowanie.`,
      },
    });


    merge(EN.PHRASES, { 'Shuriken': 'Shuriken', 'KI': 'KI' });


    merge(EN.STR, { menu: { arcadeDesc: 'Ścieżka ośmiu walk dla każdego ninja. Wracaj do kolejnego rywala, odblokuj zakończenie postaci i pieczęć Mistrza.' }, sel: { title: { arcade: 'Arcade · Ścieżka postaci' } },
      journey: {
        start: 'Rozpocznij ścieżkę',
        resume: (i, n) => 'Kontynuuj · ' + i + '/' + n + '',
        ending: 'Obejrzyj zakończenie',
        replay: 'Powtórz ścieżkę',
        badge: 'Pieczęć Mistrza',
        completed: 'Ścieżka ukończona',
        progress: (i, n) => 'Ukończone walki: ' + i + '/' + n + ' · postęp zapisany',
        reward: 'Nagroda: zakończenie postaci i stała pieczęć Mistrza',
        saved: 'Każda wygrana jest zapisywana. Wyjście z walki liczy się jako powtórka.',
        menu: (done, active) => 'Ukończone ścieżki: ' + done + ' · w toku: ' + active,
        clearReward: 'Zdobyto pieczęć Mistrza · Odblokowano zakończenie postaci',
      },
    });



    merge(EN.STR, {
      set: { tabs: { save: 'Postęp' } },
      acct: {
        title: 'Zachowaj postęp',
        cgOn: (n) => `Konto CrazyGames: ${n}. Twoje tytuły, barwy czempiona, stopień Dan i wyniki zapisują się na koncie.`,
        cgWait: (n) => `Konto CrazyGames: ${n}. Łączenie z kontem…`,
        cgFail: (n) => `Konto CrazyGames: ${n}. Konto jest teraz nieosiągalne; nowe wyniki zostają na razie na tym urządzeniu.`,
        cgSave: 'Zapisz postęp na koncie CrazyGames',
        cgSaveNote: 'Zaloguj się, a twoje tytuły, barwy czempiona i wyniki trafią na konto, dostępne na każdym urządzeniu.',
        rcTitle: 'Kod odzyskiwania',
        rcNote: 'Zapisz ten kod. Wpisz go tutaj na nowym urządzeniu, by odzyskać tytuły, barwy czempiona, stopień Dan i wyniki.',
        rcShow: 'Pokaż kod', rcNew: 'Nowy kod', rcNewDone: 'Nowy kod gotowy; stary już nie działa.',
        rcNeedName: 'Najpierw zapisz wynik pod pseudonimem, by dostać kod odzyskiwania.',
        rcEnter: 'Wpisz kod odzyskiwania', rcGo: 'Przywróć',
        rcDone: (n, c) => `Witaj ponownie, ${n}! Postęp przywrócony. Twój nowy kod odzyskiwania: ${c}`,
        err: { bad_code: 'Nie rozpoznajemy tego kodu. Sprawdź znaki.', rate: 'Za dużo prób. Spróbuj później.', offline: 'Brak połączenia z serwerem. Sprawdź internet.', banned: 'Tej tożsamości nie można użyć.', error: 'Coś poszło nie tak. Spróbuj ponownie.' },
        local: 'Zapis online nie jest tu dostępny; postęp zostaje na tym urządzeniu.',
        offline: 'Jesteś teraz offline; postęp zostaje na tym urządzeniu.',
        loading: 'Ładowanie…',
      },
      lb: { savedLocalAccount: (r) => (r ? `#${r} na tym urządzeniu · konto jest teraz nieosiągalne` : 'Zapisano na tym urządzeniu · konto jest teraz nieosiągalne') },
    });



    merge(EN.STR, {
      priv: {
        notice: 'Shadow Duel zapisuje twój pseudonim i wyniki na potrzeby rankingów online.',
        policy: 'Polityka prywatności', terms: 'Regulamin', both: 'Polityka prywatności i regulamin',
        ok: 'OK', label: 'Informacja o prywatności',
      },
    });



    merge(EN.STR, {
      menu: { trainDrill: 'Ćwiczenie parowania' },
      tutor: {
        defend: 'BROŃ SIĘ!', attack: 'ATAK!', again: 'JESZCZE RAZ!',
        pass: {
          freeze: (l, g) => `Czas stoi: ${g}, by się bronić, ${l}, by oddać cios`,
          slow: (l, g) => `Zwolnione tempo: ${g}, gdy pierścień się zamyka, potem ${l}`,
          real: (l, g) => `Pełna prędkość: ${g}, by się bronić, ${l}, by oddać cios, dwa razy`,
        },
        fail: {
          early: 'Za wcześnie! Blokuj tuż przed uderzeniem ostrza.',
          late: 'Za późno! Blokuj tuż przed uderzeniem ostrza.',
          slow: 'Za późno! Oddaj cios, póki widać ATAK!',
          atk: 'Najpierw obrona, potem atak!',
          miss: 'Spróbujmy jeszcze raz.',
        },
        mastered: 'OPANOWANE!', masteredSub: 'Obrona, kontra, powtórka',
        warm: (l) => `Rozgrzewka: uderz ${l} trzy razy`,
        nudge: (k) => `Wciśnij ${k}`, nudgeT: (k) => `Dotknij ${k}`,


        skip: 'Pomiń ›',
        steps: {
          attack: (b) => `Uderz: ${b}`, guard: (b) => `Zablokuj ostrze: ${b}`, counter: (b) => `Oddaj cios: ${b}`,
          timing: (b, l) => `Twoja kolej: ${b}, gdy pierścień się zamyka, potem ${l}`,
        },
        ok: { attack: 'NIEŹLE!', guard: 'SPAROWANE!', counter: 'KONTRA!', timing: 'IDEALNIE!' },
        ready: 'GOTOWE!', readySub: 'Teraz wygraj pojedynek',
      },
    });




    merge(EN.STR, {
      onb: { selIntro: 'Wybierz ninja: każdy ma własną ścieżkę', more: 'Szczegóły' },
      tips: {
        head: 'RADA',
        ki: (k) => `KI pełne! ${k}: ruch specjalny`,
        gbreak: (k, h) => `Ciągle blokuje: kopnięcie ${k} albo ciężkie cięcie ${h} zapełnia żółty pasek i przebija blok`,
        gbreakH: (h) => `Ciągle blokuje: ciężkie cięcie ${h} zapełnia żółty pasek i przebija blok`,
        posture: (g) => `Twój pasek postawy się zapełnia: cofnij się albo sparuj przyciskiem ${g}`,
        dash: (a) => `Dotknij dwa razy ${a}: zryw`,
        shuriken: (t) => `${t}: rzut shurikenem`,
        heavy: (h) => `${h}: ciężkie cięcie, wolniejsze, ale mocniejsze`,
        lessons: (a, b) => `Pełne lekcje: ${a} → ${b}`,
        controls: (a, b) => `Przyciski przesuniesz i zmienisz ich rozmiar w ${a} → ${b}`,
      },
    });


    merge(EN.STR, {
      online: {
        title: 'Graj ze znajomym',
        menuSub: 'Pojedynek online · udostępnij link lub 6-literowy kod',
        homeSub: 'Utwórz pokój i wyślij znajomemu link albo wpisz kod, który dostajesz od znajomego.',
        create: 'Utwórz pokój',
        join: 'Dołącz',
        codePh: 'KOD',
        haveCode: 'Kod pokoju',
        room: 'Pokój',
        linkLabel: 'Link z zaproszeniem',
        back: 'Wstecz',
        leave: 'Opuść pokój',
        copy: 'Kopiuj link',
        copied: 'Skopiowano',
        share: 'Udostępnij',
        invite: 'Zaproś znajomego',
        shareText: (c) => `Zmierz się ze mną w Shadow Duel! Pokój ${c}`,
        inviteNote: 'Wyślij link albo podaj znajomemu kod.',
        waitFriend: 'Czekamy, aż znajomy dołączy…',
        joining: 'Szukanie pokoju…',
        connecting: 'Łączenie ze znajomym…',
        connected: 'Połączono',
        you: 'Ty',
        friend: 'Znajomy',
        friendTag: 'ZNAJOMY',
        waitPick: 'Wybiera…',
        pickTitle: 'Twoja postać',
        arenaTitle: 'Arena',
        arenaHost: 'Arenę wybiera znajomy',
        ready: 'Gotowe',
        notReady: 'Jeszcze nie',
        readyWait: 'Czekamy na gotowość znajomego…',
        bothReady: 'Start…',
        ping: (ms) => `Ping ${ms} ms`,
        badCode: 'Kod pokoju ma 6 liter.',
        noRoom: 'Nie ma pokoju o tym kodzie. Sprawdź kod ze znajomym.',
        full: 'Ten pokój jest pełny.',
        expired: 'Przez 10 minut nikt nie dołączył, więc pokój zamknięto.',
        noDirect: 'Nie udało się połączyć bezpośrednio z siecią znajomego. Spróbuj innej sieci (Wi-Fi / dane komórkowe).',
        retry: 'Spróbuj ponownie',
        noConnect: 'Nie udało się połączyć ze znajomym. Sprawdź połączenie z internetem i spróbuj ponownie.',
        version: 'Ty i znajomy macie różne wersje gry. Odświeżcie oboje stronę.',
        signalDown: 'Nie udało się połączyć z serwerem gry. Sprawdź połączenie z internetem.',
        friendLeft: 'Znajomy opuścił pokój.',
        waitIn: (s) => `Czekamy na znajomego… ${s}`,
        away: (s) => `Znajomy jest poza grą… ${s}`,
        leaveQ: 'Opuścić mecz?',
        leaveSub: 'Ten mecz wygra twój znajomy.',
        stay: 'Graj dalej',
        leaveMatch: 'Wyjdź',
        win: 'Wygrywasz',
        lose: 'Przegrywasz',
        draw: 'Remis',
        over: 'Koniec meczu',
        whyDrop: 'Połączenie znajomego zostało zerwane. Wygrywasz (bez zapisu).',
        whyLeft: 'Znajomy opuścił mecz.',
        whyAway: 'Mecz zakończył się podczas twojej nieobecności.',
        whyDesync: 'Mecz stracił synchronizację (problem z połączeniem), więc się nie liczy.',
        rematch: 'Rewanż',
        rematchWait: 'Czekamy na znajomego…',
        rematchAsk: 'Rewanż (znajomy chce)',
        change: 'Zmień postacie',
        rounds: (a, b) => `Rundy ${a} – ${b}`,
        turning: (s) => `Znajomy obraca telefon… ${s}`,
        paused: 'Pauza',
        whyPauseWin: 'Znajomy nie wrócił na czas. Wygrywasz (bez zapisu).',
        whyPauseLose: 'Nie było cię z powrotem na czas, więc mecz się zakończył.',
        whyPauseBoth: 'Żadne z was nie wróciło na czas, więc mecz się zakończył.',
      },
    });


    merge(EN.STR, {
      ranked: {
        title: 'Pojedynek rankingowy', menuSub: 'Losowy rywal · punkty, rangi i sezony', offline: 'Tryb rankingowy jest teraz niedostępny',
        season: (n) => `Sezon ${n}`, endsIn: (d) => `Koniec za ${d} ${pl(d, 'dzień', 'dni', 'dni')}`, endsToday: 'Kończy się dziś',
        rating: 'Punkty', record: (w, l, d) => `${w} W · ${l} P` + (d ? ` · ${d} R` : ''), placement: (a, b) => `Kwalifikacje ${a}/${b}`,
        place: (n) => `Miejsce #${n}`, find: 'Szukaj rywala', findUnranked: 'Szukaj rywala (bez rankingu)', board: 'Ranking', how: 'Jak to działa',
        howLines: ['Serwer szuka rywala o podobnych punktach; zakres rośnie, gdy czekasz.', 'Gdy obie strony zaakceptują, wybierasz postać, nie widząc wyboru rywala (tylko spośród odblokowanych).',
          'Wygrywa, kto pierwszy weźmie 2 z 3 rund. Opuszczenie meczu to porażka.', 'Punkty zmieniają się tylko wtedy, gdy oba urządzenia zgłoszą ten sam wynik. Sezon trwa 4 tygodnie; #1 dostaje specjalny kostium.'],
        reward: 'Sezon #1: specjalny kostium i pseudonim w Sali Chwały',
        signIn: 'Zaloguj się, by zdobywać punkty', guestNote: 'Jako gość grasz bez rankingu.', nickNote: 'Wybierz pseudonim, by grać rankingowo.',
        back: 'Wstecz', you: 'Ty', titleLbl: 'Tytuł', noTitle: 'Brak',
        searching: 'Szukanie rywala…', window: (n) => `Zakres punktów ±${n}`, windowAny: 'Dowolne punkty',
        warm: 'Rozgrzej się z CPU podczas czekania', warmTag: 'Rozgrzewka · CPU · bez rankingu', searchShort: 'Szukanie', warmBack: 'Wróć do szukania', cancel: 'Anuluj',
        none: 'Brak rywali w tej chwili.', foundTitle: 'Rywal znaleziony!', accept: 'Akceptuj', decline: 'Odrzuć',
        ranked: 'Rankingowy', unranked: 'Bez rankingu · bez punktów',
        why: { guest: 'jeden z graczy jest gościem', same_network: 'jesteście w tej samej sieci', pair_limit: 'rozegrano już dziś z tym graczem 3 mecze rankingowe', daily_limit: 'dzienny limit meczów rankingowych' },
        waitOpp: 'Czekamy, aż rywal zaakceptuje…', touch: 'Dotyk', keys: 'Klawiatura / pad', placementTag: 'Kwalifikacje', guestTag: 'Gość',
        declined: 'Rywal nie zaakceptował · szukamy dalej', youDeclined: 'Mecz odrzucony.', penalty: (s) => `Odrzucasz ostatnie mecze: ponowne szukanie za ${s} s.`,
        suspended: 'Twoje konto rankingowe jest sprawdzane (za dużo sporów). Inne tryby są dostępne.',
        pickTitle: 'Wybierz postać', pickSub: 'Rywal nie widzi twojego wyboru', lock: 'Zatwierdź', lockedIn: 'Zatwierdzono', oppPicking: 'Rywal wybiera…', oppLocked: 'Rywal zatwierdził wybór',
        lockedFighter: 'Nieodblokowane w trybie dla jednego gracza', costume: 'Kostium', plain: 'Oryginalne barwy',
        connecting: 'Łączenie z rywalem…', noConnect: 'Nie udało się połączyć z rywalem; mecz się nie liczy. Szukamy ponownie…',
        leaveQ: 'Opuścić mecz?', leaveSub: 'Przegrasz ten mecz rankingowy.', stay: 'Graj dalej', leave: 'Wyjdź',
        waitIn: (s) => `Czekamy na rywala… ${s}`, away: (s) => `Rywal jest poza grą… ${s}`, turning: (s) => `Rywal obraca telefon… ${s}`, paused: 'Pauza',
        confirming: 'Potwierdzanie wyniku…', win: 'Wygrywasz', lose: 'Przegrywasz', draw: 'Remis', over: 'Koniec meczu',
        delta: (d) => (d >= 0 ? '+' : '−') + Math.abs(d) + ' ' + pl(Math.abs(d), 'punkt', 'punkty', 'punktów'), nc: 'Ten mecz się nie liczy', disputed: 'Oba urządzenia zgłosiły różne wyniki: mecz jest sprawdzany, a punkty się nie zmieniły.',
        ncWhy: { desync: 'oba urządzenia różnie obliczyły walkę (problem z połączeniem)', connection: 'połączenie obu graczy zostało zerwane', input_mismatch: 'zapisy sterowania z obu urządzeń się nie zgadzały', abandoned: 'obie strony wyszły', no_second_report: 'wynik rywala nie dotarł', mixed: 'wyniki się nie zgadzały' },
        promoted: 'Awans!', demoted: 'Spadek rangi', placementDone: 'Kwalifikacje ukończone!', pending: 'Wynik wkrótce pojawi się w rankingu.',
        findAgain: 'Szukaj ponownie', rematch: 'Rewanż', rematchWait: 'Czekamy na rywala…', rematchAsk: 'Rewanż (rywal chce)', menu: 'Menu',
        youLeft: 'Opuszczenie meczu: porażka.', oppLeft: 'Rywal opuścił mecz: wygrywasz.', silent: 'Połączenie rywala zostało zerwane.', rounds: (a, b) => `Rundy ${a} – ${b}`,
        unrankedNote: 'Mecz bez rankingu',
        ghostFound: 'Wkracza cień prawdziwego gracza',
        ghostHouseName: (n) => `Cień dojo · ${n}`, ghostHouseFound: 'Wkracza cień dojo', ghostHouseNote: 'CPU walczy w typowym stylu dojo. To nie żywy gracz.', ghostName: (n) => `Cień: ${n}`, ghostTag: 'Cień',
        ghostNote: 'CPU walczy w stylu tego prawdziwego gracza. To nie żywy gracz.',
        ghostReady: 'Cień jest gotowy',
        ghostLeft: 'Opuszczenie meczu z cieniem: porażka.', aiTag: 'SI',
        hallTab: 'Rankingowe', hallDesc: (g) => `Najlepsi sezonu · ${g} ${pl(g, 'mecz rankingowy', 'mecze rankingowe', 'meczów rankingowych')}, by trafić do tabeli`, champs: 'Czempioni', champOf: (n) => `Czempion sezonu ${n}`,
        noChamps: 'Brak czempiona sezonu.', me: (p) => `Twoje miejsce: #${p}.`, meNone: 'Graj mecze rankingowe, by trafić do tabeli.', empty: 'W tym sezonie nikogo jeszcze nie ma w tabeli.',
        tierDesc: ['Piechur', 'Samuraj bez pana', 'Samuraj', 'Gwardzista sztandaru', 'Pan feudalny', 'Szogun'],
        rulesBtn: 'Zasady rankingowe', rulesTitle: 'Jak działa tryb rankingowy', rulesSub: 'Rangi, punkty i sezony', rTiers: 'Rangi', rYou: 'Ty',
        rNext: (n, name) => `${n} ${pl(n, 'punkt', 'punkty', 'punktów')} do rangi ${name}`, rTop: 'Masz najwyższą rangę', rPlacing: (a, b) => `Kwalifikacje ${a}/${b}: ranga pojawi się po ich zakończeniu`,
        rPlacement: 'Kwalifikacje', rPlaceLine: (a, b) => `Kwalifikacje: pierwsze mecze rankingowe (${a}, a w kolejnych sezonach ${b}) ustalają twoje miejsce; potem pojawi się ranga.`,
        rPoints: 'Punkty', rPointsLines: ['Wygrana daje punkty, porażka je odbiera; remis zmienia je nieznacznie.', 'Wygrana z silniejszym rywalem daje więcej; porażka ze słabszym kosztuje więcej.', 'Opuszczenie meczu liczy się jako porażka.'],
        rSeason: 'Sezon', rSeasonLine: (d, left) => `Sezon trwa ${d} ${pl(d, 'dzień', 'dni', 'dni')} · ${left}.`,
        rSeasonEnd: (p) => `Na koniec sezonu twoje punkty cofają się w połowie drogi do 1500 i znów grasz ${p} ${pl(p, 'mecz kwalifikacyjny', 'mecze kwalifikacyjne', 'meczów kwalifikacyjnych')}; najwyższa ranga zostaje jako odznaka.`,
        rReward: (list, n) => `Gracz #1 sezonu zdobywa: ${list} (gdy w tabeli jest co najmniej ${n} graczy).`, rCostumeAll: (x) => `${x} (dla każdej postaci)`, rRewardAny: 'specjalny kostium i tytuł',
        rBoard: 'Ranking', rBoardLine: (g) => `Jak trafić do tabeli: ${g} ${pl(g, 'mecz rankingowy', 'mecze rankingowe', 'meczów rankingowych')} w tym sezonie i ukończone kwalifikacje.`,
        rFighters: 'Postacie', rFightersLine: 'Możesz wybrać postacie odblokowane w trybie dla jednego gracza.',
        aiNote: 'Gdy online jest mało graczy, możesz trafić na rywali SI, którzy grają w stylu prawdziwych graczy.', gotIt: 'Rozumiem',
        err: { network: 'Brak połączenia z serwerem. Sprawdź internet.', bad_version: 'Jest nowa wersja gry: odśwież stronę.', busy: 'Kolejka jest bardzo pełna, spróbuj za chwilę.',
          rate_limited: 'Za dużo prób, poczekaj chwilę.', disabled: 'Tryb rankingowy jest teraz niedostępny.', banned: 'To konto nie może grać rankingowo.', other: 'Coś poszło nie tak, spróbuj ponownie.' },

        bg: { ru: 'Przeglądaj podczas szukania', stopT: 'Zatrzymać szukanie rankingowe?', stopS: 'Ta walka zakończy szukanie.', stopGo: 'Zatrzymaj i graj', keep: 'Szukaj dalej', stopped: 'Szukanie rankingowe zatrzymane', chip: 'Szukam' },
        card: { findMatch: 'Szukaj meczu', searching: 'Szukam…', resume: 'Wróć do meczu',
          place: (p, n) => `${p}. z ${n} w rankingu`, placeOnly: (p) => `${p}. w rankingu`,
          toBoard: (n) => (n === 1 ? 'Jeszcze 1 mecz do rankingu' : `Jeszcze ${n} ${n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'mecze' : 'meczów'} do rankingu`), toBoardSoon: 'Jeszcze kilka meczów do rankingu',
          invite: 'Od Ashigaru do Shōguna: pierwszy mecz rankingowy jest o jedno dotknięcie',
          guestInvite: 'Zaloguj się, by grać o punkty · goście grają bez punktów', nickInvite: 'Wybierz pseudonim, by grać o punkty',
          winRate: (p) => `${p}% wygranych`,
          streakW: (n) => `${n} ${n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'wygrane' : 'wygranych'} z rzędu`,
          streakL: (n) => `${n} ${n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'porażki' : 'porażek'} z rzędu`,
          peak: (t) => `Najlepszy w sezonie: ${t}`, shields: (n) => `Tarcza ×${n}`, top: 'Top 3 sezonu', you: 'Ty', empty: 'Nikogo jeszcze w rankingu: bądź pierwszy', rating: 'pkt' },
      },

      upd: { ready: 'Nowa wersja gotowa — dotknij, aby odświeżyć', refresh: 'Jest nowa wersja — odśwież stronę, aby w nią zagrać', close: 'Zamknij' },
    });



    merge(EN.STR, {
      pass: {
        k: '影', lv: 'POZ',
        level: (n) => `Poziom ${n}`,
        xp: (a, b) => `${a} / ${b} XP`, xpMax: (n) => `Łącznie ${n} XP`, plus: (n) => `+${n} XP`,
        name: 'Przepustka Cienia', season: (n) => `Sezon ${n}`, left: (d) => `${pl(d, 'Został', 'Zostały', 'Zostało')} ${d} ${pl(d, 'dzień', 'dni', 'dni')}`, lastDay: 'Ostatni dzień',
        tier: (t, n) => `Etap ${t}/${n}`, ready: (n) => `Do odebrania: ${n}`,
        free: 'Darmowe', bonus: 'Cień', bonusAds: 'Każda nagroda: jedna reklama', bonusWait: (n) => `Bez reklam: otwiera się ${n} ${pl(n, 'etap', 'etapy', 'etapów')} później`,
        claim: 'Odbierz', claimAll: (n) => `Odbierz wszystko (${n})`, owned: 'Odebrano', watch: 'Reklama', milestone: 'Darmowe', opensAt: (t) => `Na etapie ${t}`,
        online: 'Wymaga sieci', soon: 'Wkrótce kolejne etapy', soonXp: 'Twoje XP wciąż się liczy', close: 'Zamknij', tabs: { pass: 'Przepustka', profile: 'Profil' },
        rows: { win: 'Wygrana', loss: 'Udział', rounds: 'Rundy', perfect: 'Perfekcja', rally: 'Wymiana', counter: 'Kontra', parry: 'Parowanie', short: 'Krótka walka', boost: 'Wzmocnienie', daily: 'Pierwsza wygrana dnia', streak: 'Seria', clear: 'Ścieżka', trial: 'Próba kombo', tutorial: 'Samouczek', first: 'Na powitanie' },
        streakN: (n) => `dzień ${n}`,
        up: 'Nowy poziom', got: 'Nowa nagroda',
        boostName: (n) => `×1,5 XP · ${n} ${pl(n, 'walka', 'walki', 'walk')}`, honorName: (n) => `+${n} honoru`,
        gotDup: (n) => `Już to masz: zamiast tego ×1,5 XP na ${n} ${pl(n, 'walkę', 'walki', 'walk')}`, boostLeft: (n) => `×1,5 XP · ${pl(n, 'została', 'zostały', 'zostało')} ${n} ${pl(n, 'walka', 'walki', 'walk')}`,
        kinds: { cos: 'Kostium', title: 'Tytuł', badge: 'Odznaka', frame: 'Ramka', trail: 'Smuga ostrza', boost: 'Wzmocnienie XP', honor: 'Honor' },
        use: 'Załóż', inUse: 'Założone', none: 'Jeszcze nic', wearHint: 'Kostiumy zakładasz na ekranie wyboru postaci, w wierszu z barwami.',
        heads: { titles: 'Tytuły', badges: 'Odznaki', frames: 'Ramki', trails: 'Smugi ostrza', costumes: 'Kostiumy', seals: 'Pieczęcie ścieżek' },
        total: (n) => `Łącznie ${n} XP`, streak: (n) => `${n} ${pl(n, 'dzień', 'dni', 'dni')} z rzędu`,
        daily: 'Pierwsza wygrana dnia: +100 XP', dailyDone: 'Dzisiejsza pierwsza wygrana: zaliczona',
        seal: { 1: 'Ścieżka ukończona', 2: 'Menkyo: ścieżka ukończona dwa razy', 3: 'Kaiden: ścieżka ukończona 3 razy' },
        clears: (n) => `Ścieżka ukończona ${n}×`,
        next2: 'Ukończ ścieżkę 2. raz: kostium i tytuł Menkyo', next3: 'Ukończ ją 3. raz: cień i tytuł Kaiden',
        rank: { 2: 'Menkyo', 3: 'Kaiden' }, cos2: (n) => `${n} · barwy Menkyo`, cos3: (n) => `${n} · cień Kaiden`,
        themes: { sakura: 'Sakura', ember: 'Żar', frost: 'Szron', jade: 'Jadeit', ash: 'Popiół', moon: 'Księżyc', lotus: 'Lotos', storm: 'Burza', yami: 'Yami' },
        items: {
          trail_sakura: 'Smuga sakury', trail_ember: 'Smuga żaru', trail_frost: 'Smuga szronu', trail_jade: 'Smuga jadeitu', trail_violet: 'Fioletowa smuga', trail_gold: 'Złota smuga',
          title_novice: 'Młode Ostrze', title_wanderer: 'Wędrowiec', title_duelist: 'Duelista', title_parry: 'Stalowy Mur', title_ronin: 'Ronin', title_nightblade: 'Nocne Ostrze', title_s1: 'Cień 1. sezonu',
          badge_blade: 'Odznaka ostrza', badge_moon: 'Odznaka księżyca', badge_fire: 'Odznaka ognia', badge_snow: 'Odznaka śniegu', badge_sakura: 'Odznaka sakury', badge_dragon: 'Odznaka smoka', badge_kage: 'Odznaka cienia',
          frame_bronze: 'Brązowa ramka', frame_silver: 'Srebrna ramka', frame_crimson: 'Szkarłatna ramka', frame_jade: 'Jadeitowa ramka', frame_gold: 'Złota ramka',
        },
      },
    });



    merge(EN.STR, {
      pass: {
        kinds2: { pose: 'Poza zwycięstwa', hitfx: 'Efekt ciosu', slash: 'Cięcie kontry', aura: 'Aura ki', ko: 'Wykończenie KO', card: 'Wizytówka', arena: 'Wariant areny', music: 'Muzyka menu', rkey: 'Klucz', akey: 'Klucz', ticket: 'Bilet', shield: 'Tarcza' },
        items2: { key_rival: 'Klucz wyzwania', key_arena: 'Klucz areny', ticket_trial: 'Bilet próbny', shield: 'Tarcza rankingowa' },
        heads2: { title: 'Tytuł', flair: 'Ozdoby walki', arenas: 'Warianty aren', music: 'Muzyka menu', items: 'Przedmioty' },
        profile: 'Profil',
        profileSub: 'Tytuł · stroje · ozdoby',
        passTab: 'Przepustka Cienia',
        tapEquip: 'Dotknij, by założyć',
        plain: 'Zwykła',
        usual: 'Zwykła',
        noneYet: 'Zdobędziesz z Przepustki Cienia',
        shields: (n, m) => `Tarcza rankingowa ${n}/${m}`,
        shieldHelp: 'Porażka rankingowa nie odbiera punktów; jedna dziennie, działa sama.',
        tickets: (n) => `Bilety próbne: ${n}`,
        ticketHelp: 'Wypróbuj zablokowanego ninję w 3 walkach z CPU: dotknij go przy wyborze wojownika.',
        useTicket: (n) => `Bilet próbny · walki: ${n}`,
        useTicketSub: (n) => `Masz: ${n}`,
        ticketLeft: (n) => `Próba: zostało walk: ${n}`,
        keyRival: (name) => `Wyzwanie otwarte: ${name}`,
        keyArena: (name) => `Arena otwarta: ${name}`,
        keyHonor: (n) => `Nie ma już czego otwierać: +${n} honoru`,
        shieldGot: (n, m) => `Tarcza rankingowa: ${n}/${m}`,
        shieldFull: (n) => `Tarcze pełne: zamiast tego +${n} honoru`,
        shieldOff: (n) => `Tu nie ma rankingu: zamiast tego +${n} honoru`,
        shieldUsed: 'Tarcza użyta: punkty bez zmian',
        rankedHonor: (n) => `+${n} honoru`,
        variant: 'Wariant',

        newTag: 'NOWE', newN: (n) => `Nowe: ${n}`, headUnlocks: 'Ninja i areny', headRewards: 'Nagrody rankingowe',
        flair: { pose_tenchi: 'Ostrze ku niebu', pose_rei: 'Ukłon rei', pose_hiza: 'Zanshin na kolanie', pose_katsugi: 'Miecz na ramieniu', pose_kissaki: 'Jesteś następny', hitfx_kinpaku: 'Ciosy złotego płatka', hitfx_aizome: 'Indygowy tusz', hitfx_sakura: 'Wybuch sakury', hitfx_kitsunebi: 'Lisi ogień', hitfx_raijin: 'Iskry Raijina', slash_kin: 'Złote ostrze', slash_sumi: 'Pędzel sumi', slash_hana: 'Wiatr płatków', slash_rai: 'Cięcie gromu', aura_kitsunebi: 'Aura lisiego ognia', aura_raiun: 'Aura burzy', aura_hana: 'Aura kwiatów', aura_gekko: 'Aura księżyca', ko_enso: 'Wykończenie ensō', ko_hanafubuki: 'Burza płatków', ko_raiko: 'Uderzenie pioruna', ko_mikazuki: 'Sierp księżyca', card_seigaiha: 'Fale seigaiha', card_yozakura: 'Nocna sakura', card_ryu: 'Smoczy lakier', card_tsukiyo: 'Sosny w świetle księżyca', card_asanoha: 'Złote asanoha', arena_temple_snow: 'Zaśnieżona świątynia', arena_rain_moon: 'Bambusy w świetle księżyca', arena_snow_night: 'Nocny śnieżny szczyt', arena_market_rain: 'Nocny targ w deszczu', music_haru: 'Wiosenny ogród', music_yuki: 'Śnieżny księżyc', music_matsuri: 'Noc festiwalu', pass1_akane: 'Strój Cienia Luny' },
      },
    });

    void dec; void fmtTime; void num;
  };



  (ND.JOURNEY_COPY || (ND.JOURNEY_COPY = {})).pl = {
    ui: ['Ścieżka postaci', 'Ostatni rywal', 'Mistrzostwo (opcjonalne)', 'Wygraj tę walkę, by zachować gwiazdę.', 'Gwiazda mistrzostwa zdobyta', 'Bez gwiazdy · Spróbuj przy powtórce', 'Gwiazdy mistrzostwa', 'Ukończ ścieżkę z 6 z 8 gwiazd, by zdobyć tytuł i barwy Dziedzictwa. Gwiazdy przechodzą między powtórkami.', 'Oryginalne barwy', 'Barwy Dziedzictwa', 'Wygląd', 'Zdobądź 6 gwiazd mistrzostwa i ukończ ścieżkę tej postaci.', 'Twoja poprzednia ścieżka i nagrody są zachowane. Zagraj ponownie, by odkryć nową trasę.', 'Wyzwanie Shury: ukończ ścieżki 3 różnych postaci.', 'Wygraj ten pojedynek, by odblokować', 'Ścieżka ukończona', 'Rozdział'],
    goals: ['Parowania', 'Trafienia kontrą', 'Ciężkie trafienia', 'Trafienia kopnięciem', 'Trafienia w powietrzu', 'Trafienia w zrywie', 'Trzecie ciosy kombo', 'Trafienia pociskiem', 'Trafienia techniką ki', 'Przebite bloki'],
    titles: ['Szkarłatna przysięga', 'Wolny wiatr', 'Serce góry', 'Zimowe ślady', 'Kwiat księżyca', 'Niezłomny sztandar', 'Odwaga bez maski', 'Ciche przyrzeczenie', 'Tygrys bez łańcucha', 'Otwarta dłoń', 'Spokojna bryza', 'Daleki horyzont', 'Drugi świt'],
    endings: ['Akane opuszcza ostrze przed Renem. Odbuduje swoją szkołę nauczaniem, nie zemstą.', 'Aoi kończy dawny pojedynek z Akane i opuszcza świątynię jako równy jej wojownik, wolny, by wybrać własną drogę.', 'Kuro i Tetsu składają broń. Górska droga znów stoi otworem dla wieśniaków.', 'Yuki przyjmuje wyciągniętą dłoń Hany. Po raz pierwszy jej ślady biegną obok cudzych.', 'Hana zabiera Yuki na festiwal lampionów. W jej ostatnim tańcu jest miejsce dla przyjaciółki.', 'Tetsu zdobywa szacunek Kuro i zatyka sztandar na przełęczy: żaden wieśniak nie zostanie zawrócony.', 'Ren przechodzi przez sztuczki Kage i zdejmuje własną maskę. Nie potrzebuje już strachu, by go słuchano.', 'Kage pokazuje Renowi twarz i znika. Tym razem jego obietnica przetrwa dłużej niż cień.', 'Tora kładzie łańcuch obok kija Jina. Przeprawa przez rzekę nie należy do żadnego pana.', 'Jin zatrzymuje Torę, nie odbierając mu życia. Przy wodospadzie nowy uczeń prosi o pierwszą lekcję.', 'Mai łapie wachlarzem ostatnią strzałę Tsubame. Ich rywalizacja kończy się ukłonem, nie urazą.', 'Tsubame wreszcie odczytuje wiatr Mai. Nie wypuszcza ostatniej strzały i zwraca się ku nowemu horyzontowi.', 'Shura staje przed Akane bez korony. Porażka już go nie określa; następna lekcja zaczyna się o świcie.'],
  };

  if (ND.i18n && ND.i18n.loaded) ND.i18n.loaded('pl');
})(window.ND = window.ND || {});
