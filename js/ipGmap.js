
var Slider = new Class({

	Implements: [Events, Options],

	Binds: ['clickedElement', 'draggedKnob', 'scrolledElement'],

	options: {
		//onTick: function(intPosition){},
		//onChange: function(intStep){},
		//onComplete: function(strStep){},
		onTick: function(position){
			this.setKnobPosition(position);
		},
		onStart: function(){
			this.draggedKnob();
		},
		onDrag: function(){
			this.draggedKnob();
		},
		initialStep: 0,
		snap: false,
		offset: 0,
		range: false,
		wheel: false,
		steps: 100,
		mode: 'horizontal'
	},

	initialize: function(element, knob, options){
		this.setOptions(options);
		options = this.options;
		this.element = document.id(element);
		knob = this.knob = document.id(knob);
		this.previousChange = this.previousEnd = this.step = -1;

		var limit = {},
			modifiers = {x: false, y: false};

		switch (options.mode){
			case 'vertical':
				this.axis = 'y';
				this.property = 'top';
				this.offset = 'offsetHeight';
				break;
			case 'horizontal':
				this.axis = 'x';
				this.property = 'left';
				this.offset = 'offsetWidth';
		}

		this.setSliderDimensions();
		this.setRange(options.range);

		if (knob.getStyle('position') == 'static') knob.setStyle('position', 'relative');
		knob.setStyle(this.property, -options.offset);
		modifiers[this.axis] = this.property;
		limit[this.axis] = [-options.offset, this.full - options.offset];

		var self = this,
			dragOptions = {
				snap: 0,
				limit: limit,
				modifiers: modifiers,
				onBeforeStart: function(knob, event){
					self.fireEvent('beforeStart', [knob, event]);
					self.isDragging = true;
				},
				onStart: function(knob, event){
					self.fireEvent('start', [knob, event]);
				},
				onDrag: function(knob, event){
					self.fireEvent('drag', [knob, event]);
				},
				onCancel: function(){
					self.isDragging = false;
				},
				onComplete: function(){
					self.isDragging = false;
					self.draggedKnob();
					self.end();
				}
		};
		if (options.snap) this.setSnap(dragOptions);

		this.drag = new Drag(knob, dragOptions);
		this.attach();
		if (options.initialStep != null) this.set(options.initialStep);
	},

	attach: function(){
		this.element.addEvent('mousedown', this.clickedElement);
		if (this.options.wheel) this.element.addEvent('mousewheel', this.scrolledElement);
		this.drag.attach();
		return this;
	},

	detach: function(){
		this.element.removeEvent('mousedown', this.clickedElement)
					.removeEvent('mousewheel', this.scrolledElement);
		this.drag.detach();
		return this;
	},

	autosize: function(){
		this.setSliderDimensions()
			.setKnobPosition(this.toPosition(this.step));
		this.drag.options.limit[this.axis] = [-this.options.offset, this.full - this.options.offset];
		if (this.options.snap) this.setSnap();
		return this;
	},

	setSnap: function(options){
		if (!options) options = this.drag.options;
		options.grid = Math.ceil(this.stepWidth);
		options.limit[this.axis][1] = this.element[this.offset];
		return this;
	},

	setKnobPosition: function(position){
		if (this.options.snap) position = this.toPosition(this.step);
		this.knob.setStyle(this.property, position);
		return this;
	},

	setSliderDimensions: function(){
		this.full = this.element.measure(function(){
			this.half = this.knob[this.offset] / 2;
			return this.element[this.offset] - this.knob[this.offset] + (this.options.offset * 2);
		}.bind(this));
		return this;
	},

	set: function(step){
		if (!((this.range > 0) ^ (step < this.min))) step = this.min;
		if (!((this.range > 0) ^ (step > this.max))) step = this.max;

		this.step = Math.round(step);
		return this.checkStep()
			.fireEvent('tick', this.toPosition(this.step))
			.end();
	},

	setRange: function(range, pos){
		this.min = $pick(range[0], 0);
		this.max = $pick(range[1], this.options.steps);
		this.range = this.max - this.min;
		this.steps = this.options.steps || this.full;
		this.stepSize = Math.abs(this.range) / this.steps;
		this.stepWidth = this.stepSize * this.full / Math.abs(this.range);
		if (range) this.set($pick(pos, this.step).floor(this.min).max(this.max));
		return this;
	},

	clickedElement: function(event){
		if (this.isDragging || event.target == this.knob) return;

		var dir = this.range < 0 ? -1 : 1,
			position = event.page[this.axis] - this.element.getPosition()[this.axis] - this.half;
			position = position.limit(-this.options.offset, this.full - this.options.offset);

		this.step = Math.round(this.min + dir * this.toStep(position));
		this.checkStep()
			.fireEvent('tick', position)
			.end();
	},

	scrolledElement: function(event){
		var mode = (this.options.mode == 'horizontal') ? (event.wheel < 0) : (event.wheel > 0);
		this.set(this.step + (mode ? -1 : 1) * this.stepSize);
		event.stop();
	},

	draggedKnob: function(){
		var dir = this.range < 0 ? -1 : 1,
			position = this.drag.value.now[this.axis];
			position = position.limit(-this.options.offset, this.full -this.options.offset);

		this.step = Math.round(this.min + dir * this.toStep(position));
		
		this.checkStep();
	},
	
	checkStep: function(){
		var step = this.step;
		this.knob.setStyle(this.property, this.toPosition(this.step));
		if (this.previousChange != step){
			this.previousChange = step;
			this.fireEvent('change', step);
		}
		return this;
	},

	end: function(){
		var step = this.step;
		if (this.previousEnd !== step){
			this.previousEnd = step;
			this.fireEvent('complete', step + '');
		}
		return this;
	},

	toStep: function(position){
		var step = (position + this.options.offset) * this.stepSize / this.full * this.steps;
		return this.options.steps ? Math.round(step -= step % this.stepSize) : step;
	},

	toPosition: function(step){
		return (this.full * Math.abs(this.min - step)) / (this.steps * this.stepSize) - this.options.offset;
	},
	
	toElement: function(){
		return this.knob;
	}

});


