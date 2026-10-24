/* ChessVision — interactive explainer.
   No framework; GSAP + ScrollTrigger for motion, hand-rolled board + FEN. */
const PIECES = { K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙', k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟' };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- FEN → 8×8 array (rank 8 first) ---- */
function parseFEN(fen){
  const rows = fen.split(' ')[0].split('/');
  return rows.map(row=>{
    const cells=[];
    for(const ch of row){ if(/\d/.test(ch)){ for(let i=0;i<+ch;i++) cells.push(''); } else cells.push(ch); }
    return cells;
  });
}
/* ---- render a 2D board into el; optional pieces ---- */
function renderBoard(el, fen, {pieces=true}={}){
  el.innerHTML='';
  const grid = parseFEN(fen);
  for(let r=0;r<8;r++){ for(let f=0;f<8;f++){
    const cell=document.createElement('div');
    cell.className='cell '+(((r+f)%2===0)?'l':'d');
    cell.dataset.sq = 'abcdefgh'[f]+(8-r);
    const p=grid[r][f];
    if(pieces&&p){ const s=document.createElement('span'); s.className='pc '+(p===p.toUpperCase()?'w':'b'); s.textContent=PIECES[p]; cell.appendChild(s); }
    el.appendChild(cell);
  }}
  return el;
}
/* ---- fill a 3D checker grid (no pieces) ---- */
function renderGrid3d(el){
  el.innerHTML='';
  for(let r=0;r<8;r++) for(let f=0;f<8;f++){
    const sq=document.createElement('div'); sq.className='sq '+(((r+f)%2===0)?'l':'d'); el.appendChild(sq);
  }
}

const SAMPLE_FEN = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR';

/* ===== build the static vizzes ===== */
renderGrid3d(document.querySelector('[data-grid3d]'));
renderGrid3d(document.querySelector('[data-grid-warp]'));
renderBoard(document.querySelector('[data-classify]'), SAMPLE_FEN, {pieces:false});
renderBoard(document.querySelector('[data-fenboard]'), SAMPLE_FEN, {pieces:false});

