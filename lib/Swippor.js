"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Const = __importStar(require("../src/constants"));
class Swippor {
    constructor() {
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
        this.moveToElementByIndex = (position) => {
            var _a;
            (_a = this.references) === null || _a === void 0 ? void 0 : _a.forEach((ref, idx) => {
                ref.classList.add(this.kTransitionClass);
                Swippor.translate(ref, `${((idx - position) * 100)}${Const.kPercentage}`);
            });
        };
        /* Handlers */
        //Removes animation on transitioning elements transition end
        this.transitionEndHandler = (evt) => {
            var _a;
            const position = Swippor.getSwipporDatasetAttribute(evt.currentTarget);
            (_a = this.references) === null || _a === void 0 ? void 0 : _a[position].classList.remove(this.kTransitionClass);
            //Sets was swiping towards null element to False because when swipes towards null element
            //and touchEndHandler sets wasSwipingTowardsNullElement
            //When new swipe moves to existing element, touchMoveHandler checks wasSwipingTowardsNullElement
            //and adds animation to next element but it does not need it.
            //because side element has finished animation and no overlap happens
            //So setting wasSwipingTowardsNullElement to false, causes no animation assignment to next element
            //and swipe remains smooth
            this.setWasSwipingTowardsNullElement(false);
        };
        //Sets needed values for swiping functionality
        this.touchStartHandler = (evt) => {
            var _a, _b;
            evt.preventDefault();
            this.setCurrentWorkingPosition(Swippor.getSwipporDatasetAttribute(evt.currentTarget));
            this.startingTouchX = evt.touches[0].clientX;
            this.elementWidth = (_b = (_a = this.references) === null || _a === void 0 ? void 0 : _a[0].offsetWidth) !== null && _b !== void 0 ? _b : 0;
            this.threshold = this.elementWidth / this.thresholdFactor;
            this.sideElementsThreshold = this.elementWidth / this.lastItemsThresholdFactor;
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
        this.touchMoveHandler = (evt) => {
            const position = this.currentWorkingPosition;
            //Prevent default browser behaviour
            evt.preventDefault();
            //Current Touch
            const touch = evt.targetTouches[0].clientX;
            //Getting Swipe direction
            const isMovingHandLeft = this.getIsSwipingDirectionLeft(touch);
            //Absolute pixel change value from starting to current x | Used in currentShowingElement and for threshold
            const change = Math.abs(this.startingTouchX - touch);
            //Dont run on no change or the changes is bigger that elements' width because it starts moving the opposite position
            if (!change || change === this.elementWidth || change > this.elementWidth)
                return;
            //Absolute pixel change for next showing element
            const changeNextShowingElement = Math.abs(this.elementWidth - change);
            //Change for previous element
            const changePreviousElement = this.elementWidth + change;
            //Sign for the original element caused touch event
            const signForCurrentShowingElement = isMovingHandLeft ? Const.kMinus : Const.kPlus;
            //Sign for the next showing element
            const singForNextShowingElement = isMovingHandLeft ? Const.kPlus : Const.kMinus;
            //Ready for usage string on translation for current showing element
            const translationValCurrentShowingElement = signForCurrentShowingElement + change + Const.kPixel;
            //Ready for usage string on translation for next showing element
            const translationValNextShowingElement = singForNextShowingElement + changeNextShowingElement + Const.kPixel;
            //Ready for usage string on translation for previous showing element
            const translationValPreviousShowingElement = signForCurrentShowingElement + changePreviousElement + Const.kPixel;
            //Current and to be shown elements
            const { currentShowingElement, nextShowingElement, previousElement } = this.getElements(isMovingHandLeft, position);
            //Check swiping orientation by isMovingHandLeft and position
            //Used to check for normal swiping or swiping towards null element
            //It emits only the initial swipe direction
            //Resets when the element resets to its original position
            const isInitialSwipeDirectionNegative = this.isInitialSwipeDirectionNegative(isMovingHandLeft, position);
            //Check if elements are still animating. If so, return
            if (this.getElementsAreStillAnimating([currentShowingElement, nextShowingElement, previousElement]))
                return;
            //Negative swipe to null element
            if (isInitialSwipeDirectionNegative) {
                //if there is a previous element, translate it accordingly.
                //It may not seems so difference but sometimes it sticks buggy to the edge of the screen
                //It is called also in normal swipe in else condition
                //Swipable until threshold and locked
                if (change > this.sideElementsThreshold)
                    return;
                if (previousElement)
                    Swippor.translate(previousElement, translationValPreviousShowingElement);
                //New threshold swiping value computed by subtracting sideElementsThreshold with change
                //Shows swiping direction until reaching the threshold
                const newThresholdSwipingX = this.sideElementsThreshold - change;
                // (this.sideElementsThreshold - change< this.thresholdSwipingX)
                //If the new thresholdSwipingX is smaller than the previous one: Goes towards the null element
                if (newThresholdSwipingX < this.thresholdSwipingX)
                    this.animate(currentShowingElement);
                else
                    currentShowingElement.classList.remove(this.kTransitionClass);
                //Always translate the current element
                Swippor.translate(currentShowingElement, translationValCurrentShowingElement);
                //Assign new thresholdSwipingX value
                this.thresholdSwipingX = newThresholdSwipingX;
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
        this.touchEndHandler = (evt) => {
            var _a;
            const position = this.currentWorkingPosition;
            //Prevent default browser behaviour
            evt.preventDefault();
            //Position x value touch released
            const realisingTouchX = evt.changedTouches[0].clientX;
            //Always contains references when this runs. Added just for type safety
            if (!this.references)
                return;
            //Getting Swipe direction
            const isMovingHandRight = this.getIsSwipingDirectionLeft(realisingTouchX);
            //Absolute pixel change value from starting to realising x
            const change = Math.abs(this.startingTouchX - realisingTouchX);
            //Dont run on no change
            if (!change)
                return;
            //Sign for the original element caused touch event
            const signForCurrentShowingElement = isMovingHandRight ? Const.kMinus : Const.kPlus;
            //Negative or position sign for to be show element reverted back to its position cause of insufficient swipe
            const thresholdSign = isMovingHandRight ? Const.kPlus : Const.kMinus;
            //Negative or position sign for previous element (if exists)
            const previousElementSign = isMovingHandRight ? Const.kMinus : Const.kPlus;
            //Next position used for the onTouchEndNotify user set callback
            const nextPosition = isMovingHandRight ? position + 1 : position - 1;
            //Current and to be shown elements
            const { currentShowingElement, nextShowingElement, previousElement, morePrev } = this.getElements(isMovingHandRight, position);
            //Check swiping orientation by isMovingHandLeft and position
            //Used to check for normal swiping or swiping towards null element
            //It emits only the initial swipe direction
            //Resets when the element resets to its original position
            const isInitialSwipeDirectionNegative = this.isInitialSwipeDirectionNegative(isMovingHandRight, position);
            // this.references?.forEach(ref => ref.classList.add(this.kTransitionClass))
            //
            //Negative swipe towards null element swipe finished and results to original unchanged animated position
            //Values reset ready for next touch and other side effects
            if (isInitialSwipeDirectionNegative) {
                //Assigns last swipe state was towards null element
                this.setWasSwipingTowardsNullElement(true);
                //Assign pending class animation to both elements.
                //Previous element for case of normal swiping after finishing negative animation
                this.animate(currentShowingElement);
                if (previousElement)
                    Swippor.translate(previousElement, previousElementSign + Const.kHundredPercent);
                if (morePrev)
                    Swippor.translate(morePrev, thresholdSign + Const.kTwoHundredPercent);
                Swippor.translate(currentShowingElement, Const.kZero);
                this.setReadyNextTouch(nextPosition, false);
                return;
            }
            //Insufficient swipe towards existing element results to original unchanged animated position
            //Values reset ready for next touch and other side effects
            if (change < this.threshold) {
                //Animate current and next showing.
                //Assign pending animation cls smoothness for the previous in case of normal swiping towards it
                this.animate([currentShowingElement, nextShowingElement, previousElement]);
                if (previousElement)
                    Swippor.translate(previousElement, previousElementSign + Const.kHundredPercent);
                Swippor.translate(nextShowingElement, thresholdSign + Const.kHundredPercent);
                Swippor.translate(currentShowingElement, Const.kZero);
                this.setReadyNextTouch(nextPosition, false);
                return;
            }
            //Normal swipe results translating towards to next showing element
            //onTouchEndNotify user set callback called with next position
            //Values reset ready for next touch
            else {
                //Normal swipe needs animation for only current and next showing elements
                this.animate([currentShowingElement, nextShowingElement]);
                Swippor.translate(currentShowingElement, signForCurrentShowingElement + Const.kHundredPercent);
                Swippor.translate(nextShowingElement, Const.kZero);
                //
                if (previousElement)
                    Swippor.translate(previousElement, signForCurrentShowingElement + Const.kTwoHundredPercent);
                if (morePrev)
                    Swippor.translate(morePrev, thresholdSign + Const.kHundredPercent);
                //Touch finished
                (_a = this.onTouchEndNotify) === null || _a === void 0 ? void 0 : _a.call(this, nextPosition);
                this.setReadyNextTouch(nextPosition, true);
            }
        };
    }
    //Static method for css translation value generation
    static translate(element, value) {
        element.style.transform = `${Const.kTranslateX}(${value})`;
    }
    /* Setters */
    //Used for HTML elements setup. Startup method
    setParentNode(parentNode) {
        //Add refs by getting children of provided parentNode
        this.setRefs([...parentNode.children]);
        return this;
    }
    //Used for HTML elements setup.
    // Alternative Startup method by manual parentNode get by id
    setParentNodeById(parentNodeId) {
        return this.setParentNode(document.querySelector(parentNodeId));
    }
    //Used for HTML elements setup internally.
    // Also ALTERNATIVE Startup method
    setRefs(references) {
        //First deactivate listeners if there are any, before setting references
        this.deactivateListeners();
        //Add refs
        this.references = references;
        //Attach listeners for each element
        this.activateListeners();
        return this;
    }
    //Cleanup method
    cleanup() {
        //First deactivate listeners
        this.deactivateListeners();
        //Then set references to undefined
        this.references = undefined;
    }
    //Sets Callback called when position successfully changed
    setTouchEndNotifier(onTouchEndNotify) {
        this.onTouchEndNotify = onTouchEndNotify;
        return this;
    }
    //Sets user preferred threshold factor swiping between elements
    setThresholdFactor(thresholdFactor) {
        this.thresholdFactor = thresholdFactor;
        return this;
    }
    //Sets user preferred last items threshold factor
    setLastItemsThresholdFactor(lastItemsThresholdFactor) {
        this.lastItemsThresholdFactor = lastItemsThresholdFactor;
        return this;
    }
    //Sets user preferred CSS transition class
    setTransitionClass(cls) {
        this.kTransitionClass = cls.charAt(0) === Const.kDot
            ? cls.substring(1)
            : cls;
        return this;
    }
    /* Init- De-init */
    //Positions elements and subscribes to events
    //Exposed method for manual activation in case of manual deactivation of listeners
    activateListeners() {
        var _a;
        (_a = this.references) === null || _a === void 0 ? void 0 : _a.forEach((ref, idx) => {
            Swippor.translate(ref, `${((idx - this.currentWorkingPosition) * 100)}${Const.kPercentage}`);
            ref.setAttribute(Const.kSwipporDataset, idx.toString());
            ref.addEventListener(Const.kTransitionEnd, this.transitionEndHandler);
            ref.addEventListener(Const.kTouchStart, this.touchStartHandler);
            ref.addEventListener(Const.kTouchMove, this.touchMoveHandler);
            ref.addEventListener(Const.kTouchEnd, this.touchEndHandler);
        });
    }
    //Unsubscribes listeners when explicitly asked and when setRefs called.
    //Exposed method for manual deactivation of listeners
    deactivateListeners() {
        var _a;
        (_a = this.references) === null || _a === void 0 ? void 0 : _a.forEach(ref => {
            ref.removeEventListener(Const.kTransitionEnd, this.transitionEndHandler);
            ref.removeEventListener(Const.kTouchStart, this.touchStartHandler);
            ref.removeEventListener(Const.kTouchMove, this.touchMoveHandler);
            ref.removeEventListener(Const.kTouchEnd, this.touchEndHandler);
        });
    }
    /* State actions */
    //Sets current working position
    setCurrentWorkingPosition(position) {
        this.currentWorkingPosition = position;
    }
    //Sets if last swipe was towards null element
    setWasSwipingTowardsNullElement(was) {
        this.wasSwipingTowardsNullElement = was;
    }
    //Resets values ready for next touch
    setReadyNextTouch(position, isValidMove) {
        if (isValidMove)
            this.setCurrentWorkingPosition(position);
        this.startingTouchX = null;
        this.elementWidth = 0;
        this.thresholdSwipingX = 0;
    }
    /* Helpers */
    //Returns element index from queried element attribute from DOM
    //Used in transitionEndHandler and touchStartHandler
    static getSwipporDatasetAttribute(target) {
        return +target.getAttribute(Const.kSwipporDataset);
    }
    //Returns if the current hand direction is right
    getIsSwipingDirectionLeft(touch) {
        return (this.startingTouchX - touch) > 0;
    }
    //Returns if the current swiped element is edge element and its' initial swipe direction is to swipe negatively to null element
    //Used for animation on "side" elements.
    isInitialSwipeDirectionNegative(isMovingHandRight, position) {
        return ((!isMovingHandRight && position === 0) || (isMovingHandRight && position + 1 === this.references.length));
    }
    //Returns current and to be shown elements used in both touchStart and touchMove handlers
    getElements(isMovingHandRight, position) {
        return {
            currentShowingElement: this.references[position],
            nextShowingElement: this.references[position + (isMovingHandRight ? 1 : -1)],
            previousElement: this.references[position + (isMovingHandRight ? -1 : 1)],
            morePrev: this.references[position + (isMovingHandRight ? +2 : -2)],
        };
    }
    //If emits true, the next touch is canceled
    getElementsAreStillAnimating(elements) {
        return elements
            .filter(element => !!element)
            .reduce((acc, currentElement) => currentElement.classList.contains(this.kTransitionClass), false);
    }
    //Iterates over selected elements or single element, adding css transition class
    animate(elements) {
        Array.isArray(elements)
            ? elements.forEach(element => element === null || element === void 0 ? void 0 : element.classList.add(this.kTransitionClass))
            : elements === null || elements === void 0 ? void 0 : elements.classList.add(this.kTransitionClass);
    }
}
exports.Swippor = Swippor;
//# sourceMappingURL=Swippor.js.map