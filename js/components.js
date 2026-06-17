(function(){
'use strict';
const{useState,useEffect,useRef,useCallback}=React;
const h=React.createElement;

// ----- CARD COMPONENT -----
function Card(props){
  const{card,faceUp,index}=props||{};
  const st={animationDelay:((index||0)*0.12)+'s'};
  if(!faceUp||!card)return h('div',{className:'cd cd-bk cd-dl',style:st});
  const rn=RANK_NAMES[card.rank],sy=SUIT_SYM[card.suit],cl=SUIT_CLS[card.suit];
  return h('div',{className:'cd cd-f cd-dl',style:st},
    h('div',{className:'cn tl '+cl},h('span',{className:'rk'},rn),h('span',{className:'st'},sy)),
    h('div',{className:'cs '+cl},sy),
    h('div',{className:'cn br '+cl},h('span',{className:'rk'},rn),h('span',{className:'st'},sy))
  );
}

function CSlot(props){
  if(props.revealed&&props.card)
    return h(Card,{card:props.card,faceUp:true,index:props.index});
  return h('div',{className:'cd cd-bk cd-dl',style:{animationDelay:((props.index||0)*0.12)+'s'}});
}

function ChipCount(props){
  return h('span',{className:'cb'},h('span',{className:'ci'},'\u25A0'),h('span',null,props.chips));
}

function HandMeter(props){
  const{hc,cc,p,mt}=props;
  const all=hc.concat(cc||[]);
  let sc,hl,nm,tp;
  if(all.length<5){sc=pfEval(hc);hl=handLevel(sc);nm=handName(sc);tp=handTip(sc,mt)}
  else{const b=bestOf7(all);sc=b.score;hl=handLevel(sc);nm=handName(sc);tp=handTip(sc,mt)}
  if(!tp&&mt)tp='Based on your hole cards';
  return h('div',{className:'hm'},
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}},
      h('span',{style:{fontWeight:700,fontSize:'clamp(12px,2.2vw,15px)',color:hl.cl}},hl.lv),
      h('span',{style:{fontSize:'clamp(10px,1.8vw,13px)',opacity:.55}},nm)
    ),
    h('div',{className:'bt'},h('div',{className:'bf',style:{width:((hl.v/5)*100)+'%',background:hl.cl}})),
    tp?h('div',{className:'ht'},tp):null
  );
}

