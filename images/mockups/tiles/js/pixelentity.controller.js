(function ($) {
	/*jslint undef: false, browser: true, devel: false, eqeqeq: false, bitwise: false, white: false, plusplus: false, regexp: false, nomen: false */ 
	/*global jQuery,setTimeout,clearTimeout,projekktor,location,setInterval,YT,clearInterval,pixelentity,prettyPrint */
	
	var links,sections,_sections = {},menu,scrolling = false;
	var logo;
	var jwin = $(window),sc;
	
	window.peGmapStyle = [
        {
            stylers: [
                { saturation: -100 }
            ]
        },{
            featureType: "road",
            elementType: "geometry",
            stylers: [
                { lightness: 100 },
                { visibility: "simplified" }
            ]
        },{
            featureType: "road",
            elementType: "labels",
            stylers: [
                { visibility: "off" }
            ]
        }
    ];
	
	function imgfilter() {
		return this.href.match(/\.(jpg|jpeg|png|gif)$/i);
	}
	
	pixelentity.classes.Controller = function() {
		
		var h;
		var active;
		var gmap,gmapButton,nav;
		
		function scroll(id,animate) {
			active = id;
			if (sections[id]) {
				var p = sections[id].position();
				if (animate === false) {
					sc.scrollTop(parseInt(p.top,10));
					setActive();
				} else {
					scrolling = true;
					sc.animate({scrollTop:parseInt(p.top,10)},500,setActive);
				}
			}
		}
		
		function resize() {
			h = window.innerHeight ? window.innerHeight: jwin.height();
			if (active) {
				//scroll(active);
			}
		}
		
		function setActive(e) {
			if (e && scrolling) {
				return true;
			}
			scrolling = false;
			var st = parseInt(jwin.scrollTop(),10);
			logo[st > 180 ? "addClass" : "removeClass"]("visible");
			
			var center = st+Math.round(h/2);
			var distance,i,section,min = 100000,top,bottom;
			
			if (st < 50) {
				active = "home";
			} else {
				for (i in sections) {
					section = sections[i];
					top = Math.max(0,parseInt(section.position().top,10));
					bottom = top+section.height();
					distance = Math.min(Math.abs(center-top),Math.abs(center-bottom));
					if (distance < min) {
						min = distance;
						active = i;
					}
				}	
			}
			
			menu.removeClass("active").each(function () {
				if (this.href.match(active)) {
					menu.filter(this).addClass("active");
				} 
			});
			
			if (active) {
				scrolling = true;
				if (active === "home") {
					if (location.hash) {
						if (window.history && window.history.pushState) {
							window.history.pushState('', document.title, window.location.href.replace(/#.+/,""));
						} else {
							location.hash = "";
						}
					}
					//location.hash = active != "home" ? active : "";
				} else {
					location.hash = active;
				}
				scrolling = false;
			}
			
			return true;
		}
		
		function jumpToSection(e) {
			var link = links.filter(e.currentTarget);
			if (link && link.data("section-id")) {
				scroll(link.data("section-id"));
			}
		}

		function checkLinks() {
			var id;
			if ((id = this.href.match(/#(.+)$/))) {
				id = id[1];
				if (sections[id]) {
					links.filter(this).data("section-id",id).on("click",jumpToSection);
				}
			}
		}	
		
		function autoFlare(idx,el) {
			el = $(el);
			el.attr("data-target","flare");
		}
		
		function addSection() {
			var el = sections.filter(this);
			_sections[el.attr("data-section")] = el;
		}
		
		function gmapShow() {
			if (gmap) {
				gmap.slideDown(500);
				gmap.find(".gmap.disabled").removeClass("disabled");
				$.pixelentity.widgets.build(gmap,{});
				gmap = false;
				gmapButton.fadeTo(500,0,function () {gmapButton.hide();});
			}
			return false;
		}
		
		function deeplink(now) {
			var id = location.hash.replace("#","");
			if (id && sections[id]) {
				if (now) {
					scroll(id,false);
				} else {					
					jwin.load(function () {
						scroll(id,false);
					});
				}
			} else {
				setActive();
			}	
		}

		
		function dropnav() {
			deeplink(true);
			return false;
		}
		
		
		function test() {
			var el = $(this);
			
			var useSVG = false;
			var bw;
			
			if (useSVG) {
				bw = $('<svg viewBox="0 0 %0 %1" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><filter id="grayscale"><feColorMatrix type="saturate" values="0"/></filter><image filter="url(#grayscale)" xlink:href="%2" width="%0" height="%1" /></svg>'.format(this.naturalWidth,this.naturalHeight,this.src));
				bw.css({
					"position": "absolute",
					"width": "100%",
					"height": "100%"
				});			
			} else {
				bw = el.clone().addClass("bw2").css("position","absolute").css({
					"opacity": 1,
					"-webkit-filter": "grayscale(100%)",
					"-moz-filter": "grayscale(100%)"
				});
				el.css("opacity",0);
			}
			
			el.parent().css("position","relative");			
			el.before(bw);
		}

		
		function start() {
			var mobile = $.pixelentity.browser.mobile;
			
			if (mobile) {
				$("html").addClass("mobile");
			} 
			
			sc = $("html,body");
			
			sections = $("[data-section]");
			sections.each(addSection);
			sections = _sections;
			links = $('a[data-target!="flare"]').not('a[data-toggle]');
			links.each(checkLinks);
			links.filter(imgfilter).each(autoFlare);
			
			menu = $(".full-nav li a");
			logo = $(".logo-small");
			
			gmap = $(".map-wide .span12");
			
			gmapButton = $(".map-toggle").click(gmapShow);
			
			$('.peSlider.peVolo').attr({
				"data-plugin": "peVolo",
				"data-controls-arrows": "edges-full",
				"data-controls-bullets": "disabled",
				"data-icon-font": "enabled"
			});
			
			$('.carouselBox').attr({
				"data-height": "0,0"
			});
			
			$.pixelentity.widgets.build($("body"),{});
			
			// Responsive nav
			window.selectnav('navigation', {
				label: $("#drop-nav").attr("data-label"),
				autoselect: false,
				nested: true,
				indent: '-_'
			});
			
			nav = $("#selectnav1");
			nav.find("option:first").prop("selected",true);
			nav.change(dropnav);
			$("#drop-nav").append(nav);
			
			$("img[data-original]").peLazyLoading();
			if (!mobile) {
				$(".bw-images img").peBlackAndWhite();
			}
			
			jwin.resize(resize);
			resize();
			
			deeplink();
			
			//if (!mobile) {
				jwin.scroll(setActive);
			//}
		}
		
		start();
	};
	
}(jQuery));
