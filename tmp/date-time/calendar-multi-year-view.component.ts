/**
 * calendar-multi-year-view.component
 */

import {
    AfterContentInit,
    ChangeDetectionStrategy, ChangeDetectorRef,
    Component,
    EventEmitter,
    HostBinding,
    Input,
    OnInit,
    Optional,
    Output,
    ViewChild
} from '@angular/core';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { CalendarCell, OwlCalendarBodyComponent } from './calendar-body.component';
import { SelectMode } from './date-time.class';
import {
    DOWN_ARROW,
    END,
    ENTER,
    HOME,
    LEFT_ARROW,
    PAGE_DOWN,
    PAGE_UP,
    RIGHT_ARROW,
    UP_ARROW
} from '@angular/cdk/keycodes';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';

export const YEARS_PER_ROW = 3;
export const YEAR_ROWS = 7;

@Component({
    selector: 'owl-date-time-multi-year-view',
    template: `<button class="owl-dt-control-button owl-dt-control-arrow-button" [disabled]="!previousEnabled()" [attr.aria-label]="prevButtonLabel" type="button" tabindex="0" (click)="prevYearList($event)"><span class="owl-dt-control-button-content" tabindex="-1"><!-- <editor-fold desc="SVG Arrow Left"> --> <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 250.738 250.738" style="enable-background:new 0 0 250.738 250.738;" xml:space="preserve" width="100%" height="100%"><path style="fill-rule: evenodd; clip-rule: evenodd;" d="M96.633,125.369l95.053-94.533c7.101-7.055,7.101-18.492,0-25.546   c-7.1-7.054-18.613-7.054-25.714,0L58.989,111.689c-3.784,3.759-5.487,8.759-5.238,13.68c-0.249,4.922,1.454,9.921,5.238,13.681   l106.983,106.398c7.101,7.055,18.613,7.055,25.714,0c7.101-7.054,7.101-18.491,0-25.544L96.633,125.369z"/></svg><!-- </editor-fold> --></span></button><table class="owl-dt-calendar-table owl-dt-calendar-multi-year-table"><thead class="owl-dt-calendar-header"><tr><th colspan="3">{{tableHeader}}</th></tr></thead><tbody owl-date-time-calendar-body role="grid" [rows]="years" [numCols]="3" [cellRatio]="3 / 7" [activeCell]="activeCell" [todayValue]="todayYear" [selectedValues]="selectedYears" [selectMode]="selectMode" (keydown)="handleCalendarKeydown($event)" (select)="selectCalendarCell($event)"></tbody></table><button class="owl-dt-control-button owl-dt-control-arrow-button" [disabled]="!nextEnabled()" [attr.aria-label]="nextButtonLabel" type="button" tabindex="0" (click)="nextYearList($event)"><span class="owl-dt-control-button-content" tabindex="-1"><!-- <editor-fold desc="SVG Arrow Right"> --> <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 250.738 250.738" style="enable-background:new 0 0 250.738 250.738;" xml:space="preserve"><path style="fill-rule:evenodd;clip-rule:evenodd;" d="M191.75,111.689L84.766,5.291c-7.1-7.055-18.613-7.055-25.713,0
                c-7.101,7.054-7.101,18.49,0,25.544l95.053,94.534l-95.053,94.533c-7.101,7.054-7.101,18.491,0,25.545
                c7.1,7.054,18.613,7.054,25.713,0L191.75,139.05c3.784-3.759,5.487-8.759,5.238-13.681
                C197.237,120.447,195.534,115.448,191.75,111.689z"/></svg><!-- </editor-fold> --></span></button>`,
    styles: [``],
    preserveWhitespaces: false,
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class OwlMultiYearViewComponent<T> implements OnInit, AfterContentInit {

    /**
     * The select mode of the picker;
     * */
    private _selectMode: SelectMode = 'single';
    @Input()
    get selectMode(): SelectMode {
        return this._selectMode;
    }

    set selectMode( val: SelectMode ) {
        this._selectMode = val;
        if (this.initiated) {
            this.setSelectedYears();
            this.cdRef.markForCheck();
        }
    }

    /** The currently selected date. */
    private _selected: T | null;
    @Input()
    get selected(): T | null {
        return this._selected;
    }

    set selected( value: T | null ) {
        const oldSelected = this._selected;
        value = this.dateTimeAdapter.deserialize(value);
        this._selected = this.getValidDate(value);

        if (!this.dateTimeAdapter.isSameDay(oldSelected, this._selected)) {
            this.setSelectedYears();
        }
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
        this.setSelectedYears();
    }

    private _pickerMoment: T | null;
    @Input()
    get pickerMoment() {
        return this._pickerMoment;
    }

    set pickerMoment( value: T ) {
        const oldMoment = this._pickerMoment;
        value = this.dateTimeAdapter.deserialize(value);
        this._pickerMoment = this.getValidDate(value) || this.dateTimeAdapter.now();

        if (oldMoment && this._pickerMoment &&
            !this.isSameYearList(oldMoment, this._pickerMoment)) {
            this.generateYearList();
        }
    }

    /**
     * A function used to filter which dates are selectable
     * */
    private _dateFilter: ( date: T ) => boolean;
    @Input()
    get dateFilter() {
        return this._dateFilter;
    }

    set dateFilter( filter: ( date: T ) => boolean ) {
        this._dateFilter = filter;
        if (this.initiated) {
            this.generateYearList();
        }
    }

    /** The minimum selectable date. */
    private _minDate: T | null;
    @Input()
    get minDate(): T | null {
        return this._minDate;
    }

    set minDate( value: T | null ) {
        value = this.dateTimeAdapter.deserialize(value);
        this._minDate = this.getValidDate(value);
        if (this.initiated) {
            this.generateYearList();
        }
    }

    /** The maximum selectable date. */
    private _maxDate: T | null;
    @Input()
    get maxDate(): T | null {
        return this._maxDate;
    }

    set maxDate( value: T | null ) {
        value = this.dateTimeAdapter.deserialize(value);
        this._maxDate = this.getValidDate(value);
        if (this.initiated) {
            this.generateYearList();
        }
    }

    private _todayYear: number;
    get todayYear(): number {
        return this._todayYear;
    }

    private _years: CalendarCell[][];
    get years() {
        return this._years;
    }

    private _selectedYears: number[];
    get selectedYears(): number[] {
        return this._selectedYears;
    }

    private initiated = false;

    get isInSingleMode(): boolean {
        return this.selectMode === 'single';
    }

    get isInRangeMode(): boolean {
        return this.selectMode === 'range' || this.selectMode === 'rangeFrom'
            || this.selectMode === 'rangeTo';
    }

    get activeCell(): number {
        if (this._pickerMoment) {
            return this.dateTimeAdapter.getYear(this._pickerMoment) % (YEARS_PER_ROW * YEAR_ROWS);
        }
    }

    get tableHeader(): string {
        if (this._years && this._years.length > 0) {
            return `${this._years[0][0].displayValue} ~ ${this._years[YEAR_ROWS - 1][YEARS_PER_ROW - 1].displayValue}`
        }
    }

    get prevButtonLabel(): string {
        return this.pickerIntl.prevMultiYearLabel;
    }

    get nextButtonLabel(): string {
        return this.pickerIntl.nextMultiYearLabel;
    }

    /**
     * Callback to invoke when a new month is selected
     * */
    @Output() readonly change = new EventEmitter<T>();

    /**
     * Emits the selected year. This doesn't imply a change on the selected date
     * */
    @Output() readonly yearSelected = new EventEmitter<T>();

    /** Emits when any date is activated. */
    @Output() readonly pickerMomentChange: EventEmitter<T> = new EventEmitter<T>();

    /** Emits when use keyboard enter to select a calendar cell */
    @Output() readonly keyboardEnter: EventEmitter<any> = new EventEmitter<any>();

    /** The body of calendar table */
    @ViewChild(OwlCalendarBodyComponent) calendarBodyElm: OwlCalendarBodyComponent;

    @HostBinding('class.owl-dt-calendar-view')
    get owlDTCalendarView(): boolean {
        return true;
    }

    @HostBinding('class.owl-dt-calendar-multi-year-view')
    get owlDTCalendarMultiYearView(): boolean {
        return true;
    }

    constructor( private cdRef: ChangeDetectorRef,
                 private pickerIntl: OwlDateTimeIntl,
                 @Optional() private dateTimeAdapter: DateTimeAdapter<T> ) {
    }

    public ngOnInit() {
    }

    public ngAfterContentInit(): void {
        this._todayYear = this.dateTimeAdapter.getYear(this.dateTimeAdapter.now());
        this.generateYearList();
        this.initiated = true;
    }

    /**
     * Handle a calendarCell selected
     * @param {CalendarCell} cell
     * @return {void}
     * */
    public selectCalendarCell( cell: CalendarCell ): void {
        this.selectYear(cell.value);
    }

    private selectYear( year: number ): void {
        this.yearSelected.emit(this.dateTimeAdapter.createDate(year, 0, 1));
        const firstDateOfMonth = this.dateTimeAdapter.createDate(
            year,
            this.dateTimeAdapter.getMonth(this.pickerMoment),
            1
        );
        const daysInMonth = this.dateTimeAdapter.getNumDaysInMonth(firstDateOfMonth);
        const selected = this.dateTimeAdapter.createDate(
            year,
            this.dateTimeAdapter.getMonth(this.pickerMoment),
            Math.min(daysInMonth, this.dateTimeAdapter.getDate(this.pickerMoment)),
            this.dateTimeAdapter.getHours(this.pickerMoment),
            this.dateTimeAdapter.getMinutes(this.pickerMoment),
            this.dateTimeAdapter.getSeconds(this.pickerMoment),
        );

        this.change.emit(selected);
    }

    /**
     * Generate the previous year list
     * */
    public prevYearList( event: any ): void {
        this._pickerMoment = this.dateTimeAdapter.addCalendarYears(this.pickerMoment, -1 * YEAR_ROWS * YEARS_PER_ROW);
        this.generateYearList();
        event.preventDefault();
    }

    /**
     * Generate the next year list
     * */
    public nextYearList( event: any ): void {
        this._pickerMoment = this.dateTimeAdapter.addCalendarYears(this.pickerMoment, YEAR_ROWS * YEARS_PER_ROW);
        this.generateYearList();
        event.preventDefault();
    }

    public generateYearList(): void {
        this._years = [];

        const pickerMomentYear = this.dateTimeAdapter.getYear(this._pickerMoment);
        const offset = pickerMomentYear % (YEARS_PER_ROW * YEAR_ROWS);

        for (let i = 0; i < YEAR_ROWS; i++) {
            const row = [];

            for (let j = 0; j < YEARS_PER_ROW; j++) {
                const year = pickerMomentYear - offset + (j + i * YEARS_PER_ROW);
                const yearCell = this.createYearCell(year);
                row.push(yearCell);
            }

            this._years.push(row);
        }

        return;

    }

    /** Whether the previous period button is enabled. */
    public previousEnabled(): boolean {
        if (!this.minDate) {
            return true;
        }
        return !this.minDate || !this.isSameYearList(this._pickerMoment, this.minDate);
    }

    /** Whether the next period button is enabled. */
    public nextEnabled(): boolean {
        return !this.maxDate || !this.isSameYearList(this._pickerMoment, this.maxDate);
    }

    public handleCalendarKeydown( event: KeyboardEvent ): void {
        let moment;
        switch (event.keyCode) {
            // minus 1 year
            case LEFT_ARROW:
                moment = this.dateTimeAdapter.addCalendarYears(this._pickerMoment, -1);
                this.pickerMomentChange.emit(moment);
                break;

            // add 1 year
            case RIGHT_ARROW:
                moment = this.dateTimeAdapter.addCalendarYears(this._pickerMoment, 1);
                this.pickerMomentChange.emit(moment);
                break;

            // minus 3 years
            case UP_ARROW:
                moment = this.dateTimeAdapter.addCalendarYears(this._pickerMoment, -1 * YEARS_PER_ROW);
                this.pickerMomentChange.emit(moment);
                break;

            // add 3 years
            case DOWN_ARROW:
                moment = this.dateTimeAdapter.addCalendarYears(this._pickerMoment, YEARS_PER_ROW);
                this.pickerMomentChange.emit(moment);
                break;

            // go to the first year of the year page
            case HOME:
                moment = this.dateTimeAdapter.addCalendarYears(this._pickerMoment,
                    -this.dateTimeAdapter.getYear(this._pickerMoment) % (YEARS_PER_ROW * YEAR_ROWS));
                this.pickerMomentChange.emit(moment);
                break;

            // go to the last year of the year page
            case END:
                moment = this.dateTimeAdapter.addCalendarYears(this._pickerMoment,
                    (YEARS_PER_ROW * YEAR_ROWS) - this.dateTimeAdapter.getYear(this._pickerMoment) % (YEARS_PER_ROW * YEAR_ROWS) - 1);
                this.pickerMomentChange.emit(moment);
                break;

            // minus 1 year page (or 10 year pages)
            case PAGE_UP:
                moment = this.dateTimeAdapter.addCalendarYears(this.pickerMoment, event.altKey ? -10 * (YEARS_PER_ROW * YEAR_ROWS) : -1 * (YEARS_PER_ROW * YEAR_ROWS));
                this.pickerMomentChange.emit(moment);
                break;

            // add 1 year page (or 10 year pages)
            case PAGE_DOWN:
                moment = this.dateTimeAdapter.addCalendarYears(this.pickerMoment, event.altKey ? 10 * (YEARS_PER_ROW * YEAR_ROWS) : (YEARS_PER_ROW * YEAR_ROWS));
                this.pickerMomentChange.emit(moment);
                break;

            case ENTER:
                this.selectYear(this.dateTimeAdapter.getYear(this._pickerMoment));
                this.keyboardEnter.emit();
                break;

            default:
                return;
        }

        this.focusActiveCell();
        event.preventDefault();
    }

    /**
     * Creates an CalendarCell for the given year.
     * @param {number} year
     * @return {CalendarCell}
     * */
    private createYearCell( year: number ): CalendarCell {
        const startDateOfYear = this.dateTimeAdapter.createDate(year, 0, 1);
        const ariaLabel = this.dateTimeAdapter.getYearName(startDateOfYear);
        const cellClass = 'owl-dt-year-' + year;
        return new CalendarCell(year, year.toString(), ariaLabel, this.isYearEnabled(year), false, cellClass);
    }

    private setSelectedYears(): void {

        this._selectedYears = [];

        if (this.isInSingleMode && this.selected) {
            this._selectedYears[0] = this.dateTimeAdapter.getYear(this.selected);
        }

        if (this.isInRangeMode && this.selecteds) {
            this._selectedYears = this.selecteds.map(( selected ) => {
                if (this.dateTimeAdapter.isValid(selected)) {
                    return this.dateTimeAdapter.getYear(selected);
                } else {
                    return null;
                }
            })
        }
    }

    /** Whether the given year is enabled. */
    private isYearEnabled( year: number ) {
        // disable if the year is greater than maxDate lower than minDate
        if (year === undefined || year === null ||
            (this.maxDate && year > this.dateTimeAdapter.getYear(this.maxDate)) ||
            (this.minDate && year < this.dateTimeAdapter.getYear(this.minDate))) {
            return false;
        }

        // enable if it reaches here and there's no filter defined
        if (!this.dateFilter) {
            return true;
        }

        const firstOfYear = this.dateTimeAdapter.createDate(year, 0, 1);

        // If any date in the year is enabled count the year as enabled.
        for (let date = firstOfYear; this.dateTimeAdapter.getYear(date) == year;
             date = this.dateTimeAdapter.addCalendarDays(date, 1)) {
            if (this.dateFilter(date)) {
                return true;
            }
        }

        return false;
    }

    private isSameYearList( date1: T, date2: T ): boolean {
        return Math.floor(this.dateTimeAdapter.getYear(date1) / (YEARS_PER_ROW * YEAR_ROWS)) ===
            Math.floor(this.dateTimeAdapter.getYear(date2) / (YEARS_PER_ROW * YEAR_ROWS));
    }

    /**
     * Get a valid date object
     * @param {any} obj -- The object to check.
     * @return {Date | null} -- The given object if it is both a date instance and valid, otherwise null.
     */
    private getValidDate( obj: any ): T | null {
        return (this.dateTimeAdapter.isDateInstance(obj) && this.dateTimeAdapter.isValid(obj)) ? obj : null;
    }

    private focusActiveCell() {
        this.calendarBodyElm.focusActiveCell();
    }
}
