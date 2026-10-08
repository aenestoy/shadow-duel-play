(function(ND) {
	"use strict";
	(ND.I18N_CATALOGS || (ND.I18N_CATALOGS = {}))["ja"] = function(I, EN) {
		const merge = I.merge;
		const num = (n) => I.num(n);
		const dec = (x) => I.dec(x);
		const fmtTime = (s) => I.time(s);
		merge(EN.STR, {
			menu: {
				brand: (nc, na) => `忍者${nc}人、ステージ${na}種、そして隠れた達人。リアルタイムの剣戟、鍔迫り合い、パリィ、体勢崩し、気の技、ラグドール物理。`,
				arcade: "アーケード",
				arcadeDesc: "強くなっていく相手を一人ずつ倒そう。最後には隠れた達人が待っている。勝てば新しい忍者とステージが解放される。",
				arcadeProg: (best, c, ct, a, at) => `${best ? "ベスト " + num(best) + " · " : ""}忍者 ${c}/${ct} · ステージ ${a}/${at} 解放`,
				train: "トレーニング",
				trainDesc: "木人で自由に練習、または一歩ずつ学ぼう",
				trainFree: "フリー",
				trainTut: "チュートリアル",
				watchShort: "ランダムな忍者2人、伝説AI",
				specialKey: "気の技（気が満タン）",
				single: "対戦",
				singleDesc: "CPU戦または2人対戦"
			},
			sel: {
				title: {
					"2p": "忍者を選べ",
					cpu: "忍者を選べ",
					arcade: "アーケード · 忍者を選べ",
					train: "トレーニング · 忍者を選べ",
					tutorial: "チュートリアル · 忍者を選べ",
					tourney: "月例大会 · 忍者を選べ",
					dan: "段位審査 · 忍者を選べ"
				},
				who1: {
					"2p": "プレイヤー1 · A / D で選択、F で決定",
					def: "あなた · A / D で選択、F で決定"
				},
				who2: {
					"2p": "プレイヤー2 · ← / → で選択、K で決定",
					cpu: "相手（CPU）· ← / → で選択",
					train: "木人 · ← / → で選択"
				},
				go: {
					def: "対戦開始",
					arcade: "アーケード開始",
					train: "トレーニング開始",
					tutorial: "チュートリアル開始",
					tourney: "大会開始",
					dan: "審査開始"
				},
				random: "ランダム",
				arena: "ステージ",
				locked: "ロック中",
				lockMsg: (name, hint) => `${name}はロック中 · ${hint}`,
				keyHint: "<kbd>Enter</kbd> 開始 · <kbd>⌫</kbd> 戻る"
			},
			hint: {
				wins: (n, cur) => `アーケードで${n}勝する（${Math.min(cur, n)}/${n}）`,
				clear: "アーケードを1回クリア",
				boss: "アーケードで最終ボスを倒す",
				arena: "アーケードでこのステージで1勝する"
			},
			toast: {
				newChar: (name) => `新たな忍者が解放：${name}`,
				newArena: (name) => `新ステージが解放：${name}`,
				newBest: (s) => `ベスト更新：${num(s)} pt`,
				lesson: (t) => `レッスン完了：${t}`,
				tutDone: "チュートリアル完了！",
				perf: "動作を軽くするため画質を下げました"
			},
			vs: {
				stage: (i, n) => `第${i}戦 / ${n}`,
				boss: "最終決戦",
				go: "勝負！",
				quit: "アーケードをやめる",
				keys: "<kbd>Enter</kbd> / <kbd>F</kbd> 開始 · <kbd>⌫</kbd> やめる",
				unknown: "？"
			},
			hud: {
				you: "あなた",
				cpu: "CPU",
				dummy: "木人",
				stage: (i, n) => `${i}/${n}`,
				boss: "最終ボス",
				inf: "∞",
				lockSolo: "F / K を連打！",
				lockDuo: "弱か強を連打！"
			},
			end: {
				rematch: "再戦",
				change: "忍者を変える",
				menu: "メインメニュー",
				winTitle: "見事な勝利！",
				winSub: (i, n, pts) => `第${i}/${n}戦 突破 · +${num(pts)} pt`,
				next: "次の戦いへ",
				bossNext: "最後の戦いへ",
				lossTitle: "敗北",
				lossSub: (name) => `今回は${name}が一枚上手だった。もう一度挑もう。`,
				retry: "リトライ",
				quit: "アーケードをやめる"
			},
			ending: {
				head: "エンディング",
				rows: {
					fights: "戦闘数",
					time: "合計タイム",
					retries: "リトライ",
					perfect: "パーフェクト",
					score: "スコア",
					best: "ベスト"
				},
				newBest: "ベスト更新！",
				menu: "メインメニュー",
				again: "もう一度",
				unlocked: "解放",
				fightPts: "戦闘ポイント",
				bonus: "クリアボーナス"
			},
			score: {
				hud: "スコア",
				rows: {
					hit: "ヒット",
					combo: "コンボ",
					counter: "カウンター",
					defense: "防御",
					pressure: "攻め",
					special: "気の技",
					round: "勝利",
					perfect: "パーフェクト",
					hp: "残りHP",
					time: "タイムボーナス"
				},
				total: "試合スコア",
				diff: (name, m) => `${name} ×${dec(m)} 込み`,
				best: (s) => `自己ベスト：${num(s)}`,
				newBest: "ベスト更新！",
				arcadeTotal: (s) => `アーケード合計：${num(s)}`,
				lossNote: (s, pen) => `この挑戦はカウントされない · アーケード合計 ${num(s)} · リトライごとに −${num(pen)}`,
				clearBonus: (c, n) => `+${num(c)}${n ? " · ノーリトライ +" + num(n) : ""}`,
				lossCpu: "敗北 · ランキングに載るのは勝利のみ",
				cpuBoardHint: "伝説難易度での勝利はランキングに載る"
			},
			lb: {
				menu: "ランキング",
				menuDesc: "アーケードと伝説の記録",
				title: "ランキング",
				back: "戻る",
				boards: {
					arcade: "アーケード",
					cpu_efsane: "伝説CPU"
				},
				boardDesc: {
					arcade: "アーケードをクリアした時の合計スコア",
					cpu_efsane: "伝説CPUに勝った1試合のスコア"
				},
				all: "すべて",
				status: {
					loading: "読み込み中…",
					online: "オンラインランキング",
					readonly: "オンラインランキング · 閲覧のみ",
					local: "ローカルランキング",
					error: "エラー · ローカルランキング",
					offline: "オフライン · ローカルランキング"
				},
				empty: "まだスコアがない。一番乗りを目指そう！",
				loadErr: "ランキングを読み込めなかった。",
				you: "あなた",
				youTag: "あなた",
				player: "プレイヤー",
				nick: "ニックネーム",
				nickPh: "ニックネームを入力",
				nickSave: "保存",
				nickEdit: "変更",
				nickAsk: "ローカルランキング用のニックネーム：",
				saving: "保存中…",
				savedOnline: (r) => `オンライン順位：${r}位`,
				savedOnlineNoRank: "オンラインランキングに保存した",
				savedOnlineAll: (r) => `オンライン歴代順位：${r}位`,
				platSignIn: "ログインするとスコアがオンラインに載る",
				platPending: "この端末に保存 · ログインするとオンラインランキングに載る",
				savedOnlineGap: (r, g) => `オンライン順位：${r}位 · トップ10まであと${g} pt`,
				reason: {
					needName: "オンラインランキングに参加するにはニックネームを決めよう",
					offline: "接続なし — スコアは保存済み、オンラインに戻ったら送信される",
					rate: "送信が多すぎる — スコアはまもなく送信される",
					daily: "1日の送信上限に達した — スコアはこの端末にのみ保存",
					week: "今月は終了した — このスコアは新しい月にはカウントされない",
					invalid: "無効なスコア"
				},
				nickErr: {
					nick_length: "ニックネームは3〜16文字にしよう",
					nick_chars: "使えるのは文字・数字・スペースと _ . - のみ（文字を1つ以上）",
					nick_bad: "そのニックネームは使えない。別のものにしよう",
					rate_limited: "少し待ってからもう一度試そう"
				},
				nickErrDef: "ニックネームを保存できなかった",
				nickAskOnline: "オンラインランキング用のニックネーム：",
				savedLocal: (r) => r ? `ローカルランキング ${r}位` : "ローカルランキングに保存した",
				rejected: "スコアを保存できなかった — ローカルランキングのみ",
				quota: "オンラインランキングが満杯 — スコアはこの端末にのみ保存",
				open: "ランキング",
				keys: "<kbd>←</kbd> <kbd>→</kbd> 表 · <kbd>↑</kbd> <kbd>↓</kbd> 忍者 · <kbd>⌫</kbd> 戻る"
			},
			bz: {
				back: "戻る",
				toMenu: "メインメニュー",
				you: "あなた",
				youTag: "あなた",
				newBest: "ベスト更新！",
				seeResult: "結果を見る",
				resetIn: "リセットまで",
				left: (ms) => {
					const t = Math.floor(ms / 1e3), d = Math.floor(t / 86400), hh = Math.floor(t % 86400 / 3600), mm = Math.floor(t % 3600 / 60), ss = t % 60;
					return d ? `${d}日${hh}時間${mm}分` : hh ? `${hh}時間${mm}分` : `${mm}分${ss}秒`;
				},
				leftShort: (ms) => {
					const t = Math.floor(ms / 6e4), d = Math.floor(t / 1440), hh = Math.floor(t % 1440 / 60), mm = t % 60;
					return d ? `${d}日${hh}時間` : hh ? `${hh}時間${mm}分` : `${mm}分`;
				},
				weekName: (m, y) => `${y}年${[
					"1月",
					"2月",
					"3月",
					"4月",
					"5月",
					"6月",
					"7月",
					"8月",
					"9月",
					"10月",
					"11月",
					"12月"
				][m - 1] || m}`,
				monthName: (m) => [
					"1月",
					"2月",
					"3月",
					"4月",
					"5月",
					"6月",
					"7月",
					"8月",
					"9月",
					"10月",
					"11月",
					"12月"
				][m - 1] || String(m),
				rank: (r) => r <= 0 ? "段位なし" : r <= 10 ? `Kyu ${11 - r}` : `Dan ${r - 10}`,
				fightOf: (i, n) => `第${i}/${n}戦`,
				hpBonus: (p) => `敵HP +${p}%`,
				mirrorOpp: "ミラー · 自分と同じ忍者",
				suddenSub: "1ラウンド · 先に倒れたら負け",
				rows: {
					fights: "勝利数",
					time: "タイム",
					fightPts: "戦闘ポイント",
					stage: "勝ち抜きボーナス",
					clear: "クリアボーナス",
					total: "大会スコア",
					weekBest: "今月の自己ベスト"
				},
				mods: {
					rally2x: {
						n: "応酬の炎",
						d: "カウンターのダメージ×2"
					},
					fullKi: {
						n: "気全開",
						d: "毎ラウンド気が満タンで始まる"
					},
					sudden: {
						n: "サドンデス",
						d: "1ラウンドのみ。両者HP半分で開始"
					},
					mirror: {
						n: "ミラー",
						d: "相手は自分と同じ忍者"
					},
					parryOnly: {
						n: "カウンター勝負",
						d: "通常攻撃のダメージ25%、カウンター×1.5"
					},
					posture2x: {
						n: "体勢崩し",
						d: "体勢ダメージ×2：ガードがすぐ崩れる"
					},
					shuriken3x: {
						n: "手裏剣の嵐",
						d: "手裏剣が3倍"
					},
					kiRush: {
						n: "気の奔流",
						d: "気が2倍の速さで溜まる"
					},
					glass: {
						n: "硝子の刃",
						d: "全ダメージ×1.5"
					}
				},
				menu: {
					tour: "月例大会",
					dan: "段位審査",
					hall: "王者の殿堂",
					tourRank: (p, left) => `今月：${p}位 · リセットまで${left}`,
					tourBest: (b, left) => `自己ベスト ${b} · リセットまで${left}`,
					tourNew: (left) => `全員同じ8戦 · リセットまで${left}`,
					danRank: (name, next) => next ? `段位：${name} · 次：${next}` : `段位：${name} · 頂点に到達`,
					danNew: "Kyu 10 から Dan 10 まで全20審査",
					hallRank: (p) => `今月 ${p}位 · 記録`,
					hallDesc: "今月のトップ10と歴代記録",
					nick: (n) => n ? `ニックネーム：${n}` : "ニックネームを決めよう",
					champTitle: "今月のトップ10",
					champLocal: "この端末のトップ10",
					champEmpty: "今月の表に一番乗りしよう",
					champLoading: "上位者を読み込み中…",
					champAll: "歴代トップ10",
					champAllEmpty: "オンラインの表に一番乗りしよう",
					champLast: (n) => `先月の王者：${n}`,
					champOpen: "月間ランキングを開く"
				},
				t: {
					title: "月例大会",
					head: "大会",
					runNote: (s, st) => `大会合計：${num(s)}（1勝ごとに +${num(st)} 込み）`,
					lossSub: (name, won) => `${name}に挑戦を阻まれた · ${won}勝`,
					lossNote: (s) => `この戦いはカウントされない · 大会スコア ${num(s)}`,
					quit: "大会を終える",
					myBest: (b, a) => `今月の自己ベスト：${b} pt · 挑戦${a}回`,
					noTry: "今月はまだ挑戦していない。",
					place: (p, t) => t ? `${p}位 / ${t}人` : `${p}位`,
					rules: (n, clear, stage) => `全${n}戦。相手・ステージ・ルールは全員共通。1敗で挑戦終了。挑戦は何度でもでき、最高記録が残る。1勝ごとに +${stage}、全勝で +${clear}。`,
					start: "忍者を選んで始めよう",
					again: "もう一度",
					go: "大会に挑む",
					clearTitle: "大会制覇",
					overTitle: "挑戦終了",
					savedToast: (s) => `大会スコアを保存：${s}`
				},
				d: {
					title: "段位審査",
					head: "段位審査",
					sub: "審査に合格するたびに段位が上がる。段位はランキングで名前の横に表示される。",
					trialOf: (n) => `${n} 審査`,
					runNote: (i, n) => `審査：${i}/${n}勝`,
					lossSub: (name) => `${name}に審査を阻まれた。`,
					lossNote: "審査不合格",
					quit: "審査をやめる",
					yourRank: "あなたの段位",
					bestWas: (n) => `最高：${n}`,
					ladder: "段位一覧",
					nextTrial: (n) => `次：${n} 審査`,
					fights: (n) => `${n}戦`,
					bossLast: "最終戦：Shura",
					strikes: (left, max) => `残り機会：${left}/${max} · ${max}回不合格で段位が1つ下がる`,
					safe: "この段位では、不合格でも段位は下がらない。",
					maxed: "頂点：Dan 10",
					maxedSub: "Dan の表の頂点にあなたの名が刻まれた。",
					start: "忍者を選んで審査に挑もう",
					next: "次の審査",
					go: "審査に挑む",
					promoted: (n) => `昇段：${n}`,
					demoted: (n) => `降段：${n}`,
					failed: "審査不合格",
					promotedSub: (a, b) => `${a} → ${b}`,
					demotedSub: "3回不合格。また登り直そう！",
					tryAgain: "もう一度挑もう。段位は下がらない。",
					toast: (n) => `新しい段位：${n}`,
					leftToast: "審査を放棄：不合格扱い"
				},
				hall: {
					title: "王者の殿堂",
					tabs: {
						week: { n: "今月" },
						alltime: { n: "歴代" },
						archive: { n: "王者" },
						chars: { n: "忍者" },
						dan: { n: "段位" }
					},
					desc: {
						alltime: "月例大会の歴代ベスト",
						archive: "終わった月のトップ10がここに永遠に刻まれる",
						chars: "忍者ごとの記録保持者 · 忍者をタップでトップ20",
						dan: "最高段位"
					},
					loading: "読み込み中…",
					error: "ランキングを読み込めなかった。",
					retry: "もう一度",
					empty: "まだ誰もいない。一番乗りを目指そう！",
					emptyDan: "まだ段位を持つプレイヤーはいない。",
					emptyArchive: "まだ終わった月はない。称号は2026年10月の大会から始まり、11月1日の終了時に王者の名が刻まれる。",
					emptyArchiveLocal: "この端末にはまだ終わった月がない。",
					anon: "プレイヤー",
					meTop: (p, s) => `あなた：${p}位 · ${s} pt · トップ10入り！`,
					meGap: (p, g, s) => `あなた：${p}位 · ${s} pt · トップ10まであと${g} pt`,
					meNone: "今月はまだスコアがない。",
					meDan: (p, n) => `あなた：${p}位 · ${n}`,
					meDanLocal: (n) => `あなたの段位：${n}`,
					meNoDan: "まだ段位がない。最初の審査：Kyu 10。",
					noRecord: "記録なし",
					allNinjas: "全忍者",
					pending: (n) => `送信待ちの記録：${n}`,
					classic: "アーケード · 伝説の表"
				},
				ttl: {
					champ: "月間王者",
					finalist: "入賞者",
					reward: "2026年10月の大会から、毎月のトップ3は永久の称号を得る。王者はさらに、使った忍者の限定「王者カラー」も手に入れる。称号にはその月に5人以上の参加が必要。",
					hall: "2026年10月から：毎月トップ3に永久の称号（5人以上）· 王者には王者カラー",
					local: "大会スコアはこの端末に保存される。",
					colors: "王者カラー",
					how: "この忍者で月例大会に優勝する",
					unlocked: (name) => `月間王者！${name}の王者カラーが解放`,
					newTitle: (t) => `新しい称号：${t}`
				}
			},
			train: {
				title: "トレーニング",
				tutTitle: "チュートリアル",
				dummy: "木人",
				beh: {
					idle: "棒立ち",
					guard: "ガード",
					attack: "攻撃",
					counter: "カウンター"
				},
				infHp: "HP無限",
				fullKi: "気満タン",
				reset: "位置リセット",
				hide: "隠す",
				show: "パネル",
				moves: "技表",
				lessons: "レッスン",
				lessonOf: (i, n) => `レッスン ${i}/${n}`,
				done: "チュートリアル完了！木人を好きに設定して、自由に練習しよう。",
				progress: (a, b) => `${a}/${b}`,
				keysHelp: "<kbd>1</kbd>–<kbd>4</kbd> 木人 · <kbd>⌫</kbd> リセット · <kbd>H</kbd> パネル",
				specialFallback: {
					kanji: "影斬り",
					name: "Kagegiri",
					desc: "相手を一瞬で斬り抜ける稲妻の一太刀。",
					tip: ""
				},
				kiFull: "気満タン",
				counterTip: "対処法"
			},
			moves: [
				[
					"<kbd>A</kbd><kbd>D</kbd>",
					"歩く",
					"2回押し：ダッシュ"
				],
				[
					"<kbd>W</kbd>",
					"ジャンプ",
					""
				],
				[
					"<kbd>F</kbd><kbd>F</kbd><kbd>F</kbd>",
					"斬り×3コンボ",
					"3発目で押し返す"
				],
				[
					"<kbd>G</kbd>",
					"強斬り",
					"ダウンを奪う"
				],
				[
					"<kbd>R</kbd>",
					"蹴り",
					"ガードを圧迫、体勢を削る"
				],
				[
					"<kbd>S</kbd>+<kbd>R</kbd>",
					"足払い",
					"倒す · ジャンプでかわす"
				],
				[
					"後+<kbd>R</kbd>",
					"後ろ回し蹴り",
					"遅いが強い、ガードを崩す"
				],
				[
					"前+<kbd>R</kbd>",
					"小手蹴り",
					"振りかぶりに当てると武器を落とす"
				],
				[
					"<kbd>W</kbd>›<kbd>R</kbd>",
					"飛び蹴り",
					"空中で"
				],
				[
					"←→+<kbd>R</kbd>",
					"固有の蹴り",
					"忍者ごとに一つ"
				],
				[
					"<kbd>R</kbd>",
					"蹴り上げ",
					"素手で自分の刀のそば"
				],
				[
					"<kbd>T</kbd>",
					"手裏剣",
					""
				],
				[
					"<kbd>Shift</kbd>",
					"ダッシュ",
					"左Shift"
				],
				[
					"<kbd>Shift</kbd>›<kbd>F</kbd>",
					"ダッシュ斬り",
					""
				],
				[
					"<kbd>W</kbd>›<kbd>F</kbd>",
					"空中斬り",
					""
				],
				[
					"<kbd>W</kbd>›<kbd>G</kbd>",
					"急降下",
					"空中で強"
				],
				[
					"<kbd>S</kbd>",
					"ガード",
					"押しっぱなし"
				],
				[
					"<kbd>S</kbd>!",
					"パリィ",
					"攻撃が当たる直前に押す"
				],
				[
					"<kbd>F</kbd>",
					"返し斬り",
					"ガード／パリィの後"
				],
				[
					"前+<kbd>F</kbd>",
					"足払い",
					"カウンター · 足元へ"
				],
				[
					"後+<kbd>F</kbd>",
					"裏回り",
					"カウンター · 相手の背後へ"
				],
				[
					"<kbd>G</kbd>",
					"強カウンター",
					"カウンター · ダウンを奪う"
				],
				[
					"応酬",
					"応酬",
					"カウンターを防いで返す。3回目のカウンターがとどめになる"
				],
				[
					"<kbd>F</kbd>/<kbd>G</kbd>!!",
					"鍔迫り合い",
					"鍔迫り合い中に連打で押し返す"
				]
			],
			touch: {
				btn: {
					light: "攻撃",
					heavy: "強攻撃",
					kick: "蹴り",
					guard: "▼",
					dodge: "ダッシュ",
					throw: "手裏剣",
					special: "気",
					up: "ジャンプ",
					down: "ガード"
				},
				lock: "攻撃を連打！",
				replaySkip: "タップでスキップ",
				rotateTitle: "画面を横向きにしよう",
				rotateText: "Shadow Duel は横画面で遊ぶゲーム。メニューは縦画面でも使える。",
				rotMenu: "メインメニュー",
				need2p: "キーボード／ゲームパッドが必要",
				need2pToast: "2人で遊ぶにはキーボードかゲームパッドをつなごう",
				hints: "ヒント",
				pause: "ポーズ",
				sel: {
					who1: "あなた · 忍者をタップ",
					who2: "相手（CPU）· タップで選択",
					who2train: "木人 · タップで選択"
				},
				opt: {
					title: "タッチ操作",
					layout: "配置",
					simple: "シンプル",
					full: "フル",
					size: "サイズ",
					sizes: {
						s: "小",
						m: "中",
						l: "大"
					},
					hand: "ボタン",
					right: "右",
					left: "左",
					assist: "操作アシスト",
					haptic: "振動",
					fullscreen: "全画面",
					exitFullscreen: "全画面を終了",
					note: "シンプル：大きなボタン4つ。フル：蹴りと手裏剣が加わる。操作アシスト：攻撃を押しっぱなしでコンボが続き、▼を軽くタップするだけでパリィに間に合う。タッチ操作を楽にするだけで、ルールとスコアは全員同じ。",
					fullNote: "蹴りと手裏剣のボタンはフル配置にある（設定 → 操作）。"
				},
				help: "<div class=\"th-grid\">" + "<div><h3>十字キー</h3><dl>" + "<dt><i class=\"tb\">◀ ▶</i></dt><dd>長押し：歩く</dd>" + "<dt><i class=\"tb\">▲</i></dt><dd>タップ：ジャンプ</dd>" + "<dt><i class=\"tb tb-guard\">▼</i></dt><dd>押しっぱなし：ガード。当たる直前にタップ：パリィ</dd>" + "<dt><i class=\"tb\">▶▶</i></dt><dd>2回タップ：ダッシュ</dd>" + "</dl></div>" + "<div><h3>ボタン</h3><dl>" + "<dt><i class=\"tb tb-light\">攻撃</i></dt><dd>斬る。連続タップ：コンボ。前か後ろに倒しながらタップ：別の技</dd>" + "<dt><i class=\"tb\">強攻撃</i></dt><dd>強斬り。前＋強攻撃で相手を打ち上げる</dd>" + "<dt><i class=\"tb\">ダッシュ</i></dt><dd>ダッシュ（◀ ▶ を押している向きへ、なければ後ろへ）</dd>" + "<dt><i class=\"tb ki\">気</i></dt><dd>気の技：気が満タンになるとボタンが光る</dd>" + "<dt><i class=\"tb\">蹴り</i> <i class=\"tb\">手裏剣</i></dt><dd>フル配置：蹴りと手裏剣</dd>" + "</dl></div></div>",
				note: "ボタンは同時押しできる：<i class=\"tb tb-guard\">▼</i>を押しっぱなしでガードしつつ、もう一方の親指で<i class=\"tb tb-light\">攻撃</i>をタップ。画面上の<b>II</b>でポーズ。配置・サイズ・左手用の設定は<b>設定</b>にある。キーボードやゲームパッドを使うと、操作は自動で切り替わる。",
				keysHelp: ""
			},
			movesTouch: [
				[
					"<i class=\"tb\">◀ ▶</i>",
					"歩く",
					"長押し · 2回タップ：ダッシュ"
				],
				[
					"<i class=\"tb\">▲</i>",
					"ジャンプ",
					"タップ"
				],
				[
					"<i class=\"tb tb-light\">攻撃</i>×3",
					"3連コンボ",
					"連続タップ。3発目で押し返す"
				],
				[
					"<i class=\"tb\">強攻撃</i>",
					"強斬り",
					"ダウンを奪う"
				],
				[
					"<i class=\"tb\">蹴り</i>",
					"蹴り",
					"ガードを圧迫、体勢を削る · フル配置"
				],
				[
					"<i class=\"tb tb-guard\">▼</i>" + "+" + "<i class=\"tb\">蹴り</i>",
					"足払い",
					"倒す · ジャンプでかわす"
				],
				[
					"後+" + "<i class=\"tb\">蹴り</i>",
					"後ろ回し蹴り",
					"遅いが強い、ガードを崩す"
				],
				[
					"前+" + "<i class=\"tb\">蹴り</i>",
					"小手蹴り",
					"振りかぶりに当てると武器を落とす"
				],
				[
					"<i class=\"tb\">▲</i>" + "›" + "<i class=\"tb\">蹴り</i>",
					"飛び蹴り",
					"空中で"
				],
				[
					"←→+" + "<i class=\"tb\">蹴り</i>",
					"固有の蹴り",
					"忍者ごとに一つ"
				],
				[
					"<i class=\"tb\">蹴り</i>",
					"蹴り上げ",
					"素手で自分の刀のそば"
				],
				[
					"<i class=\"tb\">手裏剣</i>",
					"手裏剣",
					"フル配置"
				],
				[
					"<i class=\"tb\">ダッシュ</i>",
					"ダッシュ",
					""
				],
				[
					"<i class=\"tb\">ダッシュ</i>›<i class=\"tb tb-light\">攻撃</i>",
					"ダッシュ斬り",
					""
				],
				[
					"<i class=\"tb\">▲</i>›<i class=\"tb tb-light\">攻撃</i>",
					"空中斬り",
					""
				],
				[
					"<i class=\"tb\">▲</i>›<i class=\"tb\">強攻撃</i>",
					"急降下",
					"空中で強攻撃"
				],
				[
					"<i class=\"tb tb-guard\">▼</i>",
					"ガード",
					"押しっぱなし"
				],
				[
					"<i class=\"tb tb-guard\">▼</i>!",
					"パリィ",
					"攻撃が当たる直前にタップ"
				],
				[
					"<i class=\"tb tb-light\">攻撃</i>",
					"返し斬り",
					"ガード／パリィの後"
				],
				[
					"前+<i class=\"tb tb-light\">攻撃</i>",
					"足払い",
					"カウンター · 足元へ"
				],
				[
					"後+<i class=\"tb tb-light\">攻撃</i>",
					"裏回り",
					"カウンター · 相手の背後へ"
				],
				[
					"<i class=\"tb\">強攻撃</i>",
					"強カウンター",
					"カウンター · ダウンを奪う"
				],
				[
					"応酬",
					"応酬",
					"カウンターを防いで返す。3回目のカウンターがとどめになる"
				],
				[
					"<i class=\"tb tb-light\">攻撃</i>!!",
					"鍔迫り合い",
					"鍔迫り合い中に攻撃を連打して押し返す"
				]
			],
			moveSpecialTouch: "<i class=\"tb ki\">気</i>",
			moveTags: {
				normal: "通常",
				command: "コマンド",
				string: "連続技",
				launcher: "打ち上げ",
				juggle: "追撃",
				air: "空中",
				dash: "ダッシュ",
				strike: "打撃",
				counter: "カウンター",
				catch: "当て身",
				feint: "フェイント",
				guardCrush: "ガード崩し",
				knockdown: "ダウン",
				kiCancel: "気キャンセル",
				special: "気の技",
				throw: "飛び道具"
			},
			lessonsTouch: {
				walk: "<i class=\"tb\">◀</i>と<i class=\"tb\">▶</i>を押しっぱなしにして前後に歩こう。",
				combo: "<i class=\"tb tb-light\">攻撃</i>を3回続けてタップ。3連斬りを木人に当てよう。",
				heavy: "<i class=\"tb\">強攻撃</i>で強斬りを当てよう。遅いけど、ダウンを奪える。",
				gbreak: "木人がガードしている。<i class=\"tb\">強攻撃</i>を当てて体勢ゲージを溜め、ガードを崩そう（フル配置の<i class=\"tb\">蹴り</i>ならもっと早く溜まる）。",
				block: "木人が攻撃してくる。<i class=\"tb tb-guard\">▼</i>を押しっぱなしにして斬撃を防ごう。",
				parry: "攻撃が当たる直前に<i class=\"tb tb-guard\">▼</i>をタップ。青い輪が縮みきる瞬間がベストタイミング。",
				counter: "ガードやパリィの直後に<i class=\"tb tb-light\">攻撃</i>：返し斬り。前／後＋<i class=\"tb tb-light\">攻撃</i>や<i class=\"tb\">強攻撃</i>も試そう。",
				special: "気ゲージが満タンだ。光っている<i class=\"tb ki\">気</i>ボタンで{sp}を放とう。"
			},
			lessons: [
				{
					id: "walk",
					t: "歩く",
					d: "<kbd>A</kbd> / <kbd>D</kbd> で前後に歩こう。"
				},
				{
					id: "combo",
					t: "3連コンボ",
					d: "<kbd>F</kbd> <kbd>F</kbd> <kbd>F</kbd> で斬りを3回つなげて木人に当てよう。"
				},
				{
					id: "heavy",
					t: "強斬り",
					d: "<kbd>G</kbd> で強斬りを当てよう。遅いけど、ダウンを奪える。"
				},
				{
					id: "gbreak",
					t: "ガード崩し",
					d: "木人がガードしている。<kbd>R</kbd> で蹴って体勢ゲージを溜め、ガードを崩そう。"
				},
				{
					id: "block",
					t: "ガード",
					d: "木人が攻撃してくる。<kbd>S</kbd> を押しっぱなしにして斬撃を防ごう。"
				},
				{
					id: "parry",
					t: "パリィ",
					d: "攻撃が当たる直前に <kbd>S</kbd> を押そう。青い輪が縮みきる瞬間がベストタイミング。"
				},
				{
					id: "counter",
					t: "カウンター",
					d: "ガードやパリィの直後に <kbd>F</kbd>：返し斬り。前／後＋<kbd>F</kbd> や <kbd>G</kbd> も試そう。"
				},
				{
					id: "rally",
					t: "応酬",
					d: "木人も反撃してくる。攻撃して、相手のカウンターを防いでまた返そう。自分の返し技2回で2×に到達しよう。"
				},
				{
					id: "special",
					t: "気の技",
					d: "気ゲージが満タンだ。<kbd>E</kbd> で{sp}を放とう。"
				}
			]
		});
		merge(EN.STR, {
			talk: {
				akane: {
					open: [
						"我が刃は紅、我が心に曇りなし。正々堂々と来い。",
						"まず礼、それから斬る。それが筋というもの。",
						"この勝負は誇りを懸けたもの。退く道はない。"
					],
					reply: [
						"見事な相手だ……我が刃を受けるに値する。",
						"鋭い言葉だな。その刃も同じく鋭いか、見せてもらおう。",
						"紅の刃が語るとき、言葉は沈黙する。"
					],
					boss: "師匠たちはお前の刃に倒れた、Shura。今日、その借りを返す。"
				},
				aoi: {
					open: [
						"風は決して急がない。私もだ。",
						"己の息を聴け。最後に聞く音は、風の音だ。",
						"竹はしなっても折れはしない。お前はどちらだ？"
					],
					reply: [
						"落ち着け。怒りは刃を重くする。",
						"風は捕まえられない。ただ感じるだけだ。",
						"よかろう。木の葉が地に落ちたら始めよう。"
					],
					boss: "嵐の目でさえ静かなものだ。お前の内には雑音しかない、Shura。"
				},
				kuro: {
					open: [
						"山は動かぬ。動くのはお前だ。",
						"話は要らん。刀を抜け。",
						"小さいな。すぐ終わる。"
					],
					reply: [
						"ふん。来い。",
						"口数が多い。",
						"俺の野太刀は長い。気は短い。"
					],
					boss: "Shura。長く待った。もう話すことはない。"
				},
				yuki: {
					open: [
						"雪は音もなく降る。私の太刀もね。",
						"狐は罠にかからない。仕掛ける側よ。",
						"寒い？　すぐに何も感じなくなるわ。"
					],
					reply: [
						"血の気が多いのね。それが足を鈍らせる。",
						"うるさい……雪まで恥ずかしがってるわ。",
						"瞬きしないで。見逃すわよ。"
					],
					boss: "みんなあなたを恐れてる、Shura。私はちょっと肌寒いだけ。"
				},
				hana: {
					open: [
						"一緒に踊る？　でもリードはあたしね！",
						"桜が散りきる前に終わらせてあげる、約束！",
						"短刀が二本に笑顔がひとつ。どっちが怖い？"
					],
					reply: [
						"もう、真面目すぎ！　ちょっと笑いなよ、きれいに倒れられるから。",
						"捕まえられるものならどうぞ！",
						"はいはい！　でも後で泣かないでよね。"
					],
					boss: "あなたって全然笑わないの、Shura？　さあ、最後のダンスにしよっ！"
				},
				tetsu: {
					open: [
						"務めのため参った。退くか、倒れるか選べ。",
						"この鎧は百の戦を見てきた。お前は百一番目だ。",
						"勇気の前に規律あり。お見せしよう。"
					],
					reply: [
						"無礼者め。正してくれよう。",
						"その言葉では我が鎧は貫けぬ。",
						"覚悟せよ。我が薙刀は予告せぬ。"
					],
					boss: "お前は我が主君の城を焼いた、Shura。今日、務めを果たす。"
				},
				ren: {
					open: [
						"はっ！　やっと面白くなってきた！　骨は丈夫か？",
						"面にビビったか？　素顔は見ない方がいいぜ！",
						"頭かガードか？　どっちも砕いてやる！"
					],
					reply: [
						"口だけかよ！　かかってこい！",
						"へっ、気に入ったぜ。それでもぶちのめすけどな。",
						"俺の蹴りを見たことあるか？　今から見せてやる！"
					],
					boss: "お前が本物の鬼ってわけか？　どっちの角が硬いか勝負だ！"
				},
				kage: {
					open: [
						"見えているつもりか。見えているのは影だけだ。",
						"光が強いほど、影は深い。",
						"お前の名はすでに記されている。私はそれを読むだけだ。"
					],
					reply: [
						"喋るな。影が聞いている。",
						"振り返るな。もう背後にいる。",
						"うるさすぎる。静寂の方が速く斬る。"
					],
					boss: "影は主を持たぬ、Shura。お前もいずれ呑み込まれる。"
				},
				shura: {
					open: [
						"お前は七本の刃を折った。八本目は我がもの。それがお前を折る。",
						"お前の魂が我を呼んだ。よくここまで登ってきた。その分、落ちる時は派手になる。",
						"我こそ道の果て。跪け。"
					],
					reply: [
						"弱さの匂いがする。ここまで漂ってくるぞ。",
						"お前はただの踏み台だ。",
						"跪け。さもなくば倒れろ。"
					],
					boss: "鏡の中の鬼か……二人は多すぎる。"
				},
				tora: {
					open: [
						"俺の鎖にぶら下がった奴はもう数えきれねえ。お前もその一人だ。",
						"狩りの始まりだ。逃げたきゃ逃げろ。だが俺の鎖は長いぜ。",
						"虎は待ち伏せするって？　俺は違うぜ！"
					],
					reply: [
						"グルル……いいぞ。逃げない獲物は好きだ。",
						"近づかなくていい。こっちから手繰り寄せてやる。",
						"口上が長いな。俺の鎖はもっと長いぜ。"
					],
					boss: "お前もただの獲物だ、Shura。ちょいとでかいだけのな。"
				},
				jin: {
					open: [
						"血を流しに来たのではない。しばし眠ってもらうだけです。",
						"棒は辛抱強く語る。耳を傾けなさい。",
						"若き武人よ、その道は怒りに満ちている。荷を軽くしてあげましょう。"
					],
					reply: [
						"よろしい。ですが、終わったら茶を共にしましょう。",
						"その怒りはあなたを重くしている。拙僧が背負いましょう。",
						"刀は斬り、棒は目覚めさせる。"
					],
					boss: "Shura、内なる鬼を倒すのに、あなたを滅ぼす必要はない。止めれば十分です。"
				},
				mai: {
					open: [
						"舞台は整い、幕は上がったわ。あなたの役は、負ける役。",
						"私の扇が開いたら、目を閉じないで。見せ場を見逃すわよ。",
						"私の一歩一歩が音色。その拍子についてこられる？"
					],
					reply: [
						"なんて品のない登場。まあいいわ、優雅さなら二人分あるもの。",
						"風は私の味方よ、あなた。",
						"拍手はいらないわ。あなたが倒れれば十分。"
					],
					boss: "Shura、この最後の舞では、誰とも舞台を分け合わないわ。"
				},
				tsubame: {
					open: [
						"この間合いこそ、私の武器。",
						"燕は一度外す。二度目は、身を翻して突く。",
						"風は読んだ。私の矢は道を知っている。"
					],
					reply: [
						"近づきたい？　やってみなさい。",
						"息を止めて。飛ぶ矢は音を立てない。",
						"私の目はあなたを捉えている。矢もね。"
					],
					boss: "Shura、空に隠れる場所はない。私の矢があなたを見つける。"
				}
			},
			pairs: {
				"akane|aoi": [["akane", "Aoi！　やり残した勝負に決着をつける時だ。"], ["aoi", "風はいつも同じ炎へ吹くものだ、Akane。始めよう。"]],
				"kuro|tetsu": [["kuro", "鉄の殻か。中身が空か確かめてやる。"], ["tetsu", "山でさえ規律には頭を垂れるものだ、Kuro。"]],
				"hana|yuki": [["yuki", "花は雪の中で枯れるのよ、Hana。"], ["hana", "じゃあ雪を溶かしちゃえばいいよね、Yuki！"]],
				"kage|ren": [["ren", "影の小細工なんか効かねえ！　姿を見せろ！"], ["kage", "ここにいるぞ、鬼。見方を知らぬだけだ。"]],
				"akane|ren": [["akane", "面の陰に隠れるのは、恥を知らぬ者だけだ。"], ["ren", "誇り？　誇りじゃ腹は膨れねえんだよ！"]],
				"aoi|yuki": [["aoi", "冷たい風も風に変わりはない、Yuki。"], ["yuki", "でも風がやんでも、雪は残るのよ。"]],
				"kuro|tora": [["tora", "山だと？　虎だって山に住んでるぜ。"], ["kuro", "虎は山で死ぬ。"]],
				"tora|yuki": [["tora", "狐か！　虎を前にして狐はどうする？"], ["yuki", "逃げる。それから虎の尻尾を凍らせるの。"]],
				"jin|tora": [["tora", "俺の鎖がその棒に巻きついたらどうする、坊さん？"], ["jin", "ほどくまでです。結び目をほどくのが拙僧の務め。"]],
				"jin|ren": [["ren", "坊主か？　念仏でも唱えてな、ハゲ！"], ["jin", "もう唱えていますよ、鬼よ。あなたのために。内なる炎はあなた自身も焼いている。"]],
				"jin|tetsu": [["tetsu", "坊主が戦場に何の用だ？"], ["jin", "あなたのような鎧をまとった心のために来たのです、Tetsu。鎧は重い。だが心はもっと重い。"]],
				"akane|jin": [["akane", "どけ、坊主。この仇討ちは私のものだ。"], ["jin", "仇討ちは鎖です、Akane。まずはそれを断ち切りましょう。"]],
				"hana|mai": [["hana", "わあ、踊り子仲間！　どっちが速く回れるか勝負！"], ["mai", "速さは優雅さの影にすぎないわ、Hana。光を見せてあげる。"]],
				"kage|mai": [["mai", "影も踊るのかしら、Kage？"], ["kage", "光が消えた時だけな。"]],
				"aoi|tsubame": [["tsubame", "あなたの風で私の矢を逸らせる、Aoi？"], ["aoi", "風は誰の味方もしない、Tsubame。お前の矢の味方もだ。"]],
				"kage|tsubame": [["kage", "見えぬものは射抜けぬぞ、弓使い。"], ["tsubame", "影は光と共に来る。私もね。"]],
				"mai|tsubame": [["mai", "遠くから見つめるなんて失礼よ、弓使いさん。近くでご覧なさい。"], ["tsubame", "あなたの舞台は、私の矢に近くで見てきてもらうわ。"]]
			},
			endings: {
				akane: [
					"Shuraの刀が地を打った時、寺の鐘がひとりでに鳴った。",
					"Akaneは紅の刃を拭い、師匠たちの墓前に頭を下げた。借りは返した。",
					"この先の道は、もう仇討ちではない。新しい弟子たちに誇りを教える道だ。"
				],
				aoi: [
					"Shuraが倒れると嵐は静まり、何年ぶりかで雲が割れた。",
					"Aoiは刃を納め、竹林へと帰っていった。",
					"後に残ったのは、吹き抜ける風の音だけだった。"
				],
				kuro: [
					"KuroはShuraの割れた面を山頂に埋めた。",
					"言葉はひとつもなかった。Kuroは笠を目深にかぶり、雪の中へ消えた。",
					"村人たちは言う。その冬、山から下りてきた山賊は一人もいなかったと。"
				],
				yuki: [
					"Shuraの最期の息は冷たい空気の中で霧となり、消えた。",
					"Yukiは襟巻きを直し、雪に足跡ひとつ残さず去っていった。",
					"その日から、山頂で見かけるのは狐の影だけになった。"
				],
				hana: [
					"Shuraの面が地に落ちると、Hanaはその傍らに桜の枝を置いた。",
					"その夜、市は提灯で埋め尽くされた。いちばん大きな歓声を浴びたのは、屋根の上で舞うくノ一だった。",
					"Hanaの行方は誰も知らない。残ったのは舞い散る桃色の花びらだけ。"
				],
				tetsu: [
					"城の屋根の上で、TetsuはShuraの刀を膝で真っ二つに折った。",
					"主君の旗が再び掲げられ、風が誇らしげにそれをはためかせた。",
					"務めは果たした。だが、侍の務めに終わりはない。"
				],
				ren: [
					"RenはShuraの割れた面を、もう一つの鬼の面の隣に掛けた。鬼が二人、勝者は一人。",
					"その夜、村は歌に包まれた。いちばん大きな笑い声は、いつものようにRenのものだった。",
					"朝にはもう、Renは旅立っていた。次の喧嘩を求めて。"
				],
				kage: [
					"Shuraが倒れた時、Kageの影が静かに堕ちた鬼の上に覆いかぶさった。",
					"跡もなく、音もなく。ただ月明かりの下に、影がひとつ多く伸びていた。",
					"それは初めからそこにあったのかもしれない。あるいは、初めから存在しなかったのかもしれない。"
				],
				shura: ["城の屋根に立っていたのはただ一人。同じ面を、より暗くかぶった者だけ。", "Shuraはもう好敵手を探さない。好敵手がShuraを探すのだ。"],
				def: ["最後の達人は倒れた。影の道は今、お前のものだ。", "刃を納めよ。伝説はここから始まる。"],
				tora: [
					"鎖の鳴る音が、Shuraの敗北を告げた。",
					"Toraは割れた面を鎖に吊るした。新たな狩りの戦利品だ。",
					"その日から、森の誰ひとり、虎の咆哮をおとぎ話とは思わなくなった。"
				],
				jin: [
					"Jinは倒れたShuraの傍らに膝をつき、祈った。",
					"寺へ戻る道中、その棒には一滴の血もついていなかった。",
					"その夜、山の鐘が再び鳴った。今度は弔いではなく、平和のために。"
				],
				mai: [
					"Shuraが倒れると、Maiはぱちんと扇を閉じて一礼した。",
					"夜市では今もあの舞が語り草になっている。",
					"幕は下りた。だが、Maiが舞台を去ることはなかった。"
				],
				tsubame: [
					"最後の矢が、城の屋根で音もなく震えていた。",
					"Tsubameは弓を肩に掛け、南へ渡る燕たちを見送った。",
					"その姿を見た者は二度といない。残ったのは、的に刺さった色鮮やかな矢羽根だけ。"
				]
			},
			roster2: { notes: {
				tora: [
					"弱：中距離は鎖の鞭、近距離は鎌",
					"強：鎖を投げ、当たれば相手を引き寄せる",
					"コンボの締め：相手が遠ければ鎖で引き寄せる"
				],
				jin: [
					"棒の両端で打つ。打撃は鈍く、血を流さない",
					"3発目と強の足払いでダウンを奪う",
					"ガード中は体勢ゲージが溜まりにくい"
				],
				mai: [
					"パリィの受付が広い",
					"ガード中、扇が飛び道具を跳ね返す",
					"強：風の波で相手を押し、飛び道具を散らす"
				],
				tsubame: [
					"強：弓で矢を放つ。長押しで溜め撃ち",
					"投げ：後方宙返りして空中から矢を放つ",
					"矢が尽きると強攻撃は短刀になる。矢は時間で補充される"
				]
			} }
		});
		merge(EN.CHARS, {
			akane: {
				title: "紅の刃",
				desc: "バランス型の刀の達人。速い3連コンボと強いパリィ。",
				weapon: "Katana"
			},
			aoi: {
				title: "蒼き風",
				desc: "身軽な刀の達人。歩きがやや速く、風のようにダッシュする。",
				weapon: "Katana"
			},
			kuro: {
				title: "黒き山",
				desc: "長い野太刀の使い手。遅いが、リーチが広く一撃が重い。",
				weapon: "Nodachi"
			},
			yuki: {
				title: "雪狐",
				desc: "短い小太刀で素早く斬る。手裏剣が多く、長い襟巻きがトレードマーク。",
				weapon: "Kodachi"
			},
			hana: {
				title: "桜の舞",
				desc: "くノ一。二本の短刀で舞うように戦う。手は最速、リーチは最短。",
				weapon: "双 Tantō"
			},
			tetsu: {
				title: "鉄の砦",
				desc: "鎧の侍。薙刀でリーチは最長。攻撃を受けてもびくともしない。",
				weapon: "Naginata"
			},
			ren: {
				title: "紅の鬼",
				desc: "鬼の面の暴れ者。ガードを砕く打撃と強烈な蹴りで恐れられる。",
				weapon: "Uchigatana"
			},
			kage: {
				title: "影そのもの",
				desc: "頭巾の影。忍者刀で素早く、ダッシュが長い。通った跡に影を残す。",
				weapon: "Ninjatō"
			},
			tora: {
				title: "鎖の虎",
				desc: "鎖鎌の達人。中距離から分銅つきの鎖を振るい、強攻撃で相手を引き寄せて鎌で仕留める。",
				weapon: "Kusarigama"
			},
			jin: {
				title: "鉄棒の僧",
				desc: "棒を操る僧。両端で打つ長い棒、堅いガード、鈍い打撃でダウンを奪う。血は流さず、骨を揺らすだけ。",
				weapon: "Bō"
			},
			mai: {
				title: "扇の舞姫",
				desc: "鉄扇のくノ一。非常に速く、パリィの受付が広い。扇は飛び道具を跳ね返し、その風で相手を押し返す。",
				weapon: "双 Tessen"
			},
			tsubame: {
				title: "燕の射手",
				desc: "弓と短刀を携える。遠くから矢を射ち（強を長押しで強力な一矢）、近づく相手からは後方宙返りで離れて空中から射る。",
				weapon: "Yumi + Tantō"
			},
			shura: {
				title: "紅の達人",
				desc: "紅に染まった道を行く鬼の達人。長い野太刀、重い一撃、ほぼ完璧なパリィ。",
				weapon: "Nodachi"
			}
		});
		merge(EN.ARENAS, {
			temple: "月夜の寺",
			rain: "嵐の竹林",
			snow: "雪の峰",
			village: "燃える村",
			market: "夜市",
			waterfall: "滝",
			castle: "城の屋根"
		});
		merge(EN.SPECIALS, {
			akane: {
				desc: "紅の居合斬り。瞬きする間に相手を斬り抜け、宙に燃える三日月を残す。",
				tip: "パリィするか、横へダッシュ"
			},
			aoi: {
				desc: "大きく振り抜いて風の刃を前方へ飛ばす。完璧なタイミングのガードで跳ね返せる。",
				tip: "ジャンプするか、刃で斬り払うか、完璧なタイミングでガード"
			},
			kuro: {
				desc: "跳び上がって野太刀で大地を割る。地を走る衝撃波がガードを砕き、ダウンを奪う。",
				tip: "波を跳び越えて、空中から斬る"
			},
			yuki: {
				desc: "吹雪のような電光石火の5連撃。最後の一撃でダウンを奪う。",
				tip: "ガードして、初撃をパリィ"
			},
			hana: {
				desc: "二本の短刀で桜吹雪のように回転しながら前進し、左右を斬り裂く。",
				tip: "ガードするか、後ろへダッシュ"
			},
			tetsu: {
				desc: "薙刀を全方位に振り回す。攻撃を受けても回転は止まらない（スーパーアーマー）。",
				tip: "間合いの外へ出るか、パリィ"
			},
			ren: {
				desc: "ガードを砕く肩からの体当たりに続き、相手を打ち上げる斬り上げ。",
				tip: "ガードは無意味：パリィ、ジャンプ、ダッシュで"
			},
			kage: {
				desc: "煙に紛れて消え、影分身を残して相手の背後に現れて斬る。",
				tip: "Kageが現れた瞬間にガード"
			},
			tora: {
				desc: "頭上で鎖を振り回して竜巻を起こし、周囲をなぎ払う。捕まった相手は引き寄せられ、鎌で空高く打ち上げられる。",
				tip: "間合いの外へ出るかガード：捕まらなければ引き寄せは空振り"
			},
			jin: {
				desc: "棒を金剛の車輪のように回しながら前進し、4発打った後の突き上げで相手を打ち上げる。",
				tip: "後ろへダッシュするか、初撃をパリィ"
			},
			mai: {
				desc: "旋風を起こして前方へ流し、相手を引き込んで斬り、最後に空高く巻き上げる。",
				tip: "旋風を完璧なタイミングでガードするか、下がろう。動きは遅い"
			},
			tsubame: {
				desc: "後ろへ跳んで空から矢の雨を降らせる。外れると燕の矢が旋回して背後から襲う。",
				tip: "地面の印から離れよう。燕の矢は戻ってくるので背後に注意"
			},
			shura: {
				desc: "咆哮とともに紅の煙に溶け、相手の前後に現れて野太刀の重い3連斬りを放つ。最後の一撃で打ち上げる。",
				tip: "紅の閃きを見逃すな：一太刀でもパリィすれば技は止まる。ガードすると体勢が崩される"
			}
		});
		merge(EN.TXT, {
			gbreak: "体勢崩し！",
			cut: "両断！",
			reflect: "跳ね返し！",
			parry: "パリィ！",
			caught: "捕らえた！",
			swallowHit: "燕!",
			vajraHit: "金剛!",
			whirlHit: "旋風の舞"
		});
		merge(EN.AI_LEVELS, {
			0: "見習い",
			1: "達人",
			2: "伝説",
			3: "Shura"
		});
		EN.NUMWORDS = [
			"〇",
			"一",
			"二",
			"三",
			"四",
			"五",
			"六",
			"七",
			"八",
			"九",
			"十",
			"十一",
			"十二"
		];
		merge(EN.PHRASES, {
			"Gölge Düellosu": "Shadow Duel",
			"Duraklat": "ポーズ",
			"KARŞILIKLI SERİ": "応酬",
			"SON DARBE": "とどめ",
			"atlamak için bir tuşa bas": "何かキーを押してスキップ",
			"GARD": "ガード",
			"HAFİF": "弱",
			"SALDIR": "攻撃",
			"AĞIR": "強攻撃",
			"ATIL": "ダッシュ",
			"TEKME": "蹴り",
			"Sekiz savaşçı, üç arena. Gerçek zamanlı kılıç çarpışması, kılıç kilitlenmesi, savuşturma, denge kırma, Gölge Kesiği ve ragdoll fiziği.": "剣士八人、ステージ三種。リアルタイムの剣戟、鍔迫り合い、パリィ、体勢崩し、影斬り、ラグドール物理。",
			"İki Oyuncu": "2人対戦",
			"Aynı klavyede ya da iki gamepad ile kafa kafaya": "1つのキーボードか2台のゲームパッドで真っ向勝負",
			"CPU'ya Karşı": "CPU戦",
			"Ninjanı seç, rakibini yapay zekâ yönetsin": "忍者を選ぼう。相手はAIが操る",
			"Zorluk": "難易度",
			"Çırak": "見習い",
			"Usta": "達人",
			"Efsane": "伝説",
			"Aylık Turnuva": "月例大会",
			"Dan Sınavı": "段位審査",
			"Şampiyonlar Salonu": "王者の殿堂",
			"Seyret": "観戦",
			"Rastgele iki ninja, Efsane yapay zekâ": "ランダムな忍者2人、伝説AI",
			"Ses": "サウンド",
			"Müzik": "音楽",
			"Kan efekti": "流血",
			"Tuş ipuçları": "キーヒント",
			"Yüksek grafik": "高画質",
			"Kontroller": "操作",
			"1. Oyuncu": "プレイヤー1",
			"2. Oyuncu": "プレイヤー2",
			"Yürü": "歩く",
			"Zıpla": "ジャンプ",
			"Gard (basılı tut)": "ガード（長押し）",
			"Hafif kesik (×3 kombo)": "斬り（×3コンボ）",
			"Ağır kesik": "強斬り",
			"Tekme": "蹴り",
			"Sol Shift": "左Shift",
			"Sağ Shift": "右Shift",
			"Atılma": "ダッシュ",
			"Ki tekniği (ki dolu)": "気の技（気が満タン）",
			"Ninjanı seç": "忍者を選べ",
			"Hazır": "準備完了",
			"1. oyuncunun ninjası": "プレイヤー1の忍者",
			"2. oyuncunun ninjası": "プレイヤー2の忍者",
			"Önceki ninja": "前の忍者",
			"Sonraki ninja": "次の忍者",
			"1. oyuncu kadrosu": "プレイヤー1の顔ぶれ",
			"2. oyuncu kadrosu": "プレイヤー2の顔ぶれ",
			"Dövüşe başla": "対戦開始",
			"Geri": "戻る",
			"Kilitli": "ロック中",
			"Rastgele": "ランダム",
			"Hız": "速さ",
			"Güç": "力",
			"Menzil": "リーチ",
			"Can": "体力",
			"Duraklatıldı": "ポーズ中",
			"Devam et": "再開",
			"Maçı yeniden başlat": "試合をやり直す",
			"Ana menü": "メインメニュー",
			"Rövanş": "再戦",
			"Karakter değiştir": "忍者を変える",
			"Zafer senin": "見事な勝利！",
			"Raund": "ラウンド",
			"Verilen hasar": "与ダメージ",
			"Savuşturma": "パリィ",
			"Ki Saldırısı": "気の技",
			"Antrenman": "トレーニング",
			"ANTRENMAN": "トレーニング",
			"Sıralama": "ランキング",
			"Tümü": "すべて",
			"Ekranı yan çevir": "画面を横向きにしよう",
			"Performans için grafik düşürüldü": "動作を軽くするため画質を下げました",
			"Kanlı Usta": "血の達人",
			"Yolunu kanla çizen iblis usta. Uzun nodachi, yıkıcı darbeler, neredeyse kusursuz savuşturma.": "血で道を刻む鬼の達人。長い野太刀、重い一撃、ほぼ完璧なパリィ。",
			"SEN": "あなた",
			"KUKLA": "木人",
			"Son raund": "最終ラウンド",
			"Kazanan her şeyi alır": "勝者がすべてを得る",
			"İlk iki raundu alan kazanır": "2ラウンド先取で勝利",
			"Dövüş!": "勝負！",
			"Süre doldu": "タイムアップ",
			"Berabere": "引き分け",
			"Çifte K.O.": "ダブルK.O.",
			"Mükemmel": "パーフェクト",
			"F / K tuşuna hızlıca bas!": "F / K を連打！",
			"Hafif ya da ağır tuşuna hızlıca bas!": "弱か強を連打！",
			"KARŞILIK": "カウンター",
			"SAVUŞTUR": "パリィ",
			"SON VURUŞ!": "とどめ！",
			"KİLİTLENDİ!": "鍔迫り合い！",
			"İTTİ!": "押し返し！",
			"DENGE KIRILDI!": "体勢崩し！",
			"GARD KIRILDI!": "ガードブレイク！",
			"KESİLDİ!": "斬った！",
			"YANSITMA!": "反射！",
			"SAVUŞTURMA!": "パリィ！",
			"YAKALANDI!": "捕らえた！",
			"ZIRH!": "アーマー！",
			"ARKADAN!": "背後から！",
			"DUVAR!": "壁！",
			"KAFA!": "ヘッドショット！",
			"KARŞI!": "カウンターヒット！",
			"KRİTİK!": "クリティカル！",
			"SÜPÜRME!": "足払い！",
			"KARŞILIK!": "カウンター！",
			"YERE SERİLDİ": "ダウン",
			"ÇARPIŞMA!": "激突！"
		});
		merge(EN.HTML, {
			"Gölge<br><em>Düel</em><em>losu</em>": "Shadow<br><em>Du</em><em>el</em>",
			"<b>Savuşturma:</b> darbe gelmeden hemen önce gard tuşuna bas; rakip sendeler.": "<b>パリィ：</b>攻撃が当たる直前にガードを押そう。相手がよろめく。",
			"<b>Karşılık (返し技):</b> gard ya da savuşturmanın hemen ardından saldırı tuşu → anında karşı kesik. <b>İleri</b> + hafif = bacağa süpürme, <b>geri</b> + hafif = yanından dönüp arkadan kesme, <b>ağır</b> = güçlü karşı darbe.": "<b>カウンター（返し技）：</b>ガードやパリィの直後に攻撃 → すぐさま返し斬り。<b>前</b>＋弱＝足払い、<b>後ろ</b>＋弱＝回り込んで背後から斬る、<b>強</b>＝強力なカウンター。",
			"<b>Karşılıklı seri:</b> karşılık da karşılanabilir. Her turda vuruşlar hızlanır ve güçlenir; kendi 3. karşılığın üç vuruşluk sinematik bir bitirişe dönüşür. Seriyi kıran darbe ağır çekimde iner.": "<b>応酬：</b>カウンターにもカウンターを返せる。応酬のたびに攻撃は速く、重くなる。自分の3回目のカウンターは3連撃の演出つきとどめになる。応酬を断ち切る一撃はスローモーションで決まる。",
			"<b>Kılıç kilidi:</b> kılıçlar çarpışınca kilitlenebilir. Hafif/ağır tuşuna hızlı basan rakibini iter.": "<b>鍔迫り合い：</b>刃がぶつかると鍔迫り合いになることがある。弱／強を速く連打した方が相手を押し返す。",
			"<b>Ki barı</b> vurdukça, yedikçe ve savuşturdukça dolar. Dolunca her ninjanın kendine özgü ki tekniği açılır (Antrenman’daki hareket listesinde görebilirsin).": "<b>気ゲージ</b>は攻撃を当てる、受ける、パリィすることで溜まる。満タンになると、忍者ごとの固有の気の技が使える（トレーニングの技表で確認できる）。",
			"<b>Atılma + hafif</b> = atılarak kesik. <b>Havada</b> hafif = hava kesiği, ağır = dalış. Ağır kesik yere serer, duvara çarpan geri seker.": "<b>ダッシュ＋弱</b>＝ダッシュ斬り。<b>空中で</b>弱＝空中斬り、強＝急降下。強斬りはダウンを奪い、壁に叩きつけられた相手は跳ね返る。",
			"<b>Denge çubuğu</b> dolarsa gard kırılır. Tekme gardı delip dengeyi hızla doldurur.": "<b>体勢ゲージ</b>が満タンになるとガードが崩れる。蹴りはガードを貫き、体勢ゲージを素早く溜める。",
			"Gamepad: X hafif · Y ağır · B tekme · A zıpla · LB gard · RB shuriken · RT atılma · R3 ki tekniği. Start ya da <kbd>P</kbd> duraklatır. CPU modunda her iki tuş seti de seni yönetir.": "ゲームパッド：X 弱 · Y 強 · B 蹴り · A ジャンプ · LB ガード · RB 手裏剣 · RT ダッシュ · R3 気の技。Start か <kbd>P</kbd> でポーズ。CPU戦ではどちらのキー配置でも操作できる。",
			"<kbd>Enter</kbd> başlatır · <kbd>⌫</kbd> menüye döner": "<kbd>Enter</kbd> 開始 · <kbd>⌫</kbd> 戻る",
			"<kbd>Enter</kbd> / <kbd>F</kbd> başlatır · <kbd>⌫</kbd> çıkar": "<kbd>Enter</kbd> / <kbd>F</kbd> 開始 · <kbd>⌫</kbd> やめる"
		});
		EN.PATTERNS.push([/^RAUND (\d+)$/, "ラウンド $1"], [/^(\d+)\. Raund$/, "第$1ラウンド"], [/^(\d+)\. KARŞILIK$/, "カウンター ×$1"], [/^(\d+) VURUŞLUK SERİ!$/, "$1連応酬！"], [/^(.+) önde$/, (m, n) => I.t(n) + "の優勢"], [/^(.+) kazandı$/, (m, n) => I.t(n) + "の勝利"], [/^(\d+) – (\d+) · (\d+) raund · (.+)$/, (m, a, b, r, ar) => `${a} – ${b} · ${r}ラウンド · ${I.t(ar)}`]);
		merge(EN.STR, {
			menu: {
				play: "プレイ",
				playSub: (name, lv) => `${name} vs CPU · ${lv}`
			},
			first: {
				play: "プレイ",
				sub: "ワンタップで即バトル",
				menu: "全モード"
			},
			ads: {
				cont: "ここから続ける",
				contSub: "広告を見て · ペナルティなしでリトライ",
				trial: (name) => `${name}を1戦お試し`,
				trialSub: "広告を見る",
				fail: "今は広告がない。少し待ってからもう一度"
			},
			coach: {
				attack: (l) => `${l} 攻撃`,
				guard: (l, g) => `${g} 長押しでガード`,
				parry: (l, g) => `当たる直前に ${g} を押す：パリィ`,
				attackT: (l) => `${l} をタップ · 連続タップでコンボ`,
				guardT: (l, g) => `${g} 長押しでガード`,
				parryT: (l, g) => `当たる直前に ${g} をタップ：パリィ`
			}
		});
		merge(EN.STR, { vol: {
			title: "音量",
			master: "全体",
			music: "音楽",
			sfx: "効果音",
			sound: "サウンド",
			pct: (n) => `${n}%`,
			muted: "音が消えている。スライダーを動かすと元に戻る。",
			voice: "ボイス",
			uiSfx: "メニュー音",
			credit: "ボイス：ユーフルカ (youfulca.com) · 効果音ラボ · すぱらんど"
		} });
		merge(EN.STR, { tedit: {
			mnote: {
				dpad: "独立したボタン：長押しで歩き、2回押しでダッシュ。2つのボタンの間を押すと両方（▶ + ▲ = 前ジャンプ）。",
				dtap: "独立したボタン：◀ ▶ を軽くタップで一歩、長押しで歩き、2回押しでダッシュ。"
			},
			dtap: "タップで一歩",
			edit: "操作のカスタマイズ",
			title: "操作のカスタマイズ",
			hint: "ボタンを好きな場所へドラッグ。タップでサイズ・透明度の変更や非表示ができる。",
			rotate: "画面を横向きにして、バトル用の操作を配置しよう。",
			shapes: {
				phone: "スマホ",
				tablet: "タブレット",
				portrait: "縦画面"
			},
			screenNote: "配置は画面の形ごとに保存される。スマホとタブレットはそれぞれ別の配置。",
			save: "保存",
			cancel: "キャンセル",
			options: "オプション",
			done: "完了",
			close: "閉じる",
			size: "サイズ",
			sizes: {
				s: "小",
				m: "中",
				l: "大",
				xl: "特大"
			},
			opacity: "透明度",
			opacityAll: "透明度（全体）",
			hide: "隠す",
			show: "表示",
			hidden: "非表示",
			snap: "グリッドに吸着",
			presets: "プリセット",
			pRight: "右手用",
			pLeft: "左手用",
			reset: "初期設定に戻す",
			resetDone: "初期配置に戻した（保存すると反映）。",
			overlap: "ボタンは重ねられない：いちばん近い空きへ移動した。",
			noRoom: "そこには置けない：ボタンを元に戻した。",
			saved: "操作を保存した",
			throwName: "手裏剣",
			pauseName: "ポーズ",
			dirs: {
				dl: "◀ 左",
				dr: "右 ▶",
				du: "▲ ジャンプ",
				dd: "▼ ガード"
			}
		} });
		merge(EN.STR, {
			menu: { arcadeDesc: "強くなっていく相手を一人ずつ倒そう。最後には隠れた達人が待っている。名誉をいちばん稼げるモード。" },
			sel: {
				title: { rival: "好敵手の挑戦 · 忍者を選べ" },
				go: { rival: "決闘を受ける" },
				moves: "技表",
				movesOf: (name) => `${name} · 技表`,
				close: "閉じる"
			},
			hint: {
				honor: (have, need) => `名誉 ${num(Math.min(have, need))}/${num(need)} → 好敵手の挑戦が始まる`,
				ready: "挑戦を受ける準備完了！",
				arenaHonor: (have, need) => `名誉 ${num(need)} で解放（${num(Math.min(have, need))}/${num(need)}）`
			},
			honor: {
				name: "名誉",
				head: "名誉",
				rows: {
					win: "勝利",
					loss: "参戦",
					rounds: "取ったラウンド",
					perfect: "パーフェクト",
					rally: "カウンター応酬",
					counter: "カウンター",
					parry: "パリィ",
					rivalWin: "好敵手の挑戦",
					arcadeClear: "アーケードクリア"
				},
				total: (n) => `名誉：${num(n)}`,
				next: (name, left) => `次の忍者：${name} — 名誉あと ${num(left)}`,
				bar: (have, need) => `名誉 ${num(Math.min(have, need))}/${num(need)} → 好敵手の挑戦が始まる`,
				ready: (name) => `${name}が挑んできた！`,
				readyGo: "受けて立つ",
				all: "全忍者を解放済み",
				bonus: {
					arcadeClear: "アーケードクリア",
					tourneyClear: "大会制覇",
					danPass: "段位審査に合格",
					rivalWin: "好敵手の挑戦に勝利",
					tutorial: "チュートリアル完了"
				},
				bonusToast: (n, what) => `名誉 +${num(n)} · ${what}`,
				road: "名誉の道",
				roadSub: "一人用のどのモードでも名誉が手に入る。忍者ごとの目標に届くとその忍者が決闘を挑んでくる。勝てば仲間になる。",
				earnHead: "名誉の稼ぎ方",
				earn: (H) => [
					["CPU戦", `勝利：見習い ${H.win[0]} · 達人 ${H.win[1]} · 伝説 ${H.win[2]}`],
					["アーケード", `難易度ごとの勝利 · Shura ${H.win[3]} · クリアで +${H.arcadeClear}`],
					["大会と段位", `勝利 ×${H.modeMul.tourney} · 大会制覇 +${H.tourneyClear} · 段位審査ごとに +${H.danPass(1)} 以上`],
					["負けても", `参戦 ${H.loss} · 取ったラウンドごとに ${H.roundWon}`],
					["好プレー", `パリィ、カウンター、応酬、パーフェクト：1試合最大 +${H.styleCap}`]
				],
				rivalsHead: "好敵手",
				arenasHead: "ステージ",
				open: "解放済み",
				castle: "アーケードでShuraを倒す",
				you: (n) => `あなたの名誉：${num(n)}`
			},
			rival: {
				stage: "好敵手の挑戦",
				selTitle: (name) => `${name}が挑んできた · 忍者を選べ`,
				lvHp: (lv, p) => p === 100 ? lv : `${lv} · 相手の体力 ${p}%`,
				accept: "挑戦を受ける",
				acceptSub: (name) => `勝てば${name}が仲間に`,
				quit: "退く",
				hud: "好敵手の挑戦",
				winTitle: (name) => `${name}が仲間になった！`,
				winSub: (name) => `${name}が選択画面に加わった。さっそく使ってみよう！`,
				tryNew: (name) => `${name}で戦う`,
				lossTitle: "挑戦は続く",
				lossSub: (name, p) => `今回は${name}の勝ち。負けても失うものはない。次は相手の体力${p}%から始まる。`,
				lossSubMin: (name) => `今回は${name}の勝ち。負けても失うものはない。もう一度挑もう。`,
				retry: "再挑戦",
				reveal: "新たな忍者",
				toastReady: (name) => `${name}が挑んできた！`,
				lines: {
					hana: "あなたの名誉の噂、聞いたよ。市じゅうが噂してる！　あたしの踊りについてこられたら、一緒に行ってあげる！",
					tetsu: "その名、我が耳にも届いた。我を倒せば、この薙刀はお前と共に戦おう。",
					ren: "はっ！　やっと呼ばれたぜ！　勝てば仲間になってやる。負けたら俺の笑い声を聞いてな！",
					kage: "しばらくお前を見ていた。我が影を捕らえれば、お前に従おう。",
					tora: "獲物じゃねえと証明してみな。俺の鎖をかわせたら、隣を歩いてやる。",
					jin: "その名誉が心から来るものなら、拙僧の棒が見抜きましょう。さあ、試させてもらいます。",
					mai: "あなたを私の舞台に招待するわ。私の喝采を勝ち取れたら、この舞はあなたのもの。",
					tsubame: "遠くから見ていた。あなたは強い。私の矢をかわせたら、この弓はあなたと共にある。"
				}
			}
		});
		merge(EN.CHARS, {
			akane: {
				desc: "居合術の達人。刃は鞘の中で待ち、斬撃はすべて抜刀。抜刀の構えで相手の攻撃を受け止める。",
				weapon: "Katana（居合）"
			},
			aoi: {
				desc: "片手で太刀を操る風の剣士。遠くまで届く突きと風の足さばきで、どんな間合いも一瞬で詰める。",
				weapon: "Tachi"
			},
			ren: { desc: "鬼の面の暴れ者。刀は肩に担ぎ、肘・膝・肩・頭突きで戦い、ガードを叩き潰す。" },
			kage: { desc: "頭巾の影。忍者刀を逆手に持ち、影の歩み、フェイント、煙玉で戦う。" }
		});
		merge(EN.TXT, {
			kiCancel: "気キャンセル！",
			launch: "打ち上げ！",
			iaiCatch: "居合返し！"
		});
		EN.PATTERNS.push([/^(\d+) VURUŞ$/, "$1ヒット"]);
		merge(EN.PHRASES, {
			"Tekme": "蹴り",
			"Tekme: dengeyi hızla doldurur, gardı kırmaya yarar. Ardından AĞIR ile seri bitirişine bağlanır.": "蹴り：体勢ゲージを素早く溜め、ガード崩しに役立つ。続けて強で連携の締めにつながる。",
			"Shuriken fırlatır; zamanla yeniden dolar.": "手裏剣を投げる。時間で補充される。",
			"Hava kesiği": "空中斬り",
			"Havada hafif kesik. Havaya fırlatılmış rakibe de vurur.": "空中での弱斬り。打ち上げた相手にも当たる。",
			"Dalış": "急降下",
			"Havadan aşağı dalış kesiği; yere serer.": "空中から急降下して斬る。ダウンを奪う。",
			"Kaeshi-waza (karşılık)": "Kaeshi-waza（返し技）",
			"Gard ya da savuşturmanın hemen ardından karşılık: nötr Suriage, ileri Harai (yere serer), geri Nuki (arkaya geçer), ağır Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.": "ガードやパリィの直後に返す：ニュートラルで Suriage、前で Harai（ダウンを奪う）、後ろで Nuki（背後へ回る）、強で Uchiotoshi。自分の3回目の返し技がとどめ。パリィされたら応酬が続く。",
			"Fırlatıcı isabet edince HAFİF: rakibin peşinden sıçrayıp havada keser. Ardından AĞIR ile yere çakar. Havadaki rakip en çok üç vuruş alır.": "打ち上げが当たったら弱：相手を追って跳び、空中で斬る。続けて強で地面に叩きつける。空中の相手に入るのは最大3発。",
			"Üç vuruşluk hafif seri. İkinci ve üçüncü vuruş ki doluyken tekniğe bağlanır.": "弱の3連撃。気が満タンなら2発目と3発目から気の技につながる。",
			"Ağır vuruş: yavaş ama yere serer.": "強攻撃：遅いがダウンを奪う。",
			"İleri atılarak dürter; hafif seriye devam eder.": "前へ踏み込んで突く。弱の連撃につながる。",
			"Yarım adım geri çekilip bacaklara alçak süpürme; yere serer.": "半歩下がってから足元を低く払う。ダウンを奪う。",
			"Fırlatıcı: yükselen kesik rakibi havaya kaldırır.": "打ち上げ：斬り上げで相手を宙に浮かせる。",
			"Sıçrayıp tepeden iner: yavaş ama gardı ezer, yere serer.": "跳び上がって頭上から振り下ろす。遅いがガードを潰し、ダウンを奪う。",
			"Atılırken dönerek geniş kesik; yere serer.": "ダッシュから回転して大きく斬る。ダウンを奪う。",
			"İki kesiklik seri bitirişi; son kesik yere serer.": "2連斬りの締め。最後の一太刀でダウンを奪う。",
			"Rakibin kılıcını aşağı çarpıp dürter: gardı ezer.": "相手の刃を叩き落として突く。ガードを潰す。",
			"Kından yatay çekiş kesiği, çapraz iniş, geri dönen kesik; kılıç her seferinde kınına döner.": "鞘から横一文字の抜刀、袈裟斬り、返す刀。刃はそのたびに鞘へ戻る。",
			"Derin çömelişten geniş yatay çekiş; yere serer.": "深く沈んだ構えから大きく横へ抜刀。ダウンを奪う。",
			"Atılarak kından çekiş: uzak mesafeyi bir anda kapatır, seriye devam eder.": "踏み込みながらの抜刀：遠い間合いを一瞬で詰め、連撃につながる。",
			"Kılıcı çekmeden kabzayla göğse vurur: hızlı, sersemletir. Ardından HAFİF ile Kesa ya da AĞIR ile Kurenai Renga.": "刀を抜かず柄で胸を打つ：速く、相手をひるませる。続けて弱で Kesa、強で Kurenai Renga。",
			"Fırlatıcı: kından yükselen çekiş rakibi havaya kaldırır.": "打ち上げ：鞘からの斬り上げで相手を宙に浮かせる。",
			"Çekiş duruşu: kısa bir an bekler; bu sırada gelen yakın dövüş darbesini yakalar ve kaçınılmaz bir iai kesiğiyle karşılık verir. Boşa giderse açık kalır.": "抜刀の構え：一瞬待ち、その間に来た近接攻撃を受け止めて、避けられない居合で返す。何も来なければ隙ができる。",
			"Kesa’dan sonra yükselen ve inen iki çekiş kesiği; son kesik yere serer.": "Kesa に続き、斬り上げと斬り下ろしの2連抜刀。最後の一太刀でダウンを奪う。",
			"Tekmeden sonra çömelip rakibin içinden geçen kızıl iai; arkasında belirir.": "蹴りの後、身を沈めて相手を斬り抜ける紅の居合。背後に現れる。",
			"Tek elle uzun dürtüş, yukarı savrulan kesik ve rüzgâr adımıyla derin atılma dürtüşü.": "片手での長い突き、跳ね上げる斬り、そして風の足さばきで深く踏み込む突き。",
			"Dönerek geniş yatay kesik; yere serer.": "回転しながら大きく横に斬る。ダウンを奪う。",
			"Rüzgâr adımı: çok uzaktan tek hamlede dürter, seriye devam eder.": "風の足さばき：遠くから一気に突き、連撃につながる。",
			"Geri çekilirken uzun menzilli iniş kesiği: yaklaşanı cezalandırır.": "下がりながら遠くまで届く斬り下ろし：近づく相手を咎める。",
			"Fırlatıcı: dönerek yükselen kesik rakibi havaya kaldırır.": "打ち上げ：回転しながらの斬り上げで相手を宙に浮かせる。",
			"Geri sıçrar, ardından çok uzağa uzanan dürtüşle geri döner: gardı ezer, yere serer.": "後ろへ跳び、そこから遠くまで伸びる突きで戻る。ガードを潰し、ダウンを奪う。",
			"Üç hızlı dürtüş; sonuncusu rüzgârla rakibi savurur.": "素早い3連突き。最後の一突きが風で相手を吹き飛ばす。",
			"İki kez dönerek çevresini biçen kesik; gardı ezer.": "2回転して周りをなぎ払う。ガードを潰す。",
			"Kesik · Dirsek · Diz": "斬り · 肘 · 膝",
			"Tek elle kesik, dirsek darbesi ve uçan diz: kılıçla başlayıp bedenle biter.": "片手斬り、肘打ち、飛び膝蹴り：刀で始まり、体で終わる。",
			"İki elle tepeden ezici iniş; gardı zorlar, yere serer.": "両手で頭上から叩き潰す。ガードを圧迫し、ダウンを奪う。",
			"Omuz hücumu: öne atılıp omuzla çarpar, dengeyi sarsar. İsabet ederse seriye devam eder.": "肩からの体当たり：踏み込んで肩でぶつかり、体勢を揺さぶる。当たれば連撃につながる。",
			"Kafa atar: kısa menzil, uzun sersemletme. İsabet ederse seriye devam eder.": "頭突き：リーチは短いが、長くひるませる。当たれば連撃につながる。",
			"Fırlatıcı: aşağıdan yukarı iki elle savrulan kesik.": "打ち上げ：両手で下から上へ振り抜く斬り。",
			"Topuğu havaya kaldırıp balta gibi indirir: yere serer.": "かかとを高く上げ、斧のように振り下ろす。ダウンを奪う。",
			"Dirsekten sonra kesik ve tepeden ezici iniş; son vuruş yere serer.": "肘打ちに続けて斬り、頭上から叩き潰す。最後の一撃でダウンを奪う。",
			"Tekmenin ardından dönen topuk tekmesi; yere serer.": "蹴りに続く回し蹴り。ダウンを奪う。",
			"Ters tutuşla kesik, dönen kesik ve gölge adımı: kaybolup öne geçer, dürterek belirir.": "逆手斬り、回転斬り、そして影の歩み：消えて前へ回り込み、突きとともに現れる。",
			"Sıçrayıp ters tutuşla aşağı saplar; yere serer.": "跳び上がって逆手で突き下ろす。ダウンを奪う。",
			"Gölge gibi uzun atılma kesiği; seriye devam eder.": "影のように長く踏み込む斬り。連撃につながる。",
			"Aldatma: kesecekmiş gibi parlar, dumanla geri kaçar. Erken savuşturmayı boşa çıkarır; hemen HAFİF ile gölge adımına, AĞIR ile Kage-nui’ye bağlanır.": "フェイント：斬るように光ってから、煙とともに下がる。早すぎるパリィを空振りさせる。すぐに弱で影の歩み、強で Kage-nui につながる。",
			"Fırlatıcı: ters tutuşla yükselen kesik.": "打ち上げ：逆手での斬り上げ。",
			"Ayağının dibine sis bombası atar: yakındakini sersemletir, Kage dumanın içinde geri kaçar.": "足元に煙玉を投げる：近くの相手をひるませ、Kage は煙の中へ下がる。",
			"Üç hızlı ters kesik ve aşağı saplama; sonuncusu yere serer.": "素早い逆手の3連斬りと突き下ろし。最後の一撃でダウンを奪う。",
			"Tekmeden sonra dumanda kaybolur, rakibin arkasında belirip saplar.": "蹴りの後、煙に消えて相手の背後に現れ、突き刺す。",
			"Nodachi serisi": "野太刀の連撃",
			"Ağır nodachi": "野太刀の強撃",
			"Kodachi serisi": "小太刀の連撃",
			"Ağır kesik": "強斬り",
			"Tantō dansı": "短刀の舞",
			"Çift kesik": "二刀斬り",
			"Naginata serisi": "薙刀の連撃",
			"Ağır savuruş": "強振り",
			"Zincir ve orak": "鎖と鎌",
			"Zincir çekişi": "鎖の引き寄せ",
			"Asa serisi": "棒の連撃",
			"Ağır süpürme": "強の足払い",
			"Yelpaze serisi": "扇の連撃",
			"Rüzgâr dalgası": "風の波",
			"Tantō serisi": "短刀の連撃",
			"Ok (basılı tut: güçlü)": "矢（長押し：強力な一矢）",
			"Geri + AĞIR da ok atar (basılı tut: güçlü atış); ok kalmadıysa tantō ile tepeden iner.": "後ろ＋強でも矢を放つ（長押しで強力な一矢）。矢が尽きたら短刀で上から斬り下ろす。",
			"KI İPTALİ!": "気キャンセル！",
			"HAVAYA!": "打ち上げ！"
		});
		{
			const tb = (t, c) => `<i class="tb${c ? " " + c : ""}">${t}</i>`;
			merge(EN.STR, {
				kaeshi: {
					head: "KAESHI-WAZA",
					strike: "今だ！",
					hits: "ヒット",
					labels: {
						suriage: "刃をすり上げ、袈裟に斬り下ろす",
						harai: "刃を払いのけ、足を斬る",
						nuki: "一撃を抜け、背後から斬る",
						uchiotoshi: "刃を叩き落とし、突き抜ける",
						sandan: "三段の返し技"
					}
				},
				trial: {
					title: "コンボチャレンジ",
					btn: {
						prev: "前のコンボ",
						next: "次のコンボ",
						retry: "最初から",
						close: "閉じる"
					},
					names: {
						chain: "基本連携",
						s1: "連携の締め",
						s2: "蹴り連携",
						launch: "打ち上げ",
						s3: "ロングコンボ"
					},
					desc: {
						chain: "{L}を3回。前の攻撃が当たった瞬間に次を押そう。連携は名前つきのとどめで締まる。",
						s1: "{L}を2回、続けて{H}：強斬りで連携を締める。",
						s2: "{L}、蹴り{K}、続けて{H}。",
						launch: "{D}＋{H}で打ち上げ。浮いている間に{L}、続けて{H}。",
						s3: "{L}を2回、{D}＋{H}で打ち上げ、{L}、{H}：5ヒット。"
					},
					ready: (w) => `スタート：${w}`,
					startWith: (w) => `このコンボは${w}から始まる。`,
					early: "早すぎ：前の攻撃が当たった瞬間に押そう。",
					late: "遅すぎ：技が終わる前、攻撃が当たった瞬間に押そう。",
					wrong: (got, want) => `ボタン違い：${got}。ここは${want}。`,
					dir: (want) => `方向が足りない：${want}。方向を入れたまま押そう。`,
					miss: "空振り：攻撃が当たらなかった。木人に近づこう。",
					clear: "コンボ成功！",
					clearPop: "コンボ成功！",
					all: "この忍者のコンボチャレンジをすべてクリア！"
				},
				coach: {
					combo: (l) => `${l} ${l} ${l} を素早く：3ヒットコンボ`,
					comboT: (l) => `${l} を3回続けてタップ：コンボ`,
					counter: (l) => `ガードやパリィの後、「今だ！」が出たら ${l}：カウンター`,
					counterT: (l) => `ガードやパリィの後、「今だ！」が出たら ${l} をタップ`
				}
			});
			const L = Array.isArray(EN.STR.lessons) && EN.STR.lessons.find((l) => l.id === "counter");
			if (L) L.d = "ガードやパリィの後、頭上に<b>今だ！</b>が出る。ゲージが尽きる前に <kbd>F</kbd> を押そう。前／後＋<kbd>F</kbd> や <kbd>G</kbd> も別のカウンターになる。";
			if (EN.STR.lessonsTouch) EN.STR.lessonsTouch.counter = `ガードやパリィの後、頭上に<b>今だ！</b>が出る。ゲージが尽きる前に${tb("攻撃", "tb-light")}をタップしよう。前／後＋${tb("攻撃", "tb-light")}や${tb("強攻撃")}も別のカウンターになる。`;
			merge(EN.PHRASES, {
				"KOMBO TAMAM!": "コンボ成功！",
				"Nasıl okunur": "見方",
				"→ rakibe doğru, ← rakipten uzağa demek: o yön tuşunu (A / D ya da ok tuşları; rakip sağındaysa D) basılı tut ve saldırı tuşuna bas. Virgül: tuşlara sırayla bas. F hafif, G ağır, R tekme, S gard.": "→ は相手の方へ、← は相手から離れる方へ：その方向キー（A / D か矢印キー。相手が右にいれば D）を押したまま攻撃キーを押す。カンマ（,）：キーを順番に押す。F 弱、G 強、R 蹴り、S ガード。",
				"▶ rakibe doğru, ◀ rakipten uzağa: o yön tuşunu basılı tut ve düğmeye dokun. Virgül: düğmelere sırayla dokun. Antrenmandaki Kombo denemesi her seriyi adım adım gösterir.": "▶ は相手の方へ、◀ は相手から離れる方へ：その矢印を押したままボタンをタップ。カンマ（,）：ボタンを順番にタップ。トレーニングのコンボチャレンジで、どの連携も一歩ずつ確認できる。",
				"Gard ya da savuşturmanın ardından ekranda VUR! çıkar: altındaki çubuk bitmeden HAFİF’e bas. Yalnız HAFİF: Suriage. İleri + HAFİF: Harai (yere serer). Geri + HAFİF: Nuki (arkaya geçer). AĞIR: Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.": "ガードやパリィの後、「今だ！」が出る：下のゲージが尽きる前に弱を押そう。弱だけ：Suriage。前＋弱：Harai（ダウンを奪う）。後ろ＋弱：Nuki（背後へ回る）。強：Uchiotoshi。自分の3回目の返し技がとどめ。パリィされたら応酬が続く。"
			});
		}
		merge(EN.STR, { gfx: {
			title: "グラフィック",
			levels: {
				auto: "自動",
				high: "高",
				medium: "中",
				low: "低",
				custom: "カスタム"
			},
			note: {
				auto: "端末に合わせて選び、バトルがカクつけば自動で下げる。",
				high: "すべての光とエフェクト。高性能な端末向け。",
				medium: "軽い光の効果、影なし。たいていのスマホ向け。",
				low: "いちばん滑らか。古いスマホ向け。",
				custom: "自分で決めた設定（詳細設定）。"
			},
			now: (lv) => `現在：${lv}`,
			adv: {
				title: "詳細設定",
				note: "どれかを変えると「カスタム」になる。プリセットを押すと元の値に戻る。",
				hot: "いちばん発熱する",
				knob: {
					scale: "解像度",
					msaa: "アンチエイリアス",
					bloom: "光の効果",
					shadows: "影と反射",
					effects: "天候とパーティクル"
				},
				val: {
					off: "オフ",
					low: "低",
					mid: "中",
					full: "最大",
					simple: "簡易"
				}
			}
		} });
		merge(EN.STR, { fps: {
			title: "フレームレート",
			show: "FPSを表示",
			levels: { max: "最大" },
			note: {
				60: "安定して発熱も少ない。たいていのスマホにおすすめ。",
				90: "対応画面ならより滑らか。バッテリー消費は増える。",
				120: "120 Hz画面で最も滑らか。バッテリー消費は増える。",
				max: "画面が許す限り速く。"
			}
		} });
		merge(EN.STR, { set: {
			title: "設定",
			close: "閉じる",
			tabs: {
				audio: "サウンド",
				controls: "操作",
				gfx: "画質",
				lang: "言語"
			},
			touch: "タッチ",
			keys: "キーボード",
			pad: "ゲームパッド",
			touchNote: "画面に触れると、ここにタッチ操作の設定が表示される。"
		} });
		merge(EN.STR, { lang: {
			title: "言語",
			change: "言語を変更",
			close: "閉じる"
		} });
		merge(EN.STR, { loadTip: {
			head: "重要なヒント",
			text: (g) => `戦いを極めたい？攻撃したら毎回 ${g} を押そう。`
		} });
		merge(EN.STR, { thelp: {
			title: { dpad: "十字キー" },
			dpad: {
				walk: "長押し：歩く",
				step: "軽くタップ：一歩",
				jump: "タップ：ジャンプ",
				guard: "長押し：ガード。当たる直前にタップ：パリィ",
				dash: "2回タップ：ダッシュ",
				both: "2つのボタンの間を押すと両方（▶ + ▲ = 前ジャンプ）"
			},
			edit: (b) => `${b}：ボタンを好きな場所へドラッグして、サイズと透明度を調整できる。設定 → 操作 から。`
		} });
		merge(EN.PHRASES, {
			"Shuriken": "手裏剣",
			"KI": "気"
		});
		merge(EN.STR, {
			menu: { arcadeDesc: "忍者ごとに8戦の旅路。次の好敵手から再開して、キャラクターエンディングと達人の印を手に入れよう。" },
			sel: { title: { arcade: "アーケード · キャラクターの旅路" } },
			journey: {
				start: "旅路を始める",
				resume: (i, n) => "続ける · " + i + "/" + n + "",
				ending: "エンディングを見る",
				replay: "旅路をもう一度",
				badge: "達人の印",
				completed: "旅路を踏破",
				progress: (i, n) => "" + i + "/" + n + "戦 完了 · 進行状況は保存済み",
				reward: "報酬：キャラクターエンディングと永久の達人の印",
				saved: "勝つたびに保存される。途中で抜けるとリトライ扱い。",
				menu: (done, active) => "旅路 " + done + " 踏破 · " + active + " 進行中",
				clearReward: "達人の印を獲得 · キャラクターエンディング解放"
			}
		});
		merge(EN.STR, {
			set: { tabs: { save: "進行状況" } },
			acct: {
				title: "進行状況を守る",
				cgOn: (n) => `PortalCアカウント：${n}。称号、王者カラー、段位、スコアはアカウントに保存される。`,
				cgWait: (n) => `PortalCアカウント：${n}。アカウントに接続中…`,
				cgFail: (n) => `PortalCアカウント：${n}。今はアカウントにつながらない。新しいスコアはひとまずこの端末に残る。`,
				cgSave: "進行状況をPortalCアカウントに保存",
				cgSaveNote: "ログインすると、称号・王者カラー・スコアがアカウントに移り、どの端末でも使える。",
				rcTitle: "復元コード",
				rcNote: "このコードを書き留めておこう。新しい端末でここに入力すれば、称号・王者カラー・段位・スコアが戻ってくる。",
				rcShow: "コードを表示",
				rcNew: "新しいコード",
				rcNewDone: "新しいコードを用意した。古いコードはもう使えない。",
				rcNeedName: "復元コードをもらうには、まずニックネームでスコアを保存しよう。",
				rcEnter: "復元コードを入力",
				rcGo: "復元",
				rcDone: (n, c) => `おかえり、${n}！進行状況を復元した。新しい復元コード：${c}`,
				err: {
					bad_code: "このコードは見つからない。文字を確かめよう。",
					rate: "試行回数が多すぎる。後でもう一度。",
					offline: "サーバーにつながらない。接続を確認しよう。",
					banned: "このIDは使えない。",
					error: "問題が起きた。もう一度試そう。"
				},
				local: "ここではオンライン保存が使えない。進行状況はこの端末に保存される。",
				offline: "今はオフライン。進行状況はこの端末に保存される。",
				loading: "読み込み中…"
			},
			lb: { savedLocalAccount: (r) => r ? `この端末で${r}位 · 今はアカウントにつながらない` : "この端末に保存 · 今はアカウントにつながらない" }
		});
		merge(EN.STR, { priv: {
			notice: "Shadow Duel はオンラインランキングのためにニックネームとスコアを保存する。",
			policy: "プライバシーポリシー",
			terms: "利用規約",
			both: "プライバシーポリシーと利用規約",
			ok: "OK",
			label: "プライバシーのお知らせ",
			noticeNet: "オンラインプレイ：ニックネーム、スコア、ランクマッチの結果はゲームのサーバーに保存される。",
			more: "詳細",
			details: "ゲームのサーバーに保存されるもの：この端末で作られるランダムなID、選んだニックネーム、スコア、レベル、ランクマッチの結果（アカウント、メールアドレス、本名はなし）。ニックネームとスコアはランキングで公開される。ランクマッチでは端末が相手の端末と直接、または中継サーバーを通じてつながるため、お互いのIPアドレスが相手に見えることがある。サーバーは公平な対戦のため、それを元に戻せない形に変換した値（ハッシュ）だけを保存する。",
			computer: "相手が見つからない場合、コンピューターが操作する相手と対戦することがある。",
			contact: "データの削除を希望する場合は、ニックネームを添えて {0} まで連絡してほしい。"
		} });
		merge(EN.STR, {
			menu: { trainDrill: "パリィ特訓" },
			tutor: {
				defend: "守れ！",
				attack: "攻めろ！",
				again: "もう一度！",
				pass: {
					freeze: (l, g) => `時が止まる：${g}で守り、${l}で反撃`,
					slow: (l, g) => `スローモーション：輪が閉じる瞬間に${g}、続けて${l}`,
					real: (l, g) => `通常速度：${g}で守り、${l}で反撃、これを2回`
				},
				fail: {
					early: "早すぎ！刃が当たる直前にガードしよう。",
					late: "遅すぎ！刃が当たる直前にガードしよう。",
					slow: "遅すぎ！「攻めろ！」が出ている間に反撃しよう。",
					atk: "まず守って、それから攻撃！",
					miss: "もう一度やってみよう。"
				},
				mastered: "習得！",
				masteredSub: "守る、返す、繰り返す",
				warm: (l) => `ウォームアップ：${l}を3回当てよう`,
				nudge: (k) => `${k}を押そう`,
				nudgeT: (k) => `${k}をタップ`,
				skip: "スキップ ›",
				steps: {
					attack: (b) => `${b}で斬る`,
					guard: (b) => `${b}で刃を受け流す`,
					counter: (b) => `${b}で反撃`,
					timing: (b, l) => `君の番：輪が閉じる瞬間に${b}、続けて${l}`
				},
				ok: {
					attack: "いいね！",
					guard: "受け流した！",
					counter: "反撃！",
					timing: "完璧！"
				},
				ready: "準備完了！",
				readySub: "さあ、決闘に勝て"
			}
		});
		merge(EN.STR, {
			onb: {
				selIntro: "忍者を選ぼう。それぞれに自分だけの旅路がある",
				more: "詳細"
			},
			tips: {
				head: "ヒント",
				ki: (k) => `気が満タン！${k}：必殺技`,
				gbreak: (k, h) => `相手がガードを固めている：${k}の蹴りか${h}の強斬りで黄色いゲージを溜めると、ガードが崩れる`,
				gbreakH: (h) => `相手がガードを固めている：${h}の強斬りで黄色いゲージを溜めると、ガードが崩れる`,
				posture: (g) => `体勢ゲージが溜まっている：下がるか、${g}でパリィしよう`,
				dash: (a) => `${a}を2回押し：ダッシュ`,
				shuriken: (t) => `${t}：手裏剣を投げる`,
				heavy: (h) => `${h}：強斬り。遅いけど重い`,
				lessons: (a, b) => `レッスンはこちら：${a} → ${b}`,
				controls: (a, b) => `ボタンの位置と大きさは ${a} → ${b} で変えられる`
			}
		});
		merge(EN.STR, { online: {
			title: "フレンドと対戦",
			menuSub: "オンライン対戦 · リンクか6文字のコードを共有",
			homeSub: "ルームを作ってフレンドにリンクを送るか、フレンドから届いたコードを入力しよう。",
			create: "ルームを作る",
			join: "参加",
			codePh: "コード",
			haveCode: "ルームコード",
			room: "ルーム",
			linkLabel: "招待リンク",
			back: "戻る",
			leave: "ルームを出る",
			copy: "リンクをコピー",
			copied: "コピーした",
			share: "共有",
			invite: "フレンドを招待",
			shareText: (c) => `Shadow Duel で勝負しよう！ルーム ${c}`,
			inviteNote: "リンクを送るか、コードをフレンドに伝えよう。",
			waitFriend: "フレンドの参加を待っている…",
			joining: "ルームを探している…",
			connecting: "フレンドに接続中…",
			connected: "接続完了",
			you: "あなた",
			friend: "フレンド",
			friendTag: "フレンド",
			waitPick: "選択中…",
			pickTitle: "あなたの忍者",
			arenaTitle: "ステージ",
			arenaHost: "ステージはフレンドが選ぶ",
			ready: "準備完了",
			notReady: "準備中",
			readyWait: "フレンドの準備を待っている…",
			bothReady: "開始中…",
			ping: (ms) => `Ping ${ms} ms`,
			badCode: "ルームコードは6文字。",
			noRoom: "このコードのルームはない。フレンドとコードを確認しよう。",
			full: "このルームは満員。",
			expired: "10分間誰も参加しなかったので、ルームは閉じた。",
			noDirect: "フレンドのネットワークに直接つながらなかった。別のネットワーク（Wi-Fi／モバイルデータ）で試そう。",
			retry: "もう一度",
			noConnect: "フレンドにつながらなかった。インターネット接続を確認して、もう一度試そう。",
			version: "あなたとフレンドのゲームのバージョンが違う。二人ともページを再読み込みしよう。",
			signalDown: "ゲームサーバーにつながらなかった。インターネット接続を確認しよう。",
			friendLeft: "フレンドがルームを出た。",
			waitIn: (s) => `フレンドを待っている… ${s}`,
			away: (s) => `フレンドがゲームから離れた… ${s}`,
			leaveQ: "試合を抜ける？",
			leaveSub: "この試合はフレンドの勝ちになる。",
			stay: "続ける",
			leaveMatch: "抜ける",
			win: "あなたの勝ち",
			lose: "あなたの負け",
			draw: "引き分け",
			over: "試合終了",
			whyDrop: "フレンドの接続が切れた。あなたの勝ち（記録なし）。",
			whyLeft: "フレンドが試合を抜けた。",
			whyAway: "離れている間に試合が終わった。",
			whyDesync: "試合の同期がずれた（接続の問題）ので、カウントされない。",
			rematch: "再戦",
			rematchWait: "フレンドを待っている…",
			rematchAsk: "再戦（フレンドが希望）",
			change: "忍者を変える",
			rounds: (a, b) => `ラウンド ${a} – ${b}`,
			turning: (s) => `フレンドがスマホの向きを変えている… ${s}`,
			paused: "ポーズ中",
			whyPauseWin: "フレンドが時間内に戻らなかった。あなたの勝ち（記録なし）。",
			whyPauseLose: "時間内に戻らなかったので、試合は終了した。",
			whyPauseBoth: "どちらも時間内に戻らなかったので、試合は終了した。"
		} });
		merge(EN.STR, {
			ranked: {
				title: "ランクマッチ",
				menuSub: "ランダムな相手 · ポイント、階級、シーズン",
				offline: "ランクマッチは現在オフライン",
				season: (n) => `シーズン${n}`,
				endsIn: (d) => `残り${d}日`,
				endsToday: "今日終了",
				rating: "レート",
				record: (w, l, d) => `${w}勝 · ${l}敗` + (d ? ` · ${d}分` : ""),
				placement: (a, b) => `認定戦 ${a}/${b}`,
				place: (n) => `ランク ${n}位`,
				find: "対戦相手を探す",
				findUnranked: "対戦相手を探す（ノーランク）",
				board: "ランキング",
				how: "遊び方",
				howLines: [
					"サーバーがレートの近い相手を探す。待つほど範囲が広がる。",
					"二人とも承諾したら、相手の選択が見えない状態で忍者を選ぶ（解放済みの忍者のみ）。",
					"3ラウンド中2本先取で勝利。試合を抜けると負け。",
					"ポイントが変わるのは両方の端末が同じ結果を報告したときだけ。シーズンは4週間。1位には特別な衣装。"
				],
				reward: "シーズン1位：特別な衣装と、王者の殿堂に名前が刻まれる",
				signIn: "ログインしてポイントを稼ごう",
				guestNote: "ゲストはノーランクで遊ぶ。",
				nickNote: "ランクマッチにはニックネームが必要。",
				back: "戻る",
				you: "あなた",
				titleLbl: "称号",
				noTitle: "なし",
				searching: "対戦相手を探している…",
				window: (n) => `レート範囲 ±${n}`,
				windowAny: "レート問わず",
				warm: "待つ間にCPUでウォームアップ",
				warmTag: "ウォームアップ · CPU · ノーランク",
				searchShort: "検索中",
				warmBack: "検索に戻る",
				cancel: "キャンセル",
				none: "今は対戦相手がいない。",
				foundTitle: "対戦相手が見つかった！",
				accept: "承諾",
				decline: "拒否",
				ranked: "ランク",
				unranked: "ノーランク · ポイントなし",
				why: {
					guest: "ゲストのプレイヤーがいる",
					same_network: "同じネットワークにいる",
					pair_limit: "今日この相手と3回ランクマッチをした",
					daily_limit: "1日のランクマッチ上限"
				},
				waitOpp: "相手の承諾を待っている…",
				touch: "タッチ",
				keys: "キーボード／パッド",
				placementTag: "認定戦",
				guestTag: "ゲスト",
				declined: "相手が承諾しなかった · 再検索中",
				youDeclined: "試合を拒否した。",
				penalty: (s) => `最近の試合を拒否したため、${s}秒後に再検索できる。`,
				suspended: "ランクアカウントは確認中（異議申し立てが多すぎる）。他のモードは遊べる。",
				pickTitle: "忍者を選べ",
				pickSub: "相手にはあなたの選択が見えない",
				lock: "決定",
				lockedIn: "決定済み",
				oppPicking: "相手が選択中…",
				oppLocked: "相手が決定した",
				lockedFighter: "一人用でまだ解放されていない",
				costume: "衣装",
				plain: "オリジナルカラー",
				connecting: "相手に接続中…",
				noConnect: "相手につながらなかった。この試合はカウントされない。再検索中…",
				leaveQ: "試合を抜ける？",
				leaveSub: "このランクマッチは負けになる。",
				stay: "続ける",
				leave: "抜ける",
				waitIn: (s) => `相手を待っている… ${s}`,
				away: (s) => `相手がゲームから離れた… ${s}`,
				turning: (s) => `相手がスマホの向きを変えている… ${s}`,
				paused: "ポーズ中",
				confirming: "結果を確認中…",
				win: "あなたの勝ち",
				lose: "あなたの負け",
				draw: "引き分け",
				over: "試合終了",
				delta: (d) => (d >= 0 ? "+" : "−") + Math.abs(d) + " ポイント",
				nc: "この試合はカウントされない",
				disputed: "2台の端末が違う結果を報告した。試合は確認中で、ポイントは変わっていない。",
				ncWhy: {
					desync: "2台の端末で戦いの計算が食い違った（接続の問題）",
					connection: "両プレイヤーの接続が切れた",
					input_mismatch: "2台の端末の入力記録が一致しなかった",
					abandoned: "両プレイヤーが抜けた",
					no_second_report: "相手の結果が届かなかった",
					mixed: "結果が一致しなかった"
				},
				promoted: "昇格！",
				demoted: "降格",
				placementDone: "認定戦完了！",
				pending: "結果はまもなくランキングに反映される。",
				findAgain: "もう一度探す",
				rematch: "再戦",
				rematchWait: "相手を待っている…",
				rematchAsk: "再戦（相手が希望）",
				menu: "メニュー",
				youLeft: "試合を抜けた：負け。",
				oppLeft: "相手が試合を抜けた：あなたの勝ち。",
				silent: "相手の接続が切れた。",
				rounds: (a, b) => `ラウンド ${a} – ${b}`,
				unrankedNote: "ノーランク戦",
				ghostFound: "実在のプレイヤーの影が現れた",
				ghostHouseName: (n) => `道場の影 · ${n}`,
				ghostHouseFound: "道場の影が現れた",
				ghostHouseNote: "道場の典型的な戦い方をするCPU。生身のプレイヤーではない。",
				ghostName: (n) => `${n}の影`,
				ghostTag: "影",
				ghostNote: "この実在プレイヤーの戦い方をまねるCPU。生身のプレイヤーではない。",
				ghostReady: "影の準備ができた",
				ghostLeft: "影との試合を抜けた：負け。",
				aiTag: "AI",
				hallTab: "ランク",
				hallDesc: (g) => `今シーズンのベスト · ランキングに載るにはランクマッチ${g}試合`,
				champs: "王者",
				champOf: (n) => `シーズン${n}王者`,
				noChamps: "まだシーズン王者はいない。",
				me: (p) => `あなたの順位：${p}位。`,
				meNone: "ランクマッチを遊んでランキングに載ろう。",
				empty: "今シーズンはまだ誰もランキングにいない。",
				tierDesc: [
					"歩兵",
					"主を持たぬ侍",
					"武士",
					"主君の親衛",
					"領主",
					"武家の頂点"
				],
				rulesBtn: "ランクマッチの仕組み",
				rulesTitle: "ランクマッチの仕組み",
				rulesSub: "階級、ポイント、シーズン",
				rTiers: "階級",
				rYou: "あなた",
				rNext: (n, name) => `${name}まであと${n}ポイント`,
				rTop: "最上位の階級に到達",
				rPlacing: (a, b) => `認定戦 ${a}/${b}：終わると階級が表示される`,
				rPlacement: "認定戦",
				rPlaceLine: (a, b) => `最初の${a}試合（次のシーズンからは${b}試合）が認定戦。その後に階級が表示される。`,
				rPoints: "ポイント",
				rPointsLines: [
					"勝てばポイントが増え、負ければ減る。引き分けは少しだけ動く。",
					"格上に勝つと多くもらえ、格下に負けると多く減る。",
					"試合を抜けると負け扱い。"
				],
				rSeason: "シーズン",
				rSeasonLine: (d, left) => `シーズンは${d}日間 · ${left}。`,
				rSeasonEnd: (p) => `シーズン終了時、レートは1500との中間まで戻り、認定戦を${p}試合やり直す。最高到達階級はバッジとして残る。`,
				rReward: (list, n) => `シーズン1位の報酬：${list}（ランキングに${n}人以上いる場合）。`,
				rCostumeAll: (x) => `${x}（全忍者分）`,
				rRewardAny: "特別な衣装と称号",
				rBoard: "ランキング",
				rBoardLine: (g) => `載る条件：今シーズンにレート戦${g}試合と認定戦の完了。`,
				rFighters: "忍者",
				rFightersLine: "使えるのは一人用で解放した忍者。",
				aiNote: "オンラインのプレイヤーが少ないときは、実在プレイヤーの戦い方をまねるAIと当たることがある。",
				gotIt: "わかった",
				err: {
					network: "サーバーにつながらなかった。インターネット接続を確認しよう。",
					bad_version: "ゲームの新しいバージョンが出た。ページを再読み込みしよう。",
					busy: "待ち行列がとても混んでいる。少ししてからもう一度。",
					rate_limited: "試行回数が多すぎる。少し待とう。",
					disabled: "ランクマッチは現在オフライン。",
					banned: "このアカウントはランクマッチを遊べない。",
					other: "問題が起きた。もう一度試そう。"
				},
				bg: {
					ru: "検索しながらメニューを見る",
					stopT: "ランク検索をやめますか？",
					stopS: "この対戦を始めると検索は終了します。",
					stopGo: "やめてプレイ",
					keep: "検索を続ける",
					stopped: "ランク検索を中止しました",
					chip: "検索中"
				},
				card: {
					findMatch: "マッチを探す",
					searching: "検索中…",
					resume: "試合に戻る",
					place: (p, n) => `${n}人中${p}位`,
					placeOnly: (p) => `ランキング${p}位`,
					toBoard: (n) => `ランキング入りまであと${n}試合`,
					toBoardSoon: "ランキング入りまであと数試合",
					invite: "足軽から将軍へ：初めてのランクマッチはワンタップで",
					guestInvite: "ポイントを賭けて戦うにはログイン · ゲストはポイントなし",
					nickInvite: "ポイントを賭けて戦うにはニックネームを決めよう",
					winRate: (p) => `勝率${p}%`,
					streakW: (n) => `${n}連勝中`,
					streakL: (n) => `${n}連敗中`,
					peak: (t) => `今季最高：${t}`,
					shields: (n) => `盾 ×${n}`,
					top: "今季トップ3",
					you: "あなた",
					empty: "まだ誰もいません：一番乗りしよう",
					rating: "ポイント"
				}
			},
			upd: {
				ready: "新しいバージョンがあります — タップで更新",
				refresh: "新しいバージョンが出ました — ページを再読み込みしてプレイ",
				close: "閉じる"
			}
		});
		merge(EN.STR, { pass: {
			k: "影",
			lv: "Lv",
			level: (n) => `レベル ${n}`,
			xp: (a, b) => `${a} / ${b} XP`,
			xpMax: (n) => `累計 ${n} XP`,
			plus: (n) => `+${n} XP`,
			name: "シャドウパス",
			season: (n) => `シーズン${n}`,
			left: (d) => `残り${d}日`,
			lastDay: "最終日",
			tier: (t, n) => `ティア ${t}/${n}`,
			ready: (n) => `受け取り可能：${n}`,
			free: "無料",
			bonus: "影",
			bonusAds: "報酬ごとに広告1回",
			bonusWait: (n) => `広告なし：${n}ティア後に解放`,
			claim: "受け取る",
			claimAll: (n) => `すべて受け取る（${n}）`,
			owned: "受け取り済み",
			watch: "広告を見る",
			milestone: "無料",
			opensAt: (t) => `ティア${t}で解放`,
			online: "オンライン接続が必要",
			soon: "新しいティアは近日追加",
			soonXp: "XPはそのまま貯まり続ける",
			close: "閉じる",
			tabs: {
				pass: "パス",
				profile: "プロフィール"
			},
			rows: {
				win: "勝利",
				loss: "参戦",
				rounds: "ラウンド",
				perfect: "パーフェクト",
				rally: "応酬",
				counter: "カウンター",
				parry: "パリィ",
				short: "速攻決着",
				boost: "ブースター",
				daily: "本日初勝利",
				streak: "連続日数",
				clear: "旅路",
				trial: "コンボチャレンジ",
				tutorial: "チュートリアル",
				first: "ようこそボーナス"
			},
			streakN: (n) => `${n}日目`,
			up: "レベルアップ",
			got: "新しい報酬",
			boostName: (n) => `XP ×1.5 · ${n}戦`,
			honorName: (n) => `名誉 +${n}`,
			gotDup: (n) => `入手済み：代わりに${n}戦のあいだ XP ×1.5`,
			boostLeft: (n) => `XP ×1.5 · 残り${n}戦`,
			kinds: {
				cos: "衣装",
				title: "称号",
				badge: "バッジ",
				frame: "フレーム",
				trail: "剣の軌跡",
				boost: "XPブースター",
				honor: "名誉"
			},
			use: "装備",
			inUse: "装備中",
			none: "まだない",
			wearHint: "衣装は忍者選択画面の「カラー」の列で着替えられる。",
			heads: {
				titles: "称号",
				badges: "バッジ",
				frames: "フレーム",
				trails: "剣の軌跡",
				costumes: "衣装",
				seals: "旅路の印"
			},
			total: (n) => `累計 ${n} XP`,
			streak: (n) => `${n}日連続`,
			daily: "本日初勝利：+100 XP",
			dailyDone: "本日初勝利：達成",
			seal: {
				1: "旅路を踏破",
				2: "Menkyo：旅路を2回踏破",
				3: "Kaiden：旅路を3回踏破"
			},
			clears: (n) => `旅路を${n}回踏破`,
			next2: "旅路を2回踏破：Menkyo の衣装と称号",
			next3: "3回踏破：Kaiden の影と称号",
			rank: {
				2: "Menkyo",
				3: "Kaiden"
			},
			cos2: (n) => `${n} · Menkyo カラー`,
			cos3: (n) => `${n} · Kaiden の影`,
			themes: {
				sakura: "桜",
				ember: "残り火",
				frost: "霜",
				jade: "翡翠",
				ash: "灰",
				moon: "月光",
				lotus: "蓮",
				storm: "嵐",
				yami: "闇"
			},
			items: {
				trail_sakura: "桜の軌跡",
				trail_ember: "残り火の軌跡",
				trail_frost: "霜の軌跡",
				trail_jade: "翡翠の軌跡",
				trail_violet: "紫の軌跡",
				trail_gold: "金の軌跡",
				title_novice: "駆け出しの刃",
				title_wanderer: "流浪人",
				title_duelist: "決闘者",
				title_parry: "鉄壁",
				title_ronin: "浪人",
				title_nightblade: "夜の刃",
				title_s1: "シーズン1の影",
				badge_blade: "刃のバッジ",
				badge_moon: "月のバッジ",
				badge_fire: "炎のバッジ",
				badge_snow: "雪のバッジ",
				badge_sakura: "桜のバッジ",
				badge_dragon: "龍のバッジ",
				badge_kage: "影のバッジ",
				frame_bronze: "銅のフレーム",
				frame_silver: "銀のフレーム",
				frame_crimson: "紅のフレーム",
				frame_jade: "翡翠のフレーム",
				frame_gold: "金のフレーム"
			}
		} });
		merge(EN.STR, { pass: {
			kinds2: {
				pose: "勝利ポーズ",
				hitfx: "ヒットエフェクト",
				slash: "返し斬り",
				aura: "気のオーラ",
				ko: "KOフィニッシュ",
				card: "ネームカード",
				arena: "ステージ変化",
				music: "メニュー曲",
				rkey: "鍵",
				akey: "鍵",
				ticket: "チケット",
				shield: "シールド"
			},
			items2: {
				key_rival: "挑戦の鍵",
				key_arena: "ステージの鍵",
				ticket_trial: "お試しチケット",
				shield: "ランクシールド"
			},
			heads2: {
				title: "称号",
				flair: "バトル装飾",
				arenas: "ステージ変化",
				music: "メニュー曲",
				items: "アイテム"
			},
			profile: "プロフィール",
			profileSub: "称号 · 衣装 · 装飾",
			passTab: "シャドウパス",
			tapEquip: "タップで装備",
			plain: "通常",
			usual: "いつもの",
			noneYet: "シャドウパスで手に入る",
			shields: (n, m) => `ランクシールド ${n}/${m}`,
			shieldHelp: "ランクマッチで負けてもポイントが減らない。1日1回、自動で発動。",
			tickets: (n) => `お試しチケット：${n}`,
			ticketHelp: "未解放の忍者をCPU戦3回で試せる。キャラ選択でその忍者をタップ。",
			useTicket: (n) => `お試しチケット · ${n}戦`,
			useTicketSub: (n) => `所持 ${n}`,
			ticketLeft: (n) => `お試し：残り${n}戦`,
			keyRival: (name) => `挑戦が解放された：${name}`,
			keyArena: (name) => `ステージが解放された：${name}`,
			keyHonor: (n) => `解放できるものはもうない：名誉 +${n}`,
			shieldGot: (n, m) => `ランクシールド：${n}/${m}`,
			shieldFull: (n) => `シールドは満杯：代わりに名誉 +${n}`,
			shieldOff: (n) => `ここにランクマッチはない：代わりに名誉 +${n}`,
			shieldUsed: "シールド発動：ポイントは減らない",
			rankedHonor: (n) => `名誉 +${n}`,
			variant: "変化",
			newTag: "新着",
			newN: (n) => `新着 ${n}件`,
			headUnlocks: "忍者とステージ",
			headRewards: "ランク報酬",
			flair: {
				pose_tenchi: "天地の構え",
				pose_rei: "礼",
				pose_hiza: "膝つき残心",
				pose_katsugi: "担ぎ",
				pose_kissaki: "次はお前だ",
				hitfx_kinpaku: "金箔の一撃",
				hitfx_aizome: "藍染の墨",
				hitfx_sakura: "桜の舞",
				hitfx_kitsunebi: "狐火",
				hitfx_raijin: "雷神の火花",
				slash_kin: "金の刃",
				slash_sumi: "墨の筆",
				slash_hana: "花びらの風",
				slash_rai: "雷の斬撃",
				aura_kitsunebi: "狐火のオーラ",
				aura_raiun: "雷雲のオーラ",
				aura_hana: "花のオーラ",
				aura_gekko: "月光のオーラ",
				ko_enso: "円相の決め",
				ko_hanafubuki: "花吹雪",
				ko_raiko: "雷光",
				ko_mikazuki: "三日月",
				card_seigaiha: "青海波",
				card_yozakura: "夜桜",
				card_ryu: "龍の漆",
				card_tsukiyo: "月夜の松",
				card_asanoha: "麻の葉の金",
				arena_temple_snow: "雪の寺",
				arena_rain_moon: "月下の竹林",
				arena_snow_night: "夜の雪峰",
				arena_market_rain: "雨の夜市",
				music_haru: "春の庭",
				music_yuki: "雪の月",
				music_matsuri: "祭りの夜",
				pass1_akane: "月影の装束"
			}
		} });
		void dec;
		void fmtTime;
		void num;
	};
	(ND.JOURNEY_COPY || (ND.JOURNEY_COPY = {}))["ja"] = {
		ui: [
			"キャラクターの旅路",
			"最後の好敵手",
			"任意の熟練目標",
			"この戦いに勝てば星を獲得。",
			"熟練の星を獲得",
			"星は獲得できず · 再挑戦で狙おう",
			"熟練の星",
			"8つ中6つの星を集めて旅路を終えると、称号と継承カラーが手に入る。星は再挑戦しても引き継がれる。",
			"オリジナルカラー",
			"継承カラー",
			"外見",
			"熟練の星を6つ集めて、この忍者の旅路を終えよう。",
			"以前の旅路と報酬はそのまま残っている。もう一度遊んで新しい道を探ろう。",
			"Shuraへの挑戦：3人の忍者の旅路を踏破しよう。",
			"この決闘に勝って解放",
			"旅路を踏破",
			"章"
		],
		goals: [
			"パリィ",
			"カウンターヒット",
			"強攻撃ヒット",
			"蹴りヒット",
			"空中ヒット",
			"ダッシュ攻撃ヒット",
			"コンボ3発目ヒット",
			"飛び道具ヒット",
			"気の技ヒット",
			"ガード崩し"
		],
		titles: [
			"紅の誓い",
			"縛られぬ風",
			"山の心",
			"冬の足跡",
			"月下の花",
			"折れぬ旗",
			"素顔の勇気",
			"静かな約束",
			"鎖を解かれた虎",
			"開かれた手",
			"静かなそよ風",
			"遥かな地平",
			"二度目の夜明け"
		],
		endings: [
			"AkaneはRenの前で刃を下ろす。流派は復讐ではなく、教えることで再興される。",
			"AoiはAkaneとの古い決着をつけ、対等な者として寺を去る。自分の道を自ら選べる身となって。",
			"KuroとTetsuは武器を置く。山道は再び村人たちに開かれた。",
			"YukiはHanaが差し出した手を取る。初めて、誰かの隣に足跡を残す。",
			"HanaはYukiを灯籠祭りへ連れ戻す。最後の舞には、友の居場所がある。",
			"TetsuはKuroの敬意を勝ち取り、峠に旗を立てる。もう一人の村人も追い返されはしない。",
			"RenはKageの策を打ち破り、自らの面を外す。もう恐れられなくても、声は届く。",
			"KageはRenに素顔を見せ、姿を消す。今度こそ、その約束は影よりも長く残る。",
			"ToraはJinの棒の隣に鎖を置く。川の渡しは、もはや誰のものでもない。",
			"JinはToraの命を奪わずに止める。滝のほとりで、新しい弟子が最初の教えを請う。",
			"MaiはTsubameの最後の矢を扇で受け止める。二人の勝負は恨みではなく、一礼で幕を閉じる。",
			"TsubameはついにMaiの風を読む。最後の矢を放たぬまま、新たな地平へと向かう。",
			"Shuraは冠を脱ぎ、Akaneと向き合う。もはや敗北が彼を決めることはない。次の教えは夜明けに始まる。"
		]
	};
	if (ND.i18n && ND.i18n.loaded) ND.i18n.loaded("ja");
})(window.ND = window.ND || {});
