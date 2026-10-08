(function(ND) {
	"use strict";
	(ND.I18N_CATALOGS || (ND.I18N_CATALOGS = {}))["vi"] = function(I, EN) {
		const merge = I.merge;
		const num = (n) => I.num(n);
		const dec = (x) => I.dec(x);
		const fmtTime = (s) => I.time(s);
		merge(EN.STR, {
			menu: {
				brand: (nc, na) => `${nc} đấu sĩ, ${na} đấu trường và một bậc thầy ẩn mặt. Đấu kiếm thời gian thực, khóa kiếm, gạt đòn, phá tư thế, tuyệt kỹ ki và vật lý ragdoll.`,
				arcade: "Arcade",
				arcadeDesc: "Lần lượt hạ từng đối thủ khi độ khó tăng dần, cuối đường là một bậc thầy ẩn mặt. Thắng để mở khóa ninja và đấu trường mới.",
				arcadeProg: (best, c, ct, a, at) => `${best ? "Cao nhất " + num(best) + " · " : ""}${c}/${ct} ninja · ${a}/${at} đấu trường đã mở`,
				train: "Luyện tập",
				trainDesc: "Tập tự do với hình nộm hoặc học từng bước",
				trainFree: "Tự do",
				trainTut: "Hướng dẫn",
				watchShort: "Hai ninja ngẫu nhiên, AI Huyền thoại",
				specialKey: "Tuyệt kỹ ki (đầy ki)",
				single: "Đấu đơn",
				singleDesc: "Đấu với máy hoặc hai người"
			},
			sel: {
				title: {
					"2p": "Chọn ninja của bạn",
					cpu: "Chọn ninja của bạn",
					arcade: "Arcade · Chọn ninja",
					train: "Luyện tập · Chọn ninja",
					tutorial: "Hướng dẫn · Chọn ninja",
					tourney: "Giải đấu tháng · Chọn ninja",
					dan: "Thi Dan · Chọn ninja"
				},
				who1: {
					"2p": "Người chơi 1 · A / D để chọn, F để xác nhận",
					def: "Bạn · A / D để chọn, F để xác nhận"
				},
				who2: {
					"2p": "Người chơi 2 · ← / → để chọn, K để xác nhận",
					cpu: "Đối thủ (máy) · ← / → để chọn",
					train: "Hình nộm · ← / → để chọn"
				},
				go: {
					def: "Vào trận",
					arcade: "Bắt đầu Arcade",
					train: "Bắt đầu tập",
					tutorial: "Bắt đầu học",
					tourney: "Vào giải",
					dan: "Vào thi"
				},
				random: "Ngẫu nhiên",
				arena: "Đấu trường",
				locked: "Đã khóa",
				lockMsg: (name, hint) => `${name} đang khóa · ${hint}`,
				keyHint: "<kbd>Enter</kbd> bắt đầu · <kbd>⌫</kbd> quay lại"
			},
			hint: {
				wins: (n, cur) => `Thắng ${n} trận ở Arcade (${Math.min(cur, n)}/${n})`,
				clear: "Phá đảo Arcade một lần",
				boss: "Hạ trùm cuối ở Arcade",
				arena: "Thắng một trận ở đấu trường này trong Arcade"
			},
			toast: {
				newChar: (name) => `Mở khóa đấu sĩ mới: ${name}`,
				newArena: (name) => `Mở khóa đấu trường mới: ${name}`,
				newBest: (s) => `Kỷ lục mới: ${num(s)} điểm`,
				lesson: (t) => `Xong bài học: ${t}`,
				tutDone: "Hoàn thành hướng dẫn!",
				perf: "Đã giảm đồ họa để chạy mượt hơn"
			},
			vs: {
				stage: (i, n) => `Trận ${i} / ${n}`,
				boss: "Trận cuối",
				go: "Chiến!",
				quit: "Thoát Arcade",
				keys: "<kbd>Enter</kbd> / <kbd>F</kbd> bắt đầu · <kbd>⌫</kbd> thoát",
				unknown: "?"
			},
			hud: {
				you: "BẠN",
				cpu: "MÁY",
				dummy: "HÌNH NỘM",
				stage: (i, n) => `${i}/${n}`,
				boss: "TRÙM CUỐI",
				inf: "∞",
				lockSolo: "Bấm liên tục F / K!",
				lockDuo: "Bấm liên tục nhẹ hoặc mạnh!"
			},
			end: {
				rematch: "Tái đấu",
				change: "Đổi đấu sĩ",
				menu: "Menu chính",
				winTitle: "Chiến thắng thuộc về bạn",
				winSub: (i, n, pts) => `Vượt trận ${i}/${n} · +${num(pts)} điểm`,
				next: "Trận tiếp",
				bossNext: "Tiến tới hồi kết",
				lossTitle: "Thất bại",
				lossSub: (name) => `Lần này ${name} nhỉnh hơn. Thử lại nhé.`,
				retry: "Thử lại",
				quit: "Thoát Arcade"
			},
			ending: {
				head: "Kết thúc",
				rows: {
					fights: "Số trận",
					time: "Tổng thời gian",
					retries: "Lần thử lại",
					perfect: "Hiệp hoàn hảo",
					score: "Điểm",
					best: "Cao nhất"
				},
				newBest: "Kỷ lục mới!",
				menu: "Menu chính",
				again: "Chơi lại",
				unlocked: "Đã mở khóa",
				fightPts: "Điểm trận đấu",
				bonus: "Thưởng phá đảo"
			},
			score: {
				hud: "ĐIỂM",
				rows: {
					hit: "Đòn trúng",
					combo: "Combo",
					counter: "Phản đòn",
					defense: "Phòng thủ",
					pressure: "Áp đảo",
					special: "Tuyệt kỹ ki",
					round: "Chiến thắng",
					perfect: "Hoàn hảo",
					hp: "Máu còn lại",
					time: "Thưởng thời gian"
				},
				total: "Điểm trận",
				diff: (name, m) => `gồm ${name} ×${dec(m)}`,
				best: (s) => `Cao nhất của bạn: ${num(s)}`,
				newBest: "Kỷ lục mới!",
				arcadeTotal: (s) => `Tổng Arcade: ${num(s)}`,
				lossNote: (s, pen) => `Lượt này không tính · Tổng Arcade ${num(s)} · mỗi lần thử lại −${num(pen)}`,
				clearBonus: (c, n) => `+${num(c)}${n ? " · không thử lại +" + num(n) : ""}`,
				lossCpu: "Thua · chỉ trận thắng mới lên bảng",
				cpuBoardHint: "Trận thắng ở độ khó Huyền thoại sẽ lên bảng xếp hạng"
			},
			lb: {
				menu: "Bảng xếp hạng",
				menuDesc: "Kỷ lục Arcade và Huyền thoại",
				title: "Bảng xếp hạng",
				back: "Quay lại",
				boards: {
					arcade: "Arcade",
					cpu_efsane: "Máy Huyền thoại"
				},
				boardDesc: {
					arcade: "Tổng điểm một lượt Arcade đã phá đảo",
					cpu_efsane: "Điểm một trận thắng máy Huyền thoại"
				},
				all: "Tất cả",
				status: {
					loading: "Đang tải…",
					online: "Bảng xếp hạng trực tuyến",
					readonly: "Bảng trực tuyến · chỉ xem",
					local: "Bảng xếp hạng trên máy",
					error: "Lỗi · bảng trên máy",
					offline: "Ngoại tuyến · bảng trên máy"
				},
				empty: "Chưa có điểm nào. Hãy là người đầu tiên!",
				loadErr: "Không tải được bảng xếp hạng.",
				you: "Bạn",
				youTag: "bạn",
				player: "Người chơi",
				nick: "Biệt danh",
				nickPh: "Biệt danh của bạn",
				nickSave: "Lưu",
				nickEdit: "Đổi",
				nickAsk: "Biệt danh cho bảng trên máy:",
				saving: "Đang lưu…",
				savedOnline: (r) => `Hạng trực tuyến: #${r}`,
				savedOnlineNoRank: "Đã lưu lên bảng trực tuyến",
				savedOnlineAll: (r) => `Hạng mọi thời đại: #${r}`,
				platSignIn: "Đăng nhập để gửi điểm lên mạng",
				platPending: "Đã lưu trên máy này · đăng nhập để gửi lên bảng trực tuyến",
				savedOnlineGap: (r, g) => `Hạng trực tuyến: #${r} · còn ${g} điểm nữa vào top 10`,
				reason: {
					needName: "Chọn biệt danh để vào bảng trực tuyến",
					offline: "Mất kết nối — điểm đã được giữ, sẽ gửi khi bạn có mạng lại",
					rate: "Gửi quá nhiều — điểm sẽ được gửi ngay sau đây",
					daily: "Đã hết lượt gửi trong ngày — điểm chỉ lưu trên máy",
					week: "Tháng đã kết thúc — điểm này không tính cho tháng mới",
					invalid: "Điểm không hợp lệ"
				},
				nickErr: {
					nick_length: "Biệt danh phải dài 3–16 ký tự",
					nick_chars: "Chỉ dùng chữ cái, chữ số, dấu cách và _ . - (ít nhất một chữ cái)",
					nick_bad: "Biệt danh này không được phép, hãy chọn tên khác",
					rate_limited: "Đợi một chút rồi thử lại"
				},
				nickErrDef: "Không lưu được biệt danh",
				nickAskOnline: "Biệt danh cho bảng trực tuyến:",
				savedLocal: (r) => r ? `#${r} trên bảng của máy này` : "Đã lưu vào bảng trên máy",
				rejected: "Không lưu được điểm — chỉ có trên bảng của máy",
				quota: "Bảng trực tuyến đã đầy — điểm chỉ lưu trên máy",
				open: "Bảng xếp hạng",
				keys: "<kbd>←</kbd> <kbd>→</kbd> bảng · <kbd>↑</kbd> <kbd>↓</kbd> ninja · <kbd>⌫</kbd> quay lại"
			},
			bz: {
				back: "Quay lại",
				toMenu: "Menu chính",
				you: "Bạn",
				youTag: "bạn",
				newBest: "Kỷ lục mới!",
				seeResult: "Xem kết quả",
				resetIn: "Làm mới sau",
				left: (ms) => {
					const t = Math.floor(ms / 1e3), d = Math.floor(t / 86400), hh = Math.floor(t % 86400 / 3600), mm = Math.floor(t % 3600 / 60), ss = t % 60;
					return d ? `${d} ngày ${hh}g ${mm}p` : hh ? `${hh}g ${mm}p` : `${mm}p ${ss}s`;
				},
				leftShort: (ms) => {
					const t = Math.floor(ms / 6e4), d = Math.floor(t / 1440), hh = Math.floor(t % 1440 / 60), mm = t % 60;
					return d ? `${d} ngày ${hh}g` : hh ? `${hh}g ${mm}p` : `${mm}p`;
				},
				weekName: (m, y) => `${[
					"Tháng 1",
					"Tháng 2",
					"Tháng 3",
					"Tháng 4",
					"Tháng 5",
					"Tháng 6",
					"Tháng 7",
					"Tháng 8",
					"Tháng 9",
					"Tháng 10",
					"Tháng 11",
					"Tháng 12"
				][m - 1] || m}/${y}`,
				monthName: (m) => [
					"Tháng 1",
					"Tháng 2",
					"Tháng 3",
					"Tháng 4",
					"Tháng 5",
					"Tháng 6",
					"Tháng 7",
					"Tháng 8",
					"Tháng 9",
					"Tháng 10",
					"Tháng 11",
					"Tháng 12"
				][m - 1] || String(m),
				rank: (r) => r <= 0 ? "Chưa xếp hạng" : r <= 10 ? `Kyu ${11 - r}` : `Dan ${r - 10}`,
				fightOf: (i, n) => `Trận ${i}/${n}`,
				hpBonus: (p) => `Máu đối thủ +${p}%`,
				mirrorOpp: "Gương · chính ninja của bạn",
				suddenSub: "Một hiệp · ai ngã trước là thua",
				rows: {
					fights: "Trận thắng",
					time: "Thời gian",
					fightPts: "Điểm trận đấu",
					stage: "Thưởng vòng",
					clear: "Thưởng phá đảo",
					total: "Điểm giải",
					weekBest: "Cao nhất tháng này"
				},
				mods: {
					rally2x: {
						n: "Phản Kích Dồn Dập",
						d: "Sát thương phản đòn ×2"
					},
					fullKi: {
						n: "Đầy Ki",
						d: "Mỗi hiệp bắt đầu với đầy ki"
					},
					sudden: {
						n: "Đột Tử",
						d: "Một hiệp; hai bên bắt đầu với nửa máu"
					},
					mirror: {
						n: "Gương",
						d: "Đối thủ là chính ninja của bạn"
					},
					parryOnly: {
						n: "Chỉ Phản Đòn",
						d: "Đòn thường gây 25% sát thương; phản đòn ×1,5"
					},
					posture2x: {
						n: "Tư Thế Mong Manh",
						d: "Sát thương tư thế ×2: thế đỡ vỡ rất nhanh"
					},
					shuriken3x: {
						n: "Bão Phi Tiêu",
						d: "Phi tiêu gấp ba"
					},
					kiRush: {
						n: "Lũ Ki",
						d: "Ki đầy nhanh gấp đôi"
					},
					glass: {
						n: "Kiếm Pha Lê",
						d: "Mọi sát thương ×1,5"
					}
				},
				menu: {
					tour: "Giải đấu tháng",
					dan: "Thi Dan",
					hall: "Sảnh Vinh Danh",
					tourRank: (p, left) => `Tháng này: #${p} · làm mới sau ${left}`,
					tourBest: (b, left) => `Cao nhất ${b} · làm mới sau ${left}`,
					tourNew: (left) => `8 trận như nhau cho mọi người · làm mới sau ${left}`,
					danRank: (name, next) => next ? `Cấp của bạn: ${name} · tiếp theo: ${next}` : `Cấp của bạn: ${name} · bạn đã ở đỉnh cao`,
					danNew: "20 bài thi từ Kyu 10 đến Dan 10",
					hallRank: (p) => `Tháng này #${p} · kỷ lục`,
					hallDesc: "Top 10 tháng này và kỷ lục mọi thời đại",
					nick: (n) => n ? `Biệt danh: ${n}` : "Chọn biệt danh",
					champTitle: "Top 10 tháng này",
					champLocal: "Top 10 trên máy này",
					champEmpty: "Hãy là người đầu tiên trên bảng tháng này",
					champLoading: "Đang tải các cao thủ…",
					champAll: "Top 10 mọi thời đại",
					champAllEmpty: "Hãy là người đầu tiên trên bảng trực tuyến",
					champLast: (n) => `Vô địch tháng trước: ${n}`,
					champOpen: "mở bảng xếp hạng tháng"
				},
				t: {
					title: "Giải đấu tháng",
					head: "Giải đấu",
					runNote: (s, st) => `Tổng điểm giải: ${num(s)} (gồm +${num(st)} mỗi trận thắng)`,
					lossSub: (name, won) => `${name} đã chặn bước bạn · ${won} trận thắng`,
					lossNote: (s) => `Trận này không tính · điểm giải ${num(s)}`,
					quit: "Kết thúc giải",
					myBest: (b, a) => `Cao nhất tháng này: ${b} điểm · ${a} lượt thử`,
					noTry: "Tháng này bạn chưa thử lượt nào.",
					place: (p, t) => t ? `#${p} / ${t}` : `#${p}`,
					rules: (n, clear, stage) => `${n} trận; đối thủ, đấu trường và luật như nhau cho mọi người. Thua một trận là hết lượt; thử bao nhiêu lần cũng được và lượt tốt nhất được tính. Mỗi trận thắng +${stage}, thắng hết +${clear}.`,
					start: "Chọn ninja và bắt đầu",
					again: "Thử lại",
					go: "Vào giải",
					clearTitle: "Chinh phục giải đấu",
					overTitle: "Hết lượt",
					savedToast: (s) => `Đã lưu điểm giải: ${s}`
				},
				d: {
					title: "Thi Dan",
					head: "Thi Dan",
					sub: "Vượt qua từng bài thi để thăng cấp. Cấp của bạn hiện cạnh tên trên bảng xếp hạng.",
					trialOf: (n) => `Bài thi ${n}`,
					runNote: (i, n) => `Bài thi: thắng ${i}/${n} trận`,
					lossSub: (name) => `${name} đã đánh trượt bài thi của bạn.`,
					lossNote: "Trượt bài thi",
					quit: "Bỏ thi",
					yourRank: "Cấp của bạn",
					bestWas: (n) => `Cao nhất: ${n}`,
					ladder: "Thang cấp",
					nextTrial: (n) => `Tiếp theo: bài thi ${n}`,
					fights: (n) => `${n} trận`,
					bossLast: "Trận cuối: Shura",
					strikes: (left, max) => `Cơ hội: ${left}/${max} · trượt ${max} lần sẽ bị hạ một cấp`,
					safe: "Ở cấp này, thi trượt không bị hạ cấp.",
					maxed: "Đỉnh cao: Dan 10",
					maxedSub: "Tên bạn đứng đầu bảng Dan.",
					start: "Chọn ninja và vào thi",
					next: "Bài thi tiếp",
					go: "Vào thi",
					promoted: (n) => `Thăng cấp: ${n}`,
					demoted: (n) => `Hạ cấp: ${n}`,
					failed: "Trượt bài thi",
					promotedSub: (a, b) => `${a} → ${b}`,
					demotedSub: "Ba lần thi trượt. Leo lại nào!",
					tryAgain: "Thử lại đi; cấp của bạn vẫn an toàn.",
					toast: (n) => `Cấp mới: ${n}`,
					leftToast: "Đã bỏ thi: tính là trượt"
				},
				hall: {
					title: "Sảnh Vinh Danh",
					tabs: {
						week: { n: "Tháng này" },
						alltime: { n: "Mọi thời đại" },
						archive: { n: "Nhà vô địch" },
						chars: { n: "Ninja" },
						dan: { n: "Dan" }
					},
					desc: {
						alltime: "Thành tích tốt nhất mọi thời đại của Giải đấu tháng",
						archive: "Top 10 của mỗi tháng đã qua được khắc mãi tại đây",
						chars: "Người giữ kỷ lục của từng ninja · chạm vào ninja để xem top 20",
						dan: "Cấp cao nhất"
					},
					loading: "Đang tải…",
					error: "Không tải được bảng xếp hạng.",
					retry: "Thử lại",
					empty: "Chưa có ai ở đây. Hãy là người đầu tiên!",
					emptyDan: "Chưa có người chơi nào có cấp.",
					emptyArchive: "Chưa có tháng nào kết thúc. Danh hiệu bắt đầu từ giải tháng 10/2026; nhà vô địch sẽ được khắc tên khi giải kết thúc vào ngày 1/11.",
					emptyArchiveLocal: "Máy này chưa có tháng nào kết thúc.",
					anon: "Người chơi",
					meTop: (p, s) => `Bạn: #${p} · ${s} điểm · bạn đang trong top 10!`,
					meGap: (p, g, s) => `Bạn: #${p} · ${s} điểm · còn ${g} điểm nữa vào top 10`,
					meNone: "Tháng này bạn chưa có điểm.",
					meDan: (p, n) => `Bạn: #${p} · ${n}`,
					meDanLocal: (n) => `Cấp của bạn: ${n}`,
					meNoDan: "Chưa có cấp. Bài thi đầu tiên: Kyu 10.",
					noRecord: "Chưa có kỷ lục",
					allNinjas: "Tất cả ninja",
					pending: (n) => `Mục đang chờ gửi: ${n}`,
					classic: "Bảng Arcade · Huyền thoại"
				},
				ttl: {
					champ: "Vô địch tháng",
					finalist: "Á quân",
					reward: "Từ giải tháng 10/2026, top 3 mỗi tháng nhận một danh hiệu vĩnh viễn. Nhà vô địch còn nhận màu Vô địch độc quyền cho ninja đã dùng. Danh hiệu cần ít nhất 5 người chơi trong tháng.",
					hall: "Từ tháng 10/2026: top 3 mỗi tháng nhận danh hiệu vĩnh viễn (tối thiểu 5 người chơi) · nhà vô địch nhận màu Vô địch",
					local: "Điểm giải đấu của bạn được lưu trên máy này.",
					colors: "Màu Vô địch",
					how: "Vô địch một Giải đấu tháng với ninja này",
					unlocked: (name) => `Vô địch tháng! Đã mở màu Vô địch của ${name}`,
					newTitle: (t) => `Danh hiệu mới: ${t}`
				}
			},
			train: {
				title: "Luyện tập",
				tutTitle: "Hướng dẫn",
				dummy: "Hình nộm",
				beh: {
					idle: "Đứng yên",
					guard: "Đỡ",
					attack: "Tấn công",
					counter: "Phản đòn"
				},
				infHp: "Máu vô hạn",
				fullKi: "Đầy ki",
				reset: "Đặt lại vị trí",
				hide: "Ẩn",
				show: "Bảng",
				moves: "Danh sách chiêu",
				lessons: "Bài học",
				lessonOf: (i, n) => `Bài ${i}/${n}`,
				done: "Hoàn thành hướng dẫn! Chỉnh hình nộm theo ý bạn và tập tự do.",
				progress: (a, b) => `${a}/${b}`,
				keysHelp: "<kbd>1</kbd>–<kbd>4</kbd> hình nộm · <kbd>⌫</kbd> đặt lại · <kbd>H</kbd> bảng",
				specialFallback: {
					kanji: "影斬り",
					name: "Chém Bóng",
					desc: "Một nhát chém nhanh như chớp, xuyên thẳng qua đối thủ.",
					tip: ""
				},
				kiFull: "đầy ki",
				counterTip: "Cách đối phó"
			},
			moves: [
				[
					"<kbd>A</kbd><kbd>D</kbd>",
					"Đi",
					"nhấn đúp: lướt"
				],
				[
					"<kbd>W</kbd>",
					"Nhảy",
					""
				],
				[
					"<kbd>F</kbd><kbd>F</kbd><kbd>F</kbd>",
					"Combo nhẹ ×3",
					"đòn thứ ba đẩy lùi"
				],
				[
					"<kbd>G</kbd>",
					"Chém mạnh",
					"quật ngã"
				],
				[
					"<kbd>R</kbd>",
					"Đá",
					"ép thế đỡ, tăng thanh tư thế"
				],
				[
					"<kbd>S</kbd>+<kbd>R</kbd>",
					"Quét chân",
					"quật ngã · nhảy qua"
				],
				[
					"Lùi+<kbd>R</kbd>",
					"Đá xoay",
					"chậm, mạnh, phá thế thủ"
				],
				[
					"Tới+<kbd>R</kbd>",
					"Đá vào tay",
					"lúc vung kiếm: đá văng kiếm"
				],
				[
					"<kbd>W</kbd>›<kbd>R</kbd>",
					"Phi cước",
					"trên không"
				],
				[
					"←→+<kbd>R</kbd>",
					"Cước riêng",
					"mỗi ninja một chiêu"
				],
				[
					"<kbd>R</kbd>",
					"Hất kiếm lên",
					"tay không, cạnh kiếm của mình"
				],
				[
					"<kbd>T</kbd>",
					"Phi tiêu",
					""
				],
				[
					"<kbd>Shift</kbd>",
					"Lướt",
					"Shift trái"
				],
				[
					"<kbd>Shift</kbd>›<kbd>F</kbd>",
					"Chém lướt",
					""
				],
				[
					"<kbd>W</kbd>›<kbd>F</kbd>",
					"Chém trên không",
					""
				],
				[
					"<kbd>W</kbd>›<kbd>G</kbd>",
					"Bổ nhào",
					"đòn mạnh trên không"
				],
				[
					"<kbd>S</kbd>",
					"Đỡ",
					"giữ"
				],
				[
					"<kbd>S</kbd>!",
					"Gạt đòn",
					"bấm ngay trước khi trúng đòn"
				],
				[
					"<kbd>F</kbd>",
					"Phản đòn thẳng",
					"sau khi đỡ/gạt"
				],
				[
					"Tới+<kbd>F</kbd>",
					"Quét chân",
					"phản đòn · vào chân"
				],
				[
					"Lùi+<kbd>F</kbd>",
					"Vòng sau",
					"phản đòn · lách qua đối thủ"
				],
				[
					"<kbd>G</kbd>",
					"Phản đòn mạnh",
					"phản đòn · quật ngã"
				],
				[
					"Giằng co",
					"Giằng co",
					"chặn phản đòn rồi phản lại; phản đòn thứ 3 của bạn là đòn kết liễu"
				],
				[
					"<kbd>F</kbd>/<kbd>G</kbd>!!",
					"Khóa kiếm",
					"bấm liên tục khi khóa để đẩy lùi đối thủ"
				]
			],
			touch: {
				btn: {
					light: "ĐÁNH",
					heavy: "MẠNH",
					kick: "ĐÁ",
					guard: "▼",
					dodge: "LƯỚT",
					throw: "PHI TIÊU",
					special: "KI",
					up: "NHẢY",
					down: "ĐỠ"
				},
				lock: "Bấm liên tục ĐÁNH!",
				replaySkip: "chạm để bỏ qua",
				rotateTitle: "Xoay ngang màn hình",
				rotateText: "Shadow Duel chơi ở màn hình ngang. Bạn vẫn dùng menu được ở màn hình dọc.",
				rotMenu: "Menu chính",
				need2p: "Cần bàn phím / tay cầm",
				need2pToast: "Kết nối bàn phím hoặc tay cầm để chơi hai người",
				hints: "Gợi ý",
				pause: "Tạm dừng",
				sel: {
					who1: "Bạn · chạm vào ninja của bạn",
					who2: "Đối thủ (máy) · chạm để chọn",
					who2train: "Hình nộm · chạm để chọn"
				},
				opt: {
					title: "Điều khiển cảm ứng",
					layout: "Bố cục",
					simple: "Đơn giản",
					full: "Đầy đủ",
					size: "Cỡ",
					sizes: {
						s: "Nhỏ",
						m: "Vừa",
						l: "Lớn"
					},
					hand: "Nút bấm",
					right: "Phải",
					left: "Trái",
					assist: "Hỗ trợ dễ chơi",
					haptic: "Rung",
					fullscreen: "Toàn màn hình",
					exitFullscreen: "Thoát toàn màn hình",
					note: "Đơn giản: 4 nút lớn. Đầy đủ: thêm đá và phi tiêu. Hỗ trợ dễ chơi: giữ ĐÁNH là combo tự nối tiếp, và chạm nhanh ▼ vẫn đủ lâu để gạt đòn. Nó chỉ giúp chạm dễ hơn; luật và điểm như nhau cho mọi người.",
					fullNote: "Nút ĐÁ và PHI TIÊU có trong bố cục Đầy đủ (Cài đặt → Điều khiển)."
				},
				help: "<div class=\"th-grid\">" + "<div><h3>D-pad</h3><dl>" + "<dt><i class=\"tb\">◀ ▶</i></dt><dd>Giữ: đi</dd>" + "<dt><i class=\"tb\">▲</i></dt><dd>Chạm: nhảy</dd>" + "<dt><i class=\"tb tb-guard\">▼</i></dt><dd>Giữ: đỡ. Chạm ngay trước khi trúng đòn: gạt đòn</dd>" + "<dt><i class=\"tb\">▶▶</i></dt><dd>Nhấn đúp: lướt</dd>" + "</dl></div>" + "<div><h3>Nút bấm</h3><dl>" + "<dt><i class=\"tb tb-light\">ĐÁNH</i></dt><dd>Chém. Chạm liên tục: combo. Giữ tới hoặc lùi khi chạm: các kỹ thuật khác</dd>" + "<dt><i class=\"tb\">MẠNH</i></dt><dd>Chém mạnh. Tới + MẠNH hất tung đối thủ</dd>" + "<dt><i class=\"tb\">LƯỚT</i></dt><dd>Lướt (theo hướng ◀ ▶ đang giữ, nếu không thì lùi lại)</dd>" + "<dt><i class=\"tb ki\">KI</i></dt><dd>Tuyệt kỹ ki: nút sáng lên khi đầy ki</dd>" + "<dt><i class=\"tb\">ĐÁ</i> <i class=\"tb\">PHI TIÊU</i></dt><dd>Bố cục Đầy đủ: đá và phi tiêu</dd>" + "</dl></div></div>",
				note: "Bạn có thể bấm nhiều nút cùng lúc: giữ <i class=\"tb tb-guard\">▼</i> để đỡ và chạm <i class=\"tb tb-light\">ĐÁNH</i> bằng ngón cái kia. Nút <b>II</b> trên cùng màn hình để tạm dừng; bố cục, cỡ nút và chế độ tay trái nằm trong <b>Cài đặt</b>. Dùng bàn phím hoặc tay cầm thì điều khiển tự chuyển sang thiết bị đó.",
				keysHelp: ""
			},
			movesTouch: [
				[
					"<i class=\"tb\">◀ ▶</i>",
					"Đi",
					"giữ · nhấn đúp: lướt"
				],
				[
					"<i class=\"tb\">▲</i>",
					"Nhảy",
					"chạm"
				],
				[
					"<i class=\"tb tb-light\">ĐÁNH</i>×3",
					"Combo ba đòn",
					"chạm liên tục; đòn thứ ba đẩy lùi"
				],
				[
					"<i class=\"tb\">MẠNH</i>",
					"Chém mạnh",
					"quật ngã"
				],
				[
					"<i class=\"tb\">ĐÁ</i>",
					"Đá",
					"ép thế đỡ, tăng thanh tư thế · bố cục Đầy đủ"
				],
				[
					"<i class=\"tb tb-guard\">▼</i>" + "+" + "<i class=\"tb\">ĐÁ</i>",
					"Quét chân",
					"quật ngã · nhảy qua"
				],
				[
					"Lùi+" + "<i class=\"tb\">ĐÁ</i>",
					"Đá xoay",
					"chậm, mạnh, phá thế thủ"
				],
				[
					"Tới+" + "<i class=\"tb\">ĐÁ</i>",
					"Đá vào tay",
					"lúc vung kiếm: đá văng kiếm"
				],
				[
					"<i class=\"tb\">▲</i>" + "›" + "<i class=\"tb\">ĐÁ</i>",
					"Phi cước",
					"trên không"
				],
				[
					"←→+" + "<i class=\"tb\">ĐÁ</i>",
					"Cước riêng",
					"mỗi ninja một chiêu"
				],
				[
					"<i class=\"tb\">ĐÁ</i>",
					"Hất kiếm lên",
					"tay không, cạnh kiếm của mình"
				],
				[
					"<i class=\"tb\">PHI TIÊU</i>",
					"Phi tiêu",
					"bố cục Đầy đủ"
				],
				[
					"<i class=\"tb\">LƯỚT</i>",
					"Lướt",
					""
				],
				[
					"<i class=\"tb\">LƯỚT</i>›<i class=\"tb tb-light\">ĐÁNH</i>",
					"Chém lướt",
					""
				],
				[
					"<i class=\"tb\">▲</i>›<i class=\"tb tb-light\">ĐÁNH</i>",
					"Chém trên không",
					""
				],
				[
					"<i class=\"tb\">▲</i>›<i class=\"tb\">MẠNH</i>",
					"Bổ nhào",
					"đòn mạnh trên không"
				],
				[
					"<i class=\"tb tb-guard\">▼</i>",
					"Đỡ",
					"giữ"
				],
				[
					"<i class=\"tb tb-guard\">▼</i>!",
					"Gạt đòn",
					"chạm ngay trước khi trúng đòn"
				],
				[
					"<i class=\"tb tb-light\">ĐÁNH</i>",
					"Phản đòn thẳng",
					"sau khi đỡ/gạt"
				],
				[
					"Tới+<i class=\"tb tb-light\">ĐÁNH</i>",
					"Quét chân",
					"phản đòn · vào chân"
				],
				[
					"Lùi+<i class=\"tb tb-light\">ĐÁNH</i>",
					"Vòng sau",
					"phản đòn · lách qua đối thủ"
				],
				[
					"<i class=\"tb\">MẠNH</i>",
					"Phản đòn mạnh",
					"phản đòn · quật ngã"
				],
				[
					"Giằng co",
					"Giằng co",
					"chặn phản đòn rồi phản lại; phản đòn thứ 3 của bạn là đòn kết liễu"
				],
				[
					"<i class=\"tb tb-light\">ĐÁNH</i>!!",
					"Khóa kiếm",
					"bấm liên tục ĐÁNH khi khóa để đẩy lùi đối thủ"
				]
			],
			moveSpecialTouch: "<i class=\"tb ki\">KI</i>",
			moveTags: {
				normal: "Thường",
				command: "Lệnh",
				string: "Chuỗi",
				launcher: "Hất tung",
				juggle: "Tung hứng",
				air: "Trên không",
				dash: "Lướt",
				strike: "Đánh",
				counter: "Phản đòn",
				catch: "Bắt đòn",
				feint: "Đòn giả",
				guardCrush: "Phá thế đỡ",
				knockdown: "Quật ngã",
				kiCancel: "Nối ki",
				special: "Tuyệt kỹ ki",
				throw: "Phóng"
			},
			lessonsTouch: {
				walk: "Giữ <i class=\"tb\">◀</i> và <i class=\"tb\">▶</i> để đi tới đi lui.",
				combo: "Chạm <i class=\"tb tb-light\">ĐÁNH</i> ba lần liên tiếp: nối ba nhát chém trúng hình nộm.",
				heavy: "Tung một nhát chém mạnh bằng <i class=\"tb\">MẠNH</i>. Chậm, nhưng quật ngã.",
				gbreak: "Hình nộm đang đỡ. Đánh nó bằng <i class=\"tb\">MẠNH</i> để đầy thanh tư thế và phá thế đỡ (<i class=\"tb\">ĐÁ</i> trong bố cục Đầy đủ còn làm đầy nhanh hơn).",
				block: "Hình nộm đang tấn công. Giữ <i class=\"tb tb-guard\">▼</i> để chặn một nhát chém.",
				parry: "Chạm <i class=\"tb tb-guard\">▼</i> ngay trước khi trúng đòn. Lúc vòng xanh thu nhỏ lại là thời điểm hoàn hảo.",
				counter: "Ngay sau khi đỡ hoặc gạt, bấm <i class=\"tb tb-light\">ĐÁNH</i>: chém phản đòn. Thử cả tới/lùi + <i class=\"tb tb-light\">ĐÁNH</i> hoặc <i class=\"tb\">MẠNH</i>.",
				special: "Thanh ki đã đầy. Dùng {sp} bằng nút <i class=\"tb ki\">KI</i> đang sáng."
			},
			lessons: [
				{
					id: "walk",
					t: "Đi",
					d: "Đi tới đi lui bằng <kbd>A</kbd> / <kbd>D</kbd>."
				},
				{
					id: "combo",
					t: "Combo ba đòn",
					d: "Nối ba nhát chém nhẹ bằng <kbd>F</kbd> <kbd>F</kbd> <kbd>F</kbd> và đánh trúng hình nộm."
				},
				{
					id: "heavy",
					t: "Chém mạnh",
					d: "Tung một nhát chém mạnh bằng <kbd>G</kbd>. Chậm, nhưng quật ngã."
				},
				{
					id: "gbreak",
					t: "Phá thế đỡ",
					d: "Hình nộm đang đỡ. Đá bằng <kbd>R</kbd> để đầy thanh tư thế và phá thế đỡ."
				},
				{
					id: "block",
					t: "Đỡ",
					d: "Hình nộm đang tấn công. Giữ <kbd>S</kbd> để chặn một nhát chém."
				},
				{
					id: "parry",
					t: "Gạt đòn",
					d: "Bấm <kbd>S</kbd> ngay trước khi trúng đòn. Lúc vòng xanh thu nhỏ lại là thời điểm hoàn hảo."
				},
				{
					id: "counter",
					t: "Phản đòn",
					d: "Ngay sau khi đỡ hoặc gạt, bấm <kbd>F</kbd>: chém phản đòn. Thử cả tới/lùi + <kbd>F</kbd> hoặc <kbd>G</kbd>."
				},
				{
					id: "rally",
					t: "Giằng co",
					d: "Hình nộm cũng biết phản đòn. Tấn công, chặn phản đòn của nó rồi phản lại: đạt 2× bằng hai lần phản đòn của chính bạn."
				},
				{
					id: "special",
					t: "Tuyệt kỹ ki",
					d: "Thanh ki đã đầy. Dùng {sp} bằng <kbd>E</kbd>."
				}
			]
		});
		merge(EN.STR, {
			talk: {
				akane: {
					open: [
						"Lưỡi kiếm ta đỏ thắm, ý chí ta trong sạch. Hãy đối mặt ta bằng danh dự.",
						"Ta cúi chào trước, rồi mới ra đòn. Thế mới công bằng.",
						"Trận này vì danh dự của chúng ta. Không có đường lui."
					],
					reply: [
						"Một đối thủ đáng kính… Ngươi xứng với lưỡi kiếm của ta.",
						"Lời lẽ sắc bén đấy. Xem thép của ngươi có sắc bằng không.",
						"Khi lưỡi kiếm đỏ lên tiếng, lời nói phải im."
					],
					boss: "Các sư phụ của ta đã ngã dưới lưỡi kiếm ngươi, Shura. Hôm nay món nợ ấy sẽ được trả."
				},
				aoi: {
					open: [
						"Gió chẳng bao giờ vội. Ta cũng vậy.",
						"Hãy lắng nghe hơi thở. Âm thanh cuối cùng ngươi nghe thấy sẽ là tiếng gió.",
						"Tre uốn nhưng không gãy. Còn ngươi thì sao?"
					],
					reply: [
						"Bình tĩnh nào. Cơn giận làm lưỡi kiếm nặng thêm.",
						"Ngươi không thể bắt được gió. Chỉ có thể cảm nhận nó.",
						"Được thôi. Ta bắt đầu khi chiếc lá chạm đất."
					],
					boss: "Ngay cả mắt bão cũng tĩnh lặng. Còn trong ngươi chỉ toàn hỗn loạn, Shura."
				},
				kuro: {
					open: [
						"Núi không dời. Ngươi sẽ phải dời.",
						"Khỏi nói. Giơ kiếm lên.",
						"Ngươi nhỏ con. Sẽ nhanh thôi."
					],
					reply: [
						"Hừm. Vậy thì tới đi.",
						"Ngươi nói nhiều quá.",
						"Nodachi của ta dài. Sự kiên nhẫn của ta thì ngắn."
					],
					boss: "Shura. Ta đã đợi lâu rồi. Thôi nói."
				},
				yuki: {
					open: [
						"Tuyết rơi trong im lặng. Đòn của ta cũng vậy.",
						"Cáo không sa bẫy. Cáo giăng bẫy.",
						"Lạnh à? Lát nữa ngươi chẳng còn cảm thấy gì đâu."
					],
					reply: [
						"Ngươi nóng tính quá. Thế nên mới chậm.",
						"Ồn ào thật… Đến tuyết cũng thấy ngượng thay ngươi.",
						"Đừng chớp mắt. Không thì bỏ lỡ đấy."
					],
					boss: "Ai cũng sợ ngươi, Shura. Ta thì chỉ thấy hơi lạnh một chút."
				},
				hana: {
					open: [
						"Nhảy một điệu nhé? Nhưng ta dẫn đấy!",
						"Hứa là xong trước khi hoa anh đào chạm đất!",
						"Hai thanh tantō, một nụ cười. Ngươi sợ cái nào hơn?"
					],
					reply: [
						"Ôi, nghiêm túc quá! Cười lên chút đi, ngã trông sẽ đẹp hơn.",
						"Bắt được ta thì bắt đi!",
						"Rồi, rồi! Nhưng lát nữa đừng khóc nhé."
					],
					boss: "Ngươi chẳng bao giờ cười sao, Shura? Thôi nào, coi như điệu nhảy cuối cùng của chúng ta!"
				},
				tetsu: {
					open: [
						"Bổn phận đưa ta tới đây. Tránh đường hoặc gục ngã.",
						"Giáp của ta đã qua trăm trận. Ngươi là trận thứ một trăm lẻ một.",
						"Kỷ luật đi trước lòng dũng cảm. Để ta cho ngươi thấy."
					],
					reply: [
						"Vô lễ. Ta sẽ sửa cho ngươi.",
						"Lời ngươi không xuyên nổi giáp ta.",
						"Chuẩn bị đi. Naginata của ta không báo trước."
					],
					boss: "Ngươi đã đốt lâu đài của chủ công ta, Shura. Hôm nay ta hoàn thành bổn phận."
				},
				ren: {
					open: [
						"Ha! Cuối cùng cũng có trò vui! Xương ngươi có cứng không đấy?",
						"Sợ cái mặt nạ à? Chưa thấy mặt thật của ta đâu!",
						"Đầu hay thế đỡ? Ta phá cả hai!"
					],
					reply: [
						"Chỉ giỏi nói! Lên đi nào!",
						"Hề, ta thích ngươi đấy. Nhưng vẫn sẽ đập ngươi một trận.",
						"Thấy cú đá của ta bao giờ chưa? Sắp thấy rồi đấy!"
					],
					boss: "Vậy ngươi mới là oni thật hả? Xem sừng ai cứng hơn nào!"
				},
				kage: {
					open: [
						"Ngươi tưởng mình thấy ta. Ngươi chỉ thấy bóng ta thôi.",
						"Ánh sáng càng rực, bóng tối càng sâu.",
						"Tên ngươi đã được viết sẵn. Ta chỉ đọc lên thôi."
					],
					reply: [
						"Đừng nói. Bóng tối đang lắng nghe.",
						"Đừng nhìn ra sau. Ta đã ở đó rồi.",
						"Ngươi ồn quá. Sự im lặng ra đòn nhanh hơn."
					],
					boss: "Bóng tối không phục vụ chủ nhân nào, Shura. Nó sẽ nuốt chửng cả ngươi."
				},
				shura: {
					open: [
						"Ngươi đã bẻ gãy bảy lưỡi kiếm. Lưỡi thứ tám là của ta, và nó sẽ bẻ gãy ngươi.",
						"Linh hồn ngươi đã gọi ta. May là ngươi leo được tới đây; cú ngã của ngươi sẽ càng hoành tráng.",
						"Ta là điểm cuối của con đường. Quỳ xuống."
					],
					reply: [
						"Yếu đuối. Ta ngửi thấy từ đây.",
						"Ngươi chỉ là một bậc đá lót đường.",
						"Quỳ xuống, hoặc gục ngã."
					],
					boss: "Con quỷ trong gương… Một trong hai ta là thừa."
				},
				tora: {
					open: [
						"Ta chẳng còn đếm nổi bao kẻ đã lủng lẳng trên xích của ta. Ngươi sẽ là kẻ tiếp theo.",
						"Cuộc săn bắt đầu. Cứ chạy nếu muốn, nhưng xích của ta dài lắm.",
						"Người ta bảo hổ thường rình mồi. Con này thì không!"
					],
					reply: [
						"Grừ… Tốt. Ta thích con mồi không bỏ chạy.",
						"Khỏi cần lại gần. Ta sẽ kéo ngươi vào.",
						"Lời ngươi dài. Xích ta còn dài hơn."
					],
					boss: "Ngươi cũng chỉ là con mồi thôi, Shura. To hơn chút xíu."
				},
				jin: {
					open: [
						"Ta không đến để đổ máu. Ta chỉ cho ngươi nằm nghỉ một lát.",
						"Cây gậy nói bằng sự kiên nhẫn. Hãy lắng nghe.",
						"Con đường của ngươi đầy giận dữ, chiến binh trẻ. Để ta làm nhẹ gánh cho ngươi."
					],
					reply: [
						"Được thôi. Nhưng xong rồi, ta cùng uống trà.",
						"Cơn giận đè nặng lên ngươi. Để ta gánh giúp.",
						"Kiếm thì chém; gậy thì đánh thức."
					],
					boss: "Shura, ta không cần hủy diệt ngươi để đánh bại con quỷ bên trong. Chặn ngươi lại là đủ."
				},
				mai: {
					open: [
						"Sân khấu đã dựng, màn đã kéo lên. Vai của ngươi: kẻ thua cuộc.",
						"Khi quạt ta mở ra, đừng nhắm mắt. Kẻo bỏ lỡ màn trình diễn.",
						"Mỗi bước chân ta là một nốt nhạc. Ngươi theo kịp nhịp không?"
					],
					reply: [
						"Màn ra mắt thô kệch quá. Không sao, ta đủ duyên dáng cho cả hai.",
						"Gió đang thổi về phía ta đấy, cưng.",
						"Ta không cần vỗ tay. Cú ngã của ngươi là đủ."
					],
					boss: "Shura, trong điệu nhảy cuối này ta không chia sân khấu với ai."
				},
				tsubame: {
					open: [
						"Khoảng cách giữa chúng ta là vũ khí của ta.",
						"Chim én trượt một lần. Lần thứ hai, nó lượn lại và tấn công.",
						"Ta đã đo gió. Mũi tên ta biết đường đi."
					],
					reply: [
						"Muốn lại gần à? Thử xem.",
						"Nín thở đi. Mũi tên đang bay không có tiếng động.",
						"Mắt ta đang nhìn ngươi. Mũi tên ta cũng vậy."
					],
					boss: "Shura, trên trời chẳng có chỗ nào để trốn. Mũi tên ta sẽ tìm ra ngươi."
				}
			},
			pairs: {
				"akane|aoi": [["akane", "Aoi! Đến lúc kết thúc trận đấu còn dang dở rồi."], ["aoi", "Gió luôn thổi về cùng một ngọn lửa, Akane. Bắt đầu đi."]],
				"kuro|tetsu": [["kuro", "Vỏ sắt. Để xem bên trong có rỗng không."], ["tetsu", "Ngay cả núi cũng cúi đầu trước kỷ luật, Kuro."]],
				"hana|yuki": [["yuki", "Hoa sẽ héo trong tuyết, Hana."], ["hana", "Vậy ta sẽ làm tan tuyết, Yuki!"]],
				"kage|ren": [["ren", "Trò bóng tối không ăn thua với ta đâu! Ra mặt đi!"], ["kage", "Ta ở ngay đây, oni. Chỉ là ngươi không biết cách nhìn."]],
				"akane|ren": [["akane", "Chỉ kẻ vô danh dự mới nấp sau mặt nạ."], ["ren", "Danh dự à? Danh dự đâu có làm no bụng!"]],
				"aoi|yuki": [["aoi", "Gió lạnh thì vẫn là gió, Yuki."], ["yuki", "Nhưng gió tắt rồi, tuyết vẫn còn."]],
				"kuro|tora": [["tora", "Núi hả? Hổ cũng sống trên núi đấy."], ["kuro", "Hổ chết trên núi."]],
				"tora|yuki": [["tora", "Một con cáo! Cáo làm gì trước mặt hổ nào?"], ["yuki", "Chạy. Rồi đóng băng đuôi hổ."]],
				"jin|tora": [["tora", "Khi xích ta quấn quanh gậy ngươi thì sao đây, thầy tu?"], ["jin", "Thì gỡ ra. Tháo nút thắt là việc của ta."]],
				"jin|ren": [["ren", "Thầy tu hả? Cầu nguyện đi, trọc!"], ["jin", "Ta đang cầu đây, oni. Cho ngươi. Ngọn lửa trong ngươi cũng thiêu chính ngươi."]],
				"jin|tetsu": [["tetsu", "Thầy tu có việc gì trên chiến trường?"], ["jin", "Ta đến vì những trái tim bọc giáp như ngươi, Tetsu. Giáp ngươi nặng; trái tim ngươi còn nặng hơn."]],
				"akane|jin": [["akane", "Tránh ra, thầy tu. Mối thù này là của ta."], ["jin", "Báo thù là một sợi xích, Akane. Hãy bẻ gãy nó trước đã."]],
				"hana|mai": [["hana", "Ồ, thêm một vũ công! Xem ai xoay nhanh hơn nào!"], ["mai", "Tốc độ chỉ là cái bóng của sự duyên dáng, Hana. Để ta cho ngươi thấy ánh sáng."]],
				"kage|mai": [["mai", "Bóng tối cũng biết nhảy sao, Kage?"], ["kage", "Chỉ khi ánh sáng tắt."]],
				"aoi|tsubame": [["tsubame", "Gió của ngươi đẩy lệch được mũi tên ta không, Aoi?"], ["aoi", "Gió chẳng đứng về phía ai, Tsubame. Kể cả mũi tên của ngươi."]],
				"kage|tsubame": [["kage", "Không thấy thì không bắn trúng được đâu, cung thủ."], ["tsubame", "Có ánh sáng là có bóng. Ta cũng vậy."]],
				"mai|tsubame": [["mai", "Nhìn chằm chằm từ xa là bất lịch sự đấy, cung thủ. Lại đây xem cho gần."], ["tsubame", "Ta sẽ gửi mũi tên tới ngắm sân khấu của ngươi cho gần."]]
			},
			endings: {
				akane: [
					"Khi kiếm của Shura cắm xuống đất, chuông chùa tự ngân vang.",
					"Akane lau sạch lưỡi kiếm đỏ và cúi đầu trước mộ các sư phụ: món nợ đã trả.",
					"Con đường phía trước không còn là báo thù, mà là dạy danh dự cho những môn đồ mới."
				],
				aoi: [
					"Khi Shura ngã xuống, cơn bão lặng im; lần đầu sau bao năm, mây tan.",
					"Aoi tra kiếm vào vỏ và trở về rừng tre.",
					"Chỉ còn lại tiếng gió vi vu."
				],
				kuro: [
					"Kuro chôn chiếc mặt nạ vỡ của Shura trên đỉnh núi.",
					"Không một lời nào. Kuro hạ thấp nón rơm và biến mất trong tuyết.",
					"Dân làng kể rằng mùa đông năm ấy không một tên cướp nào xuống núi."
				],
				yuki: [
					"Hơi thở cuối cùng của Shura hóa sương trong khí lạnh rồi tan biến.",
					"Yuki chỉnh lại khăn quàng và bước đi, không để lại dấu chân nào trên tuyết.",
					"Từ hôm đó, trên đỉnh núi chỉ còn thấy bóng một con cáo."
				],
				hana: [
					"Khi mặt nạ của Shura rơi xuống đất, Hana đặt một cành anh đào bên cạnh.",
					"Đêm ấy khu chợ rợp đèn lồng; tiếng reo to nhất dành cho một kunoichi nhảy múa trên mái nhà.",
					"Không ai biết Hana đã đi đâu. Chỉ còn những cánh hoa hồng bay lả tả."
				],
				tetsu: [
					"Trên mái lâu đài, Tetsu bẻ đôi thanh kiếm của Shura qua đầu gối.",
					"Ngọn cờ của chủ công lại được kéo lên, tung bay kiêu hãnh trong gió.",
					"Bổn phận đã xong. Nhưng bổn phận của samurai không bao giờ kết thúc."
				],
				ren: [
					"Ren treo chiếc mặt nạ vỡ của Shura cạnh chiếc mặt nạ oni kia. Hai oni, một kẻ thắng.",
					"Đêm ấy cả làng ca hát; tiếng cười to nhất, như mọi khi, là của Ren.",
					"Sáng ra, Ren đã lên đường. Tới trận ẩu đả tiếp theo."
				],
				kage: [
					"Khi Shura gục xuống, bóng của Kage lặng lẽ phủ lên con quỷ bại trận.",
					"Không dấu vết, không tiếng động; chỉ thêm một cái bóng trải dài dưới ánh trăng.",
					"Có lẽ nó vẫn luôn ở đó. Có lẽ nó chưa từng tồn tại."
				],
				shura: ["Trên mái lâu đài, chỉ còn một kẻ đứng vững: kẻ mang cùng chiếc mặt nạ, chỉ tối hơn.", "Shura không còn tìm đối thủ. Đối thủ tìm Shura."],
				def: ["Bậc thầy cuối cùng đã ngã. Con đường bóng tối giờ thuộc về bạn.", "Tra kiếm vào vỏ; huyền thoại bắt đầu từ đây."],
				tora: [
					"Tiếng xích loảng xoảng báo hiệu Shura gục ngã.",
					"Tora treo chiếc mặt nạ vỡ lên xích: một chiến lợi phẩm săn mới.",
					"Từ đó, chẳng ai trong rừng còn coi tiếng hổ gầm là chuyện cổ tích."
				],
				jin: [
					"Jin quỳ bên Shura đã ngã và cầu nguyện.",
					"Trên đường về chùa, cây gậy không vương một giọt máu.",
					"Đêm ấy chuông núi lại ngân; lần này không phải để tiếc thương, mà vì hòa bình."
				],
				mai: [
					"Khi Shura ngã xuống, Mai gập quạt đánh tách và cúi chào.",
					"Chợ đêm đến nay vẫn còn bàn tán về điệu múa ấy.",
					"Màn đã hạ. Nhưng Mai chưa bao giờ rời sân khấu."
				],
				tsubame: [
					"Mũi tên cuối cùng rung lặng lẽ trên mái lâu đài.",
					"Tsubame khoác cung lên vai, nhìn đàn én bay về phương nam.",
					"Không ai còn gặp lại cô; chỉ còn những mũi tên lông rực rỡ cắm trúng đích."
				]
			},
			roster2: { notes: {
				tora: [
					"Nhẹ: quất xích ở tầm trung, lưỡi liềm khi áp sát",
					"Mạnh: phóng xích; trúng thì kéo đối thủ lại",
					"Đòn kết combo: nếu đối thủ ở xa, xích kéo họ lại gần"
				],
				jin: [
					"Cả hai đầu gậy đều đánh; đòn đánh cùn, không bao giờ gây đổ máu",
					"Đòn thứ ba và đòn quét mạnh quật ngã",
					"Thanh tư thế tăng chậm hơn khi đang đỡ"
				],
				mai: [
					"Khung gạt đòn rộng hơn",
					"Khi đỡ, quạt hất ngược đạn phóng trở lại",
					"Mạnh: một luồng gió đẩy đối thủ và thổi tan đạn phóng"
				],
				tsubame: [
					"Mạnh: bắn tên bằng cung; giữ để bắn tên nạp lực",
					"Phóng: lộn ngược ra sau và bắn tên từ trên không",
					"Hết tên thì đòn mạnh dùng tantō; tên tự nạp lại theo thời gian"
				]
			} }
		});
		merge(EN.CHARS, {
			akane: {
				title: "Lưỡi Kiếm Đỏ",
				desc: "Kiếm sĩ katana cân bằng. Combo ba đòn nhanh, gạt đòn chắc.",
				weapon: "Katana"
			},
			aoi: {
				title: "Gió Xanh",
				desc: "Kiếm sĩ katana nhanh nhẹn. Đi nhanh hơn một chút và lướt như gió.",
				weapon: "Katana"
			},
			kuro: {
				title: "Núi Đen",
				desc: "Dùng nodachi dài. Chậm, nhưng tầm đánh rộng và đòn cực mạnh.",
				weapon: "Nodachi"
			},
			yuki: {
				title: "Cáo Tuyết",
				desc: "Ra đòn rất nhanh với kodachi ngắn. Nhiều phi tiêu, khăn quàng dài.",
				weapon: "Kodachi"
			},
			hana: {
				title: "Vũ Điệu Anh Đào",
				desc: "Kunoichi. Đánh hai tantō như đang múa; tay nhanh nhất, tầm ngắn nhất.",
				weapon: "Song Tantō"
			},
			tetsu: {
				title: "Pháo Đài Thép",
				desc: "Samurai mặc giáp. Naginata cho tầm đánh xa nhất; trúng đòn cũng hầu như không suy suyển.",
				weapon: "Naginata"
			},
			ren: {
				title: "Oni Đỏ",
				desc: "Kẻ đánh lộn đeo mặt nạ oni. Gây khiếp sợ bằng những đòn phá thế đỡ và cú đá cực mạnh.",
				weapon: "Uchigatana"
			},
			kage: {
				title: "Chính Là Bóng Tối",
				desc: "Bóng đen trùm mũ. Nhanh với ninjatō, lướt xa; đi qua đâu để lại bóng đó.",
				weapon: "Ninjatō"
			},
			tora: {
				title: "Hổ Xích",
				desc: "Bậc thầy kusarigama. Quất xích có quả tạ từ tầm trung; đòn mạnh kéo đối thủ lại gần để chém liềm.",
				weapon: "Kusarigama"
			},
			jin: {
				title: "Thiết Côn Tăng",
				desc: "Nhà sư dùng bō. Gậy dài đánh bằng cả hai đầu, thế đỡ vững và đòn quật ngã cùn; không gây đổ máu, chỉ làm rung xương.",
				weapon: "Bō"
			},
			mai: {
				title: "Vũ Nữ Quạt",
				desc: "Kunoichi dùng quạt chiến. Rất nhanh, khung gạt đòn rộng; quạt hất ngược đạn phóng và gió của nó đẩy lùi đối thủ.",
				weapon: "Song Tessen"
			},
			tsubame: {
				title: "Cung Thủ Én",
				desc: "Mang cung và tantō. Bắn tên từ xa (giữ đòn mạnh để bắn nạp lực) và lộn ngược ra sau khi bị áp sát, bắn tên từ trên không.",
				weapon: "Yumi + Tantō"
			},
			shura: {
				title: "Bậc Thầy Đỏ Thẫm",
				desc: "Một quỷ sư có con đường nhuộm màu đỏ thẫm. Nodachi dài, đòn nghiền nát, gạt đòn gần như hoàn hảo.",
				weapon: "Nodachi"
			}
		});
		merge(EN.ARENAS, {
			temple: "Đền Dưới Trăng",
			rain: "Rừng Tre Bão Tố",
			snow: "Đỉnh Tuyết",
			village: "Làng Bốc Cháy",
			market: "Chợ Đêm",
			waterfall: "Thác Nước",
			castle: "Mái Lâu Đài"
		});
		merge(EN.SPECIALS, {
			akane: {
				desc: "Một nhát iai đỏ thẫm xuyên qua đối thủ trong chớp mắt, để lại vầng trăng khuyết rực lửa giữa không trung.",
				tip: "Gạt đòn, hoặc lướt sang bên"
			},
			aoi: {
				desc: "Một cú vung rộng phóng lưỡi gió bay về phía trước; đỡ đúng thời điểm sẽ phản nó lại.",
				tip: "Nhảy, chém tan nó bằng kiếm, hoặc đỡ đúng thời điểm"
			},
			kuro: {
				desc: "Bật lên và bổ nodachi xẻ đôi mặt đất; sóng chấn động lan trên mặt đất phá thế đỡ và quật ngã.",
				tip: "Nhảy qua sóng và đánh khi đang trên không"
			},
			yuki: {
				desc: "Năm đòn liên hoàn nhanh như chớp, như bão tuyết; đòn cuối quật ngã.",
				tip: "Đỡ, và gạt đòn đầu tiên"
			},
			hana: {
				desc: "Xoay tới như một cơn lốc hoa anh đào với song tantō, chém cả hai bên.",
				tip: "Đỡ, hoặc lướt lùi"
			},
			tetsu: {
				desc: "Xoay naginata quanh người; trúng đòn cũng không ngắt được vòng xoay (siêu giáp).",
				tip: "Ra khỏi tầm đánh, hoặc gạt đòn"
			},
			ren: {
				desc: "Một cú húc vai phá vỡ thế đỡ, tiếp theo là nhát chém vút lên hất tung đối thủ.",
				tip: "Đỡ vô ích: hãy gạt đòn, nhảy hoặc lướt"
			},
			kage: {
				desc: "Biến mất trong khói, để lại phân thân bóng tối và hiện ra sau lưng đối thủ để ra đòn.",
				tip: "Đỡ ngay khi Kage hiện ra"
			},
			tora: {
				desc: "Quay xích trên đầu thành cơn lốc quét sạch mọi thứ xung quanh; đối thủ bị bắt sẽ bị kéo lại và hất lên trời bằng lưỡi liềm.",
				tip: "Ra khỏi tầm hoặc đỡ: không bị bắt thì cú kéo sẽ hụt"
			},
			jin: {
				desc: "Tiến tới xoay gậy như bánh xe kim cương; sau bốn đòn, một cú đánh vút lên hất tung đối thủ.",
				tip: "Lướt lùi, hoặc gạt đòn đầu tiên"
			},
			mai: {
				desc: "Tạo một cơn lốc trôi về phía trước, hút đối thủ vào, chém, rồi hất họ lên trời.",
				tip: "Đỡ cơn lốc đúng thời điểm hoặc lùi ra: nó di chuyển chậm"
			},
			tsubame: {
				desc: "Nhảy lùi và trút mưa tên từ trên trời; nếu trượt, bắn một mũi tên én lượn lại đánh từ phía sau.",
				tip: "Tránh khỏi các dấu trên mặt đất; mũi tên én sẽ quay lại, nên coi chừng sau lưng"
			},
			shura: {
				desc: "Gầm lên rồi tan vào làn khói đỏ thẫm, hiện ra trước và sau đối thủ để bổ xuống ba nhát nodachi mạnh; nhát cuối hất tung.",
				tip: "Để ý ánh lóe đỏ: gạt được một nhát là kết thúc tuyệt kỹ; đỡ thì tư thế bị nghiền nát"
			}
		});
		merge(EN.TXT, {
			gbreak: "VỠ TƯ THẾ!",
			cut: "CHÉM!",
			reflect: "PHẢN LẠI!",
			parry: "GẠT ĐÒN!",
			caught: "BỊ BẮT!",
			swallowHit: "燕!",
			vajraHit: "金剛!",
			whirlHit: "旋風の舞"
		});
		merge(EN.AI_LEVELS, {
			0: "Tập sự",
			1: "Cao thủ",
			2: "Huyền thoại",
			3: "Shura"
		});
		EN.NUMWORDS = [
			"Không",
			"Một",
			"Hai",
			"Ba",
			"Bốn",
			"Năm",
			"Sáu",
			"Bảy",
			"Tám",
			"Chín",
			"Mười",
			"Mười một",
			"Mười hai"
		];
		merge(EN.PHRASES, {
			"Gölge Düellosu": "Shadow Duel",
			"Duraklat": "Tạm dừng",
			"KARŞILIKLI SERİ": "GIẰNG CO",
			"SON DARBE": "ĐÒN CUỐI",
			"atlamak için bir tuşa bas": "bấm phím bất kỳ để bỏ qua",
			"GARD": "ĐỠ",
			"HAFİF": "NHẸ",
			"SALDIR": "ĐÁNH",
			"AĞIR": "MẠNH",
			"ATIL": "LƯỚT",
			"TEKME": "ĐÁ",
			"Sekiz savaşçı, üç arena. Gerçek zamanlı kılıç çarpışması, kılıç kilitlenmesi, savuşturma, denge kırma, Gölge Kesiği ve ragdoll fiziği.": "Tám đấu sĩ, ba đấu trường. Đấu kiếm thời gian thực, khóa kiếm, gạt đòn, phá tư thế, Chém Bóng và vật lý ragdoll.",
			"İki Oyuncu": "Hai người chơi",
			"Aynı klavyede ya da iki gamepad ile kafa kafaya": "Đối đầu trên cùng bàn phím hoặc hai tay cầm",
			"CPU'ya Karşı": "Đấu với máy",
			"Ninjanı seç, rakibini yapay zekâ yönetsin": "Chọn ninja, để AI điều khiển đối thủ",
			"Zorluk": "Độ khó",
			"Çırak": "Tập sự",
			"Usta": "Cao thủ",
			"Efsane": "Huyền thoại",
			"Aylık Turnuva": "Giải đấu tháng",
			"Dan Sınavı": "Thi Dan",
			"Şampiyonlar Salonu": "Sảnh Vinh Danh",
			"Seyret": "Xem đấu",
			"Rastgele iki ninja, Efsane yapay zekâ": "Hai ninja ngẫu nhiên, AI Huyền thoại",
			"Ses": "Âm thanh",
			"Müzik": "Nhạc",
			"Kan efekti": "Hiệu ứng máu",
			"Tuş ipuçları": "Gợi ý phím",
			"Yüksek grafik": "Đồ họa cao",
			"Kontroller": "Điều khiển",
			"1. Oyuncu": "Người chơi 1",
			"2. Oyuncu": "Người chơi 2",
			"Yürü": "Đi",
			"Zıpla": "Nhảy",
			"Gard (basılı tut)": "Đỡ (giữ)",
			"Hafif kesik (×3 kombo)": "Chém nhẹ (combo ×3)",
			"Ağır kesik": "Chém mạnh",
			"Tekme": "Đá",
			"Sol Shift": "Shift trái",
			"Sağ Shift": "Shift phải",
			"Atılma": "Lướt",
			"Ki tekniği (ki dolu)": "Tuyệt kỹ ki (đầy ki)",
			"Ninjanı seç": "Chọn ninja của bạn",
			"Hazır": "Sẵn sàng",
			"1. oyuncunun ninjası": "Ninja của người chơi 1",
			"2. oyuncunun ninjası": "Ninja của người chơi 2",
			"Önceki ninja": "Ninja trước",
			"Sonraki ninja": "Ninja sau",
			"1. oyuncu kadrosu": "Đội hình người chơi 1",
			"2. oyuncu kadrosu": "Đội hình người chơi 2",
			"Dövüşe başla": "Vào trận",
			"Geri": "Quay lại",
			"Kilitli": "Đã khóa",
			"Rastgele": "Ngẫu nhiên",
			"Hız": "Tốc độ",
			"Güç": "Sức mạnh",
			"Menzil": "Tầm đánh",
			"Can": "Máu",
			"Duraklatıldı": "Đã tạm dừng",
			"Devam et": "Tiếp tục",
			"Maçı yeniden başlat": "Đấu lại từ đầu",
			"Ana menü": "Menu chính",
			"Rövanş": "Tái đấu",
			"Karakter değiştir": "Đổi đấu sĩ",
			"Zafer senin": "Chiến thắng thuộc về bạn",
			"Raund": "Hiệp",
			"Verilen hasar": "Sát thương gây ra",
			"Savuşturma": "Gạt đòn",
			"Ki Saldırısı": "Đòn ki",
			"Antrenman": "Luyện tập",
			"ANTRENMAN": "LUYỆN TẬP",
			"Sıralama": "Bảng xếp hạng",
			"Tümü": "Tất cả",
			"Ekranı yan çevir": "Xoay ngang màn hình",
			"Performans için grafik düşürüldü": "Đã giảm đồ họa để chạy mượt hơn",
			"Kanlı Usta": "Bậc Thầy Nhuốm Máu",
			"Yolunu kanla çizen iblis usta. Uzun nodachi, yıkıcı darbeler, neredeyse kusursuz savuşturma.": "Một quỷ sư vạch đường bằng máu. Nodachi dài, đòn nghiền nát, gạt đòn gần như hoàn hảo.",
			"SEN": "BẠN",
			"KUKLA": "HÌNH NỘM",
			"Son raund": "Hiệp cuối",
			"Kazanan her şeyi alır": "Thắng là có tất cả",
			"İlk iki raundu alan kazanır": "Ai thắng hai hiệp trước sẽ thắng",
			"Dövüş!": "Chiến!",
			"Süre doldu": "Hết giờ",
			"Berabere": "Hòa",
			"Çifte K.O.": "K.O. kép",
			"Mükemmel": "Hoàn hảo",
			"F / K tuşuna hızlıca bas!": "Bấm liên tục F / K!",
			"Hafif ya da ağır tuşuna hızlıca bas!": "Bấm liên tục nhẹ hoặc mạnh!",
			"KARŞILIK": "PHẢN ĐÒN",
			"SAVUŞTUR": "GẠT ĐÒN",
			"SON VURUŞ!": "KẾT LIỄU!",
			"KİLİTLENDİ!": "KHÓA KIẾM!",
			"İTTİ!": "ĐẨY LÙI!",
			"DENGE KIRILDI!": "VỠ TƯ THẾ!",
			"GARD KIRILDI!": "VỠ THẾ ĐỠ!",
			"KESİLDİ!": "CHÉM ĐỨT!",
			"YANSITMA!": "PHẢN LẠI!",
			"SAVUŞTURMA!": "GẠT ĐÒN!",
			"YAKALANDI!": "BỊ BẮT!",
			"ZIRH!": "GIÁP!",
			"ARKADAN!": "ĐÂM LÉN!",
			"DUVAR!": "ĐẬP TƯỜNG!",
			"KAFA!": "TRÚNG ĐẦU!",
			"KARŞI!": "ĐÁNH CHẶN!",
			"KRİTİK!": "CHÍ MẠNG!",
			"SÜPÜRME!": "QUÉT CHÂN!",
			"KARŞILIK!": "PHẢN ĐÒN!",
			"YERE SERİLDİ": "QUẬT NGÃ",
			"ÇARPIŞMA!": "VA KIẾM!"
		});
		merge(EN.HTML, {
			"Gölge<br><em>Düel</em><em>losu</em>": "Shadow<br><em>Du</em><em>el</em>",
			"<b>Savuşturma:</b> darbe gelmeden hemen önce gard tuşuna bas; rakip sendeler.": "<b>Gạt đòn:</b> bấm đỡ ngay trước khi đòn đánh tới; đối thủ sẽ loạng choạng.",
			"<b>Karşılık (返し技):</b> gard ya da savuşturmanın hemen ardından saldırı tuşu → anında karşı kesik. <b>İleri</b> + hafif = bacağa süpürme, <b>geri</b> + hafif = yanından dönüp arkadan kesme, <b>ağır</b> = güçlü karşı darbe.": "<b>Phản đòn (返し技):</b> bấm tấn công ngay sau khi đỡ hoặc gạt → chém phản đòn tức thì. <b>Tới</b> + nhẹ = quét chân, <b>lùi</b> + nhẹ = vòng sau chém từ phía sau, <b>mạnh</b> = phản đòn uy lực.",
			"<b>Karşılıklı seri:</b> karşılık da karşılanabilir. Her turda vuruşlar hızlanır ve güçlenir; kendi 3. karşılığın üç vuruşluk sinematik bir bitirişe dönüşür. Seriyi kıran darbe ağır çekimde iner.": "<b>Giằng co:</b> phản đòn cũng có thể bị phản lại. Mỗi lượt đòn đánh càng nhanh và mạnh hơn; phản đòn thứ 3 của bạn thành đòn kết liễu điện ảnh ba nhát. Đòn phá vỡ thế giằng co sẽ diễn ra chậm lại.",
			"<b>Kılıç kilidi:</b> kılıçlar çarpışınca kilitlenebilir. Hafif/ağır tuşuna hızlı basan rakibini iter.": "<b>Khóa kiếm:</b> hai lưỡi kiếm va nhau có thể khóa lại. Ai bấm nhẹ/mạnh nhanh hơn sẽ đẩy lùi người kia.",
			"<b>Ki barı</b> vurdukça, yedikçe ve savuşturdukça dolar. Dolunca her ninjanın kendine özgü ki tekniği açılır (Antrenman’daki hareket listesinde görebilirsin).": "<b>Thanh ki</b> tăng khi bạn đánh trúng, trúng đòn và gạt đòn. Khi đầy, tuyệt kỹ ki riêng của mỗi ninja sẵn sàng (xem danh sách chiêu trong Luyện tập).",
			"<b>Atılma + hafif</b> = atılarak kesik. <b>Havada</b> hafif = hava kesiği, ağır = dalış. Ağır kesik yere serer, duvara çarpan geri seker.": "<b>Lướt + nhẹ</b> = chém lướt. <b>Trên không</b> nhẹ = chém trên không, mạnh = bổ nhào. Chém mạnh quật ngã; ai bị đập vào tường sẽ bật ngược lại.",
			"<b>Denge çubuğu</b> dolarsa gard kırılır. Tekme gardı delip dengeyi hızla doldurur.": "Khi <b>thanh tư thế</b> đầy, thế đỡ sẽ vỡ. Đòn đá xuyên thế đỡ và làm đầy tư thế rất nhanh.",
			"Gamepad: X hafif · Y ağır · B tekme · A zıpla · LB gard · RB shuriken · RT atılma · R3 ki tekniği. Start ya da <kbd>P</kbd> duraklatır. CPU modunda her iki tuş seti de seni yönetir.": "Tay cầm: X nhẹ · Y mạnh · B đá · A nhảy · LB đỡ · RB phi tiêu · RT lướt · R3 tuyệt kỹ ki. Start hoặc <kbd>P</kbd> để tạm dừng. Khi đấu với máy, cả hai bộ phím đều điều khiển bạn.",
			"<kbd>Enter</kbd> başlatır · <kbd>⌫</kbd> menüye döner": "<kbd>Enter</kbd> bắt đầu · <kbd>⌫</kbd> quay lại",
			"<kbd>Enter</kbd> / <kbd>F</kbd> başlatır · <kbd>⌫</kbd> çıkar": "<kbd>Enter</kbd> / <kbd>F</kbd> bắt đầu · <kbd>⌫</kbd> thoát"
		});
		EN.PATTERNS.push([/^RAUND (\d+)$/, "HIỆP $1"], [/^(\d+)\. Raund$/, "Hiệp $1"], [/^(\d+)\. KARŞILIK$/, "PHẢN ĐÒN ×$1"], [/^(\d+) VURUŞLUK SERİ!$/, "GIẰNG CO $1 ĐÒN!"], [/^(.+) önde$/, (m, n) => I.t(n) + " dẫn trước"], [/^(.+) kazandı$/, (m, n) => I.t(n) + " thắng"], [/^(\d+) – (\d+) · (\d+) raund · (.+)$/, (m, a, b, r, ar) => `${a} – ${b} · ${r} hiệp · ${I.t(ar)}`]);
		merge(EN.STR, {
			menu: {
				play: "Chơi",
				playSub: (name, lv) => `${name} đấu máy · ${lv}`
			},
			first: {
				play: "Chơi",
				sub: "Chạm một cái là vào trận",
				menu: "Mọi chế độ"
			},
			ads: {
				cont: "Tiếp tục từ đây",
				contSub: "Xem quảng cáo · thử lại không bị trừ điểm",
				trial: (name) => `Dùng thử ${name} một trận`,
				trialSub: "Xem quảng cáo",
				fail: "Hiện chưa có quảng cáo, thử lại sau giây lát"
			},
			coach: {
				attack: (l) => `${l} Tấn công`,
				guard: (l, g) => `Giữ ${g} để đỡ`,
				parry: (l, g) => `Bấm ${g} ngay trước khi trúng đòn: gạt đòn`,
				attackT: (l) => `Chạm ${l} · chạm liên tục: combo`,
				guardT: (l, g) => `Giữ ${g} để đỡ`,
				parryT: (l, g) => `Chạm ${g} ngay trước khi trúng đòn: gạt đòn`
			}
		});
		merge(EN.STR, { vol: {
			title: "Âm lượng",
			master: "Tổng",
			music: "Nhạc",
			sfx: "Hiệu ứng",
			sound: "Âm thanh",
			pct: (n) => `${n}%`,
			muted: "Âm thanh đang tắt. Kéo một thanh trượt để bật lại.",
			voice: "Giọng nói",
			uiSfx: "Âm thanh menu",
			credit: "Giọng nói: ユーフルカ (youfulca.com) · 効果音ラボ · すぱらんど"
		} });
		merge(EN.STR, { tedit: {
			mnote: {
				dpad: "Nút riêng: giữ để đi, nhấn đúp để lướt. Bấm vào giữa hai nút để dùng cả hai (▶ + ▲ = nhảy tới).",
				dtap: "Nút riêng: chạm nhanh ◀ ▶ để bước một bước ngắn, giữ để đi, nhấn đúp để lướt."
			},
			dtap: "Chạm để bước",
			edit: "Tùy chỉnh điều khiển",
			title: "Tùy chỉnh điều khiển",
			hint: "Kéo nút đến bất kỳ đâu. Chạm vào nút để chỉnh cỡ, độ mờ hoặc ẩn nó.",
			rotate: "Xoay ngang màn hình để sắp xếp nút chiến đấu.",
			shapes: {
				phone: "Điện thoại",
				tablet: "Máy tính bảng",
				portrait: "Dọc"
			},
			screenNote: "Bố cục được lưu theo dạng màn hình: điện thoại và máy tính bảng có bố cục riêng.",
			save: "Lưu",
			cancel: "Hủy",
			options: "Tùy chọn",
			done: "Xong",
			close: "Đóng",
			size: "Cỡ",
			sizes: {
				s: "S",
				m: "M",
				l: "L",
				xl: "XL"
			},
			opacity: "Độ mờ",
			opacityAll: "Độ mờ (tất cả)",
			hide: "Ẩn",
			show: "Hiện",
			hidden: "Đã ẩn",
			snap: "Bám lưới",
			presets: "Mẫu có sẵn",
			pRight: "Tay phải",
			pLeft: "Tay trái",
			reset: "Về mặc định",
			resetDone: "Đã khôi phục bố cục mặc định (áp dụng khi bạn lưu).",
			overlap: "Các nút không được chồng lên nhau: đã dời tới chỗ trống gần nhất.",
			noRoom: "Không đủ chỗ ở đó: nút đã quay về vị trí cũ.",
			saved: "Đã lưu điều khiển",
			throwName: "PHI TIÊU",
			pauseName: "Tạm dừng",
			dirs: {
				dl: "◀ Trái",
				dr: "Phải ▶",
				du: "▲ Nhảy",
				dd: "▼ Đỡ"
			}
		} });
		merge(EN.STR, {
			menu: { arcadeDesc: "Lần lượt hạ từng đối thủ khi độ khó tăng dần, cuối đường là một bậc thầy ẩn mặt. Nguồn danh dự dồi dào nhất." },
			sel: {
				title: { rival: "Thách đấu · Chọn ninja" },
				go: { rival: "Nhận thách đấu" },
				moves: "Chiêu thức",
				movesOf: (name) => `${name} · Chiêu thức`,
				close: "Đóng"
			},
			hint: {
				honor: (have, need) => `Danh dự ${num(Math.min(have, need))}/${num(need)} → mở Thách đấu`,
				ready: "Sẵn sàng nhận thách đấu!",
				arenaHonor: (have, need) => `Mở khi đạt ${num(need)} danh dự (${num(Math.min(have, need))}/${num(need)})`
			},
			honor: {
				name: "Danh dự",
				head: "Danh dự",
				rows: {
					win: "Thắng",
					loss: "Tham chiến",
					rounds: "Hiệp thắng",
					perfect: "Hiệp hoàn hảo",
					rally: "Giằng co",
					counter: "Phản đòn",
					parry: "Gạt đòn",
					rivalWin: "Thách đấu",
					arcadeClear: "Phá đảo Arcade"
				},
				total: (n) => `Danh dự: ${num(n)}`,
				next: (name, left) => `Ninja tiếp theo: ${name} — còn ${num(left)} danh dự`,
				bar: (have, need) => `Danh dự ${num(Math.min(have, need))}/${num(need)} → mở Thách đấu`,
				ready: (name) => `${name} thách đấu bạn!`,
				readyGo: "Nhận",
				all: "Đã mở khóa mọi ninja",
				bonus: {
					arcadeClear: "Phá đảo Arcade",
					tourneyClear: "Chinh phục giải đấu",
					danPass: "Đỗ bài thi Dan",
					rivalWin: "Thắng thách đấu",
					tutorial: "Hoàn thành hướng dẫn"
				},
				bonusToast: (n, what) => `+${num(n)} danh dự · ${what}`,
				road: "Con Đường Danh Dự",
				roadSub: "Bạn nhận danh dự ở mọi chế độ chơi đơn. Đạt mốc của một ninja là họ sẽ thách đấu bạn; thắng thì họ gia nhập cùng bạn.",
				earnHead: "Danh dự đến từ đâu",
				earn: (H) => [
					["Đấu với máy", `Thắng: Tập sự ${H.win[0]} · Cao thủ ${H.win[1]} · Huyền thoại ${H.win[2]}`],
					["Arcade", `Thắng theo độ khó · Shura ${H.win[3]} · phá đảo +${H.arcadeClear}`],
					["Giải đấu & Dan", `Thắng ×${H.modeMul.tourney} · chinh phục giải +${H.tourneyClear} · mỗi bài thi Dan +${H.danPass(1)} trở lên`],
					["Kể cả khi thua", `Tham chiến ${H.loss} · mỗi hiệp thắng ${H.roundWon}`],
					["Chơi hay", `Gạt đòn, phản đòn, giằng co, hiệp hoàn hảo: tối đa +${H.styleCap} mỗi trận`]
				],
				rivalsHead: "Đối thủ",
				arenasHead: "Đấu trường",
				open: "Đã mở",
				castle: "Hạ Shura ở Arcade",
				you: (n) => `Danh dự của bạn: ${num(n)}`
			},
			rival: {
				stage: "Thách đấu",
				selTitle: (name) => `${name} thách đấu bạn · Chọn ninja`,
				lvHp: (lv, p) => p === 100 ? lv : `${lv} · máu đối thủ ${p}%`,
				accept: "Nhận thách đấu",
				acceptSub: (name) => `Thắng là có ${name}`,
				quit: "Rút lui",
				hud: "THÁCH ĐẤU",
				winTitle: (name) => `${name} gia nhập cùng bạn!`,
				winSub: (name) => `${name} đã có ở màn chọn. Thử ngay nào!`,
				tryNew: (name) => `Chơi với ${name}`,
				lossTitle: "Thách đấu vẫn tiếp tục",
				lossSub: (name, p) => `Lần này ${name} thắng. Thua không mất gì; lần sau họ bắt đầu với ${p}% máu.`,
				lossSubMin: (name) => `Lần này ${name} thắng. Thua không mất gì; thử lại nhé.`,
				retry: "Thách đấu lại",
				reveal: "Ninja mới",
				toastReady: (name) => `${name} thách đấu bạn!`,
				lines: {
					hana: "Ta nghe danh dự của ngươi rồi, cả khu chợ đều bàn tán! Theo kịp điệu nhảy của ta thì ta sẽ đi cùng ngươi!",
					tetsu: "Tên tuổi ngươi đã đến tai ta. Đánh bại ta và naginata của ta sẽ chiến đấu bên ngươi.",
					ren: "Ha! Cuối cùng cũng có người gọi ta! Thắng thì ta theo ngươi, thua thì ngồi nghe ta cười!",
					kage: "Ta đã dõi theo ngươi một thời gian. Bắt được bóng ta thì ta thuộc về ngươi.",
					tora: "Chứng minh ngươi không phải con mồi đi. Thoát được xích ta thì ta sẽ đi bên ngươi.",
					jin: "Nếu danh dự của ngươi xuất phát từ trái tim, cây gậy của ta sẽ biết. Lại đây, để ta thử ngươi.",
					mai: "Ngươi được mời lên sân khấu của ta. Giành được tràng pháo tay của ta thì điệu múa này là của ngươi.",
					tsubame: "Ta đã quan sát từ xa; ngươi giỏi đấy. Né được tên của ta thì cây cung này theo ngươi."
				}
			}
		});
		merge(EN.CHARS, {
			akane: {
				desc: "Bậc thầy iaijutsu. Kiếm nằm chờ trong vỏ và mỗi nhát chém là một lần rút kiếm; thế rút kiếm của cô bắt được đòn lao tới.",
				weapon: "Katana (iai)"
			},
			aoi: {
				desc: "Kiếm sĩ tachi một tay của gió. Những cú đâm tầm xa và bước gió thu hẹp mọi khoảng cách chỉ trong một động tác.",
				weapon: "Tachi"
			},
			ren: { desc: "Kẻ đánh lộn đeo mặt nạ oni. Vác kiếm trên vai; đánh bằng khuỷu tay, đầu gối, vai và đầu, nghiền nát thế đỡ." },
			kage: { desc: "Bóng đen trùm mũ. Cầm ninjatō ngược; chiến đấu bằng bước bóng, đòn giả và bom khói." }
		});
		merge(EN.TXT, {
			kiCancel: "NỐI KI!",
			launch: "HẤT TUNG!",
			iaiCatch: "IAI GAESHI!"
		});
		EN.PATTERNS.push([/^(\d+) VURUŞ$/, "$1 ĐÒN"]);
		merge(EN.PHRASES, {
			"Tekme": "Đá",
			"Tekme: dengeyi hızla doldurur, gardı kırmaya yarar. Ardından AĞIR ile seri bitirişine bağlanır.": "Đá: làm đầy tư thế nhanh và giúp phá thế đỡ. Nối MẠNH để kết chuỗi.",
			"Shuriken fırlatır; zamanla yeniden dolar.": "Ném phi tiêu; phi tiêu tự nạp lại theo thời gian.",
			"Hava kesiği": "Chém trên không",
			"Havada hafif kesik. Havaya fırlatılmış rakibe de vurur.": "Chém nhẹ trên không. Đánh trúng cả đối thủ đang bị hất tung.",
			"Dalış": "Bổ nhào",
			"Havadan aşağı dalış kesiği; yere serer.": "Chém bổ nhào từ trên không xuống; quật ngã.",
			"Kaeshi-waza (karşılık)": "Kaeshi-waza (phản đòn)",
			"Gard ya da savuşturmanın hemen ardından karşılık: nötr Suriage, ileri Harai (yere serer), geri Nuki (arkaya geçer), ağır Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.": "Phản đòn ngay sau khi đỡ hoặc gạt: đứng yên Suriage, tới Harai (quật ngã), lùi Nuki (vòng ra sau), mạnh Uchiotoshi. Phản đòn thứ ba của bạn là đòn kết liễu; nếu bị gạt, giằng co tiếp tục.",
			"Fırlatıcı isabet edince HAFİF: rakibin peşinden sıçrayıp havada keser. Ardından AĞIR ile yere çakar. Havadaki rakip en çok üç vuruş alır.": "Khi đòn hất tung trúng, NHẸ: bật theo đối thủ và chém trên không. Rồi MẠNH để nện họ xuống đất. Đối thủ trên không chịu tối đa ba đòn.",
			"Üç vuruşluk hafif seri. İkinci ve üçüncü vuruş ki doluyken tekniğe bağlanır.": "Chuỗi nhẹ ba đòn. Khi đầy ki, đòn thứ hai và thứ ba nối được vào tuyệt kỹ ki.",
			"Ağır vuruş: yavaş ama yere serer.": "Đòn mạnh: chậm nhưng quật ngã.",
			"İleri atılarak dürter; hafif seriye devam eder.": "Lao tới đâm; nối tiếp chuỗi nhẹ.",
			"Yarım adım geri çekilip bacaklara alçak süpürme; yere serer.": "Lùi nửa bước rồi quét thấp vào chân; quật ngã.",
			"Fırlatıcı: yükselen kesik rakibi havaya kaldırır.": "Hất tung: nhát chém vút lên nhấc đối thủ lên không.",
			"Sıçrayıp tepeden iner: yavaş ama gardı ezer, yere serer.": "Bật lên rồi bổ từ trên xuống: chậm nhưng nghiền thế đỡ và quật ngã.",
			"Atılırken dönerek geniş kesik; yere serer.": "Vừa lướt vừa xoay chém rộng; quật ngã.",
			"İki kesiklik seri bitirişi; son kesik yere serer.": "Đòn kết chuỗi hai nhát; nhát cuối quật ngã.",
			"Rakibin kılıcını aşağı çarpıp dürter: gardı ezer.": "Đập kiếm đối thủ xuống rồi đâm: nghiền thế đỡ.",
			"Kından yatay çekiş kesiği, çapraz iniş, geri dönen kesik; kılıç her seferinde kınına döner.": "Rút kiếm chém ngang, chém chéo xuống và chém ngược lại; mỗi lần kiếm đều trở về vỏ.",
			"Derin çömelişten geniş yatay çekiş; yere serer.": "Rút kiếm chém ngang rộng từ thế ngồi thấp; quật ngã.",
			"Atılarak kından çekiş: uzak mesafeyi bir anda kapatır, seriye devam eder.": "Lướt tới rút kiếm: thu hẹp khoảng cách xa trong chớp mắt, nối tiếp chuỗi.",
			"Kılıcı çekmeden kabzayla göğse vurur: hızlı, sersemletir. Ardından HAFİF ile Kesa ya da AĞIR ile Kurenai Renga.": "Không rút kiếm, đánh chuôi vào ngực: nhanh và gây choáng. Nối NHẸ ra Kesa hoặc MẠNH ra Kurenai Renga.",
			"Fırlatıcı: kından yükselen çekiş rakibi havaya kaldırır.": "Hất tung: rút kiếm vút lên nhấc đối thủ lên không.",
			"Çekiş duruşu: kısa bir an bekler; bu sırada gelen yakın dövüş darbesini yakalar ve kaçınılmaz bir iai kesiğiyle karşılık verir. Boşa giderse açık kalır.": "Thế rút kiếm: chờ trong khoảnh khắc; đòn cận chiến nào lao tới lúc đó sẽ bị bắt và đáp trả bằng nhát iai không thể tránh. Nếu không có gì tới, cô sẽ để lộ sơ hở.",
			"Kesa’dan sonra yükselen ve inen iki çekiş kesiği; son kesik yere serer.": "Sau Kesa, hai nhát rút kiếm vút lên rồi bổ xuống; nhát cuối quật ngã.",
			"Tekmeden sonra çömelip rakibin içinden geçen kızıl iai; arkasında belirir.": "Sau cú đá, hạ thấp người tung nhát iai đỏ thẫm xuyên qua đối thủ; hiện ra sau lưng họ.",
			"Tek elle uzun dürtüş, yukarı savrulan kesik ve rüzgâr adımıyla derin atılma dürtüşü.": "Cú đâm dài một tay, nhát chém hất lên và cú đâm lao sâu bằng bước gió.",
			"Dönerek geniş yatay kesik; yere serer.": "Xoay người chém ngang rộng; quật ngã.",
			"Rüzgâr adımı: çok uzaktan tek hamlede dürter, seriye devam eder.": "Bước gió: đâm từ rất xa chỉ trong một động tác, nối tiếp chuỗi.",
			"Geri çekilirken uzun menzilli iniş kesiği: yaklaşanı cezalandırır.": "Vừa lùi vừa chém bổ xuống tầm xa: trừng phạt kẻ áp sát.",
			"Fırlatıcı: dönerek yükselen kesik rakibi havaya kaldırır.": "Hất tung: xoay người chém vút lên nhấc đối thủ lên không.",
			"Geri sıçrar, ardından çok uzağa uzanan dürtüşle geri döner: gardı ezer, yere serer.": "Bật lùi, rồi quay lại với cú đâm rất xa: nghiền thế đỡ và quật ngã.",
			"Üç hızlı dürtüş; sonuncusu rüzgârla rakibi savurur.": "Ba cú đâm nhanh; cú cuối thổi bay đối thủ theo gió.",
			"İki kez dönerek çevresini biçen kesik; gardı ezer.": "Xoay hai vòng chém quanh người; nghiền thế đỡ.",
			"Kesik · Dirsek · Diz": "Chém · Cùi chỏ · Gối",
			"Tek elle kesik, dirsek darbesi ve uçan diz: kılıçla başlayıp bedenle biter.": "Chém một tay, thúc cùi chỏ và gối bay: mở đầu bằng kiếm, kết thúc bằng thân thể.",
			"İki elle tepeden ezici iniş; gardı zorlar, yere serer.": "Bổ hai tay từ trên xuống cực mạnh; ép thế đỡ và quật ngã.",
			"Omuz hücumu: öne atılıp omuzla çarpar, dengeyi sarsar. İsabet ederse seriye devam eder.": "Húc vai: lao tới húc bằng vai, làm rung tư thế. Trúng thì nối tiếp chuỗi.",
			"Kafa atar: kısa menzil, uzun sersemletme. İsabet ederse seriye devam eder.": "Húc đầu: tầm ngắn, choáng lâu. Trúng thì nối tiếp chuỗi.",
			"Fırlatıcı: aşağıdan yukarı iki elle savrulan kesik.": "Hất tung: nhát chém hai tay vung từ dưới lên.",
			"Topuğu havaya kaldırıp balta gibi indirir: yere serer.": "Giơ gót chân lên cao rồi bổ xuống như rìu: quật ngã.",
			"Dirsekten sonra kesik ve tepeden ezici iniş; son vuruş yere serer.": "Sau cùi chỏ là một nhát chém và cú bổ cực mạnh từ trên xuống; đòn cuối quật ngã.",
			"Tekmenin ardından dönen topuk tekmesi; yere serer.": "Sau cú đá là cú đá gót xoay người; quật ngã.",
			"Ters tutuşla kesik, dönen kesik ve gölge adımı: kaybolup öne geçer, dürterek belirir.": "Chém cầm ngược, chém xoay và bước bóng: biến mất, lách lên trước rồi hiện ra đâm tới.",
			"Sıçrayıp ters tutuşla aşağı saplar; yere serer.": "Bật lên và đâm xuống với kiếm cầm ngược; quật ngã.",
			"Gölge gibi uzun atılma kesiği; seriye devam eder.": "Chém lướt dài như một cái bóng; nối tiếp chuỗi.",
			"Aldatma: kesecekmiş gibi parlar, dumanla geri kaçar. Erken savuşturmayı boşa çıkarır; hemen HAFİF ile gölge adımına, AĞIR ile Kage-nui’ye bağlanır.": "Đòn giả: lóe sáng như sắp chém, rồi lùi vào làn khói. Khiến gạt đòn sớm bị hụt; nối ngay NHẸ ra bước bóng hoặc MẠNH ra Kage-nui.",
			"Fırlatıcı: ters tutuşla yükselen kesik.": "Hất tung: nhát chém vút lên với kiếm cầm ngược.",
			"Ayağının dibine sis bombası atar: yakındakini sersemletir, Kage dumanın içinde geri kaçar.": "Ném bom khói xuống chân: làm choáng kẻ ở gần trong khi Kage lùi lại trong làn khói.",
			"Üç hızlı ters kesik ve aşağı saplama; sonuncusu yere serer.": "Ba nhát chém ngược nhanh và một cú đâm xuống; đòn cuối quật ngã.",
			"Tekmeden sonra dumanda kaybolur, rakibin arkasında belirip saplar.": "Sau cú đá, biến mất trong khói rồi hiện ra sau lưng đối thủ và đâm.",
			"Nodachi serisi": "Chuỗi nodachi",
			"Ağır nodachi": "Nodachi mạnh",
			"Kodachi serisi": "Chuỗi kodachi",
			"Ağır kesik": "Chém mạnh",
			"Tantō dansı": "Vũ điệu tantō",
			"Çift kesik": "Song chém",
			"Naginata serisi": "Chuỗi naginata",
			"Ağır savuruş": "Vung mạnh",
			"Zincir ve orak": "Xích và liềm",
			"Zincir çekişi": "Kéo xích",
			"Asa serisi": "Chuỗi gậy",
			"Ağır süpürme": "Quét mạnh",
			"Yelpaze serisi": "Chuỗi quạt",
			"Rüzgâr dalgası": "Sóng gió",
			"Tantō serisi": "Chuỗi tantō",
			"Ok (basılı tut: güçlü)": "Bắn tên (giữ: nạp lực)",
			"Geri + AĞIR da ok atar (basılı tut: güçlü atış); ok kalmadıysa tantō ile tepeden iner.": "Lùi + MẠNH cũng bắn tên (giữ để bắn nạp lực); hết tên thì cô bổ xuống từ trên cao bằng tantō.",
			"KI İPTALİ!": "NỐI KI!",
			"HAVAYA!": "HẤT TUNG!"
		});
		{
			const tb = (t, c) => `<i class="tb${c ? " " + c : ""}">${t}</i>`;
			merge(EN.STR, {
				kaeshi: {
					head: "KAESHI-WAZA",
					strike: "ĐÁNH!",
					hits: "ĐÒN",
					labels: {
						suriage: "Trượt lên kiếm đối thủ, chém chéo xuống",
						harai: "Gạt kiếm đối thủ sang bên, chém vào chân",
						nuki: "Né đòn, chém từ phía sau",
						uchiotoshi: "Đập kiếm đối thủ xuống, đâm xuyên qua",
						sandan: "Chuỗi phản đòn ba nhát"
					}
				},
				trial: {
					title: "Thử combo",
					btn: {
						prev: "Combo trước",
						next: "Combo sau",
						retry: "Làm lại",
						close: "Đóng"
					},
					names: {
						chain: "Chuỗi cơ bản",
						s1: "Đòn kết chuỗi",
						s2: "Chuỗi có đá",
						launch: "Hất tung",
						s3: "Combo dài"
					},
					desc: {
						chain: "{L} ba lần. Bấm mỗi lần ngay khi đòn trước trúng; chuỗi kết thúc bằng một đòn kết có tên.",
						s1: "{L} hai lần, rồi {H}: chuỗi kết thúc bằng một nhát chém mạnh.",
						s2: "{L}, đá {K}, rồi {H}.",
						launch: "{D} + {H} để hất tung; khi họ đang bay, {L}, rồi {H}.",
						s3: "Hai {L}, {D} + {H} để hất tung, {L}, {H}: năm đòn."
					},
					ready: (w) => `Bắt đầu: ${w}`,
					startWith: (w) => `Combo này bắt đầu bằng ${w}.`,
					early: "Sớm quá: bấm khi đòn trước vừa trúng.",
					late: "Muộn quá: bấm trước khi chiêu kết thúc, ngay lúc đòn trúng.",
					wrong: (got, want) => `Sai nút: ${got}, bước này cần ${want}.`,
					dir: (want) => `Thiếu hướng: ${want}. Giữ hướng rồi bấm.`,
					miss: "Hụt: đòn không trúng. Lại gần hình nộm hơn.",
					clear: "HOÀN THÀNH COMBO!",
					clearPop: "HOÀN THÀNH COMBO!",
					all: "Đã hoàn thành mọi bài thử combo của ninja này!"
				},
				coach: {
					combo: (l) => `${l} ${l} ${l} thật nhanh: combo 3 đòn`,
					comboT: (l) => `Chạm ${l} ba lần liên tiếp: combo`,
					counter: (l) => `Sau khi đỡ hoặc gạt, bấm ${l} khi chữ ĐÁNH! hiện ra: phản đòn`,
					counterT: (l) => `Sau khi đỡ hoặc gạt, chạm ${l} khi chữ ĐÁNH! hiện ra`
				}
			});
			const L = Array.isArray(EN.STR.lessons) && EN.STR.lessons.find((l) => l.id === "counter");
			if (L) L.d = "Sau khi đỡ hoặc gạt, chữ <b>ĐÁNH!</b> hiện trên đầu bạn: bấm <kbd>F</kbd> trước khi thanh của nó cạn. Tới/lùi + <kbd>F</kbd> hoặc <kbd>G</kbd> là các phản đòn khác.";
			if (EN.STR.lessonsTouch) EN.STR.lessonsTouch.counter = `Sau khi đỡ hoặc gạt, chữ <b>ĐÁNH!</b> hiện trên đầu bạn: chạm ${tb("ĐÁNH", "tb-light")} trước khi thanh của nó cạn. Tới/lùi + ${tb("ĐÁNH", "tb-light")} hoặc ${tb("MẠNH")} là các phản đòn khác.`;
			merge(EN.PHRASES, {
				"KOMBO TAMAM!": "HOÀN THÀNH COMBO!",
				"Nasıl okunur": "Cách đọc",
				"→ rakibe doğru, ← rakipten uzağa demek: o yön tuşunu (A / D ya da ok tuşları; rakip sağındaysa D) basılı tut ve saldırı tuşuna bas. Virgül: tuşlara sırayla bas. F hafif, G ağır, R tekme, S gard.": "→ là hướng về phía đối thủ, ← là hướng ra xa: giữ phím hướng đó (A / D hoặc phím mũi tên; D khi đối thủ ở bên phải bạn) và bấm phím tấn công. Dấu phẩy: bấm lần lượt từng phím. F nhẹ, G mạnh, R đá, S đỡ.",
				"▶ rakibe doğru, ◀ rakipten uzağa: o yön tuşunu basılı tut ve düğmeye dokun. Virgül: düğmelere sırayla dokun. Antrenmandaki Kombo denemesi her seriyi adım adım gösterir.": "▶ về phía đối thủ, ◀ ra xa: giữ phím mũi tên đó rồi chạm nút. Dấu phẩy: chạm lần lượt từng nút. Thử combo trong Luyện tập hướng dẫn từng chuỗi theo từng bước.",
				"Gard ya da savuşturmanın ardından ekranda VUR! çıkar: altındaki çubuk bitmeden HAFİF’e bas. Yalnız HAFİF: Suriage. İleri + HAFİF: Harai (yere serer). Geri + HAFİF: Nuki (arkaya geçer). AĞIR: Uchiotoshi. Kendi üçüncü karşılığın seri bitirişidir; savuşturulursa zincir devam eder.": "Sau khi đỡ hoặc gạt, chữ ĐÁNH! hiện ra: bấm NHẸ trước khi thanh của nó cạn. Chỉ NHẸ: Suriage. Tới + NHẸ: Harai (quật ngã). Lùi + NHẸ: Nuki (vòng ra sau). MẠNH: Uchiotoshi. Phản đòn thứ ba của bạn là đòn kết liễu; nếu bị gạt, giằng co tiếp tục."
			});
		}
		merge(EN.STR, { gfx: {
			title: "Đồ họa",
			levels: {
				auto: "Tự động",
				high: "Cao",
				medium: "Vừa",
				low: "Thấp",
				custom: "Tùy chỉnh"
			},
			note: {
				auto: "Tự chọn theo máy của bạn và tự hạ nếu trận đấu bị giật.",
				high: "Đầy đủ ánh sáng và hiệu ứng. Cho máy mạnh.",
				medium: "Phát sáng nhẹ, không đổ bóng. Cho hầu hết điện thoại.",
				low: "Mượt nhất. Cho điện thoại đời cũ.",
				custom: "Thiết lập riêng của bạn (Nâng cao)."
			},
			now: (lv) => `Hiện tại: ${lv}`,
			adv: {
				title: "Nâng cao",
				note: "Đổi một mục sẽ chuyển sang \"Tùy chỉnh\"; bấm một mức có sẵn để lấy lại giá trị của nó.",
				hot: "nóng máy nhất",
				knob: {
					scale: "Độ phân giải",
					msaa: "Khử răng cưa",
					bloom: "Phát sáng",
					shadows: "Bóng & phản chiếu",
					effects: "Thời tiết & hạt"
				},
				val: {
					off: "Tắt",
					low: "Thấp",
					mid: "Vừa",
					full: "Đầy đủ",
					simple: "Đơn giản"
				}
			}
		} });
		merge(EN.STR, { fps: {
			title: "Tốc độ khung hình",
			show: "Hiện FPS",
			levels: { max: "Tối đa" },
			note: {
				60: "Ổn định và mát máy. Tốt nhất cho hầu hết điện thoại.",
				90: "Mượt hơn nếu màn hình hỗ trợ. Tốn pin hơn.",
				120: "Mượt nhất trên màn hình 120 Hz. Tốn pin hơn.",
				max: "Nhanh nhất mà màn hình cho phép."
			}
		} });
		merge(EN.STR, { set: {
			title: "Cài đặt",
			close: "Đóng",
			tabs: {
				audio: "Âm thanh",
				controls: "Điều khiển",
				gfx: "Đồ họa",
				lang: "Ngôn ngữ"
			},
			touch: "Cảm ứng",
			keys: "Bàn phím",
			pad: "Tay cầm",
			touchNote: "Cài đặt điều khiển cảm ứng sẽ hiện ở đây khi bạn chạm vào màn hình."
		} });
		merge(EN.STR, { lang: {
			title: "Ngôn ngữ",
			change: "Đổi ngôn ngữ",
			close: "Đóng"
		} });
		merge(EN.STR, { loadTip: {
			head: "MẸO QUAN TRỌNG",
			text: (g) => `Muốn làm chủ trận đấu? Sau MỖI đòn tấn công, hãy bấm ${g}.`
		} });
		merge(EN.STR, { thelp: {
			title: { dpad: "D-pad" },
			dpad: {
				walk: "Giữ: đi",
				step: "Chạm nhanh: bước một bước ngắn",
				jump: "Chạm: nhảy",
				guard: "Giữ: đỡ. Chạm ngay trước khi trúng đòn: gạt đòn",
				dash: "Nhấn đúp: lướt",
				both: "Bấm vào giữa hai nút để dùng cả hai (▶ + ▲ = nhảy tới)"
			},
			edit: (b) => `${b}: kéo nút bất kỳ tới chỗ bạn thích, chỉnh cỡ và độ mờ. Trong Cài đặt → Điều khiển.`
		} });
		merge(EN.PHRASES, {
			"Shuriken": "Phi tiêu",
			"KI": "KI"
		});
		merge(EN.STR, {
			menu: { arcadeDesc: "Hành trình tám trận cho mỗi ninja. Đấu tiếp đối thủ kế tiếp, mở khóa kết thúc của nhân vật và Ấn Bậc thầy." },
			sel: { title: { arcade: "Arcade · Hành trình nhân vật" } },
			journey: {
				start: "Bắt đầu hành trình",
				resume: (i, n) => "Tiếp tục · " + i + "/" + n + "",
				ending: "Xem kết thúc",
				replay: "Chơi lại hành trình",
				badge: "Ấn Bậc thầy",
				completed: "Hoàn thành hành trình",
				progress: (i, n) => "Đã xong " + i + "/" + n + " trận · Tiến trình đã lưu",
				reward: "Phần thưởng: kết thúc của nhân vật và Ấn Bậc thầy vĩnh viễn",
				saved: "Mỗi trận thắng đều được lưu. Rời trận sẽ tính là một lần thử lại.",
				menu: (done, active) => "" + done + " hành trình đã xong · " + active + " đang dở",
				clearReward: "Đã nhận Ấn Bậc thầy · Đã mở kết thúc của nhân vật"
			}
		});
		merge(EN.STR, {
			set: { tabs: { save: "Tiến trình" } },
			acct: {
				title: "Giữ tiến trình của bạn",
				cgOn: (n) => `Tài khoản PortalC: ${n}. Danh hiệu, màu Vô địch, Dan và điểm của bạn được lưu vào tài khoản.`,
				cgWait: (n) => `Tài khoản PortalC: ${n}. Đang kết nối tới tài khoản…`,
				cgFail: (n) => `Tài khoản PortalC: ${n}. Hiện không kết nối được tài khoản; điểm mới tạm lưu trên máy này.`,
				cgSave: "Lưu tiến trình vào tài khoản PortalC",
				cgSaveNote: "Đăng nhập để chuyển danh hiệu, màu Vô địch và điểm vào tài khoản, dùng được trên mọi thiết bị.",
				rcTitle: "Mã khôi phục",
				rcNote: "Hãy ghi lại mã này. Nhập nó tại đây trên thiết bị mới để lấy lại danh hiệu, màu Vô địch, Dan và điểm.",
				rcShow: "Hiện mã",
				rcNew: "Mã mới",
				rcNewDone: "Đã có mã mới; mã cũ không còn dùng được.",
				rcNeedName: "Hãy lưu một điểm số kèm biệt danh trước để nhận mã khôi phục.",
				rcEnter: "Nhập mã khôi phục",
				rcGo: "Khôi phục",
				rcDone: (n, c) => `Chào mừng trở lại, ${n}! Tiến trình đã được khôi phục. Mã khôi phục mới của bạn: ${c}`,
				err: {
					bad_code: "Không nhận ra mã này. Hãy kiểm tra lại các ký tự.",
					rate: "Thử quá nhiều lần. Hãy thử lại sau.",
					offline: "Không kết nối được máy chủ. Kiểm tra kết nối mạng.",
					banned: "Danh tính này không thể sử dụng.",
					error: "Đã có lỗi. Thử lại nhé."
				},
				local: "Ở đây không lưu trực tuyến được; tiến trình được giữ trên máy này.",
				offline: "Bạn đang ngoại tuyến; tiến trình được giữ trên máy này.",
				loading: "Đang tải…"
			},
			lb: { savedLocalAccount: (r) => r ? `#${r} trên máy này · hiện không kết nối được tài khoản` : "Đã lưu trên máy này · hiện không kết nối được tài khoản" }
		});
		merge(EN.STR, { priv: {
			notice: "Shadow Duel lưu biệt danh và điểm của bạn cho bảng xếp hạng trực tuyến.",
			policy: "Chính sách quyền riêng tư",
			terms: "Điều khoản",
			both: "Quyền riêng tư & Điều khoản",
			ok: "OK",
			label: "Thông báo quyền riêng tư",
			noticeNet: "Chơi trực tuyến: biệt danh, điểm số và các trận xếp hạng của bạn được lưu trên máy chủ của trò chơi.",
			more: "Chi tiết",
			details: "Được lưu trên máy chủ trò chơi: một mã ngẫu nhiên tạo trên thiết bị này, biệt danh bạn chọn, điểm số, cấp độ và kết quả xếp hạng của bạn (không có tài khoản, email hay tên thật). Biệt danh và điểm số được công khai trên bảng xếp hạng. Trong trận xếp hạng, thiết bị của bạn kết nối với thiết bị của đối thủ trực tiếp hoặc qua một máy chủ chuyển tiếp, nên mỗi bên có thể thấy địa chỉ IP của bên kia; máy chủ của chúng tôi chỉ giữ một dạng đã biến đổi không thể đảo ngược (băm) để giữ các trận đấu công bằng.",
			computer: "Nếu không có đối thủ, bạn có thể được ghép với đối thủ do máy tính điều khiển.",
			contact: "Để xóa dữ liệu của bạn, hãy viết tới {0} kèm biệt danh."
		} });
		merge(EN.STR, {
			menu: { trainDrill: "Tập gạt đòn" },
			tutor: {
				defend: "ĐỠ!",
				attack: "ĐÁNH!",
				again: "LẠI NÀO!",
				pass: {
					freeze: (l, g) => `Thời gian ngừng lại: ${g} để đỡ, ${l} để đánh trả`,
					slow: (l, g) => `Quay chậm: ${g} khi vòng khép lại, rồi ${l}`,
					real: (l, g) => `Tốc độ thật: ${g} để đỡ, ${l} để đánh trả, hai lần`
				},
				fail: {
					early: "Sớm quá! Đỡ ngay trước khi lưỡi kiếm chạm tới.",
					late: "Muộn quá! Đỡ ngay trước khi lưỡi kiếm chạm tới.",
					slow: "Muộn quá! Đánh trả khi chữ ĐÁNH! còn hiện.",
					atk: "Đỡ trước, rồi mới tấn công!",
					miss: "Thử lại lần nữa nào."
				},
				mastered: "THÀNH THẠO!",
				masteredSub: "Đỡ, phản đòn, lặp lại",
				warm: (l) => `Khởi động: đánh ${l} ba lần`,
				nudge: (k) => `Bấm ${k}`,
				nudgeT: (k) => `Chạm ${k}`,
				skip: "Bỏ qua ›",
				steps: {
					attack: (b) => `Chém bằng ${b}`,
					guard: (b) => `Đỡ lưỡi kiếm bằng ${b}`,
					counter: (b) => `Đánh trả bằng ${b}`,
					timing: (b, l) => `Đến lượt bạn: ${b} khi vòng khép lại, rồi ${l}`
				},
				ok: {
					attack: "TỐT LẮM!",
					guard: "ĐỠ ĐƯỢC!",
					counter: "PHẢN ĐÒN!",
					timing: "HOÀN HẢO!"
				},
				ready: "SẴN SÀNG!",
				readySub: "Giờ hãy thắng trận đấu"
			}
		});
		merge(EN.STR, {
			onb: {
				selIntro: "Chọn ninja: mỗi người có hành trình riêng",
				more: "Chi tiết"
			},
			tips: {
				head: "MẸO",
				ki: (k) => `Đầy KI! ${k}: tuyệt kỹ`,
				gbreak: (k, h) => `Nó cứ đỡ mãi: đá ${k} hoặc chém mạnh ${h} để làm đầy thanh vàng và phá thế đỡ`,
				gbreakH: (h) => `Nó cứ đỡ mãi: chém mạnh ${h} để làm đầy thanh vàng và phá thế đỡ`,
				posture: (g) => `Thanh tư thế của bạn đang đầy: lùi lại, hoặc gạt đòn bằng ${g}`,
				dash: (a) => `Nhấn đúp ${a}: lướt`,
				shuriken: (t) => `${t}: ném phi tiêu`,
				heavy: (h) => `${h}: chém mạnh, chậm hơn nhưng uy lực hơn`,
				lessons: (a, b) => `Bài học đầy đủ: ${a} → ${b}`,
				controls: (a, b) => `Bạn có thể di chuyển và đổi cỡ nút trong ${a} → ${b}`
			}
		});
		merge(EN.STR, { online: {
			title: "Chơi với bạn bè",
			menuSub: "Đấu trực tuyến · chia sẻ link hoặc mã 6 chữ cái",
			homeSub: "Tạo phòng rồi gửi link cho bạn của bạn, hoặc nhập mã bạn ấy gửi cho bạn.",
			create: "Tạo phòng",
			join: "Vào phòng",
			codePh: "MÃ",
			haveCode: "Mã phòng",
			room: "Phòng",
			linkLabel: "Link mời",
			back: "Quay lại",
			leave: "Rời phòng",
			copy: "Chép link",
			copied: "Đã chép",
			share: "Chia sẻ",
			invite: "Mời bạn bè",
			shareText: (c) => `Đấu với mình trong Shadow Duel nhé! Phòng ${c}`,
			inviteNote: "Gửi link, hoặc đọc mã cho bạn của bạn.",
			waitFriend: "Đang chờ bạn của bạn vào phòng…",
			joining: "Đang tìm phòng…",
			connecting: "Đang kết nối với bạn của bạn…",
			connected: "Đã kết nối",
			you: "Bạn",
			friend: "Bạn bè",
			friendTag: "BẠN BÈ",
			waitPick: "Đang chọn…",
			pickTitle: "Đấu sĩ của bạn",
			arenaTitle: "Đấu trường",
			arenaHost: "Bạn của bạn chọn đấu trường",
			ready: "Sẵn sàng",
			notReady: "Chưa sẵn sàng",
			readyWait: "Đang chờ bạn của bạn sẵn sàng…",
			bothReady: "Đang bắt đầu…",
			ping: (ms) => `Ping ${ms} ms`,
			badCode: "Mã phòng gồm 6 chữ cái.",
			noRoom: "Không có phòng nào với mã này. Hãy kiểm tra lại mã với bạn của bạn.",
			full: "Phòng này đã đầy.",
			expired: "Không ai vào trong 10 phút nên phòng đã đóng.",
			noDirect: "Không kết nối trực tiếp được với mạng của bạn kia. Thử mạng khác (Wi-Fi / dữ liệu di động).",
			retry: "Thử lại",
			noConnect: "Không kết nối được với bạn của bạn. Kiểm tra kết nối Internet rồi thử lại.",
			version: "Bạn và bạn của bạn đang dùng hai phiên bản game khác nhau. Cả hai hãy tải lại trang.",
			signalDown: "Không kết nối được máy chủ game. Kiểm tra kết nối Internet.",
			friendLeft: "Bạn của bạn đã rời phòng.",
			waitIn: (s) => `Đang chờ bạn của bạn… ${s}`,
			away: (s) => `Bạn của bạn đã chuyển khỏi game… ${s}`,
			leaveQ: "Rời trận đấu?",
			leaveSub: "Bạn của bạn sẽ thắng trận này.",
			stay: "Chơi tiếp",
			leaveMatch: "Rời trận",
			win: "Bạn thắng",
			lose: "Bạn thua",
			draw: "Hòa",
			over: "Trận đấu kết thúc",
			whyDrop: "Bạn của bạn bị mất kết nối. Bạn thắng (không ghi nhận).",
			whyLeft: "Bạn của bạn đã rời trận.",
			whyAway: "Trận đấu đã kết thúc khi bạn vắng mặt.",
			whyDesync: "Trận đấu bị lệch đồng bộ (lỗi kết nối) nên không được tính.",
			rematch: "Tái đấu",
			rematchWait: "Đang chờ bạn của bạn…",
			rematchAsk: "Tái đấu (bạn của bạn muốn đấu lại)",
			change: "Đổi đấu sĩ",
			rounds: (a, b) => `Hiệp ${a} – ${b}`,
			turning: (s) => `Bạn của bạn đang xoay điện thoại… ${s}`,
			paused: "Đã tạm dừng",
			whyPauseWin: "Bạn của bạn không quay lại kịp. Bạn thắng (không ghi nhận).",
			whyPauseLose: "Bạn không quay lại kịp nên trận đấu đã kết thúc.",
			whyPauseBoth: "Cả hai không quay lại kịp nên trận đấu đã kết thúc."
		} });
		merge(EN.STR, {
			ranked: {
				title: "Đấu xếp hạng",
				menuSub: "Đối thủ ngẫu nhiên · điểm, bậc và mùa giải",
				offline: "Đấu xếp hạng hiện đang tạm ngưng",
				season: (n) => `Mùa ${n}`,
				endsIn: (d) => `Kết thúc sau ${d} ngày`,
				endsToday: "Kết thúc hôm nay",
				rating: "Điểm hạng",
				record: (w, l, d) => `${w} T · ${l} B` + (d ? ` · ${d} H` : ""),
				placement: (a, b) => `Phân hạng ${a}/${b}`,
				place: (n) => `Hạng #${n}`,
				find: "Tìm đối thủ",
				findUnranked: "Tìm đối thủ (không xếp hạng)",
				board: "Bảng xếp hạng",
				how: "Cách hoạt động",
				howLines: [
					"Máy chủ tìm đối thủ có điểm hạng gần bạn; phạm vi nới rộng dần khi bạn chờ.",
					"Khi cả hai chấp nhận, bạn chọn đấu sĩ mà không thấy lựa chọn của đối thủ (chỉ những đấu sĩ bạn đã mở).",
					"Thắng 2 trong 3 hiệp là thắng. Rời trận là thua.",
					"Điểm chỉ thay đổi khi cả hai thiết bị báo cùng một kết quả. Mỗi mùa kéo dài 4 tuần; hạng #1 nhận trang phục đặc biệt."
				],
				reward: "Hạng #1 mùa giải: trang phục đặc biệt và tên trong Sảnh Vinh Danh",
				signIn: "Đăng nhập để nhận điểm",
				guestNote: "Chơi với tư cách khách sẽ không xếp hạng.",
				nickNote: "Chọn biệt danh để đấu xếp hạng.",
				back: "Quay lại",
				you: "Bạn",
				titleLbl: "Danh hiệu",
				noTitle: "Không có",
				searching: "Đang tìm đối thủ…",
				window: (n) => `Phạm vi điểm hạng ±${n}`,
				windowAny: "Mọi điểm hạng",
				warm: "Khởi động với máy trong lúc chờ",
				warmTag: "Khởi động · máy · không xếp hạng",
				searchShort: "Đang tìm",
				warmBack: "Về tìm trận",
				cancel: "Hủy",
				none: "Hiện chưa có đối thủ.",
				foundTitle: "Đã tìm thấy đối thủ!",
				accept: "Chấp nhận",
				decline: "Từ chối",
				ranked: "Xếp hạng",
				unranked: "Không xếp hạng · không tính điểm",
				why: {
					guest: "có người chơi là khách",
					same_network: "hai bạn dùng chung mạng",
					pair_limit: "hôm nay bạn đã đấu xếp hạng 3 trận với người này",
					daily_limit: "giới hạn trận xếp hạng trong ngày"
				},
				waitOpp: "Đang chờ đối thủ chấp nhận…",
				touch: "Cảm ứng",
				keys: "Bàn phím / tay cầm",
				placementTag: "Phân hạng",
				guestTag: "Khách",
				declined: "Đối thủ không chấp nhận · đang tìm lại",
				youDeclined: "Bạn đã từ chối trận đấu.",
				penalty: (s) => `Bạn vừa từ chối nhiều trận: có thể tìm lại sau ${s} giây.`,
				suspended: "Tài khoản xếp hạng của bạn đang được xem xét (quá nhiều tranh chấp). Các chế độ khác vẫn mở.",
				pickTitle: "Chọn đấu sĩ",
				pickSub: "Đối thủ không thấy lựa chọn của bạn",
				lock: "Chốt",
				lockedIn: "Đã chốt",
				oppPicking: "Đối thủ đang chọn…",
				oppLocked: "Đối thủ đã chốt",
				lockedFighter: "Chưa mở khóa ở chế độ chơi đơn",
				costume: "Trang phục",
				plain: "Màu gốc",
				connecting: "Đang kết nối với đối thủ…",
				noConnect: "Không kết nối được với đối thủ; trận này không tính. Đang tìm lại…",
				leaveQ: "Rời trận đấu?",
				leaveSub: "Bạn sẽ thua trận xếp hạng này.",
				stay: "Chơi tiếp",
				leave: "Rời trận",
				waitIn: (s) => `Đang chờ đối thủ… ${s}`,
				away: (s) => `Đối thủ đã chuyển khỏi game… ${s}`,
				turning: (s) => `Đối thủ đang xoay điện thoại… ${s}`,
				paused: "Đã tạm dừng",
				confirming: "Đang xác nhận kết quả…",
				win: "Bạn thắng",
				lose: "Bạn thua",
				draw: "Hòa",
				over: "Trận đấu kết thúc",
				delta: (d) => (d >= 0 ? "+" : "−") + Math.abs(d) + " điểm",
				nc: "Trận này không được tính",
				disputed: "Hai thiết bị báo kết quả khác nhau: trận đấu đang được xem xét và không thay đổi điểm.",
				ncWhy: {
					desync: "hai thiết bị tính trận đấu khác nhau (lỗi kết nối)",
					connection: "cả hai người chơi đều mất kết nối",
					input_mismatch: "dữ liệu thao tác của hai thiết bị không khớp",
					abandoned: "cả hai người chơi đều rời trận",
					no_second_report: "kết quả của đối thủ không gửi tới",
					mixed: "kết quả không khớp nhau"
				},
				promoted: "Thăng bậc!",
				demoted: "Tụt bậc",
				placementDone: "Hoàn tất phân hạng!",
				pending: "Kết quả sẽ sớm hiện trên bảng xếp hạng.",
				findAgain: "Tìm lại",
				rematch: "Tái đấu",
				rematchWait: "Đang chờ đối thủ…",
				rematchAsk: "Tái đấu (đối thủ muốn đấu lại)",
				menu: "Menu",
				youLeft: "Bạn đã rời trận: tính thua.",
				oppLeft: "Đối thủ đã rời trận: bạn thắng.",
				silent: "Đối thủ bị mất kết nối.",
				rounds: (a, b) => `Hiệp ${a} – ${b}`,
				unrankedNote: "Trận không xếp hạng",
				ghostFound: "Bóng của một người chơi thật đã vào trận",
				ghostHouseName: (n) => `Bóng võ đường · ${n}`,
				ghostHouseFound: "Một bóng võ đường đã vào trận",
				ghostHouseNote: "Máy đánh theo một lối đánh điển hình của võ đường. Không phải người chơi trực tiếp.",
				ghostName: (n) => `Bóng của ${n}`,
				ghostTag: "Bóng",
				ghostNote: "Máy đánh theo lối của người chơi thật này. Không phải người chơi trực tiếp.",
				ghostReady: "Cái bóng đã sẵn sàng",
				ghostLeft: "Bạn đã rời trận đấu bóng: tính thua.",
				aiTag: "AI",
				hallTab: "Xếp hạng",
				hallDesc: (g) => `Những người giỏi nhất mùa này · cần ${g} trận xếp hạng để lên bảng`,
				champs: "Nhà vô địch",
				champOf: (n) => `Vô địch mùa ${n}`,
				noChamps: "Chưa có nhà vô địch mùa nào.",
				me: (p) => `Vị trí của bạn: #${p}.`,
				meNone: "Đấu xếp hạng để lên bảng.",
				empty: "Mùa này chưa có ai trên bảng.",
				tierDesc: [
					"Bộ binh",
					"Samurai lang thang",
					"Samurai",
					"Hộ vệ cờ",
					"Lãnh chúa",
					"Shogun"
				],
				rulesBtn: "Cách đấu xếp hạng",
				rulesTitle: "Cách đấu xếp hạng",
				rulesSub: "Bậc, điểm và mùa giải",
				rTiers: "Các bậc",
				rYou: "Bạn",
				rNext: (n, name) => `Còn ${n} điểm nữa lên ${name}`,
				rTop: "Bạn đang ở bậc cao nhất",
				rPlacing: (a, b) => `Phân hạng ${a}/${b}: bậc của bạn sẽ hiện khi xong`,
				rPlacement: "Phân hạng",
				rPlaceLine: (a, b) => `${a} trận xếp hạng đầu tiên sẽ phân hạng cho bạn (${b} trận ở các mùa sau); sau đó bậc của bạn sẽ hiện.`,
				rPoints: "Điểm",
				rPointsLines: [
					"Thắng thì được điểm, thua thì mất điểm; hòa thì thay đổi một chút.",
					"Thắng đối thủ mạnh hơn được nhiều điểm hơn; thua đối thủ yếu hơn mất nhiều điểm hơn.",
					"Rời trận được tính là thua."
				],
				rSeason: "Mùa giải",
				rSeasonLine: (d, left) => `Mỗi mùa kéo dài ${d} ngày · ${left}.`,
				rSeasonEnd: (p) => `Cuối mùa, điểm hạng của bạn kéo về một nửa khoảng cách tới 1500 và bạn đấu lại ${p} trận phân hạng; bậc cao nhất của bạn được giữ làm huy hiệu.`,
				rReward: (list, n) => `Hạng #1 của mùa nhận: ${list} (khi có ít nhất ${n} người chơi trên bảng).`,
				rCostumeAll: (x) => `${x} (cho mọi đấu sĩ)`,
				rRewardAny: "một trang phục và danh hiệu đặc biệt",
				rBoard: "Bảng xếp hạng",
				rBoardLine: (g) => `Để lên bảng: ${g} trận xếp hạng trong mùa này và đã xong phân hạng.`,
				rFighters: "Đấu sĩ",
				rFightersLine: "Bạn có thể chọn những đấu sĩ đã mở khóa ở chế độ chơi đơn.",
				aiNote: "Khi ít người chơi trực tuyến, bạn có thể gặp đối thủ AI đánh theo lối của người chơi thật.",
				gotIt: "Đã hiểu",
				err: {
					network: "Không kết nối được máy chủ. Kiểm tra kết nối Internet.",
					bad_version: "Đã có phiên bản game mới: hãy tải lại trang.",
					busy: "Hàng chờ đang rất đông, thử lại sau nhé.",
					rate_limited: "Thử quá nhiều lần, đợi một chút.",
					disabled: "Đấu xếp hạng hiện đang tạm ngưng.",
					banned: "Tài khoản này không thể đấu xếp hạng.",
					other: "Đã có lỗi, thử lại nhé."
				},
				bg: {
					ru: "Xem menu khi đang tìm",
					stopT: "Dừng tìm trận xếp hạng?",
					stopS: "Bắt đầu trận này sẽ dừng việc tìm trận.",
					stopGo: "Dừng và chơi",
					keep: "Tiếp tục tìm",
					stopped: "Đã dừng tìm trận xếp hạng",
					chip: "Đang tìm"
				},
				card: {
					findMatch: "Tìm trận",
					searching: "Đang tìm…",
					resume: "Quay lại trận",
					place: (p, n) => `Hạng ${p}/${n} trên bảng`,
					placeOnly: (p) => `Hạng ${p} trên bảng`,
					toBoard: (n) => `Còn ${n} trận nữa để vào bảng xếp hạng`,
					toBoardSoon: "Thêm vài trận nữa để vào bảng xếp hạng",
					invite: "Từ Ashigaru đến Shōgun: trận xếp hạng đầu tiên chỉ cách một chạm",
					guestInvite: "Đăng nhập để chơi tính điểm · khách chơi không tính điểm",
					nickInvite: "Chọn biệt danh để chơi tính điểm",
					winRate: (p) => `Thắng ${p}%`,
					streakW: (n) => `Thắng ${n} trận liên tiếp`,
					streakL: (n) => `Thua ${n} trận liên tiếp`,
					peak: (t) => `Cao nhất mùa: ${t}`,
					shields: (n) => `Khiên ×${n}`,
					top: "Top 3 mùa giải",
					you: "Bạn",
					empty: "Chưa có ai trên bảng: hãy là người đầu tiên",
					rating: "điểm"
				}
			},
			upd: {
				ready: "Đã có phiên bản mới — chạm để cập nhật",
				refresh: "Đã có phiên bản mới — tải lại trang để chơi",
				close: "Đóng"
			}
		});
		merge(EN.STR, { pass: {
			k: "影",
			lv: "LV",
			level: (n) => `Cấp ${n}`,
			xp: (a, b) => `${a} / ${b} XP`,
			xpMax: (n) => `Tổng ${n} XP`,
			plus: (n) => `+${n} XP`,
			name: "Thẻ Bóng Tối",
			season: (n) => `Mùa ${n}`,
			left: (d) => `Còn ${d} ngày`,
			lastDay: "Ngày cuối",
			tier: (t, n) => `Mốc ${t}/${n}`,
			ready: (n) => `${n} phần thưởng chờ nhận`,
			free: "Miễn phí",
			bonus: "Bóng",
			bonusAds: "Mỗi phần thưởng: một quảng cáo",
			bonusWait: (n) => `Không xem quảng cáo: mở sau ${n} mốc`,
			claim: "Nhận",
			claimAll: (n) => `Nhận hết (${n})`,
			owned: "Đã nhận",
			watch: "Xem QC",
			milestone: "Miễn phí",
			opensAt: (t) => `Ở mốc ${t}`,
			online: "Cần trực tuyến",
			soon: "Sắp có thêm mốc mới",
			soonXp: "XP của bạn vẫn tiếp tục cộng dồn",
			close: "Đóng",
			tabs: {
				pass: "Thẻ",
				profile: "Hồ sơ"
			},
			rows: {
				win: "Thắng",
				loss: "Tham chiến",
				rounds: "Hiệp",
				perfect: "Hoàn hảo",
				rally: "Giằng co",
				counter: "Phản đòn",
				parry: "Gạt đòn",
				short: "Trận nhanh",
				boost: "Tăng tốc",
				daily: "Trận thắng đầu ngày",
				streak: "Chuỗi ngày",
				clear: "Hành trình",
				trial: "Thử combo",
				tutorial: "Hướng dẫn",
				first: "Quà chào mừng"
			},
			streakN: (n) => `ngày ${n}`,
			up: "Lên cấp",
			got: "Phần thưởng mới",
			boostName: (n) => `×1,5 XP · ${n} trận`,
			honorName: (n) => `+${n} danh dự`,
			gotDup: (n) => `Bạn đã có rồi: thay vào đó nhận ×1,5 XP trong ${n} trận`,
			boostLeft: (n) => `×1,5 XP · còn ${n} trận`,
			kinds: {
				cos: "Trang phục",
				title: "Danh hiệu",
				badge: "Huy hiệu",
				frame: "Khung",
				trail: "Vệt kiếm",
				boost: "Tăng tốc XP",
				honor: "Danh dự"
			},
			use: "Trang bị",
			inUse: "Đang dùng",
			none: "Chưa có",
			wearHint: "Mặc trang phục ở màn chọn đấu sĩ, trong hàng Màu sắc.",
			heads: {
				titles: "Danh hiệu",
				badges: "Huy hiệu",
				frames: "Khung",
				trails: "Vệt kiếm",
				costumes: "Trang phục",
				seals: "Ấn hành trình"
			},
			total: (n) => `Tổng ${n} XP`,
			streak: (n) => `${n} ngày liên tiếp`,
			daily: "Trận thắng đầu ngày: +100 XP",
			dailyDone: "Trận thắng đầu hôm nay: đã xong",
			seal: {
				1: "Đã xong hành trình",
				2: "Menkyo: xong hành trình 2 lần",
				3: "Kaiden: xong hành trình 3 lần"
			},
			clears: (n) => `Đã xong hành trình ${n}×`,
			next2: "Hoàn thành hành trình lần 2: trang phục và danh hiệu Menkyo",
			next3: "Hoàn thành lần 3: bóng và danh hiệu Kaiden",
			rank: {
				2: "Menkyo",
				3: "Kaiden"
			},
			cos2: (n) => `${n} · màu Menkyo`,
			cos3: (n) => `${n} · bóng Kaiden`,
			themes: {
				sakura: "Anh Đào",
				ember: "Than Hồng",
				frost: "Sương Giá",
				jade: "Ngọc Bích",
				ash: "Tro Tàn",
				moon: "Ánh Trăng",
				lotus: "Hoa Sen",
				storm: "Bão Tố",
				yami: "Yami"
			},
			items: {
				trail_sakura: "Vệt anh đào",
				trail_ember: "Vệt than hồng",
				trail_frost: "Vệt sương giá",
				trail_jade: "Vệt ngọc bích",
				trail_violet: "Vệt tím",
				trail_gold: "Vệt vàng",
				title_novice: "Kiếm Tân Binh",
				title_wanderer: "Lãng Khách",
				title_duelist: "Kiếm Khách",
				title_parry: "Tường Thép",
				title_ronin: "Ronin",
				title_nightblade: "Dạ Kiếm",
				title_s1: "Bóng Mùa 1",
				badge_blade: "Huy hiệu kiếm",
				badge_moon: "Huy hiệu trăng",
				badge_fire: "Huy hiệu lửa",
				badge_snow: "Huy hiệu tuyết",
				badge_sakura: "Huy hiệu anh đào",
				badge_dragon: "Huy hiệu rồng",
				badge_kage: "Huy hiệu bóng",
				frame_bronze: "Khung đồng",
				frame_silver: "Khung bạc",
				frame_crimson: "Khung đỏ thẫm",
				frame_jade: "Khung ngọc bích",
				frame_gold: "Khung vàng"
			}
		} });
		merge(EN.STR, { pass: {
			kinds2: {
				pose: "Tư thế chiến thắng",
				hitfx: "Hiệu ứng đòn đánh",
				slash: "Nhát chém phản đòn",
				aura: "Hào quang khí",
				ko: "Đòn kết liễu KO",
				card: "Thẻ tên",
				arena: "Biến thể đấu trường",
				music: "Nhạc menu",
				rkey: "Chìa khóa",
				akey: "Chìa khóa",
				ticket: "Vé",
				shield: "Khiên"
			},
			items2: {
				key_rival: "Chìa khóa thách đấu",
				key_arena: "Chìa khóa đấu trường",
				ticket_trial: "Vé dùng thử",
				shield: "Khiên xếp hạng"
			},
			heads2: {
				title: "Danh hiệu",
				flair: "Trang trí khi đấu",
				arenas: "Biến thể đấu trường",
				music: "Nhạc menu",
				items: "Vật phẩm"
			},
			profile: "Hồ sơ",
			profileSub: "Danh hiệu · trang phục · trang trí",
			passTab: "Thẻ Bóng Tối",
			tapEquip: "Chạm để trang bị",
			plain: "Thường",
			usual: "Mặc định",
			noneYet: "Nhận từ Thẻ Bóng Tối",
			shields: (n, m) => `Khiên xếp hạng ${n}/${m}`,
			shieldHelp: "Thua trận xếp hạng mà không mất điểm; mỗi ngày một lần, tự kích hoạt.",
			tickets: (n) => `Vé dùng thử: ${n}`,
			ticketHelp: "Dùng thử ninja bị khóa trong 3 trận với máy: chạm vào ninja đó ở màn chọn đấu sĩ.",
			useTicket: (n) => `Vé dùng thử · ${n} trận`,
			useTicketSub: (n) => `Đang có ${n}`,
			ticketLeft: (n) => `Dùng thử: còn ${n} trận`,
			keyRival: (name) => `Đã mở thách đấu: ${name}`,
			keyArena: (name) => `Đã mở đấu trường: ${name}`,
			keyHonor: (n) => `Không còn gì để mở: +${n} danh dự`,
			shieldGot: (n, m) => `Khiên xếp hạng: ${n}/${m}`,
			shieldFull: (n) => `Khiên đã đầy: nhận +${n} danh dự thay thế`,
			shieldOff: (n) => `Ở đây không có xếp hạng: nhận +${n} danh dự thay thế`,
			shieldUsed: "Đã dùng khiên: không mất điểm",
			rankedHonor: (n) => `+${n} danh dự`,
			variant: "Biến thể",
			newTag: "MỚI",
			newN: (n) => `Mới: ${n}`,
			headUnlocks: "Ninja và đấu trường",
			headRewards: "Phần thưởng xếp hạng",
			flair: {
				pose_tenchi: "Giương Lên Trời",
				pose_rei: "Cúi Chào Rei",
				pose_hiza: "Zanshin Quỳ Gối",
				pose_katsugi: "Vác Kiếm Trên Vai",
				pose_kissaki: "Tới Lượt Ngươi",
				hitfx_kinpaku: "Đòn Lá Vàng",
				hitfx_aizome: "Mực Chàm",
				hitfx_sakura: "Bùng Nổ Anh Đào",
				hitfx_kitsunebi: "Lửa Hồ Ly",
				hitfx_raijin: "Tia Lửa Raijin",
				slash_kin: "Lưỡi Chém Vàng",
				slash_sumi: "Bút Lông Sumi",
				slash_hana: "Gió Cánh Hoa",
				slash_rai: "Nhát Chém Sấm",
				aura_kitsunebi: "Hào Quang Lửa Hồ Ly",
				aura_raiun: "Hào Quang Bão Tố",
				aura_hana: "Hào Quang Hoa",
				aura_gekko: "Hào Quang Ánh Trăng",
				ko_enso: "Kết Liễu Ensō",
				ko_hanafubuki: "Bão Cánh Hoa",
				ko_raiko: "Sét Đánh",
				ko_mikazuki: "Trăng Lưỡi Liềm",
				card_seigaiha: "Sóng Seigaiha",
				card_yozakura: "Anh Đào Đêm",
				card_ryu: "Sơn Mài Rồng",
				card_tsukiyo: "Rừng Thông Dưới Trăng",
				card_asanoha: "Vàng Asanoha",
				arena_temple_snow: "Đền Tuyết Rơi",
				arena_rain_moon: "Rừng Trúc Dưới Trăng",
				arena_snow_night: "Đỉnh Tuyết Về Đêm",
				arena_market_rain: "Chợ Đêm Mưa",
				music_haru: "Vườn Xuân",
				music_yuki: "Trăng Tuyết",
				music_matsuri: "Đêm Lễ Hội",
				pass1_akane: "Lễ Phục Bóng Trăng"
			}
		} });
		void dec;
		void fmtTime;
		void num;
	};
	(ND.JOURNEY_COPY || (ND.JOURNEY_COPY = {}))["vi"] = {
		ui: [
			"Hành trình nhân vật",
			"Đối thủ cuối",
			"Tinh thông (tùy chọn)",
			"Thắng trận này để giữ ngôi sao.",
			"Đã nhận sao tinh thông",
			"Chưa nhận sao · Thử lại khi chơi lại",
			"Sao tinh thông",
			"Hoàn thành hành trình với 6 trên 8 sao để nhận danh hiệu và màu Di sản. Sao được giữ qua các lần chơi lại.",
			"Màu gốc",
			"Màu Di sản",
			"Ngoại hình",
			"Nhận 6 sao tinh thông và hoàn thành hành trình của nhân vật này.",
			"Hành trình và phần thưởng trước của bạn vẫn được giữ. Chơi lại để khám phá con đường mới.",
			"Thử thách Shura: hoàn thành hành trình của 3 nhân vật khác nhau.",
			"Thắng trận này để mở khóa",
			"Hoàn thành hành trình",
			"Chương"
		],
		goals: [
			"Gạt đòn",
			"Phản đòn trúng",
			"Đòn mạnh trúng",
			"Cú đá trúng",
			"Đòn trên không trúng",
			"Đòn lướt trúng",
			"Đòn combo thứ ba",
			"Đòn phóng trúng",
			"Tuyệt kỹ ki trúng",
			"Phá thế đỡ"
		],
		titles: [
			"Lời Thề Đỏ Thắm",
			"Ngọn Gió Tự Do",
			"Trái Tim Của Núi",
			"Dấu Chân Mùa Đông",
			"Hoa Dưới Trăng",
			"Ngọn Cờ Bất Khuất",
			"Dũng Khí Không Mặt Nạ",
			"Lời Hứa Lặng Thầm",
			"Mãnh Hổ Thoát Xích",
			"Bàn Tay Rộng Mở",
			"Làn Gió Tĩnh Lặng",
			"Chân Trời Xa",
			"Bình Minh Thứ Hai"
		],
		endings: [
			"Akane hạ kiếm trước Ren. Cô sẽ dựng lại võ đường bằng việc dạy dỗ, không phải báo thù.",
			"Aoi kết thúc trận đấu cũ với Akane và rời ngôi đền như một người ngang hàng, tự do chọn con đường của mình.",
			"Kuro và Tetsu buông vũ khí. Con đường núi lại mở cho dân làng.",
			"Yuki nắm lấy bàn tay Hana chìa ra. Lần đầu tiên, cô để lại dấu chân bên cạnh dấu chân của người khác.",
			"Hana đưa Yuki trở lại lễ hội đèn lồng. Điệu múa cuối của cô có chỗ cho một người bạn.",
			"Tetsu giành được sự kính trọng của Kuro và cắm cờ nơi đèo: sẽ không dân làng nào bị xua đuổi.",
			"Ren vượt qua mánh khóe của Kage và tự tháo mặt nạ của mình. Cậu không còn cần nỗi sợ để được lắng nghe.",
			"Kage cho Ren thấy gương mặt mình, rồi biến mất. Lần này, lời hứa của anh sống lâu hơn cái bóng.",
			"Tora đặt sợi xích cạnh cây gậy của Jin. Bến sông không thuộc về chủ nhân nào.",
			"Jin chặn Tora mà không lấy mạng hắn. Bên thác nước, một học trò mới xin bài học đầu tiên.",
			"Mai bắt mũi tên cuối của Tsubame bằng chiếc quạt. Cuộc so tài của họ kết thúc bằng một cái cúi chào, không phải mối hận.",
			"Tsubame cuối cùng cũng đọc được gió của Mai. Cô giữ lại mũi tên cuối và hướng về một chân trời mới.",
			"Shura đối mặt Akane mà không đội vương miện. Thất bại không còn định nghĩa hắn; bài học tiếp theo bắt đầu lúc bình minh."
		]
	};
	if (ND.i18n && ND.i18n.loaded) ND.i18n.loaded("vi");
})(window.ND = window.ND || {});
