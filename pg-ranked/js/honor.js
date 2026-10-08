(function(ND) {
	"use strict";
	const H = ND.HONOR = {
		win: [
			20,
			35,
			50,
			80
		],
		loss: 6,
		roundWon: 4,
		parry: 1,
		counter: 1,
		rally: 3,
		perfect: 5,
		styleCap: 15,
		modeMul: {
			cpu: 1,
			arcade: 1,
			tourney: 1.2,
			dan: 1.2,
			rival: 1,
			ranked: 1,
			shadow: 1
		},
		arcadeClear: 150,
		tourneyClear: 150,
		rivalWin: 40,
		lesson: 5,
		tutorial: 25,
		danPass: (rank) => 30 + 5 * rank,
		RIVALS: [
			{
				id: "hana",
				need: 100,
				lv: 0,
				hp: 1.3,
				arena: "market"
			},
			{
				id: "tetsu",
				need: 330,
				lv: 1,
				hp: 1,
				arena: "village"
			},
			{
				id: "ren",
				need: 620,
				lv: 1,
				hp: 1,
				arena: "village"
			},
			{
				id: "kage",
				need: 950,
				lv: 1,
				hp: 1.05,
				arena: "market"
			},
			{
				id: "tora",
				need: 1400,
				lv: 1,
				hp: 1.15,
				arena: "waterfall"
			},
			{
				id: "jin",
				need: 1950,
				lv: 2,
				hp: .9,
				arena: "temple"
			},
			{
				id: "mai",
				need: 2600,
				lv: 2,
				hp: 1,
				arena: "market"
			},
			{
				id: "tsubame",
				need: 3350,
				lv: 2,
				hp: .9,
				arena: "rain"
			}
		],
		soften: .1,
		softenMin: .6,
		ARENAS: [
			{
				id: "village",
				need: 250
			},
			{
				id: "market",
				need: 550
			},
			{
				id: "waterfall",
				need: 900
			}
		],
		OLD_WINS: {
			hana: 2,
			tetsu: 4,
			ren: 6,
			tora: 8,
			jin: 10,
			mai: 12,
			tsubame: 14
		},
		rival(id) {
			return H.RIVALS.find((r) => r.id === id) || null;
		},
		rivalHp(r, fails) {
			return Math.max(H.softenMin, +(r.hp - H.soften * (fails | 0)).toFixed(2));
		},
		match(c) {
			const rows = [], mul = H.modeMul[c.mode] || 1;
			if (c.won) rows.push(["win", Math.round((H.win[c.level] ?? H.win[1]) * mul)]);
			else {
				rows.push(["loss", Math.round(H.loss * mul)]);
				if (c.roundsWon > 0) rows.push([
					"rounds",
					Math.round(H.roundWon * c.roundsWon * mul),
					c.roundsWon
				]);
			}
			let cap = H.styleCap;
			const style = (key, n, each) => {
				n = Math.max(0, n | 0);
				if (!n || cap <= 0) return;
				const v = Math.min(cap, n * each);
				cap -= v;
				rows.push([
					key,
					v,
					n
				]);
			};
			style("perfect", c.perfects, H.perfect);
			style("rally", c.rallies, H.rally);
			style("counter", c.counters, H.counter);
			style("parry", c.parries, H.parry);
			return {
				total: rows.reduce((s, r) => s + r[1], 0),
				rows
			};
		},
		migrate(p) {
			let t = (p.wins | 0) * 40 + (p.clears | 0) * H.arcadeClear;
			const dan = p.bz && p.bz.dan;
			if (dan) for (let r = 1; r <= Math.min(20, dan.best | 0); r++) t += H.danPass(r);
			const weeks = p.bz && p.bz.t || {};
			for (const k in weeks) t += Math.min(8, weeks[k] && weeks[k].won | 0) * 45;
			if (Array.isArray(p.lessons)) t += p.lessons.length * H.lesson;
			if (p.tutorial) t += H.tutorial;
			const own = Array.isArray(p.chars) ? p.chars : [];
			for (const r of H.RIVALS) if (own.includes(r.id)) t = Math.max(t, r.need);
			return Math.round(t);
		}
	};
})(typeof window !== "undefined" ? window.ND : globalThis.ND);
