declare type TouchEndNotifiable = (position: number) => void;
export declare class Swippor {
    private readonly onTouchEndNotify?;
    private references?;
    private elementWidth;
    private startingTouchX;
    private originalSwipeOrientation;
    private sideElementsThreshold;
    private threshold;
    private readonly thresholdFactor;
    private readonly lastItemsThresholdFactor;
    private thresholdSwipingX;
    constructor(onTouchEndNotify?: TouchEndNotifiable | undefined);
    private static translate;
    setRefs(references: HTMLElement[] | undefined): this;
    private initialize;
    onElementClicked: (position: number) => void;
    private getSwipingDirectionRight;
    private isTryingToSwipeNegatively;
    private getElements;
    private setOriginalOrientation;
    private touchStartHandler;
    private touchMoveHandler;
    private touchEndHandler;
    private setReadyNextTouch;
}
export {};
//# sourceMappingURL=Swippor.d.ts.map