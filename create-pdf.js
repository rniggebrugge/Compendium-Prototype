///// PDF PART====
function generate_pdf(){
	var doc = new jsPDF, doc_y = 20, doc_dy = 6, tabStart = 0;
	doc.setFontSize(12);
	coverpage(json_form.coverpage);
	doc.addPage();
	read_route(json_form.route);
	
	doc.save("test.pdf");
	
	function coverpage(page){ 
		var i, j, item, x, y, dy, lines, text, js = json_label;
		for (i in page){
			item=page[i];
			if(item.text){
				x = parseInt(item.x);
				y = parseInt(item.y);
				dy = item.dy?parseInt(item.dy):8;
				text = js[item.text]?js[item.text][target_language]||js[item.text]["en"]:item.text;
				lines = process_block(text, x);
				doc.setFont("Times","Roman");
				if (item.style && item.style=="bold") doc.setFont("Times","Bold");
				for(j in lines) {
					doc.text(x,y, lines[j]);
					y+=dy;
				}
			}
		}
	}
	
	function setColor(c){
		if(!c) c=[0,0,0];
		doc.setTextColor(c[0],c[1],c[2]);
	}

	function draw_box(){
		var x,y, h, w;
		if(!tabStart || tabStart==0) return;
		else if(doc_y<tabStart) doc.text(4,6,"SOMETHING WRONG WITH TABS!!!");
		else
		{
			x = 5;
			y = tabStart-10;
			w = 200;
			h = doc_y-tabStart+10;
			doc.setDrawColor(100,100,100);
			doc.rect(x,y,w,h);
		}
	}

	function pageTurn(){
		if(tabStart){
			doc_y+=10;
			draw_box();
			tabStart=20;
		}
		doc.addPage();
		doc_y=20;
	}
	function print_lines(lines,x){
		var i;
		if(!x) x=10;
		for(i in lines){
			doc.text(x,doc_y,lines[i]);
			doc_y+=doc_dy;
			if (doc_y>270) pageTurn(); 
		}
	}
	function getLabel(item){
		var lan = target_language, js=json_label ,label, ref = item.lookup||item.name||item.value||"";
		if	(ref) label=js[ref]?js[ref][lan]||js[ref]["en"]+"*":"";
		if (!label) label=item.label||"";
		label = label.trim();
		if(item.type!="info" && label.split(":").pop()) label+=":";
		return label;
	}

	function read_route(route, lvl, name_addition){
		if(!name_addition)name_addition="";
		if(!lvl)lvl=0;
		var item, form = $("#quiz").get()[0], lines, mem , val, indent, p, opt, tick, checked,w,h, label, tab = 10*lvl;
		for (i in route) if(!route[i].skip || route[i].skip!="pdf"){
			item = route[i];
			switch (item.type){
				case "tab":
					if (doc_y>255)pageTurn();
					tabStart = doc_y;	
					doc_y-=5;
					lines = process_block(getLabel(item));
					setColor([0,90,180]);
					print_lines(lines,7);
					setColor();
					break;
				case "tabend":
				    draw_box();
				    doc_y+=15;
				    tabStart = 0;
				    if (doc_y>270){
						pageTurn();
						}
					break;
				case "pagebreak":
					pageTurn();
					break;
				case "spacer":
					lines = process_block(getLabel(item));
					if(item.break)print_lines(lines);
					else doc.text(10,doc_y,lines[0]);
					p = parseInt(item.rows);
					if(!p) p = 1;
					h = p * 6;
					w = item.break?180:80;
					indent = item.break?10:90;
					if ((doc_y+h)>270) pageTurn();
					doc.setFillColor(234,255,200);
					doc.rect(indent,doc_y-2,w,h, 'F'); 
					doc_y+=h+4;
					break;
				case "multiple":
					lines = process_block(getLabel(item) , 10+tab);
					print_lines(lines , 10+tab);
					p = $("button[group='"+item.name+"']").attr("counter");
					for (val = 0 ; val<p ; val++){
						read_route(item.route, lvl+1, val?"_mlt_"+val:"");
					}
					break;
				case "info":
					lines = process_block(getLabel(item) , 10+tab);
					print_lines(lines , 10+tab);
					break;
				case "choose":
					switch (item.style){
						case "select":
							val = form[item.name+name_addition].value;
							lines = process_block(getLabel(item), 10+tab);
							if (item.break){
								print_lines(lines, 10+tab);
								lines = process_block(val, tab+20);
								setColor([0,0,100]);
								print_lines(lines, 20+tab);
								setColor();
							}
							else {
								doc.text(10,doc_y,lines[0]);
								setColor([0,0,100]);
								lines = process_block(val, 90);
								print_lines(lines, 90);
								setColor();
							}
							break;
						case "checkbox":
						case "radio":
							label = getLabel(item);
							lines = process_block(label,10+tab);
							if(!label)item.break=1;
							if (item.break){
								print_lines(lines,10+tab);
								indent = 15+tab;
							}
							else {
								doc.text(10,doc_y,lines[0]);
								indent = 90+tab;
							}
							lines = [];
							for(p in item.options){
								opt= item.options[p];
								if (item.style=="checkbox") checked = $("[sr_call='"+item.name+name_addition+"."+opt.value+"']").prop("checked");
								else  checked = $("[name='"+item.name+name_addition+"'][value='"+opt.value+"']").prop("checked");
								
								tick = checked?"[X]":"[   ]";
								label = getLabel(opt);
								var regex = /___[0-9a-zA-Z_]+___/g;
								var myArray = regex.exec(label);
								if(myArray && myArray.length) {
									mem = myArray[0].replace(/___/g,"");
									mem = $("[name='"+mem+"']");
									if (mem.length) {
										mem = mem.val();
										label = label.replace(regex,mem);									}
								}
								lines = process_block(label, indent+7);
								if (checked) setColor([0,0,100]); else setColor([90,90,90]);
								doc.text(indent,doc_y, tick);
								print_lines(lines,indent+7);
								setColor();
								if(opt.route && (checked || opt.route_visible)) read_route(opt.route, lvl+1);
							}
							break;
					}
					break;
				case "number":
				case "date":
				case "text":
					val = form[item.name+name_addition].value;
					lines = process_block(getLabel(item), 10+tab);
					if (item.break){
						print_lines(lines, 10 +tab);
						lines = process_block(val, 20+tab);
						setColor([0,0,100]);
						print_lines(lines, 20+tab);
						setColor();
					}
					else {
						doc.text(10+tab,doc_y,lines[0]);
						setColor([0,0,100]);
						lines = process_block(val, 90);
						print_lines(lines, 90);
						setColor();
					}
					break;
				} // MAIN SWITCH [item.type] //
			
		}	
		
	}	
	function process_line(txt, x){
		if(!x) x=10;
		var div = $("<div>"), arr = [], old_span, span = $("<span>"), words = txt.split(" "), i, offset;
		offset = Math.floor((x-10)/200*625); if(offset<0) offset = 0;;
		div.css({visibility:"none", width:"2000px"});
		span.css({fontFamily:"Times New Roman",fontSize:"12pt"});
		div.append(span);
		$("body").append(div);
		for(i in words){
			old_span = span.text();
			span.append(words[i]+" ");
			if (span.width()>(625-offset)){
				arr.push(old_span);
				span.text(words[i]+" ");
			}
		}
		arr.push(span.text());
		span.remove();
		div.remove();
		return arr;
	}
	
	function process_block(txt, x){
		txt = txt.replace(/<br>/g,"");
		var arr=[], lines = txt.split("\n"), i;
		for (i in lines) arr=arr.concat(process_line(lines[i],x));		
		return arr;
	}
}
///// HTML PART====================================================================================================
function generate_html(){
	var doc = $("<body>"), active_tab = null;
	coverpage(json_form.coverpage);
	doc.append($("<div class='screen-only'>").css({height: $(window).height()  }));
	add_page_break();
	doc.append($("<div class='screen-only'>").css({height:"20px"}));
	read_route(json_form.route);
	
	var w = window.open("","","left=10,top=10, width=1000, height=600, resizable, scrollbars");
	w.document.open();
	w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8" ><link rel="stylesheet" href="html-form-css.css" />');
	w.document.write('<link rel="stylesheet" href="html-form-printer.css" media="print" /></head><body>');
	w.document.write(doc.html());
	w.document.write('</body></html>');
	w.document.close();
	
	function coverpage(page){ 
		var i, item, x, y, div, text, js = json_label;
		for (i in page){
			item=page[i];
			if(item.text){
				x = parseInt(item.x);
				y = parseInt(item.y);
				x= Math.round(item.x/220*100)+"%";
				y= Math.round(item.y/290*100)+"%";
				div=$("<div>").css({position:"absolute", left:x, top:y});
				text = js[item.text]?js[item.text][target_language]||js[item.text]["en"]:item.text;
				div.text(text);
				if (item.style && item.style=="bold") div.css({fontWeight:"bold"});
				doc.append(div);
			}
		}
	}
	
	function add_page_break(){
		doc.append("<p class='pagebreak'>  <<-- Pagebreak for printer -->></p>");	
	}
	function setColor(c){
		if(!c) c=[0,0,0];
		doc.setTextColor(c[0],c[1],c[2]);
	}


	function pageTurn(){
		//
	}

	function getLabel(item){
		var lan = target_language, js=json_label ,label, ref = item.lookup||item.name||item.value||"";
		if	(ref) label=js[ref]?js[ref][lan]||js[ref]["en"]+"*":"";
		if (!label) label=item.label||"";
		label = label.trim();
		if(item.type!="info" && label.split(":").pop()) label+=":";
		return label;
	}

	function read_route(route, lvl, name_addition){
		if(!name_addition)name_addition="";
		if(!lvl)lvl=0;
		var br, item, form = $("#quiz").get()[0], div, mem , val, indent, p, opt, tick, checked,w,h, label, tab = 10*lvl;
		
		for (i in route) if(!route[i].skip || route[i].skip!="pdf"){
			item = route[i];
			br=item.break||0;
			switch (item.type){
				case "tab":
					label = getLabel(item);
					div = $("<div class='tab-header'>"+label+"</div>");
					doc.append(div);
					active_tab = $("<div class=tab></div>");
					break;
				case "tabend":
					active_tab.append($("<br clear=all>"));
					doc.append(active_tab);
					active_tab = null;
					break;
				case "pagebreak":
					add_page_break();
					break;
				case "spacer":
					label = getLabel(item);
					div = $("<div class='label'>"+label+"</div>");
					if (!br) div.addClass("label-narrow");
					active_tab?active_tab.append(div):doc.append(div);
					p = parseInt(item.rows);
					if(!p) p = 1;
					h = p * 22;
					div = $("<div class='spacer'>").css({height:h});
					if (!br) div.addClass("spacer-narrow");
					active_tab?active_tab.append(div):doc.append(div);
					break;
				case "multiple":
					label = getLabel(item);
					div = $("<div class=label>"+label+"</div>").css({marginLeft:"20px"});
					active_tab?active_tab.append(div):doc.append(div);
					p = $("button[group='"+item.name+"']").attr("counter");
					for (val = 0 ; val<p ; val++){
						read_route(item.route, lvl+1, val?"_mlt_"+val:"");
					}
					break;
				case "info":
					label = getLabel(item);
					div = $("<div class=info>"+label+"</div>");
					active_tab?active_tab.append(div):doc.append(div);
					break;
				case "choose":
					switch (item.style){
						case "select":
							val = form[item.name+name_addition].value;
							label = getLabel(item);
							div = $("<div class=label>"+label+"</div>");
							if(!br) div.addClass("label-narrow");
							active_tab?active_tab.append(div):doc.append(div);
							div = $("<div class=value>"+val+"</div>");
							if(!br) div.addClass("value-narrow");
							active_tab?active_tab.append(div):doc.append(div);
							break;
						case "checkbox":
						case "radio":
							label = getLabel(item);
							div = $("<div>"+label+"</div>");
							if(!br) div.addClass("label-narrow");
							active_tab?active_tab.append(div):doc.append(div);
							lines = [];
							for(p in item.options){
								opt= item.options[p];
								if (item.style=="checkbox") checked = $("[sr_call='"+item.name+name_addition+"."+opt.value+"']").prop("checked");
								else  checked = $("[name='"+item.name+name_addition+"'][value='"+opt.value+"']").prop("checked");
								
								tick = checked?"[X]":"[   ]";
								label = tick + getLabel(opt) + "<br>";
								var regex = /___[0-9a-zA-Z_]+___/g;
								var myArray = regex.exec(label);
								if(myArray && myArray.length) {
									mem = myArray[0].replace(/___/g,"");
									mem = $("[name='"+mem+"']");
									if (mem.length) {
										mem = mem.val();
										label = label.replace(regex,mem);									}
								}
								div = $("<div class=value>"+label+"</div>");
								if(!br) div.addClass("value-narrow");
								div.css({color:checked?"#06c":"#999"});
								active_tab?active_tab.append(div):doc.append(div);
								if(opt.route && (checked || opt.route_visible)) read_route(opt.route, lvl+1);
							}
							break;
					}
					break;
				case "number":
				case "date":
				case "text":
					val = form[item.name+name_addition].value.replace(/\n/g,"<br>");
					label = getLabel(item);
					div = $("<div class=label>"+label+"</div>");
					if(!br) div.addClass("label-narrow");
					active_tab?active_tab.append(div):doc.append(div);
					div = $("<div class=value>"+val+"</div>");
					if(!br) div.addClass("value-narrow");
					active_tab?active_tab.append(div):doc.append(div);
					break;
				} // MAIN SWITCH [item.type] //
			
		}	
		
	}	
}
