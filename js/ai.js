// Gölge Düellosu — yapay zekâ: mesafe kontrolü, tepki süresi, savuşturma zamanlaması, kombo kararları
(function (ND) {
  'use strict';
  const { rand } = ND.M;

  const LEVELS = ND.AI_LEVELS = {
    // combo layer: cmd = command normals as openers, str = string enders / launchers inside a chain,
    // jug = air follow-up after a landed launcher, kc = ki cancel from a landed string/launcher
    // read = how well it reads a pressing / repeating opponent: guards before the next attack of a player who keeps
    // attacking, and times its parry on an attack it has seen the same player repeat (anticipation, not reaction:
    // react stays at human speed, a fresh or varied attack is still met at react time)
    // 2026-09 difficulty pass (owner: "too easy, the CPU defends and attacks too little"): every level defends, reads
    // and presses more; a light-attack spammer now loses from Usta up and struggles against Çırak.
    0: { name: 'Çırak', react: 0.3, parry: 0.12, guard: 0.55, dodge: 0.14, aggr: 0.46, combo: 0.5, tick: [0.22, 0.42], smart: 0.3, mash: 4.5, counter: 0.45, rally: 0.4, cmd: 0.12, str: 0.22, jug: 0.2, kc: 0.15, read: 0.4 },
    1: { name: 'Usta', react: 0.2, parry: 0.4, guard: 0.74, dodge: 0.25, aggr: 0.6, combo: 0.78, tick: [0.13, 0.27], smart: 0.68, mash: 7, counter: 0.78, rally: 0.7, cmd: 0.32, str: 0.52, jug: 0.55, kc: 0.5, read: 0.8 },
    2: { name: 'Efsane', react: 0.13, parry: 0.66, guard: 0.88, dodge: 0.36, aggr: 0.66, combo: 0.92, tick: [0.07, 0.17], smart: 0.95, mash: 9.5, counter: 0.9, rally: 0.92, cmd: 0.48, str: 0.76, jug: 0.85, kc: 0.8, read: 0.85 },
    // Arcade son patronu (Şura): daha hızlı tepki, daha çok savuşturma ve karşılık
    3: { name: 'Şura', react: 0.11, parry: 0.74, guard: 0.92, dodge: 0.38, aggr: 0.72, combo: 0.96, tick: [0.05, 0.14], smart: 1, mash: 11, counter: 0.96, rally: 0.95, cmd: 0.52, str: 0.84, jug: 0.92, kc: 0.9, read: 0.92 },
  };

  class AI {
    constructor(me, level) {
      this.me = me; this.c = me.ctrl; this.lv = LEVELS[level] || LEVELS[1];
      this.held = {}; this.taps = []; this.t = 0; this.next = 0.4;
      this.seen = null; this.pending = null; this.guardUntil = 0; this.move = 0; this.moveUntil = 0;
      this.chainDone = null; this.seenProj = new Set(); this.ideal = this.idealFor();
    }
    setHeld(a, on) {
      if (on && !this.held[a]) { this.c.press(a, 'ai'); this.held[a] = true; }
      else if (!on && this.held[a]) { this.c.release(a, 'ai'); this.held[a] = false; }
    }
    tap(a) { this.c.release(a, 'ai'); this.held[a] = false; this.c.press(a, 'ai'); this.taps.push(a); }
    releaseAll() { for (const a in this.held) this.setHeld(a, false); this.move = 0; }

    update(dt) {
      const me = this.me, o = me.opp, lv = this.lv;
      this.t += dt;
      for (const a of this.taps) if (!this.held[a]) this.c.release(a, 'ai');
      this.taps.length = 0;
      if (this.holdT && this.t >= this.holdT) { this.setHeld('heavy', false); this.holdT = 0; } // şarjlı atış: tuşu bırak
      if (me.locked || me.dead || o.dead) { this.releaseAll(); return; }

      if (me.state === 'lock') {
        this.mashT = (this.mashT || 0) - dt;
        if (this.mashT <= 0) { this.tap(Math.random() < 0.7 ? 'light' : 'heavy'); this.mashT = rand(0.8, 1.25) / lv.mash; }
        return;
      }
      const dist = Math.abs(o.x - me.x), fwd = o.x >= me.x ? 1 : -1;
      const G = ND.game;

      // --- karşılık penceresi açık: kaeshi-waza ile hücuma geç
      if (me.counterUntil > G.clock && me.serial !== this.cTok && ['block', 'parry', 'guard', 'move'].includes(me.state)) {
        this.cTok = me.serial;
        if (Math.random() < lv.counter) {
          const r = Math.random();
          this.cAct = r < 0.12 ? 'heavy' : 'light';
          this.cDir = r < 0.12 ? 0 : r < 0.24 ? 1 : r < 0.34 ? -1 : 0;
          this.cAt = this.t + rand(0.02, Math.min(0.16, me.counterWin * 0.55));
        }
      }
      if (this.cAt && this.t >= this.cAt) {
        this.cAt = 0;
        if (me.counterUntil > G.clock) {
          this.setHeld('guard', false); this.guardUntil = 0;
          if (this.cDir) this.moveDir(this.cDir * fwd); else { this.move = 0; this.setHeld('left', false); this.setHeld('right', false); }
          this.tap(this.cAct);
        }
      }
      // --- caught in a string by a pressing opponent: keep guard held through the hit stun (as a player does), so the
      // next swing of a mashed loop meets the guard instead of landing again
      if (me.state === 'hurt' && this.hTok !== me.serial) {
        this.hTok = me.serial;
        if (Math.random() < lv.read * Math.min(1, this.heat() * 0.4)) { this.setHeld('guard', true); this.guardUntil = this.t + Math.max(0, me.dur - me.st) + rand(0.2, 0.4); this.move = 0; }
      }
      // --- kılıcım bloklandı: karşılık gelecek, önceden gard al
      if (me.state === 'recoil' && this.rTok !== me.serial) {
        this.rTok = me.serial;
        if (Math.random() < lv.rally) { this.anticipate = this.t + 0.9; this.setHeld('guard', true); this.guardUntil = this.t + 0.7; this.move = 0; }
      }

      // --- rakibin saldırısını algıla → tepki planla
      if (o.state === 'atk' && o.keys !== this.seen) {
        this.seen = o.keys;
        const a = o.atk;
        if (!a.counter) this.note(o.atkName);
        // a.reach: uzun menzilli hareketler (zincir, asa); 'shoot' (ok) mermi döngüsünde ele alınır
        // the fixed ranges were tuned for a katana (blade + handle ≈ 120): longer poles (nodachi, naginata) reach
        // further with the same moves, so the AI must see those swings coming from further away too
        const longer = a.reach ? 0 : Math.max(0, o.ch.blade + (o.ch.handle || 0) - 120) * 1.1;
        const threat = a.kind === 'throw' || a.kind === 'shoot' || a.kind === 'stance' || !a.active ? false : dist < (a.special ? 700 : a.reach || (a === ND.ATK.light3 || a === ND.ATK.heavy ? 290 : 235) + longer);
        if (threat && a.counter && this.anticipate > this.t) {
          const startAt = this.t - o.st / (o.ch.spd * o.aspd), w0 = a.active[0] / (o.ch.spd * o.aspd);
          if (Math.random() < lv.parry + 0.2) this.pending = { act: 'parry', at: startAt + w0 - rand(0.03, 0.08), until: startAt + w0 + 0.25 };
          else { this.setHeld('guard', true); this.guardUntil = Math.max(this.guardUntil, startAt + w0 + 0.3); }
        } else if (threat && a.active && Math.random() < this.readP()) {
          // read: the same player keeps pressing (or repeats this very move) → the guard is up for it in time, often
          // as a parry. Timed from the move's own start-up, like a player who has learned the rhythm.
          const k = o.ch.spd * o.aspd, startAt = this.t - o.st / k, w0 = startAt + a.active[0] / k;
          const parry = Math.random() < lv.parry + 0.25;
          this.pending = { act: 'guard', at: Math.max(this.t, w0 - (parry ? rand(0.03, 0.08) : rand(0.12, 0.2))), until: startAt + (a.active[1] / k) + 0.14 };
        } else if (threat) {
          const r = Math.random(), startAt = this.t - o.st;
          let act = 'none';
          if (a.kind === 'kick') act = r < lv.dodge + 0.25 ? 'dodge' : r < lv.dodge + 0.25 + lv.smart * 0.4 ? 'jab' : 'guard';
          else if (r < lv.parry) act = 'parry';
          else if (r < lv.parry + lv.dodge * 0.6) act = 'dodge';
          else if (a === ND.ATK.heavy && Math.random() < lv.smart * 0.6 && dist < 200) act = 'jab';
          else if (r < lv.parry + lv.dodge * 0.6 + lv.guard * 0.8) act = 'guard';
          let at = startAt + lv.react + rand(0, 0.05);
          if (act === 'parry') {
            const ideal = startAt + a.active[0] - rand(0.04, 0.1);
            if (ideal >= at) at = ideal; else act = 'guard';
          }
          this.pending = { act, at, until: startAt + (a.active ? a.active[1] : a.dur) + 0.12 };
        }
      }
      // --- yaklaşan shuriken
      for (const p of ND.game.projs) {
        if (p.owner === me || p.falling || p.stuck || this.seenProj.has(p)) continue;
        const d = (me.x - p.x) * Math.sign(p.vx);
        if (d > 0 && d < 520) {
          this.seenProj.add(p);
          const r = Math.random();
          const eta = d / Math.abs(p.vx);
          if (r < lv.parry * 0.7) this.pending = { act: 'parry', at: this.t + Math.max(lv.react * 0.6, eta - 0.1), until: this.t + eta + 0.1 };
          else if (r < lv.guard) this.pending = { act: 'guard', at: this.t + lv.react * 0.7, until: this.t + eta + 0.15 };
          else if (r < lv.guard + 0.15) this.pending = { act: 'jump', at: this.t + lv.react, until: 0 };
        }
      }

      if (this.pending && this.t >= this.pending.at) {
        const p = this.pending; this.pending = null;
        const free = me.state === 'move' || me.state === 'guard' || me.state === 'block' || me.state === 'land' || me.state === 'parry' || me.state === 'recoil';
        if (free) {
          if ((p.act === 'guard' || p.act === 'parry') && me.state === 'move' && this.catchMove() && o.state === 'atk' && !o.atk.special && Math.random() < lv.smart * 0.3) {
            // draw stance (Akane): back + heavy so the coming blow is caught
            this.setHeld('guard', false); this.dirTap('heavy', -fwd);
          } else if (p.act === 'guard' || p.act === 'parry') { this.setHeld('left', false); this.setHeld('right', false); this.move = 0; this.tap('guard'); this.setHeld('guard', true); this.guardUntil = Math.max(p.until, this.t + 0.12); }
          else if (p.act === 'dodge') { this.moveDir(-fwd); this.tap('dodge'); }
          else if (p.act === 'jab') { this.dirTap(Math.random() < 0.5 ? 'light' : 'kick', 0); }
          else if (p.act === 'jump') { this.tap('up'); }
        }
      }
      if (this.held.guard && this.t > this.guardUntil) this.setHeld('guard', false);

      // --- kombo devamı: string routes (ND.routesFor), launcher → air follow-up, ki cancel
      if (me.state === 'atk' && me.atk.chain && (me.hitDone || me.atk.kind === 'feint') && this.chainDone !== me.keys && me.st >= me.atk.chain[0]) {
        this.chainDone = me.keys;
        this.chainPick(me, o, fwd);
      }
      if (me.state === 'atk' && me.atk.sc && me.hitDone && me.ki >= 100 && this.kcTok !== me.keys && me.mem.landed != null) {
        this.kcTok = me.keys;
        if (Math.random() < lv.kc) this.tap('special');
      }

      // --- ana karar döngüsü
      if (this.t >= this.next && !this.held.guard) {
        this.next = this.t + rand(lv.tick[0], lv.tick[1]);
        this.decide(dist, fwd);
      }
      if (this.move && this.t > this.moveUntil) this.move = 0;
      const canMove = !this.held.guard;
      this.setHeld('right', canMove && this.move > 0);
      this.setHeld('left', canMove && this.move < 0);
    }

    moveDir(d) { this.move = d; this.moveUntil = this.t + 0.3; this.setHeld('right', d > 0); this.setHeld('left', d < 0); }
    // a button pressed with a direction held (d: +1 right / -1 left / 0 neutral): command normals and string routes
    dirTap(btn, d) {
      this.move = d; this.moveUntil = this.t + (d ? 0.14 : 0);
      this.setHeld('right', d > 0); this.setHeld('left', d < 0);
      this.tap(btn);
    }
    catchMove() { const K = ND.KITS && ND.KITS[this.me.ch.id], a = K && ND.ATK[K.bHeavy]; return !!(a && a.catch); }
    // Inside a chain window: pick the next press from the fighter's routes, by level
    chainPick(me, o, fwd) {
      const lv = this.lv, R = ND.routesFor ? ND.routesFor(me, me.atkName) : null, hit = me.mem.landed != null;
      if (!R) {
        if (Math.random() < lv.combo) { const oppGuard = o.state === 'block' || o.state === 'guard'; this.tap(oppGuard && Math.random() < lv.smart ? 'kick' : Math.random() < 0.18 ? 'heavy' : 'light'); }
        return;
      }
      if (R.hit && !hit) return;
      const air = o.state === 'launch' && (o.jug || 0) < ((ND.COMBO && ND.COMBO.jugMax) || 3);
      // launcher landed / already in the air: follow up
      if (me.atkName === 'fHeavy' || me.atkName === 'chase') { if (air && Math.random() < lv.jug) this.dirTap(R.light ? 'light' : 'heavy', 0); return; }
      if (Math.random() >= lv.combo) return;
      const oppGuard = o.state === 'block' || o.state === 'guard', r = Math.random();
      if (R.fHeavy && hit && !oppGuard && r < lv.str * 0.35) return this.dirTap('heavy', fwd); // launcher
      if (R.heavy && r < lv.str) return this.dirTap('heavy', 0); // string ender
      if (R.kick && oppGuard && Math.random() < lv.smart) return this.dirTap('kick', 0);
      if (R.light) return this.dirTap('light', 0);
      if (R.heavy) return this.dirTap('heavy', 0);
    }

    decide(dist, fwd) {
      const me = this.me, o = me.opp, lv = this.lv, r = Math.random();
      const free = me.state === 'move' || me.state === 'land';
      if (!free) return;
      if (o.state === 'down' || o.state === 'getup') { this.go(dist < 200 ? -fwd : 0, 0.3); return; }
      // ki dolu: Gölge Kesiği için uygun an
      const spR = (ND.SPECIALS && ND.SPECIALS[me.ch.id] && ND.SPECIALS[me.ch.id].range) || [90, 520]; // karaktere özel tekniğin menzili
      if (me.ki >= 100 && dist > spR[0] && dist < spR[1]) {
        const opening = o.state === 'stagger' || o.state === 'gbreak' || (o.state === 'atk' && o.atk.kind !== 'throw' && dist > Math.min(260, spR[1] * 0.5));
        if (opening || Math.random() < lv.smart * 0.25) { this.tap('special'); return; }
      }
      // cezalandır
      if ((o.state === 'stagger' || o.state === 'gbreak') && dist < 210) { this.dirTap(o.state === 'gbreak' || r < 0.5 ? 'heavy' : 'light', 0); return; }
      // a long stun that left the opponent in reach (chain pull, headbutt, smoke bomb, pommel): follow up with a fast cut
      if (o.state === 'hurt' && o.dur - o.st > 0.25 && dist < Math.max(170, this.ideal + 20) && r < lv.smart * 0.8) { this.dirTap('light', 0); return; }
      if (o.state === 'launch') { this.go(fwd, 0.2); return; }
      // the opponent's cut bounced off (recoil): its next attack is still locked (ND.ATK_LOCK) — take the turn
      if (o.state === 'recoil' && dist < this.ideal + 50 && r < lv.counter) { this.dirTap(Math.random() < 0.25 ? 'heavy' : 'light', 0); return; }
      // a pressing opponent in reach: guard up before its next swing instead of trading into it
      const heat = this.heat();
      if (heat >= 3 && dist < this.oppReach(o) + 60 && o.state !== 'recoil' && Math.random() < lv.read * Math.min(1, (heat - 2) * 0.5)) {
        this.setHeld('guard', true); this.guardUntil = this.t + rand(0.3, 0.6); return;
      }
      // denge tehlikede → geri çekil
      if (me.posture > 70 && r < lv.smart) { this.go(-fwd, 0.4); if (Math.random() < 0.3) { this.moveDir(-fwd); this.tap('dodge'); } return; }
      // uzak dövüşçü (ch.ai.zoner): mesafeyi koru, ok at; yaklaşana ters takla atışı
      const Z = me.ch.ai, zoner = !!(Z && Z.zoner);
      if (zoner && this.zone(dist, fwd, r)) return;
      // against a ranged fighter: close the gap with forward dodges (arrows fly through the dodge), not a slow walk;
      // a lower-level AI rushes in a little more (it cannot block arrows as well)
      const oZ = o.ch.ai && o.ch.ai.zoner;
      if (oZ && !zoner && dist > 240 && r < 0.55 - lv.smart * 0.2) { this.moveDir(fwd); this.tap('dodge'); return; }
      // (the zoner's throw button is the back-flip shot: it is used from zone() only)
      if (dist > 380) {
        if (me.ammo > 0 && r < 0.22 && !zoner) { this.tap('throw'); return; }
        if (r < 0.1) { this.go(fwd, 0.35); this.tap('up'); return; }
        this.go(fwd, 0.35); return;
      }
      if (dist > this.ideal + 40) {
        if (r < lv.aggr * 0.25 && dist < 300) { this.go(fwd, 0.2); this.tap('light'); return; } // atılarak gir
        if (me.ammo > 0 && r > 0.93 && !zoner) { this.tap('throw'); return; }
        this.go(fwd, rand(0.15, 0.35)); return;
      }
      // yakın mesafe
      if (dist < 70) {
        if (r < 0.45) { this.dirTap('kick', 0); return; }
        if (r < 0.7) { this.moveDir(-fwd); this.tap('dodge'); return; }
      }
      // a draw stance (Akane) is waiting for a blow: wait it out, or throw from range (projectiles are not caught)
      if (o.state === 'atk' && o.atk.catch && o.st < o.atk.catch[1] && Math.random() < lv.smart) {
        if (me.ammo > 0 && dist > 160 && Math.random() < 0.5) this.tap('throw'); else this.go(-fwd, 0.2);
        return;
      }
      if (o.state === 'atk' && o.atk.kind !== 'throw' && o.atk.kind !== 'stance' && Math.random() < lv.guard) {
        this.setHeld('guard', true); this.guardUntil = this.t + rand(0.35, 0.6); return;
      }
      if (r < lv.aggr) {
        const oppGuard = o.state === 'guard' || o.state === 'block';
        const rr = Math.random();
        if (oppGuard && rr < 0.35 + lv.smart * 0.3) this.dirTap('kick', 0);
        // ch.ai.cmd: a style built on command normals (Aoi's wind steps) uses them at every level
        else if (Math.random() < Math.max(lv.cmd, (Z && Z.cmd) || 0)) this.cmdOpener(dist, fwd, oppGuard);
        else if (rr < (lv.heavy ?? 0.2)) this.dirTap('heavy', 0);
        else if (rr < 0.28 && me.ammo > 0 && dist > 200 && !zoner) this.tap('throw');
        else this.dirTap('light', 0);
        return;
      }
      // footsies: ileri-geri adım, bekle, bazen gard
      const rr = Math.random();
      if (rr < 0.35) this.go(-fwd, rand(0.12, 0.3));
      else if (rr < 0.6) this.go(fwd, rand(0.1, 0.2));
      else if (rr < 0.6 + lv.smart * 0.25) { this.setHeld('guard', true); this.guardUntil = this.t + rand(0.3, 0.7); }
      else this.go(0, 0.2);
      this.ideal = this.idealFor();
    }
    // command-normal opener: overhead / sweep / launcher / advancing move, chosen by range and the opponent's guard
    cmdOpener(dist, fwd, oppGuard) {
      const r = Math.random(), catchK = this.catchMove();
      if (oppGuard && r < 0.5) return catchK ? this.dirTap('kick', 0) : this.dirTap('heavy', -fwd); // overhead guard crush
      if (dist < 130 && r < 0.35) return this.dirTap('light', -fwd); // back + light (sweep, pommel, headbutt, feint)
      if (r < 0.65) return this.dirTap('heavy', fwd); // launcher
      if (dist > 150) return this.dirTap('light', fwd); // advancing command
      return this.dirTap('heavy', catchK ? fwd : -fwd);
    }
    // Ranged fighter (ch.ai.zoner, Tsubame): keep the gap, shoot when it can land, escape when rushed. Returns true
    // when it acted. Arrows share one quiver (ammo): the heavy shot (held = charged) and the back-flip shot (throw).
    zone(dist, fwd, r) {
      const me = this.me, o = me.opp, lv = this.lv;
      const room = ND.ARENA + me.x * fwd; // space behind me, up to the wall
      const cornered = room < 170;
      // an opponent who is swinging, recovering or landing cannot guard the arrow in time
      const open = o.state === 'atk' || o.state === 'recoil' || o.state === 'land' || o.state === 'hurt' || o.state === 'getup' || o.state === 'air' || o.state === 'dodge';
      const guarding = o.state === 'guard' || o.state === 'block' || o.state === 'parry';
      // a lower-level archer reads the fight worse: shoots less often, backs off less surely
      const k = Math.pow(lv.smart, 2.5);
      if (dist < 170) {
        if (cornered) {
          // pinned to the wall: slip past with a forward dodge (a dodge passes through), else fight with the tantō
          if (r < 0.2 + lv.smart * 0.3) { this.moveDir(fwd); this.tap('dodge'); return true; }
          return false;
        }
        if (me.ammo > 0 && r < 0.3 + lv.smart * 0.3) { this.tap('throw'); return true; } // back-flip shot
        if (r < 0.4 + 0.3 * lv.smart) { this.moveDir(-fwd); this.tap('dodge'); return true; }
        return false; // tantō
      }
      if (me.ammo > 0 && dist > 190) {
        const p = (guarding ? 0.2 : open ? 0.55 + 0.35 * lv.smart : 0.55) * k;
        if (r < p) {
          // far and unhurried: a charged shot; an opponent coming in or left open: a quick one
          const charge = dist > 400 && !open && Math.random() < 0.35 + 0.4 * lv.smart;
          this.dirTap('heavy', 0); this.held.heavy = true;
          this.holdT = this.t + (charge ? rand(0.45, 0.8) : rand(0.02, 0.1));
          return true;
        }
      }
      if (!cornered && dist < this.ideal - 60 && r < 0.5 + 0.3 * lv.smart) { this.go(-fwd, rand(0.2, 0.4)); return true; }
      if (!me.ammo && dist > 200 && dist < 420 && r < 0.5) { this.go(-fwd, rand(0.15, 0.3)); return true; } // wait for the quiver
      return false;
    }
    // opponent's recent attack starts (time, logical move): pressure (heat) and repetition (rep) for lv.read
    note(name) {
      const H = this.hist || (this.hist = []);
      H.push({ t: this.t, n: name });
      while (H.length > 10 || (H.length && H[0].t < this.t - 4)) H.shift();
    }
    heat() { const H = this.hist; let n = 0; if (H) for (const h of H) if (h.t > this.t - 3) n++; return n; }
    // chance to read the attack just noted: grows with how often this move was repeated and how hard the player presses
    readP() {
      const H = this.hist, lv = this.lv;
      if (!H || H.length < 2 || !lv.read) return 0;
      const last = H[H.length - 1].n;
      let rep = 0;
      for (const h of H) if (h.n === last && h.t > this.t - 2.5) rep++;
      return lv.read * Math.min(1, (rep - 1) * 0.35 + Math.max(0, this.heat() - 2) * 0.15);
    }
    oppReach(o) { return 150 + Math.max(0, o.ch.blade + (o.ch.handle || 0) - 60) * 0.9; }
    idealFor() { const Z = this.me.ch.ai; return Z && Z.ideal ? rand(-25, 25) + Z.ideal : rand(-18, 18) + 88 + this.me.ch.blade * 0.72; }
    go(d, dur) { this.move = d; this.moveUntil = this.t + dur; }
  }
  ND.AI = AI;
})(window.ND);
