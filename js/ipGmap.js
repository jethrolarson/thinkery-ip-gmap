
var PropertyWidget = new Class({
	
	Implements: [Chain, Events, Options],
	
	Binds: ['googleCallback'],
	
	options: {
		ipbaseurl: '',
		showHoa: false,
		showReo: false,
		showWf: false,
		sliderLength: 300,
		
		itemId: 99999,
		showPreview: 1,
		
		noLimit: 0,
		mapOptions: {
			zoom: 13,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			//center 
			lat: '47.6725282',
			lng: '-116.7679661'
		},
		searchOptions: {
			price_high: 100000,
			price_low: 50000,
			sqft_high: 8000,
			sqft_Low: 1000,
			beds_high: 5,
			beds_low: 1,
			baths_high: 5,
			baths_low: 1,
			city: '',
			stype: '',
			limit: '',
			limitstart: '',
			search: '',
			option:'com_iproperty',
			view: 'advsearch',
			task:'ajaxSearch',
			ptype: '',
			hoa: '',
			format: 'raw'
		}
		// New options:
	},
	//Search Query
	query: {},
	initialize: function(element, options){
		this.setOptions(options);
		
		this.element = $(element);
		this.markers = {};
		
		this.request = new Request({
			method: 'get',
			url: this.options.ipbaseurl + 'index.php',
			onComplete: eSearchLoad.bind(this)
			//Shouldn't we have handlers for errors?
		});
		//create DOM
		this.loadingDiv = new Element('div',{id:'loading_div',text: 'Loading...'});
		this.mapElement = new Element('div', {id: 'property_map', text: 'Loading Map...'});
		this.propertyList = new Element('div', {id: 'property_list'});
		$$(this.loadingDiv,this.mapElement,this.propertyList).inject(this.element);
		this.createMap();
		//this.search();
		// Slider creation needed here
	},
	eSearchLoad: function(data){
		this.results = data;
		this.loading_div.hide();
		this.updateTable();
		this.updateMap();
	},
	createMap: function(){
		this.options.mapOptions.center = new google.maps.LatLng(this.options.mapOptions.lat, this.options.mapOptions.lng);
		this.mapInstance = new google.maps.Map(this.mapElement, this.options.mapOptions);
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
	
	search: function(){
		var categories = [], i,
		ptype = document.getElementsByName("ptype[]");
		this.loadingDiv.show();

		//get the value of the form elements associated with the search options
		this.query = Object.merge(this.options.searchOptions,{
			//search: this.searchInput.value,
			//limit: document.slider_search.limit.value,
			//limitstart: document.slider_search.limitstart.value  || 0,
			//city: this.cityInput.value,
			//stype: this.stypeInput.value,
			//hoa: this.options.showHoa ? this.hoaInput.checked ? 1:0 :'',
			//reo: this.options.showReo ?this.reoInput.checked ? 1:0 : '',
			//waterfront: this.options.showWf ?this.waterfrontInput.checked ? 1:0 : '',
		});
		
		//loop through available categories
		for(i=0;i<ptype.length;i++){
			if(ptype[i].checked){
				categories.push(ptype[i].value);
			}
		}
		this.query.ptype = categories.join(',');


		this.request.send(this.query);
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
	// <NEW CODE>
		var totalcount = input[0].totalcount,
			prevLimit = this.options.limitstart.toInt() - this.options.limit.toInt(),
			prevLimit = (prevLimit < 0) ? 0 : prevLimit, //if previous limit is less than 0, hide previous button and set min limit to 0
			nextLimit = this.options.limitstart.toInt() + this.options.limit.toInt(),
			nextLimit = (nextLimit >= totalcount) ? totalcount : nextLimit; //if next limit is larger than total, hide next button and set maxcount to total
		
		$('advmap_counter').set('html', totalcount);
	
		var pagingTemplate = '<tr><td class="ip_pagecount">{pagecount}</td><td class="ip_pagenav">{beginning}{end}</td></tr>',
			pagingButton = '<input type="button" class="ipbutton" value="{value}" limit="{limit}" style="display: {display};" />';
			pagingData = {
				pagecount: langText.tprop + ': ' + this.options.limitstart + '-' + nextLimit + ' ' + langText.of + ' ' + totalcount,
				beginning: pagingButton.substitute({
					value: langText.previous,
					limit: previousLimit,
					display: (!prevLimit) ? 'none' : 'inline'
				}),
				end: pagingButton.substitute({
					value: langText.next,
					limit: nextLimit,
					display: (nextLimit == totalcount) ? 'none' : 'inline'
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
			'mouseenter:relay(a[preview=mouseenter])': this.openInfoWindow,
			'click:relay(a[preview=click])': this.openInfoWindow
		}).inject(this.listElement);
		
		var paginationBottom = paginationTop.clone();
		
		new sortableTable('prop_table', {overCls: 'over', sortBy: 'DESC'}); // FIXME: this is the old sortable table script, get this working with HtmlTable from More
		
		return this;
	},
	
	getMarkerHtml: function(marker) {
		marker.street_address = marker.street_address.clean();
		marker.city = marker.city.clean();
		marker.short_description = marker.short_description && (marker.short_description.slice(0,205)+'...');
		marker.thumb = marker.thumb && ('<div class="bubble_image"><a href="{proplink}">{thumb}</a></div>').substitute(marker);
		marker.langText = langText;//hacky copy.
		return (
			'<div class="bubble"><h4><a href="{proplink}">{street_address}, {city}</a></h4>' +
			'<p><b>{langText.pid}:</b>{mls_id}<br /><b>{langText.price}:</b>'+ 
			'{formattedprice}</p>{thumb}<div class="bubble_desc">{desc}'+
			'<a href="{url}">({langText.more})</a></div></div>'
		).substitute(marker);
	},
	
	createMarker: function(input) {
		if(input.lat_pos && input.long_pos){
			var coord = new google.maps.LatLng(input.lat_pos,input.long_pos),
			    marker = new google.maps.Marker(coord, this.icon), //this.icon is replacing houseIcon the global, defined in the callback
			    html = this.getMarkerHtml(input);
				
			this.bounds.extend(coord);
			
			google.maps.Event.addListener(marker, "click", function() {
				this.openInfoWindowHtml(html);
			});

			//create map marker based on property id
			this.markers[input.id] = [marker, html];
			map.addOverlay(marker);
			
			return marker;
		}
		else return false;
	},
	
	openInfoWindow: function(e) {
		var item = this.markers[e.target.id];
		item[0].openInfoWindowHtml(item[1]);
	},
	
	readMap: function(data) {
		data = JSON.decode(data);
		this.bounds = new google.maps.LatLngBounds();
		this.mapInstance.getInfoWindow().hide(); // hide the info window, otherwise it still stays open where the removed marker used to be
		this.mapInstance.clearOverlays();
		this.markers = {};
		
		$('advmap_nofound')[(data.length <= 0) ? 'show' : 'hide'](); //TODO: if no maps found, display advmap_nofound div with no search criteria met

		this.listProperties(data); //create sortable table list
//		this.mapInstance.setZoom(this.mapInstance.getBoundsZoomLevel(this.bounds));
		this.mapInstance.setCenter(this.bounds.getCenter());
		
		return this;
	}
	
});
//IpAjaxSearch.implement(new Events);
//IpAjaxSearch.implement(new Options);

/*
Notes:
langText is a global object. Though it's wrongly declaired as an Array. It just has localization strings for labels. 

We should probably break this thing into two parts:
1. The part that modifies and sends the ajax search
	- this part should be a Request instance declared in the initilization fn
	  that is attached to the Class reference, we can distribute any of that Request
	  instance's methods to the Class that we want, send for instance, could map to a
	  wrapped version that the Class augments.
2. The part that updates the google map and places the markers.

*/
