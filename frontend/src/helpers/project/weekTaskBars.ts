import {parseDateOrNull} from '@/helpers/parseDateOrNull'
import {isSameDay, startOfDay} from '@/helpers/time/dateMath'

export type WeekTaskSource = {
	id: number,
	title: string,
	start_date?: string | null,
	end_date?: string | null,
	assignees?: Array<{id?: number} | null> | null,
}

export type WeekBarCell = {
	key: string,
	colspan: number,
	startsOn: number,
	task: {
		id: number,
		title: string,
	} | null,
}

type PlacedTask = {
	id: number,
	title: string,
	startIndex: number,
	endIndex: number,
}

function dayRange(task: WeekTaskSource): {start: Date, end: Date} | null {
	const start = parseDateOrNull(task.start_date)
	const end = parseDateOrNull(task.end_date)
	if (!start && !end) {
		return null
	}

	const from = startOfDay(start ?? end!)
	const to = startOfDay(end ?? start!)
	return from.getTime() <= to.getTime()
		? {start: from, end: to}
		: {start: to, end: from}
}

function indexOfDay(days: Date[], date: Date): number {
	return days.findIndex(day => isSameDay(day, date))
}

function placedTasks(days: Date[], tasks: WeekTaskSource[], assigneeId: number): PlacedTask[] {
	const first = startOfDay(days[0]).getTime()
	const last = startOfDay(days[days.length - 1]).getTime()

	return tasks.flatMap(task => {
		const assigned = task.assignees?.some(user => user?.id === assigneeId) ?? false
		const range = dayRange(task)
		if (!assigned || !range) {
			return []
		}

		const from = range.start.getTime()
		const to = range.end.getTime()
		if (to < first || from > last) {
			return []
		}

		const startIndex = indexOfDay(days, from < first ? days[0] : range.start)
		const endIndex = indexOfDay(days, to > last ? days[days.length - 1] : range.end)
		if (startIndex < 0 || endIndex < startIndex) {
			return []
		}

		return [{
			id: task.id,
			title: task.title,
			startIndex,
			endIndex,
		}]
	}).sort((a, b) => a.startIndex - b.startIndex || a.id - b.id)
}

// One cell per empty day, one colspan per task. A later task that would share a
// day starts on the next free day; tasks are not expected to overlap.
export function weekBarCells(days: Date[], tasks: WeekTaskSource[], assigneeId: number): WeekBarCell[] {
	if (days.length === 0) {
		return []
	}

	const cells: WeekBarCell[] = []
	let cursor = 0

	for (const task of placedTasks(days, tasks, assigneeId)) {
		const start = Math.max(task.startIndex, cursor)
		if (start > task.endIndex) {
			continue
		}

		while (cursor < start) {
			cells.push({
				key: `empty-${cursor}`,
				colspan: 1,
				startsOn: cursor,
				task: null,
			})
			cursor++
		}

		cells.push({
			key: `task-${task.id}`,
			colspan: task.endIndex - start + 1,
			startsOn: start,
			task: {id: task.id, title: task.title},
		})
		cursor = task.endIndex + 1
	}

	while (cursor < days.length) {
		cells.push({
			key: `empty-${cursor}`,
			colspan: 1,
			startsOn: cursor,
			task: null,
		})
		cursor++
	}

	return cells
}
