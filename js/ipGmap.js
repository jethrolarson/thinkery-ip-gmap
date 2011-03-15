
var PropertyWidget = new Class({
	
	Implements: [Events, Chain, Options],
	
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
		},
		templates:{
			slider: '<div class="property_slider">' +
						'<div class="slider_labels">' +
							'<span class="slider_label_min">No Limit</span>{title}<span class="slider_label_max">No Limit</span>' +
						'</div>' +
						'<div class="slider_element"></div>' +
					'</div>'
		}
		// New options:
	},
	
	initialize: function(element, options){
		this.setOptions(options);
		
		this.element = $(element);
		this.markers = {};
		this.sliders = [];
		this.query = {};
		
		this.request = new Request.JSON({
			method: 'get',
			url: this.options.ipbaseurl + 'index.php',
			onComplete: this.eSearchLoad.bind(this)
			//Shouldn't we have handlers for errors?
		});
		//create DOM
		this.loadingElement = new Element('div',{id:'loading_div',text: 'Loading...'});
		this.mapElement = new Element('div', {id: 'property_map', text: 'Loading Map...'});
		this.slidersElement = new Element('div', {id: 'property_sliders'});
		this.propertyList = new Element('div', {id: 'property_list'});
		$$(this.loadingElement, this.mapElement, this.propertyList).inject(this.element);
		this.createMap();
		this.search();
		// Slider creation needed here
	},
	eSearchLoad: function(data){
		this.results = data;
		this.loadingElement.hide();
		this.updateTable();
		this.updateMap();
	},
	createMap: function(){
		//Do we want to try to get GEO?
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
		this.loadingElement.show();
		this.query = $merge(this.options.searchOptions,{ //get the value of the form elements associated with the search options
			//search: this.searchInput.value,
			//limit: document.slider_search.limit.value,
			//limitstart: document.slider_search.limitstart.value  || 0,
			//city: this.cityInput.value,
			//stype: this.stypeInput.value,
			//hoa: this.options.showHoa ? this.hoaInput.checked ? 1:0 :'',
			//reo: this.options.showReo ?this.reoInput.checked ? 1:0 : '',
			//waterfront: this.options.showWf ?this.waterfrontInput.checked ? 1:0 : '',
		});
		
		var ptype = $$("[name=ptype[]]");
		if(ptype) this.query.ptype = ptype.map(function(e){
						if(e.checked) return e.value;
					}).join(',');

		this.request.send({data: this.query});
	},
	
	sqft_slider: function(bg, startThumb, endThumb, minValue, maxValue, initialMin, initialMax, aSliderName, options) {
		
		var elements = Elements.from(this.options.templates.slider.substitute({title: aSliderName}))[0].inject(this.slidersElement),
			slider = new Slider.Extra(elements.getElement('slider_element'));
			minLabel = elements.getElement('slider_label_min'),
			maxLabel = elements.getElement('slider_label_max');
			
			slider.addRange(new Element('div', {'class': 'slider_knob_start'}), new Element('div', {'class': 'slider_knob_end'}), {
				steps: maxValue - minValue,
				start: {
					initialStep: initialMin - minValue,
					onChange: function(step){
						minLabel.set('text', '$' + (minValue + step * this.stepSize));
					},
				},
				end: {
					initialStep: maxValue - initialMax,
					onChange: function(step){
						maxLabel.set('text', '$' + (minValue + step * this.stepSize));
					}
				},
				onComplete: this.search
			});
			
		this.sliders.push(slider);
		
		// This comment from The Thinkery
			/*
			 *TODO: recall set values
			 *use this method to recall saved searches
			 *and previous searches when implemented
			 *where 8000 would be the recalled min value
			 *
			 *dual_slider.setMinValue(Math.round((8000-startmin) / scaleFactor));
			 *
			 */
	},
	
	beds_slider: function(bg, startThumb, endThumb, minValue, maxValue, initialMin, initialMax, aSliderName, options) {
	
		var elements = Elements.from(this.options.templates.slider.substitute({title: aSliderName}))[0].inject(this.slidersElement),
			slider = new Slider.Extra(elements.getElement('slider_element'));
			minLabel = elements.getElement('slider_label_min'),
			maxLabel = elements.getElement('slider_label_max');
			
			slider.addRange(new Element('div', {'class': 'slider_knob_start'}), new Element('div', {'class': 'slider_knob_end'}), {
				steps: maxValue - minValue,
				start: {
					initialStep: initialMin - minValue,
					onChange: function(step){
						minLabel.set('text', '$' + (minValue + step * this.stepSize));
					},
				},
				end: {
					initialStep: maxValue - initialMax,
					onChange: function(step){
						maxLabel.set('text', '$' + (minValue + step * this.stepSize));
					}
				},
				onComplete: this.search
			});
			
		this.sliders.push(slider);
	},
	
	baths_slider: function(bg,minthumb,maxthumb,minvalue,maxvalue,startmin,startmax,aSliderName,options) {
		var elements = Elements.from(this.options.templates.slider.substitute({title: aSliderName}))[0].inject(this.slidersElement),
			slider = new Slider.Extra(elements.getElement('slider_element'));
			minLabel = elements.getElement('slider_label_min'),
			maxLabel = elements.getElement('slider_label_max');
			
			slider.addRange(new Element('div', {'class': 'slider_knob_start'}), new Element('div', {'class': 'slider_knob_end'}), {
				steps: maxValue - minValue,
				start: {
					initialStep: initialMin - minValue,
					onChange: function(step){
						minLabel.set('text', '$' + (minValue + step * this.stepSize));
					},
				},
				end: {
					initialStep: maxValue - initialMax,
					onChange: function(step){
						maxLabel.set('text', '$' + (minValue + step * this.stepSize));
					}
				},
				onComplete: this.search
			});
			
		this.sliders.push(slider);
	},
	
	price_slider: function(bg,minthumb,maxthumb,minvalue,maxvalue,startmin,startmax,aSliderName,options) {
		var elements = Elements.from(this.options.templates.slider.substitute({title: aSliderName}))[0].inject(this.slidersElement),
			slider = new Slider.Extra(elements.getElement('slider_element'));
			minLabel = elements.getElement('slider_label_min'),
			maxLabel = elements.getElement('slider_label_max');
			
			slider.addRange(new Element('div', {'class': 'slider_knob_start'}), new Element('div', {'class': 'slider_knob_end'}), {
				steps: maxValue - minValue,
				start: {
					initialStep: initialMin - minValue,
					onChange: function(step){
						minLabel.set('text', '$' + (minValue + step * this.stepSize));
					},
				},
				end: {
					initialStep: maxValue - initialMax,
					onChange: function(step){
						maxLabel.set('text', '$' + (minValue + step * this.stepSize));
					}
				},
				onComplete: this.search
			});
			
		this.sliders.push(slider);
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
	updateMap: function(){
		
	},
	updateTable: function(){
		
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

new PropertyWidget();

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
