// Aerios Platform Visual — orbital diagram in the home hero
(function() {
  const canvas = document.getElementById('platformCanvas');
  if (!canvas) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const SIZE = 580;
  canvas.width  = SIZE * dpr;
  canvas.height = SIZE * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const center = { x: 290, y: 290, r: 80 };
  const ringRadius = 200;
  const angles = [-90, -30, 30, 90, 150, 210];

  const MODULES = [
    { id:'flight',     short:'FLIGHT',     foundation:true,  icon:'flight',
      telemetry:['AI 2812 · landed','6E 743 · boarding','UK 837 · off-blocks','SG 142 · pushback','AI 559 · final'] },
    { id:'view',       short:'VIEW',       foundation:false, icon:'view',
      telemetry:['T2 · 14 boards · live','Gate 7 · updated','CIDS · 32 active','Counter 14 · open','Boards · synced'] },
    { id:'pax',        short:'PAX',        foundation:false, icon:'pax',
      telemetry:['Counter 32 · 124/hr','Bag drop · 87/hr','Boarding · 6E 743','CUTE · 18 active','Self-check · 42/hr'] },
    { id:'commercial', short:'COMMERCIAL', foundation:false, icon:'commercial',
      telemetry:['Bay 12 · billed','Lease #88 · active','Hangar 3 · allocated','Invoice #221 · sent','Concession · paid'] },
    { id:'ops',        short:'OPS',        foundation:false, icon:'ops',
      telemetry:['NOTAM A0231 · active','L&F #4421 · matched','Wildlife · clear','Permit #29 · approved','FOD · clear'] },
    { id:'works',      short:'WORKS',      foundation:false, icon:'works',
      telemetry:['RWY 07R · inspected','WO #883 · resolved','Asset #441 · checked','PAVA test · pass','Belt #4 · serviced'] },
  ];

  const cardW_normal = 152, cardH_normal = 58;
  const cardW_flight = 164, cardH_flight = 62;

  const nodes = MODULES.map((def, i) => {
    const rad = angles[i] * Math.PI / 180;
    return {
      ...def,
      x: center.x + ringRadius * Math.cos(rad),
      y: center.y + ringRadius * Math.sin(rad),
      activeT: 0,
      activationAt: 0,
      contentRotated: true,
      telIdx: Math.floor(Math.random() * def.telemetry.length),
    };
  });

  const pulses = [];
  let lastPulseAt = 0;
  let lastActiveAt = 0;
  let nextActiveInterval = 500;
  let aodbPulse = 0;
  let opsCounter = 197;
  let bootstrapPending = true;
  let lastOpsTickAt = 0;

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function getCardDims(node) {
    return node.foundation
      ? { w: cardW_flight, h: cardH_flight }
      : { w: cardW_normal, h: cardH_normal };
  }

  function getCardEdge(node) {
    const dims = getCardDims(node);
    const dx = center.x - node.x;
    const dy = center.y - node.y;
    const absX = Math.abs(dx) || 0.001;
    const absY = Math.abs(dy) || 0.001;
    const halfW = dims.w / 2, halfH = dims.h / 2;
    if (absY * halfW > absX * halfH) {
      return {
        x: node.x + dx * halfH / absY,
        y: node.y + (dy > 0 ? halfH : -halfH),
      };
    }
    return {
      x: node.x + (dx > 0 ? halfW : -halfW),
      y: node.y + dy * halfW / absX,
    };
  }

  function getCenterEdge(node) {
    const dx = node.x - center.x;
    const dy = node.y - center.y;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    return {
      x: center.x + (dx / len) * center.r,
      y: center.y + (dy / len) * center.r,
    };
  }

  function getPath(node) {
    const from = getCardEdge(node);
    const to = getCenterEdge(node);
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    return {
      from, to,
      ctrl: { x: mx, y: my },
    };
  }

  function bezier(p, t) {
    const u = 1 - t;
    return {
      x: u*u*p.from.x + 2*u*t*p.ctrl.x + t*t*p.to.x,
      y: u*u*p.from.y + 2*u*t*p.ctrl.y + t*t*p.to.y,
    };
  }

  function drawIcon(name, cx, cy, size, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const s = size;

    if (name === 'flight') {
      ctx.beginPath();
      ctx.ellipse(cx, cy - s*0.32, s*0.42, s*0.13, 0, 0, Math.PI*2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - s*0.42, cy - s*0.32);
      ctx.lineTo(cx - s*0.42, cy + s*0.30);
      ctx.bezierCurveTo(cx - s*0.42, cy + s*0.45, cx + s*0.42, cy + s*0.45, cx + s*0.42, cy + s*0.30);
      ctx.lineTo(cx + s*0.42, cy - s*0.32);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - s*0.42, cy);
      ctx.bezierCurveTo(cx - s*0.42, cy + s*0.13, cx + s*0.42, cy + s*0.13, cx + s*0.42, cy);
      ctx.stroke();
    } else if (name === 'view') {
      const top = cy - s*0.45;
      const screenH = s*0.65;
      ctx.beginPath();
      ctx.rect(cx - s*0.45, top, s*0.9, screenH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 1.5, top + screenH);
      ctx.lineTo(cx - 2, cy + s*0.42);
      ctx.lineTo(cx + 2, cy + s*0.42);
      ctx.lineTo(cx + 1.5, top + screenH);
      ctx.stroke();
    } else if (name === 'works') {
      ctx.beginPath();
      ctx.arc(cx, cy, s*0.20, 0, Math.PI*2);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI / 3);
        const x1 = cx + Math.cos(a) * s*0.28;
        const y1 = cy + Math.sin(a) * s*0.28;
        const x2 = cx + Math.cos(a) * s*0.45;
        const y2 = cy + Math.sin(a) * s*0.45;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    } else if (name === 'ops') {
      ctx.beginPath();
      ctx.moveTo(cx, cy - s*0.45);
      ctx.lineTo(cx + s*0.40, cy - s*0.30);
      ctx.lineTo(cx + s*0.40, cy + s*0.05);
      ctx.bezierCurveTo(cx + s*0.40, cy + s*0.30, cx, cy + s*0.45, cx, cy + s*0.45);
      ctx.bezierCurveTo(cx, cy + s*0.45, cx - s*0.40, cy + s*0.30, cx - s*0.40, cy + s*0.05);
      ctx.lineTo(cx - s*0.40, cy - s*0.30);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - s*0.18, cy);
      ctx.lineTo(cx - s*0.05, cy + s*0.15);
      ctx.lineTo(cx + s*0.20, cy - s*0.12);
      ctx.stroke();
    } else if (name === 'commercial') {
      ctx.beginPath();
      ctx.moveTo(cx, cy - s*0.45);
      ctx.lineTo(cx, cy + s*0.45);
      ctx.stroke();
      const w = s*0.28;
      ctx.beginPath();
      ctx.moveTo(cx + w, cy - s*0.28);
      ctx.bezierCurveTo(cx + w, cy - s*0.40, cx - w, cy - s*0.40, cx - w, cy - s*0.14);
      ctx.bezierCurveTo(cx - w, cy + s*0.04, cx + w, cy + s*0.04, cx + w, cy + s*0.22);
      ctx.bezierCurveTo(cx + w, cy + s*0.40, cx - w, cy + s*0.40, cx - w, cy + s*0.28);
      ctx.stroke();
    } else if (name === 'pax') {
      ctx.beginPath();
      ctx.rect(cx - s*0.45, cy - s*0.30, s*0.9, s*0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - s*0.10, cy - s*0.30);
      ctx.lineTo(cx - s*0.10, cy + s*0.30);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - s*0.27, cy - s*0.05, s*0.06, 0, Math.PI*2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - s*0.36, cy + s*0.12);
      ctx.lineTo(cx - s*0.18, cy + s*0.12);
      ctx.stroke();
    }
  }

  function drawConnections() {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const isActive = n.activeT > 0.5;
      const p = getPath(n);

      ctx.beginPath();
      ctx.moveTo(p.from.x, p.from.y);
      ctx.lineTo(p.to.x, p.to.y);
      ctx.strokeStyle = isActive
        ? `rgba(239,72,71,${0.3 + n.activeT * 0.5})`
        : `rgba(91,141,239,${0.18 + n.activeT * 0.35})`;
      ctx.lineWidth = isActive ? 1.3 : 1;
      ctx.stroke();

      ctx.save();
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(p.from.x, p.from.y);
      ctx.lineTo(p.to.x, p.to.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPulses() {
    for (const ps of pulses) {
      const path = getPath(ps.node);
      const t = ps.progress;
      const head = bezier(path, t);
      const tailT = Math.max(0, t - 0.22);
      const STEPS = 10;
      let prev = bezier(path, tailT);
      for (let s = 1; s <= STEPS; s++) {
        const tt = tailT + (t - tailT) * (s / STEPS);
        const cur = bezier(path, tt);
        const a = (s / STEPS) * 0.85;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(cur.x, cur.y);
        ctx.strokeStyle = `rgba(91,141,239,${a})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        prev = cur;
      }
      const hg = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 9);
      hg.addColorStop(0, 'rgba(91,141,239,0.7)');
      hg.addColorStop(1, 'rgba(91,141,239,0)');
      ctx.beginPath(); ctx.arc(head.x, head.y, 9, 0, Math.PI*2);
      ctx.fillStyle = hg; ctx.fill();
      ctx.beginPath(); ctx.arc(head.x, head.y, 1.9, 0, Math.PI*2);
      ctx.fillStyle = '#bfd3f8'; ctx.fill();
    }
  }

  function drawCenter(ts) {
    const x = center.x, y = center.y, r = center.r;

    const og = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
    og.addColorStop(0, 'rgba(59,111,212,0.22)');
    og.addColorStop(1, 'rgba(59,111,212,0)');
    ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, Math.PI*2);
    ctx.fillStyle = og; ctx.fill();

    if (aodbPulse > 0.05) {
      ctx.beginPath();
      ctx.arc(x, y, r + 5 + aodbPulse * 14, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(91,141,239,${aodbPulse * 0.4})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const ringR = r + 14;
    const dotCount = 64;
    const rotation = ts * 0.0002;
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2 + rotation;
      const dx = x + Math.cos(angle) * ringR;
      const dy = y + Math.sin(angle) * ringR;
      const wave = 0.5 + 0.5 * Math.sin(angle * 2 + ts * 0.0008);
      const a = 0.10 + 0.18 * wave;
      ctx.beginPath();
      ctx.arc(dx, dy, 0.9, 0, Math.PI*2);
      ctx.fillStyle = `rgba(91,141,239,${a})`;
      ctx.fill();
    }

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 12;
    const grad = ctx.createLinearGradient(x, y - r, x, y + r);
    grad.addColorStop(0, '#1e4882');
    grad.addColorStop(1, '#091428');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(91,141,239,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath(); ctx.arc(x, y, r - 5, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.font = '700 20px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('aerios', x, y - 16);

    ctx.beginPath();
    ctx.moveTo(x - 32, y - 1);
    ctx.lineTo(x + 32, y - 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const livePulse = 0.5 + 0.5 * Math.sin(ts * 0.004);
    const liveDotX = x - 30;
    const liveDotY = y + 10;
    const lg = ctx.createRadialGradient(liveDotX, liveDotY, 0, liveDotX, liveDotY, 7);
    lg.addColorStop(0, `rgba(34,197,94,${0.5 * livePulse})`);
    lg.addColorStop(1, 'rgba(34,197,94,0)');
    ctx.beginPath(); ctx.arc(liveDotX, liveDotY, 7, 0, Math.PI*2);
    ctx.fillStyle = lg; ctx.fill();
    ctx.beginPath(); ctx.arc(liveDotX, liveDotY, 2.2, 0, Math.PI*2);
    ctx.fillStyle = '#22c55e'; ctx.fill();

    ctx.font = '700 8.5px "DM Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'left';
    ctx.fillText('AODB · LIVE', liveDotX + 6, liveDotY + 0.5);

    ctx.font = '500 10px "DM Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'center';
    ctx.fillText(`${opsCounter} ops/hr · 6 sites`, x, y + 30);
  }

  function drawNodes() {
    ctx.textBaseline = 'middle';

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const isActive = n.activeT > 0.5;
      const isFlight = n.foundation;
      const baseDims = getCardDims(n);
      const sf = 1 + n.activeT * 0.10;
      const w = baseDims.w * sf;
      const h = baseDims.h * sf;
      const x = n.x - w / 2;
      const y = n.y - h / 2;

      if (n.activeT > 0.05) {
        const haloR = Math.max(w, h) * 0.75;
        const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, haloR);
        halo.addColorStop(0, `rgba(239,72,71,${0.22 * n.activeT})`);
        halo.addColorStop(1, 'rgba(239,72,71,0)');
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(n.x, n.y, haloR, 0, Math.PI*2);
        ctx.fill();
      }

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 12 + n.activeT * 16;
      ctx.shadowOffsetY = 4;
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, isActive
        ? 'rgba(255,255,255,0.13)'
        : 'rgba(255,255,255,0.08)');
      grad.addColorStop(1, 'rgba(255,255,255,0.025)');
      ctx.fillStyle = grad;
      roundRect(x, y, w, h, 7);
      ctx.fill();
      ctx.restore();

      let borderColor, borderWidth;
      if (isActive) {
        borderColor = `rgba(239,72,71,${0.7 + n.activeT * 0.25})`;
        borderWidth = 1.4;
      } else if (isFlight) {
        borderColor = 'rgba(239,72,71,0.32)';
        borderWidth = 1.2;
      } else {
        borderColor = 'rgba(255,255,255,0.13)';
        borderWidth = 1;
      }
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      roundRect(x, y, w, h, 7);
      ctx.stroke();

      const iconBoxX = x + 8;
      const iconBoxY = y + 8;
      const iconBoxSize = 18;
      const iconBg = isActive ? 'rgba(239,72,71,0.18)' : 'rgba(91,141,239,0.18)';
      const iconBorder = isActive ? 'rgba(239,72,71,0.40)' : 'rgba(91,141,239,0.30)';
      roundRect(iconBoxX, iconBoxY, iconBoxSize, iconBoxSize, 4);
      ctx.fillStyle = iconBg;
      ctx.fill();
      ctx.strokeStyle = iconBorder;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      const iconColor = isActive ? '#ff8a89' : '#7ea5e8';
      drawIcon(n.icon, iconBoxX + iconBoxSize/2, iconBoxY + iconBoxSize/2, 13, iconColor);

      ctx.font = '700 9px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.62)';
      ctx.textAlign = 'left';
      const labelX = iconBoxX + iconBoxSize + 7;
      const labelY = iconBoxY + iconBoxSize/2;
      ctx.fillText(n.short, labelX, labelY);

      if (isFlight) {
        const lblW = ctx.measureText(n.short).width;
        const badgeX = labelX + lblW + 7;
        const badgeY = iconBoxY + 2;
        ctx.font = '700 7px "DM Sans", system-ui, sans-serif';
        const txt = 'FOUNDATION';
        const bw = ctx.measureText(txt).width;
        roundRect(badgeX, badgeY, bw + 8, 12, 2);
        ctx.fillStyle = 'rgba(239,72,71,0.18)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(239,72,71,0.30)';
        ctx.lineWidth = 0.7;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,170,168,1)';
        ctx.fillText(txt, badgeX + 4, badgeY + 6.5);
      }

      ctx.font = '500 10.5px "DM Mono", monospace';
      ctx.fillStyle = isActive ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.78)';
      ctx.textAlign = 'left';
      ctx.fillText(n.telemetry[n.telIdx], x + 10, y + h - 14);
    }
  }

  function frame(ts) {
    ctx.clearRect(0, 0, SIZE, SIZE);

    if (bootstrapPending) {
      const idx = Math.floor(Math.random() * nodes.length);
      nodes[idx].activationAt = ts;
      nodes[idx].contentRotated = false;
      lastActiveAt = ts;
      bootstrapPending = false;
    }

    if (ts - lastActiveAt > nextActiveInterval) {
      const inactivePool = nodes.filter(n => n.activationAt === 0);
      if (inactivePool.length > 0) {
        const pick = inactivePool[Math.floor(Math.random() * inactivePool.length)];
        pick.activationAt = ts;
        pick.contentRotated = false;
      }
      lastActiveAt = ts;
      nextActiveInterval = 800 + Math.random() * 600;
    }

    // Phase-based per-node animation:
    //   0–500ms  → ramp up (easeOutQuad)
    //   500ms    → swap telemetry (the event)
    //   500–800ms → fade out (linear)
    for (const n of nodes) {
      if (n.activationAt > 0) {
        const elapsed = ts - n.activationAt;
        if (elapsed < 500) {
          const t = elapsed / 500;
          n.activeT = 1 - (1 - t) * (1 - t);
        } else if (elapsed < 800) {
          if (!n.contentRotated) {
            n.telIdx = (n.telIdx + 1) % n.telemetry.length;
            n.contentRotated = true;
          }
          n.activeT = 1 - (elapsed - 500) / 300;
        } else {
          n.activeT = 0;
          n.activationAt = 0;
        }
      } else {
        n.activeT = 0;
      }
    }

    if (ts - lastOpsTickAt > 3500) {
      opsCounter += 1 + Math.floor(Math.random() * 3);
      lastOpsTickAt = ts;
    }

    if (ts - lastPulseAt > 1200) {
      const n = nodes[Math.floor(Math.random() * nodes.length)];
      pulses.push({ node: n, progress: 0, speed: 0.014 });
      lastPulseAt = ts;
    }

    for (let i = pulses.length - 1; i >= 0; i--) {
      pulses[i].progress += pulses[i].speed;
      if (pulses[i].progress >= 1) {
        aodbPulse = 1;
        pulses.splice(i, 1);
      }
    }
    aodbPulse = Math.max(0, aodbPulse - 0.02);

    drawConnections();
    drawPulses();
    drawCenter(ts);
    drawNodes();

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
