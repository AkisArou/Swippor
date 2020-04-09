"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Const = __importStar(require("./constants"));
var OriginalSwipeOrientation;
(function (OriginalSwipeOrientation) {
    OriginalSwipeOrientation[OriginalSwipeOrientation["None"] = 0] = "None";
    OriginalSwipeOrientation[OriginalSwipeOrientation["Right"] = 1] = "Right";
    OriginalSwipeOrientation[OriginalSwipeOrientation["Left"] = 2] = "Left";
})(OriginalSwipeOrientation || (OriginalSwipeOrientation = {}));
var Swippor = /** @class */ (function () {
    //Receives optional touch end callback
    function Swippor(onTouchEndNotify) {
        var _this = this;
        this.onTouchEndNotify = onTouchEndNotify;
        //Element width used for swipe thresholds
        this.elementWidth = 0;
        //Position x of the first touch
        this.startingTouchX = null;
        //First swipe orientation
        this.originalSwipeOrientation = OriginalSwipeOrientation.None;
        //Threshold value used for minimizing side elements swiping capability
        this.sideElementsThreshold = 0;
        //Threshold value used for allowing show next element
        this.threshold = 0;
        //Next elements' appearance factor used for elements width division
        this.thresholdFactor = 6;
        //Side elements' appearance factor used for elements width division
        this.lastItemsThresholdFactor = 20;
        //Threshold swiping value computed by subtracting sideElementsThreshold with change
        //Shows swiping direction until reaching the threshold
        this.thresholdSwipingX = 0;
        //Exposed secondary functionality for consistent single source of elements transformation
        this.onElementClicked = function (position) {
            var _a;
            (_a = _this.references) === null || _a === void 0 ? void 0 : _a.forEach(function (ref, idx) {
                ref.classList.add(Const.kAnimatedClass);
                ref.style.transform = Swippor.translate("" + ((idx - position) * 100) + Const.kPercentage);
            });
        };
        //Sets needed values for swiping functionality
        this.touchStartHandler = function (_a) {
            var touches = _a.touches;
            var _b, _c;
            _this.startingTouchX = touches[0].clientX;
            _this.elementWidth = (_c = (_b = _this.references) === null || _b === void 0 ? void 0 : _b[0].offsetWidth) !== null && _c !== void 0 ? _c : 0;
            _this.threshold = _this.elementWidth / _this.thresholdFactor;
            _this.sideElementsThreshold = _this.elementWidth / _this.lastItemsThresholdFactor;
        };
    }
    //Static method for css translation value generation
    Swippor.translate = function (value) {
        return Const.kTranslateX + "(" + value + ")";
    };
    //Used for html elements setup
    Swippor.prototype.setRefs = function (references) {
        this.references = references;
        this.initialize();
        return this;
    };
    //Positions elements and subscribes to events
    Swippor.prototype.initialize = function () {
        var _this = this;
        var _a;
        (_a = this.references) === null || _a === void 0 ? void 0 : _a.forEach(function (ref, idx) {
            ref.style.transform = Swippor.translate("" + (idx * 100) + Const.kPercentage);
            ref.addEventListener(Const.kTransitionEnd, function (_) { return ref.classList.remove(Const.kAnimatedClass); });
            ref.addEventListener(Const.kTouchStart, _this.touchStartHandler);
            ref.addEventListener(Const.kTouchMove, function (_a) {
                var touches = _a.touches;
                return _this.touchMoveHandler(touches[0].clientX, idx);
            });
            ref.addEventListener(Const.kTouchEnd, function (_a) {
                var changedTouches = _a.changedTouches;
                return _this.touchEndHandler(changedTouches[0].clientX, idx);
            });
        });
    };
    //Returns if the current hand direction is right
    Swippor.prototype.getSwipingDirectionRight = function (touch) {
        return (this.startingTouchX - touch) > 0;
    };
    //Returns if the current swiped element is edge element and is trying to swipe negatively to null element
    Swippor.prototype.isTryingToSwipeNegatively = function (isMovingHandRight, position) {
        var _a;
        return (!isMovingHandRight && position === 0) || (isMovingHandRight && position + 1 === ((_a = this.references) === null || _a === void 0 ? void 0 : _a.length));
    };
    //Returns current and to be shown elements used in both touchStart and touchMove handlers
    Swippor.prototype.getElements = function (isMovingHandRight, position) {
        return {
            currentShowingElement: this.references[position],
            nextShowingElement: this.references[position + (isMovingHandRight ? 1 : -1)]
        };
    };
    //Sets the original swiping orientation. Called in touchMove handler
    Swippor.prototype.setOriginalOrientation = function (isMovingHandRight) {
        if (this.originalSwipeOrientation === OriginalSwipeOrientation.None)
            this.originalSwipeOrientation = isMovingHandRight ? OriginalSwipeOrientation.Right : OriginalSwipeOrientation.Left;
    };
    //Manipulates current and to be shown element.
    //Checks swiping orientation
    //Sets original orientation
    Swippor.prototype.touchMoveHandler = function (touch, position) {
        if (!this.references)
            return;
        var isMovingHandRight = this.getSwipingDirectionRight(touch);
        //Absolute pixel change value from starting to current x | Used in currentShowingElement and for threshold
        var change = Math.abs(this.startingTouchX - touch);
        //Absolute pixel change for next showing element
        var changeNextShowingElement = Math.abs(this.elementWidth - change);
        //Sign for the original element caused touch event
        var signForCurrentShowingElement = isMovingHandRight ? Const.kMinus : Const.kPlus;
        //Sign for the next showing element
        var singForNextShowingElement = isMovingHandRight ? Const.kPlus : Const.kMinus;
        //Ready for usage string on translation for current showing element
        var translationValCurrentShowingElement = signForCurrentShowingElement + change + Const.kPixel;
        //Ready for usage string on translation for next showing element
        var translationValNextShowingElement = singForNextShowingElement + changeNextShowingElement + Const.kPixel;
        //Current and to be shown elements
        var _a = this.getElements(isMovingHandRight, position), currentShowingElement = _a.currentShowingElement, nextShowingElement = _a.nextShowingElement;
        //Check swiping orientation by isMovingHandRight and position
        var isTryingToSwipeNegatively = this.isTryingToSwipeNegatively(isMovingHandRight, position);
        this.setOriginalOrientation(isMovingHandRight);
        currentShowingElement.classList.remove(Const.kAnimatedClass);
        //Negative swipe to null element
        if (isTryingToSwipeNegatively) {
            //Swiped until threshold and locked
            if (change > this.sideElementsThreshold)
                return;
            //New threshold swiping value computed by subtracting sideElementsThreshold with change
            //Shows swiping direction until reaching the threshold
            var newThresholdSwipingX = this.sideElementsThreshold - change;
            //If the new thresholdSwipingX is smaller than the previous one: Goes towards the null element
            if (newThresholdSwipingX < this.thresholdSwipingX)
                currentShowingElement.classList.add(Const.kAnimatedClass);
            //else goes towards existing element
            else
                currentShowingElement.classList.remove(Const.kAnimatedClass);
            //Always translate the current element
            currentShowingElement.style.transform = Swippor.translate(translationValCurrentShowingElement);
            //Assign new thresholdSwipingX value
            this.thresholdSwipingX = newThresholdSwipingX;
        }
        //Normal swipe towards existing element
        else {
            currentShowingElement.style.transform = Swippor.translate(translationValCurrentShowingElement);
            nextShowingElement.style.transform = Swippor.translate(translationValNextShowingElement);
        }
    };
    //Positions elements according to swiping state
    Swippor.prototype.touchEndHandler = function (realisingTouchX, position) {
        var _a;
        if (!this.references)
            return;
        var isMovingHandRight = this.getSwipingDirectionRight(realisingTouchX);
        //Absolute pixel change value from starting to realising x
        var change = Math.abs(this.startingTouchX - realisingTouchX);
        //Sign for the original element caused touch event
        var signForCurrentShowingElement = isMovingHandRight ? Const.kMinus : Const.kPlus;
        //Negative or position sign for to be show element reverted back to its position cause of insufficient swipe
        var thresholdSign = isMovingHandRight ? Const.kPlus : Const.kMinus;
        //Next position used for the onTouchEndNotify user set callback
        var nextPosition = isMovingHandRight ? position + 1 : position - 1;
        //Current and to be shown elements
        var _b = this.getElements(isMovingHandRight, position), currentShowingElement = _b.currentShowingElement, nextShowingElement = _b.nextShowingElement;
        //Check swiping orientation by isMovingHandRight and position
        var isTryingToSwipeNegatively = this.isTryingToSwipeNegatively(isMovingHandRight, position);
        //Always add transition to current showing element
        currentShowingElement.classList.add(Const.kAnimatedClass);
        //Negative swipe towards null element swipe finished and results to original unchanged animated position
        //Values reset ready for next touch and other side effects
        if (isTryingToSwipeNegatively) {
            currentShowingElement.style.transform = Swippor.translate(Const.kZero);
            this.setReadyNextTouch();
            return;
        }
        //If is not trying to swipe negatively, we can assign transition to next showing element
        nextShowingElement === null || nextShowingElement === void 0 ? void 0 : nextShowingElement.classList.add(Const.kAnimatedClass);
        //Insufficient swipe towards existing element results to original unchanged animated position
        //Values reset ready for next touch and other side effects
        if (change < this.threshold) {
            currentShowingElement.style.transform = Swippor.translate(Const.kZero);
            nextShowingElement.style.transform = Swippor.translate(thresholdSign + Const.kHundredPercent);
            this.setReadyNextTouch();
            return;
        }
        //Normal swipe results translating towards to next showing element
        //onTouchEndNotify user set callback called with next position
        //Values reset ready for next touch
        else {
            currentShowingElement.style.transform = Swippor.translate(signForCurrentShowingElement + Const.kHundredPercent);
            nextShowingElement.style.transform = Swippor.translate(Const.kZero);
            (_a = this.onTouchEndNotify) === null || _a === void 0 ? void 0 : _a.call(this, nextPosition);
            this.setReadyNextTouch();
        }
    };
    //Resets values ready for next touch
    Swippor.prototype.setReadyNextTouch = function () {
        this.startingTouchX = null;
        this.elementWidth = 0;
        this.originalSwipeOrientation = OriginalSwipeOrientation.None;
        this.thresholdSwipingX = 0;
    };
    return Swippor;
}());
exports.Swippor = Swippor;
//# sourceMappingURL=Swippor.js.map