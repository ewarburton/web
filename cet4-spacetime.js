/*
 * CET(4) spacetime diagram, self-contained, with a playhead transport.
 *
 * The simulation mirrors the viewer exactly -- blank tape, both agents in state
 * A, heads at cells 0 and 2, agent 1 writes first when the heads share a cell,
 * collision checked after both moves -- and `check_spacetime.js` compares the
 * two step for step. Drawing follows the viewer's look too: tape cells as grey
 * columns, head trails green/red by direction, a ring on the collision cell.
 *
 *   var view = CET4_SPACETIME.create(canvas, { onChange: fn });
 *   view.load("agent1|agent2", 2000);   // simulate and park the playhead at the end
 *   view.setTime(500); view.step(1); view.reset(); view.toEnd();
 *   view.play(); view.pause(); view.toggle(); view.fit();
 *
 * `onChange` receives { time, total, halted, haltStep, haltPos, error, steps, playing }
 * whenever the playhead, the run or the view changes.
 *
 *   CET4_SPACETIME.simulate(text, opts)   no drawing, for tests
 */
(function () {
  'use strict';

  var CW = 480, CH = 512;
  var MAX_STEPS = 200000;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function stateName(i) { return String.fromCharCode(65 + i); }

  /* ---- parsing: same grammar as the viewer's parseCET ---- */
  function parse(text) {
    var t = String(text == null ? '' : text).trim().replace(/\s+/g, '');
    if (!t) throw new Error('Empty machine string.');
    var parts = t.split('|');
    if (parts.length !== 2) throw new Error('CET format is machine1|machine2 (exactly two agents).');
    var agents = parts.map(function (part, ai) {
      if (!part) throw new Error('Agent ' + (ai + 1) + ' is empty.');
      return part.split('_').filter(function (r) { return r.length; }).map(function (row) {
        if (row.length % 3 !== 0) {
          throw new Error('Agent ' + (ai + 1) + ': row "' + row + '" is not a whole number of transitions.');
        }
        var ents = [];
        for (var i = 0; i < row.length; i += 3) {
          var e = row.slice(i, i + 3);
          if (e === '---') { ents.push(null); continue; }
          var m = /^([0-9])([LR])([A-Z])$/.exec(e);
          if (!m) throw new Error('Agent ' + (ai + 1) + ': bad transition "' + e + '".');
          ents.push({ w: +m[1], d: m[2] === 'L' ? -1 : 1, s: m[3].charCodeAt(0) - 65, raw: e });
        }
        return ents;
      });
    });

    var n = agents[0].length;
    if (!n) throw new Error('Agent 1 has no states.');
    if (agents[1].length !== n) {
      throw new Error('Both agents need the same number of states (' + n + ' vs ' + agents[1].length + ').');
    }
    var k = agents[0][0].length;
    if (k < 2) throw new Error('A machine needs at least 2 symbols per row.');
    agents.forEach(function (ag, ai) {
      ag.forEach(function (row, si) {
        if (row.length !== k) {
          throw new Error('Agent ' + (ai + 1) + ' state ' + stateName(si) + ' has ' + row.length +
            ' symbols, expected ' + k + '.');
        }
        row.forEach(function (e) {
          if (!e) return;
          if (e.w >= k) throw new Error('Write symbol ' + e.w + ' does not exist (' + k + ' symbols).');
          if (e.s >= n) throw new Error('Next state ' + stateName(e.s) + ' does not exist (' + n + ' states).');
        });
      });
    });

    function str() {
      return agents.map(function (ag) {
        return ag.map(function (row) {
          return row.map(function (e) { return e ? e.raw : '---'; }).join('');
        }).join('_');
      }).join('|');
    }
    return { agents: agents, n: n, k: k, str: str() };
  }

  /* ---- tape: flat array with a Map spill for the rare far-away cell ---- */
  function Tape(limit) {
    var size = Math.min(1 << 24, Math.max(4096, limit * 2 + 4096));
    this.size = size;
    this.off = size >> 1;
    this.a = new Uint8Array(size);
    this.spill = null;
  }
  Tape.prototype.get = function (p) {
    var i = p + this.off;
    if (i >= 0 && i < this.size) return this.a[i];
    return this.spill ? (this.spill.get(p) || 0) : 0;
  };
  Tape.prototype.set = function (p, v) {
    var i = p + this.off;
    if (i >= 0 && i < this.size) { this.a[i] = v; return; }
    if (!this.spill) this.spill = new Map();
    if (v) this.spill.set(p, v); else this.spill.delete(p);
  };

  /* ---- simulation ---- */
  function simulate(m, P) {
    P = P || {};
    var n = m.n, k = m.k;
    var tbl = m.agents.map(function (ag) {
      var w = new Uint8Array(n * k), d = new Int8Array(n * k);
      var s = new Int8Array(n * k), bad = new Uint8Array(n * k);
      for (var st = 0; st < n; st++) {
        for (var sym = 0; sym < k; sym++) {
          var idx = st * k + sym, e = ag[st][sym];
          if (!e) { bad[idx] = 1; continue; }
          w[idx] = e.w; d[idx] = e.d; s[idx] = e.s;
        }
      }
      return { w: w, d: d, s: s, bad: bad };
    });

    var limit = clamp(P.steps | 0 || 2000, 1, MAX_STEPS);
    var tape = new Tape(limit);
    var init = String(P.initTape == null ? '0' : P.initTape).replace(/[^0-9]/g, '');
    var initX = P.initX | 0;
    for (var i = 0; i < init.length; i++) {
      var v = init.charCodeAt(i) - 48;
      if (v >= k) return { error: 'Initial tape symbol ' + v + ' is invalid for ' + k + ' symbols.' };
      if (v) tape.set(initX + i, v);
    }

    var p1 = (P.x1 == null ? 0 : P.x1 | 0), p2 = (P.x2 == null ? 2 : P.x2 | 0);
    var startX1 = p1, startX2 = p2;
    var st1 = 0, st2 = 0;
    var cells = new Map();          /* cell -> [t0, t1, val, ...] runs of one value */
    var open = new Map();           /* cell -> { t0, val } the run still in progress */

    /* one entry per step, plus step 0: where each head was and which way it went */
    var hp1 = new Int32Array(limit + 1), hp2 = new Int32Array(limit + 1);
    var hd1 = new Int8Array(limit + 1), hd2 = new Int8Array(limit + 1);
    hp1[0] = p1; hp2[0] = p2;

    var t = 0, halted = false, haltStep = 0, haltPos = 0, error = null;

    function writeCell(c, val, now) {
      if (tape.get(c) === val) return;
      var op = open.get(c);
      if (op) {
        var arr = cells.get(c);
        if (!arr) { arr = []; cells.set(c, arr); }
        arr.push(op.t0, now, op.val);
      }
      tape.set(c, val);
      open.set(c, { t0: now, val: val });
    }

    for (var step = 0; step < limit; step++) {
      var s1 = tape.get(p1), s2 = tape.get(p2);
      var i1 = st1 * k + s1, i2 = st2 * k + s2;
      if (tbl[0].bad[i1]) {
        error = 'Agent 1 has no transition in state ' + stateName(st1) + ' on symbol ' + s1 +
          ' (step ' + (step + 1) + ').';
        break;
      }
      if (tbl[1].bad[i2]) {
        error = 'Agent 2 has no transition in state ' + stateName(st2) + ' on symbol ' + s2 +
          ' (step ' + (step + 1) + ').';
        break;
      }

      var w1 = tbl[0].w[i1], w2 = tbl[1].w[i2];
      var now = step + 1;
      if (p1 === p2) writeCell(p1, w1, now);   /* agent 1 has priority on a shared cell */
      else { writeCell(p1, w1, now); writeCell(p2, w2, now); }
      p1 += tbl[0].d[i1];
      p2 += tbl[1].d[i2];
      st1 = tbl[0].s[i1];
      st2 = tbl[1].s[i2];
      hp1[now] = p1; hp2[now] = p2;
      hd1[now] = tbl[0].d[i1]; hd2[now] = tbl[1].d[i2];
      t = now;
      if (p1 === p2) { halted = true; haltStep = now; haltPos = p1; break; }
    }

    open.forEach(function (op, c) {
      var arr = cells.get(c);
      if (!arr) { arr = []; cells.set(c, arr); }
      arr.push(op.t0, t, op.val);
    });

    return {
      total: t, halted: halted, haltStep: haltStep, haltPos: haltPos, error: error,
      cells: cells, hp1: hp1, hp2: hp2, hd1: hd1, hd2: hd2, k: k,
      steps: limit, x1: startX1, x2: startX2
    };
  }

  /* ---- controller ---- */
  function create(canvas, opts) {
    opts = opts || {};
    var ctx = (canvas && canvas.getContext) ? canvas.getContext('2d') : null;
    var dpr = Math.min(2, Math.max(1, (typeof window !== 'undefined' && window.devicePixelRatio) || 1));
    if (canvas && ctx) { canvas.width = CW * dpr; canvas.height = CH * dpr; }

    var st = {
      m: null, sim: null, off: null, raster: null, tapeWidth: 400, xTrans: 0.5,
      steps: 2000, time: 0, playing: false, raf: 0, error: null
    };

    function notify() {
      if (!opts.onChange) return;
      opts.onChange({
        time: st.time,
        total: st.sim ? st.sim.total : 0,
        halted: !!(st.sim && st.sim.halted),
        haltStep: st.sim ? st.sim.haltStep : 0,
        haltPos: st.sim ? st.sim.haltPos : 0,
        error: st.error,
        steps: st.steps,
        playing: st.playing
      });
    }

    function cellToX(cell) {
      var span = clamp(Math.round(st.tapeWidth), 1, 20000);
      var x0 = -span * st.xTrans;
      return (cell - x0) * CW / span;
    }

    /* tape layer: one vertical run per cell / symbol, drawn once per run */
    function buildRaster() {
      var m = st.m, sim = st.sim;
      if (!m || !sim || !ctx) { st.raster = null; return; }
      if (typeof document === 'undefined') { st.raster = null; return; }
      if (!st.off) {
        st.off = document.createElement('canvas');
        st.off.width = CW; st.off.height = CH;
      }
      var octx = st.off.getContext('2d');
      if (!octx) { st.raster = null; return; }

      var T = Math.max(1, sim.total);
      var span = clamp(Math.round(st.tapeWidth), 1, 20000);
      var x0 = -span * st.xTrans;
      var k = m.k;

      var grey = new Uint8Array(k);
      for (var v = 0; v < k; v++) grey[v] = Math.round(255 * v / Math.max(1, k - 1));

      var img = octx.createImageData(CW, CH);
      var d = img.data;
      for (var i = 3; i < d.length; i += 4) d[i] = 255;   /* opaque black */

      sim.cells.forEach(function (arr, cell) {
        var c = Math.floor((cell - x0) * CW / span);
        if (c < 0 || c >= CW) return;
        for (var j = 0; j < arr.length; j += 3) {
          var t0 = arr[j], t1 = arr[j + 1], val = arr[j + 2];
          if (!val || t1 <= t0) continue;
          var y0 = Math.floor(t0 * CH / T), y1 = Math.floor(t1 * CH / T);
          if (y1 <= y0) y1 = y0 + 1;
          if (y0 < 0) y0 = 0;
          if (y1 > CH) y1 = CH;
          var col = grey[val];
          for (var y = y0; y < y1; y++) {
            var p = (y * CW + c) * 4;
            d[p] = col; d[p + 1] = col; d[p + 2] = col;
          }
        }
      });

      octx.putImageData(img, 0, 0);
      st.raster = st.off;
    }

    function draw() {
      if (!ctx) return;
      var sim = st.sim;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, CW, CH);
      ctx.imageSmoothingEnabled = false;
      if (st.raster) ctx.drawImage(st.raster, 0, 0, CW, CH);
      if (!sim) return;

      var T = Math.max(1, sim.total);
      var time = clamp(st.time | 0, 0, sim.total);
      var yTime = Math.min(CH, Math.floor(time * CH / T));

      /* dim the not-yet-reached future */
      if (yTime < CH) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, yTime, CW, CH - yTime);
        ctx.fillStyle = 'rgba(66,140,200,.55)';
        ctx.fillRect(0, yTime, CW, 1);
      }

      /* head trajectories, coloured by move direction */
      var Path2DRef = (typeof Path2D !== 'undefined') ? Path2D : null;
      for (var a = 0; a < 2; a++) {
        var hp = a === 0 ? sim.hp1 : sim.hp2;
        var hd = a === 0 ? sim.hd1 : sim.hd2;
        var green = Path2DRef ? new Path2DRef() : [], red = Path2DRef ? new Path2DRef() : [];
        var prevX = null, prevY = 0, any = false;
        for (var yy = 0; yy <= yTime; yy++) {
          var tt = Math.min(sim.total, Math.round(yy * T / CH));
          var x = cellToX(hp[tt]) + 0.5;
          if (prevX !== null && yy > prevY) {
            var dir = hd[tt];
            var path = dir < 0 ? green : (dir > 0 ? red : null);
            if (path) {
              if (Path2DRef) { path.moveTo(prevX, prevY); path.lineTo(x, yy); }
              else path.push([prevX, prevY, x, yy]);
              any = true;
            }
          }
          prevX = x; prevY = yy;
        }
        ctx.globalAlpha = a === 0 ? 0.95 : 0.6;
        ctx.lineWidth = 1;
        if (any) {
          if (Path2DRef) {
            ctx.strokeStyle = '#39d353'; ctx.stroke(green);
            ctx.strokeStyle = '#ff5a5a'; ctx.stroke(red);
          } else {
            [['#39d353', green], ['#ff5a5a', red]].forEach(function (pair) {
              ctx.strokeStyle = pair[0];
              ctx.beginPath();
              for (var q = 0; q < pair[1].length; q++) {
                var s = pair[1][q];
                ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]);
              }
              ctx.stroke();
            });
          }
        }
        ctx.globalAlpha = 1;
      }

      /* the two heads at the playhead */
      var hy = Math.max(0, yTime - 1);
      ctx.fillStyle = '#e9fff1';
      ctx.fillRect(Math.round(cellToX(sim.hp1[time]) + 0.5), hy, 2, 2);
      ctx.fillStyle = '#ffe3ef';
      ctx.fillRect(Math.round(cellToX(sim.hp2[time]) + 0.5), hy, 2, 2);

      /* collision marker */
      if (sim.halted && time >= sim.haltStep) {
        var mx = cellToX(sim.haltPos) + 0.5;
        var my = Math.floor(sim.haltStep * CH / T);
        ctx.strokeStyle = '#ffd54a';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(mx, my, 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function setTime(t) {
      if (!st.sim) return;
      st.time = clamp(t | 0, 0, st.sim.total);
      draw();
      notify();
    }

    function pause() {
      st.playing = false;
      if (st.raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(st.raf);
      st.raf = 0;
    }

    function play() {
      if (!st.sim || !st.sim.total || st.playing) return;
      if (typeof requestAnimationFrame !== 'function') return;
      if (st.time >= st.sim.total) setTime(0);
      st.playing = true;
      notify();
      var last = 0, total = st.sim.total, perMs = total / 2800;
      function frame(ts) {
        if (!st.playing) return;
        if (!last) last = ts;
        var dt = Math.min(120, ts - last);
        last = ts;
        var next = st.time + Math.max(1, Math.round(dt * perMs));
        if (next >= total) { setTime(total); pause(); notify(); return; }
        st.time = next;
        draw();
        notify();
        st.raf = requestAnimationFrame(frame);
      }
      st.raf = requestAnimationFrame(frame);
    }

    function toggle() { if (st.playing) { pause(); notify(); } else play(); }

    function load(text, steps) {
      pause();
      st.steps = clamp((steps | 0) || 2000, 1, MAX_STEPS);
      st.error = null;
      try {
        st.m = parse(text);
      } catch (e) {
        st.m = null; st.sim = null; st.raster = null; st.time = 0;
        st.error = e.message;
        if (ctx) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, CW, CH); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CW, CH); }
        notify();
        return;
      }
      st.sim = simulate(st.m, { steps: st.steps });
      st.error = st.sim.error || null;
      st.tapeWidth = 400;
      st.xTrans = 0.5;
      buildRaster();
      st.time = st.sim.error ? 0 : st.sim.total;
      draw();
      notify();
    }

    /* frame the whole tape the run touched, with a small margin */
    function fit() {
      if (!st.sim) return;
      var lo = 0, hi = 0, any = false;
      st.sim.cells.forEach(function (arr, cell) {
        if (!any) { lo = hi = cell; any = true; }
        if (cell < lo) lo = cell;
        if (cell > hi) hi = cell;
      });
      if (!any) return;
      var pad = Math.max(8, Math.round((hi - lo) * 0.04));
      st.tapeWidth = clamp(Math.max(16, hi - lo + 1 + 2 * pad), 8, 20000);
      st.xTrans = clamp((0 - (lo - pad)) / st.tapeWidth, 0, 1);
      buildRaster();
      draw();
      notify();
    }

    return {
      load: load,
      setTime: setTime,
      step: function (d) { pause(); setTime(st.time + d); },
      reset: function () { pause(); setTime(0); },
      toEnd: function () { pause(); if (st.sim) setTime(st.sim.total); },
      play: play, pause: function () { pause(); notify(); }, toggle: toggle,
      fit: fit,
      redraw: draw,
      time: function () { return st.time; },
      total: function () { return st.sim ? st.sim.total : 0; },
      playing: function () { return st.playing; },
      error: function () { return st.error; },
      machine: function () { return st.m; },
      sim: function () { return st.sim; }
    };
  }

  var api = { parse: parse, simulate: simulate, create: create, CW: CW, CH: CH, MAX_STEPS: MAX_STEPS };
  if (typeof window !== 'undefined') window.CET4_SPACETIME = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
