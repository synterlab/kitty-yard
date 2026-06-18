// === KITTY YARD — Custom SVG Cat Portraits ===
// Each cat is drawn with SVG shapes: body, head, ears, face, pattern, accessory

const CAT_PROFILES = {
  biscuit:    { body:'#f0903a', belly:'#ffd0a0', ear:'#f5b8b8', eye:'#5dbf60', pat:'tabby-orange', acc:'none',      shape:'round',  expr:'happy'   },
  smoky:      { body:'#8898aa', belly:'#d8e0ea', ear:'#bbaabb', eye:'#7ac87a', pat:'solid',        acc:'none',      shape:'slim',   expr:'serene'  },
  mochi:      { body:'#252535', belly:'#3d3d55', ear:'#503050', eye:'#ffd060', pat:'solid',        acc:'none',      shape:'round',  expr:'sleepy'  },
  pebble:     { body:'#e8c080', belly:'#fff0d0', ear:'#f0b8b8', eye:'#88aadd', pat:'calico',       acc:'none',      shape:'round',  expr:'worried' },
  noodle:     { body:'#d0956a', belly:'#f5d8b8', ear:'#f0aaaa', eye:'#60b860', pat:'tabby-brown',  acc:'none',      shape:'slim',   expr:'curious' },
  pudding:    { body:'#282828', belly:'#f0eeec', ear:'#503a3a', eye:'#3ac0e0', pat:'tuxedo',       acc:'bowtie',    shape:'round',  expr:'smug'    },
  tangerine:  { body:'#f06820', belly:'#ffcca0', ear:'#f09898', eye:'#60c060', pat:'tabby-orange', acc:'none',      shape:'round',  expr:'surprised'},
  buttons:    { body:'#b87a50', belly:'#e8c898', ear:'#d09898', eye:'#c0900a', pat:'solid',        acc:'none',      shape:'slim',   expr:'smug'    },
  duchess:    { body:'#f5f0ea', belly:'#ffffff', ear:'#ffd8e0', eye:'#c090ff', pat:'fluffy',       acc:'flower',    shape:'round',  expr:'regal'   },
  pirate:     { body:'#c88050', belly:'#e8c090', ear:'#d09898', eye:'#c87840', pat:'solid',        acc:'eyepatch',  shape:'slim',   expr:'squint'  },
  cinnamon:   { body:'#e07838', belly:'#ffcc98', ear:'#f0a0a0', eye:'#a06020', pat:'tabby-orange', acc:'none',      shape:'slim',   expr:'squint'  },
  marble:     { body:'#a0aab8', belly:'#d8e0e8', ear:'#c0a8c0', eye:'#5aaa5a', pat:'swirl',        acc:'none',      shape:'round',  expr:'happy'   },
  zigzag:     { body:'#c8a060', belly:'#f0d898', ear:'#d09898', eye:'#88bb44', pat:'tabby-zigzag', acc:'none',      shape:'slim',   expr:'curious' },
  olive:      { body:'#1e2820', belly:'#2e3c2e', ear:'#3a2830', eye:'#88ff60', pat:'solid',        acc:'none',      shape:'slim',   expr:'serene'  },
  emperor:    { body:'#a08060', belly:'#d8c090', ear:'#c09898', eye:'#e0a000', pat:'tabby-brown',  acc:'crown',     shape:'round',  expr:'regal'   },
  aurora:     { body:'#d0d8f0', belly:'#eef0ff', ear:'#d0c8f0', eye:'#a060ff', pat:'swirl',        acc:'stars',     shape:'round',  expr:'serene'  },
  phantom:    { body:'#0e0e1a', belly:'#1e1e30', ear:'#2a1a2a', eye:'#c0d8ff', pat:'solid',        acc:'none',      shape:'slim',   expr:'serene'  },
  maestro:    { body:'#2a2a2a', belly:'#f0eeec', ear:'#403030', eye:'#ffffff', pat:'tuxedo',       acc:'tophat',    shape:'slim',   expr:'smug'    },
  blossom:    { body:'#f5d0d8', belly:'#fff0f4', ear:'#f8b8c8', eye:'#ff80a0', pat:'solid',        acc:'flower',    shape:'round',  expr:'happy'   },
  captain:    { body:'#607080', belly:'#9eb0c0', ear:'#8898a8', eye:'#40b0d0', pat:'solid',        acc:'anchor',    shape:'slim',   expr:'squint'  },
  nimbus:     { body:'#f0f0f8', belly:'#ffffff', ear:'#e0d8f0', eye:'#80c0ff', pat:'fluffy',       acc:'none',      shape:'round',  expr:'serene'  },
  prism:      { body:'#f090c0', belly:'#ffe0f0', ear:'#f0b0d0', eye:'#ff4080', pat:'swirl',        acc:'stars',     shape:'round',  expr:'happy'   },
};

