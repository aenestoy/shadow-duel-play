// Shadow Duel — Spanish catalog for ND.i18n (Turkish is the source language; English is the reference catalog).
// Neutral Spanish for Spain and Latin America, "tú" throughout. Same structure as js/i18n-en.js; see js/i18n.js.
//   ES.STR       ← ND.STR (arcade.js, roster2.js, banzuke/leaderboard screens)
//   ES.CHARS     ← ND.CHARS title/desc/weapon    ES.ARENAS ← ND.ARENAS names
//   ES.SPECIALS  ← ND.SPECIALS desc/tip (names stay Japanese)   ES.TXT ← ND.TXT canvas texts
//   ES.PHRASES   exact Turkish text → Spanish    ES.HTML whole-element HTML    ES.PATTERNS regex rules
//
// GLOSSARY (used everywhere):
//   parry → desvío / desviar            guard → guardia (hold guard: mantén la guardia)
//   counter → contra (counter-slash: contracorte; counter hit pop-up: ¡A CONTRAPIÉ!)
//   posture → postura (bar: barra de postura; broken: ¡POSTURA ROTA!)   guard break → guardia rota
//   ki → ki    ki technique → técnica ki    ki cancel → cancelación ki
//   combo → combo    string/chain → cadena    string ender → cierre de cadena    finisher → remate
//   launcher → lanzador    juggle → malabar    knockdown / knocks down → derribo / derriba
//   rally → intercambio    dash → impulso    round → asalto    KO → K.O.
//   blade lock → traba de filos (pop-up ¡TRABADOS!)    clash → choque    mash → machacar
//   light / heavy slash → corte ligero / pesado    kick → patada    sweep → barrido    dive → picado
//   cross-up → cruce    dummy → muñeco    honor → honor    rival challenge → Desafío rival
//   monthly tournament → Torneo mensual    Dan trial → Examen Dan    combo trial → Prueba de combo
//   leaderboard → clasificación    nickname → apodo    best → récord    gamepad → mando
//   Touch buttons: ATAQUE · PESADO · PATADA · GUARDIA · IMPULSO · SHUR. · KI · SALTO (static LIGHT → LIGERO)
//   Move-list prefixes: Fwd+ → Ade+ · Back+ → Atr+
(function (ND) {
  'use strict';
  (ND.I18N_CATALOGS || (ND.I18N_CATALOGS = {})).es = function (I, EN) {
    const merge = I.merge;
    const num = (n) => I.num(n);
    const dec = (x) => I.dec(x);
    const fmtTime = (s) => I.time(s);

    // ================================================================ UI tables (ND.STR)
    merge(EN.STR, {
      menu: {
        brand: (nc, na) => `${nc} luchadores, ${na} arenas y un maestro oculto. Choques de espadas en tiempo real, filos trabados, desvíos, posturas rotas, técnicas ki y física ragdoll.`,
        arcade: 'Arcade',
        arcadeDesc: 'Vence a tus rivales uno a uno mientras sube la dificultad; al final te espera un maestro oculto. Gana para desbloquear ninjas y arenas.',
        arcadeProg: (best, c, ct, a, at) => `${best ? 'Récord ' + num(best) + ' · ' : ''}${c}/${ct} ninjas · ${a}/${at} arenas desbloqueadas`,
        train: 'Entrenamiento',
        trainDesc: 'Practica libremente con el muñeco o aprende paso a paso',
        trainFree: 'Libre',
        trainTut: 'Tutorial',
        watchShort: 'Dos ninjas al azar, IA Leyenda',
        specialKey: 'Técnica ki (ki lleno)',
        single: 'Partida única', singleDesc: 'Contra la CPU o dos jugadores',
      },
      sel: {
        title: { '2p': 'Elige tu ninja', cpu: 'Elige tu ninja', arcade: 'Arcade · Elige tu ninja', train: 'Entrenamiento · Elige tu ninja', tutorial: 'Tutorial · Elige tu ninja', tourney: 'Torneo mensual · Elige tu ninja', dan: 'Examen Dan · Elige tu ninja' },
        who1: { '2p': 'Jugador 1 · A / D para elegir, F para confirmar', def: 'Tú · A / D para elegir, F para confirmar' },
        who2: { '2p': 'Jugador 2 · ← / → para elegir, K para confirmar', cpu: 'Rival (CPU) · ← / → para elegir', train: 'Muñeco · ← / → para elegir' },
        go: { def: 'Empezar combate', arcade: 'Empezar Arcade', train: 'Empezar a entrenar', tutorial: 'Empezar tutorial', tourney: 'Empezar torneo', dan: 'Empezar examen' },
        random: 'Aleatorio',
        arena: 'Arena',
        locked: 'Bloqueado',
        lockMsg: (name, hint) => `${name} · sin desbloquear · ${hint}`,
        keyHint: '<kbd>Enter</kbd> empezar · <kbd>⌫</kbd> volver',
      },
      hint: {
        wins: (n, cur) => `Gana ${n} combates en Arcade (${Math.min(cur, n)}/${n})`,
        clear: 'Completa el Arcade una vez',
        boss: 'Vence al jefe final del Arcade',
        arena: 'Gana un combate en esta arena en Arcade',
      },
      toast: {
        newChar: (name) => `Nuevo ninja desbloqueado: ${name}`,
        newArena: (name) => `Nueva arena desbloqueada: ${name}`,
        newBest: (s) => `Nuevo récord: ${num(s)} pts`,
        lesson: (t) => `Lección completada: ${t}`,
        tutDone: '¡Tutorial completado!',
        perf: 'Gráficos reducidos para ganar fluidez',
      },
      vs: {
        stage: (i, n) => `Combate ${i} / ${n}`,
        boss: 'Combate final',
        go: '¡Lucha!',
        quit: 'Salir del Arcade',
        keys: '<kbd>Enter</kbd> / <kbd>F</kbd> empezar · <kbd>⌫</kbd> salir',
        unknown: '?',
      },
      hud: { you: 'TÚ', cpu: 'CPU', dummy: 'MUÑECO', stage: (i, n) => `${i}/${n}`, boss: 'JEFE FINAL', inf: '∞', lockSolo: '¡Machaca F / K!', lockDuo: '¡Machaca ligero o pesado!' },
      end: {
        rematch: 'Revancha', change: 'Cambiar de ninja', menu: 'Menú principal',
        winTitle: 'La victoria es tuya',
        winSub: (i, n, pts) => `Combate ${i}/${n} superado · +${num(pts)} pts`,
        next: 'Siguiente combate',
        bossNext: 'Hacia el final',
        lossTitle: 'Derrota',
        lossSub: (name) => `${name} tuvo ventaja esta vez. Inténtalo de nuevo.`,
        retry: 'Reintentar',
        quit: 'Salir del Arcade',
      },
      ending: {
        head: 'Final',
        rows: { fights: 'Combates', time: 'Tiempo total', retries: 'Reintentos', perfect: 'Asaltos perfectos', score: 'Puntuación', best: 'Récord' },
        newBest: '¡Nuevo récord!',
        menu: 'Menú principal',
        again: 'Jugar de nuevo',
        unlocked: 'Desbloqueado',
        fightPts: 'Puntos de combate',
        bonus: 'Bonus por completar',
      },
      score: {
        hud: 'PUNTOS',
        rows: { hit: 'Golpes', combo: 'Combo', counter: 'Contras', defense: 'Defensa', pressure: 'Presión', special: 'Técnica ki', round: 'Victoria', perfect: 'Perfecto', hp: 'Vida restante', time: 'Bonus de tiempo' },
        total: 'Puntuación',
        diff: (name, m) => `con ${name} ×${dec(m)}`,
        best: (s) => `Tu récord: ${num(s)}`,
        newBest: '¡Nuevo récord!',
        arcadeTotal: (s) => `Total Arcade: ${num(s)}`,
        lossNote: (s, pen) => `Este intento no cuenta · Total Arcade ${num(s)} · cada reintento −${num(pen)}`,
        clearBonus: (c, n) => `+${num(c)}${n ? ' · sin reintentos +' + num(n) : ''}`,
        lossCpu: 'Derrota · solo las victorias entran en la tabla',
        cpuBoardHint: 'Las victorias en Leyenda entran en la clasificación',
      },
      lb: {
        menu: 'Clasificación',
        menuDesc: 'Récords de Arcade y Leyenda',
        title: 'Clasificación',
        back: 'Volver',
        boards: { arcade: 'Arcade', cpu_efsane: 'CPU Leyenda' },
        boardDesc: { arcade: 'Puntuación total de una partida de Arcade completada', cpu_efsane: 'Puntuación de un combate ganado contra la CPU Leyenda' },
        all: 'Todos',
        status: { loading: 'Cargando…', online: 'Clasificación online', readonly: 'Clasificación online · solo lectura', local: 'Clasificación local', error: 'Error · clasificación local', offline: 'Sin conexión · clasificación local' },
        empty: 'Aún no hay puntuaciones. ¡Estrena la tabla!',
        loadErr: 'No se pudo cargar la clasificación.',
        you: 'Tú', youTag: 'tú', player: 'Jugador',
        nick: 'Apodo', nickPh: 'Tu apodo', nickSave: 'Guardar', nickEdit: 'Cambiar',
        nickAsk: 'Apodo para la clasificación local:',
        saving: 'Guardando…',
        savedOnline: (r) => `Puesto online: #${r}`,
        savedOnlineNoRank: 'Guardado en la clasificación online',
        savedOnlineGap: (r, g) => `Puesto online: #${r} · a ${g} pts del top 10`,
        reason: {
          needName: 'Elige un apodo para entrar en la clasificación online',
          offline: 'Sin conexión: la puntuación queda guardada y se enviará cuando vuelvas a estar online',
          rate: 'Demasiados envíos: la puntuación se enviará en breve',
          daily: 'Límite diario de envíos alcanzado: puntuación guardada solo en local',
          week: 'El mes ha terminado: esta puntuación no cuenta para el nuevo',
          invalid: 'Puntuación no válida',
        },
        nickErr: {
          nick_length: 'El apodo debe tener entre 3 y 16 caracteres',
          nick_chars: 'Usa solo letras, números, espacios y _ . - (al menos una letra)',
          nick_bad: 'Ese apodo no está permitido; prueba otro',
          rate_limited: 'Espera un momento y vuelve a intentarlo',
        },
        nickErrDef: 'No se pudo guardar el apodo',
        nickAskOnline: 'Apodo para la clasificación online:',
        savedLocal: (r) => (r ? `#${r} en la clasificación local` : 'Guardado en la clasificación local'),
        rejected: 'No se pudo guardar tu puntuación: solo clasificación local',
        quota: 'La clasificación online está llena: puntuación guardada solo en local',
        open: 'Clasificación',
        keys: '<kbd>←</kbd> <kbd>→</kbd> tabla · <kbd>↑</kbd> <kbd>↓</kbd> ninja · <kbd>⌫</kbd> volver',
      },
      bz: {
        back: 'Volver', toMenu: 'Menú principal', you: 'Tú', youTag: 'tú', newBest: '¡Nuevo récord!', seeResult: 'Ver resultado',
        resetIn: 'Se reinicia en',
        // time left: días (d) · horas (h) · minutos (min) · segundos (s)
        left: (ms) => { const t = Math.floor(ms / 1000), d = Math.floor(t / 86400), hh = Math.floor((t % 86400) / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60; return d ? `${d}d ${hh}h ${mm}min` : hh ? `${hh}h ${mm}min` : `${mm}min ${ss}s`; },
        leftShort: (ms) => { const t = Math.floor(ms / 60000), d = Math.floor(t / 1440), hh = Math.floor((t % 1440) / 60), mm = t % 60; return d ? `${d}d ${hh}h` : hh ? `${hh}h ${mm}min` : `${mm}min`; },
        weekName: (m, y) => `${['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][m - 1] || m} de ${y}`,
        monthName: (m) => ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][m - 1] || String(m),
        rank: (r) => (r <= 0 ? 'Sin rango' : r <= 10 ? `Kyu ${11 - r}` : `Dan ${r - 10}`),
        fightOf: (i, n) => `Combate ${i}/${n}`,
        hpBonus: (p) => `Vida rival +${p} %`,
        mirrorOpp: 'Espejo · tu propio ninja',
        suddenSub: 'Un asalto · quien caiga, pierde',
        rows: { fights: 'Victorias', time: 'Tiempo', fightPts: 'Puntos de combate', stage: 'Bonus de fase', clear: 'Bonus por completar', total: 'Puntuación del torneo', weekBest: 'Tu récord mensual' },
        mods: {
          rally2x: { n: 'Fuego cruzado', d: 'Daño de las contras ×2' },
          fullKi: { n: 'Ki pleno', d: 'Cada asalto empieza con el ki lleno' },
          sudden: { n: 'Muerte súbita', d: 'Un solo asalto; ambos empiezan con media vida' },
          mirror: { n: 'Espejo', d: 'Tu rival es tu propio ninja' },
          parryOnly: { n: 'Solo contras', d: 'Los golpes normales hacen un 25 % del daño; las contras, ×1,5' },
          posture2x: { n: 'Postura quebrada', d: 'Daño a la postura ×2: las guardias caen rápido' },
          shuriken3x: { n: 'Lluvia de shuriken', d: 'Shuriken triples' },
          kiRush: { n: 'Marea de ki', d: 'El ki se llena el doble de rápido' },
          glass: { n: 'Hoja de cristal', d: 'Todo el daño ×1,5' },
        },
        menu: {
          tour: 'Torneo mensual', dan: 'Examen Dan', hall: 'Salón de campeones',
          tourRank: (p, left) => `Este mes: #${p} · se reinicia en ${left}`,
          tourBest: (b, left) => `Tu récord: ${b} · se reinicia en ${left}`,
          tourNew: (left) => `Los mismos 8 combates para todos · se reinicia en ${left}`,
          danRank: (name, next) => (next ? `Tu rango: ${name} · siguiente: ${next}` : `Tu rango: ${name} · estás en la cima`),
          danNew: '20 exámenes, de Kyu 10 a Dan 10',
          hallRank: (p) => `Este mes #${p} · récords`,
          hallDesc: 'El top 10 del mes y los récords históricos',
          nick: (n) => (n ? `Apodo: ${n}` : 'Elige un apodo'),
          champTitle: 'Top 10 del mes', champLocal: 'Top 10 en este dispositivo', champEmpty: 'Sé el primero en la tabla de este mes', champLoading: 'Cargando a los líderes…',
          champLast: (n) => `Campeón del mes pasado: ${n}`, champOpen: 'abrir la clasificación mensual',
        },
        t: {
          title: 'Torneo mensual', head: 'Torneo',
          runNote: (s, st) => `Total del torneo: ${num(s)} (incl. +${num(st)} por victoria)`,
          lossSub: (name, won) => `${name} puso fin a tu racha · ${won} ${won === 1 ? 'victoria' : 'victorias'}`,
          lossNote: (s) => `Este combate no cuenta · puntuación del torneo ${num(s)}`,
          quit: 'Terminar torneo',
          myBest: (b, a) => `Tu récord mensual: ${b} pts · ${a} ${a === 1 ? 'intento' : 'intentos'}`,
          noTry: 'Aún no lo has intentado este mes.',
          place: (p, t) => (t ? `#${p} / ${t}` : `#${p}`),
          rules: (n, clear, stage) => `${n} combates; los mismos rivales, arenas y reglas para todos. Una derrota termina el intento; puedes intentarlo sin límite y cuenta tu mejor marca. Cada victoria +${stage}; vencerlos a todos, +${clear}.`,
          start: 'Elige tu ninja y empieza', again: 'Reintentar', go: 'Entrar al torneo',
          clearTitle: 'Torneo conquistado', overTitle: 'Intento terminado',
          savedToast: (s) => `Puntuación del torneo guardada: ${s}`,
        },
        d: {
          title: 'Examen Dan', head: 'Examen Dan',
          sub: 'Supera cada examen para subir de rango. Tu rango aparece junto a tu nombre en las clasificaciones.',
          trialOf: (n) => `Examen de ${n}`,
          runNote: (i, n) => `Examen: ${i}/${n} combates ganados`,
          lossSub: (name) => `${name} frenó tu examen.`,
          lossNote: 'Examen fallido',
          quit: 'Abandonar examen',
          yourRank: 'Tu rango', bestWas: (n) => `Máximo: ${n}`, ladder: 'Escala de rangos',
          nextTrial: (n) => `Siguiente: examen de ${n}`,
          fights: (n) => `${n} ${n === 1 ? 'combate' : 'combates'}`,
          bossLast: 'Combate final: Shura',
          strikes: (left, max) => `Oportunidades: ${left}/${max} · ${max} exámenes fallidos te bajan un rango`,
          safe: 'En este rango, fallar un examen no te hace bajar.',
          maxed: 'En la cima: Dan 10', maxedSub: 'Tu nombre encabeza la tabla Dan.',
          start: 'Elige tu ninja y haz el examen', next: 'Siguiente examen', go: 'Hacer el examen',
          promoted: (n) => `Ascenso: ${n}`, demoted: (n) => `Descenso: ${n}`, failed: 'Examen fallido',
          promotedSub: (a, b) => `${a} → ${b}`, demotedSub: 'Tres exámenes fallidos. ¡Vuelve a subir!', tryAgain: 'Inténtalo de nuevo; tu rango está a salvo.',
          toast: (n) => `Nuevo rango: ${n}`, leftToast: 'Examen abandonado: cuenta como fallido',
        },
        hall: {
          title: 'Salón de campeones',
          tabs: { week: { n: 'Este mes' }, alltime: { n: 'Histórico' }, archive: { n: 'Campeones' }, chars: { n: 'Ninjas' }, dan: { n: 'Dan' } },
          desc: { alltime: 'Lo mejor de siempre del Torneo mensual', archive: 'El top 10 de cada mes terminado queda grabado aquí para siempre', chars: 'Plusmarca de cada ninja · toca un ninja para ver su top 20', dan: 'Los rangos más altos' },
          loading: 'Cargando…', error: 'No se pudo cargar la clasificación.', retry: 'Reintentar',
          empty: 'Aún no hay nadie. ¡Estrena la tabla!', emptyDan: 'Aún no hay jugadores con rango.', emptyArchive: 'Aún no ha terminado ningún mes. Los títulos empiezan con el torneo de octubre de 2026; sus campeones quedarán grabados cuando acabe, el 1 de noviembre.', emptyArchiveLocal: 'Aún no ha terminado ningún mes en este dispositivo.',
          anon: 'Jugador',
          meTop: (p, s) => `Tú: #${p} · ${s} pts · ¡estás en el top 10!`,
          meGap: (p, g, s) => `Tú: #${p} · ${s} pts · a ${g} pts del top 10`,
          meNone: 'Aún no tienes puntuación este mes.',
          meDan: (p, n) => `Tú: #${p} · ${n}`,
          meDanLocal: (n) => `Tu rango: ${n}`, meNoDan: 'Aún sin rango. Primer examen: Kyu 10.',
          noRecord: 'Sin récord', allNinjas: 'Todos los ninjas',
          pending: (n) => `Envíos pendientes: ${n}`,
          classic: 'Tablas Arcade · Leyenda',
        },
        // Monthly Tournament rewards: permanent title (top 3) and Champion colors (1st)
        ttl: {
          champ: 'Campeón mensual', finalist: 'Finalista',
          reward: 'Desde el torneo de octubre de 2026, el top 3 de cada mes gana un título permanente. El campeón también gana colores de campeón exclusivos para el ninja que usó. Los títulos requieren al menos 5 jugadores ese mes.',
          hall: 'Desde octubre de 2026: el top 3 del mes gana un título permanente (mín. 5 jugadores) · el campeón, colores de campeón',
          local: 'Tus puntuaciones del torneo se guardan en este dispositivo.',
          colors: 'Colores de campeón',
          how: 'Gana un Torneo mensual con este ninja',
          unlocked: (name) => `¡Campeón mensual! Colores de campeón de ${name} desbloqueados`,
          newTitle: (t) => `Nuevo título: ${t}`,
        },
      },
      train: {
        title: 'Entrenamiento', tutTitle: 'Tutorial',
        dummy: 'Muñeco',
        beh: { idle: 'Quieto', guard: 'Guardia', attack: 'Ataque', counter: 'Contra' },
        infHp: 'Vida infinita', fullKi: 'Ki lleno',
        reset: 'Reiniciar posición',
        hide: 'Ocultar', show: 'Panel',
        moves: 'Movimientos',
        lessons: 'Lecciones',
        lessonOf: (i, n) => `Lección ${i}/${n}`,
        done: '¡Tutorial completado! Configura el muñeco a tu gusto y entrena libremente.',
        progress: (a, b) => `${a}/${b}`,
        keysHelp: '<kbd>1</kbd>–<kbd>4</kbd> muñeco · <kbd>⌫</kbd> reiniciar · <kbd>H</kbd> panel',
        specialFallback: { kanji: '影斬り', name: 'Tajo de Sombra', desc: 'Un tajo veloz como el rayo que atraviesa limpiamente al rival.', tip: '' },
        kiFull: 'ki lleno',
        counterTip: 'Cómo responder',
      },
      moves: [
        ['<kbd>A</kbd><kbd>D</kbd>', 'Caminar', 'doble toque: impulso'],
        ['<kbd>W</kbd>', 'Saltar', ''],
        ['<kbd>F</kbd><kbd>F</kbd><kbd>F</kbd>', 'Combo ligero ×3', 'el tercer golpe empuja'],
        ['<kbd>G</kbd>', 'Corte pesado', 'derriba'],
        ['<kbd>R</kbd>', 'Patada', 'presiona la guardia, llena la postura'],
        ['<kbd>T</kbd>', 'Shuriken', ''],
        ['<kbd>Shift</kbd>', 'Impulso', 'Shift izquierdo'],
        ['<kbd>Shift</kbd>›<kbd>F</kbd>', 'Corte en impulso', ''],
        ['<kbd>W</kbd>›<kbd>F</kbd>', 'Corte aéreo', ''],
        ['<kbd>W</kbd>›<kbd>G</kbd>', 'Picado', 'pesado en el aire'],
        ['<kbd>S</kbd>', 'Guardia', 'mantener'],
        ['<kbd>S</kbd>!', 'Desvío', 'pulsa justo antes de que llegue el golpe'],
        ['<kbd>F</kbd>', 'Contra directa', 'tras guardia/desvío'],
        ['Ade+<kbd>F</kbd>', 'Barrido', 'contra · a las piernas'],
        ['Atr+<kbd>F</kbd>', 'Cruce', 'contra · escúrrete a su espalda'],
        ['<kbd>G</kbd>', 'Contra pesada', 'contra · derriba'],
        ['Intercambio', 'Intercambio', 'bloquea su contra y contraataca; tu 3.ª contra es un remate'],
        ['<kbd>F</kbd>/<kbd>G</kbd>!!', 'Traba de filos', 'machaca durante la traba para empujarlo'],
      ],
      touch: {
        btn: { light: 'ATAQUE', heavy: 'PESADO', kick: 'PATADA', guard: 'GUARDIA', dodge: 'IMPULSO', throw: 'SHUR.', special: 'KI', up: 'SALTO', down: 'GUARDIA', stick: 'Joystick' },
        lock: '¡Machaca ATAQUE!',
        replaySkip: 'toca para omitir',
        rotateTitle: 'Gira la pantalla',
        rotateText: 'Shadow Duel se juega en horizontal. En vertical puedes seguir usando los menús.',
        rotMenu: 'Menú principal',
        need2p: 'Requiere teclado / mando',
        need2pToast: 'Conecta un teclado o un mando para jugar a dos',
        hints: 'Ayudas',
        pause: 'Pausa',
        sel: { who1: 'Tú · toca tu ninja', who2: 'Rival (CPU) · toca para elegir', who2train: 'Muñeco · toca para elegir' },
        opt: {
          title: 'Controles táctiles',
          layout: 'Diseño', simple: 'Sencillo', full: 'Completo',
          size: 'Tamaño', sizes: { s: 'Pequeño', m: 'Mediano', l: 'Grande' },
          hand: 'Botones', right: 'Derecha', left: 'Izquierda',
          assist: 'Ayuda fácil', haptic: 'Vibración',
          fullscreen: 'Pantalla completa', exitFullscreen: 'Salir de pantalla completa',
          note: 'Sencillo: 5 botones grandes. Completo: añade patada y shuriken. Ayuda fácil: mantén ATAQUE y el combo sigue solo, un toque rápido en GUARDIA dura lo justo para desviar y el joystick no se dispara sin querer. Solo facilita el control táctil; las reglas y las puntuaciones son iguales para todos.',
          fullNote: 'Los botones PATADA y SHURIKEN están en el diseño Completo (Ajustes → Controles).',
        },
        help: '<div class="th-grid">' +
          '<div><h3>Joystick</h3><dl>' +
          '<dt><i class="tb">◀ ▶</i></dt><dd>Apoya el pulgar en la mitad libre y deslízalo: caminar</dd>' +
          '<dt><i class="tb">▲</i></dt><dd>Empuja arriba: saltar</dd>' +
          '<dt><i class="tb tb-guard">▼</i></dt><dd>Tira hacia abajo: guardia</dd>' +
          '<dt><i class="tb">▶▶</i></dt><dd>Desliza dos veces hacia un lado: impulso</dd>' +
          '</dl></div>' +
          '<div><h3>Botones</h3><dl>' +
          '<dt><i class="tb tb-light">ATAQUE</i></dt><dd>Corte. Toca una y otra vez: combo. Mantén adelante o atrás mientras tocas: otras técnicas</dd>' +
          '<dt><i class="tb">PESADO</i></dt><dd>Corte pesado. Adelante + PESADO lanza al rival por los aires</dd>' +
          '<dt><i class="tb tb-guard">GUARDIA</i></dt><dd>Mantén: guardia. Toca justo antes del golpe: desvío</dd>' +
          '<dt><i class="tb">IMPULSO</i></dt><dd>Impulso (hacia donde apunte el joystick; si no, hacia atrás)</dd>' +
          '<dt><i class="tb ki">KI</i></dt><dd>Técnica ki: el botón brilla cuando el ki está lleno</dd>' +
          '<dt><i class="tb">PATADA</i> <i class="tb">SHUR.</i></dt><dd>Diseño Completo: patada y shuriken</dd>' +
          '</dl></div></div>',
        note: 'Puedes pulsar varios botones a la vez: mantener la guardia y atacar, o deslizar el pulgar de <i class="tb tb-guard">GUARDIA</i> a <i class="tb tb-light">ATAQUE</i>. <b>II</b>, arriba en la pantalla, pausa el juego; el diseño, el tamaño y la opción para zurdos están en <b>Ajustes</b>. Si usas un teclado o un mando, los controles cambian solos.',
        keysHelp: '',
      },
      movesTouch: [
        ['<i class="tb">◀ ▶</i>', 'Caminar', 'joystick · desliza dos veces: impulso'],
        ['<i class="tb">▲</i>', 'Saltar', 'empuja el joystick arriba'],
        ['<i class="tb tb-light">ATAQUE</i>×3', 'Combo triple', 'toca una y otra vez; el tercer golpe empuja'],
        ['<i class="tb">PESADO</i>', 'Corte pesado', 'derriba'],
        ['<i class="tb">PATADA</i>', 'Patada', 'presiona la guardia, llena la postura · diseño Completo'],
        ['<i class="tb">SHUR.</i>', 'Shuriken', 'diseño Completo'],
        ['<i class="tb">IMPULSO</i>', 'Impulso', ''],
        ['<i class="tb">IMPULSO</i>›<i class="tb tb-light">ATAQUE</i>', 'Corte en impulso', ''],
        ['<i class="tb">▲</i>›<i class="tb tb-light">ATAQUE</i>', 'Corte aéreo', ''],
        ['<i class="tb">▲</i>›<i class="tb">PESADO</i>', 'Picado', 'pesado en el aire'],
        ['<i class="tb tb-guard">GUARDIA</i>', 'Guardia', 'mantén, o tira del joystick hacia abajo'],
        ['<i class="tb tb-guard">GUARDIA</i>!', 'Desvío', 'toca justo antes de que llegue el golpe'],
        ['<i class="tb tb-light">ATAQUE</i>', 'Contra directa', 'tras guardia/desvío'],
        ['Ade+<i class="tb tb-light">ATAQUE</i>', 'Barrido', 'contra · a las piernas'],
        ['Atr+<i class="tb tb-light">ATAQUE</i>', 'Cruce', 'contra · escúrrete a su espalda'],
        ['<i class="tb">PESADO</i>', 'Contra pesada', 'contra · derriba'],
        ['Intercambio', 'Intercambio', 'bloquea su contra y contraataca; tu 3.ª contra es un remate'],
        ['<i class="tb tb-light">ATAQUE</i>!!', 'Traba de filos', 'machaca ATAQUE durante la traba para empujarlo'],
      ],
      moveSpecialTouch: '<i class="tb ki">KI</i>',
      moveTags: {
        normal: 'Normal', command: 'Comando', string: 'Cadena', launcher: 'Lanzador', juggle: 'Malabar', air: 'Aéreo', dash: 'Impulso',
        strike: 'Golpe', counter: 'Contra', catch: 'Atrapa', feint: 'Finta', guardCrush: 'Rompeguardia', knockdown: 'Derribo',
        kiCancel: 'Cancelación ki', special: 'Técnica ki', throw: 'Proyectil',
      },
      lessonsTouch: {
        walk: 'Desliza el pulgar por la mitad libre de la pantalla: mueve el joystick a izquierda y derecha para caminar.',
        combo: 'Toca <i class="tb tb-light">ATAQUE</i> tres veces seguidas: encadena tres cortes y golpea al muñeco.',
        heavy: 'Asesta un corte pesado con <i class="tb">PESADO</i>. Es lento, pero derriba.',
        gbreak: 'El muñeco está en guardia. Golpéalo con <i class="tb">PESADO</i> para llenar su barra de postura y romperle la guardia (<i class="tb">PATADA</i>, en el diseño Completo, la llena aún más rápido).',
        block: 'El muñeco ataca. Mantén <i class="tb tb-guard">GUARDIA</i> (o tira del joystick hacia abajo) y bloquea un corte.',
        parry: 'Toca <i class="tb tb-guard">GUARDIA</i> justo antes de que llegue el golpe. El momento perfecto es cuando el anillo azul se encoge.',
        counter: 'Justo después de una guardia o un desvío, <i class="tb tb-light">ATAQUE</i>: contracorte. Prueba también joystick adelante/atrás + <i class="tb tb-light">ATAQUE</i> o <i class="tb">PESADO</i>.',
        special: 'Tu barra de ki está llena. Usa {sp} con el botón <i class="tb ki">KI</i>, que ahora brilla.',
      },
      lessons: [
        { id: 'walk', t: 'Caminar', d: 'Camina adelante y atrás con <kbd>A</kbd> / <kbd>D</kbd>.' },
        { id: 'combo', t: 'Combo triple', d: 'Encadena tres cortes ligeros con <kbd>F</kbd> <kbd>F</kbd> <kbd>F</kbd> y golpea al muñeco.' },
        { id: 'heavy', t: 'Corte pesado', d: 'Asesta un corte pesado con <kbd>G</kbd>. Es lento, pero derriba.' },
        { id: 'gbreak', t: 'Rompe la guardia', d: 'El muñeco está en guardia. Patea con <kbd>R</kbd> para llenar su barra de postura y romperle la guardia.' },
        { id: 'block', t: 'Guardia', d: 'El muñeco ataca. Mantén <kbd>S</kbd> para bloquear un corte.' },
        { id: 'parry', t: 'Desvío', d: 'Pulsa <kbd>S</kbd> justo antes de que llegue el golpe. El momento perfecto es cuando el anillo azul se encoge.' },
        { id: 'counter', t: 'Contra', d: 'Justo después de una guardia o un desvío, <kbd>F</kbd>: contracorte. Prueba también adelante/atrás + <kbd>F</kbd> o <kbd>G</kbd>.' },
        { id: 'rally', t: 'Intercambio', d: 'El muñeco también contraataca. Atácalo, bloquea su contra y vuelve a contraatacar: alcanza 2× con dos respuestas propias.' },
        { id: 'special', t: 'Técnica ki', d: 'Tu barra de ki está llena. Usa {sp} con <kbd>E</kbd>.' },
      ],
    });

    // ================================================================ story, fighters, arenas, specials
    merge(EN.STR, {
      // open = speaks first (opponent), reply = answers (player), boss = said to the final boss
      talk: {
        akane: {
          open: ['Mi hoja es carmesí; mi intención, pura. Enfréntate a mí con honor.', 'Primero me inclino, después ataco. Es lo justo.', 'Este duelo es por nuestro honor. No hay retirada.'],
          reply: ['Un rival honorable… Te has ganado mi hoja.', 'Palabras afiladas. Veamos si tu acero lo es tanto.', 'Cuando habla la hoja carmesí, las palabras callan.'],
          boss: 'Mis maestros murieron bajo tu hoja, Shura. Hoy se salda esa deuda.',
        },
        aoi: {
          open: ['El viento nunca tiene prisa. Yo tampoco.', 'Escucha tu respiración. El último sonido que oigas será el viento.', 'El bambú se dobla, pero nunca se rompe. ¿Y tú?'],
          reply: ['Cálmate. La ira vuelve pesada la espada.', 'No puedes atrapar el viento. Solo sentirlo.', 'Muy bien. Empezamos cuando esa hoja toque el suelo.'],
          boss: 'Hasta el ojo de la tormenta guarda silencio. Dentro de ti solo hay ruido, Shura.',
        },
        kuro: {
          open: ['La montaña no se mueve. Tú sí.', 'Sin palabras. Alza tu espada.', 'Poca cosa. Será rápido.'],
          reply: ['Hmph. Ven, pues.', 'Hablas demasiado.', 'Mi nodachi es larga. Mi paciencia, corta.'],
          boss: 'Shura. He esperado mucho. Basta de palabras.',
        },
        yuki: {
          open: ['La nieve cae en silencio. Mis golpes también.', 'El zorro no cae en trampas. Las tiende.', '¿Frío? Pronto no sentirás nada.'],
          reply: ['Tienes la sangre caliente. Eso te frena.', 'Cuánto ruido… Hasta la nieve siente vergüenza ajena.', 'No parpadees. Te lo perderías.'],
          boss: 'Todos te temen, Shura. Yo solo siento un poco de frío.',
        },
        hana: {
          open: ['¿Bailamos? ¡Pero llevo yo!', '¡Terminamos antes de que caigan los pétalos, lo prometo!', 'Dos tantō, una sonrisa. ¿Qué te asusta más?'],
          reply: ['¡Ay, cuánta seriedad! Sonríe un poco, que caerás con más gracia.', '¡Atrápame si puedes!', '¡Bueno, bueno! Pero luego nada de llorar.'],
          boss: '¿Nunca te ríes, Shura? ¡Vamos, que sea nuestro último baile!',
        },
        tetsu: {
          open: ['El deber me trajo aquí. Apártate o cae.', 'Mi armadura ha visto cien batallas. Tú serás la número ciento uno.', 'La disciplina va antes que el valor. Permíteme demostrártelo.'],
          reply: ['Una falta de respeto. La corregiré.', 'Tus palabras no atraviesan mi armadura.', 'Prepárate. Mi naginata no avisa.'],
          boss: 'Quemaste el castillo de mi señor, Shura. Hoy cumplo con mi deber.',
        },
        ren: {
          open: ['¡Ja! ¡Por fin algo de diversión! ¿Tienes los huesos duros?', '¿Te asustó la máscara? ¡No quieras ver mi cara de verdad!', '¿Cabezas o guardias? ¡Rompo las dos!'],
          reply: ['¡Mucho hablar y poco pelear! ¡Vamos!', 'Je, me caes bien. Igual te voy a dar una paliza.', '¿Has visto mi patada? ¡Estás a punto de verla!'],
          boss: 'Así que tú eres el oni de verdad, ¿eh? ¡A ver quién tiene los cuernos más duros!',
        },
        kage: {
          open: ['Crees que me ves. Solo ves mi sombra.', 'Cuanto más brilla la luz, más honda es la sombra.', 'Tu nombre ya está escrito. Yo solo lo leo.'],
          reply: ['No hables. Las sombras escuchan.', 'No mires atrás. Ya estoy ahí.', 'Haces demasiado ruido. El silencio golpea más rápido.'],
          boss: 'Las sombras no sirven a ningún amo, Shura. También te engullirán a ti.',
        },
        shura: {
          open: ['Has roto siete hojas. La octava es mía, y te romperá a ti.', 'Tu espíritu me llamó. Bien que hayas subido tan alto: tu caída será aún más grande.', 'Soy el final del camino. Arrodíllate.'],
          reply: ['Debilidad. La huelo desde aquí.', 'No eres más que un peldaño.', 'Arrodíllate o cae.'],
          boss: 'El demonio del espejo… Uno de los dos sobra.',
        },
        tora: {
          open: ['Perdí la cuenta de los que colgaron de mi cadena. Tú serás uno más.', 'La caza ha empezado. Corre si quieres, pero mi cadena es larga.', 'Dicen que el tigre acecha en silencio. ¡Este no!'],
          reply: ['Grrr… Bien. Me gusta la presa que no huye.', 'No hace falta que te acerques. Ya te recojo yo.', 'Tus palabras son largas. Mi cadena, más.'],
          boss: 'Tú también eres una presa, Shura. Solo que un poco más grande.',
        },
        jin: {
          open: ['No he venido a derramar sangre. Solo te tumbaré un rato.', 'El bastón habla con paciencia. Escucha.', 'Tu camino está lleno de ira, joven. Aliviemos tu carga.'],
          reply: ['Muy bien. Pero luego tomaremos té juntos.', 'Tu ira te pesa. Deja que la cargue yo.', 'La espada corta; el bastón despierta.'],
          boss: 'Shura, no necesito destruirte para vencer al demonio que llevas dentro. Me basta con detenerte.',
        },
        mai: {
          open: ['El escenario está listo, el telón arriba. Tu papel: perder.', 'Cuando se abra mi abanico, no cierres los ojos. Te perderías el espectáculo.', 'Cada paso que doy es una nota. ¿Sabrás seguir el compás?'],
          reply: ['Qué entrada tan tosca. No importa, tengo gracia de sobra para los dos.', 'El viento sopla a mi favor, cariño.', 'No necesito aplausos. Me basta con tu caída.'],
          boss: 'Shura, en este último baile no comparto escenario con nadie.',
        },
        tsubame: {
          open: ['La distancia que nos separa es mi arma.', 'La golondrina falla una vez. A la segunda, gira y ataca.', 'He medido el viento. Mi flecha conoce su camino.'],
          reply: ['¿Quieres acercarte? Inténtalo.', 'Contén el aliento. Una flecha en vuelo no hace ruido.', 'Mi ojo está puesto en ti. Mi flecha, también.'],
          boss: 'Shura, en el cielo no hay dónde esconderse. Mi flecha te encontrará.',
        },
      },
      // Special match-ups: lines are spoken in the order written
      pairs: {
        'akane|aoi': [['akane', '¡Aoi! Es hora de terminar el duelo que dejamos a medias.'], ['aoi', 'El viento siempre sopla hacia el mismo fuego, Akane. Empieza.']],
        'kuro|tetsu': [['kuro', 'Caparazón de hierro. Veamos si está hueco.'], ['tetsu', 'Hasta la montaña se inclina ante la disciplina, Kuro.']],
        'hana|yuki': [['yuki', 'Las flores se marchitan en la nieve, Hana.'], ['hana', '¡Pues derretiré la nieve, Yuki!']],
        'kage|ren': [['ren', '¡Tus trucos de sombra no funcionan conmigo! ¡Da la cara!'], ['kage', 'Estoy aquí mismo, oni. Es que no sabes mirar.']],
        'akane|ren': [['akane', 'Solo quien no tiene honor se esconde tras una máscara.'], ['ren', '¿Honor? ¡El honor no llena la barriga!']],
        'aoi|yuki': [['aoi', 'Un viento frío sigue siendo viento, Yuki.'], ['yuki', 'Pero la nieve queda cuando el viento amaina.']],
        'kuro|tora': [['tora', '¿Una montaña, eh? En las montañas también viven tigres.'], ['kuro', 'Y en las montañas mueren.']],
        'tora|yuki': [['tora', '¡Un zorro! ¿Qué hace un zorro frente a un tigre?'], ['yuki', 'Huye. Y luego le congela la cola al tigre.']],
        'jin|tora': [['tora', '¿Qué harás cuando mi cadena se enrosque en tu bastón, monje?'], ['jin', 'Desatarla. Deshacer nudos es mi vocación.']],
        'jin|ren': [['ren', '¿Un monje? ¡Empieza a rezar, calvo!'], ['jin', 'Ya lo hago, oni. Por ti. El fuego que llevas dentro también te quema.']],
        'jin|tetsu': [['tetsu', '¿Qué pinta un monje en el campo de batalla?'], ['jin', 'Vengo por corazones acorazados como el tuyo, Tetsu. Tu armadura pesa; tu corazón, más.']],
        'akane|jin': [['akane', 'Apártate, monje. Esta venganza es mía.'], ['jin', 'La venganza es una cadena, Akane. Rompámosla primero.']],
        'hana|mai': [['hana', '¡Oh, otra bailarina! ¡A ver quién gira más rápido!'], ['mai', 'La velocidad es solo la sombra de la gracia, Hana. Deja que te muestre la luz.']],
        'kage|mai': [['mai', '¿Las sombras también bailan, Kage?'], ['kage', 'Solo cuando se apaga la luz.']],
        'aoi|tsubame': [['tsubame', '¿Puede tu viento desviar mi flecha, Aoi?'], ['aoi', 'El viento no toma partido, Tsubame. Ni siquiera por tu flecha.']],
        'kage|tsubame': [['kage', 'No puedes acertar a lo que no ves, arquera.'], ['tsubame', 'Las sombras llegan con la luz. Yo también.']],
        'mai|tsubame': [['mai', 'Mirar desde lejos es de mala educación, arquera. Ven a verlo de cerca.'], ['tsubame', 'Mandaré mi flecha a ver tu escenario de cerca.']],
      },
      endings: {
        akane: ['Cuando la espada de Shura golpeó la tierra, las campanas del templo sonaron solas.', 'Akane limpió la hoja carmesí y se inclinó ante la tumba de sus maestros: la deuda estaba saldada.', 'El camino que se abre ya no es la venganza, sino enseñar el honor a nuevos aprendices.'],
        aoi: ['Al caer Shura, la tormenta enmudeció; por primera vez en años, las nubes se abrieron.', 'Aoi envainó la espada y volvió al bosque de bambú.', 'Solo quedó el silbido del viento.'],
        kuro: ['Kuro enterró la máscara rota de Shura en la cima de la montaña.', 'No se dijo una palabra. Kuro se bajó el sombrero de paja y desapareció en la nieve.', 'En la aldea cuentan que aquel invierno no bajó de la montaña ni un solo bandido.'],
        yuki: ['El último aliento de Shura se volvió vaho en el aire frío y se desvaneció.', 'Yuki se ajustó la bufanda y se alejó sin dejar huellas en la nieve.', 'Desde aquel día, en la cumbre solo se ha visto la sombra de un zorro.'],
        hana: ['Cuando la máscara de Shura cayó al suelo, Hana dejó a su lado una rama de cerezo.', 'Esa noche el mercado se llenó de farolillos; los vítores más fuertes fueron para una kunoichi que bailaba sobre los tejados.', 'Nadie sabe adónde fue Hana. Solo quedan pétalos rosados a la deriva.'],
        tetsu: ['En el tejado del castillo, Tetsu partió en dos la espada de Shura contra la rodilla.', 'El estandarte del señor volvió a alzarse, y el viento lo hizo ondear con orgullo.', 'Deber cumplido. Pero el deber de un samurái nunca termina.'],
        ren: ['Ren colgó la máscara rota de Shura junto a la otra máscara oni. Dos oni, un vencedor.', 'Esa noche la aldea cantó; la risa más fuerte, como siempre, fue la de Ren.', 'Al amanecer, Ren ya estaba en camino. Rumbo a la siguiente pelea.'],
        kage: ['Cuando Shura cayó, la sombra de Kage se posó en silencio sobre el demonio caído.', 'Sin rastro, sin sonido; solo una sombra de más, estirándose bajo la luna.', 'Quizá siempre estuvo ahí. Quizá nunca existió.'],
        shura: ['En el tejado del castillo solo quedó en pie uno: quien llevaba la misma máscara, solo que más oscura.', 'Shura ya no busca rivales. Los rivales buscan a Shura.'],
        def: ['El último maestro ha caído. El camino de las sombras ya es tuyo.', 'Envaina tu hoja; la leyenda empieza ahora.'],
        tora: ['El tintineo de una cadena anunció la caída de Shura.', 'Tora colgó la máscara rota de la cadena: un nuevo trofeo de caza.', 'Desde aquel día, nadie en el bosque volvió a tomar el rugido del tigre por un cuento.'],
        jin: ['Jin se arrodilló junto a Shura, caído, y rezó.', 'De vuelta al templo, ni una gota de sangre manchaba el bastón.', 'Esa noche las campanas de la montaña volvieron a sonar; esta vez no por un duelo, sino por la paz.'],
        mai: ['Cuando Shura cayó, Mai cerró el abanico de golpe e hizo una reverencia.', 'El mercado nocturno aún habla de aquel baile.', 'Cayó el telón. Pero Mai nunca abandonó el escenario.'],
        tsubame: ['La última flecha vibraba en silencio, clavada en el tejado del castillo.', 'Tsubame se colgó el arco al hombro y vio a las golondrinas volar hacia el sur.', 'Nunca se la volvió a ver; solo quedaron flechas de plumas vivas clavadas en sus blancos.'],
      },
      roster2: {
        notes: {
          tora: ['Ligero: latigazo de cadena a media distancia, hoz en corto', 'Pesado: lanza la cadena; si acierta, atrae al rival', 'Cierre de combo: si el rival está lejos, la cadena lo arrastra hacia ti'],
          jin: ['Golpea con ambos extremos del bastón; son golpes contundentes que nunca hacen sangre', 'El tercer golpe y el barrido pesado derriban', 'La postura se llena más despacio mientras mantiene la guardia'],
          mai: ['Ventana de desvío más amplia', 'En guardia, los abanicos devuelven los proyectiles', 'Pesado: una ola de viento empuja al rival y dispersa los proyectiles'],
          tsubame: ['Pesado: dispara una flecha con el arco; mantén para un tiro cargado', 'Lanzamiento: salto mortal hacia atrás y flecha desde el aire', 'Sin flechas, el ataque pesado usa el tantō; las flechas se recargan con el tiempo'],
        },
      },
    });

    merge(EN.CHARS, {
      akane: { title: 'Hoja Carmesí', desc: 'Maestra equilibrada de la katana. Combo rápido de tres golpes, desvío sólido.', weapon: 'Katana' },
      aoi: { title: 'Viento Azul', desc: 'Ágil con la katana. Camina algo más rápido y se impulsa como el viento.', weapon: 'Katana' },
      kuro: { title: 'Montaña Negra', desc: 'Empuña una larga nodachi. Poca velocidad, pero mucho alcance y golpes devastadores.', weapon: 'Nodachi' },
      yuki: { title: 'Zorro de Nieve', desc: 'Golpea muy rápido con una kodachi corta. Muchos shuriken, bufanda larga.', weapon: 'Kodachi' },
      hana: { title: 'Danza del Cerezo', desc: 'Kunoichi. Pelea con dos tantō como si bailara; las manos más rápidas, el alcance más corto.', weapon: 'Tantō dobles' },
      tetsu: { title: 'Fortaleza de Hierro', desc: 'Samurái con armadura. La naginata le da el mayor alcance; los golpes apenas le hacen mella.', weapon: 'Naginata' },
      ren: { title: 'Oni Carmesí', desc: 'Camorrista con máscara oni. Aterra con golpes que rompen guardias y patadas devastadoras.', weapon: 'Uchigatana' },
      kage: { title: 'La Sombra Misma', desc: 'Sombra encapuchada. Rápida con el ninjatō, impulso largo; deja una sombra allá por donde pasa.', weapon: 'Ninjatō' },
      tora: { title: 'Tigre Encadenado', desc: 'Domina el kusarigama. Azota con la cadena lastrada a media distancia; el ataque pesado atrae al rival hacia la hoz.', weapon: 'Kusarigama' },
      jin: { title: 'Monje del Bastón', desc: 'Monje del bō. Un bastón largo que golpea con ambos extremos, guardia sólida y golpes contundentes que derriban; nunca hace sangre, solo sacude los huesos.', weapon: 'Bō' },
      mai: { title: 'Danza del Abanico', desc: 'Kunoichi del abanico de guerra. Muy rápida y con una amplia ventana de desvío; los abanicos devuelven proyectiles y su viento aleja a los rivales.', weapon: 'Tessen dobles' },
      tsubame: { title: 'Arquera Golondrina', desc: 'Lleva arco y tantō. Dispara flechas a distancia (mantén pesado para un tiro potente) y, si alguien se acerca, se aleja con un salto mortal y dispara desde el aire.', weapon: 'Yumi + Tantō' },
      shura: { title: 'El Maestro Carmesí', desc: 'Un maestro demoníaco cuyo camino está trazado en carmesí. Nodachi larga, golpes aplastantes, desvíos casi perfectos.', weapon: 'Nodachi' },
    });

    merge(EN.ARENAS, {
      temple: 'Templo bajo la Luna',
      rain: 'Bambú en Tormenta',
      snow: 'Cumbre Nevada',
      village: 'Aldea en Llamas',
      market: 'Mercado Nocturno',
      waterfall: 'Cascada',
      castle: 'Tejado del Castillo',
    });

    merge(EN.SPECIALS, {
      akane: { desc: 'Un tajo iai carmesí que atraviesa al rival en un parpadeo y deja en el aire una media luna ardiente.', tip: 'Desvíalo, o apártate con un impulso' },
      aoi: { desc: 'Un amplio barrido que lanza hacia delante una hoja de viento; una guardia en el momento justo la refleja.', tip: 'Salta, córtala con tu hoja o ponte en guardia en el momento justo' },
      kuro: { desc: 'Salta y parte el suelo con la nodachi; la onda expansiva que recorre el suelo aplasta guardias y derriba.', tip: 'Salta sobre la onda y golpea en el aire' },
      yuki: { desc: 'Una ráfaga de cinco golpes, rápida como el rayo, igual que una ventisca; el último derriba.', tip: 'Ponte en guardia y desvía el primer golpe' },
      hana: { desc: 'Avanza girando como un torbellino de flores de cerezo con los tantō dobles, cortando a ambos lados.', tip: 'Ponte en guardia, o impúlsate hacia atrás' },
      tetsu: { desc: 'Hace girar la naginata a su alrededor; los golpes no detienen el giro (superarmadura).', tip: 'Sal de su alcance, o desvíalo' },
      ren: { desc: 'Una carga con el hombro que destroza guardias, seguida de un corte ascendente que lanza al rival por los aires.', tip: 'La guardia no sirve: desvía, salta o impúlsate' },
      kage: { desc: 'Se desvanece en humo, deja atrás un clon de sombra y reaparece a espaldas del rival para atacar.', tip: 'Ponte en guardia en cuanto Kage reaparezca' },
      tora: { desc: 'Hace girar la cadena sobre la cabeza en un ciclón que siega todo a su alrededor; al rival atrapado lo atrae y la hoz lo lanza al cielo.', tip: 'Sal de su alcance o ponte en guardia: si no te atrapa, el tirón se queda en nada' },
      jin: { desc: 'Avanza haciendo girar el bastón como una rueda de diamante; tras cuatro golpes, un golpe ascendente lanza al rival.', tip: 'Impúlsate hacia atrás, o desvía el primer golpe' },
      mai: { desc: 'Levanta un torbellino que avanza, atrae al rival, lo corta y al final lo lanza al cielo.', tip: 'Ponte en guardia ante el torbellino en el momento justo o retrocede: se mueve despacio' },
      tsubame: { desc: 'Salta hacia atrás y hace llover flechas del cielo; si falla, suelta una flecha golondrina que gira y ataca por la espalda.', tip: 'Sal de las marcas del suelo; la flecha golondrina vuelve, así que cuida tu espalda' },
      shura: { desc: 'Ruge y se funde en humo carmesí para aparecer delante y detrás del rival y descargar tres pesados tajos de nodachi; el último lanza.', tip: 'Atento al destello carmesí: desviar un tajo corta la técnica; la guardia aplasta tu postura' },
    });

    merge(EN.TXT, {
      gbreak: '¡POSTURA ROTA!', cut: '¡CORTADO!', reflect: '¡REFLEJADO!', parry: '¡DESVÍO!', caught: '¡ATRAPADO!',
      swallowHit: '燕!', vajraHit: '金剛!', whirlHit: '旋風の舞',
    });

    merge(EN.AI_LEVELS, { 0: 'Aprendiz', 1: 'Maestro', 2: 'Leyenda', 3: 'Shura' });

    EN.NUMWORDS = ['Cero', 'Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve', 'Diez', 'Once', 'Doce'];

    // ================================================================ static HTML, hardcoded literals, canvas pop-ups
    merge(EN.PHRASES, {
      // ---------------------------------------------------------------- index.html: <title>, brand, HUD
      'Gölge Düellosu': 'Shadow Duel',
      'Duraklat': 'Pausa',
      'KARŞILIKLI SERİ': 'INTERCAMBIO',
      'SON DARBE': 'GOLPE FINAL',
      'atlamak için bir tuşa bas': 'pulsa una tecla para omitir',
      // touch buttons (static fallbacks of data-s="touch.btn.*")
      'GARD': 'GUARDIA',
      'HAFİF': 'LIGERO',
      'SALDIR': 'ATAQUE',
      'AĞIR': 'PESADO',
      'ATIL': 'IMPULSO',
      'TEKME': 'PATADA',
      // ---------------------------------------------------------------- main menu
      'Sekiz savaşçı, üç arena. Gerçek zamanlı kılıç çarpışması, kılıç kilitlenmesi, savuşturma, denge kırma, Gölge Kesiği ve ragdoll fiziği.': 'Ocho luchadores, tres arenas. Choques de espadas en tiempo real, filos trabados, desvíos, posturas rotas, el Tajo de Sombra y física ragdoll.',
      'İki Oyuncu': 'Dos jugadores',
      'Aynı klavyede ya da iki gamepad ile kafa kafaya': 'Cara a cara en un teclado o con dos mandos',
      'CPU\'ya Karşı': 'Contra CPU',
      'Ninjanı seç, rakibini yapay zekâ yönetsin': 'Elige tu ninja; la IA controla a tu rival',
      'Zorluk': 'Dificultad',
      'Çırak': 'Aprendiz',
      'Usta': 'Maestro',
      'Efsane': 'Leyenda',
      'Aylık Turnuva': 'Torneo mensual',
      'Dan Sınavı': 'Examen Dan',
      'Şampiyonlar Salonu': 'Salón de campeones',
      'Seyret': 'Ver',
      'Rastgele iki ninja, Efsane yapay zekâ': 'Dos ninjas al azar, IA Leyenda',
      'Ses': 'Sonido',
      'Müzik': 'Música',
      'Kan efekti': 'Sangre',
      'Tuş ipuçları': 'Ayuda de teclas',
      'Yüksek grafik': 'Gráficos altos',
      // ---------------------------------------------------------------- controls card
      'Kontroller': 'Controles',
      '1. Oyuncu': 'Jugador 1',
      '2. Oyuncu': 'Jugador 2',
      'Yürü': 'Caminar',
      'Zıpla': 'Saltar',
      'Gard (basılı tut)': 'Guardia (mantener)',
      'Hafif kesik (×3 kombo)': 'Corte ligero (combo ×3)',
      'Ağır kesik': 'Corte pesado',
      'Tekme': 'Patada',
      'Sol Shift': 'Shift izq.',
      'Sağ Shift': 'Shift der.',
      'Atılma': 'Impulso',
      'Ki tekniği (ki dolu)': 'Técnica ki (ki lleno)',
      // ---------------------------------------------------------------- select screen
      'Ninjanı seç': 'Elige tu ninja',
      'Hazır': 'Listo',
      '1. oyuncunun ninjası': 'Ninja del jugador 1',
      '2. oyuncunun ninjası': 'Ninja del jugador 2',
      'Önceki ninja': 'Ninja anterior',
      'Sonraki ninja': 'Ninja siguiente',
      '1. oyuncu kadrosu': 'Ninjas del jugador 1',
      '2. oyuncu kadrosu': 'Ninjas del jugador 2',
      'Dövüşe başla': 'Empezar combate',
      'Geri': 'Volver',
      'Kilitli': 'Bloqueado',
      'Rastgele': 'Aleatorio',
      'Hız': 'Velocidad',
      'Güç': 'Fuerza',
      'Menzil': 'Alcance',
      'Can': 'Vida',
      // ---------------------------------------------------------------- pause / end
      'Duraklatıldı': 'En pausa',
      'Devam et': 'Continuar',
      'Maçı yeniden başlat': 'Reiniciar combate',
      'Ana menü': 'Menú principal',
      'Rövanş': 'Revancha',
      'Karakter değiştir': 'Cambiar de ninja',
      'Zafer senin': 'La victoria es tuya',
      'Raund': 'Asaltos',
      'Verilen hasar': 'Daño causado',
      'Savuşturma': 'Desvíos',
      'Ki Saldırısı': 'Ataques ki',
      // ---------------------------------------------------------------- training / leaderboard / misc
      'Antrenman': 'Entrenamiento',
      'ANTRENMAN': 'ENTRENAMIENTO',
      'Sıralama': 'Clasificación',
      'Tümü': 'Todos',
      'Ekranı yan çevir': 'Gira la pantalla',
      'Performans için grafik düşürüldü': 'Gráficos reducidos para ganar fluidez',
      // hidden boss pushed into ND.CHARS by arcade.js (safety net; ES.CHARS.shura should carry the same)
      'Kanlı Usta': 'El Maestro Sangriento',
      'Yolunu kanla çizen iblis usta. Uzun nodachi, yıkıcı darbeler, neredeyse kusursuz savuşturma.': 'Un maestro demoníaco que se abre camino con sangre. Nodachi larga, golpes aplastantes, desvíos casi perfectos.',
      // ---------------------------------------------------------------- HUD tags (fallbacks when STR.hud is missing)
      'SEN': 'TÚ',
      'KUKLA': 'MUÑECO',
      // ---------------------------------------------------------------- round banners (#bt / #bs)
      'Son raund': 'Último asalto',
      'Kazanan her şeyi alır': 'Quien gane se lo lleva todo',
      'İlk iki raundu alan kazanır': 'Gana quien se lleve dos asaltos',
      'Dövüş!': '¡Lucha!',
      'Süre doldu': 'Se acabó el tiempo',
      'Berabere': 'Empate',
      'Çifte K.O.': 'Doble K.O.',
      'Mükemmel': 'Perfecto',
      // blade-lock hint (fallbacks of STR.hud.lockSolo / lockDuo)
      'F / K tuşuna hızlıca bas!': '¡Machaca F / K!',
      'Hafif ya da ağır tuşuna hızlıca bas!': '¡Machaca ligero o pesado!',
      // counter / parry prompt labels under the key ring (ctx.fillText in drawPrompts)
      'KARŞILIK': 'CONTRA',
      'SAVUŞTUR': 'DESVÍA',
      // ---------------------------------------------------------------- canvas pop-ups (fx.text)
      'SON VURUŞ!': '¡REMATE!',
      'KİLİTLENDİ!': '¡TRABADOS!',
      'İTTİ!': '¡EMPUJÓN!',
      'DENGE KIRILDI!': '¡POSTURA ROTA!',
      'GARD KIRILDI!': '¡GUARDIA ROTA!',
      'KESİLDİ!': '¡CORTADO!',
      'YANSITMA!': '¡REFLEJO!',
      'SAVUŞTURMA!': '¡DESVÍO!',
      'YAKALANDI!': '¡ATRAPADO!',
      'ZIRH!': '¡ARMADURA!',
      'ARKADAN!': '¡A TRAICIÓN!',
      'DUVAR!': '¡PARED!',
      'KAFA!': '¡CABEZA!',
      'KARŞI!': '¡A CONTRAPIÉ!',
      'KRİTİK!': '¡CRÍTICO!',
      'SÜPÜRME!': '¡BARRIDO!',
      'KARŞILIK!': '¡CONTRA!',
      'YERE SERİLDİ': 'DERRIBO',
      'ÇARPIŞMA!': '¡CHOQUE!',
    });

    merge(EN.HTML, {
      // brand title (the game keeps its English name)
      'Gölge<br><em>Düel</em><em>losu</em>': 'Shadow<br><em>Du</em><em>el</em>',
      // tips list (<ul class="tips">)
      '<b>Savuşturma:</b> darbe gelmeden hemen önce gard tuşuna bas; rakip sendeler.':
        '<b>Desvío:</b> pulsa guardia justo antes de que llegue el golpe; tu rival se tambalea.',
      '<b>Karşılık (返し技):</b> gard ya da savuşturmanın hemen ardından saldırı tuşu → anında karşı kesik. <b>İleri</b> + hafif = bacağa süpürme, <b>geri</b> + hafif = yanından dönüp arkadan kesme, <b>ağır</b> = güçlü karşı darbe.':
        '<b>Contra (返し技):</b> ataca justo después de una guardia o un desvío → contracorte instantáneo. <b>Adelante</b> + ligero = barrido a las piernas, <b>atrás</b> + ligero = cruce que corta por la espalda, <b>pesado</b> = contragolpe potente.',
      '<b>Karşılıklı seri:</b> karşılık da karşılanabilir. Her turda vuruşlar hızlanır ve güçlenir; kendi 3. karşılığın üç vuruşluk sinematik bir bitirişe dönüşür. Seriyi kıran darbe ağır çekimde iner.':
        '<b>Intercambio:</b> las contras también se pueden contrarrestar. Cada intercambio es más rápido y más duro; tu 3.ª contra se convierte en un remate cinematográfico de tres golpes. El golpe que rompe el intercambio cae a cámara lenta.',
      '<b>Kılıç kilidi:</b> kılıçlar çarpışınca kilitlenebilir. Hafif/ağır tuşuna hızlı basan rakibini iter.':
        '<b>Traba de filos:</b> al chocar, las hojas pueden trabarse. Quien machaque ligero/pesado más rápido empuja al otro.',
      '<b>Ki barı</b> vurdukça, yedikçe ve savuşturdukça dolar. Dolunca her ninjanın kendine özgü ki tekniği açılır (Antrenman’daki hareket listesinde görebilirsin).':
        'La <b>barra de ki</b> se llena al golpear, al recibir golpes y al desviar. Cuando está llena, se activa la técnica ki propia de cada ninja (búscala en la lista de movimientos del Entrenamiento).',
      '<b>Atılma + hafif</b> = atılarak kesik. <b>Havada</b> hafif = hava kesiği, ağır = dalış. Ağır kesik yere serer, duvara çarpan geri seker.':
        '<b>Impulso + ligero</b> = corte en impulso. <b>En el aire</b>, ligero = corte aéreo, pesado = picado. El corte pesado derriba; quien choca contra una pared rebota.',
      '<b>Denge çubuğu</b> dolarsa gard kırılır. Tekme gardı delip dengeyi hızla doldurur.':
        'Cuando la <b>barra de postura</b> se llena, la guardia se rompe. Las patadas atraviesan la guardia y llenan la postura rápido.',
      // gamepad note (Esc -> Start or P)
      'Gamepad: X hafif · Y ağır · B tekme · A zıpla · LB gard · RB shuriken · RT atılma · R3 ki tekniği. Start ya da <kbd>P</kbd> duraklatır. CPU modunda her iki tuş seti de seni yönetir.':
        'Mando: X ligero · Y pesado · B patada · A saltar · LB guardia · RB shuriken · RT impulso · R3 técnica ki. Start o <kbd>P</kbd> pausa el juego. En modo CPU, los dos juegos de teclas te controlan a ti.',
      // select / VS hints (Esc -> ⌫)
      '<kbd>Enter</kbd> başlatır · <kbd>⌫</kbd> menüye döner': '<kbd>Enter</kbd> empezar · <kbd>⌫</kbd> volver',
      '<kbd>Enter</kbd> / <kbd>F</kbd> başlatır · <kbd>⌫</kbd> çıkar': '<kbd>Enter</kbd> / <kbd>F</kbd> empezar · <kbd>⌫</kbd> salir',
    });

    EN.PATTERNS.push(
      // HUD round label (#rlabel) and round banner
      [/^RAUND (\d+)$/, 'ASALTO $1'],
      [/^(\d+)\. Raund$/, 'Asalto $1'],
      // canvas pop-ups built from numbers
      [/^(\d+)\. KARŞILIK$/, 'CONTRA ×$1'],
      [/^(\d+) VURUŞLUK SERİ!$/, '¡INTERCAMBIO ×$1!'],
      // time-up banner sub: `${name} önde`
      [/^(.+) önde$/, (m, n) => I.t(n) + ' va en cabeza'],
      // end screen title: `${Name} kazandı`
      [/^(.+) kazandı$/, (m, n) => I.t(n) + ' gana'],
      // end screen sub line: `${a} – ${b} · ${round} raund · ${arenaName}`
      [/^(\d+) – (\d+) · (\d+) raund · (.+)$/, (m, a, b, r, ar) => `${a} – ${b} · ${r} ${r === '1' ? 'asalto' : 'asaltos'} · ${I.t(ar)}`],
    );

    // ================================================================ added with the portal build (PLAY, ads, coach)
    merge(EN.STR, {
      menu: { play: 'Jugar', playSub: (name, lv) => `${name} vs CPU · ${lv}` },
      first: { play: 'Jugar', sub: 'Un toque y a luchar', menu: 'Todos los modos' },
      ads: {
        cont: 'Continuar desde aquí', contSub: 'Mira un anuncio · reintenta sin penalización',
        trial: (name) => `Prueba a ${name} en un combate`, trialSub: 'Mira un anuncio',
        fail: 'Ahora no hay anuncios; inténtalo en un momento',
      },
      coach: {
        attack: (l) => `${l} Atacar`,
        guard: (l, g) => `Mantén ${g}: guardia`,
        parry: (l, g) => `Pulsa ${g} justo antes del golpe: desvío`,
        attackT: (l) => `Toca ${l} · sigue tocando: combo`,
        guardT: (l, g) => `Mantén ${g}: guardia`,
        parryT: (l, g) => `Toca ${g} justo antes del golpe: desvío`,
      },
    });

    // ================================================================ VOLUME: sliders on the menu card and in pause (js/volume.js)
    merge(EN.STR, {
      vol: {
        title: 'Volumen', master: 'General', music: 'Música', sfx: 'Efectos', sound: 'Sonido',
        pct: (n) => `${n} %`,
        muted: 'El sonido está desactivado. Mueve un control para volver a activarlo.',
        // Settings > Audio: character / announcer voices switch (js/voice.js) and the courtesy credit under it
        voice: 'Voces',
        credit: 'Voces: ユーフルカ (youfulca.com) · 効果音ラボ · すぱらんど',
      },
    });

    // ================================================================ TOUCH LAYOUT EDITOR: movement modes + "Customize controls"
    merge(EN.STR, {
      tedit: {
        move: 'Movimiento',
        moves: { float: 'Joystick', fixed: 'Joystick fijo', dpad: 'Cruceta' },
        mnote: {
          float: 'El joystick aparece donde apoyes el pulgar.',
          fixed: 'El joystick se queda donde lo pongas; empuja desde su centro.',
          dpad: 'Botones separados: mantén para caminar, doble toque para impulso. Pulsa entre dos botones para ambos (▶ + ▲ = salto adelante).',
          dtap: 'Botones separados: un toque rápido en ◀ ▶ da un paso corto; mantén para caminar, doble toque para impulso.',
        },
        dtap: 'Toque = paso',
        edit: 'Personalizar controles',
        title: 'Personalizar controles',
        hint: 'Arrastra un botón a donde quieras. Tócalo para cambiar su tamaño u opacidad, u ocultarlo.',
        rotate: 'Gira la pantalla para colocar los controles de combate.',
        shapes: { phone: 'Móvil', tablet: 'Tableta', portrait: 'Vertical' },
        screenNote: 'El diseño se guarda para esta forma de pantalla: móviles y tabletas guardan el suyo.',
        save: 'Guardar', cancel: 'Cancelar', options: 'Opciones', done: 'Listo', close: 'Cerrar',
        size: 'Tamaño', sizes: { s: 'P', m: 'M', l: 'G', xl: 'XG' },
        opacity: 'Opacidad', opacityAll: 'Opacidad (todos)',
        hide: 'Ocultar', show: 'Mostrar', hidden: 'Oculto',
        snap: 'Ajustar a la cuadrícula',
        presets: 'Preajustes', pRight: 'Diestro', pLeft: 'Zurdo', pSplit: 'Guardia a la izquierda',
        reset: 'Restablecer', resetDone: 'Diseño por defecto restaurado (se aplica al guardar).',
        overlap: 'Los botones no pueden solaparse: movido al hueco libre más cercano.',
        noRoom: 'No hay sitio ahí: el botón ha vuelto a su lugar.',
        saved: 'Controles guardados',
        throwName: 'SHURIKEN',
        pauseName: 'Pausa',
        dirs: { dl: '◀ Izquierda', dr: 'Derecha ▶', du: '▲ Saltar', dd: '▼ Guardia' },
      },
    });

    // ================================================================ PROGRESSION: honor, rival challenges, moves panel
    merge(EN.STR, {
      menu: { arcadeDesc: 'Vence a tus rivales uno a uno mientras sube la dificultad; al final te espera un maestro oculto. La mayor fuente de honor.' },
      sel: {
        title: { rival: 'Desafío rival · Elige tu ninja' },
        go: { rival: 'Aceptar el duelo' },
        moves: 'Movimientos',
        movesOf: (name) => `${name} · Movimientos`,
        close: 'Cerrar',
      },
      hint: {
        honor: (have, need) => `Honor ${num(Math.min(have, need))}/${num(need)} → se abre el Desafío rival`,
        ready: '¡Te espera un desafío!',
        arenaHonor: (have, need) => `Se abre con ${num(need)} de honor (${num(Math.min(have, need))}/${num(need)})`,
      },
      honor: {
        name: 'Honor',
        head: 'Honor',
        rows: { win: 'Victoria', loss: 'Presentarse', rounds: 'Asaltos ganados', perfect: 'Asalto perfecto', rally: 'Intercambio de contras', counter: 'Contra', parry: 'Desvío', rivalWin: 'Desafío rival', arcadeClear: 'Arcade completado' },
        total: (n) => `Honor: ${num(n)}`,
        next: (name, left) => `Siguiente ninja: ${name} — faltan ${num(left)} de honor`,
        bar: (have, need) => `Honor ${num(Math.min(have, need))}/${num(need)} → se abre el Desafío rival`,
        ready: (name) => `¡${name} te desafía!`,
        readyGo: 'Aceptar',
        all: 'Todos los ninjas desbloqueados',
        bonus: { arcadeClear: 'Arcade completado', tourneyClear: 'Torneo conquistado', danPass: 'Examen Dan superado', rivalWin: 'Desafío rival ganado', tutorial: 'Tutorial completado' },
        bonusToast: (n, what) => `+${num(n)} de honor · ${what}`,
        road: 'Camino del honor',
        roadSub: 'Ganas honor en todos los modos para un jugador. Cuando alcanzas la marca de un ninja, te reta a un duelo; si ganas, se une a ti.',
        earnHead: 'De dónde sale el honor',
        earn: (H) => [
          ['Contra CPU', `Victoria: Aprendiz ${H.win[0]} · Maestro ${H.win[1]} · Leyenda ${H.win[2]}`],
          ['Arcade', `Victorias según dificultad · Shura ${H.win[3]} · completarlo +${H.arcadeClear}`],
          ['Torneo y Dan', `Victorias ×${H.modeMul.tourney} · conquistar el torneo +${H.tourneyClear} · cada examen Dan +${H.danPass(1)} o más`],
          ['Incluso al perder', `Presentarte ${H.loss} · cada asalto ganado ${H.roundWon}`],
          ['Buen juego', `Desvíos, contras, intercambios, asaltos perfectos: hasta +${H.styleCap} por combate`],
        ],
        rivalsHead: 'Rivales',
        arenasHead: 'Arenas',
        open: 'Desbloqueado',
        castle: 'Vence a Shura en Arcade',
        you: (n) => `Tu honor: ${num(n)}`,
      },
      rival: {
        stage: 'Desafío rival',
        selTitle: (name) => `${name} te desafía · Elige tu ninja`,
        lvHp: (lv, p) => (p === 100 ? lv : `${lv} · vida rival ${p} %`),
        accept: 'Aceptar el desafío',
        acceptSub: (name) => `Gana y ${name} se unirá a ti`,
        quit: 'Retirarse',
        hud: 'DESAFÍO RIVAL',
        winTitle: (name) => `¡${name} se une a ti!`,
        winSub: (name) => `${name} ya está en la pantalla de selección. ¡A probar!`,
        tryNew: (name) => `Jugar con ${name}`,
        lossTitle: 'El desafío sigue en pie',
        lossSub: (name, p) => `${name} ganó esta vez. Perder no te cuesta nada; la próxima vez empezará con un ${p} % de vida.`,
        lossSubMin: (name) => `${name} ganó esta vez. Perder no te cuesta nada; inténtalo otra vez.`,
        retry: 'Desafiar de nuevo',
        reveal: 'Nuevo ninja',
        toastReady: (name) => `¡${name} te desafía!`,
        lines: {
          hana: '¡Me han hablado de tu honor, todo el mercado habla de ti! ¡Sigue el ritmo de mi baile y me iré contigo!',
          tetsu: 'Tu nombre llegó a mis oídos. Derrótame y mi naginata luchará a tu lado.',
          ren: '¡Ja! ¡Por fin alguien me llama! Gana y me uno a ti; pierde y tendrás que oír mis carcajadas.',
          kage: 'Llevo un tiempo observándote. Atrapa mi sombra y seré tu sombra.',
          tora: 'Demuestra que no eres una presa. Escápate de mi cadena y caminaré a tu lado.',
          jin: 'Si tu honor nace del corazón, mi bastón lo sabrá. Ven, deja que te ponga a prueba.',
          mai: 'Te invito a mi escenario. Gánate mi aplauso y mi baile será tuyo.',
          tsubame: 'Te he observado desde lejos; tienes talento. Esquiva mis flechas y mi arco estará contigo.',
        },
      },
    });

    // ================================================================ COMBAT: new kits, combos, move list (combat designer)
    merge(EN.CHARS, {
      akane: { desc: 'Maestra del iaijutsu. La hoja espera en la vaina y cada corte es un desenvaine; su postura de desenvaine atrapa los golpes que le llegan.', weapon: 'Katana (iai)' },
      aoi: { desc: 'Esgrimista del viento con tachi a una mano. Estocadas de largo alcance y pasos de viento que acortan cualquier distancia en un solo movimiento.', weapon: 'Tachi' },
      ren: { desc: 'Camorrista con máscara oni. Espada al hombro; pelea con codos, rodillas, hombro y cabeza, y aplasta guardias.' },
      kage: { desc: 'Sombra encapuchada. Empuña el ninjatō con agarre invertido; pelea con pasos de sombra, fintas y bombas de humo.' },
    });
    merge(EN.TXT, { kiCancel: '¡CANCELACIÓN KI!', launch: '¡AL AIRE!', iaiCatch: '¡IAI GAESHI!' });
    EN.PATTERNS.push([/^(\d+) VURUŞ$/, '$1 GOLPES']);
    merge(EN.PHRASES, {
      // shared rows
      'Tekme': 'Patada',
      'Tekme: dengeyi hızla doldurur, gardı kırmaya yarar. Ardından AĞIR ile seri bitirişine bağlanır.': 'Patada: llena la postura rápido y ayuda a romper guardias. Sigue con PESADO para cerrar la cadena.',
      'Shuriken fırlatır; zamanla yeniden dolar.': 'Lanza un shuriken; se recargan con el tiempo.',
      'Hava kesiği': 'Corte aéreo',
      'Havada hafif kesik. Havaya fırlatılmış rakibe de vurur.': 'Un corte ligero en el aire. También alcanza a un rival lanzado.',
      'Dalış': 'Picado',
      'Havadan aşağı dalış kesiği; yere serer.': 'Un corte en picado desde el aire; derriba.',
      'Kaeshi-waza (karşılık)': 'Kaeshi-waza (contra)',
      'Gard ya da savuşturmanın hemen ardından karşılık: nötr Suriage, ileri Harai (yere serer), geri Nuki (arkaya geçer), ağır Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.': 'Contra justo después de una guardia o un desvío: neutral Suriage, adelante Harai (derriba), atrás Nuki (se cuela detrás), pesado Uchiotoshi. Tu tercera respuesta es el remate; si la desvían, el intercambio continúa.',
      'Fırlatıcı isabet edince HAFİF: rakibin peşinden sıçrayıp havada keser. Ardından AĞIR ile yere çakar. Havadaki rakip en çok üç vuruş alır.': 'Cuando el lanzador acierta, LIGERO: salta tras el rival y córtalo en el aire. Luego PESADO lo estrella contra el suelo. Un rival en el aire recibe como mucho tres golpes.',
      'Üç vuruşluk hafif seri. İkinci ve üçüncü vuruş ki doluyken tekniğe bağlanır.': 'Cadena ligera de tres golpes. Con el ki lleno, el segundo y el tercer golpe se cancelan en la técnica ki.',
      'Ağır vuruş: yavaş ama yere serer.': 'Golpe pesado: lento, pero derriba.',
      'İleri atılarak dürter; hafif seriye devam eder.': 'Se lanza adelante con una estocada; sigue con la cadena ligera.',
      'Yarım adım geri çekilip bacaklara alçak süpürme; yere serer.': 'Medio paso atrás y un barrido bajo a las piernas; derriba.',
      'Fırlatıcı: yükselen kesik rakibi havaya kaldırır.': 'Lanzador: un corte ascendente eleva al rival por los aires.',
      'Sıçrayıp tepeden iner: yavaş ama gardı ezer, yere serer.': 'Salta y cae desde arriba: lento, pero aplasta la guardia y derriba.',
      'Atılırken dönerek geniş kesik; yere serer.': 'Un amplio corte giratorio al salir de un impulso; derriba.',
      'İki kesiklik seri bitirişi; son kesik yere serer.': 'Cierre de cadena de dos cortes; el último derriba.',
      'Rakibin kılıcını aşağı çarpıp dürter: gardı ezer.': 'Abate la hoja del rival y lanza una estocada: aplasta la guardia.',
      // Akane
      'Kından yatay çekiş kesiği, çapraz iniş, geri dönen kesik; kılıç her seferinde kınına döner.': 'Un corte de desenvaine horizontal, un corte diagonal descendente y un corte de vuelta; la hoja regresa a la vaina cada vez.',
      'Derin çömelişten geniş yatay çekiş; yere serer.': 'Un amplio desenvaine horizontal desde una postura baja; derriba.',
      'Atılarak kından çekiş: uzak mesafeyi bir anda kapatır, seriye devam eder.': 'Desenvaine en impulso: cierra una gran distancia en un instante y sigue la cadena.',
      'Kılıcı çekmeden kabzayla göğse vurur: hızlı, sersemletir. Ardından HAFİF ile Kesa ya da AĞIR ile Kurenai Renga.': 'Golpea el pecho con la empuñadura sin desenvainar: rápido y aturde. Sigue con LIGERO para Kesa o con PESADO para Kurenai Renga.',
      'Fırlatıcı: kından yükselen çekiş rakibi havaya kaldırır.': 'Lanzador: un desenvaine ascendente eleva al rival por los aires.',
      'Çekiş duruşu: kısa bir an bekler; bu sırada gelen yakın dövüş darbesini yakalar ve kaçınılmaz bir iai kesiğiyle karşılık verir. Boşa giderse açık kalır.': 'Postura de desenvaine: espera un instante; si en ese momento llega un golpe cuerpo a cuerpo, lo atrapa y responde con un corte iai inevitable. Si no llega nada, queda expuesta.',
      'Kesa’dan sonra yükselen ve inen iki çekiş kesiği; son kesik yere serer.': 'Tras Kesa, dos cortes de desenvaine, uno ascendente y otro descendente; el último derriba.',
      'Tekmeden sonra çömelip rakibin içinden geçen kızıl iai; arkasında belirir.': 'Tras la patada, un iai carmesí agachada que atraviesa al rival; reaparece a su espalda.',
      // Aoi
      'Tek elle uzun dürtüş, yukarı savrulan kesik ve rüzgâr adımıyla derin atılma dürtüşü.': 'Una larga estocada a una mano, un corte ascendente de muñeca y una profunda estocada a fondo con paso de viento.',
      'Dönerek geniş yatay kesik; yere serer.': 'Un amplio corte horizontal con giro; derriba.',
      'Rüzgâr adımı: çok uzaktan tek hamlede dürter, seriye devam eder.': 'Paso de viento: una estocada desde muy lejos en un solo movimiento; sigue la cadena.',
      'Geri çekilirken uzun menzilli iniş kesiği: yaklaşanı cezalandırır.': 'Un largo corte descendente mientras retrocede: castiga a quien se acerca.',
      'Fırlatıcı: dönerek yükselen kesik rakibi havaya kaldırır.': 'Lanzador: un corte ascendente giratorio eleva al rival por los aires.',
      'Geri sıçrar, ardından çok uzağa uzanan dürtüşle geri döner: gardı ezer, yere serer.': 'Salta hacia atrás y vuelve con una estocada larguísima: aplasta la guardia y derriba.',
      'Üç hızlı dürtüş; sonuncusu rüzgârla rakibi savurur.': 'Tres estocadas rápidas; la última se lleva al rival con el viento.',
      'İki kez dönerek çevresini biçen kesik; gardı ezer.': 'Gira dos veces cortando a su alrededor; aplasta la guardia.',
      // Ren
      'Kesik · Dirsek · Diz': 'Corte · Codo · Rodilla',
      'Tek elle kesik, dirsek darbesi ve uçan diz: kılıçla başlayıp bedenle biter.': 'Un corte a una mano, un codazo y un rodillazo volador: empieza con la espada y termina con el cuerpo.',
      'İki elle tepeden ezici iniş; gardı zorlar, yere serer.': 'Un golpe aplastante a dos manos desde arriba; castiga la guardia y derriba.',
      'Omuz hücumu: öne atılıp omuzla çarpar, dengeyi sarsar. İsabet ederse seriye devam eder.': 'Carga con el hombro: se lanza y embiste con el hombro, sacudiendo la postura. Si acierta, sigue la cadena.',
      'Kafa atar: kısa menzil, uzun sersemletme. İsabet ederse seriye devam eder.': 'Cabezazo: poco alcance, aturdimiento largo. Si acierta, sigue la cadena.',
      'Fırlatıcı: aşağıdan yukarı iki elle savrulan kesik.': 'Lanzador: un corte a dos manos de abajo arriba.',
      'Topuğu havaya kaldırıp balta gibi indirir: yere serer.': 'Alza el talón y lo deja caer como un hacha: derriba.',
      'Dirsekten sonra kesik ve tepeden ezici iniş; son vuruş yere serer.': 'Tras el codazo, un corte y un golpe aplastante desde arriba; el último golpe derriba.',
      'Tekmenin ardından dönen topuk tekmesi; yere serer.': 'Tras la patada, una patada giratoria de talón; derriba.',
      // Kage
      'Ters tutuşla kesik, dönen kesik ve gölge adımı: kaybolup öne geçer, dürterek belirir.': 'Un corte con agarre invertido, un corte giratorio y un paso de sombra: desaparece, se adelanta y reaparece con una estocada.',
      'Sıçrayıp ters tutuşla aşağı saplar; yere serer.': 'Salta y apuñala hacia abajo con agarre invertido; derriba.',
      'Gölge gibi uzun atılma kesiği; seriye devam eder.': 'Un largo corte en impulso, como una sombra; sigue la cadena.',
      'Aldatma: kesecekmiş gibi parlar, dumanla geri kaçar. Erken savuşturmayı boşa çıkarır; hemen HAFİF ile gölge adımına, AĞIR ile Kage-nui’ye bağlanır.': 'Finta: destella como si fuera a cortar y se escabulle hacia atrás entre el humo. Hace fallar un desvío temprano; enlaza al instante con el paso de sombra (LIGERO) o con Kage-nui (PESADO).',
      'Fırlatıcı: ters tutuşla yükselen kesik.': 'Lanzador: un corte ascendente con agarre invertido.',
      'Ayağının dibine sis bombası atar: yakındakini sersemletir, Kage dumanın içinde geri kaçar.': 'Lanza una bomba de humo a sus pies: aturde a quien esté cerca mientras Kage se escabulle hacia atrás dentro del humo.',
      'Üç hızlı ters kesik ve aşağı saplama; sonuncusu yere serer.': 'Tres cortes invertidos rápidos y una puñalada hacia abajo; la última derriba.',
      'Tekmeden sonra dumanda kaybolur, rakibin arkasında belirip saplar.': 'Tras la patada, desaparece en el humo y reaparece a espaldas del rival para apuñalarlo.',
      // template row names
      'Nodachi serisi': 'Cadena de nodachi', 'Ağır nodachi': 'Nodachi pesada', 'Kodachi serisi': 'Cadena de kodachi', 'Ağır kesik': 'Corte pesado',
      'Tantō dansı': 'Danza de tantō', 'Çift kesik': 'Corte doble', 'Naginata serisi': 'Cadena de naginata', 'Ağır savuruş': 'Tajo pesado',
      'Zincir ve orak': 'Cadena y hoz', 'Zincir çekişi': 'Tirón de cadena', 'Asa serisi': 'Cadena de bastón', 'Ağır süpürme': 'Barrido pesado',
      'Yelpaze serisi': 'Cadena de abanico', 'Rüzgâr dalgası': 'Ola de viento', 'Tantō serisi': 'Cadena de tantō', 'Ok (basılı tut: güçlü)': 'Flecha (mantén: tiro potente)',
      'Geri + AĞIR da ok atar (basılı tut: güçlü atış); ok kalmadıysa tantō ile tepeden iner.': 'Atrás + PESADO también dispara una flecha (mantén para un tiro potente); sin flechas, cae desde arriba con el tantō.',
      // combat pop-ups
      'KI İPTALİ!': '¡CANCELACIÓN KI!', 'HAVAYA!': '¡AL AIRE!',
    });

    // ================================================================ COUNTER CINEMATIC + COMBO TRIAL (combat feel pass)
    {
      const tb = (t, c) => `<i class="tb${c ? ' ' + c : ''}">${t}</i>`;
      merge(EN.STR, {
        kaeshi: {
          head: 'KAESHI-WAZA', strike: '¡CORTA!', hits: 'GOLPES',
          labels: {
            suriage: 'Sube por su hoja y corta en diagonal',
            harai: 'Aparta su hoja y corta las piernas',
            nuki: 'Esquiva el golpe y corta por la espalda',
            uchiotoshi: 'Abate su hoja y atraviesa',
            sandan: "Contra de tres cortes",
          },
        },
        trial: {
          title: 'Prueba de combo',
          btn: { prev: 'Combo anterior', next: 'Combo siguiente', retry: 'Empezar de nuevo', close: 'Cerrar' },
          names: { chain: 'Cadena básica', s1: 'Cierre de cadena', s2: 'Cadena con patada', launch: 'Lanzador', s3: 'Combo largo' },
          desc: {
            chain: '{L} tres veces. Pulsa cada uno cuando entre el golpe anterior; la cadena acaba en un remate con nombre propio.',
            s1: '{L} dos veces y luego {H}: la cadena acaba con un corte pesado.',
            s2: '{L}, patada {K} y luego {H}.',
            launch: '{D} + {H} lanza; mientras vuela, {L} y luego {H}.',
            s3: 'Dos {L}, {D} + {H} para lanzar, {L}, {H}: cinco golpes.',
          },
          ready: (w) => `Empieza: ${w}`,
          startWith: (w) => `Este combo empieza con ${w}.`,
          early: 'Demasiado pronto: pulsa cuando entre el golpe anterior.',
          late: 'Demasiado tarde: pulsa antes de que acabe el movimiento, justo cuando entra el golpe.',
          wrong: (got, want) => `Botón equivocado: ${got}; este paso pide ${want}.`,
          dir: (want) => `Falta la dirección: ${want}. Mantén la dirección y luego pulsa.`,
          miss: 'Fallo: el golpe no ha entrado. Acércate al muñeco.',
          clear: '¡COMBO LOGRADO!', clearPop: '¡COMBO LOGRADO!',
          all: '¡Has superado todas las pruebas de combo de este ninja!',
        },
        coach: {
          combo: (l) => `${l} ${l} ${l} rápido: combo de 3 golpes`,
          comboT: (l) => `Toca ${l} tres veces seguidas: combo`,
          counter: (l) => `Tras una guardia o un desvío, pulsa ${l} cuando aparezca ¡CORTA!: contra`,
          counterT: (l) => `Tras una guardia o un desvío, toca ${l} cuando aparezca ¡CORTA!`,
        },
      });
      const L = Array.isArray(EN.STR.lessons) && EN.STR.lessons.find((l) => l.id === 'counter');
      if (L) L.d = 'Tras una guardia o un desvío, aparece <b>¡CORTA!</b> sobre tu cabeza: pulsa <kbd>F</kbd> antes de que se agote su barra. Adelante/atrás + <kbd>F</kbd> o <kbd>G</kbd> son otras contras.';
      if (EN.STR.lessonsTouch) EN.STR.lessonsTouch.counter = `Tras una guardia o un desvío, aparece <b>¡CORTA!</b> sobre tu cabeza: toca ${tb('ATAQUE', 'tb-light')} antes de que se agote su barra. Joystick adelante/atrás + ${tb('ATAQUE', 'tb-light')} o ${tb('PESADO')} son otras contras.`;
      merge(EN.PHRASES, {
        'KOMBO TAMAM!': '¡COMBO LOGRADO!',
        'Nasıl okunur': 'Cómo leerlo',
        '→ rakibe doğru, ← rakipten uzağa demek: o yön tuşunu (A / D ya da ok tuşları; rakip sağındaysa D) basılı tut ve saldırı tuşuna bas. Virgül: tuşlara sırayla bas. F hafif, G ağır, R tekme, S gard.':
          '→ significa hacia el rival; ←, alejándote de él: mantén esa tecla de dirección (A / D o las flechas; D si el rival está a tu derecha) y pulsa la tecla de ataque. Una coma: pulsa las teclas una tras otra. F ligero, G pesado, R patada, S guardia.',
        '▶ rakibe doğru, ◀ rakipten uzağa: yön çubuğunu o yana itip düğmeye dokun. Virgül: düğmelere sırayla dokun. Antrenmandaki Kombo denemesi her seriyi adım adım gösterir.':
          '▶ hacia el rival, ◀ alejándote de él: empuja el joystick hacia ese lado y toca el botón. Una coma: toca los botones uno tras otro. La Prueba de combo del Entrenamiento muestra cada cadena paso a paso.',
        'Gard ya da savuşturmanın ardından ekranda VUR! çıkar: altındaki çubuk bitmeden HAFİF’e bas. Yalnız HAFİF: Suriage. İleri + HAFİF: Harai (yere serer). Geri + HAFİF: Nuki (arkaya geçer). AĞIR: Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.':
          'Tras una guardia o un desvío aparece ¡CORTA!: pulsa LIGERO antes de que se agote su barra. Solo LIGERO: Suriage. Adelante + LIGERO: Harai (derriba). Atrás + LIGERO: Nuki (se cuela detrás). PESADO: Uchiotoshi. Tu tercera respuesta es el remate; si la desvían, el intercambio continúa.',
      });
    }

    // ================================================================ GRAPHICS QUALITY: the Graphics setting (js/gfx.js)
    merge(EN.STR, {
      gfx: {
        title: 'Gráficos',
        levels: { auto: 'Auto', high: 'Altos', medium: 'Medios', low: 'Bajos' },
        note: {
          auto: 'Se ajusta a tu dispositivo y baja solo si un combate va a tirones.',
          high: 'Todas las luces y efectos. Para dispositivos potentes.',
          medium: 'Brillo suave, sin sombras. Para la mayoría de los móviles.',
          low: 'Lo más fluido. Para móviles antiguos.',
        },
        now: (lv) => `Ahora: ${lv}`,
      },
    });

    // ================================================================ FRAME RATE: Settings → Graphics (js/gfx.js makePacer)
    // (Turkish source in i18n.js, block "frame rate"; the numbers themselves are not translated)
    merge(EN.STR, {
      fps: {
        title: 'Fotogramas',
        show: 'Mostrar FPS',
        levels: { max: 'Máx' },
        note: {
          60: 'Estable y sin calentar. Lo mejor para la mayoría de los móviles.',
          90: 'Más fluido si la pantalla lo admite. Gasta más batería.',
          120: 'Lo más fluido en pantallas de 120 Hz. Gasta más batería.',
          max: 'Tan rápido como permita tu pantalla.',
        },
      },
    });

    // ================================================================ SETTINGS SCREEN (js/settings.js; Turkish source in i18n.js)
    merge(EN.STR, {
      set: {
        title: 'Ajustes', close: 'Cerrar',
        tabs: { audio: 'Sonido', controls: 'Controles', gfx: 'Gráficos', lang: 'Idioma' },
        touch: 'Táctil', keys: 'Teclado', pad: 'Mando',
        touchNote: 'Los ajustes de los controles táctiles aparecen aquí en cuanto tocas la pantalla.',
      },
    });

    // ================================================================ LANGUAGE PICKER (js/lang-ui.js; Turkish source in i18n.js)
    // Language names are not translated: each one is written in its own language (ND.i18n.names).
    merge(EN.STR, { lang: { title: 'Idioma', change: 'Cambiar idioma', close: 'Cerrar' } });

    // ================================================================ SHARED LABELS (static HTML / move list text that is the same word in Turkish)
    merge(EN.PHRASES, { 'Shuriken': 'Shuriken', 'KI': 'KI' });

    // ================================================================ TOUCH HELP PER MOVEMENT MODE
    // (game.js touchHelp(): the menu's touch help follows the movement mode; Turkish source in i18n.js)
    merge(EN.STR, {
      thelp: {
        title: { float: 'Joystick', fixed: 'Joystick fijo', dpad: 'Cruceta' },
        float: { walk: 'Apoya el pulgar en la mitad libre y deslízalo: caminar', jump: 'Empuja arriba: saltar', guard: 'Tira hacia abajo: guardia', dash: 'Desliza dos veces hacia un lado: impulso' },
        fixed: { walk: 'Sujeta el joystick por el centro y empújalo a un lado: caminar', jump: 'Empuja arriba: saltar', guard: 'Tira hacia abajo: guardia', dash: 'Desliza dos veces hacia un lado: impulso' },
        dpad: {
          walk: 'Mantén: caminar', step: 'Toque corto: un pasito', jump: 'Toca: saltar', guard: 'Mantén: guardia',
          dash: 'Doble toque: impulso', both: 'Pulsa entre dos botones para activar ambos (▶ + ▲ = salto adelante)',
        },
        edit: (b) => `${b}: arrastra cada botón adonde quieras y ajusta su tamaño y opacidad. En Ajustes → Controles.`,
      },
    });

    // Persistent character journeys.
    merge(EN.STR, { menu: { arcadeDesc: "Un viaje de ocho combates para cada ninja. Continúa con tu próximo rival y desbloquea su final y el sello de maestro." }, sel: { title: { arcade: "Arcade · Viaje del personaje" } },
      journey: {
        start: "Iniciar viaje",
        resume: (i, n) => "Continuar · " + i + "/" + n + "",
        ending: "Ver final",
        replay: "Repetir viaje",
        badge: "Sello de maestro",
        completed: "Viaje completado",
        progress: (i, n) => "" + i + "/" + n + " combates completados · Progreso guardado",
        reward: "Recompensa: final del personaje y sello de maestro permanente",
        saved: "Cada victoria se guarda. Salir de un combate cuenta como reintento.",
        menu: (done, active) => "" + done + " viajes completados · " + active + " en curso",
        clearReward: "Sello de maestro obtenido · Final desbloqueado"
      }
    });

    // ================================================================ PROGRESS / ACCOUNT (Settings → Progress, Hall of Champions;
    // js/settings.js, js/banzuke.js; Turkish source in i18n.js, block "account and recovery code")
    merge(EN.STR, {
      set: { tabs: { save: 'Progreso' } },
      acct: {
        title: 'Guarda tu progreso',
        cgOn: (n) => `Cuenta de CrazyGames: ${n}. Tus títulos, colores de campeón, Dan y puntuaciones se guardan en tu cuenta.`,
        cgWait: (n) => `Cuenta de CrazyGames: ${n}. Conectando con tu cuenta…`,
        cgFail: (n) => `Cuenta de CrazyGames: ${n}. Ahora no se puede acceder a tu cuenta; las nuevas puntuaciones se quedan de momento en este dispositivo.`,
        cgSave: 'Guarda tu progreso en tu cuenta de CrazyGames',
        cgSaveNote: 'Al iniciar sesión, tus títulos, colores de campeón y puntuaciones pasan a tu cuenta, en cualquier dispositivo.',
        rcTitle: 'Código de recuperación',
        rcNote: 'Apunta este código. Introdúcelo aquí en un dispositivo nuevo para recuperar tus títulos, colores de campeón, Dan y puntuaciones.',
        rcShow: 'Mostrar código', rcNew: 'Nuevo código', rcNewDone: 'Nuevo código listo; el anterior ya no funciona.',
        rcNeedName: 'Primero guarda una puntuación con un apodo para obtener un código de recuperación.',
        rcEnter: 'Introduce un código de recuperación', rcGo: 'Recuperar',
        rcDone: (n, c) => `¡Bienvenido de nuevo, ${n}! Tu progreso ha vuelto. Tu nuevo código de recuperación: ${c}`,
        err: { bad_code: 'No reconocemos este código. Revisa los caracteres.', rate: 'Demasiados intentos. Inténtalo más tarde.', offline: 'No se puede conectar con el servidor. Revisa tu conexión.', banned: 'Esta identidad no se puede usar.', error: 'Algo salió mal. Inténtalo de nuevo.' },
        local: 'El guardado en línea no está disponible aquí; tu progreso se guarda en este dispositivo.',
        offline: 'Ahora estás sin conexión; tu progreso se guarda en este dispositivo.',
        loading: 'Cargando…',
      },
      lb: { savedLocalAccount: (r) => (r ? `#${r} en este dispositivo · ahora no se puede acceder a tu cuenta` : 'Guardado en este dispositivo · ahora no se puede acceder a tu cuenta') },
    });

    void dec; void fmtTime; void num;
  };
})(window.ND);
