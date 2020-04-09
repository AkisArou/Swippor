import * as Const from "./constants";

type Elements = { currentShowingElement: HTMLElement, nextShowingElement: HTMLElement };
type TouchEndNotifiable = (position: number) => void;

enum OriginalSwipeOrientation {
    None,
    Right,
    Left
}


export class Swippor {
    //Current manipulated objects
    private references?: NodeListOf<HTMLElement>;
    //Element width used for swipe thresholds
    private elementWidth = 0;
    //Position x of the first touch
    private startingTouchX: number | null = null;
    //First swipe orientation
    private originalSwipeOrientation = OriginalSwipeOrientation.None;
    //Threshold value used for minimizing side elements swiping capability
    private sideElementsThreshold = 0;
    //Threshold value used for allowing show next element
    private threshold = 0;
    //Next elements' appearance factor used for elements width division
    private readonly thresholdFactor = 6;
    //Side elements' appearance factor used for elements width division
    private readonly lastItemsThresholdFactor = 20;
    //Threshold swiping value computed by subtracting sideElementsThreshold with change
    //Shows swiping direction until reaching the threshold
    private thresholdSwipingX = 0;
    //Receives optional touch end callback
    public constructor(private readonly onTouchEndNotify?: TouchEndNotifiable) {}

    //Static method for css translation value generation
    private static translate(value: string) {
        return `${Const.kTranslateX}(${value})`;
    }

    //Used for html elements setup
    public setRefs(references: NodeListOf<HTMLElement> | undefined): this {
        this.references = references;
        this.initialize();
        return this;
    }

    //Positions elements and subscribes to events
    private initialize(): void {
        this.references?.forEach((ref, idx) => {
            ref.style.transform = Swippor.translate(`${(idx * 100)}${Const.kPercentage}`);
            ref.addEventListener(Const.kTransitionEnd, _ => ref.classList.remove(Const.kAnimatedClass));
            ref.addEventListener(Const.kTouchStart, this.touchStartHandler);
            ref.addEventListener(Const.kTouchMove, ({touches}) => this.touchMoveHandler(touches[0].clientX, idx));
            ref.addEventListener(Const.kTouchEnd, ({changedTouches}) => this.touchEndHandler(changedTouches[0].clientX, idx));
        });
    }

    //Exposed secondary functionality for consistent single source of elements transformation
    public onElementClicked = (position: number): void => {
        this.references?.forEach((ref, idx) => {
            ref.classList.add(Const.kAnimatedClass);
            ref.style.transform = Swippor.translate(`${((idx - position) * 100)}${Const.kPercentage}`);
        });
    };

    //Returns if the current hand direction is right
    private getSwipingDirectionRight(touch: number): boolean {
        return (this.startingTouchX! - touch) > 0;
    }

    //Returns if the current swiped element is edge element and is trying to swipe negatively to null element
    private isTryingToSwipeNegatively(isMovingHandRight: boolean, position: number): boolean {
        return (!isMovingHandRight && position === 0) || (isMovingHandRight && position + 1 === this.references?.length)
    }

    //Returns current and to be shown elements used in both touchStart and touchMove handlers
    private getElements(isMovingHandRight: boolean, position: number): Elements {
        return {
            currentShowingElement: this.references![position],
            nextShowingElement: this.references![position + (isMovingHandRight ? 1 : -1)]
        }
    }

    //Sets the original swiping orientation. Called in touchMove handler
    private setOriginalOrientation(isMovingHandRight: boolean): void {
        if (this.originalSwipeOrientation === OriginalSwipeOrientation.None)
            this.originalSwipeOrientation = isMovingHandRight ? OriginalSwipeOrientation.Right : OriginalSwipeOrientation.Left;
    }

