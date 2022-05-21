function reset() { 
	//for(var x=0;x<clicked;x++) order[72].svg.deselect();
	//for(var x=0;x<9;x++) SVGCards[x].set(order[80-x].val);
	Score.reset();
	Timer.reset();
}

var Cards = function() {
	var valueToPos=[], // Card Value To Position Lookup
		posToCard=[], // Card Position To Card
		drawn=0, // Cards drawn from deck
		tabled=0, // Drawn cards that have been used (passed criteria)
		variations; // Array to prevent too many similar cards
	
	var Card = function(value) { // Single Card Class
		this.value = value;
		this.info = [(value-value%27)/27,(value%27-value%9)/9,(value%9-value%3)/3,value%3];
		this.complete = function(otherCard) { // Returns card needed to make set with this and otherCard 
			var a=[]; for(var x=0;x<4;x++) a[x]=(6-otherCard.info[x]-this.info[x])%3; return posToCard[valueToPos[a[0]*27+a[1]*9+a[2]*3+a[3]]]; }
	}
	
	for(var x=0;x<81;x++) { // Create Deck
		valueToPos[x]=x;
		posToCard[x]=new Card(x)
	}
	
	var draw = function() { do { swap(Math.floor(Math.random()*(81-drawn)),80-drawn); c=posToCard[80-(drawn++)]; } while(variation(c) || completes(c)); add(c); }
	var add = function(card) { for(var y=0;y<4;y++) variations[card.info[y]+3*y]++; swap(valueToPos[card.value],80-(tabled++)); }
	var del = function(card) { for(var y=0;y<4;y++) variations[card.info[y]+3*y]--; swap(valueToPos[card.value],80-(--tabled)); }
	var swap = function(a,b) { var temp=posToCard[a]; posToCard[a]=posToCard[b]; posToCard[b]=temp; valueToPos[posToCard[a].value]=a; valueToPos[posToCard[b].value]=b; }
	var completes = function(card) { var c=0; for(var x=0;x<drawn;x++) for(var y=x+1;y<drawn;y++) if(card.complete(posToCard[80-x])==posToCard[80-y]) c++; return c; }
	var variation = function(card) { for(var y=0;y<4;y++) if(variations[card.info[y]+3*y]>3) return true; return false; }
	var reset = function() {
		drawn=tabled=0; variations=[0,0,0,0,0,0,0,0,0,0,0,0];
		draw(); draw(); add(posToCard[80].complete(posToCard[79])); drawn++; while(tabled<9) draw();
		for(var x=2;x>-1;x--) swap(80-Math.floor(Math.random()*9),80-x);
	}
	return {
		reset : reset,
		getInfo : function(c) { return posToCard[c].info; }
	}
}();


var digits=makeElement(document.getElementById("top"),"g",{"fill":"#f00"});

var Timer = function(SVGparent,finFn) {
	var initTime = 240, 
	maxBonusTime = 20;
	
	// Clock Logo
	makeElement(document.getElementById("top"),"circle",{"cx":"26.25","cy":"356.25","r":"24.75","stroke":"#f00","stroke-width":"3","fill":"none"});
	makeElement(document.getElementById("top"),"path",{"d":"M26.25 343.25l0 13 13 0","stroke":"#f00","stroke-width":"3","fill":"none"});

	var svg = new Digits(SVGparent,52.5+7.5,330,30,52.5,1.5,7.5,7.5,"0000");
	var draw = function(t) { var a=[]; for(var x=0;x<4;x++) a.push(Math.floor(t%Math.pow(10,4-x)/Math.pow(10,3-x))); svg.set(a); }
	
	var lastTime = timeStart = false;
	var reset = function() { draw(0); lastTime=false; bonus=0; }
	var update = function() {
		if(lastTime) {
			var timeLeft=Math.max(0,initTime-Math.floor(milliTime()-timeStart));
			if(timeLeft==0) { reset(); endFn(); }
			else setTimeout(update, 1010-((milliTime()-timeStart)*1000)%1000);
		}
		draw(timeLeft);
	}
	return { 
		reset:reset,
		userFoundSet : function() { // Returns Time since last set found
			var then = lastTime; // Copy lastTime
			lastTime = milliTime(); // Update lastTime
			if(then) timeStart += Math.max(0,Math.floor(maxBonusTime-lastTime+then));
			else timeStart = lastTime;
			update();
			return then ? lastTime-then : false
		}
	}
}(digits);

