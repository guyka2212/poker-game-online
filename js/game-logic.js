// ----- CONSTANTS -----
const SUITS=['h','d','c','s'];
const SUIT_SYM={h:'♥',d:'♦',c:'♣',s:'♠'};
const SUIT_CLS={h:'r',d:'r',c:'b',s:'b'};
const RANK_NAMES={14:'A',13:'K',12:'Q',11:'J',10:'10',9:'9',8:'8',7:'7',6:'6',5:'5',4:'4',3:'3',2:'2'};
const RANK_FULL={14:'Ace',13:'King',12:'Queen',11:'Jack',10:'Ten',9:'Nine',8:'Eight',7:'Seven',6:'Six',5:'Five',4:'Four',3:'Three',2:'Two'};

// ----- DECK -----
function makeDeck(){const d=[];for(const s of SUITS)for(let r=14;r>=2;r--)d.push({rank:r,suit:s});return d}
function shuffle(d){for(let i=d.length-1;i>0;i--){const j=Math.random()*i|0;[d[i],d[j]]=[d[j],d[i]]}return d}

// ----- EVALUATOR -----
function straightHigh(r){
  const u=[...new Set(r)].sort((a,b)=>b-a);
  for(let i=0;i<=u.length-5;i++)if(u[i]-4===u[i+4])return u[i];
  return u.includes(14)&&u.includes(5)&&u.includes(4)&&u.includes(3)&&u.includes(2)?5:null;
}
function handScore(c){
  const s=[...c].sort((a,b)=>b.rank-a.rank),r=s.map(x=>x.rank),su=s.map(x=>x.suit);
  const fl=su.every(x=>x===su[0]),sh=straightHigh(r);
  const gr={};
  for(const x of s){if(!gr[x.rank])gr[x.rank]=[];gr[x.rank].push(x)}
  const ga=Object.values(gr).sort((a,b)=>b.length-a.length||b[0].rank-a[0].rank);
  if(fl&&sh===14)return[9];
  if(fl&&sh)return[8,sh];
  if(ga[0].length===4)return[7,ga[0][0].rank,ga[1]?.[0]?.rank||0];
  if(ga[0].length===3&&ga[1]&&ga[1].length===2)return[6,ga[0][0].rank,ga[1][0].rank];
  if(fl)return[5,...r];
  if(sh)return[4,sh];
  if(ga[0].length===3)return[3,ga[0][0].rank,(ga[1]?.[0]?.rank||0),(ga[2]?.[0]?.rank||0)];
  if(ga[0].length===2&&ga[1]&&ga[1].length===2)return[2,ga[0][0].rank,ga[1][0].rank,(ga[2]?.[0]?.rank||0)];
  if(ga[0].length===2)return[1,ga[0][0].rank,(ga[1]?.[0]?.rank||0),(ga[2]?.[0]?.rank||0),(ga[3]?.[0]?.rank||0)];
  return[0,...r];
}
function bestOf7(c){
  let b=null,bs=null;
  for(let i=0;i<c.length;i++)for(let j=i+1;j<c.length;j++){
    const hh=c.filter((_,k)=>k!==i&&k!==j),sc=handScore(hh);
    if(!bs||cmp(sc,bs)>0){b=hh;bs=sc}
  }
  return{hand:b,score:bs};
}
function cmp(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){const va=a[i]||0,vb=b[i]||0;if(va!==vb)return va-vb}return 0}
function handName(sc){
  const rn=v=>RANK_FULL[v]||String(v);const c=sc[0],k1=sc[1],k2=sc[2];
  if(c===9)return'Royal Flush';
  if(c===8)return'Straight Flush, '+rn(k1)+' high';
  if(c===7)return'Four of a Kind, '+rn(k1)+'s';
  if(c===6)return'Full House, '+rn(k1)+'s full of '+rn(k2)+'s';
  if(c===5)return'Flush, '+rn(k1)+' high';
  if(c===4)return'Straight, '+rn(k1)+' high';
  if(c===3)return'Three of a Kind, '+rn(k1)+'s';
  if(c===2)return'Two Pair, '+rn(k1)+'s and '+rn(k2)+'s';
  if(c===1)return'Pair of '+rn(k1)+'s';
  return rn(k1)+' high';
}
function handLevel(sc){
  const c=sc[0],k1=sc[1];
  if(c>=6)return{lv:'Monster',v:5,cl:'#c9a227'};
  if(c>=3)return{lv:'Strong',v:4,cl:'#2ecc71'};
  if(c>=2)return{lv:'Decent',v:3,cl:'#3498db'};
  if(c>=1)return k1>=12?{lv:'Decent',v:3,cl:'#3498db'}:{lv:'Weak',v:2,cl:'#f1c40f'};
  return{lv:'Trash',v:1,cl:'#95a5a6'};
}
function handTip(sc,mt){
  if(!mt)return'';const c=sc[0];
  if(c>=8)return'Unbeatable \u2014 go all-in!';
  if(c>=6)return'Monster hand \u2014 raise big!';
  if(c>=4)return'Strong hand \u2014 consider raising';
  if(c>=2&&sc[1]>=12)return'Nice hand \u2014 raise to build the pot';
  if(c>=2)return'Decent \u2014 call or check';
  if(c>=1&&sc[1]<=6)return'Weak pair \u2014 consider checking';
  if(c>=1)return'Low pair \u2014 tread carefully';
  if(c===0&&sc[1]>=12)return'High cards \u2014 could improve';
  return'Weak hand \u2014 consider folding';
}
function pfEval(c){
  const x=[...c].sort((a,b)=>b.rank-a.rank),s=x[0].suit===x[1].suit,g=x[0].rank-x[1].rank;
  if(x[0].rank===x[1].rank)return x[0].rank>=12?[6]:x[0].rank>=9?[5]:[4];
  if(x[0].rank===14&&x[1].rank===13)return s?[6]:[4];
  if(x[0].rank===14&&x[1].rank===12)return s?[5]:[4];
  if(x[0].rank>=12&&x[1].rank>=11)return s?[5]:[3];
  if(x[0].rank>=14||x[1].rank>=12)return s?[4]:[2];
  if(s&&g<=3&&x[0].rank>=10)return[3];
  if(x[0].rank>=10&&x[1].rank>=10)return[3];
  return[1];
}
function phaseName(p){return{waiting:'Waiting',preflop:'Pre-Flop',flop:'Flop',turn:'Turn',river:'River',showdown:'Showdown','hand-over':'Hand Over'}[p]||p}

