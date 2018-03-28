var SEARCH = 0;
var SINGLE_ANCHOR = 1;
var RESOURCE = 2;
var COMPARISON = 3;


var FONTMIN = 11;
var FONTMAX = 22;
var FONTFACTOR = 1.25;
var SPEED = 1500;

var LIMITMIN = 15;
var LIMITMAX = 45;

var ITEMSUP = 1;
var ITEMSRIGHT = .25;
var ACORRECT0 = 0;
var ACORRECT1 = 1.5;
var ACORRECT2 = -1.5;
var ICONWIDTH = 20;
var DEFAULT_ORDER = 1;

var PUBSBY = "publications by";
var PUBSRE = "references in / citations of";
var PABOUT = "publications about";
var FINDHINT = 'Find author, paper or keyword';

var ASTROKE1 = '#D5E6EC';
var ASTROKE2 = '#2B74B3';
var TSTROKE1 = '#F4E2E5';
var TSTROKE2 = '#BA4353';
var ISTROKE1 = '#E3ECD5';
var ISTROKE2 = '#51984C';

var STROKEW1 = 1;
var STROKEW2 = 2;

var EDGEOPAC = 0;


function View(div) {
    var R = Raphael(div);

    this.init = function () {
        // mode 0: search
        // mode 1: single anchor layout
        // mode 2: resource layout
        // mode 3: comparison layout
        this.mode = SEARCH;
        this.width = $(window).width();
        this.height = $(window).height();
        this.authors = {};
        this.items = {};
        this.tags = {};
        this.fontsize = this.interval(this.width * this.height, 800 * 600, 2560 * 1600, FONTMIN, FONTMAX, false);
        this.topmargin = this.fontsize * 3;
        this.margin = this.fontsize * 2;
        this.edges = {};
        this.all={};
        this.total = 0;
        this.left = ''; // fid for the left anchor
        this.right = ''; // fid for the right anchor, for comparison layout
        this.order = DEFAULT_ORDER;
        this.limit = Math.floor(this.interval(this.width * this.height, 800 * 600, 2560 * 1600, LIMITMIN, LIMITMAX, true));
        this.offset = 0;
        this.searchTerm="";
        this.run = 0; // count number of runs, in order to solve the problem of smooth transition

        $("#loading div").css({
            "margin-top": this.height / 2.75
        });

        $("#buttons").css({
            'font-size': this.fontsize + 3
        });

        $("#order").append('<select id="order_left"><option value="0">most recent&nbsp;&nbsp;&nbsp;</option><option value="1">most cited</option><option value="3">random</option></select>');
        $("#order").append('<select id="order_right"><option value="0">most recent&nbsp;&nbsp;&nbsp;</option><option value="1">most cited</option><option value="3">random</option></select>');


        R.setSize(this.width, this.height);

        $('body').removeClass('mode0 mode1 mode2 mode3').addClass('mode' + this.mode);
        // create search page
        this.search();

    }


    this.draw = function () {
        var that = this;

        $("#loading").css({
            opacity: 0,
            display: 'none'
        });

        $("#cap div").css({
            opacity: 0
        });

        var items = [];
        var limit = this.limit;
        for (id in this.items) items.push(this.items[id]);

        //console.log(items);
        items = items.sort(function (a, b) {
            return a.order - b.order;
        });

        if (this.mode === SINGLE_ANCHOR) {
            for (var i = 0; i < items.length; i += 1) {
                var it = items[i];
                it.trans = "rotate(45deg)";
                it.hidden = false;
            }
        } else if(this.mode == RESOURCE) {
            var l = 0;
            var r = 0;
            var itemsL = [];
            var itemsR = [];
            var item_id = this.left.split("_")[1];

            for (var i = 0; i < items.length; i += 1) {
                var it = items[i];
                if (it.anchor) {
                    it.hidden = false;
                }
                else {
                    it.trans = "rotate(45deg)";
                    if (typeof it.cites_[item_id] !== "undefined") {
                        if (l < limit) {
                            l++;
                            it.hidden = false;
                            itemsL.push(it);
                        } else it.hidden = true;
                    } else if (typeof it.refs_[item_id] !== "undefined") {
                        if (r < limit) {
                            r++;
                            it.hidden = false;
                            itemsR.push(it);
                        } else it.hidden = true;
                    } else console.log('neither left nor right', it);
                }
            }


        } else {
            var l = 0,
                m = 0,
                r = 0;
            var itemsL = [],
                itemsM = [],
                itemsR = [];
            for (var i = 0; i < items.length; i += 1) {
                var it = items[i];
                if (it.anchor) {
                    it.hidden = false;
                }
                else {
                    it.trans = "rotate(45deg)";
                    if (it.sim == 0) {
                        if (l < limit) {
                            l++;
                            it.hidden = false;
                            itemsL.push(it);
                        } else it.hidden = true;
                    } else if (it.sim == 1) {
                        if (r < limit) {
                            r++;
                            it.hidden = false;
                            itemsR.push(it);
                        } else it.hidden = true;
                    } else {
                        if (m < limit) {
                            m++;
                            it.hidden = false;
                            itemsM.push(it);
                        } else it.hidden = true;
                    }
                }
            }
        }

        //console.log(items);

        var authorCntMax = 0; // maximum # of links of author node
        var authorCntMin = 10; // minimum # of links of author node
        var totalAuthors = 0;
        var tagCntMax = 0;
        var tagCntMin = 10;
        var totalTags = 0;

        // get authors data to be displayed
        var authors = [];
        for (id in this.authors) {
            var it = this.authors[id];
            if(it.anchor) {
                it.hidden = false;
                continue;
            }

            if (it.id == 1) it.hidden = true;
            else {
                totalAuthors++;
                var cnt = 0;
                for (item_id in it.items)
                    if (!this.items[item_id].hidden) cnt++;
                it.cnt = cnt;
                authorCntMax = Math.max(it.cnt, authorCntMax);
                authorCntMin = Math.min(it.cnt, authorCntMin);
                it.hidden = false;
                authors.push(it);
            }


        }

        authors = authors.sort(function (a, b) {
            if (b.cnt == a.cnt) return b.count - a.count;
            else return b.cnt - a.cnt;
        });


        //console.log(authors);

        // get tags data to be displayed
        var tags = [];
        for (id in this.tags) {
            var it = this.tags[id];
            if(it.anchor) {
                it.hidden = false;
                continue;
            }

            totalTags++;
            var cnt = 0;
            for (item_id in it.items)
                if (!this.items[item_id].hidden) cnt++;
            it.cnt = cnt;
            tagCntMax = Math.max(it.cnt, tagCntMax);
            tagCntMin = Math.min(it.cnt, tagCntMin);
            if (it.cnt > 0) tags.push(it);
            it.hidden = true;
        }

        tags = tags.sort(function (a, b) {
            if (a.cnt == b.cnt) return b.count - a.count;
            else return b.cnt - a.cnt;
        });

        var n=0;
        for (var i = 0; i < tags.length; i += 1) {
            if (n < this.limit * 1.5) {
                if (tags[i].id != 1) {
                    n++;
                    tags[i].hidden = false;
                }
            } else break;
        }

        // remove the residual nodes that has no links with items
        for (id in this.tags) {
            var it = this.tags[id];
            if(it.hidden) {
                if (typeof it.obj !== "undefined") {
                    this.removeElement(it.obj);
                    delete it.obj;
                }
            }
        }

        tags = tags.slice(0, i);

        //console.log(tags);

        var left_id = that.left.split("_")[1];
        var right_id = that.right.split("_")[1];

        var left_anchor = that.all[left_id];
        var right_anchor = that.all[right_id];

        if (this.mode == COMPARISON) {
            var it = this.all[right_id];
            this.updateLabel(it);
            it.fs = this.fontsize * 1.15;
            if (typeof it.obj == "undefined") {
                $("#labels").append(that.drawNode(it));
                it.obj = $("#_" + it.fullid);
            }
            it.obj.css({
                "font-size": it.fs
            });
            it.animation = true;
        }

        var x = 0;
        var x_ = 0;
        var w = left_anchor.obj.width();
        var W = this.width;
        var h = left_anchor.obj.height();
        if(this.mode == COMPARISON) var w_ = right_anchor.obj.width();
        var y = this.height / 2;

        $('.anchor').removeClass('anchor');
        left_anchor.obj.addClass('anchor');
        if(this.mode == COMPARISON) right_anchor.obj.addClass('anchor');

        // draw anchor
        this.drawAnchor = function() {
            this.updateLabel(left_anchor);
            var anchor_x = this.fontsize;

            // layout anchor
            if(this.mode == RESOURCE) {
                var iw = (this.width - w - 20 * this.fontsize) / (itemsL.length + itemsR.length);
                anchor_x = 10 * this.fontsize + iw * itemsL.length;
                //console.log(itemsL.length);
                if (isNaN(anchor_x)) anchor_x = this.width / 2 - w / 2;
                x = anchor_x;
            } else if(this.mode == COMPARISON){
                var iw = (this.width - w - w_ - 22 * this.fontsize) / (itemsL.length + itemsM.length + itemsR.length);
                var anchor_x = 5 * this.fontsize + iw * itemsL.length;
                if (isNaN(anchor_x)) anchor_x = 6 * this.fontsize;
                var anchor_x_ = anchor_x + w + 6 * this.fontsize + iw * itemsM.length;
                if (isNaN(anchor_x_)) anchor_x_ = W - 6 * this.fontsize;
                x = anchor_x;
                x_ = anchor_x_;
            }

            var anchor_y = this.height / 2;

            var anchor_correct = ACORRECT0 * this.fontsize;
            if (this.mode == RESOURCE) anchor_correct = ACORRECT1 * this.fontsize;
            else if(this.mode == COMPARISON) {
                anchor_correct = ACORRECT2 * this.fontsize;
            }


            left_anchor.animation = true;
            if(typeof left_anchor.obj == "undefined") {
                $("#labels").append(that.drawNode(left_anchor));
                left_anchor.obj = $("#" + left_anchor.fullid);
                left_anchor.obj.addClass("anchor");
            }

            left_anchor.p = [anchor_x - anchor_correct + w / 2, anchor_y];
            left_anchor.p1 = [anchor_x - anchor_correct, anchor_y - h / 2];
            left_anchor.p2 = [anchor_x - anchor_correct + w, anchor_y + h / 2];
            left_anchor.fs = that.fontsize * 1.15;

            if (that.mode == COMPARISON) {
                var it = that.all[right_id];
                it.p = [x_ - anchor_correct + w_ / 2, y];
                it.p1 = [x_ - anchor_correct, y - h / 2];
                it.p2 = [x_ - anchor_correct + w_, y + h / 2];
            }


            this.display(left_anchor, left_anchor.animation);
            if(this.mode == COMPARISON) this.display(right_anchor, right_anchor.animation);

            var stagger = 0;
            if (that.mode > 1) stagger = that.fontsize * 2;

            var ml = $("#meta_left").position();
            if (Math.abs(x - ml.left) > stagger + 1) $("#meta_left, #order_left").css({
                opacity: 0
            });

            var mr = $("#meta_right").position();
            $("#meta_right, #order_right").css({
                opacity: 0
            });
            $("#meta_left, #meta_right").css({
                "z-index": 0
            });
            $("#meta, #order select, #cap").css({
                'font-size': that.fontsize
            });

            setTimeout(function(){
                // layout meta
                var type = left_anchor.type;
                switch (type) {
                    case 0:
                        $("#meta_left").html(PUBSBY);
                        break;
                    case 1:
                        $("#meta_left").html(PUBSRE);
                        break;
                    case 2:
                        $("#meta_left").html(PABOUT);
                        break;
                    default:
                        break;
                }

                $("#order_left, #order_right").val(that.order);
                $("#order_left").css({
                    left: anchor_x - stagger * 2 - anchor_correct,
                    top: anchor_y - 5 * that.fontsize,
                    opacity: 1
                });


                $("#meta_left").css({
                    left: anchor_x - stagger - anchor_correct,
                    top: anchor_y - 3 * that.fontsize,
                    opacity: 1
                });

                if (that.mode == COMPARISON) {
                    var type = right_anchor.type;
                    switch (type) {
                        case 0:
                            $("#meta_right").html(PUBSBY);
                            break;
                        case 1:
                            $("#meta_right").html(PUBSRE);
                            break;
                        case 2:
                            $("#meta_right").html(PABOUT);
                            break;
                        default:
                            break;
                    }
                    $("#meta_right").css({
                        left: anchor_x_ - stagger - anchor_correct,
                        top: anchor_y - 3 * that.fontsize,
                        opacity: 1,
                        "z-index": 4
                    });
                    $("#order_right").css({
                        left: anchor_x_ - stagger * 2 - anchor_correct,
                        top: anchor_y - 5 * that.fontsize,
                        opacity: 1
                    });
                }


            }, SPEED);

        }

        // draw resources
        this.drawResources = function(data, left, right) {
            //console.log(data);
            var fontsize = this.fontsize;
            var off = (right-left) / data.length / 2 - fontsize;

            for (var i = 0; i < data.length; i += 1) {
                var d = data[i];

                d.fs = fontsize + 1

                // new div no animation
                // old div need animation
                d.animation = true;
                if(typeof d.obj == "undefined") {
                    $("#labels").append(this.drawNode(d));
                    d.obj = $("#" + d.fullid);
                    d.animation = false;

                }

                var w = d.obj.width();
                var h = d.obj.height();
                var x = off + this.interval(i, 0, data.length, left, right);
                var y = this.height / 2 - ITEMSUP * this.fontsize;

                var dis = 60;
                var disx = ITEMSRIGHT * this.fontsize;

                d.p1 = [x + disx, y - dis - h / 2]; // p1 is the left point
                d.p = [x + disx + w / 2, y - dis]; // p is the middle point
                d.p2 = [x + disx + w, y - dis + h / 2]; // p2 is the right point

                this.display(d, d.animation);
            }


        }

        // draw up and bottom nodes
        this.drawMeta = function(data) {
            for (var i = 0; i < data.length; i += 1) {
                var d = data[i];
                //console.log(d);
                d.fs = this.fontsize;
                // adjust the font size
                var minfont = this.fontsize / FONTFACTOR;
                var maxfont = this.fontsize * FONTFACTOR;
                if (d.type == 0) {
                    var mincnt = authorCntMin;
                    var maxcnt = authorCntMax;
                } else {
                    var mincnt = tagCntMin;
                    var maxcnt = tagCntMax;
                }
                if (mincnt == maxcnt) d.fs = this.fontsize - 1;
                else d.fs = this.interval(d.cnt, mincnt, maxcnt, minfont, maxfont, true);

                d.animation = true;
                if(typeof d.obj == "undefined") {
                    $("#labels").append(this.drawNode(d));
                    d.obj = $("#" + d.fullid);
                    d.animation = false;
                }

                var w = d.obj.width();
                var h = d.obj.height();

                var x = 0;

                // node layout algorithm
                for (item_id in d.items) {
                    var it2 = this.items[item_id];
                    // if (typeof it2.p1 !== "undefined") {
                        var w_ = it2.p2[0] - it2.p1[0];
                        //console.log(w_);
                        if (it2.anchor) x += it2.p1[0] + w_ / 2;
                        else {
                            // diagonal distance
                            var d1 = Math.sqrt(w_ * w_ / 2);
                            x += it2.p1[0] + d1 / 2;
                        }
                    // }
                }
                x /= d.cnt;

                // console.log("x1: "+x);

                if (d.type == 0) var y = this.topmargin + this.height / 4 * i / data.length;
                else var y = this.height - this.margin - this.height / 4 * i / data.length;
                d.p1 = [x - w / 2, y - h / 2];
                d.p = [x, y];
                d.p2 = [x + w / 2, y + h / 2];

            }

            //detect overlap and avoid it
            var getOverlapVector = function (a, b) {
                var da = [Math.abs(a.p2[0] - b.p1[0]), Math.abs(a.p1[0] - b.p2[0]), Math.abs(a.p2[1] - b.p1[1]), Math.abs(a.p1[1] - b.p2[1])];
                var s = -1,
                    d = 1000000;
                var order = [0, 1, 2, 3];
                order = order.sort(function (a, b) {
                    Math.random() - Math.random();
                });
                for (var i = 0; i < order.length; i++) {
                    var j = order[i];
                    if (da[j] < d) {
                        s = j;
                        d = da[j];
                    }
                }
                var v = [0, 0];
                switch (s) {
                    case 0:
                        v[0] = -d;
                        break;
                    case 1:
                        v[0] = d;
                        break;
                    case 2:
                        v[1] = -d;
                        break;
                    case 3:
                        v[1] = d;
                        break;
                }
                return v;
            }

            var overlap = function (a, b) {
                if (a.p1[0] < b.p2[0] && a.p2[0] > b.p1[0] && a.p1[1] < b.p2[1] && a.p2[1] > b.p1[1]) {
                    return true;
                } else return false;
            };

            var runs = 0;
            var laps = 1;
            while (runs < 50 && laps > 0) {
                laps = 0;
                runs++;
                for (var i = data.length - 1; i > -1; i--) {
                    for (var j = data.length - 1; j > -1; j--) {
                        if (i != j && overlap(data[i], data[j])) {
                            laps++;
                            var a = data[i];
                            var b = data[j];
                            var v = getOverlapVector(a, b);
                            a.p = a.p.plus(v);
                            a.p1 = a.p1.plus(v);
                            a.p2 = a.p2.plus(v);
                        }
                    }
                }
            }

            // display author and tag nodes
            for(var i=0; i<data.length; i++) {
                var d = data[i];
                this.display(d, d.animation);
            }

        }

        var capText = function (here, there) {
            if (here == there) {
                if (here == 1) return here + " item";
                else return here + " items";
            } else return here + " of " + there + " items";
        }

        this.drawCap = function() {
            // draw cap
            var cap_lefts = [0, 0, 0];
            var cap_texts = ["", "", ""];

            if (this.mode == SINGLE_ANCHOR) {
                if (items.length > 0) {
                    cap_lefts[0] = items[0].p1[0];
                    cap_texts[0] = capText(items.length, that.total[0]);
                }
            } else if(this.mode == RESOURCE) {
                if (itemsL.length > 0) {
                    cap_lefts[0] = itemsL[0].p1[0];
                    cap_texts[0] = capText(itemsL.length, that.total[0]);
                }
                if (itemsR.length > 0) {
                    cap_lefts[2] = itemsR[0].p1[0];
                    cap_texts[2] = capText(itemsR.length, that.total[1]);
                }
            } else {
                if (itemsL.length > 0) {
                    cap_lefts[0] = itemsL[0].p1[0];
                    cap_texts[0] = capText(itemsL.length, that.total[0]);
                }
                if (itemsM.length > 0) {
                    cap_lefts[1] = itemsM[0].p1[0];
                    cap_texts[1] = capText(itemsM.length, that.total[1]);
                }
                if (itemsR.length > 0) {
                    cap_lefts[2] = itemsR[0].p1[0];
                    cap_texts[2] = capText(itemsR.length, that.total[2]);
                }
            }

             setTimeout(function () {
                $("#cap_left").html(cap_texts[0]).css({
                    left: cap_lefts[0] + 5,
                    top: that.height / 2 + 6 * that.fontsize,
                    opacity: 1
                });

                $("#cap_middle").html(cap_texts[1]).css({
                    left: cap_lefts[1] + 5,
                    top: that.height / 2 + 6 * that.fontsize,
                    opacity: 1
                });

                $("#cap_right").html(cap_texts[2]).css({
                    left: cap_lefts[2] + 5,
                    top: that.height / 2 + 6 * that.fontsize,
                    opacity: 1
                });
             }, SPEED);


        }


        this.drawAnchor();


        if(this.mode == SINGLE_ANCHOR) {
            this.drawResources(items, 40 + left_anchor.obj.width(), that.width - 12 * that.fontsize);
        } else if(this.mode == RESOURCE) {
            this.drawResources(itemsL, 0, x - 12 * that.fontsize);
            this.drawResources(itemsR, x + left_anchor.obj.width(), that.width - 12 * that.fontsize);
        } else {
            this.drawResources(itemsL, 0, x - 6 * that.fontsize);
            this.drawResources(itemsM, x + w, x_ - 6 * that.fontsize);
            this.drawResources(itemsR, x_ + w_, W - 12 * that.fontsize);
        }


        that.drawCap();

        that.drawMeta(authors);

        that.drawMeta(tags);

        setTimeout(function () {
            that.drawEdges()
        }, SPEED*1.5);

        this.addEventHandler();

    }

    // event handler in three layout
    this.addEventHandler = function() {
        var that = this;

        $("#order_left,#order_right").unbind().change(function () {
            that.order = Number($(this).val());
            $("#order_left,#order_right").val(that.order);
            that.hideEdges();
            that.query();
        });

        // unbind first!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        $("#labels div").unbind();
        $(window).unbind();
        var that = this;

        // deal with enter and move inside the hover nodes
        $("#labels div").mousemove(function (e) {
            //console.log("mousemove");
            var fid = $(this).attr('id');
            //console.log(fid);
            that.hover(fid);


            var pos = $(this).position();
            var w = $(this).width();
            var ix = pos.left;
            var ex = e.pageX;
            var fid = $(this).attr('id');

            // detail icon
            if (ex - ix < ICONWIDTH) {
                $(this).addClass('detailIcon');
                $("#" + fid).attr({
                    title: 'Details'
                });
                //console.log("details");
            } else {
                $(this).removeClass('detailIcon');

            }

            // compare or remove icon
            if ($(this).hasClass('anchor')) {
                if (ex > ix + w - ICONWIDTH && ex < ix + w) $(this).addClass('deleteCross').attr({
                    title: 'Remove filter'
                });
                else {
                    $(this).removeClass('deleteCross');
                }
            } else  {
                if (ex > ix + w - ICONWIDTH && ex < ix + w) {
                    $(this).addClass('compareArrow').attr({
                        title: 'Compare'
                    });
                }
                else {
                    $(this).removeClass('compareArrow');
                }
            }

            // between two icons
            if (ex > ix + ICONWIDTH && ex < ix + w - ICONWIDTH) {
                //if($(this).hasClass('anchor')) return;

                var fid = $(this).attr('id');
                fid = fid.split("_");

                //console.log("between");

                $(this).addClass("changeAnchor");

                if (fid[0] == '1') {
                    if (typeof that.items[fid[1]] !== "undefined") {
                        var name = that.items[fid[1]].name;
                        var year = that.items[fid[1]].year;
                        var title = name + " (" + year + ")";
                        $(this).attr({
                            title: title
                        });
                    }
                } else $(this).attr({
                    title: null
                });
            } else {
                $(this).removeClass("changeAnchor");
            }
        });

        // deal with move mouse out event
        $("#labels div").mouseout(function (e) {
            //console.log("mouse out");
            that.out();
            $(this).removeClass('compareArrow detailIcon deleteCross changeAnchor');

        });

        // deal with click the node event
        $("#labels div").mouseup(function(e) {
            var fid = $(this).attr('id');

            if ($(this).hasClass('detailIcon')) {
                // show detail
                //console.log("detailIcon");
                that.showDetail(fid);

            } else if($(this).hasClass('changeAnchor')){
                $('.anchor').removeClass('anchor');
                $("#" + fid).addClass('anchor');
                that.pivot(fid);
                that.query();

            } else if($(this).hasClass('compareArrow')) {
                //console.log("todo compareArrow");

                var to_id = $(this).attr('id');
                $("#labels div").removeClass("fr to");
                if (that.right === "") var to_old = that.left;
                else var to_old = that.right;
                $("#" + to_old).addClass('fr');
                $("#" + to_id).addClass('to');
                $('.anchor').removeClass('anchor');
                $('.to,.fr').addClass('anchor');
                that.pivot(to_old, to_id);
                that.query();


            } else if($(this).hasClass('deleteCross')) {
                //console.log("todo deleteCross");
                that.hideDetail();

                if(that.mode == COMPARISON) {
                    var to_id = $(this).attr('id');
                    var fr_id = $('.fr').attr('id');

                    $("#labels div").removeClass("fr to");
                    $("#" + fr_id).addClass('fr');
                    $("#" + to_id).addClass('to');
                    $('.anchor').removeClass('anchor');

                    if (to_id == that.left) to_id = that.right;
                    else to_id = that.left;
                    $(this).removeClass('deleteCross');

                    $("#" + to_id).addClass('anchor');
                    that.pivot(to_id);
                    that.query();

                } else {
                    // change to search layout
                    that.mode = SEARCH;
                    $('body').removeClass('mode0 mode1 mode2 mode3').addClass('mode' + that.mode);

                    // remove all items and elements
                    for(id in that.items) {
                        delete that.items[id];
                    }
                    for(id in that.authors) {
                        delete that.authors[id];
                    }
                    for(id in that.tags) {
                        delete that.tags[id];
                    }
                    for(id in that.all) {
                        delete that.all[id];
                    }
                    that.left = "";
                    that.right = "";
                    that.hideEdges();
                    $("#cap div, #order_left, #meta_left").css({
                        opacity: 0
                    });

                    $("#search").css({
                        opacity: 1,
                        display: 'block'
                    });

                    $("#labels div").remove();
                    that.searchTerm="";
                    $("#search").val(that.searchTerm);
                    $("#search").focus();
                }


            }

            // !!!! need stop propogation so that body will not be affected
            e.stopPropagation();

        })

        //deal with click on the body except labels
        $("body").mouseup(function (e) {
            // console.log("click empty space");
            // hide the detail tooltip if exists
            that.hideDetail();
        });

    }

    this.out = function() {
        $(".hoverShow").removeClass('deleteCross');
        $(".hoverShow").removeClass('hoverShow');

        // simply make all edges color faded
        for (eid in this.edges) {
            this.edges[eid].attr({
                stroke: this.edges[eid].color1,
                'stroke-width': STROKEW1
            });
        }
    }

    this.hover = function(fid) {
        //console.log(fid);
        var id = fid.split("_")[1];
        var it = this.all[id];
        //console.log(id);

        // do nothing about anchor
        if(it.anchor) return;

        // find all related nodes when hover
        var related = {};
        if (typeof it.authors !== "undefined") {
            for (id in it.authors) {
                related[0 + "_" + id] = 1;
            }
        }
        if (typeof it.items !== "undefined") {
            for (id in it.items) {
                related[1 + "_" + id] = 1;
            }
        }
        if (typeof it.tags !== "undefined") {
            for (id in it.tags) {
                related[2 + "_" + id] = 1;
            }
        }

        // find all related edges when hover
        var eids = {};
        for (fid2 in related) {
            eids[fid + "__" + fid2] = 1;
            eids[fid2 + "__" + fid] = 1;
        }
        for (item_id in it.items) {
            var it2 = this.items[item_id];
            if (it.type == 0) {
                for (tag_id in it2.tags) {
                    var it3 = this.tags[tag_id];
                    eids[it2.fullid + "__" + it3.fullid] = 1
                }
            } else if (it.type == 2) {
                for (tag_id in it2.authors) {
                    var it3 = this.authors[tag_id];
                    eids[it2.fullid + "__" + it3.fullid] = 1
                }
            }
        }

        for (fid2 in related) {
            //console.log(fid2);
            $("#" + fid2).addClass('hoverShow');
        }

        // highlight the links
        for (eid in this.edges) {
            if (typeof eids[eid] !== "undefined") {
                this.edges[eid].attr({
                    stroke: this.edges[eid].color2,
                    'stroke-width': STROKEW1
                }).toFront();
            }
        }

    }

    // draw edges
    this.drawEdges = function() {
        var that = this;
        // console.log(that.items);
        // console.log(that.authors);
        // console.log(that.tags);
        R.clear();
        var tiltedTitleEdges = function () {
            //console.log("tilted");
            for (id in that.items) {
                //console.log(id);
                var it = that.items[id];

                // if (it.hidden) continue;
                for (aid in it.authors) {
                    //console.log(aid);
                    var au = that.authors[aid];
                    if (typeof au === "undefined" || au.hidden || au.anchor) continue;
                    var au_attr = {
                        opacity: EDGEOPAC,
                        'stroke-width': STROKEW1,
                        stroke: ASTROKE1,

                    };
                    if (typeof au !== "undefined") {
                        var eid = it.fullid + "__" + au.fullid;
                        var p0 = [au.p[0], au.p[1]+2];

                        if (it.anchor) var p3 = [it.p[0], it.p1[1] + 2];
                        else var p3 = [it.p1[0]-4-2, it.p1[1]+2];

                        var l = p3.dist(p0) / 4;
                        var s = Math.sqrt(l * l / 2);
                        var p1 = [p0[0], p0[1] + l];
                        if (it.anchor) var p2 = [p3[0], p3[1] - s * 2];
                        else var p2 = [p3[0] - s, p3[1] - s];
                        var p = [p0, p1, p2, p3];
                        if (p !== false) {
                            var path = [["M", p[0][0], p[0][1]], ["C", p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1]]];
                            that.edges[eid] = R.path(path).attr(au_attr);
                            that.edges[eid].color1 = ASTROKE1;
                            that.edges[eid].color2 = ASTROKE2;
                        }
                    }
                }

                for (tid in it.tags) {
                    var ta = that.tags[tid];

                    //console.log(ta);

                    if (typeof ta === "undefined" || ta.hidden || ta.anchor || typeof ta.p === "undefined") continue;
                    var ta_attr = {
                        opacity: EDGEOPAC,
                        'stroke-width': STROKEW1,
                        stroke: TSTROKE1,
                    };

                    if (typeof ta !== "undefined") {
                        var eid = it.fullid + "__" + ta.fullid;

                        var w = it.obj.width();

                        // upper left point + diagonal length = bottom right point !!!!!!!!!!!!!!!!
                        var d = Math.sqrt(w * w / 2);

                        if (it.anchor) var p0 = [it.p[0], it.p2[1] + 2];
                        else var p0 = [it.p1[0] + d-4, it.p[1] + d + 2-4];

                        var p3 = [ta.p[0], ta.p1[1]-2-4];

                        var l = p0.dist(p3) / 4;
                        var s = Math.sqrt(l * l / 2);
                        if (it.anchor) var p1 = [p0[0], p0[1] + s * 2];
                        else var p1 = [p0[0] + s, p0[1] + s];
                        var p2 = [p3[0], p3[1] - s];
                        var p = [p0, p1, p2, p3];
                        if (p !== false) {
                            var path = [["M", p[0][0], p[0][1]], ["C", p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1]]];
                            that.edges[eid] = R.path(path).attr(ta_attr);
                            that.edges[eid].color1 = TSTROKE1;
                            that.edges[eid].color2 = TSTROKE2;
                        }
                    }
                }
            }
        }
        tiltedTitleEdges();
        // opacity from 0 -> 1
        for (eid in that.edges) {
            that.edges[eid].attr({
                opacity: 1
            });
        }

    }

    // hide edges
    this.hideEdges = function (animate) {
        var that = this;
        if (typeof animate === "undefined") animate = true;
        for (eid in this.edges) {
            if (animate) this.edges[eid].attr({
                opacity: 0
            });
            else {
                this.edges[eid].remove();
                delete this.edges[eid];
            }
        }
        if (animate) setTimeout(function () {
            for (eid in that.edges) {
                that.edges[eid].remove();
                delete that.edges[eid];
            }
        }, 500);
    }

    // create search box page
    this.search = function() {
        this.run++;
        var that = this;

        var html = '<input type="text" name="search" id="search" placeholder="' + FINDHINT + '" size="40" class="cursor">';
        $('body').append(html);

        var h = $("#search").height();
        var w = this.fontsize * 25;
        var pos = {
            left: this.width / 2 - w / 2,
            top: this.height / 4 - h / 2,
            width: w
        }
        var css = {
            left: pos.left,
            top: pos.top,
            width: pos.width,
            opacity: 1,
            'font-size': this.fontsize * 1.2
        };
        $("#search").css(css);
        $("#search").focus();
        var timeout = null;
        $("#search").keyup(function (e) {
            if (e.which == 13) that.searchQuery();
            else {
                clearTimeout(timeout);
                var delay = SPEED / 2;
                timeout = setTimeout(function () {
                    that.searchQuery();
                }, delay);
            }
        });

    }

    // send keyword to remote for searching
    this.searchQuery = function() {

        $("#labels div").remove();

        var that = this;

        var pos = $("#search").position();
        $("#loading2").css({
            top: pos.top + 3,
            left: pos.left + $("#search").width(),
            opacity: 1,
            display: 'block'
        });

        this.searchTerm = $("#search").val();
        if(this.searchTerm.length == 0) {
            $("#loading2").css({
                opacity: 0,
                display: 'none'
            });
            return;
        }

        var script = "http://mariandoerk.de/pivotpaths/demo/" + "hint.php?s=0" + "&q=";
        jQuery.getJSON(script + this.searchTerm, function (hints) {
            if (that.mode == SEARCH) that.searchMap(hints);
            $("#loading2").css({
                opacity: 0,
                display: 'none'
            });
        });

    }

    // preprocess the search result
    this.searchMap = function(hints) {
        //console.log(hints);
        var max = 12
        var types = 3;
        var allocs = [];
        var extras = [];
        var total = 0;
        var actual = 0;
        var surplus = 0;

        for (var i = 0; i < hints.length; i++) {
            allocs[i] = Math.min(hints[i].length, Math.round(max / types));
            extras[i] = hints[i].length - allocs[i];
            actual += hints[i].length;
            total += allocs[i];
            surplus += extras[i];
        }
        while (total < max && surplus > 0) {
            for (var i = 0; i < hints.length; i++) {
                if (extras[i] > 0 && total < max) {
                    allocs[i]++;
                    extras[i]--;
                    total++;
                    surplus--;
                }
            }
        }
        var combined = [];
        for (var i = 0; i < hints.length-1; i++) {
            //console.log(hints[i]);
            combined = combined.concat(hints[i].slice(0, allocs[i]));
        }
        hints = combined;
        var authors = {};
        var items = {};
        var tags = {};
        var obj = {};
        for (var i = 0; i < hints.length; i++) {
            var it = hints[i];
            it.fs = this.fontsize * 1.15;
            it.x = 0;
            it.y = .1 + .9 * i / (max);
            obj[it.fullid] = it;
            switch (it.type) {
                case 0:
                    authors[it.id] = it;
                    break;
                case 1:
                    items[it.id] = it;
                    break;
                case 2:
                    tags[it.id] = it;
                    break;
            }
        }
        this.hints = obj;

        this.all = {};
        this.sync([authors, items, tags]);

        this.searchDisplay();



    }

    // display the search results
    this.searchDisplay = function() {
        var pos = $("#search").position();
        var h = this.fontsize * 12 * 2.5;
        var box = {
            p1: [pos.left, pos.top],
            p2: [pos.left + 1000, pos.top + h + $("#search").height()]
        }

        this.layout(this.hints, box);

        this.searchEventHandler();

    }

    this.searchEventHandler = function() {
        $("#labels div").unbind();
        $(window).unbind();
        var that = this;
        //console.log(that.all);
        $("#labels div").mousemove(function (e) {
            var fid = $(this).attr('id');
            //console.log(fid);

            var pos = $(this).position();
            var w = $(this).width();
            var ix = pos.left;
            var ex = e.pageX;
            var fid = $(this).attr('id');

            // detail icon
            if (ex - ix < ICONWIDTH) {
                $(this).addClass('detailIcon');
                $("#" + fid).attr({
                    title: 'Details'
                });
                //console.log("details");
            } else {
                $(this).removeClass('detailIcon');

            }

            // not detail icon
            if (ex > ix + ICONWIDTH) {

                //if($(this).hasClass('anchor')) return;

                var fid = $(this).attr('id');
                fid = fid.split("_");

                //console.log("between");

                $(this).addClass("changeAnchor");

                if (fid[0] == '1') {
                    if (typeof that.items[fid[1]] !== "undefined") {
                        var name = that.items[fid[1]].name;
                        var year = that.items[fid[1]].year;
                        var title = name + " (" + year + ")";
                        $(this).attr({
                            title: title
                        });
                    }
                } else $(this).attr({
                    title: null
                });
            } else {
                $(this).removeClass("changeAnchor");
            }


        })

        // deal with move mouse out event
        $("#labels div").mouseout(function (e) {
            //console.log("mouse out");

            $(this).removeClass('detailIcon changeAnchor');

        });

        // deal with click the node event
        $("#labels div").mouseup(function(e) {
            var fid = $(this).attr('id');

            if ($(this).hasClass('detailIcon')) {
                // show detail
                that.showDetail(fid);
            } else {
                //console.log(fid);
                var id = fid.split("_")[1];
                var it = that.all[id];

                $("#search").css({
                    opacity: 0,
                    display: 'none'
                })

                $('.anchor').removeClass('anchor');
                $("#" + fid).addClass('anchor');

                that.pivot(fid);
                that.query();

                //console.log(it);

            }

            // !!!! need stop propogation so that body will not be affected
            e.stopPropagation();

        })

        //deal with click on the body except labels
        $("body").mouseup(function (e) {
            // console.log("click empty space");
            // hide the detail tooltip if exists
            that.hideDetail();
        });
    }


    this.pivot = function(left, right) {
        var that = this;
        //console.log(fid);
        $("#cap div").css({
            opacity:0
        })

        this.hideDetail();
        this.hideEdges();

        if (typeof left === "undefined") {
            left = '';
        }
        if (typeof right === "undefined") {
            right = '';
        }

        var leftType = Number(('' + left).split("_")[0]);
        var rightType = Number(('' + right).split("_")[0]);
        var mode = -1;
        if (left == "" && right == "") mode = SEARCH;
        else if (left != "" && right == "" && leftType != 1) mode = SINGLE_ANCHOR;
        else if (left != "" && right == "" && leftType == 1) mode = RESOURCE;
        else if (left != "" && right != "") mode = COMPARISON;
        $('body').removeClass('mode0 mode1 mode2 mode3').addClass('mode' + mode);
        this.left = left;
        this.right = right;
        this.mode = mode;

    }

    this.updateLabel = function(it) {
        if (typeof it === "undefined") return;
        var shortname = this.getShortName(it);
        if (typeof it.obj !== "undefined") it.obj.find("span").html(shortname);
    }

    // layout the search results
    this.layout = function(items, box) {
        var sorted = [];
        for (id in items) {
            var it = items[id];
            sorted.push(it);
        }
        sorted = sorted.sort(function (a, b) {
            return a.type - b.type;
        });

        //console.log(sorted);

        var boxx = box.p1[0];
        var boxy = box.p1[1];
        var boxw = box.p2[0] - box.p1[0];
        var boxh = box.p2[1] - box.p1[1];
        var boxmx = 10;
        var boxmy = 10;

        for (var i = 0; i < sorted.length; i++) {
            var it = sorted[i];
            var fid = it.fullid;
            $("#labels").append(this.drawNode(it));
            it.obj = $("#_" + fid);
            if (typeof it.fs === "undefined") it.fs = this.fontsize;

            var x = boxx + boxmx + it.x * (boxw - 2 * boxmx);
            var y = boxy + boxmy + it.y * (boxh - 2 * boxmy);
            var w = it.obj.width();
            var h = it.obj.height();

            it.p1 = [x - w / 2, y - h / 2];
            it.p = [x, y];
            it.p2 = [x + w / 2, y + h / 2];

            this.display(it);

        }


    }

    this.sync = function(data) {
        //console.log(data);
        this.run++;
        //console.log("current run " + this.run);
        var that = this;
        var authors = data[0];
        var items = data[1];
        var tags = data[2];
        var total = data[3];

        var update = function (stale, fresh) {

            // check whether old data and new data has intersection
            // intersection data will be kept
            // non intersecion data will be deleted
            // in this way it will have the animation
            for(id in stale) {
                var fid = stale[id].fullid;
                if (typeof fresh[id] == "undefined") {
                    if (stale[id].obj) stale[id].obj.removeClass('hoverShow').addClass('tobedeleted');
                    delete stale[id];
                    delete that.all[fid];
                }
                else {
                    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                    var obj = stale[id].obj;
                    fresh[id].obj = obj;
                }

            }

            // delete old data
            $(".tobedeleted").remove();

            // add new data
            for (id in fresh) {
                stale[id] = fresh[id];
                that.all[id] = fresh[id];

            }

            // create new anchor
            for (id in that.all) {
                var it = that.all[id];
                var fid = it.fullid;
                if (fid == that.left || fid == that.right) it.anchor = true;
                else it.anchor = false;
            }

        }

        update(this.authors, authors);
        update(this.items, items);
        update(this.tags, tags);

        this.total = total;

        // console.log(this.authors);
        // console.log(this.items);
        // console.log(this.tags);
        // console.log(this.all);

    }

    this.query = function () {
        // jquery change object, need to store the current object
        var that = this;
        $("#loading").css({
            opacity: 1,
            display: 'block'
        });

        if(this.mode == SINGLE_ANCHOR) {
            // console.log(that.order);
            var q = that.left + "_" + that.order + "_" + that.limit + "_" + that.offset;
            var script = "http://mariandoerk.de/pivotpaths/demo/" + "results.php?s=0&q=";

            jQuery.getJSON(script + q, function (data){
                // jquery is asynchronous, the results need to be synchronized
                that.sync(data);
                // draw the interface
                that.draw();
            })
        } else if(this.mode == RESOURCE) {
            var q = that.left + "_" + that.order + "_" + that.limit + "_" + that.offset;
            var script = "http://mariandoerk.de/pivotpaths/demo/" + "paper.php?s=0&q=";

            jQuery.getJSON(script + q, function (data) {
                that.sync(data);
                that.draw();
            });

        } else {
            var l = this.left;
            var r = this.right;
            var script = "http://mariandoerk.de/pivotpaths/demo/" + "compare.php?s=0&q=";
            jQuery.getJSON(script + l + "::" + r + "::" + that.order + "::" + that.limit, function (data) {
                that.sync(data);
                that.draw();
            });
        }

    }

    // adding node to the interface but do not display it
    this.drawNode = function(item) {
        //console.log(item);
        var fid = item.fullid;
        var cl;

        if(item.type ==　0) {
            cl = "author";
        } else if(item.type == 1) {
            cl = "item";
        } else {
            cl = "tag";
        }

        var name = this.getShortName(item);

        return "<div class='" + cl + "' id='" + fid + "'><span>" + name + "</span></div>";

    }

    // display the node in the interface
    this.display = function(item, animation) {
        if(typeof animation == "undefined") {
            //console.log("animation undefined");
            animation = false;
        }

        // remove the upper and lower nodes that has no links with the middle nodes
        var fid = item.fullid;
        if (item.hidden) {
            if (typeof item.obj !== "undefined") {
                this.removeElement(item.obj);
                delete item.obj;
            }
            return;
        }

        //console.log(item.trans);
        if(typeof item.trans == "undefined") {
            item.trans = "rotate(0deg)";
        }

        // adding support to different browser!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
        var css = {
            opacity: 0,
            left: item.p1[0],
            top: item.p1[1],
            'font-size': item.fs,
            '-moz-transform': item.trans,
            '-moz-transform-origin': 'left center',
            '-ms-transform': item.trans,
            '-ms-transform-origin': 'left center',
            '-o-transform': item.trans,
            '-o-transform-origin': 'left center',
            '-webkit-transform': item.trans,
            '-webkit-transform-origin': 'left center'

        };
        var fid = item.fullid;
        item.obj = $("#" + fid).removeClass('noani');

        if(animation) {
            //console.log(item.name + ":has animation");
            //item.obj = $("#" + fid).removeClass('noani');
            css.opacity = 1;
            item.obj.css(css);

        } else {
            item.obj = $("#" + fid).addClass('noani');

            item.obj.css(css);

            if(this.mode == SEARCH || this.run <=1) {
                item.obj.css({
                    opacity: 1
                });
            } else {
                setTimeout(function (){
                    item.obj = $("#" + fid).removeClass('noani');
                    item.obj.css({
                        opacity: 1
                    });
                }, SPEED);
            }

        }

    }

    this.removeElement = function (el, animate) {
        el.removeClass('hoverShow').addClass('tobedeleted').css({
            opacity: 0
        });
        if (typeof el != "undefined") el.remove();



        // if (typeof animate == "undefined") animate = true;
        // if (animate) {
        //     el.removeClass('hoverShow').addClass('tobedeleted').css({
        //         opacity: 0
        //     });
        //     setTimeout(function (el) {
        //         if (typeof el != "undefined") el.remove();
        //     }, SPEED, el);
        // } else el.remove();
    }

    // get the shorter name
    this.getShortName = function (it) {
        if (typeof it === "undefined") return '';

        if(this.mode == SEARCH) {
            var name = it.name.shorten(100);
        } else {
            var name = it.name.shorten(30);
        }

        return "" + name;
    }

    // get the position of a node given a region and the index of this node
    this.interval = function (x, xmin, xmax, ymin, ymax, bound) {
        if (typeof bound === "undefined") bound = false;
        if (xmin == xmax) {
            return ymax;
        }
        var m = (ymax - ymin) / (xmax - xmin);
        var n = -xmin * m + ymin;
        var y = x * m + n;
        if (bound) {
            y = Math.min(ymax, y);
            y = Math.max(ymin, y);
        }
        return y;
    };

    // show detail when click the node
    this.showDetail = function(fid) {
        //console.log("show detail function");
        var that = this;
        var id = fid.split("_")[1];
        var it = this.all[id];

        if ($("#" + fid).hasClass('currentDetail')) return this.hideDetail();
        $(".currentDetail").removeClass('currentDetail');
        $("#" + fid).addClass('currentDetail');

        var head = "";
        var cont = "";
        var desc = "";
        var numb = "";
        var link = "";

        $("#detail").removeClass('author item tag');
        if(it.type == 0) {
            $("#detail").addClass('author');
            //console.log(it);
            head = it.fullname;
            if (it.photo != '' && it.photo != null) head += "<img src='" + it.photo + "'>";
            if (it.org != '' && it.org != null) cont = it.org;
            if (typeof it.interests !== "undefined" && it.interests !== null) desc += "" + it.interests;
            numb = it.count + "publications";
            if (it.cites != null) numb += " – " + it.cites + "citations";
            if (it.link != '' && it.link != null) link = "<a class='link' target='_blank' href='" + it.link + "'>Personal Website</a> &nbsp; ";
            link += "<a class='bing' target='_blank' href='http://www.bing.com/search?q=" + it.fullname + "'>Bing Search</a> &nbsp; ";
            link += "<a class='mas' target='_blank' href='http://academic.research.microsoft.com/Author/" + it.id + "'>MAS Profile</a>";
        } else if(it.type == 1) {
            $("#detail").addClass('item');
            head = it.name;
            if (it.img != null) head = "<img src='" + it.img + "'>" + head;
            if (it.container != null && it.container != "") cont += it.container + " ";
            cont += it.year;
            if (it.text != '' && it.text != null) desc += it.text.shorten(200);
            numb = "" + it.cites + "cites";
            if (it.link != '' && it.link != null) link = "<a class='link' target='_blank' href='" + it.link + "'>Publisher's Page</a> &nbsp; ";
            link += "<a class='bing' target='_blank' href='http://www.bing.com/search?q=\"" + it.name + "\"'>Bing Search</a> &nbsp; ";
            link += "<a class='mas' target='_blank' href='http://academic.research.microsoft.com/Publication/" + it.id + "'>MAS Page</a>";

        } else {
            $("#detail").addClass('tag');
            var head = it.name;
            if (it.text) var desc = it.text.shorten(200);
            else var desc = "";
            numb = it.count + " publications";
            link = "<a class='link' target='_blank' href='http://en.wikipedia.org/w/index.php?title=Special:Search&search=" + it.name + "'>Wikipedia Page</a> &nbsp; ";
            link += "<a class='bing' target='_blank' href='http://www.bing.com/search?q=" + it.name + "'>Bing Search</a> &nbsp; ";
            link += "<a class='mas' target='_blank' href='http://academic.research.microsoft.com/Keyword/" + it.id + "'>MAS Page</a>";
        }

        var html = "";
        html += "<h1>" + head + "</h1/>";
        html += "<h2>" + cont + "</h2/>";
        html += "<p class='desc'>" + desc + "</p>";
        html += "<p class='numb'>" + numb + "</p>";
        html += "<p class='link'>" + link + "</p>";

        $("#detail").html(html);


        var pos = $("#" + fid).position();
        var elw = $("#" + fid).width();
        var elh = $("#" + fid).height();
        var olw = $("#detail").width();
        var olh = $("#detail").height();

        if (this.mode == SEARCH) {
            pos.top = pos.top - olh / 2;
            pos.left = pos.left - olw - 40;
        } else {
            // set tooltip inside the boundary in the main page
            if (it.type == 0 && !it.anchor) pos.top = pos.top + elh + 10;
            else pos.top = pos.top - olh - 30;
            pos.left = pos.left + elw / 2 - olw / 2
            if (it.type == 1 && !it.anchor) pos.left -= 50;
            if (pos.left < 0) pos.left = 5;
            else if (pos.left > this.width - olw) pos.left = this.width - olw - 30;
        }

        $("#detail").css({
            display: 'block',
            "font-size": that.fontsize,
            top: pos.top,
            left: pos.left,
            opacity: 1
        });

    }

    // hide detail
    this.hideDetail = function() {
        //console.log("hide detail funciton");
        $(".currentDetail").removeClass('currentDetail');
        $("#detail").css({
            opacity: 0,
            display: 'none'
        });

    }

}

String.prototype.shorten = function (len) {
    if (this.length > len) return this.substr(0, len) + "…";
    else return this;
};

// calculate Euclidean distance of two points
Array.prototype.dist = function (v) {
    return Math.sqrt((this[0] - v[0]) * (this[0] - v[0]) + (this[1] - v[1]) * (this[1] - v[1]));
};

Array.prototype.plus = function (v) {
    return [this[0] + v[0], this[1] + v[1]];
};