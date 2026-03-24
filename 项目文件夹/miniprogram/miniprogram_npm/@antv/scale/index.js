module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1774267588784, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.createInterpolateColor = exports.createInterpolateValue = exports.createInterpolateNumber = exports.DURATION_MONTH = exports.DURATION_YEAR = exports.DURATION_WEEK = exports.DURATION_DAY = exports.DURATION_HOUR = exports.DURATION_MINUTE = exports.DURATION_SECOND = exports.d3Time = exports.d3Log = exports.wilkinsonExtended = exports.rPretty = exports.d3Ticks = exports.Diverging = exports.Sequential = exports.Continuous = exports.Base = exports.Time = exports.Quantile = exports.Quantize = exports.Log = exports.Threshold = exports.Sqrt = exports.Pow = exports.Point = exports.Linear = exports.Identity = exports.Constant = exports.Ordinal = exports.Band = void 0;
// scales
var band_1 = require("./scales/band");
Object.defineProperty(exports, "Band", { enumerable: true, get: function () { return band_1.Band; } });
var ordinal_1 = require("./scales/ordinal");
Object.defineProperty(exports, "Ordinal", { enumerable: true, get: function () { return ordinal_1.Ordinal; } });
var constant_1 = require("./scales/constant");
Object.defineProperty(exports, "Constant", { enumerable: true, get: function () { return constant_1.Constant; } });
var identity_1 = require("./scales/identity");
Object.defineProperty(exports, "Identity", { enumerable: true, get: function () { return identity_1.Identity; } });
var linear_1 = require("./scales/linear");
Object.defineProperty(exports, "Linear", { enumerable: true, get: function () { return linear_1.Linear; } });
var point_1 = require("./scales/point");
Object.defineProperty(exports, "Point", { enumerable: true, get: function () { return point_1.Point; } });
var pow_1 = require("./scales/pow");
Object.defineProperty(exports, "Pow", { enumerable: true, get: function () { return pow_1.Pow; } });
var sqrt_1 = require("./scales/sqrt");
Object.defineProperty(exports, "Sqrt", { enumerable: true, get: function () { return sqrt_1.Sqrt; } });
var threshold_1 = require("./scales/threshold");
Object.defineProperty(exports, "Threshold", { enumerable: true, get: function () { return threshold_1.Threshold; } });
var log_1 = require("./scales/log");
Object.defineProperty(exports, "Log", { enumerable: true, get: function () { return log_1.Log; } });
var quantize_1 = require("./scales/quantize");
Object.defineProperty(exports, "Quantize", { enumerable: true, get: function () { return quantize_1.Quantize; } });
var quantile_1 = require("./scales/quantile");
Object.defineProperty(exports, "Quantile", { enumerable: true, get: function () { return quantile_1.Quantile; } });
var time_1 = require("./scales/time");
Object.defineProperty(exports, "Time", { enumerable: true, get: function () { return time_1.Time; } });
var base_1 = require("./scales/base");
Object.defineProperty(exports, "Base", { enumerable: true, get: function () { return base_1.Base; } });
var continuous_1 = require("./scales/continuous");
Object.defineProperty(exports, "Continuous", { enumerable: true, get: function () { return continuous_1.Continuous; } });
var sequential_1 = require("./scales/sequential");
Object.defineProperty(exports, "Sequential", { enumerable: true, get: function () { return sequential_1.Sequential; } });
var diverging_1 = require("./scales/diverging");
Object.defineProperty(exports, "Diverging", { enumerable: true, get: function () { return diverging_1.Diverging; } });
// tick-methods
var d3_ticks_1 = require("./tick-methods/d3-ticks");
Object.defineProperty(exports, "d3Ticks", { enumerable: true, get: function () { return d3_ticks_1.d3Ticks; } });
var r_pretty_1 = require("./tick-methods/r-pretty");
Object.defineProperty(exports, "rPretty", { enumerable: true, get: function () { return r_pretty_1.rPretty; } });
var wilkinson_extended_1 = require("./tick-methods/wilkinson-extended");
Object.defineProperty(exports, "wilkinsonExtended", { enumerable: true, get: function () { return wilkinson_extended_1.wilkinsonExtended; } });
var d3_log_1 = require("./tick-methods/d3-log");
Object.defineProperty(exports, "d3Log", { enumerable: true, get: function () { return d3_log_1.d3Log; } });
var d3_time_1 = require("./tick-methods/d3-time");
Object.defineProperty(exports, "d3Time", { enumerable: true, get: function () { return d3_time_1.d3Time; } });
// constants
var utils_1 = require("./utils");
Object.defineProperty(exports, "DURATION_SECOND", { enumerable: true, get: function () { return utils_1.DURATION_SECOND; } });
Object.defineProperty(exports, "DURATION_MINUTE", { enumerable: true, get: function () { return utils_1.DURATION_MINUTE; } });
Object.defineProperty(exports, "DURATION_HOUR", { enumerable: true, get: function () { return utils_1.DURATION_HOUR; } });
Object.defineProperty(exports, "DURATION_DAY", { enumerable: true, get: function () { return utils_1.DURATION_DAY; } });
Object.defineProperty(exports, "DURATION_WEEK", { enumerable: true, get: function () { return utils_1.DURATION_WEEK; } });
Object.defineProperty(exports, "DURATION_YEAR", { enumerable: true, get: function () { return utils_1.DURATION_YEAR; } });
Object.defineProperty(exports, "DURATION_MONTH", { enumerable: true, get: function () { return utils_1.DURATION_MONTH; } });
// interpolators
var utils_2 = require("./utils");
Object.defineProperty(exports, "createInterpolateNumber", { enumerable: true, get: function () { return utils_2.createInterpolateNumber; } });
Object.defineProperty(exports, "createInterpolateValue", { enumerable: true, get: function () { return utils_2.createInterpolateValue; } });
Object.defineProperty(exports, "createInterpolateColor", { enumerable: true, get: function () { return utils_2.createInterpolateColor; } });
//# sourceMappingURL=index.js.map
}, function(modId) {var map = {"./scales/band":1774267588785,"./scales/ordinal":1774267588805,"./scales/constant":1774267588807,"./scales/identity":1774267588809,"./scales/linear":1774267588812,"./scales/point":1774267588814,"./scales/pow":1774267588815,"./scales/sqrt":1774267588816,"./scales/threshold":1774267588817,"./scales/log":1774267588818,"./scales/quantize":1774267588820,"./scales/quantile":1774267588821,"./scales/time":1774267588823,"./scales/base":1774267588806,"./scales/continuous":1774267588813,"./scales/sequential":1774267588825,"./scales/diverging":1774267588826,"./tick-methods/d3-ticks":1774267588808,"./tick-methods/r-pretty":1774267588827,"./tick-methods/wilkinson-extended":1774267588810,"./tick-methods/d3-log":1774267588819,"./tick-methods/d3-time":1774267588824,"./utils":1774267588786}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588785, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Band = void 0;
const utils_1 = require("../utils");
const ordinal_1 = require("./ordinal");
function normalize(array) {
    const min = array.reduce((a, b) => Math.min(a, b), Infinity);
    return min === Infinity ? [] : array.map((d) => d / min);
}
function splice(array, n) {
    const sn = array.length;
    const diff = n - sn;
    return diff > 0 ? [...array, ...new Array(diff).fill(1)] : diff < 0 ? array.slice(0, n) : array;
}
function pretty(n) {
    return Math.round(n * 1e12) / 1e12;
}
/**
 * 基于 band 基础配置获取存在 flex band 的状态
 */
function computeFlexBandState(options) {
    // 如果 flex 比 domain 少，那么就补全
    // 如果 flex 比 domain 多，就截取
    const { domain, range, paddingOuter, paddingInner, flex: F, round, align } = options;
    const n = domain.length;
    const flex = splice(F, n);
    // 根据下面的等式可以计算出所有 step 的总和
    // stepSum = step1 + step2 ... + stepN;
    // stepAverage = stepSum / n;
    // PO = stepAverage * paddingOuter;
    // PI = stepAverage * paddingInner;
    // width = PO * 2 + stepSum - PI;
    const [start, end] = range;
    const width = end - start;
    const ratio = (2 / n) * paddingOuter + 1 - (1 / n) * paddingInner;
    const stepSum = width / ratio;
    // stepSum = (b1 + PI) + (b2 + PI) ... + (bN + PI)
    // = bandSum + PI * n;
    const PI = (stepSum * paddingInner) / n;
    const bandWidthSum = stepSum - n * PI;
    // 计算出最小的 bandWidth
    const normalizedFlex = normalize(flex);
    const flexSum = normalizedFlex.reduce((sum, value) => sum + value);
    const minBandWidth = bandWidthSum / flexSum;
    // 计算每个 bandWidth 和 step，并且用定义域内的值索引
    const valueBandWidth = new utils_1.InternMap(domain.map((d, i) => {
        const bandWidth = normalizedFlex[i] * minBandWidth;
        return [d, round ? Math.floor(bandWidth) : bandWidth];
    }));
    const valueStep = new utils_1.InternMap(domain.map((d, i) => {
        const bandWidth = normalizedFlex[i] * minBandWidth;
        const step = bandWidth + PI;
        return [d, round ? Math.floor(step) : step];
    }));
    // 计算起始位置的偏移量
    // 因为 step 可能被 round 了，重新计算所有的 step 的总和
    const finalStepSum = Array.from(valueStep.values()).reduce((sum, value) => sum + value);
    const outerPaddingSum = width - (finalStepSum - (finalStepSum / n) * paddingInner);
    const offset = outerPaddingSum * align;
    // 计算 adjustedRange，也就是 domain 中每个值映射之后的值
    const bandStart = start + offset;
    let prev = round ? Math.round(bandStart) : bandStart;
    const adjustedRange = new Array(n);
    for (let i = 0; i < n; i += 1) {
        // 简单处理精度问题
        adjustedRange[i] = pretty(prev);
        const value = domain[i];
        prev += valueStep.get(value);
    }
    return {
        valueBandWidth,
        valueStep,
        adjustedRange,
    };
}
/**
 * 基于 band 基础配置获取 band 的状态
 */
function computeBandState(options) {
    var _a;
    const { domain } = options;
    const n = domain.length;
    if (n === 0) {
        return {
            valueBandWidth: undefined,
            valueStep: undefined,
            adjustedRange: [],
        };
    }
    const hasFlex = !!((_a = options.flex) === null || _a === void 0 ? void 0 : _a.length);
    if (hasFlex) {
        return computeFlexBandState(options);
    }
    const { range, paddingOuter, paddingInner, round, align } = options;
    let step;
    let bandWidth;
    let rangeStart = range[0];
    const rangeEnd = range[1];
    // range 的计算方式如下：
    // = stop - start
    // = (n * step(n 个 step) )
    // + (2 * step * paddingOuter(两边的 padding))
    // - (1 * step * paddingInner(多出的一个 inner))
    const deltaRange = rangeEnd - rangeStart;
    const outerTotal = paddingOuter * 2;
    const innerTotal = n - paddingInner;
    step = deltaRange / Math.max(1, outerTotal + innerTotal);
    // 优化成整数
    if (round) {
        step = Math.floor(step);
    }
    // 基于 align 实现偏移
    rangeStart += (deltaRange - step * (n - paddingInner)) * align;
    // 一个 step 的组成如下：
    // step = bandWidth + step * paddingInner，
    // 则 bandWidth = step - step * (paddingInner)
    bandWidth = step * (1 - paddingInner);
    if (round) {
        rangeStart = Math.round(rangeStart);
        bandWidth = Math.round(bandWidth);
    }
    // 转化后的 range
    const adjustedRange = new Array(n).fill(0).map((_, i) => rangeStart + i * step);
    return {
        valueStep: step,
        valueBandWidth: bandWidth,
        adjustedRange,
    };
}
/**
 * Band 比例尺
 *
 * 一种特殊的 ordinal scale，区别在于值域的范围是连续的。
 * 使用的场景例如柱状图，可以用来定位各个柱子水平方向距离原点开始绘制的距离、各柱子之间的间距
 *
 * 由于部分选项较为抽象，见下图描述：
 *
 * BN = bandWidthN
 * SN = stepN
 * domain = [A, B]
 *
 * 约束关系如下
 * width = PO + B1 + PI + B2 + PI ... + BN + PO;
 * PO = (S1 + S2 + ... SN) / N * paddingOuter
 * PI = (S1 + S2 + ... SN) / N * paddingInner
 * BN / BN-1 = flex[n] / flex[n-1]
 *
 * |<------------------------------------------- range ------------------------------------------->|
 * |             |                   |             |                   |             |             |
 * |<-----PO---->|<------B1--------->|<-----PI---->|<-------B2-------->|<----PI----->|<-----PO---->|
 * |             | ***************** |             | ***************** |             |             |
 * |             | ******* A ******* |             | ******* B ******* |             |             |
 * |             | ***************** |             | ***************** |             |             |
 * |             |<--------------S1--------------->| <--------------S2-------------->|                                              |
 * |-----------------------------------------------------------------------------------------------|
 *
 */
class Band extends ordinal_1.Ordinal {
    // 覆盖默认配置
    getDefaultOptions() {
        return {
            domain: [],
            range: [0, 1],
            align: 0.5,
            round: false,
            paddingInner: 0,
            paddingOuter: 0,
            padding: 0,
            unknown: ordinal_1.defaultUnknown,
            flex: [],
        };
    }
    // 显示指定 options 的类型为 OrdinalOptions，从而推断出 O 的类型
    constructor(options) {
        super(options);
    }
    clone() {
        return new Band(this.options);
    }
    getStep(x) {
        if (this.valueStep === undefined)
            return 1;
        // 没有 flex 的情况时, valueStep 是 number 类型
        if (typeof this.valueStep === 'number') {
            return this.valueStep;
        }
        // 对于 flex 都为 1 的情况，x 不是必须要传入的
        // 这种情况所有的条的 step 都相等，所以返回第一个就好
        if (x === undefined)
            return Array.from(this.valueStep.values())[0];
        return this.valueStep.get(x);
    }
    getBandWidth(x) {
        if (this.valueBandWidth === undefined)
            return 1;
        // 没有 flex, valueBandWidth 是 number 类型
        if (typeof this.valueBandWidth === 'number') {
            return this.valueBandWidth;
        }
        // 对于 flex 都为 1 的情况，x 不是必须要传入的
        // 这种情况所有的条的 bandWidth 都相等，所以返回第一个
        if (x === undefined)
            return Array.from(this.valueBandWidth.values())[0];
        return this.valueBandWidth.get(x);
    }
    getRange() {
        return this.adjustedRange;
    }
    getPaddingInner() {
        const { padding, paddingInner } = this.options;
        return padding > 0 ? padding : paddingInner;
    }
    getPaddingOuter() {
        const { padding, paddingOuter } = this.options;
        return padding > 0 ? padding : paddingOuter;
    }
    rescale() {
        super.rescale();
        // 当用户配置了opt.padding 且非 0 时，我们覆盖已经设置的 paddingInner paddingOuter
        // 我们约定 padding 的优先级较 paddingInner 和 paddingOuter 高
        const { align, domain, range, round, flex } = this.options;
        const { adjustedRange, valueBandWidth, valueStep } = computeBandState({
            align,
            range,
            round,
            flex,
            paddingInner: this.getPaddingInner(),
            paddingOuter: this.getPaddingOuter(),
            domain,
        });
        // 更新必要的属性
        this.valueStep = valueStep;
        this.valueBandWidth = valueBandWidth;
        this.adjustedRange = adjustedRange;
    }
}
exports.Band = Band;
//# sourceMappingURL=band.js.map
}, function(modId) { var map = {"../utils":1774267588786,"./ordinal":1774267588805}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588786, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.InternMap = exports.chooseNiceTimeMask = exports.utcIntervalMap = exports.utcYear = exports.utcMonth = exports.utcWeek = exports.utcDay = exports.utcHour = exports.utcMinute = exports.utcSecond = exports.utcMillisecond = exports.localIntervalMap = exports.year = exports.month = exports.week = exports.day = exports.hour = exports.minute = exports.second = exports.millisecond = exports.DURATION_YEAR = exports.DURATION_MONTH = exports.DURATION_WEEK = exports.DURATION_DAY = exports.DURATION_HOUR = exports.DURATION_MINUTE = exports.DURATION_SECOND = exports.createInterpolateColor = exports.createInterpolateNumber = exports.createInterpolateRound = exports.createInterpolateValue = exports.interpolatize = exports.findTickInterval = exports.tickStep = exports.tickIncrement = exports.d3LogNice = exports.pows = exports.logs = exports.isValid = exports.d3TimeNice = exports.d3LinearNice = exports.bisect = exports.createClamp = exports.createNormalize = exports.compose = void 0;
var compose_1 = require("./compose");
Object.defineProperty(exports, "compose", { enumerable: true, get: function () { return compose_1.compose; } });
var normalize_1 = require("./normalize");
Object.defineProperty(exports, "createNormalize", { enumerable: true, get: function () { return normalize_1.createNormalize; } });
var clamp_1 = require("./clamp");
Object.defineProperty(exports, "createClamp", { enumerable: true, get: function () { return clamp_1.createClamp; } });
var bisect_1 = require("./bisect");
Object.defineProperty(exports, "bisect", { enumerable: true, get: function () { return bisect_1.bisect; } });
var d3_linear_nice_1 = require("./d3-linear-nice");
Object.defineProperty(exports, "d3LinearNice", { enumerable: true, get: function () { return d3_linear_nice_1.d3LinearNice; } });
var d3_time_nice_1 = require("./d3-time-nice");
Object.defineProperty(exports, "d3TimeNice", { enumerable: true, get: function () { return d3_time_nice_1.d3TimeNice; } });
var is_valid_1 = require("./is-valid");
Object.defineProperty(exports, "isValid", { enumerable: true, get: function () { return is_valid_1.isValid; } });
var log_1 = require("./log");
Object.defineProperty(exports, "logs", { enumerable: true, get: function () { return log_1.logs; } });
Object.defineProperty(exports, "pows", { enumerable: true, get: function () { return log_1.pows; } });
var d3_log_nice_1 = require("./d3-log-nice");
Object.defineProperty(exports, "d3LogNice", { enumerable: true, get: function () { return d3_log_nice_1.d3LogNice; } });
var ticks_1 = require("./ticks");
Object.defineProperty(exports, "tickIncrement", { enumerable: true, get: function () { return ticks_1.tickIncrement; } });
Object.defineProperty(exports, "tickStep", { enumerable: true, get: function () { return ticks_1.tickStep; } });
var find_tick_interval_1 = require("./find-tick-interval");
Object.defineProperty(exports, "findTickInterval", { enumerable: true, get: function () { return find_tick_interval_1.findTickInterval; } });
var interpolatize_1 = require("./interpolatize");
Object.defineProperty(exports, "interpolatize", { enumerable: true, get: function () { return interpolatize_1.interpolatize; } });
var interpolate_1 = require("./interpolate");
Object.defineProperty(exports, "createInterpolateValue", { enumerable: true, get: function () { return interpolate_1.createInterpolateValue; } });
Object.defineProperty(exports, "createInterpolateRound", { enumerable: true, get: function () { return interpolate_1.createInterpolateRound; } });
Object.defineProperty(exports, "createInterpolateNumber", { enumerable: true, get: function () { return interpolate_1.createInterpolateNumber; } });
Object.defineProperty(exports, "createInterpolateColor", { enumerable: true, get: function () { return interpolate_1.createInterpolateColor; } });
var time_interval_1 = require("./time-interval");
Object.defineProperty(exports, "DURATION_SECOND", { enumerable: true, get: function () { return time_interval_1.DURATION_SECOND; } });
Object.defineProperty(exports, "DURATION_MINUTE", { enumerable: true, get: function () { return time_interval_1.DURATION_MINUTE; } });
Object.defineProperty(exports, "DURATION_HOUR", { enumerable: true, get: function () { return time_interval_1.DURATION_HOUR; } });
Object.defineProperty(exports, "DURATION_DAY", { enumerable: true, get: function () { return time_interval_1.DURATION_DAY; } });
Object.defineProperty(exports, "DURATION_WEEK", { enumerable: true, get: function () { return time_interval_1.DURATION_WEEK; } });
Object.defineProperty(exports, "DURATION_MONTH", { enumerable: true, get: function () { return time_interval_1.DURATION_MONTH; } });
Object.defineProperty(exports, "DURATION_YEAR", { enumerable: true, get: function () { return time_interval_1.DURATION_YEAR; } });
Object.defineProperty(exports, "millisecond", { enumerable: true, get: function () { return time_interval_1.millisecond; } });
Object.defineProperty(exports, "second", { enumerable: true, get: function () { return time_interval_1.second; } });
Object.defineProperty(exports, "minute", { enumerable: true, get: function () { return time_interval_1.minute; } });
Object.defineProperty(exports, "hour", { enumerable: true, get: function () { return time_interval_1.hour; } });
Object.defineProperty(exports, "day", { enumerable: true, get: function () { return time_interval_1.day; } });
Object.defineProperty(exports, "week", { enumerable: true, get: function () { return time_interval_1.week; } });
Object.defineProperty(exports, "month", { enumerable: true, get: function () { return time_interval_1.month; } });
Object.defineProperty(exports, "year", { enumerable: true, get: function () { return time_interval_1.year; } });
Object.defineProperty(exports, "localIntervalMap", { enumerable: true, get: function () { return time_interval_1.localIntervalMap; } });
var utc_interval_1 = require("./utc-interval");
Object.defineProperty(exports, "utcMillisecond", { enumerable: true, get: function () { return utc_interval_1.utcMillisecond; } });
Object.defineProperty(exports, "utcSecond", { enumerable: true, get: function () { return utc_interval_1.utcSecond; } });
Object.defineProperty(exports, "utcMinute", { enumerable: true, get: function () { return utc_interval_1.utcMinute; } });
Object.defineProperty(exports, "utcHour", { enumerable: true, get: function () { return utc_interval_1.utcHour; } });
Object.defineProperty(exports, "utcDay", { enumerable: true, get: function () { return utc_interval_1.utcDay; } });
Object.defineProperty(exports, "utcWeek", { enumerable: true, get: function () { return utc_interval_1.utcWeek; } });
Object.defineProperty(exports, "utcMonth", { enumerable: true, get: function () { return utc_interval_1.utcMonth; } });
Object.defineProperty(exports, "utcYear", { enumerable: true, get: function () { return utc_interval_1.utcYear; } });
Object.defineProperty(exports, "utcIntervalMap", { enumerable: true, get: function () { return utc_interval_1.utcIntervalMap; } });
var choose_mask_1 = require("./choose-mask");
Object.defineProperty(exports, "chooseNiceTimeMask", { enumerable: true, get: function () { return choose_mask_1.chooseNiceTimeMask; } });
var internMap_1 = require("./internMap");
Object.defineProperty(exports, "InternMap", { enumerable: true, get: function () { return internMap_1.InternMap; } });
//# sourceMappingURL=index.js.map
}, function(modId) { var map = {"./compose":1774267588787,"./normalize":1774267588788,"./clamp":1774267588789,"./bisect":1774267588790,"./d3-linear-nice":1774267588791,"./d3-time-nice":1774267588793,"./is-valid":1774267588797,"./log":1774267588798,"./d3-log-nice":1774267588799,"./ticks":1774267588792,"./find-tick-interval":1774267588794,"./interpolatize":1774267588800,"./interpolate":1774267588801,"./time-interval":1774267588795,"./utc-interval":1774267588796,"./choose-mask":1774267588803,"./internMap":1774267588804}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588787, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.compose = void 0;
/**
 * 将多个单个参数的函数合成为一个函数，执行顺序为从右到左
 * @param fn 第一个函数
 * @param rest 剩余函数
 * @returns 复合后的函数
 */
function compose(fn, ...rest) {
    return rest.reduce((pre, cur) => (x) => pre(cur(x)), fn);
}
exports.compose = compose;
//# sourceMappingURL=compose.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588788, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.createNormalize = void 0;
/**
 * 返回一个 normalize 函数，该函数将输入的 t 从 [a, b] 线性变换到 [0, 1]
 * @param a 输入 t 的最小值
 * @param b 输入 t 的最大值
 * @returns normalize 函数
 */
function createNormalize(a, b) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return b - a ? (t) => (t - a) / (b - a) : (_) => 0.5;
}
exports.createNormalize = createNormalize;
//# sourceMappingURL=normalize.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588789, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.createClamp = void 0;
/**
 * 返回一个 clamp 函数，将输入限定在指定范围之内
 * @param a 范围的第一个端点
 * @param b 范围的第二个端点
 * @returns clamp 函数
 */