// ----- AI -----
function dealerAI(state){
  const known=[...state.dealerHole,...state.communityCards];
  let sc=known.length<5?pfEval(state.dealerHole):bestOf7(known).score;
  const hl=handLevel(sc);
  const b=state.betting,ccost=b.currentBet-b.dealerCommit,ck=b.currentBet===b.dealerCommit;
  if(hl.lv==='Monster'||hl.lv==='Strong'){
    if(ck)return{type:'bet',amount:Math.min(Math.round(state.pot*0.65)||20,state.dealerChips)};
    const ra=Math.min(Math.round(Math.max(b.currentBet*2,state.pot*0.5)),state.dealerChips+b.dealerCommit);
    if(ra>b.dealerCommit+ccost)return{type:'raise',amount:ra};
    return{type:'call'};
  }
  if(hl.lv==='Decent'){
    if(ck)return Math.random()<.25?{type:'bet',amount:Math.min(Math.round(state.pot*.35)||20,state.dealerChips)}:{type:'check'};
    return Math.random()<.2?{type:'fold'}:{type:'call'};
  }
  if(ck)return Math.random()<.1?{type:'bet',amount:Math.min(20,state.dealerChips)}:{type:'check'};
  return Math.random()<.55?{type:'fold'}:{type:'call'};
}

// ----- STATE -----
function freshState(){
  return{
    view:'home',role:null,playerName:'',roomCode:'',phase:'waiting',deck:[],
    playerHole:[],dealerHole:[],communityCards:[],pot:0,
    playerChips:1000,dealerChips:1000,
    betting:{playerCommit:0,dealerCommit:0,currentBet:0,actor:'player',playerActed:false,dealerActed:false,roundOver:false},
    playerFolded:false,dealerFolded:false,dealerHoleRevealed:false,
    winner:null,playerBest:null,dealerBest:null,gameOver:false,
    dealerThinking:false,lastDealerAction:null,error:'',connected:false,
    phaseOrder:0
  };
}

function roundOver(b){return b.playerActed&&b.dealerActed&&b.playerCommit===b.dealerCommit}

