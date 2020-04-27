import * as Const from "../src/constants";

type TouchEndNotifiable = (position: number) => void;
type Elements = { currentShowingElement: HTMLElement, nextShowingElement: HTMLElement, previousElement: HTMLElement, morePrev: HTMLElement };

export class Swippor {
    //Current manipulated objects
    private references?: HTMLElement[];
    //Element width used for swipe thresholds
    private elementWidth = 0;
    //Position x of the first touch
    private startingTouchX: number | null = null;
    //Threshold value used for minimizing side elements swiping capability
    private sideElementsThreshold = 0;
    //Threshold value used for allowing show next element
    private threshold = 0;
    //Threshold swiping value computed by subtracting sideElementsThreshold with change
    //Shows swiping direction until reaching the threshold
    private thresholdSwipingX = 0;
    //Next elements' appearance factor used for elements width division
    private thresholdFactor = 6;
    //Side elements' appearance factor used for elements width division
    private lastItemsThresholdFactor = 9;
    //Transition css cls
    private kTransitionClass = Const.kAnimatedClass;
    //Callback called when position successfully changed
    private onTouchEndNotify?: TouchEndNotifiable;
    //Value read from touchMoveHandler and touchEndHandler. Assigned once every different touch start event of touchStartHandler
    //so dataset swippor identifier is queried once from evt.target attributes
    private currentWorkingPosition = 0;
    //Used for assigning animation to next showing element, when previous move was towards null element
    private wasSwipingTowardsNullElement = false;


    //Static method for css translation value generation
    private static translate(element: HTMLElement, value: string): void {
        element.style.transform = `${Const.kTranslateX}(${value})`;
    }

    /* Setters */

    //Used for HTML elements setup. Startup method
    public setParentNode(parentNode: HTMLElement): this {
        //Add refs by getting children of provided parentNode
        this.setRefs([...parentNode.children] as HTMLElement[]);
        return this;
    }

    //Used for HTML elements setup.
    // Alternative Startup method by manual parentNode get by id
    public setParentNodeById(parentNodeId: string): this {
        return this.setParentNode(document.querySelector(parentNodeId) as HTMLElement);
    }


    //Used for HTML elements setup internally.
    // Also ALTERNATIVE Startup method
    public setRefs(references: HTMLElement[]): this {
        //First deactivate listeners if there are any, before setting references
        this.deactivateListeners();
        //Add refs
        this.references = references;
        //Attach listeners for each element
        this.activateListeners();
        return this;
    }


    //Cleanup method
    public cleanup() {
        //First deactivate listeners
        this.deactivateListeners();
        //Then set references to undefined
        this.references = undefined;
        //Remove onTouchEndNotify
        this.onTouchEndNotify = undefined;
    }

    //Sets Callback called when position successfully changed
    public setTouchEndNotifier(onTouchEndNotify: TouchEndNotifiable): this {
        this.onTouchEndNotify = onTouchEndNotify;
        return this;
    }

    //Sets user preferred threshold factor swiping between elements
    public setThresholdFactor(thresholdFactor: number): this {
        this.thresholdFactor = thresholdFactor;
        return this;
    }

    //Sets user preferred last items threshold factor
    public setLastItemsThresholdFactor(lastItemsThresholdFactor: number): this {
        this.lastItemsThresholdFactor = lastItemsThresholdFactor;
        return this;
    }

    //Sets user preferred CSS transition class
    public setTransitionClass(cls: string): this {
        this.kTransitionClass = cls.charAt(0) === Const.kDot
            ? cls.substring(1)
            : cls;
        return this;
    }


    /* Init- De-init */