/* ===== scroll choreography ===== */
if(window.gsap && window.ScrollTrigger && !reduced){
  gsap.registerPlugin(ScrollTrigger);

  // generic reveals
  gsap.utils.toArray('.pipeline__intro, .play__head, .stage__copy, .foot__inner').forEach(el=>{
    gsap.from(el, {opacity:0,y:34,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 82%'}});
  });

  // stage 2: flatten (perspective warp) as it enters
  ScrollTrigger.create({
    trigger:'[data-stage="2"]', start:'top 55%',
    onEnter:()=>document.querySelector('[data-board-warp]').classList.add('is-flat'),
    onLeaveBack:()=>document.querySelector('[data-board-warp]').classList.remove('is-flat'),
  });

  // stage 3: scan each tile, light up, then classify (reveal pieces)
  const classify = document.querySelector('[data-classify]');
  const cells = [...classify.children];
  const grid = parseFEN(SAMPLE_FEN);
  ScrollTrigger.create({
    trigger:'[data-stage="3"]', start:'top 55%', once:true,
    onEnter(){
      const tl=gsap.timeline();
      cells.forEach((cell,i)=>{
        const r=Math.floor(i/8), f=i%8, p=grid[r][f];
        tl.add(()=>{
          cell.classList.add('scan');
          setTimeout(()=>{
            cell.classList.remove('scan');
            if(p){ const s=document.createElement('span'); s.className='pc '+(p===p.toUpperCase()?'w':'b'); s.textContent=PIECES[p]; s.style.opacity=0; cell.appendChild(s); gsap.to(s,{opacity:1,duration:.25}); cell.classList.add('hit'); }
          },90);
        }, i*0.03);
      });
    }
  });

  // stage 4: reveal pieces + typewriter the FEN
  const fenBoard=document.querySelector('[data-fenboard]');
  const fenOut=document.querySelector('[data-fen]');
  const fullFEN=SAMPLE_FEN+' w KQkq - 4 4';
  ScrollTrigger.create({
    trigger:'[data-stage="4"]', start:'top 55%', once:true,
    onEnter(){
      renderBoard(fenBoard, SAMPLE_FEN, {pieces:true});
      gsap.from(fenBoard.querySelectorAll('.pc'),{opacity:0,scale:.4,duration:.4,stagger:.015,ease:'back.out(2)'});
      let i=0; fenOut.textContent='';
      const type=()=>{ if(i<=fullFEN.length){ fenOut.textContent=fullFEN.slice(0,i++); setTimeout(type,22);} };
      setTimeout(type,500);
    }
  });
} else {
  // reduced motion / no gsap: just show everything resolved
  document.querySelector('[data-board-warp]').classList.add('is-flat');
  renderBoard(document.querySelector('[data-classify]'), SAMPLE_FEN, {pieces:true});
  renderBoard(document.querySelector('[data-fenboard]'), SAMPLE_FEN, {pieces:true});
  document.querySelector('[data-fen]').textContent = SAMPLE_FEN+' w KQkq - 4 4';
  document.querySelectorAll('.reveal').forEach(e=>e.classList.remove('reveal'));
}

/* ===== interactive positions ===== */
const POSITIONS = [
  { name:'Scholar’s Mate', note:'The four-move mate. The queen takes f7 — defended only by the king, which can’t recapture. Checkmate.',
    fen:'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR', move:'h5f7', san:'Qxf7#', eval:'#1 (mate)' },
  { name:'Back-rank Mate', note:'The king is boxed in by its own pawns. The rook slides to the eighth rank — nowhere to hide.',
    fen:'6k1/5ppp/8/8/8/8/5PPP/R5K1', move:'a1a8', san:'Ra8#', eval:'#1 (mate)' },
  { name:'The Royal Fork', note:'A knight leap to c7 attacks the king and the rook at once. The king must move; the rook falls.',
    fen:'r3k3/8/8/1N6/8/8/8/4K3', move:'b5c7', san:'Nc7+', eval:'+5.0 (wins the rook)' },
];
const sqXY = sq => ({ x:'abcdefgh'.indexOf(sq[0])+0.5, y:(8-(+sq[1]))+0.5 });

const cardsEl=document.querySelector('[data-cards]');
const playBoard=document.querySelector('[data-playboard]');
const arrow=document.querySelector('[data-arrow]');
const arrowLine=document.querySelector('[data-arrowline]');
const elFen=document.querySelector('[data-playfen]'), elMove=document.querySelector('[data-move]'),
      elEval=document.querySelector('[data-eval]'), elNote=document.querySelector('[data-note]');

function selectPosition(p, cardEl){
  document.querySelectorAll('.pcard').forEach(c=>c.classList.remove('active'));
  if(cardEl) cardEl.classList.add('active');
  renderBoard(playBoard, p.fen, {pieces:true});
  arrow.classList.remove('show');
  const from=p.move.slice(0,2), to=p.move.slice(2,4);
  const a=sqXY(from), b=sqXY(to);
  arrowLine.setAttribute('x1',a.x); arrowLine.setAttribute('y1',a.y);
  const fc=playBoard.querySelector(`[data-sq="${from}"]`), tc=playBoard.querySelector(`[data-sq="${to}"]`);
  fc&&fc.classList.add('from'); tc&&tc.classList.add('to');
  elFen.textContent=p.fen+' w - - 0 1'; elMove.textContent=p.san; elEval.textContent=p.eval; elNote.textContent=p.note;
  const draw=()=>{ arrow.classList.add('show');
    if(window.gsap && !reduced){ gsap.fromTo(arrowLine,{attr:{x2:a.x,y2:a.y}},{attr:{x2:b.x,y2:b.y},duration:.6,ease:'power3.out'}); }
    else { arrowLine.setAttribute('x2',b.x); arrowLine.setAttribute('y2',b.y); } };
  setTimeout(draw, reduced?0:450);
}

POSITIONS.forEach((p,i)=>{
  const c=document.createElement('button'); c.className='pcard'; c.type='button';
  c.innerHTML=`<h4>${p.name}</h4><p>${p.san} — ${p.eval}</p>`;
  c.addEventListener('click',()=>selectPosition(p,c));
  cardsEl.appendChild(c);
  if(i===0) requestAnimationFrame(()=>selectPosition(p,c));
});
