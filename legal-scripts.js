// JavaScript Document


/* TO DO
- multiple fields: allow for subroutes? -> getting complicated....Not needed
*/
var view_mode = "long", instrument = "", current_form, json_form, json_label, del = "^^", translation_fields = [],
	source_language = "en", target_language = "en", adjusted = false, saveNeeded = false, tabOffset=120,
	current_name, checkNameExists = true, file_contents = "",
	available_forms = [ 	{i:"eaw",t:"European Arrest Warrant (EAW)"}  ,
				{i:"mla",t:"Rogatory Letter (MLA)"},
				{i:"confiscation-order",t:"Confiscation Order"}],
	languages = [ 	{s:"en",l:"english"} , {s:"nl", l:"dutch"} , { s:"ro",l:"romanian"}, {s:"fr",l:"french"},
					{s:"fi",l:"finnish"}, {s:"dk",l:"danish"},{s:"el",l:"greek"}, {s:"pt",l:"portuguese"},
					{s:"ee",l:"estonian"}, {s:"lv",l:"latvian"}, {s:"mt",l:"maltese"} , {s:"sv",l:"swedish"},
					{s:"hu",l:"hungarian"},{s:"de",l:"german"},{s:"pl",l:"polish"}, {s:"hr",l:"croatian"},
					{s:"it",l:"italian"},{s:"si",l:"slovenian"},{s:"es",l:"spanish"}, {s:"sk",l:"slovak"},
					{s:"cs",l:"czech"}, {s:"bg",l:"bulgarian"},{s:"lt",l:"lithuanian"}, {s:"ga",l:"gaelic/irish"}];

languages.sort(function(a,b){ if(a.l>b.l) return 1; if (a.l<b.l) return -1; return 0;});




