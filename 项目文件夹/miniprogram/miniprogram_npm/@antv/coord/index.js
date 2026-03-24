module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1774267588496, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Coordinate3D = exports.Coordinate = void 0;
var coordinate_1 = require("./coordinate");
Object.defineProperty(exports, "Coordinate", { enumerable: true, get: function () { return coordinate_1.Coordinate; } });
var coordinate3D_1 = require("./coordinate3D");
Object.defineProperty(exports, "Coordinate3D", { enumerable: true, get: function () { return coordinate3D_1.Coordinate3D; } });
//# sourceMappingURL=index.js.map
}, function(modId) {var map = {"./coordinate":1774267588497,"./coordinate3D":1774267588521}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588497, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Coordinate = void 0;
var util_1 = require("@antv/util");
var gl_matrix_1 = require("gl-matrix");
var utils_1 = require("./utils");
var transforms_1 = require("./transforms");
var Coordinate = /** @class */ (function () {
    /**
     * Create a new Coordinate Object.
     * @param options Custom options
     */
    function Coordinate(options) {
        // 当前的选项
        this.options = {
            x: 0,
            y: 0,
            width: 300,
            height: 150,
            transformations: [],
        };
        // 当前可以使用的变换
        this.transformers = {
            cartesian: transforms_1.cartesian,
            translate: transforms_1.translate,
            custom: transforms_1.custom,
            matrix: transforms_1.matrix,
            polar: transforms_1.polar,
            transpose: transforms_1.transpose,
            scale: transforms_1.scale,
            'shear.x': transforms_1.shearX,
            'shear.y': transforms_1.shearY,
            reflect: transforms_1.reflect,
            'reflect.x': transforms_1.reflectX,
            'reflect.y': transforms_1.reflectY,
            rotate: transforms_1.rotate,
            helix: transforms_1.helix,
            parallel: transforms_1.parallel,
            fisheye: transforms_1.fisheye,
            'fisheye.x': transforms_1.fisheyeX,
            'fisheye.y': transforms_1.fisheyeY,
            'fisheye.circular': transforms_1.fisheyeCircular,
        };
        this.update(options);
    }
    /**
     * Update options and inner state.
     * @param options Options to be updated
     */
    Coordinate.prototype.update = function (options) {
        this.options = (0, util_1.deepMix)({}, this.options, options);
        this.recoordinate();
    };
    /**
     * Returns a new Coordinate with same options.
     * @returns Coordinate
     */
    Coordinate.prototype.clone = function () {
        return new Coordinate(this.options);
    };
    /**
     * Returns current options.
     * @returns options
     */
    Coordinate.prototype.getOptions = function () {
        return this.options;
    };
    /**
     * Clear transformations and update.
     */
    Coordinate.prototype.clear = function () {
        this.update({
            transformations: [],
        });
    };
    /**
     * Returns the size of the bounding box of the coordinate.
     * @returns [width, height]
     */
    Coordinate.prototype.getSize = function () {
        var _a = this.options, width = _a.width, height = _a.height;
        return [width, height];
    };
    /**
     * Returns the center of the bounding box of the coordinate.
     * @returns [centerX, centerY, centerZ]
     */
    Coordinate.prototype.getCenter = function () {
        var _a = this.options, x = _a.x, y = _a.y, width = _a.width, height = _a.height;
        return [(x * 2 + width) / 2, (y * 2 + height) / 2];
    };
    /**
     * Add selected transformation.
     * @param args transform type and params
     * @returns Coordinate
     */
    Coordinate.prototype.transform = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var transformations = this.options.transformations;
        this.update({
            transformations: __spreadArray(__spreadArray([], __read(transformations), false), [__spreadArray([], __read(args), false)], false),
        });
        return this;
    };
    /**
     * Apples transformations for the current vector.
     * @param vector original vector2
     * @returns transformed vector2
     */
    Coordinate.prototype.map = function (vector) {
        return this.output(vector);
    };
    /**
     * Apples invert transformations for the current vector.
     * @param vector transformed vector2
     * @param vector original vector2
     */
    Coordinate.prototype.invert = function (vector) {
        return this.input(vector);
    };
    Coordinate.prototype.recoordinate = function () {
        this.output = this.compose();
        this.input = this.compose(true);
    };
    // 将所有的变换合成一个函数
    // 变换有两种类型：矩阵变换和函数变换
    // 处理过程中需要把连续的矩阵变换合成一个变换函数，然后在和其他变换函数合成最终的变换函数
    Coordinate.prototype.compose = function (invert) {
        var e_1, _a;
        if (invert === void 0) { invert = false; }
        var transformations = invert ? __spreadArray([], __read(this.options.transformations), false).reverse() : this.options.transformations;
        var getter = invert ? function (d) { return d.untransform; } : function (d) { return d.transform; };
        var matrixes = [];
        var transforms = [];
        var add = function (transform, extended) {
            if (extended === void 0) { extended = true; }
            return transforms.push(extended ? (0, utils_1.extend)(transform) : transform);
        };
        try {
            for (var transformations_1 = __values(transformations), transformations_1_1 = transformations_1.next(); !transformations_1_1.done; transformations_1_1 = transformations_1.next()) {
                var _b = __read(transformations_1_1.value), name_1 = _b[0], args = _b.slice(1);
                var createTransformer = this.transformers[name_1];
                if (createTransformer) {
                    var _c = this.options, x = _c.x, y = _c.y, width = _c.width, height = _c.height;
                    var transformer = createTransformer(__spreadArray([], __read(args), false), x, y, width, height);
                    if ((0, utils_1.isMatrix)(transformer)) {
                        // 如果当前变换是矩阵变换，那么先保存下来
                        matrixes.push(transformer);
                    }
                    else {
                        // 如果当前变换是函数变换，并且之前有没有合成的矩阵变换，那么现将之前的矩阵变换合成
                        if (matrixes.length) {
                            var transform_1 = this.createMatrixTransform(matrixes, invert);
                            add(transform_1);
                            matrixes.splice(0, matrixes.length);
                        }
                        var transform = getter(transformer) || util_1.identity;
                        add(transform, name_1 !== 'parallel'); // 对于非平行坐标系的变换需要扩展
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (transformations_1_1 && !transformations_1_1.done && (_a = transformations_1.return)) _a.call(transformations_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // 合成剩下的矩阵变换
        if (matrixes.length) {
            var transform = this.createMatrixTransform(matrixes, invert);
            add(transform);
        }
        return utils_1.compose.apply(void 0, __spreadArray([], __read(transforms), false));
    };
    // 将连续的矩阵的运算合成一个变换函数
    Coordinate.prototype.createMatrixTransform = function (matrixes, invert) {
        var matrix = gl_matrix_1.mat3.create();
        if (invert)
            matrixes.reverse();
        matrixes.forEach(function (m) { return gl_matrix_1.mat3.mul(matrix, matrix, m); });
        if (invert) {
            gl_matrix_1.mat3.invert(matrix, gl_matrix_1.mat3.clone(matrix));
        }
        return function (vector) {
            var vector3 = [vector[0], vector[1], 1];
            gl_matrix_1.vec3.transformMat3(vector3, vector3, matrix);
            return [vector3[0], vector3[1]];
        };
    };
    return Coordinate;
}());
exports.Coordinate = Coordinate;
//# sourceMappingURL=coordinate.js.map
}, function(modId) { var map = {"./utils":1774267588498,"./transforms":1774267588503}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588498, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustAngle = exports.extend3D = exports.extend = exports.isMatrix = exports.compose = void 0;
var compose_1 = require("./compose");
Object.defineProperty(exports, "compose", { enumerable: true, get: function () { return compose_1.compose; } });
var isMatrix_1 = require("./isMatrix");
Object.defineProperty(exports, "isMatrix", { enumerable: true, get: function () { return isMatrix_1.isMatrix; } });
var extend_1 = require("./extend");
Object.defineProperty(exports, "extend", { enumerable: true, get: function () { return extend_1.extend; } });
Object.defineProperty(exports, "extend3D", { enumerable: true, get: function () { return extend_1.extend3D; } });
var adjustAngle_1 = require("./adjustAngle");
Object.defineProperty(exports, "adjustAngle", { enumerable: true, get: function () { return adjustAngle_1.adjustAngle; } });
//# sourceMappingURL=index.js.map
}, function(modId) { var map = {"./compose":1774267588499,"./isMatrix":1774267588500,"./extend":1774267588501,"./adjustAngle":1774267588502}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588499, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.compose = void 0;
var util_1 = require("@antv/util");
function compose(fn) {
    var rest = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        rest[_i - 1] = arguments[_i];
    }
    return fn ? rest.reduce(function (total, current) { return function (x) { return current(total(x)); }; }, fn) : util_1.identity;
}
exports.compose = compose;
//# sourceMappingURL=compose.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588500, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.isMatrix = void 0;
function isMatrix(transformer) {
    return transformer instanceof Float32Array || transformer instanceof Array;
}
exports.isMatrix = isMatrix;
//# sourceMappingURL=isMatrix.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588501, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extend3D = exports.extend = void 0;
// 对普通的变换函数进行扩展
// 对于长度大于2的向量，两两为一个点的 x 和 y 坐标
// 依次变换后合成新的向量返回
function extend(transform) {
    return function (vector) {
        var v = [];
        for (var i = 0; i < vector.length - 1; i += 2) {
            var from = [vector[i], vector[i + 1]];
            var to = transform(from);
            v.push.apply(v, __spreadArray([], __read(to), false));
        }
        return v;
    };
}
exports.extend = extend;
function extend3D(transform) {
    return function (vector) {
        var v = [];
        for (var i = 0; i < vector.length - 1; i += 3) {
            var from = [vector[i], vector[i + 1], vector[i + 2]];
            var to = transform(from);
            v.push.apply(v, __spreadArray([], __read(to), false));
        }
        return v;
    };
}
exports.extend3D = extend3D;
//# sourceMappingURL=extend.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588502, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustAngle = void 0;
function adjustAngle(theta, min, max) {
    while (theta < min)
        theta += Math.PI * 2;
    while (theta > max)
        theta -= Math.PI * 2;
    return theta;
}
exports.adjustAngle = adjustAngle;
//# sourceMappingURL=adjustAngle.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588503, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.scale3D = exports.transpose3D = exports.translate3D = exports.cartesian3D = exports.fisheyeCircular = exports.fisheyeY = exports.fisheyeX = exports.fisheye = exports.shearY = exports.shearX = exports.parallel = exports.helix = exports.rotate = exports.reflectY = exports.reflectX = exports.reflect = exports.scale = exports.transpose = exports.polar = exports.matrix = exports.custom = exports.cartesian = exports.translate = void 0;
var translate_1 = require("./translate");
Object.defineProperty(exports, "translate", { enumerable: true, get: function () { return translate_1.translate; } });
var cartesian_1 = require("./cartesian");
Object.defineProperty(exports, "cartesian", { enumerable: true, get: function () { return cartesian_1.cartesian; } });
var custom_1 = require("./custom");
Object.defineProperty(exports, "custom", { enumerable: true, get: function () { return custom_1.custom; } });
var matrix_1 = require("./matrix");
Object.defineProperty(exports, "matrix", { enumerable: true, get: function () { return matrix_1.matrix; } });
var polar_1 = require("./polar");
Object.defineProperty(exports, "polar", { enumerable: true, get: function () { return polar_1.polar; } });
var transpose_1 = require("./transpose");
Object.defineProperty(exports, "transpose", { enumerable: true, get: function () { return transpose_1.transpose; } });
var scale_1 = require("./scale");
Object.defineProperty(exports, "scale", { enumerable: true, get: function () { return scale_1.scale; } });
var reflect_1 = require("./reflect");
Object.defineProperty(exports, "reflect", { enumerable: true, get: function () { return reflect_1.reflect; } });
Object.defineProperty(exports, "reflectX", { enumerable: true, get: function () { return reflect_1.reflectX; } });
Object.defineProperty(exports, "reflectY", { enumerable: true, get: function () { return reflect_1.reflectY; } });
var rotate_1 = require("./rotate");
Object.defineProperty(exports, "rotate", { enumerable: true, get: function () { return rotate_1.rotate; } });
var helix_1 = require("./helix");
Object.defineProperty(exports, "helix", { enumerable: true, get: function () { return helix_1.helix; } });
var parallel_1 = require("./parallel");
Object.defineProperty(exports, "parallel", { enumerable: true, get: function () { return parallel_1.parallel; } });
var shear_1 = require("./shear");
Object.defineProperty(exports, "shearX", { enumerable: true, get: function () { return shear_1.shearX; } });
Object.defineProperty(exports, "shearY", { enumerable: true, get: function () { return shear_1.shearY; } });
var fisheye_1 = require("./fisheye");
Object.defineProperty(exports, "fisheye", { enumerable: true, get: function () { return fisheye_1.fisheye; } });
Object.defineProperty(exports, "fisheyeX", { enumerable: true, get: function () { return fisheye_1.fisheyeX; } });
Object.defineProperty(exports, "fisheyeY", { enumerable: true, get: function () { return fisheye_1.fisheyeY; } });
Object.defineProperty(exports, "fisheyeCircular", { enumerable: true, get: function () { return fisheye_1.fisheyeCircular; } });
var cartesian3D_1 = require("./cartesian3D");
Object.defineProperty(exports, "cartesian3D", { enumerable: true, get: function () { return cartesian3D_1.cartesian3D; } });
var translate3D_1 = require("./translate3D");
Object.defineProperty(exports, "translate3D", { enumerable: true, get: function () { return translate3D_1.translate3D; } });
var transpose3D_1 = require("./transpose3D");
Object.defineProperty(exports, "transpose3D", { enumerable: true, get: function () { return transpose3D_1.transpose3D; } });
var scale3D_1 = require("./scale3D");
Object.defineProperty(exports, "scale3D", { enumerable: true, get: function () { return scale3D_1.scale3D; } });
//# sourceMappingURL=index.js.map
}, function(modId) { var map = {"./translate":1774267588504,"./cartesian":1774267588505,"./custom":1774267588506,"./matrix":1774267588507,"./polar":1774267588508,"./transpose":1774267588509,"./scale":1774267588510,"./reflect":1774267588511,"./rotate":1774267588512,"./helix":1774267588513,"./parallel":1774267588514,"./shear":1774267588515,"./fisheye":1774267588516,"./cartesian3D":1774267588517,"./translate3D":1774267588518,"./transpose3D":1774267588519,"./scale3D":1774267588520}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588504, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translate = void 0;
var gl_matrix_1 = require("gl-matrix");
/**
 * Apply translate transformation for current vector.
 * @param params [tx, ty]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var translate = function (params, x, y, width, height) {
    var _a = __read(params, 2), tx = _a[0], ty = _a[1];
    var matrix = gl_matrix_1.mat3.create();
    return gl_matrix_1.mat3.fromTranslation(matrix, [tx, ty]);
};
exports.translate = translate;
//# sourceMappingURL=translate.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588505, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartesian = void 0;
var scale_1 = require("@antv/scale");
/**
 * Maps normalized value to the bounding box of coordinate.
 * @param params []
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var cartesian = function (params, x, y, width, height) {
    var sx = new scale_1.Linear({
        range: [x, x + width],
    });
    var sy = new scale_1.Linear({
        range: [y, y + height],
    });
    return {
        transform: function (vector) {
            var _a = __read(vector, 2), v1 = _a[0], v2 = _a[1];
            return [sx.map(v1), sy.map(v2)];
        },
        untransform: function (vector) {
            var _a = __read(vector, 2), v1 = _a[0], v2 = _a[1];
            return [sx.invert(v1), sy.invert(v2)];
        },
    };
};
exports.cartesian = cartesian;
//# sourceMappingURL=cartesian.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588506, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.custom = void 0;
/**
 * Add custom functional transformation for current vector.
 * @param params [callback]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var custom = function (params, x, y, width, height) {
    var _a = __read(params, 1), callback = _a[0];
    return callback(x, y, width, height);
};
exports.custom = custom;
//# sourceMappingURL=custom.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588507, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matrix = void 0;
/**
 * Apply custom  matrix for current vector.
 * @param params [Matrix3]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var matrix = function (params, x, y, width, height) {
    var _a = __read(params, 1), matrix = _a[0];
    return matrix;
};
exports.matrix = matrix;
//# sourceMappingURL=matrix.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588508, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.polar = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
var scale_1 = require("@antv/scale");
var utils_1 = require("../utils");
/**
 * Maps normalized value to normalized polar coordinate at the center of the bounding box.
 * It is used for Nightingale Rose Diagram.
 * @param params [x0, x1, y0, y1]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var polar = function (params, x, y, width, height) {
    var _a = __read(params, 4), startAngle = _a[0], endAngle = _a[1], innerRadius = _a[2], outerRadius = _a[3];
    var radius = new scale_1.Linear({
        range: [innerRadius, outerRadius],
    });
    var angle = new scale_1.Linear({
        range: [startAngle, endAngle],
    });
    var aspect = height / width;
    var sx = aspect > 1 ? 1 : aspect;
    var sy = aspect > 1 ? 1 / aspect : 1;
    return {
        transform: function (vector) {
            var _a = __read(vector, 2), v1 = _a[0], v2 = _a[1];
            var theta = angle.map(v1);
            var r = radius.map(v2);
            // 根据长宽比调整，使得极坐标系内切外接矩形
            var x = r * Math.cos(theta) * sx;
            var y = r * Math.sin(theta) * sy;
            // 将坐标的原点移动到外接矩形的中心，并且将长度设置为一半
            var dx = x * 0.5 + 0.5;
            var dy = y * 0.5 + 0.5;
            return [dx, dy];
        },
        untransform: function (vector) {
            var _a = __read(vector, 2), dx = _a[0], dy = _a[1];
            var x = ((dx - 0.5) * 2) / sx;
            var y = ((dy - 0.5) * 2) / sy;
            var r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
            var t = Math.atan2(y, x);
            var theta = (0, utils_1.adjustAngle)(t, startAngle, endAngle);
            var v1 = angle.invert(theta);
            var v2 = radius.invert(r);
            return [v1, v2];
        },
    };
};
exports.polar = polar;
//# sourceMappingURL=polar.js.map
}, function(modId) { var map = {"../utils":1774267588498}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588509, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transpose = void 0;
/**
 * Exchange dimensions of the vector.
 * @param params [tx, ty]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var transpose = function (params, x, y, width, height) {
    return {
        transform: function (_a) {
            var _b = __read(_a, 2), x = _b[0], y = _b[1];
            return [y, x];
        },
        untransform: function (_a) {
            var _b = __read(_a, 2), x = _b[0], y = _b[1];
            return [y, x];
        },
    };
};
exports.transpose = transpose;
//# sourceMappingURL=transpose.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588510, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scale = void 0;
var gl_matrix_1 = require("gl-matrix");
/**
 * Apply scale transformation for current vector.
 * @param params [sx, sy]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var scale = function (params, x, y, width, height) {
    var _a = __read(params, 2), sx = _a[0], sy = _a[1];
    var matrix = gl_matrix_1.mat3.create();
    return gl_matrix_1.mat3.fromScaling(matrix, [sx, sy]);
};
exports.scale = scale;
//# sourceMappingURL=scale.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588511, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reflectY = exports.reflectX = exports.reflect = void 0;
var scale_1 = require("./scale");
/**
 * Apply reflect transformation for current vector.
 * @param args same as scale
 * @returns transformer
 */
var reflect = function (params) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return scale_1.scale.apply(void 0, __spreadArray([[-1, -1]], __read(args), false));
};
exports.reflect = reflect;
/**
 * Apply reflect transformation for current vector.
 * @param args same as scale
 * @returns transformer
 */
var reflectX = function (params) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return scale_1.scale.apply(void 0, __spreadArray([[-1, 1]], __read(args), false));
};
exports.reflectX = reflectX;
/**
 * Apply reflect transformation for current vector.
 * @param args same as scale
 * @returns transformer
 */
var reflectY = function (params) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return scale_1.scale.apply(void 0, __spreadArray([[1, -1]], __read(args), false));
};
exports.reflectY = reflectY;
//# sourceMappingURL=reflect.js.map
}, function(modId) { var map = {"./scale":1774267588510}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588512, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotate = void 0;
var gl_matrix_1 = require("gl-matrix");
/**
 * Apply translate transformation for current vector.
 * @param params [tx, ty]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var rotate = function (params, x, y, width, height) {
    var _a = __read(params, 1), theta = _a[0];
    var matrix = gl_matrix_1.mat3.create();
    return gl_matrix_1.mat3.fromRotation(matrix, theta);
};
exports.rotate = rotate;
//# sourceMappingURL=rotate.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588513, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.helix = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
var scale_1 = require("@antv/scale");
var utils_1 = require("../utils");
/**
 * Maps normalized value to normalized helix coordinate at the center of the bounding box.
 * @param params [x0, x1, y0, y1]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var helix = function (params, x, y, width, height) {
    var _a = __read(params, 4), startAngle = _a[0], endAngle = _a[1], innerRadius = _a[2], outerRadius = _a[3];
    // 计算螺旋系数：r = a + b * theta
    // d = 2 * PI * b
    // 这里不管 startAngle 从多少开始，都从 0 开始计算
    // 这样才能保证坐标系在 bounding box 里面
    var count = (endAngle - 0) / (2 * Math.PI) + 1;
    var d = (outerRadius - innerRadius) / count;
    var b = d / (Math.PI * 2);
    // 当 theta 为 0 的时候的极径
    var step = new scale_1.Linear({
        range: [innerRadius, innerRadius + d * 0.99], // 防止和下一个螺线重合
    });
    var angle = new scale_1.Linear({
        range: [startAngle, endAngle],
    });
    var aspect = height / width;
    var sx = aspect > 1 ? 1 : aspect;
    var sy = aspect > 1 ? 1 / aspect : 1;
    return {
        transform: function (vector) {
            var _a = __read(vector, 2), v1 = _a[0], v2 = _a[1];
            var theta = angle.map(v1);
            var a = step.map(v2);
            // 根据长宽比调整，使得极坐标系内切外接矩形
            var x = Math.cos(theta) * (b * theta + a) * sx;
            var y = Math.sin(theta) * (b * theta + a) * sy;
            // 将坐标的原点移动到外接矩形的中心，并且将长度设置为一半
            var dx = x * 0.5 + 0.5;
            var dy = y * 0.5 + 0.5;
            return [dx, dy];
        },
        untransform: function (vector) {
            var _a = __read(vector, 2), dx = _a[0], dy = _a[1];
            var x = ((dx - 0.5) * 2) / sx;
            var y = ((dy - 0.5) * 2) / sy;
            var r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
            var t = Math.atan2(y, x) + Math.floor(r / d) * Math.PI * 2;
            var theta = (0, utils_1.adjustAngle)(t, startAngle, endAngle);
            var a = r - b * theta;
            var v1 = angle.invert(theta);
            var v2 = step.invert(a);
            return [v1, v2];
        },
    };
};
exports.helix = helix;
//# sourceMappingURL=helix.js.map
}, function(modId) { var map = {"../utils":1774267588498}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588514, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parallel = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
var scale_1 = require("@antv/scale");
/**
 * Apples parallel coordinate transform.
 * @param params [x0, x1, y0, y1]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var parallel = function (params, x, y, width, height) {
    var _a = __read(params, 4), x0 = _a[0], x1 = _a[1], y0 = _a[2], y1 = _a[3];
    var sy = new scale_1.Linear({
        range: [y0, y1],
    });
    return {
        transform: function (vector) {
            var v = [];
            var len = vector.length;
            var sx = new scale_1.Point({
                domain: new Array(len).fill(0).map(function (_, i) { return i; }),
                range: [x0, x1],
            });
            for (var i = 0; i < len; i++) {
                var e = vector[i];
                var x_1 = sx.map(i);
                var y_1 = sy.map(e);
                v.push(x_1, y_1);
            }
            return v;
        },
        untransform: function (vector) {
            var v = [];
            for (var i = 0; i < vector.length; i += 2) {
                var y_2 = vector[i + 1];
                v.push(sy.invert(y_2));
            }
            return v;
        },
    };
};
exports.parallel = parallel;
//# sourceMappingURL=parallel.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588515, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shearY = exports.shearX = void 0;
function cot(theta) {
    return 1 / Math.tan(theta);
}
/**
 * Applies shear transformation for the first dimension of vector2.
 * @param params [tx, ty]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var shearX = function (params, x, y, width, height) {
    var _a = __read(params, 1), theta = _a[0];
    var sx = cot(theta);
    return {
        transform: function (vector) {
            var _a = __read(vector, 2), x = _a[0], y = _a[1];
            var xx = x + y * sx;
            return [xx, y];
        },
        untransform: function (vector) {
            var _a = __read(vector, 2), xx = _a[0], y = _a[1];
            var x = xx - y * sx;
            return [x, y];
        },
    };
};
exports.shearX = shearX;
/**
 * Applies shear transformation for the second dimension of vector2.
 * @param params [tx, ty]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var shearY = function (params, x, y, width, height) {
    var _a = __read(params, 1), theta = _a[0];
    var sy = cot(theta);
    return {
        transform: function (vector) {
            var _a = __read(vector, 2), x = _a[0], y = _a[1];
            var yy = y + x * sy;
            return [x, yy];
        },
        untransform: function (vector) {
            var _a = __read(vector, 2), x = _a[0], yy = _a[1];
            var y = yy - x * sy;
            return [x, y];
        },
    };
};
exports.shearY = shearY;
//# sourceMappingURL=shear.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588516, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fisheyeCircular = exports.fisheye = exports.fisheyeY = exports.fisheyeX = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
// https://github.com/d3/d3-plugins/blob/master/fisheye/fisheye.js
var scale_1 = require("@antv/scale");
function fisheyeTransform(x, focus, distortion, min, max) {
    var left = x < focus;
    var m = (left ? focus - min : max - focus) || max - min;
    var f = left ? -1 : 1;
    return (f * m * (distortion + 1)) / (distortion + m / ((x - focus) * f)) + focus;
}
function fisheyeUntransform(tx, focus, distortion, min, max) {
    var left = tx < focus;
    var m = (left ? focus - min : max - focus) || max - min;
    var f = left ? -1 : 1;
    return m / ((m * (distortion + 1)) / (tx - focus) - distortion * f) + focus;
}
/**
 * Map actual visual point to abstract focus point(0, 1)
 */
function normalize(focus, length, isVisual) {
    if (!isVisual)
        return focus;
    var s = new scale_1.Linear({
        range: [0, 1],
        domain: [0, length],
    });
    return s.map(focus);
}
/**
 * Applies cartesian fisheye transforms for the first dimension of vector2.
 * @param params [focus, distortion]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var fisheyeX = function (params, x, y, width, height) {
    var _a = __read(params, 3), focus = _a[0], distortion = _a[1], _b = _a[2], isVisual = _b === void 0 ? false : _b;
    var normalizedFocusX = normalize(focus, width, isVisual);
    return {
        transform: function (vector) {
            var _a = __read(vector, 2), vx = _a[0], vy = _a[1];
            var fx = fisheyeTransform(vx, normalizedFocusX, distortion, 0, 1);
            return [fx, vy];
        },
        untransform: function (vector) {
            var _a = __read(vector, 2), fx = _a[0], vy = _a[1];
            var vx = fisheyeUntransform(fx, normalizedFocusX, distortion, 0, 1);
            return [vx, vy];
        },
    };
};
exports.fisheyeX = fisheyeX;
/**
 * Applies cartesian fisheye transforms for the second dimension of vector2.
 * @param params [focus, distortion]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var fisheyeY = function (params, x, y, width, height) {
    var _a = __read(params, 3), focus = _a[0], distortion = _a[1], _b = _a[2], isVisual = _b === void 0 ? false : _b;
    var normalizedFocusY = normalize(focus, height, isVisual);
    return {
        transform: function (vector) {
            var _a = __read(vector, 2), vx = _a[0], vy = _a[1];
            var fy = fisheyeTransform(vy, normalizedFocusY, distortion, 0, 1);
            return [vx, fy];
        },
        untransform: function (vector) {
            var _a = __read(vector, 2), vx = _a[0], fy = _a[1];
            var vy = fisheyeUntransform(fy, normalizedFocusY, distortion, 0, 1);
            return [vx, vy];
        },
    };
};
exports.fisheyeY = fisheyeY;
/**
 * Applies cartesian fisheye transforms for both dimensions of vector2.
 * @param params [focusX, focusY, distortionX, distortionY]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var fisheye = function (params, x, y, width, height) {
    var _a = __read(params, 5), focusX = _a[0], focusY = _a[1], distortionX = _a[2], distortionY = _a[3], _b = _a[4], isVisual = _b === void 0 ? false : _b;
    var normalizedFocusX = normalize(focusX, width, isVisual);
    var normalizedFocusY = normalize(focusY, height, isVisual);
    return {
        transform: function (vector) {
            var _a = __read(vector, 2), vx = _a[0], vy = _a[1];
            var fx = fisheyeTransform(vx, normalizedFocusX, distortionX, 0, 1);
            var fy = fisheyeTransform(vy, normalizedFocusY, distortionY, 0, 1);
            return [fx, fy];
        },
        untransform: function (vector) {
            var _a = __read(vector, 2), fx = _a[0], fy = _a[1];
            var vx = fisheyeUntransform(fx, normalizedFocusX, distortionX, 0, 1);
            var vy = fisheyeUntransform(fy, normalizedFocusY, distortionY, 0, 1);
            return [vx, vy];
        },
    };
};
exports.fisheye = fisheye;
/**
 * Applies circular fisheye transforms.
 * @param params [focusX, focusY, radius, distortion, isVisual?]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var fisheyeCircular = function (params, x, y, width, height) {
    var _a = __read(params, 5), focusX = _a[0], focusY = _a[1], radius = _a[2], distortion = _a[3], _b = _a[4], isVisual = _b === void 0 ? false : _b;
    var scaleX = new scale_1.Linear({
        range: [0, width],
    });
    var scaleY = new scale_1.Linear({
        range: [0, height],
    });
    // focus point => visual point
    var nx = isVisual ? focusX : scaleX.map(focusX);
    var ny = isVisual ? focusY : scaleY.map(focusY);
    return {
        transform: function (vector) {
            var _a = __read(vector, 2), x = _a[0], y = _a[1];
            // focus point => visual point
            var dx = scaleX.map(x) - nx;
            var dy = scaleY.map(y) - ny;
            var dd = Math.sqrt(dx * dx + dy * dy);
            if (dd > radius)
                return [x, y];
            var r = fisheyeTransform(dd, 0, distortion, 0, radius);
            var theta = Math.atan2(dy, dx);
            var fx = nx + r * Math.cos(theta);
            var fy = ny + r * Math.sin(theta);
            // visual point => focus point
            return [scaleX.invert(fx), scaleY.invert(fy)];
        },
        untransform: function (vector) {
            var _a = __read(vector, 2), tx = _a[0], ty = _a[1];
            var dx = scaleX.map(tx) - nx;
            var dy = scaleY.map(ty) - ny;
            var dd = Math.sqrt(dx * dx + dy * dy);
            if (dd > radius)
                return [tx, ty];
            var x = fisheyeUntransform(dd, 0, distortion, 0, radius);
            var theta = Math.atan2(dy, dx);
            var fx = nx + x * Math.cos(theta);
            var fy = ny + x * Math.sin(theta);
            return [scaleX.invert(fx), scaleY.invert(fy)];
        },
    };
};
exports.fisheyeCircular = fisheyeCircular;
//# sourceMappingURL=fisheye.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588517, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartesian3D = void 0;
var scale_1 = require("@antv/scale");
var cartesian3D = function (params, x, y, z, width, height, depth) {
    var sx = new scale_1.Linear({
        range: [x, x + width],
    });
    var sy = new scale_1.Linear({
        range: [y, y + height],
    });
    var sz = new scale_1.Linear({
        range: [z, z + depth],
    });
    return {
        transform: function (vector) {
            var _a = __read(vector, 3), v1 = _a[0], v2 = _a[1], v3 = _a[2];
            return [sx.map(v1), sy.map(v2), sz.map(v3)];
        },
        untransform: function (vector) {
            var _a = __read(vector, 3), v1 = _a[0], v2 = _a[1], v3 = _a[2];
            return [sx.invert(v1), sy.invert(v2), sz.invert(v3)];
        },
    };
};
exports.cartesian3D = cartesian3D;
//# sourceMappingURL=cartesian3D.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588518, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translate3D = void 0;
var gl_matrix_1 = require("gl-matrix");
/**
 * Apply translate transformation for current vector.
 * @param params [tx, ty, tz]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param z z of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @param depth depth of the the bounding box of coordinate
 * @returns transformer
 */
var translate3D = function (params, x, y, z, width, height, depth) {
    var _a = __read(params, 3), tx = _a[0], ty = _a[1], tz = _a[2];
    return gl_matrix_1.mat4.fromTranslation(gl_matrix_1.mat4.create(), [tx, ty, tz]);
};
exports.translate3D = translate3D;
//# sourceMappingURL=translate3D.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588519, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transpose3D = void 0;
/**
 * Exchange dimensions of the vector.
 * @param params [tx, ty]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @returns transformer
 */
var transpose3D = function (params, x, y, z, width, height, depth) {
    return {
        transform: function (_a) {
            var _b = __read(_a, 3), x = _b[0], y = _b[1], z = _b[2];
            return [y, x, z];
        },
        untransform: function (_a) {
            var _b = __read(_a, 3), x = _b[0], y = _b[1], z = _b[2];
            return [y, x, z];
        },
    };
};
exports.transpose3D = transpose3D;
//# sourceMappingURL=transpose3D.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588520, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scale3D = void 0;
var gl_matrix_1 = require("gl-matrix");
/**
 * Apply scale transformation for current vector.
 * @param params [sx, sy, sz]
 * @param x x of the the bounding box of coordinate
 * @param y y of the the bounding box of coordinate
 * @param z z of the the bounding box of coordinate
 * @param width width of the the bounding box of coordinate
 * @param height height of the the bounding box of coordinate
 * @param depth depth of the the bounding box of coordinate
 * @returns transformer
 */
var scale3D = function (params, x, y, z, width, height, depth) {
    var _a = __read(params, 3), sx = _a[0], sy = _a[1], sz = _a[2];
    return gl_matrix_1.mat4.fromScaling(gl_matrix_1.mat4.create(), [sx, sy, sz]);
};
exports.scale3D = scale3D;
//# sourceMappingURL=scale3D.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588521, function(require, module, exports) {

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Coordinate3D = void 0;
var util_1 = require("@antv/util");
var gl_matrix_1 = require("gl-matrix");
var utils_1 = require("./utils");
var transforms_1 = require("./transforms");
var Coordinate3D = /** @class */ (function () {
    /**
     * Create a new Coordinate Object.
     * @param options Custom options
     */
    function Coordinate3D(options) {
        // 当前的选项
        this.options = {
            x: 0,
            y: 0,
            z: 0,
            width: 300,
            height: 150,
            depth: 150,
            transformations: [],
        };
        // 当前可以使用的变换
        this.transformers = {
            cartesian3D: transforms_1.cartesian3D,
            translate3D: transforms_1.translate3D,
            scale3D: transforms_1.scale3D,
            transpose3D: transforms_1.transpose3D,
        };
        this.update(options);
    }
    /**
     * Update options and inner state.
     * @param options Options to be updated
     */
    Coordinate3D.prototype.update = function (options) {
        this.options = (0, util_1.deepMix)({}, this.options, options);
        this.recoordinate();
    };
    /**
     * Returns a new Coordinate with same options.
     * @returns Coordinate
     */
    Coordinate3D.prototype.clone = function () {
        return new Coordinate3D(this.options);
    };
    /**
     * Returns current options.
     * @returns options
     */
    Coordinate3D.prototype.getOptions = function () {
        return this.options;
    };
    /**
     * Clear transformations and update.
     */
    Coordinate3D.prototype.clear = function () {
        this.update({
            transformations: [],
        });
    };
    /**
     * Returns the size of the bounding box of the coordinate.
     * @returns [width, height, depth]
     */
    Coordinate3D.prototype.getSize = function () {
        var _a = this.options, width = _a.width, height = _a.height, depth = _a.depth;
        return [width, height, depth];
    };
    /**
     * Returns the center of the bounding box of the coordinate.
     * @returns [centerX, centerY, centerZ]
     */
    Coordinate3D.prototype.getCenter = function () {
        var _a = this.options, x = _a.x, y = _a.y, z = _a.z, width = _a.width, height = _a.height, depth = _a.depth;
        return [(x * 2 + width) / 2, (y * 2 + height) / 2, (z * 2 + depth) / 2];
    };
    /**
     * Add selected transformation.
     * @param args transform type and params
     * @returns Coordinate
     */
    Coordinate3D.prototype.transform = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var transformations = this.options.transformations;
        this.update({
            transformations: __spreadArray(__spreadArray([], __read(transformations), false), [__spreadArray([], __read(args), false)], false),
        });
        return this;
    };
    /**
     * Apples transformations for the current vector.
     * @param vector original vector3
     * @returns transformed vector3
     */
    Coordinate3D.prototype.map = function (vector) {
        return this.output(vector);
    };
    /**
     * Apples invert transformations for the current vector.
     * @param vector transformed vector3
     * @param vector original vector3
     */
    Coordinate3D.prototype.invert = function (vector) {
        return this.input(vector);
    };
    Coordinate3D.prototype.recoordinate = function () {
        this.output = this.compose();
        this.input = this.compose(true);
    };
    // 将所有的变换合成一个函数
    // 变换有两种类型：矩阵变换和函数变换
    // 处理过程中需要把连续的矩阵变换合成一个变换函数，然后在和其他变换函数合成最终的变换函数
    Coordinate3D.prototype.compose = function (invert) {
        var e_1, _a;
        if (invert === void 0) { invert = false; }
        var transformations = invert ? __spreadArray([], __read(this.options.transformations), false).reverse() : this.options.transformations;
        var getter = invert ? function (d) { return d.untransform; } : function (d) { return d.transform; };
        var matrixes = [];
        var transforms = [];
        var add = function (transform, extended) {
            if (extended === void 0) { extended = true; }
            return transforms.push(extended ? (0, utils_1.extend3D)(transform) : transform);
        };
        try {
            for (var transformations_1 = __values(transformations), transformations_1_1 = transformations_1.next(); !transformations_1_1.done; transformations_1_1 = transformations_1.next()) {
                var _b = __read(transformations_1_1.value), name_1 = _b[0], args = _b.slice(1);
                var createTransformer = this.transformers[name_1];
                if (createTransformer) {
                    var _c = this.options, x = _c.x, y = _c.y, z = _c.z, width = _c.width, height = _c.height, depth = _c.depth;
                    var transformer = createTransformer(__spreadArray([], __read(args), false), x, y, z, width, height, depth);
                    if ((0, utils_1.isMatrix)(transformer)) {
                        // 如果当前变换是矩阵变换，那么先保存下来
                        matrixes.push(transformer);
                    }
                    else {
                        // 如果当前变换是函数变换，并且之前有没有合成的矩阵变换，那么现将之前的矩阵变换合成
                        if (matrixes.length) {
                            var transform_1 = this.createMatrixTransform(matrixes, invert);
                            add(transform_1);
                            matrixes.splice(0, matrixes.length);
                        }
                        var transform = getter(transformer) || util_1.identity;
                        add(transform, true);
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (transformations_1_1 && !transformations_1_1.done && (_a = transformations_1.return)) _a.call(transformations_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // 合成剩下的矩阵变换
        if (matrixes.length) {
            var transform = this.createMatrixTransform(matrixes, invert);
            add(transform);
        }
        return utils_1.compose.apply(void 0, __spreadArray([], __read(transforms), false));
    };
    // 将连续的矩阵的运算合成一个变换函数
    Coordinate3D.prototype.createMatrixTransform = function (matrixes, invert) {
        var matrix = gl_matrix_1.mat4.create();
        if (invert)
            matrixes.reverse();
        matrixes.forEach(function (m) { return gl_matrix_1.mat4.mul(matrix, matrix, m); });
        if (invert) {
            gl_matrix_1.mat4.invert(matrix, gl_matrix_1.mat4.clone(matrix));
        }
        return function (vector) {
            var vector4 = [vector[0], vector[1], vector[2], 1];
            gl_matrix_1.vec4.transformMat4(vector4, vector4, matrix);
            return [vector4[0], vector4[1], vector4[2]];
        };
    };
    return Coordinate3D;
}());
exports.Coordinate3D = Coordinate3D;
//# sourceMappingURL=coordinate3D.js.map
}, function(modId) { var map = {"./utils":1774267588498,"./transforms":1774267588503}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1774267588496);
})()
//miniprogram-npm-outsideDeps=["@antv/util","gl-matrix","@antv/scale"]
//# sourceMappingURL=index.js.map