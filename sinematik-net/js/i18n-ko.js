













(function (ND) {
  'use strict';
  (ND.I18N_CATALOGS || (ND.I18N_CATALOGS = {}))['ko'] = function (I, EN) {
    const merge = I.merge;
    const num = (n) => I.num(n);
    const dec = (x) => I.dec(x);
    const fmtTime = (s) => I.time(s);


    merge(EN.STR, {
      menu: {
        brand: (nc, na) => `${nc} 명의 전사, ${na} 곳의 아레나, 그리고 숨겨진 고수. 실시간 칼날 격돌, 칼날 겨루기, 패링, 자세 붕괴, 필살기, 래그돌 물리까지.`,
        arcade: '아케이드',
        arcadeDesc: '점점 강해지는 라이벌을 하나씩 쓰러뜨리세요. 끝에는 숨겨진 고수가 기다립니다. 승리하면 새 닌자와 아레나가 열립니다.',
        arcadeProg: (best, c, ct, a, at) => `${best ? '최고 ' + num(best) + ' · ' : ''}닌자 ${c}/${ct} · 아레나 ${a}/${at} 해금`,
        train: '훈련',
        trainDesc: '허수아비로 자유롭게 연습하거나 차근차근 배우세요',
        trainFree: '자유',
        trainTut: '튜토리얼',
        watchShort: '무작위 닌자 둘, 전설 AI',
        specialKey: '필살기 (기 가득)',
        single: '일반 대전', singleDesc: 'CPU 대전 또는 2인 대전',
      },
      sel: {
        title: { '2p': '닌자 선택', cpu: '닌자 선택', arcade: '아케이드 · 닌자 선택', train: '훈련 · 닌자 선택', tutorial: '튜토리얼 · 닌자 선택', tourney: '월간 토너먼트 · 닌자 선택', dan: 'Dan 심사 · 닌자 선택' },
        who1: { '2p': '1P · A / D 선택, F 확정', def: '나 · A / D 선택, F 확정' },
        who2: { '2p': '2P · ← / → 선택, K 확정', cpu: '상대 (CPU) · ← / → 선택', train: '허수아비 · ← / → 선택' },
        go: { def: '대전 시작', arcade: '아케이드 시작', train: '훈련 시작', tutorial: '튜토리얼 시작', tourney: '토너먼트 시작', dan: '심사 시작' },
        random: '랜덤',
        arena: '아레나',
        locked: '잠김',
        lockMsg: (name, hint) => `${name} 잠김 · ${hint}`,
        keyHint: '<kbd>Enter</kbd> 시작 · <kbd>⌫</kbd> 뒤로',
      },
      hint: {
        wins: (n, cur) => `아케이드에서 ${n}승 (${Math.min(cur, n)}/${n})`,
        clear: '아케이드 1회 클리어',
        boss: '아케이드 최종 보스 격파',
        arena: '아케이드에서 이 아레나 1승',
      },
      toast: {
        newChar: (name) => `새 닌자 해금: ${name}`,
        newArena: (name) => `새 아레나 해금: ${name}`,
        newBest: (s) => `최고 기록 경신: ${num(s)}점`,
        lesson: (t) => `레슨 완료: ${t}`,
        tutDone: '튜토리얼 완료!',
        perf: '성능을 위해 그래픽을 낮췄습니다',
      },
      vs: {
        stage: (i, n) => `대전 ${i} / ${n}`,
        boss: '최종전',
        go: '승부!',
        quit: '아케이드 종료',
        keys: '<kbd>Enter</kbd> / <kbd>F</kbd> 시작 · <kbd>⌫</kbd> 나가기',
        unknown: '?',
      },
      hud: { you: '나', cpu: 'CPU', dummy: '허수아비', stage: (i, n) => `${i}/${n}`, boss: '최종 보스', inf: '∞', lockSolo: 'F / K 연타!', lockDuo: '약·강공격 연타!' },
      end: {
        rematch: '재대결', change: '캐릭터 변경', menu: '메인 메뉴',
        winTitle: '승리!',
        winSub: (i, n, pts) => `${i}/${n}전 돌파 · +${num(pts)}점`,
        next: '다음 대전',
        bossNext: '최후의 결전으로',
        lossTitle: '패배',
        lossSub: (name) => `이번엔 ${name}의 승리. 다시 도전하세요.`,
        retry: '다시 도전',
        quit: '아케이드 종료',
      },
      ending: {
        head: '엔딩',
        rows: { fights: '대전', time: '총 시간', retries: '재도전', perfect: '퍼펙트 라운드', score: '점수', best: '최고 기록' },
        newBest: '최고 기록 경신!',
        menu: '메인 메뉴',
        again: '다시 하기',
        unlocked: '해금',
        fightPts: '대전 점수',
        bonus: '클리어 보너스',
      },
      score: {
        hud: '점수',
        rows: { hit: '타격', combo: '콤보', counter: '반격', defense: '방어', pressure: '압박', special: '필살기', round: '승리', perfect: '퍼펙트', hp: '남은 체력', time: '시간 보너스' },
        total: '매치 점수',
        diff: (name, m) => `${name} ×${dec(m)} 포함`,
        best: (s) => `내 최고: ${num(s)}`,
        newBest: '최고 기록 경신!',
        arcadeTotal: (s) => `아케이드 합계: ${num(s)}`,
        lossNote: (s, pen) => `이번 도전은 집계되지 않음 · 아케이드 합계 ${num(s)} · 재도전마다 −${num(pen)}`,
        clearBonus: (c, n) => `+${num(c)}${n ? ' · 재도전 없음 +' + num(n) : ''}`,
        lossCpu: '패배 · 승리만 순위표에 오릅니다',
        cpuBoardHint: '전설 난이도 승리는 순위표에 오릅니다',
      },
      lb: {
        menu: '순위표',
        menuDesc: '아케이드·전설 기록',
        title: '순위표',
        back: '뒤로',
        boards: { arcade: '아케이드', cpu_efsane: '전설 CPU' },
        boardDesc: { arcade: '아케이드를 완주한 총점', cpu_efsane: '전설 CPU를 상대로 이긴 한 판의 점수' },
        all: '전체',
        status: { loading: '불러오는 중…', online: '온라인 순위표', readonly: '온라인 순위표 · 보기 전용', local: '로컬 순위표', error: '오류 · 로컬 순위표', offline: '오프라인 · 로컬 순위표' },
        empty: '아직 기록이 없습니다. 첫 주인공이 되세요!',
        loadErr: '순위표를 불러오지 못했습니다.',
        you: '나', youTag: '나', player: '플레이어',
        nick: '닉네임', nickPh: '닉네임 입력', nickSave: '저장', nickEdit: '변경',
        nickAsk: '로컬 순위표에 쓸 닉네임:',
        saving: '저장 중…',
        savedOnline: (r) => `온라인 순위: ${r}위`,
        savedOnlineNoRank: '온라인 순위표에 저장됨',
        savedOnlineAll: (r) => `온라인 역대 순위: ${r}위`,
        platSignIn: '로그인하면 점수가 온라인에 등록됩니다',
        platPending: '이 기기에 저장됨 · 로그인하면 온라인 순위표에 등록됩니다',
        savedOnlineGap: (r, g) => `온라인 순위: ${r}위 · 톱 10까지 ${g}점`,
        reason: {
          needName: '온라인 순위표에 참가하려면 닉네임을 정하세요',
          offline: '연결 없음 — 점수는 보관되며 다시 연결되면 전송됩니다',
          rate: '전송이 너무 많습니다 — 잠시 후 점수가 전송됩니다',
          daily: '하루 전송 한도 도달 — 점수는 이 기기에만 저장됩니다',
          week: '이번 달이 끝났습니다 — 이 점수는 새 달에 반영되지 않습니다',
          invalid: '잘못된 점수',
        },
        nickErr: {
          nick_length: '닉네임은 3–16자여야 합니다',
          nick_chars: '문자, 숫자, 공백, _ . - 만 쓸 수 있습니다 (문자 1개 이상)',
          nick_bad: '사용할 수 없는 닉네임입니다. 다른 닉네임을 써 보세요',
          rate_limited: '잠시 후 다시 시도하세요',
        },
        nickErrDef: '닉네임을 저장하지 못했습니다',
        nickAskOnline: '온라인 순위표에 쓸 닉네임:',
        savedLocal: (r) => (r ? `로컬 순위표 ${r}위` : '로컬 순위표에 저장됨'),
        rejected: '점수를 저장하지 못했습니다 — 로컬 순위표에만 기록됩니다',
        quota: '온라인 순위표가 가득 찼습니다 — 점수는 이 기기에만 저장됩니다',
        open: '순위표',
        keys: '<kbd>←</kbd> <kbd>→</kbd> 순위표 · <kbd>↑</kbd> <kbd>↓</kbd> 닌자 · <kbd>⌫</kbd> 뒤로',
      },
      bz: {
        back: '뒤로', toMenu: '메인 메뉴', you: '나', youTag: '나', newBest: '최고 기록 경신!', seeResult: '결과 보기',
        resetIn: '초기화까지',

        left: (ms) => { const t = Math.floor(ms / 1000), d = Math.floor(t / 86400), hh = Math.floor((t % 86400) / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60; return d ? `${d}일 ${hh}시간 ${mm}분` : hh ? `${hh}시간 ${mm}분` : `${mm}분 ${ss}초`; },
        leftShort: (ms) => { const t = Math.floor(ms / 60000), d = Math.floor(t / 1440), hh = Math.floor((t % 1440) / 60), mm = t % 60; return d ? `${d}일 ${hh}시간` : hh ? `${hh}시간 ${mm}분` : `${mm}분`; },
        weekName: (m, y) => `${y}년 ${['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'][m - 1] || m}`,
        monthName: (m) => ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'][m - 1] || String(m),
        rank: (r) => (r <= 0 ? '등급 없음' : r <= 10 ? `Kyu ${11 - r}` : `Dan ${r - 10}`),
        fightOf: (i, n) => `대전 ${i}/${n}`,
        hpBonus: (p) => `적 체력 +${p}%`,
        mirrorOpp: '미러 · 내 닌자와 대결',
        suddenSub: '단판 · 먼저 쓰러지면 패배',
        rows: { fights: '승리', time: '시간', fightPts: '대전 점수', stage: '스테이지 보너스', clear: '클리어 보너스', total: '토너먼트 점수', weekBest: '이번 달 내 최고' },
        mods: {
          rally2x: { n: '불꽃 랠리', d: '반격 피해 ×2' },
          fullKi: { n: '기 가득', d: '매 라운드 기가 가득 찬 채로 시작' },
          sudden: { n: '서든 데스', d: '단판 승부, 양측 모두 체력 절반으로 시작' },
          mirror: { n: '미러', d: '상대가 내 닌자' },
          parryOnly: { n: '반격 전용', d: '일반 타격 피해 25%, 반격 ×1.5' },
          posture2x: { n: '흔들리는 자세', d: '자세 피해 ×2: 가드가 금방 무너짐' },
          shuriken3x: { n: '수리검 폭풍', d: '수리검 3배' },
          kiRush: { n: '기 범람', d: '기가 두 배 빨리 참' },
          glass: { n: '유리 칼날', d: '모든 피해 ×1.5' },
        },
        menu: {
          tour: '월간 토너먼트', dan: 'Dan 심사', hall: '챔피언의 전당',
          tourRank: (p, left) => `이번 달: ${p}위 · ${left} 후 초기화`,
          tourBest: (b, left) => `내 최고 ${b} · ${left} 후 초기화`,
          tourNew: (left) => `모두에게 같은 8번의 대전 · ${left} 후 초기화`,
          danRank: (name, next) => (next ? `내 등급: ${name} · 다음: ${next}` : `내 등급: ${name} · 정상 도달`),
          danNew: 'Kyu 10부터 Dan 10까지 20번의 심사',
          hallRank: (p) => `이번 달 ${p}위 · 기록`,
          hallDesc: '이번 달 톱 10과 역대 기록',
          nick: (n) => (n ? `닉네임: ${n}` : '닉네임 정하기'),
          champTitle: '이번 달 톱 10', champLocal: '이 기기의 톱 10', champEmpty: '이번 달 순위표의 첫 주인공이 되세요', champLoading: '선두를 불러오는 중…',
          champAll: '역대 톱 10', champAllEmpty: '온라인 순위표의 첫 주인공이 되세요',
          champLast: (n) => `지난달 챔피언: ${n}`, champOpen: '월간 순위 열기',
        },
        t: {
          title: '월간 토너먼트', head: '토너먼트',
          runNote: (s, st) => `토너먼트 합계: ${num(s)} (승리당 +${num(st)} 포함)`,
          lossSub: (name, won) => `${name}에게 패배해 도전 종료 · ${won}승`,
          lossNote: (s) => `이번 대전은 집계되지 않음 · 토너먼트 점수 ${num(s)}`,
          quit: '토너먼트 종료',
          myBest: (b, a) => `이번 달 내 최고: ${b}점 · ${a}회 도전`,
          noTry: '이번 달 도전 기록이 없습니다.',
          place: (p, t) => (t ? `${p}위 / ${t}` : `${p}위`),
          rules: (n, clear, stage) => `${n}번의 대전. 모두에게 같은 상대, 아레나, 규칙이 주어집니다. 한 번 지면 도전이 끝나며, 도전 횟수는 무제한이고 최고 기록이 반영됩니다. 승리마다 +${stage}, 전원 격파 시 +${clear}.`,
          start: '닌자를 골라 시작하세요', again: '다시 도전', go: '토너먼트 참가',
          clearTitle: '토너먼트 제패', overTitle: '도전 종료',
          savedToast: (s) => `토너먼트 점수 저장: ${s}`,
        },
        d: {
          title: 'Dan 심사', head: 'Dan 심사',
          sub: '심사를 통과해 등급을 올리세요. 등급은 순위표의 이름 옆에 표시됩니다.',
          trialOf: (n) => `${n} 심사`,
          runNote: (i, n) => `심사: ${i}/${n}승`,
          lossSub: (name) => `${name}에게 막혀 심사에 실패했습니다.`,
          lossNote: '심사 불합격',
          quit: '심사 포기',
          yourRank: '내 등급', bestWas: (n) => `최고: ${n}`, ladder: '등급표',
          nextTrial: (n) => `다음: ${n} 심사`,
          fights: (n) => `${n}전`,
          bossLast: '최종전: Shura',
          strikes: (left, max) => `기회: ${left}/${max} · ${max}번 불합격하면 한 단계 강등`,
          safe: '이 등급에서는 불합격해도 강등되지 않습니다.',
          maxed: '정상: Dan 10', maxedSub: '내 이름이 Dan 순위표 맨 위에 있습니다.',
          start: '닌자를 골라 심사를 받으세요', next: '다음 심사', go: '심사 받기',
          promoted: (n) => `승급: ${n}`, demoted: (n) => `강등: ${n}`, failed: '심사 불합격',
          promotedSub: (a, b) => `${a} → ${b}`, demotedSub: '세 번 불합격했습니다. 다시 올라가세요!', tryAgain: '다시 도전하세요. 등급은 그대로입니다.',
          toast: (n) => `새 등급: ${n}`, leftToast: '심사 포기: 불합격 처리',
        },
        hall: {
          title: '챔피언의 전당',
          tabs: { week: { n: '이번 달' }, alltime: { n: '역대' }, archive: { n: '챔피언' }, chars: { n: '닌자' }, dan: { n: 'Dan' } },
          desc: { alltime: '월간 토너먼트 역대 최고 기록', archive: '끝난 달의 톱 10이 이곳에 영원히 새겨집니다', chars: '닌자별 기록 보유자 · 닌자를 누르면 톱 20', dan: '최고 등급' },
          loading: '불러오는 중…', error: '순위표를 불러오지 못했습니다.', retry: '다시 시도',
          empty: '아직 아무도 없습니다. 첫 주인공이 되세요!', emptyDan: '아직 등급을 받은 플레이어가 없습니다.', emptyArchive: '아직 끝난 달이 없습니다. 칭호는 2026년 10월 토너먼트부터 시작되며, 11월 1일에 끝나면 챔피언이 새겨집니다.', emptyArchiveLocal: '이 기기에는 아직 끝난 달이 없습니다.',
          anon: '플레이어',
          meTop: (p, s) => `나: ${p}위 · ${s}점 · 톱 10 진입!`,
          meGap: (p, g, s) => `나: ${p}위 · ${s}점 · 톱 10까지 ${g}점`,
          meNone: '이번 달 기록이 없습니다.',
          meDan: (p, n) => `나: ${p}위 · ${n}`,
          meDanLocal: (n) => `내 등급: ${n}`, meNoDan: '아직 등급이 없습니다. 첫 심사: Kyu 10.',
          noRecord: '기록 없음', allNinjas: '모든 닌자',
          pending: (n) => `전송 대기 중인 기록: ${n}`,
          classic: '아케이드 · 전설 순위표',
        },

        ttl: {
          champ: '월간 챔피언', finalist: '입상자',
          reward: '2026년 10월 토너먼트부터 매달 톱 3는 영구 칭호를 받습니다. 챔피언은 사용한 닌자의 전용 챔피언 색상도 얻습니다. 칭호는 그달 참가자가 5명 이상일 때만 주어집니다.',
          hall: '2026년 10월부터: 매달 톱 3 영구 칭호 (최소 5명) · 챔피언은 챔피언 색상 획득',
          local: '토너먼트 점수는 이 기기에 저장됩니다.',
          colors: '챔피언 색상',
          how: '이 닌자로 월간 토너먼트 우승',
          unlocked: (name) => `월간 챔피언! ${name}의 챔피언 색상 해금`,
          newTitle: (t) => `새 칭호: ${t}`,
        },
      },
      train: {
        title: '훈련', tutTitle: '튜토리얼',
        dummy: '허수아비',
        beh: { idle: '대기', guard: '가드', attack: '공격', counter: '반격' },
        infHp: '무한 체력', fullKi: '기 가득',
        reset: '위치 초기화',
        hide: '숨기기', show: '패널',
        moves: '기술표',
        lessons: '레슨',
        lessonOf: (i, n) => `레슨 ${i}/${n}`,
        done: '튜토리얼 완료! 허수아비를 원하는 대로 설정하고 자유롭게 연습하세요.',
        progress: (a, b) => `${a}/${b}`,
        keysHelp: '<kbd>1</kbd>–<kbd>4</kbd> 허수아비 · <kbd>⌫</kbd> 초기화 · <kbd>H</kbd> 패널',
        specialFallback: { kanji: '影斬り', name: '그림자 베기', desc: '번개처럼 빠르게 상대를 꿰뚫어 베는 일격.', tip: '' },
        kiFull: '기 가득',
        counterTip: '대처법',
      },
      moves: [
        ['<kbd>A</kbd><kbd>D</kbd>', '걷기', '두 번 누르기: 대시'],
        ['<kbd>W</kbd>', '점프', ''],
        ['<kbd>F</kbd><kbd>F</kbd><kbd>F</kbd>', '약공격 ×3 콤보', '세 번째 타격이 밀쳐냄'],
        ['<kbd>G</kbd>', '강베기', '넘어뜨림'],
        ['<kbd>R</kbd>', '발차기', '가드 압박, 자세 게이지 증가'],
        ['<kbd>S</kbd>+<kbd>R</kbd>', '다리 걸기', '넘어뜨림 · 점프로 피하기'],
        ['뒤+<kbd>R</kbd>', '뒤돌려차기', '느리지만 강함, 가드를 깸'],
        ['앞+<kbd>R</kbd>', '손목 차기', '휘두르기 전에: 무기를 떨어뜨림'],
        ['<kbd>W</kbd>›<kbd>R</kbd>', '날아차기', '공중에서'],
        ['←→+<kbd>R</kbd>', '고유 발차기', '닌자마다 하나씩'],
        ['<kbd>R</kbd>', '검 차올리기', '맨손일 때 자기 검 옆에서'],
        ['<kbd>T</kbd>', '수리검', ''],
        ['<kbd>Shift</kbd>', '대시', '왼쪽 Shift'],
        ['<kbd>Shift</kbd>›<kbd>F</kbd>', '대시 베기', ''],
        ['<kbd>W</kbd>›<kbd>F</kbd>', '공중 베기', ''],
        ['<kbd>W</kbd>›<kbd>G</kbd>', '급강하', '공중에서 강공격'],
        ['<kbd>S</kbd>', '가드', '누르고 있기'],
        ['<kbd>S</kbd>!', '패링', '공격이 닿기 직전에 누르기'],
        ['<kbd>F</kbd>', '기본 반격', '가드/패링 후'],
        ['앞+<kbd>F</kbd>', '다리 후리기', '반격 · 다리를 노림'],
        ['뒤+<kbd>F</kbd>', '배후 베기', '반격 · 상대 뒤로 빠져나감'],
        ['<kbd>G</kbd>', '강반격', '반격 · 넘어뜨림'],
        ['랠리', '랠리', '반격을 막고 다시 반격, 내 세 번째 반격은 피니시'],
        ['<kbd>F</kbd>/<kbd>G</kbd>!!', '칼날 겨루기', '겨루는 동안 연타해서 밀어내기'],
      ],
      touch: {
        btn: { light: '공격', heavy: '강공격', kick: '발차기', guard: '가드', dodge: '대시', throw: '수리검', special: '필살', up: '점프', down: '가드', stick: '조이스틱' },
        lock: '공격 연타!',
        replaySkip: '탭하여 건너뛰기',
        rotateTitle: '화면을 가로로 돌려 주세요',
        rotateText: 'Shadow Duel은 가로 화면으로 플레이합니다. 메뉴는 세로 화면에서도 쓸 수 있습니다.',
        rotMenu: '메인 메뉴',
        need2p: '키보드/게임패드 필요',
        need2pToast: '2인 플레이는 키보드나 게임패드를 연결하세요',
        hints: '힌트',
        pause: '일시정지',
        sel: { who1: '나 · 닌자를 탭하세요', who2: '상대 (CPU) · 탭하여 선택', who2train: '허수아비 · 탭하여 선택' },
        opt: {
          title: '터치 조작',
          layout: '배치', simple: '간단', full: '전체',
          size: '크기', sizes: { s: '작게', m: '보통', l: '크게' },
          hand: '버튼 위치', right: '오른쪽', left: '왼쪽',
          assist: '쉬운 보조', haptic: '진동',
          fullscreen: '전체 화면', exitFullscreen: '전체 화면 종료',
          note: '간단: 큰 버튼 5개. 전체: 발차기와 수리검 추가. 쉬운 보조: 공격을 누르고 있으면 콤보가 이어지고, 가드를 짧게 탭해도 패링할 만큼 유지되며, 스틱이 실수로 튀지 않습니다. 터치만 편하게 해 줄 뿐, 규칙과 점수는 모두에게 같습니다.',
          fullNote: '발차기와 수리검 버튼은 전체 배치에 있습니다 (설정 → 조작).',
        },
        help: '<div class="th-grid">' +
          '<div><h3>조이스틱</h3><dl>' +
          '<dt><i class="tb">◀ ▶</i></dt><dd>화면의 빈 쪽에 엄지를 대고 밀기: 걷기</dd>' +
          '<dt><i class="tb">▲</i></dt><dd>위로 밀기: 점프</dd>' +
          '<dt><i class="tb tb-guard">▼</i></dt><dd>아래로 당기기: 가드</dd>' +
          '<dt><i class="tb">▶▶</i></dt><dd>옆으로 두 번 튕기기: 대시</dd>' +
          '</dl></div>' +
          '<div><h3>버튼</h3><dl>' +
          '<dt><i class="tb tb-light">공격</i></dt><dd>베기. 계속 탭하면 콤보. 앞이나 뒤를 누른 채 탭하면 다른 기술</dd>' +
          '<dt><i class="tb">강공격</i></dt><dd>강베기. 앞 + 강공격은 상대를 띄움</dd>' +
          '<dt><i class="tb tb-guard">가드</i></dt><dd>누르고 있기: 가드. 공격 직전에 탭: 패링</dd>' +
          '<dt><i class="tb">대시</i></dt><dd>대시 (스틱 방향으로, 없으면 뒤로)</dd>' +
          '<dt><i class="tb ki">필살</i></dt><dd>필살기: 기가 가득 차면 버튼이 빛남</dd>' +
          '<dt><i class="tb">발차기</i> <i class="tb">수리검</i></dt><dd>전체 배치: 발차기와 수리검</dd>' +
          '</dl></div></div>',
        note: '버튼 여러 개를 동시에 누를 수 있습니다. 가드와 공격을 함께 누르거나, 엄지를 <i class="tb tb-guard">가드</i>에서 <i class="tb tb-light">공격</i>으로 미끄러뜨리세요. 화면 위쪽의 <b>II</b>는 일시정지이고, 배치·크기·왼손 옵션은 <b>설정</b>에 있습니다. 키보드나 게임패드를 쓰면 조작이 자동으로 전환됩니다.',
        keysHelp: '',
      },
      movesTouch: [
        ['<i class="tb">◀ ▶</i>', '걷기', '조이스틱 · 두 번 튕기기: 대시'],
        ['<i class="tb">▲</i>', '점프', '스틱을 위로 밀기'],
        ['<i class="tb tb-light">공격</i>×3', '3연속 콤보', '계속 탭, 세 번째 타격이 밀쳐냄'],
        ['<i class="tb">강공격</i>', '강베기', '넘어뜨림'],
        ['<i class="tb">발차기</i>', '발차기', '가드 압박, 자세 게이지 증가 · 전체 배치'],
        ['<i class="tb tb-guard">▼</i>' + '+' + '<i class="tb">발차기</i>', '다리 걸기', '넘어뜨림 · 점프로 피하기'],
        ['뒤+' + '<i class="tb">발차기</i>', '뒤돌려차기', '느리지만 강함, 가드를 깸'],
        ['앞+' + '<i class="tb">발차기</i>', '손목 차기', '휘두르기 전에: 무기를 떨어뜨림'],
        ['<i class="tb">▲</i>' + '›' + '<i class="tb">발차기</i>', '날아차기', '공중에서'],
        ['←→+' + '<i class="tb">발차기</i>', '고유 발차기', '닌자마다 하나씩'],
        ['<i class="tb">발차기</i>', '검 차올리기', '맨손일 때 자기 검 옆에서'],
        ['<i class="tb">수리검</i>', '수리검', '전체 배치'],
        ['<i class="tb">대시</i>', '대시', ''],
        ['<i class="tb">대시</i>›<i class="tb tb-light">공격</i>', '대시 베기', ''],
        ['<i class="tb">▲</i>›<i class="tb tb-light">공격</i>', '공중 베기', ''],
        ['<i class="tb">▲</i>›<i class="tb">강공격</i>', '급강하', '공중에서 강공격'],
        ['<i class="tb tb-guard">가드</i>', '가드', '누르고 있거나 스틱을 아래로'],
        ['<i class="tb tb-guard">가드</i>!', '패링', '공격이 닿기 직전에 탭'],
        ['<i class="tb tb-light">공격</i>', '기본 반격', '가드/패링 후'],
        ['앞+<i class="tb tb-light">공격</i>', '다리 후리기', '반격 · 다리를 노림'],
        ['뒤+<i class="tb tb-light">공격</i>', '배후 베기', '반격 · 상대 뒤로 빠져나감'],
        ['<i class="tb">강공격</i>', '강반격', '반격 · 넘어뜨림'],
        ['랠리', '랠리', '반격을 막고 다시 반격, 내 세 번째 반격은 피니시'],
        ['<i class="tb tb-light">공격</i>!!', '칼날 겨루기', '겨루는 동안 공격을 연타해서 밀어내기'],
      ],
      moveSpecialTouch: '<i class="tb ki">필살</i>',
      moveTags: {
        normal: '일반', command: '커맨드', string: '연계', launcher: '띄우기', juggle: '공중 콤보', air: '공중', dash: '대시',
        strike: '타격', counter: '반격', catch: '받아치기', feint: '페인트', guardCrush: '가드 크러시', knockdown: '다운',
        kiCancel: '기 캔슬', special: '필살기', throw: '투척',
      },
      lessonsTouch: {
        walk: '화면의 빈 쪽에 엄지를 대고 미세요. 조이스틱을 좌우로 밀면 걷습니다.',
        combo: '<i class="tb tb-light">공격</i>을 세 번 연속 탭해 세 번 베기를 이어서 허수아비를 맞히세요.',
        heavy: '<i class="tb">강공격</i>으로 강베기를 맞히세요. 느리지만 상대를 넘어뜨립니다.',
        gbreak: '허수아비가 가드 중입니다. <i class="tb">강공격</i>으로 때려 자세 게이지를 채우고 가드를 무너뜨리세요 (전체 배치의 <i class="tb">발차기</i>는 더 빨리 채웁니다).',
        block: '허수아비가 공격합니다. <i class="tb tb-guard">가드</i>를 누르고 있거나 스틱을 아래로 당겨 베기를 막으세요.',
        parry: '공격이 닿기 직전에 <i class="tb tb-guard">가드</i>를 탭하세요. 파란 고리가 줄어드는 순간이 최적의 타이밍입니다.',
        counter: '가드나 패링 직후 <i class="tb tb-light">공격</i>: 반격 베기. 스틱 앞/뒤 + <i class="tb tb-light">공격</i>이나 <i class="tb">강공격</i>도 써 보세요.',
        special: '기 게이지가 가득 찼습니다. 빛나는 <i class="tb ki">필살</i> 버튼을 눌러 필살기 {sp} 발동!',
      },
      lessons: [
        { id: 'walk', t: '걷기', d: '<kbd>A</kbd> / <kbd>D</kbd>로 앞뒤로 걸어 보세요.' },
        { id: 'combo', t: '3연속 콤보', d: '<kbd>F</kbd> <kbd>F</kbd> <kbd>F</kbd>로 약베기 세 번을 이어 허수아비를 맞히세요.' },
        { id: 'heavy', t: '강베기', d: '<kbd>G</kbd>로 강베기를 맞히세요. 느리지만 상대를 넘어뜨립니다.' },
        { id: 'gbreak', t: '가드 무너뜨리기', d: '허수아비가 가드 중입니다. <kbd>R</kbd>로 발차기해 자세 게이지를 채우고 가드를 무너뜨리세요.' },
        { id: 'block', t: '가드', d: '허수아비가 공격합니다. <kbd>S</kbd>를 누르고 있으면 베기를 막습니다.' },
        { id: 'parry', t: '패링', d: '공격이 닿기 직전에 <kbd>S</kbd>를 누르세요. 파란 고리가 줄어드는 순간이 최적의 타이밍입니다.' },
        { id: 'counter', t: '반격', d: '가드나 패링 직후 <kbd>F</kbd>: 반격 베기. 앞/뒤 + <kbd>F</kbd>나 <kbd>G</kbd>도 써 보세요.' },
        { id: 'rally', t: '랠리', d: '허수아비도 반격합니다. 공격하고, 반격을 막고, 다시 반격하세요. 내 반격 두 번으로 2×를 달성하세요.' },
        { id: 'special', t: '필살기', d: '기 게이지가 가득 찼습니다. <kbd>E</kbd>로 필살기 {sp} 발동!' },
      ],
    });



    merge(EN.STR, {

      talk: {
        akane: {
          open: ['내 칼날은 붉고, 내 뜻은 순수하다. 명예롭게 맞서라.', '먼저 예를 갖추고, 그다음에 벤다. 그것이 공정함이다.', '이 결투는 명예를 위한 것. 물러설 곳은 없다.'],
          reply: ['명예로운 적이군… 내 칼날을 받을 자격이 있다.', '말은 날카롭군. 칼도 그만큼 날카로운지 보자.', '붉은 칼날이 말하면, 말은 침묵한다.'],
          boss: '내 스승들은 네 칼에 쓰러졌다, Shura. 오늘 그 빚을 갚겠다.',
        },
        aoi: {
          open: ['바람은 서두르지 않는다. 나도 마찬가지다.', '네 숨소리를 들어라. 마지막으로 듣게 될 소리는 바람일 테니.', '대나무는 휘어도 부러지지 않는다. 너는 어느 쪽이냐?'],
          reply: ['진정해라. 분노는 칼을 무겁게 만든다.', '바람은 잡을 수 없다. 느낄 수 있을 뿐.', '좋다. 나뭇잎이 땅에 닿으면 시작하지.'],
          boss: '폭풍의 눈조차 고요하다. 네 안에는 소음뿐이구나, Shura.',
        },
        kuro: {
          open: ['산은 움직이지 않는다. 움직이는 건 너다.', '말은 필요 없다. 칼을 들어라.', '작군. 금방 끝나겠어.'],
          reply: ['흥. 덤벼라.', '말이 많군.', '내 nodachi는 길다. 인내심은 짧고.'],
          boss: 'Shura. 오래 기다렸다. 말은 끝이다.',
        },
        yuki: {
          open: ['눈은 소리 없이 내려. 내 공격도 그렇지.', '여우는 함정에 빠지지 않아. 함정을 놓지.', '춥니? 곧 아무것도 느끼지 못할 거야.'],
          reply: ['피가 뜨겁구나. 그래서 느린 거야.', '시끄럽긴… 눈마저 부끄러워하겠어.', '눈 깜빡이지 마. 놓칠 테니까.'],
          boss: '다들 너를 두려워하지, Shura. 난 그냥 조금 쌀쌀할 뿐이야.',
        },
        hana: {
          open: ['춤출래? 대신 리드는 내가 할게!', '벚꽃잎이 땅에 닿기 전에 끝날 거야, 약속해!', 'tantō 두 자루에 미소 하나. 뭐가 더 무서워?'],
          reply: ['어머, 너무 진지해! 좀 웃어 봐, 쓰러질 때 더 예쁘게.', '잡을 수 있으면 잡아 봐!', '알았어, 알았어! 대신 끝나고 울기 없기.'],
          boss: 'Shura, 넌 웃지도 않니? 자, 이걸 우리의 마지막 춤으로 만들자!',
        },
        tetsu: {
          open: ['의무가 나를 이곳에 이끌었다. 비켜서거나 쓰러져라.', '내 갑옷은 백 번의 전투를 겪었다. 너는 백한 번째다.', '용기보다 규율이 먼저다. 보여 주지.'],
          reply: ['무례하군. 바로잡아 주겠다.', '네 말로는 내 갑옷을 뚫을 수 없다.', '각오해라. 내 naginata는 경고하지 않는다.'],
          boss: '네가 주군의 성을 불태웠지, Shura. 오늘 내 의무를 완수하겠다.',
        },
        ren: {
          open: ['하! 드디어 재밌어지는군! 뼈는 튼튼하냐?', '가면이 무서워? 진짜 얼굴은 보고 싶지 않을걸!', '머리냐 가드냐? 둘 다 부숴 주지!'],
          reply: ['입만 살았군! 덤벼!', '헤, 마음에 드는데. 그래도 박살 낼 거지만.', '내 발차기 본 적 있어? 이제 보게 될 거다!'],
          boss: '네가 진짜 오니라고? 누구 뿔이 더 단단한지 보자!',
        },
        kage: {
          open: ['나를 본다고 생각하나. 네가 보는 건 내 그림자뿐이다.', '빛이 밝을수록 그림자는 깊어진다.', '네 이름은 이미 쓰였다. 나는 읽을 뿐이다.'],
          reply: ['말하지 마라. 그림자가 듣고 있다.', '뒤를 돌아보지 마라. 난 이미 거기 있다.', '너무 시끄럽군. 침묵이 더 빨리 벤다.'],
          boss: '그림자는 주인을 섬기지 않는다, Shura. 너도 삼켜 버릴 것이다.',
        },
        shura: {
          open: ['너는 일곱 자루의 칼을 꺾었다. 여덟 번째는 내 것이고, 그것이 너를 꺾을 것이다.', '네 기백이 나를 불렀다. 여기까지 올라온 건 잘했다. 그만큼 추락이 장대할 테니.', '나는 길의 끝이다. 무릎 꿇어라.'],
          reply: ['나약함. 여기서도 냄새가 나는군.', '너는 디딤돌에 불과하다.', '무릎 꿇든가, 쓰러지든가.'],
          boss: '거울 속의 악귀… 우리 중 하나는 사라져야 한다.',
        },
        tora: {
          open: ['내 사슬에 매달린 놈들은 셀 수도 없지. 너도 그중 하나가 될 거다.', '사냥 시작이다. 도망치고 싶으면 도망쳐 봐, 내 사슬은 기니까.', '호랑이는 매복한다고들 하지. 난 아니야!'],
          reply: ['크르르… 좋아. 도망 안 치는 사냥감이 마음에 들어.', '가까이 올 필요 없어. 내가 끌어당겨 줄 테니.', '말이 길군. 내 사슬은 더 길지.'],
          boss: '너도 사냥감일 뿐이야, Shura. 조금 더 클 뿐.',
        },
        jin: {
          open: ['피를 보러 온 게 아니오. 잠시 눕혀 드릴 뿐이오.', '봉은 인내로 말하오. 들어 보시오.', '젊은 무사여, 그대의 길은 분노로 가득하오. 그 짐을 덜어 드리리다.'],
          reply: ['좋소. 대신 끝나면 차 한잔 합시다.', '그 분노가 그대를 짓누르는구려. 내가 짊어지겠소.', '칼은 베고, 봉은 깨우치오.'],
          boss: 'Shura, 그대 안의 악귀를 이기려고 그대를 무너뜨릴 필요는 없소. 멈추게 하면 충분하오.',
        },
        mai: {
          open: ['무대는 준비됐고 막은 올랐어. 네 역할은 지는 쪽이야.', '내 부채가 펼쳐지면 눈 감지 마. 공연을 놓칠 테니까.', '내 발걸음 하나하나가 음표야. 박자를 따라올 수 있겠어?'],
          reply: ['등장이 투박하네. 상관없어, 우아함은 내가 둘 몫만큼 있으니까.', '바람은 내 편이야, 자기.', '박수는 필요 없어. 네가 쓰러지는 걸로 충분해.'],
          boss: 'Shura, 이 마지막 춤에서 무대는 누구와도 나누지 않아.',
        },
        tsubame: {
          open: ['우리 사이의 거리가 곧 내 무기야.', '제비는 한 번은 놓쳐. 두 번째엔 돌아와서 꽂히지.', '바람은 다 쟀어. 내 화살은 제 길을 알아.'],
          reply: ['가까이 오고 싶어? 해 봐.', '숨 참아. 날아가는 화살은 소리가 없으니까.', '내 눈은 너를 보고 있어. 내 화살도.'],
          boss: 'Shura, 하늘에는 숨을 곳이 없어. 내 화살이 너를 찾아낼 거야.',
        },
      },

      pairs: {
        'akane|aoi': [['akane', 'Aoi! 끝내지 못한 결투를 마무리할 때다.'], ['aoi', '바람은 언제나 같은 불을 향해 분다, Akane. 시작하지.']],
        'kuro|tetsu': [['kuro', '쇠 껍데기라. 속이 비었는지 보자.'], ['tetsu', '산조차 규율 앞에서는 고개를 숙인다, Kuro.']],
        'hana|yuki': [['yuki', '꽃은 눈 속에서 시들어, Hana.'], ['hana', '그럼 눈을 녹여 버리면 되지, Yuki!']],
        'kage|ren': [['ren', '그림자 장난은 안 통해! 모습을 드러내!'], ['kage', '난 바로 여기 있다, 오니. 넌 보는 법을 모를 뿐.']],
        'akane|ren': [['akane', '가면 뒤에 숨는 건 명예 없는 자뿐이다.'], ['ren', '명예? 명예로 배가 부르냐!']],
        'aoi|yuki': [['aoi', '차가운 바람도 바람이다, Yuki.'], ['yuki', '하지만 바람이 잦아들어도 눈은 남지.']],
        'kuro|tora': [['tora', '산이라고? 호랑이도 산에 살지.'], ['kuro', '호랑이는 산에서 죽는다.']],
        'tora|yuki': [['tora', '여우다! 호랑이 앞에서 여우는 뭘 하지?'], ['yuki', '도망치지. 그리고 호랑이 꼬리를 얼려 버려.']],
        'jin|tora': [['tora', '내 사슬이 네 봉을 감으면 어쩔 거냐, 땡중아?'], ['jin', '풀면 되오. 매듭을 푸는 게 내 소명이오.']],
        'jin|ren': [['ren', '중이라고? 기도나 시작해라, 대머리!'], ['jin', '이미 하고 있소, 오니. 그대를 위해서. 그대 안의 불은 그대도 태우고 있소.']],
        'jin|tetsu': [['tetsu', '승려가 전장에 무슨 볼일이냐?'], ['jin', '그대처럼 갑옷을 두른 마음을 위해 왔소, Tetsu. 갑옷은 무겁고, 마음은 더 무겁구려.']],
        'akane|jin': [['akane', '비켜라, 승려. 이 복수는 내 것이다.'], ['jin', '복수는 사슬이오, Akane. 먼저 그것부터 끊읍시다.']],
        'hana|mai': [['hana', '오, 또 다른 무희네! 누가 더 빨리 도는지 보자!'], ['mai', '빠름은 우아함의 그림자일 뿐이야, Hana. 빛을 보여 줄게.']],
        'kage|mai': [['mai', '그림자도 춤을 추니, Kage?'], ['kage', '빛이 꺼질 때만.']],
        'aoi|tsubame': [['tsubame', '네 바람이 내 화살을 비껴 보낼 수 있을까, Aoi?'], ['aoi', '바람은 누구의 편도 아니다, Tsubame. 네 화살의 편도.']],
        'kage|tsubame': [['kage', '보이지 않는 것은 맞힐 수 없다, 궁수여.'], ['tsubame', '그림자는 빛과 함께 오지. 나도 그래.']],
        'mai|tsubame': [['mai', '멀리서 쳐다보는 건 실례야, 궁수. 가까이 와서 봐.'], ['tsubame', '네 무대를 가까이서 보라고 화살을 보내 줄게.']],
      },
      endings: {
        akane: ['Shura의 칼이 땅에 떨어지자, 절의 종이 저절로 울렸다.', 'Akane는 붉은 칼날을 닦고 스승들의 무덤 앞에 고개를 숙였다. 빚은 갚아졌다.', '이제 앞에 놓인 길은 복수가 아니라, 새 제자들에게 명예를 가르치는 길이다.'],
        aoi: ['Shura가 쓰러지자 폭풍이 잠잠해지고, 몇 년 만에 처음으로 구름이 걷혔다.', 'Aoi는 칼을 칼집에 넣고 대나무 숲으로 돌아갔다.', '남은 것은 휘파람 같은 바람 소리뿐이었다.'],
        kuro: ['Kuro는 Shura의 부서진 가면을 산꼭대기에 묻었다.', '한마디 말도 없었다. Kuro는 삿갓을 눌러쓰고 눈 속으로 사라졌다.', '마을 사람들은 그해 겨울 산에서 내려온 산적이 하나도 없었다고 말한다.'],
        yuki: ['Shura의 마지막 숨이 찬 공기 속에서 김이 되어 사라졌다.', 'Yuki는 목도리를 고쳐 매고, 눈 위에 발자국 하나 남기지 않고 떠났다.', '그날 이후 산꼭대기에서는 여우의 그림자만 보였다.'],
        hana: ['Shura의 가면이 땅에 떨어지자, Hana는 그 옆에 벚나무 가지를 놓았다.', '그날 밤 시장은 등불로 가득했고, 가장 큰 환호는 지붕 위에서 춤추는 쿠노이치에게 쏟아졌다.', 'Hana가 어디로 갔는지는 아무도 모른다. 흩날리는 분홍 꽃잎만 남았을 뿐.'],
        tetsu: ['성 지붕 위에서 Tetsu는 Shura의 칼을 무릎에 대고 두 동강 냈다.', '주군의 깃발이 다시 올랐고, 바람이 자랑스럽게 그것을 펄럭였다.', '의무를 다했다. 하지만 사무라이의 의무는 끝나지 않는다.'],
        ren: ['Ren은 Shura의 부서진 가면을 다른 오니 가면 옆에 걸었다. 오니는 둘, 승자는 하나.', '그날 밤 마을은 노래했고, 가장 큰 웃음소리는 언제나처럼 Ren의 것이었다.', '아침이 되자 Ren은 이미 길 위에 있었다. 다음 싸움을 찾아서.'],
        kage: ['Shura가 쓰러지자, Kage의 그림자가 쓰러진 악귀 위로 조용히 드리워졌다.', '흔적도, 소리도 없이. 달빛 아래 그림자 하나만 더 길게 늘어졌다.', '어쩌면 그 그림자는 늘 거기 있었을지도. 어쩌면 처음부터 없었을지도.'],
        shura: ['성 지붕 위에 선 자는 단 하나. 같은 가면을 더 어둡게 쓴 자였다.', 'Shura는 더 이상 라이벌을 찾지 않는다. 라이벌이 Shura를 찾는다.'],
        def: ['마지막 고수가 쓰러졌다. 이제 그림자의 길은 그대의 것이다.', '칼을 거두어라. 전설은 지금부터 시작된다.'],
        tora: ['철컹이는 사슬 소리가 Shura의 몰락을 알렸다.', 'Tora는 부서진 가면을 사슬에 매달았다. 새로운 사냥 전리품이었다.', '그날 이후 숲에서 호랑이의 포효를 옛날이야기로 여기는 자는 없었다.'],
        jin: ['Jin은 쓰러진 Shura 곁에 무릎 꿇고 기도했다.', '절로 돌아가는 길, 봉에는 피 한 방울 묻어 있지 않았다.', '그날 밤 산의 종이 다시 울렸다. 이번에는 애도가 아니라 평화를 위해.'],
        mai: ['Shura가 쓰러지자, Mai는 부채를 탁 접고 고개 숙여 인사했다.', '밤 시장은 아직도 그 춤 이야기를 한다.', '막이 내렸다. 하지만 Mai는 결코 무대를 떠나지 않았다.'],
        tsubame: ['마지막 화살이 성 지붕에 꽂혀 소리 없이 떨렸다.', 'Tsubame는 활을 메고 남쪽으로 날아가는 제비들을 바라보았다.', '그 모습은 다시 보이지 않았다. 남은 것은 과녁에 박힌 화려한 깃의 화살들뿐.'],
      },
      roster2: {
        notes: {
          tora: ['약공격: 중거리에선 사슬 채찍, 근거리에선 낫', '강공격: 사슬을 던져, 맞으면 상대를 끌어당김', '콤보 마무리: 상대가 멀면 사슬로 끌어옴'],
          jin: ['봉의 양 끝으로 타격, 둔탁한 타격이라 피가 나지 않음', '세 번째 타격과 강공격 후리기는 상대를 넘어뜨림', '가드 중 자세 게이지가 더 천천히 참'],
          mai: ['패링 판정이 더 넓음', '가드 중에 부채가 투사체를 되돌려 보냄', '강공격: 바람의 파동이 상대를 밀어내고 투사체를 흩뜨림'],
          tsubame: ['강공격: 활로 화살 발사, 누르고 있으면 차지 사격', '던지기: 뒤로 공중제비를 돌며 공중에서 화살 발사', '화살이 없으면 강공격은 tantō 사용, 화살은 시간이 지나면 다시 참'],
        },
      },
    });

    merge(EN.CHARS, {
      akane: { title: '붉은 칼날', desc: '균형 잡힌 katana 달인. 빠른 3연타 콤보와 강력한 패링.', weapon: 'Katana' },
      aoi: { title: '푸른 바람', desc: '민첩한 katana 달인. 조금 더 빨리 걷고 바람처럼 대시합니다.', weapon: 'Katana' },
      kuro: { title: '검은 산', desc: '긴 nodachi를 휘두릅니다. 느리지만 사거리가 넓고 일격이 파괴적입니다.', weapon: 'Nodachi' },
      yuki: { title: '눈 여우', desc: '짧은 kodachi로 매우 빠르게 공격합니다. 수리검이 많고 목도리가 깁니다.', weapon: 'Kodachi' },
      hana: { title: '벚꽃의 춤', desc: '쿠노이치. tantō 두 자루로 춤추듯 싸웁니다. 손은 가장 빠르고 사거리는 가장 짧습니다.', weapon: '쌍 Tantō' },
      tetsu: { title: '철의 요새', desc: '갑옷을 입은 사무라이. naginata로 가장 긴 사거리를 자랑하며, 공격을 맞아도 끄떡없습니다.', weapon: 'Naginata' },
      ren: { title: '붉은 오니', desc: '오니 가면을 쓴 싸움꾼. 가드를 부수는 일격과 파괴적인 발차기로 상대를 공포에 떨게 합니다.', weapon: 'Uchigatana' },
      kage: { title: '그림자 그 자체', desc: '두건을 쓴 그림자. ninjatō로 빠르게 싸우고 대시가 길며, 지나간 자리에 그림자를 남깁니다.', weapon: 'Ninjatō' },
      tora: { title: '사슬 호랑이', desc: 'Kusarigama 달인. 중거리에서 추 달린 사슬을 휘두르고, 강공격으로 상대를 끌어와 낫으로 벱니다.', weapon: 'Kusarigama' },
      jin: { title: '철봉 승려', desc: 'Bō를 쓰는 승려. 양 끝으로 치는 긴 봉, 단단한 가드, 넘어뜨리는 둔탁한 타격. 피는 흘리지 않고 뼈만 울립니다.', weapon: 'Bō' },
      mai: { title: '부채 무희', desc: '전투 부채를 쓰는 쿠노이치. 매우 빠르고 패링 판정이 넓으며, 부채로 투사체를 되돌리고 바람으로 상대를 밀어냅니다.', weapon: '쌍 Tessen' },
      tsubame: { title: '제비 궁수', desc: '활과 tantō를 지녔습니다. 멀리서 화살을 쏘고 (강공격을 누르고 있으면 강한 사격), 다가오는 상대에게서 뒤로 공중제비를 돌며 공중에서 쏩니다.', weapon: 'Yumi + Tantō' },
      shura: { title: '붉은 고수', desc: '붉은 피로 길을 새긴 악귀 고수. 긴 nodachi, 짓뭉개는 일격, 거의 완벽한 패링.', weapon: 'Nodachi' },
    });

    merge(EN.ARENAS, {
      temple: '달빛 사원',
      rain: '폭풍의 대나무 숲',
      snow: '눈 덮인 봉우리',
      village: '불타는 마을',
      market: '야시장',
      waterfall: '폭포',
      castle: '성 지붕',
    });

    merge(EN.SPECIALS, {
      akane: { desc: '눈 깜짝할 새 상대를 꿰뚫고 지나가며 허공에 불타는 초승달을 남기는 붉은 발도 베기.', tip: '패링하거나 옆으로 대시하세요' },
      aoi: { desc: '크게 휘둘러 바람의 칼날을 앞으로 날립니다. 완벽한 타이밍에 가드하면 되받아칩니다.', tip: '점프하거나, 칼로 베거나, 완벽한 순간에 가드하세요' },
      kuro: { desc: '뛰어올라 nodachi로 땅을 가릅니다. 바닥을 타고 퍼지는 충격파가 가드를 부수고 상대를 넘어뜨립니다.', tip: '충격파를 뛰어넘어 공중에서 공격하세요' },
      yuki: { desc: '눈보라처럼 몰아치는 번개 같은 5연타. 마지막 타격은 상대를 넘어뜨립니다.', tip: '가드하고 첫 타격을 패링하세요' },
      hana: { desc: '쌍 tantō를 들고 벚꽃 회오리가 되어 앞으로 돌진하며 양쪽을 벱니다.', tip: '가드하거나 뒤로 대시하세요' },
      tetsu: { desc: 'naginata를 사방으로 휘두릅니다. 공격을 맞아도 회전이 멈추지 않습니다 (슈퍼 아머).', tip: '사거리 밖으로 벗어나거나 패링하세요' },
      ren: { desc: '가드를 부수는 어깨 돌진 후, 상대를 띄우는 올려 베기.', tip: '가드는 소용없습니다. 패링, 점프, 대시하세요' },
      kage: { desc: '연기 속으로 사라지며 그림자 분신을 남기고, 상대 뒤에 나타나 공격합니다.', tip: 'Kage가 나타나는 순간 가드하세요' },
      tora: { desc: '머리 위로 사슬을 돌려 주변을 휩쓰는 회오리를 만듭니다. 걸린 상대는 끌려와 낫에 하늘로 날아갑니다.', tip: '사거리 밖으로 피하거나 가드하세요. 걸리지 않으면 끌어당기기는 헛손질입니다' },
      jin: { desc: '금강륜처럼 봉을 돌리며 전진합니다. 네 번 타격한 뒤 올려치기로 상대를 띄웁니다.', tip: '뒤로 대시하거나 첫 타격을 패링하세요' },
      mai: { desc: '앞으로 흘러가는 회오리를 일으켜 상대를 끌어들여 베고, 마지막에 하늘로 날려 버립니다.', tip: '완벽한 순간에 회오리를 가드하거나 물러나세요. 느리게 움직입니다' },
      tsubame: { desc: '뒤로 뛰어올라 하늘에서 화살을 퍼붓습니다. 빗나가면 방향을 틀어 뒤에서 꽂히는 제비 화살을 쏩니다.', tip: '땅의 표식에서 벗어나세요. 제비 화살은 돌아오니 뒤를 조심하세요' },
      shura: { desc: '포효하며 붉은 연기로 녹아들어, 상대의 앞과 뒤에 나타나 nodachi로 세 번 무겁게 내리벱니다. 마지막 일격은 상대를 띄웁니다.', tip: '붉은 섬광을 주시하세요. 베기를 패링하면 기술이 끝나고, 가드하면 자세가 무너집니다' },
    });

    merge(EN.TXT, {
      gbreak: '자세 붕괴!', cut: '절단!', reflect: '반사!', parry: '패링!', caught: '포획!',
      swallowHit: '燕!', vajraHit: '金剛!', whirlHit: '旋風の舞',
    });

    merge(EN.AI_LEVELS, { 0: '견습생', 1: '고수', 2: '전설', 3: 'Shura' });

    EN.NUMWORDS = ['영', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열한', '열두'];


    merge(EN.PHRASES, {

      'Gölge Düellosu': 'Shadow Duel',
      'Duraklat': '일시정지',
      'KARŞILIKLI SERİ': '랠리',
      'SON DARBE': '최후의 일격',
      'atlamak için bir tuşa bas': '아무 키나 눌러 건너뛰기',

      'GARD': '가드',
      'HAFİF': '약공격',
      'SALDIR': '공격',
      'AĞIR': '강공격',
      'ATIL': '대시',
      'TEKME': '발차기',

      'Sekiz savaşçı, üç arena. Gerçek zamanlı kılıç çarpışması, kılıç kilitlenmesi, savuşturma, denge kırma, Gölge Kesiği ve ragdoll fiziği.': '여덟 명의 전사, 세 곳의 아레나. 실시간 칼날 격돌, 칼날 겨루기, 패링, 자세 붕괴, 그림자 베기, 래그돌 물리까지.',
      'İki Oyuncu': '2인 대전',
      'Aynı klavyede ya da iki gamepad ile kafa kafaya': '키보드 하나 또는 게임패드 두 개로 맞대결',
      'CPU\'ya Karşı': 'CPU 대전',
      'Ninjanı seç, rakibini yapay zekâ yönetsin': '닌자를 고르면 상대는 AI가 조종합니다',
      'Zorluk': '난이도',
      'Çırak': '견습생',
      'Usta': '고수',
      'Efsane': '전설',
      'Aylık Turnuva': '월간 토너먼트',
      'Dan Sınavı': 'Dan 심사',
      'Şampiyonlar Salonu': '챔피언의 전당',
      'Seyret': '관전',
      'Rastgele iki ninja, Efsane yapay zekâ': '무작위 닌자 둘, 전설 AI',
      'Ses': '사운드',
      'Müzik': '음악',
      'Kan efekti': '피 효과',
      'Tuş ipuçları': '키 힌트',
      'Yüksek grafik': '고품질 그래픽',

      'Kontroller': '조작법',
      '1. Oyuncu': '1P',
      '2. Oyuncu': '2P',
      'Yürü': '걷기',
      'Zıpla': '점프',
      'Gard (basılı tut)': '가드 (누르고 있기)',
      'Hafif kesik (×3 kombo)': '약베기 (×3 콤보)',
      'Ağır kesik': '강베기',
      'Tekme': '발차기',
      'Sol Shift': '왼쪽 Shift',
      'Sağ Shift': '오른쪽 Shift',
      'Atılma': '대시',
      'Ki tekniği (ki dolu)': '필살기 (기 가득)',

      'Ninjanı seç': '닌자 선택',
      'Hazır': '준비 완료',
      '1. oyuncunun ninjası': '1P의 닌자',
      '2. oyuncunun ninjası': '2P의 닌자',
      'Önceki ninja': '이전 닌자',
      'Sonraki ninja': '다음 닌자',
      '1. oyuncu kadrosu': '1P 캐릭터 목록',
      '2. oyuncu kadrosu': '2P 캐릭터 목록',
      'Dövüşe başla': '대전 시작',
      'Geri': '뒤로',
      'Kilitli': '잠김',
      'Rastgele': '랜덤',
      'Hız': '속도',
      'Güç': '파워',
      'Menzil': '사거리',
      'Can': '체력',

      'Duraklatıldı': '일시정지',
      'Devam et': '계속하기',
      'Maçı yeniden başlat': '매치 재시작',
      'Ana menü': '메인 메뉴',
      'Rövanş': '재대결',
      'Karakter değiştir': '캐릭터 변경',
      'Zafer senin': '승리!',
      'Raund': '라운드',
      'Verilen hasar': '입힌 피해',
      'Savuşturma': '패링',
      'Ki Saldırısı': '필살기',

      'Antrenman': '훈련',
      'ANTRENMAN': '훈련',
      'Sıralama': '순위표',
      'Tümü': '전체',
      'Ekranı yan çevir': '화면을 가로로 돌려 주세요',
      'Performans için grafik düşürüldü': '성능을 위해 그래픽을 낮췄습니다',

      'Kanlı Usta': '피의 고수',
      'Yolunu kanla çizen iblis usta. Uzun nodachi, yıkıcı darbeler, neredeyse kusursuz savuşturma.': '피로 길을 새긴 악귀 고수. 긴 nodachi, 짓뭉개는 일격, 거의 완벽한 패링.',

      'SEN': '나',
      'KUKLA': '허수아비',

      'Son raund': '마지막 라운드',
      'Kazanan her şeyi alır': '승자가 모든 것을 갖는다',
      'İlk iki raundu alan kazanır': '2라운드 선승',
      'Dövüş!': '승부!',
      'Süre doldu': '시간 종료',
      'Berabere': '무승부',
      'Çifte K.O.': '더블 K.O.',
      'Mükemmel': '퍼펙트',

      'F / K tuşuna hızlıca bas!': 'F / K 연타!',
      'Hafif ya da ağır tuşuna hızlıca bas!': '약·강공격 연타!',

      'KARŞILIK': '반격',
      'SAVUŞTUR': '패링',

      'SON VURUŞ!': '피니시!',
      'KİLİTLENDİ!': '칼날 겨루기!',
      'İTTİ!': '밀쳐냄!',
      'DENGE KIRILDI!': '자세 붕괴!',
      'GARD KIRILDI!': '가드 붕괴!',
      'KESİLDİ!': '절단!',
      'YANSITMA!': '반사!',
      'SAVUŞTURMA!': '패링!',
      'YAKALANDI!': '포획!',
      'ZIRH!': '아머!',
      'ARKADAN!': '백어택!',
      'DUVAR!': '벽 충돌!',
      'KAFA!': '헤드샷!',
      'KARŞI!': '카운터 히트!',
      'KRİTİK!': '크리티컬!',
      'SÜPÜRME!': '후리기!',
      'KARŞILIK!': '반격!',
      'YERE SERİLDİ': '다운',
      'ÇARPIŞMA!': '격돌!',
    });

    merge(EN.HTML, {

      'Gölge<br><em>Düel</em><em>losu</em>': 'Shadow<br><em>Du</em><em>el</em>',

      '<b>Savuşturma:</b> darbe gelmeden hemen önce gard tuşuna bas; rakip sendeler.':
        '<b>패링:</b> 공격이 닿기 직전에 가드를 누르세요. 상대가 휘청입니다.',
      '<b>Karşılık (返し技):</b> gard ya da savuşturmanın hemen ardından saldırı tuşu → anında karşı kesik. <b>İleri</b> + hafif = bacağa süpürme, <b>geri</b> + hafif = yanından dönüp arkadan kesme, <b>ağır</b> = güçlü karşı darbe.':
        '<b>반격 (返し技):</b> 가드나 패링 직후 공격 → 즉시 반격 베기. <b>앞</b> + 약공격 = 다리 후리기, <b>뒤</b> + 약공격 = 옆으로 돌아 뒤에서 베기, <b>강공격</b> = 강력한 반격.',
      '<b>Karşılıklı seri:</b> karşılık da karşılanabilir. Her turda vuruşlar hızlanır ve güçlenir; kendi 3. karşılığın üç vuruşluk sinematik bir bitirişe dönüşür. Seriyi kıran darbe ağır çekimde iner.':
        '<b>랠리:</b> 반격도 반격당할 수 있습니다. 주고받을수록 공격이 빨라지고 강해지며, 내 세 번째 반격은 3연타 시네마틱 피니시가 됩니다. 랠리를 끊는 일격은 슬로 모션으로 들어갑니다.',
      '<b>Kılıç kilidi:</b> kılıçlar çarpışınca kilitlenebilir. Hafif/ağır tuşuna hızlı basan rakibini iter.':
        '<b>칼날 겨루기:</b> 칼날이 부딪히면 맞물릴 수 있습니다. 약·강공격을 더 빨리 연타한 쪽이 상대를 밀어냅니다.',
      '<b>Ki barı</b> vurdukça, yedikçe ve savuşturdukça dolar. Dolunca her ninjanın kendine özgü ki tekniği açılır (Antrenman’daki hareket listesinde görebilirsin).':
        '<b>기 게이지</b>는 때리고, 맞고, 패링할 때 찹니다. 가득 차면 닌자마다 고유한 필살기를 쓸 수 있습니다 (훈련의 기술표에서 확인).',
      '<b>Atılma + hafif</b> = atılarak kesik. <b>Havada</b> hafif = hava kesiği, ağır = dalış. Ağır kesik yere serer, duvara çarpan geri seker.':
        '<b>대시 + 약공격</b> = 대시 베기. <b>공중</b> 약공격 = 공중 베기, 강공격 = 급강하. 강베기는 상대를 넘어뜨리고, 벽에 부딪힌 상대는 튕겨 나옵니다.',
      '<b>Denge çubuğu</b> dolarsa gard kırılır. Tekme gardı delip dengeyi hızla doldurur.':
        '<b>자세 게이지</b>가 가득 차면 가드가 무너집니다. 발차기는 가드를 뚫고 자세 게이지를 빠르게 채웁니다.',

      'Gamepad: X hafif · Y ağır · B tekme · A zıpla · LB gard · RB shuriken · RT atılma · R3 ki tekniği. Start ya da <kbd>P</kbd> duraklatır. CPU modunda her iki tuş seti de seni yönetir.':
        '게임패드: X 약공격 · Y 강공격 · B 발차기 · A 점프 · LB 가드 · RB 수리검 · RT 대시 · R3 필살기. Start 또는 <kbd>P</kbd>로 일시정지. CPU 모드에서는 두 키 세트 모두 내 캐릭터를 조작합니다.',

      '<kbd>Enter</kbd> başlatır · <kbd>⌫</kbd> menüye döner': '<kbd>Enter</kbd> 시작 · <kbd>⌫</kbd> 뒤로',
      '<kbd>Enter</kbd> / <kbd>F</kbd> başlatır · <kbd>⌫</kbd> çıkar': '<kbd>Enter</kbd> / <kbd>F</kbd> 시작 · <kbd>⌫</kbd> 나가기',
    });

    EN.PATTERNS.push(

      [/^RAUND (\d+)$/, '라운드 $1'],
      [/^(\d+)\. Raund$/, '라운드 $1'],

      [/^(\d+)\. KARŞILIK$/, '반격 ×$1'],
      [/^(\d+) VURUŞLUK SERİ!$/, '$1연타 랠리!'],

      [/^(.+) önde$/, (m, n) => I.t(n) + ' 우세'],

      [/^(.+) kazandı$/, (m, n) => I.t(n) + ' 승리'],

      [/^(\d+) – (\d+) · (\d+) raund · (.+)$/, (m, a, b, r, ar) => `${a} – ${b} · ${r}라운드 · ${I.t(ar)}`],
    );


    merge(EN.STR, {
      menu: { play: '플레이', playSub: (name, lv) => `${name} vs CPU · ${lv}` },
      first: { play: '플레이', sub: '탭 한 번으로 바로 대전', menu: '모든 모드' },
      ads: {
        cont: '여기서 계속하기', contSub: '광고 보기 · 페널티 없이 재도전',
        trial: (name) => `한 판 체험: ${name}`, trialSub: '광고 보기',
        fail: '지금은 광고가 없습니다. 잠시 후 다시 시도하세요',
      },
      coach: {
        attack: (l) => `${l} 공격`,
        guard: (l, g) => `${g} 누르고 있기: 가드`,
        parry: (l, g) => `공격이 닿기 직전에 ${g}: 패링`,
        attackT: (l) => `${l} 탭 · 계속 탭: 콤보`,
        guardT: (l, g) => `${g} 누르고 있기: 가드`,
        parryT: (l, g) => `공격이 닿기 직전에 ${g} 탭: 패링`,
      },
    });


    merge(EN.STR, {
      vol: {
        title: '음량', master: '전체', music: '음악', sfx: '효과음', sound: '사운드',
        pct: (n) => `${n}%`,
        muted: '소리가 꺼져 있습니다. 슬라이더를 움직이면 다시 켜집니다.',

        voice: '음성',
        uiSfx: '메뉴 효과음',
        credit: '음성: ユーフルカ (youfulca.com) · 効果音ラボ · すぱらんど',
      },
    });



    merge(EN.STR, {
      tedit: {
        move: '이동',
        moves: { float: '스틱', fixed: '고정 스틱', dpad: '방향 패드' },
        mnote: {
          float: '엄지가 닿는 곳에 스틱이 나타납니다.',
          fixed: '스틱이 놓은 자리에 고정됩니다. 가운데에서 밀어 주세요.',
          dpad: '개별 버튼: 누르고 있으면 걷기, 두 번 탭하면 대시. 두 버튼 사이를 누르면 둘 다 (▶ + ▲ = 앞으로 점프).',
          dtap: '개별 버튼: ◀ ▶을 짧게 탭하면 한 걸음, 누르고 있으면 걷기, 두 번 탭하면 대시.',
        },
        dtap: '탭으로 한 걸음',
        edit: '버튼 배치 편집',
        title: '버튼 배치 편집',
        hint: '버튼을 원하는 곳으로 끌어다 놓으세요. 버튼을 탭하면 크기, 투명도, 숨기기를 설정합니다.',
        rotate: '화면을 가로로 돌려 전투 버튼을 배치하세요.',
        shapes: { phone: '휴대폰', tablet: '태블릿', portrait: '세로' },
        screenNote: '배치는 화면 형태별로 저장됩니다. 휴대폰과 태블릿은 각자의 배치를 가집니다.',
        save: '저장', cancel: '취소', options: '옵션', done: '완료', close: '닫기',
        size: '크기', sizes: { s: 'S', m: 'M', l: 'L', xl: 'XL' },
        opacity: '투명도', opacityAll: '투명도 (전체)',
        hide: '숨기기', show: '보이기', hidden: '숨김',
        snap: '격자에 맞추기',
        presets: '프리셋', pRight: '오른손', pLeft: '왼손', pSplit: '가드 왼쪽',
        reset: '기본값으로', resetDone: '기본 배치로 돌아왔습니다 (저장하면 적용).',
        overlap: '버튼은 겹칠 수 없어 가장 가까운 빈 곳으로 옮겼습니다.',
        noRoom: '그곳엔 자리가 없어 버튼이 돌아갔습니다.',
        saved: '조작 설정 저장됨',
        throwName: '수리검',
        pauseName: '일시정지',
        dirs: { dl: '◀ 왼쪽', dr: '오른쪽 ▶', du: '▲ 점프', dd: '▼ 가드' },
      },
    });



    merge(EN.STR, {
      menu: { arcadeDesc: '점점 강해지는 라이벌을 하나씩 쓰러뜨리세요. 끝에는 숨겨진 고수가 기다립니다. 명예를 가장 많이 얻는 곳입니다.' },
      sel: {
        title: { rival: '라이벌 도전 · 닌자 선택' },
        go: { rival: '결투 수락' },
        moves: '기술',
        movesOf: (name) => `${name} · 기술`,
        close: '닫기',
      },
      hint: {
        honor: (have, need) => `명예 ${num(Math.min(have, need))}/${num(need)} → 라이벌 도전 개방`,
        ready: '도전 준비 완료!',
        arenaHonor: (have, need) => `명예 ${num(need)}에 개방 (${num(Math.min(have, need))}/${num(need)})`,
      },
      honor: {
        name: '명예',
        head: '명예',
        rows: { win: '승리', loss: '참가', rounds: '획득 라운드', perfect: '퍼펙트 라운드', rally: '반격 랠리', counter: '반격', parry: '패링', rivalWin: '라이벌 도전', arcadeClear: '아케이드 클리어' },
        total: (n) => `명예: ${num(n)}`,
        next: (name, left) => `다음 닌자: ${name} — 명예 ${num(left)} 남음`,
        bar: (have, need) => `명예 ${num(Math.min(have, need))}/${num(need)} → 라이벌 도전 개방`,
        ready: (name) => `${name}의 도전장!`,
        readyGo: '수락',
        all: '모든 닌자 해금',
        bonus: { arcadeClear: '아케이드 클리어', tourneyClear: '토너먼트 제패', danPass: 'Dan 심사 합격', rivalWin: '라이벌 도전 승리', tutorial: '튜토리얼 완료' },
        bonusToast: (n, what) => `명예 +${num(n)} · ${what}`,
        road: '명예의 길',
        roadSub: '모든 1인 모드에서 명예를 얻습니다. 닌자의 목표치에 도달하면 그 닌자가 결투를 신청하고, 이기면 동료가 됩니다.',
        earnHead: '명예 얻는 법',
        earn: (H) => [
          ['CPU 대전', `승리: 견습생 ${H.win[0]} · 고수 ${H.win[1]} · 전설 ${H.win[2]}`],
          ['아케이드', `난이도별 승리 · Shura ${H.win[3]} · 클리어 +${H.arcadeClear}`],
          ['토너먼트 & Dan', `승리 ×${H.modeMul.tourney} · 토너먼트 제패 +${H.tourneyClear} · Dan 심사마다 +${H.danPass(1)} 이상`],
          ['패배해도', `참가 ${H.loss} · 획득 라운드마다 ${H.roundWon}`],
          ['좋은 플레이', `패링, 반격, 랠리, 퍼펙트 라운드: 매치당 최대 +${H.styleCap}`],
        ],
        rivalsHead: '라이벌',
        arenasHead: '아레나',
        open: '해금',
        castle: '아케이드에서 Shura 격파',
        you: (n) => `내 명예: ${num(n)}`,
      },
      rival: {
        stage: '라이벌 도전',
        selTitle: (name) => `${name}의 도전 · 닌자 선택`,
        lvHp: (lv, p) => (p === 100 ? lv : `${lv} · 라이벌 체력 ${p}%`),
        accept: '도전 수락',
        acceptSub: (name) => `승리하면 ${name} 합류`,
        quit: '물러나기',
        hud: '라이벌 도전',
        winTitle: (name) => `${name} 합류!`,
        winSub: (name) => `${name}, 이제 선택 화면에 등장! 바로 플레이해 보세요!`,
        tryNew: (name) => `${name} 플레이`,
        lossTitle: '도전은 계속된다',
        lossSub: (name, p) => `이번엔 ${name}의 승리. 져도 잃는 건 없습니다. 다음엔 상대가 체력 ${p}%로 시작합니다.`,
        lossSubMin: (name) => `이번엔 ${name}의 승리. 져도 잃는 건 없습니다. 다시 도전하세요.`,
        retry: '다시 도전',
        reveal: '새 닌자',
        toastReady: (name) => `${name}의 도전장!`,
        lines: {
          hana: '네 명예 얘기 들었어, 시장 전체가 네 얘기뿐이야! 내 춤을 따라오면 같이 가 줄게!',
          tetsu: '그대의 이름이 내 귀에 닿았다. 나를 이기면 내 naginata가 그대 곁에서 싸우리라.',
          ren: '하! 드디어 누가 날 불렀군! 이기면 네 편이 되고, 지면 내 웃음소리나 들어라!',
          kage: '한동안 너를 지켜봤다. 내 그림자를 잡으면 너의 것이 되겠다.',
          tora: '사냥감이 아니란 걸 증명해 봐. 내 사슬을 빠져나가면 네 곁을 걷지.',
          jin: '그대의 명예가 마음에서 나온 것이라면 내 봉이 알 것이오. 오시오, 시험해 보리다.',
          mai: '내 무대에 초대할게. 내 박수를 받아 내면 내 춤은 네 거야.',
          tsubame: '멀리서 지켜봤어. 꽤 하던데. 내 화살을 피하면 내 활은 네 편이야.',
        },
      },
    });



    merge(EN.CHARS, {
      akane: { desc: '발도술 달인. 칼은 칼집에서 기다리고 모든 베기가 발도입니다. 발도 자세로 날아오는 공격을 받아칩니다.', weapon: 'Katana (iai)' },
      aoi: { desc: '한 손으로 tachi를 쓰는 바람의 검객. 긴 찌르기와 바람의 걸음으로 한 번에 거리를 좁힙니다.', weapon: 'Tachi' },
      ren: { desc: '오니 가면을 쓴 싸움꾼. 칼은 어깨에 걸치고 팔꿈치, 무릎, 어깨, 머리로 싸우며 가드를 짓뭉갭니다.' },
      kage: { desc: '두건을 쓴 그림자. ninjatō를 역수로 쥐고 그림자 걸음, 페인트, 연막탄으로 싸웁니다.' },
    });
    merge(EN.TXT, { kiCancel: '기 캔슬!', launch: '띄우기!', iaiCatch: 'IAI GAESHI!' });
    EN.PATTERNS.push([/^(\d+) VURUŞ$/, '$1 히트']);
    merge(EN.PHRASES, {

      'Tekme': '발차기',
      'Tekme: dengeyi hızla doldurur, gardı kırmaya yarar. Ardından AĞIR ile seri bitirişine bağlanır.': '발차기: 자세 게이지를 빠르게 채워 가드를 무너뜨리는 데 유용합니다. 이어서 강공격으로 연계 마무리.',
      'Shuriken fırlatır; zamanla yeniden dolar.': '수리검을 던집니다. 시간이 지나면 다시 찹니다.',
      'Hava kesiği': '공중 베기',
      'Havada hafif kesik. Havaya fırlatılmış rakibe de vurur.': '공중 약베기. 띄워진 상대도 맞힙니다.',
      'Dalış': '급강하',
      'Havadan aşağı dalış kesiği; yere serer.': '공중에서 내리꽂는 베기. 상대를 넘어뜨립니다.',
      'Kaeshi-waza (karşılık)': 'Kaeshi-waza (반격)',
      'Gard ya da savuşturmanın hemen ardından karşılık: nötr Suriage, ileri Harai (yere serer), geri Nuki (arkaya geçer), ağır Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.': '가드나 패링 직후 반격: 중립 Suriage, 앞 Harai (넘어뜨림), 뒤 Nuki (뒤로 빠져나감), 강공격 Uchiotoshi. 내 세 번째 반격은 피니시이며, 패링당하면 랠리가 이어집니다.',
      'Fırlatıcı isabet edince HAFİF: rakibin peşinden sıçrayıp havada keser. Ardından AĞIR ile yere çakar. Havadaki rakip en çok üç vuruş alır.': '띄우기가 맞으면 약공격: 상대를 쫓아 뛰어올라 공중에서 벱니다. 이어서 강공격으로 내리꽂습니다. 공중의 상대는 최대 세 번까지 맞습니다.',
      'Üç vuruşluk hafif seri. İkinci ve üçüncü vuruş ki doluyken tekniğe bağlanır.': '약공격 3연계. 기가 가득하면 두 번째와 세 번째 타격을 필살기로 캔슬할 수 있습니다.',
      'Ağır vuruş: yavaş ama yere serer.': '강공격: 느리지만 상대를 넘어뜨립니다.',
      'İleri atılarak dürter; hafif seriye devam eder.': '앞으로 뛰어들며 찌릅니다. 약공격 연계로 이어집니다.',
      'Yarım adım geri çekilip bacaklara alçak süpürme; yere serer.': '반걸음 물러난 뒤 다리를 낮게 후립니다. 상대를 넘어뜨립니다.',
      'Fırlatıcı: yükselen kesik rakibi havaya kaldırır.': '띄우기: 올려 베기로 상대를 공중에 띄웁니다.',
      'Sıçrayıp tepeden iner: yavaş ama gardı ezer, yere serer.': '뛰어올라 위에서 내려찍습니다. 느리지만 가드를 짓뭉개고 상대를 넘어뜨립니다.',
      'Atılırken dönerek geniş kesik; yere serer.': '대시하며 회전해 넓게 벱니다. 상대를 넘어뜨립니다.',
      'İki kesiklik seri bitirişi; son kesik yere serer.': '두 번 베는 연계 마무리. 마지막 베기는 상대를 넘어뜨립니다.',
      'Rakibin kılıcını aşağı çarpıp dürter: gardı ezer.': '상대의 칼을 쳐 내리고 찌릅니다. 가드를 짓뭉갭니다.',

      'Kından yatay çekiş kesiği, çapraz iniş, geri dönen kesik; kılıç her seferinde kınına döner.': '칼집에서 가로로 뽑아 베고, 비스듬히 내려 베고, 되돌려 벱니다. 칼은 매번 칼집으로 돌아갑니다.',
      'Derin çömelişten geniş yatay çekiş; yere serer.': '깊이 웅크린 자세에서 넓게 가로 발도. 상대를 넘어뜨립니다.',
      'Atılarak kından çekiş: uzak mesafeyi bir anda kapatır, seriye devam eder.': '돌진 발도: 먼 거리를 순식간에 좁히고 연계로 이어집니다.',
      'Kılıcı çekmeden kabzayla göğse vurur: hızlı, sersemletir. Ardından HAFİF ile Kesa ya da AĞIR ile Kurenai Renga.': '칼을 뽑지 않고 칼자루로 가슴을 칩니다. 빠르고 상대를 기절시킵니다. 이어서 약공격으로 Kesa, 강공격으로 Kurenai Renga.',
      'Fırlatıcı: kından yükselen çekiş rakibi havaya kaldırır.': '띄우기: 칼집에서 올려 뽑는 발도로 상대를 공중에 띄웁니다.',
      'Çekiş duruşu: kısa bir an bekler; bu sırada gelen yakın dövüş darbesini yakalar ve kaçınılmaz bir iai kesiğiyle karşılık verir. Boşa giderse açık kalır.': '발도 자세: 잠시 기다리다가 그사이 들어온 근접 공격을 받아 내고 피할 수 없는 발도 베기로 반격합니다. 아무것도 오지 않으면 빈틈을 드러냅니다.',
      'Kesa’dan sonra yükselen ve inen iki çekiş kesiği; son kesik yere serer.': 'Kesa 다음, 올려 베고 내려 베는 두 번의 발도. 마지막 베기는 상대를 넘어뜨립니다.',
      'Tekmeden sonra çömelip rakibin içinden geçen kızıl iai; arkasında belirir.': '발차기 후 웅크려 상대를 꿰뚫고 지나가는 붉은 발도. 상대 뒤에 나타납니다.',

      'Tek elle uzun dürtüş, yukarı savrulan kesik ve rüzgâr adımıyla derin atılma dürtüşü.': '한 손으로 길게 찌르고, 위로 튕겨 베고, 바람의 걸음으로 깊이 돌진하며 찌릅니다.',
      'Dönerek geniş yatay kesik; yere serer.': '회전하며 넓게 가로 베기. 상대를 넘어뜨립니다.',
      'Rüzgâr adımı: çok uzaktan tek hamlede dürter, seriye devam eder.': '바람의 걸음: 아주 먼 곳에서 한 번에 찌르고 연계로 이어집니다.',
      'Geri çekilirken uzun menzilli iniş kesiği: yaklaşanı cezalandırır.': '물러나며 길게 내려 벱니다. 다가오는 상대를 응징합니다.',
      'Fırlatıcı: dönerek yükselen kesik rakibi havaya kaldırır.': '띄우기: 회전하며 올려 베어 상대를 공중에 띄웁니다.',
      'Geri sıçrar, ardından çok uzağa uzanan dürtüşle geri döner: gardı ezer, yere serer.': '뒤로 뛰었다가 아주 긴 찌르기로 돌아옵니다. 가드를 짓뭉개고 상대를 넘어뜨립니다.',
      'Üç hızlı dürtüş; sonuncusu rüzgârla rakibi savurur.': '빠른 찌르기 세 번. 마지막 찌르기는 바람으로 상대를 날려 버립니다.',
      'İki kez dönerek çevresini biçen kesik; gardı ezer.': '두 번 회전하며 주변을 베어 냅니다. 가드를 짓뭉갭니다.',

      'Kesik · Dirsek · Diz': '베기 · 팔꿈치 · 무릎',
      'Tek elle kesik, dirsek darbesi ve uçan diz: kılıçla başlayıp bedenle biter.': '한 손 베기, 팔꿈치 치기, 날아 무릎 차기. 칼로 시작해 몸으로 끝납니다.',
      'İki elle tepeden ezici iniş; gardı zorlar, yere serer.': '두 손으로 위에서 짓뭉개는 내려치기. 가드를 압박하고 상대를 넘어뜨립니다.',
      'Omuz hücumu: öne atılıp omuzla çarpar, dengeyi sarsar. İsabet ederse seriye devam eder.': '어깨 돌진: 앞으로 뛰어들어 어깨로 부딪쳐 자세를 흔듭니다. 맞으면 연계로 이어집니다.',
      'Kafa atar: kısa menzil, uzun sersemletme. İsabet ederse seriye devam eder.': '박치기: 사거리는 짧고 기절은 깁니다. 맞으면 연계로 이어집니다.',
      'Fırlatıcı: aşağıdan yukarı iki elle savrulan kesik.': '띄우기: 아래에서 위로 두 손으로 휘두르는 베기.',
      'Topuğu havaya kaldırıp balta gibi indirir: yere serer.': '발뒤꿈치를 높이 들어 도끼처럼 내리찍습니다. 상대를 넘어뜨립니다.',
      'Dirsekten sonra kesik ve tepeden ezici iniş; son vuruş yere serer.': '팔꿈치 다음 베기와 위에서 짓뭉개는 내려치기. 마지막 타격은 상대를 넘어뜨립니다.',
      'Tekmenin ardından dönen topuk tekmesi; yere serer.': '발차기 후 돌려 차는 뒤꿈치 차기. 상대를 넘어뜨립니다.',

      'Ters tutuşla kesik, dönen kesik ve gölge adımı: kaybolup öne geçer, dürterek belirir.': '역수 베기, 회전 베기, 그림자 걸음. 사라졌다가 앞으로 빠져나가 찌르며 나타납니다.',
      'Sıçrayıp ters tutuşla aşağı saplar; yere serer.': '뛰어올라 역수로 아래를 찌릅니다. 상대를 넘어뜨립니다.',
      'Gölge gibi uzun atılma kesiği; seriye devam eder.': '그림자처럼 길게 돌진하며 벱니다. 연계로 이어집니다.',
      'Aldatma: kesecekmiş gibi parlar, dumanla geri kaçar. Erken savuşturmayı boşa çıkarır; hemen HAFİF ile gölge adımına, AĞIR ile Kage-nui’ye bağlanır.': '페인트: 벨 것처럼 번뜩이다가 연기 속으로 물러납니다. 이른 패링을 헛되게 만들고, 곧바로 약공격으로 그림자 걸음, 강공격으로 Kage-nui로 이어집니다.',
      'Fırlatıcı: ters tutuşla yükselen kesik.': '띄우기: 역수로 올려 베기.',
      'Ayağının dibine sis bombası atar: yakındakini sersemletir, Kage dumanın içinde geri kaçar.': '발밑에 연막탄을 던집니다. 가까운 상대를 기절시키고, Kage는 연기 속으로 물러납니다.',
      'Üç hızlı ters kesik ve aşağı saplama; sonuncusu yere serer.': '빠른 역수 베기 세 번과 아래 찌르기. 마지막 타격은 상대를 넘어뜨립니다.',
      'Tekmeden sonra dumanda kaybolur, rakibin arkasında belirip saplar.': '발차기 후 연기 속으로 사라졌다가 상대 뒤에 나타나 찌릅니다.',

      'Nodachi serisi': 'Nodachi 연계', 'Ağır nodachi': 'Nodachi 강공격', 'Kodachi serisi': 'Kodachi 연계', 'Ağır kesik': '강베기',
      'Tantō dansı': 'Tantō 춤', 'Çift kesik': '이중 베기', 'Naginata serisi': 'Naginata 연계', 'Ağır savuruş': '강하게 휘두르기',
      'Zincir ve orak': '사슬과 낫', 'Zincir çekişi': '사슬 당기기', 'Asa serisi': '봉 연계', 'Ağır süpürme': '강 후리기',
      'Yelpaze serisi': '부채 연계', 'Rüzgâr dalgası': '바람의 파동', 'Tantō serisi': 'Tantō 연계', 'Ok (basılı tut: güçlü)': '화살 (누르고 있기: 강한 사격)',
      'Geri + AĞIR da ok atar (basılı tut: güçlü atış); ok kalmadıysa tantō ile tepeden iner.': '뒤 + 강공격으로도 화살을 쏩니다 (누르고 있으면 강한 사격). 화살이 없으면 tantō로 위에서 내려찍습니다.',

      'KI İPTALİ!': '기 캔슬!', 'HAVAYA!': '띄우기!',
    });



    {
      const tb = (t, c) => `<i class="tb${c ? ' ' + c : ''}">${t}</i>`;
      merge(EN.STR, {
        kaeshi: {
          head: 'KAESHI-WAZA', strike: '쳐라!', hits: '히트',
          labels: {
            suriage: '상대 칼을 타고 올려 비스듬히 내려 베기',
            harai: '상대 칼을 쳐 내고 다리 베기',
            nuki: '공격을 흘리고 뒤에서 베기',
            uchiotoshi: '상대 칼을 쳐 내리고 꿰뚫기',
            sandan: '3연속 반격 베기',
          },
        },
        trial: {
          title: '콤보 도전',
          btn: { prev: '이전 콤보', next: '다음 콤보', retry: '처음부터', close: '닫기' },
          names: { chain: '기본 연계', s1: '연계 마무리', s2: '발차기 연계', launch: '띄우기', s3: '롱 콤보' },
          desc: {
            chain: '{L} 세 번. 앞 타격이 맞는 순간 다음을 누르세요. 연계는 이름 있는 피니시로 끝납니다.',
            s1: '{L} 두 번, 그다음 {H}: 강베기로 연계를 마무리합니다.',
            s2: '{L}, 발차기 {K}, 그다음 {H}.',
            launch: '{D} + {H}로 띄우고, 상대가 떠 있는 동안 {L}, 그다음 {H}.',
            s3: '{L} 두 번, {D} + {H}로 띄우기, {L}, {H}: 5히트.',
          },
          ready: (w) => `시작: ${w}`,
          startWith: (w) => `이 콤보는 ${w}부터 시작합니다.`,
          early: '너무 빠릅니다. 앞 타격이 맞는 순간 누르세요.',
          late: '너무 늦었습니다. 동작이 끝나기 전, 타격이 맞는 순간 누르세요.',
          wrong: (got, want) => `잘못된 버튼: ${got}. 이 단계는 ${want}입니다.`,
          dir: (want) => `방향이 빠졌습니다: ${want}. 방향을 누른 채 버튼을 누르세요.`,
          miss: '빗나감: 타격이 맞지 않았습니다. 허수아비에게 더 다가가세요.',
          clear: '콤보 성공!', clearPop: '콤보 성공!',
          all: '이 닌자의 콤보 도전을 모두 성공했습니다!',
        },
        coach: {
          combo: (l) => `${l} ${l} ${l} 빠르게: 3연타 콤보`,
          comboT: (l) => `${l} 세 번 연속 탭: 콤보`,
          counter: (l) => `가드나 패링 후 쳐라!가 뜨면 ${l}: 반격`,
          counterT: (l) => `가드나 패링 후 쳐라!가 뜨면 ${l} 탭`,
        },
      });
      const L = Array.isArray(EN.STR.lessons) && EN.STR.lessons.find((l) => l.id === 'counter');
      if (L) L.d = '가드나 패링 후 머리 위에 <b>쳐라!</b>가 뜹니다. 게이지가 다 닳기 전에 <kbd>F</kbd>를 누르세요. 앞/뒤 + <kbd>F</kbd>나 <kbd>G</kbd>는 다른 반격입니다.';
      if (EN.STR.lessonsTouch) EN.STR.lessonsTouch.counter = `가드나 패링 후 머리 위에 <b>쳐라!</b>가 뜹니다. 게이지가 다 닳기 전에 ${tb('공격', 'tb-light')}을 탭하세요. 스틱 앞/뒤 + ${tb('공격', 'tb-light')}이나 ${tb('강공격')}은 다른 반격입니다.`;
      merge(EN.PHRASES, {
        'KOMBO TAMAM!': '콤보 성공!',
        'Nasıl okunur': '보는 법',
        '→ rakibe doğru, ← rakipten uzağa demek: o yön tuşunu (A / D ya da ok tuşları; rakip sağındaysa D) basılı tut ve saldırı tuşuna bas. Virgül: tuşlara sırayla bas. F hafif, G ağır, R tekme, S gard.':
          '→는 상대 쪽, ←는 상대 반대쪽입니다. 그 방향키 (A / D 또는 화살표 키, 상대가 오른쪽이면 D)를 누른 채 공격 키를 누르세요. 쉼표는 키를 차례로 누르라는 뜻입니다. F 약공격, G 강공격, R 발차기, S 가드.',
        '▶ rakibe doğru, ◀ rakipten uzağa: yön çubuğunu o yana itip düğmeye dokun. Virgül: düğmelere sırayla dokun. Antrenmandaki Kombo denemesi her seriyi adım adım gösterir.':
          '▶는 상대 쪽, ◀는 상대 반대쪽입니다. 스틱을 그쪽으로 밀고 버튼을 탭하세요. 쉼표는 버튼을 차례로 탭하라는 뜻입니다. 훈련의 콤보 도전에서 모든 연계를 단계별로 보여 줍니다.',
        'Gard ya da savuşturmanın ardından ekranda VUR! çıkar: altındaki çubuk bitmeden HAFİF’e bas. Yalnız HAFİF: Suriage. İleri + HAFİF: Harai (yere serer). Geri + HAFİF: Nuki (arkaya geçer). AĞIR: Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.':
          '가드나 패링 후 쳐라!가 뜹니다. 게이지가 다 닳기 전에 약공격을 누르세요. 약공격만: Suriage. 앞 + 약공격: Harai (넘어뜨림). 뒤 + 약공격: Nuki (뒤로 빠져나감). 강공격: Uchiotoshi. 내 세 번째 반격은 피니시이며, 패링당하면 랠리가 이어집니다.',
      });
    }



    merge(EN.STR, {
      gfx: {
        title: '그래픽',
        levels: { auto: '자동', high: '높음', medium: '중간', low: '낮음', custom: '사용자 지정' },
        note: {
          auto: '기기에 맞춰 고르고, 전투가 끊기면 스스로 낮춥니다.',
          high: '모든 조명과 효과. 고성능 기기용.',
          medium: '은은한 빛 번짐, 그림자 없음. 대부분의 휴대폰용.',
          low: '가장 부드러움. 오래된 휴대폰용.',
          custom: '내 설정 (고급).',
        },
        now: (lv) => `현재: ${lv}`,


        adv: {
          title: '고급',
          note: '하나를 바꾸면 "사용자 지정"이 됩니다. 프리셋을 누르면 그 값으로 돌아갑니다.',
          hot: '발열 최대',
          knob: { scale: '해상도', msaa: '안티에일리어싱', bloom: '빛 번짐', shadows: '그림자 & 반사', effects: '날씨 & 파티클' },
          val: { off: '끔', low: '낮음', mid: '중간', full: '최대', simple: '단순' },
        },
      },
    });



    merge(EN.STR, {
      fps: {
        title: '프레임 레이트',
        show: 'FPS 표시',
        levels: { max: '최대' },
        note: {
          60: '안정적이고 발열이 적습니다. 대부분의 휴대폰에 최적.',
          90: '지원되는 화면에서 더 부드럽습니다. 배터리를 더 씁니다.',
          120: '120 Hz 화면에서 가장 부드럽습니다. 배터리를 더 씁니다.',
          max: '화면이 허용하는 최대 속도.',
        },
      },
    });


    merge(EN.STR, {
      set: {
        title: '설정', close: '닫기',
        tabs: { audio: '오디오', controls: '조작', gfx: '그래픽', lang: '언어' },
        touch: '터치', keys: '키보드', pad: '게임패드',
        touchNote: '화면을 터치하면 여기에 터치 조작 설정이 나타납니다.',
      },
    });



    merge(EN.STR, { lang: { title: '언어', change: '언어 변경', close: '닫기' } });




    merge(EN.STR, {
      thelp: {
        title: { float: '조이스틱', fixed: '고정 조이스틱', dpad: '방향 패드' },
        float: { walk: '화면의 빈 쪽에 엄지를 대고 밀기: 걷기', jump: '위로 밀기: 점프', guard: '아래로 당기기: 가드', dash: '옆으로 두 번 튕기기: 대시' },
        fixed: { walk: '스틱 가운데를 잡고 옆으로 밀기: 걷기', jump: '위로 밀기: 점프', guard: '아래로 당기기: 가드', dash: '옆으로 두 번 튕기기: 대시' },
        dpad: {
          walk: '누르고 있기: 걷기', step: '짧게 탭: 한 걸음', jump: '탭: 점프', guard: '누르고 있기: 가드',
          dash: '두 번 탭: 대시', both: '두 버튼 사이를 누르면 둘 다 (▶ + ▲ = 앞으로 점프)',
        },
        edit: (b) => `${b}: 버튼을 원하는 곳으로 끌어다 놓고 크기와 투명도를 정하세요. 설정 → 조작에 있습니다.`,
      },
    });


    merge(EN.PHRASES, { 'Shuriken': '수리검', 'KI': '기' });


    merge(EN.STR, { menu: { arcadeDesc: '닌자마다 8번의 대전으로 이루어진 여정. 다음 라이벌부터 이어서 하고, 캐릭터 엔딩과 고수의 인장을 얻으세요.' }, sel: { title: { arcade: '아케이드 · 캐릭터 여정' } },
      journey: {
        start: '여정 시작',
        resume: (i, n) => '계속 · ' + i + '/' + n + '',
        ending: '엔딩 보기',
        replay: '여정 다시 하기',
        badge: '고수의 인장',
        completed: '여정 완료',
        progress: (i, n) => '' + i + '/' + n + ' 대전 완료 · 진행 저장됨',
        reward: '보상: 캐릭터 엔딩과 영구 고수의 인장',
        saved: '승리할 때마다 저장됩니다. 대전을 나가면 재도전으로 처리됩니다.',
        menu: (done, active) => '여정 ' + done + '개 완료 · ' + active + '개 진행 중',
        clearReward: '고수의 인장 획득 · 캐릭터 엔딩 해금'
      }
    });



    merge(EN.STR, {
      set: { tabs: { save: '진행 상황' } },
      acct: {
        title: '진행 상황 지키기',
        cgOn: (n) => `CrazyGames 계정: ${n}. 칭호, 챔피언 색상, Dan, 점수가 계정에 저장됩니다.`,
        cgWait: (n) => `CrazyGames 계정: ${n}. 계정에 연결하는 중…`,
        cgFail: (n) => `CrazyGames 계정: ${n}. 지금은 계정에 연결할 수 없어 새 점수는 당분간 이 기기에 저장됩니다.`,
        cgSave: 'CrazyGames 계정에 진행 상황 저장',
        cgSaveNote: '로그인하면 칭호, 챔피언 색상, 점수가 계정으로 옮겨져 모든 기기에서 이어집니다.',
        rcTitle: '복구 코드',
        rcNote: '이 코드를 적어 두세요. 새 기기에서 여기에 입력하면 칭호, 챔피언 색상, Dan, 점수를 되찾을 수 있습니다.',
        rcShow: '코드 보기', rcNew: '새 코드', rcNewDone: '새 코드가 준비되었습니다. 이전 코드는 더 이상 쓸 수 없습니다.',
        rcNeedName: '복구 코드를 받으려면 먼저 닉네임으로 점수를 저장하세요.',
        rcEnter: '복구 코드 입력', rcGo: '복구',
        rcDone: (n, c) => `돌아오신 걸 환영합니다, ${n}! 진행 상황이 복구되었습니다. 새 복구 코드: ${c}`,
        err: { bad_code: '알 수 없는 코드입니다. 문자를 확인하세요.', rate: '시도가 너무 많습니다. 나중에 다시 시도하세요.', offline: '서버에 연결할 수 없습니다. 연결 상태를 확인하세요.', banned: '이 계정은 사용할 수 없습니다.', error: '문제가 발생했습니다. 다시 시도하세요.' },
        local: '여기서는 온라인 저장을 쓸 수 없어 진행 상황은 이 기기에 저장됩니다.',
        offline: '지금은 오프라인이라 진행 상황은 이 기기에 저장됩니다.',
        loading: '불러오는 중…',
      },
      lb: { savedLocalAccount: (r) => (r ? `이 기기 ${r}위 · 지금은 계정에 연결할 수 없습니다` : '이 기기에 저장됨 · 지금은 계정에 연결할 수 없습니다') },
    });



    merge(EN.STR, {
      priv: {
        notice: 'Shadow Duel은 온라인 순위표를 위해 닉네임과 점수를 저장합니다.',
        policy: '개인정보 처리방침', terms: '이용약관', both: '개인정보 처리방침 및 이용약관',
        ok: '확인', label: '개인정보 안내',
      },
    });



    merge(EN.STR, {
      menu: { trainDrill: '패링 연습' },
      tutor: {
        defend: '방어!', attack: '공격!', again: '한 번 더!',
        pass: {
          freeze: (l, g) => `시간 정지: ${g} 방어, ${l} 반격`,
          slow: (l, g) => `슬로 모션: 고리가 좁혀질 때 ${g}, 그다음 ${l}`,
          real: (l, g) => `실제 속도: ${g} 방어, ${l} 반격, 두 번`,
        },
        fail: {
          early: '너무 빠릅니다! 칼이 닿기 직전에 가드하세요.',
          late: '너무 늦었습니다! 칼이 닿기 직전에 가드하세요.',
          slow: '너무 늦었습니다! 공격!이 떠 있는 동안 반격하세요.',
          atk: '먼저 막고, 그다음 공격!',
          miss: '다시 해 봅시다.',
        },
        mastered: '마스터!', masteredSub: '막고, 반격하고, 반복',
        warm: (l) => `준비 운동: ${l} 세 번 치기`,
        nudge: (k) => `${k} 누르기`, nudgeT: (k) => `${k} 탭`,


        skip: '건너뛰기 ›',
        steps: {
          attack: (b) => `${b} 공격`, guard: (b) => `${b} 칼날 막기`, counter: (b) => `${b} 반격`,
          timing: (b, l) => `당신 차례: 고리가 좁혀질 때 ${b}, 그다음 ${l}`,
        },
        ok: { attack: '좋아요!', guard: '받아쳤다!', counter: '반격!', timing: '완벽!' },
        ready: '준비 완료!', readySub: '이제 결투에서 이기세요',
      },
    });




    merge(EN.STR, {
      onb: { selIntro: '닌자를 고르세요. 닌자마다 고유한 여정이 있습니다', more: '자세히' },
      tips: {
        head: '팁',
        ki: (k) => `기 가득! ${k}: 필살기`,
        gbreak: (k, h) => `상대가 계속 가드합니다. ${k} 발차기나 ${h} 강베기로 노란 게이지를 채워 가드를 무너뜨리세요`,
        gbreakH: (h) => `상대가 계속 가드합니다. ${h} 강베기로 노란 게이지를 채워 가드를 무너뜨리세요`,
        posture: (g) => `자세 게이지가 차고 있습니다. 물러나거나 ${g}: 패링`,
        dash: (a) => `${a} 두 번 누르기: 대시`,
        shuriken: (t) => `${t}: 수리검 던지기`,
        heavy: (h) => `${h}: 강베기, 느리지만 강력함`,
        lessons: (a, b) => `전체 레슨: ${a} → ${b}`,
        controls: (a, b) => `${a} → ${b}에서 버튼을 옮기고 크기를 바꿀 수 있습니다`,
      },
    });


    merge(EN.STR, {
      online: {
        title: '친구와 대전',
        menuSub: '온라인 결투 · 링크나 6자리 코드 공유',
        homeSub: '방을 만들어 친구에게 링크를 보내거나, 친구가 보낸 코드를 입력하세요.',
        create: '방 만들기',
        join: '참가',
        codePh: '코드',
        haveCode: '방 코드',
        room: '방',
        linkLabel: '초대 링크',
        back: '뒤로',
        leave: '방 나가기',
        copy: '링크 복사',
        copied: '복사됨',
        share: '공유',
        invite: '친구 초대',
        shareText: (c) => `Shadow Duel에서 나와 결투하자! 방 ${c}`,
        inviteNote: '링크를 보내거나 친구에게 코드를 알려 주세요.',
        waitFriend: '친구의 참가를 기다리는 중…',
        joining: '방을 찾는 중…',
        connecting: '친구와 연결하는 중…',
        connected: '연결됨',
        you: '나',
        friend: '친구',
        friendTag: '친구',
        waitPick: '선택 중…',
        pickTitle: '내 캐릭터',
        arenaTitle: '아레나',
        arenaHost: '친구가 아레나를 고릅니다',
        ready: '준비',
        notReady: '준비 안 됨',
        readyWait: '친구의 준비를 기다리는 중…',
        bothReady: '시작합니다…',
        ping: (ms) => `핑 ${ms} ms`,
        badCode: '방 코드는 6자리입니다.',
        noRoom: '이 코드의 방이 없습니다. 친구와 코드를 확인하세요.',
        full: '방이 가득 찼습니다.',
        expired: '10분 동안 아무도 참가하지 않아 방이 닫혔습니다.',
        noDirect: '친구의 네트워크에 직접 연결하지 못했습니다. 다른 네트워크(Wi-Fi / 모바일 데이터)로 시도하세요.',
        retry: '다시 시도',
        noConnect: '친구와 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도하세요.',
        version: '친구와 게임 버전이 다릅니다. 두 사람 모두 페이지를 새로고침하세요.',
        signalDown: '게임 서버에 연결할 수 없습니다. 인터넷 연결을 확인하세요.',
        friendLeft: '친구가 방을 나갔습니다.',
        waitIn: (s) => `친구를 기다리는 중… ${s}`,
        away: (s) => `친구가 게임 화면을 벗어났습니다… ${s}`,
        leaveQ: '매치를 나갈까요?',
        leaveSub: '이번 판은 친구의 승리가 됩니다.',
        stay: '계속하기',
        leaveMatch: '나가기',
        win: '승리',
        lose: '패배',
        draw: '무승부',
        over: '매치 종료',
        whyDrop: '친구의 연결이 끊겼습니다. 승리입니다 (기록되지 않음).',
        whyLeft: '친구가 매치를 나갔습니다.',
        whyAway: '자리를 비운 사이 매치가 끝났습니다.',
        whyDesync: '매치 동기화가 어긋나 (연결 문제) 집계되지 않습니다.',
        rematch: '재대결',
        rematchWait: '친구를 기다리는 중…',
        rematchAsk: '재대결 (친구가 원합니다)',
        change: '캐릭터 변경',
        rounds: (a, b) => `라운드 ${a} – ${b}`,
        turning: (s) => `친구가 휴대폰을 돌리는 중… ${s}`,
        paused: '일시정지',
        whyPauseWin: '친구가 제시간에 돌아오지 않았습니다. 승리입니다 (기록되지 않음).',
        whyPauseLose: '제시간에 돌아오지 않아 매치가 끝났습니다.',
        whyPauseBoth: '두 사람 모두 제시간에 돌아오지 않아 매치가 끝났습니다.',
      },
    });


    merge(EN.STR, {
      ranked: {
        title: '랭크전', menuSub: '무작위 상대 · 점수, 티어, 시즌', offline: '지금은 랭크전을 이용할 수 없습니다',
        season: (n) => `시즌 ${n}`, endsIn: (d) => `${d}일 후 종료`, endsToday: '오늘 종료',
        rating: '레이팅', record: (w, l, d) => `${w}승 · ${l}패` + (d ? ` · ${d}무` : ''), placement: (a, b) => `배치고사 ${a}/${b}`,
        place: (n) => `랭킹 ${n}위`, find: '상대 찾기', findUnranked: '상대 찾기 (일반전)', board: '순위표', how: '진행 방식',
        howLines: ['서버가 레이팅이 비슷한 상대를 찾습니다. 기다릴수록 범위가 넓어집니다.', '둘 다 수락하면 상대의 선택을 모르는 채로 캐릭터를 고릅니다 (해금한 캐릭터만).',
          '3라운드 중 2라운드를 먼저 따면 승리합니다. 매치를 나가면 패배입니다.', '두 기기가 같은 결과를 보고해야 점수가 바뀝니다. 시즌은 4주이며, 1위는 특별 코스튬을 받습니다.'],
        reward: '시즌 1위: 특별 코스튬과 챔피언의 전당에 이름 등재',
        signIn: '로그인하면 점수를 얻습니다', guestNote: '게스트는 일반전으로 플레이합니다.', nickNote: '랭크전을 하려면 닉네임을 정하세요.',
        back: '뒤로', you: '나', titleLbl: '칭호', noTitle: '없음',
        searching: '상대를 찾는 중…', window: (n) => `레이팅 범위 ±${n}`, windowAny: '모든 레이팅',
        warm: '기다리는 동안 CPU와 몸풀기', warmTag: '몸풀기 · CPU · 일반전', searchShort: '검색 중', warmBack: '검색으로 돌아가기', cancel: '취소',
        none: '지금은 상대가 없습니다.', foundTitle: '상대를 찾았습니다!', accept: '수락', decline: '거절',
        ranked: '랭크전', unranked: '일반전 · 점수 없음',
        why: { guest: '게스트 플레이어가 있음', same_network: '같은 네트워크에 있음', pair_limit: '오늘 이 상대와 랭크전을 3판 했음', daily_limit: '하루 랭크전 한도 도달' },
        waitOpp: '상대의 수락을 기다리는 중…', touch: '터치', keys: '키보드 / 패드', placementTag: '배치고사', guestTag: '게스트',
        declined: '상대가 수락하지 않았습니다 · 다시 찾는 중', youDeclined: '매치를 거절했습니다.', penalty: (s) => `최근 매치를 거절해서 ${s}초 후에 다시 찾을 수 있습니다.`,
        suspended: '랭크전 계정이 검토 중입니다 (이의 제기가 너무 많음). 다른 모드는 이용할 수 있습니다.',
        pickTitle: '캐릭터 선택', pickSub: '상대는 내 선택을 볼 수 없습니다', lock: '확정', lockedIn: '확정됨', oppPicking: '상대가 고르는 중…', oppLocked: '상대 확정',
        lockedFighter: '1인 모드에서 아직 해금하지 않음', costume: '코스튬', plain: '기본 색상',
        connecting: '상대와 연결하는 중…', noConnect: '상대와 연결하지 못해 이 매치는 집계되지 않습니다. 다시 찾는 중…',
        leaveQ: '매치를 나갈까요?', leaveSub: '이 랭크전은 패배 처리됩니다.', stay: '계속하기', leave: '나가기',
        waitIn: (s) => `상대를 기다리는 중… ${s}`, away: (s) => `상대가 게임 화면을 벗어났습니다… ${s}`, turning: (s) => `상대가 휴대폰을 돌리는 중… ${s}`, paused: '일시정지',
        confirming: '결과 확인 중…', win: '승리', lose: '패배', draw: '무승부', over: '매치 종료',
        delta: (d) => (d >= 0 ? '+' : '−') + Math.abs(d) + '점', nc: '이 매치는 집계되지 않습니다', disputed: '두 기기의 결과가 달라 매치를 검토 중입니다. 점수는 바뀌지 않았습니다.',
        ncWhy: { desync: '두 기기가 전투를 다르게 계산함 (연결 문제)', connection: '두 플레이어의 연결이 모두 끊김', input_mismatch: '두 기기의 입력 기록이 일치하지 않음', abandoned: '두 플레이어 모두 나감', no_second_report: '상대의 결과가 도착하지 않음', mixed: '결과가 일치하지 않음' },
        promoted: '승급!', demoted: '티어 강등', placementDone: '배치고사 완료!', pending: '결과가 곧 순위표에 반영됩니다.',
        findAgain: '다시 찾기', rematch: '재대결', rematchWait: '상대를 기다리는 중…', rematchAsk: '재대결 (상대가 원합니다)', menu: '메뉴',
        youLeft: '매치를 나갔습니다: 패배.', oppLeft: '상대가 매치를 나갔습니다: 승리.', silent: '상대의 연결이 끊겼습니다.', rounds: (a, b) => `라운드 ${a} – ${b}`,
        unrankedNote: '일반전',
        ghostFound: '실제 플레이어의 그림자가 등장했습니다',
        ghostHouseName: (n) => `도장 그림자 · ${n}`, ghostHouseFound: '도장 그림자가 등장했습니다', ghostHouseNote: '도장의 전형적인 스타일로 싸우는 CPU입니다. 실시간 플레이어가 아닙니다.', ghostName: (n) => `${n}의 그림자`, ghostTag: '그림자',
        ghostNote: '이 실제 플레이어의 스타일로 싸우는 CPU입니다. 실시간 플레이어가 아닙니다.',
        ghostReady: '그림자가 준비되었습니다',
        ghostLeft: '그림자 매치를 나갔습니다: 패배.', aiTag: 'AI',
        hallTab: '랭크전', hallDesc: (g) => `이번 시즌 최강자 · 순위표에 오르려면 랭크전 ${g}판`, champs: '챔피언', champOf: (n) => `시즌 ${n} 챔피언`,
        noChamps: '아직 시즌 챔피언이 없습니다.', me: (p) => `내 순위: ${p}위.`, meNone: '랭크전을 플레이하면 순위표에 오릅니다.', empty: '이번 시즌 순위표에 아직 아무도 없습니다.',
        tierDesc: ['보병', '떠돌이 무사', '사무라이', '깃발 호위대', '영주', '쇼군'],
        rulesBtn: '랭크전 안내', rulesTitle: '랭크전 안내', rulesSub: '티어, 점수, 시즌', rTiers: '티어', rYou: '나',
        rNext: (n, name) => `${name}까지 ${n}점`, rTop: '최고 티어입니다', rPlacing: (a, b) => `배치고사 ${a}/${b}: 끝나면 티어가 표시됩니다`,
        rPlacement: '배치고사', rPlaceLine: (a, b) => `첫 랭크전 ${a}판이 배치고사입니다 (다음 시즌부터는 ${b}판). 그 뒤에 티어가 표시됩니다.`,
        rPoints: '점수', rPointsLines: ['이기면 점수가 오르고 지면 내려갑니다. 무승부는 조금만 움직입니다.', '더 강한 상대를 이기면 더 많이 얻고, 더 약한 상대에게 지면 더 많이 잃습니다.', '매치를 나가면 패배로 처리됩니다.'],
        rSeason: '시즌', rSeasonLine: (d, left) => `시즌은 ${d}일 동안 진행됩니다 · ${left}.`,
        rSeasonEnd: (p) => `시즌이 끝나면 레이팅이 1500 쪽으로 절반만큼 돌아가고, 배치고사 ${p}판을 다시 치릅니다. 최고 티어는 배지로 남습니다.`,
        rReward: (list, n) => `시즌 1위 보상: ${list} (순위표에 ${n}명 이상일 때).`, rCostumeAll: (x) => `${x} (모든 캐릭터용)`, rRewardAny: '특별 코스튬과 칭호',
        rBoard: '순위표', rBoardLine: (g) => `오르는 조건: 이번 시즌 랭크전 ${g}판, 배치고사 완료.`,
        rFighters: '캐릭터', rFightersLine: '1인 모드에서 해금한 캐릭터를 고를 수 있습니다.',
        aiNote: '접속한 플레이어가 적을 때는 실제 플레이어의 스타일로 싸우는 AI 상대와 매칭될 수 있습니다.', gotIt: '확인',
        err: { network: '서버에 연결할 수 없습니다. 인터넷 연결을 확인하세요.', bad_version: '게임의 새 버전이 나왔습니다. 페이지를 새로고침하세요.', busy: '대기열이 꽉 찼습니다. 잠시 후 다시 시도하세요.',
          rate_limited: '시도가 너무 많습니다. 잠시 기다리세요.', disabled: '지금은 랭크전을 이용할 수 없습니다.', banned: '이 계정은 랭크전을 할 수 없습니다.', other: '문제가 발생했습니다. 다시 시도하세요.' },

        bg: { ru: '찾는 동안 메뉴 보기', stopT: '랭크 매칭을 멈출까요?', stopS: '이 경기를 시작하면 매칭이 끝납니다.', stopGo: '멈추고 플레이', keep: '계속 찾기', stopped: '랭크 매칭을 멈췄어요', chip: '찾는 중' },
        card: { findMatch: '매치 찾기', searching: '찾는 중…', resume: '경기로 돌아가기',
          place: (p, n) => `${n}명 중 ${p}위`, placeOnly: (p) => `순위 ${p}위`,
          toBoard: (n) => `리더보드 진입까지 ${n}경기`, toBoardSoon: '리더보드 진입까지 몇 경기 더',
          invite: '아시가루에서 쇼군까지: 첫 랭크 경기는 탭 한 번이면 시작',
          guestInvite: '로그인하면 점수를 걸고 플레이 · 게스트는 점수 없음', nickInvite: '점수를 걸고 하려면 닉네임을 정하세요',
          winRate: (p) => `승률 ${p}%`, streakW: (n) => `${n}연승 중`, streakL: (n) => `${n}연패 중`,
          peak: (t) => `이번 시즌 최고: ${t}`, shields: (n) => `방패 ×${n}`, top: '시즌 TOP 3', you: '나', empty: '아직 아무도 없어요: 첫 주인공이 되세요', rating: '점' },
      },

      upd: { ready: '새 버전 준비 완료 — 탭하여 업데이트', refresh: '새 버전이 나왔어요 — 페이지를 새로고침하세요', close: '닫기' },
    });



    merge(EN.STR, {
      pass: {
        k: '影', lv: 'LV',
        level: (n) => `레벨 ${n}`,
        xp: (a, b) => `${a} / ${b} XP`, xpMax: (n) => `총 ${n} XP`, plus: (n) => `+${n} XP`,
        name: '그림자 패스', season: (n) => `시즌 ${n}`, left: (d) => `${d}일 남음`, lastDay: '마지막 날',
        tier: (t, n) => `단계 ${t}/${n}`, ready: (n) => `받을 보상 ${n}개`,
        free: '무료', bonus: '그림자', bonusAds: '보상마다 광고 1회', bonusWait: (n) => `광고 없이: ${n}단계 뒤에 열림`,
        claim: '받기', claimAll: (n) => `모두 받기 (${n})`, owned: '받음', watch: '광고 보기', milestone: '무료', opensAt: (t) => `${t}단계에서`,
        online: '온라인 필요', soon: '새 단계 곧 추가', soonXp: 'XP는 계속 쌓입니다', close: '닫기', tabs: { pass: '패스', profile: '프로필' },
        rows: { win: '승리', loss: '참가', rounds: '라운드', perfect: '퍼펙트', rally: '랠리', counter: '반격', parry: '패링', short: '빠른 승부', boost: '부스터', daily: '오늘의 첫 승리', streak: '연속 플레이', clear: '여정', trial: '콤보 도전', tutorial: '튜토리얼', first: '환영 보너스' },
        streakN: (n) => `${n}일째`,
        up: '레벨 업', got: '새 보상',
        boostName: (n) => `XP ×1.5 · ${n}판`, honorName: (n) => `명예 +${n}`,
        gotDup: (n) => `이미 보유: 대신 ${n}판 동안 XP ×1.5`, boostLeft: (n) => `XP ×1.5 · ${n}판 남음`,
        kinds: { cos: '코스튬', title: '칭호', badge: '배지', frame: '프레임', trail: '칼날 궤적', boost: 'XP 부스터', honor: '명예' },
        use: '장착', inUse: '장착 중', none: '아직 없음', wearHint: '코스튬은 캐릭터 선택 화면의 색상 줄에서 입을 수 있습니다.',
        heads: { titles: '칭호', badges: '배지', frames: '프레임', trails: '칼날 궤적', costumes: '코스튬', seals: '여정 인장' },
        total: (n) => `총 ${n} XP`, streak: (n) => `${n}일 연속`,
        daily: '오늘의 첫 승리: +100 XP', dailyDone: '오늘의 첫 승리: 완료',
        seal: { 1: '여정 클리어', 2: 'Menkyo: 여정 2회 클리어', 3: 'Kaiden: 여정 3회 클리어' },
        clears: (n) => `여정 ${n}회 클리어`,
        next2: '여정 2회째 클리어: Menkyo 코스튬과 칭호', next3: '3회째 클리어: Kaiden 그림자와 칭호',
        rank: { 2: 'Menkyo', 3: 'Kaiden' }, cos2: (n) => `${n} · Menkyo 색상`, cos3: (n) => `${n} · Kaiden 그림자`,
        themes: { sakura: '벚꽃', ember: '불씨', frost: '서리', jade: '비취', ash: '잿빛', moon: '달빛', lotus: '연꽃', storm: '폭풍', yami: 'Yami' },
        items: {
          trail_sakura: '벚꽃 궤적', trail_ember: '불씨 궤적', trail_frost: '서리 궤적', trail_jade: '비취 궤적', trail_violet: '보랏빛 궤적', trail_gold: '황금 궤적',
          title_novice: '풋내기 검객', title_wanderer: '방랑자', title_duelist: '결투가', title_parry: '강철의 벽', title_ronin: 'Ronin', title_nightblade: '밤의 칼날', title_s1: '시즌 1의 그림자',
          badge_blade: '칼날 배지', badge_moon: '달 배지', badge_fire: '불꽃 배지', badge_snow: '눈 배지', badge_sakura: '벚꽃 배지', badge_dragon: '용 배지', badge_kage: '그림자 배지',
          frame_bronze: '청동 프레임', frame_silver: '은빛 프레임', frame_crimson: '진홍 프레임', frame_jade: '비취 프레임', frame_gold: '황금 프레임',
        },
      },
    });



    merge(EN.STR, {
      pass: {
        kinds2: { pose: '승리 포즈', hitfx: '타격 효과', slash: '반격 베기', aura: '기 오라', ko: 'KO 피니시', card: '이름 카드', arena: '경기장 변형', music: '메뉴 음악', rkey: '열쇠', akey: '열쇠', ticket: '티켓', shield: '방패' },
        items2: { key_rival: '도전 열쇠', key_arena: '경기장 열쇠', ticket_trial: '체험 티켓', shield: '랭크 방패' },
        heads2: { title: '칭호', flair: '전투 장식', arenas: '경기장 변형', music: '메뉴 음악', items: '아이템' },
        profile: '프로필',
        profileSub: '칭호 · 코스튬 · 장식',
        passTab: '그림자 패스',
        tapEquip: '탭해서 장착',
        plain: '기본',
        usual: '평소대로',
        noneYet: '그림자 패스에서 획득',
        shields: (n, m) => `랭크 방패 ${n}/${m}`,
        shieldHelp: '랭크전에서 져도 점수가 깎이지 않는다. 하루 1회, 자동 발동.',
        tickets: (n) => `체험 티켓: ${n}`,
        ticketHelp: '잠긴 닌자를 CPU전 3판 동안 체험한다. 캐릭터 선택에서 그 닌자를 탭하자.',
        useTicket: (n) => `체험 티켓 · ${n}판`,
        useTicketSub: (n) => `보유 ${n}장`,
        ticketLeft: (n) => `체험: ${n}판 남음`,
        keyRival: (name) => `도전 해금: ${name}`,
        keyArena: (name) => `경기장 해금: ${name}`,
        keyHonor: (n) => `더 열 것이 없다: 명예 +${n}`,
        shieldGot: (n, m) => `랭크 방패: ${n}/${m}`,
        shieldFull: (n) => `방패가 가득 찼다: 대신 명예 +${n}`,
        shieldOff: (n) => `여기엔 랭크전이 없다: 대신 명예 +${n}`,
        shieldUsed: '방패 발동: 점수 유지',
        rankedHonor: (n) => `명예 +${n}`,
        variant: '변형',

        newTag: '신규', newN: (n) => `새 항목 ${n}개`, headUnlocks: '닌자와 경기장', headRewards: '랭크 보상',
        flair: { pose_tenchi: '하늘을 향해', pose_rei: '예의 인사', pose_hiza: '무릎 꿇은 잔심', pose_katsugi: '어깨에 걸친 칼', pose_kissaki: '다음은 너다', hitfx_kinpaku: '금박 타격', hitfx_aizome: '쪽빛 먹', hitfx_sakura: '벚꽃 폭발', hitfx_kitsunebi: '여우불', hitfx_raijin: '라이진의 불꽃', slash_kin: '황금 칼날', slash_sumi: '수묵 붓', slash_hana: '꽃잎 바람', slash_rai: '천둥 베기', aura_kitsunebi: '여우불 오라', aura_raiun: '폭풍 오라', aura_hana: '꽃 오라', aura_gekko: '달빛 오라', ko_enso: '원상 피니시', ko_hanafubuki: '꽃보라', ko_raiko: '낙뢰', ko_mikazuki: '초승달', card_seigaiha: '세이가이하 물결', card_yozakura: '밤 벚꽃', card_ryu: '용의 옻칠', card_tsukiyo: '달빛 소나무', card_asanoha: '아사노하 금빛', arena_temple_snow: '눈 내리는 사원', arena_rain_moon: '달빛 대나무숲', arena_snow_night: '밤의 설산', arena_market_rain: '비 내리는 야시장', music_haru: '봄의 정원', music_yuki: '눈의 달', music_matsuri: '축제의 밤', pass1_akane: '월영 의상' },
      },
    });

    void dec; void fmtTime; void num;
  };



  (ND.JOURNEY_COPY || (ND.JOURNEY_COPY = {}))['ko'] = {
    ui: ['캐릭터 여정', '최종 라이벌', '선택 숙련 과제', '이 대전에서 이겨야 별을 지킵니다.', '숙련의 별 획득', '별 미획득 · 다시 플레이할 때 도전하세요', '숙련의 별', '별 8개 중 6개를 모아 여정을 마치면 칭호와 유산 색상을 얻습니다. 별은 다시 플레이해도 유지됩니다.', '기본 색상', '유산 색상', '외형', '숙련의 별 6개를 모으고 이 캐릭터의 여정을 마치세요.', '이전 여정과 보상은 그대로 남아 있습니다. 다시 플레이해 새 경로를 탐험하세요.', 'Shura 도전: 서로 다른 캐릭터 3명의 여정을 완료하세요.', '이 결투에서 이기면 해금', '여정 완료', '챕터'],
    goals: ['패링', '반격 적중', '강공격 적중', '발차기 적중', '공중 공격 적중', '대시 공격 적중', '콤보 3타 적중', '투사체 적중', '필살기 적중', '가드 붕괴'],
    titles: ['붉은 맹세', '자유로운 바람', '산의 심장', '겨울 발자국', '달빛 꽃', '꺾이지 않는 깃발', '가면 벗은 용기', '고요한 약속', '사슬 풀린 호랑이', '열린 손', '잔잔한 바람', '먼 지평선', '두 번째 새벽'],
    endings: ['Akane는 Ren 앞에서 칼을 내린다. 그녀의 도장은 복수가 아닌 가르침으로 다시 세워질 것이다.', 'Aoi는 Akane와의 오랜 결투를 끝내고, 자신의 길을 고를 수 있는 대등한 자로서 사원을 떠난다.', 'Kuro와 Tetsu는 무기를 내려놓는다. 산길이 다시 마을 사람들에게 열린다.', 'Yuki는 Hana가 내민 손을 잡는다. 처음으로 누군가의 곁에 발자국을 남긴다.', 'Hana는 Yuki를 등불 축제로 데려간다. 그녀의 마지막 춤에는 친구를 위한 자리가 있다.', 'Tetsu는 Kuro의 존중을 얻고 고갯길에 깃발을 꽂는다. 이제 어떤 마을 사람도 발길을 돌리지 않을 것이다.', 'Ren은 Kage의 속임수를 꿰뚫고 스스로 가면을 벗는다. 이제 두려움 없이도 그의 목소리는 닿는다.', 'Kage는 Ren에게 얼굴을 보여 주고 사라진다. 이번에는 그의 약속이 그림자보다 오래 남는다.', 'Tora는 Jin의 봉 옆에 사슬을 내려놓는다. 강 나루는 어떤 주인의 것도 아니다.', 'Jin은 Tora의 목숨을 빼앗지 않고 그를 멈춘다. 폭포에서 새 제자가 첫 가르침을 청한다.', 'Mai는 Tsubame의 마지막 화살을 부채로 받아 낸다. 둘의 승부는 원한이 아닌 인사로 끝난다.', 'Tsubame는 마침내 Mai의 바람을 읽는다. 마지막 화살을 쏘지 않은 채 새로운 지평선을 향해 돌아선다.', 'Shura는 왕관 없이 Akane와 마주한다. 더는 패배가 그를 규정하지 않는다. 다음 가르침은 새벽에 시작된다.'],
  };

  if (ND.i18n && ND.i18n.loaded) ND.i18n.loaded('ko');
})(window.ND = window.ND || {});
