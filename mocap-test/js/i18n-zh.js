// Shadow Duel — Simplified Chinese catalog for ND.i18n, translated from the English one (js/i18n-en.js).
// Loaded on demand: js/i18n.js loads this file only when the game runs in this language. Same structure as i18n-en.js.
// Glossary: guard = 防御 (button 防御; to block = 格挡), parry = 弹反, counter = 反击, posture = 架势 (bar = 架势条),
//   ki = 气 (bar = 气槽), ki technique = 气技, blade lock = 拼刀, dash = 冲刺, combo = 连击, light / heavy slash = 轻斩 / 重斩,
//   kick = 踢击, sweep = 扫斩, cross-up = 绕背, dive = 下劈, rally = 对拆 (banner 连环对拆), finisher = 终结技,
//   launcher = 挑空, juggle = 浮空连击, dummy = 木桩, shuriken = 手里剑, arcade = 街机模式, training = 训练,
//   tutorial = 教程, ranked = 排位赛, journey = 征途, mastery star = 精通星, Hall of Champions = 冠军殿堂,
//   shadow (ghost opponent) = 影子, season = 赛季, round = 回合, Monthly Tournament = 月度锦标赛, Dan Trial = 段位试炼,
//   leaderboard = 排行榜, CPU = 电脑, difficulty Apprentice / Master / Legend = 学徒 / 大师 / 传说, pts = 分.
//   Shadow Pass = 影之通行证 (bonus track 暗影), level = 等级 (tag LV), tier (pass) = 阶, XP = XP (经验 in prose),
//   claim = 领取, costume = 服装, title = 称号, badge = 徽章, frame = 边框, blade trail = 刀光, booster = 加成,
//   placement = 定级赛, rating / points = 积分, journey seal = 征途印.
//   Fighter names, romaji technique names, Kyu / Dan rank names and weapon names stay in Latin letters.
// Control changes that ship with this build are written into the text: P pauses (Escape is CrazyGames'
// fullscreen key), ⌫ goes back, player 2 throws shuriken with I.
(function (ND) {
  'use strict';
  (ND.I18N_CATALOGS || (ND.I18N_CATALOGS = {}))['zh'] = function (I, EN) {
    const merge = I.merge;
    const num = (n) => I.num(n);
    const dec = (x) => I.dec(x);
    const fmtTime = (s) => I.time(s);

    // ================================================================ UI tables (ND.STR)
    merge(EN.STR, {
      menu: {
        brand: (nc, na) => `${nc}名战士，${na}座竞技场，还有一位隐藏大师。实时刀剑交锋、拼刀、弹反、破架势、气技与布娃娃物理。`,
        arcade: '街机模式',
        arcadeDesc: '难度步步攀升，逐一击败对手，最后还有隐藏大师在等你。获胜即可解锁新忍者和竞技场。',
        arcadeProg: (best, c, ct, a, at) => `${best ? '最佳 ' + num(best) + ' · ' : ''}已解锁 ${c}/${ct} 名忍者 · ${a}/${at} 座竞技场`,
        train: '训练',
        trainDesc: '对着木桩自由练习，或一步步学习',
        trainFree: '自由练习',
        trainTut: '教程',
        watchShort: '随机两名忍者，传说难度AI',
        specialKey: '气技（气槽满）',
        single: '单场对战', singleDesc: '对战电脑或双人对战',
      },
      sel: {
        title: { '2p': '选择你的忍者', cpu: '选择你的忍者', arcade: '街机模式 · 选择你的忍者', train: '训练 · 选择你的忍者', tutorial: '教程 · 选择你的忍者', tourney: '月度锦标赛 · 选择你的忍者', dan: '段位试炼 · 选择你的忍者' },
        who1: { '2p': '玩家1 · A / D 选择，F 确认', def: '你 · A / D 选择，F 确认' },
        who2: { '2p': '玩家2 · ← / → 选择，K 确认', cpu: '对手（电脑） · ← / → 选择', train: '木桩 · ← / → 选择' },
        go: { def: '开始战斗', arcade: '开始街机模式', train: '开始训练', tutorial: '开始教程', tourney: '开始锦标赛', dan: '开始试炼' },
        random: '随机',
        arena: '竞技场',
        locked: '未解锁',
        lockMsg: (name, hint) => `${name}未解锁 · ${hint}`,
        keyHint: '<kbd>Enter</kbd> 开始 · <kbd>⌫</kbd> 返回',
      },
      hint: {
        wins: (n, cur) => `在街机模式中赢下${n}场（${Math.min(cur, n)}/${n}）`,
        clear: '通关一次街机模式',
        boss: '在街机模式中击败最终首领',
        arena: '在街机模式中于此竞技场赢下一场',
      },
      toast: {
        newChar: (name) => `解锁新战士：${name}`,
        newArena: (name) => `解锁新竞技场：${name}`,
        newBest: (s) => `新纪录：${num(s)}分`,
        lesson: (t) => `课程完成：${t}`,
        tutDone: '教程完成！',
        perf: '已降低画质以提升流畅度',
      },
      vs: {
        stage: (i, n) => `第${i}战 / 共${n}战`,
        boss: '最终决战',
        go: '开战！',
        quit: '退出街机模式',
        keys: '<kbd>Enter</kbd> / <kbd>F</kbd> 开始 · <kbd>⌫</kbd> 退出',
        unknown: '？',
      },
      hud: { you: '你', cpu: '电脑', dummy: '木桩', stage: (i, n) => `${i}/${n}`, boss: '最终首领', inf: '∞', lockSolo: '狂按 F / K！', lockDuo: '狂按轻斩或重斩！' },
      end: {
        rematch: '再战', change: '更换战士', menu: '主菜单',
        winTitle: '胜利属于你',
        winSub: (i, n, pts) => `第${i}/${n}战已通过 · +${num(pts)}分`,
        next: '下一战',
        bossNext: '迎战终局',
        lossTitle: '战败',
        lossSub: (name) => `这次${name}略胜一筹。再来一次吧。`,
        retry: '再试一次',
        quit: '退出街机模式',
      },
      ending: {
        head: '结局',
        rows: { fights: '战斗', time: '总用时', retries: '重试次数', perfect: '完美回合', score: '得分', best: '最佳' },
        newBest: '新纪录！',
        menu: '主菜单',
        again: '再玩一次',
        unlocked: '已解锁',
        fightPts: '战斗得分',
        bonus: '通关奖励',
      },
      score: {
        hud: '得分',
        rows: { hit: '命中', combo: '连击', counter: '反击', defense: '防守', pressure: '压制', special: '气技', round: '胜利', perfect: '完美', hp: '剩余体力', time: '时间奖励' },
        total: '本场得分',
        diff: (name, m) => `含${name} ×${dec(m)}`,
        best: (s) => `你的最佳：${num(s)}`,
        newBest: '新纪录！',
        arcadeTotal: (s) => `街机总分：${num(s)}`,
        lossNote: (s, pen) => `本次挑战不计分 · 街机总分 ${num(s)} · 每次重试 −${num(pen)}`,
        clearBonus: (c, n) => `+${num(c)}${n ? ' · 无重试 +' + num(n) : ''}`,
        lossCpu: '战败 · 只有胜利才能上榜',
        cpuBoardHint: '在传说难度下获胜即可登上排行榜',
      },
      lb: {
        menu: '排行榜',
        menuDesc: '街机与传说难度纪录',
        title: '排行榜',
        back: '返回',
        boards: { arcade: '街机模式', cpu_efsane: '传说电脑' },
        boardDesc: { arcade: '完整通关一次街机模式的总分', cpu_efsane: '战胜传说难度电脑的单场得分' },
        all: '全部',
        status: { loading: '加载中…', online: '在线排行榜', readonly: '在线排行榜 · 仅查看', local: '本地排行榜', error: '出错 · 本地排行榜', offline: '离线 · 本地排行榜' },
        empty: '还没有成绩。快来当第一名！',
        loadErr: '排行榜加载失败。',
        you: '你', youTag: '你', player: '玩家',
        nick: '昵称', nickPh: '你的昵称', nickSave: '保存', nickEdit: '修改',
        nickAsk: '本地排行榜昵称：',
        saving: '保存中…',
        savedOnline: (r) => `在线排名：第${r}名`,
        savedOnlineNoRank: '已保存到在线排行榜',
        savedOnlineAll: (r) => `在线总排名：第${r}名`,
        platSignIn: '登录后即可上传成绩到在线排行榜',
        platPending: '已保存在本设备 · 登录后即可上传到在线排行榜',
        savedOnlineGap: (r, g) => `在线排名：第${r}名 · 距前十还差${g}分`,
        reason: {
          needName: '起个昵称即可加入在线排行榜',
          offline: '无网络连接——成绩已保留，联网后自动上传',
          rate: '提交太频繁——成绩稍后上传',
          daily: '已达今日提交上限——成绩仅保存在本地',
          week: '本月已结束——此成绩不计入新月份',
          invalid: '成绩无效',
        },
        nickErr: {
          nick_length: '昵称需为3–16个字符',
          nick_chars: '只能使用字母、数字、空格和 _ . -（至少一个字母）',
          nick_bad: '该昵称不可用，请换一个',
          rate_limited: '请稍等片刻再试',
        },
        nickErrDef: '昵称保存失败',
        nickAskOnline: '在线排行榜昵称：',
        savedLocal: (r) => (r ? `本地排行榜第${r}名` : '已保存到本地排行榜'),
        rejected: '成绩未能保存——仅限本地排行榜',
        quota: '在线排行榜已满——成绩仅保存在本地',
        open: '排行榜',
        keys: '<kbd>←</kbd> <kbd>→</kbd> 榜单 · <kbd>↑</kbd> <kbd>↓</kbd> 忍者 · <kbd>⌫</kbd> 返回',
      },
      bz: {
        back: '返回', toMenu: '主菜单', you: '你', youTag: '你', newBest: '新纪录！', seeResult: '查看结果',
        resetIn: '重置倒计时',
        // time left: days (天) · hours (小时) · minutes (分) · seconds (秒)
        left: (ms) => { const t = Math.floor(ms / 1000), d = Math.floor(t / 86400), hh = Math.floor((t % 86400) / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60; return d ? `${d}天${hh}小时${mm}分` : hh ? `${hh}小时${mm}分` : `${mm}分${ss}秒`; },
        leftShort: (ms) => { const t = Math.floor(ms / 60000), d = Math.floor(t / 1440), hh = Math.floor((t % 1440) / 60), mm = t % 60; return d ? `${d}天${hh}小时` : hh ? `${hh}小时${mm}分` : `${mm}分`; },
        weekName: (m, y) => `${y}年${['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'][m - 1] || m + '月'}`,
        monthName: (m) => ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'][m - 1] || m + '月',
        rank: (r) => (r <= 0 ? '无段位' : r <= 10 ? `Kyu ${11 - r}` : `Dan ${r - 10}`),
        fightOf: (i, n) => `第${i}/${n}战`,
        hpBonus: (p) => `敌方体力 +${p}%`,
        mirrorOpp: '镜像 · 对手是你自己的忍者',
        suddenSub: '只打一回合 · 先倒下者败',
        rows: { fights: '胜场', time: '用时', fightPts: '战斗得分', stage: '关卡奖励', clear: '通关奖励', total: '锦标赛得分', weekBest: '本月最佳' },
        mods: {
          rally2x: { n: '反击狂潮', d: '反击伤害 ×2' },
          fullKi: { n: '满气开局', d: '每回合开始时气槽全满' },
          sudden: { n: '一击定胜负', d: '只打一回合，双方以一半体力开局' },
          mirror: { n: '镜像对决', d: '对手是你自己的忍者' },
          parryOnly: { n: '唯有反击', d: '普通攻击只造成25%伤害，反击 ×1.5' },
          posture2x: { n: '架势崩坏', d: '架势伤害 ×2：防御很快被破' },
          shuriken3x: { n: '手里剑风暴', d: '手里剑数量三倍' },
          kiRush: { n: '气涌', d: '气槽积攒速度翻倍' },
          glass: { n: '玻璃之刃', d: '所有伤害 ×1.5' },
        },
        menu: {
          tour: '月度锦标赛', dan: '段位试炼', hall: '冠军殿堂',
          tourRank: (p, left) => `本月：第${p}名 · ${left}后重置`,
          tourBest: (b, left) => `你的最佳 ${b} · ${left}后重置`,
          tourNew: (left) => `所有人同样的8场战斗 · ${left}后重置`,
          danRank: (name, next) => (next ? `你的段位：${name} · 下一段：${next}` : `你的段位：${name} · 已登顶`),
          danNew: '从 Kyu 10 到 Dan 10，共20场试炼',
          hallRank: (p) => `本月第${p}名 · 纪录`,
          hallDesc: '本月前十与历史纪录',
          nick: (n) => (n ? `昵称：${n}` : '起个昵称'),
          champTitle: '本月前十', champLocal: '本设备前十', champEmpty: '快来登上本月榜首', champLoading: '正在加载榜首…',
          champAll: '历史前十', champAllEmpty: '快来登上在线榜首',
          champLast: (n) => `上月冠军：${n}`, champOpen: '查看月度排名',
        },
        t: {
          title: '月度锦标赛', head: '锦标赛',
          runNote: (s, st) => `锦标赛总分：${num(s)}（含每胜 +${num(st)}）`,
          lossSub: (name, won) => `${name}终结了你的挑战 · ${won}胜`,
          lossNote: (s) => `本场不计分 · 锦标赛得分 ${num(s)}`,
          quit: '结束锦标赛',
          myBest: (b, a) => `本月最佳：${b}分 · 挑战${a}次`,
          noTry: '本月还没有挑战记录。',
          place: (p, t) => (t ? `第${p}名 / 共${t}人` : `第${p}名`),
          rules: (n, clear, stage) => `共${n}场战斗，所有人的对手、竞技场和规则都相同。输一场即挑战结束；挑战次数不限，取最佳成绩。每胜一场 +${stage}，全部击败 +${clear}。`,
          start: '选择忍者，开始挑战', again: '再试一次', go: '参加锦标赛',
          clearTitle: '锦标赛制霸', overTitle: '挑战结束',
          savedToast: (s) => `锦标赛得分已保存：${s}`,
        },
        d: {
          title: '段位试炼', head: '段位试炼',
          sub: '通过每一场试炼来提升段位。你的段位会显示在排行榜的名字旁边。',
          trialOf: (n) => `${n}试炼`,
          runNote: (i, n) => `试炼：已赢${i}/${n}场`,
          lossSub: (name) => `${name}阻止了你的试炼。`,
          lossNote: '试炼失败',
          quit: '离开试炼',
          yourRank: '你的段位', bestWas: (n) => `最高：${n}`, ladder: '段位阶梯',
          nextTrial: (n) => `下一场：${n}试炼`,
          fights: (n) => `${n}场战斗`,
          bossLast: '最终战：Shura',
          strikes: (left, max) => `机会：${left}/${max} · 失败${max}次将降一级段位`,
          safe: '在此段位，试炼失败不会降级。',
          maxed: '已登顶：Dan 10', maxedSub: '你的名字位居段位榜首。',
          start: '选择忍者，接受试炼', next: '下一场试炼', go: '接受试炼',
          promoted: (n) => `晋升：${n}`, demoted: (n) => `降级：${n}`, failed: '试炼失败',
          promotedSub: (a, b) => `${a} → ${b}`, demotedSub: '三次试炼失败。再爬回去吧！', tryAgain: '再试一次，段位不会掉。',
          toast: (n) => `新段位：${n}`, leftToast: '放弃试炼：记为失败',
        },
        hall: {
          title: '冠军殿堂',
          tabs: { week: { n: '本月' }, alltime: { n: '历史' }, archive: { n: '历届冠军' }, chars: { n: '忍者' }, dan: { n: '段位' } },
          desc: { alltime: '月度锦标赛历史最佳', archive: '每个已结束月份的前十名都会永久铭刻于此', chars: '每名忍者的纪录保持者 · 点击忍者查看前二十', dan: '最高段位' },
          loading: '加载中…', error: '排行榜加载失败。', retry: '再试一次',
          empty: '这里还没有人。快来当第一名！', emptyDan: '还没有段位玩家。', emptyArchive: '还没有已结束的月份。称号从2026年10月的锦标赛开始颁发，该届冠军将在11月1日结束时铭刻于此。', emptyArchiveLocal: '本设备还没有已结束的月份。',
          anon: '玩家',
          meTop: (p, s) => `你：第${p}名 · ${s}分 · 你已进入前十！`,
          meGap: (p, g, s) => `你：第${p}名 · ${s}分 · 距前十还差${g}分`,
          meNone: '本月还没有成绩。',
          meDan: (p, n) => `你：第${p}名 · ${n}`,
          meDanLocal: (n) => `你的段位：${n}`, meNoDan: '还没有段位。首场试炼：Kyu 10。',
          noRecord: '暂无纪录', allNinjas: '全部忍者',
          pending: (n) => `待上传的成绩：${n}`,
          classic: '街机 · 传说榜单',
        },
        // Monthly Tournament rewards: permanent title (top 3) and Champion colors (1st)
        ttl: {
          champ: '月度冠军', finalist: '决赛选手',
          reward: '从2026年10月的锦标赛起，每月前三名将获得永久称号。冠军还能为所用忍者赢得专属冠军配色。当月至少需要5名玩家才会颁发称号。',
          hall: '2026年10月起：每月前三名获得永久称号（至少5名玩家） · 冠军赢得冠军配色',
          local: '你的锦标赛成绩保存在本设备上。',
          colors: '冠军配色',
          how: '使用此忍者赢得一次月度锦标赛',
          unlocked: (name) => `月度冠军！已解锁${name}的冠军配色`,
          newTitle: (t) => `新称号：${t}`,
        },
      },
      train: {
        title: '训练', tutTitle: '教程',
        dummy: '木桩',
        beh: { idle: '待机', guard: '防御', attack: '攻击', counter: '反击' },
        infHp: '无限体力', fullKi: '满气',
        reset: '重置位置',
        hide: '隐藏', show: '面板',
        moves: '招式表',
        lessons: '课程',
        lessonOf: (i, n) => `第${i}/${n}课`,
        done: '教程完成！随意设置木桩，自由练习吧。',
        progress: (a, b) => `${a}/${b}`,
        keysHelp: '<kbd>1</kbd>–<kbd>4</kbd> 木桩 · <kbd>⌫</kbd> 重置 · <kbd>H</kbd> 面板',
        specialFallback: { kanji: '影斬り', name: '影斩', desc: '迅雷般的一斩，干净利落地贯穿对手。', tip: '' },
        kiFull: '气槽满',
        counterTip: '应对方法',
      },
      moves: [
        ['<kbd>A</kbd><kbd>D</kbd>', '行走', '连按两下：冲刺'],
        ['<kbd>W</kbd>', '跳跃', ''],
        ['<kbd>F</kbd><kbd>F</kbd><kbd>F</kbd>', '轻斩 ×3 连击', '第三击击退'],
        ['<kbd>G</kbd>', '重斩', '击倒'],
        ['<kbd>R</kbd>', '踢击', '压制防御，积累架势'],
        ['<kbd>T</kbd>', '手里剑', ''],
        ['<kbd>Shift</kbd>', '冲刺', '左 Shift'],
        ['<kbd>Shift</kbd>›<kbd>F</kbd>', '冲刺斩', ''],
        ['<kbd>W</kbd>›<kbd>F</kbd>', '空中斩', ''],
        ['<kbd>W</kbd>›<kbd>G</kbd>', '下劈', '空中重斩'],
        ['<kbd>S</kbd>', '防御', '按住'],
        ['<kbd>S</kbd>!', '弹反', '在攻击命中前一刻按下'],
        ['<kbd>F</kbd>', '直击反击', '防御/弹反之后'],
        ['前+<kbd>F</kbd>', '扫斩', '反击 · 攻其下盘'],
        ['后+<kbd>F</kbd>', '绕背', '反击 · 从对手身边闪过'],
        ['<kbd>G</kbd>', '重反击', '反击 · 击倒'],
        ['对拆', '对拆', '挡住对方的反击，再反击回去；第3次反击是终结技'],
        ['<kbd>F</kbd>/<kbd>G</kbd>!!', '拼刀', '拼刀时狂按，把对手推开'],
      ],
      touch: {
        btn: { light: '攻击', heavy: '重斩', kick: '踢', guard: '防御', dodge: '冲刺', throw: '手里剑', special: '气', up: '跳', down: '防御', stick: '摇杆' },
        lock: '狂按攻击！',
        replaySkip: '点击跳过',
        rotateTitle: '请横屏',
        rotateText: 'Shadow Duel 需横屏游玩。竖屏时仍可使用菜单。',
        rotMenu: '主菜单',
        need2p: '需要键盘 / 手柄',
        need2pToast: '双人对战请连接键盘或手柄',
        hints: '提示',
        pause: '暂停',
        sel: { who1: '你 · 点击选择忍者', who2: '对手（电脑） · 点击选择', who2train: '木桩 · 点击选择' },
        opt: {
          title: '触屏操作',
          layout: '布局', simple: '简易', full: '完整',
          size: '大小', sizes: { s: '小', m: '中', l: '大' },
          hand: '按键', right: '右侧', left: '左侧',
          assist: '简易辅助', haptic: '震动',
          fullscreen: '全屏', exitFullscreen: '退出全屏',
          note: '简易：5个大按键。完整：增加踢击和手里剑。简易辅助：按住攻击即可持续连击，轻点防御也能维持足够时间来弹反，摇杆也不会误触跳跃。它只让触屏更好操作，规则和得分对所有人都一样。',
          fullNote: '踢击和手里剑按键在完整布局中（设置 → 操作）。',
        },
        help: '<div class="th-grid">' +
          '<div><h3>摇杆</h3><dl>' +
          '<dt><i class="tb">◀ ▶</i></dt><dd>拇指放在空白的半边屏幕上滑动：行走</dd>' +
          '<dt><i class="tb">▲</i></dt><dd>向上推：跳跃</dd>' +
          '<dt><i class="tb tb-guard">▼</i></dt><dd>向下拉：防御</dd>' +
          '<dt><i class="tb">▶▶</i></dt><dd>向侧面快速拨两下：冲刺</dd>' +
          '</dl></div>' +
          '<div><h3>按键</h3><dl>' +
          '<dt><i class="tb tb-light">攻击</i></dt><dd>斩击。连续点击：连击。点击时按住前或后：其他招式</dd>' +
          '<dt><i class="tb">重斩</i></dt><dd>重斩。前 + 重斩可将对手挑空</dd>' +
          '<dt><i class="tb tb-guard">防御</i></dt><dd>按住：防御。在攻击命中前一刻轻点：弹反</dd>' +
          '<dt><i class="tb">冲刺</i></dt><dd>冲刺（朝摇杆方向，否则向后）</dd>' +
          '<dt><i class="tb ki">气</i></dt><dd>气技：气槽满时按键发光</dd>' +
          '<dt><i class="tb">踢</i> <i class="tb">手里剑</i></dt><dd>完整布局：踢击和手里剑</dd>' +
          '</dl></div></div>',
        note: '可以同时按多个键：按住防御再攻击，或把拇指从<i class="tb tb-guard">防御</i>滑到<i class="tb tb-light">攻击</i>。屏幕顶部的<b>II</b>可暂停；布局、大小和左手模式在<b>设置</b>里。连接键盘或手柄后会自动切换操作方式。',
        keysHelp: '',
      },
      movesTouch: [
        ['<i class="tb">◀ ▶</i>', '行走', '摇杆 · 快速拨两下：冲刺'],
        ['<i class="tb">▲</i>', '跳跃', '摇杆向上推'],
        ['<i class="tb tb-light">攻击</i>×3', '三连击', '连续点击；第三击击退'],
        ['<i class="tb">重斩</i>', '重斩', '击倒'],
        ['<i class="tb">踢</i>', '踢击', '压制防御，积累架势 · 完整布局'],
        ['<i class="tb">手里剑</i>', '手里剑', '完整布局'],
        ['<i class="tb">冲刺</i>', '冲刺', ''],
        ['<i class="tb">冲刺</i>›<i class="tb tb-light">攻击</i>', '冲刺斩', ''],
        ['<i class="tb">▲</i>›<i class="tb tb-light">攻击</i>', '空中斩', ''],
        ['<i class="tb">▲</i>›<i class="tb">重斩</i>', '下劈', '空中重斩'],
        ['<i class="tb tb-guard">防御</i>', '防御', '按住，或把摇杆向下拉'],
        ['<i class="tb tb-guard">防御</i>!', '弹反', '在攻击命中前一刻轻点'],
        ['<i class="tb tb-light">攻击</i>', '直击反击', '防御/弹反之后'],
        ['前+<i class="tb tb-light">攻击</i>', '扫斩', '反击 · 攻其下盘'],
        ['后+<i class="tb tb-light">攻击</i>', '绕背', '反击 · 从对手身边闪过'],
        ['<i class="tb">重斩</i>', '重反击', '反击 · 击倒'],
        ['对拆', '对拆', '挡住对方的反击，再反击回去；第3次反击是终结技'],
        ['<i class="tb tb-light">攻击</i>!!', '拼刀', '拼刀时狂按攻击，把对手推开'],
      ],
      moveSpecialTouch: '<i class="tb ki">气</i>',
      moveTags: {
        normal: '普通', command: '指令', string: '连段', launcher: '挑空', juggle: '浮空', air: '空中', dash: '冲刺',
        strike: '打击', counter: '反击', catch: '擒拿', feint: '佯攻', guardCrush: '破防', knockdown: '击倒',
        kiCancel: '气取消', special: '气技', throw: '飞行道具',
      },
      lessonsTouch: {
        walk: '拇指在空白的半边屏幕上滑动：左右推动摇杆来行走。',
        combo: '连续点击<i class="tb tb-light">攻击</i>三次：三连斩命中木桩。',
        heavy: '用<i class="tb">重斩</i>打出一记重斩。出手慢，但能击倒对手。',
        gbreak: '木桩正在防御。用<i class="tb">重斩</i>攻击它，积满架势条来破防（完整布局中的<i class="tb">踢</i>积得更快）。',
        block: '木桩正在进攻。按住<i class="tb tb-guard">防御</i>（或把摇杆向下拉），挡住一次斩击。',
        parry: '在攻击命中前一刻轻点<i class="tb tb-guard">防御</i>。蓝色光圈缩小的瞬间就是最佳时机。',
        counter: '防御或弹反后立刻按<i class="tb tb-light">攻击</i>：反击斩。也试试摇杆前/后 + <i class="tb tb-light">攻击</i>或<i class="tb">重斩</i>。',
        special: '气槽已满。按发光的<i class="tb ki">气</i>键使出{sp}。',
      },
      lessons: [
        { id: 'walk', t: '行走', d: '用<kbd>A</kbd> / <kbd>D</kbd>前后走动。' },
        { id: 'combo', t: '三连击', d: '按<kbd>F</kbd> <kbd>F</kbd> <kbd>F</kbd>连出三记轻斩，命中木桩。' },
        { id: 'heavy', t: '重斩', d: '用<kbd>G</kbd>打出一记重斩。出手慢，但能击倒对手。' },
        { id: 'gbreak', t: '破防', d: '木桩正在防御。用<kbd>R</kbd>踢击，积满架势条来破防。' },
        { id: 'block', t: '防御', d: '木桩正在进攻。按住<kbd>S</kbd>挡住一次斩击。' },
        { id: 'parry', t: '弹反', d: '在攻击命中前一刻按<kbd>S</kbd>。蓝色光圈缩小的瞬间就是最佳时机。' },
        { id: 'counter', t: '反击', d: '防御或弹反后立刻按<kbd>F</kbd>：反击斩。也试试前/后 + <kbd>F</kbd>或<kbd>G</kbd>。' },
        { id: 'rally', t: '对拆', d: '木桩也会反击。攻击它，挡住它的反击再反击回去：用你自己的两次回击打到2×。' },
        { id: 'special', t: '气技', d: '气槽已满。按<kbd>E</kbd>使出{sp}。' },
      ],
    });

    // ================================================================ story, fighters, arenas, specials
    // ---- Fragment B: story text (talk, pairs, endings, roster2 notes), characters, arenas, specials, pop-ups, AI levels, number words
    merge(EN.STR, {
      // open = speaks first (opponent), reply = answers (player), boss = said to the final boss
      talk: {
        akane: {
          open: ['我的刀是赤红的，我的心是纯粹的。堂堂正正地面对我吧。', '先行礼，再出刀。这才公平。', '这场决斗关乎荣誉。绝无退路。'],
          reply: ['可敬的对手……你配得上我的刀。', '言辞犀利。让我看看你的刀是否同样锋利。', '赤刃出鞘之时，言语便归于沉寂。'],
          boss: '我的师父们死在你的刀下，Shura。今日，血债血偿。',
        },
        aoi: {
          open: ['风从不着急。我也一样。', '听听你的呼吸。你最后听到的声音，将是风声。', '竹子会弯，却从不折断。你是哪一种？'],
          reply: ['冷静。愤怒会让刀变沉。', '风是抓不住的，只能去感受。', '好。等落叶触地，我们便开始。'],
          boss: '就连风暴之眼也是寂静的。而你的内心只有喧嚣，Shura。',
        },
        kuro: {
          open: ['山不会动。你会。', '少废话。举刀。', '你太小了。很快就结束。'],
          reply: ['哼。来吧。', '你话太多了。', '我的野太刀很长，我的耐心很短。'],
          boss: 'Shura。我等了很久。不必多言。',
        },
        yuki: {
          open: ['雪落无声，我的刀也是。', '狐狸不会落入陷阱，它只会设下陷阱。', '冷吗？很快你就什么都感觉不到了。'],
          reply: ['你太过血气方刚，这会拖慢你。', '真吵……连雪都替你害臊。', '别眨眼，不然你会错过。'],
          boss: '所有人都怕你，Shura。我只觉得有点冷。',
        },
        hana: {
          open: ['来跳支舞吗？不过得由我领舞！', '樱花落地之前就结束，我保证！', '两把短刀，一个微笑。哪个更让你害怕？'],
          reply: ['哎呀，这么严肃！笑一笑嘛，倒下时会更好看哦。', '有本事来抓我呀！', '好啦好啦！不过输了可别哭鼻子。'],
          boss: '你从来不笑吗，Shura？来吧，跳完我们的最后一支舞！',
        },
        tetsu: {
          open: ['职责带我来此。让开，或者倒下。', '我的铠甲身经百战。你是第一百零一个。', '纪律先于勇气。容我示范。'],
          reply: ['无礼。我会纠正它。', '你的言语刺不穿我的铠甲。', '准备好。我的薙刀出手从不预警。'],
          boss: '你烧了我主公的城，Shura。今日，我将履行我的职责。',
        },
        ren: {
          open: ['哈！总算有乐子了！你骨头够硬吗？', '被面具吓到了？我的真面目你可不想看！', '打头还是破防？我两样都拿手！'],
          reply: ['光说不练！来啊！', '嘿，我挺喜欢你。不过照样揍你。', '见识过我的踢腿吗？马上就让你见识！'],
          boss: '原来你才是真正的恶鬼啊？比比谁的角更硬！',
        },
        kage: {
          open: ['你以为你看见了我。你看见的只是我的影子。', '光越亮，影越深。', '你的名字早已写下。我只是在念出它。'],
          reply: ['别出声。影子在听。', '别回头。我已经在你身后了。', '你太吵了。沉默出手更快。'],
          boss: '影子不侍奉任何主人，Shura。它们也会吞噬你。',
        },
        shura: {
          open: ['你折断了七把刀。第八把是我的，它会折断你。', '你的斗气在召唤我。你能爬到这里很好，摔下去时才更壮观。', '我是这条路的尽头。跪下。'],
          reply: ['弱小。我在这里都能闻到。', '你不过是一块垫脚石。', '跪下，或者倒下。'],
          boss: '镜中的恶鬼……我们之中，多了一个。',
        },
        tora: {
          open: ['挂在我锁链上的人，我早就数不清了。你也会是其中之一。', '狩猎开始了。想跑就跑吧，但我的锁链很长。', '都说老虎会埋伏。我可不会！'],
          reply: ['呜……很好。我喜欢不逃跑的猎物。', '不必靠近。我会把你拽过来。', '你话很长，我的锁链更长。'],
          boss: '你也不过是猎物，Shura。只是大了一点。',
        },
        jin: {
          open: ['我不是来见血的。只是让你躺下歇一会儿。', '棍会耐心地说话。听着。', '年轻的武者，你的路上满是愤怒。让我帮你卸下重担。'],
          reply: ['好吧。不过打完之后，我们一起喝茶。', '你的愤怒压着你。让我替你扛。', '刀会斩断，棍会唤醒。'],
          boss: 'Shura，要击败你心中的恶鬼，我无需毁灭你。阻止你就够了。',
        },
        mai: {
          open: ['舞台已就绪，帷幕已拉开。你的角色：输家。', '我的扇子展开时，别闭眼。你会错过好戏。', '我的每一步都是一个音符。你跟得上节拍吗？'],
          reply: ['多么粗鲁的登场。无妨，我的优雅足够我们两人用。', '风向着我吹呢，亲爱的。', '我不需要掌声。你倒下就够了。'],
          boss: 'Shura，这最后一支舞，我不与任何人共享舞台。',
        },
        tsubame: {
          open: ['我们之间的距离就是我的武器。', '燕子第一次会失手。第二次，它会回身一击。', '我已测好了风。我的箭知道它的路。'],
          reply: ['想靠近？试试看。', '屏住呼吸。飞行的箭不会发出声音。', '我的眼睛盯着你，我的箭也是。'],
          boss: 'Shura，天空中无处可藏。我的箭会找到你。',
        },
      },
      // Special match-ups: lines are spoken in the order written
      pairs: {
        'akane|aoi': [['akane', 'Aoi！是时候了结我们未完的决斗了。'], ['aoi', '风总是吹向同一团火，Akane。开始吧。']],
        'kuro|tetsu': [['kuro', '铁壳子。看看里面是不是空的。'], ['tetsu', '就连高山也要向纪律低头，Kuro。']],
        'hana|yuki': [['yuki', '花朵会在雪中凋零，Hana。'], ['hana', '那我就把雪融化掉，Yuki！']],
        'kage|ren': [['ren', '影子把戏对我没用！给我现身！'], ['kage', '我就在这里，恶鬼。只是你不懂得怎么看。']],
        'akane|ren': [['akane', '只有不知廉耻的人才会躲在面具后面。'], ['ren', '荣誉？荣誉又填不饱肚子！']],
        'aoi|yuki': [['aoi', '冷风也还是风，Yuki。'], ['yuki', '可风停之后，雪还在。']],
        'kuro|tora': [['tora', '一座山，是吧？老虎也住在山里。'], ['kuro', '老虎也死在山里。']],
        'tora|yuki': [['tora', '一只狐狸！狐狸见了老虎会怎样？'], ['yuki', '先跑。然后冻住老虎的尾巴。']],
        'jin|tora': [['tora', '等我的锁链缠住你的棍，你要怎么办，和尚？'], ['jin', '解开它。解结本就是我的修行。']],
        'jin|ren': [['ren', '和尚？快开始念经吧，秃驴！'], ['jin', '我已经在念了，恶鬼。为你而念。你心中的火也在灼烧你自己。']],
        'jin|tetsu': [['tetsu', '和尚上战场做什么？'], ['jin', '为你这般披甲的心而来，Tetsu。你的铠甲很重，你的心更重。']],
        'akane|jin': [['akane', '让开，和尚。这是我的复仇。'], ['jin', '复仇是一条锁链，Akane。让我们先把它斩断。']],
        'hana|mai': [['hana', '哇，又一个舞者！看看谁转得更快！'], ['mai', '速度不过是优雅的影子，Hana。让我带你看看光。']],
        'kage|mai': [['mai', '影子也会跳舞吗，Kage？'], ['kage', '只在光熄灭时。']],
        'aoi|tsubame': [['tsubame', '你的风能吹偏我的箭吗，Aoi？'], ['aoi', '风不偏袒任何人，Tsubame。你的箭也不例外。']],
        'kage|tsubame': [['kage', '看不见的东西，你是射不中的，弓手。'], ['tsubame', '影子随光而来。我也是。']],
        'mai|tsubame': [['mai', '远远地盯着人看可不礼貌，弓手。过来近点看吧。'], ['tsubame', '我会让我的箭替我去近看你的舞台。']],
      },
      endings: {
        akane: ['Shura的刀落地之时，寺院的钟声不鸣自响。', 'Akane拭净赤红之刃，在师父们的墓前鞠躬：血债已偿。', '前方的路不再是复仇，而是将荣誉传授给新的弟子。'],
        aoi: ['Shura倒下时，风暴归于平静；多年来，云层第一次散开。', 'Aoi收刀入鞘，回到了竹林。', '只剩下呼啸的风声。'],
        kuro: ['Kuro把Shura碎裂的面具埋在了山顶。', '一言未发。Kuro压低斗笠，消失在风雪中。', '村民们说，那年冬天，没有一个山贼下过山。'],
        yuki: ['Shura最后的一口气在寒风中化作白雾，消散无踪。', 'Yuki理了理围巾，转身离去，雪地上不留一丝足迹。', '从那天起，山顶上只见过一只狐狸的影子。'],
        hana: ['Shura的面具落地时，Hana在旁边放下了一枝樱花。', '那晚集市挂满灯笼；最响亮的喝彩，献给了一位在屋顶上起舞的女忍。', '没人知道Hana去了哪里。只留下飘落的粉色花瓣。'],
        tetsu: ['在城顶之上，Tetsu用膝盖将Shura的刀一折为二。', '主公的旗帜再次升起，在风中骄傲地飘扬。', '职责已尽。但武士的职责永无止境。'],
        ren: ['Ren把Shura碎裂的面具挂在另一副鬼面旁边。两只恶鬼，一个赢家。', '那晚村里歌声不断；笑得最响的，照例是Ren。', '天亮时，Ren已经上路，去找下一场架打了。'],
        kage: ['Shura倒下时，Kage的影子悄然覆上了倒下的恶鬼。', '无痕，无声；月光下只多了一道延伸的影子。', '也许它一直都在。也许它从未存在过。'],
        shura: ['城顶之上，只剩一人站立：戴着同样的面具，只是更加漆黑。', 'Shura不再寻找对手。对手们寻找着Shura。'],
        def: ['最后一位大师已经倒下。影之道如今属于你。', '收刀入鞘吧；传说，从此刻开始。'],
        tora: ['锁链的哗啦声宣告了Shura的倒下。', 'Tora把碎裂的面具挂在锁链上：又一件狩猎战利品。', '从那天起，林中再也没人把虎啸当作童话。'],
        jin: ['Jin跪在倒下的Shura身旁，为他祈祷。', '回寺院的路上，棍上没有沾染一滴血。', '那晚山中钟声再次响起；这一次不为哀悼，而为和平。'],
        mai: ['Shura倒下时，Mai啪地合上扇子，躬身行礼。', '夜市至今还在谈论那支舞。', '帷幕落下。但Mai从未离开舞台。'],
        tsubame: ['最后一支箭静静地插在城顶上颤动。', 'Tsubame背起弓，目送燕子向南飞去。', '此后再无人见过她；只留下钉在靶上的彩羽之箭。'],
      },
      roster2: {
        notes: {
          tora: ['轻攻击：中距离甩锁链，近身用镰刀', '重攻击：掷出锁链，命中后把对手拉过来', '连击收尾：对手离得远时，锁链会把对手拖近'],
          jin: ['棍的两端都能打击；钝击，从不见血', '第三击和重扫都能击倒', '按住防御时架势积累更慢'],
          mai: ['弹反判定更宽', '防御时，扇子会把飞行道具弹回去', '重攻击：一道风浪推开对手并吹散飞行道具'],
          tsubame: ['重攻击：用弓射箭；按住可蓄力射击', '投掷：后空翻并在空中放箭', '箭用完时重攻击改用短刀；箭会随时间补充'],
        },
      },
    });

    merge(EN.CHARS, {
      akane: { title: '赤刃', desc: '均衡型太刀高手。三连击迅速，弹反强劲。', weapon: 'Katana' },
      aoi: { title: '苍风', desc: '敏捷型太刀高手。走得稍快，冲刺如风。', weapon: 'Katana' },
      kuro: { title: '黑山', desc: '手持长长的野太刀。速度慢，但攻击范围广、破坏力惊人。', weapon: 'Nodachi' },
      yuki: { title: '雪狐', desc: '用短小的小太刀极速出击。手里剑充足，围巾很长。', weapon: 'Kodachi' },
      hana: { title: '樱舞', desc: '女忍。双持短刀，战斗如舞蹈；出手最快，攻击距离最短。', weapon: '双持 Tantō' },
      tetsu: { title: '铁壁', desc: '重甲武士。薙刀攻击距离最长；挨打几乎不受影响。', weapon: 'Naginata' },
      ren: { title: '赤鬼', desc: '戴鬼面的斗士。以破防重击和毁灭性的踢腿令人胆寒。', weapon: 'Uchigatana' },
      kage: { title: '影之化身', desc: '戴兜帽的影子。忍刀出手快，冲刺距离长；所过之处留下残影。', weapon: 'Ninjatō' },
      tora: { title: '锁虎', desc: '锁镰高手。在中距离甩动带锤的锁链；重攻击把对手拽到镰刀跟前。', weapon: 'Kusarigama' },
      jin: { title: '铁棍僧', desc: '持棍的僧人。长棍两端皆可打击，防御扎实，钝击可击倒对手；从不见血，只震骨头。', weapon: 'Bō' },
      mai: { title: '扇舞姬', desc: '使用铁扇的女忍。速度极快，弹反判定宽；扇子能弹回飞行道具，扇风能推开对手。', weapon: '双持 Tessen' },
      tsubame: { title: '燕弓手', desc: '携带弓和短刀。远距离射箭（按住重攻击可蓄力强射），有人靠近就后空翻拉开距离，在空中放箭。', weapon: 'Yumi + Tantō' },
      shura: { title: '赤红大师', desc: '一路染满赤红的恶鬼大师。长野太刀，毁灭性的重击，近乎完美的弹反。', weapon: 'Nodachi' },
    });

    merge(EN.ARENAS, {
      temple: '月下寺院',
      rain: '暴雨竹林',
      snow: '雪峰',
      village: '燃烧的村庄',
      market: '夜市',
      waterfall: '瀑布',
      castle: '城顶',
    });

    merge(EN.SPECIALS, {
      akane: { desc: '赤红的居合斩，眨眼间贯穿对手，在空中留下一道炽烈的新月。', tip: '弹反，或向旁冲刺' },
      aoi: { desc: '大幅挥刀，向前送出一道风刃；时机完美的防御可将其反弹。', tip: '跳起、用刀斩断，或在完美时机防御' },
      kuro: { desc: '跃起后用野太刀劈裂地面；沿地面疾驰的冲击波会粉碎防御并击倒对手。', tip: '跳过冲击波，趁在空中出手' },
      yuki: { desc: '暴风雪般迅雷不及掩耳的五连击；最后一击击倒对手。', tip: '防御，并弹反第一击' },
      hana: { desc: '双持短刀化作樱花旋风向前旋转，左右两侧同时斩击。', tip: '防御，或向后冲刺' },
      tetsu: { desc: '薙刀四面旋转；攻击无法打断旋转（霸体）。', tip: '退出攻击范围，或弹反' },
      ren: { desc: '一记粉碎防御的肩撞，接上将对手挑空的上挑斩。', tip: '防御没用：弹反、跳跃或冲刺' },
      kage: { desc: '化作烟雾消失，留下影分身，再出现在对手身后出手。', tip: 'Kage重新现身的瞬间防御' },
      tora: { desc: '在头顶甩动锁链形成旋风，扫倒周围一切；被缠住的对手会被拽近，再被镰刀挑上天空。', tip: '退出范围或防御：只要没被缠住，拉扯就会落空' },
      jin: { desc: '像金刚轮一样旋转长棍前进；四连打后，一记上挑将对手挑空。', tip: '向后冲刺，或弹反第一击' },
      mai: { desc: '卷起一道向前飘移的旋风，把对手吸入、斩击，最后抛上天空。', tip: '在完美时机防御旋风或后退：它移动得很慢' },
      tsubame: { desc: '向后跃起，从天空降下箭雨；未命中时会射出燕返之箭，转向从背后袭来。', tip: '离开地面上的标记；燕返之箭会飞回来，小心背后' },
      shura: { desc: '一声怒吼化入赤红烟雾，在对手前后现身，劈下三记沉重的野太刀斩；最后一击将对手挑空。', tip: '留意赤红闪光：弹反任意一斩即可终止此招；防御会被压垮架势' },
    });

    merge(EN.TXT, {
      gbreak: '架势崩溃！', cut: '斩断！', reflect: '反弹！', parry: '弹反！', caught: '缠住！',
      swallowHit: '燕!', vajraHit: '金剛!', whirlHit: '旋風の舞',
    });

    merge(EN.AI_LEVELS, { 0: '学徒', 1: '大师', 2: '传说', 3: 'Shura' });

    EN.NUMWORDS = ['零', '一', '两', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

    // ================================================================ static HTML, hardcoded literals, canvas pop-ups
    merge(EN.PHRASES, {
      // ---------------------------------------------------------------- index.html: <title>, brand, HUD
      'Gölge Düellosu': 'Shadow Duel',
      'Duraklat': '暂停',
      'KARŞILIKLI SERİ': '连环对拆',
      'SON DARBE': '最后一击',
      'atlamak için bir tuşa bas': '按任意键跳过',
      // touch buttons (static fallbacks of data-s="touch.btn.*")
      'GARD': '防御',
      'HAFİF': '轻斩',
      'SALDIR': '攻击',
      'AĞIR': '重斩',
      'ATIL': '冲刺',
      'TEKME': '踢',
      // ---------------------------------------------------------------- main menu
      'Sekiz savaşçı, üç arena. Gerçek zamanlı kılıç çarpışması, kılıç kilitlenmesi, savuşturma, denge kırma, Gölge Kesiği ve ragdoll fiziği.': '八名战士，三座竞技场。实时刀剑交锋、拼刀、弹反、破架势、影斩与布娃娃物理。',
      'İki Oyuncu': '双人对战',
      'Aynı klavyede ya da iki gamepad ile kafa kafaya': '同一键盘或两个手柄，正面对决',
      'CPU\'ya Karşı': '对战电脑',
      'Ninjanı seç, rakibini yapay zekâ yönetsin': '选择你的忍者，对手交给AI操控',
      'Zorluk': '难度',
      'Çırak': '学徒',
      'Usta': '大师',
      'Efsane': '传说',
      'Aylık Turnuva': '月度锦标赛',
      'Dan Sınavı': '段位试炼',
      'Şampiyonlar Salonu': '冠军殿堂',
      'Seyret': '观战',
      'Rastgele iki ninja, Efsane yapay zekâ': '随机两名忍者，传说难度AI',
      'Ses': '声音',
      'Müzik': '音乐',
      'Kan efekti': '流血效果',
      'Tuş ipuçları': '按键提示',
      'Yüksek grafik': '高画质',
      // ---------------------------------------------------------------- controls card
      'Kontroller': '操作',
      '1. Oyuncu': '玩家1',
      '2. Oyuncu': '玩家2',
      'Yürü': '行走',
      'Zıpla': '跳跃',
      'Gard (basılı tut)': '防御（按住）',
      'Hafif kesik (×3 kombo)': '轻斩（×3 连击）',
      'Ağır kesik': '重斩',
      'Tekme': '踢击',
      'Sol Shift': '左 Shift',
      'Sağ Shift': '右 Shift',
      'Atılma': '冲刺',
      'Ki tekniği (ki dolu)': '气技（气槽满）',
      // ---------------------------------------------------------------- select screen
      'Ninjanı seç': '选择你的忍者',
      'Hazır': '准备就绪',
      '1. oyuncunun ninjası': '玩家1的忍者',
      '2. oyuncunun ninjası': '玩家2的忍者',
      'Önceki ninja': '上一个忍者',
      'Sonraki ninja': '下一个忍者',
      '1. oyuncu kadrosu': '玩家1阵容',
      '2. oyuncu kadrosu': '玩家2阵容',
      'Dövüşe başla': '开始战斗',
      'Geri': '返回',
      'Kilitli': '未解锁',
      'Rastgele': '随机',
      'Hız': '速度',
      'Güç': '力量',
      'Menzil': '距离',
      'Can': '体力',
      // ---------------------------------------------------------------- pause / end
      'Duraklatıldı': '已暂停',
      'Devam et': '继续',
      'Maçı yeniden başlat': '重新开始比赛',
      'Ana menü': '主菜单',
      'Rövanş': '再战',
      'Karakter değiştir': '更换战士',
      'Zafer senin': '胜利属于你',
      'Raund': '回合',
      'Verilen hasar': '造成伤害',
      'Savuşturma': '弹反',
      'Ki Saldırısı': '气技攻击',
      // ---------------------------------------------------------------- training / leaderboard / misc
      'Antrenman': '训练',
      'ANTRENMAN': '训练',
      'Sıralama': '排行榜',
      'Tümü': '全部',
      'Ekranı yan çevir': '请横屏',
      'Performans için grafik düşürüldü': '已降低画质以提升流畅度',
      // hidden boss pushed into ND.CHARS by arcade.js (safety net; EN.CHARS.shura should carry the same)
      'Kanlı Usta': '血之大师',
      'Yolunu kanla çizen iblis usta. Uzun nodachi, yıkıcı darbeler, neredeyse kusursuz savuşturma.': '以鲜血开路的恶鬼大师。长野太刀，毁灭性的重击，近乎完美的弹反。',
      // ---------------------------------------------------------------- HUD tags (fallbacks when STR.hud is missing)
      'SEN': '你',
      'KUKLA': '木桩',
      // ---------------------------------------------------------------- round banners (#bt / #bs)
      'Son raund': '最终回合',
      'Kazanan her şeyi alır': '胜者通吃',
      'İlk iki raundu alan kazanır': '先赢两回合者获胜',
      'Dövüş!': '开战！',
      'Süre doldu': '时间到',
      'Berabere': '平局',
      'Çifte K.O.': '双重 K.O.',
      'Mükemmel': '完美',
      // blade-lock hint (fallbacks of STR.hud.lockSolo / lockDuo)
      'F / K tuşuna hızlıca bas!': '狂按 F / K！',
      'Hafif ya da ağır tuşuna hızlıca bas!': '狂按轻斩或重斩！',
      // counter / parry prompt labels under the key ring (ctx.fillText in drawPrompts)
      'KARŞILIK': '反击',
      'SAVUŞTUR': '弹反',
      // ---------------------------------------------------------------- canvas pop-ups (fx.text)
      'SON VURUŞ!': '终结技！',
      'KİLİTLENDİ!': '拼刀！',
      'İTTİ!': '推开！',
      'DENGE KIRILDI!': '架势崩溃！',
      'GARD KIRILDI!': '破防！',
      'KESİLDİ!': '斩断！',
      'YANSITMA!': '反弹！',
      'SAVUŞTURMA!': '弹反！',
      'YAKALANDI!': '缠住！',
      'ZIRH!': '霸体！',
      'ARKADAN!': '背刺！',
      'DUVAR!': '撞墙！',
      'KAFA!': '爆头！',
      'KARŞI!': '迎击！',
      'KRİTİK!': '暴击！',
      'SÜPÜRME!': '扫斩！',
      'KARŞILIK!': '反击！',
      'YERE SERİLDİ': '倒地',
      'ÇARPIŞMA!': '交锋！',
    });

    merge(EN.HTML, {
      // brand title
      'Gölge<br><em>Düel</em><em>losu</em>': 'Shadow<br><em>Du</em><em>el</em>',
      // tips list (<ul class="tips">)
      '<b>Savuşturma:</b> darbe gelmeden hemen önce gard tuşuna bas; rakip sendeler.':
        '<b>弹反：</b>在攻击命中前一刻按防御键，对手会踉跄失衡。',
      '<b>Karşılık (返し技):</b> gard ya da savuşturmanın hemen ardından saldırı tuşu → anında karşı kesik. <b>İleri</b> + hafif = bacağa süpürme, <b>geri</b> + hafif = yanından dönüp arkadan kesme, <b>ağır</b> = güçlü karşı darbe.':
        '<b>反击（返し技）：</b>防御或弹反后立刻按攻击 → 瞬间反击斩。<b>前</b> + 轻斩 = 扫腿斩，<b>后</b> + 轻斩 = 绕到身后斩击，<b>重斩</b> = 强力反击。',
      '<b>Karşılıklı seri:</b> karşılık da karşılanabilir. Her turda vuruşlar hızlanır ve güçlenir; kendi 3. karşılığın üç vuruşluk sinematik bir bitirişe dönüşür. Seriyi kıran darbe ağır çekimde iner.':
        '<b>对拆：</b>反击也能被反击。每一轮交锋都更快更猛；你的第3次反击会化为三连击的电影式终结技。打破对拆的一击会以慢动作呈现。',
      '<b>Kılıç kilidi:</b> kılıçlar çarpışınca kilitlenebilir. Hafif/ağır tuşuna hızlı basan rakibini iter.':
        '<b>拼刀：</b>刀刃相撞时可能卡在一起。轻斩/重斩按得更快的一方会把对手推开。',
      '<b>Ki barı</b> vurdukça, yedikçe ve savuşturdukça dolar. Dolunca her ninjanın kendine özgü ki tekniği açılır (Antrenman’daki hareket listesinde görebilirsin).':
        '<b>气槽</b>会在命中、受击和弹反时积累。积满后即可使出每名忍者的专属气技（可在训练的招式表中查看）。',
      '<b>Atılma + hafif</b> = atılarak kesik. <b>Havada</b> hafif = hava kesiği, ağır = dalış. Ağır kesik yere serer, duvara çarpan geri seker.':
        '<b>冲刺 + 轻斩</b> = 冲刺斩。<b>空中</b>轻斩 = 空中斩，重斩 = 下劈。重斩能击倒对手；撞到墙上的人会被弹回。',
      '<b>Denge çubuğu</b> dolarsa gard kırılır. Tekme gardı delip dengeyi hızla doldurur.':
        '<b>架势条</b>积满时防御会被打破。踢击能穿透防御，快速积累架势。',
      // gamepad note (Esc -> Start or P)
      'Gamepad: X hafif · Y ağır · B tekme · A zıpla · LB gard · RB shuriken · RT atılma · R3 ki tekniği. Start ya da <kbd>P</kbd> duraklatır. CPU modunda her iki tuş seti de seni yönetir.':
        '手柄：X 轻斩 · Y 重斩 · B 踢击 · A 跳跃 · LB 防御 · RB 手里剑 · RT 冲刺 · R3 气技。Start 或 <kbd>P</kbd> 暂停。对战电脑时，两套按键都可以操控你。',
      // select / VS hints (Esc -> ⌫)
      '<kbd>Enter</kbd> başlatır · <kbd>⌫</kbd> menüye döner': '<kbd>Enter</kbd> 开始 · <kbd>⌫</kbd> 返回',
      '<kbd>Enter</kbd> / <kbd>F</kbd> başlatır · <kbd>⌫</kbd> çıkar': '<kbd>Enter</kbd> / <kbd>F</kbd> 开始 · <kbd>⌫</kbd> 退出',
    });

    EN.PATTERNS.push(
      // HUD round label (#rlabel) and round banner
      [/^RAUND (\d+)$/, '第$1回合'],
      [/^(\d+)\. Raund$/, '第$1回合'],
      // canvas pop-ups built from numbers
      [/^(\d+)\. KARŞILIK$/, '反击 ×$1'],
      [/^(\d+) VURUŞLUK SERİ!$/, '$1连对拆！'],
      // time-up banner sub: `${name} önde`
      [/^(.+) önde$/, (m, n) => I.t(n) + '领先'],
      // end screen title: `${Name} kazandı`
      [/^(.+) kazandı$/, (m, n) => I.t(n) + '获胜'],
      // end screen sub line: `${a} – ${b} · ${round} raund · ${arenaName}`
      [/^(\d+) – (\d+) · (\d+) raund · (.+)$/, (m, a, b, r, ar) => `${a} – ${b} · ${r}回合 · ${I.t(ar)}`],
    );

    // ================================================================ added with the portal build (PLAY, ads, coach)
    merge(EN.STR, {
      menu: { play: '开玩', playSub: (name, lv) => `${name} 对战电脑 · ${lv}` },
      first: { play: '开玩', sub: '轻点一下，立刻开打', menu: '全部模式' },
      ads: {
        cont: '从这里继续', contSub: '看一段广告 · 无惩罚重试',
        trial: (name) => `试用${name}一场`, trialSub: '看一段广告',
        fail: '暂时没有广告，请稍后再试',
      },
      coach: {
        attack: (l) => `${l} 攻击`,
        guard: (l, g) => `按住 ${g} 防御`,
        parry: (l, g) => `在攻击命中前一刻按 ${g}：弹反`,
        attackT: (l) => `点击 ${l} · 连续点击：连击`,
        guardT: (l, g) => `按住 ${g} 防御`,
        parryT: (l, g) => `在攻击命中前一刻点 ${g}：弹反`,
      },
    });

    // ================================================================ VOLUME: sliders on the menu card and in pause (js/volume.js)
    merge(EN.STR, {
      vol: {
        title: '音量', master: '总音量', music: '音乐', sfx: '音效', sound: '声音',
        pct: (n) => `${n}%`,
        muted: '声音已关闭。拖动任一滑块即可重新开启。',
        // Settings > Audio: character / announcer voices switch (js/voice.js) and the courtesy credit under it
        voice: '语音',
        uiSfx: '菜单音效',
        credit: '语音：ユーフルカ (youfulca.com) · 効果音ラボ · すぱらんど',
      },
    });

    // ================================================================ TOUCH LAYOUT EDITOR: movement modes + "Customize controls"
    // (js/touch.js settings rows, js/touch-editor.js; Turkish source in i18n.js, block "touch movement modes + layout editor")
    merge(EN.STR, {
      tedit: {
        move: '移动方式',
        moves: { float: '摇杆', fixed: '固定摇杆', dpad: '方向键' },
        mnote: {
          float: '拇指按在哪里，摇杆就出现在哪里。',
          fixed: '摇杆固定在你放置的位置；从中心向外推。',
          dpad: '独立按键：按住行走，连按两下冲刺。按在两个键之间可同时触发（▶ + ▲ = 向前跳）。',
          dtap: '独立按键：轻点 ◀ ▶ 迈出一小步，按住行走，连按两下冲刺。',
        },
        dtap: '轻点迈步',
        edit: '自定义按键',
        title: '自定义按键',
        hint: '把按键拖到任意位置。点击按键可调整大小、透明度或隐藏。',
        rotate: '横屏后即可布置战斗按键。',
        shapes: { phone: '手机', tablet: '平板', portrait: '竖屏' },
        screenNote: '布局按屏幕形状保存：手机和平板各自保留一套。',
        save: '保存', cancel: '取消', options: '选项', done: '完成', close: '关闭',
        size: '大小', sizes: { s: '小', m: '中', l: '大', xl: '特大' },
        opacity: '透明度', opacityAll: '透明度（全部）',
        hide: '隐藏', show: '显示', hidden: '已隐藏',
        snap: '对齐网格',
        presets: '预设', pRight: '右手', pLeft: '左手', pSplit: '防御在左',
        reset: '恢复默认', resetDone: '已恢复默认布局（保存后生效）。',
        overlap: '按键不能重叠：已移到最近的空位。',
        noRoom: '那里放不下：按键已退回原位。',
        saved: '按键已保存',
        throwName: '手里剑',
        pauseName: '暂停',
        dirs: { dl: '◀ 左', dr: '右 ▶', du: '▲ 跳', dd: '▼ 防御' },
      },
    });

    // ================================================================ PROGRESSION: honor, rival challenges, moves panel
    // (arcade.js STR.honor / STR.rival / STR.hint, game.js select screen; rules in js/honor.js)
    merge(EN.STR, {
      menu: { arcadeDesc: '难度步步攀升，逐一击败对手，最后还有隐藏大师在等你。荣誉的最佳来源。' },
      sel: {
        title: { rival: '宿敌挑战 · 选择你的忍者' },
        go: { rival: '接受决斗' },
        moves: '招式',
        movesOf: (name) => `${name} · 招式`,
        close: '关闭',
      },
      hint: {
        honor: (have, need) => `荣誉 ${num(Math.min(have, need))}/${num(need)} → 开启宿敌挑战`,
        ready: '挑战即将到来！',
        arenaHonor: (have, need) => `荣誉达到${num(need)}时开启（${num(Math.min(have, need))}/${num(need)}）`,
      },
      honor: {
        name: '荣誉',
        head: '荣誉',
        rows: { win: '胜利', loss: '参战', rounds: '赢下回合', perfect: '完美回合', rally: '反击对拆', counter: '反击', parry: '弹反', rivalWin: '宿敌挑战', arcadeClear: '街机通关' },
        total: (n) => `荣誉：${num(n)}`,
        next: (name, left) => `下一名忍者：${name}——还差${num(left)}荣誉`,
        bar: (have, need) => `荣誉 ${num(Math.min(have, need))}/${num(need)} → 开启宿敌挑战`,
        ready: (name) => `${name}向你发起挑战！`,
        readyGo: '接受',
        all: '已解锁全部忍者',
        bonus: { arcadeClear: '街机通关', tourneyClear: '锦标赛制霸', danPass: '段位试炼通过', rivalWin: '宿敌挑战胜利', tutorial: '教程完成' },
        bonusToast: (n, what) => `+${num(n)}荣誉 · ${what}`,
        road: '荣誉之路',
        roadSub: '所有单人模式都能获得荣誉。达到某名忍者的要求后，对方会向你发起决斗；赢了，对方就会加入你。',
        earnHead: '荣誉从哪来',
        earn: (H) => [
          ['对战电脑', `胜利：学徒 ${H.win[0]} · 大师 ${H.win[1]} · 传说 ${H.win[2]}`],
          ['街机模式', `按难度计算胜利 · Shura ${H.win[3]} · 通关 +${H.arcadeClear}`],
          ['锦标赛与段位', `胜利 ×${H.modeMul.tourney} · 锦标赛制霸 +${H.tourneyClear} · 每场段位试炼 +${H.danPass(1)} 起`],
          ['虽败犹荣', `参战 ${H.loss} · 每赢一回合 ${H.roundWon}`],
          ['精彩表现', `弹反、反击、对拆、完美回合：每场最多 +${H.styleCap}`],
        ],
        rivalsHead: '宿敌',
        arenasHead: '竞技场',
        open: '已解锁',
        castle: '在街机模式中击败Shura',
        you: (n) => `你的荣誉：${num(n)}`,
      },
      rival: {
        stage: '宿敌挑战',
        selTitle: (name) => `${name}向你发起挑战 · 选择你的忍者`,
        lvHp: (lv, p) => (p === 100 ? lv : `${lv} · 宿敌体力 ${p}%`),
        accept: '接受挑战',
        acceptSub: (name) => `获胜即可收服${name}`,
        quit: '撤退',
        hud: '宿敌挑战',
        winTitle: (name) => `${name}加入了你！`,
        winSub: (name) => `${name}已出现在选人界面。马上试试吧！`,
        tryNew: (name) => `使用${name}`,
        lossTitle: '挑战仍在继续',
        lossSub: (name, p) => `这次${name}赢了。输了也没有任何损失；下次对方将以${p}%体力开局。`,
        lossSubMin: (name) => `这次${name}赢了。输了也没有任何损失；再试一次吧。`,
        retry: '再次挑战',
        reveal: '新忍者',
        toastReady: (name) => `${name}向你发起挑战！`,
        lines: {
          hana: '听说了你的荣誉，整个集市都在议论你！跟得上我的舞步，我就跟你走！',
          tetsu: '你的名声已传到我耳中。击败我，我的薙刀便为你而战。',
          ren: '哈！终于有人找我了！你赢了我就归你，输了就听我大笑吧！',
          kage: '我已经观察你一段时间了。抓住我的影子，我便归你。',
          tora: '证明你不是猎物。挣脱我的锁链，我便与你同行。',
          jin: '若你的荣誉发自内心，我的棍自会知晓。来，让我考验你。',
          mai: '诚邀你登上我的舞台。赢得我的掌声，我的舞便属于你。',
          tsubame: '我在远处看过了，你很不错。躲开我的箭，我的弓便与你同在。',
        },
      },
    });

    // ================================================================ COMBAT: new kits, combos, move list (combat designer)
    // Akane/Aoi/Ren/Kage identities, combo counter, ki cancel, ND.MOVELIST names/descriptions (read through ND.i18n.t)
    merge(EN.CHARS, {
      akane: { desc: '居合术高手。刀静候鞘中，每一斩都是拔刀斩；她的拔刀架势能接住来袭的攻击。', weapon: 'Katana（居合）' },
      aoi: { desc: '单手持太刀的风之剑士。突刺距离长，风步一步就能拉近任何距离。', weapon: 'Tachi' },
      ren: { desc: '戴鬼面的斗士。刀扛在肩上；用肘、膝、肩和头作战，专破防御。' },
      kage: { desc: '戴兜帽的影子。反手握忍刀；以影步、佯攻和烟雾弹作战。' },
    });
    merge(EN.TXT, { kiCancel: '气取消！', launch: '挑空！', iaiCatch: 'IAI GAESHI!' });
    EN.PATTERNS.push([/^(\d+) VURUŞ$/, '$1连击']);
    merge(EN.PHRASES, {
      // shared rows
      'Tekme': '踢击',
      'Tekme: dengeyi hızla doldurur, gardı kırmaya yarar. Ardından AĞIR ile seri bitirişine bağlanır.': '踢击：快速积累架势，有助于破防。接重斩可打出连段收尾。',
      'Shuriken fırlatır; zamanla yeniden dolar.': '投掷手里剑；会随时间补充。',
      'Hava kesiği': '空中斩',
      'Havada hafif kesik. Havaya fırlatılmış rakibe de vurur.': '空中轻斩。也能击中被挑空的对手。',
      'Dalış': '下劈',
      'Havadan aşağı dalış kesiği; yere serer.': '从空中向下俯冲斩击；击倒。',
      'Kaeshi-waza (karşılık)': 'Kaeshi-waza（反击）',
      'Gard ya da savuşturmanın hemen ardından karşılık: nötr Suriage, ileri Harai (yere serer), geri Nuki (arkaya geçer), ağır Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.': '防御或弹反后立刻反击：不按方向 Suriage，前 Harai（击倒），后 Nuki（绕到身后），重斩 Uchiotoshi。你的第三次回击是终结技；若被弹反，对拆继续。',
      'Fırlatıcı isabet edince HAFİF: rakibin peşinden sıçrayıp havada keser. Ardından AĞIR ile yere çakar. Havadaki rakip en çok üç vuruş alır.': '挑空命中后按轻斩：跃起追击，在空中斩击。再按重斩把对手砸向地面。空中的对手最多承受三击。',
      'Üç vuruşluk hafif seri. İkinci ve üçüncü vuruş ki doluyken tekniğe bağlanır.': '三段轻斩连段。气槽满时，第二、三击可取消接气技。',
      'Ağır vuruş: yavaş ama yere serer.': '重击：慢，但能击倒。',
      'İleri atılarak dürter; hafif seriye devam eder.': '向前突进刺击；可接轻斩连段。',
      'Yarım adım geri çekilip bacaklara alçak süpürme; yere serer.': '后撤半步，向腿部低扫；击倒。',
      'Fırlatıcı: yükselen kesik rakibi havaya kaldırır.': '挑空：上挑斩把对手打上空中。',
      'Sıçrayıp tepeden iner: yavaş ama gardı ezer, yere serer.': '跃起从上方劈下：慢，但能压垮防御并击倒。',
      'Atılırken dönerek geniş kesik; yere serer.': '冲刺中旋身大范围斩击；击倒。',
      'İki kesiklik seri bitirişi; son kesik yere serer.': '两斩连段收尾；最后一斩击倒。',
      'Rakibin kılıcını aşağı çarpıp dürter: gardı ezer.': '把对手的刀压下再刺击：压垮防御。',
      // Akane
      'Kından yatay çekiş kesiği, çapraz iniş, geri dönen kesik; kılıç her seferinde kınına döner.': '出鞘横斩、斜劈、回身斩；每次斩完刀都会收回鞘中。',
      'Derin çömelişten geniş yatay çekiş; yere serer.': '深蹲后大范围横向拔刀斩；击倒。',
      'Atılarak kından çekiş: uzak mesafeyi bir anda kapatır, seriye devam eder.': '突进拔刀斩：瞬间拉近远距离，可接连段。',
      'Kılıcı çekmeden kabzayla göğse vurur: hızlı, sersemletir. Ardından HAFİF ile Kesa ya da AĞIR ile Kurenai Renga.': '不拔刀，用刀柄撞击胸口：快速且能眩晕。接轻斩出 Kesa，接重斩出 Kurenai Renga。',
      'Fırlatıcı: kından yükselen çekiş rakibi havaya kaldırır.': '挑空：出鞘上挑把对手打上空中。',
      'Çekiş duruşu: kısa bir an bekler; bu sırada gelen yakın dövüş darbesini yakalar ve kaçınılmaz bir iai kesiğiyle karşılık verir. Boşa giderse açık kalır.': '拔刀架势：短暂静候；期间来袭的近身攻击会被接住，并以无法闪避的居合斩回敬。若落空则会露出破绽。',
      'Kesa’dan sonra yükselen ve inen iki çekiş kesiği; son kesik yere serer.': 'Kesa 之后接一上一下两记拔刀斩；最后一斩击倒。',
      'Tekmeden sonra çömelip rakibin içinden geçen kızıl iai; arkasında belirir.': '踢击后俯身使出赤红居合，贯穿对手；在其身后现身。',
      // Aoi
      'Tek elle uzun dürtüş, yukarı savrulan kesik ve rüzgâr adımıyla derin atılma dürtüşü.': '单手长距离突刺、上撩斩，再借风步深入突刺。',
      'Dönerek geniş yatay kesik; yere serer.': '旋身大范围横斩；击倒。',
      'Rüzgâr adımı: çok uzaktan tek hamlede dürter, seriye devam eder.': '风步：从很远处一步突刺，可接连段。',
      'Geri çekilirken uzun menzilli iniş kesiği: yaklaşanı cezalandırır.': '后撤时的长距离下劈：惩罚贸然接近的对手。',
      'Fırlatıcı: dönerek yükselen kesik rakibi havaya kaldırır.': '挑空：旋身上挑把对手打上空中。',
      'Geri sıçrar, ardından çok uzağa uzanan dürtüşle geri döner: gardı ezer, yere serer.': '向后跳开，再以超长突刺杀回：压垮防御并击倒。',
      'Üç hızlı dürtüş; sonuncusu rüzgârla rakibi savurur.': '三记快速突刺；最后一记乘风把对手吹飞。',
      'İki kez dönerek çevresini biçen kesik; gardı ezer.': '旋转两圈，斩向四周；压垮防御。',
      // Ren
      'Kesik · Dirsek · Diz': '斩 · 肘 · 膝',
      'Tek elle kesik, dirsek darbesi ve uçan diz: kılıçla başlayıp bedenle biter.': '单手斩、肘击、飞膝：以刀起手，以肉身收尾。',
      'İki elle tepeden ezici iniş; gardı zorlar, yere serer.': '双手从上方猛力劈下；施压防御并击倒。',
      'Omuz hücumu: öne atılıp omuzla çarpar, dengeyi sarsar. İsabet ederse seriye devam eder.': '肩撞：向前冲撞，动摇架势。命中后可接连段。',
      'Kafa atar: kısa menzil, uzun sersemletme. İsabet ederse seriye devam eder.': '头槌：距离短，眩晕久。命中后可接连段。',
      'Fırlatıcı: aşağıdan yukarı iki elle savrulan kesik.': '挑空：双手由下往上挥斩。',
      'Topuğu havaya kaldırıp balta gibi indirir: yere serer.': '高抬脚跟，如斧头般劈下：击倒。',
      'Dirsekten sonra kesik ve tepeden ezici iniş; son vuruş yere serer.': '肘击后接一斩和从上方的猛劈；最后一击击倒。',
      'Tekmenin ardından dönen topuk tekmesi; yere serer.': '踢击后接回旋踵踢；击倒。',
      // Kage
      'Ters tutuşla kesik, dönen kesik ve gölge adımı: kaybolup öne geçer, dürterek belirir.': '反手斩、回旋斩和影步：消失后闪到前方，现身时刺击。',
      'Sıçrayıp ters tutuşla aşağı saplar; yere serer.': '跃起反手向下刺；击倒。',
      'Gölge gibi uzun atılma kesiği; seriye devam eder.': '如影般的长距离冲刺斩；可接连段。',
      'Aldatma: kesecekmiş gibi parlar, dumanla geri kaçar. Erken savuşturmayı boşa çıkarır; hemen HAFİF ile gölge adımına, AĞIR ile Kage-nui’ye bağlanır.': '佯攻：闪光作势要斩，随即借烟雾后撤。能骗掉过早的弹反；接轻斩立刻转入影步，接重斩转入 Kage-nui。',
      'Fırlatıcı: ters tutuşla yükselen kesik.': '挑空：反手上挑斩。',
      'Ayağının dibine sis bombası atar: yakındakini sersemletir, Kage dumanın içinde geri kaçar.': '向脚下扔出烟雾弹：眩晕附近的对手，Kage则在烟雾中后撤。',
      'Üç hızlı ters kesik ve aşağı saplama; sonuncusu yere serer.': '三记快速反手斩加一记下刺；最后一击击倒。',
      'Tekmeden sonra dumanda kaybolur, rakibin arkasında belirip saplar.': '踢击后消失在烟雾中，出现在对手身后刺击。',
      // template row names
      'Nodachi serisi': 'Nodachi 连段', 'Ağır nodachi': '重 Nodachi', 'Kodachi serisi': 'Kodachi 连段', 'Ağır kesik': '重斩',
      'Tantō dansı': 'Tantō 之舞', 'Çift kesik': '双斩', 'Naginata serisi': 'Naginata 连段', 'Ağır savuruş': '重挥',
      'Zincir ve orak': '锁链与镰刀', 'Zincir çekişi': '锁链拉扯', 'Asa serisi': '棍连段', 'Ağır süpürme': '重扫',
      'Yelpaze serisi': '扇连段', 'Rüzgâr dalgası': '风浪', 'Tantō serisi': 'Tantō 连段', 'Ok (basılı tut: güçlü)': '射箭（按住：强射）',
      'Geri + AĞIR da ok atar (basılı tut: güçlü atış); ok kalmadıysa tantō ile tepeden iner.': '后 + 重斩也能射箭（按住：强力射击）；没有箭时，她会持短刀从上方劈下。',
      // combat pop-ups
      'KI İPTALİ!': '气取消！', 'HAVAYA!': '挑空！',
    });

    // ================================================================ COUNTER CINEMATIC + COMBO TRIAL (combat feel pass)
    // js/kaeshi-cine.js STR.kaeshi, js/combo-trial.js STR.trial, js/coach.js combo/counter tips, move list legend
    {
      const tb = (t, c) => `<i class="tb${c ? ' ' + c : ''}">${t}</i>`;
      merge(EN.STR, {
        kaeshi: {
          head: 'KAESHI-WAZA', strike: '出手！', hits: '连击',
          labels: {
            suriage: '顺刀上滑，斜斩而下',
            harai: '拨开刀锋，斩其双腿',
            nuki: '闪过攻击，从背后斩',
            uchiotoshi: '砸下刀锋，直刺而入',
            sandan: '三斩反击连段',
          },
        },
        trial: {
          title: '连段挑战',
          btn: { prev: '上一个连段', next: '下一个连段', retry: '重新开始', close: '关闭' },
          names: { chain: '基础连段', s1: '连段收尾', s2: '踢击连段', launch: '挑空', s3: '长连段' },
          desc: {
            chain: '按{L}三次。每次在前一击命中时按下；连段以有名字的终结技收尾。',
            s1: '按{L}两次，再按{H}：以重斩收尾。',
            s2: '{L}，踢击{K}，再按{H}。',
            launch: '{D} + {H}挑空；对手飞起时按{L}，再按{H}。',
            s3: '两次{L}，{D} + {H}挑空，{L}，{H}：五连击。',
          },
          ready: (w) => `起手：${w}`,
          startWith: (w) => `这个连段以${w}起手。`,
          early: '太早了：在前一击命中时按下。',
          late: '太晚了：在招式结束前、命中的瞬间按下。',
          wrong: (got, want) => `按错了：${got}，这一步需要${want}。`,
          dir: (want) => `缺少方向：${want}。先按住方向，再按键。`,
          miss: '落空：攻击没有命中。靠近木桩一些。',
          clear: '连段完成！', clearPop: '连段完成！',
          all: '这名忍者的所有连段挑战都已完成！',
        },
        coach: {
          combo: (l) => `快速按 ${l} ${l} ${l}：三连击`,
          comboT: (l) => `连续点 ${l} 三次：连击`,
          counter: (l) => `防御或弹反后，出现“出手！”时按 ${l}：反击`,
          counterT: (l) => `防御或弹反后，出现“出手！”时点 ${l}`,
        },
      });
      const L = Array.isArray(EN.STR.lessons) && EN.STR.lessons.find((l) => l.id === 'counter');
      if (L) L.d = '防御或弹反后，头顶会出现<b>出手！</b>：在它的计时条耗尽前按<kbd>F</kbd>。前/后 + <kbd>F</kbd>或<kbd>G</kbd>是其他反击方式。';
      if (EN.STR.lessonsTouch) EN.STR.lessonsTouch.counter = `防御或弹反后，头顶会出现<b>出手！</b>：在它的计时条耗尽前点${tb('攻击', 'tb-light')}。摇杆前/后 + ${tb('攻击', 'tb-light')}或${tb('重斩')}是其他反击方式。`;
      merge(EN.PHRASES, {
        'KOMBO TAMAM!': '连段完成！',
        'Nasıl okunur': '看懂招式表',
        '→ rakibe doğru, ← rakipten uzağa demek: o yön tuşunu (A / D ya da ok tuşları; rakip sağındaysa D) basılı tut ve saldırı tuşuna bas. Virgül: tuşlara sırayla bas. F hafif, G ağır, R tekme, S gard.':
          '→ 表示朝向对手，← 表示远离对手：按住该方向键（A / D 或方向键；对手在你右边时为 D），再按攻击键。逗号：依次按键。F 轻斩，G 重斩，R 踢击，S 防御。',
        '▶ rakibe doğru, ◀ rakipten uzağa: yön çubuğunu o yana itip düğmeye dokun. Virgül: düğmelere sırayla dokun. Antrenmandaki Kombo denemesi her seriyi adım adım gösterir.':
          '▶ 朝向对手，◀ 远离对手：把摇杆推向该方向再点按键。逗号：依次点按键。训练中的连段挑战会一步步演示每个连段。',
        'Gard ya da savuşturmanın ardından ekranda VUR! çıkar: altındaki çubuk bitmeden HAFİF’e bas. Yalnız HAFİF: Suriage. İleri + HAFİF: Harai (yere serer). Geri + HAFİF: Nuki (arkaya geçer). AĞIR: Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.':
          '防御或弹反后会出现“出手！”：在下方计时条耗尽前按轻斩。只按轻斩：Suriage。前 + 轻斩：Harai（击倒）。后 + 轻斩：Nuki（绕到身后）。重斩：Uchiotoshi。你的第三次回击是终结技；若被弹反，对拆继续。',
      });
    }

    // ================================================================ GRAPHICS QUALITY: the Graphics setting (js/gfx.js)
    // (Turkish source in i18n.js, block "graphics quality")
    merge(EN.STR, {
      gfx: {
        title: '画质',
        levels: { auto: '自动', high: '高', medium: '中', low: '低', custom: '自定义' },
        note: {
          auto: '根据设备自动选择，战斗卡顿时会自动降低。',
          high: '全部光照与特效。适合性能强的设备。',
          medium: '柔和光晕，无阴影。适合大多数手机。',
          low: '最流畅。适合较旧的手机。',
          custom: '你自己的设置（高级）。',
        },
        now: (lv) => `当前：${lv}`,
        // Settings → Graphics → Advanced (game.js gfxAdvBuild, js/gfx.js KNOBS): the switch, the line under it, the hint on
        // the heaviest rows, one title per knob and the value words (resolution shows percentages, anti-aliasing 2× / 4×)
        adv: {
          title: '高级',
          note: '修改任意一项都会变为“自定义”；点选预设即可恢复其数值。',
          hot: '最耗性能',
          knob: { scale: '分辨率', msaa: '抗锯齿', bloom: '光晕', shadows: '阴影与反射', effects: '天气与粒子' },
          val: { off: '关', low: '低', mid: '中', full: '全开', simple: '简单' },
        },
      },
    });

    // ================================================================ FRAME RATE: Settings → Graphics (js/gfx.js makePacer)
    // (Turkish source in i18n.js, block "frame rate"; the numbers themselves are not translated)
    merge(EN.STR, {
      fps: {
        title: '帧率',
        show: '显示帧率',
        levels: { max: '最高' },
        note: {
          60: '稳定不发热。最适合大多数手机。',
          90: '屏幕支持时更流畅。更耗电。',
          120: '在120Hz屏幕上最流畅。更耗电。',
          max: '屏幕允许的最高帧率。',
        },
      },
    });

    // ================================================================ SETTINGS SCREEN (js/settings.js; Turkish source in i18n.js)
    merge(EN.STR, {
      set: {
        title: '设置', close: '关闭',
        tabs: { audio: '声音', controls: '操作', gfx: '画质', lang: '语言' },
        touch: '触屏', keys: '键盘', pad: '手柄',
        touchNote: '触摸屏幕后，这里会显示触屏操作设置。',
      },
    });

    // ================================================================ LANGUAGE PICKER (js/lang-ui.js; Turkish source in i18n.js)
    // Language names are not translated: each one is written in its own language (ND.i18n.names).
    merge(EN.STR, { lang: { title: '语言', change: '更改语言', close: '关闭' } });

    // ================================================================ TOUCH HELP PER MOVEMENT MODE
    // (game.js touchHelp(): the menu's touch help follows the movement mode; Turkish source in i18n.js, block
    // "touch help per movement mode")
    merge(EN.STR, {
      thelp: {
        title: { float: '摇杆', fixed: '固定摇杆', dpad: '方向键' },
        float: { walk: '拇指放在空白的半边屏幕上滑动：行走', jump: '向上推：跳跃', guard: '向下拉：防御', dash: '向侧面快速拨两下：冲刺' },
        fixed: { walk: '按住摇杆中心向两侧推：行走', jump: '向上推：跳跃', guard: '向下拉：防御', dash: '向侧面快速拨两下：冲刺' },
        dpad: {
          walk: '按住：行走', step: '轻点：迈出一小步', jump: '点击：跳跃', guard: '按住：防御',
          dash: '连按两下：冲刺', both: '按在两个键之间可同时触发（▶ + ▲ = 向前跳）',
        },
        edit: (b) => `${b}：把任意按键拖到你喜欢的位置，并设置大小和透明度。位于设置 → 操作。`,
      },
    });

    // ================================================================ SHARED LABELS (static HTML / move list text that is the same word in Turkish)
    merge(EN.PHRASES, { 'Shuriken': '手里剑', 'KI': '气' });

    // Persistent character journeys.
    merge(EN.STR, { menu: { arcadeDesc: '每名忍者都有一段八场战斗的征途。继续挑战下一个对手，解锁角色结局和大师印。' }, sel: { title: { arcade: '街机模式 · 角色征途' } },
      journey: {
        start: '开始征途',
        resume: (i, n) => '继续 · ' + i + '/' + n + '',
        ending: '观看结局',
        replay: '重玩征途',
        badge: '大师印',
        completed: '征途完成',
        progress: (i, n) => '已完成' + i + '/' + n + '场 · 进度已保存',
        reward: '奖励：角色结局和永久大师印',
        saved: '每场胜利都会保存。中途离开战斗算作一次重试。',
        menu: (done, active) => '已完成' + done + '段征途 · ' + active + '段进行中',
        clearReward: '获得大师印 · 已解锁角色结局'
      }
    });

    // ================================================================ PROGRESS / ACCOUNT (Settings → Progress, Hall of Champions;
    // js/settings.js, js/banzuke.js; Turkish source in i18n.js, block "account and recovery code")
    merge(EN.STR, {
      set: { tabs: { save: '进度' } },
      acct: {
        title: '保留你的进度',
        cgOn: (n) => `CrazyGames 账号：${n}。你的称号、冠军配色、段位和成绩都会保存到账号中。`,
        cgWait: (n) => `CrazyGames 账号：${n}。正在连接你的账号…`,
        cgFail: (n) => `CrazyGames 账号：${n}。暂时无法连接你的账号；新成绩先保存在本设备上。`,
        cgSave: '把进度保存到你的 CrazyGames 账号',
        cgSaveNote: '登录后，你的称号、冠军配色和成绩会转移到账号中，所有设备通用。',
        rcTitle: '恢复码',
        rcNote: '请记下这串代码。在新设备上于此处输入，即可找回你的称号、冠军配色、段位和成绩。',
        rcShow: '显示代码', rcNew: '新代码', rcNewDone: '新代码已生成，旧代码已失效。',
        rcNeedName: '先用昵称保存一次成绩，才能获得恢复码。',
        rcEnter: '输入恢复码', rcGo: '恢复',
        rcDone: (n, c) => `欢迎回来，${n}！你的进度已恢复。新的恢复码：${c}`,
        err: { bad_code: '无法识别此代码。请检查字符是否正确。', rate: '尝试次数过多。请稍后再试。', offline: '无法连接服务器。请检查网络连接。', banned: '此身份无法使用。', error: '出错了。请再试一次。' },
        local: '此处无法在线保存；你的进度保存在本设备上。',
        offline: '你当前处于离线状态；你的进度保存在本设备上。',
        loading: '加载中…',
      },
      lb: { savedLocalAccount: (r) => (r ? `本设备第${r}名 · 暂时无法连接你的账号` : '已保存在本设备 · 暂时无法连接你的账号') },
    });

    // ================================================================ PRIVACY (js/privacy.js; Turkish source in i18n.js, block
    // "privacy"). The policy page itself (privacy.html) is English + Turkish; other languages see the English part.
    merge(EN.STR, {
      priv: {
        notice: 'Shadow Duel 会保存你的昵称和成绩，用于在线排行榜。',
        policy: '隐私政策', terms: '条款', both: '隐私政策与条款',
        ok: '好的', label: '隐私说明',
      },
    });

    // ================================================================ FIRST-FIGHT RALLY TUTORIAL: js/tutorial.js STR.tutor and
    // Training → Parry drill (Turkish source in i18n.js, block "rally tutorial")
    merge(EN.STR, {
      menu: { trainDrill: '弹反练习' },
      tutor: {
        defend: '防御！', attack: '攻击！', again: '再来！',
        pass: {
          freeze: (l, g) => `时间静止：按${g}防御，按${l}反击`,
          slow: (l, g) => `慢动作：光圈收拢时按${g}，再按${l}`,
          real: (l, g) => `全速：按${g}防御，按${l}反击，连做两次`,
        },
        fail: {
          early: '太早了！在刀刃落下前一刻防御。',
          late: '太晚了！在刀刃落下前一刻防御。',
          slow: '太晚了！趁“攻击！”出现时反击。',
          atk: '先防御，再攻击！',
          miss: '我们再试一次。',
        },
        mastered: '已掌握！', masteredSub: '防御、反击，循环往复',
        warm: (l) => `热身：按${l}三次`,
        nudge: (k) => `按${k}`, nudgeT: (k) => `点${k}`,
      },
    });

    // ================================================================ NEW PLAYER: the select screen's one-time greeting
    // (game.js openSelect), the VS goal line's "?" (arcade.js openVs) and the just-in-time tips (js/coach.js ND.coach.tips;
    // arguments: key / button chips, lessons: the menu names of Training and Tutorial). Turkish source in i18n.js.
    merge(EN.STR, {
      onb: { selIntro: '选择你的忍者：每名忍者都有自己的征途', more: '详情' },
      tips: {
        head: '提示',
        ki: (k) => `气槽已满！${k}：必杀技`,
        gbreak: (k, h) => `对手一直在防御：用${k}踢击或${h}重斩积满它的黄色条即可破防`,
        gbreakH: (h) => `对手一直在防御：用${h}重斩积满它的黄色条即可破防`,
        posture: (g) => `你的架势条正在积累：后退，或用${g}弹反`,
        dash: (a) => `连按两下${a}：冲刺`,
        shuriken: (t) => `${t}：投掷手里剑`,
        heavy: (h) => `${h}：重斩，较慢但更猛`,
        lessons: (a, b) => `完整课程：${a} → ${b}`,
        controls: (a, b) => `可在${a} → ${b}中移动按键和调整大小`,
      },
    });

    // ================================================================ online "play with a friend" (js/online.js: ND.STR.online)
    merge(EN.STR, {
      online: {
        title: '和好友对战',
        menuSub: '在线决斗 · 分享链接或6位字母房间码',
        homeSub: '创建房间并把链接发给好友，或输入好友发来的房间码。',
        create: '创建房间',
        join: '加入',
        codePh: '房间码',
        haveCode: '房间码',
        room: '房间',
        linkLabel: '邀请链接',
        back: '返回',
        leave: '离开房间',
        copy: '复制链接',
        copied: '已复制',
        share: '分享',
        invite: '邀请好友',
        shareText: (c) => `来 Shadow Duel 和我决斗吧！房间 ${c}`,
        inviteNote: '发送链接，或把房间码告诉好友。',
        waitFriend: '等待好友加入…',
        joining: '正在寻找房间…',
        connecting: '正在连接好友…',
        connected: '已连接',
        you: '你',
        friend: '好友',
        friendTag: '好友',
        waitPick: '选择中…',
        pickTitle: '你的战士',
        arenaTitle: '竞技场',
        arenaHost: '由好友选择竞技场',
        ready: '准备',
        notReady: '未准备',
        readyWait: '等待好友准备…',
        bothReady: '即将开始…',
        ping: (ms) => `延迟 ${ms} ms`,
        badCode: '房间码为6个字母。',
        noRoom: '没有找到此房间码。请和好友核对房间码。',
        full: '此房间已满。',
        expired: '10分钟内无人加入，房间已关闭。',
        noDirect: '无法直接连接到好友的网络。请换一个网络试试（Wi-Fi / 移动数据）。',
        retry: '再试一次',
        noConnect: '无法连接到好友。请检查网络连接后再试。',
        version: '你和好友的游戏版本不同。请双方都刷新页面。',
        signalDown: '无法连接游戏服务器。请检查网络连接。',
        friendLeft: '好友离开了房间。',
        waitIn: (s) => `等待好友… ${s}`,
        away: (s) => `好友切出了游戏… ${s}`,
        leaveQ: '要离开比赛吗？',
        leaveSub: '这一局将判好友获胜。',
        stay: '继续游戏',
        leaveMatch: '离开',
        win: '你赢了',
        lose: '你输了',
        draw: '平局',
        over: '比赛结束',
        whyDrop: '好友的连接已断开。你获胜（不记录）。',
        whyLeft: '好友离开了比赛。',
        whyAway: '你离开期间比赛已结束。',
        whyDesync: '比赛出现不同步（连接问题），因此不计入。',
        rematch: '再战',
        rematchWait: '等待好友…',
        rematchAsk: '再战（好友想再来一局）',
        change: '更换战士',
        rounds: (a, b) => `回合 ${a} – ${b}`,
        turning: (s) => `好友正在旋转手机… ${s}`,
        paused: '已暂停',
        whyPauseWin: '好友没能及时回来。你获胜（不记录）。',
        whyPauseLose: '你没能及时回来，比赛已结束。',
        whyPauseBoth: '你们都没能及时回来，比赛已结束。',
      },
    });

    // ================================================================ ranked duel (js/ranked.js: ND.STR.ranked)
    merge(EN.STR, {
      ranked: {
        title: '排位决斗', menuSub: '随机对手 · 积分、段位与赛季', offline: '排位赛暂时关闭',
        season: (n) => `第${n}赛季`, endsIn: (d) => `${d}天后结束`, endsToday: '今天结束',
        rating: '积分', record: (w, l, d) => `${w}胜 · ${l}负` + (d ? ` · ${d}平` : ''), placement: (a, b) => `定级赛 ${a}/${b}`,
        place: (n) => `排名第${n}`, find: '寻找对手', findUnranked: '寻找对手（非排位）', board: '排行榜', how: '规则说明',
        howLines: ['服务器会寻找积分与你相近的对手；等待越久，匹配范围越大。', '双方都接受后，各自在看不到对方选择的情况下挑选战士（仅限已解锁的战士）。',
          '三局两胜。中途离开比赛判负。', '只有双方设备报告的结果一致时积分才会变动。每个赛季持续4周；第1名可获得专属服装。'],
        reward: '赛季第1名：专属服装，并在冠军殿堂留名',
        signIn: '登录即可赚取积分', guestNote: '游客只能进行非排位对战。', nickNote: '起个昵称才能进行排位赛。',
        back: '返回', you: '你', titleLbl: '称号', noTitle: '无',
        searching: '正在寻找对手…', window: (n) => `积分范围 ±${n}`, windowAny: '不限积分',
        warm: '等待时和电脑热身', warmTag: '热身 · 电脑 · 非排位', searchShort: '匹配中', warmBack: '返回匹配', cancel: '取消',
        none: '暂时没有对手。', foundTitle: '找到对手！', accept: '接受', decline: '拒绝',
        ranked: '排位', unranked: '非排位 · 无积分',
        why: { guest: '有玩家是游客', same_network: '你们在同一网络下', pair_limit: '今天你们已进行过3场排位赛', daily_limit: '已达每日排位赛上限' },
        waitOpp: '等待对手接受…', touch: '触屏', keys: '键盘 / 手柄', placementTag: '定级赛', guestTag: '游客',
        declined: '对手没有接受 · 重新匹配中', youDeclined: '你拒绝了这场比赛。', penalty: (s) => `你最近拒绝了比赛：${s}秒后才能再次匹配。`,
        suspended: '你的排位账号正在审核中（争议过多）。其他模式仍可游玩。',
        pickTitle: '选择你的战士', pickSub: '对手看不到你的选择', lock: '锁定', lockedIn: '已锁定', oppPicking: '对手正在选择…', oppLocked: '对手已锁定',
        lockedFighter: '尚未在单人模式中解锁', costume: '服装', plain: '原始配色',
        connecting: '正在连接对手…', noConnect: '无法连接到对手，本场不计入。正在重新匹配…',
        leaveQ: '要离开比赛吗？', leaveSub: '你将输掉这场排位赛。', stay: '继续游戏', leave: '离开',
        waitIn: (s) => `等待对手… ${s}`, away: (s) => `对手切出了游戏… ${s}`, turning: (s) => `对手正在旋转手机… ${s}`, paused: '已暂停',
        confirming: '正在确认结果…', win: '你赢了', lose: '你输了', draw: '平局', over: '比赛结束',
        delta: (d) => (d >= 0 ? '+' : '−') + Math.abs(d) + '积分', nc: '本场不计入', disputed: '双方设备报告的结果不同：比赛正在审核中，积分未变动。',
        ncWhy: { desync: '双方设备对战斗的计算结果不同（连接问题）', connection: '双方玩家的连接都断开了', input_mismatch: '双方设备的输入记录不一致', abandoned: '双方玩家都离开了', no_second_report: '对手的结果始终没有送达', mixed: '结果不一致' },
        promoted: '晋级！', demoted: '段位下降', placementDone: '定级赛完成！', pending: '结果稍后将显示在排行榜上。',
        findAgain: '再次匹配', rematch: '再战', rematchWait: '等待对手…', rematchAsk: '再战（对手想再来一局）', menu: '菜单',
        youLeft: '你离开了比赛：判负。', oppLeft: '对手离开了比赛：你获胜。', silent: '对手的连接已断开。', rounds: (a, b) => `回合 ${a} – ${b}`,
        unrankedNote: '非排位比赛',
        ghostFound: '一名真实玩家的影子登场了',
        ghostHouseName: (n) => `道场影子 · ${n}`, ghostHouseFound: '道场影子登场了', ghostHouseNote: '以道场典型风格战斗的电脑。并非真人玩家。', ghostName: (n) => `${n}的影子`, ghostTag: '影子',
        ghostNote: '模仿这名真实玩家风格战斗的电脑。并非真人玩家。',
        ghostReady: '影子已就绪',
        ghostLeft: '你离开了影子对战：判负。', aiTag: 'AI',
        hallTab: '排位', hallDesc: (g) => `本赛季最佳 · 完成${g}场排位赛即可上榜`, champs: '历届冠军', champOf: (n) => `第${n}赛季冠军`,
        noChamps: '还没有赛季冠军。', me: (p) => `你的排名：第${p}名。`, meNone: '参加排位赛即可上榜。', empty: '本赛季还没有人上榜。',
        tierDesc: ['步卒', '浪人武士', '武士', '旗本护卫', '大名诸侯', '幕府将军'],
        rulesBtn: '排位规则', rulesTitle: '排位规则', rulesSub: '段位、积分与赛季', rTiers: '段位', rYou: '你',
        rNext: (n, name) => `距${name}还差${n}积分`, rTop: '你已位于最高段位', rPlacing: (a, b) => `定级赛 ${a}/${b}：完成后显示段位`,
        rPlacement: '定级赛', rPlaceLine: (a, b) => `你的前${a}场排位赛为定级赛（之后的赛季为${b}场），完成后显示段位。`,
        rPoints: '积分', rPointsLines: ['获胜加分，失败扣分；平局只小幅变动。', '击败更强的对手得分更多；输给更弱的对手扣分更多。', '中途离开比赛判负。'],
        rSeason: '赛季', rSeasonLine: (d, left) => `每个赛季持续${d}天 · ${left}。`,
        rSeasonEnd: (p) => `赛季结束时，你的积分会向1500回归一半，并需重新进行${p}场定级赛；你的最高段位将作为徽章保留。`,
        rReward: (list, n) => `赛季第1名可获得：${list}（榜上至少需有${n}名玩家）。`, rCostumeAll: (x) => `${x}（适用于所有战士）`, rRewardAny: '专属服装和称号',
        rBoard: '排行榜', rBoardLine: (g) => `上榜条件：本赛季完成${g}场计分比赛，且已完成定级赛。`,
        rFighters: '战士', rFightersLine: '可选择你在单人模式中已解锁的战士。',
        aiNote: '在线玩家较少时，你可能会匹配到模仿真实玩家风格的AI对手。', gotIt: '知道了',
        err: { network: '无法连接服务器。请检查网络连接。', bad_version: '游戏有新版本了：请刷新页面。', busy: '排队人数过多，请稍后再试。',
          rate_limited: '尝试次数过多，请稍等片刻。', disabled: '排位赛暂时关闭。', banned: '此账号无法进行排位赛。', other: '出错了，请再试一次。' },
      },
    });

    // ================================================================ LEVEL + SHADOW PASS (js/level.js, js/pass.js)
    // English: L.en in js/i18n-pass.js; the on-demand languages keep these texts in their own file.
    merge(EN.STR, {
      pass: {
        k: '影', lv: 'LV',
        level: (n) => `等级 ${n}`,
        xp: (a, b) => `${a} / ${b} XP`, xpMax: (n) => `共 ${n} XP`, plus: (n) => `+${n} XP`,
        name: '影之通行证', season: (n) => `第${n}赛季`, left: (d) => `剩余${d}天`, lastDay: '最后一天',
        tier: (t, n) => `第${t}/${n}阶`, ready: (n) => `${n}个奖励待领取`,
        free: '免费', bonus: '暗影', bonusAds: '每个奖励：看一段广告', bonusWait: (n) => `免广告：${n}阶后解锁`,
        claim: '领取', claimAll: (n) => `全部领取（${n}）`, owned: '已领取', watch: '看广告', milestone: '免费', opensAt: (t) => `第${t}阶解锁`,
        online: '需要联网', soon: '更多阶段即将推出', soonXp: '你的经验仍在累积', close: '关闭', tabs: { pass: '通行证', profile: '个人资料' },
        rows: { win: '胜利', loss: '参战', rounds: '回合', perfect: '完美', rally: '对拆', counter: '反击', parry: '弹反', short: '速战速决', boost: '加成', daily: '每日首胜', streak: '连续天数', clear: '征途', trial: '连段挑战', tutorial: '教程' },
        streakN: (n) => `第${n}天`,
        up: '升级了', got: '新奖励',
        boostName: (n) => `×1.5 XP · ${n}场`, honorName: (n) => `+${n}荣誉`,
        gotDup: (n) => `已拥有：改为${n}场 ×1.5 XP`, boostLeft: (n) => `×1.5 XP · 剩余${n}场`,
        kinds: { cos: '服装', title: '称号', badge: '徽章', frame: '边框', trail: '刀光', boost: '经验加成', honor: '荣誉' },
        use: '装备', inUse: '已装备', none: '暂无', wearHint: '在选择战士界面的配色一栏穿戴服装。',
        heads: { titles: '称号', badges: '徽章', frames: '边框', trails: '刀光', costumes: '服装', seals: '征途印' },
        total: (n) => `共 ${n} XP`, streak: (n) => `连续${n}天`,
        daily: '每日首胜：+100 XP', dailyDone: '今日首胜：已完成',
        seal: { 1: '征途已通关', 2: 'Menkyo：征途通关2次', 3: 'Kaiden：征途通关3次' },
        clears: (n) => `征途已通关${n}次`,
        next2: '第2次通关征途：Menkyo服装和称号', next3: '第3次通关：Kaiden暗影和称号',
        rank: { 2: 'Menkyo', 3: 'Kaiden' }, cos2: (n) => `${n} · Menkyo配色`, cos3: (n) => `${n} · Kaiden暗影`,
        themes: { sakura: '樱花', ember: '余烬', frost: '霜华', jade: '翡翠', ash: '灰烬', moon: '月光', lotus: '莲华', storm: '风暴', yami: 'Yami' },
        items: {
          trail_sakura: '樱花刀光', trail_ember: '余烬刀光', trail_frost: '霜华刀光', trail_jade: '翡翠刀光', trail_violet: '紫色刀光', trail_gold: '金色刀光',
          title_novice: '新锐之刃', title_wanderer: '游侠', title_duelist: '决斗者', title_parry: '钢铁之壁', title_ronin: '浪人', title_nightblade: '夜之刃', title_s1: '第1赛季之影',
          badge_blade: '刀刃徽章', badge_moon: '明月徽章', badge_fire: '烈火徽章', badge_snow: '飞雪徽章', badge_sakura: '樱花徽章', badge_dragon: '神龙徽章', badge_kage: '暗影徽章',
          frame_bronze: '青铜边框', frame_silver: '白银边框', frame_crimson: '赤红边框', frame_jade: '翡翠边框', frame_gold: '黄金边框',
        },
      },
    });

    // ================================================================ 1.3.2 SHADOW PASS: 30 tiers, fight flair, progress rewards,
    // the ranked shield, the Profile screen (English: X.en in js/i18n-pass.js; flair: the fight flair's names, js/flair.js ids)
    merge(EN.STR, {
      pass: {
        kinds2: { pose: '胜利姿势', hitfx: '打击特效', slash: '反击斩', aura: '气之灵光', ko: 'KO终结', card: '名牌', arena: '场地变体', music: '菜单音乐', rkey: '钥匙', akey: '钥匙', ticket: '券', shield: '护盾' },
        items2: { key_rival: '挑战钥匙', key_arena: '场地钥匙', ticket_trial: '试用券', shield: '排位护盾' },
        heads2: { title: '称号', flair: '战斗装饰', arenas: '场地变体', music: '菜单音乐', items: '道具' },
        profile: '个人资料',
        profileSub: '称号 · 服装 · 装饰',
        passTab: '影之通行证',
        tapEquip: '点击装备',
        plain: '普通',
        usual: '默认',
        noneYet: '从影之通行证获得',
        shields: (n, m) => `排位护盾 ${n}/${m}`,
        shieldHelp: '排位赛输掉一场不扣分；每天一次，自动生效。',
        tickets: (n) => `试用券：${n}`,
        ticketHelp: '用 3 场人机对战试用一名未解锁的忍者：在角色选择界面点击该忍者。',
        useTicket: (n) => `试用券 · ${n}场`,
        useTicketSub: (n) => `持有 ${n} 张`,
        ticketLeft: (n) => `试用：还剩 ${n} 场`,
        keyRival: (name) => `挑战已开启：${name}`,
        keyArena: (name) => `场地已开启：${name}`,
        keyHonor: (n) => `已无可开启之物：+${n}荣誉`,
        shieldGot: (n, m) => `排位护盾：${n}/${m}`,
        shieldFull: (n) => `护盾已满：改为 +${n}荣誉`,
        shieldOff: (n) => `这里没有排位赛：改为 +${n}荣誉`,
        shieldUsed: '护盾已生效：未扣分',
        rankedHonor: (n) => `+${n}荣誉`,
        variant: '变体',
        flair: { pose_tenchi: '举刃向天', pose_rei: '行礼', pose_hiza: '跪姿残心', pose_katsugi: '扛刀于肩', pose_kissaki: '下一个就是你', hitfx_kinpaku: '金箔打击', hitfx_aizome: '靛蓝墨', hitfx_sakura: '樱花绽放', hitfx_kitsunebi: '狐火', hitfx_raijin: '雷神火花', slash_kin: '金之刃', slash_sumi: '墨笔', slash_hana: '花瓣之风', slash_rai: '雷斩', aura_kitsunebi: '狐火灵光', aura_raiun: '风暴灵光', aura_hana: '繁花灵光', aura_gekko: '月光灵光', ko_enso: '圆相终结', ko_hanafubuki: '花吹雪', ko_raiko: '落雷', ko_mikazuki: '新月', card_seigaiha: '青海波', card_yozakura: '夜樱', card_ryu: '龙之漆', card_tsukiyo: '月下松林', card_asanoha: '麻叶金纹', arena_temple_snow: '雪中神社', arena_rain_moon: '月下竹林', arena_snow_night: '雪峰之夜', arena_market_rain: '雨夜集市', music_haru: '春之庭', music_yuki: '雪月', music_matsuri: '祭典之夜', pass1_akane: '月影华服' },
      },
    });

    void dec; void fmtTime; void num;
  };

  // ---------------------------------------------------------------- journey texts (js/journey-text.js reads ND.JOURNEY_COPY)
  // Same lists, same order and same counts as the `en` entry in js/journey-text.js (ui 17, goals 10, titles 13, endings 13).
  (ND.JOURNEY_COPY || (ND.JOURNEY_COPY = {}))['zh'] = {
    ui: ['角色征途', '最终对手', '可选精通', '赢下这一战才能保住星星。', '获得精通星', '未获得星星 · 重玩时再试', '精通星', '以8颗星中的6颗完成征途，即可赢得称号和传承配色。星星在重玩之间保留。', '原始配色', '传承配色', '外观', '获得6颗精通星并完成该角色的征途。', '你之前的征途和奖励都已保留。重玩即可探索新路线。', 'Shura挑战：完成3名不同角色的征途。', '赢下这场决斗即可解锁', '征途完成', '章节'],
    goals: ['弹反', '反击命中', '重击命中', '踢击命中', '空中命中', '冲刺攻击命中', '连击第三击命中', '飞行道具命中', '气技命中', '破防'],
    titles: ['赤红誓言', '无羁之风', '山之心', '冬日足迹', '月下之花', '不倒之旗', '摘下面具的勇气', '无声之约', '脱链之虎', '摊开的手', '静谧微风', '远方地平线', '第二个黎明'],
    endings: [
      'Akane在Ren面前放下了刀。她的流派将通过传授而非复仇来重建。',
      'Aoi了结了与Akane的旧日决斗，以平等之身离开寺院，从此自由选择自己的路。',
      'Kuro和Tetsu放下了武器。山路再次向村民们敞开。',
      'Yuki握住了Hana伸出的手。她第一次在别人的足迹旁留下了自己的足迹。',
      'Hana带Yuki回到了灯笼祭。她的最后一支舞，为朋友留了位置。',
      'Tetsu赢得了Kuro的尊重，将旗帜插在山口：再也不会有村民被拒之门外。',
      'Ren识破了Kage的诡计，摘下了自己的面具。他不再需要靠恐惧让人倾听。',
      'Kage让Ren看到了自己的脸，随后消失。这一次，他的承诺比他的影子活得更久。',
      'Tora把锁链放在Jin的棍旁。渡口不再属于任何主人。',
      'Jin没有取Tora性命便制止了他。在瀑布旁，一位新弟子请求上第一课。',
      'Mai用扇子接住了Tsubame的最后一支箭。她们的较量以一礼收场，而非怨恨。',
      'Tsubame终于读懂了Mai的风。她没有射出最后一支箭，转身望向新的地平线。',
      'Shura摘下王冠面对Akane。失败不再定义他；下一课将在黎明开始。',
    ],
  };

  if (ND.i18n && ND.i18n.loaded) ND.i18n.loaded('zh');
})(window.ND = window.ND || {});
