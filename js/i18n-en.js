// Shadow Duel — English catalog for ND.i18n (Turkish is the source language).
// Structure mirrors the game's tables; see js/i18n.js for how each part is applied.
//   EN.STR       ← ND.STR (arcade.js, roster2.js, banzuke/leaderboard screens)
//   EN.CHARS     ← ND.CHARS title/desc/weapon (characters.js, shura in arcade.js)
//   EN.ARENAS    ← ND.ARENAS names       EN.SPECIALS ← ND.SPECIALS desc/tip (names stay Japanese)
//   EN.TXT       ← ND.TXT canvas texts   EN.AI_LEVELS ← ND.AI_LEVELS[n].name
//   EN.PHRASES   exact Turkish text → English (static HTML, hardcoded literals, canvas pop-ups)
//   EN.HTML      whole-element HTML for mixed text + tags   EN.PATTERNS  regex rules for composed strings
// Control changes that ship with this build are written into the English text: P pauses (Escape is
// CrazyGames' fullscreen key), ⌫ goes back, player 2 throws shuriken with I.
(function (ND) {
  'use strict';
  (ND.I18N_CATALOGS || (ND.I18N_CATALOGS = {})).en = function (I, EN) {
    const merge = I.merge;
    const num = (n) => I.num(n);
    const dec = (x) => I.dec(x);
    const fmtTime = (s) => I.time(s);

    // ================================================================ UI tables (ND.STR)
    merge(EN.STR, {
      menu: {
        brand: (nc, na) => `${nc} fighters, ${na} arenas and a hidden master. Real-time sword clashes, blade locks, parries, posture breaks, ki techniques and ragdoll physics.`,
        arcade: 'Arcade',
        arcadeDesc: 'Beat your rivals one by one as the difficulty climbs, with a hidden master waiting at the end. Win to unlock new ninjas and arenas.',
        arcadeProg: (best, c, ct, a, at) => `${best ? 'Best ' + num(best) + ' · ' : ''}${c}/${ct} ninjas · ${a}/${at} arenas unlocked`,
        train: 'Training',
        trainDesc: 'Practice freely on the dummy or learn step by step',
        trainFree: 'Free',
        trainTut: 'Tutorial',
        watchShort: 'Two random ninjas, Legend AI',
        specialKey: 'Ki technique (full ki)',
        single: 'Single Match', singleDesc: 'Vs CPU or two players',
      },
      sel: {
        title: { '2p': 'Choose your ninja', cpu: 'Choose your ninja', arcade: 'Arcade · Choose your ninja', train: 'Training · Choose your ninja', tutorial: 'Tutorial · Choose your ninja', tourney: 'Monthly Tournament · Choose your ninja', dan: 'Dan Trial · Choose your ninja' },
        who1: { '2p': 'Player 1 · A / D to pick, F to confirm', def: 'You · A / D to pick, F to confirm' },
        who2: { '2p': 'Player 2 · ← / → to pick, K to confirm', cpu: 'Opponent (CPU) · ← / → to pick', train: 'Dummy · ← / → to pick' },
        go: { def: 'Start fight', arcade: 'Start Arcade', train: 'Start training', tutorial: 'Start tutorial', tourney: 'Start tournament', dan: 'Start trial' },
        random: 'Random',
        arena: 'Arena',
        locked: 'Locked',
        lockMsg: (name, hint) => `${name} locked · ${hint}`,
        keyHint: '<kbd>Enter</kbd> start · <kbd>⌫</kbd> back',
      },
      hint: {
        wins: (n, cur) => `Win ${n} fights in Arcade (${Math.min(cur, n)}/${n})`,
        clear: 'Clear Arcade once',
        boss: 'Beat the final boss in Arcade',
        arena: 'Win a fight in this arena in Arcade',
      },
      toast: {
        newChar: (name) => `New fighter unlocked: ${name}`,
        newArena: (name) => `New arena unlocked: ${name}`,
        newBest: (s) => `New best: ${num(s)} pts`,
        lesson: (t) => `Lesson complete: ${t}`,
        tutDone: 'Tutorial complete!',
        perf: 'Graphics lowered for performance',
      },
      vs: {
        stage: (i, n) => `Fight ${i} / ${n}`,
        boss: 'Final fight',
        go: 'Fight!',
        quit: 'Quit Arcade',
        keys: '<kbd>Enter</kbd> / <kbd>F</kbd> start · <kbd>⌫</kbd> quit',
        unknown: '?',
      },
      hud: { you: 'YOU', cpu: 'CPU', dummy: 'DUMMY', stage: (i, n) => `${i}/${n}`, boss: 'FINAL BOSS', inf: '∞', lockSolo: 'Mash F / K!', lockDuo: 'Mash light or heavy!' },
      end: {
        rematch: 'Rematch', change: 'Change fighter', menu: 'Main menu',
        winTitle: 'Victory is yours',
        winSub: (i, n, pts) => `Fight ${i}/${n} cleared · +${num(pts)} pts`,
        next: 'Next fight',
        bossNext: 'On to the end',
        lossTitle: 'Defeated',
        lossSub: (name) => `${name} had the edge this time. Try again.`,
        retry: 'Try again',
        quit: 'Quit Arcade',
      },
      ending: {
        head: 'Ending',
        rows: { fights: 'Fights', time: 'Total time', retries: 'Retries', perfect: 'Perfect rounds', score: 'Score', best: 'Best' },
        newBest: 'New best!',
        menu: 'Main menu',
        again: 'Play again',
        unlocked: 'Unlocked',
        fightPts: 'Fight points',
        bonus: 'Clear bonus',
      },
      score: {
        hud: 'SCORE',
        rows: { hit: 'Hits', combo: 'Combo', counter: 'Counter', defense: 'Defense', pressure: 'Pressure', special: 'Ki technique', round: 'Victory', perfect: 'Perfect', hp: 'HP left', time: 'Time bonus' },
        total: 'Match score',
        diff: (name, m) => `incl. ${name} ×${dec(m)}`,
        best: (s) => `Your best: ${num(s)}`,
        newBest: 'New best!',
        arcadeTotal: (s) => `Arcade total: ${num(s)}`,
        lossNote: (s, pen) => `This attempt doesn’t count · Arcade total ${num(s)} · each retry −${num(pen)}`,
        clearBonus: (c, n) => `+${num(c)}${n ? ' · no retries +' + num(n) : ''}`,
        lossCpu: 'Defeat · only wins go on the board',
        cpuBoardHint: 'Wins on Legend difficulty go on the leaderboard',
      },
      lb: {
        menu: 'Leaderboard',
        menuDesc: 'Arcade and Legend records',
        title: 'Leaderboard',
        back: 'Back',
        boards: { arcade: 'Arcade', cpu_efsane: 'Legend CPU' },
        boardDesc: { arcade: 'Total score of a completed Arcade run', cpu_efsane: 'Score of a single match won against the Legend CPU' },
        all: 'All',
        status: { loading: 'Loading…', online: 'Online leaderboard', readonly: 'Online leaderboard · view only', local: 'Local leaderboard', error: 'Error · local leaderboard', offline: 'Offline · local leaderboard' },
        empty: 'No scores yet. Be the first!',
        loadErr: 'Couldn’t load the leaderboard.',
        you: 'You', youTag: 'you', player: 'Player',
        nick: 'Nickname', nickPh: 'Your nickname', nickSave: 'Save', nickEdit: 'Change',
        nickAsk: 'Nickname for the local leaderboard:',
        saving: 'Saving…',
        savedOnline: (r) => `Online rank: #${r}`,
        savedOnlineNoRank: 'Saved to the online leaderboard',
        savedOnlineGap: (r, g) => `Online rank: #${r} · ${g} pts to the top 10`,
        reason: {
          needName: 'Pick a nickname to join the online leaderboard',
          offline: 'No connection — score kept, it will be sent once you’re back online',
          rate: 'Too many submissions — score will be sent shortly',
          daily: 'Daily submission limit reached — score saved locally only',
          week: 'The month is over — this score doesn’t count toward the new month',
          invalid: 'Invalid score',
        },
        nickErr: {
          nick_length: 'Nickname must be 3–16 characters',
          nick_chars: 'Use only letters, digits, spaces and _ . - (at least one letter)',
          nick_bad: 'That nickname isn’t allowed, try another',
          rate_limited: 'Wait a moment and try again',
        },
        nickErrDef: 'Couldn’t save nickname',
        nickAskOnline: 'Nickname for the online leaderboard:',
        savedLocal: (r) => (r ? `#${r} on the local leaderboard` : 'Saved to the local leaderboard'),
        rejected: 'Your score couldn’t be saved — local leaderboard only',
        quota: 'Online leaderboard is full — score saved locally only',
        open: 'Leaderboard',
        keys: '<kbd>←</kbd> <kbd>→</kbd> board · <kbd>↑</kbd> <kbd>↓</kbd> ninja · <kbd>⌫</kbd> back',
      },
      bz: {
        back: 'Back', toMenu: 'Main menu', you: 'You', youTag: 'you', newBest: 'New best!', seeResult: 'See result',
        resetIn: 'Resets in',
        // time left: days (d) · hours (h) · minutes (m) · seconds (s)
        left: (ms) => { const t = Math.floor(ms / 1000), d = Math.floor(t / 86400), hh = Math.floor((t % 86400) / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60; return d ? `${d}d ${hh}h ${mm}m` : hh ? `${hh}h ${mm}m` : `${mm}m ${ss}s`; },
        leftShort: (ms) => { const t = Math.floor(ms / 60000), d = Math.floor(t / 1440), hh = Math.floor((t % 1440) / 60), mm = t % 60; return d ? `${d}d ${hh}h` : hh ? `${hh}h ${mm}m` : `${mm}m`; },
        weekName: (m, y) => `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1] || m} ${y}`,
        monthName: (m) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1] || String(m),
        rank: (r) => (r <= 0 ? 'Unranked' : r <= 10 ? `Kyu ${11 - r}` : `Dan ${r - 10}`),
        fightOf: (i, n) => `Fight ${i}/${n}`,
        hpBonus: (p) => `Enemy HP +${p}%`,
        mirrorOpp: 'Mirror · your own ninja',
        suddenSub: 'One round · first to fall loses',
        rows: { fights: 'Wins', time: 'Time', fightPts: 'Fight points', stage: 'Stage bonus', clear: 'Clear bonus', total: 'Tournament score', weekBest: 'Your best this month' },
        mods: {
          rally2x: { n: 'Rally Fire', d: 'Counter damage ×2' },
          fullKi: { n: 'Full Ki', d: 'Every round starts with full ki' },
          sudden: { n: 'Sudden Death', d: 'One round; both sides start at half HP' },
          mirror: { n: 'Mirror', d: 'Your opponent is your own ninja' },
          parryOnly: { n: 'Counters Only', d: 'Normal hits deal 25% damage; counters ×1.5' },
          posture2x: { n: 'Broken Posture', d: 'Posture damage ×2: guards break fast' },
          shuriken3x: { n: 'Shuriken Storm', d: 'Triple shuriken' },
          kiRush: { n: 'Ki Flood', d: 'Ki fills twice as fast' },
          glass: { n: 'Glass Blade', d: 'All damage ×1.5' },
        },
        menu: {
          tour: 'Monthly Tournament', dan: 'Dan Trial', hall: 'Hall of Champions',
          tourRank: (p, left) => `This month: #${p} · resets in ${left}`,
          tourBest: (b, left) => `Your best ${b} · resets in ${left}`,
          tourNew: (left) => `Same 8 fights for everyone · resets in ${left}`,
          danRank: (name, next) => (next ? `Your rank: ${name} · next: ${next}` : `Your rank: ${name} · you’re at the summit`),
          danNew: '20 trials from Kyu 10 to Dan 10',
          hallRank: (p) => `This month #${p} · records`,
          hallDesc: 'The month’s top 10 and all-time records',
          nick: (n) => (n ? `Nickname: ${n}` : 'Pick a nickname'),
          champTitle: 'This month’s top 10', champLocal: 'Top 10 on this device', champEmpty: 'Be the first on this month’s board', champLoading: 'Loading the leaders…',
          champLast: (n) => `Last month’s champion: ${n}`, champOpen: 'open the monthly ranking',
        },
        t: {
          title: 'Monthly Tournament', head: 'Tournament',
          runNote: (s, st) => `Tournament total: ${num(s)} (incl. +${num(st)} per win)`,
          lossSub: (name, won) => `${name} ended your run · ${won} wins`,
          lossNote: (s) => `This fight doesn’t count · tournament score ${num(s)}`,
          quit: 'End tournament',
          myBest: (b, a) => `Your best this month: ${b} pts · ${a} attempts`,
          noTry: 'No attempts yet this month.',
          place: (p, t) => (t ? `#${p} / ${t}` : `#${p}`),
          rules: (n, clear, stage) => `${n} fights; the same opponents, arenas and rules for everyone. One loss ends the attempt; attempts are unlimited and your best one counts. Each win +${stage}, beating them all +${clear}.`,
          start: 'Choose your ninja and begin', again: 'Try again', go: 'Enter tournament',
          clearTitle: 'Tournament conquered', overTitle: 'Attempt over',
          savedToast: (s) => `Tournament score saved: ${s}`,
        },
        d: {
          title: 'Dan Trial', head: 'Dan trial',
          sub: 'Pass each trial to climb the ranks. Your rank shows next to your name on the leaderboards.',
          trialOf: (n) => `${n} trial`,
          runNote: (i, n) => `Trial: ${i}/${n} fights won`,
          lossSub: (name) => `${name} stopped your trial.`,
          lossNote: 'Trial failed',
          quit: 'Leave trial',
          yourRank: 'Your rank', bestWas: (n) => `Highest: ${n}`, ladder: 'Rank ladder',
          nextTrial: (n) => `Next: ${n} trial`,
          fights: (n) => `${n} ${n === 1 ? 'fight' : 'fights'}`,
          bossLast: 'Final fight: Shura',
          strikes: (left, max) => `Chances: ${left}/${max} · ${max} failed trials drop your rank one stage`,
          safe: 'At this rank, a failed trial won’t lower your rank.',
          maxed: 'At the summit: Dan 10', maxedSub: 'Your name tops the Dan board.',
          start: 'Choose your ninja and take the trial', next: 'Next trial', go: 'Take the trial',
          promoted: (n) => `Promoted: ${n}`, demoted: (n) => `Demoted: ${n}`, failed: 'Trial failed',
          promotedSub: (a, b) => `${a} → ${b}`, demotedSub: 'Three failed trials. Climb back up!', tryAgain: 'Try again; your rank is safe.',
          toast: (n) => `New rank: ${n}`, leftToast: 'Trial abandoned: counted as a fail',
        },
        hall: {
          title: 'Hall of Champions',
          tabs: { week: { n: 'This Month' }, alltime: { n: 'All Time' }, archive: { n: 'Champions' }, chars: { n: 'Ninjas' }, dan: { n: 'Dan' } },
          desc: { alltime: 'The Monthly Tournament’s all-time best', archive: 'Every finished month’s top 10 is engraved here for good', chars: 'Record holder for each ninja · tap a ninja to see the top 20', dan: 'Highest ranks' },
          loading: 'Loading…', error: 'Couldn’t load the leaderboard.', retry: 'Try again',
          empty: 'Nobody here yet. Be the first!', emptyDan: 'No ranked players yet.', emptyArchive: 'No finished months yet. Titles start with the October 2026 tournament; its champions will be engraved when it ends on 1 November.', emptyArchiveLocal: 'No finished months on this device yet.',
          anon: 'Player',
          meTop: (p, s) => `You: #${p} · ${s} pts · you’re in the top 10!`,
          meGap: (p, g, s) => `You: #${p} · ${s} pts · ${g} pts to the top 10`,
          meNone: 'No score yet this month.',
          meDan: (p, n) => `You: #${p} · ${n}`,
          meDanLocal: (n) => `Your rank: ${n}`, meNoDan: 'No rank yet. First trial: Kyu 10.',
          noRecord: 'No record', allNinjas: 'All ninjas',
          pending: (n) => `Entries waiting to be sent: ${n}`,
          classic: 'Arcade · Legend boards',
        },
        // Monthly Tournament rewards: permanent title (top 3) and Champion colors (1st)
        ttl: {
          champ: 'Monthly Champion', finalist: 'Finalist',
          reward: 'From the October 2026 tournament on, each month’s top 3 earn a permanent title. The champion also wins exclusive Champion colors for the ninja they used. Titles need at least 5 players that month.',
          hall: 'From October 2026: top 3 each month earn a permanent title (min. 5 players) · the champion wins Champion colors',
          local: 'Your tournament scores are kept on this device.',
          colors: 'Champion colors',
          how: 'Win a Monthly Tournament with this ninja',
          unlocked: (name) => `Monthly Champion! ${name}’s Champion colors unlocked`,
          newTitle: (t) => `New title: ${t}`,
        },
      },
      train: {
        title: 'Training', tutTitle: 'Tutorial',
        dummy: 'Dummy',
        beh: { idle: 'Idle', guard: 'Guard', attack: 'Attack', counter: 'Counter' },
        infHp: 'Infinite HP', fullKi: 'Full ki',
        reset: 'Reset position',
        hide: 'Hide', show: 'Panel',
        moves: 'Move list',
        lessons: 'Lessons',
        lessonOf: (i, n) => `Lesson ${i}/${n}`,
        done: 'Tutorial complete! Set up the dummy however you like and practice freely.',
        progress: (a, b) => `${a}/${b}`,
        keysHelp: '<kbd>1</kbd>–<kbd>4</kbd> dummy · <kbd>⌫</kbd> reset · <kbd>H</kbd> panel',
        specialFallback: { kanji: '影斬り', name: 'Shadow Cut', desc: 'A lightning-fast slash that cuts clean through the opponent.', tip: '' },
        kiFull: 'full ki',
        counterTip: 'How to answer it',
      },
      moves: [
        ['<kbd>A</kbd><kbd>D</kbd>', 'Walk', 'double-tap: dash'],
        ['<kbd>W</kbd>', 'Jump', ''],
        ['<kbd>F</kbd><kbd>F</kbd><kbd>F</kbd>', 'Light ×3 combo', 'third hit pushes back'],
        ['<kbd>G</kbd>', 'Heavy slash', 'knocks down'],
        ['<kbd>R</kbd>', 'Kick', 'pressures guard, fills posture'],
        ['<kbd>T</kbd>', 'Shuriken', ''],
        ['<kbd>Shift</kbd>', 'Dash', 'left Shift'],
        ['<kbd>Shift</kbd>›<kbd>F</kbd>', 'Dash slash', ''],
        ['<kbd>W</kbd>›<kbd>F</kbd>', 'Air slash', ''],
        ['<kbd>W</kbd>›<kbd>G</kbd>', 'Dive', 'heavy in the air'],
        ['<kbd>S</kbd>', 'Guard', 'hold'],
        ['<kbd>S</kbd>!', 'Parry', 'press just before the blow lands'],
        ['<kbd>F</kbd>', 'Straight counter', 'after guard/parry'],
        ['Fwd+<kbd>F</kbd>', 'Sweep', 'counter · at the legs'],
        ['Back+<kbd>F</kbd>', 'Cross-up', 'counter · slip past them'],
        ['<kbd>G</kbd>', 'Heavy counter', 'counter · knocks down'],
        ['Rally', 'Rally', 'block the counter, counter again; your 3rd counter is a finisher'],
        ['<kbd>F</kbd>/<kbd>G</kbd>!!', 'Blade lock', 'mash during the lock to push them back'],
      ],
      touch: {
        btn: { light: 'ATTACK', heavy: 'HEAVY', kick: 'KICK', guard: 'GUARD', dodge: 'DASH', throw: 'SHUR.', special: 'KI', up: 'JUMP', down: 'GUARD', stick: 'Joystick' },
        lock: 'Mash ATTACK!',
        replaySkip: 'tap to skip',
        rotateTitle: 'Turn your screen sideways',
        rotateText: 'Shadow Duel is played in landscape. You can still use the menus in portrait.',
        rotMenu: 'Main menu',
        need2p: 'Needs keyboard / gamepad',
        need2pToast: 'Connect a keyboard or gamepad for two players',
        hints: 'Hints',
        pause: 'Pause',
        sel: { who1: 'You · tap your ninja', who2: 'Opponent (CPU) · tap to pick', who2train: 'Dummy · tap to pick' },
        opt: {
          title: 'Touch controls',
          layout: 'Layout', simple: 'Simple', full: 'Full',
          size: 'Size', sizes: { s: 'Small', m: 'Medium', l: 'Large' },
          hand: 'Buttons', right: 'Right', left: 'Left',
          assist: 'Easy assist', haptic: 'Vibration',
          fullscreen: 'Fullscreen', exitFullscreen: 'Exit fullscreen',
          note: 'Simple: 5 big buttons. Full: adds kick and shuriken. Easy assist: hold ATTACK and the combo keeps going, a quick tap on GUARD lasts long enough to parry, and the stick won’t jump by accident. It only makes touching easier; rules and scores are the same for everyone.',
          fullNote: 'KICK and SHURIKEN buttons are in the Full layout (Settings → Controls).',
        },
        help: '<div class="th-grid">' +
          '<div><h3>Joystick</h3><dl>' +
          '<dt><i class="tb">◀ ▶</i></dt><dd>Put your thumb on the free half and slide: walk</dd>' +
          '<dt><i class="tb">▲</i></dt><dd>Push up: jump</dd>' +
          '<dt><i class="tb tb-guard">▼</i></dt><dd>Pull down: guard</dd>' +
          '<dt><i class="tb">▶▶</i></dt><dd>Flick sideways twice: dash</dd>' +
          '</dl></div>' +
          '<div><h3>Buttons</h3><dl>' +
          '<dt><i class="tb tb-light">ATTACK</i></dt><dd>Slash. Tap again and again: combo. Hold forward or back while tapping: other techniques</dd>' +
          '<dt><i class="tb">HEAVY</i></dt><dd>Heavy slash. Forward + HEAVY launches the opponent</dd>' +
          '<dt><i class="tb tb-guard">GUARD</i></dt><dd>Hold: guard. Tap just before a hit: parry</dd>' +
          '<dt><i class="tb">DASH</i></dt><dd>Dash (the way the stick points, else backwards)</dd>' +
          '<dt><i class="tb ki">KI</i></dt><dd>Ki technique: the button glows when ki is full</dd>' +
          '<dt><i class="tb">KICK</i> <i class="tb">SHUR.</i></dt><dd>Full layout: kick and shuriken</dd>' +
          '</dl></div></div>',
        note: 'You can press several buttons at once: hold guard and attack, or slide your thumb from <i class="tb tb-guard">GUARD</i> to <i class="tb tb-light">ATTACK</i>. <b>II</b> at the top of the screen pauses; layout, size and left-handed options are in <b>Settings</b>. Use a keyboard or gamepad and the controls switch to it automatically.',
        keysHelp: '',
      },
      movesTouch: [
        ['<i class="tb">◀ ▶</i>', 'Walk', 'joystick · flick twice: dash'],
        ['<i class="tb">▲</i>', 'Jump', 'push the stick up'],
        ['<i class="tb tb-light">ATTACK</i>×3', 'Triple combo', 'tap again and again; third hit pushes back'],
        ['<i class="tb">HEAVY</i>', 'Heavy slash', 'knocks down'],
        ['<i class="tb">KICK</i>', 'Kick', 'pressures guard, fills posture · Full layout'],
        ['<i class="tb">SHUR.</i>', 'Shuriken', 'Full layout'],
        ['<i class="tb">DASH</i>', 'Dash', ''],
        ['<i class="tb">DASH</i>›<i class="tb tb-light">ATTACK</i>', 'Dash slash', ''],
        ['<i class="tb">▲</i>›<i class="tb tb-light">ATTACK</i>', 'Air slash', ''],
        ['<i class="tb">▲</i>›<i class="tb">HEAVY</i>', 'Dive', 'heavy in the air'],
        ['<i class="tb tb-guard">GUARD</i>', 'Guard', 'hold, or pull the stick down'],
        ['<i class="tb tb-guard">GUARD</i>!', 'Parry', 'tap just before the blow lands'],
        ['<i class="tb tb-light">ATTACK</i>', 'Straight counter', 'after guard/parry'],
        ['Fwd+<i class="tb tb-light">ATTACK</i>', 'Sweep', 'counter · at the legs'],
        ['Back+<i class="tb tb-light">ATTACK</i>', 'Cross-up', 'counter · slip past them'],
        ['<i class="tb">HEAVY</i>', 'Heavy counter', 'counter · knocks down'],
        ['Rally', 'Rally', 'block the counter, counter again; your 3rd counter is a finisher'],
        ['<i class="tb tb-light">ATTACK</i>!!', 'Blade lock', 'mash ATTACK during the lock to push them back'],
      ],
      moveSpecialTouch: '<i class="tb ki">KI</i>',
      moveTags: {
        normal: 'Normal', command: 'Command', string: 'String', launcher: 'Launcher', juggle: 'Juggle', air: 'Air', dash: 'Dash',
        strike: 'Strike', counter: 'Counter', catch: 'Catch', feint: 'Feint', guardCrush: 'Guard crush', knockdown: 'Knockdown',
        kiCancel: 'Ki cancel', special: 'Ki technique', throw: 'Projectile',
      },
      lessonsTouch: {
        walk: 'Slide your thumb on the free half of the screen: push the joystick left and right to walk.',
        combo: 'Tap <i class="tb tb-light">ATTACK</i> three times in a row: chain three slashes and hit the dummy.',
        heavy: 'Land a heavy slash with <i class="tb">HEAVY</i>. It’s slow, but it knocks down.',
        gbreak: 'The dummy is guarding. Hit it with <i class="tb">HEAVY</i> to fill its posture bar and break its guard (<i class="tb">KICK</i> in the Full layout fills it even faster).',
        block: 'The dummy is attacking. Hold <i class="tb tb-guard">GUARD</i> (or pull the stick down) and block a slash.',
        parry: 'Tap <i class="tb tb-guard">GUARD</i> just before the blow lands. The moment the blue ring shrinks is the perfect time.',
        counter: 'Right after a guard or parry, <i class="tb tb-light">ATTACK</i>: counter-slash. Also try stick forward/back + <i class="tb tb-light">ATTACK</i> or <i class="tb">HEAVY</i>.',
        special: 'Your ki bar is full. Use {sp} with the glowing <i class="tb ki">KI</i> button.',
      },
      lessons: [
        { id: 'walk', t: 'Walk', d: 'Walk back and forth with <kbd>A</kbd> / <kbd>D</kbd>.' },
        { id: 'combo', t: 'Triple combo', d: 'Chain three light slashes with <kbd>F</kbd> <kbd>F</kbd> <kbd>F</kbd> and hit the dummy.' },
        { id: 'heavy', t: 'Heavy slash', d: 'Land a heavy slash with <kbd>G</kbd>. It’s slow, but it knocks down.' },
        { id: 'gbreak', t: 'Break the guard', d: 'The dummy is guarding. Kick with <kbd>R</kbd> to fill its posture bar and break its guard.' },
        { id: 'block', t: 'Guard', d: 'The dummy is attacking. Hold <kbd>S</kbd> to block a slash.' },
        { id: 'parry', t: 'Parry', d: 'Press <kbd>S</kbd> just before the blow lands. The moment the blue ring shrinks is the perfect time.' },
        { id: 'counter', t: 'Counter', d: 'Right after a guard or parry, <kbd>F</kbd>: counter-slash. Also try forward/back + <kbd>F</kbd> or <kbd>G</kbd>.' },
        { id: 'rally', t: 'Rally', d: 'The dummy counters too. Attack it, block its counter and counter again: reach 2× with two of your own replies.' },
        { id: 'special', t: 'Ki technique', d: 'Your ki bar is full. Use {sp} with <kbd>E</kbd>.' },
      ],
    });

    // ================================================================ story, fighters, arenas, specials
    // ---- Fragment B: story text (talk, pairs, endings, roster2 notes), characters, arenas, specials, pop-ups, AI levels, number words
    merge(EN.STR, {
      // open = speaks first (opponent), reply = answers (player), boss = said to the final boss
      talk: {
        akane: {
          open: ['My blade is crimson, my intent is pure. Face me with honour.', 'I bow first, then I strike. That is only fair.', 'This duel is for our honour. There is no retreat.'],
          reply: ['An honourable foe… You’ve earned my blade.', 'Sharp words. Let’s see if your steel is as sharp.', 'When the crimson blade speaks, words fall silent.'],
          boss: 'My masters died on your blade, Shura. Today that debt is paid.',
        },
        aoi: {
          open: ['The wind is never in a hurry. Neither am I.', 'Listen to your breath. The last sound you hear will be the wind.', 'Bamboo bends but never breaks. Which are you?'],
          reply: ['Calm yourself. Anger makes a blade heavy.', 'You can’t catch the wind. You can only feel it.', 'Very well. We begin when the leaf touches the ground.'],
          boss: 'Even the eye of the storm is silent. Inside you there is only noise, Shura.',
        },
        kuro: {
          open: ['The mountain does not move. You will.', 'No talk. Raise your sword.', 'You’re small. This will be quick.'],
          reply: ['Hmph. Come, then.', 'You talk too much.', 'My nodachi is long. My patience is short.'],
          boss: 'Shura. I waited long. No more talk.',
        },
        yuki: {
          open: ['Snow falls in silence. So do my strikes.', 'A fox doesn’t fall into traps. It sets them.', 'Cold? Soon you won’t feel a thing.'],
          reply: ['You’re hot-blooded. It slows you down.', 'So loud… Even the snow is embarrassed for you.', 'Don’t blink. You’ll miss it.'],
          boss: 'Everyone fears you, Shura. I just feel a little chilly.',
        },
        hana: {
          open: ['Shall we dance? But I lead!', 'We’ll be done before the cherry blossoms land, promise!', 'Two tantō, one smile. Which scares you more?'],
          reply: ['Aww, so serious! Smile a little, you’ll fall prettier.', 'Catch me if you can!', 'Okay, okay! But no crying afterwards.'],
          boss: 'Don’t you ever laugh, Shura? Come on, let’s make it our last dance!',
        },
        tetsu: {
          open: ['Duty brought me here. Step aside or fall.', 'My armour has seen a hundred battles. You are the hundred and first.', 'Discipline comes before courage. Allow me to show you.'],
          reply: ['Disrespect. I will correct it.', 'Your words cannot pierce my armour.', 'Be ready. My naginata gives no warning.'],
          boss: 'You burned my lord’s castle, Shura. Today I complete my duty.',
        },
        ren: {
          open: ['Hah! Finally, some fun! Are your bones sturdy?', 'Did the mask scare you? You don’t wanna see my real face!', 'Heads or guards? I break both!'],
          reply: ['All talk, no fight! Come on!', 'Heh, I like you. Still gonna thrash you, though.', 'Ever seen my kick? You’re about to!'],
          boss: 'So you’re the real oni, huh? Let’s see whose horns are tougher!',
        },
        kage: {
          open: ['You think you see me. You see only my shadow.', 'The brighter the light, the deeper the shadow.', 'Your name has been written. I am only reading it.'],
          reply: ['Do not speak. The shadows are listening.', 'Don’t look behind you. I’m already there.', 'You are too loud. Silence strikes faster.'],
          boss: 'Shadows serve no master, Shura. They will swallow you too.',
        },
        shura: {
          open: ['You broke seven blades. The eighth is mine, and it will break you.', 'Your spirit called to me. Good that you climbed this far; your fall will be all the grander.', 'I am the end of the road. Kneel.'],
          reply: ['Weakness. I can smell it from here.', 'You are only a stepping stone.', 'Kneel, or fall.'],
          boss: 'The demon in the mirror… One of us is one too many.',
        },
        tora: {
          open: ['I’ve lost count of those who dangled from my chain. You’ll be one more.', 'The hunt is on. Run if you like, but my chain is long.', 'They say a tiger waits in ambush. Not this one!'],
          reply: ['Grrr… Good. I like prey that doesn’t run.', 'No need to come closer. I’ll reel you in.', 'Your words are long. My chain is longer.'],
          boss: 'You’re just prey too, Shura. Only a little bigger.',
        },
        jin: {
          open: ['I did not come to draw blood. I will only lay you down for a while.', 'The staff speaks with patience. Listen.', 'Your path is full of anger, young warrior. Let us lighten your load.'],
          reply: ['Very well. But afterwards, we share tea.', 'Your anger weighs on you. Let me carry it.', 'A sword cuts; a staff awakens.'],
          boss: 'Shura, I need not destroy you to defeat the demon within. Stopping you is enough.',
        },
        mai: {
          open: ['The stage is set, the curtain is up. Your role: the one who loses.', 'When my fan opens, don’t close your eyes. You’ll miss the show.', 'Every step I take is a note. Can you keep the tempo?'],
          reply: ['What a crude entrance. No matter, I have grace enough for us both.', 'The wind blows my way, darling.', 'I don’t need applause. Your fall is enough.'],
          boss: 'Shura, in this last dance I share the stage with no one.',
        },
        tsubame: {
          open: ['The distance between us is my weapon.', 'A swallow misses once. The second time, it turns and strikes.', 'I’ve measured the wind. My arrow knows its path.'],
          reply: ['You want to get close? Try.', 'Hold your breath. An arrow in flight makes no sound.', 'My eye is on you. So is my arrow.'],
          boss: 'Shura, there’s nowhere to hide in the sky. My arrow will find you.',
        },
      },
      // Special match-ups: lines are spoken in the order written
      pairs: {
        'akane|aoi': [['akane', 'Aoi! Time to finish the duel we left unfinished.'], ['aoi', 'The wind always blows toward the same fire, Akane. Begin.']],
        'kuro|tetsu': [['kuro', 'Iron shell. Let’s see if it’s hollow.'], ['tetsu', 'Even a mountain bows to discipline, Kuro.']],
        'hana|yuki': [['yuki', 'Flowers wither in the snow, Hana.'], ['hana', 'Then I’ll just melt the snow, Yuki!']],
        'kage|ren': [['ren', 'Shadow tricks don’t work on me! Show yourself!'], ['kage', 'I am right here, oni. You just don’t know how to look.']],
        'akane|ren': [['akane', 'Only the dishonourable hide behind a mask.'], ['ren', 'Honour? Honour doesn’t fill my belly!']],
        'aoi|yuki': [['aoi', 'A cold wind is still wind, Yuki.'], ['yuki', 'But snow remains when the wind dies down.']],
        'kuro|tora': [['tora', 'A mountain, huh? Tigers live in the mountains too.'], ['kuro', 'Tigers die in the mountains.']],
        'tora|yuki': [['tora', 'A fox! What does a fox do in front of a tiger?'], ['yuki', 'Runs. Then freezes the tiger’s tail.']],
        'jin|tora': [['tora', 'What’ll you do when my chain wraps round your staff, monk?'], ['jin', 'Untie it. Loosening knots is my calling.']],
        'jin|ren': [['ren', 'A monk? Start praying, baldy!'], ['jin', 'I already am, oni. For you. The fire inside you burns you too.']],
        'jin|tetsu': [['tetsu', 'What business has a monk on the battlefield?'], ['jin', 'I came for armoured hearts like yours, Tetsu. Your armour is heavy; your heart, heavier.']],
        'akane|jin': [['akane', 'Stand aside, monk. This vengeance is mine.'], ['jin', 'Vengeance is a chain, Akane. Let us break it first.']],
        'hana|mai': [['hana', 'Ooh, another dancer! Let’s see who spins faster!'], ['mai', 'Speed is only grace’s shadow, Hana. Let me show you the light.']],
        'kage|mai': [['mai', 'Do shadows dance too, Kage?'], ['kage', 'Only when the light goes out.']],
        'aoi|tsubame': [['tsubame', 'Can your wind turn my arrow aside, Aoi?'], ['aoi', 'The wind sides with no one, Tsubame. Not even your arrow.']],
        'kage|tsubame': [['kage', 'You cannot hit what you cannot see, archer.'], ['tsubame', 'Shadows come with the light. So do I.']],
        'mai|tsubame': [['mai', 'Staring from afar is rude, archer. Come and watch up close.'], ['tsubame', 'I’ll send my arrow for a closer look at your stage.']],
      },
      endings: {
        akane: ['When Shura’s sword struck the earth, the temple bells rang on their own.', 'Akane wiped the crimson blade clean and bowed at the masters’ grave: the debt was paid.', 'The path ahead is no longer vengeance, but teaching honour to new apprentices.'],
        aoi: ['As Shura fell, the storm fell silent; for the first time in years, the clouds parted.', 'Aoi sheathed the blade and returned to the bamboo forest.', 'All that remained was a whistling wind.'],
        kuro: ['Kuro buried Shura’s broken mask on the mountain’s peak.', 'Not a word was spoken. Kuro lowered the straw hat and vanished into the snow.', 'Villagers say not a single bandit came down the mountain that winter.'],
        yuki: ['Shura’s last breath turned to mist in the cold air and was gone.', 'Yuki straightened the scarf and walked away, leaving no tracks in the snow.', 'Since that day, only the shadow of a fox has been seen on the peak.'],
        hana: ['When Shura’s mask hit the ground, Hana left a cherry branch beside it.', 'That night the market filled with lanterns; the loudest cheers went to a kunoichi dancing on the rooftops.', 'No one knows where Hana went. Only drifting pink petals remain.'],
        tetsu: ['On the castle roof, Tetsu broke Shura’s sword in two across one knee.', 'The lord’s banner was raised once more, and the wind flew it proudly.', 'Duty fulfilled. But a samurai’s duty never ends.'],
        ren: ['Ren hung Shura’s broken mask beside the other oni mask. Two oni, one winner.', 'The village sang that night; the loudest laugh, as always, was Ren’s.', 'By morning, Ren was already on the road. Off to the next brawl.'],
        kage: ['When Shura fell, Kage’s shadow quietly settled over the fallen demon.', 'No trace, no sound; only one extra shadow stretching out in the moonlight.', 'Perhaps it was always there. Perhaps it never existed at all.'],
        shura: ['On the castle roof, only one remained standing: the one who wore the same mask, only darker.', 'Shura no longer seeks rivals. Rivals seek Shura.'],
        def: ['The last master has fallen. The way of shadows is yours now.', 'Sheayour blade; the legend begins now.'],
        tora: ['The rattle of a chain announced Shura’s fall.', 'Tora hung the broken mask from the chain: a new hunting trophy.', 'From that day on, no one in the forest took the tiger’s roar for a fairy tale.'],
        jin: ['Jin knelt beside the fallen Shura and prayed.', 'On the road back to the temple, not a single drop of blood marked the staff.', 'That night the mountain bells rang again; this time not in mourning, but for peace.'],
        mai: ['As Shura fell, Mai snapped the fan shut and bowed.', 'The night market still talks about that dance.', 'The curtain fell. But Mai never left the stage.'],
        tsubame: ['The last arrow quivered silently in the castle roof.', 'Tsubame shouldered the bow and watched the swallows fly south.', 'Never seen again; all that remained were bright-fletched arrows lodged in their targets.'],
      },
      roster2: {
        notes: {
          tora: ['Light: chain whip at mid range, sickle up close', 'Heavy: throws the chain; on a hit it pulls the opponent in', 'Combo ender: if the opponent is far, the chain drags them closer'],
          jin: ['Both ends of the staff strike; the blows are blunt and never draw blood', 'The third hit and the heavy sweep knock down', 'Posture builds more slowly while holding guard'],
          mai: ['Wider parry window', 'While guarding, the fans send projectiles back', 'Heavy: a wind wave pushes the opponent and scatters projectiles'],
          tsubame: ['Heavy: fires an arrow from the bow; hold for a charged shot', 'Throw: back-flips and looses an arrow from the air', 'Out of arrows, the heavy attack uses the tantō; arrows refill over time'],
        },
      },
    });

    merge(EN.CHARS, {
      akane: { title: 'Crimson Blade', desc: 'Balanced katana master. Fast three-hit combo, strong parry.', weapon: 'Katana' },
      aoi: { title: 'Blue Wind', desc: 'Agile katana master. Walks a little faster and dashes like the wind.', weapon: 'Katana' },
      kuro: { title: 'Black Mountain', desc: 'Wields a long nodachi. Slow, but with wide reach and devastating blows.', weapon: 'Nodachi' },
      yuki: { title: 'Snow Fox', desc: 'Strikes very fast with a short kodachi. Plenty of shuriken, long scarf.', weapon: 'Kodachi' },
      hana: { title: 'Cherry Dance', desc: 'Kunoichi. Fights with two tantō as if dancing; fastest hands, shortest reach.', weapon: 'Twin Tantō' },
      tetsu: { title: 'Iron Fortress', desc: 'Armoured samurai. The naginata gives the longest reach; hits barely make a dent.', weapon: 'Naginata' },
      ren: { title: 'Crimson Oni', desc: 'Oni-masked brawler. Terrifies with guard-breaking blows and devastating kicks.', weapon: 'Uchigatana' },
      kage: { title: 'The Shadow Itself', desc: 'Hooded shadow. Fast with the ninjatō, long dash; leaves a shadow wherever it passes.', weapon: 'Ninjatō' },
      tora: { title: 'Chained Tiger', desc: 'Kusarigama master. Lashes the weighted chain from mid range; the heavy attack reels the opponent in for the sickle.', weapon: 'Kusarigama' },
      jin: { title: 'Iron Staff Monk', desc: 'Bō-wielding monk. A long staff that strikes with both ends, a solid guard and blunt knockdown blows; never draws blood, just rattles bones.', weapon: 'Bō' },
      mai: { title: 'Fan Dancer', desc: 'War-fan kunoichi. Very fast, with a wide parry window; the fans send projectiles back and their wind pushes opponents away.', weapon: 'Twin Tessen' },
      tsubame: { title: 'Swallow Archer', desc: 'Carries a bow and a tantō. Shoots arrows from range (hold heavy for a power shot) and back-flips away from anyone who closes in, firing from the air.', weapon: 'Yumi + Tantō' },
      shura: { title: 'The Crimson Master', desc: 'A demon master whose path is traced in crimson. Long nodachi, crushing blows, near-flawless parries.', weapon: 'Nodachi' },
    });

    merge(EN.ARENAS, {
      temple: 'Moonlit Temple',
      rain: 'Stormy Bamboo Forest',
      snow: 'Snowy Peak',
      village: 'Burning Village',
      market: 'Night Market',
      waterfall: 'Waterfall',
      castle: 'Castle Rooftop',
    });

    merge(EN.SPECIALS, {
      akane: { desc: 'A crimson iai slash that passes through the opponent in the blink of an eye, leaving a blazing crescent in the air.', tip: 'Parry, or dash aside' },
      aoi: { desc: 'A wide swing that sends a blade of wind flying forward; a perfectly timed guard reflects it.', tip: 'Jump, cut it with your blade, or guard at the perfect moment' },
      kuro: { desc: 'Leaps up and splits the ground with the nodachi; the shockwave racing along the floor crushes guards and knocks down.', tip: 'Jump over the wave and strike while airborne' },
      yuki: { desc: 'A lightning-fast five-hit flurry, like a blizzard; the last hit knocks down.', tip: 'Guard, and parry the first hit' },
      hana: { desc: 'Spins forward as a whirlwind of cherry blossoms with the twin tantō, cutting on both sides.', tip: 'Guard, or dash back' },
      tetsu: { desc: 'Spins the naginata all around; hits can’t stop the spin (super armour).', tip: 'Get out of range, or parry' },
      ren: { desc: 'A shoulder charge that shatters guards, followed by a rising slash that launches the opponent.', tip: 'Guarding won’t help: parry, jump or dash' },
      kage: { desc: 'Vanishes in smoke, leaves a shadow clone behind and reappears behind the opponent to strike.', tip: 'Guard the moment Kage reappears' },
      tora: { desc: 'Whirls the chain overhead into a cyclone that mows down everything nearby; a caught opponent is reeled in and flung skyward by the sickle.', tip: 'Get out of range or guard: if you’re not caught, the pull comes up empty' },
      jin: { desc: 'Advances spinning the staff like a diamond wheel; after four blows, a rising strike launches the opponent.', tip: 'Dash back, or parry the first blow' },
      mai: { desc: 'Spins up a whirlwind that drifts forward, pulling the opponent in, cutting, and finally flinging them skyward.', tip: 'Guard the whirlwind at the perfect moment or back off: it moves slowly' },
      tsubame: { desc: 'Leaps back and rains arrows from the sky; on a miss, looses a swallow arrow that turns and strikes from behind.', tip: 'Move off the marks on the ground; the swallow arrow comes back, so watch your back' },
      shura: { desc: 'Roars and melts into crimson smoke, appearing in front of and behind the opponent to bring down three heavy nodachi slashes; the last one launches.', tip: 'Watch for the crimson glint: parrying a slash ends the technique; guarding crushes your posture' },
    });

    merge(EN.TXT, {
      gbreak: 'POSTURE BROKEN!', cut: 'CUT!', reflect: 'REFLECTED!', parry: 'PARRY!', caught: 'CAUGHT!',
      swallowHit: '燕!', vajraHit: '金剛!', whirlHit: '旋風の舞',
    });

    merge(EN.AI_LEVELS, { 0: 'Apprentice', 1: 'Master', 2: 'Legend', 3: 'Shura' });

    EN.NUMWORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

    // ================================================================ static HTML, hardcoded literals, canvas pop-ups
    merge(EN.PHRASES, {
      // ---------------------------------------------------------------- index.html: <title>, brand, HUD
      'Gölge Düellosu': 'Shadow Duel',
      'Duraklat': 'Pause',
      'KARŞILIKLI SERİ': 'RALLY',
      'SON DARBE': 'FINAL BLOW',
      'atlamak için bir tuşa bas': 'press any key to skip',
      // touch buttons (static fallbacks of data-s="touch.btn.*")
      'GARD': 'GUARD',
      'HAFİF': 'LIGHT',
      'SALDIR': 'ATTACK',
      'AĞIR': 'HEAVY',
      'ATIL': 'DASH',
      'TEKME': 'KICK',
      // ---------------------------------------------------------------- main menu
      'Sekiz savaşçı, üç arena. Gerçek zamanlı kılıç çarpışması, kılıç kilitlenmesi, savuşturma, denge kırma, Gölge Kesiği ve ragdoll fiziği.': 'Eight fighters, three arenas. Real-time sword clashes, blade locks, parries, posture breaks, the Shadow Cut and ragdoll physics.',
      'İki Oyuncu': 'Two Players',
      'Aynı klavyede ya da iki gamepad ile kafa kafaya': 'Head to head on one keyboard or two gamepads',
      'CPU\'ya Karşı': 'Vs CPU',
      'Ninjanı seç, rakibini yapay zekâ yönetsin': 'Pick your ninja and let the AI run your rival',
      'Zorluk': 'Difficulty',
      'Çırak': 'Apprentice',
      'Usta': 'Master',
      'Efsane': 'Legend',
      'Aylık Turnuva': 'Monthly Tournament',
      'Dan Sınavı': 'Dan Trial',
      'Şampiyonlar Salonu': 'Hall of Champions',
      'Seyret': 'Watch',
      'Rastgele iki ninja, Efsane yapay zekâ': 'Two random ninjas, Legend AI',
      'Ses': 'Sound',
      'Müzik': 'Music',
      'Kan efekti': 'Blood',
      'Tuş ipuçları': 'Key hints',
      'Yüksek grafik': 'High graphics',
      // ---------------------------------------------------------------- controls card
      'Kontroller': 'Controls',
      '1. Oyuncu': 'Player 1',
      '2. Oyuncu': 'Player 2',
      'Yürü': 'Walk',
      'Zıpla': 'Jump',
      'Gard (basılı tut)': 'Guard (hold)',
      'Hafif kesik (×3 kombo)': 'Light slash (×3 combo)',
      'Ağır kesik': 'Heavy slash',
      'Tekme': 'Kick',
      'Sol Shift': 'Left Shift',
      'Sağ Shift': 'Right Shift',
      'Atılma': 'Dash',
      'Ki tekniği (ki dolu)': 'Ki technique (full ki)',
      // ---------------------------------------------------------------- select screen
      'Ninjanı seç': 'Choose your ninja',
      'Hazır': 'Ready',
      '1. oyuncunun ninjası': 'Player 1’s ninja',
      '2. oyuncunun ninjası': 'Player 2’s ninja',
      'Önceki ninja': 'Previous ninja',
      'Sonraki ninja': 'Next ninja',
      '1. oyuncu kadrosu': 'Player 1 roster',
      '2. oyuncu kadrosu': 'Player 2 roster',
      'Dövüşe başla': 'Start fight',
      'Geri': 'Back',
      'Kilitli': 'Locked',
      'Rastgele': 'Random',
      'Hız': 'Speed',
      'Güç': 'Power',
      'Menzil': 'Reach',
      'Can': 'Health',
      // ---------------------------------------------------------------- pause / end
      'Duraklatıldı': 'Paused',
      'Devam et': 'Resume',
      'Maçı yeniden başlat': 'Restart match',
      'Ana menü': 'Main menu',
      'Rövanş': 'Rematch',
      'Karakter değiştir': 'Change fighter',
      'Zafer senin': 'Victory is yours',
      'Raund': 'Rounds',
      'Verilen hasar': 'Damage dealt',
      'Savuşturma': 'Parries',
      'Ki Saldırısı': 'Ki attacks',
      // ---------------------------------------------------------------- training / leaderboard / misc
      'Antrenman': 'Training',
      'ANTRENMAN': 'TRAINING',
      'Sıralama': 'Leaderboard',
      'Tümü': 'All',
      'Ekranı yan çevir': 'Turn your screen sideways',
      'Performans için grafik düşürüldü': 'Graphics lowered for performance',
      // hidden boss pushed into ND.CHARS by arcade.js (safety net; EN.CHARS.shura should carry the same)
      'Kanlı Usta': 'The Blood Master',
      'Yolunu kanla çizen iblis usta. Uzun nodachi, yıkıcı darbeler, neredeyse kusursuz savuşturma.': 'A demon master who carves his path in blood. Long nodachi, crushing blows, near-flawless parries.',
      // ---------------------------------------------------------------- HUD tags (fallbacks when STR.hud is missing)
      'SEN': 'YOU',
      'KUKLA': 'DUMMY',
      // ---------------------------------------------------------------- round banners (#bt / #bs)
      'Son raund': 'Final round',
      'Kazanan her şeyi alır': 'Winner takes all',
      'İlk iki raundu alan kazanır': 'First to two rounds wins',
      'Dövüş!': 'Fight!',
      'Süre doldu': 'Time up',
      'Berabere': 'Draw',
      'Çifte K.O.': 'Double K.O.',
      'Mükemmel': 'Perfect',
      // blade-lock hint (fallbacks of STR.hud.lockSolo / lockDuo)
      'F / K tuşuna hızlıca bas!': 'Mash F / K!',
      'Hafif ya da ağır tuşuna hızlıca bas!': 'Mash light or heavy!',
      // counter / parry prompt labels under the key ring (ctx.fillText in drawPrompts)
      'KARŞILIK': 'COUNTER',
      'SAVUŞTUR': 'PARRY',
      // ---------------------------------------------------------------- canvas pop-ups (fx.text)
      'SON VURUŞ!': 'FINISHER!',
      'KİLİTLENDİ!': 'BLADE LOCK!',
      'İTTİ!': 'SHOVE!',
      'DENGE KIRILDI!': 'POSTURE BROKEN!',
      'GARD KIRILDI!': 'GUARD BROKEN!',
      'KESİLDİ!': 'SLICED!',
      'YANSITMA!': 'REFLECT!',
      'SAVUŞTURMA!': 'PARRY!',
      'YAKALANDI!': 'CAUGHT!',
      'ZIRH!': 'ARMOR!',
      'ARKADAN!': 'BACKSTAB!',
      'DUVAR!': 'WALL!',
      'KAFA!': 'HEADSHOT!',
      'KARŞI!': 'COUNTER HIT!',
      'KRİTİK!': 'CRITICAL!',
      'SÜPÜRME!': 'SWEEP!',
      'KARŞILIK!': 'COUNTER!',
      'YERE SERİLDİ': 'KNOCKDOWN',
      'ÇARPIŞMA!': 'CLASH!',
    });

    merge(EN.HTML, {
      // brand title
      'Gölge<br><em>Düel</em><em>losu</em>': 'Shadow<br><em>Du</em><em>el</em>',
      // tips list (<ul class="tips">)
      '<b>Savuşturma:</b> darbe gelmeden hemen önce gard tuşuna bas; rakip sendeler.':
        '<b>Parry:</b> press guard just before the blow lands; your opponent staggers.',
      '<b>Karşılık (返し技):</b> gard ya da savuşturmanın hemen ardından saldırı tuşu → anında karşı kesik. <b>İleri</b> + hafif = bacağa süpürme, <b>geri</b> + hafif = yanından dönüp arkadan kesme, <b>ağır</b> = güçlü karşı darbe.':
        '<b>Counter (返し技):</b> attack right after a guard or parry → instant counter slash. <b>Forward</b> + light = leg sweep, <b>back</b> + light = cross-up that slashes from behind, <b>heavy</b> = powerful counter strike.',
      '<b>Karşılıklı seri:</b> karşılık da karşılanabilir. Her turda vuruşlar hızlanır ve güçlenir; kendi 3. karşılığın üç vuruşluk sinematik bir bitirişe dönüşür. Seriyi kıran darbe ağır çekimde iner.':
        '<b>Rally:</b> counters can be countered too. Every exchange gets faster and harder; your 3rd counter turns into a three-hit cinematic finisher. The blow that breaks the rally lands in slow motion.',
      '<b>Kılıç kilidi:</b> kılıçlar çarpışınca kilitlenebilir. Hafif/ağır tuşuna hızlı basan rakibini iter.':
        '<b>Blade lock:</b> clashing blades can lock. Whoever mashes light/heavy faster shoves the other away.',
      '<b>Ki barı</b> vurdukça, yedikçe ve savuşturdukça dolar. Dolunca her ninjanın kendine özgü ki tekniği açılır (Antrenman’daki hareket listesinde görebilirsin).':
        'The <b>ki bar</b> fills as you hit, get hit and parry. When it is full, each ninja’s signature ki technique is ready (see the move list in Training).',
      '<b>Atılma + hafif</b> = atılarak kesik. <b>Havada</b> hafif = hava kesiği, ağır = dalış. Ağır kesik yere serer, duvara çarpan geri seker.':
        '<b>Dash + light</b> = dashing slash. <b>In the air</b> light = air slash, heavy = dive. Heavy slash knocks down; anyone slammed into a wall bounces back.',
      '<b>Denge çubuğu</b> dolarsa gard kırılır. Tekme gardı delip dengeyi hızla doldurur.':
        'When the <b>posture bar</b> fills, the guard breaks. Kicks go through guard and fill posture fast.',
      // gamepad note (Esc -> Start or P)
      'Gamepad: X hafif · Y ağır · B tekme · A zıpla · LB gard · RB shuriken · RT atılma · R3 ki tekniği. Start ya da <kbd>P</kbd> duraklatır. CPU modunda her iki tuş seti de seni yönetir.':
        'Gamepad: X light · Y heavy · B kick · A jump · LB guard · RB shuriken · RT dash · R3 ki technique. Start or <kbd>P</kbd> pauses. In CPU mode both key sets control you.',
      // select / VS hints (Esc -> ⌫)
      '<kbd>Enter</kbd> başlatır · <kbd>⌫</kbd> menüye döner': '<kbd>Enter</kbd> start · <kbd>⌫</kbd> back',
      '<kbd>Enter</kbd> / <kbd>F</kbd> başlatır · <kbd>⌫</kbd> çıkar': '<kbd>Enter</kbd> / <kbd>F</kbd> start · <kbd>⌫</kbd> quit',
    });

    EN.PATTERNS.push(
      // HUD round label (#rlabel) and round banner
      [/^RAUND (\d+)$/, 'ROUND $1'],
      [/^(\d+)\. Raund$/, 'Round $1'],
      // canvas pop-ups built from numbers
      [/^(\d+)\. KARŞILIK$/, 'COUNTER ×$1'],
      [/^(\d+) VURUŞLUK SERİ!$/, '$1-HIT RALLY!'],
      // time-up banner sub: `${name} önde`
      [/^(.+) önde$/, (m, n) => I.t(n) + ' leads'],
      // end screen title: `${Name} kazandı`
      [/^(.+) kazandı$/, (m, n) => I.t(n) + ' wins'],
      // end screen sub line: `${a} – ${b} · ${round} raund · ${arenaName}`
      [/^(\d+) – (\d+) · (\d+) raund · (.+)$/, (m, a, b, r, ar) => `${a} – ${b} · ${r} ${r === '1' ? 'round' : 'rounds'} · ${I.t(ar)}`],
    );

    // ================================================================ added with the portal build (PLAY, ads, coach)
    merge(EN.STR, {
      menu: { play: 'Play', playSub: (name, lv) => `${name} vs CPU · ${lv}` },
      first: { play: 'Play', sub: 'One tap and you’re fighting', menu: 'All modes' },
      ads: {
        cont: 'Continue from here', contSub: 'Watch an ad · retry with no penalty',
        trial: (name) => `Try ${name} for one fight`, trialSub: 'Watch an ad',
        fail: 'No ad right now, try again in a moment',
      },
      coach: {
        attack: (l) => `${l} Attack`,
        guard: (l, g) => `Hold ${g} to guard`,
        parry: (l, g) => `Tap ${g} just before a hit lands: parry`,
        attackT: (l) => `Tap ${l} · keep tapping: combo`,
        guardT: (l, g) => `Hold ${g} to guard`,
        parryT: (l, g) => `Tap ${g} just before a hit lands: parry`,
      },
    });

    // ================================================================ VOLUME: sliders on the menu card and in pause (js/volume.js)
    merge(EN.STR, {
      vol: {
        title: 'Volume', master: 'Master', music: 'Music', sfx: 'Effects', sound: 'Sound',
        pct: (n) => `${n}%`,
        muted: 'Sound is off. Move a slider to turn it back on.',
        // Settings > Audio: character / announcer voices switch (js/voice.js) and the courtesy credit under it
        voice: 'Voices',
        credit: 'Voices: ユーフルカ (youfulca.com) · 効果音ラボ · すぱらんど',
      },
    });

    // ================================================================ TOUCH LAYOUT EDITOR: movement modes + "Customize controls"
    // (js/touch.js settings rows, js/touch-editor.js; Turkish source in i18n.js, block "touch movement modes + layout editor")
    merge(EN.STR, {
      tedit: {
        move: 'Movement',
        moves: { float: 'Stick', fixed: 'Fixed stick', dpad: 'D-pad' },
        mnote: {
          float: 'The stick appears wherever your thumb lands.',
          fixed: 'The stick stays where you put it; push from its centre.',
          dpad: 'Separate buttons: hold to walk, double-tap to dash. Press between two buttons for both (▶ + ▲ = jump forward).',
          dtap: 'Separate buttons: a quick tap on ◀ ▶ takes one short step, hold to walk, double-tap to dash.',
        },
        dtap: 'Tap to step',
        edit: 'Customize controls',
        title: 'Customize controls',
        hint: 'Drag a button anywhere. Tap it for size, opacity or to hide it.',
        rotate: 'Turn your screen sideways to arrange the fight controls.',
        shapes: { phone: 'Phone', tablet: 'Tablet', portrait: 'Portrait' },
        screenNote: 'The layout is saved for this screen shape: phones and tablets each keep their own.',
        save: 'Save', cancel: 'Cancel', options: 'Options', done: 'Done', close: 'Close',
        size: 'Size', sizes: { s: 'S', m: 'M', l: 'L', xl: 'XL' },
        opacity: 'Opacity', opacityAll: 'Opacity (all)',
        hide: 'Hide', show: 'Show', hidden: 'Hidden',
        snap: 'Snap to grid',
        presets: 'Presets', pRight: 'Right hand', pLeft: 'Left hand', pSplit: 'Guard on left',
        reset: 'Reset to default', resetDone: 'Default layout is back (applies when you save).',
        overlap: 'Buttons can’t overlap: moved to the nearest free spot.',
        noRoom: 'No room there: the button went back.',
        saved: 'Controls saved',
        throwName: 'SHURIKEN',
        pauseName: 'Pause',
        dirs: { dl: '◀ Left', dr: 'Right ▶', du: '▲ Jump', dd: '▼ Guard' },
      },
    });

    // ================================================================ PROGRESSION: honor, rival challenges, moves panel
    // (arcade.js STR.honor / STR.rival / STR.hint, game.js select screen; rules in js/honor.js)
    merge(EN.STR, {
      menu: { arcadeDesc: 'Beat your rivals one by one as the difficulty climbs, with a hidden master waiting at the end. The richest source of honor.' },
      sel: {
        title: { rival: 'Rival Challenge · Choose your ninja' },
        go: { rival: 'Accept the duel' },
        moves: 'Moves',
        movesOf: (name) => `${name} · Moves`,
        close: 'Close',
      },
      hint: {
        honor: (have, need) => `Honor ${num(Math.min(have, need))}/${num(need)} → Rival Challenge opens`,
        ready: 'Ready to be challenged!',
        arenaHonor: (have, need) => `Opens at ${num(need)} honor (${num(Math.min(have, need))}/${num(need)})`,
      },
      honor: {
        name: 'Honor',
        head: 'Honor',
        rows: { win: 'Win', loss: 'Showing up', rounds: 'Rounds taken', perfect: 'Perfect round', rally: 'Counter rally', counter: 'Counter', parry: 'Parry', rivalWin: 'Rival Challenge', arcadeClear: 'Arcade cleared' },
        total: (n) => `Honor: ${num(n)}`,
        next: (name, left) => `Next ninja: ${name} — ${num(left)} honor to go`,
        bar: (have, need) => `Honor ${num(Math.min(have, need))}/${num(need)} → Rival Challenge opens`,
        ready: (name) => `${name} challenges you!`,
        readyGo: 'Accept',
        all: 'Every ninja unlocked',
        bonus: { arcadeClear: 'Arcade cleared', tourneyClear: 'Tournament conquered', danPass: 'Dan trial passed', rivalWin: 'Rival Challenge won', tutorial: 'Tutorial complete' },
        bonusToast: (n, what) => `+${num(n)} honor · ${what}`,
        road: 'Road of Honor',
        roadSub: 'You earn honor in every single-player mode. Reach a ninja’s mark and they challenge you to a duel; win it and they join you.',
        earnHead: 'Where honor comes from',
        earn: (H) => [
          ['Vs CPU', `Win: Apprentice ${H.win[0]} · Master ${H.win[1]} · Legend ${H.win[2]}`],
          ['Arcade', `Wins by difficulty · Shura ${H.win[3]} · clear it +${H.arcadeClear}`],
          ['Tournament & Dan', `Wins ×${H.modeMul.tourney} · conquer the tournament +${H.tourneyClear} · each Dan trial +${H.danPass(1)} and up`],
          ['Even in defeat', `Showing up ${H.loss} · each round taken ${H.roundWon}`],
          ['Good play', `Parries, counters, rallies, perfect rounds: up to +${H.styleCap} a match`],
        ],
        rivalsHead: 'Rivals',
        arenasHead: 'Arenas',
        open: 'Unlocked',
        castle: 'Beat Shura in Arcade',
        you: (n) => `Your honor: ${num(n)}`,
      },
      rival: {
        stage: 'Rival Challenge',
        selTitle: (name) => `${name} challenges you · Choose your ninja`,
        lvHp: (lv, p) => (p === 100 ? lv : `${lv} · rival health ${p}%`),
        accept: 'Accept the challenge',
        acceptSub: (name) => `Win and ${name} is yours`,
        quit: 'Back off',
        hud: 'RIVAL CHALLENGE',
        winTitle: (name) => `${name} joins you!`,
        winSub: (name) => `${name} is now on the select screen. Try them right away!`,
        tryNew: (name) => `Play as ${name}`,
        lossTitle: 'The challenge goes on',
        lossSub: (name, p) => `${name} won this time. Losing costs you nothing; next time they start with ${p}% health.`,
        lossSubMin: (name) => `${name} won this time. Losing costs you nothing; try again.`,
        retry: 'Challenge again',
        reveal: 'New ninja',
        toastReady: (name) => `${name} challenges you!`,
        lines: {
          hana: 'I heard about your honor, the whole market talks about you! Keep up with my dance and I’ll come with you!',
          tetsu: 'Your name reached my ears. Defeat me and my naginata fights at your side.',
          ren: 'Hah! Someone finally called for me! Win and I’m yours, lose and you listen to me laugh!',
          kage: 'I have been watching you for a while. Catch my shadow and I am yours.',
          tora: 'Prove you are not prey. Slip my chain and I walk beside you.',
          jin: 'If your honor comes from the heart, my staff will know. Come, let me test you.',
          mai: 'You are invited to my stage. Win my applause and my dance is yours.',
          tsubame: 'I watched from afar; you are good. Dodge my arrows and my bow is with you.',
        },
      },
    });

    // ================================================================ COMBAT: new kits, combos, move list (combat designer)
    // Akane/Aoi/Ren/Kage identities, combo counter, ki cancel, ND.MOVELIST names/descriptions (read through ND.i18n.t)
    merge(EN.CHARS, {
      akane: { desc: 'Iaijutsu master. The blade waits in its scabbard and every cut is a draw; her draw stance catches incoming blows.', weapon: 'Katana (iai)' },
      aoi: { desc: 'A one-handed tachi fencer of the wind. Long-reaching thrusts and wind steps close any distance in a single move.', weapon: 'Tachi' },
      ren: { desc: 'Oni-masked brawler. Sword on the shoulder; fights with elbows, knees, shoulder and head, and crushes guards.' },
      kage: { desc: 'Hooded shadow. Holds the ninjatō in a reverse grip; fights with shadow steps, feints and smoke bombs.' },
    });
    merge(EN.TXT, { kiCancel: 'KI CANCEL!', launch: 'LAUNCH!', iaiCatch: 'IAI GAESHI!' });
    EN.PATTERNS.push([/^(\d+) VURUŞ$/, '$1 HIT']);
    merge(EN.PHRASES, {
      // shared rows
      'Tekme': 'Kick',
      'Tekme: dengeyi hızla doldurur, gardı kırmaya yarar. Ardından AĞIR ile seri bitirişine bağlanır.': 'Kick: fills posture fast and helps break guards. Follow with HEAVY for a string ender.',
      'Shuriken fırlatır; zamanla yeniden dolar.': 'Throws a shuriken; they refill over time.',
      'Hava kesiği': 'Air slash',
      'Havada hafif kesik. Havaya fırlatılmış rakibe de vurur.': 'A light slash in the air. It also hits a launched opponent.',
      'Dalış': 'Plunge',
      'Havadan aşağı dalış kesiği; yere serer.': 'A diving slash from the air; knocks down.',
      'Kaeshi-waza (karşılık)': 'Kaeshi-waza (counter)',
      'Gard ya da savuşturmanın hemen ardından karşılık: nötr Suriage, ileri Harai (yere serer), geri Nuki (arkaya geçer), ağır Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.': 'Counter right after a guard or parry: neutral Suriage, forward Harai (knocks down), back Nuki (slips behind), heavy Uchiotoshi. Your third reply is the finisher; if parried, the rally continues.',
      'Fırlatıcı isabet edince HAFİF: rakibin peşinden sıçrayıp havada keser. Ardından AĞIR ile yere çakar. Havadaki rakip en çok üç vuruş alır.': 'When the launcher hits, LIGHT: leap after the opponent and cut in the air. Then HEAVY slams them down. An airborne opponent takes at most three hits.',
      'Üç vuruşluk hafif seri. İkinci ve üçüncü vuruş ki doluyken tekniğe bağlanır.': 'A three-hit light chain. With full ki, the second and third hits cancel into the ki technique.',
      'Ağır vuruş: yavaş ama yere serer.': 'Heavy strike: slow, but knocks down.',
      'İleri atılarak dürter; hafif seriye devam eder.': 'Lunges forward with a thrust; continues into the light chain.',
      'Yarım adım geri çekilip bacaklara alçak süpürme; yere serer.': 'Half a step back, then a low sweep at the legs; knocks down.',
      'Fırlatıcı: yükselen kesik rakibi havaya kaldırır.': 'Launcher: a rising cut lifts the opponent into the air.',
      'Sıçrayıp tepeden iner: yavaş ama gardı ezer, yere serer.': 'Leaps and comes down from above: slow, but crushes the guard and knocks down.',
      'Atılırken dönerek geniş kesik; yere serer.': 'A wide spinning cut out of a dash; knocks down.',
      'İki kesiklik seri bitirişi; son kesik yere serer.': 'A two-cut string ender; the last cut knocks down.',
      'Rakibin kılıcını aşağı çarpıp dürter: gardı ezer.': 'Beats the opponent’s blade down and thrusts: crushes the guard.',
      // Akane
      'Kından yatay çekiş kesiği, çapraz iniş, geri dönen kesik; kılıç her seferinde kınına döner.': 'A horizontal draw-cut from the scabbard, a diagonal down cut and a returning cut; the blade goes back into the scabbard every time.',
      'Derin çömelişten geniş yatay çekiş; yere serer.': 'A wide horizontal draw from a deep crouch; knocks down.',
      'Atılarak kından çekiş: uzak mesafeyi bir anda kapatır, seriye devam eder.': 'A dashing draw from the scabbard: closes a long gap in an instant and continues the chain.',
      'Kılıcı çekmeden kabzayla göğse vurur: hızlı, sersemletir. Ardından HAFİF ile Kesa ya da AĞIR ile Kurenai Renga.': 'Strikes the chest with the hilt without drawing: fast and stunning. Follow with LIGHT for Kesa or HEAVY for Kurenai Renga.',
      'Fırlatıcı: kından yükselen çekiş rakibi havaya kaldırır.': 'Launcher: a rising draw from the scabbard lifts the opponent into the air.',
      'Çekiş duruşu: kısa bir an bekler; bu sırada gelen yakın dövüş darbesini yakalar ve kaçınılmaz bir iai kesiğiyle karşılık verir. Boşa giderse açık kalır.': 'Draw stance: waits for a moment; a melee blow arriving meanwhile is caught and answered with an unavoidable iai cut. If nothing comes, she is left open.',
      'Kesa’dan sonra yükselen ve inen iki çekiş kesiği; son kesik yere serer.': 'After Kesa, a rising and a falling draw-cut; the last cut knocks down.',
      'Tekmeden sonra çömelip rakibin içinden geçen kızıl iai; arkasında belirir.': 'After the kick, a crouching crimson iai that passes straight through the opponent; she reappears behind.',
      // Aoi
      'Tek elle uzun dürtüş, yukarı savrulan kesik ve rüzgâr adımıyla derin atılma dürtüşü.': 'A long one-handed thrust, a flicking rising cut and a deep lunging thrust on a wind step.',
      'Dönerek geniş yatay kesik; yere serer.': 'A wide horizontal cut with a spin; knocks down.',
      'Rüzgâr adımı: çok uzaktan tek hamlede dürter, seriye devam eder.': 'Wind step: thrusts from very far in one move and continues the chain.',
      'Geri çekilirken uzun menzilli iniş kesiği: yaklaşanı cezalandırır.': 'A long-reaching down cut while stepping back: punishes anyone closing in.',
      'Fırlatıcı: dönerek yükselen kesik rakibi havaya kaldırır.': 'Launcher: a spinning rising cut lifts the opponent into the air.',
      'Geri sıçrar, ardından çok uzağa uzanan dürtüşle geri döner: gardı ezer, yere serer.': 'Hops back, then comes back with a very long thrust: crushes the guard and knocks down.',
      'Üç hızlı dürtüş; sonuncusu rüzgârla rakibi savurur.': 'Three quick thrusts; the last one blows the opponent away on the wind.',
      'İki kez dönerek çevresini biçen kesik; gardı ezer.': 'Spins twice, cutting all around; crushes the guard.',
      // Ren
      'Kesik · Dirsek · Diz': 'Cut · Elbow · Knee',
      'Tek elle kesik, dirsek darbesi ve uçan diz: kılıçla başlayıp bedenle biter.': 'A one-handed cut, an elbow strike and a flying knee: it starts with the sword and ends with the body.',
      'İki elle tepeden ezici iniş; gardı zorlar, yere serer.': 'A crushing two-handed blow from above; strains the guard and knocks down.',
      'Omuz hücumu: öne atılıp omuzla çarpar, dengeyi sarsar. İsabet ederse seriye devam eder.': 'Shoulder charge: lunges in and rams with the shoulder, rattling posture. On a hit it continues the chain.',
      'Kafa atar: kısa menzil, uzun sersemletme. İsabet ederse seriye devam eder.': 'Headbutt: short reach, long stun. On a hit it continues the chain.',
      'Fırlatıcı: aşağıdan yukarı iki elle savrulan kesik.': 'Launcher: a two-handed cut swung from low to high.',
      'Topuğu havaya kaldırıp balta gibi indirir: yere serer.': 'Raises the heel high and brings it down like an axe: knocks down.',
      'Dirsekten sonra kesik ve tepeden ezici iniş; son vuruş yere serer.': 'After the elbow, a cut and a crushing blow from above; the last hit knocks down.',
      'Tekmenin ardından dönen topuk tekmesi; yere serer.': 'After the kick, a spinning heel kick; knocks down.',
      // Kage
      'Ters tutuşla kesik, dönen kesik ve gölge adımı: kaybolup öne geçer, dürterek belirir.': 'A reverse-grip cut, a spinning cut and a shadow step: vanishes, slips forward and reappears thrusting.',
      'Sıçrayıp ters tutuşla aşağı saplar; yere serer.': 'Hops and stabs downward in a reverse grip; knocks down.',
      'Gölge gibi uzun atılma kesiği; seriye devam eder.': 'A long dashing cut like a shadow; continues the chain.',
      'Aldatma: kesecekmiş gibi parlar, dumanla geri kaçar. Erken savuşturmayı boşa çıkarır; hemen HAFİF ile gölge adımına, AĞIR ile Kage-nui’ye bağlanır.': 'Feint: flashes as if to cut, then slips back in smoke. Wastes an early parry; flows at once into the shadow step with LIGHT or Kage-nui with HEAVY.',
      'Fırlatıcı: ters tutuşla yükselen kesik.': 'Launcher: a rising reverse-grip cut.',
      'Ayağının dibine sis bombası atar: yakındakini sersemletir, Kage dumanın içinde geri kaçar.': 'Throws a smoke bomb at the feet: stuns anyone close while Kage slips back inside the smoke.',
      'Üç hızlı ters kesik ve aşağı saplama; sonuncusu yere serer.': 'Three quick reverse cuts and a downward stab; the last one knocks down.',
      'Tekmeden sonra dumanda kaybolur, rakibin arkasında belirip saplar.': 'After the kick, vanishes in smoke and reappears behind the opponent, stabbing.',
      // template row names
      'Nodachi serisi': 'Nodachi chain', 'Ağır nodachi': 'Heavy nodachi', 'Kodachi serisi': 'Kodachi chain', 'Ağır kesik': 'Heavy cut',
      'Tantō dansı': 'Tantō dance', 'Çift kesik': 'Twin cut', 'Naginata serisi': 'Naginata chain', 'Ağır savuruş': 'Heavy swing',
      'Zincir ve orak': 'Chain and sickle', 'Zincir çekişi': 'Chain pull', 'Asa serisi': 'Staff chain', 'Ağır süpürme': 'Heavy sweep',
      'Yelpaze serisi': 'Fan chain', 'Rüzgâr dalgası': 'Wind wave', 'Tantō serisi': 'Tantō chain', 'Ok (basılı tut: güçlü)': 'Arrow (hold: power shot)',
      'Geri + AĞIR da ok atar (basılı tut: güçlü atış); ok kalmadıysa tantō ile tepeden iner.': 'Back + HEAVY also shoots an arrow (hold for a power shot); out of arrows, she comes down from above with the tantō.',
      // combat pop-ups
      'KI İPTALİ!': 'KI CANCEL!', 'HAVAYA!': 'LAUNCH!',
    });

    // ================================================================ COUNTER CINEMATIC + COMBO TRIAL (combat feel pass)
    // js/kaeshi-cine.js STR.kaeshi, js/combo-trial.js STR.trial, js/coach.js combo/counter tips, move list legend
    {
      const tb = (t, c) => `<i class="tb${c ? ' ' + c : ''}">${t}</i>`;
      merge(EN.STR, {
        kaeshi: {
          head: 'KAESHI-WAZA', strike: 'STRIKE!', hits: 'HITS',
          labels: {
            suriage: 'Slide up their blade, cut down across',
            harai: 'Beat their blade aside, cut the legs',
            nuki: 'Slip the blow, cut from behind',
            uchiotoshi: 'Smash their blade down, drive through',
            sandan: "Three-cut counter sequence",
          },
        },
        trial: {
          title: 'Combo trial',
          btn: { prev: 'Previous combo', next: 'Next combo', retry: 'Start over', close: 'Close' },
          names: { chain: 'Basic string', s1: 'String ender', s2: 'Kick string', launch: 'Launcher', s3: 'Long combo' },
          desc: {
            chain: '{L} three times. Press each one as the previous hit lands; the string ends in a named finisher.',
            s1: '{L} twice, then {H}: the string ends with a heavy cut.',
            s2: '{L}, kick {K}, then {H}.',
            launch: '{D} + {H} launches; while they fly, {L}, then {H}.',
            s3: 'Two {L}, {D} + {H} to launch, {L}, {H}: five hits.',
          },
          ready: (w) => `Start: ${w}`,
          startWith: (w) => `This combo starts with ${w}.`,
          early: 'Too early: press as the previous hit lands.',
          late: 'Too late: press before the move finishes, right as the hit lands.',
          wrong: (got, want) => `Wrong button: ${got}, this step needs ${want}.`,
          dir: (want) => `Direction missing: ${want}. Hold the direction, then press.`,
          miss: 'Missed: the hit didn’t land. Get closer to the dummy.',
          clear: 'COMBO CLEAR!', clearPop: 'COMBO CLEAR!',
          all: 'Every combo trial for this ninja is clear!',
        },
        coach: {
          combo: (l) => `${l} ${l} ${l} quickly: a 3-hit combo`,
          comboT: (l) => `Tap ${l} three times in a row: combo`,
          counter: (l) => `After a guard or parry, press ${l} when STRIKE! appears: counter`,
          counterT: (l) => `After a guard or parry, tap ${l} when STRIKE! appears`,
        },
      });
      const L = Array.isArray(EN.STR.lessons) && EN.STR.lessons.find((l) => l.id === 'counter');
      if (L) L.d = 'After a guard or parry, <b>STRIKE!</b> appears over your head: press <kbd>F</kbd> before its bar runs out. Forward/back + <kbd>F</kbd> or <kbd>G</kbd> are other counters.';
      if (EN.STR.lessonsTouch) EN.STR.lessonsTouch.counter = `After a guard or parry, <b>STRIKE!</b> appears over your head: tap ${tb('ATTACK', 'tb-light')} before its bar runs out. Stick forward/back + ${tb('ATTACK', 'tb-light')} or ${tb('HEAVY')} are other counters.`;
      merge(EN.PHRASES, {
        'KOMBO TAMAM!': 'COMBO CLEAR!',
        'Nasıl okunur': 'How to read',
        '→ rakibe doğru, ← rakipten uzağa demek: o yön tuşunu (A / D ya da ok tuşları; rakip sağındaysa D) basılı tut ve saldırı tuşuna bas. Virgül: tuşlara sırayla bas. F hafif, G ağır, R tekme, S gard.':
          '→ means toward the opponent, ← away: hold that direction key (A / D or the arrow keys; D when the opponent is on your right) and press the attack key. A comma: press the keys one after another. F light, G heavy, R kick, S guard.',
        '▶ rakibe doğru, ◀ rakipten uzağa: yön çubuğunu o yana itip düğmeye dokun. Virgül: düğmelere sırayla dokun. Antrenmandaki Kombo denemesi her seriyi adım adım gösterir.':
          '▶ toward the opponent, ◀ away: push the stick that way and tap the button. A comma: tap the buttons one after another. The Combo trial in Training shows every string step by step.',
        'Gard ya da savuşturmanın ardından ekranda VUR! çıkar: altındaki çubuk bitmeden HAFİF’e bas. Yalnız HAFİF: Suriage. İleri + HAFİF: Harai (yere serer). Geri + HAFİF: Nuki (arkaya geçer). AĞIR: Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.':
          'After a guard or parry, STRIKE! appears: press LIGHT before its bar runs out. LIGHT alone: Suriage. Forward + LIGHT: Harai (knocks down). Back + LIGHT: Nuki (slips behind). HEAVY: Uchiotoshi. Your third reply is the finisher; if parried, the rally continues.',
      });
    }

    // ================================================================ GRAPHICS QUALITY: the Graphics setting (js/gfx.js)
    // (Turkish source in i18n.js, block "graphics quality")
    merge(EN.STR, {
      gfx: {
        title: 'Graphics',
        levels: { auto: 'Auto', high: 'High', medium: 'Medium', low: 'Low' },
        note: {
          auto: 'Picks for your device and lowers itself if a fight stutters.',
          high: 'Every light and effect. For strong devices.',
          medium: 'Light glow, no shadows. For most phones.',
          low: 'Smoothest. For older phones.',
        },
        now: (lv) => `Now: ${lv}`,
      },
    });

    // ================================================================ FRAME RATE: Settings → Graphics (js/gfx.js makePacer)
    // (Turkish source in i18n.js, block "frame rate"; the numbers themselves are not translated)
    merge(EN.STR, {
      fps: {
        title: 'Frame rate',
        show: 'Show FPS',
        levels: { max: 'Max' },
        note: {
          60: 'Steady and cool. Best for most phones.',
          90: 'Smoother where the screen supports it. Uses more battery.',
          120: 'Smoothest on 120 Hz screens. Uses more battery.',
          max: 'As fast as your screen allows.',
        },
      },
    });

    // ================================================================ SETTINGS SCREEN (js/settings.js; Turkish source in i18n.js)
    merge(EN.STR, {
      set: {
        title: 'Settings', close: 'Close',
        tabs: { audio: 'Audio', controls: 'Controls', gfx: 'Graphics', lang: 'Language' },
        touch: 'Touch', keys: 'Keyboard', pad: 'Gamepad',
        touchNote: 'Touch control settings show up here once you touch the screen.',
      },
    });

    // ================================================================ LANGUAGE PICKER (js/lang-ui.js; Turkish source in i18n.js)
    // Language names are not translated: each one is written in its own language (ND.i18n.names).
    merge(EN.STR, { lang: { title: 'Language', change: 'Change language', close: 'Close' } });

    // ================================================================ TOUCH HELP PER MOVEMENT MODE
    // (game.js touchHelp(): the menu's touch help follows the movement mode; Turkish source in i18n.js, block
    // "touch help per movement mode")
    merge(EN.STR, {
      thelp: {
        title: { float: 'Joystick', fixed: 'Fixed joystick', dpad: 'D-pad' },
        float: { walk: 'Put your thumb on the free half and slide: walk', jump: 'Push up: jump', guard: 'Pull down: guard', dash: 'Flick sideways twice: dash' },
        fixed: { walk: 'Hold the stick by its centre and push sideways: walk', jump: 'Push up: jump', guard: 'Pull down: guard', dash: 'Flick sideways twice: dash' },
        dpad: {
          walk: 'Hold: walk', step: 'Quick tap: one short step', jump: 'Tap: jump', guard: 'Hold: guard',
          dash: 'Double-tap: dash', both: 'Press between two buttons for both (▶ + ▲ = jump forward)',
        },
        edit: (b) => `${b}: drag any button where you like and set its size and opacity. In Settings → Controls.`,
      },
    });

    // ================================================================ SHARED LABELS (static HTML / move list text that is the same word in Turkish)
    merge(EN.PHRASES, { 'Shuriken': 'Shuriken', 'KI': 'KI' });

    // Persistent character journeys.
    merge(EN.STR, { menu: { arcadeDesc: "An eight-fight journey for each ninja. Resume your next rival, unlock the character ending and the Master seal." }, sel: { title: { arcade: "Arcade · Character journey" } },
      journey: {
        start: "Start journey",
        resume: (i, n) => "Continue · " + i + "/" + n + "",
        ending: "Watch ending",
        replay: "Replay journey",
        badge: "Master seal",
        completed: "Journey complete",
        progress: (i, n) => "" + i + "/" + n + " fights completed · Progress saved",
        reward: "Reward: character ending and permanent Master seal",
        saved: "Each win is saved. Leaving a fight counts as a retry.",
        menu: (done, active) => "" + done + " journeys completed · " + active + " in progress",
        clearReward: "Master seal earned · Character ending unlocked"
      }
    });

    // ================================================================ PROGRESS / ACCOUNT (Settings → Progress, Hall of Champions;
    // js/settings.js, js/banzuke.js; Turkish source in i18n.js, block "account and recovery code")
    merge(EN.STR, {
      set: { tabs: { save: 'Progress' } },
      acct: {
        title: 'Keep your progress',
        cgOn: (n) => `CrazyGames account: ${n}. Your titles, Champion colors, Dan and scores are saved to your account.`,
        cgWait: (n) => `CrazyGames account: ${n}. Connecting to your account…`,
        cgFail: (n) => `CrazyGames account: ${n}. Your account can’t be reached right now; new scores stay on this device for now.`,
        cgSave: 'Save your progress to your CrazyGames account',
        cgSaveNote: 'Sign in and your titles, Champion colors and scores move to your account, on every device.',
        rcTitle: 'Recovery code',
        rcNote: 'Write this code down. Enter it here on a new device to get your titles, Champion colors, Dan and scores back.',
        rcShow: 'Show code', rcNew: 'New code', rcNewDone: 'New code ready; the old one no longer works.',
        rcNeedName: 'Save a score under a nickname first to get a recovery code.',
        rcEnter: 'Enter a recovery code', rcGo: 'Restore',
        rcDone: (n, c) => `Welcome back, ${n}! Your progress is restored. Your new recovery code: ${c}`,
        err: { bad_code: 'We don’t recognise this code. Check the characters.', rate: 'Too many tries. Try again later.', offline: 'Can’t reach the server. Check your connection.', banned: 'This identity can’t be used.', error: 'Something went wrong. Try again.' },
        local: 'Online saving isn’t available here; your progress is kept on this device.',
        offline: 'You’re offline right now; your progress is kept on this device.',
        loading: 'Loading…',
      },
      lb: { savedLocalAccount: (r) => (r ? `#${r} on this device · your account can’t be reached right now` : 'Saved on this device · your account can’t be reached right now') },
    });

    // ================================================================ PRIVACY (js/privacy.js; Turkish source in i18n.js, block
    // "privacy"). The policy page itself (privacy.html) is English + Turkish; other languages see the English part.
    merge(EN.STR, {
      priv: {
        notice: 'Shadow Duel saves your nickname and scores for the online leaderboards.',
        policy: 'Privacy Policy', terms: 'Terms', both: 'Privacy Policy & Terms',
        ok: 'OK', label: 'Privacy notice',
      },
    });

    void dec; void fmtTime; void num;
  };
})(window.ND);