function createClamp(a, b) {
    const lo = b < a ? b : a;
    const hi = a > b ? a : b;
    return (x) => Math.min(Math.max(lo, x), hi);
}
exports.createClamp = createClamp;
//# sourceMappingURL=clamp.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588790, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.bisect = void 0;
/**
 * 在一个升序的序列指定范围内 array[lo, hi) 二分查找一个值 x，返回最右边一个匹配的值后面的索引 i
 * https://github.com/d3/d3-array/blob/master/src/bisector.js
 * @param array 升序的目标数组
 * @param x 查找的值
 * @param lo 开始的索引
 * @param hi 结束的索引
 * @returns 最右边一个匹配的值后一个的索引
 */
function bisect(array, x, lo, hi, getter) {
    let i = lo || 0;
    let j = hi || array.length;
    const get = getter || ((x) => x);
    while (i < j) {
        const mid = Math.floor((i + j) / 2);
        if (get(array[mid]) > x) {
            j = mid;
        }
        else {
            i = mid + 1;
        }
    }
    return i;
}
exports.bisect = bisect;
//# sourceMappingURL=bisect.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588791, function(require, module, exports) {

// 参考 d3-ticks nice 的实现
// https://github.com/d3/d3-scale
Object.defineProperty(exports, "__esModule", { value: true });
exports.d3LinearNice = void 0;
const ticks_1 = require("./ticks");
const d3LinearNice = (min, max, count = 5) => {
    const d = [min, max];
    let i0 = 0;
    let i1 = d.length - 1;
    let start = d[i0];
    let stop = d[i1];
    let step;
    if (stop < start) {
        [start, stop] = [stop, start];
        [i0, i1] = [i1, i0];
    }
    step = (0, ticks_1.tickIncrement)(start, stop, count);
    if (step > 0) {
        start = Math.floor(start / step) * step;
        stop = Math.ceil(stop / step) * step;
        step = (0, ticks_1.tickIncrement)(start, stop, count);
    }
    else if (step < 0) {
        start = Math.ceil(start * step) / step;
        stop = Math.floor(stop * step) / step;
        step = (0, ticks_1.tickIncrement)(start, stop, count);
    }
    if (step > 0) {
        d[i0] = Math.floor(start / step) * step;
        d[i1] = Math.ceil(stop / step) * step;
    }
    else if (step < 0) {
        d[i0] = Math.ceil(start * step) / step;
        d[i1] = Math.floor(stop * step) / step;
    }
    return d;
};
exports.d3LinearNice = d3LinearNice;
//# sourceMappingURL=d3-linear-nice.js.map
}, function(modId) { var map = {"./ticks":1774267588792}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588792, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.tickStep = exports.tickIncrement = void 0;
const e10 = Math.sqrt(50);
const e5 = Math.sqrt(10);
const e2 = Math.sqrt(2);
function tickIncrement(start, stop, count) {
    const step = (stop - start) / Math.max(0, count);
    const power = Math.floor(Math.log(step) / Math.LN10);
    const error = step / 10 ** power;
    if (power >= 0) {
        // eslint-disable-next-line no-nested-ternary
        return (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * 10 ** power;
    }
    // eslint-disable-next-line no-nested-ternary
    return -(10 ** -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
}
exports.tickIncrement = tickIncrement;
function tickStep(start, stop, count) {
    const step0 = Math.abs(stop - start) / Math.max(0, count);
    let step1 = 10 ** Math.floor(Math.log(step0) / Math.LN10);
    const error = step0 / step1;
    if (error >= e10)
        step1 *= 10;
    else if (error >= e5)
        step1 *= 5;
    else if (error >= e2)
        step1 *= 2;
    return stop < start ? -step1 : step1;
}
exports.tickStep = tickStep;
//# sourceMappingURL=ticks.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588793, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.d3TimeNice = void 0;
const find_tick_interval_1 = require("./find-tick-interval");
const d3TimeNice = (min, max, count, interval, utc) => {
    const r = min > max;
    const lo = r ? max : min;
    const hi = r ? min : max;
    const [tickInterval, step] = (0, find_tick_interval_1.findTickInterval)(lo, hi, count, interval, utc);
    const domain = [tickInterval.floor(lo, step), tickInterval.ceil(hi, step)];
    return r ? domain.reverse() : domain;
};
exports.d3TimeNice = d3TimeNice;
//# sourceMappingURL=d3-time-nice.js.map
}, function(modId) { var map = {"./find-tick-interval":1774267588794}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588794, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.findTickInterval = void 0;
const time_interval_1 = require("./time-interval");
const utc_interval_1 = require("./utc-interval");
const bisect_1 = require("./bisect");
const ticks_1 = require("./ticks");
function chooseTickIntervals(utc) {
    const intervalMap = utc ? utc_interval_1.utcIntervalMap : time_interval_1.localIntervalMap;
    const { year, month, week, day, hour, minute, second, millisecond } = intervalMap;
    const tickIntervals = [
        [second, 1],
        [second, 5],
        [second, 15],
        [second, 30],
        [minute, 1],
        [minute, 5],
        [minute, 15],
        [minute, 30],
        [hour, 1],
        [hour, 3],
        [hour, 6],
        [hour, 12],
        [day, 1],
        [day, 2],
        [week, 1],
        [month, 1],
        [month, 3],
        [year, 1],
    ];
    return {
        tickIntervals,
        year,
        millisecond,
    };
}
function findTickInterval(start, stop, count, interval, utc) {
    const lo = +start;
    const hi = +stop;
    const { tickIntervals, year, millisecond } = chooseTickIntervals(utc);
    const getter = ([interval, count]) => interval.duration * count;
    const targetCount = interval ? (hi - lo) / interval : count || 5;
    const targetInterval = interval || (hi - lo) / targetCount;
    const len = tickIntervals.length;
    const i = (0, bisect_1.bisect)(tickIntervals, targetInterval, 0, len, getter);
    let matchInterval;
    if (i === len) {
        const step = (0, ticks_1.tickStep)(lo / year.duration, hi / year.duration, targetCount);
        matchInterval = [year, step];
    }
    else if (i) {
        const closeToLow = targetInterval / getter(tickIntervals[i - 1]) < getter(tickIntervals[i]) / targetInterval;
        const [timeInterval, targetStep] = closeToLow ? tickIntervals[i - 1] : tickIntervals[i];
        const step = interval ? Math.ceil(interval / timeInterval.duration) : targetStep;
        matchInterval = [timeInterval, step];
    }
    else {
        const step = Math.max((0, ticks_1.tickStep)(lo, hi, targetCount), 1);
        matchInterval = [millisecond, step];
    }
    return matchInterval;
}
exports.findTickInterval = findTickInterval;
//# sourceMappingURL=find-tick-interval.js.map
}, function(modId) { var map = {"./time-interval":1774267588795,"./utc-interval":1774267588796,"./bisect":1774267588790,"./ticks":1774267588792}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588795, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.localIntervalMap = exports.year = exports.week = exports.month = exports.day = exports.hour = exports.minute = exports.second = exports.millisecond = exports.createInterval = exports.DURATION_YEAR = exports.DURATION_MONTH = exports.DURATION_WEEK = exports.DURATION_DAY = exports.DURATION_HOUR = exports.DURATION_MINUTE = exports.DURATION_SECOND = void 0;
exports.DURATION_SECOND = 1000;
exports.DURATION_MINUTE = exports.DURATION_SECOND * 60;
exports.DURATION_HOUR = exports.DURATION_MINUTE * 60;
exports.DURATION_DAY = exports.DURATION_HOUR * 24;
exports.DURATION_WEEK = exports.DURATION_DAY * 7;
exports.DURATION_MONTH = exports.DURATION_DAY * 30;
exports.DURATION_YEAR = exports.DURATION_DAY * 365;
function createInterval(duration, floorish, offseti, field) {
    const adjust = (date, step) => {
        const test = (date) => field(date) % step === 0;
        let i = step;
        while (i && !test(date)) {
            offseti(date, -1);
            i -= 1;
        }
        return date;
    };
    const floori = (date, step) => {
        if (step)
            adjust(date, step);
        floorish(date);
    };
    const floor = (date, step) => {
        const d = new Date(+date);
        floori(d, step);
        return d;
    };
    const ceil = (date, step) => {
        const d = new Date(+date - 1);
        floori(d, step);
        offseti(d, step);
        floori(d);
        return d;
    };
    const range = (start, stop, step, shouldAdjust) => {
        const ticks = [];
        const roundStep = Math.floor(step);
        const t = shouldAdjust ? ceil(start, step) : ceil(start);
        for (let i = t; i < stop; offseti(i, roundStep), floori(i)) {
            ticks.push(new Date(+i));
        }
        return ticks;
    };
    return {
        ceil,
        floor,
        range,
        duration,
    };
}
exports.createInterval = createInterval;
exports.millisecond = createInterval(1, (date) => date, (date, step = 1) => {
    date.setTime(+date + step);
}, (date) => date.getTime());
exports.second = createInterval(exports.DURATION_SECOND, (date) => {
    date.setMilliseconds(0);
}, (date, step = 1) => {
    date.setTime(+date + exports.DURATION_SECOND * step);
}, (date) => date.getSeconds());
exports.minute = createInterval(exports.DURATION_MINUTE, (date) => {
    date.setSeconds(0, 0);
}, (date, step = 1) => {
    date.setTime(+date + exports.DURATION_MINUTE * step);
}, (date) => date.getMinutes());
exports.hour = createInterval(exports.DURATION_HOUR, (date) => {
    date.setMinutes(0, 0, 0);
}, (date, step = 1) => {
    date.setTime(+date + exports.DURATION_HOUR * step);
}, (date) => date.getHours());
exports.day = createInterval(exports.DURATION_DAY, (date) => {
    date.setHours(0, 0, 0, 0);
}, (date, step = 1) => {
    date.setTime(+date + exports.DURATION_DAY * step);
}, (date) => date.getDate() - 1);
exports.month = createInterval(exports.DURATION_MONTH, (date) => {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
}, (date, step = 1) => {
    const month = date.getMonth();
    date.setMonth(month + step);
}, (date) => date.getMonth());
exports.week = createInterval(exports.DURATION_WEEK, (date) => {
    date.setDate(date.getDate() - (date.getDay() % 7));
    date.setHours(0, 0, 0, 0);
}, (date, step = 1) => {
    date.setDate(date.getDate() + 7 * step);
}, (date) => {
    const start = exports.month.floor(date);
    const end = new Date(+date);
    return Math.floor((+end - +start) / exports.DURATION_WEEK);
});
exports.year = createInterval(exports.DURATION_YEAR, (date) => {
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
}, (date, step = 1) => {
    const year = date.getFullYear();
    date.setFullYear(year + step);
}, (date) => date.getFullYear());
exports.localIntervalMap = {
    millisecond: exports.millisecond,
    second: exports.second,
    minute: exports.minute,
    hour: exports.hour,
    day: exports.day,
    week: exports.week,
    month: exports.month,
    year: exports.year,
};
//# sourceMappingURL=time-interval.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588796, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.utcIntervalMap = exports.utcYear = exports.utcWeek = exports.utcMonth = exports.utcDay = exports.utcHour = exports.utcMinute = exports.utcSecond = exports.utcMillisecond = void 0;
const time_interval_1 = require("./time-interval");
exports.utcMillisecond = (0, time_interval_1.createInterval)(1, (date) => date, (date, step = 1) => {
    date.setTime(+date + step);
}, (date) => date.getTime());
exports.utcSecond = (0, time_interval_1.createInterval)(time_interval_1.DURATION_SECOND, (date) => {
    date.setUTCMilliseconds(0);
}, (date, step = 1) => {
    date.setTime(+date + time_interval_1.DURATION_SECOND * step);
}, (date) => date.getUTCSeconds());
exports.utcMinute = (0, time_interval_1.createInterval)(time_interval_1.DURATION_MINUTE, (date) => {
    date.setUTCSeconds(0, 0);
}, (date, step = 1) => {
    date.setTime(+date + time_interval_1.DURATION_MINUTE * step);
}, (date) => date.getUTCMinutes());
exports.utcHour = (0, time_interval_1.createInterval)(time_interval_1.DURATION_HOUR, (date) => {
    date.setUTCMinutes(0, 0, 0);
}, (date, step = 1) => {
    date.setTime(+date + time_interval_1.DURATION_HOUR * step);
}, (date) => date.getUTCHours());
exports.utcDay = (0, time_interval_1.createInterval)(time_interval_1.DURATION_DAY, (date) => {
    date.setUTCHours(0, 0, 0, 0);
}, (date, step = 1) => {
    date.setTime(+date + time_interval_1.DURATION_DAY * step);
}, (date) => date.getUTCDate() - 1);
exports.utcMonth = (0, time_interval_1.createInterval)(time_interval_1.DURATION_MONTH, (date) => {
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
}, (date, step = 1) => {
    const month = date.getUTCMonth();
    date.setUTCMonth(month + step);
}, (date) => date.getUTCMonth());
exports.utcWeek = (0, time_interval_1.createInterval)(time_interval_1.DURATION_WEEK, (date) => {
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 7) % 7));
    date.setUTCHours(0, 0, 0, 0);
}, (date, step = 1) => {
    date.setTime(+date + time_interval_1.DURATION_WEEK * step);
}, (date) => {
    const start = exports.utcMonth.floor(date);
    const end = new Date(+date);
    return Math.floor((+end - +start) / time_interval_1.DURATION_WEEK);
});
exports.utcYear = (0, time_interval_1.createInterval)(time_interval_1.DURATION_YEAR, (date) => {
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
}, (date, step = 1) => {
    const year = date.getUTCFullYear();
    date.setUTCFullYear(year + step);
}, (date) => date.getUTCFullYear());
exports.utcIntervalMap = {
    millisecond: exports.utcMillisecond,
    second: exports.utcSecond,
    minute: exports.utcMinute,
    hour: exports.utcHour,
    day: exports.utcDay,
    week: exports.utcWeek,
    month: exports.utcMonth,
    year: exports.utcYear,
};
//# sourceMappingURL=utc-interval.js.map
}, function(modId) { var map = {"./time-interval":1774267588795}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588797, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.isValid = void 0;
const util_1 = require("@antv/util");
function isValid(x) {
    return !(0, util_1.isUndefined)(x) && !(0, util_1.isNull)(x) && !Number.isNaN(x);
}
exports.isValid = isValid;
//# sourceMappingURL=is-valid.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588798, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.pows = exports.logs = void 0;
const reflect = (f) => {
    return (x) => -f(-x);
};
const logs = (base, shouldReflect) => {
    const baseCache = Math.log(base);
    const log = base === Math.E
        ? Math.log
        : base === 10
            ? Math.log10
            : base === 2
                ? Math.log2
                : (x) => Math.log(x) / baseCache;
    return shouldReflect ? reflect(log) : log;
};
exports.logs = logs;
const pows = (base, shouldReflect) => {
    const pow = base === Math.E ? Math.exp : (x) => base ** x;
    return shouldReflect ? reflect(pow) : pow;
};
exports.pows = pows;
//# sourceMappingURL=log.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588799, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.d3LogNice = void 0;
const log_1 = require("./log");
const d3LogNice = (a, b, _, base) => {
    const shouldReflect = a < 0;
    const log = (0, log_1.logs)(base, shouldReflect);
    const pow = (0, log_1.pows)(base, shouldReflect);
    const r = a > b;
    const min = r ? b : a;
    const max = r ? a : b;
    const niceDomain = [pow(Math.floor(log(min))), pow(Math.ceil(log(max)))];
    return r ? niceDomain.reverse() : niceDomain;
};
exports.d3LogNice = d3LogNice;
//# sourceMappingURL=d3-log-nice.js.map
}, function(modId) { var map = {"./log":1774267588798}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588800, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.interpolatize = void 0;
const util_1 = require("@antv/util");
const compose_1 = require("./compose");
const createInterpolatorRound = (interpolator) => {
    return (t) => {
        // If result is not number, it can't be rounded.
        const res = interpolator(t);
        return (0, util_1.isNumber)(res) ? Math.round(res) : res;
    };
};
function interpolatize(rangeOf, normalizeDomain) {
    return (Scale) => {
        Scale.prototype.rescale = function () {
            this.initRange();
            this.nice();
            const [transform] = this.chooseTransforms();
            this.composeOutput(transform, this.chooseClamp(transform));
        };
        Scale.prototype.initRange = function () {
            const { interpolator } = this.options;
            this.options.range = rangeOf(interpolator);
        };
        Scale.prototype.composeOutput = function (transform, clamp) {
            const { domain, interpolator, round } = this.getOptions();
            const normalize = normalizeDomain(domain.map(transform));
            const interpolate = round ? createInterpolatorRound(interpolator) : interpolator;
            this.output = (0, compose_1.compose)(interpolate, normalize, clamp, transform);
        };
        Scale.prototype.invert = undefined;
    };
}
exports.interpolatize = interpolatize;
//# sourceMappingURL=interpolatize.js.map
}, function(modId) { var map = {"./compose":1774267588787}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588801, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.createInterpolateRound = exports.createInterpolateValue = exports.createInterpolateColor = exports.createInterpolateNumber = void 0;
const color_1 = require("./color");
/**
 * 返回一个线性插值器，接受数字
 * @param a 任意值
 * @param b 任意值
 * @returns 线性插值器
 */
const createInterpolateNumber = (a, b) => {
    return (t) => a * (1 - t) + b * t;
};
exports.createInterpolateNumber = createInterpolateNumber;
const createInterpolateColor = (a, b) => {
    const c1 = (0, color_1.string2rbg)(a);
    const c2 = (0, color_1.string2rbg)(b);
    if (c1 === null || c2 === null)
        return c1 ? () => a : () => b;
    return (t) => {
        const values = new Array(4);
        for (let i = 0; i < 4; i += 1) {
            const from = c1[i];
            const to = c2[i];
            values[i] = from * (1 - t) + to * t;
        }
        const [r, g, b, a] = values;
        return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
    };
};
exports.createInterpolateColor = createInterpolateColor;
/**
 * 返回一个线性插值器，接受数字和颜色
 * @param a 任意值
 * @param b 任意值
 * @returns 线性插值器
 */
const createInterpolateValue = (a, b) => {
    if (typeof a === 'number' && typeof b === 'number')
        return (0, exports.createInterpolateNumber)(a, b);
    if (typeof a === 'string' && typeof b === 'string')
        return (0, exports.createInterpolateColor)(a, b);
    return () => a;
};
exports.createInterpolateValue = createInterpolateValue;
/**
 * 返回一个 round 线性差值器，对输出值进行四舍五入
 * @param a 任意值
 * @param b 任意值
 * @returns 线性插值器
 */
const createInterpolateRound = (a, b) => {
    const interpolateNumber = (0, exports.createInterpolateNumber)(a, b);
    return (t) => Math.round(interpolateNumber(t));
};
exports.createInterpolateRound = createInterpolateRound;
//# sourceMappingURL=interpolate.js.map
}, function(modId) { var map = {"./color":1774267588802}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588802, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.string2rbg = void 0;
const color_string_1 = __importDefault(require("color-string"));
function hue2rgb(p, q, m) {
    let t = m;
    if (t < 0)
        t += 1;
    if (t > 1)
        t -= 1;
    if (t < 1 / 6)
        return p + (q - p) * 6 * t;
    if (t < 1 / 2)
        return q;
    if (t < 2 / 3)
        return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}
function hsl2rbg(hsl) {
    const h = hsl[0] / 360;
    const s = hsl[1] / 100;
    const l = hsl[2] / 100;
    const a = hsl[3];
    if (s === 0)
        return [l * 255, l * 255, l * 255, a];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1 / 3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1 / 3);
    return [r * 255, g * 255, b * 255, a];
}
function string2rbg(s) {
    const color = color_string_1.default.get(s);
    if (!color)
        return null;
    const { model, value } = color;
    if (model === 'rgb')
        return value;
    if (model === 'hsl')
        return hsl2rbg(value);
    return null;
}
exports.string2rbg = string2rbg;
//# sourceMappingURL=color.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588803, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseNiceTimeMask = void 0;
function chooseNiceTimeMask(date, intervalMap) {
    const { second, minute, hour, day, week, month, year } = intervalMap;
    if (second.floor(date) < date)
        return '.SSS';
    if (minute.floor(date) < date)
        return ':ss';
    if (hour.floor(date) < date)
        return 'hh:mm';
    if (day.floor(date) < date)
        return 'hh A';
    if (month.floor(date) < date) {
        if (week.floor(date) < date)
            return 'MMM DD';
        return 'ddd DD';
    }
    if (year.floor(date) < date)
        return 'MMMM';
    return 'YYYY';
}
exports.chooseNiceTimeMask = chooseNiceTimeMask;
//# sourceMappingURL=choose-mask.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588804, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.InternMap = void 0;
function internGet({ map, initKey }, value) {
    const key = initKey(value);
    return map.has(key) ? map.get(key) : value;
}
function internSet({ map, initKey }, value) {
    const key = initKey(value);
    if (map.has(key))
        return map.get(key);
    map.set(key, value);
    return value;
}
function internDelete({ map, initKey }, value) {
    const key = initKey(value);
    if (map.has(key)) {
        value = map.get(key);
        map.delete(key);
    }
    return value;
}
function keyof(value) {
    return typeof value === 'object' ? value.valueOf() : value;
}
/**
 * @see 参考 https://github.com/mbostock/internmap/blob/main/src/index.js
 */