/*
---

script: Slider.Extra.js

name: Slider.Extra

description: Class for creating horizontal and vertical slider controls.

license: MIT-style license

authors:
  - Daniel Buchner

requires:
  - Core/Element.Dimensions
  - /Class.Binds
  - /Drag
  - /Element.Measure
  - /Slider

provides: [Slider.Extra]

...
*/

Slider.Extra = new Class({
	
	Binds: ['setLast', 'startResize', 'endResize'],
	
	Implements: [Events, Options],
	
	options: {
		collision: false,
		rangeBackground: '#64992C',
		initialStep: 0,
		snap: false,
		offset: 0,
		range: false,
		steps: 100,
		mode: 'horizontal'
	},
	
	initialize: function(element, options){
		this.setOptions(options);
		
		this.element = $(element);
		this.sliders = [];
		this.bands = [];
		this.mode = (this.options.mode == 'horizontal') ? ['100%', 'auto', 'right', 'x'] : ['auto', '100%', 'bottom', 'y'];
		
		if (this.element.getStyle('position') == 'static') this.element.setStyle('position', 'relative');
	},
	
	setLast: function(slider, event, useExisting){
		var last = slider.last;
		
		last.value = slider.drag.value.now[slider.axis];
		last.style = slider.knob.getStyle(slider.property).toInt();
		last.direction = last.direction || 0;
		last.bounds = this.getBounds(slider);
		
		return this;
	},
	
	getBounds: function(slider){
		var bounds = { '-1': undefined, '1': undefined },
			last = slider.last;
			
		this.sliders.each(function(e){
			if(e.options.collision && e.knob != slider.knob || e.relatedSlider && e.relatedSlider.knob == slider.knob){
				var style = e.knob.getStyle(e.property).toInt();
				if (style < last.style || style == last.style && last.direction == -1) bounds['-1'] = (style > bounds['-1']) ? style : bounds['-1'] || style;
				if (style > last.style || style == last.style && last.direction == 1) bounds['1'] = (style < bounds['1']) ? style : bounds['1'] || style;
			}
		});
		
		return bounds;
	},
	
	detectCollision: function(slider, event){
		var value = slider.drag.value.now[slider.axis],
			last = slider.last,
			diff = value - last.value,
			direction = (Math.abs(diff) == diff) ? 1 : -1,
			bound = last.bounds[direction];
		
		if (direction == 1 && value >= bound || direction == -1 && value <= bound) {
			slider.knob.setStyle(slider.property, bound);
			last.direction = direction;
			
			var boundStep = slider.toStep(bound);
			if(slider.step != boundStep){
				slider.step = boundStep;
				slider.checkStep();
			}
		}
		else {
			slider.draggedKnob();
			last.value = value;
		}
		
		return this;
	},
	
	addKnob: function(knob, options, internal){
		var self = this,
			slider = new Slider(
				this.element,
				knob.setStyles({ 'position': 'absolute', 'z-index': 3 }).inject(this.element),
				$merge({}, this.options, options || {}, { wheel: false, mode: this.options.mode })
			).addEvents({
				beforeStart: function(knob, event){
					self.raiseKnob(knob);
					self.setLast(this, event);
				},
				start: function(knob, event){
					this.draggedKnob();
					self.setLast(this, event);
				},
				drag: function(knob, event){
					self.detectCollision(this, event);
				},
				complete: function(){
					this.step = this.toStep(this.knob.getStyle(this.property).toInt());
				}
			}).detach();
		
		slider.last = {};
		slider.drag.attach().removeEvents('complete').addEvent('complete', function(knob, event){
			slider.isDragging = false;
			self.detectCollision(slider, event);
			slider.end()
		});
		
		knob.store('slider', slider);
		this.sliders.push(slider);
		
		return (internal) ? slider : slider.knob;
	},
	
	addRange: function(options){
		var options = this.getRangeOptions(options),
			start = this.addKnob(options.start.knob, options.start, true),
			end = this.addKnob(options.end.knob, options.end, true),
			band = new Element('div', $merge({
				'class': 'slider_band',
				'styles': {
					position: 'absolute',
					height: this.mode[0],
					width: this.mode[1],
					background: this.options.rangeBackground,
					zIndex: 1
				}
			}, options.band || {})),
			range = {
				'band': band,
				'knobs': {
					'start': start.knob,
					'end': end.knob
				},
				'sliders': {
					'start': start,
					'end': end
				}
			};
		
		start.relatedSlider = end;
		end.relatedSlider = start;
		
		this.attachResize(range);
		$$(start.knob, end.knob, band).store('range', range);
		
		this.bands.push(band.inject(this.element));
		
		return this;
	},
	
	getRangeOptions: function(options){
		options.start = $merge(options.start, options);
		options.end = $merge(options.end, options);
		
		if(options.end.initialStep < options.start.initialStep) options.end.initialStep = options.start.initialStep;
		
		return options;
	},
	
	raiseKnob: function(knob){
		this.sliders.each(function(e){ e.knob.setStyle('z-index', 3) });
		knob.setStyle('z-index', 4);
		
		var range = knob.retrieve('range');
		if(range){
			this.bands.each(function(band){ band.setStyle('z-index', 1) });
			range.band.setStyle('z-index', 2);
		}
		
		return this;
	},
	
	attachResize: function(range){
		['start', 'end'].each(function(knob, i){
			var resize = this[knob + 'Resize'].pass([range.sliders[knob], range.band]);
			range.sliders[knob].drag.addEvent('drag', resize);
			resize();	
		}, this);
		
		return this;
	},
	
	startResize: function(slider, band){
		band.setStyle(slider.property, slider.knob.getStyle(slider.property));
		return this;
	},
	
	endResize: function(slider, band){
		band.setStyle(this.mode[2], this.element.getSize()[this.mode[3]] - slider.knob.getCoordinates(this.element)[this.mode[2]]);
		return this;
	}

});


