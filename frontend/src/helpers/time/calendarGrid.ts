import {addDays, startOfDay} from '@/helpers/time/dateMath'

export interface CalendarCell {
	date: Date
	inMonth: boolean
}

// Always 6 rows so the grid never jumps in height between months.
export function buildMonthGrid(year: number, month: number, weekStart: number): CalendarCell[] {
	const first = new Date(year, month, 1)
	const lead = (first.getDay() - weekStart + 7) % 7
	const gridStart = addDays(first, -lead)

	return Array.from({length: 42}, (_, i) => {
		const date = addDays(gridStart, i)
		return {date, inMonth: date.getMonth() === month}
	})
}

export function weekdayOrder(weekStart: number): number[] {
	return Array.from({length: 7}, (_, i) => (i + weekStart) % 7)
}

// Seven midnights, starting on weekStart (0 = Sunday), that contain `now`.
export function currentWeekDates(now: Date, weekStart: number): Date[] {
	return weekDates(now, weekStart, 0)
}

// `weekOffset` 0 is the week that contains `now`. 1 is the next week.
export function weekDates(now: Date, weekStart: number, weekOffset = 0): Date[] {
	const today = startOfDay(now)
	const lead = (today.getDay() - weekStart + 7) % 7
	const start = addDays(today, -lead + weekOffset * 7)
	return Array.from({length: 7}, (_, index) => addDays(start, index))
}