// ----- ACTION BAR -----
function ActionBar(props){
  const{state,sendAction,dt}=props;
  const b=state.betting;
  const mt=b.actor==='player'&&!b.roundOver;
  const canCheck=b.currentBet===b.playerCommit;
  const callCost=b.currentBet-b.playerCommit;
  const canAct=mt&&!dt&&state.phase!=='showdown'&&state.phase!=='hand-over';
  const[ra,setRA]=useState(Math.min(40,state.playerChips));
  const[ac,setAc]=useState(false);
  const mn=Math.max(Math.max(20,b.currentBet+20),b.currentBet+b.currentBet-b.playerCommit);
  const mx=state.playerChips+b.playerCommit;
  useEffect(function(){
    if(!canAct){setRA(Math.min(40,state.playerChips));return}
    setRA(function(p){return Math.max(Math.min(mn,p),Math.min(mx,p))});
  },[mn,mx,canAct,state.playerChips]);
  if(state.phase==='showdown'||state.phase==='hand-over')return null;

  const doRaise=function(){
    setAc(false);
    canAct&&sendAction({type:canCheck?'bet':'raise',amount:ra});
  };
  const doAllIn=function(){setAc(true)};
  const cancelAllIn=function(){setAc(false)};
  const confirmAllIn=function(){
    setAc(false);
    canAct&&sendAction({type:canCheck?'bet':'raise',amount:mx});
  };

  var costLabel=(ra-b.playerCommit);
  if(costLabel<=0)costLabel='';
  else costLabel=' ('+costLabel+' chips)';

  return h('div',{className:'ab'},
    ac
      ? h('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:8,width:'100%',padding:'8px 0'}},
          h('span',{style:{fontWeight:700,fontSize:'clamp(14px,2.5vw,18px)',color:'#e74c3c'}},'Go all in with '+(mx-b.playerCommit)+' chips?'),
          h('div',{style:{display:'flex',gap:10}},
            h('button',{className:'ab-btn b3',style:{flex:1},onClick:confirmAllIn},'Accept'),
            h('button',{className:'ab-btn b4',style:{flex:1},onClick:cancelAllIn},'Cancel')
          )
        )
      : h('div',{style:{display:'flex',flexDirection:'column',flex:1,minWidth:120,gap:3}},
          h('div',{style:{display:'flex',gap:4}},
            canCheck
              ? h('button',{className:'ab-btn b1',disabled:!canAct,onClick:function(){canAct&&sendAction({type:'check'})}},'Check')
              : h('button',{className:'ab-btn b2',disabled:!canAct,onClick:function(){canAct&&sendAction({type:'call'})}},'Call '+(callCost||'')),
            h('button',{className:'ab-btn b3',disabled:!canAct,onClick:doRaise},canCheck?'Bet'+costLabel:'Raise'+costLabel),
            h('button',{className:'ab-btn b3',disabled:!canAct||ra>=mx,onClick:doAllIn},'All In'),
            h('button',{className:'ab-btn b4',disabled:!canAct,onClick:function(){canAct&&sendAction({type:'fold'})}},'Fold')
          ),
          h('div',{className:'rc'},
            h('input',{type:'range',min:mn,max:mx,value:ra,disabled:!canAct,onChange:function(e){setRA(Number(e.target.value))},style:{opacity:canAct?1:.25}}),
            h('span',{className:'ra'},ra>=mx?'ALL IN':ra+' chips')
          )
        )
  );
}

// ----- RESULT SCREEN -----
function ResultScreen(props){
  const{state,sendAction,role,playerName}=props;
  if(state.phase!=='hand-over')return null;
  const pw=state.winner==='player',t=state.winner==='tie',cr=role!=='player';
  return h('div',{className:'ov'},
    h('div',{className:'rb'},
      h('div',{className:'wn'},t?'Split Pot!':pw?((playerName||'You')+' Win!'):'Dealer Wins!'),
      h('div',{className:'hn'},t?handName(state.playerBest&&state.playerBest.score):pw?handName(state.playerBest&&state.playerBest.score):handName(state.dealerBest&&state.dealerBest.score)),
      h('div',{className:'cs'},
        h('div',null,h('span',{style:{opacity:.6}},'You: '),h('span',{style:{color:state.playerChips>=state.dealerChips?'#2ecc71':'#e74c3c',fontWeight:700}},state.playerChips)),
        h('div',null,h('span',{style:{opacity:.6}},'Dealer: '),h('span',{style:{color:state.dealerChips>=state.playerChips?'#2ecc71':'#e74c3c',fontWeight:700}},state.dealerChips))
      ),
      state.gameOver
        ? h('div',null,
            h('div',{className:state.playerChips<10?'lost':'won',style:{margin:'6px 0'}},state.playerChips<10?'You ran out of chips! Game Over.':'Dealer is out! You won!'),
            h('button',{className:'qt',onClick:function(){window.location.reload()}},'New Game')
          )
        : h('div',{style:{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}},
            cr?h('button',{className:'nx',onClick:function(){sendAction&&sendAction({type:'next_hand'})}},'Next Hand'):null,
            role==='dealer'?h('button',{className:'qt',onClick:function(){window.location.reload()}},'Close Room'):null
          )
    )
  );
}