function execAction(state,action){
  const s=JSON.parse(JSON.stringify(state));const b=s.betting;
  if(action.type==='fold'){
    if(b.actor==='player')s.playerFolded=true;else s.dealerFolded=true;
    s.phase='showdown';s.dealerHoleRevealed=true;
    s.winner=s.playerFolded?'dealer':'player';return s;
  }
  const isP=b.actor==='player';
  const ck=isP?'playerCommit':'dealerCommit',ak=isP?'playerActed':'dealerActed';
  const oa=isP?'dealerActed':'playerActed',ch=isP?'playerChips':'dealerChips';
  if(action.type==='check'){
    if(b.currentBet!==b[ck])return s;
    b[ak]=true;b.actor=isP?'dealer':'player';b.roundOver=roundOver(b);return s;
  }
  if(action.type==='call'){
    const cc=b.currentBet-b[ck];if(cc>0&&cc>s[ch])return s;
    s[ch]-=cc;s.pot+=cc;b[ck]=b.currentBet;
    b[ak]=true;b.actor=isP?'dealer':'player';b.roundOver=roundOver(b);return s;
  }
  if(action.type==='bet'||action.type==='raise'){
    const mx=s[ch]+b[ck],tot=Math.min(action.amount,mx),cost=tot-b[ck];
    if(cost<=0)return s;
    s[ch]-=cost;s.pot+=cost;b[ck]=tot;b.currentBet=tot;
    b[ak]=true;b[oa]=false;b.actor=isP?'dealer':'player';return s;
  }
  return s;
}

function advanceStreet(state){
  const s=JSON.parse(JSON.stringify(state));const d=s.deck;
  const deal=n=>{const r=[];for(let i=0;i<n&&d.length;i++)r.push(d.pop());return r};
  const nb=a=>({playerCommit:0,dealerCommit:0,currentBet:0,actor:a,playerActed:false,dealerActed:false,roundOver:false});
  if(s.phase==='preflop'){s.phase='flop';s.communityCards=deal(3);s.betting=nb('dealer')}
  else if(s.phase==='flop'){s.phase='turn';s.communityCards=s.communityCards.concat(deal(1));s.betting=nb('dealer')}
  else if(s.phase==='turn'){s.phase='river';s.communityCards=s.communityCards.concat(deal(1));s.betting=nb('dealer')}
  else if(s.phase==='river'){s.phase='showdown';s.dealerHoleRevealed=true}
  return s;
}

function showdown(s){
  const n=JSON.parse(JSON.stringify(s));
  if(n.playerFolded){n.winner='dealer';n.dealerHoleRevealed=true;}
  else if(n.dealerFolded){n.winner='player';}
  else{
    n.dealerHoleRevealed=true;
    const pb=bestOf7(n.playerHole.concat(n.communityCards));
    const db=bestOf7(n.dealerHole.concat(n.communityCards));
    n.playerBest=pb;n.dealerBest=db;
    const cc=cmp(pb.score,db.score);
    n.winner=cc>0?'player':cc<0?'dealer':'tie';
  }
  if(n.winner==='tie'){const hf=Math.floor(n.pot/2);n.playerChips+=hf;n.dealerChips+=n.pot-hf}
  else n[n.winner==='player'?'playerChips':'dealerChips']+=n.pot;
  n.pot=0;n.phase='hand-over';return n;
}

function newHand(state){
  const n=JSON.parse(JSON.stringify(state));
  if(n.playerChips<10||n.dealerChips<10){n.phase='hand-over';n.gameOver=true;return n}
  const d=shuffle(makeDeck());const de=()=>d.pop();
  n.deck=d;n.phase='preflop';n.phaseOrder=(n.phaseOrder||0)+1;
  n.playerHole=[de(),de()];n.dealerHole=[de(),de()];
  n.communityCards=[];n.dealerHoleRevealed=false;n.playerFolded=false;n.dealerFolded=false;
  n.winner=null;n.playerBest=null;n.dealerBest=null;n.gameOver=false;
  n.playerChips-=10;n.dealerChips-=10;n.pot=20;
  n.betting={playerCommit:0,dealerCommit:0,currentBet:0,actor:'player',playerActed:false,dealerActed:false,roundOver:false};
  return n;
}
