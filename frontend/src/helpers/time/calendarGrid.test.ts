import {describe, expect, it} from 'vitest'
import {buildMonthGrid, currentWeekDates, weekdayOrder} from './calendarGrid'

describe('buildMonthGrid', () => {
	it('starts the grid on the configured week start', () => {
		// November 2022 starts on a Tuesday
		const monday = buildMonthGrid(2022, 10, 1)
		expect(monday[0].date.getDay()).toBe(1)
		expect(monday[0].date.getDate()).toBe(31)

		const sunday = buildMonthGrid(2022, 10, 0)
		expect(sunday[0].date.getDay()).toBe(0)
		expect(sunday[0].date.getDate()).toBe(30)
	})

	it('always yields 42 cells and marks out-of-month days', () => {
		const grid = buildMonthGrid(2024, 1, 1)
		expect(grid).toHaveLength(42)
		expect(grid.filter(c => c.inMonth)).toHaveLength(29)
	})
})

describe('currentWeekDates', () => {
	it('returns the Monday-start week that contains 20 Oct 2026', () => {
		const days = currentWeekDates(new Date(2026, 9, 20, 15, 30), 1)

		expect(days.map(day => day.getDate())).toEqual([19, 20, 21, 22, 23, 24, 25])
		expect(days.every(day => day.getMonth() === 9 && day.getFullYear() === 2026)).toBe(true)
		expect(days[0].getHours()).toBe(0)
	})

	it('shifts the same day back to Sunday when the week starts then', () => {
		const days = currentWeekDates(new Date(2026, 9, 20), 0)

		expect(days.map(day => day.getDate())).toEqual([18, 19, 20, 21, 22, 23, 24])
		expect(days[0].getDay()).toBe(0)
	})
})

describe('weekdayOrder', () => {
	it('rotates so the week start comes first', () => {
		expect(weekdayOrder(1)).toEqual([1, 2, 3, 4, 5, 6, 0])
		expect(weekdayOrder(0)).toEqual([0, 1, 2, 3, 4, 5, 6])
	})
})