$(function(){
$.getScript("create-pdf.js", function(){;

	function supports_localStorage(){
		try {
			return 'localStorage' in window && window['localStorage'] !== null;
		} catch(e){
			return false;
		}
	}
	
	
	if (!supports_localStorage()) { alert("Some important features are not working in your browser. Please use a proper browser, Firefox, Chrome, Safari, Opera will do."); }

	function opening_screen(){
		$("#control_panel, #menu").hide();
		var i, select, option, btn, tab = $("<div class=tab>Please select instrument: </tab>");
		$("#quiz").html("");
		select=$("<select id='instrument_choice'></select>");
		for(i in available_forms) {
			option = $("<option value='"+available_forms[i].i+"'>"+available_forms[i].t+"</option>");
			select.append(option);
		}
		btn = $("<button type='button'>select</button>");
		btn.click(function(){load_instrument($("#instrument_choice").val()); });
		$("#quiz").append("<br><br>",tab.append(select, btn));
		
	}	
	function load_instrument(selected_form){
		var str   = selected_form.replace(/.data/,"");
		var regex = /[^a-z\-]/g;
		var cch = "?nocache="+(new Date()).getTime()
		str = str.replace(regex, "");
		current_form=str;
		$.get("/legal-forms/"+str+".form"+cch,function(data){
			data =  $.parseJSON(data);
			document.title= data.instrument+"/v:"+data.version+"/a:"+data.author;
			instrument = data.instrument;
			json_form = data;
			$.get("/legal-forms/"+str+".label"+cch, function(data){
				json_label=$.parseJSON(data);
				draw_form();
			});
		});
	}

	function apply_labels(){
		$("[lookup]").each(function(){
			var ref = $(this).attr("lookup");
			var label = json_label[ref]?json_label[ref][source_language]||json_label[ref]["en"]+"*":"";
			if(label) {
				var regex = /___([0-9a-zA-Z_]+)___/g;
				label = label.replace(regex, "_____");
				$(this).html(label);			
				}
		});	
	}

	function draw_form(){ 
		if(!json_form) { opening_screen(); return; }		
		saveNeeded=false;
		$("#control_panel, #menu").show();
		$("#quiz").html("");
		$("#quiz").append(make_route(json_form.route, true )); 
		$("input.calendar").css({width:120}).datepicker({dateFormat:"dd/mm/yy",changeMonth: true,changeYear:true});
		$("input.number").change(function(){
			var n = parseInt($(this).val());
			if (isNaN(n)) n=0;
			$(this).val(n);
			});
		complete_labels();
		$("html,body").scrollTop(0);
		$("#quiz select, #quiz input, #quiz textarea").unbind("change").change(function(){ saveNeeded=true;});
		$("[translation]").css({border:"1px solid #090", background:"#dfd", color:"#030"});
		adjust_css_to_fit();
		apply_labels();
		create_menu();
		check_validity();
		update_status();
	}
	function complete_labels(){
	      $("label").unbind("hover")
		.hover(function(){ $(this).css({background:"#efd"});}, function(){ $(this).css({background:""});})
		.unbind("click")
		.click(function(){ $(this).prev().trigger("click");});
	}

	function check_validity(){
		var form_fields = $("#quiz [name]").not("input:radio"), fields = [], i, err = "";
		form_fields.each(function(){
			var name = $(this).attr("name").toUpperCase();
			if(!fields[name]) fields[name]=0;
			fields[name]++;
		});
		for(i in fields) if(fields[i]>1) err+="duplicate fieldname:  "+i+" ("+fields[i]+")\n";
		if (err!="") alert(err);
	}  
	function show_sub_route_checkbox(){
		var i,sr_call = $(this).attr("sr_call").split(","), span=$() ,show = $(this).prop("checked");
		for (i in sr_call) span = span.add($("[sr='"+sr_call[i]+"']")) ;
		if(show){
			if (span.hasClass("grey")) span.removeClass("grey").addClass("grey_in");
			else span.show();	
		} else{
			if (span.hasClass("grey_in")) span.removeClass("grey_in").addClass("grey");
			else span.hide();
		}
		create_menu();
	}
	function show_sub_route(){
		var isSelect = $(this).prop("tagName").toLowerCase()=='select';
		var i,sr_call = isSelect?$(this).find(":selected").attr("sr_call").split(","):$(this).attr("sr_call").split(",")
			, span=$() , name = $(this).attr("name");
		for (i in sr_call) span = span.add($("[sr='"+sr_call[i]+"']")) ;
		$("[from="+name+"]").each(function(){
			if ($(this).hasClass("grey_in")) $(this).removeClass("grey_in").addClass("grey");
			else $(this).hide();
		});
		span.each(function(){
			if ($(this).hasClass("grey")) $(this).removeClass("grey").addClass("grey_in");
			else $(this).show();	
		})
		create_menu();
	}
	
	function add_label(item, breaks){
		var label = item.label||"", breaks=breaks||item.break;
		var rows= parseInt(breaks), bl= $("<span>");
		var lookup = item.lookup||item.name||"";
		if (rows){
			bl.append("<span class=label lookup='"+lookup+"'>"+label+"</span>");
			for(i=0;i<rows;i++) bl.append("<br clear=all>");
		}
		else {
			bl.append("<span class=label_short lookup='"+lookup+"'>"+label+"</span>");
		      }
		return bl;
	}
	function add_text_input(item){
		var required = item.required==1,
			name = item.name,
			label = item.label, block;
		if(item.translations) translation_fields[name]=item;
		if (!name || name == "undefined") alert("Problem with this: "+item.label+" ,  "+item.style);
		block = $("<div class='block'></div>");
		block.append(add_label(item));
		rows = item.rows? parseInt(item.rows) : 0;
		if (rows>1)
			block.append($("<textarea name='"+name+"' rows="+rows+" "+(item.translations?"translation":"")+"></textarea>"));
		else block.append($("<input type=text name='"+name+"' "+(item.break?"class=free":"")+" "+(item.translations?"translation":"")+">"));
		return block;
	}

	function add_radio_check(item, CB){
		if(!CB) CB = false;
		var opts = item.options, label=item.label, name=item.name,  val;	
		var block, subroutes = [], route_span, i, radio, check, lookup;
		if (!name || name == "undefined") alert("Problem with this: "+item.label+" ,  "+item.style);
		block = $("<div class='block'></div>");
		block.append(add_label(item));
		for(i in opts) {
			val = opts[i].value, label = opts[i].label||"";
			var regex = /___([0-9a-zA-Z_]+)___/g;
			label = label.replace(regex, "_____");
			if (!val) val = label;
			if (!label) label = val;
			if (!val) return block;
			lookup = opts[i].lookup||val||"";
			if (CB) {
				check = $("<input type=checkbox name='"+name+"__"+val+"' sr_call='"+name+"."+val+"'><label lookup='"+lookup+"'>"+label+"</label>"); 
				check.click(show_sub_route_checkbox);
				block.append(check).append("<br>");
			}
			else {
				radio = $("<input type=radio value='"+val+"' name='"+name+"' "+
					 "sr_call='"+name+"."+val+(opts[i].copy_route?","+name+"."+opts[i].copy_route:"")+"'>"+
					 "<label lookup='"+lookup+"'>"+label+"</label>"); 
				radio.click(show_sub_route);
				block.append(radio).append("<br>");
			}
			if (opts[i].route) {
					route_span=$("<span from='"+name+"' sr='"+name+"."+val+"' class='sub_route'></span>");
					route_span.append( make_route(opts[i].route) );
					if (opts[i].route_visible==1) route_span.addClass("grey");
					if( opts[i].route_position && opts[i].route_position=="inline")
						block.append(route_span);
					else subroutes.push( route_span);
			}

		}
		for (i in subroutes) block.append(subroutes[i]);
		return block;
	}

	function add_select(item){
		var opts = item.options, label = item.label,name = item.name;
		var sel, block, subroutes = [], route_span, i;
		var lookup
		if (!name || name == "undefined") alert("Problem with this: "+item.label+" ,  "+item.style);
		block = $("<div class='block'></div>");
		block.append(add_label(item));
		sel = $("<select name='"+name+"'><option value='' lookup=makechoice></option>");
		for(i in opts) {
			val = opts[i].value;
			lookup = opts[i].lookup||val||"";
			sel.append($("<option value='"+val+"' "+
				"sr_call='"+name+"."+val+"' lookup='"+lookup+"'>"+opts[i].label+"</option>")); 
			if (opts[i].route) {
					route_span=$("<span from='"+name+"' sr='"+name+"."+val+"' class='sub_route'></span>");
					route_span.append( make_route(opts[i].route) );
					subroutes.push( route_span);
			}
		}
		sel.change(show_sub_route);
		block.append(sel);
		for (i in subroutes) block.append(subroutes[i]);
		return block;
	}
	function add_choice(item){
		var style= item.style, block
		switch (style) {
			case 'select': block = add_select(item); break;
			case 'radio': block = add_radio_check(item); break;
			case 'checkbox': block = add_radio_check(item, true); break;
			default: block = $("<b style='color:red; font-size:140x'>Unknown choice type: <u>"+style+"</u></b>"); 
		}
		return block;
	}

	function add_multiple(item){
		var block, route_span, btn;
		block = $("<div class='block'></div>");
		block.append(add_label(item, 1)); 
		route_span=$("<div class='multiple'></div>");
		route_span.append("<div class='multiple_counter'>#1</div>");
		route_span.append( make_route(item.route) );
		btn = $("<button type='button' group='"+item.name+"' counter=1 lookup='"+item.button+"'></button>");
		btn.click(copy_item);
		block.append(route_span, btn);
		return block;
	}

	function copy_item(){
		var remove_btn,item = $(this).prev().clone(), counter = parseInt($(this).attr("counter"));
		item.find("[name]").each(function(){ 
			var n = $(this).attr("name").split("_mlt_")[0];
			$(this).attr("name",n+"_mlt_"+counter);
			$(this).val("");
			$(this).prop("checked",false);
		});
		item.find(".multiple_counter").text("#"+(counter+1));
		$(this).before(item);
		$(this).attr("counter", counter+1);
		if (counter==1){
			me = $(this);
			remove_btn = $("<button type='button'>Remove last</button>");
			remove_btn.click(function(){ 
				var counter = parseInt(me.attr("counter"));
				me.attr("counter", counter-1);
				$(this).prev().prev().remove();
				if(counter==2) $(this).remove();
				});
			$(this).after(remove_btn);
		}
		complete_labels();
		return false;
	}

	function add_country(item){
		var label = item.label ,name = item.name;
		var i, block, opt, sel, country = ['Austria','Belgium','Bulgaria','Croatia','Czech Repblic','Cyprus','Denmark','Estonia','Finland','France','Germany','Greece','Hungary','Ireland','Italy','Latvia','Lithuania','Luxembourg','Malta','Netherlands','Norway','Poland','Portugal','Romania','Slovakia','Slovenia','Spain','Sweden','United Kingdom'];
		block = $("<div class='block'></div>");
		block.append(add_label(item));
		sel = $("<select type=text name='"+name+"'></select>").append("<option value=''>..choose country</option>");
		for(i in country) sel.append("<option value='"+country[i]+"'>"+country[i]+"</option>");
		block.append(sel);
		return block;
	}	
	function add_date(item){
		var label = item.label ,name = item.name;
		var block;
		block = $("<div class='block'></div>");
		block.append(add_label(item));
		block.append($("<input type=text name='"+name+"' size=10 class='calendar'>"));
		return block;
	}

	function add_number(item){
		var label = item.label ,name = item.name;
		var block;
		block = $("<div class='block'></div>");
		block.append(add_label(item));
		block.append($("<input type=text name='"+name+"' size=10 class='number'>"));
		return block;
	}

	function add_spacer(item){
		var block, spacer;
		block = $("<div class='block'></div>");
		block.append(add_label(item));
		spacer = $("<div class=spacer></div>");
		for(var i=0; i<item.rows;i++) spacer.append("<br>&nbsp;");
		block.append(spacer);
		return block;
	}

	function add_info(item){
		var lookup = item.lookup||"", label = item.label||"";
		return $("<div class='block' lookup='"+lookup+"'>"+label+"</div>");	
	}
	function make_route(route, first){
		var div = $("<div class='route'></div>"), i, type, tab = null;
		if(first)
		{
			create_control_panel();
			div.css({marginTop:tabOffset+"px"});
		}
		
		for(i in route){
			type = route[i].type;
			switch (type){
				case "text": block = add_text_input(route[i]); break;
				case "choose": block = add_choice(route[i]); break;
				case "info": block = add_info(route[i]); break;
				case "date": block = add_date(route[i]); break;
				case "number": block = add_number(route[i]); break;
				case "spacer": block = add_spacer(route[i]); break;
				case "country": block = add_country(route[i]); break;
				case "multiple": block = add_multiple(route[i]); break;				
				case "tab": if (tab) div.append(tab);
							if (route[i].lookup)
								block = $("<h2 lookup="+route[i].lookup+"></h2>")
							else    block = $("<h2>"+route[i].label+"</h2>");
							div.append(block);
							block = null;
							tab = $("<div class=tab></div>");
							break;
				case "tabend": if(tab) {
						div.append(tab);
						tab = null;
						block = null;
					}
					break;
				case "pagebreak": block=""; break;
				default : block=$("<b style='color:red; font-size:140x'>Unknown type: <u>"+type+"</u></b>");
			}
			if (block){
				if (tab) tab.append(block);
				else div.append(block);	
			}
		}
		if (tab) div.append(tab);

		if(first)
		{
			div.append("<h2>Manage translations</h2>");
			tab = $("<div class=tab></div>");
			for (i in translation_fields) {
				type = translation_fields[i].lookup||translation_fields[i].name||"";
				tab.append("<i>"+i+"</i><p lookup='"+type+"'></p>");
			}
			div.append(tab);
		}

		return div;
	}

function save_form(){
	var form = $("#quiz"), p = $("#_session_name").val().replace(/\./g,"-"), ref = instrument+"."+p,
		ref_language = ref+"."+target_language;
	if(!p) { alert("Please provide filename"); return false ; }
	if(checkNameExists && localStorage[ref] &&  !confirm("Exists, overwrite?")) return false;
	var txt="", txt_language = "";
	form.find("input:text, textarea").each(function(){
		var name = $(this).attr("name"), val = $(this).val(), mlt_parts = name.split("_mlt_");
		if (translation_fields[name] || mlt_parts[1] && translation_fields[mlt_parts[0]])
			 txt_language+=del+name+del+val;
		else txt+=del+name+del+val;
	})
	form.find("select").each(function(){
		txt+=del+$(this).attr("name")+del+$(this).val();
	})
	form.find("input:checkbox").each(function(){
		txt+=del+$(this).attr("name")+del+($(this).prop("checked")?"on":"");
	})
	form.find("input:radio").each(function(){
		if ($(this).prop("checked"))  txt+=del+$(this).attr("name")+del+$(this).val(); 
	});
	form.find("button[counter]").each(function(){
		txt+=del+"mlt_"+$(this).attr("group")+del+$(this).attr("counter");
	});
	localStorage[ref]=txt;
	localStorage[ref_language]=txt_language;
	alert("Form is saved.");
	saveNeeded=false;
	update_language_menu(ref);
	create_control_panel();
	$("#stored_sessions, #_session_name").val(p);
	checkNameExists=false;
	return false;
}
function load_form(record){  
	if(!record || !record.name && !record.language )return; 
	var name = instrument+"."+record.name, key, language = record.language||"", available_languages = [], temp,
		resetForm = false, name_lang;
	if(saveNeeded && !confirm("Loading a form will erase all changes you made currently.\n\nPress <Cancel> and save first before loading.\n\nDo you want to proceed?\n\n")) return;
	saveNeeded=false;
	current_name = record.name||"";
	if(record.name)
		{
		for(key in localStorage) if(key.indexOf(name+".")==0){ 
			temp = key.split(".").pop(); 
			available_languages.push(temp);
			}
		}
	if(!language){
		if(available_languages.indexOf(target_language)>=0)	language = target_language;
		else language = available_languages[0];
	}
	target_language = language;
	update_status();
	$("#trg_select").val(language);

	name_lang=name+"."+language; 
	

	var setting = [], pairs = localStorage[name].split(del), i, field, value, j, current;
	for(i=1; pairs[i]; i+=2) {
		field=pairs[i];
		value=pairs[i+1];
		if(field.substring(0,4)=="mlt_") {
			field = field.substring(4);
			current = parseInt( $("button[group='"+field+"']").attr("counter") );
			value=parseInt(value);
			if (value>current) { for(j=0;j<(value-current);j++) $("button[group='"+field+"']").trigger("click"); }
			if (value<current) { for(j=0;j<(current-value);j++) $("button[group='"+field+"']").next().trigger("click"); }
		} else setting[field]=value;
	}
	if (!localStorage[name_lang]) resetForm = true;
	else {
		 pairs = localStorage[name_lang].split(del)
		 for(i=1; pairs[i]; i+=2) {
			field=pairs[i];
			value=pairs[i+1];
			if(field.substring(0,4)=="mlt_") {
				field = field.substring(4);
				current = parseInt( $("button[group='"+field+"']").attr("counter") );
				value=parseInt(value);
				if (value>current) { for(j=0;j<(value-current);j++) $("button[group='"+field+"']").trigger("click"); }
				if (value<current) { for(j=0;j<(current-value);j++) $("button[group='"+field+"']").next().trigger("click"); }
			} else setting[field]=value;
		 } 
	}
	$("#quiz input:text,#quiz textarea").each(function(){
		var name = $(this).attr("name");
		if (!resetForm || !translation_fields[name]) $(this).val(setting[name]);
		else {
			$(this).val("");
			}
		});
	$("#quiz select").each(function(){
		var name = $(this).attr("name");
		$(this).val(setting[name]);
		});
	$("#quiz input:checkbox").each(function(){
		var current = $(this).prop("checked"); 
		var nu = setting[$(this).attr("name")]=="on";
		if( current && !nu || !current && nu) $(this).trigger("click");
		});
	$("#quiz input:radio").each(function(){
		var active = setting[ $(this).attr("name")];
		if (active && $(this).attr("value")==active ) // $(this).prop("checked",true); ;
			$(this).trigger("click");
		});
	update_language_menu(name);
	saveNeeded=false;
//	if (!resetForm) alert("Form loaded");
}

function loadOptions(){
		var html = $("<table>"), tr, td, sel, opt, key, available = false, btn, instr, name, language, collection=[];
		tr=$("<tr>");
		td=$("<td>Locally stored sessions:</td>");
		tr.append(td);
		td=$("<td>");
		sel=$("<select id='stored_sessions'></select>");
		for (key in localStorage) {   
			instr = key.split(".")[0];
			name = key.split(".")[1];
			language = key.split(".")[2];
			if(instr==instrument){
					if(!collection[name]) collection[name]=[];
					if (language)collection[name].push(language);
			}
		}
		for (name in collection)
			{
				collection[name].sort();
				sel.append("<option value='"+name+"'>"+name+" : "+collection[name].join(" / ")+"</option>");
				available = true;			
			}
		if(available) { 
			td.append(sel);
			tr.append(td);
			td = $("<td>");
			btn = $("<button type='button'>Load</button>");
			btn.unbind("click").click(function(event){ 
				var val = $("#stored_sessions").val();
				event.preventDefault();
				$("#_session_name").val(val); 
				checkNameExists = false;
				load_form({ name:val });
				return false;
			});
			td.append(btn);
			tr.append(td);
			td = $("<td>");
			btn = $("<button type='button' style='background:#900'>Delete</button>");
			btn.unbind("click").click(function(event){ 
				if(!confirm("Are you sure you want to delete this form?")) return false;
				var val = $("#stored_sessions").val();
				event.preventDefault();
				for (key in localStorage) {   
					if(key==instrument+"."+val || key.indexOf(instrument+"."+val+".")==0) localStorage.removeItem(key);
				}
				create_control_panel();
				return false;
			});
			td.append(btn);
		}
		else { 
			td.append($("<b style='color:red'>No stored sessions available</b>"));	
		}
		tr.append(td);
		html.append(tr);
		tr = $("<tr>");
		td = $("<td>Save session [name]:</td>");
		tr.append(td);
		td=$("<td>");
		btn = $("<input id='_session_name' type='text'>");
		btn.change(function(){ checkNameExists = true; });
		td.append(btn);
		tr.append(td);
		td = $("<td>");
		btn = $("<button type='button'>Save</button>");
		btn.unbind("click").click(function(event){
			save_form();
			return false;
		});
		td.append(btn);
		tr.append(td);
		html.append(tr);
		return html;	
	}

function languageOptions(){
	var html = $("<table>"), sel, opt, tr, td, i;
	tr = $("<tr>");
	td = $("<td><span>Working language:</td>");
	tr.append(td);
	td = $("<td>");
	sel=$("<select id='src_select'></select>");
	for(i in languages) {
		s = languages[i].s;
		l = languages[i].l;
		opt=$("<option value="+s+" "+(s==source_language?"selected":"")+">"+l+"</option>");
		sel.append(opt);
	}
	sel.change(function(){
		source_language = $(this).val();
		apply_labels();
		create_menu();
	});
	td.append(sel);
	tr.append(td);
	html.append(tr);
	tr = $("<tr>");
	td = $("<td>Target language:</td>");
	tr.append(td);
	td=$("<td>");
	sel=$("<select id='trg_select'></select>");
	for(i in languages) {
		s = languages[i].s;
		l = languages[i].l;
		opt=$("<option value="+s+" "+(s==target_language?"selected":"")+">"+l+"</option>");
		sel.append(opt);
	}
	sel.change(function(){
		load_form({name:current_name, language:$(this).val()});
	});
	td.append(sel);
	tr.append(td);
	html.append(tr);
	return html;
}
function popUp(){
	$("#grey, #popup").show();
}
function popDown(){
	$("#grey, #popup").hide();
}
function read_file(file, fn){
    var reader = new FileReader();
    reader.onloadend = function(evt) {
      if (evt.target.readyState == FileReader.DONE) { // DONE == 2
        file_contents = evt.target.result;
		fn();
      }
    };
    var blob = file.slice(0);
    reader.readAsBinaryString(blob);
}
function processImport(){ 
	var temp, i, match = []; 
	$("#show-import-options input:checked").each(function(){
		var name = $(this).attr("name"), language = $(this).attr("language"), full_name = instrument+"."+name;
		if (language) full_name+="."+language;
		match.push(full_name);
	});
    var content = file_contents.split("\n"), sep = content[1];
    content.shift();
    content.shift();
    content=content.join("\n");
	content=content.split(sep);
	for(i=0; content[i];i+=2)
		{
		if (match.indexOf(content[i])>=0) localStorage[content[i]]=content[i+1];
		}
	create_control_panel();
	popDown();
}

function populate_import_options(){ 
	var form = $("#show-import-options");
	form.html("");
    var options = [], sep, i, name, language, temp,temp2, content = file_contents.split("\n");
    if (content[0]!="LEGAL-FORMS-EXPORT") alert("File not usable");
    else {
			sep = content[1];
			content.shift();
			content.shift();
			content=content.join("\n");
			content=content.split(sep);
			for(i=0;content[i];i+=2)
			{	
				temp = content[i].split(".");
				name = temp[1];
				language = temp[2]||"";
				options.push(name + ", "+language);
			}
			options.sort();
			for(i in options){
				temp = $("<input type='checkbox' name='"+options[i].split(",")[0]+
						"' language='"+options[i].split(", ").pop()+"'><label> "+options[i]+"</label><br>");
				form.append(temp);
			}
		}
		temp = $("<button type='button'>Import</button>");
		temp.click(processImport);
		form.append(temp);
		$("#popup label").click(function(){ $(this).prev().trigger("click");});
}

function updateImportOptions(){ 
	if(!this.files.length) return;
	var file=this.files[0];
	read_file(file, populate_import_options );
}

function importMenu(){
	var pop =$("#popup"), node, node2, key, instr, name, language, collection=[];
	pop.html("");
	popUp();
	if(!support_file_transfer()) {
		node=$("<p><b style='color:red'>Your browser does not support file read/save! Please use a modern browser!</b></p>");
			pop.append(node);
			node=$("<p>Alternatively you can copy the contents of the file you wish to copy in the textarea below, and subsequently click <process>.</p>");
			pop.append(node);
			node=$("<textarea rows=25 id='ta_import'></textarea>");
			node2 = $("<button type='button'>Process</button>");
			node2.click(function(){
				node.hide();
				$(this).hide();
				file_contents = $("#ta_import").hide().val();
				populate_import_options();
			});
			pop.append(node, node2);

	} else {
		node=$("<p>Select file to import from: </p>");
		node2=$("<input type='file' id='importfile'>");
		node2.change(updateImportOptions);
		node.append(node2);
		pop.append(node);
	}
	node=$("<p id='show-import-options'></p>").css({border:"1px solid #0aa"});
	pop.append(node);
	node = $("<p></p>");
	node2=$("<button type='button'>Close me</button>");
	node2.click(popDown);
	node.append(node2);
	pop.append(node);
	return pop;
}
function exportMenu(){
	var pop =$("#popup"), node, node2, key, instr, name, language, collection=[];
	popUp();
	pop.html("");
	node=$("<p>Select the sessions from list below you want to save to file</p>");
	pop.append(node);
	for (key in localStorage) {   
		instr = key.split(".")[0];
		name = key.split(".")[1];
		language = key.split(".")[2];
		if(instr==instrument){
				if(!collection[name]) collection[name]=[];
				if (language)collection[name].push(language);
		}
	}
	for (name in collection)
		{
			collection[name].sort();
			node = $("<input type=checkbox name='"+name+"' languages='"+collection[name].join(".")+"'>");
			node2 = $("<label> "+name+" / "+collection[name].join(", ")+"</label>");
			pop.append(node, node2, $("<br>") );
		}
	node = $("<p>Filename: </p>");
	node2 = $("<input type='text'>");
	node.append(node2);
	node2=$("<button type='button'>Save</button>");
	node2.click(function(){
		var filename = $("#popup input:text").val();
		if(!filename) filename="Untitled";
		var txt = "LEGAL-FORMS-EXPORT\n=||=\n";
		$("#popup input:checked").each(function(){
			var name=$(this).attr("name"), languages = $(this).attr("languages").split("."), i;
			txt+=instrument+"."+name+"=||="+localStorage[instrument+"."+name]+"=||=";
			for (i in languages) txt+=instrument+"."+name+"."+languages[i]+"=||="+localStorage[instrument+"."+name+"."+languages[i]]+"=||=";
		});
		if (support_file_transfer()){
			var blob = new Blob([txt], {type: "text/plain;charset=utf-8"});
			saveAs(blob, filename);
		}
		else {
			node=$("<p><b style='color:red'>Your browser does not support file read/save! Please use a modern browser!</b></p>");
			pop.append(node);
			node=$("<p>Alternatively you can copy and paste the contents of the textarea below and save it as a text file.</p>");
			pop.append(node);
			node=$("<textarea rows=25>"+txt+"</textarea>");
			pop.append(node);
		}
	});
	node.append(node2);
	pop.append(node);
	node = $("<p></p>");
	node2=$("<button type='button'>Close me</button>");
	node2.click(popDown);
	node.append(node2);
	pop.append(node);
	$("#popup label").click(function(){ $(this).prev().trigger("click");});
	return pop;
	
}
function generateOptions(){
	var html = $("<table>"), tr, td, btn;
	tr = $("<tr>");
	td = $("<td>Generate PDF format:</td>");
	tr.append(td);
	td = $("<td>");
	btn = $("<button type='button'>Make PDF</button>");
	btn.unbind("click").click(function(even){
		create_pdf();
		return false;
	});
	td.append(btn);
	tr.append(td);
	html.append(tr);
	tr = $("<tr>");
	td = $("<td>Generate HTML formatted document:</td>");
	tr.append(td);
	td = $("<td>");
	btn = $("<button type='button'>Make HTML</button>");
	btn.unbind("click").click(function(even){
		create_html();
		return false;
	});
	td.append(btn);
	tr.append(td);
	html.append(tr);
	return html;
}
function importExportOptions(){
	var html = $("<table>"), tr, td, btn;
	tr=$("<tr>");
	td=$("<td><b>Export sessions</b> to save them as file. For back-up purposes, or to transfer to other machine</td>");
	tr.append(td);
	td=$("<td>");
	btn=$("<button type='button'>Export</button>");
	btn.click(exportMenu);
	td.append(btn);
	tr.append(td);
	html.append(tr);
	tr=$("<tr>");
	td=$("<td><b>Import sessions</b> to restore previously sessions saved to file.</td>");
	tr.append(td);
	td=$("<td>");
	btn=$("<button type='button'>Import</button>");
	btn.click(importMenu);
	td.append(btn);
	tr.append(td);
	html.append(tr);
	return html;
}
function generateActionLinks(){
	var html = $("<table>"), tr, td, btn;
	tr = $("<tr>");
	td = $("<td>Reset form (per language)</td>");
	tr.append(td);
	td = $("<td>");
	btn = $("<button type='button'>Reset form</button>");
	btn.click(function(){ 
		if(saveNeeded && 
		!confirm("Are you sure? Changing form will result in loosing all information on current form.")) 
			{ return; }
			else {draw_form(); }
			return false;
			});
	td.append(btn);
	tr.append(td);
	td = $("<td>Change view</td>");
	tr.append(td);
	td = $("<td>");
	btn = $("<button type='button'>Show tab view</button>");
	btn.click(function(event){
		var menu = $("#menu");
		$(this).text("Show "+view_mode);	
		view_mode = view_mode=="long"?"tab":"long";
		create_menu();
		return false;
	});
	td.append(btn);
	tr.append(td);

	html.append(tr);
	tr = $("<tr>");
	td = $("<td>Choose different legal instrument</td>");
	tr.append(td);
	td = $("<td>");
	btn = $("<button type='button'>Change instrument</button>");
	btn.click(function(){
		if(saveNeeded && 
		!confirm("Are you sure? Changing form will result in loosing all information on current form.")) 
			{ return; }
			else {	opening_screen();	}
		return false;
		});
	td.append(btn);
	tr.append(td);
	html.append(tr);
	html.append(tr);
	return html;
}
function create_control_panel(){ 
	var panel = $("#control_panel"), btn, tab;	
	panel.html("");
	btn=$("<button type='button'>Storage [load/save]</button>").addClass("tab_button");
	tab=$("<div></div>");
	tab.append(loadOptions());
	panel.append(btn, tab);		
	btn=$("<button type='button'>Languages</button>").addClass("tab_button");
	tab=$("<div></div>").hide();
	tab.append(languageOptions());
	panel.append(btn, tab);		
	btn=$("<button type='button'>Generate form</button>").addClass("tab_button");
	tab=$("<div></div>").hide();
	tab.append(generateOptions());
	panel.append(btn, tab);		
	btn=$("<button type='button'>Import/export forms</button>").addClass("tab_button");
	tab=$("<div></div>").hide();
	tab.append(importExportOptions());
	panel.append(btn, tab);		
	btn=$("<button type='button'>Change/reset form</button>").addClass("tab_button");
	tab=$("<div></div>").hide();
	tab.append(generateActionLinks());
	panel.append(btn, tab);		
	$("#control_panel .tab_button").each(function(idx){
		$(this).click(function(){
		$("#control_panel button").removeClass("activeBtn");
		$(this).addClass("activeBtn");
		$("#control_panel div").hide();
		$("#control_panel div:eq("+idx+")").show();
		});
	});
	$("#control_panel button.tab_button:eq(0)").css({marginLeft:"40px"}).trigger("click");
}

function create_menu(){ 
  var menu = $("#menu");
  menu.html("");
  if (view_mode=="tab"){
	  $(".tab:eq(0), h2:eq(0), .tab:gt(1), h2:gt(1)").hide();
	  $("h2").each(function(idx){
			var a = $("<a href='#'>"+$(this).html()+"</a>");
			a.click(function(){
			  $(".tab, h2").hide();
			  $(this).siblings().removeClass("activeLink");
			  $(this).addClass("activeLink");
			  $(".tab:eq("+idx+"), h2:eq("+idx+")").show();
			  return false;
			});
			if(idx==0) a.addClass("activeLink");
			menu.append(a);  
	  	});
  }else{
	  $(".tab, h2").show();
	  $("h2").each(function(idx){ 
			var a = $("<a href='#'>"+$(this).html()+"</a>");
			var pos = Math.round($(this).offset().top)-tabOffset;
			$(this).attr("position",pos);
			a.click(function(){
				$("html,body").animate({scrollTop: pos},"slow"); 
				return false;
			});
			a.attr("position",pos);
			if(idx==0) a.addClass("activeLink");
			menu.append(a);  
	  	});
	  	var m = $(window).height() - $(".tab:last").height() - 90 ;
	  	$(".tab:last").css({marginBottom:m});
	}
	menu.find("a:first").css({borderRadius:"6px 6px 0 0"});
	menu.find("a:last").css({background:"#09f",color:"#fff",fontWeight:"bold", borderRadius:"0 0 6px 6px"});
}


function update_language_menu(name){  
	var i,lbl, lan, extra = " **";
	$("#trg_select option").each(function(){
		lbl=$(this).text();
		lbl=lbl.split(extra)[0];
		if(localStorage[name+"."+$(this).attr("value")]) {
			lbl=lbl+extra;
			$(this).css({fontWeight:"bold"});
		} else $(this).css({fontWeight:"normal"});
		$(this).text(lbl);
	});
}

function create_pdf(){
	if(!json_form) return;
	generate_pdf();
}
function create_html(){
	if(!json_form) return;
	generate_html();
}
function update_status(){
	var div = $("#status"), i, status="<img src='/images/flags/"+target_language.toUpperCase()+".GIF'> ";
	for(i in languages) if (languages[i].s==target_language) status+=languages[i].l;
	status+=" | click to change &raquo;";
	div.html(status);	
	div.unbind("click").click(function(){
		$("#control_panel button.tab_button:eq(1)").trigger("click");		
	});
}
function adjust_css_to_fit(){
	var total_w = $(window).width();
	if (total_w<800 && !adjusted) {
		alert("Your screen seems to be too narrow to properly render this form,\nplease maximize window.");
		}
	$("#quiz").css({width:(total_w-360)});
	$("#control_panel").css({width:(total_w-390)});
	$(".block input:text, .block select").not(".calendar, .number").css({width:(total_w-670)});
	$(".block textarea, .spacer, .free").css({width:(total_w-430)});	
	$(".block .block input:text, .block .block select").not(".calendar, .number").css({width:(total_w-750)});
	$(".block .block textarea, .block .block .spacer, .block .block.free").css({width:(total_w-510)});	
	adjusted = true;
}
function support_file_transfer(){
 return window.File && window.FileReader && window.FileList && window.Blob; 
}

$("#grey").css({opacity:0.75});
$(window).resize(adjust_css_to_fit);
$(window).scroll(function(){
	var p = $(this).scrollTop();
	$("#menu a").removeClass("activeLink").each(function(){
		if($(this).attr("position") < (p-tabOffset) ) {}
		else {
			$(this).addClass("activeLink");
			return false;
			}
		})
})

//opening_screen();
load_instrument("eaw");	
}); //closure 2
});	//closure 1
