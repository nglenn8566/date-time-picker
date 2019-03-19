/**
 * timer.component
 */

import {
    ChangeDetectionStrategy, ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    HostBinding,
    Input,
    NgZone,
    OnInit,
    Optional,
    Output
} from '@angular/core';
import { OwlDateTimeIntl } from './date-time-picker-intl.service';
import { DateTimeAdapter } from './adapter/date-time-adapter.class';
import { take } from 'rxjs/operators';

@Component({
    exportAs: 'owlDateTimeTimer',
    selector: 'owl-date-time-timer',
    template: `<owl-date-time-timer-box [upBtnAriaLabel]="upHourButtonLabel" [downBtnAriaLabel]="downHourButtonLabel" [upBtnDisabled]="!upHourEnabled()" [downBtnDisabled]="!downHourEnabled()" [boxValue]="hourBoxValue" [value]="hourValue" [min]="0" [max]="23" [step]="stepHour" [inputLabel]="'Hour'" (inputChange)="setHourValueViaInput($event)" (valueChange)="setHourValue($event)"></owl-date-time-timer-box><owl-date-time-timer-box [showDivider]="true" [upBtnAriaLabel]="upMinuteButtonLabel" [downBtnAriaLabel]="downMinuteButtonLabel" [upBtnDisabled]="!upMinuteEnabled()" [downBtnDisabled]="!downMinuteEnabled()" [value]="minuteValue" [min]="0" [max]="59" [step]="stepMinute" [inputLabel]="'Minute'" (inputChange)="setMinuteValue($event)" (valueChange)="setMinuteValue($event)"></owl-date-time-timer-box><owl-date-time-timer-box *ngIf="showSecondsTimer" [showDivider]="true" [upBtnAriaLabel]="upSecondButtonLabel" [downBtnAriaLabel]="downSecondButtonLabel" [upBtnDisabled]="!upSecondEnabled()" [downBtnDisabled]="!downSecondEnabled()" [value]="secondValue" [min]="0" [max]="59" [step]="stepSecond" [inputLabel]="'Second'" (inputChange)="setSecondValue($event)" (valueChange)="setSecondValue($event)"></owl-date-time-timer-box><div *ngIf="hour12Timer" class="owl-dt-timer-hour12"><button class="owl-dt-control-button owl-dt-timer-hour12-box" type="button" tabindex="0" (click)="setMeridiem($event)"><span class="owl-dt-control-button-content" tabindex="-1">{{hour12ButtonLabel}}</span></button></div>`,
    styles: [``],
    preserveWhitespaces: false,
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class OwlTimerComponent<T> implements OnInit {

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

    /** The minimum selectable date time. */
    private _minDateTime: T | null;
    @Input()
    get minDateTime(): T | null {
        return this._minDateTime;
    }

    set minDateTime( value: T | null ) {
        value = this.dateTimeAdapter.deserialize(value);
        this._minDateTime = this.getValidDate(value);
    }

    /** The maximum selectable date time. */
    private _maxDateTime: T | null;
    @Input()
    get maxDateTime(): T | null {
        return this._maxDateTime;
    }

    set maxDateTime( value: T | null ) {
        value = this.dateTimeAdapter.deserialize(value);
        this._maxDateTime = this.getValidDate(value);
    }

    private isPM: boolean = false; // a flag indicates the current timer moment is in PM or AM

    /**
     * Whether to show the second's timer
     * @default false
     * @type {Boolean}
     * */
    @Input() showSecondsTimer: boolean;

    /**
     * Whether the timer is in hour12 format
     * @default false
     * @type {boolean}
     * */
    @Input() hour12Timer: boolean;

    /**
     * Hours to change per step
     * @default {1}
     * @type {number}
     * */
    @Input() stepHour = 1;

    /**
     * Minutes to change per step
     * @default {1}
     * @type {number}
     * */
    @Input() stepMinute = 1;

    /**
     * Seconds to change per step
     * @default {1}
     * @type {number}
     * */
    @Input() stepSecond = 1;

    get hourValue(): number {
        return this.dateTimeAdapter.getHours(this.pickerMoment);
    }

    /**
     * The value would be displayed in hourBox.
     * We need this because the value displayed in hourBox it not
     * the same as the hourValue when the timer is in hour12Timer mode.
     * */
    get hourBoxValue(): number {
        let hours = this.hourValue;

        if (!this.hour12Timer) {
            return hours;
        } else {

            if (hours === 0) {
                hours = 12;
                this.isPM = false;
            } else if (hours > 0 && hours < 12) {
                this.isPM = false;
            } else if (hours === 12) {
                this.isPM = true;
            } else if (hours > 12 && hours < 24) {
                hours = hours - 12;
                this.isPM = true;
            }

            return hours;
        }
    }

    get minuteValue(): number {
        return this.dateTimeAdapter.getMinutes(this.pickerMoment);
    }

    get secondValue(): number {
        return this.dateTimeAdapter.getSeconds(this.pickerMoment);
    }

    get upHourButtonLabel(): string {
        return this.pickerIntl.upHourLabel;
    }

    get downHourButtonLabel(): string {
        return this.pickerIntl.downHourLabel;
    }

    get upMinuteButtonLabel(): string {
        return this.pickerIntl.upMinuteLabel;
    }

    get downMinuteButtonLabel(): string {
        return this.pickerIntl.downMinuteLabel;
    }

    get upSecondButtonLabel(): string {
        return this.pickerIntl.upSecondLabel;
    }

    get downSecondButtonLabel(): string {
        return this.pickerIntl.downSecondLabel;
    }

    get hour12ButtonLabel(): string {
        return this.isPM ? this.pickerIntl.hour12PMLabel : this.pickerIntl.hour12AMLabel;
    }

    @Output() selectedChange = new EventEmitter<T>();

    @HostBinding('class.owl-dt-timer')
    get owlDTTimerClass(): boolean {
        return true;
    }

    @HostBinding('attr.tabindex')
    get owlDTTimeTabIndex(): number {
        return -1;
    }

    constructor( private ngZone: NgZone,
                 private elmRef: ElementRef,
                 private pickerIntl: OwlDateTimeIntl,
                 private cdRef: ChangeDetectorRef,
                 @Optional() private dateTimeAdapter: DateTimeAdapter<T> ) {
    }

    public ngOnInit() {
    }

    /**
     * Focus to the host element
     * */
    public focus() {
        this.ngZone.runOutsideAngular(() => {
            this.ngZone.onStable.asObservable().pipe(take(1)).subscribe(() => {
                this.elmRef.nativeElement.focus();
            });
        });
    }

    /**
     * Set the hour value via typing into timer box input
     * We need this to handle the hour value when the timer is in hour12 mode
     * */
    public setHourValueViaInput( hours: number ): void {

        if (this.hour12Timer && this.isPM && hours >= 1 && hours <= 11) {
            hours = hours + 12;
        } else if (this.hour12Timer && !this.isPM && hours === 12) {
            hours = 0
        }

        this.setHourValue(hours);
    }

    public setHourValue( hours: number ): void {
        const m = this.dateTimeAdapter.setHours(this.pickerMoment, hours);
        this.selectedChange.emit(m);
        this.cdRef.markForCheck();
    }

    public setMinuteValue( minutes: number ): void {
        const m = this.dateTimeAdapter.setMinutes(this.pickerMoment, minutes);
        this.selectedChange.emit(m);
        this.cdRef.markForCheck();
    }

    public setSecondValue( seconds: number ): void {
        const m = this.dateTimeAdapter.setSeconds(this.pickerMoment, seconds);
        this.selectedChange.emit(m);
        this.cdRef.markForCheck();
    }

    public setMeridiem( event: any ): void {
        this.isPM = !this.isPM;

        let hours = this.hourValue;
        if (this.isPM) {
            hours = hours + 12;
        } else {
            hours = hours - 12;
        }

        if (hours >= 0 && hours <= 23) {
            this.setHourValue(hours);
        }

        this.cdRef.markForCheck();
        event.preventDefault();
    }

    /**
     * Check if the up hour button is enabled
     * @return {boolean}
     * */
    public upHourEnabled(): boolean {
        return !this.maxDateTime || this.compareHours(this.stepHour, this.maxDateTime) < 1;
    }

    /**
     * Check if the down hour button is enabled
     * @return {boolean}
     * */
    public downHourEnabled(): boolean {
        return !this.minDateTime || this.compareHours(-this.stepHour, this.minDateTime) > -1;
    }

    /**
     * Check if the up minute button is enabled
     * @return {boolean}
     * */
    public upMinuteEnabled(): boolean {
        return !this.maxDateTime || this.compareMinutes(this.stepMinute, this.maxDateTime) < 1;
    }

    /**
     * Check if the down minute button is enabled
     * @return {boolean}
     * */
    public downMinuteEnabled(): boolean {
        return !this.minDateTime || this.compareMinutes(-this.stepMinute, this.minDateTime) > -1;
    }

    /**
     * Check if the up second button is enabled
     * @return {boolean}
     * */
    public upSecondEnabled(): boolean {
        return !this.maxDateTime || this.compareSeconds(this.stepSecond, this.maxDateTime) < 1;
    }

    /**
     * Check if the down second button is enabled
     * @return {boolean}
     * */
    public downSecondEnabled(): boolean {
        return !this.minDateTime || this.compareSeconds(-this.stepSecond, this.minDateTime) > -1;
    }

    /**
     * PickerMoment's hour value +/- certain amount and compare it to the give date
     * @param {number} amount
     * @param {Date} comparedDate
     * @return {number}
     * 1 is after the comparedDate
     * -1 is before the comparedDate
     * 0 is equal the comparedDate
     * */
    private compareHours( amount: number, comparedDate: T ): number {
        const hours = this.dateTimeAdapter.getHours(this.pickerMoment) + amount;
        const result = this.dateTimeAdapter.setHours(this.pickerMoment, hours);
        return this.dateTimeAdapter.compare(result, comparedDate);
    }

    /**
     * PickerMoment's minute value +/- certain amount and compare it to the give date
     * @param {number} amount
     * @param {Date} comparedDate
     * @return {number}
     * 1 is after the comparedDate
     * -1 is before the comparedDate
     * 0 is equal the comparedDate
     * */
    private compareMinutes( amount: number, comparedDate: T ): number {
        const minutes = this.dateTimeAdapter.getMinutes(this.pickerMoment) + amount;
        const result = this.dateTimeAdapter.setMinutes(this.pickerMoment, minutes);
        return this.dateTimeAdapter.compare(result, comparedDate);
    }

    /**
     * PickerMoment's second value +/- certain amount and compare it to the give date
     * @param {number} amount
     * @param {Date} comparedDate
     * @return {number}
     * 1 is after the comparedDate
     * -1 is before the comparedDate
     * 0 is equal the comparedDate
     * */
    private compareSeconds( amount: number, comparedDate: T ): number {
        const seconds = this.dateTimeAdapter.getSeconds(this.pickerMoment) + amount;
        const result = this.dateTimeAdapter.setSeconds(this.pickerMoment, seconds);
        return this.dateTimeAdapter.compare(result, comparedDate);
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