var Score = function(SVGparent) { 
	var maxScoreBonus = 30;
	var svg = new Digits(SVGparent,425,330,30,52.5,1.5,7.5,7.5,"00000");
	var score = 0;
	var display = function() { var a=[]; for(var x=0;x<5;x++) a.push(Math.floor(score%Math.pow(10,5-x)/Math.pow(10,4-x))); svg.set(a); }
	return {
		userFoundSet : function(timeSinceLastSet) {
			score+= timeSinceLastSet ? Math.min(1,maxScoreBonus-timeSinceLastTime) : 1;
			display();
		},
		reset : function() { score=0; display(); }
	}
}(digits);

makeElement(digits,"path",{"d":"M762 330l23.5 0 14.5 14.5 0 23.5 -14.5 14.5 -23.5 0 -14.5 -14.5 0 -23.5z"}).onclick=reset(); // Reset Button

// alert("Game Over\nScore: "+score);
var SVGCards = function(setfn) { // References Cards class
	var cHeight=100, cGap=10, thickness=7, gap=5, width=cHeight-5*gap-thickness, cWidth=(width+thickness)*3+7*gap; // Card dimensions
	//var svgCards = [];
	for(var x=0;x<9;x++) new SVGCard(x,Cards.getInfo(x)); //svgCards.push(new SVGCard(x));
	
	var clickedCards = [];
	var click = function(svgCard) {
		if(svgCard == clickedCards[0] || svgCard == clickedCards[1]) { // If clicked, unclick
			if(svgCard == clickedCards[0]) clickedCards[0] = clickedCards[1];
			clickedCards.pop();
			svgCard.deselect();
		} else { // If not clicked, check and click
			if(clickedCards.length==2) {
				
			} else { clickedCards.push(svgCard); svgCard.select(); }
	}	}
	
	function SVGCard(position,info) {
		var shapes=[];
		var g = makeElement(document.getElementById("top"),"g",{});
		var xp = position%3 * (gap+cWidth), yp = Math.floor(position/3) * (gap+cHeight);
		var background = makeElement(g,"rect",{"x":xp,"y":yp,"width":cWidth,"height":cHeight,"rx":20,"ry":20,"fill":"#e0e0e0"});
		this.select = function() { background.setAttributeNS(null,"fill","#bbf"); }
		this.deselect = function() { background.setAttributeNS(null,"fill","#e0e0e0"); }
		makeElement(g,"rect",{"x":xp+gap,"y":yp+gap,"width":cWidth-gap*2,"height":cHeight-gap*2,"rx":20-gap,"ry":20-gap,"stroke":"#000","stroke-width":"2","fill":"none"});
		
		this.set=function(info) {
			var a; while(a=shapes.pop()) g.removeChild(a);
			var col=(["#f00","#0f0","#00f"])[info[2]];
			var w=width, x=xp+gap*2.5+thickness/2+(2-info[0])*(w+gap+thickness)/2, y=yp+gap*2.5+thickness/2;
			var pattern = info[3]==1 ? col : col.replace(info[3]==2 ? "f" : "0","8");
			for(var c=0;c<(info[0]+1);c++) {
				switch(info[1]) {
					case 0: shapes.push(makeElement(g,"circle",{"cx":x+w/2,"cy":y+w/2,"r":w/2,"stroke":col,"stroke-width":thickness,"fill":pattern})); break;
					case 1: shapes.push(makeElement(g,"rect",{"x":x,"y":y,"width":w,"height":w,"fill":pattern,"stroke":col,"stroke-width":thickness,"rx":0,"ry":0})); break;
					case 2: 
						var t=thickness/2;	
						shapes.push(makeElement(g,"path",{"d":"M"+(x+w/2)+" "+(y+t)+"L"+(x+w-t)+" "+(y+w)+"L"+(x+t)+" "+(y+w)+"z","fill":pattern,"stroke":col,"stroke-width":thickness})); 
						break;
				}
				x+=w+gap+thickness;
			}
		}
		this.set(info);
		g.onclick = function() { click(this); }
	}
}();

reset();
Timer.userFoundSet();