// Shadow Duel — Traditional Chinese (Taiwan; also Hong Kong and Macau) catalog for ND.i18n, translated from the English one (js/i18n-en.js).
// Loaded on demand: js/i18n.js loads this file only when the game runs in this language. Same structure as i18n-en.js.
// Taiwan vocabulary, Traditional characters only, full-width punctuation (，。！？：（）「」), informal 你.
// Glossary: guard = 防禦 · parry = 格擋 · counter = 反擊 · rally = 反擊連鎖 · posture = 架勢 (posture break = 架勢崩潰,
//   guard break = 破防) · ki = 氣 (button 氣, ki bar = 氣量條) · ki technique = 奧義 · ki cancel = 氣取消 ·
//   blade lock = 拼刀 · dash = 衝刺 · combo = 連招 · string / chain = 連擊 · string ender / finisher = 收尾 / 終結技 ·
//   light / heavy slash = 輕斬 / 重斬 (buttons 攻擊 / 重擊) · kick = 踢擊 · launcher = 挑空 · knockdown = 擊倒 ·
//   shuriken = 手裏劍 · dummy = 木樁 · arcade = 街機模式 · training = 訓練 · tutorial = 教學 · ranked = 排位賽 ·
//   journey = 角色旅程 · mastery star = 精通之星 · honor = 榮譽 · Rival Challenge = 宿敵挑戰 · Hall of Champions = 冠軍殿堂 ·
//   Monthly Tournament = 每月錦標賽 · Dan Trial = 段位考驗 · shadow (ghost opponent) = 幻影 · season = 賽季 ·
//   rating = 積分 · tier = 階級 · placement = 定級賽 · round = 回合 · leaderboard = 排行榜 · nickname = 暱稱 · CPU = 電腦 (HUD: CPU)
//   Shadow Pass = 影之通行證 (bonus track 暗影) · pass tier = 階 (第 N 階) · level = 等級 (tag Lv) · costume = 服裝 · title = 稱號 ·
//   badge = 徽章 · frame = 外框 · blade trail = 刀光 · booster = 加成 · claim = 領取 · journey seal = 旅程印記
(function (ND) {
  'use strict';
  (ND.I18N_CATALOGS || (ND.I18N_CATALOGS = {}))['zh-TW'] = function (I, EN) {
    const merge = I.merge;
    const num = (n) => I.num(n);
    const dec = (x) => I.dec(x);
    const fmtTime = (s) => I.time(s);

    // ================================================================ UI tables (ND.STR)
    merge(EN.STR, {
      menu: {
        brand: (nc, na) => `${nc}名武者、${na}座競技場，還有一位隱藏的宗師。即時刀劍交鋒、拼刀、格擋、架勢崩潰、奧義與布娃娃物理效果。`,
        arcade: '街機模式',
        arcadeDesc: '難度逐步攀升，一個接一個擊敗對手，最後還有隱藏宗師等著你。獲勝即可解鎖新忍者與競技場。',
        arcadeProg: (best, c, ct, a, at) => `${best ? '最佳 ' + num(best) + ' · ' : ''}已解鎖忍者 ${c}/${ct} · 競技場 ${a}/${at}`,
        train: '訓練',
        trainDesc: '對著木樁自由練習，或一步步學習',
        trainFree: '自由練習',
        trainTut: '教學',
        watchShort: '隨機兩名忍者，傳奇級 AI',
        specialKey: '奧義（氣滿時）',
        single: '單場對戰', singleDesc: '對戰電腦或雙人對打',
      },
      sel: {
        title: { '2p': '選擇你的忍者', cpu: '選擇你的忍者', arcade: '街機模式 · 選擇忍者', train: '訓練 · 選擇忍者', tutorial: '教學 · 選擇忍者', tourney: '每月錦標賽 · 選擇忍者', dan: '段位考驗 · 選擇忍者' },
        who1: { '2p': '玩家 1 · A / D 選擇，F 確認', def: '你 · A / D 選擇，F 確認' },
        who2: { '2p': '玩家 2 · ← / → 選擇，K 確認', cpu: '對手（電腦）· ← / → 選擇', train: '木樁 · ← / → 選擇' },
        go: { def: '開始對戰', arcade: '開始街機模式', train: '開始訓練', tutorial: '開始教學', tourney: '開始錦標賽', dan: '開始考驗' },
        random: '隨機',
        arena: '競技場',
        locked: '未解鎖',
        lockMsg: (name, hint) => `${name} 未解鎖 · ${hint}`,
        keyHint: '<kbd>Enter</kbd> 開始 · <kbd>⌫</kbd> 返回',
      },
      hint: {
        wins: (n, cur) => `在街機模式贏得 ${n} 場對戰（${Math.min(cur, n)}/${n}）`,
        clear: '通關街機模式一次',
        boss: '在街機模式擊敗最終頭目',
        arena: '在街機模式中於此競技場贏得一場對戰',
      },
      toast: {
        newChar: (name) => `解鎖新角色：${name}`,
        newArena: (name) => `解鎖新競技場：${name}`,
        newBest: (s) => `新紀錄：${num(s)} 分`,
        lesson: (t) => `課程完成：${t}`,
        tutDone: '教學完成！',
        perf: '已降低畫質以提升流暢度',
      },
      vs: {
        stage: (i, n) => `第 ${i} / ${n} 戰`,
        boss: '最終決戰',
        go: '開打！',
        quit: '退出街機模式',
        keys: '<kbd>Enter</kbd> / <kbd>F</kbd> 開始 · <kbd>⌫</kbd> 退出',
        unknown: '？',
      },
      hud: { you: '你', cpu: 'CPU', dummy: '木樁', stage: (i, n) => `${i}/${n}`, boss: '最終頭目', inf: '∞', lockSolo: '狂按 F / K！', lockDuo: '狂按輕擊或重擊！' },
      end: {
        rematch: '再戰一場', change: '更換角色', menu: '主選單',
        winTitle: '勝利屬於你',
        winSub: (i, n, pts) => `第 ${i}/${n} 戰過關 · +${num(pts)} 分`,
        next: '下一戰',
        bossNext: '邁向終局',
        lossTitle: '落敗',
        lossSub: (name) => `這次 ${name} 略勝一籌。再試一次吧。`,
        retry: '再試一次',
        quit: '退出街機模式',
      },
      ending: {
        head: '結局',
        rows: { fights: '對戰', time: '總時間', retries: '重試次數', perfect: '完美回合', score: '分數', best: '最佳' },
        newBest: '新紀錄！',
        menu: '主選單',
        again: '再玩一次',
        unlocked: '已解鎖',
        fightPts: '對戰得分',
        bonus: '通關獎勵',
      },
      score: {
        hud: '分數',
        rows: { hit: '命中', combo: '連招', counter: '反擊', defense: '防守', pressure: '壓制', special: '奧義', round: '勝利', perfect: '完美', hp: '剩餘生命', time: '時間獎勵' },
        total: '本場得分',
        diff: (name, m) => `含${name} ×${dec(m)}`,
        best: (s) => `你的最佳：${num(s)}`,
        newBest: '新紀錄！',
        arcadeTotal: (s) => `街機總分：${num(s)}`,
        lossNote: (s, pen) => `本次挑戰不計分 · 街機總分 ${num(s)} · 每次重試 −${num(pen)}`,
        clearBonus: (c, n) => `+${num(c)}${n ? ' · 零重試 +' + num(n) : ''}`,
        lossCpu: '落敗 · 只有勝場會登上排行榜',
        cpuBoardHint: '傳奇難度的勝場會登上排行榜',
      },
      lb: {
        menu: '排行榜',
        menuDesc: '街機與傳奇紀錄',
        title: '排行榜',
        back: '返回',
        boards: { arcade: '街機模式', cpu_efsane: '傳奇電腦' },
        boardDesc: { arcade: '完整通關一次街機模式的總分', cpu_efsane: '單場擊敗傳奇電腦的得分' },
        all: '全部',
        status: { loading: '載入中…', online: '線上排行榜', readonly: '線上排行榜 · 僅供瀏覽', local: '本機排行榜', error: '錯誤 · 本機排行榜', offline: '離線 · 本機排行榜' },
        empty: '還沒有分數。搶先登榜吧！',
        loadErr: '無法載入排行榜。',
        you: '你', youTag: '你', player: '玩家',
        nick: '暱稱', nickPh: '你的暱稱', nickSave: '儲存', nickEdit: '修改',
        nickAsk: '本機排行榜暱稱：',
        saving: '儲存中…',
        savedOnline: (r) => `線上排名：#${r}`,
        savedOnlineNoRank: '已存入線上排行榜',
        savedOnlineAll: (r) => `線上歷代排名：#${r}`,
        platSignIn: '登入即可將分數上傳到線上',
        platPending: '已存在這台裝置 · 登入後即可上傳到線上排行榜',
        savedOnlineGap: (r, g) => `線上排名：#${r} · 距離前 10 名還差 ${g} 分`,
        reason: {
          needName: '取個暱稱就能加入線上排行榜',
          offline: '沒有網路連線——分數已保留，恢復連線後會自動上傳',
          rate: '上傳太頻繁——分數稍後會送出',
          daily: '已達今日上傳上限——分數只存在本機',
          week: '本月已結束——這筆分數不計入新的月份',
          invalid: '分數無效',
        },
        nickErr: {
          nick_length: '暱稱須為 3–16 個字元',
          nick_chars: '只能使用字母、數字、空格及 _ . -（至少要有一個字母）',
          nick_bad: '這個暱稱無法使用，請換一個',
          rate_limited: '請稍等一下再試',
        },
        nickErrDef: '暱稱儲存失敗',
        nickAskOnline: '線上排行榜暱稱：',
        savedLocal: (r) => (r ? `本機排行榜第 ${r} 名` : '已存入本機排行榜'),
        rejected: '分數無法儲存——僅存入本機排行榜',
        quota: '線上排行榜已滿——分數只存在本機',
        open: '排行榜',
        keys: '<kbd>←</kbd> <kbd>→</kbd> 榜單 · <kbd>↑</kbd> <kbd>↓</kbd> 忍者 · <kbd>⌫</kbd> 返回',
      },
      bz: {
        back: '返回', toMenu: '主選單', you: '你', youTag: '你', newBest: '新紀錄！', seeResult: '查看結果',
        resetIn: '重置倒數',
        // time left: days (天) · hours (小時) · minutes (分) · seconds (秒)
        left: (ms) => { const t = Math.floor(ms / 1000), d = Math.floor(t / 86400), hh = Math.floor((t % 86400) / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60; return d ? `${d}天 ${hh}小時 ${mm}分` : hh ? `${hh}小時 ${mm}分` : `${mm}分 ${ss}秒`; },
        leftShort: (ms) => { const t = Math.floor(ms / 60000), d = Math.floor(t / 1440), hh = Math.floor((t % 1440) / 60), mm = t % 60; return d ? `${d}天 ${hh}小時` : hh ? `${hh}小時 ${mm}分` : `${mm}分`; },
        weekName: (m, y) => `${y}年${['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'][m - 1] || m}`,
        monthName: (m) => ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'][m - 1] || String(m),
        rank: (r) => (r <= 0 ? '未入段' : r <= 10 ? `Kyu ${11 - r}` : `Dan ${r - 10}`),
        fightOf: (i, n) => `第 ${i}/${n} 戰`,
        hpBonus: (p) => `敵方生命 +${p}%`,
        mirrorOpp: '鏡像 · 對手是你自己的忍者',
        suddenSub: '只有一回合 · 先倒下的人就輸',
        rows: { fights: '勝場', time: '時間', fightPts: '對戰得分', stage: '關卡獎勵', clear: '通關獎勵', total: '錦標賽得分', weekBest: '本月最佳' },
        mods: {
          rally2x: { n: '反擊烈焰', d: '反擊傷害 ×2' },
          fullKi: { n: '滿氣開局', d: '每回合開始時氣都是滿的' },
          sudden: { n: '驟死戰', d: '只有一回合；雙方都以一半生命開局' },
          mirror: { n: '鏡像對決', d: '對手就是你自己的忍者' },
          parryOnly: { n: '唯有反擊', d: '普通攻擊只造成 25% 傷害；反擊 ×1.5' },
          posture2x: { n: '架勢崩壞', d: '架勢傷害 ×2：防禦很快就會被破' },
          shuriken3x: { n: '手裏劍風暴', d: '手裏劍數量三倍' },
          kiRush: { n: '氣之洪流', d: '集氣速度加倍' },
          glass: { n: '玻璃之刃', d: '所有傷害 ×1.5' },
        },
        menu: {
          tour: '每月錦標賽', dan: '段位考驗', hall: '冠軍殿堂',
          tourRank: (p, left) => `本月：#${p} · ${left}後重置`,
          tourBest: (b, left) => `你的最佳 ${b} · ${left}後重置`,
          tourNew: (left) => `所有人都是同樣 8 場對戰 · ${left}後重置`,
          danRank: (name, next) => (next ? `你的段位：${name} · 下一級：${next}` : `你的段位：${name} · 已登峰造極`),
          danNew: '從 Kyu 10 到 Dan 10，共 20 場考驗',
          hallRank: (p) => `本月 #${p} · 紀錄`,
          hallDesc: '本月前 10 名與歷代紀錄',
          nick: (n) => (n ? `暱稱：${n}` : '設定暱稱'),
          champTitle: '本月前 10 名', champLocal: '本裝置前 10 名', champEmpty: '搶先登上本月榜單吧', champLoading: '正在載入榜首…',
          champAll: '歷代前 10 名', champAllEmpty: '搶先登上線上榜單吧',
          champLast: (n) => `上月冠軍：${n}`, champOpen: '查看每月排名',
        },
        t: {
          title: '每月錦標賽', head: '錦標賽',
          runNote: (s, st) => `錦標賽總分：${num(s)}（含每勝 +${num(st)}）`,
          lossSub: (name, won) => `${name} 終結了你的挑戰 · ${won} 勝`,
          lossNote: (s) => `這場不計分 · 錦標賽得分 ${num(s)}`,
          quit: '結束錦標賽',
          myBest: (b, a) => `本月最佳：${b} 分 · 已挑戰 ${a} 次`,
          noTry: '本月尚未挑戰。',
          place: (p, t) => (t ? `#${p} / ${t}` : `#${p}`),
          rules: (n, clear, stage) => `共 ${n} 場對戰，每個人的對手、競技場和規則都相同。輸一場該次挑戰就結束；挑戰次數不限，以最佳成績計算。每勝一場 +${stage}，全數擊敗再 +${clear}。`,
          start: '選擇忍者，開始挑戰', again: '再試一次', go: '進入錦標賽',
          clearTitle: '錦標賽制霸', overTitle: '挑戰結束',
          savedToast: (s) => `錦標賽得分已儲存：${s}`,
        },
        d: {
          title: '段位考驗', head: '段位考驗',
          sub: '通過每一場考驗來晉升段位。你的段位會顯示在排行榜上的名字旁邊。',
          trialOf: (n) => `${n} 考驗`,
          runNote: (i, n) => `考驗：已贏 ${i}/${n} 場`,
          lossSub: (name) => `${name} 擋下了你的考驗。`,
          lossNote: '考驗失敗',
          quit: '放棄考驗',
          yourRank: '你的段位', bestWas: (n) => `最高：${n}`, ladder: '段位階梯',
          nextTrial: (n) => `下一場：${n} 考驗`,
          fights: (n) => `${n} 場`,
          bossLast: '最終戰：Shura',
          strikes: (left, max) => `剩餘機會：${left}/${max} · 失敗 ${max} 次會降一級`,
          safe: '在這個段位，考驗失敗也不會降級。',
          maxed: '登峰造極：Dan 10', maxedSub: '你的名字高居段位榜首。',
          start: '選擇忍者，接受考驗', next: '下一場考驗', go: '接受考驗',
          promoted: (n) => `晉升：${n}`, demoted: (n) => `降級：${n}`, failed: '考驗失敗',
          promotedSub: (a, b) => `${a} → ${b}`, demotedSub: '三次考驗失敗。再爬回去吧！', tryAgain: '再試一次，你的段位不受影響。',
          toast: (n) => `新段位：${n}`, leftToast: '已放棄考驗：視為失敗',
        },
        hall: {
          title: '冠軍殿堂',
          tabs: { week: { n: '本月' }, alltime: { n: '歷代' }, archive: { n: '冠軍' }, chars: { n: '忍者' }, dan: { n: '段位' } },
          desc: { alltime: '每月錦標賽的歷代最佳', archive: '每個已結束月份的前 10 名，都會永久銘刻於此', chars: '各忍者的紀錄保持者 · 點選忍者查看前 20 名', dan: '最高段位' },
          loading: '載入中…', error: '無法載入排行榜。', retry: '再試一次',
          empty: '這裡還沒有人。搶先登榜吧！', emptyDan: '還沒有人取得段位。', emptyArchive: '還沒有已結束的月份。稱號從 2026 年 10 月的錦標賽開始頒發；該月冠軍會在 11 月 1 日賽事結束時銘刻於此。', emptyArchiveLocal: '這台裝置上還沒有已結束的月份。',
          anon: '玩家',
          meTop: (p, s) => `你：#${p} · ${s} 分 · 你在前 10 名！`,
          meGap: (p, g, s) => `你：#${p} · ${s} 分 · 距離前 10 名還差 ${g} 分`,
          meNone: '本月還沒有分數。',
          meDan: (p, n) => `你：#${p} · ${n}`,
          meDanLocal: (n) => `你的段位：${n}`, meNoDan: '尚無段位。第一場考驗：Kyu 10。',
          noRecord: '無紀錄', allNinjas: '全部忍者',
          pending: (n) => `等待上傳的紀錄：${n}`,
          classic: '街機 · 傳奇榜單',
        },
        // Monthly Tournament rewards: permanent title (top 3) and Champion colors (1st)
        ttl: {
          champ: '每月冠軍', finalist: '決賽選手',
          reward: '從 2026 年 10 月的錦標賽起，每月前 3 名可獲得永久稱號。冠軍還能為所使用的忍者贏得專屬的冠軍配色。當月至少要有 5 名玩家參賽才會頒發稱號。',
          hall: '2026 年 10 月起：每月前 3 名獲得永久稱號（至少 5 名玩家）· 冠軍贏得冠軍配色',
          local: '你的錦標賽分數保存在這台裝置上。',
          colors: '冠軍配色',
          how: '使用這名忍者贏得每月錦標賽',
          unlocked: (name) => `每月冠軍！${name} 的冠軍配色已解鎖`,
          newTitle: (t) => `新稱號：${t}`,
        },
      },
      train: {
        title: '訓練', tutTitle: '教學',
        dummy: '木樁',
        beh: { idle: '靜止', guard: '防禦', attack: '攻擊', counter: '反擊' },
        infHp: '無限生命', fullKi: '滿氣',
        reset: '重置位置',
        hide: '隱藏', show: '面板',
        moves: '招式表',
        lessons: '課程',
        lessonOf: (i, n) => `第 ${i}/${n} 課`,
        done: '教學完成！隨意設定木樁，自由練習吧。',
        progress: (a, b) => `${a}/${b}`,
        keysHelp: '<kbd>1</kbd>–<kbd>4</kbd> 木樁 · <kbd>⌫</kbd> 重置 · <kbd>H</kbd> 面板',
        specialFallback: { kanji: '影斬り', name: '影斬', desc: '快如閃電的一斬，乾淨俐落地貫穿對手。', tip: '' },
        kiFull: '滿氣',
        counterTip: '破解方法',
      },
      moves: [
        ['<kbd>A</kbd><kbd>D</kbd>', '移動', '連按兩下：衝刺'],
        ['<kbd>W</kbd>', '跳躍', ''],
        ['<kbd>F</kbd><kbd>F</kbd><kbd>F</kbd>', '輕斬三連', '第三擊會擊退對手'],
        ['<kbd>G</kbd>', '重斬', '擊倒'],
        ['<kbd>R</kbd>', '踢擊', '壓制防禦，累積架勢'],
        ['<kbd>T</kbd>', '手裏劍', ''],
        ['<kbd>Shift</kbd>', '衝刺', '左 Shift'],
        ['<kbd>Shift</kbd>›<kbd>F</kbd>', '衝刺斬', ''],
        ['<kbd>W</kbd>›<kbd>F</kbd>', '空中斬', ''],
        ['<kbd>W</kbd>›<kbd>G</kbd>', '俯衝斬', '空中重擊'],
        ['<kbd>S</kbd>', '防禦', '按住'],
        ['<kbd>S</kbd>!', '格擋', '在攻擊命中前一刻按下'],
        ['<kbd>F</kbd>', '直接反擊', '防禦／格擋之後'],
        ['前+<kbd>F</kbd>', '掃腿', '反擊 · 攻擊腳下'],
        ['後+<kbd>F</kbd>', '繞背', '反擊 · 閃到對手身後'],
        ['<kbd>G</kbd>', '重反擊', '反擊 · 擊倒'],
        ['連鎖', '反擊連鎖', '擋下反擊再反擊；你的第 3 次反擊是終結技'],
        ['<kbd>F</kbd>/<kbd>G</kbd>!!', '拼刀', '拼刀時狂按，把對手推開'],
      ],
      touch: {
        btn: { light: '攻擊', heavy: '重擊', kick: '踢擊', guard: '防禦', dodge: '衝刺', throw: '手裏劍', special: '氣', up: '跳躍', down: '防禦', stick: '搖桿' },
        lock: '狂按攻擊！',
        replaySkip: '點一下跳過',
        rotateTitle: '請將螢幕轉為橫向',
        rotateText: 'Shadow Duel 需橫向遊玩。直向時仍可操作選單。',
        rotMenu: '主選單',
        need2p: '需要鍵盤／手把',
        need2pToast: '雙人對戰請連接鍵盤或手把',
        hints: '提示',
        pause: '暫停',
        sel: { who1: '你 · 點選你的忍者', who2: '對手（電腦）· 點選', who2train: '木樁 · 點選' },
        opt: {
          title: '觸控操作',
          layout: '配置', simple: '簡易', full: '完整',
          size: '大小', sizes: { s: '小', m: '中', l: '大' },
          hand: '按鈕位置', right: '右側', left: '左側',
          assist: '輕鬆輔助', haptic: '震動',
          fullscreen: '全螢幕', exitFullscreen: '離開全螢幕',
          note: '簡易：5 個大按鈕。完整：多了踢擊和手裏劍。輕鬆輔助：按住「攻擊」就會持續連招，輕點「防禦」的時間也夠長、足以格擋，推搖桿時也不會誤觸跳躍。它只是讓觸控更好操作，規則和計分對所有人都一樣。',
          fullNote: '「踢擊」和「手裏劍」按鈕在完整配置中（設定 → 操作）。',
        },
        help: '<div class="th-grid">' +
          '<div><h3>搖桿</h3><dl>' +
          '<dt><i class="tb">◀ ▶</i></dt><dd>拇指放在空白的半邊螢幕上滑動：移動</dd>' +
          '<dt><i class="tb">▲</i></dt><dd>往上推：跳躍</dd>' +
          '<dt><i class="tb tb-guard">▼</i></dt><dd>往下拉：防禦</dd>' +
          '<dt><i class="tb">▶▶</i></dt><dd>往側邊快速撥兩下：衝刺</dd>' +
          '</dl></div>' +
          '<div><h3>按鈕</h3><dl>' +
          '<dt><i class="tb tb-light">攻擊</i></dt><dd>斬擊。連續點擊：連招。點擊時按住前或後：使出其他招式</dd>' +
          '<dt><i class="tb">重擊</i></dt><dd>重斬。前 + 重擊可將對手挑空</dd>' +
          '<dt><i class="tb tb-guard">防禦</i></dt><dd>按住：防禦。在攻擊命中前一刻輕點：格擋</dd>' +
          '<dt><i class="tb">衝刺</i></dt><dd>衝刺（朝搖桿的方向，否則往後）</dd>' +
          '<dt><i class="tb ki">氣</i></dt><dd>奧義：氣滿時按鈕會發光</dd>' +
          '<dt><i class="tb">踢擊</i> <i class="tb">手裏劍</i></dt><dd>完整配置：踢擊和手裏劍</dd>' +
          '</dl></div></div>',
        note: '可以同時按住多個按鈕：一邊防禦一邊攻擊，或把拇指從 <i class="tb tb-guard">防禦</i> 滑到 <i class="tb tb-light">攻擊</i>。畫面上方的 <b>II</b> 可以暫停；配置、大小和左手選項都在<b>設定</b>裡。改用鍵盤或手把時，操作會自動切換過去。',
        keysHelp: '',
      },
      movesTouch: [
        ['<i class="tb">◀ ▶</i>', '移動', '搖桿 · 快速撥兩下：衝刺'],
        ['<i class="tb">▲</i>', '跳躍', '把搖桿往上推'],
        ['<i class="tb tb-light">攻擊</i>×3', '三連擊', '連續點擊；第三擊會擊退對手'],
        ['<i class="tb">重擊</i>', '重斬', '擊倒'],
        ['<i class="tb">踢擊</i>', '踢擊', '壓制防禦，累積架勢 · 完整配置'],
        ['<i class="tb">手裏劍</i>', '手裏劍', '完整配置'],
        ['<i class="tb">衝刺</i>', '衝刺', ''],
        ['<i class="tb">衝刺</i>›<i class="tb tb-light">攻擊</i>', '衝刺斬', ''],
        ['<i class="tb">▲</i>›<i class="tb tb-light">攻擊</i>', '空中斬', ''],
        ['<i class="tb">▲</i>›<i class="tb">重擊</i>', '俯衝斬', '空中重擊'],
        ['<i class="tb tb-guard">防禦</i>', '防禦', '按住，或把搖桿往下拉'],
        ['<i class="tb tb-guard">防禦</i>!', '格擋', '在攻擊命中前一刻輕點'],
        ['<i class="tb tb-light">攻擊</i>', '直接反擊', '防禦／格擋之後'],
        ['前+<i class="tb tb-light">攻擊</i>', '掃腿', '反擊 · 攻擊腳下'],
        ['後+<i class="tb tb-light">攻擊</i>', '繞背', '反擊 · 閃到對手身後'],
        ['<i class="tb">重擊</i>', '重反擊', '反擊 · 擊倒'],
        ['連鎖', '反擊連鎖', '擋下反擊再反擊；你的第 3 次反擊是終結技'],
        ['<i class="tb tb-light">攻擊</i>!!', '拼刀', '拼刀時狂按攻擊，把對手推開'],
      ],
      moveSpecialTouch: '<i class="tb ki">氣</i>',
      moveTags: {
        normal: '普通', command: '指令技', string: '連擊', launcher: '挑空', juggle: '追擊', air: '空中', dash: '衝刺',
        strike: '打擊', counter: '反擊', catch: '當身', feint: '假動作', guardCrush: '破防', knockdown: '擊倒',
        kiCancel: '氣取消', special: '奧義', throw: '飛行道具',
      },
      lessonsTouch: {
        walk: '拇指在空白的半邊螢幕上滑動：把搖桿往左右推來移動。',
        combo: '連點三下 <i class="tb tb-light">攻擊</i>：打出三連斬，命中木樁。',
        heavy: '用 <i class="tb">重擊</i> 打中一記重斬。雖然慢，但能擊倒對手。',
        gbreak: '木樁正在防禦。用 <i class="tb">重擊</i> 攻擊，累積它的架勢條並破防（完整配置中的 <i class="tb">踢擊</i> 累積得更快）。',
        block: '木樁正在攻擊。按住 <i class="tb tb-guard">防禦</i>（或把搖桿往下拉），擋下一次斬擊。',
        parry: '在攻擊命中前一刻輕點 <i class="tb tb-guard">防禦</i>。藍色圓圈縮小的那一刻就是最佳時機。',
        counter: '防禦或格擋之後立刻按 <i class="tb tb-light">攻擊</i>：反擊斬。也試試搖桿往前／後 + <i class="tb tb-light">攻擊</i> 或 <i class="tb">重擊</i>。',
        special: '你的氣量條已滿。按下發光的 <i class="tb ki">氣</i> 按鈕施展 {sp}。',
      },
      lessons: [
        { id: 'walk', t: '移動', d: '用 <kbd>A</kbd> / <kbd>D</kbd> 前後移動。' },
        { id: 'combo', t: '三連擊', d: '用 <kbd>F</kbd> <kbd>F</kbd> <kbd>F</kbd> 連出三記輕斬，命中木樁。' },
        { id: 'heavy', t: '重斬', d: '用 <kbd>G</kbd> 打中一記重斬。雖然慢，但能擊倒對手。' },
        { id: 'gbreak', t: '破防', d: '木樁正在防禦。用 <kbd>R</kbd> 踢擊，累積它的架勢條並破防。' },
        { id: 'block', t: '防禦', d: '木樁正在攻擊。按住 <kbd>S</kbd> 擋下一次斬擊。' },
        { id: 'parry', t: '格擋', d: '在攻擊命中前一刻按下 <kbd>S</kbd>。藍色圓圈縮小的那一刻就是最佳時機。' },
        { id: 'counter', t: '反擊', d: '防禦或格擋之後立刻按 <kbd>F</kbd>：反擊斬。也試試前／後 + <kbd>F</kbd> 或 <kbd>G</kbd>。' },
        { id: 'rally', t: '反擊連鎖', d: '木樁也會反擊。攻擊它、擋下它的反擊再反擊回去：用你自己的兩次回擊達成 2×。' },
        { id: 'special', t: '奧義', d: '你的氣量條已滿。按 <kbd>E</kbd> 施展 {sp}。' },
      ],
    });

    // ================================================================ story, fighters, arenas, specials
    // ---- Fragment B: story text (talk, pairs, endings, roster2 notes), characters, arenas, specials, pop-ups, AI levels, number words
    merge(EN.STR, {
      // open = speaks first (opponent), reply = answers (player), boss = said to the final boss
      talk: {
        akane: {
          open: ['吾刃赤紅，吾心純正。堂堂正正地與我一戰吧。', '先行禮，再出刀。這才公平。', '這場決鬥事關榮譽，沒有退路。'],
          reply: ['可敬的對手……你配得上我的刀。', '好鋒利的言詞。就看你的刀是否一樣鋒利。', '赤刃出鞘之時，言語皆歸於沉默。'],
          boss: 'Shura，我的師父們死在你的刀下。今天就要你償還這筆血債。',
        },
        aoi: {
          open: ['風從不急躁，我也一樣。', '聽聽你的呼吸。你最後聽見的聲音，將會是風聲。', '竹子會彎，卻從不折斷。你是哪一種？'],
          reply: ['冷靜點。怒氣只會讓刀變沉。', '你抓不住風，只能感受它。', '很好。葉子落地之時，便是開始。'],
          boss: '就連風暴之眼也是寂靜的。而你的內心只有喧囂，Shura。',
        },
        kuro: {
          open: ['山不會動。動的是你。', '少廢話。舉刀吧。', '你太小了。很快就會結束。'],
          reply: ['哼。來吧。', '你話太多了。', '我的野太刀很長，我的耐性很短。'],
          boss: 'Shura。我等很久了。不必多說。',
        },
        yuki: {
          open: ['雪落無聲，我的刀也是。', '狐狸不會掉進陷阱，牠只會設下陷阱。', '冷嗎？很快你就什麼都感覺不到了。'],
          reply: ['你太熱血了，這會拖慢你。', '吵死了……連雪都替你難為情。', '別眨眼。不然你會錯過。'],
          boss: '大家都怕你，Shura。我只是覺得有點冷。',
        },
        hana: {
          open: ['來跳支舞吧？不過要由我來帶！', '保證在櫻花落地前就結束！', '兩把短刀，一個微笑。哪個比較嚇人？'],
          reply: ['唉唷，這麼嚴肅！笑一個嘛，倒下的時候比較好看。', '有本事就來抓我啊！', '好啦好啦！不過之後可不准哭喔。'],
          boss: 'Shura，你都不笑的嗎？來嘛，讓這成為我們最後一支舞！',
        },
        tetsu: {
          open: ['職責帶我來此。讓開，否則倒下。', '我的鎧甲身經百戰。你是第一百零一戰。', '紀律先於勇氣。容我示範給你看。'],
          reply: ['無禮。我會糾正你。', '你的言語刺不穿我的鎧甲。', '做好準備。我的薙刀出手從不預警。'],
          boss: 'Shura，你燒了主公的城。今天我要完成我的職責。',
        },
        ren: {
          open: ['哈！總算有好玩的了！你的骨頭夠硬嗎？', '被面具嚇到了？你可不會想看我的真面目！', '腦袋還是防禦？我兩個都打爛！'],
          reply: ['光說不練！來啊！', '嘿，我欣賞你。不過照樣要把你揍扁。', '見識過我的踢腿嗎？馬上讓你見識！'],
          boss: '原來你才是真正的鬼啊？來看看誰的角比較硬！',
        },
        kage: {
          open: ['你以為你看見了我。你看見的只是我的影子。', '光越亮，影越深。', '你的名字早已寫下，我只是唸出來而已。'],
          reply: ['別出聲。影子在聽。', '別回頭。我已經在你身後了。', '你太吵了。沉默出手更快。'],
          boss: '影子不侍奉任何主人，Shura。它們也會吞噬你。',
        },
        shura: {
          open: ['你折斷了七把刀。第八把是我的，它會折斷你。', '你的魂魄在召喚我。很好，你爬得越高，摔得就越慘。', '我就是這條路的盡頭。跪下吧。'],
          reply: ['軟弱。我在這裡就聞得到。', '你不過是一塊墊腳石。', '跪下，或者倒下。'],
          boss: '鏡中的惡鬼……我們之中，有一個是多餘的。',
        },
        tora: {
          open: ['吊在我鎖鏈上的傢伙，我早就數不清了。你會是下一個。', '狩獵開始了。想逃就逃吧，我的鎖鏈可長得很。', '人家說老虎會埋伏等待。我可不是！'],
          reply: ['吼……很好。我就喜歡不逃跑的獵物。', '不用靠過來。我會把你拉過來。', '你的話很長，我的鎖鏈更長。'],
          boss: 'Shura，你也不過是獵物。只是大隻了點。',
        },
        jin: {
          open: ['我不是來見血的。只是要讓你躺下休息一會兒。', '棍棒以耐心說話。聽著。', '年輕的武者，你的路上充滿怒氣。讓我們卸下你的重擔吧。'],
          reply: ['好吧。不過打完之後，一起喝杯茶。', '你的怒氣壓著你。讓我替你扛吧。', '刀能斬，棍能醒。'],
          boss: 'Shura，要戰勝你心中的惡鬼，我不必毀滅你。阻止你就夠了。',
        },
        mai: {
          open: ['舞台已就緒，布幕已拉開。你的角色：輸家。', '我的扇子展開時可別閉眼，否則你會錯過這場表演。', '我的每一步都是一個音符。你跟得上節拍嗎？'],
          reply: ['多麼粗魯的登場。無妨，我的優雅足以分給我們兩人。', '風是站在我這邊的，親愛的。', '我不需要掌聲。你的倒下就夠了。'],
          boss: 'Shura，這最後一支舞，我不與任何人共享舞台。',
        },
        tsubame: {
          open: ['我們之間的距離，就是我的武器。', '燕子失手一次，第二次就會回身出擊。', '我已經量過風了。我的箭知道它的路。'],
          reply: ['想靠近？試試看啊。', '屏住呼吸。飛行中的箭是沒有聲音的。', '我盯著你。我的箭也是。'],
          boss: 'Shura，天空中無處可躲。我的箭會找到你。',
        },
      },
      // Special match-ups: lines are spoken in the order written
      pairs: {
        'akane|aoi': [['akane', 'Aoi！是時候了結我們那場未完的決鬥了。'], ['aoi', '風總是吹向同一團火，Akane。開始吧。']],
        'kuro|tetsu': [['kuro', '鐵殼子。看看裡面是不是空的。'], ['tetsu', '就連高山也得向紀律低頭，Kuro。']],
        'hana|yuki': [['yuki', '花會在雪中凋零，Hana。'], ['hana', '那我就把雪融化掉囉，Yuki！']],
        'kage|ren': [['ren', '影子把戲對我沒用！給我現身！'], ['kage', '我就在這裡，鬼。只是你不懂得怎麼看。']],
        'akane|ren': [['akane', '只有不知廉恥的人，才會躲在面具後面。'], ['ren', '榮譽？榮譽又不能填飽肚子！']],
        'aoi|yuki': [['aoi', '冷風依然是風，Yuki。'], ['yuki', '但風停了，雪還在。']],
        'kuro|tora': [['tora', '山是吧？老虎也住在山裡喔。'], ['kuro', '老虎也死在山裡。']],
        'tora|yuki': [['tora', '狐狸！狐狸遇上老虎會怎樣？'], ['yuki', '先逃跑。然後把老虎的尾巴凍住。']],
        'jin|tora': [['tora', '和尚，等我的鎖鏈纏住你的棍子，你打算怎麼辦？'], ['jin', '解開它。解開心結，正是我的本分。']],
        'jin|ren': [['ren', '和尚？開始念經吧，禿驢！'], ['jin', '我已經在念了，鬼。為你而念。你心中的火也在燒你自己。']],
        'jin|tetsu': [['tetsu', '和尚來戰場做什麼？'], ['jin', '為了像你這樣披著鎧甲的心而來，Tetsu。你的鎧甲沉重，你的心更沉重。']],
        'akane|jin': [['akane', '讓開，和尚。這是我的復仇。'], ['jin', '復仇是一條鎖鏈，Akane。先讓我們把它斬斷吧。']],
        'hana|mai': [['hana', '哇，又一個舞者！來比比誰轉得快！'], ['mai', '速度只是優雅的影子，Hana。讓我帶你看看光。']],
        'kage|mai': [['mai', 'Kage，影子也會跳舞嗎？'], ['kage', '只在燈熄的時候。']],
        'aoi|tsubame': [['tsubame', 'Aoi，你的風能吹偏我的箭嗎？'], ['aoi', '風不偏袒任何人，Tsubame。就算是你的箭也一樣。']],
        'kage|tsubame': [['kage', '看不見的東西，你是射不中的，弓手。'], ['tsubame', '有光就有影。我也是。']],
        'mai|tsubame': [['mai', '從遠處盯著人看很失禮喔，弓手。過來近一點看吧。'], ['tsubame', '我會讓我的箭替我湊近看看你的舞台。']],
      },
      endings: {
        akane: ['Shura 的刀落地之時，寺院的鐘聲自行響起。', 'Akane 拭淨赤刃，在師父們的墓前鞠躬：血債已償。', '前方的路不再是復仇，而是向新弟子傳授榮譽之道。'],
        aoi: ['Shura 倒下時，風暴歸於平靜；多年來第一次，雲層散開了。', 'Aoi 收刀入鞘，回到了竹林。', '留下的，只有呼嘯的風聲。'],
        kuro: ['Kuro 將 Shura 碎裂的面具埋在山巔。', '一句話也沒說。Kuro 壓低斗笠，消失在雪中。', '村民說，那年冬天，沒有一個山賊下山。'],
        yuki: ['Shura 最後一口氣在寒風中化為白霧，隨即消散。', 'Yuki 拉好圍巾轉身離去，在雪上不留一絲足跡。', '從那天起，山巔上只見得到一隻狐狸的影子。'],
        hana: ['Shura 的面具落地時，Hana 在一旁留下了一枝櫻花。', '那晚市集掛滿了燈籠；最熱烈的歡呼，獻給了在屋頂上起舞的女忍者。', '沒人知道 Hana 去了哪裡。只留下飄落的粉色花瓣。'],
        tetsu: ['在城樓屋頂上，Tetsu 用膝蓋將 Shura 的刀一折為二。', '主公的旗幟再度升起，在風中驕傲飄揚。', '職責已了。但武士的職責永無止境。'],
        ren: ['Ren 把 Shura 碎裂的面具掛在另一張鬼面具旁。兩隻鬼，一個贏家。', '那晚村子裡歌聲不斷；笑得最大聲的，一如往常是 Ren。', '天一亮，Ren 已經上路了。去找下一場架打。'],
        kage: ['Shura 倒下時，Kage 的影子悄悄覆上了倒地的惡鬼。', '無聲無息，不留痕跡；月光下只多出了一道延伸的影子。', '也許它一直都在。也許它從未存在過。'],
        shura: ['城樓屋頂上，只剩一人屹立：戴著同樣面具的那個人，只是更加黑暗。', 'Shura 不再尋找對手。對手會來尋找 Shura。'],
        def: ['最後一位宗師倒下了。影之道如今屬於你。', '收刀入鞘吧；傳說現在才開始。'],
        tora: ['鎖鏈的鏗鏘聲，宣告了 Shura 的倒下。', 'Tora 把碎裂的面具掛上鎖鏈：又一件新的狩獵戰利品。', '從那天起，森林裡再也沒人把老虎的咆哮當成童話。'],
        jin: ['Jin 跪在倒下的 Shura 身旁，為他祈禱。', '回寺院的路上，棍子上沒有沾染一滴血。', '那晚山上的鐘聲再次響起；這一次不是為了哀悼，而是為了和平。'],
        mai: ['Shura 倒下時，Mai 啪地收起扇子，行了一禮。', '夜市的人們至今仍在談論那支舞。', '布幕落下了。但 Mai 從未離開舞台。'],
        tsubame: ['最後一支箭靜靜地顫動著，插在城樓屋頂上。', 'Tsubame 背起弓，望著燕子往南飛去。', '從此再也沒人見過她；只留下羽色鮮豔的箭，牢牢插在靶上。'],
      },
      roster2: {
        notes: {
          tora: ['輕擊：中距離甩動鎖鏈，近身則用鐮刀', '重擊：擲出鎖鏈，命中時將對手拉近', '連擊收尾：對手在遠處時，鎖鏈會把他拖過來'],
          jin: ['棍子兩端都能攻擊；打擊屬鈍擊，從不見血', '第三擊和重掃腿會擊倒對手', '按住防禦時，架勢累積得比較慢'],
          mai: ['格擋判定時間更長', '防禦時，扇子會把飛行道具反彈回去', '重擊：風浪推開對手並吹散飛行道具'],
          tsubame: ['重擊：用弓射箭；按住可蓄力射擊', '投擲：後空翻並在空中放箭', '箭用完時，重擊改用短刀；箭會隨時間補充'],
        },
      },
    });

    merge(EN.CHARS, {
      akane: { title: '赤刃', desc: '均衡型的武士刀高手。三段連招迅速，格擋強悍。', weapon: '武士刀' },
      aoi: { title: '蒼風', desc: '身手敏捷的武士刀高手。走得稍快，衝刺如風。', weapon: '武士刀' },
      kuro: { title: '黑山', desc: '手持長柄野太刀。速度慢，但攻擊範圍廣、一擊毀滅性十足。', weapon: '野太刀' },
      yuki: { title: '雪狐', desc: '以短小的小太刀快速出擊。手裏劍很多，圍巾很長。', weapon: '小太刀' },
      hana: { title: '櫻舞', desc: '女忍者。手持雙短刀，戰鬥如起舞；出手最快，攻擊距離最短。', weapon: '雙短刀' },
      tetsu: { title: '鐵壁', desc: '身披鎧甲的武士。薙刀攻擊距離最長；挨打也幾乎不痛不癢。', weapon: '薙刀' },
      ren: { title: '赤鬼', desc: '戴著鬼面具的狠角色。以破防重擊和毀滅性的踢腿讓人膽寒。', weapon: '打刀' },
      kage: { title: '影之化身', desc: '身披兜帽的影子。忍者刀出手快、衝刺距離長；所經之處都會留下影子。', weapon: '忍者刀' },
      tora: { title: '鎖鏈猛虎', desc: '鎖鐮高手。在中距離甩動帶錘的鎖鏈；重擊能把對手拉到鐮刀前。', weapon: '鎖鐮' },
      jin: { title: '鐵棍僧', desc: '使長棍的僧人。長棍兩端都能攻擊，防禦穩固，鈍擊能擊倒對手；從不見血，只讓人骨頭作響。', weapon: '長棍' },
      mai: { title: '扇舞姬', desc: '使鐵扇的女忍者。速度極快，格擋判定寬；扇子能把飛行道具反彈回去，扇起的風還能把對手推開。', weapon: '雙鐵扇' },
      tsubame: { title: '燕弓手', desc: '身帶弓與短刀。從遠處射箭（按住重擊可強力射擊），有人逼近就後空翻拉開距離，並在空中放箭。', weapon: '和弓 + 短刀' },
      shura: { title: '赤紅宗師', desc: '以赤紅鋪就道路的惡鬼宗師。長柄野太刀、壓倒性的重擊、近乎完美的格擋。', weapon: '野太刀' },
    });

    merge(EN.ARENAS, {
      temple: '月光寺院',
      rain: '暴雨竹林',
      snow: '雪峰',
      village: '燃燒村落',
      market: '夜市',
      waterfall: '瀑布',
      castle: '城樓屋頂',
    });

    merge(EN.SPECIALS, {
      akane: { desc: '赤紅的居合一閃，眨眼間貫穿對手，在空中留下一道熾烈的新月。', tip: '格擋，或往旁邊衝刺閃開' },
      aoi: { desc: '大幅揮刀，向前射出一道風刃；時機完美的防禦可以將它反彈。', tip: '跳起閃避、用刀斬斷，或在完美時機防禦' },
      kuro: { desc: '躍起後以野太刀劈裂地面；沿地面竄出的衝擊波能壓垮防禦並擊倒對手。', tip: '跳過衝擊波，趁在空中時出手' },
      yuki: { desc: '如暴風雪般快如閃電的五連擊；最後一擊會擊倒對手。', tip: '防禦，並格擋第一擊' },
      hana: { desc: '揮舞雙短刀化作櫻花旋風向前突進，兩側都會被斬中。', tip: '防禦，或往後衝刺' },
      tetsu: { desc: '揮舞薙刀全方位迴旋；挨打也停不下來（霸體）。', tip: '退出攻擊範圍，或格擋' },
      ren: { desc: '一記破防的肩撞，接著上挑斬將對手打上空中。', tip: '防禦沒用：格擋、跳躍或衝刺' },
      kage: { desc: '化作煙霧消失，留下影分身，然後出現在對手身後出擊。', tip: '在 Kage 現身的瞬間防禦' },
      tora: { desc: '在頭頂甩動鎖鏈形成旋風，掃倒周圍的一切；被纏住的對手會被拉近，再用鐮刀挑上天。', tip: '退出攻擊範圍或防禦：只要沒被纏住，拉扯就會落空' },
      jin: { desc: '像金剛輪般旋轉長棍向前推進；四擊之後，一記上挑將對手打上空中。', tip: '往後衝刺，或格擋第一擊' },
      mai: { desc: '捲起一陣緩緩前進的旋風，把對手吸進來斬擊，最後拋上天空。', tip: '在完美時機防禦旋風，或後退：它移動得很慢' },
      tsubame: { desc: '向後躍起，從天而降箭雨；若沒射中，會再放出一支燕箭，迴旋從背後射來。', tip: '離開地上的標記；燕箭會飛回來，小心背後' },
      shura: { desc: '一聲怒吼化作赤紅煙霧，在對手身前身後現身，砍下三記沉重的野太刀斬擊；最後一擊會把對手打上空中。', tip: '注意赤紅的閃光：格擋任何一斬就能中斷招式；防禦則會被壓垮架勢' },
    });

    merge(EN.TXT, {
      gbreak: '架勢崩潰！', cut: '斬斷！', reflect: '反彈！', parry: '格擋！', caught: '捕獲！',
      swallowHit: '燕!', vajraHit: '金剛!', whirlHit: '旋風の舞',
    });

    merge(EN.AI_LEVELS, { 0: '學徒', 1: '大師', 2: '傳奇', 3: 'Shura' });

    EN.NUMWORDS = ['零', '一', '兩', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

    // ================================================================ static HTML, hardcoded literals, canvas pop-ups
    merge(EN.PHRASES, {
      // ---------------------------------------------------------------- index.html: <title>, brand, HUD
      'Gölge Düellosu': 'Shadow Duel',
      'Duraklat': '暫停',
      'KARŞILIKLI SERİ': '反擊連鎖',
      'SON DARBE': '致命一擊',
      'atlamak için bir tuşa bas': '按任意鍵跳過',
      // touch buttons (static fallbacks of data-s="touch.btn.*")
      'GARD': '防禦',
      'HAFİF': '輕擊',
      'SALDIR': '攻擊',
      'AĞIR': '重擊',
      'ATIL': '衝刺',
      'TEKME': '踢擊',
      // ---------------------------------------------------------------- main menu
      'Sekiz savaşçı, üç arena. Gerçek zamanlı kılıç çarpışması, kılıç kilitlenmesi, savuşturma, denge kırma, Gölge Kesiği ve ragdoll fiziği.': '八名武者、三座競技場。即時刀劍交鋒、拼刀、格擋、架勢崩潰、影斬與布娃娃物理效果。',
      'İki Oyuncu': '雙人對戰',
      'Aynı klavyede ya da iki gamepad ile kafa kafaya': '同一副鍵盤或兩支手把，正面對決',
      'CPU\'ya Karşı': '對戰電腦',
      'Ninjanı seç, rakibini yapay zekâ yönetsin': '選好你的忍者，對手交給 AI 操控',
      'Zorluk': '難度',
      'Çırak': '學徒',
      'Usta': '大師',
      'Efsane': '傳奇',
      'Aylık Turnuva': '每月錦標賽',
      'Dan Sınavı': '段位考驗',
      'Şampiyonlar Salonu': '冠軍殿堂',
      'Seyret': '觀戰',
      'Rastgele iki ninja, Efsane yapay zekâ': '隨機兩名忍者，傳奇級 AI',
      'Ses': '聲音',
      'Müzik': '音樂',
      'Kan efekti': '流血效果',
      'Tuş ipuçları': '按鍵提示',
      'Yüksek grafik': '高畫質',
      // ---------------------------------------------------------------- controls card
      'Kontroller': '操作',
      '1. Oyuncu': '玩家 1',
      '2. Oyuncu': '玩家 2',
      'Yürü': '移動',
      'Zıpla': '跳躍',
      'Gard (basılı tut)': '防禦（按住）',
      'Hafif kesik (×3 kombo)': '輕斬（×3 連招）',
      'Ağır kesik': '重斬',
      'Tekme': '踢擊',
      'Sol Shift': '左 Shift',
      'Sağ Shift': '右 Shift',
      'Atılma': '衝刺',
      'Ki tekniği (ki dolu)': '奧義（氣滿時）',
      // ---------------------------------------------------------------- select screen
      'Ninjanı seç': '選擇你的忍者',
      'Hazır': '準備好了',
      '1. oyuncunun ninjası': '玩家 1 的忍者',
      '2. oyuncunun ninjası': '玩家 2 的忍者',
      'Önceki ninja': '上一位忍者',
      'Sonraki ninja': '下一位忍者',
      '1. oyuncu kadrosu': '玩家 1 陣容',
      '2. oyuncu kadrosu': '玩家 2 陣容',
      'Dövüşe başla': '開始對戰',
      'Geri': '返回',
      'Kilitli': '未解鎖',
      'Rastgele': '隨機',
      'Hız': '速度',
      'Güç': '力量',
      'Menzil': '攻擊距離',
      'Can': '生命',
      // ---------------------------------------------------------------- pause / end
      'Duraklatıldı': '已暫停',
      'Devam et': '繼續',
      'Maçı yeniden başlat': '重新開始對戰',
      'Ana menü': '主選單',
      'Rövanş': '再戰一場',
      'Karakter değiştir': '更換角色',
      'Zafer senin': '勝利屬於你',
      'Raund': '回合',
      'Verilen hasar': '造成傷害',
      'Savuşturma': '格擋',
      'Ki Saldırısı': '奧義',
      // ---------------------------------------------------------------- training / leaderboard / misc
      'Antrenman': '訓練',
      'ANTRENMAN': '訓練',
      'Sıralama': '排行榜',
      'Tümü': '全部',
      'Ekranı yan çevir': '請將螢幕轉為橫向',
      'Performans için grafik düşürüldü': '已降低畫質以提升流暢度',
      // hidden boss pushed into ND.CHARS by arcade.js (safety net; EN.CHARS.shura should carry the same)
      'Kanlı Usta': '血之宗師',
      'Yolunu kanla çizen iblis usta. Uzun nodachi, yıkıcı darbeler, neredeyse kusursuz savuşturma.': '以鮮血開路的惡鬼宗師。長柄野太刀、壓倒性的重擊、近乎完美的格擋。',
      // ---------------------------------------------------------------- HUD tags (fallbacks when STR.hud is missing)
      'SEN': '你',
      'KUKLA': '木樁',
      // ---------------------------------------------------------------- round banners (#bt / #bs)
      'Son raund': '最終回合',
      'Kazanan her şeyi alır': '勝者全拿',
      'İlk iki raundu alan kazanır': '先拿下兩回合者獲勝',
      'Dövüş!': '開打！',
      'Süre doldu': '時間到',
      'Berabere': '平手',
      'Çifte K.O.': '雙重 K.O.',
      'Mükemmel': '完美',
      // blade-lock hint (fallbacks of STR.hud.lockSolo / lockDuo)
      'F / K tuşuna hızlıca bas!': '狂按 F / K！',
      'Hafif ya da ağır tuşuna hızlıca bas!': '狂按輕擊或重擊！',
      // counter / parry prompt labels under the key ring (ctx.fillText in drawPrompts)
      'KARŞILIK': '反擊',
      'SAVUŞTUR': '格擋',
      // ---------------------------------------------------------------- canvas pop-ups (fx.text)
      'SON VURUŞ!': '終結！',
      'KİLİTLENDİ!': '拼刀！',
      'İTTİ!': '推開！',
      'DENGE KIRILDI!': '架勢崩潰！',
      'GARD KIRILDI!': '破防！',
      'KESİLDİ!': '斬斷！',
      'YANSITMA!': '反彈！',
      'SAVUŞTURMA!': '格擋！',
      'YAKALANDI!': '捕獲！',
      'ZIRH!': '霸體！',
      'ARKADAN!': '背刺！',
      'DUVAR!': '撞牆！',
      'KAFA!': '爆頭！',
      'KARŞI!': '迎擊！',
      'KRİTİK!': '暴擊！',
      'SÜPÜRME!': '掃腿！',
      'KARŞILIK!': '反擊！',
      'YERE SERİLDİ': '擊倒',
      'ÇARPIŞMA!': '交鋒！',
    });

    merge(EN.HTML, {
      // brand title
      'Gölge<br><em>Düel</em><em>losu</em>': 'Shadow<br><em>Du</em><em>el</em>',
      // tips list (<ul class="tips">)
      '<b>Savuşturma:</b> darbe gelmeden hemen önce gard tuşuna bas; rakip sendeler.':
        '<b>格擋：</b>在攻擊命中前一刻按下防禦鍵，對手就會踉蹌失衡。',
      '<b>Karşılık (返し技):</b> gard ya da savuşturmanın hemen ardından saldırı tuşu → anında karşı kesik. <b>İleri</b> + hafif = bacağa süpürme, <b>geri</b> + hafif = yanından dönüp arkadan kesme, <b>ağır</b> = güçlü karşı darbe.':
        '<b>反擊（返し技）：</b>防禦或格擋後立刻按攻擊鍵 → 瞬間反擊斬。<b>前</b> + 輕擊 = 掃腿，<b>後</b> + 輕擊 = 繞到對手身後斬擊，<b>重擊</b> = 強力反擊。',
      '<b>Karşılıklı seri:</b> karşılık da karşılanabilir. Her turda vuruşlar hızlanır ve güçlenir; kendi 3. karşılığın üç vuruşluk sinematik bir bitirişe dönüşür. Seriyi kıran darbe ağır çekimde iner.':
        '<b>反擊連鎖：</b>反擊也能被反擊。每來回一次，攻擊都會更快更猛；你的第 3 次反擊會化為三連擊的電影級終結技。打斷連鎖的那一擊會以慢動作呈現。',
      '<b>Kılıç kilidi:</b> kılıçlar çarpışınca kilitlenebilir. Hafif/ağır tuşuna hızlı basan rakibini iter.':
        '<b>拼刀：</b>刀刃相撞時可能會僵持住。狂按輕擊／重擊比較快的一方，就能把對手推開。',
      '<b>Ki barı</b> vurdukça, yedikçe ve savuşturdukça dolar. Dolunca her ninjanın kendine özgü ki tekniği açılır (Antrenman’daki hareket listesinde görebilirsin).':
        '<b>氣量條</b>會在你攻擊、挨打和格擋時累積。集滿後，就能施展每位忍者專屬的奧義（可在訓練的招式表中查看）。',
      '<b>Atılma + hafif</b> = atılarak kesik. <b>Havada</b> hafif = hava kesiği, ağır = dalış. Ağır kesik yere serer, duvara çarpan geri seker.':
        '<b>衝刺 + 輕擊</b> = 衝刺斬。<b>空中</b>輕擊 = 空中斬，重擊 = 俯衝斬。重斬能擊倒對手，撞上牆的人會被彈回來。',
      '<b>Denge çubuğu</b> dolarsa gard kırılır. Tekme gardı delip dengeyi hızla doldurur.':
        '<b>架勢條</b>一滿就會破防。踢擊能穿透防禦，快速累積架勢。',
      // gamepad note (Esc -> Start or P)
      'Gamepad: X hafif · Y ağır · B tekme · A zıpla · LB gard · RB shuriken · RT atılma · R3 ki tekniği. Start ya da <kbd>P</kbd> duraklatır. CPU modunda her iki tuş seti de seni yönetir.':
        '手把：X 輕擊 · Y 重擊 · B 踢擊 · A 跳躍 · LB 防禦 · RB 手裏劍 · RT 衝刺 · R3 奧義。按 Start 或 <kbd>P</kbd> 暫停。對戰電腦時，兩組按鍵都能操控你的角色。',
      // select / VS hints (Esc -> ⌫)
      '<kbd>Enter</kbd> başlatır · <kbd>⌫</kbd> menüye döner': '<kbd>Enter</kbd> 開始 · <kbd>⌫</kbd> 返回',
      '<kbd>Enter</kbd> / <kbd>F</kbd> başlatır · <kbd>⌫</kbd> çıkar': '<kbd>Enter</kbd> / <kbd>F</kbd> 開始 · <kbd>⌫</kbd> 退出',
    });

    EN.PATTERNS.push(
      // HUD round label (#rlabel) and round banner
      [/^RAUND (\d+)$/, '第 $1 回合'],
      [/^(\d+)\. Raund$/, '第 $1 回合'],
      // canvas pop-ups built from numbers
      [/^(\d+)\. KARŞILIK$/, '反擊 ×$1'],
      [/^(\d+) VURUŞLUK SERİ!$/, '$1 擊連鎖！'],
      // time-up banner sub: `${name} önde`
      [/^(.+) önde$/, (m, n) => I.t(n) + ' 領先'],
      // end screen title: `${Name} kazandı`
      [/^(.+) kazandı$/, (m, n) => I.t(n) + ' 獲勝'],
      // end screen sub line: `${a} – ${b} · ${round} raund · ${arenaName}`
      [/^(\d+) – (\d+) · (\d+) raund · (.+)$/, (m, a, b, r, ar) => `${a} – ${b} · ${r} 回合 · ${I.t(ar)}`],
    );

    // ================================================================ added with the portal build (PLAY, ads, coach)
    merge(EN.STR, {
      menu: { play: '開始遊戲', playSub: (name, lv) => `${name} 對戰電腦 · ${lv}` },
      first: { play: '開始遊戲', sub: '點一下就開打', menu: '所有模式' },
      ads: {
        cont: '從這裡繼續', contSub: '看一則廣告 · 重試不扣分',
        trial: (name) => `試用 ${name} 打一場`, trialSub: '看一則廣告',
        fail: '目前沒有廣告，請稍後再試',
      },
      coach: {
        attack: (l) => `${l} 攻擊`,
        guard: (l, g) => `按住 ${g} 防禦`,
        parry: (l, g) => `在攻擊命中前一刻按下 ${g}：格擋`,
        attackT: (l) => `點 ${l} · 連續點擊：連招`,
        guardT: (l, g) => `按住 ${g} 防禦`,
        parryT: (l, g) => `在攻擊命中前一刻輕點 ${g}：格擋`,
      },
    });

    // ================================================================ VOLUME: sliders on the menu card and in pause (js/volume.js)
    merge(EN.STR, {
      vol: {
        title: '音量', master: '主音量', music: '音樂', sfx: '音效', sound: '聲音',
        pct: (n) => `${n}%`,
        muted: '聲音已關閉。拖動任一滑桿即可重新開啟。',
        // Settings > Audio: character / announcer voices switch (js/voice.js) and the courtesy credit under it
        voice: '語音',
        uiSfx: '選單音效',
        credit: '配音：ユーフルカ (youfulca.com) · 効果音ラボ · すぱらんど',
      },
    });

    // ================================================================ TOUCH LAYOUT EDITOR: movement modes + "Customize controls"
    // (js/touch.js settings rows, js/touch-editor.js; Turkish source in i18n.js, block "touch movement modes + layout editor")
    merge(EN.STR, {
      tedit: {
        move: '移動方式',
        moves: { float: '搖桿', fixed: '固定搖桿', dpad: '十字鍵' },
        mnote: {
          float: '拇指按在哪裡，搖桿就出現在哪裡。',
          fixed: '搖桿會固定在你擺放的位置；從中心往外推。',
          dpad: '獨立按鈕：按住移動，連按兩下衝刺。按在兩個按鈕之間可同時觸發（▶ + ▲ = 向前跳）。',
          dtap: '獨立按鈕：快速點一下 ◀ ▶ 走一小步，按住移動，連按兩下衝刺。',
        },
        dtap: '點按踏步',
        edit: '自訂操作',
        title: '自訂操作',
        hint: '把按鈕拖到任何位置。點一下按鈕可調整大小、不透明度或隱藏。',
        rotate: '請將螢幕轉為橫向，以配置對戰操作。',
        shapes: { phone: '手機', tablet: '平板', portrait: '直向' },
        screenNote: '配置會依螢幕形狀分別儲存：手機和平板各有自己的配置。',
        save: '儲存', cancel: '取消', options: '選項', done: '完成', close: '關閉',
        size: '大小', sizes: { s: '小', m: '中', l: '大', xl: '特大' },
        opacity: '不透明度', opacityAll: '不透明度（全部）',
        hide: '隱藏', show: '顯示', hidden: '已隱藏',
        snap: '對齊格線',
        presets: '預設配置', pRight: '右手', pLeft: '左手', pSplit: '防禦在左',
        reset: '還原預設', resetDone: '已還原預設配置（儲存後生效）。',
        overlap: '按鈕不能重疊：已移到最近的空位。',
        noRoom: '那裡沒有空間：按鈕已退回原位。',
        saved: '操作已儲存',
        throwName: '手裏劍',
        pauseName: '暫停',
        dirs: { dl: '◀ 左', dr: '右 ▶', du: '▲ 跳躍', dd: '▼ 防禦' },
      },
    });

    // ================================================================ PROGRESSION: honor, rival challenges, moves panel
    // (arcade.js STR.honor / STR.rival / STR.hint, game.js select screen; rules in js/honor.js)
    merge(EN.STR, {
      menu: { arcadeDesc: '難度逐步攀升，一個接一個擊敗對手，最後還有隱藏宗師等著你。這是賺取榮譽最多的模式。' },
      sel: {
        title: { rival: '宿敵挑戰 · 選擇忍者' },
        go: { rival: '接受決鬥' },
        moves: '招式',
        movesOf: (name) => `${name} · 招式`,
        close: '關閉',
      },
      hint: {
        honor: (have, need) => `榮譽 ${num(Math.min(have, need))}/${num(need)} → 開啟宿敵挑戰`,
        ready: '準備接受挑戰！',
        arenaHonor: (have, need) => `榮譽達 ${num(need)} 開啟（${num(Math.min(have, need))}/${num(need)}）`,
      },
      honor: {
        name: '榮譽',
        head: '榮譽',
        rows: { win: '勝利', loss: '參戰', rounds: '拿下回合', perfect: '完美回合', rally: '反擊連鎖', counter: '反擊', parry: '格擋', rivalWin: '宿敵挑戰', arcadeClear: '街機模式通關' },
        total: (n) => `榮譽：${num(n)}`,
        next: (name, left) => `下一位忍者：${name}——還差 ${num(left)} 榮譽`,
        bar: (have, need) => `榮譽 ${num(Math.min(have, need))}/${num(need)} → 開啟宿敵挑戰`,
        ready: (name) => `${name} 向你挑戰！`,
        readyGo: '接受',
        all: '所有忍者皆已解鎖',
        bonus: { arcadeClear: '街機模式通關', tourneyClear: '錦標賽制霸', danPass: '通過段位考驗', rivalWin: '宿敵挑戰獲勝', tutorial: '完成教學' },
        bonusToast: (n, what) => `+${num(n)} 榮譽 · ${what}`,
        road: '榮譽之路',
        roadSub: '所有單人模式都能賺取榮譽。達到某位忍者的門檻後，對方就會向你發起決鬥；打贏就能讓他加入你。',
        earnHead: '榮譽從哪裡來',
        earn: (H) => [
          ['對戰電腦', `勝利：學徒 ${H.win[0]} · 大師 ${H.win[1]} · 傳奇 ${H.win[2]}`],
          ['街機模式', `依難度計算勝場 · Shura ${H.win[3]} · 通關 +${H.arcadeClear}`],
          ['錦標賽與段位', `勝場 ×${H.modeMul.tourney} · 錦標賽制霸 +${H.tourneyClear} · 每場段位考驗 +${H.danPass(1)} 起`],
          ['就算落敗', `參戰 ${H.loss} · 每拿下一回合 ${H.roundWon}`],
          ['精彩表現', `格擋、反擊、反擊連鎖、完美回合：每場最多 +${H.styleCap}`],
        ],
        rivalsHead: '宿敵',
        arenasHead: '競技場',
        open: '已解鎖',
        castle: '在街機模式擊敗 Shura',
        you: (n) => `你的榮譽：${num(n)}`,
      },
      rival: {
        stage: '宿敵挑戰',
        selTitle: (name) => `${name} 向你挑戰 · 選擇忍者`,
        lvHp: (lv, p) => (p === 100 ? lv : `${lv} · 宿敵生命 ${p}%`),
        accept: '接受挑戰',
        acceptSub: (name) => `獲勝就能讓 ${name} 加入`,
        quit: '撤退',
        hud: '宿敵挑戰',
        winTitle: (name) => `${name} 加入了你！`,
        winSub: (name) => `${name} 已出現在角色選擇畫面。馬上試試看吧！`,
        tryNew: (name) => `使用 ${name}`,
        lossTitle: '挑戰仍在繼續',
        lossSub: (name, p) => `這次 ${name} 贏了。落敗沒有任何損失；下次對方會以 ${p}% 生命開局。`,
        lossSubMin: (name) => `這次 ${name} 贏了。落敗沒有任何損失，再試一次吧。`,
        retry: '再次挑戰',
        reveal: '新忍者',
        toastReady: (name) => `${name} 向你挑戰！`,
        lines: {
          hana: '我聽說你的榮譽事蹟了，整個市集都在談論你！跟得上我的舞步，我就跟你走！',
          tetsu: '你的名號已傳入我耳中。擊敗我，我的薙刀便與你並肩作戰。',
          ren: '哈！總算有人找我了！你贏了我就跟你，輸了就乖乖聽我大笑！',
          kage: '我已經觀察你一陣子了。抓得住我的影子，我便歸你。',
          tora: '證明你不是獵物。掙脫我的鎖鏈，我就與你同行。',
          jin: '若你的榮譽發自內心，我的棍子自會知曉。來吧，讓我試試你。',
          mai: '誠邀你登上我的舞台。贏得我的掌聲，我的舞便屬於你。',
          tsubame: '我從遠處看著你；你很強。躲得過我的箭，我的弓就與你同在。',
        },
      },
    });

    // ================================================================ COMBAT: new kits, combos, move list (combat designer)
    // Akane/Aoi/Ren/Kage identities, combo counter, ki cancel, ND.MOVELIST names/descriptions (read through ND.i18n.t)
    merge(EN.CHARS, {
      akane: { desc: '居合術高手。刀藏於鞘中，每一斬都是拔刀；她的拔刀架勢能接下來襲的攻擊。', weapon: '武士刀（居合）' },
      aoi: { desc: '單手使太刀的風之劍士。攻擊距離長的突刺加上風步，一個動作就能拉近任何距離。', weapon: '太刀' },
      ren: { desc: '戴著鬼面具的狠角色。刀扛在肩上；以手肘、膝蓋、肩膀和頭槌戰鬥，專門壓垮防禦。' },
      kage: { desc: '身披兜帽的影子。反手握持忍者刀；以影步、假動作和煙霧彈戰鬥。' },
    });
    merge(EN.TXT, { kiCancel: '氣取消！', launch: '挑空！', iaiCatch: 'IAI GAESHI!' });
    EN.PATTERNS.push([/^(\d+) VURUŞ$/, '$1 連擊']);
    merge(EN.PHRASES, {
      // shared rows
      'Tekme': '踢擊',
      'Tekme: dengeyi hızla doldurur, gardı kırmaya yarar. Ardından AĞIR ile seri bitirişine bağlanır.': '踢擊：快速累積架勢，有助於破防。接著按「重擊」可銜接連擊收尾。',
      'Shuriken fırlatır; zamanla yeniden dolar.': '擲出手裏劍；會隨時間補充。',
      'Hava kesiği': '空中斬',
      'Havada hafif kesik. Havaya fırlatılmış rakibe de vurur.': '空中的輕斬。也能打中被挑空的對手。',
      'Dalış': '俯衝',
      'Havadan aşağı dalış kesiği; yere serer.': '從空中往下俯衝斬擊；擊倒對手。',
      'Kaeshi-waza (karşılık)': 'Kaeshi-waza（反擊）',
      'Gard ya da savuşturmanın hemen ardından karşılık: nötr Suriage, ileri Harai (yere serer), geri Nuki (arkaya geçer), ağır Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.': '防禦或格擋後立刻反擊：不按方向為 Suriage，前為 Harai（擊倒），後為 Nuki（繞到身後），重擊為 Uchiotoshi。你自己的第三次反擊就是終結技；若被格擋，連鎖會繼續。',
      'Fırlatıcı isabet edince HAFİF: rakibin peşinden sıçrayıp havada keser. Ardından AĞIR ile yere çakar. Havadaki rakip en çok üç vuruş alır.': '挑空命中後按「輕擊」：跳起追擊，在空中斬擊。接著按「重擊」把對手砸回地面。空中的對手最多承受三擊。',
      'Üç vuruşluk hafif seri. İkinci ve üçüncü vuruş ki doluyken tekniğe bağlanır.': '三段輕擊連擊。氣滿時，第二和第三擊可取消接奧義。',
      'Ağır vuruş: yavaş ama yere serer.': '重擊：速度慢，但能擊倒對手。',
      'İleri atılarak dürter; hafif seriye devam eder.': '向前突進刺擊；可接續輕擊連擊。',
      'Yarım adım geri çekilip bacaklara alçak süpürme; yere serer.': '後退半步，朝腳下低掃；擊倒對手。',
      'Fırlatıcı: yükselen kesik rakibi havaya kaldırır.': '挑空：上挑斬將對手打上空中。',
      'Sıçrayıp tepeden iner: yavaş ama gardı ezer, yere serer.': '躍起從上方劈下：速度慢，但能壓垮防禦並擊倒對手。',
      'Atılırken dönerek geniş kesik; yere serer.': '衝刺中旋身大範圍斬擊；擊倒對手。',
      'İki kesiklik seri bitirişi; son kesik yere serer.': '兩斬連擊收尾；最後一斬擊倒對手。',
      'Rakibin kılıcını aşağı çarpıp dürter: gardı ezer.': '把對手的刀往下打落再突刺：壓垮防禦。',
      // Akane
      'Kından yatay çekiş kesiği, çapraz iniş, geri dönen kesik; kılıç her seferinde kınına döner.': '從鞘中橫向拔刀斬、斜向劈下、回身一斬；每次出刀後都會收刀入鞘。',
      'Derin çömelişten geniş yatay çekiş; yere serer.': '深蹲後大範圍橫向拔刀；擊倒對手。',
      'Atılarak kından çekiş: uzak mesafeyi bir anda kapatır, seriye devam eder.': '衝刺拔刀：瞬間拉近遠距離，並接續連擊。',
      'Kılıcı çekmeden kabzayla göğse vurur: hızlı, sersemletir. Ardından HAFİF ile Kesa ya da AĞIR ile Kurenai Renga.': '不拔刀，以刀柄撞擊胸口：速度快，能讓對手暈眩。接著按「輕擊」使出 Kesa，或按「重擊」使出 Kurenai Renga。',
      'Fırlatıcı: kından yükselen çekiş rakibi havaya kaldırır.': '挑空：從鞘中向上拔刀，將對手打上空中。',
      'Çekiş duruşu: kısa bir an bekler; bu sırada gelen yakın dövüş darbesini yakalar ve kaçınılmaz bir iai kesiğiyle karşılık verir. Boşa giderse açık kalır.': '拔刀架勢：短暫等待；這段期間接下任何近身攻擊，並以無法閃避的居合斬回敬。若沒有攻擊來襲，她就會露出破綻。',
      'Kesa’dan sonra yükselen ve inen iki çekiş kesiği; son kesik yere serer.': 'Kesa 之後接一上一下兩記拔刀斬；最後一斬擊倒對手。',
      'Tekmeden sonra çömelip rakibin içinden geçen kızıl iai; arkasında belirir.': '踢擊後壓低身形，以赤紅居合直接穿過對手；出現在對手身後。',
      // Aoi
      'Tek elle uzun dürtüş, yukarı savrulan kesik ve rüzgâr adımıyla derin atılma dürtüşü.': '單手長距離突刺、向上撩斬，再踏風步深入突進刺擊。',
      'Dönerek geniş yatay kesik; yere serer.': '旋身大範圍橫斬；擊倒對手。',
      'Rüzgâr adımı: çok uzaktan tek hamlede dürter, seriye devam eder.': '風步：從極遠處一步突刺，並接續連擊。',
      'Geri çekilirken uzun menzilli iniş kesiği: yaklaşanı cezalandırır.': '一邊後退一邊長距離劈斬：懲罰逼近的對手。',
      'Fırlatıcı: dönerek yükselen kesik rakibi havaya kaldırır.': '挑空：旋身上挑斬將對手打上空中。',
      'Geri sıçrar, ardından çok uzağa uzanan dürtüşle geri döner: gardı ezer, yere serer.': '向後躍開，再以超長距離突刺殺回：壓垮防禦並擊倒對手。',
      'Üç hızlı dürtüş; sonuncusu rüzgârla rakibi savurur.': '三記快速突刺；最後一記乘風把對手吹飛。',
      'İki kez dönerek çevresini biçen kesik; gardı ezer.': '旋轉兩圈橫掃四周；壓垮防禦。',
      // Ren
      'Kesik · Dirsek · Diz': '斬擊 · 肘擊 · 膝擊',
      'Tek elle kesik, dirsek darbesi ve uçan diz: kılıçla başlayıp bedenle biter.': '單手斬、肘擊，再接飛膝：以刀開始，以肉身收尾。',
      'İki elle tepeden ezici iniş; gardı zorlar, yere serer.': '雙手由上而下重劈；強壓防禦並擊倒對手。',
      'Omuz hücumu: öne atılıp omuzla çarpar, dengeyi sarsar. İsabet ederse seriye devam eder.': '肩撞：向前衝撞，動搖對手架勢。命中後可接續連擊。',
      'Kafa atar: kısa menzil, uzun sersemletme. İsabet ederse seriye devam eder.': '頭槌：距離短，暈眩時間長。命中後可接續連擊。',
      'Fırlatıcı: aşağıdan yukarı iki elle savrulan kesik.': '挑空：雙手由下往上揮斬。',
      'Topuğu havaya kaldırıp balta gibi indirir: yere serer.': '高舉腳跟，如斧頭般劈下：擊倒對手。',
      'Dirsekten sonra kesik ve tepeden ezici iniş; son vuruş yere serer.': '肘擊之後接斬擊，再由上重劈；最後一擊擊倒對手。',
      'Tekmenin ardından dönen topuk tekmesi; yere serer.': '踢擊之後接迴旋踵踢；擊倒對手。',
      // Kage
      'Ters tutuşla kesik, dönen kesik ve gölge adımı: kaybolup öne geçer, dürterek belirir.': '反手斬、迴旋斬，再接影步：消失後閃到前方，現身同時突刺。',
      'Sıçrayıp ters tutuşla aşağı saplar; yere serer.': '躍起反手往下刺；擊倒對手。',
      'Gölge gibi uzun atılma kesiği; seriye devam eder.': '如影般的長距離衝刺斬；可接續連擊。',
      'Aldatma: kesecekmiş gibi parlar, dumanla geri kaçar. Erken savuşturmayı boşa çıkarır; hemen HAFİF ile gölge adımına, AĞIR ile Kage-nui’ye bağlanır.': '假動作：閃光一亮裝作要斬，隨即化煙後撤。能騙掉過早的格擋；可立刻按「輕擊」接影步，或按「重擊」接 Kage-nui。',
      'Fırlatıcı: ters tutuşla yükselen kesik.': '挑空：反手上挑斬。',
      'Ayağının dibine sis bombası atar: yakındakini sersemletir, Kage dumanın içinde geri kaçar.': '往腳邊丟出煙霧彈：讓附近的對手暈眩，Kage 則趁煙霧後撤。',
      'Üç hızlı ters kesik ve aşağı saplama; sonuncusu yere serer.': '三記快速反手斬再往下刺；最後一擊擊倒對手。',
      'Tekmeden sonra dumanda kaybolur, rakibin arkasında belirip saplar.': '踢擊之後消失在煙霧中，現身於對手身後刺擊。',
      // template row names
      'Nodachi serisi': '野太刀連擊', 'Ağır nodachi': '野太刀重擊', 'Kodachi serisi': '小太刀連擊', 'Ağır kesik': '重斬',
      'Tantō dansı': '短刀之舞', 'Çift kesik': '雙斬', 'Naginata serisi': '薙刀連擊', 'Ağır savuruş': '重揮',
      'Zincir ve orak': '鎖鏈與鐮刀', 'Zincir çekişi': '鎖鏈拉扯', 'Asa serisi': '長棍連擊', 'Ağır süpürme': '重掃',
      'Yelpaze serisi': '鐵扇連擊', 'Rüzgâr dalgası': '風浪', 'Tantō serisi': '短刀連擊', 'Ok (basılı tut: güçlü)': '射箭（按住：強力射擊）',
      'Geri + AĞIR da ok atar (basılı tut: güçlü atış); ok kalmadıysa tantō ile tepeden iner.': '後 + 重擊也能射箭（按住：強力射擊）；箭用完時，改用短刀從上方劈下。',
      // combat pop-ups
      'KI İPTALİ!': '氣取消！', 'HAVAYA!': '挑空！',
    });

    // ================================================================ COUNTER CINEMATIC + COMBO TRIAL (combat feel pass)
    // js/kaeshi-cine.js STR.kaeshi, js/combo-trial.js STR.trial, js/coach.js combo/counter tips, move list legend
    {
      const tb = (t, c) => `<i class="tb${c ? ' ' + c : ''}">${t}</i>`;
      merge(EN.STR, {
        kaeshi: {
          head: 'KAESHI-WAZA', strike: '出擊！', hits: '連擊',
          labels: {
            suriage: '沿對手的刀身上滑，斜劈而下',
            harai: '撥開對手的刀，斬其雙腿',
            nuki: '閃過攻擊，從背後斬擊',
            uchiotoshi: '將對手的刀砸落，順勢突進',
            sandan: '三斬反擊連段',
          },
        },
        trial: {
          title: '連招挑戰',
          btn: { prev: '上一個連招', next: '下一個連招', retry: '從頭開始', close: '關閉' },
          names: { chain: '基本連擊', s1: '連擊收尾', s2: '踢擊連擊', launch: '挑空', s3: '長連招' },
          desc: {
            chain: '{L} 按三下。每次都在前一擊命中時按下；連擊最後會以一記終結技收尾。',
            s1: '{L} 按兩下，再按 {H}：連擊以一記重斬收尾。',
            s2: '{L}，踢擊 {K}，再按 {H}。',
            launch: '{D} + {H} 挑空；對手飛起時按 {L}，再按 {H}。',
            s3: '兩下 {L}，{D} + {H} 挑空，{L}，{H}：五連擊。',
          },
          ready: (w) => `開始：${w}`,
          startWith: (w) => `這個連招從 ${w} 開始。`,
          early: '太早了：要在前一擊命中時按下。',
          late: '太晚了：要在招式結束前、攻擊命中的那一刻按下。',
          wrong: (got, want) => `按錯了：你按的是 ${got}，這一步需要 ${want}。`,
          dir: (want) => `缺少方向：${want}。先按住方向，再按按鍵。`,
          miss: '沒打中：攻擊沒有命中。靠近木樁一點。',
          clear: '連招完成！', clearPop: '連招完成！',
          all: '這名忍者的連招挑戰全部完成！',
        },
        coach: {
          combo: (l) => `快速按 ${l} ${l} ${l}：三連擊`,
          comboT: (l) => `連點三下 ${l}：連招`,
          counter: (l) => `防禦或格擋之後，「出擊！」出現時按 ${l}：反擊`,
          counterT: (l) => `防禦或格擋之後，「出擊！」出現時點 ${l}`,
        },
      });
      const L = Array.isArray(EN.STR.lessons) && EN.STR.lessons.find((l) => l.id === 'counter');
      if (L) L.d = '防禦或格擋之後，頭上會出現<b>出擊！</b>：在它的計時條耗盡前按下 <kbd>F</kbd>。前／後 + <kbd>F</kbd> 或 <kbd>G</kbd> 是其他反擊方式。';
      if (EN.STR.lessonsTouch) EN.STR.lessonsTouch.counter = `防禦或格擋之後，頭上會出現<b>出擊！</b>：在它的計時條耗盡前點 ${tb('攻擊', 'tb-light')}。搖桿往前／後 + ${tb('攻擊', 'tb-light')} 或 ${tb('重擊')} 是其他反擊方式。`;
      merge(EN.PHRASES, {
        'KOMBO TAMAM!': '連招完成！',
        'Nasıl okunur': '怎麼看',
        '→ rakibe doğru, ← rakipten uzağa demek: o yön tuşunu (A / D ya da ok tuşları; rakip sağındaysa D) basılı tut ve saldırı tuşuna bas. Virgül: tuşlara sırayla bas. F hafif, G ağır, R tekme, S gard.':
          '→ 表示朝向對手，← 表示遠離對手：按住該方向鍵（A / D 或方向鍵；對手在你右邊時是 D），再按攻擊鍵。逗號：依序按下按鍵。F 輕擊，G 重擊，R 踢擊，S 防禦。',
        '▶ rakibe doğru, ◀ rakipten uzağa: yön çubuğunu o yana itip düğmeye dokun. Virgül: düğmelere sırayla dokun. Antrenmandaki Kombo denemesi her seriyi adım adım gösterir.':
          '▶ 朝向對手，◀ 遠離對手：把搖桿往那個方向推，再點按鈕。逗號：依序點按鈕。訓練中的連招挑戰會一步步示範每段連擊。',
        'Gard ya da savuşturmanın ardından ekranda VUR! çıkar: altındaki çubuk bitmeden HAFİF’e bas. Yalnız HAFİF: Suriage. İleri + HAFİF: Harai (yere serer). Geri + HAFİF: Nuki (arkaya geçer). AĞIR: Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.':
          '防禦或格擋之後，畫面上會出現「出擊！」：在下方計時條耗盡前按「輕擊」。只按輕擊：Suriage。前 + 輕擊：Harai（擊倒）。後 + 輕擊：Nuki（繞到身後）。重擊：Uchiotoshi。你自己的第三次反擊就是終結技；若被格擋，連鎖會繼續。',
      });
    }

    // ================================================================ GRAPHICS QUALITY: the Graphics setting (js/gfx.js)
    // (Turkish source in i18n.js, block "graphics quality")
    merge(EN.STR, {
      gfx: {
        title: '畫質',
        levels: { auto: '自動', high: '高', medium: '中', low: '低', custom: '自訂' },
        note: {
          auto: '依你的裝置自動選擇，對戰卡頓時會自行調降。',
          high: '所有光影與特效全開。適合效能強的裝置。',
          medium: '輕微光暈，沒有陰影。適合大多數手機。',
          low: '最流暢。適合較舊的手機。',
          custom: '你自己的設定（進階）。',
        },
        now: (lv) => `目前：${lv}`,
        // Settings → Graphics → Advanced (game.js gfxAdvBuild, js/gfx.js KNOBS): the switch, the line under it, the hint on
        // the heaviest rows, one title per knob and the value words (resolution shows percentages, anti-aliasing 2× / 4×)
        adv: {
          title: '進階',
          note: '調整任何一項就會變成「自訂」；點選預設等級即可還原它的數值。',
          hot: '最容易發熱',
          knob: { scale: '解析度', msaa: '反鋸齒', bloom: '光暈', shadows: '陰影與反射', effects: '天氣與粒子' },
          val: { off: '關閉', low: '低', mid: '中', full: '完整', simple: '簡易' },
        },
      },
    });

    // ================================================================ FRAME RATE: Settings → Graphics (js/gfx.js makePacer)
    // (Turkish source in i18n.js, block "frame rate"; the numbers themselves are not translated)
    merge(EN.STR, {
      fps: {
        title: '影格率',
        show: '顯示 FPS',
        levels: { max: '最高' },
        note: {
          60: '穩定又不發燙。最適合大多數手機。',
          90: '螢幕支援時會更流暢。較耗電。',
          120: '在 120 Hz 螢幕上最流暢。較耗電。',
          max: '以螢幕所能支援的最高速度執行。',
        },
      },
    });

    // ================================================================ SETTINGS SCREEN (js/settings.js; Turkish source in i18n.js)
    merge(EN.STR, {
      set: {
        title: '設定', close: '關閉',
        tabs: { audio: '音訊', controls: '操作', gfx: '畫質', lang: '語言' },
        touch: '觸控', keys: '鍵盤', pad: '手把',
        touchNote: '觸碰螢幕之後，這裡就會顯示觸控操作的設定。',
      },
    });

    // ================================================================ LANGUAGE PICKER (js/lang-ui.js; Turkish source in i18n.js)
    // Language names are not translated: each one is written in its own language (ND.i18n.names).
    merge(EN.STR, { lang: { title: '語言', change: '變更語言', close: '關閉' } });

    // ================================================================ TOUCH HELP PER MOVEMENT MODE
    // (game.js touchHelp(): the menu's touch help follows the movement mode; Turkish source in i18n.js, block
    // "touch help per movement mode")
    merge(EN.STR, {
      thelp: {
        title: { float: '搖桿', fixed: '固定搖桿', dpad: '十字鍵' },
        float: { walk: '拇指放在空白的半邊螢幕上滑動：移動', jump: '往上推：跳躍', guard: '往下拉：防禦', dash: '往側邊快速撥兩下：衝刺' },
        fixed: { walk: '按住搖桿中心往側邊推：移動', jump: '往上推：跳躍', guard: '往下拉：防禦', dash: '往側邊快速撥兩下：衝刺' },
        dpad: {
          walk: '按住：移動', step: '快速點一下：走一小步', jump: '點一下：跳躍', guard: '按住：防禦',
          dash: '連按兩下：衝刺', both: '按在兩個按鈕之間可同時觸發（▶ + ▲ = 向前跳）',
        },
        edit: (b) => `${b}：可以把任何按鈕拖到想要的位置，並調整大小和不透明度。位於設定 → 操作。`,
      },
    });

    // ================================================================ SHARED LABELS (static HTML / move list text that is the same word in Turkish)
    merge(EN.PHRASES, { 'Shuriken': '手裏劍', 'KI': '氣' });

    // Persistent character journeys.
    merge(EN.STR, { menu: { arcadeDesc: '每位忍者都有一段八場對戰的旅程。從下一位對手接著打，解鎖角色結局與大師印記。' }, sel: { title: { arcade: '街機模式 · 角色旅程' } },
      journey: {
        start: '開始旅程',
        resume: (i, n) => '繼續 · ' + i + '/' + n + '',
        ending: '觀看結局',
        replay: '重玩旅程',
        badge: '大師印記',
        completed: '旅程完成',
        progress: (i, n) => '已完成 ' + i + '/' + n + ' 場對戰 · 進度已儲存',
        reward: '獎勵：角色結局與永久的大師印記',
        saved: '每場勝利都會儲存。中途離開對戰算一次重試。',
        menu: (done, active) => '已完成 ' + done + ' 段旅程 · ' + active + ' 段進行中',
        clearReward: '已獲得大師印記 · 角色結局已解鎖'
      }
    });

    // ================================================================ PROGRESS / ACCOUNT (Settings → Progress, Hall of Champions;
    // js/settings.js, js/banzuke.js; Turkish source in i18n.js, block "account and recovery code")
    merge(EN.STR, {
      set: { tabs: { save: '進度' } },
      acct: {
        title: '保存你的進度',
        cgOn: (n) => `CrazyGames 帳號：${n}。你的稱號、冠軍配色、段位和分數都會存到你的帳號。`,
        cgWait: (n) => `CrazyGames 帳號：${n}。正在連線到你的帳號…`,
        cgFail: (n) => `CrazyGames 帳號：${n}。目前無法連上你的帳號；新的分數暫時存在這台裝置上。`,
        cgSave: '將進度存到你的 CrazyGames 帳號',
        cgSaveNote: '登入後，你的稱號、冠軍配色和分數都會轉移到帳號中，在每台裝置上都能使用。',
        rcTitle: '復原碼',
        rcNote: '請把這組代碼記下來。在新裝置上於此輸入，就能找回你的稱號、冠軍配色、段位和分數。',
        rcShow: '顯示代碼', rcNew: '產生新代碼', rcNewDone: '新代碼已產生；舊代碼已失效。',
        rcNeedName: '請先用暱稱儲存一筆分數，才能取得復原碼。',
        rcEnter: '輸入復原碼', rcGo: '復原',
        rcDone: (n, c) => `歡迎回來，${n}！你的進度已復原。你的新復原碼：${c}`,
        err: { bad_code: '無法辨識這組代碼。請檢查字元是否正確。', rate: '嘗試次數過多。請稍後再試。', offline: '無法連上伺服器。請檢查你的網路連線。', banned: '這個身分無法使用。', error: '發生錯誤。請再試一次。' },
        local: '這裡無法使用線上儲存；你的進度會保存在這台裝置上。',
        offline: '你目前處於離線狀態；你的進度會保存在這台裝置上。',
        loading: '載入中…',
      },
      lb: { savedLocalAccount: (r) => (r ? `這台裝置第 ${r} 名 · 目前無法連上你的帳號` : '已存在這台裝置 · 目前無法連上你的帳號') },
    });

    // ================================================================ PRIVACY (js/privacy.js; Turkish source in i18n.js, block
    // "privacy"). The policy page itself (privacy.html) is English + Turkish; other languages see the English part.
    merge(EN.STR, {
      priv: {
        notice: 'Shadow Duel 會儲存你的暱稱和分數，用於線上排行榜。',
        policy: '隱私權政策', terms: '使用條款', both: '隱私權政策與使用條款',
        ok: '確定', label: '隱私權聲明',
      },
    });

    // ================================================================ FIRST-FIGHT RALLY TUTORIAL: js/tutorial.js STR.tutor and
    // Training → Parry drill (Turkish source in i18n.js, block "rally tutorial")
    merge(EN.STR, {
      menu: { trainDrill: '格擋練習' },
      tutor: {
        defend: '防禦！', attack: '攻擊！', again: '再來！',
        pass: {
          freeze: (l, g) => `時間暫停：按 ${g} 防禦，按 ${l} 反擊`,
          slow: (l, g) => `慢動作：圓圈收縮時按 ${g}，接著按 ${l}`,
          real: (l, g) => `全速：按 ${g} 防禦，按 ${l} 反擊，連續兩次`,
        },
        fail: {
          early: '太早了！要在刀刃落下前一刻防禦。',
          late: '太晚了！要在刀刃落下前一刻防禦。',
          slow: '太晚了！要趁「攻擊！」還在時反擊。',
          atk: '先防禦，再攻擊！',
          miss: '我們再試一次。',
        },
        mastered: '精通！', masteredSub: '防禦、反擊、再重複',
        warm: (l) => `熱身：按 ${l} 三下`,
        nudge: (k) => `按 ${k}`, nudgeT: (k) => `點 ${k}`,
      },
    });

    // ================================================================ NEW PLAYER: the select screen's one-time greeting
    // (game.js openSelect), the VS goal line's "?" (arcade.js openVs) and the just-in-time tips (js/coach.js ND.coach.tips;
    // arguments: key / button chips, lessons: the menu names of Training and Tutorial). Turkish source in i18n.js.
    merge(EN.STR, {
      onb: { selIntro: '選擇你的忍者：每位都有自己的旅程', more: '詳情' },
      tips: {
        head: '提示',
        ki: (k) => `氣已滿！${k}：施展奧義`,
        gbreak: (k, h) => `對手一直在防禦：用 ${k} 踢擊或 ${h} 重斬累積它的黃色條，就能破防`,
        gbreakH: (h) => `對手一直在防禦：用 ${h} 重斬累積它的黃色條，就能破防`,
        posture: (g) => `你的架勢條快滿了：先後退，或用 ${g} 格擋`,
        dash: (a) => `連按兩下 ${a}：衝刺`,
        shuriken: (t) => `${t}：擲出手裏劍`,
        heavy: (h) => `${h}：重斬，較慢但更有力`,
        lessons: (a, b) => `完整課程：${a} → ${b}`,
        controls: (a, b) => `可以在 ${a} → ${b} 中移動按鈕和調整大小`,
      },
    });

    // ================================================================ online "play with a friend" (js/online.js: ND.STR.online)
    merge(EN.STR, {
      online: {
        title: '與好友對戰',
        menuSub: '線上決鬥 · 分享連結或 6 字母代碼',
        homeSub: '建立房間並把連結傳給好友，或輸入好友傳給你的代碼。',
        create: '建立房間',
        join: '加入',
        codePh: '代碼',
        haveCode: '房間代碼',
        room: '房間',
        linkLabel: '邀請連結',
        back: '返回',
        leave: '離開房間',
        copy: '複製連結',
        copied: '已複製',
        share: '分享',
        invite: '邀請好友',
        shareText: (c) => `來 Shadow Duel 跟我決鬥！房間 ${c}`,
        inviteNote: '傳送連結，或把代碼告訴你的好友。',
        waitFriend: '等待好友加入…',
        joining: '正在尋找房間…',
        connecting: '正在連線到好友…',
        connected: '已連線',
        you: '你',
        friend: '好友',
        friendTag: '好友',
        waitPick: '選擇中…',
        pickTitle: '你的角色',
        arenaTitle: '競技場',
        arenaHost: '由好友選擇競技場',
        ready: '準備好了',
        notReady: '尚未準備',
        readyWait: '等待好友準備…',
        bothReady: '即將開始…',
        ping: (ms) => `延遲 ${ms} ms`,
        badCode: '房間代碼是 6 個字母。',
        noRoom: '找不到這個代碼的房間。請和好友確認代碼。',
        full: '這個房間已滿。',
        expired: '10 分鐘內沒有人加入，房間已關閉。',
        noDirect: '無法直接連上好友的網路。請換個網路試試（Wi-Fi／行動數據）。',
        retry: '再試一次',
        noConnect: '無法連線到好友。請檢查你的網路連線後再試一次。',
        version: '你和好友的遊戲版本不同。請兩人都重新整理頁面。',
        signalDown: '無法連上遊戲伺服器。請檢查你的網路連線。',
        friendLeft: '好友已離開房間。',
        waitIn: (s) => `等待好友回來… ${s}`,
        away: (s) => `好友切換到其他畫面了… ${s}`,
        leaveQ: '要離開對戰嗎？',
        leaveSub: '這場會判好友獲勝。',
        stay: '繼續對戰',
        leaveMatch: '離開',
        win: '你贏了',
        lose: '你輸了',
        draw: '平手',
        over: '對戰結束',
        whyDrop: '好友的連線中斷了。你獲勝（不列入紀錄）。',
        whyLeft: '好友離開了對戰。',
        whyAway: '你離開期間，對戰已經結束。',
        whyDesync: '對戰不同步（連線問題），因此這場不算。',
        rematch: '再戰一場',
        rematchWait: '等待好友…',
        rematchAsk: '再戰一場（好友想再打）',
        change: '更換角色',
        rounds: (a, b) => `回合 ${a} – ${b}`,
        turning: (s) => `好友正在轉動手機… ${s}`,
        paused: '已暫停',
        whyPauseWin: '好友沒有及時回來。你獲勝（不列入紀錄）。',
        whyPauseLose: '你沒有及時回來，對戰已結束。',
        whyPauseBoth: '你們兩人都沒有及時回來，對戰已結束。',
      },
    });

    // ================================================================ ranked duel (js/ranked.js: ND.STR.ranked)
    merge(EN.STR, {
      ranked: {
        title: '排位賽', menuSub: '隨機對手 · 積分、階級與賽季', offline: '排位賽目前暫停中',
        season: (n) => `第 ${n} 賽季`, endsIn: (d) => `${d} 天後結束`, endsToday: '今天結束',
        rating: '積分', record: (w, l, d) => `${w} 勝 · ${l} 敗` + (d ? ` · ${d} 和` : ''), placement: (a, b) => `定級賽 ${a}/${b}`,
        place: (n) => `排名第 ${n}`, find: '尋找對手', findUnranked: '尋找對手（非排位）', board: '排行榜', how: '規則說明',
        howLines: ['伺服器會找積分相近的對手；等待越久，範圍就越寬。', '雙方都接受後，各自在看不到對方的情況下選擇角色（只能選已解鎖的角色）。',
          '三回合兩勝制。中途離開即判落敗。', '只有兩台裝置回報相同結果時，積分才會變動。每個賽季為期 4 週；第 1 名可獲得特別服裝。'],
        reward: '賽季第 1 名：特別服裝，名字還會登上冠軍殿堂',
        signIn: '登入即可賺取積分', guestNote: '以訪客身分只能進行非排位對戰。', nickNote: '設定暱稱即可參加排位賽。',
        back: '返回', you: '你', titleLbl: '稱號', noTitle: '無',
        searching: '正在尋找對手…', window: (n) => `積分範圍 ±${n}`, windowAny: '不限積分',
        warm: '等待時先和電腦熱身', warmTag: '熱身 · 電腦 · 非排位', searchShort: '搜尋中', warmBack: '回到搜尋', cancel: '取消',
        none: '目前沒有對手。', foundTitle: '找到對手了！', accept: '接受', decline: '拒絕',
        ranked: '排位', unranked: '非排位 · 不計積分',
        why: { guest: '有玩家是訪客', same_network: '你們在同一個網路', pair_limit: '今天你們已經打過 3 場排位賽', daily_limit: '已達每日排位賽上限' },
        waitOpp: '等待對手接受…', touch: '觸控', keys: '鍵盤／手把', placementTag: '定級賽', guestTag: '訪客',
        declined: '對手沒有接受 · 重新搜尋中', youDeclined: '你拒絕了這場對戰。', penalty: (s) => `你最近拒絕了多場對戰：${s} 秒後才能再次搜尋。`,
        suspended: '你的排位帳號正在審查中（爭議過多）。其他模式仍可遊玩。',
        pickTitle: '選擇你的角色', pickSub: '對手看不到你選了誰', lock: '鎖定', lockedIn: '已鎖定', oppPicking: '對手選擇中…', oppLocked: '對手已鎖定',
        lockedFighter: '尚未在單人模式中解鎖', costume: '服裝', plain: '原始配色',
        connecting: '正在連線到對手…', noConnect: '無法連線到對手；這場不算。重新搜尋中…',
        leaveQ: '要離開對戰嗎？', leaveSub: '這場排位賽將判你落敗。', stay: '繼續對戰', leave: '離開',
        waitIn: (s) => `等待對手回來… ${s}`, away: (s) => `對手切換到其他畫面了… ${s}`, turning: (s) => `對手正在轉動手機… ${s}`, paused: '已暫停',
        confirming: '正在確認結果…', win: '你贏了', lose: '你輸了', draw: '平手', over: '對戰結束',
        delta: (d) => (d >= 0 ? '+' : '−') + Math.abs(d) + ' 分', nc: '這場不計分', disputed: '兩台裝置回報的結果不同：這場對戰正在審查中，積分沒有變動。',
        ncWhy: { desync: '兩台裝置對戰鬥的計算結果不同（連線問題）', connection: '雙方的連線都中斷了', input_mismatch: '兩台裝置的操作紀錄不一致', abandoned: '雙方都離開了', no_second_report: '始終沒有收到對手的結果', mixed: '結果不一致' },
        promoted: '晉級！', demoted: '降級了', placementDone: '定級完成！', pending: '結果稍後就會出現在排行榜上。',
        findAgain: '再次搜尋', rematch: '再戰一場', rematchWait: '等待對手…', rematchAsk: '再戰一場（對手想再打）', menu: '選單',
        youLeft: '你離開了對戰：判定落敗。', oppLeft: '對手離開了對戰：你獲勝。', silent: '對手的連線中斷了。', rounds: (a, b) => `回合 ${a} – ${b}`,
        unrankedNote: '非排位對戰',
        ghostFound: '真實玩家的幻影登場了',
        ghostHouseName: (n) => `道場幻影 · ${n}`, ghostHouseFound: '道場幻影登場了', ghostHouseNote: '由電腦以道場的典型風格對戰。並非真人即時對戰。', ghostName: (n) => `${n} 的幻影`, ghostTag: '幻影',
        ghostNote: '由電腦模仿這位真實玩家的風格對戰。並非真人即時對戰。',
        ghostReady: '幻影已就緒',
        ghostLeft: '你離開了幻影對戰：判定落敗。', aiTag: 'AI',
        hallTab: '排位賽', hallDesc: (g) => `本賽季最佳 · 完成 ${g} 場排位賽即可上榜`, champs: '歷屆冠軍', champOf: (n) => `第 ${n} 賽季冠軍`,
        noChamps: '還沒有賽季冠軍。', me: (p) => `你的名次：第 ${p} 名。`, meNone: '參加排位賽就能登上榜單。', empty: '本賽季還沒有人上榜。',
        tierDesc: ['足輕', '浪人', '武士', '旗本', '大名', '將軍'],
        rulesBtn: '排位賽規則', rulesTitle: '排位賽規則', rulesSub: '階級、積分與賽季', rTiers: '階級', rYou: '你',
        rNext: (n, name) => `距離 ${name} 還差 ${n} 分`, rTop: '你已身處最高階級', rPlacing: (a, b) => `定級賽 ${a}/${b}：完成後就會顯示你的階級`,
        rPlacement: '定級賽', rPlaceLine: (a, b) => `你的前 ${a} 場排位賽是定級賽（之後的賽季為 ${b} 場），完成後就會顯示你的階級。`,
        rPoints: '積分', rPointsLines: ['贏了加分，輸了扣分；平手只會小幅變動。', '擊敗比你強的對手加得更多；輸給比你弱的對手扣得更多。', '中途離開對戰視同落敗。'],
        rSeason: '賽季', rSeasonLine: (d, left) => `每個賽季為期 ${d} 天 · ${left}。`,
        rSeasonEnd: (p) => `賽季結束時，你的積分會往 1500 回調一半，並要重新進行 ${p} 場定級賽；你達到的最高階級會保留為徽章。`,
        rReward: (list, n) => `賽季第 1 名可獲得：${list}（榜上至少要有 ${n} 名玩家）。`, rCostumeAll: (x) => `${x}（所有角色適用）`, rRewardAny: '特別服裝與稱號',
        rBoard: '排行榜', rBoardLine: (g) => `上榜條件：本賽季完成 ${g} 場計分對戰，並完成定級賽。`,
        rFighters: '角色', rFightersLine: '可以選擇你在單人模式中已解鎖的角色。',
        aiNote: '線上玩家較少時，你可能會配對到模仿真實玩家風格的 AI 對手。', gotIt: '知道了',
        err: { network: '無法連上伺服器。請檢查你的網路連線。', bad_version: '遊戲有新版本了：請重新整理頁面。', busy: '目前排隊人數很多，請稍後再試。',
          rate_limited: '嘗試次數過多，請稍等一下。', disabled: '排位賽目前暫停中。', banned: '這個帳號無法參加排位賽。', other: '發生錯誤，請再試一次。' },
      },
    });

    // ================================================================ LEVEL + SHADOW PASS (js/level.js, js/pass.js)
    // English: L.en in js/i18n-pass.js; the on-demand languages keep these texts in their own file.
    merge(EN.STR, {
      pass: {
        k: '影', lv: 'Lv',
        level: (n) => `等級 ${n}`,
        xp: (a, b) => `${a} / ${b} XP`, xpMax: (n) => `共 ${n} XP`, plus: (n) => `+${n} XP`,
        name: '影之通行證', season: (n) => `第 ${n} 賽季`, left: (d) => `剩餘 ${d} 天`, lastDay: '最後一天',
        tier: (t, n) => `第 ${t}/${n} 階`, ready: (n) => `${n} 個獎勵可領取`,
        free: '免費', bonus: '暗影', bonusAds: '每個獎勵：看一則廣告', bonusWait: (n) => `不看廣告：晚 ${n} 階開放`,
        claim: '領取', claimAll: (n) => `全部領取（${n}）`, owned: '已領取', watch: '看廣告', milestone: '免費', opensAt: (t) => `第 ${t} 階開放`,
        online: '需要連線', soon: '更多階段即將推出', soonXp: '你的 XP 會繼續累積', close: '關閉', tabs: { pass: '通行證', profile: '個人檔案' },
        rows: { win: '勝利', loss: '參戰', rounds: '回合', perfect: '完美', rally: '反擊連鎖', counter: '反擊', parry: '格擋', short: '速戰速決', boost: '加成', daily: '每日首勝', streak: '連續天數', clear: '旅程', trial: '連招挑戰', tutorial: '教學' },
        streakN: (n) => `第 ${n} 天`,
        up: '等級提升', got: '新獎勵',
        boostName: (n) => `×1.5 XP · ${n} 場對戰`, honorName: (n) => `+${n} 榮譽`,
        gotDup: (n) => `已經擁有：改為 ${n} 場對戰 ×1.5 XP`, boostLeft: (n) => `×1.5 XP · 剩餘 ${n} 場`,
        kinds: { cos: '服裝', title: '稱號', badge: '徽章', frame: '外框', trail: '刀光', boost: 'XP 加成', honor: '榮譽' },
        use: '裝備', inUse: '已裝備', none: '尚未擁有', wearHint: '在角色選擇畫面的「配色」列中換上服裝。',
        heads: { titles: '稱號', badges: '徽章', frames: '外框', trails: '刀光', costumes: '服裝', seals: '旅程印記' },
        total: (n) => `共 ${n} XP`, streak: (n) => `連續 ${n} 天`,
        daily: '每日首勝：+100 XP', dailyDone: '今日首勝：已完成',
        seal: { 1: '旅程完成', 2: 'Menkyo：旅程完成 2 次', 3: 'Kaiden：旅程完成 3 次' },
        clears: (n) => `旅程完成 ${n} 次`,
        next2: '第 2 次完成旅程：Menkyo 服裝與稱號', next3: '第 3 次完成旅程：Kaiden 之影與稱號',
        rank: { 2: 'Menkyo', 3: 'Kaiden' }, cos2: (n) => `${n} · Menkyo 配色`, cos3: (n) => `${n} · Kaiden 之影`,
        themes: { sakura: '櫻花', ember: '餘燼', frost: '寒霜', jade: '翡翠', ash: '灰燼', moon: '月光', lotus: '蓮花', storm: '風暴', yami: '闇' },
        items: {
          trail_sakura: '櫻花刀光', trail_ember: '餘燼刀光', trail_frost: '寒霜刀光', trail_jade: '翡翠刀光', trail_violet: '紫色刀光', trail_gold: '金色刀光',
          title_novice: '新手之刃', title_wanderer: '流浪劍客', title_duelist: '決鬥者', title_parry: '鋼鐵之壁', title_ronin: '浪人', title_nightblade: '夜之刃', title_s1: '第 1 賽季之影',
          badge_blade: '刀刃徽章', badge_moon: '月之徽章', badge_fire: '火焰徽章', badge_snow: '白雪徽章', badge_sakura: '櫻花徽章', badge_dragon: '龍之徽章', badge_kage: '影之徽章',
          frame_bronze: '青銅外框', frame_silver: '白銀外框', frame_crimson: '赤紅外框', frame_jade: '翡翠外框', frame_gold: '黃金外框',
        },
      },
    });

    // ================================================================ 1.3.2 SHADOW PASS: 30 tiers, fight flair, progress rewards,
    // the ranked shield, the Profile screen (English: X.en in js/i18n-pass.js; flair: the fight flair's names, js/flair.js ids)
    merge(EN.STR, {
      pass: {
        kinds2: { pose: '勝利姿勢', hitfx: '打擊特效', slash: '反擊斬', aura: '氣之靈光', ko: 'KO終結', card: '名牌', arena: '場地變體', music: '選單音樂', rkey: '鑰匙', akey: '鑰匙', ticket: '券', shield: '護盾' },
        items2: { key_rival: '挑戰鑰匙', key_arena: '場地鑰匙', ticket_trial: '試用券', shield: '排位護盾' },
        heads2: { title: '稱號', flair: '戰鬥裝飾', arenas: '場地變體', music: '選單音樂', items: '道具' },
        profile: '個人資料',
        profileSub: '稱號 · 服裝 · 裝飾',
        passTab: '影之通行證',
        tapEquip: '點擊裝備',
        plain: '普通',
        usual: '預設',
        noneYet: '從影之通行證取得',
        shields: (n, m) => `排位護盾 ${n}/${m}`,
        shieldHelp: '排位賽輸掉一場不扣分；每天一次，自動生效。',
        tickets: (n) => `試用券：${n}`,
        ticketHelp: '用 3 場電腦對戰試用一名未解鎖的忍者：在角色選擇畫面點選該忍者。',
        useTicket: (n) => `試用券 · ${n}場`,
        useTicketSub: (n) => `持有 ${n} 張`,
        ticketLeft: (n) => `試用：還剩 ${n} 場`,
        keyRival: (name) => `挑戰已開啟：${name}`,
        keyArena: (name) => `場地已開啟：${name}`,
        keyHonor: (n) => `已無可開啟之物：+${n} 榮譽`,
        shieldGot: (n, m) => `排位護盾：${n}/${m}`,
        shieldFull: (n) => `護盾已滿：改為 +${n} 榮譽`,
        shieldOff: (n) => `這裡沒有排位賽：改為 +${n} 榮譽`,
        shieldUsed: '護盾已生效：未扣分',
        rankedHonor: (n) => `+${n} 榮譽`,
        variant: '變體',
        flair: { pose_tenchi: '舉刃向天', pose_rei: '行禮', pose_hiza: '跪姿殘心', pose_katsugi: '扛刀於肩', pose_kissaki: '下一個就是你', hitfx_kinpaku: '金箔打擊', hitfx_aizome: '靛藍墨', hitfx_sakura: '櫻花綻放', hitfx_kitsunebi: '狐火', hitfx_raijin: '雷神火花', slash_kin: '金之刃', slash_sumi: '墨筆', slash_hana: '花瓣之風', slash_rai: '雷斬', aura_kitsunebi: '狐火靈光', aura_raiun: '風暴靈光', aura_hana: '繁花靈光', aura_gekko: '月光靈光', ko_enso: '圓相終結', ko_hanafubuki: '花吹雪', ko_raiko: '落雷', ko_mikazuki: '新月', card_seigaiha: '青海波', card_yozakura: '夜櫻', card_ryu: '龍之漆', card_tsukiyo: '月下松林', card_asanoha: '麻葉金紋', arena_temple_snow: '雪中神社', arena_rain_moon: '月下竹林', arena_snow_night: '雪峰之夜', arena_market_rain: '雨夜市集', music_haru: '春之庭', music_yuki: '雪月', music_matsuri: '祭典之夜', pass1_akane: '月影華服' },
      },
    });

    void dec; void fmtTime; void num;
  };

  // ---------------------------------------------------------------- journey texts (js/journey-text.js reads ND.JOURNEY_COPY)
  // Same lists, same order and same counts as the `en` entry in js/journey-text.js (ui 17, goals 10, titles 13, endings 13).
  (ND.JOURNEY_COPY || (ND.JOURNEY_COPY = {}))['zh-TW'] = {
    ui: ['角色旅程', '最終對手', '選擇性精通', '贏下這場對戰就能保住星星。', '已獲得精通之星', '未獲得星星 · 重玩時再挑戰', '精通之星', '集滿 8 顆中的 6 顆星完成旅程，即可獲得稱號與傳承配色。星星在重玩之間會保留。', '原始配色', '傳承配色', '外觀', '獲得 6 顆精通之星，並完成這名角色的旅程。', '你先前的旅程與獎勵都已保留。重玩即可探索新的路線。', 'Shura 決鬥：完成 3 名不同角色的旅程。', '贏下這場決鬥即可解鎖', '旅程完成', '章節'],
    goals: ['格擋', '反擊命中', '重擊命中', '踢擊命中', '空中命中', '衝刺攻擊命中', '連招第三擊命中', '飛行道具命中', '奧義命中', '破防'],
    titles: ['赤紅之誓', '無拘之風', '山之心', '冬日足跡', '月下之花', '不倒之旗', '摘下面具的勇氣', '無聲的承諾', '掙脫鎖鏈之虎', '敞開的手', '靜謐微風', '遙遠地平線', '第二道曙光'],
    endings: ['Akane 在 Ren 面前放下了刀。她將以傳授而非復仇，重建自己的流派。', 'Aoi 與 Akane 了結了昔日未完的決鬥，以平起平坐之姿離開寺院，自由選擇自己的道路。', 'Kuro 與 Tetsu 放下了武器。山路再次向村民敞開。', 'Yuki 握住了 Hana 伸出的手。她第一次在雪地裡，與別人並肩留下足跡。', 'Hana 帶著 Yuki 回到燈籠祭。她最後的舞蹈裡，多了一位朋友的位置。', 'Tetsu 贏得了 Kuro 的敬重，將旗幟插在山口：從此不會再有村民被拒於門外。', 'Ren 識破了 Kage 的把戲，摘下了自己的面具。他不再需要靠恐懼讓人聽見自己的聲音。', 'Kage 讓 Ren 看見自己的臉，隨後消失無蹤。這一次，他的承諾比他的影子活得更久。', 'Tora 把鎖鏈放在 Jin 的長棍旁。渡河之處，不再屬於任何主人。', 'Jin 制止了 Tora，卻沒有取他性命。瀑布旁，一位新弟子前來請教第一課。', 'Mai 用扇子接住了 Tsubame 的最後一支箭。她們的較量以一個鞠躬收場，而非怨恨。', 'Tsubame 終於讀懂了 Mai 的風。她留下最後一支箭未射，轉身朝新的地平線而去。', 'Shura 不戴王冠，面對 Akane。失敗不再定義他；下一課將在黎明開始。'],
  };

  if (ND.i18n && ND.i18n.loaded) ND.i18n.loaded('zh-TW');
})(window.ND = window.ND || {});