class InternMap extends Map {
    constructor(entries) {
        super();
        this.map = new Map();
        this.initKey = keyof;
        if (entries !== null) {
            for (const [key, value] of entries) {
                this.set(key, value);
            }
        }
    }
    get(key) {
        return super.get(internGet({ map: this.map, initKey: this.initKey }, key));
    }
    has(key) {
        return super.has(internGet({ map: this.map, initKey: this.initKey }, key));
    }
    set(key, value) {
        return super.set(internSet({ map: this.map, initKey: this.initKey }, key), value);
    }
    delete(key) {
        return super.delete(internDelete({ map: this.map, initKey: this.initKey }, key));
    }
}
exports.InternMap = InternMap;
//# sourceMappingURL=internMap.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588805, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Ordinal = exports.defaultUnknown = void 0;
const base_1 = require("./base");
exports.defaultUnknown = Symbol('defaultUnknown');
/**
 * 更新 indexMap
 *
 * @param arr 初始的数组
 * @param target 目标 map
 * @returns {Map<string, any>} 生成的 indexMap
 */
function updateIndexMap(target, arr, key) {
    for (let i = 0; i < arr.length; i += 1) {
        if (!target.has(arr[i])) {
            target.set(key(arr[i]), i);
        }
    }
}
/**
 * 基于 indexMap 进行映射
 *
 * @param options 相关选项
 * @see MapBetweenArrOptions
 * @return {any} 映射结果
 */