    //Sets needed values for swiping functionality
    private touchStartHandler = ({touches}: TouchEvent): void => {
        this.startingTouchX = touches[0].clientX;
        this.elementWidth = this.references?.[0].offsetWidth ?? 0;
        this.threshold = this.elementWidth / this.thresholdFactor;
        this.sideElementsThreshold = this.elementWidth / this.lastItemsThresholdFactor;
    };

    //Manipulates current and to be shown element.
    //Checks swiping orientation
    //Sets original orientation
    private touchMoveHandler(touch: number, position: number): void {
        if (!this.references) return;
        const isMovingHandRight = this.getSwipingDirectionRight(touch);
        //Absolute pixel change value from starting to current x | Used in currentShowingElement and for threshold
        const change = Math.abs(this.startingTouchX! - touch);
        //Absolute pixel change for next showing element
        const changeNextShowingElement = Math.abs(this.elementWidth! - change);
        //Sign for the original element caused touch event
        const signForCurrentShowingElement = isMovingHandRight ? Const.kMinus : Const.kPlus;
        //Sign for the next showing element
        const singForNextShowingElement = isMovingHandRight ? Const.kPlus : Const.kMinus;
        //Ready for usage string on translation for current showing element
        const translationValCurrentShowingElement = signForCurrentShowingElement + change + Const.kPixel;
        //Ready for usage string on translation for next showing element
        const translationValNextShowingElement = singForNextShowingElement + changeNextShowingElement + Const.kPixel;
        //Current and to be shown elements
        const {currentShowingElement, nextShowingElement} = this.getElements(isMovingHandRight, position);
        //Check swiping orientation by isMovingHandRight and position
        const isTryingToSwipeNegatively = this.isTryingToSwipeNegatively(isMovingHandRight, position);

        this.setOriginalOrientation(isMovingHandRight);
        currentShowingElement.classList.remove(Const.kAnimatedClass);

        //Negative swipe to null element
        if (isTryingToSwipeNegatively) {
            //Swiped until threshold and locked
            if(change > this.sideElementsThreshold) return;
            //New threshold swiping value computed by subtracting sideElementsThreshold with change
            //Shows swiping direction until reaching the threshold
            const newThresholdSwipingX = this.sideElementsThreshold - change;

            //If the new thresholdSwipingX is smaller than the previous one: Goes towards the null element
            if(newThresholdSwipingX < this.thresholdSwipingX) currentShowingElement.classList.add(Const.kAnimatedClass);
            //else goes towards existing element
            else currentShowingElement.classList.remove(Const.kAnimatedClass);

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
    }

    //Positions elements according to swiping state
    private touchEndHandler(realisingTouchX: number, position: number): void {
        if (!this.references) return;
        const isMovingHandRight = this.getSwipingDirectionRight(realisingTouchX);
        //Absolute pixel change value from starting to realising x
        const change = Math.abs(this.startingTouchX! - realisingTouchX);
        //Sign for the original element caused touch event
        const signForCurrentShowingElement = isMovingHandRight ? Const.kMinus : Const.kPlus;
        //Negative or position sign for to be show element reverted back to its position cause of insufficient swipe
        const thresholdSign = isMovingHandRight ? Const.kPlus : Const.kMinus;
        //Next position used for the onTouchEndNotify user set callback
        const nextPosition = isMovingHandRight ? position + 1 : position - 1;
        //Current and to be shown elements
        const {currentShowingElement, nextShowingElement} = this.getElements(isMovingHandRight, position);
        //Check swiping orientation by isMovingHandRight and position
        const isTryingToSwipeNegatively = this.isTryingToSwipeNegatively(isMovingHandRight, position);

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
        nextShowingElement?.classList.add(Const.kAnimatedClass);

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
            this.onTouchEndNotify?.(nextPosition);
            this.setReadyNextTouch();
        }
    }

    //Resets values ready for next touch
    private setReadyNextTouch(): void {
        this.startingTouchX = null;
        this.elementWidth = 0;
        this.originalSwipeOrientation = OriginalSwipeOrientation.None;
        this.thresholdSwipingX = 0;
    }
}