// ---- Pattern renderers ----
function drawPattern(pat, bodyColor, cx, cy) {
  const dc = darken(bodyColor, 0.2);
  switch(pat) {
    case 'tabby-orange':
    case 'tabby-brown':
    case 'tabby-zigzag':
      return `
        <path d="M${cx-8},${cy-12} Q${cx},${cy-16} ${cx+8},${cy-12}" stroke="${dc}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M${cx-10},${cy-6} Q${cx},${cy-10} ${cx+10},${cy-6}" stroke="${dc}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M${cx-6},${cy+2} Q${cx},${cy-2} ${cx+6},${cy+2}" stroke="${dc}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    case 'tuxedo':
      return `<ellipse cx="${cx}" cy="${cy+4}" rx="8" ry="12" fill="white" opacity="0.95"/>`;
    case 'calico':
      return `
        <ellipse cx="${cx-7}" cy="${cy-8}" rx="7" ry="6" fill="white" opacity="0.85"/>
        <ellipse cx="${cx+8}" cy="${cy+4}" rx="6" ry="5" fill="#f0903a" opacity="0.7"/>`;
    case 'swirl':
      return `
        <path d="M${cx},${cy-4} Q${cx+8},${cy+2} ${cx},${cy+8} Q${cx-6},${cy+4} ${cx},${cy-4}" fill="${dc}" opacity="0.35"/>`;
    case 'fluffy':
      return `
        <circle cx="${cx-12}" cy="${cy-4}" r="5" fill="white" opacity="0.5"/>
        <circle cx="${cx+12}" cy="${cy-4}" r="5" fill="white" opacity="0.5"/>
        <circle cx="${cx}" cy="${cy-14}" r="5" fill="white" opacity="0.5"/>`;
    default: return '';
  }
}

// ---- Eye renderer ----
function drawEyes(expr, eyeColor, cx, cy) {
  const pupilH = expr === 'happy' ? 2 : expr === 'sleepy' ? 1 : expr === 'surprised' ? 4.5 : 3;
  const lidClose = expr === 'sleepy' ? 0.6 : 0;
  const eyeL = cx - 8, eyeR = cx + 8;
  const shine = `<circle cx="${eyeL+1}" cy="${cy-1}" r="1.2" fill="white"/><circle cx="${eyeR+1}" cy="${cy-1}" r="1.2" fill="white"/>`;

  if (expr === 'happy') {
    return `
      <path d="M${eyeL-4},${cy} Q${eyeL},${cy-6} ${eyeL+4},${cy}" stroke="${eyeColor}" stroke-width="2.5" fill="${eyeColor}" opacity="0.9"/>
      <path d="M${eyeR-4},${cy} Q${eyeR},${cy-6} ${eyeR+4},${cy}" stroke="${eyeColor}" stroke-width="2.5" fill="${eyeColor}" opacity="0.9"/>
      ${shine}`;
  }
  if (expr === 'sleepy') {
    return `
      <ellipse cx="${eyeL}" cy="${cy}" rx="4" ry="2.5" fill="${eyeColor}" opacity="0.9"/>
      <path d="M${eyeL-4},${cy-1} Q${eyeL},${cy-3} ${eyeL+4},${cy-1}" fill="${darken(eyeColor,0.3)}" opacity="0.7"/>
      <ellipse cx="${eyeR}" cy="${cy}" rx="4" ry="2.5" fill="${eyeColor}" opacity="0.9"/>
      <path d="M${eyeR-4},${cy-1} Q${eyeR},${cy-3} ${eyeR+4},${cy-1}" fill="${darken(eyeColor,0.3)}" opacity="0.7"/>
      ${shine}`;
  }
  if (expr === 'smug') {
    return `
      <ellipse cx="${eyeL}" cy="${cy}" rx="3.5" ry="3" fill="${eyeColor}"/>
      <ellipse cx="${eyeL}" cy="${cy}" rx="1.8" ry="2.5" fill="#1a1a30"/>
      <path d="M${eyeL-4},${cy-2} Q${eyeL},${cy-6} ${eyeL+4},${cy-2}" fill="none" stroke="${darken(eyeColor,0.3)}" stroke-width="1.5"/>
      <ellipse cx="${eyeR}" cy="${cy}" rx="3.5" ry="3" fill="${eyeColor}"/>
      <ellipse cx="${eyeR}" cy="${cy}" rx="1.8" ry="2.5" fill="#1a1a30"/>
      <path d="M${eyeR-4},${cy-2} Q${eyeR},${cy-6} ${eyeR+4},${cy-2}" fill="none" stroke="${darken(eyeColor,0.3)}" stroke-width="1.5"/>
      ${shine}`;
  }
  if (expr === 'squint') {
    return `
      <path d="M${eyeL-4},${cy} Q${eyeL},${cy-5} ${eyeL+4},${cy}" fill="${eyeColor}" opacity="0.85"/>
      <path d="M${eyeL-4},${cy+1} L${eyeL+4},${cy+1}" stroke="${darken(eyeColor,0.3)}" stroke-width="1.5"/>
      <path d="M${eyeR-4},${cy} Q${eyeR},${cy-5} ${eyeR+4},${cy}" fill="${eyeColor}" opacity="0.85"/>
      <path d="M${eyeR-4},${cy+1} L${eyeR+4},${cy+1}" stroke="${darken(eyeColor,0.3)}" stroke-width="1.5"/>`;
  }
  if (expr === 'surprised') {
    return `
      <ellipse cx="${eyeL}" cy="${cy}" rx="5" ry="5.5" fill="${eyeColor}"/>
      <ellipse cx="${eyeL}" cy="${cy}" rx="2.5" ry="3.5" fill="#1a1a30"/>
      <ellipse cx="${eyeR}" cy="${cy}" rx="5" ry="5.5" fill="${eyeColor}"/>
      <ellipse cx="${eyeR}" cy="${cy}" rx="2.5" ry="3.5" fill="#1a1a30"/>
      ${shine}`;
  }
  if (expr === 'regal') {
    return `
      <ellipse cx="${eyeL}" cy="${cy}" rx="4" ry="3.5" fill="${eyeColor}"/>
      <ellipse cx="${eyeL}" cy="${cy}" rx="1.5" ry="2.8" fill="#1a1a30"/>
      <ellipse cx="${eyeR}" cy="${cy}" rx="4" ry="3.5" fill="${eyeColor}"/>
      <ellipse cx="${eyeR}" cy="${cy}" rx="1.5" ry="2.8" fill="#1a1a30"/>
      <path d="M${eyeL-4},${cy-3} Q${eyeL},${cy-7} ${eyeL+4},${cy-3}" fill="${darken(eyeColor,0.2)}" opacity="0.6"/>
      <path d="M${eyeR-4},${cy-3} Q${eyeR},${cy-7} ${eyeR+4},${cy-3}" fill="${darken(eyeColor,0.2)}" opacity="0.6"/>
      ${shine}`;
  }
  // default / worried / curious
  return `
    <ellipse cx="${eyeL}" cy="${cy}" rx="4" ry="${pupilH+1}" fill="${eyeColor}"/>
    <ellipse cx="${eyeL}" cy="${cy}" rx="2" ry="${pupilH}" fill="#1a1a30"/>
    <ellipse cx="${eyeR}" cy="${cy}" rx="4" ry="${pupilH+1}" fill="${eyeColor}"/>
    <ellipse cx="${eyeR}" cy="${cy}" rx="2" ry="${pupilH}" fill="#1a1a30"/>
    ${shine}`;
}

// ---- Accessory renderer ----
function drawAccessory(acc, cx, headTop) {
  switch(acc) {
    case 'tophat': return `
      <rect x="${cx-12}" y="${headTop-22}" width="24" height="16" rx="2" fill="#1a1a1a"/>
      <rect x="${cx-16}" y="${headTop-8}" width="32" height="5" rx="2" fill="#1a1a1a"/>
      <rect x="${cx-10}" y="${headTop-21}" width="20" height="3" rx="1" fill="#c0392b" opacity="0.9"/>`;
    case 'crown': return `
      <path d="M${cx-14},${headTop-2} L${cx-14},${headTop-18} L${cx-7},${headTop-12} L${cx},${headTop-22} L${cx+7},${headTop-12} L${cx+14},${headTop-18} L${cx+14},${headTop-2} Z" fill="#f0c030" stroke="#d0a020" stroke-width="1"/>
      <circle cx="${cx}" cy="${headTop-20}" r="2.5" fill="#e04040"/>
      <circle cx="${cx-10}" cy="${headTop-14}" r="2" fill="#4080ff"/>
      <circle cx="${cx+10}" cy="${headTop-14}" r="2" fill="#40e080"/>`;
    case 'bowtie': return `
      <polygon points="${cx-14},${headTop+44} ${cx},${headTop+50} ${cx-14},${headTop+56}" fill="#e04040"/>
      <polygon points="${cx+14},${headTop+44} ${cx},${headTop+50} ${cx+14},${headTop+56}" fill="#e04040"/>
      <circle cx="${cx}" cy="${headTop+50}" r="3.5" fill="#c02020"/>`;
    case 'eyepatch': return `
      <path d="M${cx-18},${headTop+10} Q${cx-10},${headTop+4} ${cx-2},${headTop+10}" stroke="#1a1a1a" stroke-width="1.5" fill="none"/>
      <circle cx="${cx-10}" cy="${headTop+12}" r="7" fill="#1a1a1a"/>
      <circle cx="${cx-10}" cy="${headTop+12}" r="4" fill="#333"/>`;
    case 'flower': return `
      <g transform="translate(${cx+12},${headTop-6})">
        <circle cx="0" cy="-6" r="4" fill="#ff80a0" opacity="0.9"/>
        <circle cx="5" cy="-2" r="4" fill="#ff80a0" opacity="0.9"/>
        <circle cx="3" cy="4" r="4" fill="#ffb0d0" opacity="0.9"/>
        <circle cx="-3" cy="4" r="4" fill="#ffb0d0" opacity="0.9"/>
        <circle cx="-5" cy="-2" r="4" fill="#ff80a0" opacity="0.9"/>
        <circle cx="0" cy="0" r="4" fill="#fff060"/>
      </g>`;
    case 'anchor': return `
      <text x="${cx}" y="${headTop-4}" text-anchor="middle" font-size="18" fill="#2080c0">⚓</text>`;
    case 'stars': return `
      <text x="${cx-18}" y="${headTop}" font-size="12" fill="#ffd040">✦</text>
      <text x="${cx+10}" y="${headTop-4}" font-size="10" fill="#ffd040">✦</text>
      <text x="${cx+6}" y="${headTop+10}" font-size="8" fill="#ffe080">✧</text>`;
    default: return '';
  }
}

// ---- Cheek blush ----
function drawBlush(cx, cy) {
  return `
    <ellipse cx="${cx-10}" cy="${cy+4}" rx="5" ry="3" fill="#ff9090" opacity="0.4"/>
    <ellipse cx="${cx+10}" cy="${cy+4}" rx="5" ry="3" fill="#ff9090" opacity="0.4"/>`;
}

// ---- Whiskers ----
function drawWhiskers(cx, cy) {
  return `
    <line x1="${cx-22}" y1="${cy+2}" x2="${cx-6}" y2="${cy+4}" stroke="rgba(80,60,40,0.4)" stroke-width="0.9"/>
    <line x1="${cx-22}" y1="${cy+5}" x2="${cx-6}" y2="${cy+6}" stroke="rgba(80,60,40,0.4)" stroke-width="0.9"/>
    <line x1="${cx+6}" y1="${cy+4}" x2="${cx+22}" y2="${cy+2}" stroke="rgba(80,60,40,0.4)" stroke-width="0.9"/>
    <line x1="${cx+6}" y1="${cy+6}" x2="${cx+22}" y2="${cy+5}" stroke="rgba(80,60,40,0.4)" stroke-width="0.9"/>`;
}

// ---- Main generator ----
export function generateCatSVG(catId, size = 100) {
  const p = CAT_PROFILES[catId];
  if (!p) return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><text y="55" x="50" text-anchor="middle" font-size="50">🐱</text></svg>`;

  const cx = 50, cy = 50;
  const isRound = p.shape === 'round';
  const bodyRx = isRound ? 24 : 20, bodyRy = isRound ? 22 : 18;
  const headR = isRound ? 22 : 20;
  const headY = 32, bodyY = 68;

  // Tail path
  const tail = p.shape === 'slim'
    ? `<path d="M${cx+14},${bodyY} Q${cx+40},${bodyY-10} ${cx+30},${bodyY-28}" stroke="${p.body}" stroke-width="7" stroke-linecap="round" fill="none"/>`
    : `<path d="M${cx+16},${bodyY} Q${cx+38},${bodyY-4} ${cx+28},${bodyY-22}" stroke="${p.body}" stroke-width="9" stroke-linecap="round" fill="none"/>`;

  // Shadow
  const shadow = `<ellipse cx="${cx}" cy="${bodyY+14}" rx="${bodyRx-2}" ry="5" fill="#4a3728" opacity="0.1"/>`;

  // Body
  const body = `<ellipse cx="${cx}" cy="${bodyY}" rx="${bodyRx}" ry="${bodyRy}" fill="${p.body}"/>`;

  // Belly
  const belly = `<ellipse cx="${cx}" cy="${bodyY+2}" rx="${bodyRx*0.55}" ry="${bodyRy*0.7}" fill="${p.belly}" opacity="0.85"/>`;

  // Body pattern
  const bodyPat = drawPattern(p.pat, p.body, cx, bodyY);

  // Head
  const head = `<circle cx="${cx}" cy="${headY}" r="${headR}" fill="${p.body}"/>`;

  // Ears
  const earLeft  = `<polygon points="${cx-headR+2},${headY-8} ${cx-headR-6},${headY-headR-8} ${cx-headR+12},${headY-headR}" fill="${p.body}"/>`;
  const earRight = `<polygon points="${cx+headR-2},${headY-8} ${cx+headR+6},${headY-headR-8} ${cx+headR-12},${headY-headR}" fill="${p.body}"/>`;
  const earLi    = `<polygon points="${cx-headR+4},${headY-9} ${cx-headR-3},${headY-headR-4} ${cx-headR+10},${headY-headR+1}" fill="${p.ear}"/>`;
  const earRi    = `<polygon points="${cx+headR-4},${headY-9} ${cx+headR+3},${headY-headR-4} ${cx+headR-10},${headY-headR+1}" fill="${p.ear}"/>`;

  // Face
  const eyes = drawEyes(p.expr, p.eye, cx, headY-2);
  const nose = `<polygon points="${cx},${headY+8} ${cx-3},${headY+11} ${cx+3},${headY+11}" fill="#ff8ca0"/>`;
  const mouth = p.expr === 'happy' || p.expr === 'surprised'
    ? `<path d="M${cx-4},${headY+12} Q${cx},${headY+16} ${cx+4},${headY+12}" stroke="#cc6080" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
    : `<path d="M${cx-4},${headY+13} Q${cx},${headY+12} ${cx+4},${headY+13}" stroke="#cc6080" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  const whiskers = drawWhiskers(cx, headY+6);
  const blush = (p.expr === 'happy' || p.expr === 'worried' || p.expr === 'surprised') ? drawBlush(cx, headY) : '';

  // Head pattern (forehead markings)
  const headPat = (p.pat === 'tabby-orange' || p.pat === 'tabby-brown' || p.pat === 'tabby-zigzag')
    ? `<path d="M${cx-5},${headY-18} Q${cx},${headY-22} ${cx+5},${headY-18}" stroke="${darken(p.body,0.22)}" stroke-width="2" fill="none" stroke-linecap="round"/>
       <path d="M${cx-3},${headY-14} Q${cx},${headY-17} ${cx+3},${headY-14}" stroke="${darken(p.body,0.22)}" stroke-width="1.5" fill="none" stroke-linecap="round"/>` : '';

  // Accessory
  const acc = drawAccessory(p.acc, cx, headY - headR);

  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    ${shadow}
    ${tail}
    ${body}
    ${belly}
    ${bodyPat}
    ${earLeft}${earRight}
    ${earLi}${earRi}
    ${head}
    ${headPat}
    ${blush}
    ${eyes}
    ${nose}
    ${mouth}
    ${whiskers}
    ${acc}
  </svg>`;
}

// ---- Animated walking cat for intro ----
export function walkingCatSVG(catId, size = 70) {
  return generateCatSVG(catId, size);
}

// ---- Utility ----
function darken(hex, amount) {
  let r = parseInt(hex.slice(1,3),16);
  let g = parseInt(hex.slice(3,5),16);
  let b = parseInt(hex.slice(5,7),16);
  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