function mapBetweenArrByMapIndex(options) {
    const { value, from, to, mapper, notFoundReturn } = options;
    let mappedIndex = mapper.get(value);
    // index 不存在时，
    // 如果用户显式设置了 unknown 的值，那么就返回 unknown 的值
    // 否者我们将 value 添加到原数组, 并更新 Map
    if (mappedIndex === undefined) {
        if (notFoundReturn !== exports.defaultUnknown) {
            return notFoundReturn;
        }
        mappedIndex = from.push(value) - 1;
        mapper.set(value, mappedIndex);
    }
    return to[mappedIndex % to.length];
}
function createKey(d) {
    if (d instanceof Date)
        return (d) => `${d}`;
    if (typeof d === 'object')
        return (d) => JSON.stringify(d);
    return (d) => d;
}
/**
 * Ordinal 比例尺
 *
 * 该比例尺具有离散的域和范围，例如将一组命名类别映射到一组颜色
 *
 * - 使用 for 替代一些基于 map 的遍历，for 循环性能远高于 forEach, map
 * - 阻止无意义的更新，只有到用户调用 map、invert 或者 update 之后才会进行相应的更新
 * - 两个 map 只初始化一次，在之后的更新中复用他们，这样我们避免了重复 new Map 带来的性能问题
 *   在大量调用 update 函数场景下，较 d3-scale 效率有质的提高
 */