var langText = {};
langText.tprop = 'Results';
langText.price = 'Price';
langText.nolimit = 'No Limit';
langText.pid = 'Property ID';
langText.street = '<div>Street<span class="street_preview">(Click address to view listing)</span></div>';
langText.beds = 'Beds';
langText.baths = 'Baths';
langText.sqft = 'Ft<sup>2</sup>';
langText.preview = 'Preview';
langText.more = 'more';
langText.inputText = 'ID or Keyword';
langText.noRecords = 'Sorry, no records were found. Please try again.';
langText.previous = '&#706; Previous ';
langText.next = 'Next &#707;';
langText.of = 'of';




/*
 *
 *
    End Slider.Extra Class
 *
 *
 */


var PropertyWidget = new Class({
	
	Implements: [Events, Chain, Options],
	
	Binds: ['googleCallback', 'requestComplete', 'createMarker'],
	
	options: {
		ipbaseurl: '',
		showHoa: false,
		showReo: false,
		showWf: false,
		sliderLength: 300,
		itemId: 150,
		showPreview: 1,
		noLimit: 0,
		startPage: 1,
		currencySeparator: ',',
		currencySymbol: '$',
		currencyPosition: 1, 
		marker: 'http://demo.thethinkery.net/components/com_iproperty/assets/images/map/icon56.png',
		map: {
			zoom: 10,
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
						// this == the class instance, as opposed to the element,
						// the element is passed as the second argument instead.
					}
				}
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
						'<div class="slider_element">' +
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
			html: '<div class="property_attributes_inputs"></div><div class="property_attributes_button gradient-button">Search Options</div>',
			events: {
				'click:relay(div.property_attributes_button)': function(){
					if(!this.hasClass('pressed')) this.addClass('pressed').getPrevious().set('tween', { duration: 250, transition: 'circ:out' }).tween('height', 60);
					else this.removeClass('pressed').getPrevious().tween('height', 0);
				}
			}
		});
		
		this.propertyList = new Element('div', {id: 'property_list'});
		
		this.element.adopt(this.mapElement, this.slidersElement, this.attributesPanel, this.propertyList);
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
			//Shouldn't we have handlers for errors? --> Sure! Wanna add one?
		});
		
		this.search();
		
	},
	
	createMap: function(){
		//Do we want to try to get GEO?
		this.options.map.center = new google.maps.LatLng(this.options.map.lat, this.options.map.lng);
		this.mapInstance = new google.maps.Map(this.mapElement, this.options.map);
		this.infoWindow = new google.maps.InfoWindow({ maxWidth: 450 });
		this.loadingElement = new Element('div',{id:'loading_div'}).inject(this.mapElement);
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
				pid: langText.pid,
				price: langText.price,
				more: langText.more
			})
		);
	},
	
	addInput: function(title, options){
		var self = this,
			input = new Element(options.tag, {
				'title': title,
				'type': options.type || null,
				'parameter': options.parameter,
				'events': $H(options.events || {}).map(function(fn){ return function(e){ fn.call(self, e, this) }; }) 
			}).inject(this.attributesPanel.getFirst());
			
		input.addEvent('change', function(){
			if(self.request){
				self.page = 1;
				self.search();
			}
		});
		
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
					minLabel.set('text', (options.labelUnit || '') + step);
				},
			},
			end: {
				knob: elements.getElement('.slider_knob_end'),
				onChange: function(step){
					maxLabel.set('text', (options.labelUnit || '') + step);
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
		
		//$('advmap_counter').set('html', totalCount);
		
		['price', 'pid', 'street', 'beds', 'baths', 'sqft', 'preview'].each(function(e){
			tableHeaders.push({ content: langText[e] });
		});
		
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
		var parameters = {};
		this.slidersElement.getElements('div.slider_knob').retrieve('slider').each(function(slider){
			parameters[slider.options.parameter] = slider.previousChange;
		});
		return parameters;
	},
	
	getInputValues: function(){
		var parameters = {};
		this.attributesPanel.getElements('[parameter]').each(function(input){
			parameters[input.get('parameter')] = (input.get('type') == 'checkbox') ? ((input.checked) ? 1 : 0) : input.value;
		});
		return parameters;
	},
	
	search: function(){
		this.loadingElement.show();
		this.query = $merge(this.options.search, { //get the value of the form elements associated with the search options
				limitstart: this.page * this.options.search.limit - this.options.search.limit
			},
			this.getSliderValues(),
			this.getInputValues()
		);
			//,
			//$H(this.inputs).map(function(e){ return e.value; })
			//stype: this.stypeInput.value,
			//hoa: this.options.showHoa ? this.hoaInput.checked ? 1:0 :'',
			//reo: this.options.showReo ?this.reoInput.checked ? 1:0 : '',
			//waterfront: this.options.showWf ?this.waterfrontInput.checked ? 1:0 : '',
			
			/*
			baths_high	10
			baths_low	0
			beds_high	10
			beds_low	0
			c6435f61d0313bf5eace0fab1...	1
			city	
			country	
			county	
			format	raw
			hoa	0
			limit	10
			limitstart	0
			locstate	
			option	com_iproperty
			price_high	
			price_low	
			province	
			ptype	
			region	
			reo	0
			search	
			sqft_high	10000
			sqft_low	800
			stype	
			task	ajaxSearch
			view	advsearch
			waterfront	0
			*/
		
		/* var ptype = $$("[name=ptype[]]");
		if(ptype) this.query.ptype = ptype.map(function(e){
						if(e.checked) return e.value;
					}).join(','); */

		this.request.send({data: this.query});
	},
	
	requestComplete: function(data){
		this.fireEvent('requestComplete');
		this.results = data;
		this.totalCount = data[0].totalcount;
		this.updateMap(data);
		this.updateTable(data);
		this.updatePaging(data);
		this.loadingElement.hide();
	},
	
	updateMap: function(data){
		$each(this.markers, function(marker, id, markers){
			marker[0].setMap(null);
			delete markers[id];
		});
		data.each(this.createMarker);
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
						'<a resultid="' + e.id + '" href="' + e.proplink + '" ' + ((this.options.showPreview == 1 && hasMarker) ? 'preview="mouseover"' : '') + '>' + e.street_address.clean() + ', ' + e.city.clean() + '</a>',
						e.beds,
						e.baths,
						e.sqft,
						(hasMarker) ? '<a resultid="' + e.id + '" href="#preview_'+ e.id +'" preview="click">' + langText.preview + '</a>' : '--'
					];
				tableRows.push(row);
				
			}, this);
		}
		else {
			tableRows.push([{
				content: langText.noRecords,
				properties: {
					'colspan': 7,
					'align': 'center'
				}
			}]);
		}
		
		tableRows.each(function(row){
			this.table.push(row);
		}, this);
		
		return this;
	},
		
	updatePaging: function(data){
		var options = this.options.search,
			prevLimit = (this.page * options.limit - options.limit).limit(0, this.totalCount),
			nextLimit = (this.page * options.limit).limit(0, this.totalCount),
			pagingData = {
				pagecount: langText.tprop + ': ' + prevLimit + '-' + nextLimit + ' ' + langText.of + ' ' + this.totalCount,
				previous: this.options.templates.pageButton.substitute({
					'class': 'previous_page',
					'value': langText.previous,
					'display': (!prevLimit) ? 'none' : 'block'
				}),
				next: this.options.templates.pageButton.substitute({
					'class': 'next_page',
					'value': langText.next,
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
		this.infoWindow.close();
		this.infoWindow.setContent(marker[1])
		this.infoWindow.open(this.mapInstance, marker[0]);
	}
	
});


// Testing stuff

var loadCSS = function(url, callback){
	var link = Asset.css(url);
	var img = new Element('img', {
		events: {
			error: function(e){
				if(callback) callback(link);
				img.destroy();
			}
		}
	}).inject($$('html')[0]);
	
	img.src = url;
}

loadCSS('http://www.backalleycoder.com/thinkery/css/widget.css', function(){

new PropertyWidget('maincontent-block', {
	ipbaseurl: 'http://demo.thethinkery.net/',
	sliderLength: 300,
	itemId: 99999,
	showPreview: 1,
	noLimit: 0,
	showPreview: 1,
	currencySymbol: '$',
	currencyPos: 0,
	currencyFormat: 1,
	maxZoom: 21,
	thumbnail: 1,
	search: {
		limit: 3
	}
});

});
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

