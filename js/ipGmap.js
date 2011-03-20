
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
				$merge({}, this.options, options || {}, {
					wheel: false,
					mode: this.options.mode,
					onBeforeStart: function(knob, event){
						self.raiseKnob(knob);
						self.setLast(this, event);
					},
					onStart: function(knob, event){
						this.draggedKnob();
						self.setLast(this, event);
					},
					onDrag: function(knob, event){
						self.detectCollision(this, event);
					},
					onComplete: function(){
						this.step = this.toStep(this.knob.getStyle(this.property).toInt());
					}
				})
			).detach();
		
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
				styles: {
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








/*
 *
 *
    End Slider.Extra Class
 *
 *
 */


var PropertyWidget = new Class({
	
	Implements: [Events, Chain, Options],
	
	Binds: ['googleCallback', 'requestComplete'],
	
	options: {
		ipbaseurl: '',
		showHoa: false,
		showReo: false,
		showWf: false,
		sliderLength: 300,
		itemId: 150,
		showPreview: 1,
		noLimit: 0,
		map: {
			zoom: 10,
			mapTypeId: google.maps.MapTypeId.ROADMAP, 
			lat: '47.6725282',
			lng: '-116.7679661'
		},
		search: {
			city: '',
			stype: '',
			limit: 20,
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
		templates:{
			slider: '<div class="property_slider">' +
						'<div class="slider_labels">' +
							'<span class="slider_label_min">No Limit</span>{title}<span class="slider_label_max">No Limit</span>' +
						'</div>' +
						'<div class="slider_element">' +
							'<div class="slider_knob_start"></div>' +
							'<div class="slider_knob_end"></div>' +
						'</div>' +
					'</div>',
			marker: '<div class="bubble">' +
						'<h4><a href="{proplink}">{street_address}, {city}</a></h4>' +
						'<p>' +
							'<b>{langText.pid}:</b>{mls_id}<br />' +
							'<b>{langText.price}:</b>{formattedprice}' +
						'</p>' +
						'{thumb}' +
						'<div class="bubble_desc">{desc}<a href="{url}">({langText.more})</a></div>' +
					'</div>',
			paging: '<tr><td class="ip_pagecount">{pagecount}</td><td class="ip_pagenav">{beginning}{end}</td></tr>', //No need for this to be a table/row setup, move to ul/li when ready
			pageButton: '<input type="button" class="ipbutton" value="{value}" limit="{limit}" style="display: {display};" />'
		},
		sliders: {
			'Price': {
				steps: 300,
				range: [500, 800000], 
				start: {
					initialStep: 0
				},
				end: {
					initialStep: 800000
				}
			},
			'Beds': {
				steps: 10,
				snap: true,
				start: {
					initialStep: 0
				},
				end: {
					initialStep: 10
				}
			},
			'Bathrooms': {
				steps: 10,
				snap: true,
				start: {
					initialStep: 0
				},
				end: {
					initialStep: 10
				}
			},
			'Square Feet': {
				steps: 300,
				range: [0, 65535], 
				start: {
					initialStep: 0
				},
				end: {
					initialStep: 65535
				}
			}
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
			onComplete: this.requestComplete
			//Shouldn't we have handlers for errors? --> Sure! Wanna add one?
		});
		//create DOM
		
		this.mapElement = new Element('div', {
			id: 'property_map',
			styles: {
				height: 300
			}
		});
		this.slidersElement = new Element('div', {id: 'property_sliders'});
		this.propertyList = new Element('div', {id: 'property_list'});
		
		this.element.adopt(this.mapElement, this.slidersElement, this.propertyList);
		this.createMap();
		
		$each(this.options.sliders, function(v, k){
			this.createSlider.apply(this, [k, v]);
		}, this);
		
		this.search();
		
	},
	
	createMap: function(){
		//Do we want to try to get GEO?
		this.options.map.center = new google.maps.LatLng(this.options.map.lat, this.options.map.lng);
		this.mapInstance = new google.maps.Map(this.mapElement, this.options.map);
		this.loadingElement = new Element('div',{id:'loading_div'}).inject(this.mapElement);
	},
	
	createMarker: function(input) {
		if(input.lat_pos && input.long_pos){
			var coord = new google.maps.LatLng(input.lat_pos,input.long_pos),
			    marker = new google.maps.Marker(coord, this.icon), //this.icon is replacing houseIcon the global, defined in the callback
			    html = this.getMarkerHtml(input);
				
			//this.bounds.extend(coord);
			
			google.maps.event.addListener(marker, "click", function() {
				this.openInfoWindowHtml(html);
			});

			//create map marker based on property id
			this.markers[input.id] = [marker, html];
			marker.setMap(this.mapInstance);
			
			return marker;
		}
		else return false;
	},
	
	getMarkerHtml: function(marker) {
	
		return this.options.templates.marker.substitute(
			$merge(marker, {
				street_address: marker.street_address.clean(),
				city: marker.city.clean(),
				short_description: marker.short_description.slice(0,205) + '...',
				thumb: ('<div class="bubble_image"><a href="{proplink}">{thumb}</a></div>').substitute(marker),
				langText: langText//hacky copy.
			})
		);
		
	},
	
	createSlider: function(title, options){
		var elements = Elements.from(this.options.templates.slider.substitute({title: title}))[0].inject(this.slidersElement),
			slider = new Slider.Extra(elements.getElement('.slider_element')),
			minLabel = elements.getElement('.slider_label_min'),
			maxLabel = elements.getElement('.slider_label_max');
		
		slider.addRange($merge({
			start: {
				knob: elements.getElement('.slider_knob_start'),
				onChange: function(step){
					minLabel.set('text', '$' + step);
				},
			},
			end: {
				knob: elements.getElement('.slider_knob_end'),
				onChange: function(step){
					maxLabel.set('text', '$' + step);
				}
			},
			onComplete: this.search	
		}, options));
		
		this.sliders.push(slider);
		
		return this;
	},
	
	createTable: function(data) {
	
		var options = this.options.search,
			totalCount = data[0].totalcount,
			tableHeaders = [];
		
		//$('advmap_counter').set('html', totalCount);
		
		$H({
			'price': 'currency',
			'pid': 'string',
			'street': 'string',
			'beds': 'number',
			'baths': 'number',
			'sqft': 'number',
			'preview': 'noaxis'
		}).each(function(v, k){
			tableHeaders.push({
				content: langText[k],
				properties: { axis: v }
			});
		});
		
		this.table = new HtmlTable({
			properties: {
				'id': 'prop_table'
			},
			headers: tableHeaders
		});
		
		this.table.toElement().addEvents({
			'mouseenter:relay(a[preview=mouseenter])': this.openInfoWindow,
			'click:relay(a[preview=click])': this.openInfoWindow
		}).inject(this.propertyList);
		
		// new sortableTable(this.table, {overCls: 'over', sortBy: 'DESC'}); FIXME: this is the old sortable table script, get this working with HtmlTable from More
		
		this.createPaging();
		
		return this;
	},
	
	createPaging: function(){
		var pagingClick = {
				'click:relay(input.ipbutton)': function(){
					var limit = e.target.get('limit');
					if(limit){ this.ajaxPage.pass(limit);}
				}.bind(this)
			},
			table = this.table.toElement();
			
		this.paging = [
			new Element('table', {
				'class': 'ip_pagination',
				'events': pagingClick
			}).inject(table, 'before')
		];	
			
		this.paging.push(this.paging[0].clone().addEvents(pagingClick).inject(table, 'after'));
			
		return this;
	},
	
	formatCurrency: function(num) {
		var symbol = this.options.currencySymbol,
			separator = (this.options.currencyFormat == 1) ? ',' : '.';

		num = num.toString().replace(/\$|\,/g, '');
		
		if(!$type(num)){
			num = 0;
			num = Math.floor(num * 100 + 0.50000000001); //sign = (num == (num = Math.abs(num)));
			num = Math.floor(num / 100).toString(); //cents = num%100;
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
		this.query = $merge(this.options.search,{ //get the value of the form elements associated with the search options
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
	
	requestComplete: function(data){
		this.fireEvent('requestComplete');
		this.results = data;
		this.loadingElement.hide();
		this.updateTable(data);
		//this.updateMap();
	},
	
	openInfoWindow: function(e) {
		var item = this.markers[e.target.id];
		item[0].openInfoWindowHtml(item[1]);
	},
	
	updateMap: function(){
		
	},
	
	updateTable: function(data){
		if(!this.table) this.createTable(data);
		
		this.table.empty();
		
		var options = this.options.search,
			totalCount = data[0].totalcount,
			tableRows = [];
			
		if (totalCount > 0){
			data.each(function(e, i){
				var marker = this.createMarker(e),
					row = [
						data[i].formattedprice,
						data[i].mls_id,
						'<a href="' + data[i].proplink + '" ' + ((this.options.showPreview == 1 && marker) ? 'preview="mouseenter"' : '') + '">' + data[i].street_address.clean() + ', ' + data[i].city.clean() + '</a>',
						data[i].beds,
						data[i].baths,
						data[i].sqft,
						(marker) ? '<a href="#" preview="click">' + langText.preview + '</a>' : '--'
					];
				tableRows.push(row);	
			}, this);
		}else{
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
		
		this.updatePaging(data);
		
		return this;
	},
		
	updatePaging: function(data){
		
		var options = this.options.search,
			totalCount = data[0].totalcount,
			prevLimit = (options.limitstart - options.limit).limit(0, options.limit),
			nextLimit = (options.limitstart + options.limit).limit(0, totalCount), //if nextLimit is larger than total, hide next button and set maxcount to total
			pagingData = {
				pagecount: langText.tprop + ': ' + options.limitstart + '-' + nextLimit + ' ' + langText.of + ' ' + totalCount,
				beginning: this.options.templates.pageButton.substitute({
					value: langText.previous,
					limit: prevLimit,
					display: (!prevLimit) ? 'none' : 'inline'
				}),
				end: this.options.templates.pageButton.substitute({
					value: langText.next,
					limit: nextLimit,
					display: (nextLimit == totalCount) ? 'none' : 'inline'
				})
			};
			
			this.paging.each(function(pager){
				pager.set('html', this.options.templates.paging.substitute(pagingData))
			}, this);
			
			return this;
		
	},
	
	readMap: function(data) {
		data = JSON.decode(data);
		
		this.bounds = new google.maps.LatLngBounds();
		this.mapInstance.getInfoWindow().hide(); // hide the info window, otherwise it still stays open where the removed marker used to be
		this.mapInstance.clearOverlays();
		this.markers = {};
		
		//$('advmap_nofound')[data.length <= 0 ? 'show' : 'hide'](); //TODO: if no maps found, display advmap_nofound div with no search criteria met

		//this.createTable(data); //create sortable table list
		//this.mapInstance.setZoom(this.mapInstance.getBoundsZoomLevel(this.bounds));
		//this.mapInstance.setCenter(this.bounds.getCenter());
		
		return this;
	}
	
});


// Testing stuff

Asset.css('http://www.backalleycoder.com/thinkery/css/widget.css');

setTimeout(function(){

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
	thumbnail: 1
});

}, 2000);
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
