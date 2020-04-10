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
var constants_1 = require("./constants");
var Swippor = /** @class */ (function () {
    function Swippor() {
        var _this = this;
        //Element width used for swipe thresholds
        this.elementWidth = 0;
        //Position x of the first touch
        this.startingTouchX = null;
        //Threshold value used for minimizing side elements swiping capability
        this.sideElementsThreshold = 0;
        //Threshold value used for allowing show next element
        this.threshold = 0;
        //Threshold swiping value computed by subtracting sideElementsThreshold with change
        //Shows swiping direction until reaching the threshold
        this.thresholdSwipingX = 0;
        //Next elements' appearance factor used for elements width division
        this.thresholdFactor = 6;
        //Side elements' appearance factor used for elements width division
        this.lastItemsThresholdFactor = 9;
        //Transition css cls
        this.kTransitionClass = Const.kAnimatedClass;
        //Value read from touchMoveHandler and touchEndHandler. Assigned once every different touch start event of touchStartHandler
        //so dataset swippor identifier is queried once from evt.target attributes
        this.currentWorkingPosition = 0;
        //Used for assigning animation to next showing element, when previous move was towards null element
        this.wasSwipingTowardsNullElement = false;
        //Exposed secondary functionality for consistent single source of elements transformation
        this.onElementClicked = function (position) {
            var _a;
            (_a = _this.references) === null || _a === void 0 ? void 0 : _a.forEach(function (ref, idx) {
                ref.classList.add(_this.kTransitionClass);
                Swippor.translate(ref, "" + ((idx - position) * 100) + Const.kPercentage);
            });
        };
        /* Handlers */
        //Removes animation on transitioning elements transition end
        this.transitionEndHandler = function (evt) {
            var _a;
            var position = Swippor.getSwipporDatasetAttribute(evt.target);
            (_a = _this.references) === null || _a === void 0 ? void 0 : _a[position].classList.remove(_this.kTransitionClass);
            //Sets was swiping towards null element to False because when swipes towards null element
            //and touchEndHandler sets wasSwipingTowardsNullElement
            //When new swipe moves to existing element, touchMoveHandler checks wasSwipingTowardsNullElement
            //and adds animation to next element but it does not need it.
            //because side element has finished animation and no overlap happens
            //So setting wasSwipingTowardsNullElement to false, causes no animation assignment to next element
            //and swipe remains smooth
            _this.setWasSwipingTowardsNullElement(false);
        };
        //Sets needed values for swiping functionality
        this.touchStartHandler = function (evt) {
            var _a, _b;
            evt.preventDefault();
            _this.setCurrentWorkingPosition(Swippor.getSwipporDatasetAttribute(evt.target));
            _this.startingTouchX = evt.touches[0].clientX;
            _this.elementWidth = (_b = (_a = _this.references) === null || _a === void 0 ? void 0 : _a[0].offsetWidth) !== null && _b !== void 0 ? _b : 0;
            _this.threshold = _this.elementWidth / _this.thresholdFactor;
            _this.sideElementsThreshold = _this.elementWidth / _this.lastItemsThresholdFactor;
        };
        //Manipulates current and to be shown element.
        //Checks swiping orientation
        //Sets original orientation
        //Example:
        //Initial Touch happens in 100px x position = this.startingTouchX
        //Current touch is at 50px x position = touch
        //The change is 50px = this.startingTouchX! - touch , used in current showing element
        //Assume the width of the elements is 100px
        //So the change for next element is 100px - 50px = 50, this.elementWidth! - change
        this.touchMoveHandler = function (evt) {
            var position = _this.currentWorkingPosition;
            //Prevent default browser behaviour
            evt.preventDefault();
            //Current Touch
            var touch = evt.targetTouches[0].clientX;
            //Getting Swipe direction
            var isMovingHandLeft = _this.getIsSwipingDirectionLeft(touch);
            //Absolute pixel change value from starting to current x | Used in currentShowingElement and for threshold
            var change = Math.abs(_this.startingTouchX - touch);
            //Dont run on no change or the changes is bigger that elements' width because it starts moving the opposite position
            if (!change || change === _this.elementWidth || change > _this.elementWidth)
                return;
            //Absolute pixel change for next showing element
            var changeNextShowingElement = Math.abs(_this.elementWidth - change);
            //Change for previous element
            var changePreviousElement = _this.elementWidth + change;
            //Sign for the original element caused touch event
            var signForCurrentShowingElement = isMovingHandLeft ? Const.kMinus : Const.kPlus;
            //Sign for the next showing element
            var singForNextShowingElement = isMovingHandLeft ? Const.kPlus : Const.kMinus;
            //Ready for usage string on translation for current showing element
            var translationValCurrentShowingElement = signForCurrentShowingElement + change + Const.kPixel;
            //Ready for usage string on translation for next showing element
            var translationValNextShowingElement = singForNextShowingElement + changeNextShowingElement + Const.kPixel;
            //Ready for usage string on translation for previous showing element
            var translationValPreviousShowingElement = signForCurrentShowingElement + changePreviousElement + Const.kPixel;
            //Current and to be shown elements
            var _a = _this.getElements(isMovingHandLeft, position), currentShowingElement = _a.currentShowingElement, nextShowingElement = _a.nextShowingElement, previousElement = _a.previousElement;
            //Check swiping orientation by isMovingHandLeft and position
            //Used to check for normal swiping or swiping towards null element
            //It emits only the initial swipe direction
            //Resets when the element resets to its original position
            var isInitialSwipeDirectionNegative = _this.isInitialSwipeDirectionNegative(isMovingHandLeft, position);
            console.log(isInitialSwipeDirectionNegative, "isInitialSwipeDirectionNegative");
            //Check if elements are still animating. If so, return
            if (_this.getElementsAreStillAnimating([currentShowingElement, nextShowingElement, previousElement]))
                return;
            //Negative swipe to null element
            if (isInitialSwipeDirectionNegative) {
                //if there is a previous element, translate it accordingly.
                //It may not seems so difference but sometimes it sticks buggy to the edge of the screen
                //It is called also in normal swipe in else condition
                if (previousElement)
                    Swippor.translate(previousElement, translationValPreviousShowingElement);
                //Swipable until threshold and locked
                if (change > _this.sideElementsThreshold)
                    return;
                //New threshold swiping value computed by subtracting sideElementsThreshold with change
                //Shows swiping direction until reaching the threshold
                var newThresholdSwipingX = _this.sideElementsThreshold - change;
                //If the new thresholdSwipingX is smaller than the previous one: Goes towards the null element
                if (newThresholdSwipingX < _this.thresholdSwipingX)
                    _this.animate(currentShowingElement);
                else
                    currentShowingElement.classList.remove(_this.kTransitionClass);
                //Always translate the current element
                Swippor.translate(currentShowingElement, translationValCurrentShowingElement);
                //Assign new thresholdSwipingX value
                _this.thresholdSwipingX = newThresholdSwipingX;
            }
            //Normal swipe towards existing element
            else {
                Swippor.translate(currentShowingElement, translationValCurrentShowingElement);
                Swippor.translate(nextShowingElement, translationValNextShowingElement);
                //if there is a previous element, translate it accordingly.
                //It may not seems so difference but sometimes it sticks buggy to the edge of the screen
                if (previousElement)
                    Swippor.translate(previousElement, translationValPreviousShowingElement);
            }
        };
        //Positions elements according to swiping state
        this.touchEndHandler = function (evt) {
            var _a;
            var position = _this.currentWorkingPosition;
            //Prevent default browser behaviour
            evt.preventDefault();
            //Position x value touch released
            var realisingTouchX = evt.changedTouches[0].clientX;
            //Always contains references when this runs. Added just for type safety
            if (!_this.references)
                return;
            //Getting Swipe direction
            var isMovingHandRight = _this.getIsSwipingDirectionLeft(realisingTouchX);
            //Absolute pixel change value from starting to realising x
            var change = Math.abs(_this.startingTouchX - realisingTouchX);
            //Dont run on no change
            if (!change)
                return;
            //Sign for the original element caused touch event
            var signForCurrentShowingElement = isMovingHandRight ? Const.kMinus : Const.kPlus;
            //Negative or position sign for to be show element reverted back to its position cause of insufficient swipe
            var thresholdSign = isMovingHandRight ? Const.kPlus : Const.kMinus;
            //Negative or position sign for previous element (if exists)
            var previousElementSign = isMovingHandRight ? Const.kMinus : Const.kPlus;
            //Next position used for the onTouchEndNotify user set callback
            var nextPosition = isMovingHandRight ? position + 1 : position - 1;
            //Current and to be shown elements
            var _b = _this.getElements(isMovingHandRight, position), currentShowingElement = _b.currentShowingElement, nextShowingElement = _b.nextShowingElement, previousElement = _b.previousElement;
            //Check swiping orientation by isMovingHandLeft and position
            //Used to check for normal swiping or swiping towards null element
            //It emits only the initial swipe direction
            //Resets when the element resets to its original position
            var isInitialSwipeDirectionNegative = _this.isInitialSwipeDirectionNegative(isMovingHandRight, position);
            //Negative swipe towards null element swipe finished and results to original unchanged animated position
            //Values reset ready for next touch and other side effects
            if (isInitialSwipeDirectionNegative) {
                //Assigns last swipe state was towards null element
                _this.setWasSwipingTowardsNullElement(true);
                //Assign pending class animation to both elements.
                //Previous element for case of normal swiping after finishing negative animation
                _this.animate(currentShowingElement);
                if (previousElement)
                    Swippor.translate(previousElement, previousElementSign + Const.kHundredPercent);
                Swippor.translate(currentShowingElement, Const.kZero);
                _this.setReadyNextTouch(nextPosition, false);
                return;
            }
            //Insufficient swipe towards existing element results to original unchanged animated position
            //Values reset ready for next touch and other side effects
            if (change < _this.threshold) {
                //Animate current and next showing.
                //Assign pending animation cls smoothness for the previous in case of normal swiping towards it
                _this.animate([currentShowingElement, nextShowingElement, previousElement]);
                if (previousElement)
                    Swippor.translate(previousElement, previousElementSign + Const.kHundredPercent);
                Swippor.translate(nextShowingElement, thresholdSign + Const.kHundredPercent);
                Swippor.translate(currentShowingElement, Const.kZero);
                _this.setReadyNextTouch(nextPosition, false);
                return;
            }
            //Normal swipe results translating towards to next showing element
            //onTouchEndNotify user set callback called with next position
            //Values reset ready for next touch
            else {
                //Normal swipe needs animation for only current and next showing elements
                _this.animate([currentShowingElement, nextShowingElement]);
                Swippor.translate(currentShowingElement, signForCurrentShowingElement + Const.kHundredPercent);
                Swippor.translate(nextShowingElement, Const.kZero);
                //Because of buggy behaviour, previous element, sometimes sticks to the edges of the screen
                //So i should re-position already physically hidden element to gain percentage translation instead of px
                if (previousElement)
                    Swippor.translate(previousElement, signForCurrentShowingElement + Const.kHundredPercent);
                //Touch finished
                (_a = _this.onTouchEndNotify) === null || _a === void 0 ? void 0 : _a.call(_this, nextPosition);
                _this.setReadyNextTouch(nextPosition, true);
            }
        };
    }
    //Static method for css translation value generation
    Swippor.translate = function (element, value) {
        element.style.transform = Const.kTranslateX + "(" + value + ")";
    };
    /* Setters */
    //Used for HTML elements setup. Startup method
    Swippor.prototype.setRefs = function (references) {
        this.deactivateListeners();
        this.references = references;
        this.activateListeners();
        return this;
    };
    //Cleanup method
    Swippor.prototype.removeRefs = function () {
        this.deactivateListeners();
        this.references = undefined;
    };
    //Sets Callback called when position successfully changed
    Swippor.prototype.setTouchEndNotifier = function (onTouchEndNotify) {
        this.onTouchEndNotify = onTouchEndNotify;
        return this;
    };
    //Sets user preferred threshold factor swiping between elements
    Swippor.prototype.setThresholdFactor = function (thresholdFactor) {
        this.thresholdFactor = thresholdFactor;
        return this;
    };
    //Sets user preferred last items threshold factor
    Swippor.prototype.setLastItemsThresholdFactor = function (lastItemsThresholdFactor) {
        this.lastItemsThresholdFactor = lastItemsThresholdFactor;
        return this;
    };
    //Sets user preferred CSS transition class
    Swippor.prototype.setTransitionClass = function (cls) {
        this.kTransitionClass = cls.charAt(0) === Const.kDot
            ? cls.substring(1)
            : cls;
        return this;
    };
    /* Init- De-init */
    //Positions elements and subscribes to events
    Swippor.prototype.activateListeners = function () {
        var _this = this;
        var _a;
        (_a = this.references) === null || _a === void 0 ? void 0 : _a.forEach(function (ref, idx) {
            Swippor.translate(ref, "" + ((idx - _this.currentWorkingPosition) * 100) + Const.kPercentage);
            ref.setAttribute(constants_1.kSwipporDataset, idx.toString());
            ref.addEventListener(Const.kTransitionEnd, _this.transitionEndHandler);
            ref.addEventListener(Const.kTouchStart, _this.touchStartHandler);
            ref.addEventListener(Const.kTouchMove, _this.touchMoveHandler);
            ref.addEventListener(Const.kTouchEnd, _this.touchEndHandler);
        });
    };
    //Unsubscribes listeners when explicitly asked and when setRefs called.
    Swippor.prototype.deactivateListeners = function () {
        var _this = this;
        var _a;
        (_a = this.references) === null || _a === void 0 ? void 0 : _a.forEach(function (ref) {
            ref.removeEventListener(Const.kTransitionEnd, _this.transitionEndHandler);
            ref.removeEventListener(Const.kTouchStart, _this.touchStartHandler);
            ref.removeEventListener(Const.kTouchMove, _this.touchMoveHandler);
            ref.removeEventListener(Const.kTouchEnd, _this.touchEndHandler);
        });
    };
    /* State actions */
    //Sets current working position
    Swippor.prototype.setCurrentWorkingPosition = function (position) {
        this.currentWorkingPosition = position;
    };
    //Sets if last swipe was towards null element
    Swippor.prototype.setWasSwipingTowardsNullElement = function (was) {
        this.wasSwipingTowardsNullElement = was;
    };
    //Resets values ready for next touch
    Swippor.prototype.setReadyNextTouch = function (position, isValidMove) {
        if (isValidMove)
            this.setCurrentWorkingPosition(position);
        this.startingTouchX = null;
        this.elementWidth = 0;
        this.thresholdSwipingX = 0;
    };
    /* Helpers */
    //Returns element index from queried element attribute from DOM
    //Used in transitionEndHandler and touchStartHandler
    Swippor.getSwipporDatasetAttribute = function (target) {
        return +target.getAttribute(constants_1.kSwipporDataset);
    };
    //Returns if the current hand direction is right
    Swippor.prototype.getIsSwipingDirectionLeft = function (touch) {
        return (this.startingTouchX - touch) > 0;
    };
    //Returns if the current swiped element is edge element and its' initial swipe direction is to swipe negatively to null element
    //Used for animation on "side" elements.
    Swippor.prototype.isInitialSwipeDirectionNegative = function (isMovingHandRight, position) {
        return ((!isMovingHandRight && position === 0) || (isMovingHandRight && position + 1 === this.references.length));
    };
    //Returns current and to be shown elements used in both touchStart and touchMove handlers
    Swippor.prototype.getElements = function (isMovingHandRight, position) {
        return {
            currentShowingElement: this.references[position],
            nextShowingElement: this.references[position + (isMovingHandRight ? 1 : -1)],
            previousElement: this.references[position + (isMovingHandRight ? -1 : 1)]
        };
    };
    //If emits true, the next touch is canceled
    Swippor.prototype.getElementsAreStillAnimating = function (elements) {
        var _this = this;
        return elements
            .filter(function (element) { return !!element; })
            .reduce(function (acc, currentElement) {
            return currentElement.classList.contains(_this.kTransitionClass);
        }, false);
    };
    //Iterates over selected elements or single element, adding css transition class
    Swippor.prototype.animate = function (elements) {
        var _this = this;
        Array.isArray(elements)
            ? elements.forEach(function (element) { return element === null || element === void 0 ? void 0 : element.classList.add(_this.kTransitionClass); })
            : elements === null || elements === void 0 ? void 0 : elements.classList.add(this.kTransitionClass);
    };
    return Swippor;
}());
exports.Swippor = Swippor;
//# sourceMappingURL=Swippor.js.map