// ----- GAME VIEW -----
function GameView(props){
  const{state,sendAction,role,playerName}=props;
  const{phase,playerHole,dealerHole,communityCards,pot,playerChips,dealerChips,dealerHoleRevealed,betting,dealerThinking}=state;
  const pcc=communityCards.slice(0,5);
  while(pcc.length<5)pcc.push(null);
  return h('div',{className:'t',style:{minHeight:'clamp(360px,85vh,650px)'}},
    h('div',{className:'dz'},
      h('div',{className:'di'},h('span',{style:{fontWeight:700,fontSize:'clamp(13px,2.3vw,17px)',color:'#c9a227'}},'Dealer'),h(ChipCount,{chips:dealerChips})),
      h('div',{className:'cds'},h(Card,{card:dealerHole[0],faceUp:dealerHoleRevealed,index:0}),h(Card,{card:dealerHole[1],faceUp:dealerHoleRevealed,index:1})),
      dealerThinking?h('div',{className:'th'},h('span',null,'Thinking'),h('span',{className:'dt'}),h('span',{className:'dt'}),h('span',{className:'dt'})):null
    ),
    h('div',{className:'cz'},
      h('div',{className:'ccr'},pcc.map(function(c,i){return h(CSlot,{key:i,revealed:!!c,card:c,index:i})})),
      h('div',{className:'pd'},h('span',{className:'lb'},'Pot'),h('span',{className:'am'},pot))
    ),
    h(HandMeter,{hc:playerHole,cc:communityCards,p:phase,mt:betting.actor==='player'&&!betting.roundOver}),
    h('div',{className:'pz'},
      h('div',{style:{display:'flex',alignItems:'center',gap:10}},h('span',{style:{fontWeight:700,fontSize:'clamp(13px,2.3vw,17px)'}},playerName||'You'),h(ChipCount,{chips:playerChips})),
      h('div',{className:'cds'},h(Card,{card:playerHole[0],faceUp:true,index:0}),h(Card,{card:playerHole[1],faceUp:true,index:1}))
    ),
    h(ActionBar,{state:state,sendAction:sendAction,dt:dealerThinking}),
    h('div',{className:'sb'},phaseName(phase)),
    h(ResultScreen,{state:state,sendAction:sendAction,role:role,playerName:playerName})
  );
}

// ----- LOBBY SCREENS -----
function HomePage(props){
  return h('div',{className:'lby'},
    h('h1',null,'\u2660 Texas Hold\'em \u2665'),
    h('p',{className:'sub'},'Heads-up \u00B7 Player vs Dealer'),
    h('button',{className:'lb-btn',onClick:props.onD},'I\'m the Dealer'),
    h('button',{className:'lb-btn sc',onClick:props.onP},'I\'m a Player')
  );
}

function DealerSetup(props){
  const{state}=props;
  if(state.phase!=='waiting')return null;
  return h('div',{className:'lby'},
    h('h1',{style:{fontSize:'clamp(18px,4vw,28px)',marginBottom:4}},'Room Created'),
    h('p',{className:'sub',style:{marginBottom:10}},'Share this code with the player:'),
    h('div',{className:'rcode'},state.roomCode||'------'),
    !state.roomCode?h('div',{className:'sp'}):null,
    state.error?h('p',{className:'err'},state.error):null,
    state.roomCode?h('div',{style:{display:'flex',alignItems:'center',gap:8,marginTop:8}},h('div',{className:'sp'}),h('span',{style:{fontSize:14,opacity:.6}},'Waiting for player...')):null
  );
}

