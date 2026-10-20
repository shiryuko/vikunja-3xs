import {describe, expect, it} from 'vitest'

import {currentWeekDates} from '@/helpers/time/calendarGrid'
import {weekBarCells, type WeekTaskSource} from './weekTaskBars'

const days = currentWeekDates(new Date(2026, 9, 20, 15, 30), 1)

function at(year: number, month: number, date: number, hours: number) {
	return new Date(year, month, date, hours, 45).toISOString()
}

function task(partial: WeekTaskSource): WeekTaskSource {
	return partial
}

function labels(assigneeId: number, tasks: WeekTaskSource[]) {
	return weekBarCells(days, tasks, assigneeId).map(cell => (
		cell.task
			? {title: cell.task.title, colspan: cell.colspan}
			: {title: '', colspan: cell.colspan}
	))
}

describe('weekBarCells', () => {
	it('spans each assignee by calendar day and ignores the time', () => {
		const tasks = [
			task({
				id: 1,
				title: 'TAREA1',
				start_date: at(2026, 9, 19, 23),
				end_date: at(2026, 9, 20, 1),
				assignees: [{id: 1}],
			}),
			task({
				id: 2,
				title: 'TAREA2',
				start_date: at(2026, 9, 19, 8),
				end_date: at(2026, 9, 20, 18),
				assignees: [{id: 2}],
			}),
			task({
				id: 3,
				title: 'TAREA3',
				start_date: at(2026, 9, 21, 9),
				end_date: at(2026, 9, 21, 17),
				assignees: [{id: 2}],
			}),
		]

		expect(labels(1, tasks)).toEqual([
			{title: 'TAREA1', colspan: 2},
			{title: '', colspan: 1},
			{title: '', colspan: 1},
			{title: '', colspan: 1},
			{title: '', colspan: 1},
			{title: '', colspan: 1},
		])
		expect(labels(2, tasks)).toEqual([
			{title: 'TAREA2', colspan: 2},
			{title: 'TAREA3', colspan: 1},
			{title: '', colspan: 1},
			{title: '', colspan: 1},
			{title: '', colspan: 1},
			{title: '', colspan: 1},
		])
		expect(labels(3, tasks).every(cell => cell.title === '')).toBe(true)
		expect(labels(3, tasks)).toHaveLength(7)
	})

	it('clips a task to the visible week and treats a missing end as one day', () => {
		const tasks = [
			task({
				id: 4,
				title: 'before',
				start_date: at(2026, 9, 17, 10),
				end_date: at(2026, 9, 19, 10),
				assignees: [{id: 1}],
			}),
			task({
				id: 5,
				title: 'only start',
				start_date: at(2026, 9, 23, 22),
				assignees: [{id: 1}],
			}),
			task({
				id: 6,
				title: 'outside',
				start_date: at(2026, 9, 26, 10),
				end_date: at(2026, 9, 27, 10),
				assignees: [{id: 1}],
			}),
			task({
				id: 7,
				title: 'unset',
				start_date: '0001-01-01T00:00:00Z',
				end_date: '0001-01-01T00:00:00Z',
				assignees: [{id: 1}],
			}),
		]

		expect(labels(1, tasks)).toEqual([
			{title: 'before', colspan: 1},
			{title: '', colspan: 1},
			{title: '', colspan: 1},
			{title: '', colspan: 1},
			{title: 'only start', colspan: 1},
			{title: '', colspan: 1},
			{title: '', colspan: 1},
		])
	})

	it('repeats a task on every assignee', () => {
		const tasks = [
			task({
				id: 8,
				title: 'shared',
				start_date: at(2026, 9, 24, 12),
				end_date: at(2026, 9, 25, 12),
				assignees: [{id: 1}, {id: 2}],
			}),
		]

		expect(labels(1, tasks)[5]).toEqual({title: 'shared', colspan: 2})
		expect(labels(2, tasks)[5]).toEqual({title: 'shared', colspan: 2})
	})
})
