import { AfterContentInit, ChangeDetectorRef, EventEmitter, OnInit } from '@angular/core';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { CalendarCell, OwlCalendarBodyComponent } from './calendar-body.component';
import { SelectMode } from './date-time.class';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';
export declare const YEARS_PER_ROW = 3;
export declare const YEAR_ROWS = 7;
export declare class OwlMultiYearViewComponent<T> implements OnInit, AfterContentInit {
    private cdRef;
    private pickerIntl;
    private dateTimeAdapter;
    private _selectMode;
    selectMode: SelectMode;
    private _selected;
    selected: T | null;
    private _selecteds;
    selecteds: T[];
    private _pickerMoment;
    pickerMoment: T;
    private _dateFilter;
    dateFilter: (date: T) => boolean;
    private _minDate;
    minDate: T | null;
    private _maxDate;
    maxDate: T | null;
    private _todayYear;
    readonly todayYear: number;
    private _years;
    readonly years: CalendarCell[][];
    private _selectedYears;
    readonly selectedYears: number[];
    private initiated;
    readonly isInSingleMode: boolean;
    readonly isInRangeMode: boolean;
    readonly activeCell: number;
    readonly tableHeader: string;
    readonly prevButtonLabel: string;
    readonly nextButtonLabel: string;
    readonly change: EventEmitter<T>;
    readonly yearSelected: EventEmitter<T>;
    readonly pickerMomentChange: EventEmitter<T>;
    readonly keyboardEnter: EventEmitter<any>;
    calendarBodyElm: OwlCalendarBodyComponent;
    readonly owlDTCalendarView: boolean;
    readonly owlDTCalendarMultiYearView: boolean;
    constructor(cdRef: ChangeDetectorRef, pickerIntl: OwlDateTimeIntl, dateTimeAdapter: DateTimeAdapter<T>);
    ngOnInit(): void;
    ngAfterContentInit(): void;
    selectCalendarCell(cell: CalendarCell): void;
    private selectYear;
    prevYearList(event: any): void;
    nextYearList(event: any): void;
    generateYearList(): void;
    previousEnabled(): boolean;
    nextEnabled(): boolean;
    handleCalendarKeydown(event: KeyboardEvent): void;
    private createYearCell;
    private setSelectedYears;
    private isYearEnabled;
    private isSameYearList;
    private getValidDate;
    private focusActiveCell;
}