function PlayerSetup(props){
  const{state,connectAsPlayer}=props;
  const[code,setCode]=useState('');
  const[name,setName]=useState('');
  const[joining,setJoining]=useState(false);
  const join=function(){
    if(!code.trim()||!name.trim())return;
    setJoining(true);
    connectAsPlayer(code.trim(),name.trim());
  };
  if(joining&&state.view!=='game'&&!state.error)
    return h('div',{className:'lby'},h('div',{className:'sp'}),h('p',{style:{marginTop:10,opacity:.7}},'Connecting...'));
  return h('div',{className:'lby'},
    h('h1',{style:{fontSize:'clamp(18px,4vw,28px)'}},'Join a Game'),
    h('p',{className:'sub',style:{marginBottom:16}},'Enter the room code from the dealer'),
    h('input',{className:'lb-inp',placeholder:'Room Code',value:code,
      onChange:function(e){setCode(e.target.value.toUpperCase())},
      style:{letterSpacing:4,marginBottom:10},maxLength:10}),
    h('input',{className:'lb-inp',placeholder:'Your Name',value:name,
      onChange:function(e){setName(e.target.value)},maxLength:20,style:{marginBottom:10}}),
    state.error?h('p',{className:'err'},state.error):null,
    h('button',{className:'lb-btn',style:{marginTop:4},onClick:join},'Join Game')
  );
}

