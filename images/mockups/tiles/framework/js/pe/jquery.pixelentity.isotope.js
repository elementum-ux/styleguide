(function ($) {
	/*jslint undef: false, browser: true, devel: false, eqeqeq: false, bitwise: false, white: false, plusplus: false, regexp: false, nomen: false */ 
	/*global jQuery,setTimeout,location,setInterval,YT,clearInterval,clearTimeout,pixelentity */
	
	$.pixelentity = $.pixelentity || {version: '1.0.0'};
	
	$.pixelentity.peIsotope = {	
		conf: {
			api: false
		} 
	};
	
	var jwin = $(window);
	
	function triggerLazyloadingCheck () {
		jwin.triggerHandler("pe-lazyloading-refresh");
	}

	var sorter = {
			sort: {

				random  : function (a,b) { return Math.random() - 0.5; },
				w       : function (a,b) { return b.w - a.w; },
				h       : function (a,b) { return b.h - a.h; },
				a       : function (a,b) { return b.w*b.h - a.w*a.h; },
				max     : function (a,b) { return Math.max(b.w, b.h) - Math.max(a.w, a.h); },
				min     : function (a,b) { return Math.min(b.w, b.h) - Math.min(a.w, a.h); },

				height  : function (a,b) { return sorter.sort.msort(a, b, ['h', 'w']);               },
				width   : function (a,b) { return sorter.sort.msort(a, b, ['w', 'h']);               },
				area    : function (a,b) { return sorter.sort.msort(a, b, ['a', 'h', 'w']);          },
				maxside : function (a,b) { return sorter.sort.msort(a, b, ['max', 'min', 'h', 'w']); },

				msort: function(a, b, criteria) { /* sort by multiple criteria */
					var diff, n;
					for (n = 0 ; n < criteria.length ; n++) {
						diff = sorter.sort[criteria[n]](a,b);
						if (diff != 0)
							return diff;  
					}
					return 0;
				}
			}
		
		};
	
	
	function Binpack(w) { 
		this.w = w; 
	}
	
	Binpack.prototype = {
		
		
		
		fit: function(blocks) {
			var n, node, block, len = blocks.length;
			var h = len > 0 ? blocks[0].h : 0;
			this.root = { x: 0, y: 0, w: this.w, h: h };
			
			for (n = 0; n < len ; n++) {
				block = blocks[n];
				if ((node = this.findNode(this.root, block.w, block.h))) {
					block.fit = this.splitNode(node, block.w, block.h);					
				} else {
					block.fit = this.growNode(block.w, block.h);					
				}
			}
		},

		findNode: function(node, w, h) {
			if (node.used) {				
				return (node.right && this.findNode(node.right, w, h)) || (node.down && this.findNode(node.down, w, h));
			} else if ((w <= node.w) && (h <= node.h)) {
				return node;				
			} else {
				return null;				
			}
		},

		splitNode: function(node, w, h) {
			node.used = true;
			if (node.w - w > 0) {
				node.right = { x: node.x + w, y: node.y,     w: node.w - w, h: h          };
			}
			if (node.h - h > 0) {
				node.down  = { x: node.x,     y: node.y + h, w: node.w,     h: node.h - h };
			}
			return node;
		},

		growNode: function(w, h) {
			if (w <= this.root.w) {
				return this.growDown(w, h);
			} else {
				return null;
			}
		},

		growDown: function(w, h) {
			var node;
			this.root = {
				used: true,
				x: 0,
				y: 0,
				w: this.root.w,
				h: this.root.h + h,
				down:  { x: 0, y: this.root.h, w: this.root.w, h: h },
				right: this.root
			};
			if ((node = this.findNode(this.root, w, h))) {
				return this.splitNode(node, w, h);
			} else {
				return null;
			}
		}

	}
	
	$.Isotope.prototype._binpackGetContainerSize =  function() {
		return { height: this.binpack.h };
    };

    $.Isotope.prototype._binpackResizeChanged = function() {
		//return false;
		return this._checkIfSegmentsChanged();
    };
	
	$.Isotope.prototype._binpackReset = function() {
		
		
		var options = this.options.binpack;
		
		var $elems = this.$allAtoms;

		var instance = this;
		var w = this.element.width(),h;
		
		var n = Math.ceil((w)/options.w);
		var cw = Math.floor((w)/n);
		var ch = Math.floor(options.h*cw/options.w);
		var count = 0,tw,th,img,iw,ih,scaler;
		
		$elems.each(function () {
			var el = $(this).find(".scalable"),cols,rows;
			if (el.length > 0) {
				tw = Math.min(w,cw*(parseInt(el.attr("data-cols"),10) || 1));				
				th = ch*(parseInt(el.attr("data-rows"),10) || 1);				
				el.width(tw);
				el.height(th);
				img = el.find("img:first");
				iw = img.width();
				ih = img.height();
				
				if (iw < tw || ih < th) {
					scaler = $.pixelentity.Geom.getScaler("fillmax","center","center",tw,th,iw,ih);
					img.transform(scaler.ratio,scaler.offset.w,scaler.offset.h,iw,ih);
					img.data("upscaled",true);
				} else if (img.data("upscaled")) {
					img.transform(1,0,0);
					img.data("upscaled",false);
				}
			}
		});
		
		this.binpack = {cols:n,cw:cw,ch:ch,n:n};
	};
	
	
	$.Isotope.prototype._binpackLayout = function($elems) {
		var i,el;
		var blocks = [];
		
		for (i=0;i<$elems.length;i++) {
			el = $elems.eq(i);
			el.removeClass("grid-first-row grid-first-col grid-last-row grid-last-col");
			blocks.push({w:el.width(),h:el.height(),el:el});
		}
		
		if (sorter.sort[this.options.binpack.sort]) {
			blocks.sort(sorter.sort[this.options.binpack.sort]);
		}
		
		var packer = new Binpack(this.element.width());
		packer.fit(blocks);
		this.binpack.h = packer.root.h;
		
		var blk,pos;
		
		var ctop = this.element.offset().top;
		
		var rm = this.binpack.cw*this.binpack.n;
		var bm = packer.root.h;
		var img;
		
		for(i=0;i<blocks.length;i++) {
			blk = blocks[i];
			pos = blk.fit;
			el = blk.el;
			if (pos) {
				if (pos.x === 0) {
					el.addClass("grid-first-col");
				}
				if (pos.x + blk.w === rm) {
					el.addClass("grid-last-col");
				}
				if (pos.y === 0) {
					el.addClass("grid-first-row");
				}
				if (pos.y + blk.h === bm) {
					el.addClass("grid-last-row");
				}
				
				img = el.find("img.peLazyLoading");
				if (img.length > 0) {
					img.data("pe-lazyload-forced-top",ctop+pos.y);
				}
				
				this._pushPosition(el, pos.x, pos.y);
			}
			blk.el = null;
			blk.fit = null;
		}
		triggerLazyloadingCheck();
		// needed on mobile
		setTimeout(triggerLazyloadingCheck,1000);
	};
	
	$.Isotope.prototype._fitRowsLayout = function( $elems ) {
		var instance = this,containerWidth = this.element.width(),props = this.fitRows,margin = 0,additional = 0;
		
		$elems.each(function () {
			var $this = $(this);
			var mleft = parseInt($this.css("margin-left").replace(/px/,""),10);
			margin = Math.max(margin,mleft);
		});
		
		$elems.each( function() {
			var $this = $(this),atomW = $this.outerWidth(true),atomH = $this.outerHeight(true);
			
			if (atomW*1.1 > containerWidth) {
				$this.width(containerWidth).data("resized",true).addClass("no-transition");
				atomW = $this.width();
				atomH = $this.height();
			} else if ($this.data("resized")) {
				$this.css("width","").data("resized",false).removeClass("no-transition");
				atomW = $this.width();
				atomH = $this.height();
			}
			
			if ( props.x !== 0 && atomW + props.x > containerWidth ) {
				// if this element cannot fit in the current row
				props.x = 0;
				props.y = props.height;
			}
			
			var mleft = parseInt($this.css("margin-left").replace(/px/,""),10);
			margin = Math.max(margin,mleft);

			if (props.x === 0 && mleft > 0) {
				props.x = -mleft;
			} 
			
			if (props.x > 0 && mleft === 0) {
				props.x += margin;
			}
			
			// position the atom
			instance._pushPosition( $this, props.x, props.y );

			props.height = Math.max( props.y + atomH, props.height );
			props.x += atomW;
			
		});
		
    };
	
	function PeIsotope(target, conf) {
		
		var container;
		var filters;
		var isotope;
		
		// init function
		function start() {
			container = target.find(".peIsotopeContainer");
			//container = target;
			$.pixelentity.preloader.load(container,loaded);
		}
		
		function filter(e) {
			var search = e.currentTarget.getAttribute("data-category");
			filters.removeClass("active").filter(e.currentTarget).addClass("active");
			search = search ? ".filter-"+search : "";
			container.isotope({filter: search});
			return false;
		}
		
		function loaded() {
			
			var conf;
			
			conf = {
				hiddenStyle: {opacity : 0 },
				visibleStyle: {opacity : 1 }, 
				itemSelector : '.peIsotopeItem',
				layoutMode: 'fitRows',
				resizable: false
			};
			
			if (container.hasClass("peIsotopeGrid")) {
				conf.layoutMode = "binpack";
				conf.binpack = {
					w: parseInt(container.attr("data-cell-width"),10) || 188,
					h: parseInt(container.attr("data-cell-height"),10) || 120,
					sort: container.attr("data-sort") || "maxside"
				};
				container.find(".peIsotopeItem > a").prepend('<div class="frame"></a>');
			}
			
			isotope = container.isotope(conf).data("isotope");
			filters = target.find(".peIsotopeFilter a").click(filter);
			setTimeout(resizable,500);
		}
		
		
		function resize() {
			isotope.resize();
			setTimeout(reLayout,1000);
		}
		
		function reLayout() {
			isotope.reLayout();
		}

		
		function resizable() {
			$(window).bind('smartresize.isotope',resize);
			isotope.reLayout();
		}

		
		$.extend(this, {
			// plublic API
			destroy: function() {
				target.data("peIsotope", null);
				target = undefined;
			}
		});
		
		// initialize
		start();
	}
	
	// jQuery plugin implementation
	$.fn.peIsotope = function(conf) {
		
		// return existing instance	
		var api = this.data("peIsotope");
		
		if (api) { 
			return api; 
		}
		
		conf = $.extend(true, {}, $.pixelentity.peIsotope.conf, conf);
		
		// install the plugin for each entry in jQuery object
		this.each(function() {
			var el = $(this);
			api = new PeIsotope(el, conf);
			el.data("peIsotope", api); 
		});
		
		return conf.api ? api: this;		 
	};
	
}(jQuery));