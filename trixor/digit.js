function Digits(parent,x,y,width,height,gap,thickness,space,str) {
	this.digits=[];
	for(var pos=x,x=0;x<str.length;x++) {
		if(str[x]===" "||str[x]===":") {
			if(str[x]==":") {
				makeElement(parent,"circle",{"cx":pos+thickness/2,"cy":y+height/4,"r":thickness/2});
				makeElement(parent,"circle",{"cx":pos+thickness/2,"cy":y+3*height/4,"r":thickness/2});
			}
			pos+=space+thickness;
		} else {
			this.digits.push(new Digit(parent,pos,y,width,height,gap,thickness,str[x]));
			pos+=space+width;
	}	}
	this.set=function(str) { for(var pos=0,x=0;x<str.length;x++) if(str[x]!==" " && str[x]!==":") this.digits[pos++].set(str[x]); };
}

function milliTime() { var t=new Date(); return (t.getHours()*3600+t.getMinutes()*60+t.getSeconds()+t.getMilliseconds()/1000); }

function Digit(parent,x,y,width,height,gap,thickness) {
	var topGap=0.70710678118655*gap,midGapT=0.89442719099992*gap,midGapM=0.44721359549996*gap;
	
	this.segments=new Array(7);
	this.segments[0]=makeElement(parent,"path",{"d":"M"+(x+topGap)+" "+y+" "+(x+width-topGap)+" "+y+" "
		+(x+width-topGap-thickness)+" "+(y+thickness)+" "+(x+topGap+thickness)+" "+(y+thickness)+"z"});
	this.segments[1]=makeElement(parent,"path",{"d":"M"+x+" "+(y+topGap)+" "+x+" "+(y+height/2-topGap)+" "
		+(x+thickness)+" "+(y+height/2-midGapM-thickness/2)+" "+(x+thickness)+" "+(y+thickness+topGap)+"z"});
	this.segments[2]=makeElement(parent,"path",{"d":"M"+(x+width)+" "+(y+topGap)+" "+(x+width)+" "+(y+height/2-topGap)+" "
		+(x+width-thickness)+" "+(y+height/2-midGapM-thickness/2)+" "+(x+width-thickness)+" "+(y+thickness+topGap)+"z"});
	this.segments[3]=makeElement(parent,"path",{"d":"M"+(x+midGapM)+" "+(y+height/2)+" "+(x+thickness+midGapT)+" "+(y+height/2-thickness/2)+" "
		+(x+width-thickness-midGapT)+" "+(y+(height-thickness)/2)+" "+(x+width-midGapM)+" "+(y+height/2)+" "+(x+width-thickness-midGapT)+" "+(y+(height+thickness)/2)
		+" "+(x+thickness+midGapT)+" "+(y+(height+thickness)/2)+"z"});
	this.segments[4]=makeElement(parent,"path",{"d":"M"+x+" "+(y-topGap+height)+" "+x+" "+(y+height/2+topGap)+" "
		+(x+thickness)+" "+(y+height/2+midGapM+thickness/2)+" "+(x+thickness)+" "+(y+height-thickness-topGap)+"z"});
	this.segments[5]=makeElement(parent,"path",{"d":"M"+(x+width)+" "+(y-topGap+height)+" "+(x+width)+" "+(y+height/2+topGap)+" "
		+(x+width-thickness)+" "+(y+height/2+midGapM+thickness/2)+" "+(x+width-thickness)+" "+(y+height-thickness-topGap)+"z"});
	this.segments[6]=makeElement(parent,"path",{"d":"M"+(x+topGap)+" "+(y+height)+" "+(x+width-topGap)+" "+(y+height)+" "
		+(x+width-topGap-thickness)+" "+(y+height-thickness)+" "+(x+topGap+thickness)+" "+(y+height-thickness)+"z"});	
	this.set=function(value) {
		if(value!=this.value) {
			var newSegCol;
			switch(value) {
				case 0: newSegCol=[1,1,1,0,1,1,1]; break;
				case 1: newSegCol=[0,0,1,0,0,1,0]; break;
				case 2: newSegCol=[1,0,1,1,1,0,1]; break;
				case 3: newSegCol=[1,0,1,1,0,1,1]; break;
				case 4: newSegCol=[0,1,1,1,0,1,0]; break;
				case 5: newSegCol=[1,1,0,1,0,1,1]; break;
				case 6: newSegCol=[1,1,0,1,1,1,1]; break;
				case 7: newSegCol=[1,0,1,0,0,1,0]; break;
				case 8: newSegCol=[1,1,1,1,1,1,1]; break;
				case 9: newSegCol=[1,1,1,1,0,1,1]; break;
				case 10: newSegCol=[1,1,1,1,1,1,0]; break;
				case 11: newSegCol=[0,1,0,1,1,1,1]; break;
				case 12: newSegCol=[1,1,0,0,1,0,1]; break;
				case 13: newSegCol=[0,0,1,1,1,1,1]; break;
				case 14: newSegCol=[1,1,0,1,1,0,1]; break;
				case 15: newSegCol=[1,1,0,1,1,0,0]; break;
				default: newSegCol=[0,0,0,0,0,0,0];
			}
			for(var x=0;x<7;x++) if(this.segCol[x]!=newSegCol[x]) this.segments[x].setAttribute("fill-opacity",newSegCol[x]==1?1:0.1);
			this.value=value;
			this.segCol=newSegCol;
	}	}
	this.segCol=[1,1,1,1,1,1,1,1];
}

function makeElement(parent,type,attr) { 
	var svg=document.createElementNS("http://www.w3.org/2000/svg",type); 
	for(i in attr) svg.setAttributeNS(null,i,attr[i]);
	parent.appendChild(svg);
	return svg;
}