// ----- APP -----
function App(){
  const[s,set]=useState(freshState());
  const sr=useRef(s);sr.current=s;
  const pr=useRef(null);const cr=useRef(null);

  const sendState=useCallback(function(x){
    try{if(cr.current&&cr.current.open)cr.current.send({type:'game_state',state:x})}catch(e){}
  },[]);

  const procAction=useCallback(function(a){
    const c=sr.current;
    if(a.type==='next_hand'){const n=newHand(c);n.view='game';n.role='dealer';n.playerName=c.playerName;set(n);sendState(n);return}
    const n=execAction(c,a);n.lastDealerAction=a;set(n);sendState(n);
    if(n.betting.roundOver&&!(n.playerFolded||n.dealerFolded)){
      const x=advanceStreet(n);
      if(x.phase==='showdown'){const y=showdown(x);set(y);sendState(y)}
      else{set(x);sendState(x)}
    }
    if(n.betting.roundOver&&(n.playerFolded||n.dealerFolded)){const x=showdown(n);set(x);sendState(x)}
  },[sendState]);

  const startDealer=useCallback(function tryRoom(){
    const g=freshState();g.view='dealer';g.role='dealer';set(g);
    try{pr.current&&pr.current.destroy()}catch(e){}
    const cs='ABCDEFGHJKLMNPQRTVWXYZ2346789';
    var id='';for(var i=6;i>0;i--)id+=cs[Math.random()*cs.length|0];
    const p=new Peer(id);pr.current=p;cr.current=null;
    p.on('open',function(rid){set(function(x){return Object.assign({},x,{roomCode:rid,error:''})})});
    p.on('connection',function(c){
      cr.current=c;
      c.on('data',function(d){
        if(d.type==='join'){
          const cu=sr.current,gs=newHand(cu);
          gs.view='game';gs.role='dealer';gs.playerName=d.name;
          set(gs);c.send({type:'game_state',state:gs});
        }else if(d.type==='player_action'&&d.action)procAction(d.action);
      });
      c.on('close',function(){cr.current=null});
    });
    p.on('error',function(e){
      if(e.type==='unavailable-id'){setTimeout(function(){tryRoom()},300)}
      else{set(function(x){return Object.assign({},x,{error:'Room creation failed.'})})}
    });
  },[procAction]);

  const initPlayer=useCallback(function(){set(freshState());set(function(x){return Object.assign({},x,{view:'player',role:'player'})})},[]);

  const connectAsPlayer=useCallback(function(code,name){
    set(function(x){return Object.assign({},x,{roomCode:code,playerName:name,error:''})});
    try{pr.current&&pr.current.destroy()}catch(e){}
    const p=new Peer();pr.current=p;cr.current=null;
    var connected=false;
    var to=setTimeout(function(){if(!connected)set(function(x){return Object.assign({},x,{error:'Connection timed out.'})})},15000);
    p.on('open',function(){
      if(p.destroyed)return;
      const c=p.connect(code,{reliable:true});
      c.on('open',function(){connected=true;clearTimeout(to);c.send({type:'join',name})});
      c.on('data',function(d){
        if(d.type==='game_state'){
          const x=Object.assign({},d.state,{view:'game',role:'player',playerName:name});
          set(x);cr.current=c;
        }
      });
      c.on('close',function(){cr.current=null});
    });
    p.on('error',function(e){
      if(e.type==='peer-unavailable')return;
      connected=true;clearTimeout(to);
      set(function(x){return Object.assign({},x,{error:'Connect failed: '+(e.message||e.type||'unknown')})});
    });
  },[]);

  // Dealer AI effect
  useEffect(function(){
    const c=sr.current;
    if(c.role!=='dealer'||c.view!=='game'||c.phase==='showdown'||c.phase==='hand-over')return;
    if(c.betting.actor!=='dealer'||c.betting.roundOver||c.dealerFolded||c.dealerThinking)return;
    set(function(x){return Object.assign({},x,{dealerThinking:true})});
    const ti=setTimeout(function(){
      const cu=sr.current;
      if(cu.betting.actor!=='dealer'||cu.betting.roundOver||cu.dealerFolded){set(function(x){return Object.assign({},x,{dealerThinking:false})});return;}
      const aa=dealerAI(cu),n=execAction(cu,aa);n.dealerThinking=false;n.lastDealerAction=aa;
      set(n);sendState(n);
      if(n.betting.roundOver&&(n.playerFolded||n.dealerFolded)){const x=showdown(n);set(x);sendState(x)}
      else if(n.betting.roundOver){
        const x=advanceStreet(n);
        if(x.phase==='showdown'){const y=showdown(x);set(y);sendState(y)}
        else{set(x);sendState(x)}
      }
    },1200+Math.random()*800);
    return function(){clearTimeout(ti)};
  },[s.role,s.view,s.phase,s.betting&&s.betting.actor,s.betting&&s.betting.roundOver,s.dealerFolded,s.dealerThinking]);

  // Player listener effect
  useEffect(function(){
    if(sr.current.role!=='player'||!cr.current)return;
    const c=cr.current;
    const h=function(d){
      if(d.type==='game_state'){
        const x=Object.assign({},d.state,{view:'game',role:'player',playerName:sr.current.playerName});
        set(x);
      }
    };
    try{c.on('data',h)}catch(e){}
    return function(){try{c.off&&c.off('data',h)}catch(e){}};
  },[s.role,s.view]);

  // Cleanup on unmount
  useEffect(function(){return function(){try{pr.current&&pr.current.destroy()}catch(e){}}},[]);

  const sendAction=useCallback(function(a){
    const c=sr.current;
    if(c.role==='player'&&cr.current){try{cr.current.send({type:'player_action',action:a})}catch(e){}return}
    if(c.role==='dealer')procAction(a);
  },[procAction]);

  const reset=useCallback(function(){
    try{pr.current&&pr.current.destroy()}catch(e){}
    pr.current=null;cr.current=null;set(freshState());
  },[]);

  if(s.view==='game')return h(GameView,{state:s,sendAction:sendAction,role:s.role,playerName:s.playerName||'You'});
  if(s.view==='dealer')
    return h('div',{style:{width:'100%'}},
      h('div',{className:'t',style:{padding:'24px'}},h(DealerSetup,{state:s})),
      h('div',{style:{textAlign:'center',marginTop:12}},h('button',{className:'lb-btn sc',style:{fontSize:14,padding:'10px 20px',maxWidth:200},onClick:reset},'\u2190 Back'))
    );
  if(s.view==='player')
    return h('div',{style:{width:'100%'}},
      h('div',{className:'t',style:{padding:'24px'}},h(PlayerSetup,{state:s,connectAsPlayer:connectAsPlayer})),
      h('div',{style:{textAlign:'center',marginTop:12}},h('button',{className:'lb-btn sc',style:{fontSize:14,padding:'10px 20px',maxWidth:200},onClick:reset},'\u2190 Back'))
    );
  return h(HomePage,{onD:startDealer,onP:initPlayer});
}

ReactDOM.render(h(App),document.getElementById('root'));
})();
