Array.prototype.remove = function (val) {
    const index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
        return val;
    }
    return null;
};

String.prototype.removeCharAt = function (index) {
    const part1 = this.substring(0, index);
    const part2 = this.substring(index + 1, this.length);
    return (part1 + part2);
};

String.prototype.addCharAfter = function (index, char) {
    const part1 = this.substring(0, index);
    const part2 = this.substring(index, this.length);
    return (part1 + char + part2);
};

String.prototype.parseTransform = function () {
    var prop = ['translate', 'matrix', 'rotate', 'skewX', 'skewY', 'scale'];
    var val = this.match(/(translate|matrix|rotate|skewX|skewY|scale)\(.*?\)/g);
    var obj = {};
    if (val) {
        for (var i = 0, length = val.length; i < length; i++) {
            var item = val[i];
            var index = item.indexOf('(');
            var v = item.substring(index + 1, item.length - 1).split(/\,|\s/);
            var n = item.substring(0, index);
            obj[n] = {};
            switch (n) {
                case 'translate':
                case 'scale':
                    obj[n].x = +v[0] || 0;
                    obj[n].y = +v[1] || 0;
                    break;
                case 'rotate':
                    obj[n].a = +v[0] || 0;
                    obj[n].x = +v[1] || 0;
                    obj[n].y = +v[2] || 0;
                    break;
                case 'skewX':
                case 'skewY':
                    obj[n].a = +v[0];
                    break;
                case 'matrix':
                    obj[n].a = +v[0] || 0;
                    obj[n].b = +v[1] || 0;
                    obj[n].c = +v[2] || 0;
                    obj[n].d = +v[3] || 0;
                    obj[n].e = +v[4] || 0;
                    obj[n].f = +v[5] || 0;
                    break;
            }
        }
    }

    obj.toString = function () {
        var builder = [];
        for (var i = 0, length = prop.length; i < length; i++) {
            var n = prop[i];
            var o = this[n];
            if (!o)
                continue;
            switch (n) {
                case 'translate':
                case 'scale':
                    builder.push(n + '(' + o.x + ',' + o.y + ')');
                    break;
                case 'rotate':
                    builder.push(n + '(' + o.a + ' ' + o.x + ' ' + o.y + ')');
                    break;
                case 'skewX':
                case 'skewY':
                    builder.push(n + '(' + o.a + ')');
                    break;
                case 'matrix':
                    builder.push(n + '(' + o.a + ',' + o.b + ',' + o.c + ',' + o.d + ',' + o.e + ',' + o.f + ')');
                    break;
            }
        }
        return builder.join(' ');
    };

    return obj;
};

function Vector2D(_x, _y) {
    this.x = _x;
    this.y = _y;
}

function Rect2D(_x, _y, _w, _h) {
    this.x = _x;
    this.y = _y;
    this.w = _w;
    this.h = _h;
}

function CreateDom(tag, attrs) {
    var el = document.createElement(tag);
    for (var k in attrs)
        el.setAttribute(k, attrs[k]);
    return el;
}

function CreateSVG(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs)
        el.setAttribute(k, attrs[k]);
    return el;
}

// data binding

function DataBind(bindTo, fieldList) {
    this.bindTo = bindTo[0];

    fieldList.forEach(fieldtriple => {
        var field = null;
        var mode = null;
        var callback = null;

        if (fieldtriple.length >= 2) {
            field = fieldtriple[0];
            mode = fieldtriple[1];
        }

        if (fieldtriple.length > 2) {
            callback = fieldtriple[2];
        }

        Object.defineProperty(this, field, {
            enumerable: true,
            get: function () {
                switch (mode) {
                    case "attr":
                        return $(bindTo).attr(field);
                        break;
                    case "css":
                        return $(bindTo).css(field);
                        break;
                    case "html":
                        return $(bindTo).html();
                        break;
                    case "val":
                        return $(bindTo).val();
                        break;
                }
            },
            set: function (val) {

                switch (mode) {
                    case "attr":
                        $(bindTo).attr(field, val);
                        break;
                    case "css":
                        $(bindTo).css(field, val);
                        break;
                    case "html":
                        $(bindTo).html(val);
                        break;
                    case "val":
                        $(bindTo).val(val);
                        break;
                }

                if (callback) {
                    callback();
                }
            }
        });
    });
}

function getOffset(el) {
    var _x = 0;
    var _y = 0;
    while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { x: _y, y: _x };
}

function DeepCopy(obj){
    return _.cloneDeep(obj);
}

function getRandomColor() {
    return "transparent";
    return '#' + Math.round(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
}

function getRealRandomColor() {
    return '#' + Math.round(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
}

var Super_Interfaces = (baseClass, ...mixins) => {
    class base extends baseClass {
        constructor (...args) {
            super(...args);
            mixins.forEach((mixin) => {
                copyProps(this,(new mixin));
            });
        }
    }
    let copyProps = (target, source) => {  // this function copies all properties and symbols, filtering out some special ones
        Object.getOwnPropertyNames(source)
              .concat(Object.getOwnPropertySymbols(source))
              .forEach((prop) => {
                 if (!prop.match(/^(?:constructor|prototype|arguments|caller|name|bind|call|apply|toString|length)$/))
                    Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop));
               })
    }
    mixins.forEach((mixin) => { // outside contructor() to allow aggregation(A,B,C).staticFunction() to be called etc.
        copyProps(base.prototype, mixin.prototype);
        copyProps(base, mixin);
    });
    return base;
}


