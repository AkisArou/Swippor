declare type TouchEndNotifiable = (position: number) => void;
export declare class Swippor {
    private references?;
    private elementWidth;
    private startingTouchX;
    private sideElementsThreshold;
    private threshold;
    private thresholdSwipingX;
    private thresholdFactor;
    private lastItemsThresholdFactor;
    private kTransitionClass;
    private onTouchEndNotify?;
    private currentWorkingPosition;
    private wasSwipingTowardsNullElement;
    private static translate;
    setRefs(references: HTMLElement[] | undefined): this;
    setTouchEndNotifier(onTouchEndNotify: TouchEndNotifiable): this;
    setThresholdFactor(thresholdFactor: number): this;
    setLastItemsThresholdFactor(lastItemsThresholdFactor: number): this;
    setTransitionClass(cls: string): this;
    activate(): void;
    deactivate(): void;
    onElementClicked: (position: number) => void;
    private setCurrentWorkingPosition;
    private setWasSwipingTowardsNullElement;
    private setReadyNextTouch;
    private static getSwipporDatasetAttribute;
    private getIsSwipingDirectionLeft;
    private isInitialSwipeDirectionNegative;
    private getElements;
    private getElementsAreStillAnimating;
    private animate;
    private transitionEndHandler;
    private touchStartHandler;
    private touchMoveHandler;
    private touchEndHandler;
}
export {};
//# sourceMappingURL=Swippor.d.ts.map