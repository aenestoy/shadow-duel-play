// Shadow Duel — Brazilian Portuguese (pt-BR) catalog for ND.i18n (Turkish is the source language).
// Same structure as js/i18n-en.js; see js/i18n.js for how each part is applied. Address: "você".
//
// GLOSSARY (used everywhere in this file)
//   parry ........... aparar (verb/move name) · aparada (noun) · pop-up APARADO! · prompt APARE
//   guard / block ... defesa · defender · segurar a defesa · button DEFESA
//   guard break ..... DEFESA QUEBRADA!        posture ...... postura · POSTURA QUEBRADA!
//   counter ......... contragolpe (noun) · contra-atacar (verb) · small prompt label CONTRA
//   counter hit ..... INTERCEPTADO!           rally ........ troca (troca de golpes / de contragolpes)
//   finisher ........ finalização             final blow ... golpe final
//   ki / ki technique ki · técnica de ki      ki cancel .... cancela ki / KI CANCELADO!
//   combo ........... combo                   string ....... sequência · string ender: fim de sequência
//   launcher ........ lançador · LANÇADO!     juggle ....... malabar
//   dash ............ impulso · button IMPULSO · dash slash: corte com impulso
//   light / heavy ... leve / forte (corte leve, corte forte) · buttons ATAQUE (light) / FORTE
//   kick ............ chute · CHUTE           jump ......... pular · button PULO
//   shuriken ........ shuriken · SHUR.        stick ........ analógico · D-pad: direcional
//   sweep ........... rasteira                cross-up ..... contorno
//   knock down ...... derrubar · NO CHÃO      blade lock ... trava de lâminas · LÂMINAS TRAVADAS!
//   round / KO ...... round / K.O.            dummy ........ boneco
//   honor ........... honra                   rival challenge Desafio Rival
//   tournament ...... Torneio Mensal         Dan trial .... Exame Dan · rank: graduação (Kyu / Dan)
//   combo trial ..... Prova de combo          leaderboard .. ranking
//   nickname ........ apelido                 Fwd+ / Back+ . Frente+ / Trás+
// Kept as is: kanji, Japanese technique and weapon names, character names, Kyu / Dan, the brand "Shadow Duel".
(function (ND) {
  'use strict';
  (ND.I18N_CATALOGS || (ND.I18N_CATALOGS = {})).pt = function (I, EN) {
    const merge = I.merge;
    const num = (n) => I.num(n);
    const dec = (x) => I.dec(x);
    const fmtTime = (s) => I.time(s);

    // ================================================================ UI tables (ND.STR)
    merge(EN.STR, {
      menu: {
        brand: (nc, na) => `${nc} lutadores, ${na} arenas e um mestre oculto. Choques de espada em tempo real, travas de lâmina, aparadas, quebras de postura, técnicas de ki e física ragdoll.`,
        arcade: 'Arcade',
        arcadeDesc: 'Vença seus rivais um a um enquanto a dificuldade sobe, com um mestre oculto à espera no fim. Vença para liberar novos ninjas e arenas.',
        arcadeProg: (best, c, ct, a, at) => `${best ? 'Recorde ' + num(best) + ' · ' : ''}${c}/${ct} ninjas · ${a}/${at} arenas liberadas`,
        train: 'Treino',
        trainDesc: 'Pratique à vontade no boneco ou aprenda passo a passo',
        trainFree: 'Livre',
        trainTut: 'Tutorial',
        watchShort: 'Dois ninjas aleatórios, IA Lenda',
        specialKey: 'Técnica de ki (ki cheio)',
        single: 'Partida avulsa', singleDesc: 'Contra a CPU ou dois jogadores',
      },
      sel: {
        title: { '2p': 'Escolha seu ninja', cpu: 'Escolha seu ninja', arcade: 'Arcade · Escolha seu ninja', train: 'Treino · Escolha seu ninja', tutorial: 'Tutorial · Escolha seu ninja', tourney: 'Torneio Mensal · Escolha seu ninja', dan: 'Exame Dan · Escolha seu ninja' },
        who1: { '2p': 'Jogador 1 · A / D escolhe, F confirma', def: 'Você · A / D escolhe, F confirma' },
        who2: { '2p': 'Jogador 2 · ← / → escolhe, K confirma', cpu: 'Oponente (CPU) · ← / → escolhe', train: 'Boneco · ← / → escolhe' },
        go: { def: 'Começar luta', arcade: 'Iniciar Arcade', train: 'Começar treino', tutorial: 'Começar tutorial', tourney: 'Iniciar torneio', dan: 'Iniciar exame' },
        random: 'Aleatório',
        arena: 'Arena',
        locked: 'Bloqueado',
        lockMsg: (name, hint) => `${name} bloqueado · ${hint}`,
        keyHint: '<kbd>Enter</kbd> começar · <kbd>⌫</kbd> voltar',
      },
      hint: {
        wins: (n, cur) => `Vença ${n} lutas no Arcade (${Math.min(cur, n)}/${n})`,
        clear: 'Complete o Arcade uma vez',
        boss: 'Derrote o chefe final no Arcade',
        arena: 'Vença uma luta nesta arena no Arcade',
      },
      toast: {
        newChar: (name) => `Novo lutador liberado: ${name}`,
        newArena: (name) => `Nova arena liberada: ${name}`,
        newBest: (s) => `Novo recorde: ${num(s)} pts`,
        lesson: (t) => `Lição concluída: ${t}`,
        tutDone: 'Tutorial concluído!',
        perf: 'Gráficos reduzidos para melhor desempenho',
      },
      vs: {
        stage: (i, n) => `Luta ${i} / ${n}`,
        boss: 'Luta final',
        go: 'Lutem!',
        quit: 'Sair do Arcade',
        keys: '<kbd>Enter</kbd> / <kbd>F</kbd> começar · <kbd>⌫</kbd> sair',
        unknown: '?',
      },
      hud: { you: 'VOCÊ', cpu: 'CPU', dummy: 'BONECO', stage: (i, n) => `${i}/${n}`, boss: 'CHEFE FINAL', inf: '∞', lockSolo: 'Martele F / K!', lockDuo: 'Martele leve ou forte!' },
      end: {
        rematch: 'Revanche', change: 'Trocar lutador', menu: 'Menu principal',
        winTitle: 'A vitória é sua',
        winSub: (i, n, pts) => `Luta ${i}/${n} vencida · +${num(pts)} pts`,
        next: 'Próxima luta',
        bossNext: 'Rumo ao fim',
        lossTitle: 'Derrota',
        lossSub: (name) => `${name} levou a melhor desta vez. Tente de novo.`,
        retry: 'Tentar de novo',
        quit: 'Sair do Arcade',
      },
      ending: {
        head: 'Final',
        rows: { fights: 'Lutas', time: 'Tempo total', retries: 'Recomeços', perfect: 'Rounds perfeitos', score: 'Pontuação', best: 'Recorde' },
        newBest: 'Novo recorde!',
        menu: 'Menu principal',
        again: 'Jogar de novo',
        unlocked: 'Liberado',
        fightPts: 'Pontos de luta',
        bonus: 'Bônus de conclusão',
      },
      score: {
        hud: 'PONTOS',
        rows: { hit: 'Golpes', combo: 'Combo', counter: 'Contragolpe', defense: 'Defesa', pressure: 'Pressão', special: 'Técnica de ki', round: 'Vitória', perfect: 'Perfeito', hp: 'Vida restante', time: 'Bônus de tempo' },
        total: 'Pontuação da luta',
        diff: (name, m) => `inclui ${name} ×${dec(m)}`,
        best: (s) => `Seu recorde: ${num(s)}`,
        newBest: 'Novo recorde!',
        arcadeTotal: (s) => `Total do Arcade: ${num(s)}`,
        lossNote: (s, pen) => `Esta tentativa não conta · Total do Arcade ${num(s)} · cada recomeço −${num(pen)}`,
        clearBonus: (c, n) => `+${num(c)}${n ? ' · sem recomeços +' + num(n) : ''}`,
        lossCpu: 'Derrota · só vitórias entram no ranking',
        cpuBoardHint: 'Vitórias no Lenda entram no ranking',
      },
      lb: {
        menu: 'Ranking',
        menuDesc: 'Recordes do Arcade e do Lenda',
        title: 'Ranking',
        back: 'Voltar',
        boards: { arcade: 'Arcade', cpu_efsane: 'CPU Lenda' },
        boardDesc: { arcade: 'Pontuação total de uma campanha completa do Arcade', cpu_efsane: 'Pontuação de uma única luta vencida contra a CPU Lenda' },
        all: 'Todos',
        status: { loading: 'Carregando…', online: 'Ranking online', readonly: 'Ranking online · só leitura', local: 'Ranking local', error: 'Erro · ranking local', offline: 'Offline · ranking local' },
        empty: 'Nenhuma pontuação ainda. Largue na frente!',
        loadErr: 'Não foi possível carregar o ranking.',
        you: 'Você', youTag: 'você', player: 'Jogador',
        nick: 'Apelido', nickPh: 'Seu apelido', nickSave: 'Salvar', nickEdit: 'Mudar',
        nickAsk: 'Apelido para o ranking local:',
        saving: 'Salvando…',
        savedOnline: (r) => `Posição online: #${r}`,
        savedOnlineNoRank: 'Salvo no ranking online',
        savedOnlineGap: (r, g) => `Posição online: #${r} · faltam ${g} pts para o top 10`,
        reason: {
          needName: 'Escolha um apelido para entrar no ranking online',
          offline: 'Sem conexão — pontuação guardada; ela será enviada quando você voltar a ficar online',
          rate: 'Envios demais — a pontuação será enviada em instantes',
          daily: 'Limite diário de envios atingido — pontuação salva só localmente',
          week: 'O mês acabou — esta pontuação não conta para o novo mês',
          invalid: 'Pontuação inválida',
        },
        nickErr: {
          nick_length: 'O apelido deve ter de 3 a 16 caracteres',
          nick_chars: 'Use só letras, números, espaços e _ . - (pelo menos uma letra)',
          nick_bad: 'Esse apelido não é permitido, tente outro',
          rate_limited: 'Espere um pouco e tente de novo',
        },
        nickErrDef: 'Não foi possível salvar o apelido',
        nickAskOnline: 'Apelido para o ranking online:',
        savedLocal: (r) => (r ? `#${r} no ranking local` : 'Salvo no ranking local'),
        rejected: 'Não foi possível salvar sua pontuação — só no ranking local',
        quota: 'O ranking online está cheio — pontuação salva só localmente',
        open: 'Ranking',
        keys: '<kbd>←</kbd> <kbd>→</kbd> ranking · <kbd>↑</kbd> <kbd>↓</kbd> ninja · <kbd>⌫</kbd> voltar',
      },
      bz: {
        back: 'Voltar', toMenu: 'Menu principal', you: 'Você', youTag: 'você', newBest: 'Novo recorde!', seeResult: 'Ver resultado',
        resetIn: 'Reinicia em',
        // time left: days (d) · hours (h) · minutes (min) · seconds (s)
        left: (ms) => { const t = Math.floor(ms / 1000), d = Math.floor(t / 86400), hh = Math.floor((t % 86400) / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60; return d ? `${d}d ${hh}h ${mm}min` : hh ? `${hh}h ${mm}min` : `${mm}min ${ss}s`; },
        leftShort: (ms) => { const t = Math.floor(ms / 60000), d = Math.floor(t / 1440), hh = Math.floor((t % 1440) / 60), mm = t % 60; return d ? `${d}d ${hh}h` : hh ? `${hh}h ${mm}min` : `${mm}min`; },
        weekName: (m, y) => `${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][m - 1] || m} de ${y}`,
        monthName: (m) => ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][m - 1] || String(m),
        rank: (r) => (r <= 0 ? 'Sem graduação' : r <= 10 ? `Kyu ${11 - r}` : `Dan ${r - 10}`),
        fightOf: (i, n) => `Luta ${i}/${n}`,
        hpBonus: (p) => `Vida inimiga +${p}%`,
        mirrorOpp: 'Espelho · seu próprio ninja',
        suddenSub: 'Um round · quem cair primeiro perde',
        rows: { fights: 'Vitórias', time: 'Tempo', fightPts: 'Pontos de luta', stage: 'Bônus de etapa', clear: 'Bônus de conclusão', total: 'Pontuação do torneio', weekBest: 'Seu recorde do mês' },
        mods: {
          rally2x: { n: 'Troca em Chamas', d: 'Dano de contragolpe ×2' },
          fullKi: { n: 'Ki Cheio', d: 'Todo round começa com ki cheio' },
          sudden: { n: 'Morte Súbita', d: 'Um round; os dois lados começam com metade da vida' },
          mirror: { n: 'Espelho', d: 'Seu oponente é o seu próprio ninja' },
          parryOnly: { n: 'Só Contragolpes', d: 'Golpes normais causam 25% de dano; contragolpes ×1,5' },
          posture2x: { n: 'Postura Frágil', d: 'Dano de postura ×2: defesas quebram rápido' },
          shuriken3x: { n: 'Chuva de Shuriken', d: 'O triplo de shuriken' },
          kiRush: { n: 'Enxurrada de Ki', d: 'O ki enche duas vezes mais rápido' },
          glass: { n: 'Lâmina de Vidro', d: 'Todo dano ×1,5' },
        },
        menu: {
          tour: 'Torneio Mensal', dan: 'Exame Dan', hall: 'Salão dos Campeões',
          tourRank: (p, left) => `Este mês: #${p} · reinicia em ${left}`,
          tourBest: (b, left) => `Seu recorde ${b} · reinicia em ${left}`,
          tourNew: (left) => `As mesmas 8 lutas para todos · reinicia em ${left}`,
          danRank: (name, next) => (next ? `Sua graduação: ${name} · próxima: ${next}` : `Sua graduação: ${name} · você chegou ao topo`),
          danNew: '20 exames, do Kyu 10 ao Dan 10',
          hallRank: (p) => `Este mês #${p} · recordes`,
          hallDesc: 'O top 10 do mês e os recordes de todos os tempos',
          nick: (n) => (n ? `Apelido: ${n}` : 'Escolha um apelido'),
          champTitle: 'Top 10 do mês', champLocal: 'Top 10 neste dispositivo', champEmpty: 'Seja o primeiro na tabela deste mês', champLoading: 'Carregando os líderes…',
          champLast: (n) => `Campeão do mês passado: ${n}`, champOpen: 'abrir o ranking mensal',
        },
        t: {
          title: 'Torneio Mensal', head: 'Torneio',
          runNote: (s, st) => `Total do torneio: ${num(s)} (inclui +${num(st)} por vitória)`,
          lossSub: (name, won) => `${name} encerrou sua campanha · ${won} ${won === 1 ? 'vitória' : 'vitórias'}`,
          lossNote: (s) => `Esta luta não conta · pontuação do torneio ${num(s)}`,
          quit: 'Encerrar torneio',
          myBest: (b, a) => `Seu recorde do mês: ${b} pts · ${a} ${a === 1 ? 'tentativa' : 'tentativas'}`,
          noTry: 'Nenhuma tentativa este mês.',
          place: (p, t) => (t ? `#${p} / ${t}` : `#${p}`),
          rules: (n, clear, stage) => `${n} lutas; os mesmos oponentes, arenas e regras para todos. Uma derrota encerra a tentativa; as tentativas são ilimitadas e vale a melhor. Cada vitória +${stage}, vencer todas +${clear}.`,
          start: 'Escolha seu ninja e comece', again: 'Tentar de novo', go: 'Entrar no torneio',
          clearTitle: 'Torneio conquistado', overTitle: 'Fim da tentativa',
          savedToast: (s) => `Pontuação do torneio salva: ${s}`,
        },
        d: {
          title: 'Exame Dan', head: 'Exame Dan',
          sub: 'Passe em cada exame para subir de graduação. Sua graduação aparece ao lado do seu nome nos rankings.',
          trialOf: (n) => `Exame ${n}`,
          runNote: (i, n) => `Exame: ${i}/${n} lutas vencidas`,
          lossSub: (name) => `${name} barrou seu exame.`,
          lossNote: 'Reprovado no exame',
          quit: 'Abandonar exame',
          yourRank: 'Sua graduação', bestWas: (n) => `Mais alta: ${n}`, ladder: 'Escada de graduações',
          nextTrial: (n) => `Próximo: exame ${n}`,
          fights: (n) => `${n} ${n === 1 ? 'luta' : 'lutas'}`,
          bossLast: 'Luta final: Shura',
          strikes: (left, max) => `Chances: ${left}/${max} · ${max} reprovações fazem você cair uma graduação`,
          safe: 'Nesta graduação, uma reprovação não rebaixa você.',
          maxed: 'No topo: Dan 10', maxedSub: 'Seu nome lidera o ranking Dan.',
          start: 'Escolha seu ninja e faça o exame', next: 'Próximo exame', go: 'Fazer o exame',
          promoted: (n) => `Promoção: ${n}`, demoted: (n) => `Rebaixamento: ${n}`, failed: 'Reprovado no exame',
          promotedSub: (a, b) => `${a} → ${b}`, demotedSub: 'Três reprovações. Volte a subir!', tryAgain: 'Tente de novo; sua graduação está segura.',
          toast: (n) => `Nova graduação: ${n}`, leftToast: 'Exame abandonado: conta como reprovação',
        },
        hall: {
          title: 'Salão dos Campeões',
          tabs: { week: { n: 'Este Mês' }, alltime: { n: 'Todos os Tempos' }, archive: { n: 'Campeões' }, chars: { n: 'Por Ninja' }, dan: { n: 'Dan' } },
          desc: { alltime: 'Os melhores de todos os tempos do Torneio Mensal', archive: 'O top 10 de cada mês encerrado fica gravado aqui para sempre', chars: 'Recordista de cada ninja · toque num ninja para ver o top 20', dan: 'Graduações mais altas' },
          loading: 'Carregando…', error: 'Não foi possível carregar o ranking.', retry: 'Tentar de novo',
          empty: 'Ninguém aqui ainda. Largue na frente!', emptyDan: 'Nenhum jogador graduado ainda.', emptyArchive: 'Nenhum mês encerrado ainda. Os títulos começam com o torneio de outubro de 2026; os campeões serão gravados quando ele terminar, em 1º de novembro.', emptyArchiveLocal: 'Nenhum mês encerrado neste dispositivo ainda.',
          anon: 'Jogador',
          meTop: (p, s) => `Você: #${p} · ${s} pts · você está no top 10!`,
          meGap: (p, g, s) => `Você: #${p} · ${s} pts · faltam ${g} pts para o top 10`,
          meNone: 'Nenhuma pontuação este mês.',
          meDan: (p, n) => `Você: #${p} · ${n}`,
          meDanLocal: (n) => `Sua graduação: ${n}`, meNoDan: 'Sem graduação ainda. Primeiro exame: Kyu 10.',
          noRecord: 'Sem recorde', allNinjas: 'Todos os ninjas',
          pending: (n) => `Registros aguardando envio: ${n}`,
          classic: 'Rankings Arcade · Lenda',
        },
        // Monthly Tournament rewards: permanent title (top 3) and Champion colors (1st)
        ttl: {
          champ: 'Campeão Mensal', finalist: 'Finalista',
          reward: 'A partir do torneio de outubro de 2026, o top 3 de cada mês ganha um título permanente. O campeão também ganha cores de campeão exclusivas para o ninja que usou. Os títulos exigem pelo menos 5 jogadores no mês.',
          hall: 'A partir de outubro de 2026: o top 3 do mês ganha um título permanente (mín. 5 jogadores) · o campeão, cores de campeão',
          local: 'Suas pontuações do torneio ficam salvas neste dispositivo.',
          colors: 'Cores de campeão',
          how: 'Vença um Torneio Mensal com este ninja',
          unlocked: (name) => `Campeão Mensal! Cores de campeão de ${name} desbloqueadas`,
          newTitle: (t) => `Novo título: ${t}`,
        },
      },
      train: {
        title: 'Treino', tutTitle: 'Tutorial',
        dummy: 'Boneco',
        beh: { idle: 'Parado', guard: 'Defesa', attack: 'Ataque', counter: 'Contragolpe' },
        infHp: 'Vida infinita', fullKi: 'Ki cheio',
        reset: 'Reposicionar',
        hide: 'Ocultar', show: 'Painel',
        moves: 'Lista de golpes',
        lessons: 'Lições',
        lessonOf: (i, n) => `Lição ${i}/${n}`,
        done: 'Tutorial concluído! Configure o boneco como quiser e treine à vontade.',
        progress: (a, b) => `${a}/${b}`,
        keysHelp: '<kbd>1</kbd>–<kbd>4</kbd> boneco · <kbd>⌫</kbd> reposicionar · <kbd>H</kbd> painel',
        specialFallback: { kanji: '影斬り', name: 'Corte das Sombras', desc: 'Um corte rápido como um raio que atravessa o oponente de lado a lado.', tip: '' },
        kiFull: 'ki cheio',
        counterTip: 'Como responder',
      },
      moves: [
        ['<kbd>A</kbd><kbd>D</kbd>', 'Andar', 'toque duplo: impulso'],
        ['<kbd>W</kbd>', 'Pular', ''],
        ['<kbd>F</kbd><kbd>F</kbd><kbd>F</kbd>', 'Combo leve ×3', 'o 3º golpe empurra'],
        ['<kbd>G</kbd>', 'Corte forte', 'derruba'],
        ['<kbd>R</kbd>', 'Chute', 'pressiona a defesa, enche a postura'],
        ['<kbd>T</kbd>', 'Shuriken', ''],
        ['<kbd>Shift</kbd>', 'Impulso', 'Shift esquerdo'],
        ['<kbd>Shift</kbd>›<kbd>F</kbd>', 'Corte com impulso', ''],
        ['<kbd>W</kbd>›<kbd>F</kbd>', 'Corte aéreo', ''],
        ['<kbd>W</kbd>›<kbd>G</kbd>', 'Mergulho', 'forte no ar'],
        ['<kbd>S</kbd>', 'Defesa', 'segure'],
        ['<kbd>S</kbd>!', 'Aparar', 'aperte logo antes do golpe acertar'],
        ['<kbd>F</kbd>', 'Contragolpe direto', 'após defesa/aparada'],
        ['Frente+<kbd>F</kbd>', 'Rasteira', 'contragolpe · nas pernas'],
        ['Trás+<kbd>F</kbd>', 'Contorno', 'contragolpe · passe pelo lado'],
        ['<kbd>G</kbd>', 'Contragolpe forte', 'contragolpe · derruba'],
        ['Troca', 'Troca', 'defenda o contragolpe e contra-ataque de novo; seu 3º contragolpe finaliza'],
        ['<kbd>F</kbd>/<kbd>G</kbd>!!', 'Trava de lâminas', 'martele durante a trava para empurrar'],
      ],
      touch: {
        btn: { light: 'ATAQUE', heavy: 'FORTE', kick: 'CHUTE', guard: 'DEFESA', dodge: 'IMPULSO', throw: 'SHUR.', special: 'KI', up: 'PULO', down: 'DEFESA', stick: 'Analógico' },
        lock: 'Martele ATAQUE!',
        replaySkip: 'toque para pular',
        rotateTitle: 'Gire a tela',
        rotateText: 'Shadow Duel se joga na horizontal. Na vertical, você ainda pode usar os menus.',
        rotMenu: 'Menu principal',
        need2p: 'Precisa de teclado / gamepad',
        need2pToast: 'Conecte um teclado ou gamepad para dois jogadores',
        hints: 'Dicas',
        pause: 'Pausa',
        sel: { who1: 'Você · toque no seu ninja', who2: 'Oponente (CPU) · toque para escolher', who2train: 'Boneco · toque para escolher' },
        opt: {
          title: 'Controles de toque',
          layout: 'Layout', simple: 'Simples', full: 'Completo',
          size: 'Tamanho', sizes: { s: 'Pequeno', m: 'Médio', l: 'Grande' },
          hand: 'Botões', right: 'Direita', left: 'Esquerda',
          assist: 'Ajuda fácil', haptic: 'Vibração',
          fullscreen: 'Tela cheia', exitFullscreen: 'Sair da tela cheia',
          note: 'Simples: 5 botões grandes. Completo: adiciona chute e shuriken. Ajuda fácil: segure ATAQUE e o combo continua sozinho, um toque rápido em DEFESA dura o bastante para aparar, e o analógico não faz você pular sem querer. Só facilita o toque; regras e pontuações são iguais para todos.',
          fullNote: 'Os botões CHUTE e SHURIKEN ficam no layout Completo (Configurações → Controles).',
        },
        help: '<div class="th-grid">' +
          '<div><h3>Analógico</h3><dl>' +
          '<dt><i class="tb">◀ ▶</i></dt><dd>Ponha o polegar na metade livre e deslize: andar</dd>' +
          '<dt><i class="tb">▲</i></dt><dd>Empurre para cima: pular</dd>' +
          '<dt><i class="tb tb-guard">▼</i></dt><dd>Puxe para baixo: defender</dd>' +
          '<dt><i class="tb">▶▶</i></dt><dd>Deslize duas vezes para o lado: impulso</dd>' +
          '</dl></div>' +
          '<div><h3>Botões</h3><dl>' +
          '<dt><i class="tb tb-light">ATAQUE</i></dt><dd>Corte. Toque várias vezes: combo. Segure para frente ou para trás enquanto toca: outras técnicas</dd>' +
          '<dt><i class="tb">FORTE</i></dt><dd>Corte forte. Frente + FORTE lança o oponente ao ar</dd>' +
          '<dt><i class="tb tb-guard">DEFESA</i></dt><dd>Segure: defesa. Toque logo antes de um golpe: aparar</dd>' +
          '<dt><i class="tb">IMPULSO</i></dt><dd>Impulso (para onde o analógico aponta; senão, para trás)</dd>' +
          '<dt><i class="tb ki">KI</i></dt><dd>Técnica de ki: o botão brilha quando o ki está cheio</dd>' +
          '<dt><i class="tb">CHUTE</i> <i class="tb">SHUR.</i></dt><dd>Layout Completo: chute e shuriken</dd>' +
          '</dl></div></div>',
        note: 'Você pode apertar vários botões ao mesmo tempo: segurar a defesa e atacar, ou deslizar o polegar de <i class="tb tb-guard">DEFESA</i> para <i class="tb tb-light">ATAQUE</i>. O <b>II</b> no topo da tela pausa; as opções de layout, tamanho e canhoto ficam em <b>Configurações</b>. Use um teclado ou gamepad e os controles passam para ele automaticamente.',
        keysHelp: '',
      },
      movesTouch: [
        ['<i class="tb">◀ ▶</i>', 'Andar', 'analógico · deslize duas vezes: impulso'],
        ['<i class="tb">▲</i>', 'Pular', 'empurre o analógico para cima'],
        ['<i class="tb tb-light">ATAQUE</i>×3', 'Combo triplo', 'toque várias vezes; o 3º golpe empurra'],
        ['<i class="tb">FORTE</i>', 'Corte forte', 'derruba'],
        ['<i class="tb">CHUTE</i>', 'Chute', 'pressiona a defesa, enche a postura · layout Completo'],
        ['<i class="tb">SHUR.</i>', 'Shuriken', 'layout Completo'],
        ['<i class="tb">IMPULSO</i>', 'Impulso', ''],
        ['<i class="tb">IMPULSO</i>›<i class="tb tb-light">ATAQUE</i>', 'Corte com impulso', ''],
        ['<i class="tb">▲</i>›<i class="tb tb-light">ATAQUE</i>', 'Corte aéreo', ''],
        ['<i class="tb">▲</i>›<i class="tb">FORTE</i>', 'Mergulho', 'forte no ar'],
        ['<i class="tb tb-guard">DEFESA</i>', 'Defesa', 'segure, ou puxe o analógico para baixo'],
        ['<i class="tb tb-guard">DEFESA</i>!', 'Aparar', 'toque logo antes do golpe acertar'],
        ['<i class="tb tb-light">ATAQUE</i>', 'Contragolpe direto', 'após defesa/aparada'],
        ['Frente+<i class="tb tb-light">ATAQUE</i>', 'Rasteira', 'contragolpe · nas pernas'],
        ['Trás+<i class="tb tb-light">ATAQUE</i>', 'Contorno', 'contragolpe · passe pelo lado'],
        ['<i class="tb">FORTE</i>', 'Contragolpe forte', 'contragolpe · derruba'],
        ['Troca', 'Troca', 'defenda o contragolpe e contra-ataque de novo; seu 3º contragolpe finaliza'],
        ['<i class="tb tb-light">ATAQUE</i>!!', 'Trava de lâminas', 'martele ATAQUE durante a trava para empurrar'],
      ],
      moveSpecialTouch: '<i class="tb ki">KI</i>',
      moveTags: {
        normal: 'Normal', command: 'Comando', string: 'Sequência', launcher: 'Lançador', juggle: 'Malabar', air: 'Aéreo', dash: 'Impulso',
        strike: 'Golpe', counter: 'Contragolpe', catch: 'Captura', feint: 'Finta', guardCrush: 'Quebra-defesa', knockdown: 'Derruba',
        kiCancel: 'Cancela ki', special: 'Técnica de ki', throw: 'Projétil',
      },
      lessonsTouch: {
        walk: 'Deslize o polegar na metade livre da tela: empurre o analógico para a esquerda e para a direita para andar.',
        combo: 'Toque em <i class="tb tb-light">ATAQUE</i> três vezes seguidas: encadeie três cortes e acerte o boneco.',
        heavy: 'Acerte um corte forte com <i class="tb">FORTE</i>. É lento, mas derruba.',
        gbreak: 'O boneco está defendendo. Acerte-o com <i class="tb">FORTE</i> para encher a barra de postura e quebrar a defesa (<i class="tb">CHUTE</i>, no layout Completo, enche ainda mais rápido).',
        block: 'O boneco está atacando. Segure <i class="tb tb-guard">DEFESA</i> (ou puxe o analógico para baixo) e bloqueie um corte.',
        parry: 'Toque em <i class="tb tb-guard">DEFESA</i> logo antes do golpe acertar. O instante em que o anel azul encolhe é o momento perfeito.',
        counter: 'Logo após uma defesa ou aparada, <i class="tb tb-light">ATAQUE</i>: corte de contragolpe. Tente também analógico para frente/trás + <i class="tb tb-light">ATAQUE</i> ou <i class="tb">FORTE</i>.',
        special: 'Sua barra de ki está cheia. Use {sp} com o botão <i class="tb ki">KI</i> brilhando.',
      },
      lessons: [
        { id: 'walk', t: 'Andar', d: 'Ande para frente e para trás com <kbd>A</kbd> / <kbd>D</kbd>.' },
        { id: 'combo', t: 'Combo triplo', d: 'Encadeie três cortes leves com <kbd>F</kbd> <kbd>F</kbd> <kbd>F</kbd> e acerte o boneco.' },
        { id: 'heavy', t: 'Corte forte', d: 'Acerte um corte forte com <kbd>G</kbd>. É lento, mas derruba.' },
        { id: 'gbreak', t: 'Quebre a defesa', d: 'O boneco está defendendo. Chute com <kbd>R</kbd> para encher a barra de postura e quebrar a defesa.' },
        { id: 'block', t: 'Defesa', d: 'O boneco está atacando. Segure <kbd>S</kbd> para bloquear um corte.' },
        { id: 'parry', t: 'Aparar', d: 'Aperte <kbd>S</kbd> logo antes do golpe acertar. O instante em que o anel azul encolhe é o momento perfeito.' },
        { id: 'counter', t: 'Contragolpe', d: 'Logo após uma defesa ou aparada, <kbd>F</kbd>: corte de contragolpe. Tente também frente/trás + <kbd>F</kbd> ou <kbd>G</kbd>.' },
        { id: 'rally', t: 'Troca', d: 'O boneco também contra-ataca. Ataque, defenda o contragolpe dele e contra-ataque de novo: alcance 2× com duas respostas suas.' },
        { id: 'special', t: 'Técnica de ki', d: 'Sua barra de ki está cheia. Use {sp} com <kbd>E</kbd>.' },
      ],
    });

    // ================================================================ story, fighters, arenas, specials
    // ---- Fragment B: story text (talk, pairs, endings, roster2 notes), characters, arenas, specials, pop-ups, AI levels, number words
    merge(EN.STR, {
      // open = speaks first (opponent), reply = answers (player), boss = said to the final boss
      talk: {
        akane: {
          open: ['Minha lâmina é carmesim, minha intenção é pura. Enfrente-me com honra.', 'Primeiro eu me curvo, depois eu golpeio. Nada mais justo.', 'Este duelo é pela nossa honra. Não há recuo.'],
          reply: ['Um oponente honrado… Você fez por merecer minha lâmina.', 'Palavras afiadas. Vejamos se o seu aço corta tanto quanto.', 'Quando a lâmina carmesim fala, as palavras se calam.'],
          boss: 'Meus mestres morreram na sua lâmina, Shura. Hoje essa dívida será paga.',
        },
        aoi: {
          open: ['O vento nunca tem pressa. Eu também não.', 'Escute sua respiração. O último som que você ouvirá será o do vento.', 'O bambu se curva, mas nunca se quebra. E você?'],
          reply: ['Acalme-se. A raiva deixa a lâmina pesada.', 'Não se agarra o vento. Só se sente.', 'Muito bem. Começamos quando a folha tocar o chão.'],
          boss: 'Até o olho da tempestade é silencioso. Dentro de você só há ruído, Shura.',
        },
        kuro: {
          open: ['A montanha não se move. Você, sim.', 'Sem conversa. Erga a espada.', 'Pouca coisa. Vai ser rápido.'],
          reply: ['Hmpf. Então venha.', 'Você fala demais.', 'Minha nodachi é longa. Minha paciência, curta.'],
          boss: 'Shura. Esperei muito. Chega de conversa.',
        },
        yuki: {
          open: ['A neve cai em silêncio. Meus golpes também.', 'A raposa não cai em armadilhas. Ela as arma.', 'Frio? Logo você não vai sentir mais nada.'],
          reply: ['Esse sangue quente só te atrasa.', 'Quanto barulho… Até a neve sente vergonha por você.', 'Não pisque. Você vai perder.'],
          boss: 'Todos temem você, Shura. Eu só sinto um friozinho.',
        },
        hana: {
          open: ['Vamos dançar? Mas quem conduz sou eu!', 'A gente termina antes de as flores de cerejeira caírem, prometo!', 'Dois tantō, um sorriso. O que te assusta mais?'],
          reply: ['Ai, quanta seriedade! Sorria um pouco, a queda fica mais bonita.', 'Me pega se puder!', 'Tá bom, tá bom! Mas nada de chorar depois.'],
          boss: 'Você nunca ri, Shura? Vamos lá, que esta seja a nossa última dança!',
        },
        tetsu: {
          open: ['O dever me trouxe aqui. Saia da frente ou caia.', 'Minha armadura já viu cem batalhas. Você é a centésima primeira.', 'A disciplina vem antes da coragem. Permita-me mostrar.'],
          reply: ['Desrespeito. Eu vou corrigi-lo.', 'Suas palavras não atravessam minha armadura.', 'Prepare-se. Minha naginata não avisa.'],
          boss: 'Você incendiou o castelo do meu senhor, Shura. Hoje cumpro meu dever.',
        },
        ren: {
          open: ['Ha! Finalmente, diversão! Seus ossos aguentam?', 'A máscara te assustou? Você não vai querer ver minha cara de verdade!', 'Cabeças ou defesas? Eu quebro as duas!'],
          reply: ['Muito papo e nada de briga! Vem!', 'Heh, gostei de você. Mas vou te dar uma surra mesmo assim.', 'Já viu meu chute? Vai ver agora!'],
          boss: 'Então você é o oni de verdade, é? Vamos ver de quem é o chifre mais duro!',
        },
        kage: {
          open: ['Você acha que me vê. Vê apenas minha sombra.', 'Quanto mais forte a luz, mais profunda a sombra.', 'Seu nome já foi escrito. Eu apenas o leio.'],
          reply: ['Não fale. As sombras estão ouvindo.', 'Não olhe para trás. Eu já estou lá.', 'Você faz barulho demais. O silêncio golpeia mais rápido.'],
          boss: 'As sombras não servem a mestre algum, Shura. Elas vão engolir você também.',
        },
        shura: {
          open: ['Você quebrou sete lâminas. A oitava é minha, e ela vai quebrar você.', 'Seu espírito me chamou. Que bom que subiu até aqui; sua queda será ainda mais grandiosa.', 'Sou o fim da estrada. Ajoelhe-se.'],
          reply: ['Fraqueza. Sinto o cheiro daqui.', 'Você é só um degrau.', 'Ajoelhe-se ou caia.'],
          boss: 'O demônio no espelho… Um de nós está sobrando.',
        },
        tora: {
          open: ['Já perdi a conta de quantos balançaram na minha corrente. Você será só mais uma presa.', 'A caçada começou. Corra se quiser, mas minha corrente é longa.', 'Dizem que o tigre espera de tocaia. Este não!'],
          reply: ['Grrr… Ótimo. Gosto de presa que não foge.', 'Não precisa chegar mais perto. Eu te puxo.', 'Suas palavras são longas. Minha corrente é mais.'],
          boss: 'Você também é só uma presa, Shura. Só um pouco maior.',
        },
        jin: {
          open: ['Não vim derramar sangue. Só vou te pôr para descansar um pouco.', 'O bastão fala com paciência. Escute.', 'Seu caminho está cheio de raiva, jovem. Deixe-me aliviar esse fardo.'],
          reply: ['Muito bem. Mas depois tomamos um chá.', 'Sua raiva pesa sobre você. Deixe-me carregá-la.', 'A espada corta; o bastão desperta.'],
          boss: 'Shura, não preciso destruí-lo para derrotar o demônio que há em você. Basta detê-lo.',
        },
        mai: {
          open: ['O palco está pronto, a cortina subiu. Seu papel: o de quem perde.', 'Quando meu leque se abrir, não feche os olhos. Vai perder o espetáculo.', 'Cada passo meu é uma nota. Consegue manter o ritmo?'],
          reply: ['Que entrada grosseira. Não importa, tenho graça de sobra para nós dois.', 'O vento sopra a meu favor, meu bem.', 'Não preciso de aplausos. Sua queda me basta.'],
          boss: 'Shura, nesta última dança não divido o palco com ninguém.',
        },
        tsubame: {
          open: ['A distância entre nós é a minha arma.', 'A andorinha erra uma vez. Na segunda, ela faz a curva e ataca.', 'Já medi o vento. Minha flecha conhece o caminho.'],
          reply: ['Quer chegar perto? Tente.', 'Prenda a respiração. Uma flecha em voo não faz barulho.', 'Meus olhos estão em você. Minha flecha também.'],
          boss: 'Shura, não há onde se esconder no céu. Minha flecha vai te encontrar.',
        },
      },
      // Special match-ups: lines are spoken in the order written
      pairs: {
        'akane|aoi': [['akane', 'Aoi! Hora de terminar o duelo que deixamos pela metade.'], ['aoi', 'O vento sempre sopra para o mesmo fogo, Akane. Comece.']],
        'kuro|tetsu': [['kuro', 'Casco de ferro. Vejamos se é oco.'], ['tetsu', 'Até a montanha se curva à disciplina, Kuro.']],
        'hana|yuki': [['yuki', 'As flores murcham na neve, Hana.'], ['hana', 'Então eu derreto a neve, Yuki!']],
        'kage|ren': [['ren', 'Truque de sombra não funciona comigo! Apareça!'], ['kage', 'Estou bem aqui, oni. Você é que não sabe olhar.']],
        'akane|ren': [['akane', 'Só quem não tem honra se esconde atrás de uma máscara.'], ['ren', 'Honra? Honra não enche barriga!']],
        'aoi|yuki': [['aoi', 'Vento frio ainda é vento, Yuki.'], ['yuki', 'Mas a neve fica quando o vento cessa.']],
        'kuro|tora': [['tora', 'Uma montanha, é? Tigres também vivem nas montanhas.'], ['kuro', 'Tigres morrem nas montanhas.']],
        'tora|yuki': [['tora', 'Uma raposa! O que uma raposa faz diante de um tigre?'], ['yuki', 'Foge. Depois congela o rabo do tigre.']],
        'jin|tora': [['tora', 'E quando minha corrente se enrolar no seu bastão, monge?'], ['jin', 'Eu desato. Desfazer nós é a minha vocação.']],
        'jin|ren': [['ren', 'Um monge? Comece a rezar, careca!'], ['jin', 'Já estou rezando, oni. Por você. O fogo dentro de você também te queima.']],
        'jin|tetsu': [['tetsu', 'O que um monge faz num campo de batalha?'], ['jin', 'Vim por corações blindados como o seu, Tetsu. Sua armadura é pesada; seu coração, mais ainda.']],
        'akane|jin': [['akane', 'Afaste-se, monge. Esta vingança é minha.'], ['jin', 'A vingança é uma corrente, Akane. Vamos quebrá-la primeiro.']],
        'hana|mai': [['hana', 'Oba, outra dançarina! Vamos ver quem gira mais rápido!'], ['mai', 'A velocidade é só a sombra da graça, Hana. Deixe-me mostrar a luz.']],
        'kage|mai': [['mai', 'As sombras também dançam, Kage?'], ['kage', 'Só quando a luz se apaga.']],
        'aoi|tsubame': [['tsubame', 'Seu vento consegue desviar minha flecha, Aoi?'], ['aoi', 'O vento não toma partido, Tsubame. Nem o da sua flecha.']],
        'kage|tsubame': [['kage', 'Não se acerta o que não se vê, arqueira.'], ['tsubame', 'As sombras vêm com a luz. Eu também.']],
        'mai|tsubame': [['mai', 'Encarar de longe é falta de educação, arqueira. Venha assistir de perto.'], ['tsubame', 'Vou mandar minha flecha dar uma olhada de perto no seu palco.']],
      },
      endings: {
        akane: ['Quando a espada de Shura cravou-se na terra, os sinos do templo soaram sozinhos.', 'Akane limpou a lâmina carmesim e se curvou diante do túmulo dos mestres: a dívida estava paga.', 'O caminho adiante já não é a vingança, mas ensinar a honra a novos aprendizes.'],
        aoi: ['Quando Shura caiu, a tempestade se calou; pela primeira vez em anos, as nuvens se abriram.', 'Aoi embainhou a lâmina e voltou à floresta de bambu.', 'Restou apenas o assobio do vento.'],
        kuro: ['Kuro enterrou a máscara quebrada de Shura no pico da montanha.', 'Nenhuma palavra foi dita. Kuro baixou o chapéu de palha e sumiu na neve.', 'Os aldeões dizem que nenhum bandido desceu a montanha naquele inverno.'],
        yuki: ['O último suspiro de Shura virou névoa no ar frio e se desfez.', 'Yuki ajeitou o cachecol e partiu sem deixar pegadas na neve.', 'Desde aquele dia, só a sombra de uma raposa é vista no pico.'],
        hana: ['Quando a máscara de Shura caiu no chão, Hana deixou um galho de cerejeira ao lado.', 'Naquela noite, o mercado se encheu de lanternas; os aplausos mais altos foram para uma kunoichi que dançava nos telhados.', 'Ninguém sabe para onde Hana foi. Restam apenas pétalas cor-de-rosa ao vento.'],
        tetsu: ['No telhado do castelo, Tetsu partiu a espada de Shura em duas sobre o joelho.', 'O estandarte do senhor foi erguido outra vez, tremulando orgulhoso ao vento.', 'Dever cumprido. Mas o dever de um samurai nunca termina.'],
        ren: ['Ren pendurou a máscara quebrada de Shura ao lado da outra máscara oni. Dois oni, um vencedor.', 'A aldeia cantou naquela noite; a risada mais alta, como sempre, foi a de Ren.', 'De manhã, Ren já estava na estrada. Rumo à próxima briga.'],
        kage: ['Quando Shura caiu, a sombra de Kage cobriu em silêncio o demônio caído.', 'Sem rastro, sem som; apenas uma sombra a mais se estendendo ao luar.', 'Talvez sempre tenha estado lá. Talvez nunca tenha existido.'],
        shura: ['No telhado do castelo, restou de pé apenas um: aquele que usava a mesma máscara, só que mais escura.', 'Shura não procura mais rivais. Os rivais é que procuram Shura.'],
        def: ['O último mestre caiu. O caminho das sombras agora é seu.', 'Embainhe sua lâmina; a lenda começa agora.'],
        tora: ['O chacoalhar de uma corrente anunciou a queda de Shura.', 'Tora pendurou a máscara quebrada na corrente: um novo troféu de caça.', 'Daquele dia em diante, ninguém na floresta tomou o rugido do tigre por conto de fadas.'],
        jin: ['Jin se ajoelhou ao lado de Shura caído e rezou.', 'No caminho de volta ao templo, nem uma gota de sangue manchava o bastão.', 'Naquela noite, os sinos da montanha tocaram de novo; desta vez não em luto, mas pela paz.'],
        mai: ['Quando Shura caiu, Mai fechou o leque num estalo e fez uma reverência.', 'O mercado noturno ainda fala daquela dança.', 'A cortina desceu. Mas Mai nunca deixou o palco.'],
        tsubame: ['A última flecha vibrava em silêncio, cravada no telhado do castelo.', 'Tsubame pôs o arco no ombro e observou as andorinhas voarem para o sul.', 'Nunca mais foi vista; restaram apenas flechas de penas vivas cravadas em seus alvos.'],
      },
      roster2: {
        notes: {
          tora: ['Leve: chicote de corrente a média distância, foice de perto', 'Forte: lança a corrente; se acertar, puxa o oponente', 'Fim de combo: se o oponente estiver longe, a corrente o arrasta para perto'],
          jin: ['As duas pontas do bastão golpeiam; os golpes são contundentes e nunca tiram sangue', 'O terceiro golpe e a rasteira forte derrubam', 'A postura enche mais devagar enquanto defende'],
          mai: ['Janela de aparada maior', 'Na defesa, os leques devolvem projéteis', 'Forte: uma onda de vento empurra o oponente e dispersa projéteis'],
          tsubame: ['Forte: dispara uma flecha com o arco; segure para um tiro carregado', 'Arremesso: dá um mortal para trás e solta uma flecha no ar', 'Sem flechas, o ataque forte usa o tantō; as flechas recarregam com o tempo'],
        },
      },
    });

    merge(EN.CHARS, {
      akane: { title: 'Lâmina Carmesim', desc: 'Mestra da katana, equilibrada. Combo rápido de três golpes, aparada forte.', weapon: 'Katana' },
      aoi: { title: 'Vento Azul', desc: 'Espadachim ágil de katana. Anda um pouco mais rápido e se lança como o vento.', weapon: 'Katana' },
      kuro: { title: 'Montanha Negra', desc: 'Empunha uma longa nodachi. Golpes lentos, mas de grande alcance e força devastadora.', weapon: 'Nodachi' },
      yuki: { title: 'Raposa da Neve', desc: 'Golpeia muito rápido com uma kodachi curta. Muitos shuriken, cachecol longo.', weapon: 'Kodachi' },
      hana: { title: 'Dança da Cerejeira', desc: 'Kunoichi. Luta com dois tantō como se dançasse; as mãos mais rápidas, o alcance mais curto.', weapon: 'Tantō Duplo' },
      tetsu: { title: 'Fortaleza de Ferro', desc: 'Samurai de armadura. A naginata tem o maior alcance; golpes mal o arranham.', weapon: 'Naginata' },
      ren: { title: 'Oni Carmesim', desc: 'Máscara oni, estilo de rua. Aterroriza com golpes que quebram a defesa e chutes devastadores.', weapon: 'Uchigatana' },
      kage: { title: 'A Própria Sombra', desc: 'Sombra encapuzada. Rápida com a ninjatō, impulso longo; deixa uma sombra por onde passa.', weapon: 'Ninjatō' },
      tora: { title: 'Tigre Acorrentado', desc: 'Domina a kusarigama. Chicoteia a corrente com peso a média distância; o ataque forte puxa o oponente até a foice.', weapon: 'Kusarigama' },
      jin: { title: 'Monge do Bastão de Ferro', desc: 'Monge com bō. Um bastão longo que golpeia com as duas pontas, defesa sólida e golpes contundentes que derrubam; nunca tira sangue, só chacoalha os ossos.', weapon: 'Bō' },
      mai: { title: 'Dançarina dos Leques', desc: 'Kunoichi dos leques de guerra. Muito rápida, com janela de aparada ampla; os leques devolvem projéteis e seu vento afasta os oponentes.', weapon: 'Tessen Duplo' },
      tsubame: { title: 'Arqueira Andorinha', desc: 'Leva um arco e um tantō. Atira flechas de longe (segure forte para um tiro potente) e, quando alguém se aproxima, salta para trás atirando do ar.', weapon: 'Yumi + Tantō' },
      shura: { title: 'O Mestre Carmesim', desc: 'Um mestre demoníaco cujo caminho é traçado em carmesim. Nodachi longa, golpes esmagadores, aparadas quase perfeitas.', weapon: 'Nodachi' },
    });

    merge(EN.ARENAS, {
      temple: 'Templo ao Luar',
      rain: 'Bambuzal na Tempestade',
      snow: 'Pico Nevado',
      village: 'Aldeia em Chamas',
      market: 'Mercado Noturno',
      waterfall: 'Cachoeira',
      castle: 'Telhado do Castelo',
    });

    merge(EN.SPECIALS, {
      akane: { desc: 'Um corte iai carmesim que atravessa o oponente num piscar de olhos, deixando no ar uma meia-lua em chamas.', tip: 'Apare, ou saia de lado com um impulso' },
      aoi: { desc: 'Um golpe amplo que lança uma lâmina de vento para a frente; uma defesa no momento perfeito a reflete.', tip: 'Pule, corte-a com sua lâmina ou defenda no momento perfeito' },
      kuro: { desc: 'Salta e racha o chão com a nodachi; a onda de choque que corre pelo solo esmaga defesas e derruba.', tip: 'Pule a onda e golpeie no ar' },
      yuki: { desc: 'Uma rajada de cinco golpes rápida como um raio, feito uma nevasca; o último golpe derruba.', tip: 'Defenda e apare o primeiro golpe' },
      hana: { desc: 'Avança girando como um redemoinho de flores de cerejeira com os dois tantō, cortando dos dois lados.', tip: 'Defenda ou recue com um impulso' },
      tetsu: { desc: 'Gira a naginata ao redor do corpo; golpes não interrompem o giro (superarmadura).', tip: 'Saia do alcance ou apare' },
      ren: { desc: 'Uma ombrada que despedaça defesas, seguida de um corte ascendente que lança o oponente ao ar.', tip: 'Defender não adianta: apare, pule ou use o impulso' },
      kage: { desc: 'Some na fumaça, deixa um clone de sombra para trás e reaparece atrás do oponente para golpear.', tip: 'Defenda no instante em que Kage reaparecer' },
      tora: { desc: 'Gira a corrente acima da cabeça num ciclone que varre tudo ao redor; quem é pego é puxado e lançado aos céus pela foice.', tip: 'Saia do alcance ou defenda: se você não for pego, o puxão sai vazio' },
      jin: { desc: 'Avança girando o bastão como uma roda de diamante; após quatro golpes, um golpe ascendente lança o oponente.', tip: 'Recue com um impulso ou apare o primeiro golpe' },
      mai: { desc: 'Ergue um redemoinho que flutua para a frente, puxando o oponente, cortando e, por fim, lançando-o aos céus.', tip: 'Defenda o redemoinho no momento perfeito ou recue: ele é lento' },
      tsubame: { desc: 'Salta para trás e faz chover flechas do céu; se errar, dispara uma flecha-andorinha que faz a curva e acerta pelas costas.', tip: 'Saia das marcas no chão; a flecha-andorinha volta, então cuidado com as costas' },
      shura: { desc: 'Ruge e se dissolve em fumaça carmesim, surgindo à frente e atrás do oponente para desferir três cortes pesados de nodachi; o último lança.', tip: 'Fique de olho no brilho carmesim: aparar um corte encerra a técnica; defender esmaga sua postura' },
    });

    merge(EN.TXT, {
      gbreak: 'POSTURA QUEBRADA!', cut: 'CORTADO!', reflect: 'REFLETIDO!', parry: 'APARADO!', caught: 'PEGOU!',
      swallowHit: '燕!', vajraHit: '金剛!', whirlHit: '旋風の舞',
    });

    merge(EN.AI_LEVELS, { 0: 'Aprendiz', 1: 'Mestre', 2: 'Lenda', 3: 'Shura' });

    EN.NUMWORDS = ['Zero', 'Um', 'Dois', 'Três', 'Quatro', 'Cinco', 'Seis', 'Sete', 'Oito', 'Nove', 'Dez', 'Onze', 'Doze'];

    // ================================================================ static HTML, hardcoded literals, canvas pop-ups
    merge(EN.PHRASES, {
      // ---------------------------------------------------------------- index.html: <title>, brand, HUD
      'Gölge Düellosu': 'Shadow Duel',
      'Duraklat': 'Pausar',
      'KARŞILIKLI SERİ': 'TROCA',
      'SON DARBE': 'GOLPE FINAL',
      'atlamak için bir tuşa bas': 'aperte qualquer tecla para pular',
      // touch buttons (static fallbacks of data-s="touch.btn.*")
      'GARD': 'DEFESA',
      'HAFİF': 'LEVE',
      'SALDIR': 'ATAQUE',
      'AĞIR': 'FORTE',
      'ATIL': 'IMPULSO',
      'TEKME': 'CHUTE',
      // ---------------------------------------------------------------- main menu
      'Sekiz savaşçı, üç arena. Gerçek zamanlı kılıç çarpışması, kılıç kilitlenmesi, savuşturma, denge kırma, Gölge Kesiği ve ragdoll fiziği.': 'Oito lutadores, três arenas. Choques de espada em tempo real, travas de lâmina, aparadas, quebras de postura, o Corte das Sombras e física ragdoll.',
      'İki Oyuncu': 'Dois Jogadores',
      'Aynı klavyede ya da iki gamepad ile kafa kafaya': 'Frente a frente no mesmo teclado ou com dois gamepads',
      'CPU\'ya Karşı': 'Contra a CPU',
      'Ninjanı seç, rakibini yapay zekâ yönetsin': 'Escolha seu ninja e deixe a IA comandar o rival',
      'Zorluk': 'Dificuldade',
      'Çırak': 'Aprendiz',
      'Usta': 'Mestre',
      'Efsane': 'Lenda',
      'Aylık Turnuva': 'Torneio Mensal',
      'Dan Sınavı': 'Exame Dan',
      'Şampiyonlar Salonu': 'Salão dos Campeões',
      'Seyret': 'Assistir',
      'Rastgele iki ninja, Efsane yapay zekâ': 'Dois ninjas aleatórios, IA Lenda',
      'Ses': 'Som',
      'Müzik': 'Música',
      'Kan efekti': 'Sangue',
      'Tuş ipuçları': 'Dicas de teclas',
      'Yüksek grafik': 'Gráficos altos',
      // ---------------------------------------------------------------- controls card
      'Kontroller': 'Controles',
      '1. Oyuncu': 'Jogador 1',
      '2. Oyuncu': 'Jogador 2',
      'Yürü': 'Andar',
      'Zıpla': 'Pular',
      'Gard (basılı tut)': 'Defesa (segure)',
      'Hafif kesik (×3 kombo)': 'Corte leve (combo ×3)',
      'Ağır kesik': 'Corte forte',
      'Tekme': 'Chute',
      'Sol Shift': 'Shift esquerdo',
      'Sağ Shift': 'Shift direito',
      'Atılma': 'Impulso',
      'Ki tekniği (ki dolu)': 'Técnica de ki (ki cheio)',
      // ---------------------------------------------------------------- select screen
      'Ninjanı seç': 'Escolha seu ninja',
      'Hazır': 'Pronto',
      '1. oyuncunun ninjası': 'Ninja do jogador 1',
      '2. oyuncunun ninjası': 'Ninja do jogador 2',
      'Önceki ninja': 'Ninja anterior',
      'Sonraki ninja': 'Próximo ninja',
      '1. oyuncu kadrosu': 'Elenco do jogador 1',
      '2. oyuncu kadrosu': 'Elenco do jogador 2',
      'Dövüşe başla': 'Começar luta',
      'Geri': 'Voltar',
      'Kilitli': 'Bloqueado',
      'Rastgele': 'Aleatório',
      'Hız': 'Velocidade',
      'Güç': 'Força',
      'Menzil': 'Alcance',
      'Can': 'Vida',
      // ---------------------------------------------------------------- pause / end
      'Duraklatıldı': 'Pausado',
      'Devam et': 'Continuar',
      'Maçı yeniden başlat': 'Reiniciar luta',
      'Ana menü': 'Menu principal',
      'Rövanş': 'Revanche',
      'Karakter değiştir': 'Trocar lutador',
      'Zafer senin': 'A vitória é sua',
      'Raund': 'Rounds',
      'Verilen hasar': 'Dano causado',
      'Savuşturma': 'Aparadas',
      'Ki Saldırısı': 'Ataques de ki',
      // ---------------------------------------------------------------- training / leaderboard / misc
      'Antrenman': 'Treino',
      'ANTRENMAN': 'TREINO',
      'Sıralama': 'Ranking',
      'Tümü': 'Todos',
      'Ekranı yan çevir': 'Gire a tela',
      'Performans için grafik düşürüldü': 'Gráficos reduzidos para melhor desempenho',
      // hidden boss pushed into ND.CHARS by arcade.js (safety net; EN.CHARS.shura should carry the same)
      'Kanlı Usta': 'O Mestre Sangrento',
      'Yolunu kanla çizen iblis usta. Uzun nodachi, yıkıcı darbeler, neredeyse kusursuz savuşturma.': 'Um mestre demoníaco que abre caminho com sangue. Nodachi longa, golpes esmagadores, aparadas quase perfeitas.',
      // ---------------------------------------------------------------- HUD tags (fallbacks when STR.hud is missing)
      'SEN': 'VOCÊ',
      'KUKLA': 'BONECO',
      // ---------------------------------------------------------------- round banners (#bt / #bs)
      'Son raund': 'Último round',
      'Kazanan her şeyi alır': 'Quem vencer leva tudo',
      'İlk iki raundu alan kazanır': 'Vence quem levar dois rounds',
      'Dövüş!': 'Lutem!',
      'Süre doldu': 'Tempo esgotado',
      'Berabere': 'Empate',
      'Çifte K.O.': 'Duplo K.O.',
      'Mükemmel': 'Perfeito',
      // blade-lock hint (fallbacks of STR.hud.lockSolo / lockDuo)
      'F / K tuşuna hızlıca bas!': 'Martele F / K!',
      'Hafif ya da ağır tuşuna hızlıca bas!': 'Martele leve ou forte!',
      // counter / parry prompt labels under the key ring (ctx.fillText in drawPrompts)
      'KARŞILIK': 'CONTRA',
      'SAVUŞTUR': 'APARE',
      // ---------------------------------------------------------------- canvas pop-ups (fx.text)
      'SON VURUŞ!': 'FINALIZAÇÃO!',
      'KİLİTLENDİ!': 'LÂMINAS TRAVADAS!',
      'İTTİ!': 'EMPURRÃO!',
      'DENGE KIRILDI!': 'POSTURA QUEBRADA!',
      'GARD KIRILDI!': 'DEFESA QUEBRADA!',
      'KESİLDİ!': 'FATIADO!',
      'YANSITMA!': 'REFLETIDO!',
      'SAVUŞTURMA!': 'APARADO!',
      'YAKALANDI!': 'PEGOU!',
      'ZIRH!': 'ARMADURA!',
      'ARKADAN!': 'PELAS COSTAS!',
      'DUVAR!': 'PAREDE!',
      'KAFA!': 'NA CABEÇA!',
      'KARŞI!': 'INTERCEPTADO!',
      'KRİTİK!': 'CRÍTICO!',
      'SÜPÜRME!': 'RASTEIRA!',
      'KARŞILIK!': 'CONTRAGOLPE!',
      'YERE SERİLDİ': 'NO CHÃO',
      'ÇARPIŞMA!': 'CHOQUE!',
    });

    merge(EN.HTML, {
      // brand title (the brand name stays "Shadow Duel" on every portal)
      'Gölge<br><em>Düel</em><em>losu</em>': 'Shadow<br><em>Du</em><em>el</em>',
      // tips list (<ul class="tips">)
      '<b>Savuşturma:</b> darbe gelmeden hemen önce gard tuşuna bas; rakip sendeler.':
        '<b>Aparar:</b> aperte defesa logo antes de o golpe acertar; o oponente cambaleia.',
      '<b>Karşılık (返し技):</b> gard ya da savuşturmanın hemen ardından saldırı tuşu → anında karşı kesik. <b>İleri</b> + hafif = bacağa süpürme, <b>geri</b> + hafif = yanından dönüp arkadan kesme, <b>ağır</b> = güçlü karşı darbe.':
        '<b>Contragolpe (返し技):</b> ataque logo após uma defesa ou aparada → corte de contragolpe instantâneo. <b>Frente</b> + leve = rasteira nas pernas, <b>trás</b> + leve = contorno que corta pelas costas, <b>forte</b> = contragolpe poderoso.',
      '<b>Karşılıklı seri:</b> karşılık da karşılanabilir. Her turda vuruşlar hızlanır ve güçlenir; kendi 3. karşılığın üç vuruşluk sinematik bir bitirişe dönüşür. Seriyi kıran darbe ağır çekimde iner.':
        '<b>Troca:</b> contragolpes também podem ser rebatidos. A cada troca, os golpes ficam mais rápidos e fortes; seu 3º contragolpe vira uma finalização cinematográfica de três golpes. O golpe que rompe a troca cai em câmera lenta.',
      '<b>Kılıç kilidi:</b> kılıçlar çarpışınca kilitlenebilir. Hafif/ağır tuşuna hızlı basan rakibini iter.':
        '<b>Trava de lâminas:</b> lâminas que se chocam podem travar. Quem martelar leve/forte mais rápido empurra o outro.',
      '<b>Ki barı</b> vurdukça, yedikçe ve savuşturdukça dolar. Dolunca her ninjanın kendine özgü ki tekniği açılır (Antrenman’daki hareket listesinde görebilirsin).':
        'A <b>barra de ki</b> enche quando você acerta, apanha e apara. Cheia, libera a técnica de ki exclusiva de cada ninja (veja a lista de golpes no Treino).',
      '<b>Atılma + hafif</b> = atılarak kesik. <b>Havada</b> hafif = hava kesiği, ağır = dalış. Ağır kesik yere serer, duvara çarpan geri seker.':
        '<b>Impulso + leve</b> = corte com impulso. <b>No ar</b>, leve = corte aéreo, forte = mergulho. O corte forte derruba; quem bate na parede ricocheteia.',
      '<b>Denge çubuğu</b> dolarsa gard kırılır. Tekme gardı delip dengeyi hızla doldurur.':
        'Quando a <b>barra de postura</b> enche, a defesa quebra. Chutes atravessam a defesa e enchem a postura rápido.',
      // gamepad note (Esc -> Start or P)
      'Gamepad: X hafif · Y ağır · B tekme · A zıpla · LB gard · RB shuriken · RT atılma · R3 ki tekniği. Start ya da <kbd>P</kbd> duraklatır. CPU modunda her iki tuş seti de seni yönetir.':
        'Gamepad: X leve · Y forte · B chute · A pular · LB defesa · RB shuriken · RT impulso · R3 técnica de ki. Start ou <kbd>P</kbd> pausa. No modo CPU, os dois conjuntos de teclas controlam você.',
      // select / VS hints (Esc -> ⌫)
      '<kbd>Enter</kbd> başlatır · <kbd>⌫</kbd> menüye döner': '<kbd>Enter</kbd> começar · <kbd>⌫</kbd> voltar',
      '<kbd>Enter</kbd> / <kbd>F</kbd> başlatır · <kbd>⌫</kbd> çıkar': '<kbd>Enter</kbd> / <kbd>F</kbd> começar · <kbd>⌫</kbd> sair',
    });

    EN.PATTERNS.push(
      // HUD round label (#rlabel) and round banner ("round" is the word Brazilian fighting games use)
      [/^RAUND (\d+)$/, 'ROUND $1'],
      [/^(\d+)\. Raund$/, 'Round $1'],
      // canvas pop-ups built from numbers
      [/^(\d+)\. KARŞILIK$/, 'CONTRAGOLPE ×$1'],
      [/^(\d+) VURUŞLUK SERİ!$/, 'TROCA DE $1 GOLPES!'],
      // time-up banner sub: `${name} önde`
      [/^(.+) önde$/, (m, n) => I.t(n) + ' na frente'],
      // end screen title: `${Name} kazandı`
      [/^(.+) kazandı$/, (m, n) => I.t(n) + ' vence'],
      // end screen sub line: `${a} – ${b} · ${round} raund · ${arenaName}`
      [/^(\d+) – (\d+) · (\d+) raund · (.+)$/, (m, a, b, r, ar) => `${a} – ${b} · ${r} ${r === '1' ? 'round' : 'rounds'} · ${I.t(ar)}`],
    );

    // ================================================================ added with the portal build (PLAY, ads, coach)
    merge(EN.STR, {
      menu: { play: 'Jogar', playSub: (name, lv) => `${name} vs CPU · ${lv}` },
      first: { play: 'Jogar', sub: 'Um toque e você já está lutando', menu: 'Todos os modos' },
      ads: {
        cont: 'Continuar daqui', contSub: 'Veja um anúncio · tente de novo sem penalidade',
        trial: (name) => `Teste ${name} por uma luta`, trialSub: 'Veja um anúncio',
        fail: 'Nenhum anúncio agora, tente de novo em instantes',
      },
      coach: {
        attack: (l) => `${l} Atacar`,
        guard: (l, g) => `Segure ${g} para defender`,
        parry: (l, g) => `Aperte ${g} logo antes de um golpe acertar: aparar`,
        attackT: (l) => `Toque em ${l} · continue tocando: combo`,
        guardT: (l, g) => `Segure ${g} para defender`,
        parryT: (l, g) => `Toque em ${g} logo antes de um golpe acertar: aparar`,
      },
    });

    // ================================================================ VOLUME: sliders on the menu card and in pause (js/volume.js)
    merge(EN.STR, {
      vol: {
        title: 'Volume', master: 'Geral', music: 'Música', sfx: 'Efeitos', sound: 'Som',
        pct: (n) => `${n}%`,
        muted: 'O som está desligado. Mexa num controle para religar.',
        // Settings > Audio: character / announcer voices switch (js/voice.js) and the courtesy credit under it
        voice: 'Vozes',
        credit: 'Vozes: ユーフルカ (youfulca.com) · 効果音ラボ · すぱらんど',
      },
    });

    // ================================================================ TOUCH LAYOUT EDITOR: movement modes + "Customize controls"
    // (js/touch.js settings rows, js/touch-editor.js; Turkish source in i18n.js, block "touch movement modes + layout editor")
    merge(EN.STR, {
      tedit: {
        move: 'Movimento',
        moves: { float: 'Analógico', fixed: 'Analógico fixo', dpad: 'Direcional' },
        mnote: {
          float: 'O analógico aparece onde seu polegar tocar.',
          fixed: 'O analógico fica onde você o colocar; empurre a partir do centro.',
          dpad: 'Botões separados: segure para andar, toque duplo para impulso. Aperte entre dois botões para acionar os dois (▶ + ▲ = pular para frente).',
          dtap: 'Botões separados: um toque rápido em ◀ ▶ dá um passo curto, segure para andar, toque duplo para impulso.',
        },
        dtap: 'Toque: um passo',
        edit: 'Personalizar controles',
        title: 'Personalizar controles',
        hint: 'Arraste um botão para qualquer lugar. Toque nele para mudar tamanho, opacidade ou ocultá-lo.',
        rotate: 'Gire a tela para organizar os controles de luta.',
        shapes: { phone: 'Celular', tablet: 'Tablet', portrait: 'Vertical' },
        screenNote: 'O layout é salvo para este formato de tela: celulares e tablets guardam cada um o seu.',
        save: 'Salvar', cancel: 'Cancelar', options: 'Opções', done: 'Pronto', close: 'Fechar',
        size: 'Tamanho', sizes: { s: 'P', m: 'M', l: 'G', xl: 'GG' },
        opacity: 'Opacidade', opacityAll: 'Opacidade (todos)',
        hide: 'Ocultar', show: 'Mostrar', hidden: 'Oculto',
        snap: 'Alinhar à grade',
        presets: 'Predefinições', pRight: 'Mão direita', pLeft: 'Mão esquerda', pSplit: 'Defesa à esquerda',
        reset: 'Restaurar padrão', resetDone: 'O layout padrão voltou (vale quando você salvar).',
        overlap: 'Os botões não podem se sobrepor: movido para o espaço livre mais próximo.',
        noRoom: 'Não há espaço ali: o botão voltou.',
        saved: 'Controles salvos',
        throwName: 'SHURIKEN',
        pauseName: 'Pausa',
        dirs: { dl: '◀ Esquerda', dr: 'Direita ▶', du: '▲ Pular', dd: '▼ Defesa' },
      },
    });

    // ================================================================ PROGRESSION: honor, rival challenges, moves panel
    // (arcade.js STR.honor / STR.rival / STR.hint, game.js select screen; rules in js/honor.js)
    merge(EN.STR, {
      menu: { arcadeDesc: 'Vença seus rivais um a um enquanto a dificuldade sobe, com um mestre oculto à espera no fim. A maior fonte de honra.' },
      sel: {
        title: { rival: 'Desafio Rival · Escolha seu ninja' },
        go: { rival: 'Aceitar o duelo' },
        moves: 'Golpes',
        movesOf: (name) => `${name} · Golpes`,
        close: 'Fechar',
      },
      hint: {
        honor: (have, need) => `Honra ${num(Math.min(have, need))}/${num(need)} → abre o Desafio Rival`,
        ready: 'Um desafio te espera!',
        arenaHonor: (have, need) => `Abre com ${num(need)} de honra (${num(Math.min(have, need))}/${num(need)})`,
      },
      honor: {
        name: 'Honra',
        head: 'Honra',
        rows: { win: 'Vitória', loss: 'Presença', rounds: 'Rounds vencidos', perfect: 'Round perfeito', rally: 'Troca de contragolpes', counter: 'Contragolpe', parry: 'Aparada', rivalWin: 'Desafio Rival', arcadeClear: 'Arcade concluído' },
        total: (n) => `Honra: ${num(n)}`,
        next: (name, left) => `Próximo ninja: ${name} — faltam ${num(left)} de honra`,
        bar: (have, need) => `Honra ${num(Math.min(have, need))}/${num(need)} → abre o Desafio Rival`,
        ready: (name) => `${name} desafia você!`,
        readyGo: 'Aceitar',
        all: 'Todos os ninjas liberados',
        bonus: { arcadeClear: 'Arcade concluído', tourneyClear: 'Torneio conquistado', danPass: 'Exame Dan aprovado', rivalWin: 'Desafio Rival vencido', tutorial: 'Tutorial concluído' },
        bonusToast: (n, what) => `+${num(n)} de honra · ${what}`,
        road: 'Caminho da Honra',
        roadSub: 'Você ganha honra em todos os modos para um jogador. Alcance a marca de um ninja e ele desafia você para um duelo; vença e ele se junta a você.',
        earnHead: 'De onde vem a honra',
        earn: (H) => [
          ['Contra a CPU', `Vitória: Aprendiz ${H.win[0]} · Mestre ${H.win[1]} · Lenda ${H.win[2]}`],
          ['Arcade', `Vitórias por dificuldade · Shura ${H.win[3]} · concluir +${H.arcadeClear}`],
          ['Torneio e Dan', `Vitórias ×${H.modeMul.tourney} · conquistar o torneio +${H.tourneyClear} · cada exame Dan +${H.danPass(1)} ou mais`],
          ['Mesmo na derrota', `Presença ${H.loss} · cada round vencido ${H.roundWon}`],
          ['Bom jogo', `Aparadas, contragolpes, trocas, rounds perfeitos: até +${H.styleCap} por luta`],
        ],
        rivalsHead: 'Rivais',
        arenasHead: 'Arenas',
        open: 'Liberado',
        castle: 'Derrote Shura no Arcade',
        you: (n) => `Sua honra: ${num(n)}`,
      },
      rival: {
        stage: 'Desafio Rival',
        selTitle: (name) => `${name} desafia você · Escolha seu ninja`,
        lvHp: (lv, p) => (p === 100 ? lv : `${lv} · vida do rival ${p}%`),
        accept: 'Aceitar o desafio',
        acceptSub: (name) => `Vença e ${name} se junta a você`,
        quit: 'Recuar',
        hud: 'DESAFIO RIVAL',
        winTitle: (name) => `${name} se junta a você!`,
        winSub: (name) => `${name} já está na tela de seleção. Experimente agora mesmo!`,
        tryNew: (name) => `Jogar com ${name}`,
        lossTitle: 'O desafio continua',
        lossSub: (name, p) => `${name} venceu desta vez. Perder não custa nada; na próxima, a luta começa com ${p}% de vida para o rival.`,
        lossSubMin: (name) => `${name} venceu desta vez. Perder não custa nada; tente de novo.`,
        retry: 'Desafiar de novo',
        reveal: 'Novo ninja',
        toastReady: (name) => `${name} desafia você!`,
        lines: {
          hana: 'Ouvi falar da sua honra, o mercado inteiro fala de você! Acompanhe minha dança e eu vou com você!',
          tetsu: 'Seu nome chegou aos meus ouvidos. Derrote-me e minha naginata lutará ao seu lado.',
          ren: 'Ha! Finalmente alguém me chamou! Vença e sou todo seu; perca e vai ter que ouvir minha risada!',
          kage: 'Venho observando você há algum tempo. Alcance minha sombra e serei seu.',
          tora: 'Prove que não é presa. Escape da minha corrente e caminharei ao seu lado.',
          jin: 'Se sua honra vem do coração, meu bastão saberá. Venha, deixe-me pôr você à prova.',
          mai: 'Meu palco espera por você. Conquiste meus aplausos e minha dança será sua.',
          tsubame: 'Observei de longe; você tem talento. Desvie das minhas flechas e meu arco será seu.',
        },
      },
    });

    // ================================================================ COMBAT: new kits, combos, move list (combat designer)
    // Akane/Aoi/Ren/Kage identities, combo counter, ki cancel, ND.MOVELIST names/descriptions (read through ND.i18n.t)
    merge(EN.CHARS, {
      akane: { desc: 'Mestra do iaijutsu. A lâmina espera na bainha e cada corte é um saque; sua postura de saque apanha os golpes que chegam.', weapon: 'Katana (iai)' },
      aoi: { desc: 'Esgrimista do vento com tachi de uma mão. Estocadas de longo alcance e passos de vento fecham qualquer distância num só movimento.', weapon: 'Tachi' },
      ren: { desc: 'Máscara oni, estilo de rua. Espada no ombro; luta com cotovelos, joelhos, ombro e cabeça, e esmaga defesas.' },
      kage: { desc: 'Sombra encapuzada. Empunha a ninjatō invertida; luta com passos de sombra, fintas e bombas de fumaça.' },
    });
    merge(EN.TXT, { kiCancel: 'KI CANCELADO!', launch: 'LANÇADO!', iaiCatch: 'IAI GAESHI!' });
    EN.PATTERNS.push([/^(\d+) VURUŞ$/, (m, n) => (n === '1' ? '1 GOLPE' : n + ' GOLPES')]);
    merge(EN.PHRASES, {
      // shared rows
      'Tekme': 'Chute',
      'Tekme: dengeyi hızla doldurur, gardı kırmaya yarar. Ardından AĞIR ile seri bitirişine bağlanır.': 'Chute: enche a postura rápido e ajuda a quebrar defesas. Emende FORTE para fechar a sequência.',
      'Shuriken fırlatır; zamanla yeniden dolar.': 'Lança um shuriken; eles recarregam com o tempo.',
      'Hava kesiği': 'Corte aéreo',
      'Havada hafif kesik. Havaya fırlatılmış rakibe de vurur.': 'Um corte leve no ar. Também acerta um oponente lançado.',
      'Dalış': 'Mergulho',
      'Havadan aşağı dalış kesiği; yere serer.': 'Um corte em mergulho vindo do ar; derruba.',
      'Kaeshi-waza (karşılık)': 'Kaeshi-waza (contragolpe)',
      'Gard ya da savuşturmanın hemen ardından karşılık: nötr Suriage, ileri Harai (yere serer), geri Nuki (arkaya geçer), ağır Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.': 'Contragolpe logo após uma defesa ou aparada: neutro Suriage, frente Harai (derruba), trás Nuki (passa por trás), forte Uchiotoshi. Sua terceira resposta é a finalização; se for aparada, a troca continua.',
      'Fırlatıcı isabet edince HAFİF: rakibin peşinden sıçrayıp havada keser. Ardından AĞIR ile yere çakar. Havadaki rakip en çok üç vuruş alır.': 'Quando o lançador acerta, LEVE: salte atrás do oponente e corte no ar. Depois, FORTE o crava no chão. Um oponente no ar sofre no máximo três golpes.',
      'Üç vuruşluk hafif seri. İkinci ve üçüncü vuruş ki doluyken tekniğe bağlanır.': 'Uma sequência leve de três golpes. Com ki cheio, o segundo e o terceiro golpes cancelam na técnica de ki.',
      'Ağır vuruş: yavaş ama yere serer.': 'Golpe forte: lento, mas derruba.',
      'İleri atılarak dürter; hafif seriye devam eder.': 'Avança com uma estocada; emenda na sequência leve.',
      'Yarım adım geri çekilip bacaklara alçak süpürme; yere serer.': 'Meio passo atrás e uma rasteira baixa nas pernas; derruba.',
      'Fırlatıcı: yükselen kesik rakibi havaya kaldırır.': 'Lançador: um corte ascendente ergue o oponente no ar.',
      'Sıçrayıp tepeden iner: yavaş ama gardı ezer, yere serer.': 'Salta e desce do alto: lento, mas esmaga a defesa e derruba.',
      'Atılırken dönerek geniş kesik; yere serer.': 'Um corte amplo girando, saído de um impulso; derruba.',
      'İki kesiklik seri bitirişi; son kesik yere serer.': 'Fim de sequência com dois cortes; o último derruba.',
      'Rakibin kılıcını aşağı çarpıp dürter: gardı ezer.': 'Bate a lâmina do oponente para baixo e estoca: esmaga a defesa.',
      // Akane
      'Kından yatay çekiş kesiği, çapraz iniş, geri dönen kesik; kılıç her seferinde kınına döner.': 'Um corte horizontal sacando da bainha, um corte diagonal descendente e um corte de retorno; a lâmina volta à bainha a cada vez.',
      'Derin çömelişten geniş yatay çekiş; yere serer.': 'Um amplo saque horizontal a partir de um agachamento profundo; derruba.',
      'Atılarak kından çekiş: uzak mesafeyi bir anda kapatır, seriye devam eder.': 'Um saque da bainha com impulso: fecha uma grande distância num instante e continua a sequência.',
      'Kılıcı çekmeden kabzayla göğse vurur: hızlı, sersemletir. Ardından HAFİF ile Kesa ya da AĞIR ile Kurenai Renga.': 'Golpeia o peito com o cabo, sem sacar: rápido e atordoante. Emende LEVE para Kesa ou FORTE para Kurenai Renga.',
      'Fırlatıcı: kından yükselen çekiş rakibi havaya kaldırır.': 'Lançador: um saque ascendente da bainha ergue o oponente no ar.',
      'Çekiş duruşu: kısa bir an bekler; bu sırada gelen yakın dövüş darbesini yakalar ve kaçınılmaz bir iai kesiğiyle karşılık verir. Boşa giderse açık kalır.': 'Postura de saque: espera por um instante; um golpe corpo a corpo que chegue nesse momento é apanhado e respondido com um corte iai inevitável. Se nada vier, ela fica exposta.',
      'Kesa’dan sonra yükselen ve inen iki çekiş kesiği; son kesik yere serer.': 'Após Kesa, dois cortes de saque, um ascendente e um descendente; o último derruba.',
      'Tekmeden sonra çömelip rakibin içinden geçen kızıl iai; arkasında belirir.': 'Após o chute, um iai carmesim agachado que atravessa o oponente; ela reaparece atrás.',
      // Aoi
      'Tek elle uzun dürtüş, yukarı savrulan kesik ve rüzgâr adımıyla derin atılma dürtüşü.': 'Uma estocada longa com uma mão, um corte ascendente em chicote e uma estocada profunda num passo de vento.',
      'Dönerek geniş yatay kesik; yere serer.': 'Um amplo corte horizontal girando; derruba.',
      'Rüzgâr adımı: çok uzaktan tek hamlede dürter, seriye devam eder.': 'Passo de vento: estoca de muito longe num só movimento e continua a sequência.',
      'Geri çekilirken uzun menzilli iniş kesiği: yaklaşanı cezalandırır.': 'Um corte descendente de longo alcance enquanto recua: pune quem se aproxima.',
      'Fırlatıcı: dönerek yükselen kesik rakibi havaya kaldırır.': 'Lançador: um corte ascendente girando ergue o oponente no ar.',
      'Geri sıçrar, ardından çok uzağa uzanan dürtüşle geri döner: gardı ezer, yere serer.': 'Salta para trás e volta com uma estocada longuíssima: esmaga a defesa e derruba.',
      'Üç hızlı dürtüş; sonuncusu rüzgârla rakibi savurur.': 'Três estocadas rápidas; a última sopra o oponente para longe com o vento.',
      'İki kez dönerek çevresini biçen kesik; gardı ezer.': 'Gira duas vezes, cortando tudo ao redor; esmaga a defesa.',
      // Ren
      'Kesik · Dirsek · Diz': 'Corte · Cotovelo · Joelho',
      'Tek elle kesik, dirsek darbesi ve uçan diz: kılıçla başlayıp bedenle biter.': 'Um corte com uma mão, uma cotovelada e uma joelhada voadora: começa com a espada e termina com o corpo.',
      'İki elle tepeden ezici iniş; gardı zorlar, yere serer.': 'Um golpe esmagador de cima, com as duas mãos; força a defesa e derruba.',
      'Omuz hücumu: öne atılıp omuzla çarpar, dengeyi sarsar. İsabet ederse seriye devam eder.': 'Ombrada: avança e bate com o ombro, abalando a postura. Se acertar, continua a sequência.',
      'Kafa atar: kısa menzil, uzun sersemletme. İsabet ederse seriye devam eder.': 'Cabeçada: alcance curto, atordoamento longo. Se acertar, continua a sequência.',
      'Fırlatıcı: aşağıdan yukarı iki elle savrulan kesik.': 'Lançador: um corte com as duas mãos, de baixo para cima.',
      'Topuğu havaya kaldırıp balta gibi indirir: yere serer.': 'Ergue o calcanhar bem alto e o desce como um machado: derruba.',
      'Dirsekten sonra kesik ve tepeden ezici iniş; son vuruş yere serer.': 'Após a cotovelada, um corte e um golpe esmagador de cima; o último golpe derruba.',
      'Tekmenin ardından dönen topuk tekmesi; yere serer.': 'Após o chute, um chute giratório de calcanhar; derruba.',
      // Kage
      'Ters tutuşla kesik, dönen kesik ve gölge adımı: kaybolup öne geçer, dürterek belirir.': 'Um corte com a lâmina invertida, um corte giratório e um passo de sombra: some, avança e reaparece estocando.',
      'Sıçrayıp ters tutuşla aşağı saplar; yere serer.': 'Salta e crava para baixo com a lâmina invertida; derruba.',
      'Gölge gibi uzun atılma kesiği; seriye devam eder.': 'Um longo corte com impulso, como uma sombra; continua a sequência.',
      'Aldatma: kesecekmiş gibi parlar, dumanla geri kaçar. Erken savuşturmayı boşa çıkarır; hemen HAFİF ile gölge adımına, AĞIR ile Kage-nui’ye bağlanır.': 'Finta: brilha como se fosse cortar e escapa para trás na fumaça. Desperdiça uma aparada antecipada; emenda na hora no passo de sombra com LEVE ou em Kage-nui com FORTE.',
      'Fırlatıcı: ters tutuşla yükselen kesik.': 'Lançador: um corte ascendente com a lâmina invertida.',
      'Ayağının dibine sis bombası atar: yakındakini sersemletir, Kage dumanın içinde geri kaçar.': 'Joga uma bomba de fumaça aos próprios pés: atordoa quem estiver perto enquanto Kage escapa para trás na fumaça.',
      'Üç hızlı ters kesik ve aşağı saplama; sonuncusu yere serer.': 'Três cortes invertidos rápidos e uma estocada para baixo; o último derruba.',
      'Tekmeden sonra dumanda kaybolur, rakibin arkasında belirip saplar.': 'Após o chute, some na fumaça e reaparece atrás do oponente, cravando a lâmina.',
      // template row names
      'Nodachi serisi': 'Sequência de nodachi', 'Ağır nodachi': 'Nodachi forte', 'Kodachi serisi': 'Sequência de kodachi', 'Ağır kesik': 'Corte forte',
      'Tantō dansı': 'Dança do tantō', 'Çift kesik': 'Corte duplo', 'Naginata serisi': 'Sequência de naginata', 'Ağır savuruş': 'Talho forte',
      'Zincir ve orak': 'Corrente e foice', 'Zincir çekişi': 'Puxão de corrente', 'Asa serisi': 'Sequência de bastão', 'Ağır süpürme': 'Rasteira forte',
      'Yelpaze serisi': 'Sequência de leques', 'Rüzgâr dalgası': 'Onda de vento', 'Tantō serisi': 'Sequência de tantō', 'Ok (basılı tut: güçlü)': 'Flecha (segure: tiro potente)',
      'Geri + AĞIR da ok atar (basılı tut: güçlü atış); ok kalmadıysa tantō ile tepeden iner.': 'Trás + FORTE também dispara uma flecha (segure para um tiro potente); sem flechas, ela desce do alto com o tantō.',
      // combat pop-ups
      'KI İPTALİ!': 'KI CANCELADO!', 'HAVAYA!': 'LANÇADO!',
    });

    // ================================================================ COUNTER CINEMATIC + COMBO TRIAL (combat feel pass)
    // js/kaeshi-cine.js STR.kaeshi, js/combo-trial.js STR.trial, js/coach.js combo/counter tips, move list legend
    {
      const tb = (t, c) => `<i class="tb${c ? ' ' + c : ''}">${t}</i>`;
      merge(EN.STR, {
        kaeshi: {
          head: 'KAESHI-WAZA', strike: 'CORTE!', hits: 'GOLPES',
          labels: {
            suriage: 'Suba pela lâmina rival, corte em diagonal',
            harai: 'Afaste a lâmina rival, corte as pernas',
            nuki: 'Escape do golpe, corte pelas costas',
            uchiotoshi: 'Derrube a lâmina rival e atravesse',
            sandan: "Contragolpe de três cortes",
          },
        },
        trial: {
          title: 'Prova de combo',
          btn: { prev: 'Combo anterior', next: 'Próximo combo', retry: 'Recomeçar', close: 'Fechar' },
          names: { chain: 'Sequência básica', s1: 'Fim de sequência', s2: 'Sequência com chute', launch: 'Lançador', s3: 'Combo longo' },
          desc: {
            chain: '{L} três vezes. Aperte cada um quando o golpe anterior acertar; a sequência termina numa finalização com nome.',
            s1: '{L} duas vezes, depois {H}: a sequência termina com um corte forte.',
            s2: '{L}, chute {K}, depois {H}.',
            launch: '{D} + {H} lança; com o oponente no ar, {L}, depois {H}.',
            s3: 'Dois {L}, {D} + {H} para lançar, {L}, {H}: cinco golpes.',
          },
          ready: (w) => `Comece: ${w}`,
          startWith: (w) => `Este combo começa com ${w}.`,
          early: 'Cedo demais: aperte quando o golpe anterior acertar.',
          late: 'Tarde demais: aperte antes de o golpe terminar, assim que ele acertar.',
          wrong: (got, want) => `Botão errado: ${got}; este passo pede ${want}.`,
          dir: (want) => `Falta a direção: ${want}. Segure a direção e depois aperte.`,
          miss: 'Errou: o golpe não acertou. Chegue mais perto do boneco.',
          clear: 'COMBO CONCLUÍDO!', clearPop: 'COMBO CONCLUÍDO!',
          all: 'Todas as provas de combo deste ninja concluídas!',
        },
        coach: {
          combo: (l) => `${l} ${l} ${l} rápido: combo de 3 golpes`,
          comboT: (l) => `Toque em ${l} três vezes seguidas: combo`,
          counter: (l) => `Após uma defesa ou aparada, aperte ${l} quando CORTE! aparecer: contragolpe`,
          counterT: (l) => `Após uma defesa ou aparada, toque em ${l} quando CORTE! aparecer`,
        },
      });
      const L = Array.isArray(EN.STR.lessons) && EN.STR.lessons.find((l) => l.id === 'counter');
      if (L) L.d = 'Após uma defesa ou aparada, <b>CORTE!</b> aparece sobre sua cabeça: aperte <kbd>F</kbd> antes que a barra acabe. Frente/trás + <kbd>F</kbd> ou <kbd>G</kbd> são outros contragolpes.';
      if (EN.STR.lessonsTouch) EN.STR.lessonsTouch.counter = `Após uma defesa ou aparada, <b>CORTE!</b> aparece sobre sua cabeça: toque em ${tb('ATAQUE', 'tb-light')} antes que a barra acabe. Analógico para frente/trás + ${tb('ATAQUE', 'tb-light')} ou ${tb('FORTE')} são outros contragolpes.`;
      merge(EN.PHRASES, {
        'KOMBO TAMAM!': 'COMBO CONCLUÍDO!',
        'Nasıl okunur': 'Como ler',
        '→ rakibe doğru, ← rakipten uzağa demek: o yön tuşunu (A / D ya da ok tuşları; rakip sağındaysa D) basılı tut ve saldırı tuşuna bas. Virgül: tuşlara sırayla bas. F hafif, G ağır, R tekme, S gard.':
          '→ significa na direção do oponente, ← para longe dele: segure essa tecla de direção (A / D ou as setas; D quando o oponente está à sua direita) e aperte a tecla de ataque. Vírgula: aperte as teclas uma após a outra. F leve, G forte, R chute, S defesa.',
        '▶ rakibe doğru, ◀ rakipten uzağa: yön çubuğunu o yana itip düğmeye dokun. Virgül: düğmelere sırayla dokun. Antrenmandaki Kombo denemesi her seriyi adım adım gösterir.':
          '▶ na direção do oponente, ◀ para longe: empurre o analógico para esse lado e toque no botão. Vírgula: toque nos botões um após o outro. A Prova de combo, no Treino, mostra cada sequência passo a passo.',
        'Gard ya da savuşturmanın ardından ekranda VUR! çıkar: altındaki çubuk bitmeden HAFİF’e bas. Yalnız HAFİF: Suriage. İleri + HAFİF: Harai (yere serer). Geri + HAFİF: Nuki (arkaya geçer). AĞIR: Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.':
          'Após uma defesa ou aparada, CORTE! aparece: aperte LEVE antes que a barra acabe. Só LEVE: Suriage. Frente + LEVE: Harai (derruba). Trás + LEVE: Nuki (passa por trás). FORTE: Uchiotoshi. Sua terceira resposta é a finalização; se for aparada, a troca continua.',
      });
    }

    // ================================================================ GRAPHICS QUALITY: the Graphics setting (js/gfx.js)
    // (Turkish source in i18n.js, block "graphics quality")
    merge(EN.STR, {
      gfx: {
        title: 'Gráficos',
        levels: { auto: 'Automático', high: 'Alto', medium: 'Médio', low: 'Baixo' },
        note: {
          auto: 'Escolhe conforme o aparelho e reduz sozinho se a luta engasgar.',
          high: 'Todas as luzes e efeitos. Para aparelhos potentes.',
          medium: 'Brilho leve, sem sombras. Para a maioria dos celulares.',
          low: 'O mais fluido. Para celulares mais antigos.',
        },
        now: (lv) => `Agora: ${lv}`,
      },
    });

    // ================================================================ FRAME RATE: Settings → Graphics (js/gfx.js makePacer)
    // (Turkish source in i18n.js, block "frame rate"; the numbers themselves are not translated)
    merge(EN.STR, {
      fps: {
        title: 'Taxa de quadros',
        show: 'Mostrar FPS',
        levels: { max: 'Máx' },
        note: {
          60: 'Estável e sem aquecer. O melhor para a maioria dos celulares.',
          90: 'Mais fluido se a tela suportar. Gasta mais bateria.',
          120: 'O mais fluido em telas de 120 Hz. Gasta mais bateria.',
          max: 'Tão rápido quanto sua tela permitir.',
        },
      },
    });

    // ================================================================ SETTINGS SCREEN (js/settings.js; Turkish source in i18n.js)
    merge(EN.STR, {
      set: {
        title: 'Configurações', close: 'Fechar',
        tabs: { audio: 'Som', controls: 'Controles', gfx: 'Gráficos', lang: 'Idioma' },
        touch: 'Toque', keys: 'Teclado', pad: 'Controle',
        touchNote: 'As opções dos controles de toque aparecem aqui quando você toca na tela.',
      },
    });

    // ================================================================ LANGUAGE PICKER (js/lang-ui.js; Turkish source in i18n.js)
    // Language names are not translated: each one is written in its own language (ND.i18n.names).
    merge(EN.STR, { lang: { title: 'Idioma', change: 'Mudar idioma', close: 'Fechar' } });

    // ================================================================ SHARED LABELS (static HTML / move list text that is the same word in Turkish)
    merge(EN.PHRASES, { 'Shuriken': 'Shuriken', 'KI': 'KI' });

    // ================================================================ TOUCH HELP PER MOVEMENT MODE
    // (game.js touchHelp(): the menu's touch help follows the movement mode; Turkish source in i18n.js)
    merge(EN.STR, {
      thelp: {
        title: { float: 'Analógico', fixed: 'Analógico fixo', dpad: 'Direcional' },
        float: { walk: 'Ponha o polegar na metade livre e deslize: andar', jump: 'Empurre para cima: pular', guard: 'Puxe para baixo: defender', dash: 'Deslize duas vezes para o lado: impulso' },
        fixed: { walk: 'Segure o analógico pelo centro e empurre para o lado: andar', jump: 'Empurre para cima: pular', guard: 'Puxe para baixo: defender', dash: 'Deslize duas vezes para o lado: impulso' },
        dpad: {
          walk: 'Segure: andar', step: 'Toque rápido: um passo curto', jump: 'Toque: pular', guard: 'Segure: defender',
          dash: 'Toque duplo: impulso', both: 'Aperte entre dois botões para acionar os dois (▶ + ▲ = pulo para frente)',
        },
        edit: (b) => `${b}: arraste qualquer botão para onde quiser e ajuste o tamanho e a opacidade. Em Configurações → Controles.`,
      },
    });

    // Persistent character journeys.
    merge(EN.STR, { menu: { arcadeDesc: "Uma jornada de oito lutas para cada ninja. Continue do próximo rival e desbloqueie o final do personagem e o selo de mestre." }, sel: { title: { arcade: "Arcade · Jornada do personagem" } },
      journey: {
        start: "Começar jornada",
        resume: (i, n) => "Continuar · " + i + "/" + n + "",
        ending: "Ver final",
        replay: "Repetir jornada",
        badge: "Selo de mestre",
        completed: "Jornada concluída",
        progress: (i, n) => "" + i + "/" + n + " lutas concluídas · Progresso salvo",
        reward: "Recompensa: final do personagem e selo de mestre permanente",
        saved: "Cada vitória é salva. Sair de uma luta conta como nova tentativa.",
        menu: (done, active) => "" + done + " jornadas concluídas · " + active + " em andamento",
        clearReward: "Selo de mestre conquistado · Final desbloqueado"
      }
    });

    // ================================================================ PROGRESS / ACCOUNT (Settings → Progress, Hall of Champions;
    // js/settings.js, js/banzuke.js; Turkish source in i18n.js, block "account and recovery code")
    merge(EN.STR, {
      set: { tabs: { save: 'Progresso' } },
      acct: {
        title: 'Guarde seu progresso',
        cgOn: (n) => `Conta CrazyGames: ${n}. Seus títulos, cores de campeão, Dan e pontuações ficam salvos na sua conta.`,
        cgWait: (n) => `Conta CrazyGames: ${n}. Conectando à sua conta…`,
        cgFail: (n) => `Conta CrazyGames: ${n}. Não foi possível acessar sua conta agora; novas pontuações ficam neste dispositivo por enquanto.`,
        cgSave: 'Salve seu progresso na sua conta CrazyGames',
        cgSaveNote: 'Ao entrar, seus títulos, cores de campeão e pontuações vão para a sua conta, em qualquer dispositivo.',
        rcTitle: 'Código de recuperação',
        rcNote: 'Anote este código. Digite-o aqui em um novo dispositivo para recuperar seus títulos, cores de campeão, Dan e pontuações.',
        rcShow: 'Mostrar código', rcNew: 'Novo código', rcNewDone: 'Novo código pronto; o antigo não funciona mais.',
        rcNeedName: 'Primeiro salve uma pontuação com um apelido para receber um código de recuperação.',
        rcEnter: 'Digite um código de recuperação', rcGo: 'Recuperar',
        rcDone: (n, c) => `Bem-vindo de volta, ${n}! Seu progresso voltou. Seu novo código de recuperação: ${c}`,
        err: { bad_code: 'Código não reconhecido. Confira os caracteres.', rate: 'Tentativas demais. Tente mais tarde.', offline: 'Não foi possível acessar o servidor. Verifique sua conexão.', banned: 'Esta identidade não pode ser usada.', error: 'Algo deu errado. Tente de novo.' },
        local: 'O salvamento online não está disponível aqui; seu progresso fica neste dispositivo.',
        offline: 'Você está offline agora; seu progresso fica neste dispositivo.',
        loading: 'Carregando…',
      },
      lb: { savedLocalAccount: (r) => (r ? `#${r} neste dispositivo · não foi possível acessar sua conta agora` : 'Salvo neste dispositivo · não foi possível acessar sua conta agora') },
    });

    // ================================================================ PRIVACY (js/privacy.js; Turkish source in i18n.js, block
    // "privacy"). The policy page itself (privacy.html) is English + Turkish; this language sees the English part.
    merge(EN.STR, {
      priv: {
        notice: 'Shadow Duel salva seu apelido e suas pontuações para os rankings online.',
        policy: 'Política de Privacidade', terms: 'Termos', both: 'Política de Privacidade e Termos',
        ok: 'OK', label: 'Aviso de privacidade',
      },
    });

    // ================================================================ FIRST-FIGHT RALLY TUTORIAL: js/tutorial.js STR.tutor and
    // Training → Parry drill (Turkish source in i18n.js, block "rally tutorial")
    merge(EN.STR, {
      menu: { trainDrill: 'Treino de aparar' },
      tutor: {
        defend: 'DEFENDA!', attack: 'ATAQUE!', again: 'DE NOVO!',
        pass: {
          freeze: (l, g) => `O tempo para: ${g} para defender, ${l} para contra-atacar`,
          slow: (l, g) => `Câmera lenta: ${g} quando o anel fechar, depois ${l}`,
          real: (l, g) => `Velocidade real: ${g} para defender, ${l} para contra-atacar, duas vezes`,
        },
        fail: {
          early: 'Cedo demais! Defenda logo antes de a lâmina chegar.',
          late: 'Tarde demais! Defenda logo antes de a lâmina chegar.',
          slow: 'Tarde demais! Contra-ataque enquanto ATAQUE! estiver na tela.',
          atk: 'Primeiro defenda, depois ataque!',
          miss: 'Vamos tentar de novo.',
        },
        mastered: 'DOMINADO!', masteredSub: 'Defenda, contra-ataque, repita',
      },
    });

    void dec; void fmtTime; void num;
  };
})(window.ND);
