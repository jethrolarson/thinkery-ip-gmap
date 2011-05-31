
var PropertyWidget = new Class({
	
	Implements: [Events, Chain, Options],
	
	Binds: ['googleCallback', 'requestComplete', 'createMarker'],
	
	options: {
		ipbaseurl: '',
		showPreview: true,
		currencySeparator: ',',
		currencySymbol: '$',
		currencyPosition: 1, 
		marker: 'http://demo.thethinkery.net/components/com_iproperty/assets/images/map/icon56.png',
		text: {
			tprop: 'Results',
			price: 'Price',
			nolimit: 'No Limit',
			pid: 'Property ID',
			street: '<div>Street<span class="street_preview">(Click address to view listing)</span></div>',
			beds: 'Beds',
			baths: 'Baths',
			sqft: 'Ft<sup>2</sup>',
			preview: 'Preview',
			more: 'more',
			inputText: 'ID or Keyword',
			noRecords: 'Sorry, no records were found. Please try again.',
			previous: '&#706 Previous ',
			next: 'Next &#707',
			of: 'of'
		},
		map: {
			zoom: 10,
			maxZoom: 12,
			streetViewControl: false,
			mapTypeId: google.maps.MapTypeId.ROADMAP, 
			lat: '47.6725282',
			lng: '-116.7679661'
		},
		search: {
			city: '',
			stype: '',
			limit: 10,
			limitstart: 0,
			search: '',
			option:'com_iproperty',
			view: 'advsearch',
			task:'ajaxSearch',
			ptype: '',
			hoa: '',
			format: 'raw',
			token: '37ad7e0abd0ecac15bbe6ccd88deb79d'
		},
		inputs: {
			'Sale Type': {
				tag: 'select',
				parameter: 'stype',
				value: { 'For Rent': 4, 'For Sale': 1 },
				events: {
					'change': function(event, element){
						// console.log(this, event, element);
						// 'this' will refer to the class instance within these events, as opposed to the element,
						// as it usually does in Element events. The element is passed as the second argument.
					}
				}
			},
			'Lot and Land': {
				tag: 'input',
				type: 'checkbox',
				group: 'ptypes',
				parameter: 'ptype',
				custom: true,
				value: 3
			},
			'Multi-Family': {
				tag: 'input',
				type: 'checkbox',
				group: 'ptypes',
				parameter: 'ptype',
				custom: true,
				value: 2
			},
			'Residential': {
				tag: 'input',
				type: 'checkbox',
				group: 'ptypes',
				parameter: 'ptype',
				custom: true,
				value: 1
			},
			'REO': {
				tag: 'input',
				type: 'checkbox',
				parameter: 'reo'
			},
			'HOA': {
				tag: 'input',
				type: 'checkbox',
				parameter: 'hoa'
			},
			'Water Front': {
				tag: 'input',
				type: 'checkbox',
				parameter: 'waterfront'
			}
		},
		sliders: {
			'Price': {
				steps: 300,
				range: [500, 800000],
				noLimit: true,
				labelUnit: '$',
				start: {
					parameter: 'price_low',
					initialStep: 0,
					offset: 2
				},
				end: {
					parameter: 'price_high',
					initialStep: 800000
				}
			},
			'Beds': {
				steps: 10,
				snap: true,
				start: {
					parameter: 'beds_low',
					initialStep: 0,
					offset: 2
				},
				end: {
					parameter: 'beds_high',
					initialStep: 10
				}
			},
			'Bathrooms': {
				steps: 10,
				snap: true,
				start: {
					parameter: 'baths_low',
					initialStep: 0,
					offset: 2
				},
				end: {
					parameter: 'baths_high',
					initialStep: 10
				}
			},
			'Square Feet': {
				steps: 300,
				range: [0, 65535],
				start: {
					parameter: 'sqft_low',
					initialStep: 0,
					offset: 2
				},
				end: {
					parameter: 'sqft_high',
					initialStep: 65535
				}
			}
		},
		templates:{
			slider: '<div class="property_slider">' +
						'<div class="slider_labels">' +
							'<span class="slider_label_min">No Limit</span>{title}<span class="slider_label_max">No Limit</span>' +
						'</div>' +
						'<div class="slider_element pressed">' +
							'<div class="slider_knob slider_knob_start"></div>' +
							'<div class="slider_knob slider_knob_end"></div>' +
						'</div>' +
					'</div>',
			infoWindow: '<div class="bubble">' +
							'{thumb}' +
							'<h4><a href="{proplink}">{street_address}, {city}</a></h4>' +
							'<div class="bubble_info"><strong>{pid}: </strong>{mls_id} | <strong>{price}: </strong>{formattedprice}</div>' +
							'<div class="bubble_desc">{short_description}<a href="{proplink}">({more})</a></div>' +
						'</div>',
			pager: '<li class="page_range">{pagecount}</li><li class="page_buttons">{previous}{next}</li>',
			pageButton: '<div class="page_button gradient-button {class}" style="display: {display};" />{value}</div>'
		}
	},
	
	initialize: function(element, options){
	
		this.setOptions(options);
		
		this.element = $(element);
		this.markers = {};
		this.sliders = [];
		this.inputs = [];
		this.query = {};
		this.page = this.options.search.limitstart / this.options.search.limit || 1;
		this.scroll = new Fx.Scroll(window, { duration: 400, transition: 'quad:out', offset: { y: -2 } });
		
		this.mapElement = new Element('div', {
			id: 'property_map',
			styles: {
				height: 300
			}
		});
		
		this.slidersElement = new Element('div', {id: 'property_sliders'});
		this.attributesPanel = new Element('div', {
			id: 'property_attributes',
			html: '<div class="property_attributes_wrap"><div class="property_attributes_inputs"></div></div><div class="property_attributes_button gradient-button">Search Options</div>',
			events: {
				'click:relay(div.property_attributes_button)': function(){
					var inputs = this.getPrevious().getFirst();
					if(!this.hasClass('pressed')) {
						this.addClass('pressed');
						inputs.reveal();
					}
					else{
						this.removeClass('pressed');
						inputs.dissolve();
					}
				}
			}
		});
		this.attributesPanel.getFirst().getFirst().set('reveal', { duration: 250, transition: 'circ:out' });
		this.propertyList = new Element('div', {id: 'property_list'});
		this.element.adopt([this.mapElement, this.slidersElement, this.attributesPanel, this.propertyList]);
		
		this.createMap();
		
		$each(this.options.inputs, function(v, k){
			this.addInput(k, v);
		}, this)
		
		$each(this.options.sliders, function(v, k){
			this.addSlider(k, v);
		}, this)
		
		this.request = new Request.JSON({
			method: 'get',
			url: this.options.ipbaseurl + 'index.php',
			onComplete: this.requestComplete
		});
		
		this.search();
		
	},
	
	createMap: function(){
		this.options.map.center = new google.maps.LatLng(this.options.map.lat, this.options.map.lng);
		this.mapInstance = new google.maps.Map(this.mapElement, this.options.map);
		this.infoWindow = new google.maps.InfoWindow({ maxWidth: 450 });
		this.mapSpinner = new Element('div',{id:'loading_div'}).inject(this.mapElement);
		this.mapCounter = new Element('span', { id: 'property_counter' }).inject(this.mapElement);
	},
	
	createMarker: function(house) {
		if(house.lat_pos && house.long_pos){
			var latlong = new google.maps.LatLng(house.lat_pos.toFloat(), house.long_pos.toFloat()),
			    marker = new google.maps.Marker({
					position: latlong,
					map: this.mapInstance,
					icon: this.options.marker
				}),
				html = this.getMarkerHtml(house);
				
			this.markers[house.id] = [marker, html];
			
			google.maps.event.addListener(marker, 'click', function() {
				this.openInfoWindow(house.id);
			}.bind(this));
			
			this.bounds.extend(latlong);
			
			return marker;
		}
		else return false;
	},
	 
	getMarkerHtml: function(house) {
		return this.options.templates.infoWindow.substitute(
			$merge(house, {
				street_address: house.street_address.clean(),
				city: house.city.clean(),
				short_description: house.short_description.slice(0,185).trim() + '...',
				thumb: ('<div class="bubble_image"><a href="{proplink}">{thumb}</a></div>').substitute(house),
				pid: this.options.text.pid,
				price: this.options.text.price,
				more: this.options.text.more
			})
		);
	},
	
	addInput: function(title, options){
		var self = this,
			inputWrap = this.attributesPanel.getFirst().getFirst(),
			change = function(){
				if(self.request){
					self.page = 1;
					self.search();
				}
			},
			input = new Element(options.tag, $merge({ 'title': title }, options, {
				'events': $H(options.events || {}).map(function(fn){ return function(e){ fn.call(self, e, this) }; })
			})).inject(
				(options.group) ? ($('property_fieldset_' + options.group) || new Element('fieldset', { id: 'property_fieldset_' + options.group }).inject(inputWrap)) : inputWrap
			);
			
			input.addEvent.apply(input, (options.type == 'checkbox') ? ['mouseup', change] : ['change', change]);
		
		switch(options.type || options.tag){
			case 'select':
				[title, $H(options.value).getKeys()].flatten().each(function(option){
					new Element('option', {
						'text': option,
						'value': options.value[option]
					}).inject(input);
				});
			break;
			case 'checkbox': new Element('label', { text: title, value: options.value }).wraps(input); break;
		}
		
		this.inputs.push(input);
		
		return this;
	},
	
	addSlider: function(title, options){
		var elements = Elements.from(this.options.templates.slider.substitute({title: title}))[0].inject(this.slidersElement),
			slider = new Slider.Extra(elements.getElement('.slider_element')),
			minLabel = elements.getElement('.slider_label_min'),
			maxLabel = elements.getElement('.slider_label_max');
		
		slider.addRange($merge({
			start: {
				knob: elements.getElement('.slider_knob_start'),
				onChange: function(step){
					var opt = this.options;
					minLabel.set('text', (opt.noLimit && opt.range.contains(this.previousChange)) ? 'No Limit' : (opt.labelUnit || '') + step);
				}
			},
			end: {
				knob: elements.getElement('.slider_knob_end'),
				onChange: function(step){
					var opt = this.options;
					maxLabel.set('text', (opt.noLimit && opt.range.contains(this.previousChange)) ? 'No Limit' : (opt.labelUnit || '') + step);
				}
			},
			onComplete: function(){
				if(this.request){
					this.page = 1;
					this.search();
				}
			}.bind(this)
		}, options));
		
		this.sliders.push(slider);
		
		return this;
	},
	
	createTable: function(data) {
	
		var options = this.options.search,
			tableHeaders = [];
		
		['price', 'pid', 'street', 'beds', 'baths', 'sqft', 'preview'].each(function(e){
			tableHeaders.push({ content: this.options.text[e] });
		}, this);
		
		this.table = new HtmlTable({
			properties: {
				'id': 'prop_table'
			},
			headers: tableHeaders
		}).enableSort();
		
		var infoOpener = function(e){
			this.openInfoWindow(e.target.get('resultid'))
		}.bind(this);
		
		this.table.toElement().addEvents({
			'mouseover:relay(a[preview=mouseover])': infoOpener,
			'click:relay(a[preview=click])': function(e){
				this.scroll.toElement(this.element).chain(function(){ infoOpener(e) });
			}.bind(this)
		}).inject(this.propertyList);
		
		this.createPaging();
		
		return this;
	},
	
	createPaging: function(){
		var pagingClick = {
				'mousedown:relay(div.page_button)': function(){
					this.addClass('pressed');
				},
				'mouseup:relay(div.page_button)': function(){
					this.removeClass('pressed');
				},
				'click:relay(div.previous_page)': function(e){
					if(this.page > 1){
						this.page--;
						this.search();
					}
				}.bind(this),
				'click:relay(div.next_page)': function(e){
					if(this.checkLimit(this.page + 1)){
						this.page++;
						this.search();
					}
				}.bind(this)
			},
			table = this.table.toElement();
			
		this.pagers = [
			new Element('ul', {
				'class': 'property_pager',
				'events': pagingClick
			}).inject(table, 'before')
		];	
			
		this.pagers.push(this.pagers[0].clone().addEvents(pagingClick).inject(table, 'after'));
			
		return this;
	},
	/*
	formatCurrency: function(num) {
		var symbol = this.options.currencySymbol,
			split = (num + '').split('.'),
			wholes = split[0],
			rgx = /(\d+)(\d{3})/;

		while (rgx.test(wholes)) wholes = wholes.replace(rgx, '$1' + this.options.currencySeparator + '$2');
		
		num = wholes + split.length > 1 ? '.' + split[1] : '';
		
		return (this.options.currencyPosition == 1) ? num + ' ' + symbol : symbol + num;
	},
	*/
	checkLimit: function(page){
		var limit = this.options.search.limit,
			max = page * limit;
		
		return (page > 0 && this.totalCount >= max - limit &&  max <= this.totalCount) ? true : false;
	},
	
	getSliderValues: function(){
		var query = {};
		this.slidersElement.getElements('div.slider_knob').retrieve('slider').each(function(slider){
			var opt = slider.options;
			query[opt.parameter] = (opt.noLimit && opt.range.contains(slider.previousChange)) ? '' : slider.previousChange;
		});
		return query;
	},
	
	getInputValues: function(){
		var query = {};
		this.attributesPanel.getElements('[parameter]').each(function(input){
			var param = input.get('parameter'),
				type = input.get('type'),
				isCustom = !!input.get('custom'),
				value = (isCustom) ? ((query[param]) ? ',' : '') + input.value : (type == 'checkbox') ? 1 : input.value,
				blank = (isCustom) ? '' : 0;
			
			// The following line is way more hard-coded that it should be; required to accomodate specific API choices for ptype parameter values
			query[param] = (query[param] || '') + ((type == 'checkbox') ? ((input.checked) ? value : blank) : value);
		});
		return query;
	},
	
	search: function(){
		this.mapSpinner.show();
		this.query = $merge(this.options.search, { //get the value of the form elements associated with the search options
				limitstart: this.page * this.options.search.limit - this.options.search.limit
			},
			this.getSliderValues(),
			this.getInputValues()
		);

		this.request.send({data: this.query});
	},
	
	requestComplete: function(data){
		this.fireEvent('requestComplete');
		this.results = data;
		this.totalCount = data[0].totalcount;
		this.mapCounter.set('html', this.totalCount || 0);
		this.updateMap(data);
		this.updateTable(data);
		this.updatePaging(data);
		this.mapSpinner.hide();
	},
	
	updateMap: function(data){
		$each(this.markers, function(marker, id, markers){
			marker[0].setMap(null);
			delete markers[id];
		});
		
		this.bounds = new google.maps.LatLngBounds();
		data.each(this.createMarker);
		if(this.totalCount > 0) this.mapInstance.fitBounds(this.bounds);
		
		return this;
	},
	
	updateTable: function(data){
		if(!this.table) this.createTable(data);
		
		this.table.empty();
		
		var options = this.options.search,
			tableRows = [];
			
		if (this.totalCount > 0) {
			data.each(function(e, i){
				var hasMarker = this.markers[e.id],
					row = [
						e.formattedprice,
						e.mls_id,
						'<a resultid="' + e.id + '" href="' + e.proplink + '" ' + ((this.options.showPreview && hasMarker) ? 'preview="mouseover"' : '') + '>' + e.street_address.clean() + ', ' + e.city.clean() + '</a>',
						e.beds,
						'<div class="ip_centered baths">' + e.baths + '</div>',
						e.sqft,
						(hasMarker) ? '<a resultid="' + e.id + '" href="#preview_'+ e.id +'" preview="click">' + this.options.text.preview + '</a>' : '--'
					];
				tableRows.push(row);
				
			}, this);
		}
		else {
			tableRows.push([{
				content: this.options.text.noRecords,
				properties: {
					'colspan': 7,
					'align': 'center'
				}
			}]);
		}
		
		tableRows.each(function(row){ this.table.push(row) }, this);
		
		return this;
	},
		
	updatePaging: function(data){
		var options = this.options.search,
			prevLimit = (this.page * options.limit - options.limit).limit(0, this.totalCount),
			nextLimit = (this.page * options.limit).limit(0, this.totalCount),
			pagingData = {
				pagecount: this.options.text.tprop + ': ' + prevLimit + ' - ' + nextLimit + ' ' + this.options.text.of + ' ' + this.totalCount,
				previous: this.options.templates.pageButton.substitute({
					'class': 'previous_page',
					'value': this.options.text.previous,
					'display': (!prevLimit) ? 'none' : 'block'
				}),
				next: this.options.templates.pageButton.substitute({
					'class': 'next_page',
					'value': this.options.text.next,
					'display': (nextLimit == this.totalCount) ? 'none' : 'block'
				})
			};
			
		this.pagers.each(function(pager){
			pager.set('html', this.options.templates.pager.substitute(pagingData));
		}, this);
			
		return this;
	},
	
	openInfoWindow: function(id) {
		var marker = this.markers[id];
		this.infoWindow.setContent(marker[1])
		this.infoWindow.open(this.mapInstance, marker[0]);
	}
	
});

window.addEvent('domready', function(){

	new PropertyWidget('maincontent-block', {
		ipbaseurl: 'http://demo.thethinkery.net/',
		search: {
			limit: 3
		}
	});

});
