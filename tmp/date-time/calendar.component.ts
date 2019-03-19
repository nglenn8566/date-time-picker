/**
 * calendar.component
 */

import {
    AfterContentInit,
    AfterViewChecked,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    HostBinding,
    Inject,
    Input,
    NgZone,
    OnDestroy,
    OnInit,
    Optional,
    Output
} from '@angular/core';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { OWL_DATE_TIME_FORMATS, OwlDateTimeFormats } from './adapter/date-time-format.class';
import { SelectMode } from './date-time.class';
import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
    selector: 'owl-date-time-calendar',
    exportAs: 'owlDateTimeCalendar',
    template: `<div class="owl-dt-calendar-control"><!-- focus when keyboard tab (http://kizu.ru/en/blog/keyboard-only-focus/#x) --> <button class="owl-dt-control owl-dt-control-button owl-dt-control-arrow-button" type="button" tabindex="0" [style.visibility]="showControlArrows? 'visible': 'hidden'" [disabled]="!prevButtonEnabled()" [attr.aria-label]="prevButtonLabel" (click)="previousClicked()"><span class="owl-dt-control-content owl-dt-control-button-content" tabindex="-1"><!-- <editor-fold desc="SVG Arrow Left"> --> <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 250.738 250.738" style="enable-background:new 0 0 250.738 250.738;" xml:space="preserve" width="100%" height="100%"><path style="fill-rule: evenodd; clip-rule: evenodd;" d="M96.633,125.369l95.053-94.533c7.101-7.055,7.101-18.492,0-25.546   c-7.1-7.054-18.613-7.054-25.714,0L58.989,111.689c-3.784,3.759-5.487,8.759-5.238,13.68c-0.249,4.922,1.454,9.921,5.238,13.681   l106.983,106.398c7.101,7.055,18.613,7.055,25.714,0c7.101-7.054,7.101-18.491,0-25.544L96.633,125.369z"/></svg><!-- </editor-fold> --></span></button><div class="owl-dt-calendar-control-content"><button class="owl-dt-control owl-dt-control-button owl-dt-control-period-button" type="button" tabindex="0" [attr.aria-label]="periodButtonLabel" (click)="toggleViews()"><span class="owl-dt-control-content owl-dt-control-button-content" tabindex="-1">{{periodButtonText}} <span class="owl-dt-control-button-arrow" [style.transform]="'rotate(' + (isMonthView? 0 : 180) +'deg)'"><!-- <editor-fold desc="SVG Arrow"> --> <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="50%" height="50%" viewBox="0 0 292.362 292.362" style="enable-background:new 0 0 292.362 292.362;" xml:space="preserve"><g><path d="M286.935,69.377c-3.614-3.617-7.898-5.424-12.848-5.424H18.274c-4.952,0-9.233,1.807-12.85,5.424
                                C1.807,72.998,0,77.279,0,82.228c0,4.948,1.807,9.229,5.424,12.847l127.907,127.907c3.621,3.617,7.902,5.428,12.85,5.428
                                s9.233-1.811,12.847-5.428L286.935,95.074c3.613-3.617,5.427-7.898,5.427-12.847C292.362,77.279,290.548,72.998,286.935,69.377z"/></g></svg><!-- </editor-fold> --></span></span></button></div><button class="owl-dt-control owl-dt-control-button owl-dt-control-arrow-button" type="button" tabindex="0" [style.visibility]="showControlArrows? 'visible': 'hidden'" [disabled]="!nextButtonEnabled()" [attr.aria-label]="nextButtonLabel" (click)="nextClicked()"><span class="owl-dt-control-content owl-dt-control-button-content" tabindex="-1"><!-- <editor-fold desc="SVG Arrow Right"> --> <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 250.738 250.738" style="enable-background:new 0 0 250.738 250.738;" xml:space="preserve"><path style="fill-rule:evenodd;clip-rule:evenodd;" d="M191.75,111.689L84.766,5.291c-7.1-7.055-18.613-7.055-25.713,0
                    c-7.101,7.054-7.101,18.49,0,25.544l95.053,94.534l-95.053,94.533c-7.101,7.054-7.101,18.491,0,25.545
                    c7.1,7.054,18.613,7.054,25.713,0L191.75,139.05c3.784-3.759,5.487-8.759,5.238-13.681
                    C197.237,120.447,195.534,115.448,191.75,111.689z"/></svg><!-- </editor-fold> --></span></button></div><div class="owl-dt-calendar-main" cdkMonitorSubtreeFocus [ngSwitch]="currentView" tabindex="-1"><owl-date-time-month-view *ngSwitchCase="'month'" [pickerMoment]="pickerMoment" [firstDayOfWeek]="firstDayOfWeek" [selected]="selected" [selecteds]="selecteds" [selectMode]="selectMode" [minDate]="minDate" [maxDate]="maxDate" [dateFilter]="dateFilter" [hideOtherMonths]="hideOtherMonths" (pickerMomentChange)="handlePickerMomentChange($event)" (selectedChange)="dateSelected($event)" (userSelection)="userSelected()"></owl-date-time-month-view><owl-date-time-year-view *ngSwitchCase="'year'" [pickerMoment]="pickerMoment" [selected]="selected" [selecteds]="selecteds" [selectMode]="selectMode" [minDate]="minDate" [maxDate]="maxDate" [dateFilter]="dateFilter" (keyboardEnter)="focusActiveCell()" (pickerMomentChange)="handlePickerMomentChange($event)" (monthSelected)="selectMonthInYearView($event)" (change)="goToDateInView($event, 'month')"></owl-date-time-year-view><owl-date-time-multi-year-view *ngSwitchCase="'multi-years'" [pickerMoment]="pickerMoment" [selected]="selected" [selecteds]="selecteds" [selectMode]="selectMode" [minDate]="minDate" [maxDate]="maxDate" [dateFilter]="dateFilter" (keyboardEnter)="focusActiveCell()" (pickerMomentChange)="handlePickerMomentChange($event)" (yearSelected)="selectYearInMultiYearView($event)" (change)="goToDateInView($event, 'year')"></owl-date-time-multi-year-view></div>`,
    styles: [``],
    preserveWhitespaces: false,
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class OwlCalendarComponent<T> implements OnInit, AfterContentInit, AfterViewChecked, OnDestroy {

    /**
     * Date filter for the month and year view
     * @type {Function}
     * */
    @Input() dateFilter: Function;

    /**
     * Set the first day of week
     * @default {0} -- 0: Sunday ~ 6: Saturday
     * @type {number}
     * */
    @Input() firstDayOfWeek = 0;

    /** The minimum selectable date. */
    private _minDate: T | null;
    @Input()
    get minDate(): T | null {
        return this._minDate;
    }

    set minDate( value: T | null ) {
        value = this.dateTimeAdapter.deserialize(value);
        value = this.getValidDate(value);

        this._minDate = value ?
            this.dateTimeAdapter.createDate(
                this.dateTimeAdapter.getYear(value),
                this.dateTimeAdapter.getMonth(value),
                this.dateTimeAdapter.getDate(value),
            ) : null;
    }

    /** The maximum selectable date. */
    private _maxDate: T | null;
    @Input()
    get maxDate(): T | null {
        return this._maxDate;
    }

    set maxDate( value: T | null ) {
        value = this.dateTimeAdapter.deserialize(value);
        value = this.getValidDate(value);

        this._maxDate = value ?
            this.dateTimeAdapter.createDate(
                this.dateTimeAdapter.getYear(value),
                this.dateTimeAdapter.getMonth(value),
                this.dateTimeAdapter.getDate(value),
            ) : null;
    }

    /** The current picker moment */
    private _pickerMoment: T;
    @Input()
    get pickerMoment() {
        return this._pickerMoment;
    }

    set pickerMoment( value: T ) {
        value = this.dateTimeAdapter.deserialize(value);
        this._pickerMoment = this.getValidDate(value) || this.dateTimeAdapter.now();
    }

    @Input() selectMode: SelectMode;

    /** The currently selected moment. */
    private _selected: T | null;
    @Input()
    get selected(): T | null {
        return this._selected;
    }

    set selected( value: T | null ) {
        value = this.dateTimeAdapter.deserialize(value);
        this._selected = this.getValidDate(value);
    }

    private _selecteds: T[] = [];
    @Input()
    get selecteds(): T[] {
        return this._selecteds;
    }

    set selecteds( values: T[] ) {
        this._selecteds = values.map(( v ) => {
            v = this.dateTimeAdapter.deserialize(v);
            return this.getValidDate(v);
        });
    }

    /**
     * The view that the calendar should start in.
     * @default {'month'}
     * @type {'month' | 'year'}
     * */
    @Input() startView: 'month' | 'year' | 'multi-years' = 'month';

    /**
     * Whether to hide dates in other months at the start or end of the current month.
     * */
    @Input() hideOtherMonths: boolean;

    /** Emits when the currently picker moment changes. */
    @Output() pickerMomentChange = new EventEmitter<T>();

    /** Emits when the currently selected date changes. */
    @Output() selectedChange = new EventEmitter<T>();

    /** Emits when any date is selected. */
    @Output() userSelection = new EventEmitter<void>();

    /**
     * Emits the selected year. This doesn't imply a change on the selected date
     * */
    @Output() readonly yearSelected = new EventEmitter<T>();

    /**
     * Emits the selected month. This doesn't imply a change on the selected date
     * */
    @Output() readonly monthSelected = new EventEmitter<T>();

    get periodButtonText(): string {
        return this.isMonthView ? this.dateTimeAdapter.format(this.pickerMoment, this.dateTimeFormats.monthYearLabel) :
            this.dateTimeAdapter.getYearName(this.pickerMoment);
    }

    get periodButtonLabel(): string {
        return this.isMonthView ? this.pickerIntl.switchToMultiYearViewLabel :
            this.pickerIntl.switchToMonthViewLabel;
    }

    get prevButtonLabel(): string {
        if (this._currentView === 'month') {
            return this.pickerIntl.prevMonthLabel;
        } else if (this._currentView === 'year') {
            return this.pickerIntl.prevYearLabel;
        } else {
            return null;
        }
    }

    get nextButtonLabel(): string {
        if (this._currentView === 'month') {
            return this.pickerIntl.nextMonthLabel;
        } else if (this._currentView === 'year') {
            return this.pickerIntl.nextYearLabel;
        } else {
            return null;
        }
    }

    private _currentView: 'month' | 'year' | 'multi-years';
    get currentView(): 'month' | 'year' | 'multi-years' {
        return this._currentView;
    }

    set currentView( view: 'month' | 'year' | 'multi-years' ) {
        this._currentView = view;
        this.moveFocusOnNextTick = true;
    }

    get isInSingleMode(): boolean {
        return this.selectMode === 'single';
    }

    get isInRangeMode(): boolean {
        return this.selectMode === 'range' || this.selectMode === 'rangeFrom'
            || this.selectMode === 'rangeTo';
    }

    get showControlArrows(): boolean {
        return this._currentView !== 'multi-years';
    }

    get isMonthView() {
        return this._currentView === 'month';
    }

    /**
     * Date filter for the month and year view
     * @type {Function}
     * */
    public dateFilterForViews = ( date: T ) => {
        return !!date &&
            (!this.dateFilter || this.dateFilter(date)) &&
            (!this.minDate || this.dateTimeAdapter.compare(date, this.minDate) >= 0) &&
            (!this.maxDate || this.dateTimeAdapter.compare(date, this.maxDate) <= 0);
    };

    /**
     * Bind class 'owl-dt-calendar' to host
     * */
    @HostBinding('class.owl-dt-calendar')
    get owlDTCalendarClass(): boolean {
        return true;
    }

    private intlChangesSub = Subscription.EMPTY;

    /**
     * Used for scheduling that focus should be moved to the active cell on the next tick.
     * We need to schedule it, rather than do it immediately, because we have to wait
     * for Angular to re-evaluate the view children.
     */
    private moveFocusOnNextTick = false;

    constructor( private elmRef: ElementRef,
                 private pickerIntl: OwlDateTimeIntl,
                 private ngZone: NgZone,
                 private cdRef: ChangeDetectorRef,
                 @Optional() private dateTimeAdapter: DateTimeAdapter<T>,
                 @Optional() @Inject(OWL_DATE_TIME_FORMATS) private dateTimeFormats: OwlDateTimeFormats ) {

        this.intlChangesSub = this.pickerIntl.changes.subscribe(() => {
            this.cdRef.markForCheck();
        });
    }

    public ngOnInit() {
    }

    public ngAfterContentInit(): void {
        this._currentView = this.startView;
    }

    public ngAfterViewChecked() {
        if (this.moveFocusOnNextTick) {
            this.moveFocusOnNextTick = false;
            this.focusActiveCell();
        }
    }

    public ngOnDestroy(): void {
        this.intlChangesSub.unsubscribe();
    }

    /**
     * Toggle between month view and year view
     * @return {void}
     * */
    public toggleViews(): void {
        this.currentView = this._currentView == 'month' ? 'multi-years' : 'month';
    }

    /**
     * Handles user clicks on the previous button.
     * */
    public previousClicked(): void {
        this.pickerMoment = this.isMonthView ?
            this.dateTimeAdapter.addCalendarMonths(this.pickerMoment, -1) :
            this.dateTimeAdapter.addCalendarYears(this.pickerMoment, -1);

        this.pickerMomentChange.emit(this.pickerMoment);
    }

    /**
     * Handles user clicks on the next button.
     * */
    public nextClicked(): void {
        this.pickerMoment = this.isMonthView ?
            this.dateTimeAdapter.addCalendarMonths(this.pickerMoment, 1) :
            this.dateTimeAdapter.addCalendarYears(this.pickerMoment, 1);

        this.pickerMomentChange.emit(this.pickerMoment);
    }

    public dateSelected( date: T ): void {
        if (!this.dateFilterForViews(date)) {
            return;
        }

        this.selectedChange.emit(date);

        /*if ((this.isInSingleMode && !this.dateTimeAdapter.isSameDay(date, this.selected)) ||
            this.isInRangeMode) {
            this.selectedChange.emit(date);
        }*/
    }

    /**
     * Change the pickerMoment value and switch to a specific view
     * @param {T} date
     * @param {'month' | 'year' | 'multi-years'} view
     * @return {void}
     * */
    public goToDateInView( date: T, view: 'month' | 'year' | 'multi-years' ): void {
        this.handlePickerMomentChange(date);
        this.currentView = view;
        return;
    }

    /**
     * Change the pickerMoment value
     * @return {void}
     * */
    public handlePickerMomentChange( date: T ): void {
        this.pickerMoment = this.dateTimeAdapter.clampDate(date, this.minDate, this.maxDate);
        this.pickerMomentChange.emit(this.pickerMoment);
        return;
    }

    public userSelected(): void {
        this.userSelection.emit();
    }

    /**
     * Whether the previous period button is enabled.
     * @return {boolean}
     * */
    public prevButtonEnabled(): boolean {
        return !this.minDate || !this.isSameView(this.pickerMoment, this.minDate);
    }

    /**
     * Whether the next period button is enabled.
     * @return {boolean}
     * */
    public nextButtonEnabled(): boolean {
        return !this.maxDate || !this.isSameView(this.pickerMoment, this.maxDate);
    }

    /**
     * Focus to the host element
     * */
    public focusActiveCell() {
        this.ngZone.runOutsideAngular(() => {
            this.ngZone.onStable.asObservable().pipe(take(1)).subscribe(() => {
                this.elmRef.nativeElement.querySelector('.owl-dt-calendar-cell-active').focus();
            });
        });
    }

    public selectYearInMultiYearView( normalizedYear: T ): void {
        this.yearSelected.emit(normalizedYear);
    }

    public selectMonthInYearView( normalizedMonth: T ): void {
        this.monthSelected.emit(normalizedMonth);
    }

    /**
     * Whether the two dates represent the same view in the current view mode (month or year).
     * @param {Date} date1
     * @param {Date} date2
     * @return {boolean}
     * */
    private isSameView( date1: T, date2: T ): boolean {
        if (this._currentView === 'month') {
            return !!(date1 && date2 &&
                this.dateTimeAdapter.getYear(date1) === this.dateTimeAdapter.getYear(date2) &&
                this.dateTimeAdapter.getMonth(date1) === this.dateTimeAdapter.getMonth(date2));
        } else if (this._currentView === 'year') {
            return !!(date1 && date2 &&
                this.dateTimeAdapter.getYear(date1) === this.dateTimeAdapter.getYear(date2));
        } else {
            return false;
        }
    }

    /**
     * Get a valid date object
     * @param {any} obj -- The object to check.
     * @return {Date | null} -- The given object if it is both a date instance and valid, otherwise null.
     */
    private getValidDate( obj: any ): T | null {
        return (this.dateTimeAdapter.isDateInstance(obj) && this.dateTimeAdapter.isValid(obj)) ? obj : null;
    }
}