    //Positions elements and subscribes to events
    //Exposed method for manual activation in case of manual deactivation of listeners
    public activateListeners(): void {
        this.references?.forEach((ref, idx) => {
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
    public deactivateListeners(): void {
        this.references?.forEach(ref => {
            ref.removeEventListener(Const.kTransitionEnd, this.transitionEndHandler);
            ref.removeEventListener(Const.kTouchStart, this.touchStartHandler);
            ref.removeEventListener(Const.kTouchMove, this.touchMoveHandler);
            ref.removeEventListener(Const.kTouchEnd, this.touchEndHandler);
        });
    }


    //Exposed secondary functionality for consistent single source of elements transformation
    public moveToElementByIndex = (position: number): void => {
        this.references?.forEach((ref, idx) => {
            ref.classList.add(this.kTransitionClass);
            Swippor.translate(ref, `${((idx - position) * 100)}${Const.kPercentage}`);
        });
    };


    /* State actions */

    //Sets current working position
    private setCurrentWorkingPosition(position: number): void {
        this.currentWorkingPosition = position;
    }

    //Sets if last swipe was towards null element
    private setWasSwipingTowardsNullElement(was: boolean): void {
        this.wasSwipingTowardsNullElement = was;
    }

    //Resets values ready for next touch
    private setReadyNextTouch(position: number, isValidMove: boolean): void {
        if (isValidMove) this.setCurrentWorkingPosition(position);
        this.startingTouchX = null;
        this.elementWidth = 0;
        this.thresholdSwipingX = 0;
    }


    /* Helpers */

    //Returns element index from queried element attribute from DOM
    //Used in transitionEndHandler and touchStartHandler
    private static getSwipporDatasetAttribute(target: EventTarget): number {
        return +(target as HTMLElement).getAttribute(Const.kSwipporDataset)!;
    }


    //Returns if the current hand direction is right
    private getIsSwipingDirectionLeft(touch: number): boolean {
        return (this.startingTouchX! - touch) > 0;
    }

    //Returns if the current swiped element is edge element and its' initial swipe direction is to swipe negatively to null element
    //Used for animation on "side" elements.
    private isInitialSwipeDirectionNegative(isMovingHandRight: boolean, position: number): boolean {
        return ((!isMovingHandRight && position === 0) || (isMovingHandRight && position + 1 === this.references!.length))
    }

    //Returns current and to be shown elements used in both touchStart and touchMove handlers
    private getElements(isMovingHandRight: boolean, position: number): Elements {
        return {
            currentShowingElement: this.references![position],
            nextShowingElement: this.references![position + (isMovingHandRight ? 1 : -1)],
            previousElement: this.references![position + (isMovingHandRight ? -1 : 1)],
            morePrev: this.references![position + (isMovingHandRight ? +2 : -2)],
        }
    }

    //If emits true, the next touch is canceled
    private getElementsAreStillAnimating(elements: HTMLElement[]): boolean {
        return elements
            .filter(element => !!element)
            .reduce<boolean>((acc, currentElement) =>
                currentElement.classList.contains(this.kTransitionClass), false)
    }

    //Iterates over selected elements or single element, adding css transition class
    private animate(elements: HTMLElement | HTMLElement[]) {
        Array.isArray(elements)
            ? elements.forEach(element => element?.classList.add(this.kTransitionClass))
            : elements?.classList.add(this.kTransitionClass);
    }


    /* Handlers */

    //Removes animation on transitioning elements transition end
    private transitionEndHandler = (evt: TransitionEvent) => {
        const position = Swippor.getSwipporDatasetAttribute(evt.currentTarget!);

        this.references?.[position].classList.remove(this.kTransitionClass);
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
    private touchStartHandler = (evt: TouchEvent): void => {
        evt.preventDefault();
        this.setCurrentWorkingPosition(Swippor.getSwipporDatasetAttribute(evt.currentTarget!));

        this.startingTouchX = evt.touches[0].clientX;
        this.elementWidth = this.references?.[0].offsetWidth ?? 0;
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

    private touchMoveHandler = (evt: TouchEvent): void => {
        const position = this.currentWorkingPosition;
        //Prevent default browser behaviour
        evt.preventDefault();
        //Current Touch
        const touch = evt.targetTouches[0].clientX;
        //Getting Swipe direction
        const isMovingHandLeft = this.getIsSwipingDirectionLeft(touch);
        //Absolute pixel change value from starting to current x | Used in currentShowingElement and for threshold
        const change = Math.abs(this.startingTouchX! - touch);
        //Dont run on no change or the changes is bigger that elements' width because it starts moving the opposite position
        if (!change || change === this.elementWidth || change > this.elementWidth) return;
        //Absolute pixel change for next showing element
        const changeNextShowingElement = Math.abs(this.elementWidth! - change);
        //Change for previous element
        const changePreviousElement = this.elementWidth! + change;
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
        const {currentShowingElement, nextShowingElement, previousElement} = this.getElements(isMovingHandLeft, position);
        //Check swiping orientation by isMovingHandLeft and position
        //Used to check for normal swiping or swiping towards null element
        //It emits only the initial swipe direction
        //Resets when the element resets to its original position
        const isInitialSwipeDirectionNegative = this.isInitialSwipeDirectionNegative(isMovingHandLeft, position);

        //Check if elements are still animating. If so, return
        if (this.getElementsAreStillAnimating([currentShowingElement, nextShowingElement, previousElement])) return;

        //Negative swipe to null element
        if (isInitialSwipeDirectionNegative) {
            //if there is a previous element, translate it accordingly.
            //It may not seems so difference but sometimes it sticks buggy to the edge of the screen
            //It is called also in normal swipe in else condition

            //Swipable until threshold and locked
            if (change > this.sideElementsThreshold) return;
            if (previousElement) Swippor.translate(previousElement, translationValPreviousShowingElement);

            //New threshold swiping value computed by subtracting sideElementsThreshold with change
            //Shows swiping direction until reaching the threshold
            const newThresholdSwipingX = this.sideElementsThreshold - change;

            // (this.sideElementsThreshold - change< this.thresholdSwipingX)
            //If the new thresholdSwipingX is smaller than the previous one: Goes towards the null element
            if (newThresholdSwipingX < this.thresholdSwipingX) this.animate(currentShowingElement);
            else currentShowingElement.classList.remove(this.kTransitionClass);

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
            if (previousElement) Swippor.translate(previousElement, translationValPreviousShowingElement)
        }
    };

    //Positions elements according to swiping state
    private touchEndHandler = (evt: TouchEvent): void => {
        const position = this.currentWorkingPosition;
        //Prevent default browser behaviour
        evt.preventDefault();
        //Position x value touch released
        const realisingTouchX = evt.changedTouches[0].clientX;
        //Always contains references when this runs. Added just for type safety
        if (!this.references) return;
        //Getting Swipe direction
        const isMovingHandRight = this.getIsSwipingDirectionLeft(realisingTouchX);
        //Absolute pixel change value from starting to realising x
        const change = Math.abs(this.startingTouchX! - realisingTouchX);
        //Dont run on no change
        if (!change) return;
        //Sign for the original element caused touch event
        const signForCurrentShowingElement = isMovingHandRight ? Const.kMinus : Const.kPlus;
        //Negative or position sign for to be show element reverted back to its position cause of insufficient swipe
        const thresholdSign = isMovingHandRight ? Const.kPlus : Const.kMinus;
        //Negative or position sign for previous element (if exists)
        const previousElementSign = isMovingHandRight ? Const.kMinus : Const.kPlus;
        //Next position used for the onTouchEndNotify user set callback
        const nextPosition = isMovingHandRight ? position + 1 : position - 1;
        //Current and to be shown elements
        const {currentShowingElement, nextShowingElement, previousElement, morePrev} = this.getElements(isMovingHandRight, position);
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
            if (previousElement) Swippor.translate(previousElement, signForCurrentShowingElement + Const.kTwoHundredPercent);

            if (morePrev)
                Swippor.translate(morePrev, thresholdSign + Const.kHundredPercent)
            //Touch finished
            this.onTouchEndNotify?.(nextPosition);
            this.setReadyNextTouch(nextPosition, true);
        }
    }
}