class Ordinal extends base_1.Base {
    // 覆盖默认配置
    getDefaultOptions() {
        return {
            domain: [],
            range: [],
            unknown: exports.defaultUnknown,
        };
    }
    // 显示指定 options 的类型为 OrdinalOptions，从而推断出 O 的类型
    constructor(options) {
        super(options);
    }
    map(x) {
        if (this.domainIndexMap.size === 0) {
            updateIndexMap(this.domainIndexMap, this.getDomain(), this.domainKey);
        }
        return mapBetweenArrByMapIndex({
            value: this.domainKey(x),
            mapper: this.domainIndexMap,
            from: this.getDomain(),
            to: this.getRange(),
            notFoundReturn: this.options.unknown,
        });
    }
    invert(y) {
        if (this.rangeIndexMap.size === 0) {
            updateIndexMap(this.rangeIndexMap, this.getRange(), this.rangeKey);
        }
        return mapBetweenArrByMapIndex({
            value: this.rangeKey(y),
            mapper: this.rangeIndexMap,
            from: this.getRange(),
            to: this.getDomain(),
            notFoundReturn: this.options.unknown,
        });
    }
    // 因为 ordinal 比例尺更新内部状态的开销较大，所以按需更新
    rescale(options) {
        const [d] = this.options.domain;
        const [r] = this.options.range;
        this.domainKey = createKey(d);
        this.rangeKey = createKey(r);
        // 如果 rangeIndexMap 没有初始化，说明是在初始化阶段
        if (!this.rangeIndexMap) {
            this.rangeIndexMap = new Map();
            this.domainIndexMap = new Map();
            return;
        }
        // 否者是在更新阶段
        if (!options || options.range) {
            this.rangeIndexMap.clear();
        }
        if (!options || options.domain || options.compare) {
            this.domainIndexMap.clear();
            this.sortedDomain = undefined;
        }
    }
    clone() {
        return new Ordinal(this.options);
    }
    getRange() {
        return this.options.range;
    }
    getDomain() {
        // 如果设置了比较器，就排序
        if (this.sortedDomain)
            return this.sortedDomain;
        const { domain, compare } = this.options;
        this.sortedDomain = compare ? [...domain].sort(compare) : domain;
        return this.sortedDomain;
    }
}
exports.Ordinal = Ordinal;
//# sourceMappingURL=ordinal.js.map
}, function(modId) { var map = {"./base":1774267588806}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588806, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Base = void 0;
const util_1 = require("@antv/util");
class Base {
    /**
     * 将用户传入的选项和默认选项合并，生成当前比例尺的选项
     */
    transformBreaks(options) {
        return options;
    }
    /**
     * 构造函数，根据自定义的选项和默认选项生成当前选项
     * @param options 需要自定义配置的选项
     */
    constructor(options) {
        var _a;
        this.options = (0, util_1.deepMix)({}, this.getDefaultOptions());
        this.update(((_a = options === null || options === void 0 ? void 0 : options.breaks) === null || _a === void 0 ? void 0 : _a.length) ? this.transformBreaks(options) : options);
    }
    /**
     * 返回当前的所有选项
     * @returns 当前的所有选项
     */
    getOptions() {
        return this.options;
    }
    /**
     * 更新选项和比例尺的内部状态
     * @param updateOptions 需要更新的选项
     */
    update(updateOptions = {}) {
        const options = updateOptions.breaks ? this.transformBreaks(updateOptions) : updateOptions;
        this.options = (0, util_1.deepMix)({}, this.options, options);
        this.rescale(options);
    }
    /**
     * 根据需要更新 options 和更新后的 options 更新 scale 的内部状态，
     * 在函数内部可以用 this.options 获得更新后的 options
     * @param options 需要更新的 options
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rescale(options) { }
}
exports.Base = Base;
//# sourceMappingURL=base.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588807, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Constant = void 0;
const util_1 = require("@antv/util");
const d3_ticks_1 = require("../tick-methods/d3-ticks");
const base_1 = require("./base");
class Constant extends base_1.Base {
    /**
     * 返回需要覆盖的默认选项
     * @returns 需要覆盖的默认选项
     */
    getDefaultOptions() {
        return {
            range: [0],
            domain: [0, 1],
            unknown: undefined,
            tickCount: 5,
            tickMethod: d3_ticks_1.d3Ticks,
        };
    }
    /**
     * 输入和输出满足：y = b，其中 b 是一个常量，是 options.range 的第一个元素
     * @param _ 输入值
     * @returns 输出值（常量）
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    map(_) {
        const [v] = this.options.range;
        return v !== undefined ? v : this.options.unknown;
    }
    /**
     * 如果 x 是该比例尺的常量（x === b），返回输入值的范围（即定义域），否者返回 []
     * @param x 输出值 (常量）
     * @returns 定义域
     */
    invert(x) {
        const [v] = this.options.range;
        return x === v && v !== undefined ? this.options.domain : [];
    }
    getTicks() {
        const { tickMethod, domain, tickCount } = this.options;
        const [a, b] = domain;
        if (!(0, util_1.isNumber)(a) || !(0, util_1.isNumber)(b))
            return [];
        return tickMethod(a, b, tickCount);
    }
    /**
     * 克隆 Constant Scale
     * @returns 拥有相同选项且独立的 Constant Scale
     */
    clone() {
        return new Constant(this.options);
    }
}
exports.Constant = Constant;
//# sourceMappingURL=constant.js.map
}, function(modId) { var map = {"../tick-methods/d3-ticks":1774267588808,"./base":1774267588806}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588808, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.d3Ticks = exports.insertBreaksToTicks = void 0;
const utils_1 = require("../utils");
/**
 *  Insert breaks into ticks and delete the ticks covered by breaks.
 */
const insertBreaksToTicks = (ticks, breaks) => {
    if (!(breaks === null || breaks === void 0 ? void 0 : breaks.length))
        return ticks;
    const edgePoints = [...ticks, ...breaks.flatMap((b) => [b.start, b.end])];
    const uniqueSortedTicks = Array.from(new Set(edgePoints)).sort((a, b) => a - b);
    const filteredTicks = uniqueSortedTicks.filter((tick) => !breaks.some(({ start, end }) => tick > start && tick < end));
    return filteredTicks.length ? filteredTicks : ticks;
};
exports.insertBreaksToTicks = insertBreaksToTicks;
const d3Ticks = (begin, end, count, breaks) => {
    let n;
    let ticks;
    let start = begin;
    let stop = end;
    if (start === stop && count > 0) {
        return [start];
    }
    let step = (0, utils_1.tickIncrement)(start, stop, count);
    if (step === 0 || !Number.isFinite(step)) {
        return [];
    }
    if (step > 0) {
        start = Math.ceil(start / step);
        stop = Math.floor(stop / step);
        ticks = new Array((n = Math.ceil(stop - start + 1)));
        for (let i = 0; i < n; i += 1) {
            ticks[i] = (start + i) * step;
        }
    }
    else {
        step = -step;
        start = Math.ceil(start * step);
        stop = Math.floor(stop * step);
        ticks = new Array((n = Math.ceil(stop - start + 1)));
        for (let i = 0; i < n; i += 1) {
            ticks[i] = (start + i) / step;
        }
    }
    return (0, exports.insertBreaksToTicks)(ticks, breaks);
};
exports.d3Ticks = d3Ticks;
//# sourceMappingURL=d3-ticks.js.map
}, function(modId) { var map = {"../utils":1774267588786}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588809, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Identity = void 0;
const util_1 = require("@antv/util");
const base_1 = require("./base");
const wilkinson_extended_1 = require("../tick-methods/wilkinson-extended");
const utils_1 = require("../utils");
class Identity extends base_1.Base {
    /**
     * 返回需要覆盖的默认选项
     * @returns 需要覆盖的默认选项
     */
    getDefaultOptions() {
        return {
            domain: [0, 1],
            range: [0, 1],
            tickCount: 5,
            unknown: undefined,
            tickMethod: wilkinson_extended_1.wilkinsonExtended,
        };
    }
    /**
     * 输入和输出满足：y = x
     * @param x 输入值
     * @returns 输出值
     */
    map(x) {
        return (0, utils_1.isValid)(x) ? x : this.options.unknown;
    }
    /**
     * map 的逆运算：x = y，在这里和 map 是相同方法
     * @param x 输出值
     * @returns 输入值
     */
    invert(x) {
        return this.map(x);
    }
    /**
     * 克隆 Identity Scale
     * @returns 拥有相同选项且独立的 Identity Scale
     */
    clone() {
        return new Identity(this.options);
    }
    /**
     * 根据比例尺的配置去生成 ticks，该 ticks 主要用于生成坐标轴
     * @returns 返回一个 ticks 的数组
     */
    getTicks() {
        const { domain, tickCount, tickMethod } = this.options;
        const [min, max] = domain;
        if (!(0, util_1.isNumber)(min) || !(0, util_1.isNumber)(max))
            return [];
        return tickMethod(min, max, tickCount);
    }
}
exports.Identity = Identity;
//# sourceMappingURL=identity.js.map
}, function(modId) { var map = {"./base":1774267588806,"../tick-methods/wilkinson-extended":1774267588810,"../utils":1774267588786}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588810, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.wilkinsonExtended = exports.ALL_Q = exports.DEFAULT_Q = void 0;
const util_1 = require("@antv/util");
const pretty_number_1 = require("../utils/pretty-number");
exports.DEFAULT_Q = [1, 5, 2, 2.5, 4, 3];
exports.ALL_Q = [1, 5, 2, 2.5, 4, 3, 1.5, 7, 6, 8, 9];
const eps = Number.EPSILON * 100;
function mod(n, m) {
    return ((n % m) + m) % m;
}
function round(n) {
    return Math.round(n * 1e12) / 1e12;
}
function simplicity(q, Q, j, lmin, lmax, lstep) {
    const n = (0, util_1.size)(Q);
    const i = (0, util_1.indexOf)(Q, q);
    let v = 0;
    const m = mod(lmin, lstep);
    if ((m < eps || lstep - m < eps) && lmin <= 0 && lmax >= 0) {
        v = 1;
    }
    return 1 - i / (n - 1) - j + v;
}
function simplicityMax(q, Q, j) {
    const n = (0, util_1.size)(Q);
    const i = (0, util_1.indexOf)(Q, q);
    const v = 1;
    return 1 - i / (n - 1) - j + v;
}
function density(k, m, dMin, dMax, lMin, lMax) {
    const r = (k - 1) / (lMax - lMin);
    const rt = (m - 1) / (Math.max(lMax, dMax) - Math.min(dMin, lMin));
    return 2 - Math.max(r / rt, rt / r);
}
function densityMax(k, m) {
    if (k >= m) {
        return 2 - (k - 1) / (m - 1);
    }
    return 1;
}
function coverage(dMin, dMax, lMin, lMax) {
    const range = dMax - dMin;
    return 1 - (0.5 * ((dMax - lMax) ** 2 + (dMin - lMin) ** 2)) / (0.1 * range) ** 2;
}
function coverageMax(dMin, dMax, span) {
    const range = dMax - dMin;
    if (span > range) {
        const half = (span - range) / 2;
        return 1 - half ** 2 / (0.1 * range) ** 2;
    }
    return 1;
}
function legibility() {
    return 1;
}
/**
 * An Extension of Wilkinson's Algorithm for Position Tick Labels on Axes
 * https://www.yuque.com/preview/yuque/0/2019/pdf/185317/1546999150858-45c3b9c2-4e86-4223-bf1a-8a732e8195ed.pdf
 * @param dMin 最小值
 * @param dMax 最大值
 * @param m tick个数
 * @param onlyLoose 是否允许扩展min、max，不绝对强制，例如[3, 97]
 * @param Q nice numbers集合
 * @param w 四个优化组件的权重
 */
const wilkinsonExtended = (dMin, dMax, n = 5, onlyLoose = true, Q = exports.DEFAULT_Q, w = [0.25, 0.2, 0.5, 0.05]) => {
    const m = n < 0 ? 0 : Math.round(n);
    // nan 也会导致异常
    if (Number.isNaN(dMin) || Number.isNaN(dMax) || typeof dMin !== 'number' || typeof dMax !== 'number' || !m) {
        return [];
    }
    // js 极大值极小值问题，差值小于 1e-15 会导致计算出错
    if (dMax - dMin < 1e-15 || m === 1) {
        return [dMin];
    }
    const best = {
        score: -2,
        lmin: 0,
        lmax: 0,
        lstep: 0,
    };
    let j = 1;
    while (j < Infinity) {
        // for (const q of Q)
        for (let i = 0; i < Q.length; i += 1) {
            const q = Q[i];
            const sm = simplicityMax(q, Q, j);
            if (w[0] * sm + w[1] + w[2] + w[3] < best.score) {
                j = Infinity;
                break;
            }
            let k = 2;
            while (k < Infinity) {
                const dm = densityMax(k, m);
                if (w[0] * sm + w[1] + w[2] * dm + w[3] < best.score) {
                    break;
                }
                const delta = (dMax - dMin) / (k + 1) / j / q;
                let z = Math.ceil(Math.log10(delta));
                while (z < Infinity) {
                    const step = j * q * 10 ** z;
                    const cm = coverageMax(dMin, dMax, step * (k - 1));
                    if (w[0] * sm + w[1] * cm + w[2] * dm + w[3] < best.score) {
                        break;
                    }
                    const minStart = Math.floor(dMax / step) * j - (k - 1) * j;
                    const maxStart = Math.ceil(dMin / step) * j;
                    if (minStart <= maxStart) {
                        const count = maxStart - minStart;
                        for (let i = 0; i <= count; i += 1) {
                            const start = minStart + i;
                            const lMin = start * (step / j);
                            const lMax = lMin + step * (k - 1);
                            const lStep = step;
                            const s = simplicity(q, Q, j, lMin, lMax, lStep);
                            const c = coverage(dMin, dMax, lMin, lMax);
                            const g = density(k, m, dMin, dMax, lMin, lMax);
                            const l = legibility();
                            const score = w[0] * s + w[1] * c + w[2] * g + w[3] * l;
                            if (score > best.score && (!onlyLoose || (lMin <= dMin && lMax >= dMax))) {
                                best.lmin = lMin;
                                best.lmax = lMax;
                                best.lstep = lStep;
                                best.score = score;
                            }
                        }
                    }
                    z += 1;
                }
                k += 1;
            }
        }
        j += 1;
    }
    // 处理精度问题，保证这三个数没有精度问题
    const lmax = (0, pretty_number_1.prettyNumber)(best.lmax);
    const lmin = (0, pretty_number_1.prettyNumber)(best.lmin);
    const lstep = (0, pretty_number_1.prettyNumber)(best.lstep);
    // 加 round 是为处理 extended(0.94, 1, 5)
    // 保证生成的 tickCount 没有精度问题
    const tickCount = Math.floor(round((lmax - lmin) / lstep)) + 1;
    const ticks = new Array(tickCount);
    // 少用乘法：防止出现 -1.2 + 1.2 * 3 = 2.3999999999999995 的情况
    ticks[0] = (0, pretty_number_1.prettyNumber)(lmin);
    for (let i = 1; i < tickCount; i += 1) {
        ticks[i] = (0, pretty_number_1.prettyNumber)(ticks[i - 1] + lstep);
    }
    return ticks;
};
exports.wilkinsonExtended = wilkinsonExtended;
//# sourceMappingURL=wilkinson-extended.js.map
}, function(modId) { var map = {"../utils/pretty-number":1774267588811}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588811, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.prettyNumber = void 0;
// 为了解决 js 运算的精度问题
function prettyNumber(n) {
    return Math.abs(n) < 1e-14 ? n : parseFloat(n.toFixed(14));
}
exports.prettyNumber = prettyNumber;
//# sourceMappingURL=pretty-number.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588812, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Linear = void 0;
const util_1 = require("@antv/util");
const continuous_1 = require("./continuous");
const utils_1 = require("../utils");
const d3_ticks_1 = require("../tick-methods/d3-ticks");
const d3_linear_nice_1 = require("../utils/d3-linear-nice");
/**
 * Linear 比例尺
 *
 * 构造可创建一个在输入和输出之间具有线性关系的比例尺
 */
class Linear extends continuous_1.Continuous {
    getDefaultOptions() {
        return {
            domain: [0, 1],
            range: [0, 1],
            unknown: undefined,
            nice: false,
            clamp: false,
            round: false,
            interpolate: utils_1.createInterpolateValue,
            tickMethod: d3_ticks_1.d3Ticks,
            tickCount: 5,
        };
    }
    removeUnsortedValues(breaksDomain, breaksRange, reverse) {
        let pre = -Infinity;
        const deleteIndices = breaksRange.reduce((acc, current, i) => {
            if (i === 0)
                return acc;
            const value = pre > 0 ? pre : current;
            if (pre > 0 && (reverse ? current > pre : current < pre)) {
                acc.push(i);
            }
            else {
                const diff = (value - breaksRange[i - 1]) * (reverse ? -1 : 1);
                if (diff < 0) {
                    if (pre < 0)
                        pre = breaksRange[i - 1];
                    acc.push(i);
                }
                else {
                    pre = -Infinity;
                }
            }
            return acc;
        }, []);
        deleteIndices
            .slice()
            .reverse()
            .forEach((index) => {
            breaksDomain.splice(index, 1);
            breaksRange.splice(index, 1);
        });
        return { breaksDomain, breaksRange };
    }
    transformDomain(options) {
        const RANGE_LIMIT = [0.2, 0.8];
        const DEFAULT_GAP = 0.03;
        const { domain = [], range = [1, 0], breaks = [], tickCount = 5, nice } = options;
        const [min, max] = [Math.min(...domain), Math.max(...domain)];
        let niceDomainMin = min;
        let niceDomainMax = max;
        if (nice && breaks.length < 2) {
            const niceDomain = this.chooseNice()(min, max, tickCount);
            niceDomainMin = niceDomain[0];
            niceDomainMax = niceDomain[niceDomain.length - 1];
        }
        const domainMin = Math.min(niceDomainMin, min);
        let domainMax = Math.max(niceDomainMax, max);
        const sortedBreaks = breaks.filter(({ end }) => end < domainMax).sort((a, b) => a.start - b.start);
        const breaksDomain = (0, d3_ticks_1.d3Ticks)(domainMin, domainMax, tickCount, sortedBreaks);
        if ((0, util_1.last)(breaksDomain) < domainMax) {
            const nicest = (0, d3_linear_nice_1.d3LinearNice)(0, domainMax - (0, util_1.last)(breaksDomain), 3);
            breaksDomain.push((0, util_1.last)(breaksDomain) + (0, util_1.last)(nicest));
            domainMax = (0, util_1.last)(breaksDomain);
        }
        const [r0, r1] = [range[0], (0, util_1.last)(range)];
        const diffDomain = domainMax - domainMin;
        const diffRange = Math.abs(r1 - r0);
        const reverse = r0 > r1;
        // Calculate the new range based on breaks.
        const breaksRange = breaksDomain.map((d) => {
            const ratio = (d - domainMin) / diffDomain;
            return reverse ? r0 - ratio * diffRange : r0 + ratio * diffRange;
        });
        // Compress the range scale according to breaks.
        const [MIN, MAX] = RANGE_LIMIT;
        sortedBreaks.forEach(({ start, end, gap = DEFAULT_GAP, compress = 'middle' }) => {
            const startIndex = breaksDomain.indexOf(start);
            const endIndex = breaksDomain.indexOf(end);
            let value = (breaksRange[startIndex] + breaksRange[endIndex]) / 2;
            if (compress === 'start')
                value = breaksRange[startIndex];
            if (compress === 'end')
                value = breaksRange[endIndex];
            const halfSpan = (gap * diffRange) / 2;
            // Calculate the new start and end values based on the center and scaled span.
            let startValue = reverse ? value + halfSpan : value - halfSpan;
            let endValue = reverse ? value - halfSpan : value + halfSpan;
            // Ensure the new start and end values are within the defined limits.
            if (startValue < MIN) {
                endValue += MIN - startValue;
                startValue = MIN;
            }
            if (endValue > MAX) {
                startValue -= endValue - MAX;
                endValue = MAX;
            }
            if (startValue > MAX) {
                endValue -= startValue - MAX;
                startValue = MAX;
            }
            if (endValue < MIN) {
                startValue += MIN - endValue;
                endValue = MIN;
            }
            breaksRange[startIndex] = startValue;
            breaksRange[endIndex] = endValue;
        });
        return this.removeUnsortedValues(breaksDomain, breaksRange, reverse);
    }
    transformBreaks(options) {
        const { domain, breaks = [] } = options;
        if (!(0, util_1.isArray)(options.breaks))
            return options;
        const domainMax = Math.max(...domain);
        const filteredBreaks = breaks.filter(({ end }) => end < domainMax);
        const optWithFilteredBreaks = { ...options, breaks: filteredBreaks };
        const { breaksDomain, breaksRange } = this.transformDomain(optWithFilteredBreaks);
        return {
            ...options,
            domain: breaksDomain,
            range: breaksRange,
            breaks: filteredBreaks,
            tickMethod: () => [...breaksDomain],
        };
    }
    chooseTransforms() {
        return [util_1.identity, util_1.identity];
    }
    clone() {
        return new Linear(this.options);
    }
}
exports.Linear = Linear;
//# sourceMappingURL=linear.js.map
}, function(modId) { var map = {"./continuous":1774267588813,"../utils":1774267588786,"../tick-methods/d3-ticks":1774267588808,"../utils/d3-linear-nice":1774267588791}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588813, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Continuous = void 0;
const util_1 = require("@antv/util");
const base_1 = require("./base");
const utils_1 = require("../utils");
/** 当 domain 和 range 只有一段的时候的 map 的 工厂函数 */
const createBiMap = (domain, range, createInterpolate) => {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    let normalize;
    let interpolate;
    if (d0 < d1) {
        normalize = (0, utils_1.createNormalize)(d0, d1);
        interpolate = createInterpolate(r0, r1);
    }
    else {
        normalize = (0, utils_1.createNormalize)(d1, d0);
        interpolate = createInterpolate(r1, r0);
    }
    return (0, utils_1.compose)(interpolate, normalize);
};
/** 当 domain 和 range 有多段时候的 map 的 工厂函数 */
const createPolyMap = (domain, range, createInterpolate) => {
    const len = Math.min(domain.length, range.length) - 1;
    const normalizeList = new Array(len);
    const interpolateList = new Array(len);
    const reverse = domain[0] > domain[len];
    const ascendingDomain = reverse ? [...domain].reverse() : domain;
    const ascendingRange = reverse ? [...range].reverse() : range;
    // 每一段都生成 normalize 和 interpolate
    for (let i = 0; i < len; i += 1) {
        normalizeList[i] = (0, utils_1.createNormalize)(ascendingDomain[i], ascendingDomain[i + 1]);
        interpolateList[i] = createInterpolate(ascendingRange[i], ascendingRange[i + 1]);
    }
    // 二分最右查找到相应的 normalize 和 interpolate
    return (x) => {
        const i = (0, utils_1.bisect)(domain, x, 1, len) - 1;
        const normalize = normalizeList[i];
        const interpolate = interpolateList[i];
        return (0, utils_1.compose)(interpolate, normalize)(x);
    };
};
/** 选择一个分段映射的函数 */
const choosePiecewise = (domain, range, interpolate, shouldRound) => {
    const n = Math.min(domain.length, range.length);
    const createPiecewise = n > 2 ? createPolyMap : createBiMap;
    const createInterpolate = shouldRound ? utils_1.createInterpolateRound : interpolate;
    return createPiecewise(domain, range, createInterpolate);
};
/**
 * Continuous 比例尺 的输入 x 和输出 y 满足：y = a * f(x) + b
 * 通过函数柯里化和复合函数可以在映射过程中去掉分支，提高性能。
 * 参考：https://github.com/d3/d3-scale/blob/master/src/continuous.js
 */
class Continuous extends base_1.Base {
    getDefaultOptions() {
        return {
            domain: [0, 1],
            range: [0, 1],
            nice: false,
            clamp: false,
            round: false,
            interpolate: utils_1.createInterpolateNumber,
            tickCount: 5,
        };
    }
    /**
     * y = interpolate(normalize(clamp(transform(x))))
     */
    map(x) {
        if (!(0, utils_1.isValid)(x))
            return this.options.unknown;
        return this.output(x);
    }
    /**
     * x = transform(clamp(interpolate(normalize(y))))
     */
    invert(x) {
        if (!(0, utils_1.isValid)(x))
            return this.options.unknown;
        return this.input(x);
    }
    nice() {
        if (!this.options.nice || (0, util_1.isArray)(this.options.breaks))
            return;
        const [min, max, tickCount, ...rest] = this.getTickMethodOptions();
        this.options.domain = this.chooseNice()(min, max, tickCount, ...rest);
    }
    getTicks() {
        const { tickMethod } = this.options;
        const [min, max, tickCount, ...rest] = this.getTickMethodOptions();
        return tickMethod(min, max, tickCount, ...rest);
    }
    getTickMethodOptions() {
        const { domain, tickCount } = this.options;
        const min = domain[0];
        const max = domain[domain.length - 1];
        return [min, max, tickCount];
    }
    chooseNice() {
        return utils_1.d3LinearNice;
    }
    rescale() {
        this.nice();
        const [transform, untransform] = this.chooseTransforms();
        this.composeOutput(transform, this.chooseClamp(transform));
        this.composeInput(transform, untransform, this.chooseClamp(untransform));
    }
    chooseClamp(transform) {
        const { clamp: shouldClamp, range } = this.options;
        const domain = this.options.domain.map(transform);
        const n = Math.min(domain.length, range.length);
        return shouldClamp ? (0, utils_1.createClamp)(domain[0], domain[n - 1]) : util_1.identity;
    }
    composeOutput(transform, clamp) {
        const { domain, range, round, interpolate } = this.options;
        const piecewise = choosePiecewise(domain.map(transform), range, interpolate, round);
        this.output = (0, utils_1.compose)(piecewise, clamp, transform);
    }
    composeInput(transform, untransform, clamp) {
        const { domain, range } = this.options;
        const piecewise = choosePiecewise(range, domain.map(transform), utils_1.createInterpolateNumber);
        this.input = (0, utils_1.compose)(untransform, clamp, piecewise);
    }
}
exports.Continuous = Continuous;
//# sourceMappingURL=continuous.js.map
}, function(modId) { var map = {"./base":1774267588806,"../utils":1774267588786}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588814, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Point = void 0;
const band_1 = require("./band");
const ordinal_1 = require("./ordinal");
/**
 * Point 比例尺
 *
 * 一种特殊的 band scale，它的 bandWidth 恒为 0。
 *
 * 由于部分选项较为抽象，见下图描述：
 *
 * PO = Padding = PaddingInner
 * domain =  ["A", "B", "C"]
 *
 * |<------------------------------------------- range ------------------------------------------->|
 * |             |                                 |                                 |             |
 * |<--step*PO-->|<--------------step------------->|<--------------step------------->|<--step*PO-->|
 * |             |                                 |                                 |             |
 * |             A                                 B                                 C             |
 * |-----------------------------------------------------------------------------------------------|
 *
 * 性能方便较 d3 快出 8 - 9 倍
 */
class Point extends band_1.Band {
    // 覆盖默认配置
    getDefaultOptions() {
        return {
            domain: [],
            range: [0, 1],
            align: 0.5,
            round: false,
            padding: 0,
            unknown: ordinal_1.defaultUnknown,
            paddingInner: 1,
            paddingOuter: 0,
        };
    }
    // 能接受的参数只是 PointOptions，不能有 paddingInner 这些属性
    constructor(options) {
        super(options);
    }
    // Point 的 paddingInner 只能是1，不能被覆盖
    getPaddingInner() {
        return 1;
    }
    clone() {
        return new Point(this.options);
    }
    update(options) {
        super.update(options);
    }
    getPaddingOuter() {
        return this.options.padding;
    }
}
exports.Point = Point;
//# sourceMappingURL=point.js.map
}, function(modId) { var map = {"./band":1774267588785,"./ordinal":1774267588805}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588815, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Pow = void 0;
const util_1 = require("@antv/util");
const continuous_1 = require("./continuous");
const utils_1 = require("../utils");
const d3_ticks_1 = require("../tick-methods/d3-ticks");
const transformPow = (exponent) => {
    return (x) => {
        return x < 0 ? -((-x) ** exponent) : x ** exponent;
    };
};
const transformPowInvert = (exponent) => {
    return (x) => {
        return x < 0 ? -((-x) ** (1 / exponent)) : x ** (1 / exponent);
    };
};
const transformSqrt = (x) => {
    return x < 0 ? -Math.sqrt(-x) : Math.sqrt(x);
};
/**
 * Pow 比例尺
 *
 * 类似于 linear scale, 不同之处在于在计算输出范围值之前对输入域值应用了指数变换,.
 * 即 y = x ^ k 其中 k（指数）可以是任何实数。
 */
class Pow extends continuous_1.Continuous {
    getDefaultOptions() {
        return {
            domain: [0, 1],
            range: [0, 1],
            nice: false,
            clamp: false,
            round: false,
            exponent: 2,
            interpolate: utils_1.createInterpolateValue,
            tickMethod: d3_ticks_1.d3Ticks,
            tickCount: 5,
        };
    }
    // 显示指定 options 的类型为 PowOptions O 的类型
    constructor(options) {
        super(options);
    }
    chooseTransforms() {
        const { exponent } = this.options;
        if (exponent === 1)
            return [util_1.identity, util_1.identity];
        const transform = exponent === 0.5 ? transformSqrt : transformPow(exponent);
        const untransform = transformPowInvert(exponent);
        return [transform, untransform];
    }
    clone() {
        return new Pow(this.options);
    }
}
exports.Pow = Pow;
//# sourceMappingURL=pow.js.map
}, function(modId) { var map = {"./continuous":1774267588813,"../utils":1774267588786,"../tick-methods/d3-ticks":1774267588808}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588816, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Sqrt = void 0;
const utils_1 = require("../utils");
const pow_1 = require("./pow");
const d3_ticks_1 = require("../tick-methods/d3-ticks");
class Sqrt extends pow_1.Pow {
    getDefaultOptions() {
        return {
            domain: [0, 1],
            range: [0, 1],
            nice: false,
            clamp: false,
            round: false,
            interpolate: utils_1.createInterpolateValue,
            tickMethod: d3_ticks_1.d3Ticks,
            tickCount: 5,
            exponent: 0.5,
        };
    }
    constructor(options) {
        super(options);
    }
    update(options) {
        super.update(options);
    }
    clone() {
        return new Sqrt(this.options);
    }
}
exports.Sqrt = Sqrt;
//# sourceMappingURL=sqrt.js.map
}, function(modId) { var map = {"../utils":1774267588786,"./pow":1774267588815,"../tick-methods/d3-ticks":1774267588808}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588817, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Threshold = void 0;
const base_1 = require("./base");
const utils_1 = require("../utils");
/**
 * 将连续的定义域分段，每一段所有的值对应离散的值域中一个值
 */
class Threshold extends base_1.Base {
    getDefaultOptions() {
        return {
            domain: [0.5],
            range: [0, 1],
        };
    }
    constructor(options) {
        super(options);
    }
    /**
     * 二分查找到输入值在哪一段，返回对应的值域中的值
     */
    map(x) {
        if (!(0, utils_1.isValid)(x))
            return this.options.unknown;
        const index = (0, utils_1.bisect)(this.thresholds, x, 0, this.n);
        return this.options.range[index];
    }
    /**
     * 在值域中找到对应的值，并返回在定义域中属于哪一段
     */
    invert(y) {
        const { range } = this.options;
        const index = range.indexOf(y);
        const domain = this.thresholds;
        return [domain[index - 1], domain[index]];
    }
    clone() {
        return new Threshold(this.options);
    }
    rescale() {
        const { domain, range } = this.options;
        this.n = Math.min(domain.length, range.length - 1);
        this.thresholds = domain;
    }
}
exports.Threshold = Threshold;
//# sourceMappingURL=threshold.js.map
}, function(modId) { var map = {"./base":1774267588806,"../utils":1774267588786}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588818, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = void 0;
const continuous_1 = require("./continuous");
const utils_1 = require("../utils");
const d3_log_1 = require("../tick-methods/d3-log");
const d3_log_nice_1 = require("../utils/d3-log-nice");
/**
 * Linear 比例尺
 *
 * 构造一个线性的对数比例尺
 */
class Log extends continuous_1.Continuous {
    getDefaultOptions() {
        return {
            domain: [1, 10],
            range: [0, 1],
            base: 10,
            interpolate: utils_1.createInterpolateValue,
            tickMethod: d3_log_1.d3Log,
            tickCount: 5,
        };
    }
    chooseNice() {
        return d3_log_nice_1.d3LogNice;
    }
    getTickMethodOptions() {
        const { domain, tickCount, base } = this.options;
        const min = domain[0];
        const max = domain[domain.length - 1];
        return [min, max, tickCount, base];
    }
    chooseTransforms() {
        const { base, domain } = this.options;
        const shouldReflect = domain[0] < 0;
        return [(0, utils_1.logs)(base, shouldReflect), (0, utils_1.pows)(base, shouldReflect)];
    }
    clone() {
        return new Log(this.options);
    }
}
exports.Log = Log;
//# sourceMappingURL=log.js.map
}, function(modId) { var map = {"./continuous":1774267588813,"../utils":1774267588786,"../tick-methods/d3-log":1774267588819,"../utils/d3-log-nice":1774267588799}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588819, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.d3Log = void 0;
const d3_ticks_1 = require("./d3-ticks");
const utils_1 = require("../utils");
const d3Log = (a, b, n, base = 10) => {
    const shouldReflect = a < 0;
    const pow = (0, utils_1.pows)(base, shouldReflect);
    const log = (0, utils_1.logs)(base, shouldReflect);
    const r = b < a;
    const min = r ? b : a;
    const max = r ? a : b;
    let i = log(min);
    let j = log(max);
    let ticks = [];
    // 如果 base 是整数
    if (!(base % 1) && j - i < n) {
        i = Math.floor(i);
        j = Math.ceil(j);
        if (shouldReflect) {
            for (; i <= j; i += 1) {
                const p = pow(i);
                for (let k = base - 1; k >= 1; k -= 1) {
                    const t = p * k;
                    if (t > max)
                        break;
                    if (t >= min)
                        ticks.push(t);
                }
            }
        }
        else {
            for (; i <= j; i += 1) {
                const p = pow(i);
                for (let k = 1; k < base; k += 1) {
                    const t = p * k;
                    if (t > max)
                        break;
                    if (t >= min)
                        ticks.push(t);
                }
            }
        }
        if (ticks.length * 2 < n)
            ticks = (0, d3_ticks_1.d3Ticks)(min, max, n);
    }
    else {
        const count = n === -1 ? j - i : Math.min(j - i, n);
        ticks = (0, d3_ticks_1.d3Ticks)(i, j, count).map(pow);
    }
    return r ? ticks.reverse() : ticks;
};
exports.d3Log = d3Log;
//# sourceMappingURL=d3-log.js.map
}, function(modId) { var map = {"./d3-ticks":1774267588808,"../utils":1774267588786}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588820, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Quantize = void 0;
const threshold_1 = require("./threshold");
const wilkinson_extended_1 = require("../tick-methods/wilkinson-extended");
const utils_1 = require("../utils");
/**
 * 类似 Threshold 比例尺，区别在于 thresholds 是根据连续的 domain 根据离散的 range 的数量计算而得到的。
 */
class Quantize extends threshold_1.Threshold {
    getDefaultOptions() {
        return {
            domain: [0, 1],
            range: [0.5],
            nice: false,
            tickCount: 5,
            tickMethod: wilkinson_extended_1.wilkinsonExtended,
        };
    }
    constructor(options) {
        super(options);
    }
    nice() {
        const { nice } = this.options;
        if (nice) {
            const [min, max, tickCount] = this.getTickMethodOptions();
            this.options.domain = (0, utils_1.d3LinearNice)(min, max, tickCount);
        }
    }
    getTicks() {
        const { tickMethod } = this.options;
        const [min, max, tickCount] = this.getTickMethodOptions();
        return tickMethod(min, max, tickCount);
    }
    getTickMethodOptions() {
        const { domain, tickCount } = this.options;
        const min = domain[0];
        const max = domain[domain.length - 1];
        return [min, max, tickCount];
    }
    rescale() {
        this.nice();
        const { range, domain } = this.options;
        const [x0, x1] = domain;
        this.n = range.length - 1;
        this.thresholds = new Array(this.n);
        for (let i = 0; i < this.n; i += 1) {
            this.thresholds[i] = ((i + 1) * x1 - (i - this.n) * x0) / (this.n + 1);
        }
    }
    /**
     * 如果是在第一段后或者最后一段就把两端的值添加上
     */
    invert(y) {
        const [a, b] = super.invert(y);
        const [x0, x1] = this.options.domain;
        return a === undefined && b === undefined ? [a, b] : [a || x0, b || x1];
    }
    getThresholds() {
        return this.thresholds;
    }
    clone() {
        return new Quantize(this.options);
    }
}
exports.Quantize = Quantize;
//# sourceMappingURL=quantize.js.map
}, function(modId) { var map = {"./threshold":1774267588817,"../tick-methods/wilkinson-extended":1774267588810,"../utils":1774267588786}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588821, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Quantile = void 0;
const threshold_1 = require("./threshold");
const wilkinson_extended_1 = require("../tick-methods/wilkinson-extended");
const create_quartile_1 = require("../utils/create-quartile");
/**
 * 类似 Threshold 比例尺，区别在于分位数比例尺 (Quantile) 将一个离散的输入域映射到一个离散的输出域
 * 输入域被指定为一组离散的样本值，输出域中的值的数量决定了分位数的数量。
 */
class Quantile extends threshold_1.Threshold {
    getDefaultOptions() {
        return {
            domain: [],
            range: [],
            tickCount: 5,
            unknown: undefined,
            tickMethod: wilkinson_extended_1.wilkinsonExtended,
        };
    }
    constructor(options) {
        super(options);
    }
    rescale() {
        const { domain, range } = this.options;
        this.n = range.length - 1;
        this.thresholds = (0, create_quartile_1.createQuartile)(domain, this.n + 1, false);
    }
    /**
     * 如果是在第一段后或者最后一段就把两端的值添加上
     */
    invert(y) {
        const [a, b] = super.invert(y);
        const { domain } = this.options;
        const dMin = domain[0];
        const dMax = domain[domain.length - 1];
        return a === undefined && b === undefined ? [a, b] : [a || dMin, b || dMax];
    }
    getThresholds() {
        return this.thresholds;
    }
    clone() {
        return new Quantile(this.options);
    }
    getTicks() {
        const { tickCount, domain, tickMethod } = this.options;
        const lastIndex = domain.length - 1;
        const min = domain[0];
        const max = domain[lastIndex];
        return tickMethod(min, max, tickCount);
    }
}
exports.Quantile = Quantile;
//# sourceMappingURL=quantile.js.map
}, function(modId) { var map = {"./threshold":1774267588817,"../tick-methods/wilkinson-extended":1774267588810,"../utils/create-quartile":1774267588822}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588822, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuartile = void 0;
/**
 * 给予一个排序好的数组，分位数
 *
 * @param arr 排序好的数组
 * @param percentage 百分比
 * @returns {number} 计算结果
 */
function quantileSorted(arr, percentage) {
    const len = arr.length;
    if (!len) {
        return undefined;
    }
    if (len < 2) {
        return arr[len - 1];
    }
    const i = (len - 1) * percentage;
    const i0 = Math.floor(i);
    const v0 = arr[i0];
    const v1 = arr[i0 + 1];
    return v0 + (v1 - v0) * (i - i0);
}
/**
 * 给定一个数组, 创建分位数数组
 *
 * @param arr 排序好的数组
 * @param n 分位数数组长度
 * @param isSorted 数组是否排序好
 * @returns {number[]} 分位数数组
 */
function createQuartile(arr, n, isSorted = false) {
    const numberArr = arr;
    if (!isSorted) {
        numberArr.sort((a, b) => a - b);
    }
    const tmp = [];
    for (let i = 1; i < n; i += 1) {
        tmp.push(quantileSorted(numberArr, i / n));
    }
    return tmp;
}
exports.createQuartile = createQuartile;
//# sourceMappingURL=create-quartile.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588823, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.Time = void 0;
const util_1 = require("@antv/util");
const fecha_1 = require("fecha");
const continuous_1 = require("./continuous");
const d3_time_1 = require("../tick-methods/d3-time");
const utils_1 = require("../utils");
function offset(date) {
    const minuteOffset = date.getTimezoneOffset();
    const d = new Date(date);
    d.setMinutes(d.getMinutes() + minuteOffset, d.getSeconds(), d.getMilliseconds());
    return d;
}
class Time extends continuous_1.Continuous {
    getDefaultOptions() {
        return {
            domain: [new Date(2000, 0, 1), new Date(2000, 0, 2)],
            range: [0, 1],
            nice: false,
            tickCount: 5,
            tickInterval: undefined,
            unknown: undefined,
            clamp: false,
            tickMethod: d3_time_1.d3Time,
            interpolate: utils_1.createInterpolateNumber,
            mask: undefined,
            utc: false,
        };
    }
    chooseTransforms() {
        const transform = (x) => +x;
        const untransform = (x) => new Date(x);
        return [transform, untransform];
    }
    chooseNice() {
        return utils_1.d3TimeNice;
    }
    getTickMethodOptions() {
        const { domain, tickCount, tickInterval, utc } = this.options;
        const min = domain[0];
        const max = domain[domain.length - 1];
        return [min, max, tickCount, tickInterval, utc];
    }
    getFormatter() {
        const { mask, utc } = this.options;
        const maskMap = utc ? utils_1.utcIntervalMap : utils_1.localIntervalMap;
        const time = utc ? offset : util_1.identity; // fecha 不支持 utc 格式化，所以需要设置一个偏移
        return (d) => (0, fecha_1.format)(time(d), mask || (0, utils_1.chooseNiceTimeMask)(d, maskMap));
    }
    clone() {
        return new Time(this.options);
    }
}
exports.Time = Time;
//# sourceMappingURL=time.js.map
}, function(modId) { var map = {"./continuous":1774267588813,"../tick-methods/d3-time":1774267588824,"../utils":1774267588786}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588824, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.d3Time = void 0;
const utils_1 = require("../utils");
const d3Time = (min, max, count, interval, utc) => {
    const r = min > max;
    const lo = r ? max : min;
    const hi = r ? min : max;
    const [tickInterval, step] = (0, utils_1.findTickInterval)(lo, hi, count, interval, utc);
    const ticks = tickInterval.range(lo, new Date(+hi + 1), step, true);
    return r ? ticks.reverse() : ticks;
};
exports.d3Time = d3Time;
//# sourceMappingURL=d3-time.js.map
}, function(modId) { var map = {"../utils":1774267588786}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588825, function(require, module, exports) {

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Sequential_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sequential = void 0;
const util_1 = require("@antv/util");
const d3_ticks_1 = require("../tick-methods/d3-ticks");
const utils_1 = require("../utils");
const linear_1 = require("./linear");
function rangeOf(interpolator) {
    return [interpolator(0), interpolator(1)];
}
const normalizeDomain = (domain) => {
    const [d0, d1] = domain;
    // [d0, d1] => [0, 1]
    const normalize = (0, utils_1.compose)((0, utils_1.createInterpolateNumber)(0, 1), (0, utils_1.createNormalize)(d0, d1));
    return normalize;
};
/**
 * Sequential 比例尺
 *
 * 构造可创建一个在输入和输出之间通过插值函数进行转换的比例尺
 */
// @Sequentialish
let Sequential = Sequential_1 = class Sequential extends linear_1.Linear {
    getDefaultOptions() {
        return {
            domain: [0, 1],
            unknown: undefined,
            nice: false,
            clamp: false,
            round: false,
            interpolator: util_1.identity,
            tickMethod: d3_ticks_1.d3Ticks,
            tickCount: 5,
        };
    }
    constructor(options) {
        super(options);
    }
    clone() {
        return new Sequential_1(this.options);
    }
};
Sequential = Sequential_1 = __decorate([
    (0, utils_1.interpolatize)(rangeOf, normalizeDomain)
], Sequential);
exports.Sequential = Sequential;
//# sourceMappingURL=sequential.js.map
}, function(modId) { var map = {"../tick-methods/d3-ticks":1774267588808,"../utils":1774267588786,"./linear":1774267588812}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588826, function(require, module, exports) {

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Diverging_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Diverging = void 0;
const util_1 = require("@antv/util");
const d3_ticks_1 = require("../tick-methods/d3-ticks");
const utils_1 = require("../utils");
const linear_1 = require("./linear");
function rangeOf(interpolator) {
    return [interpolator(0), interpolator(0.5), interpolator(1)];
}
const normalizeDomain = (domain) => {
    const [d0, d1, d2] = domain;
    // [d0, d1] => [0, 0.5]
    const normalizeLeft = (0, utils_1.compose)((0, utils_1.createInterpolateNumber)(0, 0.5), (0, utils_1.createNormalize)(d0, d1));
    // [d1, d2] => [0.5, 1]
    const normalizeRight = (0, utils_1.compose)((0, utils_1.createInterpolateNumber)(0.5, 1), (0, utils_1.createNormalize)(d1, d2));
    return (x) => {
        // Find x belongs to the range of [d0, d1] or [d1, d2].
        if (d0 > d2) {
            return x < d1 ? normalizeRight(x) : normalizeLeft(x);
        }
        else {
            return x < d1 ? normalizeLeft(x) : normalizeRight(x);
        }
    };
};
/**
 * Diverging 比例尺
 *
 * 构造可创建一个在输入和输出之间通过插值函数进行转换的比例尺
 */
let Diverging = Diverging_1 = class Diverging extends linear_1.Linear {
    getDefaultOptions() {
        return {
            domain: [0, 0.5, 1],
            unknown: undefined,
            nice: false,
            clamp: false,
            round: false,
            interpolator: util_1.identity,
            tickMethod: d3_ticks_1.d3Ticks,
            tickCount: 5,
        };
    }
    constructor(options) {
        super(options);
    }
    clone() {
        return new Diverging_1(this.options);
    }
};
Diverging = Diverging_1 = __decorate([
    (0, utils_1.interpolatize)(rangeOf, normalizeDomain)
], Diverging);
exports.Diverging = Diverging;
//# sourceMappingURL=diverging.js.map
}, function(modId) { var map = {"../tick-methods/d3-ticks":1774267588808,"../utils":1774267588786,"./linear":1774267588812}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1774267588827, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.rPretty = void 0;
const pretty_number_1 = require("../utils/pretty-number");
/**
 * 创建分割点
 * @param min 左区间
 * @param max 右区间
 * @param n 分割点个数
 * @returns 计算后的 ticks
 * @see R pretty https://svn.r-project.org/R/trunk/src/appl/pretty.c
 * @see R pretty https://www.rdocumentation.org/packages/base/versions/3.5.2/topics/pretty
 */
const rPretty = (min, max, m = 5) => {
    if (min === max) {
        return [min];
    }
    const n = m < 0 ? 0 : Math.round(m);
    if (n === 0)
        return [];
    // high.u.bias
    const h = 1.5;
    // u5.bias
    const h5 = 0.5 + 1.5 * h;
    // 反正我也不会调参，跳过所有判断步骤
    const d = max - min;
    const c = d / n;
    // 当d非常小的时候触发，但似乎没什么用
    // const min_n = Math.floor(n / 3);
    // const shrink_sml = Math.pow(2, 5);
    // if (Math.log10(d) < -2) {
    //   c = (_.max([ Math.abs(max), Math.abs(min) ]) * shrink_sml) / min_n;
    // }
    const base = 10 ** Math.floor(Math.log10(c));
    let unit = base;
    if (2 * base - c < h * (c - unit)) {
        unit = 2 * base;
        if (5 * base - c < h5 * (c - unit)) {
            unit = 5 * base;
            if (10 * base - c < h * (c - unit)) {
                unit = 10 * base;
            }
        }
    }
    const nu = Math.ceil(max / unit);
    const ns = Math.floor(min / unit);
    const hi = Math.max(nu * unit, max);
    const lo = Math.min(ns * unit, min);
    const size = Math.floor((hi - lo) / unit) + 1;
    const ticks = new Array(size);
    for (let i = 0; i < size; i += 1) {
        ticks[i] = (0, pretty_number_1.prettyNumber)(lo + i * unit);
    }
    return ticks;
};
exports.rPretty = rPretty;
//# sourceMappingURL=r-pretty.js.map
}, function(modId) { var map = {"../utils/pretty-number":1774267588811}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1774267588784);
})()
//miniprogram-npm-outsideDeps=["@antv/util","color-string","fecha"]
//# sourceMappingURL=index.js.map