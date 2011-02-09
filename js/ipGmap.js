
var PropertyWidget = new Class({
	
	Implements: [Chain, Events, Options],
	
	Binds: ['googleCallback'],
	
	options: {
		ipbaseurl: '',
		showHoa: false,
		showReo: false,
		showWf: false,
		sliderLength: 300,
		priceHigh: 100000,
		priceLow: 50000,
		sqftHigh: 8000,
		sqftLow: 1000,
		bedsHigh: 5,
		bedsLow: 1,
		bathsHigh: 5,
		bathsLow: 1,
		itemId: 99999,
		//latitude: '',
		//longitude: '',
		zoom: 13,
		maptype: G_PHYSICAL_MAP,
		showPreview: 1,
		currencySymbol: '',
		currencyPos: '',
		currencyFormat: '',
		noLimit: 0
		// New options:
	},
	
	initialize: function(element, options){
		this.setOptions(options);
		this.element = $(element);
		
		if(!google.maps){
		/*
			Instantiate Google Maps within this Class initialization if google's script is not required earlier in 
			the page, all the methods of this Class will assume the following conditions are met:
				--- All intitial Element creation and setup methods of this class should be 
					kicked off in the google maps callback
				--- Attach the google maps object to the 'this' reference of the Class's object, use "gmap" as the property key
		 */
		}else{
			this.googleCallback();
		}
		
		// Slider creation needed here
	},
	
	googleCallback: function(){
		this.mapElement = new Element('div', {
			id: 'property_map'
		}).inject(this.element);
		
		this.listElement = new Element('div', {
			id: 'property_list'
		}).inject(this.element);
		
		this.mapInstance = new google.maps.Map2(this.mapElement);
		this.mapInstance.setUIToDefault();
		this.mapInstance.setMapType(this.options.maptype);        
		this.mapInstance.setCenter(new google.maps.LatLng(this.options.latitude, this.options.longitude), (this.options.latitude && this.options.longitude) ? 13 : this.options.zoom);
		
		this.icon = $merge(new google.maps.Icon(), {
			image: this.options.ipbaseurl + '/components/com_iproperty/assets/images/map/icon56.png',
			shadow: this.options.ipbaseurl + '/components/com_iproperty/assets/images/map/icon56s.png',
			iconSize: new google.maps.Size(32,32),
			shadowSize: new google.maps.Size(59,32),
			iconAnchor: new google.maps.Point(9, 34),
			infoWindowAnchor: new google.maps.Point(9, 2),
			infoShadowAnchor: new google.maps.Point(18, 25),
			transparent: "http://www.google.com/intl/en_ALL/mapfiles/markerTransparent.png",
			printImage: "coldmarkerie.gif",
			mozPrintImage: "coldmarkerff.gif"
		});
		
		window.addEvent('keydown', function(e){
			var node = (evt.target) ? evt.target : ((evt.srcElement) ? evt.srcElement : null);
			if (e.key == 'r' && (e.target.type == "text")){ e.preventDefault();} //Investigate the necessity of the node type check here
		});
		
		this.ajaxSearch();
	},
	
	formatCurrency: function(num) {
		var symbol = this.options.currencySymbol,
			separator = (this.options.currencyFormat == 1) ? ',' : '.';

		num = num.toString().replace(/\$|\,/g, '');
		
		if(!$type(num)){
			num = "0";
			//sign = (num == (num = Math.abs(num)));
			num = Math.floor(num * 100 + 0.50000000001);
			//cents = num%100;
			num = Math.floor(num / 100).toString();
		}
		//if(cents<10) cents = "0" + cents;
		for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++){
			num = num.substring(0, num.length - (4 * i + 3)) + separator + num.substring(num.length - (4 * i + 3));
		}
		//return (((sign)?'':'-') + '$' + num);
		
		return (this.options.currencyPos == 1) ? num + ' ' + symbol : symbol + num;
	},
	
	addCommas: function(num){
		var split = (num + '').split('.'),
			whole = split[0],
			rgx = /(\d+)(\d{3})/;
		
		while (rgx.test(whole)){ whole = whole.replace(rgx, '$1' + ',' + '$2');}
		
		return whole + ((split[1]) ? '.' : '');
	},
	
	ajaxSearch: function(){
		$('loading_div').style.display="block";
		var noLimit     = this.options.noLimit;
		var price_low   = (noLimit) ? ((priceMin == this.options.priceLow) ? '' : priceMin) : priceMin,
		price_high      = (noLimit) ? ((priceMax == this.options.priceHigh) ? '' : priceMax) : priceMax,
		sqft_low        = sqftMin,
		sqft_high       = sqftMax,
		beds_low        = bedsMin,
		beds_high       = bedsMax,
		baths_low       = bathsMin,
		baths_high      = bathsMax,
		ptype           = new Array();
        
		//set pagination variables
		this.options.limit      = document.slider_search.limit.value;
		this.options.limitstart = (document.slider_search.limitstart.value) ? document.slider_search.limitstart.value : 0;            

		var search_string='';
		if(document.slider_search.search_string.value != langText['inputText']){
			search_string = document.slider_search.search_string.value;
		}

		//var city = escape(document.slider_search.city.value);
		var city    = document.slider_search.city.value;
		var stype   = document.slider_search.stype.value;
		
		var hoa_query='';
		if(this.options.showHoa == 1){
			hoa_query = '&hoa='+(document.slider_search.hoa.checked?1:0);
		}
		
		var reo_query='';
		if(this.options.showReo == 1){
			reo_query = '&reo='+(document.slider_search.reo.checked?1:0);
		}
		
		var wf_query='';
		if(this.options.showWf){
			wf_query = '&waterfront='+(document.slider_search.waterfront.checked?1:0);
		}

		//loop through available categories
		ptype = document.getElementsByName("ptype[]");
		var checked = "";
		for(i=0;i<ptype.length;i++){
			if(ptype[i].checked){
				checked+=ptype[i].value+",";
			}
		}
		var strLen = checked.length;
		checked = checked.slice(0,strLen-1);
		//alert(checked);


		var myurl = this.options.ipbaseurl+"index.php?option=com_iproperty&view=advsearch&task=ajaxSearch&ptype="+checked+"&price_high="+price_high+"&price_low="+price_low+"&sqft_high="+sqft_high+"&sqft_low="+sqft_low+"&beds_high="+beds_high+"&beds_low="+beds_low+"&baths_high="+baths_high+"&baths_low="+baths_low+"&search="+search_string+"&city="+city+"&stype="+stype+wf_query+hoa_query+reo_query+"&limit="+this.options.limit+"&limitstart="+this.options.limitstart+"&format=raw";
		//alert(myurl);
		var a = new Ajax(myurl,{
			method: 'get',
			onComplete: function( response ){
				$('loading_div').style.display="none";
				readMap( response );
			}
		});
		a.request();
	},
	
	sqft_slider: function(bg,minthumb,maxthumb,minvalue,maxvalue,startmin,startmax,aSliderName,options) {
		this.options = options;
		var range = this.options.sliderLength;
		if ((startmax - startmin) < this.options.sliderLength) {
			var tickSize = (this.options.sliderLength / (startmax - startmin));
		}else{
			tickSize = 1;
		}
		var initVals = [ 0,this.options.sliderLength ], // Values assigned during instantiation
		//Event = YAHOO.util.Event,
		Dom = YAHOO.util.Dom,
		dual_slider,
		scaleFactor = ((startmax - startmin) / this.options.sliderLength); // Custom scale factor for converting the pixel offset into a real value
		dual_slider = YAHOO.widget.Slider.getHorizDualSlider(
		bg,minthumb,maxthumb,
		range, tickSize, initVals);

		/*
		 *TODO: recall set values
		 *use this method to recall saved searches
		 *and previous searches when implemented
		 *where 8000 would be the recalled min value
		 *
		 *dual_slider.setMinValue(Math.round((8000-startmin) / scaleFactor));
		 *
		 */
		
		dual_slider.subscribe("change", function(instance) {
			var a_minvalue = Dom.get(minvalue);
			var a_maxvalue = Dom.get(maxvalue);
			a_minvalue.innerHTML =  addCommas(Math.round((dual_slider.minVal * scaleFactor) + startmin));
			a_maxvalue.innerHTML =  addCommas(Math.round((dual_slider.maxVal * scaleFactor) + startmin));
			sqftMin = (dual_slider.minVal * scaleFactor) + startmin;
			sqftMax = (dual_slider.maxVal * scaleFactor) + startmin;
		});

		dual_slider.subscribe("slideEnd", function(){ limitReset();ajaxSearch(); });
		return dual_slider;
	},
	
	beds_slider: function(bg,minthumb,maxthumb,minvalue,maxvalue,startmin,startmax,aSliderName,options) {
		this.options = options;
		var range = this.options.sliderLength;
		if ((startmax - startmin) < this.options.sliderLength) {
			var tickSize = (this.options.sliderLength / (startmax - startmin));
		}else{
			tickSize = 1;
		}
		var initVals = [ 0,this.options.sliderLength ], // Values assigned during instantiation
		//Event = YAHOO.util.Event,
		Dom = YAHOO.util.Dom,
		dual_slider,
		scaleFactor = ((startmax - startmin) / this.options.sliderLength); // Custom scale factor for converting the pixel offset into a real value
		dual_slider = YAHOO.widget.Slider.getHorizDualSlider(
		bg,minthumb,maxthumb,
		range, tickSize, initVals);
		dual_slider.subscribe("change", function(instance) {
			var a_minvalue = Dom.get(minvalue);
			var a_maxvalue = Dom.get(maxvalue);
			a_minvalue.innerHTML = Math.round((dual_slider.minVal * scaleFactor) + startmin);
			a_maxvalue.innerHTML = Math.round((dual_slider.maxVal * scaleFactor) + startmin);
			bedsMin = (dual_slider.minVal * scaleFactor) + startmin;
			bedsMax = (dual_slider.maxVal * scaleFactor) + startmin;
		});

		dual_slider.subscribe("slideEnd", function(){ limitReset();ajaxSearch(); });
		return dual_slider;
	},
	
	baths_slider: function(bg,minthumb,maxthumb,minvalue,maxvalue,startmin,startmax,aSliderName,options) {
		this.options = options;
		var range = this.options.sliderLength;
		if ((startmax - startmin) < this.options.sliderLength) {
			var tickSize = (this.options.sliderLength / (startmax - startmin));
		}else{
			tickSize = 1;
		}
		var initVals = [ 0,this.options.sliderLength ], // Values assigned during instantiation
		//Event = YAHOO.util.Event,
		Dom = YAHOO.util.Dom,
		dual_slider,
		scaleFactor = ((startmax - startmin) / this.options.sliderLength); // Custom scale factor for converting the pixel offset into a real value
		dual_slider = YAHOO.widget.Slider.getHorizDualSlider(
		bg,minthumb,maxthumb,
		range, tickSize, initVals);
		dual_slider.subscribe("change", function(instance) {
			var a_minvalue = Dom.get(minvalue);
			var a_maxvalue = Dom.get(maxvalue);
			a_minvalue.innerHTML = Math.round((dual_slider.minVal * scaleFactor) + startmin);
			a_maxvalue.innerHTML = Math.round((dual_slider.maxVal * scaleFactor) + startmin);
			bathsMin = (dual_slider.minVal * scaleFactor) + startmin;
			bathsMax = (dual_slider.maxVal * scaleFactor) + startmin;
		});

		dual_slider.subscribe("slideEnd", function(){ limitReset();ajaxSearch(); });
		return dual_slider;
	},
	
	price_slider: function(bg,minthumb,maxthumb,minvalue,maxvalue,startmin,startmax,aSliderName,options) {
		this.options = options;
		var range = this.options.sliderLength;
		var noLimit = this.options.noLimit;
		if ((startmax - startmin) < this.options.sliderLength) {
			var tickSize = (this.options.sliderLength / (startmax - startmin));
		}else{
			tickSize = 1;
		}
		var initVals = [ 0,this.options.sliderLength ], // Values assigned during instantiation
		//Event = YAHOO.util.Event,
		Dom = YAHOO.util.Dom,
		dual_slider,
		scaleFactor = ((startmax - startmin) / this.options.sliderLength); // Custom scale factor for converting the pixel offset into a real value
		dual_slider = YAHOO.widget.Slider.getHorizDualSlider(
		bg,minthumb,maxthumb,
		range, tickSize, initVals);
		dual_slider.subscribe("change", function(instance) {
			var a_minvalue = Dom.get(minvalue);
			var a_maxvalue = Dom.get(maxvalue);
			priceMin = (dual_slider.minVal * scaleFactor) + startmin;
			priceMax = (dual_slider.maxVal * scaleFactor) + startmin;
			if ( priceMin == startmin ) {
				if(noLimit == 1){
					a_minvalue.innerHTML = langText['nolimit'];
				}else{
					a_minvalue.innerHTML = formatCurrency(startmin);
				}
			} else {
				a_minvalue.innerHTML = formatCurrency((dual_slider.minVal * scaleFactor) + startmin);
			}
			if ( priceMax == startmax ) {
				if(noLimit == 1){
					a_maxvalue.innerHTML = langText['nolimit'];
				}else{
					a_maxvalue.innerHTML = formatCurrency(startmax);
				}
			} else {
				a_maxvalue.innerHTML = formatCurrency((dual_slider.maxVal * scaleFactor) + startmin);
			}
		});

		dual_slider.subscribe("slideEnd", function(){ limitReset();ajaxSearch(); });
		return dual_slider;
	},
	
	listProperties: function(input) {
	// <OLD CODE>
		var totalcount = input[0].totalcount;
		$('advmap_counter').set('html', totalcount);
		var prevLimit  = (parseInt(this.options.limitstart,10) - parseInt(this.options.limit,10));
		var nextLimit  = (parseInt(this.options.limitstart,10) + parseInt(this.options.limit,10));

		// JSACES: Haven't yet explored this section in the live page, but I am sure the following code can be reduced to a one liner for each limit 
	
			//if next limit is larger than total, hide next button and set maxcount to total
			if(nextLimit >= totalcount){
				var end = true;
				nextLimit = totalcount;
			}

			//if previous limit is less than 0, hide previous button and set min limit to 0
			if(prevLimit < 0){
				var beginning = true;
				prevLimit = 0;
			}
	// </OLD CODE>

	// <NEW CODE>
		var pagingTemplate = '<tr><td class="ip_pagecount">{pagecount}</td><td class="ip_pagenav">{beginning}{end}</td></tr>',
			pagingButton = '<input type="button" class="ipbutton" value="{value}" limit="{limit}" style="display: {display};" />';
			pagingData = {
				pagecount: langText.tprop + ': ' + this.options.limitstart + '-' + nextLimit + ' ' + langText.of + ' ' + totalcount,
				beginning: pagingButton.substitute({
					value: langText.previous,
					limit: previousLimit,
					display: (beginning) ? 'none' : 'inline'
				}),
				end: pagingButton.substitute({
					value: langText.next,
					limit: nextLimit,
					display: (end) ? 'none' : 'inline'
				})
			};
		
		var paginationTop = new Element('table', {
			'class': 'ip_pagination',
			'html': pagingTemplate.subsitute(pagingData),
			'events': {
				'click:relay(input.ipbutton)': function(){
					var limit = e.target.get('limit');
					if(limit){ this.ajaxPage.pass(limit);}
				}.bind(this)
			}
		});
		
		var propertyHeaders = [];
		$H({
			'price': 'currency',
			'pid': 'string',
			'street': 'string',
			'beds': 'number',
			'baths': 'number',
			'sqft': 'number',
			'preview': 'noaxis'
		}).each(function(v, k){
			propertyHeaders.push({
				content: langText[k],
				properties: { axis: v }
			});
		});
		
		var propertyRows = [];
			if (totalcount > 0){
				input.each(function(e){
					var marker = this.createMarker(e),
						url = input[i].proplink,
						row = [
							input[i].formattedprice,
							input[i].mls_id,
							'<a href="' + url + '" ' + ((this.options.showPreview == 1 && marker) ? 'preview="mouseenter"' : '') + '">' + input[i].street_address.clean() + ', ' + input[i].city.clean() + '</a>',
							input[i].beds,
							input[i].baths,
							input[i].sqft,
							(marker) ? '<a href="#" preview="click">' + langText.preview + '</a>' : '--'
						];
					propertyRows.push(row);	
				}, this);
			}else{
				propertyRows.push([{
					content: langText.noRecords,
					properties: {
						'colspan': 7,
						'align': 'center'
					}
				}]);
			}
		
		var propertyTable = new HtmlTable({
			properties: {
				'id': 'prop_table'
			},
			headers: propertyHeaders,
			rows: propertyRows
		});
		
		$(propertyTable).addEvents({
			'mouseenter:relay(a[preview=mouseenter])': this.myclick,
			'click:relay(a[preview=click])': this.myclick
		}).inject(this.listElement);
		
		var paginationBottom = paginationTop.clone();
	// </NEW CODE>
	// </OLD CODE>	
		new sortableTable('prop_table', {overCls: 'over', sortBy: 'DESC'});
	// </OLD CODE>
	},
	
	formatWindow: function(pin) {
		pin.street_address = pin.street_address.clean();
		pin.city = pin.city.clean();
		pin.short_description = pin.short_description ? pin.short_description.slice(0,205)+'...' : '';
		pin.thumb = pin.thumb && '<div class="bubble_image"><a href="{proplink}">{thumb}</a></div>').substitute(pin);
		
		html = ('<div class="bubble"><h4><a href="{proplink}">{street_address}, {city}</a></h4>' +
			'<p><b>{langText.pid}:</b>{mls_id}<br /><b>{langText.price}:</b>'+ 
			'{pin.formattedprice}</p>{thumb}<div class="bubble_desc">{desc}'+
			'<a href="{url}">({langText.more})</a></div></div>'
		).substitute(pin);
		if(!pin.thumb){
			html += '<div class="bubble_image"><a href="'+url+'">'+pin.thumb+'</a></div>';
		}

		if(pin.short_description){
			html += ;
		}
		return html;
	},
	
	createMarker: function(input) {
		if(input.lat_pos && input.long_pos){
			var coord = new google.maps.LatLng(input.lat_pos,input.long_pos);
			var marker = new google.maps.Marker(coord,houseIcon);
			var html = formatWindow(input);
			bounds.extend(coord);
			google.maps.Event.addListener(marker, "click", function() {
				this.openInfoWindowHtml(html);
			});

			//create map marker based on property id
			gmarkers[input.id] = marker;
			htmls[input.id] = html;
			map.addOverlay(marker);
			return marker;
		}else{
			//no lat & long, return no marker
			return false;
		}
	},
	
	myclick: function(i) {
		gmarkers[i].openInfoWindowHtml(htmls[i]);
	},
	
	readMap: function(data) {
		bounds = new google.maps.LatLngBounds();
		// hide the info window, otherwise it still stays open where the removed marker used to be
		map.getInfoWindow().hide();
		map.clearOverlays();

		// empty the arrays
		gmarkers = [];
		htmls = [];

		//json evaluate returned data
		jsonData = Json.evaluate(data);

		//TODO: if no maps found, display advmap_nofound div with no search criteria met
		if (jsonData.length <= 0) {
			document.getElementById('advmap_nofound').style.display = 'block';
		}else{
			document.getElementById('advmap_nofound').style.display = 'none';
		}

		//create sortable table list
		listProperties(jsonData);
		map.setZoom(map.getBoundsZoomLevel(bounds));
		map.setCenter(bounds.getCenter());
	}
	
});
//IpAjaxSearch.implement(new Events);
//IpAjaxSearch.implement(new Options);
