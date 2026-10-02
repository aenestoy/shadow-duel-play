// Shadow Duel — Indonesian catalog for ND.i18n, translated from the English one (js/i18n-en.js).
// Loaded on demand: js/i18n.js loads this file only when the game runs in this language. Same structure as i18n-en.js.
// Informal "kamu" throughout; words chosen so Malay players understand them too.
// Glossary: guard = bertahan / jaga (button JAGA), guard break = pertahanan hancur, parry = tangkis / tangkisan,
//   counter = serangan balik / serang balik, posture = kuda-kuda, ki technique = teknik ki, blade lock = adu pedang,
//   dash = lesat / melesat (button LESAT), combo = kombo, light / heavy slash = tebasan ringan / berat,
//   kick = tendangan (button TENDANG), rally = saling balas, launcher = pelontar, dive = tukikan, dummy = boneka,
//   arcade = Arkade, training = Latihan, tutorial = Tutorial, ranked = Ranked (laga ranked), journey = perjalanan,
//   mastery star = bintang keahlian, Hall of Champions = Aula Juara, shadow (ghost opponent) = bayangan,
//   season = musim, round = ronde, fight = laga, leaderboard = papan peringkat, Dan rank = pangkat,
//   trial = ujian (Ujian Dan), tournament = turnamen, damage = damage, HP = HP, pts = poin
//   Shadow Pass = Pass Bayangan, level = level (tag LV), tier = tier, placement = penempatan, claim = ambil,
//   reward = hadiah, costume = kostum, title = gelar, badge = lencana, frame = bingkai, blade trail = jejak pedang,
//   booster = penguat, streak = beruntun, journey seal = segel perjalanan, AI opponent = lawan AI
//   touch buttons: SERANG · RINGAN · BERAT · TENDANG · JAGA · LESAT · SHUR. · KI · LOMPAT
// Control changes that ship with this build are written into the text: P pauses (Escape is
// CrazyGames' fullscreen key), ⌫ goes back, player 2 throws shuriken with I.
(function (ND) {
  'use strict';
  (ND.I18N_CATALOGS || (ND.I18N_CATALOGS = {}))['id'] = function (I, EN) {
    const merge = I.merge;
    const num = (n) => I.num(n);
    const dec = (x) => I.dec(x);
    const fmtTime = (s) => I.time(s);

    // ================================================================ UI tables (ND.STR)
    merge(EN.STR, {
      menu: {
        brand: (nc, na) => `${nc} petarung, ${na} arena, dan satu master rahasia. Duel pedang langsung, adu pedang, tangkisan, kuda-kuda hancur, teknik ki, dan fisika ragdoll.`,
        arcade: 'Arkade',
        arcadeDesc: 'Kalahkan para rival satu per satu sementara tingkat kesulitan naik, dengan master rahasia menunggu di akhir. Menang untuk membuka ninja dan arena baru.',
        arcadeProg: (best, c, ct, a, at) => `${best ? 'Terbaik ' + num(best) + ' · ' : ''}${c}/${ct} ninja · ${a}/${at} arena terbuka`,
        train: 'Latihan',
        trainDesc: 'Berlatih bebas dengan boneka atau belajar langkah demi langkah',
        trainFree: 'Bebas',
        trainTut: 'Tutorial',
        watchShort: 'Dua ninja acak, CPU Legenda',
        specialKey: 'Teknik ki (ki penuh)',
        single: 'Laga Tunggal', singleDesc: 'Lawan CPU atau dua pemain',
      },
      sel: {
        title: { '2p': 'Pilih ninjamu', cpu: 'Pilih ninjamu', arcade: 'Arkade · Pilih ninjamu', train: 'Latihan · Pilih ninjamu', tutorial: 'Tutorial · Pilih ninjamu', tourney: 'Turnamen Bulanan · Pilih ninjamu', dan: 'Ujian Dan · Pilih ninjamu' },
        who1: { '2p': 'Pemain 1 · A / D pilih, F konfirmasi', def: 'Kamu · A / D pilih, F konfirmasi' },
        who2: { '2p': 'Pemain 2 · ← / → pilih, K konfirmasi', cpu: 'Lawan (CPU) · ← / → pilih', train: 'Boneka · ← / → pilih' },
        go: { def: 'Mulai laga', arcade: 'Mulai Arkade', train: 'Mulai latihan', tutorial: 'Mulai tutorial', tourney: 'Mulai turnamen', dan: 'Mulai ujian' },
        random: 'Acak',
        arena: 'Arena',
        locked: 'Terkunci',
        lockMsg: (name, hint) => `${name} terkunci · ${hint}`,
        keyHint: '<kbd>Enter</kbd> mulai · <kbd>⌫</kbd> kembali',
      },
      hint: {
        wins: (n, cur) => `Menangkan ${n} laga di Arkade (${Math.min(cur, n)}/${n})`,
        clear: 'Tamatkan Arkade sekali',
        boss: 'Kalahkan bos terakhir di Arkade',
        arena: 'Menangkan satu laga di arena ini dalam Arkade',
      },
      toast: {
        newChar: (name) => `Petarung baru terbuka: ${name}`,
        newArena: (name) => `Arena baru terbuka: ${name}`,
        newBest: (s) => `Rekor baru: ${num(s)} poin`,
        lesson: (t) => `Pelajaran selesai: ${t}`,
        tutDone: 'Tutorial selesai!',
        perf: 'Grafis diturunkan demi performa',
      },
      vs: {
        stage: (i, n) => `Laga ${i} / ${n}`,
        boss: 'Laga terakhir',
        go: 'Tarung!',
        quit: 'Keluar Arkade',
        keys: '<kbd>Enter</kbd> / <kbd>F</kbd> mulai · <kbd>⌫</kbd> keluar',
        unknown: '?',
      },
      hud: { you: 'KAMU', cpu: 'CPU', dummy: 'BONEKA', stage: (i, n) => `${i}/${n}`, boss: 'BOS AKHIR', inf: '∞', lockSolo: 'Tekan F / K cepat!', lockDuo: 'Tekan ringan/berat cepat!' },
      end: {
        rematch: 'Tanding ulang', change: 'Ganti petarung', menu: 'Menu utama',
        winTitle: 'Kemenangan milikmu',
        winSub: (i, n, pts) => `Laga ${i}/${n} selesai · +${num(pts)} poin`,
        next: 'Laga berikutnya',
        bossNext: 'Menuju akhir',
        lossTitle: 'Kalah',
        lossSub: (name) => `${name} lebih unggul kali ini. Coba lagi.`,
        retry: 'Coba lagi',
        quit: 'Keluar Arkade',
      },
      ending: {
        head: 'Tamat',
        rows: { fights: 'Laga', time: 'Total waktu', retries: 'Ulangan', perfect: 'Ronde sempurna', score: 'Skor', best: 'Terbaik' },
        newBest: 'Rekor baru!',
        menu: 'Menu utama',
        again: 'Main lagi',
        unlocked: 'Terbuka',
        fightPts: 'Poin laga',
        bonus: 'Bonus tamat',
      },
      score: {
        hud: 'SKOR',
        rows: { hit: 'Serangan', combo: 'Kombo', counter: 'Serangan balik', defense: 'Pertahanan', pressure: 'Tekanan', special: 'Teknik ki', round: 'Kemenangan', perfect: 'Sempurna', hp: 'Sisa HP', time: 'Bonus waktu' },
        total: 'Skor laga',
        diff: (name, m) => `termasuk ${name} ×${dec(m)}`,
        best: (s) => `Rekormu: ${num(s)}`,
        newBest: 'Rekor baru!',
        arcadeTotal: (s) => `Total Arkade: ${num(s)}`,
        lossNote: (s, pen) => `Percobaan ini tidak dihitung · total Arkade ${num(s)} · tiap ulangan −${num(pen)}`,
        clearBonus: (c, n) => `+${num(c)}${n ? ' · tanpa ulangan +' + num(n) : ''}`,
        lossCpu: 'Kalah · hanya kemenangan yang masuk papan',
        cpuBoardHint: 'Kemenangan di tingkat Legenda masuk papan peringkat',
      },
      lb: {
        menu: 'Peringkat',
        menuDesc: 'Rekor Arkade dan Legenda',
        title: 'Papan Peringkat',
        back: 'Kembali',
        boards: { arcade: 'Arkade', cpu_efsane: 'CPU Legenda' },
        boardDesc: { arcade: 'Total skor Arkade yang ditamatkan', cpu_efsane: 'Skor satu laga yang dimenangkan melawan CPU Legenda' },
        all: 'Semua',
        status: { loading: 'Memuat…', online: 'Peringkat online', readonly: 'Peringkat online · hanya lihat', local: 'Peringkat lokal', error: 'Gagal · peringkat lokal', offline: 'Offline · peringkat lokal' },
        empty: 'Belum ada skor. Jadilah yang pertama!',
        loadErr: 'Gagal memuat papan peringkat.',
        you: 'Kamu', youTag: 'kamu', player: 'Pemain',
        nick: 'Nama', nickPh: 'Nama panggilanmu', nickSave: 'Simpan', nickEdit: 'Ubah',
        nickAsk: 'Nama untuk papan peringkat lokal:',
        saving: 'Menyimpan…',
        savedOnline: (r) => `Peringkat online: #${r}`,
        savedOnlineNoRank: 'Tersimpan di papan peringkat online',
        savedOnlineAll: (r) => `Peringkat online sepanjang masa: #${r}`,
        platSignIn: 'Masuk akun untuk mengirim skormu secara online',
        platPending: 'Tersimpan di perangkat ini · masuk akun untuk mengirimnya ke papan online',
        savedOnlineGap: (r, g) => `Peringkat online: #${r} · ${g} poin lagi ke 10 besar`,
        reason: {
          needName: 'Pilih nama untuk ikut papan peringkat online',
          offline: 'Tidak ada koneksi — skor disimpan dan akan dikirim saat kamu online lagi',
          rate: 'Terlalu banyak kiriman — skor akan segera dikirim',
          daily: 'Batas kiriman harian tercapai — skor hanya disimpan di perangkat',
          week: 'Bulan ini sudah berakhir — skor ini tidak dihitung untuk bulan baru',
          invalid: 'Skor tidak sah',
        },
        nickErr: {
          nick_length: 'Nama harus 3–16 karakter',
          nick_chars: 'Pakai huruf, angka, spasi dan _ . - saja (minimal satu huruf)',
          nick_bad: 'Nama itu tidak diizinkan, coba yang lain',
          rate_limited: 'Tunggu sebentar lalu coba lagi',
        },
        nickErrDef: 'Gagal menyimpan nama',
        nickAskOnline: 'Nama untuk papan peringkat online:',
        savedLocal: (r) => (r ? `#${r} di papan peringkat lokal` : 'Tersimpan di papan peringkat lokal'),
        rejected: 'Skormu gagal disimpan — hanya papan lokal',
        quota: 'Papan online penuh — skor hanya disimpan di perangkat',
        open: 'Peringkat',
        keys: '<kbd>←</kbd> <kbd>→</kbd> papan · <kbd>↑</kbd> <kbd>↓</kbd> ninja · <kbd>⌫</kbd> kembali',
      },
      bz: {
        back: 'Kembali', toMenu: 'Menu utama', you: 'Kamu', youTag: 'kamu', newBest: 'Rekor baru!', seeResult: 'Lihat hasil',
        resetIn: 'Reset dalam',
        // time left: hari (h) · jam (j) · menit (m) · detik (d)
        left: (ms) => { const t = Math.floor(ms / 1000), d = Math.floor(t / 86400), hh = Math.floor((t % 86400) / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60; return d ? `${d}h ${hh}j ${mm}m` : hh ? `${hh}j ${mm}m` : `${mm}m ${ss}d`; },
        leftShort: (ms) => { const t = Math.floor(ms / 60000), d = Math.floor(t / 1440), hh = Math.floor((t % 1440) / 60), mm = t % 60; return d ? `${d}h ${hh}j` : hh ? `${hh}j ${mm}m` : `${mm}m`; },
        weekName: (m, y) => `${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][m - 1] || m} ${y}`,
        monthName: (m) => ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][m - 1] || String(m),
        rank: (r) => (r <= 0 ? 'Tanpa pangkat' : r <= 10 ? `Kyu ${11 - r}` : `Dan ${r - 10}`),
        fightOf: (i, n) => `Laga ${i}/${n}`,
        hpBonus: (p) => `HP lawan +${p}%`,
        mirrorOpp: 'Cermin · ninjamu sendiri',
        suddenSub: 'Satu ronde · yang jatuh duluan kalah',
        rows: { fights: 'Menang', time: 'Waktu', fightPts: 'Poin laga', stage: 'Bonus tahap', clear: 'Bonus tamat', total: 'Skor turnamen', weekBest: 'Terbaikmu bulan ini' },
        mods: {
          rally2x: { n: 'Balasan Ganas', d: 'Damage serangan balik ×2' },
          fullKi: { n: 'Ki Penuh', d: 'Setiap ronde dimulai dengan ki penuh' },
          sudden: { n: 'Mati Mendadak', d: 'Satu ronde; kedua pihak mulai dengan setengah HP' },
          mirror: { n: 'Cermin', d: 'Lawanmu adalah ninjamu sendiri' },
          parryOnly: { n: 'Balasan Saja', d: 'Serangan biasa hanya 25% damage; serangan balik ×1,5' },
          posture2x: { n: 'Kuda-kuda Rapuh', d: 'Damage kuda-kuda ×2: pertahanan cepat hancur' },
          shuriken3x: { n: 'Badai Shuriken', d: 'Shuriken tiga kali lipat' },
          kiRush: { n: 'Banjir Ki', d: 'Ki terisi dua kali lebih cepat' },
          glass: { n: 'Pedang Kaca', d: 'Semua damage ×1,5' },
        },
        menu: {
          tour: 'Turnamen Bulanan', dan: 'Ujian Dan', hall: 'Aula Juara',
          tourRank: (p, left) => `Bulan ini: #${p} · reset dalam ${left}`,
          tourBest: (b, left) => `Terbaikmu ${b} · reset dalam ${left}`,
          tourNew: (left) => `8 laga yang sama untuk semua · reset dalam ${left}`,
          danRank: (name, next) => (next ? `Pangkatmu: ${name} · berikutnya: ${next}` : `Pangkatmu: ${name} · kamu di puncak`),
          danNew: '20 ujian dari Kyu 10 sampai Dan 10',
          hallRank: (p) => `Bulan ini #${p} · rekor`,
          hallDesc: '10 besar bulan ini dan rekor sepanjang masa',
          nick: (n) => (n ? `Nama: ${n}` : 'Pilih nama'),
          champTitle: '10 besar bulan ini', champLocal: '10 besar di perangkat ini', champEmpty: 'Jadilah yang pertama di papan bulan ini', champLoading: 'Memuat para pemimpin…',
          champAll: '10 besar sepanjang masa', champAllEmpty: 'Jadilah yang pertama di papan online',
          champLast: (n) => `Juara bulan lalu: ${n}`, champOpen: 'buka peringkat bulanan',
        },
        t: {
          title: 'Turnamen Bulanan', head: 'Turnamen',
          runNote: (s, st) => `Total turnamen: ${num(s)} (termasuk +${num(st)} per kemenangan)`,
          lossSub: (name, won) => `${name} menghentikan langkahmu · ${won} kemenangan`,
          lossNote: (s) => `Laga ini tidak dihitung · skor turnamen ${num(s)}`,
          quit: 'Akhiri turnamen',
          myBest: (b, a) => `Terbaikmu bulan ini: ${b} poin · ${a} percobaan`,
          noTry: 'Belum ada percobaan bulan ini.',
          place: (p, t) => (t ? `#${p} / ${t}` : `#${p}`),
          rules: (n, clear, stage) => `${n} laga; lawan, arena, dan aturannya sama untuk semua. Sekali kalah, percobaan berakhir; percobaan tak terbatas dan yang terbaik yang dihitung. Tiap kemenangan +${stage}, kalahkan semuanya +${clear}.`,
          start: 'Pilih ninjamu dan mulai', again: 'Coba lagi', go: 'Masuk turnamen',
          clearTitle: 'Turnamen ditaklukkan', overTitle: 'Percobaan berakhir',
          savedToast: (s) => `Skor turnamen tersimpan: ${s}`,
        },
        d: {
          title: 'Ujian Dan', head: 'Ujian Dan',
          sub: 'Lulus tiap ujian untuk naik pangkat. Pangkatmu tampil di samping namamu di papan peringkat.',
          trialOf: (n) => `Ujian ${n}`,
          runNote: (i, n) => `Ujian: ${i}/${n} laga dimenangkan`,
          lossSub: (name) => `${name} menghentikan ujianmu.`,
          lossNote: 'Ujian gagal',
          quit: 'Tinggalkan ujian',
          yourRank: 'Pangkatmu', bestWas: (n) => `Tertinggi: ${n}`, ladder: 'Tangga pangkat',
          nextTrial: (n) => `Berikutnya: ujian ${n}`,
          fights: (n) => `${n} laga`,
          bossLast: 'Laga terakhir: Shura',
          strikes: (left, max) => `Kesempatan: ${left}/${max} · ${max} ujian gagal menurunkan pangkatmu satu tingkat`,
          safe: 'Di pangkat ini, ujian gagal tidak akan menurunkan pangkatmu.',
          maxed: 'Di puncak: Dan 10', maxedSub: 'Namamu memimpin papan Dan.',
          start: 'Pilih ninjamu dan ikuti ujian', next: 'Ujian berikutnya', go: 'Ikuti ujian',
          promoted: (n) => `Naik pangkat: ${n}`, demoted: (n) => `Turun pangkat: ${n}`, failed: 'Ujian gagal',
          promotedSub: (a, b) => `${a} → ${b}`, demotedSub: 'Tiga ujian gagal. Ayo naik lagi!', tryAgain: 'Coba lagi; pangkatmu aman.',
          toast: (n) => `Pangkat baru: ${n}`, leftToast: 'Ujian ditinggalkan: dihitung gagal',
        },
        hall: {
          title: 'Aula Juara',
          tabs: { week: { n: 'Bulan Ini' }, alltime: { n: 'Sepanjang Masa' }, archive: { n: 'Para Juara' }, chars: { n: 'Ninja' }, dan: { n: 'Dan' } },
          desc: { alltime: 'Yang terbaik sepanjang masa di Turnamen Bulanan', archive: '10 besar setiap bulan yang selesai terukir di sini selamanya', chars: 'Pemegang rekor tiap ninja · ketuk ninja untuk melihat 20 besar', dan: 'Pangkat tertinggi' },
          loading: 'Memuat…', error: 'Gagal memuat papan peringkat.', retry: 'Coba lagi',
          empty: 'Belum ada siapa pun. Jadilah yang pertama!', emptyDan: 'Belum ada pemain berpangkat.', emptyArchive: 'Belum ada bulan yang selesai. Gelar dimulai dari turnamen Oktober 2026; juaranya akan diukir saat turnamen berakhir pada 1 November.', emptyArchiveLocal: 'Belum ada bulan yang selesai di perangkat ini.',
          anon: 'Pemain',
          meTop: (p, s) => `Kamu: #${p} · ${s} poin · kamu masuk 10 besar!`,
          meGap: (p, g, s) => `Kamu: #${p} · ${s} poin · ${g} poin lagi ke 10 besar`,
          meNone: 'Belum ada skor bulan ini.',
          meDan: (p, n) => `Kamu: #${p} · ${n}`,
          meDanLocal: (n) => `Pangkatmu: ${n}`, meNoDan: 'Belum punya pangkat. Ujian pertama: Kyu 10.',
          noRecord: 'Belum ada rekor', allNinjas: 'Semua ninja',
          pending: (n) => `Kiriman yang menunggu: ${n}`,
          classic: 'Papan Arkade · Legenda',
        },
        // Monthly Tournament rewards: permanent title (top 3) and Champion colors (1st)
        ttl: {
          champ: 'Juara Bulanan', finalist: 'Finalis',
          reward: 'Mulai turnamen Oktober 2026, 3 besar tiap bulan mendapat gelar permanen. Sang juara juga memenangkan warna Juara eksklusif untuk ninja yang dipakainya. Gelar butuh minimal 5 pemain di bulan itu.',
          hall: 'Mulai Oktober 2026: 3 besar tiap bulan dapat gelar permanen (min. 5 pemain) · juara dapat warna Juara',
          local: 'Skor turnamenmu disimpan di perangkat ini.',
          colors: 'Warna Juara',
          how: 'Menangkan Turnamen Bulanan dengan ninja ini',
          unlocked: (name) => `Juara Bulanan! Warna Juara ${name} terbuka`,
          newTitle: (t) => `Gelar baru: ${t}`,
        },
      },
      train: {
        title: 'Latihan', tutTitle: 'Tutorial',
        dummy: 'Boneka',
        beh: { idle: 'Diam', guard: 'Bertahan', attack: 'Menyerang', counter: 'Membalas' },
        infHp: 'HP tak terbatas', fullKi: 'Ki penuh',
        reset: 'Reset posisi',
        hide: 'Sembunyi', show: 'Panel',
        moves: 'Daftar gerakan',
        lessons: 'Pelajaran',
        lessonOf: (i, n) => `Pelajaran ${i}/${n}`,
        done: 'Tutorial selesai! Atur boneka sesukamu dan berlatihlah dengan bebas.',
        progress: (a, b) => `${a}/${b}`,
        keysHelp: '<kbd>1</kbd>–<kbd>4</kbd> boneka · <kbd>⌫</kbd> reset · <kbd>H</kbd> panel',
        specialFallback: { kanji: '影斬り', name: 'Tebasan Bayangan', desc: 'Tebasan secepat kilat yang membelah lawan dalam sekejap.', tip: '' },
        kiFull: 'ki penuh',
        counterTip: 'Cara membalasnya',
      },
      moves: [
        ['<kbd>A</kbd><kbd>D</kbd>', 'Jalan', 'ketuk 2×: lesat'],
        ['<kbd>W</kbd>', 'Lompat', ''],
        ['<kbd>F</kbd><kbd>F</kbd><kbd>F</kbd>', 'Kombo ringan ×3', 'serangan ke-3 mendorong mundur'],
        ['<kbd>G</kbd>', 'Tebasan berat', 'menjatuhkan lawan'],
        ['<kbd>R</kbd>', 'Tendangan', 'menekan pertahanan, mengisi bar kuda-kuda'],
        ['<kbd>T</kbd>', 'Shuriken', ''],
        ['<kbd>Shift</kbd>', 'Lesat', 'Shift kiri'],
        ['<kbd>Shift</kbd>›<kbd>F</kbd>', 'Tebasan lesat', ''],
        ['<kbd>W</kbd>›<kbd>F</kbd>', 'Tebasan udara', ''],
        ['<kbd>W</kbd>›<kbd>G</kbd>', 'Tukikan', 'serangan berat di udara'],
        ['<kbd>S</kbd>', 'Bertahan', 'tahan'],
        ['<kbd>S</kbd>!', 'Tangkis', 'tekan tepat sebelum serangan kena'],
        ['<kbd>F</kbd>', 'Balasan lurus', 'setelah bertahan/tangkis'],
        ['Maju+<kbd>F</kbd>', 'Sapuan', 'serang balik · ke kaki'],
        ['Mundur+<kbd>F</kbd>', 'Selinap', 'serang balik · lewati lawan'],
        ['<kbd>G</kbd>', 'Balasan berat', 'serang balik · menjatuhkan'],
        ['Saling balas', 'Saling balas', 'tahan serangan balik, balas lagi; balasan ke-3 jadi penghabisan'],
        ['<kbd>F</kbd>/<kbd>G</kbd>!!', 'Adu pedang', 'tekan cepat saat adu pedang untuk mendorong lawan'],
      ],
      touch: {
        btn: { light: 'SERANG', heavy: 'BERAT', kick: 'TENDANG', guard: 'JAGA', dodge: 'LESAT', throw: 'SHUR.', special: 'KI', up: 'LOMPAT', down: 'JAGA', stick: 'Joystik' },
        lock: 'Tekan SERANG cepat!',
        replaySkip: 'ketuk untuk lewati',
        rotateTitle: 'Putar layarmu ke samping',
        rotateText: 'Shadow Duel dimainkan dalam mode lanskap. Menu tetap bisa dipakai dalam mode potret.',
        rotMenu: 'Menu utama',
        need2p: 'Perlu keyboard / gamepad',
        need2pToast: 'Sambungkan keyboard atau gamepad untuk dua pemain',
        hints: 'Petunjuk',
        pause: 'Jeda',
        sel: { who1: 'Kamu · ketuk ninjamu', who2: 'Lawan (CPU) · ketuk untuk pilih', who2train: 'Boneka · ketuk untuk pilih' },
        opt: {
          title: 'Kontrol sentuh',
          layout: 'Tata letak', simple: 'Ringkas', full: 'Lengkap',
          size: 'Ukuran', sizes: { s: 'Kecil', m: 'Sedang', l: 'Besar' },
          hand: 'Tombol', right: 'Kanan', left: 'Kiri',
          assist: 'Bantuan mudah', haptic: 'Getaran',
          fullscreen: 'Layar penuh', exitFullscreen: 'Keluar layar penuh',
          note: 'Ringkas: 5 tombol besar. Lengkap: tambah tendangan dan shuriken. Bantuan mudah: tahan SERANG dan kombo terus berlanjut, ketukan cepat pada JAGA cukup lama untuk menangkis, dan joystik tidak meloncat tanpa sengaja. Ini hanya memudahkan sentuhan; aturan dan skor tetap sama untuk semua.',
          fullNote: 'Tombol TENDANG dan SHURIKEN ada di tata letak Lengkap (Pengaturan → Kontrol).',
        },
        help: '<div class="th-grid">' +
          '<div><h3>Joystik</h3><dl>' +
          '<dt><i class="tb">◀ ▶</i></dt><dd>Taruh jempol di separuh layar yang kosong lalu geser: jalan</dd>' +
          '<dt><i class="tb">▲</i></dt><dd>Dorong ke atas: lompat</dd>' +
          '<dt><i class="tb tb-guard">▼</i></dt><dd>Tarik ke bawah: bertahan</dd>' +
          '<dt><i class="tb">▶▶</i></dt><dd>Sentil ke samping dua kali: lesat</dd>' +
          '</dl></div>' +
          '<div><h3>Tombol</h3><dl>' +
          '<dt><i class="tb tb-light">SERANG</i></dt><dd>Tebas. Ketuk berulang kali: kombo. Tahan maju atau mundur sambil mengetuk: teknik lain</dd>' +
          '<dt><i class="tb">BERAT</i></dt><dd>Tebasan berat. Maju + BERAT melontarkan lawan</dd>' +
          '<dt><i class="tb tb-guard">JAGA</i></dt><dd>Tahan: bertahan. Ketuk tepat sebelum kena: tangkis</dd>' +
          '<dt><i class="tb">LESAT</i></dt><dd>Melesat (ke arah joystik, atau ke belakang)</dd>' +
          '<dt><i class="tb ki">KI</i></dt><dd>Teknik ki: tombol menyala saat ki penuh</dd>' +
          '<dt><i class="tb">TENDANG</i> <i class="tb">SHUR.</i></dt><dd>Tata letak Lengkap: tendangan dan shuriken</dd>' +
          '</dl></div></div>',
        note: 'Kamu bisa menekan beberapa tombol sekaligus: tahan jaga dan serang, atau geser jempol dari <i class="tb tb-guard">JAGA</i> ke <i class="tb tb-light">SERANG</i>. <b>II</b> di atas layar untuk jeda; tata letak, ukuran, dan opsi kidal ada di <b>Pengaturan</b>. Kalau kamu pakai keyboard atau gamepad, kontrol otomatis beralih ke sana.',
        keysHelp: '',
      },
      movesTouch: [
        ['<i class="tb">◀ ▶</i>', 'Jalan', 'joystik · sentil 2×: lesat'],
        ['<i class="tb">▲</i>', 'Lompat', 'dorong joystik ke atas'],
        ['<i class="tb tb-light">SERANG</i>×3', 'Kombo tiga', 'ketuk berulang; serangan ke-3 mendorong mundur'],
        ['<i class="tb">BERAT</i>', 'Tebasan berat', 'menjatuhkan lawan'],
        ['<i class="tb">TENDANG</i>', 'Tendangan', 'menekan pertahanan, mengisi bar kuda-kuda · tata letak Lengkap'],
        ['<i class="tb">SHUR.</i>', 'Shuriken', 'tata letak Lengkap'],
        ['<i class="tb">LESAT</i>', 'Lesat', ''],
        ['<i class="tb">LESAT</i>›<i class="tb tb-light">SERANG</i>', 'Tebasan lesat', ''],
        ['<i class="tb">▲</i>›<i class="tb tb-light">SERANG</i>', 'Tebasan udara', ''],
        ['<i class="tb">▲</i>›<i class="tb">BERAT</i>', 'Tukikan', 'serangan berat di udara'],
        ['<i class="tb tb-guard">JAGA</i>', 'Bertahan', 'tahan, atau tarik joystik ke bawah'],
        ['<i class="tb tb-guard">JAGA</i>!', 'Tangkis', 'ketuk tepat sebelum serangan kena'],
        ['<i class="tb tb-light">SERANG</i>', 'Balasan lurus', 'setelah bertahan/tangkis'],
        ['Maju+<i class="tb tb-light">SERANG</i>', 'Sapuan', 'serang balik · ke kaki'],
        ['Mundur+<i class="tb tb-light">SERANG</i>', 'Selinap', 'serang balik · lewati lawan'],
        ['<i class="tb">BERAT</i>', 'Balasan berat', 'serang balik · menjatuhkan'],
        ['Saling balas', 'Saling balas', 'tahan serangan balik, balas lagi; balasan ke-3 jadi penghabisan'],
        ['<i class="tb tb-light">SERANG</i>!!', 'Adu pedang', 'tekan SERANG cepat saat adu pedang untuk mendorong lawan'],
      ],
      moveSpecialTouch: '<i class="tb ki">KI</i>',
      moveTags: {
        normal: 'Biasa', command: 'Perintah', string: 'Rangkaian', launcher: 'Pelontar', juggle: 'Kombo udara', air: 'Udara', dash: 'Lesat',
        strike: 'Pukulan', counter: 'Balasan', catch: 'Tangkap', feint: 'Tipuan', guardCrush: 'Jebol jaga', knockdown: 'Menjatuhkan',
        kiCancel: 'Batal ki', special: 'Teknik ki', throw: 'Proyektil',
      },
      lessonsTouch: {
        walk: 'Geser jempol di separuh layar yang kosong: dorong joystik ke kiri dan kanan untuk berjalan.',
        combo: 'Ketuk <i class="tb tb-light">SERANG</i> tiga kali berturut-turut: rangkai tiga tebasan dan kenai bonekanya.',
        heavy: 'Daratkan tebasan berat dengan <i class="tb">BERAT</i>. Memang lambat, tapi bisa menjatuhkan lawan.',
        gbreak: 'Boneka sedang bertahan. Serang dengan <i class="tb">BERAT</i> untuk mengisi bar kuda-kudanya dan menghancurkan pertahanannya (<i class="tb">TENDANG</i> di tata letak Lengkap mengisinya lebih cepat).',
        block: 'Boneka sedang menyerang. Tahan <i class="tb tb-guard">JAGA</i> (atau tarik joystik ke bawah) dan tahan satu tebasan.',
        parry: 'Ketuk <i class="tb tb-guard">JAGA</i> tepat sebelum serangan kena. Saat cincin biru mengecil, itulah waktu yang pas.',
        counter: 'Tepat setelah bertahan atau menangkis, tekan <i class="tb tb-light">SERANG</i>: tebasan balik. Coba juga joystik maju/mundur + <i class="tb tb-light">SERANG</i> atau <i class="tb">BERAT</i>.',
        special: 'Bar ki-mu penuh. Gunakan {sp} dengan tombol <i class="tb ki">KI</i> yang menyala.',
      },
      lessons: [
        { id: 'walk', t: 'Jalan', d: 'Berjalan maju mundur dengan <kbd>A</kbd> / <kbd>D</kbd>.' },
        { id: 'combo', t: 'Kombo tiga', d: 'Rangkai tiga tebasan ringan dengan <kbd>F</kbd> <kbd>F</kbd> <kbd>F</kbd> dan kenai bonekanya.' },
        { id: 'heavy', t: 'Tebasan berat', d: 'Daratkan tebasan berat dengan <kbd>G</kbd>. Memang lambat, tapi bisa menjatuhkan lawan.' },
        { id: 'gbreak', t: 'Hancurkan pertahanan', d: 'Boneka sedang bertahan. Tendang dengan <kbd>R</kbd> untuk mengisi bar kuda-kudanya dan menghancurkan pertahanannya.' },
        { id: 'block', t: 'Bertahan', d: 'Boneka sedang menyerang. Tahan <kbd>S</kbd> untuk menahan satu tebasan.' },
        { id: 'parry', t: 'Tangkis', d: 'Tekan <kbd>S</kbd> tepat sebelum serangan kena. Saat cincin biru mengecil, itulah waktu yang pas.' },
        { id: 'counter', t: 'Serang balik', d: 'Tepat setelah bertahan atau menangkis, tekan <kbd>F</kbd>: tebasan balik. Coba juga maju/mundur + <kbd>F</kbd> atau <kbd>G</kbd>.' },
        { id: 'rally', t: 'Saling balas', d: 'Boneka juga membalas. Serang, tahan balasannya, lalu balas lagi: capai 2× dengan dua balasanmu sendiri.' },
        { id: 'special', t: 'Teknik ki', d: 'Bar ki-mu penuh. Gunakan {sp} dengan <kbd>E</kbd>.' },
      ],
    });

    // ================================================================ story, fighters, arenas, specials
    // ---- Fragment B: story text (talk, pairs, endings, roster2 notes), characters, arenas, specials, pop-ups, AI levels, number words
    merge(EN.STR, {
      // open = speaks first (opponent), reply = answers (player), boss = said to the final boss
      talk: {
        akane: {
          open: ['Pedangku merah, niatku suci. Hadapi aku dengan terhormat.', 'Aku membungkuk dulu, baru menyerang. Itu baru adil.', 'Duel ini demi kehormatan kita. Tak ada jalan mundur.'],
          reply: ['Lawan yang terhormat… Kamu layak menerima pedangku.', 'Kata-kata yang tajam. Mari lihat apakah bajamu setajam itu.', 'Saat pedang merah bicara, kata-kata pun diam.'],
          boss: 'Guru-guruku tewas di ujung pedangmu, Shura. Hari ini utang itu lunas.',
        },
        aoi: {
          open: ['Angin tak pernah tergesa-gesa. Aku pun begitu.', 'Dengarkan napasmu. Suara terakhir yang kamu dengar adalah angin.', 'Bambu melentur tapi tak pernah patah. Kamu yang mana?'],
          reply: ['Tenangkan dirimu. Amarah membuat pedang terasa berat.', 'Kamu tak bisa menangkap angin. Kamu hanya bisa merasakannya.', 'Baiklah. Kita mulai saat daun menyentuh tanah.'],
          boss: 'Bahkan mata badai pun sunyi. Di dalam dirimu hanya ada kebisingan, Shura.',
        },
        kuro: {
          open: ['Gunung tidak bergerak. Kamu yang akan bergerak.', 'Tak usah bicara. Angkat pedangmu.', 'Kamu kecil. Ini akan cepat.'],
          reply: ['Hmph. Ayo, kalau begitu.', 'Kamu terlalu banyak bicara.', 'Nodachi-ku panjang. Kesabaranku pendek.'],
          boss: 'Shura. Aku sudah lama menunggu. Cukup bicara.',
        },
        yuki: {
          open: ['Salju turun dalam diam. Begitu juga seranganku.', 'Rubah tak jatuh ke perangkap. Rubah yang memasangnya.', 'Dingin? Sebentar lagi kamu tak akan merasakan apa-apa.'],
          reply: ['Darahmu terlalu panas. Itu membuatmu lambat.', 'Berisik sekali… Bahkan salju pun malu melihatmu.', 'Jangan berkedip. Nanti kamu ketinggalan.'],
          boss: 'Semua orang takut padamu, Shura. Aku cuma merasa sedikit kedinginan.',
        },
        hana: {
          open: ['Mau berdansa? Tapi aku yang memimpin!', 'Kita selesai sebelum kelopak sakura menyentuh tanah, janji!', 'Dua tantō, satu senyuman. Mana yang lebih menakutkan?'],
          reply: ['Aduh, serius sekali! Senyum sedikit, biar jatuhmu lebih cantik.', 'Tangkap aku kalau bisa!', 'Oke, oke! Tapi jangan menangis nanti, ya.'],
          boss: 'Kamu tak pernah tertawa, Shura? Ayolah, jadikan ini dansa terakhir kita!',
        },
        tetsu: {
          open: ['Tugas membawaku ke sini. Minggir atau tumbang.', 'Zirahku sudah melewati seratus pertempuran. Kamu yang keseratus satu.', 'Disiplin datang sebelum keberanian. Izinkan aku menunjukkannya.'],
          reply: ['Tidak sopan. Akan kuluruskan.', 'Kata-katamu tak bisa menembus zirahku.', 'Bersiaplah. Naginata-ku tak memberi peringatan.'],
          boss: 'Kamu membakar kastil tuanku, Shura. Hari ini kutuntaskan tugasku.',
        },
        ren: {
          open: ['Hah! Akhirnya ada yang seru! Tulangmu cukup kuat?', 'Takut sama topengku? Kamu tak akan mau lihat wajah asliku!', 'Kepala atau pertahanan? Dua-duanya kuhancurkan!'],
          reply: ['Cuma omong, tak berani tarung! Ayo!', 'Heh, aku suka kamu. Tapi tetap akan kuhajar.', 'Pernah lihat tendanganku? Sebentar lagi kamu lihat!'],
          boss: 'Jadi kamu oni yang asli, ya? Ayo lihat tanduk siapa yang lebih keras!',
        },
        kage: {
          open: ['Kamu kira kamu melihatku. Yang kamu lihat hanya bayanganku.', 'Makin terang cahaya, makin pekat bayangan.', 'Namamu sudah tertulis. Aku hanya membacanya.'],
          reply: ['Jangan bicara. Bayangan sedang mendengarkan.', 'Jangan menoleh ke belakang. Aku sudah di sana.', 'Kamu terlalu berisik. Keheningan menyerang lebih cepat.'],
          boss: 'Bayangan tak mengabdi pada tuan mana pun, Shura. Mereka akan menelanmu juga.',
        },
        shura: {
          open: ['Kamu mematahkan tujuh pedang. Yang kedelapan milikku, dan ia akan mematahkanmu.', 'Jiwamu memanggilku. Bagus kamu mendaki sejauh ini; kejatuhanmu akan makin megah.', 'Akulah ujung jalan. Berlututlah.'],
          reply: ['Kelemahan. Aku bisa menciumnya dari sini.', 'Kamu hanya batu loncatan.', 'Berlutut, atau tumbang.'],
          boss: 'Iblis di dalam cermin… Salah satu dari kita harus lenyap.',
        },
        tora: {
          open: ['Aku sudah lupa berapa banyak yang tergantung di rantaiku. Kamu akan jadi satu lagi.', 'Perburuan dimulai. Lari saja kalau mau, rantaiku panjang.', 'Katanya harimau menunggu dalam sergapan. Tidak yang satu ini!'],
          reply: ['Grrr… Bagus. Aku suka mangsa yang tidak lari.', 'Tak perlu mendekat. Biar kutarik kamu.', 'Kata-katamu panjang. Rantaiku lebih panjang.'],
          boss: 'Kamu juga cuma mangsa, Shura. Hanya sedikit lebih besar.',
        },
        jin: {
          open: ['Aku tidak datang untuk menumpahkan darah. Aku hanya akan membaringkanmu sebentar.', 'Tongkat ini bicara dengan sabar. Dengarlah.', 'Jalanmu penuh amarah, pendekar muda. Mari ringankan bebanmu.'],
          reply: ['Baiklah. Tapi setelahnya, kita minum teh bersama.', 'Amarahmu membebanimu. Biar aku yang memikulnya.', 'Pedang memotong; tongkat membangunkan.'],
          boss: 'Shura, aku tak perlu menghancurkanmu untuk mengalahkan iblis di dalam dirimu. Menghentikanmu sudah cukup.',
        },
        mai: {
          open: ['Panggung sudah siap, tirai terbuka. Peranmu: yang kalah.', 'Saat kipasku terbuka, jangan pejamkan mata. Nanti kamu melewatkan pertunjukannya.', 'Setiap langkahku adalah nada. Bisakah kamu ikuti temponya?'],
          reply: ['Masuk yang kasar sekali. Tak apa, keanggunanku cukup untuk kita berdua.', 'Angin bertiup ke arahku, sayang.', 'Aku tak butuh tepuk tangan. Kejatuhanmu sudah cukup.'],
          boss: 'Shura, di dansa terakhir ini aku tak berbagi panggung dengan siapa pun.',
        },
        tsubame: {
          open: ['Jarak di antara kita adalah senjataku.', 'Burung layang-layang meleset sekali. Kedua kalinya, ia berbalik dan menyerang.', 'Aku sudah mengukur angin. Anak panahku tahu jalannya.'],
          reply: ['Mau mendekat? Coba saja.', 'Tahan napasmu. Anak panah yang melesat tak bersuara.', 'Mataku tertuju padamu. Begitu pula panahku.'],
          boss: 'Shura, tak ada tempat bersembunyi di langit. Panahku akan menemukanmu.',
        },
      },
      // Special match-ups: lines are spoken in the order written
      pairs: {
        'akane|aoi': [['akane', 'Aoi! Saatnya menuntaskan duel kita yang belum selesai.'], ['aoi', 'Angin selalu bertiup ke api yang sama, Akane. Mulailah.']],
        'kuro|tetsu': [['kuro', 'Cangkang besi. Mari lihat apakah isinya kosong.'], ['tetsu', 'Bahkan gunung tunduk pada disiplin, Kuro.']],
        'hana|yuki': [['yuki', 'Bunga layu di tengah salju, Hana.'], ['hana', 'Kalau begitu, saljunya saja yang kucairkan, Yuki!']],
        'kage|ren': [['ren', 'Trik bayangan tak mempan padaku! Tunjukkan dirimu!'], ['kage', 'Aku ada di sini, oni. Kamu saja yang tak tahu cara melihat.']],
        'akane|ren': [['akane', 'Hanya orang tak terhormat yang bersembunyi di balik topeng.'], ['ren', 'Kehormatan? Kehormatan tak membuat perutku kenyang!']],
        'aoi|yuki': [['aoi', 'Angin dingin tetaplah angin, Yuki.'], ['yuki', 'Tapi salju tetap tinggal saat angin reda.']],
        'kuro|tora': [['tora', 'Gunung, ya? Harimau juga tinggal di gunung.'], ['kuro', 'Harimau mati di gunung.']],
        'tora|yuki': [['tora', 'Rubah! Apa yang dilakukan rubah di depan harimau?'], ['yuki', 'Lari. Lalu membekukan ekor si harimau.']],
        'jin|tora': [['tora', 'Apa yang akan kamu lakukan saat rantaiku melilit tongkatmu, biksu?'], ['jin', 'Melepaskannya. Mengurai simpul adalah panggilanku.']],
        'jin|ren': [['ren', 'Biksu? Mulai berdoa sana, botak!'], ['jin', 'Aku sudah berdoa, oni. Untukmu. Api di dalam dirimu juga membakarmu.']],
        'jin|tetsu': [['tetsu', 'Apa urusan seorang biksu di medan perang?'], ['jin', 'Aku datang untuk hati berzirah sepertimu, Tetsu. Zirahmu berat; hatimu lebih berat lagi.']],
        'akane|jin': [['akane', 'Minggir, biksu. Dendam ini milikku.'], ['jin', 'Dendam adalah rantai, Akane. Mari kita putuskan dulu.']],
        'hana|mai': [['hana', 'Wah, penari lagi! Ayo lihat siapa yang berputar lebih cepat!'], ['mai', 'Kecepatan hanyalah bayangan keanggunan, Hana. Biar kutunjukkan cahayanya.']],
        'kage|mai': [['mai', 'Apakah bayangan juga menari, Kage?'], ['kage', 'Hanya saat cahaya padam.']],
        'aoi|tsubame': [['tsubame', 'Bisakah anginmu membelokkan panahku, Aoi?'], ['aoi', 'Angin tak memihak siapa pun, Tsubame. Bahkan panahmu.']],
        'kage|tsubame': [['kage', 'Kamu tak bisa memanah yang tak terlihat, pemanah.'], ['tsubame', 'Bayangan datang bersama cahaya. Begitu juga aku.']],
        'mai|tsubame': [['mai', 'Menatap dari jauh itu tidak sopan, pemanah. Ayo lihat dari dekat.'], ['tsubame', 'Biar panahku yang melihat panggungmu dari dekat.']],
      },
      endings: {
        akane: ['Saat pedang Shura menghantam tanah, lonceng kuil berdentang dengan sendirinya.', 'Akane membersihkan pedang merahnya dan membungkuk di makam para gurunya: utang telah lunas.', 'Jalan di depannya bukan lagi dendam, melainkan mengajarkan kehormatan kepada murid-murid baru.'],
        aoi: ['Saat Shura tumbang, badai pun diam; untuk pertama kalinya setelah bertahun-tahun, awan tersibak.', 'Aoi menyarungkan pedangnya dan kembali ke hutan bambu.', 'Yang tersisa hanya desir angin.'],
        kuro: ['Kuro mengubur topeng Shura yang retak di puncak gunung.', 'Tak sepatah kata pun terucap. Kuro menurunkan topi jeraminya dan menghilang ke dalam salju.', 'Kata penduduk desa, tak seorang bandit pun turun gunung pada musim dingin itu.'],
        yuki: ['Napas terakhir Shura berubah menjadi kabut di udara dingin, lalu lenyap.', 'Yuki merapikan syalnya dan pergi tanpa meninggalkan jejak di salju.', 'Sejak hari itu, hanya bayangan seekor rubah yang terlihat di puncak.'],
        hana: ['Saat topeng Shura jatuh ke tanah, Hana meletakkan setangkai sakura di sampingnya.', 'Malam itu pasar dipenuhi lentera; sorakan paling keras untuk seorang kunoichi yang menari di atas atap.', 'Tak ada yang tahu ke mana Hana pergi. Yang tersisa hanya kelopak merah muda yang melayang.'],
        tetsu: ['Di atap kastil, Tetsu mematahkan pedang Shura menjadi dua di atas lututnya.', 'Panji sang tuan kembali dinaikkan, dan angin mengibarkannya dengan bangga.', 'Tugas terpenuhi. Tapi tugas seorang samurai tak pernah berakhir.'],
        ren: ['Ren menggantung topeng Shura yang retak di samping topeng oni lainnya. Dua oni, satu pemenang.', 'Desa bernyanyi malam itu; tawa paling keras, seperti biasa, milik Ren.', 'Pagi harinya, Ren sudah di jalan. Menuju perkelahian berikutnya.'],
        kage: ['Saat Shura tumbang, bayangan Kage diam-diam menyelimuti iblis yang jatuh itu.', 'Tanpa jejak, tanpa suara; hanya satu bayangan tambahan yang memanjang di bawah sinar bulan.', 'Mungkin ia selalu ada di sana. Mungkin ia tak pernah ada sama sekali.'],
        shura: ['Di atap kastil, hanya satu yang tetap berdiri: dia yang memakai topeng yang sama, hanya lebih gelap.', 'Shura tak lagi mencari rival. Para rivallah yang mencari Shura.'],
        def: ['Master terakhir telah tumbang. Jalan bayangan kini milikmu.', 'Sarungkan pedangmu; legenda dimulai sekarang.'],
        tora: ['Gemerincing rantai mengabarkan kejatuhan Shura.', 'Tora menggantung topeng yang retak itu di rantainya: trofi buruan baru.', 'Sejak hari itu, tak seorang pun di hutan menganggap auman harimau sekadar dongeng.'],
        jin: ['Jin berlutut di samping Shura yang tumbang dan berdoa.', 'Di jalan pulang ke kuil, tak setetes darah pun menodai tongkatnya.', 'Malam itu lonceng gunung berdentang lagi; kali ini bukan untuk berkabung, tapi untuk kedamaian.'],
        mai: ['Saat Shura tumbang, Mai menutup kipasnya dengan sekali kibas dan membungkuk.', 'Pasar malam masih membicarakan tarian itu.', 'Tirai pun turun. Tapi Mai tak pernah meninggalkan panggung.'],
        tsubame: ['Anak panah terakhir bergetar tanpa suara di atap kastil.', 'Tsubame memanggul busurnya dan memandangi burung layang-layang terbang ke selatan.', 'Ia tak pernah terlihat lagi; yang tersisa hanyalah anak panah berbulu cerah yang tertancap di sasarannya.'],
      },
      roster2: {
        notes: {
          tora: ['Ringan: cambuk rantai di jarak menengah, sabit dari dekat', 'Berat: melempar rantai; jika kena, lawan tertarik mendekat', 'Akhir kombo: jika lawan jauh, rantai menyeretnya mendekat'],
          jin: ['Kedua ujung tongkat menyerang; pukulannya tumpul dan tak pernah menumpahkan darah', 'Serangan ke-3 dan sapuan berat menjatuhkan lawan', 'Kuda-kuda terisi lebih lambat saat bertahan'],
          mai: ['Jendela tangkis lebih lebar', 'Saat bertahan, kipas memantulkan proyektil', 'Berat: gelombang angin mendorong lawan dan membuyarkan proyektil'],
          tsubame: ['Berat: menembakkan panah dari busur; tahan untuk tembakan bertenaga', 'Lempar: salto ke belakang dan melepas panah dari udara', 'Saat panah habis, serangan berat memakai tantō; panah terisi lagi seiring waktu'],
        },
      },
    });

    merge(EN.CHARS, {
      akane: { title: 'Pedang Merah', desc: 'Master katana yang seimbang. Kombo tiga serangan yang cepat, tangkisan kuat.', weapon: 'Katana' },
      aoi: { title: 'Angin Biru', desc: 'Master katana yang lincah. Berjalan sedikit lebih cepat dan melesat bagai angin.', weapon: 'Katana' },
      kuro: { title: 'Gunung Hitam', desc: 'Memakai nodachi panjang. Lambat, tapi jangkauannya luas dan pukulannya dahsyat.', weapon: 'Nodachi' },
      yuki: { title: 'Rubah Salju', desc: 'Menyerang sangat cepat dengan kodachi pendek. Banyak shuriken, syal panjang.', weapon: 'Kodachi' },
      hana: { title: 'Tarian Sakura', desc: 'Kunoichi. Bertarung dengan dua tantō seolah menari; tangan tercepat, jangkauan terpendek.', weapon: 'Tantō Kembar' },
      tetsu: { title: 'Benteng Besi', desc: 'Samurai berzirah. Naginata memberi jangkauan terpanjang; serangan nyaris tak membekas.', weapon: 'Naginata' },
      ren: { title: 'Oni Merah', desc: 'Petarung bertopeng oni. Menakutkan dengan pukulan penghancur pertahanan dan tendangan dahsyat.', weapon: 'Uchigatana' },
      kage: { title: 'Sang Bayangan', desc: 'Bayangan bertudung. Cepat dengan ninjatō, lesatan panjang; meninggalkan bayangan di mana pun ia lewat.', weapon: 'Ninjatō' },
      tora: { title: 'Harimau Berantai', desc: 'Master kusarigama. Mencambukkan rantai berbandul dari jarak menengah; serangan berat menarik lawan ke arah sabit.', weapon: 'Kusarigama' },
      jin: { title: 'Biksu Tongkat Besi', desc: 'Biksu bersenjata bō. Tongkat panjang yang menyerang dengan kedua ujungnya, pertahanan kokoh, dan pukulan tumpul yang menjatuhkan; tak pernah menumpahkan darah, hanya mengguncang tulang.', weapon: 'Bō' },
      mai: { title: 'Penari Kipas', desc: 'Kunoichi berkipas perang. Sangat cepat, dengan jendela tangkis lebar; kipasnya memantulkan proyektil dan anginnya mendorong lawan menjauh.', weapon: 'Tessen Kembar' },
      tsubame: { title: 'Pemanah Layang', desc: 'Membawa busur dan tantō. Memanah dari jauh (tahan berat untuk tembakan kuat) dan salto ke belakang menjauhi siapa pun yang mendekat, sambil menembak dari udara.', weapon: 'Yumi + Tantō' },
      shura: { title: 'Sang Master Merah', desc: 'Master iblis yang jalannya ditandai warna merah. Nodachi panjang, pukulan menghancurkan, tangkisan nyaris sempurna.', weapon: 'Nodachi' },
    });

    merge(EN.ARENAS, {
      temple: 'Kuil Cahaya Bulan',
      rain: 'Hutan Bambu Badai',
      snow: 'Puncak Bersalju',
      village: 'Desa Terbakar',
      market: 'Pasar Malam',
      waterfall: 'Air Terjun',
      castle: 'Atap Kastil',
    });

    merge(EN.SPECIALS, {
      akane: { desc: 'Tebasan iai merah yang menembus lawan dalam sekejap mata, meninggalkan bulan sabit menyala di udara.', tip: 'Tangkis, atau melesat ke samping' },
      aoi: { desc: 'Ayunan lebar yang melontarkan bilah angin ke depan; jaga di saat yang tepat akan memantulkannya.', tip: 'Lompat, tebas dengan pedangmu, atau bertahan di saat yang tepat' },
      kuro: { desc: 'Melompat dan membelah tanah dengan nodachi; gelombang kejut yang menjalar di tanah menghancurkan pertahanan dan menjatuhkan lawan.', tip: 'Lompati gelombangnya dan serang saat di udara' },
      yuki: { desc: 'Lima serangan secepat kilat bagai badai salju; serangan terakhir menjatuhkan lawan.', tip: 'Bertahan, dan tangkis serangan pertama' },
      hana: { desc: 'Berputar maju bagai pusaran kelopak sakura dengan tantō kembar, menebas ke dua sisi.', tip: 'Bertahan, atau melesat mundur' },
      tetsu: { desc: 'Memutar naginata ke segala arah; serangan tak bisa menghentikan putarannya (super armor).', tip: 'Keluar dari jangkauan, atau tangkis' },
      ren: { desc: 'Terjangan bahu yang menghancurkan pertahanan, disusul tebasan naik yang melontarkan lawan.', tip: 'Bertahan tak ada gunanya: tangkis, lompat, atau melesat' },
      kage: { desc: 'Lenyap dalam asap, meninggalkan klon bayangan, lalu muncul di belakang lawan untuk menyerang.', tip: 'Bertahan saat Kage muncul kembali' },
      tora: { desc: 'Memutar rantai di atas kepala menjadi pusaran yang menyapu semua di dekatnya; lawan yang tertangkap ditarik lalu dilempar ke langit oleh sabit.', tip: 'Keluar dari jangkauan atau bertahan: jika tak tertangkap, tarikannya luput' },
      jin: { desc: 'Maju sambil memutar tongkat bagai roda intan; setelah empat pukulan, serangan naik melontarkan lawan.', tip: 'Melesat mundur, atau tangkis pukulan pertama' },
      mai: { desc: 'Memutar angin puyuh yang bergerak maju, menarik lawan, menebasnya, lalu melemparkannya ke langit.', tip: 'Jaga angin puyuhnya di saat yang tepat atau mundur: geraknya lambat' },
      tsubame: { desc: 'Melompat mundur dan menghujani panah dari langit; jika meleset, melepas panah layang-layang yang berbalik dan menyerang dari belakang.', tip: 'Menjauh dari tanda di tanah; panah layang-layang akan kembali, jadi waspadai punggungmu' },
      shura: { desc: 'Meraung dan melebur menjadi asap merah, muncul di depan dan di belakang lawan untuk melancarkan tiga tebasan nodachi berat; yang terakhir melontarkan lawan.', tip: 'Perhatikan kilatan merah: menangkis satu tebasan menghentikan teknik ini; bertahan akan menghancurkan kuda-kudamu' },
    });

    merge(EN.TXT, {
      gbreak: 'KUDA-KUDA HANCUR!', cut: 'TERTEBAS!', reflect: 'TERPANTUL!', parry: 'TANGKIS!', caught: 'TERTANGKAP!',
      swallowHit: '燕!', vajraHit: '金剛!', whirlHit: '旋風の舞',
    });

    merge(EN.AI_LEVELS, { 0: 'Murid', 1: 'Pendekar', 2: 'Legenda', 3: 'Shura' });

    EN.NUMWORDS = ['Nol', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas', 'Dua belas'];

    // ================================================================ static HTML, hardcoded literals, canvas pop-ups
    merge(EN.PHRASES, {
      // ---------------------------------------------------------------- index.html: <title>, brand, HUD
      'Gölge Düellosu': 'Shadow Duel',
      'Duraklat': 'Jeda',
      'KARŞILIKLI SERİ': 'SALING BALAS',
      'SON DARBE': 'TEBASAN AKHIR',
      'atlamak için bir tuşa bas': 'tekan tombol apa saja untuk lewati',
      // touch buttons (static fallbacks of data-s="touch.btn.*")
      'GARD': 'JAGA',
      'HAFİF': 'RINGAN',
      'SALDIR': 'SERANG',
      'AĞIR': 'BERAT',
      'ATIL': 'LESAT',
      'TEKME': 'TENDANG',
      // ---------------------------------------------------------------- main menu
      'Sekiz savaşçı, üç arena. Gerçek zamanlı kılıç çarpışması, kılıç kilitlenmesi, savuşturma, denge kırma, Gölge Kesiği ve ragdoll fiziği.': 'Delapan petarung, tiga arena. Duel pedang langsung, adu pedang, tangkisan, kuda-kuda hancur, Tebasan Bayangan, dan fisika ragdoll.',
      'İki Oyuncu': 'Dua Pemain',
      'Aynı klavyede ya da iki gamepad ile kafa kafaya': 'Satu lawan satu di satu keyboard atau dua gamepad',
      'CPU\'ya Karşı': 'Lawan CPU',
      'Ninjanı seç, rakibini yapay zekâ yönetsin': 'Pilih ninjamu, biar AI yang mengendalikan lawanmu',
      'Zorluk': 'Kesulitan',
      'Çırak': 'Murid',
      'Usta': 'Pendekar',
      'Efsane': 'Legenda',
      'Aylık Turnuva': 'Turnamen Bulanan',
      'Dan Sınavı': 'Ujian Dan',
      'Şampiyonlar Salonu': 'Aula Juara',
      'Seyret': 'Tonton',
      'Rastgele iki ninja, Efsane yapay zekâ': 'Dua ninja acak, CPU Legenda',
      'Ses': 'Suara',
      'Müzik': 'Musik',
      'Kan efekti': 'Darah',
      'Tuş ipuçları': 'Petunjuk tombol',
      'Yüksek grafik': 'Grafis tinggi',
      // ---------------------------------------------------------------- controls card
      'Kontroller': 'Kontrol',
      '1. Oyuncu': 'Pemain 1',
      '2. Oyuncu': 'Pemain 2',
      'Yürü': 'Jalan',
      'Zıpla': 'Lompat',
      'Gard (basılı tut)': 'Jaga (tahan)',
      'Hafif kesik (×3 kombo)': 'Tebasan ringan (kombo ×3)',
      'Ağır kesik': 'Tebasan berat',
      'Tekme': 'Tendangan',
      'Sol Shift': 'Shift kiri',
      'Sağ Shift': 'Shift kanan',
      'Atılma': 'Lesat',
      'Ki tekniği (ki dolu)': 'Teknik ki (ki penuh)',
      // ---------------------------------------------------------------- select screen
      'Ninjanı seç': 'Pilih ninjamu',
      'Hazır': 'Siap',
      '1. oyuncunun ninjası': 'Ninja pemain 1',
      '2. oyuncunun ninjası': 'Ninja pemain 2',
      'Önceki ninja': 'Ninja sebelumnya',
      'Sonraki ninja': 'Ninja berikutnya',
      '1. oyuncu kadrosu': 'Daftar ninja pemain 1',
      '2. oyuncu kadrosu': 'Daftar ninja pemain 2',
      'Dövüşe başla': 'Mulai laga',
      'Geri': 'Kembali',
      'Kilitli': 'Terkunci',
      'Rastgele': 'Acak',
      'Hız': 'Kecepatan',
      'Güç': 'Kekuatan',
      'Menzil': 'Jangkauan',
      'Can': 'Daya tahan',
      // ---------------------------------------------------------------- pause / end
      'Duraklatıldı': 'Dijeda',
      'Devam et': 'Lanjut',
      'Maçı yeniden başlat': 'Ulang laga',
      'Ana menü': 'Menu utama',
      'Rövanş': 'Tanding ulang',
      'Karakter değiştir': 'Ganti petarung',
      'Zafer senin': 'Kemenangan milikmu',
      'Raund': 'Ronde',
      'Verilen hasar': 'Damage diberikan',
      'Savuşturma': 'Tangkisan',
      'Ki Saldırısı': 'Serangan ki',
      // ---------------------------------------------------------------- training / leaderboard / misc
      'Antrenman': 'Latihan',
      'ANTRENMAN': 'LATIHAN',
      'Sıralama': 'Peringkat',
      'Tümü': 'Semua',
      'Ekranı yan çevir': 'Putar layarmu ke samping',
      'Performans için grafik düşürüldü': 'Grafis diturunkan demi performa',
      // hidden boss pushed into ND.CHARS by arcade.js (safety net; EN.CHARS.shura should carry the same)
      'Kanlı Usta': 'Master Darah',
      'Yolunu kanla çizen iblis usta. Uzun nodachi, yıkıcı darbeler, neredeyse kusursuz savuşturma.': 'Master iblis yang mengukir jalannya dengan darah. Nodachi panjang, pukulan menghancurkan, tangkisan nyaris sempurna.',
      // ---------------------------------------------------------------- HUD tags (fallbacks when STR.hud is missing)
      'SEN': 'KAMU',
      'KUKLA': 'BONEKA',
      // ---------------------------------------------------------------- round banners (#bt / #bs)
      'Son raund': 'Ronde terakhir',
      'Kazanan her şeyi alır': 'Pemenang ambil semua',
      'İlk iki raundu alan kazanır': 'Menang dua ronde duluan, dia juaranya',
      'Dövüş!': 'Tarung!',
      'Süre doldu': 'Waktu habis',
      'Berabere': 'Seri',
      'Çifte K.O.': 'K.O. Ganda',
      'Mükemmel': 'Sempurna',
      // blade-lock hint (fallbacks of STR.hud.lockSolo / lockDuo)
      'F / K tuşuna hızlıca bas!': 'Tekan F / K cepat!',
      'Hafif ya da ağır tuşuna hızlıca bas!': 'Tekan ringan/berat cepat!',
      // counter / parry prompt labels under the key ring (ctx.fillText in drawPrompts)
      'KARŞILIK': 'BALAS',
      'SAVUŞTUR': 'TANGKIS',
      // ---------------------------------------------------------------- canvas pop-ups (fx.text)
      'SON VURUŞ!': 'PENGHABISAN!',
      'KİLİTLENDİ!': 'ADU PEDANG!',
      'İTTİ!': 'DORONG!',
      'DENGE KIRILDI!': 'KUDA-KUDA HANCUR!',
      'GARD KIRILDI!': 'PERTAHANAN HANCUR!',
      'KESİLDİ!': 'TERIRIS!',
      'YANSITMA!': 'PANTUL!',
      'SAVUŞTURMA!': 'TANGKIS!',
      'YAKALANDI!': 'TERTANGKAP!',
      'ZIRH!': 'ZIRAH!',
      'ARKADAN!': 'DARI BELAKANG!',
      'DUVAR!': 'DINDING!',
      'KAFA!': 'KEPALA!',
      'KARŞI!': 'SERANG BALIK!',
      'KRİTİK!': 'KRITIS!',
      'SÜPÜRME!': 'SAPUAN!',
      'KARŞILIK!': 'BALASAN!',
      'YERE SERİLDİ': 'TERJATUH',
      'ÇARPIŞMA!': 'BENTURAN!',
    });

    merge(EN.HTML, {
      // brand title
      'Gölge<br><em>Düel</em><em>losu</em>': 'Shadow<br><em>Du</em><em>el</em>',
      // tips list (<ul class="tips">)
      '<b>Savuşturma:</b> darbe gelmeden hemen önce gard tuşuna bas; rakip sendeler.':
        '<b>Tangkis:</b> tekan jaga tepat sebelum serangan kena; lawanmu akan terhuyung.',
      '<b>Karşılık (返し技):</b> gard ya da savuşturmanın hemen ardından saldırı tuşu → anında karşı kesik. <b>İleri</b> + hafif = bacağa süpürme, <b>geri</b> + hafif = yanından dönüp arkadan kesme, <b>ağır</b> = güçlü karşı darbe.':
        '<b>Serang balik (返し技):</b> serang tepat setelah bertahan atau menangkis → tebasan balik seketika. <b>Maju</b> + ringan = sapuan kaki, <b>mundur</b> + ringan = selinap yang menebas dari belakang, <b>berat</b> = serangan balik yang kuat.',
      '<b>Karşılıklı seri:</b> karşılık da karşılanabilir. Her turda vuruşlar hızlanır ve güçlenir; kendi 3. karşılığın üç vuruşluk sinematik bir bitirişe dönüşür. Seriyi kıran darbe ağır çekimde iner.':
        '<b>Saling balas:</b> serangan balik pun bisa dibalas. Tiap pertukaran makin cepat dan keras; balasan ke-3 milikmu menjadi penghabisan sinematik tiga serangan. Pukulan yang memutus rangkaian mendarat dalam gerak lambat.',
      '<b>Kılıç kilidi:</b> kılıçlar çarpışınca kilitlenebilir. Hafif/ağır tuşuna hızlı basan rakibini iter.':
        '<b>Adu pedang:</b> pedang yang beradu bisa saling terkunci. Siapa yang menekan ringan/berat lebih cepat akan mendorong lawannya.',
      '<b>Ki barı</b> vurdukça, yedikçe ve savuşturdukça dolar. Dolunca her ninjanın kendine özgü ki tekniği açılır (Antrenman’daki hareket listesinde görebilirsin).':
        '<b>Bar ki</b> terisi saat kamu menyerang, terkena serangan, dan menangkis. Saat penuh, teknik ki khas tiap ninja siap dipakai (lihat daftar gerakan di Latihan).',
      '<b>Atılma + hafif</b> = atılarak kesik. <b>Havada</b> hafif = hava kesiği, ağır = dalış. Ağır kesik yere serer, duvara çarpan geri seker.':
        '<b>Lesat + ringan</b> = tebasan lesat. <b>Di udara</b> ringan = tebasan udara, berat = tukikan. Tebasan berat menjatuhkan lawan; siapa pun yang terbanting ke dinding akan memantul.',
      '<b>Denge çubuğu</b> dolarsa gard kırılır. Tekme gardı delip dengeyi hızla doldurur.':
        'Saat <b>bar kuda-kuda</b> penuh, pertahanan hancur. Tendangan menembus pertahanan dan cepat mengisi kuda-kuda.',
      // gamepad note (Esc -> Start or P)
      'Gamepad: X hafif · Y ağır · B tekme · A zıpla · LB gard · RB shuriken · RT atılma · R3 ki tekniği. Start ya da <kbd>P</kbd> duraklatır. CPU modunda her iki tuş seti de seni yönetir.':
        'Gamepad: X ringan · Y berat · B tendang · A lompat · LB jaga · RB shuriken · RT lesat · R3 teknik ki. Start atau <kbd>P</kbd> untuk jeda. Di mode CPU, kedua set tombol mengendalikanmu.',
      // select / VS hints (Esc -> ⌫)
      '<kbd>Enter</kbd> başlatır · <kbd>⌫</kbd> menüye döner': '<kbd>Enter</kbd> mulai · <kbd>⌫</kbd> kembali',
      '<kbd>Enter</kbd> / <kbd>F</kbd> başlatır · <kbd>⌫</kbd> çıkar': '<kbd>Enter</kbd> / <kbd>F</kbd> mulai · <kbd>⌫</kbd> keluar',
    });

    EN.PATTERNS.push(
      // HUD round label (#rlabel) and round banner
      [/^RAUND (\d+)$/, 'RONDE $1'],
      [/^(\d+)\. Raund$/, 'Ronde $1'],
      // canvas pop-ups built from numbers
      [/^(\d+)\. KARŞILIK$/, 'BALASAN ×$1'],
      [/^(\d+) VURUŞLUK SERİ!$/, '$1 BALASAN BERUNTUN!'],
      // time-up banner sub: `${name} önde`
      [/^(.+) önde$/, (m, n) => I.t(n) + ' unggul'],
      // end screen title: `${Name} kazandı`
      [/^(.+) kazandı$/, (m, n) => I.t(n) + ' menang'],
      // end screen sub line: `${a} – ${b} · ${round} raund · ${arenaName}`
      [/^(\d+) – (\d+) · (\d+) raund · (.+)$/, (m, a, b, r, ar) => `${a} – ${b} · ${r} ronde · ${I.t(ar)}`],
    );

    // ================================================================ added with the portal build (PLAY, ads, coach)
    merge(EN.STR, {
      menu: { play: 'Main', playSub: (name, lv) => `${name} lawan CPU · ${lv}` },
      first: { play: 'Main', sub: 'Sekali ketuk, langsung bertarung', menu: 'Semua mode' },
      ads: {
        cont: 'Lanjut dari sini', contSub: 'Tonton iklan · ulangi tanpa penalti',
        trial: (name) => `Coba ${name} untuk satu laga`, trialSub: 'Tonton iklan',
        fail: 'Iklan belum tersedia, coba lagi sebentar lagi',
      },
      coach: {
        attack: (l) => `${l} Serang`,
        guard: (l, g) => `Tahan ${g} untuk bertahan`,
        parry: (l, g) => `Tekan ${g} tepat sebelum serangan kena: tangkis`,
        attackT: (l) => `Ketuk ${l} · terus ketuk: kombo`,
        guardT: (l, g) => `Tahan ${g} untuk bertahan`,
        parryT: (l, g) => `Ketuk ${g} tepat sebelum serangan kena: tangkis`,
      },
    });

    // ================================================================ VOLUME: sliders on the menu card and in pause (js/volume.js)
    merge(EN.STR, {
      vol: {
        title: 'Volume', master: 'Utama', music: 'Musik', sfx: 'Efek', sound: 'Suara',
        pct: (n) => `${n}%`,
        muted: 'Suara mati. Geser salah satu pengatur untuk menyalakannya lagi.',
        // Settings > Audio: character / announcer voices switch (js/voice.js) and the courtesy credit under it
        voice: 'Suara karakter',
        uiSfx: 'Suara menu',
        credit: 'Suara: ユーフルカ (youfulca.com) · 効果音ラボ · すぱらんど',
      },
    });

    // ================================================================ TOUCH LAYOUT EDITOR: movement modes + "Customize controls"
    // (js/touch.js settings rows, js/touch-editor.js; Turkish source in i18n.js, block "touch movement modes + layout editor")
    merge(EN.STR, {
      tedit: {
        move: 'Gerakan',
        moves: { float: 'Joystik', fixed: 'Joystik tetap', dpad: 'D-pad' },
        mnote: {
          float: 'Joystik muncul di mana pun jempolmu menyentuh.',
          fixed: 'Joystik tetap di tempat kamu menaruhnya; dorong dari bagian tengahnya.',
          dpad: 'Tombol terpisah: tahan untuk berjalan, ketuk dua kali untuk melesat. Tekan di antara dua tombol untuk keduanya (▶ + ▲ = lompat ke depan).',
          dtap: 'Tombol terpisah: ketukan cepat pada ◀ ▶ melangkah sedikit, tahan untuk berjalan, ketuk dua kali untuk melesat.',
        },
        dtap: 'Ketuk melangkah',
        edit: 'Atur kontrol',
        title: 'Atur kontrol',
        hint: 'Seret tombol ke mana saja. Ketuk untuk ukuran, opasitas, atau menyembunyikannya.',
        rotate: 'Putar layarmu ke samping untuk mengatur kontrol bertarung.',
        shapes: { phone: 'Ponsel', tablet: 'Tablet', portrait: 'Potret' },
        screenNote: 'Tata letak disimpan untuk bentuk layar ini: ponsel dan tablet masing-masing punya sendiri.',
        save: 'Simpan', cancel: 'Batal', options: 'Opsi', done: 'Selesai', close: 'Tutup',
        size: 'Ukuran', sizes: { s: 'S', m: 'M', l: 'L', xl: 'XL' },
        opacity: 'Opasitas', opacityAll: 'Opasitas (semua)',
        hide: 'Sembunyikan', show: 'Tampilkan', hidden: 'Tersembunyi',
        snap: 'Tempel ke grid',
        presets: 'Preset', pRight: 'Tangan kanan', pLeft: 'Tangan kiri', pSplit: 'Jaga di kiri',
        reset: 'Kembali ke bawaan', resetDone: 'Tata letak bawaan kembali (berlaku saat kamu simpan).',
        overlap: 'Tombol tak boleh bertumpuk: dipindah ke tempat kosong terdekat.',
        noRoom: 'Tak ada ruang di sana: tombol dikembalikan.',
        saved: 'Kontrol tersimpan',
        throwName: 'SHURIKEN',
        pauseName: 'Jeda',
        dirs: { dl: '◀ Kiri', dr: 'Kanan ▶', du: '▲ Lompat', dd: '▼ Jaga' },
      },
    });

    // ================================================================ PROGRESSION: honor, rival challenges, moves panel
    // (arcade.js STR.honor / STR.rival / STR.hint, game.js select screen; rules in js/honor.js)
    merge(EN.STR, {
      menu: { arcadeDesc: 'Kalahkan para rival satu per satu sementara tingkat kesulitan naik, dengan master rahasia menunggu di akhir. Sumber kehormatan terbesar.' },
      sel: {
        title: { rival: 'Tantangan Rival · Pilih ninjamu' },
        go: { rival: 'Terima duel' },
        moves: 'Gerakan',
        movesOf: (name) => `${name} · Gerakan`,
        close: 'Tutup',
      },
      hint: {
        honor: (have, need) => `Kehormatan ${num(Math.min(have, need))}/${num(need)} → Tantangan Rival terbuka`,
        ready: 'Siap ditantang!',
        arenaHonor: (have, need) => `Terbuka di ${num(need)} kehormatan (${num(Math.min(have, need))}/${num(need)})`,
      },
      honor: {
        name: 'Kehormatan',
        head: 'Kehormatan',
        rows: { win: 'Menang', loss: 'Hadir', rounds: 'Ronde dimenangkan', perfect: 'Ronde sempurna', rally: 'Saling balas', counter: 'Serangan balik', parry: 'Tangkisan', rivalWin: 'Tantangan Rival', arcadeClear: 'Arkade tamat' },
        total: (n) => `Kehormatan: ${num(n)}`,
        next: (name, left) => `Ninja berikutnya: ${name} — ${num(left)} kehormatan lagi`,
        bar: (have, need) => `Kehormatan ${num(Math.min(have, need))}/${num(need)} → Tantangan Rival terbuka`,
        ready: (name) => `${name} menantangmu!`,
        readyGo: 'Terima',
        all: 'Semua ninja terbuka',
        bonus: { arcadeClear: 'Arkade tamat', tourneyClear: 'Turnamen ditaklukkan', danPass: 'Lulus ujian Dan', rivalWin: 'Tantangan Rival dimenangkan', tutorial: 'Tutorial selesai' },
        bonusToast: (n, what) => `+${num(n)} kehormatan · ${what}`,
        road: 'Jalan Kehormatan',
        roadSub: 'Kamu mendapat kehormatan di setiap mode satu pemain. Capai batas seorang ninja dan dia akan menantangmu berduel; menangkan duelnya dan dia bergabung denganmu.',
        earnHead: 'Sumber kehormatan',
        earn: (H) => [
          ['Lawan CPU', `Menang: Murid ${H.win[0]} · Pendekar ${H.win[1]} · Legenda ${H.win[2]}`],
          ['Arkade', `Menang sesuai kesulitan · Shura ${H.win[3]} · tamatkan +${H.arcadeClear}`],
          ['Turnamen & Dan', `Menang ×${H.modeMul.tourney} · taklukkan turnamen +${H.tourneyClear} · tiap ujian Dan +${H.danPass(1)} ke atas`],
          ['Meski kalah', `Hadir ${H.loss} · tiap ronde dimenangkan ${H.roundWon}`],
          ['Main bagus', `Tangkisan, serangan balik, saling balas, ronde sempurna: hingga +${H.styleCap} per laga`],
        ],
        rivalsHead: 'Rival',
        arenasHead: 'Arena',
        open: 'Terbuka',
        castle: 'Kalahkan Shura di Arkade',
        you: (n) => `Kehormatanmu: ${num(n)}`,
      },
      rival: {
        stage: 'Tantangan Rival',
        selTitle: (name) => `${name} menantangmu · Pilih ninjamu`,
        lvHp: (lv, p) => (p === 100 ? lv : `${lv} · HP rival ${p}%`),
        accept: 'Terima tantangan',
        acceptSub: (name) => `Menang, dan ${name} jadi milikmu`,
        quit: 'Mundur',
        hud: 'TANTANGAN RIVAL',
        winTitle: (name) => `${name} bergabung denganmu!`,
        winSub: (name) => `${name} kini ada di layar pilihan. Langsung coba!`,
        tryNew: (name) => `Main sebagai ${name}`,
        lossTitle: 'Tantangan berlanjut',
        lossSub: (name, p) => `${name} menang kali ini. Kalah tak merugikanmu apa pun; lain kali dia mulai dengan ${p}% HP.`,
        lossSubMin: (name) => `${name} menang kali ini. Kalah tak merugikanmu apa pun; coba lagi.`,
        retry: 'Tantang lagi',
        reveal: 'Ninja baru',
        toastReady: (name) => `${name} menantangmu!`,
        lines: {
          hana: 'Aku dengar soal kehormatanmu, seisi pasar membicarakanmu! Ikuti tarianku, dan aku akan ikut denganmu!',
          tetsu: 'Namamu sampai ke telingaku. Kalahkan aku, dan naginata-ku akan bertarung di sisimu.',
          ren: 'Hah! Akhirnya ada yang memanggilku! Menang, aku milikmu; kalah, kamu dengarkan tawaku!',
          kage: 'Aku sudah lama mengawasimu. Tangkap bayanganku, dan aku milikmu.',
          tora: 'Buktikan kamu bukan mangsa. Lolos dari rantaiku, dan aku berjalan di sampingmu.',
          jin: 'Jika kehormatanmu datang dari hati, tongkatku akan tahu. Mari, biar kuuji kamu.',
          mai: 'Kamu diundang ke panggungku. Raih tepuk tanganku, dan tarianku jadi milikmu.',
          tsubame: 'Aku mengamatimu dari jauh; kamu hebat. Hindari panahku, dan busurku bersamamu.',
        },
      },
    });

    // ================================================================ COMBAT: new kits, combos, move list (combat designer)
    // Akane/Aoi/Ren/Kage identities, combo counter, ki cancel, ND.MOVELIST names/descriptions (read through ND.i18n.t)
    merge(EN.CHARS, {
      akane: { desc: 'Master iaijutsu. Pedang menunggu di sarungnya dan setiap tebasan adalah cabutan; kuda-kuda cabutnya menangkap serangan yang datang.', weapon: 'Katana (iai)' },
      aoi: { desc: 'Pendekar tachi satu tangan yang selincah angin. Tusukan berjangkauan jauh dan langkah angin menutup jarak dalam satu gerakan.', weapon: 'Tachi' },
      ren: { desc: 'Petarung bertopeng oni. Pedang di bahu; bertarung dengan siku, lutut, bahu, dan kepala, serta menghancurkan pertahanan.' },
      kage: { desc: 'Bayangan bertudung. Memegang ninjatō terbalik; bertarung dengan langkah bayangan, tipuan, dan bom asap.' },
    });
    merge(EN.TXT, { kiCancel: 'BATAL KI!', launch: 'LONTAR!', iaiCatch: 'IAI GAESHI!' });
    EN.PATTERNS.push([/^(\d+) VURUŞ$/, '$1 SERANGAN']);
    merge(EN.PHRASES, {
      // shared rows
      'Tekme': 'Tendangan',
      'Tekme: dengeyi hızla doldurur, gardı kırmaya yarar. Ardından AĞIR ile seri bitirişine bağlanır.': 'Tendangan: cepat mengisi kuda-kuda dan membantu menghancurkan pertahanan. Lanjutkan dengan BERAT untuk akhir rangkaian.',
      'Shuriken fırlatır; zamanla yeniden dolar.': 'Melempar shuriken; terisi lagi seiring waktu.',
      'Hava kesiği': 'Tebasan udara',
      'Havada hafif kesik. Havaya fırlatılmış rakibe de vurur.': 'Tebasan ringan di udara. Juga mengenai lawan yang terlontar.',
      'Dalış': 'Tukikan',
      'Havadan aşağı dalış kesiği; yere serer.': 'Tebasan menukik dari udara; menjatuhkan lawan.',
      'Kaeshi-waza (karşılık)': 'Kaeshi-waza (serang balik)',
      'Gard ya da savuşturmanın hemen ardından karşılık: nötr Suriage, ileri Harai (yere serer), geri Nuki (arkaya geçer), ağır Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.': 'Serang balik tepat setelah bertahan atau menangkis: netral Suriage, maju Harai (menjatuhkan), mundur Nuki (menyelinap ke belakang), berat Uchiotoshi. Balasan ketigamu adalah penghabisan; jika ditangkis, saling balas berlanjut.',
      'Fırlatıcı isabet edince HAFİF: rakibin peşinden sıçrayıp havada keser. Ardından AĞIR ile yere çakar. Havadaki rakip en çok üç vuruş alır.': 'Saat pelontar kena, RINGAN: lompat mengejar lawan dan tebas di udara. Lalu BERAT membantingnya ke tanah. Lawan di udara menerima paling banyak tiga serangan.',
      'Üç vuruşluk hafif seri. İkinci ve üçüncü vuruş ki doluyken tekniğe bağlanır.': 'Rangkaian ringan tiga serangan. Dengan ki penuh, serangan kedua dan ketiga bisa dibatalkan ke teknik ki.',
      'Ağır vuruş: yavaş ama yere serer.': 'Serangan berat: lambat, tapi menjatuhkan lawan.',
      'İleri atılarak dürter; hafif seriye devam eder.': 'Menerjang maju dengan tusukan; berlanjut ke rangkaian ringan.',
      'Yarım adım geri çekilip bacaklara alçak süpürme; yere serer.': 'Mundur setengah langkah, lalu sapuan rendah ke kaki; menjatuhkan lawan.',
      'Fırlatıcı: yükselen kesik rakibi havaya kaldırır.': 'Pelontar: tebasan naik mengangkat lawan ke udara.',
      'Sıçrayıp tepeden iner: yavaş ama gardı ezer, yere serer.': 'Melompat dan turun dari atas: lambat, tapi menghancurkan pertahanan dan menjatuhkan lawan.',
      'Atılırken dönerek geniş kesik; yere serer.': 'Tebasan berputar yang lebar dari lesatan; menjatuhkan lawan.',
      'İki kesiklik seri bitirişi; son kesik yere serer.': 'Akhir rangkaian dua tebasan; tebasan terakhir menjatuhkan lawan.',
      'Rakibin kılıcını aşağı çarpıp dürter: gardı ezer.': 'Memukul pedang lawan ke bawah lalu menusuk: menghancurkan pertahanan.',
      // Akane
      'Kından yatay çekiş kesiği, çapraz iniş, geri dönen kesik; kılıç her seferinde kınına döner.': 'Tebasan cabut mendatar dari sarung, tebasan turun menyilang, dan tebasan balik; pedang selalu kembali ke sarungnya.',
      'Derin çömelişten geniş yatay çekiş; yere serer.': 'Cabutan mendatar yang lebar dari posisi jongkok dalam; menjatuhkan lawan.',
      'Atılarak kından çekiş: uzak mesafeyi bir anda kapatır, seriye devam eder.': 'Cabutan sambil melesat dari sarung: menutup jarak jauh seketika dan melanjutkan rangkaian.',
      'Kılıcı çekmeden kabzayla göğse vurur: hızlı, sersemletir. Ardından HAFİF ile Kesa ya da AĞIR ile Kurenai Renga.': 'Memukul dada dengan gagang tanpa mencabut pedang: cepat dan membuat pusing. Lanjutkan dengan RINGAN untuk Kesa atau BERAT untuk Kurenai Renga.',
      'Fırlatıcı: kından yükselen çekiş rakibi havaya kaldırır.': 'Pelontar: cabutan naik dari sarung mengangkat lawan ke udara.',
      'Çekiş duruşu: kısa bir an bekler; bu sırada gelen yakın dövüş darbesini yakalar ve kaçınılmaz bir iai kesiğiyle karşılık verir. Boşa giderse açık kalır.': 'Kuda-kuda cabut: menunggu sesaat; serangan jarak dekat yang datang saat itu ditangkap dan dibalas dengan tebasan iai yang tak terhindarkan. Jika tak ada serangan, dia terbuka.',
      'Kesa’dan sonra yükselen ve inen iki çekiş kesiği; son kesik yere serer.': 'Setelah Kesa, tebasan cabut naik dan turun; tebasan terakhir menjatuhkan lawan.',
      'Tekmeden sonra çömelip rakibin içinden geçen kızıl iai; arkasında belirir.': 'Setelah tendangan, iai merah sambil merunduk yang menembus lawan; dia muncul di belakangnya.',
      // Aoi
      'Tek elle uzun dürtüş, yukarı savrulan kesik ve rüzgâr adımıyla derin atılma dürtüşü.': 'Tusukan panjang satu tangan, tebasan naik yang menyentak, dan tusukan terjang yang dalam dengan langkah angin.',
      'Dönerek geniş yatay kesik; yere serer.': 'Tebasan mendatar yang lebar sambil berputar; menjatuhkan lawan.',
      'Rüzgâr adımı: çok uzaktan tek hamlede dürter, seriye devam eder.': 'Langkah angin: menusuk dari jauh sekali dalam satu gerakan dan melanjutkan rangkaian.',
      'Geri çekilirken uzun menzilli iniş kesiği: yaklaşanı cezalandırır.': 'Tebasan turun berjangkauan jauh sambil mundur: menghukum siapa pun yang mendekat.',
      'Fırlatıcı: dönerek yükselen kesik rakibi havaya kaldırır.': 'Pelontar: tebasan naik sambil berputar mengangkat lawan ke udara.',
      'Geri sıçrar, ardından çok uzağa uzanan dürtüşle geri döner: gardı ezer, yere serer.': 'Meloncat mundur, lalu kembali dengan tusukan yang sangat panjang: menghancurkan pertahanan dan menjatuhkan lawan.',
      'Üç hızlı dürtüş; sonuncusu rüzgârla rakibi savurur.': 'Tiga tusukan cepat; yang terakhir menghempaskan lawan dengan angin.',
      'İki kez dönerek çevresini biçen kesik; gardı ezer.': 'Berputar dua kali, menebas ke sekeliling; menghancurkan pertahanan.',
      // Ren
      'Kesik · Dirsek · Diz': 'Tebas · Siku · Lutut',
      'Tek elle kesik, dirsek darbesi ve uçan diz: kılıçla başlayıp bedenle biter.': 'Tebasan satu tangan, hantaman siku, dan lutut terbang: dimulai dengan pedang, diakhiri dengan tubuh.',
      'İki elle tepeden ezici iniş; gardı zorlar, yere serer.': 'Hantaman dua tangan yang meremukkan dari atas; menekan pertahanan dan menjatuhkan lawan.',
      'Omuz hücumu: öne atılıp omuzla çarpar, dengeyi sarsar. İsabet ederse seriye devam eder.': 'Terjangan bahu: menerjang dan menghantam dengan bahu, mengguncang kuda-kuda. Jika kena, rangkaian berlanjut.',
      'Kafa atar: kısa menzil, uzun sersemletme. İsabet ederse seriye devam eder.': 'Sundulan: jangkauan pendek, pusing lama. Jika kena, rangkaian berlanjut.',
      'Fırlatıcı: aşağıdan yukarı iki elle savrulan kesik.': 'Pelontar: tebasan dua tangan yang diayun dari bawah ke atas.',
      'Topuğu havaya kaldırıp balta gibi indirir: yere serer.': 'Mengangkat tumit tinggi lalu menjatuhkannya seperti kapak: menjatuhkan lawan.',
      'Dirsekten sonra kesik ve tepeden ezici iniş; son vuruş yere serer.': 'Setelah siku, tebasan dan hantaman meremukkan dari atas; serangan terakhir menjatuhkan lawan.',
      'Tekmenin ardından dönen topuk tekmesi; yere serer.': 'Setelah tendangan, tendangan tumit berputar; menjatuhkan lawan.',
      // Kage
      'Ters tutuşla kesik, dönen kesik ve gölge adımı: kaybolup öne geçer, dürterek belirir.': 'Tebasan genggaman terbalik, tebasan berputar, dan langkah bayangan: menghilang, menyelinap maju, lalu muncul sambil menusuk.',
      'Sıçrayıp ters tutuşla aşağı saplar; yere serer.': 'Meloncat dan menikam ke bawah dengan genggaman terbalik; menjatuhkan lawan.',
      'Gölge gibi uzun atılma kesiği; seriye devam eder.': 'Tebasan lesat panjang bagai bayangan; melanjutkan rangkaian.',
      'Aldatma: kesecekmiş gibi parlar, dumanla geri kaçar. Erken savuşturmayı boşa çıkarır; hemen HAFİF ile gölge adımına, AĞIR ile Kage-nui’ye bağlanır.': 'Tipuan: berkilat seolah akan menebas, lalu menyelinap mundur dalam asap. Menggagalkan tangkisan yang terlalu cepat; langsung bersambung ke langkah bayangan dengan RINGAN atau Kage-nui dengan BERAT.',
      'Fırlatıcı: ters tutuşla yükselen kesik.': 'Pelontar: tebasan naik dengan genggaman terbalik.',
      'Ayağının dibine sis bombası atar: yakındakini sersemletir, Kage dumanın içinde geri kaçar.': 'Melempar bom asap ke kaki: membuat pusing siapa pun di dekatnya sementara Kage menyelinap mundur di dalam asap.',
      'Üç hızlı ters kesik ve aşağı saplama; sonuncusu yere serer.': 'Tiga tebasan terbalik yang cepat dan tikaman ke bawah; yang terakhir menjatuhkan lawan.',
      'Tekmeden sonra dumanda kaybolur, rakibin arkasında belirip saplar.': 'Setelah tendangan, menghilang dalam asap lalu muncul di belakang lawan sambil menikam.',
      // template row names
      'Nodachi serisi': 'Rangkaian nodachi', 'Ağır nodachi': 'Nodachi berat', 'Kodachi serisi': 'Rangkaian kodachi', 'Ağır kesik': 'Tebasan berat',
      'Tantō dansı': 'Tarian tantō', 'Çift kesik': 'Tebasan kembar', 'Naginata serisi': 'Rangkaian naginata', 'Ağır savuruş': 'Ayunan berat',
      'Zincir ve orak': 'Rantai dan sabit', 'Zincir çekişi': 'Tarikan rantai', 'Asa serisi': 'Rangkaian tongkat', 'Ağır süpürme': 'Sapuan berat',
      'Yelpaze serisi': 'Rangkaian kipas', 'Rüzgâr dalgası': 'Gelombang angin', 'Tantō serisi': 'Rangkaian tantō', 'Ok (basılı tut: güçlü)': 'Panah (tahan: tembakan kuat)',
      'Geri + AĞIR da ok atar (basılı tut: güçlü atış); ok kalmadıysa tantō ile tepeden iner.': 'Mundur + BERAT juga menembakkan panah (tahan untuk tembakan kuat); jika panah habis, dia turun dari atas dengan tantō.',
      // combat pop-ups
      'KI İPTALİ!': 'BATAL KI!', 'HAVAYA!': 'LONTAR!',
    });

    // ================================================================ COUNTER CINEMATIC + COMBO TRIAL (combat feel pass)
    // js/kaeshi-cine.js STR.kaeshi, js/combo-trial.js STR.trial, js/coach.js combo/counter tips, move list legend
    {
      const tb = (t, c) => `<i class="tb${c ? ' ' + c : ''}">${t}</i>`;
      merge(EN.STR, {
        kaeshi: {
          head: 'KAESHI-WAZA', strike: 'BALAS!', hits: 'SERANGAN',
          labels: {
            suriage: 'Geser naik di pedangnya, tebas turun menyilang',
            harai: 'Tepis pedangnya, tebas kakinya',
            nuki: 'Hindari pukulannya, tebas dari belakang',
            uchiotoshi: 'Hantam pedangnya ke bawah, tusuk tembus',
            sandan: 'Rangkaian serangan balik tiga tebasan',
          },
        },
        trial: {
          title: 'Tantangan kombo',
          btn: { prev: 'Kombo sebelumnya', next: 'Kombo berikutnya', retry: 'Ulangi dari awal', close: 'Tutup' },
          names: { chain: 'Rangkaian dasar', s1: 'Akhir rangkaian', s2: 'Rangkaian tendangan', launch: 'Pelontar', s3: 'Kombo panjang' },
          desc: {
            chain: '{L} tiga kali. Tekan masing-masing saat serangan sebelumnya kena; rangkaian berakhir dengan penghabisan khas.',
            s1: '{L} dua kali, lalu {H}: rangkaian berakhir dengan tebasan berat.',
            s2: '{L}, tendang {K}, lalu {H}.',
            launch: '{D} + {H} melontarkan; saat lawan melayang, {L}, lalu {H}.',
            s3: 'Dua {L}, {D} + {H} untuk melontarkan, {L}, {H}: lima serangan.',
          },
          ready: (w) => `Mulai: ${w}`,
          startWith: (w) => `Kombo ini dimulai dengan ${w}.`,
          early: 'Terlalu cepat: tekan saat serangan sebelumnya kena.',
          late: 'Terlambat: tekan sebelum gerakan selesai, tepat saat serangan kena.',
          wrong: (got, want) => `Tombol salah: ${got}, langkah ini butuh ${want}.`,
          dir: (want) => `Arah belum ditekan: ${want}. Tahan arahnya, lalu tekan.`,
          miss: 'Meleset: serangannya tidak kena. Dekati bonekanya.',
          clear: 'KOMBO BERHASIL!', clearPop: 'KOMBO BERHASIL!',
          all: 'Semua tantangan kombo ninja ini sudah selesai!',
        },
        coach: {
          combo: (l) => `${l} ${l} ${l} cepat: kombo 3 serangan`,
          comboT: (l) => `Ketuk ${l} tiga kali berturut-turut: kombo`,
          counter: (l) => `Setelah bertahan atau menangkis, tekan ${l} saat BALAS! muncul: serangan balik`,
          counterT: (l) => `Setelah bertahan atau menangkis, ketuk ${l} saat BALAS! muncul`,
        },
      });
      const L = Array.isArray(EN.STR.lessons) && EN.STR.lessons.find((l) => l.id === 'counter');
      if (L) L.d = 'Setelah bertahan atau menangkis, <b>BALAS!</b> muncul di atas kepalamu: tekan <kbd>F</kbd> sebelum barnya habis. Maju/mundur + <kbd>F</kbd> atau <kbd>G</kbd> adalah serangan balik lainnya.';
      if (EN.STR.lessonsTouch) EN.STR.lessonsTouch.counter = `Setelah bertahan atau menangkis, <b>BALAS!</b> muncul di atas kepalamu: ketuk ${tb('SERANG', 'tb-light')} sebelum barnya habis. Joystik maju/mundur + ${tb('SERANG', 'tb-light')} atau ${tb('BERAT')} adalah serangan balik lainnya.`;
      merge(EN.PHRASES, {
        'KOMBO TAMAM!': 'KOMBO BERHASIL!',
        'Nasıl okunur': 'Cara membaca',
        '→ rakibe doğru, ← rakipten uzağa demek: o yön tuşunu (A / D ya da ok tuşları; rakip sağındaysa D) basılı tut ve saldırı tuşuna bas. Virgül: tuşlara sırayla bas. F hafif, G ağır, R tekme, S gard.':
          '→ artinya ke arah lawan, ← menjauhi lawan: tahan tombol arah itu (A / D atau tombol panah; D jika lawan di kananmu) lalu tekan tombol serang. Koma: tekan tombol satu per satu secara berurutan. F ringan, G berat, R tendang, S jaga.',
        '▶ rakibe doğru, ◀ rakipten uzağa: yön çubuğunu o yana itip düğmeye dokun. Virgül: düğmelere sırayla dokun. Antrenmandaki Kombo denemesi her seriyi adım adım gösterir.':
          '▶ ke arah lawan, ◀ menjauhi lawan: dorong joystik ke arah itu lalu ketuk tombolnya. Koma: ketuk tombol satu per satu secara berurutan. Tantangan kombo di Latihan menunjukkan setiap rangkaian langkah demi langkah.',
        'Gard ya da savuşturmanın ardından ekranda VUR! çıkar: altındaki çubuk bitmeden HAFİF’e bas. Yalnız HAFİF: Suriage. İleri + HAFİF: Harai (yere serer). Geri + HAFİF: Nuki (arkaya geçer). AĞIR: Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.':
          'Setelah bertahan atau menangkis, BALAS! muncul: tekan RINGAN sebelum barnya habis. RINGAN saja: Suriage. Maju + RINGAN: Harai (menjatuhkan). Mundur + RINGAN: Nuki (menyelinap ke belakang). BERAT: Uchiotoshi. Balasan ketigamu adalah penghabisan; jika ditangkis, saling balas berlanjut.',
      });
    }

    // ================================================================ GRAPHICS QUALITY: the Graphics setting (js/gfx.js)
    // (Turkish source in i18n.js, block "graphics quality")
    merge(EN.STR, {
      gfx: {
        title: 'Grafis',
        levels: { auto: 'Otomatis', high: 'Tinggi', medium: 'Sedang', low: 'Rendah', custom: 'Kustom' },
        note: {
          auto: 'Disesuaikan dengan perangkatmu dan turun sendiri jika laga tersendat.',
          high: 'Semua cahaya dan efek. Untuk perangkat yang kuat.',
          medium: 'Cahaya ringan, tanpa bayangan. Untuk sebagian besar ponsel.',
          low: 'Paling mulus. Untuk ponsel lama.',
          custom: 'Pengaturanmu sendiri (Lanjutan).',
        },
        now: (lv) => `Sekarang: ${lv}`,
        // Settings → Graphics → Advanced (game.js gfxAdvBuild, js/gfx.js KNOBS): the switch, the line under it, the hint on
        // the heaviest rows, one title per knob and the value words (resolution shows percentages, anti-aliasing 2× / 4×)
        adv: {
          title: 'Lanjutan',
          note: 'Mengubah salah satunya membuat pilihan jadi "Kustom"; menekan preset mengembalikan nilainya.',
          hot: 'paling panas',
          knob: { scale: 'Resolusi', msaa: 'Anti-aliasing', bloom: 'Pendar', shadows: 'Bayangan & pantulan', effects: 'Cuaca & partikel' },
          val: { off: 'Mati', low: 'Rendah', mid: 'Sedang', full: 'Penuh', simple: 'Ringkas' },
        },
      },
    });

    // ================================================================ FRAME RATE: Settings → Graphics (js/gfx.js makePacer)
    // (Turkish source in i18n.js, block "frame rate"; the numbers themselves are not translated)
    merge(EN.STR, {
      fps: {
        title: 'Laju frame',
        show: 'Tampilkan FPS',
        levels: { max: 'Maks' },
        note: {
          60: 'Stabil dan tidak panas. Terbaik untuk sebagian besar ponsel.',
          90: 'Lebih mulus jika layarnya mendukung. Lebih boros baterai.',
          120: 'Paling mulus di layar 120 Hz. Lebih boros baterai.',
          max: 'Secepat yang diizinkan layarmu.',
        },
      },
    });

    // ================================================================ SETTINGS SCREEN (js/settings.js; Turkish source in i18n.js)
    merge(EN.STR, {
      set: {
        title: 'Pengaturan', close: 'Tutup',
        tabs: { audio: 'Suara', controls: 'Kontrol', gfx: 'Grafis', lang: 'Bahasa' },
        touch: 'Sentuh', keys: 'Keyboard', pad: 'Gamepad',
        touchNote: 'Pengaturan kontrol sentuh muncul di sini setelah kamu menyentuh layar.',
      },
    });

    // ================================================================ LANGUAGE PICKER (js/lang-ui.js; Turkish source in i18n.js)
    // Language names are not translated: each one is written in its own language (ND.i18n.names).
    merge(EN.STR, { lang: { title: 'Bahasa', change: 'Ganti bahasa', close: 'Tutup' } });

    // ================================================================ TOUCH HELP PER MOVEMENT MODE
    // (game.js touchHelp(): the menu's touch help follows the movement mode; Turkish source in i18n.js, block
    // "touch help per movement mode")
    merge(EN.STR, {
      thelp: {
        title: { float: 'Joystik', fixed: 'Joystik tetap', dpad: 'D-pad' },
        float: { walk: 'Taruh jempol di separuh layar yang kosong lalu geser: jalan', jump: 'Dorong ke atas: lompat', guard: 'Tarik ke bawah: bertahan', dash: 'Sentil ke samping dua kali: lesat' },
        fixed: { walk: 'Pegang joystik di tengahnya dan dorong ke samping: jalan', jump: 'Dorong ke atas: lompat', guard: 'Tarik ke bawah: bertahan', dash: 'Sentil ke samping dua kali: lesat' },
        dpad: {
          walk: 'Tahan: jalan', step: 'Ketuk cepat: satu langkah pendek', jump: 'Ketuk: lompat', guard: 'Tahan: bertahan',
          dash: 'Ketuk dua kali: lesat', both: 'Tekan di antara dua tombol untuk keduanya (▶ + ▲ = lompat ke depan)',
        },
        edit: (b) => `${b}: seret tombol mana pun ke tempat yang kamu suka dan atur ukuran serta opasitasnya. Di Pengaturan → Kontrol.`,
      },
    });

    // ================================================================ SHARED LABELS (static HTML / move list text that is the same word in Turkish)
    merge(EN.PHRASES, { 'Shuriken': 'Shuriken', 'KI': 'KI' });

    // Persistent character journeys.
    merge(EN.STR, { menu: { arcadeDesc: 'Perjalanan delapan laga untuk tiap ninja. Lanjutkan ke rival berikutnya, buka akhir cerita karakter dan Segel Master.' }, sel: { title: { arcade: 'Arkade · Perjalanan karakter' } },
      journey: {
        start: 'Mulai perjalanan',
        resume: (i, n) => 'Lanjut · ' + i + '/' + n + '',
        ending: 'Tonton akhir cerita',
        replay: 'Ulangi perjalanan',
        badge: 'Segel Master',
        completed: 'Perjalanan selesai',
        progress: (i, n) => '' + i + '/' + n + ' laga selesai · Progres tersimpan',
        reward: 'Hadiah: akhir cerita karakter dan Segel Master permanen',
        saved: 'Setiap kemenangan disimpan. Keluar dari laga dihitung sebagai ulangan.',
        menu: (done, active) => '' + done + ' perjalanan selesai · ' + active + ' sedang berjalan',
        clearReward: 'Segel Master didapat · Akhir cerita karakter terbuka'
      }
    });

    // ================================================================ PROGRESS / ACCOUNT (Settings → Progress, Hall of Champions;
    // js/settings.js, js/banzuke.js; Turkish source in i18n.js, block "account and recovery code")
    merge(EN.STR, {
      set: { tabs: { save: 'Progres' } },
      acct: {
        title: 'Simpan progresmu',
        cgOn: (n) => `Akun CrazyGames: ${n}. Gelar, warna Juara, Dan, dan skormu tersimpan di akunmu.`,
        cgWait: (n) => `Akun CrazyGames: ${n}. Menghubungkan ke akunmu…`,
        cgFail: (n) => `Akun CrazyGames: ${n}. Akunmu tidak bisa dihubungi saat ini; skor baru disimpan di perangkat ini untuk sementara.`,
        cgSave: 'Simpan progresmu ke akun CrazyGames',
        cgSaveNote: 'Masuk akun, dan gelar, warna Juara, serta skormu pindah ke akunmu, di semua perangkat.',
        rcTitle: 'Kode pemulihan',
        rcNote: 'Catat kode ini. Masukkan di sini pada perangkat baru untuk mendapatkan kembali gelar, warna Juara, Dan, dan skormu.',
        rcShow: 'Tampilkan kode', rcNew: 'Kode baru', rcNewDone: 'Kode baru siap; kode lama tidak berlaku lagi.',
        rcNeedName: 'Simpan skor dengan sebuah nama dulu untuk mendapatkan kode pemulihan.',
        rcEnter: 'Masukkan kode pemulihan', rcGo: 'Pulihkan',
        rcDone: (n, c) => `Selamat datang kembali, ${n}! Progresmu sudah dipulihkan. Kode pemulihan barumu: ${c}`,
        err: { bad_code: 'Kode ini tidak dikenali. Periksa karakternya.', rate: 'Terlalu banyak percobaan. Coba lagi nanti.', offline: 'Tidak bisa menghubungi server. Periksa koneksimu.', banned: 'Identitas ini tidak bisa dipakai.', error: 'Terjadi kesalahan. Coba lagi.' },
        local: 'Penyimpanan online tidak tersedia di sini; progresmu disimpan di perangkat ini.',
        offline: 'Kamu sedang offline; progresmu disimpan di perangkat ini.',
        loading: 'Memuat…',
      },
      lb: { savedLocalAccount: (r) => (r ? `#${r} di perangkat ini · akunmu tidak bisa dihubungi saat ini` : 'Tersimpan di perangkat ini · akunmu tidak bisa dihubungi saat ini') },
    });

    // ================================================================ PRIVACY (js/privacy.js; Turkish source in i18n.js, block
    // "privacy"). The policy page itself (privacy.html) is English + Turkish; other languages see the English part.
    merge(EN.STR, {
      priv: {
        notice: 'Shadow Duel menyimpan nama dan skormu untuk papan peringkat online.',
        policy: 'Kebijakan Privasi', terms: 'Ketentuan', both: 'Kebijakan Privasi & Ketentuan',
        ok: 'OK', label: 'Pemberitahuan privasi',
      },
    });

    // ================================================================ FIRST-FIGHT RALLY TUTORIAL: js/tutorial.js STR.tutor and
    // Training → Parry drill (Turkish source in i18n.js, block "rally tutorial")
    merge(EN.STR, {
      menu: { trainDrill: 'Latihan tangkis' },
      tutor: {
        defend: 'BERTAHAN!', attack: 'SERANG!', again: 'LAGI!',
        pass: {
          freeze: (l, g) => `Waktu berhenti: ${g} untuk bertahan, ${l} untuk membalas`,
          slow: (l, g) => `Gerak lambat: ${g} saat cincin menutup, lalu ${l}`,
          real: (l, g) => `Kecepatan penuh: ${g} untuk bertahan, ${l} untuk membalas, dua kali`,
        },
        fail: {
          early: 'Terlalu cepat! Bertahan tepat sebelum pedang kena.',
          late: 'Terlambat! Bertahan tepat sebelum pedang kena.',
          slow: 'Terlambat! Balas selagi SERANG! masih muncul.',
          atk: 'Bertahan dulu, baru serang!',
          miss: 'Ayo coba sekali lagi.',
        },
        mastered: 'DIKUASAI!', masteredSub: 'Bertahan, balas, ulangi',
        warm: (l) => `Pemanasan: tekan ${l} tiga kali`,
        nudge: (k) => `Tekan ${k}`, nudgeT: (k) => `Ketuk ${k}`,
      },
    });

    // ================================================================ NEW PLAYER: the select screen's one-time greeting
    // (game.js openSelect), the VS goal line's "?" (arcade.js openVs) and the just-in-time tips (js/coach.js ND.coach.tips;
    // arguments: key / button chips, lessons: the menu names of Training and Tutorial). Turkish source in i18n.js.
    merge(EN.STR, {
      onb: { selIntro: 'Pilih ninjamu: masing-masing punya perjalanannya sendiri', more: 'Detail' },
      tips: {
        head: 'TIPS',
        ki: (k) => `KI penuh! ${k}: jurus spesial`,
        gbreak: (k, h) => `Dia terus bertahan: tendangan ${k} atau tebasan berat ${h} mengisi bar kuningnya dan menghancurkan pertahanannya`,
        gbreakH: (h) => `Dia terus bertahan: tebasan berat ${h} mengisi bar kuningnya dan menghancurkan pertahanannya`,
        posture: (g) => `Bar kuda-kudamu terisi: mundur, atau tangkis dengan ${g}`,
        dash: (a) => `Ketuk ${a} dua kali: lesat`,
        shuriken: (t) => `${t}: lempar shuriken`,
        heavy: (h) => `${h}: tebasan berat, lebih lambat tapi lebih keras`,
        lessons: (a, b) => `Pelajaran lengkap: ${a} → ${b}`,
        controls: (a, b) => `Kamu bisa memindahkan dan mengubah ukuran tombol di ${a} → ${b}`,
      },
    });

    // ================================================================ online "play with a friend" (js/online.js: ND.STR.online)
    merge(EN.STR, {
      online: {
        title: 'Main dengan teman',
        menuSub: 'Duel online · bagikan link atau kode 6 huruf',
        homeSub: 'Buat ruang dan kirim link-nya ke temanmu, atau ketik kode yang dikirim temanmu.',
        create: 'Buat ruang',
        join: 'Gabung',
        codePh: 'KODE',
        haveCode: 'Kode ruang',
        room: 'Ruang',
        linkLabel: 'Link undangan',
        back: 'Kembali',
        leave: 'Keluar ruang',
        copy: 'Salin link',
        copied: 'Tersalin',
        share: 'Bagikan',
        invite: 'Undang teman',
        shareText: (c) => `Ayo duel denganku di Shadow Duel! Ruang ${c}`,
        inviteNote: 'Kirim link-nya, atau beri tahu kodenya ke temanmu.',
        waitFriend: 'Menunggu temanmu bergabung…',
        joining: 'Mencari ruang…',
        connecting: 'Menghubungkan ke temanmu…',
        connected: 'Terhubung',
        you: 'Kamu',
        friend: 'Teman',
        friendTag: 'TEMAN',
        waitPick: 'Memilih…',
        pickTitle: 'Petarungmu',
        arenaTitle: 'Arena',
        arenaHost: 'Temanmu yang memilih arena',
        ready: 'Siap',
        notReady: 'Belum siap',
        readyWait: 'Menunggu temanmu siap…',
        bothReady: 'Memulai…',
        ping: (ms) => `Ping ${ms} ms`,
        badCode: 'Kode ruang terdiri dari 6 huruf.',
        noRoom: 'Tidak ada ruang dengan kode ini. Cek lagi kodenya dengan temanmu.',
        full: 'Ruang ini sudah penuh.',
        expired: 'Tak ada yang bergabung selama 10 menit, jadi ruang ditutup.',
        noDirect: 'Tidak bisa terhubung langsung ke jaringan temanmu. Coba jaringan lain (Wi-Fi / data seluler).',
        retry: 'Coba lagi',
        noConnect: 'Tidak bisa terhubung ke temanmu. Periksa koneksi internetmu dan coba lagi.',
        version: 'Versi game kamu dan temanmu berbeda. Kalian berdua muat ulang halamannya.',
        signalDown: 'Tidak bisa menghubungi server game. Periksa koneksi internetmu.',
        friendLeft: 'Temanmu keluar dari ruang.',
        waitIn: (s) => `Menunggu temanmu… ${s}`,
        away: (s) => `Temanmu beralih dari game… ${s}`,
        leaveQ: 'Keluar dari laga?',
        leaveSub: 'Temanmu menang di laga ini.',
        stay: 'Lanjut main',
        leaveMatch: 'Keluar',
        win: 'Kamu menang',
        lose: 'Kamu kalah',
        draw: 'Seri',
        over: 'Laga selesai',
        whyDrop: 'Koneksi temanmu terputus. Kamu menang (tidak dicatat).',
        whyLeft: 'Temanmu keluar dari laga.',
        whyAway: 'Laga berakhir saat kamu sedang pergi.',
        whyDesync: 'Laga jadi tidak sinkron (masalah koneksi), jadi tidak dihitung.',
        rematch: 'Tanding ulang',
        rematchWait: 'Menunggu temanmu…',
        rematchAsk: 'Tanding ulang (temanmu mau)',
        change: 'Ganti petarung',
        rounds: (a, b) => `Ronde ${a} – ${b}`,
        turning: (s) => `Temanmu sedang memutar ponselnya… ${s}`,
        paused: 'Dijeda',
        whyPauseWin: 'Temanmu tidak kembali tepat waktu. Kamu menang (tidak dicatat).',
        whyPauseLose: 'Kamu tidak kembali tepat waktu, jadi laga berakhir.',
        whyPauseBoth: 'Kalian berdua tidak kembali tepat waktu, jadi laga berakhir.',
      },
    });

    // ================================================================ ranked duel (js/ranked.js: ND.STR.ranked)
    merge(EN.STR, {
      ranked: {
        title: 'Duel ranked', menuSub: 'Lawan acak · poin, tier, dan musim', offline: 'Ranked sedang offline',
        season: (n) => `Musim ${n}`, endsIn: (d) => `Berakhir dalam ${d} hari`, endsToday: 'Berakhir hari ini',
        rating: 'Rating', record: (w, l, d) => `${w} M · ${l} K` + (d ? ` · ${d} S` : ''), placement: (a, b) => `Penempatan ${a}/${b}`,
        place: (n) => `Peringkat #${n}`, find: 'Cari lawan', findUnranked: 'Cari lawan (non-ranked)', board: 'Peringkat', how: 'Cara kerja',
        howLines: ['Server mencari lawan dengan rating dekat denganmu; rentangnya melebar selama kamu menunggu.', 'Setelah kalian berdua menerima, kamu memilih petarung tanpa melihat pilihan lawan (hanya petarung yang sudah kamu buka).',
          'Yang menang 2 dari 3 ronde jadi pemenang. Keluar dari laga berarti kalah.', 'Poin hanya berubah jika kedua perangkat melaporkan hasil yang sama. Satu musim berlangsung 4 minggu; peringkat #1 mendapat kostum spesial.'],
        reward: 'Musim #1: kostum spesial dan namanya di Aula Juara',
        signIn: 'Masuk akun untuk mendapat poin', guestNote: 'Sebagai tamu, kamu bermain non-ranked.', nickNote: 'Pilih nama untuk bermain ranked.',
        back: 'Kembali', you: 'Kamu', titleLbl: 'Gelar', noTitle: 'Tidak ada',
        searching: 'Mencari lawan…', window: (n) => `Rentang rating ±${n}`, windowAny: 'Rating berapa pun',
        warm: 'Pemanasan lawan CPU sambil menunggu', warmTag: 'Pemanasan · CPU · non-ranked', searchShort: 'Mencari', warmBack: 'Kembali mencari', cancel: 'Batal',
        none: 'Belum ada lawan saat ini.', foundTitle: 'Lawan ditemukan!', accept: 'Terima', decline: 'Tolak',
        ranked: 'Ranked', unranked: 'Non-ranked · tanpa poin',
        why: { guest: 'ada pemain tamu', same_network: 'kalian di jaringan yang sama', pair_limit: 'kamu sudah 3 kali main ranked dengannya hari ini', daily_limit: 'batas laga ranked harian' },
        waitOpp: 'Menunggu lawanmu menerima…', touch: 'Sentuh', keys: 'Keyboard / pad', placementTag: 'Penempatan', guestTag: 'Tamu',
        declined: 'Lawanmu tidak menerima · mencari lagi', youDeclined: 'Kamu menolak laga ini.', penalty: (s) => `Kamu menolak beberapa laga terakhir: kamu bisa mencari lagi dalam ${s} detik.`,
        suspended: 'Akun ranked-mu sedang ditinjau (terlalu banyak sengketa). Mode lain tetap terbuka.',
        pickTitle: 'Pilih petarungmu', pickSub: 'Lawanmu tak bisa melihat pilihanmu', lock: 'Kunci', lockedIn: 'Terkunci', oppPicking: 'Lawan sedang memilih…', oppLocked: 'Lawan sudah mengunci',
        lockedFighter: 'Belum terbuka di mode satu pemain', costume: 'Kostum', plain: 'Warna asli',
        connecting: 'Menghubungkan ke lawanmu…', noConnect: 'Tidak bisa terhubung ke lawanmu; laga tidak dihitung. Mencari lagi…',
        leaveQ: 'Keluar dari laga?', leaveSub: 'Kamu akan kalah di laga ranked ini.', stay: 'Lanjut main', leave: 'Keluar',
        waitIn: (s) => `Menunggu lawanmu… ${s}`, away: (s) => `Lawanmu beralih dari game… ${s}`, turning: (s) => `Lawanmu sedang memutar ponselnya… ${s}`, paused: 'Dijeda',
        confirming: 'Mengonfirmasi hasil…', win: 'Kamu menang', lose: 'Kamu kalah', draw: 'Seri', over: 'Laga selesai',
        delta: (d) => (d >= 0 ? '+' : '−') + Math.abs(d) + ' poin', nc: 'Laga ini tidak dihitung', disputed: 'Kedua perangkat melaporkan hasil berbeda: laga sedang ditinjau dan poin tidak berubah.',
        ncWhy: { desync: 'kedua perangkat menghitung laga secara berbeda (masalah koneksi)', connection: 'koneksi kedua pemain terputus', input_mismatch: 'catatan input kedua perangkat tidak cocok', abandoned: 'kedua pemain keluar', no_second_report: 'hasil dari lawanmu tidak pernah sampai', mixed: 'hasilnya tidak cocok' },
        promoted: 'Naik tier!', demoted: 'Turun tier', placementDone: 'Penempatan selesai!', pending: 'Hasilnya akan segera muncul di papan peringkat.',
        findAgain: 'Cari lagi', rematch: 'Tanding ulang', rematchWait: 'Menunggu lawanmu…', rematchAsk: 'Tanding ulang (lawanmu mau)', menu: 'Menu',
        youLeft: 'Kamu keluar dari laga: kalah.', oppLeft: 'Lawanmu keluar dari laga: kamu menang.', silent: 'Koneksi lawanmu terputus.', rounds: (a, b) => `Ronde ${a} – ${b}`,
        unrankedNote: 'Laga non-ranked',
        ghostFound: 'Bayangan seorang pemain sungguhan masuk',
        ghostHouseName: (n) => `Bayangan dojo · ${n}`, ghostHouseFound: 'Bayangan dojo masuk', ghostHouseNote: 'CPU yang bertarung dengan gaya khas dojo. Bukan pemain langsung.', ghostName: (n) => `Bayangan ${n}`, ghostTag: 'Bayangan',
        ghostNote: 'CPU yang bertarung dengan gaya pemain sungguhan ini. Bukan pemain langsung.',
        ghostReady: 'Bayangan sudah siap',
        ghostLeft: 'Kamu keluar dari laga bayangan: kalah.', aiTag: 'AI',
        hallTab: 'Ranked', hallDesc: (g) => `Yang terbaik musim ini · ${g} laga ranked untuk masuk papan`, champs: 'Para Juara', champOf: (n) => `Juara Musim ${n}`,
        noChamps: 'Belum ada juara musim.', me: (p) => `Posisimu: #${p}.`, meNone: 'Mainkan laga ranked untuk masuk papan.', empty: 'Belum ada yang masuk papan musim ini.',
        tierDesc: ['Prajurit kaki', 'Samurai tanpa tuan', 'Samurai', 'Pengawal panji', 'Tuan feodal', 'Shogun'],
        rulesBtn: 'Cara kerja ranked', rulesTitle: 'Cara kerja ranked', rulesSub: 'Tier, poin, dan musim', rTiers: 'Tier', rYou: 'Kamu',
        rNext: (n, name) => `${n} poin lagi ke ${name}`, rTop: 'Kamu di tier tertinggi', rPlacing: (a, b) => `Penempatan ${a}/${b}: tier-mu muncul setelah selesai`,
        rPlacement: 'Penempatan', rPlaceLine: (a, b) => `${a} laga ranked pertamamu menentukan posisimu (${b} di musim-musim berikutnya); setelah itu tier-mu muncul.`,
        rPoints: 'Poin', rPointsLines: ['Menang menambah poin, kalah mengurangi; seri hanya menggeser sedikit.', 'Mengalahkan lawan yang lebih kuat memberi lebih banyak; kalah dari lawan yang lebih lemah mengurangi lebih banyak.', 'Keluar dari laga dihitung kalah.'],
        rSeason: 'Musim', rSeasonLine: (d, left) => `Satu musim berlangsung ${d} hari · ${left}.`,
        rSeasonEnd: (p) => `Di akhir musim, rating-mu bergeser separuh jalan kembali ke 1500 dan kamu main ${p} laga penempatan lagi; tier terbaikmu tetap jadi lencana.`,
        rReward: (list, n) => `Peringkat #1 musim ini mendapat: ${list} (jika minimal ${n} pemain ada di papan).`, rCostumeAll: (x) => `${x} (untuk semua petarung)`, rRewardAny: 'kostum dan gelar spesial',
        rBoard: 'Papan peringkat', rBoardLine: (g) => `Syarat masuk: ${g} laga ranked musim ini dan penempatan selesai.`,
        rFighters: 'Petarung', rFightersLine: 'Kamu bisa memilih petarung yang sudah kamu buka di mode satu pemain.',
        aiNote: 'Saat pemain online sedikit, kamu mungkin dipertemukan dengan lawan AI yang bermain dengan gaya pemain sungguhan.', gotIt: 'Mengerti',
        err: { network: 'Tidak bisa menghubungi server. Periksa koneksi internetmu.', bad_version: 'Versi baru game sudah keluar: muat ulang halaman.', busy: 'Antrean sangat penuh, coba lagi sebentar lagi.',
          rate_limited: 'Terlalu banyak percobaan, tunggu sebentar.', disabled: 'Ranked sedang offline.', banned: 'Akun ini tidak bisa bermain ranked.', other: 'Terjadi kesalahan, coba lagi.' },
      },
    });

    // ================================================================ LEVEL + SHADOW PASS (js/level.js, js/pass.js)
    // English: L.en in js/i18n-pass.js; the on-demand languages keep these texts in their own file.
    merge(EN.STR, {
      pass: {
        k: '影', lv: 'LV',
        level: (n) => `Level ${n}`,
        xp: (a, b) => `${a} / ${b} XP`, xpMax: (n) => `Total ${n} XP`, plus: (n) => `+${n} XP`,
        name: 'Pass Bayangan', season: (n) => `Musim ${n}`, left: (d) => `${d} hari lagi`, lastDay: 'Hari terakhir',
        tier: (t, n) => `Tier ${t}/${n}`, ready: (n) => `${n} siap diambil`,
        free: 'Gratis', bonus: 'Bayangan', bonusAds: 'Tiap hadiah: satu iklan', bonusWait: (n) => `Tanpa iklan: terbuka ${n} tier kemudian`,
        claim: 'Ambil', claimAll: (n) => `Ambil semua (${n})`, owned: 'Diambil', watch: 'Tonton iklan', milestone: 'Gratis', opensAt: (t) => `Di tier ${t}`,
        online: 'Perlu online', soon: 'Tier baru segera hadir', soonXp: 'XP-mu terus dihitung', close: 'Tutup', tabs: { pass: 'Pass', profile: 'Profil' },
        rows: { win: 'Menang', loss: 'Bermain', rounds: 'Ronde', perfect: 'Sempurna', rally: 'Saling balas', counter: 'Serangan balik', parry: 'Tangkisan', short: 'Laga singkat', boost: 'Penguat', daily: 'Menang pertama hari ini', streak: 'Beruntun', clear: 'Perjalanan', trial: 'Tantangan kombo', tutorial: 'Tutorial' },
        streakN: (n) => `hari ke-${n}`,
        up: 'Naik level', got: 'Hadiah baru',
        boostName: (n) => `×1,5 XP · ${n} laga`, honorName: (n) => `+${n} kehormatan`,
        gotDup: (n) => `Sudah kamu punya: sebagai gantinya ×1,5 XP untuk ${n} laga`, boostLeft: (n) => `×1,5 XP · sisa ${n} laga`,
        kinds: { cos: 'Kostum', title: 'Gelar', badge: 'Lencana', frame: 'Bingkai', trail: 'Jejak pedang', boost: 'Penguat XP', honor: 'Kehormatan' },
        use: 'Pakai', inUse: 'Dipakai', none: 'Belum ada', wearHint: 'Pakai kostum di layar pilih petarung, pada baris Warna.',
        heads: { titles: 'Gelar', badges: 'Lencana', frames: 'Bingkai', trails: 'Jejak pedang', costumes: 'Kostum', seals: 'Segel perjalanan' },
        total: (n) => `Total ${n} XP`, streak: (n) => `${n} hari berturut-turut`,
        daily: 'Menang pertama hari ini: +100 XP', dailyDone: 'Menang pertama hari ini: selesai',
        seal: { 1: 'Perjalanan tamat', 2: 'Menkyo: perjalanan tamat 2 kali', 3: 'Kaiden: perjalanan tamat 3 kali' },
        clears: (n) => `Perjalanan tamat ${n}×`,
        next2: 'Tamatkan perjalanan untuk ke-2 kalinya: kostum dan gelar Menkyo', next3: 'Tamatkan untuk ke-3 kalinya: bayangan dan gelar Kaiden',
        rank: { 2: 'Menkyo', 3: 'Kaiden' }, cos2: (n) => `${n} · warna Menkyo`, cos3: (n) => `${n} · bayangan Kaiden`,
        themes: { sakura: 'Sakura', ember: 'Bara', frost: 'Beku', jade: 'Giok', ash: 'Abu', moon: 'Rembulan', lotus: 'Teratai', storm: 'Badai', yami: 'Yami' },
        items: {
          trail_sakura: 'Jejak sakura', trail_ember: 'Jejak bara', trail_frost: 'Jejak beku', trail_jade: 'Jejak giok', trail_violet: 'Jejak ungu', trail_gold: 'Jejak emas',
          title_novice: 'Pedang Pemula', title_wanderer: 'Pengembara', title_duelist: 'Duelis', title_parry: 'Tembok Baja', title_ronin: 'Ronin', title_nightblade: 'Pedang Malam', title_s1: 'Bayangan Musim 1',
          badge_blade: 'Lencana pedang', badge_moon: 'Lencana bulan', badge_fire: 'Lencana api', badge_snow: 'Lencana salju', badge_sakura: 'Lencana sakura', badge_dragon: 'Lencana naga', badge_kage: 'Lencana bayangan',
          frame_bronze: 'Bingkai perunggu', frame_silver: 'Bingkai perak', frame_crimson: 'Bingkai merah', frame_jade: 'Bingkai giok', frame_gold: 'Bingkai emas',
        },
      },
    });

    // ================================================================ 1.3.2 SHADOW PASS: 30 tiers, fight flair, progress rewards,
    // the ranked shield, the Profile screen (English: X.en in js/i18n-pass.js; flair: the fight flair's names, js/flair.js ids)
    merge(EN.STR, {
      pass: {
        kinds2: { pose: 'Pose kemenangan', hitfx: 'Efek pukulan', slash: 'Tebasan balasan', aura: 'Aura ki', ko: 'Penutup KO', card: 'Kartu nama', arena: 'Varian arena', music: 'Musik menu', rkey: 'Kunci', akey: 'Kunci', ticket: 'Tiket', shield: 'Perisai' },
        items2: { key_rival: 'Kunci tantangan', key_arena: 'Kunci arena', ticket_trial: 'Tiket coba', shield: 'Perisai ranked' },
        heads2: { title: 'Gelar', flair: 'Hiasan tarung', arenas: 'Varian arena', music: 'Musik menu', items: 'Barang' },
        profile: 'Profil',
        profileSub: 'Gelar · kostum · hiasan',
        passTab: 'Pass Bayangan',
        tapEquip: 'Ketuk untuk memakai',
        plain: 'Biasa',
        usual: 'Seperti biasa',
        noneYet: 'Didapat dari Pass Bayangan',
        shields: (n, m) => `Perisai ranked ${n}/${m}`,
        shieldHelp: 'Kalah di laga ranked tanpa kehilangan poin; satu per hari, terpakai otomatis.',
        tickets: (n) => `Tiket coba: ${n}`,
        ticketHelp: 'Coba ninja terkunci dalam 3 laga melawan CPU: ketuk ninjanya di layar pilih petarung.',
        useTicket: (n) => `Tiket coba · ${n} laga`,
        useTicketSub: (n) => `Punya ${n}`,
        ticketLeft: (n) => `Coba: sisa ${n} laga`,
        keyRival: (name) => `Tantangan terbuka: ${name}`,
        keyArena: (name) => `Arena terbuka: ${name}`,
        keyHonor: (n) => `Tak ada lagi yang bisa dibuka: +${n} kehormatan`,
        shieldGot: (n, m) => `Perisai ranked: ${n}/${m}`,
        shieldFull: (n) => `Perisai penuh: gantinya +${n} kehormatan`,
        shieldOff: (n) => `Tak ada ranked di sini: gantinya +${n} kehormatan`,
        shieldUsed: 'Perisai terpakai: poin aman',
        rankedHonor: (n) => `+${n} kehormatan`,
        variant: 'Varian',
        flair: { pose_tenchi: 'Angkat ke Langit', pose_rei: 'Hormat Rei', pose_hiza: 'Zanshin Berlutut', pose_katsugi: 'Pedang di Bahu', pose_kissaki: 'Giliranmu Berikutnya', hitfx_kinpaku: 'Pukulan Daun Emas', hitfx_aizome: 'Tinta Nila', hitfx_sakura: 'Ledakan Sakura', hitfx_kitsunebi: 'Api Rubah', hitfx_raijin: 'Percikan Raijin', slash_kin: 'Tebasan Emas', slash_sumi: 'Kuas Sumi', slash_hana: 'Angin Kelopak', slash_rai: 'Tebasan Guntur', aura_kitsunebi: 'Aura Api Rubah', aura_raiun: 'Aura Badai', aura_hana: 'Aura Bunga', aura_gekko: 'Aura Cahaya Bulan', ko_enso: 'Penutup Ensō', ko_hanafubuki: 'Badai Kelopak', ko_raiko: 'Sambaran Petir', ko_mikazuki: 'Bulan Sabit', card_seigaiha: 'Ombak Seigaiha', card_yozakura: 'Sakura Malam', card_ryu: 'Pernis Naga', card_tsukiyo: 'Pinus di Bawah Bulan', card_asanoha: 'Emas Asanoha', arena_temple_snow: 'Kuil Bersalju', arena_rain_moon: 'Bambu di Bawah Bulan', arena_snow_night: 'Puncak Salju di Malam Hari', arena_market_rain: 'Pasar Malam Hujan', music_haru: 'Taman Musim Semi', music_yuki: 'Bulan Salju', music_matsuri: 'Malam Festival', pass1_akane: 'Busana Bayang Bulan' },
      },
    });

    void dec; void fmtTime; void num;
  };

  // ---------------------------------------------------------------- journey texts (js/journey-text.js reads ND.JOURNEY_COPY)
  // Same lists, same order and same counts as the `en` entry in js/journey-text.js (ui 17, goals 10, titles 13, endings 13).
  (ND.JOURNEY_COPY || (ND.JOURNEY_COPY = {}))['id'] = {
    ui: ['Perjalanan karakter', 'Rival terakhir', 'Keahlian opsional', 'Menangkan laga ini untuk mempertahankan bintangnya.', 'Bintang keahlian didapat', 'Bintang tidak didapat · Coba saat main ulang', 'Bintang keahlian', 'Selesaikan perjalanan dengan 6 dari 8 bintang untuk mendapat gelar dan warna Warisan. Bintang tetap tersimpan saat main ulang.', 'Warna asli', 'Warna Warisan', 'Tampilan', 'Raih 6 bintang keahlian dan selesaikan perjalanan karakter ini.', 'Perjalanan dan hadiahmu sebelumnya tetap tersimpan. Main ulang untuk menjelajahi rute baru.', 'Tantangan Shura: selesaikan perjalanan 3 karakter berbeda.', 'Menangkan duel ini untuk membuka', 'Perjalanan selesai', 'Bab'],
    goals: ['Tangkisan', 'Serangan balik kena', 'Serangan berat kena', 'Tendangan kena', 'Serangan udara kena', 'Serangan lesat kena', 'Serangan kombo ke-3', 'Proyektil kena', 'Teknik ki kena', 'Pertahanan dihancurkan'],
    titles: ['Sumpah Merah', 'Angin Bebas', 'Hati Gunung', 'Jejak Musim Dingin', 'Bunga Cahaya Bulan', 'Panji Tak Tumbang', 'Berani Tanpa Topeng', 'Janji Sunyi', 'Harimau Tanpa Rantai', 'Tangan Terbuka', 'Angin Tenang', 'Cakrawala Jauh', 'Fajar Kedua'],
    endings: ['Akane menurunkan pedangnya di hadapan Ren. Sekolahnya akan dibangun kembali lewat ajaran, bukan dendam.', 'Aoi menuntaskan duel lamanya dengan Akane dan meninggalkan kuil sebagai sosok yang setara, bebas memilih jalannya sendiri.', 'Kuro dan Tetsu meletakkan senjata. Jalan gunung kembali terbuka bagi penduduk desa.', 'Yuki menyambut uluran tangan Hana. Untuk pertama kalinya, jejaknya berdampingan dengan jejak orang lain.', 'Hana membawa Yuki kembali ke festival lentera. Tarian terakhirnya punya ruang untuk seorang sahabat.', 'Tetsu meraih rasa hormat Kuro dan menancapkan panjinya di celah gunung: tak ada penduduk desa yang akan ditolak.', 'Ren menembus tipu daya Kage dan melepas topengnya sendiri. Ia tak lagi butuh rasa takut agar didengar.', 'Kage memperlihatkan wajahnya kepada Ren, lalu menghilang. Kali ini janjinya bertahan lebih lama dari bayangannya.', 'Tora meletakkan rantainya di samping tongkat Jin. Penyeberangan sungai itu bukan milik tuan mana pun.', 'Jin menghentikan Tora tanpa merenggut nyawanya. Di air terjun, seorang murid baru meminta pelajaran pertamanya.', 'Mai menangkap panah terakhir Tsubame dengan kipasnya. Persaingan mereka berakhir dengan saling membungkuk, bukan dendam.', 'Tsubame akhirnya bisa membaca angin Mai. Ia menahan panah terakhirnya dan berbalik menuju cakrawala baru.', 'Shura menghadapi Akane tanpa mahkotanya. Kekalahan tak lagi menentukan dirinya; pelajaran berikutnya dimulai saat fajar.'],
  };

  if (ND.i18n && ND.i18n.loaded) ND.i18n.loaded('id');
})(window.ND = window.ND || {});
